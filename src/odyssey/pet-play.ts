// Execução do sistema de pets dentro do jogo: seguir o herói, lutar, curar, proteger, coletar,
// chocar ovos andando e salvar tudo sob a chave própria "golden-arrow-pets" (saves antigos intactos).
import type { Game } from "./engine";
import { ITEMS } from "./data";
import { drawK, K_DIR } from "./kaetram";
import {
  ELEMENTS, SPECIES_BY_ID, adopt, biomeElements, elementMult, fightMult, freshPets, gainPetXp, makePet, petById, petStats,
  sanitizePets, skillsFor, walkEggs, wildEgg, EGG_CHANCE, type Pet, type PetState, type EvoCtx,
} from "./pets";
import { fxFor } from "./fx-catalog";

const KEY = "golden-arrow-pets";
interface Body { x: number; y: number; dir: number; moving: boolean; frameT: number; atk: number; cd: number; target: number | null; skillCd: Record<string, number>; healT: number; shieldT: number; lastPX: number; lastPY: number; stepAcc: number; hungerT: number; notified: Set<string> }
const states = new WeakMap<Game, PetState>();
const bodies = new WeakMap<Game, Body>();

export function petsOf(g: Game): PetState { let s = states.get(g); if (!s) { s = freshPets(); states.set(g, s); } return s; }
function body(g: Game): Body {
  let b = bodies.get(g);
  if (!b) { b = { x: g.p.x - 14, y: g.p.y + 4, dir: 0, moving: false, frameT: 0, atk: 0, cd: 0, target: null, skillCd: {}, healT: 0, shieldT: 0, lastPX: g.p.x, lastPY: g.p.y, stepAcc: 0, hungerT: 0, notified: new Set() }; bodies.set(g, b); }
  return b;
}
export const activePet = (g: Game): Pet | undefined => petById(petsOf(g), petsOf(g).active);

export function petsSave(g: Game) { try { localStorage.setItem(KEY, JSON.stringify(petsOf(g))); } catch { /* sem armazenamento */ } }
export function petsLoad(g: Game) {
  let st: PetState;
  try { const raw = localStorage.getItem(KEY); st = sanitizePets(raw ? JSON.parse(raw) : null); } catch { st = freshPets(); }
  states.set(g, st);
  if (!st.pets.length && !st.eggs.length) giveStarter(g); // saves antigos ganham o primeiro pet
}
export function petsNewGame(g: Game) { states.set(g, freshPets()); giveStarter(g); petsSave(g); }
function giveStarter(g: Game) {
  const st = petsOf(g);
  adopt(st, makePet(st, "rato", Math.random));
  wildEgg(st, "plains", Math.random);
  g.toast("Um Ratinho decidiu te seguir! Abra Pets (P) para cuidar dele.", "#f0a0c0");
}

export const isNight = (g: Game) => g.time < 0.23 || g.time > 0.8;
export function evoCtx(g: Game): EvoCtx { return { time: isNight(g) ? "noite" : "dia", biome: g.biome, has: (id) => g.count(id) > 0 }; }

/** Multiplicador do dano recebido pelo herói (pets tanque e o escudo Muralha). */
export function petGuardMult(g: Game): number {
  const pet = activePet(g); if (!pet) return 1;
  const sp = SPECIES_BY_ID[pet.species], f = fightMult(pet); if (!sp || f <= 0) return 1;
  let m = 1;
  if (sp.role === "tanque") m *= 1 - Math.min(0.3, petStats(pet).def / 180) * Math.min(1, f);
  if ((bodies.get(g)?.shieldT ?? 0) > 0) m *= 0.75;
  return m;
}
/** Multiplicador do dano causado (pets de suporte). */
export function petDamageMult(g: Game): number {
  const pet = activePet(g); if (!pet) return 1;
  const sp = SPECIES_BY_ID[pet.species]; if (!sp || sp.role !== "suporte") return 1;
  return 1 + Math.min(0.25, petStats(pet).atk / 160) * Math.min(1, fightMult(pet));
}

type Foe = Game["enemies"][number];
function nearestFoe(g: Game, x: number, y: number, r: number): Foe | null {
  let best: Foe | null = null, bd = r;
  for (const e of g.enemies) { if (!e.alive) continue; const d = Math.hypot(e.x - x, e.y - y); if (d < bd) { bd = d; best = e; } }
  return best;
}

