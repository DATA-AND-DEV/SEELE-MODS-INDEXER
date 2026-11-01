# SEELE MOD MULTIPLAYER — 1.0.0

Servidores de jogo multiplayer nas máquinas de quem está no servidor SEELE, sem VPN, sem servidor pago e sem serviço de fora. Quem hospeda o SEELE escolhe o jogo, escolhe em que máquina ele roda e configura pela tela do SEELE; a pessoa dona da máquina aceita, na máquina dela, antes de qualquer coisa ser baixada, e pode desligar a qualquer momento. Os amigos entram pelo botão **ENTRAR**, que abre `localhost:<porta>` no computador de cada um.

Requer a **API de MOD 8** (contrato em `api/v8.json` do SEELE; cópia em `test/contrato/api-v8.json`) e só roda no **app de computador** (`"plataformas": ["app"]`): o navegador não abre porta local.

Esta é a parte 7 do desenho `docs/superpowers/specs/2026-10-29-api-8-e-mod-multiplayer-design.md`: o MOD com a receita do **Minecraft**, **Vanilla** e **com mods** (o `.mrpack` do Modrinth, pelo link ou pelo arquivo), e a **máquina reserva**.

## O que tem

- **O seletor de jogos** (entrada **Multiplayer** na navegação do servidor): as receitas para criar e os servidores de jogo que já existem, cada um num cartão com o estado, quantos estão jogando, o **ENTRAR** e o endereço `localhost:<porta>` depois de entrar.
- **A configuração** de um servidor de jogo, em quatro abas, como no desenho aprovado (`config-layout-v2`): **GERAL** (Vanilla / Com mods no topo, a versão, o nome com uma cor por palavra, máximo de jogadores, dificuldade, modo, PvP), **MODS** (o modpack: o link do Modrinth ou o arquivo `.mrpack`, até 64 MiB, com o que ele pede — a versão do Minecraft, o loader e os mods do servidor), **JOGADORES** (quem está dentro e as regras de convívio) e **MÁQUINA** (quem roda, o estado do aceite, o que roda e de onde vem, o console, as últimas linhas e o que deu errado).
- **Com mods**: o pack define a versão, o loader (Fabric, Quilt, Forge ou NeoForge) e os mods. A máquina traz o pack (ou o baixa do CDN do Modrinth pelo link), confere cada arquivo pelo `sha512` e só de `cdn.modrinth.com`, `github.com`, `raw.githubusercontent.com` e `gitlab.com`, aplica os `overrides` e os `server-overrides`, e roda o instalador do loader (o segundo comando que a tela do aceite mostra). Quem joga baixa o mesmo pack pelo cartão (**BAIXAR O PACK**, pelo diálogo de salvar do sistema) para importar no app do Modrinth.
- **Mais de um servidor de jogo ao mesmo tempo** (até 8), cada um com a sua porta; dois na mesma máquina ganham portas diferentes.
- **Uma máquina por vez**: trocar a máquina ou a versão pede o servidor desligado e um aceite novo; uma máquina que fala sem ser a dona é mandada parar.
- **A reserva** (aba MÁQUINA): uma segunda máquina, de outra pessoa, que aceita na máquina dela e fica pronta. A dona copia o mundo para ela pelo túnel, de 5 em 5 minutos (configurável), sempre depois do salvamento seguro (`save-off`, `save-all flush` até «Saved the game», a cópia, `save-on`). **PASSAR À RESERVA** para o jogo, manda a cópia final e liga na reserva: nada se perde. Numa queda de surpresa de mais de 60 s, a reserva assume com a última cópia, e o cartão de todos diz quanto tempo de jogo se perdeu. A máquina que volta não liga sozinha: se o jogo dela ainda estava de pé sem a posse, ela o desliga, e isso é contado na tela. Sem quem hospeda o SEELE, nada muda de dona, e a dona segue rodando: quem joga pela ligação direta continua jogando. Quando ele volta, a metade de máquina é religada sem subir de novo (`maquina.aoReconectar`): serve de novo o túnel, pergunta a posse, e a aba MÁQUINA diz quanto tempo ela ficou sem ele.
- **Nada calado**: download que falhou, hash que não bateu, Java que não existe para a máquina, túnel que não abriu, jogo que caiu ou não parou, recusa do aceite, recusa de permissão — tudo aparece na tela, com o nome e os dados, e no log.

