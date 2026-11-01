"""
Gera a identidade visual da Pituco Pets:

  assets/img/logo.svg            logo para fundos claros
  assets/img/logo-branco.svg     logo para fundos escuros (rodapé)
  assets/img/favicon.svg         ícone da aba do navegador
  assets/img/icon-180.png        ícone do iPhone (apple-touch-icon)
  assets/img/icon-192.png        ícone Android / manifest
  assets/img/icon-512.png        ícone Android / manifest
  assets/img/og-image.jpg        imagem de compartilhamento (WhatsApp, Instagram...)

O texto do logo é convertido em desenho (path), então o SVG funciona em qualquer
lugar sem depender de fonte instalada.

Uso:  python ferramentas/gerar_marca.py
Requer: Pillow e fontTools  (pip install pillow fonttools)
As fontes Baloo 2 e Nunito (licença livre OFL) são baixadas do Google Fonts
na primeira execução e guardadas em ferramentas/fontes/.
"""
import math
import re
import sys
import urllib.request
from pathlib import Path

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw, ImageFilter, ImageFont

# O terminal do Windows usa cp1252 por padrão; força UTF-8 para imprimir acentos e símbolos
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

RAIZ = Path(__file__).resolve().parent.parent
IMG = RAIZ / "assets" / "img"
FONTES = Path(__file__).resolve().parent / "fontes"

# ---------- Cores da marca ----------
ROXO = "#5b1fa8"
ROXO_ESCURO = "#2e0b5c"
LIMAO = "#b6e61e"
BRANCO = "#ffffff"

# Patinha (mesmo desenho do ícone #i-paw do site, em caixa 24x24)
PATA_DEDOS = [(5, 10, 2.3), (9, 5.3, 2.3), (15, 5.3, 2.3), (19, 10, 2.3)]
PATA_ALMOFADA = "M12 11c-3 0-6.2 4-6.2 6.6 0 2 1.6 3 3 3 1.2 0 2.1-.6 3.2-.6s2 .6 3.2.6c1.4 0 3-1 3-3C18.2 15 15 11 12 11z"


# ---------- Fontes ----------
def fonte(familia, peso):
    FONTES.mkdir(exist_ok=True)
    arq = FONTES / f"{familia.replace(' ', '')}-{peso}.ttf"
    if not arq.exists():
        css = urllib.request.urlopen(
            f"https://fonts.googleapis.com/css2?family={familia.replace(' ', '+')}:wght@{peso}").read().decode()
        url = re.findall(r"url\((https://fonts\.gstatic\.com/[^)]+\.ttf)\)", css)[-1]
        arq.write_bytes(urllib.request.urlopen(url).read())
    return arq


def texto_em_path(arq_fonte, texto, tamanho, x, y_base, espacamento=0.0):
    """Converte um texto em <path d="..."> SVG. Retorna (d, largura)."""
    f = TTFont(arq_fonte)
    glifos = f.getGlyphSet()
    cmap = f.getBestCmap()
    escala = tamanho / f["head"].unitsPerEm
    pen = SVGPathPen(glifos)
    cursor = x
    for i, ch in enumerate(texto):
        nome = cmap[ord(ch)]
        glifos[nome].draw(TransformPen(pen, (escala, 0, 0, -escala, cursor, y_base)))
        cursor += glifos[nome].width * escala + (espacamento if i < len(texto) - 1 else 0)
    return pen.getCommands(), cursor - x


def altura_maiuscula(arq_fonte, tamanho, letra="P"):
    f = TTFont(arq_fonte)
    glifo = f["glyf"][f.getBestCmap()[ord(letra)]]
    return glifo.yMax * tamanho / f["head"].unitsPerEm


# ---------- SVG ----------
def pata_svg(cx, cy, tamanho, cor):
    s = tamanho / 24
    dedos = "".join(f'<circle cx="{x}" cy="{y}" r="{r}"/>' for x, y, r in PATA_DEDOS)
    return (f'<g fill="{cor}" transform="translate({cx - 12 * s:.2f} {cy - 12.4 * s:.2f}) scale({s:.4f})">'
            f'{dedos}<path d="{PATA_ALMOFADA}"/></g>')


# ---------- Pituca: a poodle que inspirou a marca ----------
# Poodle pequena e branquinha, com uma mancha marrom bem clarinha na orelha DIREITA dela
# (que aparece do lado esquerdo para quem olha de frente). Feita só de círculos e elipses
# numa caixa 100x100, para sair igual no SVG (logo, site) e no PNG (ícones).
PELO, MANCHA, FOCINHO = "#ffffff", "#efd5b5", "#fff8f1"
CONTORNO, ESCURO, LINGUA, BOCHECHA, LACO = "#3d2c27", "#2b1d16", "#ff8fab", "#ffc6d6", "#ff5c9a"
TRACO = 3.2   # espessura do contorno (na caixa 100x100)

