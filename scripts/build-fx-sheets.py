#!/usr/bin/env python3
"""Converte folhas de efeitos especiais geradas por IA (grade 4x5 sobre fundo preto,
sem personagens) numa única folha de efeitos pronta para o jogo.

Cada linha da entrada é um efeito com 5 quadros. O preto vira transparência
(alfa = canal mais claro), então o brilho é preservado sobre qualquer chão.

Uso: python3 scripts/build-fx-sheets.py saida.png fx1.png fx2.png ...
"""
import sys
import numpy as np
from PIL import Image

ROWS, COLS = 4, 5
FRAME = 64


def frames(path: str):
    im = Image.open(path).convert("RGB")
    W, H = im.size
    cw, ch = W / COLS, H / ROWS
    rgb = np.asarray(im).astype(np.float32) / 255.0
    out = []
    for r in range(ROWS):
        row = []
        for c in range(COLS):
            cell = rgb[int(r * ch):int((r + 1) * ch), int(c * cw):int((c + 1) * cw)]
            a = cell.max(axis=2)
            a = np.where(a < 0.07, 0.0, a)
            pre = Image.fromarray((cell * (a > 0)[..., None] * 255).astype(np.uint8))
            al = Image.fromarray((a * 255).astype(np.uint8))
            pre = np.asarray(pre.resize((FRAME, FRAME), Image.BOX)).astype(np.float32)
            al = np.asarray(al.resize((FRAME, FRAME), Image.BOX)).astype(np.float32)
            # Alfa em degraus mantém a leitura de pixel art.
            q = np.clip(np.round(al / 255 * 5) / 5, 0, 1)
            q = np.where(al / 255 < 0.1, 0, np.maximum(q, 0.2 * (al > 0)))
            col = np.clip(pre / np.maximum(al[..., None] / 255, 1e-3), 0, 255)
            px = np.dstack([col, q * 255]).astype(np.uint8)
            row.append(Image.fromarray(px, "RGBA"))
        out.append(row)
    return out


def main(dst: str, srcs: list[str]) -> None:
    rows = [row for s in srcs for row in frames(s)]
    sheet = Image.new("RGBA", (COLS * FRAME, len(rows) * FRAME))
    for r, row in enumerate(rows):
        for c, f in enumerate(row):
            sheet.paste(f, (c * FRAME, r * FRAME))
    sheet.save(dst, optimize=True)
    print(dst, sheet.size, len(rows), "efeitos")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2:])
