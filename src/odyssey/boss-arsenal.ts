// Arsenal dos chefes. Cada chefe (e cada gêmeo raro) recebe 8 ataques com padrões diferentes
// entre si; a combinação padrão + modificador nunca se repete entre chefes, e cada ataque
// tem um efeito especial pintado por IA exclusivo (fx-catalog). Puro: o motor fornece o BossCtx.
import type { FxName } from "./vfx";
import { fxFor, type FxSig } from "./fx-catalog";

export const BOSS_MOVES_PER_BOSS = 8;

export interface BossCtx {
  readonly ex: number; readonly ey: number; readonly px: number; readonly py: number;
  hit: number; ph2: boolean; phase: number; color: string;
  shot(x: number, y: number, vx: number, vy: number, dmg: number, r?: number, life?: number): void;
  tele(x: number, y: number, r: number, delay: number, dmg: number): void;
  later(delay: number, fn: () => void): void;
  charge(vx: number, vy: number, time: number): void;
  blink(x: number, y: number): void;
  summon(n: number): void;
  shake(n: number): void;
  sfx(name: string): void;
  fx(x: number, y: number, sc: number): void;
}

/** Parâmetros que mudam por variante: quantidade, velocidade e giro. */
interface P { n: number; sp: number; rot: number; k: number }
interface Pattern { id: string; name: string; fx: FxName[]; cd: number; run(c: BossCtx, p: P): void }

const TAU = Math.PI * 2;
const aim = (c: BossCtx) => Math.atan2(c.py - c.ey, c.px - c.ex);
const mouth = (c: BossCtx) => c.ey - 14;
const shotA = (c: BossCtx, a: number, sp: number, dmg: number, r = 3, life = 2.4) => c.shot(c.ex, mouth(c), Math.cos(a) * sp, Math.sin(a) * sp, dmg, r, life);
const rand = () => Math.random() - 0.5;

