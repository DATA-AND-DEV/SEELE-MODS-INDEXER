// A metade de máquina, contra um adaptador falso, e com a metade de servidor
// de verdade do outro lado (pelo anfitrião simulado): baixar e conferir,
// escrever o eula.txt só depois do aceite e o server.properties da
// configuração, rodar, ler a saída, servir o túnel, aceitar comandos e parar
// limpo. Toda falha chega à tela, pela metade de servidor, com os dados.
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { carregar } = require('./carregar.cjs');
const { criarAnfitriao } = require('./anfitriao.cjs');

const { criarMaquina } = carregar('maquina', ['criarMaquina'], { __testeSemPartida: true });

/** O objeto do `vm`, trazido para este lado (o deepEqual compara o protótipo). */
const local = v => JSON.parse(JSON.stringify(v));
const assentar = () => new Promise(r => setImmediate(r));
async function assentarTudo() {
  for (let i = 0; i < 20; i++) await assentar();
}

/** Um processo de mentira: o teste escreve a saída dele e o faz sair. */
function processoFalso() {
  const p = { entrada: [], linhas: null, sair: null, encerrado: false };
  p.api = {
    aoLinha: fn => { p.linhas = fn; },
    aoSair: fn => { p.sair = fn; },
    escrever: texto => { p.entrada.push(texto); },
    encerrar: () => { p.encerrado = true; p.sair?.({ codigo: null, sinal: 'SIGKILL' }); },
  };
  p.dizer = linha => p.linhas(linha);
  return p;
}

/** O adaptador falso: o que a máquina pediu, e o que cada chamada responde. */
function adaptadorFalso(a, pessoa, opcoes = {}) {
  const f = {
    baixados: [], abertos: [], escritos: new Map(), rodados: [], portas: [], fechadas: [], processos: [],
    empacotados: [], ofertas: [], recebidas: [],
    ouvinte: null, relogio: [], parada: null,
  };
  f.ad = {
    plataforma: () => opcoes.plataforma ?? 'mac-aarch64',
    baixar: async pedido => {
      f.baixados.push(local(pedido));
      if (opcoes.baixar) return opcoes.baixar(pedido);
      return { ok: true };
    },
    rodar: async pedido => {
      f.rodados.push(local(pedido));
      if (opcoes.rodar) return opcoes.rodar(pedido);
      const p = processoFalso();
      f.processos.push(p);
      return p.api;
    },
    servirPorta: async pedido => {
      f.portas.push(local(pedido));
      if (opcoes.servirPorta) return opcoes.servirPorta(pedido);
      return { fechar: () => f.fechadas.push(pedido.nome) };
    },
    recusas: async () => opcoes.recusas ?? {},
    desempacotar: async pedido => {
      f.abertos.push(local(pedido));
      if (opcoes.desempacotar) return opcoes.desempacotar(pedido);
      return { arquivos: 1 };
    },
    escrever: async (caminho, texto) => { f.escritos.set(f.servidor + ':' + caminho, texto); },
    // A cópia do mundo (parte 7).
    empacotar: async (origem, arquivo) => {
      f.empacotados.push([origem, arquivo]);
      if (opcoes.empacotar) return opcoes.empacotar(origem, arquivo);
      return { arquivo, tamanho: 100, sha256: 'c'.repeat(64), arquivos: 3, bytes: 300, linksPulados: 0 };
    },
    oferecerCopia: async (arquivo, porta) => {
      f.ofertas.push([arquivo, porta]);
      if (opcoes.oferecerCopia) return opcoes.oferecerCopia(arquivo, porta);
      return { codigo: 'k'.repeat(32), tamanho: 100, sha256: 'c'.repeat(64), porta };
    },
    receberCopia: async pedido => {
      f.recebidas.push(local(pedido));
      if (opcoes.receberCopia) return opcoes.receberCopia(pedido);
      return { destino: pedido.destino, tamanho: pedido.tamanho, sha256: pedido.sha256, retomadas: 0, jaEstavam: 0, caminho: 'direto' };
    },
    ler: async arquivo => {
      if (f.escritos.has(f.servidor + ':' + arquivo)) return f.escritos.get(f.servidor + ':' + arquivo);
      throw Object.assign(new Error('disco'), { erro: 'disco' });
    },
    pedir: async valor => a.daMaquina(pessoa, f.servidor, valor),
    aoAviso: fn => { f.ouvinte = fn; },
    aoParar: fn => { f.parada = fn; },
    // O relógio do teste: o prazo só vence quando o teste manda.
    esperar: ms => new Promise(resolve => f.relogio.push({ ms, resolve })),
    registrar: () => {},
  };
  f.vencerPrazos = () => { for (const r of f.relogio.splice(0)) r.resolve(); };
  return f;
}

