// SEELE MODS — o único módulo que toca o DOM.
//
// É o único de propósito: os outros cinco são funções puras testáveis com
// `node --test`, e um teste de DOM aqui exigiria a dependência de build que
// este desenho existe para não ter.
//
// Tudo é montado com `textContent` e `createElement`. Nenhum `innerHTML`
// com dado do catálogo: o catálogo é assinado, mas «assinado» não é
// «inofensivo», e o dia em que alguém servir um catálogo não assinado para
// depurar é o dia em que isso importaria.

"use strict";

import { ORDENS, versaoMaisRecente } from "./catalogo.js";
import { frase } from "./frases.js";

const NIVEIS_DA_LATERAL = ["oficial", "verificado", "com-notas"];

function elemento(etiqueta, classe, texto) {
  const no = document.createElement(etiqueta);
  if (classe) no.className = classe;
  if (texto !== undefined) no.textContent = texto;
  return no;
}

/**
 * Há quanto tempo, em texto curto.
 *
 * O `Math.max(0, …)` é cinto e suspensório, não a única defesa: hoje o
 * ramo `segundos < 3600` já devolve "agora" para qualquer valor negativo,
 * então o clamp não muda a saída de nenhum caso atual. Ele garante o
 * invariante localmente — sem depender da ordem dos ramos abaixo — para
 * que, se um dia alguém inserir um ramo antes deste, a proteção contra um
 * relógio local atrasado (que produziria `agora - publicado_em` negativo)
 * continue de pé, e não dependa de ninguém lembrar por quê.
 */
export function textoDaIdade(publicado_em, agora) {
  const segundos = Math.max(0, agora - publicado_em);
  if (segundos < 3600) return "agora";
  if (segundos < 86400) return `há ${Math.floor(segundos / 3600)} h`;
  const dias = Math.floor(segundos / 86400);
  if (dias < 365) return `há ${dias} d`;
  return `há ${Math.floor(dias / 365)} a`;
}

/**
 * A ficha técnica de uma versão.
 *
 * O hash e o commit saem **inteiros**: o primeiro é o número que uma pessoa
 * compara a olho com o que o app mostra, e o segundo abreviado colide.
 *
 * Não há estrelas nem downloads. Não os medimos — e o índice não coleta
 * nada, que é metade do argumento de ele ser arquivo parado.
 */
export function linhasDaFicha(mod, versao) {
  return [
    { rotulo: "VERSÃO", valor: versao.versao },
    { rotulo: "API", valor: String(versao.api) },
    { rotulo: "ARQUIVOS", valor: String(versao.arquivos.length) },
    { rotulo: "NÍVEL", valor: frase("niveis", mod.nivel) },
    { rotulo: "HASH DO CONTEÚDO", valor: versao.hash, mono: true },
    { rotulo: "COMMIT AVALIADO", valor: mod.commit, mono: true },
  ];
}

function selo(nivel) {
  const no = elemento("span", "selo", frase("rotulos", nivel).toUpperCase());
  no.dataset.nivel = nivel;
  return no;
}

function cartao(mod, agora, aoAbrir) {
  const raiz = elemento("article", "cartao");
  const botao = elemento("button", "cartao-abrir");
  botao.type = "button";
  botao.addEventListener("click", () => aoAbrir(mod.id));

  const topo = elemento("span", "cartao-topo");
  const nomes = elemento("span", "cartao-nomes");
  nomes.append(
    elemento("span", "cartao-titulo", mod.titulo),
    elemento("span", "cartao-repo", mod.id),
  );
  topo.append(nomes, selo(mod.temRevogada ? "revogada" : mod.nivel));

  const recente = versaoMaisRecente(mod);
  const numeros = elemento("span", "numeros");
  numeros.append(
    elemento("span", "numero", recente.versao),
    elemento("span", "numero-rotulo", "VERSÃO"),
    elemento("span", "espaco"),
    elemento("span", "numero", textoDaIdade(recente.publicado_em, agora)),
    elemento("span", "numero-rotulo", "PUBLICADA"),
  );

  botao.append(topo, elemento("span", "cartao-resumo", mod.resumo), numeros);
  raiz.append(botao);
  return raiz;
}

