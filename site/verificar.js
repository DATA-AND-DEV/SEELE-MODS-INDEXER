// SEELE MODS — conferir a assinatura do catálogo, no navegador.
//
// **Isto é integridade e nunca autenticidade.** Este arquivo, a chave e o
// catálogo vêm todos da mesma origem: quem adultera o catálogo adultera o
// verificador junto, e a chave junto — não há âncora. A conferência do
// cliente Rust vale porque a chave está compilada no app, e quem controla a
// CDN não a alcança; aqui não há equivalente.
//
// Ela fica porque pega duas coisas reais: corrupção acidental, e CDN mal
// configurada. A segunda é a falha que a doc chama de mais difícil de
// diagnosticar do desenho inteiro — um catálogo novo com uma assinatura
// velha em cache parece adulteração e não é. Este é o único lugar do produto
// onde ela pode ser vista e nomeada.
//
// A palavra na tela é «íntegro». Nunca «autêntico», nunca «verificado».

"use strict";

/** Formato do minisign: algoritmo[2] ‖ idDaChave[8] ‖ resto. */
const CABECALHO = 10;

function deBase64(texto) {
  const cru = atob(texto.trim());
  const bytes = new Uint8Array(cru.length);
  for (let i = 0; i < cru.length; i += 1) bytes[i] = cru.charCodeAt(i);
  return bytes;
}

function algoritmoDe(bytes) {
  return String.fromCharCode(bytes[0], bytes[1]);
}

function mesmoId(um, outro) {
  return um.length === outro.length && um.every((byte, i) => byte === outro[i]);
}

/** Lê um `.pub` do minisign. */
export function analisarChave(texto) {
  const linhas = texto.split("\n").filter((l) => l.trim() && !l.startsWith("untrusted comment:"));
  const cru = deBase64(linhas[0]);
  if (cru.length !== CABECALHO + 32) throw new Error("chave com tamanho inesperado");
  return {
    algoritmo: algoritmoDe(cru),
    idDaChave: cru.slice(2, CABECALHO),
    publica: cru.slice(CABECALHO),
  };
}

/** Lê um `.minisig` do minisign. */
export function analisarAssinatura(texto) {
  const linhas = texto.split("\n");
  const base64Assinatura = linhas[1];
  const linhaConfiavel = linhas[2] ?? "";
  const base64Global = linhas[3];
  if (!base64Assinatura || !base64Global || !linhaConfiavel.startsWith("trusted comment:")) {
    throw new Error("assinatura incompleta");
  }

  const cru = deBase64(base64Assinatura);
  if (cru.length !== CABECALHO + 64) throw new Error("assinatura com tamanho inesperado");

  return {
    algoritmo: algoritmoDe(cru),
    idDaChave: cru.slice(2, CABECALHO),
    assinatura: cru.slice(CABECALHO),
    comentarioConfiavel: linhaConfiavel.slice("trusted comment:".length).trim(),
    assinaturaGlobal: deBase64(base64Global),
  };
}

/** Se este navegador consegue conferir Ed25519. */
export async function temEd25519() {
  try {
    await crypto.subtle.importKey("raw", new Uint8Array(32), { name: "Ed25519" }, false, ["verify"]);
    return true;
  } catch {
    return false;
  }
}

async function confere(publica, assinatura, mensagem) {
  const chave = await crypto.subtle.importKey("raw", publica, { name: "Ed25519" }, false, ["verify"]);
  return crypto.subtle.verify({ name: "Ed25519" }, chave, assinatura, mensagem);
}

/**
 * Confere se `bytes` é o que a assinatura diz.
 *
 * Devolve `{ integro: true }` ou `{ integro: false, causa }`, e `causa` é um
 * identificador de lista fechada — a frase é do `frases.js`.
 */
export async function verificar(bytes, textoDaAssinatura, textoDaChave) {
  let chave;
  let assinatura;
  try {
    chave = analisarChave(textoDaChave);
    assinatura = analisarAssinatura(textoDaAssinatura);
  } catch {
    return { integro: false, causa: "assinatura-ilegivel" };
  }

  // O id da chave existe para dizer «esta assinatura não é para esta chave»
  // sem gastar uma verificação — e para nomear a causa com precisão.
  if (!mesmoId(chave.idDaChave, assinatura.idDaChave)) {
    return { integro: false, causa: "chave-diferente" };
  }

  // `Ed` é o modo legado, que assina os bytes crus. `ED` seria pré-hasheado
  // com BLAKE2b, que o WebCrypto não tem — e `gerar.py` assina em legado
  // porque o catálogo é pequeno, não por causa daqui.
  if (assinatura.algoritmo !== "Ed") {
    return { integro: false, causa: "assinatura-ilegivel" };
  }

  if (!(await confere(chave.publica, assinatura.assinatura, bytes))) {
    return { integro: false, causa: "assinatura-nao-confere" };
  }

  // A assinatura global cobre o comentário confiável. Sem conferi-la, alguém
  // reescreve o comentário sem invalidar nada — e o comentário é o que uma
  // pessoa lê para saber o que foi assinado.
  const comentario = new TextEncoder().encode(assinatura.comentarioConfiavel);
  const juntos = new Uint8Array(assinatura.assinatura.length + comentario.length);
  juntos.set(assinatura.assinatura, 0);
  juntos.set(comentario, assinatura.assinatura.length);
  if (!(await confere(chave.publica, assinatura.assinaturaGlobal, juntos))) {
    return { integro: false, causa: "comentario-adulterado" };
  }

  return { integro: true };
}
