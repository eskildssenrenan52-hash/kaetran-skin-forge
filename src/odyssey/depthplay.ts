// Liga o Abismo do Cântico e os Templos Profundos ao motor (entrada, escadas, chefes, luz e salvamento).
import type { Game, Enemy } from './engine';
import { BEASTS, pickBeast } from './bestiary';
import { ABYSS_DOOR, ABYSS_ENTRY, ABYSS_FLOORS, ABYSS_BOSS_LOOK, FINAL_BOSS, GUARDIANS, checkpoints, generateFloor, isGuardianFloor, type DungeonFloor, type Theme } from './dungeon';
import { TEMPLES, templeDoor, templeFootprint, generateTempleFloor, drawTemple, drawAbyssGate, drawStairs, drawWallTorch, type Temple, type StairStyle } from './depths';
import { QUESTS, type BossDef, type NpcDef } from './data';
import { T, TS, W, H, type World } from './world';
import { cycleBonus } from './story';
import { drawTreasure } from './scenery';
import { propAction, propLights } from './depth-props';
import { secretSurfaceAction, secretDepthAction, secretLights, realmFloor, realmTemple, isRealm, realmDefOf } from './secret-play';
import type { RealmDef } from './secrets';
import { ITEMS } from './data';
import { ALL_REALMS } from './secrets';
import { sagaDepthAction, sagaSurfaceAction, drawSagaStairs, sagaLights, sagaDarkness, setSagaLeave } from './saga-play';
import { bossHp } from './boss-tuning';
import {
  CITADEL_DOOR, CITADEL_ENTRY, CITADEL_FLOORS, CITADEL_BOSS_LOOK, CITADEL_FINAL_BOSS_ID,
  citadelBest, citadelBoss, citadelCheckpoints, citadelFloorLevel, citadelGuardianIntro, citadelTheme,
  citadelTemple, citadelUnlocked, drawCitadelGate, drawCitadelThrone, generateCitadelFloor,
  recordCitadelBest, carveCitadelSite,
} from './demon-citadel';

for (const [i, r] of ALL_REALMS.entries()) ITEMS[r.relic] ??= { id: r.relic, name: r.relicName, type: 'amulet', bonus: { str: 4 + i * 2, int: 4 + i * 2, vit: 3 + i * 2, hp: 60 + i * 40, mp: 30 + i * 20 }, desc: `Relíquia oculta do ${r.name}.`, color: r.color, price: 2000 + i * 1500 };

export interface DepthState { kind: 'abyss' | 'temple' | 'tutorial'; profile?: 'citadel'; floor: number; temple?: Temple; data: DungeonFloor; stair: StairStyle }

export const ABYSS_KEEPER: NpcDef = { id: 'abyss_keeper', name: 'Guardião do Abismo', title: 'Vigia dos Cem Andares', tx: ABYSS_DOOR.tx, ty: ABYSS_DOOR.ty, pal: { skin: '#d8c8b8', hair: '#3a2a5a', body: '#2a1a40', legs: '#120a20', accent: '#c78bff' }, lines: [] };
export const CITADEL_KEEPER: NpcDef = { id: 'citadel_keeper', name: 'Sentinela de Gehenna', title: 'Guardiã da Estrada ao Trono', tx: CITADEL_DOOR.tx, ty: CITADEL_DOOR.ty, pal: { skin: '#b8a0a0', hair: '#201020', body: '#7a2028', legs: '#301018', accent: '#ff7050' }, lines: [] };
const ABYSS_STAIRS: StairStyle[] = ['roots', 'fungal', 'marble', 'coral', 'sand', 'frost', 'lava', 'spiral', 'crystal', 'bones'];

