/* ============================================================
   Dark Souls II — Trophy Tracker  (app logic)
   - renders trophy cards from data.js
   - persists progress in localStorage
   - main trophy unlock + per-item "magic collect" checklists
   ============================================================ */

const STORE_KEY = "ds2-trophy-progress-v1";
const RING_CIRC = 2 * Math.PI * 58; // matches r=58 in the SVG

/* ---------- state ---------- */
let state = loadState();              // { trophies:{id:bool}, items:{ "id-idx":bool } }
let activeFilter = "all";
let query = "";

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* ignore */ }
  return { trophies: {}, items: {} };
}
function saveState() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {}
}

/* ---------- helpers ---------- */
const pad = n => String(n).padStart(2, "0");
const iconPath = id => `icons/trophy-${pad(id)}.png`;
const PLACEHOLDER = { platinum: "🏆", gold: "🔥", silver: "🔥", bronze: "🔥" };

// A trophy "done" = its main flag is set. (Checklists are guidance toward it.)
const isTrophyDone = t => !!state.trophies[t.id];

function checklistProgress(t) {
  if (!t.checklist) return null;
  let done = 0;
  t.checklist.forEach((_, i) => { if (state.items[`${t.id}-${i}`]) done++; });
  return { done, total: t.checklist.length };
}

/* ---------- rendering ---------- */
const grid = document.getElementById("grid");

function render() {
  const visible = TROPHIES.filter(passesFilter);
  grid.innerHTML = "";

  if (!visible.length) {
    grid.innerHTML = `<div class="empty">沒有符合條件的獎盃……繼續探索吧，不死人。</div>`;
  } else {
    visible.forEach(t => grid.appendChild(card(t)));
  }
  updateDashboard();
}

function passesFilter(t) {
  // filter chips
  if (activeFilter === "todo" && isTrophyDone(t)) return false;
  if (activeFilter === "done" && !isTrophyDone(t)) return false;
  if (["platinum","gold","silver","bronze"].includes(activeFilter) && t.grade !== activeFilter) return false;

  // search across name, english, desc, guide, and checklist items
  if (query) {
    const hay = [t.name, t.nameEn, t.desc, t.guide,
      ...(t.checklist ? t.checklist.flatMap(c => [c.t, c.d]) : [])
    ].join(" ").toLowerCase();
    if (!hay.includes(query)) return false;
  }
  return true;
}

function card(t) {
  const done = isTrophyDone(t);
  const el = document.createElement("article");
  el.className = `card grade-${t.grade}${done ? " done" : ""}`;

  /* icon */
  const icon = document.createElement("div");
  icon.className = "icon-wrap";
  icon.innerHTML = `<div class="ring-glow"></div>`;
  const img = document.createElement("img");
  img.src = iconPath(t.id);
  img.alt = t.name;
  img.onerror = () => {
    icon.querySelector("img")?.remove();
    const ph = document.createElement("div");
    ph.className = "placeholder";
    ph.textContent = PLACEHOLDER[t.grade] || "🔥";
    icon.appendChild(ph);
  };
  icon.appendChild(img);

  /* body */
  const body = document.createElement("div");
  body.className = "body";
  body.innerHTML = `
    <div class="toprow">
      <span class="num">No.${pad(t.id)}</span>
      <span class="name">${t.name}</span>
      <span class="name-en">${t.nameEn}</span>
      <span class="grade-tag">${t.grade}</span>
    </div>
    <p class="desc">${t.desc}</p>
    <p class="guide">${t.guide}</p>
  `;

  /* checklist */
  if (t.checklist) body.appendChild(checklistBlock(t));

  /* next-step reminder — only while the trophy is still unearned */
  if (!done) body.appendChild(nextStepBlock(t));

  /* toggle */
  const toggleCol = document.createElement("div");
  toggleCol.className = "toggle";
  const inner = document.createElement("div");
  inner.className = "toggle-col";
  const btn = document.createElement("button");
  btn.className = `bonfire-toggle${done ? " lit" : ""}`;
  btn.innerHTML = done ? "🔥" : "✦";
  btn.title = done ? "已獲得 — 點擊取消" : "標記為已獲得";
  btn.addEventListener("click", () => {
    state.trophies[t.id] = !state.trophies[t.id];
    saveState();
    if (state.trophies[t.id]) toast(`獎盃入手：${t.name}`);
    render();
  });
  const lbl = document.createElement("div");
  lbl.className = "toggle-label";
  lbl.textContent = done ? "已獲得" : "未獲得";
  inner.appendChild(btn);
  inner.appendChild(lbl);
  toggleCol.appendChild(inner);

  el.appendChild(icon);
  el.appendChild(body);
  el.appendChild(toggleCol);
  return el;
}

