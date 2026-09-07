import { test } from "node:test";
import assert from "node:assert/strict";

import { cruzarRevogacoes, filtrar, ordenar, versaoMaisRecente } from "../catalogo.js";

const MODS = [
  {
    id: "juli/cinza-frio", autor: "juli", nome: "cinza-frio", titulo: "Cinza Frio",
    resumo: "Contraste alto, sem mexer no layout.", repo: "https://github.com/juli/x",
    nivel: "verificado", oficial: false, notas: [],
    versoes: [
      { versao: "2.0.0", api: 1, publicado_em: 1000, hash: "a".repeat(64), alcanca: [], arquivos: [] },
      { versao: "2.1.0", api: 1, publicado_em: 3000, hash: "b".repeat(64), alcanca: [], arquivos: [] },
    ],
  },
  {
    id: "kae/glifos-osso", autor: "kae", nome: "glifos-osso", titulo: "Glifos Osso",
    resumo: "Traço mais fino para telas densas.", repo: "https://github.com/kae/y",
    nivel: "oficial", oficial: true, notas: [],
    versoes: [{ versao: "3.0.0", api: 1, publicado_em: 2000, hash: "c".repeat(64), alcanca: [], arquivos: [] }],
  },
  {
    id: "rafa/cola", autor: "rafa", nome: "cola", titulo: "Cola no Canal",
    resumo: "Comandos de barra dentro da conversa.", repo: "https://github.com/rafa/z",
    nivel: "com-notas", oficial: false, notas: ["fala-com-terceiro"],
    versoes: [{ versao: "1.0.1", api: 2, publicado_em: 4000, hash: "d".repeat(64), alcanca: [], arquivos: [] }],
  },
];

const REVOGACOES = {
  esquema: 1, gerado_em: 5000,
  mods: [{ id: "juli/cinza-frio", versao: "2.0.0", motivo: "credencial-vazada", desde: 1500, corrigido_em: "2.1.0" }],
  versoes_do_produto: [{ versao: "0.11.2", motivo: "leitura-de-disco-fora-da-pasta", desde: 1500, corrigido_em: "0.11.3" }],
};

test("a versão mais recente é a de maior publicado_em", () => {
  assert.equal(versaoMaisRecente(MODS[0]).versao, "2.1.0");
});

test("cruzar marca a versão revogada e só ela", () => {
  const [cinza] = cruzarRevogacoes(MODS, REVOGACOES);
  assert.equal(cinza.versoes.find((v) => v.versao === "2.0.0").revogada.motivo, "credencial-vazada");
  assert.equal(cinza.versoes.find((v) => v.versao === "2.1.0").revogada, null);
});

test("cruzar não marca o mod vizinho", () => {
  const [, glifos] = cruzarRevogacoes(MODS, REVOGACOES);
  assert.equal(glifos.temRevogada, false);
  assert.equal(glifos.versoes[0].revogada, null);
});

test("cruzar não altera o original", () => {
  cruzarRevogacoes(MODS, REVOGACOES);
  assert.equal("revogada" in MODS[0].versoes[0], false);
});

test("filtrar por nível", () => {
  assert.deepEqual(filtrar(MODS, { nivel: "oficial" }).map((m) => m.id), ["kae/glifos-osso"]);
});

test("filtrar por api esconde o que o app recusaria", () => {
  // O cliente sabe qual API oferece e não mostra o que vai recusar.
  assert.deepEqual(filtrar(MODS, { api: 1 }).map((m) => m.id), ["juli/cinza-frio", "kae/glifos-osso"]);
});

test("buscar acha por título, id, autor e resumo", () => {
  assert.deepEqual(filtrar(MODS, { busca: "cinza" }).map((m) => m.id), ["juli/cinza-frio"]);
  assert.deepEqual(filtrar(MODS, { busca: "kae" }).map((m) => m.id), ["kae/glifos-osso"]);
  assert.deepEqual(filtrar(MODS, { busca: "barra" }).map((m) => m.id), ["rafa/cola"]);
});

test("buscar ignora caixa e acento", () => {
  // Quem digita «traco» tem de achar «traço»: exigir o acento é exigir que a
  // pessoa saiba como escrevemos, e a busca é dela.
  assert.deepEqual(filtrar(MODS, { busca: "TRACO" }).map((m) => m.id), ["kae/glifos-osso"]);
});

test("busca sem resultado devolve lista vazia e não tudo", () => {
  assert.deepEqual(filtrar(MODS, { busca: "zzz" }), []);
});

test("ordenar por recentes usa a versão mais recente", () => {
  assert.deepEqual(ordenar(MODS, "recentes").map((m) => m.id), ["rafa/cola", "juli/cinza-frio", "kae/glifos-osso"]);
});

test("ordenar por nome é alfabético pelo título", () => {
  assert.deepEqual(ordenar(MODS, "nome").map((m) => m.id), ["juli/cinza-frio", "rafa/cola", "kae/glifos-osso"]);
});

test("ordenar por nível põe oficial primeiro", () => {
  assert.deepEqual(ordenar(MODS, "nivel").map((m) => m.id), ["kae/glifos-osso", "juli/cinza-frio", "rafa/cola"]);
});

test("ordenar não altera o original", () => {
  const antes = MODS.map((m) => m.id);
  ordenar(MODS, "nome");
  assert.deepEqual(MODS.map((m) => m.id), antes);
});
