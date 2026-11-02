// A reserva na tela (parte 7): a aba MÁQUINA escolhe a reserva, mostra o
// aceite dela e quem é a dona agora, e o cartão de quem joga diz quanto tempo
// de jogo se perdeu quando a reserva assumiu numa queda.
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

test('a aba MÁQUINA escolhe a reserva, mostra o aceite dela e quem é a dona agora', async () => {
  const a = criarAnfitriao();
  const j = await aberta(a);
  await j.apertar('criar:minecraft');
  await j.mudar('escolha', 'versao', '1.21.4');
  await j.mudar('aba', 'aba', 'aba-maquina');
  await j.mudar('escolha', 'quem', '2');
  await j.mudar('escolha', 'reserva', '3');
  await j.apertar('salvar');
  const pedidos = a.pedidosDeMaquina.map(p => [p.papel, p.quem]);
  assert.deepEqual(pedidos, [['principal', '2'], ['reserva', '3']]);
  assert.match(j.texto('chip-aceite-reserva'), /ESPERANDO O ACEITE/);
  const id = a.pedidosDeMaquina[0].servidor;
  a.aceitar(id, 'principal');
  a.aceitar(id, 'reserva');
  await j.avisoDoServidor({ revisao: 99 });
  assert.match(j.texto('chip-aceite-reserva'), /ACEITO/);
  assert.match(j.texto('reserva'), /A DONA AGORA/);
  assert.match(j.texto('reserva'), /Nenhuma cópia ainda/);
  // O desenho 0.19: os estados em chips, com as cores do canvas.
  assert.equal(j.no('chip-aceite-reserva').classe, 'chipV', 'o aceite da reserva não é o chip verde');
  assert.equal(j.no('chip-dona').dentro, 'PRINCIPAL');
  assert.equal(j.no('chip-dona').classe, 'chipV');
  assert.equal(j.no('chip-copia').dentro, 'SEM CÓPIA');
  assert.equal(j.no('passar').variante, 'secundaria', 'PASSAR não é um controle do produto');
  assert.equal(j.no('passar').classe, undefined, 'PASSAR leva uma classe do MOD por cima do controle do produto');
  assert.ok(j.no('passar'), 'sem o botão de passar à reserva');
  assert.equal(j.no('intervaloDaCopia').valor, 5);
});

test('o cartão diz a todos quanto tempo de jogo se perdeu quando a reserva assumiu', async () => {
  const a = criarAnfitriao();
  const id = a.acao(1, 'criar-servidor-de-jogo', { op: 'criar', receita: 'minecraft' }).servidor.id;
  a.acao(1, 'configurar-servidor-de-jogo', { op: 'configurar', id, versao: '1.21.4', quem: '2', reserva: '3' });
  a.aceitar(id, 'principal');
  a.aceitar(id, 'reserva');
  a.acao(1, 'ligar-desligar-servidor-de-jogo', { op: 'ligar', id });
  a.daMaquina(2, id, { op: 'copia-pronta', codigo: 'k', sha256: 'c'.repeat(64), tamanho: 9 });
  a.daMaquina(3, id, { op: 'copia-recebida', sha256: 'c'.repeat(64) });
  a.passar(4 * 60);
  a.parar(id, 'saiu', 'principal');
  a.passar(60);
  a.sumir(id, 'principal', 2, 60);
  const j = await aberta(a);
  assert.match(j.texto('cartao:' + id), /A reserva assumiu às .*: perderam-se 4 min de jogo, desde a última cópia/);
  // O desenho 0.19: a frase vai no aviso laranja do canvas, com o rótulo
  // miúdo, e o cartão diz que roda na reserva, na máquina dela.
  const aviso = j.no('aviso-da-queda:' + id);
  assert.ok(aviso, 'o tempo perdido não está no aviso');
  assert.equal(aviso.classe, 'alerta');
  assert.match(j.texto('aviso-da-queda:' + id), /TEMPO DE JOGO PERDIDO/i);
  assert.equal(j.no('chip-na-reserva').classe, 'chipA');
  assert.match(j.texto('cartao:' + id), /na máquina de Bia /, 'o cartão diz a máquina da principal, e roda a da reserva');
});

test('a dona religada sem quem hospeda aparece na aba MÁQUINA, com quanto tempo ficou sem ele', async () => {
  const a = criarAnfitriao();
  const id = a.acao(1, 'criar-servidor-de-jogo', { op: 'criar', receita: 'minecraft' }).servidor.id;
  a.acao(1, 'configurar-servidor-de-jogo', { op: 'configurar', id, versao: '1.21.4', quem: '2' });
  a.aceitar(id, 'principal');
  a.acao(1, 'ligar-desligar-servidor-de-jogo', { op: 'ligar', id });
  a.daMaquina(2, id, { op: 'estado', estado: 'ligado', religada: { fora: 90 } });
  const j = await aberta(a);
  await j.apertar('configurar:' + id);
  await j.mudar('aba', 'aba', 'aba-maquina');
  assert.equal(j.no('chip-religada').classe, 'chipV');
  assert.match(j.texto('reserva'), /Seguiu 2 min sem quem hospeda o SEELE e foi religada às .*, sem desligar o jogo/);
});
