import { test } from "node:test";
import assert from "node:assert/strict";

import { analisar, paraHash } from "../rotas.js";

test("vazio é o catálogo", () => {
  assert.deepEqual(analisar(""), { tela: "catalogo", id: null });
  assert.deepEqual(analisar("#/"), { tela: "catalogo", id: null });
});

test("as três telas sem id", () => {
  assert.equal(analisar("#/revogacoes").tela, "revogacoes");
  assert.equal(analisar("#/publicar").tela, "publicar");
});

test("a tela de um mod carrega autor/nome", () => {
  assert.deepEqual(analisar("#/mod/juli/cinza-frio"), { tela: "mod", id: "juli/cinza-frio" });
});

test("rota desconhecida cai no catálogo em vez de tela branca", () => {
  assert.deepEqual(analisar("#/nao-existe"), { tela: "catalogo", id: null });
});

test("um mod sem id completo cai no catálogo", () => {
  assert.deepEqual(analisar("#/mod/juli"), { tela: "catalogo", id: null });
});

test("ida e volta preserva a rota", () => {
  for (const rota of [
    { tela: "catalogo", id: null },
    { tela: "revogacoes", id: null },
    { tela: "publicar", id: null },
    { tela: "mod", id: "juli/cinza-frio" },
  ]) {
    assert.deepEqual(analisar(paraHash(rota)), rota);
  }
});

test("um id com caractere de caminho não escapa da rota", () => {
  // O id é `[a-z0-9-]+/[a-z0-9-]+` por construção; qualquer coisa fora disso
  // vem de uma URL digitada à mão e não pode virar uma terceira barra.
  assert.deepEqual(analisar("#/mod/a/b/c"), { tela: "catalogo", id: null });
});
