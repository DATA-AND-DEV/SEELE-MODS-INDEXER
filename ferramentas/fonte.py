"""Os bytes de uma versão, tirados do commit que a avaliação fixou.

É a única dependência de rede do desenho, e ela é de build e não de runtime:
roda na máquina de quem publica, nunca na de quem usa. Um repositório que
sumiu significa que aquela versão não pode ser republicada — ela continua
servida se já estiver em `publicado/`, porque lá os caminhos são imutáveis."""

import subprocess
from pathlib import Path

from ferramentas.recusa import Recusado

# Nomes que nunca são parte de um MOD, e que entrariam no hash calculado em
# disco pelo servidor sem entrarem na lista `arquivos` do catálogo. O
# resultado seria o cliente recusando o MOD com «o hash não bate», que é a
# nossa palavra para «adulterado» — apontando para o lugar errado.
RECUSADOS = frozenset(
    {".DS_Store", "Thumbs.db", "desktop.ini", ".gitattributes", ".gitignore", ".gitmodules"}
)
SUFIXOS_RECUSADOS = (".swp", ".swo", ".orig", ".rej", ".pyc")
PASTAS_RECUSADAS = frozenset({".git", "__pycache__", "node_modules", ".idea", ".vscode"})


def _git(diretorio: Path, *args: str) -> str:
    try:
        pronto = subprocess.run(
            ["git", *args], cwd=diretorio, check=True, capture_output=True, text=True
        )
    except subprocess.CalledProcessError as erro:
        raise Recusado("git-falhou", f"{' '.join(args)}: {erro.stderr.strip()}") from erro
    return pronto.stdout


def _espelho(repo: str, cache: Path) -> Path:
    """Um clone nu, reaproveitado entre execuções.

    Nu porque nada aqui precisa de árvore de trabalho: os bytes saem do
    `git archive` de um commit, e não do que estiver no disco."""
    destino = cache / (repo.rstrip("/").replace("/", "_").replace(":", "_") + ".git")
    if destino.exists():
        _git(destino, "fetch", "--quiet", "--all")
    else:
        destino.parent.mkdir(parents=True, exist_ok=True)
        _git(cache, "clone", "--quiet", "--mirror", repo, str(destino))
    return destino


def _estranho(caminho: str) -> bool:
    partes = caminho.split("/")
    if any(parte in PASTAS_RECUSADAS for parte in partes[:-1]):
        return True
    nome = partes[-1]
    return nome in RECUSADOS or nome.endswith(SUFIXOS_RECUSADOS)


def materializar(repo: str, commit: str, cache: Path) -> list[tuple[str, bytes]]:
    """Os pares `(caminho, bytes)` do commit, prontos para o `content_hash`.

    Levanta `Recusado` se o commit não existe ou se há arquivo estranho."""
    try:
        cache.mkdir(parents=True, exist_ok=True)
    except (OSError, FileExistsError) as erro:
        raise Recusado("git-falhou", f"cache criação: {erro}") from erro

    espelho = _espelho(repo, cache)

    # `cat-file -e` responde «existe e é um commit» sem baixar a árvore.
    # Precisamos distinguir entre "commit não existe" (mensagem "Not a valid object name")
    # e "erro real do git" (repositório corrompido, permissão, etc).
    resultado = subprocess.run(
        ["git", "cat-file", "-e", f"{commit}^{{commit}}"],
        cwd=espelho,
        capture_output=True,
        text=True,
    )
    if resultado.returncode != 0:
        stderr_msg = resultado.stderr.strip()
        if "Not a valid object name" in stderr_msg:
            # Commit não existe no repositório
            raise Recusado("commit-ausente", f"{repo}@{commit}")
        else:
            # Erro real do git (repositório inválido, corrompido, etc)
            raise Recusado("git-falhou", f"cat-file: {stderr_msg}")

    listagem = _git(espelho, "ls-tree", "-r", "-z", "--name-only", commit)
    caminhos = [c for c in listagem.split("\0") if c]

    estranhos = sorted(c for c in caminhos if _estranho(c))
    if estranhos:
        # Nomear é o que transforma a recusa em conserto: quem publica precisa
        # saber qual arquivo tirar, não que «algo» estava errado.
        raise Recusado("arquivo-estranho", f"{repo}@{commit}: " + ", ".join(estranhos))

    arquivos: list[tuple[str, bytes]] = []
    for caminho in caminhos:
        bruto = subprocess.run(
            ["git", "show", f"{commit}:{caminho}"],
            cwd=espelho,
            check=True,
            capture_output=True,
        ).stdout
        # `git` já entrega o caminho com barra; a troca é para o dia em que
        # não entregar, porque o hash trabalha sobre o caminho como texto.
        arquivos.append((caminho.replace("\\", "/"), bruto))
    return arquivos
