import shutil
import subprocess

import pytest

from ferramentas.assinar import assinar, conferir_cache_do_par
from ferramentas.recusa import Recusado

# A marca é por teste e não do módulo inteiro: `conferir_cache_do_par` é
# texto entrando e exceção saindo, sem processo nenhum no meio. Sob um
# `pytestmark` de módulo, os guardas de cache — inclusive o do par sem regra
# nenhuma, que é o defeito que esta rodada fecha — sumiriam em silêncio numa
# máquina sem minisign, que é a máquina onde ninguém repararia.
precisa_de_minisign = pytest.mark.skipif(
    shutil.which("minisign") is None, reason="minisign não instalado"
)

HEADERS_BOM = """
/mods/*
  Cache-Control: public, max-age=31536000, immutable

/catalogo.json
  Cache-Control: public, max-age=300

/catalogo.json.minisig
  Cache-Control: public, max-age=300

/revogacoes.json
  Cache-Control: public, max-age=60, must-revalidate

/revogacoes.json.minisig
  Cache-Control: public, max-age=60, must-revalidate
"""


@pytest.fixture
def par(tmp_path):
    """Um par de chaves sem senha, para o teste."""
    publica, secreta = tmp_path / "t.pub", tmp_path / "t.key"
    subprocess.run(
        ["minisign", "-G", "-f", "-p", str(publica), "-s", str(secreta)],
        input="\n\n", text=True, check=True, capture_output=True,
    )
    return publica, secreta


def sem_bloco(headers: str, caminho: str) -> str:
    """`headers` sem o bloco de `caminho` — o par que ninguém decidiu."""
    linhas = headers.splitlines(keepends=True)
    for i, linha in enumerate(linhas):
        if linha.strip() == caminho:
            return "".join(linhas[:i] + linhas[i + 2 :])
    raise AssertionError(f"o bloco {caminho} não está em HEADERS_BOM")


@precisa_de_minisign
def test_assina_e_o_minisign_confere(tmp_path, par):
    publica, secreta = par
    alvo = tmp_path / "catalogo.json"
    alvo.write_text('{"esquema":1}', encoding="utf-8")

    assinatura = assinar(alvo, secreta, "catalogo do indexador")
    assert assinatura == tmp_path / "catalogo.json.minisig"

    pronto = subprocess.run(
        ["minisign", "-V", "-p", str(publica), "-m", str(alvo)],
        capture_output=True, text=True,
    )
    assert pronto.returncode == 0, pronto.stderr


@precisa_de_minisign
def test_a_assinatura_e_do_modo_legado(tmp_path, par):
    # `Ed` e não `ED`: o segundo é pré-hasheado, e o pré-hash existe para
    # arquivo grande. O catálogo tem dezenas de KB.
    import base64
    _, secreta = par
    alvo = tmp_path / "catalogo.json"
    alvo.write_text("{}", encoding="utf-8")
    linhas = assinar(alvo, secreta, "c").read_text(encoding="utf-8").splitlines()
    assert base64.b64decode(linhas[1])[:2] == b"Ed"


@precisa_de_minisign
def test_um_byte_trocado_derruba_a_verificacao(tmp_path, par):
    publica, secreta = par
    alvo = tmp_path / "catalogo.json"
    alvo.write_text('{"esquema":1}', encoding="utf-8")
    assinar(alvo, secreta, "c")
    alvo.write_text('{"esquema":2}', encoding="utf-8")

    pronto = subprocess.run(
        ["minisign", "-V", "-p", str(publica), "-m", str(alvo)],
        capture_output=True, text=True,
    )
    assert pronto.returncode != 0


def test_o_cache_do_par_confere():
    conferir_cache_do_par(HEADERS_BOM, "/catalogo.json")
    conferir_cache_do_par(HEADERS_BOM, "/revogacoes.json")


def test_cache_do_par_diferente_e_recusado():
    torto = HEADERS_BOM.replace(
        "/catalogo.json.minisig\n  Cache-Control: public, max-age=300",
        "/catalogo.json.minisig\n  Cache-Control: public, max-age=86400",
    )
    with pytest.raises(Recusado) as erro:
        conferir_cache_do_par(torto, "/catalogo.json")
    assert erro.value.codigo == "cache-do-par-difere"


