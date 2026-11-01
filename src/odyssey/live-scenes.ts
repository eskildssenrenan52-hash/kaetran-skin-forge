// Cenas ao vivo: acontecem dentro do próprio mundo, sem pular nem sair do jogo.
// - Descida da Deusa: depois de libertada, ela desce do céu num pilar de luz e abençoa o herói.
// - Tela de chefe: quando um chefe vê o herói, uma apresentação cinematográfica única por chefe.
// Tudo é desenhado no canvas do jogo; o estado vive em `g.live` / `g.bossCard` (não é salvo).
import type { Game } from "./engine";
import { drawChar, drawEnemy } from "./gfx";
import type { EnemyKind } from "./data";

type Sub = { a: number; b: number; who?: string; text: string };
export interface LiveScene { kind: "goddess"; id: string; name: string; color: string; t: number; dur: number; subs: Sub[]; ox: number; oy: number; feathers: { x: number; y: number; vx: number; vy: number; r: number; s: number }[]; blessed: boolean; onDone?: (() => void) | undefined }
export interface BossCard { id: string; name: string; epithet: string; kind: EnemyKind; tint: string; scale: number; color: string; t: number; dur: number; style: number; seed: number; shards: { x: number; y: number; vx: number; vy: number; a: number; va: number; s: number }[]; after?: (() => void) | undefined }

const seedOf = (s: string) => { let n = 2166136261; for (const ch of s) n = Math.imul(n ^ ch.charCodeAt(0), 16777619) >>> 0; return n; };
const ease = (x: number) => x <= 0 ? 0 : x >= 1 ? 1 : 1 - Math.pow(1 - x, 3);
const clamp = (x: number) => Math.max(0, Math.min(1, x));
const FONT = "'Press Start 2P', monospace";

/* ───────────────────────── Descida da Deusa ───────────────────────── */
export function startGoddess(g: Game, opt: { id: string; name: string; color: string; lines: string[]; onDone?: () => void }) {
  if (g.discoveries.has(`blessing:${opt.id}`) || g.live) return;
  const L = opt.lines;
  const subs: Sub[] = [
    { a: 0.6, b: 3.4, text: "O céu se abre..." },
    { a: 7.4, b: 10.4, who: opt.name, text: L[0] ?? "Você quebrou minhas correntes." },
    { a: 10.6, b: 13.6, who: opt.name, text: L[1] ?? "Aceite minha bênção, herói." },
    { a: 15.2, b: 18.2, text: "✦ Bênção concedida: força, escudo e cura renovados ✦" },
    { a: 18.6, b: 21.4, who: opt.name, text: L[2] ?? "Eu estarei olhando por você." },
  ];
  g.live = { kind: "goddess", id: opt.id, name: opt.name, color: opt.color, t: 0, dur: 23, subs, ox: g.p.x, oy: g.p.y, feathers: [], blessed: false, onDone: opt.onDone };
  g.keys.clear(); g.moveTarget = null; g.audio.sfx("light");
}

function tickGoddess(g: Game, s: LiveScene, dt: number) {
  const prev = s.t; s.t += dt;
  // penas douradas caem desde que o céu se abre
  if (s.t > 2 && s.t < 20 && Math.random() < dt * 14) s.feathers.push({ x: s.ox + (Math.random() - .5) * 220, y: s.oy - 160, vx: (Math.random() - .5) * 8, vy: 14 + Math.random() * 12, r: Math.random() * 6, s: .6 + Math.random() * .8 });
  for (const f of s.feathers) { f.x += f.vx * dt + Math.sin(s.t * 2 + f.r) * 10 * dt; f.y += f.vy * dt; f.r += dt * 2; }
  s.feathers = s.feathers.filter((f) => f.y < s.oy + 110);
  if (prev < 2.2 && s.t >= 2.2) { g.shake = 4; g.audio.sfx("boss"); }
  if (prev < 13.8 && s.t >= 13.8 && !s.blessed) {
    s.blessed = true; g.discoveries.add(`blessing:${s.id}`);
    g.p.hp = g.maxHp(); g.p.mp = g.maxMp();
    g.buffs.might = Math.max(g.buffs.might, 180); g.buffs.shield = Math.max(g.buffs.shield, 180); g.buffs.regen = Math.max(g.buffs.regen, 180); g.buffs.luck = Math.max(g.buffs.luck, 180);
    g.burst(g.p.x, g.p.y - 10, s.color, 60, 140, 3); g.burst(g.p.x, g.p.y - 10, "#fff6c0", 40, 90, 2); g.shake = 6; g.audio.sfx("light");
  }
  if (s.t >= s.dur) { g.live = null; g.save(); s.onDone?.(); }
}

