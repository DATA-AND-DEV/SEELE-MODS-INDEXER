// ---- adaptador.js: a única porta para a API da máquina ----
//
// **Todo nome da API 8 que a metade de máquina chama está aqui, e só aqui.**
// Os nomes são os que o SEELE entregou nas partes 3 e 4 (api/v8.json,
// «metade-de-maquina», copiado em test/contrato/api-v8.json):
//
//   maquina.servidor, maquina.oferta, maquina.plataforma
//   maquina.pedir(valor) -> Promise<texto>       maquina.aoAviso(fn(carga em texto))
//   maquina.aoParar(fn(motivo))                 maquina.aoReconectar(fn({ fora }))
//   maquina.porta.servir({ nome, protocolo, porta }) / parar(nome) / quedas(nome)
//   maquina.programa.baixar({ url, sha1|sha256|sha512, tamanho, destino, aoProgresso })
//   maquina.programa.escrever({ destino, texto })
//   maquina.programa.desempacotar({ arquivo, destino, raiz, mesclar })
//   maquina.programa.trazer({ pedido, destino }) -> { destino, tamanho, hash, jaEstava }
//   maquina.programa.ler({ arquivo }) -> texto
//   maquina.programa.rodar({ comando, argumentos, pasta }) -> processo
//     processo.aoLinha(fn(linha, fluxo)) / aoSair(fn(fim)) / fim / escrever(texto) / matar()
//   maquina.programa.recusas() -> Promise<{ nome: vezes }>
//   maquina.programa.empacotar({ origem, arquivo }) -> { arquivo, tamanho, sha256, arquivos, bytes, linksPulados }
//   maquina.programa.oferecerCopia({ arquivo, porta }) -> { codigo, tamanho, sha256, porta }
//   maquina.programa.receberCopia({ tunel, codigo, sha256, tamanho, destino, aoProgresso })
//     -> { destino, tamanho, sha256, retomadas, jaEstavam, caminho }
//
// **Uma metade de máquina é um servidor de jogo**: o produto sobe uma por
// (MOD, servidor), já presa à pasta daquele servidor. Nenhuma chamada leva o
// servidor; quem precisa do nome lê `servidor`.
//
// O que o resto da metade de máquina vê:
//
//   servidor                                        -> o servidor de jogo desta metade
//   plataforma()                                    -> 'mac-aarch64' | 'windows-x64' | ...
//   baixar({ url, hash, tamanho, destino, aoProgresso })  -> Promise
//   desempacotar({ arquivo, destino, raiz, mesclar }) -> Promise
//   trazer({ pedido, destino })                     -> Promise<{ jaEstava, ... }>: o pack da metade de servidor
//   ler(arquivo)                                    -> Promise<texto>
//   rodar({ comando, argumentos, pasta })           -> Promise<{ aoLinha, aoSair, escrever, encerrar }>
//   servirPorta({ nome, protocolo, porta })         -> Promise<{ fechar }>
//   escrever(caminho, texto)                        -> Promise
//   empacotar(origem, arquivo)                      -> Promise: a pasta do mundo num .tar.gz (parte 7)
//   oferecerCopia(arquivo, porta)                   -> Promise<{ codigo, tamanho, sha256 }>
//   receberCopia({ tunel, codigo, sha256, tamanho, destino }) -> Promise<{ sha256, caminho, ... }>
//   pedir(valor)                                    -> Promise<resposta da metade de servidor, já lida>
//   aoAviso(fn(servidor, carga já lida))
//   aoParar(fn(motivo))
//   aoReconectar(fn({ fora }))                      -> a volta de quem hospeda (sem ela, nada)
//   recusas()                                       -> Promise<{ nome: vezes }>
//   esperar(ms)                                     -> Promise
//   registrar(texto)

/** Uma promessa, mesmo de quem devolveu um valor ou lançou. */
const promessa = fn => {
  try {
    return Promise.resolve(fn());
  } catch (erro) {
    return Promise.reject(erro);
  }
};

