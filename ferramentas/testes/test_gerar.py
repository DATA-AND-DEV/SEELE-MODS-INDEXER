import json
import shutil
import subprocess
from pathlib import Path

import pytest

from ferramentas.gerar import gerar
from ferramentas.recusa import Recusado

pytestmark = pytest.mark.skipif(shutil.which("minisign") is None, reason="minisign não instalado")

MOD_JSON = json.dumps(
    {
        "schema": 1, "id": "juli/cinza-frio", "version": "2.1.0", "api": 3,
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


def _autor_do_toml(raiz):
    """O caminho do repositório do autor, lido de volta do TOML da avaliação."""
    toml = raiz / "avaliacoes" / "juli" / "cinza-frio.toml"
    repo = [l for l in toml.read_text(encoding="utf-8").splitlines() if l.startswith("repo")][0]
    return Path(repo.split('"')[1])


def _instantaneo(publicado):
    """Todo arquivo sob `publicado/`, caminho relativo → bytes.

    É a comparação byte a byte que prova atomicidade: qualquer arquivo a
    mais, a menos, ou com um byte trocado aparece aqui."""
    return {
        str(p.relative_to(publicado)): p.read_bytes()
        for p in publicado.rglob("*")
        if p.is_file()
    }


def test_execucao_que_falha_no_meio_nao_altera_publicado(mundo, tmp_path):
    # A estufa é onde a montagem nova acontece; só a troca no fim decide se
    # ela vira publicado/. Sem um segundo MOD *novo e válido* no meio do
    # caminho, uma escrita direta em publicado/ reescreveria o de sempre com
    # os mesmos bytes e o teste passaria mesmo sem estufa nenhuma — por isso
    # o mod novo entra em ordem alfabética antes do quebrado: ele é o que
    # provaria vazar se a troca não fosse atômica.
    raiz, secreta, _ = mundo
    gerar(raiz, secreta, agora=1757100000)
    publicado = raiz / "publicado"
    antes = _instantaneo(publicado)

    novo_autor = tmp_path / "repo-do-novo-autor"
    (novo_autor / "cliente").mkdir(parents=True)
    novo_mod_json = json.dumps(
        {
            "schema": 1, "id": "juli/novo-mod", "version": "1.0.0", "api": 3,
            "repo": "https://github.com/juli/seele-novo-mod",
            "reach": ["algo novo"],
            "client": "cliente/main.js",
        }
    )
    (novo_autor / "mod.json").write_text(novo_mod_json, encoding="utf-8")
    (novo_autor / "cliente" / "main.js").write_text("// novo\n", encoding="utf-8")
    git(novo_autor, "init", "-q", "-b", "principal")
    git(novo_autor, "config", "user.email", "a@b")
    git(novo_autor, "config", "user.name", "A")
    git(novo_autor, "add", "-A")
    git(novo_autor, "commit", "-q", "-m", "primeiro")
    commit_novo = git(novo_autor, "rev-parse", "HEAD")

    (raiz / "avaliacoes" / "juli" / "novo-mod.toml").write_text(
        f"""
id = "juli/novo-mod"
repo = "{novo_autor}"
titulo = "Novo Mod"
resumo = "Um MOD novo, que seria escrito antes da falha."

[[versoes]]
versao = "1.0.0"
commit = "{commit_novo}"
nivel = "verificado"
notas = []
avaliado_em = 1757000000
""",
        encoding="utf-8",
    )

    autor = _autor_do_toml(raiz)
    (raiz / "avaliacoes" / "juli" / "quebrado.toml").write_text(
        f"""
id = "juli/quebrado"
repo = "{autor}"
titulo = "Quebrado"
resumo = "Aponta para um commit que não existe."

[[versoes]]
versao = "1.0.0"
commit = "0000000000000000000000000000000000000000"
nivel = "verificado"
notas = []
avaliado_em = 1757000000
""",
        encoding="utf-8",
    )

    with pytest.raises(Recusado):
        gerar(raiz, secreta, agora=1757200000)

    # "juli/novo-mod" ordena antes de "juli/quebrado" — se a montagem
    # escrevesse direto em publicado/ em vez de numa estufa, os arquivos do
    # MOD novo apareceriam aqui mesmo com a execução tendo falhado depois.
    assert _instantaneo(publicado) == antes


def test_cache_do_par_diferente_e_recusado(mundo):
    # O guarda contra a falha que a documentação chama de mais difícil de
    # diagnosticar do desenho inteiro: um catálogo novo com uma assinatura
    # velha em cache porque os dois têm janelas de cache diferentes.
    raiz, secreta, _ = mundo
    (raiz / "site" / "_headers").write_text(
        """/catalogo.json
  Cache-Control: public, max-age=300

/catalogo.json.minisig
  Cache-Control: public, max-age=60
""",
        encoding="utf-8",
    )

    with pytest.raises(Recusado) as erro:
        gerar(raiz, secreta, agora=1757100000)
    assert erro.value.codigo == "cache-do-par-difere"


def test_par_sem_regra_de_cache_nenhuma_e_recusado(mundo):
    # O `_headers` sem os blocos das revogações: os dois arquivos ficariam
    # com o cache padrão da Cloudflare, que ninguém escolheu e que não é o
    # mesmo para `.json` e `.minisig`. É o caso que passava calado, porque
    # a comparação era entre duas ausências.
    raiz, secreta, _ = mundo
    (raiz / "site" / "_headers").write_text(
        """/catalogo.json
  Cache-Control: public, max-age=300

/catalogo.json.minisig
  Cache-Control: public, max-age=300
""",
        encoding="utf-8",
    )

    with pytest.raises(Recusado) as erro:
        gerar(raiz, secreta, agora=1757100000)
    assert erro.value.codigo == "cache-do-par-ausente"
    assert "/revogacoes.json" in erro.value.detalhe


def test_id_do_manifesto_diverge_da_avaliacao_e_recusado(mundo):
    raiz, secreta, _ = mundo
    autor = _autor_do_toml(raiz)
    divergente = json.dumps({**json.loads(MOD_JSON), "id": "outro/nome"})
    (autor / "mod.json").write_text(divergente, encoding="utf-8")
    git(autor, "add", "-A")
    git(autor, "commit", "-q", "-m", "id divergente")
    novo = git(autor, "rev-parse", "HEAD")

    toml = raiz / "avaliacoes" / "juli" / "cinza-frio.toml"
    antigo = [l for l in toml.read_text(encoding="utf-8").splitlines() if l.startswith("commit")][0]
    toml.write_text(
        toml.read_text(encoding="utf-8").replace(antigo, f'commit = "{novo}"'), encoding="utf-8"
    )

    with pytest.raises(Recusado) as erro:
        gerar(raiz, secreta, agora=1757100000)
    assert erro.value.codigo == "id-nao-bate-com-o-manifesto"


def test_version_do_manifesto_diverge_da_avaliacao_e_recusado(mundo):
    raiz, secreta, _ = mundo
    autor = _autor_do_toml(raiz)
    divergente = json.dumps({**json.loads(MOD_JSON), "version": "9.9.9"})
    (autor / "mod.json").write_text(divergente, encoding="utf-8")
    git(autor, "add", "-A")
    git(autor, "commit", "-q", "-m", "version divergente")
    novo = git(autor, "rev-parse", "HEAD")

    toml = raiz / "avaliacoes" / "juli" / "cinza-frio.toml"
    antigo = [l for l in toml.read_text(encoding="utf-8").splitlines() if l.startswith("commit")][0]
    toml.write_text(
        toml.read_text(encoding="utf-8").replace(antigo, f'commit = "{novo}"'), encoding="utf-8"
    )

    with pytest.raises(Recusado) as erro:
        gerar(raiz, secreta, agora=1757100000)
    assert erro.value.codigo == "versao-nao-bate-com-o-manifesto"


def _segunda_versao(raiz, numero="2.2.0"):
    """Um segundo commit no repositório do autor, e o `mod.json` dele."""
    autor = raiz.parent / "repo-do-autor"
    (autor / "mod.json").write_text(
        json.dumps(
            {
                "schema": 1, "id": "juli/cinza-frio", "version": numero, "api": 3,
                "repo": "https://github.com/juli/seele-cinza-frio",
                "reach": ["trocar as cores da interface"],
                "client": "cliente/main.js",
            }
        ),
        encoding="utf-8",
    )
    (autor / "cliente" / "main.js").write_text("// cinza, de novo\n", encoding="utf-8")
    git(autor, "add", "-A")
    git(autor, "commit", "-q", "-m", numero)
    return git(autor, "rev-parse", "HEAD")


def _catalogo_de_duas_versoes(mundo):
    """Duas versões do mesmo MOD com vereditos DIFERENTES, ponta a ponta.

    Vereditos diferentes de propósito: com os dois iguais, publicar o nível do
    MOD dentro de cada versão passaria por este teste sem ser notado."""
    raiz, secreta, commit = mundo
    novo = _segunda_versao(raiz)
    (raiz / "avaliacoes" / "juli" / "cinza-frio.toml").write_text(
        f"""
id = "juli/cinza-frio"
repo = "{raiz.parent / "repo-do-autor"}"
titulo = "Cinza Frio"
resumo = "Contraste alto."

[[versoes]]
versao = "2.1.0"
commit = "{commit}"
nivel = "com-notas"
notas = ["fala-com-terceiro"]
avaliado_em = 1757000000

[[versoes]]
versao = "2.2.0"
commit = "{novo}"
nivel = "oficial"
notas = []
avaliado_em = 1757000900
""",
        encoding="utf-8",
    )
    gerar(raiz, secreta, agora=1757100000)
    catalogo = json.loads((raiz / "publicado" / "catalogo.json").read_text(encoding="utf-8"))
    mod = catalogo["mods"][0]
    return mod, {v["versao"]: v for v in mod["versoes"]}, commit, novo


def test_o_catalogo_publicado_traz_a_avaliacao_de_cada_versao(mundo):
    mod, versoes, commit, novo = _catalogo_de_duas_versoes(mundo)

    assert versoes["2.1.0"]["nivel"] == "com-notas"
    assert versoes["2.1.0"]["notas"] == ["fala-com-terceiro"]
    assert versoes["2.1.0"]["commit"] == commit

    assert versoes["2.2.0"]["nivel"] == "oficial"
    assert versoes["2.2.0"]["notas"] == []
    assert versoes["2.2.0"]["commit"] == novo

    # E o MOD continua descrevendo a avaliação mais recente, como sempre
    # descreveu: quem já lê estes campos não muda de leitura por causa disto.
    assert mod["nivel"] == "oficial"
    assert mod["commit"] == novo
    assert mod["notas"] == []


def test_a_versao_antiga_publicada_nao_recebe_a_avaliacao_da_nova(mundo):
    # O guarda contra a mistura no arquivo que de fato é assinado e servido.
    _, versoes, _, _ = _catalogo_de_duas_versoes(mundo)
    antiga, nova = versoes["2.1.0"], versoes["2.2.0"]
    assert antiga["nivel"] != nova["nivel"]
    assert antiga["notas"] != nova["notas"]
    assert antiga["commit"] != nova["commit"]
    assert antiga["hash"] != nova["hash"]


def _mudar_api_do_fixture(mundo, api):
    raiz, _, _ = mundo
    autor = raiz.parent / 'repo-do-autor'
    manifesto = json.loads((autor / 'mod.json').read_text())
    manifesto['api'] = api
    (autor / 'mod.json').write_text(json.dumps(manifesto))
    git(autor, 'add', '-A')
    git(autor, 'commit', '-q', '-m', 'API do fixture')
    commit = git(autor, 'rev-parse', 'HEAD')
    avaliacao = raiz / 'avaliacoes/juli/cinza-frio.toml'
    import re
    avaliacao.write_text(re.sub(r'commit = "[^"]+"', f'commit = "{commit}"', avaliacao.read_text()))
    return autor, avaliacao


def test_pacote_novo_na_api_retirada_nao_entra_no_catalogo(mundo):
    raiz, secreta, _ = mundo
    _mudar_api_do_fixture(mundo, 2)
    with pytest.raises(Recusado) as erro:
        gerar(raiz, secreta, agora=1757100000)
    assert erro.value.codigo == 'api-too-old'
    assert not (raiz / 'publicado').exists()


def test_api3_preserva_bytes_do_historico_sem_admitir_substituicao(mundo, monkeypatch):
    from ferramentas import manifesto
    raiz, secreta, _ = mundo
    autor, avaliacao = _mudar_api_do_fixture(mundo, 2)
    # Produz o catálogo anterior com o mesmo gerador configurado na API anterior.
    #
    # **Os dois, e não só o teto.** Desde a API 4 o gerador executa um conjunto
    # (`APIS_ACEITAS`) e não um número: patchar só `VERSAO_DA_API` deixaria a
    # conferência de verdade olhando o conjunto de hoje, e o gerador «na API 2»
    # recusaria o próprio fixture de API 2.
    monkeypatch.setattr(manifesto, 'VERSAO_DA_API', 2)
    monkeypatch.setattr(manifesto, 'APIS_ACEITAS', (2,))
    gerar(raiz, secreta, agora=1757100000)
    anterior = json.loads((raiz / 'publicado/catalogo.json').read_text())
    bytes_antes = (raiz / 'publicado/mods/juli/cinza-frio/2.1.0/mod.json').read_bytes()
    monkeypatch.setattr(manifesto, 'VERSAO_DA_API', 3)
    monkeypatch.setattr(manifesto, 'APIS_ACEITAS', (3,))
    gerar(raiz, secreta, agora=1757100100)
    atual = json.loads((raiz / 'publicado/catalogo.json').read_text())
    # O catálogo agora lê a constante pelo módulo, então o `monkeypatch` a
    # alcança — e este número deixa de ser uma asserção que passava sem medir
    # nada. Ver o comentário em `catalogo.py`.
    assert atual['api_oferecida'] == 3
    assert atual['apis_aceitas'] == [3]
    assert atual['mods'] == anterior['mods']
    assert (raiz / 'publicado/mods/juli/cinza-frio/2.1.0/mod.json').read_bytes() == bytes_antes
    # Mesmo ID/versão com outros bytes não ganha a exceção de histórico.
    (autor / 'cliente/main.js').write_text('// bytes diferentes')
    git(autor, 'add', '-A')
    git(autor, 'commit', '-q', '-m', 'Tentativa de substituir histórico')
    import re
    avaliacao.write_text(re.sub(r'commit = "[^"]+"', f'commit = "{git(autor, "rev-parse", "HEAD")}"', avaliacao.read_text()))
    with pytest.raises(Recusado) as erro:
        gerar(raiz, secreta, agora=1757100200)
    assert erro.value.codigo == 'api-too-old'
    assert json.loads((raiz / 'publicado/catalogo.json').read_text()) == atual
