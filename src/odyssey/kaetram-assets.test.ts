import { describe, expect, it } from "vitest";
import SHEETS from "./kaetram-sprites.json";
import { HERO_SKINS } from "./hero-sprite";
import { SPECIES } from "./pets";
import { kMobSheet, K_SHEETS } from "./kaetram";

type Sheet = { url: string; anims?: Record<string, [number, number]> };
const catalog = SHEETS as unknown as Record<string, Sheet>;

const local = (key: string) => catalog[key]?.url.startsWith("/kaetram/img/sprites/");

describe("local Kaetram asset pack", () => {
  it("contains every imported sprite as a local catalog entry", () => {
    const keys = Object.keys(catalog);
    expect(keys).toHaveLength(1316);
    expect(keys.every((key) => local(key))).toBe(true);
    expect(Object.values(catalog).some((sheet) => sheet.url.includes("__l5e"))).toBe(false);
    expect(catalog["player/base"]?.anims?.["idle_down"]).toEqual([4, 0]);
    expect(catalog["mobs/crab"]?.anims?.["walk_down"]).toEqual([6, 8]);
    expect(local("npcs/villager")).toBe(true);
    expect(local("effects/fireball")).toBe(true);
    expect(local("items/apple")).toBe(true);
  });

  it("keeps hero skins, pets, and matching enemies wired to local sheets", () => {
    expect(HERO_SKINS.filter((skin) => skin.sheet && !skin.ai).every((skin) => local(skin.sheet))).toBe(true);
    expect(SPECIES.every((species) => local(species.sheet))).toBe(true);
    expect(kMobSheet("rat")).toBe("mobs/rat");
    expect(kMobSheet("not-a-kaetram-mob")).toBeUndefined();
  });
});
