// SEELE MODS — ligar os cinco.
//
// A ordem é a do «o que o cliente faz» da doc, e o site suporta isso e nada
// além: baixa o catálogo e a assinatura, confere, busca localmente, e lê as
// revogações. Nenhum passo precisa de mais do que arquivo parado.

"use strict";

import { cruzarRevogacoes, filtrar, ordenar } from "./catalogo.js";
import { analisar, paraHash } from "./rotas.js";
import { desenhar, desenharAviso } from "./tela.js";
import { temEd25519, verificar } from "./verificar.js";

const estado = {
  todos: [], lista: [], revogacoes: null,
  tela: "catalogo", id: null, nivel: null, ordem: "recentes", busca: "",
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

  try {
    estado.revogacoes = JSON.parse(decodificador.decode(await baixar("revogacoes.json")));
  } catch {
    estado.revogacoes = { mods: [], versoes_do_produto: [] };
  }

  estado.todos = cruzarRevogacoes(catalogo.mods, estado.revogacoes);
  redesenhar();
}

function aoTrocarRota() {
  const rota = analisar(location.hash);
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
