"""Monta `publicado/` — o que a Cloudflare Pages serve.

Roda na máquina de quem tem a chave privada de MOD, e o commit de
`publicado/` é o deploy. Não há passo de build remoto onde enfiar um
segredo, e é essa ausência que mantém a propriedade do ADR 0026."""

import argparse
import json
import shutil
import sys
import time
from pathlib import Path

from ferramentas import assinar as assinatura
from ferramentas import avaliacoes as leitura
from ferramentas import catalogo as montagem
from ferramentas import manifesto as manifestos
from ferramentas import revogacoes as retiradas
from ferramentas.fonte import materializar
from ferramentas.hash_conteudo import conteudo
from ferramentas.recusa import Recusado


def _escrever_json(caminho: Path, dados: dict) -> None:
    """JSON estável: chaves na ordem em que foram postas, UTF-8 de verdade.

    `ensure_ascii=False` porque um título em português vira `\\u00e7` de
    outro jeito, e o catálogo é lido por gente. `sort_keys=False` porque a
    ordem já é decidida em `catalogo.py`, e reordenar aqui faria dois
    catálogos iguais parecerem diferentes num diff."""
    caminho.write_text(
        json.dumps(dados, ensure_ascii=False, indent=2, sort_keys=False) + "\n",
        encoding="utf-8",
    )


def gerar(raiz: Path, chave_secreta: Path, agora: int | None = None) -> dict:
    """Monta `publicado/` inteiro. Levanta `Recusado` no primeiro problema."""
    agora = int(time.time()) if agora is None else agora
    publicado = raiz / "publicado"
    anterior_bruto = publicado / "catalogo.json"
    anterior = json.loads(anterior_bruto.read_text(encoding="utf-8")) if anterior_bruto.is_file() else None

    listas = retiradas.carregar_listas(raiz)
    todas = leitura.ler_todas(raiz / "avaliacoes")
    cache = raiz / ".cache-de-repos"

    # Monta num diretório novo e troca no fim: um `gerar.py` que falha no meio
    # não pode deixar `publicado/` com metade do catálogo velho e metade do
    # novo, porque é isso que alguém comitaria sem perceber.
    estufa = raiz / ".publicado-em-obras"
    if estufa.exists():
        shutil.rmtree(estufa)
    estufa.mkdir(parents=True)

    prontas: dict[tuple[str, str], montagem.VersaoPronta] = {}
    for avaliacao in todas:
        for versao in avaliacao.versoes:
            arquivos = materializar(avaliacao.repo, versao.commit, cache)
            por_caminho = dict(arquivos)
            if "mod.json" not in por_caminho:
                raise Recusado("sem-manifesto", f"{avaliacao.id} {versao.versao}")

            m = manifestos.ler(por_caminho["mod.json"].decode("utf-8"))
            if m.id != avaliacao.id:
                # O manifesto e a avaliação têm de falar do mesmo MOD, senão o
                # catálogo publica sob um id que o app vai recusar.
                raise Recusado("id-nao-bate-com-o-manifesto", f"{avaliacao.id} != {m.id}")
            if m.version != versao.versao:
                raise Recusado("versao-nao-bate-com-o-manifesto", f"{versao.versao} != {m.version}")

            destino = estufa / "mods" / avaliacao.autor / avaliacao.nome / versao.versao
            for caminho, bytes_ in arquivos:
                alvo = destino / caminho
                alvo.parent.mkdir(parents=True, exist_ok=True)
                alvo.write_bytes(bytes_)

            prontas[(avaliacao.id, versao.versao)] = montagem.VersaoPronta(
                versao=versao.versao,
                api=m.api,
                publicado_em=versao.avaliado_em,
                hash=conteudo(arquivos),
                alcanca=m.reach,
                arquivos=[caminho for caminho, _ in arquivos],
                nivel=versao.nivel,
                notas=versao.notas,
            )

    catalogo_novo = montagem.montar(todas, prontas, agora)
    montagem.conferir_append_only(catalogo_novo, anterior)

    revogacoes_novas = retiradas.montar(
        (raiz / "revogacoes.toml").read_text(encoding="utf-8"), listas, agora
    )

    # O site, e o `_headers` junto — a conferência de cache lê o arquivo que
    # acabou de ser copiado, e não uma cópia na memória.
    # `testes/` fica de fora: um teste servido em produção é código que
    # ninguém revisa como código servido, e o Pages tem teto de arquivos.
    shutil.copytree(
        raiz / "site", estufa, dirs_exist_ok=True, ignore=shutil.ignore_patterns("testes")
    )
    headers = (estufa / "_headers").read_text(encoding="utf-8")
    assinatura.conferir_cache_do_par(headers, "/catalogo.json")
    assinatura.conferir_cache_do_par(headers, "/revogacoes.json")

    _escrever_json(estufa / "catalogo.json", catalogo_novo)
    _escrever_json(estufa / "revogacoes.json", revogacoes_novas)
    assinatura.assinar(estufa / "catalogo.json", chave_secreta, "catalogo do indexador de MODs")
    assinatura.assinar(estufa / "revogacoes.json", chave_secreta, "revogacoes do indexador de MODs")

    # A pública por conveniência humana: alguém confere uma assinatura à mão.
    # A privada nunca chega aqui — ela é lida de fora e nada a copia.
    shutil.copy(raiz / "chaves" / "mods.pub", estufa / "chave.pub")
    shutil.copy(raiz / "listas.json", estufa / "listas.json")

    if publicado.exists():
        shutil.rmtree(publicado)
    estufa.rename(publicado)

    return {
        "mods": len(catalogo_novo["mods"]),
        "versoes": len(prontas),
        "revogacoes": len(revogacoes_novas["mods"]) + len(revogacoes_novas["versoes_do_produto"]),
    }


def main() -> int:
    analisador = argparse.ArgumentParser(description="Monta publicado/ e assina.")
    analisador.add_argument("--raiz", type=Path, default=Path(__file__).resolve().parents[1])
    analisador.add_argument("--chave", type=Path, required=True, help="a chave privada de MOD")
    args = analisador.parse_args()

    try:
        resumo = gerar(args.raiz, args.chave)
    except Recusado as erro:
        # Um identificador e o detalhe, e nunca uma frase bonita: quem lê isto
        # é quem publica, e o que ele precisa é saber qual arquivo consertar.
        print(f"recusado [{erro.codigo}] {erro.detalhe}", file=sys.stderr)
        return 1

    print(f'{resumo["mods"]} mods, {resumo["versoes"]} versões, {resumo["revogacoes"]} revogações')
    print("agora comite publicado/ — o commit é o deploy")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