/** Entrega à máquina os avisos que a metade de servidor mandou a ela. */
async function entregar(a, f, pessoa) {
  while (f.lidos === undefined || f.lidos < a.avisosAMaquinas.length) {
    f.lidos = f.lidos ?? 0;
    const aviso = a.avisosAMaquinas[f.lidos++];
    if (aviso.para === String(pessoa)) f.ouvinte(aviso.servidor, aviso.carga);
    await assentarTudo();
  }
  await assentarTudo();
}

/** Um Minecraft 1.21.4 criado pela pessoa 1, na máquina da pessoa 2, aceito. */
async function montado(opcoes = {}) {
  const a = criarAnfitriao();
  const id = a.acao(1, 'criar-servidor-de-jogo', { op: 'criar', receita: 'minecraft' }).servidor.id;
  a.acao(1, 'configurar-servidor-de-jogo', { op: 'configurar', id, versao: '1.21.4', quem: '2', config: { nome: [{ texto: 'Casa do Alê', cor: 'aqua' }], maximo: 6 } });
  const f = adaptadorFalso(a, 2, opcoes);
  // Uma metade de máquina é um servidor de jogo: ela sabe qual ao subir.
  f.servidor = id;
  f.ad.servidor = id;
  criarMaquina(f.ad);
  if (opcoes.semAceite) return { a, f, id };
  a.aceitar(id);
  await entregar(a, f, 2);
  return { a, f, id };
}

const doServidor = (a, id) => a.pedir(1, { op: 'estado' }).servidores.find(s => s.id === id);

async function ligado() {
  const ctx = await montado();
  const { a, f, id } = ctx;
  a.acao(1, 'ligar-desligar-servidor-de-jogo', { op: 'ligar', id });
  await entregar(a, f, 2);
  const p = f.processos[0];
  p.dizer('[12:00:00] [Server thread/INFO]: Starting minecraft server version 1.21.4');
  p.dizer('[12:00:04] [Server thread/INFO]: Done (4.211s)! For help, type "help"');
  await assentarTudo();
  return { ...ctx, p };
}

test('sem o aceite, nada é baixado, nada é escrito e nada roda', async () => {
  const { a, f, id } = await montado({ semAceite: true });
  // Mesmo que um aviso chegasse (o produto não o entrega), o plano é recusado.
  f.ouvinte(id, { op: 'ligar' });
  await assentarTudo();
  assert.deepEqual(f.baixados, []);
  assert.equal(f.escritos.size, 0, 'o eula.txt foi escrito sem o aceite');
  assert.deepEqual(f.rodados, []);
  assert.deepEqual(a.avisosAMaquinas, []);
});

test('o aceite baixa o server.jar e só o Java desta máquina, cada um com o hash e o tamanho', async () => {
  const { a, f, id } = await montado();
  const [jar, java] = f.baixados;
  assert.deepEqual(f.baixados.map(b => [b.destino, b.hash.algoritmo]), [['server.jar', 'sha1'], ['pacotes/' + java.url.split('/').pop(), 'sha256']]);
  assert.equal(jar.tamanho, 56880250);
  assert.equal(jar.hash.hex, '4707d00eb834b446575d89a61a11b5d548d8c001');
  assert.match(java.url, /OpenJDK21U-jre_aarch64_mac_hotspot/);
  // O pacote do Java é aberto no destino, com só o que está sob a raiz.
  assert.deepEqual(f.abertos, [{ arquivo: java.destino, destino: 'java', raiz: 'jdk-21.0.13+9-jre/Contents/Home' }]);
  assert.equal(doServidor(a, id).estado, 'pronto');
  // Preparar não roda nada nem escreve o eula.
  assert.deepEqual(f.rodados, []);
  assert.equal(f.escritos.size, 0);
});

test('o progresso do download chega à tela', async () => {
  const progressos = [];
  const { a, id } = await montado({
    baixar: () => { progressos.push(true); return { ok: true }; },
  });
  assert.equal(progressos.length, 2);
  assert.deepEqual(doServidor(a, id).progresso, { feitos: 2, total: 2 });
});

