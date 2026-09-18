import re
from pathlib import Path
from ferramentas.gerar_guia import chapters, render, inline, SOURCE

def test_documentation_topics_and_code_fences():
    entries = chapters()
    assert len(entries) == 24
    assert len({(mode, slug) for mode, slug, _, _ in entries}) == 24
    assert {mode for mode, *_ in entries} == {'guia', 'referencia'}
    assert SOURCE.read_text().count('```') % 2 == 0
    for _, _, _, body in entries:
        assert render(body)

def test_renderer_escapes_markup_and_code():
    assert '&lt;script&gt;' in render('<script>alert(1)</script>')
    assert '&lt;img' in render('```html\n<img src=x>\n```')
    assert '<code>ctx.person</code>' == inline('`ctx.person`')

def test_generated_downloads_and_links_exist():
    root = SOURCE.parents[1] / 'site/guia'
    page = (root / 'index.html').read_text()
    for href in re.findall(r'href="([^"]+)"', page):
        if href.startswith(('https:', 'http:', '#')) or '#' in href:
            continue
        assert (root / href).exists(), href
    assert (root / 'exemplos/contador.zip').is_file()
