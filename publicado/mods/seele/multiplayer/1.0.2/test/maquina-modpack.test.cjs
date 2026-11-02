// A metade de máquina com mods (API 8 parte 6), contra um adaptador falso com
// um disco de mentira, e com a metade de servidor de verdade do outro lado: o
// pack trazido pelo volume (ou baixado do CDN pelo link), aberto, o índice
// lido e conferido de novo, cada arquivo do servidor baixado pelo sha512 (e o
// só-do-cliente não), os overrides e depois os server-overrides por cima, o
// instalador do loader rodado uma vez com os argumentos aceitos, e cada falha
// na tela com os dados.
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { carregar, buscarDasFixtures, fixture } = require('./carregar.cjs');
const { criarAnfitriao } = require('./anfitriao.cjs');
const { packDeProva } = require('../ferramentas/pack-de-prova.cjs');
const { lerZip, escreverZip } = require('./zip.cjs');

const { criarMaquina, receitaPorId: receitaDaMaquina } = carregar('maquina', ['criarMaquina', 'receitaPorId'], { __testeSemPartida: true });
const local = v => JSON.parse(JSON.stringify(v));
const assentar = () => new Promise(r => setImmediate(r));
async function assentarTudo() { for (let i = 0; i < 40; i++) await assentar(); }

const PACK = packDeProva();
const VERSOES = 'https://api.modrinth.com/v2/project/prova-do-seele/version';
const URL_DO_PACK = JSON.parse(fixture('modrinth-prova-versoes.json'))[0].files[0].url;

/** Um processo de mentira, que o teste faz sair. */
function processoFalso() {
  const p = { entrada: [], linhas: null, sair: null };
  p.api = {
    aoLinha: fn => { p.linhas = fn; },
    aoSair: fn => { p.sair = fn; },
    escrever: texto => { p.entrada.push(texto); },
    encerrar: () => p.sair?.({ codigo: null, sinal: 'morto-a-pedido' }),
  };
  return p;
}

