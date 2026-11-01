// A Legião: 100 criaturas novas geradas a partir de uma ficha compacta (anatomia + elemento + cores + traços).
// Dados puros: só importa tipos, para não criar ciclos com foes.ts/data.ts. A arte vive em legion-art.ts.
import type { FoeDef, FoeTrait } from './foes';

export type LegionPlan = 'blob' | 'quad' | 'biped' | 'bird' | 'insect' | 'serpent' | 'wraith' | 'golem' | 'plant' | 'jelly' | 'eye' | 'crab' | 'shroom' | 'wisp';
export interface LegionArt { plan: LegionPlan; el: string; cols: [string, string, string]; f: string; trait: FoeTrait }

/** nome|lore|anatomia|elemento|cor principal/secundária/destaque|detalhes|traço|nível|biomas
 * detalhes: g brilho · e olhos extras · s espinhos · c coroa · h chifres · o auréola · f presas · w asas · t cauda/ferrão · a armadura · b ossos · k manto/foice · m juba · l pernas longas */
const RAW = `
Limo de Seiva|Gelatina verde que brota nos prados e salta sobre quem passa distraído.|blob|nature|7fcf55/3f8f35/e6ff9a|g|leap|1|meadow forest autumn
Gosma de Lava|Magma mole que escorre das fendas e borbulha, chamuscando o chão.|blob|fire|ff7a30/b03010/ffe070|gs|charge|5|volcanic obsidian amber
Geleca Glacial|Massa de gelo viscoso que reflete a aurora em seu interior.|blob|ice|9fe0ff/5aa0d8/ffffff|ge|leap|4|aurora mountain
Lodo Peçonhento|Lama tóxica que borbulha e deixa um rastro corrosivo.|blob|poison|8a9a30/4a5a18/c8ff50|fe|none|3|swamp mangrove spores
Bolha Marinha|Gota gigante do mar que vagueia em terra espalhando maresia.|blob|water|5ab8f0/2a78c0/d8f8ff|g|strafe|3|coast coral mangrove
Massa do Vazio|Pedaço de escuridão que engoliu a luz e aprendeu a andar.|blob|void|6a3ac0/2a1060/e0a0ff|geo|spiral|8|obsidian marble prism
Mel Dourado|Âmbar vivo e doce; quem se aproxima fica preso e dolorido.|blob|holy|f0b830/b07810/fff0a0|gc|leap|2|sunflower meadow lotus
Lobo de Cinzas|Pelagem de brasa apagada; cada passo solta fagulhas cinzentas.|quad|fire|6a5a58/2a2020/ff7a30|mte|charge|4|volcanic amber obsidian
Lince das Neves|Caçador silencioso de passos leves, salta das nevascas.|quad|ice|d8ecf8/90b8d8/60d0ff|tf|leap|3|mountain aurora
Javali Tectônico|Couraça de rocha e presas de quartzo; arrasa tudo em linha reta.|quad|earth|8a6a48/4a3820/e8d0a0|hsa|charge|4|autumn crimson forest
Hiena das Dunas|Ri baixinho antes de saltar; anda em bando pela areia quente.|quad|sand|c89a58/7a5a30/f0d890|tf|leap|3|desert oasis amber
Pantera Sombria|Pelo negro que se funde à noite; só os olhos denunciam o bote.|quad|shadow|3a2a58/180e30/c070ff|tfe|blink|6|moonwood lavender spores
Cervo Espectral|Galhada de luz pálida; guia viajantes... ou os afasta de vez.|quad|holy|e8e8f8/a8a8d0/fff0a0|ho|strafe|5|moonwood sakura bamboo
Tigre Relâmpago|Listras que faíscam; ataca como o trovão depois do clarão.|quad|shock|f0c030/604010/fff8a0|tfm|charge|7|thunder marble mountain
Ursa de Ferro|Veterana coberta de placas enferrujadas; protege ruínas esquecidas.|quad|metal|8a96a0/4a5460/ffb060|as|charge|6|ruins marble cave
Goblin Sapador|Carrega pólvora e picareta; cava onde não devia.|biped|metal|7a9a48/3a5a20/ffb040|a|strafe|2|cave ruins mountain
Esqueleto Arqueiro|Ossos velhos que ainda sabem esticar uma corda.|biped|bone|e8e0c8/a89870/80ffd0|b|strafe|3|ruins desert cave
Cultista do Eclipse|Capuz roxo e cântico proibido; invoca a lua escura.|biped|shadow|5a3a8a/2a1850/e070ff|kh|spread|5|ruins moonwood spores
Brutamontes de Espinhos|Pele coberta de cardos; bate primeiro, pergunta nunca.|biped|nature|6a8a3a/3a5a20/e0d070|s|charge|3|desert oasis jungle
Xamã das Cinzas|Dança sobre brasas e lança chamas que seguem o ritmo.|biped|fire|b04a28/601810/ffc040|hk|spread|6|volcanic obsidian
Cavaleiro Afogado|Armadura coberta de algas; o mar jamais o soltou.|biped|water|4a8aa0/1a4a60/a0f0e0|ac|strafe|5|coast mangrove coral
Gladiador de Marfim|Campeão de arenas antigas; o elmo traz uma coroa quebrada.|biped|bone|f0e8d0/b0a078/ffd060|bac|charge|6|marble ruins
Menestrel do Trovão|Dedilha um alaúde que descarrega raios em compasso.|biped|shock|3a6ac0/1a2a70/fff070|c|spread|6|thunder lavender
Corvo Sepulcral|Pousa em lápides e some quando você olha de novo.|bird|shadow|2a2a3a/10101a/b070ff|f|blink|2|ruins swamp cave
Fênix Jovem|Plumas de brasa viva; renasce em fagulhas se for derrotada.|bird|fire|ff6a28/b02a10/ffe060|tow|spiral|7|volcanic amber crimson
Gavião do Vento|Corta o céu em mergulhos tão rápidos que o ar assobia.|bird|wind|c8a878/6a5030/f0f8ff|f|charge|3|plains meadow mountain
Coruja Lunar|Olhos enormes e penas de luar; sussurra feitiços de sono.|bird|holy|d8d8f0/8888b8/fff0a0|o|spread|4|moonwood lotus bamboo
Abutre de Areia|Circula sobre quem enfraquece; paciente e faminto.|bird|sand|a88860/604830/f0d090|f|leap|3|desert oasis amber
Garça Gélida|Pernas finas, bico de gelo; congela a água onde pisa.|bird|ice|c8e8f8/80b0d0/60e0ff|t|strafe|4|aurora mountain
Ave-Trovão Menor|Cria de tempestade; cada bater de asas estala um relâmpago.|bird|shock|5a8ae0/203a90/fff070|tw|spiral|6|thunder mountain marble
Vespa de Âmbar|Ferrão luminoso e zumbido furioso; guarda colmeias de mel.|insect|poison|e8b020/503810/fff0a0|wt|charge|2|amber sunflower autumn
Formiga-Soldado|Marcha em fila e ataca em enxame; a rainha nunca está longe.|insect|blood|a03020/501410/ffb060|ah|charge|2|plains jungle forest
Louva-Lâmina|Foices afiadas e paciência mortal; fica imóvel até o golpe.|insect|nature|5ab040/2a6020/e0ff80|sh|leap|4|jungle bamboo sakura
Escaravelho Solar|Rola um disco de luz; sua carapaça reflete todo ataque.|insect|holy|d8a820/705010/fff8c0|ho|shell|3|desert oasis
Aranha Prismática|Teia de cristal; cada olho vê uma cor diferente do mundo.|insect|void|7a60e0/302070/80f0ff|e|spread|6|prism cave aurora
Libélula Faísca|Asas de vidro que estalam; deixa uma trilha de centelhas.|insect|shock|40c0d0/186070/fff880|we|strafe|3|coast lotus swamp
Centopeia de Obsidiana|Anéis de rocha vulcânica que cavam túneis fumegantes.|insect|earth|3a3440/14101a/ff5030|s|burrow|7|obsidian volcanic cave
Naja Esmeralda|Capuz aberto e olhar hipnótico; o veneno é tão verde quanto a pele.|serpent|poison|3aa860/1a6038/d8ff60|fh|spread|3|jungle swamp mangrove
Enguia Elétrica|Nada no ar carregado e solta descargas em círculo.|serpent|shock|4a7ac0/1a3a78/fff070|s|spiral|4|coast thunder coral
Serpente de Cinzas|Escamas incandescentes; desliza sob o chão e ressurge.|serpent|fire|8a3a28/401810/ffa030|s|burrow|5|volcanic obsidian
Dragãozinho do Bosque|Filhote de dragão de folhas; cospe esporos e mal sabe voar.|serpent|nature|5ab048/2a6828/ffe070|whf|spread|4|forest bamboo sakura
Víbora de Gelo|Corpo cristalino que tilinta; o bote deixa a pele azulada.|serpent|ice|a8e0f8/5090c0/ffffff|f|charge|3|aurora mountain
Verme Abissal|Anéis pálidos e boca de dentes; vem de onde a luz não chega.|serpent|void|5a4a8a/221a40/ff70e0|f|burrow|8|obsidian marble
Naga das Marés|Metade sábia, metade tempestade; comanda as ondas com um gesto.|serpent|water|3a9ab0/185068/ffe8a0|ch|strafe|6|coral coast lotus
Fantasma do Farol|Guarda de um farol apagado; carrega a última luz que restou.|wraith|holy|c8e0f0/7090b0/fff0a0|o|blink|3|coast moonwood
Ceifador Menor|Foice torta e capuz sem rosto; ceifa sombras, não vidas... por ora.|wraith|shadow|2a2038/100818/ff4060|k|blink|8|spores obsidian marble
Banshee Gélida|Seu lamento congela o ar e racha as janelas dos vales.|wraith|ice|a8d8f0/5088b8/ffffff|e|spiral|6|aurora mountain
Espectro de Chamas|Alma queimada que ainda arde; estende mãos de fogo.|wraith|fire|d85a28/702010/ffe070|h|spread|6|volcanic crimson
Alma Afogada|Gotas escorrem do manto; o pântano guarda seus nomes.|wraith|water|5a9ab0/204860/b0fff0|e|strafe|4|swamp mangrove coral
Sombra do Vazio|Recorte de noite sem estrelas; some e surge às suas costas.|wraith|void|3a2060/0e0820/e060ff|he|blink|9|obsidian prism marble
Fantasma Tempestuoso|Nuvem com forma de gente; trovoa quando se zanga.|wraith|shock|6a7ab0/303a68/fff070|c|spiral|7|thunder
Golem de Barro|Argila moldada por uma criança esquecida; ainda obedece.|golem|earth|a87850/604028/e0c090|-|shell|2|plains desert ruins
Colosso de Ferro|Engrenagens e vapor; marcha até ser desligado.|golem|metal|8a96a8/444e5c/ffa040|a|charge|6|ruins marble thunder
Golem de Gelo|Bloco de glaciar com olhos de safira; a geada o acompanha.|golem|ice|a8d8f0/5a90c0/ffffff|e|shell|5|aurora mountain
Golem de Magma|Núcleo em fusão sob a crosta; cada passo racha o chão.|golem|fire|5a3a38/281818/ff7020|s|charge|7|volcanic obsidian
Guardião Prismático|Cristais flutuam ao redor; cada faceta dispara um raio.|golem|holy|c0a0f0/6a50b0/ffffff|ao|spread|7|prism marble
Totem de Osso|Pilha de ossos com um crânio no topo; murmura em línguas mortas.|golem|bone|e0d8b8/9a8c60/80ffc0|bh|strafe|4|ruins desert spores
Gárgula de Musgo|Pedra coberta de musgo; desperta quando ninguém olha.|golem|nature|7a8a70/405038/a0ff70|hw|shell|3|ruins jungle bamboo
Girassol Furioso|Gira para o sol e para você; as pétalas cortam como lâminas.|plant|nature|f0c020/a07010/6a3a18|c|root|2|sunflower meadow
Videira Estranguladora|Laços de cipó que se fecham antes que se perceba.|plant|nature|3a8a38/1a5020/c0ff60|s|root|4|jungle bamboo
Cacto Atirador|Espinhos disparados como flechas; floresce só ao entardecer.|plant|sand|5a9a48/2a5a28/ff80a0|s|root+|3|desert oasis
Lótus Peçonhento|Flor bela e traiçoeira; o perfume entorpece.|plant|poison|c070d0/702a80/e0ff80|c|root+|4|lotus swamp mangrove
Rosa de Sangue|Pétalas rubras que pingam; espinhos famintos.|plant|blood|c02040/600818/ffb0b0|se|root|5|crimson sakura
Orquídea Espectral|Floresce no escuro e murmura ao vento da lua.|plant|shadow|8a60c0/3a2070/f0b0ff|eo|root+|6|moonwood spores lavender
Espinheiro de Gelo|Arbusto de cristais; os ramos tilintam e rasgam.|plant|ice|a0d8f0/4888b8/ffffff|s|root|4|aurora mountain
Água-Viva Tempestuosa|Pulsa e faísca; flutua sobre as ondas como um raio contido.|jelly|shock|a0b0f0/5060c0/fff070|e|spiral|4|coast thunder coral
Medusa Lunar|Sino translúcido que brilha como a lua cheia.|jelly|holy|d0d8f8/8090d0/fff0b0|co|strafe|3|moonwood lotus coral
Anêmona Carmesim|Tentáculos vermelhos que ondulam; alcança quem passa perto.|jelly|blood|e04050/801828/ffc0a0|s|spread|4|coral crimson
Balão de Esporos|Bolsa inchada de esporos; estoura em nuvens tóxicas.|jelly|poison|b0c850/607020/f0ff80|e|spiral|2|spores swamp mushroom
Raia do Ar|Planando pelo vento, fustiga com cauda de chicote.|jelly|wind|c0e0f0/6090b8/ffffff|w|strafe|5|aurora thunder mountain
Água-Viva Abissal|Vive no fundo do mundo; brilha em pontos de estrelas mortas.|jelly|void|6a40b0/281060/60ffe0|eo|spread|8|obsidian prism
Medusa de Brasa|Sino de vidro quente; os tentáculos deixam rastros de fogo.|jelly|fire|f08a40/a03a18/fff090|s|spiral|6|volcanic amber
Olho Vigia|Nunca pisca; vê tudo e conta a quem não devia.|eye|shadow|d8d0e8/6a5a90/c050ff|-|spread|3|cave ruins
Beholder Menor|Olho central e olhinhos em haste; cada um maldiz de um jeito.|eye|void|8a4ac0/3a1860/ffe060|esh|spiral|8|obsidian prism marble
Olho de Tempestade|Íris de nuvem em redemoinho; relampeja ao fitar.|eye|shock|c0d0f0/5870b0/fff070|s|spiral|6|thunder aurora
Olho Flamejante|Pupila de fenda e pálpebra em chamas.|eye|fire|f0d8b0/c05020/ff7020|h|spread|5|volcanic crimson
Olho Gélido|Esfera de cristal; seu olhar deixa cílios de geada.|eye|ice|e8f4ff/70a8d0/40d0ff|-|strafe|4|aurora mountain
Olho Santo|Asas pequenas e halo; vê a verdade e a queima.|eye|holy|fffbe8/d0b060/ffd040|wo|spiral|6|marble lotus
Olho Enfermo|Veias estouradas e secreção; chora ácido.|eye|poison|e0e8b0/80901a/b0ff40|e|spread|3|swamp spores
Caranguejo Ferrugem|Casco de ferro velho; as pinças rangem ao fechar.|crab|metal|a8643a/582a14/f0b070|a|shell|2|coast coral
Escorpião de Cristal|Cauda de cristais que refrata a luz em ferroadas.|crab|earth|b080e0/603a98/ffffff|ts|charge|4|desert cave prism
Aranha de Lava|Pernas finas e incandescentes; pulam entre as poças de magma.|crab|fire|5a2a20/2a100c/ff6a20|el|leap|5|volcanic obsidian
Lagosta Abissal|Couraça azul-noite e olhos que brilham; pinça de esmagar rochas.|crab|water|2a4a90/101e50/60ffe0|ash|charge|5|coral mangrove
Aranha das Cavernas|Oito olhos no escuro; fia teias que se fecham em silêncio.|crab|shadow|4a3a50/1e1428/ff4060|el|blink|3|cave spores
Siri do Pântano|Verde lodoso e rabugento; esconde-se sob a lama.|crab|poison|6a8a48/384a20/e0f070|-|shell|2|swamp mangrove
Escorpião Dourado|Ferrão de ouro puro; a lenda diz que protege tesouros.|crab|sand|e0b030/805a10/fff0a0|to|burrow|6|desert amber oasis
Cogumelo Soldado|Chapéu de capacete e passo marcial; protege o bosque.|shroom|nature|c05a38/602a1c/fff0c0|a|strafe|1|plains mushroom forest
Cogumelo Explosivo|Cabeça instável; estoura em esporos de fogo.|shroom|fire|e0602a/902010/ffe060|g|leap|3|mushroom spores
Fungo Fantasma|Pálido e translúcido; some entre as brumas do bosque.|shroom|shadow|c8c0e0/7a6aa0/b070ff|eg|blink|4|spores moonwood
Cogumelo Gélido|Chapéu coberto de geada; pisca em azul sob a neve.|shroom|ice|90c8f0/4a88c0/ffffff|s|none|3|aurora mushroom
Cogumelo Real|Coroa de esporos dourada; os outros cogumelos o obedecem.|shroom|holy|f0c040/a07010/fff8d0|co|spread|5|mushroom sunflower
Cogumelo Peçonhento|Chapéu roxo de bolinhas; quem o toca nunca esquece.|shroom|poison|8a50c0/4a2878/d0ff60|eg|spiral|4|spores swamp
Fungo Elétrico|Filamentos que estalam; faíscas pulam de chapéu em chapéu.|shroom|shock|50a0d0/205080/fff870|g|strafe|5|thunder mushroom
Fogo-Fátuo Azul|Luz fria dos pântanos; atrai viajantes para a água.|wisp|water|60b8f0/2a68b0/e8ffff|e|blink|2|swamp moonwood
Centelha Rebelde|Fagulha que fugiu de uma fogueira e nunca mais voltou.|wisp|fire|ff8a2a/c03a10/fff0a0|-|strafe|3|volcanic amber crimson
Espírito do Vento|Redemoinho com rosto; sussurra e empurra.|wisp|wind|d8f0f8/90b8d0/ffffff|w|spiral|4|mountain plains meadow
Luz Perdida|Pequena estrela caída; segue quem tem o coração limpo.|wisp|holy|fff0a0/e0b040/ffffff|o|blink|3|lotus sakura moonwood
Chama Gélida|Fogo sem calor; dói como frio no osso.|wisp|ice|80d8ff/3a88d0/ffffff|h|spread|5|aurora
Chama Sombria|Fogo negro que devora a luz ao redor.|wisp|shadow|4a2a78/1a0c38/e070ff|he|spiral|7|obsidian spores
Relâmpago Preso|Raio aprisionado em esfera; quer sair, e vai sair.|wisp|shock|a0d0ff/4070d0/fff870|e|strafe|5|thunder marble
`.trim().split('\n');

