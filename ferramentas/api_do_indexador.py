"""Gera o `api-do-indexador.json`, o vetor que o SEELE confere.

O `a_api_dos_mods_nao_diverge` do seele-conformance lê este arquivo, copiado
para `apps/seele-app/testes/`, e compara os dois números com os do
`seele_proto::mods`. Até a API 6 a cópia era escrita à mão; escrita à mão, ela
é a terceira cópia de um número que já divergiu uma vez.

Os números saem do mesmo `catalogo.montar` que o catálogo assinado usa, e não
das constantes lidas de novo aqui: o vetor diz o que o gerador anuncia.
Não assina nada e não toca `publicado/`: a saída é o caminho que se passa."""

import argparse
import json
from pathlib import Path

from ferramentas import catalogo

PORQUE = (
    "O gerador e o cliente moram em repositorios diferentes. Este arquivo e a copia do numero que o "
    "gerador oferece, para as duas suites nao ficarem verdes enquanto discordam. Desde a API 4 ele traz "
    "tambem o conjunto que o gerador executa: a 4 nao tirou nada da 3, entao a conferencia dos dois lados "
    "deixou de ser igualdade. Nao e assinado e nao e o catalogo publicado: o catalogo assinado continua ao "
    "lado, e continua provando o que ele representa."
)


def vetor() -> dict:
    anunciado = catalogo.montar([], {}, 0)
    return {
        "api_oferecida": anunciado["api_oferecida"],
        "de": "SEELE-MODS-INDEXER/ferramentas/manifesto.py",
        "simbolo": "VERSAO_DA_API",
        "porque": PORQUE,
        "apis_aceitas": anunciado["apis_aceitas"],
    }


def escrever(saida: Path) -> None:
    saida.parent.mkdir(parents=True, exist_ok=True)
    saida.write_text(json.dumps(vetor(), indent=2) + "\n", encoding="utf-8")


def main() -> int:
    analisador = argparse.ArgumentParser(description="Gera o api-do-indexador.json para o SEELE.")
    analisador.add_argument("--saida", type=Path, required=True)
    args = analisador.parse_args()
    escrever(args.saida)
    print(args.saida)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