/** O adaptador falso com um disco: o que se baixa, traz, abre e lê fica em `disco`. */
function adaptadorComDisco(a, pessoa, opcoes = {}) {
  const f = { disco: new Map(), baixados: [], trazidos: [], abertos: [], rodados: [], processos: [], ouvinte: null };
  const erro = (nome, extra = {}) => Object.assign(new Error(nome), { erro: nome, ...extra });
  f.ad = {
    plataforma: () => opcoes.plataforma ?? 'mac-aarch64',
    baixar: async pedido => {
      f.baixados.push(local(pedido));
      f.disco.set(pedido.destino, pedido.url === URL_DO_PACK ? PACK : Buffer.from('baixado ' + pedido.url));
      return { jaEstava: false };
    },
    trazer: async ({ pedido, destino }) => {
      f.trazidos.push(local({ pedido, destino }));
      if (opcoes.trazer) return opcoes.trazer({ pedido, destino });
      let bytes;
      try { bytes = a.lerDoVolume(pessoa, pedido); } catch (e) { throw erro('pack-nao-veio', { motivo: e.erro }); }
      f.disco.set(destino, bytes);
      return { destino, tamanho: bytes.length, jaEstava: false };
    },
    desempacotar: async ({ arquivo, destino, raiz, mesclar }) => {
      f.abertos.push(local({ arquivo, destino, raiz, mesclar: Boolean(mesclar) }));
      // O Java é um .tar.gz de mentira: abrir é só dizer que abriu.
      if (arquivo !== 'pack.mrpack') return { arquivos: 1 };
      const prefixo = raiz ? raiz + '/' : '';
      const entradas = lerZip(f.disco.get(arquivo)).filter(e => e.nome.startsWith(prefixo));
      if (!entradas.length) throw erro('nada-sob-a-raiz', { arquivo, raiz });
      if (!mesclar) for (const k of [...f.disco.keys()]) if (k.startsWith(destino + '/')) f.disco.delete(k);
      for (const e of entradas) f.disco.set((destino ? destino + '/' : '') + e.nome.slice(prefixo.length), e.dados);
      return { arquivos: entradas.length };
    },
    ler: async arquivo => {
      if (!f.disco.has(arquivo)) throw erro('disco', { caminho: arquivo });
      // Como o produto: um arquivo que não é UTF-8 (um jar) é recusado, e não lido.
      if (!require('node:buffer').isUtf8(f.disco.get(arquivo))) throw erro('nao-e-texto', { arquivo });
      return f.disco.get(arquivo).toString('utf8');
    },
    escrever: async (caminho, texto) => { f.disco.set(caminho, Buffer.from(texto)); },
    rodar: async pedido => {
      // **Como o produto** (`politica_do_aceite` + `rodar`): só o par desta
      // máquina na oferta aceita — o da entrada de `por_sistema` do sistema
      // dela, ou o de cima —, cada comando com os argumentos dele.
      const aceita = a.livro.get(f.servidor)?.oferta;
      if (aceita) {
        const plataforma = opcoes.plataforma ?? 'mac-aarch64';
        const e = (aceita.por_sistema ?? []).find(x => x.plataformas.includes(plataforma));
        const par = e ? [e.rodar, e.instalar] : [aceita.rodar, aceita.instalar];
        const igual = c => c && c.comando === pedido.comando && JSON.stringify(c.argumentos) === JSON.stringify(pedido.argumentos);
        if (!par.some(igual)) throw erro('comando-fora-do-aceito', { pedido: pedido.comando, argumentos: pedido.argumentos });
      }
      f.rodados.push(local(pedido));
      const p = processoFalso();
      f.processos.push(p);
      // O instalador sai sozinho, com o código que o teste pedir.
      if (pedido.argumentos.some(x => /-installer\.jar$/.test(x))) {
        setImmediate(() => {
          p.linhas?.(pedido.argumentos.includes('fabric-installer.jar') ? 'Installing Fabric Server: 0.16.14' : 'Installing server: ' + pedido.argumentos.join(' '));
          p.sair?.({ codigo: opcoes.codigoDoInstalador ?? 0 });
        });
      }
      return p.api;
    },
    servirPorta: async () => ({ fechar: () => {} }),
    recusas: async () => ({}),
    copiar: null,
    pedir: async valor => a.daMaquina(pessoa, f.servidor, valor),
    aoAviso: fn => { f.ouvinte = fn; },
    aoParar: () => {},
    esperar: () => new Promise(() => {}),
    registrar: () => {},
  };
  return f;
}

async function entregar(a, f) {
  f.lidos = f.lidos ?? 0;
  while (f.lidos < a.avisosAMaquinas.length) {
    const aviso = a.avisosAMaquinas[f.lidos++];
    if (aviso.para === '2') f.ouvinte(aviso.servidor, aviso.carga);
    await assentarTudo();
  }
  await assentarTudo();
}

/** Um Minecraft com o pack de prova (pelo envio, ou pelo link), na máquina da pessoa 2, aceito. */
async function comMods(opcoes = {}) {
  const a = criarAnfitriao({ buscar: buscarDasFixtures({ [VERSOES]: fixture('modrinth-prova-versoes.json') }), packsDoCdn: { [URL_DO_PACK]: PACK } });
  const id = a.acao(1, 'criar-servidor-de-jogo', { op: 'criar', receita: 'minecraft' }).servidor.id;
  a.acao(1, 'configurar-servidor-de-jogo', { op: 'configurar', id, variante: 'com-mods', quem: '2', config: {} });
  if (opcoes.link) {
    a.acao(1, 'configurar-servidor-de-jogo', { op: 'pack-link', id, link: 'https://modrinth.com/modpack/prova-do-seele' });
  } else {
    const e = a.acao(1, 'configurar-servidor-de-jogo', { op: 'pack-enviar', id });
    a.enviarAoVolume(e.token, opcoes.pack ?? PACK);
    a.acao(1, 'configurar-servidor-de-jogo', { op: 'pack-chegou', id, token: e.token });
  }
  const f = adaptadorComDisco(a, 2, opcoes);
  f.servidor = id;
  f.ad.servidor = id;
  criarMaquina(f.ad);
  a.aceitar(id);
  await entregar(a, f);
  return { a, f, id };
}

