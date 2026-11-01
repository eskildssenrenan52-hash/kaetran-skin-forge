// Personalização do herói: uma skin Kaetram + acessórios pintados por IA (chapéus, chifres, olhos,
// capas, asas, adornos) desenhados sobre ela. Salvamento próprio ("golden-arrow-look"), separado do save do jogo.
import type { Palette } from "./data";
import type { CharExtras } from "./gfx";
import { HERO_SKINS } from "./hero-sprite";
import { GEAR, GEAR_SLOTS, gearUnlocked, type GearSlot } from "./look-gear";

export const DEFAULT_KSKIN = 0;

export interface Look extends Record<GearSlot, number> {
  /** Índice da skin Kaetram (ver hero-sprite.ts). */
  kskin: number;
}

export const DEFAULT_LOOK: Look = { kskin: DEFAULT_KSKIN, hat: -1, horns: -1, eyes: -1, cape: -1, wings: -1, extra: -1 };

const pickIdx = (v: unknown, n: number) => { const x = Math.floor(Number(v)); return Number.isFinite(x) && x >= 0 && x < n ? x : -1; };
export function sanitizeLook(raw: Partial<Look> | null | undefined): Look {
  const r = (raw ?? {}) as Record<string, unknown>;
  const k = Math.floor(Number(r["kskin"]));
  const out: Look = { ...DEFAULT_LOOK, kskin: Number.isFinite(k) && k >= 0 && k < HERO_SKINS.length ? k : DEFAULT_KSKIN };
  // Saves antigos tinham `hat`/`cape` como índices de cores (0 = nada): só valem os do formato novo (v: 2).
  if (r["v"] === 2) for (const s of GEAR_SLOTS) out[s] = pickIdx(r[s], GEAR[s].items.length);
  return out;
}

const KEY = "golden-arrow-look";
let current: Look | null = null;
export function getLook(): Look {
  if (current) return current;
  try { const raw = typeof localStorage !== "undefined" ? localStorage.getItem(KEY) : null; current = raw ? sanitizeLook(JSON.parse(raw)) : { ...DEFAULT_LOOK }; }
  catch { current = { ...DEFAULT_LOOK }; }
  return current;
}
export function setLook(next: Look) {
  current = sanitizeLook({ ...next, v: 2 } as Partial<Look>);
  try { localStorage.setItem(KEY, JSON.stringify({ ...current, v: 2 })); } catch { /* armazenamento indisponível */ }
}

export function randomLook(level: number, rnd: () => number = Math.random): Look {
  const skins = HERO_SKINS.map((_, i) => i).filter((i) => level >= (HERO_SKINS[i]?.minLevel ?? 1));
  const look: Look = { ...DEFAULT_LOOK, kskin: skins[Math.floor(rnd() * skins.length)] ?? 0 };
  for (const s of GEAR_SLOTS) {
    if (rnd() < 0.45) continue;
    const ok = GEAR[s].items.map((_, i) => i).filter((i) => gearUnlocked(s, i, level));
    look[s] = ok[Math.floor(rnd() * ok.length)] ?? -1;
  }
  return look;
}

/** Visual de reserva (drawChar) usado só enquanto as folhas Kaetram carregam. */
export function resolveLook(_look: Look, armorColor: string, ring: string): { pal: Palette; extras: CharExtras } {
  return { pal: { skin: "#f4c8a0", hair: "#6a3a1a", body: armorColor, legs: "#3a3060", accent: ring }, extras: { hairStyle: 0, eyes: "#202030", hat: 0, hatColor: "", mark: 0 } };
}
