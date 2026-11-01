/* Gerado por ferramentas/build.mjs a partir de fonte/ e receitas/. API 8. Não edite aqui. */
(() => {
"use strict";
const RECEITAS = [{"formato":1,"id":"minecraft","nome":"Minecraft","edicao":"Java Edition","icone":"MC","versao":"1.0.0","descricao":"O servidor oficial da Mojang, com o Java que cada versão pede.","variantes":{"vanilla":{"nome":"Vanilla","descricao":"Minecraft puro, sem mods. Você escolhe só a versão."},"com-mods":{"nome":"Com mods","descricao":"Um modpack do Modrinth define a versão, o loader e os mods."}},"versoes":{"fonte":"mojang","manifesto":"https://piston-meta.mojang.com/mc/game/version_manifest_v2.json","tipos":["release"],"quantas":24},"artefatos":[{"id":"servidor","fonte":"mojang-servidor","destino":"server.jar"},{"id":"java","fonte":"adoptium","destino":"java","consulta":"https://api.adoptium.net/v3/assets/latest/{major}/hotspot?image_type=jre&vendor=eclipse","majorPadrao":8,"plataformas":[{"plataforma":"windows-x64","os":"windows","arquitetura":"x64","raiz":"{release}-jre"},{"plataforma":"mac-aarch64","os":"mac","arquitetura":"aarch64","raiz":"{release}-jre/Contents/Home","senaoHouver":"mac-x64"},{"plataforma":"mac-x64","os":"mac","arquitetura":"x64","raiz":"{release}-jre/Contents/Home"},{"plataforma":"linux-x64","os":"linux","arquitetura":"x64","raiz":"{release}-jre"},{"plataforma":"linux-aarch64","os":"linux","arquitetura":"aarch64","raiz":"{release}-jre"}]}],"origens":["piston-data.mojang.com","github.com","objects.githubusercontent.com","release-assets.githubusercontent.com"],"dominiosDoJogo":["sessionserver.mojang.com","api.minecraftservices.com","api.mojang.com"],"rodar":{"comando":"java/bin/java","argumentos":["-Xms1G","-Xmx2G","-jar","server.jar","nogui"]},"rede":{"protocolo":"tcp","portaPadrao":25565},"disco":{"mundoMaximo":8589934592},"termos":[{"id":"eula","titulo":"EULA do Minecraft (Mojang)","url":"https://aka.ms/MinecraftEULA","arquivo":"eula.txt","conteudo":"eula=true\n"}],"configuracao":{"arquivo":"server.properties","formato":"properties","campos":[{"chave":"nome","aba":"geral","forma":"segmentos","rotulo":"Nome que aparece na lista do jogo","ajuda":"Cada palavra tem a sua cor, entre as 16 do Minecraft.","padrao":[{"texto":"Servidor do SEELE","cor":"aqua"}],"tamanhoMaximo":59,"maximoSegmentos":6,"opcoes":[{"valor":"white","rotulo":"Branco","amostra":"#FFFFFF","codigo":"f"},{"valor":"gray","rotulo":"Cinza","amostra":"#AAAAAA","codigo":"7"},{"valor":"dark_gray","rotulo":"Cinza-escuro","amostra":"#555555","codigo":"8"},{"valor":"black","rotulo":"Preto","amostra":"#000000","codigo":"0"},{"valor":"yellow","rotulo":"Amarelo","amostra":"#FFFF55","codigo":"e"},{"valor":"gold","rotulo":"Dourado","amostra":"#FFAA00","codigo":"6"},{"valor":"red","rotulo":"Vermelho","amostra":"#FF5555","codigo":"c"},{"valor":"dark_red","rotulo":"Vermelho-escuro","amostra":"#AA0000","codigo":"4"},{"valor":"light_purple","rotulo":"Rosa","amostra":"#FF55FF","codigo":"d"},{"valor":"dark_purple","rotulo":"Roxo","amostra":"#AA00AA","codigo":"5"},{"valor":"blue","rotulo":"Azul","amostra":"#5555FF","codigo":"9"},{"valor":"dark_blue","rotulo":"Azul-escuro","amostra":"#0000AA","codigo":"1"},{"valor":"aqua","rotulo":"Ciano","amostra":"#55FFFF","codigo":"b"},{"valor":"dark_aqua","rotulo":"Ciano-escuro","amostra":"#00AAAA","codigo":"3"},{"valor":"green","rotulo":"Verde","amostra":"#55FF55","codigo":"a"},{"valor":"dark_green","rotulo":"Verde-escuro","amostra":"#00AA00","codigo":"2"}]},{"chave":"maximo","aba":"geral","grupo":"regras","forma":"numero","rotulo":"Máx. jogadores","padrao":10,"minimo":1,"maximo":100},{"chave":"dificuldade","aba":"geral","grupo":"regras","forma":"escolha","rotulo":"Dificuldade","padrao":"normal","opcoes":[{"valor":"peaceful","rotulo":"Pacífica"},{"valor":"easy","rotulo":"Fácil"},{"valor":"normal","rotulo":"Normal"},{"valor":"hard","rotulo":"Difícil"}]},{"chave":"modo","aba":"geral","grupo":"regras","forma":"escolha","rotulo":"Modo","padrao":"survival","opcoes":[{"valor":"survival","rotulo":"Sobrevivência"},{"valor":"creative","rotulo":"Criativo"},{"valor":"adventure","rotulo":"Aventura"},{"valor":"spectator","rotulo":"Espectador"}]},{"chave":"pvp","aba":"geral","forma":"interruptor","rotulo":"PvP","padrao":true},{"chave":"hardcore","aba":"jogadores","forma":"interruptor","rotulo":"Hardcore","ajuda":"Quem morre vira espectador até o mundo acabar.","padrao":false},{"chave":"protecao","aba":"jogadores","grupo":"convivio","forma":"numero","rotulo":"Proteção em volta do nascimento","ajuda":"Em blocos. Só quem é operador constrói ali.","padrao":16,"minimo":0,"maximo":64},{"chave":"inativo","aba":"jogadores","grupo":"convivio","forma":"numero","rotulo":"Tirar quem fica parado","ajuda":"Em minutos. Zero é nunca.","padrao":0,"minimo":0,"maximo":120}],"propriedades":{"motd":"{nome}","max-players":"{maximo}","difficulty":"{dificuldade}","gamemode":"{modo}","pvp":"{pvp}","hardcore":"{hardcore}","spawn-protection":"{protecao}","player-idle-timeout":"{inativo}","server-ip":"127.0.0.1","server-port":"{porta}","online-mode":"true","enable-rcon":"false","enable-query":"false"}},"modpack":{"formato":"modrinth","teto":67108864,"api":"https://api.modrinth.com/v2","pagina":"https://modrinth.com/modpack/","cdn":"cdn.modrinth.com","dominios":["cdn.modrinth.com","github.com","raw.githubusercontent.com","gitlab.com"],"configuracoesDoPack":["default-server.properties"],"loaders":{"fabric-loader":{"nome":"Fabric","medido":true,"instalador":{"fonte":"fixo","destino":"fabric-installer.jar","url":"https://maven.fabricmc.net/net/fabricmc/fabric-installer/1.1.2/fabric-installer-1.1.2.jar","hash":{"algoritmo":"sha512","hex":"3cbe7b69498c44d814fc95e71cd9ce9c12c45a9e1dcf01085cb3e9aaf6fe63134b701065167be1fa6e4c2df19dfa5400bc5b6b1b7fb5e99e334d24dcdca55c20"},"tamanho":212123},"instalar":["-jar","fabric-installer.jar","server","-mcversion","{mc}","-loader","{loader}"],"rodar":["-Xms1G","-Xmx2G","-jar","fabric-server-launch.jar","nogui"],"dominiosDoJogo":["meta.fabricmc.net","maven.fabricmc.net"],"disco":134217728},"quilt-loader":{"nome":"Quilt","medido":false,"instalador":{"fonte":"fixo","destino":"quilt-installer.jar","url":"https://maven.quiltmc.org/repository/release/org/quiltmc/quilt-installer/0.15.1/quilt-installer-0.15.1.jar","hash":{"algoritmo":"sha512","hex":"f001e6e5ee5bed04e8f51a5519fae03874ecf8c7ece0db390896b5a6ea5fdb4a5b43abd77d0c6be5902d846d90cf032167d86af09253e3965be6480181fe07eb"},"tamanho":8734533},"instalar":["-jar","quilt-installer.jar","install","server","{mc}","{loader}","--install-dir=."],"rodar":["-Xms1G","-Xmx2G","-jar","quilt-server-launch.jar","nogui"],"dominiosDoJogo":["meta.quiltmc.org","maven.quiltmc.org","maven.fabricmc.net"],"disco":134217728},"forge":{"nome":"Forge","medido":true,"instalador":{"fonte":"reposilite","destino":"forge-installer.jar","url":"https://maven.minecraftforge.net/net/minecraftforge/forge/{mc}-{loader}/forge-{mc}-{loader}-installer.jar","detalhes":"https://maven.minecraftforge.net/api/maven/details/releases/net/minecraftforge/forge/{mc}-{loader}/forge-{mc}-{loader}-installer.jar","algoritmo":"sha256"},"instalar":["-jar","forge-installer.jar","--installServer"],"rodar":["-Xms1G","-Xmx2G","@libraries/net/minecraftforge/forge/{mc}-{loader}/unix_args.txt","nogui"],"porSistema":[{"plataformas":["windows-x64"],"comando":"java/bin/java.exe","rodar":["-Xms1G","-Xmx2G","@libraries/net/minecraftforge/forge/{mc}-{loader}/win_args.txt","nogui"]}],"dominiosDoJogo":["maven.minecraftforge.net","libraries.minecraft.net","piston-data.mojang.com","piston-meta.mojang.com","launchermeta.mojang.com"],"disco":536870912},"neoforge":{"nome":"NeoForge","medido":true,"instalador":{"fonte":"reposilite","destino":"neoforge-installer.jar","url":"https://maven.neoforged.net/releases/net/neoforged/neoforge/{loader}/neoforge-{loader}-installer.jar","detalhes":"https://maven.neoforged.net/api/maven/details/releases/net/neoforged/neoforge/{loader}/neoforge-{loader}-installer.jar","algoritmo":"sha256"},"instalar":["-jar","neoforge-installer.jar","--install-server"],"rodar":["-Xms1G","-Xmx2G","@libraries/net/neoforged/neoforge/{loader}/unix_args.txt","nogui"],"porSistema":[{"plataformas":["windows-x64"],"comando":"java/bin/java.exe","rodar":["-Xms1G","-Xmx2G","@libraries/net/neoforged/neoforge/{loader}/win_args.txt","nogui"]}],"dominiosDoJogo":["maven.neoforged.net","libraries.minecraft.net","piston-data.mojang.com","piston-meta.mojang.com","launchermeta.mojang.com"],"disco":536870912}}},"mundo":{"pasta":"world","salvar":[{"console":"save-off"},{"console":"save-all flush","esperar":"^\\[[0-9:.]+\\] \\[Server thread/INFO\\](?: \\[[^\\]]+\\])?: Saved the game","prazo":60},{"copiar":"world"},{"console":"save-on"}]},"saida":{"pronto":"^\\[[0-9:.]+\\] \\[Server thread/INFO\\](?: \\[[^\\]]+\\])?: Done \\(","entrou":"^\\[[0-9:.]+\\] \\[Server thread/INFO\\](?: \\[[^\\]]+\\])?: ([A-Za-z0-9_]{1,16}) joined the game$","saiu":"^\\[[0-9:.]+\\] \\[Server thread/INFO\\](?: \\[[^\\]]+\\])?: ([A-Za-z0-9_]{1,16}) left the game$","parar":{"console":"stop","esperar":"^\\[[0-9:.]+\\] \\[Server thread/INFO\\](?: \\[[^\\]]+\\])?: Stopping the server","prazo":60}}}];
const ESQUEMA_DA_RECEITA = null;
// ---- comum.js: o que as três metades usam igual ----
//
// `RECEITAS` e `ESQUEMA_DA_RECEITA` vêm do build (ferramentas/montar.cjs), no
// topo de cada metade.

const EU = 'seele/multiplayer';

/** Bytes de um texto em UTF-8, a conta que os tetos do SEELE fazem. */
function bytesDe(texto) {
  let n = 0;
  for (const c of String(texto)) {
    const p = c.codePointAt(0);
    n += p < 0x80 ? 1 : p < 0x800 ? 2 : p < 0x10000 ? 3 : 4;
  }
  return n;
}

/** Corta um texto em `teto` bytes UTF-8, sem partir um caractere. */
function cortar(texto, teto) {
  let saida = '', n = 0;
  for (const c of String(texto ?? '')) {
    const b = bytesDe(c);
    if (n + b > teto) break;
    saida += c;
    n += b;
  }
  return saida;
}

/** JSON.parse que devolve `null` em vez de lançar. */
function lerJson(texto) {
  if (typeof texto !== 'string') return null;
  try { return JSON.parse(texto); } catch { return null; }
}

/** A frase de um erro qualquer, sem lançar de novo. */
function fraseDoErro(erro) {
  try {
    if (erro && typeof erro === 'object') return String(erro.erro ?? erro.message ?? erro.error ?? JSON.stringify(erro));
    return String(erro);
  } catch {
    return 'erro sem descrição';
  }
}

/** O que um erro traz além da frase, para a tela mostrar com os dados. */
function dadosDoErro(erro) {
  if (!erro || typeof erro !== 'object') return {};
  const dados = {};
  for (const k of Object.keys(erro)) {
    if (k === 'message' || k === 'stack') continue;
    const v = erro[k];
    if (v === undefined || typeof v === 'function') continue;
    dados[k] = v;
  }
  return dados;
}

/** A receita pelo id, ou `null`. */
const receitaPorId = id => RECEITAS.find(r => r.id === id) ?? null;

/** O host de uma URL `https://`, ou `null`. */
function hostDaUrl(url) {
  const m = /^https:\/\/([^/?#:]+)/i.exec(String(url));
  return m ? m[1].toLowerCase() : null;
}

/** Se `host` cai numa das origens (com `*.` valendo para os subdomínios). */
function hostNasOrigens(host, origens) {
  return origens.some(o => o.startsWith('*.') ? host.endsWith(o.slice(1)) : host === o);
}

/** Os bytes UTF-8 de um texto. */
function utf8De(texto) {
  const bytes = [];
  for (const c of String(texto)) {
    const p = c.codePointAt(0);
    if (p < 0x80) bytes.push(p);
    else if (p < 0x800) bytes.push(0xc0 | (p >> 6), 0x80 | (p & 63));
    else if (p < 0x10000) bytes.push(0xe0 | (p >> 12), 0x80 | ((p >> 6) & 63), 0x80 | (p & 63));
    else bytes.push(0xf0 | (p >> 18), 0x80 | ((p >> 12) & 63), 0x80 | ((p >> 6) & 63), 0x80 | (p & 63));
  }
  return bytes;
}

/**
 * O SHA-1 (hexadecimal) dos bytes UTF-8 de um texto, em JS puro: o QuickJS do
 * SEELE não traz `crypto`. Serve para conferir o que a Mojang publica com
 * sha1; não é escolha de segurança nossa.
 */
function sha1Hex(texto) {
  const bytes = utf8De(texto);
  const bits = bytes.length * 8;
  bytes.push(0x80);
  while (bytes.length % 64 !== 56) bytes.push(0);
  // O tamanho em bits, 64 bits big-endian (o alto cabe em 32 bits para o que cabe na memória).
  const alto = Math.floor(bits / 0x100000000), baixo = bits >>> 0;
  for (const w of [alto, baixo]) bytes.push((w >>> 24) & 255, (w >>> 16) & 255, (w >>> 8) & 255, w & 255);
  let h0 = 0x67452301, h1 = 0xefcdab89, h2 = 0x98badcfe, h3 = 0x10325476, h4 = 0xc3d2e1f0;
  const w = new Array(80);
  const rot = (x, n) => ((x << n) | (x >>> (32 - n))) >>> 0;
  for (let i = 0; i < bytes.length; i += 64) {
    for (let t = 0; t < 16; t++) w[t] = ((bytes[i + 4 * t] << 24) | (bytes[i + 4 * t + 1] << 16) | (bytes[i + 4 * t + 2] << 8) | bytes[i + 4 * t + 3]) >>> 0;
    for (let t = 16; t < 80; t++) w[t] = rot(w[t - 3] ^ w[t - 8] ^ w[t - 14] ^ w[t - 16], 1);
    let a = h0, b = h1, c = h2, d = h3, e = h4;
    for (let t = 0; t < 80; t++) {
      let f, k;
      if (t < 20) { f = (b & c) | (~b & d); k = 0x5a827999; }
      else if (t < 40) { f = b ^ c ^ d; k = 0x6ed9eba1; }
      else if (t < 60) { f = (b & c) | (b & d) | (c & d); k = 0x8f1bbcdc; }
      else { f = b ^ c ^ d; k = 0xca62c1d6; }
      const tmp = (rot(a, 5) + (f >>> 0) + e + k + w[t]) >>> 0;
      e = d; d = c; c = rot(b, 30); b = a; a = tmp;
    }
    h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0; h2 = (h2 + c) >>> 0; h3 = (h3 + d) >>> 0; h4 = (h4 + e) >>> 0;
  }
  return [h0, h1, h2, h3, h4].map(x => x.toString(16).padStart(8, '0')).join('');
}

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

// ---- cliente.js: a metade de cliente ----
//
// O seletor de jogos (as receitas e os servidores de jogo que já existem, com
// o estado de cada um), a configuração de um servidor de jogo em quatro abas —
// GERAL · MODS · JOGADORES · MÁQUINA, como no desenho aprovado
// (config-layout-v2) — e o cartão de quem joga, com o «entrar».
//
// # O «entrar» é a primeira coisa do clique
//
// `SeeleUI.tunel.entrar` só vale na volta síncrona do evento `botao`: o
// prelúdio lê o bilhete de gesto na hora da chamada, e um `await` antes dela
// o perde. Por isso o ouvinte trata o `entrar:` antes de tudo, sem esperar
// nada.
//
// # Nada calado
//
// Toda recusa — da ponte, dos cargos, da metade de servidor, do túnel — fica
// na página com o nome e os dados (`estado.aviso`), ou no cartão a que ela
// pertence. Uma página que não monta é dita num aviso do produto e no log.

// As cores do desenho 0.19. As seis que o tema tem nome vão pelo tema
// (`{ tema }`), e acompanham o tema em vigor; as que ele não tem — os chips, o
// vidro, o vermelho da recusa — são os valores do canvas, em hexadecimal.
const COR = Object.freeze({
  fundo: { tema: 'fundo' }, texto: { tema: 'texto' }, acento: { tema: 'acento' }, apagado: { tema: 'apagado' },
  linha: { tema: 'borda' }, painel: { tema: 'painel' },
  vidro: '#ffffff08', vidroBorda: '#ffffff12', controle: '#ffffff1f',
  // chips: verde = ativo, laranja = pendente, azul = oficial (Config-mods)
  verde: '#6BFFB6', verdeFundo: '#06220FB3', verdeBorda: '#6BFFB673',
  laranja: '#FFB48A', laranjaFundo: '#331704B3', laranjaBorda: '#F4773280', icone: '#F477321F',
  azul: '#9CCBF5', azulFundo: '#04182BCC', azulBorda: '#2F8FE08C',
  erro: '#FF6262', erroFundo: '#2F1413CC', erroBorda: '#FF626280',
});
const linhaDe = cor => ({ largura: 1, estilo: 'solida', cor });

const ABAS = Object.freeze([
  { chave: 'aba-geral', rotulo: 'GERAL' },
  { chave: 'aba-mods', rotulo: 'MODS' },
  { chave: 'aba-jogadores', rotulo: 'JOGADORES' },
  { chave: 'aba-maquina', rotulo: 'MÁQUINA' },
]);

const NOME_DAS_PERMISSOES = Object.freeze({
  'criar-servidor-de-jogo': 'Criar um servidor de jogo',
  'configurar-servidor-de-jogo': 'Configurar um servidor de jogo',
  'ligar-desligar-servidor-de-jogo': 'Ligar e desligar um servidor de jogo',
  'entrar-no-jogo': 'Entrar no jogo',
});

/** A frase de cada nome de recusa que este MOD conhece. Um nome fora daqui aparece como é. */
const FRASES = Object.freeze({
  // a máquina e o jogo
  'hash-diferente': 'O hash do arquivo baixado não bate com o que a origem publica. O arquivo foi apagado.',
  'sem-java-para-esta-maquina': 'A Adoptium não publica o Java desta versão para o sistema desta máquina.',
  'o-jogo-caiu': 'O jogo parou sozinho. As últimas linhas da saída estão nos dados.',
  'nao-parou-no-prazo': 'O jogo não parou no prazo depois do stop e foi encerrado à força.',
  'o-jogo-nao-respondeu': 'O jogo não respondeu no prazo; o salvamento automático foi religado.',
  'o-jogo-saiu': 'O jogo saiu no meio do salvamento.',
  'nao-e-a-dona': 'Uma máquina que não é a dona deste servidor de jogo tentou rodá-lo, e foi mandada parar.',
  'aviso-desconhecido': 'A máquina recebeu uma ordem que ela não conhece: as versões do MOD diferem.',
  'servidor-desligado': 'O servidor de jogo está desligado.',
  // as origens
  'origem-nao-respondeu': 'A origem não respondeu.',
  'origem-ilegivel': 'A origem respondeu algo que não é o que se esperava.',
  'url-fora-das-origens': 'Uma URL de download não está nas origens da receita.',
  'versao-sem-servidor': 'Esta versão não tem servidor oficial.',
  'versao-desconhecida': 'A origem não conhece esta versão.',
  'sha1-diferente': 'O arquivo da versão não bate com o sha1 que a Mojang publica; não foi usado.',
  'manifesto-sem-sha1': 'O manifesto da Mojang não traz o sha1 desta versão; não dá para conferir.',
  // a metade de servidor
  'pede-a-acao': 'Isto só vale pela ação com permissão.',
  'acao-nao-serve': 'Esta permissão não serve para isso.',
  'desligue-antes': 'Desligue o servidor de jogo antes de trocar a versão, a máquina ou de apagá-lo.',
  'config-invalida': 'Há campos que não servem; veja cada um.',
  'servidores-demais': 'Este servidor SEELE já tem o máximo de servidores de jogo.',
  'sem-versao': 'Escolha a versão do jogo antes de ligar.',
  'sem-maquina': 'Escolha a máquina antes de ligar.',
  'comando-invalido': 'O comando é uma linha só, de até 256 bytes.',
  'oferta-recusada': 'O SEELE recusou a oferta antes de mostrá-la à pessoa da máquina.',
  'receita-desconhecida': 'Este MOD não tem essa receita.',
  'receita-invalida': 'A receita não passou no validador.',
  'variante-indisponivel': 'Essa variante ainda não existe.',
  'servidor-desconhecido': 'Esse servidor de jogo não existe mais.',
  // o aceite
  'pelo-dono': 'A pessoa da máquina disse não, ou desligou.',
  'sem-tela': 'Essa máquina não tem tela onde aceitar.',
  'so-no-app': 'Só funciona no app de computador.',
  'pacote-diferente': 'A máquina tem outra versão deste MOD.',
  'oferta-invalida': 'A oferta não passou na conferência do SEELE.',
  'nao-esta-aqui': 'A pessoa não está no servidor agora.',
  'pendentes-demais': 'Há pedidos de máquina demais esperando resposta.',
  'maquinas-demais': 'Há máquinas de jogo demais neste servidor.',
  'revogada': 'A pessoa revogou a autorização.',
  'app-fechou': 'O app da máquina fechou.',
  'metade-falhou': 'A metade de máquina do MOD falhou.',
  'saiu': 'A pessoa saiu do servidor.',
  'mod-desligado': 'O MOD foi desligado.',
  'outro-pedido': 'Outra máquina foi escolhida.',
  // o túnel
  'fora-de-um-clique': 'O SEELE só abre a porta de dentro de um clique.',
  'nao-existe': 'Nenhuma máquina serve esse jogo agora.',
  'sem-permissao': 'Você não tem a permissão para isso neste servidor.',
  'acao-nao-declarada': 'O MOD não declara essa permissão.',
  'mod-sem-porta': 'O MOD não está ligado neste servidor, ou não tem o túnel.',
  'nome-tomado': 'Outra máquina já serve um jogo com esse nome.',
  'maquina-saiu': 'A máquina do jogo saiu do servidor.',
  'tuneis-demais': 'O servidor já tem túneis demais.',
  'canais-esgotados': 'Não há canais de túnel livres para você agora.',
  'servidor-antigo': 'O servidor SEELE é antigo demais para túneis.',
  'porta-local-ocupada': 'A porta do jogo e as 64 seguintes estão ocupadas neste computador.',
  'sem-resposta': 'O servidor não respondeu a tempo.',
  'fora-do-aceite': 'A máquina não aceitou servir este jogo, ou nesta porta.',
  'tunel-indisponivel': 'Este app não abre túnel de jogo.',
  // o modpack (parte 6)
  'sem-pack': 'Escolha o modpack na aba MODS antes de ligar.',
  'arquivo-grande-demais': 'O arquivo passa do teto que o SEELE envia. Para um modpack, use o link do Modrinth: por ele nada passa pelo envio.',
  'pack-grande-para-o-link': 'Este modpack é grande demais para ser lido pelo link (até 4 MiB): envie o arquivo .mrpack.',
  'link-nao-e-do-modrinth': 'Cole o link de um modpack do Modrinth, como https://modrinth.com/modpack/nome.',
  'modpack-sem-versoes': 'O Modrinth não tem versões desse modpack.',
  'versao-do-modpack-desconhecida': 'O Modrinth não tem essa versão do modpack.',
  'versao-sem-mrpack': 'Essa versão do modpack não tem arquivo .mrpack.',
  'mrpack-fora-do-cdn': 'O .mrpack dessa versão não está no CDN do Modrinth.',
  'mrpack-sem-hash': 'O Modrinth não publica o sha512 desse .mrpack.',
  'nao-e-pack': 'O arquivo não é um .mrpack: falta o modrinth.index.json na raiz.',
  'formato-desconhecido': 'O arquivo não é de um formato que o SEELE aceita aqui.',
  'indice-ilegivel': 'O modrinth.index.json do pack não se lê.',
  'hash-nao-bate': 'O pack baixado não tem o hash que o Modrinth publica.',
  'busca-falhou': 'O Modrinth não respondeu.',
  'dependencia-desconhecida': 'O pack pede uma dependência que este MOD não conhece; ele não foi usado.',
  'loaders-demais': 'O pack pede mais de um loader.',
  'loader-sem-receita': 'Este MOD não sabe instalar o loader que o pack pede.',
  'pack-sem-minecraft': 'O pack não diz a versão do Minecraft.',
  'caminho-recusado': 'Um arquivo do pack tem um caminho absoluto ou com «..», e o pack foi recusado.',
  'sem-sha512': 'Um arquivo do pack não traz o sha512, e o pack foi recusado.',
  'download-fora-dos-dominios': 'Um arquivo do pack vem de fora dos domínios aceitos (cdn.modrinth.com, github.com, raw.githubusercontent.com, gitlab.com).',
  'pack-nao-confere': 'O índice do pack na máquina não é o que foi aceito.',
  'pack-diferente': 'O pack que chegou à máquina não tem o hash do aceite; nada foi gravado.',
  'pack-nao-veio': 'A máquina não conseguiu trazer o pack do servidor.',
  'instalador-falhou': 'O instalador do loader saiu com erro; as últimas linhas estão nos dados.',
  'instalador-sem-hash': 'O Maven do loader não publica o hash do instalador.',
  'instalador-sem-tamanho': 'O Maven do loader não diz o tamanho do instalador.',
  'loader-sem-este-sistema': 'Este loader ainda não roda no sistema desta máquina.',
  'sem-pack-enviado': 'Este servidor de jogo não tem um pack enviado para baixar.',
  'envio-desconhecido': 'O envio do pack não é conhecido: comece de novo.',
  'espera-recusada': 'O SEELE não abriu o envio do pack.',
  // a metade de servidor: a reserva, a configuração e o reinício
  'quem-invalido': 'A máquina escolhida não é uma pessoa deste servidor.',
  'mesma-pessoa-nas-duas': 'A mesma pessoa não pode ser a principal e a reserva.',
  'intervalo-invalido': 'O intervalo da cópia vai de 1 a 60 minutos.',
  'passe-antes': 'A reserva roda o jogo agora: passe à principal antes de trocar a reserva ou a máquina.',
  'sem-reserva': 'Escolha uma reserva antes de passar.',
  'outra-sem-aceite': 'A outra máquina ainda não aceitou: passar só depois do aceite dela.',
  'ja-passando': 'Já há uma passagem em curso.',
  'dona-fora-e-sem-copia': 'A máquina que roda o jogo não está aqui e a outra não tem a última cópia do mundo: passar agora perderia o mundo.',
  'esperando-as-maquinas': 'O servidor SEELE acabou de subir e a máquina que roda o jogo ainda não respondeu: passe depois que ela voltar.',
  'passagem-interrompida': 'O servidor SEELE reiniciou no meio da passagem, e ela foi cancelada. Passe de novo quando as duas máquinas voltarem.',
  'nao-e-desta-maquina': 'Uma máquina que não roda este servidor de jogo falou por ele, e foi mandada parar.',
  'voltou-rodando-sem-a-posse': 'A máquina que voltou com o jogo de pé não era mais a dona, e desligou o jogo dela.',
  'reserva-sem-copia': 'A máquina que rodava sumiu, mas a reserva ainda não tinha uma cópia do mundo: ela não assumiu, para não começar um mundo vazio.',
  'a-reserva-assumiu': 'A outra máquina assumiu o jogo com a última cópia do mundo.',
  'sem-reserva-para-a-copia': 'O mundo foi salvo; sem reserva, não há para quem copiá-lo.',
  'sem-tunel-de-copia': 'A oferta aceita não tem o túnel da cópia: a máquina precisa aceitar de novo, com a reserva escolhida.',
  'sem-aceite': 'A máquina ainda não aceitou este servidor de jogo.',
  'pack-sumiu': 'O pack enviado sumiu do servidor SEELE: envie de novo.',
  'op-desconhecida': 'Este MOD não conhece esse pedido: as versões do MOD diferem.',
  'estado-desconhecido': 'A máquina contou um estado que este MOD não conhece: as versões do MOD diferem.',
  // a ponte
  'sessao-encerrada': 'A sessão acabou antes da resposta.',
  'bridge-refused': 'A metade de servidor do MOD falhou ao responder.',
  'quintal-cheio': 'O espaço do MOD no servidor acabou.',
  'too-many-requests': 'Pedidos demais de uma vez.',
  'mensagem-grande': 'A mensagem passou do teto do SEELE.',
});

const ROTULO_DO_ESTADO = Object.freeze({
  desligado: 'DESLIGADO', baixando: 'BAIXANDO', instalando: 'INSTALANDO O LOADER', pronto: 'PRONTO PARA LIGAR', ligando: 'LIGANDO',
  ligado: 'LIGADO', parando: 'DESLIGANDO', salvando: 'SALVANDO', caiu: 'CAIU',
  // O servidor SEELE subiu de novo e chamou a máquina de volta.
  'esperando-maquina': 'ESPERANDO A MÁQUINA',
});

const fraseDe = erro => FRASES[erro] ?? '';

/**
 * A frase de uma falha anotada: a parada ou a recusa pela pessoa da máquina é
 * dita com o nome dela e com o que ela fez. O servidor sabe se foi recusar o
 * pedido ou DESLIGAR depois de aceitar (o momento), e «disse não, ou desligou»
 * escondia qual dos dois — visto no e2e da API 8, no app de verdade.
 */
function fraseDaFalha(f) {
  const quem = f?.dados?.pessoa != null ? apelidoDe(f.dados.pessoa) : null;
  const pessoa = quem ?? 'A pessoa da máquina';
  if (f?.erro === 'pelo-dono' && f.momento === 'parou') return `${pessoa} desligou o jogo na máquina dela.`;
  if (f?.erro === 'pelo-dono' && f.momento === 'recusou') return `${pessoa} recusou o pedido de máquina.`;
  if (f?.erro === 'revogada' && quem) return `${pessoa} revogou a autorização.`;
  if (f?.erro === 'nao-esta-aqui' && quem) return `${pessoa} não está conectada a este servidor SEELE agora.`;
  if (f?.erro === 'desligou-sem-maquina') {
    return `${pessoa} não está conectada ao SEELE agora, e o servidor de jogo ficou desligado aqui. Se o jogo seguiu rodando na máquina dela, ele para quando ela voltar, ou sozinho, salvo, em até 10 minutos.`;
  }
  if (f?.erro === 'mundo-mais-novo') {
    return `O mundo deste servidor de jogo rodou por último na versão ${f.dados?.mundo}. A ${f.dados?.pedida} é mais velha e não abre um mundo de uma versão mais nova: comece um mundo novo (o de agora fica guardado na máquina) ou mantenha a ${f.dados?.mundo}.`;
  }
  if (f?.erro === 'o-jogo-caiu') return fraseDaQuedaDoJogo(f.dados ?? {});
  return fraseDe(f?.erro);
}

/** As linhas de um jogo que caiu ao abrir um mundo de uma versão mais nova (medido: Fabric 1.21.4 num mundo do 26.3). */
const MUNDO_MAIS_NOVO = /No key (dimensions|seed)|newer version|was last played in|Unsupported (world|level)|Failed to (load|read) level/i;

/** A queda do jogo em frase: a causa que se reconhece, ou o código; a pilha fica nos detalhes. */
function fraseDaQuedaDoJogo(d) {
  const linhas = Array.isArray(d.linhas) ? d.linhas.join('\n') : '';
  if (d.versaoDoMundo || MUNDO_MAIS_NOVO.test(linhas)) {
    const de = d.versaoDoMundo ? ` (a ${d.versaoDoMundo})` : '';
    return `O jogo caiu ao abrir o mundo: ele parece ser de uma versão mais nova${de} que a ${d.versao ?? 'escolhida'}. Volte à versão do mundo, ou troque a versão e comece um mundo novo.`;
  }
  return `O jogo parou sozinho${d.codigo != null ? `, com o código ${d.codigo}` : ''}. As últimas linhas que ele escreveu estão nos detalhes.`;
}

// ---------------------------------------------------------------- as formas

/**
 * As classes da página: o estilo que se repete vai uma vez, na superfície, e
 * cada nó só diz o nome. Com o estilo escrito em cada nó, oito cartões
 * passavam dos 12 KiB de uma montagem.
 */
const CLASSES = Object.freeze({
  lb: { base: { familia: 'mono', corpo: 11, cor: COR.apagado, espacamento: 1, transformar: 'maiuscula' } },
  ap: { base: { familia: 'sans', cor: COR.apagado, corpo: 14, entrelinha: 1.5 } },
  mono: { base: { familia: 'mono', corpo: 12, cor: COR.apagado } },
  // Os chips do canvas: pílula de mono 11, a cor diz o estado.
  chip: { base: { familia: 'mono', corpo: 11, espacamento: 1, raio: 999, preenchimento: 4, cor: COR.apagado, borda: linhaDe(COR.controle) } },
  chipV: { base: { familia: 'mono', corpo: 11, espacamento: 1, raio: 999, preenchimento: 4, cor: COR.verde, fundo: COR.verdeFundo, borda: linhaDe(COR.verdeBorda) } },
  chipL: { base: { familia: 'mono', corpo: 11, espacamento: 1, raio: 999, preenchimento: 4, cor: COR.laranja, fundo: COR.laranjaFundo, borda: linhaDe(COR.laranjaBorda) } },
  chipA: { base: { familia: 'mono', corpo: 11, espacamento: 1, raio: 999, preenchimento: 4, cor: COR.azul, fundo: COR.azulFundo, borda: linhaDe(COR.azulBorda) } },
  chipE: { base: { familia: 'mono', corpo: 11, espacamento: 1, raio: 999, preenchimento: 4, cor: COR.erro, fundo: COR.erroFundo, borda: linhaDe(COR.erroBorda) } },
  // O cartão de vidro (18) e o painel (24); o cartão ligado leva a borda verde.
  cartao: { base: { fundo: COR.vidro, borda: linhaDe(COR.vidroBorda), raio: 18, preenchimento: 18 } },
  aceso: { base: { fundo: COR.vidro, borda: linhaDe(COR.verdeBorda), raio: 18, preenchimento: 18 } },
  // A recusa: a faixa vermelha do canvas (Porta).
  quadro: { base: { fundo: COR.erroFundo, raio: 18, preenchimento: 14, borda: linhaDe(COR.erroBorda) } },
  // O aviso: a caixa laranja do canvas (Mods-aceite, «isto mudou desde o seu
  // aceite»), com o rótulo miúdo no laranja.
  alerta: { base: { fundo: COR.laranjaFundo, raio: 18, preenchimento: 14, borda: linhaDe(COR.laranjaBorda) } },
  lbL: { base: { familia: 'mono', corpo: 11, cor: COR.laranja, espacamento: 1, transformar: 'maiuscula' } },
  erro: { base: { familia: 'mono', corpo: 13, cor: COR.erro } },
  // A marca do jogo, no ladrilho laranja dos cartões de MOD.
  ic: { base: { familia: 'mono', corpo: 14, peso: 'forte', cor: COR.acento, fundo: COR.icone, raio: 12, preenchimento: 10 } },
  grande: { base: { familia: 'sans', corpo: 18, peso: 'forte' } },
  titulo: { base: { familia: 'sans', corpo: 30, peso: 'forte', espacamento: -1, cor: COR.texto, entrelinha: 1.1 } },
});

const lb = (texto, chave) => ({ forma: 'texto', ...(chave ? { chave } : {}), dentro: String(texto).toUpperCase(), classe: 'lb' });
const tx = (texto, estilo, extra) => ({ forma: 'texto', dentro: String(texto), ...(estilo ? { estilo } : {}), ...extra });
const cl = (texto, classe, extra) => ({ forma: 'texto', dentro: String(texto), classe, ...extra });
const apagado = (texto, extra) => cl(texto, 'ap', extra);
const mono = (texto, extra) => cl(texto, 'mono', extra);
const pilha = (dentro, intervalo = 8, extra) => ({ forma: 'pilha', dentro: dentro.filter(Boolean), estilo: { intervalo }, ...extra });
const linhaH = (dentro, extra) => ({ forma: 'linha', dentro: dentro.filter(Boolean), estilo: { intervalo: 10, alinhar: 'centro', quebra: 'sim' }, ...extra });
const bloco = (rotulo, dentro, extra) => pilha([lb(rotulo), ...dentro], 8, extra);
const separador = () => ({ forma: 'separador', estilo: { cor: COR.linha } });
const chip = (texto, chave, classe = 'chip') => ({ forma: 'distintivo', ...(chave ? { chave } : {}), dentro: String(texto).toUpperCase(), classe });
const botao = (chave, dentro, extra = {}) => ({ forma: 'botao', chave, dentro, ...extra });

/**
 * O quadro de recusa: **a frase**, e o nome cru e os dados atrás de DETALHES
 * (e2e da API 8, 31/10: «O QUE DEU ERRADO» mostrava `pelo-dono` e
 * `{"pessoa":"2"}`, e a queda do jogo, a pilha inteira).
 */
function quadroDeFalha(f, chave) {
  const qual = chave ?? `${f.onde ?? ''}:${f.erro}`;
  const aberto = estado.detalhes.has(qual);
  const { linhas, ...resto } = f.dados ?? {};
  const dados = Object.keys(resto).length ? cortar(JSON.stringify(resto), 240) : '';
  const frase = fraseDaFalha(f) || `Algo falhou aqui, e este MOD não tem uma frase para isso ainda (${f.erro}).`;
  return {
    forma: 'caixa', ...(chave ? { chave } : {}), classe: 'quadro',
    dentro: [pilha([
      tx(frase, { corpo: 14 }),
      estado.enxuta ? null : linhaH([botao('detalhes:' + qual, aberto ? 'ESCONDER OS DETALHES' : 'DETALHES', { variante: 'discreta' })]),
      aberto && !estado.enxuta ? cl(`${f.erro}${f.onde ? ` · ${f.onde}${f.etapa ? '/' + f.etapa : ''}` : ''}`, 'erro') : null,
      aberto && !estado.enxuta && dados ? mono(dados) : null,
      aberto && !estado.enxuta && Array.isArray(linhas) && linhas.length
        ? { forma: 'pilha', estilo: { intervalo: 2 }, dentro: linhas.slice(-12).map(l => mono(cortar(String(l), 200))) }
        : null,
    ], 6)],
  };
}

// ---------------------------------------------------------------- o estado

const estado = {
  aberta: false, punho: null, dados: null, retrato: null,
  vista: 'seletor', atual: null, aba: 'aba-geral',
  rascunho: null, palavra: {}, erros: {}, aviso: null, versoes: {},
  portas: {}, entradas: {}, consoleTexto: '', situacao: null,
  // O modpack: o link digitado, o envio em curso e o pack salvo por quem joga.
  packLink: '', enviando: null, salvos: {},
  // A página passou do teto de uma montagem: o resumo, sem os dados longos.
  enxuta: false,
  // O que o produto ouviu do `suja` por último (null: não se sabe, e o próximo diz).
  suja: null,
  // Os quadros de falha com os detalhes abertos.
  detalhes: new Set(),
  // A recusa «mundo-mais-novo» espera a escolha: de onde veio, e o envio.
  retomar: null,
};

const pode = acao => Boolean(estado.dados?.podem?.includes(acao));
const servidorAtual = () => estado.dados?.servidores.find(s => s.id === estado.atual) ?? null;
const apelidoDe = quem => {
  const p = estado.retrato?.pessoas?.find(x => String(x.id) === String(quem));
  return p ? p.apelido : quem ? `a pessoa ${quem}` : null;
};

/** O que a ponte, os cargos ou a metade de servidor recusaram, na forma do aviso. */
function recusaDe(resposta, onde) {
  if (resposta && resposta.ok === false) {
    const erro = resposta.erro ?? resposta.recusa ?? resposta.error ?? 'falhou';
    const dados = {};
    for (const [k, v] of Object.entries(resposta)) if (!['ok', 'erro', 'recusa', 'error', 'servidor'].includes(k)) dados[k] = v;
    return { erro, onde, dados };
  }
  return null;
}

async function pedir(valor) {
  try {
    return await SeeleMods.request(EU, 0, valor);
  } catch (erro) {
    return { ok: false, erro: erro?.erro ?? fraseDoErro(erro), ...dadosDoErro(erro) };
  }
}

async function agir(acao, valor) {
  try {
    return await SeeleMods.acao(EU, 0, acao, valor);
  } catch (erro) {
    return { ok: false, erro: erro?.erro ?? fraseDoErro(erro), ...dadosDoErro(erro) };
  }
}

function avisar(falha) {
  estado.aviso = falha;
  console.warn(`multiplayer: ${falha.onde}: ${falha.erro} ${JSON.stringify(falha.dados ?? {})}`);
}

async function carregar() {
  const r = await pedir({ op: 'estado' });
  const recusa = recusaDe(r, 'estado');
  if (recusa) {
    avisar(recusa);
    return;
  }
  if (!r || r.ok !== true) {
    avisar({ erro: 'resposta-estranha', onde: 'estado', dados: { resposta: cortar(JSON.stringify(r), 200) } });
    return;
  }
  estado.dados = r;
  const s = servidorAtual();
  if (estado.vista === 'config' && !s) {
    estado.vista = 'seletor';
    estado.atual = null;
  }
}

async function carregarVersoes(receita) {
  const r = await pedir({ op: 'versoes', receita });
  estado.versoes[receita] = r && r.ok ? r.versoes : { falha: recusaDe(r, 'versoes') ?? { erro: 'resposta-estranha', onde: 'versoes', dados: {} } };
  if (estado.rascunho && estado.rascunho.versao === null && Array.isArray(estado.versoes[receita])) {
    estado.rascunho.versao = estado.versoes[receita][0] ?? null;
  }
}

function rascunhoDe(s) {
  return {
    versao: s.versao, quem: s.quem, config: JSON.parse(JSON.stringify(s.config ?? {})), variante: s.variante ?? 'vanilla',
    reserva: s.reserva?.quem ?? null, intervaloDaCopia: s.intervaloDaCopia ?? 5,
  };
}

async function abrirConfig(id) {
  estado.vista = 'config';
  estado.atual = id;
  estado.aba = 'aba-geral';
  estado.erros = {};
  estado.palavra = {};
  estado.situacao = null;
  const s = servidorAtual();
  if (!s) return;
  estado.rascunho = rascunhoDe(s);
  if (!estado.versoes[s.receita] || estado.versoes[s.receita].falha) await carregarVersoes(s.receita);
  else if (estado.rascunho.versao === null) estado.rascunho.versao = estado.versoes[s.receita][0] ?? null;
}

// ---------------------------------------------------------------- o entrar

/** Chamado na volta síncrona do clique: o túnel antes de qualquer espera. */
function entrar(id) {
  let promessa;
  try {
    promessa = SeeleUI.tunel.entrar(id);
  } catch (erro) {
    promessa = Promise.reject(SeeleUI.tunel ? erro : { erro: 'tunel-indisponivel' });
  }
  Promise.resolve(promessa).then(
    porta => {
      estado.portas[id] = porta;
      delete estado.entradas[id];
    },
    erro => {
      estado.entradas[id] = { erro: erro?.erro ?? fraseDoErro(erro), onde: 'entrar', dados: dadosDoErro(erro) };
      console.warn(`multiplayer: entrar em ${id}: ${estado.entradas[id].erro}`);
    },
  ).then(pintar);
}

// ---------------------------------------------------------------- o pack

/**
 * **Quem joga recebe o pack** pelo diálogo de salvar do sistema
 * (`SeeleUI.salvar`, API 8 parte 6): chamado na volta síncrona do clique, como
 * o túnel. O caminho fica com a pessoa; o cartão diz quantos bytes vieram.
 */
function salvarPack(id) {
  const s = estado.dados?.servidores.find(x => x.id === id);
  const nome = cortar(`${s?.pack?.nome || id}.mrpack`, 80);
  let promessa;
  try {
    promessa = SeeleUI.salvar({ pedido: { op: 'pack-ler', id }, nome });
  } catch (erro) {
    promessa = Promise.reject(SeeleUI.salvar ? erro : { erro: 'salvar-indisponivel' });
  }
  Promise.resolve(promessa).then(
    salvo => { estado.salvos[id] = salvo ? { bytes: salvo.bytes } : { cancelado: true }; },
    erro => {
      estado.salvos[id] = { falha: { erro: erro?.erro ?? fraseDoErro(erro), onde: 'salvar-pack', dados: dadosDoErro(erro) } };
      console.warn(`multiplayer: salvar o pack de ${id}: ${estado.salvos[id].falha.erro}`);
    },
  ).then(pintar);
}

/**
 * **O pack define a variante e a versão, e só elas** (revisão final, M11): o
 * resto do rascunho é o que a pessoa escreveu e ainda não salvou, e trocar o
 * rascunho inteiro pelo gravado o apagava.
 */
function tomarDoPack() {
  const novo = servidorAtual();
  if (!novo) return;
  if (!estado.rascunho) estado.rascunho = rascunhoDe(novo);
  else estado.rascunho = { ...estado.rascunho, variante: novo.variante ?? 'com-mods', versao: novo.versao };
}

/** O link do Modrinth vira o pack do servidor de jogo atual. */
async function usarLink(mundo) {
  const s = servidorAtual();
  if (!s) return;
  const r = await agir('configurar-servidor-de-jogo', { op: 'pack-link', id: s.id, link: estado.packLink, ...(mundo ? { mundo } : {}) });
  if (await aposAcao(r, 'pack-link')) {
    estado.packLink = '';
    tomarDoPack();
  }
}

/**
 * **O `.mrpack` escolhido vai ao volume da metade de servidor**: ela abre a
 * espera, o produto manda os bytes (e confere que é um pack, até 64 MiB), e
 * ela abre o pack. A recusa — o tamanho e o teto, o formato — fica na página,
 * e o arquivo escolhido é solto.
 */
async function enviarPack(arquivo) {
  const s = servidorAtual();
  if (!s) return;
  estado.enviando = { bytes: arquivo.bytes };
  try {
    const espera = await agir('configurar-servidor-de-jogo', { op: 'pack-enviar', id: s.id });
    if (recusaDe(espera, 'pack-enviar')) return void avisar(recusaDe(espera, 'pack-enviar'));
    try {
      await SeeleUI.enviar(arquivo.id, espera.token);
    } catch (erro) {
      return void avisar({ erro: erro?.erro ?? fraseDoErro(erro), onde: 'pack-enviar', dados: dadosDoErro(erro) });
    }
    const r = await agir('configurar-servidor-de-jogo', { op: 'pack-chegou', id: s.id, token: espera.token });
    if (await aposAcao(r, 'pack-chegou')) tomarDoPack();
  } finally {
    estado.enviando = null;
    SeeleUI.soltar?.(arquivo.id)?.catch?.(() => {});
  }
}

// ---------------------------------------------------------------- os eventos

async function aposAcao(r, onde) {
  const recusa = recusaDe(r, onde);
  if (recusa) avisar(recusa);
  else estado.aviso = null;
  estado.retomar = recusa?.erro === 'mundo-mais-novo' ? { onde, token: r.token ?? null } : null;
  await carregar();
  return !recusa;
}

async function salvar(mundo) {
  const s = servidorAtual();
  if (!s || !estado.rascunho) return;
  const r = await agir('configurar-servidor-de-jogo', {
    op: 'configurar', id: s.id, variante: estado.rascunho.variante, versao: estado.rascunho.versao, quem: estado.rascunho.quem, config: estado.rascunho.config,
    reserva: estado.rascunho.reserva ?? null, intervaloDaCopia: estado.rascunho.intervaloDaCopia ?? 5,
    ...(mundo ? { mundo } : {}),
  });
  if (r?.ok === false && r.erro === 'config-invalida') {
    estado.erros = r.erros ?? {};
    avisar({ erro: 'config-invalida', onde: 'salvar', dados: {} });
    return;
  }
  estado.erros = {};
  if (await aposAcao(r, 'salvar')) {
    const novo = servidorAtual();
    if (novo) estado.rascunho = rascunhoDe(novo);
  }
}

async function ligarOuDesligar(id, ligar) {
  const r = await agir('ligar-desligar-servidor-de-jogo', { op: ligar ? 'ligar' : 'desligar', id });
  estado.situacao = r?.ok && r.esperando === 'aceite' ? 'Liga assim que a pessoa da máquina aceitar: esperando o aceite.' : null;
  await aposAcao(r, ligar ? 'ligar' : 'desligar');
  // DESLIGAR sem máquina para ouvir não é calado: o aviso diz o que acontece.
  if (r?.ok && r.semMaquina) avisar({ erro: 'desligou-sem-maquina', onde: 'desligar', dados: { pessoa: r.semMaquina.quem } });
}

/**
 * **A escolha do mundo mais novo** (`mundo-mais-novo`): começar um mundo novo
 * repete o pedido com `mundo: 'novo'`; manter a versão volta o rascunho à do
 * mundo (e um pack enviado sai do servidor SEELE).
 */
async function escolherOMundo(escolha) {
  const r0 = estado.retomar;
  estado.retomar = null;
  estado.aviso = null;
  const s = servidorAtual();
  if (!r0 || !s) return;
  if (r0.onde === 'salvar') {
    if (escolha === 'novo') return salvar('novo');
    if (estado.rascunho) estado.rascunho.versao = s.versao;
  } else if (r0.onde === 'pack-link') {
    if (escolha === 'novo') return usarLink('novo');
  } else if (r0.onde === 'pack-chegou') {
    const r = await agir('configurar-servidor-de-jogo', { op: 'pack-chegou', id: s.id, token: r0.token, mundo: escolha === 'novo' ? 'novo' : 'manter' });
    if ((await aposAcao(r, 'pack-chegou')) && escolha === 'novo') tomarDoPack();
  }
}

async function tratarBotao(chave) {
  const [nome, id] = chave.split(/:(.*)/s);
  if (chave === 'voltar') {
    estado.vista = 'seletor';
    estado.atual = null;
    estado.aviso = null;
  } else if (chave === 'fechar-aviso') {
    estado.aviso = null;
    estado.retomar = null;
  } else if (nome === 'detalhes') {
    if (estado.detalhes.has(id)) estado.detalhes.delete(id);
    else estado.detalhes.add(id);
  } else if (nome === 'mundo') {
    await escolherOMundo(id);
  } else if (nome === 'criar') {
    const r = await agir('criar-servidor-de-jogo', { op: 'criar', receita: id });
    if (await aposAcao(r, 'criar')) await abrirConfig(r.servidor.id);
  } else if (nome === 'configurar') {
    estado.aviso = null;
    await abrirConfig(id);
  } else if (nome === 'variante') {
    const s = servidorAtual();
    const v = receitaPorId(s?.receita)?.variantes[id];
    if (v && v.disponivel !== false && estado.rascunho) estado.rascunho.variante = id;
    else avisar({ erro: 'variante-indisponivel', onde: 'variante', dados: { variante: id, porque: v?.porque ?? null } });
  } else if (nome === 'palavra-mais' || nome === 'palavra-tirar' || nome === 'amostra') {
    mexerNasPalavras(nome, id);
  } else if (chave === 'salvar') {
    await salvar();
  } else if (chave === 'ligar' || chave === 'desligar') {
    await ligarOuDesligar(estado.atual, chave === 'ligar');
  } else if (nome === 'ligar' || nome === 'desligar') {
    await ligarOuDesligar(id, nome === 'ligar');
  } else if (chave === 'apagar') {
    const r = await agir('criar-servidor-de-jogo', { op: 'apagar', id: estado.atual });
    if (await aposAcao(r, 'apagar')) {
      estado.vista = 'seletor';
      estado.atual = null;
    }
  } else if (chave === 'pack:link') {
    await usarLink();
  } else if (chave === 'passar') {
    // A passagem avisada à outra máquina (parte 7).
    const r = await agir('ligar-desligar-servidor-de-jogo', { op: 'passar', id: estado.atual });
    await aposAcao(r, 'passar');
  } else if (chave === 'console:enviar') {
    const r = await agir('configurar-servidor-de-jogo', { op: 'console', id: estado.atual, comando: estado.consoleTexto });
    if (await aposAcao(r, 'console')) estado.consoleTexto = '';
  } else {
    avisar({ erro: 'botao-desconhecido', onde: 'tela', dados: { chave } });
  }
}

/** Põe uma palavra no fim do nome, tira a escolhida, ou escolhe a de índice `i` (`amostra:nome:2`). */
function mexerNasPalavras(botaoNome, id) {
  if (!estado.rascunho) return;
  const [chave, indice] = id.split(':');
  const campo = receitaPorId(servidorAtual()?.receita)?.configuracao.campos.find(c => c.chave === chave && c.forma === 'segmentos');
  const lista = estado.rascunho.config[chave];
  if (!campo || !Array.isArray(lista)) return;
  const atual = Math.min(estado.palavra[chave] ?? 0, lista.length - 1);
  if (botaoNome === 'palavra-mais' && lista.length < campo.maximoSegmentos) {
    lista.push({ texto: '', cor: lista[atual].cor });
    estado.palavra[chave] = lista.length - 1;
  } else if (botaoNome === 'palavra-tirar' && lista.length > 1) {
    lista.splice(atual, 1);
    estado.palavra[chave] = Math.min(atual, lista.length - 1);
  } else if (botaoNome === 'amostra' && lista[Number(indice)]) {
    estado.palavra[chave] = Number(indice);
  }
  delete estado.erros[chave];
}

function tratarCampo(evento) {
  const { chave, valor } = evento;
  if (chave === 'console:texto') {
    estado.consoleTexto = String(valor ?? '');
    return false;
  }
  if (chave === 'pack:link-texto') {
    const antes = estado.packLink;
    estado.packLink = String(valor ?? '');
    // Repinta só quando o USAR O LINK liga ou desliga.
    return !antes !== !estado.packLink;
  }
  if (!estado.rascunho) return false;
  if (chave === 'versao') estado.rascunho.versao = valor || null;
  else if (chave === 'quem') estado.rascunho.quem = valor ? String(valor) : null;
  else if (chave === 'reserva') estado.rascunho.reserva = valor ? String(valor) : null;
  else if (chave === 'intervaloDaCopia') estado.rascunho.intervaloDaCopia = Number(valor);
  else if (chave.startsWith('cfg:')) {
    // `cfg:nome` é um campo; `cfg:nome:2:texto` é o texto da palavra 3 de uma lista;
    // `cfg:nome:cor` é a cor da palavra escolhida.
    const [campo, a, b] = chave.slice(4).split(':');
    const lista = estado.rascunho.config[campo];
    let parte = null;
    if (a === undefined) {
      estado.rascunho.config[campo] = valor;
    } else if (a === 'cor' && Array.isArray(lista)) {
      parte = 'cor';
      const palavra = lista[Math.min(estado.palavra[campo] ?? 0, lista.length - 1)];
      if (!palavra) return false;
      palavra.cor = valor;
    } else if (b === 'texto' && lista?.[Number(a)]) {
      parte = 'texto';
      lista[Number(a)].texto = valor;
    } else return false;
    const tinhaErro = campo in estado.erros;
    delete estado.erros[campo];
    // Repinta a amostra da cor e tira a recusa; o resto o produto já mostra.
    return parte === 'cor' || tinhaErro;
  } else return false;
  return chave === 'quem' || chave === 'reserva';
}

/**
 * **O modal que não abre é dito** (revisão final, M10), como a página que não
 * monta: no aviso do produto e no log. O aviso dentro da página não serve —
 * sem modal, não há página.
 */
async function naoAbriu(erro) {
  const nome = erro?.erro ?? fraseDoErro(erro);
  console.error(`multiplayer: o modal não abriu: ${nome} ${JSON.stringify(dadosDoErro(erro))}`);
  try {
    await SeeleUI.superficies.avisar(`O multiplayer não abriu: ${nome}`, 'erro');
  } catch (e) {
    console.error('multiplayer: nem o aviso saiu: ' + fraseDoErro(e));
  }
}

/**
 * **O rascunho difere do gravado?** O produto já vê o campo que difere do
 * inicial, mas não a variante (um botão) nem o que uma remontagem fez inicial;
 * o MOD diz (`suja`), e fechar pergunta (revisão final, M1).
 */
function rascunhoMudou() {
  const s = servidorAtual();
  if (estado.vista !== 'config' || !s || !estado.rascunho) return false;
  const gravado = rascunhoDe(s);
  // A versão que a página propõe a um servidor sem versão não é uma mudança da pessoa.
  if (gravado.versao === null) gravado.versao = Array.isArray(estado.versoes[s.receita]) ? estado.versoes[s.receita][0] ?? null : null;
  return emOrdem(estado.rascunho) !== emOrdem(gravado);
}

/** JSON com as chaves em ordem: o mesmo rascunho escrito em outra ordem é o mesmo. */
function emOrdem(v) {
  if (Array.isArray(v)) return '[' + v.map(emOrdem).join(',') + ']';
  if (v && typeof v === 'object') return '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + emOrdem(v[k])).join(',') + '}';
  return JSON.stringify(v ?? null);
}

async function marcarSuja() {
  if (!estado.punho || !estado.aberta) return;
  const suja = rascunhoMudou();
  if (suja === estado.suja) return;
  estado.suja = suja;
  try {
    await estado.punho.suja?.(suja);
  } catch (erro) {
    console.warn(`multiplayer: suja: ${erro?.erro ?? fraseDoErro(erro)}`);
  }
}

async function tratar(evento) {
  if (evento.nome === 'acao' && evento.acao === 'abrir-multiplayer') {
    if (!estado.punho) {
      // Um modal sobre a sessão, e não uma página no lugar do chat: a
      // conversa fica atrás, e fechar volta a ela. 760 px é a largura dos
      // modais do próprio app (o aceite da máquina); de 800 px em diante o
      // produto o desenharia como tela.
      try {
        estado.punho = await SeeleUI.superficies.criar({ id: 'multiplayer', tipo: 'dialogo', titulo: 'Multiplayer', tamanho: { largura: 760 } });
      } catch (erro) {
        return void (await naoAbriu(erro));
      }
      estado.titulo = 'Multiplayer';
      estado.suja = false;
      // Recusadas, as classes que serviram valem e a página abre do mesmo
      // jeito, mais crua; a recusa é dita.
      try {
        await estado.punho.classes(CLASSES);
      } catch (erro) {
        avisar({ erro: erro?.erro ?? fraseDoErro(erro), onde: 'classes', dados: dadosDoErro(erro) });
      }
    } else {
      try {
        await estado.punho.mostrar();
      } catch (erro) {
        // O punho que o produto já não reconhece é esquecido: o próximo clique cria outro.
        estado.punho = null;
        return void (await naoAbriu(erro));
      }
    }
    estado.aberta = true;
    if (!estado.retrato) estado.retrato = await SeeleUI.retrato();
    await carregar();
  } else if (evento.nome === 'servidor') {
    if (!estado.aberta) return;
    await carregar();
  } else if (evento.nome === 'pessoas') {
    estado.retrato = await SeeleUI.retrato();
  } else if (evento.nome === 'fechar' && evento.superficie === 'multiplayer') {
    estado.aberta = false;
    // DESCARTAR E FECHAR (o produto pergunta, e diz `descartou`): o rascunho
    // volta ao gravado, e reabrir não o desenha de novo (revisão final, M1).
    if (evento.descartou === true) {
      const s = servidorAtual();
      estado.rascunho = s ? rascunhoDe(s) : null;
      if (s && estado.rascunho.versao === null && Array.isArray(estado.versoes[s.receita])) estado.rascunho.versao = estado.versoes[s.receita][0] ?? null;
      estado.erros = {};
      estado.palavra = {};
      estado.packLink = '';
      // O produto guarda o `suja` da superfície: a reabertura diz que está limpa.
      estado.suja = null;
    }
    return;
  } else if (evento.nome === 'aba' && evento.chave === 'aba') {
    estado.aba = evento.valor;
  } else if (evento.nome === 'botao') {
    await tratarBotao(String(evento.chave ?? ''));
  } else if (evento.nome === 'arquivo' && evento.chave === 'pack:arquivo') {
    if (evento.resultado === 'escolhido' && evento.arquivo) await enviarPack(evento.arquivo);
    else if (evento.resultado === 'falhou') {
      const { nome, chave, arquivo, resultado, erro, ...dados } = evento;
      avisar({ erro: erro ?? 'falhou', onde: 'pack-escolher', dados });
    } else return;
  } else if (['campo', 'escolha', 'numero', 'marca', 'cor'].includes(evento.nome)) {
    const repintar = tratarCampo(evento);
    await marcarSuja();
    if (!repintar) return;
  } else {
    return;
  }
  await pintar();
  await marcarSuja();
}

SeeleUI.aoEvento(evento => {
  // O túnel primeiro, sem nenhum `await` antes: o bilhete do clique vale só agora.
  if (evento.nome === 'botao' && String(evento.chave).startsWith('entrar:')) {
    entrar(String(evento.chave).slice('entrar:'.length));
    return;
  }
  // O diálogo de salvar também só abre de dentro do clique.
  if (evento.nome === 'botao' && String(evento.chave).startsWith('salvar-pack:')) {
    salvarPack(String(evento.chave).slice('salvar-pack:'.length));
    return;
  }
  tratar(evento).catch(erro => {
    avisar({ erro: erro?.erro ?? fraseDoErro(erro), onde: 'tela', dados: dadosDoErro(erro) });
    pintar();
  });
});

// ---------------------------------------------------------------- o desenho

/**
 * O nome em palavras, como o desenho: uma linha por palavra, com o texto dela
 * e a amostra da cor dela (o botão que a escolhe); embaixo, as 16 cores do
 * Minecraft para a palavra escolhida. Uma lista de 16 opções por palavra
 * passava dos 12 KiB da página com seis palavras; uma só lista basta.
 */
function controleSegmentos(campo, s) {
  const lista = estado.rascunho?.config[campo.chave] ?? campo.padrao;
  const gravada = s.config?.[campo.chave] ?? campo.padrao;
  const livre = pode('configurar-servidor-de-jogo');
  const atual = Math.min(estado.palavra[campo.chave] ?? 0, lista.length - 1);
  const linhas = lista.map((p, i) => {
    const cor = campo.opcoes.find(o => o.valor === p.cor);
    const escolhida = i === atual;
    return linhaH([
      { forma: 'campo', chave: 'cfg:' + campo.chave + ':' + i + ':texto', rotulo: 'Palavra ' + (i + 1), valor: String(p.texto), inicial: String(gravada[i]?.texto ?? ''), tamanhoMaximo: campo.tamanhoMaximo, desligado: !livre },
      botao('amostra:' + campo.chave + ':' + i, '■ ' + (cor?.rotulo ?? p.cor), {
        variante: 'discreta',
        estilo: { cor: cor?.amostra ?? COR.apagado, borda: linhaDe(escolhida ? COR.acento : COR.controle), raio: 999, preenchimento: 12 },
      }),
    ], { chave: 'palavra:' + campo.chave + ':' + i });
  });
  const dela = lista[atual];
  return pilha([
    cl(campo.rotulo, 'lb'),
    ...linhas,
    { forma: 'escolha', chave: 'cfg:' + campo.chave + ':cor', rotulo: 'Cor da palavra ' + (atual + 1), valor: String(dela.cor), inicial: String(gravada[atual]?.cor ?? dela.cor), opcoes: campo.opcoes.map(o => ({ valor: o.valor, dentro: o.rotulo })), desligado: !livre },
    linhaH([
      botao('palavra-mais:' + campo.chave, '+ PALAVRA', { variante: 'discreta', desligado: !livre || lista.length >= campo.maximoSegmentos }),
      botao('palavra-tirar:' + campo.chave, 'TIRAR A PALAVRA ' + (atual + 1), { variante: 'discreta', desligado: !livre || lista.length <= 1 }),
    ]),
    estado.erros[campo.chave] ? tx(estado.erros[campo.chave], { cor: COR.erro, corpo: 14 }, { chave: 'erro:' + campo.chave }) : null,
    campo.ajuda ? apagado(campo.ajuda) : null,
  ], 6);
}

/** Um controle da receita, com o valor do rascunho, o gravado como inicial e a frase do servidor. */
function controle(campo, s) {
  if (campo.forma === 'segmentos') return controleSegmentos(campo, s);
  const chave = 'cfg:' + campo.chave;
  const valor = estado.rascunho?.config[campo.chave] ?? campo.padrao;
  const inicial = s.config?.[campo.chave] ?? campo.padrao;
  const desligado = !pode('configurar-servidor-de-jogo');
  const comum = { chave, rotulo: campo.rotulo, desligado, ...(estado.erros[campo.chave] ? { erro: estado.erros[campo.chave] } : {}) };
  let no;
  if (campo.forma === 'campo') no = { forma: 'campo', ...comum, valor: String(valor), inicial: String(inicial), ...(campo.tamanhoMaximo ? { tamanhoMaximo: campo.tamanhoMaximo } : {}), ...(campo.obrigatorio ? { obrigatorio: true } : {}) };
  else if (campo.forma === 'numero') no = { forma: 'numero', ...comum, valor, inicial, minimo: campo.minimo, maximo: campo.maximo, inteiro: true };
  else if (campo.forma === 'escolha') no = { forma: 'escolha', ...comum, valor: String(valor), inicial: String(inicial), opcoes: campo.opcoes.map(o => ({ valor: o.valor, dentro: o.rotulo })) };
  else no = { forma: 'interruptor', ...comum, valor: valor === true, inicial: inicial === true };
  const amostra = campo.forma === 'escolha' ? campo.opcoes.find(o => o.valor === valor)?.amostra : null;
  return pilha([
    no,
    amostra ? tx('■ ' + (campo.opcoes.find(o => o.valor === valor)?.rotulo ?? ''), { cor: amostra, corpo: 14 }, { chave: 'amostra:' + campo.chave }) : null,
    campo.ajuda ? apagado(campo.ajuda) : null,
  ], 6);
}

/** Os campos de uma aba, na ordem da receita, com os de um mesmo grupo lado a lado. */
function camposDaAba(receita, s, aba) {
  const campos = receita.configuracao.campos.filter(c => c.aba === aba);
  const blocos = [];
  const vistos = new Set();
  for (const campo of campos) {
    if (campo.grupo) {
      if (vistos.has(campo.grupo)) continue;
      vistos.add(campo.grupo);
      const doGrupo = campos.filter(c => c.grupo === campo.grupo);
      blocos.push({ forma: 'grade', chave: 'grupo:' + campo.grupo, estilo: { colunas: doGrupo.length, intervalo: 20 }, dentro: doGrupo.map(c => controle(c, s)) });
    } else {
      blocos.push(controle(campo, s));
    }
  }
  return blocos;
}

/** A cor do chip do estado: verde de pé, laranja no meio do caminho, vermelho caído. */
const CHIP_DO_ESTADO = Object.freeze({ ligado: 'chipV', caiu: 'chipE', desligado: 'chip' });
const chipDoEstado = s => CHIP_DO_ESTADO[s.estado] ?? 'chipL';
const CHIP_DO_ACEITE = Object.freeze({ aceito: 'chipV', esperando: 'chipL', recusado: 'chipE', parado: 'chipE', fora: 'chipL' });

function rotuloDoEstado(s) {
  if (s.estado === 'baixando' && s.progresso) return `BAIXANDO ${s.progresso.feitos}/${s.progresso.total}`;
  return ROTULO_DO_ESTADO[s.estado] ?? String(s.estado).toUpperCase();
}

function rotuloDoAceite(s) {
  const quem = apelidoDe(s.quem);
  if (s.aceite === 'sem-maquina') return 'NENHUMA MÁQUINA';
  if (s.aceite === 'sem-versao') return 'ESCOLHA A VERSÃO';
  if (s.aceite === 'esperando') return `ESPERANDO O ACEITE DE ${quem}`;
  if (s.aceite === 'aceito') return 'ACEITO';
  if (s.aceite === 'recusado') return `RECUSADO: ${s.motivo ?? ''}`;
  if (s.aceite === 'parado') return `PARADO: ${s.motivo ?? ''}`;
  if (s.aceite === 'fora') return `${quem ?? 'A MÁQUINA'} FORA DO SEELE`;
  return String(s.aceite);
}

/**
 * **Onde o jogo roda agora**: a máquina da dona. Depois de uma passagem, é a
 * reserva — o topo da aba dizia «RODA EM <principal>» como se rodasse lá (e2e
 * da API 8, 31/10, passo 13) —, e a principal fica dita embaixo.
 */
function rodaEm(s) {
  const naReserva = s.dona === 'reserva' && Boolean(s.reserva);
  const quem = apelidoDe(naReserva ? s.reserva.quem : s.quem);
  const aceite = naReserva ? s.reserva.aceite : s.aceite;
  return bloco('Roda em', [
    linhaH([
      tx(quem ? `Máquina de ${quem}` : 'Nenhuma máquina escolhida'),
      chip(naReserva ? rotuloDaReserva(s.reserva) : rotuloDoAceite(s), 'chip-aceite', CHIP_DO_ACEITE[aceite] ?? 'chip'),
      naReserva ? chip('Na reserva', 'chip-roda-na-reserva', 'chipA') : null,
    ]),
    naReserva ? apagado(`A principal, a máquina de ${apelidoDe(s.quem)}, espera como reserva até PASSAR À PRINCIPAL.`) : null,
  ], { chave: 'roda-em' });
}

// ---- a reserva (parte 7) ----

/** O tempo de jogo perdido numa queda de surpresa, em palavras. */
function tempoPerdido(segundos) {
  const n = Math.max(0, Number(segundos) || 0);
  return n < 60 ? `${n} s` : `${Math.round(n / 60)} min`;
}

/** A frase que todos veem quando a reserva assumiu numa queda. */
function fraseDaQueda(s) {
  if (!s.perdido) return null;
  return `A ${s.perdido.para === 'reserva' ? 'reserva' : 'principal'} assumiu às ${hora(s.perdido.quando)}: perderam-se ${tempoPerdido(s.perdido.segundos)} de jogo, desde a última cópia (${hora(s.perdido.copiaDe)}).`;
}

/**
 * O aviso do tempo perdido: a caixa laranja do canvas (a de «isto mudou desde
 * o seu aceite»), com o rótulo miúdo e a frase. Laranja e não vermelha: o jogo
 * voltou, e o aviso conta o que custou; o que não voltou é uma falha, no quadro
 * vermelho.
 */
function avisoDaQueda(s, chave) {
  const frase = fraseDaQueda(s);
  if (!frase) return null;
  return {
    forma: 'caixa', chave, classe: 'alerta',
    dentro: [pilha([cl('Tempo de jogo perdido', 'lbL'), tx(frase, { corpo: 14, cor: COR.texto })], 4)],
  };
}

function rotuloDaReserva(r) {
  return rotuloDoAceite({ quem: r.quem, aceite: r.aceite, motivo: r.motivo });
}

/** Onde está a cópia mais nova: na outra máquina, a caminho, ou nenhuma. */
function chipDaCopia(s) {
  if (!s.copia) return chip('Sem cópia', 'chip-copia');
  return s.copiaRecebida?.sha256 === s.copia.sha256
    ? chip('Cópia na outra máquina', 'chip-copia', 'chipV')
    : chip('Cópia a caminho', 'chip-copia', 'chipL');
}

/**
 * A reserva na aba MÁQUINA: escolher, o aceite, quem é a dona agora, a última
 * cópia, e passar. O padrão do canvas: o rótulo miúdo em cima e o nome em caixa
 * de frase; os estados (o aceite, a dona, a cópia, a passagem) em chips.
 */
function blocoDaReserva(s, opcoes) {
  const reserva = estado.rascunho?.reserva ?? '';
  const papelDaDona = s.dona === 'reserva' ? 'reserva' : 'principal';
  const ultima = s.copia ? `Última cópia às ${hora(s.copia.quando)}, ${(s.copia.tamanho / 1048576).toFixed(1).replace('.', ',')} MiB.` : 'Nenhuma cópia ainda.';
  return bloco('A reserva', [
    { forma: 'escolha', chave: 'reserva', rotulo: 'Quem assume se esta máquina sair', valor: reserva, inicial: s.reserva?.quem ?? '', opcoes: opcoes.map(o => (o.valor ? { ...o } : { valor: '', dentro: 'Sem reserva' })), desligado: !pode('configurar-servidor-de-jogo') },
    s.reserva ? linhaH([
      tx(`Máquina de ${apelidoDe(s.reserva.quem)}`),
      chip(rotuloDaReserva(s.reserva), 'chip-aceite-reserva', CHIP_DO_ACEITE[s.reserva.aceite] ?? 'chip'),
    ]) : null,
    pilha([
      lb('A dona agora'),
      linhaH([
        cl(s.quemEADona ? `Máquina de ${apelidoDe(s.quemEADona)}` : 'Ninguém', 'grande'),
        s.quemEADona ? chip(papelDaDona, 'chip-dona', 'chipV') : null,
        s.passando ? chip(`Passando à ${s.passando.para}`, 'chip-passando', 'chipL') : null,
      ]),
    ], 6, { chave: 'dona' }),
    { forma: 'numero', chave: 'intervaloDaCopia', rotulo: 'Copiar o mundo a cada (minutos)', valor: estado.rascunho?.intervaloDaCopia ?? 5, inicial: s.intervaloDaCopia ?? 5, minimo: 1, maximo: 60, inteiro: true, desligado: !pode('configurar-servidor-de-jogo') },
    linhaH([chipDaCopia(s), apagado(ultima)]),
    avisoDaQueda(s, 'aviso-da-queda'),
    s.religada ? linhaH([
      chip('Religada', 'chip-religada', 'chipV'),
      apagado(`Seguiu ${tempoPerdido(s.religada.fora)} sem quem hospeda o SEELE e foi religada às ${hora(s.religada.quando)}, sem desligar o jogo.`),
    ]) : null,
    s.voltouRodando ? linhaH([
      chip(`Voltou rodando · ${s.voltouRodando}`, 'chip-voltou', 'chipL'),
      apagado(`A máquina que voltou com o jogo de pé sem ser a dona foi desligada ${s.voltouRodando} vez(es).`),
    ]) : null,
    s.reserva && pode('ligar-desligar-servidor-de-jogo')
      ? linhaH([botao('passar', s.dona === 'reserva' ? 'PASSAR À PRINCIPAL' : 'PASSAR À RESERVA', { variante: 'secundaria', desligado: Boolean(s.passando) })])
      : null,
    apagado('Só uma máquina roda por vez. A dona copia o mundo para a outra depois de salvar; numa queda de mais de 60 s a outra assume com a última cópia, e a tela diz quanto se perdeu.'),
  ], { chave: 'reserva' });
}

function situacao(s) {
  const linhas = [];
  // Só enquanto o aceite espera de verdade: a resposta do LIGAR ficava guardada
  // e seguia dizendo «esperando» com o servidor LIGADO e depois da revogação.
  if (s.aceite === 'esperando' && (estado.situacao || s.ligar)) linhas.push('Liga assim que a pessoa da máquina aceitar: esperando o aceite.');
  if (s.precisaReiniciar) linhas.push('A configuração nova vale quando o servidor reiniciar.');
  if (s.chamando) {
    const fora = [['principal', s.quem, s.aceite], ['reserva', s.reserva?.quem, s.reserva?.aceite]]
      .filter(([, quem, aceite]) => quem && aceite === 'fora').map(([, quem]) => apelidoDe(quem));
    linhas.push(`O servidor SEELE subiu de novo às ${hora(s.chamando.quando)} e chamou as máquinas de volta. Um jogo que seguiu rodando numa delas volta sem desligar quando ela responder; o que ninguém chamar de volta em 10 minutos para sozinho, salvo.`);
    if (fora.length) linhas.push(`Fora do SEELE agora: ${fora.join(' e ')}. A máquina é chamada de novo assim que entrar.`);
  }
  if (s.falhas.length) linhas.push(`${s.falhas.length} falha(s) registrada(s): veja a aba MÁQUINA.`);
  return pilha([
    linhaH([lb('Estado'), chip(rotuloDoEstado(s), null, chipDoEstado(s))]),
    ...linhas.map(l => apagado(l)),
  ], 6, { chave: 'situacao' });
}

function opcaoDeVariante(receita, s, chave) {
  const v = receita.variantes[chave];
  if (!v) return null;
  const escolhida = (estado.rascunho?.variante ?? s.variante ?? 'vanilla') === chave;
  const indisponivel = v.disponivel === false;
  return botao('variante:' + chave, [pilha([
    tx(v.nome, { corpo: 20, peso: 'forte', cor: escolhida ? COR.acento : COR.texto }),
    cl(v.descricao, 'ap'),
    indisponivel && v.porque ? tx(v.porque, { familia: 'mono', corpo: 11, cor: COR.acento }) : null,
  ], 6)], {
    desligado: indisponivel || !pode('configurar-servidor-de-jogo'),
    // O cartão de 18 do canvas: o escolhido em laranja, o outro em vidro.
    estilo: {
      borda: linhaDe(escolhida ? COR.acento : COR.vidroBorda),
      fundo: escolhida ? COR.laranjaFundo : COR.vidro, raio: 18, preenchimento: 20, alinhamento: 'esquerda',
    },
  });
}

function escolhaDeVersao(receita, s) {
  if ((estado.rascunho?.variante ?? s.variante) === 'com-mods') {
    return bloco('Versão do jogo', [
      tx(s.pack ? `Minecraft ${s.pack.mc}, a que o modpack pede` : 'A versão vem do modpack: escolha-o na aba MODS.', { corpo: 16 }),
    ], { chave: 'versao-do-pack' });
  }
  const versoes = estado.versoes[receita.id];
  if (!versoes) return bloco('Versão do jogo', [apagado('Lendo as versões…')]);
  if (versoes.falha) return bloco('Versão do jogo', [quadroDeFalha(versoes.falha, 'falha-versoes')]);
  const atual = estado.rascunho?.versao ?? '';
  const lista = atual && !versoes.includes(atual) ? [atual, ...versoes] : versoes;
  return bloco('Versão do jogo', [{
    forma: 'escolha', chave: 'versao', rotulo: 'Versão', valor: atual, inicial: s.versao ?? '',
    desligado: !pode('configurar-servidor-de-jogo'),
    opcoes: lista.map(v => ({ valor: v, dentro: v })),
  }, apagado('Trocar a versão pede o aceite de novo na máquina do jogo.')]);
}

function botoesDaConfig(s) {
  const rodando = ['ligando', 'ligado', 'parando', 'salvando'].includes(s.estado) || s.ligar;
  return {
    forma: 'acoes', chave: 'botoes',
    dentro: [
      rodando
        ? botao('desligar', 'DESLIGAR SERVIDOR', { variante: 'secundaria', desligado: !pode('ligar-desligar-servidor-de-jogo') })
        : botao('ligar', 'LIGAR SERVIDOR', { variante: 'secundaria', desligado: !pode('ligar-desligar-servidor-de-jogo') }),
      pode('criar-servidor-de-jogo')
        ? botao('apagar', 'APAGAR', { variante: 'perigo', desligado: rodando, confirmar: 'Apagar este servidor de jogo? A configuração some; os arquivos na máquina ficam.' })
        : null,
      botao('salvar', 'SALVAR', { variante: 'primaria', desligado: !pode('configurar-servidor-de-jogo') }),
    ].filter(Boolean),
  };
}

/**
 * As ações de salvar, no rodapé fixo do modal (`fixas`): SALVAR por último,
 * cheio, e à vista em qualquer ponto da rolagem. O estado fica no bloco dele,
 * acima, e não se repete aqui.
 */
function barraDeSalvar(s) {
  return { ...botoesDaConfig(s), fixas: true };
}

function abaGeral(receita, s) {
  return pilha([
    { forma: 'grade', chave: 'variantes', estilo: { colunas: 2, intervalo: 16 }, dentro: ['vanilla', 'com-mods'].map(v => opcaoDeVariante(receita, s, v)).filter(Boolean) },
    escolhaDeVersao(receita, s),
    separador(),
    ...camposDaAba(receita, s, 'geral'),
    pilha([
      { forma: 'interruptor', chave: 'so-seele', rotulo: 'Só entra quem está neste servidor SEELE', valor: true, inicial: true, desligado: true },
      apagado('O jogo só escuta no túnel do SEELE, nesta versão: sempre ligado.'),
    ], 6),
    separador(),
    rodaEm(s),
    situacao(s),
    barraDeSalvar(s),
  ], 32);
}

/** O pack do servidor de jogo, em linhas: de onde veio, o que pede e o hash. */
function resumoDoPack(p) {
  const loader = p.loader ? `${p.loader.id} ${p.loader.versao}` : 'sem loader';
  return pilha([
    tx(p.nome || 'Modpack sem nome', { corpo: 20 }),
    apagado(`Minecraft ${p.mc} · ${loader} · ${p.arquivos} arquivo(s) no servidor${p.excluidos ? `, ${p.excluidos} só do cliente fora` : ''}`),
    mono(`${p.origem === 'link' ? 'pelo link do Modrinth' : 'enviado'} · ${(p.bytes / 1048576).toFixed(1).replace('.', ',')} MiB · sha512 ${String(p.sha512).slice(0, 16)}…`),
    p.instalador ? apagado(`Instala o loader com ${p.instalador.nome} antes de ligar.`) : null,
  ], 4, { chave: 'pack' });
}

function abaMods(receita, s) {
  if (!receita.modpack) return pilha([apagado('Esta receita não tem modpack.')], 12);
  const livre = pode('configurar-servidor-de-jogo') && !['ligando', 'ligado', 'parando', 'salvando'].includes(s.estado);
  const comMods = (estado.rascunho?.variante ?? s.variante) === 'com-mods';
  return pilha([
    comMods ? null : apagado('O modpack vale quando Com mods está escolhido em GERAL. Escolher um aqui já escolhe Com mods.'),
    bloco('O modpack', [s.pack ? resumoDoPack(s.pack) : apagado('Nenhum modpack ainda.')]),
    bloco('Pelo link do Modrinth', [
      linhaH([
        { forma: 'campo', chave: 'pack:link-texto', rotulo: 'Link do modpack', valor: estado.packLink, inicial: estado.packLink, tamanhoMaximo: 200, desligado: !livre },
        botao('pack:link', 'USAR O LINK', { variante: 'secundaria', desligado: !livre || !estado.packLink }),
      ]),
      apagado('Nada passa pelo envio: a máquina do jogo baixa o .mrpack direto do cdn.modrinth.com, com o hash que a API do Modrinth dá.'),
    ]),
    bloco('Ou o arquivo .mrpack', [
      { forma: 'arquivo', chave: 'pack:arquivo', rotulo: estado.enviando ? 'ENVIANDO…' : 'ESCOLHER UM .MRPACK', tipos: ['pack'], finalidade: 'O modpack (.mrpack) deste servidor de jogo', desligado: !livre || Boolean(estado.enviando) },
      apagado(`O exportado do app do Modrinth, até ${Math.round(receita.modpack.teto / 1048576)} MiB. Ele fica no servidor SEELE, e quem joga o baixa pelo cartão.`),
    ]),
    apagado(`Cada arquivo do pack é conferido pelo sha512, e só vem de ${receita.modpack.dominios.join(', ')}.`),
  ], 32);
}

function abaJogadores(receita, s) {
  const dentro = s.jogadores ?? [];
  return pilha([
    bloco('Quem está dentro', [
      tx(`${dentro.length} de ${s.maximo ?? '?'}`, { corpo: 20 }),
      dentro.length
        ? { forma: 'lista', chave: 'jogadores', dentro: dentro.slice(0, 40).map(j => ({ forma: 'item', dentro: j })) }
        : apagado(s.estado === 'ligado' ? 'Ninguém agora.' : 'O servidor não está ligado.'),
    ], { chave: 'quem-esta' }),
    separador(),
    ...camposDaAba(receita, s, 'jogadores'),
    barraDeSalvar(s),
  ], 32);
}

function gib(bytes) {
  return (bytes / (1024 ** 3)).toFixed(1).replace('.', ',') + ' GiB';
}

function abaMaquina(receita, s) {
  const pessoas = estado.retrato?.pessoas ?? [];
  const opcoes = [{ valor: '', dentro: 'Nenhuma máquina' }, ...pessoas.slice(0, estado.enxuta ? 12 : 48).map(p => ({ valor: String(p.id), dentro: `Máquina de ${p.apelido}` }))];
  const quem = estado.rascunho?.quem ?? '';
  if (quem && !opcoes.some(o => o.valor === quem)) opcoes.push({ valor: quem, dentro: `Máquina de ${apelidoDe(quem)}` });
  const ligado = s.estado === 'ligado';
  return pilha([
    bloco('Escolher a máquina', [
      { forma: 'escolha', chave: 'quem', rotulo: 'Quem roda este servidor de jogo', valor: quem, inicial: s.quem ?? '', opcoes, desligado: !pode('configurar-servidor-de-jogo') },
      apagado('A pessoa aceita no SEELE dela antes de qualquer coisa ser baixada, e pode desligar a qualquer momento. Uma máquina por vez: trocar pede o servidor desligado.'),
    ]),
    rodaEm(s),
    blocoDaReserva(s, opcoes),
    bloco('O que roda', [
      mono(`${receita.rodar.comando} ${receita.rodar.argumentos.join(' ')}`),
      apagado(`Baixa ${receita.artefatos.map(a => a.destino === 'server.jar' ? 'o server.jar oficial' : a.fonte === 'adoptium' ? 'o Java da Adoptium para o sistema da máquina' : a.destino).join(' e ')}, cada um conferido pelo hash, só de: ${receita.origens.join(', ')}.`),
      s.disco ? apagado(`Disco: até ${gib(s.disco)}, contando o mundo.`) : null,
      Object.keys(s.substituidas ?? {}).length ? apagado(`Sem Java desta versão para ${Object.keys(s.substituidas).join(', ')}: usa o de ${Object.values(s.substituidas).join(', ')}.`) : null,
      (s.semJava ?? []).length ? tx(`Sem Java desta versão para: ${s.semJava.join(', ')}.`, { cor: COR.erro, corpo: 14 }) : null,
    ], { chave: 'o-que-roda' }),
    situacao(s),
    ligado && pode('configurar-servidor-de-jogo')
      ? bloco('Console', [
        linhaH([
          { forma: 'campo', chave: 'console:texto', rotulo: 'Comando', valor: estado.consoleTexto, inicial: estado.consoleTexto, tamanhoMaximo: 256 },
          botao('console:enviar', 'ENVIAR', { variante: 'secundaria' }),
        ]),
      ])
      : null,
    s.linhas?.length && !estado.enxuta ? bloco('Últimas linhas', [{ forma: 'pilha', chave: 'linhas', estilo: { intervalo: 2 }, dentro: s.linhas.map(l => mono(l)) }]) : null,
    s.falhas?.length
      ? bloco('O que deu errado', s.falhas.slice().reverse().map((f, i) => pilha([
        // A hora; onde e a etapa ficam nos detalhes, com o nome cru.
        mono(hora(f.quando)),
        quadroDeFalha(f, 'falha:' + i),
      ], 4)), { chave: 'falhas' })
      : null,
    barraDeSalvar(s),
  ], 32);
}

function hora(segundos) {
  const d = new Date(Number(segundos) * 1000);
  return Number.isFinite(d.getTime()) ? `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` : '--:--';
}

function vistaConfig() {
  const s = servidorAtual();
  const receita = receitaPorId(s.receita);
  const variante = estado.rascunho?.variante ?? s.variante ?? 'vanilla';
  // **Vanilla é sem mods** (1.0.1): a aba MODS só existe com «Com mods». Ela
  // aparecia em todo servidor, e num Vanilla oferecia um modpack que ele não
  // pode ter. Voltar ao Vanilla com ela aberta devolve a GERAL.
  const comMods = variante === 'com-mods';
  const abas = ABAS.filter(a => a.chave !== 'aba-mods' || comMods);
  const conteudo = {
    'aba-geral': () => abaGeral(receita, s),
    'aba-jogadores': () => abaJogadores(receita, s),
    'aba-maquina': () => abaMaquina(receita, s),
  };
  if (comMods) conteudo['aba-mods'] = () => abaMods(receita, s);
  const aberta = conteudo[estado.aba] ? estado.aba : 'aba-geral';
  return [
    linhaH([botao('voltar', '← SERVIDORES DE JOGO', { variante: 'discreta' })]),
    // O nome do servidor é o título do modal (`tituloDoModal`), como nos
    // modais do app; no corpo fica só o rótulo miúdo, o jogo e a variante.
    lb(`${receita.nome} · ${receita.variantes[variante]?.nome ?? ''}`, 'titulo'),
    estado.aviso ? avisoDaPagina() : null,
    {
      forma: 'abas', chave: 'aba', valor: aberta,
      dentro: abas.map(a => ({ forma: 'aba', chave: a.chave, rotulo: a.rotulo, dentro: a.chave === aberta ? [conteudo[a.chave]()] : [] })),
    },
  ];
}

function avisoDaPagina() {
  const mundo = estado.aviso?.erro === 'mundo-mais-novo' && estado.retomar;
  return pilha([
    quadroDeFalha(estado.aviso),
    mundo
      ? linhaH([
        botao('mundo:novo', 'COMEÇAR UM MUNDO NOVO', { variante: 'secundaria' }),
        botao('mundo:manter', `MANTER A ${estado.aviso.dados?.mundo ?? 'VERSÃO DO MUNDO'}`, { variante: 'discreta' }),
      ])
      : linhaH([botao('fechar-aviso', 'ENTENDI', { variante: 'discreta' })]),
  ], 6, { chave: 'aviso' });
}

/** O cartão fala do pack só quando o servidor de jogo roda com mods. */
const comModsNoCartao = s => s.variante === 'com-mods' && Boolean(s.pack);

function cartao(s) {
  const receita = receitaPorId(s.receita);
  const ligado = s.estado === 'ligado';
  // **A porta vale enquanto o jogo está de pé.** Quando a máquina para, o
  // SEELE fecha o túnel desta pessoa («a máquina parou de servir este jogo»), e
  // o endereço que ficasse no cartão seria uma porta que recusa a conexão; ao
  // religar, é um ENTRAR novo que a abre (e2e da API 8, 31/10).
  if (!ligado) delete estado.portas[s.id];
  const porta = estado.portas[s.id];
  const recusa = estado.entradas[s.id];
  const configura = pode('configurar-servidor-de-jogo') || pode('ligar-desligar-servidor-de-jogo') || pode('criar-servidor-de-jogo');
  return {
    forma: 'caixa', chave: 'cartao:' + s.id,
    classe: ligado ? 'aceso' : 'cartao',
    dentro: [pilha([
      linhaH([
        cl(receita?.icone ?? '?', 'ic'),
        cl(nomeEmTexto(s.config?.nome) || s.id, 'grande'),
        chip(rotuloDoEstado(s), null, chipDoEstado(s)),
        s.dona === 'reserva' ? chip('Na reserva', 'chip-na-reserva', 'chipA') : null,
      ]),
      apagado(`${receita?.nome ?? s.receita} ${s.versao ?? '(sem versão)'} · ${(s.quemEADona ?? s.quem) ? 'na máquina de ' + apelidoDe(s.quemEADona ?? s.quem) : 'sem máquina'}`),
      tx(`${(s.jogadores ?? []).length} de ${s.maximo ?? '?'} jogando`, { corpo: 14 }),
      avisoDaQueda(s, 'aviso-da-queda:' + s.id),
      porta ? pilha([
        tx(`localhost:${porta}`, { familia: 'mono', corpo: 20, cor: COR.acento }),
        apagado(`No ${receita?.nome ?? 'jogo'}: Multijogador, Conexão direta, e este endereço.${porta !== s.porta && s.porta ? ' A porta é outra porque a do jogo estava ocupada neste computador.' : ''}`),
      ], 4) : null,
      recusa ? quadroDeFalha(recusa) : null,
      comModsNoCartao(s) ? apagado(`Com mods: ${s.pack.nome || 'modpack'} (${s.pack.loader ? s.pack.loader.id : 'sem loader'}). Importe o mesmo pack no app do Modrinth para entrar.`) : null,
      estado.salvos[s.id]?.bytes ? apagado(`Pack salvo: ${(estado.salvos[s.id].bytes / 1048576).toFixed(1).replace('.', ',')} MiB.`) : null,
      estado.salvos[s.id]?.falha ? quadroDeFalha(estado.salvos[s.id].falha) : null,
      configura && s.falhas?.length ? apagado(`Última falha: ${fraseDaFalha(s.falhas.at(-1)) || s.falhas.at(-1).erro}`) : null,
      {
        forma: 'acoes',
        dentro: [
          botao('entrar:' + s.id, 'ENTRAR', { variante: 'primaria', desligado: !ligado || !pode('entrar-no-jogo') }),
          comModsNoCartao(s) && s.pack.origem === 'enviado' ? botao('salvar-pack:' + s.id, 'BAIXAR O PACK', { variante: 'secundaria' }) : null,
          comModsNoCartao(s) && s.pack.origem === 'link' && s.pack.pagina ? { forma: 'link', chave: 'pack-link:' + s.id, endereco: s.pack.pagina, dentro: 'O PACK NO MODRINTH' } : null,
          configura ? botao('configurar:' + s.id, 'CONFIGURAR', { variante: 'secundaria' }) : null,
        ].filter(Boolean),
      },
      !pode('entrar-no-jogo') ? apagado(`Só quem tem a permissão «${NOME_DAS_PERMISSOES['entrar-no-jogo']}» entra.`) : null,
    ], 8)],
  };
}

function vistaSeletor() {
  const dados = estado.dados;
  const servidores = dados?.servidores ?? [];
  const criar = pode('criar-servidor-de-jogo');
  return [
    estado.aviso ? avisoDaPagina() : null,
    !dados ? apagado('Lendo os servidores de jogo…') : null,
    servidores.length ? bloco('Servidores de jogo', servidores.map(cartao)) : null,
    dados ? bloco('Criar um servidor', [{
      forma: 'grade', estilo: { colunas: 2, intervalo: 16 },
      dentro: dados.receitas.map(r => ({
        forma: 'caixa', chave: 'receita:' + r.id,
        classe: 'cartao',
        dentro: [pilha([
          linhaH([cl(r.icone, 'ic'), tx(r.nome, { corpo: 20, peso: 'forte' }), r.edicao ? chip(r.edicao, null, 'chipA') : null]),
          apagado(r.descricao),
          r.valida ? null : quadroDeFalha({ erro: 'receita-invalida', dados: { erros: r.erros } }),
          botao('criar:' + r.id, 'CRIAR', { variante: 'primaria', desligado: !criar || !r.valida }),
          criar ? null : apagado(`Só quem tem a permissão «${NOME_DAS_PERMISSOES['criar-servidor-de-jogo']}» cria um servidor.`),
        ], 8)],
      })),
    }]) : null,
  ];
}

let pintando = Promise.resolve();

function montarRaiz() {
  const conteudo = estado.vista === 'config' && servidorAtual() ? vistaConfig() : vistaSeletor();
  if (estado.enxuta) conteudo.splice(1, 0, apagado('A página passou do tamanho que o SEELE monta de uma vez: este é o resumo, sem as linhas e os dados das falhas.', { chave: 'resumo' }));
  return {
    forma: 'caixa', chave: 'raiz',
    // Sem moldura própria: o modal do produto já é o painel, e o canvas tem
    // um nível de painel só.
    estilo: { cor: COR.texto, familia: 'sans', corpo: 16 },
    dentro: [pilha(conteudo, 32)],
  };
}

/**
 * O título do modal: o nome do servidor de jogo aberto (o gravado, e não o
 * que se digita), ou «Multiplayer» na lista.
 */
function tituloDoModal() {
  const s = estado.vista === 'config' ? servidorAtual() : null;
  if (!s) return 'Multiplayer';
  return nomeEmTexto(s.config?.nome) || nomeEmTexto(estado.rascunho?.config?.nome) || s.id;
}

/** Monta a página inteira; uma montagem por vez. */
function pintar() {
  pintando = pintando.then(async () => {
    if (!estado.aberta || !estado.punho) return;
    estado.enxuta = false;
    const titulo = tituloDoModal();
    if (titulo !== estado.titulo) {
      try {
        await estado.punho.titulo(titulo);
        estado.titulo = titulo;
      } catch (erro) {
        // O título velho fica; a página monta do mesmo jeito.
        console.error(`multiplayer: o título do modal não mudou: ${erro?.erro ?? fraseDoErro(erro)}`);
      }
    }
    try {
      await estado.punho.montar([montarRaiz()]);
    } catch (erro) {
      const nome = erro?.erro ?? fraseDoErro(erro);
      if (nome === 'mensagem-grande' && !estado.enxuta) {
        // Grande demais para uma montagem: o resumo, e a página diz que é resumo.
        estado.enxuta = true;
        try {
          await estado.punho.montar([montarRaiz()]);
          return;
        } catch (segundo) {
          erro = segundo;
        }
      }
      const nomeFinal = erro?.erro ?? fraseDoErro(erro);
      console.error(`multiplayer: a página não montou inteira: ${nomeFinal} ${JSON.stringify(dadosDoErro(erro))}`);
      try {
        await SeeleUI.superficies.avisar(`O multiplayer não montou a página inteira: ${nomeFinal}`, 'erro');
      } catch (e) {
        console.error('multiplayer: nem o aviso saiu: ' + fraseDoErro(e));
      }
    }
  });
  return pintando;
}

// ---------------------------------------------------------------- a partida

SeeleUI.contribuicoes.registrar({
  ponto: 'servidor.navegacao',
  modo: 'adicionar',
  rotulo: 'Multiplayer',
  acaoPrincipal: 'abrir-multiplayer',
}).catch(falha => console.error(`multiplayer: a entrada na navegação não entrou: ${falha?.erro ?? fraseDoErro(falha)}`));

})();
