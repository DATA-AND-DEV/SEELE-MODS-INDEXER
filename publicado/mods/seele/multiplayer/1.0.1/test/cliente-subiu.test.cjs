// A tela depois do reinício do servidor SEELE, da passagem, de um jogo que
// cai num mundo mais novo e da troca para uma versão mais velha (e2e da API 8,
// 31/10, passos 13, 16 e 18).
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { criarAnfitriao } = require('./anfitriao.cjs');
const { criarJanela } = require('./janela.cjs');

async function aberta(a) {
  const j = criarJanela(a, {});
  await j.abrir();
  assert.deepEqual(j.erros, [], 'a janela anotou erros ao abrir');
  return j;
}

function ligado() {
  const a = criarAnfitriao();
  const id = a.acao(1, 'criar-servidor-de-jogo', { op: 'criar', receita: 'minecraft' }).servidor.id;
  a.acao(1, 'configurar-servidor-de-jogo', { op: 'configurar', id, versao: '1.21.4', quem: '2' });
  a.aceitar(id);
  a.acao(1, 'ligar-desligar-servidor-de-jogo', { op: 'ligar', id });
  a.daMaquina(2, id, { op: 'estado', estado: 'ligado', jogadores: ['Bia'] });
  return { a, id };
}

test('depois do reinício o cartão diz que espera a máquina, e a aba diz quem está fora', async () => {
  const { a, id } = ligado();
  a.reiniciar({ fora: ['2'] });
  const j = await aberta(a);
  assert.match(j.texto('cartao:' + id), /ESPERANDO A MÁQUINA/);
  assert.doesNotMatch(j.texto('cartao:' + id), /LIGADO/, 'o cartão seguiu dizendo ligado');
  await j.apertar('configurar:' + id);
  await j.mudar('aba', 'aba', 'aba-maquina');
  assert.match(j.texto('chip-aceite'), /FORA DO SEELE/);
  assert.match(j.texto('situacao'), /subiu de novo/);
  assert.match(j.texto('situacao'), /Fora do SEELE agora/);
  // DESLIGAR diz o que acontece, e não é calado.
  await j.apertar('desligar');
  assert.match(j.texto('aviso'), /não está conectada ao SEELE agora/);
  assert.match(j.texto('aviso'), /10 minutos/);
});

test('depois da passagem, o topo da aba MÁQUINA diz que roda na reserva', async () => {
  const a = criarAnfitriao();
  const id = a.acao(1, 'criar-servidor-de-jogo', { op: 'criar', receita: 'minecraft' }).servidor.id;
  a.acao(1, 'configurar-servidor-de-jogo', { op: 'configurar', id, versao: '1.21.4', quem: '2', reserva: '3' });
  a.aceitar(id, 'principal');
  a.aceitar(id, 'reserva');
  a.acao(1, 'ligar-desligar-servidor-de-jogo', { op: 'ligar', id });
  a.daMaquina(2, id, { op: 'estado', estado: 'ligado' });
  a.acao(1, 'ligar-desligar-servidor-de-jogo', { op: 'passar', id });
  a.daMaquina(2, id, { op: 'copia-pronta', codigo: 'k', sha256: 'c'.repeat(64), tamanho: 9, final: true });
  a.daMaquina(3, id, { op: 'copia-recebida', sha256: 'c'.repeat(64) });
  const j = await aberta(a);
  await j.apertar('configurar:' + id);
  await j.mudar('aba', 'aba', 'aba-maquina');
  const topo = j.texto('roda-em');
  assert.match(topo, /Máquina de Bia/, topo);
  assert.match(topo, /NA RESERVA/);
  assert.match(topo, /A principal, a máquina de Fulano/);
});

test('o jogo que cai num mundo mais novo diz isso numa frase, e a pilha fica atrás de DETALHES', async () => {
  const { a, id } = ligado();
  a.daMaquina(2, id, { op: 'estado', estado: 'caiu', saida: { codigo: 1, linhas: [
    '[18:01:02] [Server thread/ERROR]: Encountered an unexpected exception',
    'java.lang.IllegalStateException: No key dimensions in MapLike[{}]',
    '\tat net.minecraft.server.Main.main(Main.java:42)',
  ] } });
  const j = await aberta(a);
  await j.apertar('configurar:' + id);
  await j.mudar('aba', 'aba', 'aba-maquina');
  assert.match(j.texto('falhas'), /versão mais nova/);
  assert.doesNotMatch(j.texto('falhas'), /IllegalStateException|o-jogo-caiu/, 'a pilha crua fora dos detalhes');
  await j.apertar('detalhes:falha:0');
  assert.match(j.texto('falhas'), /No key dimensions/);
  assert.match(j.texto('falhas'), /o-jogo-caiu/);
});

test('trocar para uma versão mais velha pergunta, e COMEÇAR UM MUNDO NOVO troca a pasta do mundo', async () => {
  const { a, id } = ligado();
  a.acao(1, 'ligar-desligar-servidor-de-jogo', { op: 'desligar', id });
  a.daMaquina(2, id, { op: 'estado', estado: 'desligado' });
  const j = await aberta(a);
  await j.apertar('configurar:' + id);
  await j.mudar('escolha', 'versao', '1.20.1');
  await j.apertar('salvar');
  assert.match(j.texto('aviso'), /rodou por último na versão 1\.21\.4/);
  assert.ok(j.no('mundo:novo'), 'sem COMEÇAR UM MUNDO NOVO');
  assert.equal(j.no('mundo:manter').dentro, 'MANTER A 1.21.4');
  await j.apertar('mundo:novo');
  const s = a.pedir(1, { op: 'estado' }).servidores.find(x => x.id === id);
  assert.equal(s.versao, '1.20.1');
  assert.equal(s.mundo, 'world-2');
  assert.equal(j.no('aviso'), null, 'o aviso ficou depois da escolha');
});

test('MANTER A VERSÃO volta o rascunho à versão do mundo e não muda nada', async () => {
  const { a, id } = ligado();
  a.acao(1, 'ligar-desligar-servidor-de-jogo', { op: 'desligar', id });
  a.daMaquina(2, id, { op: 'estado', estado: 'desligado' });
  const j = await aberta(a);
  await j.apertar('configurar:' + id);
  await j.mudar('escolha', 'versao', '1.20.1');
  await j.apertar('salvar');
  await j.apertar('mundo:manter');
  assert.equal(j.no('versao').valor, '1.21.4');
  assert.equal(a.pedir(1, { op: 'estado' }).servidores.find(x => x.id === id).versao, '1.21.4');
});