## Quem pode o quê

| ação | padrão |
|---|---|
| `criar-servidor-de-jogo` (criar e apagar) | quem administra |
| `configurar-servidor-de-jogo` (configuração, versão, máquina, console) | quem administra |
| `ligar-desligar-servidor-de-jogo` | quem administra, e quem o dono quiser |
| `entrar-no-jogo` | todos |

A metade de servidor confere a ação que o **anfitrião** escreveu em `contexto.acao`, nunca o corpo do pedido. Ser dono da máquina não se compra com cargo: o aceite, na tela do produto, vale acima de qualquer permissão.

## Como a comunidade adiciona um jogo

Cada jogo é uma **receita**: um arquivo JSON em `receitas/`, sem código. O formato está em [`receitas/esquema.json`](receitas/esquema.json) (JSON Schema), e a receita do Minecraft em [`receitas/minecraft.json`](receitas/minecraft.json) é o exemplo inteiro.

1. **Faça um fork** deste repositório e crie `receitas/<jogo>.json`. O `id` vira o começo do nome de cada servidor de jogo e do túnel (`terraria-1`): minúsculas, dígitos e hífen, até 24.
2. **Declare tudo o que o jogo precisa**:
   - `versoes` e `artefatos`: de onde vem a lista de versões e o que baixar. Para um jogo cujos arquivos têm URL, hash e tamanho fixos, use a fonte **`fixo`** (`versoes.lista` e `artefatos[].porVersao`), e não precisa de código nenhum. As fontes `mojang`, `mojang-servidor` e `adoptium` leem as APIs da Mojang e da Adoptium; uma origem nova que precise ser lida (uma API) entra com código em `fonte/receita.js`, no mesmo pull request, com teste e fixtures.
   - `origens`: os domínios de onde a máquina baixa. Toda URL de artefato tem de cair num deles; o aceite os mostra, e o SEELE recusa o resto.
   - `dominiosDoJogo`: os domínios com que o jogo fala sozinho, sem o SEELE conferir. O aceite os mostra.
   - `rodar`, `rede` (protocolo `tcp` ou `udp` e a porta padrão) e `disco.mundoMaximo`.
   - `termos`: o que a pessoa da máquina aceita (como o EULA), e o arquivo que se escreve só depois do aceite.
   - `configuracao`: cada campo (`campo`, `numero`, `escolha`, `interruptor` ou `segmentos`, uma lista de palavras com cor, com o padrão, os limites e as opções), em que aba fica (`geral` ou `jogadores`) e, em `propriedades`, como ele vira o arquivo de configuração do jogo (`{chave}` é o valor de um campo; `{porta}` é a porta que o MOD escolheu). Campos com o mesmo `grupo` ficam lado a lado.
   - `mundo.salvar`: o salvamento seguro, passo a passo (`console`, com `esperar` e `prazo`, ou `copiar`). Obrigatório: é o que torna a reserva possível.
   - `modpack` (opcional, só com a variante `com-mods`): o formato do pack (`modrinth`), o teto do envio, a API e a página do Modrinth, os domínios de onde um arquivo do pack pode vir, e, por loader, o instalador (`fixo`, com URL, hash e tamanho, ou `reposilite`, com a URL de detalhes e o algoritmo), os argumentos de `instalar` e de `rodar` (`{mc}` e `{loader}` são as versões do pack), os sistemas em que ele roda, os domínios de onde ele baixa sozinho e o disco.
   - `saida`: expressões regulares sobre a saída do jogo — `pronto`, `entrou` e `saiu` (as duas com um grupo de captura: o nome de quem joga) — e o passo de `parar`.
