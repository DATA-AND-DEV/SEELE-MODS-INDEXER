# `mods.seele.app.br` — desenho do indexador

> Data: 2026-09-06. Fontes, em ordem de autoridade:
> [ADR 0044](../../../../SEELE/docs/adr/0044-mods-o-produto-base-tem-regras-e-um-mod-nao.md)
> e seu **adendo de 06/09** (a avaliação por máquina e os três níveis),
> [ADR 0045](../../../../SEELE/docs/adr/0045-toda-versao-continua-de-pe.md),
> `indexador-de-mods.md` (a arquitetura) e `MODS SEELE.dc.html` (a pele).
>
> Quando a arquitetura e o design discordam, **a arquitetura manda e o design
> cede o conteúdo, nunca a linguagem visual.** O design entra inteiro como
> tipografia, grade, tokens e ritmo; sai onde promete um serviço que não existe.

## O que este documento decide

Um repositório que produz dois artefatos e nada mais:

1. **`publicado/`** — os arquivos parados que a Cloudflare Pages serve: catálogo
   assinado, revogações assinadas, os MODs em caminhos imutáveis, e um site
   humano para ler tudo isso.
2. **`ferramentas/gerar.py`** — o que monta o item 1 na máquina de quem tem a
   chave privada de MOD.

Não decide, e deliberadamente não tem: banco, API, telemetria, rota de busca, e
CI que assina.

---

## 1 · A árvore, e o que ela deliberadamente não guarda

```
SEELE-MODS-INDEXER/
├── avaliacoes/<autor>/<nome>.toml    fonte — o veredito e o commit, não o código
├── revogacoes.toml                   fonte — editada à mão, por uma pessoa
├── vetores-de-hash.json              a amarração com o Rust (§5)
├── site/                             fonte do site: arquivos soltos, zero build
│      ├── index.html
│      ├── app.js  verificar.js  catalogo.js  frases.js  rotas.js  tela.js
│      ├── estilo.css  tokens.css  fontes.css
│      ├── fontes/                    os 8 .woff2 (§7)
│      └── _headers
├── ferramentas/
│      ├── gerar.py
│      ├── hash_conteudo.py           a definição, isolada
│      └── testes/
├── chaves/mods.pub                   a chave pública de MOD, comitada
└── publicado/                        SAÍDA — comitada, e é o deploy
```

### Não há cópia do código do autor, e isso é a decisão

A doc é literal: *«o `SEELE-MODS` guarda o **veredito e o commit avaliado**, e
não uma segunda cópia do código do autor: duas cópias divergem, e a que serve é
a que sai do commit fixado.»*

Então `avaliacoes/<autor>/<nome>.toml` guarda a URL do repositório, o commit
avaliado, o nível, as notas e as versões — e `gerar.py` **busca o commit fixado**
e materializa `publicado/mods/<autor>/<nome>/<versao>/…` a partir dele. O
repositório do indexador nunca vira um espelho do código de terceiros.

```toml
id = "juli/cinza-frio"
repo = "https://github.com/juli/seele-cinza-frio"
titulo = "Cinza Frio"
resumo = "Um tema de contraste alto, sem mexer no layout."

[[versoes]]
versao = "2.1.0"
commit = "4f9a1c0e8b7d6a5f4e3d2c1b0a9f8e7d6c5b4a39"
nivel  = "verificado"
notas  = []
avaliado_em = 1757000000
```

**`commit` é SHA-1 completo, 40 caracteres, nunca abreviado.** Prefixo curto de
git colide, e um prefixo escolhido por um adversário colide de propósito.

### Por que `publicado/` é artefato comitado

Porque a chave privada nunca entra na Cloudflare nem em CI (ADR 0026), e um
artefato assinado localmente só chega ao Pages de uma forma: comitado. O commit
**é** o deploy, e a propriedade que isso mantém é a que o ADR 0026 mais preza —
a chave que autoriza é a única coisa que um invasor não alcança pela rede.
Sobrevive porque não existe passo de build remoto onde enfiar um segredo.

### Por que `revogacoes.toml` e não editar o JSON

`revogacoes.json` é saída assinada. Editá-la à mão é editar um arquivo cuja
assinatura passa a não conferir, e descobrir isso quando um cliente recusar. O
TOML é o que uma pessoa escreve; `gerar.py` valida e emite o JSON.

