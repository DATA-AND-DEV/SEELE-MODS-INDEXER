// ---- servidor.js: a metade de servidor ----
//
// Guarda a lista de servidores de jogo e a configuração de cada um, quem roda
// onde, e a regra de uma máquina por vez. Fala com a máquina pelo
// `mundo.maquinas` da API 8, e com as janelas pelo `mundo.avisar`.
//
// # Quem pode o quê
//
// Toda mudança é uma ação declarada no manifesto, e quem decide se a pessoa a
// tem é o anfitrião (os cargos), antes de chamar este código. Aqui só se
// confere que a ação que o **anfitrião** escreveu em `contexto.acao` é a da
// operação pedida: um pedido comum com o corpo falsificado não muda nada, e a
// ação de entrar no jogo não liga servidor nenhum.
//
// # Nada calado
//
// Toda recusa volta com o nome e com os dados (`{ ok: false, erro, ... }`), e
// toda falha que acontece longe de quem pediu — a recusa da máquina, o hash
// que não bateu, o jogo que caiu — fica no servidor de jogo, em `falhas`, que
// a tela mostra, e no log de quem hospeda.

const TETO_DE_SERVIDORES = 8;
const TETO_DE_FALHAS = 6;
const TETO_DE_LINHAS = 8;
const VALIDADE_DAS_VERSOES = 3600;
/** O teto de `mundo.buscarPack` (o de `mundo.buscar`): um pack maior vai pelo envio. */
const TETO_DO_PACK_PELO_LINK = 4 * 1024 * 1024;
/** Quanto uma espera de envio do pack vale, em segundos (o teto do produto é 600). */
const PRAZO_DO_ENVIO = 600;
/** De quantos em quantos minutos a dona copia o mundo para a outra máquina (parte 7; o padrão da spec). */
const INTERVALO_DA_COPIA = 5;
const INTERVALO_DA_COPIA_MINIMO = 1;
const INTERVALO_DA_COPIA_MAXIMO = 60;
const PAPEIS = Object.freeze(['principal', 'reserva']);
const outroPapel = papel => (papel === 'reserva' ? 'principal' : 'reserva');

/** A ação que cada operação de mudança pede. As outras são leitura. */
const ACAO_DA_OP = Object.freeze({
  criar: 'criar-servidor-de-jogo',
  apagar: 'criar-servidor-de-jogo',
  configurar: 'configurar-servidor-de-jogo',
  console: 'configurar-servidor-de-jogo',
  // O modpack (parte 6): escolher o pack muda o que roda, como a versão.
  'pack-link': 'configurar-servidor-de-jogo',
  'pack-enviar': 'configurar-servidor-de-jogo',
  'pack-chegou': 'configurar-servidor-de-jogo',
  ligar: 'ligar-desligar-servidor-de-jogo',
  desligar: 'ligar-desligar-servidor-de-jogo',
  // A passagem avisada à outra máquina (parte 7) é ligar numa e desligar na outra.
  passar: 'ligar-desligar-servidor-de-jogo',
});

/** Os estados em que o processo do jogo está de pé, ou a caminho. */
const RODANDO = new Set(['ligando', 'ligado', 'parando', 'salvando']);
const ESTADOS_DA_MAQUINA = new Set(['desligado', 'baixando', 'instalando', 'pronto', 'ligando', 'ligado', 'parando', 'salvando', 'caiu']);

// ---------------------------------------------------------------- o quintal

function lerServidores() {
  const lido = lerJson(dados.servidores);
  return lido && typeof lido === 'object' ? lido : {};
}

function gravarServidores(servidores) {
  dados.servidores = JSON.stringify(servidores);
  dados.revisao = String(Number(dados.revisao ?? '0') + 1);
  mundo.avisar({ carga: { revisao: Number(dados.revisao) } });
}

/** Uma falha no servidor de jogo, que a tela mostra com os dados, e no log. */
function anotarFalha(s, onde, erro, extra = {}) {
  const falha = { quando: mundo.agora(), onde, ...extra, erro: String(erro) };
  s.falhas = [...(s.falhas ?? []), falha].slice(-TETO_DE_FALHAS);
  mundo.registrar(`${s.id}: ${onde}: ${erro} ${JSON.stringify(extra)}`);
}

/** O que a tela de cada pessoa recebe de um servidor de jogo. */
function publico(s) {
  const receita = receitaPorId(s.receita);
  return {
    id: s.id,
    receita: s.receita,
    variante: s.variante,
    versao: s.versao,
    config: s.config,
    quem: s.quem,
    porta: s.porta,
    aceite: s.aceite,
    motivo: s.motivo ?? null,
    ligar: s.ligar,
    estado: s.estado,
    progresso: s.progresso ?? null,
    jogadores: s.jogadores ?? [],
    maximo: s.config?.maximo ?? null,
    falhas: s.falhas ?? [],
    linhas: s.linhas ?? [],
    precisaReiniciar: Boolean(s.precisaReiniciar),
    semJava: s.resolvido?.semJava ?? [],
    substituidas: s.resolvido?.substituidas ?? {},
    disco: s.oferta ? s.oferta.disco_maximo : null,
    protocolo: receita?.rede.protocolo ?? 'tcp',
    pack: s.pack ? publicoDoPack(s.pack) : null,
    // A reserva (parte 7): quem é, o aceite dela, quem é a dona agora, a
    // última cópia, o que a outra máquina tem, e o tempo de jogo perdido.
    reserva: s.reserva ? { quem: s.reserva.quem, aceite: s.reserva.aceite, motivo: s.reserva.motivo ?? null, estado: s.reserva.estado ?? null } : null,
    dona: donaDe(s),
    quemEADona: quemOpera(s, donaDe(s)),
    intervaloDaCopia: s.intervaloDaCopia ?? INTERVALO_DA_COPIA,
    copia: s.copia ? { quando: s.copia.quando, tamanho: s.copia.tamanho, de: s.copia.de, sha256: s.copia.sha256 } : null,
    copiaRecebida: s.copiaRecebida ? { quando: s.copiaRecebida.quando, sha256: s.copiaRecebida.sha256, por: s.copiaRecebida.por } : null,
    perdido: s.perdido ?? null,
    passando: s.passando ?? null,
    voltouRodando: s.voltouRodando ?? 0,
    // Sem quem hospeda: a dona seguiu rodando e foi religada sem desligar.
    religada: s.religada ?? null,
    // O servidor SEELE subiu de novo e esta metade chamou as máquinas de volta.
    chamando: s.chamando ?? null,
    // A versão que rodou este mundo por último, e a pasta dele.
    versaoDoMundo: versaoDoMundo(s),
    mundo: s.mundo ?? null,
  };
}

// ---------------------------------------------------------------- a reserva (parte 7)

/** Quem é a dona agora: o papel. Sem reserva, sempre a principal. */
function donaDe(s) {
  return s.dona === 'reserva' && s.reserva ? 'reserva' : 'principal';
}

