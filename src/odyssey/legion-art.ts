// Arte procedural animada da Legião (legion.ts): 14 anatomias × 15 elementos × detalhes = 100 criaturas distintas.
// Desenha com os pés em (0,0), olhando para +x (drawFoe espelha). Só formas simples do canvas: leve até em celulares fracos.
import { LEGION_ART, type LegionArt } from './legion';

type Ctx = CanvasRenderingContext2D;
const TAU = Math.PI * 2;
const cache = new Map<string, string>();
function mix(h: string, to: number, a: number) {
  const key = h + to + a; let v = cache.get(key);
  if (!v) { const n = parseInt(h.slice(1), 16), r = n >> 16 & 255, g = n >> 8 & 255, b = n & 255; v = `rgb(${Math.round(r + (to - r) * a)},${Math.round(g + (to - g) * a)},${Math.round(b + (to - b) * a)})`; cache.set(key, v); }
  return v;
}
interface K { m: string; d: string; dd: string; l: string; s: string; sd: string; a: string; o: string; w: string; h: string; dark: string; fl: boolean }
function kit(art: LegionArt, flash: boolean, tint?: string): K {
  const m = tint && /^#[0-9a-f]{6}$/i.test(tint) ? tint : art.cols[0], s = art.cols[1], F = (x: string) => (flash ? '#ffffff' : x);
  return { m: F(m), d: F(mix(m, 0, 0.28)), dd: F(mix(m, 0, 0.55)), l: F(mix(m, 255, 0.35)), s: F(s), sd: F(mix(s, 0, 0.35)), a: flash ? '#fff' : art.cols[2],
    o: F(mix(m, 0, 0.74)), w: F('#f4f0e8'), h: F(mix(s, 255, 0.55)), dark: flash ? '#fff' : '#120c1c', fl: flash };
}
const ell = (c: Ctx, x: number, y: number, rx: number, ry: number, col: string, rot = 0) => { c.fillStyle = col; c.beginPath(); c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, TAU); c.fill(); };
const tri = (c: Ctx, x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, col: string) => { c.fillStyle = col; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.lineTo(x3, y3); c.closePath(); c.fill(); };
const ln = (c: Ctx, x1: number, y1: number, x2: number, y2: number, w: number, col: string) => { c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); };
const rect = (c: Ctx, x: number, y: number, w: number, h: number, col: string) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
/** Corpo arredondado com contorno, sombra inferior e brilho. */
function shaded(c: Ctx, x: number, y: number, rx: number, ry: number, k: K, rot = 0) {
  ell(c, x, y, rx + 1, ry + 1, k.o, rot); ell(c, x, y, rx, ry, k.m, rot);
  ell(c, x + Math.sin(rot) * ry * 0.3, y + ry * 0.38, rx * 0.84, ry * 0.58, k.d, rot);
  ell(c, x - rx * 0.28, y - ry * 0.4, rx * 0.36, ry * 0.26, k.l, rot);
}
function glow(c: Ctx, x: number, y: number, r: number, col: string, a: number) {
  c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 4; i++) { c.globalAlpha = a * 0.2; ell(c, x, y, r * (1 - i * 0.24), r * (1 - i * 0.24), col); }
  c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
}
function eyes(c: Ctx, x: number, y: number, n: number, sz: number, k: K, t: number, lit = false) {
  const bl = t % 3.7 > 3.58 ? 0.2 : 1;
  const pos: [number, number][] = n <= 1 ? [[0, 0]] : n === 2 ? [[-1, 0], [1, 0]] : n === 3 ? [[-1.3, 0.5], [1.3, 0.5], [0, -1.3]] : [[-1.3, 0.7], [1.3, 0.7], [-0.7, -0.8], [0.7, -0.8]];
  for (const [ox, oy] of pos) {
    const ex = x + ox * sz * 1.2, ey = y + oy * sz;
    ell(c, ex, ey, sz * 0.62 + 0.3, (sz * 0.72 + 0.3) * bl, lit ? k.a : k.w);
    if (bl > 0.5) { ell(c, ex + 0.35, ey + 0.2, sz * 0.3 + 0.2, sz * 0.42 + 0.2, lit ? k.dark : '#14101c'); if (!k.fl) rect(c, ex - 0.1, ey - sz * 0.4, 0.8, 0.8, '#fff'); }
  }
  if (lit) glow(c, x, y, sz * 2.4, k.a, 0.5);
}
function horns(c: Ctx, x: number, y: number, k: K, s = 1, dir = 1) {
  for (const sd of [-1, 1]) { const bx = x + sd * 2.2 * s; tri(c, bx - 1.4 * s, y, bx + 1.4 * s, y, bx + sd * 3.2 * s + dir * 0.6, y - 6 * s, k.h); tri(c, bx - 0.5 * s, y, bx + 1.4 * s, y, bx + sd * 3.2 * s + dir * 0.6, y - 6 * s, k.fl ? '#fff' : mix(k.h.startsWith('rgb') ? '#c8b890' : '#c8b890', 0, 0.2)); }
}
function crown(c: Ctx, x: number, y: number, k: K, s = 1) {
  const g = k.fl ? '#fff' : '#f0c040';
  rect(c, x - 3.5 * s, y - 2 * s, 7 * s, 2 * s, g); tri(c, x - 3.5 * s, y - 2 * s, x - 2.5 * s, y - 2 * s, x - 3.2 * s, y - 5 * s, g); tri(c, x - 1 * s, y - 2 * s, x + 1 * s, y - 2 * s, x, y - 5.6 * s, g); tri(c, x + 2.5 * s, y - 2 * s, x + 3.5 * s, y - 2 * s, x + 3.2 * s, y - 5 * s, g);
  ell(c, x, y - 1, 0.9 * s, 0.9 * s, k.fl ? '#fff' : '#d03050');
}
function halo(c: Ctx, x: number, y: number, rx: number, t: number, k: K) {
  c.globalAlpha = 0.65 + Math.sin(t * 4) * 0.25; c.strokeStyle = k.a; c.lineWidth = 1.4; c.beginPath(); c.ellipse(x, y, rx, rx * 0.32, 0, 0, TAU); c.stroke(); c.globalAlpha = 1;
  glow(c, x, y, rx * 1.1, k.a, 0.35);
}
function wing(c: Ctx, sx: number, sy: number, len: number, flap: number, k: K, far = false) {
  const phi = 0.35 + flap * 0.8, col = far ? k.dd : k.s;
  for (let i = 0; i < 4; i++) {
    const a = phi - i * 0.3, l = len * (1 - i * 0.12), tx = sx - Math.cos(a) * l * 0.62, ty = sy - Math.sin(a) * l;
    tri(c, sx, sy, tx, ty, sx - Math.cos(a - 0.34) * l * 0.5, sy - Math.sin(a - 0.34) * l * 0.5 + 1, i % 2 ? (far ? k.dd : k.d) : col);
  }
  ell(c, sx - 1.5, sy - 0.5, len * 0.22, len * 0.16, far ? k.dd : k.m);
}