---

## 2 · `content_hash` — a definição, e de onde ela veio

De `crates/seele-proto/src/mods.rs:194`, que é a única fonte:

```
SHA-256(
  u64be(quantidade de arquivos)
  para cada (caminho, bytes), ordenado pelos bytes UTF-8 do caminho:
    u64be(len(caminho em bytes))   ← BYTES, não caracteres
    caminho UTF-8
    u64be(len(bytes))
    bytes
)
```

Hex minúsculo (`seele-core/src/mods.rs:180`), porque é o número que uma pessoa
compara a olho e duas grafias fariam a comparação falhar por nada.

As três propriedades, com o motivo que o Rust escreve ao lado de cada uma:
**caminhos ordenados**, porque ordem de diretório não é promessa que sistema de
arquivos nenhum faz; **todo comprimento antes dos seus bytes**, para que
`("ab","c")` e `("a","bc")` não colidam; **comprimentos em 8 bytes big-endian
fixos**, para que um comprimento nunca seja ele próprio ambíguo.

`hash_conteudo.py` reimplementa isso num módulo que não faz mais nada — um
módulo com uma função é o que permite que a amarração da §5 aponte para um alvo.

### A armadilha do arquivo estranho

`seele-core/src/mods.rs:130` varre **todo** arquivo do diretório do MOD, sem
filtro. Um `.DS_Store` no repositório do autor entra no hash que o servidor
calcula em disco, mas não estaria em `arquivos`. O cliente então baixa a lista,
calcula outro número, e recusa dizendo que o hash não bate — que é a nossa
palavra para «adulterado».

**`gerar.py` recusa o MOD**, nomeando o arquivo. Não o ignora e não o inclui em
silêncio: ignorar produz o defeito acima, e incluir publica lixo da máquina de
alguém num caminho imutável para sempre.

A lista de nomes recusados é fechada — `.DS_Store`, `Thumbs.db`, `.git*`,
`*.swp`, `__pycache__/` — e qualquer outro arquivo desconhecido é **perguntado,
não decidido**: `gerar.py` para e lista o que achou. Uma heurística que adivinha
aqui é uma heurística que um dia inclui um `.env`.

---

## 3 · `catalogo.json`

O esquema da doc, sem invenção:

```json
{
  "esquema": 1,
  "gerado_em": 1757100000,
  "mods": [{
    "id": "seele/rpg", "autor": "seele", "nome": "rpg",
    "titulo": "Salas de RPG",
    "resumo": "Fichas, dados e salas por mesa.",
    "repo": "https://github.com/seele/mod-rpg",
    "oficial": true,
    "nivel": "oficial",
    "commit": "a1b2c3d4e5f6…",
    "notas": [],
    "versoes": [{
      "versao": "1.0.0", "api": 1, "publicado_em": 1757000000,
      "hash": "9f2c…",
      "alcanca": ["desenhar na coluna lateral"],
      "arquivos": ["mod.json", "cliente/main.js", "servidor/main.js"]
    }]
  }]
}
```

**`nivel`** é `oficial`, `verificado` ou `com-notas`. `negado` não existe como
valor: um MOD negado não entra no catálogo, e o catálogo diz o que existe, não o
que foi rejeitado.

**`notas`** são identificadores de aviso, nunca frases — a frase é do `frases.js`
(ADR 0012). E elas ficam **dentro do que é assinado**, que é o ponto do adendo:
*«notas que alguém pode tirar são notas que não protegem ninguém»*. Como o
catálogo inteiro é assinado com a chave de MOD, `nivel` e `notas` já estão
cobertos por construção — é isso que satisfaz *«verificado é assinatura e nunca
campo»*. MOD `oficial` leva, além disso, uma assinatura própria, que é o passo 7
do que o cliente faz.

**`alcanca`** não é inventado: é `Manifest.reach` de `mod.json`, que existe em
esquema 1 exatamente para isto — *«what this MOD asks to reach, for the
acceptance screen to show before anything is downloaded»*. Alimenta a coluna
**O QUE ELE ALCANÇA** do design, e é a única parte daquela coluna que não
precisou ser reinventada.

