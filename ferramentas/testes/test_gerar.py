import json
import shutil
import subprocess

import pytest

from ferramentas.gerar import gerar
from ferramentas.recusa import Recusado

pytestmark = pytest.mark.skipif(shutil.which("minisign") is None, reason="minisign não instalado")

MOD_JSON = json.dumps(
    {
        "schema": 1, "id": "juli/cinza-frio", "version": "2.1.0", "api": 1,
        "repo": "https://github.com/juli/seele-cinza-frio",
        "reach": ["trocar as cores da interface"],
        "client": "cliente/main.js",
    }
)


def git(diretorio, *args):
    return subprocess.run(
        ["git", *args], cwd=diretorio, check=True, capture_output=True, text=True
    ).stdout.strip()


@pytest.fixture
def mundo(tmp_path):
    """Uma raiz de indexador completa, com um repositório de autor local."""
    autor = tmp_path / "repo-do-autor"
    (autor / "cliente").mkdir(parents=True)
    (autor / "mod.json").write_text(MOD_JSON, encoding="utf-8")
    (autor / "cliente" / "main.js").write_text("// cinza\n", encoding="utf-8")
    git(autor, "init", "-q", "-b", "principal")
    git(autor, "config", "user.email", "a@b")
    git(autor, "config", "user.name", "A")
    git(autor, "add", "-A")
    git(autor, "commit", "-q", "-m", "primeiro")
    commit = git(autor, "rev-parse", "HEAD")

    raiz = tmp_path / "indexador"
    (raiz / "avaliacoes" / "juli").mkdir(parents=True)
    (raiz / "avaliacoes" / "juli" / "cinza-frio.toml").write_text(
        f"""
id = "juli/cinza-frio"
repo = "{autor}"
titulo = "Cinza Frio"
resumo = "Contraste alto."

[[versoes]]
versao = "2.1.0"
commit = "{commit}"
nivel = "verificado"
notas = []
avaliado_em = 1757000000
""",
        encoding="utf-8",
    )
    (raiz / "revogacoes.toml").write_text("", encoding="utf-8")

    projeto = __import__("pathlib").Path(__file__).resolve().parents[2]
    shutil.copy(projeto / "listas.json", raiz / "listas.json")
    shutil.copytree(projeto / "site", raiz / "site")

    chaves = raiz / "chaves"
    chaves.mkdir()
    secreta = tmp_path / "t.key"
    subprocess.run(
        ["minisign", "-G", "-f", "-p", str(chaves / "mods.pub"), "-s", str(secreta)],
        input="\n\n", text=True, check=True, capture_output=True,
    )
    return raiz, secreta, commit


def test_escreve_o_catalogo_assinado(mundo):
    raiz, secreta, _ = mundo
    gerar(raiz, secreta, agora=1757100000)

    publicado = raiz / "publicado"
    assert (publicado / "catalogo.json").is_file()
    assert (publicado / "catalogo.json.minisig").is_file()
    assert (publicado / "revogacoes.json").is_file()
    assert (publicado / "revogacoes.json.minisig").is_file()
    assert (publicado / "chave.pub").is_file()
    assert (publicado / "_headers").is_file()


def test_a_assinatura_confere_com_a_chave_publica(mundo):
    raiz, secreta, _ = mundo
    gerar(raiz, secreta, agora=1757100000)
    publicado = raiz / "publicado"
    pronto = subprocess.run(
        ["minisign", "-V", "-p", str(publicado / "chave.pub"), "-m", str(publicado / "catalogo.json")],
        capture_output=True, text=True,
    )
    assert pronto.returncode == 0, pronto.stderr


def test_os_arquivos_do_mod_saem_no_caminho_com_a_versao(mundo):
    raiz, secreta, _ = mundo
    gerar(raiz, secreta, agora=1757100000)
    base = raiz / "publicado" / "mods" / "juli" / "cinza-frio" / "2.1.0"
    assert (base / "mod.json").read_text(encoding="utf-8") == MOD_JSON
    assert (base / "cliente" / "main.js").is_file()


def test_o_hash_do_catalogo_bate_com_os_bytes_servidos(mundo):
    # É a conferência que o cliente faz no passo 6. Se ela falhar aqui, ela
    # falha lá — e lá a mensagem diz «adulterado».
    from ferramentas.hash_conteudo import conteudo

    raiz, secreta, _ = mundo
    gerar(raiz, secreta, agora=1757100000)
    catalogo = json.loads((raiz / "publicado" / "catalogo.json").read_text(encoding="utf-8"))
    versao = catalogo["mods"][0]["versoes"][0]
    base = raiz / "publicado" / "mods" / "juli" / "cinza-frio" / "2.1.0"
    arquivos = [(caminho, (base / caminho).read_bytes()) for caminho in versao["arquivos"]]
    assert conteudo(arquivos) == versao["hash"]


def test_alcanca_vem_do_reach_do_manifesto(mundo):
    raiz, secreta, _ = mundo
    gerar(raiz, secreta, agora=1757100000)
    catalogo = json.loads((raiz / "publicado" / "catalogo.json").read_text(encoding="utf-8"))
    assert catalogo["mods"][0]["versoes"][0]["alcanca"] == ["trocar as cores da interface"]


def test_o_site_e_copiado_para_publicado(mundo):
    raiz, secreta, _ = mundo
    gerar(raiz, secreta, agora=1757100000)
    assert (raiz / "publicado" / "index.html").is_file()
    assert (raiz / "publicado" / "app.js").is_file()


def test_os_testes_do_site_nao_vao_para_publicado(mundo):
    # Um teste servido em produção é código que ninguém revisa como código
    # servido — e conta contra o teto de 20 000 arquivos do Pages.
    raiz, secreta, _ = mundo
    gerar(raiz, secreta, agora=1757100000)
    assert not (raiz / "publicado" / "testes").exists()


def test_a_chave_privada_nunca_vai_para_publicado(mundo):
    raiz, secreta, _ = mundo
    gerar(raiz, secreta, agora=1757100000)
    assert not list((raiz / "publicado").rglob("*.key"))


def test_rodar_duas_vezes_passa_no_append_only(mundo):
    raiz, secreta, _ = mundo
    gerar(raiz, secreta, agora=1757100000)
    gerar(raiz, secreta, agora=1757200000)


def test_trocar_o_commit_de_uma_versao_publicada_e_recusado(mundo):
    # Se o hash mudasse, «o MOD que você baixou é o MOD que revisamos»
    # deixaria de valer sem nada avisar.
    raiz, secreta, _ = mundo
    gerar(raiz, secreta, agora=1757100000)

    toml = raiz / "avaliacoes" / "juli" / "cinza-frio.toml"
    repo = [l for l in toml.read_text(encoding="utf-8").splitlines() if l.startswith("repo")][0]
    autor = repo.split('"')[1]
    (__import__("pathlib").Path(autor) / "cliente" / "main.js").write_text("// outro\n", encoding="utf-8")
    git(autor, "add", "-A")
    git(autor, "commit", "-q", "-m", "segundo")
    novo = git(autor, "rev-parse", "HEAD")

    antigo = [l for l in toml.read_text(encoding="utf-8").splitlines() if l.startswith("commit")][0]
    toml.write_text(
        toml.read_text(encoding="utf-8").replace(antigo, f'commit = "{novo}"'), encoding="utf-8"
    )

    with pytest.raises(Recusado) as erro:
        gerar(raiz, secreta, agora=1757200000)
    assert erro.value.codigo == "versao-editada"
