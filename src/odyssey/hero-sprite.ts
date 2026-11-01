// Protagonista com os sprites do primeiro jogo: corpo base, skins prontas e arma equipada em camadas.
// Acessórios pintados por IA (look-gear.ts) são desenhados em camadas sobre a skin.
import type { ItemDef, WeaponKind } from "./data";
import { drawK, kImage, K_DIR } from "./kaetram";
import { drawGearBack, drawGearFront, type GearPick } from "./look-gear";
import type { FxName } from "./vfx";

export type ComboFx = [FxName, FxName, FxName, FxName, FxName];
export interface HeroSkin { id: string; name: string; desc: string; sheet: string; minLevel: number; ai?: boolean; fx?: ComboFx }
const CLASSIC_FX: ComboFx = ["slash", "impact", "slash", "shock", "explosion"];
/** Índice salvo em Look.kskin: só skins no estilo Kaetram (ordem antiga preservada para saves). */
export const HERO_SKINS: HeroSkin[] = [
  { id: "base", name: "Aventureiro", desc: "O herói clássico do primeiro jogo.", sheet: "player/base", minLevel: 1 },
  { id: "danbo", name: "Danbo", desc: "Robô de papelão, firme e leal.", sheet: "player/skin/danbo", minLevel: 1 },
  { id: "danboblue", name: "Danbo Azul", desc: "Pintado com tinta do mar.", sheet: "player/skin/danboblue", minLevel: 2 },
  { id: "danbogreen", name: "Danbo Verde", desc: "Camuflado para a mata.", sheet: "player/skin/danbogreen", minLevel: 3 },
  { id: "danbored", name: "Danbo Rubro", desc: "Pronto para a forja.", sheet: "player/skin/danbored", minLevel: 4 },
  { id: "taekwondo", name: "Mestre Taekwondo", desc: "Faixa preta e dobok branco.", sheet: "player/skin/taekwondo", minLevel: 5 },
  { id: "oldman", name: "Velho Sábio", desc: "Barba longa, passos lentos, olhar atento.", sheet: "player/skin/oldmanskin", minLevel: 7 },
  { id: "skeleton", name: "Esqueleto", desc: "Voltou do Abismo e esqueceu de morrer.", sheet: "player/skin/skeletonskin", minLevel: 10 },
  { id: "darkskeleton", name: "Esqueleto Sombrio", desc: "Ossos tingidos pela Noite.", sheet: "player/skin/darkskeletonskin", minLevel: 15 },
  // Novas skins pintadas por IA (adicionadas ao fim para preservar índices salvos).
  { id: "knight", name: "Cavaleiro de Prata", desc: "Armadura polida e tabardo azul.", sheet: "hero/knight", minLevel: 1, ai: true },
  { id: "ninja", name: "Ninja", desc: "Sombra veloz de lenço rubro.", sheet: "hero/ninja", minLevel: 2, ai: true },
  { id: "wizard", name: "Mago Estelar", desc: "Barba branca e manto de estrelas.", sheet: "hero/wizard", minLevel: 3, ai: true },
  { id: "orc", name: "Orc Guerreiro", desc: "Pele verde, couro e presas.", sheet: "hero/orc", minLevel: 4, ai: true },
  { id: "pirate", name: "Pirata", desc: "Bandana vermelha e colete de couro.", sheet: "hero/pirate", minLevel: 5, ai: true },
  { id: "astronaut", name: "Astronauta", desc: "Caiu das estrelas em Kaetran.", sheet: "hero/astronaut", minLevel: 6, ai: true },
];
export const skinUnlocked = (i: number, level: number) => level >= (HERO_SKINS[i]?.minLevel ?? 1);
/** Efeito especial do golpe `step` (0–4) do combo para a skin. */
export const skinFx = (i: number, step: number): FxName => (HERO_SKINS[i]?.fx ?? CLASSIC_FX)[((step % 5) + 5) % 5] ?? "slash";

/** Folha de arma para cada tipo quando o item não tiver uma própria. */
const KIND_SPRITE: Record<WeaponKind, string> = { sword: "tinsword", spear: "bronzespear", bow: "woodenbow", staff: "naturestaff" };
export function weaponSheet(item: Pick<ItemDef, "sprite" | "weapon"> | undefined): string {
  const s = item?.sprite ?? KIND_SPRITE[item?.weapon ?? "sword"];
  return `player/weapon/${s}`;
}

/**
 * Desenha o herói com sprites Kaetram. Retorna false quando a skin é a clássica
 * ou as imagens ainda não carregaram (o jogo então usa drawChar).
 */
export function drawHero(c: CanvasRenderingContext2D, x: number, y: number, o: { skin: number; dir: number; moving: boolean; frameT: number; attack: number; combo?: number; weapon?: Pick<ItemDef, "sprite" | "weapon"> | null; time: number; alpha?: number; scale?: number; gear?: GearPick }): boolean {
  const skin = HERO_SKINS[o.skin] ?? HERO_SKINS[0];
  if (!skin.sheet || !kImage(skin.sheet)) return false;
  const d = K_DIR[o.dir] ?? "down", flip = o.dir === 1;
  const attacking = o.attack > 0;
  const bow = o.weapon?.weapon === "bow";
  const anim = attacking ? `${bow ? "bow_" : ""}atk_${d}` : o.moving ? `walk_${d}` : `idle_${d}`;
  const frame = attacking ? Math.min(3, Math.floor((1 - o.attack) * 4)) : o.moving ? o.frameT : o.time * 2.2;
  const wsheet = o.weapon ? weaponSheet(o.weapon) : null;
  const sc = o.scale ?? 1, a = o.alpha ?? 1;
  drawGearBack(c, o.gear, x, y, d, flip, o.time, sc, a);
  if (wsheet && d === "up") drawK(c, wsheet, anim, frame, x, y, flip, a, sc);
  drawK(c, skin.sheet, anim, frame, x, y, flip, a, sc);
  if (wsheet && d !== "up") drawK(c, wsheet, anim, frame, x, y, flip, a, sc);
  drawGearFront(c, o.gear, x, y, d, flip, o.time, sc, a);
  return true;
}

