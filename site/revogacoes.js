// SEELE MODS — a lista de revogações, conferida antes de ser usada.
//
// **A ausência de revogação é uma afirmação, e por isso ela tem de ser
// conferida antes de ser dita.** «Nada foi retirado» e «não conseguimos
// saber o que foi retirado» levam a decisões opostas — a primeira manda
// instalar, a segunda manda esperar — e o código que transformava qualquer
// falha numa lista vazia dizia a primeira em nome da segunda. É a mesma
// classe de defeito que o `_exigir` do `revogacoes.py` fecha do outro lado:
// de todos os arquivos deste desenho, este é o pior para falhar calado.
//
// Daí a ordem, que é a do passo 4 do «o que o cliente faz»: baixar,
// **conferir a assinatura dos bytes**, e só então interpretá-los. Nunca há
// «usar assim mesmo» — nem quando o navegador não sabe conferir Ed25519,
// porque um caminho que ignora a assinatura é a assinatura não existindo.
//
// O que sobra depois disso é um estado a mostrar, e a tela mostra o estado.

"use strict";

import { temEd25519, verificar } from "./verificar.js";

/**
 * As causas que uma consulta pode ter — lista fechada, e a frase é do
 * `frases.js` (ADR 0012).
 *
 * Ela é uma lista **exportada** e não uma derivada do texto-fonte, ao
 * contrário do guarda equivalente do `verificar.js`: duas destas causas
 * (`assinatura-nao-confere`, `comentario-adulterado`) não aparecem como
 * literal neste arquivo — elas chegam de `verificar.js` e passam pela
 * dobra abaixo. Um guarda que lesse só o fonte daqui não as veria, que é
 * justamente o buraco que ele existiria para fechar.
 */
export const CAUSAS = [
  "sem-resposta",
  "sem-ed25519",
  "assinatura-nao-confere",
  "comentario-adulterado",
  "json-ilegivel",
  "formato-inesperado",
];

/** O estado antes de a primeira consulta responder. */
export const CONSULTANDO = Object.freeze({ estado: "consultando", causa: null, dados: null });

/** Chave errada e assinatura ilegível contam a mesma história a quem lê. */
const DOBRADAS = new Set(["assinatura-ilegivel", "chave-diferente"]);

function recusa(estado, causa) {
  // `dados: null` é o contrato inteiro deste módulo: quem não conferiu não
  // entrega lista nenhuma, nem vazia. Uma lista vazia devolvida numa recusa
  // é indistinguível de uma lista vazia legítima uma função adiante.
  return { estado, causa, dados: null };
}

/**
 * Baixa e confere `revogacoes.json`.
 *
 * `baixar` é injetado porque é a única parte que fala com a rede; o resto
 * do módulo é a decisão, e é ela que os testes precisam alcançar. A
 * conferência **não** é injetada: um teste que pudesse trocar `verificar`
 * por um carimbo passaria com o defeito de volta no lugar.
 *
 * Devolve `{ estado, causa, dados }`, e nunca lança.
 *
 * - `integro` — a assinatura confere e `dados` é a lista. Uma lista
 *   assinada e vazia cai aqui, e é o único caso em que a tela pode dizer
 *   que nada foi retirado.
 * - `indisponivel` — não chegou. Não sabemos, e não é o mesmo que nada.
 * - `falhou` — chegou e não confere, ou confere e não é uma lista.
 * - `sem-conferir` — este navegador não sabe conferir a assinatura.
 */
export async function carregarRevogacoes(baixar) {
  // Antes de baixar, e não depois: se não há como conferir, não há como
  // usar, e baixar para descartar só gastaria a requisição.
  if (!(await temEd25519())) return recusa("sem-conferir", "sem-ed25519");

  let cru;
  let assinaturaCrua;
  let chaveCrua;
  try {
    [cru, assinaturaCrua, chaveCrua] = await Promise.all([
      baixar("revogacoes.json"),
      baixar("revogacoes.json.minisig"),
      baixar("chave.pub"),
    ]);
  } catch {
    // Os três juntos: uma lista sem a assinatura dela é tão inutilizável
    // quanto lista nenhuma, e chamar isso de «lista vazia» seria a mentira
    // que este módulo existe para não contar.
    return recusa("indisponivel", "sem-resposta");
  }

  const decodificador = new TextDecoder();
  const veredito = await verificar(
    cru,
    decodificador.decode(assinaturaCrua),
    decodificador.decode(chaveCrua),
  );
  if (!veredito.integro) {
    return recusa("falhou", DOBRADAS.has(veredito.causa) ? "assinatura-nao-confere" : veredito.causa);
  }

  // Só agora os bytes viram estrutura. Interpretar antes seria conferir o
  // que já foi usado.
  let dados;
  try {
    dados = JSON.parse(decodificador.decode(cru));
  } catch {
    return recusa("falhou", "json-ilegivel");
  }

  // A assinatura diz «estes bytes são nossos», e não «estes bytes são a
  // lista de revogações»: o `catalogo.json`, assinado pela mesma chave,
  // passaria pela conferência acima. Sem este guarda ele seria interpretado
  // como revogações — `mods` existe lá também, sem `versao` nenhum — e
  // produziria linhas de tabela sem sentido em vez de uma recusa.
  if (!Array.isArray(dados?.mods) || !Array.isArray(dados?.versoes_do_produto)) {
    return recusa("falhou", "formato-inesperado");
  }

  return { estado: "integro", causa: null, dados };
}

/**
 * Se a consulta foi conferida.
 *
 * É o guarda de toda frase que afirme ausência de revogação: fora daqui,
 * o que a tela pode dizer é que não sabe.
 */
export function foiConferida(revogacoes) {
  return revogacoes.estado === "integro";
}

/**
 * O que a tela de revogações mostra, decidido fora do DOM.
 *
 * Mora aqui e não no `tela.js` pelo motivo de sempre neste site — lá nada
 * é testável com `node --test` — e porque é esta função que carrega a
 * regra: `vazio` só existe depois de `foiConferida`.
 */
export function paraTela(revogacoes) {
  if (revogacoes.estado === "consultando") return { mostrar: "consultando" };
  if (!foiConferida(revogacoes)) {
    return { mostrar: "recusa", estado: revogacoes.estado, causa: revogacoes.causa };
  }

  // Uma lista e não duas: o ADR 0044 pede remoção de MOD e o 0045 revogação
  // de versão do produto, e duas tabelas seriam duas chances de esquecer uma.
  const linhas = [
    ...revogacoes.dados.mods.map((r) => ({ ...r, o_que: `${r.id} ${r.versao}` })),
    ...revogacoes.dados.versoes_do_produto.map((r) => ({ ...r, o_que: `SEELE ${r.versao}` })),
  ].sort((a, b) => b.desde - a.desde);

  return linhas.length === 0 ? { mostrar: "vazio" } : { mostrar: "lista", linhas };
}