/** Tutorial inicial: uma rota curta que ensina os controles sem misturar o progresso do Abismo. */
export const TUTORIAL_BOSS_ID = 'tutorial_gatekeeper';
export const TUTORIAL_BOSS_LOOK: Record<string, { kind: 'golem'; tint: string; scale: number }> = { [TUTORIAL_BOSS_ID]: { kind: 'golem', tint: '#7ed6ff', scale: 2.35 } };
const TUTORIAL_THEME: Theme = {
  name: 'Cripta do Primeiro Eco', floor: T.CAVE, wall: T.CWALL, deco: T.CRYSTAL, biome: 'cave',
  enemies: ['goblin', 'mushroom', 'sporeling'], color: '#7ed6ff', lore: 'Uma pequena cripta onde os primeiros passos viram memória.',
};

export function tutorialBoss(tx: number, ty: number): BossDef {
  return { id: TUTORIAL_BOSS_ID, name: 'Guardião do Primeiro Eco', biome: 'cave', tx, ty, hp: 650, atk: 13, xp: 360, gold: 120, color: '#7ed6ff', minion: 'goblin', reward: ['hi_potion', 'ether'] };
}

export function tutorialFloorData(floor: number): DungeonFloor {
  const data = generateFloor(floor, { theme: TUTORIAL_THEME, seed: 9317 + floor * 177, size: { w: 36, h: 27 }, level: Math.max(1, floor), idPrefix: `tutorial-${floor}`, eliteBonus: 0 });
  const count = floor === 1 ? 4 : floor === 2 ? 6 : 4;
  data.spawns = data.spawns.slice(0, count).map((s) => ({ ...s, level: Math.max(1, Math.min(3, s.level)), elite: false }));
  if (floor === 3) data.boss = tutorialBoss(data.stairs.tx, data.stairs.ty - 2);
  return data;
}

/** Esculpe as entradas no mapa de superfície: o Portão do Abismo em Potos e um templo por bioma. */
export function carveEntrances(world: World) {
  const set = (x: number, y: number, t: number) => { if (x > 0 && y > 0 && x < W && y < H) world.tiles[y * W + x] = t; };
  for (let y = ABYSS_ENTRY.y; y < ABYSS_ENTRY.y + ABYSS_ENTRY.h; y++) for (let x = ABYSS_ENTRY.x; x < ABYSS_ENTRY.x + ABYSS_ENTRY.w; x++) set(x, y, T.PILLAR);
  set(ABYSS_DOOR.tx, ABYSS_DOOR.ty, T.COBBLE); for (let k = 1; k <= 2; k++) set(ABYSS_DOOR.tx, ABYSS_DOOR.ty + k, T.COBBLE);
  for (const t of TEMPLES) {
    for (let y = -5; y <= 6; y++) for (let x = -5; x <= 5; x++) { const tx = t.tx + x, ty = t.ty + y; if (tx > 0 && ty > 0 && tx < W && ty < H && [T.WATER, T.LAVA, T.TREE, T.PINE, T.DTREE, T.ROCK, T.CWALL, T.CRYSTAL, T.CACTUS, T.PALM, T.AUTUMN_TREE, T.MUSHROOM].includes(world.tiles[ty * W + tx] as 3)) set(tx, ty, T.PATH); }
    for (const [x, y] of templeFootprint(t)) set(x, y, T.PILLAR);
    const d = templeDoor(t); for (let k = 0; k <= 2; k++) set(d.tx, d.ty + k, T.PATH);
    world.nodes = world.nodes.filter((n) => Math.abs(n.tx - t.tx) > 5 || Math.abs(n.ty - t.ty) > 6);
  }
  carveCitadelSite(world);
  world.nodes = world.nodes.filter((n) => n.tx < CITADEL_ENTRY.tx - 3 || n.tx > CITADEL_ENTRY.tx + CITADEL_ENTRY.w + 3 || n.ty < CITADEL_ENTRY.ty - 8 || n.ty > CITADEL_ENTRY.ty + CITADEL_ENTRY.h + 4);
}

export const hasTorch = (g: Game) => g.count('torch') > 0;