function goddessY(s: LiveScene) {
  const t = s.t;
  if (t < 3) return s.oy - 200;
  if (t < 7.2) return s.oy - 200 + ease((t - 3) / 4.2) * 168;     // desce
  if (t < 13) return s.oy - 32 + Math.sin(t * 2) * 2;               // paira e fala
  if (t < 14.4) return s.oy - 32 + ease((t - 13) / 1.4) * 10;       // toca a testa
  if (t < 18.4) return s.oy - 22 - ease((t - 14.4) / 4) * 14;       // recua
  return s.oy - 36 - ease((t - 18.4) / 4) * 190;                     // sobe
}

function drawGoddessWorld(g: Game, c: CanvasRenderingContext2D, s: LiveScene) {
  const t = s.t, x = s.ox, gy = goddessY(s), col = s.color;
  const beam = clamp((t - 1.6) / 1.2) * (1 - clamp((t - 21.5) / 1.4));
  c.save();
  // pilar de luz vindo do céu
  if (beam > 0) {
    c.globalCompositeOperation = "lighter";
    const w = 18 + Math.sin(t * 3) * 3 + beam * 10;
    const gr = c.createLinearGradient(x - w, 0, x + w, 0);
    gr.addColorStop(0, "rgba(255,240,180,0)"); gr.addColorStop(.5, `rgba(255,240,190,${.42 * beam})`); gr.addColorStop(1, "rgba(255,240,180,0)");
    c.fillStyle = gr; c.fillRect(x - w, s.oy - 400, w * 2, 400 + 8);
    // anel no chão
    c.strokeStyle = `rgba(255,236,160,${.55 * beam})`; c.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) { const r = ((t * 22 + i * 14) % 42) + 6; c.globalAlpha = beam * (1 - r / 48); c.beginPath(); c.ellipse(x, s.oy + 2, r, r * .38, 0, 0, Math.PI * 2); c.stroke(); }
    c.globalAlpha = 1;
    // poeira de luz subindo
    for (let i = 0; i < 26; i++) { const k = (i * 37.7 + t * 30) % 140, px = x + Math.sin(i * 12.9 + t) * (8 + (i % 5) * 3); c.fillStyle = `rgba(255,250,210,${beam * (1 - k / 140)})`; c.fillRect(px, s.oy - k, 1, 1); }
    c.globalCompositeOperation = "source-over";
  }
  // penas
  for (const f of s.feathers) { c.save(); c.translate(f.x, f.y); c.rotate(Math.sin(f.r) * .8); c.fillStyle = "rgba(255,244,200,.85)"; c.fillRect(-2 * f.s, 0, 4 * f.s, 1); c.fillStyle = col; c.fillRect(-1 * f.s, -1, 2 * f.s, 1); c.restore(); }
  if (t > 2.6) {
    // aura
    c.globalCompositeOperation = "lighter";
    const ar = c.createRadialGradient(x, gy - 10, 2, x, gy - 10, 46);
    ar.addColorStop(0, "rgba(255,250,220,.75)"); ar.addColorStop(.4, `${col}55`); ar.addColorStop(1, "rgba(0,0,0,0)");
    c.fillStyle = ar; c.beginPath(); c.arc(x, gy - 10, 46, 0, Math.PI * 2); c.fill();
    c.globalCompositeOperation = "source-over";
    // asas: batem lentamente
    const flap = Math.sin(t * (t < 7.2 || t > 18.4 ? 5 : 2.2)) * .35;
    for (const side of [-1, 1]) {
      c.save(); c.translate(x + side * 3, gy - 14); c.scale(side, 1); c.rotate(-.3 + flap);
      for (let k = 0; k < 6; k++) { c.fillStyle = k % 2 ? "rgba(255,250,235,.92)" : `${col}`; c.beginPath(); c.ellipse(6 + k * 3.4, -2 - k * 1.6, 9 - k, 2.2, -.5 + k * .12, 0, Math.PI * 2); c.fill(); }
      c.restore();
    }
    // corpo: vestido longo e cabelo de luz
    c.fillStyle = "rgba(255,248,230,.95)"; c.beginPath(); c.moveTo(x - 4, gy - 8); c.lineTo(x + 4, gy - 8); c.lineTo(x + 7 + Math.sin(t * 3) * 1.5, gy + 8); c.lineTo(x - 7 + Math.sin(t * 3 + 1) * 1.5, gy + 8); c.closePath(); c.fill();
    c.fillStyle = col; c.fillRect(x - 4, gy - 6, 8, 1);
    drawChar(c, x, gy - 6, { skin: "#fbefd8", hair: "#fff2b0", body: "#fff8ea", legs: "#fff8ea" }, 0, 0);
    // cabelo esvoaçante
    c.fillStyle = "#fff2b0"; for (let i = 0; i < 5; i++) c.fillRect(x - 5 - i + Math.sin(t * 2 + i) * 1.2, gy - 22 + i * 2, 2, 2);
    // auréola
    c.strokeStyle = "rgba(255,236,150,.95)"; c.lineWidth = 1; c.beginPath(); c.ellipse(x, gy - 30, 6, 2, 0, 0, Math.PI * 2); c.stroke();
    // mão estendida na bênção
    if (t > 12.6 && t < 15) { const k = clamp((t - 12.6) / 1.2); c.fillStyle = "#fff6c0"; c.globalAlpha = k; c.beginPath(); c.arc(x, gy + 4 + k * 6, 2 + k * 3, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1; }
  }
  // brilho dourado no herói depois da bênção
  if (s.blessed) { c.globalCompositeOperation = "lighter"; const k = 1 - clamp((t - 13.8) / 8); c.strokeStyle = `rgba(255,230,140,${.6 * k + .15})`; c.lineWidth = 1; c.beginPath(); c.ellipse(g.p.x, g.p.y + 1, 9 + Math.sin(t * 4) * 1.5, 3.5, 0, 0, Math.PI * 2); c.stroke(); c.globalCompositeOperation = "source-over"; }
  c.restore();
}