type Prof = { hp: number; atk: number; def: number; spd: number; size: number };
const PLAN: Record<LegionPlan, Prof> = {
  blob: { hp: 1.0, atk: 0.9, def: 0.5, spd: 26, size: 8 }, quad: { hp: 1.1, atk: 1.1, def: 0.8, spd: 52, size: 8 },
  biped: { hp: 1.0, atk: 1.1, def: 1.0, spd: 34, size: 8 }, bird: { hp: 0.7, atk: 1.0, def: 0.4, spd: 60, size: 7 },
  insect: { hp: 0.7, atk: 1.0, def: 0.8, spd: 48, size: 6 }, serpent: { hp: 1.0, atk: 1.1, def: 0.7, spd: 40, size: 9 },
  wraith: { hp: 0.9, atk: 1.2, def: 0.3, spd: 38, size: 8 }, golem: { hp: 1.8, atk: 1.2, def: 1.8, spd: 16, size: 10 },
  plant: { hp: 1.0, atk: 1.0, def: 0.7, spd: 0, size: 8 }, jelly: { hp: 0.8, atk: 0.9, def: 0.3, spd: 24, size: 8 },
  eye: { hp: 0.9, atk: 1.1, def: 0.4, spd: 28, size: 8 }, crab: { hp: 1.2, atk: 1.0, def: 1.5, spd: 30, size: 8 },
  shroom: { hp: 0.9, atk: 0.9, def: 0.6, spd: 28, size: 7 }, wisp: { hp: 0.6, atk: 1.1, def: 0.2, spd: 50, size: 7 },
};
const EL: Record<string, { shot: string; drops: [string, number][] }> = {
  fire: { shot: '#ff8a3a', drops: [['coal', 0.5], ['mana_shard', 0.2], ['hi_potion', 0.08]] },
  ice: { shot: '#bfefff', drops: [['frost_herb', 0.5], ['crystal_ore', 0.2], ['ether', 0.1]] },
  shock: { shot: '#fff27a', drops: [['mana_shard', 0.4], ['iron_ore', 0.3], ['ether', 0.12]] },
  poison: { shot: '#9aff5a', drops: [['goo', 0.5], ['herb', 0.4], ['potion', 0.1]] },
  shadow: { shot: '#b080ff', drops: [['mana_shard', 0.35], ['goo', 0.3], ['ether', 0.12]] },
  holy: { shot: '#fff0b0', drops: [['moonflower', 0.3], ['mana_shard', 0.3], ['hi_potion', 0.1]] },
  earth: { shot: '#c8a070', drops: [['stone', 0.55], ['iron_ore', 0.3], ['copper_ore', 0.25]] },
  water: { shot: '#7ad0ff', drops: [['goo', 0.4], ['herb', 0.3], ['mana_shard', 0.2]] },
  wind: { shot: '#d8f0ff', drops: [['wolf_pelt', 0.2], ['mana_shard', 0.3], ['potion', 0.15]] },
  blood: { shot: '#ff4a5a', drops: [['wolf_pelt', 0.3], ['chitin', 0.3], ['hi_potion', 0.1]] },
  void: { shot: '#8a5aff', drops: [['crystal_ore', 0.3], ['mana_shard', 0.4], ['elixir', 0.02]] },
  sand: { shot: '#e8c878', drops: [['desert_rose', 0.3], ['chitin', 0.4], ['stone', 0.3]] },
  metal: { shot: '#c8d0d8', drops: [['iron_ore', 0.55], ['copper_ore', 0.35], ['coal', 0.3]] },
  nature: { shot: '#9ae860', drops: [['herb', 0.55], ['wood', 0.4], ['moonflower', 0.15]] },
  bone: { shot: '#80ffd0', drops: [['stone', 0.4], ['desert_rose', 0.2], ['hi_potion', 0.1]] },
};
const slug = (s: string) => 'l_' + s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