const PATTERNS: Pattern[] = [
  { id: "anel", name: "Anel", fx: ["sonic", "arcane"], cd: 1.6, run: (c, p) => { const n = p.n + 8; for (let i = 0; i < n; i++) shotA(c, (i / n) * TAU + p.rot, p.sp * 0.8, c.hit * 0.8); c.sfx("fire"); } },
  { id: "espiral", name: "Espiral", fx: ["firestorm", "wind"], cd: 2.2, run: (c, p) => { for (let k = 0; k < 9; k++) c.later(k * 0.11, () => { for (let j = 0; j < 3; j++) shotA(c, k * (0.35 + p.k * 0.03) + (j * TAU) / 3 + p.rot, p.sp, c.hit * 0.7); }); c.sfx("wind"); } },
  { id: "leque", name: "Leque", fx: ["crescent", "slash"], cd: 1.4, run: (c, p) => { const b = aim(c), n = 3 + (p.n % 5); for (let i = -n; i <= n; i++) shotA(c, b + i * 0.13, p.sp * 1.2, c.hit * 0.85); c.sfx("bow"); } },
  { id: "rajada", name: "Rajada Certeira", fx: ["xspark", "shock"], cd: 1.5, run: (c, p) => { for (let k = 0; k < 3 + (p.n % 4); k++) c.later(k * 0.14, () => shotA(c, aim(c), p.sp * 1.9, c.hit * 0.9, 3)); c.sfx("bow"); } },
  { id: "cruz", name: "Cruz Giratória", fx: ["xspark", "holy"], cd: 1.8, run: (c, p) => { for (let k = 0; k < 5; k++) c.later(k * 0.1, () => { for (let d = 0; d < 4; d++) shotA(c, d * TAU / 4 + k * 0.12 + p.rot, p.sp * 1.2, c.hit * 0.8); }); } },
  { id: "meteoros", name: "Chuva de Meteoros", fx: ["meteor", "geyser"], cd: 2.2, run: (c, p) => { const n = 4 + (p.n % 5); for (let i = 0; i < n; i++) c.later(i * 0.18, () => c.tele(c.px + rand() * 120, c.py + rand() * 120, 20, 1, c.hit * 1.4)); c.shake(4); } },
  { id: "ruptura", name: "Linha de Ruptura", fx: ["earth", "bones"], cd: 1.7, run: (c, p) => { const a = aim(c); for (let i = 1; i <= 7 + (p.n % 3); i++) c.later(i * 0.07, () => c.tele(c.ex + Math.cos(a) * i * 24, c.ey + Math.sin(a) * i * 24, 15, 0.6, c.hit * 1.3)); } },
  { id: "cerco", name: "Cerco", fx: ["rune", "crystal"], cd: 2, run: (c, p) => { const n = 6 + (p.n % 4); for (let i = 0; i < n; i++) { const a = (i / n) * TAU + p.rot; c.tele(c.px + Math.cos(a) * 48, c.py + Math.sin(a) * 40, 17, 1, c.hit * 1.3); } } },
  { id: "investida", name: "Investida", fx: ["impact", "sandstorm"], cd: 1.6, run: (c, p) => { const a = aim(c); c.tele(c.px, c.py, 14, 0.55, 0); c.charge(Math.cos(a) * (220 + p.k * 6), Math.sin(a) * (220 + p.k * 6), 0.7); c.sfx("wind"); } },
  { id: "tripla", name: "Investida Tripla", fx: ["claws", "impact"], cd: 3, run: (c) => { for (let k = 0; k < 3; k++) c.later(k * 0.85, () => { const a = aim(c); c.charge(Math.cos(a) * 260, Math.sin(a) * 260, 0.6); c.sfx("wind"); }); } },
  { id: "invocar", name: "Invocação", fx: ["rune", "wisps"], cd: 2.4, run: (c) => { c.summon(c.phase >= 5 ? 6 : c.phase >= 3 ? 5 : c.ph2 ? 4 : 3); c.fx(c.ex, c.ey, 1.2); } },
  { id: "nova", name: "Nova", fx: ["explosion", "starburst"], cd: 2.4, run: (c, p) => { c.tele(c.ex, c.ey, 58, 1.2, c.hit * 1.8); c.later(1.2, () => { for (let i = 0; i < 16; i++) shotA(c, (i / 16) * TAU + p.rot, p.sp, c.hit * 0.7); c.shake(8); }); } },
  { id: "muralha", name: "Muralha com Brecha", fx: ["frost", "ice"], cd: 2.4, run: (c, p) => { const gap = Math.floor(Math.random() * 24); for (let k = 0; k < 3; k++) c.later(k * 0.5, () => { for (let i = 0; i < 24; i++) { if (Math.abs(i - ((gap + k * 3) % 24)) <= 1) continue; shotA(c, (i / 24) * TAU, p.sp * 0.6, c.hit * 0.9); } }); } },
  { id: "convergir", name: "Convergência", fx: ["blackhole", "void"], cd: 2, run: (c, p) => { const n = 10 + (p.n % 5); for (let i = 0; i < n; i++) { const a = (i / n) * TAU + p.rot, R = 140; c.shot(c.px + Math.cos(a) * R, c.py + Math.sin(a) * R, -Math.cos(a) * 85, -Math.sin(a) * 85, c.hit * 0.8, 4, 1.6); } c.sfx("fire"); } },
  { id: "pilares", name: "Pilares", fx: ["sunbeam", "lightning"], cd: 2.2, run: (c, p) => { for (let gx = -2; gx <= 2; gx++) for (let gy = -2; gy <= 2; gy++) if (((gx + gy) % 2 === 0) === (p.k % 2 === 0)) c.tele(c.px + gx * 40, c.py + gy * 40, 15, 1.1, c.hit * 1.2); } },
  { id: "salto", name: "Salto Sombrio", fx: ["void", "blackhole"], cd: 2, run: (c) => { const tx = c.px + rand() * 60, ty = c.py + rand() * 60; c.tele(tx, ty, 34, 0.9, c.hit * 1.6); c.later(0.9, () => { c.blink(tx, ty); c.shake(10); }); } },
  { id: "terremoto", name: "Terremoto", fx: ["earth", "geyser"], cd: 2.4, run: (c, p) => { c.shake(12); for (let i = 0; i < 10 + (p.n % 6); i++) c.later(i * 0.1, () => c.tele(c.ex + rand() * 260, c.ey + rand() * 200, 18, 0.8, c.hit * 1.2)); c.sfx("boss"); } },
  { id: "lancas", name: "Lanças do Horizonte", fx: ["sunbeam", "xspark"], cd: 1.8, run: (c, p) => { for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU + p.rot; c.later(i * 0.1, () => { const sx = c.px + Math.cos(a) * 200, sy = c.py + Math.sin(a) * 200; c.shot(sx, sy, -Math.cos(a) * 200, -Math.sin(a) * 200, c.hit, 4, 2); }); } } },
  { id: "ondas", name: "Ondas Concêntricas", fx: ["sonic", "water"], cd: 2, run: (c) => { for (let k = 0; k < 4; k++) c.later(k * 0.35, () => c.tele(c.ex, c.ey, 30 + k * 30, 0.5, c.hit * 1.1)); } },
  { id: "espelho", name: "Golpe Espelhado", fx: ["crescent", "prism"], cd: 1.6, run: (c, p) => { const b = aim(c); for (const s of [0, Math.PI]) for (let i = -2; i <= 2; i++) shotA(c, b + s + i * 0.2, p.sp * 1.1, c.hit * 0.85); } },
  { id: "laminas", name: "Chuva de Lâminas", fx: ["slash", "claws"], cd: 1.8, run: (c, p) => { for (let i = 0; i < 12 + (p.n % 5); i++) c.later(i * 0.06, () => c.shot(c.px + rand() * 220, c.py - 160, 0, 170, c.hit * 0.8, 3, 2)); } },
  { id: "flor", name: "Flor Fatal", fx: ["petals", "nature"], cd: 1.8, run: (c, p) => { const pet = 4 + (p.k % 3); for (let q = 0; q < pet; q++) { const a = (q / pet) * TAU + p.rot; for (let s = 0; s < 3; s++) shotA(c, a + s * 0.12, 90 + s * 30, c.hit * 0.75); } } },
  { id: "eclipse", name: "Eclipse", fx: ["blackhole", "skull"], cd: 2.6, run: (c, p) => { c.tele(c.px, c.py, 46, 1.4, c.hit * 2.2); for (let i = 0; i < 10; i++) shotA(c, (i / 10) * TAU + p.rot, 60, c.hit * 0.6); c.sfx("boss"); } },
  { id: "bumerangue", name: "Bumerangue", fx: ["crescent", "wind"], cd: 1.8, run: (c, p) => { const b = aim(c); for (let i = -1; i <= 1; i++) { const a = b + i * 0.35; shotA(c, a, p.sp * 1.3, c.hit * 0.85, 4, 0.7); c.later(0.7, () => { const sx = c.ex + Math.cos(a) * p.sp * 0.9, sy = mouth(c) + Math.sin(a) * p.sp * 0.9; const back = Math.atan2(c.py - sy, c.px - sx); c.shot(sx, sy, Math.cos(back) * p.sp * 1.4, Math.sin(back) * p.sp * 1.4, c.hit * 0.85, 4, 1.4); }); } } },
  { id: "orbita", name: "Órbita Liberada", fx: ["orb", "arcane"], cd: 2.2, run: (c, p) => { const n = 6 + (p.n % 4); for (let i = 0; i < n; i++) c.later(0.6 + i * 0.08, () => { const a = (i / n) * TAU + p.rot, sx = c.ex + Math.cos(a) * 40, sy = mouth(c) + Math.sin(a) * 40, t = Math.atan2(c.py - sy, c.px - sx); c.shot(sx, sy, Math.cos(t) * p.sp * 1.5, Math.sin(t) * p.sp * 1.5, c.hit * 0.8); }); c.fx(c.ex, mouth(c), 1); } },
  { id: "zigue", name: "Trilha em Zigue-Zague", fx: ["shock", "lightning"], cd: 1.8, run: (c) => { const a = aim(c), nx = -Math.sin(a), ny = Math.cos(a); for (let i = 1; i <= 8; i++) c.later(i * 0.08, () => { const s = (i % 2 ? 1 : -1) * 22; c.tele(c.ex + Math.cos(a) * i * 22 + nx * s, c.ey + Math.sin(a) * i * 22 + ny * s, 14, 0.55, c.hit * 1.2); }); } },
  { id: "mais", name: "Sinal da Cruz", fx: ["holy", "sunbeam"], cd: 2, run: (c) => { for (let i = -3; i <= 3; i++) { c.tele(c.px + i * 22, c.py, 12, 0.9, c.hit * 1.2); if (i) c.tele(c.px, c.py + i * 22, 12, 0.9, c.hit * 1.2); } } },
  { id: "serpente", name: "Serpente", fx: ["acid", "poison"], cd: 2, run: (c, p) => { for (let i = 0; i < 10; i++) c.later(i * 0.07, () => shotA(c, aim(c) + Math.sin(i * 0.9) * 0.5, p.sp * 1.2, c.hit * 0.75)); } },
  { id: "grade", name: "Grade Cadente", fx: ["frost", "crystal"], cd: 2.2, run: (c, p) => { for (let i = -4; i <= 4; i++) { c.shot(c.px + i * 26, c.py - 170, 0, p.sp * 1.1, c.hit * 0.8, 3, 2.2); c.later(0.6, () => c.shot(c.px - 190, c.py + i * 22, p.sp * 1.1, 0, c.hit * 0.8, 3, 2.2)); } } },
  { id: "estrela", name: "Estrela de Cinco Pontas", fx: ["starburst", "prism"], cd: 2.2, run: (c, p) => { for (let a = 0; a < 5; a++) for (let i = 1; i <= 4; i++) { const ang = (a / 5) * TAU + p.rot - Math.PI / 2; c.later(i * 0.09, () => c.tele(c.px + Math.cos(ang) * i * 20, c.py + Math.sin(ang) * i * 20, 11, 0.8, c.hit * 1.2)); } } },
  { id: "catavento", name: "Catavento", fx: ["wind", "petals"], cd: 2.2, run: (c, p) => { for (let k = 0; k < 4; k++) c.later(k * 0.3, () => { for (let i = 0; i < 8; i++) shotA(c, (i / 8) * TAU + (k % 2 ? Math.PI / 8 : 0) + p.rot, p.sp * 0.9, c.hit * 0.75); }); } },
  { id: "emboscada", name: "Emboscada pelas Costas", fx: ["claws", "skull"], cd: 2.2, run: (c, p) => { const a = aim(c), tx = c.px + Math.cos(a) * 46, ty = c.py + Math.sin(a) * 46; c.tele(tx, ty, 16, 0.7, 0); c.later(0.7, () => { c.blink(tx, ty); const b = aim(c); for (let i = -2; i <= 2; i++) shotA(c, b + i * 0.22, p.sp * 1.3, c.hit * 0.9); }); } },
  { id: "minas", name: "Campo Minado", fx: ["spores", "acid"], cd: 2.4, run: (c, p) => { for (let i = 0; i < 9 + (p.n % 4); i++) c.tele(c.ex + rand() * 220, c.ey + rand() * 180, 14, 2 + Math.random(), c.hit * 1.3); } },
  { id: "varredura", name: "Varredura", fx: ["breath", "firestorm"], cd: 2, run: (c) => { const b = aim(c); for (let i = 0; i < 9; i++) c.later(i * 0.07, () => { const a = b - 0.9 + i * 0.22; c.tele(c.ex + Math.cos(a) * 46, c.ey + Math.sin(a) * 46, 16, 0.45, c.hit * 1.2); }); c.sfx("fire"); } },
  { id: "estilhacos", name: "Estilhaços", fx: ["crystal", "bones"], cd: 1.6, run: (c, p) => { for (let i = 0; i < 12 + (p.n % 6); i++) shotA(c, Math.random() * TAU, p.sp * (0.7 + Math.random() * 0.8), c.hit * 0.75); c.shake(3); } },
  { id: "bolhas", name: "Bolhas Lentas", fx: ["bubbles", "water"], cd: 2, run: (c, p) => { for (let i = 0; i < 7; i++) c.later(i * 0.12, () => shotA(c, aim(c) + rand() * 1.2, p.sp * 0.45, c.hit * 1.1, 6, 4)); } },
  { id: "sopro", name: "Sopro", fx: ["breath", "explosion"], cd: 1.8, run: (c, p) => { for (let k = 0; k < 14; k++) c.later(k * 0.04, () => shotA(c, aim(c) + rand() * 0.5, p.sp * 1.4, c.hit * 0.55, 3, 0.9)); c.sfx("fire"); } },
];

