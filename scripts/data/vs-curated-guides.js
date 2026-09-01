/* Hand-curated, phased unlock guides for Vampire Survivors characters whose
   real unlock condition is "finish nearly everything else in this DLC" or
   otherwise too long/interlinked for the scraper's mechanical sentence
   splitting (toSteps in update-vampire-survivors.js) to read sensibly.

   The wiki itself does NOT store this content pre-organized — a character's
   own "Unlocking" section is typically one or two lines (see Chaos's, which
   just says "exhaust the rest of this pile of secrets" plus an exclusion
   list). This file is the source of truth for the richer walkthrough shown
   instead, merged onto the matching character record by slug in
   update-vampire-survivors.js's run(), so it survives the daily automated
   re-scrape.

   Unlike every other character's scraped (English-only) guide content, this
   is hand-authored and small enough to fully translate — so, unlike the
   rest of the site's data, it carries both an `en` and a `pt` copy right
   here instead of going through assets/js/i18n.js's DOM-text-node
   translator. That generic translator works by exact-matching whole text
   nodes, which breaks down here: most items embed a cross-linked character
   or achievement name via character.js's linkify(), which splits the
   sentence into multiple DOM text nodes around the injected <a> tag, so a
   translated fragment could never exact-match a whole node. Keeping full
   per-language copies and picking one before linkify() runs sidesteps that
   entirely. The `en` and `pt` copies MUST have identical phase/group/item
   *counts and order* — checkbox ids are positional (see character.js's
   collectLeafItems), so a mismatched shape would scramble saved progress
   when a viewer switches language.

   Schema, per slug: { en: Guide, pt: Guide }
   Guide: { objective, dlc, rule, phases: [ Phase ] }
   Phase:
     { icon, title, intro?, note?,
       items?: [ Item ],                 // flat phase
       groups?: [ { title?, items: [ Item ] } ] }  // phase split into sub-groups
   Item (one checkable step — the checkbox unit; ids are positional, so keep
   phase/group/item order stable across edits, and identical between en/pt):
     { text, kind?: "progression", children?: [ Node ] }
   Node (nested, non-checkable explanatory bullet):
     string | { text, children?: [ Node ] }

   Character and achievement names inside `text`/children are cross-linked
   automatically by character.js's existing linkify() — no manual links
   needed here, just use the exact in-game name (identical in both
   languages, since these are proper nouns). */

