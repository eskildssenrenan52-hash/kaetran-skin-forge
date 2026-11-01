// Diretor de cenas: lê o texto de cada cena e monta um roteiro de planos (shots) próprio,
// coerente com o que acontece (queda de chefe, chegada, memória, confissão, final...).
// Tudo é determinístico pelo id da cena: a mesma cena sempre é igual, e duas cenas nunca
// compartilham o mesmo roteiro, cenário, câmera e clima.
import type { EnemyKind } from "./data";

export type Setting = "fire" | "ice" | "sea" | "desert" | "forest" | "crystal" | "abyss" | "village" | "sky" | "ruins";
export type Mood = "defeat" | "memory" | "arrival" | "confession" | "finale" | "prologue" | "omen" | "journal" | "rumor" | "triumph";
export type ShotKind =
  | "establish" | "walkIn" | "bossRoar" | "clash" | "shatter" | "lightRise" | "heroClose" | "duo" | "campfire"
  | "flashback" | "treeSong" | "skyTilt" | "silhouette" | "aftermath" | "pages" | "crowd" | "storm" | "orbit";

export interface Shot { kind: ShotKind; dur: number; zoom0: number; zoom1: number; panX0: number; panX1: number; tilt: number }
export interface Script {
  id: string; setting: Setting; mood: Mood; seed: number; shots: Shot[]; total: number;
  hue: number; night: number; weather: "none" | "rain" | "snow" | "ash" | "petals" | "sand" | "spores" | "bubbles" | "stars";
  bossKind: EnemyKind; bossTint: string; landmark: number;
}

export const MIN_SCENE_SECONDS = 22;

export function hashId(s: string) { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0; return h >>> 0 || 1; }
export function rngOf(seed: number) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }

const esc = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** Procura palavras pelo começo (evita "mar" dentro de "lembrar"). */
const has = (t: string, ...w: string[]) => w.some((x) => new RegExp(`(^|[^a-zà-ÿ])${esc(x.trim())}`, "i").test(t));

export function detectSetting(t: string): Setting {
  if (has(t, "fogo", "chama", "vulc", "brasa", "forja", "lava", "fornalha")) return "fire";
  if (has(t, "gelo", "neve", "glacial", "geada", "pico", "fenrir", "inverno")) return "ice";
  if (has(t, "mar", "maré", "coral", "porto", "onda", "leviat", "naufr", "ilha")) return "sea";
  if (has(t, "areia", "desert", "escorpi", "oásis", "duna", "sahr")) return "desert";
  if (has(t, "cristal", "colosso", "gema", "caverna", "mina")) return "crystal";
  if (has(t, "floresta", "raiz", "raízes", "árvore", "ent ", "cerejeira", "pétala", "flor", "esporo", "cogumelo", "bosque")) return "forest";
  if (has(t, "abismo", "vazio", "ømnia", "sem-eco", "manto cinza")) return "abyss";
  if (has(t, "céu", "estrela", "nuvem", "vento", "aurora")) return "sky";
  if (has(t, "ruína", "templo", "santuário", "antig")) return "ruins";
  return "village";
}

export function detectMood(id: string, trigger: string, t: string): Mood {
  if (id === "prologue" || id.startsWith("saga_pro")) return "prologue";
  if (id === "epilogue" || id.startsWith("saga_epi") || has(t, "epílogo", "renasc")) return "finale";
  if (id.startsWith("diario")) return "journal";
  if (id.startsWith("rumor")) return "rumor";
  if (trigger.startsWith("boss:") || id.startsWith("saga_win") || id.startsWith("eco_")) return "defeat";
  if (id.startsWith("memoria") || has(t, "memória", "lembra", "éramos", "cem anos")) return "memory";
  if (id.startsWith("chegada") || trigger.startsWith("quest:") && has(t, "observa", "chegou", "chega")) return "arrival";
  if (has(t, "confiss", "irmão", "covardia", "eu fui")) return "confession";
  if (trigger.startsWith("boss:") || id.startsWith("saga_win") || id.startsWith("eco_") || has(t, "cai", "desaba", "purificad", "derrot", "se parte", "despedaç")) return "defeat";
  if (has(t, "fim do ato", "cantam", "vitória", "acendem")) return "triumph";
  return "omen";
}

