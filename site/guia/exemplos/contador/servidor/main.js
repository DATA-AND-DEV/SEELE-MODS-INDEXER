// API 6: roda no QuickJS de quem hospeda. O estado pertence ao servidor, e a
// autorização sai do contexto, nunca do pedido. Não leia `dados` na
// inicialização do script: o quintal só chega dentro de uma chamada.
globalThis.aoPedir = (contextoJSON, pedidoJSON) => {
  const contexto = JSON.parse(contextoJSON);
  const responder = valor => JSON.stringify(valor);
  let pedido;
  try { pedido = JSON.parse(pedidoJSON); } catch { return responder({ok:false,error:'pedido-invalido'}); }
  const estado = JSON.parse(dados.contador || '{"schema":1,"valor":0,"revisao":0}');
  if (estado.schema !== 1) return responder({ok:false,error:'schema-incompativel'});
  if (!pedido || typeof pedido !== 'object') return responder({ok:false,error:'pedido-invalido'});
  if (pedido.op === 'ler') return responder({ok:true,valor:estado.valor,revisao:estado.revisao});
  if (!['incrementar','zerar'].includes(pedido.op)) return responder({ok:false,error:'operacao-desconhecida'});
  // Sem canal, `write` diz se a pessoa pode escrever nos canais em geral.
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
  // **As janelas deste MOD ficam sabendo**, pelo evento `servidor`, sem
  // perguntar. O aviso só sai se esta chamada terminar e o quintal gravar.
  const avisado = mundo.avisar({carga:{valor:estado.valor,revisao:estado.revisao}});
  if (!avisado.ok) mundo.registrar('o aviso não saiu: ' + avisado.erro);
  return responder({ok:true,valor:estado.valor,revisao:estado.revisao});
};
