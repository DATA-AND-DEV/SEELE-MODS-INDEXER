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
