"""Renderiza o guia estático e o Markdown para download, sem dependências externas.

Fonte: docs/guia-criacao-mods.md. Só aceita o subconjunto Markdown usado no guia;
HTML cru é escapado. A saída integra o copytree de site/ do gerador do catálogo.
"""
from pathlib import Path
import html
import re
import shutil
import zipfile

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'docs/guia-criacao-mods.md'
DEST = ROOT / 'site/guia'


def inline(text):
    pattern = r'`([^`]+)`|\[([^\]]+)\]\(([^\s)]+)\)|\*\*([^*]+)\*\*'
    result, last = [], 0
    for m in re.finditer(pattern, text):
        result.append(html.escape(text[last:m.start()]))
        if m[1] is not None:
            result.append('<code>' + html.escape(m[1]) + '</code>')
        elif m[2] is not None:
            href = m[3]
            if not (href.startswith(('https://', 'http://', '../', '#', 'exemplos/'))):
                raise ValueError('Link não permitido: ' + href)
            result.append('<a href="' + html.escape(href, quote=True) + '">' + html.escape(m[2]) + '</a>')
        else:
            result.append('<strong>' + html.escape(m[4]) + '</strong>')
        last = m.end()
    result.append(html.escape(text[last:]))
    return ''.join(result)


def render(text):
    lines, out, i = text.strip().splitlines(), [], 0
    while i < len(lines):
        line = lines[i]
        if not line.strip():
            i += 1
            continue
        if line.startswith('```'):
            lang = line[3:].strip()
            code = []
            i += 1
            while i < len(lines) and not lines[i].startswith('```'):
                code.append(lines[i]); i += 1
            if i == len(lines):
                raise ValueError('Bloco de código não terminado')
            out.append('<div class="codigo"><div class="codigo-topo"><span>' + html.escape(lang or 'texto') + '</span><button type="button" class="copiar botao">Copiar código</button></div><pre tabindex="0"><code>' + html.escape('\n'.join(code)) + '</code></pre></div>')
            i += 1
            continue
        if line.startswith('### '):
            out.append('<h3>' + inline(line[4:]) + '</h3>'); i += 1; continue
        if line.startswith('|'):
            rows = []
            while i < len(lines) and lines[i].startswith('|'):
                cells = [x.strip() for x in lines[i].strip().strip('|').split('|')]
                if not all(re.fullmatch(r':?-+:?', c) for c in cells): rows.append(cells)
                i += 1
            head = '<thead><tr>' + ''.join('<th scope="col">'+inline(c)+'</th>' for c in rows[0]) + '</tr></thead>'
            body = '<tbody>' + ''.join('<tr>' + ''.join('<td>'+inline(c)+'</td>' for c in row) + '</tr>' for row in rows[1:]) + '</tbody>'
            out.append('<div class="tabela" tabindex="0" role="region" aria-label="Tabela de referência">' + '<table>'+head+body+'</table></div>'); continue
        if re.match(r'^(- |\d+\. )', line):
            ordered = bool(re.match(r'^\d+\.', line)); tag = 'ol' if ordered else 'ul'; items = []
            pat = r'^\d+\. ' if ordered else r'^- '
            while i < len(lines) and re.match(pat, lines[i]):
                items.append('<li>'+inline(re.sub(pat,'',lines[i]))+'</li>'); i += 1
            out.append('<'+tag+'>'+''.join(items)+'</'+tag+'>'); continue
        para = [line]; i += 1
        while i < len(lines) and lines[i].strip() and not re.match(r'^(### |```|\||- |\d+\. )',lines[i]):
            para.append(lines[i]); i += 1
        out.append('<p>'+inline(' '.join(para))+'</p>')
    return '\n'.join(out)


def chapters():
    source = SOURCE.read_text()
    parts = re.split(r'^## \[(guia|referencia):([a-z-]+)\] (.+)\n', source, flags=re.M)
    return [(parts[i],parts[i+1],parts[i+2],parts[i+3]) for i in range(1,len(parts),4)]