/* ───────────────────────── Tela de chefe ───────────────────────── */
const EPITHETS = ["O Que Não Dorme", "Senhor das Ruínas", "A Fome Antiga", "Coroa de Cinzas", "Guardião do Selo", "O Último Juramento", "Eco Sem Dono", "Arauto da Ruína", "A Ferida do Mundo", "Rei Sem Reino", "Sombra Sob a Maré", "O Que Viu o Fim"];
export function startBossCard(g: Game, opt: { id: string; name: string; kind: EnemyKind; tint: string; scale: number; color?: string; place?: string; after?: () => void }) {
  if (g.bossCard) return;
  const seed = seedOf(opt.id);
  const epithet = `${EPITHETS[seed % EPITHETS.length]}${opt.place ? ` · ${opt.place}` : ""}`;
  g.bossCard = { id: opt.id, name: opt.name, epithet, kind: opt.kind, tint: opt.tint, scale: opt.scale, color: opt.color ?? opt.tint, t: 0, dur: 6.2, style: seed % 6, seed, shards: [], after: opt.after };
  g.keys.clear(); g.moveTarget = null; g.audio.sfx("boss"); g.shake = 10;
}
export function skipBossCard(g: Game) { const b = g.bossCard; if (b && b.t > 1.2) b.t = Math.max(b.t, b.dur - .5); }

function tickBossCard(g: Game, b: BossCard, dt: number) {
  const prev = b.t; b.t += dt;
  if (prev < 1.6 && b.t >= 1.6) { for (let i = 0; i < 46; i++) { const a = Math.random() * Math.PI * 2, v = 60 + Math.random() * 200; b.shards.push({ x: 0, y: 0, vx: Math.cos(a) * v, vy: Math.sin(a) * v, a: 0, va: (Math.random() - .5) * 12, s: 2 + Math.random() * 5 }); } g.audio.sfx("fire"); g.shake = 8; }
  for (const s of b.shards) { s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 60 * dt; s.a += s.va * dt; }
  if (b.t >= b.dur) { g.bossCard = null; b.after?.(); }
}

