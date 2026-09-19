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

# Espelho de `seele_proto::mods::MOD_API_VERSION`: ADR 0049 é uma ruptura.
VERSAO_DA_API = 3

# Toda chave que o esquema 1 conhece. Uma chave fora daqui é recusada em vez
# de ignorada, pelo motivo que o Rust escreve em `deny_unknown_fields`: uma
# chave com erro de digitação instala um MOD sem a coisa que o autor achou
# que estava lá, e o autor nunca descobre.
CHAVES = {"schema", "id", "version", "api", "repo", "reach", "state", "client", "server"}
OBRIGATORIAS = {"schema", "id", "version", "api", "repo"}

# O tipo de cada chave, porque o `serde` do Rust valida isso na
# desserialização e nós precisamos falhar do mesmo jeito. Sem esta tabela um
# `"schema": "1"` levanta `TypeError` cru em vez de `Recusado`, e um único
# `mod.json` torto derruba a indexação inteira em vez de recusar aquele MOD.
TIPOS = {
    "schema": int, "id": str, "version": str, "api": int, "repo": str,
    "reach": list, "state": int, "client": str, "server": str,
}

# Os únicos campos que o Rust declara `Option<T>`. Para os demais, um `null`
# explícito não é «ausente»: é um manifesto que o `serde` recusaria.
OPCIONAIS = {"state", "client", "server"}

U32_MAX = 2**32 - 1


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
    # Faixas ASCII explícitas, e não `islower`/`isdigit`: os métodos do Python
    # são Unicode e aceitariam `x²` ou dígitos indo-arábicos, que
    # `is_ascii_digit` do Rust recusa. Um id aceito aqui e recusado lá é um
    # MOD que entra no catálogo e falha na máquina de quem instalou.
    return all(
        metade
        and all(("a" <= c <= "z") or ("0" <= c <= "9") or c == "-" for c in metade)
        for metade in metades
    )


def ler(texto: str, *, historico: bool = False) -> Manifesto:
    """Lê um pacote atual; histórico é exclusivo de bytes já publicados.

    O gerador só usa historico=True após conferir id, versão e hash contra
    o catálogo anterior. Não autoriza novos pacotes com uma API retirada.
    """
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

    for chave, tipo in TIPOS.items():
        if chave not in cru:
            continue
        valor = cru[chave]
        if valor is None:
            # `null` só equivale a ausente nos campos que o Rust declara
            # `Option<T>`. Nos outros o `serde` recusa `null`, e aceitar aqui
            # poria um `repo` nulo num catálogo append-only — sem conserto
            # barato depois.
            if chave in OPCIONAIS:
                continue
            raise Recusado("malformed", f"{chave} não pode ser nulo")
        # `bool` é subclasse de `int` em Python, e `true` não é um u32 no Rust.
        if isinstance(valor, bool) or not isinstance(valor, tipo):
            raise Recusado("malformed", f"{chave} deveria ser {tipo.__name__}")
        # `schema`, `api` e `state` são u32 lá: negativo ou acima do teto não
        # desserializa, e publicar o que o cliente recusa é o defeito que este
        # módulo inteiro existe para impedir.
        if tipo is int and not (0 <= valor <= U32_MAX):
            raise Recusado("malformed", f"{chave} fora da faixa de u32")
    if any(not isinstance(item, str) for item in cru.get("reach", []) or []):
        raise Recusado("malformed", "reach deveria ser uma lista de textos")

    if cru["schema"] > ESQUEMA_DO_MANIFESTO:
        raise Recusado("schema-too-new", f'esquema {cru["schema"]}, esta versão lê {ESQUEMA_DO_MANIFESTO}')
    if cru["api"] > VERSAO_DA_API:
        raise Recusado("api-too-new", f'pede API {cru["api"]}, esta versão oferece {VERSAO_DA_API}')
    if cru["api"] < VERSAO_DA_API and not historico:
        raise Recusado("api-too-old", f'pede API {cru["api"]}, esta versão oferece somente {VERSAO_DA_API}')
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
