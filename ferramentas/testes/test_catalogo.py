import pytest

from ferramentas.avaliacoes import Avaliacao, Versao
from ferramentas.catalogo import ESQUEMA, VersaoPronta, conferir_append_only, montar
from ferramentas.recusa import Recusado

COMMIT = "4f9a1c0e8b7d6a5f4e3d2c1b0a9f8e7d6c5b4a39"


def avaliacao(nivel="verificado", notas=()):
    return Avaliacao(
        id="juli/cinza-frio", autor="juli", nome="cinza-frio",
        repo="https://github.com/juli/seele-cinza-frio",
        titulo="Cinza Frio", resumo="Contraste alto.",
        versoes=[Versao("2.1.0", COMMIT, nivel, list(notas), 1757000000)],
    )


def pronta(hash_="a" * 64, nivel="verificado", notas=()):
    return {
        ("juli/cinza-frio", "2.1.0"): VersaoPronta(
            versao="2.1.0", api=1, publicado_em=1757000000, hash=hash_,
            alcanca=["trocar as cores"], arquivos=["cliente/main.js", "mod.json"],
            nivel=nivel, notas=list(notas),
        )
    }


def test_monta_um_catalogo_com_o_esquema_certo():
    c = montar([avaliacao()], pronta(), gerado_em=1757100000)
    assert c["esquema"] == ESQUEMA
    assert c["gerado_em"] == 1757100000
    assert len(c["mods"]) == 1


def test_o_mod_carrega_id_autor_nome_e_repo():
    m = montar([avaliacao()], pronta(), 1757100000)["mods"][0]
    assert m["id"] == "juli/cinza-frio"
    assert m["autor"] == "juli"
    assert m["nome"] == "cinza-frio"
    assert m["repo"] == "https://github.com/juli/seele-cinza-frio"


def test_nivel_e_commit_ficam_no_mod():
    m = montar([avaliacao()], pronta(), 1757100000)["mods"][0]
    assert m["nivel"] == "verificado"
    assert m["commit"] == COMMIT
    assert m["oficial"] is False


def test_oficial_e_verdadeiro_so_no_nivel_oficial():
    m = montar([avaliacao("oficial")], pronta(nivel="oficial"), 1757100000)["mods"][0]
    assert m["nivel"] == "oficial"
    assert m["oficial"] is True


def test_alcanca_fica_por_versao_e_nao_por_mod():
    # `mod.json` é por versão: uma versão que passa a alcançar a rede tem de
    # poder dizer isso sem reescrever o que a anterior alcançava.
    m = montar([avaliacao()], pronta(), 1757100000)["mods"][0]
    assert "alcanca" not in m
    assert m["versoes"][0]["alcanca"] == ["trocar as cores"]


def test_arquivos_saem_ordenados():
    # A lista é o que o cliente busca; ordem estável é o que torna dois
    # catálogos comparáveis com diff.
    v = montar([avaliacao()], pronta(), 1757100000)["mods"][0]["versoes"][0]
    assert v["arquivos"] == ["cliente/main.js", "mod.json"]


def test_uma_versao_sem_bytes_prontos_e_omitida():
    c = montar([avaliacao()], {}, 1757100000)
    assert c["mods"] == []


def test_append_only_aceita_versao_nova():
    anterior = montar([avaliacao()], pronta(), 1757000000)
    dupla = avaliacao()
    dupla.versoes.append(Versao("2.2.0", "b" * 40, "verificado", [], 1757000001))
    prontas = pronta()
    prontas[("juli/cinza-frio", "2.2.0")] = VersaoPronta(
        "2.2.0", 1, 1757000001, "c" * 64, [], ["mod.json"], "verificado", []
    )
    conferir_append_only(montar([dupla], prontas, 1757100000), anterior)


def test_append_only_recusa_hash_trocado():
    anterior = montar([avaliacao()], pronta(hash_="a" * 64), 1757000000)
    novo = montar([avaliacao()], pronta(hash_="d" * 64), 1757100000)
    with pytest.raises(Recusado) as erro:
        conferir_append_only(novo, anterior)
    assert erro.value.codigo == "versao-editada"
    assert "2.1.0" in erro.value.detalhe


def test_append_only_recusa_versao_sumida():
    # Uma versão que some do catálogo é uma revogação disfarçada, e revogação
    # tem lista própria, com motivo e com `corrigido_em`.
    anterior = montar([avaliacao()], pronta(), 1757000000)
    with pytest.raises(Recusado) as erro:
        conferir_append_only(montar([], {}, 1757100000), anterior)
    assert erro.value.codigo == "versao-sumida"


def test_append_only_passa_sem_anterior():
    conferir_append_only(montar([avaliacao()], pronta(), 1757100000), None)
