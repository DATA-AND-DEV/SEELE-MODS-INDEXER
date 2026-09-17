# Pôr o indexador no ar

> **O que fazer, na ordem, com os comandos.** A decisão é o
> [ADR 0045](https://github.com/DATA-AND-DEV/SEELE/blob/main/docs/adr/0045-mods-o-produto-base-tem-regras-e-um-mod-nao.md)
> e o desenho é `indexador-de-mods.md`. Esta página é só a operação.

**Escrito em 2026-09-17.** O que já está feito está marcado; o resto é seu.

---

## A ordem importa, e este é o motivo

A chave de MOD é compilada **para dentro** de cada SEELE publicado. Um cliente
que sai com a chave de desenvolvimento só aceita catálogos assinados por ela —
para sempre, naquela versão. Trocar a chave depois não é editar um arquivo: é
publicar um cliente novo e esperar o mundo atualizar.

Então:

```
1. chave de produção  →  2. trocar mods.pub nos dois repositórios
                      →  3. regerar e comitar
                      →  4. Cloudflare
                      →  5. só então publicar o SEELE
```

Publicar o SEELE antes do passo 2 custa uma release inteira para desfazer.

---

## 1 · A chave de produção

A que assina hoje é a de desenvolvimento (`~/.minisign/mods-dev.key`), e o
`chaves/LEIA.md` já dizia para trocá-la antes do primeiro MOD real.

**Antes, confira que não há nada a ser destruído.** O `minisign -G` recusa
sobrescrever uma chave existente, e o jeito de forçá-lo — `-f` — apagaria a
privada sem perguntar. Nunca use `-f` aqui.

```sh
ls ~/.minisign/mods.key 2>/dev/null && echo "JÁ EXISTE — pare e escolha outro nome" || echo "livre para gerar"
```

```sh
minisign -G -p /tmp/mods-producao.pub -s ~/.minisign/mods.key
```

### Se ele abortar dizendo que a chave já existe

Então a privada já está lá — de uma geração anterior, ou de uma tentativa que
você interrompeu. **Não use `-f`**: ele apagaria a privada sem perguntar, e com
ela todo catálogo que os clientes já publicados sabem conferir.

A pública se recria a partir da privada, sem gerar par nenhum:

```sh
minisign -R -s ~/.minisign/mods.key -p /tmp/mods-producao.pub
```

Ele pede a senha daquela chave, e isso serve de segunda conferência: **se ela
abrir, é a senha certa** — a mesma que vai no `MINISIGN_PASSWORD` do passo 3.
Melhor descobrir aqui do que no meio do `gerar.py`.

Depois disso, siga do passo 2 normalmente.

### Se for a primeira vez

Ele pede uma senha duas vezes. **Ponha uma.** Sem senha, a chave é um arquivo em
disco que autoriza código de terceiro a rodar na máquina de outras pessoas, e
basta alguém copiá-lo. O gerador sabe pedi-la desde 2026-09-17:

```sh
export MINISIGN_PASSWORD='a que você escolheu'
```

**Guarde a senha onde você guarda senha de verdade**, e a chave privada fora do
repositório. Ela nunca entra na Cloudflare, nunca entra em CI — não há build
remoto neste projeto justamente para que não exista onde enfiá-la.

**Faça uma cópia de segurança da chave privada.** Perdê-la significa que nenhum
catálogo novo pode ser assinado para os clientes que já saíram: eles só aceitam
a chave que trazem dentro. Não há recuperação.

## 2 · Trocar a pública nos dois repositórios

Ela vive em dois lugares, e os dois têm de ser os mesmos bytes:

```sh
cp /tmp/mods-producao.pub ~/SEELE-MODS-INDEXER/chaves/mods.pub && cp /tmp/mods-producao.pub ~/SEELE/apps/seele-app/chaves/mods.pub
```

E confira, em vez de supor — esta é a linha que separa «troquei nos dois» de
«troquei num e não no outro», que é o estado em que tudo parece bem até o
primeiro cliente recusar o catálogo:

```sh
cmp -s ~/SEELE-MODS-INDEXER/chaves/mods.pub ~/SEELE/apps/seele-app/chaves/mods.pub && echo "IDÊNTICAS: $(sed -n 1p ~/SEELE-MODS-INDEXER/chaves/mods.pub)" || echo "DIFERENTES — não siga"
```

Tem de sair `IDÊNTICAS` seguido do identificador da chave **nova**. Se ainda
vier `C069B28F78EA03BF`, é a de desenvolvimento: a cópia não aconteceu.

O segundo caminho é o que o cliente compila para dentro de si. Há teste dos dois
lados que reprova se eles divergirem — ver `apps/seele-app/testes/LEIA.md`.

Depois de trocar, os vetores de teste do SEELE ficam assinados pela chave velha
e o teste vai reprovar. É o guarda funcionando. Regere-os no passo 3.

## 3 · Regerar, conferir e comitar

```sh
cd ~/SEELE-MODS-INDEXER
python3 -m ferramentas.gerar --chave ~/.minisign/mods.key
```

Sai `0 mods, 0 versões, 0 revogações` enquanto não houver avaliação nenhuma —
e um catálogo **vazio e assinado** é o estado correto do primeiro dia. Confira:

```sh
minisign -V -p chaves/mods.pub -m publicado/catalogo.json
# Signature and comment signature verified
```

Atualize os vetores do cliente e rode a suíte dele:

```sh
for f in catalogo revogacoes; do cp "publicado/$f.json" ~/SEELE/apps/seele-app/testes/"$f-do-indexador.json"; cp "publicado/$f.json.minisig" ~/SEELE/apps/seele-app/testes/"$f-do-indexador.json.minisig"; done
```

```sh
cd ~/SEELE && cargo test -p seele-app --bin seele-app o_catalogo::
```

Os três testes de vetor têm de passar. Se reprovarem, o cliente e o indexador
discordam — e é melhor descobrir agora que depois de publicar.

Então comite nos dois. **No indexador, o commit de `publicado/` é o deploy.**

## 4 · Cloudflare Pages

O domínio já está na Cloudflare — `seele.app.br` usa os nameservers dela. Isso
poupa a metade chata: o subdomínio é criado pelo próprio Pages.

### 4.1 Criar o projeto

No painel: **Workers & Pages → Create → Pages → Connect to Git**, e escolha
`DATA-AND-DEV/SEELE-MODS-INDEXER`, ramo `main`.

Nas configurações de build:

| campo | valor |
|---|---|
| Framework preset | **None** |
| Build command | **vazio** |
| Build output directory | `publicado` |
| Root directory | `/` |

O `wrangler.jsonc` deste repositório já fixa o diretório de saída, e é ele que
manda. Ele existe por uma cicatriz do `SEELE-SITE`: aquele campo já foi
publicado vazio uma vez, e vazio faz o Pages servir **a raiz do repositório** —
aqui isso exporia `ferramentas/` e `avaliacoes/`, e o `catalogo.json` daria 404
com o site parecendo no ar.

**O comando de build fica vazio de propósito.** Este repositório não compila
nada: `publicado/` chega pronto, assinado na sua máquina. É essa ausência de
build remoto que sustenta a promessa do ADR 0026 — não há passo na nuvem onde
um segredo caiba.

### 4.2 O domínio

**Custom domains → Set up a custom domain →** `mods.seele.app.br`.

Como a zona já está na Cloudflare, o registro de DNS é criado sozinho e o
certificado sai em minutos. Não há nada a fazer no registrador.

### 4.3 O que **não** ligar

- **Web Analytics: não.**
- **Logpush: não.**
- Nada de análise, nada de tag de terceiro.

Não é preferência. O argumento do ADR 0045 para catálogo estático é que *«com
API o indexador aprende cada termo que alguém digitou; com catálogo, aprende que
alguém buscou o catálogo»* — e ligar análise desfaz isso por fora, sem tocar numa
linha de código. Os registros que a Cloudflare guarda para si já são um custo
que o `indexador-de-mods.md` assume em voz alta; os que **pedirmos** que ela
guarde seriam escolha nossa.

Isso merece uma linha nas notas de release do dia em que o indexador for ao ar:
um produto que se vende como auto-hospedado e passa a depender de uma CDN
precisa dizer isso, em vez de deixar descobrir.

### 4.4 Conferir que subiu

```sh
curl -sS https://mods.seele.app.br/catalogo.json
# {"esquema":1,"gerado_em":...,"mods":[]}

curl -sSo /tmp/c.json  https://mods.seele.app.br/catalogo.json
curl -sSo /tmp/c.sig   https://mods.seele.app.br/catalogo.json.minisig
minisign -V -p chaves/mods.pub -m /tmp/c.json -x /tmp/c.sig
# Signature and comment signature verified
```

E as regras de cache, que são a parte que o `_headers` mais pede para conferir:

```sh
curl -sSI https://mods.seele.app.br/revogacoes.json | grep -i cache-control
# public, max-age=60, must-revalidate
```

Se o `cache-control` vier diferente do que o `_headers` declara, o Pages não
está lendo o arquivo — quase sempre porque o diretório de saída está errado.

## 5 · Só então publicar o SEELE

Com a chave de produção dentro do cliente, siga
`docs/notas-da-v0.11.0.md` no repositório do produto: criar a tag `v0.11.0` e
empurrá-la dispara o release.

---

## Depois: o primeiro MOD de verdade

1. A solicitação chega como issue (o botão **PUBLICAR** do site abre uma
   preenchida, e há modelo em `.github/ISSUE_TEMPLATE/`).
2. Você clona o repositório declarado, no commit declarado, e avalia. O veredito
   é **verificado**, **publicado com notas** ou **negado** — e é um filtro, não
   uma prova: pega o óbvio, não pega o caminho sutil na décima função de um
   arquivo limpo.
3. Escreva `avaliacoes/<autor>/<nome>.toml` com o veredito e o commit. O código
   do autor **não** é copiado para cá: duas cópias divergem, e a que serve é a
   que sai do commit fixado.
4. `python3 -m ferramentas.gerar --chave ~/.minisign/mods.key`, confira, comite.
5. Responda na issue. O veredito é público.

Acrescentar versão nunca edita uma que já existe — a mesma regra *append-only*
das migrações, e o `gerar.py` a cobra.

---

## O que já está feito, para não refazer

- `publicado/` gera, com catálogo e revogações assinados e conferidos.
- O cliente do SEELE lê este formato, e há vetor cruzado entre os dois
  repositórios que reprova se eles divergirem.
- O botão de solicitação aponta para um repositório que existe. Ele apontava
  para `seele/SEELE-MODS-INDEXER`, que é 404.
- Há modelo de issue, com os quatro campos sem os quais a avaliação não começa.
- O assinador aceita chave com senha (`MINISIGN_PASSWORD`).
- `wrangler.jsonc` fixa o diretório de saída.
