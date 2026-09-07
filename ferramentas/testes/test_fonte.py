"""Os testes criam repositórios git de verdade, localmente.

Nenhum toca a rede: um teste que depende de github.com falha por motivo
errado num avião, e passa a ser ignorado."""

import subprocess

import pytest

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


def test_commit_que_nao_existe_e_recusado(repo, tmp_path):
    origem, _ = repo
    with pytest.raises(Recusado) as erro:
        materializar(str(origem), "b" * 40, tmp_path / "cache")
    assert erro.value.codigo == "commit-ausente"


def test_arquivo_estranho_e_recusado_e_nomeado(repo, tmp_path):
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


def test_o_diretorio_git_nunca_entra(repo, tmp_path):
    origem, commit = repo
    arquivos = materializar(str(origem), commit, tmp_path / "cache")
    assert not any(caminho.startswith(".git") for caminho, _ in arquivos)


def test_buscar_duas_vezes_da_o_mesmo(repo, tmp_path):
    origem, commit = repo
    cache = tmp_path / "cache"
    assert materializar(str(origem), commit, cache) == materializar(str(origem), commit, cache)