Fica **por versão e não por MOD**, porque `mod.json` é por versão: uma versão que
passa a alcançar a rede tem de poder dizer isso sem reescrever o que a anterior
alcançava. A tela mostra o da versão mais recente, e a mudança entre duas versões
é precisamente o que alguém quer ver antes de atualizar.

### O que continua não existindo

**`estrelas` e `baixados` não entram.** O primeiro exigiria um job diário lendo a
API do GitHub; o segundo exigiria contar downloads, que é o que a doc proíbe em
*«não ligar Web Analytics, não ligar Logpush»*. Os dois números grandes do cartão
do design passam a ser **a versão mais recente** e **há quanto tempo ela saiu** —
ambos saem do catálogo, ambos mantêm os dígitos tabulares e a hierarquia que o
design construiu, e nenhum dos dois é uma medição que não fazemos.

---

## 4 · `revogacoes.json`

O esquema da doc, sem alteração. O que este documento acrescenta é a **lista
fechada de `motivo`**, que a doc exige e não enumera:

| identificador | o que aconteceu |
|---|---|
| `credencial-vazada` | um segredo foi publicado junto com o código |
| `leitura-de-disco-fora-da-pasta` | leu ou escreveu fora da pasta do MOD |
| `rede-nao-declarada` | alcançou a rede sem declarar em `alcanca` |
| `dado-enviado-a-terceiro` | mandou para fora o que era da sessão |
| `nao-corresponde-ao-commit` | os bytes servidos não saem do commit avaliado |
| `pedido-do-autor` | quem escreveu pediu a retirada |
| `migracao-que-corrompe` | (versão do produto) uma migração perde dados |

Uma lista, não duas — MOD e versão do produto compartilham o vocabulário, porque
a doc já decidiu que são a mesma peça e *«duas listas seriam duas chances de
esquecer uma»*. A lista cresce por PR, e `gerar.py` recusa identificador fora
dela: um motivo livre é uma frase, e o núcleo nunca formata mensagem.

`corrigido_em` é obrigatório sempre que houver versão corrigida, porque *«uma
recusa que só diz "não" manda a pessoa procurar; uma que diz para onde ir
resolve»*.

---

## 5 · A amarração com o Rust

`hash_conteudo.py` tem de produzir exatamente o número que `content_hash` produz.
Se divergir, todo MOD publicado é recusado pelo cliente com a mensagem mais
alarmante que o produto tem. Um comentário dizendo «igual ao Rust» não prova
nada.

**A mecânica, e ela não amarra os repositórios no disco:**

1. Um teste em `seele-proto` **escreve** `vetores-de-hash.json` e reprova se o
   arquivo comitado divergir do que acabou de gerar.
2. O arquivo é comitado **nos dois repositórios**.
3. Um teste em `ferramentas/testes/` lê o mesmo arquivo e confere cada vetor
   contra `hash_conteudo.py`.

Nenhum dos dois repositórios precisa do outro para rodar os próprios testes, e
nada quebra em CI por um caminho de disco. E ninguém edita os vetores «até
passar»: quem os regenera é o Rust, e o Rust reprova se mexerem neles.

```json
{
  "gerado_por": "seele-proto content_hash",
  "vetores": [
    { "nome": "vazio", "arquivos": [], "hash": "…" },
    { "nome": "um-arquivo", "arquivos": [{"caminho": "mod.json", "bytes_b64": "…"}], "hash": "…" },
    { "nome": "fronteira-ab-c", "arquivos": [{"caminho": "ab", "bytes_b64": "Yw=="}], "hash": "…" },
    { "nome": "fronteira-a-bc", "arquivos": [{"caminho": "a", "bytes_b64": "YmM="}], "hash": "…" },
    { "nome": "utf8-no-caminho", "arquivos": [{"caminho": "ícone/ação.js", "bytes_b64": "…"}], "hash": "…" },
    { "nome": "ordem-invertida", "arquivos": ["…"], "hash": "…" }
  ]
}
```

Os obrigatórios são os que os testes Rust já provam
(`seele-proto/src/mods.rs:398–426`). Mais dois que o Rust não tem porque não
precisa e o Python precisa: **caminho com UTF-8 multibyte** — onde `len()` em
Python conta caracteres e o Rust conta bytes, e é o erro que este vetor existe
para pegar — e **conjunto vazio**.

---

## 6 · O site

Zero build, zero dependência, ES modules servidos como arquivos parados. Um
módulo toca o DOM; os outros são funções puras testáveis com `node --test`.