// ── auras por elemento ────────────────────────────────────────────────────────────────────────
function aura(c: Ctx, el: string, t: number, w: number, h: number, k: K) {
  if (k.fl) return;
  for (let i = 0; i < 6; i++) {
    const ph = (t * 0.7 + i / 6) % 1, sd = i * 2.399, ax = Math.sin(sd) * w, fade = 1 - ph;
    switch (el) {
      case 'fire': c.globalAlpha = fade; rect(c, ax * (1 - ph * 0.4) + Math.sin(t * 6 + i) * 1.5, -h * 0.3 - ph * h, 1.6 * fade + 0.6, 1.6 * fade + 0.6, i % 2 ? '#ffd060' : '#ff7a30'); break;
      case 'ice': c.globalAlpha = 0.85; { const y = -h * 1.1 + ph * h * 1.1, x = ax + Math.sin(t * 2 + i) * 2; rect(c, x, y, 1, 1, '#fff'); rect(c, x - 1, y, 3, 1, 'rgba(255,255,255,.5)'); } break;
      case 'shock': if (Math.sin(t * 22 + i * 3) > 0.35) { c.globalAlpha = 0.9; const x = Math.sin(sd) * w * 0.9, y = -h * 0.5 + Math.cos(sd * 1.7) * h * 0.4; ln(c, x, y, x + 2.5, y - 1.5, 1, '#fff27a'); ln(c, x + 2.5, y - 1.5, x + 1.5, y + 1, 1, '#fff27a'); } break;
      case 'poison': case 'water': c.globalAlpha = fade * 0.8; c.strokeStyle = el === 'water' ? '#bfeaff' : '#b8ff70'; c.lineWidth = 0.8; c.beginPath(); c.arc(ax * 0.8 + Math.sin(t * 3 + i), -2 - ph * h, 0.8 + ph * 1.6, 0, TAU); c.stroke(); break;
      case 'shadow': c.globalAlpha = fade * 0.55; ell(c, ax * 0.7 + Math.sin(t * 2 + i) * 2, -h * 0.2 - ph * h, 1.5 + ph * 2.5, 1.2 + ph * 2, '#3a1a5a'); break;
      case 'void': c.globalAlpha = 0.5 + Math.sin(t * 6 + i) * 0.5; rect(c, Math.cos(t * 1.4 + sd) * w * 1.15, -h * 0.5 + Math.sin(t * 1.4 + sd) * h * 0.55, 1, 1, i % 2 ? '#fff' : '#c090ff'); break;
      case 'holy': { c.globalAlpha = Math.max(0, Math.sin(t * 3 + sd * 3)); const x = Math.sin(sd) * w * 1.1, y = -h * 0.2 - ((i * 0.37) % 1) * h; rect(c, x - 1, y, 3, 1, '#fff6c0'); rect(c, x, y - 1, 1, 3, '#fff6c0'); break; }
      case 'earth': case 'bone': c.globalAlpha = 0.9; rect(c, Math.cos(t * 1.2 + sd) * w * 1.1, -h * 0.5 + Math.sin(t * 1.2 + sd) * h * 0.4, 1.6, 1.6, el === 'bone' ? '#e8e0c8' : '#a88a60'); break;
      case 'sand': c.globalAlpha = fade * 0.8; rect(c, -w + ph * w * 2.4, -2 - Math.abs(Math.sin(sd + t * 2)) * 4, 1.3, 1.3, '#e8c878'); break;
      case 'wind': c.globalAlpha = fade * 0.8; c.strokeStyle = '#f0fbff'; c.lineWidth = 0.9; c.beginPath(); c.arc(-w * 1.4 + ph * w * 2.8, -h * 0.2 - (i % 3) * h * 0.25, 2.5, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); break;
      case 'blood': c.globalAlpha = fade; ell(c, ax * 0.5, -h * 0.5 + ph * h * 0.5, 0.7, 1.2, '#c01030'); break;
      case 'metal': c.globalAlpha = Math.max(0, Math.sin(t * 4 + sd * 5)); { const x = Math.sin(sd) * w * 0.8, y = -h * 0.55 + Math.cos(sd) * h * 0.4; rect(c, x - 1.5, y, 4, 1, '#fff'); rect(c, x, y - 1.5, 1, 4, '#fff'); } break;
      case 'nature': c.globalAlpha = 0.9; ell(c, ax + Math.sin(t * 2 + i) * 3, -h * 1.1 + ph * h * 1.1, 1.5, 0.8, i % 2 ? '#7acf48' : '#c8e860', t * 3 + i); break;
    }
  }
  c.globalAlpha = 1;
}

// ── anatomias ─────────────────────────────────────────────────────────────────────────────────
interface O { t: number; dir: number; has: (ch: string) => boolean; art: LegionArt }
type Plan = (c: Ctx, k: K, o: O) => number; // devolve a altura aproximada (para aura)

const pBlob: Plan = (c, k, { t, has }) => {
  const ph = t * 3, h = Math.abs(Math.sin(ph)), y = -h * 5, sx = 1 + (1 - h) * 0.14 - h * 0.07, sy = 1 / sx, rx = 9 * sx, ry = 7.5 * sy, cy = -7.5 + y;
  if (has('s')) for (let i = 0; i < 7; i++) { const a = Math.PI + 0.35 + i * 0.4, bx = Math.cos(a) * rx * 0.92, by = cy + Math.sin(a) * ry * 0.92; tri(c, bx - 1.2, by + 1, bx + 1.2, by + 1, bx + Math.cos(a) * 3.5, by + Math.sin(a) * 3.5, k.s); }
  shaded(c, 0, cy, rx, ry, k);
  c.globalAlpha = 0.55; ell(c, 0, cy + 0.5, rx * 0.55, ry * 0.5, k.s); c.globalAlpha = 1;
  const pulse = 0.65 + Math.sin(t * 5) * 0.35; c.globalAlpha = pulse; ell(c, -1, cy + 0.5, has('g') ? 3.2 : 1.8, has('g') ? 3.2 : 1.8, k.a); c.globalAlpha = 1;
  if (has('g')) glow(c, -1, cy + 0.5, 7, k.a, pulse * 0.6);
  for (let i = 0; i < 3; i++) { const bp = (t * 0.5 + i / 3) % 1; c.globalAlpha = 0.6 * Math.sin(bp * Math.PI); c.strokeStyle = k.l; c.lineWidth = 0.7; c.beginPath(); c.arc((i - 1) * rx * 0.48, cy + ry * 0.7 - bp * ry * 1.3, 0.9 + i * 0.3, 0, TAU); c.stroke(); }
  c.globalAlpha = 1;
  eyes(c, 3.2, cy - 1.4, has('e') ? 3 : 2, 1.6, k, t);
  c.strokeStyle = k.dark; c.lineWidth = 0.9; c.beginPath(); c.arc(3.4, cy + 2.6, 1.7, 0.15, Math.PI - 0.15); c.stroke();
  if (has('f')) { tri(c, 2, cy + 3.4, 3.2, cy + 3.4, 2.6, cy + 5.2, k.w); tri(c, 4.2, cy + 3.5, 5.4, cy + 3.3, 4.8, cy + 5.2, k.w); }
  const top = cy - ry;
  if (has('h')) horns(c, 0, top + 1, k, 0.9); if (has('c')) crown(c, 0, top + 1, k); if (has('o')) halo(c, 0, top - 4, 6, t, k);
  return 18;
};

const pQuad: Plan = (c, k, { t, has }) => {
  const ph = t * 7, bob = Math.abs(Math.sin(ph)) * -0.9;
  if (has('w')) wing(c, -2, -14 + bob, 13, Math.sin(t * 5), k, true);
  // cauda
  c.strokeStyle = k.o; c.lineWidth = 3.6; c.lineCap = 'round'; c.beginPath(); c.moveTo(-8, -11 + bob);
  const tp: [number, number][] = []; for (let i = 1; i <= 4; i++) tp.push([-8 - i * 3.2, -11 + bob - i * 0.9 + Math.sin(t * 5 + i * 0.8) * 2 * (i / 2)]); for (const [x, y] of tp) c.lineTo(x, y); c.stroke();
  c.strokeStyle = k.m; c.lineWidth = 2.4; c.beginPath(); c.moveTo(-8, -11 + bob); for (const [x, y] of tp) c.lineTo(x, y); c.stroke();
  const [tx, ty] = tp[3]; if (has('t')) { glow(c, tx, ty, 4, k.a, 0.7); ell(c, tx, ty, 1.7, 1.7, k.a); } else ell(c, tx, ty, 1.8, 1.8, k.s);
  // pernas
  const legs: [number, number, boolean][] = [[-6.5, 0, true], [-3.5, Math.PI, true], [3.5, Math.PI, false], [6.5, 0, false]];
  for (const [lx, off, back] of legs) { const s = Math.sin(ph + off), lift = Math.max(0, Math.cos(ph + off)) * 2; ln(c, lx, -8 + bob, lx + s * 3, -1.5 - lift, 2.6, back ? k.dd : k.d); ell(c, lx + s * 3 + 0.5, -1 - lift, 1.9, 1.1, k.dd); }
  if (has('m')) for (let i = 0; i < 5; i++) tri(c, 4 + i * 0.6, -16 + bob + i * 0.8, 8 + i * 0.8, -14 + bob + i * 0.9, 5 + i * 0.8 - 3, -21 + bob + i * 0.3 + Math.sin(t * 6 + i) * 0.6, k.s);
  if (has('s')) for (let i = 0; i < 5; i++) tri(c, -7 + i * 2.6, -14.5 + bob, -5 + i * 2.6, -14.5 + bob, -6 + i * 2.6, -18.5 + bob, k.s);
  shaded(c, 0, -10.5 + bob, 9.6, 5.3, k);
  if (has('a')) { ell(c, 4.5, -12.5 + bob, 3.6, 3.3, k.s); ell(c, 4.2, -13.2 + bob, 2.2, 1.5, k.h); rect(c, 3, -11 + bob, 1, 1, k.dd); }
  const hy = -14 + bob;
  tri(c, 7.2, hy - 3, 9.4, hy - 3.2, 8, hy - 8, k.d); tri(c, 10.2, hy - 3, 12, hy - 2.6, 11.5, hy - 7.5, k.d);
  shaded(c, 10, hy, 5, 4.1, k); ell(c, 14, hy + 1, 3.2, 2.5, k.l); ell(c, 16.6, hy + 0.2, 0.9, 0.7, k.dark);
  if (has('e')) { ell(c, 11.6, hy - 1.2, 1.5, 1.2, k.a); glow(c, 11.6, hy - 1.2, 4, k.a, 0.8); } else { ell(c, 11.6, hy - 1.2, 1.2, 1.1, k.w); ell(c, 11.9, hy - 1.1, 0.7, 0.8, '#14101c'); }
  if (has('f')) { tri(c, 13, hy + 2.8, 14.2, hy + 2.8, 13.6, hy + 5, k.w); tri(c, 15.2, hy + 2.6, 16.2, hy + 2.5, 15.8, hy + 4.4, k.w); }
  if (has('h')) horns(c, 9.5, hy - 3.6, k, 0.95); if (has('c')) crown(c, 9.5, hy - 3.8, k, 0.8); if (has('o')) halo(c, 9.5, hy - 11, 6, t, k);
  return 24;
};

