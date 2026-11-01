// Sistema de pets — dados puros e regras (sem DOM). Sprites vêm do primeiro jogo (pets/* e mobs/*).
// Cada pet tem espécie, elemento, raridade, natureza, genes (0–15 por atributo), nível, laço, fome,
// habilidades por nível, evoluções ramificadas por condição e pode ser cruzado no Ninho para gerar ovos.

export type Element = "fogo" | "agua" | "terra" | "ar" | "luz" | "sombra" | "natureza" | "gelo";
export type Rarity = "comum" | "incomum" | "raro" | "epico" | "lendario";
export type Role = "atacante" | "tanque" | "curandeiro" | "coletor" | "suporte";
export type StatKey = "hp" | "atk" | "def" | "spd";
export type PetStats = Record<StatKey, number>;

export interface EvoRule { to: string; level: number; bond?: number; time?: "dia" | "noite"; biome?: string[]; item?: string; label: string }
export interface Species {
  id: string; name: string; sheet: string; element: Element; rarity: Rarity; role: Role;
  base: PetStats; evolves?: EvoRule[] | undefined; stage: 1 | 2 | 3; desc: string; scale?: number | undefined; favorite: string;
}

export const ELEMENTS: Record<Element, { name: string; color: string; strong: Element[] }> = {
  fogo: { name: "Fogo", color: "#ff7040", strong: ["natureza", "gelo"] },
  agua: { name: "Água", color: "#40a0ff", strong: ["fogo", "terra"] },
  terra: { name: "Terra", color: "#b08040", strong: ["fogo", "ar"] },
  ar: { name: "Ar", color: "#c0f0ff", strong: ["natureza", "terra"] },
  luz: { name: "Luz", color: "#fff0a0", strong: ["sombra"] },
  sombra: { name: "Sombra", color: "#8050d0", strong: ["luz", "ar"] },
  natureza: { name: "Natureza", color: "#60d070", strong: ["agua", "terra"] },
  gelo: { name: "Gelo", color: "#a0e8ff", strong: ["natureza", "ar"] },
};
export const RARITY: Record<Rarity, { name: string; color: string; weight: number; mult: number }> = {
  comum: { name: "Comum", color: "#c8c8c8", weight: 60, mult: 1 },
  incomum: { name: "Incomum", color: "#60d070", weight: 25, mult: 1.1 },
  raro: { name: "Raro", color: "#4090ff", weight: 10, mult: 1.22 },
  epico: { name: "Épico", color: "#b060ff", weight: 4, mult: 1.36 },
  lendario: { name: "Lendário", color: "#ffb030", weight: 1, mult: 1.55 },
};
export const ROLES: Record<Role, string> = {
  atacante: "Ataca os inimigos próximos com força.",
  tanque: "Absorve parte do dano que você recebe.",
  curandeiro: "Cura seu HP de tempos em tempos.",
  coletor: "Encontra ouro extra e itens nas vitórias.",
  suporte: "Aumenta o dano que você causa.",
};

const S = (id: string, name: string, sheet: string, element: Element, rarity: Rarity, role: Role, stage: 1 | 2 | 3, base: [number, number, number, number], desc: string, favorite: string, evolves?: EvoRule[], scale?: number): Species =>
  ({ id, name, sheet, element, rarity, role, stage, base: { hp: base[0], atk: base[1], def: base[2], spd: base[3] }, desc, favorite, evolves, scale });

