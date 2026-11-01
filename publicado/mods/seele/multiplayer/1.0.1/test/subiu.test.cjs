// O servidor SEELE que reinicia (`MetadeSubiu`, API 8) e a versão do mundo.
//
// No e2e da API 8 (31/10, passo 16), depois de o servidor SEELE reiniciar o
// cartão seguia «LIGADO NA RESERVA» sem jogo em lugar nenhum: a metade de
// servidor relia LIGADO e ACEITO do quintal e o livro do SEELE nascia vazio;
// DESLIGAR ia só ao seele.log, PASSAR ficava «passando» para sempre e trocar a
// máquina era recusado. E no passo 18 um .mrpack de 1.21.4 num mundo do 26.3
// fez o jogo cair com a pilha crua, sem nada dizer que o mundo era mais novo.
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { criarAnfitriao } = require('./anfitriao.cjs');

const servidor = (a, id, pessoa = 1) => a.pedir(pessoa, { op: 'estado' }).servidores.find(s => s.id === id);

/** Um Minecraft 1.21.4 que a pessoa 2 aceitou e que está ligado (a máquina contou). */
function ligado() {
  const a = criarAnfitriao();
  const id = a.acao(1, 'criar-servidor-de-jogo', { op: 'criar', receita: 'minecraft' }).servidor.id;
  assert.equal(a.acao(1, 'configurar-servidor-de-jogo', { op: 'configurar', id, versao: '1.21.4', quem: '2' }).ok, true);
  a.aceitar(id);
  assert.equal(a.acao(1, 'ligar-desligar-servidor-de-jogo', { op: 'ligar', id }).ok, true);
  assert.equal(a.daMaquina('2', id, { op: 'estado', estado: 'ligado', jogadores: ['Bia'] }).ok, true);
  assert.equal(servidor(a, id).estado, 'ligado');
  return { a, id };
}

test('o servidor SEELE reinicia: a metade chama a máquina de volta com a oferta aceita, e o cartão não diz ligado', () => {
  const { a, id } = ligado();
  const aceita = a.pedidosDeMaquina.at(-1).oferta;
  const antes = a.pedidosDeMaquina.length;
  a.reiniciar();
  // Chamada de novo, sozinha, com a oferta igual à aceita (o app religa a metade órfã).
  assert.equal(a.pedidosDeMaquina.length, antes + 1, 'o servidor subiu e a máquina não foi chamada de volta');
  const p = a.pedidosDeMaquina.at(-1);
  assert.equal(p.quem, '2');
  assert.equal(p.papel, 'principal');
  assert.deepEqual(p.oferta, aceita, 'a oferta mudou: a metade órfã não seria religada');
  const s = servidor(a, id);
  assert.equal(s.estado, 'esperando-maquina', 'o cartão seguiu dizendo ligado sem jogo');
  assert.equal(s.aceite, 'esperando');
  assert.deepEqual(s.jogadores, []);
  assert.ok(s.chamando, 'a tela não sabe que as máquinas estão sendo chamadas');
  // Ela aceita (o app aceita sozinho a mesma oferta): o «ligar» vai a ela, e o
  // estado volta a ser o que ela conta.
  a.aceitar(id);
  assert.deepEqual(a.avisosAMaquinas.at(-1), { servidor: id, papel: 'principal', carga: { op: 'ligar' }, para: '2' });
  a.daMaquina('2', id, { op: 'estado', estado: 'ligado', jogadores: ['Bia'] });
  assert.equal(servidor(a, id).estado, 'ligado');
  assert.equal(servidor(a, id).chamando, null);
});

