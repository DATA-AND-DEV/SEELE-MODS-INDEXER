// SEELE MODS — o que fazer com o catálogo depois de baixado.
//
// **Tudo aqui é local, e isso é o ADR 0044 inteiro:** «com API, o indexador
// aprende cada termo que alguém digitou; com catálogo, aprende que alguém
// buscou o catálogo». No dia em que alguma destas funções virar um `fetch`,
// a propriedade morreu — e não haverá aviso.

"use strict";

export const ORDENS = [
  { id: "recentes", nome: "Mais recentes" },
  { id: "nome", nome: "Nome" },
  { id: "nivel", nome: "Nível" },
];

/** `oficial` primeiro: é o único nível cuja prova somos nós. */
const PESO_DO_NIVEL = { oficial: 0, verificado: 1, "com-notas": 2 };

/** A versão que a tela mostra, e sobre a qual a decisão de instalar é feita. */
export function versaoMaisRecente(mod) {
  return mod.versoes.reduce((maior, atual) =>
    atual.publicado_em > maior.publicado_em ? atual : maior,
  );
}

/**
 * A versão que a tela está mostrando — a escolhida, ou a mais recente.
 *
 * Um número que não está mais no catálogo cai na mais recente em vez de numa
 * tela vazia: a lista de versões vem de um arquivo que pode ser recarregado
 * enquanto alguém lê, e uma escolha velha não é motivo para não mostrar nada.
 */
export function versaoEscolhida(mod, numero) {
  if (!numero) return versaoMaisRecente(mod);
  return mod.versoes.find((v) => v.versao === numero) ?? versaoMaisRecente(mod);
}

/**
 * O veredito que vale para UMA versão: o dela, nunca o do MOD.
 *
 * Os campos no nível do MOD descrevem a avaliação mais recente. Mostrá-los ao
 * lado de uma versão antiga diz «foi isto que revisamos nestes bytes» sobre
 * bytes que ninguém revisou assim — e o nível é justamente o que alguém lê
 * para decidir instalar.
 *
 * O `??` é compatibilidade e não indecisão: um `catalogo.json` gerado antes de
 * os campos por versão existirem não tem o que responder, e o veredito do MOD
 * é a melhor aproximação disponível — a mesma que a tela mostrava antes.
 */
export function avaliacaoDaVersao(mod, versao) {
  return {
    nivel: versao?.nivel ?? mod.nivel,
    notas: versao?.notas ?? mod.notas ?? [],
    commit: versao?.commit ?? mod.commit,
  };
}

/**
 * O que instalar, e de QUAL versão — a escolhida, nunca a mais recente.
 *
 * O hash e a lista de arquivos já saíam da versão escolhida na ficha, mas o
 * caminho de ação era montado solto no meio da tela, a partir do MOD. Junto
 * ficam porque são uma coisa só: o `hash` é o número com que quem baixa
 * confere os bytes que baixou, e separá-los deixava cada um livre para passar
 * a falar de uma versão diferente sem nada avisar — foi exatamente o que
 * aconteceu.
 *
 * `identificador` é `autor/nome` porque é o que o app aceita hoje, e ele
 * instala a mais recente. Por isso `maisRecente` e `ehMaisRecente` saem daqui:
 * a tela precisa poder dizer que digitar o id não traz a versão escolhida.
 * Inventar aqui um `autor/nome@versao` seria escrever um contrato que o app
 * não tem — o campo para isso é uma mudança no SEELE, não uma string nossa.
 */
export function acaoDeInstalar(mod, versao) {
  const base = `mods/${mod.autor}/${mod.nome}/${versao.versao}/`;
  const recente = versaoMaisRecente(mod);
  return {
    identificador: mod.id,
    versao: versao.versao,
    maisRecente: recente.versao,
    ehMaisRecente: versao.versao === recente.versao,
    hash: versao.hash,
    base,
    arquivos: (versao.arquivos ?? []).map((caminho) => ({
      caminho,
      url: base + caminho,
    })),
  };
}

/**
 * Sem acento e em minúscula, para comparar.
 *
 * Quem digita «traco» tem de achar «traço»: exigir o acento é exigir que a
 * pessoa saiba como nós escrevemos, e a busca é dela.
 */
function achatar(texto) {
  return texto.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

/**
 * Marca cada versão com a revogação dela, se houver.
 *
 * Devolve cópias: alterar o catálogo baixado faria a segunda chamada ver o
 * resultado da primeira, e o bug apareceria só ao trocar de tela.
 */
export function cruzarRevogacoes(mods, revogacoes) {
  const porChave = new Map(
    (revogacoes?.mods ?? []).map((r) => [`${r.id}@${r.versao}`, r]),
  );
  return mods.map((mod) => {
    const versoes = mod.versoes.map((v) => ({
      ...v,
      revogada: porChave.get(`${mod.id}@${v.versao}`) ?? null,
    }));
    return { ...mod, versoes, temRevogada: versoes.some((v) => v.revogada !== null) };
  });
}

/**
 * Filtra por nível, por API e por busca. Campos ausentes não filtram.
 *
 * O filtro de API existe porque é o que permite ao catálogo se filtrar: o
 * cliente sabe qual API oferece e não mostra o que vai recusar.
 */
export function filtrar(mods, { nivel, api, busca } = {}) {
  const termo = busca ? achatar(busca.trim()) : "";
  return mods.filter((mod) => {
    if (nivel && mod.nivel !== nivel) return false;
    if (api !== undefined && !mod.versoes.some((v) => v.api <= api)) return false;
    if (!termo) return true;
    const palheiro = achatar(
      [mod.titulo, mod.id, mod.autor, mod.nome, mod.resumo, mod.repo].join(" "),
    );
    return palheiro.includes(termo);
  });
}

/** Ordena uma cópia — a lista de origem é o catálogo baixado, e é de leitura. */
export function ordenar(mods, ordem) {
  const copia = [...mods];
  if (ordem === "nome") {
    return copia.sort((a, b) => a.titulo.localeCompare(b.titulo, "pt-BR"));
  }
  if (ordem === "nivel") {
    return copia.sort(
      (a, b) =>
        (PESO_DO_NIVEL[a.nivel] ?? 9) - (PESO_DO_NIVEL[b.nivel] ?? 9) ||
        a.titulo.localeCompare(b.titulo, "pt-BR"),
    );
  }
  return copia.sort(
    (a, b) => versaoMaisRecente(b).publicado_em - versaoMaisRecente(a).publicado_em,
  );
}
