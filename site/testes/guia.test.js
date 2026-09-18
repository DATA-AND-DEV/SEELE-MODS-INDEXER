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
