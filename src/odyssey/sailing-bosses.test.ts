import { describe, expect, it, vi } from "vitest";
import { Game } from "./engine";
import { ISLANDS } from "./archipelago";
import { ISLAND_BOSS_RESPAWN_SECONDS, islandBossState, islandOnKill } from "./sailing";
import { bossHp } from "./boss-tuning";
import { TS } from "./world";

function fakeCtx(canvas: unknown) {
  const store: Record<string | symbol, unknown> = { canvas };
  const noop = () => undefined;
  return new Proxy(store, {
    get: (t, k) => k in t ? t[k] : k === "createRadialGradient" || k === "createLinearGradient" ? () => ({ addColorStop: noop }) : k === "measureText" ? () => ({ width: 8 }) : k === "getImageData" || k === "createImageData" ? (_x: number, _y: number, w = 1, h = 1) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h }) : noop,
    set: (t, k, v) => { t[k] = v; return true; },
  });
}
vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(function (this: HTMLCanvasElement) { return fakeCtx(this) as never; });

function makeGame() {
  localStorage.clear();
  const canvas = document.createElement("canvas"); canvas.width = 480; canvas.height = 270;
  const game = new Game(canvas); game.started = true;
  return game;
}

describe("chefes do arquipélago", () => {
  it("reduz a vida dos bosses a um terço e mantém o mesmo HP no gêmeo", () => {
    const game = makeGame();
    const island = ISLANDS[0]!;
    const boss = game.makeEnemy(island.boss.kind, 30 * TS + 8, 30 * TS + 8, 4);
    const originalBaseHp = boss.maxhp * island.boss.hp;
    const originalBossHp = bossHp(originalBaseHp);
    const baseHp = originalBaseHp / 3;
    boss.maxhp = boss.hp = bossHp(baseHp);
    boss.atk = Math.round(boss.atk * 1.5);
    boss.boss = islandBossState(island, boss, baseHp);
    game.enemies = [boss];
    game.island = {
      def: island, ox: 0, oy: 0, span: 0, bossId: boss.id, bossIds: [boss.id],
      seaPos: { x: 0, y: 0, a: 0 }, center: { x: 0, y: 0 }, tick: 0, parts: [],
    };

    expect(boss.boss.phase).toBe(1);
    expect(boss.boss.def.id).toBe(`isle_${island.id}_boss`);
    expect(boss.maxhp).toBe(bossHp(baseHp));
    expect(Math.abs(boss.maxhp * 3 - originalBossHp)).toBeLessThanOrEqual(2);

    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0.01);
    game.activateBoss(boss);
    const twin = game.enemies.find((enemy) => enemy !== boss && enemy.boss?.twinKey === boss.boss?.twinKey);
    expect(twin).toBeDefined();
    expect(twin!.maxhp).toBe(boss.maxhp);
    expect(twin!.boss?.phase).toBe(1);
    expect(game.island.bossIds).toContain(twin!.id);
    randomSpy.mockRestore();
  });

  it("só conclui a missão e entrega o drop depois que o último gêmeo cai", () => {
    const game = makeGame();
    const island = ISLANDS[0]!;
    const boss = game.makeEnemy(island.boss.kind, 30 * TS + 8, 30 * TS + 8, 4);
    const twin = game.makeEnemy(island.boss.kind, 32 * TS + 8, 30 * TS + 8, 4);
    game.enemies = [boss, twin];
    game.island = {
      def: island, ox: 0, oy: 0, span: 0, bossId: boss.id, bossIds: [boss.id, twin.id],
      seaPos: { x: 0, y: 0, a: 0 }, center: { x: 0, y: 0 }, tick: 0, parts: [],
    };

    boss.alive = false;
    islandOnKill(game, boss);
    expect(game.island.bossId).toBe(boss.id);
    expect(game.count(island.boss.drop)).toBe(0);

    twin.alive = false;
    islandOnKill(game, twin);
    expect(game.island.bossId).toBe(-1);
    expect(game.count(island.boss.drop)).toBe(island.boss.dropQty);
    islandOnKill(game, twin);
    expect(game.count(island.boss.drop)).toBe(island.boss.dropQty);
  });

  it("respawna o boss da ilha depois de 45 segundos fora do alcance e reinicia a fase", () => {
    const game = makeGame();
    const island = ISLANDS[0]!;
    const boss = game.makeEnemy(island.boss.kind, 30 * TS + 8, 30 * TS + 8, 4);
    const baseHp = boss.maxhp * island.boss.hp / 3;
    boss.maxhp = boss.hp = bossHp(baseHp);
    boss.boss = islandBossState(island, boss, baseHp);
    game.enemies = [boss];
    game.island = {
      def: island, ox: 0, oy: 0, span: 0, bossId: boss.id, bossIds: [boss.id],
      seaPos: { x: 0, y: 0, a: 0 }, center: { x: 0, y: 0 }, tick: 0, parts: [],
    };
    game.p.x = boss.x + 400; game.p.y = boss.y;

    const noTwin = vi.spyOn(Math, "random").mockReturnValue(0.99);
    try { game.activateBoss(boss); } finally { noTwin.mockRestore(); }
    boss.boss!.phase = 5;
    game.killEnemy(boss);
    expect(boss.alive).toBe(false);
    expect(boss.respawn).toBe(ISLAND_BOSS_RESPAWN_SECONDS);

    game.updateEnemies(ISLAND_BOSS_RESPAWN_SECONDS + 1);
    expect(boss.alive).toBe(true);
    expect(boss.hp).toBe(boss.maxhp);
    expect(boss.boss?.active).toBe(false);
    expect(boss.boss?.phase).toBe(1);
    expect(game.island.bossId).toBe(boss.id);
    expect(game.island.bossIds).toEqual([boss.id]);
  });
});
