"""O site de documentação (docs.seele.sh): montado do guia que existe, com todo link local resolvendo e nada do domínio antigo."""
import re
from pathlib import Path

import json
import os

import pytest

from ferramentas import gerar_docs

SEELE = os.environ.get('SEELE_RAIZ', '')
precisa_do_seele = pytest.mark.skipif(not os.path.isfile(os.path.join(SEELE, 'README.md')), reason='sem SEELE_RAIZ')


@precisa_do_seele
def test_o_site_de_docs_traz_o_guia_os_estilos_e_nenhum_link_local_quebrado(tmp_path):
    destino = gerar_docs.gerar(tmp_path / 'site-docs', SEELE)
    config = json.loads((destino / 'wrangler.jsonc').read_text(encoding='utf-8'))
    assert config['name'] == 'seele-docs'
    assert config['pages_build_output_dir'] == './'
    assert (destino / config['pages_build_output_dir']).resolve() == destino.resolve()
    for arquivo in ['index.html', 'mods/index.html', '_headers', 'casca.css', 'estilo.css', 'tokens.css', 'fontes.css']:
        assert (destino / arquivo).exists(), arquivo
    for pagina in [destino / 'index.html', destino / 'mods/index.html'] + [destino / p['slug'] / 'index.html' for p in gerar_docs.paginas()]:
        texto = pagina.read_text(encoding='utf-8')
        assert not __import__('re').search(r'href="https?://[a-z.]*seele\.app\.br', texto), f'{pagina} LIGA o domínio aposentado'
        for alvo in re.findall(r'(?:href|src)="([^"#?]+)(?:[?#][^"]*)?"', texto):
            if alvo.startswith(('https://', 'http://', 'mailto:')) or alvo in ('', './'):
                continue
            caminho = (pagina.parent / alvo).resolve()
            assert caminho.exists(), f'{pagina.relative_to(destino)}: o link local «{alvo}» não existe no site de docs'


def test_os_links_do_catalogo_no_guia_apontam_o_indexador():
    pagina = '<a href="../#/publicar">x</a><a href="../catalogo.json">c</a><a href="../chave.pub">k</a><a href="../">h</a>'
    feito = gerar_docs.para_o_indexador(pagina)
    assert 'href="https://mods.seele.sh/#/publicar"' in feito
    assert 'href="https://mods.seele.sh/catalogo.json"' in feito and 'href="https://mods.seele.sh/chave.pub"' in feito
    assert 'href="../"' in feito, 'o link para o início do site de docs mudou'


@precisa_do_seele
def test_toda_pagina_diz_de_onde_veio_e_se_e_atual_ou_historica(tmp_path):
    destino = gerar_docs.gerar(tmp_path / 'site-docs', SEELE)
    fontes = json.loads((destino / 'fontes.json').read_text(encoding='utf-8'))
    assert {f['slug'] for f in fontes} == {p['slug'] for p in gerar_docs.paginas()}
    for p in gerar_docs.paginas():
        texto = (destino / p['slug'] / 'index.html').read_text(encoding='utf-8')
        assert gerar_docs.ESTADOS[p['estado']][0] in texto and p['fonte'] in texto, p['slug']
    # nada de planejamento privado, evidência, quarentena ou log como fonte
    for f in fontes:
        assert not f['fonte'].startswith(('docs/superpowers', 'docs/evidencias', 'spikes/')) and 'incidente' not in f['fonte']
    # as seções pedidas: começar/instalar, conexão/voz/vídeo, identidade/permissões, MODs, arquitetura
    assert {s['titulo'] for s in gerar_docs.manifesto()['secoes']} >= {'Começar', 'Conexão, voz e vídeo', 'Identidade e permissões', 'MODs', 'Arquitetura'}
    # «Começar» só tem páginas ATUAIS: nenhum passo da 0.16 é o caminho de uso; as históricas ficam em «Referências»
    comecar = next(s for s in gerar_docs.manifesto()['secoes'] if s['titulo'] == 'Começar')
    assert comecar['paginas'] and all(p['estado'] == 'atual' for p in comecar['paginas']), comecar
    for s in gerar_docs.manifesto()['secoes']:
        if not s['titulo'].startswith('Referências'):
            assert all(p['estado'] != 'historico' for p in s['paginas']), f"página histórica fora de Referências: {s['titulo']}"
    # a proveniência: uma fonte alterada ou nova não é atribuída a um commit como se estivesse nele
    for f in fontes:
        assert f['situacao'] in ('igual', 'alterado', 'novo') and len(f['sha256']) == 64
        if f['situacao'] == 'novo':
            assert f['commit_base'] == ''


def test_um_link_entre_documentos_vira_a_pagina_daqui_ou_so_o_texto():
    slugs = {'docs/adr/0063-a-linha-2-fala-webrtc.md': 'webrtc'}
    feito = gerar_docs.preparar('## Título\n> citado\nVeja [o 0063](adr/0063-a-linha-2-fala-webrtc.md) e [outro](plano.md) e [fora](https://exemplo.br).', 'docs/x.md', slugs)
    assert '### Título' in feito and 'citado' in feito and '> ' not in feito
    assert '[o 0063](../webrtc/)' in feito and 'e outro e' in feito and '[fora](https://exemplo.br)' in feito


def test_a_condicao_vira_aviso_visivel_e_nao_some_com_os_comentarios():
    texto = '> <!-- CONDIÇÃO: medir no Windows -->\n> Isso foi medido no Mac e no Windows.\n\n<!-- um comentário qualquer -->Fim.'
    lista = gerar_docs.condicoes(texto)
    assert lista == ['medir no Windows']
    feito = gerar_docs.avisos_das_condicoes(gerar_docs.gerar_guia.render(gerar_docs.preparar(texto, 'docs/x.md', {})), lista)
    assert 'AINDA NÃO COMPROVADO' in feito and 'medir no Windows' in feito
    assert feito.index('AINDA NÃO COMPROVADO') < feito.index('Isso foi medido'), 'o aviso tem de vir antes da afirmação'
    assert 'um comentário qualquer' not in feito and '@@SEELE-CONDICAO' not in feito
    # uma marca que some no caminho é erro, e não um apagamento silencioso
    with pytest.raises(SystemExit):
        gerar_docs.avisos_das_condicoes('<p>nada</p>', lista)


@precisa_do_seele
def test_pagina_com_condicao_aberta_sai_rascunho_e_a_producao_recusa(tmp_path):
    abertas = {slug: c for slug, c in gerar_docs.abertas(Path(SEELE)).items() if c}
    if not abertas:
        pytest.skip('nenhuma condição aberta nas fontes agora')
    destino = gerar_docs.gerar(tmp_path / 'previa', SEELE)
    fontes = {f['slug']: f for f in json.loads((destino / 'fontes.json').read_text(encoding='utf-8'))}
    for slug, lista in abertas.items():
        pagina = (destino / slug / 'index.html').read_text(encoding='utf-8')
        assert gerar_docs.RASCUNHO[0] in pagina and gerar_docs.ESTADOS['atual'][0] + '.' not in pagina, slug
        assert pagina.count('AINDA NÃO COMPROVADO') == len(lista), slug
        assert fontes[slug]['condicoes_abertas'] == lista
    assert 'PRÉVIA' in (destino / 'index.html').read_text(encoding='utf-8')
    with pytest.raises(SystemExit, match='PRODUÇÃO recusa'):
        gerar_docs.gerar(tmp_path / 'producao', SEELE, producao=True)
