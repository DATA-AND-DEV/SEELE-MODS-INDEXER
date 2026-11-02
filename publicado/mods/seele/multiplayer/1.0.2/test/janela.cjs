// A janela da API 8, simulada a partir do contrato (test/contrato/api-v8.json):
// só as formas, os tipos de superfície, os pontos e os eventos que ele tem, o
// teto de 12 KiB por mensagem, e o `SeeleUI.tunel.entrar` com o bilhete de
// gesto do prelúdio (crates/seele-motor/src/preludio.rs): ele só vale dentro
// da volta síncrona de um evento `botao`, e some no primeiro `await`.
//
// Por baixo, a metade de servidor de verdade, pelo anfitrião simulado.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { montar } = require('../ferramentas/montar.cjs');

const contrato = JSON.parse(fs.readFileSync(path.join(__dirname, 'contrato', 'api-v8.json'), 'utf8'));
const FORMAS = new Set(contrato.formas);
const TIPOS = new Set(contrato.superficies.tipos);
const PONTOS = contrato.contribuicoes.pontos;
const TETO_DA_MENSAGEM = 12 * 1024;
const EU = 'seele/multiplayer';

const assentar = async () => { for (let i = 0; i < 30; i++) await new Promise(r => setImmediate(r)); };

/** Confere uma árvore contra o contrato e devolve quantos nós ela tem. */
function conferirArvore(no, caminho = 'raiz', fundura = 1) {
  if (typeof no === 'string') return 1;
  assert.ok(no && typeof no === 'object', `${caminho}: nó que não é objeto`);
  assert.ok(FORMAS.has(no.forma), `${caminho}: forma «${no.forma}» fora do contrato`);
  assert.ok(fundura <= 16, `${caminho}: passa da fundura de 16`);
  let n = 1;
  const filhos = Array.isArray(no.dentro) ? no.dentro : (no.dentro !== undefined && typeof no.dentro !== 'string' ? [no.dentro] : []);
  filhos.forEach((f, i) => { n += conferirArvore(f, `${caminho}.${no.forma}[${i}]`, fundura + 1); });
  return n;
}

/** Todos os nós de uma árvore, em ordem. */
function nos(arvore) {
  const lista = [];
  const andar = no => {
    if (!no || typeof no !== 'object') return;
    lista.push(no);
    const filhos = Array.isArray(no.dentro) ? no.dentro : (no.dentro && typeof no.dentro === 'object' ? [no.dentro] : []);
    filhos.forEach(andar);
  };
  (Array.isArray(arvore) ? arvore : [arvore]).forEach(andar);
  return lista;
}

/** O texto que a pessoa lê, juntado. */
function textoDe(arvore) {
  const partes = [];
  const andar = no => {
    if (typeof no === 'string') { partes.push(no); return; }
    if (!no || typeof no !== 'object') return;
    if (no.rotulo) partes.push(no.rotulo);
    if (no.forma === 'campo' || no.forma === 'numero') partes.push(String(no.valor ?? ''));
    if (no.forma === 'escolha') {
      const o = (no.opcoes ?? []).find(x => x.valor === no.valor);
      if (o) partes.push(typeof o.dentro === 'string' ? o.dentro : '');
    }
    const filhos = Array.isArray(no.dentro) ? no.dentro : (no.dentro !== undefined ? [no.dentro] : []);
    filhos.forEach(andar);
  };
  (Array.isArray(arvore) ? arvore : [arvore]).forEach(andar);
  return partes.join(' ');
}

/**
 * @param anfitriao o da metade de servidor (test/anfitriao.cjs)
 * @param opcoes { pessoa, pessoas, portaLocal, portaOcupada }
 */