export function petTick(g: Game, dt: number) {
  const st = petsOf(g), b = body(g), p = g.p;
  // Passos para chocar ovos (16 px = 1 passo) e fome com o tempo.
  const moved = Math.hypot(p.x - b.lastPX, p.y - b.lastPY); b.lastPX = p.x; b.lastPY = p.y;
  if (moved < 40) b.stepAcc += moved / 16; // ignora teleportes
  if (b.stepAcc >= 1) {
    const n = Math.floor(b.stepAcc); b.stepAcc -= n;
    const boost = st.team.some((u) => SPECIES_BY_ID[petById(st, u)?.species ?? ""]?.role === "coletor") ? 1.25 : 1;
    for (const e of walkEggs(st, n * boost)) if (!b.notified.has(e.uid)) { b.notified.add(e.uid); g.toast(`Um ovo de ${ELEMENTS[SPECIES_BY_ID[e.species].element].name} está chocando! Abra Pets.`, "#f0a0c0"); }
  }
  b.hungerT += dt;
  if (b.hungerT >= 30) { b.hungerT = 0; for (const u of st.team) { const pt = petById(st, u); if (pt) pt.hunger = Math.max(0, pt.hunger - (u === st.active ? 3 : 1)); } }
  for (const pt of st.pets) if (pt.breedCd > 0) pt.breedCd = Math.max(0, pt.breedCd - dt);
  b.shieldT = Math.max(0, b.shieldT - dt);

  const pet = activePet(g); if (!pet || p.dead > 0) return;
  const sp = SPECIES_BY_ID[pet.species]; if (!sp) return;
  const s = petStats(pet), f = fightMult(pet);
  // Teleporta junto em portas/viagens.
  if (Math.hypot(b.x - p.x, b.y - p.y) > 220) { b.x = p.x - 14; b.y = p.y + 4; }
  b.cd -= dt; b.atk = Math.max(0, b.atk - dt * 3); b.healT -= dt;
  for (const k in b.skillCd) b.skillCd[k] -= dt;

  let tx = p.x + (p.dir === 2 ? -16 : 16), ty = p.y + 6;
  const foe = f > 0 && !g.interior ? nearestFoe(g, p.x, p.y, 110) : null;
  if (foe) {
    tx = foe.x + (b.x < foe.x ? -12 : 12); ty = foe.y + 2;
    const d = Math.hypot(foe.x - b.x, foe.y - b.y);
    if (d < 22 && b.cd <= 0) {
      const skills = skillsFor(sp, pet.level).filter((k) => (b.skillCd[k.id] ?? 0) <= 0);
      const k = skills.find((x) => x.id !== "mordida" && (x.kind !== "cura" || p.hp < g.maxHp() * 0.7)) ?? skills.find((x) => x.id === "mordida");
      const em = elementMult(sp.element, biomeElements(g.biome)[0]) > 1 ? 1.15 : 1; // vantagem de terreno
      const raw = (s.atk * 1.6 + pet.level) * f * em * (k?.power ?? 1);
      const color = ELEMENTS[sp.element].color;
      const actionId = k?.id ?? "mordida";
      const visual = fxFor(`pet:${pet.uid}:${sp.id}:${actionId}`, k?.kind === "cura" ? ["bondhearts", "renewal"] : k?.kind === "escudo" ? ["barrier", "spiritglow"] : k?.kind === "lentidao" ? ["iceburst", "petclaw"] : k?.kind === "area" ? ["pettail", "impact"] : ["petclaw", "claws"]);
      g.fx(visual.name, b.x, b.y - 8, 0.78, false, 0.4, visual.h);
      if (k?.kind === "area") { for (const e of g.enemies) if (e.alive && Math.hypot(e.x - b.x, e.y - b.y) < 48) g.damageEnemy(e, raw, 0, 0, color); g.burst(b.x, b.y - 6, color, 18, 90); }
      else if (k?.kind === "lentidao") { for (const e of g.enemies) if (e.alive && Math.hypot(e.x - b.x, e.y - b.y) < 60) e.slow = Math.max(e.slow, k.power); g.burst(b.x, b.y - 6, color, 14, 70); g.damageEnemy(foe, raw * 0.6, 0, 0, color); }
      else if (k?.kind === "cura") { const h = Math.round(g.maxHp() * k.power); p.hp = Math.min(g.maxHp(), p.hp + h); g.float(p.x, p.y - 26, `+${h}`, "#80ff80"); }
      else if (k?.kind === "escudo") { b.shieldT = 5; g.float(p.x, p.y - 26, k.name, "#c0a060"); }
      else g.damageEnemy(foe, raw, (foe.x - b.x) * 3, (foe.y - b.y) * 3, color);
      if (k && k.id !== "mordida") { b.skillCd[k.id] = k.cd; g.float(b.x, b.y - 22, k.name, color); }
      b.cd = Math.max(0.55, 1.6 - s.spd / 40); b.atk = 1;
      b.dir = Math.abs(foe.x - b.x) > Math.abs(foe.y - b.y) ? (foe.x < b.x ? 1 : 2) : foe.y < b.y ? 3 : 0;
    }
  }
  // Curandeiro cura sozinho fora das habilidades.
  if (sp.role === "curandeiro" && f > 0 && b.healT <= 0 && p.hp < g.maxHp()) {
    b.healT = Math.max(4, 9 - s.spd / 8);
    const h = Math.max(2, Math.round(s.atk * 0.7 * f)); p.hp = Math.min(g.maxHp(), p.hp + h); g.float(p.x, p.y - 22, `+${h}`, "#80ff80");
  }
  const dx = tx - b.x, dy = ty - b.y, dist = Math.hypot(dx, dy);
  const speed = 60 + s.spd * 2.2 + (dist > 60 ? 50 : 0);
  b.moving = dist > 6;
  if (b.moving) {
    const st2 = Math.min(dist, speed * dt); b.x += (dx / dist) * st2; b.y += (dy / dist) * st2; b.frameT += dt * 8;
    if (b.atk <= 0) b.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 1 : 2) : dy < 0 ? 3 : 0;
  }
}

