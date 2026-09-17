// SEELE MODS — o único módulo que toca o DOM.
//
// É o único de propósito: os outros são funções puras testáveis com
// `node --test`, e um teste de DOM aqui exigiria a dependência de build que
// este desenho existe para não ter. É também por isso que as decisões saem
// daqui em vez de morarem entre dois `createElement` — «esta lista pode
// dizer que nada foi retirado?» é do `revogacoes.js`, e é lá que ela tem
// teste.
//
// Tudo é montado com `textContent` e `createElement`. Nenhum `innerHTML`
// com dado do catálogo: o catálogo é assinado, mas «assinado» não é
// «inofensivo», e o dia em que alguém servir um catálogo não assinado para
// depurar é o dia em que isso importaria.

"use strict";

import {
  ORDENS,
  acaoDeInstalar,
  avaliacaoDaVersao,
  versaoEscolhida,
} from "./catalogo.js";
import { frase } from "./frases.js";
import { foiConferida, paraTela } from "./revogacoes.js";

const NIVEIS_DA_LATERAL = ["oficial", "verificado", "com-notas"];

/**
 * A versão que a pessoa escolheu NESTE MOD, ou `null`.
 *
 * As escolhas ficam por id porque a lista mostra vários MODs ao mesmo tempo:
 * uma escolha só, guardada solta, ou vazaria de um MOD para o outro — a 1.0.0
 * que alguém escolheu aqui carimbando a 1.0.0 de lá, que é outra avaliação —
 * ou teria de ser apagada ao sair da ficha, e então o cartão nunca teria o que
 * mostrar além da mais recente.
 */
function escolhaDe(estado, id) {
  return estado.escolhas?.get(id) ?? null;
}

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
 * Nível e commit saem de `avaliacaoDaVersao` e não do MOD: esta ficha fala de
 * UMA versão, e todas as linhas dela têm de falar da mesma. Com o nível do MOD
 * aqui, escolher a versão antiga trocava o hash e os arquivos e deixava o
 * veredito da versão nova no lugar — a ficha afirmando sobre estes bytes uma
 * revisão que foi feita em outros.
 *
 * Não há estrelas nem downloads. Não os medimos — e o índice não coleta
 * nada, que é metade do argumento de ele ser arquivo parado.
 */
export function linhasDaFicha(mod, versao) {
  const avaliacao = avaliacaoDaVersao(mod, versao);
  return [
    { rotulo: "VERSÃO", valor: versao.versao },
    { rotulo: "API", valor: String(versao.api) },
    { rotulo: "ARQUIVOS", valor: String(versao.arquivos.length) },
    { rotulo: "NÍVEL", valor: frase("niveis", avaliacao.nivel) },
    { rotulo: "HASH DO CONTEÚDO", valor: versao.hash, mono: true },
    { rotulo: "COMMIT AVALIADO", valor: avaliacao.commit, mono: true },
  ];
}

function selo(nivel) {
  const no = elemento("span", "selo", frase("rotulos", nivel).toUpperCase());
  no.dataset.nivel = nivel;
  return no;
}

/**
 * O que o cartão da lista diz: número, idade e selo — todos da MESMA versão.
 *
 * A versão é a escolhida, e não a mais recente. Enquanto a escolha morria ao
 * sair da ficha, as duas coincidiam sempre, e por isso o cartão podia ler o
 * MOD sem que nada caísse: o número vinha de `versaoMaisRecente(mod)` e o selo
 * do veredito do MOD. São duas contas diferentes sobre coisas diferentes, e um
 * cartão que anuncia «1.0.0» com o selo da 2.0.0 diz sobre estes bytes uma
 * revisão feita em outros — no lugar em que os selos são olhados em série, que
 * é onde se decide qual MOD abrir.
 *
 * `outraRevogada` existe para não perder o que o selo por MOD dizia. Ele
 * ficava vermelho quando QUALQUER versão do MOD tinha sido retirada, e isso é
 * informação que vale; só não é o selo desta versão. Vermelho sobre um número
 * que ninguém retirou é tão falso quanto a falta dele sobre um que foi.
 */
export function dadosDoCartao(mod, numeroEscolhido, agora) {
  const versao = versaoEscolhida(mod, numeroEscolhido);
  return {
    versao: versao.versao,
    idade: textoDaIdade(versao.publicado_em, agora),
    nivel: versao.revogada ? "revogada" : avaliacaoDaVersao(mod, versao).nivel,
    outraRevogada: (mod.versoes ?? []).some(
      (v) => v.revogada && v.versao !== versao.versao,
    ),
  };
}