const doServidor = (a, id) => a.pedir(1, { op: 'estado' }).servidores.find(s => s.id === id);

test('o pack enviado vem pelo volume, é aberto, e só os arquivos do servidor são baixados, pelo sha512', async () => {
  const { a, f, id } = await comMods();
  assert.deepEqual(f.trazidos, [{ pedido: { op: 'pack-ler', id }, destino: 'pack.mrpack' }]);
  const doPack = f.baixados.filter(b => b.destino.startsWith('mods/'));
  assert.deepEqual(doPack.map(b => b.destino), ['mods/fabric-api-0.119.4+1.21.4.jar', 'mods/lithium-fabric-0.15.3+mc1.21.4.jar']);
  assert.ok(doPack.every(b => b.hash.algoritmo === 'sha512' && b.hash.hex.length === 128));
  assert.ok(!f.baixados.some(b => /sodium/.test(b.url)), 'o mod só do cliente foi baixado');
  assert.ok(f.baixados.some(b => b.destino === 'fabric-installer.jar' && b.hash.algoritmo === 'sha512'));
  assert.equal(doServidor(a, id).estado, 'pronto', JSON.stringify(doServidor(a, id).falhas));
});

test('os overrides entram, e os server-overrides por cima deles', async () => {
  const { f } = await comMods();
  const mesclados = f.abertos.filter(x => x.mesclar);
  assert.deepEqual(mesclados.map(x => [x.raiz, x.destino]), [['overrides', ''], ['server-overrides', '']]);
  assert.equal(f.disco.get('config/seele-prova.txt').toString(), 'de server-overrides\n');
  assert.equal(f.disco.get('config/so-overrides.txt').toString(), 'fica\n');
});

test('o instalador do loader roda uma vez, com os argumentos do aceite, e a marca evita a segunda', async () => {
  const { a, f, id } = await comMods();
  assert.deepEqual(f.rodados, [{ comando: 'java/bin/java', argumentos: ['-jar', 'fabric-installer.jar', 'server', '-mcversion', '1.21.4', '-loader', '0.16.14'], pasta: '' }]);
  assert.equal(f.disco.get('.seele-loader').toString(), 'fabric-loader@0.16.14@1.21.4\n');
  // Ligar: o servidor roda com o lançador do Fabric, e o instalador não roda de novo.
  a.acao(1, 'ligar-desligar-servidor-de-jogo', { op: 'ligar', id });
  await entregar(a, f);
  assert.equal(f.rodados.length, 2);
  assert.deepEqual(f.rodados[1].argumentos, ['-Xms1G', '-Xmx2G', '-jar', 'fabric-server-launch.jar', 'nogui']);
});

test('a metade que sobe de novo (o app reaberto) acha a marca e não roda o instalador outra vez', async () => {
  const { a, f, id } = await comMods();
  assert.equal(f.rodados.length, 1);
  // Outra metade, o mesmo disco: a memória dela não sabe o que foi preparado.
  criarMaquina(f.ad);
  await entregar(a, f);
  await assentarTudo();
  assert.equal(f.rodados.length, 1, 'o instalador rodou de novo: ' + JSON.stringify(f.rodados));
  assert.equal(doServidor(a, id).estado, 'pronto');
});

test('o instalador que sai com erro para tudo, e a tela tem o código e as linhas', async () => {
  const { a, f, id } = await comMods({ codigoDoInstalador: 3 });
  const falha = doServidor(a, id).falhas.at(-1);
  assert.equal(falha.etapa, 'instalar');
  assert.equal(falha.erro, 'instalador-falhou');
  assert.equal(falha.dados.codigo, 3);
  assert.ok(falha.dados.linhas.some(l => l.includes('Installing Fabric')));
  assert.ok(!f.disco.has('.seele-loader'));
  assert.notEqual(doServidor(a, id).estado, 'pronto');
});

