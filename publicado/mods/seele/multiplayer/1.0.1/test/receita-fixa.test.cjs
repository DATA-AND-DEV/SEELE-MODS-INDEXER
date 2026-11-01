// Uma receita só de dados, com a fonte `fixo`: o caminho de um jogo cujos
// arquivos têm URL, hash e tamanho fixos entrar pela comunidade sem código novo.
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { carregar, receitaDoDisco } = require('./carregar.cjs');

const local = v => JSON.parse(JSON.stringify(v));

function jogoFixo() {
  const r = receitaDoDisco('minecraft');
  Object.assign(r, { id: 'jogo-fixo', nome: 'Jogo Fixo', icone: 'JF', origens: ['cdn.jogo.net'], dominiosDoJogo: [], termos: [] });
  r.versoes = { fonte: 'fixo', lista: [{ id: '2.0' }, { id: '1.0' }] };
  r.artefatos = [{
    id: 'servidor', fonte: 'fixo', destino: 'bin/servidor',
    porVersao: {
      '1.0': { url: 'https://cdn.jogo.net/1.0/servidor', hash: { algoritmo: 'sha512', hex: 'a'.repeat(128) }, tamanho: 1000 },
      '2.0': { url: 'https://cdn.jogo.net/2.0/servidor', hash: { algoritmo: 'sha256', hex: 'b'.repeat(64) }, tamanho: 2000 },
    },
  }];
  r.rodar = { comando: 'bin/servidor', argumentos: ['--porta', '7777'] };
  r.rede = { protocolo: 'udp', portaPadrao: 7777 };
  return r;
}

test('uma receita fixa passa no validador, resolve sem rede e vira oferta', () => {
  const r = jogoFixo();
  const m = carregar('servidor', ['validarReceita', 'listarVersoes', 'resolverVersao', 'montarOferta'], {}, { receitas: [r] });
  assert.deepEqual([...m.validarReceita(r).erros], []);
  const nada = () => { throw new Error('foi à rede'); };
  assert.deepEqual(local(m.listarVersoes(r, nada)).versoes.map(v => v.id), ['2.0', '1.0']);
  const resolvido = m.resolverVersao(r, '1.0', nada);
  assert.equal(resolvido.ok, true);
  const o = local(m.montarOferta(r, { servidor: 'jogo-fixo-1', versao: '1.0', porta: 7777, comCopia: true }, resolvido));
  assert.deepEqual(o.artefatos, [{ nome: 'servidor', url: 'https://cdn.jogo.net/1.0/servidor', tamanho: 1000, hash: { algoritmo: 'sha512', hex: 'a'.repeat(128) } }]);
  // O jogo, e a cópia do mundo para a reserva (parte 7), sempre TCP; sem reserva, só o jogo.
  assert.deepEqual(o.tuneis, [{ nome: 'jogo-fixo-1', protocolo: 'udp', porta: 7777 }, { nome: 'jogo-fixo-1-copia', protocolo: 'tcp', porta: 17777 }]);
  assert.deepEqual(local(m.montarOferta(r, { servidor: 'jogo-fixo-1', versao: '1.0', porta: 7777 }, resolvido)).tuneis, [{ nome: 'jogo-fixo-1', protocolo: 'udp', porta: 7777 }]);
  assert.deepEqual(local(m.resolverVersao(r, '3.0', nada)), { ok: false, erro: 'versao-desconhecida', versao: '3.0' });
});
