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


# ---------- Pituco: o mascote da marca ----------
# Poodle branquinho e cheio de personalidade, inspirado na Pituca (a poodle que deu origem à marca):
# mancha marrom bem clarinha na orelha direita, bandana verde-limão, bolhas de sabão no topete,
# piscadinha e linguinha de fora. Feito só de formas simples numa caixa 100x100, para sair igual
# no SVG (logo e site) e no PNG (ícones).
PELO, MANCHA, FOCINHO = "#ffffff", "#efd2ae", "#fff8f1"
SOMBRA = "#e9defb"            # sombra lilás clarinha nos cachos (dá volume ao pelo branco)
CONTORNO, ESCURO, LINGUA, BOCHECHA = "#3b2433", "#2b1d16", "#ff7fa3", "#ffaec7"
BANDANA, BANDANA_SOMBRA, PINTA = "#b6e61e", "#8fc10a", "#5b1fa8"
BOLHA, BOLHA_REFLEXO, BRILHO = "#cdeeff", "#ffd3ec", "#ffd23f"
TRACO = 3.2   # espessura do contorno (na caixa 100x100)


def _estrela(cx, cy, R, r, pontas=4):
    """Brilho em forma de estrela de 4 pontas."""
    pts = []
    for i in range(pontas * 2):
        ang = math.pi / pontas * i - math.pi / 2
        raio = R if i % 2 == 0 else r
        pts.append((round(cx + raio * math.cos(ang), 2), round(cy + raio * math.sin(ang), 2)))
    return ("p", pts)


def _luz(formas, dx=-1.3, dy=-1.7, encolhe=2.4):
    """Para cada cacho, um círculo de luz um pouco menor e deslocado para cima/esquerda (a sombra fica embaixo/direita)."""
    out = []
    for f in formas:
        if f[0] == "c":
            out.append(("c", f[1] + dx, f[2] + dy, f[3] - encolhe))
        elif f[0] == "e":
            out.append(("e", f[1] + dx, f[2] + dy, f[3] - encolhe, f[4] - encolhe))
    return out


ORELHAS = [("c", 29, 50, 10), ("c", 25, 61, 10.5), ("c", 27, 72, 10), ("c", 71, 50, 10), ("c", 75, 61, 10.5), ("c", 73, 72, 10)]
TOPETE = [("c", 39, 27, 11), ("c", 61, 27, 11), ("c", 50, 19, 12.5), ("c", 50, 31, 11)]
ROSTO = [("e", 50, 53, 18.5, 20)]


def _bolha(cx, cy, r, traco):
    return [
        {"cor": BOLHA, "contorno": True, "traco": traco, "formas": [("c", cx, cy, r)]},
        {"cor": BOLHA_REFLEXO, "contorno": False, "formas": [("c", cx + r * .25, cy + r * .25, r * .62)]},
        {"cor": BOLHA, "contorno": False, "formas": [("c", cx + r * .05, cy + r * .05, r * .5)]},
        {"cor": PELO, "contorno": False, "formas": [("c", cx - r * .38, cy - r * .38, r * .3)]},
    ]


