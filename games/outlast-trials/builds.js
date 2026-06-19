/* The Outlast Trials — Recommended meta builds.
   Curated rig + amp loadouts for common roles. A loadout = 1 Rig + 1 Tool amp
   + 1 Skill amp + 1 Medicine amp (the same slots as the Loadout Builder).
   Amp names match the in-game / wiki list used by the builder. */

const BUILDS = [
  {
    name: "Solo Stealth Scout", role: "Solo", tag: "Awareness",
    rig: "X-Ray Rig", Tool: "Noise Reduction", Skill: "Invisible", Medicine: "Incognito",
    why: "X-Ray lets you see enemies through walls so you never round a corner blind. Noise Reduction + Invisible keep you off their radar while you scout and grab objectives; Incognito buys extra time when you do get spotted." },
  {
    name: "Team Medic", role: "Co-op", tag: "Support",
    rig: "Heal Rig", Tool: "Battery Charger", Skill: "Hide and Heal", Medicine: "Double Doses",
    why: "Heal Rig keeps the squad topped up from range. Battery Charger keeps your rig online, Hide and Heal lets you recover safely in lockers, and Double Doses stretches every medicine pickup — you become the reason the team survives MK runs." },
  {
    name: "Crowd Control Bruiser", role: "Co-op", tag: "Aggro",
    rig: "Stun Rig", Tool: "Short Circuit", Skill: "Strong Arm", Medicine: "Boosted",
    why: "Stun Rig freezes a chasing enemy (or a Big Grunt) so the team can push past. Short Circuit speeds rig cooldown, Strong Arm shoves enemies off teammates, and Boosted keeps your stamina up for the constant repositioning." },
  {
    name: "Escape Artist", role: "Solo / Co-op", tag: "Survival",
    rig: "Blind Rig", Tool: "Slippers", Skill: "Quick Escape", Medicine: "Last Chance",
    why: "Blind a hunter to break a chase on demand. Slippers make you near-silent, Quick Escape rips you out of grabs faster, and Last Chance gives a clutch survival window — built to slip away from Night Hunters and Prime Assets." },
  {
    name: "Objective Rusher", role: "Co-op", tag: "Speed",
    rig: "Blind Rig", Tool: "Lock Breaker", Skill: "Hide and Breathe", Medicine: "Surplus",
    why: "Lock Breaker shreds locked doors so you blitz objectives; Blind Rig clears the path when something's in the way. Hide and Breathe resets your sanity/stamina in cover and Surplus keeps resources flowing for a fast clear." },
  {
    name: "Lockdown Anchor", role: "Solo", tag: "Control",
    rig: "Barricade Rig", Tool: "Key Master", Skill: "Door Trap Breaker", Medicine: "Self Revive",
    why: "Barricade Rig seals doors to control where enemies can reach you. Key Master speeds locks, Door Trap Breaker safely clears rigged doors, and Self Revive means a solo mistake doesn't end the run — a self-sufficient survival kit." },
];

const SLOTS = [["rig", "Rig"], ["Tool", "Tool Amp"], ["Skill", "Skill Amp"], ["Medicine", "Medicine Amp"]];
const root = document.getElementById("bd-root");
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

root.innerHTML = BUILDS.map((b) => `
  <div class="mbuild-card">
    <div class="mbuild-head">
      <span class="mbuild-name">${esc(b.name)}</span>
      <span class="mbuild-tags"><span class="ev-chip">${esc(b.role)}</span><span class="role-chip role-Buff">${esc(b.tag)}</span></span>
    </div>
    <div class="mbuild-slots">
      ${SLOTS.map(([k, label]) => `<div class="mbuild-slot"><span class="mbuild-slot-label">${label}</span><b>${esc(b[k])}</b></div>`).join("")}
    </div>
    <p class="mbuild-why">${esc(b.why)}</p>
    <a class="mini-btn" href="loadout.html">↗ Recreate in the Loadout Builder</a>
  </div>`).join("");
