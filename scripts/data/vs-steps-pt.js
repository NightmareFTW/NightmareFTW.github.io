/* Portuguese (PT-PT) translations for the mechanically-scraped `unlockShort`
   and `steps` text of every Vampire Survivors character.

   Characters WITH a full curated guide (vs-curated-guides.js) only need an
   `unlockShort` entry here — character.js still shows that one-line summary
   above the phased guide, but never renders the flat `steps` checklist once
   guide.phases exists, so there's no need to translate steps for them.

   Unlike the curated guides, this content is just a straight translation of
   the wiki's own English "Unlocking" text (update-vampire-survivors.js's
   toSteps already split it into sentences) — so, critically, each entry's
   `steps` array here MUST have the exact same length and order as the
   matching character's scraped `steps` array. IDs on the unlock-guide
   checklist are positional (character.js's stepId uses the array index), so
   a mismatched count would silently scramble a viewer's saved progress the
   moment they switch language. update-vampire-survivors.js's run() merges
   this in every re-scrape and drops any slug whose PT step count no longer
   matches the freshly-scraped English one, rather than risk that.

   Character/weapon/stage/item names are proper nouns and stay identical to
   the English text (also required for character.js's linkify() to keep
   cross-linking them) — only the surrounding sentence is translated.

   Schema, per slug: { unlockShort: string, steps: string[] } */