test('um hash que não bate para tudo, e a falha chega à tela com o arquivo e os hashes', async () => {
  const { a, f, id } = await montado({
    baixar: pedido => {
      if (pedido.destino === 'server.jar') {
        throw Object.assign(new Error('hash-diferente'), { erro: 'hash-diferente', esperado: pedido.hash.hex, obtido: 'f'.repeat(40) });
      }
      return { ok: true };
    },
  });
  assert.equal(f.baixados.length, 1, 'baixou o Java depois de o server.jar falhar');
  const s = doServidor(a, id);
  assert.notEqual(s.estado, 'pronto');
  const falha = s.falhas.at(-1);
  assert.equal(falha.etapa, 'baixar');
  assert.equal(falha.erro, 'hash-diferente');
  assert.equal(falha.dados.arquivo, 'server.jar');
  assert.equal(falha.dados.obtido, 'f'.repeat(40));
  assert.match(falha.dados.url, /piston-data\.mojang\.com/);
});

test('uma máquina sem Java publicado para ela diz qual é a plataforma', async () => {
  const { a, f, id } = await montado({ plataforma: 'windows-aarch64' });
  assert.equal(f.baixados.length, 0);
  const falha = doServidor(a, id).falhas.at(-1);
  assert.equal(falha.erro, 'sem-java-para-esta-maquina');
  assert.equal(falha.dados.plataforma, 'windows-aarch64');
});

test('ligar escreve o eula.txt e o server.properties, e roda o comando aceito', async () => {
  const { a, f, id } = await montado();
  a.acao(1, 'ligar-desligar-servidor-de-jogo', { op: 'ligar', id });
  await entregar(a, f, 2);
  assert.equal(f.escritos.get(id + ':eula.txt'), 'eula=true\n');
  const props = f.escritos.get(id + ':server.properties');
  assert.ok(props.includes('max-players=6'), props);
  assert.ok(props.includes('motd=\\u00a7bCasa do Al\\u00ea'), props);
  assert.ok(props.includes('server-port=25565'));
  assert.deepEqual(f.rodados, [{ comando: 'java/bin/java', argumentos: ['-Xms1G', '-Xmx2G', '-jar', 'server.jar', 'nogui'], pasta: '' }]);
  assert.equal(doServidor(a, id).estado, 'ligando');
  // Antes do «Done (», nenhum túnel.
  assert.deepEqual(f.portas, []);
});

test('o «Done (» serve o túnel e diz ligado; quem entra e sai vai à tela', async () => {
  const { a, f, id, p } = await ligado();
  assert.deepEqual(f.portas, [{ nome: id, protocolo: 'tcp', porta: 25565 }]);
  assert.equal(doServidor(a, id).estado, 'ligado');
  p.dizer('[12:01:00] [Server thread/INFO]: Alexandre joined the game');
  p.dizer('[12:01:05] [Server thread/INFO]: Bia joined the game');
  await assentarTudo();
  assert.deepEqual(doServidor(a, id).jogadores, ['Alexandre', 'Bia']);
  p.dizer('[12:02:00] [Server thread/INFO]: Alexandre left the game');
  await assentarTudo();
  assert.deepEqual(doServidor(a, id).jogadores, ['Bia']);
  assert.ok(doServidor(a, id).linhas.some(l => l.includes('Alexandre left the game')));
});

test('uma linha com as cores do terminal é lida e mostrada sem elas (o NeoForge as escreve mesmo sem terminal)', async () => {
  const ctx = await montado();
  const { a, f, id } = ctx;
  a.acao(1, 'ligar-desligar-servidor-de-jogo', { op: 'ligar', id });
  await entregar(a, f, 2);
  const p = f.processos[0];
  // A de verdade (NeoForge 21.1.265, 31/10), e o «Done» do mesmo jogo pintado do mesmo jeito.
  p.dizer('\u001b[m\u001b[32m[13:53:27.398] [main/INFO] [Launcher/MODLAUNCHER]: ModLauncher running');
  p.dizer('\u001b[m\u001b[32m[13:53:32] [Server thread/INFO] [minecraft/DedicatedServer]: Done (0.559s)! For help, type "help"\u001b[m');
  await assentarTudo();
  assert.deepEqual(f.portas, [{ nome: id, protocolo: 'tcp', porta: 25565 }]);
  assert.ok(!doServidor(a, id).linhas.some(l => l.includes('\u001b')), JSON.stringify(doServidor(a, id).linhas));
});