# Cada grupo recebe UM contorno em volta do conjunto (técnica de adesivo: sem riscos entre as bolinhas).
# Formas: ("c", cx, cy, r) círculo | ("e", cx, cy, rx, ry) elipse.
PITUCA_GRUPOS = [
    # orelhas longas e cacheadas, caindo rente ao rosto
    {"cor": PELO, "contorno": True, "formas": [
        ("c", 29, 50, 10), ("c", 25, 61, 10.5), ("c", 27, 73, 10),
        ("c", 71, 50, 10), ("c", 75, 61, 10.5), ("c", 73, 73, 10)]},
    # mancha marrom bem clarinha na orelha DIREITA dela (lado esquerdo para quem olha)
    {"cor": MANCHA, "contorno": False, "formas": [("c", 24.5, 63, 7.2), ("c", 27, 72.5, 6.6)]},
    # cabeça + topete fofo como uma silhueta só
    {"cor": PELO, "contorno": True, "formas": [
        ("e", 50, 53, 18.5, 20), ("c", 39, 27, 11), ("c", 61, 27, 11), ("c", 50, 19, 12.5), ("c", 50, 31, 11)]},
    # lacinho rosa no topete
    {"cor": LACO, "contorno": True, "formas": [("c", 63.5, 15.5, 4.6), ("c", 72.5, 15.5, 4.6)]},
    {"cor": LACO, "contorno": True, "formas": [("c", 68, 15.5, 2.8)]},
    # focinho
    {"cor": FOCINHO, "contorno": True, "traco": 2.2, "formas": [("e", 50, 64.5, 10, 8.5)]},
    # bochechas, olhos, brilho e nariz (sem contorno)
    {"cor": BOCHECHA, "contorno": False, "formas": [("c", 36.5, 58.5, 3.6), ("c", 63.5, 58.5, 3.6)]},
    {"cor": ESCURO, "contorno": False, "formas": [("c", 42.5, 50.5, 4), ("c", 57.5, 50.5, 4), ("e", 50, 59.8, 5, 3.7)]},
    {"cor": PELO, "contorno": False, "formas": [("c", 43.9, 49, 1.4), ("c", 58.9, 49, 1.4), ("e", 48.6, 58.7, 1.4, .9)]},
]
BOCA = [((45.6, 66.6), (47.8, 69.4), (50, 66.6)), ((50, 66.6), (52.2, 69.4), (54.4, 66.6))]


def _forma_svg(f, extra=0, cor="#000", contorno=None, traco=0):
    if f[0] == "c":
        el = f'<circle cx="{f[1]}" cy="{f[2]}" r="{f[3] + extra}"'
    else:
        el = f'<ellipse cx="{f[1]}" cy="{f[2]}" rx="{f[3] + extra}" ry="{f[4] + extra}"'
    return el + f' fill="{cor}"/>'


def pituca_elementos(contorno=CONTORNO):
    """Elementos SVG da Pituca na caixa 0..100."""
    partes = []
    for g in PITUCA_GRUPOS:
        if g["contorno"]:
            t = g.get("traco", TRACO)
            partes += [_forma_svg(f, extra=t, cor=contorno) for f in g["formas"]]   # silhueta escura levemente maior
        partes += [_forma_svg(f, cor=g["cor"]) for f in g["formas"]]                  # preenchimento por cima
    boca = "".join(f"M{a[0]} {a[1]}Q{c[0]} {c[1]} {b[0]} {b[1]}" for a, c, b in BOCA)
    partes.append(f'<path d="{boca}" fill="none" stroke="{ESCURO}" stroke-width="2" stroke-linecap="round"/>')
    return "".join(partes)


def pituca_svg(x, y, tamanho):
    return f'<g transform="translate({x:.2f} {y:.2f}) scale({tamanho / 100:.4f})">{pituca_elementos()}</g>'


def selo_svg(cor_fundo, cor_pata, cor_bolha):
    """Selo redondo com a Pituca e bolhas de espuma (64x64)."""
    t = 64
    return (f'<circle cx="32" cy="34" r="28" fill="{cor_fundo}"/>'
            f'{pituca_svg(32 - 50 * t / 100, 36 - 46 * t / 100, t)}'
            f'<circle cx="53" cy="12" r="7" fill="{BRANCO}" stroke="{cor_bolha}" stroke-width="2.2"/>'
            f'<circle cx="51" cy="10" r="2" fill="{cor_bolha}" opacity=".35"/>'
            f'<circle cx="62" cy="23" r="3.6" fill="{BRANCO}" stroke="{cor_bolha}" stroke-width="1.8"/>')