/** Quem opera um papel: a pessoa, ou null. */
function quemOpera(s, papel) {
  return papel === 'reserva' ? (s.reserva?.quem ?? null) : s.quem;
}

/** O aceite de um papel. */
function aceiteDe(s, papel) {
  return papel === 'reserva' ? (s.reserva?.aceite ?? 'sem-maquina') : s.aceite;
}

function marcarAceite(s, papel, aceite, motivo = null) {
  if (papel === 'reserva') {
    if (!s.reserva) return;
    s.reserva.aceite = aceite;
    s.reserva.motivo = motivo;
  } else {
    s.aceite = aceite;
    s.motivo = motivo;
  }
}

/** O papel de quem fala, pelo contexto que o produto escreve, conferido contra quem opera. */
function papelDe(s, contexto) {
  const dito = contexto.maquina?.papel;
  const papel = PAPEIS.includes(dito) ? dito : (contexto.person === s.quem ? 'principal' : contexto.person === s.reserva?.quem ? 'reserva' : null);
  return papel && quemOpera(s, papel) === contexto.person ? papel : null;
}

/** **A posse no produto**: só a dona serve o túnel. Dita a cada mudança, e a cada pedido (um servidor que reinicia volta à principal). */
function declararADona(s) {
  mundo.maquinas.dona({ servidor: s.id, papel: donaDe(s) });
}

/**
 * **A posse passa** a `papel`: o produto para os túneis da dona de antes, a
 * nova ouve «assuma» e a de antes ouve «desligue». `perdido` é o tempo de
 * jogo que se perdeu (a queda de surpresa), ou null (a passagem avisada).
 */
function passarAPosse(s, papel, perdido) {
  const antes = donaDe(s);
  s.dona = papel;
  s.passando = null;
  declararADona(s);
  mundo.maquinas.avisar({ servidor: s.id, papel, carga: { op: 'assumir', perdido: perdido?.segundos ?? null } });
  mundo.maquinas.avisar({ servidor: s.id, papel: antes, carga: { op: 'desligar' } });
  if (perdido) s.perdido = perdido;
  mundo.registrar(`${s.id}: a posse passou de ${antes} para ${papel}${perdido ? `; perderam-se ${perdido.segundos} s de jogo` : ''}`);
}

/** O que a tela mostra do pack: o resumo, de onde veio, o hash e o tamanho. */
function publicoDoPack(p) {
  return {
    origem: p.origem, link: p.link ?? null, pagina: p.pagina ?? null, sha512: p.sha512, bytes: p.bytes,
    ...p.resumo, instalador: p.instalador ? { nome: p.instalador.nome, tamanho: p.instalador.tamanho } : null,
  };
}

// ---------------------------------------------------------------- a oferta

/** A porta do jogo na máquina de `quem`: a padrão, ou a primeira livre depois dela. */
function portaPara(servidores, s, quem) {
  const receita = receitaPorId(s.receita);
  // As portas que os outros servidores de jogo já tomam nesta máquina, como
  // principal ou como reserva (parte 7).
  const tomadas = new Set(Object.values(servidores).flatMap(o => (o.id === s.id ? [] : [
    o.quem === quem ? o.porta : null,
    o.reserva?.quem === quem ? o.reserva.porta : null,
  ])).filter(Boolean));
  let porta = receita.rede.portaPadrao;
  while (tomadas.has(porta)) porta++;
  return porta;
}

/** Monta a oferta da versão e da máquina escolhidas, e chama a pessoa (a principal, ou a reserva). */
function pedirAMaquina(servidores, s, papel = 'principal') {
  const receita = receitaPorId(s.receita);
  const comMods = s.variante === 'com-mods';
  if (comMods && !s.pack) {
    s.aceite = 'sem-pack';
    return { ok: true };
  }
  if (!s.resolvido || s.resolvido.versao !== s.versao) {
    const resolvido = resolverVersao(receita, s.versao, url => mundo.buscar(url));
    if (!resolvido.ok) return resolvido;
    s.resolvido = resolvido;
  }
  const quem = quemOpera(s, papel);
  if (!quem) return { ok: true };
  const porta = portaPara(servidores, s, quem);
  // O túnel da cópia só com reserva (e2e da API 8, 31/10): sem ela, o aceite
  // mostrava um túnel que nada usa.
  const args = { servidor: s.id, versao: s.versao, porta, comCopia: Boolean(s.reserva) };
  const oferta = comMods ? montarOfertaComMods(receita, args, s.resolvido, s.pack) : montarOferta(receita, args, s.resolvido);
  try {
    mundo.maquinas.pedir({ quem, servidor: s.id, papel, oferta });
    declararADona(s);
  } catch (erro) {
    return { ok: false, erro: 'oferta-recusada', porque: fraseDoErro(erro) };
  }
  if (papel === 'reserva') {
    s.reserva.porta = porta;
    s.reserva.oferta = oferta;
  } else {
    s.porta = porta;
    s.oferta = oferta;
  }
  marcarAceite(s, papel, 'esperando');
  return { ok: true };
}

/** Pede de novo as duas máquinas (a versão, o pack ou a configuração do que roda mudaram). */
function pedirAsDuas(servidores, s) {
  const r = pedirAMaquina(servidores, s, 'principal');
  if (!r.ok) return r;
  return s.reserva ? pedirAMaquina(servidores, s, 'reserva') : r;
}

// ---------------------------------------------------------------- o servidor SEELE que sobe

/**
 * **Chama de volta a máquina de um papel** com a oferta que ela aceitou —
 * igual, para o app religar a metade de máquina que seguiu rodando sem quem
 * hospeda (S2 do SEELE) em vez de subir outra —, e diz a dona de novo (a
 * posse mora na memória do servidor, que nasceu na principal).
 */
function chamarDeVolta(servidores, s, papel) {
  const quem = quemOpera(s, papel);
  const { oferta } = daOfertaDe(s, papel);
  if (!oferta) return pedirAMaquina(servidores, s, papel);
  try {
    declararADona(s);
    mundo.maquinas.pedir({ quem, servidor: s.id, papel, oferta });
  } catch (erro) {
    return { ok: false, erro: 'oferta-recusada', porque: fraseDoErro(erro) };
  }
  marcarAceite(s, papel, 'esperando');
  return { ok: true };
}

/**
 * **A metade de servidor subiu** (`MetadeSubiu`, API 8): o servidor SEELE
 * reiniciou, ou o código desta metade mudou. O quintal guardou quem rodava,
 * e `maquinas` é o que o livro do servidor tem agora — vazio num servidor que
 * reiniciou. Cada papel que o quintal diz aceito (ou esperando) e que o livro
 * não tem é chamado de volta; até ele responder, o cartão diz «esperando a
 * máquina», e nunca «ligado». Sem isto, o cartão ficava LIGADO sem jogo em
 * lugar nenhum, DESLIGAR ia só ao seele.log, PASSAR ficava «passando» para
 * sempre e trocar a máquina era recusado (e2e da API 8, passo 16).
 */
