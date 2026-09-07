import pytest

from ferramentas.avaliacoes import NIVEIS, ler, ler_todas
from ferramentas.recusa import Recusado

COMMIT = "4f9a1c0e8b7d6a5f4e3d2c1b0a9f8e7d6c5b4a39"

BOM = f"""
id = "juli/cinza-frio"
repo = "https://github.com/juli/seele-cinza-frio"
titulo = "Cinza Frio"
resumo = "Um tema de contraste alto, sem mexer no layout."

[[versoes]]
versao = "2.1.0"
commit = "{COMMIT}"
nivel = "verificado"
notas = []
avaliado_em = 1757000000
"""


def escrever(tmp_path, texto, nome="juli/cinza-frio.toml"):
    caminho = tmp_path / nome
    caminho.parent.mkdir(parents=True, exist_ok=True)
    caminho.write_text(texto, encoding="utf-8")
    return caminho


def test_le_uma_avaliacao_boa(tmp_path):
    a = ler(escrever(tmp_path, BOM))
    assert a.id == "juli/cinza-frio"
    assert a.autor == "juli"
    assert a.nome == "cinza-frio"
    assert len(a.versoes) == 1
    assert a.versoes[0].commit == COMMIT
    assert a.versoes[0].nivel == "verificado"


def test_commit_abreviado_e_recusado(tmp_path):
    # Prefixo curto de git colide, e um prefixo escolhido por um adversário
    # colide de propósito.
    with pytest.raises(Recusado) as erro:
        ler(escrever(tmp_path, BOM.replace(COMMIT, COMMIT[:12])))
    assert erro.value.codigo == "commit-torto"


def test_commit_com_letra_fora_do_hex_e_recusado(tmp_path):
    with pytest.raises(Recusado) as erro:
        ler(escrever(tmp_path, BOM.replace(COMMIT, "z" * 40)))
    assert erro.value.codigo == "commit-torto"


def test_nivel_fora_da_lista_e_recusado(tmp_path):
    # `negado` não é um nível do catálogo: um MOD negado não entra.
    with pytest.raises(Recusado) as erro:
        ler(escrever(tmp_path, BOM.replace('"verificado"', '"negado"')))
    assert erro.value.codigo == "nivel-desconhecido"


def test_o_nome_do_arquivo_tem_de_bater_com_o_id(tmp_path):
    # Se divergirem, dois arquivos podem reivindicar o mesmo id e o último a
    # ser lido ganha em silêncio.
    with pytest.raises(Recusado) as erro:
        ler(escrever(tmp_path, BOM, nome="outro/nome.toml"))
    assert erro.value.codigo == "id-nao-bate-com-o-caminho"


def test_versao_repetida_e_recusada(tmp_path):
    dobrado = BOM + f"""
[[versoes]]
versao = "2.1.0"
commit = "{'a' * 40}"
nivel = "verificado"
notas = []
avaliado_em = 1757000001
"""
    with pytest.raises(Recusado) as erro:
        ler(escrever(tmp_path, dobrado))
    assert erro.value.codigo == "versao-repetida"


def test_com_notas_sem_nota_e_recusado(tmp_path):
    # O terceiro nível existe para a pessoa ler o que o MOD faz de incomum.
    # Sem nota nenhuma ele não diz nada, e o selo vira decoração.
    torto = BOM.replace('nivel = "verificado"', 'nivel = "com-notas"')
    with pytest.raises(Recusado) as erro:
        ler(escrever(tmp_path, torto))
    assert erro.value.codigo == "com-notas-sem-nota"


def test_todos_os_niveis_da_lista_sao_aceitos(tmp_path):
    for nivel in NIVEIS:
        texto = BOM.replace('nivel = "verificado"', f'nivel = "{nivel}"')
        if nivel == "com-notas":
            texto = texto.replace("notas = []", 'notas = ["fala-com-terceiro"]')
        assert ler(escrever(tmp_path, texto)).versoes[0].nivel == nivel


def test_ler_todas_acha_em_subdiretorios(tmp_path):
    escrever(tmp_path, BOM, "juli/cinza-frio.toml")
    outro = BOM.replace("juli/cinza-frio", "kae/glifos-osso").replace("Cinza Frio", "Glifos Osso")
    escrever(tmp_path, outro, "kae/glifos-osso.toml")
    achadas = ler_todas(tmp_path)
    assert sorted(a.id for a in achadas) == ["juli/cinza-frio", "kae/glifos-osso"]