test('pelo link, o .mrpack vem do CDN do Modrinth como artefato, sem passar pelo volume', async () => {
  const { a, f, id } = await comMods({ link: true });
  assert.deepEqual(f.trazidos, []);
  const pack = f.baixados.find(b => b.destino === 'pack.mrpack');
  assert.equal(pack.url, URL_DO_PACK);
  assert.equal(pack.hash.algoritmo, 'sha512');
  assert.equal(doServidor(a, id).estado, 'pronto', JSON.stringify(doServidor(a, id).falhas));
});

test('o pack que não veio da metade de servidor é dito, com o motivo do produto', async () => {
  const { a, id } = await comMods({ trazer: () => { throw Object.assign(new Error('pack-diferente'), { erro: 'pack-diferente', esperado: 'a', obtido: 'b' }); } });
  const falha = doServidor(a, id).falhas.at(-1);
  assert.deepEqual([falha.etapa, falha.erro, falha.dados.esperado, falha.dados.obtido], ['trazer-pack', 'pack-diferente', 'a', 'b']);
});

test('o índice dos bytes aceitos é conferido de novo na máquina, e um que não serve para tudo', async () => {
  const { a, f, id } = await comMods({
    trazer: ({ destino }) => {
      const ruim = escreverZip([['modrinth.index.json', JSON.stringify({ formatVersion: 1, game: 'minecraft', files: [{ path: '../fora.jar', hashes: { sha512: 'a'.repeat(128) }, downloads: ['https://cdn.modrinth.com/x.jar'], fileSize: 1 }], dependencies: { minecraft: '1.21.4', 'fabric-loader': '0.16.14' } }), true]]);
      f_.disco.set(destino, ruim);
      return {};
    },
  });
  const falha = doServidor(a, id).falhas.at(-1);
  assert.deepEqual([falha.etapa, falha.erro, falha.dados.path], ['indice', 'caminho-recusado', '../fora.jar']);
  assert.ok(!f.baixados.some(b => b.destino.includes('fora')));
});

// ---- revisão final (I2): o pack não troca o que o aceite diz que roda ----

const { indiceDeProva } = require('../ferramentas/pack-de-prova.cjs');
const packCom = (extras, indice = indiceDeProva()) => escreverZip([
  ['modrinth.index.json', JSON.stringify(indice), true],
  ['overrides/config/seele-prova.txt', 'de overrides\n', false],
  ...extras,
]);

for (const [raiz, caminho] of [
  ['overrides', 'server.jar'],
  ['server-overrides', 'fabric-server-launch.jar'],
  ['overrides', 'fabric-installer.jar'],
  ['overrides', '.seele-loader'],
  ['server-overrides', 'java/bin/java'],
  ['overrides', 'fabric-server-launcher.properties'],
]) {
  test(`um pack com ${raiz}/${caminho} é recusado antes de aplicar qualquer override`, async () => {
    // Um jar de verdade não é texto: o `ler` do produto o recusa com `nao-e-texto`, e isso é «está lá».
    const conteudo = /\.jar$|java$/.test(caminho) ? Buffer.from([0x50, 0x4b, 0x03, 0x04, 0xff, 0xfe, 0x00]) : 'outro programa';
    const { a, f, id } = await comMods({ pack: packCom([[`${raiz}/${caminho}`, conteudo, false]]) });
    const falha = doServidor(a, id).falhas.at(-1);
    assert.deepEqual([falha?.etapa, falha?.erro, falha?.dados.path], ['aplicar-' + raiz, 'pack-troca-o-que-roda', caminho], JSON.stringify(doServidor(a, id).falhas));
    assert.deepEqual(f.abertos.filter(x => x.mesclar), [], 'um override foi aplicado');
    assert.deepEqual(f.rodados, [], 'o instalador rodou');
    assert.notEqual(doServidor(a, id).estado, 'pronto');
  });
}

