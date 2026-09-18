# Entrega — guia de criação de MODs

Página dedicada: https://mods.seele.app.br/guia/ .

## Conteúdo

24 capítulos e cerca de 9.500 palavras, divididos em guia passo a passo e referência técnica. Busca sem distinção de acentos, links diretos por capítulo, abas operáveis por teclado, cópia de código, Markdown para download, impressão com todos os capítulos e HTML legível sem JavaScript.

Referência: manifesto, ponte de pedidos, snapshot, escrita autenticada, revisão, persistência, migração, arquivos, uploads, eventos, rede, ciclo de vida, limites, diagnóstico, testes, privacidade e receitas. Distingue contratos declarados de bindings executáveis com fontes no código SEELE. Corrige a suposição de que todos os eventos/ações do arquivo v1 são funções expostas no runtime.

Exemplo Contador API 2: leitura, incremento, reset administrativo, revisão, persistência e descarregamento. ZIP e fontes individuais disponíveis na página. Testes de lógica em VM Node; não houve instalação desse exemplo novo no SEELE nativo nesta entrega.

## Arquivos principais

- `/Users/dev-alexandre/SEELE-MODS-INDEXER/docs/guia-criacao-mods.md` — fonte editorial com marcações de capítulos.
- `/Users/dev-alexandre/SEELE-MODS-INDEXER/site/guia/guia-criacao-mods.md` — Markdown convencional para distribuir ao leitor.
- `/Users/dev-alexandre/SEELE-MODS-INDEXER/ferramentas/gerar_guia.py` — gerador estático sem dependências.
- `/Users/dev-alexandre/SEELE-MODS-INDEXER/site/guia/` — HTML, CSS, JS e exemplo.
- `/Users/dev-alexandre/SEELE-MODS-INDEXER/publicado/guia/` — saída preparada para Cloudflare Pages.

## Atualização

```sh
cd /Users/dev-alexandre/SEELE-MODS-INDEXER
python3 ferramentas/gerar_guia.py
node --test site/testes/guia.test.js
.venv/bin/python -m pytest -q ferramentas/testes/test_guia.py
```

O gerador do catálogo já copia a árvore site/ para publicado/. Ao atualizar somente a documentação, regenere o guia e espelhe site/guia/ em publicado/guia/, além dos arquivos de navegação alterados. Não é necessário reavaliar MODs ou gerar assinaturas de catálogo para uma mudança puramente editorial. Catalogue os arquivos alterados no commit de publicação.

## Verificação

- 96 testes Node do site passaram (incluindo 5 novos).
- 196 testes Python do indexador passaram (incluindo 3 novos).
- Regeneração e testes focados repetidos após ajuste de âncoras.
- Navegador: troca de modo, busca acentuada, resultado vazio, abertura de resultado, cópia, links diretos/reload e setas nas abas.
- Layout conferido em 639, 1280 e 390 px. Corrigido transbordamento de navegação horizontal; sem overflow global nas larguras verificadas.
- Console sem erros na navegação verificada.
- Fontes e tokens nativos SEELE, espaçamento de 8 px, bordas retas, preferência de movimento reduzido.
- Catálogo, revogações, assinaturas e chave pública preservados byte a byte ao preparar a publicação.

As fontes técnicas foram conferidas no código local do SEELE commit 6a525d19c9967e0527be7d845ee16712b3f4d9e8. A publicação não altera instalações dos MODs nem regras do core.

## Publicação

Commit inicial: e592835. Push para main concluído; check Cloudflare Pages terminou com sucesso. A página pública /guia/ abriu com os 24 capítulos e os dois modos de consulta.

## Ajuste de padrão visual

Navegação do guia alinhada à direita, com o mesmo grupo de botões do catálogo (Criar um MOD, Catálogo, Revogações e Publicar). Download Markdown transferido para a ficha de material de apoio. Layout conferido visualmente; 5 testes Node e 3 testes Python do guia passaram após a alteração.

## Padrão definitivo dos controles

Conforme orientação final, o guia usa o CSS do próprio catálogo MODs (`../estilo.css`) e as classes `topo`, `marca`, `abas`, `aba`, `botao` e `botao-forte`. A tentativa de adotar SEELE-SITE foi descartada antes de publicar. Botões com borda, dimensões, fonte e espaçamento conferidos no navegador; troca de abas validada.
