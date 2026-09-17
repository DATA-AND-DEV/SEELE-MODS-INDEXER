import pytest

from ferramentas.avaliacoes import Avaliacao, Versao
from ferramentas.catalogo import ESQUEMA, VersaoPronta, conferir_append_only, montar
from ferramentas.manifesto import VERSAO_DA_API
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


def test_nivel_e_oficial_vem_da_versao_mais_recente_por_avaliado_em():
    # `Avaliacao.versoes` preserva a ordem do TOML. `[-1]` seria a última do
    # arquivo, não a de maior `avaliado_em`. Uma versão antiga `com-notas`
    # acrescentada ao fim daria a um MOD novo `oficial` um selo melhor do que
    # merece. O selo é o que alguém lê para decidir instalar — deixá-lo
    # depender da ordem de edição de um arquivo daria a quem edita um poder
    # que a avaliação não lhe deu.
    # Caso 1: versão oficial é a mais recente por data, mas aparece primeiro na lista.
    a = Avaliacao(
        id="x/y", autor="x", nome="y",
        repo="https://github.com/x/y",
        titulo="Y", resumo="Resumo.",
        versoes=[
            Versao("2.2.0", "a" * 40, "oficial", [], 1757000002),
            Versao("2.1.0", "b" * 40, "com-notas", ["nota"], 1757000000),
        ],
    )
    p = {
        ("x/y", "2.2.0"): VersaoPronta("2.2.0", 1, 1757000002, "a" * 64, [], ["mod.json"], "oficial", []),
        ("x/y", "2.1.0"): VersaoPronta("2.1.0", 1, 1757000000, "b" * 64, [], ["mod.json"], "com-notas", ["nota"]),
    }
    m = montar([a], p, 1757100000)["mods"][0]
    assert m["nivel"] == "oficial"
    assert m["oficial"] is True

    # Caso 2: versão com-notas é a mais recente por data (primeiro na lista),
    # mas uma versão antiga oficial vem por ÚLTIMO no arquivo. Com a.versoes[-1]
    # pegaria a versão antiga official (errado); com max por avaliado_em, pega
    # a recente com-notas (certo). Esse é o sentido perigoso: o selo é o que
    # alguém lê para decidir instalar.
    a2 = Avaliacao(
        id="x/z", autor="x", nome="z",
        repo="https://github.com/x/z",
        titulo="Z", resumo="Resumo.",
        versoes=[
            Versao("2.0.0", COMMIT, "com-notas", ["fala-com-terceiro"], 3000),
            Versao("1.0.0", COMMIT, "oficial", [], 1000),
        ],
    )
    p2 = {
        ("x/z", "2.0.0"): VersaoPronta("2.0.0", 1, 3000, "d" * 64, [], ["mod.json"], "com-notas", ["fala-com-terceiro"]),
        ("x/z", "1.0.0"): VersaoPronta("1.0.0", 1, 1000, "c" * 64, [], ["mod.json"], "oficial", []),
    }
    m2 = montar([a2], p2, 1757100000)["mods"][0]
    assert m2["nivel"] == "com-notas"
    assert m2["oficial"] is False
    assert m2["notas"] == ["fala-com-terceiro"]


def test_arquivos_fora_de_ordem_saem_ordenados():
    # A ordem existe para que dois catálogos sejam comparáveis com diff.
    # Arquivos passados desordenados devem sair ordenados.
    p = {
        ("juli/cinza-frio", "2.1.0"): VersaoPronta(
            versao="2.1.0", api=1, publicado_em=1757000000, hash="a" * 64,
            alcanca=[], arquivos=["mod.json", "cliente/main.js"],  # Fora de ordem
            nivel="verificado", notas=[],
        )
    }
    v = montar([avaliacao()], p, 1757100000)["mods"][0]["versoes"][0]
    assert v["arquivos"] == ["cliente/main.js", "mod.json"]


# --- A avaliação por versão -------------------------------------------------
#
# Duas versões do mesmo MOD com vereditos DIFERENTES: é a única forma de um
# teste enxergar mistura de metadados. Com as duas iguais, publicar o nível do
# MOD no lugar do nível da versão passa despercebido.

COMMIT_ANTIGO = "0f1e2d3c4b5a69788796a5b4c3d2e1f009182736"


def avaliacao_de_duas_versoes():
    return Avaliacao(
        id="juli/cinza-frio", autor="juli", nome="cinza-frio",
        repo="https://github.com/juli/seele-cinza-frio",
        titulo="Cinza Frio", resumo="Contraste alto.",
        versoes=[
            Versao("1.0.0", COMMIT_ANTIGO, "com-notas", ["fala-com-terceiro"], 1757000000),
            Versao("2.0.0", COMMIT, "oficial", [], 1757000900),
        ],
    )


def prontas_de_duas_versoes():
    return {
        ("juli/cinza-frio", "1.0.0"): VersaoPronta(
            versao="1.0.0", api=1, publicado_em=1757000000, hash="c" * 64,
            alcanca=["falar com um serviço de fora"], arquivos=["mod.json"],
            nivel="com-notas", notas=["fala-com-terceiro"],
        ),
        ("juli/cinza-frio", "2.0.0"): VersaoPronta(
            versao="2.0.0", api=1, publicado_em=1757000900, hash="d" * 64,
            alcanca=[], arquivos=["mod.json"],
            nivel="oficial", notas=[],
        ),
    }