# Cada grupo recebe UM contorno em volta do conjunto (sem riscos entre as bolinhas).
# Formas: ("c", cx, cy, r) círculo | ("e", cx, cy, rx, ry) elipse | ("p", [(x, y), ...]) polígono
PITUCO_GRUPOS = [
    # orelhas: base em sombra + luz em cada cacho
    {"cor": SOMBRA, "contorno": True, "formas": ORELHAS},
    {"cor": PELO, "contorno": False, "formas": _luz(ORELHAS)},
    # mancha marrom clarinha na orelha direita dele (homenagem à Pituca)
    {"cor": MANCHA, "contorno": False, "formas": [("c", 23.8, 61.2, 6.8), ("c", 26.3, 70.8, 6.2)]},
    # cabeça + topete numa silhueta só, com volume em cada cacho e rosto bem branquinho
    {"cor": SOMBRA, "contorno": True, "formas": ROSTO + TOPETE},
    {"cor": PELO, "contorno": False, "formas": _luz(TOPETE)},
    {"cor": PELO, "contorno": False, "formas": _luz(ROSTO, dx=-1, dy=-1.4, encolhe=2)},
    # bandana verde-limão com sombra e bolinhas roxas
    {"cor": BANDANA, "contorno": True, "formas": [("p", [(32, 70.5), (68, 70.5), (50, 91)])]},
    {"cor": BANDANA_SOMBRA, "contorno": False, "formas": [("p", [(41.5, 81.5), (58.5, 81.5), (50, 91)])]},
    {"cor": PINTA, "contorno": False, "formas": [("c", 42.5, 75.5, 1.9), ("c", 57.5, 75.5, 1.9), ("c", 50, 82.5, 1.9)]},
    # bolhas de sabão furta-cor saindo do topete
    *_bolha(75, 15, 6.4, 2.2), *_bolha(84.5, 26.5, 3.9, 2.0), *_bolha(66, 6.5, 3.1, 1.8),
    # brilhinho amarelo do outro lado do topete
    {"cor": BRILHO, "contorno": True, "traco": 1.6, "formas": [_estrela(19, 21, 6.2, 2.1)]},
    {"cor": BRILHO, "contorno": True, "traco": 1.3, "formas": [_estrela(11, 33, 3.4, 1.2)]},
    # focinho
    {"cor": FOCINHO, "contorno": True, "traco": 2.2, "formas": [("e", 50, 64.5, 10, 8.5)]},
    # linguinha de fora
    {"cor": LINGUA, "contorno": True, "traco": 1.8, "formas": [("e", 52.5, 71, 3.4, 3.8)]},
    {"cor": "#ff5f8c", "contorno": False, "formas": [("e", 52.6, 72.2, .7, 1.8)]},
    # bochechas, olho aberto (o outro pisca), dois reflexos no olho e nariz brilhante
    {"cor": BOCHECHA, "contorno": False, "formas": [("e", 36.5, 58.8, 4, 3.2), ("e", 63.5, 58.8, 4, 3.2)]},
    {"cor": ESCURO, "contorno": False, "formas": [("c", 42.5, 50.5, 4.3), ("e", 50, 59.8, 5.1, 3.8)]},
    {"cor": PELO, "contorno": False, "formas": [("c", 43.9, 48.9, 1.6), ("c", 41.4, 52.1, .7), ("e", 48.5, 58.6, 1.5, .95)]},
]
# Traços (curvas): (lista de curvas quadráticas (início, controle, fim), espessura)
PITUCO_TRACOS = [
    ([((53.2, 51.2), (57.5, 46.6), (61.8, 51.2))], 2.6),                     # piscadinha
    ([((38.4, 44.2), (42.5, 41.2), (46.6, 43.6))], 1.9),                     # sobrancelha levantada
    ([((45.6, 66.4), (47.8, 69.2), (50, 66.4)), ((50, 66.4), (52.2, 69.2), (54.4, 66.4))], 2.0),   # boquinha
]


def _forma_svg(f, extra=0, cor="#000"):
    if f[0] == "c":
        return f'<circle cx="{f[1]}" cy="{f[2]}" r="{f[3] + extra}" fill="{cor}"/>'
    if f[0] == "e":
        return f'<ellipse cx="{f[1]}" cy="{f[2]}" rx="{f[3] + extra}" ry="{f[4] + extra}" fill="{cor}"/>'
    pts = " ".join(f"{x},{y}" for x, y in f[1])
    traco = f' stroke="{cor}" stroke-width="{2 * extra}" stroke-linejoin="round"' if extra else ""
    return f'<polygon points="{pts}" fill="{cor}"{traco}/>'


