# Visual dos sites públicos

A referência desta atualização é o HTML exportado `SEELE — novo design.html`, fornecido em novembro de 2026. A implementação usa o desenho, com os dados e contratos atuais dos repositórios. As versões, capacidades e placeholders do protótipo não são fonte de dados do produto.

`site/visual.css` reúne as fontes locais, tokens `--web-*`, botões, painéis, cabeçalho e rodapé. Seu espelho em SEELE-SITE é `src/estilos/visual.css`; a única diferença deve ser o caminho das fontes (`fontes/` aqui, `/fontes/` no produto). Fundo `#050403`, texto `#EAE3CF`, acento `#F47732`, Inter no corpo, Inter Tight nos títulos e JetBrains Mono nos dados. As licenças e a procedência ficam junto das fontes.

`site/catalogo-visual.css` compõe catálogo e detalhe. `site/docs-visual.css` compõe o índice, os artigos e o guia interativo. As folhas anteriores permanecem como base dos componentes e estados existentes. Os geradores incluem as novas folhas; não edite apenas uma cópia gerada.

## Novos MODs

Os cartões e o detalhe são gerados por `site/tela.js` a partir do catálogo assinado. Título, resumo, versão, API, alcance, arquivos, hash, commit e avaliação vêm dos dados reais. As regras de avaliação por versão, revogação e descontinuação continuam em seus módulos originais.

`criarPrevia(mod, ampliada)` em `site/previa.js` é a única fábrica das ilustrações do catálogo e do detalhe. Qualquer MOD novo recebe automaticamente um monograma com seu título e identificador. Ele não precisa de alteração no site nem de uma imagem para ter uma apresentação consistente. As ilustrações conhecidas de Estilo, Mesa e Perfis são feitas no DOM/CSS, identificadas como ilustrações e separadas dos arquivos dos MODs. Para adicionar uma variante, reutilize o mesmo contêiner e preserve o fallback; não busque imagens ou código dentro de pacotes e não invente capacidades.

Os textos do catálogo entram no DOM por `textContent`. Mantenha essa regra; assinatura não torna HTML confiável. Não copie valores de hash, commit, versão ou métricas de protótipos para os componentes.

## Validar e preparar localmente

```sh
node --test site/testes/*.test.js
SEELE_RAIZ=/caminho/SEELE .venv/bin/python -m pytest ferramentas/testes -q
python3 -m ferramentas.gerar_guia
SEELE_RAIZ=/caminho/SEELE python3 -m ferramentas.gerar_docs /tmp/seele-docs-preview
```

O gerador completo do catálogo assina e materializa pacotes. Uma mudança visual não exige rodá-lo: atualize somente as cópias dos arquivos de apresentação em `publicado/`, preservando catálogo, assinaturas, revogações, chave e `publicado/mods/`. Não execute deploy como parte da validação visual.

A documentação mantém o estado e a proveniência de cada fonte. O guia atual descreve a 0.19; guias históricos conservam seus estados, conteúdo e proveniência. O índice aponta as notas da última release.
