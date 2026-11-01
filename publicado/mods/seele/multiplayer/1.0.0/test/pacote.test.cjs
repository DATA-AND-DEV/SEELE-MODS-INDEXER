// O manifesto e o pacote: o que o SEELE confere na instalação (api/v8.json,
// «manifesto», «poderes», «maquina», «permissoes») e que o que vai no pacote é
// o que o build escreveria agora.
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { montar, RAIZ } = require('../ferramentas/montar.cjs');

const manifesto = JSON.parse(fs.readFileSync(path.join(RAIZ, 'mod.json'), 'utf8'));

test('as metades do pacote são as que o build escreve agora', () => {
  for (const metade of ['servidor', 'maquina', 'cliente']) {
    const noDisco = fs.readFileSync(path.join(RAIZ, metade, 'main.js'), 'utf8');
    assert.equal(noDisco, montar(metade), `${metade}/main.js está velho: rode npm run build`);
  }
});

test('o manifesto declara a API 8, só o app, a metade de máquina e os poderes', () => {
  assert.equal(manifesto.api, 8);
  assert.deepEqual(manifesto.plataformas, ['app']);
  assert.equal(manifesto.maquina, 'maquina/main.js');
  assert.deepEqual(manifesto.poderes, ['porta', 'programa']);
  assert.ok(manifesto.server, 'a metade de máquina pede a de servidor (MaquinaSemServidor)');
});

test('as permissões são as quatro ações, com os padrões do desenho (§7)', () => {
  assert.deepEqual(manifesto.permissoes.map(p => [p.acao, p.todos]), [
    ['criar-servidor-de-jogo', false],
    ['configurar-servidor-de-jogo', false],
    ['ligar-desligar-servidor-de-jogo', false],
    ['entrar-no-jogo', true],
  ]);
  for (const p of manifesto.permissoes) {
    assert.match(p.acao, /^[a-z0-9-]{1,32}$/);
    assert.ok(p.nome.length > 0);
  }
});

test('o manifesto não tem chave que o SEELE recusaria', () => {
  const conhecidas = ['schema', 'id', 'version', 'api', 'repo', 'reach', 'client', 'server', 'arquivos', 'tema', 'plataformas', 'state', 'permissoes', 'poderes', 'maquina'];
  assert.deepEqual(Object.keys(manifesto).filter(k => !conhecidas.includes(k)), []);
  assert.ok(manifesto.reach.length <= 16);
  for (const r of manifesto.reach) assert.ok(Buffer.byteLength(r) <= 48, `alcance grande demais: ${r}`);
});

test('o pacote leva as três metades e o manifesto, e recusa um destino que existe', () => {
  const destino = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'mp-')) + '/pacote';
  execFileSync(process.execPath, [path.join(RAIZ, 'ferramentas/package.mjs'), destino]);
  const levados = ['mod.json', 'cliente/main.js', 'servidor/main.js', 'maquina/main.js'];
  for (const f of levados) assert.ok(fs.existsSync(path.join(destino, f)), f);
  assert.throws(() => execFileSync(process.execPath, [path.join(RAIZ, 'ferramentas/package.mjs'), destino], { stdio: 'pipe' }));
  fs.rmSync(path.dirname(destino), { recursive: true });
});

test('o contrato copiado é o api/v8.json lido para escrever este MOD', () => {
  const hash = require('node:crypto').createHash('sha256').update(fs.readFileSync(path.join(__dirname, 'contrato', 'api-v8.json'))).digest('hex');
  // A v8 ainda emenda até sair (api/README.md): copie de novo e atualize o número.
  // A da fusão com a 0.19 (desenho/api-8-sobre-0.19): imagem e som até 100 MiB.
  // E a da reserva (parte 7) por cima, e a de «sem quem hospeda» (aoReconectar).
  // E a da revisão final (I1): reservado-ao-aceite e pasta-fora-do-aceite.
  // E a do Windows (decisões W1 e W7): oferta.por_sistema e os travados do empacotar.
  // E a do servidor que reinicia (SEELE fc9af2a0): o momento MetadeSubiu.
  // E a do papel no pedido: a tela diz que é a reserva, e o resumo o amarra.
  assert.equal(hash, 'b980efbbec57784a030997a64dabd02a65c2dbfc0530593dccfb39ec7b04234f');
});
