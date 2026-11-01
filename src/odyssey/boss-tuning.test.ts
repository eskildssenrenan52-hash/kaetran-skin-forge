import { describe, expect, it } from "vitest";
import { bossHp, bossMeleeDamage, bossPhaseCooldown, bossPhaseForHp, bossPhaseSpeed } from "./boss-tuning";

describe("boss tuning", () => {
  it("aplica 5× ao HP final e 3× apenas à função melee", () => {
    expect(bossHp(137)).toBe(685);
    expect(bossHp(0)).toBe(1);
    expect(bossMeleeDamage(17)).toBe(51);
  });

  it("define cinco fases com transições nos limiares de HP", () => {
    expect([100, 81, 80, 61, 60, 41, 40, 21, 20, 1, 0].map((hp) => bossPhaseForHp(hp, 100)))
      .toEqual([1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 5]);
    expect(bossPhaseForHp(1, 0)).toBe(5);
  });

  it("aumenta a pressão de movimento e cadência sem tocar nos valores de dano ranged", () => {
    expect(bossPhaseSpeed(1)).toBe(1);
    expect(bossPhaseSpeed(5)).toBeGreaterThan(1.5);
    expect(bossPhaseCooldown(1)).toBe(1);
    expect(bossPhaseCooldown(5)).toBeLessThan(0.6);
  });
});
