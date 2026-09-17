import { test } from "node:test";
import assert from "node:assert/strict";

import {
  avisoDaEscolha,
  botoesDeVersao,
  dadosDoCartao,
  linhasDaFicha,
  textoDaIdade,
  enderecoDaSolicitacao,
} from "../tela.js";
import { acaoDeInstalar } from "../catalogo.js";

const AGORA = 1_757_000_000;

test("idade em dias, horas e agora mesmo", () => {
  assert.equal(textoDaIdade(AGORA, AGORA), "agora");
  assert.equal(textoDaIdade(AGORA - 3600 * 5, AGORA), "há 5 h");
  assert.equal(textoDaIdade(AGORA - 86400 * 3, AGORA), "há 3 d");
  assert.equal(textoDaIdade(AGORA - 86400 * 400, AGORA), "há 1 a");
});

test("a idade nunca é negativa quando o relógio local atrasa", () => {
  // O `gerado_em` vem do catálogo e o `agora` do relógio de quem lê. Um
  // relógio atrasado produziria «há -2 d», que parece defeito nosso.
  assert.equal(textoDaIdade(AGORA + 86400, AGORA), "agora");
});

test("a ficha traz versão, api, hash inteiro e o commit inteiro", () => {
  const mod = { commit: "a".repeat(40), nivel: "verificado", notas: [] };
  const versao = { versao: "2.1.0", api: 1, hash: "b".repeat(64), publicado_em: AGORA, arquivos: ["mod.json"] };
  const linhas = linhasDaFicha(mod, versao);
  const porRotulo = Object.fromEntries(linhas.map((l) => [l.rotulo, l.valor]));

  assert.equal(porRotulo["VERSÃO"], "2.1.0");
  assert.equal(porRotulo["API"], "1");
  // Inteiros: o hash é o que uma pessoa compara a olho, e um commit
  // abreviado colide.
  assert.equal(porRotulo["HASH DO CONTEÚDO"], "b".repeat(64));
  assert.equal(porRotulo["COMMIT AVALIADO"], "a".repeat(40));
});

test("a ficha nunca traz estrelas nem downloads", () => {
  const mod = { commit: "a".repeat(40), nivel: "verificado", notas: [] };
  const versao = { versao: "1.0.0", api: 1, hash: "c".repeat(64), publicado_em: AGORA, arquivos: [] };
  const rotulos = linhasDaFicha(mod, versao).map((l) => l.rotulo).join(" ");
  assert.ok(!/ESTRELA|BAIXAD|DOWNLOAD/.test(rotulos), "não medimos isso");
});

// --- A ficha da versão escolhida --------------------------------------------
//
// O mesmo mod com duas versões de vereditos DIFERENTES. Com as duas iguais,
// a ficha podia mostrar o nível do mod no lugar do da versão e nenhum teste
// veria — que é como este defeito viveu desde o começo.

const MOD_DE_DUAS = {
  id: "juli/cinza-frio", titulo: "Cinza Frio", autor: "juli", nome: "cinza-frio",
  // O veredito do MOD é o da avaliação mais recente: a 2.0.0.
  nivel: "oficial", notas: [], commit: "a".repeat(40),
  versoes: [
    {
      versao: "1.0.0", api: 1, hash: "e".repeat(64), publicado_em: 1000,
      alcanca: [], arquivos: ["mod.json"],
      nivel: "com-notas", notas: ["fala-com-terceiro"], commit: "b".repeat(40),
    },
    {
      versao: "2.0.0", api: 2, hash: "f".repeat(64), publicado_em: 3000,
      alcanca: [], arquivos: ["mod.json", "cliente/main.js"],
      nivel: "oficial", notas: [], commit: "a".repeat(40),
    },
  ],
};

const fichaPorRotulo = (mod, versao) =>
  Object.fromEntries(linhasDaFicha(mod, versao).map((l) => [l.rotulo, l.valor]));

test("a ficha da versão antiga traz o nível e o commit DELA", () => {
  const ficha = fichaPorRotulo(MOD_DE_DUAS, MOD_DE_DUAS.versoes[0]);
  assert.equal(ficha["VERSÃO"], "1.0.0");
  assert.equal(ficha["COMMIT AVALIADO"], "b".repeat(40));
  assert.match(ficha["NÍVEL"], /ressalvas/);
});

test("a ficha da versão antiga nunca mostra a avaliação da mais recente", () => {
  // O guarda direto: as duas fichas do mesmo mod têm de discordar, porque as
  // duas avaliações discordam. Se alguém voltar a ler `mod.nivel` aqui, elas
  // passam a concordar e este teste cai.
  const antiga = fichaPorRotulo(MOD_DE_DUAS, MOD_DE_DUAS.versoes[0]);
  const recente = fichaPorRotulo(MOD_DE_DUAS, MOD_DE_DUAS.versoes[1]);
  assert.notEqual(antiga["NÍVEL"], recente["NÍVEL"]);
  assert.notEqual(antiga["COMMIT AVALIADO"], recente["COMMIT AVALIADO"]);
  assert.notEqual(antiga["HASH DO CONTEÚDO"], recente["HASH DO CONTEÚDO"]);
});

