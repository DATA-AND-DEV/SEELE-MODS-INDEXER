// A metade de cliente: o seletor de jogos, a configuração em quatro abas
// (GERAL · MODS · JOGADORES · MÁQUINA, o desenho config-layout-v2), e o cartão
// de quem joga, com o «entrar» que abre o túnel de dentro do clique.
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { criarAnfitriao } = require('./anfitriao.cjs');
const { criarJanela, nos } = require('./janela.cjs');

const CASA_DO_ALE = [{ texto: 'Casa', cor: 'aqua' }, { texto: 'do Alê', cor: 'gold' }];

async function aberta(opcoes = {}) {
  const a = opcoes.anfitriao ?? criarAnfitriao();
  const j = criarJanela(a, opcoes);
  await j.abrir();
  assert.deepEqual(j.erros, [], 'a janela anotou erros ao abrir');
  return { a, j };
}

/** Um Minecraft criado, com versão e máquina escolhidas e aceito, ligado e com gente. */
function servidorLigado() {
  const a = criarAnfitriao();
  const id = a.acao(1, 'criar-servidor-de-jogo', { op: 'criar', receita: 'minecraft' }).servidor.id;
  a.acao(1, 'configurar-servidor-de-jogo', { op: 'configurar', id, versao: '1.21.4', quem: '2', config: { nome: CASA_DO_ALE } });
  a.aceitar(id);
  a.acao(1, 'ligar-desligar-servidor-de-jogo', { op: 'ligar', id });
  a.daMaquina(2, id, { op: 'estado', estado: 'ligado', jogadores: ['Bia', 'Ze'] });
  return { a, id };
}

test('a entrada «Multiplayer» fica na navegação do servidor', async () => {
  const { j } = await aberta();
  assert.deepEqual(j.contribuicoes.map(c => [c.ponto, c.modo, c.rotulo, c.acaoPrincipal]), [['servidor.navegacao', 'adicionar', 'Multiplayer', 'abrir-multiplayer']]);
  assert.ok(j.pagina()?.visivel, 'a página não abriu');
});

test('a configuração abre num modal, e não no lugar do chat', async () => {
  const { j } = await aberta();
  const { descricao } = j.pagina();
  assert.equal(descricao.tipo, 'dialogo');
  assert.notEqual(descricao.modal, false);
  // Abaixo de 800 px o produto o desenha como cartão no meio do véu, e não como tela.
  assert.ok(descricao.tamanho.largura < 800, `largura ${descricao.tamanho.largura}`);
  // A largura dos modais do próprio app (o aceite da máquina, 760).
  assert.equal(descricao.tamanho.largura, 760);
  // O título é do cabeçalho do modal: o seletor não o repete.
  assert.equal(j.no('titulo'), null);
});

test('o seletor mostra as receitas para criar, e diz quando quem vê não pode criar', async () => {
  const { j } = await aberta();
  assert.match(j.texto(), /CRIAR UM SERVIDOR/);
  assert.match(j.texto('receita:minecraft'), /Minecraft/);
  assert.equal(j.no('criar:minecraft').desligado, false);
  const { j: k } = await aberta({ pessoa: 3 });
  assert.equal(k.no('criar:minecraft').desligado, true);
  assert.match(k.texto('receita:minecraft'), /permissão «Criar um servidor de jogo»/);
});

test('criar abre a configuração, na aba GERAL, com Vanilla e Com mods no topo', async () => {
  const { j } = await aberta();
  await j.apertar('criar:minecraft');
  assert.deepEqual(j.acoes.map(x => x.acao), ['criar-servidor-de-jogo']);
  const abas = j.no('aba');
  assert.equal(abas.forma, 'abas');
  assert.equal(abas.valor, 'aba-geral');
  // Vanilla é sem mods: a aba MODS só existe com «Com mods» (1.0.1).
  assert.deepEqual(abas.dentro.map(x => x.rotulo), ['GERAL', 'JOGADORES', 'MÁQUINA']);
  // As duas opções grandes, lado a lado, antes de qualquer campo.
  const geral = nos(abas.dentro[0]);
  const vanilla = geral.findIndex(n => n.chave === 'variante:vanilla');
  const comMods = geral.findIndex(n => n.chave === 'variante:com-mods');
  const primeiroCampo = geral.findIndex(n => ['campo', 'numero', 'escolha', 'interruptor'].includes(n.forma));
  assert.ok(vanilla > 0 && comMods > vanilla && comMods < primeiroCampo, 'Vanilla e Com mods não estão no topo');
  assert.match(j.texto('variante:vanilla'), /Minecraft puro, sem mods/);
  // Com mods existe na parte 6: a opção liga, e diz o que o modpack define.
  assert.equal(j.no('variante:com-mods').desligado, false);
  assert.match(j.texto('variante:com-mods'), /modpack do Modrinth define a versão, o loader e os mods/);
  // O nome do servidor é o título do modal; no corpo, só o rótulo miúdo.
  assert.equal(j.texto('titulo'), 'MINECRAFT · VANILLA');
  assert.equal(j.pagina().titulo, 'Minecraft 1');
});

