# Decisões tomadas durante a execução do plano

> Plano: `docs/superpowers/plans/2026-09-06-indexador-de-mods.md`.
> Spec: `docs/superpowers/specs/2026-09-06-indexador-de-mods-design.md`.
>
> A execução foi por subagentes, com revisão e teste de mutação por tarefa.
> Este arquivo preserva o que ficaria só no diretório de trabalho: as decisões
> tomadas sem consultar o humano, e os defeitos conhecidos que ficaram abertos.
> Cada decisão diz o que custa se estiver errada.

## O que ficou aberto, e por quê

- Task 2: minor (deferred): `vetores_de_hash.rs:67,74` usam `{x:?}` (Debug do Rust) para emitir string JSON. Coincide com JSON válido para os dados atuais, mas um caractere de controle num vetor futuro sairia como `\u{XXXX}` (com chaves), que não é JSON — e quebraria o parser só no outro repositório. Revisor confirmou que o base64 escrito à mão está correto nos dois casos de bloco parcial (`Yw==`, `YmM=`).
- Task 4: minor (deferred): `avaliacoes.py:21` — a regex `^[0-9a-f]{40}$` não é coberta contra hex maiúsculo; trocá-la por `[0-9a-fA-F]` passa nos 9 testes. O revisor investigou: o git resolve object-id sem distinguir caixa, então não há brecha funcional, só falta de canonicidade. Um teste com `COMMIT.upper()` esperando `commit-torto` fecharia.
- Task 5: minor (deferred): `fonte.py:65` o `.replace("\\","/")` não é observável (git ls-tree sempre devolve `/`); `fonte.py:39` nomes de cache podem colidir (`a/b` vs `a_b`); a lista de recusados é enumeração e não glob (`.gitkeep`, `.github` passariam).
- Task 6: minor (deferred): `catalogo.py:98` `anterior is None` vs `not anterior` não é observável hoje (nenhum chamador de produção ainda; um catálogo real sempre tem chaves). Revisar quando a Task 9 integrar.
- Task 5: minor (deferred): comentários da rodada 1 parafraseiam o `if` (dizem o quê, não por quê) — pedido de reescrita junto da rodada 2.
- Task 7: minor (deferred): os 11 identificadores de `listas.json` são kebab-case, então `frases.js` (Task 10) tem de usar colchete e não ponto. Carregar isto para o dispatch da Task 10.
- Task 3: minor (deferred): `manifesto.py:112` `cru.get("reach", []) or []` é código morto — `reach` nulo já foi recusado antes.
- Task 7: minor (deferred): `revogacoes.py:32` `_exigir` usa `not bruta.get(campo)`, então um `desde = 0` explícito é tratado como ausente. Impacto baixo (timestamp em 1970), semântica errada.
- Task 9: minor (deferred): a estufa de uma execução falha só é limpa na execução seguinte.
- Task 12: minor (deferred): `versaoMaisRecente` usa `reduce` sem valor inicial (quebraria com `versoes: []`, não coberto); busca não é exercitada isoladamente nos campos `nome`/`repo`; o fallback de `ordenar` para chave desconhecida não está documentado.
- Task 13: minor (deferred): `paraHash(undefined)` lança; `paraHash({})` produz `"#/undefined"`; `%2F` não é decodificado antes da validação. Nenhum alcançável pela interface real.
- Task 11: minor (deferred): sem teste para algoritmo != `Ed` (revisor provou por experimento que é benigno: o WebCrypto falha a verificação, nunca dá falso positivo).
- Task 5: minor (deferred): `repo` chega sem validação nenhuma de `avaliacoes.py` (o `commit` passa por regex, o `repo` não). O revisor testou `ext::sh -c` e `--upload-pack=`: o git 2.50 bloqueia os dois por padrão, então não é explorável hoje — mas é a única entrada não validada que vira caminho de disco e argumento de clone.
- Task 15: minor (deferred): a conferência VISUAL do site num navegador (Step 7 do brief) não foi feita — a extensão do Chrome não está configurada nesta sessão. Tudo o que foi verificado do site é estrutural e comportamental. É dívida para o humano, não para o código.

## As decisões

