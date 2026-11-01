"""
Gera as páginas estáticas do site a partir dos dados da loja:

  produtos/<slug>.html     uma página por produto (com dados estruturados Product)
  categoria/<id>.html      uma página por categoria
  dicas/index.html         lista de dicas
  dicas/<id>.html          uma página por dica
  sobre.html               quem somos, como funciona e onde entregamos
  politicas.html           a partir de ferramentas/conteudo/politicas.html
  404.html                 página de "não encontrado" (usada pelo GitHub Pages)
  sitemap.xml, robots.txt  para o Google encontrar tudo

Todas as páginas reaproveitam o cabeçalho, o rodapé, a sacola e o checkout do index.html,
então continuam com a mesma cara e as mesmas funções.

Uso:  python ferramentas/gerar_paginas.py
Rode de novo sempre que mudar produtos, categorias, dicas, config.js, o cabeçalho/rodapé do index.html ou o CSS/JS.
Ele também atualiza sozinho a versão (?v=...) dos arquivos CSS/JS, para o navegador dos clientes baixar a versão nova.
Sem dependências: só Python 3.
"""
import hashlib
import html
import json
import re
import sys
from datetime import date
from pathlib import Path
from urllib.parse import urlparse

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

RAIZ = Path(__file__).resolve().parent.parent
e = lambda s: html.escape(str(s), quote=True)


# ============================================================================
# 1. Lê os dados direto dos arquivos JavaScript (sem precisar de Node)
# ============================================================================
def _pular(src, i):
    """Avança sobre string ou comentário começando em i; devolve o novo índice (ou None)."""
    c = src[i]
    if c in "\"'`":
        j = i + 1
        while src[j] != c:
            j += 2 if src[j] == "\\" else 1
        return j + 1
    if src.startswith("//", i):
        return src.index("\n", i)
    if src.startswith("/*", i):
        return src.index("*/", i) + 2
    return None


def _literal(src, nome):
    """Recorta o literal (objeto/array) atribuído em `ZP.<nome> = ...`."""
    m = re.search(rf"^ZP\.{nome}\s*=\s*", src, re.M)
    if not m:
        raise ValueError(f"ZP.{nome} não encontrado")
    i = m.end()
    abre = src[i]
    fecha = {"[": "]", "{": "}"}[abre]
    nivel, j = 0, i
    while True:
        pulo = _pular(src, j)
        if pulo is not None:
            j = pulo
            continue
        if src[j] == abre:
            nivel += 1
        elif src[j] == fecha:
            nivel -= 1
            if nivel == 0:
                return src[i:j + 1]
        j += 1


def _para_json(lit):
    """Converte um literal JS simples (chaves sem aspas, vírgula final, comentários) em JSON."""
    out, i, n = [], 0, len(lit)
    while i < n:
        c = lit[i]
        if c in "\"'":
            fim = _pular(lit, i)
            corpo = lit[i + 1:fim - 1]
            if c == "'":
                corpo = corpo.replace('"', '\\"')
            out.append('"' + corpo + '"')
            i = fim
        elif lit.startswith("//", i) or lit.startswith("/*", i):
            i = _pular(lit, i)
        elif c.isalpha() or c in "_$":
            j = i
            while j < n and (lit[j].isalnum() or lit[j] in "_$"):
                j += 1
            palavra = lit[i:j]
            k = j
            while k < n and lit[k] in " \t\r\n":
                k += 1
            eh_chave = k < n and lit[k] == ":" and palavra not in ("true", "false", "null")
            out.append(f'"{palavra}"' if eh_chave else palavra)
            i = j
        else:
            out.append(c)
            i += 1
    texto = re.sub(r",(\s*[}\]])", r"\1", "".join(out))
    return json.loads(texto)


def carregar_dados():
    data = (RAIZ / "js" / "data.js").read_text(encoding="utf-8")
    config = (RAIZ / "js" / "config.js").read_text(encoding="utf-8")
    d = {nome: _para_json(_literal(data, nome)) for nome in ("categories", "pets", "products", "articles")}
    d["config"] = _para_json(_literal(config, "config"))
    return d


