import { describe, expect, it } from "vitest";
import { bossRespawnSeconds } from "./boss-respawn";
import { ISLAND_BOSS_RESPAWN_SECONDS } from "./sailing";

describe("boss respawn", () => {
  it("world bosses come back after 3 minutes", () => {
    expect(bossRespawnSeconds("vael")).toBe(180);
  });
  it("island bosses keep their quick respawn", () => {
    expect(bossRespawnSeconds("isle_coral_boss")).toBe(ISLAND_BOSS_RESPAWN_SECONDS);
  });
  it("the tutorial boss never returns", () => {
    expect(bossRespawnSeconds("tutorial_gatekeeper")).toBe(-1);
  });
});
