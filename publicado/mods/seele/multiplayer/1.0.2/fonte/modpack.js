// ---- modpack.js: o Minecraft com mods (o .mrpack do Modrinth) ----
//
// Funções puras sobre o `modrinth.index.json` e sobre a seção `modpack` da
// receita, usadas pela metade de servidor (que monta a oferta) e pela de
// máquina (que lê o índice do pack aceito e baixa cada arquivo). As regras são
// as da spec («Minecraft, a primeira receita» → «Com mods»), conferidas na
// especificação do formato do Modrinth:
//
// - `dependencies` dá a versão do Minecraft e o loader (`fabric-loader`,
//   `forge`, `neoforge` ou `quilt-loader`); **uma chave desconhecida é
//   recusada com o nome dela**, e não ignorada;
// - de `files`, só entram os que têm `env.server` diferente de `unsupported`,
//   cada um conferido pelo `sha512`, e só de `cdn.modrinth.com`, `github.com`,
//   `raw.githubusercontent.com` e `gitlab.com` (os `dominios` da receita);
// - `path` absoluto ou com `..` é recusado;
// - aplicam-se `overrides` e depois `server-overrides`;
// - instala-se o loader de servidor que o pack pede.
//
// **O pack inteiro é recusado no primeiro arquivo que não serve**, com o
// nome, o arquivo e os dados: meio modpack é um servidor que cai em jogo.

/** As chaves de `dependencies` que o formato conhece. */
const CHAVES_DE_DEPENDENCIA = Object.freeze(['minecraft', 'fabric-loader', 'quilt-loader', 'forge', 'neoforge']);

/** Quantos arquivos um pack pode ter: o índice de um pack grande tem algumas centenas. */
const TETO_DE_ARQUIVOS_DO_PACK = 2000;

/** Um `path` do índice que fica dentro da pasta do jogo: relativo, sem `..`, sem `\`. */
function caminhoDoPackServe(caminho) {
  if (typeof caminho !== 'string' || caminho === '' || caminho.length > 400) return false;
  if (/^[/\\]/.test(caminho) || /^[A-Za-z]:/.test(caminho) || caminho.includes('\\')) return false;
  if (/[\u0000-\u001f\u007f]/.test(caminho)) return false;
  return !caminho.split('/').some(p => p === '..' || p === '.' || p === '');
}

/**
 * **O índice do pack, conferido**: `{ ok: true, indice }` com o que a oferta e
 * a máquina precisam, ou `{ ok: false, erro, ... }` com o nome e os dados.
 *
 * `indice.arquivos` são só os do servidor (sem os `env.server: unsupported`,
 * contados em `excluidos`), cada um com a primeira URL que cai num dos
 * `dominios` da receita.
 */
