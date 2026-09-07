"""Os bytes de uma versão, tirados do commit que a avaliação fixou.

É a única dependência de rede do desenho, e ela é de build e não de runtime:
roda na máquina de quem publica, nunca na de quem usa. Um repositório que
sumiu significa que aquela versão não pode ser republicada — ela continua
servida se já estiver em `publicado/`, porque lá os caminhos são imutáveis."""

import os
import shutil
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


def _espelho(repo: str, cache: Path) -> tuple[Path, bool]:
    """Um clone nu, reaproveitado entre execuções.

    Nu porque nada aqui precisa de árvore de trabalho: os bytes saem do
    `git archive` de um commit, e não do que estiver no disco.

    Retorna (caminho, foi_reutilizado): foi_reutilizado é True se o espelho
    existia antes e foi atualizado, False se foi clonado agora."""
    destino = cache / (repo.rstrip("/").replace("/", "_").replace(":", "_") + ".git")
    foi_reutilizado = destino.exists()

    if foi_reutilizado:
        _git(destino, "fetch", "--quiet", "--all")
    else:
        destino.parent.mkdir(parents=True, exist_ok=True)
        _git(cache, "clone", "--quiet", "--mirror", repo, str(destino))

    return destino, foi_reutilizado


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

    espelho, foi_reutilizado = _espelho(repo, cache)

    # Tentar obter os arquivos do commit. Se falhar num espelho reutilizado,
    # re-clonar do zero: isso resolve a ambiguidade entre «commit não existe»
    # e «espelho corrompido». O git conflaciona os dois na mensagem; por isso
    # a distinção é feita por construção, não por inspeção. Um re-clone custa
    # pouco no caminho de falha e conserta casos recuperáveis de graça.
    try:
        return _obter_arquivos(espelho, repo, commit)
    except Recusado as erro:
        if foi_reutilizado and erro.codigo in ("commit-ausente", "git-falhou"):
            # Espelho reutilizado falhou: pode ser corrupção recuperável (objects
            # sumidos, permissão, etc). Apagar e re-clonar do zero.
            # Só faz sentido se a falha foi num espelho antigo; um clone novo
            # que falha é erro definitivo, não recuperável.
            shutil.rmtree(espelho)
            espelho_novo, _ = _espelho(repo, cache)
            # Agora o espelho é recém-clonado. Se falhar de novo, é erro real
            # (commit genuinamente ausente ou repositório do autor inacessível).
            return _obter_arquivos(espelho_novo, repo, commit)
        else:
            # Ou é um espelho recém-clonado que falhou (erro real definitivo),
            # ou é um erro estrutural (mkdir).
            raise


def _obter_arquivos(espelho: Path, repo: str, commit: str) -> list[tuple[str, bytes]]:
    """Obter os arquivos de um commit a partir de um espelho.

    Levanta Recusado com código commit-ausente ou git-falhou."""
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

    # Verificar existência do commit com `cat-file -e`. O git diz «não achei»
    # para dois casos diferentes: commit nunca existiu, ou objeto sumiu do disco.
    # Como são indistinguíveis pela mensagem, eles viram commit-ausente aqui,
    # e materializar tenta re-clonar se foi reutilizado.
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
            # Erro específico: permissão, I/O, etc.
            raise Recusado("git-falhou", f"cat-file: {stderr_msg}")
        else:
            # Qualquer outra falha: "Not a valid object name", ou silenciosa.
            # Git conflaciona ausência com sumido; re-clone resolve um deles.
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
