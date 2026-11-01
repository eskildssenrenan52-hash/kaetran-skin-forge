import { afterEach, describe, expect, it } from 'vitest';
import { allSigs, FX_SIGNATURE_CAPACITY, fxFor, resetFxCatalogForTests } from './fx-catalog';
import { FX_NAMES } from './vfx';

afterEach(() => resetFxCatalogForTests());

describe('catálogo de efeitos visuais', () => {
  it('entrega 1.440 assinaturas sem repetição e conserva a atribuição da mesma chave', () => {
    expect(FX_NAMES).toHaveLength(80);
    expect(FX_SIGNATURE_CAPACITY).toBe(1_440);
    const first = fxFor('hero:sword:skin-0:combo-0');
    expect(fxFor('hero:sword:skin-0:combo-0')).toEqual(first);
    for (let i = 1; i < FX_SIGNATURE_CAPACITY; i++) fxFor(`regression:${i}`);
    const slots = allSigs().map(([key, sig]) => `${key}:${sig.name}@${sig.h}`);
    const signatures = allSigs().map(([, sig]) => `${sig.name}@${sig.h}`);
    expect(slots).toHaveLength(FX_SIGNATURE_CAPACITY);
    expect(new Set(signatures).size).toBe(FX_SIGNATURE_CAPACITY);
  });
});