def _por_numero(mod):
    return {v["versao"]: v for v in mod["versoes"]}


def test_cada_versao_carrega_o_proprio_nivel():
    m = montar([avaliacao_de_duas_versoes()], prontas_de_duas_versoes(), 1757100000)["mods"][0]
    versoes = _por_numero(m)
    assert versoes["1.0.0"]["nivel"] == "com-notas"
    assert versoes["2.0.0"]["nivel"] == "oficial"


def test_cada_versao_carrega_as_proprias_notas():
    # Uma ressalva encontrada na 1.0.0 não some porque a 2.0.0 passou limpa.
    m = montar([avaliacao_de_duas_versoes()], prontas_de_duas_versoes(), 1757100000)["mods"][0]
    versoes = _por_numero(m)
    assert versoes["1.0.0"]["notas"] == ["fala-com-terceiro"]
    assert versoes["2.0.0"]["notas"] == []


def test_cada_versao_carrega_o_proprio_commit_avaliado():
    # O commit é o que faz a avaliação valer: mostrar o commit da versão nova
    # ao lado do hash da versão velha é afirmar que revisamos bytes que não
    # são os que estão sendo servidos ali.
    m = montar([avaliacao_de_duas_versoes()], prontas_de_duas_versoes(), 1757100000)["mods"][0]
    versoes = _por_numero(m)
    assert versoes["1.0.0"]["commit"] == COMMIT_ANTIGO
    assert versoes["2.0.0"]["commit"] == COMMIT


def test_a_avaliacao_da_versao_nunca_e_a_do_mod_quando_elas_diferem():
    # O guarda direto contra a mistura: se alguém voltar a publicar o veredito
    # do MOD dentro de cada versão, estes três pares ficam iguais e o teste cai.
    m = montar([avaliacao_de_duas_versoes()], prontas_de_duas_versoes(), 1757100000)["mods"][0]
    antiga = _por_numero(m)["1.0.0"]
    assert m["nivel"] == "oficial"
    assert antiga["nivel"] != m["nivel"]
    assert antiga["notas"] != m["notas"]
    assert antiga["commit"] != m["commit"]


def test_o_mod_continua_descrevendo_a_avaliacao_mais_recente():
    # Os campos antigos não mudam de sentido: quem já lê `mod.nivel` continua
    # lendo «o que a avaliação mais recente achou».
    m = montar([avaliacao_de_duas_versoes()], prontas_de_duas_versoes(), 1757100000)["mods"][0]
    assert m["nivel"] == "oficial"
    assert m["oficial"] is True
    assert m["notas"] == []
    assert m["commit"] == COMMIT


def test_as_notas_da_versao_saem_em_copia():
    # A saída é serializada e assinada; se ela apontasse para a lista da
    # avaliação, mexer numa mexeria na outra sem nenhum aviso.
    prontas = prontas_de_duas_versoes()
    m = montar([avaliacao_de_duas_versoes()], prontas, 1757100000)["mods"][0]
    _por_numero(m)["1.0.0"]["notas"].append("guarda-dados-na-maquina")
    assert prontas[("juli/cinza-frio", "1.0.0")].notas == ["fala-com-terceiro"]


def test_append_only_ignora_a_avaliacao_e_olha_so_o_hash():
    # Reavaliar uma versão publicada é legítimo — o que nunca muda são os
    # bytes. O guarda append-only não pode confundir as duas coisas.
    anterior = montar([avaliacao_de_duas_versoes()], prontas_de_duas_versoes(), 1757000000)
    reavaliada = avaliacao_de_duas_versoes()
    reavaliada.versoes[0] = Versao("1.0.0", COMMIT_ANTIGO, "verificado", [], 1757000000)
    prontas = prontas_de_duas_versoes()
    velha = prontas[("juli/cinza-frio", "1.0.0")]
    prontas[("juli/cinza-frio", "1.0.0")] = VersaoPronta(
        versao=velha.versao, api=velha.api, publicado_em=velha.publicado_em,
        hash=velha.hash, alcanca=list(velha.alcanca), arquivos=list(velha.arquivos),
        nivel="verificado", notas=[],
    )
    novo = montar([reavaliada], prontas, 1757100000)
    conferir_append_only(novo, anterior)
    assert _por_numero(novo["mods"][0])["1.0.0"]["nivel"] == "verificado"


def test_o_catalogo_carrega_a_api_que_este_indexador_oferece():
    """O guarda contra a divergência que custou a primeira publicação.

    `VERSAO_DA_API` aqui e `MOD_API_VERSION` no SEELE são espelho um do outro,
    em repositórios diferentes, sem nada os amarrando — e quando o segundo foi
    a 2, este ficou em 1. O catálogo é o único arquivo que atravessa os dois,
    e o teste de vetor do SEELE compara este número com o dele."""
    catalogo = montar([], {}, 1)
    assert catalogo["api_oferecida"] == VERSAO_DA_API