/**
 * O que dizer quando a versão escolhida não é a que o identificador traz.
 *
 * O app aceita `autor/nome` e instala a mais recente — é o passo 5 do «o que o
 * cliente faz», e não há hoje forma de pedir uma versão por ali. Então a tela
 * não pode oferecer o id em silêncio embaixo de uma ficha da 1.0.0: quem
 * digitasse instalaria a 2.0.0 achando que instalou o que leu.
 *
 * O aviso nomeia o número que o identificador traz de verdade, e aponta para o
 * caminho que traz ESTES bytes: a lista de arquivos desta versão, com o hash
 * desta versão para conferir. Um `autor/nome@versao` resolveria melhor, e é
 * mudança no app SEELE — escrevê-lo aqui seria anunciar um contrato que o
 * outro lado não tem.
 */
export function avisoDaEscolha(acao) {
  if (acao.ehMaisRecente) return null;
  return (
    `O identificador acima instala a versão mais recente (${acao.maisRecente}), ` +
    `e não a ${acao.versao} que está nesta tela. Para ficar nesta versão, use os ` +
    "arquivos listados abaixo e confira o hash desta ficha."
  );
}

function cartao(mod, numeroEscolhido, agora, aoAbrir) {
  const raiz = elemento("article", "cartao");
  const botao = elemento("button", "cartao-abrir");
  botao.type = "button";
  botao.addEventListener("click", () => aoAbrir(mod.id));

  const dados = dadosDoCartao(mod, numeroEscolhido, agora);

  const topo = elemento("span", "cartao-topo");
  const nomes = elemento("span", "cartao-nomes");
  nomes.append(
    elemento("span", "cartao-titulo", mod.titulo),
    elemento("span", "cartao-repo", mod.id),
  );
  topo.append(nomes, selo(dados.nivel));

  const numeros = elemento("span", "numeros");
  numeros.append(
    elemento("span", "numero", dados.versao),
    elemento("span", "numero-rotulo", "VERSÃO"),
    elemento("span", "espaco"),
    elemento("span", "numero", dados.idade),
    elemento("span", "numero-rotulo", "PUBLICADA"),
  );

  botao.append(topo, elemento("span", "cartao-resumo", mod.resumo), numeros);
  if (dados.outraRevogada) {
    botao.append(elemento("span", "cartao-retirada", "OUTRA VERSÃO DESTE MOD FOI RETIRADA"));
  }
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

  // O selo do cartão vira «revogada» a partir de uma lista que pode não ter
  // sido conferida — e quando ela não foi, a ausência do vermelho num cartão
  // é silêncio, não veredito. A tela de revogações já diz isso de si mesma,
  // e a ficha do MOD também; faltava dizê-lo onde os selos são olhados em
  // série, que é aqui.
  if (!foiConferida(estado.revogacoes)) {
    const nota = elemento(
      "p",
      "nota-dos-selos",
      estado.revogacoes.estado === "consultando"
        ? "A lista de revogações ainda está sendo consultada: os selos abaixo ainda não dizem se um MOD foi retirado."
        : "A lista de revogações não foi conferida, e o que não foi conferido não é usado: os selos abaixo não dizem se um MOD foi retirado. A aba Revogações explica o que houve.",
    );
    nota.dataset.estado = estado.revogacoes.estado;
    painel.append(nota);
  }

  if (estado.lista.length === 0) {
    painel.append(elemento("p", "vazio", "NENHUM MOD BATE COM ESSA BUSCA"));
  } else {
    const grade = elemento("div", "grade");
    for (const mod of estado.lista) {
      grade.append(cartao(mod, escolhaDe(estado, mod.id), estado.agora, acoes.abrir));
    }
    painel.append(grade);
  }

  raiz.append(lateral, painel);
  return raiz;
}

/**
 * A lista de versões como ela é LIDA: número, selo e qual está escolhida.
 *
 * É função exportada e pura pelo mesmo motivo de `linhasDaFicha`: as decisões
 * saem do meio dos `createElement` para poderem ter teste sem DOM. A que mora
 * aqui é a que o defeito desta rodada tinha errado — de quem é o selo.
 *
 * Da mais recente para a mais antiga, porque é a ordem em que se procura.
 */
export function botoesDeVersao(mod, escolhida) {
  return [...mod.versoes]
    .sort((a, b) => b.publicado_em - a.publicado_em)
    .map((v) => ({
      versao: v.versao,
      // O selo é o da versão da linha, nunca o do MOD: é ele que diz que
      // trocar de versão troca o veredito, e é a única coisa na tela que
      // avisa disso antes de a pessoa clicar.
      nivel: v.revogada ? "revogada" : avaliacaoDaVersao(mod, v).nivel,
      escolhida: v.versao === escolhida.versao,
    }));
}

/**
 * Os botões que trocam a versão em exibição.
 *
 * Só aparece com mais de uma versão: um botão sozinho não é uma escolha, e o
 * número da única versão já está na ficha logo abaixo.
 */