test('um arquivo do índice que cai num caminho do aceite (server.jar) é recusado, e nada do pack é baixado', async () => {
  const indice = indiceDeProva();
  indice.files[0] = { ...indice.files[0], path: 'server.jar' };
  const { a, f, id } = await comMods({ pack: packCom([], indice) });
  const falha = doServidor(a, id).falhas.at(-1);
  assert.deepEqual([falha?.etapa, falha?.erro, falha?.dados.path], ['indice', 'pack-troca-o-que-roda', 'server.jar'], JSON.stringify(doServidor(a, id).falhas));
  assert.ok(!f.baixados.some(b => /cdn\.modrinth\.com/.test(b.url)), 'um arquivo do pack foi baixado');
});

test('um jar em overrides/mods entra (é o que o termo do pack diz que roda)', async () => {
  const { a, f, id } = await comMods({ pack: packCom([['overrides/mods/proprio.jar', 'um mod do pack', false]]) });
  assert.equal(f.disco.get('mods/proprio.jar')?.toString(), 'um mod do pack');
  assert.equal(doServidor(a, id).estado, 'pronto', JSON.stringify(doServidor(a, id).falhas));
});

// ---- O Forge e o NeoForge de verdade (medidos em 31/10, um Mac ARM) ----

test('o pack de prova do Forge: o instalador com --installServer e o jogo pelo unix_args.txt do Forge 1.20.1-47.4.28', async () => {
  const { packDeProva: pack } = require('../ferramentas/pack-de-prova.cjs');
  const { a, f, id } = await comMods({ pack: pack('forge') });
  assert.equal(doServidor(a, id).estado, 'pronto', JSON.stringify(doServidor(a, id).falhas));
  assert.deepEqual(f.rodados[0], { comando: 'java/bin/java', argumentos: ['-jar', 'forge-installer.jar', '--installServer'], pasta: '' });
  assert.equal(f.disco.get('.seele-loader').toString(), 'forge@47.4.28@1.20.1\n');
  assert.ok(f.baixados.some(b => b.destino === 'forge-installer.jar' && b.hash.algoritmo === 'sha256' && b.tamanho === 8859760));
  assert.ok(f.baixados.some(b => /OpenJDK17U-jre_aarch64_mac/.test(b.url)), 'o Java do 1.20.1 é o 17');
  assert.ok(!f.baixados.some(b => /embeddium/.test(b.url)), 'o mod só do cliente foi baixado');
  a.acao(1, 'ligar-desligar-servidor-de-jogo', { op: 'ligar', id });
  await entregar(a, f);
  assert.deepEqual(f.rodados[1].argumentos, ['-Xms1G', '-Xmx2G', '@libraries/net/minecraftforge/forge/1.20.1-47.4.28/unix_args.txt', 'nogui']);
});

test('o pack de prova do NeoForge: --install-server, o Java 21 e o unix_args.txt do NeoForge 21.1.265', async () => {
  const { packDeProva: pack } = require('../ferramentas/pack-de-prova.cjs');
  const { a, f, id } = await comMods({ pack: pack('neoforge') });
  assert.equal(doServidor(a, id).estado, 'pronto', JSON.stringify(doServidor(a, id).falhas));
  assert.deepEqual(f.rodados[0].argumentos, ['-jar', 'neoforge-installer.jar', '--install-server']);
  assert.ok(f.baixados.some(b => /OpenJDK21U-jre_aarch64_mac/.test(b.url)), 'o Java do 1.21.1 é o 21');
  a.acao(1, 'ligar-desligar-servidor-de-jogo', { op: 'ligar', id });
  await entregar(a, f);
  assert.deepEqual(f.rodados[1].argumentos, ['-Xms1G', '-Xmx2G', '@libraries/net/neoforged/neoforge/21.1.265/unix_args.txt', 'nogui']);
});