| módulo | trabalho | toca DOM |
|---|---|---|
| `verificar.js` | baixa catálogo + `.minisig`, confere Ed25519 por WebCrypto, devolve um veredito nomeado | não |
| `catalogo.js` | filtra por nível e API; ordena; busca em memória; cruza com revogações | não |
| `frases.js` | identificador → frase, no molde de `apps/seele-app/ui/frases.js` | não |
| `rotas.js` | `#/`, `#/mod/<autor>/<nome>`, `#/revogacoes`, `#/publicar` | não |
| `tela.js` | desenha | **sim** |
| `app.js` | liga os cinco | mínimo |

Nada de `image-slot.js` nem `support.js`: são o runtime do canvas de design. A
linguagem visual vem de `tokens.css` e da grade, que é o que dela sobrevive fora
do canvas.

### A verificação no navegador é integridade, não autenticidade

`verificar.js`, a chave pública e o catálogo vêm todos da mesma origem. Quem
adultera o catálogo adultera o verificador junto, e a chave junto. **Não há
âncora de confiança.** A conferência do cliente vale porque a chave está
compilada no app, e quem controla a CDN não a alcança.

Ela fica, porque pega **corrupção acidental** e **CDN mal configurada** — e esta
segunda é a falha que a doc nomeia como a pior do desenho inteiro: *«um catálogo
novo com uma assinatura velha em cache é um cliente recusando um catálogo
legítimo […] porque ela parece adulteração»*. O site é o único lugar onde essa
falha pode ser **vista e nomeada** antes de quem hospeda ir culpar o roteador.

Consequências concretas, e são todas de redação:

- a palavra na tela é **«íntegro»**, nunca «autêntico» nem «verificado»;
- a página diz, **uma vez e em texto corrido**, que a conferência que decide
  acontece dentro do app, com a chave compilada nele;
- quando a assinatura não confere, a frase padrão **acusa cache antes de
  adulteração**, porque é a causa provável e a mais difícil de achar;
- não existe «tentar assim mesmo». O ADR 0029 recusa isso nominalmente.

**O modo legado da assinatura** (`Ed`, sem pré-hash) fica, com a razão certa
escrita: o catálogo tem dezenas de KB, e o pré-hash existe para arquivo grande.
Justificá-lo pelo navegador seria pagar por um benefício que o parágrafo acima
acabou de dizer que não existe. `minisign-verify` aceita os dois modos.

### As telas

**CATÁLOGO** — a grade do design, intacta na forma. Filtros, ordenação e busca
todos no cliente, sobre o que já foi baixado, porque é a regra: *«com API, o
indexador aprende cada termo que alguém digitou; com catálogo, aprende que
alguém buscou o catálogo»*. O par de números do cartão é versão e idade (§3). O
selo do cartão passa a ter três estados — `oficial`, `verificado`, `com notas` —
e o terceiro é o que o adendo chama de parte nova mais valiosa: ele existe para
que a pessoa **leia o que o MOD faz de incomum e decida**, não para envergonhá-lo.

**A barra lateral filtra por nível, e não por categoria.** O design tem uma
coluna CATEGORIA com «Temas, Painéis, Sons, Canais», e `catalogo.json` não tem
categoria nenhuma — nem a doc, nem `mod.json`, nem o ADR. Acrescentar o campo
seria inventar uma taxonomia que ninguém pediu e que alguém teria de curar a cada
submissão, para dividir seis MODs em quatro gavetas.

O que o catálogo **tem** é o que o adendo de hoje acabou de tornar a informação
central da tela: `nivel`. A coluna vira **NÍVEL** — oficial, verificado, com
notas — e absorve a caixa CONFIANÇA do design, que perguntava «só pacotes
assinados» quando a resposta é sempre sim: tudo que está no catálogo está
assinado, porque o catálogo inteiro é. A pergunta que vale não é *se* foi
assinado, é *o que foi atestado*. A forma visual da barra lateral não muda em
um pixel; muda o que ela pergunta.

