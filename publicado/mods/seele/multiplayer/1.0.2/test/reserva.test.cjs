// A reserva (parte 7): duas máquinas do mesmo servidor de jogo — a principal
// (pessoa 2) e a reserva (pessoa 3) —, as duas metades de máquina de verdade
// contra adaptadores falsos, e a metade de servidor de verdade no anfitrião
// simulado. Prova a cópia agendada (depois do salvamento seguro), a
// passagem avisada sem perda, a queda de surpresa com o tempo perdido, a
// principal que volta com o jogo de pé, e a cópia que falha na tela.
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { carregar } = require('./carregar.cjs');
const { criarAnfitriao } = require('./anfitriao.cjs');

const { criarMaquina } = carregar('maquina', ['criarMaquina'], { __testeSemPartida: true });

const local = v => JSON.parse(JSON.stringify(v));
const assentar = () => new Promise(r => setImmediate(r));
async function assentarTudo() {
  for (let i = 0; i < 30; i++) await assentar();
}

function processoFalso() {
  const p = { entrada: [], linhas: null, sair: null, encerrado: false };
  p.saiu = false;
  p.api = {
    aoLinha: fn => { p.linhas = fn; },
    aoSair: fn => { p.sair = fim => { p.saiu = true; fn(fim); }; },
    escrever: texto => {
      p.entrada.push(texto);
      // O Minecraft responde ao salvamento seguro, e sai no stop.
      if (texto === 'save-all flush\n') setImmediate(() => p.linhas?.('[12:20:00] [Server thread/INFO]: Saved the game'));
      if (texto === 'stop\n') setImmediate(() => p.sair?.({ codigo: 0 }));
    },
    encerrar: () => { p.encerrado = true; p.sair?.({ codigo: null, sinal: 'SIGKILL' }); },
  };
  p.dizer = linha => p.linhas(linha);
  return p;
}

/** Uma máquina falsa: o que ela pediu ao produto, e o que cada chamada responde. */
function maquinaFalsa(a, pessoa, id, opcoes = {}) {
  const f = {
    pessoa: String(pessoa), baixados: [], abertos: [], escritos: new Map(), rodados: [], portas: [], fechadas: [],
    processos: [], empacotados: [], vivoAoEmpacotar: [], ofertas: [], recebidas: [], ouvinte: null, relogio: [],
  };
  f.ad = {
    servidor: id,
    plataforma: () => 'mac-aarch64',
    baixar: async pedido => { f.baixados.push(local(pedido)); return { ok: true }; },
    rodar: async pedido => { f.rodados.push(local(pedido)); const p = processoFalso(); f.processos.push(p); return p.api; },
    servirPorta: async pedido => {
      f.portas.push(local(pedido));
      if (opcoes.tunelFalha > 0 && pedido.nome === id) {
        opcoes.tunelFalha--;
        throw Object.assign(new Error('porta-ocupada'), { erro: 'porta-ocupada' });
      }
      // Só a dona serve: o produto recusa a outra (fora-do-aceite).
      if (a.dona(id) !== f.papel()) throw Object.assign(new Error('fora-do-aceite'), { erro: 'fora-do-aceite' });
      return { fechar: () => f.fechadas.push(pedido.nome) };
    },
    recusas: async () => ({}),
    desempacotar: async pedido => { f.abertos.push(local(pedido)); return { arquivos: 1 }; },
    escrever: async (caminho, texto) => { f.escritos.set(caminho, texto); },
    ler: async caminho => {
      if (f.escritos.has(caminho)) return f.escritos.get(caminho);
      throw Object.assign(new Error('disco'), { erro: 'disco' });
    },
    empacotar: async (origem, arquivo) => {
      f.empacotados.push([origem, arquivo]);
      // O jogo estava de pé quando o pacote foi feito?
      f.vivoAoEmpacotar.push(f.processos.some(p => !p.saiu));
      return { arquivo, tamanho: 4096, sha256: opcoes.sha ?? 'c'.repeat(64), arquivos: 3, bytes: 9000, linksPulados: 0 };
    },
    oferecerCopia: async (arquivo, porta) => {
      f.ofertas.push([arquivo, porta]);
      return { codigo: 'k'.repeat(32), tamanho: 4096, sha256: opcoes.sha ?? 'c'.repeat(64), porta };
    },
    receberCopia: async pedido => {
      f.recebidas.push(local(pedido));
      if (opcoes.receberCopia) return opcoes.receberCopia(pedido);
      return { destino: pedido.destino, tamanho: pedido.tamanho, sha256: pedido.sha256, retomadas: 0, jaEstavam: 0, caminho: 'direto' };
    },
    pedir: async valor => a.daMaquina(pessoa, id, valor),
    aoAviso: fn => { f.ouvinte = fn; },
    aoParar: () => {},
    aoReconectar: fn => { f.aoReconectar = fn; },
    esperar: ms => new Promise(resolve => f.relogio.push({ ms, resolve })),
    registrar: () => {},
  };
  f.papel = () => (a.livro.get(id)?.quem === f.pessoa ? 'principal' : 'reserva');
  f.vencerPrazos = () => { for (const r of f.relogio.splice(0)) r.resolve(); };
  f.vivo = () => f.processos.some(p => !p.saiu);
  /** A volta de quem hospeda: o produto religou esta metade, sem subir de novo. */
  f.reconectar = async fora => { f.aoReconectar?.({ fora }); await assentarTudo(); };
  return f;
}

