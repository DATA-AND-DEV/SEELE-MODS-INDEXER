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


def _env_git(cache: Path) -> dict:
    """Ambiente para chamadas ao git com idioma forçado a inglês.

    As mensagens do git passam por gettext: num sistema em português elas
    mudariam de texto, e qualquer leitura nossa do stderr deixaria de valer.
    `LC_ALL=C` fixa o idioma para que o que lemos hoje continue lendo amanhã.

    `GIT_CEILING_DIRECTORIES=cache` é a segunda metade: um espelho que é um
    diretório vazio (clone interrompido) não tem `.git` nenhum, e sem a
    cerca o git sobe a árvore de diretórios procurando um repositório —
    achando, sempre que o cache mora dentro de um. Medido: `git fetch --all`
    rodou no repositório de quem publica e criou refs lá. A cerca é o próprio
    diretório do cache: a busca para nele, nunca acima."""
    env = os.environ.copy()
    env["LC_ALL"] = "C"
    env["LANGUAGE"] = ""
    env["GIT_CEILING_DIRECTORIES"] = str(cache.resolve())
    return env


def _rodar_git(diretorio: Path, *args: str, cache: Path, texto: bool = True):
    """A única porta por onde o git é chamado.

    Passar por um só lugar é o que permite a um teste contar quantos clones e
    quantos `fetch` aconteceram — e a contagem é o que prova que a
    reconstrução do espelho foi mesmo exercitada, em vez de o teste ter
    chegado ao mesmo código de recusa por outro caminho."""
    return subprocess.run(
        ["git", *args],
        cwd=diretorio,
        capture_output=True,
        text=texto,
        env=_env_git(cache),
    )


def _git(diretorio: Path, *args: str, cache: Path) -> str:
    """Uma chamada de git cuja falha é sempre `git-falhou`."""
    pronto = _rodar_git(diretorio, *args, cache=cache)
    if pronto.returncode != 0:
        raise Recusado("git-falhou", f"{' '.join(args)}: {pronto.stderr.strip()}")
    return pronto.stdout


def _caminho_do_espelho(repo: str, cache: Path) -> Path:
    """Onde o clone nu daquele repositório mora dentro do cache.

    `repo` vem de fora, então tudo que possa virar separador de caminho é
    neutralizado — inclusive a contrabarra, que em POSIX é um caractere comum
    de nome mas num Windows faria `..\\..\\` sair do cache. Só a barra não
    basta: o clone abaixo cria diretórios com `parents=True` e não tem âncora
    nenhuma, então o nome precisa já chegar aqui incapaz de subir."""
    seguro = repo.rstrip("/").replace("/", "_").replace("\\", "_").replace(":", "_")
    return cache / (seguro + ".git")


def _descartar(cache: Path, espelho: Path) -> None:
    """Apaga o espelho, com a âncora que impede apagar outra coisa.

    O caminho é derivado do nome do repositório, que vem de fora; conferir que
    ele é filho direto do cache antes de apagar é o que garante que um nome
    hostil não vira um apagamento em outro lugar do disco. A conferência é
    sobre o diretório-pai, e não sobre o alvo resolvido, para que um link
    simbólico plantado ali seja removido como link — nunca seguido."""
    if espelho.parent.resolve() != cache.resolve():
        raise Recusado("git-falhou", f"espelho fora do cache: {espelho}")
    try:
        if espelho.is_symlink() or not espelho.is_dir():
            espelho.unlink()
        else:
            shutil.rmtree(espelho)
    except FileNotFoundError:
        # Já não existe — o descarte não tinha o que fazer, e isso é sucesso,
        # não erro. Acontece quando `materializar` já descartou o espelho uma
        # vez (arquivo comum apagado, clone que falhou) e a retentativa manda
        # descartar de novo: sem este caso, o `FileNotFoundError` cairia no
        # `except OSError` abaixo e substituiria o diagnóstico verdadeiro do
        # clone («o repositório não existe») por um falso sobre o descarte.
        return
    except OSError as erro:
        # Um espelho que não pode ser apagado (permissão, arquivo travado) não
        # tem conserto daqui. O que não pode acontecer é a exceção crua escapar
        # por cima do contrato: quem chama trata `Recusado`, e mais nada.
        raise Recusado("git-falhou", f"descarte do espelho: {erro}") from erro