function drawBossCard(g: Game, c: CanvasRenderingContext2D, b: BossCard) {
  const w = g.viewWidth, h = g.viewHeight, t = b.t, col = b.color;
  const fadeOut = 1 - clamp((t - (b.dur - .6)) / .6);
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = fadeOut;
  // escurece o mundo
  c.fillStyle = `rgba(4,2,8,${.78 * clamp(t / .35)})`; c.fillRect(0, 0, w, h);
  const cx = w / 2, cy = h * .46;
  // fundo próprio de cada chefe
  c.save(); c.globalCompositeOperation = "lighter";
  const k = ease(t / 1.2);
  if (b.style === 0) { // golpes diagonais
    for (let i = 0; i < 7; i++) { const off = ((i * 53 + b.seed) % w) - w * .2 + (t * 80 * (i % 2 ? 1 : -1)); c.fillStyle = `${col}${i % 2 ? "33" : "22"}`; c.beginPath(); c.moveTo(off, 0); c.lineTo(off + 26, 0); c.lineTo(off - 80, h); c.lineTo(off - 106, h); c.fill(); }
  } else if (b.style === 1) { // eclipse
    c.fillStyle = `${col}44`; c.beginPath(); c.arc(cx, cy, 70 * k, 0, Math.PI * 2); c.fill();
    c.fillStyle = "rgba(0,0,0,1)"; c.globalCompositeOperation = "source-over"; c.beginPath(); c.arc(cx + 8 * k, cy - 4, 62 * k, 0, Math.PI * 2); c.fill(); c.globalCompositeOperation = "lighter";
    for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2 + t * .4; c.strokeStyle = `${col}55`; c.beginPath(); c.moveTo(cx + Math.cos(a) * 72 * k, cy + Math.sin(a) * 72 * k); c.lineTo(cx + Math.cos(a) * (90 + (i % 3) * 14) * k, cy + Math.sin(a) * (90 + (i % 3) * 14) * k); c.stroke(); }
  } else if (b.style === 2) { // círculo rúnico
    c.strokeStyle = `${col}aa`; c.lineWidth = 1;
    for (const [r, sp] of [[78, .5], [62, -.8], [44, 1.3]] as const) { c.save(); c.translate(cx, cy); c.rotate(t * sp); c.beginPath(); c.arc(0, 0, r * k, 0, Math.PI * 2); c.stroke(); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; c.fillStyle = col; c.fillRect(Math.cos(a) * r * k - 2, Math.sin(a) * r * k - 2, 4, 4); } c.restore(); }
  } else if (b.style === 3) { // persianas horizontais
    for (let i = 0; i < 9; i++) { const yy = i * h / 9, d = ease((t - i * .05) / .5); c.fillStyle = `${col}${i % 2 ? "30" : "18"}`; c.fillRect(i % 2 ? w * (1 - d) : 0, yy, w * d, h / 9 - 2); }
  } else if (b.style === 4) { // raios de choque
    for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2 + (b.seed % 7); c.strokeStyle = `${col}${(Math.sin(t * 9 + i) > 0 ? "88" : "33")}`; c.lineWidth = 2; c.beginPath(); let x = cx, y = cy; c.moveTo(x, y); for (let j = 1; j < 6; j++) { x = cx + Math.cos(a) * j * 30 * k + Math.sin(i * 7 + j + Math.floor(t * 12)) * 6; y = cy + Math.sin(a) * j * 30 * k + Math.cos(i * 5 + j + Math.floor(t * 12)) * 6; c.lineTo(x, y); } c.stroke(); }
  } else { // vidro estilhaçado / partida vertical
    const d = ease((t - .2) / .7) * 22; c.fillStyle = `${col}22`; c.fillRect(0, 0, cx - d, h); c.fillRect(cx + d, 0, w, h);
    c.strokeStyle = `${col}cc`; c.lineWidth = 2; c.beginPath(); c.moveTo(cx - d, 0); c.lineTo(cx - d, h); c.moveTo(cx + d, 0); c.lineTo(cx + d, h); c.stroke();
  }
  c.restore();
  // silhueta do chefe: surge da escuridão e cresce
  const appear = ease((t - .35) / 1.1), sc = Math.min(5.5, (2.6 + b.scale * .7)) * (.7 + appear * .35);
  c.save(); c.globalAlpha = fadeOut * appear;
  c.translate(cx + (b.style === 0 ? (1 - appear) * 60 : 0), cy + 24); c.scale(sc, sc);
  const flashOn = t > 1.55 && t < 1.75;
  drawEnemy(c, b.kind, 0, 0, t, 0, flashOn, 1, b.tint);
  c.restore();
  // brilho dos olhos
  if (t > 1.6) { c.save(); c.globalCompositeOperation = "lighter"; c.globalAlpha = fadeOut * (.5 + Math.sin(t * 6) * .3); const eg = c.createRadialGradient(cx, cy - 6, 0, cx, cy - 6, 40); eg.addColorStop(0, `${col}aa`); eg.addColorStop(1, "rgba(0,0,0,0)"); c.fillStyle = eg; c.fillRect(cx - 40, cy - 46, 80, 80); c.restore(); }
  // estilhaços
  c.fillStyle = col; for (const s of b.shards) { c.save(); c.translate(cx + s.x, cy + s.y); c.rotate(s.a); c.fillRect(-s.s / 2, -1, s.s, 2); c.restore(); }
  // faixas de cinema
  const bar = Math.round(h * .14 * ease(t / .4));
  c.globalAlpha = 1 * fadeOut; c.fillStyle = "#000"; c.fillRect(0, 0, w, bar); c.fillRect(0, h - bar, w, bar);
  // textos
  c.textAlign = "center"; c.textBaseline = "middle";
  const tag = clamp((t - .5) / .3); c.globalAlpha = tag * fadeOut;
  c.font = `6px ${FONT}`; c.fillStyle = col; c.fillText("⚔  CHEFE  ⚔", cx, bar + 10);
  const nameIn = ease((t - 1.6) / .5); c.globalAlpha = nameIn * fadeOut;
  const fs = Math.max(8, Math.min(14, Math.floor(w / Math.max(10, b.name.length + 2))));
  c.font = `${fs}px ${FONT}`;
  const ny = h - bar - 30, nx = cx + (1 - nameIn) * (b.seed % 2 ? -w : w) * .5;
  c.fillStyle = "#000"; c.fillText(b.name.toUpperCase(), nx + 1, ny + 1);
  c.fillStyle = "#fff"; c.fillText(b.name.toUpperCase(), nx, ny);
  // linha de corte
  const lw = ease((t - 1.9) / .5) * Math.min(w * .7, 220); c.fillStyle = col; c.fillRect(cx - lw / 2, ny + fs / 2 + 4, lw, 1);
  c.globalAlpha = clamp((t - 2.3) / .5) * fadeOut; c.font = `6px ${FONT}`; c.fillStyle = "#e8dcc8"; c.fillText(b.epithet, cx, ny + fs / 2 + 14);
  // clarão do impacto
  if (t > 1.6 && t < 2) { c.globalAlpha = (1 - (t - 1.6) / .4) * .8; c.fillStyle = "#fff"; c.fillRect(0, 0, w, h); }
  c.restore();
}