const pBiped: Plan = (c, k, { t, has, art }) => {
  const ph = t * 6, bob = Math.abs(Math.sin(ph)) * -0.8, caster = ['spread', 'spiral', 'strafe'].includes(art.trait);
  const skull = has('b'), skin = skull ? k.w : k.l;
  if (has('k')) { c.fillStyle = k.sd; c.beginPath(); c.moveTo(-5, -19 + bob); c.lineTo(-8.5, -3); for (let i = 0; i <= 5; i++) c.lineTo(-8.5 + i * 3.4, -2 + Math.sin(t * 5 + i * 1.4) * 1.5 + (i % 2) * 1.4); c.lineTo(5, -19 + bob); c.closePath(); c.fill(); }
  for (const [off, col] of [[Math.PI, k.dd], [0, k.d]] as const) { const s = Math.sin(ph + off), lift = Math.max(0, Math.cos(ph + off)) * 2; ln(c, off ? -2.4 : 2.4, -9 + bob, (off ? -2.4 : 2.4) + s * 2.6, -1.5 - lift, 3, col); ell(c, (off ? -2.4 : 2.4) + s * 2.6 + 1, -1 - lift, 2.4, 1.3, k.dark); }
  ln(c, -5, -17 + bob, -6.5 + Math.sin(ph) * 2.5, -9.5 + bob, 2.4, k.dd); ell(c, -6.5 + Math.sin(ph) * 2.5, -9 + bob, 1.4, 1.4, skin);
  rect(c, -5.6, -19.6 + bob, 11.2, 11.2, k.o); rect(c, -5, -19 + bob, 10, 10, k.m); rect(c, -5, -12 + bob, 10, 3, k.d); rect(c, -5, -19 + bob, 10, 2, k.l); rect(c, -5, -11.4 + bob, 10, 1.4, k.a);
  if (skull) for (let i = 0; i < 3; i++) { rect(c, -3.5, -17 + i * 2.2 + bob, 7, 0.8, k.dd); }
  else { rect(c, -1, -16 + bob, 2, 4, k.s); }
  if (has('a')) { ell(c, -5.6, -18.5 + bob, 3.2, 2.6, k.s); ell(c, 5.6, -18.5 + bob, 3.2, 2.6, k.s); ell(c, -5.6, -19.2 + bob, 2, 1, k.h); ell(c, 5.6, -19.2 + bob, 2, 1, k.h); }
  // braço da frente + arma
  const sw = Math.sin(t * 4) * (caster ? 0.18 : 0.6), hx = 8.5 + Math.sin(ph) * 0.8, hy = -12 + bob + Math.cos(t * 4) * 0.8;
  ln(c, 5, -17 + bob, hx, hy, 2.6, k.d); ell(c, hx, hy, 1.7, 1.7, skin);
  c.save(); c.translate(hx, hy); c.rotate(-0.15 + sw);
  if (caster && art.el !== 'bone' && !skull) { ln(c, 0, 7, 0, -13, 1.5, k.fl ? '#fff' : '#6a4a2a'); const oy = -14.5; glow(c, 0, oy, 6, k.a, 0.7 + Math.sin(t * 6) * 0.25); ell(c, 0, oy, 2.4, 2.4, k.a); ell(c, -0.6, oy - 0.6, 0.9, 0.9, '#fff'); }
  else if (skull && caster) { c.strokeStyle = k.fl ? '#fff' : '#8a6a3a'; c.lineWidth = 1.4; c.beginPath(); c.arc(2, -3, 9, -1.15, 1.15); c.stroke(); ln(c, 2 + Math.cos(1.15) * 9 - 9 * 0.0, -3 - Math.sin(1.15) * 9, 2 + Math.cos(1.15) * 9, -3 + Math.sin(1.15) * 9, 0.5, k.w); }
  else { rect(c, -0.7, -1, 1.4, 4, k.fl ? '#fff' : '#6a4a2a'); rect(c, -2.4, -1.6, 4.8, 1.2, k.s); tri(c, -1.4, -1.6, 1.4, -1.6, 0, -12, k.fl ? '#fff' : '#d8e0e8'); rect(c, -0.2, -10, 0.6, 8, k.fl ? '#fff' : '#fff'); }
  c.restore();
  // cabeça
  const hy2 = -24.5 + bob;
  if (has('k') || art.el === 'shadow' && !skull) { ell(c, 1, hy2, 5.8, 5.8, k.sd); ell(c, 2.3, hy2 + 0.4, 3.8, 4, k.dark); ell(c, 4.2, hy2 + 0.2, 1, 0.9, k.a); ell(c, 1.4, hy2 + 0.2, 1, 0.9, k.a); glow(c, 3, hy2 + 0.2, 5, k.a, 0.5); }
  else { ell(c, 1, hy2, 5, 5, k.o); ell(c, 1, hy2, 4.5, 4.6, skin); ell(c, 1, hy2 + 2, 4, 2.4, k.fl ? '#fff' : mix('#000000', 0, 0), 0); ell(c, 1, hy2 + 1.6, 4.1, 2.8, skin);
    if (skull) { ell(c, 3.4, hy2 - 0.4, 1.5, 1.7, k.dark); ell(c, -0.6, hy2 - 0.4, 1.5, 1.7, k.dark); ell(c, 3.4, hy2 - 0.4, 0.7, 0.8, k.a); ell(c, -0.6, hy2 - 0.4, 0.7, 0.8, k.a); glow(c, 1.4, hy2 - 0.4, 5, k.a, 0.45); rect(c, 0, hy2 + 2.4, 3, 0.8, k.dark); }
    else { eyes(c, 2.4, hy2 - 0.4, 2, 1.1, k, t, art.el === 'void'); rect(c, 1.4, hy2 + 2.2, 2.6, 0.8, k.dark); }
    ell(c, 0.4, hy2 - 3.4, 4.8, 2.6, art.el === 'fire' || art.el === 'shock' || art.el === 'nature' ? k.s : k.dd);
    if (has('a')) { c.fillStyle = k.s; c.beginPath(); c.arc(1, hy2 - 0.6, 5, Math.PI, TAU); c.fill(); rect(c, 4, hy2 - 1, 1.6, 3, k.s); rect(c, -4, hy2 - 0.6, 9, 1, k.sd); }
  }
  if (has('h')) horns(c, 1, hy2 - 4, k, 0.9); if (has('c')) crown(c, 1, hy2 - 4, k, 0.9); if (has('o')) halo(c, 1, hy2 - 9, 6, t, k);
  return 30;
};

const pBird: Plan = (c, k, { t, has }) => {
  const y = -17 + Math.sin(t * 4) * 2, flap = Math.sin(t * 11), tl = has('t') ? 1.5 : 1;
  for (let i = 0; i < 3; i++) { const a = 0.15 + (i - 1) * 0.28; tri(c, -5, y + 1, -5 - Math.cos(a) * 9 * tl, y + 2 + Math.sin(a) * 9 * tl + (i - 1) * 1.5, -4, y + 4.5, i === 1 ? k.d : k.s); if (has('t')) { glow(c, -5 - Math.cos(a) * 9 * tl, y + 2 + Math.sin(a) * 9 * tl + (i - 1) * 1.5, 2.6, k.a, 0.8); } }
  wing(c, -1, y - 1.5, 15, flap, k, true);
  const dang = Math.sin(t * 5) * 0.8; ln(c, -0.5, y + 4, -1 + dang, y + 8.5, 1.3, k.fl ? '#fff' : '#d8a040'); ln(c, 2.5, y + 4, 2.5 - dang, y + 8.5, 1.3, k.fl ? '#fff' : '#d8a040');
  shaded(c, 0, y, 7.4, 4.8, k, -0.15); ell(c, 1.5, y + 1.8, 4.4, 2.5, k.l);
  wing(c, -1, y - 2, 17, flap, k);
  ell(c, 7, y - 3, 3.8, 3.5, k.o); ell(c, 7, y - 3, 3.4, 3.2, k.m); ell(c, 6.3, y - 4.2, 1.6, 1.1, k.l);
  const bk = k.fl ? '#fff' : '#e8b848'; tri(c, 9.6, y - 4.2, 14.5, y - 2.3, 9.6, y - 1.1, bk); if (has('f')) tri(c, 12.5, y - 2.6, 14.8, y - 1.6, 12.8, y - 0.2, k.dd); rect(c, 10, y - 2.6, 3.4, 0.6, k.dark);
  if (has('e')) { ell(c, 8.3, y - 4, 1.2, 1.2, k.a); glow(c, 8.3, y - 4, 4, k.a, 0.8); } else { ell(c, 8.2, y - 3.9, 1.3, 1.3, k.w); ell(c, 8.5, y - 3.8, 0.8, 0.8, '#14101c'); }
  if (has('h')) for (let i = 0; i < 3; i++) tri(c, 5 + i, y - 6, 6.5 + i, y - 6, 4 + i * 1.4 - 1, y - 10 - i + Math.sin(t * 6 + i) * 0.6, k.a);
  if (has('c')) crown(c, 7, y - 6, k, 0.8); if (has('o')) halo(c, 7, y - 11, 6, t, k);
  return 26;
};