function telaCatalogo(estado, acoes) {
  const raiz = elemento("div", "com-lateral");

  const lateral = elemento("aside", "lateral");
  const grupoNivel = elemento("div", "grupo");
  grupoNivel.append(elemento("span", "rotulo", "NÍVEL"));
  for (const nivel of [null, ...NIVEIS_DA_LATERAL]) {
    const botao = elemento("button", "filtro", nivel ? frase("rotulos", nivel) : "Todos");
    botao.type = "button";
    botao.setAttribute("aria-pressed", String(estado.nivel === nivel));
    const conta = nivel
      ? estado.todos.filter((m) => m.nivel === nivel).length
      : estado.todos.length;
    botao.append(elemento("span", "conta", String(conta)));
    botao.addEventListener("click", () => acoes.filtrarNivel(nivel));
    grupoNivel.append(botao);
  }

  const grupoOrdem = elemento("div", "grupo");
  grupoOrdem.append(elemento("span", "rotulo", "ORDENAR"));
  for (const ordem of ORDENS) {
    const botao = elemento("button", "filtro", ordem.nome);
    botao.type = "button";
    botao.setAttribute("aria-pressed", String(estado.ordem === ordem.id));
    botao.addEventListener("click", () => acoes.ordenar(ordem.id));
    grupoOrdem.append(botao);
  }

  const explicacao = elemento(
    "p",
    "cartao-resumo",
    "O índice não tem cadastro e não coleta nada. Ele guarda o veredito da avaliação, o commit que foi avaliado, e o número que identifica os bytes.",
  );
  lateral.append(grupoNivel, grupoOrdem, explicacao);

  const painel = elemento("div", "painel");
  painel.append(elemento("h1", null, estado.nivel ? frase("niveis", estado.nivel) : "Mods da comunidade"));
  painel.append(
    elemento(
      "span",
      "resumo-da-lista",
      `${estado.lista.length} ${estado.lista.length === 1 ? "mod" : "mods"}`,
    ),
  );

  if (estado.lista.length === 0) {
    painel.append(elemento("p", "vazio", "NENHUM MOD BATE COM ESSA BUSCA"));
  } else {
    const grade = elemento("div", "grade");
    for (const mod of estado.lista) grade.append(cartao(mod, estado.agora, acoes.abrir));
    painel.append(grade);
  }

  raiz.append(lateral, painel);
  return raiz;
}