**MOD** — o detalhe. Capturas, ficha técnica e `alcanca` seguem o design. As
notas de segurança aparecem **acima** do botão de baixar, não num rodapé: uma
nota que a pessoa lê depois de instalar não é uma nota. A coluna de download
muda, porque **`seele://mod/<id>` não existe**: o esquema `seele://` já tem dono
— é o convite de servidor, `seele://host:porta/?fp=…&convite=…`
(`seele-proto/src/uri.rs:67`) — e `seele://mod/seele-rpg` seria lido como o host
`mod` e recusado. No lugar: **copiar o id**, a lista de `arquivos` com link para
cada caminho imutável, e o **`hash` inteiro em mono selecionável**, que é
precisamente por que a doc insiste que ele seja texto.

**REVOGAÇÕES** — nova, não estava no design. MODs e versões do produto na mesma
tabela, em ordem de data, cada linha com a frase do `motivo` e o `corrigido_em`
como link. Existe porque `revogacoes.json` é metade da arquitetura e não aparecia
em tela nenhuma, e porque quem quer saber se a **própria versão do produto** foi
revogada (ADR 0045) não tinha onde olhar. Versão revogada também ganha selo
vermelho onde quer que o MOD apareça.

**PUBLICAR** — ver §8.

### As falhas, e o que a tela diz

| o que aconteceu | o que a pessoa lê |
|---|---|
| o catálogo não veio | «`mods.seele.app.br` não respondeu» — e, se ela estava entrando num servidor com MOD, que **é por isso** que ela não entra |
| a assinatura não confere | cache provável antes de adulteração; e que quem confere de verdade é o app |
| o hash não bate | o número esperado e o que veio, lado a lado |
| o navegador não faz Ed25519 | diz isso, mostra o catálogo, e **não finge ter conferido** |

A primeira é a que vai acontecer: **LAN sem internet não entra em servidor com
MOD.** A tela liga as duas coisas na mesma frase, ou quem hospeda culpa o
roteador.

---

## 7 · As fontes

Saira Condensed, IBM Plex Mono e Noto Sans JP, servidas localmente. Um `<link>`
para o Google Fonts seria um segundo terceiro vendo quem pediu o quê, num produto
cujo argumento é não ter serviço no meio.

`site/fontes/` recebe os oito `.woff2` copiados do repositório do app, que já os
tem com licenças e `PROCEDENCIA.md`. `fontes.css` entra idêntico ao do design,
`font-display: block` incluído — e a razão que aquele arquivo dá continua valendo
aqui: *«numa interface da ORANGE, um instante de Arial Narrow é pior que um
instante de nada»*. Enquanto não forem copiadas, a página cai nos fallbacks e
fica feia. Funciona.

---

## 8 · Publicar

O adendo do ADR 0044 define o fluxo: o autor clona um repositório base, publica
no **repositório dele**, e **pelo site** pede inclusão passando a URL. A
avaliação clona e analisa o repositório inteiro — estrutura, e o código contra
código malicioso, comunicação com software de terceiro e tentativa de invasão.

Os vereditos, e como cada um é provado:

| | o que é | como é provado |
|---|---|---|
| **oficial** | nosso, e nós respondemos por ele | assinatura com a chave de MOD |
| **verificado** | passou na avaliação | assinatura, e não campo |
| **publicado com notas** | não passou limpo, e o que faz é legítimo | assinatura **que cobre as notas** |
| *negado* | lesa quem instala | não entra |

A tela diz o que a avaliação **é**, com a precisão do adendo: **um filtro, e não
uma prova.** Ela pega o óbvio — `eval` de string remota, exfiltração escancarada,
ofuscação — e não pega o caminho sutil na décima função de um arquivo limpo. Uma
tela que deixasse alguém achar que «verificado» significa «seguro» estaria
mentindo sobre o teto, e o adendo diz que a troca só é legítima *«desde que o
teto seja dito»*.

### A submissão abre uma issue, e não passa por um Worker

O adendo autoriza duas formas — *«um formulário que abre uma issue, ou uma função
de borda que faz o mesmo»* — e escolho a primeira, pelo motivo que o próprio
adendo escreve: *«No dia em que existir um Worker para a submissão, alguém vai
propor usá-lo para a busca.»*

O formulário valida no cliente e monta uma URL de issue pré-preenchida no
GitHub. Nenhum byte deste site é escrito por ninguém de fora, não há função de
borda, e não há Worker a que alguém possa propor acrescentar uma rota. É o
argumento de abertura da doc aplicado a si mesma: **não ter a peça é mais forte
que tê-la e prometer não usá-la.** Se um dia a submissão precisar de uma escrita
de verdade, é uma decisão visível — que é a propriedade inteira.

