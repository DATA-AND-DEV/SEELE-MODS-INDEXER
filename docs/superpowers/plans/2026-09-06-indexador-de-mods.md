# Indexador de MODs — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir `mods.seele.app.br` — um site estático na Cloudflare Pages que serve um catálogo assinado de MODs — e o `gerar.py` que o monta a partir dos vereditos de avaliação e dos commits fixados nos repositórios dos autores.

**Architecture:** Dois artefatos e nenhum serviço. `ferramentas/gerar.py` roda na máquina de quem tem a chave privada de MOD: lê `avaliacoes/*.toml`, busca cada commit fixado no repositório do autor, calcula o `content_hash` de cada versão, monta `catalogo.json` e `revogacoes.json`, assina os dois com `minisign`, e escreve `publicado/`. O `publicado/` é comitado, e o commit é o deploy. O site em `publicado/` é HTML e ES modules soltos, sem build, sem dependência, com um único módulo tocando o DOM.

**Tech Stack:** Python 3.14 (só biblioteca padrão + `pytest` para testes), `minisign` (binário), `git` (busca dos commits), JavaScript ES2022 (`node --test` para os módulos puros), Cloudflare Pages.

**Spec:** `docs/superpowers/specs/2026-09-06-indexador-de-mods-design.md` — leia antes da Task 1. O plano argumenta a partir dele.

## Global Constraints

Valem em toda tarefa, e não são repetidas em cada uma.

- **Zero dependência em runtime.** O site não carrega nada de CDN nem de `node_modules`. `gerar.py` usa só a biblioteca padrão do Python; `pytest` é dependência de teste, nunca importada por código de produção.
- **Zero build.** Nenhum bundler, transpilador, minificador ou `package.json` com `dependencies`. Os arquivos que o Pages serve são os arquivos que estão no repositório.
- **Nenhuma rota de busca, nunca.** Nenhuma função de borda, nenhum Worker, nenhum endpoint. Se uma tarefa parecer pedir um, ela está mal lida — pare e pergunte.
- **Nenhuma análise.** Sem Web Analytics, sem Logpush, sem pixel, sem `fetch` para terceiro. Nenhum `<script src>` externo.
- **A chave privada nunca sai da máquina.** Não entra em CI, não entra em variável de ambiente comitada, não entra em `publicado/`. Só `chaves/mods.pub` é comitada.
- **Português nas mensagens, identificadores e nomes de arquivo.** Código em português, no molde do repositório SEELE. Comentários explicam **por quê**, não o quê.
- **Nenhuma frase para gente nasce fora de `frases.js`.** O gerador e os módulos puros produzem identificadores de listas fechadas; a frase é sempre do `frases.js` (ADR 0012).
- **`content_hash` é hexadecimal minúsculo**, sempre, em todo lugar.
- **`commit` é SHA-1 completo de 40 caracteres**, nunca abreviado.
- **Zero `border-radius`, zero sombra** (`tokens.css`). Todo espaçamento é múltiplo da célula de 8px × 16px.
- **Toda tarefa termina em commit.** Mensagem em português, imperativo, dizendo o porquê quando não for óbvio.

## Estrutura de arquivos

Decidida no spec §1; travada aqui.

| arquivo | responsabilidade única |
|---|---|
| `ferramentas/hash_conteudo.py` | a definição do `content_hash`, e nada mais |
| `ferramentas/avaliacoes.py` | ler e validar `avaliacoes/*.toml` |
| `ferramentas/fonte.py` | buscar um commit fixado e devolver os pares `(caminho, bytes)` |
| `ferramentas/manifesto.py` | validar `mod.json` com as cinco recusas do Rust |
| `ferramentas/catalogo.py` | montar `catalogo.json`, cobrar *append-only* |
| `ferramentas/revogacoes.py` | `revogacoes.toml` → `revogacoes.json` |
| `ferramentas/assinar.py` | invocar `minisign`, conferir o cache do par assinado/assinatura |
| `ferramentas/gerar.py` | a CLI que orquestra os sete acima |
| `listas.json` | as listas fechadas de `motivo` e `nota` — fonte única para Python e JS |
| `site/verificar.js` | minisign no navegador: integridade, nunca autenticidade |
| `site/catalogo.js` | filtrar, ordenar, buscar, cruzar revogações |
| `site/frases.js` | identificador → frase |
| `site/rotas.js` | hash → rota, rota → hash |
| `site/tela.js` | **o único módulo que toca o DOM** |
| `site/app.js` | liga os cinco |

**`listas.json` existe para que as listas fechadas não sejam duas.** Se `gerar.py` tivesse a lista de motivos e `frases.js` tivesse outra, um motivo novo entraria no catálogo sem frase e a tela mostraria o identificador cru para o usuário. O guarda que impede isso é um teste (Task 10), não a disciplina de quem edita.

---

### Task 0: Ferramental e esqueleto

**Files:**
- Create: `.gitignore`, `pyproject.toml`, `chaves/LEIA.md`
- Create: `ferramentas/__init__.py`, `ferramentas/testes/__init__.py`

**Interfaces:**
- Consumes: nada.
- Produces: `pytest` roda; `minisign` no PATH; `chaves/mods.pub` e `~/.minisign/mods.key` existem.

- [ ] **Step 1: Instalar o binário do minisign**

```bash
brew install minisign
minisign -v
```

Esperado: uma linha de versão. Sem ele, a Task 8 não roda.

- [ ] **Step 2: Criar o ambiente de teste do Python**

```bash
python3 -m venv .venv
.venv/bin/pip install --quiet pytest
.venv/bin/pytest --version
```

Esperado: `pytest 8.x`. **`pytest` é dependência de teste e nada em `ferramentas/` pode importá-lo.**

- [ ] **Step 3: Escrever `pyproject.toml`**

```toml
[project]
name = "seele-mods-indexer"
version = "0.1.0"
requires-python = ">=3.11"
# Sem `dependencies`, e isso é a decisão e não um esqueleto por preencher:
# `gerar.py` roda na máquina de quem tem a chave privada, e cada dependência
# ali é mais uma coisa que um invasor pode alcançar sem tocar na chave.

[tool.pytest.ini_options]
testpaths = ["ferramentas/testes"]

[tool.setuptools]
packages = ["ferramentas"]
```

- [ ] **Step 4: Escrever `.gitignore`**

```
.venv/
__pycache__/
*.pyc
.pytest_cache/
# A chave privada nunca entra no repositório. Esta linha é uma segunda
# tranca: a primeira é ela morar em ~/.minisign/, fora daqui.
*.key
chaves/*.key
```

- [ ] **Step 5: Gerar o par de desenvolvimento**

```bash
mkdir -p chaves ~/.minisign
minisign -G -p chaves/mods.pub -s ~/.minisign/mods-dev.key
cat chaves/mods.pub
```

Esperado: duas linhas — `untrusted comment:` e um base64 de 56 caracteres.

- [ ] **Step 6: Escrever `chaves/LEIA.md`**

```markdown
# As chaves

`mods.pub` é a chave pública de MOD. É comitada porque é pública, e porque o
cliente Rust a traz compilada — a que está aqui é conveniência humana, para
alguém conferir uma assinatura à mão.

**A privada não está aqui e nunca vai estar.** Ela mora em
`~/.minisign/mods-dev.key`, nunca entra na Cloudflare, nunca entra em CI. Um
segredo em CI é um segredo em máquina de terceiro; este não precisa ser
(ADR 0026).

**Esta é uma chave de desenvolvimento.** Antes do primeiro MOD real, gere a de
produção e troque `mods.pub`. A chave de MOD é separada da do atualizador:
uma chave que atesta duas coisas deixa as duas se passarem uma pela outra
(ADR 0044).
```

- [ ] **Step 7: Criar os pacotes e conferir que o pytest coleta**

```bash
mkdir -p ferramentas/testes
touch ferramentas/__init__.py ferramentas/testes/__init__.py
.venv/bin/pytest -q
```

Esperado: `no tests ran`. Não é erro — é o pytest achando o diretório.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "Esqueleto do indexador e chave de desenvolvimento

Sem dependências de produção, e isso é decisão: gerar.py roda na máquina
que tem a chave privada, e cada dependência ali é mais uma coisa que um
invasor alcança sem tocar na chave."
```

---

### Task 1: `hash_conteudo.py` — o núcleo, com vetores verificados

**Files:**
- Create: `ferramentas/hash_conteudo.py`
- Create: `vetores-de-hash.json`
- Test: `ferramentas/testes/test_hash_conteudo.py`

**Interfaces:**
- Consumes: nada.
- Produces: `conteudo(arquivos: list[tuple[str, bytes]]) -> str` — hex minúsculo de 64 caracteres.

**Por que esta é a Task 1.** Se este número divergir do Rust, todo MOD publicado é recusado pelo cliente com a palavra «adulterado» — a mensagem mais alarmante do produto, apontando para o lugar errado. É o único ponto do desenho onde um erro silencioso estraga tudo o mais.

**Os seis vetores abaixo foram conferidos contra `seele_proto::mods::content_hash` compilado, e batem byte a byte.** Não os recalcule; eles são o alvo.

- [ ] **Step 1: Escrever `vetores-de-hash.json`**

```json
{
  "gerado_por": "seele-proto content_hash",
  "vetores": [
    { "nome": "vazio", "arquivos": [], "hash": "af5570f5a1810b7af78caf4bc70a660f0df51e42baf91d4de5b2328de0e83dfc" },
    { "nome": "um-arquivo", "arquivos": [{ "caminho": "mod.json", "bytes_b64": "eyJzY2hlbWEiOjF9" }], "hash": "6fc8b2d4e7cf4558cc34395891a0709c988c7db0f20cf086ffcc8139929de1d5" },
    { "nome": "fronteira-ab-c", "arquivos": [{ "caminho": "ab", "bytes_b64": "Yw==" }], "hash": "da077ff3048c298eed07da526ddf708fbea0a652518a988493b804416dd0008d" },
    { "nome": "fronteira-a-bc", "arquivos": [{ "caminho": "a", "bytes_b64": "YmM=" }], "hash": "fc37d51db89930a9486d09a9251efdcc349eba376f0ef4d7680bdc6f91054592" },
    { "nome": "utf8-no-caminho", "arquivos": [{ "caminho": "ícone/ação.js", "bytes_b64": "eA==" }], "hash": "7ce968afd47f468a9ec91b11092c044263f57ecb172d28b06452acf00a145c7a" },
    { "nome": "ordem-invertida", "arquivos": [{ "caminho": "z.js", "bytes_b64": "Wg==" }, { "caminho": "a.js", "bytes_b64": "QQ==" }], "hash": "d804257b292584f298c68ebf28ae703202ae049d652fb6f78e12ff94ca54f7d3" }
  ]
}
```

- [ ] **Step 2: Escrever o teste que falha**

```python
"""Os vetores são o contrato com o Rust, e o Rust é quem os gera.

Editar um hash aqui para fazer o teste passar é desfazer a única coisa que
impede `hash_conteudo.py` de divergir de `seele_proto::mods::content_hash`
em silêncio. Quem regenera é o teste em `seele-proto` (Task 2)."""

import base64
import json
from pathlib import Path

import pytest

from ferramentas.hash_conteudo import conteudo

RAIZ = Path(__file__).resolve().parents[2]
VETORES = json.loads((RAIZ / "vetores-de-hash.json").read_text(encoding="utf-8"))["vetores"]


@pytest.mark.parametrize("vetor", VETORES, ids=lambda v: v["nome"])
def test_bate_com_o_vetor_do_rust(vetor):
    arquivos = [
        (a["caminho"], base64.b64decode(a["bytes_b64"])) for a in vetor["arquivos"]
    ]
    assert conteudo(arquivos) == vetor["hash"]


def test_a_ordem_de_entrada_nao_importa():
    # O Rust ordena dentro da função justamente para que nenhum chamador
    # precise lembrar de ordenar — `seele-proto/src/mods.rs:398`.
    direta = [("a.js", b"A"), ("z.js", b"Z")]
    invertida = [("z.js", b"Z"), ("a.js", b"A")]
    assert conteudo(direta) == conteudo(invertida)


def test_caminho_com_utf8_conta_bytes_e_nao_caracteres():
    # «ícone/ação.js» tem 13 caracteres e 16 bytes. Uma implementação que
    # usasse len(str) produziria outro número, e esta é a única linha do
    # arquivo que o pega.
    assert len("ícone/ação.js") == 13
    assert len("ícone/ação.js".encode("utf-8")) == 16
    esperado = "7ce968afd47f468a9ec91b11092c044263f57ecb172d28b06452acf00a145c7a"
    assert conteudo([("ícone/ação.js", b"x")]) == esperado
```

- [ ] **Step 3: Rodar e ver falhar**

```bash
.venv/bin/pytest ferramentas/testes/test_hash_conteudo.py -q
```

Esperado: `ModuleNotFoundError: No module named 'ferramentas.hash_conteudo'`.

- [ ] **Step 4: Escrever a implementação mínima**

```python
"""A identidade dos bytes de um MOD.

Cópia deliberada de `seele_proto::mods::content_hash`
(`crates/seele-proto/src/mods.rs:194`), que é a única fonte. Uma segunda
implementação de uma definição que só deveria existir uma vez é uma dívida
conhecida; `vetores-de-hash.json` é o que impede que as duas divirjam sem
ninguém perceber.

As três propriedades, com o motivo que o Rust escreve ao lado de cada uma:

- **caminhos ordenados**, porque ordem de diretório não é promessa que
  sistema de arquivos nenhum faz;
- **todo comprimento antes dos seus bytes**, para que ("ab", "c") e
  ("a", "bc") não colidam;
- **comprimentos em 8 bytes big-endian fixos**, para que um comprimento
  nunca seja ele próprio ambíguo.
"""

import hashlib

Arquivo = tuple[str, bytes]


def conteudo(arquivos: list[Arquivo]) -> str:
    """O `content_hash` do conjunto, em hexadecimal minúsculo.

    Minúsculo porque é o número que uma pessoa compara a olho com o que o
    indexador publica, e duas grafias fariam a comparação falhar por nada
    (`seele-core/src/mods.rs:180`).
    """
    # Ordena pelos BYTES do caminho e não pelo str: `String::cmp` no Rust
    # compara UTF-8, e `sorted` sem chave compararia pontos de código. As
    # duas ordens divergem a partir de U+0080.
    ordenados = sorted(arquivos, key=lambda par: par[0].encode("utf-8"))

    digestor = hashlib.sha256()
    digestor.update(len(ordenados).to_bytes(8, "big"))
    for caminho, dados in ordenados:
        cru = caminho.encode("utf-8")
        digestor.update(len(cru).to_bytes(8, "big"))
        digestor.update(cru)
        digestor.update(len(dados).to_bytes(8, "big"))
        digestor.update(dados)
    return digestor.hexdigest()
```

- [ ] **Step 5: Rodar e ver passar**

```bash
.venv/bin/pytest ferramentas/testes/test_hash_conteudo.py -q
```

Esperado: `8 passed`.

- [ ] **Step 6: Commit**

```bash
git add ferramentas/hash_conteudo.py ferramentas/testes/test_hash_conteudo.py vetores-de-hash.json
git commit -m "content_hash em Python, amarrado por vetores do Rust

Os seis vetores foram conferidos contra seele_proto::mods::content_hash
compilado. Editar um hash para fazer o teste passar desfaz a única coisa
que impede as duas implementações de divergirem em silêncio."
```

---

### Task 2: O gerador de vetores no Rust *(repositório SEELE)*

**Files:**
- Create: `/Users/dev-alexandre/SEELE/crates/seele-proto/tests/vetores_de_hash.rs`
- Create: `/Users/dev-alexandre/SEELE/vetores-de-hash.json` (gerado pelo teste)

**Interfaces:**
- Consumes: `seele_proto::mods::content_hash`.
- Produces: `vetores-de-hash.json` idêntico ao da Task 1, nos dois repositórios.

**Esta tarefa é um PR ao repositório SEELE, não a este.** Ela fecha a amarração: sem ela os vetores são uma foto que envelhece, e alguém pode mudar `content_hash` no Rust sem nada reprovar.

- [ ] **Step 1: Escrever o teste que gera e confere**

```rust
//! Os vetores que o indexador de MODs usa para provar que a
//! reimplementação em Python de `content_hash` não divergiu desta.
//!
//! O teste **escreve** o arquivo e reprova se o comitado divergir. É essa
//! ordem que impede alguém de editar um hash até o teste passar: quem os
//! produz é esta função, e mexer neles sem mexer nela reprova aqui.
//!
//! O arquivo é comitado nos dois repositórios, e nenhum precisa do outro
//! para rodar os próprios testes.

use seele_proto::mods::content_hash;
use std::path::PathBuf;

fn hex(digest: &[u8; 32]) -> String {
    digest.iter().map(|byte| format!("{byte:02x}")).collect()
}

fn arquivo(caminho: &str, bytes: &[u8]) -> (String, Vec<u8>) {
    (caminho.to_owned(), bytes.to_vec())
}

