// O anfitrião da metade de servidor, simulado pelo que a API 8 diz
// (test/contrato/api-v8.json): `aoPedir` com o contexto do servidor, o portão
// das ações (cargos), `dados` transacional, `mundo.avisar` e `mundo.maquinas`
// declarativos (só saem se a chamada termina), os momentos `MaquinaAceitou`,
// `MaquinaRecusou` e `MaquinaParou`, e o `contexto.maquina` que só a máquina
// aceita recebe.
//
// O que ele não prova: o executor de verdade, os tetos de tempo e de memória e
// a tela de aceite do produto. Para o motor, há o ferramentas/quickjs-check.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const { buscarDasFixtures } = require('./carregar.cjs');
const { lerZip } = require('./zip.cjs');
const { montar } = require('../ferramentas/montar.cjs');

const RAIZ = path.resolve(__dirname, '..');
const manifesto = JSON.parse(fs.readFileSync(path.join(RAIZ, 'mod.json'), 'utf8'));
const DECLARADAS = manifesto.permissoes.map(p => p.acao);
const CHAVES_DA_OFERTA = ['titulo', 'receita', 'versao_da_receita', 'versao_do_jogo', 'tuneis', 'artefatos', 'pack', 'origens', 'dominios_do_jogo', 'rodar', 'disco_maximo', 'termos', 'instalar', 'por_sistema'];

/**
 * O que o produto devolve de um `.mrpack` (seele-server `mods::pack`):
 * `{ ok, bytes, sha512, indice }` ou `{ ok: false, erro }`.
 */
function packLido(bytes) {
  let entradas;
  try { entradas = lerZip(bytes); } catch { return { ok: false, erro: 'nao-e-pack' }; }
  const indice = entradas.find(e => e.nome === 'modrinth.index.json');
  if (!indice) return { ok: false, erro: 'nao-e-pack' };
  return { ok: true, bytes: bytes.length, sha512: crypto.createHash('sha512').update(bytes).digest('hex'), indice: indice.dados.toString('utf8') };
}
const servidorValido = s => typeof s === 'string' && s.length <= 32 && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(s);
/** O papel de um pedido ou de um aviso (API 8 parte 7): principal sem a chave. */
function papelDoPedido(papel) {
  if (papel === undefined || papel === null) return 'principal';
  if (!['principal', 'reserva'].includes(papel)) throw new Error('papel-invalido');
  return papel;
}
/** A chave do livro: o servidor de jogo e o papel. */
const lugar = (servidor, papel = 'principal') => (papel === 'reserva' ? servidor + '#reserva' : servidor);

/**
 * @param {object} opcoes
 *   codigo: o código da metade de servidor (padrão: o que o build escreveria agora)
 *   buscar: o `mundo.buscar` (padrão: as fixtures)
 *   concessoes: pessoa -> ações que ela tem (padrão: a pessoa 1 tem todas, e todos têm entrar-no-jogo)
 */
