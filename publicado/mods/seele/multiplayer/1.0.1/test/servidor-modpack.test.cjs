// A metade de servidor com mods (API 8 parte 6), pelo anfitrião simulado: o
// pack pelo link do Modrinth (a API e o CDN das fixtures), o pack pelo envio
// (a espera no volume, o produto que confere os bytes e o teto, e o índice que
// `volume.pack` devolve), a oferta com o instalador e o hash, o aceite novo
// quando o pack muda, e o pack servido a quem joga e à máquina.
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { criarAnfitriao } = require('./anfitriao.cjs');
const { buscarDasFixtures, fixture } = require('./carregar.cjs');
const { packDeProva } = require('../ferramentas/pack-de-prova.cjs');
const { escreverZip } = require('./zip.cjs');

const PACK = packDeProva();
const SHA512 = crypto.createHash('sha512').update(PACK).digest('hex');
const VERSOES = 'https://api.modrinth.com/v2/project/prova-do-seele/version';
const URL_DO_PACK = JSON.parse(fixture('modrinth-prova-versoes.json'))[0].files[0].url;

function anfitriao(extra = {}) {
  return criarAnfitriao({
    buscar: buscarDasFixtures({ [VERSOES]: fixture('modrinth-prova-versoes.json'), ...extra }),
    packsDoCdn: { [URL_DO_PACK]: PACK },
  });
}

function criado(a, quem = '2') {
  const id = a.acao(1, 'criar-servidor-de-jogo', { op: 'criar', receita: 'minecraft' }).servidor.id;
  a.acao(1, 'configurar-servidor-de-jogo', { op: 'configurar', id, variante: 'com-mods', quem, config: {} });
  return id;
}

const doServidor = (a, id) => a.pedir(1, { op: 'estado' }).servidores.find(s => s.id === id);

test('com mods e sem pack, a máquina não é chamada, e ligar diz por quê', () => {
  const a = anfitriao();
  const id = criado(a);
  assert.equal(doServidor(a, id).aceite, 'sem-pack');
  assert.equal(a.pedidosDeMaquina.length, 0);
  assert.equal(a.acao(1, 'ligar-desligar-servidor-de-jogo', { op: 'ligar', id }).erro, 'sem-pack');
});

test('o link do Modrinth vira o pack: a API dá o .mrpack e o sha512, e a oferta leva o pack como artefato do CDN', () => {
  const a = anfitriao();
  const id = criado(a);
  const r = a.acao(1, 'configurar-servidor-de-jogo', { op: 'pack-link', id, link: 'https://modrinth.com/modpack/prova-do-seele' });
  assert.equal(r.ok, true, JSON.stringify(r));
  const s = doServidor(a, id);
  assert.equal(s.variante, 'com-mods');
  assert.equal(s.versao, '1.21.4');
  assert.equal(s.pack.origem, 'link');
  assert.equal(s.pack.sha512, SHA512);
  assert.deepEqual(s.pack.loader, { id: 'fabric-loader', versao: '0.16.14' });
  assert.equal(s.pack.arquivos, 2);
  assert.equal(s.pack.excluidos, 1);
  assert.equal(s.aceite, 'esperando');
  const oferta = a.pedidosDeMaquina.at(-1).oferta;
  assert.deepEqual(oferta.pack, { algoritmo: 'sha512', hex: SHA512 });
  assert.deepEqual(oferta.artefatos.at(-1), { nome: 'pack.mrpack', url: URL_DO_PACK, tamanho: PACK.length, hash: { algoritmo: 'sha512', hex: SHA512 } });
  assert.equal(oferta.instalar.argumentos.join(' '), '-jar fabric-installer.jar server -mcversion 1.21.4 -loader 0.16.14');
  assert.ok(oferta.origens.includes('cdn.modrinth.com'));
});

test('um link que não é do Modrinth, ou um pack grande demais para o link, é recusado com os números', () => {
  const a = anfitriao();
  const id = criado(a);
  assert.equal(a.acao(1, 'configurar-servidor-de-jogo', { op: 'pack-link', id, link: 'https://example.com/x' }).erro, 'link-nao-e-do-modrinth');
  const grande = JSON.parse(fixture('modrinth-prova-versoes.json'));
  grande[0].files[0].size = 5 * 1024 * 1024;
  const b = anfitriao({ [VERSOES]: JSON.stringify(grande) });
  const idB = criado(b);
  const r = b.acao(1, 'configurar-servidor-de-jogo', { op: 'pack-link', id: idB, link: 'https://modrinth.com/modpack/prova-do-seele' });
  assert.deepEqual([r.erro, r.tamanho, r.teto], ['pack-grande-para-o-link', 5 * 1024 * 1024, 4 * 1024 * 1024]);
});

