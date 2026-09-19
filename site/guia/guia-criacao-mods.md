# Como criar MODs para o SEELE

Guia prático e referência técnica. Revisão de 18/09/2026. Manifesto schema 1, API de MOD 3. A documentação distingue funcionalidades executáveis, convenções de autoria e contratos declarados que ainda não têm uma ligação completa no runtime.

## Comece por aqui

Um MOD é um pacote de JavaScript que acrescenta comportamento ao SEELE. Ele declara uma região com texto, campos, escolhas, botões, desenho e mídia; recebe o que a pessoa faz; pede cores para a sessão; e guarda informações próprias no servidor. Não é necessário alterar o Rust para apresentar um contador, editar uma ficha, arrastar uma peça num tabuleiro ou tocar um som do próprio pacote.

Você entrega uma pasta com um manifesto e pelo menos um script. O manifesto apresenta o pacote; o script faz o trabalho. Quando o MOD tem interface e dados compartilhados, a metade de cliente declara a região e recebe o que a pessoa faz; a metade de servidor decide o que pode ser lido ou alterado.

### Escolha seu caminho

- Nunca criou um MOD? Siga os capítulos do guia, em ordem. Você terminará com um contador compartilhado instalável.
- Já conhece JavaScript? Abra Referência técnica para consultar assinaturas, tipos, limites, autorização e ciclo de vida.
- Quer publicar? Primeiro teste a pasta exata que será distribuída; depois consulte Publicação e atualizações.
- Está corrigindo um problema? Consulte Diagnóstico. Uma instalação bem-sucedida não prova que o MOD está ativo ou executando.

### O que você precisa

Um editor de texto e conhecimentos básicos de JavaScript, JSON, funções, objetos e tratamento de erros. Para a interface, use árvores de objetos com `forma` e `dentro`; HTML e CSS não fazem parte da API. Node.js é útil para verificar sintaxe e rodar testes, mas não é uma dependência exigida pelo runtime do MOD. Git é recomendado para versionar e publicar. Rust e Cargo só são necessários se você for compilar o SEELE ou usar os testes nativos de runtime.

Você não precisa contratar um backend para guardar o estado de um MOD: o servidor SEELE fornece armazenamento próprio. Integrações externas podem precisar de infraestrutura adicional, mas isso é uma escolha do seu produto.

### Três ideias fundamentais

1. O código de cliente roda num executor próprio de cada participante — um motor QuickJS do lado do aplicativo, fora da janela. Uma variável nele não é compartilhada com outras pessoas, e o que ele guardar morre com a sessão.
2. O código de servidor roda no computador de quem hospeda. É ali que ficam as regras de autorização e o estado comum.
3. A comunicação tem pedido e resposta. O resultado chega somente à pessoa que fez o pedido; os outros clientes precisam consultar novamente para enxergar alterações.

### Exemplo completo

O [contador de exemplo](exemplos/contador.zip) tem três arquivos, usa a API 3 e inclui uma região com um botão que grava no servidor. O servidor mantém revisão e autorização administrativa, exercitados pelos testes. Extraia o ZIP antes de instalar. O código é didático e não depende de Estilo, Perfis ou Mesa.

## Planeje seu MOD

Escreva uma frase dizendo o que a pessoa conseguirá fazer. Depois escolha onde cada parte precisa rodar.

| Objetivo | Cliente | Servidor |
| --- | --- | --- |
| Cor local ou painel sem estado comum | Sim | Pode ser dispensado |
| Tema escolhido pelo host para todos | Sim | Sim: persistência e autorização |
| Perfil específico de uma comunidade | Sim | Sim: identidade e dados |
| Registrar uma ocorrência de evento | Opcional | Sim |
| Consultar um serviço HTTP externo | Interface opcional | Sim, por mundo.buscar |

Um MOD somente de cliente ainda participa do mecanismo de MODs exigidos/aceitos pelo servidor. “Somente cliente” descreve o lugar onde o script executa; não é uma promessa de um sistema separado de extensões locais.

### Decisões que evitam retrabalho

Defina quem pode ler, quem pode editar, se os dados pertencem ao servidor inteiro ou a um canal, o volume esperado e o que acontece quando o MOD é desligado. Por exemplo: “Qualquer participante autorizado lê o contador; quem pode escrever no canal soma; somente administrador zera”. Essa regra poderá ser testada no servidor.

Se o recurso for privado, diga privado para quem. Uma resposta privada da ponte não torna todos os dados de um MOD privados. O handler precisa decidir quais campos devolver. O computador que hospeda continua armazenando esses dados.

Para imagens e fichas, defina limites antes de desenhar a tela. Quantos perfis? Quantos arquivos? Qual tamanho de imagem? O limite da plataforma não substitui um orçamento de produto. Um servidor pequeno não deve perder fluidez por causa de um catálogo ilimitado de banners.

### Nome e identidade

Escolha um ID durável, como `seu-autor/meu-mod`. O nome do repositório pode ser diferente, mas o ID do manifesto, o ID usado em `SeeleMods.request` e o diretório instalado precisam concordar. Mudar o ID depois da publicação cria outra identidade de pacote e pode deixar dados antigos sem um caminho de migração.

## Prepare a pasta

Crie um projeto separado, como `SEELE-MOD-MEU-MOD`, seguindo o modelo usado por MESA, ESTILO e PERFIS.

```text
meu-mod/
├── mod.json
├── cliente/
│   └── main.js
└── servidor/
    └── main.js
```

`mod.json` fica na raiz da pasta que você seleciona para instalar. Não coloque o manifesto dentro de uma segunda pasta por engano. `client` e `server` são caminhos relativos a essa raiz. Declare ao menos uma das duas metades.

### Manifesto do exemplo

```json
{
  "schema": 1,
  "id": "exemplo/contador",
  "version": "1.0.0",
  "api": 3,
  "repo": "https://github.com/DATA-AND-DEV/SEELE-MODS-INDEXER",
  "reach": ["regiao", "contador compartilhado"],
  "client": "cliente/main.js",
  "server": "servidor/main.js"
}
```

Ao criar seu próprio pacote, troque `exemplo/contador` no manifesto e no cliente, e informe seu repositório público. O endereço acima é o repositório que contém este exemplo.

### Desenvolvimento e distribuição

Seu projeto pode conter `test/`, `ferramentas/`, documentação e scripts de build. O JavaScript final continua sendo o que o SEELE executa. Um build é opcional: pode reunir fontes, mas deve ser reproduzível e deixar os arquivos finais acessíveis para avaliação.

Prepare uma pasta de distribuição limpa. Ela deve conter o manifesto, scripts e recursos de runtime que o pacote realmente usa. Não distribua `.git`, `node_modules`, caches de compilação, backups, bancos de teste ou credenciais. O conteúdo completo considerado pelo empacotamento influencia o hash; “mesma versão” não garante “mesmos bytes”.

O diretório `dados/` tem finalidade de runtime e é excluído do cálculo de conteúdo nas rotinas que o tratam como estado. Não o use para esconder scripts ou recursos da distribuição. Não presuma que toda outra pasta será ignorada automaticamente.

## Faça seu primeiro MOD

O contador tem uma região com dois botões e uma metade de servidor que explica autorização, revisão e concorrência. Apertar `SOMAR 1` escreve no servidor; `ZERAR` só funciona para quem administra, e a recusa aparece na região em vez de sumir.

### Passo 1 — baixe e examine

Baixe o [contador](exemplos/contador.zip) e leia os três arquivos. O manifesto usa `api: 3`. O cliente consulta `snapshot()` para descobrir um canal, faz `request()` e declara o resultado com `SeeleUI.regiao()`.

### Passo 2 — entenda a leitura

```js
const s = await SeeleMods.snapshot();
const canal = s.open_channel ?? s.channels?.[0]?.id;
if (canal == null) throw new Error('Entre em um canal.');
const r = await SeeleMods.request('exemplo/contador', canal, {op:'ler'});
if (!r.ok) throw new Error(r.error);
await SeeleUI.regiao([
  {forma:'titulo', dentro:'Contador'},
  {forma:'texto', dentro:`Valor: ${r.valor} · revisão ${r.revisao}`},
]);
```

O fragmento deve ficar dentro de uma função async no script de cliente. `op`, `ler`, `valor`, `revisao` e `ok` são convenções deste exemplo, não métodos da plataforma.

### Passo 3 — entenda a alteração no servidor

```json
{"op":"incrementar","revisao":0}
```

O handler confere a permissão e a revisão antes de gravar. Os testes chamam `incrementar` e `zerar` diretamente para verificar persistência, concorrência e autorização. O cliente distribuído só envia `ler`; não há um controle de incremento na região. Não substitua a falta de um botão por uma escrita automática ao carregar.

### Passo 4 — experimente

Instale num servidor de teste e observe a região Contador. Conecte outra pessoa, saia e reconecte. Confira que a região desaparece ao sair e reaparece uma vez. O ciclo de leitura aguarda a resposta antes de agendar outra consulta.

### Passo 5 — transforme a ideia

