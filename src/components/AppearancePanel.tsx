import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { drawChar } from "@/odyssey/gfx";
import { drawHero, HERO_SKINS, skinUnlocked } from "@/odyssey/hero-sprite";
import { DEFAULT_LOOK, getLook, randomLook, resolveLook, setLook, type Look } from "@/odyssey/appearance";
import { GEAR, GEAR_SLOTS, drawGearIcon, gearUnlocked, preloadGear, type GearSlot } from "@/odyssey/look-gear";

type Cat = "skins" | GearSlot;
const CATS: [Cat, string][] = [["skins", "Skins"], ...GEAR_SLOTS.map((s) => [s, GEAR[s].label] as [Cat, string])];
const PV = 192, PS = 4; // 48×48 px de jogo ampliados 4×

function Preview({ look }: { look: Look }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [dir, setDir] = useState(0);
  const [walk, setWalk] = useState(false);
  const st = useRef({ look, dir, walk });
  st.current = { look, dir, walk };
  useEffect(() => {
    preloadGear();
    let raf = 0, last = performance.now(), t = 0;
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
      const c = ref.current?.getContext("2d");
      if (c) {
        const { look: lk, dir: d, walk: w } = st.current;
        c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, PV, PV); c.imageSmoothingEnabled = false;
        c.setTransform(PS, 0, 0, PS, 0, 0);
        const ok = drawHero(c, 24, 40, { skin: lk.kskin, dir: d, moving: w, frameT: t * 8, attack: 0, time: t, gear: lk });
        if (!ok) { const r = resolveLook(lk, "#6a8", "#ddc58e"); drawChar(c, 24, 40, r.pal, d, Math.floor(t * 5) % 4, null, 0, r.extras); }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div className="look-preview">
      <canvas ref={ref} width={PV} height={PV} aria-label="Pré-visualização do herói" />
      <div className="look-preview-btns">
        <Button variant="game" className="game-btn" aria-label="Girar à esquerda" onClick={() => setDir((d) => [2, 3, 1, 0][d] ?? 0)}>⟲</Button>
        <Button variant="game" className="game-btn" aria-label={walk ? "Parar" : "Andar"} onClick={() => setWalk((m) => !m)}>{walk ? "❚❚" : "▶"}</Button>
        <Button variant="game" className="game-btn" aria-label="Girar à direita" onClick={() => setDir((d) => [1, 2, 3, 0][d] ?? 0)}>⟳</Button>
      </div>
    </div>
  );
}

/** Miniatura parada; tenta de novo até a imagem carregar. */
function Thumb({ draw }: { draw: (c: CanvasRenderingContext2D) => boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let tries = 0, id = 0;
    const go = () => {
      const c = ref.current?.getContext("2d"); if (!c) return;
      c.clearRect(0, 0, 40, 40); c.imageSmoothingEnabled = false;
      if (!draw(c) && tries++ < 40) id = window.setTimeout(go, 150);
    };
    go();
    return () => clearTimeout(id);
  }, [draw]);
  return <canvas ref={ref} width={40} height={40} className="look-skin-thumb" aria-hidden="true" />;
}
const skinDraw = new Map<number, (c: CanvasRenderingContext2D) => boolean>();
const skinThumb = (i: number) => { let f = skinDraw.get(i); if (!f) { f = (c) => drawHero(c, 20, 38, { skin: i, dir: 0, moving: false, frameT: 0, attack: 0, time: 0 }); skinDraw.set(i, f); } return f; };
const gearDraw = new Map<string, (c: CanvasRenderingContext2D) => boolean>();
const gearThumb = (s: GearSlot, i: number) => { const k = `${s}:${i}`; let f = gearDraw.get(k); if (!f) { f = (c) => drawGearIcon(c, s, i, 40); gearDraw.set(k, f); } return f; };

export function AppearancePanel({ level }: { level: number; armor?: string; ring?: string }) {
  const [look, setL] = useState<Look>(() => getLook());
  const [cat, setCat] = useState<Cat>("skins");
  const set = (n: Look) => { setL(n); setLook(n); };

  return (
    <div className="look-layout">
      <Preview look={look} />
      <div className="look-editor">
        <div className="look-cats" role="tablist" aria-label="Categorias">{CATS.map(([id, label]) => <button key={id} role="tab" aria-selected={cat === id} className={cat === id ? "on" : ""} onClick={() => setCat(id)}>{label}</button>)}</div>
        <div className="look-options">
          {cat === "skins" ? (
            <div className="look-skins">{HERO_SKINS.map((s, i) => (
              <Button key={s.id} variant="game" disabled={!skinUnlocked(i, level)} aria-pressed={look.kskin === i} className={`look-skin h-auto whitespace-normal text-left ${look.kskin === i ? "ring-1 ring-primary" : ""}`} onClick={() => set({ ...look, kskin: i })}>
                <span className="look-skin-row"><Thumb draw={skinThumb(i)} /><span className="look-skin-text"><b>{s.name}</b><small>{skinUnlocked(i, level) ? s.desc : `Libera no nível ${s.minLevel}`}</small></span></span>
              </Button>
            ))}</div>
          ) : (
            <div className="look-grid">
              <button className={`look-swatch ${look[cat] < 0 ? "on" : ""}`} aria-pressed={look[cat] < 0} onClick={() => set({ ...look, [cat]: -1 })}>
                <span className="look-none">∅</span><small>Nenhum</small>
              </button>
              {GEAR[cat].items.map((g, i) => {
                const ok = gearUnlocked(cat, i, level);
                return (
                  <button key={g.name} disabled={!ok} className={`look-swatch look-gear ${look[cat] === i ? "on" : ""}`} aria-pressed={look[cat] === i} title={g.name} onClick={() => set({ ...look, [cat]: i })}>
                    <Thumb draw={gearThumb(cat, i)} /><small>{ok ? g.name : `Nv ${g.minLevel}`}</small>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <div className="look-actions">
          <Button variant="game" className="game-btn" onClick={() => set(randomLook(level))}>🎲 Aleatório</Button>
          <Button variant="game" className="game-btn" onClick={() => set({ ...DEFAULT_LOOK })}>↺ Restaurar</Button>
        </div>
      </div>
    </div>
  );
}
