// Acessórios pintados por IA (public/look, gerados por scripts/build-look-sheets.py) desenhados
// em camadas sobre as skins Kaetram (quadros 32×32, pés em y; cabeça ~y-22, olhos ~y-17, ombros ~y-14).
// Cada folha tem 16 colunas (8 originais + 8 de scripts/append-look-sheets.py) × 3 linhas (frente, lado direito, costas) em 2× a escala do jogo;
// aqui elas são desenhadas pela metade. O lado esquerdo espelha a linha do lado direito.

export type GearSlot = "hat" | "horns" | "eyes" | "cape" | "wings" | "extra";
export interface GearItem { name: string; minLevel: number; dy?: number | undefined; scale?: number | undefined }
interface SlotDef { label: string; sheet: string; cw: number; ch: number; anchor: number; layer: "back" | "front"; items: GearItem[] }

const it = (name: string, minLevel = 1, dy?: number, scale?: number): GearItem => ({ name, minLevel, dy, scale });
/** Linha da folha para cada direção do herói. */
export const GEAR_ROW: Record<string, number> = { down: 0, right: 1, up: 2 };

/** anchor = y (relativo aos pés) onde fica a BASE do acessório, exceto olhos/asas que usam o centro. */
export const GEAR: Record<GearSlot, SlotDef> = {
  hat: { label: "Chapéus", sheet: "/look/hats.png", cw: 36, ch: 32, anchor: -17, layer: "front", items: [
    it("Chapéu de mago"), it("Coroa dourada", 8), it("Elmo de cavaleiro", 3, 3), it("Tricórnio pirata", 2), it("Capuz de couro", 1, 7, 1.2), it("Chapéu de palha"), it("Elmo viking", 5), it("Gorro de patrulheiro"),
    it("Capuz do mago sombrio", 4, 7, 1.2), it("Elmo de paladino", 9, 4, 1.25), it("Kabuto samurai", 7, 5, 1.35), it("Touca de lã", 1, 3), it("Cartola"), it("Chapéu de chef", 2), it("Tiara de cristal", 6, 3, 0.8), it("Elmo espartano", 8, 5, 1.35),
  ] },
  horns: { label: "Chifres", sheet: "/look/horns.png", cw: 40, ch: 28, anchor: -19, layer: "front", items: [
    it("Chifres de demônio"), it("Chifres de carneiro", 2), it("Chifres de dragão", 6), it("Galhada de cervo"), it("Chifres de unicórnio", 4), it("Chifres de touro", 3), it("Chifres de cristal", 8), it("Chifres do vazio", 12),
    it("Chifres infernais", 9), it("Chifres espirais", 3), it("Chifres de gelo", 7), it("Chifres de lava", 10), it("Chifres de osso", 5), it("Chifres de vinha", 2), it("Chifres ametista", 11), it("Chifres de oni", 4),
  ] },
  eyes: { label: "Olhos", sheet: "/look/eyes.png", cw: 24, ch: 12, anchor: -17, layer: "front", items: [
    it("Olhos de brasa"), it("Olhos arcanos"), it("Óculos redondos"), it("Tapa-olho", 2), it("Máscara dourada", 6), it("Venda ninja", 3), it("Visor rubro", 10), it("Olhos solares", 5),
    it("Óculos escuros"), it("Visão noturna", 6), it("Monóculo", 3), it("Óculos steampunk", 5), it("Óculos de coração"), it("Máscara de caveira", 8), it("Visor futurista", 12), it("Óculos de estrela", 2),
  ] },
  cape: { label: "Capas", sheet: "/look/capes.png", cw: 32, ch: 36, anchor: -17, layer: "back", items: [
    it("Capa carmesim"), it("Manto real", 5), it("Capa da floresta"), it("Capa do oceano"), it("Capa dourada", 10), it("Capa estrelada", 7), it("Arminho real", 12), it("Manto de viajante"),
    it("Capa vampírica", 6), it("Manto rasgado", 2), it("Capa sagrada", 9), it("Capa de lava", 12), it("Capa de gelo", 10), it("Capa de folhas", 3), it("Capa lunar", 7), it("Capa de bobo da corte", 4),
  ] },
  wings: { label: "Asas", sheet: "/look/wings.png", cw: 64, ch: 40, anchor: -13, layer: "back", items: [
    it("Asas de anjo", 6), it("Asas de morcego", 4), it("Asas de fada", 2), it("Asas de dragão", 9), it("Asas de fênix", 12), it("Asas de gelo", 8), it("Asas de folha", 3), it("Asas sombrias", 14),
    it("Asas de borboleta", 3), it("Asas mecânicas", 10), it("Asas de lava", 13), it("Asas arco-íris", 7), it("Asas de corvo", 5), it("Asas douradas", 15), it("Asas espectrais", 11), it("Asas de libélula", 2),
  ] },
  extra: { label: "Adornos", sheet: "/look/extras.png", cw: 36, ch: 24, anchor: -19, layer: "front", items: [
    it("Auréola", 5, -5), it("Coroa de flores"), it("Orelhas de gato"), it("Orelhas de raposa"), it("Orelhas de coelho"), it("Chama-fátuo", 6, -6), it("Coroa de louros", 4), it("Coroa de estrelas", 10, -4),
    it("Laço vermelho"), it("Orelhas de lobo", 2), it("Orelhas de urso"), it("Presilha de flor"), it("Tiara de diabinho", 4), it("Antenas", 3), it("Coroa cintilante", 9, -3), it("Penas brancas", 5),
  ] },
};
export const GEAR_SLOTS = Object.keys(GEAR) as GearSlot[];
export const gearUnlocked = (slot: GearSlot, i: number, level: number) => i < 0 || level >= (GEAR[slot].items[i]?.minLevel ?? 1);

