import json
from pathlib import Path

import pytest

from ferramentas.recusa import Recusado
from ferramentas.revogacoes import carregar_listas, montar

RAIZ = Path(__file__).resolve().parents[2]
LISTAS = json.loads((RAIZ / "listas.json").read_text(encoding="utf-8"))

UM_MOD = """
[[mods]]
id = "alguem/ruim"
versao = "1.2.0"
motivo = "credencial-vazada"
desde = 1757050000
corrigido_em = "1.2.1"
"""

UM_PRODUTO = """
[[versoes_do_produto]]
versao = "0.11.2"
motivo = "leitura-de-disco-fora-da-pasta"
desde = 1757050000
corrigido_em = "0.11.3"
"""


def test_vazio_produz_as_duas_listas_vazias():
    r = montar("", LISTAS, 1757100000)
    assert r == {"esquema": 1, "gerado_em": 1757100000, "mods": [], "versoes_do_produto": []}


def test_uma_revogacao_de_mod():
    r = montar(UM_MOD, LISTAS, 1757100000)
    assert r["mods"] == [
        {
            "id": "alguem/ruim", "versao": "1.2.0", "motivo": "credencial-vazada",
            "desde": 1757050000, "corrigido_em": "1.2.1",
        }
    ]


def test_uma_revogacao_de_versao_do_produto():
    r = montar(UM_PRODUTO, LISTAS, 1757100000)
    assert r["versoes_do_produto"][0]["versao"] == "0.11.2"


def test_as_duas_convivem_no_mesmo_arquivo():
    r = montar(UM_MOD + UM_PRODUTO, LISTAS, 1757100000)
    assert len(r["mods"]) == 1
    assert len(r["versoes_do_produto"]) == 1


def test_motivo_fora_da_lista_e_recusado():
    with pytest.raises(Recusado) as erro:
        montar(UM_MOD.replace("credencial-vazada", "porque-sim"), LISTAS, 1757100000)
    assert erro.value.codigo == "motivo-desconhecido"
    assert "porque-sim" in erro.value.detalhe


def test_motivo_como_frase_e_recusado():
    # «`motivo` é um identificador de uma lista fechada, e não uma frase.»
    with pytest.raises(Recusado) as erro:
        montar(UM_MOD.replace("credencial-vazada", "vazou a senha do autor"), LISTAS, 1757100000)
    assert erro.value.codigo == "motivo-desconhecido"


def test_corrigido_em_ausente_e_aceito_como_nulo():
    # Nem toda revogação tem conserto: um MOD retirado a pedido do autor não
    # tem versão para onde mandar quem lê.
    sem = UM_MOD.replace('corrigido_em = "1.2.1"\n', "")
    assert montar(sem, LISTAS, 1757100000)["mods"][0]["corrigido_em"] is None


def test_carregar_listas_le_do_arquivo():
    listas = carregar_listas(RAIZ)
    assert "credencial-vazada" in listas["motivos"]
    assert "fala-com-terceiro" in listas["notas"]


def test_mod_sem_id_e_recusado():
    # Campo obrigatório ausente é recusa, nunca valor-padrão. Um MOD sem id
    # é uma revogação que não revoga nada.
    sem_id = UM_MOD.replace('id = "alguem/ruim"\n', "")
    with pytest.raises(Recusado) as erro:
        montar(sem_id, LISTAS, 1757100000)
    assert erro.value.codigo == "revogacao-incompleta"
    assert "id" in erro.value.detalhe


def test_mod_sem_versao_e_recusado():
    # Campo obrigatório ausente é recusa, nunca valor-padrão.
    sem_versao = UM_MOD.replace('versao = "1.2.0"\n', "")
    with pytest.raises(Recusado) as erro:
        montar(sem_versao, LISTAS, 1757100000)
    assert erro.value.codigo == "revogacao-incompleta"
    assert "versao" in erro.value.detalhe


def test_mod_sem_desde_e_recusado():
    # Campo obrigatório ausente é recusa, nunca valor-padrão.
    sem_desde = UM_MOD.replace("desde = 1757050000\n", "")
    with pytest.raises(Recusado) as erro:
        montar(sem_desde, LISTAS, 1757100000)
    assert erro.value.codigo == "revogacao-incompleta"
    assert "desde" in erro.value.detalhe


def test_produto_sem_versao_e_recusado():
    # Campo obrigatório ausente é recusa, nunca valor-padrão.
    sem_versao = UM_PRODUTO.replace('versao = "0.11.2"\n', "")
    with pytest.raises(Recusado) as erro:
        montar(sem_versao, LISTAS, 1757100000)
    assert erro.value.codigo == "revogacao-incompleta"
    assert "versao" in erro.value.detalhe


def test_produto_sem_desde_e_recusado():
    # Campo obrigatório ausente é recusa, nunca valor-padrão.
    sem_desde = UM_PRODUTO.replace("desde = 1757050000\n", "")
    with pytest.raises(Recusado) as erro:
        montar(sem_desde, LISTAS, 1757100000)
    assert erro.value.codigo == "revogacao-incompleta"
    assert "desde" in erro.value.detalhe


def test_corrigido_em_realmente_nao_apertar_demais():
    # Nem toda revogação tem conserto, então `corrigido_em` ausente é aceito
    # como None, não recusado. Um MOD retirado a pedido do autor não tem
    # versão para onde mandar quem lê.
    sem_corrigido = UM_MOD.replace('corrigido_em = "1.2.1"\n', "")
    r = montar(sem_corrigido, LISTAS, 1757100000)
    assert r["mods"][0]["corrigido_em"] is None