def gerar_logo(destino, cor_texto, cor_selo, cor_pata, cor_bolha, cor_pilula, cor_texto_pilula, titulo):
    baloo = fonte("Baloo 2", 800)
    tam_nome, tam_pets = 36, 13.5
    topo = 7
    base_nome = topo + altura_maiuscula(baloo, tam_nome)
    d_nome, larg_nome = texto_em_path(baloo, "PITUCO", tam_nome, 74, base_nome, espacamento=0.6)

    # Pílula "PETS" centralizada sob "PITUCO"
    pil_y, pil_h = base_nome + 4, 18
    _, larg_pets = texto_em_path(baloo, "PETS", tam_pets, 0, 0, espacamento=3)
    x_pets = 74 + (larg_nome - larg_pets) / 2
    base_pets = pil_y + pil_h / 2 + altura_maiuscula(baloo, tam_pets) / 2
    d_pets, _ = texto_em_path(baloo, "PETS", tam_pets, x_pets, base_pets, espacamento=3)

    largura = math.ceil(74 + larg_nome + 4)
    altura = math.ceil(pil_y + pil_h + 4)
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {largura} {altura}" width="{largura}" height="{altura}" role="img" aria-label="{titulo}">'
           f'<title>{titulo}</title>'
           f'<g transform="translate(0 {(altura - 64) / 2:.1f})">{selo_svg(cor_selo, cor_pata, cor_bolha)}</g>'
           f'<path fill="{cor_texto}" d="{d_nome}"/>'
           f'<rect x="74" y="{pil_y:.1f}" width="{larg_nome:.1f}" height="{pil_h}" rx="{pil_h / 2}" fill="{cor_pilula}"/>'
           f'<path fill="{cor_texto_pilula}" d="{d_pets}"/>'
           f'</svg>\n')
    destino.write_text(svg, encoding="utf-8")
    return largura, altura


def gerar_favicon(destino):
    svg = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">'
           f'<rect width="64" height="64" rx="16" fill="{ROXO}"/>'
           f'{pituca_svg(32 - 31, 33 - 45 * .62, 62)}'
           '</svg>\n')
    destino.write_text(svg, encoding="utf-8")


# ---------- PNG (Pillow) ----------
def _bezier(p0, p1, p2, p3, n=16):
    return [tuple((1 - t) ** 3 * a + 3 * (1 - t) ** 2 * t * b + 3 * (1 - t) * t ** 2 * c + t ** 3 * d
                  for a, b, c, d in zip(p0, p1, p2, p3)) for t in (i / n for i in range(1, n + 1))]


def _pontos_almofada():
    """Converte o path da almofada da pata (M, c, s, C, z) em uma lista de pontos."""
    tokens = re.findall(r"[MmCcSsZz]|-?\d*\.?\d+", PATA_ALMOFADA)
    pts, cur, ultimo_ctrl, i, cmd = [], (0.0, 0.0), None, 0, None
    while i < len(tokens):
        if tokens[i].isalpha():
            cmd = tokens[i]; i += 1
            if cmd in "Zz":
                continue
        nums = lambda k: [float(v) for v in tokens[i:i + k]]
        if cmd == "M":
            cur = tuple(nums(2)); pts.append(cur); i += 2
        elif cmd in "Cc":
            v = nums(6); i += 6
            rel = cmd == "c"
            c1 = (cur[0] + v[0], cur[1] + v[1]) if rel else (v[0], v[1])
            c2 = (cur[0] + v[2], cur[1] + v[3]) if rel else (v[2], v[3])
            fim = (cur[0] + v[4], cur[1] + v[5]) if rel else (v[4], v[5])
            pts += _bezier(cur, c1, c2, fim); ultimo_ctrl, cur = c2, fim
        elif cmd in "Ss":
            v = nums(4); i += 4
            c1 = (2 * cur[0] - ultimo_ctrl[0], 2 * cur[1] - ultimo_ctrl[1])
            c2 = (cur[0] + v[0], cur[1] + v[1]) if cmd == "s" else (v[0], v[1])
            fim = (cur[0] + v[2], cur[1] + v[3]) if cmd == "s" else (v[2], v[3])
            pts += _bezier(cur, c1, c2, fim); ultimo_ctrl, cur = c2, fim
    return pts


