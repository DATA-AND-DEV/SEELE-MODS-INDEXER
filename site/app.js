// SEELE MODS — ligar os seis.
//
// A ordem é a do «o que o cliente faz» da doc, e o site suporta isso e nada
// além: baixa o catálogo e a assinatura, confere, busca localmente, e baixa
// as revogações com a assinatura delas, que também é conferida antes de a
// lista ser lida. Nenhum passo precisa de mais do que arquivo parado.

"use strict";

import { cruzarRevogacoes, filtrar, ordenar } from "./catalogo.js";
import { CONSULTANDO, carregarRevogacoes } from "./revogacoes.js";
import { analisar, paraHash } from "./rotas.js";
import { desenhar, desenharAviso } from "./tela.js";
import { temEd25519, verificar } from "./verificar.js";

const estado = {
  // `catalogo` são os MODs como vieram; `todos` são os mesmos cruzados com
  // as revogações. Dois campos e não um porque as duas consultas são
  // independentes e chegam em qualquer ordem — quem chegar por último
  // recruza com o que o outro já deixou aqui.
  catalogo: [], todos: [], lista: [], revogacoes: CONSULTANDO,
  tela: "catalogo", id: null, nivel: null, ordem: "recentes", busca: "",
  // A versão escolhida em cada MOD, por id. Um MOD ausente do mapa quer dizer
  // «a mais recente», e não «nenhuma»: é estado de tela, e por isso não entra
  // na rota. Pôr o número no `#/` faria dele contrato de link permanente — uma
  // versão que saísse do catálogo transformaria links guardados por aí em rota
  // morta.
  //
  // Por id, e não uma escolha só: a lista mostra vários MODs ao mesmo tempo, e
  // é o cartão de cada um que carrega o selo daquela versão. Com uma escolha
  // única, ou a 1.0.0 escolhida num MOD carimbava a 1.0.0 do vizinho — outra
  // avaliação, que ninguém escolheu —, ou ela tinha de ser apagada ao sair da
  // ficha, e aí o cartão nunca voltaria a mostrar o que a pessoa escolheu.
  // `Map` e não objeto: as chaves vêm do catálogo, e um objeto tem nomes que
  // já querem dizer outra coisa.
  escolhas: new Map(),
  agora: Math.floor(Date.now() / 1000),
};

const corpo = document.getElementById("corpo");
const aviso = document.getElementById("aviso");
const busca = document.getElementById("busca");
const topo = document.getElementById("topo");

const acoes = {
  abrir: (id) => { location.hash = paraHash({ tela: "mod", id }); },
  filtrarNivel: (nivel) => { estado.nivel = nivel; redesenhar(); },
  ordenar: (ordem) => { estado.ordem = ordem; redesenhar(); },
  reconsultarRevogacoes: () => { atualizarRevogacoes(); },
  escolherVersao: (versao) => { estado.escolhas.set(estado.id, versao); redesenhar(); },
};

function redesenhar() {
  estado.lista = ordenar(
    filtrar(estado.todos, { nivel: estado.nivel, busca: estado.busca }),
    estado.ordem,
  );
  desenhar(corpo, estado, acoes);
}

/** A altura do cabeçalho vira a âncora das colunas grudentas. */
function medirTopo() {
  document.documentElement.style.setProperty("--mods-topo", `${topo.offsetHeight}px`);
}

async function baixar(nome) {
  const resposta = await fetch(nome, { cache: "no-store" });
  if (!resposta.ok) throw new Error(nome);
  return new Uint8Array(await resposta.arrayBuffer());
}

