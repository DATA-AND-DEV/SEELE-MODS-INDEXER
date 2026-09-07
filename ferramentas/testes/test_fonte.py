"""Os testes criam repositórios git de verdade, localmente.

Nenhum toca a rede: um teste que depende de github.com falha por motivo
errado num avião, e passa a ser ignorado.

Vários cenários daqui terminam no mesmo código de recusa por caminhos
diferentes — foi assim que três rodadas seguidas escreveram testes que
passavam sem tocar no código que diziam testar. Por isso estes testes não
observam só o veredito: eles **contam** quantos clones aconteceram e quantas
vezes o espelho foi apagado, e afirmam o número exato. Um teste que afirma
«exatamente uma reconstrução» não passa por acidente."""

import subprocess

import pytest

from ferramentas import fonte
from ferramentas.fonte import materializar
from ferramentas.recusa import Recusado


def git(diretorio, *args):
    return subprocess.run(
        ["git", *args], cwd=diretorio, check=True, capture_output=True, text=True
    ).stdout.strip()


@pytest.fixture
def repo(tmp_path):
    """Um repositório com um commit e dois arquivos."""
    origem = tmp_path / "origem"
    (origem / "cliente").mkdir(parents=True)
    (origem / "mod.json").write_text('{"schema":1}', encoding="utf-8")
    (origem / "cliente" / "main.js").write_text("// oi\n", encoding="utf-8")
    git(origem, "init", "-q", "-b", "principal")
    git(origem, "config", "user.email", "teste@exemplo")
    git(origem, "config", "user.name", "Teste")
    git(origem, "add", "-A")
    git(origem, "commit", "-q", "-m", "primeiro")
    return origem, git(origem, "rev-parse", "HEAD")


class Contagem:
    """Quantos clones e quantas reconstruções de espelho aconteceram.

    O código de recusa sozinho não distingue os caminhos: `commit-ausente`
    sai igual de um cache quente reconstruído e de um cache frio que nunca
    reconstruiu nada. O número é o que separa os dois."""

    def __init__(self):
        self.clones = 0
        self.reconstrucoes = 0

    def zerar(self):
        self.clones = 0
        self.reconstrucoes = 0


@pytest.fixture
def contagem(monkeypatch):
    contas = Contagem()
    rodar_git_real = fonte._rodar_git
    rmtree_real = fonte.shutil.rmtree

    def rodar_git(diretorio, *args, **kwargs):
        if args and args[0] == "clone":
            contas.clones += 1
        return rodar_git_real(diretorio, *args, **kwargs)

    def rmtree(caminho, *args, **kwargs):
        contas.reconstrucoes += 1
        return rmtree_real(caminho, *args, **kwargs)

    monkeypatch.setattr(fonte, "_rodar_git", rodar_git)
    monkeypatch.setattr(fonte.shutil, "rmtree", rmtree)
    return contas


def espelho_de(origem, cache):
    return fonte._caminho_do_espelho(str(origem), cache)


def apagar_objeto(espelho, sha):
    """Apaga do disco um objeto solto do espelho, deixando as refs como estavam."""
    objeto = espelho / "objects" / sha[:2] / sha[2:]
    assert objeto.exists(), f"o clone não deixou {objeto} solto"
    objeto.unlink()


def estragar_o_config(espelho):
    """Deixa o espelho com um `config` que o git não consegue ler.

    Esta corrupção derruba já o `fetch`, antes de qualquer pergunta sobre o
    commit — é o caso que ficava sem conserto quando a reconstrução cobria
    só a leitura dos arquivos."""
    (espelho / "config").write_text("lixo\n[[[\n", encoding="utf-8")


# --- 1 e 2: o caminho feliz, e o preço dele em clones -----------------------


def test_cache_quente_nao_reconstroi_nem_clona(repo, tmp_path, contagem):
    origem, commit = repo
    cache = tmp_path / "cache"
    materializar(str(origem), commit, cache)
    contagem.zerar()

    arquivos = materializar(str(origem), commit, cache)

    assert len(arquivos) == 2
    assert contagem.clones == 0, "cache quente reaproveita o espelho, não clona"
    assert contagem.reconstrucoes == 0, "nada falhou, então nada é apagado"


