"""As cinco recusas de `read_manifest`, espelhadas.

Os nomes dos códigos são os de `seele_core::mods::refusal_name` e não podem
divergir: eles atravessam para o `frases.js`, e um código sem frase mostra o
identificador cru para quem lê."""

import pytest

from ferramentas.recusa import Recusado
from ferramentas.manifesto import ESQUEMA_DO_MANIFESTO, VERSAO_DA_API, ler

VALIDO = """
{
  "schema": 1, "id": "juli/cinza-frio", "version": "2.1.0", "api": 3,
  "repo": "https://github.com/juli/seele-cinza-frio",
  "reach": ["trocar as cores da interface"],
  "client": "cliente/main.js"
}
"""


def test_um_manifesto_valido_e_lido():
    m = ler(VALIDO)
    assert m.id == "juli/cinza-frio"
    assert m.api == 3
    assert m.reach == ["trocar as cores da interface"]
    assert m.client == "cliente/main.js"
    assert m.server is None


def test_json_quebrado_e_malformed():
    with pytest.raises(Recusado) as erro:
        ler("{ nao é json")
    assert erro.value.codigo == "malformed"


def test_chave_desconhecida_e_malformed():
    # `deny_unknown_fields` é a decisão e não o padrão: uma chave com erro de
    # digitação instala um MOD sem a coisa que o autor achou que estava lá, e
    # o autor nunca descobre.
    with pytest.raises(Recusado) as erro:
        ler('{"schema":1,"id":"a/b","version":"1","api": 3,"repo":"r","cliente":"x"}')
    assert erro.value.codigo == "malformed"


# Os dois «do futuro» saem das constantes, e não de um número escrito à mão.
# `api` era um `2` literal, e no dia em que a API foi a 2 o teste passou a
# afirmar que o presente é o futuro — continuou verde afirmando o contrário do
# que o nome dele diz.
def test_esquema_do_futuro_e_schema_too_new():
    futuro = ESQUEMA_DO_MANIFESTO + 1
    with pytest.raises(Recusado) as erro:
        ler(f'{{"schema":{futuro},"id":"a/b","version":"1","api": 3,"repo":"r","client":"c.js"}}')
    assert erro.value.codigo == "schema-too-new"


def test_api_do_futuro_e_api_too_new():
    futuro = VERSAO_DA_API + 1
    with pytest.raises(Recusado) as erro:
        ler(f'{{"schema":1,"id":"a/b","version":"1","api":{futuro},"repo":"r","client":"c.js"}}')
    assert erro.value.codigo == "api-too-new"


def test_a_api_de_hoje_e_aceita():
    """A outra metade, sem a qual o teste acima passaria com a API em zero."""
    m = ler(f'{{"schema":1,"id":"a/b","version":"1","api":{VERSAO_DA_API},"repo":"r","client":"c.js"}}')
    assert m.api == VERSAO_DA_API


@pytest.mark.parametrize(
    "identificador",
    ["semdivisao", "a/b/c", "/b", "a/", "Maiuscula/b", "a/com_underline", "a/com espaço"],
)
def test_id_torto_e_malformed_id(identificador):
    texto = '{"schema":1,"id":"%s","version":"1","api": 3,"repo":"r","client":"c.js"}' % identificador
    with pytest.raises(Recusado) as erro:
        ler(texto)
    assert erro.value.codigo == "malformed-id"


@pytest.mark.parametrize("identificador", ["a/b", "seele/rpg", "kae-2/glifos-osso", "a1/b2"])
def test_id_bem_formado_passa(identificador):
    texto = '{"schema":1,"id":"%s","version":"1","api": 3,"repo":"r","client":"c.js"}' % identificador
    assert ler(texto).id == identificador


def test_sem_nenhuma_metade_e_empty():
    with pytest.raises(Recusado) as erro:
        ler('{"schema":1,"id":"a/b","version":"1","api": 3,"repo":"r"}')
    assert erro.value.codigo == "empty"


def test_so_a_metade_do_servidor_basta():
    m = ler('{"schema":1,"id":"a/b","version":"1","api": 3,"repo":"r","server":"s.js"}')
    assert m.client is None
    assert m.server == "s.js"


# Critical 1: ID com caracteres Unicode que Python aceita mas Rust recusa
def test_id_com_superscript_dois_e_malformed_id():
    # `²` (U+00B2) é aceito por `str.isdigit()` mas recusado por Rust
    with pytest.raises(Recusado) as erro:
        ler('{"schema":1,"id":"a/x²","version":"1","api": 3,"repo":"r","client":"c.js"}')
    assert erro.value.codigo == "malformed-id"


