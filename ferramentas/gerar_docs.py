"""O site de documentação (docs.seele.sh), montado do que já existe, sem framework novo.

docs.seele.sh = a documentação do SEELE e dos MODs; mods.seele.sh = o indexador (o catálogo). O guia de MODs continua
sendo gerado por `gerar_guia.py` (em site/guia, a fonte única); aqui ele é COPIADO para /mods/ do site de docs, com as
folhas de estilo e as fontes do catálogo ao lado, e os links que eram do catálogo (`../catalogo.json`, `../#/…`) passam a
apontar o indexador. A documentação do SEELE vem do repositório SEELE (SEELE_RAIZ), curada em `docs_site.json`: o estado de cada página (ATUAL NA 0.17, DECISÃO ACEITA ou HISTÓRICA) é dito nela.

Uso: SEELE_RAIZ=<checkout do SEELE> python3 -m ferramentas.gerar_docs [destino]   (padrão: site-docs/). Não publica nada.
"""
from pathlib import Path
import hashlib
import html
import json
import os
import re
import shutil
import subprocess
import sys

from ferramentas import gerar_guia

RAIZ = Path(__file__).resolve().parents[1]
SITE = RAIZ / 'site'
INDEXADOR = 'https://mods.seele.sh'
COMPARTILHADOS = ['casca.css', 'estilo.css', 'tokens.css', 'fontes.css', 'fontes',
                  'favicon.ico', 'favicon.svg', 'apple-touch-icon.png']
CABECALHOS = """# docs.seele.sh: páginas estáticas da documentação. Sem catálogo e sem MOD servido daqui.
/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: no-referrer
  Content-Security-Policy: default-src 'self'; img-src 'self' data:; style-src 'self'; font-src 'self'; script-src 'self'; connect-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'

/fontes/*
  Cache-Control: public, max-age=31536000, immutable
"""


def para_o_indexador(pagina: str) -> str:
    """Os links do guia que eram do CATÁLOGO (relativos a site/) passam a apontar o indexador; os do próprio guia ficam."""
    pagina = re.sub(r'href="\.\./#/([^"]*)"', lambda m: f'href="{INDEXADOR}/#/{m[1]}"', pagina)
    for arquivo in ('catalogo.json', 'revogacoes.json', 'chave.pub'):
        pagina = pagina.replace(f'href="../{arquivo}"', f'href="{INDEXADOR}/{arquivo}"')
    return pagina


MANIFESTO = Path(__file__).with_name('docs_site.json')
ESTADOS = {
    'atual': ('ATUAL NA 0.17', 'Descreve a 0.17.'),
    'decisao': ('DECISÃO ACEITA', 'Uma decisão de arquitetura aceita; o texto é o da decisão, com a data dela.'),
    'historico': ('HISTÓRICO', 'Escrito antes da 0.17: pode descrever a linha 1 (a 0.16, QUIC) e os endereços antigos (seele.app.br), que serão aposentados.'),
}


# De onde veio o TEXTO que foi lido (o da árvore de trabalho): o último commit do arquivo e se o arquivo lido é igual a ele. Uma
# fonte alterada ou ainda sem commit NÃO é atribuída ao commit como se estivesse nele; o sha256 é sempre o do arquivo lido.
DIZ = {
    'igual': lambda c: f'igual ao commit {c[:12]}',
    'alterado': lambda c: f'ALTERADO na árvore de trabalho sobre o commit {c[:12]} (ainda sem commit)',
    'novo': lambda c: 'NOVO na árvore de trabalho (nunca teve commit)',
}


def proveniencia(raiz: Path, fonte: str) -> tuple[str, str]:
    commit = subprocess.run(['git', '-C', str(raiz), 'log', '-1', '--format=%H', '--', fonte], capture_output=True, text=True).stdout.strip()
    estado = subprocess.run(['git', '-C', str(raiz), 'status', '--porcelain', '--', fonte], capture_output=True, text=True).stdout.strip()
    if not commit or estado.startswith('??'):
        return '', 'novo'
    return commit, ('alterado' if estado else 'igual')


def manifesto() -> dict:
    return json.loads(MANIFESTO.read_text(encoding='utf-8'))


def paginas() -> list[dict]:
    return [p | {'secao': s['titulo']} for s in manifesto()['secoes'] for p in s['paginas']]


# Uma CONDIÇÃO (`<!-- CONDIÇÃO: … -->`, a convenção das notas de release) marca a afirmação que vem logo depois como AINDA NÃO
# COMPROVADA. Apagá-la com os outros comentários publicava a afirmação sem a ressalva («Isso foi medido no Mac e no Windows» sem ter
# sido): então ela vira um aviso visível no lugar, a página com condição aberta sai como RASCUNHO, e o build de produção recusa.
CONDICAO = re.compile(r'<!--\s*CONDI[ÇC][ÃA]O\s*:\s*(.*?)\s*-->', re.S | re.I)
MARCA_DA_CONDICAO = '@@SEELE-CONDICAO-{}@@'
RASCUNHO = ('RASCUNHO: COM CONDIÇÕES ABERTAS', 'Esta página tem afirmações que ainda não foram comprovadas, marcadas abaixo; ela não vai à produção assim.')


