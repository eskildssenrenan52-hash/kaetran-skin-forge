import { useEffect, useRef, useState } from "react";
import { PawPrint, Egg, BookOpen, Heart, Star, Users, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal, Section, Meter } from "./GameModal";
import type { Game } from "@/odyssey/engine";
import { petsOf, petsSave, evoCtx } from "@/odyssey/pet-play";
import { drawK } from "@/odyssey/kaetram";
import { SPECIES, SPECIES_BY_ID, ELEMENTS, RARITY, NATURES, ROLES, FOODS, TEAM_MAX, STABLE_MAX, EGG_MAX, MAX_LEVEL, petById, petStats, mood, xpNeed, geneScore, toggleTeam, setActive, feed, evolve, evoReady, hatch, breed, canBreed, release, skillsFor, type Pet } from "@/odyssey/pets";
import { ITEMS } from "@/odyssey/data";

function PetPortrait({ sheet, label }: { sheet: string; label: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let raf = 0;
    const paint = (t: number) => {
      const c = ref.current?.getContext("2d");
      if (c) { c.clearRect(0, 0, 96, 96); c.imageSmoothingEnabled = false; drawK(c, sheet, "idle_down", t / 450, 48, 78, false, 1, 2); }
      raf = requestAnimationFrame(paint);
    };
    raf = requestAnimationFrame(paint); return () => cancelAnimationFrame(raf);
  }, [sheet]);
  return <canvas ref={ref} width={96} height={96} aria-label={label} className="w-20 h-20 shrink-0" />;
}