const TEMPLATES: Record<Mood, ShotKind[][]> = {
  defeat: [["establish", "bossRoar", "clash", "shatter", "lightRise", "heroClose", "aftermath"], ["storm", "silhouette", "clash", "bossRoar", "shatter", "lightRise", "duo"], ["orbit", "clash", "bossRoar", "shatter", "heroClose", "treeSong", "aftermath"]],
  arrival: [["skyTilt", "establish", "walkIn", "duo", "heroClose", "silhouette"], ["establish", "walkIn", "crowd", "duo", "orbit", "skyTilt"], ["storm", "walkIn", "establish", "duo", "campfire", "heroClose"]],
  memory: [["flashback", "duo", "flashback", "silhouette", "heroClose", "skyTilt"], ["campfire", "flashback", "treeSong", "flashback", "duo", "aftermath"]],
  confession: [["campfire", "duo", "heroClose", "flashback", "duo", "skyTilt"], ["silhouette", "campfire", "flashback", "heroClose", "duo", "orbit"]],
  finale: [["treeSong", "lightRise", "crowd", "duo", "orbit", "skyTilt", "establish"], ["skyTilt", "treeSong", "crowd", "lightRise", "heroClose", "establish"]],
  prologue: [["skyTilt", "treeSong", "establish", "storm", "silhouette", "walkIn"], ["establish", "flashback", "treeSong", "storm", "walkIn", "heroClose"]],
  omen: [["storm", "silhouette", "establish", "duo", "heroClose", "skyTilt"], ["establish", "orbit", "silhouette", "duo", "campfire"]],
  journal: [["pages", "flashback", "silhouette", "pages", "heroClose", "skyTilt"], ["pages", "campfire", "flashback", "pages", "establish"]],
  rumor: [["crowd", "campfire", "duo", "silhouette", "crowd", "establish"], ["establish", "crowd", "flashback", "duo", "orbit"]],
  triumph: [["lightRise", "crowd", "treeSong", "orbit", "heroClose", "establish"], ["establish", "crowd", "lightRise", "duo", "skyTilt", "treeSong"]],
};

const WEATHER: Record<Setting, Script["weather"][]> = {
  fire: ["ash", "none"], ice: ["snow", "stars"], sea: ["rain", "bubbles", "none"], desert: ["sand", "stars"], forest: ["petals", "spores", "rain"],
  crystal: ["stars", "spores"], abyss: ["ash", "stars"], village: ["petals", "rain", "stars", "none"], sky: ["stars", "none"], ruins: ["sand", "rain", "stars"],
};
const BOSS_BY_SETTING: Record<Setting, [EnemyKind, string]> = {
  fire: ["golem", "#ff6030"], ice: ["wolf", "#c0e8ff"], sea: ["scorpion", "#40a0d0"], desert: ["scorpion", "#d0a040"], forest: ["sporeling", "#60c050"],
  crystal: ["golem", "#c080ff"], abyss: ["shade", "#6040a0"], village: ["goblin", "#d9a520"], sky: ["shade", "#a0c0ff"], ruins: ["golem", "#b0a080"],
};

export interface BeatLike { id: string; trigger?: string; title: string; lines: string[] }
export interface BossLook { kind: EnemyKind; tint: string }

/** Monta o roteiro da cena (sempre ≥ 22 s e com ao menos 6 planos). */
export function directScene(b: BeatLike, look?: BossLook | null): Script {
  const text = `${b.title} ${b.lines.join(" ")}`.toLowerCase();
  const seed = hashId(b.id);
  const r = rngOf(seed);
  const setting = detectSetting(text);
  const mood = detectMood(b.id, b.trigger ?? "", text);
  const variants = TEMPLATES[mood];
  const base = [...variants[seed % variants.length]!];
  // variação: troca dois planos centrais e às vezes acrescenta um plano extra
  if (base.length > 4 && r() < 0.6) { const i = 1 + Math.floor(r() * (base.length - 3)); [base[i], base[i + 1]] = [base[i + 1]!, base[i]!]; }
  const extras: ShotKind[] = ["orbit", "skyTilt", "silhouette", "heroClose", "establish"];
  while (base.length < 6) base.push(extras[Math.floor(r() * extras.length)]!);
  const total = Math.max(MIN_SCENE_SECONDS + Math.floor(r() * 6), b.lines.length * 5);
  const weights = base.map(() => 0.8 + r() * 0.6); const ws = weights.reduce((a, x) => a + x, 0);
  const shots: Shot[] = base.map((kind, i) => {
    const z0 = 1 + r() * 0.15, push = kind === "heroClose" || kind === "bossRoar" ? 0.35 : (r() - 0.4) * 0.25;
    return { kind, dur: (weights[i]! / ws) * total, zoom0: z0, zoom1: z0 + push, panX0: (r() - 0.5) * 60, panX1: (r() - 0.5) * 60, tilt: (r() - 0.5) * 0.04 };
  });
  const [bk, bt] = BOSS_BY_SETTING[setting];
  const ws2 = WEATHER[setting];
  return {
    id: b.id, setting, mood, seed, shots, total,
    hue: Math.floor(r() * 40) - 20, night: mood === "memory" || mood === "confession" || setting === "abyss" ? 0.6 + r() * 0.3 : r() * 0.7,
    weather: ws2[Math.floor(r() * ws2.length)]!, bossKind: look?.kind ?? bk, bossTint: look?.tint ?? bt, landmark: Math.floor(r() * 6),
  };
}

/** Assinatura do roteiro, usada para garantir que cenas diferentes não se repetem. */
export const scriptSignature = (s: Script) => `${s.setting}|${s.weather}|${s.landmark}|${s.hue}|${s.shots.map((x) => `${x.kind}:${x.dur.toFixed(1)}`).join(",")}`;

export function shotAt(s: Script, t: number): { shot: Shot; idx: number; local: number; p: number } {
  let acc = 0;
  for (let i = 0; i < s.shots.length; i++) {
    const sh = s.shots[i]!;
    if (t < acc + sh.dur || i === s.shots.length - 1) { const local = Math.max(0, t - acc); return { shot: sh, idx: i, local, p: Math.min(1, local / sh.dur) }; }
    acc += sh.dur;
  }
  return { shot: s.shots[0]!, idx: 0, local: 0, p: 0 };
}