/** Entrega cada aviso que a metade de servidor mandou a quem é para ele. */
async function entregar(a, maquinas, estado) {
  while (estado.lidos < a.avisosAMaquinas.length) {
    const aviso = a.avisosAMaquinas[estado.lidos++];
    const f = maquinas.find(m => m.pessoa === aviso.para);
    if (f?.ouvinte) f.ouvinte(aviso.servidor, aviso.carga);
    await assentarTudo();
  }
  await assentarTudo();
}

const doServidor = (a, id, pessoa = 1) => a.pedir(pessoa, { op: 'estado' }).servidores.find(s => s.id === id);

/** Um Minecraft com a principal (2) e a reserva (3) aceitas, e ligado na principal. */
async function comReserva(opcoes = {}) {
  const a = criarAnfitriao();
  const id = a.acao(1, 'criar-servidor-de-jogo', { op: 'criar', receita: 'minecraft' }).servidor.id;
  const r = a.acao(1, 'configurar-servidor-de-jogo', { op: 'configurar', id, versao: '1.21.4', quem: '2', reserva: '3' });
  assert.equal(r.ok, true, JSON.stringify(r));
  opcoes.antes?.(a, id);
  const principal = maquinaFalsa(a, 2, id, opcoes.principal);
  const reserva = maquinaFalsa(a, 3, id, opcoes.reserva);
  const maquinas = [principal, reserva];
  const estado = { lidos: 0 };
  criarMaquina(principal.ad);
  criarMaquina(reserva.ad);
  a.aceitar(id, 'principal');
  a.aceitar(id, 'reserva');
  await entregar(a, maquinas, estado);
  a.acao(1, 'ligar-desligar-servidor-de-jogo', { op: 'ligar', id });
  await entregar(a, maquinas, estado);
  principal.processos[0].dizer('[12:00:04] [Server thread/INFO]: Done (4.211s)! For help, type "help"');
  await assentarTudo();
  return { a, id, principal, reserva, maquinas, estado, entregar: () => entregar(a, maquinas, estado) };
}

