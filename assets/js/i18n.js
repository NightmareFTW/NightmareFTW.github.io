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
    "Less grind,": "Menos grind,", "more game": "mais jogo",
    "A growing toolbox — calculators, checklists and trackers. Nothing gets removed; it just keeps growing.":
      "Uma caixa de ferramentas em crescimento — calculadoras, checklists e trackers. Nada é removido; só continua a crescer.",
    "Games": "Jogos",

    // ---- Tool names (cards + page titles) ----
    "Ghost Evidence Checker": "Verificador de Evidências",
    "Cursed Possession Reference": "Referência de Objetos Amaldiçoados",
    "Equipment Guide": "Guia de Equipamento", "Progression Tracker": "Tracker de Progresso",
    "Loadout Builder": "Construtor de Loadout", "Daily / Weekly Checklist": "Checklist Diária / Semanal",
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
      "De completar quests e resgatar Dreamlight Duties. Atividades feitas pela 1ª vez dão grandes quantidades.",
    "Fish at any ripple in the Valley. Seaweed does NOT count — aim for the white/gold ripple circles.":
      "Pesca em qualquer ondulação no Valley. Algas NÃO contam — aponta aos círculos de ondulação brancos/dourados.",
    "Buy Spinach Seeds from Goofy in the Glade of Trust, plant, water and harvest. WALL-E's garden doesn't count.":
      "Compra Spinach Seeds ao Goofy na Glade of Trust, planta, rega e colhe. O jardim do WALL-E não conta.",
    "Sell harvested Spinach to any stall. Wait until this duty is ACTIVE before selling, or it won't count.":
      "Vende o Spinach colhido em qualquer banca. Espera que esta duty esteja ATIVA antes de vender, ou não conta.",
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
    "Activity": "Atividade", "Base game": "Jogo base", "Unassigned": "Sem atribuição",
    "— activity —": "— atividade —", "Gardening": "Jardinagem", "Fishing": "Pesca",
    "Mining": "Mineração", "Digging": "Escavação", "Foraging": "Recoleção",
    "Vegetables": "Vegetais", "Fruit": "Fruta", "Grains": "Cereais", "Dairy and Oil": "Laticínios e Óleo",
    "Spices": "Especiarias", "Sweets": "Doces", "Ice": "Gelo", "Seafood": "Marisco",
    "Protein": "Proteína", "Gem / Mineral": "Gema / Mineral", "Fish": "Peixe",

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

    // ---- Phasmophobia: Equipment Guide ----
    "All": "Todos", "Standard.": "Padrão.",
    "Every item — what it's for, what each tier upgrade changes, how to use it to find evidence, and tips.":
      "Cada equipamento — para que serve, o que muda cada tier, como usá-lo para encontrar evidências, e dicas.",
    "Detects electromagnetic activity. A reading of EMF 5 is one of the seven evidences.":
      "Deteta atividade eletromagnética. Uma leitura de EMF 5 é uma das sete evidências.",
    "GheistField Meter — dial display, ~1.7 m range, needle sways with age.": "GheistField Meter — mostrador analógico, alcance ~1,7 m, a agulha oscila com a idade.",
    "K2 Meter — five LED lights, ~2 m range, the classic reader.": "K2 Meter — cinco LEDs, alcance ~2 m, o leitor clássico.",
    "EMF ParaMeter — PDA style, logs the location and value of the last reading.": "EMF ParaMeter — estilo PDA, regista o local e o valor da última leitura.",
    "Carry it near interaction spots (doors, switches, thrown items). Levels 2–4 only confirm activity; a clear flash to 5 is the evidence.":
      "Leva-o perto de pontos de interação (portas, interruptores, objetos atirados). Os níveis 2–4 só confirmam atividade; um flash claro até 5 é a evidência.",
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
      "Projeta uma grelha de pontos verdes; uma silhueta do fantasma a passar por eles é a evidência.",
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
      "Tira fotos por dinheiro e objetivos (fantasma, osso, interações, objeto amaldiçoado, água suja…).",
    "Fewer photos, basic quality.": "Menos fotos, qualidade básica.", "More photos and better range.": "Mais fotos e melhor alcance.", "Most photos and best quality.": "Mais fotos e melhor qualidade.",
    "Photograph the ghost, the bone, fingerprints and interactions. Each valid photo pays out.":
      "Fotografa o fantasma, o osso, impressões e interações. Cada foto válida dá dinheiro.",
    "Always grab the Bone (it's an objective) and a clear ghost photo for bonus cash.":
      "Apanha sempre o osso (é objetivo) e uma foto nítida do fantasma para dinheiro extra.",
    "Picks up faint paranormal sounds at distance to help locate the ghost room.":
      "Capta sons paranormais ténues à distância para ajudar a localizar a sala do fantasma.",
    "Short detection range.": "Alcance de deteção curto.", "Longer range.": "Maior alcance.", "Longest range and clearest spikes.": "Maior alcance e picos mais nítidos.",
    "Point it down hallways and open areas; audio spikes and whispers point you toward the ghost.":
      "Aponta por corredores e zonas abertas; picos de áudio e sussurros indicam a direção do fantasma.",
    "Invaluable on large maps for narrowing down the room before you commit.":
      "Valiosíssimo em mapas grandes para reduzir a sala antes de te comprometeres.",
    "Monitors sound in an area and reports it on the truck map.": "Monitoriza o som numa área e reporta-o no mapa da carrinha.",
    "Covers a small area.": "Cobre uma área pequena.", "Larger area.": "Área maior.", "Largest area and labels the sound type.": "Maior área e identifica o tipo de som.",
    "Place to cover rooms you can't watch; the truck map lights up where sound happens.":
      "Coloca para cobrir salas que não consegues ver; o mapa da carrinha acende onde há som.",
    "Great for covering big open sections to triangulate the room.": "Ótimo para cobrir grandes zonas abertas e triangular a sala.",
    "Pings when something crosses it — useful for tracking ghost movement.": "Apita quando algo o atravessa — útil para seguir o movimento do fantasma.",
    "Basic trigger.": "Acionamento básico.", "Clearer indicator.": "Indicador mais claro.", "Best indicator and range.": "Melhor indicador e alcance.",
    "Mount across a doorway (not on your own path); it lights up and notifies the truck on movement.":
      "Monta a atravessar uma porta (fora do teu caminho); acende e avisa a carrinha quando há movimento.",
    "Place facing across a door away from where you walk to avoid false triggers.":
      "Coloca a apontar através de uma porta, longe de onde andas, para evitar falsos acionamentos.",
    "Prevents a hunt from starting within its radius (it does not stop one already in progress).":
      "Impede que um hunt comece dentro do seu raio (não para um já a decorrer).",
    "~3 m radius, limited uses.": "Raio ~3 m, usos limitados.", "Larger radius.": "Raio maior.", "Largest radius and shows remaining uses.": "Maior raio e mostra os usos restantes.",
    "Place or hold it near the ghost room or during a cursed event. It burns a charge each time it blocks a hunt.":
      "Coloca ou segura perto da sala do fantasma ou durante um evento amaldiçoado. Gasta uma carga sempre que bloqueia um hunt.",
    "Position it where the ghost starts hunts (its room). Useless once a hunt is already active.":
      "Põe-no onde o fantasma começa os hunts (a sala dele). Inútil quando o hunt já está ativo.",
    "Blinds the ghost and blocks hunts for a short time; can stop the ghost finding you mid-hunt.":
      "Cega o fantasma e bloqueia hunts por pouco tempo; pode impedir que te encontre a meio de um hunt.",
    "Short burn time.": "Tempo de queima curto.", "Longer burn.": "Queima mais longa.", "Longest burn / extra use.": "Queima mais longa / uso extra.",
    "Light with an igniter. During a hunt, smudge at the ghost's location to blind it for ~6 s and break its line on you.":
      "Acende com um isqueiro. Durante um hunt, faz smudge no local do fantasma para o cegar ~6 s e cortar a linha sobre ti.",
    "Smudging a Spirit stops it hunting for 180 s. Keep one as your emergency escape.":
      "Fazer smudge a um Spirit impede-o de caçar por 180 s. Guarda um como fuga de emergência.",
    "Ghosts may step in it, leaving UV footprints; also an objective.": "Os fantasmas podem pisá-lo, deixando pegadas UV; também é um objetivo.",
    "A couple of piles.": "Algumas pilhas.", "More piles.": "Mais pilhas.", "Most piles.": "Mais pilhas ainda.",
    "Place piles in doorways and the ghost room, then check with UV for glowing footsteps.":
      "Coloca pilhas nas portas e na sala do fantasma, depois verifica com UV à procura de pegadas brilhantes.",
    "A Wraith never steps in salt — disturbed salt with no footprints is a strong hint.":
      "Um Wraith nunca pisa sal — sal mexido sem pegadas é uma forte pista.",
    "Restores sanity, lowering the chance of a hunt.": "Recupera sanidade, reduzindo a hipótese de um hunt.",
    "Small restore.": "Recuperação pequena.", "Medium restore.": "Recuperação média.", "Large restore.": "Recuperação grande.",
    "Take when your sanity drops low, especially before sanity-dependent objectives.":
      "Toma quando a tua sanidade baixar muito, sobretudo antes de objetivos dependentes de sanidade.",
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
      "Uma fonte de luz portátil que continua a funcionar quando a eletrónica falha.",
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
      "Coloca-o e põe uma câmara em cima apontada ao centro da sala ou ao projetor D.O.T.S.",
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
      "Cada ingrediente farmável e onde o obter. Filtra por categoria e bioma (multi-seleção), pesquisa e ordena.",
    "Data compiled from the Dreamlight Valley Wiki. Covers farmable ingredients (fish/gems can be added). DLC tags are inferred from the item's biome (Eternity Isle = A Rift in Time) and are best-effort.":
      "Dados compilados da Dreamlight Valley Wiki. Cobre ingredientes farmáveis (peixes/gemas podem ser adicionados). As tags de DLC são inferidas pelo bioma do item (Eternity Isle = A Rift in Time) e são best-effort.",
    "Search by recipe or ingredient, filter by star level, and sort by sell value or energy.":
      "Pesquisa por receita ou ingrediente, filtra por estrelas, e ordena por valor de venda ou energia.",
    "Full recipe list compiled from Crystal Dreams (incl. DLC recipes), with sell price & energy from Nintendo Life where available. DLC tags are inferred from DLC-only ingredients and are best-effort.":
      "Lista completa de receitas do Crystal Dreams (incl. receitas de DLC), com preço & energia da Nintendo Life onde disponível. As tags de DLC são inferidas por ingredientes exclusivos de DLC e são best-effort.",
    "Duties rotate during the season — every duty is listed with how to clear it. When a new Star Path starts, ask me to refresh the list.":
      "As duties rodam durante a season — cada uma está listada com how-to. Quando começar um novo Star Path, pede-me para atualizar a lista.",
    "Live day/night and warm/cold cycles. Countdowns update every second; data refreshes from the API every minute.":
      "Ciclos de dia/noite e quente/frio ao vivo. Os countdowns atualizam a cada segundo; os dados renovam da API a cada minuto.",
    "Live data via the Warframe API (api.warframestat.us).": "Dados ao vivo via API do Warframe (api.warframestat.us).",
    "Live data via the Warframe API (api.warframestat.us), PC platform.": "Dados ao vivo via API do Warframe (api.warframestat.us), plataforma PC.",
    "Compare offensive and defensive gear. Uses Epic Seven's defense formula: damage taken = 300 / (300 + DEF).":
      "Compara gear ofensivo e defensivo. Usa a fórmula de defesa do Epic Seven: dano recebido = 300 / (300 + DEF).",
    "Daily section resets at local midnight, weekly resets Monday. Saved on this device.":
      "A secção diária reseta à meia-noite local, a semanal reseta segunda. Guardado neste dispositivo.",
    "Generic gacha routine — once NTE's reset times and content are confirmed, ask me to lock the items and reset schedule to the real ones.":
      "Rotina gacha genérica — quando os reset times e conteúdo do NTE forem confirmados, pede-me para fixar os items e o horário reais.",
    "Images & tier data via the Phasmophobia Wiki. Tier effects are summarized; exact values can shift between patches.":
      "Imagens & dados de tier via Phasmophobia Wiki. Os efeitos por tier estão resumidos; os valores exatos podem mudar entre patches.",
    "Pick a rig and one amp from each group, name it, save and share. A real loadout is 1 rig + 1 Tool + 1 Skill + 1 Medicine amp.":
      "Escolhe um rig e um amp de cada grupo, dá nome, guarda e partilha. Um loadout real é 1 rig + 1 Tool + 1 Skill + 1 Medicine amp.",
    "The live Eorzea clock and up/next countdowns are exact. The node list is a starter set — tell me which nodes you farm and I'll lock in their items, locations and times.":
      "O relógio de Eorzea e os countdowns up/next são exatos. A lista de nós é um conjunto inicial — diz-me que nós farmas e fixo os items, locais e horas.",
    "Enter a piece's substats (and rolled values) to grade its quality. Speed and crit are weighted highest.":
      "Mete os substats de uma peça (e os valores rolados) para avaliar a qualidade. Speed e crit têm o maior peso.",
    "Weighting follows the common community gear-score model (Speed ×2, Crit Chance ×1.6, Crit Dmg ×1.14, % stats ×1, flats much lower). It's a grading heuristic, not an in-game stat.":
      "A ponderação segue o modelo comunitário de gear-score (Speed ×2, Crit Chance ×1.6, Crit Dmg ×1.14, stats % ×1, flats muito menos). É uma heurística de avaliação, não um stat do jogo.",
    "Search relic and mission drops. Filter by source, rarity, relic tier and planet (multi-select), and sort by drop chance.":
      "Pesquisa drops de relíquias e missões. Filtra por fonte, raridade, tier de relíquia e planeta (multi-seleção), e ordena por hipótese de drop.",
    "Data from DE's official drop tables, parsed by WFCD (drops.warframestat.us). Relic rewards shown at Intact. Refreshed automatically.":
      "Dados das drop tables oficiais da DE, parseados pela WFCD (drops.warframestat.us). Recompensas de relíquia em Intact. Atualizado automaticamente.",
    "Builds & rankings are compiled from Game8 and update as the meta shifts. Want a drag-and-drop personal tier list too? Just ask.":
      "Builds & rankings são compilados do Game8 e atualizam conforme o meta muda. Queres também uma tier list pessoal arrastável? É só pedires.",
    "Enter each unit's Speed and starting CR. The simulator shows the opening turn order — who moves first and how the rotation plays out.":
      "Mete a Speed e o CR inicial de cada unidade. O simulador mostra a ordem de turnos inicial — quem joga primeiro e como roda a rotação.",
    "CR fills proportionally to Speed and overflow carries over after each turn. This models the natural turn order — it doesn't account for CR-push/pull skills or Speed buffs mid-fight.":
      "A CR enche proporcional à Speed e o overflow transita após cada turno. Modela a ordem natural de turnos — não considera skills de CR push/pull nem buffs de Speed a meio do combate.",
    "Rigs persist forever; the weekly section resets automatically. Saved on this device.":
      "Os rigs persistem sempre; a secção semanal reseta automaticamente. Guardado neste dispositivo.",
    "All six rigs are listed. Want to track specific amps, perks or MK-Challenges too? Just ask and I'll add them.":
      "Os seis rigs estão listados. Queres também acompanhar amps, perks ou MK-Challenges específicos? É só pedires.",
    "Live Sortie, Arbitration, Baro Ki'Teer and Void Fissures. Refreshes automatically.":
      "Sortie, Arbitration, Baro Ki'Teer e Void Fissures ao vivo. Atualiza automaticamente.",
    "Couldn't load item data.": "Não foi possível carregar os dados dos items.",
    "Couldn't load recipe data.": "Não foi possível carregar os dados das receitas.",
    "Couldn't load the drop table data.": "Não foi possível carregar a drop table.",
    "No news data yet — the news updater hasn't published this game's headlines.":
      "Ainda não há notícias — o atualizador ainda não publicou as deste jogo.",
    "No codes data yet — the updater hasn't published this game's list.":
      "Ainda não há códigos — o atualizador ainda não publicou a lista deste jogo.",
    "No drops match your filters.": "Nenhum drop corresponde aos filtros.",
    "No recipes match.": "Nenhuma receita corresponde.", "No items match.": "Nenhum item corresponde.",
    "No tools yet — coming soon.": "Ainda sem ferramentas — em breve.",

    // ---- Subtitle / note fragments (with inline tags) ----
    "Progress is saved on this device and resets automatically —": "O progresso é guardado neste dispositivo e reseta automaticamente —",
    "daily at 15:00 UTC": "diariamente às 15:00 UTC", "weekly Tuesday 08:00 UTC": "semanalmente terça às 08:00 UTC",
    "Live Eorzea clock. Nodes currently": "Relógio de Eorzea ao vivo. Os nós atualmente",
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
    [/^resets in (.+)$/, "reseta em $1"],
    [/^Week (\d+)$/, "Semana $1"],
    [/^Unlocks (.+)$/, "Desbloqueia: $1"],
    [/^UP · closes in (.+)$/, "ATIVO · fecha em $1"],
    [/^in (\d[\d:hm ]*)$/, "em $1"],
    [/^(\d+)\/(\d+)$/, "$1/$2"],
    [/^(\d+) headlines · updated (.+)$/, "$1 notícias · atualizado $2"],
    [/^(\d[\d,]*) drops · updated (.+)$/, "$1 drops · atualizado $2"],
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
