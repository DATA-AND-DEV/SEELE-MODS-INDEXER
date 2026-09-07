// SEELE MODS — identificador → frase, para toda tela.
//
// A fronteira erro→texto fica aqui, e é por isso que nenhuma mensagem para
// gente nasce no `gerar.py`. As listas fechadas carregam identificadores
// justamente para que a casca escreva as frases (ADR 0012).
//
// O molde é `apps/seele-app/ui/frases.js`, e o guarda também: aquele arquivo
// conta ter tido um buraco silencioso — um motivo chegava e a tela não tinha
// frase, então saía em branco. `site/testes/frases.test.js` reprova quando
// alguém acrescenta um identificador em `listas.json` sem passar por aqui.

"use strict";

/** Por que uma versão foi retirada. Vale para MOD e para versão do produto. */
export const MOTIVOS = {
  "credencial-vazada": "um segredo foi publicado junto com o código",
  "leitura-de-disco-fora-da-pasta": "leu ou escreveu fora da pasta dele",
  "rede-nao-declarada": "alcançou a rede sem ter declarado que alcançaria",
  "dado-enviado-a-terceiro": "mandou para fora o que era da sessão",
  "nao-corresponde-ao-commit": "os bytes servidos não saíam do commit avaliado",
  "pedido-do-autor": "quem escreveu pediu a retirada",
  "migracao-que-corrompe": "uma migração desta versão perde dados",
};

/** O que a avaliação achou de incomum, e que é legítimo. */
export const NOTAS = {
  "fala-com-terceiro": "conversa com um serviço de fora durante a sessão",
  "guarda-dados-na-maquina": "grava coisas na sua máquina, na pasta dele",
  "substitui-a-interface-inteira": "repinta a janela toda, e não uma parte",
  "roda-no-servidor": "tem uma metade que roda na máquina de quem hospeda",
};

/** O que cada nível atesta — e o que ele não atesta. */
export const NIVEIS = {
  oficial: "nosso, e nós respondemos por ele",
  verificado: "passou na avaliação automática",
  "com-notas": "passou, com ressalvas que valem a leitura",
};

/** As falhas da tela.
 *
 * A primeira é a que vai acontecer, e ela liga as duas coisas na mesma
 * frase: sem o indexador, não se entra em servidor com MOD. Sem isso, quem
 * hospeda culpa o próprio roteador.
 *
 * A segunda acusa cache antes de adulteração porque é a causa provável — um
 * catálogo novo com assinatura velha em cache é a falha mais difícil de
 * diagnosticar deste desenho, e ela parece adulteração.
 *
 * Nenhuma delas oferece «tentar assim mesmo» (ADR 0029). */
export const FALHAS = {
  "sem-resposta":
    "mods.seele.app.br não respondeu. Se você estava entrando num servidor com mod, é por isso que não entrou — a lista dos mods vem daqui.",
  "assinatura-nao-confere":
    "o catálogo e a assinatura dele não combinam. Quase sempre é cache: um dos dois chegou velho de um nó da CDN. Recarregue daqui a um minuto. Se continuar, não use este catálogo.",
  "hash-nao-bate":
    "os arquivos baixados não somam o número que o catálogo diz. Os dois números estão lado a lado abaixo.",
  "sem-ed25519":
    "este navegador não confere assinaturas Ed25519. O catálogo abaixo não foi conferido aqui — quem confere de verdade é o app.",
};

const GRUPOS = { motivos: MOTIVOS, notas: NOTAS, niveis: NIVEIS, falhas: FALHAS };

/**
 * A frase de um identificador.
 *
 * Devolve o próprio identificador quando não há frase, e nunca `undefined`:
 * mostrar «undefined» para quem lê é pior que mostrar `credencial-vazada`.
 * O teste é que impede isso de acontecer em produção.
 */
export function frase(grupo, identificador) {
  const dicionario = GRUPOS[grupo];
  if (!dicionario) return identificador;
  return dicionario[identificador] ?? identificador;
}