const pInsect: Plan = (c, k, { t, has }) => {
  const ph = t * 10, bob = Math.sin(ph * 2) * 0.5;
  for (const far of [true, false]) for (let i = 0; i < 3; i++) {
    const hx = -4 + i * 4.2 + (far ? 0.8 : 0), s = Math.sin(ph + i * 2.1 + (far ? Math.PI : 0)), lift = Math.max(0, Math.cos(ph + i * 2.1 + (far ? Math.PI : 0))) * 2;
    const kx = hx + (i - 1) * 2.4 + s, ky = -12 - lift, fx = hx + (i - 1) * 4.5 + s * 3, fy = -0.8 - lift;
    ln(c, hx, -7 + bob, kx, ky, 1.5, far ? k.dd : k.d); ln(c, kx, ky, fx, fy, 1.3, far ? k.dd : k.d);
  }
  if (has('w')) { for (const [a, rx] of [[-0.5, 8], [-0.25, 7]] as const) { c.globalAlpha = k.fl ? 1 : 0.5; ell(c, -1, -14 + bob, rx, 1.8 + Math.abs(Math.sin(t * 34)) * 2.8, k.fl ? '#fff' : k.l, a); c.globalAlpha = 1; } }
  shaded(c, -6, -8 + bob, 6.2, 4.6, k); ell(c, -6, -9.6 + bob, 4.5, 1.1, k.l);
  for (let i = 0; i < 2; i++) ln(c, -9 + i * 3, -11.6 + bob, -9 + i * 3, -5 + bob, 1.1, k.dd);
  if (has('s')) for (let i = 0; i < 3; i++) tri(c, -9 + i * 3, -12 + bob, -7 + i * 3, -12 + bob, -8 + i * 3, -16 + bob, k.s);
  if (has('t')) { tri(c, -11.5, -8.6 + bob, -11.5, -6.2 + bob, -16, -4 + bob + Math.sin(t * 6), k.a); glow(c, -15.5, -4.4 + bob, 3, k.a, 0.6); }
  shaded(c, 1, -9 + bob, 4.2, 3.7, k); shaded(c, 6.6, -9.4 + bob, 3.3, 3, k);
  if (has('a')) { ell(c, 1, -10.5 + bob, 3, 1, k.h); ell(c, 6.6, -10.8 + bob, 2, 0.8, k.h); }
  ell(c, 7.8, -10.2 + bob, 1.8, 1.7, k.a); ell(c, 7.4, -10.7 + bob, 0.6, 0.6, '#fff'); glow(c, 7.8, -10.2 + bob, 3.4, k.a, 0.5);
  if (has('e')) for (let i = 0; i < 3; i++) ell(c, 5.4 + i * 1.1, -8.6 + bob - (i % 2) * 2.4, 0.7, 0.7, k.a);
  tri(c, 9, -8.3 + bob, 10.4, -9 + bob, 10.2 + Math.sin(t * 12) * 0.5, -6.4 + bob, k.dd); tri(c, 9.3, -7.6 + bob, 10.8, -7.9 + bob, 10.4 - Math.sin(t * 12) * 0.5, -5.8 + bob, k.dd);
  for (const s of [0, 1]) { c.strokeStyle = k.dd; c.lineWidth = 0.8; c.beginPath(); c.moveTo(7.5, -11.6 + bob); c.quadraticCurveTo(10 + s * 2, -17 + Math.sin(t * 6 + s * 2) * 1.2, 12 + s * 2.6, -15.5 + Math.sin(t * 7 + s) * 1.5); c.stroke(); }
  if (has('h')) { c.strokeStyle = k.o; c.lineWidth = 2.4; c.beginPath(); c.moveTo(7, -12 + bob); c.quadraticCurveTo(9, -17 + bob, 13, -16 + bob); c.stroke(); c.strokeStyle = k.s; c.lineWidth = 1.4; c.stroke(); }
  if (has('c')) crown(c, 6.6, -12 + bob, k, 0.7); if (has('o')) halo(c, 5, -20, 6, t, k);
  return 18;
};

const pSerpent: Plan = (c, k, { t, has, art }) => {
  const N = 10, x0 = 9, y0 = -15 + Math.sin(t * 3) * 1.2, pts: [number, number, number][] = [];
  for (let i = 0; i < N; i++) { const u = i / (N - 1); pts.push([x0 - i * 3.1 - u * u * 2, -4 + (y0 + 4) * Math.pow(1 - u, 2.2) + Math.sin(t * 5 - i * 0.8) * (1 + u * 1.6), 3.9 * (1 - u * 0.8) + 0.8]); }
  if (art.trait === 'burrow') ell(c, -9, -0.5, 8, 2, k.sd);
  if (has('w')) { wing(c, 0, -10, 16, Math.sin(t * 6), k, true); }
  for (let i = N - 1; i >= 0; i--) { const [x, y, r] = pts[i]; ell(c, x, y, r + 1, r + 1, k.o); }
  for (let i = N - 1; i >= 0; i--) { const [x, y, r] = pts[i]; ell(c, x, y, r, r, i % 2 ? k.m : k.d); }
  for (let i = N - 1; i >= 1; i--) { const [x, y, r] = pts[i]; ell(c, x, y + r * 0.4, r * 0.7, r * 0.45, k.l); if (i % 2 === 0) ell(c, x, y - r * 0.35, r * 0.5, r * 0.34, k.s); if (has('s') && i % 2) tri(c, x - 1.2, y - r + 0.4, x + 1.2, y - r + 0.4, x, y - r - 3, k.a); }
  if (has('w')) wing(c, 0, -11, 18, Math.sin(t * 6), k);
  const [hx, hy] = pts[0];
  if (has('h') && art.el !== 'water') { ell(c, hx - 1.5, hy - 1.5, 6.2, 7, k.sd); ell(c, hx - 1.5, hy - 1, 4.3, 5.2, k.s); ell(c, hx - 1.8, hy - 2.4, 1.4, 1.4, k.a); ell(c, hx - 1.8, hy + 0.6, 1, 1, k.a); }
  shaded(c, hx + 1.5, hy, 5.5, 3.9, k, 0.18); ell(c, hx + 5, hy + 1, 3, 2.2, k.l);
  if (has('c')) crown(c, hx + 1, hy - 3.6, k, 0.8); if (has('h') && art.el === 'water') horns(c, hx + 1, hy - 3, k, 0.85);
  ell(c, hx + 3.3, hy - 1.2, 1.3, 1.1, k.a); glow(c, hx + 3.3, hy - 1.2, 3.6, k.a, 0.7); rect(c, hx + 3.1, hy - 2, 0.6, 1.8, k.dark);
  if (has('f')) { tri(c, hx + 5, hy + 2.2, hx + 6.2, hy + 2.2, hx + 5.6, hy + 5, k.w); tri(c, hx + 7.2, hy + 2.2, hx + 8.2, hy + 1.9, hx + 7.8, hy + 4.4, k.w); }
  const tl = 3 + Math.sin(t * 10) * 2; ln(c, hx + 8.2, hy + 1.6, hx + 8.2 + tl, hy + 1.6, 0.7, k.fl ? '#fff' : '#d8203a'); ln(c, hx + 8.2 + tl, hy + 1.6, hx + 9.4 + tl, hy + 0.6, 0.7, k.fl ? '#fff' : '#d8203a'); ln(c, hx + 8.2 + tl, hy + 1.6, hx + 9.4 + tl, hy + 2.6, 0.7, k.fl ? '#fff' : '#d8203a');
  if (has('o')) halo(c, hx + 1, hy - 8, 6, t, k);
  return 24;
};