3. **Rode os testes**: `npm test`. O validador recusa toda chave desconhecida pelo nome e com o caminho (`receita.configuracao.campos[2]: chave desconhecida «maxmo»`), e confere o que um esquema não diz: modelo que cita campo que não existe, padrão fora das opções, expressão que não compila, salvamento que não copia o mundo, URL fora das origens. `npm run build` também recusa uma receita inválida.
4. **Escreva um teste** para a receita, como `test/receita-minecraft.test.cjs` ou `test/receita-fixa.test.cjs`, com as fixtures da origem em `test/fixtures/`: os testes nunca vão à rede.
5. **Abra o pull request.** A receita vai dentro do pacote do MOD (o build a embute nas três metades) e passa pela mesma avaliação do indexador que o MOD passa.

O seletor não oferece jogos cujo multiplayer não passa por uma porta de rede (como os que usam o P2P da Steam): não há o que tunelar.

## Como é feito

```
mod.json                 o manifesto (API 8, só o app, poderes porta e programa, as quatro ações)
receitas/esquema.json    o formato de receita
receitas/minecraft.json  a receita do Minecraft Vanilla
fonte/comum.js           o que as três metades usam
fonte/esquema.js         o validador de receitas
fonte/receita.js         versões, artefatos, oferta, configuração, server.properties, saída
fonte/modpack.js         o modrinth.index.json (as regras da spec), o link do Modrinth, o instalador do loader e a oferta com mods
fonte/servidor.js        a metade de servidor
fonte/adaptador.js       a única porta para a API da máquina (maquina.*)
fonte/maquina.js         a metade de máquina
fonte/cliente.js         a metade de cliente
cliente/ servidor/ maquina/main.js   gerados por npm run build
ferramentas/             build, package e o exercício no QuickJS
test/                    os testes (node --test), o anfitrião e a janela simulados, as fixtures e o contrato
```

**O adaptador.** Todo nome da API da máquina que a metade de máquina chama mora em `fonte/adaptador.js`, nos nomes que o SEELE entregou nas partes 3 e 4 (`maquina.servidor`, `.oferta`, `.plataforma`, `.pedir`, `.aoAviso`, `.aoParar`, `.aoReconectar`, `maquina.porta.*` e `maquina.programa.baixar/escrever/desempacotar/trazer/ler/rodar/recusas`). `test/adaptador.test.cjs` escreve, chamada a chamada, o que cada uma vira, e confere cada nome contra o bloco `metade-de-maquina` de `test/contrato/api-v8.json`.

## Desenvolvimento e validação

```sh
npm run build
npm run check
npm test
SEELE_RAIZ=/caminho/do/SEELE-com-a-API-8 npm run quickjs
```

`npm test` roda as três metades: a de servidor num anfitrião simulado pela API 8 (`test/anfitriao.cjs`: o portão das ações, o `dados` transacional, `mundo.maquinas`, os momentos `MaquinaAceitou`, `MaquinaRecusou` e `MaquinaParou`, o `contexto.maquina`), a de máquina contra um adaptador falso com a de servidor de verdade do outro lado, e a de cliente numa janela gerada do contrato (`test/janela.cjs`: só as formas, os pontos e os tipos do `api-v8.json`, o teto de 12 KiB por mensagem, e o bilhete de gesto do `SeeleUI.tunel.entrar`). O `quickjs` sobe as três no QuickJS 0.12.2 com o teto de 8 MiB e o prelúdio do motor de um checkout do SEELE com a API 8 (`SEELE_RAIZ`); a de máquina, com `maquina.programa`, como o app a sobe.

`ferramentas/plano-de-verdade.cjs` monta a oferta e o plano de um Minecraft 1.21.4 (com `--mods`, o mesmo com o pack de prova de `ferramentas/pack-de-prova.cjs`, um Fabric pequeno com mods de verdade) para as duas provas com rede do SEELE: a metade de máquina deste MOD no executor do app, baixando e rodando o jogo de verdade até o status responder com o motd, e o status pelo túnel de verdade, direto e pela estrela (ver `DECISOES.md`). Nada disso substitui o Minecraft entre duas casas reais, com um cliente entrando no mundo, que não foi medido.

## Preparar o pacote

```sh
npm run build
npm run package -- /caminho/absoluto/novo/pacote
```

O destino precisa ser novo. O pacote leva `mod.json` e as três metades (as receitas vão dentro delas).
