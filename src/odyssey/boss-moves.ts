// Repertório de ataques dos chefes. Cada chefe recebe 10 ataques diferentes, numa sequência
// fixa e só dele (sorteada de forma determinística pelo id), e bate mais forte que antes.
import type { EnemyKind } from "./data";

/** Multiplicador de dano de todo ataque de chefe. */
export const BOSS_DAMAGE_MULT = 1.6;
export const BOSS_MOVE_COUNT = 10;

export interface BossCtx {
  ex: number; ey: number; px: number; py: number; atk: number; color: string; ph2: boolean;
  shot(x: number, y: number, vx: number, vy: number, dmg: number, r?: number, life?: number): void;
  tele(x: number, y: number, r: number, delay: number, dmg: number): void;
  later(delay: number, fn: () => void): void;
  charge(vx: number, vy: number, time: number): void;
  blink(x: number, y: number): void;
  summon(n: number): void;
  shake(n: number): void;
  sfx(name: string): void;
}

const aimAt = (c: BossCtx) => Math.atan2(c.py - c.ey, c.px - c.ex);
const ring = (c: BossCtx, n: number, sp: number, dmg: number, off = 0, gap = -1) => {
  for (let i = 0; i < n; i++) {
    if (gap >= 0 && Math.abs(i - gap) <= 1) continue;
    const a = (i / n) * Math.PI * 2 + off;
    c.shot(c.ex, c.ey - 14, Math.cos(a) * sp, Math.sin(a) * sp, dmg);
  }
};