### Ruling: trabalhar no ramo `indexador` em vez de worktree separada — o repositório existe só para este trabalho e não há nada em main a proteger. Custo se errado: um `git checkout main` desfaz.
### Ruling R2: `Recusado` sai de `manifesto.py` para `ferramentas/recusa.py` — todo módulo do gerador a levanta e nenhum outro valida manifesto; deixá-la lá faria `assinar.py` importar o validador de `mod.json` para recusar um cabeçalho de cache, contra a tabela de responsabilidade única do próprio plano. Custo se errado: um arquivo a menos e seis linhas de import a trocar.
### Ruling R3: `produtoRevogado` sai da Task 12 — nenhum consumidor. O site não sabe qual versão do produto quem lê tem instalada, então a função não tem como ser chamada; mantê-la seria código morto que o review final apontaria. Custo se errado: se um dia a página perguntar a versão a quem lê, são oito linhas de volta.
### Ruling R4: `#selo-integridade` sai das interfaces da Task 14 — declarado e nunca criado nem usado. Custo se errado: nenhum, é só a lista de interfaces.
### Ruling R5: `gerar.py` exclui `site/testes/` de `publicado/` — um teste servido em produção é código que ninguém revisa como código servido, e conta contra o teto de 20 000 arquivos do Pages. Acrescentado um teste que cobra. Custo se errado: nenhum plausível.
### Ruling R6: copiar os oito `.woff2` de `SEELE/apps/seele-app/ui/fontes/` durante a Task 14 — foi perguntado ao humano e não respondido, os arquivos existem no caminho previsto, e sem eles a página cai nos fallbacks. Custo se errado: `git rm` dos oito arquivos.
### Ruling: a Task 2 comita no repositório SEELE, que está no ramo `desenho/mods` com árvore limpa — é o ramo daquele trabalho, não main, e o plano aprovado a especifica. Custo se errado: `git reset --hard HEAD~1` lá.
### Ruling: o achado Critical («ordenar por str passa despercebido») fica PARKED, e não é defeito. O revisor investigou e provou o motivo: em Python a ordem por ponto de código e a ordem por bytes UTF-8 são idênticas para toda string válida — é propriedade de projeto do UTF-8. Confirmei em separado com 200 mil pares aleatórios mais as fronteiras U+007F/0080, U+07FF/0800, U+FFFF/10000: zero divergências. Nenhum sétimo vetor fecharia a lacuna, porque não há entrada que a torne observável. Custo se errado: nenhum — a mutação não muda o valor da função.
### Ruling: o achado Important É real e foi corrigido. O comentário afirmava «as duas ordens divergem a partir de U+0080», o que é falso. O erro nasceu no plano que EU escrevi e foi transcrito fielmente. Corrigi o plano, o brief e mandei o implementador corrigir o código. O comportamento não muda; muda a justificativa — um «por quê» falso na função mais carregada do projeto é pior que nenhum. Custo se errado: nenhum, é comentário.
### Ruling: os revisores estavam rodando teste de mutação **na árvore de trabalho compartilhada**, enquanto implementadores rodavam a suíte inteira. Consequências vistas: o implementador da Task 7 relatou «2 falhas pré-existentes» que eram na verdade a mutação 7 do revisor da Task 6, viva na árvore naquele instante. Risco pior, que NÃO se concretizou (verificado: `git log -S MUTACAO` vazio, e o commit 6af4207 tem só seus 4 arquivos): um agente comitar uma mutação com `git add -A`.
### Ruling (Task 3, Critical 1): `_bem_formado` usava `c.isdigit()`, que em Python é Unicode e aceita `²` e dígitos indo-arábicos; o Rust usa `is_ascii_digit`. Um id aceito pelo gerador e recusado pelo cliente é o pior caso que a tarefa existe para impedir. Corrigido no plano, no brief e no código, com testes. A frase errada era minha. Custo se errado: nenhum — a faixa ASCII explícita é estritamente mais restrita e espelha o Rust literalmente.
### Ruling (Task 3, Critical 2): `ler()` não validava tipos, então um `mod.json` com `"schema":"1"` levantava `TypeError` cru em vez de `Recusado`. Quebra o contrato do módulo e derrubaria a indexação inteira por causa de um arquivo torto. Acrescentada tabela `TIPOS` espelhando o que o `serde` valida, com o cuidado de `bool` ser subclasse de `int` em Python. Custo se errado: um manifesto legítimo recusado por tipo — mitigado pelos testes que exigem que ids e campos normais continuem passando.
### Ruling (Task 6, Critical): `ultima = a.versoes[-1]` pegava a última versão do ARQUIVO TOML e não a mais recente por `avaliado_em`, apesar de o comentário ao lado afirmar «mais recente avaliada». O revisor reproduziu o rebaixamento; a direção inversa é pior, porque uma versão `oficial` velha no fim do arquivo faria uma versão nova com ressalvas exibir o selo `oficial`. É o selo que decide instalar. O spec §3 diz «a versão mais recente», então o spec é a autoridade e o plano é que estava errado. Trocado por `max(..., key=avaliado_em)`. Custo se errado: nenhum plausível.
### Ruling (Task 7): ESCALEI um Minor do revisor para Important. Ele achou que `[[mods]]` sem `id` vira `id: ""` em silêncio, e classificou como Minor por ter vindo do brief. Severidade se mede por consequência, não por procedência: `revogacoes.json` é o que impede um MOD furado de ser instalado, e uma entrada sem `id` é uma revogação que não revoga nada enquanto parece ter funcionado. Acrescentado `_exigir` ao plano e ao brief; fix round pendente. Custo se errado: uma revogação legítima recusada por campo faltando — visível na hora, ao contrário do defeito.
### Ruling: implementadores concorrentes compartilham o ÍNDICE do git, não só a árvore. O agente da Task 9 fez `git add` dos seus 5 arquivos; outro agente rodou `git add` + `git commit` no intervalo e varreu os arquivos da Task 9 para dentro do commit dele (2fd571f). O conteúdo está correto e íntegro; só a fronteira do commit se perdeu. O agente da Task 9 reportou e NÃO tentou reescrever histórico — decisão certa, porque a árvore seguia recebendo commits.
### Ruling (Task 5): parar de tentar detectar a diferença e passar a eliminá-la. O git não distingue «objeto nunca existiu» de «objeto sumiu do disco» — a informação não está na resposta dele, e três rodadas tentando extraí-la é o sinal. Fix round 3: quando o `cat-file` falha num espelho vindo do CACHE, apagar e re-clonar; se falhar de novo num clone NOVO, é commit-ausente com certeza; se o clone falhar, é git-falhou. Troca adivinhação por fato, conserta de graça o caso recuperável, e custa um clone só no caminho de falha. Custo se errado: um clone extra numa falha rara.
### Ruling: minha instrução de commit estava incompleta. `git commit -- <caminhos>` não inclui arquivos NÃO RASTREADOS; arquivo novo precisa de `git add <caminhos exatos>` antes. O agente descobriu isso sozinho, testou isolado e usou um `git add` restrito, preservando a intenção. A instrução a partir daqui é `git add <caminhos exatos> && git commit -m "..." -- <mesmos caminhos>`. Custo se errado: nenhum.
### Ruling (Task 5, rodada 4): eu descrevi a regra estreita demais na rodada 3. A regra correta é uma frase — «um espelho reutilizado nunca é confiável; qualquer falha sobre ele custa exatamente uma reconstrução, e o veredito vem do clone novo» — e ela cobre o fetch também, eliminando a exceção que alguém teria de lembrar. Rodada 4 com implementador NOVO em modelo mais forte (opus), conforme a regra de escalada da skill. Custo se errado: um clone extra em falhas raras.
### Ruling (método de teste): as três rodadas caíram no mesmo defeito porque os testes observavam só o resultado final, e vários caminhos produzem o mesmo resultado. A rodada 4 exige INSTRUMENTAÇÃO: contar clones e reconstruções e afirmar o número exato por cenário. Um teste que afirma «exatamente uma reconstrução» não pode passar por acidente.
### Ruling (Task 14): o brief mandava copiar tokens.css/fontes.css do projeto de design, ao qual os subagentes não têm acesso. Redirecionei para SEELE/apps/seele-app/ui/, que é a mesma fonte e tem procedência verificável (conferido: mesmo cabeçalho, mesmos tokens). As licenças e o PROCEDENCIA.md vieram junto. Custo se errado: nenhum, os arquivos são idênticos.
### Ruling: fiz a re-revisão da Task 13 EU MESMO, inline, em vez de despachar um agente. A correção era um único teste acrescentado, e a evidência decisiva é mecânica: rodei intacto (8/8), apliquei a mutação de `paraHash` numa cópia e confirmei que falha exatamente o teste novo (7 pass, 1 fail), e conferi que o commit tocou só o arquivo de teste. Despachar um agente para isso custaria mais do que informaria. Custo se errado: uma correção de teste sem segundo par de olhos — mitigado por o review final do ramo cobrir tudo.
### Ruling: rodada 5 vai para o MESMO agente da rodada 4, e não um novo. A skill pede implementador novo em modelo mais forte nas rodadas 4-5; a rodada 4 já é opus e o agente acabou de demonstrar entendimento profundo do problema. Trocar agora custaria o contexto sem ganhar capacidade. Custo se errado: o mesmo par de olhos numa quinta tentativa — mitigado por a re-revisão ser de outro agente.
### Ruling: dos 4 Important novos, DOIS são consequência da regra que eu ditei: (3) o fetch em toda chamada de cache quente, quando o commit é imutável e eu tinha pedido «sem fetch desnecessário»; e (4) `arquivo-estranho` num cache quente disparando um re-clone inteiro para chegar à mesma recusa. Corrigi a REGRA, não só o código: «qualquer falha DO ESPELHO custa uma reconstrução — mas uma recusa sobre o conteúdo do commit não é falha do espelho, e não reconstrói». Custo se errado: `arquivo-estranho` deixaria de curar um espelho que estivesse corrompido de um jeito que se disfarça de arquivo estranho — implausível, porque `ls-tree` lê da árvore do commit.
### Ruling: incluí na rodada 5 um Minor (o `\` não neutralizado em `_caminho_do_espelho`) contra a regra de que Minor não entra no laço. Motivo: é uma linha, na mesma função sendo tocada, e o caminho de `mkdir(parents=True)` + clone não tem âncora nenhuma — num Windows escaparia do cache. Custo se errado: uma substituição a mais num nome de diretório.
### Ruling: re-revisão da Task 11 feita por mim, inline, pelo mesmo motivo da Task 13 — a evidência decisiva é mecânica e bidirecional, e eu a reproduzi. Custo se errado: coberto pelo review final do ramo.
### Ruling: incluí na mesma rodada um Minor — o guarda de frase órfã cobre `MOTIVOS` e `NOTAS` mas não `FALHAS`, que é justamente o dicionário que precisou ganhar entrada nesta tarefa por estar faltando uma. Motivo para não diferir: é o mesmo guarda que já provou valor duas vezes neste projeto, e a classe de defeito que ele pega (identificador cru vazando para a tela) é a que o `frases.js` inteiro existe para impedir. Custo se errado: um teste a mais que lê o fonte de outro módulo, o que é levemente frágil — pedi ao agente que escolha entre derivar do fonte ou exportar a lista, justificando.
### Ruling: re-revisão da Task 15 feita por mim, inline (mesmo critério das Tasks 11 e 13): a evidência é mecânica e bidirecional e eu a reproduzi. Custo se errado: coberto pelo review final do ramo.
### Ruling (Novo-2, Important, introduzido na rodada 5) — REAL E LOAD-BEARING, vai para a onda de correção do review final. Quando o espelho é um arquivo comum E a origem sumiu, o segundo `_descartar` roda sobre um caminho que já não existe, o `FileNotFoundError` cai no `except OSError` novo, e o diagnóstico verdadeiro («clone falhou: o repositório não existe») é substituído por um falso («descarte do espelho: No such file or directory»). Quem publica é mandado investigar o cache do próprio build quando o errado é a URL. É EXATAMENTE a classe de defeito que esta tarefa inteira existe para fechar — detalhe apontando para o lugar errado. Conserto trivial: tratar «não existe» como sucesso no descarte.
### Ruling (Novo-1, Important, introduzido na rodada 5) — REAL, vai junto. `veio_do_cache` é calculado antes de `_garantir_espelho` já ter descartado, então espelho-arquivo ou symlink mais falha posterior custa DOIS descartes e DOIS clones, contra a regra de cabeçalho que diz «exatamente uma». Medido.
### Ruling (Novo-4, Important de cobertura) — REAL E O MAIS IMPORTANTE DOS QUATRO, vai junto. A defesa contra seguir link simbólico não tem teste nenhum: o mutante que faz o descarte seguir o link passa 18/18 e apaga um diretório inteiro FORA do cache. É a única peça de segurança do arquivo, e é o mesmo padrão «mecanismo descrito no comentário, nada o prende» que derrubou quatro rodadas — agora justamente ali.
### Ruling (Novo-3, Important, PRÉ-EXISTENTE) — REAL, vai junto, e é o de maior raio. Um espelho que é diretório vazio (clone interrompido) não é repositório, mas `is_dir()` é True, então o git sobe a árvore e opera no repositório ENVOLVENTE. Medido: `git fetch --all` rodou no repositório do usuário e criou refs lá. O veredito final continua certo, mas é efeito colateral fora do cache. Conserto barato: exigir que a saúde devolva literalmente "true", mais `GIT_CEILING_DIRECTORIES` no ambiente do git.
### Ruling (Novo-5 e Novo-6) — PARKED como Minor. A âncora de `_descartar` é tautológica (a proteção real é a neutralização em `_caminho_do_espelho`, essa pinada por teste) e os dois mutantes pré-existentes seguem sem teste. Nenhum é defeito; o comentário da âncora dá crédito à linha errada, o que anoto para o dia em que alguém a leia.
### Ruling (processo): em vez de uma sexta rodada, levo os quatro para a ÚNICA onda de correção que a skill prevê depois do review final do ramo. É o caminho desenhado para isso, e junta as correções numa revisão só em vez de espalhá-las. Custo se errado: os quatro chegam ao review final ainda abertos e visíveis, que é o pior caso aceitável.