const pWraith: Plan = (c, k, { t, has, art }) => {
  const y = -15 + Math.sin(t * 3) * 2.4, sw = Math.sin(t * 2) * 1.2;
  if (!k.fl) for (let i = 0; i < 3; i++) { c.globalAlpha = 0.28 - i * 0.08; ell(c, -sw * (i + 1) * 0.6 - i * 1.2, y + 12 + i * 3.4, 4.5 - i, 1.8, k.d); }
  c.globalAlpha = k.fl ? 1 : 0.92;
  c.fillStyle = k.d; c.beginPath(); c.moveTo(-3.5 + sw, y - 6); c.quadraticCurveTo(-9, y + 2, -8.4, y + 9);
  for (let i = 0; i <= 6; i++) c.lineTo(-8.4 + i * 2.8, y + 10.5 + Math.sin(t * 5 + i * 1.3) * 1.8 + (i % 2) * 1.8);
  c.quadraticCurveTo(9, y + 2, 4.5 + sw, y - 6); c.closePath(); c.fill();
  c.fillStyle = k.m; c.beginPath(); c.moveTo(-2.5 + sw, y - 6); c.quadraticCurveTo(-6.5, y + 2, -5.6, y + 8.5); c.lineTo(5.6, y + 8.5); c.quadraticCurveTo(7, y + 2, 3.5 + sw, y - 6); c.closePath(); c.fill();
  c.globalAlpha = (k.fl ? 1 : 0.25 + Math.sin(t * 3) * 0.1); ell(c, 0, y + 2, 3, 5.4, k.a); c.globalAlpha = 1;
  const reach = Math.sin(t * 3) * 1.6;
  ln(c, 4, y - 2, 11, y - 1 + reach, 2.6, k.d); ell(c, 12, y - 1 + reach, 1.9, 1.5, k.l); for (let i = 0; i < 3; i++) ln(c, 12.5, y - 1.6 + reach + i * 0.9, 14.6, y - 2 + reach + i * 1.1, 0.7, k.l);
  ln(c, -4, y - 2, -9, y + 2 - reach, 2.4, k.dd); ell(c, -9.8, y + 2.4 - reach, 1.7, 1.3, k.l);
  if (has('k')) { ln(c, 9, y + 7, 7.5, y - 16, 1.4, k.fl ? '#fff' : '#6a4a2a'); c.fillStyle = k.fl ? '#fff' : '#cfd6de'; c.beginPath(); c.moveTo(7.5, y - 16); c.quadraticCurveTo(16, y - 17.5, 17, y - 9); c.lineTo(14, y - 11.5); c.quadraticCurveTo(12, y - 14.4, 7.5, y - 14.6); c.fill(); }
  ell(c, 1 + sw, y - 10, 5.8, 5.9, k.o); ell(c, 1 + sw, y - 10, 5.3, 5.5, k.m); ell(c, -1 + sw, y - 12.4, 2.4, 1.6, k.l);
  ell(c, 2.6 + sw, y - 9.4, 3.6, 3.9, k.dark);
  ell(c, 4 + sw, y - 9.8, 1.2, 0.9, k.a); ell(c, 1 + sw, y - 9.8, 1.2, 0.9, k.a); glow(c, 2.5 + sw, y - 9.8, 5.5, k.a, 0.7);
  if (has('e')) { ell(c, 2.5 + sw, y - 12.2, 0.8, 0.8, k.a); ell(c, 2.5 + sw, y - 7.2, 1.3, 0.5, k.a); }
  c.globalAlpha = 1;
  if (has('h')) horns(c, 1 + sw, y - 14.4, k, 1); if (has('c')) crown(c, 1 + sw, y - 14.8, k, 0.9); if (has('o')) halo(c, 1 + sw, y - 19, 6, t, k);
  void art; return 30;
};

const pGolem: Plan = (c, k, { t, has, art }) => {
  const sp = Math.sin(t * 3), bob = -Math.abs(sp) * 1.2, el = art.el, pulse = 0.65 + Math.sin(t * 4) * 0.35;
  if (has('w')) for (const sd of [-1, 1]) { const f = Math.sin(t * 2.4) * 0.15; tri(c, sd * 5, -20 + bob, sd * 16, -27 + bob - f * 8, sd * 10, -10 + bob, k.dd); tri(c, sd * 5, -20 + bob, sd * 14, -24 + bob - f * 8, sd * 9, -13 + bob, k.sd); ln(c, sd * 5, -20 + bob, sd * 14, -26 + bob - f * 8, 0.8, k.o); }
  for (const [lx, up, col] of [[-6, sp > 0 ? 1.4 : 0, k.dd], [1, sp > 0 ? 0 : 1.4, k.d]] as const) { rect(c, lx - 0.6, -7 - up, 6.2, 7, k.o); rect(c, lx, -6.5 - up, 5, 6, col); ell(c, lx + 2.5, -0.6 - up, 3.6, 1.4, k.o); }
  rect(c, -8.8, -21 + bob, 17.6, 16.6, k.o); rect(c, -8, -20 + bob, 16, 15, k.m); rect(c, -8, -20 + bob, 16, 2.4, k.l); rect(c, -8, -9.5 + bob, 16, 4.5, k.d); rect(c, -8, -14.8 + bob, 16, 0.8, k.d);
  switch (el) {
    case 'earth': for (let i = 0; i < 4; i++) ell(c, -5 + i * 3.4, -17.5 + bob + (i % 2) * 6, 1.5, 1, k.d); break;
    case 'metal': for (const [rx, ry] of [[-6.4, -18], [6.4, -18], [-6.4, -7], [6.4, -7]]) ell(c, rx, ry + bob, 0.9, 0.9, k.h); rect(c, -8, -12.6 + bob, 16, 0.7, k.a); break;
    case 'ice': for (let i = 0; i < 3; i++) ln(c, -6 + i * 4.6, -19.5 + bob, -3 + i * 4.6, -6 + bob, 0.7, k.fl ? '#fff' : 'rgba(255,255,255,.55)'); break;
    case 'fire': c.globalAlpha = pulse; for (const [a, b, d, e] of [[-6, -18, -2, -14], [6, -17, 3, -12], [-5, -8, -1, -11], [5, -8, 2, -11]]) ln(c, a, b + bob, d, e + bob, 0.9, k.a); c.globalAlpha = 1; break;
    case 'nature': ell(c, -4.4, -18.4 + bob, 3, 1.5, k.s); ell(c, 5, -9 + bob, 2.6, 1.3, k.s); ell(c, -2, -6.4 + bob, 3, 1, k.s); tri(c, 4, -19 + bob, 7, -22 + bob, 6, -18.5 + bob, k.a); break;
    case 'holy': rect(c, -8, -20 + bob, 16, 1, k.a); rect(c, -8, -6 + bob, 16, 1, k.a); break;
    case 'bone': ell(c, 0, -16 + bob, 2.4, 2.2, k.w); rect(c, -1.2, -15 + bob, 2.4, 1.6, k.w); rect(c, -1.4, -17.2 + bob, 0.9, 1, k.dark); rect(c, 0.6, -17.2 + bob, 0.9, 1, k.dark); break;
  }
  if (has('s')) for (let i = 0; i < 4; i++) { const sd = i < 2 ? -1 : 1, yy = i % 2 ? -22 : -17.5; tri(c, sd * 8, yy + 2 + bob, sd * 8, yy - 1 + bob, sd * 12.5, yy - 3.4 + bob, k.s); }
  ell(c, 0, -12 + bob, 3.8, 3.8, k.o); ell(c, 0, -12 + bob, 2.8, 2.8, k.a); glow(c, 0, -12 + bob, 8, k.a, pulse * 0.9); ell(c, -0.7, -12.7 + bob, 0.9, 0.9, '#fff');
  const fy = Math.sin(t * 2) * 1.6;
  for (const [sd, ph] of [[-1, 0], [1, 1.1]] as const) { const x = sd * 12.4, y = -12 + bob + Math.sin(t * 2 + ph) * 1.6; rect(c, sd * 8.2 - 0.9, y - 1.4, 1.8, 2.8, k.dd); ell(c, x, y, 4.4, 4.2, k.o); ell(c, x, y, 3.8, 3.7, k.m); ell(c, x - 0.8, y - 1.2, 1.8, 1.2, k.l); ell(c, x, y + 1.6, 3.2, 1.4, k.d); if (has('a')) ell(c, sd * 9.8, -20 + bob, 3.6, 2.4, k.s); }
  void fy;
  if (has('a')) { ell(c, -8.6, -20.4 + bob, 4, 3, k.s); ell(c, 8.6, -20.4 + bob, 4, 3, k.s); ell(c, -8.8, -21.4 + bob, 2.4, 1, k.h); ell(c, 8.8, -21.4 + bob, 2.4, 1, k.h); }
  rect(c, -4.8, -28.6 + bob, 9.6, 8.8, k.o); rect(c, -4, -28 + bob, 8, 7.4, k.m); rect(c, -4, -28 + bob, 8, 1.6, k.l); rect(c, -4, -23 + bob, 8, 2.4, k.d);
  rect(c, -3, -25.4 + bob, 6.4, 1.8, k.dark); rect(c, -2.2, -25.2 + bob, 1.8, 1.4, k.a); rect(c, 1, -25.2 + bob, 1.8, 1.4, k.a); glow(c, 0, -24.6 + bob, 6, k.a, 0.55);
  if (has('e')) { rect(c, -2.4, -27.2 + bob, 4.8, 0.9, k.a); }
  if (has('h')) horns(c, 0, -28 + bob, k, 1); if (has('c')) crown(c, 0, -28 + bob, k, 1); if (has('o')) halo(c, 0, -34 + bob, 7, t, k);
  return 34;
};