test('um túnel que não abre fica na tela, com o motivo', async () => {
  const ctx = await montado({ servirPorta: async () => { throw Object.assign(new Error('fora-do-aceite'), { erro: 'fora-do-aceite' }); } });
  const { a, f, id } = ctx;
  a.acao(1, 'ligar-desligar-servidor-de-jogo', { op: 'ligar', id });
  await entregar(a, f, 2);
  f.processos[0].dizer('[12:00:04] [Server thread/INFO]: Done (4.211s)! For help, type "help"');
  await assentarTudo();
  const falha = doServidor(a, id).falhas.at(-1);
  assert.equal(falha.etapa, 'tunel');
  assert.equal(falha.erro, 'fora-do-aceite');
  assert.equal(falha.dados.porta, 25565);
});

test('o console manda uma linha à entrada do jogo', async () => {
  const { a, f, id, p } = await ligado();
  a.acao(1, 'configurar-servidor-de-jogo', { op: 'console', id, comando: 'say oi, pessoal' });
  await entregar(a, f, 2);
  assert.deepEqual(p.entrada, ['say oi, pessoal\n']);
});

test('desligar manda stop, espera o jogo sair, fecha o túnel e diz desligado', async () => {
  const { a, f, id, p } = await ligado();
  a.acao(1, 'ligar-desligar-servidor-de-jogo', { op: 'desligar', id });
  await entregar(a, f, 2);
  assert.deepEqual(p.entrada, ['stop\n']);
  assert.equal(doServidor(a, id).estado, 'parando');
  p.dizer('[12:10:00] [Server thread/INFO]: Stopping the server');
  p.sair({ codigo: 0 });
  await assentarTudo();
  assert.equal(doServidor(a, id).estado, 'desligado');
  assert.deepEqual(f.fechadas, [id]);
  assert.equal(p.encerrado, false, 'encerrou à força um jogo que parou sozinho');
  assert.ok(!doServidor(a, id).falhas.some(x => x.onde === 'jogo'), 'um desligamento pedido virou queda');
});

test('o jogo que não para no prazo é encerrado à força, e isso é contado', async () => {
  const { a, f, id, p } = await ligado();
  a.acao(1, 'ligar-desligar-servidor-de-jogo', { op: 'desligar', id });
  await entregar(a, f, 2);
  f.vencerPrazos();
  await assentarTudo();
  assert.equal(p.encerrado, true);
  const falha = doServidor(a, id).falhas.find(x => x.erro === 'nao-parou-no-prazo');
  assert.ok(falha, JSON.stringify(doServidor(a, id).falhas));
  assert.equal(falha.dados.prazo, 60);
  assert.equal(doServidor(a, id).estado, 'desligado');
});

test('o jogo que cai sozinho é dito, com o código e as últimas linhas', async () => {
  const { a, id, p } = await ligado();
  p.dizer('[12:03:00] [Server thread/ERROR]: Encountered an unexpected exception');
  p.sair({ codigo: 1 });
  await assentarTudo();
  const s = doServidor(a, id);
  assert.equal(s.estado, 'caiu');
  const falha = s.falhas.at(-1);
  assert.equal(falha.erro, 'o-jogo-caiu');
  assert.equal(falha.dados.codigo, 1);
  assert.ok(falha.dados.linhas.some(l => l.includes('unexpected exception')));
});

test('o salvamento seguro segue a receita: save-off, save-all flush e save-on, e sem reserva não empacota', async () => {
  const { a, f, id, p } = await ligado();
  f.ouvinte(id, { op: 'salvar' });
  await assentarTudo();
  assert.deepEqual(p.entrada, ['save-off\n', 'save-all flush\n']);
  p.dizer('[12:20:00] [Server thread/INFO]: Saved the game');
  await assentarTudo();
  assert.deepEqual(f.empacotados, [], 'empacotou sem ninguém para receber');
  assert.deepEqual(p.entrada, ['save-off\n', 'save-all flush\n', 'save-on\n']);
  assert.equal(doServidor(a, id).estado, 'ligado');
  assert.equal(doServidor(a, id).falhas.at(-1).erro, 'sem-reserva-para-a-copia');
});

test('o salvamento que não ouve o jogo no prazo devolve o save-on e conta a falha', async () => {
  const { a, f, id, p } = await ligado();
  f.ouvinte(id, { op: 'salvar' });
  await assentarTudo();
  f.vencerPrazos();
  await assentarTudo();
  assert.deepEqual(f.empacotados, []);
  assert.equal(p.entrada.at(-1), 'save-on\n', 'o mundo ficou sem salvar automático');
  const falha = doServidor(a, id).falhas.at(-1);
  assert.equal(falha.etapa, 'salvar');
  assert.equal(falha.erro, 'o-jogo-nao-respondeu');
});

