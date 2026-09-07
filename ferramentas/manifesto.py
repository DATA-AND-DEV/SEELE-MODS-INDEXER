"""O que um MOD declara sobre si, e o que o produto recusa.

Espelho de `seele_proto::mods::read_manifest`
(`crates/seele-proto/src/mods.rs:131`). Se o gerador aceitasse um manifesto
que o cliente recusa, o MOD entraria no catálogo e falharia na máquina de
quem instalou — o pior lugar possível para descobrir.

Os códigos de recusa são os de `seele_core::mods::refusal_name` e não podem
divergir: eles atravessam para o `frases.js`, e um código sem frase mostra
o identificador cru para quem lê."""

import json
from dataclasses import dataclass, field

from ferramentas.recusa import Recusado

ESQUEMA_DO_MANIFESTO = 1
VERSAO_DA_API = 1

# Toda chave que o esquema 1 conhece. Uma chave fora daqui é recusada em vez
# de ignorada, pelo motivo que o Rust escreve em `deny_unknown_fields`: uma
# chave com erro de digitação instala um MOD sem a coisa que o autor achou
# que estava lá, e o autor nunca descobre.
CHAVES = {"schema", "id", "version", "api", "repo", "reach", "state", "client", "server"}
OBRIGATORIAS = {"schema", "id", "version", "api", "repo"}


@dataclass(frozen=True)
class Manifesto:
    schema: int
    id: str
    version: str
    api: int
    repo: str
    reach: list[str] = field(default_factory=list)
    state: int | None = None
    client: str | None = None
    server: str | None = None


def _bem_formado(identificador: str) -> bool:
    """`autor/nome`, as duas metades não vazias, nada que suba um diretório.

    Espelho de `is_well_formed_id` (`mods.rs:161`): minúscula ASCII, dígito
    ou hífen. Nada mais — e é o que impede um id de virar caminho."""
    metades = identificador.split("/")
    if len(metades) != 2:
        return False
    return all(
        metade and all(c.islower() and c.isascii() or c.isdigit() or c == "-" for c in metade)
        for metade in metades
    )


def ler(texto: str) -> Manifesto:
    """Lê um `mod.json`, ou levanta `Recusado`."""
    try:
        cru = json.loads(texto)
    except json.JSONDecodeError as erro:
        raise Recusado("malformed", f"linha {erro.lineno}, coluna {erro.colno}") from erro

    if not isinstance(cru, dict):
        raise Recusado("malformed", "a raiz não é um objeto")

    desconhecidas = set(cru) - CHAVES
    if desconhecidas:
        raise Recusado("malformed", "chave desconhecida: " + ", ".join(sorted(desconhecidas)))
    faltando = OBRIGATORIAS - set(cru)
    if faltando:
        raise Recusado("malformed", "falta: " + ", ".join(sorted(faltando)))

    if cru["schema"] > ESQUEMA_DO_MANIFESTO:
        raise Recusado("schema-too-new", f'esquema {cru["schema"]}, esta versão lê {ESQUEMA_DO_MANIFESTO}')
    if cru["api"] > VERSAO_DA_API:
        raise Recusado("api-too-new", f'pede API {cru["api"]}, esta versão oferece {VERSAO_DA_API}')
    if not _bem_formado(cru["id"]):
        raise Recusado("malformed-id", cru["id"])
    if cru.get("client") is None and cru.get("server") is None:
        raise Recusado("empty", "não declara metade de cliente nem de servidor")

    return Manifesto(
        schema=cru["schema"],
        id=cru["id"],
        version=cru["version"],
        api=cru["api"],
        repo=cru["repo"],
        reach=cru.get("reach", []),
        state=cru.get("state"),
        client=cru.get("client"),
        server=cru.get("server"),
    )
