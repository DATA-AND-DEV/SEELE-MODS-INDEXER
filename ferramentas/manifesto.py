"""O que um MOD declara sobre si, e o que o produto recusa.

Espelho de `seele_proto::mods::read_manifest`
(`crates/seele-proto/src/mods.rs:131`). Se o gerador aceitasse um manifesto
que o cliente recusa, o MOD entraria no catálogo e falharia na máquina de
quem instalou — o pior lugar possível para descobrir.

Os códigos de recusa são os de `seele_core::mods::refusal_name` e não podem
divergir: eles atravessam para o `frases.js`, e um código sem frase mostra
o identificador cru para quem lê."""

import json
import unicodedata
from dataclasses import dataclass, field

from ferramentas.recusa import Recusado

ESQUEMA_DO_MANIFESTO = 1

# Espelho de `seele_proto::mods::MOD_API_VERSION`.
VERSAO_DA_API = 7

# **A união das linhas**, da mais nova para a mais velha: o que
# `seele_proto::mods::apis_de_toda_linha()` tira de `APIS_POR_LINHA`, e não
# mais o espelho de `APIS_ACEITAS`.
#
# # Por que a união, e não o conjunto do app
#
# Desde o corte da API 6, o `APIS_ACEITAS` do produto é só o da linha dele. Na
# 0.17 (`APIS_POR_LINHA`) são três linhas: a 2 (o app 0.17, o Servidor 2.0) com
# a `[7, 6]`, a 1 (o app 0.16, o Servidor 1.0) com a `[6]`, e a 0.15 com as 5, 4
# e 3, que o launcher roda ao lado. O indexador serve todas do mesmo catálogo,
# então aceita o que alguma delas executa. Uma API fora de toda linha (a 8,
# antes de existir) continua recusada, e uma que saiu de toda linha também.
#
# A 7 é um alargamento da 6 (o `api/v7.json` do SEELE): um pacote da 6 continua
# aceito e continua rodando na 0.17, sem precisar ser republicado. Quem impede
# a 0.16 de baixar um pacote da 7 é a `api` de cada versão do catálogo, que é a
# que o `mod.json` declara (`gerar.py`), e não esta lista.
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
APIS_ACEITAS = (7, 6, 5, 4, 3)

# A API em que a chave `tema` nasceu. A linha 0.15 não a conhece e a recusa
# (`deny_unknown_fields`), e a linha 1 não executa as APIs da 0.15: um pacote
# abaixo da 6 que declare a chave não instala em build nenhuma.
API_DO_TEMA = 6

# Espelho de `seele_proto::mods::PRIMEIRA_API_COM_PERMISSOES`: a API em que a
# chave `permissoes` nasceu (as ações que o MOD pede por `AcaoDeMod`).
API_DAS_PERMISSOES = 7

# Espelhos de `seele_proto::cargos`: `MAX_PERMISSOES_POR_MOD`, `MAX_ACAO_LEN`
# e `MAX_NOME_DA_PERMISSAO_DE_MOD`. Os dois tamanhos são em **bytes** UTF-8,
# como o `len()` de uma `String` do Rust, e não em caracteres.
TETO_DE_PERMISSOES = 8
TETO_DA_ACAO = 32
TETO_DO_NOME_DA_PERMISSAO = 48

# As chaves de uma `PermissaoDeclarada`, que lá também é `deny_unknown_fields`.
# `todos` é `bool` com `#[serde(default)]`: ausente vale `false`, e `null` não
# desserializa.
CHAVES_DA_PERMISSAO = {"acao", "nome", "todos"}
OBRIGATORIAS_DA_PERMISSAO = {"acao", "nome"}

# Toda chave que o esquema 1 conhece. Uma chave fora daqui é recusada em vez
# de ignorada, pelo motivo que o Rust escreve em `deny_unknown_fields`: uma
# chave com erro de digitação instala um MOD sem a coisa que o autor achou
# que estava lá, e o autor nunca descobre.
CHAVES = {"schema", "id", "version", "api", "repo", "reach", "state", "client", "server",
          "arquivos", "tema", "permissoes"}
OBRIGATORIAS = {"schema", "id", "version", "api", "repo"}

