// SEELE MODS — a rota mora no fragmento, e não no caminho.
//
// Fragmento porque o Pages serve arquivos parados: um caminho de verdade
// exigiria uma regra de reescrita no servidor, e a regra é justamente que
// não há servidor com regras.

"use strict";

const ID = /^[a-z0-9-]+\/[a-z0-9-]+$/;
const SEM_ID = new Set(["catalogo", "revogacoes", "publicar"]);
const CATALOGO = Object.freeze({ tela: "catalogo", id: null });

/**
 * `#/mod/juli/cinza-frio` → `{ tela: "mod", id: "juli/cinza-frio" }`.
 *
 * Rota que não existe cai no catálogo, e não numa tela branca: quem chegou
 * por um link velho tem de ver alguma coisa que funcione.
 */
export function analisar(hash) {
  const partes = (hash || "").replace(/^#\/?/, "").split("/").filter(Boolean);
  if (partes.length === 0) return { ...CATALOGO };

  const [primeira, ...resto] = partes;
  if (primeira === "mod") {
    const id = resto.join("/");
    return ID.test(id) ? { tela: "mod", id } : { ...CATALOGO };
  }
  if (SEM_ID.has(primeira) && resto.length === 0) return { tela: primeira, id: null };
  return { ...CATALOGO };
}

/** O caminho inverso, para os botões escreverem `location.hash`. */
export function paraHash({ tela, id }) {
  if (tela === "mod" && id) return `#/mod/${id}`;
  if (tela === "catalogo") return "#/";
  return `#/${tela}`;
}