test('a aba GERAL monta os campos da receita, com as três regras lado a lado', async () => {
  const { j } = await aberta();
  await j.apertar('criar:minecraft');
  for (const chave of ['versao', 'cfg:nome:0:texto', 'cfg:nome:cor', 'amostra:nome:0', 'cfg:maximo', 'cfg:dificuldade', 'cfg:modo', 'cfg:pvp', 'so-seele']) {
    assert.ok(j.no(chave), `falta «${chave}» na aba GERAL`);
  }
  const grade = nos(j.pagina().arvore).find(n => n.chave === 'grupo:regras');
  assert.equal(grade.forma, 'grade');
  assert.equal(grade.estilo.colunas, 3);
  assert.deepEqual(nos(grade).filter(n => n.chave?.startsWith('cfg:')).map(n => n.chave), ['cfg:maximo', 'cfg:dificuldade', 'cfg:modo']);
  assert.equal(j.no('cfg:dificuldade').valor, 'normal');
  assert.deepEqual(j.no('cfg:modo').opcoes.map(o => o.dentro), ['Sobrevivência', 'Criativo', 'Aventura', 'Espectador']);
  // As versões vêm da Mojang, pela metade de servidor.
  assert.equal(j.no('versao').opcoes[0].valor, '26.3');
  // «Só entra quem está neste servidor SEELE» é o túnel, e vale sempre nesta versão.
  assert.equal(j.no('so-seele').valor, true);
  assert.equal(j.no('so-seele').desligado, true);
});

test('salvar manda a configuração pela ação, e a recusa volta ao campo dela', async () => {
  const { a, j } = await aberta();
  await j.apertar('criar:minecraft');
  await j.mudar('numero', 'cfg:maximo', 500);
  await j.mudar('campo', 'cfg:nome:0:texto', 'Casa do Alê');
  await j.apertar('salvar');
  const pedido = j.acoes.at(-1);
  assert.equal(pedido.acao, 'configurar-servidor-de-jogo');
  assert.equal(pedido.valor.config.maximo, 500);
  assert.equal(j.no('cfg:maximo').erro, 'Use um número de 1 a 100.');
  await j.mudar('numero', 'cfg:maximo', 6);
  await j.apertar('salvar');
  assert.equal(j.no('cfg:maximo').erro, undefined);
  const s = a.pedir(1, { op: 'estado' }).servidores[0];
  assert.equal(s.config.maximo, 6);
  assert.deepEqual(s.config.nome, [{ texto: 'Casa do Alê', cor: 'aqua' }]);
});

test('escolher a máquina na aba MÁQUINA mostra o aceite que se espera', async () => {
  const { a, j } = await aberta();
  await j.apertar('criar:minecraft');
  await j.mudar('escolha', 'versao', '1.21.4');
  await j.mudar('aba', 'aba', 'aba-maquina');
  await j.mudar('escolha', 'quem', '2');
  await j.apertar('salvar');
  assert.equal(a.pedidosDeMaquina.at(-1).quem, '2');
  assert.match(j.texto('roda-em'), /Fulano/);
  assert.match(j.texto('chip-aceite'), /ESPERANDO O ACEITE DE FULANO/);
  // O que a pessoa da máquina vai aceitar, dito também aqui.
  assert.match(j.texto('o-que-roda'), /server\.jar/);
  a.aceitar(a.pedidosDeMaquina.at(-1).servidor);
  await j.avisoDoServidor({ revisao: 99 });
  assert.match(j.texto('chip-aceite'), /ACEITO/);
});

