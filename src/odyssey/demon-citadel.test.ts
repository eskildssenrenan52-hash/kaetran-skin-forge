import { describe, expect, it } from "vitest";
import {
  CITADEL_ENTRY, CITADEL_FLOORS, CITADEL_FINAL_BOSS_ID, CITADEL_UNLOCK_BOSS_ID,
  citadelBest, citadelBoss, citadelCheckpoints, citadelFloorLevel, citadelTheme, citadelUnlocked,
  generateCitadelFloor, isCitadelGuardianFloor, recordCitadelBest,
} from "./demon-citadel";
import { beatsFor, STORY_ITEMS, STORY_RECIPES } from "./story";

describe("Cidadela de Gehenna", () => {
  it("tem 100 andares, dez alas determinísticas e inimigos escalados", () => {
    expect(CITADEL_FLOORS).toBe(100);
    expect(Array.from({ length: 100 }, (_, i) => citadelTheme(i + 1).name).filter((v, i, a) => i === 0 || v !== a[i - 1]).length).toBe(10);
    expect(citadelFloorLevel(100)).toBeGreaterThan(citadelFloorLevel(1));
    expect(Array.from({ length: 100 }, (_, i) => isCitadelGuardianFloor(i + 1)).filter(Boolean).length).toBe(10);
  });

  it("usa guardiões nos pisos 10–90 e reserva o Rei Demoníaco para o trono no 100", () => {
    expect(citadelBoss(9, 1, 1)).toBeNull();
    expect(citadelBoss(10, 1, 1)?.id).toBe("citadel_10");
    expect(citadelBoss(90, 1, 1)?.id).toBe("citadel_90");
    const final = citadelBoss(100, 21, 33);
    expect(final?.id).toBe(CITADEL_FINAL_BOSS_ID);
    expect(final?.name).toContain("Azrakel");
    expect(final?.name).toContain("Coroa Desperta");
    expect(final?.tx).toBe(21);
    expect(final?.reward).toContain("azrakel_crown");
    expect(final?.reward?.filter((id) => id === "gehenna_ember")).toHaveLength(3);
    expect(citadelBoss(10, 1, 1)?.reward).toContain("gehenna_ember");
  });

  it("gera uma arena final independente do Abismo com boss/tesouro próprios", () => {
    const floor = generateCitadelFloor(100);
    expect(floor.floor).toBe(100);
    expect(floor.theme.name).toBe("Câmara da Coroa Desperta");
    expect(floor.boss?.id).toBe(CITADEL_FINAL_BOSS_ID);
    expect(floor.boss?.id).not.toBe("abyss_100");
    expect(floor.chests).toHaveLength(0);
    expect(floor.spawns).toHaveLength(0);
    expect(floor.rooms.some((room) => room.w >= 68 && room.h >= 52)).toBe(true);
  });

  it("grava melhor piso em chave própria, valida unlock e oferece checkpoints de cinco em cinco", () => {
    const discoveries = new Set<string>(["abyss:best=80"]);
    expect(citadelBest(discoveries)).toBe(0);
    expect(citadelUnlocked(new Set([CITADEL_UNLOCK_BOSS_ID]))).toBe(true);
    expect(citadelUnlocked(new Set())).toBe(false);
    expect(recordCitadelBest(discoveries, 13)).toBe(13);
    expect(recordCitadelBest(discoveries, 6)).toBe(13);
    expect(citadelBest(discoveries)).toBe(13);
    expect([...discoveries].some((key) => key === "abyss:best=80")).toBe(true);
    expect(citadelCheckpoints(13)).toEqual([1, 5, 10]);
    expect(citadelCheckpoints(100).at(-1)).toBe(100);
  });

  it("posiciona o portão em região remota, mas dentro dos limites do mundo", () => {
    expect(Math.hypot(CITADEL_ENTRY.tx - 122, CITADEL_ENTRY.ty - 126)).toBeGreaterThan(2_000);
    expect(CITADEL_ENTRY.tx).toBeGreaterThan(0);
    expect(CITADEL_ENTRY.tx + CITADEL_ENTRY.w).toBeLessThan(3_200);
    expect(CITADEL_ENTRY.ty + CITADEL_ENTRY.h).toBeLessThan(2_400);
  });

  it("registra uma cutscene inédita no gatilho do andar 100 e uma receita de progressão", () => {
    const finale = beatsFor("boss:citadel_100").find((beat) => beat.id === "citadel_finale");
    expect(finale?.stage?.id).toBe("citadel_finale");
    expect(finale?.lines).toHaveLength(5);
    expect(STORY_ITEMS.some((item) => item.id === "gehenna_ember")).toBe(true);
    expect(STORY_ITEMS.some((item) => item.id === "azrakel_crown")).toBe(true);
    expect(STORY_RECIPES.some((recipe) => recipe.out === "gehenna_blade" && recipe.cost["gehenna_ember"] === 8)).toBe(true);
  });
});