const chaosEn = {
  objective: "Unlock Chaos",
  dlc: "Ode to Castlevania",
  rule: "Unlock every Secret required by the DLC, including the 4 Megalo forms.",
  phases: [
    {
      icon: "🟢",
      title: "Phase 0 — Preparation",
      intro: "Before hunting for Secrets, make sure you have:",
      items: [
        { text: "Ode to Castlevania" },
        { text: "Ode to Castlevania unlocked as a Stage" },
        { text: "The Castlevania Map", kind: "progression" },
        { text: "Access to the Secrets menu" },
        { text: "The Forbidden Scrolls of Morbane" },
      ],
      note: "The Secrets menu is especially useful because, once you've collected the DLC's relics, it starts showing hints for the Secrets.",
    },
    {
      icon: "🏰",
      title: "Phase 1 — The first characters",
      intro: "These are the characters to unlock first, since several of them are required for later Secrets.",
      groups: [
        {
          title: "Coffins",
          items: [
            { text: "Leon Belmont", children: ["Find the first coffin outside the castle."] },
            { text: "Julius Belmont", children: ["Find the second coffin in the Library's secret area."] },
          ],
        },
        {
          title: "Boss → character",
          items: [
            { text: "Trevor Belmont", children: ["Defeat Medusa Head using Leon Belmont."] },
            { text: "Sypha Belnades", children: ["Defeat Slogra + Gaibon using Trevor Belmont."] },
            { text: "Soma Cruz", children: ["Defeat Gergoth using Julius Belmont."] },
            { text: "Yoko Belnades", children: ["Defeat Abaddon using Soma Cruz."] },
          ],
        },
        {
          title: "Evolutions",
          items: [
            { text: "Simon Belmont", children: ["Evolve Jet Black Whip."] },
            { text: "Juste Belmont", children: ["Evolve Wind Whip + Crown."] },
            { text: "Christopher Belmont", children: ["Evolve Alucart Sworb."] },
            { text: "Grant Danasty", children: ["Evolve Dragon Water Whip + Attractorb."] },
            { text: "Jonathan Morris", children: ["Evolve Hand Grenade + Candelabrador."] },
            { text: "Eric Lecarde", children: ["Evolve Javelin + Spellbinder."] },
            { text: "Shanoa", children: [{ text: "Evolve:", children: ["Iron Ball + Armor", "Alucard Spear + Wings"] }] },
            { text: "Maria Renard", children: [{ text: "Complete a Stage with:", children: ["Shanoa", "Juste Belmont"] }, "Both must survive to the end of the Stage."] },
            { text: "Richter Belmont", children: ["Evolve Guardian Targe + Pummarola."] },
          ],
        },
      ],
      note: "These chains make up most of the DLC's early progression.",
    },
    {
      icon: "💀",
      title: "Phase 2 — The first big milestone",
      items: [
        {
          text: "Complete the DLC with Richter Belmont",
          children: [
            "Take Richter Belmont all the way to the end of Ode to Castlevania.",
            "Go to: Clock Tower → top → Throne Room.",
            "With Richter, a special sequence plays out: Vlad Tepes Dracula → Death.",
            "You don't need to defeat Death the normal way.",
          ],
        },
        {
          text: "Survive the sequence",
          children: [
            "After Death strips your powers away, just focus on surviving.",
            { text: "This triggers:", children: ["credits", "a new part of the map", "the Black Disk"] },
          ],
        },
        { text: "Black Disk", kind: "progression", children: ["Obtained automatically after completing the sequence above with Richter."] },
      ],
      note: "The Black Disk is essential — it reveals 20 new Secrets.",
    },
    {
      icon: "💿",
      title: "Phase 3 — Black Disk characters",
      intro: "Once you have the Black Disk, a new category of Secrets starts appearing. Now you need to unlock:",
      groups: [
        {
          items: [
            { text: "Albus", children: ["Evolve Confodere."] },
            { text: "Barlowe", children: ["Evolve Optical Shot + Karoma's Mana."] },
            { text: "Cornell", children: ["Evolve Silver Revolver + Karoma's Mana."] },
            { text: "Henry", children: ["Evolve Tyrfing + Spinach."] },
            { text: "Isaac", children: ["Evolve Mace + Hollow Heart."] },
            { text: "Julia Laforeze", children: ["Evolve Globus + Empty Tome."] },
            { text: "Maxim Kischine", children: ["Evolve Vibhuti Whip + Candelabrador."] },
            { text: "Mina Hakuba", children: ["Evolve Iron Shield."] },
            { text: "Nathan Graves", children: ["Evolve Sonic Whip + Skull O'Maniac."] },
            { text: "Quincy Morris", children: ["Evolve Platinum Whip + Clover."] },
            { text: "Reinhardt Schneider", children: ["Find the fourth coffin."] },
            { text: "Rinaldo Gandolfi", children: ["Evolve Star Flail + Pummarola."] },
            { text: "Saint Germain", children: ["Evolve Trident and open a chest with Duplicator."] },
            { text: "Sara Trantoul", children: ["Evolve Alchemy Whip + Tirajisu."] },
            { text: "Shaft", children: ["Evolve Luminatio + Crown."] },
            { text: "Vincent Dorin", children: ["Evolve Fulgur + Keremet Bubbles."] },
            { text: "Elizabeth Bartley", children: ["Evolve Umbra + Attractorb."] },
            { text: "Vlad Tepes Dracula", children: ["Defeat/clear the Throne Room encounter as Richter."] },
            { text: "Young Maria Renard", children: ["Evolve Peachone + Ebony Wings with Gemini (I)."] },
          ],
        },
      ],
      note: "The exact evolution and boss conditions are documented in the DLC's Secrets tables.",
    },
    {
      icon: "🗝️",
      title: "Phase 4 — The Gates",
      intro: "You need to unlock all six Gates:",
      items: [
        { text: "Stallion Gate", kind: "progression" },
        { text: "Scorpion Gate", kind: "progression" },
        { text: "Capra Gate", kind: "progression" },
        { text: "King's Gate", kind: "progression" },
        { text: "Serpent Gate", kind: "progression" },
        { text: "Beast Gate", kind: "progression" },
      ],
      note: "These Gates open new areas of the map and are required for Secret progression — the Ode to Castlevania map lists them as Stage-specific relics.",
    },
    {
      icon: "🪦",
      title: "Phase 5 — Get the Pile of Secrets",
      intro: "Once you've progressed through the Gates and completed Richter's sequence:",
      items: [
        { text: "Defeat Beelzebub", children: ["Found in the upper-left area of the castle, in the Alchemy Laboratory."] },
        { text: "Pile of Secrets", kind: "progression", children: ["Likely the biggest progression jump on the way to Chaos."] },
      ],
      note: "The Pile of Secrets reveals more Secrets and makes more Boss Traps appear on the Stage.",
    },
    {
      icon: "🧩",
      title: "Phase 6 — The Pile of Secrets' Secrets",
      intro: "You now have a huge number of new Secrets, grouped by type to make them easier to track.",
      groups: [
        {
          title: "⚔️ Boss Secrets",
          items: [
            { text: "Blackmore", children: ["Use Barlowe.", "Defeat Blackmore."] },
            { text: "Walter Bernhard", children: ["Use Rinaldo Gandolfi.", "Defeat Walter."] },
            { text: "Joachim Armster", children: ["Use Sara Trantoul.", "Defeat Joachim."] },
            { text: "Keremet", children: ["Use Jonathan & Charlotte.", "Defeat Keremet."] },
            { text: "Malphas", children: ["Use Quincy Morris.", "Defeat Malphas."] },
            { text: "Dmitrii Blinov", children: ["Use Celia Fortner.", "Defeat Menace."] },
            { text: "Galamoth", children: ["Evolve all three Dominus Glyphs.", "Create Power of Sire.", "Defeat Galamoth with it."] },
            { text: "Count Olrox", children: ["Equip Dark Rift.", "Defeat Olrox."] },
            { text: "Succubus", children: ["Equip Nightmare.", "Defeat Succubus."] },
            { text: "Carmilla", children: ["Equip Nightmare.", "Defeat Carmilla."] },
            { text: "Soleil Belmont", children: ["Equip Sanctuary.", "Defeat Soleil."] },
            { text: "Stella Lecarde", children: ["Equip Sanctuary.", "Defeat Stella/Loretta."] },
            { text: "Loretta Lecarde", children: ["Equip Sanctuary.", "Defeat Stella/Loretta."] },
            { text: "Stella & Loretta Lecarde", children: ["Equip Sanctuary.", "Defeat the boss together."] },
            { text: "Charlotte & Jonathan", children: ["Equip Sanctuary.", "Defeat Stella & Loretta."] },
            { text: "Jonathan & Charlotte", children: ["Equip Sanctuary.", "Defeat Stella & Loretta."] },
          ],
        },
        {
          title: "🔫 Weapon Secrets",
          items: [
            { text: "Axe Armor", children: ["Evolve Discus → Stellar Blade.", "Go to the church area.", "Kill Axe Armor with Stellar Blade until the Secret triggers."] },
            { text: "Alamaric Sniper", children: ["Use Stellar Blade.", "Kill the Alamaric Snipers."] },
            { text: "Frozenshade", children: ["Use Gemma Torpor and/or Jewel Gun.", "Kill Frozenshades in the Ice Cave."] },
            { text: "Brauner", children: ["Use Blood Astronomia.", "Kill Living Paintings."] },
            { text: "Cave Troll", children: ["Kill 3,000,000 Cave Trolls."] },
          ],
        },
        {
          title: "🧙 Familiars",
          items: [
            {
              text: "Familiar",
              children: [
                "Work specifically with Julia Laforeze and hand her the 1st Familiar Forge.",
                { text: "Familiars:", children: ["Faerie", "Sacred Cardinal", "Sacred Dragon", "Sacred Tiger", "Sacred Turtle"] },
              ],
            },
            {
              text: "Innocent Devil",
              children: [
                "Hand Julia Laforeze a second Familiar Forge.",
                { text: "Variants:", children: ["Ukoback", "Bitterfly", "Alleged Ghost", "Imp", "Wood Rod", "Pumpkin"] },
              ],
            },
          ],
        },
        {
          title: "🏃 Movement / special conditions",
          items: [
            {
              text: "Ferryman",
              children: [
                { text: "You'll need:", children: ["Sonic Dash", "Wings"] },
                "Evolve Sonic Dash → Rapidus Fio.",
                "Go to the castle entrance and run over the water.",
              ],
            },
            {
              text: "Wind",
              children: [
                { text: "Use:", children: ["Eric Lecarde"] },
                "During the run, activate Eric's special ability 3 times.",
              ],
            },
            { text: "Wood Carving Score", kind: "progression", children: ["Defeat Treant to get it."] },
            { text: "Master Librarian", children: ["Buy every item from the Master Librarian at least once — this can be spread across multiple runs."] },
          ],
        },
        {
          title: "🪓 Hammer",
          items: [
            { text: "Hammer", children: [{ text: "You'll need:", children: ["6 Coat of Arms weapons", "Evolve all 6", "Complete the run"] }] },
          ],
        },
        {
          title: "🐺 Cornell",
          items: [
            {
              text: "Blue Crescent Moon Cornell",
              children: [{ text: "First:", children: ["Unlock the three Custos Glyphs", "Evolve them", "Transform Cornell", "Kill 100,000 enemies"] }],
            },
          ],
        },
        {
          title: "🩸 Dario",
          items: [
            {
              text: "Dario Bossi",
              children: [
                { text: "Do a run using exclusively:", children: ["Raging Fire", "or Salamender"] },
                { text: "Recommendation:", children: ["Pick Charlotte", "Limit the run to 1 weapon", "Evolve it", "Complete the Stage"] },
                "Don't use Candybox/Dio weapon to get around the condition.",
              ],
            },
          ],
        },
        {
          title: "☠️ Death",
          items: [
            {
              text: "Death",
              children: [
                { text: "You'll need:", children: ["Richter Belmont", "The Clock Tower's four mechanical elements", "Evolve them into Clock Tower"] },
                "Then, face Death again to unlock it as a character.",
              ],
            },
          ],
        },
      ],
    },
    {
      icon: "🧛",
      title: "Phase 7 — Ebony and Crimson Stones",
      intro: "Head to the southeast of the map:",
      items: [
        { text: "Find Legion" },
        { text: "Defeat Legion" },
        { text: "Ebony and Crimson Stones", kind: "progression", children: ["Pick up the relic after defeating Legion."] },
      ],
      note: "This relic is required to reveal the next four Megalo Secrets.",
    },
    {
      icon: "💎",
      title: "Phase 8 — The 4 Megalo forms",
      items: [
        { text: "Megalo Elizabeth Bartley", children: ["Pick Elizabeth Bartley.", "Activate the transformation.", "Kill 100,000 enemies."] },
        { text: "Megalo Olrox", children: ["Pick Count Olrox.", "Activate the transformation.", "Kill 100,000 enemies."] },
        { text: "Megalo Death", children: ["Pick Death.", "Activate the transformation.", "Kill 100,000 enemies."] },
        { text: "Megalo Dracula", children: ["Pick Vlad Tepes Dracula.", "Activate the transformation.", "Kill 100,000 enemies."] },
      ],
      note: "Endless Mode + Curse is recommended, since the 100,000 kills go much faster that way.",
    },
    {
      icon: "🏆",
      title: "Final phase — Chaos",
      intro: "If you've done everything above, confirm you already have:",
      items: [
        { text: "Every base-game Vampire Survivors Secret completed" },
        { text: "Every Ode to Castlevania Secret completed" },
        { text: "Black Disk obtained and its Secrets completed", kind: "progression" },
        { text: "Pile of Secrets obtained and its Secrets completed", kind: "progression" },
        { text: "Ebony and Crimson Stones obtained and all 4 Megalo completed", kind: "progression" },
      ],
      note: "Chaos is deliberately the DLC's last Secret — the game's own requirement text is just \"Exhaust the rest of this miserable pile of secrets.\" As soon as every Secret above (base game + Ode to Castlevania) is complete, Chaos becomes available for purchase.",
    },
  ],
};

