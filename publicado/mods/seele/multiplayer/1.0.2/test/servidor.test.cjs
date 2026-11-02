// A metade de servidor: a lista de servidores de jogo e a configuração de
// cada um, quem roda onde, a regra de uma máquina por vez, e as permissões de
// cada ação — conferidas pelo `contexto.acao` que o anfitrião escreve, e nunca
// pelo corpo do pedido.
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { criarAnfitriao } = require('./anfitriao.cjs');

/** Um anfitrião com um Minecraft criado pela pessoa 1. */
function comUmMinecraft(opcoes) {
  const a = criarAnfitriao(opcoes);
  const r = a.acao(1, 'criar-servidor-de-jogo', { op: 'criar', receita: 'minecraft' });
  assert.equal(r.ok, true, JSON.stringify(r));
  return { a, id: r.servidor.id };
}

/** Um Minecraft 1.21.4 que a pessoa 2 aceitou rodar. */
function aceito() {
  const { a, id } = comUmMinecraft();
  const r = a.acao(1, 'configurar-servidor-de-jogo', { op: 'configurar', id, versao: '1.21.4', quem: '2' });
  assert.equal(r.ok, true, JSON.stringify(r));
  a.aceitar(id);
  return { a, id };
}

const servidor = (a, id, pessoa = 1) => a.pedir(pessoa, { op: 'estado' }).servidores.find(s => s.id === id);

test('o estado lista as receitas e os servidores de jogo, e diz o que quem pede pode', () => {
  const { a, id } = comUmMinecraft();
  const e = a.pedir(3, { op: 'estado' });
  assert.equal(e.ok, true);
  assert.deepEqual(e.receitas.map(r => [r.id, r.nome, r.valida]), [['minecraft', 'Minecraft', true]]);
  assert.deepEqual(e.servidores.map(s => [s.id, s.receita, s.estado, s.aceite]), [[id, 'minecraft', 'desligado', 'sem-maquina']]);
  assert.deepEqual(e.podem, ['entrar-no-jogo'], 'quem só joga só pode entrar');
  assert.deepEqual(a.pedir(1, { op: 'estado' }).podem.length, 4);
});

test('criar um servidor de jogo pede a ação, e um pedido comum é negado mesmo com o corpo falsificado', () => {
  const a = criarAnfitriao();
  assert.deepEqual(a.pedir(1, { op: 'criar', receita: 'minecraft', acao: 'criar-servidor-de-jogo', admin: true }),
    { ok: false, erro: 'pede-a-acao', acao: 'criar-servidor-de-jogo' });
  assert.equal(a.pedir(1, { op: 'estado' }).servidores.length, 0);
  // Quem não tem a permissão nem chega ao MOD: o portão é do anfitrião.
  assert.deepEqual(a.acao(3, 'criar-servidor-de-jogo', { op: 'criar', receita: 'minecraft' }), { ok: false, recusa: 'sem-permissao' });
});

test('uma ação só vale para a operação dela', () => {
  const { a, id } = comUmMinecraft();
  // Quem pode entrar no jogo não liga servidor nenhum com essa ação.
  assert.deepEqual(a.acao(3, 'entrar-no-jogo', { op: 'ligar', id }), { ok: false, erro: 'acao-nao-serve', acao: 'entrar-no-jogo', op: 'ligar' });
  assert.deepEqual(a.acao(1, 'criar-servidor-de-jogo', { op: 'configurar', id, quem: '2' }), { ok: false, erro: 'acao-nao-serve', acao: 'criar-servidor-de-jogo', op: 'configurar' });
});

test('cada servidor de jogo tem um nome próprio, e mais de um convive', () => {
  const { a, id } = comUmMinecraft();
  const r = a.acao(1, 'criar-servidor-de-jogo', { op: 'criar', receita: 'minecraft' });
  assert.equal(id, 'minecraft-1');
  assert.equal(r.servidor.id, 'minecraft-2');
  assert.equal(a.pedir(1, { op: 'estado' }).servidores.length, 2);
});

