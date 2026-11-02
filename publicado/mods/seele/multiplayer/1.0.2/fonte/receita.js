// ---- receita.js: o que uma receita quer dizer ----
//
// Funções puras sobre uma receita: listar as versões, resolver o que baixar
// numa versão, montar a oferta que a pessoa da máquina aceita, conferir a
// configuração, escrever o arquivo do jogo e ler a saída dele.
//
// **Onde o código ainda é preciso.** Uma receita é dado, mas de onde vem a
// lista de versões e o que baixar é uma fonte com nome: `mojang`, `adoptium`
// ou `fixo`. Um jogo cujos arquivos têm URL, hash e tamanho fixos entra só com
// dado (`fixo`); uma origem nova que precise ser lida (uma API como a da
// Mojang) entra com código, revisado, aqui.
//
// `buscar(url)` devolve o texto ou `null`: no servidor é `mundo.buscar`, e nos
// testes, as fixtures.

/**
 * Busca e lê um JSON, ou diz por que não deu. Com `sha1`, o texto que veio
 * tem de ter esse hash (o que a Mojang publica no manifesto): se não tem, é
 * recusado com a URL, o esperado e o obtido, antes de ser lido.
 */
function buscarJson(buscar, url, sha1) {
  let texto;
  try {
    texto = buscar(url);
  } catch (erro) {
    return { ok: false, erro: 'origem-nao-respondeu', url, porque: fraseDoErro(erro) };
  }
  if (texto === null || texto === undefined) return { ok: false, erro: 'origem-nao-respondeu', url };
  if (sha1 !== undefined) {
    const obtido = sha1Hex(texto);
    if (obtido !== sha1) return { ok: false, erro: 'sha1-diferente', url, esperado: sha1, obtido };
  }
  const json = lerJson(texto);
  if (json === null) return { ok: false, erro: 'origem-ilegivel', url };
  return { ok: true, json };
}

/** O manifesto inteiro da Mojang, filtrado pelos tipos da receita. */
function versoesDoManifesto(receita, buscar) {
  const lido = buscarJson(buscar, receita.versoes.manifesto);
  if (!lido.ok) return lido;
  const lista = Array.isArray(lido.json.versions) ? lido.json.versions : null;
  if (!lista) return { ok: false, erro: 'origem-ilegivel', url: receita.versoes.manifesto };
  const versoes = lista
    .filter(v => v && typeof v.id === 'string' && typeof v.url === 'string' && receita.versoes.tipos.includes(v.type))
    .map(v => ({ id: v.id, url: v.url, sha1: v.sha1 }));
  return { ok: true, versoes };
}

/** As versões que a tela oferece, as mais novas primeiro. */
function listarVersoes(receita, buscar) {
  if (receita.versoes.fonte === 'fixo') return { ok: true, versoes: receita.versoes.lista.map(v => ({ id: v.id })) };
  const todas = versoesDoManifesto(receita, buscar);
  if (!todas.ok) return todas;
  return { ok: true, versoes: todas.versoes.slice(0, receita.versoes.quantas) };
}

/** Um artefato só entra se a URL dele cai numa origem da receita. */
function conferirOrigem(receita, url) {
  const host = hostDaUrl(url);
  if (!host || !hostNasOrigens(host, receita.origens)) return { ok: false, erro: 'url-fora-das-origens', url, host };
  return null;
}