## Recomendação do review final que NÃO foi implementada

RECOMENDAÇÃO DO REVIEW FINAL, NÃO IMPLEMENTADA (é decisão do humano): eliminar o cache persistente de espelhos git e clonar num diretório temporário a cada chamada. Cada versão é buscada uma vez na vida e `gerar.py` roda na máquina de uma pessoa, então o ganho do cache é fraco perto do que ele custou — 5 rodadas de correção e ~150 das linhas mais retrabalhadas do repositório. Toda a categoria «espelho reaproveitado pode estar corrompido de um jeito novo» desaparece por construção.

## Rodada das revogações (achados C, D e E da auditoria `ab3eef73`)

Esta rodada fecha três achados e nada mais. A execução anterior foi cancelada
com a árvore preservada e **sem commit**, então o trabalho dela foi recuperado
por inspeção e transplantado. O que segue separa o que veio de lá do que nasceu
aqui, porque as duas coisas têm níveis de revisão diferentes: o recuperado
nunca passou por revisão de outro par de olhos, e o novo nasceu de uma
conferência de renderização feita nesta rodada.

### Código recuperado da execução cancelada `87884127`

Transplantado sem alteração, arquivo a arquivo:

- `site/revogacoes.js` (novo) — baixa, **confere a assinatura e só então
  interpreta os bytes**; devolve `{estado, causa, dados}` com `dados: null`
  fora de `integro`. Fecha os achados C e D.