// Portuguese mirror of chaosEn, same phase/group/item shape throughout (see
// note above on why this can't just go through the generic i18n.js DICT).
const chaosPt = {
  objective: "Desbloquear Chaos",
  dlc: "Ode to Castlevania",
  rule: "Desbloquear todos os Secrets necessários da DLC, incluindo os 4 Megalo.",
  phases: [
    {
      icon: "🟢",
      title: "Fase 0 — Preparação",
      intro: "Antes de começares a caça aos Secrets, garante:",
      items: [
        { text: "Possuir Ode to Castlevania" },
        { text: "Ter Ode to Castlevania desbloqueado como Stage" },
        { text: "Ter o Castlevania Map", kind: "progression" },
        { text: "Ter acesso ao Secrets menu" },
        { text: "Ter Forbidden Scrolls of Morbane" },
      ],
      note: "O Secrets menu é particularmente útil porque, depois de recolheres os relics do DLC, começa a mostrar as pistas dos Secrets.",
    },
    {
      icon: "🏰",
      title: "Fase 1 — Os primeiros personagens",
      intro: "Estes são os personagens que deves desbloquear primeiro porque vários são necessários para os Secrets posteriores.",
      groups: [
        {
          title: "Coffins",
          items: [
            { text: "Leon Belmont", children: ["Encontrar o primeiro coffin no exterior do castelo."] },
            { text: "Julius Belmont", children: ["Encontrar o segundo coffin na zona secreta da Library."] },
          ],
        },
        {
          title: "Boss → personagem",
          items: [
            { text: "Trevor Belmont", children: ["Derrotar Medusa Head usando Leon Belmont."] },
            { text: "Sypha Belnades", children: ["Derrotar Slogra + Gaibon usando Trevor Belmont."] },
            { text: "Soma Cruz", children: ["Derrotar Gergoth usando Julius Belmont."] },
            { text: "Yoko Belnades", children: ["Derrotar Abaddon usando Soma Cruz."] },
          ],
        },
        {
          title: "Evoluções",
          items: [
            { text: "Simon Belmont", children: ["Evoluir Jet Black Whip."] },
            { text: "Juste Belmont", children: ["Evoluir Wind Whip + Crown."] },
            { text: "Christopher Belmont", children: ["Evoluir Alucart Sworb."] },
            { text: "Grant Danasty", children: ["Evoluir Dragon Water Whip + Attractorb."] },
            { text: "Jonathan Morris", children: ["Evoluir Hand Grenade + Candelabrador."] },
            { text: "Eric Lecarde", children: ["Evoluir Javelin + Spellbinder."] },
            { text: "Shanoa", children: [{ text: "Evoluir:", children: ["Iron Ball + Armor", "Alucard Spear + Wings"] }] },
            { text: "Maria Renard", children: [{ text: "Completar um Stage com:", children: ["Shanoa", "Juste Belmont"] }, "Ambos têm de sobreviver até ao fim do Stage."] },
            { text: "Richter Belmont", children: ["Evoluir Guardian Targe + Pummarola."] },
          ],
        },
      ],
      note: "Estas cadeias formam grande parte da progressão inicial do DLC.",
    },
    {
      icon: "💀",
      title: "Fase 2 — O primeiro grande marco",
      items: [
        {
          text: "Completar o DLC com Richter Belmont",
          children: [
            "Levar Richter Belmont até ao final de Ode to Castlevania.",
            "Vai até: Clock Tower → topo → Throne Room.",
            "Com Richter acontece a sequência especial: Vlad Tepes Dracula → Death.",
            "Não precisas de derrotar Death da maneira habitual.",
          ],
        },
        {
          text: "Sobreviver à sequência",
          children: [
            "Depois de Death te retirar os poderes, concentra-te simplesmente em sobreviver.",
            { text: "Isto desencadeia:", children: ["créditos", "nova parte do mapa", "Black Disk"] },
          ],
        },
        { text: "Black Disk", kind: "progression", children: ["Obtido automaticamente ao completar a sequência acima com Richter."] },
      ],
      note: "O Black Disk é fundamental porque revela 20 novos Secrets.",
    },
    {
      icon: "💿",
      title: "Fase 3 — Personagens do Black Disk",
      intro: "Depois de obteres o Black Disk começa a aparecer uma nova categoria de Secrets. Agora tens de desbloquear:",
      groups: [
        {
          items: [
            { text: "Albus", children: ["Evoluir Confodere."] },
            { text: "Barlowe", children: ["Evoluir Optical Shot + Karoma's Mana."] },
            { text: "Cornell", children: ["Evoluir Silver Revolver + Karoma's Mana."] },
            { text: "Henry", children: ["Evoluir Tyrfing + Spinach."] },
            { text: "Isaac", children: ["Evoluir Mace + Hollow Heart."] },
            { text: "Julia Laforeze", children: ["Evoluir Globus + Empty Tome."] },
            { text: "Maxim Kischine", children: ["Evoluir Vibhuti Whip + Candelabrador."] },
            { text: "Mina Hakuba", children: ["Evoluir Iron Shield."] },
            { text: "Nathan Graves", children: ["Evoluir Sonic Whip + Skull O'Maniac."] },
            { text: "Quincy Morris", children: ["Evoluir Platinum Whip + Clover."] },
            { text: "Reinhardt Schneider", children: ["Encontrar o quarto coffin."] },
            { text: "Rinaldo Gandolfi", children: ["Evoluir Star Flail + Pummarola."] },
            { text: "Saint Germain", children: ["Evoluir Trident e abrir um chest com Duplicator."] },
            { text: "Sara Trantoul", children: ["Evoluir Alchemy Whip + Tirajisu."] },
            { text: "Shaft", children: ["Evoluir Luminatio + Crown."] },
            { text: "Vincent Dorin", children: ["Evoluir Fulgur + Keremet Bubbles."] },
            { text: "Elizabeth Bartley", children: ["Evoluir Umbra + Attractorb."] },
            { text: "Vlad Tepes Dracula", children: ["Derrotar/ultrapassar o confronto no Throne Room como Richter."] },
            { text: "Young Maria Renard", children: ["Evoluir Peachone + Ebony Wings com Gemini (I)."] },
          ],
        },
      ],
      note: "As condições exactas das evoluções e bosses estão documentadas nas tabelas de Secrets do DLC.",
    },
    {
      icon: "🗝️",
      title: "Fase 4 — Os Gates",
      intro: "Tens de desbloquear os seis Gates:",
      items: [
        { text: "Stallion Gate", kind: "progression" },
        { text: "Scorpion Gate", kind: "progression" },
        { text: "Capra Gate", kind: "progression" },
        { text: "King's Gate", kind: "progression" },
        { text: "Serpent Gate", kind: "progression" },
        { text: "Beast Gate", kind: "progression" },
      ],
      note: "Estes Gates abrem novas zonas do mapa e são necessários para a progressão dos Secrets — o mapa de Ode to Castlevania lista-os como relics específicos do Stage.",
    },
    {
      icon: "🪦",
      title: "Fase 5 — Obter o Pile of Secrets",
      intro: "Depois de teres progredido pelos Gates e concluído a sequência de Richter:",
      items: [
        { text: "Derrotar Beelzebub", children: ["Encontra-se na zona superior/esquerda do castelo, na área do Alchemy Laboratory."] },
        { text: "Pile of Secrets", kind: "progression", children: ["Provavelmente o maior salto de progressão para o Chaos."] },
      ],
      note: "O Pile of Secrets revela mais Secrets e faz aparecer mais Boss Traps no Stage.",
    },
    {
      icon: "🧩",
      title: "Fase 6 — Os Secrets do Pile of Secrets",
      intro: "Agora tens uma enorme quantidade de novos Secrets, agrupados por tipo para ser mais fácil marcar.",
      groups: [
        {
          title: "⚔️ Secrets de bosses",
          items: [
            { text: "Blackmore", children: ["Usar Barlowe.", "Derrotar Blackmore."] },
            { text: "Walter Bernhard", children: ["Usar Rinaldo Gandolfi.", "Derrotar Walter."] },
            { text: "Joachim Armster", children: ["Usar Sara Trantoul.", "Derrotar Joachim."] },
            { text: "Keremet", children: ["Usar Jonathan & Charlotte.", "Derrotar Keremet."] },
            { text: "Malphas", children: ["Usar Quincy Morris.", "Derrotar Malphas."] },
            { text: "Dmitrii Blinov", children: ["Usar Celia Fortner.", "Derrotar Menace."] },
            { text: "Galamoth", children: ["Evoluir os três Dominus Glyphs.", "Criar Power of Sire.", "Derrotar Galamoth com ela."] },
            { text: "Count Olrox", children: ["Equipar Dark Rift.", "Derrotar Olrox."] },
            { text: "Succubus", children: ["Equipar Nightmare.", "Derrotar Succubus."] },
            { text: "Carmilla", children: ["Equipar Nightmare.", "Derrotar Carmilla."] },
            { text: "Soleil Belmont", children: ["Equipar Sanctuary.", "Derrotar Soleil."] },
            { text: "Stella Lecarde", children: ["Equipar Sanctuary.", "Derrotar Stella/Loretta."] },
            { text: "Loretta Lecarde", children: ["Equipar Sanctuary.", "Derrotar Stella/Loretta."] },
            { text: "Stella & Loretta Lecarde", children: ["Equipar Sanctuary.", "Derrotar o boss em conjunto."] },
            { text: "Charlotte & Jonathan", children: ["Equipar Sanctuary.", "Derrotar Stella & Loretta."] },
            { text: "Jonathan & Charlotte", children: ["Equipar Sanctuary.", "Derrotar Stella & Loretta."] },
          ],
        },
        {
          title: "🔫 Secrets de armas",
          items: [
            { text: "Axe Armor", children: ["Evoluir Discus → Stellar Blade.", "Ir para a zona da igreja.", "Matar Axe Armor com Stellar Blade até activar o Secret."] },
            { text: "Alamaric Sniper", children: ["Usar Stellar Blade.", "Matar os Alamaric Snipers."] },
            { text: "Frozenshade", children: ["Usar Gemma Torpor e/ou Jewel Gun.", "Matar Frozenshades na Ice Cave."] },
            { text: "Brauner", children: ["Usar Blood Astronomia.", "Matar Living Paintings."] },
            { text: "Cave Troll", children: ["Matar 3.000.000 Cave Trolls."] },
          ],
        },
        {
          title: "🧙 Familiars",
          items: [
            {
              text: "Familiar",
              children: [
                "Trabalhar especificamente com Julia Laforeze e entregar-lhe a 1ª Familiar Forge.",
                { text: "Familiares:", children: ["Faerie", "Sacred Cardinal", "Sacred Dragon", "Sacred Tiger", "Sacred Turtle"] },
              ],
            },
            {
              text: "Innocent Devil",
              children: [
                "Entregar a Julia Laforeze uma segunda Familiar Forge.",
                { text: "Variantes:", children: ["Ukoback", "Bitterfly", "Alleged Ghost", "Imp", "Wood Rod", "Pumpkin"] },
              ],
            },
          ],
        },
        {
          title: "🏃 Movimento / condições especiais",
          items: [
            {
              text: "Ferryman",
              children: [
                { text: "Precisas de:", children: ["Sonic Dash", "Wings"] },
                "Evoluir Sonic Dash → Rapidus Fio.",
                "Ir para a entrada do castelo e correr sobre a água.",
              ],
            },
            {
              text: "Wind",
              children: [
                { text: "Usar:", children: ["Eric Lecarde"] },
                "Durante a run, activar a habilidade especial de Eric 3 vezes.",
              ],
            },
            { text: "Wood Carving Score", kind: "progression", children: ["Derrotar Treant para o conseguir."] },
            { text: "Master Librarian", children: ["Comprar todos os itens do Master Librarian pelo menos uma vez — pode ser feito ao longo de várias runs."] },
          ],
        },
        {
          title: "🪓 Hammer",
          items: [
            { text: "Hammer", children: [{ text: "Precisarás de:", children: ["6 armas Coat of Arms", "Evoluir as 6", "Completar a run"] }] },
          ],
        },
        {
          title: "🐺 Cornell",
          items: [
            {
              text: "Blue Crescent Moon Cornell",
              children: [{ text: "Primeiro:", children: ["Desbloquear os três Custos Glyphs", "Evoluí-los", "Transformar Cornell", "Matar 100.000 inimigos"] }],
            },
          ],
        },
        {
          title: "🩸 Dario",
          items: [
            {
              text: "Dario Bossi",
              children: [
                { text: "Fazer uma run usando exclusivamente:", children: ["Raging Fire", "ou Salamender"] },
                { text: "Recomendação:", children: ["Escolher Charlotte", "Limitar a run a 1 arma", "Fazer a evolução", "Completar o Stage"] },
                "Não uses Candybox/arma Dio para contornar a condição.",
              ],
            },
          ],
        },
        {
          title: "☠️ Death",
          items: [
            {
              text: "Death",
              children: [
                { text: "Precisarás de:", children: ["Richter Belmont", "Os quatro elementos mecânicos da Clock Tower", "Evoluí-los para Clock Tower"] },
                "Depois, voltar a enfrentar Death para o desbloquear como personagem.",
              ],
            },
          ],
        },
      ],
    },
    {
      icon: "🧛",
      title: "Fase 7 — Ebony and Crimson Stones",
      intro: "Dirige-te à zona sudeste do mapa:",
      items: [
        { text: "Encontrar Legion" },
        { text: "Derrotar Legion" },
        { text: "Ebony and Crimson Stones", kind: "progression", children: ["Recolher o relic depois de derrotar Legion."] },
      ],
      note: "Este relic é necessário para revelar os quatro Secrets Megalo seguintes.",
    },
    {
      icon: "💎",
      title: "Fase 8 — Os 4 Megalo",
      items: [
        { text: "Megalo Elizabeth Bartley", children: ["Escolher Elizabeth Bartley.", "Activar a transformação.", "Matar 100.000 inimigos."] },
        { text: "Megalo Olrox", children: ["Escolher Count Olrox.", "Activar a transformação.", "Matar 100.000 inimigos."] },
        { text: "Megalo Death", children: ["Escolher Death.", "Activar a transformação.", "Matar 100.000 inimigos."] },
        { text: "Megalo Dracula", children: ["Escolher Vlad Tepes Dracula.", "Activar a transformação.", "Matar 100.000 inimigos."] },
      ],
      note: "Recomenda-se Endless Mode + Curse, porque os 100.000 kills ficam muito mais rápidos desta forma.",
    },
    {
      icon: "🏆",
      title: "Fase final — Chaos",
      intro: "Se fizeste tudo o que precede, confirma que já tens:",
      items: [
        { text: "Todos os Secrets base de Vampire Survivors concluídos" },
        { text: "Todos os Secrets de Ode to Castlevania concluídos" },
        { text: "Black Disk obtido e os seus Secrets concluídos", kind: "progression" },
        { text: "Pile of Secrets obtido e os seus Secrets concluídos", kind: "progression" },
        { text: "Ebony and Crimson Stones obtido e os 4 Megalo concluídos", kind: "progression" },
      ],
      note: "Chaos é deliberadamente o último Secret da DLC — o próprio requisito do jogo resume-se a \"Exhaust the rest of this miserable pile of secrets.\" Assim que completares todos os Secrets acima (base + Ode to Castlevania), Chaos aparece disponível para compra.",
    },
  ],
};