test('as duas máquinas são chamadas, cada uma no papel dela, e a reserva prepara sem ligar', async () => {
  const { a, id, principal, reserva } = await comReserva();
  const pedidos = a.pedidosDeMaquina.filter(p => p.servidor === id);
  assert.deepEqual(pedidos.map(p => [p.papel, p.quem]), [['principal', '2'], ['reserva', '3']]);
  // As duas ofertas trazem o túnel da cópia; as portas são as de cada máquina.
  for (const p of pedidos) assert.deepEqual(p.oferta.tuneis.map(t => t.nome), [id, id + '-copia']);
  assert.equal(reserva.baixados.length, 2, 'a reserva não preparou');
  assert.equal(reserva.rodados.length, 0, 'a reserva ligou sem ser a dona');
  assert.equal(principal.rodados.length, 1);
  const s = doServidor(a, id);
  assert.equal(s.dona, 'principal');
  assert.equal(s.quemEADona, '2');
  assert.deepEqual([s.aceite, s.reserva.aceite], ['aceito', 'aceito']);
  assert.equal(s.intervaloDaCopia, 5);
});

test('a mesma pessoa não é a principal e a reserva', () => {
  const a = criarAnfitriao();
  const id = a.acao(1, 'criar-servidor-de-jogo', { op: 'criar', receita: 'minecraft' }).servidor.id;
  const r = a.acao(1, 'configurar-servidor-de-jogo', { op: 'configurar', id, versao: '1.21.4', quem: '2', reserva: '2' });
  assert.deepEqual(local(r), { ok: false, erro: 'mesma-pessoa-nas-duas', quem: '2' });
});

test('de cinco em cinco minutos a dona salva com segurança, empacota no meio, e a reserva recebe', async () => {
  const { a, id, principal, reserva, entregar } = await comReserva();
  const p = principal.processos[0];
  const agendada = principal.relogio.find(r => r.ms === 5 * 60000);
  assert.ok(agendada, 'a cópia não foi agendada em 5 min: ' + JSON.stringify(principal.relogio.map(r => r.ms)));
  agendada.resolve();
  await assentarTudo();
  // O salvamento seguro da receita, com o pacote entre o flush e o save-on.
  assert.deepEqual(p.entrada, ['save-off\n', 'save-all flush\n', 'save-on\n']);
  assert.deepEqual(principal.empacotados, [['world', 'copias/mundo.tar.gz']]);
  assert.deepEqual(principal.vivoAoEmpacotar, [true], 'a cópia agendada parou o jogo');
  assert.deepEqual(principal.ofertas, [['copias/mundo.tar.gz', 35565]]);
  assert.deepEqual(principal.portas.at(-1), { nome: id + '-copia', protocolo: 'tcp', porta: 35565 });
  await entregar();
  assert.deepEqual(reserva.recebidas, [{ tunel: id + '-copia', codigo: 'k'.repeat(32), sha256: 'c'.repeat(64), tamanho: 4096, destino: 'copias/recebida.tar.gz' }]);
  const s = doServidor(a, id);
  assert.equal(s.copia.sha256, 'c'.repeat(64));
  assert.equal(s.copiaRecebida.sha256, 'c'.repeat(64));
  assert.equal(s.copiaRecebida.por, 'reserva');
});

test('a passagem avisada para o jogo, manda a cópia final, a reserva liga e a principal desliga: nada se perde', async () => {
  const { a, id, principal, reserva, entregar } = await comReserva();
  const p = principal.processos[0];
  assert.equal(a.acao(1, 'ligar-desligar-servidor-de-jogo', { op: 'passar', id }).ok, true);
  await entregar();
  // A principal parou o jogo inteiro (o stop salva) **antes** da cópia final.
  assert.deepEqual(p.entrada, ['stop\n']);
  assert.deepEqual(principal.empacotados, [['world', 'copias/mundo.tar.gz']]);
  assert.deepEqual(principal.vivoAoEmpacotar, [false], 'a cópia final foi feita com o jogo escrevendo');
  await entregar();
  assert.equal(reserva.recebidas.length, 1);
  // A posse passou, a reserva abriu a cópia e ligou.
  assert.equal(a.dona(id), 'reserva');
  assert.deepEqual(a.mudancasDePosse.at(-1), { servidor: id, de: 'principal', para: 'reserva' });
  await entregar();
  assert.deepEqual(reserva.abertos.at(-1), { arquivo: 'copias/recebida.tar.gz', destino: 'world', raiz: 'world' });
  assert.equal(reserva.rodados.length, 1, 'a reserva não ligou');
  assert.equal(principal.rodados.length, 1, 'a principal ligou de novo');
  assert.ok(p.saiu, 'o jogo da principal segue de pé');
  const s = doServidor(a, id);
  assert.equal(s.dona, 'reserva');
  assert.equal(s.quemEADona, '3');
  assert.equal(s.perdido, null, 'a passagem avisada não perde jogo');
});