- `site/testes/revogacoes.test.js` (novo) — lista assinada vazia, lista válida,
  indisponibilidade, bytes trocados, chave errada, comentário reescrito, JSON
  ilegível, forma inesperada, recuperação, e os dois guardas de lista fechada.
- `site/app.js`, `site/tela.js`, `site/frases.js`, `site/estilo.css`,
  `site/testes/frases.test.js` — os estados visíveis e as frases deles.
- `ferramentas/assinar.py` — o guarda de cache recusa **ausência** antes de
  comparar (achado E), e `_cache_de` passa a usar `[ \t]` no lugar de `\s`,
  que atravessava a linha em branco entre blocos e fazia um bloco mudo tomar
  emprestada a regra do bloco seguinte.
- `ferramentas/testes/test_assinar.py` — o `skipif` de minisign vira marca por
  teste, para que os guardas de cache (que não usam o binário) não sumam numa
  máquina sem ele. **Só ali**: em `test_gerar.py` o `pytestmark` de módulo fica
  onde está, e está certo — todo teste daquele arquivo chama `gerar()`, que
  assina, e uma marca por teste ali seria a mesma condição repetida vinte
  vezes. O que `test_gerar.py` recebeu foi um teste novo (o par sem regra
  nenhuma de cache), não uma troca de marca. A frase original dizia os dois
  arquivos; corrigido na rodada seguinte, sem tocar no comportamento.