function checklistBlock(t) {
  const prog = checklistProgress(t);
  const wrap = document.createElement("div");
  wrap.className = "collect";
  // keep it open if user is searching, otherwise collapsed by default
  if (query) wrap.classList.add("open");

  const head = document.createElement("div");
  head.className = "collect-head";
  head.innerHTML = `<span class="chev">▶</span>
    <span>收集清單 Checklist</span>
    <span class="mini-prog">${prog.done} / ${prog.total}</span>`;
  head.addEventListener("click", () => wrap.classList.toggle("open"));
  wrap.appendChild(head);

  const items = document.createElement("div");
  items.className = "collect-items";
  t.checklist.forEach((c, i) => {
    const key = `${t.id}-${i}`;
    const label = document.createElement("label");
    label.className = "check";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = !!state.items[key];
    input.addEventListener("change", () => {
      state.items[key] = input.checked;
      saveState();
      // refresh the mini progress counter without full re-render
      const p = checklistProgress(t);
      head.querySelector(".mini-prog").textContent = `${p.done} / ${p.total}`;
      // keep the "next step" reminder in sync with what's left
      const nb = wrap.parentElement?.querySelector(".next-step .next-body");
      if (nb) fillNextStep(t, nb);
    });
    label.appendChild(input);
    const box = document.createElement("span"); box.className = "box";
    label.appendChild(box);
    const ctext = document.createElement("span");
    ctext.className = "ctext";
    ctext.innerHTML = `<b>${c.t}</b><span>${c.d}</span>`;
    label.appendChild(ctext);
    items.appendChild(label);
  });
  wrap.appendChild(items);
  return wrap;
}

/* ---------- next-step reminder ---------- */
const NEXT_CAP = 5; // max remaining checklist items to spell out inline

function nextStepBlock(t) {
  const wrap = document.createElement("div");
  wrap.className = "next-step";
  wrap.innerHTML = `<div class="next-head">🔥 下一步 · To Unlock</div>
    <div class="next-body"></div>`;
  fillNextStep(t, wrap.querySelector(".next-body"));
  return wrap;
}

// Renders "what's left to do" into `box`, recomputed from current state.
function fillNextStep(t, box) {
  const prog = checklistProgress(t);

  if (prog) {
    const remaining = t.checklist
      .map((c, i) => ({ c, i }))
      .filter(({ i }) => !state.items[`${t.id}-${i}`]);

    if (!remaining.length) {
      box.innerHTML = `<p class="ns-ready">收集清單已全部完成 ✓ — 點燃右側營火即可入手獎盃！</p>`;
      return;
    }
    const shown = remaining.slice(0, NEXT_CAP)
      .map(({ c }) => `<li><b>${c.t}</b><span>${c.d}</span></li>`).join("");
    const more = remaining.length > NEXT_CAP
      ? `<li class="ns-more">…還有 ${remaining.length - NEXT_CAP} 項，點此展開下方收集清單</li>`
      : "";
    box.innerHTML = `<p class="ns-lead">還差 <b>${remaining.length}</b> 項才能解鎖：</p>
      <ul class="ns-list">${shown}${more}</ul>`;

    // make the "…還有 N 項" line open & reveal the collapsed checklist
    const moreEl = box.querySelector(".ns-more");
    if (moreEl) {
      moreEl.addEventListener("click", () => {
        const collect = box.closest(".body")?.querySelector(".collect");
        if (!collect) return;
        collect.classList.add("open");
        collect.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
    }
    return;
  }

  // no checklist: the guide above is the "how", so just nudge toward marking it
  box.innerHTML = `<p class="ns-lead">依上方攻略完成條件後，點燃右側營火將其標記為「已獲得」。</p>`;
}

/* ---------- dashboard ---------- */
function updateDashboard() {
  const total = TROPHIES.length;
  const done = TROPHIES.filter(isTrophyDone).length;
  const pct = Math.round((done / total) * 100);

  document.getElementById("countDone").textContent = done;
  document.getElementById("countTotal").textContent = total;
  document.getElementById("ringPct").textContent = pct + "%";

  const ring = document.getElementById("ringFill");
  ring.style.strokeDasharray = RING_CIRC;
  ring.style.strokeDashoffset = RING_CIRC * (1 - done / total);
}

function buildLegend() {
  const legend = document.getElementById("legend");
  legend.innerHTML = "";
  GRADE_ORDER.forEach(g => {
    const all = TROPHIES.filter(t => t.grade === g);
    if (!all.length) return;
    const got = all.filter(isTrophyDone).length;
    const lg = document.createElement("span");
    lg.className = "lg";
    lg.innerHTML = `<span class="dot ${g}"></span>${GRADE_LABEL[g].split(" ")[0]} <b>${got}/${all.length}</b>`;
    legend.appendChild(lg);
  });
}

/* ---------- toast ---------- */
let toastTimer;
function toast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2200);
}

/* ---------- wiring ---------- */
document.getElementById("filters").addEventListener("click", e => {
  const btn = e.target.closest(".btn");
  if (!btn) return;
  document.querySelectorAll("#filters .btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  activeFilter = btn.dataset.filter;
  render();
});

document.getElementById("search").addEventListener("input", e => {
  query = e.target.value.trim().toLowerCase();
  render();
});

document.getElementById("resetBtn").addEventListener("click", () => {
  if (confirm("確定要熄滅全部進度嗎？此操作無法復原。")) {
    state = { trophies: {}, items: {} };
    saveState();
    render();
    buildLegend();
    toast("進度已重置");
  }
});

/* ---------- override render to also refresh legend ---------- */
const _render = render;
render = function () { _render(); buildLegend(); };

/* ---------- go ---------- */
render();