export const SPECIES: Species[] = [
  // Linha dos ratinhos (sprites de pet originais)
  S("rato", "Ratinho", "pets/rat", "terra", "comum", "coletor", 1, [30, 6, 4, 9], "Fareja moedas perdidas.", "wheat", [{ to: "rato_chapeu", level: 8, bond: 30, label: "Nv 8 · laço 30" }]),
  S("rato_chapeu", "Rato de Chapéu", "pets/rathat", "terra", "incomum", "coletor", 2, [42, 9, 6, 11], "Elegante e ainda mais ganancioso.", "wheat", [{ to: "rato_balao", level: 18, bond: 60, label: "Nv 18 · laço 60" }]),
  S("rato_balao", "Rato Balonista", "pets/ratballoon", "ar", "raro", "coletor", 3, [55, 12, 8, 15], "Voa por cima dos tesouros.", "pet_feast"),
  // Camundongos
  S("camundongo", "Camundongo Branco", "mobs/whitemouse", "luz", "comum", "curandeiro", 1, [28, 4, 4, 10], "Um rodopio que acalma feridas.", "carrot",
    [{ to: "camundongo_sol", level: 10, time: "dia", label: "Nv 10 · de dia" }, { to: "camundongo_brasa", level: 10, time: "noite", label: "Nv 10 · à noite" }]),
  S("camundongo_sol", "Camundongo Solar", "mobs/yellowmouse", "luz", "incomum", "curandeiro", 2, [40, 6, 6, 12], "Brilha como o meio-dia.", "carrot"),
  S("camundongo_brasa", "Camundongo Brasa", "mobs/redmouse", "fogo", "incomum", "atacante", 2, [38, 10, 5, 12], "Pequeno, quente e bravo.", "carrot"),
  S("camundongo_terra", "Camundongo do Campo", "mobs/brownmouse", "terra", "comum", "coletor", 1, [32, 5, 5, 9], "Cava atrás de sementes.", "wheat"),
  // Gatos
  S("gato", "Gato Errante", "mobs/cat", "sombra", "incomum", "atacante", 1, [34, 9, 4, 13], "Arranha primeiro, ronrona depois.", "pet_treat", [{ to: "fofo", level: 14, bond: 50, label: "Nv 14 · laço 50" }]),
  S("fofo", "Fofo", "mobs/fluffy", "luz", "raro", "suporte", 2, [50, 10, 8, 12], "Sua presença deixa você mais forte.", "pet_treat"),
  // Sapos e gosmas
  S("sapo", "Sapinho", "mobs/frog", "agua", "comum", "curandeiro", 1, [34, 5, 5, 8], "Coaxa canções de cura.", "moonflower"),
  S("gosma", "Gosma", "mobs/slime", "agua", "comum", "tanque", 1, [45, 4, 8, 5], "Amortece qualquer golpe.", "goo", [{ to: "gosma_lava", level: 12, biome: ["volcanic", "desert"], label: "Nv 12 · vulcão ou deserto" }]),
  S("gosma_lava", "Gosma de Lava", "mobs/lavaslime", "fogo", "raro", "tanque", 2, [70, 9, 13, 6], "Derrete quem a ataca.", "coal"),
  // Morcegos
  S("morcego", "Morceguinho", "mobs/bat", "sombra", "comum", "atacante", 1, [26, 8, 3, 15], "Rasante na escuridão.", "pet_treat",
    [{ to: "morcego_gelo", level: 12, biome: ["mountain", "tundra", "glacier"], label: "Nv 12 · montanha gelada" }, { to: "morcego_ouro", level: 12, item: "evo_stone", label: "Nv 12 · Pedra da Evolução" }]),
  S("morcego_gelo", "Morcego Glacial", "mobs/icebat", "gelo", "raro", "atacante", 2, [40, 13, 6, 17], "Asas que cortam como gelo.", "frost_herb"),
  S("morcego_ouro", "Morcego Dourado", "mobs/yellowbat", "luz", "raro", "coletor", 2, [42, 11, 6, 17], "Atrai moedas como ímã.", "pet_treat"),
  // Lobos
  S("lobo", "Lobinho", "mobs/wolf", "natureza", "incomum", "atacante", 1, [40, 11, 6, 12], "Leal até o último uivo.", "pet_treat",
    [{ to: "lobo_neve", level: 15, time: "dia", label: "Nv 15 · de dia" }, { to: "lobo_sombra", level: 15, time: "noite", label: "Nv 15 · à noite" }]),
  S("lobo_neve", "Lobo da Neve", "mobs/snowwolf", "gelo", "raro", "atacante", 2, [60, 16, 9, 14], "Uiva e o ar congela.", "pet_feast", [{ to: "cao_infernal", level: 30, item: "evo_stone", bond: 80, label: "Nv 30 · laço 80 · Pedra" }]),
  S("lobo_sombra", "Lobo Sombrio", "mobs/darkwolf", "sombra", "raro", "atacante", 2, [58, 17, 8, 15], "Some na noite e volta mordendo.", "pet_feast", [{ to: "cao_infernal", level: 30, item: "evo_stone", bond: 80, label: "Nv 30 · laço 80 · Pedra" }]),
  S("cao_infernal", "Cão Infernal", "mobs/hellhound", "fogo", "lendario", "atacante", 3, [85, 24, 12, 16], "Guardião das brasas do Abismo.", "pet_feast"),
  // Pinguim
  S("pinguim", "Pinguim", "mobs/penguin", "gelo", "incomum", "tanque", 1, [55, 6, 11, 6], "Barriga dura, coração mole.", "frost_herb", undefined, 0.75),
  // Dragões
  S("dragaozinho", "Dragãozinho", "mobs/minidragon", "fogo", "epico", "atacante", 1, [45, 13, 8, 11], "Um ovo raríssimo de dragão.", "pet_feast",
    [{ to: "dragao_floresta", level: 25, biome: ["forest", "jungle", "meadow"], label: "Nv 25 · floresta" }]),
  S("dragao_floresta", "Dragão da Floresta", "mobs/forestdragon", "natureza", "lendario", "atacante", 2, [90, 22, 15, 12], "Raízes e chamas num só rugido.", "pet_feast", undefined, 0.6),
  S("serpe_mar", "Serpe Marinha", "mobs/miniseadragon", "agua", "epico", "suporte", 1, [48, 11, 9, 12], "Nadadora veloz dos recifes.", "pet_feast",
    [{ to: "dragao_mar", level: 25, biome: ["coast"], label: "Nv 25 · costa" }, { to: "dragao_trovao", level: 25, item: "evo_stone", time: "noite", label: "Nv 25 · noite · Pedra" }]),
  S("dragao_mar", "Dragão do Mar", "mobs/seadragon", "agua", "lendario", "suporte", 2, [92, 19, 16, 12], "As marés obedecem ao seu canto.", "pet_feast", undefined, 0.55),
  S("dragao_trovao", "Dragão do Trovão", "mobs/lightningseadragon", "ar", "lendario", "atacante", 2, [86, 25, 13, 14], "Cada escama é um relâmpago.", "pet_feast", undefined, 0.55),
  // Caranguejos
  S("caranguejo", "Caranguejo", "mobs/crab", "agua", "comum", "tanque", 1, [44, 6, 10, 6], "Pinças pra frente, casco pra trás.", "goo",
    [{ to: "ermitao", level: 10, label: "Nv 10" }, { to: "caranguejo_gelo", level: 10, biome: ["mountain", "tundra", "glacier"], label: "Nv 10 · terras geladas" }]),
  S("ermitao", "Caranguejo Ermitão", "mobs/hermitcrab", "terra", "incomum", "tanque", 2, [64, 8, 15, 6], "Leva a casa nas costas.", "goo"),
  S("caranguejo_gelo", "Caranguejo de Gelo", "mobs/icecrab", "gelo", "raro", "tanque", 2, [66, 10, 16, 6], "Casco de cristal gelado.", "frost_herb"),
  // Insetos
  S("abelha", "Abelhinha", "mobs/bee", "natureza", "comum", "curandeiro", 1, [24, 6, 3, 14], "Traz mel que cura.", "moonflower", [{ to: "vespa", level: 12, label: "Nv 12" }]),
  S("vespa", "Vespa Rainha", "mobs/hornet", "natureza", "raro", "atacante", 2, [40, 14, 5, 16], "Ferrão certeiro.", "moonflower"),
  S("besouro", "Besouro", "mobs/beetle", "terra", "comum", "tanque", 1, [42, 6, 11, 6], "Uma carapaça teimosa.", "wheat"),
  S("aranha", "Aranhinha", "mobs/spider", "sombra", "comum", "atacante", 1, [28, 9, 4, 12], "Tece armadilhas.", "goo",
    [{ to: "aranha_veneno", level: 12, biome: ["swamp", "jungle"], label: "Nv 12 · pântano/selva" }, { to: "aranha_fogo", level: 12, biome: ["volcanic"], label: "Nv 12 · vulcão" }]),
  S("aranha_veneno", "Aranha Venenosa", "mobs/poisonspider", "natureza", "raro", "atacante", 2, [42, 15, 6, 13], "Veneno que não perdoa.", "goo"),
  S("aranha_fogo", "Aranha de Fogo", "mobs/firespider", "fogo", "raro", "atacante", 2, [42, 16, 6, 13], "Teia em brasa.", "coal"),
  // Coelho
  S("coelho", "Coelho da Neve", "mobs/snowrabbit", "gelo", "comum", "suporte", 1, [30, 6, 5, 14], "Pulinhos que inspiram coragem.", "carrot"),
  // Fantasmas e espíritos
  S("fantasma", "Fantasminha", "mobs/ghost", "sombra", "incomum", "suporte", 1, [32, 8, 5, 12], "Assusta inimigos e anima você.", "moonflower", [{ to: "espectro", level: 20, time: "noite", bond: 60, label: "Nv 20 · noite · laço 60" }]),
  S("espectro", "Espectro", "mobs/spectre", "sombra", "epico", "suporte", 2, [55, 15, 9, 14], "Um eco do Silêncio, domado.", "moonflower"),
  S("olho", "Olho Vigia", "mobs/eye", "luz", "raro", "suporte", 1, [36, 10, 6, 11], "Vê pontos fracos nos inimigos.", "mana_shard"),
  // Golens
  S("golem", "Golenzinho", "mobs/golem", "terra", "incomum", "tanque", 1, [60, 8, 14, 4], "Pedra que caminha ao seu lado.", "stone",
    [{ to: "golem_ouro", level: 20, item: "evo_stone", label: "Nv 20 · Pedra da Evolução" }, { to: "golem_gelo", level: 20, biome: ["mountain", "tundra", "glacier"], label: "Nv 20 · terras geladas" }]),
  S("golem_ouro", "Golem Dourado", "mobs/goldgolem", "luz", "epico", "coletor", 2, [90, 12, 20, 4], "Feito de pura fortuna.", "stone"),
  S("golem_gelo", "Golem de Gelo", "mobs/icegolem", "gelo", "epico", "tanque", 2, [100, 11, 22, 4], "Muralha viva de gelo.", "frost_herb"),
  // Diversos
  S("mimico", "Mímico", "mobs/mimic", "sombra", "epico", "coletor", 1, [55, 13, 12, 7], "Parece um baú. Morde como um lobo.", "pet_feast"),
  S("naja", "Naja", "mobs/cobra", "natureza", "incomum", "atacante", 1, [34, 11, 5, 12], "Bote rápido e venenoso.", "pet_treat", [{ to: "serpente", level: 16, label: "Nv 16" }]),
  S("serpente", "Serpente Antiga", "mobs/snek", "sombra", "raro", "atacante", 2, [52, 16, 8, 13], "Sabe segredos esquecidos.", "pet_treat"),
  S("lula", "Lulinha", "mobs/squid", "agua", "incomum", "curandeiro", 1, [36, 7, 6, 10], "Tinta que fecha feridas.", "goo"),
];
export const SPECIES_BY_ID: Record<string, Species> = Object.fromEntries(SPECIES.map((s) => [s.id, s]));
/** Espécies que nascem de ovos (primeiro estágio). */
export const BASE_SPECIES = SPECIES.filter((s) => s.stage === 1);

