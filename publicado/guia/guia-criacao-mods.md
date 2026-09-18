# Como criar MODs para o SEELE

Guia prático e referência técnica. Revisão de 18/09/2026. Manifesto schema 1, API de MOD 2. A documentação distingue funcionalidades executáveis, convenções de autoria e contratos declarados que ainda não têm uma ligação completa no runtime.

## Comece por aqui

Um MOD é um pacote de JavaScript que acrescenta comportamento ao SEELE. Ele pode mudar a interface, guardar informações próprias no servidor ou combinar os dois. Não é necessário alterar o Rust do aplicativo para criar um contador, um painel, um tema compartilhado ou uma ficha de personagem.

Você entrega uma pasta com um manifesto e pelo menos um script. O manifesto apresenta o pacote; o script faz o trabalho. Quando o MOD tem uma interface e dados compartilhados, a janela mostra os controles e o servidor decide o que pode ser lido ou alterado.

### Escolha seu caminho

- Nunca criou um MOD? Siga os capítulos do guia, em ordem. Você terminará com um contador compartilhado instalável.
- Já conhece JavaScript? Abra Referência técnica para consultar assinaturas, tipos, limites, autorização e ciclo de vida.
- Quer publicar? Primeiro teste a pasta exata que será distribuída; depois consulte Publicação e atualizações.
- Está corrigindo um problema? Consulte Diagnóstico. Uma instalação bem-sucedida não prova que o MOD está ativo ou executando.

### O que você precisa

Um editor de texto e conhecimentos básicos de JavaScript, JSON, funções, objetos e tratamento de erros. Para a interface, HTML/DOM e CSS ajudam. Node.js é útil para verificar sintaxe e rodar testes, mas não é uma dependência exigida pelo runtime do MOD. Git é recomendado para versionar e publicar. Rust e Cargo só são necessários se você for compilar o SEELE ou usar os testes nativos de runtime.

Você não precisa contratar um backend para guardar o estado de um MOD: o servidor SEELE fornece armazenamento próprio. Integrações externas podem precisar de infraestrutura adicional, mas isso é uma escolha do seu produto.

### Três ideias fundamentais

1. O código de cliente roda na janela de cada participante. Uma variável nele não é compartilhada com outras pessoas.
2. O código de servidor roda no computador de quem hospeda. É ali que ficam as regras de autorização e o estado comum.
3. A comunicação tem pedido e resposta. O resultado chega somente à pessoa que fez o pedido; os outros clientes precisam consultar novamente para enxergar alterações.

### Exemplo completo

O [contador de exemplo](exemplos/contador.zip) tem três arquivos, usa a API 2 e inclui leitura, alteração com revisão, autorização administrativa e limpeza da interface. Extraia o ZIP antes de instalar. O código é didático e não depende de Estilo, Perfis ou Mesa.

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
  "api": 2,
  "repo": "https://github.com/DATA-AND-DEV/SEELE-MODS-INDEXER",
  "reach": ["dom", "contador compartilhado"],
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

O contador é um exercício pequeno com um fluxo real: ler estado, pedir uma alteração e mostrar o resultado confirmado pelo servidor.

### Passo 1 — baixe e examine

Baixe o ZIP no capítulo inicial. Leia `mod.json`, `cliente/main.js` e `servidor/main.js`. Os mesmos arquivos estão disponíveis individualmente na seção Exemplo executável da referência.

No cliente, `SeeleMods.snapshot()` encontra um canal e `SeeleMods.request()` transporta o pedido. No servidor, `aoPedir()` recebe o contexto autenticado, valida a operação e grava o contador em `dados.contador`.

### Passo 2 — entenda a leitura

O cliente envia um objeto como este:

```json
{"op":"ler"}
```

O servidor responde com um objeto serializado:

```json
{"ok":true,"schema":1,"valor":0,"revisao":0}
```

Os nomes `op`, `ler`, `valor`, `revisao` e `ok` são escolhas deste exemplo. A plataforma não fornece uma função universal de “incrementar contador”. Ela entrega um canal de pedidos; o protocolo de aplicação pertence ao MOD.

### Passo 3 — entenda a alteração

```json
{"op":"incrementar","revisao":0}
```

