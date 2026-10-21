import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const base=new URL('../guia/',import.meta.url);
const source=readFileSync(new URL('exemplos/contador/servidor/main.js',base),'utf8');
function contador(){
  let state={};const avisos=[];
  const call=(pedido,ctx={person:'1',channel:null,admin:true,write:true})=>{
    const data={...state};
    // `mundo.avisar` só vale se a chamada terminar e o quintal gravar: o aviso
    // de uma chamada que recusou não sai, e aqui ele só entra na lista quando o
    // quintal entra no estado.
    const declarados=[];
    const mundo={avisar:a=>{declarados.push(a);return {ok:true};},registrar:()=>{}};
    const sandbox=vm.createContext({dados:data,mundo});
    vm.runInContext(source,sandbox,{timeout:100});
    const response=JSON.parse(sandbox.aoPedir(JSON.stringify(ctx),JSON.stringify(pedido)));
    state=data;avisos.push(...declarados);return response;
  };
  call.avisos=avisos;
  return call;
}
test('exemplo: leitura e persistência em runtime novo',()=>{
  const call=contador();assert.equal(call({op:'ler'}).valor,0);
  assert.equal(call({op:'incrementar',revisao:0}).valor,1);
  assert.equal(call({op:'ler'}).revisao,1);
});
test('exemplo: corpo não concede escrita nem administração',()=>{
  const call=contador();const leitor={person:'2',channel:null,write:false,admin:false};
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
test('exemplo: a escrita avisa as janelas com o estado novo, e a recusa e a leitura não',()=>{
  const call=contador();
  call({op:'ler'});
  call({op:'incrementar',revisao:7});
  call({op:'zerar',revisao:0},{person:'2',channel:null,write:true,admin:false});
  assert.deepEqual(call.avisos,[]);
  call({op:'incrementar',revisao:0});
  assert.deepEqual(JSON.parse(JSON.stringify(call.avisos)),[{carga:{valor:1,revisao:1}}]);
});
test('guia: abas e painéis têm relações únicas e todos os capítulos estão no HTML',()=>{
  const html=readFileSync(new URL('index.html',base),'utf8');
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(ids.length,new Set(ids).size);
  for(const m of html.matchAll(/aria-(?:controls|labelledby)="([^"]+)"/g))assert.ok(ids.includes(m[1]),m[1]);
  // 28 desde a API 6 (D-guia-1). Este número ficou em 24 quando a API 4 trouxe
  // o 25º capítulo, e o teste reprovou calado até a revisão seguinte.
  assert.equal((html.match(/<article /g)||[]).length,28);
  assert.ok(html.includes('Content-Security-Policy'));
  assert.ok(html.includes('guia-criacao-mods.md'));
  // Uma frase do penúltimo capítulo: um `##` que o gerador não reconhecesse
  // levaria o capítulo para dentro do anterior, e ele sumiria do sumário.
  assert.ok(html.includes('Portar da 5 para a 6'));
});

test('contador API 6 executa sem DOM: a entrada abre a página, o botão grava e o aviso atualiza', async () => {
  const call = contador(), operations = [], contribuicoes = [], criadas = [], montagens = [];
  const client = readFileSync(new URL('exemplos/contador/cliente/main.js', base), 'utf8');
  let ouvinte = null;
  const sandbox = vm.createContext({
    SeeleMods: {
      request: async (id, canal, pedido) => {
        assert.equal(id, 'exemplo/contador');
        assert.equal(canal, 0, 'o contador é de escopo de servidor: canal 0');
        operations.push(pedido.op);
        return call(pedido);
      },
    },
    SeeleUI: {
      contribuicoes: { registrar: async pedido => { contribuicoes.push(pedido); return { handle: 1 }; } },
      superficies: {
        criar: async descricao => {
          criadas.push(descricao);
          return { id: descricao.id, montar: async arvore => { montagens.push(arvore); } };
        },
      },
      // A janela fala com o MOD sem que ele tenha perguntado. Um ouvinte só, e
      // o último vence — é o que o produto oferece.
      aoEvento: fn => { ouvinte = fn; },
    },
    console,
  });
  const esperar = async () => { for (let i = 0; i < 6; i += 1) await new Promise(resolve => setImmediate(resolve)); };
  const valor = () => JSON.stringify(montagens.at(-1)).match(/Valor: \d+/)?.[0];
  vm.runInContext(client, sandbox);
  await esperar();
  // Ao subir: só a entrada, e nenhuma página nem pedido.
  assert.equal(contribuicoes.length, 1);
  assert.equal(contribuicoes[0].ponto, 'servidor.navegacao');
  assert.deepEqual(operations, []);
  assert.ok(ouvinte, 'o exemplo não registrou ouvinte de evento');

  ouvinte({ nome: 'acao', acao: contribuicoes[0].acaoPrincipal });
  await esperar();
  assert.equal(criadas[0].tipo, 'pagina');
  assert.deepEqual(operations, ['ler']);
  assert.equal(valor(), 'Valor: 0');

  // **O exemplo tem botão, e o botão precisa chegar ao servidor.**
  ouvinte({ nome: 'botao', chave: 'somar' });
  await esperar();
  assert.deepEqual(operations, ['ler', 'incrementar'], 'o botão não chegou ao servidor');
  assert.equal(call({op:'ler'}).valor, 1, 'o servidor não contou');
  assert.equal(valor(), 'Valor: 1', 'a página não mostrou o valor novo');

  // O aviso do servidor atualiza a página sem pedido nenhum.
  ouvinte({ nome: 'servidor', canal: null, carga: { valor: 5, revisao: 5 } });
  await esperar();
  assert.equal(valor(), 'Valor: 5');
  assert.deepEqual(operations, ['ler', 'incrementar'], 'o aviso virou pedido');

  // E o que não é botão não vira escrita: um evento de campo passando por aqui
  // gravaria sem ninguém ter pedido.
  const antes = operations.length;
  ouvinte({ nome: 'campo', chave: 'somar', valor: 'x' });
  await esperar();
  assert.equal(operations.length, antes, 'um evento que não é botão virou escrita');
});