def pituco_elementos(contorno=CONTORNO):
    """Elementos SVG do Pituco na caixa 0..100."""
    partes = []
    for g in PITUCO_GRUPOS:
        if g["contorno"]:
            t = g.get("traco", TRACO)
            partes += [_forma_svg(f, extra=t, cor=contorno) for f in g["formas"]]   # silhueta escura levemente maior
        partes += [_forma_svg(f, cor=g["cor"]) for f in g["formas"]]                  # preenchimento por cima
    for curvas, largura in PITUCO_TRACOS:
        d = "".join(f"M{a[0]} {a[1]}Q{c[0]} {c[1]} {b[0]} {b[1]}" for a, c, b in curvas)
        partes.append(f'<path d="{d}" fill="none" stroke="{ESCURO}" stroke-width="{largura}" stroke-linecap="round"/>')
    return "".join(partes)


def pituco_svg(x, y, tamanho):
    return f'<g transform="translate({x:.2f} {y:.2f}) scale({tamanho / 100:.4f})">{pituco_elementos()}</g>'


def selo_svg(cor_fundo, cor_pata, cor_bolha, gid="g"):
    """Selo redondo com o Pituco (64x64): degradê roxo, anel verde-limão e pontinhos de brilho."""
    t = 62
    brilhos = "".join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="#ffffff" opacity="{o}"/>'
                      for x, y, r, o in [(9, 20, 1.1, .9), (56, 48, 1, .8), (12, 50, .8, .7)])
    return (f'<defs><radialGradient id="{gid}" cx="40%" cy="35%" r="70%">'
            f'<stop offset="0" stop-color="#8a4ff0"/><stop offset=".6" stop-color="{cor_fundo}"/><stop offset="1" stop-color="#3f1478"/>'
            f'</radialGradient></defs>'
            f'<circle cx="32" cy="34" r="29" fill="url(#{gid})"/>'
            f'<circle cx="32" cy="34" r="26.6" fill="none" stroke="{LIMAO}" stroke-width="1.7" stroke-dasharray="3.5 2.2" opacity=".95"/>'
            f'{brilhos}'
            f'{pituco_svg(32 - 50 * t / 100, 35 - 48 * t / 100, t)}')


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
           f'<g transform="translate(0 {(altura - 64) / 2:.1f})">{selo_svg(cor_selo, cor_pata, cor_bolha, gid='selo-' + destino.stem)}</g>'
           f'<path fill="{cor_texto}" d="{d_nome}"/>'
           f'<rect x="74" y="{pil_y:.1f}" width="{larg_nome:.1f}" height="{pil_h}" rx="{pil_h / 2}" fill="{cor_pilula}"/>'
           f'<path fill="{cor_texto_pilula}" d="{d_pets}"/>'
           f'</svg>\n')
    destino.write_text(svg, encoding="utf-8")
    return largura, altura


def gerar_favicon(destino):
    svg = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">'
           '<defs><radialGradient id="f" cx="40%" cy="35%" r="75%"><stop offset="0" stop-color="#8a4ff0"/>'
           f'<stop offset=".6" stop-color="{ROXO}"/><stop offset="1" stop-color="#3f1478"/></radialGradient></defs>'
           '<rect width="64" height="64" rx="16" fill="url(#f)"/>'
           f'{pituco_svg(32 - 33, 33 - 48 * .66, 66)}'
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


