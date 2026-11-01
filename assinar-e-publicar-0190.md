# Assinar e publicar o `seele/multiplayer` 1.0.0 (SEELE 0.19)

> **O que fazer, na ordem, com os comandos.** O que é cada passo está em
> `por-no-ar.md` (a chave, o `MINISIGN_PASSWORD`, o Cloudflare Pages) e em
> `indexador-de-mods.md` (o desenho). Esta página é só a operação desta entrega.

**Escrito em 2026-10-31**, no ramo `desenho/0.19-api-8` (cortado de
`desenho/0.19-perfis-descontinuado`, que marca o PERFIS como descontinuado, e
continua marcando).

## O que já está feito, e o que não está

- O indexador conhece a API 8 (`ferramentas/manifesto.py`): `VERSAO_DA_API = 8`,
  `APIS_ACEITAS = (8, 7, 6, 5, 4, 3)`, as chaves `plataformas`, `poderes` e
  `maquina` com as recusas do `read_manifest` da 0.19. O vetor
  `api-do-indexador.json` que ele gera é byte a byte o que já está no SEELE
  (`apps/seele-app/testes/api-do-indexador.json`).
- `avaliacoes/seele/multiplayer.toml` fixa a 1.0.0 no commit
  `34d02dc6cc59477d14f37f8dda66c7b345918297` (ramo `desenho-0.19` do MOD). O
  hash do conteúdo é
  `4c608766f1815c349fa25c4841a90a69b1e2c8efad9dfe12720badba6c03ceae` (85
  arquivos, 1,3 MiB).
- `publicado/` foi gerado **sem assinatura** na árvore de trabalho, e **não está
  comitado**: não há `catalogo.json.minisig` nem `revogacoes.json.minisig` ali.
  Ele existe para ser conferido, e o passo 2 o substitui inteiro.
- **Nada foi empurrado, nada foi assinado.** O repositório do MOD ainda não
  responde no GitHub: `git ls-remote https://github.com/DATA-AND-DEV/SEELE-MOD-MULTIPLAYER`
  pede usuário, que é o que o GitHub responde a um repositório que não existe ou
  não é público.

### Como o gerador leu um commit que não está no GitHub

O `ferramentas/fonte.py` não tem opção nem variável para outra origem, e nenhuma
foi inventada. Ele tem um cache: um espelho nu por repositório em
`.cache-de-repos/` (no `.gitignore`), e procura o commit **no espelho antes de
ir à rede**. O espelho do MULTIPLAYER foi semeado a partir do clone local:

```sh
git clone --mirror ~/SEELE-MOD-MULTIPLAYER-019 .cache-de-repos/https___github.com_DATA-AND-DEV_SEELE-MOD-MULTIPLAYER.git
```

Os bytes são os do commit, e o commit é o mesmo que vai para o GitHub, então o
hash não muda. **Mas esse espelho tem de ser apagado antes do passo 2**: com ele
lá, o gerador nunca pergunta ao GitHub, e o passo 1 ficaria sem prova.

---

## 1 · Empurrar o repositório do MOD

O repositório tem de ser **público** (ADR 0045: o `repo` é condição de
publicação) e conter o commit fixado. Crie `DATA-AND-DEV/SEELE-MOD-MULTIPLAYER`
no GitHub, público e vazio, se ainda não existir. Então:

```sh
cd ~/SEELE-MOD-MULTIPLAYER-019
git rev-parse desenho-0.19    # tem de ser 34d02dc6cc59477d14f37f8dda66c7b345918297
git remote get-url origin 2>/dev/null || git remote add origin https://github.com/DATA-AND-DEV/SEELE-MOD-MULTIPLAYER.git
git push origin desenho-0.19
```

(Se o `main` do MOD deve apontar para a 1.0.0, empurre também
`git push origin desenho-0.19:main` — o gerador só precisa que o commit esteja
em algum ramo.)

Confira **sem credencial**, que é como o gerador e qualquer pessoa vão ver:

```sh
GIT_TERMINAL_PROMPT=0 git ls-remote https://github.com/DATA-AND-DEV/SEELE-MOD-MULTIPLAYER | grep 34d02dc6cc59477d14f37f8dda66c7b345918297
```

Tem de sair uma linha. Se pedir usuário ou não sair nada, o repositório não é
público ou o commit não subiu: não siga.

## 2 · Regerar (e assinar, que é o mesmo comando)

O `gerar.py` não produz `publicado/` sem assinar: ele monta, assina com a chave
que recebe e só então troca o diretório. Regerar e assinar são um comando só.

Primeiro, o espelho semeado sai, para o gerador buscar do GitHub:

```sh
cd ~/SEELE-MODS-INDEXER-api8
rm -rf .cache-de-repos/https___github.com_DATA-AND-DEV_SEELE-MOD-MULTIPLAYER.git
```

E a suíte, antes de tocar a chave:

```sh
python3 -m pytest -q
node --test site/testes/*.test.js
```

Então, com a chave de produção (`por-no-ar.md`, passo 1; a pública dela é a de
`chaves/mods.pub`, `32D58C50C0AB34E8`, a mesma que o app compila):

```sh
export MINISIGN_PASSWORD='a senha da chave de produção'
python3 -m ferramentas.gerar --chave ~/.minisign/mods.key
unset MINISIGN_PASSWORD
```

Tem de sair `4 mods, 31 versões, 0 revogações`. Uma recusa sai como
`recusado [<código>] <detalhe>`; `commit-ausente` aqui quer dizer que o passo 1
não está feito.

## 3 · Conferir a assinatura