test('a aba MODS só aparece com «Com mods», e some de novo no Vanilla', async () => {
  const { j } = await aberta();
  await j.apertar('criar:minecraft');
  const rotulos = () => j.no('aba').dentro.map(x => x.rotulo);
  assert.ok(!rotulos().includes('MODS'), `Vanilla com aba MODS: ${rotulos()}`);
  await j.apertar('variante:com-mods');
  assert.deepEqual(rotulos(), ['GERAL', 'MODS', 'JOGADORES', 'MÁQUINA']);
  // Da aba MODS de volta à GERAL, escolher o Vanilla tira a aba de novo.
  await j.mudar('aba', 'aba', 'aba-mods');
  await j.mudar('aba', 'aba', 'aba-geral');
  await j.apertar('variante:vanilla');
  assert.ok(!rotulos().includes('MODS'), `voltou ao Vanilla com aba MODS: ${rotulos()}`);
});

test('a aba MODS oferece o link do Modrinth e o arquivo .mrpack, com o teto do envio', async () => {
  const { j } = await aberta();
  await j.apertar('criar:minecraft');
  await j.apertar('variante:com-mods');
  await j.mudar('aba', 'aba', 'aba-mods');
  assert.match(j.texto('aba-mods'), /Nenhum modpack ainda/);
  assert.equal(j.no('pack:link-texto').forma, 'campo');
  const arquivo = j.no('pack:arquivo');
  assert.equal(arquivo.forma, 'arquivo');
  assert.deepEqual(arquivo.tipos, ['pack']);
  assert.match(j.texto('aba-mods'), /até 64 MiB/);
  assert.match(j.texto('aba-mods'), /cdn\.modrinth\.com/);
});

test('a aba JOGADORES mostra quem está dentro, e os campos dela', async () => {
  const { a, id } = servidorLigado();
  const { j } = await aberta({ anfitriao: a });
  await j.apertar('configurar:' + id);
  await j.mudar('aba', 'aba', 'aba-jogadores');
  assert.match(j.texto('aba-jogadores'), /2 de 10/);
  assert.match(j.texto('aba-jogadores'), /Bia/);
  assert.ok(j.no('cfg:hardcore') && j.no('cfg:protecao') && j.no('cfg:inativo'));
});

test('o cartão de quem joga diz ligado, quantos estão dentro, e o entrar abre o túnel de dentro do clique', async () => {
  const { a, id } = servidorLigado();
  const { j } = await aberta({ anfitriao: a, pessoa: 3 });
  const cartao = j.texto('cartao:' + id);
  assert.match(cartao, /LIGADO/);
  assert.match(cartao, /2 de 10 jogando/);
  assert.match(cartao, /Casa do Alê/);
  await j.apertar('entrar:' + id);
  assert.equal(j.entradas.length, 1);
  assert.ok(j.entradas[0].bilhete, 'o entrar saiu sem o bilhete do clique: depois de um await, ou fora do botão');
  assert.equal(j.entradas[0].nome, id);
  assert.match(j.texto('cartao:' + id), /localhost:25565/);
});

test('a porta trocada pelo produto é a que o cartão mostra', async () => {
  const { a, id } = servidorLigado();
  const { j } = await aberta({ anfitriao: a, pessoa: 3, portaLocal: 25570 });
  await j.apertar('entrar:' + id);
  assert.match(j.texto('cartao:' + id), /localhost:25570/);
});

test('a máquina que desliga tira o endereço do cartão e diz a parada em frase, e não pelo código', async () => {
  // O e2e da API 8 (31/10), no app de verdade: depois do DESLIGAR na máquina, o
  // cartão de quem hospeda dizia DESLIGADO, seguia mostrando localhost:25566 — a
  // porta que o SEELE já tinha fechado — e «Última falha: pelo-dono», o código cru.
  const { a, id } = servidorLigado();
  const { j } = await aberta({ anfitriao: a });
  await j.apertar('entrar:' + id);
  assert.match(j.texto('cartao:' + id), /localhost:25565/);
  a.parar(id, 'pelo-dono');
  await j.avisoDoServidor({ revisao: 999 });
  const cartao = j.texto('cartao:' + id);
  assert.match(cartao, /DESLIGADO/);
  assert.doesNotMatch(cartao, /localhost:/, 'o cartão do servidor desligado seguiu mostrando a porta que fechou');
  assert.doesNotMatch(cartao, /pelo-dono/, 'a parada apareceu pelo código cru');
  assert.match(cartao, /desligou o jogo na máquina dela/);
  assert.doesNotMatch(cartao, /disse não, ou desligou/, 'o servidor sabe que foi DESLIGAR e a tela disse «disse não, ou desligou»');
});