/** Os artefatos de uma fonte `adoptium`: o Java do major pedido, um por plataforma. */
function resolverAdoptium(receita, artefato, major, buscar) {
  const url = artefato.consulta.replace('{major}', String(major));
  const lido = buscarJson(buscar, url);
  if (!lido.ok) return lido;
  if (!Array.isArray(lido.json)) return { ok: false, erro: 'origem-ilegivel', url };
  const achados = {};
  for (const p of artefato.plataformas) {
    const item = lido.json.find(a => a?.binary?.os === p.os && a.binary.architecture === p.arquitetura && a.binary.image_type === 'jre');
    const pacote = item?.binary?.package;
    if (!pacote || typeof pacote.link !== 'string' || !/^[0-9a-f]{64}$/.test(String(pacote.checksum)) || !Number.isInteger(pacote.size)) continue;
    achados[p.plataforma] = {
      id: artefato.id,
      nome: String(pacote.name ?? artefato.destino),
      url: pacote.link,
      tamanho: pacote.size,
      hash: { algoritmo: 'sha256', hex: pacote.checksum },
      destino: artefato.destino,
      desempacotar: { raiz: p.raiz.replace('{release}', String(item.release_name ?? '')) },
    };
  }
  const porPlataforma = {}, substituidas = {}, semJava = [];
  const artefatos = [];
  const usar = a => {
    const igual = artefatos.find(x => x.url === a.url);
    if (igual) return igual.nome;
    artefatos.push(a);
    return a.nome;
  };
  for (const p of artefato.plataformas) {
    if (achados[p.plataforma]) porPlataforma[p.plataforma] = usar(achados[p.plataforma]);
  }
  for (const p of artefato.plataformas) {
    if (achados[p.plataforma]) continue;
    if (p.senaoHouver && achados[p.senaoHouver]) {
      porPlataforma[p.plataforma] = usar(achados[p.senaoHouver]);
      substituidas[p.plataforma] = p.senaoHouver;
    } else {
      semJava.push(p.plataforma);
    }
  }
  for (const a of artefatos) {
    const fora = conferirOrigem(receita, a.url);
    if (fora) return fora;
  }
  return { ok: true, artefatos, porPlataforma, substituidas, semJava, url };
}

/**
 * O que a máquina baixa para rodar `versao`: cada artefato com url, hash,
 * tamanho e destino, e qual Java serve a cada plataforma.
 */
function resolverVersao(receita, versao, buscar) {
  const artefatos = [];
  let porPlataforma = {}, substituidas = {}, semJava = [], javaMajor = null;
  let versaoJson = null, urlDaVersao = null;

  if (receita.versoes.fonte === 'mojang') {
    const todas = versoesDoManifesto(receita, buscar);
    if (!todas.ok) return todas;
    const entrada = todas.versoes.find(v => v.id === versao);
    if (!entrada) return { ok: false, erro: 'versao-desconhecida', versao };
    urlDaVersao = entrada.url;
    // Sem o sha1 do manifesto a conferência passaria em branco: recusa-se, dizendo.
    if (!/^[0-9a-f]{40}$/.test(String(entrada.sha1))) return { ok: false, erro: 'manifesto-sem-sha1', versao, url: entrada.url };
    const lido = buscarJson(buscar, entrada.url, entrada.sha1);
    if (!lido.ok) return lido;
    versaoJson = lido.json;
  } else if (!receita.versoes.lista.some(v => v.id === versao)) {
    return { ok: false, erro: 'versao-desconhecida', versao };
  }

  for (const artefato of receita.artefatos) {
    if (artefato.fonte === 'mojang-servidor') {
      const s = versaoJson?.downloads?.server;
      if (!s || typeof s.url !== 'string' || !/^[0-9a-f]{40}$/.test(String(s.sha1)) || !Number.isInteger(s.size)) {
        return { ok: false, erro: 'versao-sem-servidor', versao, url: urlDaVersao };
      }
      const fora = conferirOrigem(receita, s.url);
      if (fora) return fora;
      artefatos.push({ id: artefato.id, nome: artefato.destino.split('/').pop(), url: s.url, tamanho: s.size, hash: { algoritmo: 'sha1', hex: s.sha1 }, destino: artefato.destino });
    } else if (artefato.fonte === 'adoptium') {
      const pedido = versaoJson?.javaVersion?.majorVersion;
      javaMajor = Number.isInteger(pedido) ? pedido : artefato.majorPadrao;
      const java = resolverAdoptium(receita, artefato, javaMajor, buscar);
      if (!java.ok) return java;
      artefatos.push(...java.artefatos);
      ({ porPlataforma, substituidas, semJava } = java);
    } else if (artefato.fonte === 'fixo') {
      const b = artefato.porVersao[versao];
      if (!b) return { ok: false, erro: 'versao-sem-artefato', versao, artefato: artefato.id };
      artefatos.push({ id: artefato.id, nome: artefato.destino.split('/').pop(), url: b.url, tamanho: b.tamanho, hash: b.hash, destino: artefato.destino });
    }
  }
  return { ok: true, versao, artefatos, porPlataforma, substituidas, semJava, javaMajor };
}