export interface Nature { id: string; name: string; up?: StatKey; down?: StatKey }
export const NATURES: Nature[] = [
  { id: "calma", name: "Calma" }, { id: "brava", name: "Brava", up: "atk", down: "def" }, { id: "timida", name: "Tímida", up: "spd", down: "atk" },
  { id: "teimosa", name: "Teimosa", up: "def", down: "spd" }, { id: "gulosa", name: "Gulosa", up: "hp", down: "spd" }, { id: "agil", name: "Ágil", up: "spd", down: "hp" },
  { id: "nobre", name: "Nobre", up: "hp", down: "atk" }, { id: "feroz", name: "Feroz", up: "atk", down: "hp" },
];

export interface PetSkill { id: string; name: string; element: Element | "any"; level: number; kind: "golpe" | "area" | "cura" | "lentidao" | "escudo"; power: number; cd: number; desc: string }
export const PET_SKILLS: PetSkill[] = [
  { id: "mordida", name: "Mordida", element: "any", level: 1, kind: "golpe", power: 1, cd: 1.4, desc: "Ataque básico." },
  { id: "brasa", name: "Brasa", element: "fogo", level: 5, kind: "golpe", power: 1.6, cd: 3, desc: "Chama concentrada." },
  { id: "erupcao", name: "Erupção", element: "fogo", level: 18, kind: "area", power: 1.4, cd: 8, desc: "Fogo em volta do pet." },
  { id: "jato", name: "Jato d'Água", element: "agua", level: 5, kind: "golpe", power: 1.5, cd: 3, desc: "Água sob pressão." },
  { id: "mare", name: "Maré Curativa", element: "agua", level: 15, kind: "cura", power: 0.12, cd: 12, desc: "Cura 12% do seu HP." },
  { id: "pedregulho", name: "Pedregulho", element: "terra", level: 5, kind: "golpe", power: 1.7, cd: 3.5, desc: "Rocha arremessada." },
  { id: "muralha", name: "Muralha", element: "terra", level: 15, kind: "escudo", power: 0.25, cd: 14, desc: "Reduz 25% do dano por 5 s." },
  { id: "rajada", name: "Rajada", element: "ar", level: 5, kind: "golpe", power: 1.4, cd: 2.4, desc: "Corte de vento." },
  { id: "ciclone", name: "Ciclone", element: "ar", level: 18, kind: "area", power: 1.3, cd: 8, desc: "Turbilhão em volta." },
  { id: "raio_luz", name: "Raio de Luz", element: "luz", level: 5, kind: "golpe", power: 1.5, cd: 3, desc: "Feixe sagrado." },
  { id: "bencao", name: "Bênção", element: "luz", level: 12, kind: "cura", power: 0.15, cd: 12, desc: "Cura 15% do seu HP." },
  { id: "garra_sombra", name: "Garra Sombria", element: "sombra", level: 5, kind: "golpe", power: 1.7, cd: 3, desc: "Golpe das sombras." },
  { id: "pavor", name: "Pavor", element: "sombra", level: 15, kind: "lentidao", power: 2.5, cd: 10, desc: "Inimigos próximos ficam lentos." },
  { id: "chicote", name: "Chicote de Vinha", element: "natureza", level: 5, kind: "golpe", power: 1.5, cd: 3, desc: "Vinha que estala." },
  { id: "polen", name: "Pólen Curativo", element: "natureza", level: 12, kind: "cura", power: 0.1, cd: 9, desc: "Cura 10% do seu HP." },
  { id: "estilhaco", name: "Estilhaço", element: "gelo", level: 5, kind: "golpe", power: 1.5, cd: 3, desc: "Lasca de gelo." },
  { id: "nevasca", name: "Nevasca", element: "gelo", level: 18, kind: "lentidao", power: 3, cd: 10, desc: "Congela os arredores." },
  { id: "furia", name: "Fúria Ancestral", element: "any", level: 30, kind: "area", power: 2.2, cd: 14, desc: "Golpe devastador dos pets veteranos." },
];
export const skillsFor = (sp: Species, level: number) => PET_SKILLS.filter((k) => (k.element === "any" || k.element === sp.element) && level >= k.level);

