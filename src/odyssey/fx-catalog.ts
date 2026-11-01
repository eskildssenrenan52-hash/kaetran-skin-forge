// Assinatura visual única por ataque. Cada chave ("hero:3:2", "foe:slime", "boss:ent:4"...)
// recebe um par (efeito pintado por IA, giro de matiz) que nenhuma outra chave usa.
// Preferências temáticas são tentadas primeiro; só a combinação final precisa ser inédita.
import { FX_NAMES, type FxName } from "./vfx";

export interface FxSig { name: FxName; h: number }

/** Passos de matiz: 0° (cor original pintada) e mais 17 tons. */
export const HUE_STEPS = Array.from({ length: 18 }, (_, i) => i * 20);
export const FX_SIGNATURE_CAPACITY = FX_NAMES.length * HUE_STEPS.length;

const byKey = new Map<string, FxSig>();
const taken = new Set<string>();

function hash(s: string) { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0; return h >>> 0; }

/** Devolve (e reserva na primeira chamada) a assinatura única da chave. */
export function fxFor(key: string, prefer: readonly FxName[] = []): FxSig {
  const hit = byKey.get(key); if (hit) return hit;
  const h0 = hash(key);
  const rest = [...FX_NAMES].sort((a, b) => hash(key + a) - hash(key + b));
  const order = [...prefer, ...rest.filter((n) => !prefer.includes(n))];
  for (let hi = 0; hi < HUE_STEPS.length; hi++) {
    // Começa num tom que depende da chave para variar mesmo entre efeitos preferidos.
    const h = HUE_STEPS[(hi + (prefer.length ? 0 : h0)) % HUE_STEPS.length]!;
    for (const name of order) {
      const slot = `${name}@${h}`;
      if (taken.has(slot)) continue;
      taken.add(slot);
      const sig = { name, h };
      byKey.set(key, sig);
      return sig;
    }
  }
  // Catálogo esgotado: reaproveita com segurança, sem bloquear a simulação.
  const sig = { name: order[0] ?? "impact", h: HUE_STEPS[h0 % HUE_STEPS.length]! };
  byKey.set(key, sig);
  return sig;
}

/** Todas as assinaturas já reservadas (usado em testes). */
export const allSigs = () => [...byKey.entries()];
/** Limpa o estado global entre testes; não deve ser chamado pelo jogo. */
export function resetFxCatalogForTests() { byKey.clear(); taken.clear(); }
