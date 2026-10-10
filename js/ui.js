/* ==========================================================================
   UI: content renderer (panels + Quick View), quest log, menu, toasts
   ========================================================================== */
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const ext = (u) => /^https?:/.test(u);
const linkAttrs = (u, kind) => (ext(u) ? ` href="${esc(u)}" target="_blank" rel="noopener"` : ` href="${esc(u)}"${kind === "download" ? " download" : ""}`);

function iconURL(name, size = 64) {
  const src = iconFor(name);
  const s = Math.max(1, Math.floor(Math.min(size / src.width, size / src.height)));
  const [c, x] = makeCanvas(src.width * s, src.height * s);
  x.imageSmoothingEnabled = false; x.drawImage(src, 0, 0, c.width, c.height);
  return c.toDataURL();
}

function flowHTML(steps, loop, caption) {
  const parts = steps.map((st, i) =>
    `<div class="fstep${st.warn ? " warn" : ""}${st.ok ? " ok" : ""}"><b>${st.t}</b><span>${st.d || ""}</span></div>` +
    (i < steps.length - 1 ? `<div class="farrow" aria-hidden="true">▶</div>` : "")).join("");
  return `<figure class="flow${loop ? " loop" : ""}"><div class="frow">${parts}</div>${loop ? `<div class="floop">↺ repeats: ship, measure, fix the largest gap</div>` : ""}${caption ? `<figcaption>${caption}</figcaption>` : ""}</figure>`;
}

function linksHTML(items, big) {
  return `<div class="links${big ? " big" : ""}">${items.map((l) => `<a class="btn"${linkAttrs(l.url, l.kind)}>▶ ${l.label}</a>`).join("")}</div>`;
}

function renderBlocks(blocks) {
  return blocks.map((b) => {
    switch (b.type) {
      case "p": return `<p>${b.text}</p>`;
      case "h": return `<h3>${b.text}</h3>`;
      case "quote": return `<blockquote>${b.text}</blockquote>`;
      case "callout": return `<div class="callout"><b>${b.title}</b><span>${b.text}</span></div>`;
      case "facts": return `<dl class="facts">${b.items.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("")}</dl>`;
      case "stats": return `<div class="stats">${b.items.map((s) => `<div class="stat"><b>${s.v}</b><span>${s.l}</span></div>`).join("")}</div>`;
      case "flow": return flowHTML(b.steps, b.loop, b.caption);
      case "compare": return `<figure class="compare${b.neutral ? " neutral" : ""}">${["left", "right"].map((k) => {
        const s = b[k];
        return `<div class="cside ${k}"><small>${s.label}</small><b>${s.title}</b>${s.formula ? `<code>${s.formula}</code>` : ""}<ul>${s.items.map((i) => `<li>${i}</li>`).join("")}</ul><em>${s.foot}</em></div>`;
      }).join(`<div class="cvs">vs</div>`)}${b.caption ? `<figcaption>${b.caption}</figcaption>` : ""}</figure>`;
      case "img": return `<figure class="shot"><a href="${b.src}" target="_blank" rel="noopener"><img src="${b.src}" alt="${esc(b.cap || "")}" loading="lazy"></a>${b.cap ? `<figcaption>${b.cap}</figcaption>` : ""}</figure>`;
      case "gallery": return `<div class="gallery">${b.items.map((i) => `<figure class="shot"><a href="${i.src}" target="_blank" rel="noopener"><img src="${i.src}" alt="${esc(i.cap)}" loading="lazy"></a><figcaption>${i.cap}</figcaption></figure>`).join("")}</div>`;
      case "links": return linksHTML(b.items, b.big);
      case "list": return `${b.title ? `<h4>${b.title}</h4>` : ""}<ul class="list">${b.items.map((i) => `<li>${i}</li>`).join("")}</ul>`;
      case "tags": return `<div class="tagwrap">${b.title ? `<h4>${b.title}</h4>` : ""}<div class="tags">${b.items.map((t) => `<span>${t}</span>`).join("")}</div></div>`;
      case "code": return `<figure class="code"><pre><code>${esc(b.text)}</code></pre>${b.caption ? `<figcaption>${b.caption}</figcaption>` : ""}</figure>`;
      case "courses": return `<div class="courses">${b.terms.map((t) => `<div class="term${t.current ? " current" : ""}"><b>${t.term}</b><ul>${t.items.map((i) => `<li>${t.current ? "◇" : "✓"} ${i}</li>`).join("")}</ul></div>`).join("")}</div>`;
      case "trophies": return `<div class="trophies">${b.items.map((t) => `<div class="tro ${t.k}"><i aria-hidden="true"></i><b>${t.t}</b><span>${t.d}</span></div>`).join("")}</div>`;
      case "cards": return `<div class="cards">${b.items.map((c) => `<article class="card">
          ${c.img ? `<a class="cimg" href="${c.img}" target="_blank" rel="noopener"><img src="${c.img}" alt="${esc(c.title)} screenshot" loading="lazy"></a>` : ""}
          <h4>${c.title}</h4>${c.sub ? `<small>${c.sub}</small>` : ""}
          ${c.text ? `<p>${c.text}</p>` : ""}
          ${c.flow ? flowHTML(c.flow) : ""}
          ${c.tags ? `<div class="tags">${c.tags.map((t) => `<span>${t}</span>`).join("")}</div>` : ""}
          ${c.links ? linksHTML(c.links) : ""}
        </article>`).join("")}</div>`;
      default: return "";
    }
  }).join("\n");
}

