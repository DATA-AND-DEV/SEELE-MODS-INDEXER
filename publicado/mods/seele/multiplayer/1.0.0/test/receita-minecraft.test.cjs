// A receita do Minecraft Vanilla, lida contra o que a Mojang e a Adoptium
// publicam — pelas fixtures de test/fixtures, gravadas em 30/10/2026. Nada aqui
// sai para a rede.
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { carregar, receitaDoDisco, buscarDasFixtures, fixture } = require('./carregar.cjs');

const m = carregar('servidor', [
  'listarVersoes', 'resolverVersao', 'montarOferta', 'validarConfig', 'configPadrao',
  'escreverPropriedades', 'casarSaida', 'sha1Hex', 'escaparPropriedade', 'nomeEmTexto',
  'lerPropriedades', 'mesclarPropriedades', 'propriedadesTrocadas', 'semCores',
]);
const local = v => JSON.parse(JSON.stringify(v));
const mc = receitaDoDisco('minecraft');
const CASA_DO_ALE = [{ texto: 'Casa', cor: 'aqua' }, { texto: 'do Alê', cor: 'gold' }];

test('as versões vêm do version_manifest_v2, só as releases, as mais novas primeiro', () => {
  const buscar = buscarDasFixtures();
  const r = local(m.listarVersoes(mc, buscar));
  assert.equal(r.ok, true);
  assert.equal(r.versoes.length, 24, 'a receita pede 24');
  assert.equal(r.versoes[0].id, '26.3');
  assert.ok(!r.versoes.some(v => v.id.includes('snapshot')), 'um snapshot entrou na lista');
  assert.deepEqual(buscar.pedidos, ['https://piston-meta.mojang.com/mc/game/version_manifest_v2.json']);
});

test('a Mojang fora do ar é dita com a URL, e não vira uma lista vazia', () => {
  const r = local(m.listarVersoes(mc, () => null));
  assert.deepEqual(r, { ok: false, erro: 'origem-nao-respondeu', url: mc.versoes.manifesto });
  const s = local(m.listarVersoes(mc, () => '<html>manutenção</html>'));
  assert.equal(s.erro, 'origem-ilegivel');
});

test('o server.jar sai de downloads.server, com url, sha1 e tamanho', () => {
  const r = local(m.resolverVersao(mc, '1.21.4', buscarDasFixtures()));
  assert.equal(r.ok, true, JSON.stringify(r));
  const servidor = r.artefatos.find(a => a.id === 'servidor');
  assert.deepEqual(servidor, {
    id: 'servidor',
    nome: 'server.jar',
    url: 'https://piston-data.mojang.com/v1/objects/4707d00eb834b446575d89a61a11b5d548d8c001/server.jar',
    tamanho: 56880250,
    hash: { algoritmo: 'sha1', hex: '4707d00eb834b446575d89a61a11b5d548d8c001' },
    destino: 'server.jar',
  });
});

test('o Java é o majorVersion que a versão pede, da Adoptium, com sha256, por plataforma', () => {
  const buscar = buscarDasFixtures();
  const r = local(m.resolverVersao(mc, '1.21.4', buscar));
  assert.equal(r.javaMajor, 21);
  assert.ok(buscar.pedidos.includes('https://api.adoptium.net/v3/assets/latest/21/hotspot?image_type=jre&vendor=eclipse'));
  const macArm = r.artefatos.find(a => a.nome === r.porPlataforma['mac-aarch64']);
  assert.deepEqual(macArm, {
    id: 'java',
    nome: 'OpenJDK21U-jre_aarch64_mac_hotspot_21.0.13_9.tar.gz',
    url: 'https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.13%2B9/OpenJDK21U-jre_aarch64_mac_hotspot_21.0.13_9.tar.gz',
    tamanho: 47935740,
    hash: { algoritmo: 'sha256', hex: macArm.hash.hex },
    destino: 'java',
    desempacotar: { raiz: 'jdk-21.0.13+9-jre/Contents/Home' },
  });
  assert.match(macArm.hash.hex, /^[0-9a-f]{64}$/);
  const win = r.artefatos.find(a => a.nome === r.porPlataforma['windows-x64']);
  assert.equal(win.desempacotar.raiz, 'jdk-21.0.13+9-jre');
  assert.ok(win.url.endsWith('.zip'));
  assert.deepEqual(Object.keys(r.porPlataforma).sort(), ['linux-aarch64', 'linux-x64', 'mac-aarch64', 'mac-x64', 'windows-x64']);
  assert.deepEqual(r.semJava, []);
});

