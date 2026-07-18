/* Lightweight EN ⇄ PT-PT i18n.
   Adds a flag switcher to the header and translates the page by matching text
   against a dictionary (English → Portuguese). Works on static HTML and on
   JS-rendered content (via a MutationObserver), so no markup changes are needed.
   The default language is English; choosing PT stores the choice and reloads. */
(function () {
  // Load the accounts + settings-sync module on every page (this script is global).
  if (!document.querySelector('script[data-nftw-auth]')) {
    const a = document.createElement("script");
    a.src = "/assets/js/auth.js?v=09646644"; a.defer = true; a.setAttribute("data-nftw-auth", "");
    document.head.appendChild(a);
  }
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
    "Less grind,": "Menos grind,", "more game": "mais jogo",
    "A growing toolbox — calculators, checklists and trackers. Nothing gets removed; it just keeps growing.":
      "Uma caixa de ferramentas em crescimento, com calculadoras, checklists e trackers. Nada é removido, só continua a crescer.",
    // ---- Account / profile ----
    "Your profile": "O teu perfil", "profile": "perfil",
    "Reset your password": "Repor a password",
    "New password": "Nova password", "Set new password": "Definir nova password",
    "The link is valid for 1 hour. After resetting, sign in from the hub with your new password.":
      "O link é válido durante 1 hora. Depois de repores, entra no hub com a nova password.",
    "🕵️ New —": "🕵️ Novo em",
    ": browser games you can jump into. First up:": ": jogos de browser onde podes entrar já. A começar:",
    "Games": "Jogos",

    // ---- Play / Murdoku ----
    "Play": "Jogar", "play": "jogar", "in the browser": "no browser",
    "Play in the browser.": "Joga no browser.",
    "Small original games to pass the time — no install, no account needed. Sign in to sync your progress across devices.":
      "Pequenos jogos originais para passar o tempo, sem instalação nem conta. Inicia sessão para sincronizar o teu progresso entre dispositivos.",
    "A murder-mystery logic puzzle. Read the clue cards, work the deduction grid and name the culprit. Chapters of endless cases.":
      "Um enigma de lógica policial. Lê os cartões de pistas, preenche a grelha de dedução e descobre o culpado. Capítulos de casos infinitos.",
    "More coming": "Mais a caminho",
    "New browser games get added here over time.": "Vão sendo adicionados novos jogos de browser ao longo do tempo.",
    "A logic puzzle on a procedurally-built floor plan: part Sudoku, part detective work. Read the clue cards, work out the exact tile everyone stood on, and name the culprit. Chapters of endless cases; your progress saves on this device and syncs to your account when you sign in.":
      "Um enigma de lógica numa planta gerada à medida: parte Sudoku, parte investigação. Lê os cartões de pistas, descobre a casa exacta onde cada pessoa estava e aponta o culpado. Capítulos de casos infinitos; o teu progresso é guardado neste dispositivo e sincroniza com a tua conta quando inicias sessão.",
    "Built by NightmareFTW · Murdoku is an original logic-deduction game. Pixel-art tiles & avatars are original / DiceBear.":
      "Feito por NightmareFTW · o Murdoku é um jogo de dedução lógica original. Os tiles pixel-art & avatares são originais / DiceBear.",

    // ---- Tool names (cards + page titles) ----
    "Ghost Evidence Checker": "Verificador de Evidências",
    "Cursed Possession Reference": "Referência de Objectos Amaldiçoados",
    "Equipment Guide": "Guia de Equipamento", "Progression Tracker": "Tracker de Progresso",
    "Loadout Builder": "Construtor de Loadout", "Daily / Weekly Checklist": "Checklist Diária / Semanal",
    "Enemies & Counters": "Inimigos & Counters", "Trials & Maps Guide": "Guia de Trials & Mapas",
    "Recommended Builds": "Builds Recomendadas",
    "Every Ex-Pop, Night Hunter and Prime Asset — behaviour and how to deal with each.":
      "Todos os Ex-Pops, Night Hunters e Prime Assets — comportamento e como lidar com cada um.",
    "Every trial's full objective walkthrough plus the map screenshot.":
      "O walkthrough completo de objectivos de cada trial mais a screenshot do mapa.",
    "Meta rig + amp loadouts for each role, with the reasoning behind them.":
      "Loadouts meta de rig + amps para cada função, com a justificação.",
    // ---- DDV Animal Guide ----
    "Animal Guide": "Guia de Animais",
    "Every critter — food, schedule, DLC & how to approach — plus all event/shop companions, with a collection tracker.":
      "Cada critter — comida, horário, DLC & como aproximar — mais todos os companions de evento/loja, com tracker de colecção.",
    "Wild Critters": "Critters Selvagens", "Companions (event / shop)": "Companions (evento / loja)",
    "Any approach": "Qualquer aproximação", "Collected": "Colectados", "Not collected": "Não colectados",
    "All sources": "Todas as fontes", "Search…": "Procurar…",
    "Red Light, Green Light": "Luz Vermelha, Luz Verde", "Tag (chase)": "Apanhada (perseguir)",
    "Patience (wait)": "Paciência (esperar)", "Just approach": "Aproxima-te directo",
    "Always around": "Sempre por perto",
    "Event": "Evento", "Premium": "Premium", "Quest Reward": "Recompensa de Quest", "Craftable": "Craftável",
    "Event reward (limited-time — returns in rotations/Star Paths)": "Recompensa de evento (tempo limitado — volta em rotações/Star Paths)",
    "Premium Shop (bought with Moonstones)": "Loja Premium (comprado com Moonstones)",
    "Reward from a quest": "Recompensa de uma quest", "Crafted at a crafting station": "Craftado numa estação de fabrico",
    "Every wild critter — favourite food, when it appears, which DLC, and how to approach it to feed it — plus a section for every collectible companion (event, premium shop, quest & craftable). Tick what you've collected; it dims and you can filter by it.":
      "Cada critter selvagem — comida favorita, quando aparece, que DLC, e como te aproximares para o alimentar — mais uma secção para cada companion colecionável (evento, loja premium, quest & craftável). Marca o que já colectaste; fica esbatido e podes filtrar por isso.",
    "Critter data, schedules & companion sources from the Dreamlight Valley Wiki; names from the game's official PT-BR data. Your collection is saved on this device.":
      "Dados de critters, horários & fontes de companions da Dreamlight Valley Wiki; nomes dos dados oficiais PT-BR do jogo. A tua colecção é guardada neste dispositivo.",
    "Favourite:": "Favorita:", "How to approach:": "Como aproximar:", "Liked:": "Gosta:",
    "No critters match.": "Nenhum critter corresponde.", "No companions match.": "Nenhum companion corresponde.",
    "No variants match.": "Nenhuma variante corresponde.", "Couldn't load animal data.": "Não foi possível carregar os dados dos animais.",
    "Red Light, Green Light: Stop when they have their heads up. Go when they have their heads down. Repeat until they lay on their bellies. Approach them carefully to start the game.":
      "Luz Vermelha, Luz Verde: Para quando têm a cabeça levantada. Avança quando têm a cabeça baixa. Repete até se deitarem de barriga. Aproxima-te com cuidado para começar o jogo.",
    "Tag: When you have caught their attention, chase after them until they stop.":
      "Apanhada: Quando tiveres a atenção deles, persegue-os até pararem.",
    "Red Light, Green Light: Watch their body language, and approach when they are relaxed. When they are alert, with their head up, remain still - otherwise, the Critter will move to a new location.":
      "Luz Vermelha, Luz Verde: Observa a linguagem corporal e aproxima-te quando estão relaxados. Quando estão alerta, com a cabeça levantada, fica imóvel — senão, o animal muda de sítio.",
    "Patience: Wait until they have finished circling your head.":
      "Paciência: Espera até acabarem de circular a tua cabeça.",
    "Patience: Wait until they are ready to come out of their shells. You can also drop food, like seaweed, in front of them and they will come out immediately.":
      "Paciência: Espera até estarem prontos para sair da carapaça. Também podes largar comida, como algas, à frente deles e saem logo.",
    "Patience: Wait until they aren't shy.": "Paciência: Espera até deixarem de ser tímidos.",
    "Squirrels play no games. Simply approach and be ready to feed them!": "Os esquilos não brincam. Aproxima-te simplesmente e prepara-te para os alimentar!",
    "Sunbirds play no games. Simply approach and be ready to feed them!": "Os sunbirds não brincam. Aproxima-te simplesmente e prepara-te para os alimentar!",
    "Capybaras play no games. Simply approach and be ready to feed them!": "As capivaras não brincam. Aproxima-te simplesmente e prepara-te para as alimentar!",
    "Owls play no games. Simply approach and be ready to feed them!": "As corujas não brincam. Aproxima-te simplesmente e prepara-te para as alimentar!",
    "Every Ex-Pop, Night Hunter and Prime Asset — how it behaves and exactly how to deal with it.":
      "Todos os Ex-Pops, Night Hunters e Prime Assets — como se comportam e exactamente como lidar com cada um.",
    "Every Trial and the map it runs on — the full objective walkthrough plus the map screenshot. Click a map to expand its steps.":
      "Cada Trial e o mapa onde decorre — o walkthrough completo de objectivos mais a screenshot do mapa. Clica num mapa para expandir os passos.",
    "Meta loadouts for different roles — rig + amps that work together, with the reasoning. A loadout is 1 Rig + 1 Tool + 1 Skill + 1 Medicine amp.":
      "Loadouts meta para diferentes funções — rig + amps que combinam, com a justificação. Um loadout é 1 Rig + 1 Tool + 1 Skill + 1 Medicine amp.",
    "How to deal with it:": "Como lidar:",
    "All": "Todos", "Common": "Comum", "Specialist": "Especialista", "Night Hunter": "Night Hunter", "Prime Asset": "Prime Asset",
    "Low": "Baixo", "Medium": "Médio", "High": "Alto", "Boss": "Boss",
    "Rig": "Rig", "Tool Amp": "Tool Amp", "Skill Amp": "Skill Amp", "Medicine Amp": "Medicine Amp",
    "↗ Recreate in the Loadout Builder": "↗ Recriar no Construtor de Loadout",
    "Search maps, trials or objectives…": "Procurar mapas, trials ou objectivos…",
    "Search maps, trials, objectives or tips…": "Procurar mapas, trials, objectivos ou dicas…",
    "Couldn't load trial data.": "Não foi possível carregar os dados dos trials.",
    "Elite": "Elite", "Objectives": "Objectivos", "Tips": "Dicas",
    "Map layouts — find objectives, documents & routes": "Layouts do mapa — encontra objectivos, documentos & rotas",
    "🗺 Open the interactive maps ↗": "🗺 Abrir os mapas interativos ↗",
    "💡 Survival basics (all trials)": "💡 Básicos de sobrevivência (todos os trials)",
    "💡 Survival basics (all missions)": "💡 Básicos de sobrevivência (todas as missões)",
    "🗺 Open the interactive map": "🗺 Abrir o mapa interativo",
    "🗺 Open the interactive map (Fex)": "🗺 Abrir o mapa interativo (Fex)",
    "Floor maps — click to open the zoomable viewer": "Plantas dos pisos — clica para abrir o visualizador com zoom",
    "Scroll to zoom · drag to pan · double-click to reset": "Scroll para zoom · arrasta para mover · duplo-clique para repor",
    "Scroll to zoom · drag to pan · double-click to reset · pick a floor above": "Scroll para zoom · arrasta para mover · duplo-clique para repor · escolhe um piso acima",
    "Map layouts — objectives, documents & routes": "Layouts do mapa — objectivos, documentos & rotas",
    "This mission's layout": "Layout desta missão", "Prime Asset:": "Prime Asset:",
    "Objective list not on the wiki yet — open the interactive map for the route.":
      "Lista de objectivos ainda não está na wiki — abre o mapa interativo para a rota.",
    "Search maps, missions, objectives or tips…": "Procurar mapas, missões, objectivos ou dicas…",
    "Every map and all of its missions — pick a mission to see its goal, full objectives, strategy tips and floor-plan layout. Open the community interactive maps full-screen for documents, hidden spots & collectibles.":
      "Cada mapa e todas as suas missões — escolhe uma missão para ver o objectivo, objectivos completos, dicas de estratégia e a planta do piso. Abre os mapas interativos da comunidade em ecrã inteiro para documentos, hidden spots & colecionáveis.",
    "🗺 Interactive maps — by": "🗺 Mapas interativos — por", "close ✕": "fechar ✕",
    "The Season 3 (Project Relapse) Prime Asset — a relentless hunter (\"Jaeger\") who tracks Reagents across The Suburbs and punishes anyone who holds still too long.":
      "A Prime Asset da Season 3 (Project Relapse) — uma caçadora implacável (\"Jaeger\") que persegue os Reagents por The Suburbs e pune quem fica parado tempo demais.",
    "Stay mobile and keep changing rooms so she can't lock your trail. Break her tracking with line-of-sight cuts, and save a Blind/Stun rig for when she closes the gap.":
      "Mantém-te em movimento e muda de sala para ela não fixar o teu rasto. Quebra o tracking cortando a linha de visão, e guarda um rig Blind/Stun para quando ela se aproximar.",
    "The Season 4 (Project Diarchy) twin Prime Assets — two hunters who patrol the Shopping Mall and can pincer you from both sides.":
      "As Prime Assets gémeas da Season 4 (Project Diarchy) — dois caçadores que patrulham o Shopping Mall e te podem cercar pelos dois lados.",
    "Never get caught between them — track both before committing to a room. Use the mall's escalators and shops to put a wall between you and one twin while you handle the other.":
      "Nunca fiques entre eles — localiza os dois antes de entrar numa sala. Usa as escadas rolantes e lojas do centro comercial para pôr uma parede entre ti e um gémeo enquanto tratas do outro.",
    "The Season 5 (Project Messiah) Prime Asset who stalks the Resort, keeping relentless pressure on the team.":
      "A Prime Asset da Season 5 (Project Messiah) que percorre o Resort, mantendo pressão implacável sobre a equipa.",
    "No top-down layout on the wiki yet — use the interactive maps above for objectives, documents & hidden spots.":
      "Ainda sem layout de cima na wiki — usa os mapas interativos acima para objectivos, documentos & hidden spots.",
    // ---- Outlast: build roles, tags, names ----
    "Solo": "Solo", "Co-op": "Co-op", "Solo / Co-op": "Solo / Co-op",
    "Awareness": "Perceção", "Support": "Suporte", "Aggro": "Aggro", "Survival": "Sobrevivência", "Speed": "Velocidade", "Control": "Controlo",
    "Solo Stealth Scout": "Batedor Furtivo Solo", "Team Medic": "Médico de Equipa", "Crowd Control Bruiser": "Bruto de Controlo de Multidões",
    "Escape Artist": "Artista da Fuga", "Objective Rusher": "Rusher de Objectivos", "Lockdown Anchor": "Âncora de Bloqueio",
    // ---- Outlast: build rationale ----
    "X-Ray lets you see enemies through walls so you never round a corner blind. Noise Reduction + Invisible keep you off their radar while you scout and grab objectives; Incognito buys extra time when you do get spotted.":
      "O X-Ray deixa-te ver inimigos através das paredes para nunca virares uma esquina às cegas. Noise Reduction + Invisible mantêm-te fora do radar deles enquanto exploras e apanhas objectivos; o Incognito dá tempo extra quando és detectado.",
    "Heal Rig keeps the squad topped up from range. Battery Charger keeps your rig online, Hide and Heal lets you recover safely in lockers, and Double Doses stretches every medicine pickup — you become the reason the team survives MK runs.":
      "O Heal Rig mantém a equipa curada à distância. O Battery Charger mantém o teu rig activo, Hide and Heal deixa-te recuperar em segurança nos cacifos, e Double Doses estica cada medicina apanhada — passas a ser a razão de a equipa sobreviver às MK runs.",
    "Stun Rig freezes a chasing enemy (or a Big Grunt) so the team can push past. Short Circuit speeds rig cooldown, Strong Arm shoves enemies off teammates, and Boosted keeps your stamina up for the constant repositioning.":
      "O Stun Rig congela um inimigo a perseguir (ou um Big Grunt) para a equipa passar. Short Circuit acelera o cooldown do rig, Strong Arm empurra inimigos para longe dos colegas, e Boosted mantém a tua stamina para o reposicionamento constante.",
    "Blind a hunter to break a chase on demand. Slippers make you near-silent, Quick Escape rips you out of grabs faster, and Last Chance gives a clutch survival window — built to slip away from Night Hunters and Prime Assets.":
      "Cega um caçador para quebrar uma perseguição quando quiseres. Slippers tornam-te quase silencioso, Quick Escape liberta-te de agarrões mais depressa, e Last Chance dá uma janela de sobrevivência decisiva — feito para escapar a Night Hunters e Prime Assets.",
    "Lock Breaker shreds locked doors so you blitz objectives; Blind Rig clears the path when something's in the way. Hide and Breathe resets your sanity/stamina in cover and Surplus keeps resources flowing for a fast clear.":
      "O Lock Breaker arromba portas trancadas para correres os objectivos; o Blind Rig limpa o caminho quando algo está à frente. Hide and Breathe repõe a sanidade/stamina em cobertura e Surplus mantém os recursos a fluir para um clear rápido.",
    "Barricade Rig seals doors to control where enemies can reach you. Key Master speeds locks, Door Trap Breaker safely clears rigged doors, and Self Revive means a solo mistake doesn't end the run — a self-sufficient survival kit.":
      "O Barricade Rig sela portas para controlar por onde os inimigos te chegam. Key Master acelera fechaduras, Door Trap Breaker limpa portas armadilhadas em segurança, e Self Revive faz com que um erro a solo não acabe a run — um kit de sobrevivência autossuficiente.",
    // ---- Outlast: enemy behaviour & counters ----
    "The basic Ex-Pop. Patrols rooms and chases the moment it sees or hears you, swinging a melee weapon.":
      "O Ex-Pop básico. Patrulha salas e persegue assim que te vê ou ouve, com uma arma corpo-a-corpo.",
    "Break line of sight around a corner, vault or slide through gaps, and hide in a locker or under a bed — they quickly lose interest. Cheap to shake off; don't panic-sprint into a dead end.":
      "Corta a linha de visão numa esquina, salta ou desliza por aberturas, e esconde-te num cacifo ou debaixo de uma cama — perdem o interesse depressa. Fácil de despistar; não corras em pânico para um beco sem saída.",
    "A massive, simple-minded heavy. Slow but hits like a truck and can smash through some obstacles; melee can down you fast on higher tiers.":
      "Um pesado enorme e simplório. Lento mas bate como um camião e pode destruir alguns obstáculos; o corpo-a-corpo derruba-te depressa em dificuldades altas.",
    "Never out-run it in a straight line — use tight corners, vaults and windows it's slow to follow through. A Blind or Stun rig buys an escape. Keep an exit; avoid dead ends entirely.":
      "Nunca fujas em linha reta — usa esquinas apertadas, saltos e janelas que ele atravessa devagar. Um rig Blind ou Stun dá tempo para fugir. Mantém uma saída; evita becos sem saída.",
    "Stands dormant until it spots you or hears noise, then lets out a scream that stuns you and alerts every nearby Ex-Pop to your position.":
      "Fica imóvel até te ver ou ouvir barulho, depois solta um grito que te atordoa e alerta todos os Ex-Pop por perto para a tua posição.",
    "They're stationary — spot them early and sneak past quietly. Never sprint near one. A Blind throwable / rig shuts the scream down if you must pass close.":
      "São estáticos — detecta-os cedo e passa em silêncio. Nunca corras perto de um. Um Blind (atirável/rig) cala o grito se tiveres de passar perto.",
    "Gas-masked Ex-Pop that lobs and sprays psychosis gas, distorting your vision and spawning hallucinations that disorient you.":
      "Ex-Pop com máscara de gás que atira e pulveriza gás de psicose, distorcendo a visão e criando alucinações que te desorientam.",
    "Leave the cloud immediately — don't fight or loot inside it. The hallucinations can't actually hurt you; keep moving to clean air and reorient.":
      "Sai da nuvem imediatamente — não lutes nem saqueies lá dentro. As alucinações não te magoam; continua a andar para ar limpo e reorienta-te.",
    "Hides in dark corners and vents, then ambushes and pins you in place for a grab.":
      "Esconde-se em cantos escuros e condutas, depois embosca-te e prende-te para te agarrar.",
    "Carry your light and sweep dark nooks before walking in. Listen for its lurking cue. If grabbed, mash to break free or have a teammate melee it off you.":
      "Leva a tua luz e varre os cantos escuros antes de entrar. Ouve a pista de que está à espreita. Se fores agarrado, martela para te libertares ou pede a um colega para o tirar de cima de ti.",
    "A relentless elite Ex-Pop that pursues you with high speed and aggression, ignoring most distractions once it locks on.":
      "Um Ex-Pop de elite implacável que te persegue com muita velocidade e agressividade, ignorando a maioria das distrações quando te fixa.",
    "Don't duel it — keep doing objectives and rotate. Use rigs to peel it off, never get cornered, and keep two escape routes open at all times.":
      "Não o enfrentes — continua os objectivos e roda. Usa rigs para o afastar, nunca fiques encurralado e mantém sempre duas rotas de fuga abertas.",
    "A flaying killer who stalks the Police Station with a blade, punishing players who linger or loot greedily.":
      "Um assassino esfolador que percorre a Police Station com uma lâmina, punindo quem se demora ou saqueia em excesso.",
    "Keep distance and break line of sight constantly; use the environment to lose him. Grab objectives and move — don't get greedy.":
      "Mantém distância e corta a linha de visão constantemente; usa o ambiente para o despistar. Apanha os objectivos e segue — não sejas ganancioso.",
    "A corrupt, taunting cop with an electrified baton who charges and stuns. His baton hit is brutal in the open.":
      "Um polícia corrupto e provocador com um bastão electrificado que investe e atordoa. O golpe do bastão é brutal em campo aberto.",
    "Bait the charge, then dodge around cover or a vault as he commits. Fight near windows/vaults so you can break away — never trade in open rooms.":
      "Provoca a investida, depois esquiva-te à volta de cobertura ou de um salto quando ele se compromete. Joga perto de janelas/saltos para poderes fugir — nunca troques golpes em salas abertas.",
    "A deranged clown with a candy cart who deploys 'Gooseberry juice' gas and toys, and sings to track your location.":
      "Uma palhaça desequilibrada com um carrinho de doces que liberta gás de 'sumo Gooseberry' e brinquedos, e canta para te localizar.",
    "Avoid her gas and don't linger near the cart. Work objectives while she patrols, and keep rigs ready to escape a grab.":
      "Evita o gás dela e não te demores perto do carrinho. Trata dos objectivos enquanto ela patrulha, e mantém rigs prontos para escapar a um agarrão.",
    "A hulking mobster Prime Asset with devastating melee that bullies you around the Docks.":
      "Um Prime Asset mafioso e corpulento com corpo-a-corpo devastador que te encurrala pelos Docks.",
    "Use vertical and tight routes to create space; never get cornered against the water. Rigs to break grabs and reset the chase.":
      "Usa rotas verticais e apertadas para criar espaço; nunca fiques encurralado contra a água. Rigs para quebrar agarrões e reiniciar a perseguição.",
    "The Season 5 Prime Asset who stalks the Resort, keeping relentless pressure on the team.":
      "A Prime Asset da Season 5 que percorre o Resort, mantendo pressão implacável sobre a equipa.",
    "Keep moving and use cover and rotations; prioritise objectives over hiding in place, and save escape rigs for when she closes in.":
      "Mantém-te em movimento e usa cobertura e rotações; prioriza os objectivos em vez de te esconderes parado, e guarda rigs de fuga para quando ela se aproximar.",
    // ---- Outlast: intro overrides ----
    "Rebirth is the final therapy step in The Outlast Trials — the Reagent Release Protocol, where you either become a Reborn agent or attempt to escape.":
      "Rebirth é o passo final da terapia no The Outlast Trials — o Reagent Release Protocol, onde te tornas um agente Reborn ou tentas escapar.",
    "Escape is a temporary Trial in The Outlast Trials where Reagents try to flee the Sinyala Facility through the Waste Tunnel.":
      "Escape é um Trial temporário no The Outlast Trials onde os Reagents tentam fugir da Instalação Sinyala pelo Waste Tunnel.",
    // ---- Outlast: trial objectives ----
    "Infiltrate the Police Station": "Infiltrar a Police Station", "Reach the Security Room": "Chegar à Sala de Segurança",
    "Get to the Snitch": "Chegar ao Snitch", "Push the Snitch": "Empurrar o Snitch",
    "Reach the Basement (Introductory difficulty)": "Chegar à Cave (dificuldade Introdutória)",
    "Start the Generators in the Basement": "Ligar os Geradores na Cave", "Get back to the Snitch": "Voltar ao Snitch",
    "Find the Key": "Encontrar a Chave", "Find the Other Keys": "Encontrar as Outras Chaves",
    "Open the Admin Gate (Introductory difficulty)": "Abrir o Portão da Administração (dificuldade Introdutória)",
    "Open the Detective Gate (Introductory difficulty)": "Abrir o Portão dos Detectives (dificuldade Introdutória)",
    "Open the Execution Room Gate (Introductory difficulty)": "Abrir o Portão da Sala de Execução (dificuldade Introdutória)",
    "Electrocute the Snitch": "Electrocutar o Snitch", "Enter the Orphanage": "Entrar no Orphanage",
    "Broadcast the Religious Station": "Transmitir a Estação Religiosa", "Tune Radio Receivers in the Dorms": "Sintonizar os Recetores de Rádio nos Dormitórios",
    "Return to the Reception Desk": "Voltar à Recepção", "Swap Film Reels in Classrooms": "Trocar os Rolos de Filme nas Salas de Aula",
    "Stop the Blasphemers in the Chapel": "Parar os Blasfemos na Capela", "Power up Generators": "Ligar os Geradores",
    "Find Saw Handle Keys": "Encontrar as Chaves do Cabo da Serra", "Serve the Body of Christ": "Servir o Corpo de Cristo",
    "Regroup in the Chapel": "Reagrupar na Capela", "Return to the Shuttle": "Voltar à Carrinha",
    "Wait for the Shuttle": "Esperar pela Carrinha", "Exit the Trial": "Sair do Trial",
    "Infiltrate the Fun Park": "Infiltrar o Fun Park", "Reach the Root Canal Ride": "Chegar ao Root Canal Ride",
    "Get access to the Root Canal Ride": "Obter acesso ao Root Canal Ride", "Regroup into the Root Canal": "Reagrupar no Root Canal",
    "Push the Boat": "Empurrar o Barco", "Power off the Barriers": "Desligar as Barreiras", "Raise the Water Level": "Subir o Nível da Água",
    "Infiltrate the Toy Factory": "Infiltrar a Toy Factory", "Reach the Production Line": "Chegar à Linha de Produção",
    "Start the Production Line": "Iniciar a Linha de Produção", "Unlock the Security System": "Desbloquear o Sistema de Segurança",
    "Find Wax Boxes in Storage": "Encontrar as Caixas de Cera no Armazém", "Complete all Production Steps": "Completar todos os Passos de Produção",
    "Reroute the Production Line": "Redirecionar a Linha de Produção", "Burn the Sex Toy": "Queimar o Brinquedo Sexual",
    "Infiltrate the Courthouse": "Infiltrar o Courthouse", "Reach the Courtroom": "Chegar à Sala de Audiências",
    "Unlock the Evidence": "Desbloquear as Provas", "Drop the Evidence in the Fountain": "Largar as Provas na Fonte",
    "Gather Acid and pour into the Fountain": "Recolher Ácido e despejar na Fonte", "Destroy the Remaining Evidence": "Destruir as Provas Restantes",
    "Return to the Courtroom": "Voltar à Sala de Audiências", "Kill the Witness": "Matar a Testemunha",
    "Kill the remaining Witnesses": "Matar as Testemunhas restantes", "Execute the Judge": "Executar o Juiz",
    "Gain Access to the Main Plaza": "Obter Acesso à Praça Principal", "Access the Department Store": "Aceder ao Centro Comercial",
    "Win a Ticket": "Ganhar um Bilhete", "Use the Ticket to Enter the Event": "Usar o Bilhete para Entrar no Evento",
    "Regroup to Fill the Fountain": "Reagrupar para Encher a Fonte", "Fix the Water Pressure": "Reparar a Pressão da Água",
    "Fix the Fountain Valves": "Reparar as Válvulas da Fonte", "Execute The Politician": "Executar O Político",
    "Gain Access to the Theater": "Obter Acesso ao Teatro", "Explore the Theater": "Explorar o Teatro",
    "Throw away the Kinky Mannequins": "Deitar fora os Manequins Pervertidos", "Find and Install the Sadist Mannequin": "Encontrar e Instalar o Manequim Sádico",
    "Get the Remaining Sadist Mannequins": "Obter os Manequins Sádicos Restantes", "Execute The District Attorney": "Executar O Procurador",
    "Reach the Town Hall": "Chegar à Câmara Municipal", "Find the Union Boss In the Mansion": "Encontrar o Chefe do Sindicato na Mansion",
    "Find a way to Open the Panic Room": "Encontrar forma de Abrir a Sala do Pânico", "Escort the Union Boss to the Factory": "Escoltar o Chefe do Sindicato até à Fábrica",
    "Hit the Correct Safety Sign": "Acertar no Sinal de Segurança Correcto", "Drown the Union Boss": "Afogar o Chefe do Sindicato",
    "Infiltrate the Studio": "Infiltrar o Estúdio", "Ruin the conference": "Arruinar a conferência",
    "Follow the Idol to Studio 1": "Seguir o Ídolo até ao Estúdio 1", "Setup the scene on the Studio floor": "Preparar a cena no piso do Estúdio",
    "Reach the Studio control room": "Chegar à sala de controlo do Estúdio", "Find codes and use them on the switchboard": "Encontrar códigos e usá-los no quadro de comando",
    "Sabotage the recording": "Sabotar a gravação", "Escort the Idol to Studio 2": "Escoltar o Ídolo até ao Estúdio 2",
    "Join the Idol to Studio 2": "Juntar-te ao Ídolo no Estúdio 2", "Prepare Studio 2 for recording": "Preparar o Estúdio 2 para gravação",
    "Escort the Idol to Studio 3": "Escoltar o Ídolo até ao Estúdio 3", "Recharge the power stations": "Recarregar as estações de energia",
    "Join the Idol to Studio 3": "Juntar-te ao Ídolo no Estúdio 3", "Find the Drug Laboratory": "Encontrar o Laboratório de Droga",
    "Start the Drug Production": "Iniciar a Produção de Droga", "Put Drugs into the Cooker": "Colocar Droga no Cozedor",
    "Push Cart to the Train Depot for Refilling": "Empurrar o Carrinho até ao Depósito do Comboio para Reabastecer", "Refill the Cart with Drugs": "Reabastecer o Carrinho com Droga",
    "Deliver the Cart to the Laboratory": "Entregar o Carrinho ao Laboratório", "Put Poison into the Drugs": "Colocar Veneno na Droga",
    "Add Poison from the Chemical Storage": "Adicionar Veneno do Armazém Químico", "Cut and Package the Poisoned Drugs": "Cortar e Embalar a Droga Envenenada",
    "Hide the Drugs in the Cargo Hold": "Esconder a Droga no Porão de Carga", "Infiltrate the Resort": "Infiltrar o Resort",
    "Register for the Auction": "Inscrever-te no Leilão", "Deposit the Initial Contribution": "Depositar a Contribuição Inicial",
    "Cover the Rest of the Balance": "Cobrir o Resto do Saldo", "Start the Auction": "Iniciar o Leilão", "Destroy the Lot": "Destruir o Lote",
    "Who are you?": "Quem és tu?", "Hear the Words.": "Ouve as Palavras.", "See the Words.": "Vê as Palavras.",
    // ---- Outlast: general survival tips ----
    "Crouch-walk and break line of sight — most Ex-Pop lose you within seconds once they can't see you.":
      "Anda agachado e corta a linha de visão — a maioria dos Ex-Pop perde-te em segundos quando deixa de te ver.",
    "Lockers and under-beds reset a chase, but a Pouncer may be hiding in dark spots — shine your light first.":
      "Cacifos e debaixo das camas reiniciam uma perseguição, mas um Pouncer pode estar escondido em cantos escuros — ilumina primeiro.",
    "Loot side rooms for batteries, lockpicks and meds before triggering loud objectives (generators, alarms).":
      "Saqueia as salas laterais por pilhas, gazuas e medicinas antes de accionar objectivos barulhentos (geradores, alarmes).",
    "Save your rig for grab-escapes and Prime Asset encounters, not trash mobs.":
      "Guarda o teu rig para escapar a agarrões e para os Prime Assets, não para inimigos comuns.",
    "In co-op, split roles: one handles the noisy objective while the others scout and peel enemies.":
      "Em co-op, dividam funções: um trata do objectivo barulhento enquanto os outros exploram e afastam inimigos.",
    // ---- Outlast: per-trial tips ----
    "The Snitch is pushed to his death — protect the slow, exposed push route.":
      "O Snitch é empurrado até à morte — protege a rota de empurrão, lenta e exposta.",
    "Basement generators are loud; clear nearby enemies first or post a watcher.":
      "Os geradores da cave são barulhentos; limpa os inimigos próximos primeiro ou põe um vigia.",
    "The Skinner Man stalks here — keep a locker or window in reach while looting the security room.":
      "O Skinner Man ronda aqui — mantém um cacifo ou janela ao alcance enquanto saqueias a sala de segurança.",
    "You're defenceless while carrying an orphan — scout and clear the route first.":
      "Estás indefeso enquanto carregas um órfão — explora e limpa a rota primeiro.",
    "Leland Coyle charges with an electrified baton; bait the charge near cover, then break away.":
      "O Leland Coyle investe com um bastão electrificado; provoca a investida perto de cobertura e depois foge.",
    "Use the chapel basement and second floor to shake chases.":
      "Usa a cave da capela e o segundo piso para despistar perseguições.",
    "The Root Canal boat ride is the hub — power off the barriers, then push the boat together.":
      "O Root Canal boat ride é o centro — desliga as barreiras e depois empurrem o barco juntos.",
    "Sightlines are wide open; hug stalls and rides for cover.":
      "As linhas de visão são muito abertas; cola-te a bancas e atrações para te cobrires.",
    "Group up before the boat push so a hunter can't pick off a straggler.":
      "Juntem-se antes do empurrão do barco para um caçador não apanhar um isolado.",
    "Machinery noise masks enemy audio — rely on sight and the X-Ray rig.":
      "O barulho das máquinas mascara o áudio dos inimigos — confia na visão e no X-Ray rig.",
    "Mother Gooseberry's gas lingers; never fight or loot inside it.":
      "O gás da Mother Gooseberry fica no ar; nunca lutes nem saqueies lá dentro.",
    "Long trial — bank meds and batteries between objectives.":
      "Trial longo — acumula medicinas e pilhas entre objectivos.",
    "Multi-floor — use the lobby and second-floor layouts to plan routes between objectives.":
      "Vários pisos — usa os layouts do átrio e do segundo piso para planear rotas entre objectivos.",
    "The scales-of-justice area is a chokepoint; clear it before committing.":
      "A zona da balança da justiça é um ponto de estrangulamento; limpa-a antes de avançar.",
    "Courtrooms echo — move during ambient noise to mask your steps.":
      "As salas de audiências têm eco — move-te durante o ruído ambiente para mascarar os passos.",
    "Big open mall floors — use shops and escalators to break line of sight.":
      "Pisos amplos do centro comercial — usa lojas e escadas rolantes para cortar a linha de visão.",
    "Track the politician's patrol and isolate him from nearby enemies.":
      "Segue a patrulha do político e isola-o dos inimigos próximos.",
    "Mind the long sightlines on the atrium; cross them only when clear.":
      "Atenção às linhas de visão longas no átrio; atravessa-as só quando estiver livre.",
    "Street-level with long sightlines — move building to building, off the open road.":
      "Ao nível da rua com linhas de visão longas — move-te de edifício em edifício, fora da estrada aberta.",
    "Use alleys and interiors to rotate around patrols.":
      "Usa becos e interiores para rodar à volta das patrulhas.",
    "Watch for Pushers funnelling you into the open with gas.":
      "Cuidado com Pushers a empurrar-te para o aberto com gás.",
    "Spread-out houses — clear each before grabbing objectives.":
      "Casas espalhadas — limpa cada uma antes de apanhar objectivos.",
    "Ambushes happen between yards; cross gaps deliberately, not on a sprint.":
      "Há emboscadas entre os quintais; atravessa as aberturas com cuidado, não a correr.",
    "Keep an escape house in mind for when a hunter locks on.":
      "Tem uma casa de fuga em mente para quando um caçador te fixar.",
    "Studio sets are maze-like — learn the loops to lose hunters.":
      "Os cenários do estúdio são labirínticos — aprende os circuitos para despistar caçadores.",
    "Stage lighting creates dark pockets where Pouncers lurk; light them up.":
      "A iluminação de palco cria zonas escuras onde os Pouncers espreitam; ilumina-as.",
    "Use prop cover, but don't get cornered on a closed set.":
      "Usa adereços como cobertura, mas não fiques encurralado num cenário fechado.",
    "Franco 'Il Bambino' bullies tight spaces — keep to looping, vertical routes near the water.":
      "O Franco 'Il Bambino' domina os espaços apertados — mantém-te em rotas verticais e em circuito perto da água.",
    "Don't get cornered against the docks edge.":
      "Não fiques encurralado contra a beira dos docks.",
    "Save a rig charge to break his grab and reset the chase.":
      "Guarda uma carga do rig para quebrar o agarrão dele e reiniciar a perseguição.",
    "Season 5 trial — Liliya Bogomolova keeps relentless pressure; prioritise objectives over hiding.":
      "Trial da Season 5 — a Liliya Bogomolova mantém pressão implacável; prioriza os objectivos em vez de te esconderes.",
    "Rotate cover constantly and keep two exits open.":
      "Roda de cobertura constantemente e mantém duas saídas abertas.",
    "Bank resources before the auction-floor objectives.":
      "Acumula recursos antes dos objectivos do piso do leilão.",
    "Story finale with heavy enemy density — co-ordinate rig usage and don't over-extend.":
      "Final da história com muita densidade de inimigos — coordenem o uso de rigs e não se exponham demais.",
    "Stick together; a downed solo player is hard to revive in the crush.":
      "Fiquem juntos; um jogador caído sozinho é difícil de reviver no meio da confusão.",
    "Clear a fallback route before each objective.":
      "Limpa uma rota de recuo antes de cada objectivo.",
    "Linear escape — keep moving, don't stop to fight.":
      "Fuga linear — continua em movimento, não pares para lutar.",
    "Use the tunnels' tight turns to shake pursuers.":
      "Usa as curvas apertadas dos túneis para despistar os perseguidores.",
    "Push through as a group so no one is left behind a closing gap.":
      "Avancem em grupo para ninguém ficar para trás numa passagem a fechar.",
    // ---- Outlast: layout labels ----
    "Ground Floor Map": "Mapa do Piso Térreo", "Second Floor Map": "Mapa do Segundo Piso",
    "First Floor Lobby Map": "Mapa do Átrio (1º Piso)", "First Floor Outside Courtroom Map": "Mapa Exterior da Sala (1º Piso)",
    "Faith broadcast map": "Mapa da transmissão Faith", "Sabotage The Lockdown Map": "Mapa Sabotage The Lockdown",
    "GTBA Map": "Mapa GTBA", "Punish The Miscreants Map": "Mapa Punish The Miscreants",
    "Tilt The Scales of Justice Map": "Mapa Tilt The Scales of Justice", "ShoppingMall Map": "Mapa Shopping Mall",
    "Daily Checklist": "Checklist Diária", "Gathering Node Timer": "Timer de Nós de Recolha",
    "Gear Score Calculator": "Calculadora de Gear Score", "Damage / EHP Calculator": "Calculadora de Dano / EHP",
    "Speed Tuning / Turn Order": "Speed Tuning / Ordem de Turnos", "Worldstate Tracker": "Tracker de Worldstate",
    "Open-World Cycle Timers": "Timers de Ciclos (Mundo Aberto)", "Drop Table": "Tabela de Drops",
    "Tier List & Builds": "Tier List & Builds", "Star Path Tracker": "Tracker do Star Path",
    "Recipe Browser": "Navegador de Receitas", "Friendship Tracker": "Tracker de Amizade",
    "Items Database": "Base de Dados de Items",
    // tool type chips
    "tracker": "tracker", "checklist": "checklist", "builder": "construtor", "calculator": "calculadora",
    "timer": "timer", "reference": "referência", "guide": "guia", "simulator": "simulador",
    "live": "ao vivo", "database": "base de dados", "tier list": "tier list",

    // ---- Game blurbs ----
    "Co-op horror ghost hunting.": "Caça aos fantasmas co-op de terror.",
    "Co-op survival horror.": "Survival horror co-op.",
    "MMORPG.": "MMORPG.",
    "Turn-based gacha RPG.": "RPG gacha por turnos.",
    "Sci-fi co-op looter shooter.": "Looter shooter co-op de ficção científica.",
    "Cozy life-sim adventure.": "Aventura life-sim acolhedora.",
    "Open-world action RPG.": "RPG de acção de mundo aberto.",

    // ---- The Other Side ----
    "Co-op ghost hunting — gather evidence and identify the entity.": "Caça aos fantasmas co-op: reúne evidências e identifica a entidade.",
    "Ghost Reference": "Referência de Fantasmas",
    "Mark the evidence you've found and narrow the 18 ghosts down live.": "Marca as evidências que encontraste e reduz os 18 fantasmas em tempo real.",
    "Every ghost and its unique three-evidence combo, searchable and filterable.": "Cada fantasma e a sua combinação única de três evidências, pesquisável e filtrável.",
    "Every evidence tool and which of the 6 evidence types it detects.": "Cada ferramenta de evidência e qual dos 6 tipos de evidência detecta.",
    "Search ghost…": "Procurar fantasma…", "No ghosts match.": "Nenhum fantasma corresponde.",
    "Loading ghosts…": "A carregar fantasmas…", "Loading equipment…": "A carregar equipamento…",
    "Search tool…": "Procurar ferramenta…",

    // ---- Ravenswatch ----
    "Dark-fantasy co-op roguelite — fairy-tale heroes against the Nightmares.":
      "Roguelite co-op de fantasia sombria: heróis de contos de fadas contra os Pesadelos.",
    "Hero Reference": "Referência de Heróis",
    "Build Directions": "Direcções de Build",
    "Talent Database": "Base de Dados de Talentos",
    "/ build directions": "/ direcções de build",
    "What each hero's talent pool actually builds into — the keyword themes, how many talents feed them and which you can take from the start.":
      "Aquilo em que o conjunto de talentos de cada herói realmente resulta: os temas por palavra-chave, quantos talentos os alimentam e quais podes escolher logo de início.",
    "Ravenswatch builds are decided by the talents you pick during a run. This shows, for each hero, which build each one's talent pool actually supports: the keyword themes, how many talents feed them, and which are available from the start. Talent data from the":
      "As builds do Ravenswatch decidem-se pelos talentos que escolhes durante a run. Isto mostra, para cada herói, que builds o seu conjunto de talentos suporta mesmo: os temas por palavra-chave, quantos talentos os alimentam e quais estão disponíveis de início. Dados dos talentos da",
    "These are derived from the talent data, not a hand-picked meta list: the game writes its mechanics as keywords in the talent text, and the wiki's own new-player guidance is to keep taking talents that share a keyword with what you already have. A theme is listed when at least 3 of a hero's 26 talents feed it. For full community builds with items, use the official":
      "Isto é derivado dos dados dos talentos, não é uma lista de meta escolhida à mão: o jogo escreve as suas mecânicas como palavras-chave no texto dos talentos, e o próprio guia da wiki para novos jogadores diz para continuares a escolher talentos que partilhem uma palavra-chave com o que já tens. Um tema aparece quando pelo menos 3 dos 26 talentos do herói o alimentam. Para builds completas da comunidade com itens, usa o oficial",
    "Loading build directions…": "A carregar direcções de build…",
    "Openers": "Aberturas", "Talents available from the start": "Talentos disponíveis desde o início",
    "from the start": "desde o início", "see the full kit →": "ver o kit completo →",
    "Derived from the Ravenswatch Wiki's talent tables.": "Derivado das tabelas de talentos da Ravenswatch Wiki.",
    "Magical Objects": "Objectos Mágicos",
    "Every hero's full kit — trait, attack, power, special, defense and both ultimates, with all their numbers.":
      "O kit completo de cada herói: traço, ataque, poder, especial, defesa e os dois ultimates, com todos os números.",
    "All 26 talents for every hero — filter by hero or upgrade type, search by effect, see what changes per rarity.":
      "Os 26 talentos de cada herói: filtra por herói ou tipo de melhoria, pesquisa por efeito e vê o que muda por raridade.",
    "Every magical object by rarity with its attribute and set bonus, so you know what a pickup does before you take it.":
      "Cada objecto mágico por raridade, com o atributo e o bónus de conjunto, para saberes o que faz antes de o apanhares.",
    "Every hero's full kit. Click a hero for their trait, attack, power, special, defense and both ultimates. Data from the":
      "O kit completo de cada herói. Clica num herói para veres o traço, ataque, poder, especial, defesa e os dois ultimates. Dados da",
    "All 26 talents for every hero, with what each one does and how it scales per rarity. Pick a hero, filter by upgrade type or search any effect. Data from the":
      "Os 26 talentos de cada herói, com o que faz cada um e como escala por raridade. Escolhe um herói, filtra por tipo de melhoria ou pesquisa qualquer efeito. Dados da",
    "Every magical object with its effect and set bonus, so you know what a pickup does before you commit to it. Filter by rarity or search. Data from the":
      "Cada objecto mágico com o seu efeito e bónus de conjunto, para saberes o que faz antes de te comprometeres. Filtra por raridade ou pesquisa. Dados da",
    "Hero kits are auto-scraped from the Ravenswatch Wiki. Ultimate 2 unlocks at hero Rank 6.":
      "Os kits dos heróis são recolhidos automaticamente da Ravenswatch Wiki. O Ultimate 2 desbloqueia no Rank 6 do herói.",
    "Talents are auto-scraped from the Ravenswatch Wiki. \"Changes per rarity\" is the step added at each rarity above Common.":
      "Os talentos são recolhidos automaticamente da Ravenswatch Wiki. \"Muda por raridade\" é o valor acrescentado em cada raridade acima de Comum.",
    "Set bonuses need a minimum number of copies: 5 for Common, 4 for Rare, 3 for Epic. Legendary and Cursed objects are unique and have no set bonus.":
      "Os bónus de conjunto precisam de um número mínimo de cópias: 5 para Comum, 4 para Raro, 3 para Épico. Os objectos Lendários e Amaldiçoados são únicos e não têm bónus de conjunto.",
    "Search hero…": "Procurar herói…", "Search talent or effect…": "Procurar talento ou efeito…",
    "Search object or effect…": "Procurar objecto ou efeito…",
    "No heroes match.": "Nenhum herói corresponde.", "No talents match.": "Nenhum talento corresponde.",
    "No objects match.": "Nenhum objecto corresponde.",
    "Loading heroes…": "A carregar heróis…", "Loading talents…": "A carregar talentos…",
    "Loading objects…": "A carregar objectos…",
    "Rare": "Raro", "Epic": "Épico", "Legendary": "Lendário", "Cursed": "Amaldiçoado",
    "Built by NightmareFTW · hero data via the Ravenswatch Wiki.": "Feito por NightmareFTW · dados dos heróis via Ravenswatch Wiki.",
    "Built by NightmareFTW · talent data via the Ravenswatch Wiki.": "Feito por NightmareFTW · dados dos talentos via Ravenswatch Wiki.",
    "Built by NightmareFTW · object data via the Ravenswatch Wiki.": "Feito por NightmareFTW · dados dos objectos via Ravenswatch Wiki.",

    // ---- Tool descriptions (data.js) ----
    "Select the evidence you've found and instantly narrow down the ghost.":
      "Selecciona as evidências encontradas e descobre o fantasma instantaneamente.",
    "All 7 cursed possessions — usage, risks and tips for each.":
      "Os 7 objectos amaldiçoados — uso, riscos e dicas de cada um.",
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
      "Sortie, Fissures, Arbitration e Baro Ki'Teer ao vivo — directo da API.",
    "Live day/night & warm/cold timers for Cetus, Vallis, Cambion, Duviri and Earth.":
      "Timers ao vivo de dia/noite e quente/frio para Cetus, Vallis, Cambion, Duviri e Earth.",
    "Searchable relic & mission drops with multi-select filters and sorting.":
      "Drops de relíquias e missões pesquisáveis, com filtros multi-selecção e ordenação.",
    "A simple daily/weekly routine tracker that resets on its own.":
      "Um tracker simples de rotina diária/semanal que reseta sozinho.",
    "Character rankings (via Game8) with links to builds and best teams.":
      "Rankings de personagens (via Game8) com builds e melhores equipas.",
    "Bond Gift Planner": "Planeador de Gifts de Bond",
    "The 5 best affinity gifts per character — value, cost in Fons, and where to buy.":
      "Os 5 melhores gifts de afinidade por personagem — valor, custo em Fons e onde comprar.",
    "Works on everyone:": "Funciona com todos:",
    "The 5 most affinity-efficient gifts for each character — how much Bond they give, where to buy them and the cost in Fons (in-game currency, no real money). Click a character.":
      "Os 5 gifts mais eficientes em afinidade para cada personagem — quanto Bond dão, onde comprá-los e o custo em Fons (currency do jogo, sem dinheiro real). Clica numa personagem.",
    "Affinity values & prices compiled from GameWith & ZeroLuck.gg; they can shift between patches. Gifts are capped at 3 per character per day (10 total) — spend the +400/+200 slots first. Per-item art will be added once a reliable source is available; for now each gift shows its category icon.":
      "Valores de afinidade & preços compilados do GameWith & ZeroLuck.gg; podem mudar entre patches. Os gifts estão limitados a 3 por personagem por dia (10 no total) — gasta primeiro os slots de +400/+200. As imagens de cada item serão adicionadas quando houver fonte fiável; por agora cada gift mostra o ícone da sua categoria.",
    "Affinity values & prices via GameWith & ZeroLuck.gg · costs in Fons (in-game currency). Max 3 gifts per character/day.":
      "Valores de afinidade & preços via GameWith & ZeroLuck.gg · custos em Fons (currency do jogo). Máx 3 gifts por personagem/dia.",
    "Flower": "Flor", "Electronics": "Electrónica", "Figure": "Figura", "Book": "Livro",
    "Record": "Disco", "Gift Shop": "Loja de Presentes", "Vending": "Máquina", "Special": "Especial",
    "Food & Drink": "Comida e Bebida", "not buyable": "não comprável", "close ×": "fechar ×",
    "Current season's duties with detailed how-to for each, tracked on your device.":
      "As duties da season actual com how-to detalhado, guardadas no teu dispositivo.",
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

    // ---- DDV: Star Path ----
    "Routine Duties": "Duties de Rotina", "repeatable": "repetíveis",
    "· Mount Olympus / Greek gods · 2026-06-03 → 2026-07-28": "· Monte Olimpo / deuses gregos · 2026-06-03 → 2026-07-28",
    "Uproot Night Thorns": "Arrancar Night Thorns", "Collect Star Coins": "Juntar Star Coins",
    "Get crafty!": "Mãos à obra!", "Change outfit": "Mudar de roupa",
    "Find gems with your pickaxe": "Encontrar gemas com a picareta", "Start Discussions": "Iniciar Discussões",
    "Finish some Dreamlight Duties": "Completar Dreamlight Duties", "Earn 5,000 Dreamlight": "Ganhar 5.000 Dreamlight",
    "Catch Fish": "Apanhar peixe", "Harvest Spinach": "Colher Spinach", "Sell Spinach": "Vender Spinach",
    "Take a selfie with Merlin": "Tirar uma selfie com o Merlin",
    "Clear the dark spiky weeds that spawn around the Valley overnight — walk up and hold interact. They respawn daily; check every biome.":
      "Limpa as ervas escuras e espinhosas que surgem pelo Valley durante a noite — aproxima-te e mantém interagir. Reaparecem diariamente; vê todos os biomas.",
    "Earn Star Coins through normal play — sell crops, fish, gems or crafted goods. Selling a stack of high-value crops is fastest.":
      "Ganha Star Coins a jogar normalmente — vende colheitas, peixe, gemas ou items criados. Vender uma pilha de colheitas valiosas é o mais rápido.",
    "Craft anything at a Crafting Station — even cheap items like fences. Craft in bulk to finish instantly.":
      "Cria o que for numa Crafting Station — até items baratos como cercas. Cria em quantidade para terminar logo.",
    "Open your wardrobe and add or swap any single clothing piece, then confirm.":
      "Abre o guarda-roupa e adiciona ou troca uma peça de roupa qualquer, depois confirma.",
    "Mine the sparkling dark rock nodes in any biome. A Pickaxe Polish potion boosts yield; Forgotten Lands and the Mines give the best gems.":
      "Minera os nós de rocha escura brilhante em qualquer bioma. Uma poção Pickaxe Polish aumenta o rendimento; Forgotten Lands e as Minas dão as melhores gemas.",
    "Talk to villagers and pick the daily 'Discussion' option. One per villager per day, so hop between several.":
      "Fala com villagers e escolhe a opção diária 'Discussion'. Uma por villager por dia, por isso passa por vários.",
    "Open the Dreamlight Menu (moon icon), complete the listed duties and redeem them — redeeming is what counts.":
      "Abre o Dreamlight Menu (ícone da lua), completa as duties listadas e resgata-as — resgatar é o que conta.",
    "From completing quests and redeeming Dreamlight Duties. First-time activities give big chunks.":
      "De completar quests e resgatar Dreamlight Duties. Actividades feitas pela 1ª vez dão grandes quantidades.",
    "Fish at any ripple in the Valley. Seaweed does NOT count — aim for the white/gold ripple circles.":
      "Pesca em qualquer ondulação no Valley. Algas NÃO contam — aponta aos círculos de ondulação brancos/dourados.",
    "Buy Spinach Seeds from Goofy in the Glade of Trust, plant, water and harvest. WALL-E's garden doesn't count.":
      "Compra Spinach Seeds ao Goofy na Glade of Trust, planta, rega e colhe. O jardim do WALL-E não conta.",
    "Sell harvested Spinach to any stall. Wait until this duty is ACTIVE before selling, or it won't count.":
      "Vende o Spinach colhido em qualquer banca. Espera que esta duty esteja ACTIVA antes de vender, ou não conta.",
    "Equip the Royal Camera, stand near Merlin with him in frame, and take the photo.":
      "Equipa a Royal Camera, fica perto do Merlin com ele no enquadramento, e tira a foto.",

    // ---- Checklists (FFXIV / NTE / Outlast) ----
    "Daily": "Diário", "Weekly": "Semanal", "Rigs": "Rigs",
    "Duty Roulette: Leveling": "Duty Roulette: Leveling", "Duty Roulette: Trials": "Duty Roulette: Trials",
    "Duty Roulette: Expert": "Duty Roulette: Expert",
    "Grand Company turn-ins (Expert Delivery)": "Entregas Grand Company (Expert Delivery)",
    "Mini Cactpot (3 scratchers)": "Mini Cactpot (3 raspadinhas)", "Beast Tribe / Tribal dailies": "Beast Tribe / dailies tribais",
    "Wondrous Tails": "Wondrous Tails", "Custom Deliveries (12 allowances)": "Custom Deliveries (12 entregas)",
    "Challenge Log": "Challenge Log", "Raid lockout — Savage": "Lockout de raid — Savage",
    "Raid lockout — Normal / Alliance": "Lockout de raid — Normal / Alliance", "Faux Hollows (Unreal)": "Faux Hollows (Unreal)",
    "Hunt: Elite Marks": "Hunt: Elite Marks", "Jumbo Cactpot ticket": "Bilhete Jumbo Cactpot",
    "Daily login reward": "Recompensa de login diária", "Daily commissions / quests": "Comissões / quests diárias",
    "Spend stamina / energy": "Gastar stamina / energia", "Crafting / synthesis run": "Sessão de crafting / síntese",
    "Social / guild check-in": "Check-in social / de guild", "Weekly boss clears": "Clears de bosses semanais",
    "Weekly store purchases": "Compras semanais na loja", "Weekly challenges": "Desafios semanais",
    "Weekly Program completed": "Programa Semanal concluído",

    // ---- FFXIV node timer ----
    "Eorzea Time": "Hora de Eorzea", "Botanist": "Botânico", "Miner": "Minerador", "Up now": "Disponível agora",
    "No nodes match this filter.": "Nenhum nó corresponde a este filtro.",

    // ---- Epic 7: Damage / Gear Score / Speed Tuning ----
    "Offense": "Ataque", "Defense (EHP)": "Defesa (EHP)", "Attack": "Ataque",
    "Crit Chance %": "Crit Chance %", "Crit Damage %": "Crit Damage %", "Skill modifier %": "Modificador de skill %",
    "Target Defense (opt.)": "Defesa do alvo (opc.)", "Effective Attack": "Ataque Efetivo",
    "Avg hit vs target": "Dano médio vs alvo", "Health": "Vida", "Defense": "Defesa",
    "Effective HP": "HP Efetivo", "Damage Reduction": "Redução de Dano",
    "EHP = HP × (1 + DEF/300). Defense scales multiplicatively, so it's usually stronger than raw HP — but is countered by Defense Break.":
      "EHP = HP × (1 + DEF/300). A defesa escala multiplicativamente, por isso costuma ser mais forte que HP puro — mas é contornada por Defense Break.",
    "Substats": "Substats", "Add substats above to score the gear.": "Adiciona substats acima para avaliar a gear.",
    "Reroll / fodder": "Reroll / fodder", "Decent": "Razoável", "Good": "Boa", "Great": "Ótima", "God-tier": "Topo de gama",
    "Turn Order": "Ordem de Turnos", "Units": "Unidades", "Add unit": "Adicionar unidade",

    // ---- NTE Tier List & Builds ----
    "Best Arc": "Melhor Arc", "Best Cartridge": "Melhor Cartridge", "Stat priority": "Prioridade de stats",
    "Recommended team": "Equipa recomendada", "Notes": "Notas", "Build compiled from Game8.": "Build compilada do Game8.",
    "Survival": "Sobrevivência", "Buff": "Buff", "DPS": "DPS", "view build →": "ver build →",
    "CRIT Rate → CRIT DMG, then ATK. Energy Recharge for ult uptime.":
      "CRIT Rate → CRIT DMG, depois ATK. Energy Recharge para uptime do ult.",
    "ATK and Energy Recharge — maximise buff uptime and how often you ult.":
      "ATK e Energy Recharge — maximiza o uptime do buff e a frequência do ult.",
    "HP / DEF for bulk, plus Energy Recharge to keep shields/heals flowing.":
      "HP / DEF para resistência, mais Energy Recharge para manter shields/heals.",
    "DoT-focused — stack Nightmare & Scorch. Her DoT scales off ATK, so grab CRIT first, then ATK; Chaos DMG main stat with The Last Rose.":
      "Focada em DoT — acumula Nightmare & Scorch. O DoT dela escala com ATK, por isso CRIT primeiro, depois ATK; Chaos DMG no stat principal com The Last Rose.",
    "Burst sub-DPS — feeds on recorded Esper cycles for massive ultimates.":
      "Sub-DPS de burst — alimenta-se de ciclos Esper gravados para ultimates enormes.",
    "Blossom/Charge core — empower Vita Buds through team synergy.":
      "Núcleo Blossom/Charge — reforça Vita Buds com sinergia de equipa.",
    "Pulls enemies together and buffs team ATK by 30%. Fits almost every top team.":
      "Junta os inimigos e dá +30% ATK à equipa. Encaixa em quase todas as melhores equipas.",
    "The premier cycler — enables faster rotations for the whole team.":
      "O melhor cycler — permite rotações mais rápidas para toda a equipa.",
    "Boss breaker — specialises in white-bar (Break) damage.":
      "Boss breaker — especialista em dano de barra branca (Break).",
    "Strong enemy-gathering for AoE setups.": "Forte a juntar inimigos para setups de AoE.",
    "Flexible between Charge and Stain reactions; relies on feather stacks.":
      "Flexível entre reações Charge e Stain; depende de feather stacks.",
    "Pure buffer that also helps apply Nova.": "Buffer puro que também ajuda a aplicar Nova.",
    "Team damage-share with damage reflection.": "Partilha de dano da equipa com reflexão de dano.",
    "Best F2P DPS option — strong parry potential.": "Melhor opção de DPS F2P — forte potencial de parry.",
    "Team-wide shields plus DoT — lots of value with little setup.":
      "Shields para toda a equipa mais DoT — muito valor com pouco setup.",
    "Healer with a stationary healing area.": "Healer com uma área de cura estacionária.",

    // ---- Outlast Loadout / misc panels ----
    "(pick 1)": "(escolhe 1)", "Tool Amp": "Amp de Ferramenta", "Skill Amp": "Amp de Habilidade",
    "Medicine Amp": "Amp de Medicina", "Build name (e.g. Solo Stealth)": "Nome da build (ex.: Solo Stealth)",
    "no rig": "sem rig", "Share link copied to clipboard ✓": "Link de partilha copiado ✓",
    "Possible Ghosts": "Fantasmas Possíveis", "Evidence": "Evidências",
    "Substats": "Substats", "Turn Order": "Ordem de Turnos",
    "Away — arrives at": "Ausente — chega a", "leaves in": "sai em", "At": "Em",
    "Could not load worldstate.": "Não foi possível carregar o worldstate.",
    "unavailable": "indisponível", "Inventory loading…": "A carregar inventário…",

    // ---- DDV: Friendship activities & item categories ----
    "Activity": "Actividade", "Base game": "Jogo base", "Unassigned": "Sem atribuição",
    "— activity —": "— actividade —", "Gardening": "Jardinagem", "Fishing": "Pesca",
    "Mining": "Mineração", "Digging": "Escavação", "Foraging": "Recoleção",
    "Vegetables": "Vegetais", "Fruit": "Fruta", "Grains": "Cereais", "Dairy and Oil": "Laticínios e Óleo",
    "Spices": "Especiarias", "Sweets": "Doces", "Ice": "Gelo", "Seafood": "Marisco",
    "Protein": "Proteína", "Gem / Mineral": "Gema / Mineral", "Fish": "Peixe",
    "Flower": "Flor", "Crafting Material": "Material de Craft", "Limited": "Limitado",
    "Ancient Machine": "Máquina Ancestral", "Timebending Part": "Peça de Timebending",
    "Gift": "Presente", "Fragment": "Fragmento", "Furniture": "Mobília", "Snippet": "Snippet",
    "Enchantment": "Encantamento", "Fence / Paving": "Cerca / Pavimento", "Ingredient": "Ingrediente",

    // ---- Common content labels ----
    "How to use.": "Como usar.", "How to.": "Como fazer.", "Risk.": "Risco.", "Tip.": "Dica.",
    "How to": "Como usar", "Where:": "Onde:", "From:": "De:",
    "Information": "Informação", "Reveal": "Revelar", "Gamble": "Aposta",
    "Force evidence": "Forçar evidência", "Tracking": "Localização", "Protection": "Protecção",
    "Utility": "Utilitário",

    // ---- Phasmophobia: Cursed Possessions ----
    "Click evidence once to mark it": "Clica uma vez na evidência para a marcar como",
    "found": "encontrada", "rule it out": "excluir", "twice to": ", duas vezes para",
    ". Ghosts narrow down live.": ". Os fantasmas filtram em tempo real.",
    "The 7 cursed possessions — what they do, how to use them, the risk, and tips. Click a card to expand.":
      "Os 7 objectos amaldiçoados — o que fazem, como usá-los, o risco e dicas. Clica num cartão para expandir.",
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
      "Pega nela e activa. Se o fantasma estiver no alcance, a música toca nítida e ele manifesta-se perto da caixa. Se estiver longe, a melodia distorce e gastas sanidade.",
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
      "Gasta sanidade enquanto activo. Quando racha por completo, parte e desaparece.",
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
    "Throws multiple objects at once.": "Atira vários objectos ao mesmo tempo.",
    "Targets one player; sings on the parabolic mic.": "Foca um jogador; canta no micro parabólico.",
    "Faster at distance; can't hunt early if you turn off the breaker.": "Mais rápido à distância; não caça cedo se desligares o quadro elétrico.",
    "More active in the dark; can turn lights off.": "Mais activo no escuro; consegue apagar luzes.",
    "Very fast when chasing, slow otherwise. Hide!": "Muito rápido a perseguir, lento de resto. Esconde-te!",
    "Shy — won't hunt if players are grouped.": "Tímido — não caça se os jogadores estiverem juntos.",
    "Hunts very often; smudge cooldown shortened.": "Caça muito; reduz o efeito do smudge.",
    "Smudging it traps it in a room for a while.": "Fazer smudge prende-o numa sala durante algum tempo.",
    "More active with people nearby; no airball events.": "Mais activo com pessoas por perto; sem eventos de airball.",
    "Talking near it angers it; only hears nearby speech during hunts.": "Falar perto enfurece-o; só ouve fala próxima durante hunts.",
    "Faster in cold rooms, slower in warm. Freezing always present.": "Mais rápido em salas frias, lento nas quentes. Freezing sempre presente.",
    "Only shows D.O.T.S on a video feed, not in person.": "Só mostra D.O.T.S numa câmara de vídeo, não em pessoa.",
    "Quieter during hunts; more frequent paranormal sounds.": "Mais silencioso durante hunts; sons paranormais mais frequentes.",
    "Flame (candle) blowing out can trigger a hunt.": "Apagar uma chama (vela) pode despoletar um hunt.",
    "Two interaction sources; either twin can hunt.": "Duas fontes de interação; qualquer um dos gémeos pode caçar.",
    "Faster near active electronics.": "Mais rápido perto de electrónica ligada.",
    "May leave unusual (6-finger) fingerprints; UV can fade fast.": "Pode deixar impressões invulgares (6 dedos); o UV pode desaparecer rápido.",
    "Mimics other ghosts; ALWAYS shows Ghost Orbs as a 4th fake evidence.": "Imita outros fantasmas; mostra SEMPRE Ghost Orbs como 4ª evidência falsa.",
    "Curses via Spirit Box; faster the lower your sanity.": "Amaldiçoa via Spirit Box; mais rápido quanto menor a tua sanidade.",
    "Always senses you; very fast far away, crawls when close.": "Sente-te sempre; muito rápido ao longe, rasteja quando perto.",
    "Ages over time — starts fast/aggressive, slows down.": "Envelhece com o tempo — começa rápido/agressivo e abranda.",
    "Flickers between calm and aggressive; hunts faster when aggravated.": "Alterna entre calmo e agressivo; caça mais rápido quando irritado.",
    "Protective equipment provokes it, making gear less effective until it tires.": "Equipamento de protecção provoca-o, tornando o equipamento menos eficaz até ele cansar.",
    "Strengthened by players moving nearby; weakened when you stay still.": "Fortalece-se com jogadores a mexer-se por perto; enfraquece quando ficas quieto.",
    "Nearly blind — stay silent and motionless and it may walk right past.": "Quase cego — fica em silêncio e imóvel e ele pode passar ao lado.",
    "Accelerates hard with line of sight; break LoS to lose it.": "Acelera muito com linha de visão; corta a LoS para o despistar.",

    // ---- Phasmophobia: Equipment Guide ----
    "All": "Todos", "Standard.": "Padrão.",
    "Every item — what it's for, what each tier upgrade changes, how to use it to find evidence, and tips.":
      "Cada equipamento — para que serve, o que muda cada tier, como usá-lo para encontrar evidências, e dicas.",
    "Detects electromagnetic activity. A reading of EMF 5 is one of the seven evidences.":
      "Detecta actividade electromagnética. Uma leitura de EMF 5 é uma das sete evidências.",
    "GheistField Meter — dial display, ~1.7 m range, needle sways with age.": "GheistField Meter — mostrador analógico, alcance ~1,7 m, a agulha oscila com a idade.",
    "K2 Meter — five LED lights, ~2 m range, the classic reader.": "K2 Meter — cinco LEDs, alcance ~2 m, o leitor clássico.",
    "EMF ParaMeter — PDA style, logs the location and value of the last reading.": "EMF ParaMeter — estilo PDA, regista o local e o valor da última leitura.",
    "Carry it near interaction spots (doors, switches, thrown items). Levels 2–4 only confirm activity; a clear flash to 5 is the evidence.":
      "Leva-o perto de pontos de interação (portas, interruptores, objectos atirados). Os níveis 2–4 só confirmam actividade; um flash claro até 5 é a evidência.",
    "Place it down after an interaction to catch the EMF without holding everything. Raiju can make it malfunction.":
      "Pousa-o após uma interação para apanhar o EMF sem segurar tudo. O Raiju pode fazê-lo avariar.",
    "Lets you talk to the ghost; a spoken response is the evidence.": "Permite falar com o fantasma; uma resposta falada é a evidência.",
    "Short range — must be very close, lights off.": "Alcance curto — tens de estar muito perto, luzes apagadas.",
    "Larger response range and on-screen text of responses.": "Maior alcance de resposta e texto das respostas no ecrã.",
    "Widest range — responses from further away and more reliably.": "Maior alcance — respostas de mais longe e mais fiáveis.",
    "Turn the lights off, get close (often alone), and ask: \"Are you here?\", \"Where are you?\". A voice reply = evidence.":
      "Apaga as luzes, aproxima-te (muitas vezes sozinho) e pergunta: \"Are you here?\", \"Where are you?\". Uma resposta por voz = evidência.",
    "Many ghosts only answer when you're alone or at lower sanity. Lights off is essential.":
      "Muitos fantasmas só respondem quando estás sozinho ou com sanidade baixa. Luzes apagadas é essencial.",
    "Reads room temperature. Sub-zero (visible breath) in the ghost room is the evidence.":
      "Lê a temperatura da sala. Abaixo de zero (respiração visível) na sala do fantasma é a evidência.",
    "Standard reading speed.": "Velocidade de leitura padrão.",
    "Faster readings.": "Leituras mais rápidas.",
    "Fastest, and holds the lowest reading.": "Mais rápido, e guarda a leitura mais baixa.",
    "Sweep rooms to find the coldest. Freezing only appears in the ghost's favourite room, so it also helps locate the room.":
      "Percorre as salas para achar a mais fria. O freezing só aparece na sala preferida do fantasma, por isso também ajuda a localizá-la.",
    "If you can see your breath, it's freezing. Hantu always has freezing and moves faster in the cold.":
      "Se vês a tua respiração, está freezing. O Hantu tem sempre freezing e move-se mais rápido no frio.",
    "Reveals fingerprints and footprints left by ghost interactions.": "Revela impressões digitais e pegadas deixadas pelas interações do fantasma.",
    "UV flashlight — dim beam.": "Lanterna UV — feixe fraco.",
    "Brighter UV with a wider beam.": "UV mais forte com feixe mais largo.",
    "Strongest UV, easiest to spot prints.": "UV mais forte, mais fácil ver impressões.",
    "Shine on door handles, light switches, windows and keyboards after the ghost touches them. Glowing prints = evidence.":
      "Aponta a maçanetas, interruptores, janelas e teclados depois de o fantasma lhes tocar. Impressões brilhantes = evidência.",
    "Obake can leave a six-finger print and its prints fade faster than normal. Check switches and handles first.":
      "O Obake pode deixar uma impressão de seis dedos e as dele desaparecem mais rápido. Vê primeiro interruptores e maçanetas.",
    "Projects a grid of green dots; a ghost silhouette walking through them is the evidence.":
      "Projecta uma grelha de pontos verdes; uma silhueta do fantasma a passar por eles é a evidência.",
    "Smaller dot area.": "Área de pontos menor.", "Wider coverage.": "Cobertura maior.", "Widest coverage.": "Cobertura máxima.",
    "Place in the ghost room covering a doorway, ideally with a video camera pointed at it. Watch the feed for a moving silhouette.":
      "Coloca na sala do fantasma a cobrir uma porta, idealmente com uma câmara apontada. Observa o feed à procura de uma silhueta em movimento.",
    "It's far easier to spot D.O.T.S through a video camera on the truck monitor than with your eyes.":
      "É muito mais fácil ver D.O.T.S por uma câmara no monitor da carrinha do que a olho nu.",
    "On night vision it reveals ghost orbs, and it streams D.O.T.S and remote rooms to the truck.":
      "Em visão noturna revela ghost orbs, e transmite D.O.T.S e salas remotas para a carrinha.",
    "Basic camera.": "Câmara básica.", "Improved night vision.": "Visão noturna melhorada.", "Best night vision and clarity.": "Melhor visão noturna e nitidez.",
    "Mount on a tripod in the ghost room with night vision on; watch the truck monitor for floating orbs near the centre.":
      "Monta num tripé na sala do fantasma com visão noturna ligada; observa o monitor da carrinha à procura de orbs a flutuar perto do centro.",
    "Orbs only appear on the night-vision camera feed, never to the naked eye.": "As orbs só aparecem no feed da câmara em visão noturna, nunca a olho nu.",
    "The ghost writes or draws in it.": "O fantasma escreve ou desenha nele.",
    "Plain book.": "Livro simples.", "A light indicates when it has been written in.": "Uma luz indica quando foi escrito.", "Clearer indicator / faster to notice.": "Indicador mais claro / mais fácil de notar.",
    "Place it flat on the floor in the ghost room and leave it — it can't be written in while held. A used page = evidence.":
      "Pousa-o no chão na sala do fantasma e deixa-o — não pode ser escrito enquanto segurado. Uma página usada = evidência.",
    "Spread a few around the room. Myling and Mare write often; some ghosts never will.":
      "Espalha alguns pela sala. O Myling e a Mare escrevem muito; alguns fantasmas nunca o fazem.",
    "Takes photos for money and objectives (ghost, bone, interactions, cursed object, dirty water…).":
      "Tira fotos por dinheiro e objectivos (fantasma, osso, interações, objecto amaldiçoado, água suja…).",
    "Fewer photos, basic quality.": "Menos fotos, qualidade básica.", "More photos and better range.": "Mais fotos e melhor alcance.", "Most photos and best quality.": "Mais fotos e melhor qualidade.",
    "Photograph the ghost, the bone, fingerprints and interactions. Each valid photo pays out.":
      "Fotografa o fantasma, o osso, impressões e interações. Cada foto válida dá dinheiro.",
    "Always grab the Bone (it's an objective) and a clear ghost photo for bonus cash.":
      "Apanha sempre o osso (é objectivo) e uma foto nítida do fantasma para dinheiro extra.",
    "Picks up faint paranormal sounds at distance to help locate the ghost room.":
      "Capta sons paranormais ténues à distância para ajudar a localizar a sala do fantasma.",
    "Short detection range.": "Alcance de detecção curto.", "Longer range.": "Maior alcance.", "Longest range and clearest spikes.": "Maior alcance e picos mais nítidos.",
    "Point it down hallways and open areas; audio spikes and whispers point you toward the ghost.":
      "Aponta por corredores e zonas abertas; picos de áudio e sussurros indicam a direcção do fantasma.",
    "Invaluable on large maps for narrowing down the room before you commit.":
      "Valiosíssimo em mapas grandes para reduzir a sala antes de te comprometeres.",
    "Monitors sound in an area and reports it on the truck map.": "Monitoriza o som numa área e reporta-o no mapa da carrinha.",
    "Covers a small area.": "Cobre uma área pequena.", "Larger area.": "Área maior.", "Largest area and labels the sound type.": "Maior área e identifica o tipo de som.",
    "Place to cover rooms you can't watch; the truck map lights up where sound happens.":
      "Coloca para cobrir salas que não consegues ver; o mapa da carrinha acende onde há som.",
    "Great for covering big open sections to triangulate the room.": "Ótimo para cobrir grandes zonas abertas e triangular a sala.",
    "Pings when something crosses it — useful for tracking ghost movement.": "Apita quando algo o atravessa — útil para seguir o movimento do fantasma.",
    "Basic trigger.": "Accionamento básico.", "Clearer indicator.": "Indicador mais claro.", "Best indicator and range.": "Melhor indicador e alcance.",
    "Mount across a doorway (not on your own path); it lights up and notifies the truck on movement.":
      "Monta a atravessar uma porta (fora do teu caminho); acende e avisa a carrinha quando há movimento.",
    "Place facing across a door away from where you walk to avoid false triggers.":
      "Coloca a apontar através de uma porta, longe de onde andas, para evitar falsos accionamentos.",
    "Prevents a hunt from starting within its radius (it does not stop one already in progress).":
      "Impede que um hunt comece dentro do seu raio (não para um já a decorrer).",
    "~3 m radius, limited uses.": "Raio ~3 m, usos limitados.", "Larger radius.": "Raio maior.", "Largest radius and shows remaining uses.": "Maior raio e mostra os usos restantes.",
    "Place or hold it near the ghost room or during a cursed event. It burns a charge each time it blocks a hunt.":
      "Coloca ou segura perto da sala do fantasma ou durante um evento amaldiçoado. Gasta uma carga sempre que bloqueia um hunt.",
    "Position it where the ghost starts hunts (its room). Useless once a hunt is already active.":
      "Põe-no onde o fantasma começa os hunts (a sala dele). Inútil quando o hunt já está activo.",
    "Blinds the ghost and blocks hunts for a short time; can stop the ghost finding you mid-hunt.":
      "Cega o fantasma e bloqueia hunts por pouco tempo; pode impedir que te encontre a meio de um hunt.",
    "Short burn time.": "Tempo de queima curto.", "Longer burn.": "Queima mais longa.", "Longest burn / extra use.": "Queima mais longa / uso extra.",
    "Light with an igniter. During a hunt, smudge at the ghost's location to blind it for ~6 s and break its line on you.":
      "Acende com um isqueiro. Durante um hunt, faz smudge no local do fantasma para o cegar ~6 s e cortar a linha sobre ti.",
    "Smudging a Spirit stops it hunting for 180 s. Keep one as your emergency escape.":
      "Fazer smudge a um Spirit impede-o de caçar por 180 s. Guarda um como fuga de emergência.",
    "Ghosts may step in it, leaving UV footprints; also an objective.": "Os fantasmas podem pisá-lo, deixando pegadas UV; também é um objectivo.",
    "A couple of piles.": "Algumas pilhas.", "More piles.": "Mais pilhas.", "Most piles.": "Mais pilhas ainda.",
    "Place piles in doorways and the ghost room, then check with UV for glowing footsteps.":
      "Coloca pilhas nas portas e na sala do fantasma, depois verifica com UV à procura de pegadas brilhantes.",
    "A Wraith never steps in salt — disturbed salt with no footprints is a strong hint.":
      "Um Wraith nunca pisa sal — sal mexido sem pegadas é uma forte pista.",
    "Restores sanity, lowering the chance of a hunt.": "Recupera sanidade, reduzindo a hipótese de um hunt.",
    "Small restore.": "Recuperação pequena.", "Medium restore.": "Recuperação média.", "Large restore.": "Recuperação grande.",
    "Take when your sanity drops low, especially before sanity-dependent objectives.":
      "Toma quando a tua sanidade baixar muito, sobretudo antes de objectivos dependentes de sanidade.",
    "Don't burn it early — save it for when low sanity actually puts you at risk.":
      "Não a gastes cedo — guarda-a para quando a sanidade baixa te puser mesmo em risco.",
    "Lights incense, candles and firelights — needed for several other items.":
      "Acende incenso, velas e firelights — necessário para vários outros items.",
    "Limited uses.": "Usos limitados.", "More uses.": "Mais usos.", "Unlimited uses.": "Usos ilimitados.",
    "Equip and use on incense or candles to light them. Required for smudging and summoning circles.":
      "Equipa e usa em incenso ou velas para os acender. Necessário para smudge e círculos de invocação.",
    "The Tier III igniter never runs out — a quality-of-life upgrade worth buying early.":
      "O isqueiro Tier III nunca acaba — uma melhoria de conforto que vale a pena comprar cedo.",
    "A portable light source that keeps working when electronics are unreliable.":
      "Uma fonte de luz portátil que continua a funcionar quando a electrónica falha.",
    "Dim, short.": "Fraca, curta.", "Brighter.": "Mais forte.", "Brightest / longest.": "Mais forte / mais duradoura.",
    "Light it for steady ambient light in a room while you work, without relying on the breaker.":
      "Acende-a para luz ambiente estável numa sala enquanto trabalhas, sem depender do quadro elétrico.",
    "An Onryo can trigger a hunt when a flame is blown out — watch your candles around it.":
      "Um Onryo pode despoletar um hunt quando uma chama se apaga — cuidado com as velas perto dele.",
    "Standard light. Flashlights flicker just before a hunt — a free early warning.":
      "Luz normal. As lanternas piscam mesmo antes de um hunt — um aviso grátis.",
    "Basic beam.": "Feixe básico.", "Brighter beam.": "Feixe mais forte.", "Strong, wide beam.": "Feixe forte e largo.",
    "Light your way; watch for flickering, which signals an imminent hunt so you can hide.":
      "Ilumina o caminho; atento ao piscar, que sinaliza um hunt iminente para te poderes esconder.",
    "If every flashlight in the area flickers, a hunt is starting — get to safety now.":
      "Se todas as lanternas na zona piscarem, está a começar um hunt — põe-te a salvo já.",
    "Mounts a video camera for a stable, aimed view.": "Suporta uma câmara de vídeo para uma vista estável e apontada.",
    "Place it, then put a video camera on top pointing at the room centre or the D.O.T.S projector.":
      "Coloca-o e põe uma câmara em cima apontada ao centro da sala ou ao projector D.O.T.S.",
    "Essential for hands-free orb and D.O.T.S monitoring from the truck.":
      "Essencial para monitorizar orbs e D.O.T.S sem mãos a partir da carrinha.",
    "A worn camera that streams your night-vision view to the truck.": "Uma câmara vestida que transmite a tua visão noturna para a carrinha.",
    "Basic feed.": "Feed básico.", "Improved feed.": "Feed melhorado.", "Best feed.": "Melhor feed.",
    "Wear it so a teammate in the truck can see what you see and guide you.":
      "Veste-a para que um colega na carrinha veja o que vês e te guie.",
    "Perfect for a solo investigator relaying their view to someone watching the monitors.":
      "Perfeito para um investigador solo a transmitir a vista a quem vê os monitores.",

    // ---- Tool subtitles / notes / errors (all games) ----
    "Track every villager's friendship level (0–10). Saved on this device.":
      "Acompanha o nível de amizade de cada villager (0–10). Guardado neste dispositivo.",
    "Every farmable ingredient and where to get it. Filter by category and biome (multi-select), search and sort.":
      "Cada ingrediente farmável e onde o obter. Filtra por categoria e bioma (multi-selecção), pesquisa e ordena.",
    "A catalogue of the valley's items & resources, laid out by category like the in-game collection. Pick a category, then search, filter and sort.":
      "Um catálogo dos items & recursos do valley, organizado por categoria como a colecção do jogo. Escolhe uma categoria, depois pesquisa, filtra e ordena.",
    "Names & locations use the game's official PT-BR data; the rest is compiled from the Dreamlight Valley Wiki. The catalogue covers gathered, crafted & cooked resources (not cosmetics like clothing). DLC tags are best-effort.":
      "Os nomes & locations usam os dados oficiais PT-BR do jogo; o resto vem da Dreamlight Valley Wiki. O catálogo cobre recursos apanhados, craftados & cozinhados (não cosméticos como roupas). As tags de DLC são best-effort.",
    "Data compiled from the Dreamlight Valley Wiki. Covers farmable ingredients (fish/gems can be added). DLC tags are inferred from the item's biome (Eternity Isle = A Rift in Time) and are best-effort.":
      "Dados compilados da Dreamlight Valley Wiki. Cobre ingredientes farmáveis (peixes/gemas podem ser adicionados). As tags de DLC são inferidas pelo bioma do item (Eternity Isle = A Rift in Time) e são best-effort.",
    "Search by recipe or ingredient, filter by star level, and sort by sell value or energy.":
      "Pesquisa por receita ou ingrediente, filtra por estrelas, e ordena por valor de venda ou energia.",
    "Full recipe list compiled from Crystal Dreams (incl. DLC recipes), with sell price & energy from Nintendo Life where available. DLC tags are inferred from DLC-only ingredients and are best-effort.":
      "Lista completa de receitas do Crystal Dreams (incl. receitas de DLC), com preço & energia da Nintendo Life onde disponível. As tags de DLC são inferidas por ingredientes exclusivos de DLC e são best-effort.",
    "Duties rotate during the season — every duty is listed with how to clear it. When a new Star Path starts, ask me to refresh the list.":
      "As duties rodam durante a season — cada uma está listada com how-to. Quando começar um novo Star Path, pede-me para actualizar a lista.",
    "Live day/night and warm/cold cycles. Countdowns update every second; data refreshes from the API every minute.":
      "Ciclos de dia/noite e quente/frio ao vivo. Os countdowns actualizam a cada segundo; os dados renovam da API a cada minuto.",
    "Live data via the Warframe API (api.warframestat.us).": "Dados ao vivo via API do Warframe (api.warframestat.us).",
    "Live data via the Warframe API (api.warframestat.us), PC platform.": "Dados ao vivo via API do Warframe (api.warframestat.us), plataforma PC.",
    "Compare offensive and defensive gear. Uses Epic Seven's defense formula: damage taken = 300 / (300 + DEF).":
      "Compara gear ofensivo e defensivo. Usa a fórmula de defesa do Epic Seven: dano recebido = 300 / (300 + DEF).",
    "Daily section resets at local midnight, weekly resets Monday. Saved on this device.":
      "A secção diária reseta à meia-noite local, a semanal reseta segunda. Guardado neste dispositivo.",
    "Generic gacha routine — once Neverness to Everness's reset times and content are confirmed, ask me to lock the items and reset schedule to the real ones.":
      "Rotina gacha genérica — quando os reset times e conteúdo do Neverness to Everness forem confirmados, pede-me para fixar os items e o horário reais.",
    "Images & tier data via the Phasmophobia Wiki. Tier effects are summarized; exact values can shift between patches.":
      "Imagens & dados de tier via Phasmophobia Wiki. Os efeitos por tier estão resumidos; os valores exactos podem mudar entre patches.",
    "Pick a rig and one amp from each group, name it, save and share. A real loadout is 1 rig + 1 Tool + 1 Skill + 1 Medicine amp.":
      "Escolhe um rig e um amp de cada grupo, dá nome, guarda e partilha. Um loadout real é 1 rig + 1 Tool + 1 Skill + 1 Medicine amp.",
    "The live Eorzea clock and up/next countdowns are exact. The node list is a starter set — tell me which nodes you farm and I'll lock in their items, locations and times.":
      "O relógio de Eorzea e os countdowns up/next são exactos. A lista de nós é um conjunto inicial — diz-me que nós farmas e fixo os items, locais e horas.",
    "Enter a piece's substats (and rolled values) to grade its quality. Speed and crit are weighted highest.":
      "Mete os substats de uma peça (e os valores rolados) para avaliar a qualidade. Speed e crit têm o maior peso.",
    "Weighting follows the common community gear-score model (Speed ×2, Crit Chance ×1.6, Crit Dmg ×1.14, % stats ×1, flats much lower). It's a grading heuristic, not an in-game stat.":
      "A ponderação segue o modelo comunitário de gear-score (Speed ×2, Crit Chance ×1.6, Crit Dmg ×1.14, stats % ×1, flats muito menos). É uma heurística de avaliação, não um stat do jogo.",
    "Search relic and mission drops. Filter by source, rarity, relic tier and planet (multi-select), and sort by drop chance.":
      "Pesquisa drops de relíquias e missões. Filtra por fonte, raridade, tier de relíquia e planeta (multi-selecção), e ordena por hipótese de drop.",
    "Data from DE's official drop tables, parsed by WFCD (drops.warframestat.us). Relic rewards shown at Intact. Refreshed automatically.":
      "Dados das drop tables oficiais da DE, parseados pela WFCD (drops.warframestat.us). Recompensas de relíquia em Intact. Actualizado automaticamente.",
    "Builds & rankings are compiled from Game8 and update as the meta shifts. Want a drag-and-drop personal tier list too? Just ask.":
      "Builds & rankings são compilados do Game8 e actualizam conforme o meta muda. Queres também uma tier list pessoal arrastável? É só pedires.",
    "Enter each unit's Speed and starting CR. The simulator shows the opening turn order — who moves first and how the rotation plays out.":
      "Mete a Speed e o CR inicial de cada unidade. O simulador mostra a ordem de turnos inicial — quem joga primeiro e como roda a rotação.",
    "CR fills proportionally to Speed and overflow carries over after each turn. This models the natural turn order — it doesn't account for CR-push/pull skills or Speed buffs mid-fight.":
      "A CR enche proporcional à Speed e o overflow transita após cada turno. Modela a ordem natural de turnos — não considera skills de CR push/pull nem buffs de Speed a meio do combate.",
    "Rigs persist forever; the weekly section resets automatically. Saved on this device.":
      "Os rigs persistem sempre; a secção semanal reseta automaticamente. Guardado neste dispositivo.",
    "All six rigs are listed. Want to track specific amps, perks or MK-Challenges too? Just ask and I'll add them.":
      "Os seis rigs estão listados. Queres também acompanhar amps, perks ou MK-Challenges específicos? É só pedires.",
    "Live Sortie, Arbitration, Baro Ki'Teer and Void Fissures. Refreshes automatically.":
      "Sortie, Arbitration, Baro Ki'Teer e Void Fissures ao vivo. Actualiza automaticamente.",
    "Couldn't load item data.": "Não foi possível carregar os dados dos items.",
    "Loading furniture…": "A carregar mobília…", "Couldn't load furniture data.": "Não foi possível carregar os dados da mobília.",
    "Loading clothing…": "A carregar roupas…", "Couldn't load clothing data.": "Não foi possível carregar os dados das roupas.",
    "Clothing": "Roupas", "Theme": "Tema", "No furniture match.": "Nenhuma mobília corresponde.",
    "All biomes": "Todos os biomas", "All DLC": "Todos os DLC", "Clear": "Limpar",
    "Couldn't load recipe data.": "Não foi possível carregar os dados das receitas.",
    "Couldn't load the drop table data.": "Não foi possível carregar a drop table.",
    "No news data yet — the news updater hasn't published this game's headlines.":
      "Ainda não há notícias — o actualizador ainda não publicou as deste jogo.",
    "No codes data yet — the updater hasn't published this game's list.":
      "Ainda não há códigos — o actualizador ainda não publicou a lista deste jogo.",
    "Active": "Activo", "Expired": "Expirado", "No expiry listed": "Sem validade indicada",
    "Redeem codes ↗": "Resgatar códigos ↗", "Source": "Fonte",
    "Redeem in Settings → Help → Redemption code. Codes are case-sensitive; rewards arrive in your in-game mailbox. Newest first; retired codes shown as expired.":
      "Resgata em Definições → Ajuda → Código de resgate. Os códigos são sensíveis a maiúsculas; as recompensas chegam ao correio no jogo. Mais recentes no topo; os retirados aparecem como expirados.",
    "Redeem on the official Stove coupon page (button below). Epic Seven codes expire fast — newest at the top; some may already be gone.":
      "Resgata na página oficial de cupões da Stove (botão acima). Os códigos do Epic Seven expiram depressa — os mais recentes no topo; alguns podem já ter expirado.",
    "Redeem on the official promo-code page (button below), or in-game. Glyph/promo codes rotate often.":
      "Resgata na página oficial de promo-codes (botão acima), ou no jogo. Os glyph/promo codes mudam com frequência.",
    "Read the full article at the source ↗": "Ler o artigo completo na fonte ↗",
    "No preview text was available for this article — open the source for the full story.":
      "Não havia texto de pré-visualização para este artigo — abre a fonte para a história completa.",
    "This is a short preview built from the article's own summary and image. The full story lives on the source site.":
      "Esta é uma pré-visualização curta feita a partir do resumo e imagem do próprio artigo. A história completa está no site da fonte.",
    "No drops match your filters.": "Nenhum drop corresponde aos filtros.",
    "No recipes match.": "Nenhuma receita corresponde.", "No items match.": "Nenhum item corresponde.",
    "No tools yet — coming soon.": "Ainda sem ferramentas — em breve.",

    // ---- Subtitle / note fragments (with inline tags) ----
    "Progress is saved on this device and resets automatically —": "O progresso é guardado neste dispositivo e reseta automaticamente —",
    "daily at 15:00 UTC": "diariamente às 15:00 UTC", "weekly Tuesday 08:00 UTC": "semanalmente terça às 08:00 UTC",
    "Live Eorzea clock. Nodes currently": "Relógio de Eorzea ao vivo. Os nós actualmente",
    "up": "disponíveis", "are shown first with their real-time countdown.": "aparecem primeiro com o countdown em tempo real.",
    "Rankings & builds compiled from": "Rankings & builds compilados do",
    ". Click a character to see their build & best team.": ". Clica numa personagem para ver a build & melhor equipa.",
    // Friendship tip
    "Levelling up fast:": "Subir rápido:",
    "the quickest friendship gains come from giving a villager their": "os maiores ganhos de amizade vêm de dar a um villager os seus",
    "daily favourite gifts": "presentes favoritos diários",
    "(the 3 that rotate each day — check the gift icon by their name), having the": "(os 3 que rodam por dia — vê o ícone de presente junto ao nome), ter a",
    "daily chat": "conversa diária",
    ", taking them out as your": ", levá-lo como teu",
    "companion": "companheiro",
    "while you gather/fish/mine, and completing their": "enquanto colhes/pescas/mineras, e completar as suas",
    "Friendship Quests": "Friendship Quests",
    "(which also unlock new realms, recipes and rewards at levels 2, 4, 7 and 10).": "(que também desbloqueiam novos realms, receitas e recompensas nos níveis 2, 4, 7 e 10).",

    // ---- Tool names still missing a translation ----
    "Card Database": "Base de Dados de Cartas", "Character Builds": "Builds de Personagens",
    "Deck Builder": "Construtor de Decks", "Deck Importer": "Importador de Decks",
    "Demon Reference": "Referência de Demónios", "Demon Evidence Checker": "Verificador de Evidências",
    "Event Calendar": "Calendário de Eventos", "Warp Calendar": "Calendário de Warps",
    "Maps & Collectibles": "Mapas & Coleccionáveis", "Meta Builds": "Meta Builds",
    "Missables Checklist": "Checklist de Missables", "Tier List": "Tier List",

    // ---- Leftovers the audit turned up ----
    "Search character…": "Procurar personagem…",
    ", twice to": ", duas vezes para", // evidence checker: "...mark it found, twice to rule it out"
    "Character rankings compiled from": "Rankings de personagens compilados do",
    "Asia (UTC+8)": "Ásia (UTC+8)", "America (UTC−5)": "América (UTC−5)", "Europe (UTC+1)": "Europa (UTC+1)",

    // ---- Breadcrumb tool segments ----
    // Left alone where the PT term is the same word we already use (builds,
    // missables, loadout, tier list, nodes, star path, gear score...).
    "/ character builds": "/ builds de personagens",
    "/ demon reference": "/ referência de demónios",
    "/ demon evidence": "/ evidências de demónios",
    "/ ghost reference": "/ referência de fantasmas",
    "/ ghost evidence": "/ evidências de fantasmas",
    "/ hero reference": "/ referência de heróis",
    "/ talent database": "/ base de dados de talentos",
    "/ magical objects": "/ objectos mágicos",
    "/ equipment": "/ equipamento", "/ evidence": "/ evidências",
    "/ animals": "/ animais", "/ friendship": "/ amizade", "/ recipes": "/ receitas",
    "/ damage": "/ dano", "/ maps": "/ mapas", "/ dailies": "/ diárias",
    "/ event calendar": "/ calendário de eventos", "/ warp calendar": "/ calendário de warps",
    "/ cards": "/ cartas", "/ deck builder": "/ construtor de decks", "/ deck importer": "/ importador de decks",
    "/ bond gifts": "/ presentes de bond", "/ enemies": "/ inimigos",
    "/ trials & maps": "/ trials & mapas", "/ cursed possessions": "/ possessões amaldiçoadas",
    "/ cycles": "/ ciclos", "/ drop table": "/ tabela de drops", "/ profile": "/ perfil",

    // ---- Loading states ----
    "Loading builds…": "A carregar builds…", "Loading demons…": "A carregar demónios…",
    "Loading animals…": "A carregar animais…", "Loading checklist…": "A carregar checklist…",
    "Loading maps…": "A carregar mapas…", "Loading events…": "A carregar eventos…",
    "Loading meta teams…": "A carregar equipas meta…", "Loading tier list…": "A carregar tier list…",
    "Loading banners…": "A carregar banners…", "Loading cards…": "A carregar cartas…",
    "Loading trials…": "A carregar trials…", "Dealing the case…": "A distribuir o caso…",

    // ---- Search placeholders ----
    "Search demon…": "Procurar demónio…", "Search item…": "Procurar item…",
    "Search recipe or ingredient…": "Procurar receita ou ingrediente…",
    "Search build or author…": "Procurar build ou autor…", "Search card…": "Procurar carta…",
    "Search card to add…": "Procurar carta para adicionar…",
    "Name this deck to save it…": "Dá um nome ao deck para o guardares…",
    "Search item, relic or node…": "Procurar item, relíquia ou node…",
    "Paste a deck code here (e.g. eyJDYXJkcyI6W3si…)": "Cola aqui um código de deck (ex.: eyJDYXJkcyI6W3si…)",

    // ---- Buttons, sort options and small labels ----
    "Hide completed": "Esconder concluídos", "Reset all": "Repor tudo",
    "Sort: Name A–Z": "Ordenar: Nome A–Z", "Sort: Sell (high→low)": "Ordenar: Venda (maior→menor)",
    "Sort: Chance (high→low)": "Ordenar: Probabilidade (maior→menor)",
    "Sell (high→low)": "Venda (maior→menor)", "Sell (low→high)": "Venda (menor→maior)",
    "Energy (high→low)": "Energia (maior→menor)", "Star level": "Nível de estrela",
    "Chance (low→high)": "Probabilidade (menor→maior)",
    "Item A–Z": "Item A–Z", "Item Z–A": "Item Z–A",
    "Possible Demons": "Demónios Possíveis", "Compile deck": "Compilar deck",
    "Try a sample": "Experimentar um exemplo", "💾 Save deck": "💾 Guardar deck",
    "Server": "Servidor", "Pinned": "Fixados", "Pinned games": "Jogos fixados",
    "Grid": "Grelha", "List": "Lista", "Compact": "Compacto",
    "(name · SPD · start CR%)": "(nome · SPD · CR% inicial)",

    // ---- Tool subtitles ----
    "Every meta archetype in detail — attribute spread, key perks, cyberware loadout by slot, weapons and exactly how to play it. Tap a build to expand the full breakdown.":
      "Cada arquétipo meta ao detalhe: distribuição de atributos, perks principais, cyberware por slot, armas e exactamente como se joga. Toca numa build para abrir tudo.",
    "Every demon, its three-evidence combo and its key strength & weakness (how to identify and survive it). Filter by evidence or search. Data from the":
      "Cada demónio, a sua combinação de três evidências e a força e fraqueza principais (como o identificar e sobreviver). Filtra por evidência ou pesquisa. Dados da",
    "Every tool, what it does and which evidence it finds. Evidence tools are listed first. Data from the":
      "Cada ferramenta, o que faz e que evidência encontra. As ferramentas de evidência aparecem primeiro. Dados da",
    ". Demons narrow down live. Evidence data from the": ". Os demónios são reduzidos em tempo real. Dados de evidências da",
    ". Ghosts narrow down live. Every ghost has exactly 3 evidence. Data from the":
      ". Os fantasmas são reduzidos em tempo real. Cada fantasma tem exactamente 3 evidências. Dados da",
    "Every ghost and its three-evidence combo. Filter by evidence or search. Data from the":
      "Cada fantasma e a sua combinação de três evidências. Filtra por evidência ou pesquisa. Dados da",
    "Every evidence tool and which of the 6 evidence types it detects, grouped by evidence. Data from the":
      "Cada ferramenta de evidência e qual dos 6 tipos detecta, agrupadas por evidência. Dados da",
    "Proven base-game meta builds — full equipment with item icons, the level-150 attribute spread, the weapon's Ash of War, how to play it and where to get the key pieces. Tap a build to expand.":
      "Builds meta comprovadas do jogo base: equipamento completo com ícones, distribuição de atributos ao nível 150, a Ash of War da arma, como se joga e onde apanhar as peças-chave. Toca numa build para abrir.",
    "Elden Ring's NPC questlines are genuinely, permanently missable — progress the story too far and they break. Track each questline and the world-state triggers so you don't lose one by accident. Ticks are saved on this device.":
      "As questlines de NPC do Elden Ring perdem-se mesmo de forma permanente: avança demasiado na história e partem. Acompanha cada questline e os triggers do mundo para não perderes nenhuma por acidente. As marcações ficam guardadas neste dispositivo.",
    "Five end-game meta team builds. Pick a strategy, then tap each member to see their part of it — weapon & skills, the three Pictos, the Luminas and attributes — laid out like the in-game build screen.":
      "Cinco builds de equipa meta de fim de jogo. Escolhe uma estratégia e toca em cada membro para veres a sua parte: arma e skills, os três Pictos, as Luminas e atributos, dispostos como no ecrã de build do jogo.",
    "What's genuinely missable (mostly a handful of Prologue moments), the points of no return to watch, and the content you can safely clean up later — so you can progress the story without losing anything. Ticks are saved on this device.":
      "O que se perde mesmo (sobretudo alguns momentos do Prólogo), os pontos sem retorno a vigiar e o conteúdo que podes limpar mais tarde sem risco, para avançares na história sem perderes nada. As marcações ficam guardadas neste dispositivo.",
    "Top-rated community loadouts, grouped by primary weapon — each with the full kit (weapons, grenade, spells, hero & mount) and images. Sourced from":
      "Os loadouts da comunidade mais bem votados, agrupados por arma principal, cada um com o kit completo (armas, granada, feitiços, herói e montada) e imagens. Fonte:",
    "and ordered by community votes.": "e ordenados pelos votos da comunidade.",
    "Every region's interactive map with all collectibles, secrets, objectives, ore, loot and more plotted on it. Toggle a category in the legend to show or hide it. Data & maps from":
      "O mapa interactivo de cada região com todos os coleccionáveis, segredos, objectivos, minério, loot e mais. Liga ou desliga uma categoria na legenda. Dados e mapas de",
    "The top armor sets and loadouts in detail — stat spread, set perks, weapons & runic attacks, shield and relic, laid out like the in-game gear screen so a build is easy to recreate. Tap a build to expand.":
      "Os melhores conjuntos de armadura e loadouts ao detalhe: distribuição de stats, perks de conjunto, armas e ataques rúnicos, escudo e relíquia, dispostos como o ecrã de equipamento do jogo para recriares a build com facilidade. Toca numa build para abrir.",
    "Exactly what you can and can't miss, the one time-sensitive area to watch, and a full return-friendly tracker for every favor and collectible — so you can play the story without fear of leaving something behind. Ticks are saved on this device.":
      "Exactamente o que podes e não podes perder, a única zona sensível ao tempo a vigiar e um tracker completo para cada favor e coleccionável, para jogares a história sem receio de deixar algo para trás. As marcações ficam guardadas neste dispositivo.",
    "Per-character build references — best Light Cone, relic set + planar ornament, main stats and substat priority — compiled from":
      "Referências de build por personagem: melhor Light Cone, conjunto de relíquias e ornamento planar, stats principais e prioridade de substats, compiladas do",
    "and refreshed to the live patch. Click a character.": "e actualizadas para o patch actual. Clica numa personagem.",
    "Trailblaze Power, Daily Training and the weekly endgame, auto-resetting on your server's 04:00 clock. Saved on this device. (The 6-week rotation — Memory of Chaos, Pure Fiction, Apocalyptic Shadow — is noted but not on a weekly reset.)":
      "Trailblaze Power, Daily Training e o endgame semanal, com reset automático às 04:00 do teu servidor. Guardado neste dispositivo. (A rotação de 6 semanas, Memory of Chaos, Pure Fiction e Apocalyptic Shadow, está indicada mas não tem reset semanal.)",
    "Current and upcoming in-game events on a timeline, with start/end dates and a live \"today\" marker, compiled from":
      "Eventos actuais e futuros numa linha temporal, com datas de início e fim e um marcador de \"hoje\" ao vivo, compilados do",
    "and refreshed to the live patch.": "e actualizados para o patch actual.",
    "Current best team comps for every DPS, grouped by element and sourced from":
      "As melhores composições de equipa para cada DPS, agrupadas por elemento e retiradas do",
    "— each shows the carry plus the support/sustain roles, refreshed to the live patch.":
      ": cada uma mostra o carry mais os papéis de suporte e sustain, actualizadas para o patch actual.",
    ", refreshed automatically so it tracks the live patch. Click any character for their builds and every team comp they play in.":
      ", actualizada automaticamente para acompanhar o patch actual. Clica numa personagem para veres as builds e todas as composições em que entra.",
    "Character warp banners — what's live now, what's coming next, and recent history — with dates, compiled from":
      "Banners de warp de personagens: o que está activo, o que vem a seguir e o histórico recente, com datas, compilados do",
    "Every released card with art — filter by cost, pool or archetype, or search by name. Click a card for its full details. Data & art from":
      "Cada carta lançada com arte: filtra por custo, pool ou arquétipo, ou pesquisa pelo nome. Clica numa carta para os detalhes completos. Dados e arte de",
    ", refreshed daily.": ", actualizado diariamente.",
    "Tap cards to add them to your 12-card deck (no duplicates). See the energy curve, copy the in-game deck code, and your deck is saved on your device (and synced if you're signed in). Cards from":
      "Toca nas cartas para as juntares ao teu deck de 12 (sem repetidas). Vê a curva de energia, copia o código do deck para o jogo, e o deck fica guardado no teu dispositivo (e sincronizado se tiveres sessão iniciada). Cartas de",
    "Drag a card onto the deck above, or tap it to add. Search and filter the pool below.":
      "Arrasta uma carta para o deck acima, ou toca para a adicionares. Pesquisa e filtra a pool em baixo.",
    "Found a build on": "Encontraste uma build no", "? Hit their": "? Carrega no botão",
    "button (or the in-game one) and paste the deck code below — it compiles the full deck here: every card, the energy curve and the archetype.":
      "deles (ou no do jogo) e cola aqui o código do deck: ele compila o deck completo, com todas as cartas, a curva de energia e o arquétipo.",
    "The most affinity-efficient gifts for each character — how much Bond they give and the cost in Fons (in-game currency, no real money). Tap the ♡ to pin who you're raising; click a card for the full list.":
      "Os presentes mais eficientes em afinidade para cada personagem: quanto Bond dão e o custo em Fons (moeda do jogo, sem dinheiro real). Toca no ♡ para fixares quem estás a subir; clica num cartão para a lista completa.",
    "Builds & rankings are compiled from Game8 and update as the meta shifts.":
      "As builds e rankings são compilados do Game8 e actualizam à medida que o meta muda.",
    "A starting point, not gospel — swap amps to taste. Want to tweak and save your own? Use the":
      "Um ponto de partida, não uma regra: troca os amps a teu gosto. Queres afinar e guardar os teus? Usa o",

    // ---- Tool notes ----
    "A curated starting point for the current patch — swap iconic weapons for what you find and tune attributes to taste. Build data hand-written by NightmareFTW.":
      "Um ponto de partida escolhido a dedo para o patch actual: troca as armas icónicas pelo que encontrares e afina os atributos a teu gosto. Dados das builds escritos à mão pelo NightmareFTW.",
    "A curated starting point for the current patch — Pictos, Luminas and weapons are swappable to taste. Build data hand-written by NightmareFTW.":
      "Um ponto de partida escolhido a dedo para o patch actual: Pictos, Luminas e armas podem ser trocados a teu gosto. Dados das builds escritos à mão pelo NightmareFTW.",
    "A curated starting point — swap armour to keep a medium roll; the weapon, talismans and stats are what matter. Item icons via the community Elden Ring API. Build data hand-written by NightmareFTW.":
      "Um ponto de partida escolhido a dedo: troca a armadura para manteres o medium roll; o que importa é a arma, os talismãs e os stats. Ícones dos itens via a API comunitária do Elden Ring. Dados das builds escritos à mão pelo NightmareFTW.",
    "A curated starting point — the set perk defines each build; weapons, runic attacks, shield and relic are swappable. Build data hand-written by NightmareFTW.":
      "Um ponto de partida escolhido a dedo: o perk de conjunto define cada build; armas, ataques rúnicos, escudo e relíquia podem ser trocados. Dados das builds escritos à mão pelo NightmareFTW.",
    "Demon and evidence data are auto-scraped from the Demonologist Wiki. Each demon has exactly 3 evidence; the strength/weakness are the in-game tells for identifying and countering it.":
      "Os dados de demónios e evidências são recolhidos automaticamente da Demonologist Wiki. Cada demónio tem exactamente 3 evidências; a força e a fraqueza são os sinais no jogo para o identificar e contrariar.",
    "Tool data is auto-scraped from the Demonologist Wiki. The \"finds\" badge marks which of the 7 evidence types a tool can detect; the rest are utility items.":
      "Os dados das ferramentas são recolhidos automaticamente da Demonologist Wiki. O crachá \"finds\" marca qual dos 7 tipos de evidência a ferramenta detecta; as restantes são utilitárias.",
    "Tool data is auto-scraped from the The Other Side Wiki. The \"finds\" badge marks which of the 6 evidence types each tool detects.":
      "Os dados das ferramentas são recolhidos automaticamente da The Other Side Wiki. O crachá \"finds\" marca qual dos 6 tipos de evidência cada ferramenta detecta.",
    "Ghost and evidence data are auto-scraped from the The Other Side Wiki. Each ghost has exactly 3 evidence.":
      "Os dados de fantasmas e evidências são recolhidos automaticamente da The Other Side Wiki. Cada fantasma tem exactamente 3 evidências.",
    "Questline & trigger info from community guides. This is a planning tracker — order and exact steps can vary, so check a full quest guide for each NPC's details.":
      "Informação de questlines e triggers vinda de guias da comunidade. Isto é um tracker de planeamento: a ordem e os passos exactos podem variar, por isso consulta um guia completo para os detalhes de cada NPC.",
    "Missable / point-of-no-return info from community completion guides (Game8, PowerPyx). This is a peace-of-mind tracker — most content is recoverable after the story.":
      "Informação sobre missables e pontos sem retorno vinda de guias de conclusão da comunidade (Game8, PowerPyx). Isto é um tracker de descanso de consciência: quase todo o conteúdo é recuperável depois da história.",
    "Favor list & collectible totals from community completion guides (PowerPyx). Nothing here is permanently missable — this is a peace-of-mind tracker.":
      "Lista de favores e totais de coleccionáveis vindos de guias de conclusão da comunidade (PowerPyx). Nada aqui se perde de forma permanente: isto é um tracker de descanso de consciência.",
    "Builds are auto-scraped from wikily.gg's community build planner and ordered by net votes (top-rated first). Each weapon type shows its best-voted loadouts. Item, weapon and spell icons are served from wikily's CDN.":
      "As builds são recolhidas automaticamente do planeador da comunidade do wikily.gg e ordenadas por votos (melhores primeiro). Cada tipo de arma mostra os loadouts mais votados. Os ícones de itens, armas e feitiços vêm do CDN do wikily.",
    "Maps and point-of-interest data are auto-scraped from wikily.gg's interactive maps. Hover a marker for its name. The bulk pickups (ore, loot, pickups) are hidden by default — toggle them on in the legend. Marker positions are wikily's normalised coordinates.":
      "Os mapas e pontos de interesse são recolhidos automaticamente dos mapas interactivos do wikily.gg. Passa o rato num marcador para veres o nome. As apanhas em massa (minério, loot, pickups) estão escondidas por defeito: liga-as na legenda. As posições dos marcadores são as coordenadas normalizadas do wikily.",
    "Builds are auto-scraped from each character's Game8 guide and refresh on a schedule. The relic set is the 4-piece; the ornament is the 2-piece planar set. Head main stat is always HP and Hands is always ATK, so only Body / Feet / Sphere / Rope are shown.":
      "As builds são recolhidas automaticamente do guia de cada personagem no Game8 e actualizam com regularidade. O conjunto de relíquias é o de 4 peças; o ornamento é o conjunto planar de 2 peças. O stat principal da cabeça é sempre HP e o das mãos é sempre ATK, por isso só se mostram Corpo / Pés / Esfera / Corda.",
    "Events and dates are auto-scraped from Game8's events schedule and refresh on a schedule. The dotted line marks today; bars are coloured by status (live / upcoming / ended). Events without a fixed end date run \"until end of patch\".":
      "Os eventos e datas são recolhidos automaticamente do calendário do Game8 e actualizam com regularidade. A linha tracejada marca hoje; as barras têm cor conforme o estado (a decorrer / futuro / terminado). Os eventos sem data de fim fixa correm \"até ao fim do patch\".",
    "Team comps are auto-scraped from Game8's \"Best Team Comps by Element\" guide and refresh on a schedule, so they track the live meta. Each DPS lists its F2P option first, then premium / specialised variants. The first unit is the carry; the rest are supports and a sustain.":
      "As composições são recolhidas automaticamente do guia \"Best Team Comps by Element\" do Game8 e actualizam com regularidade, acompanhando o meta actual. Cada DPS mostra primeiro a opção F2P e depois as variantes premium ou especializadas. A primeira unidade é o carry; as restantes são suportes e um sustain.",
    "Rankings are auto-scraped from Game8's overall character tier list and refresh daily, so they track the live patch as the meta shifts.":
      "Os rankings são recolhidos automaticamente da tier list geral do Game8 e actualizam diariamente, acompanhando o patch actual à medida que o meta muda.",
    "Banners and dates are auto-scraped from Game8's banner-history guide and refresh on a schedule. Live and upcoming banners are highlighted; dates shown as \"TBA\" haven't been confirmed by HoYoverse yet. Coverage focuses on recent and upcoming versions.":
      "Os banners e datas são recolhidos automaticamente do guia de histórico do Game8 e actualizam com regularidade. Os banners activos e futuros estão destacados; as datas \"TBA\" ainda não foram confirmadas pela HoYoverse. A cobertura foca-se nas versões recentes e futuras.",
    "Card art, stats and abilities are auto-scraped from Marvel Snap Zone's card API and refresh daily, so new cards and balance changes show up automatically.":
      "A arte, stats e habilidades das cartas são recolhidos automaticamente da API do Marvel Snap Zone e actualizam diariamente, por isso cartas novas e alterações de equilíbrio aparecem sozinhas.",
    "Works with the standard Marvel Snap deck code (the same one the game and those sites copy). Cards are matched against our daily-updated database; if a brand-new card isn't recognised yet, it'll appear once the database refreshes.":
      "Funciona com o código de deck padrão do Marvel Snap (o mesmo que o jogo e esses sites copiam). As cartas são cruzadas com a nossa base de dados actualizada diariamente; se uma carta muito recente ainda não for reconhecida, aparece assim que a base de dados actualizar.",
    "Portraits via the Outlast Wiki. Behaviour & counters are a play guide; exact damage scales with difficulty & MK modifiers.":
      "Retratos via Outlast Wiki. O comportamento e os contras são um guia de jogo; o dano exacto escala com a dificuldade e os modificadores MK.",
    "Objectives, layouts & screenshots via the Outlast Wiki; interactive maps by Fex (outlast.fex.dev). Tips are a play guide; steps vary slightly by difficulty (extra generator/door steps on higher tiers).":
      "Objectivos, layouts e capturas via Outlast Wiki; mapas interactivos do Fex (outlast.fex.dev). As dicas são um guia de jogo; os passos variam ligeiramente com a dificuldade (passos extra de gerador ou porta nos níveis mais altos).",
    "Evidence data based on Phasmophobia (3 evidence per ghost).": "Dados de evidências baseados no Phasmophobia (3 evidências por fantasma).",

    // ---- Footers ----
    "Built by NightmareFTW · headlines via Google News; preview & image from the source article.":
      "Feito por NightmareFTW · notícias via Google News; pré-visualização e imagem do artigo original.",
    "Built by NightmareFTW · Cyberpunk 2077 meta builds.": "Feito por NightmareFTW · builds meta de Cyberpunk 2077.",
    "Built by NightmareFTW · demon data via the Demonologist Wiki.": "Feito por NightmareFTW · dados de demónios via Demonologist Wiki.",
    "Built by NightmareFTW · equipment data via the Demonologist Wiki.": "Feito por NightmareFTW · dados de equipamento via Demonologist Wiki.",
    "Built by NightmareFTW · demon & evidence data via the Demonologist Wiki (3 evidence per demon).":
      "Feito por NightmareFTW · dados de demónios e evidências via Demonologist Wiki (3 evidências por demónio).",
    "Built by NightmareFTW · animal data via Dreamlight Valley Wiki.": "Feito por NightmareFTW · dados de animais via Dreamlight Valley Wiki.",
    "Built by NightmareFTW · item data via Dreamlight Valley Wiki.": "Feito por NightmareFTW · dados de itens via Dreamlight Valley Wiki.",
    "Built by NightmareFTW · recipe data via Nintendo Life.": "Feito por NightmareFTW · dados de receitas via Nintendo Life.",
    "Built by NightmareFTW · Elden Ring meta builds.": "Feito por NightmareFTW · builds meta de Elden Ring.",
    "Built by NightmareFTW · Elden Ring.": "Feito por NightmareFTW · Elden Ring.",
    "Built by NightmareFTW · Expedition 33 meta builds.": "Feito por NightmareFTW · builds meta de Expedition 33.",
    "Built by NightmareFTW · Clair Obscur: Expedition 33.": "Feito por NightmareFTW · Clair Obscur: Expedition 33.",
    "Built by NightmareFTW · builds & icons via wikily.gg.": "Feito por NightmareFTW · builds e ícones via wikily.gg.",
    "Built by NightmareFTW · maps & collectibles via wikily.gg.": "Feito por NightmareFTW · mapas e coleccionáveis via wikily.gg.",
    "Built by NightmareFTW · God of War Ragnarök meta builds.": "Feito por NightmareFTW · builds meta de God of War Ragnarök.",
    "Built by NightmareFTW · God of War Ragnarök.": "Feito por NightmareFTW · God of War Ragnarök.",
    "Built by NightmareFTW · builds via Game8.": "Feito por NightmareFTW · builds via Game8.",
    "Built by NightmareFTW · Honkai: Star Rail.": "Feito por NightmareFTW · Honkai: Star Rail.",
    "Built by NightmareFTW · event data via Game8.": "Feito por NightmareFTW · dados de eventos via Game8.",
    "Built by NightmareFTW · team comps via Game8.": "Feito por NightmareFTW · composições via Game8.",
    "Built by NightmareFTW · rankings via Game8.": "Feito por NightmareFTW · rankings via Game8.",
    "Built by NightmareFTW · banner data via Game8.": "Feito por NightmareFTW · dados de banners via Game8.",
    "Built by NightmareFTW · card data & art via Marvel Snap Zone.": "Feito por NightmareFTW · dados e arte das cartas via Marvel Snap Zone.",
    "Built by NightmareFTW · gift data via GameWith & ZeroLuck.gg.": "Feito por NightmareFTW · dados de presentes via GameWith e ZeroLuck.gg.",
    "Built by NightmareFTW · enemy art via the Outlast Wiki.": "Feito por NightmareFTW · arte dos inimigos via Outlast Wiki.",
    "Built by NightmareFTW · amp data via Outlast Wiki.": "Feito por NightmareFTW · dados de amps via Outlast Wiki.",
    "Built by NightmareFTW · trial data & images via the Outlast Wiki.": "Feito por NightmareFTW · dados e imagens dos trials via Outlast Wiki.",
    "Built by NightmareFTW · data via Phasmophobia Wiki.": "Feito por NightmareFTW · dados via Phasmophobia Wiki.",
    "Built by NightmareFTW · ghost data via the The Other Side Wiki.": "Feito por NightmareFTW · dados de fantasmas via The Other Side Wiki.",
    "Built by NightmareFTW · equipment data via the The Other Side Wiki.": "Feito por NightmareFTW · dados de equipamento via The Other Side Wiki.",
    "Built by NightmareFTW · ghost & evidence data via the The Other Side Wiki (3 evidence per ghost).":
      "Feito por NightmareFTW · dados de fantasmas e evidências via The Other Side Wiki (3 evidências por fantasma).",
    "Built by NightmareFTW · data via warframestat.us.": "Feito por NightmareFTW · dados via warframestat.us.",
    "Built by NightmareFTW · drop data © Digital Extremes, via WFCD.": "Feito por NightmareFTW · dados de drops © Digital Extremes, via WFCD.",
    "Built by NightmareFTW · A fan tribute to": "Feito por NightmareFTW · Uma homenagem de fã a",
    "by Manuel Garand — object art from the book, avatars via DiceBear. Non-commercial; go buy the book!":
      "de Manuel Garand · arte dos objectos retirada do livro, avatares via DiceBear. Sem fins comerciais; vai comprar o livro!",
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
    [/^(\d+) headlines · updated (.+)$/, "$1 notícias · actualizado $2"],
    [/^(\d+) codes · updated (.+)$/, "$1 códigos · actualizado $2"],
    [/^(\d+) active · (\d+) total · updated (.+)$/, "$1 activos · $2 total · actualizado $3"],
    [/^Added (.+)$/, "Adicionado $1"],
    [/^(\d+) headlines · updated (.+)$/, "$1 notícias · actualizado $2"],
    [/^Read the full article at (.+) ↗$/, "Ler o artigo completo em $1 ↗"],
    [/^← Back to (.+)$/, "← Voltar a $1"],
    [/^(\d+)\/(\d+) duties done$/, "$1/$2 duties feitas"],
    [/^(\d+) characters · (\d+) maxed · (\d+)\/(\d+) total levels$/,
      "$1 personagens · $2 no máximo · $3/$4 níveis totais"],
    [/^of (\d+) ghosts match\.$/, "de $1 fantasmas correspondem."],
    [/^(\d+) ghosts\. Mark evidence to narrow down\.$/, "$1 fantasmas. Marca evidências para filtrar."],
    [/^(\d+) drops? · updated (.+)$/, "$1 drops · actualizado $2"],
    [/^Showing (\d+) of ([\d,]+) — refine to narrow down$/, "A mostrar $1 de $2 — refina para reduzir"],
    [/^(\d+) recipe[s]? · sources: (.+)$/, "$1 receitas · fontes: $2"],
    [/^(\d+) farmable items · source: (.+)$/, "$1 items farmáveis · fonte: $2"],
    [/^(\d+) items & resources · source: (.+)$/, "$1 items & recursos · fonte: $2"],
    [/^(\d+) missions?$/, (m, n) => `${n} ${n === "1" ? "missão" : "missões"}`],
    [/^All themes \(([\d,]+)\)$/, "Todos os temas ($1)"],
    [/^(\d[\d,]*) items · showing (\d+), pick a theme or search to narrow$/, "$1 items · a mostrar $2, escolhe um tema ou pesquisa para reduzir"],
    [/^(\d[\d,]*) items · showing (\d+), narrow with a filter or search$/, "$1 items · a mostrar $2, refina com um filtro ou pesquisa"],
    [/^All themes \((\d[\d,]*)\)$/, "Todos os temas ($1)"],
    [/^(\d+) species · (\d+)\/(\d+) critters collected$/, "$1 espécies · $2/$3 critters colectados"],
    [/^(\d+) of (\d+) companions · (\d+) collected$/, "$1 de $2 companions · $3 colectados"],
    [/^(\d+) drops · updated (.+)$/, "$1 drops · actualizado $2"],
    [/^(\d+)\/(\d+) duties done$/, "$1/$2 duties feitas"],
    [/^Top (\d+) bond gifts · best value first$/, "Top $1 gifts de bond · melhor valor primeiro"],
    [/^(.+) is a Trial that takes place at (?:the )?(.+) in The Outlast Trials\.$/, "$1 é um Trial que decorre em $2 no The Outlast Trials."],
    [/^resets in (.+)$/, "reseta em $1"],
    [/^Week (\d+)$/, "Semana $1"],
    [/^Unlocks (.+)$/, "Desbloqueia: $1"],
    [/^UP · closes in (.+)$/, "ACTIVO · fecha em $1"],
    [/^in (\d[\d:hm ]*)$/, "em $1"],
    [/^(\d+)\/(\d+)$/, "$1/$2"],
    [/^(\d+) headlines · updated (.+)$/, "$1 notícias · actualizado $2"],
    [/^(\d[\d,]*) drops · updated (.+)$/, "$1 drops · actualizado $2"],
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

  // Inline SVG flags (Windows browsers don't render flag emoji, so we draw them).
  const FLAG_GB = `<svg viewBox="0 0 60 30" class="flag" aria-hidden="true">
    <rect width="60" height="30" fill="#012169"/>
    <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" stroke-width="6"/>
    <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" stroke-width="2.5"/>
    <rect x="25" width="10" height="30" fill="#fff"/><rect y="10" width="60" height="10" fill="#fff"/>
    <rect x="27" width="6" height="30" fill="#C8102E"/><rect y="12" width="60" height="6" fill="#C8102E"/>
  </svg>`;
  const FLAG_PT = `<svg viewBox="0 0 60 40" class="flag" aria-hidden="true">
    <rect width="24" height="40" fill="#060"/><rect x="24" width="36" height="40" fill="#e00"/>
    <circle cx="24" cy="20" r="7" fill="#fc0"/><circle cx="24" cy="20" r="4" fill="#fff"/>
    <circle cx="24" cy="20" r="2.3" fill="#C8102E"/>
  </svg>`;

  function injectSwitcher() {
    const nav = document.querySelector(".top-nav");
    if (!nav) return;
    const wrap = document.createElement("span");
    wrap.className = "lang-switch";
    wrap.innerHTML =
      `<button data-lang="en" title="English" class="${LANG === "en" ? "on" : ""}">${FLAG_GB}<span class="flag-label">EN</span></button>` +
      `<button data-lang="pt" title="Português (PT)" class="${LANG === "pt" ? "on" : ""}">${FLAG_PT}<span class="flag-label">PT</span></button>`;
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