def test_cache_frio_clona_uma_vez_e_nao_reconstroi(repo, tmp_path, contagem):
    origem, commit = repo

    arquivos = materializar(str(origem), commit, tmp_path / "cache")

    assert len(arquivos) == 2
    assert contagem.clones == 1
    assert contagem.reconstrucoes == 0, "um clone novo que deu certo não se reconstrói"


# --- 3 e 4: as duas corrupções, consertadas pela mesma regra ----------------


def test_objeto_do_commit_apagado_e_curado_pelo_proprio_fetch(repo, tmp_path, contagem):
    # Medido: apagar o objeto solto do commit não chega à reconstrução, porque
    # o `fetch` sobre uma origem saudável repõe o objeto sozinho — a ref local
    # aponta para ele, e o git o traz de volta antes de qualquer pergunta.
    #
    # Este teste existe para registrar isso. Ele é o contraexemplo das rodadas
    # anteriores: era com esta corrupção que se afirmava provar a reconstrução,
    # e ela nunca acontecia. Por isso a asserção aqui é «zero», e quem quiser
    # exercitar o conserto usa a corrupção do teste seguinte.
    origem, commit = repo
    cache = tmp_path / "cache"
    esperado = materializar(str(origem), commit, cache)
    apagar_objeto(espelho_de(origem, cache), commit)
    contagem.zerar()

    assert materializar(str(origem), commit, cache) == esperado
    assert contagem.reconstrucoes == 0, "quem consertou foi o fetch, não a reconstrução"


def test_objeto_de_conteudo_apagado_com_origem_saudavel_se_cura(repo, tmp_path, contagem):
    # Apagar o blob de um arquivo é a corrupção que o `fetch` não repõe: as
    # refs continuam válidas, então não há o que negociar, e a falha só
    # aparece na hora de ler os bytes. Aqui o conserto só pode vir da
    # reconstrução — e ela custa exatamente uma.
    origem, commit = repo
    cache = tmp_path / "cache"
    esperado = materializar(str(origem), commit, cache)
    blob = git(origem, "rev-parse", f"{commit}:mod.json")
    apagar_objeto(espelho_de(origem, cache), blob)
    contagem.zerar()

    assert materializar(str(origem), commit, cache) == esperado
    assert contagem.reconstrucoes == 1, "uma reconstrução, e ela resolveu"
    assert contagem.clones == 1, "e o clone novo é quem entregou os bytes"


def test_config_malformado_com_origem_saudavel_se_cura(repo, tmp_path, contagem):
    # Falha no `fetch`, antes de qualquer pergunta sobre o commit — e a origem
    # está perfeita. Enquanto a reconstrução cobria só a leitura, este caso
    # virava `git-falhou` sem ninguém ter tentado o conserto que existia.
    origem, commit = repo
    cache = tmp_path / "cache"
    esperado = materializar(str(origem), commit, cache)
    estragar_o_config(espelho_de(origem, cache))
    contagem.zerar()

    assert materializar(str(origem), commit, cache) == esperado
    assert contagem.reconstrucoes == 1


# --- 5 e 6: o commit que de fato não existe, quente e frio ------------------


def test_commit_ausente_com_cache_quente_reconstroi_uma_vez(repo, tmp_path, contagem):
    # O veredito `commit-ausente` só vale porque veio de um clone novo, que
    # não pode estar corrompido de antes. A reconstrução é o que compra a
    # certeza, então ela tem que ter acontecido.
    origem, commit = repo
    cache = tmp_path / "cache"
    materializar(str(origem), commit, cache)
    contagem.zerar()

    with pytest.raises(Recusado) as erro:
        materializar(str(origem), "b" * 40, cache)

    assert erro.value.codigo == "commit-ausente"
    assert contagem.reconstrucoes == 1