function populate(g: Game, d: DungeonFloor, strength: number, abyss = false, citadel = false) {
  const out: Enemy[] = [];
  for (const s of d.spawns) {
    const sp = abyss ? BEASTS[pickBeast(d.floor, Math.random())]! : null;
    const e = g.makeEnemy(sp ? sp.kind : s.kind, s.tx * TS + 8, s.ty * TS + 8, s.level + cycleBonus(g.cycle));
    if (sp) { e.species = sp.id; e.maxhp = Math.round(e.maxhp * sp.hp); e.atk = Math.round(e.atk * sp.atk); e.speed = Math.round(e.speed * sp.speed); }
    e.hp = e.maxhp = Math.round(e.maxhp * strength * (s.elite ? 2.2 : 1)); e.atk = Math.round(e.atk * (s.elite ? 1.35 : 1) * (strength > 1 ? 1.12 : 1));
    if (s.elite) { e.elite = true; e.xp = Math.round(e.xp * 2.5); e.gold *= 2; }
    out.push(e);
  }
  if (d.boss && !g.bossesDone.has(d.boss.id)) {
    const b = d.boss, look = CITADEL_BOSS_LOOK[b.id] ?? ABYSS_BOSS_LOOK[b.id] ?? TUTORIAL_BOSS_LOOK[b.id] ?? { kind: b.minion, tint: b.color, scale: 2 };
    const e = g.makeEnemy(look.kind, b.tx * TS + 8, b.ty * TS + 8, 1);
    e.hp = e.maxhp = bossHp(b.hp); e.atk = b.atk; e.def = 6 + Math.floor(d.floor / 3); e.xp = b.xp; e.gold = b.gold; e.speed = 30; e.level = citadel ? citadelFloorLevel(d.floor) : d.floor + 8;
    e.boss = { def: b, active: false, phase: 1, patT: 2, attackIndex: 0, charge: 0, cvx: 0, cvy: 0 };
    out.push(e);
  }
  return out;
}

export function enterDepthState(g: Game, state: DepthState, strength: number) { enter(g, state, strength); }
function enter(g: Game, state: DepthState, strength: number) {
  if (g.interior) g.leaveInterior();
  if (!g.depth) { g.depthReturn = { x: g.p.x, y: g.p.y + 18 }; g.surfaceEnemies = g.enemies; }
  g.depth = state; g.world = state.data.world;
  g.enemies = populate(g, state.data, strength, state.kind === 'abyss', state.profile === 'citadel'); g.activeBoss = null; g.audio.boss = false;
  g.p.x = state.data.start.tx * TS + 8; g.p.y = (state.data.start.ty + 1) * TS + 8;
  g.clearTransition(); g.biome = state.data.theme.biome; g.audio.biome = state.data.theme.biome;
}

export function enterTutorialFloor(g: Game, floor: number) {
  floor = Math.max(1, Math.min(3, floor));
  enter(g, { kind: 'tutorial', floor, data: tutorialFloorData(floor), stair: 'crystal' }, 1);
  g.tutorialActive = true;
  g.tutorialFloor = floor;
  g.p.hp = g.maxHp(); g.p.mp = g.maxMp();
  g.audio.boss = false;
  g.biomeBanner = { name: `Treino de Aventureiro · Andar ${floor}/3`, t: 4 };
  g.toast(floor === 1 ? 'Aprenda a se mover e atacar. A escada só abre quando a sala estiver segura.' : floor === 2 ? 'Use poções, éter e magia. Posicionamento também é defesa.' : 'O Guardião aguarda no terceiro andar. Gaste seus pontos de atributo quando subir de nível.', '#bfefff');
}

export function startTutorial(g: Game) {
  g.tutorialActive = true;
  g.tutorialDone = false;
  g.tutorialModalPending = false;
  g.tutorialModalDone = false;
  g.tutorialFloor = 1;
  enterTutorialFloor(g, 1);
}

