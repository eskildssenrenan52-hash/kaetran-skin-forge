// Palco cinematográfico das cutscenes: cada cena recebe um roteiro próprio (cine-director)
// com 6+ planos animados, câmera, clima, cenário e efeitos coerentes com a história.
import { useEffect, useRef } from "react";
import { drawChar, drawEnemy } from "@/odyssey/gfx";
import type { EpicScene } from "@/odyssey/epic";
import { NPCS, type Palette } from "@/odyssey/data";
import { directScene, rngOf, shotAt, type BossLook, type Script, type Setting } from "@/odyssey/cine-director";
import azrakelThroneEnding from "@/assets/depths/game/azrakel-throne-ending.png";

const HERO = { name: "Você", pal: { skin: "#f0c8a0", hair: "#f0d040", body: "#3070c0", legs: "#2a3050" } };
const GORM = NPCS[0]!;
/** Cenas antigas (só texto) ganham um palco padrão com o herói e o Ancião Gorm. */
export function stageFor(id: string, stage?: EpicScene): EpicScene {
  if (stage) return stage;
  return { id, title: "", lines: [], actors: [HERO, { name: GORM.name, pal: GORM.pal }], fx: "none", sky: "#1a2440", ground: "#3a6a30" };
}

type Pal = { sky: [string, string]; far: string; mid: string; ground: string; accent: string; light: string };
const PALS: Record<Setting, Pal> = {
  fire: { sky: ["#3a0a08", "#c04010"], far: "#2a0806", mid: "#4a1208", ground: "#3a1a10", accent: "#ff7020", light: "#ffb060" },
  ice: { sky: ["#0a1838", "#7ab0e0"], far: "#9ac0e0", mid: "#c8e0f0", ground: "#e0f0ff", accent: "#80d0ff", light: "#e8f8ff" },
  sea: { sky: ["#0a1a3a", "#3a80b0"], far: "#1a4a70", mid: "#20608a", ground: "#c8b080", accent: "#40c0e0", light: "#a0f0ff" },
  desert: { sky: ["#3a2040", "#f0a050"], far: "#a06838", mid: "#c08040", ground: "#d8a860", accent: "#ffd060", light: "#fff0a0" },
  forest: { sky: ["#0a2018", "#5aa060"], far: "#1a3a20", mid: "#2a5a28", ground: "#2a4a20", accent: "#a0f070", light: "#e0ffb0" },
  crystal: { sky: ["#140a30", "#6040a0"], far: "#2a1a50", mid: "#4a3080", ground: "#2a2040", accent: "#d090ff", light: "#f0d0ff" },
  abyss: { sky: ["#050208", "#2a1040"], far: "#100818", mid: "#1a1028", ground: "#120a18", accent: "#a060ff", light: "#d0b0ff" },
  village: { sky: ["#18305a", "#f0b080"], far: "#3a5a40", mid: "#4a7a40", ground: "#4a7a38", accent: "#f0d060", light: "#fff0c0" },
  sky: { sky: ["#0a1030", "#80a0e0"], far: "#c0d0f0", mid: "#e0e8ff", ground: "#9ab0d0", accent: "#ffffff", light: "#ffffff" },
  ruins: { sky: ["#201828", "#a08070"], far: "#4a4048", mid: "#6a5a58", ground: "#5a5048", accent: "#e0c080", light: "#fff0d0" },
};
const VILLAIN: Palette = { skin: "#b0a8b8", hair: "#3a3a48", body: "#5a5868", legs: "#2a2a34" };
const W = 320, H = 180, HORIZON = 118;

