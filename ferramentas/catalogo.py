"""O `catalogo.json`: o índice inteiro, num arquivo parado.

O cliente baixa isto, confere a assinatura contra a chave compilada nele, e
busca **localmente**. É a regra do ADR 0044 virando formato: com API, o
indexador aprende cada termo que alguém digitou; com catálogo, aprende que
alguém buscou o catálogo."""

from dataclasses import dataclass, field

from ferramentas.avaliacoes import Avaliacao
from ferramentas.recusa import Recusado

ESQUEMA = 1


@dataclass(frozen=True)
class VersaoPronta:
    """Uma versão com os bytes já buscados e o hash já calculado."""

    versao: str
    api: int
    publicado_em: int
    hash: str
    alcanca: list[str] = field(default_factory=list)
    arquivos: list[str] = field(default_factory=list)
    nivel: str = "verificado"
    notas: list[str] = field(default_factory=list)


def montar(
    avaliacoes: list[Avaliacao],
    prontas: dict[tuple[str, str], VersaoPronta],
    gerado_em: int,
) -> dict:
    """O catálogo inteiro, pronto para serializar e assinar."""
    mods = []
    for a in avaliacoes:
        versoes = []
        for v in a.versoes:
            pronta = prontas.get((a.id, v.versao))
            if pronta is None:
                # Sem bytes não há hash, e sem hash a entrada seria uma
                # promessa que o cliente não consegue conferir.
                continue
            versoes.append(
                {
                    "versao": pronta.versao,
                    "api": pronta.api,
                    "publicado_em": pronta.publicado_em,
                    "hash": pronta.hash,
                    # Por versão e não por MOD, porque `mod.json` é por versão.
                    "alcanca": list(pronta.alcanca),
                    "arquivos": sorted(pronta.arquivos),
                    # A avaliação DESTA versão, e não a do MOD. Ela já era
                    # calculada por versão e morria aqui: o catálogo só
                    # publicava o veredito da versão avaliada mais
                    # recentemente, então quem abrisse uma versão antiga lia o
                    # nível e as notas de outra. Uma versão publicada com
                    # ressalvas não deixa de tê-las porque a seguinte passou
                    # limpa — e o `hash` desta linha continua sendo o dos bytes
                    # daquela versão, o que tornava o par nível/hash uma
                    # afirmação sobre duas coisas diferentes.
                    "nivel": pronta.nivel,
                    "notas": list(pronta.notas),
                    # O commit sai do `Versao` e não do `VersaoPronta` porque é
                    # o ponto fixo da avaliação, e mora onde o veredito mora —
                    # a mesma origem do `commit` no nível do MOD, logo abaixo.
                    "commit": v.commit,
                }
            )
        if not versoes:
            continue

        # O nível e as notas do MOD são os da versão avaliada mais
        # recentemente, e «mais recente» é por `avaliado_em` — nunca pela
        # posição no arquivo. `Avaliacao.versoes` preserva a ordem do TOML,
        # então uma versão antiga acrescentada ao fim passaria a decidir o
        # selo. É o selo que alguém lê para decidir instalar: deixá-lo
        # depender da ordem de edição de um arquivo daria a quem edita um
        # poder que a avaliação não lhe deu.
        #
        # Os campos de avaliação no nível do MOD ficam onde estavam, e seguem
        # querendo dizer exatamente isto: «o que a avaliação mais recente
        # achou». Eles não são o resumo das versões nem servem para descrever
        # uma versão escolhida — para isso existem os campos por versão acima.
        ultima = max(a.versoes, key=lambda v: v.avaliado_em)
        mods.append(
            {
                "id": a.id,
                "autor": a.autor,
                "nome": a.nome,
                "titulo": a.titulo,
                "resumo": a.resumo,
                "repo": a.repo,
                # `oficial` é conveniência de tela e não prova. Quem prova é a
                # assinatura — o campo mente junto com um catálogo adulterado.
                "oficial": ultima.nivel == "oficial",
                "nivel": ultima.nivel,
                "commit": ultima.commit,
                "notas": list(ultima.notas),
                "versoes": versoes,
            }
        )

    return {"esquema": ESQUEMA, "gerado_em": gerado_em, "mods": mods}


def _por_versao(catalogo: dict) -> dict[tuple[str, str], str]:
    return {
        (m["id"], v["versao"]): v["hash"]
        for m in catalogo["mods"]
        for v in m["versoes"]
    }


def conferir_append_only(novo: dict, anterior: dict | None) -> None:
    """Uma versão publicada nunca muda, e nunca some.

    Se o hash mudasse, «o MOD que você baixou é o MOD que revisamos» deixaria
    de valer sem nada avisar — e o cache eterno de `/mods/*` deixaria metade
    do mundo com os bytes velhos. Uma versão que some é uma revogação
    disfarçada, e revogação tem lista própria, com motivo e `corrigido_em`."""
    if anterior is None:
        return

    de_antes = _por_versao(anterior)
    de_agora = _por_versao(novo)

    for chave, hash_antigo in de_antes.items():
        identificador, versao = chave
        if chave not in de_agora:
            raise Recusado("versao-sumida", f"{identificador} {versao}")
        if de_agora[chave] != hash_antigo:
            raise Recusado(
                "versao-editada",
                f"{identificador} {versao}: era {hash_antigo}, virou {de_agora[chave]}",
            )
