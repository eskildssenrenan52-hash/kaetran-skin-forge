import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import loadingArt from "@/assets/intro/loading.jpg";
import biomesArt from "@/assets/intro/biomes.jpg";
import { IntroCutscene } from "@/components/IntroCutscene";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Golden Arrow Odyssey — A Crônica do Cântico Partido" },
      { name: "description", content: "Um RPG 16-bit: restaure os dezessete Ecos da Árvore de Mana em dezenas de biomas." },
      { property: "og:title", content: "Golden Arrow Odyssey — A Crônica do Cântico Partido" },
      { property: "og:description", content: "Restaure a Canção da Árvore de Mana neste RPG em pixel art." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Intro,
});

type Phase = "black" | "studio" | "loading" | "cutscene" | "white" | "title" | "menu";

const SCENES = [
  { kicker: "No princípio", lines: ["No princípio não havia nada. Nem luz, nem nome, nem som.", "Então, no escuro, uma única nota se acendeu.", "E a nota, sozinha, aprendeu a cantar."] },
  { kicker: "A Canção", lines: ["A Canção virou campo, e o campo floresceu.", "Virou mar, e o mar aprendeu a respirar.", "Virou montanha, deserto e floresta. Cada nota, um lugar."] },
  { kicker: "Os Dezessete Ecos", lines: ["Dezessete notas sustentavam o mundo: os Ecos.", "E no centro de todos eles, a Árvore de Mana cantava sem parar.", "Ela cantava tudo. Cada alegria. E cada despedida."] },
  { kicker: "Vael e Gorm", lines: ["Dois meninos cresceram sob a Árvore, irmãos de Canção.", "Um deles ouvia todas as notas. Inclusive as que doíam.", "O nome dele era Vael. E ele não suportou."] },
  { kicker: "O Silêncio", lines: ["Então veio o Silêncio.", "Nota após nota, o mundo foi esquecendo como soar.", "Um homem de manto cinza caminhava entre as ruínas, sem deixar pegadas."] },
  { kicker: "Potos — cem anos depois", lines: ["Em Potos, a última vila sob a Árvore,", "o Ancião Gorm acordou de um sonho sem palavras.", "Pela primeira vez em um século, ele sonhou com um nome."] },
  { kicker: "A Jornada", lines: ["Do outro lado das colinas, alguém caminhava em direção à luz.", "Carregava um arco dourado. E não sabia por quê."] },
  { kicker: "O Último Acorde", lines: ["Você chegou na manhã seguinte.", "E quando a sua flecha tocou a Árvore...", "...o mundo, pela primeira vez em cem anos, lembrou como cantar."] },
];
const LINE_MS = 3800;

function Intro() {
  const [phase, setPhase] = useState<Phase>("black");
  const [progress, setProgress] = useState(0);
  const [scene, setScene] = useState(0);
  const [line, setLine] = useState(0);
  const timers = useRef<number[]>([]);
  const later = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };
  const clear = () => { timers.current.forEach(clearTimeout); timers.current = []; };

  const toWhite = useCallback(() => {
    clear(); setPhase("white");
    later(() => setPhase("title"), 900);
    later(() => setPhase("menu"), 3600);
  }, []);

  // black → studio → loading
  useEffect(() => {
    later(() => setPhase("studio"), 1200);
    later(() => setPhase("loading"), 5600);
    return clear;
  }, []);

  // loading bar (also preloads images)
  useEffect(() => {
    if (phase !== "loading") return;
    [biomesArt].forEach((s) => { const i = new Image(); i.src = s; });
    let p = 0;
    const id = window.setInterval(() => {
      p = Math.min(100, p + 1.4 + Math.random() * 2.6);
      setProgress(p);
      if (p >= 100) { window.clearInterval(id); window.setTimeout(() => setPhase("cutscene"), 700); }
    }, 70);
    return () => window.clearInterval(id);
  }, [phase]);

  // cutscene line/scene timing
  useEffect(() => {
    if (phase !== "cutscene") return;
    const s = SCENES[scene];
    const id = window.setTimeout(() => {
      if (line < s.lines.length - 1) setLine(line + 1);
      else if (scene < SCENES.length - 1) { setScene(scene + 1); setLine(0); }
      else toWhite();
    }, LINE_MS);
    return () => window.clearTimeout(id);
  }, [phase, scene, line, toWhite]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phase === "cutscene" && (e.key === "Escape" || e.key === "Enter")) toWhite();
      if (phase === "studio" || phase === "black") { clear(); setPhase("loading"); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, toWhite]);

  return (
    <main className="intro-root">
      {(phase === "black" || phase === "studio") && (
        <section className="intro-black" onClick={() => { clear(); setPhase("loading"); }}>
          {phase === "studio" && (
            <div className="studio-logo">
              <div className="studio-mark" aria-hidden>
                <span /><span /><span /><span />
              </div>
              <h1 className="studio-name">REMULU <em>GAMES</em></h1>
              <p className="studio-sub">apresenta</p>
            </div>
          )}
        </section>
      )}

      {phase === "loading" && (
        <section className="intro-loading">
          <img src={loadingArt} alt="Herói com arco dourado observando a Árvore de Mana ao entardecer" width={1920} height={1088} className="loading-art" />
          <div className="loading-vignette" />
          <div className="loading-ui">
            <div className="loading-label">Carregando<span className="loading-dots" /></div>
            <div className="loading-bar"><div style={{ width: `${progress}%` }} /></div>
            <p className="loading-tip">Dica: as estátuas de Mana permitem viajar rapidamente entre regiões.</p>
          </div>
        </section>
      )}

      {phase === "cutscene" && (
        <section className="intro-cutscene" aria-live="polite">
          <IntroCutscene scene={scene} />
          <div className="cut-letterbox top" /><div className="cut-letterbox bottom" />
          <div className="cut-motes" aria-hidden>{Array.from({ length: 24 }, (_, i) => <i key={i} style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i % 8) * 0.7}s` }} />)}</div>
          <div className="cut-kicker" key={`k${scene}`}>{SCENES[scene].kicker}</div>
          <p className="cut-line" key={`${scene}-${line}`}>{SCENES[scene].lines[line]}</p>
          <div className="cut-progress">{SCENES.map((_, i) => <span key={i} className={i <= scene ? "on" : ""} />)}</div>
          <button className="cut-skip" onClick={toWhite}>Pular ▸▸</button>
        </section>
      )}

      {(phase === "white" || phase === "title" || phase === "menu") && (
        <section className={`intro-title ${phase}`}>
          <img src={biomesArt} alt="Panorama dos biomas do jogo em torno da Árvore de Mana" width={1920} height={1088} className="title-bg" />
          <div className="title-shade" />
          <div className="title-white" />
          <div className="title-block">
            <div className="title-arrow" aria-hidden />
            <h1 className="game-title">Golden Arrow<span>Odyssey</span></h1>
            <p className="game-subtitle">A Crônica do Cântico Partido</p>
          </div>
          {phase === "menu" && <MainMenu />}
        </section>
      )}
    </main>
  );
}

function MainMenu() {
  return (
    <div className="title-menu">
      <div className="menu-greet">Modo offline — progresso salvo neste aparelho</div>
      <Link to="/odyssey" className="menu-btn primary">▶ Golden Arrow Odyssey</Link>
    </div>
  );
}