export function skipTutorial(g: Game) {
  if (g.depth?.kind === 'tutorial') leaveDepth(g, true);
  g.tutorialActive = false;
  g.tutorialDone = true;
  g.tutorialFloor = 0;
  g.tutorialModalPending = true;
  g.p.hp = g.maxHp(); g.p.mp = g.maxMp();
  g.audio.boss = false;
  g.toast('Treino pulado. O mundo principal está aberto; o guia dos modais aparecerá agora.', '#ffe39a');
  g.save();
}

export function completeTutorial(g: Game) {
  if (g.depth?.kind === 'tutorial') leaveDepth(g, true);
  g.tutorialActive = false;
  g.tutorialDone = true;
  g.tutorialFloor = 0;
  g.tutorialModalPending = true;
  g.p.points = Math.max(g.p.points, 3);
  g.p.hp = g.maxHp(); g.p.mp = g.maxMp();
  g.audio.boss = false;
  g.toast('Treino concluído! Bem-vindo às Terras de Mana.', '#a0ffa0');
  g.save();
}

export function restartTutorialFloor(g: Game) {
  const floor = Math.max(1, Math.min(3, g.tutorialFloor || 1));
  if (g.depth?.kind === 'tutorial') leaveDepth(g, true);
  enterTutorialFloor(g, floor);
}

export function enterAbyss(g: Game, floor: number) {
  floor = Math.max(1, Math.min(ABYSS_FLOORS, floor));
  const data = generateFloor(floor);
  enter(g, { kind: 'abyss', floor, data, stair: ABYSS_STAIRS[Math.floor((floor - 1) / 10)]! }, 1);
  if (floor > g.abyssBest) {
    g.abyssBest = floor;
    for (const q of QUESTS) if (g.questStatus[q.id] === 'active' && q.goal.kind === 'floor' && q.goal.n <= floor) g.toast(`Missão pronta: ${q.title}`, '#a0ffa0');
  }
  g.biomeBanner = { name: `Abismo do Cântico · Andar ${floor} — ${data.theme.name}`, t: 4 };
  if (floor === 1 || (floor - 1) % 10 === 0) g.toast(data.theme.lore, data.theme.color);
  if (isGuardianFloor(floor) && data.boss && !g.bossesDone.has(data.boss.id)) {
    const intro = floor >= ABYSS_FLOORS ? FINAL_BOSS.intro.join(' ') : GUARDIANS[floor]?.intro ?? '';
    g.toast(`⚔ ${data.boss.name}: ${intro}`, '#ff8080');
  }
  g.save();
}

/** Entra num piso da Cidadela usando discoveries, sem tocar no recorde do Abismo ou nos saves antigos. */
export function enterCitadel(g: Game, floor: number) {
  const best = citadelBest(g.discoveries);
  const allowed = floor === 1 || floor <= best || floor === best + 1;
  if (!citadelUnlocked(g.bossesDone)) { g.toast('Os portões só se abrem depois da queda de Azrakel em Gehenna.', '#ff7777'); return; }
  if (!Number.isInteger(floor) || floor < 1 || floor > CITADEL_FLOORS || !allowed) { g.toast('Esse checkpoint ainda não foi alcançado.', '#ffb060'); return; }
  const data = generateCitadelFloor(floor), temple = citadelTemple(floor);
  enter(g, { kind: 'temple', profile: 'citadel', floor, temple, data, stair: 'lava' }, 1.52 + floor * 0.0028);
  recordCitadelBest(g.discoveries, floor); g.discoveries.add('citadel:entered');
  g.biomeBanner = { name: `Cidadela de Gehenna · Andar ${floor}/${CITADEL_FLOORS} · ${data.theme.name}`, t: 5 };
  if (floor === 1 || floor % 10 === 0) g.toast(data.theme.lore, data.theme.color);
  if (data.boss && !g.bossesDone.has(data.boss.id)) g.toast(`⚔ ${data.boss.name}: ${citadelGuardianIntro(floor)}`, '#ff7777');
  g.save();
}

