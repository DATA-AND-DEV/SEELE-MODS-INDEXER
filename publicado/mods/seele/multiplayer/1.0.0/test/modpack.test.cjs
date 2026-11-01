// O modpack (API 8 parte 6): as regras do `modrinth.index.json` da spec, o
// link do Modrinth, o instalador de cada loader e a oferta com mods, sobre as
// fixtures (a resposta da API do Modrinth gravada em 31/10/2026 e o pack de
// prova de ferramentas/pack-de-prova.cjs). Nada vai à rede.
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { carregar, fixture, receitaDoDisco, buscarDasFixtures } = require('./carregar.cjs');
const { packDeProva } = require('../ferramentas/pack-de-prova.cjs');
const { lerZip } = require('./zip.cjs');

const { lerIndice, lerLinkDoModrinth, escolherVersaoDoModrinth, instaladorDoLoader, montarOfertaComMods, resolverVersao, comandosDoLoader, comandosDaMaquina, caminhosProtegidosDoPack } =
  carregar('servidor', ['lerIndice', 'lerLinkDoModrinth', 'escolherVersaoDoModrinth', 'instaladorDoLoader', 'montarOfertaComMods', 'resolverVersao', 'comandosDoLoader', 'comandosDaMaquina', 'caminhosProtegidosDoPack'], { mundo: {}, dados: {} });
const receita = receitaDoDisco('minecraft');
const local = v => JSON.parse(JSON.stringify(v));
const indiceDaProva = () => JSON.parse(lerZip(packDeProva()).find(e => e.nome === 'modrinth.index.json').dados.toString());
const ler = indice => local(lerIndice(JSON.stringify(indice), receita));