/** O teto de uma oferta: 64 GiB (`MAX_DISCO`, seele-proto/src/maquina.rs). */
const DISCO_MAXIMO_DA_OFERTA = 64 * 1024 * 1024 * 1024;

// ---------------------------------------------------------------- a cópia do mundo (parte 7)

/** Quanto a porta da cópia fica acima da do jogo: longe das portas que dois servidores de jogo na mesma máquina tomam. */
const DESVIO_DA_PORTA_DA_COPIA = 10000;

/** A porta em que a dona oferece a cópia do mundo, na máquina dela. */
function portaDaCopia(porta) {
  return porta + DESVIO_DA_PORTA_DA_COPIA;
}

/** O túnel da cópia: o nome do servidor de jogo com `-copia`, ou `-c` quando não cabe nos 32 de um túnel. */
function tunelDaCopia(servidor) {
  return servidor.length + 6 <= 32 ? `${servidor}-copia` : `${servidor}-c`;
}

/**
 * A oferta que a pessoa da máquina vê e aceita, com os nomes de campo de
 * `OfertaDeMaquina` (seele-proto/src/maquina.rs).
 *
 * **Só entra o que muda o que roda**: a receita e a versão dela, a versão do
 * jogo, a porta, os artefatos, as origens, o comando. A configuração do jogo
 * não entra — ela vira texto no `server.properties`, e mudar o nome do
 * servidor não pode pedir aceite novo.
 */
function montarOferta(receita, { servidor, versao, porta, comCopia = false }, resolvido) {
  // **Cada Java leva os sistemas em que serve** (`plataformas`, API 8 parte 4):
  // a metade de servidor não sabe o sistema da máquina antes do aceite e manda
  // o de cada um; com a marca, a tela da máquina soma só o dela e o produto
  // recusa baixar os outros. O Java de Mac Intel que serve no Mac ARM
  // (`senaoHouver`) leva os dois. Sem marca, serve em todos (o server.jar).
  const sistemasDe = nome => Object.entries(resolvido.porPlataforma ?? {}).filter(([, n]) => n === nome).map(([p]) => p);
  const artefatos = resolvido.artefatos.map(a => {
    const plataformas = sistemasDe(a.nome);
    return {
      nome: a.nome, url: a.url, tamanho: a.tamanho, hash: { algoritmo: a.hash.algoritmo, hex: a.hash.hex },
      ...(plataformas.length ? { plataformas } : {}),
    };
  });
  // O disco: o que se baixa, o Java desempacotado (cerca de três vezes o
  // pacote), o mundo que a receita admite e, para a reserva (parte 7), mais
  // duas vezes ele: o pacote da cópia e o parcial que chega.
  const baixado = resolvido.artefatos.reduce((soma, a) => soma + a.tamanho, 0);
  const maiorPacote = resolvido.artefatos.reduce((maior, a) => (a.desempacotar ? Math.max(maior, a.tamanho) : maior), 0);
  const disco = Math.min(DISCO_MAXIMO_DA_OFERTA, baixado + 3 * maiorPacote + 3 * receita.disco.mundoMaximo);
  return {
    titulo: cortar(`${receita.nome} ${versao} · ${servidor}`, 64),
    receita: receita.id,
    versao_da_receita: receita.versao,
    versao_do_jogo: versao,
    // O jogo, e a cópia do mundo para a reserva (parte 7): a cópia anda pelo
    // túnel, e só a dona o serve. **Só com reserva** (e2e da API 8, 31/10): o
    // aceite mostrava um túnel `-copia` que nada usa. Pôr ou tirar a reserva
    // muda a oferta da principal, que aceita de novo (com o jogo desligado).
    tuneis: [
      { nome: servidor, protocolo: receita.rede.protocolo, porta },
      ...(comCopia ? [{ nome: tunelDaCopia(servidor), protocolo: 'tcp', porta: portaDaCopia(porta) }] : []),
    ],
    artefatos,
    pack: null,
    origens: [...receita.origens],
    dominios_do_jogo: [...receita.dominiosDoJogo],
    rodar: { comando: receita.rodar.comando, argumentos: [...receita.rodar.argumentos] },
    disco_maximo: disco,
    termos: receita.termos.map(t => ({ titulo: t.titulo, url: t.url })),
  };
}

