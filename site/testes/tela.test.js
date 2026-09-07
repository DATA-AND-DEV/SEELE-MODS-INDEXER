import { test } from "node:test";
import assert from "node:assert/strict";

import { linhasDaFicha, textoDaIdade } from "../tela.js";

const AGORA = 1_757_000_000;

test("idade em dias, horas e agora mesmo", () => {
  assert.equal(textoDaIdade(AGORA, AGORA), "agora");
  assert.equal(textoDaIdade(AGORA - 3600 * 5, AGORA), "há 5 h");
  assert.equal(textoDaIdade(AGORA - 86400 * 3, AGORA), "há 3 d");
  assert.equal(textoDaIdade(AGORA - 86400 * 400, AGORA), "há 1 a");
});

test("a idade nunca é negativa quando o relógio local atrasa", () => {
  // O `gerado_em` vem do catálogo e o `agora` do relógio de quem lê. Um
  // relógio atrasado produziria «há -2 d», que parece defeito nosso.
  assert.equal(textoDaIdade(AGORA + 86400, AGORA), "agora");
});

test("a ficha traz versão, api, hash inteiro e o commit inteiro", () => {
  const mod = { commit: "a".repeat(40), nivel: "verificado", notas: [] };
  const versao = { versao: "2.1.0", api: 1, hash: "b".repeat(64), publicado_em: AGORA, arquivos: ["mod.json"] };
  const linhas = linhasDaFicha(mod, versao);
  const porRotulo = Object.fromEntries(linhas.map((l) => [l.rotulo, l.valor]));

  assert.equal(porRotulo["VERSÃO"], "2.1.0");
  assert.equal(porRotulo["API"], "1");
  // Inteiros: o hash é o que uma pessoa compara a olho, e um commit
  // abreviado colide.
  assert.equal(porRotulo["HASH DO CONTEÚDO"], "b".repeat(64));
  assert.equal(porRotulo["COMMIT AVALIADO"], "a".repeat(40));
});

test("a ficha nunca traz estrelas nem downloads", () => {
  const mod = { commit: "a".repeat(40), nivel: "verificado", notas: [] };
  const versao = { versao: "1.0.0", api: 1, hash: "c".repeat(64), publicado_em: AGORA, arquivos: [] };
  const rotulos = linhasDaFicha(mod, versao).map((l) => l.rotulo).join(" ");
  assert.ok(!/ESTRELA|BAIXAD|DOWNLOAD/.test(rotulos), "não medimos isso");
});
