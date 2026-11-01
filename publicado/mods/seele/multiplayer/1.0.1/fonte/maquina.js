// ---- maquina.js: a metade de máquina ----
//
// Roda só numa máquina cujo dono aceitou, na tela do produto, rodar aquele
// servidor de jogo. Baixa e confere o que a receita pede, escreve os termos e
// a configuração, roda o jogo, lê a saída (pronto, quem entrou, quem saiu),
// serve o túnel quando o jogo está pronto, aceita comandos do console e para
// limpo.
//
// **Não confia em si para saber se foi aceita**: cada passo começa pedindo o
// plano à metade de servidor, que só o entrega à máquina aceita. Sem o plano,
// nada é baixado, nada é escrito e nada roda.
//
// **Nada calado.** Toda falha vai à metade de servidor (`op: 'falha'`), com a
// etapa, o nome do erro e os dados dele, e de lá à tela de quem configura.
//
// Toda a API da máquina passa pelo adaptador (adaptador.js).

const LINHAS_GUARDADAS = 8;
/** Onde a dona empacota o mundo, e onde a outra máquina guarda o que recebe (parte 7). */
const PACOTE_DA_COPIA = 'copias/mundo.tar.gz';
const COPIA_RECEBIDA = 'copias/recebida.tar.gz';
/** A marca do último mundo que esta máquina tem: o sha256 da cópia que ela abriu ou fez. */
const MARCA_DO_MUNDO = '.seele-mundo';
/** Quanto a parada da metade espera o jogo sair depois do `stop`, abaixo dos 20 s do produto. */
const PRAZO_DA_PARADA_DA_METADE = 15000;

