import gateArt from "@/assets/depths/game/demon-citadel-gate.png";
import kingArt from "@/assets/depths/game/demon-king.png";
import throneArt from "@/assets/depths/game/demon-throne-room.png";
import guardArt from "@/assets/depths/game/demon-court-guard.png";
import { FRONTIER_GATES } from "./frontier";
import type { BossDef, EnemyKind } from "./data";
import type { Temple } from "./depths";
import { checkpoints, floorSize, generateFloor, isGuardianFloor, type DungeonFloor, type Theme } from "./dungeon";
import { H, W, TS, T, BIOME_LIST, type World } from "./world";

export const CITADEL_FLOORS = 100;
export const CITADEL_UNLOCK_BOSS_ID = "saga_gehenna_7";
export const CITADEL_FINAL_BOSS_ID = "citadel_100";
export const CITADEL_FINAL_BEAT_ID = "citadel_finale";
const CITADEL_BEST_PREFIX = "citadel:bestFloor=";

type GuardianData = { name: string; kind: EnemyKind; tint: string; scale: number; minion: EnemyKind; intro: string };

const THEME_SEEDS: Theme[] = [
  { name: "Portões de Cinza", floor: T.ASH, wall: T.CWALL, deco: T.PILLAR, biome: "obsidian", enemies: ["imp", "salamander", "gargoyle"], color: "#ff7655", lore: "As cinzas ainda guardam a forma daqueles que tentaram entrar." },
  { name: "Forjas da Coroa", floor: T.RUINS, wall: T.ROCK, deco: T.LAVA, biome: "volcanic", enemies: ["salamander", "golem", "imp"], color: "#ff9b49", lore: "Metal rubro corre por canais talhados para alimentar a coroa do rei." },
  { name: "Muralhas do Juramento", floor: T.COBBLE, wall: T.CWALL, deco: T.PILLAR, biome: "obsidian", enemies: ["gargoyle", "skeleton", "wraith"], color: "#bf93ff", lore: "Cada pedra grava o juramento de um exército que jamais voltou." },
  { name: "Jardins de Espinhos", floor: T.MOSS, wall: T.ROCK, deco: T.DTREE, biome: "crimson", enemies: ["wraith", "wolf", "sporeling"], color: "#e35470", lore: "Espinhos negros se alimentam da lembrança dos antigos guardas." },
  { name: "Catacumbas de Basalto", floor: T.CAVE, wall: T.CWALL, deco: T.CRYSTAL, biome: "obsidian", enemies: ["skeleton", "golem", "shade"], color: "#9e90c8", lore: "O silêncio aqui pesa mais que as placas de pedra sobre os mortos." },
  { name: "Galerias da Chama Violeta", floor: T.RUINS, wall: T.ROCK, deco: T.LAVA, biome: "volcanic", enemies: ["imp", "shade", "salamander"], color: "#c477ff", lore: "Uma chama violeta queima sem consumir: ela transforma promessas em correntes." },
  { name: "Salões dos Generais", floor: T.COBBLE, wall: T.CWALL, deco: T.PILLAR, biome: "ruins", enemies: ["gargoyle", "golem", "wraith"], color: "#d8c29a", lore: "Os generais petrificados continuam a apontar suas espadas para o trono." },
  { name: "Torre do Eclipse", floor: T.ASH, wall: T.ROCK, deco: T.CRYSTAL, biome: "obsidian", enemies: ["wraith", "imp", "shade"], color: "#9285ff", lore: "As janelas mostram um céu que desapareceu do mundo exterior." },
  { name: "Abóbada das Almas", floor: T.RUINS, wall: T.CWALL, deco: T.DTREE, biome: "crimson", enemies: ["shade", "wraith", "skeleton"], color: "#ff5e8e", lore: "Almas antigas entoam o nome de Azrakel, sem saber se pedem socorro ou vingança." },
  { name: "Câmara da Coroa Desperta", floor: T.ASH, wall: T.CWALL, deco: T.LAVA, biome: "obsidian", enemies: ["wraith", "golem", "imp"], color: "#ff3d30", lore: "No último piso, a Coroa do Silêncio volta a pulsar sobre o trono." },
];