test('a queda de surpresa: depois do prazo a reserva assume com a última cópia, e todos veem o tempo perdido', async () => {
  const { a, id, principal, reserva, entregar } = await comReserva();
  principal.relogio.find(r => r.ms === 5 * 60000).resolve();
  await assentarTudo();
  await entregar();
  const copiadaEm = doServidor(a, id).copia.quando;
  // Três minutos de jogo depois da cópia, a principal some.
  a.passar(180);
  a.parar(id, 'saiu', 'principal');
  let s = doServidor(a, id);
  assert.equal(s.ligar, true, 'a queda com reserva desligou o servidor de jogo');
  assert.equal(s.dona, 'principal', 'a posse mudou antes do prazo');
  a.passar(60);
  a.sumir(id, 'principal', 2, 60);
  await entregar();
  s = doServidor(a, id);
  assert.equal(s.dona, 'reserva');
  assert.deepEqual(local(s.perdido), { segundos: 180, quando: copiadaEm + 240, de: 'principal', para: 'reserva', copiaDe: copiadaEm });
  assert.equal(reserva.rodados.length, 1, 'a reserva não ligou');
  assert.deepEqual(reserva.abertos.at(-1), { arquivo: 'copias/recebida.tar.gz', destino: 'world', raiz: 'world' });
  assert.equal(s.falhas.at(-1).erro, 'a-reserva-assumiu');
  // Quem só joga vê o mesmo número.
  assert.equal(doServidor(a, id, 5).perdido.segundos, 180);
});

test('sem cópia, a reserva não assume: um mundo vazio seria um segundo mundo, e a tela diz', async () => {
  const { a, id, reserva, entregar } = await comReserva();
  a.parar(id, 'saiu', 'principal');
  a.sumir(id, 'principal', 2, 60);
  await entregar();
  const s = doServidor(a, id);
  assert.equal(s.dona, 'principal');
  assert.equal(reserva.rodados.length, 0);
  assert.equal(s.falhas.at(-1).erro, 'reserva-sem-copia');
});

test('a principal que volta com o jogo de pé não é a dona: desliga, e a volta é contada', async () => {
  const { a, id, principal, reserva, entregar } = await comReserva();
  principal.relogio.find(r => r.ms === 5 * 60000).resolve();
  await assentarTudo();
  await entregar();
  const p = principal.processos[0];
  // A conexão da principal cai, o processo não; a reserva assume.
  const livro = a.livro.get(id);
  a.parar(id, 'saiu', 'principal');
  a.sumir(id, 'principal', 2, 60);
  await entregar();
  assert.equal(reserva.rodados.length, 1);
  assert.equal(p.saiu, false, 'o caso que a prova quer: dois de pé');
  // Ela volta: o produto diz MaquinaVoltou, a metade de servidor a chama de
  // novo, ela aceita sozinha (a mesma oferta), e pergunta o plano.
  a.voltar(id, 'principal', 2);
  assert.equal(a.pedidosDeMaquina.at(-1).papel, 'principal');
  assert.deepEqual(a.pedidosDeMaquina.at(-1).oferta, livro.oferta, 'a volta pediu outra coisa');
  a.aceitar(id, 'principal');
  await entregar();
  assert.deepEqual(p.entrada.at(-1), 'stop\n', 'a principal sem a posse não desligou o jogo');
  assert.ok(p.saiu, 'o jogo da principal segue de pé');
  const s = doServidor(a, id);
  assert.equal(s.voltouRodando, 1);
  assert.equal(s.falhas.at(-1).erro, 'voltou-rodando-sem-a-posse');
  assert.equal(s.dona, 'reserva');
});