test('reiniciado sem a pessoa da máquina: o cartão diz que ela está fora, DESLIGAR diz o que acontece, e ela é chamada ao voltar', () => {
  const { a, id } = ligado();
  a.reiniciar({ fora: ['2'] });
  let s = servidor(a, id);
  assert.equal(s.aceite, 'fora');
  assert.equal(s.motivo, 'nao-esta-aqui');
  assert.equal(s.estado, 'esperando-maquina');
  assert.equal(s.ligar, true, 'a recusa de quem não está desligou o servidor de jogo');
  // Ela volta: chamada de novo, aceita, e o jogo segue.
  a.conectar('2');
  a.voltar(id, 'principal', '2');
  assert.equal(servidor(a, id).aceite, 'esperando');
  a.aceitar(id);
  assert.equal(a.avisosAMaquinas.at(-1).carga.op, 'ligar');

  // De novo fora, e agora DESLIGAR: nada no livro para ouvir, e a resposta diz.
  a.reiniciar({ fora: ['2'] });
  const r = a.acao(1, 'ligar-desligar-servidor-de-jogo', { op: 'desligar', id });
  assert.equal(r.ok, true);
  assert.deepEqual(r.semMaquina, { papel: 'principal', quem: '2' }, 'DESLIGAR sem máquina foi calado');
  s = servidor(a, id);
  assert.equal(s.estado, 'desligado');
  assert.equal(s.ligar, false);
  // Ela volta: chamada, aceita, e ouve «preparar» (não «ligar»).
  a.conectar('2');
  a.voltar(id, 'principal', '2');
  a.aceitar(id);
  assert.equal(a.avisosAMaquinas.at(-1).carga.op, 'preparar');
  // A metade religada conta que o jogo segue de pé: ouve «desligar».
  assert.equal(a.daMaquina('2', id, { op: 'estado', estado: 'ligado' }).ordem, 'desligar');
});

test('reiniciado com a passagem em curso: PASSAR não fica «passando», e trocar a máquina vale', () => {
  const a = criarAnfitriao();
  const id = a.acao(1, 'criar-servidor-de-jogo', { op: 'criar', receita: 'minecraft' }).servidor.id;
  a.acao(1, 'configurar-servidor-de-jogo', { op: 'configurar', id, versao: '1.21.4', quem: '2', reserva: '3' });
  a.aceitar(id, 'principal');
  a.aceitar(id, 'reserva');
  a.acao(1, 'ligar-desligar-servidor-de-jogo', { op: 'ligar', id });
  a.daMaquina('2', id, { op: 'estado', estado: 'ligado' });
  assert.equal(a.acao(1, 'ligar-desligar-servidor-de-jogo', { op: 'passar', id }).ok, true);
  assert.ok(servidor(a, id).passando);
  a.reiniciar({ fora: ['2', '3'] });
  const s = servidor(a, id);
  assert.equal(s.passando, null, 'a passagem ficou «passando» depois do reinício');
  assert.ok(s.falhas.some(f => f.erro === 'passagem-interrompida'), 'a passagem interrompida não foi dita');
  assert.equal(s.aceite, 'fora');
  assert.equal(s.reserva.aceite, 'fora');
  // PASSAR agora diz por que não.
  assert.deepEqual(a.acao(1, 'ligar-desligar-servidor-de-jogo', { op: 'passar', id }),
    { ok: false, erro: 'esperando-as-maquinas', papel: 'principal', aceite: 'fora' });
  // Trocar a principal não é recusado por um «ligado» que ninguém roda.
  const r = a.acao(1, 'configurar-servidor-de-jogo', { op: 'configurar', id, quem: '1' });
  assert.equal(r.ok, true, JSON.stringify(r));
});

test('o código novo com o servidor de pé não chama de novo quem o livro já tem', () => {
  const { a, id } = ligado();
  const antes = a.pedidosDeMaquina.length;
  a.recarregar();
  assert.equal(a.pedidosDeMaquina.length, antes, 'chamou de novo uma máquina que o livro tem');
  assert.equal(servidor(a, id).estado, 'ligado');
});