// ---------------------------------------------------------------- configuração

/** Uma cópia da lista de palavras, para o padrão da receita nunca ser o que se edita. */
function copiarSegmentos(lista) {
  return lista.map(p => ({ texto: p.texto, cor: p.cor }));
}

/** O nome como texto simples, as palavras separadas por um espaço. */
function nomeEmTexto(segmentos) {
  return Array.isArray(segmentos) ? segmentos.map(p => p?.texto ?? '').join(' ') : String(segmentos ?? '');
}

/**
 * Confere uma lista de palavras `{texto, cor}` de um campo `segmentos`.
 * Devolve `{ lista }` com as palavras já aparadas, ou `{ erro }` com a frase.
 *
 * O `texto` nunca carrega `§` (uma palavra não escolhe a cor de outra por
 * fora do campo `cor`) nem quebra de linha, e a `cor` é uma das opções da
 * receita — as 16 do Minecraft.
 */
function conferirSegmentos(campo, valor) {
  if (!Array.isArray(valor)) return { erro: 'Use uma lista de palavras, cada uma com texto e cor.' };
  if (valor.length === 0) return { erro: 'Preencha o nome com ao menos uma palavra.' };
  if (valor.length > campo.maximoSegmentos) return { erro: `Use até ${campo.maximoSegmentos} palavras; são ${valor.length}.` };
  const lista = [];
  for (let i = 0; i < valor.length; i++) {
    const p = valor[i];
    const n = i + 1;
    const chaves = p && typeof p === 'object' && !Array.isArray(p) ? Object.keys(p) : [];
    if (chaves.length !== 2 || !chaves.includes('texto') || !chaves.includes('cor') || typeof p.texto !== 'string') {
      return { erro: `A palavra ${n} está mal formada: use {texto, cor}.` };
    }
    if (/[\u0000-\u001f\u007f-\u009f\u2028\u2029§]/.test(p.texto)) return { erro: `A palavra ${n} tem § ou uma quebra de linha, que não valem num nome.` };
    const texto = p.texto.trim();
    if (texto === '') return { erro: `A palavra ${n} está vazia.` };
    if (!campo.opcoes.some(o => o.valor === p.cor)) {
      return { erro: `A palavra ${n} usa a cor ${typeof p.cor === 'string' ? '«' + p.cor + '»' : JSON.stringify(p.cor)}, que não é uma das 16 do Minecraft.` };
    }
    lista.push({ texto, cor: p.cor });
  }
  const tamanho = [...nomeEmTexto(lista)].length;
  if (campo.tamanhoMaximo && tamanho > campo.tamanhoMaximo) return { erro: `Use até ${campo.tamanhoMaximo} caracteres no nome todo; este tem ${tamanho}.` };
  return { lista };
}

/** O nome com o `§` de cada cor antes da palavra dela: o que o `motd` lê. */
function motdDe(campo, segmentos) {
  return segmentos.map(p => '§' + campo.opcoes.find(o => o.valor === p.cor).codigo + p.texto).join(' ');
}

/** A configuração com os padrões da receita. */
function configPadrao(receita) {
  const config = {};
  for (const campo of receita.configuracao.campos) config[campo.chave] = campo.forma === 'segmentos' ? copiarSegmentos(campo.padrao) : campo.padrao;
  return config;
}

/**
 * Confere `entrada` contra o esquema de configuração da receita, sobre a
 * configuração `atual`. Devolve a configuração nova e, por campo, a frase do
 * que não serviu — as mesmas frases que o SEELE usa num formulário.
 */