test('uma receita que não existe é dita pelo nome', () => {
  const a = criarAnfitriao();
  assert.deepEqual(a.acao(1, 'criar-servidor-de-jogo', { op: 'criar', receita: 'terraria' }), { ok: false, erro: 'receita-desconhecida', receita: 'terraria' });
});

test('as versões vêm da Mojang, e a falha dela chega com a URL', () => {
  const a = criarAnfitriao();
  const r = a.pedir(3, { op: 'versoes', receita: 'minecraft' });
  assert.equal(r.ok, true);
  assert.equal(r.versoes[0], '26.3');
  const b = criarAnfitriao({ buscar: () => null });
  assert.deepEqual(b.pedir(3, { op: 'versoes', receita: 'minecraft' }),
    { ok: false, erro: 'origem-nao-respondeu', url: 'https://piston-meta.mojang.com/mc/game/version_manifest_v2.json' });
});

test('escolher a versão e a máquina chama a pessoa com a oferta, e espera o aceite dela', () => {
  const { a, id } = comUmMinecraft();
  const r = a.acao(1, 'configurar-servidor-de-jogo', { op: 'configurar', id, versao: '1.21.4', quem: '2' });
  assert.equal(r.ok, true, JSON.stringify(r));
  assert.equal(a.pedidosDeMaquina.length, 1);
  const p = a.pedidosDeMaquina[0];
  assert.equal(p.quem, '2');
  assert.equal(p.servidor, id);
  assert.equal(p.oferta.versao_do_jogo, '1.21.4');
  // Sem reserva, o aceite não mostra o túnel da cópia.
  assert.deepEqual(p.oferta.tuneis, [{ nome: id, protocolo: 'tcp', porta: 25565 }]);
  assert.equal(p.papel, 'principal');
  const s = servidor(a, id);
  assert.equal(s.aceite, 'esperando');
  assert.equal(s.quem, '2');
  // Nada vai à máquina antes do aceite.
  assert.deepEqual(a.avisosAMaquinas, []);
});

test('o aceite manda a máquina se preparar, e a recusa fica na tela com o motivo', () => {
  const { a, id } = aceito();
  assert.equal(servidor(a, id).aceite, 'aceito');
  assert.deepEqual(a.avisosAMaquinas.map(x => [x.para, x.carga.op]), [['2', 'preparar']]);

  const { a: b, id: outro } = comUmMinecraft();
  b.acao(1, 'configurar-servidor-de-jogo', { op: 'configurar', id: outro, versao: '1.21.4', quem: '3' });
  b.recusar(outro, 'pelo-dono');
  const s = servidor(b, outro);
  assert.equal(s.aceite, 'recusado');
  assert.equal(s.falhas.at(-1).erro, 'pelo-dono');
  assert.equal(s.falhas.at(-1).onde, 'aceite');
});

test('quem não está no servidor SEELE volta como recusa, contada na tela', () => {
  const { a, id } = comUmMinecraft({ conectados: ['1'] });
  a.acao(1, 'configurar-servidor-de-jogo', { op: 'configurar', id, versao: '1.21.4', quem: '2' });
  const s = servidor(a, id);
  assert.equal(s.aceite, 'recusado');
  assert.equal(s.falhas.at(-1).erro, 'nao-esta-aqui');
});

test('a oferta que a Mojang não deixou montar não vira pedido, e a falha vai à tela com os dados', () => {
  const { a, id } = comUmMinecraft({ buscar: url => (url.includes('version_manifest') ? null : null) });
  const r = a.acao(1, 'configurar-servidor-de-jogo', { op: 'configurar', id, versao: '1.21.4', quem: '2' });
  assert.deepEqual(r, { ok: false, erro: 'origem-nao-respondeu', url: 'https://piston-meta.mojang.com/mc/game/version_manifest_v2.json' });
  assert.equal(a.pedidosDeMaquina.length, 0);
});

