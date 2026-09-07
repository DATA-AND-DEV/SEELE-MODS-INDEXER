"""Os bytes de uma versão, tirados do commit que a avaliação fixou.

É a única dependência de rede do desenho, e ela é de build e não de runtime:
roda na máquina de quem publica, nunca na de quem usa. Um repositório que
sumiu significa que aquela versão não pode ser republicada — ela continua
servida se já estiver em `publicado/`, porque lá os caminhos são imutáveis."""

import os
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


def _env_git() -> dict:
    """Ambiente para chamadas ao git com idioma forçado a inglês.

    Isso elimina fragilidade de localização: mensagens de erro do git passam
    por gettext, e em um sistema em português, as substrings que esperamos
    desapareceriam. LC_ALL=C força saída em inglês."""
    env = os.environ.copy()
    env["LC_ALL"] = "C"
    env["LANGUAGE"] = ""
    return env


def _git(diretorio: Path, *args: str) -> str:
    try:
        pronto = subprocess.run(
            ["git", *args],
            cwd=diretorio,
            check=True,
            capture_output=True,
            text=True,
            env=_env_git(),
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

    # Verificar saúde estrutural do espelho. Um repositório git genuinamente
    # quebrado ou inacessível falha aqui, antes de tentar perguntar pelo commit.
    saude = subprocess.run(
        ["git", "rev-parse", "--is-bare-repository"],
        cwd=espelho,
        capture_output=True,
        text=True,
        env=_env_git(),
    )
    if saude.returncode != 0:
        raise Recusado("git-falhou", f"espelho inválido: {saude.stderr.strip()}")

    # Verificar existência do commit. Aqui usamos `cat-file -e` que não baixa
    # a árvore. O git usa «Not a valid object name» como resposta genérica
    # quando não consegue resolver um objeto — isso conflaciona dois cenários
    # diferentes: SHA inválido (commit genuinamente ausente) e objeto
    # corrompido/faltante (espelho corrompido). Como eles são indistinguíveis
    # pela mensagem final, erramos para o lado seguro: qualquer `error:` ou
    # `warning:` no stderr é `git-falhou` (erro real), só a ausência pura é
    # `commit-ausente`. Documentamos aqui porque é limitação do git, não nossa.
    resultado = subprocess.run(
        ["git", "cat-file", "-e", f"{commit}^{{commit}}"],
        cwd=espelho,
        capture_output=True,
        text=True,
        env=_env_git(),
    )
    if resultado.returncode != 0:
        stderr_msg = resultado.stderr.strip()
        if stderr_msg and any(
            stderr_msg.startswith(prefix) for prefix in ("error:", "warning:")
        ):
            # Linha de erro específica: repositório corrompido, permissão, etc.
            raise Recusado("git-falhou", f"cat-file: {stderr_msg}")
        elif stderr_msg and "Not a valid object name" in stderr_msg:
            # Commit não existe (ou objeto corrompido, indistinguível do anterior).
            # Erra para commit-ausente quando a única mensagem é a fatal genérica.
            raise Recusado("commit-ausente", f"{repo}@{commit}")
        elif not stderr_msg:
            # Falha silenciosa (exit code 1 sem mensagem): objeto faltante após
            # verificação estrutural bem-sucedida. Trata como ausência.
            raise Recusado("commit-ausente", f"{repo}@{commit}")

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
            env=_env_git(),
        ).stdout
        # `git` já entrega o caminho com barra; a troca é para o dia em que
        # não entregar, porque o hash trabalha sobre o caminho como texto.
        arquivos.append((caminho.replace("\\", "/"), bruto))
    return arquivos