function metadeSubiu(carga) {
  const servidores = lerServidores();
  const lugares = Array.isArray(carga.maquinas) ? carga.maquinas : [];
  const noLivro = (s, papel, quem, aceito) => lugares.some(m => m.servidor === s.id && m.papel === papel && String(m.pessoa) === quem && (!aceito || m.aceita === true));
  let mudou = false;
  for (const s of Object.values(servidores)) {
    let chamou = false;
    for (const papel of PAPEIS) {
      const quem = quemOpera(s, papel);
      const aceite = aceiteDe(s, papel);
      // A que caiu (saiu) também: o servidor que para derruba a conexão de
      // todos, e o MOD ouve MaquinaParou com saiu antes de ele descer.
      const caiu = aceite === 'parado' && QUEDAS.includes(papel === 'reserva' ? s.reserva?.motivo : s.motivo);
      if (!quem || !(['aceito', 'esperando', 'fora'].includes(aceite) || caiu)) continue;
      if (noLivro(s, papel, quem, aceite === 'aceito')) continue;
      const r = chamarDeVolta(servidores, s, papel);
      if (!r.ok) {
        marcarAceite(s, papel, 'parado', r.erro);
        anotarFalha(s, 'aceite', r.erro, { papel, momento: 'chamada', dados: { pessoa: quem } });
      }
      if (papel === 'reserva' && s.reserva) s.reserva.estado = null;
      chamou = true;
    }
    if (!chamou) continue;
    mudou = true;
    s.chamando = { quando: mundo.agora(), motivo: String(carga.motivo ?? '') };
    // Uma passagem em curso não sobrevive: as duas máquinas estão sendo chamadas.
    if (s.passando) {
      anotarFalha(s, 'reserva', 'passagem-interrompida', { papel: s.passando.para, dados: {} });
      s.passando = null;
    }
    // O que a dona contou antes não vale mais: quem diz agora é ela, ao voltar.
    if (s.estado !== 'desligado') s.estado = s.ligar ? 'esperando-maquina' : 'desligado';
    s.jogadores = [];
    mundo.registrar(`${s.id}: a metade de servidor subiu (${carga.motivo ?? '?'}); chamando as máquinas de volta`);
  }
  if (mudou) gravarServidores(servidores);
}

// ---------------------------------------------------------------- a versão do mundo

/**
 * A versão que rodou o mundo por último: a que a dona contou ligada. Num
 * servidor de antes disto, a da última oferta que uma máquina aceitou.
 */
function versaoDoMundo(s) {
  return s.versaoDoMundo ?? (s.oferta?.versao_do_jogo ?? null);
}

/** Os números de uma versão (`1.21.4`, `26.3`, `1.21.5-pre1`), ou null se não é uma versão numerada. */
function numerosDaVersao(v) {
  const m = /^([0-9]+(?:\.[0-9]+)*)/.exec(String(v ?? ''));
  return m ? m[1].split('.').map(Number) : null;
}

/** `a` é mais velha que `b`? null quando não dá para comparar (um snapshot). */
function maisVelha(a, b) {
  const x = numerosDaVersao(a);
  const y = numerosDaVersao(b);
  if (!x || !y) return null;
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const d = (x[i] ?? 0) - (y[i] ?? 0);
    if (d) return d < 0;
  }
  return false;
}

/**
 * **Um mundo não volta para uma versão mais velha** (e2e da API 8, passo 18:
 * o Fabric 1.21.4 caiu ao abrir o mundo do 26.3). Trocar para uma versão mais
 * velha que a que rodou o mundo pede uma escolha: `mundo: 'novo'` começa outro
 * mundo (o de antes fica na máquina, na pasta dele); sem ela, a recusa diz as
 * duas versões, e a tela oferece começar um mundo novo ou manter a versão.
 */
function conferirAVersaoDoMundo(s, versao, escolha) {
  const doMundo = versaoDoMundo(s);
  if (!versao || !doMundo || versao === doMundo || maisVelha(versao, doMundo) !== true) return { ok: true };
  if (escolha === 'novo') return { ok: true, novo: true };
  return { ok: false, erro: 'mundo-mais-novo', mundo: doMundo, pedida: versao };
}

/** Começa um mundo novo: outra pasta (o `level-name`), e o de antes fica na máquina. */
function comecarMundoNovo(s, receita) {
  const n = (s.mundos ?? 1) + 1;
  s.mundos = n;
  s.mundo = `${receita.mundo.pasta}-${n}`;
  s.versaoDoMundo = null;
  s.copia = null;
  s.copiaRecebida = null;
  mundo.registrar(`${s.id}: mundo novo em ${s.mundo}`);
}

// ---------------------------------------------------------------- as operações

function opEstado(contexto) {
  const servidores = lerServidores();
  return {
    ok: true,
    revisao: Number(dados.revisao ?? '0'),
    receitas: RECEITAS.map(r => {
      const v = validarReceita(r);
      return { id: r.id, nome: r.nome, edicao: r.edicao ?? '', icone: r.icone, descricao: r.descricao, versao: r.versao, valida: v.ok, erros: v.erros.slice(0, 4) };
    }),
    servidores: Object.values(servidores).map(publico),
    podem: Array.isArray(contexto.permissoes) ? contexto.permissoes : [],
  };
}

function opVersoes(pedido) {
  const receita = receitaPorId(pedido.receita);
  if (!receita) return { ok: false, erro: 'receita-desconhecida', receita: pedido.receita ?? null };
  const cache = lerJson(dados['versoes:' + receita.id]);
  if (cache && mundo.agora() - cache.quando < VALIDADE_DAS_VERSOES) return { ok: true, versoes: cache.versoes };
  const r = listarVersoes(receita, url => mundo.buscar(url));
  if (!r.ok) return r;
  const versoes = r.versoes.map(v => v.id);
  dados['versoes:' + receita.id] = JSON.stringify({ quando: mundo.agora(), versoes });
  return { ok: true, versoes };
}

function opCriar(pedido, contexto) {
  const receita = receitaPorId(pedido.receita);
  if (!receita) return { ok: false, erro: 'receita-desconhecida', receita: pedido.receita ?? null };
  const valida = validarReceita(receita);
  if (!valida.ok) return { ok: false, erro: 'receita-invalida', receita: receita.id, erros: valida.erros.slice(0, 4) };
  const servidores = lerServidores();
  if (Object.keys(servidores).length >= TETO_DE_SERVIDORES) return { ok: false, erro: 'servidores-demais', teto: TETO_DE_SERVIDORES };
  const contador = lerJson(dados.contadores) ?? {};
  let n = contador[receita.id] ?? 0;
  let id;
  do { id = `${receita.id}-${++n}`; } while (servidores[id]);
  contador[receita.id] = n;
  dados.contadores = JSON.stringify(contador);
  // **O nome padrão se distingue** (e2e da API 8, 31/10: três cartões
  // «Servidor do SEELE»): o nome do jogo e o número do servidor de jogo.
  const config = configPadrao(receita);
  const campoDoNome = receita.configuracao.campos.find(c => c.chave === 'nome');
  if (campoDoNome?.forma === 'segmentos') config.nome = [{ texto: `${receita.nome} ${n}`, cor: campoDoNome.padrao[0]?.cor ?? null }];
  else if (campoDoNome?.forma === 'texto') config.nome = `${receita.nome} ${n}`;
  const s = {
    id, receita: receita.id, variante: 'vanilla', versao: null, config,
    quem: null, porta: null, aceite: 'sem-maquina', motivo: null, ligar: false, estado: 'desligado',
    jogadores: [], falhas: [], linhas: [], criadoPor: contexto.person,
  };
  servidores[id] = s;
  gravarServidores(servidores);
  return { ok: true, servidor: publico(s) };
}

