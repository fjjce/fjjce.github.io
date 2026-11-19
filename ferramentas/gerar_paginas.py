"""
gerar_paginas.py
Roda automaticamente no GitHub, na hora de publicar o site (veja .github/workflows/static.yml).
Não é preciso rodar no computador.

O que faz:
1. Completa as etiquetas de prévia (og:image, og:url) com o endereço completo,
   que é o formato que o WhatsApp, o Instagram e o Facebook entendem.
2. Cria uma página de prévia para cada campeonato e cada notícia, em compartilhar/.
   O WhatsApp não roda JavaScript, então ele lê essas páginas para mostrar título e imagem.
   Quem clica no link é levado na hora para a página de verdade.
3. Cria o sitemap.xml, a lista de páginas que ajuda o Google a encontrar o site.

Uso: python3 ferramentas/gerar_paginas.py .
(o site fica na pasta principal; "novo-site" ainda é aceito por compatibilidade)
"""
import html
import json
import re
import sys
from datetime import date
from pathlib import Path
from urllib.parse import urljoin, quote

PASTA_SITE = Path(sys.argv[1] if len(sys.argv) > 1 else ".")
if not (PASTA_SITE / "dados" / "site.json").exists():
    PASTA_SITE = Path(".")  # o site agora fica na pasta principal

MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho",
         "agosto", "setembro", "outubro", "novembro", "dezembro"]


def ler_json(nome):
    return json.loads((PASTA_SITE / "dados" / nome).read_text(encoding="utf-8"))


SITE = ler_json("site.json")
BASE = SITE["endereco"].rstrip("/") + "/"
IMAGEM_PADRAO = "assets/img/compartilhar-fjjce.jpg"


def data_extenso(texto):
    a, m, d = (int(x) for x in texto.split("-"))
    return f"{d} de {MESES[m - 1]} de {a}"


def periodo(inicio, fim):
    if not fim or fim == inicio:
        return data_extenso(inicio)
    a1, m1, d1 = (int(x) for x in inicio.split("-"))
    a2, m2, d2 = (int(x) for x in fim.split("-"))
    if (a1, m1) == (a2, m2):
        ligacao = "e" if d2 - d1 == 1 else "a"
        return f"{d1} {ligacao} {d2} de {MESES[m2 - 1]} de {a2}"
    return f"{data_extenso(inicio)} a {data_extenso(fim)}"


# ---------- 1. Endereços completos nas etiquetas de prévia ----------

def completar_etiquetas(arquivo: Path):
    endereco_pagina = urljoin(BASE, arquivo.relative_to(PASTA_SITE).as_posix())
    if endereco_pagina.endswith("/index.html"):
        endereco_pagina = endereco_pagina[: -len("index.html")]  # endereço curto, sem index.html
    texto = arquivo.read_text(encoding="utf-8")

    def absoluto(m):
        valor = m.group(2)
        if re.match(r"^https?://", valor):
            return m.group(0)
        return f'{m.group(1)}{html.escape(urljoin(endereco_pagina, valor))}"'

    texto = re.sub(r'(<meta property="og:image" content=")([^"]*)"', absoluto, texto)
    if 'property="og:url"' not in texto and 'property="og:title"' in texto:
        texto = texto.replace(
            '<meta property="og:title"',
            f'<meta property="og:url" content="{html.escape(endereco_pagina)}">\n  <meta property="og:title"', 1)
    arquivo.write_text(texto, encoding="utf-8")


# ---------- 2. Páginas de prévia ----------

MODELO = """<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{titulo}</title>
  <meta name="description" content="{descricao}">
  <meta name="robots" content="noindex">
  <link rel="canonical" href="{destino}">
  <meta property="og:type" content="{tipo}">
  <meta property="og:site_name" content="FJJCE">
  <meta property="og:locale" content="pt_BR">
  <meta property="og:url" content="{proprio}">
  <meta property="og:title" content="{titulo}">
  <meta property="og:description" content="{descricao}">
  <meta property="og:image" content="{imagem}">
  <meta name="twitter:card" content="summary_large_image">
  <script>location.replace({destino_js});</script>
</head>
<body>
  <p><a href="{destino}">Abrir: {titulo}</a></p>
</body>
</html>
"""


def pagina_previa(nome_arquivo, titulo, descricao, imagem, destino, tipo="article"):
    pasta = PASTA_SITE / "compartilhar"
    pasta.mkdir(exist_ok=True)
    destino_abs = urljoin(BASE, destino)
    (pasta / nome_arquivo).write_text(MODELO.format(
        titulo=html.escape(titulo),
        descricao=html.escape(descricao),
        imagem=html.escape(urljoin(BASE, imagem or IMAGEM_PADRAO)),
        destino=html.escape(destino_abs),
        destino_js=json.dumps(destino_abs),
        proprio=html.escape(urljoin(BASE, f"compartilhar/{nome_arquivo}")),
        tipo=tipo,
    ), encoding="utf-8")


def main():
    for arquivo in PASTA_SITE.glob("*.html"):
        if arquivo.name != "404.html":
            completar_etiquetas(arquivo)

    eventos = ler_json("eventos.json")["eventos"]
    noticias = ler_json("noticias.json")["noticias"]

    for e in eventos:
        partes = [periodo(e["inicio"], e.get("fim")), f'{e["local"]}, {e["cidade"]}']
        if e.get("etapa"):
            partes.insert(0, e["etapa"])
        pagina_previa(f'evento-{e["id"]}.html', f'{e["nome"]} | FJJCE', ". ".join(partes) + ".",
                      e.get("imagem"), f'evento.html?id={quote(e["id"])}', tipo="website")

    for n in noticias:
        pagina_previa(f'noticia-{n["id"]}.html', n["titulo"], n.get("resumo", ""),
                      n.get("imagem"), f'noticia.html?id={quote(n["id"])}')

    # ---------- 3. Sitemap ----------
    hoje = date.today().isoformat()
    enderecos = [(urljoin(BASE, p.name), hoje) for p in sorted(PASTA_SITE.glob("*.html"))
                 if p.name not in ("evento.html", "noticia.html", "404.html")]
    enderecos += [(urljoin(BASE, f'evento.html?id={quote(e["id"])}'), hoje) for e in eventos]
    enderecos += [(urljoin(BASE, f'noticia.html?id={quote(n["id"])}'), n["data"])
                  for n in noticias if not n.get("exemplo")]
    linhas = "\n".join(f"  <url><loc>{html.escape(u)}</loc><lastmod>{d}</lastmod></url>" for u, d in enderecos)
    (PASTA_SITE / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + linhas + "\n</urlset>\n",
        encoding="utf-8")

    print(f"Prévias: {len(eventos)} campeonatos e {len(noticias)} notícias. Sitemap: {len(enderecos)} endereços.")


if __name__ == "__main__":
    main()
