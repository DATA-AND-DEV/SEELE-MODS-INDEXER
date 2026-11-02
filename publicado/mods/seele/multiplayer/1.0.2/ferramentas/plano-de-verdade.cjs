// A oferta e o plano que a metade de servidor deste MOD dá a uma máquina
// aceita, para um Minecraft 1.21.4, montados pelo código de verdade
// (fonte/servidor.js, pelo anfitrião de test/anfitriao.cjs) sobre as fixtures
// byte a byte da Mojang e da Adoptium. É a entrada das duas provas com rede do
// SEELE (API 8 parte 4):
//
//   node ferramentas/plano-de-verdade.cjs /caminho/plano.json
//   SEELE_MINECRAFT_DE_VERDADE=/caminho/plano.json SEELE_MOD_MULTIPLAYER=$PWD \
//   SEELE_MINECRAFT_CASA=/uma/pasta cargo test -p seele-app --bin seele-app \
//     minecraft_de_verdade -- --ignored --nocapture
//   SEELE_MINECRAFT_DE_VERDADE=/caminho/plano.json cargo test -p seele-conformance \
//     --test minecraft_pelo_tunel -- --ignored --nocapture
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { criarAnfitriao } = require(path.join(__dirname, '..', 'test', 'anfitriao.cjs'));
const { buscarDasFixtures } = require(path.join(__dirname, '..', 'test', 'carregar.cjs'));

const destino = process.argv[2];
// `--mods` (parte 6): o mesmo Minecraft com o pack de prova (Fabric 1.21.4,
// ferramentas/pack-de-prova.cjs), enviado ao volume como quem configura o
// envia; o plano leva `pack_local`, o .mrpack que o volume guardaria.
//
// `--mods <outro.mrpack>`: qualquer pack (o de prova do Forge ou do NeoForge,
// ou um publicado no Modrinth). Para uma versão do Minecraft, um Java ou um
// instalador de loader que as fixtures não têm, a metade de servidor busca da
// rede de verdade (`curl`), como o `mundo.buscar` do produto faria.
const k = process.argv.indexOf('--mods');
const comMods = k > 0;
const outroPack = comMods && process.argv[k + 1] && !process.argv[k + 1].startsWith('--') ? path.resolve(process.argv[k + 1]) : null;
if (!destino || destino.startsWith('--')) throw new Error('uso: node ferramentas/plano-de-verdade.cjs <plano.json> [--mods [pack.mrpack]]');
const dasFixtures = buscarDasFixtures();
const buscar = url => {
  const daqui = dasFixtures(url);
  if (daqui !== null) return daqui;
  try {
    return execFileSync('curl', ['-sSfL', '--max-time', '60', url], { maxBuffer: 64 * 1024 * 1024 }).toString('utf8');
  } catch {
    return null;
  }
};
const a = criarAnfitriao({ buscar });
const id = a.acao(1, 'criar-servidor-de-jogo', { op: 'criar', receita: 'minecraft' }).servidor.id;
const r = a.acao(1, 'configurar-servidor-de-jogo', {
  op: 'configurar', id, versao: '1.21.4', quem: '2', variante: comMods ? 'com-mods' : 'vanilla',
  config: { nome: [{ texto: 'Casa', cor: 'aqua' }, { texto: comMods ? 'com mods' : 'do SEELE', cor: 'gold' }], maximo: 4 },
});
if (!r.ok) throw new Error(JSON.stringify(r));
let packLocal = null;
if (comMods) {
  packLocal = outroPack ?? path.join(__dirname, '..', 'test', 'fixtures', 'fabric-prova.mrpack');
  const e = a.acao(1, 'configurar-servidor-de-jogo', { op: 'pack-enviar', id });
  a.enviarAoVolume(e.token, fs.readFileSync(packLocal));
  const c = a.acao(1, 'configurar-servidor-de-jogo', { op: 'pack-chegou', id, token: e.token });
  if (!c.ok) throw new Error(JSON.stringify(c));
  console.log(`pack: ${c.servidor.versao} ${JSON.stringify(c.servidor.pack?.loader ?? null)}`);
}
a.acao(1, 'ligar-desligar-servidor-de-jogo', { op: 'ligar', id });
a.aceitar(id);
const oferta = a.pedidosDeMaquina.at(-1).oferta;
const plano = a.daMaquina(2, id, { op: 'plano' });
if (!plano.ok) throw new Error(JSON.stringify(plano));
// O que a prova confere na pasta, de qualquer loader: cada mod do servidor em
// `mods/`, e nenhum dos `env.server: unsupported`.
let esperado = null;
if (packLocal) {
  const indice = JSON.parse(execFileSync('unzip', ['-p', packLocal, 'modrinth.index.json'], { maxBuffer: 64 * 1024 * 1024 }).toString('utf8'));
  const nome = f => f.path.split('/').pop();
  esperado = {
    presentes: indice.files.filter(f => f.env?.server !== 'unsupported' && f.path.startsWith('mods/')).map(nome),
    ausentes: indice.files.filter(f => f.env?.server === 'unsupported' && f.path.startsWith('mods/')).map(nome),
  };
}
fs.writeFileSync(destino, JSON.stringify({ servidor: id, oferta, plano: plano.plano, ...(packLocal ? { pack_local: packLocal, pack_esperado: esperado } : {}) }, null, 1));
console.log(`${id}: ${oferta.artefatos.length} artefatos na oferta, plano com ligar=${plano.plano.ligar}`);