A tela mantém a numeração e a tipografia do design. O formulário do design fica,
com o botão dizendo o que ele de fato faz. **«ENVIAR PARA O ÍNDICE» sai**: ele
promete um serviço, e não há serviço.

---

## 9 · `_headers`

Os cinco blocos da doc entram sem alteração; a razão de cada número está lá.
Este documento acrescenta o que a doc não cobria, porque a árvore dela não tinha
site humano:

```
/                       max-age=300
/*.js  /*.css           max-age=300
/fontes/*               max-age=2592000
```

Cinco minutos no site pelo mesmo motivo do catálogo: é o atraso máximo entre
corrigir uma frase e alguém lê-la. As fontes em trinta dias porque não mudam, e
não em um ano porque o caminho delas não carrega versão — só `/mods/*` tem essa
propriedade, e só ele ganha `immutable`.

**A assinatura tem de ter o mesmo cache do arquivo que ela assina**, e `gerar.py`
tem um teste que confere isso lendo o `_headers` que acabou de copiar. É a falha
que a doc chama de mais difícil de diagnosticar; ela merece um guarda e não um
parágrafo.

---

## 10 · Testes

**`hash_conteudo.py`** — os vetores da §5. É o teste que decide se o produto
funciona.

**`gerar.py`**, em `pytest`, com repositórios de fixture criados com `git init`
local (nunca rede nos testes): recusa arquivo estranho; recusa `mod.json`
inválido pelas mesmas cinco recusas do Rust (`malformed`, `schema-too-new`,
`api-too-new`, `malformed-id`, `empty`); recusa `commit` que não seja 40 hex;
recusa quando o commit buscado não existe no repositório; recusa edição de versão
já publicada (*append-only*, contra o `publicado/catalogo.json` anterior); recusa
`motivo` e `nota` fora das listas fechadas; confere que assinatura e assinado têm
o mesmo cache.

**Os módulos do site**, em `node --test`, sem DOM: a busca acha por título,
autor, id e resumo; o filtro de API esconde o que o app recusaria; o cruzamento
com revogações marca a versão certa e não a vizinha; `frases.js` tem frase para
todo identificador de toda lista fechada, **e um teste reprova quando alguém
acrescenta um motivo ou uma nota sem frase** — o mesmo guarda que o app tem para
`EndReason`, e que a própria `frases.js` do produto conta ter pegado um buraco
silencioso.

**`tela.js` não tem teste automatizado.** É o único módulo que toca o DOM, é
justamente por isso que ele é o único, e um teste de DOM aqui exigiria a
dependência de build que este desenho existe para não ter.

---

## 11 · O que fica sem saída

Herdado, e continua verdade:

- **A Cloudflare vê quem pediu o quê.** Minimizado por não coletarmos nada nós
  mesmos — sem Web Analytics, sem Logpush, sem nada de análise. Verdade mesmo
  assim, e merece uma linha nas notas de release: um produto que se vende como
  auto-hospedado e passa a depender de uma CDN precisa dizer isso em voz alta.
- **Publicar depende de uma pessoa com a chave**, e o indexador para quando essa
  pessoa para.
- **5 000 versões é um teto real**, e a saída — um projeto por letra inicial de
  autor — não exige mudar nada no cliente.
- **Um MOD retirado continua no disco de quem já baixou.**
- **A avaliação é um filtro e não uma prova.** Não pega o caminho sutil na décima
  função de um arquivo limpo, e a tela tem de dizer isso.

Acrescentado por este documento:

- **A verificação no site é integridade e nunca autenticidade** (§6). Não há
  conserto sem uma âncora fora da origem, e não há âncora fora da origem numa
  página web.
- **`hash_conteudo.py` é uma segunda implementação de uma definição que só
  deveria existir uma vez.** Os vetores comitados não impedem que as duas
  divirjam — impedem que isso passe despercebido.
- **`gerar.py` depende da rede**, porque busca o commit fixado no repositório do
  autor. É a única dependência de rede do desenho, ela é de build e não de
  runtime, e um repositório que sumiu significa que aquela versão não pode ser
  republicada — só continua servida se já estiver em `publicado/`.