// ---- Fake Trio (Ode to Castlevania) ---------------------------------------
const fakeTrioEn = {
  objective: "Unlock Fake Trio",
  dlc: "Ode to Castlevania",
  rule: "Discover the final evolution or union of every weapon sold by the Master Librarian.",
  phases: [
    { icon: "🟢", title: "Phase 0 — Preparation", intro: "Before hunting for these, make sure you have:", items: [{ text: "Pile of Secrets", kind: "progression" }] },
    {
      icon: "📚", title: "Phase 1 — Discover every weapon's final form",
      intro: "You just need to discover each of these at least once — they don't all need to be in the same run:",
      items: [
        { text: "Valmanway → Thousand Edge → Million Cut" },
        { text: "Icebrand → Unholy Vespers → Ninth Circle" },
        { text: "Arrow of Goth → Mannajja → Dies Irae" },
        { text: "Aura Blast → Hellfire → Kardía Phlegeton" },
        { text: "Kaiser Knuckle → Tri-Bracelet → Lapiste Tepisto" },
        { text: "Pocket Knife → Max Torrona's Box → Claimh Solais" },
        { text: "Svarog Statue → Valkyrie Turner → Darkness Illusion" },
        { text: "Troll Bomb → NO FUTURE → Carnage Heart" },
        { text: "Hydro Storm → La Borra → Hydro Pump Climax" },
        { text: "Grand Cross → Heaven Sword → Arch Angle" },
        { text: "Summon Spirit → Holy Wand → Spirit of Light" },
        { text: "Soul Steal → Vicious Hunger → Power of Lire" },
        { text: "Dark Rift → Death Spiral → Legacy of Death: Soul River" },
        { text: "Sword Brothers → Thunder Loop → Vjaya Sisters" },
        { text: "Summon Spirit Tornado → Gorgeous Moon → Venus Crescent" },
        { text: "Anura → Soul Eater → Dark Frogamorphosis" },
      ],
      note: "That's 16 chains in total — Fake Trio unlocks the moment the last one is discovered.",
    },
  ],
};
const fakeTrioPt = {
  objective: "Desbloquear Fake Trio",
  dlc: "Ode to Castlevania",
  rule: "Descobrir a evolução ou união final de todas as armas vendidas pelo Master Librarian.",
  phases: [
    { icon: "🟢", title: "Fase 0 — Preparação", intro: "Antes de começares a caça, garante que tens:", items: [{ text: "Pile of Secrets", kind: "progression" }] },
    {
      icon: "📚", title: "Fase 1 — Descobre a forma final de cada arma",
      intro: "Só precisas de descobrir cada uma destas pelo menos uma vez — não têm de ser todas na mesma run:",
      items: [
        { text: "Valmanway → Thousand Edge → Million Cut" },
        { text: "Icebrand → Unholy Vespers → Ninth Circle" },
        { text: "Arrow of Goth → Mannajja → Dies Irae" },
        { text: "Aura Blast → Hellfire → Kardía Phlegeton" },
        { text: "Kaiser Knuckle → Tri-Bracelet → Lapiste Tepisto" },
        { text: "Pocket Knife → Max Torrona's Box → Claimh Solais" },
        { text: "Svarog Statue → Valkyrie Turner → Darkness Illusion" },
        { text: "Troll Bomb → NO FUTURE → Carnage Heart" },
        { text: "Hydro Storm → La Borra → Hydro Pump Climax" },
        { text: "Grand Cross → Heaven Sword → Arch Angle" },
        { text: "Summon Spirit → Holy Wand → Spirit of Light" },
        { text: "Soul Steal → Vicious Hunger → Power of Lire" },
        { text: "Dark Rift → Death Spiral → Legacy of Death: Soul River" },
        { text: "Sword Brothers → Thunder Loop → Vjaya Sisters" },
        { text: "Summon Spirit Tornado → Gorgeous Moon → Venus Crescent" },
        { text: "Anura → Soul Eater → Dark Frogamorphosis" },
      ],
      note: "São 16 cadeias no total — o Fake Trio desbloqueia-se assim que descobrires a última.",
    },
  ],
};

