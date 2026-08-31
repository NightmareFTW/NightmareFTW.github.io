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

   Written in English to match every other character's scraped guide content
   sitewide (the site's data is always English; only page chrome is
   translated via assets/js/i18n.js) — this is content, not chrome.

   Schema, per slug:
     { objective, dlc, rule, phases: [ Phase ] }
   Phase:
     { icon, title, intro?, note?,
       items?: [ Item ],                 // flat phase
       groups?: [ { title?, items: [ Item ] } ] }  // phase split into sub-groups
   Item (one checkable step — the checkbox unit; ids are positional, so keep
   phase/group/item order stable across edits):
     { text, kind?: "progression", children?: [ Node ] }
   Node (nested, non-checkable explanatory bullet):
     string | { text, children?: [ Node ] }

   Character and achievement names inside `text`/children are cross-linked
   automatically by character.js's existing linkify() — no manual links
   needed here, just use the exact in-game name. */

module.exports = {
  chaos: {
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
  },
};