```sh
minisign -V -p chaves/mods.pub -m publicado/catalogo.json
minisign -V -p chaves/mods.pub -m publicado/revogacoes.json
# Signature and comment signature verified (duas vezes)
```

E que o que foi assinado é o que foi conferido aqui, mudando só o horário:

```sh
git diff --stat -- publicado
grep -c '"seele/multiplayer"' publicado/catalogo.json      # 1
grep -A4 '"versao": "1.0.0"' publicado/catalogo.json | grep 4c608766f1815c349fa25c4841a90a69b1e2c8efad9dfe12720badba6c03ceae
```

O hash tem de ser `4c608766…ceae`. Se for outro, os bytes que vieram do GitHub
não são os do commit avaliado: não siga.

**As versões que o preflight do SEELE 0.19 exige continuam no catálogo.** O
`publicar.sh` (`MODS_OFICIAIS_DO_PORTAO`) pede `seele/estilo@5.0.0@7`,
`seele/mesa@5.0.0@7`, `seele/perfis@5.0.0@7` e `seele/mesa@4.0.1@6`, fora das
revogações. Conferido no catálogo gerado sem assinatura: as quatro estão, com
essas APIs, e nenhuma versão do catálogo vivo (`gerado_em` 1793127397, 30
versões) sumiu ou mudou de hash — a única novidade é `seele/multiplayer` 1.0.0.
Confira de novo no assinado, pelo mesmo código do app (do checkout do SEELE da
0.19):

```sh
cd ~/SEELE-api8-019
cargo run -q -p seele-sessao --example conferir_catalogo -- \
  ~/SEELE-MODS-INDEXER-api8/publicado/catalogo.json ~/SEELE-MODS-INDEXER-api8/publicado/catalogo.json.minisig \
  ~/SEELE-MODS-INDEXER-api8/publicado/revogacoes.json ~/SEELE-MODS-INDEXER-api8/publicado/revogacoes.json.minisig \
  apps/seele-app/chaves/mods.pub \
  --exige seele/estilo@5.0.0@7 --exige seele/mesa@5.0.0@7 --exige seele/perfis@5.0.0@7 --exige seele/mesa@4.0.1@6 \
  --exige seele/multiplayer@1.0.0@8
cd ~/SEELE-MODS-INDEXER-api8
```

O último `--exige` não está na lista do `publicar.sh`: a 0.19 não **exige** o
MULTIPLAYER para sair. Ele está aqui para provar que a entrega desta página
chegou.

## 4 · Comitar

O código, os testes e a avaliação já estão comitados neste ramo. Falta o
`publicado/` assinado:

```sh
git add -A publicado
git status --short          # só publicado/, com os dois .minisig de volta
git commit -m "Publish signed seele/multiplayer 1.0.0, the first API 8 MOD"
```

**O commit de `publicado/` é o deploy** — mas só no `main`. Leve o ramo para lá
pelo caminho de sempre (merge ou PR de `desenho/0.19-api-8`).

## 5 · Empurrar

```sh
git push origin desenho/0.19-api-8
# e, depois do merge, o main — que é o que o Cloudflare Pages publica
git push origin main
```

## 6 · Conferir em https://mods.seele.sh

Espere o Pages terminar o deploy do `main`. Então, de fora:

```sh
cd "$(mktemp -d)"
for f in catalogo.json catalogo.json.minisig revogacoes.json revogacoes.json.minisig; do curl -sSfo "$f" "https://mods.seele.sh/$f"; done
minisign -V -p ~/SEELE-MODS-INDEXER-api8/chaves/mods.pub -m catalogo.json
cmp catalogo.json ~/SEELE-MODS-INDEXER-api8/publicado/catalogo.json && echo "o servido é o comitado"
curl -sSf https://mods.seele.sh/mods/seele/multiplayer/1.0.0/mod.json | cmp - ~/SEELE-MODS-INDEXER-api8/publicado/mods/seele/multiplayer/1.0.0/mod.json && echo "o pacote está servido"
curl -sSI https://mods.seele.sh/catalogo.json         | grep -i cache-control
curl -sSI https://mods.seele.sh/catalogo.json.minisig | grep -i cache-control   # o mesmo da linha de cima
```

E o preflight do SEELE, contra o que está no ar — é o que o `publicar.sh` da
0.19 vai rodar:

```sh
cd ~/SEELE-api8-019
cargo run -q -p seele-sessao --example conferir_catalogo -- \
  "$OLDPWD/catalogo.json" "$OLDPWD/catalogo.json.minisig" "$OLDPWD/revogacoes.json" "$OLDPWD/revogacoes.json.minisig" \
  apps/seele-app/chaves/mods.pub \
  --exige seele/estilo@5.0.0@7 --exige seele/mesa@5.0.0@7 --exige seele/perfis@5.0.0@7 --exige seele/mesa@4.0.1@6 \
  --exige seele/multiplayer@1.0.0@8
```

Um `200` sozinho não prova nada: o Pages devolve a página do site com `200`
para qualquer caminho. Quem prova é a assinatura, o `cmp` e o `--exige`.

### Depois, se quiser os vetores do cliente em dia

Como no `por-no-ar.md`, passo 3: copie `publicado/catalogo.json`,
`publicado/revogacoes.json` e os dois `.minisig` para
`~/SEELE-api8-019/apps/seele-app/testes/` (`catalogo-do-indexador.json` e
`revogacoes-do-indexador.json`) e rode a suíte do app. O
`api-do-indexador.json` não precisa: o que este ramo gera já é o que está lá.
