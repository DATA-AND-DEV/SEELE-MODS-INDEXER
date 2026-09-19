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
        href = href.split('?', 1)[0]
        target = root / href
        if href in {'../chave.pub', '../catalogo.json', '../revogacoes.json'}:
            target = SOURCE.parents[1] / 'publicado/guia' / href
        assert target.exists(), href
    assert (root / 'exemplos/contador.zip').is_file()


def test_exemplo_zip_exato_e_manifesto_aceito_pela_api_atual():
    import zipfile
    from ferramentas.manifesto import ler, VERSAO_DA_API
    root = SOURCE.parents[1] / 'site/guia/exemplos'
    with zipfile.ZipFile(root / 'contador.zip') as zip_:
        assert sorted(zip_.namelist()) == ['cliente/main.js', 'mod.json', 'servidor/main.js']
        for name in zip_.namelist():
            assert zip_.read(name) == (root / 'contador' / name).read_bytes()
        assert ler(zip_.read('mod.json').decode()).api == VERSAO_DA_API
    assert 'SeeleUI.regiao' in SOURCE.read_text()
    assert 'SeeleUI.tema' in SOURCE.read_text()
    assert 'api-too-old' in SOURCE.read_text()