function opApagar(s, servidores) {
  if (RODANDO.has(s.estado)) return { ok: false, erro: 'desligue-antes', estado: s.estado };
  if (s.pack?.caminho) volume.apagar(s.pack.caminho);
  delete servidores[s.id];
  gravarServidores(servidores);
  return { ok: true };
}

function opConfigurar(s, servidores, pedido) {
  const receita = receitaPorId(s.receita);
  const variante = pedido.variante !== undefined ? pedido.variante : (s.variante ?? 'vanilla');
  const v = receita.variantes[variante];
  if (!v || v.disponivel === false || (variante === 'com-mods' && !receita.modpack)) {
    return { ok: false, erro: 'variante-indisponivel', variante, porque: v?.porque ?? null };
  }
  let config = s.config;
  if (pedido.config !== undefined) {
    const r = validarConfig(receita, pedido.config, s.config);
    if (Object.keys(r.erros).length) return { ok: false, erro: 'config-invalida', erros: r.erros };
    config = r.config;
  }
  // Com mods, a versão é a que o pack pede, e não a que a tela manda.
  const versao = variante === 'com-mods'
    ? (s.pack?.mc ?? null)
    : pedido.versao !== undefined ? (pedido.versao === null ? null : String(pedido.versao)) : (s.variante === 'com-mods' ? null : s.versao);
  const quem = pedido.quem !== undefined ? (pedido.quem === null ? null : String(pedido.quem)) : s.quem;
  if (quem !== null && !/^[1-9][0-9]*$/.test(quem)) return { ok: false, erro: 'quem-invalido', quem };
  // A reserva (parte 7): outra pessoa, que aceita na máquina dela.
  const reserva = pedido.reserva !== undefined ? (pedido.reserva === null ? null : String(pedido.reserva)) : (s.reserva?.quem ?? null);
  if (reserva !== null && !/^[1-9][0-9]*$/.test(reserva)) return { ok: false, erro: 'quem-invalido', quem: reserva };
  if (reserva !== null && reserva === quem) return { ok: false, erro: 'mesma-pessoa-nas-duas', quem };
  let intervalo = s.intervaloDaCopia ?? INTERVALO_DA_COPIA;
  if (pedido.intervaloDaCopia !== undefined) {
    const n = Number(pedido.intervaloDaCopia);
    if (!Number.isInteger(n) || n < INTERVALO_DA_COPIA_MINIMO || n > INTERVALO_DA_COPIA_MAXIMO) {
      return { ok: false, erro: 'intervalo-invalido', minimo: INTERVALO_DA_COPIA_MINIMO, maximo: INTERVALO_DA_COPIA_MAXIMO };
    }
    intervalo = n;
  }
  const mudaAReserva = reserva !== (s.reserva?.quem ?? null);
  // Pôr ou tirar a reserva muda a oferta da principal (o túnel da cópia).
  const mudaOQueRoda = versao !== s.versao || quem !== s.quem || variante !== (s.variante ?? 'vanilla') || (mudaAReserva && (reserva === null) !== (s.reserva == null));
  if (mudaOQueRoda && RODANDO.has(s.estado)) return { ok: false, erro: 'desligue-antes', estado: s.estado };
  const versaoDoMundoOk = versao !== s.versao ? conferirAVersaoDoMundo(s, versao, pedido.mundo) : { ok: true };
  if (!versaoDoMundoOk.ok) return versaoDoMundoOk;
  // A dona não sai de baixo de si mesma: trocar a reserva que é a dona pede passar antes.
  if (mudaAReserva && donaDe(s) === 'reserva') return { ok: false, erro: 'passe-antes', dona: 'reserva' };
  if (mudaOQueRoda && donaDe(s) === 'reserva' && quem !== s.quem) return { ok: false, erro: 'passe-antes', dona: 'reserva' };

  const configMudou = JSON.stringify(config) !== JSON.stringify(s.config);
  if (versaoDoMundoOk.novo) comecarMundoNovo(s, receita);
  s.config = config;
  s.versao = versao;
  s.quem = quem;
  s.variante = variante;
  s.intervaloDaCopia = intervalo;
  if (mudaAReserva) {
    s.reserva = reserva === null ? null : { quem: reserva, aceite: 'sem-maquina', motivo: null, porta: null, oferta: null, estado: null };
    s.copiaRecebida = null;
  }
  const papeis = [...(mudaOQueRoda ? ['principal'] : []), ...((mudaOQueRoda || mudaAReserva) && s.reserva ? ['reserva'] : [])];
  for (const papel of papeis) {
    if (quemOpera(s, papel) === null) {
      marcarAceite(s, papel, 'sem-maquina');
      if (papel === 'principal') { s.porta = null; s.oferta = null; }
    } else if (variante === 'com-mods' && !s.pack) {
      marcarAceite(s, papel, 'sem-pack');
    } else if (versao === null) {
      marcarAceite(s, papel, 'sem-versao');
    } else {
      const r = pedirAMaquina(servidores, s, papel);
      if (!r.ok) return r;
    }
  }
  if (configMudou && !mudaOQueRoda && aceiteDe(s, donaDe(s)) === 'aceito') {
    if (RODANDO.has(s.estado)) s.precisaReiniciar = true;
    avisarADona(s, { op: 'configurar' });
  }
  gravarServidores(servidores);
  return { ok: true, servidor: publico(s) };
}

/** Um aviso à máquina que é a dona agora (a principal, sem reserva). */
function avisarADona(s, carga) {
  mundo.maquinas.avisar({ servidor: s.id, papel: donaDe(s), carga });
}

function opLigar(s, servidores) {
  if (s.variante === 'com-mods' && !s.pack) return { ok: false, erro: 'sem-pack' };
  if (!s.versao) return { ok: false, erro: 'sem-versao' };
  const dona = donaDe(s);
  if (!quemOpera(s, dona)) return { ok: false, erro: 'sem-maquina' };
  s.ligar = true;
  let esperando = null;
  const aceite = aceiteDe(s, dona);
  if (aceite === 'aceito') {
    avisarADona(s, { op: 'ligar' });
  } else if (aceite === 'esperando') {
    esperando = 'aceite';
  } else {
    // Parada, revogada ou recusada: ligar de novo é perguntar de novo.
    const r = pedirAMaquina(servidores, s, dona);
    if (!r.ok) return r;
    esperando = 'aceite';
  }
  gravarServidores(servidores);
  return { ok: true, ...(esperando ? { esperando } : {}), servidor: publico(s) };
}