test('o Minecraft 26.3 pede o Java 25, e o 1.16.5 o 8', () => {
  assert.equal(local(m.resolverVersao(mc, '26.3', buscarDasFixtures())).javaMajor, 25);
  assert.equal(local(m.resolverVersao(mc, '1.16.5', buscarDasFixtures())).javaMajor, 8);
});

test('sem Java 8 para Mac ARM, a receita usa o de Mac Intel, e diz isso', () => {
  const r = local(m.resolverVersao(mc, '1.16.5', buscarDasFixtures()));
  assert.equal(r.porPlataforma['mac-aarch64'], r.porPlataforma['mac-x64']);
  assert.deepEqual(r.substituidas, { 'mac-aarch64': 'mac-x64' });
  // O mesmo pacote não entra duas vezes na oferta.
  const nomes = r.artefatos.map(a => a.nome);
  assert.equal(new Set(nomes).size, nomes.length);
});

test('uma versão que a Mojang não tem é dita pelo nome', () => {
  const r = local(m.resolverVersao(mc, '9.9.9', buscarDasFixtures()));
  assert.deepEqual(r, { ok: false, erro: 'versao-desconhecida', versao: '9.9.9' });
});

/** Um `buscar` em que a Mojang publica `texto` como o JSON da versão, com o sha1 do manifesto de acordo. */
function buscarComVersaoPublicada(id, texto) {
  const manifesto = JSON.parse(fixture('mojang-version_manifest_v2.json'));
  const entrada = manifesto.versions.find(v => v.id === id);
  entrada.sha1 = m.sha1Hex(texto);
  return buscarDasFixtures({ [mc.versoes.manifesto]: JSON.stringify(manifesto), [entrada.url]: texto });
}

test('uma URL fora das origens da receita é recusada antes de chegar à oferta', () => {
  const buscar = buscarDasFixtures();
  const manifesto = JSON.parse(buscar(mc.versoes.manifesto));
  const url = manifesto.versions.find(v => v.id === '1.21.4').url;
  const versao = JSON.parse(buscar(url));
  versao.downloads.server.url = 'https://espelho.qualquer.net/server.jar';
  const r = local(m.resolverVersao(mc, '1.21.4', buscarComVersaoPublicada('1.21.4', JSON.stringify(versao))));
  assert.deepEqual(r, { ok: false, erro: 'url-fora-das-origens', url: 'https://espelho.qualquer.net/server.jar', host: 'espelho.qualquer.net' });
});

test('uma versão sem servidor oficial é dita, e não vira oferta sem jar', () => {
  const buscar = buscarDasFixtures();
  const manifesto = JSON.parse(buscar(mc.versoes.manifesto));
  const url = manifesto.versions.find(v => v.id === '1.21.4').url;
  const versao = JSON.parse(buscar(url));
  delete versao.downloads.server;
  const r = local(m.resolverVersao(mc, '1.21.4', buscarComVersaoPublicada('1.21.4', JSON.stringify(versao))));
  assert.deepEqual(r, { ok: false, erro: 'versao-sem-servidor', versao: '1.21.4', url });
});