export const CITADEL_THEMES = THEME_SEEDS;
export const citadelTheme = (floor: number): Theme => THEME_SEEDS[Math.min(9, Math.max(0, Math.floor((floor - 1) / 10)))]!;
export const isCitadelGuardianFloor = (floor: number) => floor > 0 && (floor === CITADEL_FLOORS || (floor < CITADEL_FLOORS && isGuardianFloor(floor)));
export const citadelFloorLevel = (floor: number) => 68 + Math.round(Math.min(CITADEL_FLOORS, Math.max(1, floor)) * 1.16);

/** Cidadela usa um templo-sentinela para reaproveitar o estado de profundidade e seus saves. */
export function citadelTemple(floor: number): Temple {
  const n = Math.max(1, Math.min(CITADEL_FLOORS, Math.floor(floor))), theme = citadelTheme(n);
  return { id: `citadel_floor_${n}`, biome: theme.biome, name: `Cidadela de Gehenna · ${theme.name}`, family: "fire", hue: (n * 19) % 360, stair: "lava", tx: CITADEL_DOOR.tx, ty: CITADEL_DOOR.ty, level: citadelFloorLevel(n), lore: theme.lore };
}

const GUARDIANS: Record<number, GuardianData> = {
  10: { name: "Mordrath, Sentinela das Cinzas", kind: "gargoyle", tint: "#ff795c", scale: 3.2, minion: "imp", intro: "A sentinela ergue as asas e as cinzas dos antigos invasores formam um círculo de fogo." },
  20: { name: "Vulkhar, Mestre da Forja Rubra", kind: "salamander", tint: "#ff5130", scale: 3.3, minion: "salamander", intro: "O mestre da forja emerge do metal líquido e martela o chão uma vez: as paredes respondem." },
  30: { name: "Eredan, o Juramento de Pedra", kind: "golem", tint: "#c095ff", scale: 3.4, minion: "golem", intro: "Uma armadura vazia lembra seu voto. Uma alma esquecida volta a ocupá-la." },
  40: { name: "Thornveil, Rainha dos Espinhos", kind: "wraith", tint: "#ff527d", scale: 3.3, minion: "wraith", intro: "As raízes negras se fecham atrás de você. A rainha não permite que ninguém abandone seus jardins." },
  50: { name: "Basal-Om, o Coveiro de Gehenna", kind: "skeleton", tint: "#c8b3ff", scale: 3.3, minion: "skeleton", intro: "O coveiro desenha uma última lápide na pedra — com o seu nome." },
  60: { name: "Nyxara, Chama Violeta", kind: "shade", tint: "#d05bff", scale: 3.5, minion: "imp", intro: "A chama violeta se condensa numa figura. Sua luz revela as correntes que prendem o castelo." },
  70: { name: "General Dravok, o Imóvel", kind: "gargoyle", tint: "#ffe1a0", scale: 3.5, minion: "gargoyle", intro: "O general dá uma ordem sem voz. As estátuas das muralhas avançam em formação." },
  80: { name: "Syr Vesper, Arauto do Eclipse", kind: "wraith", tint: "#8d8aff", scale: 3.6, minion: "shade", intro: "O arauto abre as janelas da torre; atrás delas não há céu, apenas um segundo trono." },
  90: { name: "Vel-Asha, Guardiã das Almas", kind: "shade", tint: "#ff69bd", scale: 3.8, minion: "wraith", intro: "As almas interrompem o coro. Vel-Asha recolhe cada voz e transforma o lamento em lâminas." },
};

export const citadelGuardianIntro = (floor: number) => floor === CITADEL_FLOORS
  ? "No trono, Azrakel desperta sob a Coroa do Silêncio. As portas se fecham; desta vez, não existe um piso além dele."
  : GUARDIANS[floor]?.intro ?? "O guardião do piso se prepara para defender a cidadela.";

export function citadelBoss(floor: number, tx: number, ty: number): BossDef | null {
  if (!isCitadelGuardianFloor(floor)) return null;
  const lvl = citadelFloorLevel(floor);
  if (floor === CITADEL_FLOORS) return {
    id: CITADEL_FINAL_BOSS_ID, name: "Azrakel, Rei Demônio — Coroa Desperta", biome: "obsidian", tx, ty,
    hp: 620_000, atk: 310, xp: 2_500_000, gold: 180_000, color: "#ff4038", minion: "wraith",
    reward: ["azrakel_crown", "gehenna_ember", "gehenna_ember", "gehenna_ember", "elixir", "elixir", "elixir"],
  };
  const g = GUARDIANS[floor]!;
  return {
    id: `citadel_${floor}`, name: g.name, biome: citadelTheme(floor).biome, tx, ty,
    hp: Math.round(18_000 + lvl * lvl * 16 + floor * 250), atk: Math.round(22 + lvl * 2.15),
    xp: Math.round(3_000 + lvl * lvl * 18), gold: Math.round(floor * 520), color: g.tint, minion: g.minion,
    reward: ["gehenna_ember", "gehenna_ember", "hi_potion", "elixir"],
  };
}