test("a ficha da versão mais recente segue de acordo com o mod", () => {
  const ficha = fichaPorRotulo(MOD_DE_DUAS, MOD_DE_DUAS.versoes[1]);
  assert.equal(ficha["COMMIT AVALIADO"], MOD_DE_DUAS.commit);
  assert.equal(ficha["ARQUIVOS"], "2");
});

test("os botões de versão vêm da mais recente para a mais antiga", () => {
  const botoes = botoesDeVersao(MOD_DE_DUAS, MOD_DE_DUAS.versoes[0]);
  assert.deepEqual(botoes.map((b) => b.versao), ["2.0.0", "1.0.0"]);
});

test("só a versão escolhida fica marcada, e é a antiga quando foi ela a escolhida", () => {
  const botoes = botoesDeVersao(MOD_DE_DUAS, MOD_DE_DUAS.versoes[0]);
  assert.deepEqual(botoes.map((b) => b.escolhida), [false, true]);
});

test("cada botão de versão leva o selo da própria versão", () => {
  const botoes = botoesDeVersao(MOD_DE_DUAS, MOD_DE_DUAS.versoes[1]);
  assert.deepEqual(botoes.map((b) => b.nivel), ["oficial", "com-notas"]);
});

test("a versão retirada mostra o selo de revogada, e só ela", () => {
  const cruzado = {
    ...MOD_DE_DUAS,
    versoes: [
      { ...MOD_DE_DUAS.versoes[0], revogada: { motivo: "credencial-vazada" } },
      { ...MOD_DE_DUAS.versoes[1], revogada: null },
    ],
  };
  const botoes = botoesDeVersao(cruzado, cruzado.versoes[1]);
  assert.deepEqual(botoes.map((b) => b.nivel), ["oficial", "revogada"]);
});

test("um catálogo antigo, sem avaliação por versão, ainda rende uma ficha", () => {
  // Compatibilidade: o campo por versão é novo, e um catálogo assinado antes
  // dele não tem o que responder. A ficha cai no veredito do mod, que é o que
  // ela mostrava antes — e não em «undefined».
  const semCampos = { versao: "9.0.0", api: 1, hash: "c".repeat(64), publicado_em: 5000, arquivos: [] };
  const ficha = fichaPorRotulo(MOD_DE_DUAS, semCampos);
  assert.equal(ficha["COMMIT AVALIADO"], MOD_DE_DUAS.commit);
  assert.match(ficha["NÍVEL"], /respondemos/);
});

// --- O cartão da lista ------------------------------------------------------
//
// O cartão é a primeira coisa que alguém lê, e durante muito tempo ele leu o
// MOD: `versaoMaisRecente(mod)` para o número e a idade, e o veredito do MOD
// para o selo. Enquanto a escolha de versão não saía da ficha, os dois
// coincidiam — e é exatamente por isso que nada caía. Agora a escolha
// sobrevive à volta para a lista, e um cartão que anuncia «1.0.0» com o selo
// da 2.0.0 é uma frase falsa sobre os bytes que a pessoa vai instalar.

const REVOGADA_NA_ANTIGA = {
  ...MOD_DE_DUAS,
  versoes: [
    { ...MOD_DE_DUAS.versoes[0], revogada: { motivo: "credencial-vazada" } },
    { ...MOD_DE_DUAS.versoes[1], revogada: null },
  ],
};

test("sem escolha, o cartão mostra a versão mais recente", () => {
  const cartao = dadosDoCartao(MOD_DE_DUAS, null, AGORA);
  assert.equal(cartao.versao, "2.0.0");
  assert.equal(cartao.nivel, "oficial");
});

test("o cartão mostra a versão escolhida, e não a mais recente", () => {
  const cartao = dadosDoCartao(MOD_DE_DUAS, "1.0.0", AGORA);
  assert.equal(cartao.versao, "1.0.0");
});

test("o selo do cartão é o da versão escolhida, e nunca o do MOD", () => {
  // O guarda contra a volta da seleção por MOD: `mod.nivel` é `oficial` e a
  // versão escolhida é `com-notas`. Com `versaoMaisRecente(mod)` ou com
  // `mod.nivel` no lugar, este selo volta a ser `oficial` e o teste cai.
  const cartao = dadosDoCartao(MOD_DE_DUAS, "1.0.0", AGORA);
  assert.equal(cartao.nivel, "com-notas");
  assert.notEqual(cartao.nivel, MOD_DE_DUAS.nivel);
});