def test_assinatura_sem_regra_de_cache_e_recusada():
    sem = sem_bloco(HEADERS_BOM, "/catalogo.json.minisig")
    with pytest.raises(Recusado) as erro:
        conferir_cache_do_par(sem, "/catalogo.json")
    assert erro.value.codigo == "cache-do-par-ausente"
    assert "/catalogo.json.minisig" in erro.value.detalhe


def test_arquivo_sem_regra_de_cache_e_recusado():
    sem = sem_bloco(HEADERS_BOM, "/catalogo.json")
    with pytest.raises(Recusado) as erro:
        conferir_cache_do_par(sem, "/catalogo.json")
    assert erro.value.codigo == "cache-do-par-ausente"
    assert "/catalogo.json.minisig" not in erro.value.detalhe


def test_par_sem_regra_nenhuma_de_cache_e_recusado():
    # O buraco que este guarda fecha: com os DOIS blocos ausentes, a
    # comparação de igualdade era `None == None` e passava — o único caso
    # em que não há decisão nenhuma sobre o cache era também o único que o
    # guarda deixava passar. Sem este teste, apagar `is None or ... is None`
    # de `conferir_cache_do_par` não reprova nada: os outros três casos de
    # ausência continuam recusados pela desigualdade.
    sem = sem_bloco(sem_bloco(HEADERS_BOM, "/catalogo.json"), "/catalogo.json.minisig")
    with pytest.raises(Recusado) as erro:
        conferir_cache_do_par(sem, "/catalogo.json")
    assert erro.value.codigo == "cache-do-par-ausente"
    assert "/catalogo.json" in erro.value.detalhe
    assert "/catalogo.json.minisig" in erro.value.detalhe


def test_revogacoes_sem_regra_nenhuma_de_cache_sao_recusadas():
    # O mesmo caso do arquivo que mais depende dele: um minuto de cache é o
    # que decide quanto tempo uma versão furada continua rodando depois de
    # retirada, e sem regra nenhuma esse número passa a ser o padrão da CDN.
    sem = sem_bloco(sem_bloco(HEADERS_BOM, "/revogacoes.json"), "/revogacoes.json.minisig")
    with pytest.raises(Recusado) as erro:
        conferir_cache_do_par(sem, "/revogacoes.json")
    assert erro.value.codigo == "cache-do-par-ausente"


def test_bloco_sem_linha_de_cache_control_e_recusado():
    # O bloco existe e não decide nada — indistinguível, para a CDN, de não
    # existir. O guarda trata os dois igual porque o efeito é o mesmo.
    mudo = HEADERS_BOM.replace(
        "/catalogo.json.minisig\n  Cache-Control: public, max-age=300",
        "/catalogo.json.minisig\n  X-Qualquer-Coisa: 1",
    )
    with pytest.raises(Recusado) as erro:
        conferir_cache_do_par(mudo, "/catalogo.json")
    assert erro.value.codigo == "cache-do-par-ausente"


def test_um_bloco_mudo_nao_toma_emprestada_a_regra_do_bloco_seguinte():
    # A variante silenciosa do teste acima, e a pior das duas: quando o
    # bloco de baixo tem a MESMA regra, o empréstimo faz os dois «baterem»
    # e a conferência inteira passa sem que nada tenha sido decidido para a
    # assinatura. Com `\s` na repetição do regex de bloco — que casa `\n` e
    # portanto atravessa a linha em branco que separa dois blocos — isto
    # passava; é o teste que prende o `[ \t]`.
    headers = """
/catalogo.json
  Cache-Control: public, max-age=300

/catalogo.json.minisig
  X-Qualquer-Coisa: 1

/qualquer-outra-coisa
  Cache-Control: public, max-age=300
"""
    with pytest.raises(Recusado) as erro:
        conferir_cache_do_par(headers, "/catalogo.json")
    assert erro.value.codigo == "cache-do-par-ausente"