export interface Pet {
  uid: string; species: string; nick: string; level: number; xp: number; bond: number; hunger: number;
  nature: string; genes: PetStats; shiny: boolean; gen: number; born: number; breedCd: number; kills: number;
}
export interface Egg { uid: string; species: string; steps: number; need: number; genes: PetStats; shiny: boolean; gen: number; from: string }
export interface PetState {
  pets: Pet[]; team: string[]; active: string | null; eggs: Egg[]; seen: string[]; nextId: number; hatched: number;
}

export const TEAM_MAX = 3, STABLE_MAX = 30, EGG_MAX = 6, MAX_LEVEL = 50;
export const freshPets = (): PetState => ({ pets: [], team: [], active: null, eggs: [], seen: [], nextId: 1, hatched: 0 });

export type Rng = () => number;
const roll = (rng: Rng, n: number) => Math.floor(rng() * n);
export const randomGenes = (rng: Rng): PetStats => ({ hp: roll(rng, 16), atk: roll(rng, 16), def: roll(rng, 16), spd: roll(rng, 16) });
export const geneScore = (g: PetStats) => Math.round(((g.hp + g.atk + g.def + g.spd) / 60) * 100);

export const xpNeed = (level: number) => Math.floor(20 * Math.pow(level, 1.45));
/** Atributos finais: base × raridade × crescimento por nível + genes + natureza (±10%) + bônus de laço (até +10%). */
export function petStats(pet: Pet): PetStats {
  const sp = SPECIES_BY_ID[pet.species]; if (!sp) return { hp: 1, atk: 1, def: 1, spd: 1 };
  const nat = NATURES.find((n) => n.id === pet.nature);
  const rm = RARITY[sp.rarity].mult, bondMul = 1 + Math.min(100, pet.bond) / 1000;
  const out = {} as PetStats;
  for (const k of ["hp", "atk", "def", "spd"] as StatKey[]) {
    const growth = k === "hp" ? 0.09 : 0.06;
    let v = sp.base[k] * rm * (1 + growth * (pet.level - 1)) + pet.genes[k] * (k === "hp" ? 1 : 0.4);
    if (nat?.up === k) v *= 1.1; if (nat?.down === k) v *= 0.9;
    if (pet.shiny) v *= 1.05;
    out[k] = Math.max(1, Math.round(v * bondMul));
  }
  return out;
}
export const power = (pet: Pet) => { const s = petStats(pet); return Math.round(s.hp / 4 + s.atk * 2 + s.def * 1.5 + s.spd); };