const pPlant: Plan = (c, k, { t, has }) => {
  const sw = Math.sin(t * 2.2) * 2, hx = sw * 1.5 + 1, hy = -17, open = (Math.sin(t * 3) + 1) * 0.5;
  for (let i = 0; i < 4; i++) { const a = Math.PI * (0.1 + i * 0.27); c.strokeStyle = k.dd; c.lineWidth = 1.6; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, -1.5); c.quadraticCurveTo(Math.cos(a) * 5 * (i % 2 ? -1 : 1), 1, Math.cos(a) * 8 * (i % 2 ? -1 : 1), -0.6); c.stroke(); }
  ell(c, 0, -0.6, 5.5, 1.8, k.sd);
  c.strokeStyle = k.o; c.lineWidth = 4.2; c.beginPath(); c.moveTo(0, -1); c.quadraticCurveTo(-sw * 1.2, -9, hx, hy + 2); c.stroke();
  c.strokeStyle = k.m; c.lineWidth = 2.8; c.beginPath(); c.moveTo(0, -1); c.quadraticCurveTo(-sw * 1.2, -9, hx, hy + 2); c.stroke();
  if (has('s')) for (let i = 0; i < 3; i++) { const u = 0.25 + i * 0.25, x = -sw * 0.8 * u * 1.2 + hx * u * u * 0.5, y = -1 + (hy + 3) * u; tri(c, x + 1, y - 1, x + 1, y + 1, x + 4, y - 0.5, k.a); tri(c, x - 1, y - 1.6, x - 1, y + 0.4, x - 4, y - 1.2, k.a); }
  for (const sd of [-1, 1]) { const my = -8 - (sd > 0 ? 2 : 0), lx = sd * (6 + Math.sin(t * 3 + sd) * 1.2); ell(c, lx * 0.8 - sw * 0.5, my, 4.2, 1.8, k.s, sd * -0.5 + Math.sin(t * 3) * 0.1); ell(c, lx * 0.8 - sw * 0.5, my - 0.4, 2.8, 0.7, k.l, sd * -0.5); }
  const petals = has('c');
  if (petals) for (let i = 0; i < 9; i++) { const a = (i / 9) * TAU + t * 0.4; ell(c, hx + Math.cos(a) * 5.6, hy + Math.sin(a) * 5.6, 3.4, 1.8, k.o, a); }
  if (petals) for (let i = 0; i < 9; i++) { const a = (i / 9) * TAU + t * 0.4; ell(c, hx + Math.cos(a) * 5.6, hy + Math.sin(a) * 5.6, 3, 1.5, i % 2 ? k.m : k.l, a); }
  else { ell(c, hx, hy, 7.4, 6.4, k.sd); ell(c, hx, hy - 0.5, 6.4, 5.4, k.s); }
  const jaw = petals ? k.a : k.m, ang = 0.15 + open * 0.75;
  ell(c, hx, hy, 4.7, 4.7, k.o); ell(c, hx + 0.5, hy, 3.4, 3.4 * (0.35 + open * 0.65), k.fl ? '#fff' : '#3a0c18');
  c.save(); c.translate(hx - 3.6, hy); c.rotate(-ang); c.fillStyle = jaw; c.beginPath(); c.ellipse(3.8, -1, 4.4, 2.2, 0, 0, TAU); c.fill(); c.restore();
  c.save(); c.translate(hx - 3.6, hy); c.rotate(ang * 0.7); c.fillStyle = k.d; c.beginPath(); c.ellipse(3.8, 1.2, 4.2, 2, 0, 0, TAU); c.fill(); c.restore();
  for (let i = 0; i < 4; i++) tri(c, hx - 2.4 + i * 1.8, hy - 0.8 - open * 1.5, hx - 1.4 + i * 1.8, hy - 0.8 - open * 1.5, hx - 1.9 + i * 1.8, hy + 0.8 - open * 0.4, k.w);
  if (has('e')) { eyes(c, hx + 0.4, hy - 5.2, 2, 1.1, k, t, true); }
  if (has('h')) horns(c, hx, hy - 5.5, k, 0.8); if (has('o')) halo(c, hx, hy - 10, 7, t, k);
  return 26;
};

const pJelly: Plan = (c, k, { t, has, art }) => {
  const y = -17 + Math.sin(t * 2.5) * 2.5, p = Math.sin(t * 4), rx = 8 + p * 0.9, ry = 6.5 - p * 0.7;
  if (has('w')) for (const sd of [-1, 1]) { const f = Math.sin(t * 3 + sd) * 0.25; c.globalAlpha = k.fl ? 1 : 0.75; tri(c, sd * 4, y + 1, sd * 17, y - 4 + f * 10, sd * 14, y + 6 + f * 6, k.s); tri(c, sd * 4, y + 1, sd * 14, y - 2 + f * 9, sd * 10, y + 5, k.m); c.globalAlpha = 1; }
  for (let i = 0; i < 7; i++) {
    const x = -6.5 + i * 2.2, len = 9 + (i % 3) * 3, thin = i % 2; c.strokeStyle = thin ? k.s : k.m; c.lineWidth = thin ? 1 : 1.7; c.lineCap = 'round'; c.globalAlpha = k.fl ? 1 : 0.8; c.beginPath(); c.moveTo(x, y + ry * 0.5);
    for (let j = 1; j <= 6; j++) c.lineTo(x + Math.sin(t * 3 + i * 0.9 + j * 0.8) * (1 + j * 0.35), y + ry * 0.5 + (len * j) / 6); c.stroke(); c.globalAlpha = 1;
    if (has('s') || thin) { const tx = x + Math.sin(t * 3 + i * 0.9 + 4.8) * 3.1, ty = y + ry * 0.5 + len; ell(c, tx, ty, 0.9, 0.9, k.a); if (!k.fl) glow(c, tx, ty, 2.4, k.a, 0.5); }
  }
  c.globalAlpha = k.fl ? 1 : 0.84; c.fillStyle = k.m; c.beginPath(); c.ellipse(0, y, rx, ry, 0, Math.PI, TAU);
  for (let i = 0; i <= 5; i++) { const x = rx - (i * 2 * rx) / 5; c.quadraticCurveTo(x + rx / 5, y + 2.6 + Math.sin(t * 5 + i) * 0.8, x, y); } c.closePath(); c.fill();
  c.globalAlpha = k.fl ? 1 : 0.5; ell(c, -rx * 0.28, y - ry * 0.45, rx * 0.42, ry * 0.26, k.l, -0.3); c.globalAlpha = 1;
  c.globalAlpha = k.fl ? 1 : 0.55; for (let i = 0; i < 3; i++) { c.strokeStyle = k.s; c.lineWidth = 0.9; c.beginPath(); c.moveTo((i - 1) * rx * 0.55, y - ry * 0.1); c.quadraticCurveTo((i - 1) * rx * 0.4, y - ry * 0.7, (i - 1) * rx * 0.15, y - ry * 0.95); c.stroke(); } c.globalAlpha = 1;
  const pu = 0.5 + Math.sin(t * 4 + 1) * 0.3; c.globalAlpha = pu; ell(c, 0, y - 0.6, 2.4, 2.1, k.a); c.globalAlpha = 1; glow(c, 0, y - 0.6, 6, k.a, pu * 0.7);
  if (has('e')) for (let i = 0; i < 4; i++) { c.globalAlpha = Math.max(0, Math.sin(t * 3 + i * 1.7)); rect(c, -5 + i * 3.2, y - ry * 0.65 + (i % 2) * 2.4, 1.2, 1.2, k.a); } c.globalAlpha = 1;
  ell(c, 3.4, y + 0.4, 1, 1.2, k.dark); ell(c, -1.4, y + 0.4, 1, 1.2, k.dark);
  if (has('c')) crown(c, 0, y - ry + 0.6, k, 1); if (has('o')) halo(c, 0, y - ry - 5, 7, t, k);
  void art; return 28;
};