O servidor compara a revisão recebida com a revisão salva, confere a permissão atual e somente então altera o estado. Se outra pessoa já mudou o contador, a operação recebe `conflito`. O cliente busca o estado novamente e permite que a pessoa decida se quer repetir a ação.

O exemplo não repete uma mutação automaticamente após um timeout. Um timeout pode ocorrer depois de uma gravação. Repetir cegamente um incremento poderia contar duas vezes. A revisão protege este exemplo de aplicar novamente a mesma versão antiga, mas um produto com operações complexas deve considerar recibos e chaves de idempotência.

### Passo 4 — experimente

Depois de instalar e ligar em um servidor de teste, encontre Contador abaixo dos canais. Some uma unidade, feche e reabra a sessão, e confirme a persistência. Conecte outra pessoa e confira a atualização periódica. Tente zerar com uma pessoa sem administração. A recusa precisa acontecer no servidor, mesmo que alguém altere os controles da janela.

### Passo 5 — transforme a ideia

Troque o contador por seu estado, mantendo as mesmas responsabilidades: o cliente apresenta; o servidor valida; `dados` persiste; a resposta confirma. Acrescente um campo por vez e teste um caso válido, um inválido e um concorrente antes de aumentar a interface.

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
| Salvamento | Confirmação depois da resposta |
| Segundo participante | Alteração aparece após a consulta |
| Sem permissão | Servidor recusa; estado não muda |
| Dois editores | Conflito explicado, sem sobrescrita silenciosa |
| Saída/desligamento | Timers, estilos e interface retirados |
| Reconexão | Estado salvo continua; interface não duplica |
| Troca de servidor | Dados e tema do anterior não vazam |
| Pacote alterado | Divergência de conteúdo tratada explicitamente |

Um simulador de API no navegador ajuda a testar a interface. Ele não prova autenticação real, consentimento, restrições do WebView, hash de conteúdo ou comportamento do servidor nativo. Registre separadamente os testes simulados e os testes no SEELE.

## Desenhe como parte do SEELE

O padrão visual usa Saira Condensed nos títulos e IBM Plex Mono nos dados e controles. Reutilize os tokens existentes, em vez de trazer fontes remotas ou uma folha global que redefina tudo.

| Token | Uso |
| --- | --- |
| --seele-display | Família dos títulos |
| --seele-mono | Família de dados/controles |
| --seele-negro-absoluto | Fundo principal |
| --seele-negro-painel | Fundo de painel |
| --seele-osso | Texto principal |
| --seele-rotulo-painel | Texto secundário |
| --seele-laranja-nerv | Destaque |
| --seele-linha-forte | Bordas |

Use uma grade de 8, 16 e 24 px, bordas retas, títulos claros e controles que caibam em janelas menores. Um botão como “Atualizar MOD” precisa quebrar ou reorganizar o layout sem sair do cartão. Não use dimensões fixas que presumam um monitor grande.

### Interface acessível

Use botões reais para ações e links para navegação. Dê nome aos campos com `label`, mantenha foco visível e explique estados com texto. Um erro não pode depender apenas de uma borda vermelha. Um indicador de voz não pode desaparecer ao acrescentar uma personalização.

Diálogos devem ter nome, botão Fechar, navegação por teclado e retorno de foco. Use `textContent` para nomes, biografias e dados recebidos. Nunca interprete texto de participante como HTML. Valide cores e opções antes de aplicá-las a CSS.

### Movimento e identidade

Um banner animado pode aparecer no cartão completo e na lista lateral, mas precisa respeitar `prefers-reduced-motion` e oferecer pausa. GIF, APNG e WebP podem conter animação; desabilitar apenas uma animação CSS não pausa a mídia. Uma solução simples é ocultar/substituir a imagem enquanto a pausa estiver ativa.

Ao personalizar a lista de pessoas, preserve identidade nativa, ações de moderação, estado de fala e informações de acessibilidade. O nome visual do MOD pode coexistir com o nome original. Não associe perfis apenas por nomes duplicados. Quando não houver um identificador estável exposto naquele elemento, use um diretório com os IDs do snapshot ou deixe a linha sem decoração.

Os seletores do DOM são detalhes de implementação, não uma API de componentes estável. Teste seu MOD a cada versão do aplicativo que você pretende suportar.

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