// ---- Avatar Infernas (Base Game) -------------------------------------------
const avatarInfernasEn = {
  objective: "Unlock Avatar Infernas",
  dlc: "Base Game",
  rule: "Solve the Inverted Inlaid Library piano puzzle and defeat the hostile Avatar Infernas hiding in one of nine coffins.",
  phases: [
    {
      icon: "🟢", title: "Phase 0 — Preparation", intro: "Before attempting this, make sure you have:",
      items: [{ text: "Eudaimonia Machine cleared", kind: "progression", children: ["Defeat The Directer and obtain the Greatest Jubilee relic."] }],
      note: "Then start a run in Inlaid Library with Inverse Mode enabled.",
    },
    {
      icon: "🎹", title: "Phase 1 — Find the Trickster and play the piano", intro: "Travel far to the right of the stage, past the Gold Ring:",
      items: [
        { text: "Find The Trickster", children: ["It's standing in front of a piano.", "Moving out of its view makes it teleport to the other side of the screen — approach carefully."] },
        { text: "Kill The Trickster" },
        { text: "Interact with the piano", children: ["Move in front of its keys — this pauses the game and opens a clickable piano pop-up."] },
        { text: "Press the keys D, A, A#, G, C#, in order", children: ["That's the 2nd white key, 6th white key, 5th black key, 5th white key, and 1st black key.", "If you have Peachone and Ebony Wings (not evolved into Vandalier), the birds fly to and cycle through the correct keys for you — but they're not required if you already know the sequence.", "The Vandalier and Cosmo Pavone's hidden starting Peachone/Ebony Wings can't be used for this — Banish one of the birds or Seal the Vandalier beforehand to avoid an accidental evolution."] },
      ],
    },
    {
      icon: "⚰️", title: "Phase 2 — Defeat the hostile Avatar Infernas", intro: "After playing the final note:",
      items: [
        { text: "Teleport to a dark area", children: ["It's infinitely spawning Undead Heads and Undead Eyes, with nine coffins arranged in a square around you (visible on the map)."] },
        { text: "Open the coffin containing Avatar Infernas", children: ["Only one of the nine has him — it's randomized every run.", "The darkness fades and the remaining enemies disappear once you find it."] },
        { text: "Defeat the hostile Avatar Infernas", children: ["He slowly chases you after the coffin opens.", "Defeating him unlocks him as a playable character and ends the run via the White Hand."] },
      ],
      note: "Avatar Infernas is normally playable immediately after this, with no purchase needed — some versions instead list a 666-coin purchase price that scales with the number of characters already bought.",
    },
  ],
};
const avatarInfernasPt = {
  objective: "Desbloquear Avatar Infernas",
  dlc: "Base Game",
  rule: "Resolve o puzzle do piano na Inlaid Library invertida e derrota o Avatar Infernas hostil escondido num de nove caixões.",
  phases: [
    {
      icon: "🟢", title: "Fase 0 — Preparação", intro: "Antes de tentares isto, garante que tens:",
      items: [{ text: "Eudaimonia Machine concluída", kind: "progression", children: ["Derrotar o The Directer e obter a relíquia Greatest Jubilee."] }],
      note: "Depois, começa uma run em Inlaid Library com o Modo Inverso activado.",
    },
    {
      icon: "🎹", title: "Fase 1 — Encontra o Trickster e toca o piano", intro: "Viaja bem para a direita da fase, para lá do Gold Ring:",
      items: [
        { text: "Encontrar o Trickster", children: ["Está de pé em frente a um piano.", "Sair do seu campo de visão faz com que se teletransporte para o outro lado do ecrã — aproxima-te com cuidado."] },
        { text: "Matar o Trickster" },
        { text: "Interagir com o piano", children: ["Coloca-te em frente às teclas — isto pausa o jogo e abre um pop-up de piano clicável."] },
        { text: "Carregar nas teclas D, A, A#, G, C#, por ordem", children: ["Ou seja: a 2.ª tecla branca, a 6.ª tecla branca, a 5.ª tecla preta, a 5.ª tecla branca e a 1.ª tecla preta.", "Se tiveres o Peachone e o Ebony Wings (sem estarem evoluídos em Vandalier), os pássaros voam e percorrem as teclas certas por ti — mas não são obrigatórios se já souberes a sequência.", "O Vandalier e o Peachone/Ebony Wings escondidos com que a Cosmo Pavone começa não podem ser usados aqui — Banish um dos pássaros ou Seal o Vandalier antecipadamente para evitar uma evolução acidental."] },
      ],
    },
    {
      icon: "⚰️", title: "Fase 2 — Derrota o Avatar Infernas hostil", intro: "Depois de tocares a última nota:",
      items: [
        { text: "Teletransporte para uma área escura", children: ["Nela aparecem infinitamente Undead Heads e Undead Eyes, com nove caixões dispostos num quadrado à tua volta (visíveis no mapa)."] },
        { text: "Abrir o caixão que contém o Avatar Infernas", children: ["Só um dos nove o tem — é aleatório em cada run.", "A escuridão desaparece e os restantes inimigos somem assim que o encontras."] },
        { text: "Derrotar o Avatar Infernas hostil", children: ["Persegue-te lentamente depois de o caixão abrir.", "Derrotá-lo desbloqueia-o como personagem jogável e termina a run através da White Hand."] },
      ],
      note: "Normalmente, o Avatar Infernas fica jogável de imediato, sem precisar de compra — algumas versões mostram, em vez disso, um preço de 666 moedas, valor que sobe consoante o número de personagens já compradas.",
    },
  ],
};

// ---- Torino (Base Game) -----------------------------------------------------
const torinoEn = {
  objective: "Unlock Torino",
  dlc: "Base Game",
  rule: "Wake the 17th Colossus in Mazerella, then let it walk off the southern border without ever enraging it.",
  phases: [
    {
      icon: "🟢", title: "Phase 0 — Preparation", intro: "Recommended, not required:",
      items: [
        { text: "A flying character", children: ["Gyoruntin can bypass the maze's walls entirely."] },
        { text: "Or an invincible character", children: ["Megalo Menya Moonspell can safely stand near the Colossus without risking a hit that enrages it."] },
      ],
      note: 'Avoid Inverse Mode for this Secret — or at least disable the "Visually Invert Stages" option.',
    },
    {
      icon: "🗿", title: "Phase 1 — Find and wake the Colossus", intro: "Start a run in Mazerella:",
      items: [
        { text: "Reach the 17th Colossus's room", children: [{ text: "Flying character:", children: ["Directly north from the starting room."] }, { text: "Non-flying character:", children: ["East → North → North → East → North → North → East → East → North → West → West → North → West → South → South → West → North → North"] }] },
        { text: "Reduce it to 90% health", children: ["It's asleep until then — once it wakes, it starts walking in a straight line towards the bottom of the stage."] },
      ],
    },
    {
      icon: "🚶", title: "Phase 2 — Let it walk off without enraging it", intro: "This is the part that actually unlocks Torino:",
      items: [
        { text: "Never drop it below 75% health", children: ["Damaging it further enrages it — it turns to target you instead, which fails the Secret."] },
        { text: "Retrace your path back south", children: ["Same directions as Phase 1, reversed, but skip the final west turn into the starting room: South → South → East → North → North → East → South → East → East → South → West → West → South → South → West → South → South", "Then, instead of entering the starting room, keep going south: South → South → South → South → West → South"] },
        { text: "Follow it to the southern wall", children: ["The wall to the south of this room and the next is where the Colossus needs to be followed."] },
        { text: "Let it walk off the southern border", children: ["While it's still on-screen, stand in the area it just destroyed — this unlocks Torino as a playable character."] },
      ],
      note: "Once unlocked, Torino can be purchased for 5,000, which scales with other characters purchased.",
    },
  ],
};
const torinoPt = {
  objective: "Desbloquear Torino",
  dlc: "Base Game",
  rule: "Acorda o 17.º Colossus em Mazerella e deixa-o sair pelo limite sul sem nunca o enfurecer.",
  phases: [
    {
      icon: "🟢", title: "Fase 0 — Preparação", intro: "Recomendado, mas não obrigatório:",
      items: [
        { text: "Uma personagem voadora", children: ["A Gyoruntin consegue ignorar completamente as paredes do labirinto."] },
        { text: "Ou uma personagem invencível", children: ["A Megalo Menya Moonspell pode ficar perto do Colossus sem risco de um golpe o enfurecer."] },
      ],
      note: 'Evita o Modo Inverso para este Secret — ou, pelo menos, desactiva a opção "Visually Invert Stages".',
    },
    {
      icon: "🗿", title: "Fase 1 — Encontra e acorda o Colossus", intro: "Começa uma run em Mazerella:",
      items: [
        { text: "Chega à sala do 17.º Colossus", children: [{ text: "Personagem voadora:", children: ["Directamente a norte da sala inicial."] }, { text: "Personagem não voadora:", children: ["Este → Norte → Norte → Este → Norte → Norte → Este → Este → Norte → Oeste → Oeste → Norte → Oeste → Sul → Sul → Oeste → Norte → Norte"] }] },
        { text: "Reduz a sua vida a 90%", children: ["Está adormecido até lá — assim que acorda, começa a andar em linha recta para o fundo da fase."] },
      ],
    },
    {
      icon: "🚶", title: "Fase 2 — Deixa-o ir sem o enfurecer", intro: "É esta parte que desbloqueia mesmo o Torino:",
      items: [
        { text: "Nunca o deixes abaixo de 75% de vida", children: ["Danificá-lo mais do que isso enfurece-o — passa a atacar-te, o que faz falhar o Secret."] },
        { text: "Volta pelo mesmo caminho para sul", children: ["As mesmas direcções da Fase 1, ao contrário, mas sem a última viragem a oeste para a sala inicial: Sul → Sul → Este → Norte → Norte → Este → Sul → Este → Este → Sul → Oeste → Oeste → Sul → Sul → Oeste → Sul → Sul", "Depois, em vez de entrares na sala inicial, continua para sul: Sul → Sul → Sul → Sul → Oeste → Sul"] },
        { text: "Segue-o até à parede sul", children: ["A parede a sul desta sala e da seguinte é onde tens de seguir o Colossus."] },
        { text: "Deixa-o sair pelo limite sul", children: ["Enquanto ainda está no ecrã, fica na área que ele acabou de destruir — isto desbloqueia o Torino como personagem jogável."] },
      ],
      note: "Depois de desbloqueado, o Torino custa 5000 moedas — valor que sobe consoante o número de personagens já compradas.",
    },
  ],
};