function opDesligar(s, servidores) {
  s.ligar = false;
  const dona = donaDe(s);
  let semMaquina = null;
  if (aceiteDe(s, dona) === 'aceito') {
    avisarADona(s, { op: 'desligar' });
  } else if (!['desligado', 'caiu'].includes(s.estado) || s.chamando) {
    // **Ninguém no servidor SEELE para ouvir o «desligar»** (a máquina não
    // respondeu ainda): a ordem fica no plano. A máquina que voltar pergunta
    // o plano e desliga; a que não voltar para sozinha em até 10 min sem
    // quem hospeda. A resposta diz isso, em vez de nada.
    semMaquina = { papel: dona, quem: quemOpera(s, dona) };
    s.estado = 'desligado';
    s.jogadores = [];
  }
  gravarServidores(servidores);
  return { ok: true, ...(semMaquina ? { semMaquina } : {}), servidor: publico(s) };
}

/**
 * **A passagem avisada** (parte 7): a dona para o jogo (que salva o mundo
 * inteiro), empacota e manda a cópia final; quando a outra máquina diz que a
 * recebeu igual, a posse passa — ela liga, e a de antes desliga. Nada se
 * perde; quem joga reconecta no mesmo `localhost:<porta>`.
 */
function opPassar(s, servidores) {
  const de = donaDe(s);
  const para = outroPapel(de);
  if (!s.reserva) return { ok: false, erro: 'sem-reserva' };
  if (aceiteDe(s, de) !== 'aceito' && s.chamando) return { ok: false, erro: 'esperando-as-maquinas', papel: de, aceite: aceiteDe(s, de) };
  if (aceiteDe(s, para) !== 'aceito') return { ok: false, erro: 'outra-sem-aceite', papel: para, aceite: aceiteDe(s, para) };
  if (s.passando) return { ok: false, erro: 'ja-passando', para: s.passando.para };
  s.passando = { para, desde: mundo.agora() };
  if (aceiteDe(s, de) === 'aceito') {
    avisarADona(s, { op: 'passar' });
  } else if (s.copia && s.copiaRecebida?.sha256 === s.copia.sha256) {
    // A dona não está aí, e a outra já tem a última cópia: passa agora.
    passarAPosse(s, para, null);
  } else {
    s.passando = null;
    return { ok: false, erro: 'dona-fora-e-sem-copia', papel: de };
  }
  gravarServidores(servidores);
  return { ok: true, servidor: publico(s) };
}

function opConsole(s, pedido) {
  const comando = pedido.comando;
  if (typeof comando !== 'string' || comando.trim() === '' || /[\u0000-\u001f\u007f]/.test(comando) || bytesDe(comando) > 256) {
    return { ok: false, erro: 'comando-invalido' };
  }
  if (s.estado !== 'ligado') return { ok: false, erro: 'servidor-desligado', estado: s.estado };
  avisarADona(s, { op: 'console', comando });
  return { ok: true };
}

// ---------------------------------------------------------------- o modpack

/**
 * **O pack lido vira o pack do servidor de jogo** (pelo link ou pelo envio):
 * o índice conferido pelas regras da spec, o instalador do loader que ele
 * pede, e a variante e a versão que ele define. Se já há máquina, pede o
 * aceite de novo: o pack, o loader e os comandos mudaram o que roda.
 */
function usarPack(s, servidores, pack, texto, escolha) {
  const receita = receitaPorId(s.receita);
  const lido = lerIndice(texto, receita);
  if (!lido.ok) return lido;
  const indice = lido.indice;
  const doMundo = indice.mc !== s.versao ? conferirAVersaoDoMundo(s, indice.mc, escolha) : { ok: true };
  if (!doMundo.ok) return doMundo;
  let instalador = null;
  if (indice.loader) {
    const r = instaladorDoLoader(receita, indice.loader, indice.mc, url => mundo.buscar(url));
    if (!r.ok) return r;
    instalador = r.artefato;
  }
  const antes = s.pack;
  s.pack = { ...pack, mc: indice.mc, loader: indice.loader, instalador, resumo: resumoDoIndice(indice) };
  if (antes?.caminho && antes.caminho !== s.pack.caminho) volume.apagar(antes.caminho);
  if (doMundo.novo) comecarMundoNovo(s, receita);
  s.variante = 'com-mods';
  s.versao = indice.mc;
  s.resolvido = s.resolvido?.versao === indice.mc ? s.resolvido : null;
  if (s.quem) {
    const r = pedirAsDuas(servidores, s);
    if (!r.ok) return r;
  }
  gravarServidores(servidores);
  return { ok: true, servidor: publico(s) };
}

/** O pack pelo link do Modrinth: a API dá o .mrpack e o sha512; o produto o abre. */
function opPackLink(s, servidores, pedido) {
  if (RODANDO.has(s.estado)) return { ok: false, erro: 'desligue-antes', estado: s.estado };
  const receita = receitaPorId(s.receita);
  if (!receita.modpack) return { ok: false, erro: 'variante-indisponivel', variante: 'com-mods' };
  const link = lerLinkDoModrinth(pedido.link);
  if (!link.ok) return link;
  const url = `${receita.modpack.api}/project/${link.slug}/version`;
  const lido = buscarJson(url => mundo.buscar(url), url);
  if (!lido.ok) return lido;
  const escolhida = escolherVersaoDoModrinth(lido.json, link.versao, receita);
  if (!escolhida.ok) return escolhida;
  const arquivo = escolhida.arquivo;
  if (arquivo.tamanho > TETO_DO_PACK_PELO_LINK) {
    return { ok: false, erro: 'pack-grande-para-o-link', tamanho: arquivo.tamanho, teto: TETO_DO_PACK_PELO_LINK };
  }
  const r = mundo.buscarPack({ url: arquivo.url, sha512: arquivo.sha512, tamanho: arquivo.tamanho });
  if (!r || r.ok !== true) return { ...(r ?? {}), ok: false, erro: r?.erro ?? 'busca-falhou', url: arquivo.url };
  return usarPack(s, servidores, {
    origem: 'link', link: `${receita.modpack.pagina}${link.slug}`, pagina: `${receita.modpack.pagina}${link.slug}/version/${escolhida.versao.id}`,
    url: arquivo.url, sha512: r.sha512, bytes: r.bytes, versaoDoModrinth: escolhida.versao.id,
  }, r.indice, pedido.mundo);
}

