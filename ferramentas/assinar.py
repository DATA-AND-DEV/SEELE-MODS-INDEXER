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
    """A linha `Cache-Control` do bloco de `caminho`, ou nada."""
    padrao = re.compile(
        r"^" + re.escape(caminho) + r"\s*$\n(?:^\s+.*$\n?)*", re.MULTILINE
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
    if do_arquivo != da_assinatura:
        raise Recusado(
            "cache-do-par-difere",
            f"{assinado} tem {do_arquivo!r} e a assinatura tem {da_assinatura!r}",
        )