- `indexador-de-mods.md` — as duas regras, escritas.

### Correções novas desta rodada

Nasceram de renderizar os cinco estados num navegador sem cabeça, sobre uma
vitrine assinada montada fora do repositório. Nenhuma toca `revogacoes.js`.

1. **`site/tela.js` + `site/estilo.css` — a nota do catálogo (`.nota-dos-selos`).**
   O achado C cita duas consequências: a tela de revogações dizendo «nada foi
   retirado» e nenhum cartão recebendo o selo vermelho. O recuperado fecha a
   primeira, e fecha a segunda na ficha do MOD — mas a tela do catálogo
   continuava desenhando os selos de nível em silêncio, e um cartão sem o
   vermelho ali se lê como um MOD que ninguém retirou. A nota diz, onde os
   selos são olhados em série, que eles não estão respondendo àquela pergunta.
   Custo se errado: uma linha a mais no topo do catálogo em toda falha de rede.

2. **`site/app.js` — contador de consulta em `atualizarRevogacoes`.**
   O botão «CONSULTAR DE NOVO» permite duas consultas em voo. Elas respondem
   fora de ordem, e a última a chegar é a que fica: a resposta lenta de uma
   falha apagaria o resultado bom que veio depois, e a tela voltaria a recusar
   uma lista que já tinha conferido — o caminho de volta desfazendo a si mesmo.
   Custo se errado: uma variável de módulo e uma comparação.