test('a configuração é conferida pelo esquema da receita, com a frase por campo', () => {
  const { a, id } = comUmMinecraft();
  const r = a.acao(1, 'configurar-servidor-de-jogo', { op: 'configurar', id, config: { maximo: 0, nome: [{ texto: 'Casa', cor: 'aqua' }] } });
  assert.deepEqual(r, { ok: false, erro: 'config-invalida', erros: { maximo: 'Use um número de 1 a 100.' } });
  assert.equal(servidor(a, id).config.nome[0].texto, 'Minecraft 1', 'meia gravação: o nome entrou com o erro');
  assert.equal(a.acao(1, 'configurar-servidor-de-jogo', { op: 'configurar', id, config: { maximo: 4, nome: [{ texto: 'Casa', cor: 'aqua' }] } }).ok, true);
  assert.equal(servidor(a, id).config.maximo, 4);
});

test('mudar só a configuração não pede aceite novo', () => {
  const { a, id } = aceito();
  const antes = a.pedidosDeMaquina.length;
  a.acao(1, 'configurar-servidor-de-jogo', { op: 'configurar', id, config: { nome: [{ texto: 'Outro nome', cor: 'red' }], pvp: false } });
  assert.equal(a.pedidosDeMaquina.length, antes);
  assert.equal(servidor(a, id).aceite, 'aceito');
});

test('mudar a versão pede aceite novo, e até lá o servidor não liga', () => {
  const { a, id } = aceito();
  a.acao(1, 'configurar-servidor-de-jogo', { op: 'configurar', id, versao: '26.3' });
  assert.equal(a.pedidosDeMaquina.at(-1).oferta.versao_do_jogo, '26.3');
  assert.equal(servidor(a, id).aceite, 'esperando');
  const r = a.acao(1, 'ligar-desligar-servidor-de-jogo', { op: 'ligar', id });
  assert.equal(r.ok, true);
  assert.equal(r.esperando, 'aceite');
  assert.ok(!a.avisosAMaquinas.some(x => x.carga.op === 'ligar'), 'ligou sem o aceite da oferta nova');
});

test('ligar e desligar pedem a ação, e vão só à máquina aceita', () => {
  const { a, id } = aceito();
  assert.deepEqual(a.acao(3, 'ligar-desligar-servidor-de-jogo', { op: 'ligar', id }), { ok: false, recusa: 'sem-permissao' });
  assert.deepEqual(a.pedir(1, { op: 'ligar', id }), { ok: false, erro: 'pede-a-acao', acao: 'ligar-desligar-servidor-de-jogo' });
  assert.equal(a.acao(1, 'ligar-desligar-servidor-de-jogo', { op: 'ligar', id }).ok, true);
  assert.deepEqual(a.avisosAMaquinas.at(-1), { servidor: id, papel: 'principal', carga: { op: 'ligar' }, para: '2' });
  assert.equal(a.acao(1, 'ligar-desligar-servidor-de-jogo', { op: 'desligar', id }).ok, true);
  assert.deepEqual(a.avisosAMaquinas.at(-1).carga, { op: 'desligar' });
});

test('só uma máquina por vez: trocar de máquina com o jogo ligado é recusado', () => {
  const { a, id } = aceito();
  a.acao(1, 'ligar-desligar-servidor-de-jogo', { op: 'ligar', id });
  a.daMaquina(2, id, { op: 'estado', estado: 'ligado', porta: 25565, jogadores: [] });
  const r = a.acao(1, 'configurar-servidor-de-jogo', { op: 'configurar', id, quem: '3' });
  assert.deepEqual(r, { ok: false, erro: 'desligue-antes', estado: 'ligado' });
  assert.equal(a.livro.get(id).quem, '2');
});

