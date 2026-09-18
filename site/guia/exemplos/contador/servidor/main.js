// Estado pertence ao servidor. Não leia dados na inicialização do script.
globalThis.aoPedir = (contextoJSON, pedidoJSON) => {
  const contexto = JSON.parse(contextoJSON);
  const pedido = JSON.parse(pedidoJSON);
  const responder = valor => JSON.stringify(valor);
  const estado = JSON.parse(dados.contador || '{"schema":1,"valor":0,"revisao":0}');
  if (estado.schema !== 1) return responder({ok:false,error:'schema-incompativel'});
  if (!pedido || typeof pedido !== 'object') return responder({ok:false,error:'pedido-invalido'});
  if (pedido.op === 'ler') return responder({ok:true,...estado});
  if (!['incrementar','zerar'].includes(pedido.op)) return responder({ok:false,error:'operacao-desconhecida'});
  if (!contexto.write || (pedido.op === 'zerar' && !contexto.admin)) {
    return responder({ok:false,error:'sem-permissao'});
  }
  if (!Number.isSafeInteger(pedido.revisao) || pedido.revisao !== estado.revisao) {
    return responder({ok:false,error:'conflito',revisao:estado.revisao});
  }
  if (estado.revisao >= Number.MAX_SAFE_INTEGER || estado.valor >= Number.MAX_SAFE_INTEGER) {
    return responder({ok:false,error:'limite-do-contador'});
  }
  estado.valor = pedido.op === 'zerar' ? 0 : estado.valor + 1;
  estado.revisao += 1;
  dados.contador = JSON.stringify(estado);
  return responder({ok:true,...estado});
};