def _garantir_espelho(repo: str, cache: Path, espelho: Path) -> bool:
    """Deixa o espelho existindo, e diz se ele nasceu agora.

    Nu porque nada aqui precisa de árvore de trabalho: os bytes saem do
    commit, e não do que estiver no disco.

    Um caminho que existe e não é um diretório não é um espelho — é lixo com o
    nome certo. Chamar o git com `cwd` nele levantaria `NotADirectoryError`,
    que é exceção crua e não recusa nomeada, e a reconstrução não salvaria
    porque apagar também tropeçaria. Então ele é resolvido aqui, no mesmo
    lugar em que o espelho é preparado: apagado e clonado de novo."""
    if espelho.is_symlink() or (espelho.exists() and not espelho.is_dir()):
        _descartar(cache, espelho)
    if espelho.is_dir():
        return False
    espelho.parent.mkdir(parents=True, exist_ok=True)
    _git(cache, "clone", "--quiet", "--mirror", repo, str(espelho), cache=cache)
    return True


def _estranho(caminho: str) -> bool:
    partes = caminho.split("/")
    if any(parte in PASTAS_RECUSADAS for parte in partes[:-1]):
        return True
    nome = partes[-1]
    return nome in RECUSADOS or nome.endswith(SUFIXOS_RECUSADOS)


def _uma_tentativa(repo: str, commit: str, cache: Path, espelho: Path) -> list[tuple[str, bytes]]:
    """Uma passada inteira sobre o espelho: garantir, conferir, buscar, ler.

    Ela é inteira de propósito. O `fetch` está aqui dentro, e não fora, porque
    um espelho reaproveitado pode estar quebrado justamente no `fetch` — um
    `config` malformado, por exemplo. Se essa etapa ficasse de fora da
    tentativa, ficaria também de fora da reconstrução que a conserta, e o
    espelho quebrado viraria um `git-falhou` que ninguém consegue explicar
    olhando para a origem, que está perfeita."""
    recem_clonado = _garantir_espelho(repo, cache, espelho)

    # Saúde estrutural antes de perguntar pelo commit: um repositório quebrado
    # falha aqui, e a resposta é sobre o espelho, não sobre o commit.
    #
    # `--is-bare-repository` devolve `0` mesmo respondendo `false` — um
    # diretório vazio dentro do cache, sem a cerca de `GIT_CEILING_DIRECTORIES`,
    # escapa para um repositório acima e o git responde com sucesso sobre o
    # repositório errado. Só a saída literal `true` prova que é o espelho.
    saude = _rodar_git(espelho, "rev-parse", "--is-bare-repository", cache=cache)
    saida = saude.stdout.strip() if saude.stdout else ""
    if saude.returncode != 0 or saida != "true":
        detalhe = saude.stderr.strip() or f"resposta inesperada: {saida!r}"
        raise Recusado("git-falhou", f"espelho inválido: {detalhe}")

    # `cat-file -e` responde «existe e é um commit» sem baixar a árvore, e vem
    # **antes** do `fetch` de propósito: o commit é fixado, logo imutável, e um
    # commit que já está no espelho não tem o que ser buscado. Como
    # `materializar` roda uma vez por versão e não por repositório, buscar
    # sempre custaria uma ida à rede por versão do mesmo MOD. O caminho feliz
    # não toca a rede; o `fetch` é o conserto de quem não achou.
    resultado = _rodar_git(espelho, "cat-file", "-e", f"{commit}^{{commit}}", cache=cache)
    if resultado.returncode != 0 and not recem_clonado:
        _git(espelho, "fetch", "--quiet", "--all", cache=cache)
        resultado = _rodar_git(espelho, "cat-file", "-e", f"{commit}^{{commit}}", cache=cache)

    # Está medido que o git responde `fatal: Not a valid object name` tanto
    # para um commit que nunca existiu quanto para um cujo objeto foi apagado
    # do disco — byte a byte a mesma linha. Ler o stderr não separa os dois
    # casos, e nenhuma versão futura do git promete que vai separar. Por isso
    # a distinção não é feita aqui: quem a faz é `materializar`, reconstruindo
    # o espelho e perguntando de novo a um clone novo, que não pode estar
    # corrompido de antes.
    if resultado.returncode != 0:
        stderr = resultado.stderr.strip()
        if stderr.startswith(("error:", "warning:")):
            # O git relatou um erro seu (permissão, I/O). Isso não é o commit
            # faltando; é um atalho honesto, não o que separa os dois casos.
            raise Recusado("git-falhou", f"cat-file: {stderr}")
        raise Recusado("commit-ausente", f"{repo}@{commit}")

    listagem = _git(espelho, "ls-tree", "-r", "-z", "--name-only", commit, cache=cache)
    caminhos = [c for c in listagem.split("\0") if c]

    estranhos = sorted(c for c in caminhos if _estranho(c))
    if estranhos:
        # Nomear é o que transforma a recusa em conserto: quem publica precisa
        # saber qual arquivo tirar, não que «algo» estava errado.
        raise Recusado("arquivo-estranho", f"{repo}@{commit}: " + ", ".join(estranhos))

    arquivos: list[tuple[str, bytes]] = []
    for caminho in caminhos:
        bruto = _rodar_git(espelho, "show", f"{commit}:{caminho}", texto=False, cache=cache)
        if bruto.returncode != 0:
            raise Recusado("git-falhou", f"show {caminho}: {bruto.stderr.decode().strip()}")
        # `git` já entrega o caminho com barra; a troca é para o dia em que
        # não entregar, porque o hash trabalha sobre o caminho como texto.
        arquivos.append((caminho.replace("\\", "/"), bruto.stdout))
    return arquivos


