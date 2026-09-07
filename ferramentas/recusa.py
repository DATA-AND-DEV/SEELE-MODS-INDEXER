"""Uma recusa nomeada, e nada mais.

Mora sozinha porque todo módulo do gerador a levanta e nenhum outro valida
manifesto: se ela morasse em `manifesto.py`, `assinar.py` importaria o
validador de `mod.json` para poder recusar um cabeçalho de cache.

`codigo` vem sempre de uma lista fechada, e `detalhe` nomeia o que
consertar. Nenhum dos dois é uma frase para tela — quem escreve a frase é o
`site/frases.js` (ADR 0012)."""


class Recusado(Exception):
    def __init__(self, codigo: str, detalhe: str = ""):
        super().__init__(f"{codigo}: {detalhe}" if detalhe else codigo)
        self.codigo = codigo
        self.detalhe = detalhe
