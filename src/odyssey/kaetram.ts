// Sprites trazidos do primeiro jogo (Kaetram, MPL-2.0): herói, skins, armas e criaturas usadas como pets.
// O catálogo (url, tamanho do quadro, deslocamento e animações) fica em kaetram-sprites.json.
// As imagens carregam sob demanda; enquanto não chegam, quem chama desenha o visual antigo.
import SHEETS from "./kaetram-sprites.json";

export interface KSheet { url: string; w?: number; h?: number; ox?: number; oy?: number; anims?: Record<string, [number, number]>; idle?: number }
/** Cópia do catálogo: outras folhas (ex.: skins de IA em /hero) entram aqui sem alterar o JSON importado. */
export const K_SHEETS: Record<string, KSheet> = { ...(SHEETS as unknown as Record<string, KSheet>) };

const byCategory = new Map<string, string[]>();
for (const key of Object.keys(K_SHEETS).sort()) {
  const category = key.split("/", 1)[0]!;
  const list = byCategory.get(category) ?? [];
  list.push(key);
  byCategory.set(category, list);
}

/** Catálogo indexado: evita varrer as 1.316 entradas a cada frame. */
export const kKeys = (category: string) => byCategory.get(category) ?? [];

const normalize = (value: string) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ");

/** Escolhe um sprite por função; seed mantém o cenário estável e distribui a coleção. */
export function kPick(category: string, query = "", seed = 0): string | undefined {
  const keys = kKeys(category);
  if (!keys.length) return undefined;
  const tokens = normalize(query).split(" ").filter(Boolean);
  const ranked = keys.map((key) => {
    const name = normalize(key.slice(category.length + 1));
    const score = tokens.reduce((sum, token) => sum + (name.includes(token) ? 3 : 0), 0);
    return { key, score };
  }).sort((a, b) => b.score - a.score || a.key.localeCompare(b.key));
  const topScore = ranked[0]?.score ?? 0;
  const pool = ranked.filter((entry) => entry.score === topScore);
  return pool[Math.abs(Math.floor(seed)) % pool.length]?.key ?? keys[Math.abs(Math.floor(seed)) % keys.length];
}

/** Seleciona um sprite ambiental real do Kaetram, com fallback por categoria. */
export function kWorldSheet(kind: "tree" | "rock" | "bush" | "object", query = "", seed = 0): string | undefined {
  const category = kind === "tree" ? "trees" : kind === "rock" ? "rocks" : kind === "bush" ? "bushes" : "objects";
  return kPick(category, query, seed);
}

const cache = new Map<string, HTMLImageElement | null>();
export function kImage(key: string): HTMLImageElement | null {
  const hit = cache.get(key);
  if (hit !== undefined) return hit && hit.complete && hit.naturalWidth ? hit : null;
  const def = K_SHEETS[key];
  if (!def || typeof Image === "undefined") { cache.set(key, null); return null; }
  const img = new Image();
  img.src = def.url.replace(/^\/+/, "");
  cache.set(key, img);
  return null;
}
export const kHas = (key: string) => key in K_SHEETS;

/** Direções do jogo 2: 0 baixo, 1 esquerda, 2 direita, 3 cima. */
export const K_DIR = ["down", "right", "right", "up"] as const;

/** Retorna a folha local de um mob quando o nome do inimigo coincide com o Kaetram. */
export function kMobSheet(kind: string): string | undefined {
  const key = `mobs/${kind}`;
  return K_SHEETS[key] ? key : undefined;
}

/** Desenha apenas um mob Kaetram correspondente; criaturas autorais ficam no renderer procedural. */
export function drawKMob(c: CanvasRenderingContext2D, kind: string, x: number, y: number, t: number, dir: number, alpha = 1, scale = 1): boolean {
  const key = kMobSheet(kind);
  if (!key) return false;
  const d = K_DIR[dir] ?? "down";
  return drawK(c, key, `walk_${d}`, t * 8, x, y, dir === 1, alpha, scale);
}

/**
 * Desenha um quadro de uma folha Kaetram com os pés em (x, y) — mesma convenção de drawChar.
 * Retorna false se a imagem ainda não carregou.
 */
export function drawK(c: CanvasRenderingContext2D, key: string, anim: string, frame: number, x: number, y: number, flip = false, alpha = 1, scale = 1): boolean {
  const def = K_SHEETS[key]; const img = kImage(key);
  if (!def || !img || !def.anims) return false;
  const a = def.anims[anim] ?? def.anims[anim.replace("bow_", "")] ?? def.anims[anim.replace(/^(atk|walk)_/, "idle_")] ?? def.anims["idle_down"] ?? Object.values(def.anims)[0];
  if (!a) return false;
  const w = def.w ?? 32, h = def.h ?? 32, ox = def.ox ?? -16, oy = def.oy ?? -16;
  const f = ((Math.floor(frame) % a[0]) + a[0]) % a[0];
  // Kaetram desenha a partir do canto do tile de 16 px; os pés ficam na base desse tile.
  const tx = x - 8 * scale, ty = y - 16 * scale;
  c.save();
  if (alpha < 1) c.globalAlpha *= alpha;
  if (flip) { c.translate(Math.round(x), 0); c.scale(-1, 1); c.drawImage(img, f * w, a[1] * h, w, h, Math.round(-8 * scale + ox * scale), Math.round(ty + oy * scale), w * scale, h * scale); }
  else c.drawImage(img, f * w, a[1] * h, w, h, Math.round(tx + ox * scale), Math.round(ty + oy * scale), w * scale, h * scale);
  c.restore();
  return true;
}

/** Ícone 16×16 de inventário de um item Kaetram. */
export function drawKIcon(c: CanvasRenderingContext2D, sprite: string, x: number, y: number, size: number): boolean {
  const img = kImage(`items/${sprite}`);
  if (!img) return false;
  c.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, x, y, size, size);
  return true;
}