function validarConfig(receita, entrada, atual = configPadrao(receita)) {
  const config = { ...configPadrao(receita), ...atual };
  const erros = {};
  if (!entrada || typeof entrada !== 'object' || Array.isArray(entrada)) return { config, erros: { '': 'A configuração não veio.' } };
  const campos = new Map(receita.configuracao.campos.map(c => [c.chave, c]));
  for (const [chave, valor] of Object.entries(entrada)) {
    const campo = campos.get(chave);
    if (!campo) {
      erros[chave] = `A receita não tem o campo «${chave}».`;
      continue;
    }
    let erro = null;
    let valorFinal = valor;
    if (campo.forma === 'segmentos') {
      const c = conferirSegmentos(campo, valor);
      if (c.erro) erro = c.erro;
      else valorFinal = c.lista;
    } else if (campo.forma === 'campo') {
      if (typeof valor !== 'string') erro = 'Use um texto.';
      else if (campo.obrigatorio && valor.trim() === '') erro = 'Preencha este campo.';
      else if (campo.tamanhoMaximo && [...valor].length > campo.tamanhoMaximo) erro = `Use até ${campo.tamanhoMaximo} caracteres; este tem ${[...valor].length}.`;
    } else if (campo.forma === 'numero') {
      if (typeof valor !== 'number' || !Number.isFinite(valor)) erro = `Use um número de ${campo.minimo} a ${campo.maximo}.`;
      else if (!Number.isInteger(valor)) erro = 'Use um número inteiro.';
      else if (valor < campo.minimo || valor > campo.maximo) erro = `Use um número de ${campo.minimo} a ${campo.maximo}.`;
    } else if (campo.forma === 'escolha') {
      if (!campo.opcoes.some(o => o.valor === valor)) erro = 'Escolha uma das opções.';
    } else if (campo.forma === 'interruptor') {
      if (typeof valor !== 'boolean') erro = 'Use ligado ou desligado.';
    }
    if (erro) erros[chave] = erro;
    else config[chave] = valorFinal;
  }
  return { config, erros };
}

/**
 * Um valor de `.properties`: `\`, `:`, `=`, `#`, `!`, as quebras e tudo fora
 * do ASCII escapados (o `§` sai `\u00a7`, que é como o Java o lê).
 */
function escaparPropriedade(texto) {
  let saida = '';
  for (const c of String(texto)) {
    const p = c.codePointAt(0);
    if (c === '\\') saida += '\\\\';
    else if (c === ':' || c === '=' || c === '#' || c === '!') saida += '\\' + c;
    else if (c === '\n') saida += '\\n';
    else if (c === '\r') saida += '\\r';
    else if (c === '\t') saida += '\\t';
    else if (p < 0x20 || p > 0x7e) {
      // Fora do BMP, o par substituto, como o Java lê.
      const unidades = p > 0xffff ? [0xd800 + ((p - 0x10000) >> 10), 0xdc00 + ((p - 0x10000) & 0x3ff)] : [p];
      for (const u of unidades) saida += '\\u' + u.toString(16).padStart(4, '0');
    } else saida += c;
  }
  return saida.startsWith(' ') ? '\\' + saida : saida;
}

/** O arquivo de configuração do jogo, a partir da configuração e da porta. */
function escreverPropriedades(receita, config, porta, nivel = null) {
  const valores = { ...configPadrao(receita), ...config, porta };
  // Uma lista de palavras entra no modelo já com o § de cada cor.
  for (const campo of receita.configuracao.campos) {
    if (campo.forma === 'segmentos') valores[campo.chave] = motdDe(campo, valores[campo.chave]);
  }
  const linhas = [
    `# Escrito pelo MOD de multiplayer do SEELE (receita ${receita.id} ${receita.versao}).`,
    '# Mude pela tela do SEELE: o que mudar aqui é reescrito ao ligar.',
  ];
  for (const [chave, modelo] of Object.entries(receita.configuracao.propriedades)) {
    const valor = modelo.replace(/\{([A-Za-z0-9]+)\}/g, (_, nome) => String(valores[nome]));
    linhas.push(`${chave}=${escaparPropriedade(valor)}`);
  }
  // Um mundo novo é outra pasta (o mundo de antes fica na máquina).
  if (nivel) linhas.push(`level-name=${escaparPropriedade(nivel)}`);
  return linhas.join('\n') + '\n';
}