/** O envio do .mrpack: a espera no volume (o produto confere os bytes e o teto de 64 MiB). */
function opPackEnviar(s) {
  if (RODANDO.has(s.estado)) return { ok: false, erro: 'desligue-antes', estado: s.estado };
  const receita = receitaPorId(s.receita);
  if (!receita.modpack) return { ok: false, erro: 'variante-indisponivel', variante: 'com-mods' };
  const n = Number(dados.envios ?? '0') + 1;
  dados.envios = String(n);
  const token = `${s.id}-${mundo.agora()}-${n}`;
  const caminho = `packs/${s.id}/${token}.mrpack`;
  if (!volume.esperar(token, caminho, ['mrpack'], PRAZO_DO_ENVIO)) return { ok: false, erro: 'espera-recusada' };
  dados['envio:' + token] = JSON.stringify({ id: s.id, caminho });
  return { ok: true, token, teto: receita.modpack.teto };
}

/** O envio chegou: o produto abre o pack do volume, e ele vira o pack do servidor. */
function opPackChegou(s, servidores, pedido) {
  const envio = lerJson(dados['envio:' + String(pedido.token ?? '')]);
  if (!envio || envio.id !== s.id) return { ok: false, erro: 'envio-desconhecido', token: pedido.token ?? null };
  delete dados['envio:' + pedido.token];
  // Manter a versão: o pack que chegou não é usado, e sai do volume.
  if (pedido.mundo === 'manter') {
    volume.apagar(envio.caminho);
    return { ok: true, descartado: true, servidor: publico(s) };
  }
  const r = volume.pack(envio.caminho);
  if (!r || r.ok !== true) {
    volume.apagar(envio.caminho);
    return { ok: false, ...(r ?? {}), erro: r?.erro ?? 'pack-nao-chegou' };
  }
  const usado = usarPack(s, servidores, { origem: 'enviado', caminho: envio.caminho, sha512: r.sha512, bytes: r.bytes }, r.indice, pedido.mundo);
  if (!usado.ok && usado.erro === 'mundo-mais-novo') {
    // **O pack fica esperando a escolha** (um mundo novo, ou manter a
    // versão): enviar de novo 64 MiB por uma pergunta seria o custo errado.
    dados['envio:' + pedido.token] = JSON.stringify(envio);
    return { ...usado, token: pedido.token };
  }
  if (!usado.ok) volume.apagar(envio.caminho);
  return usado;
}

/** **O pack para quem pede** (quem joga, pelo `SeeleUI.salvar`, e a máquina, pelo `trazer`): o caminho no volume. */
function opPackLer(pedido) {
  const s = lerServidores()[pedido.id];
  if (!s) return { ok: false, erro: 'servidor-desconhecido', servidor: pedido.id ?? null };
  if (s.pack?.origem !== 'enviado') return { ok: false, erro: 'sem-pack-enviado' };
  const caminho = volume.servir(s.pack.caminho);
  if (!caminho) return { ok: false, erro: 'pack-sumiu' };
  return { ok: true, volume: caminho };
}

// ---------------------------------------------------------------- a máquina

/** A oferta e a porta de um papel. */
function daOfertaDe(s, papel) {
  return papel === 'reserva' ? { oferta: s.reserva?.oferta ?? null, porta: s.reserva?.porta ?? null } : { oferta: s.oferta, porta: s.porta };
}

/**
 * O que a máquina aceita precisa para baixar, configurar e rodar — **as duas**
 * (parte 7): a que não é a dona baixa e prepara também, para assumir rápido,
 * e não liga (`dona: false`, `ligar: false`).
 */
function planoDe(s, papel = 'principal') {
  const receita = receitaPorId(s.receita);
  const { oferta, porta } = daOfertaDe(s, papel);
  const dona = donaDe(s) === papel;
  const tunelDeCopia = oferta.tuneis.find(t => t.nome === tunelDaCopia(s.id)) ?? null;
  return {
    servidor: s.id,
    receita: receita.id,
    versao: s.versao,
    artefatos: s.resolvido.artefatos,
    porPlataforma: s.resolvido.porPlataforma,
    semJava: s.resolvido.semJava,
    arquivoDeConfig: receita.configuracao.arquivo,
    propriedades: escreverPropriedades(receita, s.config, porta, s.mundo ?? null),
    termos: receita.termos.filter(t => t.arquivo).map(t => ({ id: t.id, arquivo: t.arquivo, conteudo: t.conteudo })),
    rodar: oferta.rodar,
    // Os comandos de alguns sistemas (decisão W1): a máquina escolhe o par
    // dela (`comandosDaMaquina`), como o produto escolhe o que aceita.
    porSistema: oferta.por_sistema ?? [],
    tunel: oferta.tuneis[0],
    ligar: s.ligar && dona,
    // A reserva (parte 7): quem esta máquina é, se é a dona, e a cópia.
    papel,
    dona,
    copia: {
      tunel: tunelDeCopia,
      intervalo: s.intervaloDaCopia ?? INTERVALO_DA_COPIA,
      // A dona só copia quando há outra máquina aceita para receber.
      comOutra: aceiteDe(s, outroPapel(papel)) === 'aceito',
      pasta: s.mundo ?? receita.mundo.pasta,
      // A última cópia que esta máquina recebeu e disse que chegou.
      recebida: s.copiaRecebida?.por === papel ? s.copiaRecebida.sha256 : null,
    },
    ...(s.variante === 'com-mods' && s.pack ? planoDoPack(s, oferta) : {}),
  };
}

/** O que a máquina precisa do pack: de onde ele vem, o hash, o loader e o passo de instalar. */
function planoDoPack(s, oferta) {
  const p = s.pack;
  const extras = [];
  if (p.instalador) extras.push(p.instalador);
  if (p.origem === 'link') extras.push({ id: 'pack', nome: 'pack.mrpack', url: p.url, tamanho: p.bytes, hash: { algoritmo: 'sha512', hex: p.sha512 }, destino: 'pack.mrpack' });
  return {
    artefatos: [...s.resolvido.artefatos, ...extras],
    modpack: {
      origem: p.origem, destino: 'pack.mrpack', pedido: { op: 'pack-ler', id: s.id },
      sha512: p.sha512, bytes: p.bytes, mc: p.mc, loader: p.loader, instalar: oferta.instalar ?? null,
    },
  };
}