export function PetsPanel({ g, onClose }: { g: Game; onClose: () => void }) {
  const st = petsOf(g);
  const [tab, setTab] = useState<"pets" | "eggs" | "nest" | "book">("pets");
  const [selected, setSelected] = useState(st.active ?? st.pets[0]?.uid ?? "");
  const [, refresh] = useState(0);
  const [message, setMessage] = useState("");
  const [parentA, setA] = useState(""); const [parentB, setB] = useState("");
  const [confirmRelease, setConfirmRelease] = useState(false);
  const pet = petById(st, selected); const sp = pet && SPECIES_BY_ID[pet.species];
  const commit = (msg: string) => { setMessage(msg); petsSave(g); g.save(); refresh(n => n + 1); };
  const food = pet ? Object.keys(FOODS).filter(id => ITEMS[id] && g.count(id) > 0) : [];
  const a = petById(st, parentA); const b = petById(st, parentB);
  const why = a && b ? canBreed(a, b) : "Escolha os dois pais.";
  return <Modal title={`Pets · ${st.pets.length}/${STABLE_MAX} companheiros`} onClose={onClose} wide>
    <div role="tablist" aria-label="Pets" className="flex flex-wrap gap-2 mb-4">
      {([["pets", "Companheiros", PawPrint], ["eggs", `Ovos (${st.eggs.length})`, Egg], ["nest", "Ninho", Heart], ["book", "Catálogo", BookOpen]] as const).map(([id, label, Icon]) => <Button key={id} role="tab" aria-selected={tab === id} variant={tab === id ? "secondary" : "game"} onClick={() => setTab(id)}><Icon size={16}/>{label}</Button>)}
    </div>
    {message && <p role="status" className="text-primary mb-3">{message}</p>}
    {tab === "pets" && <div className="grid gap-5 md:grid-cols-[220px_1fr]">
      <Section title="Equipe" aside={`${st.team.length}/${TEAM_MAX}`}><div className="flex flex-col gap-2">{st.pets.map(p => <Button key={p.uid} variant="game" className={`h-auto justify-start whitespace-normal text-left ${selected === p.uid ? "ring-1 ring-primary" : ""}`} onClick={() => { setSelected(p.uid); setConfirmRelease(false); }}><PawPrint size={14}/><span>{p.nick} · Nv {p.level}<small className="block text-muted-foreground">{st.active === p.uid ? "Ativo" : st.team.includes(p.uid) ? "Na equipe" : "No estábulo"}{p.shiny ? " · Brilhante" : ""}</small></span></Button>)}</div></Section>
      {pet && sp ? <Section title={pet.nick} aside={`${RARITY[sp.rarity].name} · ${ELEMENTS[sp.element].name}`}>
        <div className="flex gap-3 items-center"><PetPortrait sheet={sp.sheet} label={sp.name}/><div><p>{sp.name} · {sp.role}</p><p className="text-muted-foreground">{ROLES[sp.role]}</p><p>{mood(pet)} · {NATURES.find(n => n.id === pet.nature)?.name} · Geração {pet.gen}</p></div></div>
        <label className="block my-3">Apelido<Input aria-label="Apelido do pet" value={pet.nick} maxLength={24} onChange={e => { pet.nick = e.target.value; refresh(n => n + 1); }} onBlur={() => { pet.nick = pet.nick.trim() || sp.name; commit("Apelido salvo."); }}/></label>
        <div className="flex flex-wrap gap-2 mb-4"><Button variant="game" onClick={() => commit(toggleTeam(st, pet.uid))}><Users size={16}/>{st.team.includes(pet.uid) ? "Retirar da equipe" : "Entrar na equipe"}</Button><Button variant="game" disabled={st.active === pet.uid || (!st.team.includes(pet.uid) && st.team.length >= TEAM_MAX)} onClick={() => { setActive(st, pet.uid); commit(`${pet.nick} está ativo.`); }}><Star size={16}/>Ativar</Button></div>
        {([["Saciedade", pet.hunger, 100], ["Laço", pet.bond, 100], [pet.level >= MAX_LEVEL ? "Nível máximo" : `XP · Nv ${pet.level}`, pet.xp, xpNeed(pet.level)]] as const).map(([label, v, max]) => <div key={label} className="my-2"><div className="flex justify-between"><span>{label}</span><span>{Math.floor(v)}/{max}</span></div><Meter value={v} max={max}/></div>)}
        <p className="my-3">{Object.entries(petStats(pet)).map(([k,v]) => `${k.toUpperCase()} ${v}`).join(" · ")}<br/>Genes {geneScore(pet.genes)}% · {pet.kills} vitórias</p>
        <Section title="Alimentar" aside={`Favorita: ${ITEMS[sp.favorite]?.name ?? sp.favorite}`}><div className="flex flex-wrap gap-2">{food.map(id => <Button key={id} variant="game" onClick={() => { if (g.count(id) < 1) return; const msg = feed(pet, id); if (msg) { g.removeItem(id); commit(msg); } }}>{ITEMS[id].name} ×{g.count(id)}</Button>)}{!food.length && <p className="text-muted-foreground">Sem alimentos na mochila.</p>}</div></Section>
        <Section title="Habilidades"><div className="flex flex-wrap gap-2">{skillsFor(sp, pet.level).map(k => <span key={k.id} title={k.desc} className="text-accent">{k.name} · {k.cd}s</span>)}</div></Section>
        <Section title="Evoluções"><div className="flex flex-col gap-2">{(sp.evolves ?? []).map(r => <Button key={r.to} variant="game" disabled={!evoReady(pet,r,evoCtx(g))} className="h-auto whitespace-normal justify-start" onClick={() => { const result = evolve(st,pet,r.to,evoCtx(g)); if (result) { if (result.item) g.removeItem(result.item); commit(`Evoluiu para ${pet.nick}!`); } }}>{SPECIES_BY_ID[r.to].name} · {r.label}</Button>)}{!sp.evolves?.length && <p className="text-muted-foreground">Forma final.</p>}</div></Section>
        <div className="mt-4 flex flex-wrap gap-2">{confirmRelease ? <><Button variant="destructive" onClick={() => { release(st,pet.uid); setSelected(st.pets[0]?.uid ?? ""); setConfirmRelease(false); commit("Pet libertado."); }}>Confirmar libertação</Button><Button variant="game" onClick={() => setConfirmRelease(false)}>Cancelar</Button></> : <Button variant="game" onClick={() => setConfirmRelease(true)}><Trash2 size={14}/>Libertar</Button>}</div>
      </Section> : <p className="text-muted-foreground">Nenhum companheiro selecionado.</p>}
    </div>}
    {tab === "eggs" && <Section title="Incubadora" aside={`${st.eggs.length}/${EGG_MAX}`}><div className="grid gap-4 sm:grid-cols-2">{st.eggs.map(e => <div key={e.uid} className="border border-border p-3 rounded"><div className="flex items-center gap-2"><Egg size={26}/><b>Ovo de {ELEMENTS[SPECIES_BY_ID[e.species].element].name}</b></div><p className="my-2 text-muted-foreground">{e.from} · Geração {e.gen}</p><Meter value={e.steps} max={e.need}/><p className="my-2">{Math.floor(e.steps)}/{e.need} passos</p><Button variant="game" disabled={e.steps < e.need || st.pets.length >= STABLE_MAX} onClick={() => { const result = hatch(st,e,Math.random); commit(typeof result === "string" ? result : `${result.nick} nasceu!`); }}>Chocar ovo</Button></div>)}</div>{!st.eggs.length && <p className="text-muted-foreground">Nenhum ovo no ninho.</p>}</Section>}
    {tab === "nest" && <Section title="Cruzamento" aside="Nv 10 · Laço 40 · Saciedade 30"><div className="grid gap-4 sm:grid-cols-2">{([[parentA,setA,"Primeiro pai"],[parentB,setB,"Segundo pai"]] as const).map(([value,setter,label]) => <label key={label}>{label}<select aria-label={label} value={value} onChange={e => setter(e.target.value)} className="w-full mt-2 p-2 bg-background border border-border rounded"><option value="">Selecionar</option>{st.pets.map(p => <option key={p.uid} value={p.uid}>{p.nick} · Nv {p.level} · Laço {Math.floor(p.bond)}{p.breedCd > 0 ? ` · Descanso ${Math.ceil(p.breedCd)}s` : ""}</option>)}</select></label>)}</div><p className="my-4 text-muted-foreground">{why ?? "Pais preparados."}</p><Button variant="game" disabled={!!why || st.eggs.length >= EGG_MAX} onClick={() => { if (!a || !b) return; const result = breed(st,a,b,Math.random); commit(typeof result === "string" ? result : "Um novo ovo chegou ao ninho!"); }}><Heart size={16}/>Gerar ovo</Button></Section>}
    {tab === "book" && <Section title="Espécies" aside={`${st.seen.length}/${SPECIES.length}`}><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{SPECIES.map(s => <div key={s.id} className="border border-border p-3 rounded"><div className="flex items-center"><PetPortrait sheet={s.sheet} label={s.name}/><div><b>{s.name}</b><small className="block text-muted-foreground">{ELEMENTS[s.element].name} · {RARITY[s.rarity].name}</small><small>{st.seen.includes(s.id) ? "Descoberto" : "Não descoberto"}</small></div></div><p>{s.desc}</p></div>)}</div></Section>}
  </Modal>;
}