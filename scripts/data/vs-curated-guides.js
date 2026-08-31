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

module.exports = {
  chaos: { en: chaosEn, pt: chaosPt },
};
