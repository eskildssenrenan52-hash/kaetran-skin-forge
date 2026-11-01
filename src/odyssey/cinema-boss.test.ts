import { describe, expect, it } from "vitest";
import { BEATS } from "./story";
import { directScene, scriptSignature, MIN_SCENE_SECONDS } from "./cine-director";

describe("cutscenes", () => {
  it("toda cena dura mais de 20 segundos", () => {
    for (const b of BEATS) expect(directScene(b).total).toBeGreaterThanOrEqual(MIN_SCENE_SECONDS);
  });
  it("nenhuma cena repete o roteiro de outra", () => {
    const sigs = BEATS.map((b) => scriptSignature(directScene(b)));
    expect(new Set(sigs).size).toBe(sigs.length);
  });
  it("queda de chefe vira cena de batalha", () => {
    const eco = BEATS.find((b) => b.trigger.startsWith("boss:"))!;
    expect(directScene(eco).mood).toBe("defeat");
  });
});
