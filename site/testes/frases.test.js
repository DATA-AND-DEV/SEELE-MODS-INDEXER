import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { FALHAS, MOTIVOS, NIVEIS, NOTAS, ROTULOS_DE_NIVEL, frase } from "../frases.js";

const LISTAS = JSON.parse(
  readFileSync(fileURLToPath(new URL("../../listas.json", import.meta.url)), "utf-8"),
);

test("todo motivo da lista fechada tem frase", () => {
  for (const id of LISTAS.motivos) {
    assert.ok(MOTIVOS[id], `falta frase para o motivo ${id}`);
  }
});

test("toda nota da lista fechada tem frase", () => {
  for (const id of LISTAS.notas) {
    assert.ok(NOTAS[id], `falta frase para a nota ${id}`);
  }
});

test("nenhuma frase sobra sem identificador", () => {
  // Uma frase órfã é uma lista que mudou e uma que não mudou junto.
  for (const id of Object.keys(MOTIVOS)) {
    assert.ok(LISTAS.motivos.includes(id), `frase órfã: ${id}`);
  }
  for (const id of Object.keys(NOTAS)) {
    assert.ok(LISTAS.notas.includes(id), `frase órfã: ${id}`);
  }
});

test("os três níveis do catálogo têm frase", () => {
  for (const id of ["oficial", "verificado", "com-notas"]) {
    assert.ok(NIVEIS[id], `falta frase para o nível ${id}`);
  }
});

// Rótulo e descrição são duas coisas (a mesma confusão que fez o selo do
// cartão e os botões da lateral mostrarem a descrição inteira). O guarda
// aqui é a mesma forma do que já existe acima para NIVEIS/MOTIVOS/NOTAS:
// todo nível tem rótulo, e nenhum rótulo sobra sem nível — com `revogada`
// incluído na conta, porque o selo do cartão passa esse identificador por
// `frase("rotulos", …)` mesmo ele não sendo um nível de avaliação.
test("os três níveis do catálogo, e a revogação, têm rótulo", () => {
  for (const id of ["oficial", "verificado", "com-notas", "revogada"]) {
    assert.ok(ROTULOS_DE_NIVEL[id], `falta rótulo para ${id}`);
  }
});

test("nenhum rótulo de nível sobra sem nível (ou sem ser a revogação)", () => {
  const validos = new Set(["oficial", "verificado", "com-notas", "revogada"]);
  for (const id of Object.keys(ROTULOS_DE_NIVEL)) {
    assert.ok(validos.has(id), `rótulo órfão: ${id}`);
  }
});

test("as quatro falhas da tela têm frase", () => {
  for (const id of ["sem-resposta", "assinatura-nao-confere", "hash-nao-bate", "sem-ed25519"]) {
    assert.ok(FALHAS[id], `falta frase para a falha ${id}`);
  }
});

test("toda causa que verificar.js pode devolver tem frase, ou é dobrada em app.js", () => {
  // O guarda acima ("nenhuma frase sobra sem identificador") só cobre
  // MOTIVOS e NOTAS, que nascem de `listas.json`. `FALHAS` não tem lista
  // fechada equivalente — as causas nascem direto de `verificar.js` — e foi
  // exatamente uma causa de lá (`comentario-adulterado`) que ficou sem
  // frase nesta tarefa. Este teste deriva as causas do texto-fonte de
  // `verificar.js`, em vez de repetir a lista à mão aqui: uma lista à mão
  // não reprovaria quando alguém acrescentasse uma causa nova ao módulo e
  // esquecesse a frase — o mesmo buraco de novo.
  const fonte = readFileSync(fileURLToPath(new URL("../verificar.js", import.meta.url)), "utf-8");
  const causas = new Set([...fonte.matchAll(/causa:\s*"([a-z0-9-]+)"/g)].map((m) => m[1]));
  assert.ok(causas.size > 0, "a extração não achou nenhuma causa em verificar.js — o regex quebrou");

  // `app.js` dobra estas duas em "assinatura-nao-confere" antes de chamar
  // `desenharAviso` (a chave errada e a assinatura ilegível contam a mesma
  // história para quem lê: "isto não confere"), então elas não precisam de
  // frase própria em FALHAS. Qualquer causa fora desta lista tem de ter
  // frase, senão o identificador cru vaza para a tela.
  const DOBRADAS_EM_APP = new Set(["assinatura-ilegivel", "chave-diferente"]);

  for (const causa of causas) {
    assert.ok(
      FALHAS[causa] || DOBRADAS_EM_APP.has(causa),
      `causa "${causa}" de verificar.js não tem frase em FALHAS nem está entre as causas que app.js dobra`,
    );
  }
});

test("a frase da assinatura acusa cache antes de adulteração", () => {
  // É a causa provável e a mais difícil de achar: um catálogo novo com uma
  // assinatura velha em cache parece adulteração e não é.
  const texto = FALHAS["assinatura-nao-confere"].toLowerCase();
  assert.ok(texto.includes("cache"), "a frase tem de falar em cache");
});

test("nenhuma frase promete autenticidade", () => {
  // A conferência do navegador é integridade: verificador, chave e catálogo
  // vêm da mesma origem, e não há âncora.
  const todas = Object.values({ ...FALHAS, ...NIVEIS }).join(" ").toLowerCase();
  assert.ok(!todas.includes("autêntic"), "a palavra é «íntegro», nunca «autêntico»");
});

test("um identificador desconhecido não devolve undefined", () => {
  // Mostrar «undefined» para quem lê é pior que mostrar o identificador.
  assert.equal(frase("motivos", "inexistente"), "inexistente");
});