def desenhar_pata(draw, cx, cy, tamanho, cor):
    s = tamanho / 24
    ox, oy = cx - 12 * s, cy - 12.4 * s
    for x, y, r in PATA_DEDOS:
        draw.ellipse([ox + (x - r) * s, oy + (y - r) * s, ox + (x + r) * s, oy + (y + r) * s], fill=cor)
    draw.polygon([(ox + x * s, oy + y * s) for x, y in _pontos_almofada()], fill=cor)


def desenhar_pituca(draw, x, y, tamanho):
    """Desenha a Pituca (mesmas formas do SVG) com o canto da caixa 100x100 em (x, y)."""
    s = tamanho / 100

    def elipse(f, extra, cor):
        rx = f[3] + extra
        ry = (f[3] if f[0] == "c" else f[4]) + extra
        draw.ellipse([x + (f[1] - rx) * s, y + (f[2] - ry) * s, x + (f[1] + rx) * s, y + (f[2] + ry) * s], fill=cor)

    for g in PITUCA_GRUPOS:
        if g["contorno"]:
            for f in g["formas"]:
                elipse(f, g.get("traco", TRACO), CONTORNO)
        for f in g["formas"]:
            elipse(f, 0, g["cor"])
    pontos = []
    for (x0, y0), (cx1, cy1), (x1, y1) in BOCA:
        pontos += [((1 - t) ** 2 * x0 + 2 * (1 - t) * t * cx1 + t * t * x1, (1 - t) ** 2 * y0 + 2 * (1 - t) * t * cy1 + t * t * y1)
                   for t in (i / 12 for i in range(13))]
    draw.line([(x + px * s, y + py * s) for px, py in pontos], fill=ESCURO, width=max(1, round(2 * s)), joint="curve")


def gerar_icone(destino, px):
    k = 4  # desenha em 4x e reduz, para bordas suaves
    S = px * k
    im = Image.new("RGBA", (S, S), ROXO)
    d = ImageDraw.Draw(im)
    t = S * .9
    desenhar_pituca(d, S / 2 - t / 2, S * .53 - t * .45, t)
    im.resize((px, px), Image.LANCZOS).convert("RGB").save(destino, optimize=True)


