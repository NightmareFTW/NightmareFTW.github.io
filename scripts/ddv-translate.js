/* Best-effort English → PT-PT translator for Dreamlight Valley item & recipe
   names. There is no official PT-PT name list, so this uses a word dictionary
   plus simple Portuguese grammar (noun first, modifiers after with "de").
   Unknown words are kept as-is. Imperfect by design — used to fill name_pt. */

// Connectors / articles (lowercased lookups).
// "and" / "&" are dropped: noun modifiers are already joined with " e ", so
// keeping them would double the connector ("ouro e & e opala").
const SMALL = { of: "de", and: "", "&": "", the: "", with: "com", or: "ou", any: "qualquer", "n'": "e", "'n'": "e", a: "um", en: "à", con: "com", e: "e" };

// Adjectives & cooking styles — placed AFTER the noun in Portuguese.
const ADJ = new Set(["red", "blue", "green", "yellow", "white", "black", "pink", "purple",
  "golden", "silver", "orange", "scarlet", "crimson", "violet", "fuchsia", "teal", "slate",
  "beige", "dusty", "goldenrod", "gray", "grey", "brilliant", "shiny", "pretty", "wild",
  "royal", "sweet", "sour", "spicy", "crispy", "creamy", "grilled", "roasted", "baked",
  "smoked", "steamed", "fried", "stuffed", "classic", "simple", "plain", "tasty", "hearty",
  "savory", "festive", "tropical", "dark", "hot", "cosmic", "stellar", "eternal", "tiny",
  "teeny", "large", "vintage", "glazed", "pickled", "braised", "poached", "seared",
  "sauteed", "fancy", "luminescent", "dream", "alpine", "electric", "flying", "rainbow",
  "loaded", "good", "great", "best", "fabulous", "marvelous", "whimsical", "joyful",
  "friendly", "ghostly", "old", "pan-fried", "pan-seared", "salt-baked", "salt-pickled",
  "hard-boiled", "sugar-free", "deep-fried", "stir-fry", "upside-down", "sun-dried"]);

