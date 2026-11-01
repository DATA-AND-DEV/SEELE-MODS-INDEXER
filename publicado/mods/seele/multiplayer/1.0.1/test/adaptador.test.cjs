// O adaptador é a única porta para a API da máquina. Este teste escreve,
// chamada a chamada, o que o SEELE entregou nas partes 3 e 4 (o bloco
// «metade-de-maquina» de test/contrato/api-v8.json): um nome que mudar no
// contrato reprova aqui, e se troca só em fonte/adaptador.js.
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { carregar } = require('./carregar.cjs');

const local = v => JSON.parse(JSON.stringify(v));
const contrato = JSON.parse(fs.readFileSync(path.join(__dirname, 'contrato', 'api-v8.json'), 'utf8'));

/** Um `maquina` global com a forma do prelúdio da API 8, que anota cada chamada. */
function maquinaFalsa() {
  const chamadas = [];
  const anota = (nome, volta = null) => (...args) => { chamadas.push([nome, ...local(args.filter(a => typeof a !== 'function'))]); return Promise.resolve(volta); };
  const ouvintes = {};
  const proc = {
    numero: 1, pid: 42,
    aoLinha: fn => { ouvintes.linha = fn; },
    aoSair: fn => { ouvintes.sair = fn; },
    escrever: anota('proc.escrever'),
    matar: anota('proc.matar'),
  };
  const maquina = {
    servidor: 'minecraft-1',
    plataforma: 'mac-aarch64',
    oferta: {},
    programa: {
      baixar: anota('programa.baixar', { destino: 'server.jar' }),
      escrever: anota('programa.escrever'),
      desempacotar: anota('programa.desempacotar', { arquivos: 3 }),
      rodar: (...a) => { chamadas.push(['programa.rodar', ...local(a)]); return Promise.resolve(proc); },
      recusas: anota('programa.recusas', { 'diferente-do-aceito': 2 }),
      empacotar: anota('programa.empacotar', { sha256: 'c'.repeat(64) }),
      oferecerCopia: anota('programa.oferecerCopia', { codigo: 'k' }),
      receberCopia: anota('programa.receberCopia', { caminho: 'direto' }),
    },
    porta: { servir: anota('porta.servir'), parar: anota('porta.parar'), quedas: anota('porta.quedas') },
    pedir: (...a) => { chamadas.push(['pedir', ...local(a)]); return Promise.resolve('{"ok":true,"plano":{}}'); },
    aoAviso: fn => { ouvintes.aviso = fn; },
    aoParar: fn => { ouvintes.parar = fn; },
  };
  return { maquina, chamadas, ouvintes };
}

test('cada chamada do adaptador vira a chamada da API 8 que o SEELE entregou', async () => {
  const { maquina, chamadas, ouvintes } = maquinaFalsa();
  const { criarAdaptador } = carregar('maquina', ['criarAdaptador'], { __testeSemPartida: true, maquina, setTimeout });
  const ad = criarAdaptador();
  assert.equal(ad.servidor, 'minecraft-1');
  assert.equal(ad.plataforma(), 'mac-aarch64');
  await ad.baixar({ url: 'https://x/y.jar', hash: { algoritmo: 'sha1', hex: 'ab' }, tamanho: 3, destino: 'server.jar' });
  await ad.desempacotar({ arquivo: 'pacotes/j.tar.gz', destino: 'java', raiz: 'jdk/Contents/Home' });
  const proc = await ad.rodar({ comando: 'java/bin/java', argumentos: ['-jar', 'server.jar'], pasta: '' });
  await proc.escrever('stop\n');
  await proc.encerrar();
  const tunel = await ad.servirPorta({ nome: 'minecraft-1', protocolo: 'tcp', porta: 25565 });
  await tunel.fechar();
  await ad.escrever('eula.txt', 'eula=true\n');
  assert.deepEqual(local(await ad.pedir({ op: 'plano' })), { ok: true, plano: {} }, 'a resposta da metade de servidor vem lida');
  assert.deepEqual(local(await ad.recusas()), { 'diferente-do-aceito': 2 });
  // A cópia do mundo (parte 7).
  await ad.empacotar('world', 'copias/mundo.tar.gz');
  await ad.oferecerCopia('copias/mundo.tar.gz', 35565);
  await ad.receberCopia({ tunel: 'minecraft-1-copia', codigo: 'k', sha256: 'c', tamanho: 9, destino: 'copias/recebida.tar.gz' });
  assert.deepEqual(chamadas, [
    ['programa.baixar', { url: 'https://x/y.jar', sha1: 'ab', tamanho: 3, destino: 'server.jar' }],
    ['programa.desempacotar', { arquivo: 'pacotes/j.tar.gz', destino: 'java', raiz: 'jdk/Contents/Home' }],
    ['programa.rodar', { comando: 'java/bin/java', argumentos: ['-jar', 'server.jar'], pasta: '' }],
    ['proc.escrever', 'stop\n'],
    ['proc.matar'],
    ['porta.servir', { nome: 'minecraft-1', protocolo: 'tcp', porta: 25565 }],
    ['porta.parar', 'minecraft-1'],
    ['programa.escrever', { destino: 'eula.txt', texto: 'eula=true\n' }],
    ['pedir', { op: 'plano' }],
    ['programa.recusas'],
    ['programa.empacotar', { origem: 'world', arquivo: 'copias/mundo.tar.gz' }],
    ['programa.oferecerCopia', { arquivo: 'copias/mundo.tar.gz', porta: 35565 }],
    ['programa.receberCopia', { tunel: 'minecraft-1-copia', codigo: 'k', sha256: 'c', tamanho: 9, destino: 'copias/recebida.tar.gz' }],
  ]);

  // O aviso chega em texto, e sai lido, com o servidor desta metade.
  const avisos = [];
  ad.aoAviso((servidor, carga) => avisos.push([servidor, local(carga)]));
  ouvintes.aviso('{"op":"ligar"}');
  assert.deepEqual(avisos, [['minecraft-1', { op: 'ligar' }]]);

  // O fim do processo, na forma que a metade lê.
  const fins = [];
  proc.aoSair(f => fins.push(local(f)));
  ouvintes.sair({ codigo: null, mortoAPedido: true, linhasPerdidas: 0, linhasCortadas: 0, linhasNaoOuvidas: 0 });
  assert.deepEqual(fins, [{ codigo: null, sinal: 'morto-a-pedido', linhasPerdidas: 0, linhasNaoOuvidas: 0 }]);
});