def test_id_com_digito_indoarabico_e_malformed_id():
    # `٣` (U+0663, ARABIC-INDIC DIGIT THREE) é aceito por `str.isdigit()` mas recusado por Rust
    with pytest.raises(Recusado) as erro:
        ler('{"schema":1,"id":"a/x٣","version":"1","api": 3,"repo":"r","client":"c.js"}')
    assert erro.value.codigo == "malformed-id"


# Critical 2: Validação de tipos — sem ela, erros crus em vez de `Recusado`
def test_schema_como_texto_e_malformed():
    with pytest.raises(Recusado) as erro:
        ler('{"schema":"1","id":"a/b","version":"1","api": 3,"repo":"r","client":"c.js"}')
    assert erro.value.codigo == "malformed"


def test_id_como_numero_e_malformed():
    with pytest.raises(Recusado) as erro:
        ler('{"schema":1,"id":123,"version":"1","api": 3,"repo":"r","client":"c.js"}')
    assert erro.value.codigo == "malformed"


def test_api_como_texto_e_malformed():
    with pytest.raises(Recusado) as erro:
        ler('{"schema":1,"id":"a/b","version":"1","api":"1","repo":"r","client":"c.js"}')
    assert erro.value.codigo == "malformed"


def test_reach_como_texto_em_vez_de_lista_e_malformed():
    with pytest.raises(Recusado) as erro:
        ler('{"schema":1,"id":"a/b","version":"1","api": 3,"repo":"r","reach":"texto","client":"c.js"}')
    assert erro.value.codigo == "malformed"


def test_client_como_numero_e_malformed():
    with pytest.raises(Recusado) as erro:
        ler('{"schema":1,"id":"a/b","version":"1","api": 3,"repo":"r","client":123}')
    assert erro.value.codigo == "malformed"


def test_schema_como_boolean_e_malformed():
    # `bool` é subclasse de `int` em Python, mas não em Rust
    with pytest.raises(Recusado) as erro:
        ler('{"schema":true,"id":"a/b","version":"1","api": 3,"repo":"r","client":"c.js"}')
    assert erro.value.codigo == "malformed"


def test_reach_com_item_nao_texto_e_malformed():
    with pytest.raises(Recusado) as erro:
        ler('{"schema":1,"id":"a/b","version":"1","api": 3,"repo":"r","reach":[123],"client":"c.js"}')
    assert erro.value.codigo == "malformed"


# Rodada de correção 2: null em campos obrigatórios e ranges de u32

def test_schema_nulo_e_malformed():
    # `null` em campo obrigatório deve recusar, não tratar como ausente
    with pytest.raises(Recusado) as erro:
        ler('{"schema":null,"id":"a/b","version":"1","api": 3,"repo":"r","client":"c.js"}')
    assert erro.value.codigo == "malformed"


def test_id_nulo_e_malformed():
    with pytest.raises(Recusado) as erro:
        ler('{"schema":1,"id":null,"version":"1","api": 3,"repo":"r","client":"c.js"}')
    assert erro.value.codigo == "malformed"


def test_version_nulo_e_malformed():
    with pytest.raises(Recusado) as erro:
        ler('{"schema":1,"id":"a/b","version":null,"api": 3,"repo":"r","client":"c.js"}')
    assert erro.value.codigo == "malformed"


def test_api_nulo_e_malformed():
    with pytest.raises(Recusado) as erro:
        ler('{"schema":1,"id":"a/b","version":"1","api":null,"repo":"r","client":"c.js"}')
    assert erro.value.codigo == "malformed"


def test_repo_nulo_e_malformed():
    with pytest.raises(Recusado) as erro:
        ler('{"schema":1,"id":"a/b","version":"1","api": 3,"repo":null,"client":"c.js"}')
    assert erro.value.codigo == "malformed"


def test_reach_nulo_e_malformed():
    # `reach` tem default [], mas `null` é diferente de ausente
    with pytest.raises(Recusado) as erro:
        ler('{"schema":1,"id":"a/b","version":"1","api": 3,"repo":"r","reach":null,"client":"c.js"}')
    assert erro.value.codigo == "malformed"


def test_state_nulo_e_tratado_como_ausente():
    # `state` é `Option<T>` no Rust: `null` é equivalente a ausente
    m = ler('{"schema":1,"id":"a/b","version":"1","api": 3,"repo":"r","state":null,"client":"c.js"}')
    assert m.state is None


def test_client_nulo_e_tratado_como_ausente():
    # `client` é `Option<T>`: `null` é equivalente a ausente, mas `server` garante validez
    m = ler('{"schema":1,"id":"a/b","version":"1","api": 3,"repo":"r","client":null,"server":"s.js"}')
    assert m.client is None
    assert m.server == "s.js"


def test_server_nulo_e_tratado_como_ausente():
    # `server` é `Option<T>`: `null` é equivalente a ausente, mas `client` garante validez
    m = ler('{"schema":1,"id":"a/b","version":"1","api": 3,"repo":"r","server":null,"client":"c.js"}')
    assert m.server is None
    assert m.client == "c.js"