test('o envio: a espera aceita só mrpack, o produto confere os bytes, e o pack vira o do servidor', () => {
  const a = anfitriao();
  const id = criado(a);
  const espera = a.acao(1, 'configurar-servidor-de-jogo', { op: 'pack-enviar', id });
  assert.equal(espera.ok, true);
  assert.deepEqual([...a.esperas.get(espera.token).tipos], ['mrpack']);
  a.enviarAoVolume(espera.token, PACK);
  const r = a.acao(1, 'configurar-servidor-de-jogo', { op: 'pack-chegou', id, token: espera.token });
  assert.equal(r.ok, true, JSON.stringify(r));
  const s = doServidor(a, id);
  assert.equal(s.pack.origem, 'enviado');
  assert.equal(s.pack.bytes, PACK.length);
  const oferta = a.pedidosDeMaquina.at(-1).oferta;
  assert.deepEqual(oferta.pack, { algoritmo: 'sha512', hex: SHA512 });
  assert.ok(!oferta.artefatos.some(x => x.nome === 'pack.mrpack'), 'o pack enviado foi como artefato');
  // Quem joga (e a máquina) lê o pack pelo volume, sem ação nenhuma.
  assert.deepEqual(a.lerDoVolume(3, { op: 'pack-ler', id }), PACK);
});

test('um pack que o índice recusa não fica, e o arquivo sai do volume', () => {
  const a = anfitriao();
  const id = criado(a);
  const espera = a.acao(1, 'configurar-servidor-de-jogo', { op: 'pack-enviar', id });
  const ruim = escreverZip([['modrinth.index.json', JSON.stringify({ formatVersion: 1, game: 'minecraft', files: [], dependencies: { minecraft: '1.21.4', rift: '1' } }), true]]);
  a.enviarAoVolume(espera.token, ruim);
  const r = a.acao(1, 'configurar-servidor-de-jogo', { op: 'pack-chegou', id, token: espera.token });
  assert.deepEqual([r.ok, r.erro, r.dependencia], [false, 'dependencia-desconhecida', 'rift']);
  assert.equal(doServidor(a, id).pack, null);
  assert.equal(a.volumes.size, 0, 'o pack recusado ficou no volume');
});

test('trocar o pack com a máquina aceita pede o aceite de novo, e o pack velho sai do volume', () => {
  const a = anfitriao();
  const id = criado(a);
  const enviar = bytes => {
    const e = a.acao(1, 'configurar-servidor-de-jogo', { op: 'pack-enviar', id });
    a.enviarAoVolume(e.token, bytes);
    return a.acao(1, 'configurar-servidor-de-jogo', { op: 'pack-chegou', id, token: e.token });
  };
  enviar(PACK);
  a.aceitar(id);
  assert.equal(doServidor(a, id).aceite, 'aceito');
  const pedidos = a.pedidosDeMaquina.length;
  const outro = escreverZip([['modrinth.index.json', JSON.stringify({ formatVersion: 1, game: 'minecraft', name: 'Outro', files: [], dependencies: { minecraft: '1.21.4', 'fabric-loader': '0.16.14' } }), true]]);
  assert.equal(enviar(outro).ok, true);
  assert.equal(a.pedidosDeMaquina.length, pedidos + 1);
  assert.equal(doServidor(a, id).aceite, 'esperando');
  assert.equal(a.volumes.size, 1);
});

test('o plano da máquina com mods: o instalador nos artefatos, e de onde vem o pack', () => {
  const a = anfitriao();
  const id = criado(a);
  const e = a.acao(1, 'configurar-servidor-de-jogo', { op: 'pack-enviar', id });
  a.enviarAoVolume(e.token, PACK);
  a.acao(1, 'configurar-servidor-de-jogo', { op: 'pack-chegou', id, token: e.token });
  a.aceitar(id);
  const plano = a.daMaquina(2, id, { op: 'plano' }).plano;
  assert.ok(plano.artefatos.some(x => x.destino === 'fabric-installer.jar'));
  assert.deepEqual(plano.modpack.pedido, { op: 'pack-ler', id });
  assert.equal(plano.modpack.sha512, SHA512);
  assert.equal(plano.rodar.argumentos.join(' '), '-Xms1G -Xmx2G -jar fabric-server-launch.jar nogui');
  assert.equal(plano.modpack.instalar.argumentos[1], 'fabric-installer.jar');
});

test('voltar a Vanilla tira a versão do pack e pede a versão de novo', () => {
  const a = anfitriao();
  const id = criado(a);
  a.acao(1, 'configurar-servidor-de-jogo', { op: 'pack-link', id, link: 'https://modrinth.com/modpack/prova-do-seele' });
  const r = a.acao(1, 'configurar-servidor-de-jogo', { op: 'configurar', id, variante: 'vanilla', versao: '1.21.4' });
  assert.equal(r.ok, true, JSON.stringify(r));
  const oferta = a.pedidosDeMaquina.at(-1).oferta;
  assert.equal(oferta.pack, null);
  assert.equal(oferta.instalar, undefined);
});
