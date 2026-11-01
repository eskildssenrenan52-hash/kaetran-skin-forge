# Converte repinturas por IA da folha base (4x upscale, fundo magenta) em skins 128x384,
# mantendo a silhueta exata da base para as animações não "pularem".
# Uso: python3 scripts/build-ai-skins.py nome1 nome2 ...  (lê assets/look-gen/skin_<nome>.png)
import sys
import numpy as np
from PIL import Image
base = np.asarray(Image.open("public/kaetram/img/sprites/player/base.png").convert("RGBA"))
for name in sys.argv[1:]:
    ai = np.asarray(Image.open(f"assets/look-gen/skin_{name}.png").convert("RGB").resize((512, 1536), Image.LANCZOS)).astype(int)
    out = np.zeros_like(base)
    H, W = base.shape[:2]
    for y in range(H):
        for x in range(W):
            if base[y, x, 3] < 10: continue
            blk = ai[y*4+1:y*4+3, x*4+1:x*4+3].reshape(-1, 3)
            r, g, b = blk.mean(axis=0)
            if r - g > 90 and b - g > 90:  # magenta vazou: usa cor da base escurecida
                r, g, b = base[y, x, :3] * 0.6
            out[y, x] = (r, g, b, 255)
    Image.fromarray(out.astype(np.uint8)).save(f"public/hero-skins/{name}.png")
    print(name)
