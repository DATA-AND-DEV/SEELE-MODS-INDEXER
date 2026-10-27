"""O vetor que o `a_api_dos_mods_nao_diverge` do SEELE lê."""

import json

from ferramentas import api_do_indexador, manifesto


def test_o_vetor_traz_o_que_o_catalogo_anuncia():
    vetor = api_do_indexador.vetor()
    assert vetor["api_oferecida"] == manifesto.VERSAO_DA_API == 7
    assert vetor["apis_aceitas"] == list(manifesto.APIS_ACEITAS) == [7, 6, 5, 4, 3]


def test_o_vetor_segue_a_constante_e_nao_um_numero_guardado(monkeypatch):
    # Se o vetor tivesse o número escrito, ele seria a terceira cópia.
    monkeypatch.setattr(manifesto, "VERSAO_DA_API", 9)
    monkeypatch.setattr(manifesto, "APIS_ACEITAS", (9, 8))
    assert api_do_indexador.vetor()["api_oferecida"] == 9
    assert api_do_indexador.vetor()["apis_aceitas"] == [9, 8]


def test_escreve_as_chaves_que_o_seele_le(tmp_path):
    saida = tmp_path / "fora" / "api-do-indexador.json"
    api_do_indexador.escrever(saida)
    lido = json.loads(saida.read_text(encoding="utf-8"))
    assert list(lido) == ["api_oferecida", "de", "simbolo", "porque", "apis_aceitas"]
    assert lido["simbolo"] == "VERSAO_DA_API"
    # ASCII puro, como a cópia que já está no SEELE (`-text` no `.gitattributes`).
    assert saida.read_bytes().isascii()