export function CinemaStage({ scene, line, beat, look }: { scene: EpicScene; line: number; beat?: { id: string; trigger?: string; title: string; lines: string[] }; look?: BossLook | null }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const lineRef = useRef(line); lineRef.current = line;
  useEffect(() => {
    const cv = ref.current; const c = cv?.getContext("2d"); if (!cv || !c) return;
    c.imageSmoothingEnabled = false;
    const script = directScene(beat ?? { id: scene.id, title: scene.title, lines: scene.lines }, look);
    const finaleImage = scene.id === "citadel_finale" ? new Image() : null;
    if (finaleImage) finaleImage.src = azrakelThroneEnding;
    const actors = scene.actors.length ? scene.actors : [HERO];
    const pal = PALS[script.setting];
    const rr = rngOf(script.seed ^ 0x9e37);
    const parts = Array.from({ length: 90 }, (_, i) => ({ x: rr() * W, y: rr() * H, v: 8 + rr() * 30, s: rr(), i }));
    const far = Array.from({ length: 18 }, () => rr()), mid = Array.from({ length: 24 }, () => rr());
    let raf = 0; const t0 = performance.now();
    const draw = (now: number) => {
      const T = ((now - t0) / 1000) % (script.total + 4); // depois do fim, a cena continua em loop suave
      const { shot, idx, local, p } = shotAt(script, Math.min(T, script.total - 0.01));
      const ease = p * p * (3 - 2 * p);
      const zoom = shot.zoom0 + (shot.zoom1 - shot.zoom0) * ease;
      const pan = shot.panX0 + (shot.panX1 - shot.panX0) * ease;
      const shake = shot.kind === "clash" || shot.kind === "bossRoar" || shot.kind === "storm" ? Math.sin(local * 47) * (shot.kind === "storm" ? 0.8 : 2) : 0;
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.filter = `hue-rotate(${script.hue}deg)${shot.kind === "flashback" ? " sepia(0.85) contrast(1.1)" : ""}`;
      // céu
      const g = c.createLinearGradient(0, 0, 0, HORIZON);
      g.addColorStop(0, pal.sky[0]); g.addColorStop(1, shade(pal.sky[1], -script.night * 0.35)); c.fillStyle = g; c.fillRect(0, 0, W, H);
      const tiltY = shot.kind === "skyTilt" ? (1 - ease) * 60 : 0;
      c.translate(W / 2 + shake, H / 2 + tiltY); c.rotate(shot.tilt * Math.sin(local * 0.5)); c.scale(zoom, zoom); c.translate(-W / 2 - pan * 0.2, -H / 2);
      const showFinalArt = !!finaleImage?.complete && finaleImage.naturalWidth > 0;
      if (showFinalArt) {
        c.drawImage(finaleImage!, -20 - pan * 0.1, -12, W + 40, H + 24);
        c.fillStyle = `rgba(16,4,10,${0.08 + Math.sin(T * 1.7) * 0.035})`; c.fillRect(-30, -20, W + 60, H + 40);
      } else {
        // astro
        const sunX = 60 + (script.seed % 200), sunY = 30 + script.night * 20;
        c.fillStyle = script.night > 0.5 ? "rgba(230,230,255,.9)" : pal.light; c.beginPath(); c.arc(sunX - pan * 0.1, sunY, 9, 0, 7); c.fill();
        c.fillStyle = "rgba(255,255,255,.08)"; c.beginPath(); c.arc(sunX - pan * 0.1, sunY, 20, 0, 7); c.fill();
        if (script.night > 0.4) for (let i = 0; i < 40; i++) { c.fillStyle = `rgba(255,255,255,${0.3 + 0.6 * Math.abs(Math.sin(T * 1.5 + i))})`; c.fillRect((i * 73 + script.seed) % W, (i * 37) % 80, 1, 1); }
        if (shot.kind === "skyTilt" || script.setting === "sky" || script.mood === "finale") aurora(c, T, pal.accent);
        // camadas distantes
        skyline(c, script.setting, far, pal.far, HORIZON - 30, 28, -pan * 0.3, T);
        skyline(c, script.setting, mid, pal.mid, HORIZON - 12, 18, -pan * 0.6, T);
        landmark(c, script, pal, -pan * 0.5, T, shot.kind === "treeSong" ? ease : 0.2);
        // chão
        c.fillStyle = pal.ground; c.fillRect(-60, HORIZON, W + 120, H);
        c.fillStyle = "rgba(0,0,0,.18)"; for (let x = -60; x < W + 60; x += 6) c.fillRect(x - (pan % 6), HORIZON + 4 + ((x * 7) % 30), 3, 1);
        if (script.setting === "sea") { c.fillStyle = "rgba(160,230,255,.35)"; for (let x = 0; x < W; x += 10) c.fillRect((x + T * 12) % W, HORIZON + 2 + Math.sin(x + T * 2) * 1.5, 6, 1); }
      }
      // conteúdo do plano
      const speaker = lineRef.current % actors.length;
      if (showFinalArt) {
        const hero = actors[0]!; actor(c, hero.pal, 252 + Math.sin(T * 0.8) * 2, HORIZON + 37, 1.8, 1, Math.floor(T * 3) % 4, hero.name, speaker === 0);
        if (shot.kind === "shatter" || shot.kind === "bossRoar") burstRays(c, 150, 78, pal.light, 0.75, T);
      } else shotContent(c, script, shot.kind, local, ease, T, actors, speaker, pal, pan);
      c.setTransform(1, 0, 0, 1, 0, 0); c.filter = "none";
      weather(c, script, parts, T);
      // luz e grade de cor
      const v = c.createRadialGradient(W / 2, H / 2, 50, W / 2, H / 2, 210); v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, `rgba(0,0,0,${0.35 + script.night * 0.2})`); c.fillStyle = v; c.fillRect(0, 0, W, H);
      if (shot.kind === "flashback") { c.fillStyle = "rgba(0,0,0,.15)"; for (let y = 0; y < H; y += 2) c.fillRect(0, y, W, 1); }
      // transições: abre/fecha em preto, ou flash branco no estilhaço
      const fadeIn = Math.max(0, 1 - local / 0.5), fadeOut = Math.max(0, 1 - (shot.dur - local) / 0.5);
      const f = idx === 0 ? Math.max(fadeIn, 0) : fadeIn * 0.8;
      if (shot.kind === "shatter" && local < 0.6) { c.fillStyle = `rgba(255,255,255,${1 - local / 0.6})`; c.fillRect(0, 0, W, H); }
      else if (f + fadeOut > 0) { c.fillStyle = `rgba(0,0,0,${Math.min(1, f + fadeOut * 0.8)})`; c.fillRect(0, 0, W, H); }
      // barras de cinema
      c.fillStyle = "#000"; c.fillRect(0, 0, W, 10); c.fillRect(0, H - 10, W, 10);
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene.id]);
  return <canvas ref={ref} width={W} height={H} className="cinema-stage" aria-hidden />;
}