function lerIndice(texto, receita) {
  const dominios = receita.modpack.dominios;
  const j = typeof texto === 'string' ? lerJson(texto) : texto;
  if (!j || typeof j !== 'object' || Array.isArray(j)) return { ok: false, erro: 'indice-ilegivel' };
  if (j.formatVersion !== 1) return { ok: false, erro: 'formato-do-pack-desconhecido', formatVersion: j.formatVersion ?? null };
  if (j.game !== 'minecraft') return { ok: false, erro: 'pack-de-outro-jogo', game: j.game ?? null };
  const deps = j.dependencies;
  if (!deps || typeof deps !== 'object' || Array.isArray(deps)) return { ok: false, erro: 'pack-sem-dependencias' };
  for (const chave of Object.keys(deps)) {
    if (!CHAVES_DE_DEPENDENCIA.includes(chave)) return { ok: false, erro: 'dependencia-desconhecida', dependencia: chave, conhecidas: CHAVES_DE_DEPENDENCIA };
    if (typeof deps[chave] !== 'string' || !/^[A-Za-z0-9._+-]{1,64}$/.test(deps[chave])) return { ok: false, erro: 'versao-de-dependencia-invalida', dependencia: chave, versao: deps[chave] ?? null };
  }
  if (!deps.minecraft) return { ok: false, erro: 'pack-sem-minecraft' };
  const loaders = Object.keys(deps).filter(k => k !== 'minecraft');
  if (loaders.length > 1) return { ok: false, erro: 'loaders-demais', loaders };
  const loader = loaders.length ? { id: loaders[0], versao: deps[loaders[0]] } : null;
  if (loader && !receita.modpack.loaders[loader.id]) return { ok: false, erro: 'loader-sem-receita', loader: loader.id };

  if (!Array.isArray(j.files)) return { ok: false, erro: 'pack-sem-files' };
  if (j.files.length > TETO_DE_ARQUIVOS_DO_PACK) return { ok: false, erro: 'arquivos-demais-no-pack', quantos: j.files.length, teto: TETO_DE_ARQUIVOS_DO_PACK };
  const arquivos = [];
  let excluidos = 0;
  for (const f of j.files) {
    const path = f?.path;
    if (!caminhoDoPackServe(path)) return { ok: false, erro: 'caminho-recusado', path: path ?? null };
    if (f.env !== undefined && (typeof f.env !== 'object' || f.env === null)) return { ok: false, erro: 'env-invalido', path };
    if (f.env?.server === 'unsupported') {
      excluidos++;
      continue;
    }
    const sha512 = f.hashes?.sha512;
    if (typeof sha512 !== 'string' || !/^[0-9a-f]{128}$/.test(sha512)) return { ok: false, erro: 'sem-sha512', path };
    if (!Number.isInteger(f.fileSize) || f.fileSize < 1) return { ok: false, erro: 'sem-tamanho', path };
    const urls = Array.isArray(f.downloads) ? f.downloads.map(String) : [];
    const url = urls.find(u => {
      const host = hostDaUrl(u);
      return host && dominios.includes(host);
    });
    if (!url) return { ok: false, erro: 'download-fora-dos-dominios', path, urls: urls.slice(0, 3), dominios };
    if (arquivos.some(a => a.path === path)) return { ok: false, erro: 'caminho-repetido', path };
    arquivos.push({ path, url, sha512, tamanho: f.fileSize });
  }
  return {
    ok: true,
    indice: {
      nome: cortar(String(j.name ?? ''), 64),
      versaoDoPack: cortar(String(j.versionId ?? ''), 32),
      mc: deps.minecraft,
      loader,
      arquivos,
      excluidos,
      bytes: arquivos.reduce((n, a) => n + a.tamanho, 0),
    },
  };
}

/** O que a metade de servidor guarda e a tela mostra de um pack lido (sem a lista de arquivos). */
function resumoDoIndice(indice) {
  return {
    nome: indice.nome, versaoDoPack: indice.versaoDoPack, mc: indice.mc, loader: indice.loader,
    arquivos: indice.arquivos.length, excluidos: indice.excluidos, bytesDosArquivos: indice.bytes,
  };
}

/**
 * Um link do Modrinth: `https://modrinth.com/modpack/<slug>`, com
 * `/version/<id ou número>` opcional. Devolve `{ slug, versao }` ou a recusa.
 */