export function openCitadelGate(g: Game) {
  if (!citadelUnlocked(g.bossesDone)) { g.toast('A Cidadela está selada. Conclua a Saga de Gehenna primeiro.', '#ff7777'); return; }
  const best = citadelBest(g.discoveries), floors = new Set(citadelCheckpoints(best).slice(-6));
  if (best > 0 && best % 5 !== 0) floors.add(best);
  if (best < CITADEL_FLOORS) floors.add(best + 1);
  const choices = [...floors].sort((a, b) => a - b).map((floor) => ({
    label: best === 0 && floor === 1 ? 'Começar no andar 1' : floor === best + 1 ? `Continuar no andar ${floor}` : floor === 1 ? 'Começar no andar 1' : floor === best ? `Retomar no andar ${floor}` : `Checkpoint · andar ${floor}`,
    act: () => { g.dialog = null; enterCitadel(g, floor); },
  }));
  choices.push({ label: 'Agora não', act: () => { g.dialog = null; } });
  g.dialog = { npc: CITADEL_KEEPER, text: `Dez alas e cem andares separam você do trono. Recorde da Cidadela: ${best}/100; o caminho é marcado a cada cinco andares.`, choices };
}

export function enterTemple(g: Game, t: Temple) {
  if (!hasTorch(g)) { g.toast('Escuro demais para descer. Você precisa de uma Tocha: compre no Mercador Pip, em Potos, ou faça na Carpintaria (2 madeira + 1 carvão).', '#ff9a60'); g.audio.sfx('ui'); return; }
  enter(g, { kind: 'temple', floor: 2, temple: t, data: generateTempleFloor(t), stair: t.stair }, 1.3);
  g.discoveries.add(t.id);
  g.biomeBanner = { name: `${t.name} · 2º andar · Nv ${t.level}+`, t: 4 };
  g.toast(t.lore, '#e0c890'); g.save();
}

/** Entra num Reino Oculto: um bioma secreto com luz própria, inimigos fortes e uma relíquia. */
export function enterRealm(g: Game, r: RealmDef) {
  const t = realmTemple(r);
  enter(g, { kind: 'temple', floor: 1, temple: t, data: realmFloor(r), stair: 'moon' }, 1.5);
  g.discoveries.add(t.id);
  g.biomeBanner = { name: `✦ ${r.name} · Reino Oculto · Nv ${r.level}+`, t: 5 };
  g.toast(r.lore, r.color); g.save();
}

export function leaveDepth(g: Game, silent = false) {
  if (!g.depth) return;
  g.depth = null; g.world = g.overworld; g.enemies = g.surfaceEnemies; g.surfaceEnemies = [];
  g.activeBoss = null; g.audio.boss = false;
  g.p.x = g.depthReturn.x; g.p.y = g.depthReturn.y;
  if (!silent) { g.clearTransition(); g.toast('De volta à superfície.', '#bfefff'); g.save(); }
}

/** Escolha de andar ao entrar no Portão do Abismo. */
export function openAbyssGate(g: Game) {
  const cps = checkpoints(g.abyssBest);
  const choices = cps.slice(-6).map((f) => ({ label: f === 1 ? 'Descer ao andar 1' : `Recomeçar no andar ${f}`, act: () => { g.dialog = null; enterAbyss(g, f); } }));
  choices.push({ label: 'Agora não', act: () => { g.dialog = null; } });
  g.dialog = { npc: ABYSS_KEEPER, text: `Cem andares de escuridão descem sob Potos. Seu recorde: andar ${g.abyssBest || 0}. A cada cinco andares eu marco o caminho para você recomeçar.`, choices };
}

const near = (g: Game, tx: number, ty: number, r = 22) => Math.hypot(g.p.x - tx * TS - 8, g.p.y - ty * TS - 8) < r;

