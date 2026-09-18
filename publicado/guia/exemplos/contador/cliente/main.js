(() => {
  const id = 'exemplo/contador';
  const api = globalThis.SeeleMods;
  if (!api) return;
  const painel = document.createElement('section');
  painel.setAttribute('aria-label', 'Contador compartilhado');
  const titulo = document.createElement('h2'); titulo.textContent = 'Contador';
  const valor = document.createElement('p'); valor.textContent = 'Carregando…';
  valor.setAttribute('role', 'status');
  const somar = document.createElement('button'); somar.type = 'button'; somar.textContent = 'Somar 1';
  const zerar = document.createElement('button'); zerar.type = 'button'; zerar.textContent = 'Zerar (administrador)';
  painel.append(titulo, valor, somar, zerar);
  // CSSOM e estilos de propriedades: não injete <style> inline sob a CSP.
  Object.assign(painel.style, {
    border: '1px solid var(--seele-linha-forte)', padding: '16px', margin: '8px',
    color: 'var(--seele-osso)', background: 'var(--seele-negro-painel)',
    fontFamily: 'var(--seele-mono)'
  });
  let encerrado = false, ocupado = false, revisao = null, timer;
  const mensagens = {
    'sem-permissao': 'Sua permissão não permite esta ação.',
    'conflito': 'O contador mudou. Recarregando; confira o valor antes de tentar de novo.',
    'bridge-refused': 'O servidor recusou o pedido. Confira o MOD e o log do host.'
  };
  async function executar(op = 'ler') {
    if (encerrado || ocupado) return;
    ocupado = true; somar.disabled = zerar.disabled = true;
    try {
      const snapshot = await api.snapshot();
      if (encerrado) return;
      const canal = snapshot.open_channel ?? snapshot.channels?.[0]?.id;
      if (canal == null) throw new Error('Entre em um servidor com canal de texto.');
      const destino = document.querySelector('#tela-sessao .painel-canais .canais-rolagem');
      if (!destino) throw new Error('A interface desta versão não oferece o ponto de montagem esperado.');
      if (painel.parentNode !== destino) destino.append(painel);
      const resposta = await api.request(id, canal, {op, revisao});
      if (encerrado) return;
      if (!resposta.ok) throw new Error(mensagens[resposta.error] || resposta.error);
      revisao = resposta.revisao;
      valor.textContent = `Valor: ${resposta.valor} · revisão ${resposta.revisao}`;
    } catch (erro) {
      if (!encerrado) valor.textContent = 'Não concluído: ' + (erro.message || String(erro));
      // Não repita automaticamente uma mutação após timeout.
    } finally {
      ocupado = false;
      if (!encerrado) somar.disabled = zerar.disabled = revisao === null;
    }
  }
  somar.onclick = () => executar('incrementar');
  zerar.onclick = () => executar('zerar');
  function descarregar(evento) {
    if (evento.detail !== id) return;
    encerrado = true; clearInterval(timer); painel.remove();
    globalThis.removeEventListener('seele-mod-unload', descarregar);
  }
  globalThis.addEventListener('seele-mod-unload', descarregar);
  timer = setInterval(() => executar('ler'), 4000);
  executar('ler');
})();
