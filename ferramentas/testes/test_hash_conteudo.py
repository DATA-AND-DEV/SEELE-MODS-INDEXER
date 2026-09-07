"""Os vetores são o contrato com o Rust, e o Rust é quem os gera.

Editar um hash aqui para fazer o teste passar é desfazer a única coisa que
impede `hash_conteudo.py` de divergir de `seele_proto::mods::content_hash`
em silêncio. Quem regenera é o teste em `seele-proto` (Task 2)."""

import base64
import json
from pathlib import Path

import pytest

from ferramentas.hash_conteudo import conteudo

RAIZ = Path(__file__).resolve().parents[2]
VETORES = json.loads((RAIZ / "vetores-de-hash.json").read_text(encoding="utf-8"))["vetores"]


@pytest.mark.parametrize("vetor", VETORES, ids=lambda v: v["nome"])
def test_bate_com_o_vetor_do_rust(vetor):
    arquivos = [
        (a["caminho"], base64.b64decode(a["bytes_b64"])) for a in vetor["arquivos"]
    ]
    assert conteudo(arquivos) == vetor["hash"]


def test_a_ordem_de_entrada_nao_importa():
    # O Rust ordena dentro da função justamente para que nenhum chamador
    # precise lembrar de ordenar — `seele-proto/src/mods.rs:398`.
    direta = [("a.js", b"A"), ("z.js", b"Z")]
    invertida = [("z.js", b"Z"), ("a.js", b"A")]
    assert conteudo(direta) == conteudo(invertida)


def test_caminho_com_utf8_conta_bytes_e_nao_caracteres():
    # «ícone/ação.js» tem 13 caracteres e 16 bytes. Uma implementação que
    # usasse len(str) produziria outro número, e esta é a única linha do
    # arquivo que o pega.
    assert len("ícone/ação.js") == 13
    assert len("ícone/ação.js".encode("utf-8")) == 16
    esperado = "7ce968afd47f468a9ec91b11092c044263f57ecb172d28b06452acf00a145c7a"
    assert conteudo([("ícone/ação.js", b"x")]) == esperado
