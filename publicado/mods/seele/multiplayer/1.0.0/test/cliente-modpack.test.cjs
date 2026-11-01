// A metade de cliente com mods (API 8 parte 6), na janela gerada do contrato:
// o link do Modrinth, o .mrpack escolhido e enviado ao volume, a recusa do
// teto com o tamanho e a sugestão do link, e o pack que quem joga baixa pelo
// cartão, de dentro do clique.
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { criarAnfitriao } = require('./anfitriao.cjs');
const { criarJanela } = require('./janela.cjs');
const { buscarDasFixtures, fixture } = require('./carregar.cjs');
const { packDeProva } = require('../ferramentas/pack-de-prova.cjs');

const PACK = packDeProva();
const VERSOES = 'https://api.modrinth.com/v2/project/prova-do-seele/version';
const URL_DO_PACK = JSON.parse(fixture('modrinth-prova-versoes.json'))[0].files[0].url;

async function naAbaMods() {
  const a = criarAnfitriao({ buscar: buscarDasFixtures({ [VERSOES]: fixture('modrinth-prova-versoes.json') }), packsDoCdn: { [URL_DO_PACK]: PACK } });
  const j = criarJanela(a);
  await j.abrir();
  await j.apertar('criar:minecraft');
  await j.mudar('aba', 'aba', 'aba-mods');
  return { a, j, id: a.pedir(1, { op: 'estado' }).servidores[0].id };
}

test('o .mrpack escolhido vai ao volume e vira o pack do servidor, e o arquivo é solto', async () => {
  const { a, j, id } = await naAbaMods();
  await j.escolher('pack:arquivo', PACK);
  assert.deepEqual(j.erros, []);
  assert.deepEqual(j.acoes.map(x => x.valor.op).slice(-2), ['pack-enviar', 'pack-chegou']);
  assert.equal(j.escolhidos.size, 0, 'o arquivo escolhido ficou de pé');
  assert.match(j.texto('pack'), /Prova do SEELE/);
  assert.match(j.texto('pack'), /Minecraft 1\.21\.4 · fabric-loader 0\.16\.14 · 2 arquivo\(s\) no servidor, 1 só do cliente fora/);
  assert.equal(a.pedir(1, { op: 'estado' }).servidores.find(s => s.id === id).variante, 'com-mods');
});

test('o pack acima do teto é dito com o tamanho e o teto, e a frase sugere o link do Modrinth', async () => {
  const { j } = await naAbaMods();
  await j.escolher('pack:arquivo', null, { erro: 'arquivo-grande-demais', tamanho: 70 * 1024 * 1024, teto: 64 * 1024 * 1024 });
  assert.match(j.texto('aviso'), /use o link do Modrinth/);
  // O nome cru e os números ficam atrás de DETALHES.
  assert.doesNotMatch(j.texto('aviso'), /arquivo-grande-demais/);
  await j.apertar('detalhes:pack-escolher:arquivo-grande-demais');
  assert.match(j.texto('aviso'), /arquivo-grande-demais/);
  assert.match(j.texto('aviso'), /"tamanho":73400320/);
  assert.match(j.texto('aviso'), /"teto":67108864/);
});

test('o link do Modrinth vira o pack, e a página diz de onde ele veio', async () => {
  const { j } = await naAbaMods();
  await j.mudar('campo', 'pack:link-texto', 'https://modrinth.com/modpack/prova-do-seele');
  await j.apertar('pack:link');
  assert.equal(j.acoes.at(-1).valor.op, 'pack-link');
  assert.match(j.texto('pack'), /pelo link do Modrinth/);
});

test('quem joga baixa o pack pelo cartão, de dentro do clique, e o cartão diz quanto veio', async () => {
  const { a, j, id } = await naAbaMods();
  await j.escolher('pack:arquivo', PACK);
  const k = criarJanela(a, { pessoa: 3 });
  await k.abrir();
  await k.apertar('salvar-pack:' + id);
  assert.equal(k.salvos.length, 1);
  assert.ok(k.salvos[0].bilhete, 'o salvar saiu sem o bilhete do clique');
  assert.deepEqual(k.salvos[0].pedido.pedido, { op: 'pack-ler', id });
  assert.match(k.salvos[0].pedido.nome, /^Prova do SEELE\.mrpack$/);
  assert.match(k.texto('cartao:' + id), /Pack salvo: 0,0 MiB/);
});

test('o cartão de um pack pelo link leva à página do Modrinth, e não ao salvar', async () => {
  const { j, id } = await naAbaMods();
  await j.mudar('campo', 'pack:link-texto', 'https://modrinth.com/modpack/prova-do-seele');
  await j.apertar('pack:link');
  await j.apertar('voltar');
  assert.equal(j.no('salvar-pack:' + id), null);
  assert.match(j.no('pack-link:' + id).endereco, /^https:\/\/modrinth\.com\/modpack\/prova-do-seele\/version\//);
});

test('trocar o pack não apaga o que a pessoa escreveu e não salvou (M11)', async () => {
  const { a, j, id } = await naAbaMods();
  const geral = () => j.mudar('aba', 'aba', 'aba-geral');
  const mods = () => j.mudar('aba', 'aba', 'aba-mods');
  await geral();
  await j.mudar('numero', 'cfg:maximo', 7);
  await j.mudar('campo', 'cfg:nome:0:texto', 'Casa com mods');
  await mods();
  await j.mudar('campo', 'pack:link-texto', 'https://modrinth.com/modpack/prova-do-seele');
  await j.apertar('pack:link');
  await geral();
  assert.equal(j.no('cfg:maximo').valor, 7, 'o pack pelo link apagou o rascunho');
  assert.equal(j.no('cfg:nome:0:texto').valor, 'Casa com mods');
  // E pelo envio também.
  await j.mudar('numero', 'cfg:maximo', 8);
  await mods();
  await j.escolher('pack:arquivo', PACK);
  await geral();
  assert.equal(j.no('cfg:maximo').valor, 8, 'o pack enviado apagou o rascunho');
  // O que o pack define (a variante e a versão) vem dele, e salvar grava os dois lados.
  await j.apertar('salvar');
  const s = a.pedir(1, { op: 'estado' }).servidores.find(x => x.id === id);
  assert.deepEqual([s.variante, s.versao, s.config.maximo, s.config.nome[0].texto], ['com-mods', '1.21.4', 8, 'Casa com mods']);
});
