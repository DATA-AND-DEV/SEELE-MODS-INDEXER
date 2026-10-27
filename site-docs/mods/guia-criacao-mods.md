# Como criar MODs para o SEELE

Guia prático e referência técnica. Revisão de 25/10/2026. Manifesto schema 1, API de MOD 7: a do app 0.17 e do Servidor 2.0, que também executam a 6, a do app 0.16 e do Servidor 1.0. A documentação distingue o que o produto executa, as convenções de autoria e o que não existe — e diz qual é qual.

## Comece por aqui

Um MOD é um pacote de JavaScript que acrescenta comportamento ao SEELE. Na API 6 ele desenha em **superfícies** — uma página, um diálogo, uma folha, um aviso —, entra na interface do SEELE por **contribuições** num ponto com nome, como a navegação do servidor ou o cartão de uma pessoa, recebe o que a pessoa faz, publica o tema do servidor e guarda informações próprias no servidor. Não é preciso alterar o Rust para mostrar um contador, editar uma ficha, arrastar uma peça num tabuleiro ou tocar um som do próprio pacote.

Você entrega uma pasta com um manifesto e pelo menos um script. O manifesto apresenta o pacote; o script faz o trabalho. Quando o MOD tem interface e dados compartilhados, a metade de cliente declara o que aparece e recebe o que a pessoa faz; a metade de servidor decide o que pode ser lido ou alterado.

**Não há SDK, build nem passo de compilação.** O que você escreve é o que roda, e é também o que passa pela avaliação: os três são o mesmo arquivo, de propósito.

### Escolha seu caminho

- Nunca criou um MOD? Siga os capítulos do guia, em ordem. Você terminará com um contador compartilhado instalável.
- Já conhece JavaScript? Abra a Referência técnica para consultar assinaturas, tipos, limites, autorização e ciclo de vida.
- Quer publicar? Primeiro teste a pasta exata que será distribuída; depois consulte Publique e mantenha.
- Está corrigindo um problema? Consulte Recusas e diagnóstico. Uma instalação bem-sucedida não prova que o MOD está ligado nem executando.
- Mantém um MOD das APIs 3, 4 ou 5? Ele roda no Servidor 0.15, e não no app 0.16: veja A linha do Servidor 0.15.

### O que você precisa

Um editor de texto e conhecimentos básicos de JavaScript, JSON, funções, objetos, promessas e tratamento de erros. Para a interface, use árvores de objetos com `forma` e `dentro`; HTML e CSS não fazem parte da API. Node.js é útil para verificar sintaxe e rodar testes, mas não é uma dependência do runtime do MOD. Git é recomendado para versionar e publicar. Rust e Cargo só são necessários se você for compilar o SEELE ou subir um servidor local com o seu MOD pelo repositório do SEELE.

Você não precisa contratar um backend para guardar o estado de um MOD: o servidor SEELE fornece armazenamento próprio. Integrações externas podem precisar de infraestrutura adicional, mas isso é uma escolha do seu produto.

### Três ideias fundamentais

1. O código de cliente roda num executor próprio de cada participante — um motor QuickJS do lado do aplicativo, fora da janela. Uma variável nele não é compartilhada com outras pessoas, e o que ele guardar morre com a sessão.
2. O código de servidor roda no computador de quem hospeda. É ali que ficam as regras de autorização e o estado comum.
3. A comunicação tem pedido e resposta, e a resposta chega só a quem perguntou. Para as outras janelas saberem de uma mudança, a metade de servidor as avisa com `mundo.avisar`, e cada uma recebe o evento `servidor` — sem consultar de tempos em tempos.

### Exemplo completo

O [contador de exemplo](exemplos/contador.zip) tem três arquivos e usa a API 6: uma entrada na navegação do servidor abre uma página com dois botões, que gravam no servidor. O servidor mantém revisão e autorização administrativa, e avisa as outras janelas quando o valor muda. Extraia o ZIP antes de instalar. O código é didático e não depende de ESTILO, PERFIS ou MESA.

## Planeje seu MOD

Escreva uma frase dizendo o que a pessoa conseguirá fazer. Depois escolha onde cada parte precisa rodar.

| Objetivo | Cliente | Servidor |
| --- | --- | --- |
| Uma página ou um diálogo sem estado comum | Sim | Pode ser dispensado |
| Tema do servidor, o mesmo para todos | Opcional: uma prévia | Sim: `"tema": true` e `mundo.tema` |
| Perfil numa comunidade | Sim: o cartão, a foto e a capa da pessoa | Sim: identidade e dados |
| Reagir a uma mensagem do chat | Opcional | Sim, por `aoAcontecer` |
| Consultar um serviço HTTP externo | Interface opcional | Sim, por `mundo.buscar` |

Um MOD somente de cliente ainda participa do mecanismo de MODs exigidos e aceitos pelo servidor. «Somente cliente» descreve o lugar onde o script executa; não é uma promessa de um sistema separado de extensões locais. E o tema que todos veem é sempre da metade de servidor: um MOD sem `server` só faz prévia.

### Decisões que evitam retrabalho

Defina quem pode ler, quem pode editar, se os dados pertencem ao servidor inteiro ou a um canal, o volume esperado e o que acontece quando o MOD é desligado. Por exemplo: «Qualquer participante lê o contador; quem pode escrever soma; somente quem administra zera». Essa regra poderá ser testada no servidor.

Se o recurso for privado, diga privado para quem. Uma resposta que chega só a quem perguntou não torna privados todos os dados de um MOD. O handler precisa decidir quais campos devolver, e o computador que hospeda continua armazenando esses dados.

Para imagens e fichas, defina limites antes de desenhar a tela. Quantos perfis? Quantos arquivos? Qual tamanho de imagem? O limite da plataforma não substitui um orçamento de produto. Um servidor pequeno não deve perder fluidez por causa de um catálogo ilimitado de banners.

Decida também **onde** o MOD aparece. Uma página que só abre quando alguém pede, por uma entrada na navegação, é diferente de algo que está sempre na tela. Na API 6 não existe a faixa fixa das versões anteriores: o que fica de pé ao lado da conversa é uma contribuição num ponto, e o que interrompe — editar, criar, confirmar — é uma superfície.

### Nome e identidade

Escolha um ID durável, como `seu-autor/meu-mod`. O nome do repositório pode ser diferente, mas o ID do manifesto e o ID usado em `SeeleMods.request` precisam concordar. Mudar o ID depois da publicação cria outra identidade de pacote e pode deixar dados antigos sem um caminho de migração.

## Prepare a pasta

Crie um projeto separado, como `SEELE-MOD-MEU-MOD`, seguindo o modelo usado por MESA, ESTILO e PERFIS.

```text
meu-mod/
├── mod.json
├── cliente/
│   └── main.js     roda na máquina de quem entra, num contexto só dele
├── servidor/
│   └── main.js     roda na máquina de quem hospeda
└── som/
    └── toque.wav   a mídia que o MOD traz, quando traz
```

`mod.json` fica na raiz da pasta que você seleciona para instalar. Não coloque o manifesto dentro de uma segunda pasta por engano. `client` e `server` são caminhos relativos a essa raiz. Declare ao menos uma das duas metades: sem nenhuma, o manifesto é recusado como `empty`.

### Manifesto do exemplo

```json
{
  "schema": 1,
  "id": "exemplo/contador",
  "version": "3.0.0",
  "api": 6,
  "repo": "https://github.com/DATA-AND-DEV/SEELE-MODS-INDEXER",
  "reach": ["pagina", "navegacao do servidor", "contador no servidor"],
  "client": "cliente/main.js",
  "server": "servidor/main.js"
}
```

Ao criar seu próprio pacote, troque `exemplo/contador` no manifesto e no cliente, e informe seu repositório público. O endereço acima é o repositório que contém este exemplo. Um MOD que publica o tema do servidor declara também `"tema": true`; um que traz som ou imagem lista os arquivos em `arquivos`.

### Desenvolvimento e distribuição

Seu projeto pode conter `test/`, `ferramentas/`, documentação e scripts de build. O JavaScript final continua sendo o que o SEELE executa. Um build é opcional: pode reunir fontes, mas deve ser reproduzível e deixar os arquivos finais acessíveis para avaliação.

Prepare uma pasta de distribuição limpa. Ela deve conter o manifesto, os scripts e os recursos de runtime que o pacote realmente usa. Não distribua `.git`, `node_modules`, caches de compilação, backups, bancos de teste ou credenciais. **Todo arquivo da pasta entra no hash do conteúdo**: «mesma versão» não garante «mesmos bytes». Os dados do MOD não moram no pacote — eles ficam no servidor que o hospeda —, e por isso não há pasta de dados a separar da distribuição.

## Faça seu primeiro MOD

O contador tem uma entrada na navegação do servidor, uma página com dois botões e uma metade de servidor que mostra autorização, revisão e aviso. Apertar `SOMAR 1` escreve no servidor; `ZERAR` pergunta antes e só funciona para quem administra, e a recusa aparece na página em vez de sumir. Quando outra pessoa grava, a sua página acompanha sem consultar de novo.

### Passo 1 — baixe e examine

Baixe o [contador](exemplos/contador.zip) e leia os três arquivos. O manifesto usa `api: 6`. O cliente registra uma entrada na navegação, abre a página quando alguém aperta a entrada, lê o valor com `request()` e declara o desenho com `montar()`. O servidor responde, grava e avisa.

### Passo 2 — entre na navegação do servidor

```js
SeeleUI.contribuicoes.registrar({
  ponto: 'servidor.navegacao',
  modo: 'adicionar',
  rotulo: 'Contador',
  acaoPrincipal: 'abrir-contador',
}).catch((falha) => console.warn('a entrada não entrou:', falha.erro));
```

O MOD não escolhe onde a entrada fica, nem a desenha: ele declara o ponto, e o produto a põe na lista do servidor, com o nome do MOD. Quando a pessoa aperta, chega o evento `acao`, com o nome que você deu em `acaoPrincipal`. Uma recusa chega pelo nome — `ponto-desconhecido`, `modo-recusado`, `teto-de-contribuicoes` — em `falha.erro`.

### Passo 3 — abra a página e leia

```js
SeeleUI.aoEvento((evento) => {
  if (evento.nome === 'acao' && evento.acao === 'abrir-contador') void abrir();
});

async function abrir() {
  pagina = await SeeleUI.superficies.criar({ id: 'contador', tipo: 'pagina', titulo: 'Contador' });
  const r = await SeeleMods.request('exemplo/contador', 0, { op: 'ler' });
  await pagina.montar([
    { forma: 'titulo', chave: 'titulo', dentro: 'Contador' },
    { forma: 'texto', chave: 'valor', dentro: `Valor: ${r.valor} · revisão ${r.revisao}` },
  ]);
}
```

O fragmento é uma versão curta do que está no exemplo, que trata as recusas. **O canal `0` quer dizer «nenhum»**: o contador é do servidor inteiro, e o servidor recebe `channel: null`. `criar` com um `id` que já está de pé reabre a mesma página, sem recriar. `op`, `ler`, `valor`, `revisao` e `ok` são convenções deste exemplo, e não métodos da plataforma.

### Passo 4 — entenda a alteração no servidor

```json
{"op":"incrementar","revisao":0}
```

O handler confere a permissão no **contexto**, e nunca no pedido, e confere a revisão antes de gravar. Se outra pessoa gravou antes, a revisão não bate e a resposta é `conflito`: a página relê e pede para apertar de novo, em vez de gravar por cima. Depois de gravar, `mundo.avisar` manda o estado novo a todas as janelas deste MOD, que o recebem pelo evento `servidor`.

### Passo 5 — experimente

Instale num servidor de teste, hospede e ligue o MOD. Aperte `Contador` na navegação do servidor e some. Conecte outra pessoa, abra a página nas duas janelas e some numa delas: a outra acompanha sem recarregar. Aperte `ZERAR` sem ser administrador: o produto pergunta antes, e a página diz que não há permissão. Saia e entre de novo: o valor continua, e a entrada não se duplica.

### Passo 6 — transforme a ideia

Troque o contador pelos dados autorizados do seu MOD. Uma ficha com campos é um `formulario` numa superfície; um perfil é o cartão, a foto e a capa da pessoa; um tema é a metade de servidor com `"tema": true`. Os capítulos seguintes dizem o que cada um exige.

## Instale e teste no SEELE

Instalar copia o pacote para a máquina. Ligar determina que o servidor passe a exigir aquele MOD. Aceitar autoriza um conjunto de MODs para uma conexão. São etapas diferentes.

1. Use um servidor de teste separado das conversas e dados que você quer preservar.
2. Abra Configurações › MODs › Instalados › Instalar MOD de uma pasta e selecione a raiz com `mod.json`.
3. Hospede o servidor de teste e ligue o pacote. Instalar não liga.
4. Reconecte se o conjunto exigido mudar. Leia os alcances mostrados na tela de aceite.
5. Aguarde o carregamento e teste a interface. Confira o `seele.log` se nada aparecer.
6. Instale o mesmo conteúdo em uma segunda máquina ou instância de teste e entre como participante.

O `mod.json` é lido antes de qualquer byte ser copiado, e o que não serve é recusado pelo nome — `api-too-old`, `malformed-id`, `empty`, `tema-sem-metade-de-servidor` e o resto. O pacote instalado mora numa pasta com o hash do conteúdo (`mod-packages/<hash>/`, na pasta de configuração), e por isso **editar os arquivos lá dentro não funciona**: um pacote mexido depois de instalado é recusado, e nomeado. Mudou o MOD, instale de novo.

### A metade de servidor sem hospedar pelo app

Com o repositório do SEELE e o Rust instalados, um servidor local sobe com o seu MOD já ligado:

```sh
cargo run -p seele-server --example servidor-com-mod -- /caminho/absoluto/do/mod /caminho/absoluto/de/um/mundo-novo
```

O exemplo instala o pacote pelo hash, liga o MOD antes de subir e escuta em `127.0.0.1`, na porta 8390. Ele imprime o endereço e a impressão digital, e o app entra por eles: é assim que a metade de cliente aparece. O que o MOD não conseguiu carregar sai no terminal. Ele não acompanha as suas edições: mudou o MOD, rode de novo num mundo novo — a pasta do mundo não pode existir, para um mundo nunca ser reaberto com outro código.

### Roteiro mínimo de teste manual

