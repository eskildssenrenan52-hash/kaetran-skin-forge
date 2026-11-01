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
    fg = ~bg
    lab, n = ndimage.label(ndimage.binary_dilation(fg, iterations=6))
    # agrupa componentes por célula usando centro
    cells = [[None]*3 for _ in range(8)]
    boxes = {}
    for i, sl in enumerate(ndimage.find_objects(lab), 1):
        ys, xs = sl
        if (ys.stop-ys.start)*(xs.stop-xs.start) < 300: continue
        cy, cx = (ys.start+ys.stop)/2, (xs.start+xs.stop)/2
        col, row = min(7, int(cx / (W/8))), min(2, int(cy / (H/3)))
        bb = boxes.get((col,row))
        boxes[(col,row)] = (xs.start, ys.start, xs.stop, ys.stop) if not bb else (min(bb[0],xs.start), min(bb[1],ys.start), max(bb[2],xs.stop), max(bb[3],ys.stop))
    for (col,row), bb in boxes.items():
        c = im.crop(bb); cells[col][row] = c.crop(c.getbbox())
    old = Image.open(f"public/look/{name}.png").convert("RGBA")
    oc = old.width // cw
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
    out.save(f"public/look/{name}.png"); print(name, out.size)