test('no Windows, o Forge roda pelo win_args.txt e o java.exe — o par da entrada do Windows, aceito pelo produto (decisão W1)', async () => {
  const { packDeProva: pack } = require('../ferramentas/pack-de-prova.cjs');
  const { a, f, id } = await comMods({ pack: pack('forge'), plataforma: 'windows-x64' });
  assert.equal(doServidor(a, id).estado, 'pronto', JSON.stringify(doServidor(a, id).falhas));
  // A oferta leva os dois pares; a máquina Windows roda o dela.
  const oferta = a.livro.get(id).oferta;
  assert.deepEqual(oferta.rodar.argumentos[2], '@libraries/net/minecraftforge/forge/1.20.1-47.4.28/unix_args.txt');
  assert.deepEqual(oferta.por_sistema.map(e => e.plataformas), [['windows-x64']]);
  assert.deepEqual(f.rodados[0], { comando: 'java/bin/java.exe', argumentos: ['-jar', 'forge-installer.jar', '--installServer'], pasta: '' });
  assert.ok(f.baixados.some(b => /OpenJDK17U-jre_x64_windows/.test(b.url)), 'o Java do Windows é o da Adoptium windows-x64: ' + f.baixados.map(b => b.url).join(' '));
  a.acao(1, 'ligar-desligar-servidor-de-jogo', { op: 'ligar', id });
  await entregar(a, f);
  assert.deepEqual(f.rodados[1], { comando: 'java/bin/java.exe', argumentos: ['-Xms1G', '-Xmx2G', '@libraries/net/minecraftforge/forge/1.20.1-47.4.28/win_args.txt', 'nogui'], pasta: '' });
});

test('no Windows, o NeoForge roda pelo win_args.txt do 21.1.265', async () => {
  const { packDeProva: pack } = require('../ferramentas/pack-de-prova.cjs');
  const { a, f, id } = await comMods({ pack: pack('neoforge'), plataforma: 'windows-x64' });
  assert.equal(doServidor(a, id).estado, 'pronto', JSON.stringify(doServidor(a, id).falhas));
  assert.deepEqual(f.rodados[0], { comando: 'java/bin/java.exe', argumentos: ['-jar', 'neoforge-installer.jar', '--install-server'], pasta: '' });
  a.acao(1, 'ligar-desligar-servidor-de-jogo', { op: 'ligar', id });
  await entregar(a, f);
  assert.deepEqual(f.rodados[1].argumentos, ['-Xms1G', '-Xmx2G', '@libraries/net/neoforged/neoforge/21.1.265/win_args.txt', 'nogui']);
});