test('a cópia que não chega fica na tela, com o nome e os dados', async () => {
  const { a, id, principal, entregar } = await comReserva({
    reserva: { receberCopia: async () => { throw Object.assign(new Error('copia-nao-bate'), { erro: 'copia-nao-bate', esperado: 'c'.repeat(64), obtido: 'd'.repeat(64) }); } },
  });
  principal.relogio.find(r => r.ms === 5 * 60000).resolve();
  await assentarTudo();
  await entregar();
  const f = doServidor(a, id).falhas.at(-1);
  assert.equal(f.etapa, 'receber-copia');
  assert.equal(f.erro, 'copia-nao-bate');
  assert.equal(f.papel, 'reserva');
  assert.equal(f.dados.obtido, 'd'.repeat(64));
  assert.equal(doServidor(a, id).copiaRecebida, null);
});

test('o intervalo da cópia é configurável, entre 1 e 60 minutos', () => {
  const a = criarAnfitriao();
  const id = a.acao(1, 'criar-servidor-de-jogo', { op: 'criar', receita: 'minecraft' }).servidor.id;
  assert.equal(a.acao(1, 'configurar-servidor-de-jogo', { op: 'configurar', id, intervaloDaCopia: 15 }).servidor.intervaloDaCopia, 15);
  assert.deepEqual(local(a.acao(1, 'configurar-servidor-de-jogo', { op: 'configurar', id, intervaloDaCopia: 0 })), { ok: false, erro: 'intervalo-invalido', minimo: 1, maximo: 60 });
});

// ---- sem quem hospeda: a metade religada (maquina.aoReconectar) ----

test('sem quem hospeda a dona segue de pé, e religada serve de novo o túnel sem subir o jogo outra vez', async () => {
  const { a, id, principal, reserva, entregar } = await comReserva();
  const p = principal.processos[0];
  assert.equal(principal.portas.filter(t => t.nome === id).length, 1, 'o túnel do jogo não foi servido');
  // Quem hospeda cai: a conexão da principal cai com ele, o processo não. Sem
  // ele, ninguém decide: nada de MaquinaSumiu, nada muda de dona.
  a.parar(id, 'saiu', 'principal');
  await entregar();
  assert.equal(p.saiu, false);
  assert.equal(reserva.rodados.length, 0, 'a reserva ligou sem quem hospeda');
  // Ele volta: chama a principal de novo, o app religa a metade (aoReconectar)
  // e manda o aceite, que chega à metade de servidor depois da pergunta.
  a.voltar(id, 'principal', 2);
  await principal.reconectar(42);
  a.aceitar(id, 'principal');
  await entregar();
  assert.equal(principal.rodados.length, 1, 'o jogo subiu de novo');
  assert.equal(p.saiu, false, 'o jogo da dona parou na volta');
  assert.equal(principal.portas.filter(t => t.nome === id).length, 2, 'a religada não serviu de novo o túnel');
  const s = doServidor(a, id);
  assert.equal(s.dona, 'principal');
  assert.deepEqual(local(s.religada), { quando: s.religada.quando, fora: 42, papel: 'principal' });
  assert.equal(s.voltouRodando, 0);
});

