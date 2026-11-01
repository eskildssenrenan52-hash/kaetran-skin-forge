// Efeitos especiais pintados por IA (sem personagem): 80 efeitos × 5 quadros em public/fx/fx.png.
// Quadros de 64 px; o brilho já vem com transparência, então desenha sobre qualquer chão.
// Cada instância pode ter um giro de matiz (h) — combinado com o efeito, isso dá a cada
// ataque do jogo uma assinatura visual própria (ver fx-catalog.ts).
// Estado é transitório (nunca vai para o save).

export const FX_NAMES = [
  "explosion", "slash", "lightning", "ice",
  "void", "holy", "poison", "wind",
  "earth", "water", "arcane", "impact",
  "meteor", "nature", "shock", "blood",
  // Segunda leva pintada por IA (out/2026).
  "firestorm", "crescent", "crystal", "claws",
  "acid", "sonic", "starburst", "thorns",
  "geyser", "frost", "skull", "sunbeam",
  "bubbles", "sandstorm", "rune", "orb",
  "petals", "blackhole", "breath", "bones",
  "prism", "spores", "xspark", "wisps",
  // Lotes adicionais gerados por IA: combate, magia, ambiente, utilidades, pets e chefes.
  "fireburst", "lava", "iceburst", "thunderclap",
  "renewal", "barrier", "goldenrune", "shadowstep",
  "miasma", "corrosion", "leafwhirl", "sonicwave",
  "treasure", "ripple", "campfire", "petalswarm",
  "bondhearts", "levelup", "spiritglow", "enrage",
  "arrowtrail", "missiletrail", "spearwind", "parry",
  "summoning", "shieldbreak", "phasechange", "bossdefeat",
  "potionglow", "craftspark", "portal", "discovery",
  "snowpuff", "raindrop", "sandgust", "leafswirl",
  "pettail", "petclaw", "petfood", "hatch",
] as const;
export type FxName = (typeof FX_NAMES)[number];

/** Efeitos que nascem do chão: ancorados pela base em vez do centro. */
export const GROUND_FX = new Set<FxName>([
  "lightning", "holy", "poison", "earth", "water", "arcane", "meteor", "shock", "wind",
  "firestorm", "crystal", "acid", "geyser", "sunbeam", "bubbles", "sandstorm", "rune", "bones", "spores",
  "lava", "thunderclap", "barrier", "goldenrune", "miasma", "corrosion", "leafwhirl", "ripple", "campfire",
  "summoning", "shieldbreak", "portal", "snowpuff", "raindrop", "sandgust", "leafswirl",
]);
const FRAME = 64, FRAMES = 5;

export interface FxInst { n: number; x: number; y: number; t: number; dur: number; sc: number; flip: boolean; rot: number; h: number }

let img: HTMLImageElement | null | undefined;
function sheet(): HTMLImageElement | null {
  if (img === undefined) {
    if (typeof Image === "undefined") { img = null; return null; }
    img = new Image(); img.src = "fx/fx.png?v=4";
  }
  return img && img.complete && img.naturalWidth ? img : null;
}
/** Pré-carrega a folha (chamado no início do jogo e na tela de aparência). */
export const preloadFx = () => { sheet(); };

/** Linha recolorida (giro de matiz), gerada uma vez e guardada em cache. */
const tinted = new Map<number, HTMLCanvasElement | null>();
function tintedRow(im: HTMLImageElement, n: number, h: number): HTMLCanvasElement | null {
  const key = n * 1000 + h;
  if (tinted.has(key)) return tinted.get(key)!;
  let cv: HTMLCanvasElement | null = null;
  try {
    cv = document.createElement("canvas"); cv.width = FRAME * FRAMES; cv.height = FRAME;
    const x = cv.getContext("2d"); if (!x) throw new Error("sem 2d");
    x.drawImage(im, 0, n * FRAME, FRAME * FRAMES, FRAME, 0, 0, FRAME * FRAMES, FRAME);
    const d = x.getImageData(0, 0, cv.width, cv.height), p = d.data;
    const a = (h * Math.PI) / 180, cs = Math.cos(a), sn = Math.sin(a);
    // Matriz de rotação de matiz (preserva luminância aproximada).
    const m = [
      0.213 + cs * 0.787 - sn * 0.213, 0.715 - cs * 0.715 - sn * 0.715, 0.072 - cs * 0.072 + sn * 0.928,
      0.213 - cs * 0.213 + sn * 0.143, 0.715 + cs * 0.285 + sn * 0.140, 0.072 - cs * 0.072 - sn * 0.283,
      0.213 - cs * 0.213 - sn * 0.787, 0.715 - cs * 0.715 + sn * 0.715, 0.072 + cs * 0.928 + sn * 0.072,
    ] as const;
    for (let i = 0; i < p.length; i += 4) {
      if (!p[i + 3]) continue;
      const r = p[i]!, g = p[i + 1]!, b = p[i + 2]!;
      p[i] = m[0] * r + m[1] * g + m[2] * b; p[i + 1] = m[3] * r + m[4] * g + m[5] * b; p[i + 2] = m[6] * r + m[7] * g + m[8] * b;
    }
    x.putImageData(d, 0, 0);
  } catch { cv = null; }
  tinted.set(key, cv);
  return cv;
}

export function makeFx(name: FxName, x: number, y: number, sc = 0.6, flip = false, dur = 0.34, rot = 0, h = 0): FxInst {
  return { n: Math.max(0, FX_NAMES.indexOf(name)), x, y, t: 0, dur, sc, flip, rot, h };
}

export function tickFx(list: FxInst[], dt: number): FxInst[] {
  for (const f of list) f.t += dt;
  return list.filter((f) => f.t < f.dur);
}

export function drawFxInst(c: CanvasRenderingContext2D, f: FxInst, alpha = 1): boolean {
  const im = sheet(); if (!im) return false;
  const k = Math.min(FRAMES - 1, Math.floor((f.t / f.dur) * FRAMES));
  const s = FRAME * f.sc;
  const ground = GROUND_FX.has(FX_NAMES[f.n] ?? "impact");
  const row = f.h ? tintedRow(im, f.n, f.h) : null;
  c.save();
  c.globalAlpha *= alpha;
  c.translate(Math.round(f.x), Math.round(f.y));
  if (f.rot) c.rotate(f.rot);
  if (f.flip) c.scale(-1, 1);
  if (row) c.drawImage(row, k * FRAME, 0, FRAME, FRAME, -s / 2, ground ? -s * 0.86 : -s / 2, s, s);
  else c.drawImage(im, k * FRAME, f.n * FRAME, FRAME, FRAME, -s / 2, ground ? -s * 0.86 : -s / 2, s, s);
  c.restore();
  return true;
}

export function drawFx(c: CanvasRenderingContext2D, list: FxInst[]) {
  for (const f of list) drawFxInst(c, f);
}
