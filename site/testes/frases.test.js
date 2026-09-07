import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { FALHAS, MOTIVOS, NIVEIS, NOTAS, frase } from "../frases.js";

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

test("as quatro falhas da tela têm frase", () => {
  for (const id of ["sem-resposta", "assinatura-nao-confere", "hash-nao-bate", "sem-ed25519"]) {
    assert.ok(FALHAS[id], `falta frase para a falha ${id}`);
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
