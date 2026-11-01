import { describe, expect, it } from "vitest";
import { adopt, makePet, freshPets, feed, breed, hatch, walkEggs, wildEgg, evolve, toggleTeam, setActive, sanitizePets } from "./pets";
import { HERO_SKINS, skinUnlocked } from "./hero-sprite";
const rng = () => 0.5;
describe("Pet progression and imported skins", () => {
  it("keeps starter adoption active and compatible with save reload", () => {
    const st = freshPets(); const p = makePet(st, "rato", rng); adopt(st,p);
    const loaded = sanitizePets(JSON.parse(JSON.stringify(st)));
    expect(loaded.active).toBe(p.uid); expect(loaded.team).toEqual([p.uid]);
  });
  it("consumes favorite feeding benefits and clamps hunger", () => {
    const p = makePet(freshPets(),"rato",rng); p.hunger = 99;
    feed(p,"wheat"); expect(p.hunger).toBe(100); expect(p.bond).toBe(12);
  });
  it("hatches an incubated egg preserving genes", () => {
    const st = freshPets(); const e = wildEgg(st,"plains",rng); if (!e) throw new Error("No egg");
    expect(typeof hatch(st,e,rng)).toBe("string"); walkEggs(st,e.need);
    const p = hatch(st,e,rng); if (typeof p === "string") throw new Error(p);
    expect(p.genes).toEqual(e.genes); expect(st.eggs).toHaveLength(0); expect(st.hatched).toBe(1);
  });
  it("breeds ready parents and applies rest", () => {
    const st = freshPets(); const a = makePet(st,"rato",rng); const b = makePet(st,"gato",rng);
    a.level = b.level = 10; a.bond = b.bond = 40;
    const e = breed(st,a,b,rng); expect(typeof e).toBe("object"); expect(a.breedCd).toBe(600); expect(a.hunger).toBe(60);
    expect(typeof breed(st,a,b,rng)).toBe("string");
  });
  it("evolves only when conditions are satisfied", () => {
    const st = freshPets(); const p = makePet(st,"rato",rng); adopt(st,p);
    const ctx = { time: "dia" as const, biome: "plains", has: () => false };
    expect(evolve(st,p,"rato_chapeu",ctx)).toBeNull(); p.level = 8; p.bond = 30;
    expect(evolve(st,p,"rato_chapeu",ctx)?.to).toBe("rato_chapeu"); expect(st.seen).toContain("rato_chapeu");
  });
  it("updates active companion when removing it from the team", () => {
    const st = freshPets(); const a = makePet(st,"rato",rng); const b = makePet(st,"gato",rng); adopt(st,a); adopt(st,b);
    setActive(st,b.uid); toggleTeam(st,b.uid); expect(st.active).toBe(a.uid);
  });
  it("keeps only the nine Kaetram-style skins", () => {
    expect(HERO_SKINS).toHaveLength(9); expect(HERO_SKINS.every(s => s.sheet.startsWith("player/"))).toBe(true);
    expect(skinUnlocked(8,14)).toBe(false); expect(skinUnlocked(8,15)).toBe(true);
  });
});