export const BOSS_MOVES: Record<string, { name: string; run: (c: BossCtx) => void }> = {
  anel: { name: "Anel de Ecos", run: (c) => { ring(c, c.ph2 ? 20 : 14, 95, c.atk * 0.8, Math.random()); c.sfx("fire"); } },
  espiral: { name: "Espiral", run: (c) => { for (let k = 0; k < 8; k++) c.later(k * 0.12, () => { for (let j = 0; j < 3; j++) { const a = k * 0.45 + (j * Math.PI * 2) / 3; c.shot(c.ex, c.ey - 14, Math.cos(a) * 110, Math.sin(a) * 110, c.atk * 0.7); } }); c.sfx("fire"); } },
  leque: { name: "Leque", run: (c) => { const b = aimAt(c); for (let i = -3; i <= 3; i++) { const a = b + i * 0.16; c.shot(c.ex, c.ey - 14, Math.cos(a) * 150, Math.sin(a) * 150, c.atk * 0.85); } c.sfx("bow"); } },
  rajada: { name: "Rajada Certeira", run: (c) => { for (let k = 0; k < (c.ph2 ? 6 : 4); k++) c.later(k * 0.15, () => { const a = aimAt(c); c.shot(c.ex, c.ey - 14, Math.cos(a) * 240, Math.sin(a) * 240, c.atk * 0.9, 3); }); c.sfx("bow"); } },
  cruz: { name: "Cruz", run: (c) => { for (let k = 0; k < 4; k++) c.later(k * 0.1, () => { for (let d = 0; d < 4; d++) { const a = d * Math.PI / 2; c.shot(c.ex, c.ey - 14, Math.cos(a) * 160, Math.sin(a) * 160, c.atk * 0.8); } }); } },
  xis: { name: "Xis", run: (c) => { for (let k = 0; k < 4; k++) c.later(k * 0.1, () => { for (let d = 0; d < 4; d++) { const a = Math.PI / 4 + d * Math.PI / 2; c.shot(c.ex, c.ey - 14, Math.cos(a) * 160, Math.sin(a) * 160, c.atk * 0.8); } }); } },
  meteoros: { name: "Chuva de Meteoros", run: (c) => { const n = c.ph2 ? 8 : 5; for (let i = 0; i < n; i++) c.later(i * 0.18, () => c.tele(c.px + (Math.random() - 0.5) * 120, c.py + (Math.random() - 0.5) * 120, 20, 1, c.atk * 1.4)); c.shake(4); } },
  linha: { name: "Linha de Ruptura", run: (c) => { const a = aimAt(c); for (let i = 1; i <= 7; i++) c.later(i * 0.08, () => c.tele(c.ex + Math.cos(a) * i * 26, c.ey + Math.sin(a) * i * 26, 16, 0.7, c.atk * 1.3)); } },
  cerco: { name: "Cerco", run: (c) => { for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; c.tele(c.px + Math.cos(a) * 50, c.py + Math.sin(a) * 50, 18, 1, c.atk * 1.3); } } },
  investida: { name: "Investida", run: (c) => { const a = aimAt(c); c.tele(c.px, c.py, 14, 0.6, 0); c.charge(Math.cos(a) * 240, Math.sin(a) * 240, 0.7); c.sfx("wind"); } },
  tripla: { name: "Investida Tripla", run: (c) => { for (let k = 0; k < 3; k++) c.later(k * 0.85, () => { const a = aimAt(c); c.charge(Math.cos(a) * 260, Math.sin(a) * 260, 0.6); c.sfx("wind"); }); } },
  invocar: { name: "Invocação", run: (c) => c.summon(c.ph2 ? 4 : 3) },
  nova: { name: "Nova", run: (c) => { c.tele(c.ex, c.ey, 60, 1.2, c.atk * 1.8); c.later(1.2, () => { ring(c, 16, 130, c.atk * 0.7); c.shake(8); }); } },
  muralha: { name: "Muralha com Brecha", run: (c) => { const gap = Math.floor(Math.random() * 24); for (let k = 0; k < 3; k++) c.later(k * 0.5, () => ring(c, 24, 70, c.atk * 0.9, 0, (gap + k * 3) % 24)); } },
  convergir: { name: "Convergência", run: (c) => { for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2, R = 140; c.shot(c.px + Math.cos(a) * R, c.py + Math.sin(a) * R, -Math.cos(a) * 90, -Math.sin(a) * 90, c.atk * 0.8, 4, 1.6); } c.sfx("fire"); } },
  pilares: { name: "Pilares", run: (c) => { for (let gx = -2; gx <= 2; gx++) for (let gy = -2; gy <= 2; gy++) if ((gx + gy) % 2 === 0) c.tele(c.px + gx * 40, c.py + gy * 40, 15, 1.1, c.atk * 1.2); } },
  salto: { name: "Salto Sombrio", run: (c) => { const tx = c.px + (Math.random() - 0.5) * 60, ty = c.py + (Math.random() - 0.5) * 60; c.tele(tx, ty, 34, 0.9, c.atk * 1.6); c.later(0.9, () => { c.blink(tx, ty); c.shake(10); }); } },
  terremoto: { name: "Terremoto", run: (c) => { c.shake(12); for (let i = 0; i < 14; i++) c.later(i * 0.1, () => c.tele(c.ex + (Math.random() - 0.5) * 260, c.ey + (Math.random() - 0.5) * 200, 18, 0.8, c.atk * 1.2)); c.sfx("boss"); } },
  lancas: { name: "Lanças do Horizonte", run: (c) => { for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + Math.random(); const sx = c.px + Math.cos(a) * 200, sy = c.py + Math.sin(a) * 200; c.later(i * 0.1, () => c.shot(sx, sy, -Math.cos(a) * 200, -Math.sin(a) * 200, c.atk, 4, 2)); } } },
  onda: { name: "Ondas Concêntricas", run: (c) => { for (let k = 0; k < 4; k++) c.later(k * 0.35, () => c.tele(c.ex, c.ey, 30 + k * 30, 0.5, c.atk * 1.1)); } },
  espelho: { name: "Golpe Espelhado", run: (c) => { const b = aimAt(c); for (const s of [0, Math.PI]) for (let i = -2; i <= 2; i++) { const a = b + s + i * 0.2; c.shot(c.ex, c.ey - 14, Math.cos(a) * 140, Math.sin(a) * 140, c.atk * 0.85); } } },
  chuva: { name: "Chuva de Lâminas", run: (c) => { for (let i = 0; i < 14; i++) c.later(i * 0.06, () => c.shot(c.px + (Math.random() - 0.5) * 220, c.py - 160, 0, 170, c.atk * 0.8, 3, 2)); } },
  flor: { name: "Flor Fatal", run: (c) => { for (let p = 0; p < 5; p++) { const a = (p / 5) * Math.PI * 2; for (let s = 0; s < 3; s++) c.shot(c.ex, c.ey - 14, Math.cos(a + s * 0.12) * (90 + s * 30), Math.sin(a + s * 0.12) * (90 + s * 30), c.atk * 0.75); } } },
  eclipse: { name: "Eclipse", run: (c) => { c.tele(c.px, c.py, 46, 1.4, c.atk * 2.2); ring(c, 10, 60, c.atk * 0.6, Math.random()); c.sfx("boss"); } },
};
export const MOVE_IDS = Object.keys(BOSS_MOVES);

function hash(s: string) { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0; return h >>> 0; }

const cache = new Map<string, string[]>();
const used = new Set<string>();
/** Sequência de 10 ataques diferentes e única para cada chefe. */
export function bossSequence(id: string): string[] {
  const hit = cache.get(id); if (hit) return hit;
  for (let salt = 0; ; salt++) {
    let s = hash(id + ":" + salt) || 1;
    const r = () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
    const pool = [...MOVE_IDS];
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [pool[i], pool[j]] = [pool[j]!, pool[i]!]; }
    const seq = pool.slice(0, BOSS_MOVE_COUNT), key = seq.join(",");
    if (used.has(key)) continue;
    used.add(key); cache.set(id, seq); return seq;
  }
}
export type { EnemyKind };