export const mood = (pet: Pet) => pet.hunger <= 0 ? "Faminto" : pet.hunger < 25 ? "Com fome" : pet.bond >= 80 ? "Devoto" : pet.bond >= 50 ? "Feliz" : pet.bond >= 20 ? "Amigável" : "Desconfiado";
/** Um pet faminto não luta; com fome luta pela metade. */
export const fightMult = (pet: Pet) => pet.hunger <= 0 ? 0 : pet.hunger < 25 ? 0.5 : 1 + Math.min(100, pet.bond) / 400;

export function makePet(st: PetState, species: string, rng: Rng, o: Partial<Pick<Pet, "genes" | "shiny" | "gen" | "level">> = {}): Pet {
  const sp = SPECIES_BY_ID[species];
  const pet: Pet = {
    uid: `pet${st.nextId++}`, species, nick: sp?.name ?? species, level: o.level ?? 1, xp: 0, bond: 10, hunger: 80,
    nature: NATURES[roll(rng, NATURES.length)].id, genes: o.genes ?? randomGenes(rng), shiny: o.shiny ?? rng() < 1 / 64,
    gen: o.gen ?? 1, born: Date.now(), breedCd: 0, kills: 0,
  };
  return pet;
}
export function markSeen(st: PetState, species: string) { if (!st.seen.includes(species)) st.seen.push(species); }

