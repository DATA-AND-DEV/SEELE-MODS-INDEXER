"""O veredito de uma avaliação, e o commit que ela avaliou.

Isto é tudo o que o repositório guarda sobre um MOD de terceiro. **Não há
cópia do código**: `indexador-de-mods.md` é literal — «duas cópias divergem,
e a que serve é a que sai do commit fixado». Quem busca os bytes é o
`fonte.py`, no commit que este arquivo fixa."""

import re
import tomllib
from dataclasses import dataclass, field
from pathlib import Path

from ferramentas.recusa import Recusado

# `negado` não está aqui de propósito: um MOD negado não entra no catálogo, e
# o catálogo diz o que existe, não o que foi rejeitado (ADR 0044, adendo).
NIVEIS = ("oficial", "verificado", "com-notas")

# SHA-1 completo. Prefixo curto de git colide, e um prefixo escolhido por um
# adversário colide de propósito.
COMMIT = re.compile(r"^[0-9a-f]{40}$")


def _repo_valido(repo: str) -> bool:
    """`repo` vira argumento de `git clone` e nome de diretório em `fonte.py`.

    `commit` passa por regex; `repo` não passava por nenhuma — a única
    entrada de fora que chegava direto a um argumento de subprocesso. O git
    2.50 já recusa `ext::`/`--upload-pack=` por padrão, mas essa proteção é
    dele, não nossa: aqui a lista é negativa e curta, para não quebrar as
    formas que o projeto de fato usa (https://, http://, git@host:caminho,
    ssh:// e caminho absoluto local)."""
    if not repo:
        return False
    if repo.startswith("-"):
        # Sem isso, `repo` viraria opção de linha de comando do `git clone`.
        return False
    if "::" in repo:
        # Os transportes `ext::`/`fake::` do git executam o que vem depois.
        return False
    return True


@dataclass(frozen=True)
class Versao:
    versao: str
    commit: str
    nivel: str
    notas: list[str] = field(default_factory=list)
    avaliado_em: int = 0


@dataclass(frozen=True)
class Avaliacao:
    id: str
    autor: str
    nome: str
    repo: str
    titulo: str
    resumo: str
    versoes: list[Versao] = field(default_factory=list)


def ler(caminho: Path, listas: dict) -> Avaliacao:
    """Lê um `avaliacoes/<autor>/<nome>.toml`, ou levanta `Recusado`.

    `listas` são as listas fechadas de `listas.json` — a mesma fonte que
    `revogacoes.py` usa para `motivo`. `nota` é a outra metade que essa lista
    fecha, e ficou sem guarda desde antes de `listas.json` existir."""
    try:
        cru = tomllib.loads(caminho.read_text(encoding="utf-8"))
    except tomllib.TOMLDecodeError as erro:
        raise Recusado("toml-malformado", f"{caminho}: {erro}") from erro

    identificador = cru.get("id", "")
    # O caminho e o id têm de dizer a mesma coisa: se divergirem, dois
    # arquivos podem reivindicar o mesmo id e o último lido ganha em silêncio.
    do_caminho = f"{caminho.parent.name}/{caminho.stem}"
    if identificador != do_caminho:
        raise Recusado("id-nao-bate-com-o-caminho", f"{identificador} em {do_caminho}.toml")

    autor, _, nome = identificador.partition("/")

    repo = cru.get("repo", "")
    if not _repo_valido(repo):
        raise Recusado("repo-torto", f"{identificador}: {repo!r}")

    versoes: list[Versao] = []
    vistas: set[str] = set()
    for bruta in cru.get("versoes", []):
        numero = bruta.get("versao", "")
        if numero in vistas:
            raise Recusado("versao-repetida", f"{identificador} {numero}")
        vistas.add(numero)

        commit = bruta.get("commit", "")
        if not COMMIT.match(commit):
            raise Recusado("commit-torto", f"{identificador} {numero}: {commit!r}")

        nivel = bruta.get("nivel", "")
        if nivel not in NIVEIS:
            raise Recusado("nivel-desconhecido", f"{identificador} {numero}: {nivel!r}")

        notas = bruta.get("notas", [])
        desconhecidas = [nota for nota in notas if nota not in listas["notas"]]
        if desconhecidas:
            # Mesmo molde do `motivo-desconhecido` de `revogacoes.py`: nota é
            # identificador de uma lista fechada, nunca frase — quem escreve a
            # frase é `site/frases.js`. Um typo aqui entraria assinado e
            # append-only no catálogo, e a tela mostraria o identificador cru.
            raise Recusado(
                "nota-desconhecida", f"{identificador} {numero}: " + ", ".join(desconhecidas)
            )
        if nivel == "com-notas" and not notas:
            raise Recusado("com-notas-sem-nota", f"{identificador} {numero}")

        versoes.append(
            Versao(
                versao=numero,
                commit=commit,
                nivel=nivel,
                notas=notas,
                avaliado_em=bruta.get("avaliado_em", 0),
            )
        )

    return Avaliacao(
        id=identificador,
        autor=autor,
        nome=nome,
        repo=cru.get("repo", ""),
        titulo=cru.get("titulo", ""),
        resumo=cru.get("resumo", ""),
        versoes=versoes,
    )


def ler_todas(raiz: Path, listas: dict) -> list[Avaliacao]:
    """Toda avaliação sob `raiz`, em ordem de id."""
    return sorted((ler(c, listas) for c in raiz.rglob("*.toml")), key=lambda a: a.id)