function telaMod(estado) {
  const mod = estado.lista.find((m) => m.id === estado.id) ?? estado.todos.find((m) => m.id === estado.id);
  const painel = elemento("div", "painel");
  if (!mod) {
    painel.append(elemento("p", "vazio", "ESSE MOD NÃO ESTÁ NO CATÁLOGO"));
    return painel;
  }

  const versao = versaoMaisRecente(mod);
  painel.append(elemento("h1", null, mod.titulo));
  painel.append(elemento("span", "resumo-da-lista", `${mod.id} · ${mod.repo}`));
  painel.append(elemento("p", "cartao-resumo", mod.resumo));

  // As notas vêm ANTES de tudo o que parece um botão de instalar: uma nota
  // que a pessoa lê depois de instalar não é uma nota.
  if (mod.notas.length > 0) {
    const bloco = elemento("section", "grupo");
    bloco.append(elemento("span", "rotulo", "O QUE A AVALIAÇÃO ACHOU DE INCOMUM"));
    for (const nota of mod.notas) bloco.append(elemento("p", "nota", frase("notas", nota)));
    painel.append(bloco);
  }

  const revogada = versao.revogada;
  if (revogada) {
    const bloco = elemento("section", "grupo");
    bloco.append(elemento("span", "rotulo", "ESTA VERSÃO FOI RETIRADA"));
    bloco.append(elemento("p", "cartao-resumo", frase("motivos", revogada.motivo)));
    if (revogada.corrigido_em) {
      bloco.append(elemento("p", "cartao-resumo", `Consertado na versão ${revogada.corrigido_em}.`));
    }
    painel.append(bloco);
  }

  const ficha = elemento("dl", "ficha");
  for (const linha of linhasDaFicha(mod, versao)) {
    const par = elemento("div", "ficha-linha");
    par.append(elemento("dt", null, linha.rotulo));
    par.append(elemento("dd", linha.mono ? "hash" : null, linha.valor));
    ficha.append(par);
  }
  painel.append(ficha);

  // O que o app de fato oferece: o id para digitar, e os caminhos imutáveis.
  // `seele://mod/<id>` não existe — aquele esquema é o convite de servidor.
  const comoInstalar = elemento("section", "grupo");
  comoInstalar.append(elemento("span", "rotulo", "COMO INSTALAR"));
  comoInstalar.append(
    elemento("p", "cartao-resumo", "No app, em Configurações · Mods, digite o identificador abaixo. O app baixa os arquivos, confere o hash e recusa se não bater."),
  );
  comoInstalar.append(elemento("code", "hash", mod.id));
  painel.append(comoInstalar);

  if (versao.alcanca.length > 0) {
    const alcance = elemento("section", "grupo");
    alcance.append(elemento("span", "rotulo", "O QUE ELE ALCANÇA"));
    for (const item of versao.alcanca) alcance.append(elemento("p", "nota", item));
    painel.append(alcance);
  }

  const arquivos = elemento("section", "grupo");
  arquivos.append(elemento("span", "rotulo", "OS ARQUIVOS DESTA VERSÃO"));
  const base = `mods/${mod.autor}/${mod.nome}/${versao.versao}/`;
  for (const caminho of versao.arquivos) {
    const link = elemento("a", null, caminho);
    link.href = base + caminho;
    arquivos.append(link);
  }
  painel.append(arquivos);

  const repo = elemento("a", "botao", "ABRIR O REPOSITÓRIO →");
  repo.href = mod.repo;
  repo.rel = "noopener noreferrer";
  painel.append(repo);
  return painel;
}

function telaRevogacoes(estado) {
  const painel = elemento("div", "painel");
  painel.append(elemento("h1", null, "Revogações"));
  painel.append(
    elemento("p", "cartao-resumo", "MODs retirados e versões do produto revogadas, na mesma lista — são a mesma peça. Uma revogação impede instalar e impede hospedar; ela não apaga o que já está numa máquina."),
  );

  const linhas = [
    ...(estado.revogacoes?.mods ?? []).map((r) => ({ o_que: `${r.id} ${r.versao}`, ...r })),
    ...(estado.revogacoes?.versoes_do_produto ?? []).map((r) => ({ o_que: `SEELE ${r.versao}`, ...r })),
  ].sort((a, b) => b.desde - a.desde);

  if (linhas.length === 0) {
    painel.append(elemento("p", "vazio", "NADA FOI RETIRADO ATÉ AGORA"));
    return painel;
  }

  const rolagem = elemento("div", "rolagem");
  const tabela = elemento("table", "tabela");
  const cabecalho = elemento("tr");
  for (const titulo of ["O QUE", "POR QUÊ", "DESDE", "CONSERTADO EM"]) {
    cabecalho.append(elemento("th", null, titulo));
  }
  const thead = elemento("thead");
  thead.append(cabecalho);
  tabela.append(thead);

  const corpo = elemento("tbody");
  for (const linha of linhas) {
    const tr = elemento("tr");
    tr.append(elemento("td", null, linha.o_que));
    tr.append(elemento("td", null, frase("motivos", linha.motivo)));
    tr.append(elemento("td", null, new Date(linha.desde * 1000).toISOString().slice(0, 10)));
    tr.append(elemento("td", null, linha.corrigido_em ?? "não há versão corrigida"));
    corpo.append(tr);
  }
  tabela.append(corpo);
  rolagem.append(tabela);
  painel.append(rolagem);
  return painel;
}