test('a recusa do pedido de máquina é dita como recusa, e não como «disse não, ou desligou»', async () => {
  const { a, id } = servidorLigado();
  const { j } = await aberta({ anfitriao: a });
  a.recusar(id, 'pelo-dono');
  await j.avisoDoServidor({ revisao: 999 });
  const cartao = j.texto('cartao:' + id);
  assert.match(cartao, /recusou o pedido de máquina/);
  assert.doesNotMatch(cartao, /disse não, ou desligou/);
});

test('a recusa do túnel fica no cartão, com o nome e a frase', async () => {
  const { a, id } = servidorLigado();
  const { j } = await aberta({ anfitriao: a, pessoa: 3, portaOcupada: true });
  await j.apertar('entrar:' + id);
  assert.match(j.texto('cartao:' + id), /ocupadas/);
  assert.doesNotMatch(j.texto('cartao:' + id), /porta-local-ocupada/, 'o nome cru fora dos detalhes');
  await j.apertar('detalhes:entrar:porta-local-ocupada');
  assert.match(j.texto('cartao:' + id), /porta-local-ocupada/);
});

test('um servidor desligado não oferece entrar', async () => {
  const a = criarAnfitriao();
  const id = a.acao(1, 'criar-servidor-de-jogo', { op: 'criar', receita: 'minecraft' }).servidor.id;
  const { j } = await aberta({ anfitriao: a, pessoa: 3 });
  assert.match(j.texto('cartao:' + id), /DESLIGADO/);
  assert.equal(j.no('entrar:' + id)?.desligado ?? true, true);
  assert.equal(j.no('configurar:' + id), null, 'quem só joga não configura');
});

test('ligar pede a ação, e a resposta «esperando o aceite» é dita', async () => {
  const { a, j } = await aberta();
  await j.apertar('criar:minecraft');
  await j.mudar('escolha', 'versao', '1.21.4');
  await j.mudar('aba', 'aba', 'aba-maquina');
  await j.mudar('escolha', 'quem', '2');
  await j.apertar('salvar');
  await j.mudar('aba', 'aba', 'aba-geral');
  await j.apertar('ligar');
  assert.equal(j.acoes.at(-1).acao, 'ligar-desligar-servidor-de-jogo');
  assert.match(j.texto('situacao'), /esperando o aceite/i);
  // E a frase sai quando o aceite chega: ela ficava de pé com o servidor já
  // LIGADO, e seguia lá depois da revogação (e2e da API 8, 31/10).
  const { id } = j.acoes.at(-1).valor;
  a.aceitar(id);
  a.daMaquina(2, id, { op: 'estado', estado: 'ligado', jogadores: [] });
  await j.avisoDoServidor({ revisao: 999 });
  assert.doesNotMatch(j.texto('situacao'), /esperando o aceite/i, 'a frase do aceite ficou de pé com o aceite dado');
});

test('a falha da máquina aparece na tela de quem configura, com os dados', async () => {
  const { a, id } = servidorLigado();
  a.daMaquina(2, id, { op: 'falha', etapa: 'baixar', erro: 'hash-diferente', dados: { arquivo: 'server.jar', obtido: 'ffff' } });
  const { j } = await aberta({ anfitriao: a });
  await j.apertar('configurar:' + id);
  await j.mudar('aba', 'aba', 'aba-maquina');
  assert.match(j.texto('falhas'), /O hash do arquivo baixado não bate/);
  assert.doesNotMatch(j.texto('falhas'), /hash-diferente|ffff/, 'o nome e os dados crus fora dos detalhes');
  await j.apertar('detalhes:falha:0');
  const falhas = j.texto('falhas');
  assert.match(falhas, /hash-diferente/);
  assert.match(falhas, /server\.jar/);
  assert.match(falhas, /ffff/);
});

