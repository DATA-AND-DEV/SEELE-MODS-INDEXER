"""Assinar o que o Pages serve, e conferir que o cache do par bate.

A chave privada nunca entra na Cloudflare nem em CI: assinar localmente e
comitar o `.minisig` é o que mantém a propriedade que o ADR 0026 mais preza
— a chave que autoriza é a única coisa que um invasor não alcança pela
rede."""

import re
import subprocess
from pathlib import Path

from ferramentas.recusa import Recusado


def assinar(arquivo: Path, chave_secreta: Path, comentario: str) -> Path:
    """Assina `arquivo`, produzindo `<arquivo>.minisig`.

    `-l` é modo legado: assina os bytes crus em vez do BLAKE2b deles. A razão
    é o tamanho — o pré-hash existe para arquivo grande, e o catálogo tem
    dezenas de KB. **Não é pelo navegador:** a conferência de lá é integridade
    e não autenticidade (mesma origem, sem âncora), então justificar o modo
    por ela seria pagar por um benefício que não existe."""
    try:
        subprocess.run(
            ["minisign", "-S", "-l", "-s", str(chave_secreta), "-m", str(arquivo), "-t", comentario],
            input="\n", text=True, check=True, capture_output=True,
        )
    except subprocess.CalledProcessError as erro:
        raise Recusado("minisign-falhou", erro.stderr.strip()) from erro
    return arquivo.with_suffix(arquivo.suffix + ".minisig")


def _cache_de(headers: str, caminho: str) -> str | None:
    """A linha `Cache-Control` do bloco de `caminho`, ou nada.

    `[ \\t]` e não `\\s` nas duas repetições: `\\s` casa `\\n`, então a linha
    em branco que separa dois blocos era engolida como se fosse continuação
    e o bloco se estendia até o fim do arquivo. Um bloco que tivesse perdido
    o próprio `Cache-Control` devolvia então o do bloco SEGUINTE — nada
    aparecia errado, e o guarda do par comparava uma regra que aquele
    caminho não tem. Um bloco termina onde o arquivo diz que ele termina."""
    padrao = re.compile(
        r"^" + re.escape(caminho) + r"[ \t]*$\n(?:^[ \t]+.*$\n?)*", re.MULTILINE
    )
    achado = padrao.search(headers)
    if achado is None:
        return None
    for linha in achado.group(0).splitlines()[1:]:
        if linha.strip().lower().startswith("cache-control:"):
            return linha.split(":", 1)[1].strip()
    return None


def conferir_cache_do_par(headers: str, assinado: str) -> None:
    """A assinatura tem de ter o mesmo cache do arquivo que ela assina.

    Um catálogo novo com uma assinatura velha em cache é um cliente recusando
    um catálogo legítimo — a falha mais difícil de diagnosticar deste desenho
    inteiro, porque ela parece adulteração. É por isso que ela tem um guarda
    e não um parágrafo."""
    do_arquivo = _cache_de(headers, assinado)
    da_assinatura = _cache_de(headers, assinado + ".minisig")

    # Ausência é recusa, e antes da comparação: sem esta linha, o par SEM
    # REGRA NENHUMA passa — `None == None` — que é exatamente o caso em que
    # não há guarda nenhum. Os dois arquivos ficariam com o cache padrão da
    # Cloudflare, que não é o mesmo para os dois (`.json` e `.minisig` são
    # extensões diferentes para ela) e que ninguém escolheu. Um par que não
    # tem regra não é um par cujas regras batem; é um par sem decisão.
    if do_arquivo is None or da_assinatura is None:
        faltando = [
            caminho
            for caminho, regra in ((assinado, do_arquivo), (assinado + ".minisig", da_assinatura))
            if regra is None
        ]
        raise Recusado("cache-do-par-ausente", "sem Cache-Control para " + ", ".join(faltando))

    if do_arquivo != da_assinatura:
        raise Recusado(
            "cache-do-par-difere",
            f"{assinado} tem {do_arquivo!r} e a assinatura tem {da_assinatura!r}",
        )