// ---- Toastie (Base Game) -----------------------------------------------------
const toastieEn = {
  objective: "Unlock Toastie",
  dlc: "Base Game",
  rule: "Make Toastie appear by insta-killing specific enemies, then press Down + Enter in the half-second window while it's on screen.",
  phases: [
    { icon: "🟢", title: "Phase 0 — Preparation", items: [{ text: "Exdash Exiviiq", kind: "progression", children: ["Must already be unlocked, through any method."] }] },
    {
      icon: "👻", title: "Phase 1 — Make Toastie appear", intro: "Two ways to trigger it:",
      groups: [
        {
          title: "Method A — anywhere",
          items: [{ text: "Kill The Stalker, The Drowner, or The Trickster with an instant-kill", children: [{ text: "Qualifying weapons/items:", children: ["Rosary", "Gorgeous Moon", "Venus Crescent", "Infinite Corridor", "Crimson Shroud", "Victory Sword", "Dairy Cart"] }, "Not the same as Carréllo or Carrozza — and Dairy Carts don't appear in Inlaid Library, so Method B needs a different insta-kill."] }],
        },
        {
          title: "Method B — easier, unlimited retries",
          items: [
            { text: "Go to Inlaid Library with Inverse Mode enabled", children: ['Travel far right, past the Gold Ring, to find The Trickster.', 'It appears at the 2nd piano past the Gold Ring if "Visually Invert Stages" is off, or the 3rd if it\'s on.', "It won't appear at all until you've defeated The Directer."] },
            { text: "Hit The Trickster with an instant-kill", children: ["It won't die, but Toastie still appears — letting you try again as many times as you need in the same run."] },
          ],
        },
      ],
    },
    {
      icon: "⏱️", title: "Phase 2 — Catch it",
      items: [{ text: "Press Down + Enter at the same time while Toastie is on screen", children: ["You only get about half a second.", 'The S key (WASD\'s "down") doesn\'t count — it has to be the actual Down Arrow.', "On console: D-Pad down + confirm (A on Switch/Xbox, X on PlayStation)."] }],
      note: "Once unlocked, Toastie can be purchased for 777, which scales with other characters purchased.",
    },
  ],
};
const toastiePt = {
  objective: "Desbloquear Toastie",
  dlc: "Base Game",
  rule: "Faz aparecer o Toastie ao matar instantaneamente inimigos específicos, e depois carrega em Baixo + Enter na meia janela de segundo em que está visível.",
  phases: [
    { icon: "🟢", title: "Fase 0 — Preparação", items: [{ text: "Exdash Exiviiq", kind: "progression", children: ["Já tem de estar desbloqueado, seja por que método for."] }] },
    {
      icon: "👻", title: "Fase 1 — Faz aparecer o Toastie", intro: "Há duas formas de o desencadear:",
      groups: [
        {
          title: "Método A — em qualquer lado",
          items: [{ text: "Mata o Stalker, o Drowner ou o Trickster com um insta-kill", children: [{ text: "Armas/itens válidos:", children: ["Rosary", "Gorgeous Moon", "Venus Crescent", "Infinite Corridor", "Crimson Shroud", "Victory Sword", "Dairy Cart"] }, "Não é o mesmo que Carréllo ou Carrozza — e os Dairy Carts não aparecem em Inlaid Library, por isso o Método B precisa de outro insta-kill."] }],
        },
        {
          title: "Método B — mais fácil, tentativas ilimitadas",
          items: [
            { text: "Vai a Inlaid Library com o Modo Inverso activado", children: ['Viaja bem para a direita, para lá do Gold Ring, para encontrar o Trickster.', 'Aparece no 2.º piano depois do Gold Ring se a opção "Visually Invert Stages" estiver desligada, ou no 3.º se estiver ligada.', "Só aparece depois de derrotares o The Directer."] },
            { text: "Acerta no Trickster com um insta-kill", children: ["Não morre, mas o Toastie continua a aparecer — permitindo tentar as vezes que precisares, na mesma run."] },
          ],
        },
      ],
    },
    {
      icon: "⏱️", title: "Fase 2 — Apanha-o",
      items: [{ text: "Carrega em Baixo + Enter ao mesmo tempo enquanto o Toastie está visível", children: ["Só tens cerca de meio segundo.", 'A tecla S (o "baixo" do WASD) não conta — tem de ser mesmo a seta Para Baixo.', "Em consola: D-Pad para baixo + confirmar (A na Switch/Xbox, X na PlayStation)."] }],
      note: "Depois de desbloqueado, o Toastie custa 777 moedas — valor que sobe consoante o número de personagens já compradas.",
    },
  ],
};

// ---- Leda (Base Game) --------------------------------------------------------
const ledaEn = {
  objective: "Unlock Leda",
  dlc: "Base Game",
  rule: "Travel roughly 43–44 tiles south in Gallo Tower and defeat the hostile Leda waiting there.",
  phases: [
    {
      icon: "🟢", title: "Phase 0 — Preparation", intro: "Recommended, not required:",
      items: [
        { text: "A high movement speed character", children: ["Mask of the Red Death or Gazebo work well."] },
        { text: "Or Hyper Mode", children: ["The extra movement speed bonus helps you get there in time."] },
      ],
      note: "If you don't have Endless Mode yet, Hurry Mode is not recommended for this Secret.",
    },
    {
      icon: "🗼", title: "Phase 1 — Travel south", intro: "Start a run in Gallo Tower and keep heading south:",
      items: [
        { text: "Watch for the warning signs as you approach", children: ["The screen edges gradually darken.", 'The background runes change into the words "IAMALIVEHERE".', "About 5 tiles before her, the music is replaced by ominous wind-like ambience."] },
        { text: "Spot the hostile Leda", children: ["She appears roughly 43–44 tilesets below the starting room, in a room's center.", "Your limited vision at this point can make her hard to see, and she can sometimes be stuck in a wall.", "She also appears at minute 31, though other trigger conditions are unclear."] },
      ],
    },
    {
      icon: "⚔️", title: "Phase 2 — Defeat her",
      items: [
        { text: "Don't move away from her", children: ["She moves slowly and won't teleport to you if she goes off-screen — losing track of her makes this much harder."] },
        { text: "Defeat Leda", children: ["This re-illuminates the screen and unlocks her as a playable character."] },
      ],
      note: "Once unlocked, Leda can be purchased for 666, which scales with other characters purchased.",
    },
  ],
};
const ledaPt = {
  objective: "Desbloquear Leda",
  dlc: "Base Game",
  rule: "Viaja cerca de 43–44 tiles para sul em Gallo Tower e derrota a Leda hostil que lá espera.",
  phases: [
    {
      icon: "🟢", title: "Fase 0 — Preparação", intro: "Recomendado, mas não obrigatório:",
      items: [
        { text: "Uma personagem com velocidade de movimento alta", children: ["A Mask of the Red Death ou a Gazebo funcionam bem."] },
        { text: "Ou o Modo Hyper", children: ["O bónus extra de velocidade ajuda-te a chegar a tempo."] },
      ],
      note: "Se ainda não tiveres o Modo Endless, o Modo Hurry não é recomendado para este Secret.",
    },
    {
      icon: "🗼", title: "Fase 1 — Viaja para sul", intro: "Começa uma run em Gallo Tower e continua sempre para sul:",
      items: [
        { text: "Repara nos sinais de aviso à medida que te aproximas", children: ["As bordas do ecrã escurecem gradualmente.", 'As runas de fundo transformam-se nas palavras "IAMALIVEHERE".', "Cerca de 5 tiles antes dela, a música é substituída por um som de vento sinistro."] },
        { text: "Avista a Leda hostil", children: ["Aparece cerca de 43–44 tiles abaixo da sala inicial, no centro de uma sala.", "A tua visão limitada nesta altura pode dificultar vê-la, e por vezes fica presa numa parede.", "Também aparece ao minuto 31, embora outras condições de activação não sejam claras."] },
      ],
    },
    {
      icon: "⚔️", title: "Fase 2 — Derrota-a",
      items: [
        { text: "Não te afastes dela", children: ["Move-se devagar e não se teletransporta até ti se sair do ecrã — perdê-la de vista torna tudo muito mais difícil."] },
        { text: "Derrotar a Leda", children: ["Isto reilumina o ecrã e desbloqueia-a como personagem jogável."] },
      ],
      note: "Depois de desbloqueada, a Leda custa 666 moedas — valor que sobe consoante o número de personagens já compradas.",
    },
  ],
};