const WORD = {
  // produce & ingredients
  apple: "maçã", apples: "maçãs", banana: "banana", blueberry: "mirtilo", strawberry: "morango",
  strawberries: "morangos", raspberry: "framboesa", cherry: "cereja", peach: "pêssego",
  pear: "pera", grape: "uva", grapes: "uvas", melon: "melão", honeydew: "melão", pineapple: "ananás",
  orange: "laranja", lemon: "limão", coconut: "coco", persimmon: "dióspiro", rhubarb: "ruibarbo",
  gooseberry: "groselha", currant: "groselha", currants: "groselhas", berry: "baga", berries: "bagas",
  tomato: "tomate", potato: "batata", potatoes: "batatas", carrot: "cenoura", onion: "cebola",
  onions: "cebolas", garlic: "alho", pepper: "pimento", peppers: "pimentos", corn: "milho",
  lettuce: "alface", cabbage: "couve", cauliflower: "couve-flor", broccoli: "brócolos",
  spinach: "espinafres", kale: "couve", celery: "aipo", cucumber: "pepino", zucchini: "courgette",
  eggplant: "beringela", okra: "quiabo", asparagus: "espargos", radish: "rabanete",
  radicchio: "radicchio", beet: "beterraba", beets: "beterrabas", beetroot: "beterraba",
  turnip: "nabo", yam: "inhame", pumpkin: "abóbora", squash: "abóbora", bean: "feijão",
  beans: "feijões", lentils: "lentilhas", soya: "soja", rice: "arroz", wheat: "trigo",
  oats: "aveia", barley: "cevada", rye: "centeio", grain: "cereal", grains: "cereais",
  flour: "farinha", sugarcane: "cana-de-açúcar", sugar: "açúcar", salt: "sal", spice: "especiaria",
  spices: "especiarias", basil: "manjericão", oregano: "orégãos", ginger: "gengibre",
  cinnamon: "canela", nutmeg: "noz-moscada", cumin: "cominhos", paprika: "paprika",
  chili: "malagueta", dill: "endro", vanilla: "baunilha", cocoa: "cacau", chocolate: "chocolate",
  coffee: "café", tea: "chá", honey: "mel", oil: "óleo", butter: "manteiga", milk: "leite",
  cheese: "queijo", yogurt: "iogurte", cream: "natas", egg: "ovo", eggs: "ovos", almonds: "amêndoas",
  peanut: "amendoim", peanuts: "amendoins", olives: "azeitonas", olive: "azeitona",
  mushroom: "cogumelo", mushrooms: "cogumelos", seaweed: "algas", agave: "agave", feta: "feta",
  ice: "gelo", slush: "granizado", meat: "carne", pork: "porco", venison: "veado",
  poultry: "aves", chicken: "frango", turkey: "peru", sausage: "salsicha", ham: "fiambre",
  steak: "bife", snail: "caracol", tofu: "tofu", sprouts: "rebentos", sprout: "rebento",
  leaves: "folhas", leaf: "folha", seeds: "sementes", seed: "semente", root: "raiz",
  dates: "tâmaras", leek: "alho-francês", bamboo: "bambu", figs: "figos", fig: "figo",
  fruit: "fruta", fruits: "frutas", vegetable: "vegetal", clover: "trevo", herb: "erva",
  herbs: "ervas", mint: "hortelã", thyme: "tomilho", rosemary: "alecrim", sage: "salva",
  parsley: "salsa", coriander: "coentros", cabbages: "couves", wheat: "trigo",
  // fish / seafood
  fish: "peixe", seafood: "marisco", shellfish: "marisco", crab: "caranguejo", shrimp: "camarão",
  tuna: "atum", salmon: "salmão", herring: "arenque", bass: "robalo", cod: "bacalhau",
  carp: "carpa", koi: "carpa koi", trout: "truta", eel: "enguia", octopus: "polvo", squid: "lula",
  lobster: "lagosta", clam: "amêijoa", oyster: "ostra", mussel: "mexilhão", mussels: "mexilhões",
  scallop: "vieira", scallops: "vieiras", catfish: "peixe-gato", perch: "perca", pike: "lúcio",
  anglerfish: "tamboril", swordfish: "espadarte", tilapia: "tilápia", walleye: "lúcio-perca",
  sturgeon: "esturjão", bream: "dourada", starfish: "estrela-do-mar", coral: "coral",
  conch: "búzio", abalone: "abalone", worm: "minhoca", kingfish: "serra", sole: "linguado",
  shad: "sável", betta: "betta", piranha: "piranha", squid: "lula", whitefish: "peixe-branco",
  // dish bases
  pie: "tarte", salad: "salada", soup: "sopa", cake: "bolo", pizza: "piza", cookies: "bolachas",
  cookie: "bolacha", crackers: "bolachas", porridge: "papas", smoothie: "batido", pasta: "massa",
  sorbet: "sorvete", stew: "guisado", sandwich: "sandes", sandwiches: "sandes", burger: "hambúrguer",
  hamburger: "hambúrguer", cheeseburger: "cheeseburger", jam: "compota", bread: "pão",
  juice: "sumo", pancakes: "panquecas", cupcake: "queque", cupcakes: "queques", roll: "rolo",
  pudding: "pudim", candy: "rebuçado", donut: "dónute", bagel: "bagel", crepe: "crepe",
  risotto: "risoto", soda: "refrigerante", milkshake: "batido", casserole: "caçarola",
  plate: "prato", popcorn: "pipocas", omelet: "omelete", bowl: "tigela", caramel: "caramelo",
  skewer: "espetada", skewers: "espetadas", spread: "pasta", breakfast: "pequeno-almoço",
  dessert: "sobremesa", appetizer: "entrada", entree: "prato principal", brownie: "brownie",
  waffles: "waffles", fondue: "fondue", fries: "batatas fritas", chowder: "sopa", gumbo: "gumbo",
  ramen: "ramen", souffle: "soufflé", spaghetti: "esparguete", trifle: "trifle", wonton: "wonton",
  muffin: "muffin", platter: "travessa", sushi: "sushi", maki: "maki", sashimi: "sashimi",
  taco: "taco", tacos: "tacos", burrito: "burrito", nachos: "nachos", pasta: "massa",
  porridge: "papas", stew: "guisado", roast: "assado", boil: "cozido", puffs: "folhados",
  jelly: "geleia", jellied: "em gelatina", smoothie: "batido", shake: "batido", latte: "latte",
  mocha: "mocha", cider: "cidra", beer: "cerveja", sake: "saqué", tartiflette: "tartiflette",
  fizz: "espumante", soda: "refrigerante", nectar: "néctar", pop: "refrigerante", boba: "boba",
  marshmallow: "marshmallow", sprinkles: "granulado", lollipop: "chupa-chupa", honeycomb: "favo de mel",
  pancakes: "panquecas", waffles: "waffles", pastry: "massa folhada", tart: "tarte",
  shortcake: "shortcake", cheesecake: "cheesecake", meringue: "merengue", mousse: "mousse",
  // flowers
  lily: "lírio", rose: "rosa", daisy: "margarida", hydrangea: "hortênsia", sunflower: "girassol",
  dandelion: "dente-de-leão", crocus: "croco", poppies: "papoilas", cactus: "cato", flower: "flor",
  flowers: "flores", passion: "paixão", milkweed: "asclépia", penstemon: "penstemon",
  nasturtium: "chagas", bromeliad: "bromélia", chrysanthemum: "crisântemo", jasmine: "jasmim",
  // gems / minerals
  amethyst: "ametista", aquamarine: "água-marinha", citrine: "citrino", diamond: "diamante",
  emerald: "esmeralda", garnet: "granada", peridot: "peridoto", topaz: "topázio",
  tourmaline: "turmalina", ruby: "rubi", sapphire: "safira", opal: "opala", jade: "jade",
  quartz: "quartzo", jasper: "jaspe", pyrite: "pirite", crystal: "cristal", onyx: "ónix",
  zircon: "zircão", spinel: "espinela", alexandrite: "alexandrita", magma: "magma", pure: "puro",
  // crafting materials
  softwood: "madeira macia", hardwood: "madeira dura", stone: "pedra", clay: "argila",
  glass: "vidro", sand: "areia", iron: "ferro", ore: "minério", ingot: "lingote", coal: "carvão",
  fiber: "fibra", cloth: "tecido", rope: "corda", niobium: "nióbio", cobalt: "cobalto",
  pearl: "pérola", seashell: "concha", sponge: "esponja", empty: "vazio", vial: "frasco",
  shovel: "pá", measuring: "fita-métrica", tape: "fita",
  gold: "ouro", nugget: "pepita", nuggets: "pepitas", copper: "cobre", brass: "latão",
  bronze: "bronze", steel: "aço", wood: "madeira", softwood: "madeira macia",
  brick: "tijolo", bricks: "tijolos", fabric: "tecido", gravel: "gravilha", amber: "âmbar",
  bones: "ossos", bone: "osso", crystal: "cristal", shard: "fragmento", fragment: "fragmento",
  fragments: "fragmentos", power: "energia", mechanical: "mecânico", parts: "peças",
  part: "peça", gift: "presente", gifts: "presentes",
  // decor / paths & fences
  road: "estrada", path: "caminho", pathway: "caminho", paving: "pavimento",
  fence: "cerca", fences: "cercas", wall: "parede", border: "bordadura", slab: "laje",
  picket: "estaca", lamppost: "candeeiro", frame: "moldura", frames: "molduras",
  pillow: "almofada", bird: "pássaro", birds: "pássaros", frog: "sapo", demon: "demónio",
  plant: "planta", trap: "armadilha", night: "noite", eggs: "ovos", benedict: "benedict",
  // misc descriptors handled as nouns
  sea: "mar", mountain: "montanha", spring: "primavera", star: "estrela", dream: "sonho",
  valley: "vale", milky: "leitoso", way: "via", french: "francês", greek: "grego",
  hawaiian: "havaiano", mediterranean: "mediterrânico", scottish: "escocês", tropical: "tropical",
  red: "vermelho", blue: "azul", green: "verde", yellow: "amarelo", white: "branco",
  black: "preto", pink: "rosa", purple: "roxo", golden: "dourado", silver: "prateado",
  scarlet: "escarlate", crimson: "carmesim", violet: "violeta", fuchsia: "fúcsia",
  teal: "turquesa", slate: "ardósia", beige: "bege", gray: "cinzento", grey: "cinzento",
  goldenrod: "dourado", dusty: "empoeirado",
  brilliant: "brilhante", shiny: "brilhante", pretty: "bonito", wild: "selvagem", royal: "real",
  sweet: "doce", sour: "azedo", spicy: "picante", crispy: "crocante", creamy: "cremoso",
  grilled: "grelhado", roasted: "assado", baked: "cozido", smoked: "fumado", steamed: "cozido a vapor",
  fried: "frito", stuffed: "recheado", classic: "clássico", simple: "simples", plain: "simples",
  tasty: "saboroso", hearty: "substancial", savory: "salgado", festive: "festivo", dark: "escuro",
  hot: "quente", cosmic: "cósmico", stellar: "estelar", eternal: "eterno", tiny: "minúsculo",
  teeny: "pequenino", large: "grande", glazed: "glaceado", pickled: "em conserva",
  braised: "estufado", poached: "escalfado", seared: "selado", sauteed: "salteado", roast: "assado",
  sauce: "molho", dip: "molho", chips: "batatas fritas", mash: "puré", puree: "puré",
  slaw: "salada", coleslaw: "salada de couve", gratin: "gratinado", paella: "paella",
  congee: "canja", dumplings: "dumplings", biryani: "biryani", risotto: "risoto",
  loaded: "recheado", veggie: "vegetal", veggies: "vegetais", vegetarian: "vegetariano",
};

