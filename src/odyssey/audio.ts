import type { Biome } from "./data";

type Sfx = "hit" | "swing" | "hurt" | "fire" | "ice" | "wind" | "light" | "heal" | "pickup" | "level" | "coin" | "boss" | "die" | "ui" | "bow" | "warp" | "craft" | "explode";

const SCALES: Partial<Record<Biome, { root: number; scale: number[]; tempo: number; wave: OscillatorType }>> = {
  plains: { root: 261.6, scale: [0, 2, 4, 5, 7, 9, 11], tempo: 132, wave: "square" },
  forest: { root: 220, scale: [0, 2, 3, 5, 7, 8, 10], tempo: 100, wave: "triangle" },
  desert: { root: 246.9, scale: [0, 1, 4, 5, 7, 8, 10], tempo: 112, wave: "sawtooth" },
  cave: { root: 196, scale: [0, 2, 3, 5, 7, 8, 11], tempo: 84, wave: "triangle" },
  mountain: { root: 293.7, scale: [0, 2, 4, 7, 9], tempo: 96, wave: "square" },
};
const MELODY = [0, 2, 4, 2, 5, 4, 2, 1, 0, 4, 7, 6, 5, 4, 2, -1, 0, 2, 4, 7, 9, 7, 5, 4, 2, 4, 5, 2, 1, 2, 0, -1];
const BASS = [0, 0, 5, 5, 3, 3, 4, 4];

const MUSIC: Record<string, string> = {
  plains: "music/meadowofthepast.mp3", meadow: "music/meadowofthepast.mp3", sunflower: "music/meadowofthepast.mp3", lavender: "music/meadowofthepast.mp3",
  forest: "music/forest.mp3", autumn: "music/forest.mp3", jungle: "music/jungle.mp3", bamboo: "music/jungle2.mp3", sakura: "music/meadowofthepast.mp3",
  desert: "music/desert.mp3", oasis: "music/desert2.mp3", amber: "music/desert3.mp3",
  cave: "music/cave.mp3", prism: "music/cave.mp3", moonwood: "music/codingroom.mp3", mushroom: "music/spookyship.mp3", spores: "music/spookyship.mp3",
  mountain: "music/cave.mp3", aurora: "music/meadowofthepast.mp3",
  volcanic: "music/lavaland.mp3", obsidian: "music/lavaland.mp3", thunder: "music/lavaland.mp3",
  coast: "music/beach.mp3", coral: "music/beach2.mp3", lotus: "music/underwater.mp3", mangrove: "music/jungle.mp3", swamp: "music/underwater.mp3",
  ruins: "music/codingroom.mp3", marble: "music/codingroom.mp3", crimson: "music/boss.mp3",
};
const SFX_FILES: Partial<Record<Sfx, string | string[]>> = {
  hit: ["sounds/hit1.mp3", "sounds/hit2.mp3"], swing: "sounds/hit2.mp3", hurt: "sounds/hurt.mp3", fire: "sounds/firefox.mp3",
  ice: "sounds/hit2.mp3", wind: "sounds/teleport.mp3", light: "sounds/achievement.mp3", heal: "sounds/heal.mp3", pickup: "sounds/loot.mp3",
  level: "sounds/achievement.mp3", coin: "sounds/loot.mp3", boss: "sounds/boss.mp3", die: "sounds/death.mp3", ui: "sounds/chat.mp3",
  bow: "sounds/hit1.mp3", warp: "sounds/teleport.mp3", craft: "sounds/mining1.mp3", explode: "sounds/hit2.mp3",
};

export class Audio {
  ctx: AudioContext | null = null;
  declare master: GainNode;
  declare musicGain: GainNode;
  step = 0;
  nextTime = 0;
  biome: Biome = "plains";
  boss = false;
  timer: number | null = null;
  muted = false;
  private currentMusic: HTMLAudioElement | null = null;
  private currentTrack = "";
  private fallbackSynth = false;
  private readonly assetBase = "kaetram/audio";