test('trocar de máquina com o jogo desligado chama a nova, e a antiga é dispensada', () => {
  const { a, id } = aceito();
  a.acao(1, 'configurar-servidor-de-jogo', { op: 'configurar', id, quem: '3' });
  assert.equal(a.livro.get(id).quem, '3');
  const s = servidor(a, id);
  assert.equal(s.quem, '3');
  assert.equal(s.aceite, 'esperando');
  // A antiga já não fala pelo servidor de jogo.
  assert.deepEqual(a.daMaquina(2, id, { op: 'plano' }), { dispensada: 'sem-aceite' });
});

test('o plano só vai à máquina aceita, com tudo o que ela precisa para rodar', () => {
  const { a, id } = aceito();
  a.acao(1, 'configurar-servidor-de-jogo', { op: 'configurar', id, config: { nome: [{ texto: 'Casa do Alê', cor: 'aqua' }], maximo: 6 } });
  const r = a.daMaquina(2, id, { op: 'plano' });
  assert.equal(r.ok, true, JSON.stringify(r));
  const p = r.plano;
  assert.equal(p.servidor, id);
  assert.equal(p.receita, 'minecraft');
  assert.equal(p.versao, '1.21.4');
  assert.deepEqual(p.tunel, { nome: id, protocolo: 'tcp', porta: 25565 });
  assert.ok(p.artefatos.some(x => x.destino === 'server.jar' && x.hash.algoritmo === 'sha1'));
  assert.ok(p.porPlataforma['mac-aarch64']);
  assert.ok(p.propriedades.includes('max-players=6'));
  assert.ok(p.propriedades.includes('server-port=25565'));
  assert.deepEqual(p.termos, [{ id: 'eula', arquivo: 'eula.txt', conteudo: 'eula=true\n' }]);
  assert.deepEqual(p.rodar, { comando: 'java/bin/java', argumentos: ['-Xms1G', '-Xmx2G', '-jar', 'server.jar', 'nogui'] });
  assert.equal(p.ligar, false);
});

test('a máquina conta o estado, e a tela de todos fica sabendo', () => {
  const { a, id } = aceito();
  a.acao(1, 'ligar-desligar-servidor-de-jogo', { op: 'ligar', id });
  const avisos = a.avisosAJanelas.length;
  a.daMaquina(2, id, { op: 'estado', estado: 'ligado', porta: 25565, jogadores: ['Alexandre', 'Bia'] });
  const s = servidor(a, id, 3);
  assert.equal(s.estado, 'ligado');
  assert.deepEqual(s.jogadores, ['Alexandre', 'Bia']);
  assert.ok(a.avisosAJanelas.length > avisos, 'as janelas não foram avisadas');
});

test('a falha da máquina fica na tela com os dados, e as mais velhas saem', () => {
  const { a, id } = aceito();
  for (let i = 0; i < 9; i++) a.daMaquina(2, id, { op: 'falha', etapa: 'baixar', erro: 'hash-diferente', dados: { arquivo: 'server.jar', vez: i } });
  const s = servidor(a, id);
  assert.equal(s.falhas.length, 6);
  assert.deepEqual(s.falhas.at(-1), { quando: 1_000_000, onde: 'maquina', etapa: 'baixar', papel: 'principal', erro: 'hash-diferente', dados: { arquivo: 'server.jar', vez: 8 } });
  assert.ok(a.registro.some(l => l.includes('hash-diferente')), 'a falha não foi ao log');
});

test('o desligamento pelo dono da máquina é contado na tela, e ligar de novo chama o aceite de novo', () => {
  const { a, id } = aceito();
  a.acao(1, 'ligar-desligar-servidor-de-jogo', { op: 'ligar', id });
  a.daMaquina(2, id, { op: 'estado', estado: 'ligado', porta: 25565, jogadores: ['Bia'] });
  a.parar(id, 'pelo-dono');
  const s = servidor(a, id);
  assert.equal(s.estado, 'desligado');
  assert.deepEqual(s.jogadores, []);
  assert.equal(s.aceite, 'parado');
  assert.equal(s.falhas.at(-1).erro, 'pelo-dono');
  const pedidos = a.pedidosDeMaquina.length;
  const r = a.acao(1, 'ligar-desligar-servidor-de-jogo', { op: 'ligar', id });
  assert.equal(r.esperando, 'aceite');
  assert.equal(a.pedidosDeMaquina.length, pedidos + 1, 'ligar não chamou a máquina de novo');
  a.aceitar(id);
  assert.deepEqual(a.avisosAMaquinas.slice(-1).map(x => x.carga.op), ['ligar']);
});