function telaPublicar() {
  const painel = elemento("div", "painel");
  painel.append(elemento("h1", null, "O índice guarda o veredito e o commit, não o seu código."));
  painel.append(
    elemento("p", "cartao-resumo", "Você publica no seu repositório. O índice registra qual commit foi avaliado e o que a avaliação achou, e serve os bytes que saem daquele commit."),
  );

  // Dito com a precisão do adendo: a troca de humano por máquina só é
  // legítima se o teto for dito. Uma tela que deixasse alguém achar que
  // «verificado» significa «seguro» estaria mentindo sobre o teto.
  const teto = elemento("section", "grupo");
  teto.append(elemento("span", "rotulo", "O QUE A AVALIAÇÃO É, E O QUE ELA NÃO É"));
  teto.append(
    elemento("p", "cartao-resumo", "É um filtro, e não uma prova. Ela pega o óbvio — eval de string remota, exfiltração escancarada, ofuscação. Ela não pega o caminho sutil na décima função de um arquivo limpo. «Verificado» quer dizer que passou no filtro, e não que é seguro."),
  );
  painel.append(teto);

  const passos = [
    ["01", "PUBLIQUE NO SEU REPOSITÓRIO", "Público, porque é o que torna a avaliação conferível por qualquer pessoa. Não exigimos licença nomeada — o SEELE ainda não tem uma, e cobrar uma promessa que não fizemos seria desonesto."],
    ["02", "MANDE A URL", "O botão abaixo abre uma issue já preenchida. Não há formulário que escreva neste site: ele é hospedagem estática, e continuar assim é o que impede uma rota de busca de existir um dia."],
    ["03", "A AVALIAÇÃO FIXA UM COMMIT", "Verificado, publicado com notas, ou negado. Um push depois da aprovação não muda o que ninguém baixa — ele exige solicitação nova."],
  ];
  for (const [n, titulo, texto] of passos) {
    const passo = elemento("li", "passo");
    passo.append(elemento("span", "passo-n", n));
    const corpo = elemento("span", "grupo");
    corpo.append(elemento("span", "cartao-titulo", titulo), elemento("span", "cartao-resumo", texto));
    passo.append(corpo);
    painel.append(passo);
  }

  const abrir = elemento("a", "botao botao-forte", "ABRIR A SOLICITAÇÃO NO GITHUB →");
  abrir.href =
    "https://github.com/seele/SEELE-MODS-INDEXER/issues/new?labels=inclus%C3%A3o&title=" +
    encodeURIComponent("inclusão: <autor>/<nome>") +
    "&body=" +
    encodeURIComponent(
      "URL do repositório:\nCommit a avaliar:\nO que o mod faz:\nO que ele alcança (o `reach` do mod.json):\n",
    );
  abrir.rel = "noopener noreferrer";
  painel.append(abrir);
  return painel;
}

const TELAS = {
  catalogo: telaCatalogo,
  mod: telaMod,
  revogacoes: telaRevogacoes,
  publicar: telaPublicar,
};

/** Redesenha o corpo inteiro. */
export function desenhar(raiz, estado, acoes) {
  raiz.replaceChildren((TELAS[estado.tela] ?? telaCatalogo)(estado, acoes));

  for (const aba of document.querySelectorAll(".aba")) {
    const alvo = aba.dataset.ir;
    const ativa = alvo === estado.tela || (alvo === "catalogo" && estado.tela === "mod");
    if (ativa) aba.setAttribute("aria-current", "page");
    else aba.removeAttribute("aria-current");
  }
}

/** O aviso de integridade — a palavra é «íntegro», nunca «autêntico». */
export function desenharAviso(no, integridade) {
  no.dataset.estado = integridade.estado;
  no.replaceChildren();
  if (integridade.estado === "integro") {
    no.append(elemento("p", null, "Catálogo íntegro: os bytes que chegaram são os que foram assinados."));
  } else {
    no.append(elemento("p", null, frase("falhas", integridade.causa)));
  }
  no.append(
    elemento(
      "p",
      "aviso-nota",
      "Esta conferência acontece na mesma origem que serve o catálogo, então ela pega corrupção e cache velho — não adulteração. A conferência que decide acontece dentro do app, com a chave que veio compilada nele.",
    ),
  );
}