### O que NÃO foi feito, de propósito

Os demais achados da auditoria (A, B, F–L) seguem abertos: esta tarefa é C, D
e E. Nada foi publicado, nenhuma chave foi trocada, e não há commit.

## Rodada da avaliação por versão (achado B da auditoria `ab3eef73`)

Esta rodada fecha o achado B e nada mais. Ela parte da rodada das revogações
(C, D e E), que foi recuperada inteira — dez arquivos rastreados mais
`site/revogacoes.js` e `site/testes/revogacoes.test.js`, conferidos por hash
antes de qualquer edição — e continua sem commit.

### O achado, revalidado

`ferramentas/catalogo.py` recebia `nivel` e `notas` por versão dentro de
`VersaoPronta` e não os escrevia na saída. Confirmado lendo o código: `montar`
montava o dicionário de cada versão com `versao`, `api`, `publicado_em`,
`hash`, `alcanca` e `arquivos`, e os dois campos de avaliação morriam ali. A
consequência não estava só no gerador: `site/tela.js` não tinha o que ler, e
usava `mod.nivel` e `mod.commit` — que são os da versão avaliada mais
recentemente — na ficha de qualquer versão.

### As decisões

### Ruling: emitir também o `commit` por versão, e não só `nivel` e `notas`.
O achado nomeia dois campos, mas a ficha da tela mostra três, e o terceiro tem
o mesmo defeito com a consequência pior: `COMMIT AVALIADO` ao lado do `HASH DO
CONTEÚDO` de outra versão afirma que revisamos bytes que não são aqueles. Um
conserto que deixasse o commit misturado fecharia o achado e não fecharia o
defeito. Custo se errado: uma chave a mais por versão, que nenhum leitor atual
é obrigado a ler.

### Ruling: `nivel` e `notas` saem de `VersaoPronta`; `commit` sai de `Versao`.
Os dois primeiros são literalmente os campos que o achado diz serem
descartados, e emiti-los de onde eles morriam é o que fecha o achado. O
`commit` não existe em `VersaoPronta`, e acrescentá-lo lá obrigaria a mexer na
ordem dos campos do dataclass — que tem construção posicional em quatro linhas
de teste. Ele já está no `Versao` que o laço percorre, que é a mesma origem do
`commit` no nível do MOD. Custo se errado: duas origens para três campos que
`gerar.py` copia do mesmo objeto; anotado no código.