function daMaquina(contexto, pedido) {
  const servidores = lerServidores();
  const s = servidores[contexto.maquina.servidor];
  if (!s) return { ok: false, erro: 'servidor-desconhecido', servidor: contexto.maquina.servidor, ordem: 'desligar' };
  // **Uma dona por vez.** O anfitrião só deixa uma máquina aceita falar, e
  // diz o papel dela; a posse é desta metade.
  const papel = papelDe(s, contexto);
  if (!papel) {
    anotarFalha(s, 'maquina', 'nao-e-desta-maquina', { dados: { pessoa: contexto.person, papel: contexto.maquina.papel ?? null } });
    gravarServidores(servidores);
    return { ok: false, erro: 'nao-e-a-dona', ordem: 'desligar' };
  }
  const dona = donaDe(s) === papel;
  if (pedido.op === 'plano') {
    if (aceiteDe(s, papel) !== 'aceito' || !s.resolvido || !daOfertaDe(s, papel).oferta) return { ok: false, erro: 'sem-aceite' };
    return { ok: true, plano: planoDe(s, papel) };
  }
  if (pedido.op === 'estado') {
    if (!ESTADOS_DA_MAQUINA.has(pedido.estado)) return { ok: false, erro: 'estado-desconhecido', estado: pedido.estado ?? null };
    if (!dona) {
      // A outra máquina conta o dela à parte; um jogo de pé nela é a
      // principal que voltou com o processo vivo: desliga, e conta.
      if (s.reserva && papel === 'reserva') s.reserva.estado = pedido.estado;
      else s.estadoDaPrincipal = pedido.estado;
      const rodando = RODANDO.has(pedido.estado) && pedido.estado !== 'parando';
      gravarServidores(servidores);
      return rodando ? { ok: true, ordem: 'desligar', dona: false } : { ok: true, dona: false };
    }
    const antes = s.estado;
    s.estado = pedido.estado;
    if (Array.isArray(pedido.jogadores)) s.jogadores = pedido.jogadores.map(j => cortar(j, 32)).slice(0, 200);
    if (s.estado === 'desligado' || s.estado === 'caiu') s.jogadores = [];
    if (pedido.progresso !== undefined) s.progresso = pedido.progresso;
    if (Array.isArray(pedido.linhas)) s.linhas = pedido.linhas.map(l => cortar(l, 160)).slice(-TETO_DE_LINHAS);
    if (s.estado === 'ligando' || s.estado === 'desligado') s.precisaReiniciar = false;
    if (s.estado === 'caiu' && antes !== 'caiu') {
      // A queda de um jogo mais velho que o mundo diz isso, além da pilha.
      const doMundo = versaoDoMundo(s);
      const velha = doMundo && s.versao && maisVelha(s.versao, doMundo) === true;
      anotarFalha(s, 'jogo', 'o-jogo-caiu', { dados: { ...(pedido.saida ?? {}), versao: s.versao ?? null, ...(velha ? { versaoDoMundo: doMundo } : {}) } });
    }
    // **A versão que rodou o mundo** é a que chegou ao «Done».
    if (s.estado === 'ligado') s.versaoDoMundo = s.versao;
    if (s.chamando && s.estado !== 'esperando-maquina') s.chamando = null;
    // **A dona seguiu rodando sem quem hospeda** e foi religada sem desligar:
    // a tela diz quanto tempo, e quando.
    if (pedido.religada) s.religada = { quando: mundo.agora(), fora: Math.max(0, Number(pedido.religada.fora) || 0), papel };
    gravarServidores(servidores);
    // O jogo de pé quando ninguém o quer de pé desliga.
    if (RODANDO.has(s.estado) && !s.ligar && s.estado !== 'parando' && !s.passando) return { ok: true, ordem: 'desligar' };
    return { ok: true };
  }
  if (pedido.op === 'copia-pronta') {
    // Só a dona copia: a cópia de quem não é a dona seria um mundo velho por cima do novo.
    if (!dona) return { ok: false, erro: 'nao-e-a-dona', ordem: 'desligar' };
    s.copia = {
      quando: mundo.agora(), de: papel, codigo: String(pedido.codigo ?? ''), sha256: String(pedido.sha256 ?? ''),
      tamanho: Number(pedido.tamanho) || 0, final: pedido.final === true,
    };
    const para = outroPapel(papel);
    if (aceiteDe(s, para) === 'aceito') {
      mundo.maquinas.avisar({
        servidor: s.id, papel: para,
        carga: { op: 'copia', tunel: tunelDaCopia(s.id), codigo: s.copia.codigo, sha256: s.copia.sha256, tamanho: s.copia.tamanho, final: s.copia.final },
      });
    }
    gravarServidores(servidores);
    return { ok: true };
  }
  if (pedido.op === 'copia-recebida') {
    if (dona) return { ok: false, erro: 'e-a-dona' };
    s.copiaRecebida = { quando: mundo.agora(), sha256: String(pedido.sha256 ?? ''), por: papel, daCopiaDe: s.copia?.quando ?? null };
    // A passagem avisada fecha quando a outra tem a cópia final, igual.
    if (s.passando && s.passando.para === papel && s.copia?.final && s.copiaRecebida.sha256 === s.copia.sha256) {
      passarAPosse(s, papel, null);
    }
    gravarServidores(servidores);
    return { ok: true };
  }
  if (pedido.op === 'perdeu-a-posse') {
    // **A principal que voltou com o processo vivo** e o encerrou: contado, nunca calado.
    s.voltouRodando = (s.voltouRodando ?? 0) + 1;
    anotarFalha(s, 'reserva', 'voltou-rodando-sem-a-posse', { dados: { papel, pessoa: contexto.person, processoVivo: pedido.processoVivo === true } });
    gravarServidores(servidores);
    return { ok: true };
  }
  if (pedido.op === 'falha') {
    anotarFalha(s, 'maquina', cortar(pedido.erro ?? 'falhou', 64), { etapa: cortar(pedido.etapa ?? '', 32), papel, dados: pedido.dados ?? {} });
    if (s.passando && (pedido.etapa === 'copia' || pedido.etapa === 'receber-copia')) s.passando = null;
    gravarServidores(servidores);
    return { ok: true };
  }
  return { ok: false, erro: 'op-desconhecida', op: pedido.op ?? null };
}

// ---------------------------------------------------------------- as portas

globalThis.aoPedir = (textoDoContexto, textoDoPedido) => {
  const contexto = lerJson(textoDoContexto) ?? {};
  const pedido = lerJson(textoDoPedido);
  if (!pedido || typeof pedido !== 'object') return JSON.stringify({ ok: false, erro: 'pedido-invalido' });
  if (contexto.maquina) return JSON.stringify(daMaquina(contexto, pedido));

  const op = pedido.op;
  const acaoPedida = ACAO_DA_OP[op];
  if (contexto.acao && contexto.acao !== acaoPedida) return JSON.stringify({ ok: false, erro: 'acao-nao-serve', acao: contexto.acao, op: op ?? null });
  if (acaoPedida && contexto.acao !== acaoPedida) return JSON.stringify({ ok: false, erro: 'pede-a-acao', acao: acaoPedida });

  let resposta;
  if (op === 'estado') resposta = opEstado(contexto);
  else if (op === 'versoes') resposta = opVersoes(pedido);
  else if (op === 'pack-ler') resposta = opPackLer(pedido);
  else if (op === 'criar') resposta = opCriar(pedido, contexto);
  else if (acaoPedida) {
    const servidores = lerServidores();
    const s = servidores[pedido.id];
    if (!s) resposta = { ok: false, erro: 'servidor-desconhecido', servidor: pedido.id ?? null };
    else if (op === 'apagar') resposta = opApagar(s, servidores);
    else if (op === 'configurar') resposta = opConfigurar(s, servidores, pedido);
    else if (op === 'ligar') resposta = opLigar(s, servidores);
    else if (op === 'desligar') resposta = opDesligar(s, servidores);
    else if (op === 'passar') resposta = opPassar(s, servidores);
    else if (op === 'pack-link') resposta = opPackLink(s, servidores, pedido);
    else if (op === 'pack-enviar') resposta = opPackEnviar(s);
    else if (op === 'pack-chegou') resposta = opPackChegou(s, servidores, pedido);
    else resposta = opConsole(s, pedido);
  } else resposta = { ok: false, erro: 'op-desconhecida', op: op ?? null };
  return JSON.stringify(resposta);
};