test('o console pede a ação de configurar, e só uma linha vai', () => {
  const { a, id } = aceito();
  a.acao(1, 'ligar-desligar-servidor-de-jogo', { op: 'ligar', id });
  a.daMaquina(2, id, { op: 'estado', estado: 'ligado', porta: 25565, jogadores: [] });
  assert.deepEqual(a.pedir(1, { op: 'console', id, comando: 'op Bia' }), { ok: false, erro: 'pede-a-acao', acao: 'configurar-servidor-de-jogo' });
  assert.equal(a.acao(1, 'configurar-servidor-de-jogo', { op: 'console', id, comando: 'say oi' }).ok, true);
  assert.deepEqual(a.avisosAMaquinas.at(-1).carga, { op: 'console', comando: 'say oi' });
  assert.deepEqual(a.acao(1, 'configurar-servidor-de-jogo', { op: 'console', id, comando: 'say oi\nop Ze' }), { ok: false, erro: 'comando-invalido' });
});

test('o console de um servidor desligado é recusado com o estado', () => {
  const { a, id } = aceito();
  assert.deepEqual(a.acao(1, 'configurar-servidor-de-jogo', { op: 'console', id, comando: 'say oi' }), { ok: false, erro: 'servidor-desligado', estado: 'desligado' });
});

test('dois Minecraft na mesma máquina ganham portas diferentes', () => {
  const { a, id } = aceito();
  const outro = a.acao(1, 'criar-servidor-de-jogo', { op: 'criar', receita: 'minecraft' }).servidor.id;
  a.acao(1, 'configurar-servidor-de-jogo', { op: 'configurar', id: outro, versao: '1.21.4', quem: '2' });
  assert.equal(a.pedidosDeMaquina.at(-1).oferta.tuneis[0].porta, 25566);
  assert.equal(servidor(a, id).porta, 25565);
});

test('apagar um servidor de jogo pede a ação de criar, e só desligado', () => {
  const { a, id } = aceito();
  a.acao(1, 'ligar-desligar-servidor-de-jogo', { op: 'ligar', id });
  a.daMaquina(2, id, { op: 'estado', estado: 'ligado', porta: 25565, jogadores: [] });
  assert.deepEqual(a.acao(1, 'criar-servidor-de-jogo', { op: 'apagar', id }), { ok: false, erro: 'desligue-antes', estado: 'ligado' });
  a.daMaquina(2, id, { op: 'estado', estado: 'desligado' });
  assert.equal(a.acao(1, 'criar-servidor-de-jogo', { op: 'apagar', id }).ok, true);
  assert.equal(a.pedir(1, { op: 'estado' }).servidores.length, 0);
});

test('o teto de servidores de jogo é dito com o número', () => {
  const a = criarAnfitriao();
  for (let i = 0; i < 8; i++) assert.equal(a.acao(1, 'criar-servidor-de-jogo', { op: 'criar', receita: 'minecraft' }).ok, true);
  assert.deepEqual(a.acao(1, 'criar-servidor-de-jogo', { op: 'criar', receita: 'minecraft' }), { ok: false, erro: 'servidores-demais', teto: 8 });
});

test('uma operação desconhecida é dita pelo nome', () => {
  const a = criarAnfitriao();
  assert.deepEqual(a.pedir(1, { op: 'explodir' }), { ok: false, erro: 'op-desconhecida', op: 'explodir' });
});