### Ruling: `esquema` continua `1`, e nada existente muda.
Só há acréscimo de chaves dentro de `versoes[]`. Nenhum nome, nenhum sentido e
nenhuma chave removida — inclusive os campos de avaliação no nível do MOD, que
seguem querendo dizer «a avaliação mais recente» e seguem sendo o que o cartão
do catálogo e os filtros leem. Bumpar o esquema obrigaria todo leitor a tratar
uma versão nova de formato para ganhar campos que ele pode ignorar. Custo se
errado: um leitor que exija esquema novo para campos novos não terá o sinal —
mitigado por o contrato dizer, por escrito, que a presença do campo é o sinal.

### Ruling: o site cai no campo do MOD quando o da versão falta.
`avaliacaoDaVersao` usa `??` para isso. Não é indecisão: um `catalogo.json`
assinado antes desta mudança não tem o que responder, e o campo do MOD é
exatamente o que a tela mostrava antes — a aproximação honesta, e a única
disponível. Custo se errado: nenhum; com catálogo novo o ramo nunca é tomado.

### Ruling: a versão escolhida é estado de tela e NÃO entra na rota.
Pôr o número no `#/` faria dele contrato de link permanente, e uma versão que
saísse do catálogo transformaria links guardados por aí em rota morta. O
`#/mod/<id>` fica intacto. Custo se errado: recarregar a página volta para a
versão mais recente, e a escolha não é compartilhável por link.

### Ruling: o seletor só aparece com mais de uma versão.
Um botão sozinho não é uma escolha, e o número da única versão já está na
ficha. Custo se errado: nenhum.

### Ruling: o selo do cartão do catálogo passa a ser o da versão que o cartão
mostra. Os dois coincidem hoje — `publicado_em` é o `avaliado_em` da avaliação,
então «mais recente» dá a mesma versão nas duas contas. Foi amarrado
justamente por isso: um cartão que anuncia um número de versão e o nível de
outra é o mesmo defeito em forma silenciosa, e depender de uma coincidência
para não tê-lo é depender de ninguém mexer nas duas contas. Custo se errado:
nenhum observável hoje.

### Ruling: `botoesDeVersao` sai de dentro dos `createElement` e é exportada.
`site/tela.js` não tem teste de DOM por decisão do projeto, e a decisão que
esta rodada corrige é justamente «de quem é o selo». Deixá-la entre dois
`append` seria pô-la no único lugar do site onde nada a prende — que é a forma
exata do defeito original. Mesmo molde de `linhasDaFicha`. Custo se errado:
uma função exportada a mais.

### Ruling: a mistura é provada por mutação, e não por leitura.
Todos os testes novos usam duas versões com vereditos **diferentes**: com os
dois iguais, publicar o veredito do MOD dentro de cada versão passa por
qualquer asserção sem ser notado — que é como este defeito viveu desde o
começo. Medido nos dois lados: a mutação que volta a ler o veredito do MOD
derruba 5 testes em Python e 3 em JavaScript, e nenhum outro.

### O que NÃO foi feito, de propósito

Os demais achados da auditoria (A, F–L) seguem abertos: esta tarefa é o B.
Nenhuma avaliação real foi criada, nenhuma chave trocada, nada publicado, nada
comitado, e o repositório do app SEELE não foi tocado — o contrato para ele
está escrito em `indexador-de-mods.md`, para ser lido quando for a vez dele.

## Rodada dos dois achados da revisão do B

Esta rodada fecha os dois achados que a revisão da rodada anterior levantou, e
nada mais. Ela parte daquela rodada, recuperada inteira — quinze arquivos
rastreados mais `site/revogacoes.js` e `site/testes/revogacoes.test.js`,
conferidos por hash contra a origem antes de qualquer edição — e continua sem
commit.

### As decisões