/** Modificadores que transformam qualquer padrão sem mudar sua identidade básica. */
interface Mod { id: string; name: string; wrap(c: BossCtx, run: (c: BossCtx, p: P) => void, p: P): void }
const MODS: Mod[] = [
  { id: "puro", name: "", wrap: (c, run, p) => run(c, p) },
  { id: "eco", name: "em Eco", wrap: (c, run, p) => { run(c, p); c.later(0.55, () => run(c, { ...p, rot: p.rot + 0.4 })); } },
  { id: "fenda", name: "Fendido", wrap: (c, run, p) => run(withShot(c, (x, y, vx, vy, d, r, l) => { c.shot(x, y, vx, vy, d, r, l); c.later(0.4, () => { const sx = x + vx * 0.4, sy = y + vy * 0.4, a = Math.atan2(vy, vx), s = Math.hypot(vx, vy); for (const o of [-0.6, 0.6]) c.shot(sx, sy, Math.cos(a + o) * s, Math.sin(a + o) * s, d * 0.6, 2, 1); }); }), p) },
  { id: "duplo", name: "Duplo", wrap: (c, run, p) => { run(c, { ...p, sp: p.sp * 0.7 }); c.later(0.25, () => run(c, { ...p, sp: p.sp * 1.3, rot: p.rot + 0.2 })); } },
  { id: "rastro", name: "com Rastro", wrap: (c, run, p) => { run(c, p); for (let i = 0; i < 4; i++) c.later(i * 0.2, () => c.tele(c.ex, c.ey, 18, 1.2, c.hit)); } },
  { id: "tremor", name: "com Tremor", wrap: (c, run, p) => { run(c, p); c.later(0.8, () => { c.tele(c.px, c.py, 26, 0.7, c.hit * 1.2); c.shake(5); }); } },
  { id: "furia", name: "Furioso", wrap: (c, run, p) => { for (let k = 0; k < 3; k++) c.later(k * 0.18, () => run(c, { ...p, n: Math.max(1, p.n - 3), rot: p.rot + k * 0.3 })); } },
  { id: "espelhado", name: "Espelhado", wrap: (c, run, p) => run(withShot(c, (x, y, vx, vy, d, r, l) => { c.shot(x, y, vx, vy, d, r, l); c.shot(x, y, -vx, vy, d, r, l); }), p) },
];