export function petOnKill(g: Game, e: Foe) {
  const st = petsOf(g), pet = activePet(g);
  for (const u of st.team) {
    const pt = petById(st, u); if (!pt) continue;
    const share = u === st.active ? 1 : 0.5;
    const ups = gainPetXp(pt, (e.xp * 0.8 + e.level * 2) * share);
    pt.bond = Math.min(100, pt.bond + 0.4 * share);
    if (u === st.active) pt.kills++;
    if (ups) { g.toast(`${pt.nick} subiu para o nível ${pt.level}!`, "#f0a0c0"); const sp = SPECIES_BY_ID[pt.species]; if (sp && skillsFor(sp, pt.level).some((k) => k.level > pt.level - ups && k.level <= pt.level)) g.toast(`${pt.nick} aprendeu uma nova habilidade!`, "#ffd040"); }
  }
  if (pet && SPECIES_BY_ID[pet.species]?.role === "coletor" && fightMult(pet) > 0) {
    const bonus = Math.max(1, Math.round(e.gold * (0.15 + petStats(pet).spd / 300))); g.p.gold += bonus; g.float(e.x, e.y - 38, `+${bonus}g`, "#ffd040");
    if (Math.random() < 0.04) { const id = Math.random() < 0.7 ? "pet_treat" : "mana_shard"; if (ITEMS[id] && g.addItem(id)) g.toast(`${pet.nick} achou: ${ITEMS[id].name}`); }
  }
  const chance = EGG_CHANCE * (e.elite ? 3 : 1) * (e.boss ? 6 : 1);
  if (Math.random() < chance) { const egg = wildEgg(st, g.biome, Math.random); if (egg) g.toast(`Você encontrou um ovo de ${SPECIES_BY_ID[egg.species].rarity === "comum" ? "pet" : "pet raro"}!`, "#f0a0c0"); }
}

export function drawPets(g: Game, c: CanvasRenderingContext2D, draws: { y: number; f: () => void }[], wt: number) {
  const pet = activePet(g); if (!pet || g.p.dead > 0) return;
  const sp = SPECIES_BY_ID[pet.species]; if (!sp) return;
  const b = body(g);
  draws.push({ y: b.y, f: () => {
    g.shadow(c, b.x, b.y, 5);
    const d = K_DIR[b.dir] ?? "down";
    const anim = b.atk > 0 ? `atk_${d}` : b.moving ? `walk_${d}` : `idle_${d}`;
    const frame = b.atk > 0 ? (1 - b.atk) * 4 : b.moving ? b.frameT : wt * 3;
    const scale = sp.scale ?? 0.8;
    if (pet.shiny) { c.save(); c.globalAlpha = 0.35 + Math.sin(wt * 5) * 0.15; c.fillStyle = "#fff6a0"; c.beginPath(); c.ellipse(b.x, b.y - 6, 9, 9, 0, 0, Math.PI * 2); c.fill(); c.restore(); }
    if (!drawK(c, sp.sheet, anim, frame, b.x, b.y, b.dir === 1, 1, scale)) { c.fillStyle = ELEMENTS[sp.element].color; c.fillRect(b.x - 3, b.y - 6, 6, 6); }
    if (Math.hypot(b.x - g.p.x, b.y - g.p.y) < 60) {
      c.font = "bold 5px monospace"; c.textAlign = "center"; c.fillStyle = "#000a"; c.fillText(`${pet.nick} Nv${pet.level}`, b.x + 0.5, b.y - 23.5);
      c.fillStyle = pet.hunger <= 0 ? "#ff8080" : pet.shiny ? "#fff090" : "#f0c0e0"; c.fillText(`${pet.nick} Nv${pet.level}`, b.x, b.y - 24);
    }
  } });
}
