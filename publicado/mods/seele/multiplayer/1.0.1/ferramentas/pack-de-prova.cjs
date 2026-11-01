// Os `.mrpack` de prova (API 8 partes 6 e a medida do Forge/NeoForge): packs
// pequenos e de verdade, com mods reais do Modrinth — os que rodam no servidor,
// e um `env.server: unsupported` que a máquina não baixa —, um `overrides` e um
// `server-overrides` que troca um arquivo dele. Os arquivos, as URLs, os
// tamanhos e os hashes são os que a API do Modrinth deu em 31/10/2026
// (`test/fixtures/modrinth-*.json`).
//
//   node ferramentas/pack-de-prova.cjs test/fixtures/fabric-prova.mrpack
//   node ferramentas/pack-de-prova.cjs test/fixtures/forge-prova.mrpack --loader forge
//   node ferramentas/pack-de-prova.cjs test/fixtures/neoforge-prova.mrpack --loader neoforge
//
// - fabric: Fabric 1.21.4, loader 0.16.14, Fabric API e Lithium (servidor), Sodium (só cliente);
// - forge: Forge 1.20.1-47.4.28, FerriteCore e Clumps (servidor), Embeddium (só cliente);
// - neoforge: NeoForge 1.21.1 21.1.265, FerriteCore e Clumps (servidor), Sodium (só cliente).
//
// São os packs das fixtures dos testes e os das provas com rede do SEELE.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { escreverZip } = require(path.join(__dirname, '..', 'test', 'zip.cjs'));

const FIXTURES = path.join(__dirname, '..', 'test', 'fixtures');
const arquivo = (fixture, env) => {
  const v = JSON.parse(fs.readFileSync(path.join(FIXTURES, `modrinth-${fixture}.json`), 'utf8'))[0];
  const f = v.files.find(x => x.primary);
  return { path: 'mods/' + f.filename, hashes: { sha1: f.hashes.sha1, sha512: f.hashes.sha512 }, env, downloads: [f.url], fileSize: f.size };
};

const SERVIDOR = { client: 'required', server: 'required' };
const OPCIONAL = { client: 'optional', server: 'optional' };
const SO_CLIENTE = { client: 'required', server: 'unsupported' };

const PROVAS = {
  fabric: () => ({
    summary: 'Fabric 1.21.4 com Fabric API e Lithium, para as provas do MOD de multiplayer.',
    files: [arquivo('fabric-api', SERVIDOR), arquivo('lithium', OPCIONAL), arquivo('sodium', SO_CLIENTE)],
    dependencies: { minecraft: '1.21.4', 'fabric-loader': '0.16.14' },
  }),
  forge: () => ({
    summary: 'Forge 1.20.1 com FerriteCore e Clumps, para as provas do MOD de multiplayer.',
    files: [arquivo('ferrite-core-forge-1.20.1', OPCIONAL), arquivo('clumps-forge-1.20.1', SERVIDOR), arquivo('embeddium-forge-1.20.1', SO_CLIENTE)],
    dependencies: { minecraft: '1.20.1', forge: '47.4.28' },
  }),
  neoforge: () => ({
    summary: 'NeoForge 1.21.1 com FerriteCore e Clumps, para as provas do MOD de multiplayer.',
    files: [arquivo('ferrite-core-neoforge-1.21.1', OPCIONAL), arquivo('clumps-neoforge-1.21.1', SERVIDOR), arquivo('sodium-neoforge-1.21.1', SO_CLIENTE)],
    dependencies: { minecraft: '1.21.1', neoforge: '21.1.265' },
  }),
};

function indiceDeProva(loader = 'fabric') {
  const p = PROVAS[loader];
  if (!p) throw new Error('loader sem pack de prova: ' + loader);
  return { formatVersion: 1, game: 'minecraft', versionId: '1.0.0', name: 'Prova do SEELE', ...p() };
}

function packDeProva(loader = 'fabric') {
  const indice = indiceDeProva(loader);
  return escreverZip([
    ['modrinth.index.json', JSON.stringify(indice, null, 2) + '\n', true],
    ['overrides/config/seele-prova.txt', 'de overrides\n', false],
    ['overrides/config/so-overrides.txt', 'fica\n', false],
    ['server-overrides/config/seele-prova.txt', 'de server-overrides\n', true],
  ]);
}

module.exports = { packDeProva, indiceDeProva };

if (require.main === module) {
  const destino = process.argv[2];
  const k = process.argv.indexOf('--loader');
  const loader = k > 0 ? process.argv[k + 1] : 'fabric';
  if (!destino || destino.startsWith('--')) throw new Error('uso: node ferramentas/pack-de-prova.cjs <destino.mrpack> [--loader fabric|forge|neoforge]');
  fs.writeFileSync(destino, packDeProva(loader));
  // O índice ao lado, em texto: o que o QuickJS check entrega a quem pede.
  fs.writeFileSync(destino.replace(/\.mrpack$/, '.index.json'), JSON.stringify(indiceDeProva(loader), null, 2) + '\n');
  console.log(`${destino}: ${fs.statSync(destino).size} bytes`);
}