// ---- Cosmo Pavone (Base Game) ------------------------------------------------
const cosmoPavoneEn = {
  objective: "Unlock Cosmo Pavone",
  dlc: "Base Game",
  rule: "Complete a \"pure heart\" run in Cappella Magna with Peachone and Ebony Wings, then collect the Nduja Fritta Tanto near the north balcony.",
  phases: [
    { icon: "🟢", title: "Phase 0 — Preparation", items: [{ text: "Yellow Sign", kind: "progression" }, { text: "Zi'Assunta Belpaese", children: ["Unlock her by opening her coffin in Cappella Magna."] }] },
    {
      icon: "🥚", title: "Phase 1 — Set up the \"pure heart\" run",
      items: [
        { text: "Start a run in Cappella Magna having picked up 0 Golden Eggs", children: ["Toggling eggs off in the character-select menu does NOT count — you need to genuinely not have collected any."] },
        { text: "Obtain Peachone and Ebony Wings", children: ["Don't evolve them into the Vandalier."] },
      ],
    },
    {
      icon: "🕯️", title: "Phase 2 — Find and unlock him",
      items: [
        { text: "Travel north, past the Crown and Tirajisú", children: ["Look for the Nduja Fritta Tanto near a balcony."] },
        { text: "Collect the Nduja Fritta Tanto", children: ["With every condition above met, this spawns Cosmo Pavone on the balcony and removes the gate blocking it."] },
        { text: "Approach and interact with Cosmo Pavone", children: ["A flash similar to a Rosary plays, then he's unlocked as a playable character."] },
      ],
      note: "Alternative: if you haven't defeated The Ender yet, starting that fight while standing near the balcony makes the walls and gates disappear — you can then walk over and collect Cosmo Pavone right after the battle. Once unlocked, he can be purchased for 666, which scales with other characters purchased.",
    },
  ],
};
const cosmoPavonePt = {
  objective: "Desbloquear Cosmo Pavone",
  dlc: "Base Game",
  rule: "Completa uma run de \"coração puro\" em Cappella Magna com o Peachone e o Ebony Wings, e depois apanha o Nduja Fritta Tanto perto da varanda a norte.",
  phases: [
    { icon: "🟢", title: "Fase 0 — Preparação", items: [{ text: "Yellow Sign", kind: "progression" }, { text: "Zi'Assunta Belpaese", children: ["Desbloqueia-a ao abrir o seu caixão em Cappella Magna."] }] },
    {
      icon: "🥚", title: "Fase 1 — Prepara a run de \"coração puro\"",
      items: [
        { text: "Começa uma run em Cappella Magna sem teres apanhado nenhum Golden Egg", children: ["Desligar os ovos no menu de selecção de personagem NÃO conta — tens mesmo de não ter apanhado nenhum."] },
        { text: "Obtém o Peachone e o Ebony Wings", children: ["Não os evoluas em Vandalier."] },
      ],
    },
    {
      icon: "🕯️", title: "Fase 2 — Encontra-o e desbloqueia-o",
      items: [
        { text: "Viaja para norte, para lá do Crown e do Tirajisú", children: ["Procura o Nduja Fritta Tanto perto de uma varanda."] },
        { text: "Apanha o Nduja Fritta Tanto", children: ["Com todas as condições acima cumpridas, isto faz aparecer o Cosmo Pavone na varanda e remove o portão que o bloqueia."] },
        { text: "Aproxima-te e interage com o Cosmo Pavone", children: ["Ocorre um clarão semelhante ao do Rosary, e depois fica desbloqueado como personagem jogável."] },
      ],
      note: "Alternativa: se ainda não tiveres derrotado o The Ender, começar esse combate perto da varanda faz desaparecer as paredes e portões — podes então atravessar e apanhar o Cosmo Pavone logo a seguir ao combate. Depois de desbloqueado, custa 666 moedas — valor que sobe consoante o número de personagens já compradas.",
    },
  ],
};

// ---- Space Dette (Base Game) --------------------------------------------------
const spaceDetteEn = {
  objective: "Unlock Space Dette",
  dlc: "Base Game",
  rule: "Find and interact with a hidden pulsating pillar near the spawn point in Space 54, before it disappears at 11:00.",
  phases: [
    { icon: "🟢", title: "Phase 0 — Preparation", items: [{ text: "Space Dude", kind: "progression", children: ["Must already be unlocked."] }], note: "A wall-ignoring character like Gyoruntin trivializes finding the pillar, and the Roast Chicken with a Clock in the Middle's speed bonus makes travelling there faster." },
    { icon: "🪐", title: "Phase 1 — Find the pillar", intro: "Start a run in Space 54:", items: [{ text: "Locate the pillar with a pulsating Pummarola icon", children: ['Less than one tile south-east of your spawn point — or north-west of it if "Visually Invert Stages" and Inverse Mode are both enabled.', "It isn't shown on the Milky Way Map."] }], note: "The pillar disappears along with the rest of the stage at 11:00 — don't waste time." },
    { icon: "🍅", title: "Phase 2 — Unlock her", items: [{ text: "Interact with the Pummarola icon", children: ["Unlocks Space Dette as a playable character."] }], note: "After unlocking, Space Dette can be purchased for 5,000, which scales with other characters purchased." },
  ],
};
const spaceDettePt = {
  objective: "Desbloquear Space Dette",
  dlc: "Base Game",
  rule: "Encontra e interage com um pilar escondido e pulsante perto do ponto de partida em Space 54, antes de desaparecer aos 11:00.",
  phases: [
    { icon: "🟢", title: "Fase 0 — Preparação", items: [{ text: "Space Dude", kind: "progression", children: ["Já tem de estar desbloqueado."] }], note: "Uma personagem que ignore paredes, como a Gyoruntin, torna trivial encontrar o pilar, e o bónus de velocidade do Roast Chicken with a Clock in the Middle ajuda a chegar mais depressa." },
    { icon: "🪐", title: "Fase 1 — Encontra o pilar", intro: "Começa uma run em Space 54:", items: [{ text: "Localiza o pilar com um ícone pulsante de Pummarola", children: ['A menos de um tile a sudeste do teu ponto de partida — ou a noroeste, se a opção "Visually Invert Stages" e o Modo Inverso estiverem ambos activados.', "Não aparece no Milky Way Map."] }], note: "O pilar desaparece junto com o resto da fase aos 11:00 — não percas tempo." },
    { icon: "🍅", title: "Fase 2 — Desbloqueia-a", items: [{ text: "Interage com o ícone de Pummarola", children: ["Desbloqueia a Space Dette como personagem jogável."] }], note: "Depois de desbloqueada, a Space Dette custa 5000 moedas — valor que sobe consoante o número de personagens já compradas." },
  ],
};