test('a principal religada que perdeu a posse enquanto estava fora desliga o jogo, e a volta é contada', async () => {
  const { a, id, principal, reserva, entregar } = await comReserva();
  principal.relogio.find(r => r.ms === 5 * 60000).resolve();
  await assentarTudo();
  await entregar();
  const p = principal.processos[0];
  // Só a principal cai (quem hospeda segue): passado o prazo, a reserva assume.
  a.parar(id, 'saiu', 'principal');
  a.sumir(id, 'principal', 2, 60);
  await entregar();
  assert.equal(reserva.rodados.length, 1);
  assert.equal(p.saiu, false, 'o caso que a prova quer: dois de pé');
  // A volta, pelo caminho do app de hoje: religada, e não subida de novo.
  a.voltar(id, 'principal', 2);
  await principal.reconectar(75);
  a.aceitar(id, 'principal');
  await entregar();
  assert.equal(principal.rodados.length, 1, 'a metade subiu o jogo de novo');
  assert.equal(p.entrada.at(-1), 'stop\n', 'a principal sem a posse não desligou o jogo');
  assert.ok(p.saiu, 'o jogo de quem não é a dona segue de pé');
  const s = doServidor(a, id);
  assert.equal(s.voltouRodando, 1);
  assert.equal(s.falhas.at(-1).erro, 'voltou-rodando-sem-a-posse');
  assert.equal(s.dona, 'reserva');
  assert.equal(s.religada, null, 'quem não é a dona contou-se religada');
});

// ---- revisão final (31/10, M12) ----

test('a metade da dona que falha (metade-falhou) com reserva não desliga: depois do prazo a reserva assume', async () => {
  const { a, id, principal, reserva, entregar } = await comReserva();
  principal.relogio.find(r => r.ms === 5 * 60000).resolve();
  await assentarTudo();
  await entregar();
  a.parar(id, 'metade-falhou', 'principal');
  assert.equal(doServidor(a, id).ligar, true, 'a metade que falhou desligou o servidor de jogo com reserva');
  a.sumir(id, 'principal', 2, 60);
  await entregar();
  const s = doServidor(a, id);
  assert.equal(s.dona, 'reserva');
  assert.equal(reserva.rodados.length, 1, 'a reserva não ligou');
});

test('uma parada da pessoa (pelo-dono) segue desligando, com ou sem reserva', async () => {
  const { a, id, principal, reserva, entregar } = await comReserva();
  principal.relogio.find(r => r.ms === 5 * 60000).resolve();
  await assentarTudo();
  await entregar();
  a.parar(id, 'pelo-dono', 'principal');
  assert.equal(doServidor(a, id).ligar, false);
  a.sumir(id, 'principal', 2, 60);
  await entregar();
  assert.equal(doServidor(a, id).dona, 'principal');
  assert.equal(reserva.rodados.length, 0);
});

test('religada, a dona serve de novo o túnel que tinha falhado, e não só o que estava de pé', async () => {
  const { a, id, principal, entregar } = await comReserva({ principal: { tunelFalha: 1 } });
  assert.equal(principal.portas.filter(t => t.nome === id).length, 1);
  assert.equal(doServidor(a, id).falhas.at(-1)?.etapa, 'tunel', 'o túnel de prova não falhou');
  a.parar(id, 'saiu', 'principal');
  await entregar();
  a.voltar(id, 'principal', 2);
  await principal.reconectar(30);
  a.aceitar(id, 'principal');
  await entregar();
  assert.equal(principal.portas.filter(t => t.nome === id).length, 2, 'a religada não tentou de novo o túnel que falhou');
  const s = doServidor(a, id);
  assert.ok(!s.falhas.some(f => f.etapa === 'tunel' && f.dados?.religada), JSON.stringify(s.falhas));
  assert.equal(s.religada?.fora, 30);
});

test('um mundo novo é outra pasta: a cópia agendada empacota a pasta dele, e não a de antes', async () => {
  const { principal } = await comReserva({
    antes: (a, id) => {
      // A versão mais velha que a do mundo (a oferta de 1.21.4), com um mundo novo.
      const r = a.acao(1, 'configurar-servidor-de-jogo', { op: 'configurar', id, versao: '1.20.1', mundo: 'novo' });
      assert.equal(r.ok, true, JSON.stringify(r));
    },
  });
  const agendada = principal.relogio.find(r => r.ms === 5 * 60000);
  agendada.resolve();
  await assentarTudo();
  assert.deepEqual(principal.empacotados, [['world-2', 'copias/mundo.tar.gz']], 'a cópia levou o mundo de antes');
});
