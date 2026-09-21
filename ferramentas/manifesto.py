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

# Espelho de `seele_proto::mods::MOD_API_VERSION`.
VERSAO_DA_API = 5

# Espelho de `seele_proto::mods::APIS_ACEITAS`, da mais nova para a mais velha.
#
# # Por que um conjunto, e não um número
#
# Até a API 3 a conferência era igualdade dos dois lados, e ela estava certa:
# o ADR 0049 é uma ruptura — a API 3 **tirou** capacidades, e «serve uma API
# mais velha» tinha deixado de ser verdade.
#
# A API 4 não tira nada. Ela acrescenta superfícies, contribuições, composição
# e estilos sobre o mesmo executor e o mesmo renderer, e um pacote de API 3
# continua sendo exatamente o que era: uma região, um tema e cartões.
#
# Com a igualdade, subir a constante recusaria no catálogo **todo pacote
# publicado**, no mesmo instante — inclusive os três oficiais, que é o que está
# instalado na máquina de quem usa. O conjunto é o que permite publicar o
# aplicativo compatível antes dos pacotes novos, que é a única ordem em que
# ninguém fica sem MOD.
#
# Aceitar a 3 não dá à 3 o que a 4 tem: as capacidades são por versão e quem as
# aplica é o prelúdio do executor, do lado do cliente. A 2 não volta — ela
# executava na janela.
APIS_ACEITAS = (5, 4, 3)

# Toda chave que o esquema 1 conhece. Uma chave fora daqui é recusada em vez
# de ignorada, pelo motivo que o Rust escreve em `deny_unknown_fields`: uma
# chave com erro de digitação instala um MOD sem a coisa que o autor achou
# que estava lá, e o autor nunca descobre.
CHAVES = {"schema", "id", "version", "api", "repo", "reach", "state", "client", "server",
          "arquivos"}
OBRIGATORIAS = {"schema", "id", "version", "api", "repo"}

# O tipo de cada chave, porque o `serde` do Rust valida isso na
# desserialização e nós precisamos falhar do mesmo jeito. Sem esta tabela um
# `"schema": "1"` levanta `TypeError` cru em vez de `Recusado`, e um único
# `mod.json` torto derruba a indexação inteira em vez de recusar aquele MOD.
TIPOS = {
    "schema": int, "id": str, "version": str, "api": int, "repo": str,
    "reach": list, "state": int, "client": str, "server": str, "arquivos": list,
}

# Os únicos campos que o Rust declara `Option<T>`. Para os demais, um `null`
# explícito não é «ausente»: é um manifesto que o `serde` recusaria.
OPCIONAIS = {"state", "client", "server"}

U32_MAX = 2**32 - 1

# Espelho de `seele_proto::mods::TETO_DE_ARQUIVOS`. Dezesseis, e o motivo está
# escrito lá: a mídia de um MOD é ilustração e efeito, e uma lista maior é um
# acervo — outra coisa, com outro custo.
TETO_DE_ARQUIVOS = 16


@dataclass(frozen=True)
class Manifesto:
    schema: int
    id: str
    version: str
    api: int
    repo: str
    reach: list[str] = field(default_factory=list)
    arquivos: list[str] = field(default_factory=list)
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


def _dentro_da_pasta(caminho: str) -> bool:
    """Espelho de `inner_path` (`mods.rs:483`), aplicado como `read_manifest` o aplica.

    Lá o caminho é quebrado em `/` e **cada pedaço** tem de ser um único
    `Component::Normal`. É o que recusa `../fora.wav`, `/etc/senha`, `.` e a
    string vazia — um pacote instalado que pede um arquivo de fora a cada
    sessão é um pacote que não devia ter entrado.

    Duas recusas a mais do que o POSIX exige, e de propósito. O `Path` do Rust
    é do sistema onde ele roda: em Windows `C:` é um `Prefix` e a contrabarra
    separa componentes, então um caminho aceito aqui num Mac seria recusado lá
    na máquina de quem instalou. Um MOD que entra no catálogo e só funciona em
    metade dos sistemas é o defeito que este módulo existe para impedir, e o
    lugar barato de pegá-lo é aqui.
    """
    if not caminho:
        return False
    for pedaco in caminho.split("/"):
        if pedaco in ("", ".", "..") or "\\" in pedaco or pedaco.endswith(":"):
            return False
    return True


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
    arquivos = cru.get("arquivos", []) or []
    if any(not isinstance(item, str) for item in arquivos):
        raise Recusado("malformed", "arquivos deveria ser uma lista de textos")
    if len(arquivos) > TETO_DE_ARQUIVOS:
        raise Recusado("malformed", f"declara {len(arquivos)} arquivos, o teto é {TETO_DE_ARQUIVOS}")
    for posicao, arquivo in enumerate(arquivos):
        # **Qual**, e não «um deles»: com dezesseis na lista, quem conserta o
        # pacote precisa saber onde olhar. O Rust diz a posição pelo mesmo motivo.
        if not _dentro_da_pasta(arquivo):
            raise Recusado("malformed", f"arquivos[{posicao}] sai da pasta do MOD: {arquivo!r}")

    if cru["schema"] > ESQUEMA_DO_MANIFESTO:
        raise Recusado("schema-too-new", f'esquema {cru["schema"]}, esta versão lê {ESQUEMA_DO_MANIFESTO}')
    if cru["api"] > VERSAO_DA_API:
        raise Recusado("api-too-new", f'pede API {cru["api"]}, esta versão oferece {VERSAO_DA_API}')
    # **Um conjunto, e não uma igualdade** — ver `APIS_ACEITAS`. `historico`
    # continua existindo para o que já foi publicado sob uma API que saiu de
    # circulação; o que mudou é que a 3 não é um desses casos.
    if cru["api"] not in APIS_ACEITAS and not historico:
        aceitas = ", ".join(str(n) for n in APIS_ACEITAS)
        raise Recusado("api-too-old", f'pede API {cru["api"]}, esta versão executa {aceitas}')
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
        arquivos=cru.get("arquivos", []),
        state=cru.get("state"),
        client=cru.get("client"),
        server=cru.get("server"),
    )