// ---- Jiangshi (Ode to Castlevania) --------------------------------------------
const jiangshiEn = {
  objective: "Unlock Jiangshi",
  dlc: "Ode to Castlevania",
  rule: "Defeat 5,000 enemies with Dark Frogamorphosis's insta-kill tongue attack in a single Mad Forest run.",
  phases: [
    { icon: "🟢", title: "Phase 0 — Preparation", items: [{ text: "Pile of Secrets", kind: "progression" }] },
    {
      icon: "🐸", title: "Phase 1 — Build for the kill count",
      items: [
        { text: "Evolve Anura + Soul Eater into Dark Frogamorphosis", children: ["Prioritise getting this weapon as early as possible in the run."] },
        { text: "Pick supporting Arcana", children: ["Randomazzo choices like Gemini (I) and Sapphire Mist (I) work well.", "Avoid taking many other weapons unless you really need them."] },
        { text: "Consider lowering your Might", children: ["Helps stop other weapons from \"stealing\" the kills you need tracked to Dark Frogamorphosis."] },
        { text: "Consider a character with built-in healing", children: ["Megalo Menya Moonspell, Young Maria Renard, or an Emerald Diorama character with something like Crystal Cries (XII) make surviving the run much easier."] },
      ],
    },
    {
      icon: "🌲", title: "Phase 2 — Get the kills", intro: "Start a run in Mad Forest:",
      items: [{ text: "Defeat 5,000 enemies with Dark Frogamorphosis's tongue attack, in a single run", children: ['Despite the in-game unlock text showing 10,000, the real tracked requirement ("EnemiesEatenThisRun") is 5,000.', "Only the central insta-kill tongue attack counts — the frogs it summons and Soul Eater's aura don't.", "Endless Mode is heavily recommended, so you have enough time to land all 5,000 kills."] }],
    },
  ],
};
const jiangshiPt = {
  objective: "Desbloquear Jiangshi",
  dlc: "Ode to Castlevania",
  rule: "Derrota 5000 inimigos com o ataque de língua insta-kill do Dark Frogamorphosis, numa única run em Mad Forest.",
  phases: [
    { icon: "🟢", title: "Fase 0 — Preparação", items: [{ text: "Pile of Secrets", kind: "progression" }] },
    {
      icon: "🐸", title: "Fase 1 — Prepara a build para as mortes",
      items: [
        { text: "Evolui o Anura + Soul Eater em Dark Frogamorphosis", children: ["Prioriza obter esta arma o mais cedo possível na run."] },
        { text: "Escolhe Arcanas de apoio", children: ["Opções de Randomazzo como Gemini (I) e Sapphire Mist (I) funcionam bem.", "Evita levar muitas outras armas, a menos que precises mesmo delas."] },
        { text: "Considera baixar o teu Might", children: ["Ajuda a evitar que outras armas \"roubem\" as mortes que precisas de atribuir ao Dark Frogamorphosis."] },
        { text: "Considera uma personagem com cura própria", children: ["A Megalo Menya Moonspell, a Young Maria Renard, ou uma personagem da Emerald Diorama com algo como o Crystal Cries (XII) tornam a sobrevivência muito mais fácil."] },
      ],
    },
    {
      icon: "🌲", title: "Fase 2 — Consegue as mortes", intro: "Começa uma run em Mad Forest:",
      items: [{ text: "Derrota 5000 inimigos com o ataque de língua do Dark Frogamorphosis, na mesma run", children: ['Apesar de o texto de desbloqueio no jogo mostrar 10 000, o requisito real controlado ("EnemiesEatenThisRun") é 5000.', "Só conta o ataque central de língua que mata instantaneamente — os sapos invocados e a aura do Soul Eater não contam.", "O Modo Endless é altamente recomendado, para teres tempo suficiente para conseguir as 5000 mortes."] }],
    },
  ],
};

// ---- Big Trouser (Base Game) ---------------------------------------------------
const bigTrouserEn = {
  objective: "Unlock Big Trouser",
  dlc: "Base Game",
  rule: "Collect and max out all 16 standard Moongolow stage items in a single run, then end it without losing Tirajisú.",
  phases: [
    {
      icon: "🟢", title: "Phase 0 — Preparation", intro: "Recommended, not required:",
      items: [
        { text: "Gains Boros", children: ["Its exponential leveling makes maxing out 16 items much faster."] },
        { text: "Or an invincible character", children: ["One that can only die from the time limit, like Megalo Menya Moonspell or Ghost Lino."] },
        { text: "Set your weapon limit to 1", children: ["Keeps weapon pickups from diluting the item pool — Gains Boros's Heaven Sword alone is enough to handle enemies."] },
      ],
    },
    { icon: "🎒", title: "Phase 1 — Max out all 16 items", intro: "Start a run in Moongolow:", items: [{ text: "Collect all 16 standard stage items" }, { text: "Level every one of them to its maximum level" }] },
    {
      icon: "🏁", title: "Phase 2 — End the run correctly",
      items: [
        { text: "Quit manually, or complete the run via Holy Forbidden", children: ["Either ends the run and unlocks Big Trouser as a playable character."] },
        { text: "Don't end it by dying with Tirajisú's revives already used up", children: ["Tirajisú is lost once both of its revives are spent — dying after that means you no longer have it (or your full set of maxed items) at the end of the run, and Big Trouser won't unlock."] },
      ],
      note: "Once unlocked, Big Trouser can be purchased for 5,000, which scales with other characters purchased.",
    },
  ],
};
const bigTrouserPt = {
  objective: "Desbloquear Big Trouser",
  dlc: "Base Game",
  rule: "Apanha e maximiza os 16 itens de fase base de Moongolow na mesma run, e termina-a sem perderes o Tirajisú.",
  phases: [
    {
      icon: "🟢", title: "Fase 0 — Preparação", intro: "Recomendado, mas não obrigatório:",
      items: [
        { text: "Gains Boros", children: ["A sua subida de nível exponencial torna muito mais rápido maximizar 16 itens."] },
        { text: "Ou uma personagem invencível", children: ["Uma que só possa morrer pelo limite de tempo, como a Megalo Menya Moonspell ou o Ghost Lino."] },
        { text: "Define o limite de armas para 1", children: ["Evita que apanhares armas dilua o pool de itens — o Heaven Sword do Gains Boros sozinho já chega para lidar com os inimigos."] },
      ],
    },
    { icon: "🎒", title: "Fase 1 — Maximiza os 16 itens", intro: "Começa uma run em Moongolow:", items: [{ text: "Apanha os 16 itens de fase base" }, { text: "Sobe cada um deles até ao nível máximo" }] },
    {
      icon: "🏁", title: "Fase 2 — Termina a run correctamente",
      items: [
        { text: "Sai manualmente, ou completa a run através do Holy Forbidden", children: ["Qualquer uma das opções termina a run e desbloqueia o Big Trouser como personagem jogável."] },
        { text: "Não termines a run morrendo depois de gastares as duas revives do Tirajisú", children: ["O Tirajisú perde-se assim que as suas duas revives são usadas — morrer depois disso significa que já não o tens (nem o conjunto completo de itens maximizados) no final da run, e o Big Trouser não desbloqueia."] },
      ],
      note: "Depois de desbloqueado, o Big Trouser custa 5000 moedas — valor que sobe consoante o número de personagens já compradas.",
    },
  ],
};

// ---- O'Sole Meeo (Base Game) ----------------------------------------------------
const oSoleMeeoEn = {
  objective: "Unlock O'Sole Meeo",
  dlc: "Base Game",
  rule: "Defeat a total of 3,000 Dragon Shrimps, across any number of runs.",
  phases: [
    {
      icon: "🐉", title: "Phase 0 — Get the kills",
      items: [{ text: "Defeat a total of 3,000 Dragon Shrimps", children: [{ text: "Counts:", children: ["Dragon Shrimp", "Flame Dragon Shrimp", "Serpentine Dragon Shrimp", "Serpentine Flame Dragon Shrimp"] }, { text: "Doesn't count (The Bone Zone boss versions):", children: ["Colossal Bone Dragon", "Colossal Flame Dragon", "Serpentine Skeleton Dragons"] }] }],
      note: "Once unlocked, O'Sole can be purchased for 500, which scales with other characters purchased.",
    },
    { icon: "🎃", title: "Bonus — Halloween skin", items: [{ text: 'Cast the spell "spoopyseason"', children: ["Makes you enter The Bone Zone with Bianca Ramba, Yatta Cavallo, Mortaccio, or O'Sole Meeo already in their Halloween costume.", "You don't need to reach 30:00 in The Bone Zone for the skin to stay unlocked — exit whenever you like."] }] },
  ],
};
const oSoleMeeoPt = {
  objective: "Desbloquear O'Sole Meeo",
  dlc: "Base Game",
  rule: "Derrota um total de 3000 Dragon Shrimps, ao longo de qualquer número de runs.",
  phases: [
    {
      icon: "🐉", title: "Fase 0 — Consegue as mortes",
      items: [{ text: "Derrota um total de 3000 Dragon Shrimps", children: [{ text: "Contam:", children: ["Dragon Shrimp", "Flame Dragon Shrimp", "Serpentine Dragon Shrimp", "Serpentine Flame Dragon Shrimp"] }, { text: "Não contam (as versões boss de The Bone Zone):", children: ["Colossal Bone Dragon", "Colossal Flame Dragon", "Serpentine Skeleton Dragons"] }] }],
      note: "Depois de desbloqueado, o O'Sole custa 500 moedas — valor que sobe consoante o número de personagens já compradas.",
    },
    { icon: "🎃", title: "Bónus — skin de Halloween", items: [{ text: 'Lança o feitiço "spoopyseason"', children: ["Faz-te entrar em The Bone Zone com a Bianca Ramba, o Yatta Cavallo, o Mortaccio ou o O'Sole Meeo já no traje de Halloween.", "Não precisas de chegar aos 30:00 em The Bone Zone para o skin ficar desbloqueado — podes sair quando quiseres."] }] },
  ],
};

module.exports = {
  chaos: { en: chaosEn, pt: chaosPt },
  "fake-trio": { en: fakeTrioEn, pt: fakeTrioPt },
  "avatar-infernas": { en: avatarInfernasEn, pt: avatarInfernasPt },
  torino: { en: torinoEn, pt: torinoPt },
  toastie: { en: toastieEn, pt: toastiePt },
  leda: { en: ledaEn, pt: ledaPt },
  "cosmo-pavone": { en: cosmoPavoneEn, pt: cosmoPavonePt },
  "space-dette": { en: spaceDetteEn, pt: spaceDettePt },
  jiangshi: { en: jiangshiEn, pt: jiangshiPt },
  "big-trouser": { en: bigTrouserEn, pt: bigTrouserPt },
  "o-sole-meeo": { en: oSoleMeeoEn, pt: oSoleMeeoPt },
};
