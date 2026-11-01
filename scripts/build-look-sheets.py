# Fatia as folhas de acessórios pintadas por IA (8 colunas × 3 linhas: frente, lado direito, costas)
# em atlas de 8×3 células para o personagem Kaetram.
# Uso: python3 scripts/build-look-sheets.py <pasta-com-png-brutos>
import sys
from PIL import Image
SRC = sys.argv[1] if len(sys.argv) > 1 else "/tmp/look-gen"
# célula final (px, já em 2x da escala do jogo); top=True alinha pelo topo (capas penduradas nos ombros)
CELLS = {"hats": (36, 32, False), "horns": (40, 28, False), "capes": (32, 36, True), "wings": (64, 40, False), "eyes": (24, 12, False), "extras": (36, 24, False)}

def is_bg(r, g, b):
    return r > 150 and b > 150 and g < 120

for name, (cw, ch, top) in CELLS.items():
    im = Image.open(f"{SRC}/{name}.png").convert("RGBA")
    W, H = im.size; gw, gh = W / 8, H / 3
    px = im.load()
    for y in range(H):
        for x in range(W):
            r, g, b, a = px[x, y]
            px[x, y] = (0, 0, 0, 0) if a < 128 or is_bg(r, g, b) else (r, g, b, 255)
    out = Image.new("RGBA", (cw * 8, ch * 3), (0, 0, 0, 0))
    for col in range(8):
        cells = []
        for row in range(3):
            cell = im.crop((round(col * gw), round(row * gh), round((col + 1) * gw), round((row + 1) * gh)))
            cells.append((cell.crop(cell.getbbox()) if cell.getbbox() else None))
        # mesma escala nas 3 vistas do item para o tamanho não "pular" ao virar
        s = min(min(cw / c.width, ch / c.height) for c in cells if c)
        for row, cell in enumerate(cells):
            if not cell: continue
            cell = cell.resize((max(1, round(cell.width * s)), max(1, round(cell.height * s))), Image.LANCZOS)
            cell.putalpha(cell.getchannel("A").point(lambda v: 255 if v > 110 else 0))
            y = row * ch + (0 if top else ch - cell.height)
            out.alpha_composite(cell, (col * cw + (cw - cell.width) // 2, y))
    out.save(f"public/look/{name}.png")
    print(name, out.size)