function criarAnfitriao(opcoes = {}) {
  const codigo = opcoes.codigo ?? montar('servidor');
  const buscar = opcoes.buscar ?? buscarDasFixtures();
  const concessoes = new Map(Object.entries(opcoes.concessoes ?? { 1: DECLARADAS }));
  const todos = manifesto.permissoes.filter(p => p.todos).map(p => p.acao);
  const temAcao = (pessoa, acao) => todos.includes(acao) || (concessoes.get(String(pessoa)) ?? []).includes(acao);

  let dados = {};
  let agora = 1_000_000;
  const registro = [];
  const avisosAJanelas = [];
  const avisosAMaquinas = [];
  const pedidosDeMaquina = [];
  const mudancasDePosse = [];
  /** O livro do produto: lugar (servidor de jogo, e `#reserva` na reserva) -> { quem, oferta, aceito, papel }. */
  const livro = new Map();
  /** A posse: servidor de jogo -> papel. Ausente é a principal. */
  const donas = new Map();
  const conectados = new Set(opcoes.conectados ?? ['1', '2', '3']);

  // A cada chamada, o que ela declarou; só sai se ela terminar.
  let declarado = null;
  const mundo = {
    agora: () => agora,
    registrar: texto => registro.push(String(texto)),
    buscar: url => buscar(url),
    avisar: aviso => {
      assert.ok(aviso && typeof aviso === 'object', 'aviso-invalido');
      assert.ok(Buffer.byteLength(JSON.stringify(aviso.carga)) <= 1024, 'aviso-grande-demais: ' + JSON.stringify(aviso.carga));
      declarado.janelas.push(JSON.parse(JSON.stringify(aviso)));
      return { ok: true };
    },
    maquinas: {
      pedir: pedido => {
        if (!pedido || typeof pedido !== 'object') throw new Error('pedido-invalido');
        if (!servidorValido(pedido.servidor)) throw new Error('servidor-invalido');
        if (!/^[1-9][0-9]*$/.test(String(pedido.quem))) throw new Error('quem-invalido');
        const oferta = pedido.oferta;
        if (!oferta || typeof oferta !== 'object') throw new Error('oferta-invalida:oferta');
        const estranha = Object.keys(oferta).find(k => !CHAVES_DA_OFERTA.includes(k));
        if (estranha) throw new Error('oferta-invalida:' + estranha);
        if (Buffer.byteLength(oferta.titulo) > 64) throw new Error('oferta-invalida:titulo');
        if (oferta.artefatos.length > 16) throw new Error('oferta-invalida:artefatos');
        for (const a of oferta.artefatos) {
          if (!/^https:\/\/\S+$/.test(a.url)) throw new Error('oferta-invalida:artefato_url');
          const tam = { sha1: 40, sha256: 64, sha512: 128 }[a.hash.algoritmo];
          if (!tam || a.hash.hex.length !== tam) throw new Error('oferta-invalida:artefato_hash');
          // A marca de sistema (API 8 parte 4): lista fechada, sem repetir (PLATAFORMAS_DE_MAQUINA).
          const sistemas = ['windows-x64', 'mac-aarch64', 'mac-x64', 'linux-x64', 'linux-aarch64'];
          const marca = a.plataformas ?? [];
          if (!Array.isArray(marca) || marca.some((p, i) => !sistemas.includes(p) || marca.indexOf(p) !== i)) throw new Error('oferta-invalida:artefato_plataformas');
          const estranhaNoArtefato = Object.keys(a).find(k => !['nome', 'url', 'tamanho', 'hash', 'plataformas'].includes(k));
          if (estranhaNoArtefato) throw new Error('oferta-invalida:artefatos');
        }
        if (oferta.disco_maximo > 64 * 1024 ** 3) throw new Error('oferta-invalida:disco_maximo');
        if (oferta.pack !== null && oferta.pack !== undefined && (oferta.pack.algoritmo !== 'sha512' || !/^[0-9a-f]{128}$/.test(oferta.pack.hex))) throw new Error('oferta-invalida:pack');
        // Os comandos de cada sistema (decisão W1), pela régua do fio
        // (`OfertaDeMaquina::validate`): uma entrada com sistemas da lista, um
        // sistema numa entrada só, só as três chaves.
        const sistemasDoFio = ['windows-x64', 'mac-aarch64', 'mac-x64', 'linux-x64', 'linux-aarch64'];
        const porSistema = oferta.por_sistema ?? [];
        if (!Array.isArray(porSistema) || porSistema.length > 5) throw new Error('oferta-invalida:por_sistema');
        const jaVistos = [];
        for (const e of porSistema) {
          if (Object.keys(e).some(k => !['plataformas', 'rodar', 'instalar'].includes(k))) throw new Error('oferta-invalida:por_sistema');
          if (!Array.isArray(e.plataformas) || !e.plataformas.length) throw new Error('oferta-invalida:por_sistema_plataformas');
          for (const p of e.plataformas) {
            if (!sistemasDoFio.includes(p) || jaVistos.includes(p)) throw new Error('oferta-invalida:por_sistema_plataformas');
            jaVistos.push(p);
          }
        }
        for (const c of [oferta.rodar, oferta.instalar, ...porSistema.flatMap(e => [e.rodar, e.instalar])]) {
          if (c && (typeof c.comando !== 'string' || !Array.isArray(c.argumentos) || Object.keys(c).some(k => !['comando', 'argumentos'].includes(k)))) throw new Error('oferta-invalida:comando');
        }
        const papel = papelDoPedido(pedido.papel);
        // A tela do aceite mostra os túneis: cada nome tem de caber num túnel.
        for (const t of oferta.tuneis) if (!servidorValido(t.nome)) throw new Error('oferta-invalida:tuneis');
        declarado.maquinas = declarado.maquinas.filter(p => !(p.servidor === pedido.servidor && p.papel === papel));
        declarado.maquinas.push(JSON.parse(JSON.stringify({ quem: String(pedido.quem), servidor: pedido.servidor, papel, oferta })));
      },
      avisar: aviso => {
        if (!servidorValido(aviso?.servidor)) throw new Error('servidor-invalido');
        if (aviso.carga === undefined) throw new Error('aviso-invalido');
        assert.ok(Buffer.byteLength(JSON.stringify(aviso.carga)) <= 1024, 'aviso-grande-demais');
        const papel = papelDoPedido(aviso.papel);
        declarado.avisos = declarado.avisos.filter(a => !(a.servidor === aviso.servidor && a.papel === papel));
        declarado.avisos.push({ ...JSON.parse(JSON.stringify(aviso)), papel });
      },
      // A posse (API 8 parte 7): só a dona serve.
      dona: pedido => {
        if (!servidorValido(pedido?.servidor)) throw new Error('servidor-invalido');
        if (!['principal', 'reserva'].includes(pedido.papel)) throw new Error('papel-invalido');
        declarado.donas.push({ servidor: pedido.servidor, papel: pedido.papel });
      },
    },
  };
  // O pack pelo link (`mundo.buscarPack`): os bytes que o CDN daria, por URL.
  const packsDoCdn = new Map(Object.entries(opcoes.packsDoCdn ?? {}));
  mundo.buscarPack = ({ url, sha512, tamanho }) => {
    if (!String(url).startsWith('https://')) return { ok: false, erro: 'nao-e-https' };
    if (tamanho > 4 * 1024 * 1024) return { ok: false, erro: 'grande-demais', bytes: tamanho, teto: 4 * 1024 * 1024 };
    const bytes = packsDoCdn.get(url);
    if (!bytes) return { ok: false, erro: 'busca-falhou' };
    const lido = packLido(bytes);
    if (!lido.ok) return lido;
    if (lido.sha512 !== sha512 || lido.bytes !== tamanho) return { ok: false, erro: 'hash-nao-bate', esperado: sha512, obtido: lido.sha512 };
    return lido;
  };
  // O volume da metade de servidor (ADR 0048): a espera, e o arquivo que o
  // fluxo de quem configura deixa (o teste o entrega por `enviarAoVolume`).
  const esperas = new Map();
  const volumes = new Map();
  const volume = {
    esperar: (token, caminho, tipos, prazo) => {
      if (!token || !caminho || !tipos.length || esperas.has(token)) return false;
      esperas.set(token, { caminho, tipos, prazo });
      return true;
    },
    tamanho: caminho => (volumes.has(caminho) ? volumes.get(caminho).length : null),
    servir: caminho => (volumes.has(caminho) ? caminho : null),
    apagar: caminho => volumes.delete(caminho),
    pack: caminho => (volumes.has(caminho) ? packLido(volumes.get(caminho)) : { ok: false, erro: 'nao-existe' }),
  };
  const contexto = vm.createContext({ console, mundo, volume, dados: {} });
  vm.runInContext(codigo, contexto, { filename: 'servidor/main.js' });
  assert.equal(typeof contexto.aoPedir, 'function', 'a metade de servidor não define aoPedir');

  /** Uma chamada, transacional como a do produto. */
  function chamar(fn) {
    declarado = { janelas: [], maquinas: [], avisos: [], donas: [] };
    const antes = JSON.stringify(dados);
    contexto.dados = Object.assign(Object.create(null), dados);
    let resultado;
    try {
      resultado = fn();
    } catch (erro) {
      dados = JSON.parse(antes);
      declarado = null;
      throw erro;
    }
    for (const [k, v] of Object.entries(contexto.dados)) assert.equal(typeof v, 'string', `dados.${k} não é texto`);
    const uso = Object.entries(contexto.dados).reduce((n, [k, v]) => n + Buffer.byteLength(k) + Buffer.byteLength(v), 0);
    assert.ok(uso <= 256 * 1024, 'quintal-cheio: ' + uso);
    dados = { ...contexto.dados };
    avisosAJanelas.push(...declarado.janelas);
    // A posse antes dos pedidos e dos avisos, como o despejo do produto.
    for (const d of declarado.donas) {
      const antes = donas.get(d.servidor) ?? 'principal';
      donas.set(d.servidor, d.papel);
      if (antes !== d.papel) mudancasDePosse.push({ servidor: d.servidor, de: antes, para: d.papel });
    }
    for (const p of declarado.maquinas) {
      pedidosDeMaquina.push(p);
      if (!conectados.has(p.quem)) {
        momentoInterno('MaquinaRecusou', { servidor: p.servidor, papel: p.papel, pessoa: p.quem, motivo: 'nao-esta-aqui' });
        continue;
      }
      const outro = livro.get(lugar(p.servidor, p.papel === 'reserva' ? 'principal' : 'reserva'));
      if (outro && outro.quem === p.quem) {
        momentoInterno('MaquinaRecusou', { servidor: p.servidor, papel: p.papel, pessoa: p.quem, motivo: 'mesma-pessoa-nas-duas' });
        continue;
      }
      // Um pedido a outra pessoa dispensa a máquina de antes daquele papel.
      const antes = livro.get(lugar(p.servidor, p.papel));
      livro.set(lugar(p.servidor, p.papel), { quem: p.quem, oferta: p.oferta, aceito: false, papel: p.papel, servidor: p.servidor });
      if (antes && antes.quem !== p.quem && antes.aceito) {
        momentoInterno('MaquinaParou', { servidor: p.servidor, papel: p.papel, pessoa: antes.quem, motivo: 'outro-pedido' });
      }
    }
    for (const a of declarado.avisos) {
      const maquina = livro.get(lugar(a.servidor, a.papel));
      if (maquina?.aceito) avisosAMaquinas.push({ ...a, para: maquina.quem });
      else registro.push('sem-maquina: ' + a.servidor + ' ' + a.papel);
    }
    declarado = null;
    return resultado;
  }

  const fila = [];
  function momentoInterno(nome, carga) {
    fila.push([nome, carga]);
  }
  function escoar() {
    while (fila.length) {
      const [nome, carga] = fila.shift();
      if (typeof contexto.aoAcontecer === 'function') chamar(() => contexto.aoAcontecer(nome, JSON.stringify(carga)));
    }
  }

  return {
    get dados() { return dados; },
    registro, avisosAJanelas, avisosAMaquinas, pedidosDeMaquina, livro, donas, mudancasDePosse, conectados, concessoes, esperas, volumes,
    /** Quem é a dona agora de um servidor de jogo, para o produto. */
    dona: servidor => donas.get(servidor) ?? 'principal',

    /**
     * O fluxo de volume (`SeeleUI.enviar`): o produto consome a espera e confere
     * os bytes contra o tipo e o teto dela (64 MiB de pack, 10 MiB no resto).
     */
    enviarAoVolume(token, bytes) {
      const e = esperas.get(token);
      if (!e) throw Object.assign(new Error('sem-espera'), { erro: 'sem-espera' });
      esperas.delete(token);
      const teto = e.tipos.includes('mrpack') ? 64 * 1024 * 1024 : 10 * 1024 * 1024;
      if (bytes.length > teto) throw Object.assign(new Error('arquivo-grande-demais'), { erro: 'arquivo-grande-demais', tamanho: bytes.length, teto });
      if (e.tipos.includes('mrpack') && !packLido(bytes).ok) throw Object.assign(new Error('formato-desconhecido'), { erro: 'formato-desconhecido' });
      volumes.set(e.caminho, Buffer.from(bytes));
    },
    /** O que `PedidoDeImagem::Ler` faz: o `aoPedir` autoriza, e o produto lê o volume. */
    lerDoVolume(pessoa, valor) {
      const r = this.pedir(pessoa, valor);
      if (!r.ok || !r.volume || !volumes.has(r.volume)) throw Object.assign(new Error('leitura recusada pelo MOD'), { erro: 'leitura recusada pelo MOD' });
      return volumes.get(r.volume);
    },
    passar(segundos) { agora += segundos; },

    /** Um `SeeleMods.request`: sem ação, o contexto.acao é null. */
    pedir(pessoa, valor) {
      const ctx = { person: String(pessoa), channel: null, admin: String(pessoa) === '1', write: true, sala: null, acao: null, permissoes: DECLARADAS.filter(a => temAcao(pessoa, a)) };
      const r = chamar(() => contexto.aoPedir(JSON.stringify(ctx), JSON.stringify(valor)));
      escoar();
      return JSON.parse(r);
    },

    /** Um `SeeleMods.acao`: o portão dos cargos vem antes, e o MOD nem é chamado sem a permissão. */
    acao(pessoa, acao, valor) {
      if (!DECLARADAS.includes(acao)) return { ok: false, recusa: 'acao-nao-declarada' };
      if (!temAcao(pessoa, acao)) return { ok: false, recusa: 'sem-permissao' };
      const ctx = { person: String(pessoa), channel: null, admin: String(pessoa) === '1', write: true, sala: null, acao, permissoes: DECLARADAS.filter(a => temAcao(pessoa, a)) };
      const r = chamar(() => contexto.aoPedir(JSON.stringify(ctx), JSON.stringify(valor)));
      escoar();
      return JSON.parse(r);
    },

    /** Um `PedidoDaMaquina`: só uma máquina aceita daquele servidor de jogo chega ao MOD, com o papel e a posse. */
    daMaquina(pessoa, servidor, valor) {
      const maquina = [livro.get(lugar(servidor, 'principal')), livro.get(lugar(servidor, 'reserva'))]
        .find(m => m && m.aceito && m.quem === String(pessoa));
      if (!maquina) return { dispensada: 'sem-aceite' };
      const dona = (donas.get(servidor) ?? 'principal') === maquina.papel;
      const ctx = { person: String(pessoa), channel: null, admin: false, write: true, sala: null, acao: null, permissoes: [], maquina: { servidor, papel: maquina.papel, dona } };
      const r = chamar(() => contexto.aoPedir(JSON.stringify(ctx), JSON.stringify(valor)));
      escoar();
      return JSON.parse(r);
    },

    /** A pessoa da máquina aceita, na tela do produto. */
    aceitar(servidor, papel = 'principal') {
      const maquina = livro.get(lugar(servidor, papel));
      assert.ok(maquina, `ninguém foi chamado a rodar ${servidor} (${papel})`);
      maquina.aceito = true;
      momentoInterno('MaquinaAceitou', { servidor, papel, pessoa: maquina.quem });
      escoar();
    },
    recusar(servidor, motivo = 'pelo-dono', papel = 'principal') {
      const maquina = livro.get(lugar(servidor, papel));
      livro.delete(lugar(servidor, papel));
      momentoInterno('MaquinaRecusou', { servidor, papel, pessoa: maquina.quem, motivo });
      escoar();
    },
    /** O botão do produto que desliga, ou a pessoa que sai. */
    parar(servidor, motivo = 'pelo-dono', papel = 'principal') {
      const maquina = livro.get(lugar(servidor, papel));
      livro.delete(lugar(servidor, papel));
      momentoInterno('MaquinaParou', { servidor, papel, pessoa: maquina.quem, motivo });
      escoar();
      return maquina;
    },
    /** O prazo do produto venceu com o lugar vazio (MaquinaSumiu). */
    sumir(servidor, papel = 'principal', pessoa, segundos = 60, motivo = 'saiu') {
      momentoInterno('MaquinaSumiu', { servidor, papel, pessoa: String(pessoa), motivo, segundos });
      escoar();
    },
    /**
     * **O servidor SEELE reinicia** (API 8, `MetadeSubiu`): o livro e a posse
     * nascem vazios na memória do produto, o quintal fica, e a metade de
     * servidor ouve `MetadeSubiu` com o que o livro tem (nada). `fora` são as
     * pessoas que ainda não reconectaram.
     */
    reiniciar({ fora = [], motivo = 'servidor-subiu' } = {}) {
      livro.clear();
      donas.clear();
      for (const p of fora) conectados.delete(String(p));
      momentoInterno('MetadeSubiu', { motivo, maquinas: [] });
      escoar();
    },
    /** O código da metade mudou com o servidor de pé: o livro fica, e é dito. */
    recarregar() {
      const maquinas = [...livro.values()].map(m => ({ servidor: m.servidor ?? null, papel: m.papel, pessoa: Number(m.quem), aceita: m.aceito }));
      momentoInterno('MetadeSubiu', { motivo: 'codigo-novo', maquinas });
      escoar();
    },
    /** Uma pessoa que estava fora reconecta. */
    conectar(pessoa) { conectados.add(String(pessoa)); },
    /** Quem operava caiu e voltou (MaquinaVoltou). */
    voltar(servidor, papel = 'principal', pessoa) {
      momentoInterno('MaquinaVoltou', { servidor, papel, pessoa: String(pessoa) });
      escoar();
    },
  };
}

module.exports = { criarAnfitriao, DECLARADAS, packLido };