def gerar_og(destino, foto):
    W, H, k = 1200, 630, 2
    im = Image.new("RGB", (W * k, H * k), ROXO_ESCURO)
    # fundo em degradê
    grad = Image.linear_gradient("L").rotate(-35, expand=True).resize((W * k, H * k))
    im = Image.composite(Image.new("RGB", im.size, ROXO_ESCURO), Image.new("RGB", im.size, ROXO), grad)
    d = ImageDraw.Draw(im, "RGBA")
    # bolhas decorativas
    for x, y, r in [(80, 560, 60), (560, 70, 34), (1150, 600, 90), (640, 560, 18), (40, 120, 22)]:
        d.ellipse([(x - r) * k, (y - r) * k, (x + r) * k, (y + r) * k], fill=(255, 255, 255, 22), outline=(255, 255, 255, 60), width=2 * k)

    # foto à direita (sem a faixa do slogan, que já está no texto), com borda branca e leve rotação
    f = Image.open(foto).convert("RGB")
    f = f.crop((40, int(f.height * .31), f.width, f.height))
    alt = 300 * k
    f = f.resize((int(f.width * alt / f.height), alt), Image.LANCZOS)
    borda = 12 * k
    quadro = Image.new("RGBA", (f.width + 2 * borda, f.height + 2 * borda), (0, 0, 0, 0))
    mask = Image.new("L", quadro.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, *quadro.size], radius=36 * k, fill=255)
    quadro.paste(Image.new("RGBA", quadro.size, BRANCO), (0, 0), mask)
    mask_f = Image.new("L", f.size, 0)
    ImageDraw.Draw(mask_f).rounded_rectangle([0, 0, *f.size], radius=26 * k, fill=255)
    quadro.paste(f, (borda, borda), mask_f)
    quadro = quadro.rotate(-3, resample=Image.BICUBIC, expand=True)
    sombra = Image.new("RGBA", quadro.size, (0, 0, 0, 0))
    sombra.paste((20, 0, 40, 120), (0, 0), quadro.split()[3])
    sombra = sombra.filter(ImageFilter.GaussianBlur(18 * k))
    px, py = W * k - quadro.width - 36 * k, (H * k - quadro.height) // 2
    im.paste(sombra, (px + 10 * k, py + 20 * k), sombra)
    im.paste(quadro, (px, py), quadro)

    # textos à esquerda, ajustados para não encostar na foto
    baloo = lambda t: ImageFont.truetype(str(fonte("Baloo 2", 800)), int(t * k))
    nunito = lambda t, p=700: ImageFont.truetype(str(fonte("Nunito", p)), int(t * k))
    x0 = 64 * k
    max_w = px - x0 - 36 * k

    def caber(texto, fabrica, tam):
        while d.textlength(texto, font=fabrica(tam)) > max_w and tam > 10:
            tam -= 1
        return fabrica(tam)

    # selo + nome
    d.ellipse([x0, 58 * k, x0 + 76 * k, 134 * k], fill=LIMAO)
    t = 70 * k
    desenhar_pituca(d, x0 + 38 * k - t / 2, 97 * k - t * .45, t)
    d.text((x0 + 92 * k, 50 * k), "PITUCO", font=baloo(60), fill=BRANCO)
    larg = d.textlength("PITUCO", font=baloo(60))
    d.rounded_rectangle([x0 + 92 * k, 118 * k, x0 + 92 * k + larg, 142 * k], radius=12 * k, fill=LIMAO)
    pets_l = d.textlength("P E T S", font=baloo(19))
    d.text((x0 + 92 * k + (larg - pets_l) / 2, 116 * k), "P E T S", font=baloo(19), fill=ROXO_ESCURO)

    f1 = caber("Banho é cuidado,", baloo, 58)
    d.text((x0, 200 * k), "Banho é cuidado,", font=f1, fill=BRANCO)
    t2 = "é bem-estar!"
    y2 = 200 * k + int(f1.size * 1.25)
    caixa = d.textbbox((x0 + 6 * k, y2), t2, font=f1)
    d.rounded_rectangle([caixa[0] - 14 * k, caixa[1] - 10 * k, caixa[2] + 14 * k, caixa[3] + 12 * k], radius=18 * k, fill=LIMAO)
    d.text((x0 + 6 * k, y2), t2, font=f1, fill=ROXO_ESCURO)
    linhas = ["Shampoos, condicionadores,", "leave-ins e perfumes para", "cães, gatos, coelhos e cavalos."]
    f3 = caber(max(linhas, key=len), lambda t: nunito(t, 600), 25)
    for i, linha in enumerate(linhas):
        d.text((x0, (382 + i * 36) * k), linha, font=f3, fill=(255, 255, 255, 225))
    pill = "Entregamos em todo o estado de SP"
    f4 = caber(pill + "    ", lambda t: nunito(t, 800), 21)
    pl = d.textlength(pill, font=f4)
    d.rounded_rectangle([x0, 528 * k, x0 + pl + 40 * k, 574 * k], radius=23 * k, fill=(255, 255, 255, 38))
    d.text((x0 + 20 * k, 536 * k), pill, font=f4, fill=LIMAO)

    im.resize((W, H), Image.LANCZOS).save(destino, "JPEG", quality=88, optimize=True, progressive=True)


if __name__ == "__main__":
    IMG.mkdir(parents=True, exist_ok=True)
    print("logo.svg", gerar_logo(IMG / "logo.svg", ROXO, ROXO, LIMAO, ROXO, LIMAO, ROXO_ESCURO, "Pituco Pets"))
    print("logo-branco.svg", gerar_logo(IMG / "logo-branco.svg", BRANCO, ROXO, ROXO, LIMAO, LIMAO, ROXO_ESCURO, "Pituco Pets"))
    gerar_favicon(IMG / "favicon.svg")
    # A Pituca sozinha: arquivo de referência e símbolo para o "sprite" de ícones do index.html
    (IMG / "pituca.svg").write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="Pituca">{pituca_elementos()}</svg>\n', encoding="utf-8")
    # Atualiza o símbolo da Pituca no index.html (as outras páginas copiam dele ao rodar gerar_paginas.py)
    index = RAIZ / "index.html"
    bruto = index.read_bytes().decode("utf-8")
    simbolo = f'<symbol id="ic-pituca" viewBox="0 0 100 100">{pituca_elementos()}</symbol>'
    novo = re.sub(r'<symbol id="ic-pituca".*?</symbol>', lambda m: simbolo, bruto, count=1, flags=re.S)
    if novo != bruto:
        index.write_bytes(novo.encode("utf-8"))
    for px, nome in [(180, "icon-180.png"), (192, "icon-192.png"), (512, "icon-512.png")]:
        gerar_icone(IMG / nome, px)
    gerar_og(IMG / "og-image.jpg", IMG / "hero-pets.webp")
    print("ok")