/** Adiciona ao estábulo; entra na equipe se houver espaço. Retorna false se o estábulo estiver cheio. */
export function adopt(st: PetState, pet: Pet): boolean {
  if (st.pets.length >= STABLE_MAX) return false;
  st.pets.push(pet); markSeen(st, pet.species);
  if (st.team.length < TEAM_MAX) st.team.push(pet.uid);
  if (!st.active) st.active = pet.uid;
  return true;
}
export const petById = (st: PetState, uid: string | null) => (uid ? st.pets.find((p) => p.uid === uid) : undefined);

export function toggleTeam(st: PetState, uid: string): string {
  if (st.team.includes(uid)) {
    st.team = st.team.filter((u) => u !== uid);
    if (st.active === uid) st.active = st.team[0] ?? null;
    return "Saiu da equipe.";
  }
  if (st.team.length >= TEAM_MAX) return `A equipe já tem ${TEAM_MAX} pets.`;
  st.team.push(uid); if (!st.active) st.active = uid; return "Entrou na equipe.";
}
export function setActive(st: PetState, uid: string) { if (!st.team.includes(uid)) toggleTeam(st, uid); if (st.team.includes(uid)) st.active = uid; }
export function release(st: PetState, uid: string) {
  st.pets = st.pets.filter((p) => p.uid !== uid); st.team = st.team.filter((u) => u !== uid);
  if (st.active === uid) st.active = st.team[0] ?? null;
}

/** Ganha XP; retorna quantos níveis subiu. */
export function gainPetXp(pet: Pet, n: number): number {
  let ups = 0; pet.xp += Math.max(0, Math.round(n));
  while (pet.level < MAX_LEVEL && pet.xp >= xpNeed(pet.level)) { pet.xp -= xpNeed(pet.level); pet.level++; ups++; }
  if (pet.level >= MAX_LEVEL) pet.xp = 0;
  return ups;
}

export interface FoodDef { hunger: number; bond: number; xp: number }
export const FOODS: Record<string, FoodDef> = {
  pet_treat: { hunger: 25, bond: 4, xp: 0 }, pet_feast: { hunger: 100, bond: 12, xp: 60 },
  carrot: { hunger: 15, bond: 1, xp: 0 }, wheat: { hunger: 12, bond: 1, xp: 0 }, moonflower: { hunger: 18, bond: 2, xp: 5 },
  goo: { hunger: 8, bond: 1, xp: 0 }, frost_herb: { hunger: 10, bond: 1, xp: 0 }, coal: { hunger: 6, bond: 1, xp: 0 },
  stone: { hunger: 6, bond: 1, xp: 0 }, mana_shard: { hunger: 10, bond: 3, xp: 15 }, herb: { hunger: 10, bond: 1, xp: 0 },
};
/** Alimenta: comida favorita dá o dobro de laço. Retorna a mensagem ou null se não for comida. */
export function feed(pet: Pet, item: string): string | null {
  const f = FOODS[item]; if (!f) return null;
  const sp = SPECIES_BY_ID[pet.species]; const fav = sp?.favorite === item;
  pet.hunger = Math.min(100, pet.hunger + f.hunger);
  pet.bond = Math.min(100, pet.bond + f.bond * (fav ? 2 : 1));
  if (f.xp) gainPetXp(pet, f.xp);
  return fav ? `${pet.nick} adorou! É a comida favorita.` : `${pet.nick} comeu.`;
}

