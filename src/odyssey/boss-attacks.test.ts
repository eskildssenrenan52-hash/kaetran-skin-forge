import { describe, expect, it } from 'vitest';
import { BOSSES } from './data';
import { STORY_BOSSES, beatsFor } from './story';
import { arsenalFor, runMove, BOSS_MOVES_PER_BOSS, BOSS_PATTERN_COUNT, BOSS_PATTERN_IDS, BOSS_MODIFIER_IDS, type BossCtx } from './boss-arsenal';
import { FX_SIGNATURE_CAPACITY } from './fx-catalog';
import { shouldSpawnTwin, twinBossDef, twinEncounterKey } from './boss-encounters';
import { CITADEL_BOSS_LOOK } from './demon-citadel';

const ALL_BOSS_VARIANTS = BOSSES.flatMap((boss) => [boss, twinBossDef(boss)]);

describe('arsenal novo de chefes', () => {
  it('contém os 37 padrões preparados e oito modificadores, cada chefe usa oito ataques sem repetição', () => {
    expect(BOSS_PATTERN_COUNT).toBe(37);
    expect(new Set(BOSS_PATTERN_IDS).size).toBe(37);
    expect(BOSS_MODIFIER_IDS).toHaveLength(8);
    expect(BOSS_MOVES_PER_BOSS).toBe(8);
    const combos = new Set<string>(), visuals = new Set<string>();
    for (const boss of ALL_BOSS_VARIANTS) {
      const moves = arsenalFor(boss.id);
      expect(moves).toHaveLength(8);
      expect(new Set(moves.map((m) => m.pattern)).size).toBe(8);
      for (const m of moves) {
        const combo = `${m.pattern}+${m.mod}`;
        const visual = `${m.signature.name}@${m.signature.h}`;
        expect(combos.has(combo)).toBe(false);
        expect(visuals.has(visual)).toBe(false);
        expect(m.fx.length).toBeGreaterThan(0);
        expect(m.cooldown).toBeGreaterThan(0);
        combos.add(combo); visuals.add(visual);
      }
    }
    expect(FX_SIGNATURE_CAPACITY).toBe(80 * 18);
  });
  it('executa os ataques sorteados contra um contexto falso sem depender de DOM ou áudio', () => {
    const noop = () => undefined;
    const ctx: BossCtx = {
      ex: 180, ey: 140, px: 100, py: 150, hit: 12, ph2: false, phase: 1, color: '#e0a0ff',
      shot: noop, tele: noop, later: noop, charge: noop, blink: noop, summon: noop, shake: noop, sfx: noop, fx: noop,
    };
    for (const boss of ALL_BOSS_VARIANTS) for (const move of arsenalFor(boss.id)) expect(() => runMove(move, ctx)).not.toThrow();
  });
  it('rola pares em 5%, constrói um segundo id e mantém arsenal separado', () => {
    expect(shouldSpawnTwin(() => 0.04999)).toBe(true);
    expect(shouldSpawnTwin(() => 0.05)).toBe(false);
    const main = STORY_BOSSES[0] ?? BOSSES[0]!;
    const twin = twinBossDef(main);
    expect(twin.id).toBe(`${main.id}#twin`);
    expect(twin.name).toContain('Gêmeo');
    expect(twin.reward).toEqual([]);
    expect(twinEncounterKey(main.id)).toBe(`twin:${main.id}`);
    const a = arsenalFor(main.id), b = arsenalFor(twin.id);
    expect(new Set([...a, ...b].map((m) => `${m.pattern}+${m.mod}`)).size).toBe(16);
    expect(new Set([...a, ...b].map((m) => `${m.signature.name}@${m.signature.h}`)).size).toBe(16);
  });
  it('preserva cena introdutória cinematográfica única para cada primeira aparição', () => {
    for (const boss of STORY_BOSSES) {
      const intro = beatsFor(`boss:intro:${boss.id}`);
      expect(intro).toHaveLength(1);
      expect(intro[0]?.stage?.actors).toHaveLength(2);
      expect(intro[0]?.lines.length).toBeGreaterThanOrEqual(3);
    }
  });
  it('atribui ataques e assinaturas sem colisões aos guardiões dos andares 10–100', () => {
    const combos = new Set<string>(), visuals = new Set<string>();
    for (const id of [...ALL_BOSS_VARIANTS.map((boss) => boss.id), ...Object.keys(CITADEL_BOSS_LOOK)]) {
      const moves = arsenalFor(id);
      expect(moves).toHaveLength(8);
      for (const move of moves) {
        const combo = `${move.pattern}+${move.mod}`, visual = `${move.signature.name}@${move.signature.h}`;
        expect(combos.has(combo)).toBe(false); expect(visuals.has(visual)).toBe(false);
        combos.add(combo); visuals.add(visual);
      }
    }
  });
});