test('os argumentos dos dois sistemas são os que o instalador real escreve (win_args.txt e unix_args.txt do Forge e do NeoForge, medidos em 31/10)', () => {
  // Cópias de verdade, do instalador rodado num Mac ARM: ele escreve os dois
  // arquivos em qualquer sistema, iguais a menos do separador do classpath.
  for (const [loader, pasta] of [['forge', 'libraries/net/minecraftforge/forge/1.20.1-47.4.28'], ['neoforge', 'libraries/net/neoforged/neoforge/21.1.265']]) {
    const win = fixture(`${loader}-win_args.txt`).toString();
    const unix = fixture(`${loader}-unix_args.txt`).toString();
    assert.equal(win.replace(/;/g, ':'), unix, loader);
    assert.match(win.split('\n')[0], /^-p libraries\/[^:]+;libraries\//, loader);
    assert.ok(!win.includes('\\') && !win.includes('\r'), loader);
    const receita = require('../receitas/minecraft.json').modpack.loaders[loader];
    const mc = loader === 'forge' ? '1.20.1' : '1.21.1';
    const versao = loader === 'forge' ? '47.4.28' : '21.1.265';
    const arq = receita.porSistema[0].rodar.find(x => x.startsWith('@')).slice(1).replace('{mc}', mc).replace('{loader}', versao);
    assert.equal(arq, `${pasta}/win_args.txt`, loader);
  }
});

test('um loader limitado a outros sistemas ainda é recusado antes de baixar (loader-sem-este-sistema)', async () => {
  const { packDeProva: pack } = require('../ferramentas/pack-de-prova.cjs');
  const forge = receitaDaMaquina('minecraft').modpack.loaders.forge;
  forge.sistemas = ['mac-aarch64'];
  try {
    const { a, f, id } = await comMods({ pack: pack('forge'), plataforma: 'linux-x64' });
    const falha = doServidor(a, id).falhas.at(-1);
    assert.deepEqual([falha?.etapa, falha?.erro, falha?.dados.plataforma], ['loader', 'loader-sem-este-sistema', 'linux-x64'], JSON.stringify(doServidor(a, id).falhas));
    assert.deepEqual(f.baixados, [], 'baixou antes de recusar');
  } finally {
    delete forge.sistemas;
  }
});

// O Create Live 5 (Forge 1.20.1, Modrinth) traz o mod Default Server
// Properties e um `default-server.properties`: na primeira subida, o mod troca
// o `server.properties` inteiro por ele. Medido: o jogo subiu em `*:25565`,
// com «A Minecraft Server» e 20 vagas, e o túnel abriu mesmo assim.
const { fixture: doDisco } = require('./carregar.cjs');
const DEFAULT_DO_PACK = doDisco('createlive5-default-server.properties');
const TROCADO_PELO_MOD = doDisco('forge-createlive5-server.properties');

/** O jogo sobe com o que o Default Server Properties deixaria, e diz o «Done» do Forge. */
async function subirComDsp(opcoes) {
  const ctx = await comMods({ pack: packCom([['overrides/default-server.properties', DEFAULT_DO_PACK, false]]) });
  const { a, f, id } = ctx;
  f.servidos = [];
  f.ad.servirPorta = async pedido => { f.servidos.push(pedido); return { fechar: () => {} }; };
  a.acao(1, 'ligar-desligar-servidor-de-jogo', { op: 'ligar', id });
  await entregar(a, f);
  const jogo = f.processos.at(-1);
  // O mod, na subida: o arquivo que o jogo usa passa a ser o do pack.
  f.disco.set('server.properties', opcoes.oQueOJogoUsa(f));
  jogo.linhas('[13:48:46] [Server thread/INFO] [minecraft/DedicatedServer]: Done (11.812s)! For help, type "help"');
  await assentarTudo();
  return { ...ctx, jogo };
}

test('o default-server.properties do pack recebe o que a tela promete, e o resto do pack fica (Create Live 5)', async () => {
  const { a, f, id } = await subirComDsp({ oQueOJogoUsa: f => f.disco.get('default-server.properties') });
  const escrito = f.disco.get('default-server.properties').toString();
  assert.match(escrito, /^level-type=skyblockbuilder\\:skyblock$/m, 'o tipo de mundo do pack sumiu');
  assert.match(escrito, /^server-ip=127\.0\.0\.1$/m);
  assert.match(escrito, /^motd=/m);
  assert.deepEqual(f.servidos.map(p => p.nome), ['minecraft-1'], JSON.stringify(doServidor(a, id).falhas));
  assert.equal(doServidor(a, id).estado, 'ligado');
});

test('um mod que troca o server.properties: o túnel não abre, o jogo para, e a tela diz cada chave', async () => {
  const { a, f, id, jogo } = await subirComDsp({ oQueOJogoUsa: () => Buffer.from(TROCADO_PELO_MOD) });
  assert.deepEqual(f.servidos, [], 'o túnel abriu com o jogo em *:25565');
  const falha = doServidor(a, id).falhas.at(-1);
  assert.deepEqual([falha?.etapa, falha?.erro, falha?.dados.arquivo], ['config', 'config-trocada', 'server.properties'], JSON.stringify(doServidor(a, id).falhas));
  const ip = falha.dados.trocadas.find(t => t.chave === 'server-ip');
  assert.deepEqual(ip, { chave: 'server-ip', esperado: '127.0.0.1', lido: '' });
  assert.ok(falha.dados.trocadas.some(t => t.chave === 'motd' && t.lido === 'A Minecraft Server'));
  assert.ok(jogo.entrada.includes('stop\n'), 'o jogo não recebeu o stop');
});

// O adaptador do teste acima precisa do disco antes de existir: um atalho.
let f_ = null;
const original = adaptadorComDisco;
// eslint-disable-next-line no-func-assign
adaptadorComDisco = (...args) => (f_ = original(...args));
