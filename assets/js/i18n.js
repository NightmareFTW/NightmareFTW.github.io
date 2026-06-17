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

    // ---- Common content labels ----
    "How to use.": "Como usar.", "How to.": "Como fazer.", "Risk.": "Risco.", "Tip.": "Dica.",
    "How to": "Como usar", "Where:": "Onde:", "From:": "De:",
    "Information": "Informação", "Reveal": "Revelar", "Gamble": "Aposta",
    "Force evidence": "Forçar evidência", "Tracking": "Localização", "Protection": "Proteção",
    "Utility": "Utilitário",

    // ---- Phasmophobia: Cursed Possessions ----
    "Click evidence once to mark it": "Clica uma vez na evidência para a marcar como",
    "found": "encontrada", "rule it out": "excluir", "twice to": ", duas vezes para",
    ". Ghosts narrow down live.": ". Os fantasmas filtram em tempo real.",
    "The 7 cursed possessions — what they do, how to use them, the risk, and tips. Click a card to expand.":
      "Os 7 objetos amaldiçoados — o que fazem, como usá-los, o risco e dicas. Clica num cartão para expandir.",
    "Ask the ghost questions out loud and get answers — room, age, number of ghosts, bone location and more.":
      "Faz perguntas ao fantasma em voz alta e recebe respostas — sala, idade, número de fantasmas, localização do osso e mais.",
    "Place it down, hold Use, and speak a question. Answers appear as text. Common safe questions: \"Where are you?\", \"How old are you?\", \"How many people are in this room?\"":
      "Pousa-o, mantém Usar e faz uma pergunta. As respostas aparecem em texto. Perguntas seguras comuns: \"Where are you?\", \"How old are you?\", \"How many people are in this room?\"",
    "Every question drains sanity. Asking about death/age or using it below ~0% sanity can trigger an immediate hunt. The board can break after answering.":
      "Cada pergunta gasta sanidade. Perguntar sobre morte/idade ou usá-lo abaixo de ~0% de sanidade pode despoletar um hunt imediato. O tabuleiro pode partir após responder.",
    "Answer-hunting is fastest with high group sanity. Avoid \"death\" questions; stop using it under ~30% sanity unless you're ready to hide.":
      "É mais rápido com a sanidade do grupo alta. Evita perguntas de morte; para de o usar abaixo de ~30% de sanidade a não ser que estejas pronto para te esconderes.",
    "Lures the ghost into manifesting and walking toward the box, revealing it in the open.":
      "Atrai o fantasma a manifestar-se e a caminhar até à caixa, revelando-o a descoberto.",
    "Pick it up and activate. If the ghost is within range the music plays clearly and it manifests near the box. If it's too far the tune distorts and your sanity drains.":
      "Pega nela e ativa. Se o fantasma estiver no alcance, a música toca nítida e ele manifesta-se perto da caixa. Se estiver longe, a melodia distorce e gastas sanidade.",
    "Sanity drains while it plays out of range. The ghost will eventually smash it.":
      "Gastas sanidade enquanto toca fora de alcance. O fantasma acabará por a destruir.",
    "Brilliant for a clear ghost photo. Hold it at arm's length and snap the manifestation before the box breaks.":
      "Excelente para uma foto nítida do fantasma. Segura-a afastada e fotografa a manifestação antes de a caixa partir.",
    "Forces the ghost to appear at the circle for a long manifestation.":
      "Força o fantasma a aparecer no círculo numa manifestação longa.",
    "Light all 5 candles (you need an igniter/lighter). Once lit, the ghost is summoned to the centre and manifests for several seconds.":
      "Acende todas as 5 velas (precisas de um isqueiro). Acesas, o fantasma é invocado para o centro e manifesta-se durante vários segundos.",
    "Massive sanity drain and it forces a hunt right after. Everyone nearby is exposed.":
      "Gasta imensa sanidade e força um hunt logo a seguir. Todos por perto ficam expostos.",
    "One of the best ghost-photo tools. Set up, light, photograph, then immediately run and hide — a hunt is coming.":
      "Das melhores ferramentas para foto do fantasma. Monta, acende, fotografa e foge e esconde-te já — vem aí um hunt.",
    "Draw a card from a 10-card deck for a random effect, good or bad. Cards burn after use.":
      "Tira uma carta de um baralho de 10 para um efeito aleatório, bom ou mau. As cartas queimam após o uso.",
    "Hold Use to draw a random card. Effects below are the notable draws:":
      "Mantém Usar para tirar uma carta aleatória. Abaixo estão as cartas mais relevantes:",
    "The Fool — nothing happens (can mimic another card).": "The Fool — nada acontece (pode imitar outra carta).",
    "The Sun — large sanity restore.": "The Sun — grande recuperação de sanidade.",
    "The Moon — sets your sanity to 0%.": "The Moon — põe a tua sanidade a 0%.",
    "The Star — small sanity restore.": "The Star — pequena recuperação de sanidade.",
    "The Wheel of Fortune — green flame: +sanity; red flame: −sanity.": "The Wheel of Fortune — chama verde: +sanidade; chama vermelha: −sanidade.",
    "The Devil — forces a ghost event / interaction.": "The Devil — força um evento / interação do fantasma.",
    "The Hermit — teleports the ghost to its room and pins it briefly.": "The Hermit — teletransporta o fantasma para a sala dele e prende-o por instantes.",
    "The High Priestess — revives one dead teammate.": "The High Priestess — revive um colega morto.",
    "Death — curses you with a guaranteed hunt.": "Death — amaldiçoa-te com um hunt garantido.",
    "The Hanged Man — instantly kills the person who drew it.": "The Hanged Man — mata instantaneamente quem a tirou.",
    "Death and The Hanged Man are dangerous. Drawing near 0% sanity is risky.":
      "Death e The Hanged Man são perigosas. Tirar cartas perto de 0% de sanidade é arriscado.",
    "The Hermit is a lifesaver during a hunt. Don't gamble the last cards at low sanity — Death can end the run.":
      "The Hermit salva vidas durante um hunt. Não arrisques as últimas cartas com pouca sanidade — Death pode acabar a partida.",
    "Shows the ghost's favourite room through the glass.": "Mostra a sala preferida do fantasma através do vidro.",
    "Hold Use to look into it — the reflection shows the ghost room. The glass cracks the longer you use it.":
      "Mantém Usar para olhar — o reflexo mostra a sala do fantasma. O vidro racha quanto mais o usares.",
    "Drains sanity while active. Once fully cracked it breaks and is gone.":
      "Gasta sanidade enquanto ativo. Quando racha por completo, parte e desaparece.",
    "Fast way to locate the room early on big maps. Use in short bursts and stop when it cracks.":
      "Forma rápida de localizar a sala cedo em mapas grandes. Usa em rajadas curtas e para quando rachar.",
    "Forces ghost interactions on demand by pinning body parts.":
      "Força interações do fantasma ao espetar alfinetes nas partes do corpo.",
    "Hold Use to push a pin into a random part. Each pin forces a ghost interaction (sound, throw, etc.).":
      "Mantém Usar para espetar um alfinete numa parte aleatória. Cada alfinete força uma interação (som, atirar, etc.).",
    "Pinning the heart (random chance) forces a hunt. Sanity drains with each pin.":
      "Espetar o coração (hipótese aleatória) força um hunt. Gastas sanidade a cada alfinete.",
    "Handy for triggering writing/throw interactions when the ghost is shy — but stop before it forces a hunt.":
      "Útil para forçar interações de escrita/atirar quando o fantasma é tímido — mas para antes de forçar um hunt.",
    "Grants wishes — each with a cursed downside. Limited wishes per paw.":
      "Concede desejos — cada um com uma contrapartida amaldiçoada. Desejos limitados por pata.",
    "Hold it and say \"I wish for…\". Known wishes and their catch:":
      "Segura-a e diz \"I wish for…\". Desejos conhecidos e a sua armadilha:",
    "\"…sanity\" — restores sanity, but the ghost gets faster / fog rolls in.":
      "\"…sanity\" — recupera sanidade, mas o fantasma fica mais rápido / surge nevoeiro.",
    "\"…to see the ghost\" — the ghost manifests, but turns very aggressive.":
      "\"…to see the ghost\" — o fantasma manifesta-se, mas fica muito agressivo.",
    "\"…for safety\" — no hunts for a short time, then dense fog.":
      "\"…for safety\" — sem hunts por pouco tempo, depois nevoeiro denso.",
    "\"…for the ghost to go away\" — it leaves the area briefly, but returns angrier.":
      "\"…for the ghost to go away\" — afasta-se da zona por instantes, mas regressa mais furioso.",
    "\"…to leave\" — opens the exit, but at a steep curse.":
      "\"…to leave\" — abre a saída, mas com uma maldição pesada.",
    "\"…for life\" — revives a teammate, with a heavy downside.":
      "\"…for life\" — revive um colega, com uma contrapartida pesada.",
    "Every wish has a curse. Wording matters — wish carefully.":
      "Todo o desejo tem uma maldição. As palavras importam — pede com cuidado.",
    "Treat it as a last resort. The 'safety' wish can buy a teammate time to revive or escape.":
      "Trata-a como último recurso. O desejo 'safety' pode dar tempo a um colega para reviver ou fugir.",

    // ---- Phasmophobia: Ghost Evidence Checker ----
    "FOUND": "ENCONTRADA", "RULED OUT": "EXCLUÍDA", "+ fake Orbs": "+ Orbs falsas",
    "Smudge sticks stop it hunting for 180s (vs 90s normal).": "O smudge impede-o de caçar por 180s (vs 90s normal).",
    "Never steps in salt; can teleport to a player.": "Nunca pisa sal; pode teletransportar-se para um jogador.",
    "Photo makes it vanish; visible less during hunts.": "A foto fá-lo desaparecer; menos visível durante hunts.",
    "Throws multiple objects at once.": "Atira vários objetos ao mesmo tempo.",
    "Targets one player; sings on the parabolic mic.": "Foca um jogador; canta no micro parabólico.",
    "Faster at distance; can't hunt early if you turn off the breaker.": "Mais rápido à distância; não caça cedo se desligares o quadro elétrico.",
    "More active in the dark; can turn lights off.": "Mais ativo no escuro; consegue apagar luzes.",
    "Very fast when chasing, slow otherwise. Hide!": "Muito rápido a perseguir, lento de resto. Esconde-te!",
    "Shy — won't hunt if players are grouped.": "Tímido — não caça se os jogadores estiverem juntos.",
    "Hunts very often; smudge cooldown shortened.": "Caça muito; reduz o efeito do smudge.",
    "Smudging it traps it in a room for a while.": "Fazer smudge prende-o numa sala durante algum tempo.",
    "More active with people nearby; no airball events.": "Mais ativo com pessoas por perto; sem eventos de airball.",
    "Talking near it angers it; only hears nearby speech during hunts.": "Falar perto enfurece-o; só ouve fala próxima durante hunts.",
    "Faster in cold rooms, slower in warm. Freezing always present.": "Mais rápido em salas frias, lento nas quentes. Freezing sempre presente.",
    "Only shows D.O.T.S on a video feed, not in person.": "Só mostra D.O.T.S numa câmara de vídeo, não em pessoa.",
    "Quieter during hunts; more frequent paranormal sounds.": "Mais silencioso durante hunts; sons paranormais mais frequentes.",
    "Flame (candle) blowing out can trigger a hunt.": "Apagar uma chama (vela) pode despoletar um hunt.",
    "Two interaction sources; either twin can hunt.": "Duas fontes de interação; qualquer um dos gémeos pode caçar.",
    "Faster near active electronics.": "Mais rápido perto de eletrónica ligada.",
    "May leave unusual (6-finger) fingerprints; UV can fade fast.": "Pode deixar impressões invulgares (6 dedos); o UV pode desaparecer rápido.",
    "Mimics other ghosts; ALWAYS shows Ghost Orbs as a 4th fake evidence.": "Imita outros fantasmas; mostra SEMPRE Ghost Orbs como 4ª evidência falsa.",
    "Curses via Spirit Box; faster the lower your sanity.": "Amaldiçoa via Spirit Box; mais rápido quanto menor a tua sanidade.",
    "Always senses you; very fast far away, crawls when close.": "Sente-te sempre; muito rápido ao longe, rasteja quando perto.",
    "Ages over time — starts fast/aggressive, slows down.": "Envelhece com o tempo — começa rápido/agressivo e abranda.",
    "Flickers between calm and aggressive; hunts faster when aggravated.": "Alterna entre calmo e agressivo; caça mais rápido quando irritado.",
    "Protective equipment provokes it, making gear less effective until it tires.": "Equipamento de proteção provoca-o, tornando o equipamento menos eficaz até ele cansar.",
    "Strengthened by players moving nearby; weakened when you stay still.": "Fortalece-se com jogadores a mexer-se por perto; enfraquece quando ficas quieto.",
    "Nearly blind — stay silent and motionless and it may walk right past.": "Quase cego — fica em silêncio e imóvel e ele pode passar ao lado.",
    "Accelerates hard with line of sight; break LoS to lose it.": "Acelera muito com linha de visão; corta a LoS para o despistar.",
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
    [/^of (\d+) ghosts match\.$/, "de $1 fantasmas correspondem."],
    [/^(\d+) ghosts\. Mark evidence to narrow down\.$/, "$1 fantasmas. Marca evidências para filtrar."],
    [/^(\d+) drops? · updated (.+)$/, "$1 drops · atualizado $2"],
    [/^Showing (\d+) of ([\d,]+) — refine to narrow down$/, "A mostrar $1 de $2 — refina para reduzir"],
    [/^(\d+) recipe[s]? · sources: (.+)$/, "$1 receitas · fontes: $2"],
    [/^(\d+) farmable items · source: (.+)$/, "$1 items farmáveis · fonte: $2"],
    [/^(\d+) drops · updated (.+)$/, "$1 drops · atualizado $2"],
    [/^(\d+)\/(\d+) duties done$/, "$1/$2 duties feitas"],
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