def condicoes(texto: str) -> list[str]:
    return [' '.join(c.split()) for c in CONDICAO.findall(texto)]


def avisos_das_condicoes(pagina_html: str, lista: list[str]) -> str:
    """Troca cada marca pelo aviso visível. Uma marca que sumiu no caminho é erro: a condição não pode cair em silêncio."""
    for i, condicao in enumerate(lista):
        marca = MARCA_DA_CONDICAO.format(i)
        aviso = (f'<aside class="painel aviso condicao" role="note"><p><strong>AINDA NÃO COMPROVADO.</strong> '
                 f'A afirmação logo abaixo depende disto, que ainda não foi medido: {html.escape(condicao)}</p></aside>')
        feito = re.sub(rf'<p>\s*{re.escape(marca)}\s*</p>', aviso, pagina_html)
        if feito == pagina_html:
            raise SystemExit(f'a condição {i} («{condicao[:60]}…») sumiu ao montar a página: ela não pode ser apagada em silêncio')
        pagina_html = feito
    return pagina_html


def preparar(texto: str, fonte: str, slugs: dict[str, str]) -> str:
    """O Markdown do repositório no subconjunto que `gerar_guia.render` lê: os títulos `#`/`##`/`####` viram `###` (o `#` do
    topo sai: o título vem do manifesto), a citação `>` perde a marca, comentários e imagens saem (menos a CONDIÇÃO, que vira uma marca
    para o aviso visível, ver `avisos_das_condicoes`), e um link para outro .md do
    repositório vira a página dele aqui, se ela está no site, ou só o texto (sem link quebrado)."""
    contador = iter(range(10**6))
    texto = CONDICAO.sub(lambda _m: '\n\n' + MARCA_DA_CONDICAO.format(next(contador)) + '\n\n', texto)
    texto = re.sub(r'<!--.*?-->', '', texto, flags=re.S)
    linhas = []
    for linha in texto.splitlines():
        linha = re.sub(r'^> ?', '', linha)
        if re.match(r'^# ', linha):
            continue
        linha = re.sub(r'^#{2,6} ', '### ', linha)
        linhas.append(linha)
    texto = '\n'.join(linhas)
    texto = re.sub(r'!\[([^\]]*)\]\([^)]*\)', r'\1', texto)
    base = Path(fonte).parent

    def ligar(m):
        rotulo, alvo = m[1], m[2]
        if alvo.startswith(('https://', 'http://')):
            return m[0]
        caminho = alvo.split('#', 1)[0]
        if caminho:
            resolvido = str(Path(os.path.normpath(base / caminho)))
            if resolvido in slugs:
                return f'[{rotulo}](../{slugs[resolvido]}/)'
        return rotulo
    return re.sub(r'\[([^\]]+)\]\(([^\s)]+)\)', ligar, texto)


def casca(titulo: str, corpo: str, raiz: str) -> str:
    nav = ''.join(
        f'<li><span class="rotulo">{html.escape(s["titulo"])}</span><ul>'
        + ''.join(f'<li><a href="{raiz}{p["slug"]}/">{html.escape(p["titulo"])}</a></li>' for p in s['paginas'])
        + '</ul></li>' for s in manifesto()['secoes'])
    return f"""<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(titulo)} · Documentação do SEELE</title>
<link rel="icon" href="{raiz}favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="{raiz}tokens.css"><link rel="stylesheet" href="{raiz}fontes.css"><link rel="stylesheet" href="{raiz}casca.css"><link rel="stylesheet" href="{raiz}estilo.css">
</head>
<body>
<a href="#conteudo" class="pular">Pular para o conteúdo</a>
<div class="docs">
<nav class="docs-nav" aria-label="Documentação"><a href="{raiz}">Início</a><ul>{nav}<li><span class="rotulo">MODs</span><ul><li><a href="{raiz}mods/">Criar um MOD (o guia)</a></li><li><a href="{INDEXADOR}/">O índice de MODs</a></li></ul></li></ul></nav>
<main id="conteudo" class="painel">{corpo}</main>
</div>
</body>
</html>
"""


def pagina_inicial(pendentes: dict[str, list[str]] | None = None) -> str:
    pendentes = pendentes or {}
    def estado(p):
        return RASCUNHO[0] if p['slug'] in pendentes else ESTADOS[p['estado']][0]
    secoes = ''.join(
        f'<h2>{html.escape(s["titulo"])}</h2><ul>'
        + ''.join(f'<li><a href="{p["slug"]}/">{html.escape(p["titulo"])}</a> <span class="rotulo">{estado(p)}</span></li>' for p in s['paginas'])
        + '</ul>' for s in manifesto()['secoes'])
    previa = ('<aside class="painel aviso condicao" role="note"><p><strong>PRÉVIA.</strong> Há páginas com afirmações ainda não '
              'comprovadas (marcadas RASCUNHO). Esta montagem não é a de produção.</p></aside>') if pendentes else ''
    corpo = ('<h1>Documentação do SEELE</h1>' + previa +
             '<p>O que o repositório do SEELE documenta, curado: cada página diz de onde veio e se descreve a 0.17 ou é HISTÓRICA '
             '(escrita antes dela). Para o que mudou na 0.17, comece por «A 0.17». O SEELE não usa servidor de retransmissão (TURN).</p>'
             + secoes)
    return casca('Início', corpo, '')


