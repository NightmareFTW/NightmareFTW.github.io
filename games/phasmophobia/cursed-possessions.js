/* Phasmophobia — Cursed Possession Reference
   Summaries of the 7 cursed possessions: what they do, how to use them,
   the risk, and tips. Values can shift slightly between patches. */

const POSSESSIONS = [
  {
    name: "Ouija Board",
    tag: "Information",
    summary: "Ask the ghost questions out loud and get answers — room, age, number of ghosts, bone location and more.",
    use: "Place it down, hold Use, and speak a question. Answers appear as text. Common safe questions: \"Where are you?\", \"How old are you?\", \"How many people are in this room?\"",
    risk: "Every question drains sanity. Asking about death/age or using it below ~0% sanity can trigger an immediate hunt. The board can break after answering.",
    tip: "Answer-hunting is fastest with high group sanity. Avoid \"death\" questions; stop using it under ~30% sanity unless you're ready to hide.",
  },
  {
    name: "Music Box",
    tag: "Reveal",
    summary: "Lures the ghost into manifesting and walking toward the box, revealing it in the open.",
    use: "Pick it up and activate. If the ghost is within range the music plays clearly and it manifests near the box. If it's too far the tune distorts and your sanity drains.",
    risk: "Sanity drains while it plays out of range. The ghost will eventually smash it.",
    tip: "Brilliant for a clear ghost photo. Hold it at arm's length and snap the manifestation before the box breaks.",
  },
  {
    name: "Summoning Circle",
    tag: "Reveal",
    summary: "Forces the ghost to appear at the circle for a long manifestation.",
    use: "Light all 5 candles (you need an igniter/lighter). Once lit, the ghost is summoned to the centre and manifests for several seconds.",
    risk: "Massive sanity drain and it forces a hunt right after. Everyone nearby is exposed.",
    tip: "One of the best ghost-photo tools. Set up, light, photograph, then immediately run and hide — a hunt is coming.",
  },
  {
    name: "Tarot Cards",
    tag: "Gamble",
    summary: "Draw a card from a 10-card deck for a random effect, good or bad. Cards burn after use.",
    use: "Hold Use to draw a random card. Effects below are the notable draws:",
    list: [
      "The Fool — nothing happens (can mimic another card).",
      "The Sun — large sanity restore.",
      "The Moon — sets your sanity to 0%.",
      "The Star — small sanity restore.",
      "The Wheel of Fortune — green flame: +sanity; red flame: −sanity.",
      "The Devil — forces a ghost event / interaction.",
      "The Hermit — teleports the ghost to its room and pins it briefly.",
      "The High Priestess — revives one dead teammate.",
      "Death — curses you with a guaranteed hunt.",
      "The Hanged Man — instantly kills the person who drew it.",
    ],
    risk: "Death and The Hanged Man are dangerous. Drawing near 0% sanity is risky.",
    tip: "The Hermit is a lifesaver during a hunt. Don't gamble the last cards at low sanity — Death can end the run.",
  },
  {
    name: "Haunted Mirror",
    tag: "Information",
    summary: "Shows the ghost's favourite room through the glass.",
    use: "Hold Use to look into it — the reflection shows the ghost room. The glass cracks the longer you use it.",
    risk: "Drains sanity while active. Once fully cracked it breaks and is gone.",
    tip: "Fast way to locate the room early on big maps. Use in short bursts and stop when it cracks.",
  },
  {
    name: "Voodoo Doll",
    tag: "Force evidence",
    summary: "Forces ghost interactions on demand by pinning body parts.",
    use: "Hold Use to push a pin into a random part. Each pin forces a ghost interaction (sound, throw, etc.).",
    risk: "Pinning the heart (random chance) forces a hunt. Sanity drains with each pin.",
    tip: "Handy for triggering writing/throw interactions when the ghost is shy — but stop before it forces a hunt.",
  },
  {
    name: "Monkey Paw",
    tag: "Gamble",
    summary: "Grants wishes — each with a cursed downside. Limited wishes per paw.",
    use: "Hold it and say \"I wish for…\". Known wishes and their catch:",
    list: [
      "\"…sanity\" — restores sanity, but the ghost gets faster / fog rolls in.",
      "\"…to see the ghost\" — the ghost manifests, but turns very aggressive.",
      "\"…for safety\" — no hunts for a short time, then dense fog.",
      "\"…for the ghost to go away\" — it leaves the area briefly, but returns angrier.",
      "\"…to leave\" — opens the exit, but at a steep curse.",
      "\"…for life\" — revives a teammate, with a heavy downside.",
    ],
    risk: "Every wish has a curse. Wording matters — wish carefully.",
    tip: "Treat it as a last resort. The 'safety' wish can buy a teammate time to revive or escape.",
  },
];

const root = document.getElementById("cp-root");

root.innerHTML = POSSESSIONS.map((p, i) => `
  <div class="cp-card" data-i="${i}">
    <div class="cp-head">
      <div>
        <span class="cp-name">${p.name}</span>
        <span class="ev-chip">${p.tag}</span>
      </div>
      <span class="cp-toggle">▾</span>
    </div>
    <p class="cp-summary">${p.summary}</p>
    <div class="cp-detail">
      <p><b>How to use.</b> ${p.use}</p>
      ${p.list ? `<ul class="cp-sublist">${p.list.map((x) => `<li>${x}</li>`).join("")}</ul>` : ""}
      <p><b style="color:var(--danger)">Risk.</b> ${p.risk}</p>
      <p><b style="color:var(--accent-2)">Tip.</b> ${p.tip}</p>
    </div>
  </div>`).join("");

root.querySelectorAll(".cp-card").forEach((card) => {
  card.querySelector(".cp-head").addEventListener("click", () => card.classList.toggle("open"));
});
