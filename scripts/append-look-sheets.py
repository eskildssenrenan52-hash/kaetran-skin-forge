# Acrescenta 8 novos acessórios (folha bruta IA 8x3 sobre magenta) à direita de public/look/<nome>.png.
# Uso: python3 scripts/append-look-sheets.py   (lê assets/look-gen/<nome>2.png)
from PIL import Image
import numpy as np
from scipy import ndimage
CELLS = {"hats": (36, 32, False), "horns": (40, 28, False), "capes": (32, 36, True), "wings": (64, 40, False), "eyes": (24, 12, False), "extras": (36, 24, False)}
for name, (cw, ch, top) in CELLS.items():
    im = Image.open(f"assets/look-gen/{name}2.png").convert("RGBA")
    a = np.asarray(im).copy()
    r, g, b = (a[..., i].astype(int) for i in range(3))
    bg = (r - g > 70) & (b - g > 70)
    a[..., 3] = np.where(bg, 0, 255)
    im = Image.fromarray(a)
    W, H = im.size
    cells = [[None]*3 for _ in range(8)]
    for col in range(8):
        for row in range(3):
            c = im.crop((col*W//8, row*H//3, (col+1)*W//8, (row+1)*H//3)); bb = c.getbbox()
            if bb: cells[col][row] = c.crop(bb)
    old = Image.open(f"public/look/{name}.png").convert("RGBA")
    oc = 8  # mantém só as 8 originais (idempotente)
    out = Image.new("RGBA", ((oc + 8) * cw, ch * 3), (0, 0, 0, 0))
    out.alpha_composite(old.crop((0, 0, oc * cw, ch * 3)), (0, 0))
    for col in range(8):
        cs = [c for c in cells[col] if c]
        if not cs: print("missing", name, col); continue
        s = min(min(cw / c.width, ch / c.height) for c in cs)
        for row, cell in enumerate(cells[col]):
            if not cell: continue
            cell = cell.resize((max(1, round(cell.width * s)), max(1, round(cell.height * s))), Image.LANCZOS)
            cell.putalpha(cell.getchannel("A").point(lambda v: 255 if v > 110 else 0))
            y = row * ch + (0 if top else ch - cell.height)
            out.alpha_composite(cell, ((oc + col) * cw + (cw - cell.width) // 2, y))
    if name == "hats":  # abre o rosto do capuz do mago (vista frontal)
        px = out.load(); x0 = 8 * cw; bb = out.crop((x0, 0, x0 + cw, ch)).getbbox()
        if bb:
            l, t, r, b = bb; w, h = r - l, b - t
            for y in range(t + int(h * .3), b):
                for x in range(l + int(w * .25), r - int(w * .25)):
                    R, G, B, A = px[x0 + x, y]
                    if A and max(R, G, B) < 45: px[x0 + x, y] = (0, 0, 0, 0)
    out.save(f"public/look/{name}.png"); print(name, out.size)