Troque o contador por dados autorizados de seu MOD. Se sua ideia exige entrada da pessoa, imagem, som ou personalização dos painéis nativos, ela depende de uma extensão escrita e versionada da API. Não prometa essas capacidades com a gramática atual.

## Instale e teste no SEELE

Instalar copia o pacote para a máquina. Ligar determina que o servidor passe a exigir aquele MOD. Aceitar autoriza um conjunto de MODs para uma conexão. São etapas diferentes.

1. Use um servidor de teste separado das conversas e dados que você quer preservar.
2. Abra Configurações → MODs → Instalar MOD de uma pasta e selecione a raiz com `mod.json`.
3. Hospede o servidor de teste e ligue o pacote.
4. Reconecte se o conjunto exigido mudar. Leia os alcances mostrados na tela.
5. Aguarde o carregamento e teste a interface. Confira o log do host se nada aparecer.
6. Instale o mesmo conteúdo em uma segunda máquina ou instância de teste e entre como participante.

A localização habitual no ambiente desktop usado durante o desenvolvimento é `~/.config/seele/mods/autor/nome/`. Prefira o instalador do aplicativo em vez de depender desse caminho em todos os sistemas. O diretório de configuração pode variar conforme a plataforma e a execução.

### Roteiro mínimo de teste manual

| Situação | Resultado que você precisa observar |
| --- | --- |
| Primeira entrada | Interface aparece uma vez, sem erro |
| Leitura | Estado correto do servidor |
| Escrita no handler, em teste | Confirmação depois da resposta |
| Segundo participante | Alteração aparece após a consulta |
| Sem permissão | Servidor recusa; estado não muda |
| Duas escritas concorrentes, em teste | Conflito explicado, sem sobrescrita silenciosa |
| Saída/desligamento | Timers, estilos e interface retirados |
| Reconexão | Estado salvo continua; interface não duplica |
| Troca de servidor | Dados e tema do anterior não vazam |
| Pacote alterado | Divergência de conteúdo tratada explicitamente |

Um simulador de API no navegador ajuda a testar a interface. Ele não prova autenticação real, consentimento, restrições do WebView, hash de conteúdo ou comportamento do servidor nativo. Registre separadamente os testes simulados e os testes no SEELE.

## Desenhe como parte do SEELE

O MOD declara conteúdo; o SEELE monta a região, escolhe tipografia, espaçamento e a apresentação acessível. Não há acesso aos seletores ou estilos da página.

### Formas disponíveis

| forma | Finalidade | Campos |
| --- | --- | --- |
| titulo | Cabeçalho do bloco | `dentro` |
| texto | Parágrafo | `dentro` |
| linha | Agrupamento | `dentro` |
| lista | Lista | `dentro` |
| item | Item da lista | `dentro` |
| campo | Caixa de texto editável | `chave`, `rotulo`, `valor` |
| escolha | Seleção entre opções declaradas | `chave`, `rotulo`, `valor`, `opcoes` |
| botao | Botão | `chave`, `dentro`, `desligado` |
| tela | Desenho e arraste | `chave`, `largura`, `altura`, `figuras`, `tracos` |
| midia | Som ou imagem | `chave`, `fonte` ou `doServidor`, `descricao`, `tocando` |

`dentro` aceita texto, outra forma ou uma lista. Números precisam ser convertidos para string. Uma forma desconhecida não produz conteúdo. A árvore tem teto de profundidade e de número de nós: prefira listas rasas. Texto nunca é interpretado como HTML.

A `chave` é o que liga uma declaração à seguinte. O SEELE reaproveita o nó que já está na tela quando a chave e a forma são as mesmas — e é isso que faz uma caixa em edição **não perder o foco** quando o MOD redesenha. Declare a região inteira a cada vez; não tente mandar só a diferença.

O SEELE **não escreve** o `valor` de um campo ou de uma escolha enquanto ele está em foco. Guarde um rascunho do que está sendo editado e declare o rascunho: se você declarar o que o servidor devolveu, a sua própria consulta periódica apaga o que a pessoa estava digitando.

### Interação

O que a pessoa faz chega por evento, e um evento **não tem resposta**: quem digita não espera o MOD confirmar que recebeu a tecla.

```js
SeeleUI.aoEvento(evento => {
  if (evento.nome === 'campo')   { /* evento.chave, evento.valor */ }
  if (evento.nome === 'escolha') { /* evento.chave, evento.valor */ }
  if (evento.nome === 'botao')   { /* evento.chave */ }
  if (evento.nome === 'traco')   { /* evento.chave, fase, x, y, alvo */ }
  if (evento.nome === 'midia')   { /* evento.chave, estado */ }
});
```

Um ouvinte só, e o último registrado vence. Um erro dentro dele fica com o seu MOD e não impede o próximo evento de chegar.

### Desenho e arraste

Uma `tela` aceita **figuras declaradas** e traços. Uma figura com `chave` pode ser pega: o evento `traco` traz `alvo` com a chave da figura mais em cima sob o dedo, ou `null` quando o toque caiu no vazio.

| tipo | Campos |
| --- | --- |
| retangulo | `x`, `y`, `largura`, `altura`, `cor`, `preenchida` |
| circulo | `x`, `y`, `raio`, `cor`, `preenchida` |
| texto | `x`, `y`, `dentro`, `corpo`, `cor` |
| linha | `x`, `y`, `ate_x`, `ate_y`, `cor` |

A **última figura declarada fica por cima**, e é a primeira que o toque encontra. Uma `linha` nunca é pega: ela é grade, parede e régua, e dar-lhe área de acerto roubaria o toque de toda figura em cima dela — declare uma peça como círculo ou retângulo.

O `alvo` é fixado quando o dedo desce e viaja nas três fases (`comecou`, `moveu`, `terminou`). As coordenadas são as da sua tela declarada, não as da janela. O movimento é agregado por quadro: um arraste não manda um evento por pixel.

### Mídia

Som e imagem vêm de **duas origens, e só duas**:

```js
{forma:'midia', chave:'toque', fonte:'som/toque.wav'}                       // do seu pacote
{forma:'midia', chave:'mapa', doServidor:{canal, pedido:{op:'asset'}, campo:'image'}}  // do seu servidor
```

Do pacote: o arquivo precisa estar em `arquivos` no manifesto. Do servidor: o SEELE faz o pedido com o `id` do seu MOD e lê o base64 no campo que você nomear. Uma resposta grande pode devolver `proximo`, um objeto que o SEELE junta ao pedido seguinte **sem interpretar** — a forma da paginação é sua.

Não existe uma terceira origem. Um endereço qualquer faria a janela de quem conversa buscar bytes na rede de um estranho, e é por isso que a API não o aceita.

O **tipo do arquivo vem dos bytes**, nunca do nome nem do manifesto: o SEELE reconhece PNG, JPEG, GIF, WebP, WAV, Ogg e MP3, e monta `<img>` ou `<audio>` conforme o que os bytes provaram ser. Declare `tocando: true` para tocar; o estado real volta pelo evento `midia`, porque o navegador pode recusar tocar sem gesto.

### Tema da sessão

```js
await SeeleUI.tema({
  acento:'#6BFFB6', fundo:'#050403', painel:'#0A0806',
  texto:'#EAE3CF', apagado:'#908574', borda:'#241F19',
  densidade:'compacta',
});
```

As seis cores aceitam somente `#rrggbb`. `densidade` aceita `compacta` ou `confortavel` — é escolha e não número, porque uma cor o produto confere e um espaçamento não: `0px` deixaria a sessão ilegível sem violar regra nenhuma.

O produto recusa nomes e cores inválidos, disputa de token com outro MOD e contraste texto/fundo abaixo de 4,5:1. Capture o Error e apresente sua mensagem. O tema é aplicado somente à sessão e sai com ela.

### O que ainda não existe, e por quê

**Família de tipo.** A escala de tipo do SEELE é medida e afirmada: tamanho, entrelinha e contraste andam juntos. Trocar a família por escolha de um MOD move os três de uma vez, sem nada que confira o resultado.

**Escolher um arquivo do disco.** Nenhum cliente do SEELE abre arquivo por conta de terceiro. Um MOD recebe bytes que já estão no servidor dele; o seletor, quando existir, será do produto.

**CSS próprio, cartões na lista de pessoas e decoração de canais.** A região é o lugar onde um MOD desenha, e continua sendo o único.

Não transforme uma interação indisponível em uma alteração automática de dados, e não escreva na tela que algo «aguarda suporte»: se a sua ideia depende de uma dessas quatro, ela ainda não cabe — proponha a extensão.

## Publique e mantenha

O caminho recomendado é um repositório público por MOD, com manifesto na raiz, código legível, instruções de teste e versão explícita. ESTILO, PERFIS e MESA são exemplos de projetos independentes.

### Antes da solicitação

- Confira se o `repo` aponta para o repositório correto e se o ID coincide em todas as partes.
- Execute sintaxe, testes e o build que produz os scripts finais.
- Teste o pacote exato, incluindo recursos estáticos e migração dos dados.
- Descreva alcances e integrações externas de forma direta.
- Fixe o commit que será avaliado e informe uma versão nova quando o conteúdo mudar.
- Explique limitações conhecidas, permissões necessárias e como desligar o recurso.