function criarMaquina(ad) {
  const instancias = new Map();

  function instancia(servidor) {
    let i = instancias.get(servidor);
    if (!i) {
      i = {
        servidor, fila: Promise.resolve(), plano: null, preparado: null, proc: null, tunel: null,
        estado: 'desligado', jogadores: [], linhas: [], parando: false, esperas: [], progresso: null,
        casar: null, dona: true, vezDaCopia: 0, tunelDaCopia: null, recebida: null,
      };
      instancias.set(servidor, i);
    }
    return i;
  }

  // ---- falar com a metade de servidor ----

  async function falha(i, etapa, erro, dados = {}) {
    const frase = typeof erro === 'string' ? erro : fraseDoErro(erro);
    ad.registrar(`${i.servidor}: ${etapa}: ${frase} ${JSON.stringify(dados)}`);
    // As recusas do produto nesta máquina, contadas por nome, vão junto: é o
    // que diz à tela se a falha é a primeira ou a décima.
    let recusas = null;
    try { recusas = ad.recusas ? await ad.recusas() : null; } catch { recusas = null; }
    try {
      await ad.pedir({ op: 'falha', etapa, erro: frase, dados: { ...dados, ...(recusas && Object.keys(recusas).length ? { recusas } : {}) } });
    } catch (e) {
      // Sem a metade de servidor, o log desta máquina é o que sobra.
      ad.registrar(`${i.servidor}: a falha não chegou à metade de servidor: ${fraseDoErro(e)}`);
    }
  }

  async function contar(i, estado, extra = {}) {
    i.estado = estado;
    let resposta;
    try {
      resposta = await ad.pedir({
        op: 'estado', estado, jogadores: i.jogadores, linhas: i.linhas,
        ...(i.progresso ? { progresso: i.progresso } : {}), ...extra,
      });
    } catch (e) {
      ad.registrar(`${i.servidor}: o estado não chegou à metade de servidor: ${fraseDoErro(e)}`);
      return;
    }
    // A metade de servidor é quem decide quem roda: se ela manda parar, para.
    // Sem a posse (parte 7), é a principal que voltou com o jogo de pé: o
    // desligar é contado, e não calado.
    if (resposta?.ordem === 'desligar' && i.proc && !i.parando) {
      if (resposta.dona === false) enfileirar(i, () => perdeuAPosse(i));
      else enfileirar(i, () => desligar(i));
    }
  }

  async function lerPlano(i) {
    const r = await ad.pedir({ op: 'plano' });
    if (!r || r.ok !== true || !r.plano) {
      // Sem aceite, a máquina nem é ouvida (o produto a dispensa); com outro
      // motivo, a tela fica sabendo.
      if (r && r.erro && r.erro !== 'sem-aceite') await falha(i, 'plano', r.erro, dadosDoErro(r));
      ad.registrar(`${i.servidor}: sem plano: ${JSON.stringify(r)}`);
      return null;
    }
    i.plano = r.plano;
    const receita = receitaPorId(r.plano.receita);
    if (!receita) {
      await falha(i, 'plano', 'receita-desconhecida', { receita: r.plano.receita });
      return null;
    }
    i.receita = receita;
    i.casar = casarSaida(receita);
    i.dona = r.plano.dona !== false;
    // **A que não é a dona não roda** (parte 7): um jogo de pé aqui é o de
    // antes da queda, e sai — contado.
    if (!i.dona && i.proc && !i.parando) await perdeuAPosse(i);
    return r.plano;
  }

  // ---- preparar: baixar e conferir ----

  async function preparar(i) {
    const plano = await lerPlano(i);
    if (!plano) return false;
    const chave = JSON.stringify([plano.artefatos, plano.modpack?.sha512 ?? null]);
    if (i.preparado === chave) return true;

    const plataforma = ad.plataforma();
    // **O loader que não roda aqui é dito antes de baixar** (um loader cuja
    // receita limita `sistemas`): antes, a máquina baixava o servidor e o
    // Java (~90 MB no Forge 1.20.1) para só então recusar. O Forge e o
    // NeoForge rodam em todos desde a decisão W1 (o `win_args.txt` no Windows).
    const sistemas = plano.modpack?.loader ? receitaPorId(plano.receita)?.modpack?.loaders?.[plano.modpack.loader.id]?.sistemas : null;
    if (sistemas && !sistemas.includes(plataforma)) {
      await falha(i, 'loader', 'loader-sem-este-sistema', { loader: plano.modpack.loader.id, plataforma, sistemas });
      await contar(i, 'desligado');
      return false;
    }
    const java = new Set(Object.values(plano.porPlataforma));
    const meuJava = plano.porPlataforma[plataforma];
    if (java.size && !meuJava) {
      await falha(i, 'java', 'sem-java-para-esta-maquina', { plataforma, plataformas: Object.keys(plano.porPlataforma) });
      return false;
    }
    const baixar = plano.artefatos.filter(a => !java.has(a.nome) || a.nome === meuJava);
    i.progresso = { feitos: 0, total: baixar.length };
    await contar(i, 'baixando');
    for (const a of baixar) {
      // Um pacote (o Java) é baixado ao lado e aberto no destino: o produto
      // confere o hash do pacote, e abre só o que está sob a raiz dele.
      const destino = a.desempacotar ? `pacotes/${a.nome}` : a.destino;
      try {
        await ad.baixar({ url: a.url, hash: a.hash, tamanho: a.tamanho, destino });
      } catch (erro) {
        await falha(i, 'baixar', erro, { arquivo: a.nome, url: a.url, tamanho: a.tamanho, hash: a.hash, ...dadosDoErro(erro) });
        await contar(i, 'desligado');
        return false;
      }
      if (a.desempacotar) {
        try {
          await ad.desempacotar({ arquivo: destino, destino: a.destino, raiz: a.desempacotar.raiz });
        } catch (erro) {
          await falha(i, 'desempacotar', erro, { arquivo: a.nome, raiz: a.desempacotar.raiz, ...dadosDoErro(erro) });
          await contar(i, 'desligado');
          return false;
        }
      }
      i.progresso = { feitos: i.progresso.feitos + 1, total: baixar.length };
    }
    if (plano.modpack && !(await prepararModpack(i, plano))) {
      await contar(i, 'desligado');
      return false;
    }
    i.preparado = chave;
    await contar(i, 'pronto');
    return true;
  }

  // ---- o modpack (parte 6) ----

  /** Um passo do modpack que falhou: a falha vai à tela com a etapa e os dados. */
  async function falhaDoPack(i, etapa, erro, dados = {}) {
    await falha(i, etapa, erro, { ...dados, ...dadosDoErro(erro) });
    return false;
  }

  /**
   * **O pack aceito, aberto e aplicado**, na ordem da spec: o pack (trazido da
   * metade de servidor pelo volume, ou baixado do CDN do Modrinth pelo link),
   * o índice lido e conferido pelas mesmas regras da metade de servidor, cada
   * arquivo do servidor baixado com o `sha512`, os `overrides` e depois os
   * `server-overrides` por cima, e o instalador do loader que o pack pede.
   */
  async function prepararModpack(i, plano) {
    const mp = plano.modpack;
    if (mp.origem === 'enviado') {
      try {
        await ad.trazer({ pedido: mp.pedido, destino: mp.destino });
      } catch (erro) {
        return falhaDoPack(i, 'trazer-pack', erro, { destino: mp.destino, sha512: mp.sha512 });
      }
    }
    try {
      await ad.desempacotar({ arquivo: mp.destino, destino: 'pack', raiz: '' });
    } catch (erro) {
      return falhaDoPack(i, 'abrir-pack', erro, { arquivo: mp.destino });
    }
    let texto;
    try {
      texto = await ad.ler('pack/modrinth.index.json');
    } catch (erro) {
      return falhaDoPack(i, 'ler-indice', erro, {});
    }
    // As regras de novo, aqui: o índice que vale é o dos bytes aceitos.
    const lido = lerIndice(texto, i.receita);
    if (!lido.ok) return falhaDoPack(i, 'indice', lido.erro, lido);
    const indice = lido.indice;
    // Revisão final (I2): nem o índice nem os overrides trocam o que o aceite diz que roda.
    const protegidos = caminhosProtegidosDoPack(plano);
    const noIndice = indice.arquivos.find(a => protegidos.includes(a.path));
    if (noIndice) return falhaDoPack(i, 'indice', 'pack-troca-o-que-roda', { path: noIndice.path, protegidos });
    for (const raiz of ['overrides', 'server-overrides']) {
      for (const p of protegidos) {
        if (await existeNoPack(`pack/${raiz}/${p}`)) {
          return falhaDoPack(i, 'aplicar-' + raiz, 'pack-troca-o-que-roda', { raiz, path: p, protegidos });
        }
      }
    }
    const loaderIgual = JSON.stringify(indice.loader) === JSON.stringify(mp.loader);
    if (indice.mc !== mp.mc || !loaderIgual) {
      return falhaDoPack(i, 'indice', 'pack-nao-confere', { mc: indice.mc, mcDoPlano: mp.mc, loader: indice.loader, loaderDoPlano: mp.loader });
    }
    const sistemas = mp.loader ? i.receita.modpack.loaders[mp.loader.id]?.sistemas : null;
    if (sistemas && !sistemas.includes(ad.plataforma())) {
      return falhaDoPack(i, 'loader', 'loader-sem-este-sistema', { loader: mp.loader.id, plataforma: ad.plataforma(), sistemas });
    }
    const feitos = i.progresso?.feitos ?? 0;
    i.progresso = { feitos, total: feitos + indice.arquivos.length };
    await contar(i, 'baixando', { excluidos: indice.excluidos });
    for (const a of indice.arquivos) {
      try {
        await ad.baixar({ url: a.url, hash: { algoritmo: 'sha512', hex: a.sha512 }, tamanho: a.tamanho, destino: a.path });
      } catch (erro) {
        return falhaDoPack(i, 'baixar-do-pack', erro, { path: a.path, url: a.url, tamanho: a.tamanho });
      }
      i.progresso = { feitos: i.progresso.feitos + 1, total: i.progresso.total };
    }
    for (const raiz of ['overrides', 'server-overrides']) {
      try {
        await ad.desempacotar({ arquivo: mp.destino, destino: '', raiz, mesclar: true });
      } catch (erro) {
        // Um pack sem a pasta não tem o que aplicar: não é falha.
        if (erro?.erro === 'nada-sob-a-raiz') continue;
        return falhaDoPack(i, 'aplicar-' + raiz, erro, { raiz });
      }
    }
    // O passo de instalar **desta máquina** (decisão W1): o da entrada de
    // `por_sistema` do sistema dela, ou o de cima.
    const { instalar } = comandosDaMaquina({ rodar: plano.rodar, instalar: mp.instalar, porSistema: plano.porSistema }, ad.plataforma());
    if (mp.loader && instalar && !(await instalarLoader(i, { ...mp, instalar }))) return false;
    return true;
  }

  /**
   * Um arquivo do pack aberto existe? `ler` diz: lido, ou grande ou binário
   * demais para ler, é que está lá; a recusa `disco` (não achou, ou é pasta) é
   * que não está.
   */
  async function existeNoPack(caminho) {
    try {
      await ad.ler(caminho);
      return true;
    } catch (erro) {
      return erro?.erro === 'nao-e-texto' || erro?.erro === 'texto-grande-demais';
    }
  }

  /**
   * **O instalador do loader roda uma vez** (o segundo comando aceito): a
   * marca `.seele-loader` diz que este loader, nesta versão, já foi
   * instalado. Um instalador que sai com erro para tudo, com o código e as
   * últimas linhas.
   */
  async function instalarLoader(i, mp) {
    const marca = `${mp.loader.id}@${mp.loader.versao}@${mp.mc}\n`;
    let feita = null;
    try { feita = await ad.ler('.seele-loader'); } catch { feita = null; }
    if (feita === marca) return true;
    await contar(i, 'instalando');
    const linhas = [];
    let proc;
    try {
      proc = await ad.rodar({ comando: mp.instalar.comando, argumentos: mp.instalar.argumentos, pasta: '' });
    } catch (erro) {
      return falhaDoPack(i, 'instalar', erro, { comando: mp.instalar.comando, loader: mp.loader });
    }
    const saida = await new Promise(resolver => {
      proc.aoLinha(linha => { linhas.push(cortar(String(linha), 160)); if (linhas.length > LINHAS_GUARDADAS) linhas.shift(); });
      proc.aoSair(resolver);
    });
    if (saida?.codigo !== 0) {
      return falhaDoPack(i, 'instalar', 'instalador-falhou', { codigo: saida?.codigo ?? null, sinal: saida?.sinal ?? null, linhas, loader: mp.loader });
    }
    try {
      await ad.escrever('.seele-loader', marca);
    } catch (erro) {
      return falhaDoPack(i, 'instalar', erro, {});
    }
    return true;
  }

  // ---- ligar: escrever, rodar e vigiar ----

  async function escreverArquivos(i, plano) {
    // **Os termos só são escritos aqui**, com o plano que só a máquina aceita
    // recebe: o EULA foi aceito por quem é dono desta máquina, na tela do produto.
    for (const t of plano.termos) await ad.escrever(t.arquivo, t.conteudo);
    await ad.escrever(plano.arquivoDeConfig, plano.propriedades);
    // **O que um mod copia por cima da configuração** (medido no Create Live 5,
    // Forge 1.20.1: o Default Server Properties troca o `server.properties`
    // inteiro pelo `default-server.properties` do pack na primeira subida, e o
    // jogo subia em `*:25565`, com o nome e o máximo do pack): a máquina
    // escreve nele as chaves que a tela promete, e o resto do pack fica.
    if (plano.modpack) {
      for (const arquivo of i.receita?.modpack?.configuracoesDoPack ?? []) {
        let deles;
        try { deles = await ad.ler(arquivo); } catch { continue; }
        await ad.escrever(arquivo, mesclarPropriedades(deles, plano.propriedades));
      }
    }
  }

  /**
   * **O jogo usa o que a tela promete?** Lido de volta no «pronto», antes do
   * túnel: o jogo reescreve o arquivo com o que carregou, e um mod pode ter
   * trocado o que o MOD escreveu (o endereço, a porta, o modo online, o
   * nome). Trocado, o túnel não abre e o jogo para — dito, com cada chave.
   */
  async function configuracaoTrocada(i) {
    if (i.receita?.configuracao?.formato !== 'properties') return null;
    const plano = i.plano;
    let lido;
    try {
      lido = await ad.ler(plano.arquivoDeConfig);
    } catch (erro) {
      return { arquivo: plano.arquivoDeConfig, ilegivel: fraseDoErro(erro) };
    }
    const trocadas = propriedadesTrocadas(plano.propriedades, lido);
    const curto = v => (v === null ? null : cortar(v, 60));
    return trocadas.length
      ? { arquivo: plano.arquivoDeConfig, trocadas: trocadas.slice(0, 8).map(t => ({ chave: t.chave, esperado: curto(t.esperado), lido: curto(t.lido) })) }
      : null;
  }

  function lembrar(i, linha) {
    i.linhas = [...i.linhas, cortar(linha, 160)].slice(-LINHAS_GUARDADAS);
  }

  function aoLinha(i, cru) {
    // As cores do terminal fora (medido no NeoForge 1.21.1: as linhas do
    // `main/` chegam com `\x1b[32m` mesmo sem terminal): os padrões começam
    // em `^[`, e a tela mostra as últimas linhas de um jogo que caiu.
    const linha = semCores(cru);
    lembrar(i, linha);
    for (const e of [...i.esperas]) {
      if (e.re.test(linha)) {
        i.esperas = i.esperas.filter(x => x !== e);
        e.resolver(true);
      }
    }
    const lido = i.casar?.(linha);
    if (!lido) return;
    if (lido.tipo === 'pronto') enfileirar(i, () => abrirTunel(i));
    else if (lido.tipo === 'entrou') {
      if (!i.jogadores.includes(lido.jogador)) i.jogadores = [...i.jogadores, lido.jogador];
      contar(i, i.estado);
    } else if (lido.tipo === 'saiu') {
      i.jogadores = i.jogadores.filter(j => j !== lido.jogador);
      contar(i, i.estado);
    }
  }

  async function abrirTunel(i) {
    const t = i.plano.tunel;
    const trocada = await configuracaoTrocada(i);
    if (trocada) {
      await falha(i, 'config', trocada.ilegivel ? 'config-ilegivel' : 'config-trocada', trocada);
      await desligar(i);
      return;
    }
    try {
      i.tunel = await ad.servirPorta({ nome: t.nome, protocolo: t.protocolo, porta: t.porta });
    } catch (erro) {
      await falha(i, 'tunel', erro, { nome: t.nome, protocolo: t.protocolo, porta: t.porta, ...dadosDoErro(erro) });
    }
    await contar(i, 'ligado');
    // A dona começa a copiar o mundo para a outra máquina (parte 7).
    if (i.dona) agendarCopia(i);
  }

  function fecharTunel(i) {
    try {
      i.tunel?.fechar?.();
    } catch (erro) {
      falha(i, 'tunel', erro, { fechando: true });
    }
    i.tunel = null;
    // A cópia agendada para com o jogo; o túnel da cópia fica, para a outra
    // máquina terminar de receber a final (o produto o para quando a posse muda).
    i.vezDaCopia++;
  }

  async function aoSair(i, saida) {
    const pedido = i.parando;
    i.proc = null;
    i.parando = false;
    i.jogadores = [];
    fecharTunel(i);
    for (const e of i.esperas.splice(0)) e.resolver(false);
    i.aoTerminar?.();
    i.aoTerminar = null;
    const codigo = saida?.codigo ?? null;
    if (pedido) await contar(i, 'desligado');
    else await contar(i, 'caiu', { saida: { codigo, sinal: saida?.sinal ?? null, linhas: i.linhas } });
  }

  async function ligar(i) {
    if (i.proc) return;
    if (!(await preparar(i))) return;
    const plano = i.plano;
    try {
      await escreverArquivos(i, plano);
    } catch (erro) {
      await falha(i, 'escrever', erro, dadosDoErro(erro));
      return;
    }
    i.linhas = [];
    i.jogadores = [];
    await contar(i, 'ligando');
    let proc;
    let comandoRodado = null;
    try {
      // `pasta: ''` é a pasta deste servidor de jogo. O par **desta máquina**
      // (decisão W1): o `win_args.txt` do Forge no Windows, o de cima no resto.
      const { rodar } = comandosDaMaquina({ rodar: plano.rodar, instalar: plano.modpack?.instalar ?? null, porSistema: plano.porSistema }, ad.plataforma());
      comandoRodado = rodar;
      proc = await ad.rodar({ comando: rodar.comando, argumentos: rodar.argumentos, pasta: '' });
    } catch (erro) {
      await falha(i, 'rodar', erro, { comando: comandoRodado?.comando ?? null, ...dadosDoErro(erro) });
      await contar(i, 'desligado');
      return;
    }
    i.proc = proc;
    proc.aoLinha(linha => aoLinha(i, String(linha)));
    proc.aoSair(saida => { aoSair(i, saida); });
  }

  /** Espera uma linha que case, ou o prazo; resolve com true ou false. */
  function esperarLinha(i, fonte, prazo) {
    return new Promise(resolver => {
      const e = { re: new RegExp(fonte), resolver };
      i.esperas.push(e);
      ad.esperar(prazo * 1000).then(() => {
        if (i.esperas.includes(e)) {
          i.esperas = i.esperas.filter(x => x !== e);
          resolver(false);
        }
      });
    });
  }

  /** Um passo de console da receita: manda a linha e, se pedir, espera a resposta. */
  async function passoDeConsole(i, passo) {
    if (!i.proc) return false;
    const espera = passo.esperar ? esperarLinha(i, passo.esperar, passo.prazo ?? 60) : null;
    i.proc.escrever(passo.console + '\n');
    return espera ? espera : true;
  }

  async function desligar(i) {
    if (!i.proc) {
      await contar(i, 'desligado');
      return;
    }
    i.parando = true;
    await contar(i, 'parando');
    const passo = i.receita.saida.parar;
    const prazo = passo.prazo ?? 60;
    const proc = i.proc;
    const saiu = new Promise(resolver => { i.aoTerminar = resolver; });
    // O jogo sai sozinho depois do stop; o prazo é o da receita.
    proc.escrever(passo.console + '\n');
    const venceu = await Promise.race([saiu.then(() => false), ad.esperar(prazo * 1000).then(() => true)]);
    if (venceu && i.proc === proc) {
      await falha(i, 'parar', 'nao-parou-no-prazo', { prazo });
      proc.encerrar();
    }
  }

  async function salvar(i, opcoes = {}) {
    if (!i.proc) {
      await falha(i, 'salvar', 'servidor-desligado');
      return null;
    }
    const passos = i.receita.mundo.salvar;
    const ultimo = passos.at(-1);
    await contar(i, 'salvando');
    let falhou = null;
    let semCopia = null;
    let pacote = null;
    for (const passo of passos) {
      if (passo.copiar && !(opcoes.copiar && ad.empacotar)) {
        // Sem quem receba (sem reserva), o mundo foi salvo com segurança e
        // não há o que copiar. Dito, e não calado.
        semCopia = passo.copiar;
      } else if (passo.copiar) {
        // **A cópia, com o mundo parado de escrever** (parte 7): entre o
        // save-all flush e o save-on.
        try {
          // A pasta do mundo de agora (um mundo novo é outra pasta).
          pacote = await ad.empacotar(i.plano?.copia?.pasta ?? passo.copiar, PACOTE_DA_COPIA);
        } catch (erro) {
          falhou = { erro: fraseDoErro(erro), dados: { passo, ...dadosDoErro(erro) } };
          break;
        }
      } else {
        const ok = await passoDeConsole(i, passo);
        if (!ok) {
          falhou = { erro: i.proc ? 'o-jogo-nao-respondeu' : 'o-jogo-saiu', dados: { passo } };
          break;
        }
      }
    }
    if (falhou) {
      // O mundo não pode ficar sem salvar automático: o último passo de
      // console (o save-on) vai mesmo assim.
      if (ultimo.console && i.proc) i.proc.escrever(ultimo.console + '\n');
      await falha(i, opcoes.copiar ? 'copia' : 'salvar', falhou.erro, falhou.dados);
    } else if (semCopia && !opcoes.copiar) {
      await falha(i, 'salvar', 'sem-reserva-para-a-copia', { pasta: semCopia });
    }
    if (i.proc) await contar(i, 'ligado');
    return falhou ? null : pacote;
  }

  // ---- a cópia do mundo (parte 7) ----

  /** O sha256 do mundo que esta máquina tem (a cópia que abriu ou que fez), ou null. */
  async function marcaDoMundo() {
    try { return String(await ad.ler(MARCA_DO_MUNDO)).trim() || null; } catch { return null; }
  }

  /**
   * **A dona copia o mundo** para a outra máquina: o salvamento seguro com o
   * pacote no meio (ou, na passagem avisada, o jogo parado inteiro antes), a
   * oferta na porta do túnel da cópia, o túnel servido, e a metade de
   * servidor avisada, que avisa a outra. Toda falha vai à tela.
   */
  async function copiar(i, final) {
    const plano = await lerPlano(i);
    if (!plano || !plano.dona) return;
    const c = plano.copia;
    // Sem outra máquina aceita não há para quem copiar — e, sem reserva, a
    // oferta nem tem o túnel da cópia: a agendada não é falha.
    if (!final && !c?.comOutra) return;
    if (!c?.tunel) return falha(i, 'copia', 'sem-tunel-de-copia', {});
    let pacote;
    if (final || !i.proc) {
      // **A passagem avisada para o jogo antes**: o stop salva o mundo
      // inteiro, e nada do que se joga depois fica para trás.
      if (i.proc) await desligar(i);
      try {
        pacote = await ad.empacotar(c.pasta, PACOTE_DA_COPIA);
      } catch (erro) {
        return falha(i, 'copia', erro, { pasta: c.pasta, final, ...dadosDoErro(erro) });
      }
    } else {
      pacote = await salvar(i, { copiar: true });
      if (!pacote) return;
    }
    let oferta;
    try {
      oferta = await ad.oferecerCopia(PACOTE_DA_COPIA, c.tunel.porta);
    } catch (erro) {
      return falha(i, 'copia', erro, { porta: c.tunel.porta, ...dadosDoErro(erro) });
    }
    if (!i.tunelDaCopia) {
      try {
        i.tunelDaCopia = await ad.servirPorta({ nome: c.tunel.nome, protocolo: 'tcp', porta: c.tunel.porta });
      } catch (erro) {
        return falha(i, 'copia', erro, { tunel: c.tunel.nome, porta: c.tunel.porta, ...dadosDoErro(erro) });
      }
    }
    try { await ad.escrever(MARCA_DO_MUNDO, oferta.sha256 + '\n'); } catch { /* a marca é um atalho */ }
    const r = await ad.pedir({
      op: 'copia-pronta', codigo: oferta.codigo, sha256: oferta.sha256, tamanho: oferta.tamanho, final,
      arquivos: pacote.arquivos ?? null, bytes: pacote.bytes ?? null,
    });
    if (!r || r.ok !== true) await falha(i, 'copia', r?.erro ?? 'copia-recusada', dadosDoErro(r ?? {}));
  }

  /** **A cópia agendada**: de `intervalo` em `intervalo` minutos, enquanto o jogo roda e esta é a dona. */
  function agendarCopia(i) {
    const vez = ++i.vezDaCopia;
    const minutos = Number(i.plano?.copia?.intervalo) || 5;
    ad.esperar(minutos * 60000).then(() => {
      if (i.vezDaCopia !== vez || !i.proc || !i.dona) return;
      enfileirar(i, () => copiar(i, false));
      agendarCopia(i);
    });
  }

  /** **A outra máquina recebe a cópia** pelo túnel da dona, e diz que chegou. */
  async function receber(i, carga) {
    let chegou;
    try {
      chegou = await ad.receberCopia({ tunel: String(carga.tunel), codigo: String(carga.codigo), sha256: String(carga.sha256), tamanho: Number(carga.tamanho), destino: COPIA_RECEBIDA });
    } catch (erro) {
      return falha(i, 'receber-copia', erro, { tunel: carga.tunel, tamanho: carga.tamanho, sha256: carga.sha256, final: carga.final === true, ...dadosDoErro(erro) });
    }
    i.recebida = { sha256: chegou.sha256 };
    const r = await ad.pedir({ op: 'copia-recebida', sha256: chegou.sha256, final: carga.final === true, caminho: chegou.caminho ?? null, retomadas: chegou.retomadas ?? 0 });
    if (!r || r.ok !== true) await falha(i, 'receber-copia', r?.erro ?? 'recusada', dadosDoErro(r ?? {}));
  }

  /**
   * **Assumir** (a metade de servidor passou a posse a esta máquina): abre a
   * última cópia recebida no lugar do mundo, se ela é mais nova que o que
   * está aqui, e liga.
   */
  async function assumir(i) {
    const plano = await lerPlano(i);
    if (!plano) return;
    if (!plano.dona) return falha(i, 'assumir', 'nao-e-a-dona', {});
    const pasta = plano.copia?.pasta ?? 'world';
    const temAqui = await marcaDoMundo();
    // A metade que subiu de novo depois de receber (o app reaberto) não
    // lembra: o que ela recebeu, o plano diz.
    const recebida = i.recebida?.sha256 ?? plano.copia?.recebida ?? null;
    if (recebida && recebida !== temAqui) {
      try {
        await ad.desempacotar({ arquivo: COPIA_RECEBIDA, destino: pasta, raiz: pasta });
        await ad.escrever(MARCA_DO_MUNDO, recebida + '\n');
      } catch (erro) {
        return falha(i, 'assumir', erro, { arquivo: COPIA_RECEBIDA, pasta, ...dadosDoErro(erro) });
      }
    }
    await ligar(i);
  }

  /**
   * **A principal que voltou com o jogo de pé** e não é a dona: desliga, e
   * diz à metade de servidor, que conta e mostra. Nunca resolvido calado.
   */
  async function perdeuAPosse(i) {
    if (!i.proc) return;
    ad.registrar(`${i.servidor}: não é a dona, e o jogo estava de pé: desligando`);
    await desligar(i);
    try {
      await ad.pedir({ op: 'perdeu-a-posse', processoVivo: true });
    } catch (e) {
      ad.registrar(`${i.servidor}: a volta sem a posse não chegou à metade de servidor: ${fraseDoErro(e)}`);
    }
  }

  /**
   * **A volta de quem hospeda** (maquina.aoReconectar): sem ele a metade
   * seguiu rodando — a dona com o jogo de pé —, e o pedido igual ao aceito a
   * religou, sem subir de novo. Quem hospeda esqueceu o túnel dela; a posse
   * pode ter mudado enquanto ela estava fora (a reserva assumiu numa queda só
   * desta máquina). Ela pergunta o plano: sem a posse e com o jogo de pé,
   * desliga e diz (`perdeuAPosse`, em `lerPlano`); dona, serve de novo o
   * túnel do jogo, esquece o da cópia (servido de novo na próxima) e conta o
   * estado.
   */
  async function religar(i, volta) {
    const fora = Number(volta?.fora) || 0;
    ad.registrar(`${i.servidor}: religada depois de ${fora} s sem quem hospeda`);
    i.tunelDaCopia = null;
    const plano = await lerPlano(i);
    if (!plano) {
      // O aceite que o app mandou de novo ainda não chegou à metade de
      // servidor: o aviso que ela manda ao vê-lo (ligar ou preparar) religa.
      i.religarAoAceite = { fora };
      return;
    }
    i.religarAoAceite = null;
    if (!i.dona || !i.proc) return;
    // O jogo pronto (ligado) serve o túnel de novo, e também o que falhou
    // antes (revisão final, M12): sem isto, um túnel que falhou nunca voltava.
    // Antes do «Done», quem serve é o «pronto», como sempre.
    if ((i.tunel || i.estado === 'ligado') && plano.tunel) {
      const t = plano.tunel;
      try {
        i.tunel = await ad.servirPorta({ nome: t.nome, protocolo: t.protocolo, porta: t.porta });
      } catch (erro) {
        i.tunel = null;
        await falha(i, 'tunel', erro, { nome: t.nome, protocolo: t.protocolo, porta: t.porta, religada: true, ...dadosDoErro(erro) });
      }
    }
    await contar(i, i.estado, { religada: { fora } });
  }

  async function console_(i, comando) {
    if (!i.proc) {
      await falha(i, 'console', 'servidor-desligado', { comando });
      return;
    }
    i.proc.escrever(String(comando) + '\n');
  }

  async function configurar(i) {
    const plano = await lerPlano(i);
    if (!plano) return;
    try {
      await ad.escrever(plano.arquivoDeConfig, plano.propriedades);
    } catch (erro) {
      await falha(i, 'escrever', erro, dadosDoErro(erro));
    }
  }

  // ---- a fila: um passo por vez em cada servidor de jogo ----

  function enfileirar(i, passo) {
    i.fila = i.fila.then(passo).catch(erro => falha(i, 'interno', erro, dadosDoErro(erro)));
    return i.fila;
  }

  const OPERACOES = {
    preparar: i => preparar(i),
    ligar: i => ligar(i),
    desligar: i => desligar(i),
    salvar: i => salvar(i),
    configurar: i => configurar(i),
    // A reserva (parte 7).
    copia: (i, carga) => receber(i, carga),
    assumir: i => assumir(i),
    passar: i => copiar(i, true),
    console: (i, carga) => console_(i, carga.comando),
  };

  ad.aoAviso((servidor, carga) => {
    const i = instancia(String(servidor));
    i.avisado = true;
    const op = OPERACOES[carga?.op];
    if (!op) {
      falha(i, 'aviso', 'aviso-desconhecido', { op: carga?.op ?? null });
      return;
    }
    // **A religada que esperava o aceite**: o aviso que vem dele (ligar ou
    // preparar) termina a volta — perguntar a posse, servir de novo —, e não
    // sobe um jogo que já está de pé.
    if (i.religarAoAceite && (carga.op === 'ligar' || carga.op === 'preparar')) {
      const volta = i.religarAoAceite;
      i.religarAoAceite = null;
      enfileirar(i, () => religar(i, volta));
      return;
    }
    // Desligar e o console não esperam o que está na fila (um download longo).
    if (carga.op === 'console') op(i, carga).catch(erro => falha(i, 'console', erro));
    else enfileirar(i, () => op(i, carga));
  });


  // **A parada da metade** (DESLIGAR, REVOGAR, o app fechando, o MOD
  // desligado): o jogo recebe `stop` e tem o prazo do produto para salvar
  // (20 s com um processo vivo); depois disso o produto o encerra. Não passa
  // pela fila: um download longo não segura a parada.
  ad.aoParar?.(async motivo => {
    const parando = [];
    for (const i of instancias.values()) {
      if (!i.proc) continue;
      ad.registrar(`${i.servidor}: parada da metade (${motivo}): stop`);
      i.parando = true;
      const saiu = new Promise(resolver => { i.aoTerminar = resolver; });
      i.proc.escrever(i.receita.saida.parar.console + '\n');
      parando.push(Promise.race([saiu, ad.esperar(PRAZO_DA_PARADA_DA_METADE)]));
    }
    await Promise.all(parando);
  });

  // **A volta de quem hospeda**: cada servidor de jogo desta metade religa
  // na fila dele, depois do que já estava andando.
  ad.aoReconectar?.(volta => {
    for (const i of instancias.values()) enfileirar(i, () => religar(i, volta));
  });

  // **Ao subir, a máquina pergunta o plano**, em vez de esperar um aviso: o
  // aviso pode ter saído antes de esta metade estar de pé, e a metade de
  // servidor junta avisos seguidos no mais novo.
  if (ad.servidor) {
    const i = instancia(ad.servidor);
    enfileirar(i, async () => {
      const plano = await lerPlano(i);
      // Um aviso chegou enquanto o plano vinha: quem manda é ele.
      if (!plano || i.avisado) return;
      if (plano.ligar) await ligar(i);
      else await preparar(i);
    });
  }

  return { instancias };
}

// A partida: no executor, a metade de máquina sobe com o adaptador de
// verdade. Sem a API da máquina, `criarAdaptador` lança com o que falta, e o
// erro vai ao log do produto em vez de a metade ficar de pé sem fazer nada.
if (!globalThis.__testeSemPartida) criarMaquina(criarAdaptador(globalThis));