const pEye: Plan = (c, k, { t, has, dir, art }) => {
  const y = -16 + Math.sin(t * 3) * 2, R = 8, wob = Math.sin(t * 1.3) * 0.7;
  if (has('w')) for (const sd of [-1, 1]) { const f = Math.sin(t * 8) * 0.4; tri(c, sd * 6, y, sd * 17, y - 4 - f * 6, sd * 13, y + 5, k.s); tri(c, sd * 6, y, sd * 15, y - 2 - f * 5, sd * 11, y + 3, k.l); }
  if (has('s')) for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU + t * 0.5; tri(c, Math.cos(a - 0.12) * R, y + Math.sin(a - 0.12) * R, Math.cos(a + 0.12) * R, y + Math.sin(a + 0.12) * R, Math.cos(a) * (R + 4.2), y + Math.sin(a) * (R + 4.2), k.s); }
  if (has('e')) for (let i = 0; i < 3; i++) { const a = t * 1.1 + (i / 3) * TAU, ex = Math.cos(a) * 13, ey = y + Math.sin(a) * 6 - 2; ln(c, 0, y + 3, ex, ey, 1.3, k.sd); ell(c, ex, ey, 3, 3, k.o); ell(c, ex, ey, 2.6, 2.6, k.w); ell(c, ex + 0.4, ey, 1.3, 1.3, k.s); ell(c, ex + 0.4, ey, 0.6, 0.6, k.dark); }
  else for (let i = 0; i < 3; i++) { c.strokeStyle = k.sd; c.lineWidth = 1.3; c.lineCap = 'round'; c.beginPath(); c.moveTo((i - 1) * 3, y + R * 0.8); c.quadraticCurveTo((i - 1) * 4 + Math.sin(t * 4 + i) * 2, y + R + 4, (i - 1) * 5 + Math.sin(t * 3 + i) * 2.5, y + R + 8); c.stroke(); }
  ell(c, wob, y, R + 1.1, R + 1.1, k.o); ell(c, wob, y, R, R, k.m); ell(c, wob, y + R * 0.38, R * 0.86, R * 0.58, k.d); ell(c, wob - 2.6, y - R * 0.5, 2.8, 1.8, k.l, -0.4);
  if (['blood', 'poison', 'fire', 'shock'].includes(art.el) || has('g')) { c.globalAlpha = 0.6; for (let i = 0; i < 4; i++) { const a = (i / 4) * TAU + 0.6; c.strokeStyle = k.a; c.lineWidth = 0.6; c.beginPath(); c.moveTo(wob + Math.cos(a) * R * 0.95, y + Math.sin(a) * R * 0.95); c.lineTo(wob + Math.cos(a) * R * 0.5, y + Math.sin(a) * R * 0.5); c.stroke(); } c.globalAlpha = 1; }
  const lx = [0, -1, 1, 0][dir] * 2.8 + Math.sin(t * 0.9) * 0.9, ly = [1, 0, 0, -1][dir] * 2.4 + Math.cos(t * 1.1) * 0.7, ix = wob + lx, iy = y + ly;
  ell(c, ix, iy, 4.6, 4.6, k.o); ell(c, ix, iy, 4.1, 4.1, k.s); ell(c, ix, iy, 3, 3, k.m === k.s ? k.a : k.a); c.globalAlpha = 0.4; ell(c, ix, iy, 4.1, 4.1, k.s); c.globalAlpha = 1;
  const slit = art.el === 'fire' || art.el === 'shadow' || art.el === 'void';
  ell(c, ix, iy, slit ? 0.9 : 2, 2.8, k.dark); ell(c, ix - 1.1, iy - 1.4, 0.9, 0.9, '#fff'); glow(c, ix, iy, 6, k.a, 0.45);
  const bl = t % 4.1 > 3.95 ? 1 : 0; ell(c, wob, y - R * (0.55 - bl * 0.6) , R * 0.95, R * 0.5 + bl * R * 0.55, k.d, 0); // pálpebra
  c.save(); c.beginPath(); c.arc(wob, y, R, 0, TAU); c.clip(); tri(c, wob - R, y - R, wob + R, y - R, wob - R, y - 1.2, k.dd); tri(c, wob - R, y - R, wob + R, y - R, wob + R, y - 3.4, k.dd); c.restore();
  if (has('h')) horns(c, wob, y - R + 0.8, k, 1.1); if (has('c')) crown(c, wob, y - R + 0.6, k, 1.1); if (has('o')) halo(c, wob, y - R - 5, 8, t, k);
  return 28;
};

const pCrab: Plan = (c, k, { t, has, art }) => {
  const ph = t * 9, spider = has('l'), bob = Math.abs(Math.sin(ph)) * -0.6;
  if (has('t')) { // cauda de escorpião
    const pts: [number, number][] = []; for (let i = 0; i < 6; i++) { const u = i / 5; pts.push([-8 + Math.sin(u * 2.4) * 4 - u * 4 + u * u * 13, -9 + bob - Math.sin(u * Math.PI * 0.95) * 15 + Math.sin(t * 3 + i) * 0.7]); }
    for (let i = 0; i < 6; i++) ell(c, pts[i][0], pts[i][1], 2.9 - i * 0.2, 2.9 - i * 0.2, k.o);
    for (let i = 0; i < 6; i++) ell(c, pts[i][0], pts[i][1], 2.3 - i * 0.18, 2.3 - i * 0.18, i % 2 ? k.m : k.d);
    const [sx, sy] = pts[5]; tri(c, sx - 1.3, sy, sx + 1.3, sy + 0.3, sx + 1, sy + 4.2, k.a); glow(c, sx + 0.6, sy + 3, 3.2, k.a, 0.7);
  }
  const nl = spider ? 4 : 3;
  for (const far of [true, false]) for (let i = 0; i < nl; i++) {
    const pp = ph + i * 1.7 + (far ? Math.PI : 0), s = Math.sin(pp), lift = Math.max(0, Math.cos(pp)) * 2.4, hx = -5 + i * (spider ? 3.4 : 3.8) + (far ? 1 : 0);
    const kx = hx + (i - 1.2) * (spider ? 3.4 : 2.4), ky = spider ? -17 - lift * 0.5 : -11 - lift * 0.4, fx = hx + (i - 1.2) * (spider ? 6 : 4.8) + s * 2, fy = -0.8 - lift;
    ln(c, hx, -7 + bob, kx, ky, spider ? 1.2 : 1.7, far ? k.dd : k.d); ln(c, kx, ky, fx, fy, spider ? 1 : 1.5, far ? k.dd : k.d);
  }
  if (spider) {
    shaded(c, -5.5, -9 + bob, 5.2, 4.4, k); if (has('t') === false) { ell(c, -5.5, -11 + bob, 2.4, 1, k.s); ell(c, -5.5, -9.4 + bob, 1.4, 1.4, k.a); glow(c, -5.5, -9.4 + bob, 3.6, k.a, 0.5 + Math.sin(t * 3) * 0.2); }
    shaded(c, 1.5, -9.4 + bob, 4.2, 3.6, k);
    for (let i = 0; i < 6; i++) ell(c, 4 + (i % 3) * 1.1, -11.2 + bob + Math.floor(i / 3) * 1.8, 0.6 + (i === 1 ? 0.35 : 0), 0.6 + (i === 1 ? 0.35 : 0), i % 2 ? k.a : k.w);
    glow(c, 5, -10.4 + bob, 4, k.a, 0.45); tri(c, 5.2, -7.4 + bob, 6.4, -7.6 + bob, 6.4 + Math.sin(t * 8) * 0.4, -5.2 + bob, k.dd);
  } else {
    shaded(c, 0, -7.4 + bob, 9.4, 5, k); for (let i = 0; i < 3; i++) ln(c, -4 + i * 4, -11 + bob, -3.4 + i * 4, -6 + bob, 0.8, k.d);
    if (has('a')) { ell(c, -3, -9.4 + bob, 4.4, 1.4, k.h); ell(c, 4, -9 + bob, 3, 1.2, k.h); }
    if (has('s')) for (let i = 0; i < 4; i++) tri(c, -6 + i * 3.6, -11.6 + bob, -3.8 + i * 3.6, -11.6 + bob, -5 + i * 3.6, -15.4 + bob, k.a);
    for (const [ex, s] of [[3.6, 0], [6.6, 1]] as const) { ln(c, ex, -11 + bob, ex + 0.4, -15 + bob + Math.sin(t * 5 + s) * 0.6, 1.1, k.dd); ell(c, ex + 0.4, -15.6 + bob, 1.5, 1.5, k.w); ell(c, ex + 0.9, -15.6 + bob, 0.7, 0.7, '#14101c'); }
    if (has('e')) { ell(c, 5, -12.4 + bob, 1, 1, k.a); glow(c, 5, -12.4 + bob, 3, k.a, 0.5); }
    const op = (Math.sin(t * 4) + 1) * 0.35, ex = 9 + Math.sin(ph) * 0.4, ey = -8 + bob;
    for (const [sd, ph2] of [[1, 0], [0.55, 1.3]] as const) { const cy = ey + (sd === 1 ? -0.6 : 2.6); ln(c, 4.6, cy, ex + 3.4 * sd, cy - 2.4 + Math.sin(t * 3 + ph2) * 0.8, 2.2, k.d);
      const cx = ex + 5.6 * sd + 1.6, cyy = cy - 3.2 + Math.sin(t * 3 + ph2) * 0.8; c.save(); c.translate(cx, cyy); c.rotate(-op);
      ell(c, 2.2, -1.4, 4.2, 2.1, k.o); ell(c, 2.2, -1.4, 3.6, 1.7, k.s); c.rotate(op * 2); ell(c, 2, 1.3, 3.6, 1.7, k.o); ell(c, 2, 1.3, 3.1, 1.3, k.sd); c.restore(); }
  }
  if (has('o')) halo(c, 0, -17, 7, t, k);
  void art; return spider ? 20 : 18;
};