export function tutorialDepthAction(g: Game, run: boolean): string {
  const d = g.depth;
  if (!d || d.kind !== 'tutorial') return '';
  const data = d.data;
  for (const c of data.chests) if (near(g, c.tx, c.ty)) {
    if (run) g.claimChest(c.id, c.gold, c.item, c.qty, 'Baú do treinamento');
    return g.openedChests.has(c.id) ? 'Baú vazio' : 'E · Abrir baú';
  }
  if (near(g, data.stairs.tx, data.stairs.ty, 22)) {
    const remaining = g.enemies.some((e) => e.alive);
    if (d.floor < 3) {
      if (remaining) { if (run) g.toast('A escada está selada. Derrote todos os inimigos deste andar.', '#ffb060'); return 'Escada selada · derrote os inimigos'; }
      if (run) enterTutorialFloor(g, d.floor + 1);
      return `E · Ir para o andar ${d.floor + 1}`;
    }
    if (!g.bossesDone.has(TUTORIAL_BOSS_ID)) { if (run) g.toast('O Guardião ainda está de pé. Ataque-o e use seus itens quando precisar.', '#ff8080'); return 'Escada selada pelo Guardião'; }
    if (run) completeTutorial(g);
    return 'E · Entrar nas Terras de Mana';
  }
  if (d.floor === 1 && near(g, data.start.tx, data.start.ty, 20)) return 'Treino ativo · use o botão Pular tutorial se quiser sair';
  return '';
}

function citadelDepthAction(g: Game, run: boolean): string {
  const d = g.depth;
  if (!d || d.profile !== 'citadel') return '';
  for (const c of d.data.chests) if (near(g, c.tx, c.ty)) {
    if (run) g.claimChest(c.id, c.gold, c.item, c.qty, 'Baú da Cidadela');
    return g.openedChests.has(c.id) ? 'Baú vazio' : 'E · Abrir baú';
  }
  if (near(g, d.data.start.tx, d.data.start.ty, 20)) {
    if (run) { if (d.floor > 1) enterCitadel(g, d.floor - 1); else leaveDepth(g); }
    return d.floor > 1 ? `E · Subir ao andar ${d.floor - 1}` : 'E · Voltar à superfície';
  }
  if (near(g, d.data.stairs.tx, d.data.stairs.ty, 20)) {
    const boss = d.data.boss, locked = !!boss && !g.bossesDone.has(boss.id);
    if (locked) { if (run) g.toast(`${boss!.name} sela a escada. Derrote-o primeiro.`, '#ff7777'); return 'Escada selada pelo guardião'; }
    if (run) { if (d.floor >= CITADEL_FLOORS) leaveDepth(g); else enterCitadel(g, d.floor + 1); }
    return d.floor >= CITADEL_FLOORS ? 'E · Deixar a Cidadela' : `E · Descer ao andar ${d.floor + 1}`;
  }
  return '';
}

/** Interação dentro das profundezas: escadas, baús e relíquias. Retorna o texto do aviso ou executa. */
export function depthAction(g: Game, run: boolean): string {
  const d = g.depth; if (!d) return '';
  const data = d.data;
  if (d.kind === 'tutorial') return tutorialDepthAction(g, run);
  if (d.profile === 'citadel') return citadelDepthAction(g, run);
  const sg = sagaDepthAction(g, run); if (sg) return sg;
  const sec = secretDepthAction(g, run); if (sec) return sec;
  const prop = propAction(g, run); if (prop) return prop;
  for (const c of data.chests) if (near(g, c.tx, c.ty)) { if (run) g.claimChest(c.id, c.gold, c.item, c.qty, 'Baú das profundezas'); return g.openedChests.has(c.id) ? 'Baú vazio' : 'E · Abrir baú'; }
  if (near(g, data.start.tx, data.start.ty, 20)) {
    if (run) { if (d.kind === 'abyss' && d.floor > 1) enterAbyss(g, d.floor - 1); else leaveDepth(g); }
    return d.kind === 'abyss' && d.floor > 1 ? `E · Subir ao andar ${d.floor - 1}` : 'E · Voltar à superfície';
  }
  if (near(g, data.stairs.tx, data.stairs.ty, 20)) {
    if (d.kind === 'temple') {
      const id = `${d.temple!.id}-relic`;
      const realm = realmDefOf(d.temple);
      if (run) { if (g.openedChests.has(id)) g.toast('O altar já foi honrado.'); else if (realm) g.claimChest(id, 500 + realm.level * 60, realm.relic, 1, `Altar do ${realm.name}`); else g.claimChest(id, 120 + d.temple!.level * 30, 'temple_relic', 1, 'Altar do Templo'); }
      return g.openedChests.has(id) ? 'Altar vazio' : 'E · Tocar o altar';
    }
    if (d.floor >= ABYSS_FLOORS) { if (run) leaveDepth(g); return 'E · Retornar à superfície'; }
    const locked = !!data.boss && !g.bossesDone.has(data.boss.id);
    if (run) { if (locked) g.toast(`${data.boss!.name} sela a escada. Derrote-o primeiro.`, '#ff8080'); else enterAbyss(g, d.floor + 1); }
    return locked ? 'Escada selada pelo guardião' : `E · Descer ao andar ${d.floor + 1}`;
  }
  return '';
}

