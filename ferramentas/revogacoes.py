"""O que foi retirado, numa lista só.

O ADR 0044 pede remoção de MOD que alcance quem já baixou; o ADR 0045 pede
revogação de versão do produto. São a mesma peça, e duas listas seriam duas
chances de esquecer uma.

O TOML é o que uma pessoa escreve; o JSON é o que é assinado. Editar o JSON
direto produz um arquivo cuja assinatura não confere, e a descoberta vem
tarde — na forma de um cliente recusando."""

import json
import tomllib
from pathlib import Path

from ferramentas.recusa import Recusado

ESQUEMA = 1


def carregar_listas(raiz: Path) -> dict:
    """As listas fechadas de `motivo` e `nota`, da fonte única."""
    return json.loads((raiz / "listas.json").read_text(encoding="utf-8"))


def _entrada(bruta: dict, listas: dict, onde: str) -> dict:
    motivo = bruta.get("motivo", "")
    if motivo not in listas["motivos"]:
        # Um motivo livre é uma frase, e o núcleo nunca formata mensagem
        # (ADR 0012). Quem escreve a frase é o `site/frases.js`.
        raise Recusado("motivo-desconhecido", f"{onde}: {motivo!r}")
    return {
        "motivo": motivo,
        "desde": bruta.get("desde", 0),
        # Nem toda revogação tem conserto: um MOD retirado a pedido do autor
        # não tem versão para onde mandar quem lê.
        "corrigido_em": bruta.get("corrigido_em"),
    }


def montar(texto_toml: str, listas: dict, gerado_em: int) -> dict:
    """`revogacoes.toml` → o dicionário que vira `revogacoes.json`."""
    try:
        cru = tomllib.loads(texto_toml)
    except tomllib.TOMLDecodeError as erro:
        raise Recusado("toml-malformado", str(erro)) from erro

    mods = []
    for bruta in cru.get("mods", []):
        onde = f'{bruta.get("id")} {bruta.get("versao")}'
        mods.append(
            {"id": bruta.get("id", ""), "versao": bruta.get("versao", ""), **_entrada(bruta, listas, onde)}
        )

    produto = []
    for bruta in cru.get("versoes_do_produto", []):
        onde = f'produto {bruta.get("versao")}'
        produto.append({"versao": bruta.get("versao", ""), **_entrada(bruta, listas, onde)})

    return {
        "esquema": ESQUEMA,
        "gerado_em": gerado_em,
        "mods": mods,
        "versoes_do_produto": produto,
    }