function blocoDasVersoes(mod, escolhida, acoes) {
  const bloco = elemento("section", "grupo");
  bloco.append(elemento("span", "rotulo", "VERSÕES AVALIADAS"));
  const linha = elemento("div", "versoes");
  for (const item of botoesDeVersao(mod, escolhida)) {
    const botao = elemento("button", "filtro", item.versao);
    botao.type = "button";
    botao.dataset.versao = item.versao;
    botao.setAttribute("aria-pressed", String(item.escolhida));
    botao.append(selo(item.nivel));
    botao.addEventListener("click", () => acoes.escolherVersao(item.versao));
    linha.append(botao);
  }
  bloco.append(linha);
  return bloco;
}

function telaMod(estado, acoes) {
  const mod = estado.lista.find((m) => m.id === estado.id) ?? estado.todos.find((m) => m.id === estado.id);
  const painel = elemento("div", "painel");
  if (!mod) {
    painel.append(elemento("p", "vazio", "ESSE MOD NÃO ESTÁ NO CATÁLOGO"));
    return painel;
  }

  const versao = versaoEscolhida(mod, escolhaDe(estado, mod.id));
  const avaliacao = avaliacaoDaVersao(mod, versao);
  painel.append(elemento("h1", null, mod.titulo));
  painel.append(elemento("span", "resumo-da-lista", `${mod.id} · ${mod.repo}`));
  painel.append(elemento("p", "cartao-resumo", mod.resumo));

  // A escolha vem ANTES de tudo o que ela muda: notas, ficha e arquivos falam
  // da versão escolhida, e uma tela que só revelasse isso depois faria a
  // pessoa reler o que já tinha lido.
  if (mod.versoes.length > 1 && acoes?.escolherVersao) {
    painel.append(blocoDasVersoes(mod, versao, acoes));
  }

  // As notas vêm ANTES de tudo o que parece um botão de instalar: uma nota
  // que a pessoa lê depois de instalar não é uma nota.
  //
  // E são as notas DESTA versão. As do MOD são as da avaliação mais recente:
  // mostrá-las sobre uma versão antiga esconderia a ressalva que aquela
  // versão tem e anunciaria uma que ela não tem.
  if (avaliacao.notas.length > 0) {
    const bloco = elemento("section", "grupo");
    bloco.append(elemento("span", "rotulo", "O QUE A AVALIAÇÃO ACHOU DE INCOMUM NESTA VERSÃO"));
    for (const nota of avaliacao.notas) bloco.append(elemento("p", "nota", frase("notas", nota)));
    painel.append(bloco);
  }

  // Esta é a tela onde alguém decide instalar, e é por isso que a consulta
  // das revogações aparece aqui mesmo quando ela falhou: sem este bloco, a
  // ausência do aviso «esta versão foi retirada» seria lida como «esta
  // versão não foi retirada» — uma afirmação que ninguém conferiu.
  if (!foiConferida(estado.revogacoes)) {
    const bloco = elemento("section", "grupo");
    bloco.append(elemento("span", "rotulo", "NÃO SABEMOS SE ESTA VERSÃO FOI RETIRADA"));
    bloco.append(
      elemento(
        "p",
        "cartao-resumo",
        estado.revogacoes.estado === "consultando"
          ? "A lista de revogações ainda está sendo consultada."
          : frase("revogacoes", estado.revogacoes.causa),
      ),
    );
    painel.append(bloco);
  } else if (versao.revogada) {
    const revogada = versao.revogada;
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
  //
  // Tudo daqui para baixo sai de `acaoDeInstalar(mod, versao)`, e da MESMA
  // versão: o identificador, o aviso, os caminhos dos arquivos e o hash que
  // quem baixa usa para conferir. Montados soltos, cada um podia passar a
  // falar de uma versão diferente sem nada cair.
  const acao = acaoDeInstalar(mod, versao);
  const comoInstalar = elemento("section", "grupo");
  comoInstalar.append(elemento("span", "rotulo", "COMO INSTALAR"));
  comoInstalar.append(
    elemento("p", "cartao-resumo", "No app, em Configurações · Mods, digite o identificador abaixo. O app baixa os arquivos, confere o hash e recusa se não bater."),
  );
  comoInstalar.append(elemento("code", "hash", acao.identificador));
  const aviso = avisoDaEscolha(acao);
  if (aviso) comoInstalar.append(elemento("p", "aviso-da-escolha", aviso));
  painel.append(comoInstalar);

  if (versao.alcanca.length > 0) {
    const alcance = elemento("section", "grupo");
    alcance.append(elemento("span", "rotulo", "O QUE ELE ALCANÇA"));
    for (const item of versao.alcanca) alcance.append(elemento("p", "nota", item));
    painel.append(alcance);
  }

  const arquivos = elemento("section", "grupo");
  arquivos.append(elemento("span", "rotulo", "OS ARQUIVOS DESTA VERSÃO"));
  for (const arquivo of acao.arquivos) {
    const link = elemento("a", null, arquivo.caminho);
    link.href = arquivo.url;
    arquivos.append(link);
  }
  painel.append(arquivos);

  const repo = elemento("a", "botao", "ABRIR O REPOSITÓRIO →");
  repo.href = mod.repo;
  repo.rel = "noopener noreferrer";
  painel.append(repo);
  return painel;
}

/**
 * O bloco que ocupa o lugar da tabela quando a consulta não foi conferida.
 *
 * Ele tem um botão e o aviso de integridade do catálogo não tem, e não é
 * incoerência: o ADR 0029 recusa «tentar assim mesmo», que é usar o dado
 * ruim. Consultar de novo é o contrário disso — é buscar um dado bom, e é
 * o único caminho de volta, porque a lista chega por uma requisição que
 * pode simplesmente ter pegado um nó ruim da CDN.
 */
function blocoDaConsultaRecusada(oQue, acoes) {
  const bloco = elemento("section", "aviso-das-revogacoes");
  bloco.dataset.estado = oQue.estado;
  bloco.append(elemento("span", "rotulo", "A LISTA DE REVOGAÇÕES NÃO FOI CONFERIDA"));
  bloco.append(elemento("p", null, frase("revogacoes", oQue.causa)));

  // Fora de `sem-ed25519`: ali o que falta é o navegador, e um botão que
  // não pode funcionar é uma promessa falsa.
  if (oQue.causa !== "sem-ed25519" && acoes?.reconsultarRevogacoes) {
    const botao = elemento("button", "botao", "CONSULTAR DE NOVO");
    botao.type = "button";
    botao.addEventListener("click", () => acoes.reconsultarRevogacoes());
    bloco.append(botao);
  }
  return bloco;
}

function telaRevogacoes(estado, acoes) {
  const painel = elemento("div", "painel");
  painel.append(elemento("h1", null, "Revogações"));
  painel.append(
    elemento("p", "cartao-resumo", "MODs retirados e versões do produto revogadas, na mesma lista — são a mesma peça. Uma revogação impede instalar e impede hospedar; ela não apaga o que já está numa máquina."),
  );

  const oQue = paraTela(estado.revogacoes);

  if (oQue.mostrar === "consultando") {
    painel.append(elemento("p", "vazio", "CONSULTANDO A LISTA DE REVOGAÇÕES"));
    return painel;
  }

  if (oQue.mostrar === "recusa") {
    painel.append(blocoDaConsultaRecusada(oQue, acoes));
    return painel;
  }

  if (oQue.mostrar === "vazio") {
    // A única frase deste site que afirma ausência de revogação, e ela só
    // é alcançável depois de a assinatura conferir. Antes, qualquer falha
    // caía aqui e dizia isto sem ter conferido nada.
    painel.append(elemento("p", "vazio", "NADA FOI RETIRADO ATÉ AGORA"));
    return painel;
  }

  const linhas = oQue.linhas;
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

/**
 * O endereço da solicitação de inclusão, montado inteiro.
 *
 * # Por que ele é uma função exportada, e não um literal lá dentro
 *
 * Para poder ser provado. **A organização já esteve errada aqui**: o endereço
 * dizia `seele/SEELE-MODS-INDEXER`, que é 404, e toda solicitação deste botão
 * caía numa página de repositório inexistente. Quem tentasse publicar um MOD
 * não teria como saber que o caminho é que estava quebrado — concluiria que o
 * projeto não aceita submissões. Um canal que existe e não leva a lugar nenhum
 * é pior que canal nenhum, porque ninguém vai procurá-lo.
 *
 * # Por que uma issue, e não um formulário que escreve
 *
 * Porque este site é hospedagem estática, e continuar assim é o que impede uma
 * rota de busca de existir um dia. Com API o indexador aprende cada termo
 * digitado; com arquivo parado, aprende que alguém buscou o arquivo. A
 * submissão sai daqui e vai para o GitHub, que o projeto já usa — o indexador
 * não fica sabendo de nada.
 */
export function enderecoDaSolicitacao() {
  return (
    "https://github.com/DATA-AND-DEV/SEELE-MODS-INDEXER/issues/new?labels=inclus%C3%A3o&title=" +
    encodeURIComponent("inclusão: <autor>/<nome>") +
    "&body=" +
    encodeURIComponent(
      "URL do repositório:\nCommit a avaliar:\nO que o mod faz:\nO que ele alcança (o `reach` do mod.json):\n",
    )
  );
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
  abrir.href = enderecoDaSolicitacao();
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