def test_commit_ausente_com_cache_frio_nao_reconstroi(repo, tmp_path, contagem):
    # O espelho já nasceu novo nesta chamada: não há passado para desfazer, e
    # reconstruir seria repetir o mesmo clone. Nenhuma execução paga duas.
    origem, _ = repo

    with pytest.raises(Recusado) as erro:
        materializar(str(origem), "b" * 40, tmp_path / "cache")

    assert erro.value.codigo == "commit-ausente"
    assert contagem.clones == 1
    assert contagem.reconstrucoes == 0


# --- 7: quando nem o conserto conserta --------------------------------------


def test_espelho_corrompido_e_origem_sumida_da_git_falhou(repo, tmp_path, contagem):
    # A reconstrução acontece e falha: sem a origem, o clone novo não sai. A
    # contagem é essencial aqui — sem ela, este teste passaria mesmo se a
    # reconstrução não existisse, porque o `fetch` comum já daria git-falhou.
    origem, commit = repo
    cache = tmp_path / "cache"
    materializar(str(origem), commit, cache)
    estragar_o_config(espelho_de(origem, cache))
    # Renomear, e não apagar, para não somar um rmtree à contagem.
    origem.rename(tmp_path / "origem-sumiu")
    contagem.zerar()

    with pytest.raises(Recusado) as erro:
        materializar(str(origem), commit, cache)

    assert erro.value.codigo == "git-falhou"
    assert contagem.reconstrucoes == 1, "a reconstrução foi tentada"
    assert contagem.clones == 1, "e foi ela quem falhou, no clone"


# --- 8: a armadilha que a tarefa existe para fechar --------------------------


def test_arquivo_estranho_e_recusado_e_nomeado(repo, tmp_path, contagem):
    origem, _ = repo
    (origem / ".DS_Store").write_bytes(b"\x00lixo")
    git(origem, "add", "-A")
    git(origem, "commit", "-q", "-m", "com lixo")
    commit = git(origem, "rev-parse", "HEAD")

    with pytest.raises(Recusado) as erro:
        materializar(str(origem), commit, tmp_path / "cache")

    assert erro.value.codigo == "arquivo-estranho"
    # Nomear o arquivo é o que transforma a recusa em conserto.
    assert ".DS_Store" in erro.value.detalhe
    assert contagem.reconstrucoes == 0, "o espelho já era novo: nada a reconstruir"


# --- o resto do contrato ----------------------------------------------------


def test_traz_os_arquivos_do_commit(repo, tmp_path):
    origem, commit = repo
    arquivos = materializar(str(origem), commit, tmp_path / "cache")
    assert sorted(caminho for caminho, _ in arquivos) == ["cliente/main.js", "mod.json"]
    assert dict(arquivos)["mod.json"] == b'{"schema":1}'


def test_o_caminho_usa_barra_e_nao_contrabarra(repo, tmp_path):
    # O hash trabalha sobre o caminho como texto; uma contrabarra no Windows
    # produziria outro número para os mesmos bytes.
    origem, commit = repo
    arquivos = materializar(str(origem), commit, tmp_path / "cache")
    assert all("\\" not in caminho for caminho, _ in arquivos)


def test_o_diretorio_git_nunca_entra(repo, tmp_path):
    origem, commit = repo
    arquivos = materializar(str(origem), commit, tmp_path / "cache")
    assert not any(caminho.startswith(".git") for caminho, _ in arquivos)


def test_buscar_duas_vezes_da_o_mesmo(repo, tmp_path):
    origem, commit = repo
    cache = tmp_path / "cache"
    assert materializar(str(origem), commit, cache) == materializar(str(origem), commit, cache)


def test_cache_que_e_arquivo_da_git_falhou(repo, tmp_path, contagem):
    # O cache não pôde nem ser criado, então não há espelho nenhum: a recusa
    # sai antes de qualquer git, e sem reconstrução.
    origem, commit = repo
    cache = tmp_path / "cache"
    cache.write_text("lixo")

    with pytest.raises(Recusado) as erro:
        materializar(str(origem), commit, cache)

    assert erro.value.codigo == "git-falhou"
    assert contagem.clones == 0
    assert contagem.reconstrucoes == 0