| Situação | Resultado que você precisa observar |
| --- | --- |
| Primeira entrada | A entrada aparece uma vez, sem erro no `seele.log` |
| Leitura | Estado correto do servidor |
| Escrita | A página muda depois da resposta |
| Segundo participante | A alteração chega pelo aviso, sem recarregar |
| Sem permissão | O servidor recusa, a página diz, e o estado não muda |
| Duas escritas concorrentes | Conflito explicado, sem sobrescrita silenciosa |
| Superfície com alterações | Fechar pergunta antes, e descartar avisa o MOD |
| Saída ou desligamento | Superfícies, contribuições, som e temporizadores retirados |
| Reconexão | Estado salvo continua; nada se duplica |
| Troca de servidor | Dados e tema do anterior não vazam |
| Pacote alterado | Divergência de conteúdo recusada pelo nome |

Um simulador de API no navegador ajuda a testar a interface. Ele não prova autenticação real, consentimento, as conferências do anfitrião, hash de conteúdo ou o comportamento do servidor nativo. Registre separadamente os testes simulados e os testes no SEELE.

## Desenhe como parte do SEELE

**Você declara, e quem desenha é o produto**, com `createElement` e `textContent`. Não há forma que aceite HTML: o conteúdo vem de código de terceiro, e interpretá-lo como marcação devolveria a página ao MOD por outro caminho. O SEELE escolhe tipografia, espaçamento e a apresentação acessível; não há acesso aos seletores ou estilos da página.

### Superfícies

Uma superfície é uma janela do produto que o MOD declara e o produto monta. **A casca é do produto**: o cabeçalho diz de qual MOD ela é, a saída é do produto, com as palavras dele, e o foco entra na abertura, fica contido e volta a quem abriu.

| tipo | O que é |
| --- | --- |
| pagina | Uma vista inteira da sessão; `imersiva: true` esconde o resto |
| dialogo | Uma janela por cima, `modal` (o padrão) ou não; um modal torna o resto inerte, e não só escuro |
| folha | Uma folha ao lado (`lado: 'direita'` ou `'esquerda'`); até 3 à vista, empilhadas |
| aviso | Uma linha de vida curta; use `SeeleUI.superficies.avisar(texto, tom)` |

Sem `tipo`, `dialogo`. Um tipo que a 6 não tem é recusado como `tipo-desconhecido`; o `painel` das versões anteriores saiu, e o lugar dele é a `folha`.

### Formas disponíveis

São trinta formas, e cada uma vira um elemento do produto. As de composição levam os filhos em `dentro`; as de texto levam o texto em `dentro`, e um texto solto dentro de `dentro` também vale.

| Grupo | Formas |
| --- | --- |
| Texto | `titulo`, `texto`, `item`, `distintivo`, `link` |
| Composição | `caixa`, `pilha`, `grade`, `linha`, `rolagem`, `lista`, `acoes`, `separador`, `espaco` |
| Formulário | `formulario`, `campo`, `textoLongo`, `escolha`, `numero`, `deslizante`, `marca`, `interruptor`, `cor`, `botao`, `arquivo` |
| Navegação | `abas`, `aba` |
| Imagem, som e desenho | `midia`, `retrato`, `tela` |

Em toda forma valem `chave`, `estilo`, `classe` e `nomeAcessivel`. Números precisam ser convertidos para texto. Uma forma que a API não tem é recusada pelo nome (`forma-desconhecida`), e a tela fica como estava. Texto nunca é interpretado como HTML.

A `chave` é o que liga uma declaração à seguinte. `montar` declara o conteúdo inteiro, e o produto reconcilia por `chave`: o que não mudou não é tocado, e **quem está digitando não perde o foco**. Declare a árvore inteira a cada vez, ou troque um nó só com `atualizar(chave, arvore)`.

### Interação

O que a pessoa faz chega por evento, e um evento **não tem resposta**: quem digita não espera o MOD confirmar que recebeu a tecla.

```js
SeeleUI.aoEvento((evento) => {
  if (evento.nome === 'campo')    { /* evento.chave, evento.valor */ }
  if (evento.nome === 'botao')    { /* evento.chave; com confirmar, só depois do sim */ }
  if (evento.nome === 'submeter') { /* evento.chave, evento.valores */ }
  if (evento.nome === 'acao')     { /* evento.acao, da sua contribuição */ }
  if (evento.nome === 'servidor') { /* evento.carga, o aviso da sua metade de servidor */ }
});
```

Um ouvinte só, e o último registrado vence. Um erro dentro dele fica com o seu MOD, vai ao `seele.log`, e não impede o próximo evento de chegar. A lista inteira dos eventos está em Executor, superfícies e ciclo de vida.

Um `botao` pode declarar `confirmar` com a frase da consequência: o produto pergunta com as palavras dele, e o evento só chega depois do sim. Use `variante` (`primaria`, `secundaria`, `perigo`, `discreta`) para dizer o peso de cada ação.

### Desenho e arraste

Uma `tela` aceita **figuras declaradas**. Uma figura com `chave` pode ser pega: o evento `traco` traz `alvo` com a chave da figura de cima onde o gesto começou, ou `null` quando o toque caiu no vazio.

| tipo | Campos |
| --- | --- |
| retangulo | `x`, `y`, `largura`, `altura`, `cor`, `preenchida` |
| circulo | `x`, `y`, `raio`, `cor`, `preenchida` |
| texto | `x`, `y`, `dentro`, `corpo`, `cor` |
| linha | `x`, `y`, `ate_x`, `ate_y`, `cor` |

A **última figura declarada fica por cima**, e é a primeira que o toque encontra. Uma `linha` nunca é pega: ela é grade, parede e régua, e dar-lhe área de acerto roubaria o toque de toda figura em cima dela — declare uma peça como círculo ou retângulo.

O `alvo` é fixado quando o dedo desce e viaja nas fases `comecou`, `moveu` e `terminou`, ou `cancelou` quando o gesto não termina. As coordenadas são as da sua tela declarada, e não as da janela. O movimento é agregado por quadro: um arraste não manda um evento por pixel.

### Mídia

Som e imagem vêm de **duas origens, e só duas**:

```js
{ forma: 'midia', chave: 'toque', fonte: 'som/toque.wav' }                                  // do seu pacote
{ forma: 'midia', chave: 'mapa', doServidor: { canal, pedido: { op: 'mapa' }, campo: 'imagem' } } // do seu servidor
```

Do pacote: o arquivo precisa estar em `arquivos` no manifesto. Do servidor: o SEELE faz o pedido com o `id` do seu MOD e lê o conteúdo no campo que você nomear; uma imagem grande vem pelo volume (ver Imagens grandes e uploads). Não existe uma terceira origem: um endereço qualquer faria a janela de quem conversa buscar bytes na rede de um estranho.

O **tipo do arquivo vem dos bytes**, nunca do nome nem do manifesto. Declare `tocando: true` para tocar e `repetir: true` para tocar em laço; o botão TOCAR/PAUSAR é do produto, e o estado real volta pelo evento `midia`.

### Tema

A aparência que todos veem é da **metade de servidor**, com `"tema": true` no manifesto e `mundo.tema` (ver O tema do servidor). A metade de cliente só faz a **prévia**: `SeeleUI.tema(valores, { previa: true, superficie: id })` pinta só nesta máquina, com o selo «prévia não publicada», e sai quando a superfície fecha. Sem `previa: true`, a chamada é recusada como `sem-previa`.

### Escolher um arquivo

O MOD **não abre o seletor**: ele declara a forma `arquivo`, a pessoa aperta, e o seletor é do sistema. O evento `arquivo` traz `{ id, papel, bytes }` — nunca o caminho —, ou `resultado: 'cancelado'`. Uma imagem vai ao seu servidor por `SeeleUI.enviar(arquivo, token)`; o resto se lê em pedaços com `SeeleUI.pedaco(arquivo, inicio)`. Solte o identificador com `SeeleUI.soltar(arquivo)` quando terminar: ficam até quatro de pé por vez.

Os pedaços são base64 de janelas **múltiplas de três**. Duas janelas seguidas precisam concatenar no arquivo, e um tamanho que não é múltiplo de três deixa `=` no meio do fluxo: a imagem chega corrompida sem erro nenhum.

### O que não existe, e por quê

**CSS livre, HTML e seletores.** O estilo de um nó é declarado por propriedades, validadas uma a uma, e as classes são presas à superfície que as declara (ver Estilos, classes e composição).

**A faixa fixa das versões anteriores.** A 6 tirou `SeeleUI.regiao`, `SeeleUI.cartoes` e `SeeleMods.snapshot`: o desenho mora numa superfície, o que fica de pé na interface é uma contribuição num ponto, e a leitura é `SeeleUI.retrato()`.

Não transforme uma interação indisponível em uma alteração automática de dados, e não escreva na tela que algo «aguarda suporte»: se a sua ideia depende do que a API não tem, proponha a extensão.

## Publique e mantenha

O caminho recomendado é um repositório público por MOD, com manifesto na raiz, código legível, instruções de teste e versão explícita. ESTILO, PERFIS e MESA são exemplos de projetos independentes.

### Antes da solicitação

- Confira se o `repo` aponta para o repositório correto e se o ID coincide em todas as partes.
- Execute sintaxe, testes e o build que produz os scripts finais.
- Teste o pacote exato, incluindo recursos estáticos e migração dos dados.
- Descreva alcances e integrações externas de forma direta.
- Fixe o commit que será avaliado e informe uma versão nova quando o conteúdo mudar.
- Explique limitações conhecidas, permissões necessárias e como desligar o recurso.