### Ruling (revisão, achado 1): o exemplo do contrato ganha uma conferência,
e não só uma correção. `indexador-de-mods.md` trazia `"oficial": true` ao lado
de `"nivel": "verificado"`, que `ferramentas/catalogo.py` nunca emite — ali
`oficial` É `nivel == "oficial"`. Corrigir o `true` para `false` custava uma
letra e não impedia a volta: o exemplo não roda, ninguém o executa, e o mesmo
bloco está copiado no spec e no plano. `ferramentas/testes/test_documentacao.py`
lê os blocos ```json de toda a documentação, parseia cada um, e reprova a
combinação. Tem também um teste que conta quantos exemplos de catálogo foram
achados — sem ele, mexer na cerca ```json desligaria a conferência em silêncio.
O spec (§3, linha 152) já estava coerente e não foi tocado. Custo se errado:
a conferência reprova um exemplo futuro legítimo, e aí é o exemplo que está
descrevendo um catálogo que o gerador não produz.

### Ruling (revisão, achado 2): a escolha de versão passa a ser por id do MOD.
O cartão da lista lia `versaoMaisRecente(mod)` e o veredito do MOD, e não
tinha como fazer diferente: a escolha vivia num campo único que era apagado ao
sair da ficha. Um mapa `id → versão` resolve as duas pontas — a escolha não
vaza para o MOD vizinho (que era o motivo de a limpeza existir) e sobrevive à
volta para a lista, que é o que dá ao cartão o que mostrar. `dadosDoCartao`
sai de dentro dos `createElement` pelo mesmo motivo de `botoesDeVersao`: é uma
decisão, e decisão sem teste no único módulo sem teste de DOM é onde este
defeito nasceu. Custo se errado: a escolha persiste mais do que alguém espera;
ela é estado de tela e some ao recarregar.

### Ruling: o selo do cartão fala da versão do cartão, e o «outra versão foi
retirada» vira linha própria. O selo vermelho vinha de `mod.temRevogada` —
qualquer versão do MOD. Com o cartão anunciando um número, o mesmo vermelho
passava a dizer que AQUELE número foi retirado, o que é falso quando a retirada
foi noutra versão. O selo passa a ser da versão exibida e a informação que ele
carregava não some: `outraRevogada` vira uma linha curta no cartão. Perder o
aviso teria sido pagar a coerência com segurança. Custo se errado: uma linha a
mais num cartão de MOD com versão retirada.

### Ruling: o identificador continua `autor/nome`, e a tela diz o que ele traz.
O critério pedia que a ação de instalação usasse a versão escolhida. O que o
app aceita hoje é `autor/nome`, e ele instala a mais recente — passo 5 de «o
que o cliente faz». Escrever `autor/nome@versao` na tela seria anunciar um
contrato que o outro lado não tem, e quem digitasse levaria um erro do app.
Então `acaoDeInstalar` devolve tudo da versão escolhida (hash, base, caminhos)
e mais `ehMaisRecente`, e a tela avisa, nomeando o número, quando o
identificador não traz a versão que está na ficha. **Escopo devolvido ao
SEELE:** aceitar `autor/nome@versao` em Configurações · Mods, instalando a
versão pedida e conferindo o hash dela. Custo se errado: a pessoa usa a lista
de arquivos e o hash, que é o caminho que já existia.

### Ruling: a volta do defeito é provada por mutação, de novo.
Devolver o cartão a `versaoMaisRecente(mod)`/`mod.nivel` e a ação a
`versaoMaisRecente(mod)` derruba 10 testes — 6 do cartão e do aviso em
`site/testes/tela.test.js`, 4 da ação em `site/testes/catalogo.test.js` — e
nenhum outro. Os dois MODs de teste seguem com vereditos diferentes entre as
versões, pelo mesmo motivo da rodada anterior.

### O que NÃO foi feito, de propósito

Os demais achados da auditoria (A, F–L) seguem abertos. Nenhuma avaliação real
foi criada, nenhuma chave trocada, nada publicado, nada comitado, e o
repositório do app SEELE não foi tocado — o `autor/nome@versao` que a tela
gostaria de oferecer está escrito acima como escopo para uma tarefa daquele
projeto. Não houve conferência visual em navegador nesta rodada: as duas
classes de CSS novas (`.cartao-retirada`, `.aviso-da-escolha`) foram escritas
com tokens que já existem e sem colidir com nome nenhum, mas ninguém as viu
desenhadas.