def generate():
    DEST.mkdir(exist_ok=True)
    entries = chapters()
    panels = []
    for mode,label in [('guia','Guia passo a passo'),('referencia','Referência técnica')]:
        own = [c for c in entries if c[0] == mode]
        tabs = ''.join(f'<a role="tab" id="aba-{mode}-{slug}" aria-controls="artigo-{mode}-{slug}" href="#{mode}/{slug}"><span class="numero">{i:02d}</span>{html.escape(title)}</a>' for i,(_,slug,title,_) in enumerate(own,1))
        articles = []
        for i,(_,slug,title,body) in enumerate(own):
            prev = own[i-1] if i else None
            nxt = own[i+1] if i+1<len(own) else None
            prevlink = f'<a href="#{mode}/{prev[1]}">← {html.escape(prev[2])}</a>' if prev else '<span></span>'
            nextlink = f'<a href="#{mode}/{nxt[1]}">{html.escape(nxt[2])} →</a>' if nxt else '<a href="#referencia/visao">Consultar a referência →</a>' if mode=='guia' else '<a href="#guia/comecar">Voltar ao início →</a>'
            articles.append(f'<article role="tabpanel" tabindex="0" aria-labelledby="aba-{mode}-{slug}" id="artigo-{mode}-{slug}" data-mode="{mode}" data-slug="{slug}" data-title="{html.escape(title,quote=True)}"><span id="{mode}/{slug}"></span><p class="coordenada">{label} / {i+1:02d}</p><h2>{html.escape(title)}</h2>{render(body)}<nav class="proximo" aria-label="Próximos capítulos">{prevlink}{nextlink}</nav></article>')
        panels.append(f'<section id="painel-{mode}" role="tabpanel" aria-labelledby="modo-{mode}" class="documentacao"><aside class="sumario"><p class="coordenada">{label}</p><nav role="tablist" aria-orientation="vertical" aria-label="Capítulos de {label}">{tabs}</nav></aside><div class="artigos">'+''.join(articles)+'</div></section>')
    page = '''<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="Aprenda a criar MODs para o SEELE: guia passo a passo, API 2, pedidos, eventos, arquivos, permissões, exemplos e publicação.">
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'none'">
<title>Como criar MODs — SEELE</title><link rel="stylesheet" href="../fontes.css"><link rel="stylesheet" href="../tokens.css"><link rel="stylesheet" href="guia.css"><link rel="stylesheet" href="../estilo.css"></head>
<body><a class="pular" href="#conteudo">Pular para a documentação</a>
<header class="topo" id="topo"><a class="marca" href="../"><svg viewBox="0 0 96 96" width="26" height="26" role="img" aria-label="SEELE"><path d="M34 34L62 62" stroke="#EAE3CF" stroke-width="6"/><rect x="12" y="12" width="24" height="24" fill="#F2521F"/><rect x="62" y="62" width="20" height="20" fill="none" stroke="#F2521F" stroke-width="6"/></svg><span><span class="marca-seele">SEELE</span> <span class="marca-mods">MODS</span></span></a><nav class="abas" aria-label="Seções"><a class="aba" href="./" aria-current="page">CRIAR UM MOD</a><a class="aba" href="../">CATÁLOGO</a><a class="aba" href="../#/revogacoes">REVOGAÇÕES</a><a class="aba" href="../#/publicar">PUBLICAR</a></nav></header>
<div class="introducao"><div><p class="coordenada">Manual de criação / API 2</p><h1>Faça o SEELE<br><span>do seu jeito.</span></h1><p class="resumo">Da primeira ideia ao pacote publicado. Aprenda o caminho ou consulte o contrato exato de cada operação.</p></div><div class="guia-ficha"><span>REFERÊNCIA DO DESENVOLVEDOR</span><dl><div><dt>Manifesto</dt><dd>Schema 1</dd></div><div><dt>API de MOD</dt><dd>Versão 2</dd></div><div><dt>Revisão</dt><dd>18 SET 2026</dd></div><div><dt>Conteúdo</dt><dd>23 capítulos · exemplo instalável</dd></div></dl><a href="exemplos/contador.zip" download>Baixar MOD de exemplo ↓</a><a class="download" href="guia-criacao-mods.md" download>Baixar guia .md ↓</a></div></div>
<div class="barra-consulta"><div role="tablist" aria-label="Modo de leitura" class="modos"><button type="button" role="tab" class="botao botao-forte" id="modo-guia" aria-controls="painel-guia">Guia passo a passo</button><button type="button" role="tab" class="botao" id="modo-referencia" aria-controls="painel-referencia">Referência técnica</button></div><label class="busca"><span>Buscar no guia</span><input id="buscar-guia" type="search" placeholder="Ex.: upload, permissão, timeout" autocomplete="off"></label></div>
<main id="conteudo" tabindex="-1"><section id="resultados" aria-label="Resultados da busca" hidden><h2>Resultados</h2><p id="contagem" role="status"></p><div id="lista-resultados"></div><button type="button" id="limpar-busca" class="botao">Limpar busca</button></section>'''+''.join(panels)+'''</main>
<p class="status-copia" id="status-copia" role="status" aria-live="polite"></p><footer>SEELE MODS / Documentação técnica <a href="#referencia/fontes">Fontes e revisão</a><a href="guia-criacao-mods.md" download>Markdown completo</a></footer>
<noscript><p>JavaScript está desativado. O conteúdo completo permanece disponível abaixo dos índices. Busca e abas requerem JavaScript; você também pode baixar o Markdown.</p></noscript><script type="module" src="guia.js"></script></body></html>'''
    page = page.replace('23 capítulos',f'{len(entries)} capítulos')
    (DEST/'index.html').write_text(page)
    # A versão para download usa títulos Markdown convencionais.
    (DEST/'guia-criacao-mods.md').write_text(re.sub(r'^## \[(?:guia|referencia):[a-z-]+\] ', '## ', SOURCE.read_text(),flags=re.M))
    with zipfile.ZipFile(DEST/'exemplos/contador.zip','w',zipfile.ZIP_DEFLATED) as z:
        for rel in ['mod.json','cliente/main.js','servidor/main.js']:
            info=zipfile.ZipInfo(rel,date_time=(2026,9,18,0,0,0)); info.compress_type=zipfile.ZIP_DEFLATED
            z.writestr(info,(DEST/'exemplos/contador'/rel).read_bytes())
    print(f'{len(entries)} capítulos gerados em {DEST}')

if __name__ == '__main__':
    generate()
