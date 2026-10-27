"""As recusas de `read_manifest`, espelhadas.

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


# ----------------------------------------------------- a API 6 e a porta do tema
#
# Espelho do corte da API 6 no produto (`seele_proto::mods`, ramo
# `0.16/api-6-corte` do SEELE). Lá, `MOD_API_VERSION = 6` e `APIS_ACEITAS` é só
# a `[6]` da linha 1; aqui o conjunto é **a união das linhas** que o launcher
# roda (`APIS_POR_LINHA`: a 1 com a 6, a 0.15 com a 5, a 4 e a 3), porque o
# catálogo serve as duas. E a chave `tema`: um `bool` com `#[serde(default)]`,
# recusado sem metade de servidor (`Refused::TemaSemMetadeDeServidor`).

def _api6(**extra) -> str:
    import json
    manifesto = {"schema": 1, "id": "seele/estilo", "version": "4.0.0", "api": 6,
                 "repo": "https://example.invalid/x"}
    manifesto.update(extra)
    return json.dumps(manifesto)


def test_o_indexador_oferece_a_7_e_aceita_a_uniao_das_linhas():
    # A 0.17 (`APIS_POR_LINHA` do SEELE): a linha 2 com a 7 e a 6, a 1 com a 6,
    # a 0.15 com a 5, a 4 e a 3.
    from ferramentas.manifesto import APIS_ACEITAS
    assert VERSAO_DA_API == 7
    assert APIS_ACEITAS == (7, 6, 5, 4, 3)


def test_um_manifesto_da_api_6_e_lido():
    assert ler(_api6(client="c.js")).api == 6


def test_tema_com_metade_de_servidor_e_lido():
    assert ler(_api6(server="servidor/main.js", tema=True)).tema is True


def test_sem_a_chave_tema_vale_false():
    # `#[serde(default)]` lá: ausente é `false`, e não recusa.
    assert ler(_api6(client="c.js")).tema is False


def test_tema_false_sem_servidor_continua_valendo():
    assert ler(_api6(client="c.js", tema=False)).tema is False


@pytest.mark.parametrize("tema", [None, 1, 0, "true"])
def test_tema_que_nao_e_booleano_e_malformed(tema):
    # `null` também: o campo não é `Option<bool>`, e o `serde` não o desserializa.
    with pytest.raises(Recusado) as erro:
        ler(_api6(server="s.js", tema=tema))
    assert erro.value.codigo == "malformed"


@pytest.mark.parametrize("chave", ["schema", "api", "state"])
def test_as_chaves_inteiras_continuam_recusando_booleano(chave):
    # A conferência de tipo deixou de recusar **todo** booleano, para o `tema`
    # passar. Nas chaves u32 ela continua: `true` não é um u32 no Rust.
    with pytest.raises(Recusado) as erro:
        ler(_api6(client="c.js", **{chave: True}))
    assert erro.value.codigo == "malformed"


def test_tema_sem_metade_de_servidor_e_recusado():
    with pytest.raises(Recusado) as erro:
        ler(_api6(client="c.js", tema=True))
    assert erro.value.codigo == "tema-sem-metade-de-servidor"


def test_tema_sem_metade_nenhuma_e_empty_antes():
    # A ordem do Rust: `empty` vem antes da porta do tema.
    with pytest.raises(Recusado) as erro:
        ler(_api6(tema=True))
    assert erro.value.codigo == "empty"


@pytest.mark.parametrize("api", [3, 4, 5])
def test_tema_numa_api_da_linha_0_15_e_malformed(api):
    # A linha 0.15 não conhece a chave e a recusa (`deny_unknown_fields`), e a
    # linha 1 não aceita a API dela: um pacote assim não instala em build
    # nenhuma, e não entra no catálogo.
    with pytest.raises(Recusado) as erro:
        ler(_api6(api=api, server="s.js", tema=True))
    assert erro.value.codigo == "malformed"
    assert "tema" in erro.value.detalhe


@pytest.mark.parametrize("api", [3, 4, 5])
def test_a_linha_0_15_continua_publicavel(api):
    assert ler(_api6(api=api, client="c.js")).api == api


# ------------------------------------------------- a API 7 e as permissões
#
# Espelho de `seele_proto::mods::read_manifest` na 0.17 e de
# `seele_proto::cargos::validar_declaradas`: `permissoes` é uma lista de
# `PermissaoDeclarada { acao, nome, todos }` (`deny_unknown_fields`, `todos`
# com `#[serde(default)]`), só da API 7 em diante, até 8 por MOD, ação
# `[a-z0-9-]` de 1 a 32 bytes sem `-` nas pontas, nome não vazio de até 48
# bytes sem caractere de controle, sem ação repetida.

def _api7(*permissoes, **extra) -> str:
    import json
    manifesto = {"schema": 1, "id": "seele/mesa", "version": "5.0.0", "api": 7,
                 "repo": "https://example.invalid/x", "client": "c.js"}
    if permissoes:
        manifesto["permissoes"] = list(permissoes)
    manifesto.update(extra)
    return json.dumps(manifesto)


FECHAR = {"acao": "fechar-mesa", "nome": "Fechar a mesa"}


def _recusa(texto: str) -> Recusado:
    with pytest.raises(Recusado) as erro:
        ler(texto)
    return erro.value


def test_um_manifesto_da_api_7_com_permissao_e_lido():
    from ferramentas.manifesto import PermissaoDeclarada
    m = ler(_api7(FECHAR))
    assert m.api == 7
    assert m.permissoes == [PermissaoDeclarada(acao="fechar-mesa", nome="Fechar a mesa", todos=False)]


def test_todos_sem_a_chave_vale_false_e_com_ela_vale_o_que_diz():
    assert ler(_api7({**FECHAR, "todos": True})).permissoes[0].todos is True
    assert ler(_api7({**FECHAR, "todos": False})).permissoes[0].todos is False


def test_a_api_7_sem_permissoes_e_lida_com_a_lista_vazia():
    assert ler(_api7()).permissoes == []
    assert ler(_api7(permissoes=[])).permissoes == []


def test_um_mod_da_api_6_continua_aceito_sem_permissoes():
    # A 7 é alargamento: um pacote da 6 não precisa ser republicado.
    m = ler(_api6(server="servidor/main.js", tema=True))
    assert m.api == 6 and m.permissoes == []


def test_a_api_7_com_tema_e_permissoes_e_lida():
    m = ler(_api7(FECHAR, server="servidor/main.js", tema=True))
    assert m.tema is True and len(m.permissoes) == 1


def test_os_tetos_exatos_passam():
    oito = [{"acao": f"acao-{n}", "nome": f"Ação {n}"} for n in range(8)]
    assert len(ler(_api7(*oito)).permissoes) == 8
    assert ler(_api7({"acao": "a" * 32, "nome": "N"})).permissoes[0].acao == "a" * 32
    assert ler(_api7({"acao": "a", "nome": "n" * 48})).permissoes[0].nome == "n" * 48
    # 48 **bytes**: 24 «ç» são 48 bytes em UTF-8.
    assert ler(_api7({"acao": "a", "nome": "ç" * 24})).permissoes[0].nome == "ç" * 24
    assert ler(_api7({"acao": "0-9", "nome": "  com espaço  "})).permissoes[0].acao == "0-9"


@pytest.mark.parametrize("api", [3, 4, 5, 6])
def test_permissoes_sem_a_api_7_sao_recusadas(api):
    erro = _recusa(_api7(FECHAR, api=api))
    assert erro.codigo == "permissoes-pedem-api-nova"


@pytest.mark.parametrize("api", [3, 4, 5, 6])
def test_a_lista_vazia_abaixo_da_7_e_malformed(api):
    # Mais estrito que o Rust da 0.17 (lá passa), porque o app 0.16 recusa o
    # manifesto inteiro só por ter a chave, e um pacote da 6 é oferecido a ele.
    erro = _recusa(_api7(api=api, permissoes=[]))
    assert erro.codigo == "malformed"
    assert "permissoes" in erro.detalhe


def test_sem_api_e_malformed():
    import json
    sem_api = json.loads(_api7(FECHAR))
    del sem_api["api"]
    assert _recusa(json.dumps(sem_api)).codigo == "malformed"


def test_a_api_8_e_api_too_new_mesmo_com_permissoes():
    assert _recusa(_api7(FECHAR, api=8)).codigo == "api-too-new"


def test_nove_permissoes_e_permissoes_invalidas():
    nove = [{"acao": f"acao-{n}", "nome": f"Ação {n}"} for n in range(9)]
    erro = _recusa(_api7(*nove))
    assert erro.codigo == "permissoes-invalidas"
    assert "9" in erro.detalhe


@pytest.mark.parametrize("acao", ["", "Fechar Mesa", "fechar_mesa", "-a", "a-", "-", "a" * 33,
                                  "ação", "a b", "x²", "١"])
def test_acao_fora_da_regra_e_permissoes_invalidas(acao):
    assert _recusa(_api7({"acao": acao, "nome": "N"})).codigo == "permissoes-invalidas"


@pytest.mark.parametrize("nome", ["", "   ", "\t\n", "n" * 49, "ç" * 25, "sino\x07", "linha\nnova", "\x7f"])
def test_nome_fora_da_regra_e_permissoes_invalidas(nome):
    assert _recusa(_api7({"acao": "a", "nome": nome})).codigo == "permissoes-invalidas"


def test_acao_repetida_e_permissoes_invalidas_na_segunda():
    erro = _recusa(_api7(FECHAR, {**FECHAR, "nome": "Outro nome"}))
    assert erro.codigo == "permissoes-invalidas"
    assert "permissoes[1]" in erro.detalhe


def test_a_primeira_recusa_vale_na_ordem_do_rust():
    # O teto vem antes de qualquer entrada.
    nove_tortas = [{"acao": "X", "nome": ""} for _ in range(9)]
    assert "9" in _recusa(_api7(*nove_tortas)).detalhe
    # Numa entrada, a ação antes do nome; entre entradas, a de posição menor.
    assert "ação" in _recusa(_api7({"acao": "X", "nome": ""})).detalhe
    assert "permissoes[0]" in _recusa(_api7({"acao": "a", "nome": ""}, {"acao": "B", "nome": "N"})).detalhe
    # `PermissoesPedemApiNova` antes de `PermissoesInvalidas`.
    assert _recusa(_api7({"acao": "X", "nome": "N"}, api=6)).codigo == "permissoes-pedem-api-nova"
    # E as duas depois de `empty` e da porta do tema.
    assert _recusa(_api7({"acao": "X", "nome": "N"}, client=None)).codigo == "empty"
    assert _recusa(_api7({"acao": "X", "nome": "N"}, tema=True)).codigo == "tema-sem-metade-de-servidor"


@pytest.mark.parametrize("entrada", [
    {**FECHAR, "admin": True},                        # chave desconhecida
    {"acao": "a"},                                    # falta nome
    {"nome": "N"},                                    # falta acao
    {"acao": 1, "nome": "N"},
    {"acao": "a", "nome": None},
    {"acao": None, "nome": "N"},
    {**FECHAR, "todos": None},                        # `bool`, e não `Option<bool>`
    {**FECHAR, "todos": "true"},
    {**FECHAR, "todos": 1},
    "fechar-mesa",
    None,
    ["fechar-mesa", "Fechar"],
])
def test_entrada_que_o_serde_nao_desserializa_e_malformed(entrada):
    assert _recusa(_api7(entrada)).codigo == "malformed"


@pytest.mark.parametrize("permissoes", [None, {}, "fechar-mesa", 1, True])
def test_permissoes_que_nao_e_lista_e_malformed(permissoes):
    assert _recusa(_api7(permissoes=permissoes)).codigo == "malformed"


def test_malformed_vem_antes_da_api_das_permissoes():
    # O `serde` falha antes de o `read_manifest` olhar a API.
    assert _recusa(_api7({**FECHAR, "admin": True}, api=6)).codigo == "malformed"


@pytest.mark.parametrize("escape", [r"\ud800", r"\udbff", r"\udc00", r"\udfff",
                                    r"\ude00\ud83d", r"N\ud800", r"\ud800N"])
@pytest.mark.parametrize("chave", ["acao", "nome"])
def test_surrogate_isolado_e_malformed_e_nao_excecao_crua(chave, escape):
    # O `serde_json` recusa o JSON com surrogate solto (alto ou baixo, ou o par
    # na ordem errada); o `json` do Python o aceita, e o `encode` da conta de
    # bytes estourava `UnicodeEncodeError` em vez de recusar.
    entrada = {"acao": "a", "nome": "N"}
    entrada[chave] = "SURROGATE"
    texto = _api7(entrada).replace("SURROGATE", escape)
    erro = _recusa(texto)
    assert erro.codigo == "malformed"
    assert f"permissoes[0].{chave}" in erro.detalhe


def test_par_de_surrogates_valido_e_um_caractere_de_quatro_bytes():
    # `😀` é «😀», 4 bytes em UTF-8: 12 cabem nos 48, 13 não.
    doze = _api7({"acao": "a", "nome": "PAR"}).replace("PAR", r"😀" * 12)
    assert ler(doze).permissoes[0].nome == "😀" * 12
    assert ler(_api7({"acao": "a", "nome": "😀" * 12})).permissoes[0].nome == "😀" * 12
    treze = _api7({"acao": "a", "nome": "PAR"}).replace("PAR", r"😀" * 13)
    assert _recusa(treze).codigo == "permissoes-invalidas"
    # Um caractere válido fora do ASCII continua valendo, escrito ou escapado.
    assert ler(_api7({"acao": "a", "nome": "Mesa ç 中"})).permissoes[0].nome == "Mesa ç 中"


def test_chave_repetida_numa_permissao_e_malformed():
    # O `serde` recusa o campo duplicado; o `json` do Python ficaria com o
    # último e daria a permissão a todo mundo.
    texto = ('{"schema":1,"id":"seele/mesa","version":"5.0.0","api":7,"repo":"r","client":"c.js",'
             '"permissoes":[{"acao":"a","nome":"N","todos":false,"todos":true}]}')
    erro = _recusa(texto)
    assert erro.codigo == "malformed"
    assert "todos" in erro.detalhe