Use a seção [Publicar do catálogo](../#/publicar) para abrir a solicitação de inclusão. A avaliação do indexador é vinculada a um commit e ao conteúdo publicado. Um `git push` no repositório do autor não atualiza automaticamente o catálogo nem as instalações.

### Vereditos e confiança

Um MOD pode ser verificado, publicado com notas ou negado. Notas de integração e risco devem acompanhar o que as pessoas instalam. Publicar o código no GitHub não é o mesmo que obter verificação no catálogo.

O aplicativo confere o catálogo com uma chave de confiança distribuída com o SEELE e compara o conteúdo dos pacotes. O site humano não deve ser descrito como uma âncora independente de autenticidade quando chave, catálogo e verificador vêm da mesma origem. Consulte a documentação do indexador para as garantias de assinatura e revogação.

### Atualizações

Crie uma versão nova para conteúdo novo. Não reescreva uma versão já publicada. Atualizar o arquivo no host, atualizar o que o servidor exige e atualizar o que o participante instalou precisam resultar no mesmo hash. Uma etiqueta `1.0.0` igual nos dois lados não basta.

Planeje migrações de dados e faça backup antes de testar uma atualização sobre um mundo existente. A propriedade `state` do manifesto não executa uma migração automaticamente. Sua lógica deve reconhecer versões antigas do estado e transformá-las de maneira explícita.

Teste entrar com pacote antigo, entrar com pacote novo, atualizar durante uma sessão, reiniciar e retornar à versão anterior quando isso for suportado. Não prometa downgrade se o formato novo não puder ser lido pelo código antigo.

## Superfície implementada e compatibilidade

O indexador declara `MOD_API_VERSION = 3` e `MANIFEST_SCHEMA = 1`. A ponte de pedidos entrou com o protocolo 6. São três números diferentes: versão do manifesto, versão da API do MOD e versão do protocolo de rede. A versão do seu pacote, por exemplo `1.0.0`, é um quarto identificador.

**A superfície descrita aqui está implementada no SEELE e ainda não publicada.** O `MOD_API_VERSION` do aplicativo já é 3 e o `VERSAO_DA_API` do indexador também; o que falta é o catálogo assinado ser regerado e os pacotes saírem.

Um manifesto precisa declarar **exatamente** a API que o aplicativo oferece — não uma mais velha nem uma mais nova. Enquanto o catálogo publicado disser `api_oferecida: 2`, o aplicativo que está na mão das pessoas é o que entende a API 2, e um pacote de API 3 não instala nele. Escreva contra esta página, teste localmente, e publique quando a versão sair.

### Funções que você pode usar

| Ambiente | Superfície executável |
| --- | --- |
| Cliente | globalThis.SeeleMods.snapshot() |
| Cliente | globalThis.SeeleMods.request(id, canal, objeto) |
| Cliente | globalThis.SeeleUI.regiao(conteudo) |
| Cliente | globalThis.SeeleUI.tema(valores) |
| Cliente | globalThis.SeeleUI.aoEvento(funcao) |
| Cliente | globalThis.SeeleUI.pedaco(arquivo, inicio) |
| Cliente | globalThis.SeeleUI.soltar(arquivo) |
| Servidor | globalThis.aoPedir(contextoJSON, pedidoJSON) |
| Servidor | globalThis.aoAcontecer(momento, cargaJSON) |
| Servidor | dados: objeto de string para string |
| Servidor | arquivos.ler, escrever, listar, apagar |
| Servidor | mundo.buscar, agora, registrar |

### Contrato declarado não é uma função global

`api/v1.json` contém nomes como `mandarMensagem`, `criarSala`, `expulsarPessoa` e leituras como `servidor.pessoas`. Esses nomes mapeiam símbolos do domínio para conferência do contrato. No runtime inspecionado, eles não são instalados como métodos JavaScript chamáveis do MOD. Não escreva `mundo.mandarMensagem()` ou `servidor.criarSala()` supondo que existam.

Também há mais eventos declarados no arquivo de API do que eventos efetivamente encaminhados pelo adaptador atual. A seção Eventos lista os cinco nomes e cargas que o adaptador verificado entrega. Para outras ações, confirme uma implementação concreta ou proponha uma extensão da API; não transforme um comando interno do aplicativo em uma API pública por conveniência.

### APIs do navegador e do servidor

O servidor executa JavaScript em QuickJS, não Node.js nem uma página web. Não conte com `document`, `window`, `fetch`, `require`, módulos npm, timers ou uma fila assíncrona de browser. O arquivo do servidor é avaliado como script e o handler de pedido devolve uma string de forma síncrona.

O cliente é um script autocontido executado num **motor QuickJS do lado do aplicativo**, fora da janela, com o prelúdio da API. Não use imports de módulo no arquivo de entrada.

`document`, `window`, CSSOM, `fetch`, `localStorage`, `sessionStorage`, `indexedDB`, `caches`, `BroadcastChannel` e o global Tauri **não existem** nesse ambiente — e não existem porque um contexto de QuickJS não os tem, e não porque alguém os apagou no começo do arquivo. Promise, JSON, TextEncoder, `setTimeout`, `setInterval` e `console` continuam disponíveis.

O primeiro desenho da API 3 usava um `Worker` de `blob:`, e ele foi **reprovado por medição**: um worker de `blob:` herda a origem de quem o criou, e o que um MOD gravou em `indexedDB` sobreviveu ao encerramento do aplicativo e reapareceu na entrada seguinte. `terminate()` mata o contexto e não toca no armazenamento da origem. Se você leu isso numa versão anterior deste guia, era verdade e deixou de ser: hoje há um executor só.

O produto encerra o executor ao descarregar o MOD, e com ele os temporizadores, a região, a mídia montada e os arquivos que alguém escolheu.

Fontes desta seção: [Contrato histórico da ponte API 2](https://github.com/DATA-AND-DEV/SEELE/blob/fbcb09786c29219a18e20289381aa7d0e0ae13ac/api/v2.json), [runtime](https://github.com/DATA-AND-DEV/SEELE/blob/fbcb09786c29219a18e20289381aa7d0e0ae13ac/crates/seele-server/src/mods/mod.rs) e [ponte da janela](https://github.com/DATA-AND-DEV/SEELE/blob/fbcb09786c29219a18e20289381aa7d0e0ae13ac/apps/seele-app/ui/base.js).

## Manifesto e limites de anúncio

O manifesto é JSON estrito. Chaves desconhecidas são recusadas. Comentários, vírgula final e aspas simples não são JSON válido. Declare números como números, caminhos como strings e `reach` como uma lista de strings.

| Campo | Tipo | Regra |
| --- | --- | --- |
| schema | número inteiro | Use 1 nesta revisão |
| id | string | autor/nome; minúsculas ASCII, dígitos e hífen; uma barra |
| version | string | Versão do autor; o core não a interpreta como SemVer |
| api | número inteiro | Use 3, inclusive em MODs somente de servidor |
| repo | string | Repositório público do pacote |
| reach | string[] | Opcional no parser; declare alcances úteis para quem aceita |
| state | inteiro ou ausente | Versão declarativa dos seus dados; sem migração automática |
| client | string ou ausente | Script de cliente relativo à raiz |
| server | string ou ausente | Script de servidor relativo à raiz |

Ao menos `client` ou `server` precisa existir. Uma API mais nova é recusada como `api-too-new`; uma anterior à 3 é recusada como `api-too-old`, antes de executar código. Não existe compatibilidade com cliente de API 2. O ID da pasta instalada deve concordar com o manifesto. A pasta de desenvolvimento selecionada pode ter um nome amigável; a identidade instalada é `autor/nome`.

### Limites no anúncio do protocolo

| Campo | Limite |
| --- | --- |
| MODs no conjunto anunciado | 12 |
| id | 96 bytes UTF-8 |
| version | 32 bytes UTF-8 |
| repo | 256 bytes UTF-8 |
| reach: quantidade | 16 itens |
| reach: cada item | 32 bytes UTF-8 |

Esses limites são do anúncio, não apenas do parser de JSON. Um manifesto pode passar por uma etapa de leitura e falhar ao ser anunciado. Os alcances de ESTILO/PERFIS já expuseram essa diferença durante testes: uma descrição longa impediu a entrada no servidor até ser corrigida.

```js
const bytes = texto => new TextEncoder().encode(texto).length;
for (const alcance of manifesto.reach ?? []) {
  if (bytes(alcance) > 32) throw new Error('Alcance acima de 32 bytes');
}
```

Caracteres acentuados e emoji podem ocupar mais de um byte. Não use `texto.length` como medida de UTF-8. No Node, `Buffer.byteLength(texto, 'utf8')` serve para a mesma validação.

`reach` informa o que o pacote declara alcançar; não é uma lista de permissões que transforma código inseguro em sandbox. Declare a realidade, incluindo integrações externas. Não acrescente campos inventados como `permissions`, `author` ou `description` sem uma mudança oficial do schema.

Fontes: [manifesto](https://github.com/DATA-AND-DEV/SEELE/blob/fbcb09786c29219a18e20289381aa7d0e0ae13ac/crates/seele-proto/src/mods.rs), [limites do controle](https://github.com/DATA-AND-DEV/SEELE/blob/fbcb09786c29219a18e20289381aa7d0e0ae13ac/crates/seele-proto/src/control.rs).

## Pedidos e respostas

### Assinatura no cliente

```js
const resposta = await globalThis.SeeleMods.request(
  'exemplo/contador',
  canal,
  {op: 'ler'}
);
```

| Argumento | Tipo | Origem |
| --- | --- | --- |
| id | string | ID do MOD ativo no servidor |
| canal | número | ID de um canal existente, obtido do snapshot |
| objeto | valor serializável em JSON | Protocolo definido pelo MOD |
| retorno | Promise de valor JSON | Resposta remontada e desserializada pela janela |

Use IDs reais do snapshot. Não fixe `1` supondo que todo servidor tenha o mesmo canal. `undefined`, funções, referências circulares e BigInt não são uma forma adequada de transportar dados JSON.

### Assinatura no servidor

```js
globalThis.aoPedir = (contextoJSON, pedidoJSON) => {
  const contexto = JSON.parse(contextoJSON);
  const pedido = JSON.parse(pedidoJSON);
  return JSON.stringify({ok: true, pessoa: contexto.person});
};
```

Retorne uma string contendo JSON válido. Não retorne um objeto cru, `undefined` ou uma Promise. Declarar `async` muda o retorno para Promise e não atende a assinatura síncrona esperada. O runtime limita o tamanho da string; a janela tenta desserializá-la.

### O envelope é uma convenção

`{ok:true,...}` e `{ok:false,error:'codigo'}` são convenções recomendadas e usadas nos exemplos. A ponte também devolve `bridge-refused` nesse formato para recusas internas. Seus códigos como `sem-permissao`, `conflito` ou `formato-invalido` pertencem ao seu MOD e precisam de mensagens adequadas na interface.

```js
try {
  const r = await SeeleMods.request(id, canal, {op:'ler'});
  if (!r.ok) {
    mostrarErro(traduzirCodigo(r.error));
    return;
  }
  renderizar(r);
} catch (erro) {
  mostrarErro('Não foi possível concluir o pedido.');
}
```

`mostrarErro`, `traduzirCodigo` e `renderizar` são funções do seu cliente, não funções da API SEELE.

### Percurso de uma chamada

A janela serializa o corpo, atribui um identificador ao pedido e envia pela conexão de controle autenticada. O host confere acesso de leitura, MOD ativo, canal e conteúdo do pacote. Ele cria o contexto, executa o handler limitado, grava `dados` quando houver mudança e devolve a resposta à conexão que perguntou. A janela remonta os fragmentos e resolve a Promise.

O pedido especial com ID vazio é usado pelo carregador para consultar o conjunto ativo. Considere-o infraestrutura do produto, não o namespace do seu MOD. Não utilize um ID vazio para guardar dados ou contornar a exigência de pacote ativo.

A resposta não aparece no chat, no histórico ou como transmissão. Ela não é enviada aos demais participantes. Não existe `broadcast()` público nesta ponte. Use consultas periódicas ou proponha uma extensão de API quando seu produto precisar de outro modelo.

Fonte: [execução autenticada e fragmentação](https://github.com/DATA-AND-DEV/SEELE/blob/fbcb09786c29219a18e20289381aa7d0e0ae13ac/crates/seele-server/src/mods/pedidos.rs).

## Leitura, snapshot e sincronização

### snapshot()

`await SeeleMods.snapshot()` consulta o estado que o aplicativo expõe. É útil para descobrir a pessoa atual, os canais e as pessoas presentes. Trate a estrutura como a superfície do build que você suporta, não como uma promessa de que toda propriedade interna estará congelada para sempre.

```js
const s = await SeeleMods.snapshot();
const eu = s.me == null ? null : String(s.me);
const canal = s.open_channel ?? s.channels?.[0]?.id;
const presentes = s.presentes ?? [];
if (eu === null || canal == null) {
  // Ainda não há contexto suficiente para pedir ao MOD.
}
```

| Campo usado pelos exemplos | Uso |
| --- | --- |
| me | Identidade atual, quando conhecida |
| channels | Canais; cada item tem id e name |
| open_channel | Canal aberto, quando exposto; use fallback para channels |
| presentes | Pessoas conectadas; id e nickname |

O contexto autenticado de `aoPedir` continua sendo a autoridade para uma alteração. Não envie `s.me` no corpo e aceite esse valor como prova de autoria no host. O host já sabe quem é a conexão.

### Consulta periódica

Use um único ciclo de consulta, sem sobrepor requests se o servidor estiver lento. Quatro segundos é uma escolha dos exemplos Estilo/Perfis, não um limite nem uma garantia do protocolo. Intervalos menores aumentam tráfego, execução de JavaScript e contenção do banco.

```js
let emConsulta = false;
async function consultar() {
  if (emConsulta) return;
  emConsulta = true;
  try {
    const r = await SeeleMods.request(id, canal, {op:'ler'});
    if (r.ok && r.revisao !== revisaoExibida) await desenhar(r);
  } finally {
    emConsulta = false;
  }
}
```

Adapte o tratamento de erro antes de usar esse fragmento. Uma chamada disparada por timer precisa capturar rejeições. O desenho atual é de leitura. Declare o resultado autorizado e evite apresentar uma resposta de canal antigo após a navegação.

### Paginação e visibilidade

Não devolva todas as imagens de todos os membros em cada consulta. Separe metadados de recursos, consulte listas em lotes, carregue mídia necessária e use revisão como chave de cache. O limite de 32 pessoas por lote em Perfis é uma regra daquele MOD, não da ponte SEELE.

Se um painel não estiver visível, reduza trabalho desnecessário. Ao trocar de servidor, invalide caches ou inclua o servidor/escopo na chave. Um perfil salvo no servidor A não deve aparecer como se fosse do servidor B.

## Escrita, autorização e concorrência

O contexto chega como JSON escrito pelo servidor. `person` é serializado como string; `channel` é número; `admin` e `write` são booleanos calculados das permissões atuais.

```json
{"person":"42","channel":7,"admin":false,"write":true}
```

| Campo | Significado |
| --- | --- |
| person | Identidade autenticada da conexão |
| channel | Canal do pedido, conferido como existente |
| admin | Permissão AdministerServer no momento do pedido |
| write | Permissão WriteChannel no momento do pedido |

Antes da execução, a ponte exige ReadChannel. Ela informa `write` e `admin`; isso não substitui a política do MOD. Um handler que modifica dados sem checar as permissões apropriadas poderá permitir a alteração. Não há um campo `host` neste contexto. Se a sua política diz “somente host”, `admin` autoriza administradores e precisa ser descrito assim.

### Padrão de alteração segura

1. Faça parse e valide a forma do pedido.
2. Reconheça uma operação conhecida.
3. Confira permissões com o contexto, nunca com campos do corpo.
4. Confira propriedade do recurso usando `contexto.person`.
5. Valide tamanho, tipo, faixa e revisão.
6. Calcule o próximo estado sem efeitos externos.
7. Grave em `dados` e retorne a revisão resultante.

```js
if (!ctx.write) return JSON.stringify({ok:false,error:'sem-permissao'});
const dono = ctx.person;
const chave = 'perfil:' + dono;
const atual = JSON.parse(dados[chave] || '{"revisao":0}');
if (pedido.revisao !== atual.revisao) {
  return JSON.stringify({ok:false,error:'conflito',revisao:atual.revisao});
}
```

Este fragmento demonstra autorização e revisão, mas ainda precisa validar os campos específicos do perfil. Uma propriedade `person` no corpo deve ser ignorada para autoria ou conferida contra o contexto quando fizer parte de uma seleção explícita.

### Revisão otimista

Devolva `revisao` nas leituras. O editor envia a revisão sobre a qual trabalhou. O servidor recusa se ela mudou e incrementa ao salvar. Assim, dois editores não apagam silenciosamente o trabalho um do outro. Uma serialização no banco ordena as chamadas, mas sozinha não detecta que uma interface estava editando um estado antigo.

### Timeout e idempotência

Timeout significa que a janela não obteve a conclusão a tempo. Não significa que a alteração foi desfeita. Para ações que não podem se repetir, envie uma chave de operação e grave um recibo junto ao estado; uma repetição da mesma chave devolve o recibo. Delimite a retenção desses recibos para caber no KV e documente a janela de deduplicação.

Uma resposta `{ok:false}` é uma resposta normal, não uma exceção. Se você já modificou `dados` antes de devolvê-la, essas mudanças podem ser gravadas. Valide antes de alterar. Lançar uma exceção evita a coleta de `dados`, mas não reverte rede ou arquivos que já foram escritos.

## Persistência e migrações

`dados` é um objeto de chaves e valores textuais fornecido ao handler. O estado pertence ao MOD no banco do servidor. O runtime carrega esse estado para uma nova execução de pedido e o grava depois de uma conclusão bem-sucedida, quando há mudança.

```js
const config = JSON.parse(dados.config || '{"schema":1,"revisao":0}');
config.revisao += 1;
dados.config = JSON.stringify(config);
```

### Regras de armazenamento

- Use strings nos valores. Para objetos e arrays, use `JSON.stringify` e `JSON.parse`.
- Leia `dados` dentro dos handlers. A inicialização do script acontece antes de o quintal da chamada ser injetado.
- Não dependa de variáveis globais como memória persistente de pedidos. O runtime de `aoPedir` nasce a cada requisição.
- O teto é 256 KiB somando chaves e valores. Ele não é um limite separado por campo.
- Uma falha de execução ou coleta não deve produzir meia atualização do KV. A gravação no banco só ocorre depois do retorno bem-sucedido.
- Não confunda atomicidade de `dados` com transação de arquivos ou rede.

### Servidor inteiro ou canal

O armazenamento é por MOD e servidor. Se você quer uma ficha por canal, precisa codificar esse escopo nas chaves ou em seu objeto. Uma chave como `config` será compartilhada entre pedidos do mesmo MOD em canais diferentes naquele servidor.

```js
const chave = 'canal:' + ctx.channel;
const ficha = JSON.parse(dados[chave] || '{"schema":1,"revisao":0}');
```

A chave de uma pessoa pode usar `ctx.person`, ou uma combinação com `ctx.channel` se o recurso tiver escopo de canal. Valide qualquer parte de chave que venha do usuário e limite a quantidade total de registros para evitar crescimento ilimitado.

### Migração explícita

Guarde uma versão no próprio estado. A propriedade `state` do manifesto é declarativa nesta implementação: não há uma função de migração chamada automaticamente pelo SEELE.

```js
function migrar(estado) {
  if (estado.schema === 1) {
    return {...estado, schema:2, titulo:estado.titulo ?? 'Sem título'};
  }
  if (estado.schema === 2) return estado;
  throw new Error('Versão de dados não suportada');
}
```

Esse exemplo só transforma memória. Antes de persistir, valide invariantes, orçamento do KV e compatibilidade com o restante do handler. Teste duas execuções consecutivas da migração: a segunda não deve acrescentar dados outra vez. Não converta um formato desconhecido em estado vazio, pois isso pode apagar silenciosamente conteúdo de uma versão futura.

### Eventos e pedidos no mesmo MOD

Pedidos usam um runtime novo. O caminho de eventos mantém o hospedeiro carregado e entrega o quintal a cada chamada. Há coordenação de persistência no produto, mas evite que os dois caminhos regravem objetos grandes com base em cópias antigas. Prefira uma responsabilidade clara para cada tipo de alteração e teste concorrência entre um evento e um pedido.

Fonte: [runtime e coleta](https://github.com/DATA-AND-DEV/SEELE/blob/fbcb09786c29219a18e20289381aa7d0e0ae13ac/crates/seele-server/src/mods/mod.rs), [persistência dos pedidos](https://github.com/DATA-AND-DEV/SEELE/blob/fbcb09786c29219a18e20289381aa7d0e0ae13ac/crates/seele-server/src/mods/pedidos.rs).

## Arquivos: ler, escrever, listar e apagar

As operações de arquivo existem somente no runtime do servidor e trabalham com texto. Os caminhos são relativos à pasta de dados do MOD. Não há um objeto File de navegador nesse ambiente.

| Operação | Assinatura | Retorno |
| --- | --- | --- |
| Ler | arquivos.ler(caminho) | string ou null |
| Escrever | arquivos.escrever(caminho, conteudo) | boolean |
| Listar | arquivos.listar() | lista de caminhos |
| Apagar | arquivos.apagar(caminho) | boolean |

```js
const caminho = 'fichas/pessoa-' + ctx.person + '.json';
const conteudo = JSON.stringify({titulo:'Explorador',nivel:1});
if (!arquivos.escrever(caminho, conteudo)) {
  return JSON.stringify({ok:false,error:'arquivo-nao-gravado'});
}
const salvo = arquivos.ler(caminho);
```

Não trate `false` como sucesso. `null` na leitura pode indicar ausência ou recusa; apresente uma falha útil e não invente uma causa detalhada que a API não forneceu. `listar()` não recebe um diretório como argumento na assinatura atual.

### Escopo e caminhos

A raiz é a pasta `dados/` do MOD instalado, normalmente dentro de `mods/autor/nome/dados/`. Caminhos absolutos e componentes de travessia como `..` são recusados. Não construa um nome de arquivo a partir de uma URL ou nome de exibição sem validação. Um identificador interno gerado pelo servidor é uma escolha melhor.

O teto é 4 MiB por arquivo. Isso não implica um teto agregado de disco para todo o MOD. Defina cotas, quantidade máxima de arquivos e política de retenção no seu código.

O armazenamento de arquivos usa a pasta instalada. Se várias instâncias de servidor compartilham a mesma instalação, não presuma isolamento de arquivos idêntico ao isolamento de `dados` no banco. Use nomes únicos e referências guardadas no estado de cada servidor, ou diretórios de instalação separados para ambientes independentes.

### Arquivos não participam do rollback do KV

`arquivos.escrever` e `arquivos.apagar` são efeitos imediatos no disco. Se o handler lançar depois, a gravação de `dados` não ocorrerá, mas o arquivo pode já ter sido escrito ou removido. A rede também não é revertida.

Para substituir um recurso, uma estratégia é escrever em um caminho novo, verificar sucesso, atualizar a referência no KV e guardar o caminho antigo numa fila de limpeza. Remova o antigo numa chamada posterior à confirmação dos metadados. Se houver falha entre etapas, prefira um arquivo órfão recuperável a uma referência apontando para um arquivo apagado.

O par “arquivo novo + referência no banco” não é uma transação distribuída automática. Documente seu procedimento de recuperação e teste falha de disco, falha de KV e repetição de um fragmento.

Fonte: [operações de arquivos](https://github.com/DATA-AND-DEV/SEELE/blob/fbcb09786c29219a18e20289381aa7d0e0ae13ac/crates/seele-server/src/mods/arquivos.rs).

## Uploads, imagens e respostas grandes

A ponte recebe JSON, não multipart nem fluxo binário. Um MOD pode definir seu próprio protocolo de upload em fragmentos, mas esse protocolo precisa ser implementado e autorizado no handler. Nomes como `upload-start` e `upload-part` são convenções de Perfis, não comandos nativos SEELE.

### Por que fragmentar

O pedido tem teto de 12 KiB. Base64 ocupa aproximadamente quatro bytes para cada três bytes binários, além do prefixo e do envelope JSON. Uma imagem que parece pequena no Finder pode não caber num pedido.

A resposta tem teto de 1 MiB e é dividida pelo SEELE em partes de até 10 KiB, respeitando fronteiras UTF-8. Isso é fragmentação do transporte da resposta. Não significa que o SEELE vai fragmentar automaticamente seu pedido de upload.

### Protocolo recomendado

| Etapa | Dados | Regra no servidor |
| --- | --- | --- |
| Iniciar | slot/tipo, comprimento total | Autorizar, limitar tamanho e reservar token |
| Enviar parte | token, índice, conteúdo | Conferir dono, ordem, prazo e orçamento |
| Finalizar | Última parte ou operação explícita | Conferir tamanho e formato, publicar referência |
| Consultar | Identidade/recurso | Conferir leitura e devolver conteúdo autorizado |
| Remover | Recurso e revisão | Autorizar dono, atualizar metadados, limpar depois |

O token precisa estar associado ao `ctx.person`, ao destino e a uma expiração. O servidor deve rejeitar fragmentos de outra pessoa, índices inesperados, excesso de tamanho e conclusão incompleta. Defina se uma retransmissão do mesmo fragmento é aceita de forma idempotente ou exige reiniciar; não deixe esse comportamento implícito.

Armazene a referência pública apenas quando o conteúdo estiver completo e validado. Um upload interrompido não deve substituir o banner anterior por dados parciais. Limpe temporários vencidos com orçamento de trabalho controlado.

### Validação de mídia

Esta seção descreve protocolos e dados de servidor. O seletor de arquivos **existe** e é do produto: a forma `arquivo` desenha um botão, a pessoa escolhe, e seu MOD recebe um identificador com o tipo que os **bytes** provaram ser e o tamanho — nunca um caminho. Leia com `SeeleUI.pedaco(arquivo, inicio)` e mande ao seu servidor pelo protocolo que você definir; devolva com `SeeleUI.soltar(arquivo)` quando terminar.

No servidor, valide envelope, limites e assinatura dos bytes; não confie no MIME informado por quem envia. O produto já reconheceu o tipo pelos bytes antes de lhe entregar o identificador, e conferir de novo do seu lado continua sendo certo — o produto protege a janela, não o seu formato.

O servidor de PERFIS mantém uploads de até 10 MiB por avatar/banner em fragmentos próprios. O cliente da API 3 não oferece upload nem validação de dimensões; os arquivos anteriores permanecem armazenados. Para uma garantia forte de dimensões/conteúdo no servidor, é necessária uma validação adequada naquele lado.

Não interprete SVG ou HTML enviado por participante como conteúdo confiável. Não há forma `img` ou renderização de data URI na API 3. Não tente passar marcação como texto para reproduzir essas capacidades. Uma resposta do seu servidor ainda pode conter dados originados de outra pessoa.

### Memória e desempenho

Um limite de 4 MiB no arquivo não garante que um fluxo com várias cópias de base64 e JSON caiba em 8 MiB de runtime. Somam-se fonte, objetos, estado, strings de entrada, buffers e resultado. Teste o pior caso no QuickJS real, não só no Node.

Use somente metadados leves na região. Não baixe imagens que a API não pode exibir. A lista de pessoas e seus controles pertencem ao produto.

## Eventos e aoAcontecer

`globalThis.aoAcontecer(momento, cargaJSON)` recebe um nome e uma string JSON. Faça parse dentro do handler. Não existe um objeto genérico de browser Event nessa assinatura.

```js
globalThis.aoAcontecer = (momento, cargaJSON) => {
  if (momento !== 'MessageReceived') return;
  const evento = JSON.parse(cargaJSON);
  if (!evento.texto.startsWith('$contar')) return;
  const total = Number(dados.mensagensContadas || '0');
  dados.mensagensContadas = String(total + 1);
  mundo.registrar('Mensagem contabilizada');
};
```

O exemplo conta e registra; ele não envia uma mensagem de resposta ao chat. Não há uma função `mandarMensagem` instalada no runtime inspecionado para completar essa segunda parte.

### Eventos encaminhados pelo adaptador verificado

| momento | Campos da carga JSON |
| --- | --- |
| PersonJoined | sala, pessoa, apelido |
| PersonLeft | sala, pessoa |
| MessageReceived | canal, mensagem, autor, texto |
| MessageEdited | canal, mensagem, texto |
| MessageRemoved | canal, mensagem |

`PersonJoined` e `PersonLeft` incluem contexto de sala de voz no adaptador. Não transforme esses nomes em uma regra universal de cadastro/remoção permanente de pessoa. Para pessoas conectadas na interface, consulte `snapshot.presentes`.

`MessageEdited` não inclui autor nessa carga. `MessageRemoved` não inclui o texto anterior. Se seu MOD precisa de informação que não está no evento, precisa ter uma estratégia compatível com o que realmente recebe; não leia campos inventados.

### Nomes declarados, ainda sem encaminhamento nesse adaptador

O arquivo v1 também lista `PersonPresent`, `PersonGone`, `PersonRenamed`, `PersonIconChanged`, `VoiceRoomCreated`, `VoiceRoomRenamed`, `VoiceRoomDeleted`, `MovedToVoiceRoom`, `ChannelCreated`, `ChannelRenamed`, `ChannelDeleted`, `ChannelWeighed`, `ScreenShareStarted`, `ScreenShareStopped`, `ServerRenamed` e `ServerIconChanged`. A existência na lista não demonstra que o seu handler será chamado. Confira o adaptador do build alvo antes de depender de um deles.

### Falhas de evento

O despachante executa eventos em sequência. Uma chamada lenta pode atrasar o processamento dos eventos dos MODs seguintes. Falhas do handler podem desligar o MOD, e o desligamento é persistido. Não use exceção como retorno normal para uma situação esperada, como uma mensagem que não corresponde a um comando.

Um MOD sem `aoAcontecer` é válido quando sua metade de servidor usa apenas `aoPedir`. O inverso também pode ser válido, mas tentar fazer um request a um servidor sem `aoPedir` não cria o handler automaticamente.

Fonte: [momento_de e despacho](https://github.com/DATA-AND-DEV/SEELE/blob/fbcb09786c29219a18e20289381aa7d0e0ae13ac/crates/seele-server/src/mods/despacho.rs).

## Rede, relógio e registro

### mundo.buscar(url)

```js
const texto = mundo.buscar('https://servico.example/dados.json');
if (texto === null) {
  return JSON.stringify({ok:false,error:'servico-indisponivel'});
}
const dadosExternos = JSON.parse(texto);
```

O endereço `.example` é ilustrativo e não é um serviço real. Use um endpoint controlado/conhecido no seu teste. Faça tratamento de JSON inválido e valide a resposta antes de persistir ou renderizar.

A função faz GET síncrono a uma URL HTTP/HTTPS e retorna texto ou `null`. Não recebe opções de método, cabeçalhos, corpo ou token. Não invente um segundo argumento como se fosse `fetch`. O timeout da requisição nativa é 2 segundos; o limite de corpo aceito é 4 MiB.

O retorno não fornece status HTTP nem cabeçalhos. Não assuma que uma string representa HTTP 200: valide o conteúdo esperado. A implementação lê o corpo como texto e confere seu tamanho; isso não é uma promessa de leitura em streaming com limite prévio de alocação.

A busca acontece a partir da máquina do host. Não permita que qualquer participante informe uma URL arbitrária: ele poderia tentar alcançar serviços internos da rede de quem hospeda. Fixe ou restrinja os destinos de acordo com a finalidade do MOD. A restrição a HTTP/HTTPS não equivale a uma proteção completa contra acesso a endereços internos.

Não inclua segredos em parâmetros de URL, logs, exemplos ou pacotes. A API atual não oferece um cofre de credenciais por MOD. Se sua integração precisa de autenticação com configuração privada, trate esse requisito como uma decisão de arquitetura a resolver, não como um campo inventado no manifesto.

### mundo.agora()

Retorna segundos desde a época Unix, conforme o relógio do host. É útil para expiração de upload ou retenção. Não confunda segundos com milissegundos de `Date.now()`. O relógio pode avançar ou recuar; não o use como único mecanismo de ordenação de revisões.

### mundo.registrar(texto)

Registra uma linha com o ID do MOD no log do host. A implementação recorta a mensagem em até 500 caracteres. Use registros curtos e úteis: operação, erro e identificador interno não sensível. Evite despejar mensagens privadas, conteúdo de arquivos, base64, credenciais ou corpo completo de requisições.

### Rede no cliente

O executor não é um contexto de navegador: não há CSP para herdar e não há `fetch` para chamar. Faça integrações externas pelo lado de servidor, dentro dos limites reais. Um simulador web que você use para desenvolver **não** é o ambiente final — ele tem APIs que o executor não tem, e um MOD que depende de uma delas passa lá e falha aqui.

Fonte: [mundo.rs](https://github.com/DATA-AND-DEV/SEELE/blob/fbcb09786c29219a18e20289381aa7d0e0ae13ac/crates/seele-server/src/mods/mundo.rs), [CSP do app](https://github.com/DATA-AND-DEV/SEELE/blob/fbcb09786c29219a18e20289381aa7d0e0ae13ac/apps/seele-app/tauri.conf.json).

## Executor, região, tema e ciclo de vida

A API 3 substitui o código dentro da janela por um executor próprio. As funções assíncronas são `SeeleMods.snapshot()`, `SeeleMods.request(id, canal, valor)`, `SeeleUI.regiao(conteudo)`, `SeeleUI.tema(valores)`, `SeeleUI.pedaco(arquivo, inicio)` e `SeeleUI.soltar(arquivo)`. `SeeleUI.aoEvento(funcao)` é síncrona e registra um ouvinte. As falhas rejeitam a Promise com Error.

### Declarar a região

```js
await SeeleUI.regiao({
  forma: 'linha',
  dentro: [
    {forma:'titulo', dentro:'FICHA'},
    {forma:'texto', dentro:`pontos: ${pontos}`},
    {forma:'lista', dentro:nomes.map(nome => ({forma:'item', dentro:nome}))},
  ],
});
```

Uma nova chamada substitui toda a região do MOD. Os nomes aceitos são `titulo`, `texto`, `linha`, `lista` e `item`. Uma forma desconhecida não vira um agrupamento. O renderer corta nós além de oito níveis de recursão; listas também contam nessa profundidade. Prefira árvores rasas. Não há HTML, atributos arbitrários, eventos de clique, formulários ou mídia.

### Tema da sessão

```js
await SeeleUI.tema({acento:'#6BFFB6', fundo:'#050403', texto:'#EAE3CF', borda:'#241F19'});
```

A chamada substitui o pedido de tema deste MOD. `await SeeleUI.tema({})` retira os tokens pedidos por ele; não escreva cores padrão por cima da escolha pessoal. A saída da sessão também remove a camada automaticamente.

O produto valida nomes, valores `#rrggbb`, posse dos tokens por outro MOD e contraste texto/fundo mínimo de 4,5:1. Uma recusa não confirma o tema solicitado: só registre a aplicação depois de a Promise resolver. Mostre a mensagem do Error sem afirmar que o tema foi salvo ou aplicado.

### O que o executor não tem

Não existem `document`, `window`, `getComputedStyle`, `CSSStyleSheet`, `document.adoptedStyleSheets`, observação do DOM da página, `localStorage`, `sessionStorage` ou o global do Tauri. `fetch` existe, mas herda a CSP do produto; faça integrações de rede no servidor com `mundo.buscar`.

### Descarregamento

O produto para o executor e retira a região, o tema, a mídia montada e os arquivos escolhidos. Não existe mais o evento `seele-mod-unload`. Apague listeners de unload, limpeza de nós, folhas e observadores e restauração de estilos. Temporizadores e promessas do executor não sobrevivem à saída da sessão, e você não precisa registrar nada para que isso aconteça.

### Migrar da API 2

1. Declare `api: 3` no manifesto, inclusive em MODs somente de servidor.
2. Preserve handlers, autorização, persistência e dados do servidor.
3. Converta o desenho em árvores de `SeeleUI.regiao`.
4. Converta somente os quatro tokens de cor para `SeeleUI.tema`.
5. Retire seletores, CSS, listeners de unload e controles sem equivalente.
6. Documente a indisponibilidade de edição, decoração nativa e mídia.
7. Teste o pacote exato no SEELE, incluindo saída e reconexão.

`api-too-old` recusa pacotes antigos antes de executá-los. Não existe um modo de compatibilidade. Ampliar a apresentação de pessoas, canais ou eventos de entrada exige uma decisão e uma extensão da API.

## Todos os limites em um lugar

Valores verificados no código da revisão, separados de decisões dos MODs de exemplo.

| Recurso | Limite ou comportamento | Responsável |
| --- | --- | --- |
| Pedido JSON | 12 KiB UTF-8 | Janela e protocolo |
| Pedidos pendentes | 8 na ponte compartilhada da janela | Cliente SEELE |
| Espera de resposta | 15 segundos | Cliente SEELE |
| Resposta do handler | 1 MiB | Runtime |
| Fragmento de resposta | até 10 KiB UTF-8 | Host |
| KV dados | 256 KiB, chaves + valores | Runtime/persistência |
| Arquivo próprio | 4 MiB por arquivo | arquivos |
| Resposta mundo.buscar | 4 MiB de texto aceito | mundo |
| Timeout mundo.buscar | 2 segundos por busca | Cliente HTTP nativo |
| Mensagem de log | até 500 caracteres | mundo.registrar |
| Memória JS | 8 MiB por runtime de MOD | QuickJS |
| Orçamento de execução | 500 consultas de interrupção | QuickJS |
| Conjunto anunciado | até 12 MODs | Protocolo |
| Alcances | até 16 itens, 32 bytes cada | Protocolo |

As 500 consultas são um orçamento de trabalho do interpretador; a documentação do runtime apresenta uma aproximação de cerca de 225 ms no ambiente de referência. Isso não é um timeout garantido de 225 ms em todas as máquinas. Chamadas nativas de rede têm seu próprio limite porque não são interrompidas pelo mesmo contador de instruções.

O prelúdio admite até oito mensagens pendentes por executor; os pedidos ao servidor também passam pelo mapa compartilhado de oito pedidos da ponte da janela. Se vários pacotes consultam ao mesmo tempo, todos disputam esse limite. Use concorrência pequena e consultas sem sobreposição.

O limite de tamanho de arquivo não torna seguro ocupar indefinidamente o disco, e o limite de resposta não torna barato carregar todas as imagens a cada quatro segundos. Defina limites menores conforme o produto.

### Regras dos exemplos, não da plataforma

O servidor de Perfis mantém limites próprios de upload, lotes de até 32 pessoas e um número máximo de perfis. Estilo mantém regras próprias de validação das opções salvas; a API impõe contraste texto/fundo mínimo de 4,5:1. Esses valores pertencem aos MODs e podem evoluir. Não os descreva como constantes universais da API.

## Erros e diagnóstico

Há três classes de falha: o pacote não carrega; o transporte não conclui; a regra do MOD recusa uma operação. Registre qual classe falhou antes de mudar o código.

| Sinal | Significado provável | Próximo passo |
| --- | --- | --- |
| malformed | JSON/campo/tipo inválido no manifesto | Validar chaves, tipos e sintaxe |
| api-too-old | API retirada, anterior à 3 | Migrar o pacote; não há compatibilidade |
| api-too-new | API pedida superior ao build | Usar build compatível ou API suportada |
| request-too-large | Pedido excede 12 KiB UTF-8 | Reduzir corpo ou implementar fragmentos |
| too-many-requests | Oito pedidos já pendentes | Evitar sobreposição e limitar concorrência |
| timeout | Resposta não chegou em 15 s | Consultar estado antes de repetir mutação |
| invalid-response | Falha ao interpretar resposta remontada | Retornar string JSON válida |
| bridge-refused | Recusa interna genérica do host | Conferir log, canal, permissões, handler e hash |
| conflito | Convenção do MOD para revisão antiga | Recarregar e oferecer nova decisão |
| sem-permissao | Convenção do MOD para autorização | Explicar a ação não disponível |

Códigos da interface podem variar conforme a versão. Erros de `invoke` também podem rejeitar a Promise. Não use a tabela como uma enumeração exaustiva de todas as mensagens internas do aplicativo.

### MOD instalado, mas sem interface

Confira se está ligado no servidor, se a conexão aceitou o conjunto, se o conteúdo instalado corresponde ao exigido, se `client` aponta para um arquivo existente e se o script inicializa sem exceção. Confira se o cliente usa apenas as funções que o prelúdio expõe, se a árvore contém formas aceitas e se existe um canal válido. O estado carregado, sozinho, não prova que a inicialização interna concluiu.

### bridge-refused

A mesma resposta pode representar MOD desligado, falta de leitura, canal desconhecido, arquivo ou hash divergente, ausência de metade de servidor, ausência de `aoPedir`, erro do handler ou falha de persistência. O cliente recebe um identificador estável; detalhes ficam no log do host. Não adivinhe a causa só pelo código genérico.

### Servidor não aceita entrada após ligar

Confira os limites do anúncio, em especial cada item `reach`. Um pacote pode ser legível em disco e ainda produzir um anúncio recusado. Use o fluxo suportado para desligar/corrigir em um ambiente de teste. Não recomende apagar o banco do usuário como solução padrão.

### Atualização não aparece

Compare ID, versão e hash anunciado com o pacote instalado. Confira se o catálogo fixou o commit novo, se houve reavaliação e se a cópia exigida pelo host foi atualizada. Um push isolado não basta. Não altere um pacote ativo diretamente esperando recarregamento automático de conteúdo arbitrário.

### Instrumentação útil

No host desktop usado como referência, o log fica em `~/.config/seele/seele.log`. Procure o ID do MOD e a operação relacionada. No cliente, confira console e estado de carregamento quando as ferramentas do ambiente permitirem. Use IDs de correlação gerados pelo MOD sem incluir conteúdo privado nos registros.

Reproduza o defeito com uma sequência curta, resultado esperado, resultado observado, versão do app, commit/hash do pacote, papel da pessoa e indicação de teste nativo ou simulado.

## Testes e matriz de compatibilidade

### Camada 1 — validação estática

```sh
node --check cliente/main.js
node --check servidor/main.js
```

Valide também o manifesto, caminhos, existência dos arquivos, comprimento UTF-8 dos alcances e ID. Se houver build, execute-o antes dos testes e verifique que o arquivo gerado corresponde ao fonte versionado. Um teste que só comprova que um arquivo existe não verifica autorização nem persistência.

### Camada 2 — handlers

Instancie um contexto novo para cada pedido, mas reutilize o armazenamento simulado entre chamadas. Isso revela dependência indevida de globais. Simule gravação de arquivos que retorna `false`, dados antigos, erro no parse e limites.

| Área | Casos relevantes |
| --- | --- |
| Identidade | Corpo forja person/admin; contexto precisa prevalecer |
| Permissões | Leitor tenta escrever; membro tenta administrar |
| Concorrência | Dois pedidos com a mesma revisão |
| Isolamento | Mesmo MOD em dois servidores/canais conforme a política |
| Persistência | Novo runtime lê o estado anterior |
| Tamanho | Limite exato, acima do limite, Unicode |
| Imagens | MIME falso, SVG, arquivo inválido, upload incompleto |
| Falhas | Disco falha antes/depois do KV; timeout e repetição |
| Migração | Estado antigo, atual e versão desconhecida |

Uma VM Node é um teste de lógica, não uma reprodução do QuickJS. Execute também no runtime real com o limite de memória quando o MOD manipular estado grande, imagens ou strings extensas.

### Camada 3 — interface

Execute o cliente final com a ponte simulada. Verifique formas renderizadas, limites de profundidade, mensagens de erro, leitura autorizada, rejeição de tema, fim do executor e remoção da região na saída. Marque a prévia como simulada. Não deixe um endpoint que aceita identidade arbitrária virar um backend de produção.

### Camada 4 — SEELE nativo

Teste host e participante reais. Observe instalação, anúncio, aceite, hash, carregamento, leitura por outra pessoa, desconexão, reinício e atualização. O ambiente nativo pode ter CSP e restrições de rede diferentes do navegador.

### Matriz a publicar no README

Informe versão do SEELE, sistema operacional, papel testado, tipo de pacote, commit do MOD e quais caminhos passaram. Não declare “funciona em todas as plataformas” só porque funcionou em um navegador desktop. Teste a região em janelas estreitas e largas com outros MODs ativos.

## Segurança, privacidade e coexistência

O cliente executa num executor fora da janela e só pode apresentar o que a API declarativa oferece. `reach` descreve o alcance do pacote; avaliação e isolamento não substituem validação e minimização de dados. O código deve fazer apenas o necessário para o recurso apresentado.

### Fronteiras de confiança

| Origem | Como tratar |
| --- | --- |
| Contexto de aoPedir | Autoridade de identidade/permissões da sessão |
| Corpo do pedido | Entrada não confiável, validar integralmente |
| Texto de perfil/chat | Dados de participante, enviar como string em dentro |
| Resposta HTTP externa | Dados externos, conferir forma e limites |
| Arquivo enviado | Bytes não confiáveis, não confiar só no MIME |
| Árvore declarativa | Apenas as formas da API, sem HTML |

Não exponha a lista inteira de dados só porque a resposta é privada no transporte. Uma operação de leitura deve filtrar campos e recursos conforme a política. Guarde apenas o que precisa e explique para o usuário o que é público no servidor.

Evite URLs de mídia arbitrárias, pois podem causar requisições de participantes a terceiros. Quando o host consulta serviços externos, declare os destinos e a finalidade. Não faça telemetria oculta ou coleta de dados que não tenham relação com o recurso.

### Regras de convivência

Use chaves próprias no estado e consulte apenas os dados necessários. A região é do MOD; painéis nativos, controles de áudio e ações de moderação pertencem ao SEELE.

Um MOD de tema e um MOD de perfis podem coexistir com regiões independentes. Tokens de tema não podem ter dois donos na mesma sessão; uma disputa é recusada explicitamente.

### Limites da privacidade

O host executa o código de servidor e mantém seu banco e arquivos. A ponte autenticada evita confiar numa pessoa forjada no corpo e mantém a resposta fora do histórico comum, mas não transforma o host em um ambiente que não possa acessar seus próprios dados. Descreva a proteção real, sem prometer criptografia ou sigilo que o MOD não implementa.

## Exemplo executável e receitas

O Contador contém somente [manifesto](exemplos/contador/mod.json), [cliente](exemplos/contador/cliente/main.js) e [servidor](exemplos/contador/servidor/main.js). Baixe o [ZIP](exemplos/contador.zip) da API 3.

### O que ele demonstra

- Descoberta do canal com snapshot e consulta por request.
- Região de leitura declarada com titulo e texto.
- Ciclo periódico sem consultas sobrepostas e com erros tratados.
- Persistência, revisão e autorização no servidor, inalteradas desde a API 2.
- Testes de incrementar e zerar sem fingir botões que a API não oferece.

O cliente só consulta. As operações de escrita existem no handler e são testadas diretamente; não há edição pela região. O exemplo não implementa uploads, paginação ou recibos de idempotência.

### Receita: tema compartilhado

Guarde as cores e a revisão no servidor. Uma leitura devolve a configuração; uma escrita exige `ctx.admin`. O cliente mapeia os valores para `fundo`, `painel`, `texto`, `apagado`, `acento` e `borda`, escolhe `densidade` e `fonte`, e chama `SeeleUI.tema`. Se estiver desativado, envie `{}`. Trate recusas de contraste e conflito; não marque o tema como aplicado antes da confirmação. O editor é seu: `campo` para cada cor, `escolha` para densidade e fonte, `botao` para gravar.

### Receita: perfil por servidor

Use `ctx.person` como dono e mantenha a autorização no servidor. Consulte metadados em lotes e apresente nome, ID, pronomes, status e biografia na região. Não busque imagens que a API não pode exibir. Edição, avatar, banner e decoração da lista nativa aguardam extensão da API.

### Receita: ficha por canal

Use o canal autenticado como escopo e filtre as fichas pelo papel e identidade. Declare os dados autorizados como texto e listas; não exponha notas privadas para simular uma interface completa. Criação, edição, rolagens por clique, tabuleiro, retratos e som aguardam uma superfície de interação.

### Projetos para leitura

[ESTILO](https://github.com/DATA-AND-DEV/ESTILO), [PERFIS](https://github.com/DATA-AND-DEV/PERFIS) e [MESA](https://github.com/DATA-AND-DEV/MESA) mantêm a lógica de servidor e os dados anteriores. As versões 2.0.0 migram o cliente para a API 3 e documentam os recursos suspensos. Versões anteriores são históricas e não executam no runtime atual.

## Fontes, manutenção e glossário

Esta revisão foi construída a partir do código local do SEELE, do ADR 0049 e das emendas de 19/09/2026, do guia de migração API 2 → 3, do executor e do indexador. Os contratos API 1/2 permanecem referências históricas do domínio e do servidor. Quando um comentário histórico diverge de uma função executável, o guia descreve a função e explicita a diferença. As afirmações de implementação devem ser revalidadas ao atualizar o runtime.

### Fontes primárias

- [Migração API 2 → 3](https://github.com/DATA-AND-DEV/SEELE/blob/fbcb09786c29219a18e20289381aa7d0e0ae13ac/docs/migracao-de-mods-api-2-para-3.md)

- [Contrato histórico API 1](https://github.com/DATA-AND-DEV/SEELE/blob/fbcb09786c29219a18e20289381aa7d0e0ae13ac/api/v1.json)
- [Contrato histórico API 2](https://github.com/DATA-AND-DEV/SEELE/blob/fbcb09786c29219a18e20289381aa7d0e0ae13ac/api/v2.json)
- [Manifesto e hash de conteúdo](https://github.com/DATA-AND-DEV/SEELE/blob/fbcb09786c29219a18e20289381aa7d0e0ae13ac/crates/seele-proto/src/mods.rs)
- [Runtime QuickJS](https://github.com/DATA-AND-DEV/SEELE/blob/fbcb09786c29219a18e20289381aa7d0e0ae13ac/crates/seele-server/src/mods/mod.rs)
- [Ponte autenticada](https://github.com/DATA-AND-DEV/SEELE/blob/fbcb09786c29219a18e20289381aa7d0e0ae13ac/crates/seele-server/src/mods/pedidos.rs)
- [Adaptador de eventos](https://github.com/DATA-AND-DEV/SEELE/blob/fbcb09786c29219a18e20289381aa7d0e0ae13ac/crates/seele-server/src/mods/despacho.rs)
- [Cliente da ponte](https://github.com/DATA-AND-DEV/SEELE/blob/fbcb09786c29219a18e20289381aa7d0e0ae13ac/apps/seele-app/ui/base.js)
- [Tipos do snapshot](https://github.com/DATA-AND-DEV/SEELE/blob/fbcb09786c29219a18e20289381aa7d0e0ae13ac/crates/seele-ffi/src/types.rs)
- [Indexador e processo de publicação](https://github.com/DATA-AND-DEV/SEELE-MODS-INDEXER)

### Glossário

| Termo | Significado |
| --- | --- |
| Manifesto | mod.json que identifica o pacote e seus scripts |
| Host | Máquina/pessoa que hospeda o servidor |
| Cliente do MOD | Executor QuickJS próprio da sessão, fora da janela |
| Handler | Função chamada pelo runtime para um pedido/evento |
| KV ou quintal | Objeto dados persistido como chave/valor textual |
| Snapshot | Consulta do estado exposto pelo aplicativo |
| Revisão | Número do seu estado para detectar alterações concorrentes |
| Idempotência | Repetir uma operação sem aplicar o efeito duas vezes |
| Hash de conteúdo | Identidade calculada sobre caminhos e bytes do pacote |
| CSP | Política do WebView para scripts, estilos e conexões |
| Descarregamento | parada do executor e retirada de região, tema, mídia e arquivos pelo produto |
| Avaliação | Revisão de um commit/conteúdo para publicação no catálogo |

### Como manter este guia

Atualize a fonte Markdown, regenere a página, execute os testes do exemplo e da navegação, confira links e abra a página em larguras diferentes. Se um novo evento ou método for implementado, inclua sua assinatura, origem dos dados, autorização, retorno, erros, limites e um exemplo testável. Preserve a distinção entre contrato declarado e binding executável.

O indexador aceita novos pacotes somente na API 3. Versões antigas já publicadas permanecem no histórico append-only apenas quando ID, versão e hash correspondem ao catálogo anterior; isso não as torna executáveis no SEELE atual. O catálogo assinado precisa ser regenerado junto da publicação, anunciando `api_oferecida: 3`.

O hash não é o SHA-256 do ZIP. O algoritmo de conteúdo ordena caminhos e inclui contagem de arquivos, comprimentos dos caminhos, bytes dos caminhos, comprimentos dos conteúdos e bytes dos conteúdos, usando comprimentos inteiros de 64 bits em big-endian. Use as ferramentas oficiais e os vetores do indexador para reproduzi-lo; não crie um cálculo simplificado em um script de release.