export interface EvoCtx { time: "dia" | "noite"; biome: string; has: (item: string) => boolean }
export function evoReady(pet: Pet, r: EvoRule, ctx: EvoCtx) {
  return pet.level >= r.level && pet.bond >= (r.bond ?? 0) && (!r.time || r.time === ctx.time) && (!r.biome || r.biome.includes(ctx.biome)) && (!r.item || ctx.has(r.item));
}
export const availableEvos = (pet: Pet, ctx: EvoCtx) => (SPECIES_BY_ID[pet.species]?.evolves ?? []).filter((r) => evoReady(pet, r, ctx));
/** Evolui (o apelido é mantido se o jogador o mudou). Retorna a regra usada. */
export function evolve(st: PetState, pet: Pet, to: string, ctx: EvoCtx): EvoRule | null {
  const r = (SPECIES_BY_ID[pet.species]?.evolves ?? []).find((x) => x.to === to);
  if (!r || !evoReady(pet, r, ctx) || !SPECIES_BY_ID[to]) return null;
  const renamed = pet.nick !== SPECIES_BY_ID[pet.species]?.name;
  pet.species = to; if (!renamed) pet.nick = SPECIES_BY_ID[to].name;
  pet.bond = Math.min(100, pet.bond + 5); markSeen(st, to);
  return r;
}

/** Raiz da linha evolutiva (para ovos de cruzamento). */
export function rootOf(species: string): string {
  let cur = species;
  for (let guard = 0; guard < 5; guard++) { const parent = SPECIES.find((s) => s.evolves?.some((e) => e.to === cur)); if (!parent) break; cur = parent.id; }
  return cur;
}
export const BREED_LEVEL = 10, BREED_BOND = 40, BREED_COOLDOWN = 600;
export function canBreed(a: Pet, b: Pet): string | null {
  if (a.uid === b.uid) return "Escolha dois pets diferentes.";
  if (a.level < BREED_LEVEL || b.level < BREED_LEVEL) return `Os dois precisam do nível ${BREED_LEVEL}.`;
  if (a.bond < BREED_BOND || b.bond < BREED_BOND) return `Os dois precisam de laço ${BREED_BOND}.`;
  if (a.breedCd > 0 || b.breedCd > 0) return "Um deles ainda está descansando do último ninho.";
  if (a.hunger < 30 || b.hunger < 30) return "Alimente os dois antes.";
  return null;
}
/**
 * Cruzamento: o ovo é da linha de um dos pais (o de maior laço tem mais chance), genes herdam
 * o melhor ou a média de cada atributo com mutação ±2, e brilho tem chance maior se um dos pais brilha.
 */
export function breed(st: PetState, a: Pet, b: Pet, rng: Rng): Egg | string {
  const why = canBreed(a, b); if (why) return why;
  if (st.eggs.length >= EGG_MAX) return "O ninho já tem ovos demais.";
  const pa = a.bond / (a.bond + b.bond);
  const parent = rng() < pa ? a : b;
  const genes = {} as PetStats;
  for (const k of ["hp", "atk", "def", "spd"] as StatKey[]) {
    const base = rng() < 0.5 ? Math.max(a.genes[k], b.genes[k]) : Math.round((a.genes[k] + b.genes[k]) / 2);
    genes[k] = Math.max(0, Math.min(15, base + roll(rng, 5) - 2));
  }
  const shiny = rng() < ((a.shiny || b.shiny) ? 1 / 8 : 1 / 64);
  a.breedCd = b.breedCd = BREED_COOLDOWN; a.hunger -= 20; b.hunger -= 20;
  const sp = rootOf(parent.species);
  const egg: Egg = { uid: `egg${st.nextId++}`, species: sp, steps: 0, need: eggSteps(SPECIES_BY_ID[sp]?.rarity ?? "comum"), genes, shiny, gen: Math.max(a.gen, b.gen) + 1, from: `${a.nick} × ${b.nick}` };
  st.eggs.push(egg);
  return egg;
}
export const eggSteps = (r: Rarity) => ({ comum: 300, incomum: 500, raro: 800, epico: 1200, lendario: 1800 })[r];