function lerLinkDoModrinth(link) {
  const m = /^https:\/\/(?:www\.)?modrinth\.com\/modpack\/([A-Za-z0-9_-]{1,64})(?:\/version\/([A-Za-z0-9._+-]{1,64}))?\/?(?:[?#].*)?$/.exec(String(link ?? '').trim());
  if (!m) return { ok: false, erro: 'link-nao-e-do-modrinth', link: cortar(String(link ?? ''), 120) };
  return { ok: true, slug: m[1], versao: m[2] ?? null };
}

/**
 * A versão do modpack na resposta da API do Modrinth (`/project/<slug>/version`,
 * da mais nova para a mais velha): a pedida (por id ou número) ou a mais nova,
 * e o arquivo `.mrpack` primário dela, com o `sha512` e o tamanho.
 */
function escolherVersaoDoModrinth(lista, versao, receita) {
  if (!Array.isArray(lista) || !lista.length) return { ok: false, erro: 'modpack-sem-versoes' };
  const v = versao ? lista.find(x => x?.id === versao || x?.version_number === versao) : lista[0];
  if (!v) return { ok: false, erro: 'versao-do-modpack-desconhecida', versao };
  const arquivos = Array.isArray(v.files) ? v.files : [];
  const f = arquivos.find(x => x?.primary && /\.mrpack$/.test(String(x.filename))) ?? arquivos.find(x => /\.mrpack$/.test(String(x?.filename)));
  if (!f) return { ok: false, erro: 'versao-sem-mrpack', versao: v.id ?? null };
  if (hostDaUrl(f.url) !== receita.modpack.cdn) return { ok: false, erro: 'mrpack-fora-do-cdn', url: f.url ?? null, cdn: receita.modpack.cdn };
  if (!/^[0-9a-f]{128}$/.test(String(f.hashes?.sha512)) || !Number.isInteger(f.size)) return { ok: false, erro: 'mrpack-sem-hash', url: f.url };
  return {
    ok: true,
    versao: { id: String(v.id), numero: cortar(String(v.version_number ?? ''), 32), nome: cortar(String(v.name ?? ''), 64) },
    arquivo: { nome: cortar(String(f.filename), 120), url: f.url, sha512: f.hashes.sha512, tamanho: f.size },
  };
}

/**
 * **O termo do pack** (revisão final, I2): o pack é aceito pelo hash, e o que
 * vem nele — os mods do índice e todo arquivo de `overrides/` e
 * `server-overrides/`, jars inclusive — roda neste computador. A tela do
 * aceite lista de onde se baixa, e um «pode baixar de cdn.modrinth.com» lido
 * sozinho dizia menos do que roda. Como termo, a pessoa marca que leu.
 */
const TERMO_DO_PACK = Object.freeze({
  titulo: 'o modpack: os mods dele e todo arquivo que ele traz (overrides, jars inclusive) rodam neste computador, com a sua conta',
  url: 'https://support.modrinth.com/en/articles/8802351-modrinth-modpack-format-mrpack',
});

/**
 * **O que o pack não troca** (revisão final, I2): o que o aceite mostra como
 * «vai rodar» — o comando, o jar de `-jar`, o arquivo de `@argumentos` —, cada
 * artefato aceito que não é um pacote, a marca do instalador (`.seele-loader`,
 * que pularia o instalador) e o arquivo que diz ao lançador do Fabric qual é o
 * jar do servidor. Um pack que traz um deles (no índice ou nos overrides) é
 * recusado: os mods rodam (é o termo), mas o programa que a tela nomeia é o
 * aceito.
 */
function caminhosProtegidosDoPack(plano) {
  const caminhos = ['.seele-loader', 'fabric-server-launcher.properties'];
  for (const a of plano.artefatos ?? []) if (!a.desempacotar && a.destino) caminhos.push(a.destino);
  // Os de **todo** sistema (decisão W1): o `win_args.txt` que o pack trouxesse
  // seria o que a máquina Windows roda, mesmo lido num Mac.
  const dosSistemas = (plano.porSistema ?? []).flatMap(e => [e.rodar, e.instalar]);
  for (const c of [plano.rodar, plano.modpack?.instalar, ...dosSistemas]) {
    if (!c) continue;
    caminhos.push(c.comando, c.comando + '.exe');
    (c.argumentos ?? []).forEach((arg, k, todos) => {
      if (arg === '-jar' && todos[k + 1]) caminhos.push(todos[k + 1]);
      if (arg.startsWith('@') && arg.length > 1) caminhos.push(arg.slice(1));
    });
  }
  return [...new Set(caminhos)].filter(caminhoDoPackServe);
}

/** `{mc}` e `{loader}` num modelo. */
const comVersoes = (modelo, mc, loader) => String(modelo).replace(/\{mc\}/g, mc).replace(/\{loader\}/g, loader);

/**
 * **O instalador do loader** que o pack pede, como um artefato da oferta:
 * fixo (a receita traz URL, hash e tamanho), ou lido de um Maven Reposilite
 * (o hash do `<url>.<algoritmo>` e o tamanho da API de detalhes).
 */
function instaladorDoLoader(receita, loader, mc, buscar) {
  const l = receita.modpack.loaders[loader.id];
  if (!l) return { ok: false, erro: 'loader-sem-receita', loader: loader.id };
  const inst = l.instalador;
  const nome = inst.destino.split('/').pop();
  if (inst.fonte === 'fixo') {
    return { ok: true, artefato: { id: 'instalador', nome, url: inst.url, tamanho: inst.tamanho, hash: { ...inst.hash }, destino: inst.destino } };
  }
  const url = comVersoes(inst.url, mc, loader.versao);
  let hex;
  try {
    hex = buscar(url + '.' + inst.algoritmo);
  } catch {
    hex = null;
  }
  hex = typeof hex === 'string' ? hex.trim().toLowerCase().slice(0, 128) : null;
  if (!hex || hex.length !== ({ sha1: 40, sha256: 64, sha512: 128 })[inst.algoritmo] || !/^[0-9a-f]+$/.test(hex)) {
    return { ok: false, erro: 'instalador-sem-hash', url: url + '.' + inst.algoritmo };
  }
  const detalhes = buscarJson(buscar, comVersoes(inst.detalhes, mc, loader.versao));
  if (!detalhes.ok) return { ...detalhes, erro: 'instalador-sem-tamanho' };
  const tamanho = detalhes.json?.contentLength;
  if (!Number.isInteger(tamanho) || tamanho < 1) return { ok: false, erro: 'instalador-sem-tamanho', url: comVersoes(inst.detalhes, mc, loader.versao) };
  return { ok: true, artefato: { id: 'instalador', nome, url, tamanho, hash: { algoritmo: inst.algoritmo, hex }, destino: inst.destino } };
}

/**
 * Os dois comandos do loader, com as versões do pack: `{ instalar, rodar,
 * porSistema }`. `porSistema` são as entradas de `por_sistema` da oferta
 * (decisão W1): o Forge e o NeoForge no Windows rodam pelo `win_args.txt`, com
 * o `java.exe`; o instalador é o mesmo jar, com os argumentos de cima se a
 * entrada não traz os seus.
 */
function comandosDoLoader(receita, loader, mc) {
  const l = receita.modpack.loaders[loader.id];
  const v = args => args.map(a => comVersoes(a, mc, loader.versao));
  return {
    instalar: { comando: receita.rodar.comando, argumentos: v(l.instalar) },
    rodar: { comando: receita.rodar.comando, argumentos: v(l.rodar) },
    porSistema: (l.porSistema ?? []).map(e => ({
      plataformas: [...e.plataformas],
      rodar: { comando: e.comando, argumentos: v(e.rodar) },
      instalar: { comando: e.comando, argumentos: v(e.instalar ?? l.instalar) },
    })),
  };
}

/**
 * **O par que esta máquina roda** (decisão W1), pela regra do produto
 * (`seele_proto::maquina::comandos_para`): a entrada de `por_sistema` que
 * nomeia `plataforma` substitui o `rodar` e o `instalar` de cima inteiros; sem
 * entrada, valem os de cima. A metade de máquina pede ao `programa` só este
 * par — o de outro sistema é `comando-fora-do-aceito`.
 */
function comandosDaMaquina({ rodar = null, instalar = null, porSistema = [] }, plataforma) {
  const e = (porSistema ?? []).find(x => x.plataformas.includes(plataforma));
  return e ? { rodar: e.rodar ?? null, instalar: e.instalar ?? null } : { rodar, instalar };
}

/**
 * A oferta de um servidor com mods: a do Vanilla da versão do pack, mais o
 * instalador do loader, o `.mrpack` (pelo link, como artefato do CDN), o
 * `pack` pelo `sha512`, os domínios do pack nas origens (a segunda porta do
 * `programa`, decisão Q1 da parte 4), os do loader nos do jogo, o passo de
 * instalar e o disco dos mods e do loader.
 */
function montarOfertaComMods(receita, args, resolvido, pack) {
  const oferta = montarOferta(receita, args, resolvido);
  const extras = [];
  if (pack.instalador) extras.push(pack.instalador);
  if (pack.origem === 'link') extras.push({ nome: 'pack.mrpack', url: pack.url, tamanho: pack.bytes, hash: { algoritmo: 'sha512', hex: pack.sha512 } });
  for (const a of extras) oferta.artefatos.push({ nome: a.nome, url: a.url, tamanho: a.tamanho, hash: { algoritmo: a.hash.algoritmo, hex: a.hash.hex } });
  oferta.pack = { algoritmo: 'sha512', hex: pack.sha512 };
  for (const d of receita.modpack.dominios) if (!oferta.origens.includes(d)) oferta.origens.push(d);
  // O que o pack traz roda aqui: a pessoa lê e marca (pela página do pack, se veio pelo link).
  oferta.termos.push({ titulo: TERMO_DO_PACK.titulo, url: pack.pagina ?? TERMO_DO_PACK.url });
  if (pack.loader) {
    const l = receita.modpack.loaders[pack.loader.id];
    for (const d of l.dominiosDoJogo) if (!oferta.dominios_do_jogo.includes(d)) oferta.dominios_do_jogo.push(d);
    const c = comandosDoLoader(receita, pack.loader, pack.mc);
    oferta.instalar = c.instalar;
    oferta.rodar = c.rodar;
    if (c.porSistema.length) oferta.por_sistema = c.porSistema;
  }
  // O pack, o pack aberto (os overrides, cerca de três vezes o pack), os
  // arquivos do índice, o instalador e o que o loader instala sozinho.
  const loaderDisco = pack.loader ? receita.modpack.loaders[pack.loader.id].disco : 0;
  const somar = pack.bytes * 4 + (pack.resumo?.bytesDosArquivos ?? 0) + (pack.instalador?.tamanho ?? 0) + loaderDisco;
  oferta.disco_maximo = Math.min(DISCO_MAXIMO_DA_OFERTA, oferta.disco_maximo + somar);
  oferta.titulo = cortar(`${receita.nome} ${args.versao} com mods · ${args.servidor}`, 64);
  return oferta;
}