/* ---------- Panel (one section, in-game) ---------- */
const UI = {
  current: null,
  auto: false,
  onClose: null,
  onPanelClose: null,
  onLaunch: null,
  onGo: null,

  openPanel(id, auto = false) {
    const i = SECTIONS.findIndex((s) => s.id === id);
    if (i < 0) return;
    const s = SECTIONS[i];
    const same = this.current === id && !$("#panel").hidden;
    this.current = id; this.auto = auto;
    document.body.classList.add("panel-open");
    if (same) return;
    const panel = $("#panel");
    $("#pIcon").src = iconURL(s.icon, 72);
    $("#pTitle").textContent = s.title;
    $("#pSub").textContent = s.subtitle || "";
    $("#pBody").innerHTML = renderBlocks(s.blocks) +
      (s.launch ? `<div class="links big"><button class="btn launch" id="launchBtn">🚀 LAUNCH THE ROCKET!</button></div>` : "");
    $("#pCount").textContent = `${i + 1} / ${SECTIONS.length}`;
    panel.hidden = false;
    const win = panel.firstElementChild;
    win.classList.remove("pop"); void win.offsetWidth; win.classList.add("pop");
    $("#pBody").scrollTop = 0;
    $("#pHint").textContent = auto ? "Walk away or press Esc to close" : "Press Esc or × to close";
    const lb = $("#launchBtn"); if (lb) lb.onclick = () => { this.closePanel(); this.onLaunch && this.onLaunch(); };
    try { history.replaceState(null, "", "#" + id); } catch {}
  },
  closePanel(reason = "user") {
    if ($("#panel").hidden) return;
    $("#panel").hidden = true; this.current = null; this.auto = false;
    document.body.classList.remove("panel-open");
    try { history.replaceState(null, "", location.pathname + location.search); } catch {}
    this.onPanelClose && this.onPanelClose(reason);
  },
  step(d) {
    const i = SECTIONS.findIndex((s) => s.id === this.current);
    const n = SECTIONS[(i + d + SECTIONS.length) % SECTIONS.length];
    Audio8.play("select"); this.openPanel(n.id, false);
  },

  /* ---------- Quick View: the whole portfolio on one scrolling page ---------- */
  buildQuick() {
    const q = $("#quickInner");
    const nav = SECTIONS.map((s) => `<a href="#q-${s.id}" data-q="${s.id}">${s.title}</a>`).join("");
    q.innerHTML = `
      <header class="qhero">
        <div class="qhero-txt">
          <small>${PROFILE.roles}</small>
          <h1>${PROFILE.name}</h1>
          <p class="qtag">${PROFILE.tagline}</p>
          <p class="qstatus">${PROFILE.status} · F-1 OPT, STEM eligible</p>
          ${linksHTML([
            { label: "Email", url: "mailto:" + PROFILE.email },
            { label: "LinkedIn", url: PROFILE.linkedin },
            { label: "GitHub", url: PROFILE.github },
            { label: "Tableau Public", url: PROFILE.tableau },
            { label: "Portfolio PDF", url: PROFILE.pdf, kind: "download" },
          ])}
        </div>
        <img class="qavatar" src="${iconURL("robot", 120)}" alt="" aria-hidden="true">
      </header>
      <nav class="qnav">${nav}</nav>
      ${SECTIONS.map((s) => `
        <section class="qsec" id="q-${s.id}">
          <div class="qsec-h"><img src="${iconURL(s.icon, 56)}" alt="" aria-hidden="true"><div><h2>${s.title}</h2><small>${s.subtitle || ""}</small></div></div>
          ${renderBlocks(s.blocks)}
        </section>`).join("")}
      <footer class="qfoot"><p>Built as a playable pixel town: every sprite is hand-coded.</p>${linksHTML([{ label: "Back to the game", url: "#" }])}</footer>`;
    q.querySelectorAll(".qnav a").forEach((a) => a.addEventListener("click", (e) => {
      e.preventDefault(); $("#q-" + a.dataset.q).scrollIntoView({ behavior: "smooth", block: "start" });
    }));
    q.querySelector(".qfoot a").addEventListener("click", (e) => { e.preventDefault(); UI.closeQuick(); });
  },
  openQuick(sectionId) {
    if (!$("#quickInner").children.length) this.buildQuick();
    $("#quick").hidden = false; Audio8.play("open");
    if (sectionId) setTimeout(() => $("#q-" + sectionId)?.scrollIntoView({ block: "start" }), 30);
    else $("#quick").scrollTop = 0;
    try { history.replaceState(null, "", "#quick"); } catch {}
  },
  closeQuick() {
    if ($("#quick").hidden) return;
    $("#quick").hidden = true; Audio8.play("close");
    try { history.replaceState(null, "", location.pathname + location.search); } catch {}
    this.onClose && this.onClose();
  },

  /* ---------- Quest log ---------- */
  openLog(found) {
    $("#logList").innerHTML = SECTIONS.map((s) => {
      const f = found.has(s.id);
      return `<li class="${f ? "found" : ""}"><img src="${iconURL(s.icon, 32)}" alt="" aria-hidden="true"><div><b>${s.title}</b><small>${f ? "✓ Discovered" : "Not yet visited"}</small></div><button class="btn go" data-go="${s.id}">GO ▶</button><button class="btn read" data-read="${s.id}">READ</button></li>`;
    }).join("");
    $("#logCount").textContent = `${found.size} / ${SECTIONS.length}`;
    $("#questlog").hidden = false; Audio8.play("open");
    $("#logList").querySelectorAll("[data-go]").forEach((b) => b.onclick = () => { this.closeLog(true); this.onGo && this.onGo(b.dataset.go); });
    $("#logList").querySelectorAll("[data-read]").forEach((b) => b.onclick = () => { this.closeLog(true); this.openPanel(b.dataset.read, false); Audio8.play("open"); });
  },
  closeLog(silent) {
    if ($("#questlog").hidden) return;
    $("#questlog").hidden = true; if (!silent) { Audio8.play("close"); this.onClose && this.onClose(); }
  },

  /* ---------- Start menu ---------- */
  toggleMenu(force) {
    const m = $("#menu"), open = force !== undefined ? force : m.hidden;
    m.hidden = !open;
    Audio8.play(open ? "open" : "close");
    if (open) m.querySelector("button").focus({ preventScroll: true });
    else this.onClose && this.onClose();
  },

  toast(html, ms = 2600) {
    const t = document.createElement("div");
    t.className = "toast"; t.innerHTML = html;
    $("#toasts").appendChild(t);
    setTimeout(() => t.classList.add("out"), ms);
    setTimeout(() => t.remove(), ms + 500);
  },

  anyOverlay() {
    return !$("#tourPlanner").hidden || !$("#quick").hidden || !$("#questlog").hidden || !$("#menu").hidden || !$("#title").hidden;
  },
};

/* panel controls */
document.addEventListener("DOMContentLoaded", () => {
  $("#pClose").onclick = () => { Audio8.play("close"); UI.closePanel("user"); };
  $("#pPrev").onclick = () => UI.step(-1);
  $("#pNext").onclick = () => UI.step(1);
  $("#pQuick").onclick = () => { const id = UI.current; UI.closePanel("quick"); UI.openQuick(id); };
  $("#questlog").addEventListener("click", (e) => { if (e.target.id === "questlog") UI.closeLog(); });
  $("#logClose").onclick = () => UI.closeLog();
  $("#quickClose").onclick = () => UI.closeQuick();
});