# ============================================================================
# 2. "Casca" das páginas: cabeçalho, rodapé, sacola e checkout do index.html
# ============================================================================
def reescrever_links(trecho, raiz):
    """Ajusta href/src relativos para a profundidade da página (sem mexer nos ícones <use href="#...">)."""
    def ajustar(valor):
        if valor == "#" or valor.startswith(("http:", "https:", "mailto:", "tel:", "data:", "/")):
            return valor
        if valor.startswith("#"):
            return f"{raiz}index.html{valor}"
        return raiz + valor

    def tag(m):
        t = m.group(0)
        if t.startswith("<use"):
            return t
        return re.sub(r'\b(href|src)="([^"]*)"', lambda a: f'{a.group(1)}="{ajustar(a.group(2))}"', t)

    return re.sub(r"<[a-zA-Z][^>]*>", tag, trecho)


def casca(index_html):
    corpo = index_html.split("<body>", 1)[1].rsplit("</body>", 1)[0]
    antes, resto = corpo.split('<main id="conteudo">', 1)
    depois = resto.split("</main>", 1)[1]
    versao = re.search(r'css/styles\.css\?v=([\w]+)"', index_html).group(1)
    scripts = re.findall(r'<script src="(js/[\w-]+\.js)\?v=\w+" defer></script>', index_html)
    return antes, depois, versao, scripts


def montar(pagina, raiz, ctx, *, titulo, descricao, caminho, conteudo, jsonld=None, og_tipo="website", imagem=None, noindex=False):
    antes, depois, versao, scripts = ctx["casca"]
    site = ctx["site"]
    url = site + caminho
    imagem = imagem or f"{site}assets/img/og-image.jpg"
    ld = "".join(f'\n  <script type="application/ld+json">{json.dumps(x, ensure_ascii=False)}</script>' for x in (jsonld or []))
    head = f"""<!doctype html>
<html lang="pt-BR" data-root="{raiz}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>{e(titulo)}</title>
  <meta name="description" content="{e(descricao)}">
  {'<meta name="robots" content="noindex">' if noindex else f'<link rel="canonical" href="{e(url)}">'}
  <meta name="theme-color" content="#5b1fa8">
  <link rel="icon" href="{raiz}assets/img/favicon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="{raiz}assets/img/icon-180.png">
  <link rel="manifest" href="{raiz}manifest.webmanifest">
  <meta property="og:type" content="{og_tipo}">
  <meta property="og:site_name" content="Pituco Pets">
  <meta property="og:title" content="{e(titulo)}">
  <meta property="og:description" content="{e(descricao)}">
  <meta property="og:url" content="{e(url)}">
  <meta property="og:image" content="{e(imagem)}">
  <meta property="og:locale" content="pt_BR">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="{raiz}css/styles.css?v={versao}">{ld}
""" + "".join(f'  <script src="{raiz}{s}?v={versao}" defer></script>\n' for s in scripts) + "</head>\n<body>"
    pagina_html = (head + reescrever_links(antes, raiz) + f'<main id="conteudo" class="page">\n{conteudo}\n  </main>'
                   + reescrever_links(depois, raiz) + "</body>\n</html>\n")
    destino = RAIZ / pagina
    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_text(pagina_html, encoding="utf-8")
    ctx["paginas"].append((caminho, noindex))


# ============================================================================
# 3. Conteúdo de cada tipo de página
# ============================================================================
def brl(v):
    return "R$ " + f"{v:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


def migalhas(itens, raiz):
    partes = [f'<a href="{raiz}index.html">Início</a>']
    for nome, link in itens:
        partes.append(f'<a href="{link}">{e(nome)}</a>' if link else f'<span aria-current="page">{e(nome)}</span>')
    return f'<nav class="crumbs" aria-label="Você está em">{" <span>›</span> ".join(partes)}</nav>'