test('a configuração nova reescreve o server.properties e a tela pede reiniciar', async () => {
  const { a, f, id } = await ligado();
  a.acao(1, 'configurar-servidor-de-jogo', { op: 'configurar', id, config: { maximo: 3 } });
  await entregar(a, f, 2);
  assert.ok(f.escritos.get(id + ':server.properties').includes('max-players=3'));
  assert.equal(doServidor(a, id).precisaReiniciar, true);
});

test('a máquina que deixou de ser a dona para o jogo', async () => {
  const { a, f, id, p } = await ligado();
  // O servidor de jogo mudou de dona por fora (a reserva, na parte 7):
  // a metade de servidor manda parar quem fala sem ser a dona.
  const servidores = JSON.parse(a.dados.servidores);
  servidores[id].quem = '3';
  a.dados.servidores = JSON.stringify(servidores);
  p.dizer('[12:30:00] [Server thread/INFO]: Bia joined the game');
  await assentarTudo();
  assert.deepEqual(p.entrada, ['stop\n']);
});

test('um erro inesperado dentro da máquina vai à tela, e não some', async () => {
  const { a, f, id } = await montado({ rodar: async () => { throw new TypeError('rodar is not a function'); } });
  a.acao(1, 'ligar-desligar-servidor-de-jogo', { op: 'ligar', id });
  await entregar(a, f, 2);
  const falha = doServidor(a, id).falhas.at(-1);
  assert.equal(falha.etapa, 'rodar');
  assert.equal(falha.erro, 'rodar is not a function');
  assert.equal(doServidor(a, id).estado, 'desligado');
});

test('um aviso de operação desconhecida é contado', async () => {
  const { a, f, id } = await montado();
  f.ouvinte(id, { op: 'dancar' });
  await assentarTudo();
  const falha = doServidor(a, id).falhas.at(-1);
  assert.equal(falha.erro, 'aviso-desconhecido');
  assert.equal(falha.dados.op, 'dancar');
});

test('um pacote que não abre para, e a falha chega à tela com a raiz', async () => {
  const { a, f, id } = await montado({
    desempacotar: () => { throw Object.assign(new Error('nada-sob-a-raiz'), { erro: 'nada-sob-a-raiz', frase: 'x' }); },
  });
  assert.deepEqual(f.rodados, []);
  const falha = doServidor(a, id).falhas.at(-1);
  assert.equal(falha.etapa, 'desempacotar');
  assert.equal(falha.erro, 'nada-sob-a-raiz');
  assert.equal(falha.dados.raiz, 'jdk-21.0.13+9-jre/Contents/Home');
  assert.notEqual(doServidor(a, id).estado, 'pronto');
});

test('as recusas do produto nesta máquina vão junto da falha, contadas', async () => {
  const { a, id } = await montado({
    baixar: () => { throw Object.assign(new Error('diferente-do-aceito'), { erro: 'diferente-do-aceito', campo: 'hash' }); },
    recusas: { 'diferente-do-aceito': 1 },
  });
  const falha = doServidor(a, id).falhas.at(-1);
  assert.equal(falha.erro, 'diferente-do-aceito');
  assert.deepEqual(falha.dados.recusas, { 'diferente-do-aceito': 1 });
});

test('a parada da metade manda stop ao jogo e espera ele sair', async () => {
  const { f, p } = await ligado();
  let acabou = false;
  const parada = f.parada('pelo-dono').then(() => { acabou = true; });
  await assentarTudo();
  assert.deepEqual(p.entrada, ['stop\n']);
  assert.equal(acabou, false, 'a parada não esperou o jogo sair');
  p.sair({ codigo: 0 });
  await parada;
  assert.equal(acabou, true);
  assert.equal(p.encerrado, false, 'a parada matou o jogo que parou sozinho');
});

test('ao subir já aceita, a máquina pergunta o plano e prepara sem esperar aviso', async () => {
  const a = criarAnfitriao();
  const id = a.acao(1, 'criar-servidor-de-jogo', { op: 'criar', receita: 'minecraft' }).servidor.id;
  a.acao(1, 'configurar-servidor-de-jogo', { op: 'configurar', id, versao: '1.21.4', quem: '2', config: {} });
  a.aceitar(id);
  const f = adaptadorFalso(a, 2);
  f.servidor = id;
  f.ad.servidor = id;
  // O aviso do aceite saiu antes de a metade existir: ninguém o entrega.
  criarMaquina(f.ad);
  await assentarTudo();
  assert.equal(f.baixados.length, 2);
  assert.equal(doServidor(a, id).estado, 'pronto');
});