function withShot(c: BossCtx, shot: BossCtx["shot"]): BossCtx { const b = bind(c); b.shot = shot; return b; }

/** Copia o contexto mantendo os getters vivos (posição do chefe/herói no momento). */
function bind(c: BossCtx): BossCtx {
  return {
    get ex() { return c.ex; }, get ey() { return c.ey; }, get px() { return c.px; }, get py() { return c.py; },
    hit: c.hit, ph2: c.ph2, phase: c.phase, color: c.color,
    shot: c.shot, tele: c.tele, later: c.later, charge: c.charge, blink: c.blink, summon: c.summon, shake: c.shake, sfx: c.sfx, fx: c.fx,
  };
}

export interface BossMove { key: string; pattern: string; mod: string; name: string; cooldown: number; fx: FxName[]; signature: FxSig; params: P }

function hash(s: string) { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0; return h >>> 0; }

const used = new Set<string>();
const arsenals = new Map<string, BossMove[]>();
const patternUse = new Map<string, number>();
export const BOSS_PATTERN_COUNT = PATTERNS.length;
export const BOSS_PATTERN_IDS = PATTERNS.map((p) => p.id);
export const BOSS_MODIFIER_IDS = MODS.map((m) => m.id);

/** Os 8 ataques do chefe (ou do gêmeo, com id `x#gemeo`). Nunca repete combinação de outro chefe. */
export function arsenalFor(bossKey: string): BossMove[] {
  const hit = arsenals.get(bossKey); if (hit) return hit;
  // Espalha a carga entre os 37 padrões: até 36 bosses (18 pares potenciais)
  // recebem 8 padrões sem esgotar os 8 modificadores de um único padrão cedo.
  const order = [...PATTERNS].sort((a, b) => (patternUse.get(a.id) ?? 0) - (patternUse.get(b.id) ?? 0) || hash(bossKey + a.id) - hash(bossKey + b.id));
  const moves: BossMove[] = [];
  const makeMove = (pat: Pattern, chosen: Mod, combo: string, gen = 1): BossMove => {
    const s = hash(bossKey + combo), scale = gen > 1 ? 1 + (gen - 1) * 0.12 : 1;
    const params: P = { n: (s % 7 + gen - 1) % 7, sp: (95 + (s % 41)) * scale, rot: ((s >>> 8) % 628) / 100 + (gen - 1) * 0.17, k: (s >>> 4) % 9 };
    const suffix = gen > 1 ? ` ${["", "II", "III", "IV", "V", "VI", "VII"][gen - 1] ?? `V${gen}`}` : "";
    return { key: `${bossKey}:${combo}`, pattern: pat.id, mod: `${chosen.id}${gen > 1 ? `#${gen}` : ""}`, name: `${pat.name}${chosen.name ? " " + chosen.name : ""}${suffix}`, cooldown: pat.cd * (0.85 + (s % 30) / 100), fx: pat.fx, signature: fxFor(`boss:${bossKey}:${combo}`, pat.fx), params };
  };
  for (const pat of order) {
    if (moves.length >= BOSS_MOVES_PER_BOSS) break;
    const mods = [...MODS].sort((a, b) => hash(bossKey + pat.id + a.id) - hash(bossKey + pat.id + b.id));
    const chosen = mods.find((m) => !used.has(`${pat.id}+${m.id}`));
    if (!chosen) continue;
    const combo = `${pat.id}+${chosen.id}`;
    used.add(combo); patternUse.set(pat.id, (patternUse.get(pat.id) ?? 0) + 1);
    moves.push(makeMove(pat, chosen, combo));
  }
  // Mais de 37 bosses: preserva ataques exclusivos com parâmetros novos e marcador de geração.
  for (const pat of order) {
    if (moves.length >= BOSS_MOVES_PER_BOSS) break;
    if (moves.some((m) => m.pattern === pat.id)) continue;
    const mods = [...MODS].sort((a, b) => hash(bossKey + pat.id + a.id) - hash(bossKey + pat.id + b.id));
    const chosen = mods[0]!;
    let gen = 2; while (used.has(`${pat.id}+${chosen.id}#${gen}`)) gen++;
    const combo = `${pat.id}+${chosen.id}#${gen}`;
    used.add(combo); patternUse.set(pat.id, (patternUse.get(pat.id) ?? 0) + 1);
    moves.push(makeMove(pat, chosen, combo, gen));
  }
  arsenals.set(bossKey, moves);
  return moves;
}

/** Executa um ataque já sorteado. */
export function runMove(m: BossMove, c: BossCtx) {
  const pat = PATTERNS.find((p) => p.id === m.pattern), mod = MODS.find((x) => x.id === m.mod.split("#")[0]);
  if (!pat || !mod) return;
  const phase = Math.max(1, Math.min(5, Math.floor(c.phase)));
  const p = phase > 1 ? { ...m.params, n: m.params.n + (phase - 1) * 2 + 1, sp: m.params.sp * (1 + (phase - 1) * 0.12), rot: m.params.rot + (phase - 1) * 0.17 } : m.params;
  mod.wrap(c, pat.run, p);
}

export const PATTERN_COUNT = PATTERNS.length;
export const MOD_COUNT = MODS.length;