/// Os casos, e por que cada um está aqui.
fn casos() -> Vec<(&'static str, Vec<(String, Vec<u8>)>)> {
    vec![
        // O conjunto vazio: só a contagem entra no digestor.
        ("vazio", vec![]),
        ("um-arquivo", vec![arquivo("mod.json", br#"{"schema":1}"#)]),
        // O par que prova que os prefixos de comprimento funcionam: sem
        // eles, estes dois teriam o mesmo hash.
        ("fronteira-ab-c", vec![arquivo("ab", b"c")]),
        ("fronteira-a-bc", vec![arquivo("a", b"bc")]),
        // O caso que o Rust acerta de graça e o Python erra fácil:
        // `path.len()` aqui é bytes, e `len(str)` lá é caracteres.
        ("utf8-no-caminho", vec![arquivo("ícone/ação.js", b"x")]),
        // A ordem de entrada não pode importar: a função ordena.
        (
            "ordem-invertida",
            vec![arquivo("z.js", b"Z"), arquivo("a.js", b"A")],
        ),
    ]
}

fn montar_json() -> String {
    use std::fmt::Write as _;
    let mut texto = String::from("{\n  \"gerado_por\": \"seele-proto content_hash\",\n  \"vetores\": [\n");
    let todos = casos();
    for (indice, (nome, arquivos)) in todos.iter().enumerate() {
        let mut copia = arquivos.clone();
        let digest = hex(&content_hash(&mut copia));
        let listados: Vec<String> = arquivos
            .iter()
            .map(|(caminho, bytes)| {
                format!("{{ \"caminho\": {caminho:?}, \"bytes_b64\": \"{}\" }}", base64(bytes))
            })
            .collect();
        let virgula = if indice + 1 == todos.len() { "" } else { "," };
        let _ = write!(
            texto,
            "    {{ \"nome\": {nome:?}, \"arquivos\": [{}], \"hash\": \"{digest}\" }}{virgula}\n",
            listados.join(", ")
        );
    }
    texto.push_str("  ]\n}\n");
    texto
}

/// Base64 padrão, escrito à mão porque `seele-proto` não depende de nada
/// (`specs/01-arquitetura.md`) e não vai passar a depender por um teste.
fn base64(bytes: &[u8]) -> String {
    const TABELA: &[u8; 64] =
        b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut saida = String::new();
    for bloco in bytes.chunks(3) {
        let b = [bloco[0], *bloco.get(1).unwrap_or(&0), *bloco.get(2).unwrap_or(&0)];
        let junto = (u32::from(b[0]) << 16) | (u32::from(b[1]) << 8) | u32::from(b[2]);
        for deslocamento in [18, 12, 6, 0] {
            saida.push(TABELA[((junto >> deslocamento) & 0x3F) as usize] as char);
        }
        let sobra = 3 - bloco.len();
        saida.truncate(saida.len() - sobra);
        saida.push_str(&"=".repeat(sobra));
    }
    saida
}

fn caminho_do_arquivo() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("../..")
        .join("vetores-de-hash.json")
}

#[test]
fn os_vetores_comitados_batem_com_esta_implementacao() {
    let esperado = montar_json();
    let caminho = caminho_do_arquivo();

    let comitado = std::fs::read_to_string(&caminho).unwrap_or_default();
    if comitado != esperado {
        std::fs::write(&caminho, &esperado).expect("escrever os vetores");
        panic!(
            "vetores-de-hash.json estava desatualizado e foi reescrito em {}.\n\
             Comite o novo arquivo AQUI e no SEELE-MODS-INDEXER, e rode os \
             testes do indexador: se `hash_conteudo.py` divergir, ele reprova.",
            caminho.display()
        );
    }
}
```

- [ ] **Step 2: Rodar e ver falhar, gerando o arquivo**

```bash
cd /Users/dev-alexandre/SEELE
cargo test -p seele-proto --test vetores_de_hash
```

Esperado: FALHA com «estava desatualizado e foi reescrito» — o arquivo não existia.

- [ ] **Step 3: Rodar de novo e ver passar**

```bash
cargo test -p seele-proto --test vetores_de_hash
```

Esperado: `test os_vetores_comitados_batem_com_esta_implementacao ... ok`.

- [ ] **Step 4: Conferir que o arquivo gerado é igual ao da Task 1**

```bash
diff <(python3 -c "import json,sys;print(json.dumps(json.load(open('/Users/dev-alexandre/SEELE/vetores-de-hash.json'))['vetores'],sort_keys=True))") \
     <(python3 -c "import json,sys;print(json.dumps(json.load(open('/Users/dev-alexandre/SEELE-MODS-INDEXER/vetores-de-hash.json'))['vetores'],sort_keys=True))") \
  && echo "IDÊNTICOS"
```

Esperado: `IDÊNTICOS`. **Se divergir, o da Task 1 está errado — o Rust é a fonte.** Copie o do SEELE por cima e rode os testes do indexador.

- [ ] **Step 5: Commit no repositório SEELE**

```bash
cd /Users/dev-alexandre/SEELE
git add crates/seele-proto/tests/vetores_de_hash.rs vetores-de-hash.json
git commit -m "Vetores de content_hash para o indexador de MODs

O indexador reimplementa content_hash em Python para montar o catálogo.
Este teste gera os vetores e reprova se os comitados divergirem, para que
as duas implementações não se separem em silêncio."
```

---

### Task 3: `manifesto.py` — as cinco recusas, espelhadas

**Files:**
- Create: `ferramentas/manifesto.py`
- Test: `ferramentas/testes/test_manifesto.py`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `class Recusado(Exception)` com atributo `codigo: str`
  - `ler(texto: str) -> Manifesto`
  - `@dataclass Manifesto` com `schema: int`, `id: str`, `version: str`, `api: int`, `repo: str`, `reach: list[str]`, `client: str | None`, `server: str | None`
  - `ESQUEMA_DO_MANIFESTO = 1`, `VERSAO_DA_API = 1`

**Por que espelhar.** Se o gerador aceitar um `mod.json` que o cliente recusa, o MOD entra no catálogo e falha na máquina de quem instalou — o pior lugar para descobrir. As cinco recusas e seus nomes são de `seele-proto/src/mods.rs:131` e `seele-core/src/mods.rs:164`.

- [ ] **Step 1: Escrever o teste que falha**

```python
"""As cinco recusas de `read_manifest`, espelhadas.

Os nomes dos códigos são os de `seele_core::mods::refusal_name` e não podem
divergir: eles atravessam para o `frases.js`, e um código sem frase mostra o
identificador cru para quem lê."""

import pytest

from ferramentas.manifesto import Recusado, ler

VALIDO = """
{
  "schema": 1, "id": "juli/cinza-frio", "version": "2.1.0", "api": 1,
  "repo": "https://github.com/juli/seele-cinza-frio",
  "reach": ["trocar as cores da interface"],
  "client": "cliente/main.js"
}
"""


def test_um_manifesto_valido_e_lido():
    m = ler(VALIDO)
    assert m.id == "juli/cinza-frio"
    assert m.api == 1
    assert m.reach == ["trocar as cores da interface"]
    assert m.client == "cliente/main.js"
    assert m.server is None


def test_json_quebrado_e_malformed():
    with pytest.raises(Recusado) as erro:
        ler("{ nao é json")
    assert erro.value.codigo == "malformed"


def test_chave_desconhecida_e_malformed():
    # `deny_unknown_fields` é a decisão e não o padrão: uma chave com erro de
    # digitação instala um MOD sem a coisa que o autor achou que estava lá, e
    # o autor nunca descobre.
    with pytest.raises(Recusado) as erro:
        ler('{"schema":1,"id":"a/b","version":"1","api":1,"repo":"r","cliente":"x"}')
    assert erro.value.codigo == "malformed"


def test_esquema_do_futuro_e_schema_too_new():
    with pytest.raises(Recusado) as erro:
        ler('{"schema":2,"id":"a/b","version":"1","api":1,"repo":"r","client":"c.js"}')
    assert erro.value.codigo == "schema-too-new"


def test_api_do_futuro_e_api_too_new():
    with pytest.raises(Recusado) as erro:
        ler('{"schema":1,"id":"a/b","version":"1","api":2,"repo":"r","client":"c.js"}')
    assert erro.value.codigo == "api-too-new"


@pytest.mark.parametrize(
    "identificador",
    ["semdivisao", "a/b/c", "/b", "a/", "Maiuscula/b", "a/com_underline", "a/com espaço"],
)
def test_id_torto_e_malformed_id(identificador):
    texto = '{"schema":1,"id":"%s","version":"1","api":1,"repo":"r","client":"c.js"}' % identificador
    with pytest.raises(Recusado) as erro:
        ler(texto)
    assert erro.value.codigo == "malformed-id"


@pytest.mark.parametrize("identificador", ["a/b", "seele/rpg", "kae-2/glifos-osso", "a1/b2"])
def test_id_bem_formado_passa(identificador):
    texto = '{"schema":1,"id":"%s","version":"1","api":1,"repo":"r","client":"c.js"}' % identificador
    assert ler(texto).id == identificador


def test_sem_nenhuma_metade_e_empty():
    with pytest.raises(Recusado) as erro:
        ler('{"schema":1,"id":"a/b","version":"1","api":1,"repo":"r"}')
    assert erro.value.codigo == "empty"


def test_so_a_metade_do_servidor_basta():
    m = ler('{"schema":1,"id":"a/b","version":"1","api":1,"repo":"r","server":"s.js"}')
    assert m.client is None
    assert m.server == "s.js"
```

- [ ] **Step 2: Rodar e ver falhar**

```bash
.venv/bin/pytest ferramentas/testes/test_manifesto.py -q
```

Esperado: `ModuleNotFoundError: No module named 'ferramentas.manifesto'`.

- [ ] **Step 3: Escrever a implementação**

```python
"""O que um MOD declara sobre si, e o que o produto recusa.

Espelho de `seele_proto::mods::read_manifest`
(`crates/seele-proto/src/mods.rs:131`). Se o gerador aceitasse um manifesto
que o cliente recusa, o MOD entraria no catálogo e falharia na máquina de
quem instalou — o pior lugar possível para descobrir.

Os códigos de recusa são os de `seele_core::mods::refusal_name` e não podem
divergir: eles atravessam para o `frases.js`, e um código sem frase mostra
o identificador cru para quem lê."""

import json
from dataclasses import dataclass, field

ESQUEMA_DO_MANIFESTO = 1
VERSAO_DA_API = 1

# Toda chave que o esquema 1 conhece. Uma chave fora daqui é recusada em vez
# de ignorada, pelo motivo que o Rust escreve em `deny_unknown_fields`: uma
# chave com erro de digitação instala um MOD sem a coisa que o autor achou
# que estava lá, e o autor nunca descobre.
CHAVES = {"schema", "id", "version", "api", "repo", "reach", "state", "client", "server"}
OBRIGATORIAS = {"schema", "id", "version", "api", "repo"}


class Recusado(Exception):
    """Uma recusa nomeada. `codigo` vem de uma lista fechada."""

    def __init__(self, codigo: str, detalhe: str = ""):
        super().__init__(f"{codigo}: {detalhe}" if detalhe else codigo)
        self.codigo = codigo
        self.detalhe = detalhe


@dataclass(frozen=True)
class Manifesto:
    schema: int
    id: str
    version: str
    api: int
    repo: str
    reach: list[str] = field(default_factory=list)
    state: int | None = None
    client: str | None = None
    server: str | None = None


def _bem_formado(identificador: str) -> bool:
    """`autor/nome`, as duas metades não vazias, nada que suba um diretório.

    Espelho de `is_well_formed_id` (`mods.rs:161`): minúscula ASCII, dígito
    ou hífen. Nada mais — e é o que impede um id de virar caminho."""
    metades = identificador.split("/")
    if len(metades) != 2:
        return False
    return all(
        metade and all(c.islower() and c.isascii() or c.isdigit() or c == "-" for c in metade)
        for metade in metades
    )


def ler(texto: str) -> Manifesto:
    """Lê um `mod.json`, ou levanta `Recusado`."""
    try:
        cru = json.loads(texto)
    except json.JSONDecodeError as erro:
        raise Recusado("malformed", f"linha {erro.lineno}, coluna {erro.colno}") from erro

    if not isinstance(cru, dict):
        raise Recusado("malformed", "a raiz não é um objeto")

    desconhecidas = set(cru) - CHAVES
    if desconhecidas:
        raise Recusado("malformed", "chave desconhecida: " + ", ".join(sorted(desconhecidas)))
    faltando = OBRIGATORIAS - set(cru)
    if faltando:
        raise Recusado("malformed", "falta: " + ", ".join(sorted(faltando)))

    if cru["schema"] > ESQUEMA_DO_MANIFESTO:
        raise Recusado("schema-too-new", f'esquema {cru["schema"]}, esta versão lê {ESQUEMA_DO_MANIFESTO}')
    if cru["api"] > VERSAO_DA_API:
        raise Recusado("api-too-new", f'pede API {cru["api"]}, esta versão oferece {VERSAO_DA_API}')
    if not _bem_formado(cru["id"]):
        raise Recusado("malformed-id", cru["id"])
    if cru.get("client") is None and cru.get("server") is None:
        raise Recusado("empty", "não declara metade de cliente nem de servidor")

    return Manifesto(
        schema=cru["schema"],
        id=cru["id"],
        version=cru["version"],
        api=cru["api"],
        repo=cru["repo"],
        reach=cru.get("reach", []),
        state=cru.get("state"),
        client=cru.get("client"),
        server=cru.get("server"),
    )
```

- [ ] **Step 4: Rodar e ver passar**

```bash
.venv/bin/pytest ferramentas/testes/test_manifesto.py -q
```

Esperado: `18 passed`.

- [ ] **Step 5: Commit**

```bash
git add ferramentas/manifesto.py ferramentas/testes/test_manifesto.py
git commit -m "Validação de mod.json espelhando as cinco recusas do Rust

Um manifesto que o gerador aceita e o cliente recusa vira um MOD que falha
na máquina de quem instalou — o pior lugar para descobrir."
```

---

### Task 4: `avaliacoes.py` — o veredito e o commit

**Files:**
- Create: `ferramentas/avaliacoes.py`
- Test: `ferramentas/testes/test_avaliacoes.py`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `@dataclass Versao` com `versao: str`, `commit: str`, `nivel: str`, `notas: list[str]`, `avaliado_em: int`
  - `@dataclass Avaliacao` com `id: str`, `autor: str`, `nome: str`, `repo: str`, `titulo: str`, `resumo: str`, `versoes: list[Versao]`
  - `ler(caminho: Path) -> Avaliacao`
  - `ler_todas(raiz: Path) -> list[Avaliacao]`
  - `NIVEIS = ("oficial", "verificado", "com-notas")`

**Por que o `.toml` guarda o veredito e não o código.** *«Duas cópias divergem, e a que serve é a que sai do commit fixado»* — `indexador-de-mods.md`. O `SEELE-MODS-INDEXER` nunca vira espelho do código de terceiros.

- [ ] **Step 1: Escrever o teste que falha**

```python
import pytest

from ferramentas.avaliacoes import NIVEIS, ler, ler_todas
from ferramentas.manifesto import Recusado

COMMIT = "4f9a1c0e8b7d6a5f4e3d2c1b0a9f8e7d6c5b4a39"

BOM = f"""
id = "juli/cinza-frio"
repo = "https://github.com/juli/seele-cinza-frio"
titulo = "Cinza Frio"
resumo = "Um tema de contraste alto, sem mexer no layout."

[[versoes]]
versao = "2.1.0"
commit = "{COMMIT}"
nivel = "verificado"
notas = []
avaliado_em = 1757000000
"""


def escrever(tmp_path, texto, nome="juli/cinza-frio.toml"):
    caminho = tmp_path / nome
    caminho.parent.mkdir(parents=True, exist_ok=True)
    caminho.write_text(texto, encoding="utf-8")
    return caminho


def test_le_uma_avaliacao_boa(tmp_path):
    a = ler(escrever(tmp_path, BOM))
    assert a.id == "juli/cinza-frio"
    assert a.autor == "juli"
    assert a.nome == "cinza-frio"
    assert len(a.versoes) == 1
    assert a.versoes[0].commit == COMMIT
    assert a.versoes[0].nivel == "verificado"


def test_commit_abreviado_e_recusado(tmp_path):
    # Prefixo curto de git colide, e um prefixo escolhido por um adversário
    # colide de propósito.
    with pytest.raises(Recusado) as erro:
        ler(escrever(tmp_path, BOM.replace(COMMIT, COMMIT[:12])))
    assert erro.value.codigo == "commit-torto"


def test_commit_com_letra_fora_do_hex_e_recusado(tmp_path):
    with pytest.raises(Recusado) as erro:
        ler(escrever(tmp_path, BOM.replace(COMMIT, "z" * 40)))
    assert erro.value.codigo == "commit-torto"


def test_nivel_fora_da_lista_e_recusado(tmp_path):
    # `negado` não é um nível do catálogo: um MOD negado não entra.
    with pytest.raises(Recusado) as erro:
        ler(escrever(tmp_path, BOM.replace('"verificado"', '"negado"')))
    assert erro.value.codigo == "nivel-desconhecido"


def test_o_nome_do_arquivo_tem_de_bater_com_o_id(tmp_path):
    # Se divergirem, dois arquivos podem reivindicar o mesmo id e o último a
    # ser lido ganha em silêncio.
    with pytest.raises(Recusado) as erro:
        ler(escrever(tmp_path, BOM, nome="outro/nome.toml"))
    assert erro.value.codigo == "id-nao-bate-com-o-caminho"


def test_versao_repetida_e_recusada(tmp_path):
    dobrado = BOM + f"""
[[versoes]]
versao = "2.1.0"
commit = "{'a' * 40}"
nivel = "verificado"
notas = []
avaliado_em = 1757000001
"""
    with pytest.raises(Recusado) as erro:
        ler(escrever(tmp_path, dobrado))
    assert erro.value.codigo == "versao-repetida"


def test_com_notas_sem_nota_e_recusado(tmp_path):
    # O terceiro nível existe para a pessoa ler o que o MOD faz de incomum.
    # Sem nota nenhuma ele não diz nada, e o selo vira decoração.
    torto = BOM.replace('nivel = "verificado"', 'nivel = "com-notas"')
    with pytest.raises(Recusado) as erro:
        ler(escrever(tmp_path, torto))
    assert erro.value.codigo == "com-notas-sem-nota"


def test_todos_os_niveis_da_lista_sao_aceitos(tmp_path):
    for nivel in NIVEIS:
        texto = BOM.replace('nivel = "verificado"', f'nivel = "{nivel}"')
        if nivel == "com-notas":
            texto = texto.replace("notas = []", 'notas = ["fala-com-terceiro"]')
        assert ler(escrever(tmp_path, texto)).versoes[0].nivel == nivel


def test_ler_todas_acha_em_subdiretorios(tmp_path):
    escrever(tmp_path, BOM, "juli/cinza-frio.toml")
    outro = BOM.replace("juli/cinza-frio", "kae/glifos-osso").replace("Cinza Frio", "Glifos Osso")
    escrever(tmp_path, outro, "kae/glifos-osso.toml")
    achadas = ler_todas(tmp_path)
    assert sorted(a.id for a in achadas) == ["juli/cinza-frio", "kae/glifos-osso"]
```

- [ ] **Step 2: Rodar e ver falhar**

```bash
.venv/bin/pytest ferramentas/testes/test_avaliacoes.py -q
```

Esperado: `ModuleNotFoundError: No module named 'ferramentas.avaliacoes'`.

- [ ] **Step 3: Escrever a implementação**

```python
"""O veredito de uma avaliação, e o commit que ela avaliou.

Isto é tudo o que o repositório guarda sobre um MOD de terceiro. **Não há
cópia do código**: `indexador-de-mods.md` é literal — «duas cópias divergem,
e a que serve é a que sai do commit fixado». Quem busca os bytes é o
`fonte.py`, no commit que este arquivo fixa."""

import re
import tomllib
from dataclasses import dataclass, field
from pathlib import Path

from ferramentas.manifesto import Recusado

# `negado` não está aqui de propósito: um MOD negado não entra no catálogo, e
# o catálogo diz o que existe, não o que foi rejeitado (ADR 0044, adendo).
NIVEIS = ("oficial", "verificado", "com-notas")

# SHA-1 completo. Prefixo curto de git colide, e um prefixo escolhido por um
# adversário colide de propósito.
COMMIT = re.compile(r"^[0-9a-f]{40}$")


@dataclass(frozen=True)
class Versao:
    versao: str
    commit: str
    nivel: str
    notas: list[str] = field(default_factory=list)
    avaliado_em: int = 0


@dataclass(frozen=True)
class Avaliacao:
    id: str
    autor: str
    nome: str
    repo: str
    titulo: str
    resumo: str
    versoes: list[Versao] = field(default_factory=list)


def ler(caminho: Path) -> Avaliacao:
    """Lê um `avaliacoes/<autor>/<nome>.toml`, ou levanta `Recusado`."""
    try:
        cru = tomllib.loads(caminho.read_text(encoding="utf-8"))
    except tomllib.TOMLDecodeError as erro:
        raise Recusado("toml-malformado", f"{caminho}: {erro}") from erro

    identificador = cru.get("id", "")
    # O caminho e o id têm de dizer a mesma coisa: se divergirem, dois
    # arquivos podem reivindicar o mesmo id e o último lido ganha em silêncio.
    do_caminho = f"{caminho.parent.name}/{caminho.stem}"
    if identificador != do_caminho:
        raise Recusado("id-nao-bate-com-o-caminho", f"{identificador} em {do_caminho}.toml")

    autor, _, nome = identificador.partition("/")

    versoes: list[Versao] = []
    vistas: set[str] = set()
    for bruta in cru.get("versoes", []):
        numero = bruta.get("versao", "")
        if numero in vistas:
            raise Recusado("versao-repetida", f"{identificador} {numero}")
        vistas.add(numero)

        commit = bruta.get("commit", "")
        if not COMMIT.match(commit):
            raise Recusado("commit-torto", f"{identificador} {numero}: {commit!r}")

        nivel = bruta.get("nivel", "")
        if nivel not in NIVEIS:
            raise Recusado("nivel-desconhecido", f"{identificador} {numero}: {nivel!r}")

        notas = bruta.get("notas", [])
        if nivel == "com-notas" and not notas:
            raise Recusado("com-notas-sem-nota", f"{identificador} {numero}")

        versoes.append(
            Versao(
                versao=numero,
                commit=commit,
                nivel=nivel,
                notas=notas,
                avaliado_em=bruta.get("avaliado_em", 0),
            )
        )

    return Avaliacao(
        id=identificador,
        autor=autor,
        nome=nome,
        repo=cru.get("repo", ""),
        titulo=cru.get("titulo", ""),
        resumo=cru.get("resumo", ""),
        versoes=versoes,
    )


def ler_todas(raiz: Path) -> list[Avaliacao]:
    """Toda avaliação sob `raiz`, em ordem de id."""
    return sorted((ler(c) for c in raiz.rglob("*.toml")), key=lambda a: a.id)
```

- [ ] **Step 4: Rodar e ver passar**

```bash
.venv/bin/pytest ferramentas/testes/test_avaliacoes.py -q
```

Esperado: `9 passed`.

- [ ] **Step 5: Commit**

```bash
git add ferramentas/avaliacoes.py ferramentas/testes/test_avaliacoes.py
git commit -m "Leitura das avaliações: o veredito e o commit, não o código

O repositório guarda o que foi decidido e sobre qual commit. Os bytes saem
do commit fixado no repositório do autor — duas cópias divergem."
```

---

### Task 5: `fonte.py` — buscar o commit fixado

**Files:**
- Create: `ferramentas/fonte.py`
- Test: `ferramentas/testes/test_fonte.py`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `materializar(repo: str, commit: str, cache: Path) -> list[tuple[str, bytes]]`
  - `RECUSADOS: frozenset[str]` — nomes que nunca entram
  - levanta `Recusado` com códigos `commit-ausente`, `arquivo-estranho`, `git-falhou`

**A armadilha que esta tarefa existe para fechar.** `seele-core/src/mods.rs:130` varre **todo** arquivo do diretório do MOD, sem filtro. Um `.DS_Store` no repositório do autor entra no hash que o servidor calcula em disco, mas não estaria em `arquivos`. O cliente baixa a lista, calcula outro número, e recusa dizendo que o hash não bate — que é a nossa palavra para «adulterado». **Recusar é a única saída correta**: ignorar produz esse defeito, e incluir publica lixo da máquina de alguém num caminho imutável para sempre.

- [ ] **Step 1: Escrever o teste que falha**

```python
"""Os testes criam repositórios git de verdade, localmente.

Nenhum toca a rede: um teste que depende de github.com falha por motivo
errado num avião, e passa a ser ignorado."""

import subprocess

import pytest

from ferramentas.fonte import materializar
from ferramentas.manifesto import Recusado


def git(diretorio, *args):
    return subprocess.run(
        ["git", *args], cwd=diretorio, check=True, capture_output=True, text=True
    ).stdout.strip()


@pytest.fixture
def repo(tmp_path):
    """Um repositório com um commit e dois arquivos."""
    origem = tmp_path / "origem"
    (origem / "cliente").mkdir(parents=True)
    (origem / "mod.json").write_text('{"schema":1}', encoding="utf-8")
    (origem / "cliente" / "main.js").write_text("// oi\n", encoding="utf-8")
    git(origem, "init", "-q", "-b", "principal")
    git(origem, "config", "user.email", "teste@exemplo")
    git(origem, "config", "user.name", "Teste")
    git(origem, "add", "-A")
    git(origem, "commit", "-q", "-m", "primeiro")
    return origem, git(origem, "rev-parse", "HEAD")


def test_traz_os_arquivos_do_commit(repo, tmp_path):
    origem, commit = repo
    arquivos = materializar(str(origem), commit, tmp_path / "cache")
    assert sorted(caminho for caminho, _ in arquivos) == ["cliente/main.js", "mod.json"]
    assert dict(arquivos)["mod.json"] == b'{"schema":1}'


def test_o_caminho_usa_barra_e_nao_contrabarra(repo, tmp_path):
    # O hash trabalha sobre o caminho como texto; uma contrabarra no Windows
    # produziria outro número para os mesmos bytes.
    origem, commit = repo
    arquivos = materializar(str(origem), commit, tmp_path / "cache")
    assert all("\\" not in caminho for caminho, _ in arquivos)


def test_commit_que_nao_existe_e_recusado(repo, tmp_path):
    origem, _ = repo
    with pytest.raises(Recusado) as erro:
        materializar(str(origem), "b" * 40, tmp_path / "cache")
    assert erro.value.codigo == "commit-ausente"


def test_arquivo_estranho_e_recusado_e_nomeado(repo, tmp_path):
    origem, _ = repo
    (origem / ".DS_Store").write_bytes(b"\x00lixo")
    git(origem, "add", "-A")
    git(origem, "commit", "-q", "-m", "com lixo")
    commit = git(origem, "rev-parse", "HEAD")

    with pytest.raises(Recusado) as erro:
        materializar(str(origem), commit, tmp_path / "cache")
    assert erro.value.codigo == "arquivo-estranho"
    # Nomear o arquivo é o que transforma a recusa em conserto.
    assert ".DS_Store" in erro.value.detalhe


def test_o_diretorio_git_nunca_entra(repo, tmp_path):
    origem, commit = repo
    arquivos = materializar(str(origem), commit, tmp_path / "cache")
    assert not any(caminho.startswith(".git") for caminho, _ in arquivos)


def test_buscar_duas_vezes_da_o_mesmo(repo, tmp_path):
    origem, commit = repo
    cache = tmp_path / "cache"
    assert materializar(str(origem), commit, cache) == materializar(str(origem), commit, cache)
```

- [ ] **Step 2: Rodar e ver falhar**

```bash
.venv/bin/pytest ferramentas/testes/test_fonte.py -q
```

Esperado: `ModuleNotFoundError: No module named 'ferramentas.fonte'`.

- [ ] **Step 3: Escrever a implementação**

```python
"""Os bytes de uma versão, tirados do commit que a avaliação fixou.

É a única dependência de rede do desenho, e ela é de build e não de runtime:
roda na máquina de quem publica, nunca na de quem usa. Um repositório que
sumiu significa que aquela versão não pode ser republicada — ela continua
servida se já estiver em `publicado/`, porque lá os caminhos são imutáveis."""

import subprocess
from pathlib import Path

from ferramentas.manifesto import Recusado

# Nomes que nunca são parte de um MOD, e que entrariam no hash calculado em
# disco pelo servidor sem entrarem na lista `arquivos` do catálogo. O
# resultado seria o cliente recusando o MOD com «o hash não bate», que é a
# nossa palavra para «adulterado» — apontando para o lugar errado.
RECUSADOS = frozenset(
    {".DS_Store", "Thumbs.db", "desktop.ini", ".gitattributes", ".gitignore", ".gitmodules"}
)
SUFIXOS_RECUSADOS = (".swp", ".swo", ".orig", ".rej", ".pyc")
PASTAS_RECUSADAS = frozenset({".git", "__pycache__", "node_modules", ".idea", ".vscode"})


def _git(diretorio: Path, *args: str) -> str:
    try:
        pronto = subprocess.run(
            ["git", *args], cwd=diretorio, check=True, capture_output=True, text=True
        )
    except subprocess.CalledProcessError as erro:
        raise Recusado("git-falhou", f"{' '.join(args)}: {erro.stderr.strip()}") from erro
    return pronto.stdout


def _espelho(repo: str, cache: Path) -> Path:
    """Um clone nu, reaproveitado entre execuções.

    Nu porque nada aqui precisa de árvore de trabalho: os bytes saem do
    `git archive` de um commit, e não do que estiver no disco."""
    destino = cache / (repo.rstrip("/").replace("/", "_").replace(":", "_") + ".git")
    if destino.exists():
        _git(destino, "fetch", "--quiet", "--all")
    else:
        destino.parent.mkdir(parents=True, exist_ok=True)
        _git(cache, "clone", "--quiet", "--mirror", repo, str(destino))
    return destino


def _estranho(caminho: str) -> bool:
    partes = caminho.split("/")
    if any(parte in PASTAS_RECUSADAS for parte in partes[:-1]):
        return True
    nome = partes[-1]
    return nome in RECUSADOS or nome.endswith(SUFIXOS_RECUSADOS)


def materializar(repo: str, commit: str, cache: Path) -> list[tuple[str, bytes]]:
    """Os pares `(caminho, bytes)` do commit, prontos para o `content_hash`.

    Levanta `Recusado` se o commit não existe ou se há arquivo estranho."""
    cache.mkdir(parents=True, exist_ok=True)
    espelho = _espelho(repo, cache)

    # `cat-file -e` responde «existe e é um commit» sem baixar a árvore.
    try:
        _git(espelho, "cat-file", "-e", f"{commit}^{{commit}}")
    except Recusado as erro:
        raise Recusado("commit-ausente", f"{repo}@{commit}") from erro

    listagem = _git(espelho, "ls-tree", "-r", "-z", "--name-only", commit)
    caminhos = [c for c in listagem.split("\0") if c]

    estranhos = sorted(c for c in caminhos if _estranho(c))
    if estranhos:
        # Nomear é o que transforma a recusa em conserto: quem publica precisa
        # saber qual arquivo tirar, não que «algo» estava errado.
        raise Recusado("arquivo-estranho", f"{repo}@{commit}: " + ", ".join(estranhos))

    arquivos: list[tuple[str, bytes]] = []
    for caminho in caminhos:
        bruto = subprocess.run(
            ["git", "show", f"{commit}:{caminho}"],
            cwd=espelho,
            check=True,
            capture_output=True,
        ).stdout
        # `git` já entrega o caminho com barra; a troca é para o dia em que
        # não entregar, porque o hash trabalha sobre o caminho como texto.
        arquivos.append((caminho.replace("\\", "/"), bruto))
    return arquivos
```

- [ ] **Step 4: Rodar e ver passar**

```bash
.venv/bin/pytest ferramentas/testes/test_fonte.py -q
```

Esperado: `6 passed`.

- [ ] **Step 5: Commit**

```bash
git add ferramentas/fonte.py ferramentas/testes/test_fonte.py
git commit -m "Buscar os bytes do commit fixado, e recusar arquivo estranho

Um .DS_Store no repo do autor entra no hash que o servidor calcula em disco
e não na lista arquivos do catálogo. O cliente então recusa dizendo que o
hash não bate — apontando para adulteração onde houve descuido."
```

---

### Task 6: `catalogo.py` — montar, e cobrar *append-only*

**Files:**
- Create: `ferramentas/catalogo.py`
- Test: `ferramentas/testes/test_catalogo.py`

**Interfaces:**
- Consumes: `avaliacoes.Avaliacao`, `avaliacoes.Versao`, `manifesto.Manifesto`, `manifesto.Recusado`.
- Produces:
  - `@dataclass VersaoPronta` com `versao: str`, `api: int`, `publicado_em: int`, `hash: str`, `alcanca: list[str]`, `arquivos: list[str]`, `nivel: str`, `notas: list[str]`
  - `montar(avaliacoes: list[Avaliacao], prontas: dict[tuple[str, str], VersaoPronta], gerado_em: int) -> dict`
  - `conferir_append_only(novo: dict, anterior: dict | None) -> None`
  - `ESQUEMA = 1`

**A regra *append-only*.** Uma versão publicada nunca muda de hash. Se mudasse, «o MOD que você baixou é o MOD que revisamos» deixaria de valer sem que nada avisasse — e o cache eterno de `/mods/*` faria metade do mundo continuar com os bytes velhos.

- [ ] **Step 1: Escrever o teste que falha**

```python
import pytest

from ferramentas.avaliacoes import Avaliacao, Versao
from ferramentas.catalogo import ESQUEMA, VersaoPronta, conferir_append_only, montar
from ferramentas.manifesto import Recusado

COMMIT = "4f9a1c0e8b7d6a5f4e3d2c1b0a9f8e7d6c5b4a39"


def avaliacao(nivel="verificado", notas=()):
    return Avaliacao(
        id="juli/cinza-frio", autor="juli", nome="cinza-frio",
        repo="https://github.com/juli/seele-cinza-frio",
        titulo="Cinza Frio", resumo="Contraste alto.",
        versoes=[Versao("2.1.0", COMMIT, nivel, list(notas), 1757000000)],
    )


def pronta(hash_="a" * 64, nivel="verificado", notas=()):
    return {
        ("juli/cinza-frio", "2.1.0"): VersaoPronta(
            versao="2.1.0", api=1, publicado_em=1757000000, hash=hash_,
            alcanca=["trocar as cores"], arquivos=["cliente/main.js", "mod.json"],
            nivel=nivel, notas=list(notas),
        )
    }


def test_monta_um_catalogo_com_o_esquema_certo():
    c = montar([avaliacao()], pronta(), gerado_em=1757100000)
    assert c["esquema"] == ESQUEMA
    assert c["gerado_em"] == 1757100000
    assert len(c["mods"]) == 1


def test_o_mod_carrega_id_autor_nome_e_repo():
    m = montar([avaliacao()], pronta(), 1757100000)["mods"][0]
    assert m["id"] == "juli/cinza-frio"
    assert m["autor"] == "juli"
    assert m["nome"] == "cinza-frio"
    assert m["repo"] == "https://github.com/juli/seele-cinza-frio"


def test_nivel_e_commit_ficam_no_mod():
    m = montar([avaliacao()], pronta(), 1757100000)["mods"][0]
    assert m["nivel"] == "verificado"
    assert m["commit"] == COMMIT
    assert m["oficial"] is False


def test_oficial_e_verdadeiro_so_no_nivel_oficial():
    m = montar([avaliacao("oficial")], pronta(nivel="oficial"), 1757100000)["mods"][0]
    assert m["nivel"] == "oficial"
    assert m["oficial"] is True


def test_alcanca_fica_por_versao_e_nao_por_mod():
    # `mod.json` é por versão: uma versão que passa a alcançar a rede tem de
    # poder dizer isso sem reescrever o que a anterior alcançava.
    m = montar([avaliacao()], pronta(), 1757100000)["mods"][0]
    assert "alcanca" not in m
    assert m["versoes"][0]["alcanca"] == ["trocar as cores"]


def test_arquivos_saem_ordenados():
    # A lista é o que o cliente busca; ordem estável é o que torna dois
    # catálogos comparáveis com diff.
    v = montar([avaliacao()], pronta(), 1757100000)["mods"][0]["versoes"][0]
    assert v["arquivos"] == ["cliente/main.js", "mod.json"]


def test_uma_versao_sem_bytes_prontos_e_omitida():
    c = montar([avaliacao()], {}, 1757100000)
    assert c["mods"] == []


def test_append_only_aceita_versao_nova():
    anterior = montar([avaliacao()], pronta(), 1757000000)
    dupla = avaliacao()
    dupla.versoes.append(Versao("2.2.0", "b" * 40, "verificado", [], 1757000001))
    prontas = pronta()
    prontas[("juli/cinza-frio", "2.2.0")] = VersaoPronta(
        "2.2.0", 1, 1757000001, "c" * 64, [], ["mod.json"], "verificado", []
    )
    conferir_append_only(montar([dupla], prontas, 1757100000), anterior)


def test_append_only_recusa_hash_trocado():
    anterior = montar([avaliacao()], pronta(hash_="a" * 64), 1757000000)
    novo = montar([avaliacao()], pronta(hash_="d" * 64), 1757100000)
    with pytest.raises(Recusado) as erro:
        conferir_append_only(novo, anterior)
    assert erro.value.codigo == "versao-editada"
    assert "2.1.0" in erro.value.detalhe


def test_append_only_recusa_versao_sumida():
    # Uma versão que some do catálogo é uma revogação disfarçada, e revogação
    # tem lista própria, com motivo e com `corrigido_em`.
    anterior = montar([avaliacao()], pronta(), 1757000000)
    with pytest.raises(Recusado) as erro:
        conferir_append_only(montar([], {}, 1757100000), anterior)
    assert erro.value.codigo == "versao-sumida"


def test_append_only_passa_sem_anterior():
    conferir_append_only(montar([avaliacao()], pronta(), 1757100000), None)
```

- [ ] **Step 2: Rodar e ver falhar**

```bash
.venv/bin/pytest ferramentas/testes/test_catalogo.py -q
```

Esperado: `ModuleNotFoundError: No module named 'ferramentas.catalogo'`.

- [ ] **Step 3: Escrever a implementação**

```python
"""O `catalogo.json`: o índice inteiro, num arquivo parado.

O cliente baixa isto, confere a assinatura contra a chave compilada nele, e
busca **localmente**. É a regra do ADR 0044 virando formato: com API, o
indexador aprende cada termo que alguém digitou; com catálogo, aprende que
alguém buscou o catálogo."""

from dataclasses import dataclass, field

from ferramentas.avaliacoes import Avaliacao
from ferramentas.manifesto import Recusado

ESQUEMA = 1


@dataclass(frozen=True)
class VersaoPronta:
    """Uma versão com os bytes já buscados e o hash já calculado."""

    versao: str
    api: int
    publicado_em: int
    hash: str
    alcanca: list[str] = field(default_factory=list)
    arquivos: list[str] = field(default_factory=list)
    nivel: str = "verificado"
    notas: list[str] = field(default_factory=list)


def montar(
    avaliacoes: list[Avaliacao],
    prontas: dict[tuple[str, str], VersaoPronta],
    gerado_em: int,
) -> dict:
    """O catálogo inteiro, pronto para serializar e assinar."""
    mods = []
    for a in avaliacoes:
        versoes = []
        for v in a.versoes:
            pronta = prontas.get((a.id, v.versao))
            if pronta is None:
                # Sem bytes não há hash, e sem hash a entrada seria uma
                # promessa que o cliente não consegue conferir.
                continue
            versoes.append(
                {
                    "versao": pronta.versao,
                    "api": pronta.api,
                    "publicado_em": pronta.publicado_em,
                    "hash": pronta.hash,
                    # Por versão e não por MOD, porque `mod.json` é por versão.
                    "alcanca": list(pronta.alcanca),
                    "arquivos": sorted(pronta.arquivos),
                }
            )
        if not versoes:
            continue

        # O nível e as notas do MOD são os da versão mais recente avaliada: é
        # o que a tela mostra, e é sobre ela que a decisão de instalar é feita.
        ultima = a.versoes[-1]
        mods.append(
            {
                "id": a.id,
                "autor": a.autor,
                "nome": a.nome,
                "titulo": a.titulo,
                "resumo": a.resumo,
                "repo": a.repo,
                # `oficial` é conveniência de tela e não prova. Quem prova é a
                # assinatura — o campo mente junto com um catálogo adulterado.
                "oficial": ultima.nivel == "oficial",
                "nivel": ultima.nivel,
                "commit": ultima.commit,
                "notas": list(ultima.notas),
                "versoes": versoes,
            }
        )

    return {"esquema": ESQUEMA, "gerado_em": gerado_em, "mods": mods}


def _por_versao(catalogo: dict) -> dict[tuple[str, str], str]:
    return {
        (m["id"], v["versao"]): v["hash"]
        for m in catalogo["mods"]
        for v in m["versoes"]
    }


def conferir_append_only(novo: dict, anterior: dict | None) -> None:
    """Uma versão publicada nunca muda, e nunca some.

    Se o hash mudasse, «o MOD que você baixou é o MOD que revisamos» deixaria
    de valer sem nada avisar — e o cache eterno de `/mods/*` deixaria metade
    do mundo com os bytes velhos. Uma versão que some é uma revogação
    disfarçada, e revogação tem lista própria, com motivo e `corrigido_em`."""
    if anterior is None:
        return

    de_antes = _por_versao(anterior)
    de_agora = _por_versao(novo)

    for chave, hash_antigo in de_antes.items():
        identificador, versao = chave
        if chave not in de_agora:
            raise Recusado("versao-sumida", f"{identificador} {versao}")
        if de_agora[chave] != hash_antigo:
            raise Recusado(
                "versao-editada",
                f"{identificador} {versao}: era {hash_antigo}, virou {de_agora[chave]}",
            )
```

- [ ] **Step 4: Rodar e ver passar**

```bash
.venv/bin/pytest ferramentas/testes/test_catalogo.py -q
```

Esperado: `11 passed`.

- [ ] **Step 5: Commit**

```bash
git add ferramentas/catalogo.py ferramentas/testes/test_catalogo.py
git commit -m "Montar o catálogo e cobrar append-only

Uma versão publicada nunca muda de hash: se mudasse, o cache eterno de
/mods/* deixaria metade do mundo com os bytes velhos e nada avisaria."
```

---

### Task 7: `listas.json` e `revogacoes.py`

**Files:**
- Create: `listas.json`
- Create: `ferramentas/revogacoes.py`
- Create: `revogacoes.toml`
- Test: `ferramentas/testes/test_revogacoes.py`

**Interfaces:**
- Consumes: `manifesto.Recusado`.
- Produces:
  - `montar(texto_toml: str, listas: dict, gerado_em: int) -> dict`
  - `carregar_listas(raiz: Path) -> dict` com chaves `motivos` e `notas`

**Uma lista e não duas.** O ADR 0044 pede remoção de MOD que alcance quem já baixou; o ADR 0045 pede revogação de versão do produto. São a mesma peça, e duas listas seriam duas chances de esquecer uma.

- [ ] **Step 1: Escrever `listas.json`**

```json
{
  "comentario": "As listas fechadas. Fonte única para gerar.py e frases.js — se fossem duas, um motivo novo entraria no catálogo sem frase e a tela mostraria o identificador cru. O guarda é um teste, não a disciplina de quem edita.",
  "motivos": [
    "credencial-vazada",
    "leitura-de-disco-fora-da-pasta",
    "rede-nao-declarada",
    "dado-enviado-a-terceiro",
    "nao-corresponde-ao-commit",
    "pedido-do-autor",
    "migracao-que-corrompe"
  ],
  "notas": [
    "fala-com-terceiro",
    "guarda-dados-na-maquina",
    "substitui-a-interface-inteira",
    "roda-no-servidor"
  ]
}
```

- [ ] **Step 2: Escrever `revogacoes.toml` vazio**

```toml
# O que foi retirado, e por quê.
#
# Editado à mão, por uma pessoa. `revogacoes.json` é a saída assinada —
# editá-la direto produz um arquivo cuja assinatura não confere, e a
# descoberta disso vem tarde, na forma de um cliente recusando.
#
# `motivo` é um identificador de `listas.json`, nunca uma frase: quem
# escreve a frase é o `site/frases.js` (ADR 0012).
#
# `corrigido_em` é o que transforma a recusa em conserto. Uma recusa que só
# diz «não» manda a pessoa procurar; uma que diz para onde ir resolve.

# [[mods]]
# id = "alguem/ruim"
# versao = "1.2.0"
# motivo = "credencial-vazada"
# desde = 1757050000
# corrigido_em = "1.2.1"

# [[versoes_do_produto]]
# versao = "0.11.2"
# motivo = "leitura-de-disco-fora-da-pasta"
# desde = 1757050000
# corrigido_em = "0.11.3"
```

- [ ] **Step 3: Escrever o teste que falha**

```python
import json
from pathlib import Path

import pytest

from ferramentas.manifesto import Recusado
from ferramentas.revogacoes import carregar_listas, montar

RAIZ = Path(__file__).resolve().parents[2]
LISTAS = json.loads((RAIZ / "listas.json").read_text(encoding="utf-8"))

UM_MOD = """
[[mods]]
id = "alguem/ruim"
versao = "1.2.0"
motivo = "credencial-vazada"
desde = 1757050000
corrigido_em = "1.2.1"
"""

UM_PRODUTO = """
[[versoes_do_produto]]
versao = "0.11.2"
motivo = "leitura-de-disco-fora-da-pasta"
desde = 1757050000
corrigido_em = "0.11.3"
"""


def test_vazio_produz_as_duas_listas_vazias():
    r = montar("", LISTAS, 1757100000)
    assert r == {"esquema": 1, "gerado_em": 1757100000, "mods": [], "versoes_do_produto": []}


def test_uma_revogacao_de_mod():
    r = montar(UM_MOD, LISTAS, 1757100000)
    assert r["mods"] == [
        {
            "id": "alguem/ruim", "versao": "1.2.0", "motivo": "credencial-vazada",
            "desde": 1757050000, "corrigido_em": "1.2.1",
        }
    ]


def test_uma_revogacao_de_versao_do_produto():
    r = montar(UM_PRODUTO, LISTAS, 1757100000)
    assert r["versoes_do_produto"][0]["versao"] == "0.11.2"


def test_as_duas_convivem_no_mesmo_arquivo():
    r = montar(UM_MOD + UM_PRODUTO, LISTAS, 1757100000)
    assert len(r["mods"]) == 1
    assert len(r["versoes_do_produto"]) == 1


def test_motivo_fora_da_lista_e_recusado():
    with pytest.raises(Recusado) as erro:
        montar(UM_MOD.replace("credencial-vazada", "porque-sim"), LISTAS, 1757100000)
    assert erro.value.codigo == "motivo-desconhecido"
    assert "porque-sim" in erro.value.detalhe


def test_motivo_como_frase_e_recusado():
    # «`motivo` é um identificador de uma lista fechada, e não uma frase.»
    with pytest.raises(Recusado) as erro:
        montar(UM_MOD.replace("credencial-vazada", "vazou a senha do autor"), LISTAS, 1757100000)
    assert erro.value.codigo == "motivo-desconhecido"


def test_corrigido_em_ausente_e_aceito_como_nulo():
    # Nem toda revogação tem conserto: um MOD retirado a pedido do autor não
    # tem versão para onde mandar quem lê.
    sem = UM_MOD.replace('corrigido_em = "1.2.1"\n', "")
    assert montar(sem, LISTAS, 1757100000)["mods"][0]["corrigido_em"] is None


def test_carregar_listas_le_do_arquivo():
    listas = carregar_listas(RAIZ)
    assert "credencial-vazada" in listas["motivos"]
    assert "fala-com-terceiro" in listas["notas"]
```

- [ ] **Step 4: Rodar e ver falhar**

```bash
.venv/bin/pytest ferramentas/testes/test_revogacoes.py -q
```

Esperado: `ModuleNotFoundError: No module named 'ferramentas.revogacoes'`.

- [ ] **Step 5: Escrever a implementação**

```python
"""O que foi retirado, numa lista só.

O ADR 0044 pede remoção de MOD que alcance quem já baixou; o ADR 0045 pede
revogação de versão do produto. São a mesma peça, e duas listas seriam duas
chances de esquecer uma.

O TOML é o que uma pessoa escreve; o JSON é o que é assinado. Editar o JSON
direto produz um arquivo cuja assinatura não confere, e a descoberta vem
tarde — na forma de um cliente recusando."""

import json
import tomllib
from pathlib import Path

from ferramentas.manifesto import Recusado

ESQUEMA = 1


def carregar_listas(raiz: Path) -> dict:
    """As listas fechadas de `motivo` e `nota`, da fonte única."""
    return json.loads((raiz / "listas.json").read_text(encoding="utf-8"))


def _entrada(bruta: dict, listas: dict, onde: str) -> dict:
    motivo = bruta.get("motivo", "")
    if motivo not in listas["motivos"]:
        # Um motivo livre é uma frase, e o núcleo nunca formata mensagem
        # (ADR 0012). Quem escreve a frase é o `site/frases.js`.
        raise Recusado("motivo-desconhecido", f"{onde}: {motivo!r}")
    return {
        "motivo": motivo,
        "desde": bruta.get("desde", 0),
        # Nem toda revogação tem conserto: um MOD retirado a pedido do autor
        # não tem versão para onde mandar quem lê.
        "corrigido_em": bruta.get("corrigido_em"),
    }


def montar(texto_toml: str, listas: dict, gerado_em: int) -> dict:
    """`revogacoes.toml` → o dicionário que vira `revogacoes.json`."""
    try:
        cru = tomllib.loads(texto_toml)
    except tomllib.TOMLDecodeError as erro:
        raise Recusado("toml-malformado", str(erro)) from erro

    mods = []
    for bruta in cru.get("mods", []):
        onde = f'{bruta.get("id")} {bruta.get("versao")}'
        mods.append(
            {"id": bruta.get("id", ""), "versao": bruta.get("versao", ""), **_entrada(bruta, listas, onde)}
        )

    produto = []
    for bruta in cru.get("versoes_do_produto", []):
        onde = f'produto {bruta.get("versao")}'
        produto.append({"versao": bruta.get("versao", ""), **_entrada(bruta, listas, onde)})

    return {
        "esquema": ESQUEMA,
        "gerado_em": gerado_em,
        "mods": mods,
        "versoes_do_produto": produto,
    }
```

- [ ] **Step 6: Rodar e ver passar**

```bash
.venv/bin/pytest ferramentas/testes/test_revogacoes.py -q
```

Esperado: `8 passed`.

- [ ] **Step 7: Commit**

```bash
git add listas.json revogacoes.toml ferramentas/revogacoes.py ferramentas/testes/test_revogacoes.py
git commit -m "Revogações numa lista só, com motivo de lista fechada

MOD e versão do produto são a mesma peça; duas listas seriam duas chances
de esquecer uma. listas.json é fonte única para o gerador e para o site."
```

---

### Task 8: `assinar.py` — minisign, e o guarda de cache

**Files:**
- Create: `ferramentas/assinar.py`
- Test: `ferramentas/testes/test_assinar.py`

**Interfaces:**
- Consumes: `manifesto.Recusado`.
- Produces:
  - `assinar(arquivo: Path, chave_secreta: Path, comentario: str) -> Path`
  - `conferir_cache_do_par(headers: str, assinado: str) -> None`
  - levanta `Recusado` com `minisign-falhou`, `cache-do-par-difere`

**O guarda que esta tarefa existe para pôr.** *«A assinatura tem de ter o mesmo cache do arquivo que ela assina. Um catálogo novo com uma assinatura velha em cache é um cliente recusando um catálogo legítimo — a falha mais difícil de diagnosticar deste desenho inteiro, porque ela parece adulteração.»* Uma falha assim merece um teste, não um parágrafo.

**Modo legado (`-l`), e a razão é o tamanho do arquivo.** O pré-hash existe para arquivo grande, e o catálogo tem dezenas de KB. Não é pelo navegador: a conferência de lá é integridade e não autenticidade, então justificá-la assim seria pagar por um benefício que não existe.

- [ ] **Step 1: Escrever o teste que falha**

```python
import shutil
import subprocess

import pytest

from ferramentas.assinar import assinar, conferir_cache_do_par
from ferramentas.manifesto import Recusado

pytestmark = pytest.mark.skipif(shutil.which("minisign") is None, reason="minisign não instalado")

HEADERS_BOM = """
/mods/*
  Cache-Control: public, max-age=31536000, immutable

/catalogo.json
  Cache-Control: public, max-age=300

/catalogo.json.minisig
  Cache-Control: public, max-age=300

/revogacoes.json
  Cache-Control: public, max-age=60, must-revalidate

/revogacoes.json.minisig
  Cache-Control: public, max-age=60, must-revalidate
"""


@pytest.fixture
def par(tmp_path):
    """Um par de chaves sem senha, para o teste."""
    publica, secreta = tmp_path / "t.pub", tmp_path / "t.key"
    subprocess.run(
        ["minisign", "-G", "-f", "-p", str(publica), "-s", str(secreta)],
        input="\n\n", text=True, check=True, capture_output=True,
    )
    return publica, secreta


def test_assina_e_o_minisign_confere(tmp_path, par):
    publica, secreta = par
    alvo = tmp_path / "catalogo.json"
    alvo.write_text('{"esquema":1}', encoding="utf-8")

    assinatura = assinar(alvo, secreta, "catalogo do indexador")
    assert assinatura == tmp_path / "catalogo.json.minisig"

    pronto = subprocess.run(
        ["minisign", "-V", "-p", str(publica), "-m", str(alvo)],
        capture_output=True, text=True,
    )
    assert pronto.returncode == 0, pronto.stderr


def test_a_assinatura_e_do_modo_legado(tmp_path, par):
    # `Ed` e não `ED`: o segundo é pré-hasheado, e o pré-hash existe para
    # arquivo grande. O catálogo tem dezenas de KB.
    import base64
    _, secreta = par
    alvo = tmp_path / "catalogo.json"
    alvo.write_text("{}", encoding="utf-8")
    linhas = assinar(alvo, secreta, "c").read_text(encoding="utf-8").splitlines()
    assert base64.b64decode(linhas[1])[:2] == b"Ed"


def test_um_byte_trocado_derruba_a_verificacao(tmp_path, par):
    publica, secreta = par
    alvo = tmp_path / "catalogo.json"
    alvo.write_text('{"esquema":1}', encoding="utf-8")
    assinar(alvo, secreta, "c")
    alvo.write_text('{"esquema":2}', encoding="utf-8")

    pronto = subprocess.run(
        ["minisign", "-V", "-p", str(publica), "-m", str(alvo)],
        capture_output=True, text=True,
    )
    assert pronto.returncode != 0


def test_o_cache_do_par_confere():
    conferir_cache_do_par(HEADERS_BOM, "/catalogo.json")
    conferir_cache_do_par(HEADERS_BOM, "/revogacoes.json")


def test_cache_do_par_diferente_e_recusado():
    torto = HEADERS_BOM.replace(
        "/catalogo.json.minisig\n  Cache-Control: public, max-age=300",
        "/catalogo.json.minisig\n  Cache-Control: public, max-age=86400",
    )
    with pytest.raises(Recusado) as erro:
        conferir_cache_do_par(torto, "/catalogo.json")
    assert erro.value.codigo == "cache-do-par-difere"


def test_assinatura_sem_regra_de_cache_e_recusada():
    sem = HEADERS_BOM.replace("/catalogo.json.minisig\n  Cache-Control: public, max-age=300\n", "")
    with pytest.raises(Recusado) as erro:
        conferir_cache_do_par(sem, "/catalogo.json")
    assert erro.value.codigo == "cache-do-par-difere"
```

- [ ] **Step 2: Rodar e ver falhar**

```bash
.venv/bin/pytest ferramentas/testes/test_assinar.py -q
```

Esperado: `ModuleNotFoundError: No module named 'ferramentas.assinar'`.

- [ ] **Step 3: Escrever a implementação**

```python
"""Assinar o que o Pages serve, e conferir que o cache do par bate.

A chave privada nunca entra na Cloudflare nem em CI: assinar localmente e
comitar o `.minisig` é o que mantém a propriedade que o ADR 0026 mais preza
— a chave que autoriza é a única coisa que um invasor não alcança pela
rede."""

import re
import subprocess
from pathlib import Path

from ferramentas.manifesto import Recusado


def assinar(arquivo: Path, chave_secreta: Path, comentario: str) -> Path:
    """Assina `arquivo`, produzindo `<arquivo>.minisig`.

    `-l` é modo legado: assina os bytes crus em vez do BLAKE2b deles. A razão
    é o tamanho — o pré-hash existe para arquivo grande, e o catálogo tem
    dezenas de KB. **Não é pelo navegador:** a conferência de lá é integridade
    e não autenticidade (mesma origem, sem âncora), então justificar o modo
    por ela seria pagar por um benefício que não existe."""
    try:
        subprocess.run(
            ["minisign", "-S", "-l", "-s", str(chave_secreta), "-m", str(arquivo), "-t", comentario],
            check=True, capture_output=True, text=True,
        )
    except subprocess.CalledProcessError as erro:
        raise Recusado("minisign-falhou", erro.stderr.strip()) from erro
    return arquivo.with_suffix(arquivo.suffix + ".minisig")


def _cache_de(headers: str, caminho: str) -> str | None:
    """A linha `Cache-Control` do bloco de `caminho`, ou nada."""
    padrao = re.compile(
        r"^" + re.escape(caminho) + r"\s*$\n(?:^\s+.*$\n?)*", re.MULTILINE
    )
    achado = padrao.search(headers)
    if achado is None:
        return None
    for linha in achado.group(0).splitlines()[1:]:
        if linha.strip().lower().startswith("cache-control:"):
            return linha.split(":", 1)[1].strip()
    return None


def conferir_cache_do_par(headers: str, assinado: str) -> None:
    """A assinatura tem de ter o mesmo cache do arquivo que ela assina.

    Um catálogo novo com uma assinatura velha em cache é um cliente recusando
    um catálogo legítimo — a falha mais difícil de diagnosticar deste desenho
    inteiro, porque ela parece adulteração. É por isso que ela tem um guarda
    e não um parágrafo."""
    do_arquivo = _cache_de(headers, assinado)
    da_assinatura = _cache_de(headers, assinado + ".minisig")
    if do_arquivo != da_assinatura:
        raise Recusado(
            "cache-do-par-difere",
            f"{assinado} tem {do_arquivo!r} e a assinatura tem {da_assinatura!r}",
        )
```

- [ ] **Step 4: Rodar e ver passar**

```bash
.venv/bin/pytest ferramentas/testes/test_assinar.py -q
```

Esperado: `6 passed`.

- [ ] **Step 5: Commit**

```bash
git add ferramentas/assinar.py ferramentas/testes/test_assinar.py
git commit -m "Assinar com minisign e cobrar o cache do par

Um catálogo novo com assinatura velha em cache é um cliente recusando um
catálogo legítimo, e parece adulteração. A doc chama isso da falha mais
difícil de diagnosticar do desenho: merece guarda, não parágrafo."
```

---

### Task 9: `gerar.py` — a CLI

**Files:**
- Create: `ferramentas/gerar.py`
- Create: `site/_headers`
- Test: `ferramentas/testes/test_gerar.py`

**Interfaces:**
- Consumes: todos os módulos das Tasks 1 e 3–8.
- Produces: `publicado/` com `catalogo.json`, `revogacoes.json`, os dois `.minisig`, `chave.pub`, `_headers`, `mods/…` e os arquivos do site.
- Produces: `gerar(raiz: Path, chave_secreta: Path, agora: int) -> dict` — o resumo do que foi escrito.

- [ ] **Step 1: Escrever `site/_headers`**

```
# As regras de cache, e os três números são decisões diferentes.
#
# /mods/* é eterno porque o caminho carrega a versão e o conteúdo nunca
# muda. Um MOD baixado uma vez não é baixado de novo.
/mods/*
  Cache-Control: public, max-age=31536000, immutable

# Cinco minutos é o atraso máximo entre aprovar um MOD e ele aparecer para
# alguém. Curto o bastante para não parecer quebrado, longo o bastante para
# a CDN valer.
/catalogo.json
  Cache-Control: public, max-age=300

/catalogo.json.minisig
  Cache-Control: public, max-age=300

# Um minuto decide quanto tempo uma versão furada continua rodando depois de
# você a retirar. Caro em requisições, barato em tudo o mais.
/revogacoes.json
  Cache-Control: public, max-age=60, must-revalidate

/revogacoes.json.minisig
  Cache-Control: public, max-age=60, must-revalidate

# O site humano, pelo mesmo motivo do catálogo: é o atraso máximo entre
# corrigir uma frase e alguém lê-la.
/
  Cache-Control: public, max-age=300

/*.js
  Cache-Control: public, max-age=300

/*.css
  Cache-Control: public, max-age=300

# As fontes não mudam. Trinta dias e não um ano porque o caminho delas não
# carrega versão — só /mods/* tem essa propriedade, e só ele ganha immutable.
/fontes/*
  Cache-Control: public, max-age=2592000
```

- [ ] **Step 2: Escrever o teste que falha**

```python
import json
import shutil
import subprocess

import pytest

from ferramentas.gerar import gerar
from ferramentas.manifesto import Recusado

pytestmark = pytest.mark.skipif(shutil.which("minisign") is None, reason="minisign não instalado")

MOD_JSON = json.dumps(
    {
        "schema": 1, "id": "juli/cinza-frio", "version": "2.1.0", "api": 1,
        "repo": "https://github.com/juli/seele-cinza-frio",
        "reach": ["trocar as cores da interface"],
        "client": "cliente/main.js",
    }
)


def git(diretorio, *args):
    return subprocess.run(
        ["git", *args], cwd=diretorio, check=True, capture_output=True, text=True
    ).stdout.strip()


@pytest.fixture
def mundo(tmp_path):
    """Uma raiz de indexador completa, com um repositório de autor local."""
    autor = tmp_path / "repo-do-autor"
    (autor / "cliente").mkdir(parents=True)
    (autor / "mod.json").write_text(MOD_JSON, encoding="utf-8")
    (autor / "cliente" / "main.js").write_text("// cinza\n", encoding="utf-8")
    git(autor, "init", "-q", "-b", "principal")
    git(autor, "config", "user.email", "a@b")
    git(autor, "config", "user.name", "A")
    git(autor, "add", "-A")
    git(autor, "commit", "-q", "-m", "primeiro")
    commit = git(autor, "rev-parse", "HEAD")

    raiz = tmp_path / "indexador"
    (raiz / "avaliacoes" / "juli").mkdir(parents=True)
    (raiz / "avaliacoes" / "juli" / "cinza-frio.toml").write_text(
        f"""
id = "juli/cinza-frio"
repo = "{autor}"
titulo = "Cinza Frio"
resumo = "Contraste alto."

[[versoes]]
versao = "2.1.0"
commit = "{commit}"
nivel = "verificado"
notas = []
avaliado_em = 1757000000
""",
        encoding="utf-8",
    )
    (raiz / "revogacoes.toml").write_text("", encoding="utf-8")

    projeto = __import__("pathlib").Path(__file__).resolve().parents[2]
    shutil.copy(projeto / "listas.json", raiz / "listas.json")
    shutil.copytree(projeto / "site", raiz / "site")

    chaves = raiz / "chaves"
    chaves.mkdir()
    secreta = tmp_path / "t.key"
    subprocess.run(
        ["minisign", "-G", "-f", "-p", str(chaves / "mods.pub"), "-s", str(secreta)],
        input="\n\n", text=True, check=True, capture_output=True,
    )
    return raiz, secreta, commit


def test_escreve_o_catalogo_assinado(mundo):
    raiz, secreta, _ = mundo
    gerar(raiz, secreta, agora=1757100000)

    publicado = raiz / "publicado"
    assert (publicado / "catalogo.json").is_file()
    assert (publicado / "catalogo.json.minisig").is_file()
    assert (publicado / "revogacoes.json").is_file()
    assert (publicado / "revogacoes.json.minisig").is_file()
    assert (publicado / "chave.pub").is_file()
    assert (publicado / "_headers").is_file()


def test_a_assinatura_confere_com_a_chave_publica(mundo):
    raiz, secreta, _ = mundo
    gerar(raiz, secreta, agora=1757100000)
    publicado = raiz / "publicado"
    pronto = subprocess.run(
        ["minisign", "-V", "-p", str(publicado / "chave.pub"), "-m", str(publicado / "catalogo.json")],
        capture_output=True, text=True,
    )
    assert pronto.returncode == 0, pronto.stderr


def test_os_arquivos_do_mod_saem_no_caminho_com_a_versao(mundo):
    raiz, secreta, _ = mundo
    gerar(raiz, secreta, agora=1757100000)
    base = raiz / "publicado" / "mods" / "juli" / "cinza-frio" / "2.1.0"
    assert (base / "mod.json").read_text(encoding="utf-8") == MOD_JSON
    assert (base / "cliente" / "main.js").is_file()


def test_o_hash_do_catalogo_bate_com_os_bytes_servidos(mundo):
    # É a conferência que o cliente faz no passo 6. Se ela falhar aqui, ela
    # falha lá — e lá a mensagem diz «adulterado».
    from ferramentas.hash_conteudo import conteudo

    raiz, secreta, _ = mundo
    gerar(raiz, secreta, agora=1757100000)
    catalogo = json.loads((raiz / "publicado" / "catalogo.json").read_text(encoding="utf-8"))
    versao = catalogo["mods"][0]["versoes"][0]
    base = raiz / "publicado" / "mods" / "juli" / "cinza-frio" / "2.1.0"
    arquivos = [(caminho, (base / caminho).read_bytes()) for caminho in versao["arquivos"]]
    assert conteudo(arquivos) == versao["hash"]


def test_alcanca_vem_do_reach_do_manifesto(mundo):
    raiz, secreta, _ = mundo
    gerar(raiz, secreta, agora=1757100000)
    catalogo = json.loads((raiz / "publicado" / "catalogo.json").read_text(encoding="utf-8"))
    assert catalogo["mods"][0]["versoes"][0]["alcanca"] == ["trocar as cores da interface"]


def test_o_site_e_copiado_para_publicado(mundo):
    raiz, secreta, _ = mundo
    gerar(raiz, secreta, agora=1757100000)
    assert (raiz / "publicado" / "index.html").is_file()
    assert (raiz / "publicado" / "app.js").is_file()


def test_a_chave_privada_nunca_vai_para_publicado(mundo):
    raiz, secreta, _ = mundo
    gerar(raiz, secreta, agora=1757100000)
    assert not list((raiz / "publicado").rglob("*.key"))


def test_rodar_duas_vezes_passa_no_append_only(mundo):
    raiz, secreta, _ = mundo
    gerar(raiz, secreta, agora=1757100000)
    gerar(raiz, secreta, agora=1757200000)


def test_trocar_o_commit_de_uma_versao_publicada_e_recusado(mundo):
    # Se o hash mudasse, «o MOD que você baixou é o MOD que revisamos»
    # deixaria de valer sem nada avisar.
    raiz, secreta, _ = mundo
    gerar(raiz, secreta, agora=1757100000)

    toml = raiz / "avaliacoes" / "juli" / "cinza-frio.toml"
    repo = [l for l in toml.read_text(encoding="utf-8").splitlines() if l.startswith("repo")][0]
    autor = repo.split('"')[1]
    (__import__("pathlib").Path(autor) / "cliente" / "main.js").write_text("// outro\n", encoding="utf-8")
    git(autor, "add", "-A")
    git(autor, "commit", "-q", "-m", "segundo")
    novo = git(autor, "rev-parse", "HEAD")

    antigo = [l for l in toml.read_text(encoding="utf-8").splitlines() if l.startswith("commit")][0]
    toml.write_text(
        toml.read_text(encoding="utf-8").replace(antigo, f'commit = "{novo}"'), encoding="utf-8"
    )

    with pytest.raises(Recusado) as erro:
        gerar(raiz, secreta, agora=1757200000)
    assert erro.value.codigo == "versao-editada"
```

- [ ] **Step 3: Rodar e ver falhar**

```bash
.venv/bin/pytest ferramentas/testes/test_gerar.py -q
```

Esperado: `ModuleNotFoundError: No module named 'ferramentas.gerar'`.

- [ ] **Step 4: Escrever a implementação**

```python
"""Monta `publicado/` — o que a Cloudflare Pages serve.

Roda na máquina de quem tem a chave privada de MOD, e o commit de
`publicado/` é o deploy. Não há passo de build remoto onde enfiar um
segredo, e é essa ausência que mantém a propriedade do ADR 0026."""

import argparse
import json
import shutil
import sys
import time
from pathlib import Path

from ferramentas import assinar as assinatura
from ferramentas import avaliacoes as leitura
from ferramentas import catalogo as montagem
from ferramentas import manifesto as manifestos
from ferramentas import revogacoes as retiradas
from ferramentas.fonte import materializar
from ferramentas.hash_conteudo import conteudo
from ferramentas.manifesto import Recusado


def _escrever_json(caminho: Path, dados: dict) -> None:
    """JSON estável: chaves na ordem em que foram postas, UTF-8 de verdade.

    `ensure_ascii=False` porque um título em português vira `\\u00e7` de
    outro jeito, e o catálogo é lido por gente. `sort_keys=False` porque a
    ordem já é decidida em `catalogo.py`, e reordenar aqui faria dois
    catálogos iguais parecerem diferentes num diff."""
    caminho.write_text(
        json.dumps(dados, ensure_ascii=False, indent=2, sort_keys=False) + "\n",
        encoding="utf-8",
    )


def gerar(raiz: Path, chave_secreta: Path, agora: int | None = None) -> dict:
    """Monta `publicado/` inteiro. Levanta `Recusado` no primeiro problema."""
    agora = int(time.time()) if agora is None else agora
    publicado = raiz / "publicado"
    anterior_bruto = publicado / "catalogo.json"
    anterior = json.loads(anterior_bruto.read_text(encoding="utf-8")) if anterior_bruto.is_file() else None

    listas = retiradas.carregar_listas(raiz)
    todas = leitura.ler_todas(raiz / "avaliacoes")
    cache = raiz / ".cache-de-repos"

    # Monta num diretório novo e troca no fim: um `gerar.py` que falha no meio
    # não pode deixar `publicado/` com metade do catálogo velho e metade do
    # novo, porque é isso que alguém comitaria sem perceber.
    estufa = raiz / ".publicado-em-obras"
    if estufa.exists():
        shutil.rmtree(estufa)
    estufa.mkdir(parents=True)

    prontas: dict[tuple[str, str], montagem.VersaoPronta] = {}
    for avaliacao in todas:
        for versao in avaliacao.versoes:
            arquivos = materializar(avaliacao.repo, versao.commit, cache)
            por_caminho = dict(arquivos)
            if "mod.json" not in por_caminho:
                raise Recusado("sem-manifesto", f"{avaliacao.id} {versao.versao}")

            m = manifestos.ler(por_caminho["mod.json"].decode("utf-8"))
            if m.id != avaliacao.id:
                # O manifesto e a avaliação têm de falar do mesmo MOD, senão o
                # catálogo publica sob um id que o app vai recusar.
                raise Recusado("id-nao-bate-com-o-manifesto", f"{avaliacao.id} != {m.id}")
            if m.version != versao.versao:
                raise Recusado("versao-nao-bate-com-o-manifesto", f"{versao.versao} != {m.version}")

            destino = estufa / "mods" / avaliacao.autor / avaliacao.nome / versao.versao
            for caminho, bytes_ in arquivos:
                alvo = destino / caminho
                alvo.parent.mkdir(parents=True, exist_ok=True)
                alvo.write_bytes(bytes_)

            prontas[(avaliacao.id, versao.versao)] = montagem.VersaoPronta(
                versao=versao.versao,
                api=m.api,
                publicado_em=versao.avaliado_em,
                hash=conteudo(arquivos),
                alcanca=m.reach,
                arquivos=[caminho for caminho, _ in arquivos],
                nivel=versao.nivel,
                notas=versao.notas,
            )

    catalogo_novo = montagem.montar(todas, prontas, agora)
    montagem.conferir_append_only(catalogo_novo, anterior)

    revogacoes_novas = retiradas.montar(
        (raiz / "revogacoes.toml").read_text(encoding="utf-8"), listas, agora
    )

    # O site, e o `_headers` junto — a conferência de cache lê o arquivo que
    # acabou de ser copiado, e não uma cópia na memória.
    shutil.copytree(raiz / "site", estufa, dirs_exist_ok=True)
    headers = (estufa / "_headers").read_text(encoding="utf-8")
    assinatura.conferir_cache_do_par(headers, "/catalogo.json")
    assinatura.conferir_cache_do_par(headers, "/revogacoes.json")

    _escrever_json(estufa / "catalogo.json", catalogo_novo)
    _escrever_json(estufa / "revogacoes.json", revogacoes_novas)
    assinatura.assinar(estufa / "catalogo.json", chave_secreta, "catalogo do indexador de MODs")
    assinatura.assinar(estufa / "revogacoes.json", chave_secreta, "revogacoes do indexador de MODs")

    # A pública por conveniência humana: alguém confere uma assinatura à mão.
    # A privada nunca chega aqui — ela é lida de fora e nada a copia.
    shutil.copy(raiz / "chaves" / "mods.pub", estufa / "chave.pub")
    shutil.copy(raiz / "listas.json", estufa / "listas.json")

    if publicado.exists():
        shutil.rmtree(publicado)
    estufa.rename(publicado)

    return {
        "mods": len(catalogo_novo["mods"]),
        "versoes": len(prontas),
        "revogacoes": len(revogacoes_novas["mods"]) + len(revogacoes_novas["versoes_do_produto"]),
    }


def main() -> int:
    analisador = argparse.ArgumentParser(description="Monta publicado/ e assina.")
    analisador.add_argument("--raiz", type=Path, default=Path(__file__).resolve().parents[1])
    analisador.add_argument("--chave", type=Path, required=True, help="a chave privada de MOD")
    args = analisador.parse_args()

    try:
        resumo = gerar(args.raiz, args.chave)
    except Recusado as erro:
        # Um identificador e o detalhe, e nunca uma frase bonita: quem lê isto
        # é quem publica, e o que ele precisa é saber qual arquivo consertar.
        print(f"recusado [{erro.codigo}] {erro.detalhe}", file=sys.stderr)
        return 1

    print(f'{resumo["mods"]} mods, {resumo["versoes"]} versões, {resumo["revogacoes"]} revogações')
    print("agora comite publicado/ — o commit é o deploy")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
```

- [ ] **Step 5: Rodar e ver passar**

Precisa das Tasks 10–15 para `site/` existir. Se ainda não existirem, crie os vazios mínimos para o teste rodar:

```bash
mkdir -p site && touch site/index.html site/app.js
.venv/bin/pytest ferramentas/testes/test_gerar.py -q
```

Esperado: `9 passed`.

- [ ] **Step 6: Rodar a suíte inteira do Python**

```bash
.venv/bin/pytest -q
```

Esperado: `75 passed`.

- [ ] **Step 7: Commit**

```bash
git add ferramentas/gerar.py site/_headers ferramentas/testes/test_gerar.py
git commit -m "gerar.py: monta publicado/, assina, e o commit é o deploy

Monta numa estufa e troca no fim: um gerador que falha no meio não pode
deixar publicado/ com metade do catálogo velho e metade do novo."
```

---

### Task 10: `frases.js` — e o guarda que reprova quando falta uma

**Files:**
- Create: `site/frases.js`
- Test: `site/testes/frases.test.js`

**Interfaces:**
- Consumes: `listas.json`.
- Produces:
  - `frase(grupo, identificador) -> string` — grupos `"motivos"`, `"notas"`, `"falhas"`, `"niveis"`
  - `MOTIVOS`, `NOTAS`, `FALHAS`, `NIVEIS` — objetos identificador → frase

**A fronteira erro→texto do produto fica aqui**, e é por isso que nenhuma mensagem para gente é escrita no gerador. O molde é `apps/seele-app/ui/frases.js` (ADR 0012).

**O guarda vale mais que as frases.** A `frases.js` do produto conta ter pegado um buraco silencioso — a ponte mandava `FellBehind` e a tela de fim não tinha frase, então o motivo saía em branco justamente na queda que não é culpa de ninguém. O mesmo teste está aqui.

- [ ] **Step 1: Escrever o teste que falha**

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { FALHAS, MOTIVOS, NIVEIS, NOTAS, frase } from "../frases.js";

const LISTAS = JSON.parse(
  readFileSync(fileURLToPath(new URL("../../listas.json", import.meta.url)), "utf-8"),
);

test("todo motivo da lista fechada tem frase", () => {
  for (const id of LISTAS.motivos) {
    assert.ok(MOTIVOS[id], `falta frase para o motivo ${id}`);
  }
});

test("toda nota da lista fechada tem frase", () => {
  for (const id of LISTAS.notas) {
    assert.ok(NOTAS[id], `falta frase para a nota ${id}`);
  }
});

test("nenhuma frase sobra sem identificador", () => {
  // Uma frase órfã é uma lista que mudou e uma que não mudou junto.
  for (const id of Object.keys(MOTIVOS)) {
    assert.ok(LISTAS.motivos.includes(id), `frase órfã: ${id}`);
  }
  for (const id of Object.keys(NOTAS)) {
    assert.ok(LISTAS.notas.includes(id), `frase órfã: ${id}`);
  }
});

test("os três níveis do catálogo têm frase", () => {
  for (const id of ["oficial", "verificado", "com-notas"]) {
    assert.ok(NIVEIS[id], `falta frase para o nível ${id}`);
  }
});

test("as quatro falhas da tela têm frase", () => {
  for (const id of ["sem-resposta", "assinatura-nao-confere", "hash-nao-bate", "sem-ed25519"]) {
    assert.ok(FALHAS[id], `falta frase para a falha ${id}`);
  }
});

test("a frase da assinatura acusa cache antes de adulteração", () => {
  // É a causa provável e a mais difícil de achar: um catálogo novo com uma
  // assinatura velha em cache parece adulteração e não é.
  const texto = FALHAS["assinatura-nao-confere"].toLowerCase();
  assert.ok(texto.includes("cache"), "a frase tem de falar em cache");
});

test("nenhuma frase promete autenticidade", () => {
  // A conferência do navegador é integridade: verificador, chave e catálogo
  // vêm da mesma origem, e não há âncora.
  const todas = Object.values({ ...FALHAS, ...NIVEIS }).join(" ").toLowerCase();
  assert.ok(!todas.includes("autêntic"), "a palavra é «íntegro», nunca «autêntico»");
});

test("um identificador desconhecido não devolve undefined", () => {
  // Mostrar «undefined» para quem lê é pior que mostrar o identificador.
  assert.equal(frase("motivos", "inexistente"), "inexistente");
});
```

- [ ] **Step 2: Rodar e ver falhar**

```bash
mkdir -p site/testes
node --test site/testes/frases.test.js
```

Esperado: `Cannot find module .../site/frases.js`.

- [ ] **Step 3: Escrever a implementação**

```js
// SEELE MODS — identificador → frase, para toda tela.
//
// A fronteira erro→texto fica aqui, e é por isso que nenhuma mensagem para
// gente nasce no `gerar.py`. As listas fechadas carregam identificadores
// justamente para que a casca escreva as frases (ADR 0012).
//
// O molde é `apps/seele-app/ui/frases.js`, e o guarda também: aquele arquivo
// conta ter tido um buraco silencioso — um motivo chegava e a tela não tinha
// frase, então saía em branco. `site/testes/frases.test.js` reprova quando
// alguém acrescenta um identificador em `listas.json` sem passar por aqui.

"use strict";

/** Por que uma versão foi retirada. Vale para MOD e para versão do produto. */
export const MOTIVOS = {
  "credencial-vazada": "um segredo foi publicado junto com o código",
  "leitura-de-disco-fora-da-pasta": "leu ou escreveu fora da pasta dele",
  "rede-nao-declarada": "alcançou a rede sem ter declarado que alcançaria",
  "dado-enviado-a-terceiro": "mandou para fora o que era da sessão",
  "nao-corresponde-ao-commit": "os bytes servidos não saíam do commit avaliado",
  "pedido-do-autor": "quem escreveu pediu a retirada",
  "migracao-que-corrompe": "uma migração desta versão perde dados",
};

/** O que a avaliação achou de incomum, e que é legítimo. */
export const NOTAS = {
  "fala-com-terceiro": "conversa com um serviço de fora durante a sessão",
  "guarda-dados-na-maquina": "grava coisas na sua máquina, na pasta dele",
  "substitui-a-interface-inteira": "repinta a janela toda, e não uma parte",
  "roda-no-servidor": "tem uma metade que roda na máquina de quem hospeda",
};

/** O que cada nível atesta — e o que ele não atesta. */
export const NIVEIS = {
  oficial: "nosso, e nós respondemos por ele",
  verificado: "passou na avaliação automática",
  "com-notas": "passou, com ressalvas que valem a leitura",
};

/** As falhas da tela.
 *
 * A primeira é a que vai acontecer, e ela liga as duas coisas na mesma
 * frase: sem o indexador, não se entra em servidor com MOD. Sem isso, quem
 * hospeda culpa o próprio roteador.
 *
 * A segunda acusa cache antes de adulteração porque é a causa provável — um
 * catálogo novo com assinatura velha em cache é a falha mais difícil de
 * diagnosticar deste desenho, e ela parece adulteração.
 *
 * Nenhuma delas oferece «tentar assim mesmo» (ADR 0029). */
export const FALHAS = {
  "sem-resposta":
    "mods.seele.app.br não respondeu. Se você estava entrando num servidor com mod, é por isso que não entrou — a lista dos mods vem daqui.",
  "assinatura-nao-confere":
    "o catálogo e a assinatura dele não combinam. Quase sempre é cache: um dos dois chegou velho de um nó da CDN. Recarregue daqui a um minuto. Se continuar, não use este catálogo.",
  "hash-nao-bate":
    "os arquivos baixados não somam o número que o catálogo diz. Os dois números estão lado a lado abaixo.",
  "sem-ed25519":
    "este navegador não confere assinaturas Ed25519. O catálogo abaixo não foi conferido aqui — quem confere de verdade é o app.",
};

const GRUPOS = { motivos: MOTIVOS, notas: NOTAS, niveis: NIVEIS, falhas: FALHAS };

/**
 * A frase de um identificador.
 *
 * Devolve o próprio identificador quando não há frase, e nunca `undefined`:
 * mostrar «undefined» para quem lê é pior que mostrar `credencial-vazada`.
 * O teste é que impede isso de acontecer em produção.
 */
export function frase(grupo, identificador) {
  const dicionario = GRUPOS[grupo];
  if (!dicionario) return identificador;
  return dicionario[identificador] ?? identificador;
}
```

- [ ] **Step 4: Rodar e ver passar**

```bash
node --test site/testes/frases.test.js
```

Esperado: `# pass 8`.

- [ ] **Step 5: Commit**

```bash
git add site/frases.js site/testes/frases.test.js
git commit -m "frases.js: identificador vira frase, e um teste cobra a lista

O guarda vale mais que as frases: a frases.js do produto conta ter tido um
motivo sem frase saindo em branco na tela. Este reprova antes."
```

---

### Task 11: `verificar.js` — minisign no navegador

**Files:**
- Create: `site/verificar.js`
- Test: `site/testes/verificar.test.js`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `analisarChave(texto) -> { algoritmo, idDaChave, publica }`
  - `analisarAssinatura(texto) -> { algoritmo, idDaChave, assinatura, comentarioConfiavel, assinaturaGlobal }`
  - `async verificar(bytes, textoDaAssinatura, textoDaChave) -> { integro: boolean, causa?: string }`
  - `async temEd25519() -> boolean`

**O que esta função **não** é.** Ela é integridade, nunca autenticidade. O verificador, a chave e o catálogo vêm todos da mesma origem: quem adultera um adultera os três, e não há âncora. Ela pega corrupção acidental e CDN mal configurada — e essa segunda é a falha que a doc chama de pior do desenho inteiro.

**O formato do `.minisig`**, que o parser tem de conhecer:

```
untrusted comment: <texto livre>
<base64>            → algoritmo[2] ‖ idDaChave[8] ‖ assinatura[64]
trusted comment: <texto livre>
<base64>            → assinaturaGlobal[64], sobre (assinatura ‖ bytes do comentário confiável)
```

E o `.pub`: `untrusted comment:` e um base64 de `algoritmo[2] ‖ idDaChave[8] ‖ publica[32]`.

- [ ] **Step 1: Escrever o teste que falha**

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { analisarAssinatura, analisarChave, temEd25519, verificar } from "../verificar.js";

/** Um catálogo assinado de verdade, pelo binário do minisign. */
function assinado(conteudo) {
  const dir = mkdtempSync(join(tmpdir(), "minisig-"));
  const pub = join(dir, "t.pub");
  const sec = join(dir, "t.key");
  const alvo = join(dir, "catalogo.json");
  execFileSync("minisign", ["-G", "-f", "-p", pub, "-s", sec], { input: "\n\n" });
  writeFileSync(alvo, conteudo);
  execFileSync("minisign", ["-S", "-l", "-s", sec, "-m", alvo, "-t", "catalogo"], { input: "\n" });
  return {
    bytes: readFileSync(alvo),
    assinatura: readFileSync(alvo + ".minisig", "utf-8"),
    chave: readFileSync(pub, "utf-8"),
  };
}

test("o ambiente tem Ed25519", async () => {
  assert.equal(await temEd25519(), true);
});

test("analisa uma chave pública do minisign", () => {
  const { chave } = assinado("{}");
  const c = analisarChave(chave);
  assert.equal(c.algoritmo, "Ed");
  assert.equal(c.publica.length, 32);
  assert.equal(c.idDaChave.length, 8);
});

test("analisa uma assinatura do minisign", () => {
  const { assinatura } = assinado("{}");
  const a = analisarAssinatura(assinatura);
  assert.equal(a.algoritmo, "Ed");
  assert.equal(a.assinatura.length, 64);
  assert.equal(a.assinaturaGlobal.length, 64);
  assert.equal(typeof a.comentarioConfiavel, "string");
});

test("um catálogo intacto é íntegro", async () => {
  const { bytes, assinatura, chave } = assinado('{"esquema":1,"mods":[]}');
  assert.deepEqual(await verificar(bytes, assinatura, chave), { integro: true });
});

test("um byte trocado derruba a integridade", async () => {
  const { assinatura, chave } = assinado('{"esquema":1,"mods":[]}');
  const mexido = new TextEncoder().encode('{"esquema":2,"mods":[]}');
  const r = await verificar(mexido, assinatura, chave);
  assert.equal(r.integro, false);
  assert.equal(r.causa, "assinatura-nao-confere");
});

test("a assinatura de outra chave é recusada pelo id antes da matemática", async () => {
  // O id da chave existe justamente para dizer «esta assinatura não é para
  // esta chave» sem gastar uma verificação.
  const um = assinado("{}");
  const outro = assinado("{}");
  const r = await verificar(um.bytes, outro.assinatura, um.chave);
  assert.equal(r.integro, false);
  assert.equal(r.causa, "chave-diferente");
});

test("um comentário confiável adulterado é recusado", async () => {
  // A assinatura global cobre o comentário confiável; sem conferi-la, alguém
  // reescreve o comentário sem invalidar nada.
  const { bytes, assinatura, chave } = assinado("{}");
  const mexida = assinatura.replace(/trusted comment: .*/, "trusted comment: outra coisa");
  const r = await verificar(bytes, mexida, chave);
  assert.equal(r.integro, false);
  assert.equal(r.causa, "comentario-adulterado");
});

test("um .minisig truncado não explode", async () => {
  const { bytes, chave } = assinado("{}");
  const r = await verificar(bytes, "untrusted comment: só isto\n", chave);
  assert.equal(r.integro, false);
  assert.equal(r.causa, "assinatura-ilegivel");
});
```

- [ ] **Step 2: Rodar e ver falhar**

```bash
node --test site/testes/verificar.test.js
```

Esperado: `Cannot find module .../site/verificar.js`.

- [ ] **Step 3: Escrever a implementação**

```js
// SEELE MODS — conferir a assinatura do catálogo, no navegador.
//
// **Isto é integridade e nunca autenticidade.** Este arquivo, a chave e o
// catálogo vêm todos da mesma origem: quem adultera o catálogo adultera o
// verificador junto, e a chave junto — não há âncora. A conferência do
// cliente Rust vale porque a chave está compilada no app, e quem controla a
// CDN não a alcança; aqui não há equivalente.
//
// Ela fica porque pega duas coisas reais: corrupção acidental, e CDN mal
// configurada. A segunda é a falha que a doc chama de mais difícil de
// diagnosticar do desenho inteiro — um catálogo novo com uma assinatura
// velha em cache parece adulteração e não é. Este é o único lugar do produto
// onde ela pode ser vista e nomeada.
//
// A palavra na tela é «íntegro». Nunca «autêntico», nunca «verificado».

"use strict";

/** Formato do minisign: algoritmo[2] ‖ idDaChave[8] ‖ resto. */
const CABECALHO = 10;

function deBase64(texto) {
  const cru = atob(texto.trim());
  const bytes = new Uint8Array(cru.length);
  for (let i = 0; i < cru.length; i += 1) bytes[i] = cru.charCodeAt(i);
  return bytes;
}

function algoritmoDe(bytes) {
  return String.fromCharCode(bytes[0], bytes[1]);
}

function mesmoId(um, outro) {
  return um.length === outro.length && um.every((byte, i) => byte === outro[i]);
}

/** Lê um `.pub` do minisign. */
export function analisarChave(texto) {
  const linhas = texto.split("\n").filter((l) => l.trim() && !l.startsWith("untrusted comment:"));
  const cru = deBase64(linhas[0]);
  if (cru.length !== CABECALHO + 32) throw new Error("chave com tamanho inesperado");
  return {
    algoritmo: algoritmoDe(cru),
    idDaChave: cru.slice(2, CABECALHO),
    publica: cru.slice(CABECALHO),
  };
}

/** Lê um `.minisig` do minisign. */
export function analisarAssinatura(texto) {
  const linhas = texto.split("\n");
  const base64Assinatura = linhas[1];
  const linhaConfiavel = linhas[2] ?? "";
  const base64Global = linhas[3];
  if (!base64Assinatura || !base64Global || !linhaConfiavel.startsWith("trusted comment:")) {
    throw new Error("assinatura incompleta");
  }

  const cru = deBase64(base64Assinatura);
  if (cru.length !== CABECALHO + 64) throw new Error("assinatura com tamanho inesperado");

  return {
    algoritmo: algoritmoDe(cru),
    idDaChave: cru.slice(2, CABECALHO),
    assinatura: cru.slice(CABECALHO),
    comentarioConfiavel: linhaConfiavel.slice("trusted comment:".length).trim(),
    assinaturaGlobal: deBase64(base64Global),
  };
}

/** Se este navegador consegue conferir Ed25519. */
export async function temEd25519() {
  try {
    await crypto.subtle.importKey("raw", new Uint8Array(32), { name: "Ed25519" }, false, ["verify"]);
    return true;
  } catch {
    return false;
  }
}

async function confere(publica, assinatura, mensagem) {
  const chave = await crypto.subtle.importKey("raw", publica, { name: "Ed25519" }, false, ["verify"]);
  return crypto.subtle.verify({ name: "Ed25519" }, chave, assinatura, mensagem);
}

/**
 * Confere se `bytes` é o que a assinatura diz.
 *
 * Devolve `{ integro: true }` ou `{ integro: false, causa }`, e `causa` é um
 * identificador de lista fechada — a frase é do `frases.js`.
 */
export async function verificar(bytes, textoDaAssinatura, textoDaChave) {
  let chave;
  let assinatura;
  try {
    chave = analisarChave(textoDaChave);
    assinatura = analisarAssinatura(textoDaAssinatura);
  } catch {
    return { integro: false, causa: "assinatura-ilegivel" };
  }

  // O id da chave existe para dizer «esta assinatura não é para esta chave»
  // sem gastar uma verificação — e para nomear a causa com precisão.
  if (!mesmoId(chave.idDaChave, assinatura.idDaChave)) {
    return { integro: false, causa: "chave-diferente" };
  }

  // `Ed` é o modo legado, que assina os bytes crus. `ED` seria pré-hasheado
  // com BLAKE2b, que o WebCrypto não tem — e `gerar.py` assina em legado
  // porque o catálogo é pequeno, não por causa daqui.
  if (assinatura.algoritmo !== "Ed") {
    return { integro: false, causa: "assinatura-ilegivel" };
  }

  if (!(await confere(chave.publica, assinatura.assinatura, bytes))) {
    return { integro: false, causa: "assinatura-nao-confere" };
  }

  // A assinatura global cobre o comentário confiável. Sem conferi-la, alguém
  // reescreve o comentário sem invalidar nada — e o comentário é o que uma
  // pessoa lê para saber o que foi assinado.
  const comentario = new TextEncoder().encode(assinatura.comentarioConfiavel);
  const juntos = new Uint8Array(assinatura.assinatura.length + comentario.length);
  juntos.set(assinatura.assinatura, 0);
  juntos.set(comentario, assinatura.assinatura.length);
  if (!(await confere(chave.publica, assinatura.assinaturaGlobal, juntos))) {
    return { integro: false, causa: "comentario-adulterado" };
  }

  return { integro: true };
}
```

- [ ] **Step 4: Rodar e ver passar**

```bash
node --test site/testes/verificar.test.js
```

Esperado: `# pass 8`. Se `chave-diferente` falhar, confirme que o `atob` global existe no Node 24 — existe desde o 16.

- [ ] **Step 5: Commit**

```bash
git add site/verificar.js site/testes/verificar.test.js
git commit -m "verificar.js: minisign no navegador, e é integridade

Verificador, chave e catálogo vêm da mesma origem: não há âncora, então
isto nunca é autenticidade. Fica porque pega CDN mal configurada, que a doc
chama da falha mais difícil de diagnosticar do desenho."
```

---

### Task 12: `catalogo.js` — filtrar, ordenar, buscar, cruzar

**Files:**
- Create: `site/catalogo.js`
- Test: `site/testes/catalogo.test.js`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `versaoMaisRecente(mod) -> object`
  - `cruzarRevogacoes(mods, revogacoes) -> mods` — acrescenta `revogada` a cada versão e `temRevogada` ao mod
  - `filtrar(mods, { nivel, api, busca }) -> mods`
  - `ordenar(mods, ordem) -> mods` — ordens `"recentes"`, `"nome"`, `"nivel"`
  - `produtoRevogado(revogacoes, versao) -> object | null`
  - `ORDENS`

**A busca é local, e é o ADR inteiro.** *«Com API, o indexador aprende cada termo que alguém digitou; com catálogo, aprende que alguém buscou o catálogo.»* Se alguma vez esta função virar um `fetch`, a propriedade morreu.

- [ ] **Step 1: Escrever o teste que falha**

```js
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  cruzarRevogacoes, filtrar, ordenar, produtoRevogado, versaoMaisRecente,
} from "../catalogo.js";

const MODS = [
  {
    id: "juli/cinza-frio", autor: "juli", nome: "cinza-frio", titulo: "Cinza Frio",
    resumo: "Contraste alto, sem mexer no layout.", repo: "https://github.com/juli/x",
    nivel: "verificado", oficial: false, notas: [],
    versoes: [
      { versao: "2.0.0", api: 1, publicado_em: 1000, hash: "a".repeat(64), alcanca: [], arquivos: [] },
      { versao: "2.1.0", api: 1, publicado_em: 3000, hash: "b".repeat(64), alcanca: [], arquivos: [] },
    ],
  },
  {
    id: "kae/glifos-osso", autor: "kae", nome: "glifos-osso", titulo: "Glifos Osso",
    resumo: "Traço mais fino para telas densas.", repo: "https://github.com/kae/y",
    nivel: "oficial", oficial: true, notas: [],
    versoes: [{ versao: "3.0.0", api: 1, publicado_em: 2000, hash: "c".repeat(64), alcanca: [], arquivos: [] }],
  },
  {
    id: "rafa/cola", autor: "rafa", nome: "cola", titulo: "Cola no Canal",
    resumo: "Comandos de barra dentro da conversa.", repo: "https://github.com/rafa/z",
    nivel: "com-notas", oficial: false, notas: ["fala-com-terceiro"],
    versoes: [{ versao: "1.0.1", api: 2, publicado_em: 4000, hash: "d".repeat(64), alcanca: [], arquivos: [] }],
  },
];

const REVOGACOES = {
  esquema: 1, gerado_em: 5000,
  mods: [{ id: "juli/cinza-frio", versao: "2.0.0", motivo: "credencial-vazada", desde: 1500, corrigido_em: "2.1.0" }],
  versoes_do_produto: [{ versao: "0.11.2", motivo: "leitura-de-disco-fora-da-pasta", desde: 1500, corrigido_em: "0.11.3" }],
};

test("a versão mais recente é a de maior publicado_em", () => {
  assert.equal(versaoMaisRecente(MODS[0]).versao, "2.1.0");
});

test("cruzar marca a versão revogada e só ela", () => {
  const [cinza] = cruzarRevogacoes(MODS, REVOGACOES);
  assert.equal(cinza.versoes.find((v) => v.versao === "2.0.0").revogada.motivo, "credencial-vazada");
  assert.equal(cinza.versoes.find((v) => v.versao === "2.1.0").revogada, null);
});

test("cruzar não marca o mod vizinho", () => {
  const [, glifos] = cruzarRevogacoes(MODS, REVOGACOES);
  assert.equal(glifos.temRevogada, false);
  assert.equal(glifos.versoes[0].revogada, null);
});

test("cruzar não altera o original", () => {
  cruzarRevogacoes(MODS, REVOGACOES);
  assert.equal("revogada" in MODS[0].versoes[0], false);
});

test("filtrar por nível", () => {
  assert.deepEqual(filtrar(MODS, { nivel: "oficial" }).map((m) => m.id), ["kae/glifos-osso"]);
});

test("filtrar por api esconde o que o app recusaria", () => {
  // O cliente sabe qual API oferece e não mostra o que vai recusar.
  assert.deepEqual(filtrar(MODS, { api: 1 }).map((m) => m.id), ["juli/cinza-frio", "kae/glifos-osso"]);
});

test("buscar acha por título, id, autor e resumo", () => {
  assert.deepEqual(filtrar(MODS, { busca: "cinza" }).map((m) => m.id), ["juli/cinza-frio"]);
  assert.deepEqual(filtrar(MODS, { busca: "kae" }).map((m) => m.id), ["kae/glifos-osso"]);
  assert.deepEqual(filtrar(MODS, { busca: "barra" }).map((m) => m.id), ["rafa/cola"]);
});

test("buscar ignora caixa e acento", () => {
  // Quem digita «traco» tem de achar «traço»: exigir o acento é exigir que a
  // pessoa saiba como escrevemos, e a busca é dela.
  assert.deepEqual(filtrar(MODS, { busca: "TRACO" }).map((m) => m.id), ["kae/glifos-osso"]);
});

test("busca sem resultado devolve lista vazia e não tudo", () => {
  assert.deepEqual(filtrar(MODS, { busca: "zzz" }), []);
});

test("ordenar por recentes usa a versão mais recente", () => {
  assert.deepEqual(ordenar(MODS, "recentes").map((m) => m.id), ["rafa/cola", "juli/cinza-frio", "kae/glifos-osso"]);
});

test("ordenar por nome é alfabético pelo título", () => {
  assert.deepEqual(ordenar(MODS, "nome").map((m) => m.id), ["rafa/cola", "juli/cinza-frio", "kae/glifos-osso"]);
});

test("ordenar por nível põe oficial primeiro", () => {
  assert.deepEqual(ordenar(MODS, "nivel").map((m) => m.id), ["kae/glifos-osso", "juli/cinza-frio", "rafa/cola"]);
});

test("ordenar não altera o original", () => {
  const antes = MODS.map((m) => m.id);
  ordenar(MODS, "nome");
  assert.deepEqual(MODS.map((m) => m.id), antes);
});

test("produtoRevogado acha a versão do produto", () => {
  assert.equal(produtoRevogado(REVOGACOES, "0.11.2").corrigido_em, "0.11.3");
  assert.equal(produtoRevogado(REVOGACOES, "0.11.3"), null);
});
```

- [ ] **Step 2: Rodar e ver falhar**

```bash
node --test site/testes/catalogo.test.js
```

Esperado: `Cannot find module .../site/catalogo.js`.

- [ ] **Step 3: Escrever a implementação**

```js
// SEELE MODS — o que fazer com o catálogo depois de baixado.
//
// **Tudo aqui é local, e isso é o ADR 0044 inteiro:** «com API, o indexador
// aprende cada termo que alguém digitou; com catálogo, aprende que alguém
// buscou o catálogo». No dia em que alguma destas funções virar um `fetch`,
// a propriedade morreu — e não haverá aviso.

"use strict";

export const ORDENS = [
  { id: "recentes", nome: "Mais recentes" },
  { id: "nome", nome: "Nome" },
  { id: "nivel", nome: "Nível" },
];

/** `oficial` primeiro: é o único nível cuja prova somos nós. */
const PESO_DO_NIVEL = { oficial: 0, verificado: 1, "com-notas": 2 };

/** A versão que a tela mostra, e sobre a qual a decisão de instalar é feita. */
export function versaoMaisRecente(mod) {
  return mod.versoes.reduce((maior, atual) =>
    atual.publicado_em > maior.publicado_em ? atual : maior,
  );
}

/**
 * Sem acento e em minúscula, para comparar.
 *
 * Quem digita «traco» tem de achar «traço»: exigir o acento é exigir que a
 * pessoa saiba como nós escrevemos, e a busca é dela.
 */
function achatar(texto) {
  return texto.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

/**
 * Marca cada versão com a revogação dela, se houver.
 *
 * Devolve cópias: alterar o catálogo baixado faria a segunda chamada ver o
 * resultado da primeira, e o bug apareceria só ao trocar de tela.
 */
export function cruzarRevogacoes(mods, revogacoes) {
  const porChave = new Map(
    (revogacoes?.mods ?? []).map((r) => [`${r.id}@${r.versao}`, r]),
  );
  return mods.map((mod) => {
    const versoes = mod.versoes.map((v) => ({
      ...v,
      revogada: porChave.get(`${mod.id}@${v.versao}`) ?? null,
    }));
    return { ...mod, versoes, temRevogada: versoes.some((v) => v.revogada !== null) };
  });
}

/** A revogação da versão do produto de quem está lendo, se houver (ADR 0045). */
export function produtoRevogado(revogacoes, versao) {
  return (revogacoes?.versoes_do_produto ?? []).find((r) => r.versao === versao) ?? null;
}

/**
 * Filtra por nível, por API e por busca. Campos ausentes não filtram.
 *
 * O filtro de API existe porque é o que permite ao catálogo se filtrar: o
 * cliente sabe qual API oferece e não mostra o que vai recusar.
 */
export function filtrar(mods, { nivel, api, busca } = {}) {
  const termo = busca ? achatar(busca.trim()) : "";
  return mods.filter((mod) => {
    if (nivel && mod.nivel !== nivel) return false;
    if (api !== undefined && !mod.versoes.some((v) => v.api <= api)) return false;
    if (!termo) return true;
    const palheiro = achatar(
      [mod.titulo, mod.id, mod.autor, mod.nome, mod.resumo, mod.repo].join(" "),
    );
    return palheiro.includes(termo);
  });
}

/** Ordena uma cópia — a lista de origem é o catálogo baixado, e é de leitura. */
export function ordenar(mods, ordem) {
  const copia = [...mods];
  if (ordem === "nome") {
    return copia.sort((a, b) => a.titulo.localeCompare(b.titulo, "pt-BR"));
  }
  if (ordem === "nivel") {
    return copia.sort(
      (a, b) =>
        (PESO_DO_NIVEL[a.nivel] ?? 9) - (PESO_DO_NIVEL[b.nivel] ?? 9) ||
        a.titulo.localeCompare(b.titulo, "pt-BR"),
    );
  }
  return copia.sort(
    (a, b) => versaoMaisRecente(b).publicado_em - versaoMaisRecente(a).publicado_em,
  );
}
```

- [ ] **Step 4: Rodar e ver passar**

```bash
node --test site/testes/catalogo.test.js
```

Esperado: `# pass 14`.

- [ ] **Step 5: Commit**

```bash
git add site/catalogo.js site/testes/catalogo.test.js
git commit -m "catalogo.js: filtrar, ordenar e buscar, tudo local

A busca local é o ADR 0044 inteiro. No dia em que alguma destas funções
virar um fetch, a propriedade morre sem aviso."
```

---

### Task 13: `rotas.js`

**Files:**
- Create: `site/rotas.js`
- Test: `site/testes/rotas.test.js`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `analisar(hash) -> { tela, id }` — telas `"catalogo"`, `"mod"`, `"revogacoes"`, `"publicar"`
  - `paraHash({ tela, id }) -> string`

- [ ] **Step 1: Escrever o teste que falha**

```js
import { test } from "node:test";
import assert from "node:assert/strict";

import { analisar, paraHash } from "../rotas.js";

test("vazio é o catálogo", () => {
  assert.deepEqual(analisar(""), { tela: "catalogo", id: null });
  assert.deepEqual(analisar("#/"), { tela: "catalogo", id: null });
});

test("as três telas sem id", () => {
  assert.equal(analisar("#/revogacoes").tela, "revogacoes");
  assert.equal(analisar("#/publicar").tela, "publicar");
});

test("a tela de um mod carrega autor/nome", () => {
  assert.deepEqual(analisar("#/mod/juli/cinza-frio"), { tela: "mod", id: "juli/cinza-frio" });
});

test("rota desconhecida cai no catálogo em vez de tela branca", () => {
  assert.deepEqual(analisar("#/nao-existe"), { tela: "catalogo", id: null });
});

test("um mod sem id completo cai no catálogo", () => {
  assert.deepEqual(analisar("#/mod/juli"), { tela: "catalogo", id: null });
});

test("ida e volta preserva a rota", () => {
  for (const rota of [
    { tela: "catalogo", id: null },
    { tela: "revogacoes", id: null },
    { tela: "publicar", id: null },
    { tela: "mod", id: "juli/cinza-frio" },
  ]) {
    assert.deepEqual(analisar(paraHash(rota)), rota);
  }
});

test("um id com caractere de caminho não escapa da rota", () => {
  // O id é `[a-z0-9-]+/[a-z0-9-]+` por construção; qualquer coisa fora disso
  // vem de uma URL digitada à mão e não pode virar uma terceira barra.
  assert.deepEqual(analisar("#/mod/a/b/c"), { tela: "catalogo", id: null });
});
```

- [ ] **Step 2: Rodar e ver falhar**

```bash
node --test site/testes/rotas.test.js
```

Esperado: `Cannot find module .../site/rotas.js`.

- [ ] **Step 3: Escrever a implementação**

```js
// SEELE MODS — a rota mora no fragmento, e não no caminho.
//
// Fragmento porque o Pages serve arquivos parados: um caminho de verdade
// exigiria uma regra de reescrita no servidor, e a regra é justamente que
// não há servidor com regras.

"use strict";

const ID = /^[a-z0-9-]+\/[a-z0-9-]+$/;
const SEM_ID = new Set(["catalogo", "revogacoes", "publicar"]);
const CATALOGO = Object.freeze({ tela: "catalogo", id: null });

/**
 * `#/mod/juli/cinza-frio` → `{ tela: "mod", id: "juli/cinza-frio" }`.
 *
 * Rota que não existe cai no catálogo, e não numa tela branca: quem chegou
 * por um link velho tem de ver alguma coisa que funcione.
 */
export function analisar(hash) {
  const partes = (hash || "").replace(/^#\/?/, "").split("/").filter(Boolean);
  if (partes.length === 0) return { ...CATALOGO };

  const [primeira, ...resto] = partes;
  if (primeira === "mod") {
    const id = resto.join("/");
    return ID.test(id) ? { tela: "mod", id } : { ...CATALOGO };
  }
  if (SEM_ID.has(primeira) && resto.length === 0) return { tela: primeira, id: null };
  return { ...CATALOGO };
}

/** O caminho inverso, para os botões escreverem `location.hash`. */
export function paraHash({ tela, id }) {
  if (tela === "mod" && id) return `#/mod/${id}`;
  if (tela === "catalogo") return "#/";
  return `#/${tela}`;
}
```

- [ ] **Step 4: Rodar e ver passar**

```bash
node --test site/testes/rotas.test.js
```

Esperado: `# pass 7`.

- [ ] **Step 5: Commit**

```bash
git add site/rotas.js site/testes/rotas.test.js
git commit -m "rotas.js: a rota mora no fragmento

Um caminho de verdade exigiria reescrita no servidor, e a regra é que não
há servidor com regras. Rota desconhecida cai no catálogo, não em branco."
```

---

### Task 14: `index.html`, `tokens.css`, `fontes.css`, `estilo.css`

**Files:**
- Create: `site/index.html`, `site/tokens.css`, `site/fontes.css`, `site/estilo.css`
- Create: `site/fontes/LEIA.md`

**Interfaces:**
- Consumes: nada.
- Produces: a casca que `tela.js` preenche. IDs que a Task 15 usa: `#topo`, `#busca`, `#aba-catalogo`, `#aba-revogacoes`, `#aba-publicar`, `#aviso`, `#corpo`, `#selo-integridade`.

**Copie `tokens.css` e `fontes.css` do projeto de design sem alterar uma linha.** Eles são a paleta congelada em M0.12 e a procedência das três faces; qualquer edição aqui é uma segunda fonte da verdade.

- [ ] **Step 1: Copiar `tokens.css` e `fontes.css`**

Do projeto de design `c5408ba4-7257-4641-88eb-f62b2b67ef4c`, arquivos `tokens.css` e `fontes.css`, para `site/`. Sem editar.

Confira que os nomes que o `estilo.css` usa existem:

```bash
grep -c "seele-negro-absoluto\|seele-osso\|seele-laranja-nerv\|seele-fosforo\|seele-vermelho-alerta\|seele-rotulo-painel\|seele-linha" site/tokens.css
```

Esperado: um número ≥ 7.

- [ ] **Step 2: Escrever `site/fontes/LEIA.md`**

```markdown
# As oito faces

Copie de `SEELE/apps/seele-app/ui/fontes/`:

    saira-condensed-500.woff2  saira-condensed-700.woff2  saira-condensed-900.woff2
    ibm-plex-mono-400.woff2    ibm-plex-mono-500.woff2    ibm-plex-mono-600.woff2
    noto-sans-jp-700.woff2     noto-sans-jp-900.woff2

Junto com `LICENCA-*.txt` e `PROCEDENCIA.md`, que não são opcionais.

**Por que não vêm do Google Fonts.** O app não pode — a CSP é
`default-src 'self'`. O indexador poderia, e não deve: seria um segundo
terceiro vendo quem pediu o quê, num produto cujo argumento é não ter
serviço no meio.

Sem elas a página cai nos fallbacks e fica feia. Funciona.
```

- [ ] **Step 3: Escrever `site/estilo.css`**

```css
/* SEELE MODS — a pele, a partir de `MODS SEELE.dc.html`.
   Zero border-radius, zero sombra, todo espaçamento múltiplo da célula
   8px × 16px (tokens.css). Nenhuma cor literal: se um valor não estiver em
   tokens.css, ele não entra aqui. */

*, *::before, *::after { box-sizing: border-box; }

html, body {
  margin: 0;
  min-height: 100%;
  background: var(--seele-negro-absoluto);
  color: var(--seele-osso);
  font-family: var(--seele-mono);
  font-size: var(--seele-t-corpo);
  line-height: 22px;
  -webkit-font-smoothing: antialiased;
}

a { color: var(--seele-laranja-nerv); text-decoration: none; }
a:hover { color: var(--seele-osso); }
::selection { background: var(--seele-laranja-nerv); color: var(--seele-negro-absoluto); }

input {
  font: inherit;
  color: var(--seele-osso);
  background: var(--seele-negro-absoluto);
  border: var(--seele-b) solid var(--seele-linha-forte);
  padding: 9px 12px;
}
input:focus { outline: none; border-color: var(--seele-laranja-nerv); }
input::placeholder { color: var(--seele-osso-apagado); }
button:focus-visible { outline: var(--seele-b-forte) solid var(--seele-osso); outline-offset: 1px; }

::-webkit-scrollbar { width: 12px; height: 12px; }
::-webkit-scrollbar-track { background: var(--seele-negro-absoluto); }
::-webkit-scrollbar-thumb {
  background: var(--seele-linha-forte);
  border: 3px solid var(--seele-negro-absoluto);
}
::-webkit-scrollbar-thumb:hover { background: var(--seele-laranja-nerv); }

.pagina { min-height: 100vh; display: flex; flex-direction: column; }

/* ---- cabeçalho ---- */
.topo {
  position: sticky; top: 0; z-index: 6;
  display: flex; flex-wrap: wrap; align-items: center; gap: var(--seele-e2);
  padding: 12px clamp(20px, 4vw, 56px);
  background: var(--seele-negro-painel);
  border-bottom: var(--seele-b) solid var(--seele-linha);
}
.marca {
  display: flex; align-items: center; gap: 12px;
  padding: 0; background: none; border: 0; font: inherit; cursor: pointer;
}
.marca-seele, .marca-mods {
  font-family: var(--seele-display); font-size: 17px; letter-spacing: 0.08em;
}
.marca-seele { font-weight: 900; color: var(--seele-laranja-nerv); }
.marca-mods { font-weight: var(--seele-cartela); color: var(--seele-osso); }

.campo-busca {
  display: flex; align-items: center; gap: 9px;
  flex: 1 1 240px; min-width: 0; max-width: 420px;
  padding: 0 12px; min-height: 38px;
  border: var(--seele-b) solid var(--seele-linha-forte);
  background: var(--seele-negro-absoluto);
}
.campo-busca input { flex: 1; min-width: 0; border: none; background: none; padding: var(--seele-e1) 0; }

.abas {
  display: flex; gap: 1px; margin-left: auto; flex: 0 0 auto;
  background: var(--seele-linha-forte);
  border: var(--seele-b) solid var(--seele-linha-forte);
}
.aba {
  font: inherit; font-size: 11px; letter-spacing: 0.14em; padding: 9px 15px;
  cursor: pointer; border: none;
  color: var(--seele-osso-apagado); background: var(--seele-negro-painel);
}
.aba[aria-current="page"] { color: var(--seele-negro-absoluto); background: var(--seele-laranja-nerv); }

/* ---- o aviso de integridade ----
   Nunca «autêntico»: verificador, chave e catálogo vêm da mesma origem. */
.aviso {
  padding: 12px clamp(20px, 4vw, 56px);
  font-size: var(--seele-t-dado); line-height: 1.6;
  border-bottom: var(--seele-b) solid var(--seele-linha);
}
.aviso[data-estado="integro"] { color: var(--seele-fosforo); }
.aviso[data-estado="falhou"] {
  color: var(--seele-vermelho-alerta);
  background: var(--seele-vermelho-fraco);
  border-bottom-color: var(--seele-vermelho-alerta);
}
.aviso[data-estado="sem-conferir"] { color: var(--seele-sync-degradado); }
.aviso p { margin: 0; max-width: 72ch; text-wrap: pretty; }
.aviso .rodape { color: var(--seele-osso-apagado); font-size: 11px; margin-top: var(--seele-e1); }

/* ---- corpo ---- */
.corpo { flex: 1 1 auto; min-width: 0; }
.com-lateral { display: grid; grid-template-columns: 236px minmax(0, 1fr); align-items: start; }
@media (max-width: 720px) { .com-lateral { grid-template-columns: minmax(0, 1fr); } }

.lateral {
  position: sticky; top: var(--mods-topo, 63px);
  max-height: calc(100vh - var(--mods-topo, 63px)); overflow-y: auto;
  display: flex; flex-direction: column; gap: var(--seele-e3);
  padding: var(--seele-e3) 20px;
  border-right: var(--seele-b) solid var(--seele-linha);
  background: var(--seele-negro-painel);
}
.grupo { display: flex; flex-direction: column; gap: 10px; }
.rotulo {
  font-size: var(--seele-t-micro); letter-spacing: var(--seele-tracking-rotulo);
  text-transform: uppercase; color: var(--seele-rotulo-painel);
}
.filtro {
  display: flex; align-items: center; gap: var(--seele-e1); width: 100%;
  padding: var(--seele-e1) 10px; font: inherit; font-size: 12px; text-align: left;
  cursor: pointer; border: none; border-left: var(--seele-b-forte) solid transparent;
  background: none; color: var(--seele-osso-apagado);
}
.filtro[aria-pressed="true"] {
  border-left-color: var(--seele-laranja-nerv);
  background: var(--seele-laranja-fraco);
  color: var(--seele-laranja-nerv);
}
.filtro .conta { margin-left: auto; font-size: 10px; }

.painel {
  display: flex; flex-direction: column; gap: 28px;
  padding: 28px clamp(20px, 4vw, 44px) var(--seele-e6); min-width: 0;
}
h1 {
  margin: 0; font-family: var(--seele-display); font-weight: var(--seele-cartela);
  font-size: clamp(22px, 2.6vw, var(--seele-t-titulo));
  line-height: 1.15; letter-spacing: 0.04em; color: var(--seele-osso);
  text-wrap: pretty;
}
.resumo-da-lista { font-size: 12px; color: var(--seele-osso-apagado); }

/* ---- a grade de cartões ---- */
.grade { display: grid; grid-template-columns: repeat(auto-fill, minmax(288px, 1fr)); gap: var(--seele-e2); }
.cartao {
  display: flex; flex-direction: column; min-width: 0;
  background: var(--seele-negro-painel);
  box-shadow: 0 0 0 1px var(--seele-linha);
}
.cartao-abrir {
  display: flex; flex-direction: column; gap: 10px; padding: var(--seele-e2);
  font: inherit; text-align: left; background: none; border: 0; cursor: pointer; min-width: 0;
}
.cartao-titulo {
  font-family: var(--seele-display); font-weight: var(--seele-cartela);
  font-size: 17px; line-height: 1.1; letter-spacing: 0.04em; color: var(--seele-osso);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.cartao-repo, .cartao-resumo { color: var(--seele-osso-apagado); }
.cartao-repo { font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cartao-resumo { font-size: 12px; line-height: 1.55; text-wrap: pretty; }

.selo {
  flex: 0 0 auto; padding: 3px var(--seele-e1);
  font-size: 8px; letter-spacing: 0.14em; white-space: nowrap;
  border: var(--seele-b) solid currentColor;
}
.selo[data-nivel="oficial"] { color: var(--seele-laranja-nerv); }
.selo[data-nivel="verificado"] { color: var(--seele-fosforo); }
.selo[data-nivel="com-notas"] { color: var(--seele-sync-degradado); }
.selo[data-nivel="revogada"] { color: var(--seele-vermelho-alerta); }

/* Os dois números: versão e idade. Nunca estrelas nem downloads — não os
   medimos, e um número que não medimos é um número inventado. */
.numeros {
  display: flex; align-items: baseline; gap: var(--seele-e2);
  padding-top: 10px; border-top: var(--seele-b) solid var(--seele-linha);
}
.numero {
  font-family: var(--seele-display); font-weight: var(--seele-cartela);
  font-size: 15px; line-height: 1; color: var(--seele-osso);
  font-variant-numeric: tabular-nums;
}
.numero-rotulo {
  font-size: var(--seele-t-micro); letter-spacing: 0.14em; color: var(--seele-rotulo-painel);
}

/* ---- detalhe ---- */
.ficha { margin: 0; display: flex; flex-direction: column; }
.ficha-linha {
  display: flex; align-items: baseline; justify-content: space-between; gap: var(--seele-e2);
  padding: 12px 20px; border-bottom: var(--seele-b) solid var(--seele-linha);
}
.ficha dt {
  font-size: var(--seele-t-micro); letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--seele-rotulo-painel); flex: 0 0 auto;
}
.ficha dd { margin: 0; font-size: 12px; text-align: right; overflow-wrap: anywhere; min-width: 0; }

/* O hash inteiro, selecionável: é o número que uma pessoa compara a olho. */
.hash {
  display: block; padding: 10px 12px;
  border: var(--seele-b) solid var(--seele-linha);
  background: var(--seele-negro-painel);
  font-size: var(--seele-t-dado); color: var(--seele-fosforo);
  overflow-wrap: anywhere; user-select: all;
}

.nota {
  display: flex; gap: 9px; font-size: 12px; line-height: 1.5;
  color: var(--seele-osso);
}
.nota::before { content: "—"; color: var(--seele-sync-degradado); flex: 0 0 auto; }

.tabela { width: 100%; border-collapse: collapse; font-size: 12px; }
.tabela th {
  text-align: left; font-size: var(--seele-t-micro); font-weight: 400;
  letter-spacing: 0.18em; text-transform: uppercase; color: var(--seele-rotulo-painel);
  padding: var(--seele-e1) 12px; border-bottom: var(--seele-b) solid var(--seele-linha-forte);
}
.tabela td { padding: 12px; border-bottom: var(--seele-b) solid var(--seele-linha); vertical-align: top; }
.rolagem { overflow-x: auto; }
.espaco { flex: 1; }

.vazio {
  margin: 0; padding: 40px; text-align: center;
  font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase;
  color: var(--seele-osso-apagado); box-shadow: 0 0 0 1px var(--seele-linha);
}

.passo {
  display: grid; grid-template-columns: 46px minmax(0, 1fr); gap: 18px;
  padding: 20px 0; border-top: var(--seele-b) solid var(--seele-linha);
}
.passo-n {
  font-family: var(--seele-display); font-weight: 900; font-size: 28px; line-height: 1;
  color: var(--seele-laranja-nerv);
}

.botao {
  display: inline-block; font: inherit; font-size: 12px; letter-spacing: 0.14em;
  padding: 10px var(--seele-e2); cursor: pointer;
  color: var(--seele-osso); background: none;
  border: var(--seele-b) solid var(--seele-linha-forte);
}
.botao-forte {
  color: var(--seele-negro-absoluto);
  background: var(--seele-laranja-nerv);
  border-color: var(--seele-laranja-nerv);
}

.rodape {
  display: flex; flex-wrap: wrap; align-items: center; gap: 20px;
  padding: var(--seele-e3) clamp(20px, 4vw, 56px);
  border-top: var(--seele-b) solid var(--seele-linha-forte);
  background: var(--seele-negro-painel); margin-top: auto;
  font-size: 11px; color: var(--seele-osso-apagado);
}

/* specs/07: movimento é diagnóstico, nunca decorativo. Não há transição
   nenhuma neste arquivo, e a ausência é a decisão. */
```

- [ ] **Step 4: Escrever `site/index.html`**

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>MODS SEELE</title>
<!-- Nenhum script externo, nenhuma folha externa, nenhum pixel. A CSP diz
     em voz alta o que o resto do produto já garantia por construção. -->
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'none'">
<link rel="stylesheet" href="fontes.css">
<link rel="stylesheet" href="tokens.css">
<link rel="stylesheet" href="estilo.css">
</head>
<body>
<div class="pagina">
  <header class="topo" id="topo">
    <button type="button" class="marca" data-ir="catalogo">
      <svg viewBox="0 0 96 96" width="26" height="26" role="img" aria-label="SEELE">
        <path d="M34 34L62 62" stroke="#EAE3CF" stroke-width="6"></path>
        <rect x="12" y="12" width="24" height="24" fill="#F2521F"></rect>
        <rect x="62" y="62" width="20" height="20" fill="none" stroke="#F2521F" stroke-width="6"></rect>
      </svg>
      <span><span class="marca-seele">SEELE</span> <span class="marca-mods">MODS</span></span>
    </button>

    <label class="campo-busca">
      <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="#908574" stroke-width="1.3" aria-hidden="true">
        <circle cx="7" cy="7" r="3.6"></circle><path d="M9.7 9.7L13 13"></path>
      </svg>
      <input id="busca" type="search" placeholder="buscar mods, autores, repositórios"
             spellcheck="false" autocomplete="off" aria-label="Buscar no catálogo">
    </label>

    <nav class="abas" aria-label="Seções">
      <button type="button" class="aba" id="aba-catalogo" data-ir="catalogo">CATÁLOGO</button>
      <button type="button" class="aba" id="aba-revogacoes" data-ir="revogacoes">REVOGAÇÕES</button>
      <button type="button" class="aba" id="aba-publicar" data-ir="publicar">PUBLICAR</button>
    </nav>
  </header>

  <div class="aviso" id="aviso" role="status" aria-live="polite"></div>

  <main class="corpo" id="corpo"></main>

  <footer class="rodape">
    <span>mods.seele.app.br</span>
    <span style="flex:1"></span>
    <a href="chave.pub">CHAVE PÚBLICA</a>
    <a href="catalogo.json">CATALOGO.JSON</a>
    <a href="revogacoes.json">REVOGACOES.JSON</a>
  </footer>
</div>
<script type="module" src="app.js"></script>
</body>
</html>
```

- [ ] **Step 5: Conferir que não há cor literal fora dos tokens**

```bash
grep -nE "#[0-9A-Fa-f]{6}" site/estilo.css && echo "ACHOU COR LITERAL — mova para tokens.css" || echo "limpo"
```

Esperado: `limpo`. As cores literais do `index.html` estão no SVG da marca, que é a marca desenhada e não uma superfície do app.

- [ ] **Step 6: Commit**

```bash
git add site/index.html site/estilo.css site/tokens.css site/fontes.css site/fontes/LEIA.md
git commit -m "A casca do site: tokens copiados, estilo derivado do design

Nenhuma cor literal no estilo.css: se um valor não está em tokens.css, ele
não entra. Zero raio, zero sombra, espaçamento em múltiplos da célula."
```

---

### Task 15: `tela.js` e `app.js` — desenhar e ligar

**Files:**
- Create: `site/tela.js`, `site/app.js`
- Test: `site/testes/tela.test.js` (só as funções puras que `tela.js` exporta)

**Interfaces:**
- Consumes: `catalogo.js`, `frases.js`, `rotas.js`, `verificar.js`.
- Produces: `desenhar(raiz, estado, acoes)`, `desenharAviso(no, integridade)`, `textoDaIdade(publicado_em, agora)`, `linhasDaFicha(mod, versao)`.

**`tela.js` é o único módulo que toca o DOM**, e é por isso que ele é o único sem teste de DOM: um teste desses exigiria a dependência de build que este desenho existe para não ter. O que ele exporta de puro — a idade em texto e as linhas da ficha — é testado.

- [ ] **Step 1: Escrever o teste das funções puras**

```js
import { test } from "node:test";
import assert from "node:assert/strict";

import { linhasDaFicha, textoDaIdade } from "../tela.js";

const AGORA = 1_757_000_000;

test("idade em dias, horas e agora mesmo", () => {
  assert.equal(textoDaIdade(AGORA, AGORA), "agora");
  assert.equal(textoDaIdade(AGORA - 3600 * 5, AGORA), "há 5 h");
  assert.equal(textoDaIdade(AGORA - 86400 * 3, AGORA), "há 3 d");
  assert.equal(textoDaIdade(AGORA - 86400 * 400, AGORA), "há 1 a");
});

test("a idade nunca é negativa quando o relógio local atrasa", () => {
  // O `gerado_em` vem do catálogo e o `agora` do relógio de quem lê. Um
  // relógio atrasado produziria «há -2 d», que parece defeito nosso.
  assert.equal(textoDaIdade(AGORA + 86400, AGORA), "agora");
});

test("a ficha traz versão, api, hash inteiro e o commit inteiro", () => {
  const mod = { commit: "a".repeat(40), nivel: "verificado", notas: [] };
  const versao = { versao: "2.1.0", api: 1, hash: "b".repeat(64), publicado_em: AGORA, arquivos: ["mod.json"] };
  const linhas = linhasDaFicha(mod, versao);
  const porRotulo = Object.fromEntries(linhas.map((l) => [l.rotulo, l.valor]));

  assert.equal(porRotulo["VERSÃO"], "2.1.0");
  assert.equal(porRotulo["API"], "1");
  // Inteiros: o hash é o que uma pessoa compara a olho, e um commit
  // abreviado colide.
  assert.equal(porRotulo["HASH DO CONTEÚDO"], "b".repeat(64));
  assert.equal(porRotulo["COMMIT AVALIADO"], "a".repeat(40));
});

test("a ficha nunca traz estrelas nem downloads", () => {
  const mod = { commit: "a".repeat(40), nivel: "verificado", notas: [] };
  const versao = { versao: "1.0.0", api: 1, hash: "c".repeat(64), publicado_em: AGORA, arquivos: [] };
  const rotulos = linhasDaFicha(mod, versao).map((l) => l.rotulo).join(" ");
  assert.ok(!/ESTRELA|BAIXAD|DOWNLOAD/.test(rotulos), "não medimos isso");
});
```

- [ ] **Step 2: Rodar e ver falhar**

```bash
node --test site/testes/tela.test.js
```

Esperado: `Cannot find module .../site/tela.js`.

- [ ] **Step 3: Escrever `site/tela.js`**

```js
// SEELE MODS — o único módulo que toca o DOM.
//
// É o único de propósito: os outros cinco são funções puras testáveis com
// `node --test`, e um teste de DOM aqui exigiria a dependência de build que
// este desenho existe para não ter.
//
// Tudo é montado com `textContent` e `createElement`. Nenhum `innerHTML`
// com dado do catálogo: o catálogo é assinado, mas «assinado» não é
// «inofensivo», e o dia em que alguém servir um catálogo não assinado para
// depurar é o dia em que isso importaria.

"use strict";

import { ORDENS, versaoMaisRecente } from "./catalogo.js";
import { frase } from "./frases.js";

const NIVEIS_DA_LATERAL = ["oficial", "verificado", "com-notas"];

function elemento(etiqueta, classe, texto) {
  const no = document.createElement(etiqueta);
  if (classe) no.className = classe;
  if (texto !== undefined) no.textContent = texto;
  return no;
}

/**
 * Há quanto tempo, em texto curto.
 *
 * Nunca negativo: `publicado_em` vem do catálogo e `agora` do relógio de
 * quem lê, e um relógio atrasado produziria «há -2 d» — que parece defeito
 * nosso e não do relógio.
 */
export function textoDaIdade(publicado_em, agora) {
  const segundos = Math.max(0, agora - publicado_em);
  if (segundos < 3600) return "agora";
  if (segundos < 86400) return `há ${Math.floor(segundos / 3600)} h`;
  const dias = Math.floor(segundos / 86400);
  if (dias < 365) return `há ${dias} d`;
  return `há ${Math.floor(dias / 365)} a`;
}

/**
 * A ficha técnica de uma versão.
 *
 * O hash e o commit saem **inteiros**: o primeiro é o número que uma pessoa
 * compara a olho com o que o app mostra, e o segundo abreviado colide.
 *
 * Não há estrelas nem downloads. Não os medimos — e o índice não coleta
 * nada, que é metade do argumento de ele ser arquivo parado.
 */
export function linhasDaFicha(mod, versao) {
  return [
    { rotulo: "VERSÃO", valor: versao.versao },
    { rotulo: "API", valor: String(versao.api) },
    { rotulo: "ARQUIVOS", valor: String(versao.arquivos.length) },
    { rotulo: "NÍVEL", valor: frase("niveis", mod.nivel) },
    { rotulo: "HASH DO CONTEÚDO", valor: versao.hash, mono: true },
    { rotulo: "COMMIT AVALIADO", valor: mod.commit, mono: true },
  ];
}

function selo(nivel) {
  const no = elemento("span", "selo", frase("niveis", nivel).toUpperCase());
  no.dataset.nivel = nivel;
  return no;
}

function cartao(mod, agora, aoAbrir) {
  const raiz = elemento("article", "cartao");
  const botao = elemento("button", "cartao-abrir");
  botao.type = "button";
  botao.addEventListener("click", () => aoAbrir(mod.id));

  const topo = elemento("span");
  topo.style.display = "flex";
  topo.style.gap = "10px";
  topo.style.alignItems = "flex-start";
  const nomes = elemento("span");
  nomes.style.flex = "1";
  nomes.style.minWidth = "0";
  nomes.append(
    elemento("span", "cartao-titulo", mod.titulo),
    elemento("span", "cartao-repo", mod.id),
  );
  topo.append(nomes, selo(mod.temRevogada ? "revogada" : mod.nivel));

  const recente = versaoMaisRecente(mod);
  const numeros = elemento("span", "numeros");
  numeros.append(
    elemento("span", "numero", recente.versao),
    elemento("span", "numero-rotulo", "VERSÃO"),
    elemento("span", "espaco"),
    elemento("span", "numero", textoDaIdade(recente.publicado_em, agora)),
    elemento("span", "numero-rotulo", "PUBLICADA"),
  );

  botao.append(topo, elemento("span", "cartao-resumo", mod.resumo), numeros);
  raiz.append(botao);
  return raiz;
}

function telaCatalogo(estado, acoes) {
  const raiz = elemento("div", "com-lateral");

  const lateral = elemento("aside", "lateral");
  const grupoNivel = elemento("div", "grupo");
  grupoNivel.append(elemento("span", "rotulo", "NÍVEL"));
  for (const nivel of [null, ...NIVEIS_DA_LATERAL]) {
    const botao = elemento("button", "filtro", nivel ? frase("niveis", nivel) : "Todos");
    botao.type = "button";
    botao.setAttribute("aria-pressed", String(estado.nivel === nivel));
    const conta = nivel
      ? estado.todos.filter((m) => m.nivel === nivel).length
      : estado.todos.length;
    botao.append(elemento("span", "conta", String(conta)));
    botao.addEventListener("click", () => acoes.filtrarNivel(nivel));
    grupoNivel.append(botao);
  }

  const grupoOrdem = elemento("div", "grupo");
  grupoOrdem.append(elemento("span", "rotulo", "ORDENAR"));
  for (const ordem of ORDENS) {
    const botao = elemento("button", "filtro", ordem.nome);
    botao.type = "button";
    botao.setAttribute("aria-pressed", String(estado.ordem === ordem.id));
    botao.addEventListener("click", () => acoes.ordenar(ordem.id));
    grupoOrdem.append(botao);
  }

  const explicacao = elemento(
    "p",
    "cartao-resumo",
    "O índice não tem cadastro e não coleta nada. Ele guarda o veredito da avaliação, o commit que foi avaliado, e o número que identifica os bytes.",
  );
  lateral.append(grupoNivel, grupoOrdem, explicacao);

  const painel = elemento("div", "painel");
  painel.append(elemento("h1", null, estado.nivel ? frase("niveis", estado.nivel) : "Mods da comunidade"));
  painel.append(
    elemento(
      "span",
      "resumo-da-lista",
      `${estado.lista.length} ${estado.lista.length === 1 ? "mod" : "mods"}`,
    ),
  );

  if (estado.lista.length === 0) {
    painel.append(elemento("p", "vazio", "NENHUM MOD BATE COM ESSA BUSCA"));
  } else {
    const grade = elemento("div", "grade");
    for (const mod of estado.lista) grade.append(cartao(mod, estado.agora, acoes.abrir));
    painel.append(grade);
  }

  raiz.append(lateral, painel);
  return raiz;
}

function telaMod(estado) {
  const mod = estado.lista.find((m) => m.id === estado.id) ?? estado.todos.find((m) => m.id === estado.id);
  const painel = elemento("div", "painel");
  if (!mod) {
    painel.append(elemento("p", "vazio", "ESSE MOD NÃO ESTÁ NO CATÁLOGO"));
    return painel;
  }

  const versao = versaoMaisRecente(mod);
  painel.append(elemento("h1", null, mod.titulo));
  painel.append(elemento("span", "resumo-da-lista", `${mod.id} · ${mod.repo}`));
  painel.append(elemento("p", "cartao-resumo", mod.resumo));

  // As notas vêm ANTES de tudo o que parece um botão de instalar: uma nota
  // que a pessoa lê depois de instalar não é uma nota.
  if (mod.notas.length > 0) {
    const bloco = elemento("section", "grupo");
    bloco.append(elemento("span", "rotulo", "O QUE A AVALIAÇÃO ACHOU DE INCOMUM"));
    for (const nota of mod.notas) bloco.append(elemento("p", "nota", frase("notas", nota)));
    painel.append(bloco);
  }

  const revogada = versao.revogada;
  if (revogada) {
    const bloco = elemento("section", "grupo");
    bloco.append(elemento("span", "rotulo", "ESTA VERSÃO FOI RETIRADA"));
    bloco.append(elemento("p", "cartao-resumo", frase("motivos", revogada.motivo)));
    if (revogada.corrigido_em) {
      bloco.append(elemento("p", "cartao-resumo", `Consertado na versão ${revogada.corrigido_em}.`));
    }
    painel.append(bloco);
  }

  const ficha = elemento("dl", "ficha");
  for (const linha of linhasDaFicha(mod, versao)) {
    const par = elemento("div", "ficha-linha");
    par.append(elemento("dt", null, linha.rotulo));
    par.append(elemento("dd", linha.mono ? "hash" : null, linha.valor));
    ficha.append(par);
  }
  painel.append(ficha);

  // O que o app de fato oferece: o id para digitar, e os caminhos imutáveis.
  // `seele://mod/<id>` não existe — aquele esquema é o convite de servidor.
  const comoInstalar = elemento("section", "grupo");
  comoInstalar.append(elemento("span", "rotulo", "COMO INSTALAR"));
  comoInstalar.append(
    elemento("p", "cartao-resumo", "No app, em Configurações · Mods, digite o identificador abaixo. O app baixa os arquivos, confere o hash e recusa se não bater."),
  );
  comoInstalar.append(elemento("code", "hash", mod.id));
  painel.append(comoInstalar);

  if (versao.alcanca.length > 0) {
    const alcance = elemento("section", "grupo");
    alcance.append(elemento("span", "rotulo", "O QUE ELE ALCANÇA"));
    for (const item of versao.alcanca) alcance.append(elemento("p", "nota", item));
    painel.append(alcance);
  }

  const arquivos = elemento("section", "grupo");
  arquivos.append(elemento("span", "rotulo", "OS ARQUIVOS DESTA VERSÃO"));
  const base = `mods/${mod.autor}/${mod.nome}/${versao.versao}/`;
  for (const caminho of versao.arquivos) {
    const link = elemento("a", null, caminho);
    link.href = base + caminho;
    arquivos.append(link);
  }
  painel.append(arquivos);

  const repo = elemento("a", "botao", "ABRIR O REPOSITÓRIO →");
  repo.href = mod.repo;
  repo.rel = "noopener noreferrer";
  painel.append(repo);
  return painel;
}

function telaRevogacoes(estado) {
  const painel = elemento("div", "painel");
  painel.append(elemento("h1", null, "Revogações"));
  painel.append(
    elemento("p", "cartao-resumo", "MODs retirados e versões do produto revogadas, na mesma lista — são a mesma peça. Uma revogação impede instalar e impede hospedar; ela não apaga o que já está numa máquina."),
  );

  const linhas = [
    ...(estado.revogacoes?.mods ?? []).map((r) => ({ o_que: `${r.id} ${r.versao}`, ...r })),
    ...(estado.revogacoes?.versoes_do_produto ?? []).map((r) => ({ o_que: `SEELE ${r.versao}`, ...r })),
  ].sort((a, b) => b.desde - a.desde);

  if (linhas.length === 0) {
    painel.append(elemento("p", "vazio", "NADA FOI RETIRADO ATÉ AGORA"));
    return painel;
  }

  const rolagem = elemento("div", "rolagem");
  const tabela = elemento("table", "tabela");
  const cabecalho = elemento("tr");
  for (const titulo of ["O QUE", "POR QUÊ", "DESDE", "CONSERTADO EM"]) {
    cabecalho.append(elemento("th", null, titulo));
  }
  const thead = elemento("thead");
  thead.append(cabecalho);
  tabela.append(thead);

  const corpo = elemento("tbody");
  for (const linha of linhas) {
    const tr = elemento("tr");
    tr.append(elemento("td", null, linha.o_que));
    tr.append(elemento("td", null, frase("motivos", linha.motivo)));
    tr.append(elemento("td", null, new Date(linha.desde * 1000).toISOString().slice(0, 10)));
    tr.append(elemento("td", null, linha.corrigido_em ?? "não há versão corrigida"));
    corpo.append(tr);
  }
  tabela.append(corpo);
  rolagem.append(tabela);
  painel.append(rolagem);
  return painel;
}

function telaPublicar() {
  const painel = elemento("div", "painel");
  painel.append(elemento("h1", null, "O índice guarda o veredito e o commit, não o seu código."));
  painel.append(
    elemento("p", "cartao-resumo", "Você publica no seu repositório. O índice registra qual commit foi avaliado e o que a avaliação achou, e serve os bytes que saem daquele commit."),
  );

  // Dito com a precisão do adendo: a troca de humano por máquina só é
  // legítima se o teto for dito. Uma tela que deixasse alguém achar que
  // «verificado» significa «seguro» estaria mentindo sobre o teto.
  const teto = elemento("section", "grupo");
  teto.append(elemento("span", "rotulo", "O QUE A AVALIAÇÃO É, E O QUE ELA NÃO É"));
  teto.append(
    elemento("p", "cartao-resumo", "É um filtro, e não uma prova. Ela pega o óbvio — eval de string remota, exfiltração escancarada, ofuscação. Ela não pega o caminho sutil na décima função de um arquivo limpo. «Verificado» quer dizer que passou no filtro, e não que é seguro."),
  );
  painel.append(teto);

  const passos = [
    ["01", "PUBLIQUE NO SEU REPOSITÓRIO", "Público, porque é o que torna a avaliação conferível por qualquer pessoa. Não exigimos licença nomeada — o SEELE ainda não tem uma, e cobrar uma promessa que não fizemos seria desonesto."],
    ["02", "MANDE A URL", "O botão abaixo abre uma issue já preenchida. Não há formulário que escreva neste site: ele é hospedagem estática, e continuar assim é o que impede uma rota de busca de existir um dia."],
    ["03", "A AVALIAÇÃO FIXA UM COMMIT", "Verificado, publicado com notas, ou negado. Um push depois da aprovação não muda o que ninguém baixa — ele exige solicitação nova."],
  ];
  for (const [n, titulo, texto] of passos) {
    const passo = elemento("li", "passo");
    passo.append(elemento("span", "passo-n", n));
    const corpo = elemento("span", "grupo");
    corpo.append(elemento("span", "cartao-titulo", titulo), elemento("span", "cartao-resumo", texto));
    passo.append(corpo);
    painel.append(passo);
  }

  const abrir = elemento("a", "botao botao-forte", "ABRIR A SOLICITAÇÃO NO GITHUB →");
  abrir.href =
    "https://github.com/seele/SEELE-MODS-INDEXER/issues/new?labels=inclus%C3%A3o&title=" +
    encodeURIComponent("inclusão: <autor>/<nome>") +
    "&body=" +
    encodeURIComponent(
      "URL do repositório:\nCommit a avaliar:\nO que o mod faz:\nO que ele alcança (o `reach` do mod.json):\n",
    );
  abrir.rel = "noopener noreferrer";
  painel.append(abrir);
  return painel;
}

const TELAS = {
  catalogo: telaCatalogo,
  mod: telaMod,
  revogacoes: telaRevogacoes,
  publicar: telaPublicar,
};

/** Redesenha o corpo inteiro. */
export function desenhar(raiz, estado, acoes) {
  raiz.replaceChildren((TELAS[estado.tela] ?? telaCatalogo)(estado, acoes));

  for (const aba of document.querySelectorAll(".aba")) {
    const alvo = aba.dataset.ir;
    const ativa = alvo === estado.tela || (alvo === "catalogo" && estado.tela === "mod");
    if (ativa) aba.setAttribute("aria-current", "page");
    else aba.removeAttribute("aria-current");
  }
}

/** O aviso de integridade — a palavra é «íntegro», nunca «autêntico». */
export function desenharAviso(no, integridade) {
  no.dataset.estado = integridade.estado;
  no.replaceChildren();
  if (integridade.estado === "integro") {
    no.append(elemento("p", null, "Catálogo íntegro: os bytes que chegaram são os que foram assinados."));
  } else {
    no.append(elemento("p", null, frase("falhas", integridade.causa)));
  }
  no.append(
    elemento(
      "p",
      "rodape",
      "Esta conferência acontece na mesma origem que serve o catálogo, então ela pega corrupção e cache velho — não adulteração. A conferência que decide acontece dentro do app, com a chave que veio compilada nele.",
    ),
  );
}
```

- [ ] **Step 4: Rodar e ver passar**

```bash
node --test site/testes/tela.test.js
```

Esperado: `# pass 4`.

- [ ] **Step 5: Escrever `site/app.js`**

```js
// SEELE MODS — ligar os cinco.
//
// A ordem é a do «o que o cliente faz» da doc, e o site suporta isso e nada
// além: baixa o catálogo e a assinatura, confere, busca localmente, e lê as
// revogações. Nenhum passo precisa de mais do que arquivo parado.

"use strict";

import { cruzarRevogacoes, filtrar, ordenar } from "./catalogo.js";
import { analisar, paraHash } from "./rotas.js";
import { desenhar, desenharAviso } from "./tela.js";
import { temEd25519, verificar } from "./verificar.js";

const estado = {
  todos: [], lista: [], revogacoes: null,
  tela: "catalogo", id: null, nivel: null, ordem: "recentes", busca: "",
  agora: Math.floor(Date.now() / 1000),
};

const corpo = document.getElementById("corpo");
const aviso = document.getElementById("aviso");
const busca = document.getElementById("busca");
const topo = document.getElementById("topo");

const acoes = {
  abrir: (id) => { location.hash = paraHash({ tela: "mod", id }); },
  filtrarNivel: (nivel) => { estado.nivel = nivel; redesenhar(); },
  ordenar: (ordem) => { estado.ordem = ordem; redesenhar(); },
};

function redesenhar() {
  estado.lista = ordenar(
    filtrar(estado.todos, { nivel: estado.nivel, busca: estado.busca }),
    estado.ordem,
  );
  desenhar(corpo, estado, acoes);
}

/** A altura do cabeçalho vira a âncora das colunas grudentas. */
function medirTopo() {
  document.documentElement.style.setProperty("--mods-topo", `${topo.offsetHeight}px`);
}

async function baixar(nome) {
  const resposta = await fetch(nome, { cache: "no-store" });
  if (!resposta.ok) throw new Error(nome);
  return new Uint8Array(await resposta.arrayBuffer());
}

async function carregar() {
  let catalogoCru;
  let assinaturaCrua;
  let chaveCrua;
  try {
    [catalogoCru, assinaturaCrua, chaveCrua] = await Promise.all([
      baixar("catalogo.json"),
      baixar("catalogo.json.minisig"),
      baixar("chave.pub"),
    ]);
  } catch {
    // A falha que vai acontecer, e ela liga as duas coisas na mesma frase:
    // sem isto, não se entra em servidor com mod.
    desenharAviso(aviso, { estado: "falhou", causa: "sem-resposta" });
    return;
  }

  const decodificador = new TextDecoder();
  const catalogo = JSON.parse(decodificador.decode(catalogoCru));

  if (!(await temEd25519())) {
    // Diz que não conferiu, mostra o catálogo, e não finge.
    desenharAviso(aviso, { estado: "sem-conferir", causa: "sem-ed25519" });
  } else {
    const veredito = await verificar(
      catalogoCru,
      decodificador.decode(assinaturaCrua),
      decodificador.decode(chaveCrua),
    );
    desenharAviso(
      aviso,
      veredito.integro
        ? { estado: "integro" }
        : { estado: "falhou", causa: veredito.causa === "assinatura-ilegivel" || veredito.causa === "chave-diferente" ? "assinatura-nao-confere" : veredito.causa },
    );
    // Não há «tentar assim mesmo» (ADR 0029), e também não há tela em
    // branco: o catálogo é mostrado com o aviso vermelho por cima dele,
    // porque esconder tudo esconderia a informação que explica a falha.
  }

  try {
    estado.revogacoes = JSON.parse(decodificador.decode(await baixar("revogacoes.json")));
  } catch {
    estado.revogacoes = { mods: [], versoes_do_produto: [] };
  }

  estado.todos = cruzarRevogacoes(catalogo.mods, estado.revogacoes);
  redesenhar();
}

function aoTrocarRota() {
  const rota = analisar(location.hash);
  estado.tela = rota.tela;
  estado.id = rota.id;
  redesenhar();
}

for (const botao of document.querySelectorAll("[data-ir]")) {
  botao.addEventListener("click", () => {
    location.hash = paraHash({ tela: botao.dataset.ir, id: null });
  });
}

busca.addEventListener("input", () => {
  estado.busca = busca.value;
  // Se a busca acontecesse num servidor, o indexador aprenderia cada termo
  // digitado. Ela acontece aqui, sobre o que já foi baixado.
  if (estado.tela !== "catalogo") location.hash = paraHash({ tela: "catalogo", id: null });
  else redesenhar();
});

window.addEventListener("hashchange", aoTrocarRota);
new ResizeObserver(medirTopo).observe(topo);

aoTrocarRota();
carregar();
```

- [ ] **Step 6: Rodar a suíte inteira do JS**

```bash
node --test site/testes/
```

Esperado: `# pass 41`.

- [ ] **Step 7: Ver funcionando de verdade**

```bash
.venv/bin/pytest -q
.venv/bin/python -m ferramentas.gerar --chave ~/.minisign/mods-dev.key
cd publicado && python3 -m http.server 8788
```

Abra `http://localhost:8788`. Confira, nesta ordem:

1. o aviso no topo diz **íntegro** e nunca «autêntico»;
2. troque um byte de `publicado/catalogo.json` e recarregue — o aviso fica vermelho e fala em **cache**;
3. desfaça, recarregue, e confirme que voltou a verde;
4. a busca filtra sem nenhuma requisição nova (aba Network do navegador vazia enquanto você digita);
5. `#/revogacoes` e `#/publicar` abrem;
6. `#/nao-existe` cai no catálogo, e não numa tela branca.

- [ ] **Step 8: Commit**

```bash
git add site/tela.js site/app.js site/testes/tela.test.js
git commit -m "tela.js e app.js: desenhar e ligar

tela.js é o único módulo que toca o DOM, e por isso o único sem teste de
DOM — um teste desses exigiria o build que este desenho existe para não
ter. Tudo por textContent: assinado não é o mesmo que inofensivo."
```

---

## Ordem e paralelismo

As Tasks 1 e 2 são o caminho crítico: nada mais importa se o hash divergir. Depois delas, dois ramos independentes:

- **Python:** 3 → 4 → 5 → 6 → 7 → 8 → 9
- **JavaScript:** 10 → 11 → 12 → 13 → 14 → 15

A Task 9 precisa que `site/` exista, mas só como diretório — o Step 5 dela cria os vazios se necessário. Os dois ramos podem ser feitos em paralelo por agentes diferentes.

## Verificação final

```bash
.venv/bin/pytest -q          # 75 passed
node --test site/testes/     # 41 pass
cd /Users/dev-alexandre/SEELE && cargo test -p seele-proto --test vetores_de_hash
```

E a conferência que resume o desenho inteiro — os bytes servidos somam o número que o catálogo promete:

```bash
python3 - <<'PY'
import json, pathlib
import sys; sys.path.insert(0, ".")
from ferramentas.hash_conteudo import conteudo

pub = pathlib.Path("publicado")
catalogo = json.loads((pub / "catalogo.json").read_text(encoding="utf-8"))
for mod in catalogo["mods"]:
    for versao in mod["versoes"]:
        base = pub / "mods" / mod["autor"] / mod["nome"] / versao["versao"]
        arquivos = [(c, (base / c).read_bytes()) for c in versao["arquivos"]]
        real = conteudo(arquivos)
        estado = "ok" if real == versao["hash"] else f"DIVERGE (veio {real})"
        print(f'{mod["id"]} {versao["versao"]}: {estado}')
PY
```

Todo `ok`. Um `DIVERGE` aqui é exatamente o que o cliente veria como «adulterado».
