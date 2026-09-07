import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { analisarAssinatura, analisarChave, temEd25519, verificar } from "../verificar.js";

/** Um catálogo assinado de verdade, pelo binário do minisign. */
function assinado(conteudo) {
  const dir = mkdtempSync(join(tmpdir(), "minisig-"));
  const pub = join(dir, "t.pub");
  const sec = join(dir, "t.key");
  const alvo = join(dir, "catalogo.json");
  execFileSync("minisign", ["-G", "-f", "-p", pub, "-s", sec], { input: "\n\n" });
  writeFileSync(alvo, conteudo);
  execFileSync("minisign", ["-S", "-l", "-s", sec, "-m", alvo, "-t", "catalogo"], { input: "\n" });
  return {
    bytes: readFileSync(alvo),
    assinatura: readFileSync(alvo + ".minisig", "utf-8"),
    chave: readFileSync(pub, "utf-8"),
  };
}

test("o ambiente tem Ed25519", async () => {
  assert.equal(await temEd25519(), true);
});

test("analisa uma chave pública do minisign", () => {
  const { chave } = assinado("{}");
  const c = analisarChave(chave);
  assert.equal(c.algoritmo, "Ed");
  assert.equal(c.publica.length, 32);
  assert.equal(c.idDaChave.length, 8);
});

test("analisa uma assinatura do minisign", () => {
  const { assinatura } = assinado("{}");
  const a = analisarAssinatura(assinatura);
  assert.equal(a.algoritmo, "Ed");
  assert.equal(a.assinatura.length, 64);
  assert.equal(a.assinaturaGlobal.length, 64);
  assert.equal(typeof a.comentarioConfiavel, "string");
});

test("um catálogo intacto é íntegro", async () => {
  const { bytes, assinatura, chave } = assinado('{"esquema":1,"mods":[]}');
  assert.deepEqual(await verificar(bytes, assinatura, chave), { integro: true });
});

test("um byte trocado derruba a integridade", async () => {
  const { assinatura, chave } = assinado('{"esquema":1,"mods":[]}');
  const mexido = new TextEncoder().encode('{"esquema":2,"mods":[]}');
  const r = await verificar(mexido, assinatura, chave);
  assert.equal(r.integro, false);
  assert.equal(r.causa, "assinatura-nao-confere");
});

test("a assinatura de outra chave é recusada pelo id antes da matemática", async () => {
  // O id da chave existe justamente para dizer «esta assinatura não é para
  // esta chave» sem gastar uma verificação.
  const um = assinado("{}");
  const outro = assinado("{}");
  const r = await verificar(um.bytes, outro.assinatura, um.chave);
  assert.equal(r.integro, false);
  assert.equal(r.causa, "chave-diferente");
});

test("um comentário confiável adulterado é recusado", async () => {
  // A assinatura global cobre o comentário confiável; sem conferi-la, alguém
  // reescreve o comentário sem invalidar nada.
  const { bytes, assinatura, chave } = assinado("{}");
  // `^`/`m`: sem âncora de início de linha, "trusted comment: " também casa
  // no meio de "untrusted comment: ..." — e troca a linha errada.
  const mexida = assinatura.replace(/^trusted comment: .*/m, "trusted comment: outra coisa");
  const r = await verificar(bytes, mexida, chave);
  assert.equal(r.integro, false);
  assert.equal(r.causa, "comentario-adulterado");
});

test("um .minisig truncado não explode", async () => {
  const { bytes, chave } = assinado("{}");
  const r = await verificar(bytes, "untrusted comment: só isto\n", chave);
  assert.equal(r.integro, false);
  assert.equal(r.causa, "assinatura-ilegivel");
});