/** Interação na superfície com as entradas. */
export function surfaceEntrance(g: Game, run: boolean): string {
  if (near(g, CITADEL_DOOR.tx, CITADEL_DOOR.ty, 28)) {
    if (!citadelUnlocked(g.bossesDone)) { if (run) g.toast('A porta reage à Coroa de Gehenna. Derrote Azrakel na Saga para abri-la.', '#ff7777'); return 'Portões selados · complete Gehenna'; }
    if (run) openCitadelGate(g);
    return 'E · Cidadela de Gehenna · 100 andares';
  }
  if (near(g, ABYSS_DOOR.tx, ABYSS_DOOR.ty, 26)) { if (run) openAbyssGate(g); return 'E · Portão do Abismo do Cântico'; }
  for (const t of TEMPLES) { const d = templeDoor(t); if (near(g, d.tx, d.ty, 24)) { if (run) enterTemple(g, t); return `E · ${t.name}${hasTorch(g) ? '' : ' (requer Tocha)'}`; } }
  const sg = sagaSurfaceAction(g, run); if (sg) return sg;
  return secretSurfaceAction(g, run, (r) => enterRealm(g, r));
}

export function drawSurfaceEntrances(g: Game, c: CanvasRenderingContext2D, draws: { y: number; f: () => void }[], x0: number, y0: number, x1: number, y1: number, wt: number) {
  if (CITADEL_ENTRY.tx >= x0 - 20 && CITADEL_ENTRY.tx <= x1 + 20 && CITADEL_ENTRY.ty >= y0 - 12 && CITADEL_ENTRY.ty <= y1 + 20)
    draws.push({ y: (CITADEL_DOOR.ty + 1) * TS, f: () => drawCitadelGate(c, citadelUnlocked(g.bossesDone), wt) });
  if (ABYSS_DOOR.tx >= x0 - 8 && ABYSS_DOOR.tx <= x1 + 8 && ABYSS_DOOR.ty >= y0 - 2 && ABYSS_DOOR.ty <= y1 + 10) draws.push({ y: (ABYSS_DOOR.ty + 1) * TS, f: () => drawAbyssGate(c, ABYSS_DOOR, wt) });
  for (const t of TEMPLES) if (t.tx >= x0 - 8 && t.tx <= x1 + 8 && t.ty >= y0 - 2 && t.ty <= y1 + 10) draws.push({ y: (templeDoor(t).ty + 1) * TS, f: () => drawTemple(c, t, wt) });
  void g;
}