test('o índice do pack de prova: o loader, a versão e só os arquivos do servidor', () => {
  const r = ler(indiceDaProva());
  assert.equal(r.ok, true, JSON.stringify(r));
  assert.equal(r.indice.mc, '1.21.4');
  assert.deepEqual(r.indice.loader, { id: 'fabric-loader', versao: '0.16.14' });
  assert.deepEqual(r.indice.arquivos.map(a => a.path), ['mods/fabric-api-0.119.4+1.21.4.jar', 'mods/lithium-fabric-0.15.3+mc1.21.4.jar']);
  assert.equal(r.indice.excluidos, 1, 'o Sodium (env.server unsupported) entrou');
  assert.match(r.indice.arquivos[0].url, /^https:\/\/cdn\.modrinth\.com\//);
  assert.equal(r.indice.arquivos[0].sha512.length, 128);
});

test('uma chave de dependência desconhecida é recusada pelo nome, e não ignorada', () => {
  const i = indiceDaProva();
  i.dependencies['liteloader'] = '1.0';
  assert.deepEqual(ler(i).erro, 'dependencia-desconhecida');
  assert.equal(ler(i).dependencia, 'liteloader');
});

test('caminho absoluto, com «..» ou com barra invertida recusa o pack inteiro', () => {
  for (const path of ['/etc/passwd', '../fora.jar', 'mods/../../fora.jar', 'C:/x.jar', 'mods\\x.jar', 'mods//x.jar']) {
    const i = indiceDaProva();
    i.files[0].path = path;
    const r = ler(i);
    assert.equal(r.erro, 'caminho-recusado', path);
    assert.equal(r.path, path);
  }
  // O de um arquivo só do cliente também: o pack inteiro é recusado, e não só filtrado.
  const i = indiceDaProva();
  i.files[2].path = '../sodium.jar';
  assert.equal(ler(i).erro, 'caminho-recusado');
});

test('todo arquivo do servidor tem sha512 e vem só dos domínios da receita', () => {
  const sem = indiceDaProva();
  delete sem.files[0].hashes.sha512;
  assert.equal(ler(sem).erro, 'sem-sha512');
  const fora = indiceDaProva();
  fora.files[1].downloads = ['https://example.com/lithium.jar', 'http://cdn.modrinth.com/x.jar'];
  const r = ler(fora);
  assert.equal(r.erro, 'download-fora-dos-dominios');
  assert.deepEqual(r.dominios, ['cdn.modrinth.com', 'github.com', 'raw.githubusercontent.com', 'gitlab.com']);
  // Um segundo endereço num domínio aceito serve.
  const segundo = indiceDaProva();
  segundo.files[1].downloads = ['https://example.com/x.jar', 'https://github.com/CaffeineMC/lithium/releases/x.jar'];
  assert.match(ler(segundo).indice.arquivos[1].url, /^https:\/\/github\.com\//);
  // O de um arquivo só do cliente não precisa de sha512: ele nem é baixado.
  const cliente = indiceDaProva();
  delete cliente.files[2].hashes.sha512;
  assert.equal(ler(cliente).ok, true);
});

test('dois loaders, nenhum minecraft, outro jogo ou outro formato são recusados com o nome', () => {
  const dois = indiceDaProva();
  dois.dependencies.forge = '54.1.0';
  assert.equal(ler(dois).erro, 'loaders-demais');
  const semMc = indiceDaProva();
  delete semMc.dependencies.minecraft;
  assert.equal(ler(semMc).erro, 'pack-sem-minecraft');
  assert.equal(ler({ ...indiceDaProva(), game: 'terraria' }).erro, 'pack-de-outro-jogo');
  assert.equal(ler({ ...indiceDaProva(), formatVersion: 2 }).erro, 'formato-do-pack-desconhecido');
  assert.equal(local(lerIndice('{', receita)).erro, 'indice-ilegivel');
});

test('o link do Modrinth: o slug e a versão, e o resto recusado', () => {
  assert.deepEqual(local(lerLinkDoModrinth('https://modrinth.com/modpack/fabulously-optimized')), { ok: true, slug: 'fabulously-optimized', versao: null });
  assert.deepEqual(local(lerLinkDoModrinth('https://modrinth.com/modpack/fabulously-optimized/version/8.1.0')), { ok: true, slug: 'fabulously-optimized', versao: '8.1.0' });
  for (const ruim of ['https://modrinth.com/mod/sodium', 'http://modrinth.com/modpack/x', 'https://evil.com/modpack/x', '']) {
    assert.equal(lerLinkDoModrinth(ruim).erro, 'link-nao-e-do-modrinth', ruim);
  }
});

test('a versão do Modrinth gravada: a mais nova, ou a pedida, com o .mrpack do CDN e o sha512', () => {
  const lista = JSON.parse(fixture('modrinth-fabulously-optimized.json'));
  const r = local(escolherVersaoDoModrinth(lista, null, receita));
  assert.equal(r.versao.numero, '8.2.0');
  assert.equal(r.arquivo.tamanho, 182799);
  assert.match(r.arquivo.url, /^https:\/\/cdn\.modrinth\.com\/.*\.mrpack$/);
  assert.equal(r.arquivo.sha512.slice(0, 16), '57764c105ff999ce');
  assert.equal(local(escolherVersaoDoModrinth(lista, '8.1.0', receita)).versao.numero, '8.1.0');
  assert.equal(escolherVersaoDoModrinth(lista, '9.9.9', receita).erro, 'versao-do-modpack-desconhecida');
  const foraDoCdn = JSON.parse(JSON.stringify(lista));
  foraDoCdn[0].files[0].url = 'https://example.com/x.mrpack';
  assert.equal(escolherVersaoDoModrinth(foraDoCdn, null, receita).erro, 'mrpack-fora-do-cdn');
});

test('o instalador: o fixo da receita, e o do Maven Reposilite com o hash e o tamanho lidos', () => {
  const fabric = local(instaladorDoLoader(receita, { id: 'fabric-loader', versao: '0.16.14' }, '1.21.4', () => null));
  assert.deepEqual(fabric.artefato, {
    id: 'instalador', nome: 'fabric-installer.jar', destino: 'fabric-installer.jar', tamanho: 212123,
    url: 'https://maven.fabricmc.net/net/fabricmc/fabric-installer/1.1.2/fabric-installer-1.1.2.jar',
    hash: { algoritmo: 'sha512', hex: receita.modpack.loaders['fabric-loader'].instalador.hash.hex },
  });
  // Os números da Forge, como o Maven dela os dava em 31/10/2026.
  const base = 'https://maven.minecraftforge.net/net/minecraftforge/forge/1.21.4-54.1.0/forge-1.21.4-54.1.0-installer.jar';
  const buscar = buscarDasFixtures({
    [base + '.sha256']: '2e0624eea52c1c340287f0eeb3480a4c62911146d886acb6eb3dc0210a7d1ad6',
    'https://maven.minecraftforge.net/api/maven/details/releases/net/minecraftforge/forge/1.21.4-54.1.0/forge-1.21.4-54.1.0-installer.jar':
      '{"name":"forge-1.21.4-54.1.0-installer.jar","contentType":"application/java-archive","contentLength":6413997,"lastModifiedTime":1739392852.637662969,"type":"FILE"}',
  });
  const forge = local(instaladorDoLoader(receita, { id: 'forge', versao: '54.1.0' }, '1.21.4', buscar));
  assert.deepEqual(forge.artefato, { id: 'instalador', nome: 'forge-installer.jar', destino: 'forge-installer.jar', url: base, tamanho: 6413997, hash: { algoritmo: 'sha256', hex: '2e0624eea52c1c340287f0eeb3480a4c62911146d886acb6eb3dc0210a7d1ad6' } });
  assert.equal(instaladorDoLoader(receita, { id: 'neoforge', versao: '21.4.1' }, '1.21.4', () => null).erro, 'instalador-sem-hash');
});

test('a oferta com mods: o instalador, o pack pelo hash, os dois comandos, os domínios e o disco', () => {
  const resolvido = local(resolverVersao(receita, '1.21.4', buscarDasFixtures()));
  const indice = local(lerIndice(JSON.stringify(indiceDaProva()), receita)).indice;
  const instalador = local(instaladorDoLoader(receita, indice.loader, indice.mc, () => null)).artefato;
  const pack = { origem: 'enviado', sha512: 'a'.repeat(128), bytes: 1434, mc: indice.mc, loader: indice.loader, instalador, resumo: { bytesDosArquivos: indice.bytes } };
  const vanilla = local(carregar('servidor', ['montarOferta'], { mundo: {}, dados: {} }).montarOferta(receita, { servidor: 'minecraft-1', versao: '1.21.4', porta: 25565 }, resolvido));
  const o = local(montarOfertaComMods(receita, { servidor: 'minecraft-1', versao: '1.21.4', porta: 25565 }, resolvido, pack));
  assert.deepEqual(o.pack, { algoritmo: 'sha512', hex: 'a'.repeat(128) });
  assert.equal(o.artefatos.at(-1).nome, 'fabric-installer.jar');
  assert.deepEqual(o.instalar, { comando: 'java/bin/java', argumentos: ['-jar', 'fabric-installer.jar', 'server', '-mcversion', '1.21.4', '-loader', '0.16.14'] });
  assert.deepEqual(o.rodar, { comando: 'java/bin/java', argumentos: ['-Xms1G', '-Xmx2G', '-jar', 'fabric-server-launch.jar', 'nogui'] });
  for (const d of receita.modpack.dominios) assert.ok(o.origens.includes(d), d);
  assert.ok(o.dominios_do_jogo.includes('maven.fabricmc.net') && o.dominios_do_jogo.includes('sessionserver.mojang.com'));
  assert.ok(o.disco_maximo > vanilla.disco_maximo + indice.bytes, 'o disco não conta os mods');
  // Pelo link, o .mrpack é um artefato do CDN, com o mesmo hash do pack.
  const pelo = local(montarOfertaComMods(receita, { servidor: 'minecraft-1', versao: '1.21.4', porta: 25565 }, resolvido, { ...pack, origem: 'link', url: 'https://cdn.modrinth.com/data/x/p.mrpack' }));
  assert.deepEqual(pelo.artefatos.at(-1), { nome: 'pack.mrpack', url: 'https://cdn.modrinth.com/data/x/p.mrpack', tamanho: 1434, hash: { algoritmo: 'sha512', hex: 'a'.repeat(128) } });
  assert.deepEqual(local(comandosDoLoader(receita, { id: 'forge', versao: '54.1.0' }, '1.21.4')).rodar.argumentos, ['-Xms1G', '-Xmx2G', '@libraries/net/minecraftforge/forge/1.21.4-54.1.0/unix_args.txt', 'nogui']);
});

// Decisão W1: o Forge e o NeoForge no Windows rodam pelo win_args.txt.
test('o Forge e o NeoForge levam o par do Windows na oferta; o Fabric não leva nenhum', () => {
  const forge = local(comandosDoLoader(receita, { id: 'forge', versao: '47.4.28' }, '1.20.1'));
  assert.deepEqual(forge.porSistema, [{
    plataformas: ['windows-x64'],
    rodar: { comando: 'java/bin/java.exe', argumentos: ['-Xms1G', '-Xmx2G', '@libraries/net/minecraftforge/forge/1.20.1-47.4.28/win_args.txt', 'nogui'] },
    instalar: { comando: 'java/bin/java.exe', argumentos: ['-jar', 'forge-installer.jar', '--installServer'] },
  }]);
  const neo = local(comandosDoLoader(receita, { id: 'neoforge', versao: '21.1.265' }, '1.21.1'));
  assert.deepEqual(neo.porSistema[0].rodar.argumentos[2], '@libraries/net/neoforged/neoforge/21.1.265/win_args.txt');
  assert.deepEqual(local(comandosDoLoader(receita, { id: 'fabric-loader', versao: '0.16.14' }, '1.21.4')).porSistema, []);
  // Nenhum loader da receita fica fora de um sistema.
  for (const [id, l] of Object.entries(receita.modpack.loaders)) assert.equal(l.sistemas, undefined, id);
  // A máquina escolhe o par dela, pela regra do produto.
  const plano = { rodar: forge.rodar, instalar: forge.instalar, porSistema: forge.porSistema };
  assert.equal(local(comandosDaMaquina(plano, 'windows-x64')).rodar.comando, 'java/bin/java.exe');
  assert.deepEqual(local(comandosDaMaquina(plano, 'mac-aarch64')), { rodar: forge.rodar, instalar: forge.instalar });
  assert.deepEqual(local(comandosDaMaquina({ rodar: forge.rodar, instalar: null, porSistema: [] }, 'windows-x64')), { rodar: forge.rodar, instalar: null });
});

test('o pack não troca o win_args.txt nem o java.exe, mesmo lido numa máquina que não é Windows', () => {
  const forge = local(comandosDoLoader(receita, { id: 'forge', versao: '47.4.28' }, '1.20.1'));
  const protegidos = local(caminhosProtegidosDoPack({ rodar: forge.rodar, porSistema: forge.porSistema, modpack: { instalar: forge.instalar }, artefatos: [] }));
  for (const p of ['libraries/net/minecraftforge/forge/1.20.1-47.4.28/win_args.txt', 'libraries/net/minecraftforge/forge/1.20.1-47.4.28/unix_args.txt', 'java/bin/java.exe']) {
    assert.ok(protegidos.includes(p), `${p} não está em ${protegidos.join(', ')}`);
  }
});

// Revisão final (I2): o que o pack traz roda aqui, e a tela do aceite tem de dizer.
test('a oferta com mods traz o termo do pack: o que ele traz roda neste computador', () => {
  const resolvido = local(resolverVersao(receita, '1.21.4', buscarDasFixtures()));
  const indice = local(lerIndice(JSON.stringify(indiceDaProva()), receita)).indice;
  const pack = { origem: 'enviado', sha512: 'a'.repeat(128), bytes: 1434, mc: indice.mc, loader: indice.loader, instalador: null, resumo: { bytesDosArquivos: indice.bytes } };
  const args = { servidor: 'minecraft-1', versao: '1.21.4', porta: 25565 };
  const o = local(montarOfertaComMods(receita, args, resolvido, pack));
  const termo = o.termos.find(t => /modpack/.test(t.titulo));
  assert.ok(termo, JSON.stringify(o.termos));
  assert.match(termo.titulo, /jars inclusive\) rodam neste computador/);
  assert.equal(termo.url, 'https://support.modrinth.com/en/articles/8802351-modrinth-modpack-format-mrpack');
  assert.ok(Buffer.byteLength(termo.titulo) <= 256, 'o produto recusa um título de termo com mais de 256 bytes');
  assert.ok(o.termos.some(t => /EULA/.test(t.titulo)), 'o EULA continua');
  // Pelo link, o termo leva à página da versão do pack.
  const pagina = 'https://modrinth.com/modpack/prova/version/abc';
  assert.equal(local(montarOfertaComMods(receita, args, resolvido, { ...pack, origem: 'link', url: 'https://cdn.modrinth.com/x.mrpack', pagina })).termos.find(t => /modpack/.test(t.titulo)).url, pagina);
});
