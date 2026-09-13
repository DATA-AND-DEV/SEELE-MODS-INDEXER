import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  CAUSAS,
  CONSULTANDO,
  carregarRevogacoes,
  foiConferida,
  paraTela,
} from "../revogacoes.js";

const codificador = new TextEncoder();

/** Assina `conteudo` de verdade, com um par de chaves novo e o binário. */
function assinado(conteudo, comentario = "revogacoes do indexador de MODs") {
  const dir = mkdtempSync(join(tmpdir(), "revogacoes-"));
  const pub = join(dir, "t.pub");
  const sec = join(dir, "t.key");
  const alvo = join(dir, "revogacoes.json");
  execFileSync("minisign", ["-G", "-f", "-p", pub, "-s", sec], { input: "\n\n" });
  writeFileSync(alvo, conteudo);
  execFileSync("minisign", ["-S", "-l", "-s", sec, "-m", alvo, "-t", comentario], { input: "\n" });
  return {
    bytes: readFileSync(alvo),
    assinatura: readFileSync(alvo + ".minisig", "utf-8"),
    chave: readFileSync(pub, "utf-8"),
  };
}

/** Os três arquivos que a consulta busca, como o Pages os serviria. */
function servidoPor({ bytes, assinatura, chave }) {
  return {
    "revogacoes.json": bytes,
    "revogacoes.json.minisig": assinatura,
    "chave.pub": chave,
  };
}

/**
 * Um `baixar` de mentira sobre um mapa de nome → conteúdo.
 *
 * Um nome ausente lança, que é o que o `baixar` de verdade faz diante de
 * uma resposta que não é `ok` — a rede é a única peça que os testes trocam.
 */
function baixarDe(arquivos) {
  return async (nome) => {
    const conteudo = arquivos[nome];
    if (conteudo === undefined) throw new Error(`sem resposta para ${nome}`);
    return typeof conteudo === "string" ? codificador.encode(conteudo) : new Uint8Array(conteudo);
  };
}

const VAZIA = JSON.stringify({
  esquema: 1,
  gerado_em: 1757100000,
  mods: [],
  versoes_do_produto: [],
});

const CHEIA = JSON.stringify({
  esquema: 1,
  gerado_em: 1757100000,
  mods: [
    {
      id: "alguem/ruim",
      versao: "1.2.0",
      motivo: "credencial-vazada",
      desde: 1757050000,
      corrigido_em: "1.2.1",
    },
  ],
  versoes_do_produto: [
    {
      versao: "0.11.2",
      motivo: "leitura-de-disco-fora-da-pasta",
      desde: 1757060000,
      corrigido_em: "0.11.3",
    },
  ],
});

/** Cada jeito de a consulta não valer, com o nome que o relatório usa. */
function cenariosDeFalha() {
  const assinada = assinado(CHEIA);
  const deOutraChave = assinado(VAZIA);
  const cenarios = [];

  for (const ausente of ["revogacoes.json", "revogacoes.json.minisig", "chave.pub"]) {
    const arquivos = servidoPor(assinada);
    delete arquivos[ausente];
    cenarios.push([`${ausente} não respondeu`, arquivos]);
  }

  cenarios.push([
    "os bytes foram trocados por outros",
    { ...servidoPor(assinada), "revogacoes.json": CHEIA.replace('"1.2.0"', '"9.9.9"') },
  ]);
  cenarios.push([
    "as revogações foram apagadas por quem serve",
    { ...servidoPor(assinada), "revogacoes.json": VAZIA },
  ]);
  cenarios.push([
    "a assinatura é de outra chave",
    { ...servidoPor(assinada), "chave.pub": deOutraChave.chave },
  ]);
  cenarios.push([
    "o comentário confiável foi reescrito",
    {
      ...servidoPor(assinada),
      "revogacoes.json.minisig": assinada.assinatura.replace(
        /^trusted comment: .*/m,
        "trusted comment: outra coisa",
      ),
    },
  ]);
  cenarios.push(["assinado, mas não é JSON", servidoPor(assinado("{isto não é json"))]);
  cenarios.push([
    "assinado, mas não é uma lista de revogações",
    servidoPor(assinado(JSON.stringify({ esquema: 1, mods: [{ id: "seele/rpg" }] }))),
  ]);

  return cenarios;
}