test("a idade do cartão é a da versão escolhida", () => {
  // Um «agora» perto das duas datas, e não daqui a 55 anos: com o relógio de
  // hoje as duas idades arredondam para o mesmo texto, e um teste que não
  // consegue distinguir as duas não estaria testando nada.
  const POUCO_DEPOIS = 1000 + 3600 * 2;
  const antiga = dadosDoCartao(MOD_DE_DUAS, "1.0.0", POUCO_DEPOIS);
  const recente = dadosDoCartao(MOD_DE_DUAS, "2.0.0", POUCO_DEPOIS);
  assert.equal(antiga.idade, textoDaIdade(1000, POUCO_DEPOIS));
  assert.equal(recente.idade, textoDaIdade(3000, POUCO_DEPOIS));
  assert.notEqual(antiga.idade, recente.idade);
});

test("o cartão da versão retirada leva o selo de revogada", () => {
  assert.equal(dadosDoCartao(REVOGADA_NA_ANTIGA, "1.0.0", AGORA).nivel, "revogada");
});

test("o cartão não chama de revogada a versão que não foi retirada", () => {
  // O vermelho em cima de um número que ninguém retirou é tão falso quanto a
  // falta dele: o cartão anuncia UMA versão, e o selo fala dela.
  const cartao = dadosDoCartao(REVOGADA_NA_ANTIGA, "2.0.0", AGORA);
  assert.equal(cartao.nivel, "oficial");
  // E a informação não some: o cartão continua podendo dizer que ALGUMA
  // versão deste MOD foi retirada, que era o que o selo por MOD dizia.
  assert.equal(cartao.outraRevogada, true);
});

test("sem outra versão retirada, o cartão não inventa o aviso", () => {
  assert.equal(dadosDoCartao(MOD_DE_DUAS, "1.0.0", AGORA).outraRevogada, false);
  assert.equal(dadosDoCartao(REVOGADA_NA_ANTIGA, "1.0.0", AGORA).outraRevogada, false);
});

test("uma escolha que saiu do catálogo cai na mais recente, e não em nada", () => {
  const cartao = dadosDoCartao(MOD_DE_DUAS, "0.9.0", AGORA);
  assert.equal(cartao.versao, "2.0.0");
});

// --- O caminho de ação ------------------------------------------------------
//
// O que a tela oferece para instalar tem de falar da versão que está na tela.
// O identificador que o app aceita hoje é `autor/nome`, e ele traz a mais
// recente: dizer isso é o contrário de esconder, porque quem escolheu a 1.0.0
// precisa saber que digitar o id não traz a 1.0.0.

test("escolhida a mais recente, não há aviso a dar", () => {
  const acao = acaoDeInstalar(MOD_DE_DUAS, MOD_DE_DUAS.versoes[1]);
  assert.equal(avisoDaEscolha(acao), null);
});

test("escolhida uma versão antiga, a tela avisa que o identificador traz outra", () => {
  const acao = acaoDeInstalar(MOD_DE_DUAS, MOD_DE_DUAS.versoes[0]);
  const aviso = avisoDaEscolha(acao);
  assert.ok(aviso, "uma versão antiga sem aviso deixa o identificador mentir");
  // O número que o identificador realmente traz aparece na frase: sem ele, o
  // aviso diz que há uma diferença sem dizer qual.
  assert.match(aviso, /2\.0\.0/);
});

test("a solicitação de inclusão aponta para o repositório que existe", () => {
  // **A organização já esteve errada aqui**, e o defeito era mudo: o endereço
  // dizia `seele/SEELE-MODS-INDEXER`, que é 404. O botão abria, o GitHub
  // respondia «não encontrado», e quem tentasse publicar um MOD concluiria que
  // o projeto não aceita submissões — quando o que estava quebrado era o
  // caminho. Um canal que existe e não leva a lugar nenhum é pior que canal
  // nenhum, porque ninguém volta a procurá-lo.
  const endereco = enderecoDaSolicitacao();
  assert.ok(
    endereco.startsWith("https://github.com/DATA-AND-DEV/SEELE-MODS-INDEXER/issues/new"),
    `a solicitação aponta para ${endereco}`,
  );
  assert.ok(!endereco.includes("/seele/"), "voltou a apontar para a organização errada");

  // E o corpo continua pedindo as quatro coisas sem as quais a avaliação não
  // começa. Uma issue que chega sem o commit é uma ida e volta a mais para
  // todo mundo.
  const url = new URL(endereco);
  const corpo = url.searchParams.get("body") ?? "";
  for (const pedido of ["URL do repositório", "Commit a avaliar", "O que o mod faz", "alcança"]) {
    assert.ok(corpo.includes(pedido), `a solicitação não pede «${pedido}»`);
  }
  assert.equal(url.searchParams.get("labels"), "inclusão");
});