def abertas(raiz_seele: Path) -> dict[str, list[str]]:
    """As condições abertas de cada página do site, pela fonte."""
    return {p['slug']: condicoes((raiz_seele / p['fonte']).read_text(encoding='utf-8')) for p in paginas()}


def gerar(destino: Path, raiz_seele: Path | None = None, producao: bool = False) -> Path:
    raiz_seele = Path(raiz_seele or os.environ.get('SEELE_RAIZ', ''))
    if not (raiz_seele / 'README.md').is_file():
        raise SystemExit('falta SEELE_RAIZ (a raiz de um checkout do SEELE): a documentação vem de lá')
    pendentes = {slug: lista for slug, lista in abertas(raiz_seele).items() if lista}
    if producao and pendentes:
        detalhe = '; '.join(f'{slug}: {len(lista)}' for slug, lista in pendentes.items())
        raise SystemExit(f'o build de PRODUÇÃO recusa: há condições abertas ({detalhe}). Comprove cada uma e tire a CONDIÇÃO da fonte '
                         'com a evidência, ou deixe a afirmação de fora; o build sem --producao é uma prévia, marcada RASCUNHO')
    lista = paginas()
    slugs = {p['fonte']: p['slug'] for p in lista}
    guia = SITE / 'guia'
    if not (guia / 'index.html').is_file():
        raise SystemExit('falta site/guia/index.html: rode `python3 -m ferramentas.gerar_guia` antes (o guia é a fonte única)')
    if destino.exists():
        shutil.rmtree(destino)
    destino.mkdir(parents=True)
    for nome in COMPARTILHADOS:
        origem = SITE / nome
        if origem.is_dir():
            shutil.copytree(origem, destino / nome)
        elif origem.is_file():
            shutil.copy2(origem, destino / nome)
    shutil.copytree(guia, destino / 'mods')
    indice = destino / 'mods' / 'index.html'
    indice.write_text(para_o_indexador(indice.read_text(encoding='utf-8')), encoding='utf-8')
    (destino / 'index.html').write_text(pagina_inicial(pendentes), encoding='utf-8')
    fontes = []
    for p in lista:
        origem = raiz_seele / p['fonte']
        texto = origem.read_text(encoding='utf-8')
        commit, situacao = proveniencia(raiz_seele, p['fonte'])
        sha = hashlib.sha256(texto.encode('utf-8')).hexdigest()
        rotulo, explica = ESTADOS[p['estado']]
        dela = condicoes(texto)
        if dela:
            rotulo, explica = RASCUNHO[0], f'{RASCUNHO[1]} ({len(dela)} condição(ões); o estado curado é «{rotulo}».)'
        aviso = (f'<aside class="painel aviso" aria-label="De onde vem esta página"><p><strong>{rotulo}.</strong> {html.escape(explica)} '
                 f'{html.escape(p["nota"])}</p><p class="rotulo">Fonte: {html.escape(p["fonte"])} · {html.escape(DIZ[situacao](commit))} · '
                 f'sha256 {sha[:12]}</p></aside>')
        corpo = (f'<h1>{html.escape(p["titulo"])}</h1>' + aviso
                 + avisos_das_condicoes(gerar_guia.render(preparar(texto, p['fonte'], slugs)), dela))
        (destino / p['slug']).mkdir()
        (destino / p['slug'] / 'index.html').write_text(casca(p['titulo'], corpo, '../'), encoding='utf-8')
        fontes.append({'slug': p['slug'], 'fonte': p['fonte'], 'commit_base': commit, 'situacao': situacao,
                       'estado': p['estado'], 'sha256': sha, 'condicoes_abertas': dela})
    (destino / 'fontes.json').write_text(json.dumps(fontes, ensure_ascii=False, indent=1), encoding='utf-8')
    (destino / '_headers').write_text(CABECALHOS, encoding='utf-8')
    # A raiz Pages é este diretório: não herdar ./publicado do catálogo pai.
    (destino / 'wrangler.jsonc').write_text(json.dumps({
        'name': 'seele-docs', 'pages_build_output_dir': './',
    }, indent=2) + '\n', encoding='utf-8')
    return destino


if __name__ == '__main__':
    argumentos = [a for a in sys.argv[1:] if a != '--producao']
    saida = gerar(Path(argumentos[0]) if argumentos else RAIZ / 'site-docs', os.environ.get('SEELE_RAIZ'),
                  producao='--producao' in sys.argv[1:])
    print(f'documentação montada em {saida}')