test("uma lista assinada e vazia é íntegra, e é o único caminho para «vazio»", async () => {
  const r = await carregarRevogacoes(baixarDe(servidoPor(assinado(VAZIA))));
  assert.equal(r.estado, "integro");
  assert.equal(r.causa, null);
  assert.deepEqual(r.dados.mods, []);
  assert.deepEqual(r.dados.versoes_do_produto, []);
  assert.equal(foiConferida(r), true);
  // «NADA FOI RETIRADO ATÉ AGORA» é uma afirmação sobre o mundo, e esta é a
  // única consulta que pode fazê-la: a lista chegou e a assinatura confere.
  assert.deepEqual(paraTela(r), { mostrar: "vazio" });
});

test("revogações válidas chegam inteiras, nas duas listas, da mais recente para a mais velha", async () => {
  const r = await carregarRevogacoes(baixarDe(servidoPor(assinado(CHEIA))));
  assert.equal(r.estado, "integro");

  const oQue = paraTela(r);
  assert.equal(oQue.mostrar, "lista");
  // MOD retirado e versão do produto revogada na mesma tabela — são a mesma
  // peça, e duas tabelas seriam duas chances de esquecer uma.
  assert.deepEqual(
    oQue.linhas.map((l) => l.o_que),
    ["SEELE 0.11.2", "alguem/ruim 1.2.0"],
  );
  assert.equal(oQue.linhas[1].motivo, "credencial-vazada");
  assert.equal(oQue.linhas[1].corrigido_em, "1.2.1");
});

test("uma consulta que não chega é indisponibilidade, e não uma lista vazia", async () => {
  for (const ausente of ["revogacoes.json", "revogacoes.json.minisig", "chave.pub"]) {
    const arquivos = servidoPor(assinado(CHEIA));
    delete arquivos[ausente];

    const r = await carregarRevogacoes(baixarDe(arquivos));
    assert.equal(r.estado, "indisponivel", ausente);
    assert.equal(r.causa, "sem-resposta", ausente);
    assert.equal(r.dados, null, ausente);
  }
});

test("bytes adulterados não são usados, mesmo sendo JSON perfeito", async () => {
  // Este é o defeito inteiro numa frase: antes, qualquer falha virava
  // `{ mods: [], versoes_do_produto: [] }`, então quem servisse a lista
  // podia apagar uma revogação e a tela diria que nada foi retirado.
  // Aqui a lista trocada é JSON impecável — só a assinatura não bate.
  const assinada = assinado(CHEIA);
  const r = await carregarRevogacoes(
    baixarDe({ ...servidoPor(assinada), "revogacoes.json": VAZIA }),
  );
  assert.equal(r.estado, "falhou");
  assert.equal(r.causa, "assinatura-nao-confere");
  assert.equal(r.dados, null);
  assert.equal(paraTela(r).mostrar, "recusa");
});

test("uma assinatura de outra chave é recusada", async () => {
  const arquivos = servidoPor(assinado(CHEIA));
  arquivos["chave.pub"] = assinado(VAZIA).chave;
  const r = await carregarRevogacoes(baixarDe(arquivos));
  assert.equal(r.estado, "falhou");
  assert.equal(r.causa, "assinatura-nao-confere");
});

test("um comentário confiável reescrito é recusado", async () => {
  const assinada = assinado(CHEIA);
  const arquivos = servidoPor(assinada);
  arquivos["revogacoes.json.minisig"] = assinada.assinatura.replace(
    /^trusted comment: .*/m,
    "trusted comment: outra coisa",
  );
  const r = await carregarRevogacoes(baixarDe(arquivos));
  assert.equal(r.estado, "falhou");
  assert.equal(r.causa, "comentario-adulterado");
});

test("bytes assinados que não são JSON são recusados sem lançar", async () => {
  const r = await carregarRevogacoes(baixarDe(servidoPor(assinado("{isto não é json"))));
  assert.equal(r.estado, "falhou");
  assert.equal(r.causa, "json-ilegivel");
});

