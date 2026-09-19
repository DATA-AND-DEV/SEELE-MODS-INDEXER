import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const base=new URL('../guia/',import.meta.url);
const source=readFileSync(new URL('exemplos/contador/servidor/main.js',base),'utf8');
function contador(){
  let state={};
  return (pedido,ctx={person:'1',channel:1,admin:true,write:true})=>{
    const data={...state};const sandbox=vm.createContext({dados:data});
    vm.runInContext(source,sandbox,{timeout:100});
    const response=JSON.parse(sandbox.aoPedir(JSON.stringify(ctx),JSON.stringify(pedido)));
    state=data;return response;
  };
}
test('exemplo: leitura e persistência em runtime novo',()=>{
  const call=contador();assert.equal(call({op:'ler'}).valor,0);
  assert.equal(call({op:'incrementar',revisao:0}).valor,1);
  assert.equal(call({op:'ler'}).revisao,1);
});
test('exemplo: corpo não concede escrita nem administração',()=>{
  const call=contador();const leitor={person:'2',channel:1,write:false,admin:false};
  assert.equal(call({op:'incrementar',revisao:0,write:true,admin:true},leitor).error,'sem-permissao');
  assert.equal(call({op:'zerar',revisao:0,admin:true},{...leitor,write:true}).error,'sem-permissao');
  assert.equal(call({op:'ler'}).revisao,0);
});
test('exemplo: concorrência e repetição não somam duas vezes',()=>{
  const call=contador();assert.equal(call({op:'incrementar',revisao:0}).ok,true);
  assert.equal(call({op:'incrementar',revisao:0}).error,'conflito');
  assert.equal(call({op:'ler'}).valor,1);
  assert.equal(call({op:'zerar',revisao:1}).valor,0);
});
test('exemplo: corpo inválido, revisão e operação não alteram estado',()=>{
  const call=contador();
  for(const request of [null,{}, {op:'incrementar',revisao:'0'}, {op:'apagar'}]) assert.equal(call(request).ok,false);
  assert.equal(call({op:'ler'}).valor,0);
});
test('guia: abas e painéis têm relações únicas e todos os capítulos estão no HTML',()=>{
  const html=readFileSync(new URL('index.html',base),'utf8');
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(ids.length,new Set(ids).size);
  for(const m of html.matchAll(/aria-(?:controls|labelledby)="([^"]+)"/g))assert.ok(ids.includes(m[1]),m[1]);
  assert.equal((html.match(/<article /g)||[]).length,24);
  assert.ok(html.includes('Content-Security-Policy'));
  assert.ok(html.includes('guia-criacao-mods.md'));
  assert.ok(html.includes('ainda sem encaminhamento'));
});

test('contador API 3 executa sem DOM e declara texto sem escrever estado', async () => {
  const call = contador(), regions = [], timers = [], operations = [];
  const client = readFileSync(new URL('exemplos/contador/cliente/main.js', base), 'utf8');
  const sandbox = vm.createContext({
    SeeleMods: {
      snapshot: async () => ({open_channel: 7}),
      request: async (id, channel, pedido) => { assert.equal(id, 'exemplo/contador'); assert.equal(channel, 7); operations.push(pedido.op); return call(pedido); },
    },
    SeeleUI: {
      regiao: async tree => regions.push(tree),
      // A API 3 fala com o MOD sem que ele tenha perguntado. Um ouvinte só, e o
      // último vence — é o que o produto oferece.
      aoEvento: fn => { ouvinte = fn; },
    },
    setTimeout: fn => timers.push(fn), console,
  });
  let ouvinte = null;
  vm.runInContext(client, sandbox);
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(operations, ['ler']);
  assert.match(JSON.stringify(regions), /Valor: 0/);
  assert.equal(timers.length, 1);
  assert.equal(call({op:'ler'}).revisao, 0);

  // **O exemplo tem botão, e o botão precisa chegar ao servidor.**
  //
  // Sem esta parte, o teste provaria que o exemplo desenha e nada mais — e um
  // exemplo de API 3 cujo botão não funciona é pior que um exemplo só de
  // leitura, porque ele promete a interação e não a entrega.
  assert.ok(ouvinte, 'o exemplo não registrou ouvinte de evento');
  ouvinte({ nome: 'botao', chave: 'somar' });
  await new Promise(resolve => setImmediate(resolve));
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(operations, ['ler', 'incrementar'], 'o botão não chegou ao servidor');
  assert.equal(call({op:'ler'}).valor, 1, 'o servidor não contou');
  assert.match(JSON.stringify(regions), /Valor: 1/, 'a região não mostrou o valor novo');

  // E o que não é botão não vira escrita: um evento de campo passando por aqui
  // gravaria sem ninguém ter pedido.
  const antes = operations.length;
  ouvinte({ nome: 'campo', chave: 'somar', valor: 'x' });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(operations.length, antes, 'um evento que não é botão virou escrita');
});