function shade(hex: string, k: number) {
  const n = parseInt(hex.slice(1), 16); const f = (v: number) => Math.max(0, Math.min(255, Math.round(v * (1 + k))));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}
function aurora(c: CanvasRenderingContext2D, T: number, col: string) {
  c.globalAlpha = 0.25;
  for (let b = 0; b < 3; b++) { c.strokeStyle = col; c.lineWidth = 3; c.beginPath(); for (let x = 0; x <= W; x += 8) c.lineTo(x, 22 + b * 8 + Math.sin(x * 0.03 + T * 0.6 + b) * 6); c.stroke(); }
  c.globalAlpha = 1;
}
function skyline(c: CanvasRenderingContext2D, s: Setting, rnd: number[], col: string, base: number, amp: number, off: number, T: number) {
  c.fillStyle = col; c.beginPath(); c.moveTo(-80, HORIZON + 2);
  const n = rnd.length, step = (W + 160) / n;
  for (let i = 0; i <= n; i++) {
    const x = -80 + i * step + (off % step), r = rnd[i % n]!;
    if (s === "ice" || s === "crystal") { c.lineTo(x - step / 2, base + amp * 0.4); c.lineTo(x, base - amp * r); }
    else if (s === "desert" || s === "ruins") c.quadraticCurveTo(x - step / 2, base - amp * r * 0.6, x, base + amp * 0.2);
    else if (s === "forest" || s === "village") { c.lineTo(x - 3, base); c.lineTo(x, base - amp * (0.5 + r)); c.lineTo(x + 3, base); }
    else if (s === "sea") c.lineTo(x, base + 10 + Math.sin(i + T) * 2);
    else if (s === "fire") { c.lineTo(x - step / 3, base + 4); c.lineTo(x, base - amp * r * 1.2); }
    else if (s === "abyss") { c.lineTo(x, base - amp * r * 1.4); c.lineTo(x + 2, base); }
    else c.quadraticCurveTo(x - step / 2, base - amp * r, x, base);
  }
  c.lineTo(W + 80, HORIZON + 2); c.closePath(); c.fill();
}
function landmark(c: CanvasRenderingContext2D, s: Script, pal: Pal, off: number, T: number, glow: number) {
  const x = 160 + off + ((s.landmark - 2.5) * 30);
  c.save(); c.translate(x, HORIZON);
  const kinds = s.mood === "finale" || s.mood === "prologue" || s.mood === "triumph" ? 0 : s.landmark;
  if (kinds === 0 || kinds === 3) { // Árvore de Mana
    c.fillStyle = "#3a2818"; c.fillRect(-4, -46, 8, 46);
    c.fillStyle = pal.mid; for (let i = 0; i < 7; i++) { c.beginPath(); c.arc(Math.cos(i) * 18, -52 + Math.sin(i * 2) * 8, 16, 0, 7); c.fill(); }
    c.fillStyle = `rgba(255,240,160,${0.15 + glow * 0.6 + Math.sin(T * 2) * 0.05})`; c.beginPath(); c.arc(0, -52, 34 + glow * 20, 0, 7); c.fill();
  } else if (kinds === 1) { c.fillStyle = "#2a2030"; c.fillRect(-6, -60, 12, 60); c.beginPath(); c.moveTo(-9, -60); c.lineTo(0, -76); c.lineTo(9, -60); c.fill(); c.fillStyle = pal.accent; c.fillRect(-1, -48, 2, 3); }
  else if (kinds === 2) { c.strokeStyle = "#5a5058"; c.lineWidth = 5; c.beginPath(); c.arc(0, 0, 26, Math.PI, 0); c.stroke(); c.fillStyle = `rgba(200,160,255,${0.2 + Math.sin(T * 3) * 0.1})`; c.beginPath(); c.arc(0, 0, 22, Math.PI, 0); c.fill(); }
  else if (kinds === 4) { for (let i = -2; i <= 2; i++) { c.fillStyle = pal.far; c.fillRect(i * 14 - 3, -26 - Math.abs(i) * -4, 6, 26 - Math.abs(i) * 4); } }
  else { c.fillStyle = "#4a4a50"; c.fillRect(-5, -30, 10, 30); c.fillStyle = pal.accent; c.beginPath(); c.arc(0, -36, 6 + Math.sin(T * 2), 0, 7); c.fill(); }
  c.restore();
}
function actor(c: CanvasRenderingContext2D, pal: Palette, x: number, y: number, sc: number, dir: number, frame: number, name?: string, talking = false) {
  c.save(); c.translate(x, y); c.scale(sc, sc);
  c.fillStyle = "rgba(0,0,0,.35)"; c.beginPath(); c.ellipse(0, 0, 6, 2, 0, 0, Math.PI * 2); c.fill();
  drawChar(c, 0, talking ? -Math.abs(Math.sin(performance.now() / 160)) : 0, pal, dir, frame);
  c.restore();
  if (name && talking) { c.fillStyle = "rgba(255,230,140,.95)"; c.font = "7px monospace"; c.textAlign = "center"; c.fillText(name, x, y - sc * 21); }
}
function boss(c: CanvasRenderingContext2D, s: Script, x: number, y: number, sc: number, T: number, flash: boolean, alpha = 1) {
  c.save(); c.globalAlpha = alpha; drawEnemy(c, s.bossKind, x, y, T, 1, flash, sc, s.bossTint); c.restore();
}
function burstRays(c: CanvasRenderingContext2D, x: number, y: number, col: string, k: number, T: number) {
  c.save(); c.translate(x, y); c.rotate(T * 0.4); c.fillStyle = col; c.globalAlpha = 0.25 * k;
  for (let i = 0; i < 12; i++) { c.rotate(Math.PI / 6); c.beginPath(); c.moveTo(0, 0); c.lineTo(160, -8); c.lineTo(160, 8); c.fill(); }
  c.restore();
}