test('todo nome que o adaptador chama está no contrato da metade de máquina', () => {
  const fonte = fs.readFileSync(path.join(__dirname, '..', 'fonte', 'adaptador.js'), 'utf8')
    .replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
  const usados = new Set([...fonte.matchAll(/\bm\.([a-zA-Z]+(?:\.[a-zA-Z]+)?)/g)].map(x => 'maquina.' + x[1]));
  const doContrato = Object.keys(contrato['metade-de-maquina']).map(k => k.split('(')[0]);
  assert.ok(usados.size >= 12, [...usados].join(', '));
  for (const nome of usados) {
    assert.ok(doContrato.includes(nome) || doContrato.some(k => k.startsWith(nome + '.')), `${nome} não está em metade-de-maquina do contrato`);
  }
  for (const nome of ['proc.aoLinha', 'proc.aoSair', 'proc.escrever', 'proc.matar']) {
    assert.ok(fonte.includes(nome), nome);
    assert.ok(doContrato.includes(nome.replace('proc.', 'processo.')), nome);
  }
  assert.deepEqual(contrato.compatibilidade['capacidades-da-maquina'].programa, ['maquina.programa']);
});

test('um erro síncrono da API vira promessa rejeitada, e não some no meio da fila', async () => {
  const { maquina } = maquinaFalsa();
  maquina.programa.baixar = () => { throw Object.assign(new Error('fora-dos-artefatos-aceitos'), { erro: 'fora-dos-artefatos-aceitos' }); };
  const { criarAdaptador } = carregar('maquina', ['criarAdaptador'], { __testeSemPartida: true, maquina, setTimeout });
  const falha = await criarAdaptador().baixar({ url: 'https://x', hash: { algoritmo: 'sha1', hex: 'a' }, tamanho: 1, destino: 'x' }).then(() => null, e => e);
  assert.equal(falha?.erro, 'fora-dos-artefatos-aceitos');
});

test('sem a API da máquina, a metade de máquina lança dizendo o que falta, e não sobe calada', () => {
  assert.throws(() => carregar('maquina', [], {}), /maquina\.programa.*maquina\.porta/);
});

test('só o adaptador alcança o objeto maquina', () => {
  // Trocar um nome da API é uma mudança num arquivo só.
  for (const nome of ['comum', 'esquema', 'receita', 'maquina', 'servidor', 'cliente']) {
    const fonte = fs.readFileSync(path.join(__dirname, '..', 'fonte', nome + '.js'), 'utf8')
      .replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    // `contexto.maquina.servidor`, da metade de servidor, não é o global.
    assert.doesNotMatch(fonte, /(?<![\w.])maquina\.(programa|porta|pedir|aoAviso|aoParar|plataforma|servidor|oferta)\b/, nome + '.js chama a API da máquina por fora do adaptador');
  }
});