A versão verificada nesta revisão declara `MOD_API_VERSION = 2` e `MANIFEST_SCHEMA = 1`. A ponte de pedidos entrou com o protocolo 6. São três números diferentes: versão do manifesto, versão da API do MOD e versão do protocolo de rede. A versão do seu pacote, por exemplo `1.0.0`, é um quarto identificador.

### Funções que você pode usar

| Ambiente | Superfície executável |
| --- | --- |
| Janela | globalThis.SeeleMods.snapshot() |
| Janela | globalThis.SeeleMods.request(id, canal, objeto) |
| Janela | DOM, CSSOM e APIs oferecidas pelo WebView, limitadas pela CSP |
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

Na janela, o carregador usa scripts de módulo. Ainda assim, empacotar em um arquivo final autocontido simplifica a revisão e evita dependências ausentes. Imports de rede não são um mecanismo de distribuição aceito pela CSP.

Fontes desta seção: [API 2](https://github.com/DATA-AND-DEV/SEELE/blob/6a525d19c9967e0527be7d845ee16712b3f4d9e8/api/v2.json), [runtime](https://github.com/DATA-AND-DEV/SEELE/blob/6a525d19c9967e0527be7d845ee16712b3f4d9e8/crates/seele-server/src/mods/mod.rs) e [ponte da janela](https://github.com/DATA-AND-DEV/SEELE/blob/6a525d19c9967e0527be7d845ee16712b3f4d9e8/apps/seele-app/ui/base.js).

## Manifesto e limites de anúncio

O manifesto é JSON estrito. Chaves desconhecidas são recusadas. Comentários, vírgula final e aspas simples não são JSON válido. Declare números como números, caminhos como strings e `reach` como uma lista de strings.

| Campo | Tipo | Regra |
| --- | --- | --- |
| schema | número inteiro | Use 1 nesta revisão |
| id | string | autor/nome; minúsculas ASCII, dígitos e hífen; uma barra |
| version | string | Versão do autor; o core não a interpreta como SemVer |
| api | número inteiro | Use 2 para request/aoPedir |
| repo | string | Repositório público do pacote |
| reach | string[] | Opcional no parser; declare alcances úteis para quem aceita |
| state | inteiro ou ausente | Versão declarativa dos seus dados; sem migração automática |
| client | string ou ausente | Script de cliente relativo à raiz |
| server | string ou ausente | Script de servidor relativo à raiz |

Ao menos `client` ou `server` precisa existir. Uma API mais nova que a oferecida pelo aplicativo é recusada. O ID da pasta instalada deve concordar com o manifesto. A pasta de desenvolvimento selecionada pode ter um nome amigável; a identidade instalada é `autor/nome`.

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

Fontes: [manifesto](https://github.com/DATA-AND-DEV/SEELE/blob/6a525d19c9967e0527be7d845ee16712b3f4d9e8/crates/seele-proto/src/mods.rs), [limites do controle](https://github.com/DATA-AND-DEV/SEELE/blob/6a525d19c9967e0527be7d845ee16712b3f4d9e8/crates/seele-proto/src/control.rs).

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

Fonte: [execução autenticada e fragmentação](https://github.com/DATA-AND-DEV/SEELE/blob/6a525d19c9967e0527be7d845ee16712b3f4d9e8/crates/seele-server/src/mods/pedidos.rs).

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
  if (emConsulta || encerrado) return;
  emConsulta = true;
  try {
    const r = await SeeleMods.request(id, canal, {op:'ler'});
    if (!encerrado && r.ok && r.revisao !== revisaoExibida) desenhar(r);
  } finally {
    emConsulta = false;
  }
}
```

Adapte o tratamento de erro antes de usar esse fragmento. Uma chamada disparada por timer precisa capturar rejeições. Evite redesenhar o formulário inteiro enquanto alguém digita; guarde um rascunho local e separe a revisão editada da revisão recebida.

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

`dados` é um objeto de chaves e valores textuais fornecido ao handler. O estado pertence ao MOD no banco do servidor. A API 2 carrega esse estado para uma nova execução de pedido e o grava depois de uma conclusão bem-sucedida, quando há mudança.

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

Fonte: [runtime e coleta](https://github.com/DATA-AND-DEV/SEELE/blob/6a525d19c9967e0527be7d845ee16712b3f4d9e8/crates/seele-server/src/mods/mod.rs), [persistência dos pedidos](https://github.com/DATA-AND-DEV/SEELE/blob/6a525d19c9967e0527be7d845ee16712b3f4d9e8/crates/seele-server/src/mods/pedidos.rs).

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

Fonte: [operações de arquivos](https://github.com/DATA-AND-DEV/SEELE/blob/6a525d19c9967e0527be7d845ee16712b3f4d9e8/crates/seele-server/src/mods/arquivos.rs).

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

No cliente, limite bytes, formato e dimensões antes de enviar. No servidor, valide novamente o envelope, limites e assinatura do arquivo. Confiar apenas no MIME informado pelo navegador não é suficiente. A validação do cliente melhora a experiência, mas pode ser contornada.

No Perfis de referência, o limite de interface é 256 KiB por imagem e as dimensões são verificadas no cliente; isso não deve ser apresentado como prova de decodificação completa no host. Para uma garantia forte de dimensões/conteúdo no servidor, é necessária uma validação adequada naquele lado.

Não interprete SVG ou HTML enviado por participante como conteúdo confiável. Para imagens, prefira formatos previstos pelo MOD e aplique-os em `img` com texto alternativo. Se usar data URI, confira o prefixo e o conteúdo antes de renderizar. Uma resposta do seu servidor ainda pode conter dados originados de outra pessoa.

### Memória e desempenho

Um limite de 4 MiB no arquivo não garante que um fluxo com várias cópias de base64 e JSON caiba em 8 MiB de runtime. Somam-se fonte, objetos, estado, strings de entrada, buffers e resultado. Teste o pior caso no QuickJS real, não só no Node.

Use metadados leves na listagem; carregue imagens separadamente; limite o cache; evite reatribuir `src` ou recriar o elemento de uma animação em toda atualização. Na lista lateral de pessoas, reutilize os cartões e preserve os controles nativos.

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

Fonte: [momento_de e despacho](https://github.com/DATA-AND-DEV/SEELE/blob/6a525d19c9967e0527be7d845ee16712b3f4d9e8/crates/seele-server/src/mods/despacho.rs).

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

A CSP do aplicativo autoriza a ponte IPC e recursos previstos, incluindo os scripts do protocolo do MOD. Ela não libera fetch arbitrário para a internet. Faça integrações externas pelo lado de servidor dentro dos limites reais. O simulador web pode ter uma CSP diferente; valide no WebView antes de declarar compatibilidade.

Fonte: [mundo.rs](https://github.com/DATA-AND-DEV/SEELE/blob/6a525d19c9967e0527be7d845ee16712b3f4d9e8/crates/seele-server/src/mods/mundo.rs), [CSP do app](https://github.com/DATA-AND-DEV/SEELE/blob/6a525d19c9967e0527be7d845ee16712b3f4d9e8/apps/seele-app/tauri.conf.json).

## DOM, CSS e ciclo de vida

A metade de cliente tem acesso à janela. Isso possibilita personalizações amplas, mas exige cuidado com coexistência e limpeza. Não redefina seletores genéricos como `button`, `body` e `h1` globalmente para estilizar apenas seu painel.

### Montagem

Use uma classe ou atributo com o namespace do MOD, mantenha a referência à sua raiz e confira se já existe uma instância montada. Um ponto usado pelos exemplos é `#tela-sessao .painel-canais .canais-rolagem`. Ele deve ser tratado como um seletor compatível com os builds testados, não como um contrato permanente.

A interface nativa pode redesenhar uma lista. Um elemento removido por esse redesenho pode precisar ser remontado. Prefira uma checagem limitada e idempotente; um MutationObserver deve ter debounce e ignorar alterações que ele mesmo já resolveu.

### CSS e CSP

Uma tag `style` inline pode ser bloqueada. CSSOM, folhas adotadas quando suportadas e alteração de propriedades são opções já usadas pelos MODs. Teste o mecanismo no WebView. Não remova ou relaxe a CSP do produto para fazer seu MOD funcionar.

```js
const folha = new CSSStyleSheet();
document.adoptedStyleSheets = [...document.adoptedStyleSheets, folha];
folha.insertRule('.meu-mod-painel { padding:16px; border:1px solid var(--seele-linha-forte); }');
```

Esse fragmento depende do suporte a folhas adotadas. Tenha um fallback testado se a sua matriz de plataformas exigir. Na limpeza, remova somente a folha ou regras que seu MOD criou.

### Descarregamento

O carregador emite `seele-mod-unload` com `event.detail` igual ao ID do pacote. Limpe timers, observadores, listeners, nós de interface, CSS e propriedades que alterou.

```js
function descarregar(evento) {
  if (evento.detail !== 'autor/meu-mod') return;
  encerrado = true;
  clearInterval(timer);
  observer?.disconnect();
  painel.remove();
  globalThis.removeEventListener('seele-mod-unload', descarregar);
}
globalThis.addEventListener('seele-mod-unload', descarregar);
```

`timer`, `observer`, `painel` e `encerrado` são referências mantidas pelo seu código. Uma chamada já em andamento pode concluir depois da limpeza; cheque `encerrado` após cada `await` antes de tocar no DOM. Remover a tag de script não desfaz listeners ou efeitos que ela criou.

Para temas globais, guarde o valor e a prioridade originais das propriedades alteradas e restaure ao sair. Se dois MODs alteram a mesma propriedade, defina uma política de coexistência; restaurar cegamente uma cópia antiga pode apagar o tema de outro pacote.

### Formulários e mídia

Não substitua o editor em toda consulta periódica. Preserve o rascunho, a seleção e o foco. Desabilite apenas ações que realmente dependem da operação em andamento. Deixe claro quando uma imagem é publicada imediatamente ao terminar o upload e quando textos ainda precisam ser salvos.

Reutilize elementos de avatar e banner na lista de pessoas para reduzir reinício de animação. Conserve botões de moderação, nome original e indicadores de áudio. Garanta que a pausa de movimento vale tanto para o perfil completo quanto para os cartões laterais.

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

Os 8 pedidos pendentes pertencem ao mapa compartilhado da ponte da janela, não a uma reserva de oito por MOD. Se vários pacotes consultam ao mesmo tempo, todos disputam esse limite. Use concorrência pequena e consultas sem sobreposição.

O limite de tamanho de arquivo não torna seguro ocupar indefinidamente o disco, e o limite de resposta não torna barato carregar todas as imagens a cada quatro segundos. Defina limites menores conforme o produto.

### Regras dos exemplos, não da plataforma

Perfis usa 256 KiB por imagem, lotes de até 32 pessoas e um número máximo de perfis. Estilo usa paletas e regras de contraste. Esses valores pertencem aos MODs e podem evoluir. Não os descreva como constantes universais da API.

## Erros e diagnóstico

Há três classes de falha: o pacote não carrega; o transporte não conclui; a regra do MOD recusa uma operação. Registre qual classe falhou antes de mudar o código.

| Sinal | Significado provável | Próximo passo |
| --- | --- | --- |
| malformed | JSON/campo/tipo inválido no manifesto | Validar chaves, tipos e sintaxe |
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

Confira se está ligado no servidor, se a conexão aceitou o conjunto, se o conteúdo instalado corresponde ao exigido, se `client` aponta para um arquivo existente e se o script inicializa sem exceção. Depois confira o seletor de montagem e se existe um canal válido. O evento de carregamento de uma tag de script, sozinho, não prova que a inicialização interna funcionou.

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

Use a API simulada para testar formulário, foco, teclado, rascunho, mensagens de erro, revisão, pausa de movimento e descarregamento. Marque a prévia como simulada. Não deixe um endpoint que aceita identidade arbitrária virar um backend de produção.

### Camada 4 — SEELE nativo

Teste host e participante reais. Observe instalação, anúncio, aceite, hash, carregamento, edição, leitura por outra pessoa, desconexão, reinício e atualização. O ambiente nativo pode ter CSP, suporte de CSS e restrições de rede diferentes do navegador.

### Matriz a publicar no README

Informe versão do SEELE, sistema operacional, papel testado, tipo de pacote, commit do MOD e quais caminhos passaram. Não declare “funciona em todas as plataformas” só porque funcionou em um navegador desktop. Para uma interface que usa a faixa lateral, teste uma janela estreita e uma largura em que a coluna direita está disponível no app.

## Segurança, privacidade e coexistência

O MOD de cliente tem poder de modificar a janela. `reach` e avaliação tornam esse poder visível, mas não substituem validação e minimização de dados. O código deve fazer apenas o necessário para o recurso apresentado.

### Fronteiras de confiança

| Origem | Como tratar |
| --- | --- |
| Contexto de aoPedir | Autoridade de identidade/permissões da sessão |
| Corpo do pedido | Entrada não confiável, validar integralmente |
| Texto de perfil/chat | Dados de participante, usar textContent |
| Resposta HTTP externa | Dados externos, conferir forma e limites |
| Arquivo enviado | Bytes não confiáveis, não confiar só no MIME |
| Seletor do DOM | Detalhe do app que pode mudar |

Não exponha a lista inteira de dados só porque a resposta é privada no transporte. Uma operação de leitura deve filtrar campos e recursos conforme a política. Guarde apenas o que precisa e explique para o usuário o que é público no servidor.

Evite URLs de mídia arbitrárias, pois podem causar requisições de participantes a terceiros. Quando o host consulta serviços externos, declare os destinos e a finalidade. Não faça telemetria oculta ou coleta de dados que não tenham relação com o recurso.

### Regras de convivência

Use namespaces de classe, chaves e listeners. Limpe seus recursos sem remover os de outro MOD. Não substitua funções internas do aplicativo nem sobrescreva os controles de áudio para facilitar sua interface. Preserve o acesso ao botão de sair, configurações e moderação.

Um theme MOD e um profile MOD podem coexistir se os componentes de perfil herdam tokens do tema e limitam efeitos ao próprio cartão. A cor de um banner não precisa redefinir o fundo de todo o aplicativo.

### Limites da privacidade

O host executa o código de servidor e mantém seu banco e arquivos. A ponte autenticada evita confiar numa pessoa forjada no corpo e mantém a resposta fora do histórico comum, mas não transforma o host em um ambiente que não possa acessar seus próprios dados. Descreva a proteção real, sem prometer criptografia ou sigilo que o MOD não implementa.

## Exemplo executável e receitas

O exemplo Contador usa somente três arquivos de runtime. Você pode baixar o [pacote completo](exemplos/contador.zip), o [manifesto](exemplos/contador/mod.json), o [cliente](exemplos/contador/cliente/main.js) e o [servidor](exemplos/contador/servidor/main.js).

### O que ele demonstra

- `snapshot()` para descobrir um canal.
- Operações `ler`, `incrementar` e `zerar` definidas pelo MOD.
- Leitura do estado e escrita em `dados`.
- Permissões `write` e `admin` vindas do contexto.
- Revisão para recusar alterações concorrentes.
- Consulta periódica sem sobreposição.
- Tratamento de erro e ausência de repetição automática de mutação.
- Montagem com namespace lógico e limpeza em `seele-mod-unload`.

### O que ainda é didático

O contador não tem migração além de reconhecer seu schema, recibos de idempotência, paginação ou uploads. Ele não tenta descobrir a permissão administrativa no cliente: o botão explica a restrição e o servidor a aplica. Seu seletor de montagem precisa ser verificado na versão do SEELE usada. Essas escolhas mantêm o exemplo pequeno sem esconder a regra de autorização.

### Receita: tema compartilhado

Guarde um objeto com cores, opções e revisão. Uma leitura devolve a configuração; uma escrita exige `ctx.admin`. Valide formato de cores, valores de espaçamento e contraste. Aplique em propriedades conhecidas e restaure as anteriores no unload. A interface pode mostrar uma amostra local antes de publicar para todos.

### Receita: perfil por servidor

Use `ctx.person` como dono. Separe metadados, avatar e banner. A leitura pública devolve somente campos públicos; a escrita exige a identidade do dono. Atualize a lista lateral com metadados em lotes e imagens em cache. Preserve nome e moderação nativos. Teste GIF, movimento reduzido, duplicidade de apelidos e reconexão.

### Receita: ficha por canal

Use o ID do canal como parte do escopo do estado, sem acreditar em um campo de “canal autorizado” enviado no corpo. Defina se a ficha é pública ou privada. Se houver dono, autorização precisa verificar tanto o escopo quanto a identidade. Migração de schema e histórico de revisão pertencem ao MOD.

### Projetos para leitura

[ESTILO](https://github.com/DATA-AND-DEV/ESTILO), [PERFIS](https://github.com/DATA-AND-DEV/PERFIS) e [MESA](https://github.com/DATA-AND-DEV/MESA) demonstram produtos maiores. Leia a documentação e o código da versão avaliada; não copie limitações ou nomes de operações como se fossem parte da API oficial.

## Fontes, manutenção e glossário

Esta revisão foi construída a partir do código local do SEELE no commit `6a525d19c9967e0527be7d845ee16712b3f4d9e8`, dos arquivos de contrato API 1/2 e do indexador. Quando um comentário histórico diverge de uma função executável, o guia descreve a função e explicita a diferença. As afirmações de implementação devem ser revalidadas ao atualizar o runtime.

### Fontes primárias

- [Contrato API 1](https://github.com/DATA-AND-DEV/SEELE/blob/6a525d19c9967e0527be7d845ee16712b3f4d9e8/api/v1.json)
- [Contrato API 2](https://github.com/DATA-AND-DEV/SEELE/blob/6a525d19c9967e0527be7d845ee16712b3f4d9e8/api/v2.json)
- [Manifesto e hash de conteúdo](https://github.com/DATA-AND-DEV/SEELE/blob/6a525d19c9967e0527be7d845ee16712b3f4d9e8/crates/seele-proto/src/mods.rs)
- [Runtime QuickJS](https://github.com/DATA-AND-DEV/SEELE/blob/6a525d19c9967e0527be7d845ee16712b3f4d9e8/crates/seele-server/src/mods/mod.rs)
- [Ponte autenticada](https://github.com/DATA-AND-DEV/SEELE/blob/6a525d19c9967e0527be7d845ee16712b3f4d9e8/crates/seele-server/src/mods/pedidos.rs)
- [Adaptador de eventos](https://github.com/DATA-AND-DEV/SEELE/blob/6a525d19c9967e0527be7d845ee16712b3f4d9e8/crates/seele-server/src/mods/despacho.rs)
- [Cliente da ponte](https://github.com/DATA-AND-DEV/SEELE/blob/6a525d19c9967e0527be7d845ee16712b3f4d9e8/apps/seele-app/ui/base.js)
- [Tipos do snapshot](https://github.com/DATA-AND-DEV/SEELE/blob/6a525d19c9967e0527be7d845ee16712b3f4d9e8/crates/seele-ffi/src/types.rs)
- [Indexador e processo de publicação](https://github.com/DATA-AND-DEV/SEELE-MODS-INDEXER)

### Glossário

| Termo | Significado |
| --- | --- |
| Manifesto | mod.json que identifica o pacote e seus scripts |
| Host | Máquina/pessoa que hospeda o servidor |
| Cliente | Janela de uma pessoa conectada |
| Handler | Função chamada pelo runtime para um pedido/evento |
| KV ou quintal | Objeto dados persistido como chave/valor textual |
| Snapshot | Consulta do estado exposto pelo aplicativo |
| Revisão | Número do seu estado para detectar alterações concorrentes |
| Idempotência | Repetir uma operação sem aplicar o efeito duas vezes |
| Hash de conteúdo | Identidade calculada sobre caminhos e bytes do pacote |
| CSP | Política do WebView para scripts, estilos e conexões |
| Unload | Notificação para retirar recursos de um MOD |
| Avaliação | Revisão de um commit/conteúdo para publicação no catálogo |

### Como manter este guia

Atualize a fonte Markdown, regenere a página, execute os testes do exemplo e da navegação, confira links e abra a página em larguras diferentes. Se um novo evento ou método for implementado, inclua sua assinatura, origem dos dados, autorização, retorno, erros, limites e um exemplo testável. Preserve a distinção entre contrato declarado e binding executável.

O hash não é o SHA-256 do ZIP. O algoritmo de conteúdo ordena caminhos e inclui contagem de arquivos, comprimentos dos caminhos, bytes dos caminhos, comprimentos dos conteúdos e bytes dos conteúdos, usando comprimentos inteiros de 64 bits em big-endian. Use as ferramentas oficiais e os vetores do indexador para reproduzi-lo; não crie um cálculo simplificado em um script de release.