def test_schema_negativo_e_malformed():
    with pytest.raises(Recusado) as erro:
        ler('{"schema":-1,"id":"a/b","version":"1","api": 3,"repo":"r","client":"c.js"}')
    assert erro.value.codigo == "malformed"


def test_api_negativo_e_malformed():
    with pytest.raises(Recusado) as erro:
        ler('{"schema":1,"id":"a/b","version":"1","api":-1,"repo":"r","client":"c.js"}')
    assert erro.value.codigo == "malformed"


def test_state_negativo_e_malformed():
    with pytest.raises(Recusado) as erro:
        ler('{"schema":1,"id":"a/b","version":"1","api": 3,"repo":"r","state":-1,"client":"c.js"}')
    assert erro.value.codigo == "malformed"


def test_state_acima_u32_max_e_malformed():
    # u32::MAX = 4294967295; u32::MAX + 1 = 4294967296
    with pytest.raises(Recusado) as erro:
        ler('{"schema":1,"id":"a/b","version":"1","api": 3,"repo":"r","state":4294967296,"client":"c.js"}')
    assert erro.value.codigo == "malformed"


def test_state_igual_u32_max_e_aceito():
    # Prova que o limite não foi apertado demais: u32::MAX é válido
    m = ler('{"schema":1,"id":"a/b","version":"1","api": 3,"repo":"r","state":4294967295,"client":"c.js"}')
    assert m.state == 4294967295


@pytest.mark.parametrize("api", [0, 1, 2])
def test_api_retirada_e_recusada_antes_de_executar(api):
    import json
    manifesto = json.loads(VALIDO)
    manifesto["api"] = api
    with pytest.raises(Recusado) as erro:
        ler(json.dumps(manifesto))
    assert erro.value.codigo == "api-too-old"
    assert ler(json.dumps(manifesto), historico=True).api == api


# --------------------------------------------------------------- `arquivos`
#
# **O campo existia num lado só.** O produto declara `arquivos` desde a trilha
# sonora da MESA — campo real em `seele_proto::mods::Manifest`, com teto de
# dezesseis e caminho conferido. Aqui ele não estava em `CHAVES`, e um
# manifesto que o trouxesse era recusado como `malformed: chave desconhecida`.
#
# O modo como isso apareceu é o que vale registrar: não numa suíte, mas no
# `gerar.py` parando em cima do MESA 3.0.0, com a release do produto já
# publicada. O vetor cruzado entre os dois repositórios compara `api_oferecida`
# e `apis_aceitas` — números —, e nada compara o conjunto de chaves que cada
# lado aceita. Enquanto isso não existir, esta divergência volta.

def _com_arquivos(arquivos: str) -> str:
    return (
        '{"schema":1,"id":"a/b","version":"1","api":4,'
        '"repo":"https://example.invalid/x","client":"c.js","arquivos":' + arquivos + "}"
    )


def test_arquivos_declarados_sao_lidos():
    m = ler(_com_arquivos('["som/combate.wav", "capa.png"]'))
    assert m.arquivos == ["som/combate.wav", "capa.png"]


def test_arquivos_ausente_e_lista_vazia():
    # `#[serde(default)]` lá: ausente não é recusa, é `[]`.
    assert ler('{"schema":1,"id":"a/b","version":"1","api":4,'
               '"repo":"https://example.invalid/x","client":"c.js"}').arquivos == []


@pytest.mark.parametrize("fora", ['["../fora.wav"]', '["/etc/senha"]', '[""]', '["."]',
                                  '["a/./b"]', '["C:/x"]'])
def test_um_arquivo_que_sai_da_pasta_e_malformed(fora):
    # Espelho de `um_arquivo_que_sobe_de_pasta_e_recusado_no_manifesto`.
    with pytest.raises(Recusado) as erro:
        ler(_com_arquivos(fora))
    assert erro.value.codigo == "malformed"
    # E diz **qual**: com dezesseis na lista, «um deles» não ajuda quem conserta.
    assert "arquivos[0]" in erro.value.detalhe


def test_arquivos_acima_do_teto_e_malformed():
    with pytest.raises(Recusado) as erro:
        ler(_com_arquivos(str(["f%d.png" % n for n in range(17)]).replace("'", '"')))
    assert erro.value.codigo == "malformed"


def test_arquivos_com_item_nao_texto_e_malformed():
    with pytest.raises(Recusado) as erro:
        ler(_com_arquivos("[123]"))
    assert erro.value.codigo == "malformed"


def test_arquivos_como_texto_em_vez_de_lista_e_malformed():
    with pytest.raises(Recusado) as erro:
        ler(_com_arquivos('"som/combate.wav"'))
    assert erro.value.codigo == "malformed"
