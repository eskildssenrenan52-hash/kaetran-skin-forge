// Tempo para cada chefão voltar ao mundo depois de derrotado (segundos de jogo).
export const BOSS_RESPAWN_SECONDS = 180;
export const ISLAND_BOSS_RESPAWN_SECONDS = 45;
const NEVER_RESPAWN = new Set(["tutorial_gatekeeper"]);

/** -1 = não volta. Ilhas voltam rápido; todos os outros chefões voltam em 3 minutos. */
export function bossRespawnSeconds(bossId: string): number {
  if (NEVER_RESPAWN.has(bossId)) return -1;
  if (bossId.startsWith("isle_")) return ISLAND_BOSS_RESPAWN_SECONDS;
  return BOSS_RESPAWN_SECONDS;
}