const imgs = new Map<string, HTMLImageElement>();
function sheet(url: string): HTMLImageElement | null {
  if (typeof Image === "undefined") return null;
  let im = imgs.get(url);
  if (!im) { im = new Image(); im.src = url.replace(/^\/+/, ""); imgs.set(url, im); }
  return im.complete && im.naturalWidth ? im : null;
}
export function preloadGear() { for (const s of GEAR_SLOTS) sheet(GEAR[s].sheet); }

export type GearPick = Partial<Record<GearSlot, number>>;

function drawOne(c: CanvasRenderingContext2D, slot: GearSlot, i: number, x: number, y: number, dir: string, time: number, sc: number) {
  const def = GEAR[slot], item = def.items[i]; const im = sheet(def.sheet);
  if (!item || !im) return;
  const k = item.scale ?? 1;
  const w = (def.cw / 2) * k, h = (def.ch / 2) * k;
  const row = GEAR_ROW[dir] ?? 0;
  // A arte já foi pintada em cada direção; só pequenos ajustes de posição no perfil.
  let dx = 0;
  if (dir === "right" && slot === "eyes") dx = 1;
  if (dir === "right" && slot === "cape") dx = -2;
  // Capuz: no perfil o tecido cai atrás da nuca, então recua um pouco.
  if (dir === "right" && slot === "hat" && (item.scale ?? 1) > 1) dx = -1;
  const centered = slot === "eyes" || slot === "wings";
  let top = centered ? def.anchor - h / 2 : def.anchor - h;
  if (slot === "cape") top = def.anchor; // capa pende a partir dos ombros
  top += item.dy ?? 0;
  if (slot === "wings") top += Math.sin(time * 5) * 0.8;
  if (slot === "extra" && (i === 0 || i === 5 || i === 7)) top += Math.sin(time * 3) * 0.6;
  c.drawImage(im, i * def.cw, row * def.ch, def.cw, def.ch, Math.round(x + (dx - w / 2) * sc), Math.round(y + top * sc), w * sc, h * sc);
}

/** Camadas atrás do corpo (asas/capa quando o herói olha para baixo ou para o lado). */
export function drawGearBack(c: CanvasRenderingContext2D, g: GearPick | undefined, x: number, y: number, dir: string, flip: boolean, time: number, sc = 1, alpha = 1) {
  if (!g || dir === "up") return;
  layer(c, g, ["wings", "cape"], x, y, dir, flip, time, sc, alpha);
}
/** Camadas à frente: chapéus, chifres, olhos, adornos — e asas/capa quando visto de costas. */
export function drawGearFront(c: CanvasRenderingContext2D, g: GearPick | undefined, x: number, y: number, dir: string, flip: boolean, time: number, sc = 1, alpha = 1) {
  if (!g) return;
  const order: GearSlot[] = dir === "up" ? ["cape", "wings", "horns", "extra", "hat"] : ["eyes", "horns", "extra", "hat"];
  layer(c, g, order, x, y, dir, flip, time, sc, alpha);
}
function layer(c: CanvasRenderingContext2D, g: GearPick, slots: GearSlot[], x: number, y: number, dir: string, flip: boolean, time: number, sc: number, alpha: number) {
  c.save();
  if (alpha < 1) c.globalAlpha *= alpha;
  if (flip) { c.translate(Math.round(x) * 2, 0); c.scale(-1, 1); }
  for (const s of slots) { const i = g[s] ?? -1; if (i >= 0) drawOne(c, s, i, x, y, dir, time, sc); }
  c.restore();
}

/** Ícone de um acessório para a interface. */
export function drawGearIcon(c: CanvasRenderingContext2D, slot: GearSlot, i: number, size: number): boolean {
  const def = GEAR[slot]; const im = sheet(def.sheet);
  if (!im) return false;
  const s = Math.min(size / def.cw, size / def.ch);
  const w = def.cw * s, h = def.ch * s;
  c.drawImage(im, i * def.cw, 0, def.cw, def.ch, (size - w) / 2, (size - h) / 2, w, h);
  return true;
}