# O tipo de cada chave, porque o `serde` do Rust valida isso na
# desserialização e nós precisamos falhar do mesmo jeito. Sem esta tabela um
# `"schema": "1"` levanta `TypeError` cru em vez de `Recusado`, e um único
# `mod.json` torto derruba a indexação inteira em vez de recusar aquele MOD.
TIPOS = {
    "schema": int, "id": str, "version": str, "api": int, "repo": str,
    "reach": list, "state": int, "client": str, "server": str, "arquivos": list,
    "tema": bool, "permissoes": list,
}

# Os únicos campos que o Rust declara `Option<T>`. Para os demais, um `null`
# explícito não é «ausente»: é um manifesto que o `serde` recusaria. O `tema`
# fica de fora de propósito: lá ele é `bool` com `#[serde(default)]`, então a
# chave ausente vale `false`, mas `"tema": null` não desserializa.
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
    tema: bool = False
    permissoes: list["PermissaoDeclarada"] = field(default_factory=list)


@dataclass(frozen=True)
class PermissaoDeclarada:
    """Espelho de `seele_proto::cargos::PermissaoDeclarada`."""

    acao: str
    nome: str
    todos: bool = False


class _Objeto(dict):
    """Um objeto JSON que lembra as chaves que vieram repetidas.

    O `json` do Python fica com a última e não avisa; o `serde` do Rust recusa
    o campo duplicado num `struct`. Só a `PermissaoDeclarada` consulta isto:
    um `{"todos": false, "todos": true}` lido de um jeito aqui e de outro lá
    seria uma permissão dada a todo mundo sem que quem revisou visse."""

    repetidas: frozenset[str] = frozenset()


def _objeto(pares: list[tuple[str, object]]) -> _Objeto:
    objeto = _Objeto(pares)
    if len(objeto) != len(pares):
        chaves = [chave for chave, _ in pares]
        objeto.repetidas = frozenset(chave for chave in chaves if chaves.count(chave) > 1)
    return objeto


def _acao_valida(acao: str) -> bool:
    """Espelho de `cargos::acao_valida`: `[a-z0-9-]`, de 1 a 32 bytes, sem `-` nas pontas."""
    return (
        0 < len(acao) <= TETO_DA_ACAO
        and not acao.startswith("-")
        and not acao.endswith("-")
        and all(("a" <= c <= "z") or ("0" <= c <= "9") or c == "-" for c in acao)
    )


def _nome_de_permissao_valido(nome: str) -> bool:
    """Espelho de `cargos::nome_de_permissao_valido`.

    `char::is_control` do Rust é a categoria `Cc`, e é o que se confere aqui. O
    `trim` de lá corta o espaço branco Unicode, como o `strip` daqui; onde os
    dois discordam (de U+001C a U+001F) o caractere é `Cc`, e é recusado de
    qualquer jeito."""
    return (
        bool(nome.strip())
        and len(nome.encode("utf-8")) <= TETO_DO_NOME_DA_PERMISSAO
        and not any(unicodedata.category(c) == "Cc" for c in nome)
    )


def _permissoes_do_json(lista: list) -> list[PermissaoDeclarada]:
    """O que o `serde` faria com a lista: forma e tipos, ou `malformed`."""
    lidas = []
    for posicao, entrada in enumerate(lista):
        onde = f"permissoes[{posicao}]"
        if not isinstance(entrada, dict):
            raise Recusado("malformed", f"{onde} não é um objeto")
        repetidas = getattr(entrada, "repetidas", frozenset())
        if repetidas:
            raise Recusado("malformed", f"{onde} repete a chave: " + ", ".join(sorted(repetidas)))
        desconhecidas = set(entrada) - CHAVES_DA_PERMISSAO
        if desconhecidas:
            raise Recusado("malformed", f"{onde} chave desconhecida: " + ", ".join(sorted(desconhecidas)))
        faltando = OBRIGATORIAS_DA_PERMISSAO - set(entrada)
        if faltando:
            raise Recusado("malformed", f"{onde} falta: " + ", ".join(sorted(faltando)))
        for chave in ("acao", "nome"):
            if not isinstance(entrada[chave], str):
                raise Recusado("malformed", f"{onde}.{chave} deveria ser str")
            # Um `\ud800` sozinho: o `json` do Python o aceita como um surrogate
            # solto, que não é texto Unicode e não codifica em UTF-8; o
            # `serde_json` recusa o documento inteiro. Um par válido já chega
            # aqui juntado num caractere só.
            if any(0xD800 <= ord(c) <= 0xDFFF for c in entrada[chave]):
                raise Recusado("malformed", f"{onde}.{chave} traz um surrogate isolado")
        todos = entrada.get("todos", False)
        if not isinstance(todos, bool):
            raise Recusado("malformed", f"{onde}.todos deveria ser bool")
        lidas.append(PermissaoDeclarada(acao=entrada["acao"], nome=entrada["nome"], todos=todos))
    return lidas


