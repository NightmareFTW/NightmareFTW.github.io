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
  },
};