function shotContent(c: CanvasRenderingContext2D, s: Script, kind: string, local: number, e: number, T: number, actors: { name: string; pal: Palette }[], speaker: number, pal: Pal, pan: number) {
  const fr = Math.floor(T * 6) % 4, gy = HORIZON + 34;
  const hero = actors[0]!, other = actors[1] ?? { name: GORM.name, pal: GORM.pal };
  switch (kind) {
    case "establish":
      actors.forEach((a, i) => actor(c, a.pal, 120 + i * 40 + pan * 0.3, gy, 2, 3, 0, a.name, i === speaker));
      break;
    case "walkIn": {
      const x = -20 + e * 150; actor(c, hero.pal, x, gy, 2.4, 3, fr, hero.name, speaker === 0);
      for (let i = 1; i < actors.length; i++) actor(c, actors[i]!.pal, 230 + i * 26, gy, 2.4, 2, 0, actors[i]!.name, i === speaker);
      c.fillStyle = "rgba(255,255,255,.25)"; for (let k = 0; k < 6; k++) c.fillRect(x - 10 - k * 9, gy - 1, 3, 1);
      break;
    }
    case "bossRoar": {
      const sc = 4 + e * 2.5; boss(c, s, 170, gy + 10, sc, T * 2, Math.sin(T * 30) > 0.7);
      c.strokeStyle = `rgba(255,255,255,${0.5 - (local % 0.6)})`; c.lineWidth = 2; for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(170, gy - 40, 20 + ((local * 60 + k * 30) % 90), 0, 7); c.stroke(); }
      break;
    }
    case "clash": {
      const hx = 100 + Math.sin(local * 8) * 10; actor(c, hero.pal, hx, gy, 2.6, 3, fr);
      boss(c, s, 220, gy + 6, 3.2, T * 3, local % 0.5 < 0.08);
      if (local % 0.5 < 0.15) { c.fillStyle = "#fff"; c.beginPath(); c.arc(160, gy - 30, 10, 0, 7); c.fill(); burstRays(c, 160, gy - 30, pal.light, 1, T); }
      for (let k = 0; k < 10; k++) { c.fillStyle = pal.accent; c.fillRect(140 + Math.cos(k + local * 9) * 30 * (local % 0.5) * 4, gy - 30 + Math.sin(k * 2) * 20, 2, 2); }
      break;
    }
    case "shatter": {
      const k = Math.min(1, local / 2.5);
      boss(c, s, 170, gy + 6, 3.5, T, true, 1 - k);
      for (let i = 0; i < 60; i++) { const a = i * 2.39, r = k * (40 + (i % 9) * 12); c.fillStyle = i % 3 ? s.bossTint : pal.light; c.fillRect(170 + Math.cos(a) * r, gy - 34 + Math.sin(a) * r - k * 20, 3 - (i % 2), 3 - (i % 2)); }
      burstRays(c, 170, gy - 34, pal.light, 1 - k * 0.5, T);
      break;
    }
    case "lightRise": {
      for (let i = 0; i < 40; i++) { const y = gy - ((T * 30 + i * 13) % 140); c.fillStyle = `rgba(255,240,170,${0.3 + (i % 5) / 8})`; c.fillRect(110 + ((i * 37) % 100) + Math.sin(T + i) * 4, y, 2, 2); }
      c.fillStyle = `rgba(255,240,180,${0.2 + e * 0.3})`; c.fillRect(150, 0, 20, gy);
      actor(c, hero.pal, 160, gy, 2.6, 0, 0, hero.name, speaker === 0);
      break;
    }
    case "heroClose": {
      const a = actors[speaker] ?? hero; actor(c, a.pal, 160, gy + 44, 6, 0, 0);
      c.fillStyle = "rgba(255,230,140,.95)"; c.font = "8px monospace"; c.textAlign = "center"; c.fillText(a.name, 160, 24);
      break;
    }
    case "duo": {
      actor(c, hero.pal, 120 - e * 6, gy + 18, 4, 3, 0, hero.name, speaker === 0);
      actor(c, other.pal, 200 + e * 6, gy + 18, 4, 2, 0, other.name, speaker !== 0);
      break;
    }
    case "campfire": {
      c.fillStyle = "rgba(0,0,0,.45)"; c.fillRect(-60, 0, W + 120, H);
      const fx = 160, fy = gy + 4; const fl = 1 + Math.sin(T * 12) * 0.15;
      const glow = c.createRadialGradient(fx, fy - 6, 2, fx, fy - 6, 80 * fl); glow.addColorStop(0, "rgba(255,170,60,.6)"); glow.addColorStop(1, "rgba(255,120,30,0)"); c.fillStyle = glow; c.fillRect(0, 0, W, H);
      for (let i = 0; i < 14; i++) { c.fillStyle = i % 2 ? "#ffd060" : "#ff6020"; c.fillRect(fx - 6 + (i % 6) * 2, fy - 4 - ((T * 20 + i * 7) % 16), 2, 2); }
      actor(c, hero.pal, 118, gy + 4, 2.8, 3, 0, hero.name, speaker === 0); actor(c, other.pal, 202, gy + 4, 2.8, 2, 0, other.name, speaker !== 0);
      break;
    }
    case "flashback": {
      actor(c, other.pal, 130, gy, 2.4, 3, fr); actor(c, VILLAIN, 180, gy, 2.4, 2, fr);
      c.fillStyle = "rgba(255,255,255,.12)"; c.fillRect(-60, 0, W + 120, H);
      break;
    }
    case "treeSong": {
      for (let k = 0; k < 6; k++) { c.strokeStyle = `rgba(255,240,160,${0.4 - ((T * 0.5 + k / 6) % 1) * 0.4})`; c.lineWidth = 1; c.beginPath(); c.arc(160, HORIZON - 52, ((T * 30 + k * 25) % 150), 0, 7); c.stroke(); }
      actors.forEach((a, i) => actor(c, a.pal, 130 + i * 30, gy, 1.8, 0, 0));
      break;
    }
    case "skyTilt":
      for (let i = 0; i < 5; i++) { c.fillStyle = "rgba(255,255,255,.12)"; c.beginPath(); c.ellipse(((i * 90 + T * 8) % (W + 100)) - 50, 40 + i * 9, 30, 6, 0, 0, 7); c.fill(); }
      actor(c, hero.pal, 160, gy, 2, 0, 0);
      break;
    case "silhouette": {
      c.fillStyle = "rgba(0,0,0,.35)"; c.fillRect(-60, 0, W + 120, H);
      const x = 260 - e * 40; c.save(); c.globalAlpha = 0.85; actor(c, VILLAIN, x, gy - 6, 3, 2, Math.floor(T * 3) % 4); c.restore();
      c.fillStyle = "rgba(120,100,160,.25)"; for (let k = 1; k < 6; k++) c.fillRect(x + k * 8, gy - 4, 3, 1);
      actor(c, hero.pal, 80, gy + 8, 3, 3, 0, hero.name, speaker === 0);
      break;
    }
    case "aftermath":
      for (let i = 0; i < 8; i++) { c.fillStyle = "rgba(60,60,60,.5)"; c.beginPath(); c.arc(60 + i * 30, gy - ((T * 8 + i * 10) % 60), 6 + i % 3, 0, 7); c.fill(); }
      actors.forEach((a, i) => actor(c, a.pal, 140 + i * 36, gy, 2.2, i ? 2 : 3, 0, a.name, i === speaker));
      break;
    case "pages": {
      c.fillStyle = "rgba(0,0,0,.4)"; c.fillRect(-60, 0, W + 120, H);
      c.fillStyle = "#e8d8b0"; c.fillRect(90, 40, 140, 96); c.fillStyle = "#c8b890"; c.fillRect(159, 40, 2, 96);
      c.fillStyle = "#6a5a40"; for (let l = 0; l < 9; l++) { const w = Math.min(54, (local * 40 - l * 6) * 4); if (w > 0) { c.fillRect(98, 50 + l * 9, w, 1); c.fillRect(166, 50 + l * 9, Math.max(0, w - 10), 1); } }
      const flip = (local % 3) / 3; c.fillStyle = `rgba(240,225,190,${1 - flip})`; c.fillRect(160, 40, 70 * (1 - flip * 2), 96);
      break;
    }
    case "crowd":
      for (let i = 0; i < 9; i++) { const p: Palette = { skin: ["#f0c8a0", "#c89070", "#e0a880"][i % 3]!, hair: ["#302018", "#c04020", "#f0d040", "#202838"][i % 4]!, body: ["#3a7a30", "#2a5a90", "#d0a030", "#6a3a20", "#8a4aa0"][i % 5]!, legs: "#2a2a30" }; actor(c, p, 40 + i * 30, gy + (i % 2) * 6, 2, i < 4 ? 3 : 2, Math.floor(T * 4 + i) % 4); }
      actor(c, hero.pal, 160, gy + 14, 2.6, 0, 0, hero.name, speaker === 0);
      break;
    case "storm":
      if (Math.sin(T * 3.1) > 0.97) { c.fillStyle = "rgba(255,255,255,.6)"; c.fillRect(-60, 0, W + 120, H); }
      c.strokeStyle = "rgba(220,220,255,.8)"; if (Math.sin(T * 3.1) > 0.95) { c.beginPath(); c.moveTo(220, 0); c.lineTo(210, 40); c.lineTo(226, 60); c.lineTo(205, HORIZON); c.stroke(); }
      actor(c, hero.pal, 150, gy, 2.4, 0, fr, hero.name, speaker === 0);
      break;
    case "orbit": {
      const a = T * 0.6; actors.forEach((ac, i) => { const ang = a + (i / actors.length) * Math.PI * 2; actor(c, ac.pal, 160 + Math.cos(ang) * 60, gy + Math.sin(ang) * 8, 2.2 + Math.sin(ang) * 0.4, Math.cos(ang) > 0 ? 2 : 3, 0, ac.name, i === speaker); });
      break;
    }
  }
}

