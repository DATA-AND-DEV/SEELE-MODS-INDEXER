"""As cinco recusas de `read_manifest`, espelhadas.

Os nomes dos códigos são os de `seele_core::mods::refusal_name` e não podem
divergir: eles atravessam para o `frases.js`, e um código sem frase mostra o
identificador cru para quem lê."""

import pytest

from ferramentas.recusa import Recusado
from ferramentas.manifesto import ler

VALIDO = """
{
  "schema": 1, "id": "juli/cinza-frio", "version": "2.1.0", "api": 1,
  "repo": "https://github.com/juli/seele-cinza-frio",
  "reach": ["trocar as cores da interface"],
  "client": "cliente/main.js"
}
"""


def test_um_manifesto_valido_e_lido():
    m = ler(VALIDO)
    assert m.id == "juli/cinza-frio"
    assert m.api == 1
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
        ler('{"schema":1,"id":"a/b","version":"1","api":1,"repo":"r","cliente":"x"}')
    assert erro.value.codigo == "malformed"


def test_esquema_do_futuro_e_schema_too_new():
    with pytest.raises(Recusado) as erro:
        ler('{"schema":2,"id":"a/b","version":"1","api":1,"repo":"r","client":"c.js"}')
    assert erro.value.codigo == "schema-too-new"


def test_api_do_futuro_e_api_too_new():
    with pytest.raises(Recusado) as erro:
        ler('{"schema":1,"id":"a/b","version":"1","api":2,"repo":"r","client":"c.js"}')
    assert erro.value.codigo == "api-too-new"


@pytest.mark.parametrize(
    "identificador",
    ["semdivisao", "a/b/c", "/b", "a/", "Maiuscula/b", "a/com_underline", "a/com espaço"],
)
def test_id_torto_e_malformed_id(identificador):
    texto = '{"schema":1,"id":"%s","version":"1","api":1,"repo":"r","client":"c.js"}' % identificador
    with pytest.raises(Recusado) as erro:
        ler(texto)
    assert erro.value.codigo == "malformed-id"


@pytest.mark.parametrize("identificador", ["a/b", "seele/rpg", "kae-2/glifos-osso", "a1/b2"])
def test_id_bem_formado_passa(identificador):
    texto = '{"schema":1,"id":"%s","version":"1","api":1,"repo":"r","client":"c.js"}' % identificador
    assert ler(texto).id == identificador


def test_sem_nenhuma_metade_e_empty():
    with pytest.raises(Recusado) as erro:
        ler('{"schema":1,"id":"a/b","version":"1","api":1,"repo":"r"}')
    assert erro.value.codigo == "empty"


def test_so_a_metade_do_servidor_basta():
    m = ler('{"schema":1,"id":"a/b","version":"1","api":1,"repo":"r","server":"s.js"}')
    assert m.client is None
    assert m.server == "s.js"