/** JSON.parse que devolve o texto cru quando ele não é JSON. */
const lido = texto => {
  if (typeof texto !== 'string') return texto;
  try { return JSON.parse(texto); } catch { return texto; }
};

function criarAdaptador(g = globalThis) {
  const m = g.maquina;
  if (!m || !m.programa || !m.porta) {
    throw new Error('a metade de máquina subiu sem «maquina.programa» e «maquina.porta» da API 8');
  }
  return {
    servidor: String(m.servidor ?? ''),

    // O sistema desta máquina, já no nome das receitas.
    plataforma: () => String(m.plataforma ?? ''),

    baixar: ({ url, hash, tamanho, destino, aoProgresso }) => promessa(() => m.programa.baixar({
      url, [hash.algoritmo]: hash.hex, tamanho, destino, ...(aoProgresso ? { aoProgresso } : {}),
    })),

    desempacotar: ({ arquivo, destino, raiz, mesclar }) => promessa(() => m.programa.desempacotar({
      arquivo, destino, raiz, ...(mesclar ? { mesclar: true } : {}),
    })),

    // O pack que a metade de servidor guardou (parte 6): o produto o traz pelo
    // volume e só o grava com o hash do aceite.
    trazer: ({ pedido, destino }) => promessa(() => m.programa.trazer({ pedido, destino })),
    ler: arquivo => promessa(() => m.programa.ler({ arquivo })),

    rodar: ({ comando, argumentos, pasta }) => promessa(() => m.programa.rodar({ comando, argumentos, pasta }))
      .then(proc => ({
        aoLinha: fn => proc.aoLinha(linha => fn(linha)),
        // O fim do produto, na forma que a metade lê: o código, e se foi
        // morto a pedido (encerrar, ou a parada da metade).
        aoSair: fn => proc.aoSair(fim => fn({
          codigo: fim.codigo, sinal: fim.mortoAPedido ? 'morto-a-pedido' : null,
          linhasPerdidas: fim.linhasPerdidas, linhasNaoOuvidas: fim.linhasNaoOuvidas,
        })),
        escrever: texto => promessa(() => proc.escrever(texto)),
        encerrar: () => promessa(() => proc.matar()),
      })),

    servirPorta: ({ nome, protocolo, porta }) => promessa(() => m.porta.servir({ nome, protocolo, porta }))
      .then(() => ({ fechar: () => m.porta.parar(nome) })),

    escrever: (caminho, texto) => promessa(() => m.programa.escrever({ destino: caminho, texto })),

    // **A cópia do mundo** (parte 7): empacotar depois do salvamento seguro,
    // oferecer na porta do túnel da cópia, e receber na outra máquina.
    empacotar: (origem, arquivo) => promessa(() => m.programa.empacotar({ origem, arquivo })),
    oferecerCopia: (arquivo, porta) => promessa(() => m.programa.oferecerCopia({ arquivo, porta })),
    receberCopia: ({ tunel, codigo, sha256, tamanho, destino }) => promessa(() => m.programa.receberCopia({
      tunel, codigo, sha256, tamanho, destino,
    })),

    pedir: valor => promessa(() => m.pedir(valor)).then(lido),
    aoAviso: fn => m.aoAviso(carga => fn(String(m.servidor ?? ''), lido(carga))),
    aoParar: fn => m.aoParar(fn),
    // **A volta de quem hospeda**: a metade seguiu rodando sem ele e foi
    // religada sem subir de novo. Um SEELE sem o nome não religa (a metade
    // para e sobe de novo, como antes), e não há o que ouvir.
    aoReconectar: fn => (typeof m.aoReconectar === 'function' ? m.aoReconectar(fn) : undefined),
    recusas: () => promessa(() => m.programa.recusas()),

    // O relógio do executor (o mesmo `setTimeout` das outras metades).
    esperar: ms => new Promise(resolve => g.setTimeout(resolve, ms)),
    registrar: texto => g.console?.log?.(texto),
  };
}