def ld_migalhas(site, itens):
    return {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": i + 1, "name": nome, "item": site + caminho} for i, (nome, caminho) in enumerate(itens)]}


TEXTOS_CATEGORIA = {
    "shampoo": "Shampoos com pH pensado para a pele de cada espécie: limpeza profunda para o dia a dia, opção neutra e hipoalergênica para pele sensível e filhotes, fórmula que realça pelos brancos e linha própria para cavalos.",
    "condicionador": "Condicionadores que hidratam, desembaraçam e deixam a pelagem macia — inclusive para raças de pelo longo e para crina e cauda de cavalos. O passo que transforma o banho.",
    "leave-in": "Finalizadores sem enxágue que protegem do sol e da poeira, dão brilho e facilitam a escovação entre um banho e outro.",
    "perfumes": "Colônias e perfumes para pets com fragrâncias suaves e duradouras, do clássico cheirinho de bebê ao floral. Indicados para finalizar o banho.",
    "higiene": "Cuidados do dia a dia sem precisar de banho: banho a seco em espuma, lenços umedecidos, escova removedora de pelos e limpador de orelhas.",
    "kits": "Combinações completas para a rotina de banho, com economia em relação aos produtos avulsos. Ótimos para presentear.",
}


def pagina_produto(p, d, ctx):
    raiz, site = "../", ctx["site"]
    cat = next(c for c in d["categories"] if c["id"] == p["cat"])
    pets = [next(x for x in d["pets"] if x["id"] == pid)["name"] for pid in p["pets"]]
    preco = min(v["price"] for v in p["variants"])
    fallback = f"""
      <article class="pd-static">
        <h1>{e(p['name'])}</h1>
        <p>{e(p['short'])}</p>
        <p><b>{'A partir de ' if len(p['variants']) > 1 else ''}{brl(preco)}</b> · {e(', '.join(v['label'] for v in p['variants']))}</p>
        <h2>Descrição</h2><p>{e(p['description'])}</p>
        <h2>Benefícios</h2><ul>{''.join(f'<li>{e(b)}</li>' for b in p['benefits'])}</ul>
        <h2>Modo de uso</h2><p>{e(p['howTo'])}</p>
        <p>Indicado para: {e(', '.join(pets))}.</p>
      </article>"""
    conteudo = f"""    <div class="container">
      {migalhas([(cat['name'], f"{raiz}categoria/{cat['id']}.html"), (p['name'], None)], raiz)}
      <div class="pd-page" id="pdInline" data-product="{p['id']}">{fallback}
      </div>
    </div>"""
    caminho = f"produtos/{p['slug']}.html"
    jsonld = [
        {"@context": "https://schema.org", "@type": "Product", "name": p["name"], "description": p["description"],
         "sku": p["slug"], "brand": {"@type": "Brand", "name": "Pituco Pets"}, "category": cat["name"],
         "image": f"{site}assets/img/og-image.jpg", "url": site + caminho,
         "offers": {"@type": "AggregateOffer" if len(p["variants"]) > 1 else "Offer", "priceCurrency": "BRL",
                    **({"lowPrice": preco, "highPrice": max(v["price"] for v in p["variants"]), "offerCount": len(p["variants"])}
                       if len(p["variants"]) > 1 else {"price": preco}),
                    "availability": "https://schema.org/InStock", "url": site + caminho}},
        ld_migalhas(site, [("Início", ""), (cat["name"], f"categoria/{cat['id']}.html"), (p["name"], caminho)]),
    ]
    montar(caminho, raiz, ctx, titulo=f"{p['name']} — Pituco Pets",
           descricao=f"{p['short']} {cat['name']} para {', '.join(pets).lower()}. A partir de {brl(preco)}. Entregamos em todo o estado de SP.",
           caminho=caminho, conteudo=conteudo, jsonld=jsonld, og_tipo="product")


def pagina_categoria(c, d, ctx):
    raiz, site = "../", ctx["site"]
    itens = [p for p in d["products"] if p["cat"] == c["id"]]
    lista = "".join(f'<li><a href="{raiz}produtos/{p["slug"]}.html">{e(p["name"])}</a> — {brl(min(v["price"] for v in p["variants"]))}</li>' for p in itens)
    outras = "".join(f'<a class="chip" href="{raiz}categoria/{x["id"]}.html">{e(x["name"])}</a>' for x in d["categories"] if x["id"] != c["id"])
    conteudo = f"""    <div class="container">
      {migalhas([(c['name'], None)], raiz)}
      <header class="cat-hero" style="--tint:{c['tint']};--accent:{c['color']}">
        <span class="cat-hero__icon"><svg class="bi" aria-hidden="true"><use href="#ic-{c['icon']}"/></svg></span>
        <div>
          <span class="eyebrow">{len(itens)} produtos</span>
          <h1>{e(c['name'])}</h1>
          <p>{e(TEXTOS_CATEGORIA.get(c['id'], c['desc']))}</p>
        </div>
      </header>
      <div class="product-grid" id="catGrid" data-cat="{c['id']}">
        <ul class="cat-static">{lista}</ul>
      </div>
      <nav class="cat-others" aria-label="Outras categorias"><b>Outras categorias:</b> {outras}</nav>
    </div>"""
    caminho = f"categoria/{c['id']}.html"
    jsonld = [{"@context": "https://schema.org", "@type": "CollectionPage", "name": c["name"], "url": site + caminho,
               "description": TEXTOS_CATEGORIA.get(c["id"], c["desc"])},
              ld_migalhas(site, [("Início", ""), (c["name"], caminho)])]
    montar(caminho, raiz, ctx, titulo=f"{c['name']} para pets — Pituco Pets",
           descricao=f"{TEXTOS_CATEGORIA.get(c['id'], c['desc'])[:150]}", caminho=caminho, conteudo=conteudo, jsonld=jsonld)


def capa_dica(a):
    return "".join(f'<svg class="bi" aria-hidden="true"><use href="#ic-{n}"/></svg>' for n in a["icons"])


def pagina_dica(a, d, ctx):
    raiz, site = "../", ctx["site"]
    outras = "".join(f'<li><a href="{x["id"]}.html">{e(x["title"])}</a></li>' for x in d["articles"] if x["id"] != a["id"])
    corpo = "".join(f"<p>{trecho}</p>" for trecho in a["body"])   # o texto das dicas já vem com <b> no data.js
    conteudo = f"""    <div class="container container--narrow">
      {migalhas([("Dicas", f"{raiz}dicas/index.html"), (a['title'], None)], raiz)}
      <article class="article article--page">
        <span class="article__cover">{capa_dica(a)}</span>
        <p class="article__meta"><span class="tag">{e(a['tag'])}</span> · {e(a['read'])} de leitura</p>
        <h1>{e(a['title'])}</h1>
        {corpo}
        <div class="article__cta">
          <p>Ficou com dúvida sobre qual produto usar?</p>
          <a class="btn btn--primary" data-wa="Olá! Li a dica “{e(a['title'])}” e queria uma indicação de produto." href="#">Pedir indicação no WhatsApp</a>
        </div>
      </article>
      <aside class="more-tips"><h2>Outras dicas</h2><ul>{outras}</ul></aside>
    </div>"""
    caminho = f"dicas/{a['id']}.html"
    jsonld = [{"@context": "https://schema.org", "@type": "Article", "headline": a["title"], "description": a["excerpt"],
               "url": site + caminho, "image": f"{site}assets/img/og-image.jpg",
               "publisher": {"@type": "Organization", "name": "Pituco Pets", "logo": {"@type": "ImageObject", "url": f"{site}assets/img/icon-512.png"}}},
              ld_migalhas(site, [("Início", ""), ("Dicas", "dicas/index.html"), (a["title"], caminho)])]
    montar(caminho, raiz, ctx, titulo=f"{a['title']} — Dicas Pituco Pets", descricao=a["excerpt"],
           caminho=caminho, conteudo=conteudo, jsonld=jsonld, og_tipo="article")


def pagina_dicas(d, ctx):
    raiz = "../"
    cards = "".join(f"""
        <article class="article-card">
          <a class="article-card__btn" href="{a['id']}.html">
            <span class="article-card__cover">{capa_dica(a)}</span>
            <span class="article-card__meta"><span class="tag">{e(a['tag'])}</span> {e(a['read'])} de leitura</span>
            <b>{e(a['title'])}</b><small>{e(a['excerpt'])}</small>
            <span class="article-card__more">Ler dica →</span>
          </a>
        </article>""" for a in d["articles"])
    conteudo = f"""    <div class="container">
      {migalhas([("Dicas", None)], raiz)}
      <header class="section__head section__head--left page-head">
        <span class="eyebrow">Blog da matilha</span>
        <h1>Dicas de banho e cuidado</h1>
        <p>Conteúdo para cuidar melhor de quem cuida da gente.</p>
      </header>
      <div class="article-grid">{cards}</div>
    </div>"""
    montar("dicas/index.html", raiz, ctx, titulo="Dicas de banho e cuidado — Pituco Pets",
           descricao="Dicas de banho e cuidado para cães, gatos, coelhos e cavalos: frequência de banho, passo a passo, crina e cauda e mais.",
           caminho="dicas/index.html", conteudo=conteudo)


def pagina_sobre(d, ctx):
    cfg = d["config"]
    zonas = cfg["shipping"]["zones"]
    linhas = []
    for z in zonas:
        onde = ", ".join(z["cities"]) if z.get("cities") else "todas as outras cidades do estado"
        linhas.append(f"""<li class="zone"><div><b>{e(z['name'])}</b><small>{e(onde)}</small></div><span>{brl(z['price'])}<small>{e(z['days'])}</small></span></li>""")
    linhas.append(f"""<li class="zone"><div><b>{e(cfg['shipping']['pickup']['label'])}</b><small>{e(cfg['store']['address'])}</small></div><span>Grátis<small>{e(cfg['shipping']['pickup']['days'])}</small></span></li>""")
    # ⚠️ Texto de exemplo: troque pela história real da loja quando quiser (em ferramentas/gerar_paginas.py)
    conteudo = f"""    <div class="container">
      {migalhas([("Sobre nós", None)], "")}
      <header class="about-hero">
        <div>
          <span class="eyebrow">Sobre nós</span>
          <h1>Banho é cuidado, <mark class="hl">é bem-estar</mark></h1>
          <p>A Pituco Pets reúne produtos de banho e cuidado para cães, gatos, coelhos e cavalos, escolhidos para cada espécie. A ideia é simples: deixar o banho do seu pet mais fácil, cheiroso e cheio de carinho — com atendimento de gente de verdade, direto no WhatsApp.</p>
          <a class="btn btn--primary btn--lg" href="index.html#produtos">Ver produtos</a>
        </div>
        <div class="about-hero__pets" aria-hidden="true">
          <svg class="bi"><use href="#ic-dog"/></svg><svg class="bi"><use href="#ic-cat"/></svg>
          <svg class="bi"><use href="#ic-rabbit"/></svg><svg class="bi"><use href="#ic-horse"/></svg>
        </div>
      </header>

      <section class="about-grid" aria-label="Nossos compromissos">
        <article><b>Cada espécie com o seu cuidado</b><p>Indicamos claramente para quais pets cada produto serve — e avisamos quando algo não é indicado, como óleos essenciais para gatos e banho com água para coelhos.</p></article>
        <article><b>Atendimento humano</b><p>Você monta o pedido no site e finaliza com a nossa equipe no WhatsApp: tira dúvidas, combina o pagamento e a entrega.</p></article>
        <article><b>Sem cadastro, sem complicação</b><p>Não pedimos senha nem dados de cartão no site. Seus dados ficam só no seu navegador até você enviar o pedido.</p></article>
        <article><b>Troca fácil</b><p>Até 7 dias para desistir da compra, conforme o Código de Defesa do Consumidor. Veja as <a href="politicas.html#trocas">políticas</a>.</p></article>
      </section>

      <section class="zones-box" aria-labelledby="ondeTitle">
        <h2 id="ondeTitle">Onde entregamos</h2>
        <p>Por enquanto atendemos o <b>{e(cfg['shipping']['serviceArea']['label'])}</b>. Compras acima de <b>{brl(cfg['shipping']['freeFrom'])}</b> têm frete grátis.</p>
        <ul class="zones">{''.join(linhas)}</ul>
      </section>
    </div>"""
    montar("sobre.html", "", ctx, titulo="Sobre a Pituco Pets — Banho é cuidado, é bem-estar!",
           descricao="Conheça a Pituco Pets: produtos de banho e cuidado para cães, gatos, coelhos e cavalos, atendimento pelo WhatsApp e entrega em todo o estado de SP.",
           caminho="sobre.html", conteudo=conteudo,
           jsonld=[{"@context": "https://schema.org", "@type": "AboutPage", "name": "Sobre a Pituco Pets", "url": ctx["site"] + "sobre.html"}])


def pagina_politicas(d, ctx):
    miolo = (RAIZ / "ferramentas" / "conteudo" / "politicas.html").read_text(encoding="utf-8")
    miolo = "\n".join(l for l in miolo.splitlines() if not l.strip().startswith("<!--"))
    conteudo = f"""    <div class="container">
      {migalhas([("Políticas", None)], "")}
      <div class="policy">
{miolo}
      </div>
    </div>"""
    montar("politicas.html", "", ctx, titulo="Políticas de entrega, trocas, pagamentos e privacidade — Pituco Pets",
           descricao="Como funcionam as entregas no estado de SP, trocas e devoluções, formas de pagamento e privacidade (LGPD) na Pituco Pets.",
           caminho="politicas.html", conteudo=conteudo)


def carimbar_versao():
    """Calcula uma versão a partir do conteúdo do CSS/JS e grava no index.html (as outras páginas herdam)."""
    arquivos = sorted((RAIZ / "css").glob("*.css")) + sorted((RAIZ / "js").glob("*.js"))
    versao = hashlib.sha1(b"".join(a.read_bytes() for a in arquivos)).hexdigest()[:10]
    index = RAIZ / "index.html"
    bruto = index.read_bytes().decode("utf-8")
    novo = re.sub(r'((?:href|src)="(?:css|js)/[\w-]+\.(?:css|js))\?v=\w+"', lambda m: f'{m.group(1)}?v={versao}"', bruto)
    if novo != bruto:
        index.write_bytes(novo.encode("utf-8"))
    return versao


def pagina_404(d, ctx):
    raiz = urlparse(ctx["site"]).path or "/"    # caminho absoluto: o 404 é servido em qualquer profundidade
    conteudo = f"""    <div class="container err-page">
      <span class="mascot__face" aria-hidden="true"><svg class="bi"><use href="#ic-dog"/></svg></span>
      <h1>Ops! Essa página foi tomar banho 🛁</h1>
      <p>Não encontramos o que você procurou. Que tal voltar para a loja ou buscar um produto?</p>
      <div class="err-page__actions">
        <a class="btn btn--primary btn--lg" href="{raiz}index.html">Ir para a loja</a>
        <a class="btn btn--outline btn--lg" href="{raiz}index.html#produtos">Ver produtos</a>
      </div>
    </div>"""
    montar("404.html", raiz, ctx, titulo="Página não encontrada — Pituco Pets", descricao="Página não encontrada.",
           caminho="404.html", conteudo=conteudo, noindex=True)


# ============================================================================
# 4. Sitemap e robots
# ============================================================================
def sitemap(ctx):
    hoje = date.today().isoformat()
    prioridade = lambda c: 0.8 if c.startswith(("produtos/", "categoria/")) else 0.3 if c == "politicas.html" else 0.6
    urls = [("", 1.0)] + [(c, prioridade(c)) for c, noindex in ctx["paginas"] if not noindex]
    corpo = "\n".join(f"  <url><loc>{e(ctx['site'] + c)}</loc><lastmod>{hoje}</lastmod><priority>{p}</priority></url>" for c, p in urls)
    (RAIZ / "sitemap.xml").write_text(f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{corpo}\n</urlset>\n', encoding="utf-8")
    (RAIZ / "robots.txt").write_text(f"User-agent: *\nAllow: /\n\nSitemap: {ctx['site']}sitemap.xml\n", encoding="utf-8")
    return len(urls)


if __name__ == "__main__":
    d = carregar_dados()
    versao = carimbar_versao()
    site = d["config"]["siteUrl"].rstrip("/") + "/"
    ctx = {"site": site, "casca": casca((RAIZ / "index.html").read_text(encoding="utf-8")), "paginas": []}
    for p in d["products"]:
        pagina_produto(p, d, ctx)
    for c in d["categories"]:
        pagina_categoria(c, d, ctx)
    pagina_dicas(d, ctx)
    for a in d["articles"]:
        pagina_dica(a, d, ctx)
    pagina_sobre(d, ctx)
    pagina_politicas(d, ctx)
    pagina_404(d, ctx)
    n = sitemap(ctx)
    print(f"✓ {len(d['products'])} produtos, {len(d['categories'])} categorias, {len(d['articles'])} dicas, sobre e 404")
    print(f"✓ sitemap.xml com {n} endereços e robots.txt")
    print(f"✓ versão dos arquivos CSS/JS: {versao}")