test('a recusa de quem não tem a permissão é dita na tela, e não some', async () => {
  const { a, id } = servidorLigado();
  const { j } = await aberta({ anfitriao: a, pessoa: 3 });
  // Quem só joga não vê o botão; se a tela pedir mesmo assim, a recusa aparece.
  j.emitir({ nome: 'botao', chave: 'desligar:' + id });
  await new Promise(r => setTimeout(r, 5));
  assert.match(j.texto('aviso'), /não tem a permissão/);
  await j.apertar('detalhes:desligar:sem-permissao');
  assert.match(j.texto('aviso'), /sem-permissao/);
});

test('uma ponte caída é dita na página, com o nome', async () => {
  const j = criarJanela(criarAnfitriao(), { ponteCaida: true });
  await j.abrir();
  assert.match(j.texto('aviso'), /A sessão acabou antes da resposta/);
  await j.apertar('detalhes:estado:sessao-encerrada');
  assert.match(j.texto('aviso'), /sessao-encerrada/);
});

test('o console manda a linha pela ação de configurar', async () => {
  const { a, id } = servidorLigado();
  const { j } = await aberta({ anfitriao: a });
  await j.apertar('configurar:' + id);
  await j.mudar('aba', 'aba', 'aba-maquina');
  await j.mudar('campo', 'console:texto', 'say oi');
  await j.apertar('console:enviar');
  assert.deepEqual(j.acoes.at(-1), { acao: 'configurar-servidor-de-jogo', valor: { op: 'console', id, comando: 'say oi' } });
  assert.deepEqual(a.avisosAMaquinas.at(-1).carga, { op: 'console', comando: 'say oi' });
});

test('nenhuma montagem passa de 12 KiB, nem com oito servidores cheios de falhas', async () => {
  const a = criarAnfitriao();
  for (let n = 0; n < 8; n++) {
    const id = a.acao(1, 'criar-servidor-de-jogo', { op: 'criar', receita: 'minecraft' }).servidor.id;
    a.acao(1, 'configurar-servidor-de-jogo', { op: 'configurar', id, versao: '1.21.4', quem: '2', config: { nome: Array.from({ length: 6 }, (_, i) => ({ texto: 'É'.repeat(8), cor: ['aqua', 'gold', 'red', 'dark_green', 'light_purple', 'gray'][i] })) } });
    a.aceitar(id);
    for (let k = 0; k < 6; k++) a.daMaquina(2, id, { op: 'falha', etapa: 'baixar', erro: 'hash-diferente', dados: { arquivo: 'x'.repeat(200), url: 'https://piston-data.mojang.com/' + 'y'.repeat(300) } });
    a.daMaquina(2, id, { op: 'estado', estado: 'ligado', jogadores: Array.from({ length: 30 }, (_, i) => 'Jogador' + i), linhas: Array.from({ length: 8 }, () => 'z'.repeat(160)) });
  }
  const { j } = await aberta({ anfitriao: a });
  assert.deepEqual(j.mensagensGrandes, []);
  await j.apertar('configurar:minecraft-1');
  for (const aba of ['aba-geral', 'aba-mods', 'aba-jogadores', 'aba-maquina']) await j.mudar('aba', 'aba', aba);
  assert.deepEqual(j.mensagensGrandes, []);
  assert.deepEqual(j.erros, []);
});

test('o estilo segue o desenho 0.19: as cores do tema, o vidro, os chips e a barra de salvar', async () => {
  const { j } = await aberta();
  await j.apertar('criar:minecraft');
  const raiz = j.pagina().arvore[0];
  // Sem moldura própria (a página do produto já é o painel); o texto acompanha o tema.
  assert.equal(raiz.classe, undefined);
  assert.equal(raiz.estilo.borda, undefined);
  assert.equal(raiz.estilo.fundo, undefined);
  assert.deepEqual(raiz.estilo.cor, { tema: 'texto' });
  // O escolhido em laranja (o acento do tema), o outro em vidro, no cartão de 18.
  const vanilla = j.no('variante:vanilla');
  assert.deepEqual(vanilla.estilo.borda.cor, { tema: 'acento' });
  assert.equal(vanilla.estilo.raio, 18);
  assert.equal(j.no('variante:com-mods').estilo.borda.cor, '#ffffff12');
  // SALVAR é o primário do produto, no rodapé fixo do modal, por último.
  assert.equal(j.no('botoes').fixas, true, 'as ações saíram do rodapé fixo: SALVAR some no fim da rolagem');
  const acoes = j.no('botoes').dentro.map(b => b.chave);
  assert.equal(acoes.at(-1), 'salvar');
  assert.equal(j.no('salvar').variante, 'primaria');
  assert.equal(j.no('salvar').classe, undefined, 'o botão do produto não é pintado pelo MOD');
  // Nenhuma cor do desenho velho sobrou.
  const texto = JSON.stringify(j.pagina().arvore);
  for (const velha of ['#000000', '#EAEAEA', '#8A8A8A', '#252525', '#626262']) assert.ok(!texto.includes(velha), velha);
});