/** As paradas que não são a pessoa da máquina parando: a reserva pode assumir. */
const QUEDAS = Object.freeze(['saiu', 'metade-falhou']);
const MOMENTOS = Object.freeze(['MaquinaAceitou', 'MaquinaRecusou', 'MaquinaParou', 'MaquinaSumiu', 'MaquinaVoltou']);

globalThis.aoAcontecer = (momento, textoDaCarga) => {
  if (momento === 'MetadeSubiu') {
    metadeSubiu(lerJson(textoDaCarga) ?? {});
    return;
  }
  if (!MOMENTOS.includes(momento)) return;
  const carga = lerJson(textoDaCarga) ?? {};
  const servidores = lerServidores();
  const s = servidores[carga.servidor];
  if (!s) {
    mundo.registrar(`${momento} de um servidor de jogo que não existe mais: ${JSON.stringify(carga)}`);
    return;
  }
  const papel = PAPEIS.includes(carga.papel) ? carga.papel : 'principal';
  const pessoa = String(carga.pessoa ?? '');
  if (pessoa !== quemOpera(s, papel)) {
    // A máquina de antes, dispensada por um pedido a outra pessoa: conta, e não mexe na de agora.
    anotarFalha(s, 'aceite', carga.motivo ?? momento, { papel, dados: { pessoa, momento } });
    gravarServidores(servidores);
    return;
  }
  const dona = donaDe(s) === papel;
  if (momento === 'MaquinaAceitou') {
    marcarAceite(s, papel, 'aceito');
    if (dona) avisarADona(s, { op: s.ligar ? 'ligar' : 'preparar' });
    else mundo.maquinas.avisar({ servidor: s.id, papel, carga: { op: 'preparar' } });
    // A dona não precisa de aviso: a cópia agendada relê o plano a cada vez
    // (e um aviso aqui tomaria o lugar de um «ligar» ainda na fila da taxa).
  } else if (momento === 'MaquinaRecusou' && carga.motivo === 'nao-esta-aqui' && s.chamando) {
    // **Chamada de volta, e a pessoa ainda não está no servidor SEELE**: o
    // SEELE lembra o pedido, e ela ouve de novo ao chegar (MaquinaVoltou). O
    // «ligar» fica; o cartão diz que a máquina está fora.
    marcarAceite(s, papel, 'fora', 'nao-esta-aqui');
  } else if (momento === 'MaquinaRecusou') {
    marcarAceite(s, papel, 'recusado', String(carga.motivo ?? ''));
    if (dona) s.ligar = false;
    if (dona && s.estado === 'esperando-maquina') s.estado = 'desligado';
    // O momento vai junto: «pelo-dono» é o mesmo nome para recusar o pedido e
    // para DESLIGAR depois de aceitar, e a tela diz qual dos dois foi.
    anotarFalha(s, 'aceite', String(carga.motivo ?? ''), { papel, momento: 'recusou', dados: { pessoa } });
  } else if (momento === 'MaquinaParou') {
    const motivo = String(carga.motivo ?? '');
    marcarAceite(s, papel, 'parado', motivo);
    anotarFalha(s, 'aceite', motivo, { papel, momento: 'parou', dados: { pessoa } });
    if (dona) {
      // **A dona que caiu (saiu) com uma reserva de pé não desliga o servidor
      // de jogo**: o prazo corre, e MaquinaSumiu decide. Uma parada da pessoa
      // da máquina (DESLIGAR, REVOGAR) desliga, como sempre.
      const temReserva = aceiteDe(s, outroPapel(papel)) === 'aceito';
      // A metade que falhou (metade-falhou) também não foi a pessoa parando:
      // com reserva, o prazo corre do mesmo jeito (revisão final, M12).
      // **A dona que saiu sem reserva também não desliga** (e2e da API 8,
      // 31/10): «saiu» é a conexão que caiu — inclusive a de todo mundo quando
      // o servidor SEELE para —, e a metade de máquina segue rodando órfã até
      // 10 min. O «ligar» fica, ela é chamada de volta (MaquinaVoltou, ou
      // MetadeSubiu num servidor que reiniciou), e o cartão espera a máquina.
      const caiu = motivo === 'saiu';
      if (!(caiu || (QUEDAS.includes(motivo) && temReserva))) s.ligar = false;
      s.estado = caiu && s.ligar ? 'esperando-maquina' : 'desligado';
      s.jogadores = [];
    } else if (papel === 'reserva' && s.reserva) {
      s.reserva.estado = null;
    }
  } else if (momento === 'MaquinaSumiu') {
    sumiu(s, papel, Number(carga.segundos) || 0);
  } else if (momento === 'MaquinaVoltou') {
    // **A que volta não liga sozinha**: é chamada de novo, e o plano diz a ela
    // quem é a dona. Se não é ela, ela desliga o que tiver de pé.
    // A oferta guardada, igual à aceita: a metade que seguiu rodando é religada.
    const r = chamarDeVolta(servidores, s, papel);
    if (!r.ok) anotarFalha(s, 'reserva', r.erro, { papel, dados: r });
  }
  gravarServidores(servidores);
};

/**
 * **A dona sumiu além do prazo** (MaquinaSumiu): com a outra máquina aceita
 * e com uma cópia, a posse passa a ela, que liga com a última cópia; o tempo
 * de jogo perdido é o que passou entre essa cópia e a queda, e todos veem.
 * Sem cópia, não passa — ligar um mundo vazio seria um segundo mundo — e a
 * tela diz por quê.
 */
function sumiu(s, papel, segundos) {
  if (donaDe(s) !== papel) return;
  const outra = outroPapel(papel);
  if (!s.ligar) return;
  if (aceiteDe(s, outra) !== 'aceito') {
    if (s.reserva) anotarFalha(s, 'reserva', 'outra-sem-aceite', { papel: outra, dados: { aceite: aceiteDe(s, outra) } });
    return;
  }
  if (!s.copiaRecebida || s.copiaRecebida.por !== outra) {
    anotarFalha(s, 'reserva', 'reserva-sem-copia', { papel: outra, dados: {} });
    return;
  }
  const caiuEm = mundo.agora() - segundos;
  const daCopia = s.copiaRecebida.daCopiaDe ?? s.copiaRecebida.quando;
  const perdido = { segundos: Math.max(0, caiuEm - daCopia), quando: mundo.agora(), de: papel, para: outra, copiaDe: daCopia };
  passarAPosse(s, outra, perdido);
  anotarFalha(s, 'reserva', 'a-reserva-assumiu', { papel: outra, dados: { perdidoSegundos: perdido.segundos } });
}
