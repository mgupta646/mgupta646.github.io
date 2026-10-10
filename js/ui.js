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

  /* ---------- Selected work + addressable case-study reader ---------- */
  quickTrack: 'ai',
  quickSection: null,
  quickReturn: null,
  quickIsolated: [],

  workCards() {
    const track = WORK_TRACKS.find(t => t.id === this.quickTrack) || WORK_TRACKS[0];
    return track.ids.map((id, i) => {
      const n = WORK_NOTES[id], sec = SECTIONS.find(s => s.id === id);
      return `<article class="work-card">
        <a class="work-art ${n.image ? 'has-shot' : 'pixel-scene scene-' + id}" href="#q-${id}" tabindex="-1" aria-hidden="true">
          ${n.image ? `<img src="${n.image}" alt="" width="600" height="330" loading="lazy">` : `<img src="${iconURL(sec.icon, 128)}" alt="">`}
          <span class="work-number">0${i + 1}</span>
        </a>
        <div class="work-copy"><p class="eyebrow">${n.eyebrow}</p><span class="work-status">${n.status}</span>
        <h3><a href="#q-${id}">${n.title}</a></h3><p>${n.text}</p>
        <p class="work-proof">${n.proof}</p><small>${n.result}</small>
        <a class="case-link" href="#q-${id}">Read ${sec.title} <span aria-hidden="true">↗</span></a></div>
      </article>`;
    }).join('');
  },

  sectionPicker(selected = '') {
    return `<label class="section-picker">Explore all work <select id="workSelect"><option value="">Choose a case study or chapter…</option>${CATEGORIES.map(c => `<optgroup label="${c.name}">${SECTIONS.filter(s => s.cat === c.id).map(s => `<option value="${s.id}" ${s.id === selected ? 'selected' : ''}>${s.title}</option>`).join('')}</optgroup>`).join('')}</select></label>`;
  },

  buildQuick(sectionId) {
    const q = $('#quickInner'), sec = SECTIONS.find(s => s.id === sectionId);
    this.quickSection = sec?.id || null;
    if (sec) {
      const note = WORK_NOTES[sec.id];
      q.innerHTML = `<nav class="reader-nav" aria-label="Case study navigation"><a class="case-link" href="#quick">← Selected work</a>${this.sectionPicker(sec.id)}</nav>
        <article class="qsec reader" id="q-${sec.id}">
          <div class="qsec-h"><img src="${iconURL(sec.icon, 64)}" alt=""><div><p class="eyebrow">CASE FILE / ${String(SECTIONS.indexOf(sec) + 1).padStart(2, '0')}</p><h1 id="readerTitle" tabindex="-1">${sec.title}</h1><small>${sec.subtitle || ''}</small></div></div>
          ${note ? `<div class="case-context"><span class="work-status">${note.status}</span><p>${note.proof}</p></div>` : ''}
          ${renderBlocks(sec.blocks)}
        </article><footer class="reader-footer"><a class="btn primary" href="#quick">← Back to selected work</a><a class="btn" href="mailto:${PROFILE.email}">Discuss my work ↗</a></footer>`;
    } else {
      q.innerHTML = `<header class="qhero">
        <div class="qhero-txt"><p class="eyebrow">AI SYSTEMS / ANALYTICS / PRODUCT DELIVERY</p>
          <h1 id="readerTitle" tabindex="-1">Mehul Gupta<span class="name-period">.</span></h1>
          <p class="qtag">${PROFILE.tagline}</p>
          <p class="qintro">From aerospace engineering to AI at NYU Stern. I connect evaluation, data quality and product decisions to the work of building useful software.</p>
          <p class="qstatus"><span class="status-dot"></span> Available Jan 2027 · Brooklyn, NY · Open to relocation</p>
          <div class="hero-links"><a class="btn primary" href="mailto:${PROFILE.email}">Let's talk ↗</a><a class="btn" href="${PROFILE.pdf}" download>Portfolio PDF ↓</a><a href="${PROFILE.linkedin}" target="_blank" rel="noopener">LinkedIn ↗</a><a href="${PROFILE.github}" target="_blank" rel="noopener">GitHub ↗</a></div>
        </div><div class="trainer-card" aria-hidden="true"><span>BUILDER PROFILE</span><img src="${iconURL('robot', 120)}" alt=""><b>MEHUL / NYC</b><small>Engineering roots.<br>Product mindset.</small></div>
      </header>
      <div class="proof-strip" aria-label="Selected experience"><div><b>NYU Stern</b><span>AI research & product work</span></div><div><b>2M+ records</b><span>Citi Bike analysis</span></div><div><b>Top 30</b><span>Ferrocampus 2025 · team project</span></div></div>
      <section class="selected-section" aria-labelledby="selectedTitle"><div class="section-heading"><div><p class="eyebrow">01 / SELECTED WORK</p><h2 id="selectedTitle">Built with a question in mind.</h2></div><p>Choose a lens. Explore the decisions behind the work.</p></div>
        <div class="work-filters" role="group" aria-label="Filter selected work">${WORK_TRACKS.map(t => `<button class="btn" data-track="${t.id}" aria-pressed="${t.id === this.quickTrack}">${t.name}</button>`).join('')}</div>
        <div id="workCards" class="work-grid">${this.workCards()}</div><p id="filterStatus" class="sr-only" role="status"></p>
      </section>
      <section class="background-grid" aria-label="Background and approach"><div><p class="eyebrow">02 / HOW I WORK</p><h2>Check the assumption.<br>Then build.</h2><p>Aerospace taught me to interrogate inputs. In AI, that means testing whether an evaluation measures correctness, whether a source answers the right question, and where users get stuck after launch.</p><a class="case-link" href="#q-home">More about me ↗</a></div><div class="experience-list"><p class="eyebrow">THE PATH SO FAR</p><p><b>AI Product Graduate Fellow · NYU Stern</b><span>Aug 2026–present · ROSI AI platform</span></p><p><b>Graduate Assistant · NYU Stern VRI</b><span>Jan–Jun 2026 · V-Lab AI assistant</span></p><p><b>MS Management of Technology · NYU</b><span>Dec 2026 · Government of India scholarship</span></p><p><b>BE Aerospace Engineering</b><span>Chandigarh University · 2024</span></p></div></section>
      <div class="archive-row">${this.sectionPicker()}<a class="case-link" href="#q-trophy">Awards & credentials ↗</a></div>
      <footer class="contact-card"><div><p class="eyebrow">03 / NEXT CHAPTER</p><h2>Let's build something useful.</h2><p>Seeking AI product, AI engineering and analytics roles.<br>Available January 2027 · F-1 OPT, STEM eligible.</p></div><a class="btn primary" href="mailto:${PROFILE.email}">${PROFILE.email} ↗</a></footer>
      <div class="qfoot"><p>Every landmark is a chapter. Every sprite is drawn in code.</p><button class="case-link" id="returnTown">Explore Mehul Town →</button></div>`;
      q.querySelectorAll('[data-track]').forEach(b => b.onclick = () => {
        this.quickTrack = b.dataset.track;
        q.querySelectorAll('[data-track]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
        $('#workCards').innerHTML = this.workCards();
        $('#filterStatus').textContent = `Showing three ${b.textContent} projects.`;
      });
      $('#returnTown').onclick = () => this.closeQuick();
    }
    $('#workSelect').onchange = e => { if (e.target.value) this.openQuick(e.target.value); };
    q.onclick = e => {
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.button !== 0) return;
      const a = e.target.closest('a[href^="#q-"] , a[href="#quick"]');
      if (a) { e.preventDefault(); this.openQuick(a.hash === '#quick' ? null : a.hash.slice(3)); }
    };
  },

  openQuick(sectionId, navigate = true) {
    const quick = $('#quick'), wasHidden = quick.hidden;
    if (wasHidden) {
      this.quickReturn = document.activeElement;
      this.quickIsolated = [...document.body.children].filter(el => el !== quick && !['SCRIPT', 'NOSCRIPT'].includes(el.tagName)).map(el => [el, el.inert]);
    }
    this.buildQuick(sectionId);
    quick.hidden = false;
    $('#readerTitle').focus({ preventScroll: true });
    this.quickIsolated.forEach(([el]) => { el.inert = true; });
    quick.scrollTop = 0;
    document.body.classList.add('reading');
    Audio8.reading(true);
    const hash = this.quickSection ? '#q-' + this.quickSection : '#quick';
    if (navigate && location.hash !== hash) history.pushState(null, '', hash);
    document.dispatchEvent(new Event('readingchange'));
  },
  closeQuick(navigate = true) {
    if ($('#quick').hidden) return;
    $('#quick').hidden = true;
    document.body.classList.remove('reading');
    this.quickIsolated.forEach(([el, inert]) => { el.inert = inert; });
    this.quickIsolated = [];
    const target = this.quickReturn?.isConnected && this.quickReturn.matches('button, a, input, select, [tabindex]') && this.quickReturn.getClientRects().length ? this.quickReturn : $('#btnQuick');
    target?.focus({ preventScroll: true });
    if (navigate) history.pushState(null, '', location.pathname + location.search);
    Audio8.reading(false);
    this.onClose && this.onClose();
    document.dispatchEvent(new Event('readingchange'));
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
