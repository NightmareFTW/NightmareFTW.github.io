/* Epic Seven — Damage / EHP Calculator
   Defense formula (confirmed): damage taken multiplier = 300 / (300 + DEF).
   => EHP = HP × (300 + DEF) / 300 = HP × (1 + DEF/300).
   Effective Attack = ATK × (1 + min(CritChance,1) × (CritDmg − 1)). */

const $ = (id) => document.getElementById(id);
const num = (id) => parseFloat($(id).value) || 0;
const fmt = (n) => Math.round(n).toLocaleString("en-US");

function calc() {
  const atk = num("atk");
  const cc = Math.min(num("cc"), 100) / 100;
  const cd = num("cd") / 100;       // e.g. 230% -> 2.3
  const mod = num("mod") / 100;     // skill modifier
  const tdef = num("tdef");

  // Crit-adjusted effective attack
  const eatk = atk * (1 + cc * (cd - 1));
  $("eatk").textContent = fmt(eatk);

  // Average hit vs a target's defense
  const defMult = 300 / (300 + tdef);
  const hit = eatk * mod * defMult;
  $("hit").textContent = fmt(hit);

  // Defensive side
  const hp = num("hp");
  const def = num("def");
  const ehp = hp * (1 + def / 300);
  $("ehp").textContent = fmt(ehp);
  $("dr").textContent = `${(def / (300 + def) * 100).toFixed(1)}%`;
}

document.querySelectorAll("input").forEach((i) => i.addEventListener("input", calc));
calc();
