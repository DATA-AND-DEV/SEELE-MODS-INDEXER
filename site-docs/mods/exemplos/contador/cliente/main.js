// API 6: executado no executor do MOD, fora da janela. Não há `document`,
// `window`, `fetch` nem o global do Tauri aqui dentro. O produto monta a
// página e a entrada na navegação, e encerra tudo ao sair da sessão.
(() => {
  'use strict';

  const EU = 'exemplo/contador';
  // **Canal 0: o contador é do servidor inteiro.** Zero quer dizer «nenhum
  // canal» — o número, e não `null` —, e a metade de servidor recebe
  // `channel: null` no contexto.
  const SEM_CANAL = 0;

  // O que este MOD sabe agora. Desenhar é uma função disto, e de nada mais.
  let estado = null; // { valor, revisao }, como o servidor devolveu
  let aviso = '';
  let pagina = null; // o punho da página, depois da primeira abertura

  const desenho = () => [
    { forma: 'titulo', chave: 'titulo', dentro: 'Contador' },
    {
      forma: 'texto',
      chave: 'valor',
      dentro: estado ? `Valor: ${estado.valor} · revisão ${estado.revisao}` : 'Consultando o contador…',
    },
    {
      forma: 'acoes',
      chave: 'acoes',
      dentro: [
        { forma: 'botao', chave: 'somar', dentro: 'SOMAR 1', variante: 'primaria', desligado: !estado },
        {
          forma: 'botao',
          chave: 'zerar',
          dentro: 'ZERAR',
          variante: 'perigo',
          desligado: !estado,
          // O produto pergunta antes, com esta frase, e o evento `botao` só
          // chega depois do sim.
          confirmar: 'O contador volta a zero para todo o servidor.',
        },
      ],
    },
    { forma: 'texto', chave: 'aviso', dentro: aviso || 'Quem administra o servidor pode zerar.' },
  ];

  // **Uma página fechada continua de pé**, e montar nela vale: o que for
  // montado aparece quando ela voltar. Por isso não há «se está aberta» aqui.
  const pintar = () => (pagina
    ? pagina.montar(desenho()).catch((falha) => console.warn('a página não montou:', falha.erro))
    : Promise.resolve());

  // O estado mais novo vence, venha da resposta ou do aviso: o aviso de um
  // pedido pode chegar antes da resposta dele.
  const aceitar = (novo) => {
    if (!novo || !Number.isSafeInteger(novo.valor) || !Number.isSafeInteger(novo.revisao)) return;
    if (!estado || novo.revisao >= estado.revisao) estado = { valor: novo.valor, revisao: novo.revisao };
  };

  async function pedir(corpo) {
    // Uma recusa da lista fechada da ponte (`too-many-requests`,
    // `mensagem-grande`, `sessao-encerrada`…) rejeita a promessa com um `Error`
    // cujo `erro` é o nome. O envelope `{ ok: false, error }` é resposta: do
    // anfitrião (`bridge-refused`, `quintal-cheio`) ou deste MOD
    // (`sem-permissao`, `conflito`). Os dois viram a mesma exceção aqui.
    const resposta = await SeeleMods.request(EU, SEM_CANAL, corpo);
    if (!resposta || !resposta.ok) {
      const nome = (resposta && resposta.error) || 'resposta-invalida';
      throw Object.assign(new Error(nome), { erro: nome });
    }
    return resposta;
  }

  // Lê e devolve o que dizer: nada, ou por que não leu.
  async function ler() {
    try {
      aceitar(await pedir({ op: 'ler' }));
      return '';
    } catch (falha) {
      return 'não leu: ' + (falha.erro || falha.message);
    }
  }

  async function gravar(op) {
    aviso = 'gravando…';
    await pintar();
    try {
      aceitar(await pedir({ op, revisao: estado.revisao }));
      aviso = '';
    } catch (falha) {
      // **A recusa é dita na página.** Um botão que não faz nada e não
      // explica é a forma mais cara de um MOD falhar: quem apertou não tem o
      // que fazer.
      if (falha.erro === 'conflito') {
        aviso = (await ler()) || 'outra pessoa gravou antes: o valor foi relido, aperte de novo';
        await pintar();
        return;
      }
      aviso = falha.erro === 'sem-permissao'
        ? 'sem permissão para isso neste servidor'
        : 'não gravou: ' + (falha.erro || falha.message);
    }
    await pintar();
  }

  async function abrir() {
    try {
      // Criar com o mesmo id reabre a mesma página, sem recriar.
      pagina = await SeeleUI.superficies.criar({ id: 'contador', tipo: 'pagina', titulo: 'Contador' });
    } catch (falha) {
      console.warn('a página não abriu:', falha.erro);
      return;
    }
    await pintar();
    aviso = await ler();
    await pintar();
  }

  // Um evento não tem resposta: quem aperta não espera o MOD confirmar.
  SeeleUI.aoEvento((evento) => {
    if (evento.nome === 'acao' && evento.acao === 'abrir-contador') {
      void abrir();
      return;
    }
    // **O aviso da metade de servidor**: alguém gravou, e o estado novo veio
    // junto. É o que deixa este MOD sem consulta periódica.
    if (evento.nome === 'servidor') {
      aceitar(evento.carga);
      void pintar();
      return;
    }
    if (evento.nome === 'botao' && estado) {
      if (evento.chave === 'somar') void gravar('incrementar');
      if (evento.chave === 'zerar') void gravar('zerar');
    }
  });

  // Uma entrada na navegação do servidor. Apertá-la manda o evento `acao`
  // com o nome em `acaoPrincipal`.
  SeeleUI.contribuicoes.registrar({
    ponto: 'servidor.navegacao',
    modo: 'adicionar',
    rotulo: 'Contador',
    acaoPrincipal: 'abrir-contador',
  }).catch((falha) => console.warn('a entrada não entrou:', falha.erro));
})();