/** Elemento natural de cada bioma, para sortear ovos achados em batalha. */
export function biomeElements(biome: string): Element[] {
  if (/volcan|lava|ember|ash/.test(biome)) return ["fogo", "terra"];
  if (/coast|sea|reef|lake|swamp|mangrove/.test(biome)) return ["agua", "natureza"];
  if (/mountain|tundra|glacier|snow|ice|frost/.test(biome)) return ["gelo", "ar"];
  if (/desert|dune|canyon|mesa/.test(biome)) return ["terra", "fogo"];
  if (/cave|ruins|abyss|crypt|shadow|haunt/.test(biome)) return ["sombra", "terra"];
  if (/forest|jungle|meadow|autumn|grove|mushroom/.test(biome)) return ["natureza", "ar"];
  if (/crystal|sky|cloud|holy|temple/.test(biome)) return ["luz", "ar"];
  return ["natureza", "luz", "terra"];
}
/** Sorteia a espécie de um ovo selvagem conforme o bioma e a raridade. */
export function rollWildSpecies(biome: string, rng: Rng): string {
  const els = biomeElements(biome);
  const pool = BASE_SPECIES.map((s) => ({ s, w: RARITY[s.rarity].weight * (els.includes(s.element) ? 3 : 1) }));
  let t = rng() * pool.reduce((a, x) => a + x.w, 0);
  for (const x of pool) { t -= x.w; if (t <= 0) return x.s.id; }
  return pool[0].s.id;
}
export const EGG_CHANCE = 0.035;
export function wildEgg(st: PetState, biome: string, rng: Rng): Egg | null {
  if (st.eggs.length >= EGG_MAX) return null;
  const sp = rollWildSpecies(biome, rng);
  const egg: Egg = { uid: `egg${st.nextId++}`, species: sp, steps: 0, need: eggSteps(SPECIES_BY_ID[sp].rarity), genes: randomGenes(rng), shiny: rng() < 1 / 64, gen: 1, from: "Encontrado em batalha" };
  st.eggs.push(egg);
  return egg;
}
/** Avança passos de chocagem (o primeiro ovo da fila recebe; com pet coletor, +25%). Retorna ovos prontos. */
export function walkEggs(st: PetState, steps: number): Egg[] {
  const ready: Egg[] = [];
  for (const e of st.eggs) { e.steps = Math.min(e.need, e.steps + steps); if (e.steps >= e.need) ready.push(e); }
  return ready;
}
export function hatch(st: PetState, egg: Egg, rng: Rng): Pet | string {
  if (egg.steps < egg.need) return "O ovo ainda não está pronto.";
  if (st.pets.length >= STABLE_MAX) return "O estábulo está cheio.";
  st.eggs = st.eggs.filter((e) => e.uid !== egg.uid);
  const pet = makePet(st, egg.species, rng, { genes: egg.genes, shiny: egg.shiny, gen: egg.gen });
  adopt(st, pet); st.hatched++;
  return pet;
}

/** Elemento vantajoso causa +50% de dano. */
export const elementMult = (atk: Element, def: Element | undefined) => (def && ELEMENTS[atk].strong.includes(def) ? 1.5 : 1);

export function sanitizePets(raw: unknown): PetState {
  const st = freshPets(); if (!raw || typeof raw !== "object") return st;
  const r = raw as Partial<PetState>;
  st.pets = (Array.isArray(r.pets) ? r.pets : []).filter((p) => p && SPECIES_BY_ID[p.species]).slice(0, STABLE_MAX)
    .map((p) => ({ ...p, level: Math.max(1, Math.min(MAX_LEVEL, p.level | 0)), bond: Math.max(0, Math.min(100, p.bond)), hunger: Math.max(0, Math.min(100, p.hunger)), breedCd: Math.max(0, p.breedCd || 0), kills: p.kills | 0 }));
  const ids = new Set(st.pets.map((p) => p.uid));
  st.team = (Array.isArray(r.team) ? r.team : []).filter((u) => ids.has(u)).slice(0, TEAM_MAX);
  st.active = r.active && st.team.includes(r.active) ? r.active : st.team[0] ?? null;
  st.eggs = (Array.isArray(r.eggs) ? r.eggs : []).filter((e) => e && SPECIES_BY_ID[e.species]).slice(0, EGG_MAX);
  st.seen = (Array.isArray(r.seen) ? r.seen : []).filter((s) => SPECIES_BY_ID[s]);
  st.nextId = Math.max(Number(r.nextId) || 1, st.pets.length + st.eggs.length + 1);
  st.hatched = Number(r.hatched) || 0;
  return st;
}
