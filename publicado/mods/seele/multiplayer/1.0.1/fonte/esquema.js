// ---- esquema.js: o validador de receitas ----
//
// Duas passadas. A primeira lê `receitas/esquema.json` — um pedaço do JSON
// Schema 2020-12, o que o esquema usa e nada mais — e confere a forma. A
// segunda confere o que um esquema não diz: o modelo de uma propriedade que
// cita um campo que não existe, o padrão fora das opções, a expressão que não
// compila, o salvamento que não copia o mundo. A segunda só roda se a primeira
// passou: ela lê a receita supondo a forma certa.
//
// **Toda chave desconhecida é recusada pelo nome**, com o caminho até ela. Uma
// receita chega por pull request; a recusa é a única resposta que o autor tem.

/** O que este validador sabe ler de um esquema. Uma palavra fora daqui é defeito do esquema, e lança. */
const PALAVRAS_DO_ESQUEMA = new Set([
  '$schema', '$id', '$defs', '$ref', 'title', 'description', 'type', 'properties', 'required',
  'additionalProperties', 'items', 'enum', 'const', 'pattern', 'minLength', 'maxLength',
  'minimum', 'maximum', 'minItems', 'maxItems', 'uniqueItems',
]);

const TAMANHO_DO_HASH = { sha1: 40, sha256: 64, sha512: 128 };

function tipoDe(valor) {
  if (valor === null) return 'null';
  if (Array.isArray(valor)) return 'array';
  if (Number.isInteger(valor)) return 'integer';
  return typeof valor;
}

function serveAoTipo(valor, tipo) {
  const t = tipoDe(valor);
  return t === tipo || (tipo === 'number' && t === 'integer');
}

function mostrar(valor) {
  return typeof valor === 'string' ? '«' + valor + '»' : JSON.stringify(valor);
}

