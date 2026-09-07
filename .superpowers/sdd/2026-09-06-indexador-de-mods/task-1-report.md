# Task 1 Report: `hash_conteudo.py`

## Status
**DONE**

## Commit Hash
`69113ae` - content_hash em Python, amarrado por vetores do Rust

## Test Results
```
8 passed in 0.01s
```

## Implementation Summary

Implementação concluída seguindo a ordem exata do brief:

1. **vetores-de-hash.json** — 6 vetores de teste copiados literalmente do brief, conferidos contra `seele_proto::mods::content_hash` compilado
2. **ferramentas/testes/test_hash_conteudo.py** — Suite completa com:
   - 6 testes parametrizados contra os vetores do Rust
   - Teste de ordem de entrada (arquivos em ordem diferente produzem mesmo hash)
   - Teste de contagem UTF-8 (caminhos com acentos contam bytes, não caracteres)
3. **ferramentas/hash_conteudo.py** — Implementação que replica `seele_proto::mods::content_hash`:
   - Ordenação pelos bytes UTF-8 do caminho (não por pontos de código str)
   - Contagem de arquivos no início (8 bytes big-endian)
   - Para cada arquivo: comprimento do caminho (8 bytes big-endian) + bytes UTF-8 do caminho + comprimento dos dados (8 bytes big-endian) + bytes dos dados
   - Hash SHA256 final em hexadecimal minúsculo

## Três Armadilhas Tratadas Corretamente

1. **Ordenação por bytes UTF-8**: `sorted(arquivos, key=lambda par: par[0].encode("utf-8"))` ordena pelos bytes do caminho, não pela str Python
2. **Comprimentos big-endian de 8 bytes**: `len(valor).to_bytes(8, "big")` garante ambiguidade zero
3. **Contagem de arquivos no início**: `digestor.update(len(ordenados).to_bytes(8, "big"))` antes de qualquer arquivo

## Concerns
Nenhum — todos os testes passam e a implementação segue exatamente a especificação do brief.

## Rodada de Correção 1

**O que mudou:** Apenas o comentário acima de `sorted()` em `ferramentas/hash_conteudo.py`.

**Por quê:** O comentário original afirmava que ordenar por ponto de código e ordenar por bytes UTF-8 «divergem a partir de U+0080», o que é falso. Ordenar UTF-8 byte a byte dá exatamente a mesma ordem que ordenar por ponto de código — é uma propriedade de projeto do UTF-8, não uma coincidência. Um «por quê» falso na função mais carregada do projeto é pior que nenhum, porque um dia alguém depura confiando nele.

**Comportamento:** Nenhuma mudança. O código continua idêntico; apenas a justificativa foi corrigida.

**Comando rodado:**
```bash
.venv/bin/pytest ferramentas/testes/test_hash_conteudo.py -v
```

**Resultado:**
```
============================= test session starts ==============================
platform darwin -- Python 3.14.5, pytest-9.1.1, pluggy-1.6.0 -- /Users/dev-alexandre/SEELE-MODS-INDEXER/.venv/bin/python3.14
cachedir: .pytest_cache
rootdir: /Users/dev-alexandre/SEELE-MODS-INDEXER
configfile: pyproject.toml
collecting ... collected 8 items

ferramentas/testes/test_hash_conteudo.py::test_bate_com_o_vetor_do_rust[vazio] PASSED [ 12%]
ferramentas/testes/test_hash_conteudo.py::test_bate_com_o_vetor_do_rust[um-arquivo] PASSED [ 25%]
ferramentas/testes/test_hash_conteudo.py::test_bate_com_o_vetor_do_rust[fronteira-ab-c] PASSED [ 37%]
ferramentas/testes/test_hash_conteudo.py::test_bate_com_o_vetor_do_rust[fronteira-a-bc] PASSED [ 50%]
ferramentas/testes/test_hash_conteudo.py::test_bate_com_o_vetor_do_rust[utf8-no-caminho] PASSED [ 62%]
ferramentas/testes/test_hash_conteudo.py::test_bate_com_o_vetor_do_rust[ordem-invertida] PASSED [ 75%]
ferramentas/testes/test_hash_conteudo.py::test_a_ordem_de_entrada_nao_importa PASSED [ 87%]
ferramentas/testes/test_hash_conteudo.py::test_caminho_com_utf8_conta_bytes_e_nao_caracteres PASSED [100%]

============================== 8 passed in 0.01s ===============================
```
