// Como cada metade é montada a partir de `fonte/` e de `receitas/`.
//
// **As receitas são dados, e vão dentro do pacote como dados.** Nenhuma metade
// lê arquivo do pacote em tempo de execução (o `arquivos` do manifesto é só
// mídia), então o build as escreve no topo de cada metade, como JSON, e o
// validador as confere antes: uma receita que não passa não vira pacote.
//
// O mesmo arquivo serve o build e os testes, para o que os testes carregam ser
// o que o build escreve.
'use strict';
const fs = require('node:fs');
const path = require('node:path');

const RAIZ = path.resolve(__dirname, '..');

/** As fontes de cada metade, na ordem em que entram. */
const ORDEM = Object.freeze({
  servidor: ['comum', 'esquema', 'receita', 'modpack', 'servidor'],
  maquina: ['comum', 'esquema', 'receita', 'modpack', 'adaptador', 'maquina'],
  cliente: ['comum', 'receita', 'cliente'],
});

const lerJson = arquivo => JSON.parse(fs.readFileSync(arquivo, 'utf8'));

/** As receitas de `receitas/`, em ordem de nome, sem o esquema. */
function lerReceitas(pasta = path.join(RAIZ, 'receitas')) {
  return fs.readdirSync(pasta)
    .filter(nome => nome.endsWith('.json') && nome !== 'esquema.json')
    .sort()
    .map(nome => ({ arquivo: nome, receita: lerJson(path.join(pasta, nome)) }));
}

const lerEsquema = () => lerJson(path.join(RAIZ, 'receitas', 'esquema.json'));

const fonte = nome => fs.readFileSync(path.join(RAIZ, 'fonte', nome + '.js'), 'utf8');

/** As constantes que toda metade recebe: as receitas e o esquema delas. */
function preambulo(receitas, esquema) {
  return 'const RECEITAS = ' + JSON.stringify(receitas) + ';\n' +
    'const ESQUEMA_DA_RECEITA = ' + JSON.stringify(esquema) + ';\n';
}

/** O código de uma metade, sem o invólucro: o que os testes carregam num `vm`. */
function corpo(metade, { receitas, esquema } = {}) {
  const lista = ORDEM[metade];
  if (!lista) throw new Error('metade desconhecida: ' + metade);
  const rs = receitas ?? lerReceitas().map(r => r.receita);
  const metadeDoEsquema = metade === 'cliente' ? null : (esquema ?? lerEsquema());
  return preambulo(rs, metadeDoEsquema) + lista.map(fonte).join('\n');
}

/** A metade inteira, como o pacote a leva. */
function montar(metade) {
  const { api } = lerJson(path.join(RAIZ, 'mod.json'));
  return `/* Gerado por ferramentas/build.mjs a partir de fonte/ e receitas/. API ${api}. Não edite aqui. */\n` +
    '(() => {\n"use strict";\n' + corpo(metade) + '\n})();\n';
}

module.exports = { RAIZ, ORDEM, lerReceitas, lerEsquema, corpo, montar };
