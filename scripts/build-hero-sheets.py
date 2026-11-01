#!/usr/bin/env python3
"""Converte folhas de sprite geradas por IA (grade 8x5 sobre fundo magenta) em
folhas de pixel art prontas para o jogo, no estilo Kaetram.

Entrada: imagem com 6 linhas x 5 colunas (linhas 0-2 = andar frente/lado/costas, linhas 3-7 = ataques),
personagem virado para a direita, fundo magenta chapado.
Saída: PNG 5*F x 6*F (F = tamanho do quadro), pés de cada linha numa mesma base.

Uso: python3 scripts/build-hero-sheets.py entrada.png saida.png
"""
import sys
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

ROWS, COLS = 8, 5
FRAME = 48          # quadro final (px)
TARGET_H = 25       # altura do herói em pé no jogo (px)
BASE_Y = 44         # linha dos pés dentro do quadro
OUTLINE = (24, 16, 28, 255)


def key_magenta(rgb: np.ndarray) -> np.ndarray:
    r, g, b = (rgb[..., i].astype(int) for i in range(3))
    bg = (r - g > 90) & (b - g > 90) & (np.abs(r - b) < 90)
    return ~bg


def main(src: str, dst: str) -> None:
    im = Image.open(src).convert("RGB")
    W, H = im.size
    rgb = np.asarray(im)
    fg = key_magenta(rgb)
    fg = ndimage.binary_opening(fg, iterations=1)
    lab, n = ndimage.label(fg)
    objs = ndimage.find_objects(lab)
    cw, ch = W / COLS, H / ROWS
    comps = []  # (id, cy, cx, area)
    for i, sl in enumerate(objs, start=1):
        if sl is None:
            continue
        ys, xs = sl
        area = int((lab[sl] == i).sum())
        if area < 6:
            continue
        cy, cx = ndimage.center_of_mass(lab[sl] == i)
        comps.append((i, cy + ys.start, cx + xs.start, area))

    # A IA não alinha a grade com perfeição: k-means 1D nos centros das peças grandes.
    def centers(vals, weights, k, span):
        cs = np.array([(j + 0.5) * span / k for j in range(k)])
        for _ in range(20):
            idx = np.abs(vals[:, None] - cs[None, :]).argmin(axis=1)
            for j in range(k):
                sel = idx == j
                if sel.any():
                    cs[j] = np.average(vals[sel], weights=weights[sel])
        return np.sort(cs)

    big = [c for c in comps if c[3] > 400]
    w = np.array([c[3] for c in big], float)
    row_c = centers(np.array([c[1] for c in big]), w, ROWS, H)
    col_c = centers(np.array([c[2] for c in big]), w, COLS, W)
    cells: dict[tuple[int, int], list[int]] = {}
    for i, cy, cx, _ in comps:
        r = int(np.abs(row_c - cy).argmin())
        c = int(np.abs(col_c - cx).argmin())
        cells.setdefault((r, c), []).append(i)

    # Altura do herói em pé: mediana da linha de andar (lado).
    heights = []
    for c in range(COLS):
        ids = cells.get((0, c), [])
        if not ids:
            continue
        m = np.isin(lab, ids)
        yy = np.where(m.any(axis=1))[0]
        heights.append(yy[-1] - yy[0])
    stand_h = float(np.median(heights)) if heights else ch * 0.6
    scale = TARGET_H / stand_h

    alpha_full = np.zeros((H, W), np.uint8)
    out = Image.new("RGBA", (COLS * FRAME, ROWS * FRAME), (0, 0, 0, 0))
    rgba_src = np.dstack([rgb, alpha_full])

    for r in range(ROWS):
        # Base da linha = pé mais baixo dentro da linha (chão comum).
        bottoms = []
        masks = {}
        for c in range(COLS):
            ids = cells.get((r, c), [])
            if not ids:
                continue
            m = np.isin(lab, ids)
            masks[c] = m
            yy = np.where(m.any(axis=1))[0]
            bottoms.append(yy[-1])
        if not bottoms:
            continue
        base = float(np.median(bottoms))
        for c, m in masks.items():
            cx0 = col_c[c]
            # Recorte do quadro na escala original, centrado na célula.
            half = FRAME / scale / 2
            x0, x1 = int(cx0 - half), int(cx0 + half)
            y1 = int(base + (FRAME - BASE_Y) / scale)
            y0 = int(y1 - FRAME / scale)
            a = np.zeros((H, W), np.uint8)
            a[m] = 255
            rgba = rgba_src.copy()
            rgba[..., 3] = a
            # Desfaz contaminação magenta nas bordas.
            px = Image.fromarray(rgba, "RGBA")
            pad = Image.new("RGBA", (x1 - x0, y1 - y0), (0, 0, 0, 0))
            crop = px.crop((max(0, x0), max(0, y0), min(W, x1), min(H, y1)))
            pad.paste(crop, (max(0, x0) - x0, max(0, y0) - y0))
            small = pad.convert("RGBa").resize((FRAME, FRAME), Image.LANCZOS).convert("RGBA")
            arr = np.asarray(small).copy()
            alpha = arr[..., 3]
            solid = alpha > 110
            arr[..., 3] = np.where(solid, 255, 0)
            # Contorno escuro de 1px (marca do estilo Kaetram).
            ring = ndimage.binary_dilation(solid, structure=np.array([[0, 1, 0], [1, 1, 1], [0, 1, 0]])) & ~solid
            arr[ring] = OUTLINE
            frame = Image.fromarray(arr, "RGBA")
            out.alpha_composite(frame, (c * FRAME, r * FRAME))

    # Paleta reduzida para manter o visual de pixel art.
    rgb_q = out.convert("RGB").quantize(colors=48, method=Image.MEDIANCUT, dither=Image.NONE).convert("RGB")
    final = Image.merge("RGBA", (*rgb_q.split(), out.split()[3]))
    final.save(dst, optimize=True)
    print(f"{dst}: scale={scale:.3f} stand_h={stand_h:.0f}")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