test('a página que passaria do teto monta o resumo, e diz que é resumo', async () => {
  const { a, id } = servidorLigado();
  for (let k = 0; k < 6; k++) a.daMaquina(2, id, { op: 'falha', etapa: 'baixar', erro: 'hash-diferente', dados: { url: 'https://x/' + 'y'.repeat(300) } });
  a.daMaquina(2, id, { op: 'estado', estado: 'ligado', linhas: Array.from({ length: 8 }, () => 'z'.repeat(160)) });
  const pessoas = Array.from({ length: 200 }, (_, i) => ({ id: i + 1, apelido: 'Pessoa com nome comprido ' + i, falando: false, mudo: false }));
  const { j } = await aberta({ anfitriao: a, pessoas });
  await j.apertar('configurar:' + id);
  await j.mudar('aba', 'aba', 'aba-maquina');
  assert.ok(j.mensagensGrandes.length > 0, 'o teste não chegou a passar do teto');
  assert.ok(j.no('resumo'), 'a página não disse que é resumo');
  assert.ok(j.no('falhas'), 'o resumo tirou as falhas');
  assert.deepEqual(j.erros, []);
});

// ---- o nome, uma cor por palavra (o desenho: «Casa» ciano, «do Alê» dourado) ----

test('a aba GERAL dá uma amostra de cor a cada palavra do nome, com as cores do Minecraft', async () => {
  const { a, id } = servidorLigado();
  const { j } = await aberta({ anfitriao: a });
  await j.apertar('configurar:' + id);
  assert.equal(j.no('cfg:nome:0:texto').valor, 'Casa');
  assert.equal(j.no('cfg:nome:1:texto').valor, 'do Alê');
  assert.equal(j.no('amostra:nome:0').estilo.cor, '#55FFFF');
  assert.equal(j.no('amostra:nome:1').estilo.cor, '#FFAA00');
  assert.match(j.texto('amostra:nome:0'), /Ciano/);
  assert.equal(j.no('amostra:nome:2'), null, 'uma amostra por palavra, e só');
  assert.equal(j.no('cfg:nome:cor').opcoes.length, 16, 'as 16 cores');
  assert.equal(j.texto('titulo'), 'MINECRAFT · VANILLA');
  assert.equal(j.pagina().titulo, 'Casa do Alê');
  // De volta à lista, o modal volta a se chamar Multiplayer.
  await j.apertar('voltar');
  assert.equal(j.pagina().titulo, 'Multiplayer');
});

test('escolher uma palavra mostra a cor dela; trocá-la repinta só a amostra dela, e salvar manda a lista', async () => {
  const { a, id } = servidorLigado();
  const { j } = await aberta({ anfitriao: a });
  await j.apertar('configurar:' + id);
  assert.equal(j.no('cfg:nome:cor').valor, 'aqua', 'começa na primeira palavra');
  await j.apertar('amostra:nome:1');
  assert.equal(j.no('cfg:nome:cor').valor, 'gold');
  assert.match(j.no('cfg:nome:cor').rotulo, /palavra 2/);
  await j.mudar('escolha', 'cfg:nome:cor', 'red');
  assert.equal(j.no('amostra:nome:1').estilo.cor, '#FF5555');
  assert.equal(j.no('amostra:nome:0').estilo.cor, '#55FFFF', 'a outra palavra não mudou');
  await j.mudar('campo', 'cfg:nome:0:texto', 'Lar');
  await j.apertar('salvar');
  const esperado = [{ texto: 'Lar', cor: 'aqua' }, { texto: 'do Alê', cor: 'red' }];
  assert.deepEqual(j.acoes.at(-1).valor.config.nome, esperado);
  assert.deepEqual(a.pedir(1, { op: 'estado' }).servidores[0].config.nome, esperado);
});

