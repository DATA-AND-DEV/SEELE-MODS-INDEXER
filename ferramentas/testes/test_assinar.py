import shutil
import subprocess

import pytest

from ferramentas.assinar import assinar, conferir_cache_do_par
from ferramentas.recusa import Recusado

pytestmark = pytest.mark.skipif(shutil.which("minisign") is None, reason="minisign não instalado")

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


def test_a_assinatura_e_do_modo_legado(tmp_path, par):
    # `Ed` e não `ED`: o segundo é pré-hasheado, e o pré-hash existe para
    # arquivo grande. O catálogo tem dezenas de KB.
    import base64
    _, secreta = par
    alvo = tmp_path / "catalogo.json"
    alvo.write_text("{}", encoding="utf-8")
    linhas = assinar(alvo, secreta, "c").read_text(encoding="utf-8").splitlines()
    assert base64.b64decode(linhas[1])[:2] == b"Ed"


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
    sem = HEADERS_BOM.replace("/catalogo.json.minisig\n  Cache-Control: public, max-age=300\n", "")
    with pytest.raises(Recusado) as erro:
        conferir_cache_do_par(sem, "/catalogo.json")
    assert erro.value.codigo == "cache-do-par-difere"
