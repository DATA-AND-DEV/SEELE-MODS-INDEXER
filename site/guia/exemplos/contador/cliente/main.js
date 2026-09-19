// API 3: executado no executor do MOD. O produto monta a região e encerra a
// sessão. Não há `document`, `window` nem o global do Tauri aqui dentro.
(() => {
  'use strict';

  // O que este MOD sabe agora. Redesenhar é uma função disto, e de nada mais.
  let estado = null;
  let aviso = '';
  let canalAtual = null;

  const desenho = () => {
    if (!estado) return [{ forma: 'texto', dentro: 'Consultando o contador…' }];
    return [
      { forma: 'titulo', dentro: 'Contador' },
      { forma: 'texto', dentro: `Valor: ${estado.valor} · revisão ${estado.revisao}` },
      {
        forma: 'linha',
        dentro: [
          { forma: 'botao', chave: 'somar', dentro: 'SOMAR 1' },
          { forma: 'botao', chave: 'zerar', dentro: 'ZERAR' },
        ],
      },
      { forma: 'texto', dentro: aviso || 'Quem administra o servidor pode zerar.' },
    ];
  };

  const pintar = () => SeeleUI.regiao(desenho()).catch(erro => console.error(erro));

  async function pedir(canal, corpo) {
    const resposta = await SeeleMods.request('exemplo/contador', canal, corpo);
    // **A recusa é dita pelo nome.** Um botão que não faz nada e não explica é
    // a forma mais cara de um MOD falhar: quem apertou não tem o que fazer.
    if (!resposta.ok) throw new Error(resposta.error);
    return resposta;
  }

  // Um evento não tem resposta: quem aperta não espera o MOD confirmar.
  SeeleUI.aoEvento(evento => {
    if (evento.nome !== 'botao' || canalAtual == null) return;
    const op = evento.chave === 'somar' ? 'incrementar' : 'zerar';
    aviso = 'gravando…';
    void pintar();
    pedir(canalAtual, { op, revisao: estado?.revisao ?? 0 }).then(
      resposta => { estado = resposta; aviso = ''; return pintar(); },
      erro => { aviso = 'não gravou: ' + erro.message; return pintar(); },
    );
  });

  async function atualizar() {
    try {
      const snapshot = await SeeleMods.snapshot();
      const canal = snapshot.open_channel ?? snapshot.channels?.[0]?.id;
      if (canal == null) throw new Error('Entre em um servidor com canal de texto.');
      canalAtual = canal;
      estado = await pedir(canal, { op: 'ler' });
      await pintar();
    } catch (erro) {
      try { await SeeleUI.regiao({ forma: 'texto', dentro: 'Não concluído: ' + erro.message }); }
      catch (falha) { console.error(falha); }
    } finally {
      // Agendado depois de concluir: nunca sobrepõe consultas. O SEELE encerra
      // o executor e seus temporizadores ao sair da sessão.
      setTimeout(atualizar, 4000);
    }
  }
  void atualizar();
})();