export const CITADEL_BOSS_LOOK: Record<string, { kind: EnemyKind; tint: string; scale: number }> = {
  ...Object.fromEntries(Object.entries(GUARDIANS).map(([floor, g]) => [`citadel_${floor}`, { kind: g.kind, tint: g.tint, scale: g.scale }])),
  [CITADEL_FINAL_BOSS_ID]: { kind: "wraith", tint: "#ff4038", scale: 4.3 },
};

/** Geração determinística; o caller solta o mapa anterior antes de entrar no próximo piso. */
export function generateCitadelFloor(floor: number): DungeonFloor {
  const n = Math.max(1, Math.min(CITADEL_FLOORS, Math.floor(floor)));
  const theme = citadelTheme(n), level = citadelFloorLevel(n);
  const data = generateFloor(n, {
    theme, seed: 0x47e11a + n * 104_729, size: floorSize(n), level, idPrefix: "citadel",
    eliteBonus: 0.18 + n * 0.0015, guardian: isCitadelGuardianFloor(n), finalArena: n === CITADEL_FLOORS,
  });
  const boss = citadelBoss(n, data.stairs.tx, data.stairs.ty - 2);
  if (boss) data.boss = boss;
  return data;
}

export function citadelBest(discoveries: ReadonlySet<string>): number {
  let best = 0;
  for (const key of discoveries) if (key.startsWith(CITADEL_BEST_PREFIX)) {
    const value = Number(key.slice(CITADEL_BEST_PREFIX.length));
    if (Number.isInteger(value)) best = Math.max(best, Math.min(CITADEL_FLOORS, value));
  }
  return best;
}

/** Só usa a chave aditiva discoveries; o recorde do Abismo e os saves antigos ficam intactos. */
export function recordCitadelBest(discoveries: Set<string>, floor: number): number {
  const best = Math.max(citadelBest(discoveries), Math.max(0, Math.min(CITADEL_FLOORS, Math.floor(floor))));
  if (best > citadelBest(discoveries)) {
    for (const key of [...discoveries]) if (key.startsWith(CITADEL_BEST_PREFIX)) discoveries.delete(key);
    discoveries.add(`${CITADEL_BEST_PREFIX}${best}`);
  }
  return best;
}

export const citadelCheckpoints = (best: number) => checkpoints(Math.max(1, Math.min(CITADEL_FLOORS, best)));
export const citadelUnlocked = (bossesDone: ReadonlySet<string>) => bossesDone.has(CITADEL_UNLOCK_BOSS_ID);

const farGate = FRONTIER_GATES.reduce((best, gate) => {
  const d = (gate.tx - 122) ** 2 + (gate.ty - 126) ** 2;
  const bd = (best.tx - 122) ** 2 + (best.ty - 126) ** 2;
  return d > bd ? gate : best;
});
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
export const CITADEL_FRONTIER_GATE = farGate;
export const CITADEL_ENTRY = {
  tx: clamp(farGate.tx + 18, 8, W - 24), ty: clamp(farGate.ty + 5, 14, H - 28), w: 13, h: 10,
};
export const CITADEL_DOOR = { tx: CITADEL_ENTRY.tx + Math.floor(CITADEL_ENTRY.w / 2), ty: CITADEL_ENTRY.ty + CITADEL_ENTRY.h - 1 };