function criarJanela(anfitriao, opcoes = {}) {
  const pessoa = String(opcoes.pessoa ?? 1);
  const pessoas = opcoes.pessoas ?? [
    { id: 1, apelido: 'Alexandre', falando: false, mudo: false },
    { id: 2, apelido: 'Fulano', falando: false, mudo: false },
    { id: 3, apelido: 'Bia', falando: false, mudo: false },
  ];
  const j = {
    superficies: new Map(), contribuicoes: [], avisos: [], erros: [], pedidos: [], acoes: [], entradas: [],
    mensagensGrandes: [], ouvinte: null, salvos: [], escolhidos: new Map(),
  };
  let gesto = null;
  let handles = 0;

  const medir = (tipo, carga) => {
    const tamanho = Buffer.byteLength(JSON.stringify({ tipo, ...carga }));
    if (tamanho > TETO_DA_MENSAGEM) {
      j.mensagensGrandes.push({ tipo, tamanho });
      throw Object.assign(new Error('mensagem-grande'), { erro: 'mensagem-grande', tipoPedido: tipo, tamanho, teto: TETO_DA_MENSAGEM });
    }
  };
  const recusa = (nome, extra = {}) => Object.assign(new Error(nome), { erro: nome, ...extra });

  function punho(id) {
    const s = j.superficies.get(id);
    return {
      montar: async arvore => {
        medir('superficie-montar', { superficie: id, arvore });
        const lista = Array.isArray(arvore) ? arvore : [arvore];
        let total = 0;
        lista.forEach((no, i) => { total += conferirArvore(no, `${id}[${i}]`); });
        assert.ok(total <= 4096, `${id}: ${total} nós`);
        s.arvore = JSON.parse(JSON.stringify(lista));
        s.montagens++;
        return true;
      },
      atualizar: async (chave, arvore) => {
        medir('superficie-atualizar', { superficie: id, chave, arvore });
        const alvo = nos(s.arvore).find(n => n.chave === chave);
        if (!alvo) throw recusa('chave-desconhecida', { chave });
        conferirArvore(arvore);
        Object.keys(alvo).forEach(k => delete alvo[k]);
        Object.assign(alvo, JSON.parse(JSON.stringify(arvore)));
        return true;
      },
      titulo: async texto => { s.titulo = texto; },
      mostrar: async () => { s.visivel = true; },
      ocultar: async () => { s.visivel = false; },
      fechar: async () => { s.visivel = false; },
      descartar: async () => { j.superficies.delete(id); },
      classes: async () => true,
      suja: async valor => { s.suja = valor !== false; s.sujas = (s.sujas ?? 0) + 1; return true; },
      formulario: { erros: async () => true },
    };
  }

  const SeeleUI = {
    retrato: async () => ({ eu: Number(pessoa), servidor: { nome: 'Casa' }, pessoas, salas: [], canais: [], onde: 'computador', regioes: ['servidor.navegacao', 'pagina'] }),
    capacidades: async () => [...contrato.compatibilidade['capacidades-por-versao']['8'], ...contrato.compatibilidade['capacidades-por-poder'].porta],
    superficies: {
      criar: async descricao => {
        medir('superficie-criar', { descricao });
        if (opcoes.criarFalha) throw recusa(opcoes.criarFalha, { superficie: descricao.id });
        const tipo = descricao.tipo ?? 'dialogo';
        if (!TIPOS.has(tipo)) throw recusa('tipo-desconhecido', { tipoPedido: tipo });
        if (!j.superficies.has(descricao.id)) j.superficies.set(descricao.id, { descricao, arvore: [], titulo: descricao.titulo, visivel: descricao.visivel !== false, montagens: 0 });
        else j.superficies.get(descricao.id).visivel = true;
        return punho(descricao.id);
      },
      avisar: async (texto, tom = 'normal') => { j.avisos.push({ texto: String(texto), tom }); },
    },
    contribuicoes: {
      registrar: async pedido => {
        medir('contribuir', { pedido });
        assert.ok(PONTOS[pedido.ponto], `ponto «${pedido.ponto}» fora do contrato`);
        assert.ok(PONTOS[pedido.ponto].includes(pedido.modo), `modo «${pedido.modo}» fora do contrato`);
        j.contribuicoes.push(pedido);
        return { handle: 'c' + (++handles) };
      },
      atualizar: async () => true,
      revogar: async () => true,
    },
    aoEvento: fn => { j.ouvinte = fn; },
    tunel: {
      // O prelúdio lê o bilhete na hora da chamada: depois de um `await`, ele já não existe.
      entrar: nome => {
        const bilhete = gesto;
        return (async () => {
          j.entradas.push({ nome, bilhete });
          if (!bilhete) throw recusa('fora-de-um-clique');
          const pode = anfitriao.pedir(pessoa, { op: 'estado' }).podem.includes('entrar-no-jogo');
          if (!pode) throw recusa('sem-permissao');
          if (opcoes.portaOcupada) throw recusa('porta-local-ocupada');
          return opcoes.portaLocal ?? 25565;
        })();
      },
    },
  };
  // `SeeleUI.salvar` (API 8 parte 6): como o túnel, o bilhete é lido na hora
  // da chamada; o diálogo de salvar responde o que o teste combinou.
  SeeleUI.salvar = pedido => {
    const bilhete = gesto;
    return (async () => {
      j.salvos.push({ pedido: JSON.parse(JSON.stringify(pedido)), bilhete });
      if (!bilhete) throw recusa('fora-de-um-clique');
      if (opcoes.cancelarOSalvar) return null;
      const bytes = anfitriao.lerDoVolume(pessoa, pedido.pedido);
      return { bytes: bytes.length };
    })();
  };
  // O envio (`SeeleUI.enviar`): os bytes do arquivo escolhido vão ao volume
  // pelo produto, que confere o tipo e o teto da espera.
  SeeleUI.enviar = async (arquivo, token) => {
    const bytes = j.escolhidos.get(arquivo);
    if (!bytes) throw recusa('arquivo-nao-esta-de-pe');
    try {
      anfitriao.enviarAoVolume(token, bytes);
    } catch (e) {
      throw recusa(e.erro, { ...(e.tamanho ? { tamanho: e.tamanho, teto: e.teto } : {}) });
    }
  };
  SeeleUI.soltar = async arquivo => { j.escolhidos.delete(arquivo); };
  const SeeleMods = {
    request: async (id, canal, valor) => {
      assert.equal(id, EU, 'o request foi com o id de outro MOD');
      assert.equal(canal, 0, 'o multiplayer não é de canal: canal 0');
      medir('pedido', { id, canal, valor });
      j.pedidos.push(JSON.parse(JSON.stringify(valor)));
      if (opcoes.ponteCaida) throw recusa('sessao-encerrada');
      return anfitriao.pedir(pessoa, valor);
    },
    acao: async (id, canal, acao, valor) => {
      assert.equal(id, EU);
      medir('acao', { id, canal, acao, valor });
      j.acoes.push({ acao, valor: JSON.parse(JSON.stringify(valor)) });
      return anfitriao.acao(pessoa, acao, valor);
    },
  };
  const console_ = {
    log: () => {},
    info: () => {},
    warn: (...a) => j.erros.push('warn: ' + a.join(' ')),
    error: (...a) => j.erros.push('error: ' + a.join(' ')),
  };
  const contexto = vm.createContext({ SeeleUI, SeeleMods, console: console_, setTimeout, clearTimeout });
  vm.runInContext(opcoes.codigo ?? montar('cliente'), contexto, { filename: 'cliente/main.js' });

  /** Entrega um evento como o prelúdio: o bilhete só vale na volta síncrona de um botão. */
  j.emitir = evento => {
    gesto = evento.nome === 'botao' ? 'bilhete-' + Math.random() : null;
    try {
      j.ouvinte?.(JSON.parse(JSON.stringify(evento)));
    } finally {
      gesto = null;
    }
  };
  j.apertar = async chave => {
    const no = j.no(chave);
    assert.ok(no, `não há botão «${chave}» à vista`);
    assert.ok(!no.desligado, `o botão «${chave}» está desligado`);
    j.emitir({ nome: 'botao', chave });
    await assentar();
  };
  j.mudar = async (nome, chave, valor) => {
    assert.ok(j.no(chave), `não há «${chave}» à vista`);
    j.emitir({ nome, chave, valor });
    await assentar();
  };
  /**
   * A pessoa escolhe um arquivo no seletor do produto: o evento `arquivo` com o
   * que os bytes provaram ser, ou a recusa do produto (o teto, o formato).
   */
  j.escolher = async (chave, bytes, recusaDoProduto = null) => {
    const no = j.no(chave);
    assert.ok(no && no.forma === 'arquivo', `não há arquivo «${chave}» à vista`);
    if (recusaDoProduto) {
      j.emitir({ nome: 'arquivo', chave, arquivo: null, resultado: 'falhou', ...recusaDoProduto });
    } else {
      const id = j.escolhidos.size + 1;
      j.escolhidos.set(id, bytes);
      j.emitir({ nome: 'arquivo', chave, arquivo: { id, tipo: 'application/x-modrinth-modpack+zip', papel: 'pack', bytes: bytes.length }, resultado: 'escolhido' });
    }
    for (let i = 0; i < 10; i++) await assentar();
  };
  j.pagina = () => j.superficies.get('multiplayer');
  j.no = chave => nos(j.pagina()?.arvore ?? []).find(n => n.chave === chave) ?? null;
  j.texto = (chave = null) => textoDe(chave ? j.no(chave) : (j.pagina()?.arvore ?? []));
  j.abrir = async () => {
    j.emitir({ nome: 'acao', acao: 'abrir-multiplayer', pessoa: '', canal: '' });
    await assentar();
  };
  /** O aviso da metade de servidor que o produto entrega a esta janela. */
  j.avisoDoServidor = async carga => {
    j.emitir({ nome: 'servidor', canal: null, carga });
    await assentar();
  };
  return j;
}

module.exports = { criarJanela, assentar, nos, textoDe };