/** A primeira passada: o valor contra um pedaço do esquema. */
function conferirForma(valor, esquema, raiz, caminho, erros) {
  for (const palavra of Object.keys(esquema)) {
    if (!PALAVRAS_DO_ESQUEMA.has(palavra)) throw new Error('o esquema usa «' + palavra + '», que o validador não lê');
  }
  if (esquema.$ref) {
    const nome = esquema.$ref.replace(/^#\/\$defs\//, '');
    const alvo = raiz.$defs?.[nome];
    if (!alvo) throw new Error('o esquema cita ' + esquema.$ref + ', que não existe');
    return conferirForma(valor, alvo, raiz, caminho, erros);
  }
  if ('const' in esquema && valor !== esquema.const) {
    erros.push(`${caminho}: devia ser ${mostrar(esquema.const)}`);
    return;
  }
  if (esquema.enum && !esquema.enum.includes(valor)) {
    erros.push(`${caminho}: ${mostrar(valor)} não é um dos valores aceitos (${esquema.enum.join(', ')})`);
    return;
  }
  if (esquema.type) {
    const tipos = Array.isArray(esquema.type) ? esquema.type : [esquema.type];
    if (!tipos.some(t => serveAoTipo(valor, t))) {
      erros.push(`${caminho}: devia ser ${tipos.join(' ou ')}`);
      return;
    }
  }
  const t = tipoDe(valor);
  if (t === 'string') {
    if (esquema.minLength !== undefined && valor.length < esquema.minLength) erros.push(`${caminho}: ${mostrar(valor)} é curto demais`);
    if (esquema.maxLength !== undefined && valor.length > esquema.maxLength) erros.push(`${caminho}: passa de ${esquema.maxLength} caracteres`);
    if (esquema.pattern && !new RegExp(esquema.pattern).test(valor)) erros.push(`${caminho}: ${mostrar(valor)} não tem a forma pedida`);
  }
  if (t === 'integer' || t === 'number') {
    if (esquema.minimum !== undefined && valor < esquema.minimum) erros.push(`${caminho}: ${valor} é menor que ${esquema.minimum}`);
    if (esquema.maximum !== undefined && valor > esquema.maximum) erros.push(`${caminho}: ${valor} é maior que ${esquema.maximum}`);
  }
  if (t === 'array') {
    if (esquema.minItems !== undefined && valor.length < esquema.minItems) erros.push(`${caminho}: precisa de ao menos ${esquema.minItems}`);
    if (esquema.maxItems !== undefined && valor.length > esquema.maxItems) erros.push(`${caminho}: passa de ${esquema.maxItems} itens`);
    if (esquema.uniqueItems) {
      const vistos = new Set();
      valor.forEach((item, i) => {
        const chave = JSON.stringify(item);
        if (vistos.has(chave)) erros.push(`${caminho}[${i}]: ${mostrar(item)} repetido`);
        vistos.add(chave);
      });
    }
    if (esquema.items) valor.forEach((item, i) => conferirForma(item, esquema.items, raiz, `${caminho}[${i}]`, erros));
  }
  if (t === 'object') {
    const props = esquema.properties ?? {};
    for (const chave of Object.keys(valor)) {
      if (chave in props) continue;
      if (esquema.additionalProperties === false) erros.push(`${caminho}: chave desconhecida «${chave}»`);
    }
    for (const chave of esquema.required ?? []) {
      if (!(chave in valor)) erros.push(`${caminho}: falta a chave «${chave}»`);
    }
    for (const [chave, sub] of Object.entries(props)) {
      if (chave in valor) conferirForma(valor[chave], sub, raiz, `${caminho}.${chave}`, erros);
    }
    if (esquema.additionalProperties && typeof esquema.additionalProperties === 'object') {
      for (const chave of Object.keys(valor)) {
        if (!(chave in props)) conferirForma(valor[chave], esquema.additionalProperties, raiz, `${caminho}.${chave}`, erros);
      }
    }
  }
}

/** Quantos grupos de captura uma expressão tem, ou `null` se ela não compila. */
function gruposDe(fonte) {
  try {
    return new RegExp(fonte + '|').exec('').length - 1;
  } catch {
    return null;
  }
}

/** As variáveis `{x}` de um modelo. */
const variaveisDe = modelo => [...String(modelo).matchAll(/\{([A-Za-z0-9]+)\}/g)].map(m => m[1]);

/** A segunda passada: o que o esquema não diz. */
function conferirSentido(r, erros) {
  const c = 'receita';

  // ---- versões ----
  if (r.versoes.fonte === 'mojang' && !(r.versoes.manifesto && r.versoes.tipos && r.versoes.quantas)) {
    erros.push(`${c}.versoes: a fonte mojang precisa de «manifesto», «tipos» e «quantas»`);
  }
  if (r.versoes.fonte === 'fixo' && !r.versoes.lista) erros.push(`${c}.versoes: a fonte fixo precisa de «lista»`);

  // ---- artefatos ----
  r.artefatos.forEach((a, i) => {
    const ca = `${c}.artefatos[${i}]`;
    if (a.fonte === 'adoptium') {
      if (!(a.consulta && a.majorPadrao && a.plataformas)) {
        erros.push(`${ca}: a fonte adoptium precisa de «consulta», «majorPadrao» e «plataformas»`);
        return;
      }
      if (!a.consulta.includes('{major}')) erros.push(`${ca}.consulta: falta {major}`);
      const nomes = a.plataformas.map(p => p.plataforma);
      a.plataformas.forEach((p, j) => {
        if (p.senaoHouver && !nomes.includes(p.senaoHouver)) {
          erros.push(`${ca}.plataformas[${j}].senaoHouver: «${p.senaoHouver}» não é uma das plataformas da receita`);
        }
      });
    }
    if (a.fonte === 'fixo') {
      if (!a.porVersao) {
        erros.push(`${ca}: a fonte fixo precisa de «porVersao»`);
        return;
      }
      for (const [versao, b] of Object.entries(a.porVersao)) {
        const cb = `${ca}.porVersao.${versao}`;
        const host = hostDaUrl(b.url);
        if (!host || !hostNasOrigens(host, r.origens)) erros.push(`${cb}.url: ${host} não está nas origens`);
        const esperado = TAMANHO_DO_HASH[b.hash.algoritmo];
        if (b.hash.hex.length !== esperado) erros.push(`${cb}.hash: ${b.hash.algoritmo} tem ${esperado} caracteres, este tem ${b.hash.hex.length}`);
      }
      if (r.versoes.fonte === 'fixo' && r.versoes.lista) {
        for (const v of r.versoes.lista) {
          if (!a.porVersao[v.id]) erros.push(`${ca}: a versão «${v.id}» não tem artefato fixo`);
        }
      }
    }
  });
  // ---- com mods (parte 6) ----
  const comMods = r.variantes['com-mods'];
  if (comMods && comMods.disponivel !== false && !r.modpack) erros.push(`${c}.variantes.com-mods: sem «modpack», a variante com mods não tem como rodar`);
  for (const [id, l] of Object.entries(r.modpack?.loaders ?? {})) {
    const cl = `${c}.modpack.loaders.${id}`;
    const inst = l.instalador;
    if (inst.fonte === 'fixo') {
      if (!(inst.hash && inst.tamanho)) erros.push(`${cl}.instalador: a fonte fixo precisa de «hash» e «tamanho»`);
      else if (inst.hash.hex.length !== TAMANHO_DO_HASH[inst.hash.algoritmo]) erros.push(`${cl}.instalador.hash: ${inst.hash.algoritmo} tem ${TAMANHO_DO_HASH[inst.hash.algoritmo]} caracteres`);
    } else if (!(inst.detalhes && inst.algoritmo)) {
      erros.push(`${cl}.instalador: a fonte reposilite precisa de «detalhes» e «algoritmo»`);
    }
    const host = hostDaUrl(inst.url);
    if (!host || !hostNasOrigens(host, [...r.origens, ...l.dominiosDoJogo])) erros.push(`${cl}.instalador.url: ${host} não está nas origens nem nos domínios do loader`);
    if (!l.instalar.some(a => a.includes(inst.destino))) erros.push(`${cl}.instalar: os argumentos não citam o instalador «${inst.destino}»`);
    const dosSistemas = (l.porSistema ?? []).flatMap(e => [...e.rodar, ...(e.instalar ?? [])]);
    for (const v of [...l.instalar, ...l.rodar, ...dosSistemas, inst.url, inst.detalhes ?? ''].flatMap(variaveisDe)) {
      if (v !== 'mc' && v !== 'loader') erros.push(`${cl}: {${v}} não é {mc} nem {loader}`);
    }
    // **Um sistema numa entrada só** (a regra da oferta, `por_sistema`): a
    // máquina dele teria dois pares, e o produto recusa a oferta inteira.
    const vistos = new Set();
    (l.porSistema ?? []).forEach((e, k) => {
      for (const p of e.plataformas) {
        if (vistos.has(p)) erros.push(`${cl}.porSistema[${k}].plataformas: «${p}» já tem comandos noutra entrada`);
        vistos.add(p);
        if (l.sistemas && !l.sistemas.includes(p)) erros.push(`${cl}.porSistema[${k}].plataformas: «${p}» não está em «sistemas»`);
      }
      if (e.instalar && !e.instalar.some(a => a.includes(inst.destino))) erros.push(`${cl}.porSistema[${k}].instalar: os argumentos não citam o instalador «${inst.destino}»`);
    });
  }

  const ids = new Set();
  r.artefatos.forEach((a, i) => {
    if (ids.has(a.id)) erros.push(`${c}.artefatos[${i}].id: «${a.id}» repetido`);
    ids.add(a.id);
  });

  // ---- configuração ----
  const chaves = new Set();
  r.configuracao.campos.forEach((campo, i) => {
    const cc = `${c}.configuracao.campos[${i}]`;
    if (chaves.has(campo.chave)) erros.push(`${cc}.chave: «${campo.chave}» repetida`);
    chaves.add(campo.chave);
    if (campo.chave === 'porta') erros.push(`${cc}.chave: «porta» é da receita, e não de um campo`);
    const p = campo.padrao;
    if (campo.maximoSegmentos !== undefined && campo.forma !== 'segmentos') erros.push(`${cc}: só uma lista de palavras tem «maximoSegmentos»`);
    if (campo.forma !== 'segmentos') {
      (campo.opcoes ?? []).forEach((o, k) => {
        if (o.codigo !== undefined) erros.push(`${cc}.opcoes[${k}]: só a lista de palavras usa «codigo»`);
      });
    }
    if (campo.forma === 'segmentos') {
      if (!campo.opcoes) {
        erros.push(`${cc}: uma lista de palavras precisa de «opcoes»`);
        return;
      }
      if (campo.maximoSegmentos === undefined) {
        erros.push(`${cc}: uma lista de palavras precisa de «maximoSegmentos»`);
        return;
      }
      const codigos = new Set();
      campo.opcoes.forEach((o, k) => {
        if (o.codigo === undefined) erros.push(`${cc}.opcoes[${k}]: falta o «codigo» do § desta cor`);
        else if (codigos.has(o.codigo)) erros.push(`${cc}.opcoes[${k}]: o código «${o.codigo}» repete o de outra cor`);
        else codigos.add(o.codigo);
      });
      if (campo.opcoes.some(o => o.codigo === undefined)) return;
      const c = conferirSegmentos(campo, p);
      if (c.erro) erros.push(`${cc}.padrao: ${c.erro.charAt(0).toLowerCase()}${c.erro.slice(1).replace(/\.$/, '')}`);
    } else if (campo.forma === 'escolha') {
      if (!campo.opcoes) {
        erros.push(`${cc}: uma escolha precisa de «opcoes»`);
        return;
      }
      if (!campo.opcoes.some(o => o.valor === p)) erros.push(`${cc}.padrao: ${mostrar(p)} não é uma das opções`);
    } else if (campo.forma === 'numero') {
      if (campo.minimo === undefined || campo.maximo === undefined) {
        erros.push(`${cc}: um número precisa de «minimo» e «maximo»`);
        return;
      }
      if (!Number.isInteger(p)) erros.push(`${cc}.padrao: um número tem padrão inteiro`);
      else if (p < campo.minimo || p > campo.maximo) erros.push(`${cc}.padrao: ${p} fora de ${campo.minimo} a ${campo.maximo}`);
    } else if (campo.forma === 'interruptor') {
      if (typeof p !== 'boolean') erros.push(`${cc}.padrao: um interruptor tem padrão true ou false`);
    } else if (campo.forma === 'campo') {
      if (typeof p !== 'string') erros.push(`${cc}.padrao: um campo tem padrão em texto`);
      else if (campo.tamanhoMaximo && p.length > campo.tamanhoMaximo) erros.push(`${cc}.padrao: passa de ${campo.tamanhoMaximo} caracteres`);
    }
    if (campo.opcoes && campo.forma !== 'escolha' && campo.forma !== 'segmentos') erros.push(`${cc}: só uma escolha tem «opcoes»`);
  });
  for (const [prop, modelo] of Object.entries(r.configuracao.propriedades)) {
    for (const v of variaveisDe(modelo)) {
      if (v !== 'porta' && !chaves.has(v)) erros.push(`${c}.configuracao.propriedades.${prop}: «{${v}}» não é campo da receita nem {porta}`);
    }
  }

  // ---- mundo e saída ----
  const conferirPasso = (passo, cp) => {
    if (passo.console && passo.copiar) erros.push(`${cp}: um passo é «console» ou «copiar», não os dois`);
    else if (!passo.console && !passo.copiar) erros.push(`${cp}: um passo é «console» ou «copiar»`);
    if ((passo.esperar || passo.prazo) && !passo.console) erros.push(`${cp}: só um passo de console espera`);
    if (passo.esperar && gruposDe(passo.esperar) === null) erros.push(`${cp}.esperar: não é uma expressão regular válida`);
  };
  r.mundo.salvar.forEach((passo, i) => conferirPasso(passo, `${c}.mundo.salvar[${i}]`));
  if (!r.mundo.salvar.some(p => p.copiar)) erros.push(`${c}.mundo.salvar: nenhum passo copia o mundo`);
  conferirPasso(r.saida.parar, `${c}.saida.parar`);
  if (r.saida.parar.copiar) erros.push(`${c}.saida.parar: parar é um passo de console`);
  for (const nome of ['pronto', 'entrou', 'saiu']) {
    const grupos = gruposDe(r.saida[nome]);
    if (grupos === null) erros.push(`${c}.saida.${nome}: não é uma expressão regular válida`);
    else if (nome !== 'pronto' && grupos !== 1) erros.push(`${c}.saida.${nome}: precisa de exatamente um grupo de captura (o nome de quem joga)`);
  }

  // ---- termos ----
  r.termos.forEach((t, i) => {
    if (Boolean(t.arquivo) !== Boolean(t.conteudo)) erros.push(`${c}.termos[${i}]: «arquivo» e «conteudo» vão juntos`);
  });
}

/**
 * Confere uma receita. Nunca lança por causa dela: devolve `{ ok, erros }`,
 * cada erro uma frase com o caminho.
 */
function validarReceita(receita, esquema = ESQUEMA_DA_RECEITA) {
  const erros = [];
  conferirForma(receita, esquema, esquema, 'receita', erros);
  if (erros.length === 0) {
    try {
      conferirSentido(receita, erros);
    } catch (erro) {
      erros.push('receita: o validador não conseguiu ler a receita: ' + fraseDoErro(erro));
    }
  }
  return { ok: erros.length === 0, erros };
}
