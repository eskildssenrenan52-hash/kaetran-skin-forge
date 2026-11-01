import type { BossDef } from "./data";

/** A segunda criatura é uma ocorrência rara, sorteada por chefe no primeiro mundo carregado. */
export const TWIN_BOSS_CHANCE = 0.05;
export function shouldSpawnTwin(rng: () => number = Math.random): boolean {
  return rng() < TWIN_BOSS_CHANCE;
}

export function twinBossDef(main: BossDef): BossDef {
  const { spirit: _spirit, ...shared } = main;
  return {
    ...shared,
    id: `${main.id}#twin`,
    name: `${main.name} · Gêmeo`,
    color: "#c49cff",
    // O par é uma única vitória: só o chefe principal concede o drop/espírito.
    reward: [],
  };
}

export const twinEncounterKey = (bossId: string) => `twin:${bossId}`;