function weather(c: CanvasRenderingContext2D, s: Script, parts: { x: number; y: number; v: number; s: number; i: number }[], T: number) {
  for (const p of parts) {
    switch (s.weather) {
      case "rain": c.fillStyle = "rgba(160,190,255,.5)"; c.fillRect((p.x + T * 30) % W, (p.y + T * p.v * 8) % H, 1, 5); break;
      case "snow": c.fillStyle = "rgba(255,255,255,.85)"; c.fillRect((p.x + Math.sin(T + p.i) * 8 + W) % W, (p.y + T * p.v * 0.8) % H, p.s > 0.7 ? 2 : 1, p.s > 0.7 ? 2 : 1); break;
      case "ash": c.fillStyle = p.i % 3 ? "rgba(255,140,60,.8)" : "rgba(80,80,80,.7)"; c.fillRect((p.x + Math.sin(T + p.i) * 6 + W) % W, (p.y - T * p.v * 0.6 + H * 10) % H, 1, 1); break;
      case "petals": c.fillStyle = "rgba(255,170,200,.85)"; c.fillRect((p.x + T * 14) % W, (p.y + T * p.v * 0.4) % H, 2, 1); break;
      case "sand": c.fillStyle = "rgba(240,200,140,.45)"; c.fillRect((p.x + T * p.v * 4) % W, p.y, 3, 1); break;
      case "spores": c.fillStyle = `rgba(200,255,140,${0.4 + 0.5 * Math.abs(Math.sin(T + p.i))})`; c.fillRect((p.x + Math.sin(T * 0.7 + p.i) * 10 + W) % W, (p.y - T * 4 + H * 10) % H, 1, 1); break;
      case "bubbles": c.strokeStyle = "rgba(200,240,255,.5)"; c.beginPath(); c.arc(p.x, (p.y - T * p.v + H * 20) % H, 1 + p.s * 2, 0, 7); c.stroke(); break;
      case "stars": if (p.y < 90) { c.fillStyle = `rgba(255,255,255,${0.2 + 0.7 * Math.abs(Math.sin(T * 2 + p.v))})`; c.fillRect(p.x, p.y, 1, 1); } break;
    }
  }
}
