"""A identidade dos bytes de um MOD.

Cópia deliberada de `seele_proto::mods::content_hash`
(`crates/seele-proto/src/mods.rs:194`), que é a única fonte. Uma segunda
implementação de uma definição que só deveria existir uma vez é uma dívida
conhecida; `vetores-de-hash.json` é o que impede que as duas divirjam sem
ninguém perceber.

As três propriedades, com o motivo que o Rust escreve ao lado de cada uma:

- **caminhos ordenados**, porque ordem de diretório não é promessa que
  sistema de arquivos nenhum faz;
- **todo comprimento antes dos seus bytes**, para que ("ab", "c") e
  ("a", "bc") não colidam;
- **comprimentos em 8 bytes big-endian fixos**, para que um comprimento
  nunca seja ele próprio ambíguo.
"""

import hashlib

Arquivo = tuple[str, bytes]


def conteudo(arquivos: list[Arquivo]) -> str:
    """O `content_hash` do conjunto, em hexadecimal minúsculo.

    Minúsculo porque é o número que uma pessoa compara a olho com o que o
    indexador publica, e duas grafias fariam a comparação falhar por nada
    (`seele-core/src/mods.rs:180`).
    """
    # A chave é os bytes do caminho porque é o que `String::cmp` compara no
    # Rust. Em Python a ordem por ponto de código já daria o mesmo resultado
    # — ordenar UTF-8 por byte é ordenar por ponto de código, e isso é uma
    # propriedade de projeto do UTF-8, não uma coincidência. A chave fica
    # assim mesmo por uma razão que não é redundante: `sorted` sem chave
    # desempataria dois caminhos iguais pelos BYTES DO ARQUIVO, enquanto o
    # `sort_by` do Rust compara só o caminho e deixa a ordem de entrada
    # decidir. Caminho repetido não vem de disco, mas vem de um chamador.
    ordenados = sorted(arquivos, key=lambda par: par[0].encode("utf-8"))

    digestor = hashlib.sha256()
    digestor.update(len(ordenados).to_bytes(8, "big"))
    for caminho, dados in ordenados:
        cru = caminho.encode("utf-8")
        digestor.update(len(cru).to_bytes(8, "big"))
        digestor.update(cru)
        digestor.update(len(dados).to_bytes(8, "big"))
        digestor.update(dados)
    return digestor.hexdigest()