/* ───────────────────────── Integração com o motor ───────────────────────── */
/** Retorna true quando uma cena ao vivo está segurando o jogo neste quadro. */
export function liveTick(g: Game, dt: number): boolean {
  if (g.bossCard) { tickBossCard(g, g.bossCard, dt); return true; }
  if (g.live) { tickGoddess(g, g.live, dt); return true; }
  return false;
}
/** Desenho em coordenadas do mundo (câmera já aplicada). */
export function liveDrawWorld(g: Game, c: CanvasRenderingContext2D) { if (g.live) drawGoddessWorld(g, c, g.live); }
/** Desenho em coordenadas de tela: faixas de cinema, legendas e a tela de chefe. */
export function liveDrawScreen(g: Game, c: CanvasRenderingContext2D) {
  const s = g.live;
  if (s) {
    const w = g.viewWidth, h = g.viewHeight;
    const k = clamp(s.t / 1) * (1 - clamp((s.t - (s.dur - 1)) / 1)), bar = Math.round(h * .11 * ease(k));
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = `rgba(255,236,170,${.08 * k})`; c.fillRect(0, 0, w, h);
    c.fillStyle = "#000"; c.fillRect(0, 0, w, bar); c.fillRect(0, h - bar, w, bar);
    const sub = s.subs.find((x: Sub) => s.t >= x.a && s.t <= x.b);
    if (sub) {
      const a = Math.min(clamp((s.t - sub.a) / .35), clamp((sub.b - s.t) / .35));
      c.globalAlpha = a; c.textAlign = "center"; c.textBaseline = "middle"; c.font = `6px ${FONT}`;
      const y = h - bar / 2 - (sub.who ? 4 : 0);
      if (sub.who) { c.fillStyle = s.color; c.fillText(sub.who, w / 2, y - 6); }
      wrapText(c, sub.text, w / 2, y + (sub.who ? 5 : 0), w - 30, 9);
    }
    c.restore();
  }
  if (g.bossCard) drawBossCard(g, c, g.bossCard);
}
function wrapText(c: CanvasRenderingContext2D, text: string, x: number, y: number, max: number, lh: number) {
  const words = text.split(" "), lines: string[] = []; let cur = "";
  for (const wd of words) { const tr = cur ? `${cur} ${wd}` : wd; if (c.measureText(tr).width > max && cur) { lines.push(cur); cur = wd; } else cur = tr; }
  if (cur) lines.push(cur);
  lines.forEach((ln, i) => { c.fillStyle = "#000"; c.fillText(ln, x + 1, y + 1 + (i - (lines.length - 1) / 2) * lh); c.fillStyle = "#fff6e0"; c.fillText(ln, x, y + (i - (lines.length - 1) / 2) * lh); });
}
