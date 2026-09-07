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


def ler(caminho: Path) -> Avaliacao:
    """Lê um `avaliacoes/<autor>/<nome>.toml`, ou levanta `Recusado`."""
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


def ler_todas(raiz: Path) -> list[Avaliacao]:
    """Toda avaliação sob `raiz`, em ordem de id."""
    return sorted((ler(c) for c in raiz.rglob("*.toml")), key=lambda a: a.id)