test("um arquivo assinado que não é a lista de revogações é recusado", async () => {
  // A assinatura diz «estes bytes são nossos», não «estes bytes são as
  // revogações»: o `catalogo.json` é assinado pela mesma chave e também tem
  // um `mods`. Sem o guarda de forma, ele viraria linhas de tabela.
  const comoCatalogo = JSON.stringify({
    esquema: 1,
    gerado_em: 1757100000,
    mods: [{ id: "seele/rpg", titulo: "Salas de RPG", versoes: [] }],
  });
  const r = await carregarRevogacoes(baixarDe(servidoPor(assinado(comoCatalogo))));
  assert.equal(r.estado, "falhou");
  assert.equal(r.causa, "formato-inesperado");
  assert.equal(r.dados, null);
});

test("nenhuma consulta não conferida entrega dados nem diz «vazio»", async () => {
  // O critério inteiro num laço: cada jeito de a consulta não valer produz
  // um estado explícito, com causa da lista fechada, sem lista nenhuma —
  // e nunca a tela de lista vazia legítima.
  for (const [nome, arquivos] of cenariosDeFalha()) {
    const r = await carregarRevogacoes(baixarDe(arquivos));
    assert.notEqual(r.estado, "integro", nome);
    assert.equal(r.dados, null, nome);
    assert.equal(foiConferida(r), false, nome);

    const oQue = paraTela(r);
    assert.equal(oQue.mostrar, "recusa", nome);
    assert.ok(CAUSAS.includes(oQue.causa), `${nome}: causa fora da lista fechada (${oQue.causa})`);
  }
});

test("uma consulta válida depois de uma falha recupera o estado", async () => {
  // A recusa não é permanente: a causa provável é cache de um nó da CDN, e
  // o caminho de volta é consultar de novo. Sem isto, uma falha de rede
  // deixaria a aba inutilizável até alguém recarregar a página inteira.
  const assinada = assinado(CHEIA);
  const bons = servidoPor(assinada);
  const ruins = { ...bons };
  delete ruins["revogacoes.json"];

  let arquivos = ruins;
  const baixar = (nome) => baixarDe(arquivos)(nome);

  const primeira = await carregarRevogacoes(baixar);
  assert.equal(primeira.estado, "indisponivel");
  assert.equal(paraTela(primeira).mostrar, "recusa");

  arquivos = bons;
  const segunda = await carregarRevogacoes(baixar);
  assert.equal(segunda.estado, "integro");
  assert.equal(paraTela(segunda).mostrar, "lista");
});

test("o estado inicial não afirma nada", async () => {
  assert.equal(foiConferida(CONSULTANDO), false);
  assert.deepEqual(paraTela(CONSULTANDO), { mostrar: "consultando" });
  assert.equal(CONSULTANDO.dados, null);
});

test("toda causa que este módulo escreve está na lista fechada", () => {
  // O mesmo guarda que `frases.test.js` tem para `verificar.js`, do outro
  // lado: `CAUSAS` é a lista que o dicionário de frases confere, então uma
  // recusa nova que não passasse por ela sairia como identificador cru.
  const fonte = readFileSync(fileURLToPath(new URL("../revogacoes.js", import.meta.url)), "utf-8");
  const escritas = [...fonte.matchAll(/recusa\("[a-z-]+",\s*"([a-z0-9-]+)"\)/g)].map((m) => m[1]);
  assert.ok(escritas.length > 0, "a extração não achou nenhuma recusa — o regex quebrou");
  for (const causa of escritas) {
    assert.ok(CAUSAS.includes(causa), `causa "${causa}" fora de CAUSAS`);
  }
});

test("toda causa de verificar.js é dobrada ou está na lista fechada daqui", () => {
  // As causas que este módulo repassa não nascem nele, e é por isso que
  // `CAUSAS` é uma lista exportada em vez de derivada do fonte: uma causa
  // nova em `verificar.js` chegaria à tela por aqui sem frase nenhuma.
  const fonte = readFileSync(fileURLToPath(new URL("../verificar.js", import.meta.url)), "utf-8");
  const causas = new Set([...fonte.matchAll(/causa:\s*"([a-z0-9-]+)"/g)].map((m) => m[1]));
  assert.ok(causas.size > 0, "a extração não achou nenhuma causa em verificar.js");

  const DOBRADAS = new Set(["assinatura-ilegivel", "chave-diferente"]);
  for (const causa of causas) {
    assert.ok(
      DOBRADAS.has(causa) || CAUSAS.includes(causa),
      `causa "${causa}" de verificar.js não é dobrada nem está em CAUSAS`,
    );
  }
});