/** Estrada e footprint estáticos, iguais em cada load/save do mundo. */
export function carveCitadelSite(world: World) {
  const set = (tx: number, ty: number, tile: number) => {
    if (tx >= 2 && ty >= 2 && tx < W - 2 && ty < H - 2) world.tiles[ty * W + tx] = tile;
  };
  let x = farGate.tx, y = farGate.ty + 2;
  const road = (cx: number, cy: number) => { for (let dx = -1; dx <= 1; dx++) set(cx + dx, cy, T.PATH); };
  road(x, y);
  const southLane = CITADEL_DOOR.ty + 4;
  while (y !== southLane) { y += Math.sign(southLane - y); road(x, y); }
  while (x !== CITADEL_DOOR.tx) { x += Math.sign(CITADEL_DOOR.tx - x); road(x, y); }
  while (y !== CITADEL_DOOR.ty + 1) { y += Math.sign(CITADEL_DOOR.ty + 1 - y); road(x, y); }
  const citadelBiome = Math.max(0, BIOME_LIST.indexOf("obsidian"));
  for (let yy = CITADEL_ENTRY.ty; yy < CITADEL_ENTRY.ty + CITADEL_ENTRY.h; yy++) {
    for (let xx = CITADEL_ENTRY.tx; xx < CITADEL_ENTRY.tx + CITADEL_ENTRY.w; xx++) {
      const edge = xx === CITADEL_ENTRY.tx || yy === CITADEL_ENTRY.ty || xx === CITADEL_ENTRY.tx + CITADEL_ENTRY.w - 1 || yy === CITADEL_ENTRY.ty + CITADEL_ENTRY.h - 1;
      set(xx, yy, edge ? T.PILLAR : T.COBBLE);
      world.biomes[yy * W + xx] = citadelBiome;
    }
  }
  set(CITADEL_DOOR.tx, CITADEL_DOOR.ty, T.PATH);
  for (let yy = CITADEL_DOOR.ty + 1; yy <= CITADEL_DOOR.ty + 4; yy++) for (let dx = -1; dx <= 1; dx++) set(CITADEL_DOOR.tx + dx, yy, T.PATH);
}

let gateImg: HTMLImageElement | null = null;
let guardImg: HTMLImageElement | null = null;
let kingImg: HTMLImageElement | null = null;
let throneImg: HTMLImageElement | null = null;
function image(src: string, current: HTMLImageElement | null): HTMLImageElement | null {
  if (typeof Image === "undefined") return null;
  if (current) return current;
  const img = new Image(); img.src = src; return img;
}

export function drawCitadelGate(c: CanvasRenderingContext2D, unlocked: boolean, time: number) {
  gateImg = image(gateArt, gateImg); guardImg = image(guardArt, guardImg);
  const gate = gateImg, guard = guardImg;
  const x = (CITADEL_ENTRY.tx - 2) * TS, y = (CITADEL_ENTRY.ty - 8) * TS, size = 18 * TS;
  c.save();
  if (gate && gate.complete && gate.naturalWidth) {
    c.shadowColor = unlocked ? "#ff713e" : "#70273e"; c.shadowBlur = 12 + Math.sin(time * 2) * 4;
    c.drawImage(gate, x, y, size, size);
  }
  c.shadowBlur = 0;
  if (guard && guard.complete && guard.naturalWidth) {
    c.drawImage(guard, CITADEL_DOOR.tx * TS - 39, CITADEL_DOOR.ty * TS - 20, 25, 36);
    c.drawImage(guard, CITADEL_DOOR.tx * TS + 14, CITADEL_DOOR.ty * TS - 20, 25, 36);
  }
  if (!unlocked) {
    c.globalAlpha = 0.48 + Math.sin(time * 3) * 0.12; c.fillStyle = "#a33152";
    c.fillRect(CITADEL_DOOR.tx * TS - 8, CITADEL_DOOR.ty * TS - 10, 16, 18);
  }
  c.restore();
}

export function drawCitadelKing(c: CanvasRenderingContext2D, x: number, y: number, time: number, flash: boolean) {
  kingImg = image(kingArt, kingImg); const img = kingImg;
  if (!img || !img.complete || !img.naturalWidth) return false;
  c.save(); c.imageSmoothingEnabled = false;
  c.globalAlpha = flash ? 0.72 : 1; c.filter = flash ? "brightness(2.2)" : "none";
  const bob = Math.sin(time * 1.3) * 1.3;
  c.drawImage(img, x - 24, y - 72 + bob, 48, 72);
  c.restore(); return true;
}

export function drawCitadelThrone(c: CanvasRenderingContext2D, centerX: number, centerY: number, width: number, height: number) {
  throneImg = image(throneArt, throneImg); const img = throneImg;
  if (!img || !img.complete || !img.naturalWidth) return false;
  c.save(); c.imageSmoothingEnabled = false; c.drawImage(img, centerX - width / 2, centerY - height / 2, width, height); c.restore(); return true;
}