test('palavras entram e saem até o teto, e a última não sai', async () => {
  const { j } = await aberta();
  await j.apertar('criar:minecraft');
  assert.equal(j.no('palavra-tirar:nome').desligado, true, 'a única palavra não sai');
  for (let n = 2; n <= 6; n++) await j.apertar('palavra-mais:nome');
  assert.ok(j.no('cfg:nome:5:texto'));
  assert.equal(j.no('palavra-mais:nome').desligado, true, 'o teto é seis');
  assert.match(j.no('cfg:nome:cor').rotulo, /palavra 6/, 'a nova palavra fica escolhida');
  await j.apertar('palavra-tirar:nome');
  assert.equal(j.no('cfg:nome:5:texto'), null);
  assert.ok(j.no('cfg:nome:4:texto'));
  assert.equal(j.no('palavra-mais:nome').desligado, false);
});

test('a recusa do nome volta ao campo dele, dita com a palavra', async () => {
  const { j } = await aberta();
  await j.apertar('criar:minecraft');
  await j.mudar('campo', 'cfg:nome:0:texto', '§4vermelho');
  await j.apertar('salvar');
  assert.equal(j.texto('erro:nome'), 'A palavra 1 tem § ou uma quebra de linha, que não valem num nome.');
  await j.mudar('campo', 'cfg:nome:0:texto', 'vermelho');
  assert.equal(j.no('erro:nome'), null, 'mexer na palavra tira a recusa');
});

// ---- revisão final (31/10): fechar, descartar e o modal que não abre ----

test('o rascunho que difere do gravado suja o modal, e voltar ao gravado o limpa (M1)', async () => {
  const { j } = await aberta();
  await j.apertar('criar:minecraft');
  assert.equal(Boolean(j.pagina().suja), false, 'o modal nasceu sujo');
  const gravado = j.no('cfg:maximo').inicial;
  await j.mudar('numero', 'cfg:maximo', 7);
  assert.equal(j.pagina().suja, true, 'um campo mudado não sujou o modal');
  await j.mudar('numero', 'cfg:maximo', gravado);
  assert.equal(j.pagina().suja, false);
  // A variante é um botão: o produto não a vê como campo, e só o `suja` do MOD a conta.
  await j.apertar('variante:com-mods');
  assert.equal(j.pagina().suja, true, 'a variante mudada não sujou o modal');
});

test('DESCARTAR E FECHAR descarta o rascunho: reabrir mostra o gravado, limpo (M1)', async () => {
  const { j } = await aberta();
  await j.apertar('criar:minecraft');
  const gravado = j.no('cfg:maximo').inicial;
  await j.mudar('numero', 'cfg:maximo', 7);
  await j.apertar('variante:com-mods');
  // O produto perguntou «FECHAR SEM GRAVAR?», e a pessoa disse DESCARTAR E FECHAR.
  j.pagina().visivel = false;
  j.emitir({ nome: 'fechar', superficie: 'multiplayer', porque: 'fechar', descartou: true });
  await new Promise(r => setImmediate(r));
  await j.abrir();
  assert.equal(j.pagina().visivel, true);
  assert.equal(j.no('cfg:maximo').valor, gravado, 'o rascunho descartado voltou');
  assert.match(j.texto('titulo'), /VANILLA/, 'a variante descartada voltou');
  assert.equal(j.pagina().suja, false, 'o modal reabriu sujo');
});

test('fechar sem descartar (nada sujo) não mexe no rascunho', async () => {
  const { j } = await aberta();
  await j.apertar('criar:minecraft');
  await j.mudar('numero', 'cfg:maximo', 7);
  j.pagina().visivel = false;
  j.emitir({ nome: 'fechar', superficie: 'multiplayer', porque: 'fechar' });
  await new Promise(r => setImmediate(r));
  await j.abrir();
  assert.equal(j.no('cfg:maximo').valor, 7);
});

test('o modal que não abre é dito no aviso do produto e no log (M10)', async () => {
  const a = criarAnfitriao();
  const j = criarJanela(a, { criarFalha: 'superficies-demais' });
  await j.abrir();
  await new Promise(r => setImmediate(r));
  assert.deepEqual(j.avisos.map(x => [x.texto, x.tom]), [['O multiplayer não abriu: superficies-demais', 'erro']]);
  assert.ok(j.erros.some(e => /^error: multiplayer: o modal não abriu: superficies-demais/.test(e)), JSON.stringify(j.erros));
});
