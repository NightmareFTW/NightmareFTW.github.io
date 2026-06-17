/* Lightweight EN ⇄ PT-PT i18n.
   Adds a flag switcher to the header and translates the page by matching text
   against a dictionary (English → Portuguese). Works on static HTML and on
   JS-rendered content (via a MutationObserver), so no markup changes are needed.
   The default language is English; choosing PT stores the choice and reloads. */
(function () {
  const LANG = localStorage.getItem("nftw:lang") || "en";

  // Exact-match dictionary (trimmed English text → Portuguese).
  const DICT = {
    // ---- Header / footer / chrome ----
    "Hub": "Hub",
    "Built by NightmareFTW.": "Feito por NightmareFTW.",
    "Tools": "Ferramentas", "News": "Notícias", "Codes": "Códigos",
    "Daily reset": "Reset diário", "Weekly reset": "Reset semanal",
    "Search tools…": "Procurar ferramentas…",
    "Search games…": "Procurar jogos…",
    "Sort: Default": "Ordenar: Padrão",
    "Name A–Z": "Nome A–Z", "Name Z–A": "Nome Z–A", "Most tools": "Mais ferramentas",
    "All roles": "Todas as funções", "Clear filters": "Limpar filtros",
    "Reset": "Repor", "⟳ Reset": "⟳ Repor", "⟳ Reset all": "⟳ Repor tudo",
    "⟳ Clear all": "⟳ Limpar tudo", "Clear all": "Limpar tudo",
    "soon": "em breve", "No tools match.": "Nenhuma ferramenta corresponde.",
    "No games match your search.": "Nenhum jogo corresponde à pesquisa.",
    "view build →": "ver build →", "builds & teams →": "builds & teams →",
    "close ×": "fechar ×", "load": "carregar", "share": "partilhar", "max": "máx",
    "Copy share link": "Copiar link de partilha", "Save": "Guardar", "+ Add unit": "+ Adicionar unidade",
    "+ Add substat": "+ Adicionar substat", "+ Add unit ": "+ Adicionar unidade",
    "Copy": "Copiar", "Loading…": "A carregar…",
    "Loading news…": "A carregar notícias…", "Loading codes…": "A carregar códigos…",
    "Loading live data…": "A carregar dados ao vivo…", "Loading recipes…": "A carregar receitas…",
    "Loading items…": "A carregar items…", "Loading drop data…": "A carregar dados de drops…",

    // ---- Home ----
    "// gaming tools hub": "// hub de ferramentas de jogos",
    "Tools for the worlds I keep": "Ferramentas para os mundos a que",
    "coming back to": "volto sempre",
    "A growing toolbox — calculators, checklists and trackers. Nothing gets removed; it just keeps growing.":
      "Uma caixa de ferramentas em crescimento — calculadoras, checklists e trackers. Nada é removido; só continua a crescer.",
    "Games": "Jogos",

    // ---- Game blurbs ----
    "Co-op horror ghost hunting.": "Caça aos fantasmas co-op de terror.",
    "Co-op survival horror.": "Survival horror co-op.",
    "MMORPG.": "MMORPG.",
    "Turn-based gacha RPG.": "RPG gacha por turnos.",
    "Sci-fi co-op looter shooter.": "Looter shooter co-op de ficção científica.",
    "Cozy life-sim adventure.": "Aventura life-sim acolhedora.",
    "Open-world action RPG.": "RPG de ação de mundo aberto.",

    // ---- Tool descriptions (data.js) ----
    "Select the evidence you've found and instantly narrow down the ghost.":
      "Seleciona as evidências encontradas e descobre o fantasma instantaneamente.",
    "All 7 cursed possessions — usage, risks and tips for each.":
      "Os 7 objetos amaldiçoados — uso, riscos e dicas de cada um.",
    "Every item with images, tier upgrades, usage and tips.":
      "Cada equipamento com imagens, níveis, uso e dicas.",
    "Track unlocked rigs and your weekly program & challenge runs.":
      "Acompanha os rigs desbloqueados e o programa & desafios semanais.",
    "Build and save your rig + amp loadouts for different play styles.":
      "Cria e guarda loadouts de rig + amps para diferentes estilos de jogo.",
    "Roulettes, Wondrous Tails, Custom Deliveries — auto-resets on the FFXIV clock.":
      "Roulettes, Wondrous Tails, Custom Deliveries — reset automático pelo relógio do FFXIV.",
    "Live Eorzea clock showing which unspoiled nodes are up right now.":
      "Relógio de Eorzea ao vivo a mostrar que nós estão disponíveis agora.",
    "Enter a piece's substats and grade its quality instantly.":
      "Mete os substats de uma peça e avalia a qualidade na hora.",
    "Crit-adjusted effective attack and effective HP from defense.":
      "Ataque efetivo ajustado a crit e HP efetivo a partir da defesa.",
    "Simulate opening turn order from each unit's Speed and starting CR.":
      "Simula a ordem de turnos a partir da Speed e CR inicial de cada unidade.",
    "Live Sortie, Fissures, Arbitration and Baro Ki'Teer — straight from the API.":
      "Sortie, Fissures, Arbitration e Baro Ki'Teer ao vivo — direto da API.",
    "Live day/night & warm/cold timers for Cetus, Vallis, Cambion, Duviri and Earth.":
      "Timers ao vivo de dia/noite e quente/frio para Cetus, Vallis, Cambion, Duviri e Earth.",
    "Searchable relic & mission drops with multi-select filters and sorting.":
      "Drops de relíquias e missões pesquisáveis, com filtros multi-seleção e ordenação.",
    "A simple daily/weekly routine tracker that resets on its own.":
      "Um tracker simples de rotina diária/semanal que reseta sozinho.",
    "Character rankings (via Game8) with links to builds and best teams.":
      "Rankings de personagens (via Game8) com builds e melhores equipas.",
    "Current season's duties with detailed how-to for each, tracked on your device.":
      "As duties da season atual com how-to detalhado, guardadas no teu dispositivo.",
    "Searchable recipes — ingredients, star rating and value.":
      "Receitas pesquisáveis — ingredientes, estrelas e valor.",
    "Track each villager's friendship level, with tips on levelling up fast.":
      "Acompanha o nível de amizade de cada villager, com dicas para subir rápido.",
    "Every item with where to farm it — searchable and filterable.":
      "Cada item com onde farmar — pesquisável e filtrável.",

    // ---- Common tool-page subtitles / buttons ----
    "Saved Builds": "Builds Guardadas", "No saved builds yet.": "Ainda não há builds guardadas.",
    "Possible Ghosts": "Fantasmas Possíveis", "Evidence": "Evidências",
    "Routine Duties": "Duties de Rotina", "Stars": "Estrelas", "Category": "Categoria",
    "Biome": "Bioma", "DLC": "DLC", "Source": "Fonte", "Rarity": "Raridade",
    "Relic tier": "Tier de relíquia", "Planet": "Planeta", "Turn Order": "Ordem de Turnos",
    "Units": "Unidades", "Offense": "Ataque", "Defense (EHP)": "Defesa (EHP)",
    "Saved on this device.": "Guardado neste dispositivo.",
  };

  // Regex rules for dynamic counts etc. (applied to whole text nodes).
  const RX = [
    [/^(\d[\d,]*) games$/, "$1 jogos"],
    [/^(\d+) of (\d+)$/, "$1 de $2"],
    [/^(\d[\d,]*) tools?$/, (m, n) => `${n} ferramenta${n === "1" ? "" : "s"}`],
    [/^no tools?$/i, "sem ferramentas"],
    [/^(\d+) tool(s)?$/, (m, n) => `${n} ferramenta${n === "1" ? "" : "s"}`],
    [/^(\d[\d,]*) results?$/, (m, n) => `${n} resultado${n === "1" ? "" : "s"}`],
    [/^(\d[\d,]*) recipes?$/, (m, n) => `${n} receita${n === "1" ? "" : "s"}`],
    [/^(\d[\d,]*) items?$/, (m, n) => `${n} item${n === "1" ? "" : "s"}`],
    [/^(\d+) headlines · updated (.+)$/, "$1 notícias · atualizado $2"],
    [/^(\d+) codes · updated (.+)$/, "$1 códigos · atualizado $2"],
    [/^(\d+)\/(\d+) duties done$/, "$1/$2 duties feitas"],
    [/^(\d+) characters · (\d+) maxed · (\d+)\/(\d+) total levels$/,
      "$1 personagens · $2 no máximo · $3/$4 níveis totais"],
  ];

  function translateText(raw) {
    const key = raw.trim();
    if (!key) return null;
    if (DICT[key]) return raw.replace(key, DICT[key]);
    for (const [re, to] of RX) {
      if (re.test(key)) return raw.replace(key, key.replace(re, to));
    }
    return null;
  }

  const SKIP = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "CODE"]);
  function walk(node) {
    if (node.nodeType === 3) {
      const t = translateText(node.nodeValue);
      if (t !== null) node.nodeValue = t;
      return;
    }
    if (node.nodeType !== 1 || SKIP.has(node.tagName)) return;
    // Translate a few attributes.
    for (const attr of ["placeholder", "title", "aria-label", "alt"]) {
      if (node.hasAttribute && node.hasAttribute(attr)) {
        const v = node.getAttribute(attr), t = translateText(v);
        if (t !== null) node.setAttribute(attr, t);
      }
    }
    for (let c = node.firstChild; c; c = c.nextSibling) walk(c);
  }

  function applyTranslation() {
    if (LANG !== "pt") return;
    document.documentElement.lang = "pt";
    walk(document.body);
    new MutationObserver((muts) => {
      for (const m of muts) m.addedNodes.forEach((n) => walk(n));
    }).observe(document.body, { childList: true, subtree: true });
  }

  function injectSwitcher() {
    const nav = document.querySelector(".top-nav");
    if (!nav) return;
    const wrap = document.createElement("span");
    wrap.className = "lang-switch";
    wrap.innerHTML =
      `<button data-lang="en" title="English" class="${LANG === "en" ? "on" : ""}">🇬🇧</button>` +
      `<button data-lang="pt" title="Português (PT)" class="${LANG === "pt" ? "on" : ""}">🇵🇹</button>`;
    wrap.querySelectorAll("button").forEach((b) =>
      b.addEventListener("click", () => {
        localStorage.setItem("nftw:lang", b.dataset.lang);
        location.reload();
      }));
    nav.appendChild(wrap);
  }

  function init() { injectSwitcher(); applyTranslation(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