def materializar(repo: str, commit: str, cache: Path) -> list[tuple[str, bytes]]:
    """Os pares `(caminho, bytes)` do commit, prontos para o `content_hash`.

    Levanta `Recusado` se o commit não existe ou se há arquivo estranho.

    A regra que governa este corpo cabe numa frase: **um espelho reaproveitado
    nunca é confiável, então qualquer falha do espelho custa exatamente uma
    reconstrução, e o veredito vem do clone novo — mas uma recusa sobre o
    conteúdo do commit não é falha do espelho, e não reconstrói.**

    A primeira metade não tem exceções de propósito: cada exceção seria uma
    etapa que alguém precisaria lembrar de incluir na reconstrução, e foi
    exatamente esquecer o `fetch` que deixou um `config` malformado sem
    conserto. O que ela compra é a diferença entre `commit-ausente` e
    `git-falhou`, que o git não sabe dizer — e um `commit-ausente` falso manda
    quem publica procurar um commit que está lá, sem conserto do lado dele.

    A segunda metade é o limite da primeira: o commit é fixado, e nenhum clone
    novo muda o que está dentro dele. Reconstruir por causa de um arquivo
    estranho gastaria um clone inteiro para chegar à mesmíssima recusa."""
    try:
        cache.mkdir(parents=True, exist_ok=True)
    except OSError as erro:
        raise Recusado("git-falhou", f"cache criação: {erro}") from erro

    espelho = _caminho_do_espelho(repo, cache)
    veio_do_cache = espelho.exists() or espelho.is_symlink()

    try:
        return _uma_tentativa(repo, commit, cache, espelho)
    except Recusado as recusa:
        if recusa.codigo == "arquivo-estranho":
            # O espelho respondeu perfeitamente; quem está errado é o commit.
            raise
        if not veio_do_cache:
            # O espelho já era novo nesta chamada. Não há passado para desfazer:
            # a falha é sobre o repositório do autor ou sobre o commit pedido, e
            # é a resposta final. Reconstruir de novo só repetiria o mesmo clone.
            raise
        # O espelho vinha do cache, então a falha pode ser dele e não da origem.
        # Uma reconstrução, e a segunda tentativa decide — sem terceira, porque
        # dessa vez o espelho é novo e cai no `raise` acima.
        _descartar(cache, espelho)
        return _uma_tentativa(repo, commit, cache, espelho)