export const LEGION: Record<string, FoeDef> = {};
export const LEGION_ART: Record<string, LegionArt> = {};
for (const line of RAW) {
  const [name, lore, plan, el, cols, feats, rawTrait, lv, biomes] = line.split('|');
  const p = PLAN[plan as LegionPlan], level = Number(lv), ranged = rawTrait.endsWith('+') || ['spread', 'spiral', 'strafe'].includes(rawTrait);
  const trait = rawTrait.replace('+', '') as FoeTrait, id = slug(name), e = EL[el] ?? EL["fire"];
  const shot = !ranged ? undefined : trait === 'spiral' ? { color: e.shot, speed: 95, n: 6, spread: Math.PI / 3 }
    : trait === 'spread' ? { color: e.shot, speed: 105, n: 3, spread: 0.3, ...(el === 'ice' ? { slow: true } : {}) }
    : { color: e.shot, speed: 120, n: 1, spread: 0, ...(el === 'ice' ? { slow: true } : {}) };
  LEGION[id] = {
    name, lore, level, trait, size: p.size, biomes: biomes.split(' '), drops: e.drops, ...(shot ? { ranged: true, shot } : {}),
    hp: Math.round((34 + level * 20) * p.hp), atk: Math.round((9 + level * 2.4) * p.atk), def: Math.round((1 + level * 0.8) * p.def),
    speed: trait === 'root' ? 0 : p.spd, xp: Math.round(16 + level * 8 * (p.hp * 0.5 + 0.5)), gold: 6 + level * 3,
  };
  const c = cols.split('/');
  LEGION_ART[id] = { plan: plan as LegionPlan, el, cols: [`#${c[0]}`, `#${c[1]}`, `#${c[2]}`], f: feats === '-' ? '' : feats, trait };
}
