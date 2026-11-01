import { describe, it, expect, vi } from 'vitest';
import { Game } from './engine';

function fakeCtx(canvas: unknown) {
  const store: Record<string | symbol, unknown> = { canvas };
  const noop = () => undefined;
  return new Proxy(store, {
    get: (t, k) => (k in t ? t[k] : k === 'createRadialGradient' || k === 'createLinearGradient' ? () => ({ addColorStop: noop }) : k === 'createImageData' ? (w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h }) : k === 'measureText' ? () => ({ width: 8 }) : k === 'getImageData' ? () => ({ data: new Uint8ClampedArray(4) }) : noop),
    set: (t, k, v) => { t[k] = v; return true; },
  });
}
vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function (this: HTMLCanvasElement) { return fakeCtx(this) as never; });
const make = () => { localStorage.clear(); const cv = document.createElement('canvas'); cv.width = 480; cv.height = 270; const g = new Game(cv); g.started = true; return g; };
/** Ataque aceito: zera a recarga como se o tempo tivesse passado. */
const swing = (g: Game) => { g.p.atkCd = 0; g.attack({ x: 1, y: 0 }); };

describe('Combo de 5 golpes', { timeout: 60000 }, () => {
  it('cinco ataques seguidos percorrem os golpes 1→5 e o sexto volta ao primeiro', () => {
    const g = make();
    const steps: number[] = [];
    for (let i = 0; i < 6; i++) { swing(g); steps.push(g.combo); }
    expect(steps).toEqual([0, 1, 2, 3, 4, 0]);
  });
  it('se o jogador demora mais que a janela do combo, recomeça no golpe 1', () => {
    const g = make();
    swing(g); swing(g);
    expect(g.combo).toBe(1);
    g.comboT = 0; // janela expirou
    swing(g);
    expect(g.combo).toBe(0);
  });
  it('ataque bloqueado pela recarga não avança o combo', () => {
    const g = make();
    swing(g);
    g.attack({ x: 1, y: 0 }); // ainda em recarga
    expect(g.combo).toBe(0);
  });
  it('acertar um inimigo pausa a ação por no máximo 0,09 s e a pausa termina sozinha', () => {
    const g = make();
    const e = g.enemies.find((x) => x.alive && !x.boss)!;
    e.hp = 99999;
    for (let i = 0; i < 5; i++) g.damageEnemy(e, 50);
    expect(g.hitStop).toBeGreaterThan(0);
    expect(g.hitStop).toBeLessThanOrEqual(0.09);
    for (let i = 0; i < 10; i++) g.update(0.016);
    expect(g.hitStop).toBe(0);
  });
  it('combo e pausa de impacto não vão para o save', () => {
    const g = make();
    swing(g); swing(g); g.hitStop = 0.05;
    g.save();
    const raw = localStorage.getItem('golden-arrow-save') ?? '';
    expect(raw).not.toContain('"combo"');
    expect(raw).not.toContain('hitStop');
  });
});
