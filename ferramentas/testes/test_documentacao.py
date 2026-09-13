"""Os exemplos da documentação, conferidos contra a regra que o código aplica.

Existe porque um exemplo errado não quebra nada: ele é lido por quem vai
escrever o consumidor, e sai do ar de propósito nenhum. O `catalogo.json` de
`indexador-de-mods.md` trazia `"oficial": true` ao lado de `"nivel":
"verificado"` — uma combinação que `ferramentas/catalogo.py` nunca produz,
porque ali `oficial` É `nivel == "oficial"` e não um campo à parte. Quem
escrevesse um leitor a partir daquele exemplo trataria os dois como
independentes, e o primeiro catálogo de verdade o desmentiria.

A conferência lê os blocos ```json de toda a documentação, e não só o que
alguém lembrar de atualizar: o mesmo exemplo está copiado no spec e no plano.
"""

import json
import re
from pathlib import Path

import pytest

RAIZ = Path(__file__).resolve().parents[2]
BLOCO = re.compile(r"^```json\n(.*?)^```", re.DOTALL | re.MULTILINE)


def _documentos() -> list[Path]:
    return sorted(p for p in RAIZ.rglob("*.md") if ".git" not in p.parts)


def _blocos() -> list[tuple[Path, int, str]]:
    achados = []
    for caminho in _documentos():
        texto = caminho.read_text(encoding="utf-8")
        for ordem, bloco in enumerate(BLOCO.findall(texto), start=1):
            achados.append((caminho, ordem, bloco))
    return achados


def _objetos(valor):
    """Todo dicionário dentro do bloco, em qualquer profundidade."""
    if isinstance(valor, dict):
        yield valor
        for dentro in valor.values():
            yield from _objetos(dentro)
    elif isinstance(valor, list):
        for dentro in valor:
            yield from _objetos(dentro)


BLOCOS = _blocos()


def test_a_varredura_acha_os_exemplos_de_catalogo():
    # Sem isto, trocar a cerca ```json por outra coisa faria as conferências
    # abaixo passarem sem ler nada — o jeito silencioso de desligá-las.
    com_mods = [(c, i) for c, i, b in BLOCOS if '"mods"' in b and '"nivel"' in b]
    assert len(com_mods) >= 2, f"exemplos de catálogo encontrados: {com_mods}"


@pytest.mark.parametrize(
    "caminho,ordem,bloco", BLOCOS, ids=[f"{c.name}#{i}" for c, i, _ in BLOCOS]
)
def test_os_blocos_json_da_documentacao_sao_json_valido(caminho, ordem, bloco):
    # Um exemplo que nem parseia não é exemplo, e também impediria a
    # conferência seguinte de olhar para ele.
    try:
        json.loads(bloco)
    except json.JSONDecodeError as erro:
        pytest.fail(f"{caminho.relative_to(RAIZ)} bloco {ordem}: {erro}")


@pytest.mark.parametrize(
    "caminho,ordem,bloco", BLOCOS, ids=[f"{c.name}#{i}" for c, i, _ in BLOCOS]
)
def test_oficial_verdadeiro_so_aparece_no_nivel_oficial(caminho, ordem, bloco):
    """A mesma regra de `test_oficial_e_verdadeiro_so_no_nivel_oficial`.

    `montar` escreve `"oficial": ultima.nivel == "oficial"`: os dois campos não
    são independentes, são o mesmo fato dito duas vezes. Um exemplo em que eles
    discordam descreve um catálogo que o gerador não consegue emitir.
    """
    for objeto in _objetos(json.loads(bloco)):
        if "oficial" not in objeto or "nivel" not in objeto:
            continue
        onde = f"{caminho.relative_to(RAIZ)} bloco {ordem} ({objeto.get('id', 'sem id')})"
        assert objeto["oficial"] == (objeto["nivel"] == "oficial"), (
            f"{onde}: oficial={objeto['oficial']!r} com nivel={objeto['nivel']!r}; "
            "`oficial` é `nivel == \"oficial\"`, e não um campo à parte"
        )