test('trocar para uma versão mais velha que a do mundo pede a escolha, e o mundo novo é outra pasta', () => {
  const { a, id } = ligado();
  a.acao(1, 'ligar-desligar-servidor-de-jogo', { op: 'desligar', id });
  a.daMaquina('2', id, { op: 'estado', estado: 'desligado' });
  assert.equal(servidor(a, id).versaoDoMundo, '1.21.4');
  const r = a.acao(1, 'configurar-servidor-de-jogo', { op: 'configurar', id, versao: '1.20.1' });
  assert.deepEqual(r, { ok: false, erro: 'mundo-mais-novo', mundo: '1.21.4', pedida: '1.20.1' }, 'a versão mais velha passou num mundo mais novo');
  assert.equal(servidor(a, id).versao, '1.21.4', 'a recusa mudou a versão');
  // O mundo novo: outra pasta, e o plano a escreve (level-name) e a copia.
  const novo = a.acao(1, 'configurar-servidor-de-jogo', { op: 'configurar', id, versao: '1.20.1', mundo: 'novo' });
  assert.equal(novo.ok, true, JSON.stringify(novo));
  const s = servidor(a, id);
  assert.equal(s.versao, '1.20.1');
  assert.equal(s.mundo, 'world-2');
  a.aceitar(id);
  const plano = a.daMaquina('2', id, { op: 'plano' }).plano;
  assert.ok(plano.propriedades.includes('\nlevel-name=world-2\n'), plano.propriedades);
  assert.equal(plano.copia.pasta, 'world-2');
});

test('a versão mais nova que a do mundo, e o mundo sem versão conhecida, não perguntam', () => {
  const a = criarAnfitriao();
  const id = a.acao(1, 'criar-servidor-de-jogo', { op: 'criar', receita: 'minecraft' }).servidor.id;
  assert.equal(a.acao(1, 'configurar-servidor-de-jogo', { op: 'configurar', id, versao: '1.20.1', quem: '2' }).ok, true);
  a.aceitar(id);
  a.daMaquina('2', id, { op: 'estado', estado: 'ligado' });
  a.daMaquina('2', id, { op: 'estado', estado: 'desligado' });
  const r = a.acao(1, 'configurar-servidor-de-jogo', { op: 'configurar', id, versao: '1.21.4' });
  assert.equal(r.ok, true, JSON.stringify(r));
});

test('cada servidor de jogo novo tem um nome padrão que se distingue', () => {
  const a = criarAnfitriao();
  const um = a.acao(1, 'criar-servidor-de-jogo', { op: 'criar', receita: 'minecraft' }).servidor;
  const dois = a.acao(1, 'criar-servidor-de-jogo', { op: 'criar', receita: 'minecraft' }).servidor;
  assert.equal(um.config.nome[0].texto, 'Minecraft 1');
  assert.equal(dois.config.nome[0].texto, 'Minecraft 2');
});

test('o servidor que para derruba a dona (saiu): o ligar fica, o cartão espera a máquina, e a subida a chama de volta', () => {
  // Medido no app (31/10): PARAR DE HOSPEDAR com o jogo de pé — a metade de
  // servidor ouve MaquinaParou com saiu antes de o servidor descer.
  const { a, id } = ligado();
  const aceita = a.pedidosDeMaquina.at(-1).oferta;
  a.parar(id, 'saiu');
  let s = servidor(a, id);
  assert.equal(s.ligar, true, 'a queda da conexão desligou o servidor de jogo');
  assert.equal(s.estado, 'esperando-maquina');
  const antes = a.pedidosDeMaquina.length;
  a.reiniciar({ fora: ['2'] });
  assert.equal(a.pedidosDeMaquina.length, antes + 1, 'a dona que caiu não foi chamada de volta na subida');
  assert.deepEqual(a.pedidosDeMaquina.at(-1).oferta, aceita);
  s = servidor(a, id);
  assert.equal(s.aceite, 'fora');
  a.conectar('2');
  a.voltar(id, 'principal', '2');
  a.aceitar(id);
  assert.equal(a.avisosAMaquinas.at(-1).carga.op, 'ligar');
});

test('a pessoa que desliga na máquina dela (pelo-dono) segue desligando, e a subida não a chama', () => {
  const { a, id } = ligado();
  a.parar(id, 'pelo-dono');
  assert.equal(servidor(a, id).ligar, false);
  assert.equal(servidor(a, id).estado, 'desligado');
  const antes = a.pedidosDeMaquina.length;
  a.reiniciar();
  assert.equal(a.pedidosDeMaquina.length, antes, 'chamou de volta quem desligou');
});