async function carregar() {
  let catalogoCru;
  let assinaturaCrua;
  let chaveCrua;
  try {
    [catalogoCru, assinaturaCrua, chaveCrua] = await Promise.all([
      baixar("catalogo.json"),
      baixar("catalogo.json.minisig"),
      baixar("chave.pub"),
    ]);
  } catch {
    // A falha que vai acontecer, e ela liga as duas coisas na mesma frase:
    // sem isto, não se entra em servidor com mod.
    desenharAviso(aviso, { estado: "falhou", causa: "sem-resposta" });
    return;
  }

  const decodificador = new TextDecoder();
  const catalogo = JSON.parse(decodificador.decode(catalogoCru));

  if (!(await temEd25519())) {
    // Diz que não conferiu, mostra o catálogo, e não finge.
    desenharAviso(aviso, { estado: "sem-conferir", causa: "sem-ed25519" });
  } else {
    const veredito = await verificar(
      catalogoCru,
      decodificador.decode(assinaturaCrua),
      decodificador.decode(chaveCrua),
    );
    desenharAviso(
      aviso,
      veredito.integro
        ? { estado: "integro" }
        : {
            estado: "falhou",
            causa:
              veredito.causa === "assinatura-ilegivel" || veredito.causa === "chave-diferente"
                ? "assinatura-nao-confere"
                : veredito.causa,
          },
    );
    // Não há «tentar assim mesmo» (ADR 0029), e também não há tela em
    // branco: o catálogo é mostrado com o aviso vermelho por cima dele,
    // porque esconder tudo esconderia a informação que explica a falha.
  }

  estado.catalogo = catalogo.mods;
  recruzar();
}

/** Qual consulta de revogações é a atual — ver `atualizarRevogacoes`. */
let consultaDasRevogacoes = 0;

/** O cruzamento é refeito sempre que uma das duas consultas responde. */
function recruzar() {
  // `dados` é `null` fora do estado `integro`, e `cruzarRevogacoes` trata
  // isso como «nenhuma revogação conhecida» — que é o que ele pode fazer.
  // Quem diz que não sabemos é a tela, que lê `estado.revogacoes.estado`.
  estado.todos = cruzarRevogacoes(estado.catalogo, estado.revogacoes.dados);
  redesenhar();
}

/**
 * Consulta as revogações, e é o caminho de volta depois de uma falha.
 *
 * Roda em paralelo com o catálogo e não depois dele: são dois arquivos
 * parados independentes, e um catálogo que não chegou não é motivo para a
 * aba de revogações ficar sem um estado a mostrar.
 */
async function atualizarRevogacoes() {
  // Duas consultas em voo respondem fora de ordem, e quem clica «CONSULTAR
  // DE NOVO» duas vezes põe duas em voo. Sem o contador, a resposta lenta da
  // primeira — a que falhou — chegaria depois da segunda e apagaria o
  // resultado bom: a tela voltaria a recusar uma lista que já conferiu.
  const minha = (consultaDasRevogacoes += 1);
  estado.revogacoes = CONSULTANDO;
  redesenhar();
  const resultado = await carregarRevogacoes(baixar);
  if (minha !== consultaDasRevogacoes) return;
  estado.revogacoes = resultado;
  recruzar();
}

function aoTrocarRota() {
  const rota = analisar(location.hash);
  // Nada a zerar ao trocar de MOD: a escolha mora sob o id de quem a fez, e
  // por isso não alcança o vizinho. Era o que a limpeza daqui existia para
  // impedir, e ela cobrava o preço de a escolha sumir ao voltar para a lista.
  estado.tela = rota.tela;
  estado.id = rota.id;
  redesenhar();
}

for (const botao of document.querySelectorAll("[data-ir]")) {
  botao.addEventListener("click", () => {
    location.hash = paraHash({ tela: botao.dataset.ir, id: null });
  });
}

busca.addEventListener("input", () => {
  estado.busca = busca.value;
  // Se a busca acontecesse num servidor, o indexador aprenderia cada termo
  // digitado. Ela acontece aqui, sobre o que já foi baixado.
  if (estado.tela !== "catalogo") location.hash = paraHash({ tela: "catalogo", id: null });
  else redesenhar();
});

window.addEventListener("hashchange", aoTrocarRota);
new ResizeObserver(medirTopo).observe(topo);

aoTrocarRota();
carregar();
atualizarRevogacoes();