export function drawDepth(g: Game, c: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, wt: number) {
  const d = g.depth; if (!d) return;
  const data = d.data, vis = (x: number, y: number) => x >= x0 - 1 && x <= x1 + 1 && y >= y0 - 1 && y <= y1 + 1;
  if (d.profile === 'citadel') {
    if (d.floor === CITADEL_FLOORS && vis(data.stairs.tx, data.stairs.ty)) drawCitadelThrone(c, data.stairs.tx * TS + 8, data.stairs.ty * TS + 8, 35 * TS, 22 * TS);
    drawStairs(c, d.stair, data.start.tx, data.start.ty, false, wt);
    const locked = !!data.boss && !g.bossesDone.has(data.boss.id);
    drawStairs(c, d.stair, data.stairs.tx, data.stairs.ty, true, wt, locked);
    for (const ch of data.chests) if (vis(ch.tx, ch.ty)) drawTreasure(c, ch.tx * TS + 8, ch.ty * TS + 12, g.openedChests.has(ch.id), wt);
    for (const t of data.torches) if (vis(t.tx, t.ty)) drawWallTorch(c, t.tx, t.ty, wt);
    return;
  }
  if (drawSagaStairs(g, c, wt)) { for (const ch of data.chests) if (vis(ch.tx, ch.ty)) drawTreasure(c, ch.tx * TS + 8, ch.ty * TS + 12, g.openedChests.has(ch.id), wt); for (const t of data.torches) if (vis(t.tx, t.ty)) drawWallTorch(c, t.tx, t.ty, wt); return; }
  drawStairs(c, d.stair, data.start.tx, data.start.ty, false, wt);
  if ((d.kind === 'abyss' && d.floor < ABYSS_FLOORS) || d.kind === 'tutorial') drawStairs(c, d.stair, data.stairs.tx, data.stairs.ty, true, wt, d.kind === 'tutorial' ? g.enemies.some((e) => e.alive) : !!data.boss && !g.bossesDone.has(data.boss.id));
  if ((d.kind === 'temple' && d.profile !== 'citadel') || d.floor >= ABYSS_FLOORS) drawTreasure(c, data.stairs.tx * TS + 8, data.stairs.ty * TS + 12, g.openedChests.has(`${d.temple?.id}-relic`), wt);
  for (const ch of data.chests) if (vis(ch.tx, ch.ty)) drawTreasure(c, ch.tx * TS + 8, ch.ty * TS + 12, g.openedChests.has(ch.id), wt);
  for (const t of data.torches) if (vis(t.tx, t.ty)) drawWallTorch(c, t.tx, t.ty, wt);
}

/** Luzes do andar escuro: a tocha do jogador e as poucas tochas de parede. */
export function depthLights(g: Game, hole: (x: number, y: number, r: number, a?: number) => void, glows: { x: number; y: number; r: number; col: string }[], wt: number) {
  const d = g.depth; if (!d) return;
  const torch = hasTorch(g);
  hole(g.p.x, g.p.y - 8, (torch ? 96 : d.profile === 'citadel' ? 84 : 34) + Math.sin(wt * 9) * 3);
  if (torch) glows.push({ x: g.p.x, y: g.p.y - 10, r: 46, col: 'rgba(255,150,60,0.22)' });
  if (d.profile === 'citadel') glows.push({ x: d.data.stairs.tx * TS + 8, y: d.data.stairs.ty * TS + 8, r: 68, col: 'rgba(255,76,40,0.28)' });
  for (const t of d.data.torches) { hole(t.tx * TS + 8, t.ty * TS + 6, 64 + Math.sin(wt * 7 + t.tx) * 3, 0.95); glows.push({ x: t.tx * TS + 8, y: t.ty * TS + 4, r: 34, col: 'rgba(255,140,50,0.32)' }); }
  hole(d.data.start.tx * TS + 8, d.data.start.ty * TS + 8, 30, 0.6);
  propLights(g, hole, glows, wt);
  secretLights(g, hole); sagaLights(g, hole);
}
export const depthDarkness = (g: Game) => g.depth?.profile === 'citadel' ? 0.42 : sagaDarkness(g) ?? (isRealm(g.depth?.temple) ? 0.72 : g.depth?.kind === 'temple' ? 0.95 : 0.9);

setSagaLeave((g) => leaveDepth(g));
