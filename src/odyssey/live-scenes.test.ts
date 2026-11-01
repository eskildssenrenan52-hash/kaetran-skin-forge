import { describe, expect, it } from "vitest";
import { startGoddess, startBossCard, liveTick } from "./live-scenes";

const fakeGame = () => {
  const g: any = { live: null, bossCard: null, discoveries: new Set<string>(), keys: new Set(), moveTarget: null, shake: 0,
    audio: { sfx() {} }, p: { x: 0, y: 0, hp: 1, mp: 1 }, maxHp: () => 100, maxMp: () => 50,
    buffs: { might: 0, shield: 0, regen: 0, luck: 0 }, burst() {}, save() {} };
  return g;
};

describe("cenas ao vivo", () => {
  it("a bênção da Deusa cura tudo e dura 3 minutos", () => {
    const g = fakeGame();
    startGoddess(g, { id: "first_island", name: "Lyria", color: "#fff", lines: [] });
    for (let i = 0; i < 300 && g.live; i++) liveTick(g, 0.1);
    expect(g.live).toBeNull();
    expect(g.p.hp).toBe(100);
    expect(g.buffs).toEqual({ might: 180, shield: 180, regen: 180, luck: 180 });
  });
  it("a Deusa só aparece uma vez", () => {
    const g = fakeGame(); g.discoveries.add("blessing:first_island");
    startGoddess(g, { id: "first_island", name: "Lyria", color: "#fff", lines: [] });
    expect(g.live).toBeNull();
  });
  it("tela de chefe termina e segue para a cena do chefe", () => {
    const g = fakeGame(); let after = false;
    startBossCard(g, { id: "ent", name: "Ent", kind: "sporeling" as any, tint: "#0f0", scale: 2, after: () => { after = true; } });
    for (let i = 0; i < 100 && g.bossCard; i++) liveTick(g, 0.1);
    expect(after).toBe(true);
  });
});
