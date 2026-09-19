import { test } from "node:test";
import assert from "node:assert/strict";

import {
  acaoDeInstalar,
  avaliacaoDaVersao,
  cruzarRevogacoes,
  filtrar,
  ordenar,
  versaoEscolhida,
  versaoMaisRecente,
} from "../catalogo.js";

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

// --- A avaliação por versão -------------------------------------------------
//
// Duas versões do MESMO mod com vereditos diferentes. Se as duas fossem
// iguais, devolver o veredito do mod no lugar do da versão passaria batido —
// que é exatamente como o defeito viveu até aqui.

const DUAS_VERSOES = {
  id: "juli/cinza-frio", autor: "juli", nome: "cinza-frio", titulo: "Cinza Frio",
  resumo: "Contraste alto.", repo: "https://github.com/juli/x",
  // O nível do MOD é o da avaliação mais recente — a 2.0.0.
  nivel: "oficial", oficial: true, notas: [], commit: "a".repeat(40),
  versoes: [
    {
      versao: "1.0.0", api: 1, publicado_em: 1000, hash: "e".repeat(64),
      alcanca: [], arquivos: ["mod.json"],
      nivel: "com-notas", notas: ["fala-com-terceiro"], commit: "b".repeat(40),
    },
    {
      versao: "2.0.0", api: 1, publicado_em: 3000, hash: "f".repeat(64),
      alcanca: [], arquivos: ["mod.json"],
      nivel: "oficial", notas: [], commit: "a".repeat(40),
    },
  ],
};

const ANTIGA = DUAS_VERSOES.versoes[0];
const RECENTE = DUAS_VERSOES.versoes[1];

test("sem escolha, a versão exibida é a mais recente", () => {
  assert.equal(versaoEscolhida(DUAS_VERSOES, null).versao, "2.0.0");
});

test("escolher a versão antiga devolve a versão antiga", () => {
  assert.equal(versaoEscolhida(DUAS_VERSOES, "1.0.0").versao, "1.0.0");
});

test("uma versão que saiu do catálogo cai na mais recente, e não em nada", () => {
  assert.equal(versaoEscolhida(DUAS_VERSOES, "0.9.0").versao, "2.0.0");
});

test("a versão antiga carrega a avaliação dela, e não a do mod", () => {
  const avaliacao = avaliacaoDaVersao(DUAS_VERSOES, ANTIGA);
  assert.equal(avaliacao.nivel, "com-notas");
  assert.deepEqual(avaliacao.notas, ["fala-com-terceiro"]);
  assert.equal(avaliacao.commit, "b".repeat(40));
  // O guarda contra a mistura: o mod diz outra coisa, e tem de continuar
  // dizendo. Se alguém voltar a ler o veredito do mod aqui, estes três caem.
  assert.notEqual(avaliacao.nivel, DUAS_VERSOES.nivel);
  assert.notDeepEqual(avaliacao.notas, DUAS_VERSOES.notas);
  assert.notEqual(avaliacao.commit, DUAS_VERSOES.commit);
});

test("a versão mais recente carrega a avaliação dela, que coincide com a do mod", () => {
  const avaliacao = avaliacaoDaVersao(DUAS_VERSOES, RECENTE);
  assert.equal(avaliacao.nivel, "oficial");
  assert.deepEqual(avaliacao.notas, []);
  assert.equal(avaliacao.commit, "a".repeat(40));
});

test("um catálogo antigo, sem avaliação por versão, cai no veredito do mod", () => {
  // Compatibilidade: `catalogo.json` gerado antes destes campos existirem não
  // tem o que responder, e a tela mostra o que mostrava antes em vez de vazio.
  const semCampos = { versao: "2.1.0", api: 1, publicado_em: 3000, hash: "a".repeat(64) };
  const avaliacao = avaliacaoDaVersao(MODS[0], semCampos);
  assert.equal(avaliacao.nivel, "verificado");
  assert.deepEqual(avaliacao.notas, []);
});

// --- O que instalar, e de qual versão ---------------------------------------
//
// O hash e os arquivos já saíam da versão escolhida na ficha; o caminho de
// ação, não — ele era montado a partir do MOD, e por isso apontava sempre
// para a versão mais recente. É o pior lugar para isso acontecer: é o passo
// em que alguém baixa bytes, e o hash ao lado é o número com que ele vai
// conferir o que baixou.

test("a ação leva o hash, a base e os arquivos da versão escolhida", () => {
  const acao = acaoDeInstalar(DUAS_VERSOES, ANTIGA);
  assert.equal(acao.versao, "1.0.0");
  assert.equal(acao.hash, "e".repeat(64));
  assert.equal(acao.base, "mods/juli/cinza-frio/1.0.0/");
  assert.deepEqual(acao.arquivos, [
    { caminho: "mod.json", url: "mods/juli/cinza-frio/1.0.0/mod.json" },
  ]);
});

test("a ação da versão antiga discorda da ação da mais recente", () => {
  // O guarda direto contra a volta da seleção por MOD: se o caminho de ação
  // voltar a sair de `versaoMaisRecente(mod)`, as duas passam a concordar.
  const antiga = acaoDeInstalar(DUAS_VERSOES, ANTIGA);
  const recente = acaoDeInstalar(DUAS_VERSOES, RECENTE);
  assert.notEqual(antiga.hash, recente.hash);
  assert.notEqual(antiga.base, recente.base);
  assert.notDeepEqual(antiga.arquivos, recente.arquivos);
});

test("a ação diz qual versão o identificador realmente traz", () => {
  // `autor/nome` é o que o app aceita hoje, e ele instala a mais recente.
  const antiga = acaoDeInstalar(DUAS_VERSOES, ANTIGA);
  assert.equal(antiga.identificador, "juli/cinza-frio");
  assert.equal(antiga.maisRecente, "2.0.0");
  assert.equal(antiga.ehMaisRecente, false);
  assert.equal(acaoDeInstalar(DUAS_VERSOES, RECENTE).ehMaisRecente, true);
});

test("a ação nunca inventa arquivo que a versão não lista", () => {
  const semArquivos = { ...ANTIGA, arquivos: [] };
  assert.deepEqual(acaoDeInstalar(DUAS_VERSOES, semArquivos).arquivos, []);
});


test('API 3 não considera pacotes antigos compatíveis; mantém a consulta histórica', () => {
  const atual = {...MODS[0], id:'novo/atual', versoes:[{versao:'1', api:3, publicado_em:5000}]};
  assert.deepEqual(filtrar([...MODS, atual], {api:3}).map(m=>m.id), ['novo/atual']);
  assert.deepEqual(filtrar([atual], {api:2}), []);
});