def _validar_declaradas(lista: list[PermissaoDeclarada]) -> None:
    """Espelho de `cargos::validar_declaradas`, na mesma ordem: a primeira recusa vale."""
    if len(lista) > TETO_DE_PERMISSOES:
        raise Recusado("permissoes-invalidas", f"declara {len(lista)} permissões, o teto é {TETO_DE_PERMISSOES}")
    vistas: set[str] = set()
    for posicao, declarada in enumerate(lista):
        if not _acao_valida(declarada.acao):
            raise Recusado("permissoes-invalidas", f"permissoes[{posicao}] tem uma ação inválida: {declarada.acao!r}")
        if not _nome_de_permissao_valido(declarada.nome):
            raise Recusado("permissoes-invalidas", f"permissoes[{posicao}] tem um nome inválido")
        if declarada.acao in vistas:
            raise Recusado("permissoes-invalidas", f"permissoes[{posicao}] repete a ação {declarada.acao!r}")
        vistas.add(declarada.acao)


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
        cru = json.loads(texto, object_pairs_hook=_objeto)
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
        # Só nas chaves que não são `bool`: o `tema` é, e a recusa de todo
        # booleano o recusaria como «tema deveria ser bool».
        if (tipo is not bool and isinstance(valor, bool)) or not isinstance(valor, tipo):
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
    permissoes = _permissoes_do_json(cru.get("permissoes", []))
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
    if "tema" in cru and cru["api"] < API_DO_TEMA:
        raise Recusado("malformed", f'chave desconhecida para a API {cru["api"]}: tema')
    if not _bem_formado(cru["id"]):
        raise Recusado("malformed-id", cru["id"])
    if cru.get("client") is None and cru.get("server") is None:
        raise Recusado("empty", "não declara metade de cliente nem de servidor")
    # A porta do tema sem quem a abra: quem pinta a aparência é a metade de
    # servidor, por `mundo.tema`, e sem ela o tema nunca aparece. Logo depois
    # de `empty`, na ordem do Rust (`Refused::TemaSemMetadeDeServidor`).
    if cru.get("tema", False) and cru.get("server") is None:
        raise Recusado("tema-sem-metade-de-servidor", "declara \"tema\": true sem metade de servidor")
    # As permissões, depois do tema e na ordem do Rust: `PermissoesPedemApiNova`,
    # e então `PermissoesInvalidas`. Recusadas, e não ignoradas: o autor que as
    # escreveu conta com elas, e um app que as ignorasse deixaria a ação passar
    # sem cargo.
    if permissoes and cru["api"] < API_DAS_PERMISSOES:
        raise Recusado(
            "permissoes-pedem-api-nova",
            f'declara permissoes com a API {cru["api"]}; permissões pedem a API {API_DAS_PERMISSOES}',
        )
    # **Mais estrito que o Rust da 0.17, e de propósito.** Lá um `"permissoes":
    # []` numa API 6 passa. Mas um pacote da 6 é oferecido também ao app 0.16,
    # que recusa o manifesto inteiro só por ter a chave (`deny_unknown_fields`,
    # medido em `tests/manifesto_da_0_16.rs` do SEELE). É o caso da chave `tema`
    # abaixo da 6: uma chave que uma linha que escolheria o pacote não conhece
    # não entra no catálogo.
    if "permissoes" in cru and cru["api"] < API_DAS_PERMISSOES:
        raise Recusado("malformed", f'chave desconhecida para a API {cru["api"]}: permissoes')
    _validar_declaradas(permissoes)

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
        tema=cru.get("tema", False),
        permissoes=permissoes,
    )
