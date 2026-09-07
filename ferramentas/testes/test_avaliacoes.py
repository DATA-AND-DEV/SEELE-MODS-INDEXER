import json
from pathlib import Path

import pytest

from ferramentas.avaliacoes import NIVEIS, ler, ler_todas
from ferramentas.recusa import Recusado

RAIZ = Path(__file__).resolve().parents[2]
LISTAS = json.loads((RAIZ / "listas.json").read_text(encoding="utf-8"))

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
    a = ler(escrever(tmp_path, BOM), LISTAS)
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
        ler(escrever(tmp_path, BOM.replace(COMMIT, COMMIT[:12])), LISTAS)
    assert erro.value.codigo == "commit-torto"


def test_commit_com_letra_fora_do_hex_e_recusado(tmp_path):
    with pytest.raises(Recusado) as erro:
        ler(escrever(tmp_path, BOM.replace(COMMIT, "z" * 40)), LISTAS)
    assert erro.value.codigo == "commit-torto"


def test_nivel_fora_da_lista_e_recusado(tmp_path):
    # `negado` não é um nível do catálogo: um MOD negado não entra.
    with pytest.raises(Recusado) as erro:
        ler(escrever(tmp_path, BOM.replace('"verificado"', '"negado"')), LISTAS)
    assert erro.value.codigo == "nivel-desconhecido"


def test_o_nome_do_arquivo_tem_de_bater_com_o_id(tmp_path):
    # Se divergirem, dois arquivos podem reivindicar o mesmo id e o último a
    # ser lido ganha em silêncio.
    with pytest.raises(Recusado) as erro:
        ler(escrever(tmp_path, BOM, nome="outro/nome.toml"), LISTAS)
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
        ler(escrever(tmp_path, dobrado), LISTAS)
    assert erro.value.codigo == "versao-repetida"


def test_com_notas_sem_nota_e_recusado(tmp_path):
    # O terceiro nível existe para a pessoa ler o que o MOD faz de incomum.
    # Sem nota nenhuma ele não diz nada, e o selo vira decoração.
    torto = BOM.replace('nivel = "verificado"', 'nivel = "com-notas"')
    with pytest.raises(Recusado) as erro:
        ler(escrever(tmp_path, torto), LISTAS)
    assert erro.value.codigo == "com-notas-sem-nota"


def test_todos_os_niveis_da_lista_sao_aceitos(tmp_path):
    for nivel in NIVEIS:
        texto = BOM.replace('nivel = "verificado"', f'nivel = "{nivel}"')
        if nivel == "com-notas":
            texto = texto.replace("notas = []", 'notas = ["fala-com-terceiro"]')
        assert ler(escrever(tmp_path, texto), LISTAS).versoes[0].nivel == nivel


def test_ler_todas_acha_em_subdiretorios(tmp_path):
    escrever(tmp_path, BOM, "juli/cinza-frio.toml")
    outro = BOM.replace("juli/cinza-frio", "kae/glifos-osso").replace("Cinza Frio", "Glifos Osso")
    escrever(tmp_path, outro, "kae/glifos-osso.toml")
    achadas = ler_todas(tmp_path, LISTAS)
    assert sorted(a.id for a in achadas) == ["juli/cinza-frio", "kae/glifos-osso"]


# --- nota é identificador de uma lista fechada, nunca frase -----------------


def test_nota_fora_da_lista_e_recusada(tmp_path):
    # Um typo como este entraria assinado e append-only no catálogo, e a tela
    # mostraria o identificador cru em vez da frase.
    torto = BOM.replace("notas = []", 'notas = ["fala-com-terceir0"]')
    with pytest.raises(Recusado) as erro:
        ler(escrever(tmp_path, torto), LISTAS)
    assert erro.value.codigo == "nota-desconhecida"
    assert "fala-com-terceir0" in erro.value.detalhe


def test_todas_as_notas_da_lista_sao_aceitas(tmp_path):
    # Prova de que a validação não apertou demais: as quatro notas reais de
    # `listas.json` continuam entrando.
    for nota in LISTAS["notas"]:
        texto = BOM.replace('nivel = "verificado"', 'nivel = "com-notas"')
        texto = texto.replace("notas = []", f'notas = ["{nota}"]')
        assert ler(escrever(tmp_path, texto), LISTAS).versoes[0].notas == [nota]


def test_notas_vazias_fora_do_com_notas_e_valido(tmp_path):
    # `notas = []` num nível que não seja `com-notas` não tem o que validar
    # contra a lista, e continua sendo uma avaliação válida.
    a = ler(escrever(tmp_path, BOM), LISTAS)
    assert a.versoes[0].nivel == "verificado"
    assert a.versoes[0].notas == []


# --- `repo` vira argumento de subprocesso, e chegava sem forma nenhuma ------


@pytest.mark.parametrize(
    "repo",
    [
        "",
        "-upload-pack=touch /tmp/pwned",
        "--upload-pack=touch /tmp/pwned",
        "ext::sh -c touch%20/tmp/pwned",
        "fake::sh -c touch%20/tmp/pwned",
    ],
)
def test_repo_torto_e_recusado(tmp_path, repo):
    torto = BOM.replace(
        'repo = "https://github.com/juli/seele-cinza-frio"', f'repo = "{repo}"'
    )
    with pytest.raises(Recusado) as erro:
        ler(escrever(tmp_path, torto), LISTAS)
    assert erro.value.codigo == "repo-torto"


@pytest.mark.parametrize(
    "repo",
    [
        "https://github.com/juli/seele-cinza-frio",
        "http://github.com/juli/seele-cinza-frio",
        "git@github.com:juli/seele-cinza-frio.git",
        "ssh://git@github.com/juli/seele-cinza-frio.git",
        "/home/juli/repos/seele-cinza-frio",
    ],
)
def test_repo_aceito_nas_formas_que_o_projeto_usa(tmp_path, repo):
    bom = BOM.replace('repo = "https://github.com/juli/seele-cinza-frio"', f'repo = "{repo}"')
    assert ler(escrever(tmp_path, bom), LISTAS).repo == repo