test('a oferta tem a forma que mundo.maquinas.pedir valida (OfertaDeMaquina)', () => {
  const resolvido = m.resolverVersao(mc, '1.21.4', buscarDasFixtures());
  const o = local(m.montarOferta(mc, { servidor: 'minecraft-1', versao: '1.21.4', porta: 25565 }, resolvido));
  assert.deepEqual(Object.keys(o).sort(), [
    'artefatos', 'disco_maximo', 'dominios_do_jogo', 'origens', 'pack', 'receita', 'rodar',
    'termos', 'titulo', 'tuneis', 'versao_da_receita', 'versao_do_jogo',
  ]);
  assert.equal(o.receita, 'minecraft');
  assert.equal(o.versao_da_receita, '1.0.0');
  assert.equal(o.versao_do_jogo, '1.21.4');
  // Sem reserva, o túnel da cópia não entra na oferta (e2e da API 8, 31/10).
  assert.deepEqual(o.tuneis, [{ nome: 'minecraft-1', protocolo: 'tcp', porta: 25565 }]);
  assert.deepEqual(o.rodar, { comando: 'java/bin/java', argumentos: ['-Xms1G', '-Xmx2G', '-jar', 'server.jar', 'nogui'] });
  assert.deepEqual(o.termos, [{ titulo: 'EULA do Minecraft (Mojang)', url: 'https://aka.ms/MinecraftEULA' }]);
  assert.equal(o.pack, null);
  assert.ok(Buffer.byteLength(o.titulo) <= 64);
  assert.ok(o.artefatos.length <= 16);
  const sistemas = ['windows-x64', 'mac-aarch64', 'mac-x64', 'linux-x64', 'linux-aarch64'];
  for (const a of o.artefatos) {
    // `plataformas` só nos que não servem em todo sistema (o Java).
    assert.deepEqual(Object.keys(a).filter(k => k !== 'plataformas').sort(), ['hash', 'nome', 'tamanho', 'url']);
    for (const p of a.plataformas ?? []) assert.ok(sistemas.includes(p), p);
    assert.match(a.url, /^https:\/\//);
    const host = new URL(a.url).host;
    assert.ok(o.origens.includes(host), host + ' fora das origens');
  }
  assert.ok(o.disco_maximo > mc.disco.mundoMaximo && o.disco_maximo <= 64 * 1024 ** 3);
});

test('a oferta não muda quando só a configuração muda', () => {
  // O aceite prende a oferta; um campo do esquema de configuração não pede aceite novo.
  const resolvido = m.resolverVersao(mc, '1.21.4', buscarDasFixtures());
  const a = JSON.stringify(m.montarOferta(mc, { servidor: 'minecraft-1', versao: '1.21.4', porta: 25565 }, resolvido));
  const b = JSON.stringify(m.montarOferta(mc, { servidor: 'minecraft-1', versao: '1.21.4', porta: 25565, config: { nome: [{ texto: 'Outro', cor: 'red' }], maximo: 3 } }, resolvido));
  assert.equal(a, b);
});

test('a configuração padrão sai dos padrões da receita', () => {
  assert.deepEqual(local(m.configPadrao(mc)), {
    nome: [{ texto: 'Servidor do SEELE', cor: 'aqua' }], maximo: 10, dificuldade: 'normal', modo: 'survival',
    pvp: true, hardcore: false, protecao: 16, inativo: 0,
  });
});

test('a configuração é conferida contra o esquema da receita, com a frase por campo', () => {
  const r = local(m.validarConfig(mc, { nome: [], maximo: 500, dificuldade: 'pesadelo', pvp: 'sim', modo: 'creative' }));
  assert.deepEqual(r.erros, {
    nome: 'Preencha o nome com ao menos uma palavra.',
    maximo: 'Use um número de 1 a 100.',
    dificuldade: 'Escolha uma das opções.',
    pvp: 'Use ligado ou desligado.',
  });
  const s = local(m.validarConfig(mc, { nome: [{ texto: 'x'.repeat(60), cor: 'aqua' }] }));
  assert.deepEqual(s.erros, { nome: 'Use até 59 caracteres no nome todo; este tem 60.' });
  const t = local(m.validarConfig(mc, { semente: '42' }));
  assert.deepEqual(t.erros, { semente: 'A receita não tem o campo «semente».' });
  const u = local(m.validarConfig(mc, { maximo: 2.5 }));
  assert.deepEqual(u.erros, { maximo: 'Use um número inteiro.' });
});

test('o que não veio fica com o que estava, e o que veio certo entra', () => {
  const r = local(m.validarConfig(mc, { maximo: 4 }, { ...m.configPadrao(mc), nome: CASA_DO_ALE }));
  assert.deepEqual(r.erros, {});
  assert.equal(r.config.maximo, 4);
  assert.deepEqual(local(r.config.nome), CASA_DO_ALE);
});

test('o server.properties sai do esquema, com a porta e o nome escapados', () => {
  const config = { ...local(m.configPadrao(mc)), nome: CASA_DO_ALE, maximo: 4, pvp: false };
  const texto = m.escreverPropriedades(mc, config, 25566);
  const linhas = texto.split('\n');
  assert.ok(linhas[0].startsWith('#'), 'o arquivo diz quem o escreveu');
  assert.ok(linhas.includes('max-players=4'));
  assert.ok(linhas.includes('pvp=false'));
  assert.ok(linhas.includes('server-port=25566'));
  assert.ok(linhas.includes('server-ip=127.0.0.1'), 'o jogo só escuta no túnel');
  assert.ok(linhas.includes('difficulty=normal'));
  assert.ok(linhas.includes('gamemode=survival'));
  assert.ok(linhas.includes('online-mode=true'));
  assert.ok(texto.endsWith('\n'));
});

test('o motd do desenho aprovado: «Casa» em ciano (§b) e «do Alê» em dourado (§6)', () => {
  const texto = m.escreverPropriedades(mc, { ...local(m.configPadrao(mc)), nome: CASA_DO_ALE }, 25565);
  // § é U+00A7: num .properties, \u00a7; o ê, \u00ea.
  assert.ok(texto.split('\n').includes('motd=\\u00a7bCasa \\u00a76do Al\\u00ea'), texto);
  assert.equal(m.nomeEmTexto(CASA_DO_ALE), 'Casa do Alê');
});

test('o padrão escreve uma cor só, e três palavras escrevem três códigos', () => {
  assert.ok(m.escreverPropriedades(mc, local(m.configPadrao(mc)), 25565).includes('motd=\\u00a7bServidor do SEELE\n'));
  const nome = [{ texto: 'A', cor: 'red' }, { texto: 'B', cor: 'dark_gray' }, { texto: 'C', cor: 'light_purple' }];
  assert.ok(m.escreverPropriedades(mc, { ...local(m.configPadrao(mc)), nome }, 25565).includes('motd=\\u00a7cA \\u00a78B \\u00a7dC\n'));
});

test('o arquivo .properties escapa a barra, os dois-pontos, o igual, o cerquilha, a exclamação, a quebra e o que não é ASCII', () => {
  assert.equal(m.escaparPropriedade('a\\b'), 'a\\\\b');
  assert.equal(m.escaparPropriedade('a:b'), 'a\\:b');
  assert.equal(m.escaparPropriedade('a=b'), 'a\\=b');
  assert.equal(m.escaparPropriedade('a#b!c'), 'a\\#b\\!c');
  assert.equal(m.escaparPropriedade('a\nb\rc\td'), 'a\\nb\\rc\\td');
  assert.equal(m.escaparPropriedade('§Ê😀'), '\\u00a7\\u00ca\\ud83d\\ude00');
  assert.equal(m.escaparPropriedade(' começo'), '\\ come\\u00e7o');
  // Um valor com tudo isso não escreve uma segunda propriedade.
  const config = { ...local(m.configPadrao(mc)), nome: [{ texto: 'a:b=c\\d', cor: 'aqua' }] };
  const texto = m.escreverPropriedades(mc, config, 25565);
  assert.ok(texto.includes('motd=\\u00a7ba\\:b\\=c\\\\d\n'), texto);
  const direto = m.escaparPropriedade('a\nserver-ip=0.0.0.0');
  assert.equal(direto, 'a\\nserver-ip\\=0.0.0.0');
});

test('uma cor fora das 16 é recusada, com a palavra e a cor', () => {
  for (const cor of ['roxinho', '#55FFFF', 'b', '', null, 7]) {
    const r = local(m.validarConfig(mc, { nome: [{ texto: 'Casa', cor: 'aqua' }, { texto: 'do Alê', cor }] }));
    assert.deepEqual(r.erros, { nome: `A palavra 2 usa a cor ${typeof cor === 'string' ? '«' + cor + '»' : JSON.stringify(cor)}, que não é uma das 16 do Minecraft.` }, String(cor));
    assert.deepEqual(local(r.config.nome), local(m.configPadrao(mc)).nome, 'a recusa não gravou nada');
  }
  assert.deepEqual(local(m.validarConfig(mc, { nome: CASA_DO_ALE })).erros, {});
});

test('a lista de palavras tem teto: seis', () => {
  const seis = Array.from({ length: 6 }, (_, i) => ({ texto: 'p' + i, cor: 'gold' }));
  assert.deepEqual(local(m.validarConfig(mc, { nome: seis })).erros, {});
  const sete = [...seis, { texto: 'p6', cor: 'gold' }];
  assert.deepEqual(local(m.validarConfig(mc, { nome: sete })).erros, { nome: 'Use até 6 palavras; são 7.' });
  const mil = Array.from({ length: 1000 }, () => ({ texto: 'x', cor: 'gold' }));
  assert.deepEqual(local(m.validarConfig(mc, { nome: mil })).erros, { nome: 'Use até 6 palavras; são 1000.' });
});

test('uma palavra não carrega § nem quebra de linha, nem vem vazia ou torta', () => {
  const erro = nome => local(m.validarConfig(mc, { nome })).erros.nome;
  assert.equal(erro([{ texto: '§4Vermelho', cor: 'aqua' }]), 'A palavra 1 tem § ou uma quebra de linha, que não valem num nome.');
  assert.equal(erro([{ texto: 'a\nserver-ip=0.0.0.0', cor: 'aqua' }]), 'A palavra 1 tem § ou uma quebra de linha, que não valem num nome.');
  assert.equal(erro([{ texto: '   ', cor: 'aqua' }]), 'A palavra 1 está vazia.');
  assert.equal(erro([{ texto: 'a' }]), 'A palavra 1 está mal formada: use {texto, cor}.');
  assert.equal(erro([{ texto: 'a', cor: 'aqua', extra: 1 }]), 'A palavra 1 está mal formada: use {texto, cor}.');
  assert.equal(erro(['Casa']), 'A palavra 1 está mal formada: use {texto, cor}.');
  assert.equal(erro('Casa do Alê'), 'Use uma lista de palavras, cada uma com texto e cor.');
});

test('o tamanho do nome conta as palavras e os espaços entre elas', () => {
  const quase = [{ texto: 'a'.repeat(30), cor: 'aqua' }, { texto: 'b'.repeat(28), cor: 'gold' }]; // 30 + 1 + 28 = 59
  assert.deepEqual(local(m.validarConfig(mc, { nome: quase })).erros, {});
  quase[1].texto += 'b';
  assert.deepEqual(local(m.validarConfig(mc, { nome: quase })).erros, { nome: 'Use até 59 caracteres no nome todo; este tem 60.' });
});

test('a saída do jogo diz quando ele está pronto, e quem entrou e saiu', () => {
  const casar = m.casarSaida(mc);
  assert.deepEqual(local(casar('[12:00:01] [Server thread/INFO]: Done (4.211s)! For help, type "help"')), { tipo: 'pronto' });
  assert.deepEqual(local(casar('[12:00:09] [Server thread/INFO]: Alexandre joined the game')), { tipo: 'entrou', jogador: 'Alexandre' });
  assert.deepEqual(local(casar('[12:05:09] [Server thread/INFO]: Alexandre left the game')), { tipo: 'saiu', jogador: 'Alexandre' });
  assert.equal(casar('[12:05:10] [Server thread/INFO]: <Alexandre> Done (brincadeira)'), null, 'o chat não liga o servidor');
  assert.equal(casar('[12:05:11] [Server thread/INFO]: <Bia> Ze joined the game'), null, 'o chat não põe ninguém dentro');
});

// Revisão final (I10): o chat é registrado como `[..] [Server thread/INFO]: <Bia> texto`,
// e um padrão solto («\]: Done \(») casava com um texto que **contém** «]: Done (».
// Cada padrão agora começa na linha do próprio servidor. As linhas de verdade são as
// do Minecraft 1.21.4 (e do Fabric 0.16.14, que escreve igual) medidas em 31/10.
test('o chat não imita nenhuma linha que a receita lê (pronto, entrou, saiu, salvou, parou)', () => {
  const casar = m.casarSaida(mc);
  const salvou = new RegExp(mc.mundo.salvar.find(p => p.esperar).esperar);
  const parou = new RegExp(mc.saida.parar.esperar);
  // As de verdade casam.
  assert.deepEqual(local(casar('[04:06:14] [Server thread/INFO]: Done (3.137s)! For help, type "help"')), { tipo: 'pronto' });
  assert.ok(salvou.test('[12:20:00] [Server thread/INFO]: Saved the game'));
  assert.ok(parou.test('[12:10:00] [Server thread/INFO]: Stopping the server'));
  // O Forge e o NeoForge põem o nome de quem registra entre colchetes (medido em 31/10: ver abaixo).
  assert.deepEqual(local(casar('[12:00:04] [Server thread/INFO] [minecraft/DedicatedServer]: Done (5.2s)! For help, type "help"')), { tipo: 'pronto' });
  assert.deepEqual(local(casar('[12:00:09] [Server thread/INFO] [minecraft/MinecraftServer]: Bia joined the game')), { tipo: 'entrou', jogador: 'Bia' });
  // O chat, com e sem o «]: » de mentira, e com o «[Not Secure]» da 1.21.4, não casa nada.
  const chats = [
    '[12:05:10] [Server thread/INFO]: <Bia> Done (1.0s)!',
    '[12:05:10] [Server thread/INFO]: <Bia> x]: Done (1.0s)!',
    '[12:05:10] [Server thread/INFO]: [Not Secure] <Bia> x]: Done (1.0s)!',
    '[12:05:11] [Server thread/INFO]: <Bia> x]: Ze joined the game',
    '[12:05:12] [Server thread/INFO]: <Bia> x]: Alexandre left the game',
    '[12:05:13] [Server thread/INFO]: <Bia> x]: Saved the game',
    '[12:05:14] [Server thread/INFO]: <Bia> x]: Stopping the server',
    '[12:05:15] [Server thread/INFO]: [Server] x]: Done (1.0s)!',
    '[12:05:16] [Server thread/INFO] [minecraft/MinecraftServer]: <Bia> x]: Done (1.0s)!',
  ];
  for (const l of chats) {
    assert.equal(casar(l), null, l);
    assert.equal(salvou.test(l), false, l);
    assert.equal(parou.test(l), false, l);
  }
});

// ---- O Forge e o NeoForge de verdade (31/10, um Mac ARM, saída por pipe como o `programa`) ----
// Forge 1.20.1-47.4.28 e NeoForge 1.21.1 21.1.265, cada um com FerriteCore e
// Clumps; o cliente headless (modo offline, só para a medida) entrou como Bia.
const DO_FORGE = [
  '[13:53:24] [Server thread/INFO] [minecraft/DedicatedServer]: Done (1.652s)! For help, type "help"',
  '[14:00:21] [Server thread/INFO] [minecraft/MinecraftServer]: Bia joined the game',
  '[14:00:24] [Server thread/INFO] [minecraft/MinecraftServer]: Bia left the game',
  '[13:53:25] [Server thread/INFO] [minecraft/MinecraftServer]: Saved the game',
  '[13:53:25] [Server thread/INFO] [minecraft/MinecraftServer]: Stopping the server',
];
const DO_NEOFORGE = [
  '[13:53:32] [Server thread/INFO] [minecraft/DedicatedServer]: Done (0.559s)! For help, type "help"',
  '[14:04:30] [Server thread/INFO] [minecraft/MinecraftServer]: Bia joined the game',
  '[14:04:33] [Server thread/INFO] [minecraft/MinecraftServer]: Bia left the game',
  '[13:53:32] [Server thread/INFO] [minecraft/MinecraftServer]: Saved the game',
  '[13:53:32] [Server thread/INFO] [minecraft/MinecraftServer]: Stopping the server',
];

test('as linhas de verdade do Forge 1.20.1 e do NeoForge 1.21.1 casam com cada padrão da receita', () => {
  const casar = m.casarSaida(mc);
  const salvou = new RegExp(mc.mundo.salvar.find(p => p.esperar).esperar);
  const parou = new RegExp(mc.saida.parar.esperar);
  for (const [pronto, entrou, saiu, salvo, parada] of [DO_FORGE, DO_NEOFORGE]) {
    assert.deepEqual(local(casar(pronto)), { tipo: 'pronto' }, pronto);
    assert.deepEqual(local(casar(entrou)), { tipo: 'entrou', jogador: 'Bia' }, entrou);
    assert.deepEqual(local(casar(saiu)), { tipo: 'saiu', jogador: 'Bia' }, saiu);
    assert.ok(salvou.test(salvo), salvo);
    assert.ok(parou.test(parada), parada);
  }
});

test('as cores do terminal saem antes do padrão (o NeoForge as escreve mesmo sem terminal)', () => {
  // Medida: 28 das 74 linhas do NeoForge 21.1.265 (as do `main/`) vinham assim.
  const real = '\u001b[m\u001b[32m[13:53:27.399] [main/INFO] [Launcher/MODLAUNCHER]: JVM identified as Eclipse Adoptium OpenJDK 64-Bit Server VM 21.0.13+9-LTS ';
  assert.equal(m.semCores(real), '[13:53:27.399] [main/INFO] [Launcher/MODLAUNCHER]: JVM identified as Eclipse Adoptium OpenJDK 64-Bit Server VM 21.0.13+9-LTS ');
  const casar = m.casarSaida(mc);
  const pintado = '\u001b[m\u001b[32m' + DO_NEOFORGE[0] + '\u001b[m';
  assert.equal(casar(pintado), null, 'sem tirar as cores, o «Done» pintado não casa');
  assert.deepEqual(local(casar(m.semCores(pintado))), { tipo: 'pronto' });
});

test('o server.properties que o Forge reescreve (UTF-8, sem escapes) é o que o MOD escreveu', () => {
  const escrito = m.escreverPropriedades(mc, { nome: [{ texto: 'Casa', cor: 'aqua' }, { texto: 'com mods', cor: 'gold' }], maximo: 4 }, 25565);
  // O arquivo da pasta depois da prova A do Forge (o jogo o reescreve ao subir).
  assert.deepEqual(local(m.propriedadesTrocadas(escrito, fixture('forge-prova-server.properties'))), []);
  assert.equal(m.lerPropriedades(fixture('forge-prova-server.properties')).get('motd'), '§bCasa §6com mods');
  // O do Create Live 5, trocado pelo Default Server Properties na primeira subida.
  const trocadas = local(m.propriedadesTrocadas(escrito, fixture('forge-createlive5-server.properties')));
  const por = Object.fromEntries(trocadas.map(t => [t.chave, [t.esperado, t.lido]]));
  assert.deepEqual(por['server-ip'], ['127.0.0.1', '']);
  assert.deepEqual(por.motd, ['§bCasa §6com mods', 'A Minecraft Server']);
  assert.deepEqual(por['max-players'], ['4', '20']);
  assert.equal(por['server-port'], undefined, 'a porta era a mesma');
});

test('as chaves do MOD entram no default-server.properties do pack, e as do pack ficam', () => {
  const escrito = m.escreverPropriedades(mc, { maximo: 4 }, 25570);
  const deles = fixture('createlive5-default-server.properties');
  const mesclado = m.mesclarPropriedades(deles, escrito);
  const lido = m.lerPropriedades(mesclado);
  assert.equal(lido.get('level-type'), 'skyblockbuilder:skyblock');
  assert.equal(lido.get('allow-flight'), 'true');
  assert.deepEqual(local(m.propriedadesTrocadas(escrito, mesclado)), []);
  assert.equal(lido.get('server-port'), '25570');
  // Uma chave do MOD que o pack também traz é trocada no lugar, uma vez só.
  const comIp = m.mesclarPropriedades('server-ip=0.0.0.0\nlevel-type=flat\nserver-ip=1.2.3.4\n', escrito);
  assert.equal((comIp.match(/^server-ip=/gm) || []).length, 1);
  assert.equal(m.lerPropriedades(comIp).get('server-ip'), '127.0.0.1');
  // Escrever de novo sobre o já mesclado não cresce.
  assert.equal(m.mesclarPropriedades(mesclado, escrito), mesclado);
});

// ---- o sha1 do JSON de cada versão ----

const crypto = require('node:crypto');
const URL_1_21_4 = 'https://piston-meta.mojang.com/v1/packages/64843a304d7747da779448f853323962233f39ff/1.21.4.json';

test('o sha1 em JS puro dá o mesmo que o do Node, inclusive com acentos e além de um bloco', () => {
  const casos = ['', 'abc', 'é', 'Casa do Alê §', '😀 emoji', 'x'.repeat(55), 'x'.repeat(56), 'x'.repeat(64), 'y'.repeat(1000)];
  for (const texto of casos) {
    assert.equal(m.sha1Hex(texto), crypto.createHash('sha1').update(texto, 'utf8').digest('hex'), JSON.stringify(texto.slice(0, 20)));
  }
  assert.equal(m.sha1Hex('abc'), 'a9993e364706816aba3e25717850c26c9cd0d89d');
});

test('o JSON de cada versão bate com o sha1 do manifesto, nas três fixtures gravadas', () => {
  for (const id of ['26.3', '1.21.4', '1.16.5']) {
    const r = local(m.resolverVersao(mc, id, buscarDasFixtures()));
    assert.equal(r.ok, true, id + ' ' + JSON.stringify(r));
  }
});

test('um JSON de versão adulterado é recusado com a URL, o sha1 esperado e o obtido', () => {
  const original = fixture('mojang-1.21.4.json');
  const adulterado = original.replace('"majorVersion": 21', '"majorVersion": 8');
  assert.notEqual(adulterado, original, 'o teste não adulterou nada');
  const r = local(m.resolverVersao(mc, '1.21.4', buscarDasFixtures({ [URL_1_21_4]: adulterado })));
  assert.deepEqual(r, {
    ok: false,
    erro: 'sha1-diferente',
    url: URL_1_21_4,
    esperado: '64843a304d7747da779448f853323962233f39ff',
    obtido: crypto.createHash('sha1').update(adulterado, 'utf8').digest('hex'),
  });
});

test('um manifesto sem sha1 para a versão não deixa a conferência passar em branco', () => {
  const manifesto = JSON.parse(fixture('mojang-version_manifest_v2.json'));
  delete manifesto.versions.find(v => v.id === '1.21.4').sha1;
  const r = local(m.resolverVersao(mc, '1.21.4', buscarDasFixtures({ [mc.versoes.manifesto]: JSON.stringify(manifesto) })));
  assert.equal(r.ok, false);
  assert.equal(r.erro, 'manifesto-sem-sha1');
  assert.equal(r.url, URL_1_21_4);
});

test('cada Java da oferta leva os sistemas em que serve, e o server.jar serve em todos', () => {
  const resolvido = m.resolverVersao(mc, '1.21.4', buscarDasFixtures());
  const o = local(m.montarOferta(mc, { servidor: 'minecraft-1', versao: '1.21.4', porta: 25565 }, resolvido));
  const jar = o.artefatos.find(a => a.nome === 'server.jar');
  assert.equal(jar.plataformas, undefined);
  const javas = o.artefatos.filter(a => a !== jar);
  assert.ok(javas.length >= 4, JSON.stringify(javas.map(a => a.nome)));
  // Cada sistema que tem Java aparece em exatamente um artefato.
  const marcados = javas.flatMap(a => a.plataformas);
  assert.deepEqual([...marcados].sort(), Object.keys(resolvido.porPlataforma).sort());
  for (const [sistema, nome] of Object.entries(resolvido.porPlataforma)) {
    assert.ok(javas.find(a => a.nome === nome).plataformas.includes(sistema), sistema);
  }
});
