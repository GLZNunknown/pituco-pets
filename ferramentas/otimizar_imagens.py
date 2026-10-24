"""
Otimiza as fotos da loja e liga cada uma ao produto certo, automaticamente.

COMO USAR
  1. Coloque as fotos originais (JPG, PNG ou WebP) em:
       fotos-originais/produtos/   → fotos dos produtos
       fotos-originais/clientes/   → fotos de clientes (só com autorização!)
  2. Dê às fotos de produto o NOME DO PRODUTO (o "slug"). Para ver a lista:
       python ferramentas/otimizar_imagens.py --listar
     Ex.: shampoo-limpeza-profunda.jpg, shampoo-limpeza-profunda-2.jpg (2ª foto da galeria)
  3. Rode:
       python ferramentas/otimizar_imagens.py

O script recorta cada foto em quadrado (centralizado), gera versões de 800 px e
400 px em WebP em assets/img/produtos/ (ou assets/img/clientes/) e atualiza o
arquivo js/fotos.js, que o site lê para mostrar as fotos no lugar das ilustrações.

Requer: Pillow  (pip install pillow)
"""
import json
import re
import sys
import unicodedata
from pathlib import Path

from PIL import Image, ImageOps

# O terminal do Windows usa cp1252 por padrão; força UTF-8 para imprimir acentos e símbolos
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

RAIZ = Path(__file__).resolve().parent.parent
ORIGEM = RAIZ / "fotos-originais"
DESTINO_PRODUTOS = RAIZ / "assets" / "img" / "produtos"
DESTINO_CLIENTES = RAIZ / "assets" / "img" / "clientes"
SAIDA_JS = RAIZ / "js" / "fotos.js"
EXTENSOES = {".jpg", ".jpeg", ".png", ".webp"}


def slugify(texto):
    texto = unicodedata.normalize("NFD", texto).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", texto.lower()).strip("-")


def slugs_dos_produtos():
    dados = (RAIZ / "js" / "data.js").read_text(encoding="utf-8")
    return re.findall(r'slug: "([\w-]+)", name: "([^"]+)"', dados)


def quadrado(im):
    im = ImageOps.exif_transpose(im)              # respeita a rotação de fotos de celular
    lado = min(im.size)
    x, y = (im.width - lado) // 2, (im.height - lado) // 2
    return im.crop((x, y, x + lado, y + lado))


def salvar_versoes(origem, destino_dir, base, tamanhos):
    im = Image.open(origem)
    if im.mode in ("RGBA", "LA", "P"):            # fundo branco em PNG transparente
        fundo = Image.new("RGB", im.size, "white")
        fundo.paste(im.convert("RGBA"), mask=im.convert("RGBA").split()[3])
        im = fundo
    im = quadrado(im.convert("RGB"))
    destino_dir.mkdir(parents=True, exist_ok=True)
    for t in tamanhos:
        v = im.resize((t, t), Image.LANCZOS) if im.width > t else im
        v.save(destino_dir / f"{base}-{t}.webp", "WEBP", quality=82, method=6)


def processar():
    slugs = {s for s, _ in slugs_dos_produtos()}
    fotos_produtos, fotos_clientes, avisos = {}, [], []

    for arq in sorted((ORIGEM / "produtos").glob("*")) if (ORIGEM / "produtos").exists() else []:
        if arq.suffix.lower() not in EXTENSOES:
            continue
        base = slugify(arq.stem)
        produto = re.sub(r"-\d+$", "", base) if base not in slugs else base
        if produto not in slugs:
            avisos.append(f"  ⚠️  {arq.name}: nenhum produto com o nome '{produto}'. Use --listar para ver os nomes.")
            continue
        salvar_versoes(arq, DESTINO_PRODUTOS, base, (800, 400))
        fotos_produtos.setdefault(produto, []).append(base)
        print(f"  ✓ {arq.name} → {produto}")

    for arq in sorted((ORIGEM / "clientes").glob("*")) if (ORIGEM / "clientes").exists() else []:
        if arq.suffix.lower() not in EXTENSOES:
            continue
        base = slugify(arq.stem)
        salvar_versoes(arq, DESTINO_CLIENTES, base, (600,))
        fotos_clientes.append(base)
        print(f"  ✓ {arq.name} → foto de cliente")

    # A foto "principal" é a sem número; as numeradas entram na galeria em ordem
    for produto, lista in fotos_produtos.items():
        lista.sort(key=lambda b: (b != produto, b))

    SAIDA_JS.write_text(
        "/* ARQUIVO GERADO AUTOMATICAMENTE por ferramentas/otimizar_imagens.py — não edite à mão.\n"
        "   Lista as fotos otimizadas de cada produto (por slug) e as fotos de clientes. */\n"
        "window.ZP = window.ZP || {};\n"
        f"ZP.photos = {json.dumps(fotos_produtos, ensure_ascii=False, indent=2)};\n"
        f"ZP.customerPhotos = {json.dumps(fotos_clientes, ensure_ascii=False)};\n",
        encoding="utf-8")

    print(f"\n{sum(map(len, fotos_produtos.values()))} foto(s) de produto e {len(fotos_clientes)} de cliente(s). js/fotos.js atualizado.")
    if avisos:
        print("\n".join(["", *avisos]))


if __name__ == "__main__":
    if "--listar" in sys.argv:
        print("Nomes para as fotos (slug → produto):\n")
        for slug, nome in slugs_dos_produtos():
            print(f"  {slug:42} {nome}")
    else:
        (ORIGEM / "produtos").mkdir(parents=True, exist_ok=True)
        (ORIGEM / "clientes").mkdir(parents=True, exist_ok=True)
        processar()