function tword(w) {
  const lower = w.toLowerCase();
  if (lower in SMALL) return SMALL[lower];
  if (WORD[lower]) return WORD[lower];
  return w; // keep unknown as-is (best-effort)
}

function translateName(en) {
  if (!en) return en;
  const words = en.split(/\s+/);
  if (words.length === 1) {
    const t = tword(words[0]);
    return t === words[0] ? en : t.charAt(0).toUpperCase() + t.slice(1);
  }
  // Multi-word: head noun = last known word; modifiers go after with "de" (nouns)
  // or directly (adjectives). If too many unknowns, fall back to per-word.
  const known = words.filter((w) => WORD[w.toLowerCase()]).length;
  if (known < Math.ceil(words.length / 2)) return en; // mostly unknown → keep English

  const head = tword(words[words.length - 1]);
  const nounMods = [], adjMods = [];
  for (let i = 0; i < words.length - 1; i++) {
    const lw = words[i].toLowerCase();
    if (lw in SMALL) continue; // drop connectors (the/of/and/with/&) — join adds them back
    const t = tword(words[i]);
    (ADJ.has(lw) ? adjMods : nounMods).push(t);
  }
  let out = head;
  if (nounMods.length) out += " de " + nounMods.join(" e ");
  if (adjMods.length) out += " " + adjMods.join(" ");
  return out.charAt(0).toUpperCase() + out.slice(1);
}

module.exports = { translateName };
