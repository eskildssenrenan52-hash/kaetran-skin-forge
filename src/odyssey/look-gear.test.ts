import { describe, expect, it } from "vitest";
import { GEAR, GEAR_ROW } from "./look-gear";

describe("acessórios por direção", () => {
  it("usa uma linha da folha para frente, lado e costas", () => {
    expect([GEAR_ROW["down"], GEAR_ROW["right"], GEAR_ROW["up"]]).toEqual([0, 1, 2]);
  });
  it("capuz é maior e desce até os ombros", () => {
    const hood = GEAR.hat.items.find((i) => i.name === "Capuz de couro");
    expect(hood?.scale).toBeGreaterThan(1);
    expect(hood?.dy).toBeGreaterThan(3);
  });
});
