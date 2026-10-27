import re
from pathlib import Path
from ferramentas.gerar_guia import chapters, render, inline, para_download, SOURCE

def test_documentation_topics_and_code_fences():
    entries = chapters()
    # 28 desde a API 6 (D-guia-1): o `referencia/api4` saiu, e entraram as
    # contribuições, os estilos, o tema do servidor e a linha do Servidor 0.15.
    assert len(entries) == 28
    assert len({(mode, slug) for mode, slug, _, _ in entries}) == 28
    assert {mode for mode, *_ in entries} == {'guia', 'referencia'}
    assert SOURCE.read_text().count('```') % 2 == 0
    for _, _, _, body in entries:
        assert render(body)

def test_renderer_escapes_markup_and_code():
    assert '&lt;script&gt;' in render('<script>alert(1)</script>')
    assert '&lt;img' in render('```html\n<img src=x>\n```')
    assert '<code>ctx.person</code>' == inline('`ctx.person`')
    # **Código dentro do negrito.** O negrito era escapado inteiro, e
    # «**o canal `0` quer dizer nenhum**» saía com as crases à vista.
    assert inline('**o canal `0` vale**') == '<strong>o canal <code>0</code> vale</strong>'
    assert inline('**a <b> fica**') == '<strong>a &lt;b&gt; fica</strong>'

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


def test_exemplo_zip_exato_e_manifesto_na_api_que_o_indexador_oferece():
    import zipfile
    from ferramentas.manifesto import ler, VERSAO_DA_API, APIS_ACEITAS
    root = SOURCE.parents[1] / 'site/guia/exemplos'
    with zipfile.ZipFile(root / 'contador.zip') as zip_:
        assert sorted(zip_.namelist()) == ['cliente/main.js', 'mod.json', 'servidor/main.js']
        for name in zip_.namelist():
            assert zip_.read(name) == (root / 'contador' / name).read_bytes()
        # **Da API que o indexador oferece, e não só aceita** (D-guia-1). Até a
        # API 5 bastava estar no conjunto: a 4 não tirou nada da 3, e um exemplo
        # da 3 rodava em todo app. A 6 é ruptura: o conjunto do indexador é a
        # união das duas linhas de servidor, e um exemplo da 3 continuava
        # aceito aqui enquanto o app 0.16 o recusava inteiro. Um guia público
        # cujo exemplo o app atual recusa ensina errado.
        #
        # **A 7 é alargamento, e não ruptura** (a 0.17). O app 0.17 executa a
        # 7 e a 6, e o 0.16, ainda em circulação, só a 6: o exemplo que roda
        # nos dois é o da 6, e **continua na 6 de propósito**, mesmo com o
        # guia da API 7 já escrito. A API oferecida é a 7; o exemplo é a
        # compatibilidade intencional.
        #
        # O indexador não tem um `APIS_POR_LINHA` próprio. Este é o do SEELE
        # (`seele_proto::mods::APIS_POR_LINHA`), e a conferência de que ele não
        # se afastou do indexador está logo abaixo: a união das linhas tem de
        # ser o `APIS_ACEITAS`, e o teto, a `VERSAO_DA_API`.
        apis_por_linha = {'2': (7, 6), '1': (6,), '0.15': (5, 4, 3)}
        assert set().union(*apis_por_linha.values()) == set(APIS_ACEITAS)
        assert max(max(v) for v in apis_por_linha.values()) == VERSAO_DA_API
        api = ler(zip_.read('mod.json').decode()).api
        assert api == 6
        assert api in apis_por_linha['1'] and api in apis_por_linha['2']
    fonte = SOURCE.read_text()
    for nome in ('SeeleUI.superficies.criar', 'SeeleUI.contribuicoes.registrar', 'SeeleUI.retrato',
                 'mundo.tema', 'mundo.avisar', 'api-too-old', 'tema-sem-metade-de-servidor'):
        assert nome in fonte, nome


def test_nenhum_codigo_do_guia_chama_o_que_a_api_6_tirou():
    """O texto pode dizer que a 6 tirou a região; um exemplo não pode usá-la.

    O guia da API 4 ensinava `SeeleUI.regiao`, `SeeleUI.cartoes` e
    `SeeleMods.snapshot` em todo bloco de código, e o app 0.16 recusa o pacote
    que os chama. A prosa que explica a ruptura e a tabela da linha 0.15 nomeiam
    os três; o código que alguém copia, não.
    """
    import re
    blocos = re.findall(r'^```[^\n]*\n(.*?)^```', SOURCE.read_text(), flags=re.M | re.S)
    assert len(blocos) > 20
    for bloco in blocos:
        for tirado in ('SeeleUI.regiao', 'SeeleUI.cartoes', 'snapshot('):
            assert tirado not in bloco, (tirado, bloco[:200])
    exemplo = SOURCE.parents[1] / 'site/guia/exemplos/contador'
    for arquivo in ('cliente/main.js', 'servidor/main.js'):
        codigo = (exemplo / arquivo).read_text()
        for tirado in ('SeeleUI.regiao', 'SeeleUI.cartoes', 'snapshot('):
            assert tirado not in codigo, (arquivo, tirado)


def test_o_download_tira_a_etiqueta_de_todo_capitulo():
    import re
    baixado = para_download(SOURCE.read_text())
    assert not re.findall(r'^## \[', baixado, flags=re.M)
    assert len(re.findall(r'^## ', baixado, flags=re.M)) == len(chapters())