/**
 * **Um `.properties` lido como o Java o lê** (o bastante para o
 * `server.properties`): `#` e `!` comentam, a chave vai até o primeiro `=`,
 * `:` ou espaço sem escape, e `\uXXXX`, `\t`, `\n`, `\r` e `\x` voltam ao
 * caractere. O Minecraft reescreve o arquivo ao subir, em UTF-8 e sem os
 * escapes que o MOD escreve: comparar o texto diria «mudou» de tudo.
 */
function lerPropriedades(texto) {
  const lidas = new Map();
  const desfazer = s => s.replace(/\\(u[0-9a-fA-F]{4}|.)/g, (_, e) => {
    if (e.length === 5) return String.fromCharCode(parseInt(e.slice(1), 16));
    return { t: '\t', n: '\n', r: '\r', f: '\f' }[e] ?? e;
  });
  for (const cru of String(texto).split(/\r?\n/)) {
    const linha = cru.replace(/^[ \t\f]+/, '');
    if (!linha || linha[0] === '#' || linha[0] === '!') continue;
    let k = 0;
    while (k < linha.length && !'=: \t\f'.includes(linha[k])) k += linha[k] === '\\' ? 2 : 1;
    const chave = desfazer(linha.slice(0, k));
    const resto = linha.slice(k).replace(/^[ \t\f]*[=:]?[ \t\f]*/, '');
    lidas.set(chave, desfazer(resto));
  }
  return lidas;
}

/**
 * **As chaves do MOD num `.properties` de outro** (o `default-server.properties`
 * que um pack traz): cada linha do outro fica, a de uma chave do MOD é
 * trocada pela dele, e as que faltam vão ao fim. Assim o que o pack quer
 * (o tipo do mundo de um skyblock) e o que a tela promete (a porta, o
 * `127.0.0.1`, o nome) valem os dois.
 */
function mesclarPropriedades(deles, nossas) {
  const chaveDe = l => [...lerPropriedades(l).keys()][0];
  const linhasMinhas = new Map();
  for (const l of String(nossas).split('\n')) {
    const chave = chaveDe(l);
    if (chave !== undefined) linhasMinhas.set(chave, l);
  }
  const vistas = new Set();
  const saida = [];
  for (const l of String(deles).split(/\r?\n/)) {
    const chave = chaveDe(l);
    if (chave !== undefined && linhasMinhas.has(chave)) {
      if (!vistas.has(chave)) saida.push(linhasMinhas.get(chave));
      vistas.add(chave);
    } else saida.push(l);
  }
  while (saida.length && saida.at(-1) === '') saida.pop();
  const faltam = [...linhasMinhas].filter(([chave]) => !vistas.has(chave)).map(([, l]) => l);
  if (faltam.length) saida.push('# Do MOD de multiplayer do SEELE: o que a tela promete vale também aqui.', ...faltam);
  return saida.join('\n') + '\n';
}

/**
 * O que o jogo **está usando** difere do que o MOD escreveu? Cada chave do
 * MOD, com o valor esperado e o lido (`null` quando sumiu).
 */
function propriedadesTrocadas(escritas, lidasTexto) {
  const esperadas = lerPropriedades(escritas);
  const lidas = lerPropriedades(lidasTexto);
  const trocadas = [];
  for (const [chave, esperado] of esperadas) {
    const lido = lidas.has(chave) ? lidas.get(chave) : null;
    if (lido !== esperado) trocadas.push({ chave, esperado, lido });
  }
  return trocadas;
}

// ---------------------------------------------------------------- saída

/** Uma linha da saída sem as sequências de cor do terminal (`ESC [ … m`). */
function semCores(linha) {
  return String(linha).replace(/\x1b\[[0-9;?]*[A-Za-z]/g, '');
}

/** Uma função que lê uma linha da saída do jogo e diz o que ela quer dizer. */
function casarSaida(receita) {
  const pronto = new RegExp(receita.saida.pronto);
  const entrou = new RegExp(receita.saida.entrou);
  const saiu = new RegExp(receita.saida.saiu);
  return linha => {
    const texto = String(linha);
    if (pronto.test(texto)) return { tipo: 'pronto' };
    let m = entrou.exec(texto);
    if (m) return { tipo: 'entrou', jogador: m[1] };
    m = saiu.exec(texto);
    if (m) return { tipo: 'saiu', jogador: m[1] };
    return null;
  };
}