const pShroom: Plan = (c, k, { t, has }) => {
  const ph = t * 5, hop = Math.abs(Math.sin(ph)), sq = 1 + Math.sin(ph) * 0.06, rot = Math.sin(ph) * 0.07;
  c.save(); c.translate(0, -hop * 1.8); c.rotate(rot);
  for (const [fx, up] of [[-2.6, Math.sin(ph) > 0 ? 1.2 : 0], [2.6, Math.sin(ph) > 0 ? 0 : 1.2]] as const) ell(c, fx, -0.8 - up, 2.4, 1.4, k.dd);
  ell(c, 0, -6, 4.8, 6.4, k.o); ell(c, 0, -6, 4.2, 6, k.w); ell(c, 1.6, -5, 2.4, 5.2, k.fl ? '#fff' : 'rgba(150,120,90,.22)');
  const ah = Math.sin(ph) * 1.5; ln(c, -4, -5, -6.4, -3 + ah, 1.8, k.w); ln(c, 4, -5, 6.4, -3 - ah, 1.8, k.w);
  eyes(c, 1.2, -6.4, 2, 1.1, k, t); c.strokeStyle = k.dark; c.lineWidth = 0.8; c.beginPath(); c.arc(1.4, -3.8, 1.2, 0.2, Math.PI - 0.2); c.stroke();
  const capY = -10.4;
  if (has('s')) for (let i = 0; i < 5; i++) tri(c, -6 + i * 3, capY - 4.5 * sq, -4 + i * 3, capY - 4.5 * sq, -5 + i * 3, capY - 8.5, k.s);
  c.fillStyle = k.o; c.beginPath(); c.ellipse(0, capY, 11, 7.8 * sq, 0, Math.PI, TAU); c.fill(); rect(c, -11, capY - 0.6, 22, 2.2, k.o);
  c.fillStyle = k.m; c.beginPath(); c.ellipse(0, capY, 10.2, 7 * sq, 0, Math.PI, TAU); c.fill();
  c.fillStyle = k.d; c.beginPath(); c.ellipse(0, capY, 10.2, 3.4 * sq, 0, Math.PI, TAU); c.fill(); ell(c, 0, capY, 10.2, 3.6, k.m); c.fillStyle = k.m; c.beginPath(); c.ellipse(0, capY, 10.2, 7 * sq, 0, Math.PI, TAU); c.fill();
  ell(c, -3.4, capY - 4.4, 3.8, 1.6, k.l, -0.4);
  ell(c, 0, capY + 0.9, 9.4, 1.6, k.dd); for (let i = 0; i < 7; i++) ln(c, -8 + i * 2.6, capY + 0.2, -8 + i * 2.6, capY + 1.7, 0.6, k.o);
  const spots: [number, number, number][] = [[-5, -3.6, 1.8], [2, -5.4, 2.1], [6, -2.4, 1.4], [-1, -1.8, 1.2]];
  for (const [sx, sy, sr] of spots) { ell(c, sx, capY + sy, sr, sr * 0.8, has('g') ? k.a : k.s); if (has('g')) glow(c, sx, capY + sy, sr * 2.8, k.a, 0.5 + Math.sin(t * 4 + sx) * 0.3); }
  if (has('a')) { rect(c, -10.4, capY - 0.6, 20.8, 2, k.s); for (let i = 0; i < 5; i++) ell(c, -8 + i * 4, capY + 0.4, 0.5, 0.5, k.h); ln(c, 8.4, -4, 10.6, -17, 1.1, k.fl ? '#fff' : '#6a4a2a'); tri(c, 9.4, -16.4, 11.8, -16.4, 10.6, -21.4, k.fl ? '#fff' : '#d8e0e8'); }
  if (has('e')) { eyes(c, 0, capY - 3.4, 1, 1.8, k, t, true); }
  if (has('h')) horns(c, 0, capY - 6.6, k, 1); if (has('c')) crown(c, 0, capY - 7, k, 1.1); if (has('o')) halo(c, 0, capY - 12, 8, t, k);
  c.restore();
  if (!k.fl) for (let i = 0; i < 3; i++) { const p = (t * 0.6 + i / 3) % 1; c.globalAlpha = (1 - p) * 0.7; ell(c, Math.sin(i * 2.1 + t) * 4, -20 - p * 8, 1 + p, 1 + p, k.a); c.globalAlpha = 1; }
  return 22;
};

const pWisp: Plan = (c, k, { t, has }) => {
  const cy = -12 + Math.sin(t * 3.4) * 1.8;
  glow(c, 0, cy - 2, 12, k.a, 0.45 + Math.sin(t * 6) * 0.1);
  if (has('w')) for (const sd of [-1, 1]) { const f = Math.sin(t * 20) * 0.5; c.globalAlpha = k.fl ? 1 : 0.55; ell(c, sd * 6.4, cy - 4, 5, 2 + Math.abs(f) * 1.6, k.l, sd * (-0.6 + f * 0.3)); c.globalAlpha = 1; }
  const layers: [string, number, number][] = [[k.s, 6.8, 20], [k.m, 5.2, 17], [k.a, 3, 12]];
  layers.forEach(([col, r, h], i) => {
    const tx = Math.sin(t * 9 + i * 1.3) * 1.6, ty = cy - h + Math.sin(t * 13 + i * 2) * 1.6, base = cy + r * 0.45;
    c.globalAlpha = k.fl ? 1 : 0.92 - i * 0.08; c.fillStyle = col; c.beginPath(); c.moveTo(tx, ty);
    c.bezierCurveTo(r * 1.1, ty + h * 0.45, r * 1.15, base - r * 0.2, 0, base + r * 0.6); c.bezierCurveTo(-r * 1.15, base - r * 0.2, -r * 1.1, ty + h * 0.45, tx, ty); c.fill();
  });
  c.globalAlpha = 1;
  for (const sd of [-1, 1]) { const f = Math.sin(t * 11 + sd * 2) * 1.2; c.fillStyle = k.m; c.beginPath(); c.moveTo(sd * 5.6, cy - 3); c.quadraticCurveTo(sd * 9 + f, cy - 6, sd * 8 + f * 1.4, cy - 10 + f); c.quadraticCurveTo(sd * 6.4, cy - 7, sd * 4.4, cy - 2); c.fill(); }
  ell(c, 2.8, cy - 0.6, 1.3, 1.8, k.dark); ell(c, -1.4, cy - 0.6, 1.3, 1.8, k.dark); if (!k.fl) { rect(c, 2.5, cy - 1.8, 0.9, 0.9, '#fff'); rect(c, -1.7, cy - 1.8, 0.9, 0.9, '#fff'); }
  if (has('e')) ell(c, 0.7, cy - 4.4, 0.9, 0.9, k.dark);
  if (has('h')) for (const sd of [-1, 1]) { c.fillStyle = k.s; c.beginPath(); c.moveTo(sd * 2.6, cy - 5); c.quadraticCurveTo(sd * 5.6, cy - 9, sd * 3.2 + Math.sin(t * 8) * 0.8, cy - 12); c.quadraticCurveTo(sd * 3.4, cy - 8, sd * 0.8, cy - 5); c.fill(); }
  if (has('c')) crown(c, 0, cy - 15, k, 1);
  if (has('o')) { const a = t * 2; c.globalAlpha = 0.9; c.strokeStyle = k.a; c.lineWidth = 1.1; c.beginPath(); c.ellipse(0, cy - 2, 9.6, 3.2, -0.4, a, a + 4.2); c.stroke(); c.globalAlpha = 1; }
  return 26;
};

const PLANS: Record<string, Plan> = { blob: pBlob, quad: pQuad, biped: pBiped, bird: pBird, insect: pInsect, serpent: pSerpent, wraith: pWraith, golem: pGolem, plant: pPlant, jelly: pJelly, eye: pEye, crab: pCrab, shroom: pShroom, wisp: pWisp };
const SCALE: Record<string, number> = { golem: 0.78, wraith: 0.92, biped: 0.9, serpent: 0.95 };

/** Desenha uma criatura da Legião. Retorna false se o tipo não for da Legião. */
export function drawLegion(c: Ctx, kind: string, t: number, dir: number, flash: boolean, tint?: string): boolean {
  const art = LEGION_ART[kind]; if (!art) return false;
  const k = kit(art, flash, tint), f = art.f, sc = SCALE[art.plan] ?? 1;
  c.save(); if (dir === 1) c.scale(-1, 1); if (sc !== 1) c.scale(sc, sc);
  c.lineJoin = 'round';
  const h = PLANS[art.plan](c, k, { t, dir, has: (ch) => f.includes(ch), art });
  aura(c, art.el, t, 10, h, k);
  // casca fechada (golems, caranguejos, escaravelhos): escudo translúcido
  if (art.trait === 'shell' && Math.sin(t * 1.4) <= -0.2 && !flash) {
    c.globalAlpha = 0.35; ell(c, 0, -h * 0.45, 12, h * 0.55, k.a); c.globalAlpha = 0.9; c.strokeStyle = k.a; c.lineWidth = 1.2; c.beginPath(); c.ellipse(0, -h * 0.45, 12, h * 0.55, 0, 0, TAU); c.stroke(); c.globalAlpha = 1;
  }
  c.restore();
  return true;
}