module.exports = {
  // ---- Characters with a full curated guide (unlockShort only) --------------
  "fake-trio": { unlockShort: "Encontra a forma final das ofertas do Master Librarian." },
  "avatar-infernas": { unlockShort: "Só se torna tangível na Inlaid Library invertida. Bons amigos podem então mostrar o caminho." },
  torino: { unlockShort: "Testemunha o 17.º Colossus a vaguear para novos horizontes." },
  toastie: { unlockShort: "2) Um golpe ascendente num reaper que não seja vermelho." },
  leda: { unlockShort: "Investiga o fundo de Gallo Tower." },
  "cosmo-pavone": { unlockShort: "Com um coração puro e dois bons amigos, visita a varanda em chamas em Cappella Magna." },
  "space-dette": { unlockShort: "Quebra rapidamente os limites do Espaço e encontra o Amor." },
  jiangshi: { unlockShort: "Devora as almas de 10 000 sapos da floresta." },
  "big-trouser": { unlockShort: "Domina os 16 acessórios em Moongolow." },
  "o-sole-meeo": { unlockShort: "Derrota um total de 3000 Dragon Shrimps." },

  // ---- Ante Chamber ---------------------------------------------------------
  canio: {
    unlockShort: "Evolui o Infernolatro.",
    steps: ["Desbloqueia-se ao evoluir o Infernolatro em NaneInferno, com o Outer Saboteur no nível máximo."],
  },
  chicot: {
    unlockShort: "Evolui o Fibonacci Spritz.",
    steps: ["Desbloqueia-se ao evoluir o Fibonacci Spritz em Royal Flush, com o Outer Saboteur no nível máximo."],
  },
  jimbo: {
    unlockShort: "Encontra e abre o caixão na Ante Chamber.",
    steps: [
      "Desbloqueia-se ao entrar na fase Ante Chamber, localizar o caixão e abri-lo.",
      "Encontra-se vários tiles a nordeste do ponto de partida.",
    ],
  },
  perkeo: {
    unlockShort: "Evolui o Gros Michel.",
    steps: ["Desbloqueia-se ao evoluir o Gros Michel em Cavendish, com o Outer Saboteur no nível máximo."],
  },

  // ---- Tides of the Foscari ---------------------------------------------------
  "eleanor-uziron": {
    unlockShort: "Encontra e abre o caixão em Lake Foscari.",
    steps: [
      "Fica disponível para compra ao encontrar e abrir o seu caixão em Lake Foscari.",
      "Custa 500 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "genevieve-gruy-re": {
    unlockShort: "Com a Eleanor, quebra o Seal of the Banished.",
    steps: [
      "Desbloqueia-se ao quebrar o Seal of the Banished em Abyss Foscari com o SpellStrom, jogando como Eleanor Uziron.",
      "Custa 5000 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "je-ne-viv": {
    unlockShort: "Derrota 100 000 inimigos numa única run com a Genevieve Gruyère.",
    steps: [
      "Desbloqueia-se ao derrotar 100 000 inimigos numa única run com a Genevieve Gruyère.",
      "Depois de desbloqueado, custa 300 000 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "keitha-muort": {
    unlockShort: "Evolui o Eskizzibur.",
    steps: [
      "Desbloqueia-se ao evoluir o Eskizzibur.",
      "Custa 3000 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "luminaire-foscari": {
    unlockShort: "Com o Maruto, quebra o Seal of the Abyss.",
    steps: [
      "Desbloqueia-se ao quebrar o Seal of the Abyss em Abyss Foscari com o Legionnaire, jogando como Maruto Cuts.",
      "Depois de desbloqueado, custa 5000 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "maruto-cuts": {
    unlockShort: "Une o SpellString, o SpellStream e o SpellStrike.",
    steps: [
      "Desbloqueia-se ao unir o SpellString, o SpellStream e o SpellStrike.",
      "Custa 3000 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "rottin-ghoul": {
    unlockShort: "Derrota 6000 Rotting Ghouls.",
    steps: ["Desbloqueia-se ao derrotar um total de 6000 Rotting Ghouls; depois, custa 500 moedas — valor que sobe consoante o número de personagens já compradas."],
  },
  sammy: {
    unlockShort: "Derrota um total de 6000 Sammies.",
    steps: [
      "Desbloqueia-se ao derrotar um total de 6000 Sammy the Caterpillars.",
      "Depois de desbloqueado, custa 50 000 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },

  // ---- Emergency Meeting -------------------------------------------------------
  "crewmate-dino": {
    unlockShort: "Encontra e abre o caixão em Polus Replica.",
    steps: [
      "Fica disponível para compra ao encontrar e abrir o seu caixão em Polus Replica.",
      "Custa 100 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "engineer-gino": {
    unlockShort: "Evolui o Sharp Tongue.",
    steps: [
      "Fica disponível para compra ao evoluir o Sharp Tongue.",
      "Custa 500 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "ghost-lino": {
    unlockShort: "Evolui o Lifesign Scan.",
    steps: [
      "Fica disponível para compra ao evoluir o Lifesign Scan.",
      "Custa 500 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "guardian-pina": {
    unlockShort: "Derrota 1 inimigo com o Ghost Lino?!",
    steps: [
      "Fica disponível para compra ao derrotar 1 inimigo com o Ghost Lino.",
      "Custa 500 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  horse: {
    unlockShort: "Derrota um total de 6000 inimigos de aspecto suspeito.",
    steps: [
      "Fica disponível para compra ao derrotar um total de 6000 inimigos de aspecto suspeito — Pinthot & Coldellini, Space Apparition e Suspicio.",
      "Custa 500 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "impostor-rina": {
    unlockShort: "Evolui o Report!.",
    steps: [
      "Fica disponível para compra ao evoluir o Report!.",
      "Custa 500 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "megalo-impostor-rina": {
    unlockShort: "Derrota 100 000 inimigos numa run com a Impostor Rina.",
    steps: [
      "Desbloqueia-se ao derrotar 100 000 inimigos numa única run como Impostor Rina.",
      "Custa 1000 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "scientist-mina": {
    unlockShort: "Evolui o Lucky Swipe.",
    steps: [
      "Fica disponível para compra ao evoluir o Lucky Swipe.",
      "Custa 500 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "shapeshifter-nino": {
    unlockShort: "Evolui o Science Rocks.",
    steps: [
      "Fica disponível para compra ao evoluir o Science Rocks.",
      "Custa 500 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },

  // ---- Legacy of the Bloodmoon --------------------------------------------------
  ashtart: {
    unlockShort: "Evolui a Ashella.",
    steps: ["Desbloqueia-se ao evoluir a Ashella.", "Depois, tem de ser comprada."],
  },
  "baal-thamut": {
    unlockShort: "Com o Velvet Dodecahedron equipado, obtém o Damnation com o Baal'Thasar.",
    steps: [
      "Desbloqueia-se ao ter o Velvet Dodecahedron equipado e obter o Damnation jogando como Baal'Thasar.",
      "Depois, tem de ser comprado por 100 000 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "baal-thasar": {
    unlockShort: "Derrota o Baal'Thasar em Red Moon Manor.",
    steps: ["Desbloqueia-se ao derrotar o Baal'Thasar em Red Moon Manor."],
  },
  "calogero-bloodmoon": {
    unlockShort: "Evolui o Scarlet Needle.",
    steps: ["Desbloqueia-se ao evoluir o Scarlet Needle.", "Depois de desbloqueado, custa 3000 moedas."],
  },
  congregation: {
    unlockShort: "Morre um total de 7 vezes com o Nameless Fool.",
    steps: [
      "Desbloqueia-se ao morrer sete vezes jogando como Nameless Fool.",
      "Não precisa de ser na mesma run — pode ser feito ao longo de várias runs.",
    ],
  },
  "in-kujata": {
    unlockShort: "Parte a estátua de Kujata com 108 Bocce ou 108 Responsive Prayers.",
    steps: [
      "Desbloqueia-se ao partir a estátua de Kujata no cemitério (normalmente situado a sudoeste) de Red Moon Manor, com 108 Bocce ou 108 Responsive Prayers.",
      "Depois, tem de ser comprado por 5000 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "jaman-jato": {
    unlockShort: "Derrota um total de 6000 Jaman Jatos.",
    steps: [
      "Desbloqueia-se ao derrotar um total de 6000 Jaman Jatos.",
      "Terminar um nível com o Jaman Jato ★ desbloqueia o nível seguinte, até chegar ao Jaman Jato ★★★★★.",
      "É preciso completar níveis diferentes para desbloquear cada nova variante — repetir sempre o mesmo mapa não avança para a fase seguinte da personagem.",
    ],
  },
  "malice-bloodmoon": {
    unlockShort: "Encontra e abre o caixão em Red Moon Manor.",
    steps: ["Desbloqueia-se ao encontrar e abrir o seu caixão em Red Moon Manor."],
  },
  "megalo-sargon": {
    unlockShort: "Com o Velvet Dodecahedron equipado, obtém o FireStall com o Sargon.",
    steps: [
      "Desbloqueia-se ao evoluir o FireFall, o FireBall e o FireWall em FireStall, e apanhar o Velvet Dodecahedron.",
      "Depois, tem de ser comprado por 100 000 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "nameless-fool": {
    unlockShort: "Sobe o Descent Into Misery até ao nível 9.",
    steps: [
      "Desbloqueia-se ao subir o Descent Into Misery até ao nível 9.",
      "Custa 3000 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "nameless-saint": {
    unlockShort: "Derrota Ashtart, Sargon, Congregation e Baal na mesma run.",
    steps: ["Desbloqueia-se ao derrotar Ashtart, Sargon, Congregation e Baal na mesma run."],
  },
  sargon: {
    unlockShort: "Evolui o Incineration.",
    steps: ["Desbloqueia-se ao evoluir o Incineration.", "Depois, tem de ser comprado."],
  },

  // ---- Legacy of the Moonspell --------------------------------------------------
  "babi-onna": {
    unlockShort: "Evolui o Summon Night.",
    steps: [
      "Desbloqueia-se ao evoluir a arma Summon Night.",
      "Custa 5000 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "gav-et-oni": {
    unlockShort: "Derrota 6000 Kappas.",
    steps: ["Desbloqueia-se ao derrotar um total de 6000 Kappas; depois, custa 500 moedas — valor que sobe consoante o número de personagens já compradas."],
  },
  gekkojin: {
    unlockShort: "Une o LunarMight, o LunarBight e o LunarSight.",
    steps: ["Desbloqueia-se ao unir o LunarMight, o LunarSight e o LunarBight em LunarFlight."],
  },
  "mccoy-oni": {
    unlockShort: "Evolui o Mirage Robe.",
    steps: [
      "Desbloqueia-se ao evoluir a arma Mirage Robe.",
      "Custa 5000 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "megalo-menya-moonspell": {
    unlockShort: "Derrota 100 000 inimigos numa única run com a Menya Moonspell.",
    steps: [
      "Desbloqueia-se ao derrotar 100 000 inimigos numa única run com a Menya.",
      "Custa 50 000 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "megalo-miang-moonspell": {
    unlockShort: "Com o Pearl Magatama equipado, obtém o Argent Flow com a Miang Moonspell.",
    steps: ["Desbloqueia-se ao evoluir o Festive Winds em Argent Flow e obter o Pearl Magatama, jogando como Miang Moonspell."],
  },
  "megalo-syuuto-moonspell": {
    unlockShort: "Derrota 100 000 inimigos numa única run com o Syuuto Moonspell.",
    steps: [
      "Desbloqueia-se ao derrotar 100 000 inimigos numa única run com o Syuuto.",
      "Custa 5000 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "menya-moonspell": {
    unlockShort: "Evolui o Silver Wind.",
    steps: [
      "Desbloqueia-se ao evoluir a arma Silver Wind.",
      "Custa 5000 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "miang-moonspell": {
    unlockShort: "Encontra e abre o caixão em Mt. Moonspell.",
    steps: [
      "Fica disponível para compra ao encontrar e abrir o seu caixão em Mt. Moonspell.",
      "Custa 1000 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  spiritosa: {
    unlockShort: "Chega ao nível 80 com o Gekkojin.",
    steps: ["Desbloqueia-se ao chegar ao nível 80 jogando como Gekkojin."],
  },
  spiritoso: {
    unlockShort: "Evolui o Mille Bolle Blu.",
    steps: ["Desbloqueia-se ao evoluir o Mille Bolle Blu."],
  },
  "syuuto-moonspell": {
    unlockShort: "Evolui o Four Seasons.",
    steps: [
      "Desbloqueia-se ao evoluir a arma Four Seasons.",
      "Custa 5000 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },

  // ---- Operation Guns -----------------------------------------------------------
  ariana: {
    unlockShort: "Evolui o Short Gun.",
    steps: [
      "Fica disponível para compra ao evoluir o Short Gun.",
      "Custa 100 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "bill-rizer": {
    unlockShort: "Encontra e abre o caixão em Neo Galuga.",
    steps: [
      "Fica disponível para compra ao encontrar e abrir o seu caixão em Neo Galuga.",
      "Custa 100 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "brad-fang": {
    unlockShort: "Encontra e abre o caixão em Hectic Highway.",
    steps: [
      "Fica disponível para compra ao abrir o seu caixão em Hectic Highway, fase que se desbloqueia ao evoluir o C-U-Laser.",
      "Custa 500 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  browny: {
    unlockShort: "Evolui o Firearm.",
    steps: [
      "Fica disponível para compra ao evoluir o Firearm.",
      "Custa 500 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "colonel-bahamut": {
    unlockShort: "Derrota o Big Fuzz em Neo Galuga.",
    steps: [
      "Fica disponível para compra ao derrotar o Big Fuzz em Neo Galuga.",
      "Custa 5000 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "lance-bean": {
    unlockShort: "Evolui o Long Gun.",
    steps: [
      "Fica disponível para compra ao evoluir o Long Gun.",
      "Custa 100 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "lucia-zero": {
    unlockShort: "Evolui o Spread Shot.",
    steps: [
      "Fica disponível para compra ao evoluir o Spread Shot.",
      "Custa 500 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "newt-plissken": {
    unlockShort: "Encontra 21 Grenades.",
    steps: [
      "Fica disponível para compra ao encontrar 21 Grenades.",
      "Custa 500 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  probotector: {
    unlockShort: "Encontra 14 Barriers.",
    steps: [
      "Fica disponível para compra ao encontrar 14 Barriers.",
      "Custa 500 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "sheena-etranzi": {
    unlockShort: "Evolui o Sonic Bloom.",
    steps: [
      "Fica disponível para compra ao evoluir o Sonic Bloom.",
      "Custa 500 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "simondo-belmont": {
    unlockShort: "Evolui o Diver Mines.",
    steps: [
      "Fica disponível para compra ao evoluir o Diver Mines.",
      "Custa 10 000 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  stanley: {
    unlockShort: "Encontra 21 Rapid Fires.",
    steps: [
      "Fica disponível para compra ao encontrar 21 Rapid Fires.",
      "Custa 500 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },

  // ---- Emerald Diorama ------------------------------------------------------
  "ameya-aisling": {
    unlockShort: "Evolui completamente o Twin Dragon.",
    steps: [
      "Desbloqueia-se ao evoluir completamente o Twin Dragon (em Gekkabijin, e depois até ao nível máximo, o 6).",
      "Evoluir o Spirit Rings desbloqueia o Intuition como arma inicial opcional dela.",
    ],
  },
  "bonnie-blair": {
    unlockShort: "Evolui completamente o Splashers.",
    steps: [
      "Desbloqueia-se ao evoluir completamente o Splashers.",
      "Depois de desbloqueada, custa 5000 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "diva-no-5-retro-pod": {
    unlockShort: "",
    steps: [
      "Diva No.",
      "5 desbloqueia-se ao evoluir completamente o Eagle Gun.",
      "5 também pode ser desbloqueada nos Forbidden Scrolls of Morbane, lançando os seguintes feitiços por qualquer ordem.",
      '"ttwosixtyg"',
      '"avalonssongstress"',
      '"mechwardrobe"',
    ],
  },
  dolores: {
    unlockShort: "Derrota o Specter of Iwanaga-hime com o Siugnas em Yomi, na Inverse Emerald Diorama.",
    steps: ["Desbloqueia-se ao derrotar o Specter of Iwanaga-hime com o Siugnas em Yomi (mundo sudeste), na Inverse Emerald Diorama."],
  },
  "final-emperor": {
    unlockShort: "Derrota a sua forma demoníaca com a Bonnie Blair ou a Formina Franklyn em Grelon, na Inverse Emerald Diorama.",
    steps: ["Desbloqueia-se ao derrotar a sua forma demoníaca (Malevolent Door Spirit) com a Bonnie Blair ou a Formina Franklyn em Grelon (mundo noroeste), na Inverse Emerald Diorama."],
  },
  "formina-franklyn": {
    unlockShort: "Evolui completamente o Kick.",
    steps: [
      "Desbloqueia-se ao evoluir completamente o Kick (até ao Triangle Kick no nível máximo).",
      "=== Skins ===",
      "Evoluir completamente o Saber Machine Gun desbloqueia um skin alternativo que usa o Eagle Gun como arma inicial, além de um skin 'solo' para ambas as armas.",
    ],
  },
  imakoo: {
    unlockShort: "Acaba com a angústia com uma melodia de outro mundo, na pele da maior cantora mecânica.",
    steps: [
      "Desbloqueia-se ao derrotar o Living Anguish, o boss em Providence, jogando como Diva No.",
      "5 no skin alternativo 'Virginia', tendo equipado o Song of Mana ou a sua evolução, o Mannajja.",
      "Basta que uma destas armas esteja no inventário — qualquer arma pode dar o golpe final.",
    ],
  },
  kina: {
    unlockShort: "Recusa o chamado à aventura na Emerald Diorama.",
    steps: [
      "Desbloqueia-se ao terminar uma run na fase Emerald Diorama depois de começar em The Junction, sem nunca usar nenhum dos portais.",
      "Pode conseguir-se rapidamente saindo da fase, mas morrer também desbloqueia a personagem.",
    ],
  },
  "kugutsu-musashi": {
    unlockShort: "Derrota o Divine Wood Spirit em Miyako City, na Inverse Emerald Diorama.",
    steps: [
      "Desbloqueia-se ao derrotar o Divine Wood Spirit na Inverse Emerald Diorama.",
      'O Divine Wood Spirit encontra-se na área norte, Miyako City, que passa a ficar a sul quando a opção "Visually Invert Stages" está activada.',
    ],
  },
  "lita-caryx": {
    unlockShort: "Derrota o Earth Dragon na Inverse Emerald Diorama, em Pulchra, com o Tsunanori Mido.",
    steps: ["Desbloqueia-se ao derrotar o Earth Dragon em Witchdom Pulchra (mundo sudoeste), na Inverse Emerald Diorama, jogando como Tsunanori Mido."],
  },
  "lolo-hiss-meow-and-purr": {
    unlockShort: "Reúne o maior grupo de gatos, incluindo os que querem lutar.",
    steps: [
      "Desbloqueia-se ao juntar primeiro um total de 30 gatos invocados pela Ameya Aisling, ao longo de qualquer número de runs, e depois apanhar o Gatti Amari.",
      "Ao sair da run em que ambas as condições estão cumpridas, Lolo, Hiss, Meow e Purr ficam disponíveis para compra.",
      "Se o jogador já tiver 30 gatos antes da run em que apanha o Gatti Amari, não é preciso juntar mais nenhum durante essa run.",
    ],
  },
  "macha-alter-ego": {
    unlockShort: "Derrota o Iron Maiden em Avalon, na Inverse Emerald Diorama, com a Ameya Aisling.",
    steps: ["Desbloqueia-se ao derrotar o Iron Maiden em Avalon (mundo nordeste), na Inverse Emerald Diorama, jogando como Ameya Aisling."],
  },
  "malevolent-door-spirit": {
    unlockShort: "Deixa o último governante recongelar a sua forma mais monstruosa.",
    steps: [
      "Desbloqueia-se ao derrotar o Malevolent Door Spirit em Grelon, jogando como Final Emperor e com o Out of Bounds (XII) equipado.",
      "Qualquer arma pode matar o boss, e não é preciso que esteja congelado.",
      "Depois de desbloqueado, custa 5000 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "mr-s": {
    unlockShort: "Derrota o Living Anguish jogando como Diva No. 5 na Emerald Diorama, com o Modo Inverso activado.",
    steps: [
      "S desbloqueia-se ao derrotar o Living Anguish jogando como Diva No.",
      "5, na Inverse Emerald Diorama.",
      'S também pode ser desbloqueado nos Forbidden Scrolls of Morbane, lançando o feitiço "tutelageregimen".',
    ],
  },
  siugnas: {
    unlockShort: "Encontra e abre o segundo caixão na Emerald Diorama.",
    steps: [
      "Desbloqueia-se ao encontrar e abrir o segundo caixão na Emerald Diorama, mais precisamente no mundo Providence.",
      "=== Skins ===",
      "Evoluir completamente o Town Sword desbloqueia um skin alternativo que usa o Sanguine Star como arma inicial.",
      "=== Unlockables ===",
      "Derrotar 1 na Inverse Emerald Diorama jogando como Siugnas desbloqueia a Dolores como personagem jogável.",
    ],
  },
  "tsunanori-mido": {
    unlockShort: "Encontra e abre o primeiro caixão na Emerald Diorama.",
    steps: [
      "Desbloqueia-se ao abrir o seu caixão na Emerald Diorama, situado em Miyako City.",
      "Como o Tsunanori se obtém por caixão, usar apenas o feitiço obriga a comprá-lo por 5000 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },

  // ---- Base Game ------------------------------------------------------------
  "arca-ladonna": {
    unlockShort: "Sobe o Fire Wand até ao nível 4.",
    steps: ["Desbloqueia-se ao subir o Fire Wand até ao nível 4; depois, custa 500 moedas — valor que sobe consoante o número de personagens já compradas."],
  },
  "bat-robbert": {
    unlockShort: "Evolui o Pako Battiliar.",
    steps: [
      "Ao evoluir o Pako Battiliar, o Bat Robbert fica desbloqueado como personagem jogável.",
      "Depois de desbloqueado, custa 100 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "bats-bats-bats": {
    unlockShort: "É simples como o ABC: obtém o anel dos anéis.",
    steps: [
      "É preciso começar uma run em Bat Country depois de já teres apanhado, em runs anteriores, tanto o Apoplexy como o Chaos Malachite da fase.",
      "Depois, tens de te dirigir ao anel de nove Gold Rings situado a nordeste do ponto de partida, que podes seguir através de setas no ecrã.",
      "Ao apanhar os nove Gold Rings, o Bats Bats Bats fica desbloqueado como personagem jogável.",
      "Depois de desbloqueado, custa 5000 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "bianca-ramba": {
    unlockShort: "Derrota um total de 3000 Milk Elementals.",
    steps: [
      "Desbloqueia-se ao derrotar um total de 3000 Milk Elementals.",
      "Depois de desbloqueada, custa 500 moedas — valor que sobe consoante o número de personagens já compradas.",
      'O skin de Halloween da Ramba desbloqueia-se ao inserir o feitiço "spoopyseason".',
      "Isto faz com que entres em The Bone Zone com a Bianca Ramba, o Yatta Cavallo, o Mortaccio ou o O'Sole Meeo já no traje de Halloween.",
      "Não é preciso chegar aos 30:00 em Bone Zone para o skin ficar desbloqueado — podes sair da fase quando quiseres.",
    ],
  },
  "big-troubler": {
    unlockShort: "Evolui o Unearthly Bolt.",
    steps: [
      "Desbloqueia-se ao evoluir o Unearthly Bolt.",
      "Depois de desbloqueado, custa 50 000 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "boon-marrabbio": {
    unlockShort: "Segue o rasto depois de saqueares o Pummarola e o Skull O'Maniac em Mad Forest.",
    steps: [
      "Depois de obteres o Yellow Sign, começa uma run em Mad Forest e remove os itens de fase Skull O'Maniac e Pummarola.",
      "Consegue-se apanhando-os (mesmo que depois sejam descartados) ou obtendo-os ao subir de nível até ao nível máximo.",
      "Quando estas condições se cumprem, começam a aparecer Pies que formam uma fila até uma zona específica do mapa (à esquerda da grelha do Hollow Heart e acima do Metaglio Left), onde surge um inimigo sombrio que avança lentamente na tua direcção mesmo que não te aproximes.",
      "Derrotá-lo desbloqueia o Boon Marrabbio como personagem jogável.",
      "Depois de desbloqueado, custa 666 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "christine-davain": {
    unlockShort: "Sobe o Pentagram até ao nível 7.",
    steps: [
      "Desbloqueia-se ao subir o Pentagram até ao nível 7.",
      "Depois, custa 500 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "chula-reh": {
    unlockShort: "Sobrevive 20 minutos em Westwoods.",
    steps: [
      "Ao sobreviver até aos 20:00 em Westwoods, o Chula-Reh fica desbloqueado como personagem jogável.",
      "Depois de desbloqueado, custa 777 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "concetta-caciotta": {
    unlockShort: "Encontra e abre o caixão em Gallo Tower.",
    steps: [
      "Desbloqueia-se gratuitamente ao encontrar o seu caixão em Gallo Tower.",
      "O caixão está numa sala escondida, acessível através de um espelho do lado esquerdo da torre, perto do caixão.",
      "Depois, é preciso comprá-la por 1000 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "divano-thelma": {
    unlockShort: "Obtém o Crimson Shroud.",
    steps: [
      "Desbloqueia-se ao obter o Crimson Shroud.",
      "Depois, custa 2000 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  dommario: {
    unlockShort: "Ganha 5000 moedas numa única run.",
    steps: [
      "Desbloqueia-se ao juntar mais de 5000 Gold Coins numa única run.",
      "Depois, fica disponível para compra por 500 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "exdash-exiviiq": {
    unlockShort: "1) Lança o feitiço x-x1viiq, ou encontra muitos Little Clovers.",
    steps: [
      'Ao escrever rapidamente "x-x1viiq", quer no menu principal quer como feitiço nos Forbidden Scrolls of Morbane, o Exdash Exiviiq fica desbloqueado como personagem jogável.',
      "Se usares um teclado francês azerty, tens de mudar o teclado de FR para EN no Windows e depois escrever x)x&viia.",
      "Depois, podes voltar a colocar o teclado nas definições anteriores.",
      "Se usares uma macro (como o AutoHotkey), o teclado tem de estar em inglês (qwerty), mas a macro precisa de produzir x-x1viiq, e não x)x&viia.",
      "Depois de desbloqueado, custa 777 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "gains-boros": {
    unlockShort: "Encontra o único lugar onde as flores desabrocham em The Bone Zone.",
    steps: [
      "Começa uma run em The Bone Zone e avança 10 unidades para norte a partir do ponto de partida, para lá do Silver Ring, até encontrares um anel de terreno verde com flores que cura 8 de vida a cada 0,5 segundos.",
      "Ficar dentro do anel durante 10 segundos faz com que ele desapareça e desbloqueia o Gains Boros como personagem jogável.",
      "Mesmo assim, continuas a ser curado.",
      "Depois de desbloqueado, custa 666 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  gazebo: {
    unlockShort: "Sobrevive 20 minutos em The Coop.",
    steps: [
      "Desbloqueia-se ao sobreviver até aos 20:00 em The Coop.",
      "Depois de desbloqueado, custa 5000 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "giovanna-grana": {
    unlockShort: "Encontra e abre o caixão em Inlaid Library.",
    steps: [
      "Desbloqueia-se gratuitamente ao encontrar e abrir o seu caixão em Inlaid Library.",
      "Depois, é preciso comprá-la por 1000 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  gyoruntin: {
    unlockShort: "Abdica da vitória para fazer turismo em Carlo Cart.",
    steps: [
      "Começa uma run em Carlo Cart e desloca-te no sentido contrário ao movimento da fase.",
      'Normalmente deves ir para a esquerda, mas com "Visually Invert Stages" e o Modo Inverso activados, deves ir para a direita.',
      "Mesmo sem efeito visível de início, acaba por aparecer um caixão guardado por seis Tri-Anchors.",
      "Derrotar os seis Tri-Anchors e interagir com o caixão desbloqueia o Gyoruntin como personagem jogável.",
      "Depois de desbloqueado, custa 5000 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  gyorunton: {
    unlockShort: "Sobrevive à Boss Rash usando apenas uma arma.",
    steps: [
      "Começa uma run em Boss Rash e sobrevive até aos 15:00 usando apenas uma arma.",
      "Os itens passivos não contam, por isso podes usar quantos quiseres.",
      "Morrer ou sair da run depois de chegares aos 15:00 desbloqueia o Gyorunton como personagem jogável.",
      "A forma mais fácil de conseguir isto é desbloquear o Mindbender, que permite limitar quantas armas podes apanhar.",
      "Jogar com uma personagem invencível, como o Ghost Lino ou a Megalo Menya Moonspell, também torna o processo trivial.",
      "Depois de desbloqueado, custa 5000 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "iguana-gallo-valletto": {
    unlockShort: "Obtém o Infinite Corridor.",
    steps: [
      "Desbloqueia-se ao obter o Infinite Corridor.",
      "Depois, custa 2000 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "krochi-freetto": {
    unlockShort: "Derrota um total de 100 000 inimigos.",
    steps: [
      "Desbloqueia-se ao derrotar um total de 100 000 inimigos, somados ao longo de todas as runs.",
      "Depois, custa 500 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "lama-ladonna": {
    unlockShort: "Sobrevive 20 minutos com pelo menos 10% de Curse activo.",
    steps: [
      "Desbloqueia-se ao sobreviver 20 minutos com pelo menos 10% de Curse activo.",
      "Custa 500 moedas — valor que sobe consoante o número de personagens já compradas.",
      "A condição real para o achievement é teres, no final da run, qualquer valor de Curse acima do valor base, e teres sobrevivido pelo menos 20 minutos nessa mesma run.",
      "Isto significa que dá para desbloquear a Lama — além de usar o PowerUp de Curse — obtendo Curse através de Golden Eggs ou de itens passivos que dão Curse, como o Skull O'Maniac, o Gold Ring (nível 2+), o Metaglio Right (nível 2+) ou o Torrona's Box (nível 9), quer subindo de nível quer apanhando-os como itens de fase.",
      "Como o critério é pouco rígido, não precisas de ter o item durante os 20 minutos inteiros — basta tê-lo no momento em que terminas uma run de 20+ minutos.",
    ],
  },
  latodisotto: {
    unlockShort: "salvaguardar o backporting",
    steps: ["O LATODISOTTO era uma personagem provisória/de segurança, acessível no motor antigo do jogo ao voltar a uma versão anterior com uma personagem que ainda não tinha sido adicionada ao jogo nessa altura (normalmente ao sair da beta pública)."],
  },
  "mask-of-the-red-death": {
    unlockShort: "Ajusta contas com o Reaper.",
    steps: [
      "Tens de matar o Reaper.",
      "Há um guia sobre como o fazer disponível em The Reaper § Strategies.",
      "Fazer isso desbloqueia o Mask of the Red Death como personagem jogável.",
      "Depois de desbloqueado, custa 666 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "minnah-mannarah": {
    unlockShort: "Enfrenta as consequências de roubar queijo na Dairy Plant.",
    steps: [
      "Depois de obteres o Yellow Sign, começa uma run em Dairy Plant e apanha o Cheese, visível no mapa como um Floor Chicken.",
      "Também podes atraí-lo com o Mad Groove (VIII).",
      "Ao apanhares o Cheese, surgem sete Werewolves grandes num círculo à tua volta.",
      "Derrotar todos os Werewolves desbloqueia a Minnah Mannarah como personagem jogável.",
      "Depois de desbloqueada, custa 666 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  missingn: {
    unlockShort: "Com o destino mais adverso em Green Acres, foge para fora dos limites do mundo.",
    steps: [
      "Depois de obteres o Yellow Sign, começa uma run em Green Acres com o modo hiper e o modo pressa activados.",
      "Desloca-te para sudoeste e, ao fim de exactamente 10 tiles para sul e 10 tiles para oeste, o aspecto da área muda drasticamente.",
      "Depois disso, continua a avançar para sudoeste — todas as fases do jogo começam a fundir-se e surgem olhos alados gigantes.",
      "Ao matares 128 deles, o missingN▯ fica desbloqueado como personagem jogável.",
      'A distância e a direcção a percorrer não dependem da opção "Visually Invert Stages" quando o Modo Inverso está activado, ao contrário de outros Secrets ligados a locais específicos.',
      "Depois de desbloqueado, custa 66 666 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  mortaccio: {
    unlockShort: "Derrota um total de 3000 esqueletos, ou insere o Código Konami no menu principal.",
    steps: [
      "Desbloqueia-se ao derrotar um total de 3000 Skeletons; depois, custa 500 moedas — valor que sobe consoante o número de personagens já compradas.",
      'O skin de Halloween do Mortaccio desbloqueia-se ao inserir o feitiço "spoopyseason".',
      "Isto faz com que entres em Bone Zone com a Bianca Ramba, o Yatta Cavallo, o Mortaccio ou o O'Sole Meeo já no traje de Halloween.",
      "Não é preciso chegar aos 30:00 em Bone Zone para o skin ficar desbloqueado — podes sair da fase quando quiseres.",
    ],
  },
  "para-kooleo": {
    unlockShort: "Sobrevive 20 minutos em The Lycaeum.",
    steps: ["Desbloqueia-se ao sobreviver 20 minutos em The Lycaeum."],
  },
  peppino: {
    unlockShort: "Sê um bom rapaz em Il Molise.",
    steps: [
      "Começa uma run em Il Molise e usa o Celestial Dusting para atacar as plantas inimigas — o que, na verdade, as cura.",
      "Ao restaurares um total de 100 000 de vida às plantas, o Peppino fica desbloqueado como personagem jogável.",
      "Jogar com o O'Sole Meeo torna isto trivial, já que não sofre dano das plantas.",
      "O Beginning (X) ajuda a acelerar o processo.",
      "Depois de desbloqueado, custa 666 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "poe-ratcho": {
    unlockShort: "Sobe o Garlic até ao nível 7.",
    steps: [
      "Desbloqueia-se ao subir o Garlic até ao nível 7.",
      "Custa 500 moedas — valor que sobe consoante o número de personagens já compradas.",
      "=== Retired Poe Ratcho ===",
      "Completar pela primeira vez a Adventure A Garlic Paradise desbloqueia um skin alternativo chamado Retired Poe Ratcho.",
    ],
  },
  "poppea-pecorina": {
    unlockShort: "Encontra e abre o caixão em Dairy Plant.",
    steps: [
      "Desbloqueia-se gratuitamente ao encontrar o seu caixão em Dairy Plant.",
      "Depois, é preciso comprá-la por 1000 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "porta-ladonna": {
    unlockShort: "Sobe o Lightning Ring até ao nível 4.",
    steps: ["Desbloqueia-se ao subir o Lightning Ring até ao nível 4; depois, custa 500 moedas — valor que sobe consoante o número de personagens já compradas."],
  },
  "pugnala-provola": {
    unlockShort: "Encontra e abre o caixão em Mad Forest.",
    steps: [
      "Desbloqueia-se gratuitamente ao encontrar e abrir o seu caixão em Mad Forest.",
      "Depois, é preciso comprá-la por 1000 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "queen-sigma": {
    unlockShort: "Completa a Collection.",
    steps: [
      'Para desbloquear a Queen Sigma, é preciso ter desbloqueado todos os itens listados na secção "Version 1.0" do menu Collection, com excepção de alguns.',
      "Esta secção só inclui itens disponíveis no lançamento 1.0 do jogo, sem contar com nenhuma DLC.",
      "Os itens da secção 1.0 que não são necessários para desbloquear a Queen Sigma são: Super Candybox II Turbo, Victory Sword, Sole Solution, Flames of Misspell, Ashes of Muspell.",
      "Depois de desbloqueada, pode ser comprada, mas o preço é 0 e não sobe.",
    ],
  },
  random: {
    unlockShort: "Procura debaixo de caixões já visitados.",
    steps: [
      "Em qualquer fase normal que tenha um caixão, abri-lo uma segunda vez desbloqueia o Random como personagem jogável.",
      "Depois de desbloqueado, custa 5000 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "rose-de-infernas": {
    unlockShort: "A sua sombra real esconde-se atrás da 46.ª porta.",
    steps: [
      "Começa uma run em Astral Stair e atravessa as portas da fase um total de 46 vezes, o que pode ser feito ao longo de qualquer número de runs.",
      "Ao atravessar a 46.ª porta, és enviado para uma sala escura com um caixão.",
      "Interagir com o caixão desbloqueia a Rose De Infernas como personagem jogável.",
      "Depois de desbloqueada, custa 5000 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "santa-ladonna": {
    unlockShort: "Sobrevive 20 minutos em The Laborratory.",
    steps: [
      "Ao sobreviver até aos 20:00 em Laborratory, a Santa Ladonna fica desbloqueada como personagem jogável.",
      "Depois de desbloqueada, custa 666 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "scorej-oni": {
    unlockShort: "Descobre a origem do trovão ribombante em Tiny Bridge.",
    steps: [
      "Começa uma run em Tiny Bridge e avança cerca de 20 tiles para a direita, onde encontras o Scorej-Oni como inimigo hostil.",
      "Um sinal de que o Scorej-Oni está perto é o som fraco de trovões a tocar esporadicamente ao fundo, embora possa ser difícil de ouvir se houver muitos efeitos sonoros ao mesmo tempo.",
      "Derrotar o Scorej-Oni desbloqueia-o como personagem jogável.",
      "Depois de desbloqueado, custa 5000 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "secretino-dagsson": {
    unlockShort: "Passa a tua after-party com o apostador imprudente.",
    steps: [
      'Tens de comprar o item "Preorder Me!" ao mercador Giocare em Westwoods.',
      "Este item fica disponível depois de obteres a relíquia Masquerade no final da fase e teres desbloqueado o Chula-Reh.",
      "Assim que ambas as condições estiverem cumpridas, o Giocare vende o item, numa nova run, por 49 999.",
      "Depois de desbloqueado, custa 50 000 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "she-moon-eeta": {
    unlockShort: "",
    steps: [
      "Ao sobreviver até aos 20:00 em Whiteout, a She-Moon Eeta fica desbloqueada como personagem jogável.",
      "Depois de desbloqueada, custa 500 moedas — valor que sobe consoante o número de personagens já compradas.",
      "=== Reborn She-Moon Eeta ===",
      "Completar pela primeira vez a Adventure To End an Ice Age desbloqueia um skin alternativo chamado Reborn She-Moon Eeta.",
    ],
  },
  "sir-ambrojoe": {
    unlockShort: "Derrota um total de 6000 Stage Killers.",
    steps: ["Desbloqueia-se ao derrotar um total de 6000 Stage Killers; depois, custa 500 moedas — valor que sobe consoante o número de personagens já compradas."],
  },
  "smith-iv": {
    unlockShort: "3) Às vezes só precisas de pedir ajuda.",
    steps: [
      'Depois de teres desbloqueado o Exdash Exiviiq e o Toastie, faz o seguinte: escreve "spam" e depois prime Enter no menu principal, o que inicia um temporizador escondido de 30 segundos.',
      'Tens de completar os passos seguintes dentro desse tempo: no ecrã de selecção de personagem, escreve "spam" e prime Enter; no ecrã de selecção de fase, escreve "spam" e prime Enter; ao começares uma run em qualquer fase, escreve "humbug" (depois de escolheres uma Arcana ou Darkana) e prime Enter.',
      "Depois de saíres da run, o Smith IV fica automaticamente desbloqueado como personagem jogável.",
      "Nas versões de consola e telemóvel, isto pode ser feito com um teclado externo.",
      "Depois de desbloqueado, custa 7777 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "space-dude": {
    unlockShort: "Sobrevive 20 minutos em Space 54.",
    steps: [
      "Ao sobreviver até aos 20:00 em Space 54, o Space Dude fica desbloqueado como personagem jogável.",
      "Depois de desbloqueado, custa 500 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "suor-clerici": {
    unlockShort: "Recupera um total de 1000 de vida.",
    steps: [
      "Desbloqueia-se ao recuperar um total de 1000 de vida ao longo de todas as runs.",
      "Depois, fica disponível para compra por 500 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "yatta-cavallo": {
    unlockShort: "Derrota um total de 3000 Lion Heads.",
    steps: [
      "Desbloqueia-se ao derrotar um total de 3000 Lionheads.",
      "Depois de desbloqueado, custa 500 moedas — valor que sobe consoante o número de personagens já compradas.",
      'O skin de Halloween do Cavallo desbloqueia-se ao inserir o feitiço "spoopyseason".',
      "Isto faz com que comeces uma run em The Bone Zone com a Bianca Ramba, o Yatta Cavallo, o Mortaccio ou o O'Sole Meeo já no traje de Halloween.",
      "Não é preciso chegar aos 30:00 em Bone Zone para o skin ficar desbloqueado — podes sair da fase quando quiseres.",
    ],
  },
  "zi-appunta-belpaese": {
    unlockShort: "Evolui o Ammo Appalate.",
    steps: [
      "Ao evoluir o Ammo Appalate em Gunastrophe, o Zi'Appunta Belpaese fica desbloqueado como personagem jogável.",
      "Depois de desbloqueado, custa 500 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "zi-assunta-belpaese": {
    unlockShort: "Encontra e abre o caixão em Cappella Magna.",
    steps: [
      "Desbloqueia-se gratuitamente ao encontrar e abrir o seu caixão em Cappella Magna.",
      "Depois, é preciso comprá-la por 1000 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },

  // ---- Ode to Castlevania (part 1/2) ----------------------------------------
  "alamaric-sniper": {
    unlockShort: "Abate o sniper com um golpe estelar.",
    steps: [
      "Depois de obteres o Pile of Secrets, derrota 100 inimigos Amalaric Sniper com o Stellar Blade, a evolução do Discus.",
      "O topo da Cathedral (a parte superior do edifício mais a leste) e a ponte junto à entrada da Clock Tower são os melhores sítios para o fazer.",
      "Depois de desbloqueado, custa 16 650 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  albus: {
    unlockShort: "Evolui completamente o Confodere.",
    steps: [
      "Desbloqueia-se ao evoluir completamente o Confodere em Melio Confodere, depois de obteres o Black Disk.",
      "Depois, fica disponível para compra por 2000 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  alucard: {
    unlockShort: "Derrota o Doppelganger com o Trevor Belmont.",
    steps: [
      "Desbloqueia-se ao derrotar o Zi'Assunta Belpaese, situado na Art Gallery do mapa de Ode to Castlevania, jogando como Trevor Belmont.",
      "Depois, custa 1000 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  annette: {
    unlockShort: "Constrói uma torre dentro de outra.",
    steps: [
      "Depois de obteres o Pile of Secrets, desbloqueia-se ao criar o Clock Tower enquanto jogas em Gallo Tower.",
      "Depois de desbloqueada, custa 5000 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  astarte: {
    unlockShort: "Pratica a não-violência entre as flores com o jovem Morris encantado.",
    steps: [
      "Depois de desbloqueares o Pile of Secrets, começa uma run como Jonathan Morris, Charlotte & Jonathan ou Jonathan & Charlotte, usando um dos seus skins para começares com um selector de arma (Morning Star, Coat of Arms, Spectral Sword ou Belnades' Spellbook) em Il Molise.",
      "Tens de saltar a selecção de arma.",
      "Isto faz com que fiques sem arma inicial.",
      "Depois, evita derrotar qualquer inimigo até o cronómetro chegar aos 5:00, e sai da run.",
    ],
  },
  "atlantis-shrine-wizard": {
    unlockShort: "Combina líquidos sagrados numa cidade submersa.",
    steps: [
      "Depois de obteres o Pile of Secrets, desbloqueia-se ao criar o Hydro Pump Climax, a união de La Borra e Hydro Storm, jogando em Moongolow.",
      "Depois de desbloqueado, custa 5000 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "axe-armor": {
    unlockShort: "Prova-lhes que há algo que gira melhor do que machados.",
    steps: [
      "Depois de obteres o Pile of Secrets, derrota 100 inimigos Axe Armor na fase Ode to Castlevania com o Stellar Blade, a evolução do Discus, na área da Cathedral do mapa.",
      "A Cathedral (a parte superior do edifício mais a leste) tem uma sala onde só aparecem Axe Armors.",
      "Esta sala de oração espaçosa fica na zona inferior esquerda da Cathedral, com uma cruz alta ao centro e uma estátua de capa a rezar na base.",
      "Também há ali um Mirror of Truth para apanhar.",
      "Fazer isto desbloqueia o Axe Armor como personagem jogável.",
      "Depois de desbloqueado, custa 2000 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  barlowe: {
    unlockShort: "Evolui o Optical Shot.",
    steps: [
      "Desbloqueia-se ao evoluir o Optical Shot.",
      "Depois de desbloqueado, custa 2000 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  blackmore: {
    unlockShort: "Não deixes nenhuma Shadow cair sobre o fundador de Ecclesia.",
    steps: [
      "Depois de desbloqueares o Scorpion Gate na fase Ode to Castlevania, o Blackmore aparece como inimigo boss a partir do seu círculo de invocação, situado na secção escondida da Library (dentro da parte superior do edifício central).",
      "A sala onde está o círculo de invocação também tem um Arma Dio.",
      "Depois, derrota-o jogando como Barlowe.",
      "Depois de desbloqueado, custa 16 650 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "blue-crescent-moon-cornell": {
    unlockShort: "Mata os habitantes do castelo sob a Blue Crescent Moon para o transformar numa fera.",
    steps: [
      "Depois de obteres o Pile of Secrets, começa uma run em Ode to Castlevania jogando como Cornell; equipa o Dextro Custos, o Sinestro Custos e o Centralis Custos, evolui-os em Trinum Custodem para o transformar, e depois derrota 100 000 inimigos numa única run em Ode to Castlevania.",
      "Fazer isto desbloqueia o Blue Crescent Moon Cornell como personagem jogável.",
      "Depois de desbloqueado, custa 9000 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  brauner: {
    unlockShort: 'Drena a "tinta" carmesim das suas obras mais vivas.',
    steps: [
      "Depois de obteres o Pile of Secrets, derrota um total de 100 Bloody Paintings em Ode to Castlevania com as zonas de dano do Blood Astronomia (XXI), o que desbloqueia o Brauner como personagem jogável.",
      "A área da Gallery onde estão o boss Succubus e o Dominus Anger tem sempre Bloody Paintings a aparecer.",
      "Depois de desbloqueado, custa 16 650 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  carmilla: {
    unlockShort: "Que o poder do primeiro Belmont quebre a sua máscara.",
    steps: [
      "Depois de obteres o Black Disk em Ode to Castlevania, a Carmilla aparece na fase como inimigo boss, com o círculo de invocação situado directamente a leste do Capra Gate.",
      "Ao evoluir o Hex em Nightmare e derrotá-la com ele, a Carmilla fica desbloqueada como personagem jogável.",
      "As zonas de Curse invocadas pelo Nightmare têm de desferir o golpe final contra a Carmilla.",
      'Felizmente, essas zonas derrotam a Carmilla instantaneamente, com um som de "pop" quando acontece.',
      "Depois de desbloqueada, custa 16 650 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "carrie-fernandez": {
    unlockShort: "Evolui completamente os glifos Custos.",
    steps: [
      "Desbloqueia-se ao unir o Dextro Custos, o Sinestro Custos e o Centralis Custos em Trinum Custodem.",
      "Depois, fica disponível para compra por 1665 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "cave-troll": {
    unlockShort: "Baixa-te e derrota 3 000 000 desses palhaços.",
    steps: [
      "Tens de derrotar 6000 Cave Trolls na fase Ode to Castlevania e ter obtido o Pile of Secrets.",
      "As mortes podem ser feitas antes de obteres esta relíquia, mas ambas as condições têm de estar cumpridas para o Cave Troll ficar desbloqueado como personagem jogável.",
      "Depois de desbloqueado, custa 500 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "celia-fortner": {
    unlockShort: "Equilibra na perfeição o mais escuro e o mais brilhante dos Glyphs.",
    steps: [
      "Ao evoluir o Luminatio e o Umbra em Universitas, a Celia Fortner fica desbloqueada como personagem jogável.",
      "Depois de desbloqueada, custa 1665 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  chaos: {
    unlockShort: "Esgota o resto desta miserável pilha de segredos.",
    steps: [
      "Ao desbloquear quase todos os outros segredos da DLC Ode to Castlevania, o Chaos fica desbloqueado como personagem jogável.",
      "O Chaos não exige os Secrets adicionados na Ode to Castlevania 2.0 Update da v1.14 — apenas os que fizeram parte da DLC original.",
      "As seguintes personagens não precisam de estar desbloqueadas para desbloquear o Chaos: Hugh Baldwin, Morris Baldwin, Annette, Tera, Genya Arikado, Stone Skull, Ruler Sword, Persephone, Astarte, Drolta Tzuentes, Witch Actrise, Atlantis Shrine Wizard, Fake Trio, Slogra and Gaibon, Zephyr, Jiangshi.",
      "Depois de desbloqueado, custa 1 048 576 moedas — valor que sobe consoante o número de personagens já compradas, mas nunca ultrapassa 9 999 999.",
      "Este feitiço é a sequência dos numerais romanos de 1 a 21 sem espaços, correspondendo às 21 Arcanas com que o Chaos começa (I, II, III, IV, etc.).",
    ],
  },
  "charlotte-jonathan": {
    unlockShort: "Escreve o que eles gritam, ao contrário.",
    steps: [
      'Desbloqueia-se nos Forbidden Scrolls of Morbane, lançando o feitiço "ettolrahcnahtanoj".',
      "Inserir o feitiço no iOS desbloqueia o Jonathan & Charlotte em vez do Charlotte & Jonathan.",
      "Também podem ser desbloqueados ao desbloquear a Stella e a Loretta Lecarde.",
    ],
  },
  "charlotte-aulin": {
    unlockShort: "Encontra 7 Mirrors of Truth depois de abrires o Capra Gate.",
    steps: [
      "Desbloqueia-se ao obter 7 Mirrors of Truth, que podem aparecer depois de obteres o Capra Gate.",
      "Depois, custa 2000 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "christopher-belmont": {
    unlockShort: "Evolui o Alucart Sworb.",
    steps: ["Para o desbloquear, evolui o Alucart Sworb."],
  },
  cornell: {
    unlockShort: "Evolui o Silver Revolver.",
    steps: [
      "Desbloqueia-se ao evoluir o Silver Revolver.",
      "Depois de desbloqueado, custa 2000 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "count-olrox": {
    unlockShort: "Deixa as almas dos condenados vingarem-se do outro Conde.",
    steps: [
      "Depois de obteres o Black Disk em Ode to Castlevania, o Count Olrox aparece na fase como inimigo boss, com o círculo de invocação na sala à esquerda do Dinner Hall, no edifício mais a leste do castelo.",
      "Ao derrotá-lo com o Dark Rift, o Count Olrox fica desbloqueado como personagem jogável.",
      "Depois de desbloqueado, custa 16 650 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "dario-bossi": {
    unlockShort: "Arde intensamente até ao fim, recusando tudo excepto o inferno.",
    steps: [
      "Começa e termina uma run com qualquer personagem em qualquer fase, tendo usado apenas armas de fogo em qualquer momento.",
      "Qualquer item ou fonte de dano que não seja uma arma de fogo desqualifica a run, incluindo armas sem dano como o Laurel, todos os Selectors como o Candybox, armas escondidas e poderes Darkana.",
      "As armas de fogo são:",
      "Fazer isto desbloqueia o Dario Bossi como personagem jogável.",
      "Depois de desbloqueado, custa 1665 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  death: {
    unlockShort: "Faz com que se sinta em casa.",
    steps: [
      "Começa uma run em Ode to Castlevania jogando como Richter Belmont; obtém o Endo Gears, o Peri Pendulum, o Myo Lift e o Epi Head, que se desbloqueiam depois de obteres o Serpent Gate, evolui-os em Clock Tower e entra no combate contra o Death.",
      "Fazer isto desbloqueia o Death como personagem jogável.",
      "Depois de desbloqueado, custa 16 650 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "dmitrii-blinov": {
    unlockShort: "Desfaz o demónio fundido com aquela que procura o equilíbrio perfeito.",
    steps: [
      "Depois de obteres o Black Disk em Ode to Castlevania, o Menace aparece na fase como inimigo boss, do lado direito do Sewer (por baixo da primeira secção do edifício da frente) dentro do castelo de Dracula.",
      "Ao derrotá-lo jogando como Celia Fortner, o Dmitrii Blinov fica desbloqueado como personagem jogável.",
      "Depois de desbloqueado, custa 1665 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "drolta-tzuentes": {
    unlockShort: "Testemunha o 7.º renascimento da sobrinha de Drácula em terreno sagrado.",
    steps: [
      "Desbloqueia-se ao fazer a Elizabeth Bartley morrer 7 vezes na mesma run em Cappella Magna.",
      "Consegue-se usando o PowerUp de Revival, a Arcana Awake (IV) e apanhando o Tirajisú na fase, subindo-o de nível.",
      "Depois de desbloqueada, custa 5000 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "elizabeth-bartley": {
    unlockShort: "Evolui o Umbra.",
    steps: [
      "Desbloqueia-se ao evoluir o Umbra.",
      "Depois, fica disponível para compra por 6665 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "eric-lecarde": {
    unlockShort: "Evolui o Javelin.",
    steps: [
      "Desbloqueia-se ao evoluir o Javelin.",
      "Custa 500 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  familiar: {
    unlockShort: "Confia o seu cuidado à alma mais gentil, duas vezes.",
    steps: [
      "Jogando como Julia Laforeze, obtém dois Familiar Forge na mesma run.",
      "Pode fazer-se em Ode to Castlevania apanhando um Familiar Forge do Candybox, e depois apanhando outro como item de fase.",
      "Não aparece no Candybox se apanhares primeiro o item de fase.",
    ],
  },
  ferryman: {
    unlockShort: "Não precisas dos seus serviços se conseguires andar sobre a água.",
    steps: [
      "Depois de obteres o Pile of Secrets, começa uma run em Ode to Castlevania e evolui o Sonic Dash em Rapidus Fio.",
      "Depois, atravessa o fosso à frente do castelo usando qualquer método de Wall Clipping, incluindo o Flight.",
      "O Rapidus Fio tem de estar activo e tens de estar em movimento.",
      "Só secções específicas do fosso desbloqueiam este secret, como a que liga este fosso à maior massa de água a norte, ou a que fica directamente a sul da ponte que leva ao castelo.",
      "Depois de desbloqueado, custa 1665 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  fleaman: {
    unlockShort: "Tenta 3000. Ou 6000. Ou mais. Com sorte, os seus ouvidinhos ouvem em algum momento.",
    steps: [
      "Tens de derrotar um total entre 3000 e 9000 Fleamen na fase Ode to Castlevania.",
      "Flea Armors e Flea Riders contam para este total.",
      "Se já tiveres derrotado 3000 Fleamen, é gerado um número aleatório entre 0 e 9000 no final da run.",
      "O Fleaman fica desbloqueado se o número de Fleamen derrotados for maior do que esse número aleatório.",
      "Como o número aleatório nunca ultrapassa 9000, derrotar mais de 9000 Fleamen até ao fim da run garante o desbloqueio do Fleaman como personagem jogável.",
      "Depois de desbloqueado, custa 500 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  frozenshade: {
    unlockShort: "Transforma-a de sombra azul em cristal verdadeiro.",
    steps: [
      "Depois de obteres o Pile of Secrets, derrota 100 inimigos Frozen Shade em Ode to Castlevania com o Jewel Gun ou o Gemma Torpor.",
      "A sala onde está o Joachim Armster, do lado direito da Crystal Cave, é o sítio perfeito para isto, já que só ali aparecem Frozen Shades.",
      "Fazer isto desbloqueia o Frozenshade como personagem jogável.",
      "Depois de desbloqueado, custa 500 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  galamoth: {
    unlockShort: "Um secret tão grande que não passa pelas portas do castelo.",
    steps: [
      "Depois de obteres o Beast Gate e o Pile of Secrets em Ode to Castlevania, o Galamoth aparece na fase como inimigo boss a partir do seu círculo de invocação, situado no centro do Labyrinth.",
      "Ao evoluir o Dominus Anger, o Dominus Hatred e o Dominus Agony em Power of Sire, e deixar que o Power of Sire derrote o Galamoth, este fica desbloqueado como personagem jogável.",
      'Recomenda-se usar o Megalo Dracula para este desbloqueio, já que esta personagem pode começar com as três armas "Dominus", tornando muito fácil obter o Power of Sire, além de ter óptimos bónus de stats.',
      "Depois de desbloqueado, custa 16 650 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "genya-arikado": {
    unlockShort: "Deixa a Hakuba repreender o Reaper mentiroso para revelar a verdade dos seus aliados.",
    steps: [
      "Desbloqueia-se ao derrotar o The Trickster jogando como Mina Hakuba.",
      "Fora de eventos especiais, o Trickster pode encontrar-se em: Boss Rash, aos 11:00; Carlo Cart, aos 2:00 e aos 14:00; bem a leste em Inlaid Library com o Modo Inverso activado, depois de derrotares o The Directer em Eudaimonia Machine.",
      "Depois de desbloqueado, custa 50 000 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "graham-jones": {
    unlockShort: "Traz azar aos bosses beligerantes do conde.",
    steps: [
      "Tens de derrotar 22 bosses diferentes na fase Ode to Castlevania, na mesma run.",
      "Isto inclui bosses que aparecem directamente na fase e os que surgem em certos minutos.",
      "Estas mortes podem ser feitas na mesma run em que desbloqueias o Pile of Secrets, ou depois — mas runs anteriores a isso não contam.",
      "Depois de desbloqueado, custa 16 650 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "grant-danasty": {
    unlockShort: "Evolui o Water Dragon Whip.",
    steps: [
      "Desbloqueia-se ao evoluir o Dragon Water Whip; depois, custa 500 moedas — valor que sobe consoante o número de personagens já compradas.",
      "Derrotar Slogra and Gaibon em Ode to Castlevania jogando como Grant desbloqueia a Sypha Belnades como personagem jogável.",
    ],
  },
  hammer: {
    unlockShort: "Sobrevive vestindo um casaco totalmente armado.",
    steps: [
      "Tens de evoluir um total de seis armas de Ode to Castlevania a partir do Coat of Arms, na mesma run.",
      "Isto significa obter seis evoluções à escolha entre: Bwaka Knife, Yagyu Shuriken, Long Inus, Wrecking Ball, Stellar Blade, Jewel Gun, The RPG, Meal Ticket, Darkness Illusion, Carnage Heart, Hydro Pump Climax, Arch Angle.",
      "Morrer ou sair da fase depois de chegares ao limite de tempo desbloqueia o Hammer como personagem jogável.",
      "Depois de desbloqueado, custa 9000 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  hector: {
    unlockShort: "Encontra 7 Karma Coins depois de abrires o Scorpion Gate.",
    steps: [
      "Desbloqueia-se ao obter 7 Karma Coins na fase Ode to Castlevania, disponíveis depois de obteres o Stallion Gate.",
      "Depois, fica disponível para compra por 500 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  henry: {
    unlockShort: "Evolui o Tyrfing.",
    steps: [
      "Desbloqueia-se ao evoluir o Tyrfing.",
      "Depois, fica disponível para compra por 2000 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "hugh-baldwin": {
    unlockShort: "Corta manteiga com seis espadas forjadas para matar vampiros.",
    steps: [
      'Desbloqueia-se ao obter 6 armas do tipo "espada" em Dairy Plant — as seis têm de estar nos slots de arma quando essa run terminar.',
      'Só contam armas do tipo "espada" do jogo base e da DLC Ode to Castlevania. As armas "espada" incluem: Victory Sword e o seu presente, Sole Solution; Heaven Sword (evolução de Cross); Tyrfing e a sua evolução, Rune Sword; Alucart Sworb e as suas evoluções, Alucard Swords e Alucard Shield; Valmanway e a sua união, Million Cut; Icebrand; Sword Brothers e a sua união, Vjaya Sisters; Confodere e as suas evoluções, Vol Confodere e Melio Confodere; Claimh Solais (evolução de Pocket Knife).',
      "Como a maioria das armas base já conta para este secret, somando mais de seis, e metade delas pode ser comprada ao Master Librarian, deves evitar escolher as que precisam de ser evoluídas.",
      'Embora evoluir e unir não seja aconselhável, tem cuidado ao unir o Icebrand em Ninth Circle, pois deixa de contar como "espada", ao contrário de outras uniões de armas compráveis ao Master Librarian.',
      "Depois de desbloqueado, custa 5000 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "innocent-devil": {
    unlockShort: "Confia o seu cuidado à alma mais gentil, duas vezes.",
    steps: [
      "Começa uma run jogando como Julia Laforeze e obtém dois Familiar Forge na mesma run.",
      "Pode fazer-se em Ode to Castlevania apanhando um Familiar Forge do Candybox e depois outro como item de fase.",
      "Não aparece no Candybox se apanhares primeiro o item de fase.",
      "Fazer isto desbloqueia o Innocent Devil como personagem jogável.",
      "Depois de desbloqueado, custa 100 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  isaac: {
    unlockShort: "Evolui o Mace.",
    steps: [
      "Desbloqueia-se ao evoluir o Mace, depois de obteres o Black Disk.",
      "Depois, fica disponível para compra por 2000 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "joachim-armster": {
    unlockShort: "Reescreve o destino da donzela em apuros.",
    steps: [
      "Depois de obteres o Serpent Gate em Ode to Castlevania, o Joachim Armster aparece na fase como inimigo boss, na sala à direita da Crystal Cave.",
      "Derrotá-lo jogando como Sara Trantoul desbloqueia o Joachim Armster como personagem jogável.",
      "Depois de desbloqueado, custa 2000 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "john-morris": {
    unlockShort: "Evolui o Raging Fire, o Ice Fang, o Gale Force e o Rock Riot ao longo de qualquer número de runs.",
    steps: [
      "Desbloqueia-se ao evoluir o Raging Fire, o Ice Fang, o Gale Force e o Rock Riot ao longo de qualquer número de runs.",
      "Depois, custa 500 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "jonathan-charlotte": {
    unlockShort: "Escreve o que eles gritam.",
    steps: [
      'Desbloqueia-se nos Forbidden Scrolls of Morbane, lançando o feitiço "jonathancharlotte".',
      "Inserir o feitiço na versão iOS desbloqueia o Charlotte & Jonathan em vez do Jonathan & Charlotte.",
      "Também podem ser desbloqueados ao desbloquear a Stella e a Loretta Lecarde.",
    ],
  },
  "jonathan-morris": {
    unlockShort: "Evolui o Hand Grenade.",
    steps: [
      "Desbloqueia-se ao evoluir o Hand Grenade.",
      "Depois, custa 2000 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "julia-laforeze": {
    unlockShort: "Evolui o Globus.",
    steps: [
      "Desbloqueia-se ao evoluir o Globus.",
      "Depois, fica disponível para compra por 7 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },

  // ---- Ode to Castlevania (part 2/2) ----------------------------------------
  "julius-belmont": {
    unlockShort: "Encontra e abre o segundo caixão em Ode to Castlevania.",
    steps: [
      "Desbloqueia-se ao encontrar e abrir o segundo caixão em Ode to Castlevania, situado numa sala escondida dentro da library.",
      "Derrotar o Gergoth, situado no piso de baixo do edifício central, por baixo da library, mesmo acima do Capra Gate, jogando como Julius, desbloqueia o Soma Cruz como personagem jogável.",
    ],
  },
  "juste-belmont": {
    unlockShort: "Evolui o Wind Whip.",
    steps: [
      "Desbloqueia-se ao evoluir o Wind Whip.",
      "Depois de desbloqueado, custa 2200 moedas — valor que sobe consoante o número de personagens já compradas.",
      "Completar qualquer fase com o Juste e a Shanoa ao mesmo tempo desbloqueia a Maria Renard como personagem jogável.",
    ],
  },
  keremet: {
    unlockShort: "São precisos exactamente dois para esvaziar o caldeirão.",
    steps: [
      "Depois de obteres o Black Disk em Ode to Castlevania, o Keremet aparece na fase como inimigo boss, com o círculo de invocação no piso superior do Laboratory (a parte superior do edifício da frente).",
      "Ao derrotá-lo jogando como Jonathan & Charlotte ou Charlotte & Jonathan, o Keremet fica desbloqueado como personagem jogável.",
      "Depois de desbloqueado, custa 16 650 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "leon-belmont": {
    unlockShort: "Encontra e abre o primeiro caixão em Ode to Castlevania.",
    steps: [
      "O caixão do Leon encontra-se a nordeste da área de partida, mesmo antes da entrada do castelo em Ode to Castlevania.",
      "Derrotar o Giant Medusa Head em Ode to Castlevania jogando como Leon desbloqueia o Trevor Belmont como personagem jogável.",
    ],
  },
  "lisa-tepes": {
    unlockShort: "Evolui o Wine Glass.",
    steps: [
      "Desbloqueia-se ao evoluir o Wine Glass.",
      "Depois, fica disponível para compra por 2000 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "loretta-stella-lecarde": {
    unlockShort: "Abriga as suas almas gémeas com magia sagrada para lhes restaurar a humanidade.",
    steps: [
      "Depois de obteres o Pile of Secrets, a Stella Lecarde e a Loretta Lecarde aparecem na fase Ode to Castlevania como inimigos boss, no topo da clock tower, entre o Abbadon e o Metaglio Right.",
      "Para as desbloquear, o Sanctuary tem de desferir o golpe final com o seu ataque que cobre todo o ecrã, derrotando instantaneamente a Stella e a Loretta Lecarde.",
      "As cruzes invocadas pelo Refectio não contam para este desbloqueio.",
    ],
  },
  "loretta-lecarde": {
    unlockShort: "Abriga as suas almas gémeas com magia sagrada para lhes restaurar a humanidade.",
    steps: [
      "Depois de obteres o Pile of Secrets, a Stella Lecarde e a Loretta Lecarde aparecem na fase Ode to Castlevania como inimigos boss, no topo da clock tower, entre o Abbadon e o Metaglio Right.",
      "Para as desbloquear, o Sanctuary tem de desferir o golpe final com o seu ataque que cobre todo o ecrã, derrotando instantaneamente a Stella e a Loretta Lecarde.",
      "As cruzes invocadas pelo Refectio não contam para este desbloqueio.",
      "Depois de desbloqueada, custa 2000 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  malphas: {
    unlockShort: "Destrói as suas asas negras com o Morris cuja história ainda está por contar.",
    steps: [
      "Em Ode to Castlevania, o Malphas aparece como inimigo boss na fase aos 25:00.",
      "Derrotar o Malphas jogando como Quincy Morris desbloqueia-o como personagem jogável.",
      "Depois de desbloqueado, custa 16 650 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "maria-renard": {
    unlockShort: "Completa qualquer fase com a Shanoa e o Juste Belmont.",
    steps: [
      "Desbloqueia-se ao completar qualquer fase com a Shanoa e o Juste Belmont ao mesmo tempo.",
      "Depois, fica disponível para compra por 1000 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "master-librarian": {
    unlockShort: "Paga uma moeda por cada livro que ele guarda.",
    steps: [
      "Depois de obteres o Pile of Secrets, gasta mais de 42 000 de ouro no Master Librarian.",
      "Este valor equivale a comprar 16 armas a este mercador.",
      "Fazer isto desbloqueia o Master Librarian como personagem jogável.",
      "Depois de desbloqueado, custa 65 536 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "maxim-kischine": {
    unlockShort: "Evolui o Vibhuti Whip, depois de desbloqueares o Vlad Tepes Dracula.",
    steps: [
      "Desbloqueia-se ao evoluir o Vibhuti Whip, depois de obteres o Black Disk.",
      "Depois de desbloqueado, custa 2000 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "megalo-death": {
    unlockShort: "Desencadeia o Death maximizado sobre o castelo, empunhando as pedras que roubam almas.",
    steps: [
      "Depois de obteres tanto o Ebony Stone como o Crimson Stone, além do Pile of Secrets, começa uma run em Ode to Castlevania jogando como Death e derrota um total de 100 000 inimigos ou mais numa única run.",
      "Fazer isto desbloqueia o Megalo Death como personagem jogável.",
      "Depois de desbloqueado, custa 16 650 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "megalo-dracula": {
    unlockShort: "Empunha as pedras que deram origem à tua linhagem e prova que dominas todos os teus lacaios monstruosos.",
    steps: [
      "Depois de obteres tanto o Ebony Stone como o Crimson Stone, além do Pile of Secrets, começa uma run em Ode to Castlevania jogando como Vlad Tepes Dracula e derrota um total de 100 000 inimigos ou mais numa única run.",
      "Fazer isto desbloqueia o Megalo Dracula como personagem jogável.",
      "Depois de desbloqueado, custa 16 650 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "megalo-elizabeth-bartley": {
    unlockShort: "Devasta tudo e todos no castelo de Drácula na sua forma demoníaca.",
    steps: [
      "Depois de obteres tanto o Ebony Stone como o Crimson Stone, além do Pile of Secrets, começa uma run em Ode to Castlevania jogando como Elizabeth Bartley e derrota um total de 100 000 inimigos ou mais numa única run.",
      "Fazer isto desbloqueia a Megalo Elizabeth Bartley como personagem jogável.",
      "Depois de desbloqueada, custa 16 650 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "megalo-olrox": {
    unlockShort: "Encontra o maior tesouro dos vampiros e prova que o outro Conde também consegue semear o caos no castelo.",
    steps: [
      "Depois de obteres tanto o Ebony Stone como o Crimson Stone, além do Pile of Secrets, começa uma run em Ode to Castlevania jogando como Count Olrox e derrota um total de 100 000 inimigos ou mais numa única run.",
      "Fazer isto desbloqueia o Megalo Olrox como personagem jogável.",
      "Depois de desbloqueado, custa 16 650 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "mina-hakuba": {
    unlockShort: "Evolui o Iron Shield.",
    steps: [
      "Desbloqueia-se ao evoluir o Iron Shield.",
      "Depois, fica disponível para compra por 1665 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "morris-baldwin": {
    unlockShort: "Combina o Heaven e o Cross com o herdeiro sepulto do Vampire Killer.",
    steps: [
      "Depois de obteres o Pile of Secrets, jogando como Nathan Graves, cria a união Arch Angle combinando o Grand Cross com o Heaven Sword, o que desbloqueia o Morris Baldwin como personagem jogável.",
      "Depois de desbloqueado, custa 5000 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "nathan-graves": {
    unlockShort: "Evolui o Sonic Whip.",
    steps: [
      "Desbloqueia-se ao evoluir o Sonic Whip, depois de obteres o Black Disk.",
      "Depois, fica disponível para compra por 2000 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  persephone: {
    unlockShort: "Envia o Simon numa demanda ventosa sob uma lua deslumbrante.",
    steps: [
      "Para a desbloquear, obtém a união Venus Crescent, a de Gorgeous Moon e Summon Spirit Tornado, jogando como Simon Belmont.",
      "Depois de desbloqueada, custa 5000 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "quincy-morris": {
    unlockShort: "Evolui o Platinum Whip, depois de desbloqueares o Vlad Tepes Dracula.",
    steps: [
      "Desbloqueia-se ao evoluir o Platinum Whip, depois de obteres o Black Disk.",
      "Depois, fica disponível para compra por 2000 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "reinhardt-schneider": {
    unlockShort: "Encontra e abre o quarto caixão em Ode to Castlevania.",
    steps: ["Desbloqueia-se ao abrir o quarto caixão no mapa de Ode to Castlevania, depois de obteres o Black Disk."],
  },
  "richter-belmont": {
    unlockShort: "Evolui o Guardian's Targe.",
    steps: [
      "Desbloqueia-se ao evoluir o Guardian's Targe.",
      "Depois de desbloqueado, custa 500 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "rinaldo-gandolfi": {
    unlockShort: "Evolui o Star Flail.",
    steps: [
      "Desbloqueia-se ao evoluir o Star Flail.",
      "Depois, fica disponível para compra por 1665 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "ruler-sword": {
    unlockShort: "Escreve a palavra do soberano.",
    steps: [
      'Ao escrever "rulersword" como feitiço nos Forbidden Scrolls of Morbane, o Ruler Sword fica desbloqueado como personagem jogável.',
      "Depois de desbloqueado, custa 5000 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "saint-germain": {
    unlockShort: "Evolui o Trident.",
    steps: [
      "Desbloqueia-se ao evoluir o Trident.",
      "Depois, fica disponível para compra por 2000 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "sara-trantoul": {
    unlockShort: "Evolui o Alchemy Whip, depois de desbloqueares o Vlad Tepes Dracula.",
    steps: [
      "Para a desbloquear, evolui o Alchemy Whip depois de obteres o Black Disk.",
      "Depois, fica disponível para compra por 1665 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  shaft: {
    unlockShort: "Evolui o Luminatio.",
    steps: [
      "Desbloqueia-se ao evoluir o Luminatio.",
      "Depois, fica disponível para compra por 2000 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  shanoa: {
    unlockShort: "Evolui o Iron Ball e o Alucard Spear.",
    steps: [
      "Desbloqueia-se ao evoluir o Iron Ball e o Alucard Spear.",
      "Depois, fica disponível para compra por 1000 moedas — valor que sobe consoante o número de personagens já compradas.",
      "Completar qualquer fase com a Shanoa e o Juste Belmont ao mesmo tempo desbloqueia a Maria Renard como personagem jogável.",
    ],
  },
  "simon-belmont": {
    unlockShort: "Evolui o Jet Black Whip.",
    steps: ["Desbloqueia-se ao evoluir o Jet Black Whip."],
  },
  "slogra-and-gaibon": {
    unlockShort: "Derrota a dupla de cavaleiros demoníacos do Death com o mais pequeno lacaio de Drácula.",
    steps: [
      "Desbloqueiam-se ao derrotar as suas formas boss em Ode to Castlevania jogando como Fleaman.",
      "Embora o método possa ser assustador por exigir uma das personagens mais fracas do jogo, torna-se trivial com a Darkana Victorian Horror (XVIII), que te dá uma aura de dano capaz de aumentar a vida máxima e, na prática, uma vida extra / limpeza de ecrã para erros.",
      "Desactivar os PowerUps de Curse e Charm deve permitir chegar facilmente até aos bosses.",
      "Este secret está actualmente com um bug nalgumas plataformas (confirmado em Mobile, Steam, Switch e Xbox) que faz com que se desbloqueie apenas ao entrar na fase Ode to Castlevania e sair dela jogando como Fleaman.",
      "Depois de desbloqueados, custam 5000 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "soleil-belmont": {
    unlockShort: "Salva o filho com magia sagrada antes que a transformação se complete.",
    steps: [
      "Depois de obteres o Pile of Secrets em Ode to Castlevania, o Soleil Belmont aparece na fase como inimigo boss, com o círculo de invocação na Art Gallery (ao centro-esquerda do edifício da frente).",
      "Ao evoluir o Refectio em Sanctuary e derrotá-lo com o seu efeito passivo que limpa o ecrã, o Soleil Belmont fica desbloqueado como personagem jogável.",
      "Depois de desbloqueado, custa 1665 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "soma-cruz": {
    unlockShort: "Derrota o Gergoth com o Julius Belmont.",
    steps: [
      "Desbloqueia-se ao derrotar o Gergoth, situado no piso de baixo do edifício central, por baixo da library, mesmo acima do Capra Gate, jogando como Julius Belmont.",
      "Depois, custa 1000 moedas — valor que sobe consoante o número de personagens já compradas.",
      "Derrotar o Abbadon jogando como Soma desbloqueia a Yoko Belnades como personagem jogável.",
      "=== Dark Lord Soma Cruz ===",
      "Completar a Adventure Ode to Castlevania desbloqueia um skin alternativo para o Soma chamado Dark Lord Soma Cruz.",
    ],
  },
  "sonia-belmont": {
    unlockShort: "Encontra 7 Heart Refresh depois de abrires o Stallion Gate.",
    steps: ["Desbloqueia-se ao juntar um total de 7 itens Heart Refresh na fase Ode to Castlevania, que aparecem depois de obteres a relíquia Stallion Gate; depois, custa 500 moedas — valor que sobe consoante o número de personagens já compradas."],
  },
  "stella-loretta-lecarde": {
    unlockShort: "Abriga as suas almas gémeas com magia sagrada para lhes restaurar a humanidade.",
    steps: [
      "Depois de obteres o Pile of Secrets, a Stella Lecarde e a Loretta Lecarde aparecem na fase Ode to Castlevania como inimigos boss, no topo da clock tower, entre o Abbadon e o Metaglio Right.",
      "Para as desbloquear, o Sanctuary tem de desferir o golpe final com o seu ataque que cobre todo o ecrã, derrotando instantaneamente a Stella e a Loretta Lecarde.",
      "As cruzes invocadas pelo Refectio não contam para este desbloqueio.",
    ],
  },
  "stella-lecarde": {
    unlockShort: "Abriga as suas almas gémeas com magia sagrada para lhes restaurar a humanidade.",
    steps: [
      "Depois de obteres o Pile of Secrets, a Stella Lecarde e a Loretta Lecarde aparecem na fase Ode to Castlevania como inimigos boss, no topo da clock tower, entre o Abbadon e o Metaglio Right.",
      "Para as desbloquear, o Sanctuary tem de desferir o golpe final com o seu ataque que cobre todo o ecrã, derrotando instantaneamente a Stella e a Loretta Lecarde.",
      "As cruzes invocadas pelo Refectio não contam para este desbloqueio.",
      "Depois de desbloqueada, custa 2000 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "stone-skull": {
    unlockShort: "Mata uma esfera esquelética invertida com o Vessel of Dominus.",
    steps: [
      "Depois de obteres o Pile of Secrets, desbloqueia-se ao derrotar o Sketamari em The Bone Zone, no Modo Inverso, jogando como Shanoa.",
      "Consulta o Guide:Defeating the Sketamari para dicas.",
      "Depois de desbloqueado, custa 16 650 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  succubus: {
    unlockShort: "Dá à enganadora um gosto do seu próprio veneno.",
    steps: [
      "Depois de obteres o Beast Gate em Ode to Castlevania, a Succubus aparece como inimigo boss, com o círculo de invocação na Gallery, numa sala que contém o Dominus Anger.",
      "Ao evoluir o Hex em Nightmare e derrotá-la com ele, a Succubus fica desbloqueada como personagem jogável.",
      "Depois de desbloqueada, custa 16 650 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "sypha-belnades": {
    unlockShort: "Derrota Slogra and Gaibon com o Grant Danasty.",
    steps: [
      "Desbloqueia-se ao derrotar Slogra and Gaibon jogando como Grant Danasty.",
      "Depois, custa 500 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  tera: {
    unlockShort: "Mata 10 000 inimigos vermelhos que negam o Death.",
    steps: [
      "Depois de obteres o Pile of Secrets, desbloqueia-se ao destruir permanentemente um total de 10 000 Scarleton e/ou Skulorosso.",
      "Por exemplo, podes derrotar 4999 Scarletons e 5001 Skulorosso.",
      "Isto também se aplica retroactivamente.",
    ],
  },
  "trevor-belmont": {
    unlockShort: "Derrota o Giant Medusa Head com o Leon Belmont.",
    steps: [
      "Para o desbloquear, derrota o Giant Medusa Head em Ode to Castlevania jogando como Leon Belmont.",
      "Derrotar o Doppelganger em Ode to Castlevania jogando como Trevor desbloqueia o Alucard como personagem jogável.",
    ],
  },
  "vincent-dorin": {
    unlockShort: "Evolui o Fulgur e o Keremet Bubbles ao longo de qualquer número de runs.",
    steps: [
      "Desbloqueia-se ao evoluir tanto o Fulgur como o Keremet Bubbles, o que pode ser feito em runs diferentes.",
      "Depois, fica disponível para compra por 9000 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "vlad-tepes-dracula": {
    unlockShort: "Encontra e abre o terceiro caixão em Ode to Castlevania.",
    steps: ["Desbloqueia-se ao chegar ao fim da fase Ode to Castlevania jogando como Richter Belmont, e ao abrir o caixão que aparece depois da cutscene seguinte."],
  },
  "walter-bernhard": {
    unlockShort: "Deixa o alquimista vingar pessoalmente a sua família.",
    steps: [
      "Depois de obteres o Black Disk em Ode to Castlevania, o Walter Bernhard aparece na fase como inimigo boss, com o círculo de invocação na ponte entre o edifício da frente e o edifício central.",
      "Ao derrotá-lo jogando como Rinaldo Gandolfi, o Walter Bernhard fica desbloqueado como personagem jogável.",
      "Depois de desbloqueado, custa 16 650 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  wind: {
    unlockShort: "Testemunha o Burning Alcarde três vezes.",
    steps: [
      "Activa a habilidade Burning Alcarde do Eric Lecarde, que o envolve em chamas azuis durante 20 segundos quando está com vida crítica, três vezes na mesma run.",
      "Fazer isto desbloqueia o Wind como personagem jogável.",
      "Depois de desbloqueado, custa 2000 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "witch-actrise": {
    unlockShort: "Mata uma velha bruxa com uma jovem bruxa rebelde, onde dorme uma máscara de pedra.",
    steps: [
      "Depois de obteres o Pile of Secrets, desbloqueia-se ao derrotar a Hag em Inlaid Library jogando como Carrie Fernandez.",
      "Depois de desbloqueada, custa 5000 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "yoko-belnades": {
    unlockShort: "Derrota o Abaddon com o Soma Cruz.",
    steps: [
      "Desbloqueia-se ao derrotar o Abbadon, situado no topo da Clock Tower, jogando como Soma Cruz.",
      "Depois, custa 1665 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  "young-maria-renard": {
    unlockShort: "Reúne a caçadora mais jovem com o seu guardião, os amigos dele e os seus duplos.",
    steps: [
      "Começa uma run jogando como Maria Renard, equipa a Arcana Gemini (I) e obtém o Peachone e o Ebony Wings.",
      "Evoluir o Peachone e o Ebony Wings em Vandalier desbloqueia a Young Maria Renard como personagem jogável.",
      "Recomenda-se usar o Seal para obter o Peachone e o Ebony Wings mais facilmente.",
      "Depois de desbloqueada, custa 9000 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
  zephyr: {
    unlockShort: "Derrota o Chronomage com a Reencarnação de Drácula depois de o relógio marcar 30.",
    steps: [
      "Depois de desbloqueares o Pile of Secrets, ultrapassa os 30:00 em Ode to Castlevania jogando como Soma Cruz.",
      "Depois de chegares a esse ponto, derrota o Zephyr, situado na base da clock tower, do lado direito da mesma fase.",
      "Fazer isto desbloqueia o Zephyr como personagem jogável.",
      "Recomenda-se tentar isto com o Modo Endless activado, para evitar lidar com o Reaper.",
      "Depois de desbloqueado, custa 5000 moedas — valor que sobe consoante o número de personagens já compradas.",
    ],
  },
};
