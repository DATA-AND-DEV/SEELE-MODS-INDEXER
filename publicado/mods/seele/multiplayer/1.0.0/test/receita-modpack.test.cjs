// A seção `modpack` da receita (API 8 parte 6): o que o esquema não diz e o
// validador confere — a variante com mods sem modpack, o instalador fixo sem
// hash, o reposilite sem detalhes, a URL fora das origens e dos domínios do
// loader, e as variáveis que não são {mc} nem {loader}.
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { carregar, receitaDoDisco } = require('./carregar.cjs');

const { validarReceita } = carregar('servidor', ['validarReceita']);
const minecraft = () => receitaDoDisco('minecraft');
const erros = receita => [...validarReceita(receita).erros];

test('com mods sem modpack é recusado: a variante não teria como rodar', () => {
  const r = minecraft();
  delete r.modpack;
  assert.deepEqual(erros(r), ['receita.variantes.com-mods: sem «modpack», a variante com mods não tem como rodar']);
  // Indisponível, sem modpack, passa.
  r.variantes['com-mods'].disponivel = false;
  assert.deepEqual(erros(r), []);
});

test('o instalador de cada loader pede o que a fonte dele usa', () => {
  const r = minecraft();
  delete r.modpack.loaders['fabric-loader'].instalador.hash;
  delete r.modpack.loaders.forge.instalador.detalhes;
  r.modpack.loaders['quilt-loader'].instalador.url = 'https://example.com/quilt-installer.jar';
  r.modpack.loaders.neoforge.rodar.push('{versao}');
  assert.deepEqual(erros(r), [
    'receita.modpack.loaders.fabric-loader.instalador: a fonte fixo precisa de «hash» e «tamanho»',
    'receita.modpack.loaders.quilt-loader.instalador.url: example.com não está nas origens nem nos domínios do loader',
    'receita.modpack.loaders.forge.instalador: a fonte reposilite precisa de «detalhes» e «algoritmo»',
    'receita.modpack.loaders.neoforge: {versao} não é {mc} nem {loader}',
  ]);
});

test('uma chave desconhecida num loader é recusada com o caminho', () => {
  const r = minecraft();
  r.modpack.loaders.forge.rodr = [];
  assert.deepEqual(erros(r), ['receita.modpack.loaders.forge: chave desconhecida «rodr»']);
});
