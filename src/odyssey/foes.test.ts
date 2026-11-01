import { describe, expect, it } from 'vitest';
import { FOES, FOE_KINDS } from './foes';
import { BIOME_ENEMIES, ENEMIES, ITEMS } from './data';
import { MONSTER_LEVEL } from './levels';
import { LEGION, LEGION_ART } from './legion';

describe('novas criaturas', () => {
  it('são 112 espécies (12 + 100 da Legião), cada uma com nome próprio', () => {
    expect(FOE_KINDS.length).toBe(112);
    expect(new Set(FOE_KINDS.map((k) => FOES[k].name)).size).toBe(112);
  });
  it('a Legião tem 100 criaturas com arte, anatomia e estatísticas válidas', () => {
    const ids = Object.keys(LEGION);
    expect(ids.length).toBe(100);
    for (const id of ids) {
      expect(LEGION_ART[id]).toBeDefined();
      const f = LEGION[id];
      expect(f.hp).toBeGreaterThan(0); expect(f.atk).toBeGreaterThan(0); expect(f.biomes.length).toBeGreaterThan(0);
      if (f.ranged) expect(f.shot).toBeDefined();
      expect(/^#[0-9a-f]{6}$/i.test(LEGION_ART[id].cols[0])).toBe(true);
    }
    expect(new Set(ids.map((id) => LEGION_ART[id].plan)).size).toBe(14);
  });
  it('entram no catálogo de inimigos, nos níveis e em pelo menos um bioma', () => {
    for (const k of FOE_KINDS) {
      expect(ENEMIES[k].name).toBe(FOES[k].name);
      expect(MONSTER_LEVEL[k]).toBe(FOES[k].level);
      expect(Object.values(BIOME_ENEMIES).some((l) => l.includes(k))).toBe(true);
      for (const [item] of FOES[k].drops) expect(ITEMS[item]).toBeDefined();
    }
  });
  it('mantém todos os inimigos originais nos biomas', () => {
    expect(BIOME_ENEMIES.plains.slice(0, 5)).toEqual(['mushroom', 'mushroom', 'goblin', 'slime', 'rat']);
  });
});
