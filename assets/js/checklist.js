/* Reusable checklist engine with localStorage + optional auto-reset.
   A tool page defines a global CHECKLIST object then includes this script:

   CHECKLIST = {
     id: "ffxiv-dailies",                 // unique localStorage key
     sections: [
       { id: "daily", title: "Daily", reset: "ffxiv-daily", items: ["A","B"] },
       { id: "weekly", title: "Weekly", reset: "ffxiv-weekly", items: ["C"] },
       { id: "rigs", title: "Rigs", reset: null, items: ["X"] }   // never resets
     ]
   }

   reset values: "ffxiv-daily" (15:00 UTC), "ffxiv-weekly" (Tue 08:00 UTC),
                 "daily-local" (local midnight), null (persists forever).
*/
(function () {
  const cfg = window.CHECKLIST;
  const root = document.getElementById("checklist-root");
  if (!cfg || !root) return;

  const KEY = `nftw:checklist:${cfg.id}`;

  // Honkai: Star Rail resets at 04:00 local server time. The page stores the
  // chosen server's UTC offset (Asia +8, America -5, Europe +1) so the daily
  // reset lands at (4 - offset) UTC hours and the weekly anchors to Monday 04:00.
  const hsrOffset = () => { const v = parseFloat(localStorage.getItem("nftw:hsr:server")); return isNaN(v) ? 8 : v; };
  const hsrDailyHourUTC = () => 4 - hsrOffset();                 // UTC hour of the daily reset (may be <0 or >24)
  const hsrWeeklyEpoch = () => Date.UTC(2024, 0, 1, 0, 0, 0) + (4 - hsrOffset()) * 36e5; // a Monday 04:00 server time

  function periodKey(reset) {
    const now = Date.now();
    if (!reset) return "static";
    if (reset === "daily-local") {
      const d = new Date();
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    }
    if (reset === "ffxiv-daily") return String(Math.floor((now - 15 * 36e5) / 864e5));
    if (reset === "ffxiv-weekly") {
      const epoch = Date.UTC(2024, 0, 2, 8, 0, 0); // a known Tuesday 08:00 UTC
      return String(Math.floor((now - epoch) / (7 * 864e5)));
    }
    if (reset === "hsr-daily") return String(Math.floor((now - hsrDailyHourUTC() * 36e5) / 864e5));
    if (reset === "hsr-weekly") return String(Math.floor((now - hsrWeeklyEpoch()) / (7 * 864e5)));
    return "static";
  }

  function nextReset(reset) {
    if (!reset) return null;
    const now = Date.now();
    let next;
    if (reset === "daily-local") {
      const d = new Date(); d.setHours(24, 0, 0, 0); next = d.getTime();
    } else if (reset === "ffxiv-daily") {
      const period = Math.floor((now - 15 * 36e5) / 864e5);
      next = (period + 1) * 864e5 + 15 * 36e5;
    } else if (reset === "ffxiv-weekly") {
      const epoch = Date.UTC(2024, 0, 2, 8, 0, 0);
      const period = Math.floor((now - epoch) / (7 * 864e5));
      next = epoch + (period + 1) * 7 * 864e5;
    } else if (reset === "hsr-daily") {
      const off = hsrDailyHourUTC() * 36e5;
      const period = Math.floor((now - off) / 864e5);
      next = (period + 1) * 864e5 + off;
    } else if (reset === "hsr-weekly") {
      const epoch = hsrWeeklyEpoch();
      const period = Math.floor((now - epoch) / (7 * 864e5));
      next = epoch + (period + 1) * 7 * 864e5;
    } else return null;
    const diff = next - now;
    const h = Math.floor(diff / 36e5);
    const m = Math.floor((diff % 36e5) / 6e4);
    if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
    return `${h}h ${m}m`;
  }

  function load() {
    let data;
    try { data = JSON.parse(localStorage.getItem(KEY)) || {}; } catch { data = {}; }
    data.checks = data.checks || {};
    data.periods = data.periods || {};
    // Auto-reset any section whose period rolled over.
    cfg.sections.forEach((s) => {
      const pk = periodKey(s.reset);
      if (data.periods[s.id] !== pk) {
        s.items.forEach((_, i) => delete data.checks[`${s.id}:${i}`]);
        data.periods[s.id] = pk;
      }
    });
    return data;
  }

  let state = load();

  function save() { localStorage.setItem(KEY, JSON.stringify(state)); }

  function render() {
    root.innerHTML = cfg.sections.map((s) => {
      const done = s.items.filter((_, i) => state.checks[`${s.id}:${i}`]).length;
      const reset = nextReset(s.reset);
      const resetTag = reset ? `<span class="reset-tag">resets in ${reset}</span>` : "";
      const rows = s.items.map((item, i) => {
        const id = `${s.id}:${i}`;
        const checked = state.checks[id] ? "checked" : "";
        return `<label class="check-row ${checked}" data-id="${id}">
          <span class="check-box">${checked ? "✓" : ""}</span>
          <span class="check-label">${item}</span>
        </label>`;
      }).join("");
      return `<div class="panel check-section">
        <div class="check-head">
          <h2>${s.title}</h2>
          <div class="check-head-right">
            ${resetTag}
            <span class="check-count">${done}/${s.items.length}</span>
          </div>
        </div>
        <div class="check-progress"><div class="check-bar" style="width:${(done / s.items.length) * 100}%"></div></div>
        <div class="check-rows">${rows}</div>
      </div>`;
    }).join("");

    root.querySelectorAll(".check-row").forEach((row) => {
      row.addEventListener("click", () => {
        const id = row.dataset.id;
        if (state.checks[id]) delete state.checks[id]; else state.checks[id] = true;
        save();
        render();
      });
    });
  }

  document.getElementById("reset-all")?.addEventListener("click", () => {
    state.checks = {};
    save();
    render();
  });

  render();
  // Re-check resets if the tab is left open across a reset boundary.
  setInterval(() => { state = load(); render(); }, 60000);
})();