def desenhar_pituco(draw, x, y, tamanho):
    """Desenha o Pituco (mesmas formas do SVG) com o canto da caixa 100x100 em (x, y)."""
    s = tamanho / 100
    P = lambda px, py: (x + px * s, y + py * s)

    def forma(f, extra, cor):
        if f[0] == "p":
            pts = [P(px, py) for px, py in f[1]]
            if extra:
                w = 2 * extra * s
                draw.line(pts + [pts[0]], fill=cor, width=round(w), joint="curve")
                for px, py in pts:
                    draw.ellipse([px - w / 2, py - w / 2, px + w / 2, py + w / 2], fill=cor)
            draw.polygon(pts, fill=cor)
            return
        rx = f[3] + extra
        ry = (f[3] if f[0] == "c" else f[4]) + extra
        draw.ellipse([*P(f[1] - rx, f[2] - ry), *P(f[1] + rx, f[2] + ry)], fill=cor)

    for g in PITUCO_GRUPOS:
        if g["contorno"]:
            for f in g["formas"]:
                forma(f, g.get("traco", TRACO), CONTORNO)
        for f in g["formas"]:
            forma(f, 0, g["cor"])
    for curvas, largura in PITUCO_TRACOS:
        pontos = []
        for (x0, y0), (cx1, cy1), (x1, y1) in curvas:
            pontos += [P((1 - t) ** 2 * x0 + 2 * (1 - t) * t * cx1 + t * t * x1, (1 - t) ** 2 * y0 + 2 * (1 - t) * t * cy1 + t * t * y1)
                       for t in (i / 14 for i in range(15))]
        draw.line(pontos, fill=ESCURO, width=max(1, round(largura * s)), joint="curve")


def _degrade_radial(S, centro, cores):
    """Fundo em degradê radial (lista de (posição 0..1, cor RGB)) desenhado em anéis concêntricos."""
    im = Image.new("RGB", (S, S), cores[-1][1])
    d = ImageDraw.Draw(im)
    raio_max = S * 0.95
    passos = 90
    for i in range(passos, 0, -1):
        t = i / passos
        for (p0, c0), (p1, c1) in zip(cores, cores[1:]):
            if p0 <= t <= p1:
                u = (t - p0) / (p1 - p0)
                cor = tuple(round(a + (b - a) * u) for a, b in zip(c0, c1))
                break
        r = raio_max * t
        d.ellipse([centro[0] - r, centro[1] - r, centro[0] + r, centro[1] + r], fill=cor)
    return im


def gerar_icone(destino, px):
    k = 4  # desenha em 4x e reduz, para bordas suaves
    S = px * k
    im = _degrade_radial(S, (S * .42, S * .36), [(0, (138, 79, 240)), (.6, (91, 31, 168)), (1, (63, 20, 120))])
    d = ImageDraw.Draw(im)
    for fx, fy, fr in [(.12, .18, .012), (.86, .74, .01), (.15, .8, .008)]:
        d.ellipse([S * (fx - fr), S * (fy - fr), S * (fx + fr), S * (fy + fr)], fill="#ffffff")
    t = S * .98
    desenhar_pituco(d, S / 2 - t / 2, S * .52 - t * .48, t)
    im.resize((px, px), Image.LANCZOS).save(destino, optimize=True)


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
    desenhar_pituco(d, x0 + 38 * k - t / 2, 97 * k - t * .48, t)
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
    # O Pituco sozinho: arquivo de referência e símbolo para o "sprite" de ícones do index.html
    (IMG / "pituco.svg").write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="Pituco">{pituco_elementos()}</svg>\n', encoding="utf-8")
    # Atualiza o símbolo do Pituco no index.html (as outras páginas copiam dele ao rodar gerar_paginas.py)
    index = RAIZ / "index.html"
    bruto = index.read_bytes().decode("utf-8")
    simbolo = f'<symbol id="ic-pituco" viewBox="0 0 100 100">{pituco_elementos()}</symbol>'
    novo = re.sub(r'<symbol id="ic-pitu[ca]o?a?".*?</symbol>', lambda m: simbolo, bruto, count=1, flags=re.S)
    if novo != bruto:
        index.write_bytes(novo.encode("utf-8"))
    for px, nome in [(180, "icon-180.png"), (192, "icon-192.png"), (512, "icon-512.png")]:
        gerar_icone(IMG / nome, px)
    gerar_og(IMG / "og-image.jpg", IMG / "hero-pets.webp")
    print("ok")