  init() {
    if (this.ctx) { void this.ctx.resume(); this.syncMusic(); return; }
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(this.ctx.destination);
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.22;
    this.musicGain.connect(this.master);
    this.nextTime = this.ctx.currentTime + 0.1;
    this.timer = window.setInterval(() => { this.syncMusic(); this.schedule(); }, 120);
    this.syncMusic();
  }
  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.5;
    if (this.muted) this.currentMusic?.pause();
    else { this.syncMusic(); void this.currentMusic?.play().catch(() => undefined); }
  }
  destroy() {
    if (this.timer) clearInterval(this.timer);
    this.currentMusic?.pause();
    this.currentMusic = null;
    this.currentTrack = "";
    void this.ctx?.close();
    this.ctx = null;
  }
  private asset(path: string) { return `${this.assetBase}/${path}`; }
  private playClip(path: string, volume = 0.65) {
    if (this.muted) return;
    const clip = new window.Audio(this.asset(path));
    clip.volume = volume;
    clip.preload = "auto";
    void clip.play().catch(() => undefined);
    clip.addEventListener("ended", () => { clip.src = ""; }, { once: true });
  }
  private trackForState() { return this.boss ? "music/boss.mp3" : (MUSIC[this.biome] ?? MUSIC["forest"]!); }
  /** Troca a trilha somente quando o bioma ou a batalha mudam; os arquivos são todos locais. */
  syncMusic() {
    if (!this.ctx || this.muted) return;
    const track = this.trackForState();
    if (track === this.currentTrack && this.currentMusic) return;
    this.currentMusic?.pause();
    this.currentMusic = new window.Audio(this.asset(track));
    this.currentMusic.loop = true;
    this.currentMusic.volume = 0.32;
    this.currentTrack = track;
    this.fallbackSynth = false;
    void this.currentMusic.play().catch(() => { this.fallbackSynth = true; });
  }
  private note(freq: number, t: number, dur: number, type: OscillatorType, vol: number, dest: AudioNode) {
    const c = this.ctx; if (!c) return;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(dest);
    o.start(t); o.stop(t + dur + 0.02);
  }
  private schedule() {
    const c = this.ctx; if (!c || !this.fallbackSynth) return;
    const sc = SCALES[this.biome] ?? SCALES.forest;
    if (!sc) return;
    const tempo = this.boss ? 160 : sc.tempo;
    const spb = 60 / tempo / 2;
    while (this.nextTime < c.currentTime + 0.2) {
      const s = this.step;
      const deg = (d: number) => {
        const n = sc.scale.length, o = Math.floor(d / n), i = ((d % n) + n) % n;
        return sc.root * Math.pow(2, (sc.scale[i] + o * 12) / 12);
      };
      const m = MELODY[s % MELODY.length] + (this.boss ? -2 : 0);
      if (s % 2 === 0 || this.boss) this.note(deg(m), this.nextTime, spb * 1.6, this.boss ? "sawtooth" : sc.wave, 0.12, this.musicGain);
      if (s % 4 === 0) this.note(deg(BASS[(s / 4) % BASS.length]) / 4, this.nextTime, spb * 3.5, "triangle", 0.3, this.musicGain);
      if (s % 8 === 4) this.note(deg(m + 4), this.nextTime, spb * 2, "sine", 0.06, this.musicGain);
      if (this.boss && s % 2 === 0) this.noise(this.nextTime, 0.05, 0.08, 3000);
      this.nextTime += spb;
      this.step++;
    }
  }
  private noise(t: number, dur: number, vol: number, freq = 1000) {
    const c = this.ctx; if (!c) return;
    const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource(); src.buffer = buf;
    const f = c.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = freq;
    const g = c.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f); f.connect(g); g.connect(this.master);
    src.start(t);
  }
  private sweep(f0: number, f1: number, dur: number, type: OscillatorType, vol: number) {
    const c = this.ctx; if (!c) return; const t = c.currentTime;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + 0.02);
  }
  sfx(k: Sfx) {
    const c = this.ctx; if (!c || this.muted) return;
    const local = SFX_FILES[k];
    if (local) {
      const files = Array.isArray(local) ? local : [local];
      this.playClip(files[Math.floor(Math.random() * files.length)]!, k === "boss" ? 0.9 : 0.7);
      return;
    }
    const t = c.currentTime;
    switch (k) {
      case "swing": this.noise(t, 0.08, 0.15, 2500); break;
      case "bow": this.sweep(900, 300, 0.12, "triangle", 0.15); break;
      case "hit": this.sweep(300, 80, 0.1, "square", 0.18); this.noise(t, 0.06, 0.2, 800); break;
      case "hurt": this.sweep(200, 60, 0.25, "sawtooth", 0.2); break;
      case "fire": this.noise(t, 0.35, 0.25, 600); this.sweep(400, 100, 0.3, "sawtooth", 0.1); break;
      case "explode": this.noise(t, 0.5, 0.35, 300); break;
      case "ice": [1200, 1600, 2000].forEach((f, i) => this.note(f, t + i * 0.04, 0.2, "sine", 0.1, this.master)); break;
      case "wind": this.noise(t, 0.6, 0.2, 1500); break;
      case "light": [523, 659, 784, 1047].forEach((f, i) => this.note(f, t + i * 0.05, 0.4, "triangle", 0.12, this.master)); break;
      case "heal": [392, 523, 659, 784].forEach((f, i) => this.note(f, t + i * 0.08, 0.3, "sine", 0.14, this.master)); break;
      case "pickup": this.note(880, t, 0.08, "square", 0.1, this.master); this.note(1320, t + 0.06, 0.1, "square", 0.1, this.master); break;
      case "coin": this.note(1400, t, 0.05, "square", 0.08, this.master); this.note(1900, t + 0.05, 0.12, "square", 0.08, this.master); break;
      case "level": [523, 659, 784, 1047, 784, 1047].forEach((f, i) => this.note(f, t + i * 0.1, 0.25, "square", 0.12, this.master)); break;
      case "boss": this.sweep(80, 40, 1.2, "sawtooth", 0.3); this.noise(t, 1, 0.2, 200); break;
      case "die": this.sweep(400, 40, 1, "triangle", 0.25); break;
      case "ui": this.note(660, t, 0.05, "square", 0.06, this.master); break;
      case "warp": this.sweep(200, 2000, 0.6, "sine", 0.2); break;
      case "craft": [0, 0.12, 0.24].forEach((d) => { this.noise(t + d, 0.06, 0.3, 3000); }); this.note(1047, t + 0.36, 0.3, "triangle", 0.12, this.master); break;
    }
  }
}