Use a seção [Publicar do catálogo](../#/publicar) para abrir a solicitação de inclusão. A avaliação do indexador é vinculada a um commit e ao conteúdo publicado. Um `git push` no repositório do autor não atualiza o catálogo nem as instalações.

### Vereditos e confiança

| Veredito | O que significa |
| --- | --- |
| verificado | Passou. Entra no catálogo com a assinatura de verificado |
| publicado com notas | Não passou limpo, mas o que ele faz é legítimo — uma integração com um terceiro conhecido, por exemplo. Entra sem verificação, e as notas aparecem na tela de quem instala |
| negado | O que ele faz lesa quem instala. Não entra |

Publicar o código no GitHub não é o mesmo que obter verificação no catálogo. O aplicativo confere o catálogo com uma chave de confiança distribuída com o SEELE e compara o conteúdo dos pacotes. O site humano não deve ser descrito como uma âncora independente de autenticidade quando chave, catálogo e verificador vêm da mesma origem. Consulte a documentação do indexador para as garantias de assinatura e revogação.

### Atualizações

Crie uma versão nova para conteúdo novo. Não reescreva uma versão já publicada. Atualizar o arquivo no host, atualizar o que o servidor exige e atualizar o que o participante instalou precisam resultar no mesmo hash. Uma etiqueta `1.0.0` igual nos dois lados não basta.

**A API que você declara é uma versão só.** Um pacote da 7 roda no app 0.17 e no Servidor 2.0, e não roda no app 0.16. Um da 6 roda nos apps 0.16 e 0.17 e nos Servidores 1.0 e 2.0, sem ser republicado. Um das APIs 3 a 5 continua rodando no Servidor 0.15. Um pacote da API 6 serve as linhas 1 e 2 sem ser republicado. Um pacote por API só é preciso quando as APIs são incompatíveis, por exemplo para alcançar a linha 0.15 e a linha 2 ao mesmo tempo (a 5, a 4 e a 3 de um lado, a 6 ou a 7 do outro): é o que fazem os três MODs oficiais — a 4.x na API 6, a 3.x na linha legada —, e cada pacote passa pela avaliação.

Planeje migrações de dados e faça backup antes de testar uma atualização sobre um mundo existente. A propriedade `state` do manifesto não executa uma migração automaticamente. Sua lógica deve reconhecer versões antigas do estado e transformá-las de maneira explícita.

Teste entrar com pacote antigo, entrar com pacote novo, atualizar durante uma sessão, reiniciar e retornar à versão anterior quando isso for suportado. Não prometa downgrade se o formato novo não puder ser lido pelo código antigo.

## Superfície e compatibilidade

O indexador oferece a API 7 (`VERSAO_DA_API`, o espelho de `MOD_API_VERSION`) e lê o manifesto de esquema 1. A ponte de pedidos entrou com o protocolo 6, o Servidor 1.0 é o protocolo 1.0 mais a API 6, e o Servidor 2.0 (app 0.17) executa a API 7 e a 6. São números diferentes: versão do manifesto, versão da API do MOD e versão do protocolo de rede. A versão do seu pacote, por exemplo `3.0.0`, é outro identificador.

O que está no catálogo assinado hoje, e o que já chegou na máquina de alguém, é o que as releases publicadas dizem:

```sh
curl -sS "https://api.github.com/repos/DATA-AND-DEV/SEELE-RELEASES/releases" | head -40
```

### Três linhas de servidor

**A 6 é uma ruptura.** Ela tirou `SeeleUI.regiao` (a faixa de 240 px), `SeeleUI.cartoes` (trocado pelo ponto `pessoa.cartao`) e `SeeleMods.snapshot` (trocado por `SeeleUI.retrato()`), e por isso o app 0.16 executa só ela. As APIs 3, 4 e 5 continuam rodando no Servidor 0.15, que o launcher oferece, e o indexador aceita as linhas todas: o conjunto dele é a união, e não o de um aplicativo só.

**A 7 é um alargamento da 6, e não uma ruptura.** Ela traz a 6 inteira e acrescenta as permissões do MOD e a capacidade `acoes` (veja **As permissões e as ações**, no capítulo do manifesto). Um MOD da 6 roda no app 0.17 sem permissões e sem ser republicado. O contrário não vale: o app 0.16 não executa a 7, e por isso o catálogo só oferece à 0.16 as versões que declaram a API 6.

As linhas são três, e é delas que o indexador tira o conjunto (`APIS_POR_LINHA`): a linha `2` (app 0.17, Servidor 2.0) executa a 7 e a 6; a `1` (app 0.16, Servidor 1.0) executa a 6; a `0.15` executa a 5, a 4 e a 3.

| O que o número diz | Onde ele está | Valor nesta revisão |
| --- | --- | --- |
| O teto que o cliente entende | `MOD_API_VERSION` | 7 no app 0.17; 6 no app 0.16; 5 no Servidor 0.15 |
| O conjunto que o cliente executa | `APIS_ACEITAS` | 7 e 6 no app 0.17; 6 no app 0.16; 5, 4, 3 no Servidor 0.15 |
| O teto que o indexador publica | `api_oferecida` no catálogo | 7 |
| O conjunto que o indexador aceita | `apis_aceitas` no catálogo | 7, 6, 5, 4, 3: a união das três linhas |
| O que o seu pacote declara | `api` no manifesto | 7 para o app 0.17 e o Servidor 2.0; 6 para qualquer um dos apps 0.16 e 0.17 e dos Servidores 1.0 e 2.0; 3, 4 ou 5 para o Servidor 0.15 |

Um pacote que pede mais do que o teto é recusado como `api-too-new`; um fora do conjunto, como `api-too-old` — no app 0.16 e no app 0.17, toda API abaixo da 6, e a tela aponta o Servidor 0.15 no launcher. O app 0.16 recusa a 7 como `api-too-new`; se o manifesto da 7 traz `permissoes`, a recusa é `malformed`, porque a 0.16 não conhece a chave. As duas recusas acontecem antes de executar qualquer código. Numa ruptura, a ordem de publicação é a dos pacotes da 6 entrarem no catálogo **antes** do aplicativo que os executa, e foi assim que os três MODs oficiais saíram na 4.0.0.

### O que a plataforma não tem não existe

O aplicativo monta `SeeleUI` **a partir do que a sua API e a plataforma oferecem**, e não a partir de uma lista fixa. O que não está lá não existe, em vez de existir e falhar:

```js
// No navegador, a plataforma não tem o volume
SeeleUI.enviar          // undefined
SeeleUI.enviar(id, t)   // TypeError: not a function
```

É deliberado: um método que sempre recusasse faria você descobrir o problema dentro de um `catch`, em produção. Um método ausente é um `TypeError` com pilha, na primeira linha que o chama, enquanto você escreve. Pergunte antes de chamar:

```js
const tem = new Set(SeeleUI.capacidades());
if (tem.has('volume')) await SeeleUI.enviar(arquivo.id, token);
else dizer('envie a imagem pelo app do computador');
```

`SeeleUI.capacidades()` devolve, na 6: `superficies`, `contribuicoes`, `estilos`, `classes`, `volume`, `arquivo`, `tema`, `retrato`, `eventos-da-tela` e `aviso-do-servidor` — menos o que a plataforma não tem. `estilos` e `classes` estão na lista como rótulos: nada pergunta por eles, e o estilo de um nó vale onde a forma dele monta. A conferência não é só do prelúdio: uma mensagem emitida na mão, que a API do pacote não tem, é recusada pelo anfitrião como `tipo-desconhecido`. A versão conferida é a do manifesto cujo hash o aplicativo verificou, nunca um campo que a mensagem carregue.

### Funções que você pode usar

| Ambiente | Superfície executável |
| --- | --- |
| Cliente | `SeeleMods.request(id, canal, valor)` |
| Cliente | `SeeleUI.retrato()` |
| Cliente | `SeeleUI.superficies.criar(descricao)` → punho, e `SeeleUI.superficies.avisar(texto, tom)` |
| Cliente | punho: `montar`, `atualizar`, `formulario.erros`, `classes`, `titulo`, `mostrar`, `ocultar`, `suja`, `fechar`, `descartar` |
| Cliente | `SeeleUI.contribuicoes.registrar(pedido)` → `{ handle }`, `atualizar(handle, conteudo)`, `revogar(handle)` |
| Cliente | `SeeleUI.tema(valores, { previa: true, superficie })` |
| Cliente | `SeeleUI.aoEvento(funcao)` e `SeeleUI.capacidades()` |
| Cliente | `SeeleUI.pedaco(arquivo, inicio)`, `SeeleUI.soltar(arquivo)` e `SeeleUI.enviar(arquivo, token)`, onde a plataforma os tem |
| Cliente | `console`, `setTimeout`, `setInterval` e os dois `clear` |
| Servidor | `aoPedir(contextoJSON, pedidoJSON)` e `aoAcontecer(momento, cargaJSON)` |
| Servidor | `dados`, `dados.uso()`, `dados.teto` |
| Servidor | `arquivos.ler`, `escrever`, `listar`, `apagar` |
| Servidor | `volume.esperar`, `tamanho`, `servir`, `apagar` |
| Servidor | `mundo.buscar`, `agora`, `registrar`, `avisar`, `tema` |

### APIs do navegador e do servidor

O servidor executa JavaScript em QuickJS, não Node.js nem uma página web. Não conte com `document`, `window`, `fetch`, `require`, módulos npm ou timers. O arquivo do servidor é avaliado como script, e o handler de pedido devolve uma string de forma síncrona. A metade de servidor também não tem `console`: lá, `console.log(…)` lança `ReferenceError`. O registro dela é `mundo.registrar`.

O cliente é um script autocontido executado num **motor QuickJS do lado do aplicativo**, fora da janela, com o prelúdio da API. Não use imports de módulo no arquivo de entrada. `document`, `window`, `fetch`, `XMLHttpRequest`, `WebSocket`, `Worker`, `localStorage`, `sessionStorage`, `indexedDB` e o global do Tauri **não existem** nesse ambiente — e não existem porque um contexto de QuickJS não os tem, e não porque alguém os apagou no começo do arquivo: o segundo caso se contorna. Promise, JSON, `setTimeout`, `setInterval` e `console` continuam disponíveis. No navegador, o motor é o mesmo, num Worker isolado: o contrato e os limites são os mesmos nos dois.

O produto encerra o executor ao descarregar o MOD, e com ele os temporizadores, as superfícies, as contribuições, a mídia montada e os arquivos que alguém escolheu.

Fontes: [o contrato da API 6](https://github.com/DATA-AND-DEV/SEELE/blob/v0.16.0/api/v6.json), [o que muda nesta versão](https://github.com/DATA-AND-DEV/SEELE/blob/v0.16.0/api/README.md).

## Manifesto e limites de anúncio

O manifesto é JSON estrito. **Chaves desconhecidas são recusadas, e é de propósito**: `vesion` com um `s` a menos instalaria calado um MOD sem versão, e você nunca ficaria sabendo. Comentários, vírgula final e aspas simples não são JSON válido. Declare números como números, caminhos como strings e `reach` como uma lista de strings.

| Campo | Tipo | Regra |
| --- | --- | --- |
| schema | número inteiro | Use 1 nesta revisão |
| id | string | autor/nome; minúsculas ASCII, dígitos e hífen; uma barra |
| version | string | Versão do autor; o core não a interpreta como SemVer |
| api | número inteiro | 7 para o app 0.17 e o Servidor 2.0; 6 para os apps 0.16 e 0.17 e os Servidores 1.0 e 2.0; 3, 4 ou 5 para o Servidor 0.15 — inclusive em MODs somente de servidor |
| repo | string | Repositório público do pacote |
| reach | string[] | Opcional no parser; declare alcances úteis para quem aceita |
| state | inteiro ou ausente | Versão declarativa dos seus dados; sem migração automática |
| client | string ou ausente | Script de cliente relativo à raiz |
| server | string ou ausente | Script de servidor relativo à raiz |
| arquivos | string[] ou ausente | Mídia que o pacote traz, relativa à raiz; até 16, e nenhum caminho sai da pasta |
| tema | booleano ou ausente | Da API 6 em diante: `true` abre a porta do tema do servidor (`mundo.tema`); exige `server`. `null` não vale como ausente |
| permissoes | lista ou ausente | Só na API 7: as ações que o MOD pede ao servidor, `{ "acao", "nome", "todos" }` cada uma; veja abaixo |

Ao menos `client` ou `server` precisa existir (sem nenhum, `empty`). Uma API fora do conjunto aceito é recusada antes de executar código: acima do teto, como `api-too-new`; fora do conjunto, como `api-too-old`. O indexador aceita `7, 6, 5, 4, 3`, a união das três linhas; cada aplicativo executa só a da linha dele — o app 0.17 a 7 e a 6, o app 0.16 só a 6, e o Servidor 0.15 a 5, a 4 e a 3. Não existe compatibilidade com cliente de API 2.

**As permissões e as ações (API 7).** `permissoes` é uma lista como `[{ "acao": "fechar-mesa", "nome": "Fechar a mesa", "todos": false }]`. Declarar exige `"api": 7`: um manifesto da 6 com a chave é recusado como `permissoes-pedem-api-nova`, e não ignorado. A ação usa só `a-z`, `0-9` e hífen, até 32 bytes; o nome (o que a tela de cargos mostra) não é vazio, até 48 bytes; a ação não se repete; e o teto é de 8 permissões por MOD. Fora disso, `permissoes-invalidas`. A capacidade `acoes` é a última da lista da API 7: o MOD pede uma ação declarada, e o servidor confere o MOD ligado, a ação declarada e a permissão da pessoa antes de chamar a metade de servidor. A recusa volta como `acao-nao-declarada` ou `sem-permissao`. **Na janela, a chamada é `SeeleMods.acao(id, canal, acao, valor)`**, e só existe com a capacidade `acoes`. O `id` que vai é sempre o do próprio MOD, como no `request`. A resposta é a da metade de servidor, como a do `request`, e a recusa dos cargos chega como valor, `{ ok: false, recusa }`. A janela não confere nada: quem decide é o servidor.

**Na metade de servidor, a operação protegida se guarda por `contexto.acao`**, que o host escreve depois do portão dos cargos e que é `null` num `request` comum: `if (contexto.acao !== 'fechar-mesa') return recusa;`. **Nunca por `contexto.permissoes`**, que é informativo e chega também num `request` comum, e nunca pelo corpo do pedido (um `pedido.acao`, um `admin` ou um contexto escrito pelo cliente não decidem nada). O `request` comum continua valendo para as leituras, e para as mutações que outra regra já protege (o dono, o mestre da mesa, a própria pessoa). O exemplo é a fixture `apps/seele-app/testes/mod-de-acoes` do repositório do SEELE. Um MOD da 6 não declara nada disso e continua rodando, sem permissões.

**A chave `tema` é da API 6.** Num pacote de API 3, 4 ou 5 ela é recusada como `malformed`: a linha 0.15 não conhece a chave, e a linha 1 não executa essas APIs, então o pacote não instalaria em build nenhuma. E `"tema": true` sem `server` é recusado como `tema-sem-metade-de-servidor`: quem pinta a aparência é a metade de servidor, e sem ela a porta nunca pintaria nada.

**A API escolhe a linha, inclusive num MOD só de servidor.** O app 0.16 recusa um pacote de API 3, 4 ou 5 inteiro, com ou sem `client`, e a tela aponta o Servidor 0.15 no launcher; o Servidor 0.15 não executa a 6. Quem quer as duas linhas publica dois pacotes, como os três MODs oficiais: a 4.x na API 6, a 3.x na linha legada. A pasta de desenvolvimento selecionada pode ter um nome amigável; a identidade instalada é `autor/nome`.

`arquivos` lista a mídia que o MOD traz para mostrar ou tocar. Só o que está nesta lista é servido, e o tipo vem dos bytes, nunca da extensão. Um caminho que sai da pasta — `../fora.wav`, um caminho absoluto, uma contrabarra, um `C:` — é recusado com a posição dele na lista.

### Limites no anúncio do protocolo

| Campo | Limite |
| --- | --- |
| MODs no conjunto anunciado | 12 |
| id | 96 bytes UTF-8 |
| version | 32 bytes UTF-8 |
| repo | 256 bytes UTF-8 |
| reach: quantidade | 16 itens |
| reach: cada item | 32 bytes UTF-8 na linha 1 (apps 0.16, Servidor 1.0); 48 na linha 2 (app 0.17, Servidor 2.0). Para servir as duas linhas, 32 |

Esses limites são do anúncio, não apenas do parser de JSON. Um manifesto pode passar por uma etapa de leitura e falhar ao ser anunciado. Os alcances de ESTILO e PERFIS já expuseram essa diferença durante testes: uma descrição longa impediu a entrada no servidor até ser corrigida.

```js
const bytes = (texto) => Buffer.byteLength(texto, 'utf8');
for (const alcance of manifesto.reach ?? []) {
  if (bytes(alcance) > 32) throw new Error('Alcance acima de 32 bytes');
}
```

Caracteres acentuados e emoji podem ocupar mais de um byte. Não use `texto.length` como medida de UTF-8. O fragmento acima é para os seus testes, no Node: o executor do MOD não tem `Buffer` nem `TextEncoder`.

`reach` informa o que o pacote declara alcançar; **é declaração, e nada a confere**. O que o MOD alcança de fato é o que a API 6 oferece. Declare a realidade, incluindo integrações externas. Não acrescente campos inventados como `permissions`, `author` ou `description` sem uma mudança oficial do schema.

Fontes: [manifesto](https://github.com/DATA-AND-DEV/SEELE/blob/v0.16.0/crates/seele-proto/src/mods.rs), [o leitor do indexador](https://github.com/DATA-AND-DEV/SEELE-MODS-INDEXER/blob/main/ferramentas/manifesto.py).

## Pedidos e respostas

### Assinatura no cliente

```js
const resposta = await SeeleMods.request('exemplo/contador', 0, { op: 'ler' });
```

| Argumento | Tipo | Origem |
| --- | --- | --- |
| id | string | ID do MOD ativo no servidor |
| canal | número | O canal da pergunta, ou `0` para «nenhum» — o número `0`, e não `null` |
| valor | valor serializável em JSON | Protocolo definido pelo MOD |
| retorno | Promise | O JSON que o seu `aoPedir` devolveu, já lido |

Use IDs reais de canal, do `retrato` ou de um evento. Não fixe `1` supondo que todo servidor tenha o mesmo canal. Um pedido num canal que a pessoa não lê nem chega ao `aoPedir`. `undefined`, funções, referências circulares e BigInt não são uma forma adequada de transportar dados JSON.

### Assinatura no servidor

```js
globalThis.aoPedir = (contextoJSON, pedidoJSON) => {
  const contexto = JSON.parse(contextoJSON);
  const pedido = JSON.parse(pedidoJSON);
  return JSON.stringify({ ok: true, pessoa: contexto.person });
};
```

Retorne uma string contendo JSON válido. Não retorne um objeto cru, `undefined` ou uma Promise. Declarar `async` muda o retorno para Promise e não atende a assinatura síncrona esperada. Uma resposta acima de 1 MiB é recusada.

### Duas formas de falhar, e as duas têm nome

**A promessa rejeita** com um nome da lista fechada da ponte, num `Error` cujo `message` e `erro` são o nome e que leva os outros campos como propriedades: `too-many-requests` (o nono pedido em voo; leva `teto`), `mensagem-grande` (acima de 12 KiB; leva `tipoPedido`, `tamanho` e `teto`), `fila-cheia`, `tipo-desconhecido`, `sessao-encerrada` (a sessão acabou antes da resposta) e `falhou`, o genérico — inclusive a resposta que não chegou em 15 segundos. O motivo de um `falhou` vai ao `seele.log`.

**A promessa resolve com o envelope do anfitrião** quando a chamada não chegou a responder: o seu código lançou, passou de um teto, ou o quintal não cabia. É `{ ok: false, error: "bridge-refused" }`, ou `{ ok: false, error: "quintal-cheio" }` quando a gravação do `dados` passaria do teto.

```js
try {
  const r = await SeeleMods.request(id, 0, { op: 'ler' });
  if (!r.ok) {
    mostrarErro(traduzirCodigo(r.error));
    return;
  }
  desenhar(r);
} catch (falha) {
  mostrarErro('Não foi possível concluir o pedido: ' + falha.erro);
}
```

`mostrarErro`, `traduzirCodigo` e `desenhar` são funções do seu cliente, e não da API. **O seu protocolo não deve se confundir com o envelope**: `{ ok: true, … }` e `{ ok: false, error: 'codigo' }` são convenções recomendadas e usadas nos exemplos, e códigos como `sem-permissao`, `conflito` ou `formato-invalido` são do seu MOD e precisam de mensagens na interface. Se você usa `error` nos seus, `bridge-refused` e `quintal-cheio` são dois nomes que você não pode dar a outra coisa.

### Percurso de uma chamada

A janela serializa o corpo, atribui um número ao pedido e envia pela conexão de controle autenticada. O host confere o acesso de leitura, o MOD ativo, o canal e o conteúdo do pacote. Ele monta o contexto, executa o handler limitado, grava `dados` quando a chamada termina bem e devolve a resposta à conexão que perguntou. A janela remonta os fragmentos e resolve a promessa.

A resposta não aparece no chat, no histórico nem para os outros participantes. Para dizer às outras janelas que algo mudou, a metade de servidor usa `mundo.avisar` dentro da mesma chamada, e cada janela deste MOD recebe o evento `servidor` (ver Rede, relógio, registro, aviso e tema).

## Leitura: o retrato e os eventos da tela

### retrato()

`SeeleUI.retrato()` resolve com o que a janela sabe agora, copiado campo a campo por lista branca:

| Campo | O que é |
| --- | --- |
| eu | O seu id de pessoa, um número |
| servidor.nome | O nome do servidor |
| pessoas | Quem está: `{ id, apelido, falando, mudo }` |
| salas | As salas de voz: `{ id, nome, limite, pessoas, minha }` |
| canais | Os canais: `{ id, nome, aberto }` |
| onde | `computador` ou `celular` |
| regioes | As regiões e camadas que existem nesta casca agora |

```js
const r = await SeeleUI.retrato();
const canal = r.canais.find((c) => c.aberto)?.id ?? 0;
const eu = String(r.eu);
```

**O que fica de fora fica de fora de propósito**: o veredito de conexão segura, a topologia da rede, os aparelhos da máquina, a telemetria, as permissões, e nunca o toque, a chamada, o código e a agenda da sala pessoal. Um campo novo do estado do produto nasce fora do retrato até alguém o escrever na lista.

O contexto autenticado de `aoPedir` continua sendo a autoridade para uma alteração. Não envie `r.eu` no corpo e aceite esse valor como prova de autoria no host: o host já sabe quem é a conexão.

### O que muda chega por evento

O retrato é uma leitura, e não uma assinatura. **O que muda chega por evento**, e um MOD relê o retrato quando um evento diz que vale a pena:

| nome | O que traz |
| --- | --- |
| canal | `canal`: o canal aberto mudou |
| sala | `sala`, ou `null`: você entrou numa sala de voz ou saiu |
| pessoas | `entrou` ou `saiu`, com o id, um número |
| fala | `falando: [id]`, no máximo quatro vezes por segundo |
| lugar | `onde`, `regioes`, `largura`, `altura`, e `regiao` quando é o tamanho do lugar do MOD numa região ou camada |
| servidor | `canal` e `carga`, já lida: o aviso da sua metade de servidor |
| tema | `estado` (`aplicado`, `recusado` ou `nativo`), `previa`, e, recusado, `pares` e `regiao` |

**Nenhum evento carrega toque, chamada, código ou agenda.** O primeiro retrato de uma sessão não é mudança: o MOD lê o retrato quando sobe. O `lugar` sem `regiao` só é dito quando a casca muda de forma, e não ao chegar nem quando a janela muda de tamanho.

### Sem consulta periódica

Até a API 5, uma janela que quisesse ver o que os outros gravaram perguntava ao servidor de tempos em tempos. Na 6, a metade de servidor avisa: `SeeleUI.capacidades()` traz `aviso-do-servidor`, e o evento `servidor` chega a cada janela deste MOD que pode ler o canal do aviso. **O aviso de um pedido pode chegar antes da resposta dele**, à própria janela que pediu: compare a revisão e fique com a mais nova, como o exemplo faz.

Se você ainda precisar de um ciclo — um serviço externo que muda sozinho, por exemplo —, use um só, sem sobrepor pedidos, e capture as rejeições:

```js
let emConsulta = false;
async function consultar() {
  if (emConsulta) return;
  emConsulta = true;
  try {
    const r = await SeeleMods.request(id, 0, { op: 'ler' });
    if (r.ok && r.revisao > revisaoExibida) await desenhar(r);
  } catch (falha) {
    console.warn('a consulta falhou:', falha.erro);
  } finally {
    emConsulta = false;
  }
}
```

### Paginação e visibilidade

Não devolva todas as imagens de todos os membros em cada consulta. Separe metadados de recursos, consulte listas em lotes, carregue a mídia necessária e use a revisão como chave de cache. O limite de 32 pessoas por lote em PERFIS é uma regra daquele MOD, e não da ponte.

Ao trocar de servidor, invalide caches ou inclua o servidor no escopo da chave. Um perfil salvo no servidor A não deve aparecer como se fosse do servidor B.

## Escrita, autorização e concorrência

O contexto chega como JSON escrito pelo servidor:

```json
{"person":"42","channel":7,"sala":null,"admin":false,"write":true}
```

| Campo | Significado |
| --- | --- |
| person | Quem pediu, **em texto**; o id das pessoas no retrato é um número, então compare com `String(id)` |
| channel | O canal do pedido, ou `null` quando a janela mandou `0` |
| sala | A sala de voz em que a pessoa está, segundo a presença que o servidor mantém, ou `null` |
| admin | Se a pessoa administra o servidor, no momento do pedido |
| write | Se ela pode escrever **naquele canal** — a permissão e o papel mínimo do canal, a mesma pergunta que o produto faz para publicar ali; no pedido sem canal, se ela pode escrever nos canais em geral |

Antes da execução, a ponte exige a leitura do canal. Ela informa `write` e `admin`; isso não substitui a política do MOD. Um handler que modifica dados sem checar as permissões apropriadas permitirá a alteração. **A autorização sai daqui, e nunca do pedido**: um MOD que confiasse num campo do pedido deixaria quem escreve a chamada escolher a própria permissão. Não há um campo `host` neste contexto; se a sua política diz «somente host», `admin` autoriza administradores, e precisa ser descrito assim.

### Padrão de alteração segura

1. Faça parse e valide a forma do pedido.
2. Reconheça uma operação conhecida.
3. Confira permissões com o contexto, nunca com campos do corpo.
4. Confira a propriedade do recurso usando `contexto.person`.
5. Valide tamanho, tipo, faixa e revisão.
6. Calcule o próximo estado sem efeitos externos.
7. Grave em `dados`, avise as janelas e retorne a revisão resultante.

```js
if (!ctx.write) return JSON.stringify({ ok: false, error: 'sem-permissao' });
const chave = 'perfil:' + ctx.person;
const atual = JSON.parse(dados[chave] || '{"revisao":0}');
if (pedido.revisao !== atual.revisao) {
  return JSON.stringify({ ok: false, error: 'conflito', revisao: atual.revisao });
}
```

Este fragmento demonstra autorização e revisão, mas ainda precisa validar os campos específicos do perfil. Uma propriedade `person` no corpo deve ser ignorada para autoria, ou conferida contra o contexto quando fizer parte de uma seleção explícita.

### Revisão otimista

Devolva `revisao` nas leituras. O editor envia a revisão sobre a qual trabalhou. O servidor recusa se ela mudou e incrementa ao salvar. Assim, dois editores não apagam silenciosamente o trabalho um do outro. Uma serialização no banco ordena as chamadas, mas sozinha não detecta que uma interface estava editando um estado antigo.

### Prazo e idempotência

Um pedido sem resposta em 15 segundos rejeita com `falhou` na janela. Isso não significa que a alteração foi desfeita. Para ações que não podem se repetir, envie uma chave de operação e grave um recibo junto ao estado; uma repetição da mesma chave devolve o recibo. Delimite a retenção desses recibos para caber no quintal e documente a janela de deduplicação.

Uma resposta `{ ok: false }` é uma resposta normal, e não uma exceção. Se você já modificou `dados` antes de devolvê-la, essas mudanças são gravadas. Valide antes de alterar. Lançar uma exceção evita a gravação de `dados`, mas não reverte rede ou arquivos que já foram escritos.

## Persistência e migrações

`dados` é um objeto de texto para texto. O que estiver nele ao fim da chamada é gravado; o que estava lá chega preenchido.

```js
const config = JSON.parse(dados.config || '{"schema":1,"revisao":0}');
config.revisao += 1;
dados.config = JSON.stringify(config);
```

### Regras de armazenamento

- **Uma chamada é transacional.** Se o seu código lançar no meio, nada é gravado: meia escrita é pior que nenhuma, porque você não teria como saber qual metade entrou.
- **Só texto.** Números viram texto; objetos e listas, `JSON.stringify` e `JSON.parse`.
- **Teto de 256 KiB**, somando chaves e valores em UTF-8, e ele **recusa** em vez de aparar: acima dele, o pedido volta com `{ ok: false, error: "quintal-cheio" }`, e nada é gravado.
- `dados.uso()` diz quantos bytes o quintal ocupa, na conta da gravação, e `dados.teto` diz o teto.
- Leia `dados` dentro dos handlers. A inicialização do script acontece antes de o quintal da chamada ser injetado.
- Não dependa de variáveis globais como memória persistente: o que precisa durar vai para `dados`.
- Não confunda a atomicidade de `dados` com transação de arquivos ou rede.

### Servidor inteiro ou canal

O armazenamento é por MOD e por servidor. Se você quer uma ficha por canal, codifique esse escopo nas chaves. Uma chave como `config` é compartilhada entre pedidos do mesmo MOD em canais diferentes daquele servidor.

```js
const chave = 'canal:' + ctx.channel;
const ficha = JSON.parse(dados[chave] || '{"schema":1,"revisao":0}');
```

A chave de uma pessoa pode usar `ctx.person`, ou uma combinação com `ctx.channel` se o recurso tiver escopo de canal. Valide qualquer parte de chave que venha da pessoa e limite a quantidade total de registros para evitar crescimento ilimitado.

### Migração explícita

Guarde uma versão no próprio estado. A propriedade `state` do manifesto é declarativa: não há uma função de migração chamada automaticamente pelo SEELE.

```js
function migrar(estado) {
  if (estado.schema === 1) {
    return { ...estado, schema: 2, titulo: estado.titulo ?? 'Sem título' };
  }
  if (estado.schema === 2) return estado;
  throw new Error('Versão de dados não suportada');
}
```

Esse exemplo só transforma memória. Antes de persistir, valide invariantes, orçamento do quintal e compatibilidade com o restante do handler. Teste duas execuções consecutivas da migração: a segunda não deve acrescentar dados outra vez. Não converta um formato desconhecido em estado vazio, pois isso pode apagar silenciosamente o conteúdo de uma versão futura.

### Eventos e pedidos no mesmo MOD

O caminho de eventos e o de pedidos entregam o mesmo quintal, cada um na sua chamada. Evite que os dois regravem objetos grandes com base em cópias antigas. Prefira uma responsabilidade clara para cada tipo de alteração e teste a concorrência entre um evento e um pedido.

## Arquivos: ler, escrever, listar e apagar

As operações de arquivo existem somente no runtime do servidor e trabalham com texto.

| Operação | Assinatura | Retorno |
| --- | --- | --- |
| Ler | `arquivos.ler(caminho)` | string ou null |
| Escrever | `arquivos.escrever(caminho, conteudo)` | boolean |
| Listar | `arquivos.listar()` | lista de caminhos |
| Apagar | `arquivos.apagar(caminho)` | boolean |

```js
const caminho = 'fichas/pessoa-' + ctx.person + '.json';
const conteudo = JSON.stringify({ titulo: 'Explorador', nivel: 1 });
if (!arquivos.escrever(caminho, conteudo)) {
  return JSON.stringify({ ok: false, error: 'arquivo-nao-gravado' });
}
const salvo = arquivos.ler(caminho);
```

Não trate `false` como sucesso. `null` na leitura pode indicar ausência ou recusa; apresente uma falha útil e não invente uma causa que a API não forneceu. `listar()` não recebe um diretório como argumento.

### Escopo e caminhos

Tudo fica dentro da pasta de dados do MOD **naquele servidor** — `servidores/<servidor>/mod-data/<autor>/<nome>/`, na pasta de configuração de quem hospeda —, e nada fora. Uma por servidor hospedado, e não uma por máquina: o mesmo MOD em dois servidores não lê o que o outro escreveu. Caminhos absolutos e `..` são recusados, e a recusa é a mesma resposta para todos os casos. Não construa um nome de arquivo a partir de uma URL ou nome de exibição sem validação; um identificador gerado pelo servidor é uma escolha melhor.

**Por que só a sua pasta**, num sistema em que o resto é liberdade: ao lado dela ficam a chave de identidade, os pins e o banco com todas as conversas. Disco inteiro entregaria a chave privada de identidade de quem te hospeda, e aí o que cai não é uma regra de produto — é a garantia de que aquela pessoa é ela mesma.

O teto é 4 MiB por arquivo. Isso não implica um teto agregado de disco para todo o MOD. Defina cotas, quantidade máxima de arquivos e política de retenção no seu código.

### Arquivos não participam da transação do quintal

`arquivos.escrever` e `arquivos.apagar` são efeitos imediatos no disco. Se o handler lançar depois, a gravação de `dados` não ocorrerá, mas o arquivo pode já ter sido escrito ou removido. A rede também não é revertida.

Para substituir um recurso, escreva num caminho novo, verifique o sucesso, atualize a referência no quintal e guarde o caminho antigo numa fila de limpeza. Remova o antigo numa chamada posterior à confirmação dos metadados. Se houver falha entre etapas, prefira um arquivo órfão recuperável a uma referência apontando para um arquivo apagado.

## Imagens grandes, uploads e respostas grandes

### O volume, para imagens

Para a imagem que não cabe numa mensagem existe o **volume**: até 10 MiB, sem passar pelo QuickJS. Os bytes vão por um fluxo próprio, direto ao disco de quem hospeda.

```js
// no servidor, dentro do aoPedir: autoriza um envio de quem pediu, por 30 segundos
volume.esperar(token, 'retratos/coelho.png', ['png', 'jpeg'], 30);  // → true/false
volume.tamanho('retratos/coelho.png');                              // → bytes ou null
volume.servir('retratos/coelho.png');                               // → o caminho servido, ou null
volume.apagar('retratos/coelho.png');                               // → true/false
```

- `volume.esperar` só vale dentro do `aoPedir`: a pessoa que pode enviar é a que está sendo atendida, e quem diz isso é o servidor, e não um argumento.
- Os tipos são `png`, `jpeg`, `webp` e `gif`, conferidos pelos bytes, e não pelo nome. Um HEIC rejeita a janela com `tipo-recusado` e `detectado: 'heic'`.
- Do outro lado, a janela manda com `SeeleUI.enviar(arquivo, token)`, e a promessa resolve depois da gravação. No navegador, `SeeleUI.enviar` não existe.
- As recusas do volume: `sem-espera`, `tipo-recusado`, `formato-desconhecido`, `arquivo-grande-demais`, `nao-gravei`, `incompleto` e `sessao-encerrada`.

**Ler de volta**: toda mídia de servidor aceita `doServidor: { canal, pedido: { …, transporte: 'volume' }, campo }` — a `midia`, o `fundoDeMidia`, o `retrato`, a `pessoa.capa` e o fundo de uma `tela` —, e o seu `aoPedir` responde `{ ok: true, volume: volume.servir(caminho) }`. O `servir` devolve o caminho quando o arquivo existe na sua pasta de volume, e `null` quando não.

### Respostas grandes

Sem `transporte: 'volume'`, a mídia vem em texto no `campo`, em páginas que o produto segue enquanto a resposta trouxer `proximo` — um objeto que o SEELE soma ao pedido seguinte **sem interpretar**: a forma da paginação é sua. A resposta tem teto de 1 MiB e é dividida pelo SEELE em partes de até 10 KiB, respeitando fronteiras UTF-8. Isso é fragmentação do transporte da resposta, e não do seu pedido.

### Um protocolo de upload próprio

Para o que não é imagem, um MOD pode definir seu próprio protocolo em fragmentos: o pedido tem teto de 12 KiB, e base64 ocupa cerca de quatro bytes para cada três. Nomes como `upload-start` e `upload-part` são convenções de PERFIS, e não comandos do SEELE.

| Etapa | Dados | Regra no servidor |
| --- | --- | --- |
| Iniciar | Destino, tipo, comprimento total | Autorizar, limitar tamanho e reservar token |
| Enviar parte | Token, índice, conteúdo | Conferir dono, ordem, prazo e orçamento |
| Finalizar | Última parte ou operação explícita | Conferir tamanho e formato, publicar referência |
| Remover | Recurso e revisão | Autorizar dono, atualizar metadados, limpar depois |

O token precisa estar associado ao `ctx.person`, ao destino e a uma expiração. O servidor deve rejeitar fragmentos de outra pessoa, índices inesperados, excesso de tamanho e conclusão incompleta. Armazene a referência pública apenas quando o conteúdo estiver completo e validado: um upload interrompido não deve substituir o banner anterior por dados parciais.

### Validação e memória

No servidor, valide envelope, limites e assinatura dos bytes; não confie no MIME informado por quem envia. O produto confere o tipo pelos bytes antes de mostrar, e conferir de novo do seu lado continua sendo certo — o produto protege a janela, e não o seu formato. Não interprete SVG ou HTML enviado por participante como conteúdo confiável.

Um limite de 4 MiB no arquivo não garante que um fluxo com várias cópias de base64 e JSON caiba nos 8 MiB do runtime. Somam-se fonte, objetos, estado, strings de entrada e resultado. Teste o pior caso no QuickJS real, e não só no Node.

## Eventos e aoAcontecer

`globalThis.aoAcontecer(momento, cargaJSON)` recebe um nome e uma string JSON. Faça parse dentro do handler. `momento` é **o mesmo nome que o protocolo usa**, para que um relatório de defeito que diga `MessageReceived` ache a mesma palavra no protocolo, no contrato da API e no seu código.

```js
globalThis.aoAcontecer = (momento, cargaJSON) => {
  if (momento !== 'MessageReceived') return;
  const evento = JSON.parse(cargaJSON);
  if (!evento.texto.startsWith('$contar')) return;
  dados.mensagensContadas = String(Number(dados.mensagensContadas || '0') + 1);
  mundo.registrar('mensagem contada');
};
```

O exemplo conta e registra; ele não envia uma mensagem de resposta ao chat. Não há uma função de mandar mensagem no runtime.

### Os quatro momentos entregues

| momento | Campos da carga JSON |
| --- | --- |
| PersonJoined | sala, pessoa, apelido |
| PersonLeft | sala, pessoa |
| MessageReceived | canal, mensagem, autor, texto |
| MessageRemoved | canal, mensagem |

**O `MessageEdited` saiu na 6**: o produto não tem verbo de editar mensagem, e um momento que nunca chega é pior que um que não existe. `PersonJoined` e `PersonLeft` incluem o contexto de sala de voz; não os transforme numa regra de cadastro permanente. `MessageRemoved` não inclui o texto anterior: se o seu MOD precisa de informação que não está no evento, ele precisa de uma estratégia compatível com o que realmente recebe.

### Falhas de evento

O despachante executa eventos em sequência: uma chamada lenta atrasa os eventos dos MODs seguintes. **Um `aoAcontecer` que lança desliga o MOD, e o desligamento é gravado** — um bug que lança em todo evento tira o seu MOD do ar até alguém religá-lo. Não use exceção como retorno normal para uma situação esperada, como uma mensagem que não é um comando.

Um MOD sem `aoAcontecer` é válido quando a metade de servidor existe para outra coisa. O inverso também pode ser válido, mas um pedido a um servidor sem `aoPedir` não cria o handler.

## Rede, relógio, registro, aviso e tema

```js
const resposta = mundo.buscar('https://servico.example/dados.json');  // texto ou null
const agora = mundo.agora();                                           // segundos desde 1970
mundo.registrar('o que aconteceu');                                    // vai para o log de quem hospeda
mundo.avisar({ canal: 3, carga: { revisao: 7 } });                     // → { ok } ou { ok: false, erro }
mundo.tema({ fundo: '#0b1d2a', texto: '#f5f1e6' });                    // → { ok } ou { ok: false, erro }
```

### mundo.buscar(url)

Um GET síncrono a uma URL `http` ou `https`, que retorna texto ou `null`. Não recebe método, cabeçalhos, corpo nem token: não invente um segundo argumento como se fosse `fetch`. `file://` é recusado, senão a rede faria o que a pasta impede no disco. O endereço `.example` é ilustrativo: use um endpoint conhecido no seu teste, e trate JSON inválido antes de persistir ou desenhar.

**Teto de 2 segundos por busca**, e ele existe por um motivo que vale você saber: o servidor roda um momento por vez, então uma busca lenta sua atrasa **todos os outros MODs** e a fila de eventos atrás deles. Uma resposta acima de 4 MiB é descartada. O retorno não traz status HTTP nem cabeçalhos: valide o conteúdo esperado.

A busca sai da máquina de quem hospeda. Não deixe um participante informar uma URL arbitrária: ele poderia alcançar serviços internos da rede de quem hospeda. Não inclua segredos em URLs, logs, exemplos ou pacotes; a API não oferece cofre de credenciais.

### mundo.agora() e mundo.registrar(texto)

`mundo.agora()` devolve segundos desde a época Unix, pelo relógio de quem hospeda. Não confunda com os milissegundos de `Date.now()`, e não o use como único mecanismo de ordenação de revisões.

`mundo.registrar` escreve uma linha INFO no registro de quem hospeda, sempre com o seu `id` num campo próprio (`mod_id=`), cortada em 500 caracteres. Você não escolhe o prefixo: uma linha cuja origem você pudesse forjar seria uma linha que ninguém pode usar para decidir qual MOD desligar. Evite registrar mensagens privadas, conteúdo de arquivos, base64 ou credenciais.

### mundo.avisar({ canal?, carga })

Avisa as janelas deste MOD, e cada uma recebe o evento `servidor` com a `carga` já lida. Vai a quem pode ler o canal (sem canal, ao servidor inteiro), inclusive à janela de quem pediu — que pode recebê-lo antes da resposta do próprio pedido. **Só vale se a chamada terminar e o quintal gravar**; dentro de uma chamada, vale o mais novo de cada canal. Até 1 KiB por aviso, 4 por segundo por MOD e 16 canais por chamada; o excedente fica, por canal, só o mais novo, e sai quando a janela abre. As recusas vêm como valor: `aviso-invalido`, `aviso-grande-demais` e `avisos-demais`.

### mundo.tema(valores | null)

Publica o tema do servidor, só no MOD cujo manifesto declara `"tema": true`. O detalhe está em O tema do servidor.

## Executor, superfícies e ciclo de vida

### O que existe no executor

| | O que faz |
| --- | --- |
| `SeeleMods.request(id, canal, valor)` | Pergunta à sua metade de servidor, que responde pelo `aoPedir` |
| `SeeleUI.retrato()` | O que a janela sabe, por lista branca |
| `SeeleUI.superficies.criar(descricao)` | Uma superfície: `pagina`, `dialogo`, `folha` ou `aviso`; devolve um punho |
| `SeeleUI.superficies.avisar(texto, tom)` | Um aviso de vida curta; `tom` é `normal` (3,5 s) ou `erro` (10 s) |
| `SeeleUI.contribuicoes.registrar(pedido)` | Entra num ponto da interface do SEELE, e resolve com `{ handle }` |
| `SeeleUI.tema(valores, { previa: true, superficie })` | A prévia de um tema, só nesta máquina |
| `SeeleUI.aoEvento(fn)` | O ouvinte dos eventos; um só, e o último vence |
| `SeeleUI.pedaco`, `SeeleUI.soltar`, `SeeleUI.enviar` | O arquivo que alguém escolheu, onde a plataforma o tem |
| `SeeleUI.capacidades()` | O que este build oferece ao seu MOD, nesta plataforma |
| `console` | Cada chamada vira uma linha no `seele.log` da máquina que roda o MOD |
| `setTimeout`, `setInterval` e os dois `clear` | A fachada do relógio do anfitrião, com até 256 de pé; acima disso devolvem `0`, que é o «não deu» |

### O ciclo de vida de uma superfície

A `descricao` do `criar` leva `id`, `tipo`, `titulo` e, quando servem, `modal`, `tamanho: { largura }`, `focoInicial` (a `chave` do campo que recebe o foco), `lado`, `imersiva` e `visivel: false` (criar sem mostrar).

- `criar` com um `id` que já está de pé **reabre aquela**, sem recriar e sem trocar o título (quem troca é `titulo(texto)`), e devolve um punho para ela.
- `montar(arvore)` declara o conteúdo inteiro. Chamar de novo substitui, e o produto reconcilia por `chave`: o que não mudou não é tocado.
- `atualizar(chave, arvore)` troca um nó e o que está sob ele, numa mensagem própria. É assim que uma ficha que não cabe nos 12 KiB de uma mensagem se monta: um esqueleto, e uma parte por vez.
- `ocultar()` tira da vista e mantém montada; `mostrar()` traz de volta.
- `fechar()` tira do documento e **guarda** o que ela tem: `montar` numa fechada vale, e aparece quando ela volta. O som de uma superfície fechada para; ocultar não para.
- `descartar()` acaba com ela, e o id fica livre. **Fechada continua de pé**: ela conta no teto de 12 superfícies do MOD. Quem não vai reabrir descarta.
- **A saída da sessão descarta tudo, sem perguntar** e sem mandar `fechar`.

Uma montagem cuja árvore tem o que não coube ou não serve **monta o que coube** e rejeita com `nos-recusados`, que leva `recusados`, a conta, e `amostra`: até oito `{ motivo, chave, forma, propriedade, tipo, classe }`. **A fundura também é teto** (16 níveis numa superfície, 6 num cartão): o galho que passa dela é recusado com o motivo `teto-de-fundura`.

### Os formulários, e o que está sujo

Dentro de um `formulario`, cada forma de entrada declara `chave`, `rotulo` e `valor`, e pode declarar as **regras** que o produto confere antes de deixar o `submeter` sair — `obrigatorio`, `tamanhoMaximo`, e, só no `numero`, `minimo`, `maximo` e `inteiro` —, o `erro`, a frase do MOD, e o `inicial`, o valor gravado. A frase da regra é do produto, o campo é marcado, e o foco vai a ele. O `formulario` declara `primario` e `secundario` (o produto monta os dois botões) e `emProgresso` (o primário ignora o segundo clique).

A recusa da sua metade de servidor volta ao campo que a causou por `punho.formulario.erros({ chave: 'frase' })`; `{}` limpa. Uma chave que não é de um campo à vista é recusada como `chave-desconhecida`.

**O sujo é do produto.** Um campo cujo valor difere do `inicial` suja a superfície, e voltar ao gravado a limpa. `suja(true)` soma o que o MOD sabe e o produto não vê. **Uma superfície suja sempre pergunta antes de fechar**, inclusive quando quem pede é o próprio MOD, e a resposta da pessoa vence: ao descartar, o MOD recebe `fechar` com `descartou: true`.

- **Sem `inicial`, o inicial é o valor da primeira montagem do campo**, e não muda quando o MOD regrava o valor. Um controle que o MOD regrava declara `inicial` igual ao `valor`; sem isso, depois da primeira gravação, a superfície fica suja para sempre.
- **Para fechar sem perguntar**, declare o gravado como `inicial`, ou feche com `fechar('descartar')`: é o MOD dizendo que o rascunho pode sair.

### Os eventos da interface

| nome | Quando | O que traz |
| --- | --- | --- |
| campo | Digitou num `campo` ou `textoLongo` | `chave`, `valor` |
| escolha | Mudou uma `escolha` | `chave`, `valor`, em texto |
| numero | Mexeu num `numero` ou `deslizante` | `chave`, `valor`, um número |
| marca | Mudou uma `marca` ou um `interruptor` | `chave`, `valor`, booleano |
| cor | Mudou uma `cor` | `chave`, `valor` |
| botao | Apertou um `botao` (com `confirmar`, só depois do sim) | `chave` |
| submeter | Enviou um `formulario` que passou nas regras | `chave`, `valores` |
| aba | Escolheu uma aba | `chave` das `abas`, `valor` da aba |
| arquivo | Escolheu, ou desistiu de escolher | `chave`, `resultado` (`cancelado` ou `falhou`, com `porque`), e `arquivo: { id, papel, bytes }` |
| traco | Arrastou numa `tela` | `chave`, `fase`, `x`, `y`, `alvo` |
| midia | O estado de uma mídia mudou | `chave`, `estado` (`tocando`, `pausada`, `terminou`, `recusada` ou `falhou`), `porque` |
| link | Apertou um `link` | `chave`, `aberto`, e `porque` quando não abriu |
| tela | O fundo de uma `tela` não carregou | `chave`, `estado: 'fundo-falhou'`, `porque` |
| acao | Apertou a ação principal de uma contribuição | `acao`, e o alvo que o produto escreveu (`pessoa`, `canal`), em texto |
| fechar-pedido | A pessoa pediu para fechar uma superfície suja | `superficie`, `porque`, `temAlteracoes` |
| fechar | Uma superfície fechou | `superficie`, `porque`, e `descartou: true` quando a pessoa descartou |
| contribuicao | Uma contribuição não coube, ou não tem onde entrar | `ponto`, `destino`, `recusados`, `amostra` e `motivo` (`orcamento` ou `regiao-ausente`) |

Cancelar o seletor de arquivo **é uma resposta**: trate-a. Silêncio ali é o seu MOD parecendo travado. Compare chaves como **texto**: `Number('peca-3')` é `NaN`, e `NaN` não é igual a nada.

### O som

Uma `midia` com som é tocada pelo produto, e o botão TOCAR/PAUSAR é dele.

- **`tocando` vale quando muda.** Um som que a pessoa pausou não volta sozinho no redesenho seguinte que o declare `tocando: true`. A exceção é o som que terminou: `tocando: true` sobre ele toca de novo, do começo.
- **`repetir: true` toca em laço**, sem redesenho, e o MOD não recebe `terminou` dele.
- **Fora da tela, a declaração não liga o som**: ela é recusada, com o motivo, e um som que tocava ali é pausado. Fechar uma superfície cala o som dela; ocultar, não.
- O som decodificado tem teto de 64 MiB por superfície, por contribuição e nos cartões de um MOD — pouco menos de três minutos de estéreo a 48 kHz. Acima dele, o som chega como `recusada`, com os números no `porque`.
- No celular, som de MOD só com a tela acesa.

### No celular e no navegador

A mesma API, o mesmo motor e os mesmos limites. O que muda é a casca, e o MOD sabe dela por `retrato.onde`, `retrato.regioes` e o evento `lugar`. No celular, sete das oito regiões existem; o `status.barra` não, e uma contribuição para ele é aceita e recebe `regiao-ausente`. O diálogo modal ocupa a sessão acima da faixa de voz e das abas; o não modal fica embaixo, até 85% da altura dela; a folha é uma folha de baixo, que cresce com o conteúdo. No toque, um dedo sobre uma figura com `chave` arrasta, e um dedo no vazio de uma `tela` rola a página. No navegador, `SeeleUI.enviar` e o seletor de arquivo não existem.

### Descarregamento

O produto para o executor e retira as superfícies, as contribuições, a mídia montada, a prévia do tema e os arquivos escolhidos. Temporizadores e promessas do executor não sobrevivem à saída da sessão, e você não precisa registrar nada para que isso aconteça. **Depois da revogação, um pedido seu recebe recusa, e não silêncio**: quem sai no meio de um envio recebe `sessao-encerrada` em vez de uma promessa que nunca resolve.

## Contribuições, capa e citação

Uma contribuição entra num **ponto com nome** da interface do SEELE — nunca num seletor de CSS, num nó do documento ou em HTML de texto.

| ponto | Modos | O que é |
| --- | --- | --- |
| servidor.navegacao | substituir, adicionar | A lista do servidor; `listarNaBarra: false` tira a entrada da lista de quem não tem uso para ela (no celular, da aba SERVIDOR) |
| canal.cabecalho | substituir, adicionar | O cabeçalho do canal |
| canal.item | adicionar | Um canal da lista, por `alvo` |
| compositor.ferramentas | adicionar | Ao lado do campo de mensagem |
| chamada.palco | substituir, adicionar | Uma camada sobre a chamada |
| servidor.aparencia | substituir | A aparência do servidor: na 6, o MOD de janela não a pinta por ela |
| pessoa.identidade, pessoa.detalhes, pessoa.acoes | adicionar | Na pessoa, por `alvo` |
| pessoa.cartao | substituir, adicionar | O cartão da pessoa na lista, por `alvo`, numa gramática menor: nada que receba foco ou clique |
| pessoa.avatar, pessoa.capa | substituir | A foto e a capa da pessoa, por `alvo`, com `conteudo: { doServidor }` |
| sala.acoes | adicionar | Uma ação na sala de voz, por `alvo` |

O `pedido` do `registrar` leva `ponto`, `modo`, e, quando servem, `alvo` (o id da pessoa, do canal ou da sala), `conteudo` (a árvore, ou a mídia nos pontos de imagem), `prioridade` (de -100 a 100: ordena duas substituições do mesmo ponto, e quem escolhe é a pessoa), `rotulo`, `nomeAcessivel` e `acaoPrincipal`. A `acaoPrincipal` é o nome que volta no evento `acao` quando a pessoa aperta, com o alvo que o **produto** escreveu: trocar o que se desenha não troca a identidade.

- **`atualizar(handle, conteudo)` troca sem sair**, e a linha não volta à nativa no meio. Resolve com `true`, ou com `false` quando o punho não está mais de pé — e aí é registrar de novo. Registrar de novo o que está de pé é `contribuicao-ja-existe`.
- **O produto não revoga por presença.** A contribuição de uma pessoa que saiu do servidor continua de pé até o MOD a revogar; o evento `pessoas` com `saiu` é a hora.
- **Os tetos**: 128 contribuições sem alvo de pé, e 256 alvos por ponto.
- **Uma contribuição para uma região que a casca não tem** é aceita e não aparece: o MOD recebe o evento `contribuicao` com `regiao-ausente`, e a aba DIAGNÓSTICO conta.
- **O que o produto garante**: o apelido verificado fica à vista, num lugar que o MOD não cobre; uma região substituída continua carregando os itens do núcleo; ao revogar, a apresentação nativa é recalculada; «usar apresentação padrão» existe no controle nativo de MODs.
- `classes` são de superfície: numa contribuição, elas não pintam nada, e o evento `contribuicao` conta isso.

As recusas: `ponto-desconhecido` (leva `pontoPedido`, o que veio, e `pontos`, os que a API tem), `modo-recusado`, `sem-alvo`, `conteudo-invalido`, `teto-de-contribuicoes`, `teto-de-alvos` (leva `teto`), `contribuicao-ja-existe` e `contribuicao-de-outro-mod`.

### O cartão de uma pessoa

```js
await SeeleUI.contribuicoes.registrar({
  ponto: 'pessoa.cartao',
  modo: 'adicionar',
  alvo: 7, // o id da pessoa, como o retrato o dá
  conteudo: [
    { forma: 'titulo', chave: 'nome', dentro: 'Lia da Torre' },
    { forma: 'texto', chave: 'pronome', dentro: 'ela/dela' },
  ],
});
```

Você não escolhe posição, tamanho, tipografia nem vizinho, e não alcança nenhum outro nó. A gramática é menor: nada que receba foco ou clique, porque a linha da lista já tem um botão do produto, e dividir a ordem de tabulação com um terceiro é o tipo de coisa que ninguém consegue depurar depois. Uma forma recusada é contada, e chega pelo evento `contribuicao`.

### A capa, e a citação

A capa de uma pessoa é o ponto `pessoa.capa`, em `substituir`, por `alvo`, com `conteudo: { doServidor }` — a mesma forma do `pessoa.avatar`. O produto a pinta no cartão da chamada e no perfil, sobre placas que mantêm o texto e os controles legíveis. Animada até seis ao mesmo tempo, escolhidas pela vista; com a preferência de movimento reduzido do sistema, ou fora da vista, um quadro parado.

**Citar, em vez de carregar de novo.** `fundoDeMidia: { daPessoa: 'capa' }` numa `caixa` e `retrato({ daPessoa: 'avatar' })` usam a imagem que a contribuição da pessoa já carregou — sem pedido novo, e contada uma vez. Num cartão, a pessoa é a do destino. Com `pessoa: id`, é a que o MOD nomeia, numa superfície também, se ela estiver na sessão. Fora da sessão, o fundo fica liso e o retrato na inicial, sem recusa. Quando a pessoa troca a foto e o MOD faz `atualizar` na contribuição, quem cita mostra a nova sem remontar.

### A chamada

O ponto `chamada.palco` é uma camada sobre a chamada, com a grade de vídeo do produto por baixo. Ele começa escondido: VER O PALCO, na barra da chamada, o traz; VER A GRADE o devolve, sem desmontar; sair da sala o desmonta. O pedido feito do palco leva `contexto.sala`, e o MOD sabe o tamanho pelo evento `lugar`, com `regiao: 'chamada.palco'` — 0 × 0 escondido.

## Estilos, classes e composição

`estilo` numa forma declara propriedades por categoria, **validadas uma a uma e montadas de partes conferidas — nunca texto de CSS**: cor e transparência (`cor`, `fundo`, `opacidade`), preenchimento e gradiente, borda e raio, sombra, tipografia, layout (`direcao`, `alinhar`, `distribuir`, `quebra`, `crescer`, `encolher`, `base`, `intervalo`, `colunas`, `largura`, `altura` e os mínimos e máximos), transformação (`girar`, `escalar`, `mover`), recorte, transição e animação (`nenhuma`, `pulso`, `aurora`, `brilho`, `flutuar`). Uma cor é `#rgb`, `#rrggbb`, `#rrggbbaa`, ou um token do tema — `{ tema: 'acento' }` —, que acompanha o tema em vigor.

**O que não serve é contado, e não some calado.** Uma propriedade que o validador não conhece, ou um valor que não serve, é contado como recusa — e, numa propriedade composta (`borda`, `sombra`, `gradiente`, `mover`, `transicao`, `animacao`), também a parte declarada que não serve: a propriedade sai com o padrão naquela parte, e a recusa chega ao MOD como `nos-recusados`, com a propriedade na amostra. Um número fora do intervalo não é erro: ele é preso no limite.

### Classes

**Classes são de superfície**: `punho.classes({ nome: { base, sobre, foco, ativo, desligado, invalido, escolhido, consultas } })`, e o nó pede a classe com `classe`. O seletor é escrito pelo produto e preso àquela superfície: duas superfícies com a classe `cartao` não se alcançam, e nenhuma alcança o SEELE. Os estados são seletores — sem eles, uma cor de passar o mouse custaria um evento por movimento. `consultas: [{ ateLargura, estilo }]` aplica o estilo até uma largura, **a da superfície**, e não a da janela: um diálogo de 400 px numa janela de 1400 é estreito.

**Fora do alcance de qualquer estilo**: `url(...)`, `@import`, HTML ativo, seletor que alcance fora da superfície, `keyframes` do MOD e família de tipo livre. O movimento reduzido do sistema vale onde quer que um MOD apareça, e, no celular, nenhum estilo desce um controle abaixo de 44 px nem um campo abaixo de 16 px de letra.

### Compor lado a lado

Três propriedades, e as três precisam estar juntas. É o erro mais comum, e ele não avisa — a declaração é aceita e o desenho sai empilhado.

```js
{ forma: 'caixa', estilo: { direcao: 'linha', intervalo: 20, quebra: 'sim', alinhar: 'inicio' }, dentro: [
  { forma: 'caixa', estilo: { crescer: 1, base: 0, larguraMinima: 300 }, dentro: [formulario] },
  { forma: 'caixa', estilo: { crescer: 1, base: 0, larguraMinima: 260 }, dentro: [previa] },
] }
```

- **`direcao: 'linha'`** faz a caixa ser uma linha.
- **`base: 0`** é o que divide. Sem ele, cada coluna parte do tamanho do próprio conteúdo; o par não cabe, e a quebra as põe uma debaixo da outra.
- **`larguraMinima`** é o que faz a quebra acontecer pelo motivo certo: enquanto as duas mínimas couberem, elas dividem o espaço; quando não couberem, a linha quebra sozinha.

`pilha` é uma coluna com a régua da superfície e `grade` são colunas iguais. Use-as quando for isso que você quer; `caixa` com `direcao` é para quando a proporção é sua.

### Resumir texto sem cortar linhas

`estilo: { linhasMaximas: 2 }` mostra até duas linhas com reticências, sem alterar o texto guardado. Aceita um inteiro de 1 a 20. Use numa caixa contendo somente texto, nunca para esconder controles, e ofereça um caminho para o conteúdo completo.

### O que o produto já desenha por você

A casca de uma superfície — cabeçalho com o título, a origem, a saída, o rodapé de ações fixas, a rolagem, o foco — é do produto, e os controles saem com a tipografia, a altura e os estados desta casa: um `campo` é rótulo em cima e caixa embaixo; um `botao` tem a altura dos botões do SEELE, e `variante: 'primaria'` é bloco sólido; uma `marca` ou um `interruptor` são controle e texto lado a lado; uma `cor` traz amostra e hexadecimal juntos; `acoes` com `fixas: true` leva os botões ao rodapé. O que sobra para você é a composição e a personalidade do seu conteúdo.

## O tema do servidor

O tema é de **duas portas**, uma de cada lado:

- **a do servidor**: o manifesto declara `"tema": true`, e a metade de servidor publica o tema com `mundo.tema(valores)`. Um tema por servidor: o primeiro MOD com a porta, enquanto estiver ligado. A tela de aceite mostra a porta.
- **a de quem vê**: o ponto `servidor.aparencia`. «O SEELE desenha» tira o tema daquele servidor nesta máquina.

`mundo.tema` devolve `{ ok: true }` quando a forma é válida e o tema foi publicado — **e não quando ele foi aplicado**: o contraste é conferido por cada janela, que conta o desfecho pelo evento `tema`. As recusas vêm como valor, nunca como exceção: `sem-porta-de-tema`, `tema-de-outro-mod`, `tema-invalido`, `tema-grande-demais`, `chave-desconhecida`, `valor-invalido` e `regiao-desconhecida`, com a `chave`. O servidor guarda o tema, e ele sobrevive ao reinício; `null` o tira. O servidor não confere quem pediu: leia `contexto.admin` se quiser restringir.

### As chaves

São uma lista fechada de nomes do contrato, e nunca nomes de CSS:

| Chave | Valor |
| --- | --- |
| fundo, painel, texto, apagado, acento, borda | Cor `#rrggbb` |
| densidade | `compacta` ou `confortavel` |
| fonte | `mono` ou `sans` |
| arredondamento | Inteiro de 0 a 24 |
| brilho | Booleano |
| modo | `claro` ou `escuro`, que tem de concordar com o fundo |
| regioes | `{ '<região>': { fundo, texto, apagado, acento, borda } }`, as oito regiões, conferidas uma a uma |

`densidade` e `fonte` são escolhas, e não números, porque uma cor o produto confere e um espaçamento não: `0px` deixaria a sessão ilegível sem violar regra nenhuma. `fonte` escolhe entre as duas pilhas que o produto declara, e não é família livre. O produto escreve o `px` do arredondamento e monta a sombra do brilho a partir de um token dele.

### O contraste

**O contraste é conferido pela casca, ao aplicar**, em todos os pares que o produto desenha: o texto e o acento a 4,5:1 sobre o fundo e o painel, o apagado a 3:1. O acento fraco e o segundo apagado são do produto, derivados do seu tema. As cores de estado do produto — o fósforo, o azul e o vermelho — também: sob um tema, a casca as deriva das suas superfícies, e quando nenhuma luminosidade serve, o tema é recusado com o par. Cada janela diz o desfecho pelo evento `tema`: `aplicado`, `recusado` (com os `pares`, e a `regiao` quando quem recusou foi uma região) ou `nativo` (quem vê escolheu «o SEELE desenha»).

**Nenhum item do núcleo de confiança é alcançado pelo tema**: o MUDO, o fone, o «no ar», o SAIR e o veredito da conexão leem tokens próprios.

### A prévia

A metade de cliente só faz a prévia: `SeeleUI.tema(valores, { previa: true, superficie: id })` pinta só nesta máquina, com o selo «prévia não publicada», e sai quando a superfície fecha ou com `SeeleUI.tema(null, { previa: true })`. Uma prévia recusada rejeita com `contraste`, com os `pares`. O cálculo que a casca faz para derivar e recusar está, por inteiro, no guia do repositório do SEELE (ver Fontes), como uma função que você copia e chama antes de publicar.

## Todos os limites em um lugar

Valores do código desta revisão, separados de decisões dos MODs de exemplo.

| Recurso | Limite ou comportamento | Responsável |
| --- | --- | --- |
| Uma mensagem da janela | 12 KiB UTF-8; acima, `mensagem-grande` | Janela |
| Pedidos em voo | 8; o nono, `too-many-requests` | Janela |
| Espera de resposta | 15 segundos; depois, `falhou` | Janela |
| Resposta do handler | 1 MiB | Runtime |
| Fragmento de resposta | até 10 KiB UTF-8 | Host |
| Quintal (`dados`) | 256 KiB, chaves + valores; acima, `quintal-cheio` | Runtime |
| Arquivo próprio | 4 MiB por arquivo | arquivos |
| Imagem pelo volume | 10 MiB | volume |
| Resposta de `mundo.buscar` | 4 MiB de texto | mundo |
| Prazo de `mundo.buscar` | 2 segundos por busca | mundo |
| Linha de `mundo.registrar` | 500 caracteres | mundo |
| Aviso do servidor | 1 KiB, 4 por segundo por MOD, 16 canais por chamada | mundo |
| Memória JS no servidor | 8 MiB por MOD; a chamada morre, o contexto sobrevive | QuickJS |
| Trabalho no servidor | cerca de 500 consultas, perto de 225 ms; a chamada morre | QuickJS |
| Conjunto anunciado | até 12 MODs | Protocolo |
| Alcances | até 16 itens, 32 bytes cada | Protocolo |
| Arquivos do pacote | até 16 | Manifesto |
| Superfícies de pé | 12 por MOD; avisos, 4; folhas à vista, 3 | Janela |
| Numa superfície | 4096 nós, 16 de fundura, 128 campos, 4 telas, 24 mídias | Janela |
| Mídia numa superfície | um bolso de 24 MiB que a `midia`, o `retrato` e o `fundoDeMidia` dividem; a `midia`, até 10 MiB dele | Janela |
| Som decodificado | 64 MiB de pé por superfície, por contribuição e nos cartões | Janela |
| Figuras numa tela | 256, até o teto da mensagem | Janela |
| Contribuições | 128 sem alvo de pé; 256 alvos por ponto | Janela |
| Capas animadas | 6 ao mesmo tempo | Janela |
| Classes | 64 por superfície, 4 consultas por classe, 512 regras | Janela |
| Arquivo escolhido | 10 MiB, até 4 de pé por vez | Janela |
| Pedaço de arquivo escolhido | 65535 bytes, múltiplo de 3 | Janela |
| Temporizadores | 256 de pé | Executor |
| `console` | 32 linhas de uma vez, depois 4 por segundo; 512 caracteres por linha | Executor |

Os 225 ms não são de relógio: são de trabalho. Uma máquina lenta te dá o mesmo tanto de operações e demora mais, em vez de te cortar antes. Um laço infinito não derruba a sala: ele derruba a sua chamada. Mas um `aoAcontecer` que falha **desliga** o MOD.

O limite de tamanho de arquivo não torna seguro ocupar indefinidamente o disco, e o limite de resposta não torna barato carregar todas as imagens a cada leitura. Defina limites menores conforme o produto.

### Regras dos exemplos, não da plataforma

O servidor de PERFIS mantém limites próprios de upload, lotes de até 32 pessoas e um número máximo de perfis. ESTILO mantém regras próprias de validação das opções salvas. Esses valores pertencem aos MODs e podem evoluir: não os descreva como constantes da API.

## Recusas e diagnóstico

Há três classes de falha: o pacote não carrega; o transporte não conclui; a regra do MOD recusa uma operação. Registre qual classe falhou antes de mudar o código.

### O pacote não carrega

| Sinal | Significado provável | Próximo passo |
| --- | --- | --- |
| malformed | JSON, campo ou tipo inválido no manifesto, ou a chave `tema` abaixo da API 6 | Validar chaves, tipos e sintaxe |
| malformed-id | `id` fora de `autor/nome` | Corrigir o `id`: minúsculas, dígitos, hífen e uma barra |
| schema-too-new | `schema` maior do que o lido | Declarar `schema: 1` |
| empty | Nem `client` nem `server` | Declarar ao menos uma metade |
| tema-sem-metade-de-servidor | `"tema": true` sem `server` | Acrescentar a metade de servidor, ou tirar a chave |
| api-too-old | API fora do conjunto: no indexador, abaixo da 3; no app 0.16, abaixo da 6 | Portar para a 6, ou hospedar pelo Servidor 0.15 |
| api-too-new | API pedida superior ao build | Usar um build compatível ou a API suportada |

### A lista fechada da janela

**O erro que o MOD recebe é um nome de uma lista fechada.** A frase fica na tela, e o motivo no `seele.log`. O prelúdio rejeita com um `Error` cujo `message` e `erro` são o nome, e que leva os outros campos como propriedades:

```js
try {
  await SeeleUI.enviar(arquivo.id, token);
} catch (falha) {
  if (falha.erro === 'tipo-recusado') dizer('não é imagem que o SEELE lê: ' + falha.detectado);
  else dizer(falha.erro);
}
```

| Grupo | Os nomes |
| --- | --- |
| ponte | `falhou` (o genérico), `too-many-requests`, `fila-cheia`, `mensagem-grande`, `tipo-desconhecido`, `sessao-encerrada` |
| volume | `sem-espera`, `tipo-recusado`, `formato-desconhecido`, `arquivo-grande-demais`, `nao-gravei`, `incompleto`, `sessao-encerrada` |
| arquivo | `banco-indisponivel`, `arquivo-nao-esta-de-pe`, `arquivo-de-outro-mod`, `arquivo-ilegivel`, `caminho-invalido`, `papel-nao-serve`, `arquivos-demais-de-pe` |
| superfícies | `tipo-desconhecido`, `chave-desconhecida`, `orcamento`, `forma-desconhecida`, `nos-recusados`, `superficie-desconhecida`, `sem-previa`, `contraste`, `teto-de-folhas`, `teto-de-superficies` |
| contribuições | `ponto-desconhecido`, `modo-recusado`, `sem-alvo`, `conteudo-invalido`, `teto-de-contribuicoes`, `teto-de-alvos`, `contribuicao-ja-existe`, `contribuicao-de-outro-mod` |
| tema, no servidor | `sem-porta-de-tema`, `tema-de-outro-mod`, `tema-invalido`, `tema-grande-demais`, `chave-desconhecida`, `valor-invalido`, `regiao-desconhecida` — em `mundo.tema`, como valor |

**Um nome fora da lista chega como `falhou`, sem campos.** Não há outro caminho: a janela confere a lista na fronteira. O envelope `{ ok: false, error }` de um pedido é outra coisa: `bridge-refused` e `quintal-cheio` são do anfitrião, e o resto é do seu MOD (ver Pedidos e respostas).

### bridge-refused

A mesma resposta pode representar MOD desligado, falta de leitura, canal desconhecido, conteúdo divergente, ausência de metade de servidor ou de `aoPedir`, erro do handler ou falha de persistência. O cliente recebe um nome estável; os detalhes ficam no log de quem hospeda. Não adivinhe a causa só pelo código genérico.

### MOD instalado, mas sem interface

Confira se está ligado no servidor, se a conexão aceitou o conjunto, se o conteúdo instalado corresponde ao exigido, se `client` aponta para um arquivo existente e se o script inicializa sem exceção. Confira se o cliente usa apenas o que `SeeleUI.capacidades()` diz que existe, se a árvore contém formas aceitas e se a contribuição não recebeu `regiao-ausente`.

### O `console`, e onde ele escreve

A metade de cliente tem `console`, e cada chamada vira **uma linha no `seele.log` da máquina que roda o MOD**: `console.debug` e `trace` em DEBUG, que o `seele.log` não grava por padrão; `log`, `info`, `dir` e `table` em INFO; `warn` em WARN; `error` e o `assert` cuja condição é falsa em ERROR. `group`, `time`, `count` e `clear` existem e não fazem nada. O erro que o seu código não pegou também chega, em ERROR, com o texto e a pilha quando o lançado é um `Error`.

```text
… WARN seele_app: console do MOD mod_id=fulano/meu-mod texto="o retrato não veio"
```

Para ver só o seu MOD — o `console`, as mídias que a janela recusou, as montagens que não couberam e o que o servidor disse dele, que usam o mesmo campo:

```sh
grep "mod_id=fulano/meu-mod" ~/.config/seele/seele.log
```

O arquivo fica em `~/.config/seele/` no macOS e no Linux (ou em `$SEELE_HOME`, quando definido) e em `%APPDATA%\tech.datadev.seele\` no Windows. Os erros da metade de servidor vão ao `seele.log` de quem hospeda: `mod threw: …` com o que ela lançou e onde, ou `mod failed: …` quando o motor recusou o que o MOD lhe deu.

### A aba DIAGNÓSTICO e o modo de desenvolvedor

Em Configurações › MODs › Diagnóstico, QUEM PINTA CADA LUGAR mostra os pontos onde um MOD pode entrar, quem desenha cada um agora, quem pediu e perdeu, a escolha desta máquina e a mídia em uso, com o motivo de cada recusa. As contribuições que não têm onde entrar também são contadas ali. «Nenhum MOD usa este lugar agora» é a resposta que você mais precisa ler quando o seu não aparece. Na mesma aba, MODO DE DESENVOLVEDOR contorna na tela cada lugar onde um MOD pode entrar, com o nome do ponto como a API o chama — é o que você escreve em `ponto`.

### Servidor não aceita entrada após ligar

Confira os limites do anúncio, em especial cada item de `reach`. Um pacote pode ser legível em disco e ainda produzir um anúncio recusado. Use o fluxo suportado para desligar e corrigir num ambiente de teste. Não recomende apagar o banco de alguém como solução padrão.

### Atualização não aparece

Compare ID, versão e hash anunciado com o pacote instalado. Confira se o catálogo fixou o commit novo, se houve reavaliação e se a cópia exigida pelo host foi atualizada. Um push isolado não basta.

Reproduza o defeito com uma sequência curta, resultado esperado, resultado observado, versão do app, commit ou hash do pacote, papel da pessoa e indicação de teste nativo ou simulado.

## Testes e matriz de compatibilidade

### Camada 1 — validação estática

```sh
node --check cliente/main.js
node --check servidor/main.js
```

Valide também o manifesto, os caminhos, a existência dos arquivos, o comprimento UTF-8 dos alcances e o ID. Se houver build, execute-o antes dos testes e verifique que o arquivo gerado corresponde ao fonte versionado. Um teste que só comprova que um arquivo existe não verifica autorização nem persistência.

### Camada 2 — handlers

Instancie um contexto novo para cada pedido, mas reutilize o armazenamento simulado entre chamadas. Isso revela dependência indevida de globais. Simule gravação de arquivos que retorna `false`, dados antigos, erro no parse e limites.

| Área | Casos relevantes |
| --- | --- |
| Identidade | O corpo forja `person` ou `admin`; o contexto precisa prevalecer |
| Permissões | Quem só lê tenta escrever; um membro tenta administrar |
| Concorrência | Dois pedidos com a mesma revisão |
| Isolamento | O mesmo MOD em dois servidores ou canais, conforme a política |
| Persistência | Um runtime novo lê o estado anterior |
| Tamanho | Limite exato, acima do limite, Unicode, quintal cheio |
| Aviso | A escrita avisa; a recusa não avisa |
| Imagens | MIME falso, SVG, arquivo inválido, upload incompleto |
| Falhas | O disco falha antes ou depois do quintal; prazo e repetição |
| Migração | Estado antigo, atual e versão desconhecida |

Uma VM do Node é um teste de lógica, e não uma reprodução do QuickJS. Execute também no runtime real com o limite de memória quando o MOD manipular estado grande, imagens ou strings extensas.

### Camada 3 — interface

Execute o cliente com uma ponte simulada que responda como o anfitrião: as mensagens, as respostas com número e as recusas pelo nome. Verifique o que é montado, a reconciliação por `chave`, os tetos, as mensagens de erro, a leitura autorizada, a superfície suja, o fim do executor e a retirada na saída. Marque a prévia como simulada. Não deixe um endpoint que aceita identidade arbitrária virar um backend de produção.

### Camada 4 — SEELE nativo

Teste host e participante reais. Observe instalação, anúncio, aceite, hash, carregamento, leitura por outra pessoa, o aviso chegando à outra janela, desconexão, reinício e atualização. Teste também no celular quando o MOD desenha em superfícies ou depende do volume.

### Matriz a publicar no README

Informe a versão do SEELE, o sistema operacional, o papel testado, o tipo de pacote, o commit do MOD e quais caminhos passaram. Não declare «funciona em todas as plataformas» só porque funcionou num navegador do computador. Teste as superfícies em janelas estreitas e largas, com outros MODs ativos.

## Segurança, privacidade e coexistência

O cliente executa num executor fora da janela e só pode apresentar o que a API declarativa oferece. `reach` descreve o alcance do pacote; avaliação e isolamento não substituem validação e minimização de dados. O código deve fazer apenas o necessário para o recurso apresentado.

### Fronteiras de confiança

| Origem | Como tratar |
| --- | --- |
| Contexto de `aoPedir` | Autoridade de identidade e permissões da sessão |
| Corpo do pedido | Entrada não confiável, validar integralmente |
| Texto de perfil ou chat | Dados de participante, enviar como string em `dentro` |
| Resposta HTTP externa | Dados externos, conferir forma e limites |
| Arquivo enviado | Bytes não confiáveis, não confiar só no MIME |
| Árvore declarativa | Apenas as formas da API, sem HTML |

Não exponha a lista inteira de dados só porque a resposta chega só a quem pediu. Uma operação de leitura deve filtrar campos e recursos conforme a política. Guarde apenas o que precisa e explique para quem usa o que é público no servidor. Lembre que um aviso vai a toda janela que pode ler o canal dele: não ponha numa carga de aviso o que não poderia estar numa leitura.

Evite URLs de mídia arbitrárias, pois podem causar requisições de participantes a terceiros. Quando o host consulta serviços externos, declare os destinos e a finalidade. Não faça telemetria oculta nem coleta de dados sem relação com o recurso.

### Regras de convivência

Use chaves próprias no estado e consulte apenas os dados necessários. As superfícies e contribuições são do MOD; painéis nativos, controles de áudio, ações de moderação e o núcleo de confiança pertencem ao SEELE.

Um MOD de tema e um MOD de perfis podem coexistir. O tema de um servidor tem um dono só: o primeiro MOD com a porta, enquanto estiver ligado; outro recebe `tema-de-outro-mod`. Duas substituições do mesmo ponto não se misturam: quem escolhe qual vale é a pessoa.

### Limites da privacidade

O host executa o código de servidor e mantém o banco e os arquivos dele. A ponte autenticada evita confiar numa pessoa forjada no corpo e mantém a resposta fora do histórico comum, mas não transforma o host num ambiente que não possa acessar os próprios dados. Descreva a proteção real, sem prometer criptografia ou sigilo que o MOD não implementa.

## Exemplo executável e receitas

O Contador contém somente [manifesto](exemplos/contador/mod.json), [cliente](exemplos/contador/cliente/main.js) e [servidor](exemplos/contador/servidor/main.js). Baixe o [ZIP](exemplos/contador.zip) da API 6.

### O que ele demonstra

- Uma entrada em `servidor.navegacao` que abre uma página pelo evento `acao`.
- Uma página que reabre pelo mesmo `id`, e que pode ser montada fechada.
- Leitura e escrita pelo canal `0`, de escopo de servidor.
- Persistência, revisão e autorização no servidor, com a recusa dita na página.
- Um botão que pergunta antes, pelo `confirmar`.
- O aviso do servidor que atualiza as outras janelas sem consulta periódica, e a revisão mais nova vencendo quando o aviso chega antes da resposta.

O exemplo não implementa uploads, paginação nem recibos de idempotência. Foi exercitado no motor e no anfitrião do produto: a página abre, soma, recusa o ZERAR de quem não administra, acompanha o aviso de outra pessoa, relê no conflito e zera para quem administra.

### Receita: tema compartilhado

Declare `"tema": true` e uma metade de servidor. Guarde as cores e a revisão no servidor; uma escrita exige `contexto.admin` e termina em `mundo.tema(valores)`. Trate cada recusa de `mundo.tema` como valor, e não marque o tema como aplicado antes de o evento `tema` dizer `aplicado` em cada janela. O editor é uma superfície: `cor` para cada cor, `escolha` para densidade e fonte, a prévia com `SeeleUI.tema(valores, { previa: true, superficie })`, e um `formulario` para gravar.

### Receita: perfil por servidor

Use `contexto.person` como dono e mantenha a autorização no servidor. A foto e a capa são `pessoa.avatar` e `pessoa.capa`, com `conteudo: { doServidor }` lido pelo volume; o resumo é `pessoa.cartao`; a ficha completa é uma folha ou um diálogo, com um `formulario` e `formulario.erros` para as recusas do servidor. Revogue a contribuição de quem saiu pelo evento `pessoas`.

### Receita: ficha por canal

Use o canal autenticado como escopo e filtre as fichas pelo papel e pela identidade. A ficha é uma superfície montada por partes com `atualizar`, quando passa dos 12 KiB; rolagens e tabuleiro são uma `tela` com figuras pegáveis; o som da cena vem de `arquivos` do pacote. Não exponha notas privadas num aviso: ele vai a toda janela que lê o canal.

### Projetos para leitura

[ESTILO](https://github.com/DATA-AND-DEV/ESTILO), [PERFIS](https://github.com/DATA-AND-DEV/PERFIS) e [MESA](https://github.com/DATA-AND-DEV/MESA) mantêm a lógica de servidor e os dados anteriores, e saem em duas linhas: a 4.x na API 6, a 3.x no Servidor 0.15. São projetos completos, e mais complexos que um primeiro MOD.

## A linha do Servidor 0.15

As APIs 3, 4 e 5 continuam rodando no **Servidor 0.15**, que o launcher oferece a quem hospeda nessa linha. O indexador aceita pacotes delas, e os três MODs oficiais mantêm a 3.x ali, que ainda pode ganhar consertos.

| | Servidor 2.0 (app 0.17) | Servidor 1.0 (app 0.16) | Servidor 0.15 |
| --- | --- | --- | --- |
| APIs executadas | 7 e 6 | 6 | 5, 4 e 3 |
| Desenho | Superfícies e contribuições | Superfícies e contribuições | `SeeleUI.regiao`, a faixa de 240 px, e, desde a 4, superfícies e contribuições |
| Cartão na lista | O ponto `pessoa.cartao` | O ponto `pessoa.cartao` | `SeeleUI.cartoes` |
| Leitura | `SeeleUI.retrato()` | `SeeleUI.retrato()` | `SeeleMods.snapshot()` |
| Tema que todos veem | A metade de servidor, `mundo.tema` | A metade de servidor, `mundo.tema` | A janela, `SeeleUI.tema(valores)` |
| Chave `tema` no manifesto | Aceita | Aceita | Recusada como `malformed` |
| Chave `permissoes` e capacidade `acoes` | Só na API 7 | Recusada (`malformed`, ou `api-too-new` sem a chave) | Não existe: a linha só executa as APIs 5, 4 e 3 |

**Um MOD de uma linha antiga não roda na outra com o mesmo pacote.** Os apps 0.16 e 0.17 recusam as APIs 3 a 5 inteiras, o Servidor 0.15 não executa a 6 nem a 7, e o app 0.16 não executa a 7. Só o pacote da 6 atravessa as linhas 1 e 2. Quem precisa da linha 0.15 e de uma das linhas 1 ou 2 mantém dois pacotes, cada um com a sua `api` (de 3 a 5 para a 0.15, 6 para a 1 e a 2), e cada um passa pela avaliação. Quem precisa só das linhas 1 e 2 publica um pacote da 6; um pacote da 7 serve só a linha 2.

### Portar da 5 para a 6

1. Troque `"api": 5` por `"api": 6` no manifesto.
2. Troque `SeeleMods.snapshot()` por `SeeleUI.retrato()`, e leia as mudanças pelos eventos da tela em vez de consultar de tempos em tempos.
3. Mova o que estava em `SeeleUI.regiao` para uma superfície, aberta por uma entrada em `servidor.navegacao` — ou para o ponto que corresponde ao que ela mostrava.
4. Troque `SeeleUI.cartoes` pelo ponto `pessoa.cartao`, com `alvo`.
5. Mova o tema publicado para a metade de servidor: `"tema": true` e `mundo.tema`. A janela fica com a prévia.
6. Troque o `painel` por `folha`, e confira os eventos que o seu servidor esperava: o `MessageEdited` saiu.
7. Teste o pacote novo no app 0.16, e mantenha o antigo, se precisar, para o Servidor 0.15.

### O guia das versões anteriores

O guia da linha 0.15, com a região, o `snapshot`, os cartões e o tema pela janela, e o contador de exemplo na API 3, continua legível no repositório do indexador, na revisão em que foi publicado: [o guia da API 4](https://github.com/DATA-AND-DEV/SEELE-MODS-INDEXER/blob/dab1ed315d5f/docs/guia-criacao-mods.md).

## Fontes, manutenção e glossário

Esta revisão foi construída a partir do contrato congelado da API 6, do guia de MODs do repositório do SEELE, do prelúdio do motor, do anfitrião dos MODs e do indexador. Quando um comentário diverge de uma função executável, o guia descreve a função. As afirmações de implementação devem ser revalidadas ao atualizar o runtime.

### Fontes primárias

- [O contrato da API 6](https://github.com/DATA-AND-DEV/SEELE/blob/v0.16.0/api/v6.json)
- [O que muda para quem escreve MOD](https://github.com/DATA-AND-DEV/SEELE/blob/v0.16.0/api/README.md)
- [Como se faz um MOD, o guia do repositório](https://github.com/DATA-AND-DEV/SEELE/blob/v0.16.0/docs/como-se-faz-um-mod.md)
- [Manifesto e hash de conteúdo](https://github.com/DATA-AND-DEV/SEELE/blob/v0.16.0/crates/seele-proto/src/mods.rs)
- [O prelúdio do executor](https://github.com/DATA-AND-DEV/SEELE/blob/v0.16.0/crates/seele-motor/src/preludio.rs)
- [O anfitrião da metade de servidor](https://github.com/DATA-AND-DEV/SEELE/blob/v0.16.0/crates/seele-server/src/mods/mod.rs)
- [Indexador e processo de publicação](https://github.com/DATA-AND-DEV/SEELE-MODS-INDEXER)

### Glossário

| Termo | Significado |
| --- | --- |
| Manifesto | `mod.json`, que identifica o pacote e os seus scripts |
| Host | A máquina, ou a pessoa, que hospeda o servidor |
| Cliente do MOD | O executor QuickJS próprio da sessão, fora da janela |
| Superfície | Uma janela do produto que o MOD declara: página, diálogo, folha ou aviso |
| Contribuição | O que o MOD põe num ponto com nome da interface do SEELE |
| Ponto | Um lugar com nome onde uma contribuição entra, como `servidor.navegacao` |
| Retrato | A leitura do que a janela sabe, por lista branca |
| Aviso do servidor | O que `mundo.avisar` manda às janelas do MOD, pelo evento `servidor` |
| Handler | Função chamada pelo runtime para um pedido ou evento |
| Quintal | O objeto `dados`, persistido como chave e valor em texto |
| Revisão | O número do seu estado para detectar alterações concorrentes |
| Idempotência | Repetir uma operação sem aplicar o efeito duas vezes |
| Hash de conteúdo | A identidade calculada sobre os caminhos e os bytes do pacote |
| Descarregamento | A parada do executor e a retirada das superfícies, contribuições, mídia e arquivos pelo produto |
| Avaliação | A revisão de um commit e do conteúdo para publicação no catálogo |

### Como manter este guia

Atualize a fonte Markdown, regenere a página, execute os testes do exemplo e da navegação, confira os links e abra a página em larguras diferentes. Se um novo evento ou método for implementado, inclua a assinatura, a origem dos dados, a autorização, o retorno, as recusas, os limites e um exemplo testável. **O exemplo é de uma API que o aplicativo atual executa**: numa ruptura, um exemplo aceito pelo indexador e recusado pelo aplicativo atual ensina errado. O contador continua na API 6 **de propósito**: a API oferecida é a 7, e a 6 é a compatibilidade intencional, porque roda nos apps 0.16 e 0.17 (linhas 1 e 2). Só mude o exemplo para a 7 se abrir mão da linha 1.

O indexador aceita novos pacotes nas APIs 7, 6, 5, 4 e 3: a 7 e a 6, da linha do Servidor 2.0, a 6 também da linha do Servidor 1.0, e as 5, 4 e 3, da linha 0.15, porque o launcher ainda oferece aquela linha. Versões antigas já publicadas permanecem no histórico append-only apenas quando ID, versão e hash correspondem ao catálogo anterior; isso não as torna executáveis no SEELE atual. O catálogo assinado precisa ser regenerado junto da publicação, anunciando `api_oferecida: 7` e `apis_aceitas: [7, 6, 5, 4, 3]`.

O hash não é o SHA-256 do ZIP. O algoritmo de conteúdo ordena caminhos e inclui contagem de arquivos, comprimentos dos caminhos, bytes dos caminhos, comprimentos dos conteúdos e bytes dos conteúdos, usando comprimentos inteiros de 64 bits em big-endian. Use as ferramentas oficiais e os vetores do indexador para reproduzi-lo; não crie um cálculo simplificado num script de release.
