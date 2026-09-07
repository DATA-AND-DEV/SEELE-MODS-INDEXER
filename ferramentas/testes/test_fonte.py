"""Os testes criam repositórios git de verdade, localmente.

Nenhum toca a rede: um teste que depende de github.com falha por motivo
errado num avião, e passa a ser ignorado."""

import os
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


def test_mkdir_falho_da_git_falhou(repo, tmp_path):
    # O mkdir falha quando cache já é um arquivo; deve vir como git-falhou.
    # Testa o caminho estrutural: erro ao preparar o ambiente.
    origem, commit = repo
    cache = tmp_path / "cache"
    cache.write_text("lixo")
    with pytest.raises(Recusado) as erro:
        materializar(str(origem), commit, cache)
    assert erro.value.codigo == "git-falhou"


def test_espelho_corrompido_no_cache_origem_saudavel_consegue_se_recuperar(repo, tmp_path):
    # Espelho corrompido no cache, mas origem saudável — deve SUCEDER
    # após re-clone. Este é o teste que prova que a estratégia de
    # re-clonar funciona: corrupção recuperável não é erro final.
    origem, commit = repo
    cache = tmp_path / "cache"

    # Primeira chamada: clona o espelho e busca os arquivos — funciona.
    arquivos_ok = materializar(str(origem), commit, cache)
    assert len(arquivos_ok) > 0
    primeiro_result = arquivos_ok

    # Corromper o espelho: apagar um objeto solto.
    espelho_dir = cache / (str(origem).rstrip("/").replace("/", "_").replace(":", "_") + ".git")
    objetos_dir = espelho_dir / "objects"
    assert objetos_dir.exists()

    apagados = 0
    for obj_file in objetos_dir.rglob("*"):
        if obj_file.is_file():
            obj_file.unlink()
            apagados += 1
            break  # Apagar só um
    assert apagados > 0, "não conseguiu apagar nenhum objeto"

    # Segunda chamada: espelho está corrompido, mas origem saudável.
    # A implementação deve re-clonar e conseguir os arquivos.
    arquivos_recuperados = materializar(str(origem), commit, cache)
    assert len(arquivos_recuperados) > 0
    # Confirma que são os mesmos arquivos (conteúdo idêntico).
    assert arquivos_recuperados == primeiro_result


def test_commit_genuinamente_ausente_e_recusado(repo, tmp_path):
    # Commit que nunca existiu (SHA aleatório) levanta commit-ausente.
    # Prova que a segunda tentativa com re-clone não entra em laço.
    origem, _ = repo
    with pytest.raises(Recusado) as erro:
        materializar(str(origem), "b" * 40, tmp_path / "cache")
    assert erro.value.codigo == "commit-ausente"


def test_origem_indisponivel_e_espelho_corrompido_da_git_falhou(repo, tmp_path):
    # Origem indisponível (removida) + espelho corrompido no cache
    # deve dar git-falhou: re-clone falha porque origem não existe.
    origem, commit = repo
    cache = tmp_path / "cache"

    # Primeira chamada: clona o espelho e busca os arquivos — funciona.
    arquivos_ok = materializar(str(origem), commit, cache)
    assert len(arquivos_ok) > 0

    # Corromper o espelho.
    espelho_dir = cache / (str(origem).rstrip("/").replace("/", "_").replace(":", "_") + ".git")
    objetos_dir = espelho_dir / "objects"
    apagados = 0
    for obj_file in objetos_dir.rglob("*"):
        if obj_file.is_file():
            obj_file.unlink()
            apagados += 1
            break
    assert apagados > 0

    # Remover origem para que re-clone falhe.
    import shutil
    shutil.rmtree(origem)

    # Segunda chamada: espelho corrompido, origem removida, re-clone falha.
    with pytest.raises(Recusado) as erro:
        materializar(str(origem), commit, cache)
    assert erro.value.codigo == "git-falhou"
