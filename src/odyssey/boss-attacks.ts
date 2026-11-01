import type { BossDef } from './data';

export type BossShape = 'ring' | 'spiral' | 'nova' | 'blades' | 'minefield' | 'beam' | 'meteor' | 'vortex' | 'pulse' | 'cross' | 'fan' | 'serpent' | 'rain' | 'prison' | 'clone' | 'charge' | 'summon' | 'tele' | 'ground' | 'constellation';
export interface BossAttack { id: string; name: string; shape: BossShape; fx: string; color: string; power: number; cooldown: number; count: number; spread: number }

const SHAPES: BossShape[] = ['ring', 'spiral', 'nova', 'blades', 'minefield', 'beam', 'meteor', 'vortex', 'pulse', 'cross', 'fan', 'serpent', 'rain', 'prison', 'clone', 'charge', 'summon', 'tele', 'ground', 'constellation'];
const FX = ['brasas', 'cristal', 'lunar', 'veneno', 'raio', 'vazio', 'pétalas', 'areia', 'maré', 'raízes', 'eco', 'aurora', 'cinzas', 'prisma', 'névoa', 'espinhos', 'cometas', 'correntes', 'magma', 'estrelas'];
const NAMES = ['Coroa', 'Espiral', 'Eclosão', 'Lâminas', 'Campo', 'Raio', 'Queda', 'Vórtice', 'Pulso', 'Cruz', 'Leque', 'Serpente', 'Chuva', 'Prisão', 'Reflexo', 'Investida', 'Legião', 'Marca', 'Ruptura', 'Constelação'];
const hue = (s: string, i: number) => { let n = i + 17; for (const c of s) n = (n * 33 + c.charCodeAt(0)) % 360; return n; };
const color = (s: string, i: number) => `hsl(${hue(s, i)}, ${65 + (i % 3) * 8}%, ${52 + (i % 4) * 6}%)`;

/** Cada chefe percorre os 20 formatos, mas muda ordem, cadência, força, cor e efeito. */
export function bossAttacksFor(def: BossDef): BossAttack[] {
  let seed = 0; for (const c of def.id) seed = (seed * 31 + c.charCodeAt(0)) >>> 0;
  return SHAPES.map((shape, slot) => {
    const j = (slot + seed) % 20, count = 5 + ((seed + slot * 7) % 10);
    return { id: `${def.id}:attack:${slot + 1}`, name: `${NAMES[j]} de ${def.name}`, shape, fx: FX[(j + seed) % FX.length]!, color: color(def.id, j), power: 0.72 + ((seed + slot) % 7) * .09, cooldown: 1.15 + ((seed + slot * 3) % 8) * .11, count, spread: .14 + ((seed + slot) % 6) * .08 };
  });
}

const cache = new Map<string, BossAttack[]>();
export function attackOf(def: BossDef, index: number) { let a = cache.get(def.id); if (!a) { a = bossAttacksFor(def); cache.set(def.id, a); } return a[index % 20]!; }
