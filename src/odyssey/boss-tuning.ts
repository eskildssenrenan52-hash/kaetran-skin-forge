export const BOSS_HP_MULTIPLIER = 5;
export const BOSS_MELEE_MULTIPLIER = 3;
export const BOSS_PHASE_COUNT = 5;

/** Escala somente o HP final de uma definição boss; não altera o catálogo-base. */
export function bossHp(base: number): number {
  return Math.max(1, Math.round(base * BOSS_HP_MULTIPLIER));
}

/** Multiplicador exclusivo de colisões/investidas corpo a corpo de boss. */
export function bossMeleeDamage(base: number): number {
  return Math.max(1, Math.round(base * BOSS_MELEE_MULTIPLIER));
}

/** Fases 1–5 nos intervalos >80%, >60%, >40%, >20% e ≤20% do HP. */
export function bossPhaseForHp(hp: number, maxHp: number): 1 | 2 | 3 | 4 | 5 {
  if (maxHp <= 0 || hp <= 0) return 5;
  const ratio = Math.max(0, hp / maxHp);
  if (ratio > 0.8) return 1;
  if (ratio > 0.6) return 2;
  if (ratio > 0.4) return 3;
  if (ratio > 0.2) return 4;
  return 5;
}

const PHASE_SPEED = [1, 1.1, 1.22, 1.36, 1.52] as const;
const PHASE_COOLDOWN = [1, 0.88, 0.77, 0.66, 0.55] as const;

export function bossPhaseSpeed(phase: number): number {
  return PHASE_SPEED[Math.max(1, Math.min(5, Math.floor(phase))) - 1]!;
}

export function bossPhaseCooldown(phase: number): number {
  return PHASE_COOLDOWN[Math.max(1, Math.min(5, Math.floor(phase))) - 1]!;
}
