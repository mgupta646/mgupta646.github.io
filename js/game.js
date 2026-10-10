/* ==========================================================================
   GAME ENGINE: movement, pathfinding, NPCs, guided tour, discovery,
   rendering, input
   ========================================================================== */
(() => {
  "use strict";

  buildSprites();
  buildWorld();
  for (const o of World.objects) o.b = objBounds(o);

  const cv = $("#game"), ctx = cv.getContext("2d");
  const [buf, bctx] = makeCanvas(1, 1);
  const BP = new Px(bctx);
  const WORLD_W = MAP_W * T, WORLD_H = MAP_H * T;
  const TOTAL = SECTIONS.length;
  const SEC = Object.fromEntries(SECTIONS.map((s) => [s.id, s]));
  const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  const OPP = { up: "down", down: "up", left: "right", right: "left" };
  const isTouch = matchMedia("(pointer: coarse)").matches;
  const panelEl = $("#panel");

  let dpr = 1, scale = 3, VW = 320, VH = 240;
  const cam = { x: 0, y: 0 };
  let camFocus = null, shake = 0, started = false, flash = 0, pendingCelebrate = false;

  /* ---------- persistence ---------- */
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  };
  const found = new Set(store.get("mt_found", []).filter((id) => SEC[id]));
  let timeMode = store.get("mt_time", "auto");

  /* ---------- entities ---------- */
  const ent = (tx, ty, extra = {}) => ({ tx, ty, fx: tx, fy: ty, px: tx * T, py: ty * T, moving: false, prog: 0, dir: "down", step: 0, speed: 5, ...extra });
  const player = ent(World.spawn.x, World.spawn.y, { dir: "up", path: null, arrive: null, running: false, idle: 0 });
  const pet = ent(World.spawn.x, World.spawn.y + 1, { face: "R" });
  const GUIDE_HOME = { x: 29, y: 24 };
  const npcs = [
    ent(GUIDE_HOME.x, GUIDE_HOME.y, { id: "guide", name: "GUIDE", set: SPR.guide, lines: NPC_LINES.guide, solid: true }),
    ent(13, 27, { id: "jogger", name: "JOGGER", set: SPR.jogger, route: [[13, 27], [20, 27], [20, 34], [13, 34]], wp: 1, lines: NPC_LINES.jogger }),
    ent(39, 10, { id: "robot", name: "V-LAB BOT", section: "vlab", lo: 35, hi: 43, pdir: 1, wait: 1, blink: 0 }),
    ent(4, 8, { id: "cat", name: "CAT", lines: NPC_LINES.cat, solid: true }),
    ent(53, 19, { id: "pilot", name: "PILOT", set: SPR.pilot, lines: NPC_LINES.pilot, solid: true }),
    ent(21, 40, { id: "conductor", name: "CONDUCTOR", set: SPR.conductor, lines: NPC_LINES.conductor, solid: true, dir: "up" }),
  ];
  const npc = (id) => npcs.find((n) => n.id === id);
  const guide = npc("guide");

  const birds = [[24, 27], [25, 27.4], [40, 24.5], [41, 25], [13, 21.2], [53, 25.4], [20, 12.6], [45, 42.4], [8, 11.5]].map(([x, y], i) => ({
    hx: x * T + 4, hy: y * T + 8, x: x * T + 4, y: y * T + 8, st: "idle", t: Math.random() * 2, vx: 0, vy: 0, face: i % 2, hop: 0, re: 0,
  }));
  const flies = [[5, 8], [22, 27], [52, 8], [30, 43], [14, 17], [44, 13], [8, 43], [58, 21], [36, 33]].map(([x, y]) => ({ ax: x * T, ay: y * T, ph: Math.random() * 6 }));
  const clouds = [...Array(5)].map((_, i) => ({ x: (i / 5) * WORLD_W + Math.random() * 120, y: Math.random() * WORLD_H, s: 4 + Math.random() * 4, k: i % 2 }));
  const cloudSpr = [0, 1].map((k) => {
    const [c, x] = makeCanvas(140, 70);
    x.fillStyle = "#1a2850";
    const blobs = k ? [[40, 38, 26], [72, 30, 30], [104, 40, 22], [60, 46, 22]] : [[36, 36, 22], [64, 28, 26], [92, 36, 22], [112, 42, 14], [60, 44, 20]];
    for (let py = 0; py < 70; py += 2) for (let px = 0; px < 140; px += 2)
      if (blobs.some(([a, b, r]) => (px - a) ** 2 + (py - b) ** 2 < r * r)) x.fillRect(px, py, 2, 2);
    return c;
  });
  const parts = [];
  const rocket = { ry: 0, vy: 0, phase: "idle", t: 0, n: 3 };
  const station = World.objects.find((o) => o.id === "station");
  const TRAIN_LEN = 46 * 3 + 4;
  const train = { x: -40, v: 50, state: "run", wait: 0, stopped: false, stopX: (station.x + station.w / 2) * T };
  let clickMark = null, trail = [];

  /* ---------- helpers ---------- */
  const inb = (x, y) => x >= 0 && y >= 0 && x < MAP_W && y < MAP_H;
  const walkable = (x, y) => !isSolid(x, y) && !npcs.some((n) => n.solid && n.tx === x && n.ty === y);
  const cheb = (x, y, r) => Math.max(Math.max(r.x - x, 0, x - (r.x + r.w - 1)), Math.max(r.y - y, 0, y - (r.y + r.h - 1)));
  const zonesOf = (id) => {
    const z = (World.zones[id] || []).slice();
    if (id === "vlab") { const r = npc("robot"); z.push({ x: r.tx, y: r.ty, w: 1, h: 1 }); }
    return z;
  };
  const zoneCenter = (id) => { const z = World.zones[id][0]; return { x: z.x + z.w / 2, y: z.y + z.h / 2 }; };
  const night = () => {
    if (timeMode === "night") return 1;
    if (timeMode === "day") return 0;
    const h = new Date().getHours();
    return h >= 20 || h < 6 ? 1 : h >= 18 ? 0.5 : 0;
  };

  function moveStart(e, nx, ny, speed) {
    e.fx = e.tx; e.fy = e.ty; e.tx = nx; e.ty = ny; e.moving = true; e.prog = 0; e.speed = speed;
  }
  function moveUpdate(e, dt) {
    if (!e.moving) return false;
    e.prog = Math.min(1, e.prog + dt * e.speed);
    e.px = (e.fx + (e.tx - e.fx) * e.prog) * T;
    e.py = (e.fy + (e.ty - e.fy) * e.prog) * T;
    if (e.prog >= 1) { e.moving = false; e.step ^= 1; return true; }
    return false;
  }
  function place(e, x, y) { e.tx = e.fx = x; e.ty = e.fy = y; e.px = x * T; e.py = y * T; e.moving = false; }
  const dirTo = (fx, fy, tx, ty) => (tx > fx ? "right" : tx < fx ? "left" : ty > fy ? "down" : "up");

  /* ---------- pathfinding (BFS on the tile grid) ---------- */
  function bfs(goal) {
    const sx = player.tx, sy = player.ty;
    if (goal(sx, sy)) return [];
    const prev = new Int32Array(MAP_W * MAP_H).fill(-1);
    const q = [sx + sy * MAP_W]; prev[q[0]] = q[0];
    for (let qi = 0; qi < q.length; qi++) {
      const c = q[qi], cx = c % MAP_W, cy = (c / MAP_W) | 0;
      for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
        const nx = cx + dx, ny = cy + dy, n = nx + ny * MAP_W;
        if (!inb(nx, ny) || prev[n] !== -1 || !walkable(nx, ny)) continue;
        prev[n] = c;
        if (goal(nx, ny)) {
          const path = []; let k = n;
          while (k !== sx + sy * MAP_W) { path.unshift([k % MAP_W, (k / MAP_W) | 0]); k = prev[k]; }
          return path;
        }
        q.push(n);
      }
    }
    return null;
  }
  function followPath(path, arrive, run) {
    if (!path) { UI.toast("Can't get there from here!"); Audio8.play("bump"); return false; }
    player.path = path; player.arrive = arrive || null; player.running = run || path.length > 5;
    return true;
  }
  function goSection(id, opts = {}) {
    if (near === id) { dismissed = null; discover(id); openSection(id, true); opts.onArrive && opts.onArrive(); return true; }
    const zs = zonesOf(id);
    return followPath(bfs((x, y) => zs.some((r) => cheb(x, y, r) <= 1)), () => {
      const r = zs[0];
      player.dir = dirTo(player.tx, player.ty, Math.max(r.x, Math.min(player.tx, r.x + r.w - 1)), Math.max(r.y, Math.min(player.ty, r.y + r.h - 1)));
      checkNear(); dismissed = null; discover(id);
      if (UI.current !== id) openSection(id, true);
      opts.onArrive && opts.onArrive();
    }, opts.run);
  }
  function goNPC(n) {
    followPath(bfs((x, y) => Math.abs(x - n.tx) + Math.abs(y - n.ty) === 1), () => {
      player.dir = dirTo(player.tx, player.ty, n.tx, n.ty); talkTo(n);
    });
  }
  function goTile(tx, ty) {
    if (!inb(tx, ty)) return;
    const path = walkable(tx, ty) ? bfs((x, y) => x === tx && y === ty) : bfs((x, y) => Math.abs(x - tx) + Math.abs(y - ty) === 1);
    if (path) clickMark = { x: tx, y: ty, t: 0.6 };
    followPath(path);
  }

  /* ---------- player & followers ---------- */
  let bumpCD = 0;
  function tryStep(dir, run) {
    player.dir = dir;
    const [dx, dy] = DIRS[dir], nx = player.tx + dx, ny = player.ty + dy;
    if (!walkable(nx, ny)) {
      if (bumpCD <= 0) { Audio8.play("bump"); bumpCD = 0.3; }
      return false;
    }
    if (UI.current && !UI.auto) UI.closePanel("away");
    const sp = run ? 9 : 5.2;
    trail.unshift([player.tx, player.ty]); trail.length = Math.min(trail.length, 4);
    follow(pet, trail[0], sp, true);
    if (guide.follow && trail[1]) follow(guide, trail[1], sp, false);
    moveStart(player, nx, ny, sp);
    if (run && Math.random() < 0.5) puff(player.px + 8, player.py + 15, 2, ["#e8dcc0", "#d0c4a8"], { vy: -10, life: 0.35 });
    return true;
  }
  function follow(e, [ox, oy], speed, isPet) {
    if (e.moving) place(e, e.tx, e.ty);
    if (e.tx === ox && e.ty === oy) return;
    if (Math.abs(e.tx - ox) + Math.abs(e.ty - oy) > 1) { place(e, ox, oy); return; }
    if (isPet) { if (ox !== e.tx) e.face = ox > e.tx ? "R" : "L"; }
    else e.dir = dirTo(e.tx, e.ty, ox, oy);
    moveStart(e, ox, oy, speed);
  }
  function currentKeyDir() {
    for (let i = keyOrder.length - 1; i >= 0; i--) if (keys.has(keyOrder[i])) return KEYMAP[keyOrder[i]];
    return touchDir;
  }
  function updatePlayer(dt) {
    if (player.moving) {
      if (!moveUpdate(player, dt)) return;
      onArrive();
    }
    if (blocked()) { player.idle += dt; return; }
    const kd = currentKeyDir();
    const run = runHeld || keys.has("ShiftLeft") || keys.has("ShiftRight");
    if (kd) { player.path = null; player.arrive = null; player.idle = 0; tryStep(kd, run); return; }
    if (player.path && player.path.length) {
      const [nx, ny] = player.path.shift(); player.idle = 0;
      if (!tryStep(dirTo(player.tx, player.ty, nx, ny), player.running || run)) { player.path = null; player.arrive = null; }
      return;
    }
    if (player.arrive) { const f = player.arrive; player.arrive = null; f(); }
    player.idle += dt;
  }
  function onArrive() {
    if (World.ground[player.ty][player.tx] === "Y") {
      Audio8.play("rustle");
      puff(player.px + 8, player.py + 12, 4, [C.tallL, C.tall], { vy: -30, spread: 30, life: 0.45, g: 60 });
    }
    checkNear();
  }

  /* ---------- proximity: panels open as you arrive, close as you leave ---------- */
  let near = null, dismissed = null;
  function nearestSection(x, y) {
    let best = null, bd = 2, ba = 1e9;
    for (const [id, rects] of Object.entries(World.zones)) for (const r of rects) {
      const d = cheb(x, y, r), a = r.w * r.h;
      if (d <= 1 && (d < bd || (d === bd && a < ba))) { best = id; bd = d; ba = a; }
    }
    const rb = npc("robot");
    if (Math.max(Math.abs(rb.tx - x), Math.abs(rb.ty - y)) <= 1) best = "vlab";
    if (!best) { const s = World.objects.find((o) => o.npc === "sign"); if (cheb(x, y, s) <= 1) best = "sign"; }
    return best;
  }
  function checkNear() {
    const n = nearestSection(player.tx, player.ty);
    if (n === near) return;
    near = n; dismissed = null;
    if (dlg.mode === "auto") hideDialog();
    if (n && n !== "sign") {
      if (n === "vlab") Audio8.play("beep");
      discover(n);
      // during a tour, only the tour's own stop opens on arrival
      if (!(tour.state === "active" && tour.walking && n !== tour.current)) openSection(n, true);
      return;
    }
    if (UI.current) UI.closePanel("away");
    if (n === "sign") showAuto("SIGN", NPC_LINES.sign.join(" "), null);
  }
  function discover(id) {
    if (found.has(id)) return;
    found.add(id); store.set("mt_found", [...found]);
    Audio8.play("discover");
    const L = World.labels[id];
    burst(L.x, L.y, 18, ["#f8d048", "#ffffff", "#ff9ad8", "#8cdcff"]);
    UI.toast(`<span class="new">★ NEW!</span> ${SEC[id].title}<br><small>${found.size} / ${TOTAL} discovered</small>`);
    updateHUD();
    if (found.size === TOTAL) { if (tour.state === "active") pendingCelebrate = true; else setTimeout(celebrate, 1400); }
  }
  function celebrate() {
    pendingCelebrate = false;
    Audio8.play("fanfare");
    for (let i = 0; i < 140; i++) parts.push({ x: cam.x + Math.random() * VW, y: cam.y - Math.random() * 60, vx: (Math.random() - .5) * 40, vy: 30 + Math.random() * 50, g: 20, life: 3 + Math.random() * 2, max: 5, s: 2, c: ["#f8d048", "#ff6a8a", "#8cdcff", "#a8e848", "#c896ff"][i % 5], spin: true });
    hideDialog();
    talk("GUIDE", NPC_LINES.done, () => { UI.toast("Quest complete! ★ The Portfolio PDF is in the MENU.", 3500); });
  }

  /* ---------- dialog ---------- */
  const dlg = { mode: null, name: "", lines: [], i: 0, full: "", shown: 0, section: null, onDone: null, blipN: 0 };
  const dEl = $("#dialog"), dName = $("#dlgName"), dText = $("#dlgText"), dHint = $("#dlgHint");
  function setLine(s) { dlg.full = s; dlg.shown = 0; dlg.blipN = 0; dText.textContent = ""; }
  function showAuto(name, text, section) {
    dlg.mode = "auto"; dlg.section = section; dlg.name = name;
    dName.textContent = name; setLine(text); dHint.innerHTML = "";
    if (!UI.anyOverlay()) dEl.hidden = false;
  }
  function talk(name, lines, onDone) {
    dlg.mode = "talk"; dlg.lines = lines; dlg.i = 0; dlg.onDone = onDone || null; dlg.section = null; dlg.name = name;
    dName.textContent = name; setLine(lines[0]);
    dHint.innerHTML = `<span class="arrow">▼</span>`;
    dEl.hidden = false; player.path = null; player.arrive = null;
  }
  function hideDialog() { dlg.mode = null; dEl.hidden = true; }
  function advance() {
    if (dlg.shown < dlg.full.length) { dlg.shown = dlg.full.length; dText.textContent = dlg.full; return; }
    if (dlg.mode === "auto") { if (dlg.section) openSection(dlg.section); return; }
    if (dlg.mode === "talk") {
      Audio8.play("blip");
      if (++dlg.i < dlg.lines.length) setLine(dlg.lines[dlg.i]);
      else { const f = dlg.onDone; hideDialog(); near = null; checkNear(); f && f(); }
    }
  }
  function updateDialog(dt) {
    if (!dlg.mode || dlg.shown >= dlg.full.length) return;
    const before = Math.floor(dlg.shown);
    dlg.shown = Math.min(dlg.full.length, dlg.shown + dt * 55);
    const now = Math.floor(dlg.shown);
    if (now !== before) {
      dText.textContent = dlg.full.slice(0, now);
      if (now - dlg.blipN >= 3) { dlg.blipN = now; Audio8.play("blip"); }
    }
  }
  dEl.addEventListener("click", () => advance());

  function openSection(id, auto = false) {
    if (!SEC[id]) return;
    if (UI.current === id && !panelEl.hidden) return;
    if (dlg.mode === "auto") hideDialog();
    Audio8.play("open"); Audio8.duck(true);
    UI.openPanel(id, auto);
  }
  function talkTo(n) {
    if (n.section) { openSection(n.section); return; }
    n.dir = OPP[player.dir];
    if (n.id === "cat") Audio8.play("meow");
    if (n.id === "guide") {
      if (tour.state === "active") { talk("GUIDE", ["Lead the way, or press NEXT STOP and I'll take you there!"]); return; }
      talk("GUIDE", NPC_LINES.guideIdle, () => openPlanner(tour.state === "paused" ? "resume" : "new"));
      return;
    }
    talk(n.name, n.lines);
  }
  function petBark() {
    Audio8.play("bark");
    hearts(pet.px + 8, pet.py);
    talk("BYTE", NPC_LINES.dog);
  }

  /* ==========================================================================
     GUIDED TOUR
     ========================================================================== */
  const tour = { state: "idle", queue: [], plan: [], current: null, walking: false, done: new Set(), firstPick: null, sel: new Set() };
  const tourBtn = $("#tourBtn"), tourBar = $("#tourBar");

  function setTourBtn() {
    const lbl = tourBtn.querySelector(".tb-label"), sub = tourBtn.querySelector(".tb-sub"), ic = tourBtn.querySelector(".tb-icon");
    tourBtn.classList.toggle("active", tour.state === "active");
    tourBtn.classList.toggle("pulse", tour.state === "paused" || (tour.state === "idle" && found.size < 3));
    if (tour.state === "active") { ic.textContent = "■"; lbl.textContent = "END"; sub.textContent = "TOUR"; }
    else if (tour.state === "paused") { ic.textContent = "▶"; lbl.textContent = "RESUME"; sub.textContent = "TOUR"; }
    else { ic.textContent = "▶"; lbl.textContent = "TOUR"; sub.textContent = "GUIDED"; }
    document.body.classList.toggle("touring", tour.state === "active");
  }
  function presetIds(p) {
    if (p.all) return SECTIONS.map((s) => s.id);
    if (p.ids) return p.ids.slice();
    return SECTIONS.filter((s) => p.cats.includes(s.cat)).map((s) => s.id);
  }
  let guideIcon = null;
  function openPlanner(mode) {
    hideDialog();
    const resume = mode === "resume";
    if (!guideIcon) { const [c, x] = makeCanvas(64, 80); x.imageSmoothingEnabled = false; x.drawImage(SPR.guide.down, 0, 0, 64, 80); guideIcon = c.toDataURL(); }
    $("#tpGuide").src = guideIcon;
    $("#tpSay").textContent = resume
      ? "Welcome back! What would you like to see next? Tap ★ FIRST on any stop to go there first."
      : "Hi! I'm your guide. Pick what you'd like to see and I'll walk you there. Move on your own anytime to pause the tour.";
    tour.sel = new Set(resume && tour.plan.length ? tour.plan.filter((id) => !tour.done.has(id)) : presetIds(TOUR_PRESETS[0]));
    if (resume && !tour.sel.size) tour.sel = new Set(SECTIONS.map((s) => s.id).filter((id) => !found.has(id)));
    tour.firstPick = null;
    $("#tpPresets").innerHTML = TOUR_PRESETS.map((p, i) => `<button data-p="${i}" class="${!resume && i === 0 ? "on" : ""}">${p.name}</button>`).join("");
    renderPlannerList();
    $("#tpGo").textContent = resume ? "▶ RESUME TOUR" : "▶ START TOUR";
    $("#tourPlanner").hidden = false; Audio8.play("open");
    keys.clear(); touchDir = null;
  }
  function renderPlannerList() {
    $("#tpList").innerHTML = CATEGORIES.map((c) => {
      const items = SECTIONS.filter((s) => s.cat === c.id);
      return `<div class="tp-cat"><span>${c.name}</span><button data-cat="${c.id}">toggle all</button></div>` + items.map((s) => `
        <label class="tp-item${found.has(s.id) ? " seen" : ""}" data-id="${s.id}">
          <input type="checkbox" ${tour.sel.has(s.id) ? "checked" : ""}>
          <img src="${iconURL(s.icon, 28)}" alt="">
          <span class="tpi-t">${s.title}<small>${s.subtitle.split(" · ")[0]}</small></span>
          <button class="first${tour.firstPick === s.id ? " on" : ""}" data-first="${s.id}" title="Visit this first">★ FIRST</button>
        </label>`).join("");
    }).join("");
    updatePlannerMeta();
  }
  function updatePlannerMeta() {
    const n = tour.sel.size;
    $("#tpMeta").textContent = n ? `${n} stop${n > 1 ? "s" : ""} · about ${Math.max(1, Math.round(n * 0.6))} min` : "Pick at least one stop";
    $("#tpGo").disabled = !n;
  }
  $("#tpPresets").addEventListener("click", (e) => {
    const b = e.target.closest("[data-p]"); if (!b) return;
    $("#tpPresets").querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b));
    tour.sel = new Set(presetIds(TOUR_PRESETS[+b.dataset.p])); tour.firstPick = null;
    Audio8.play("select"); renderPlannerList();
  });
  $("#tpList").addEventListener("click", (e) => {
    const first = e.target.closest("[data-first]");
    if (first) {
      e.preventDefault();
      const id = first.dataset.first;
      tour.firstPick = tour.firstPick === id ? null : id;
      if (tour.firstPick) tour.sel.add(id);
      Audio8.play("select"); renderPlannerList(); return;
    }
    const cat = e.target.closest("[data-cat]");
    if (cat) {
      const ids = SECTIONS.filter((s) => s.cat === cat.dataset.cat).map((s) => s.id);
      const allOn = ids.every((id) => tour.sel.has(id));
      ids.forEach((id) => allOn ? tour.sel.delete(id) : tour.sel.add(id));
      $("#tpPresets").querySelectorAll("button").forEach((x) => x.classList.remove("on"));
      Audio8.play("select"); renderPlannerList();
    }
  });
  $("#tpList").addEventListener("change", (e) => {
    const item = e.target.closest("[data-id]"); if (!item) return;
    const id = item.dataset.id;
    e.target.checked ? tour.sel.add(id) : tour.sel.delete(id);
    if (!e.target.checked && tour.firstPick === id) { tour.firstPick = null; renderPlannerList(); }
    $("#tpPresets").querySelectorAll("button").forEach((x) => x.classList.remove("on"));
    updatePlannerMeta();
  });
  $("#tpSkip").onclick = () => closePlanner(true);
  $("#tpGo").onclick = () => { if (tour.sel.size) startTour([...tour.sel], tour.firstPick); };
  $("#tourPlanner").addEventListener("click", (e) => { if (e.target.id === "tourPlanner") closePlanner(true); });
  function closePlanner(explore) {
    $("#tourPlanner").hidden = true; Audio8.play("close");
    if (explore && tour.state === "idle") UI.toast("Explore away! The red TOUR button on the left is there whenever you want me.", 3200);
  }

  /* route: greedy nearest-neighbour, then 2-opt to remove backtracking.
     The mailbox (contact) always comes last so every tour ends on a call to action. */
  function orderStops(ids, first) {
    const endWithContact = ids.includes("contact") && first !== "contact" && ids.length > 1;
    const left = ids.filter((id) => id !== first && !(endWithContact && id === "contact"));
    const out = first ? [first] : [];
    let cur = first ? zoneCenter(first) : { x: player.tx, y: player.ty };
    while (left.length) {
      let bi = 0, bd = 1e9;
      left.forEach((id, i) => { const c = zoneCenter(id), d = Math.abs(c.x - cur.x) + Math.abs(c.y - cur.y); if (d < bd) { bd = d; bi = i; } });
      const [id] = left.splice(bi, 1); out.push(id); cur = zoneCenter(id);
    }
    const start = { x: player.tx, y: player.ty }, tail = endWithContact ? zoneCenter("contact") : null;
    const pt = (i) => (i < 0 ? start : i >= out.length ? tail : zoneCenter(out[i]));
    const dist = (a, b) => (!a || !b ? 0 : Math.abs(a.x - b.x) + Math.abs(a.y - b.y));
    for (let pass = 0, improved = true; improved && pass < 40; pass++) {
      improved = false;
      for (let i = first ? 1 : 0; i < out.length - 1; i++)
        for (let k = i + 1; k < out.length; k++) {
          const delta = dist(pt(i - 1), pt(k)) + dist(pt(i), pt(k + 1)) - dist(pt(i - 1), pt(i)) - dist(pt(k), pt(k + 1));
          if (delta < -0.01) { out.splice(i, k - i + 1, ...out.slice(i, k + 1).reverse()); improved = true; }
        }
    }
    if (endWithContact) out.push("contact");
    return out;
  }
  function startTour(ids, first) {
    $("#tourPlanner").hidden = true;
    const resuming = tour.state === "paused";
    if (!resuming) tour.done = new Set();
    const fresh = orderStops(ids.filter((id) => !tour.done.has(id)), first);
    tour.plan = (resuming ? tour.plan.filter((id) => tour.done.has(id)) : []).concat(fresh);
    tour.queue = fresh.slice();
    tour.current = null;
    tour.state = "active"; setTourBtn(); Audio8.play("tour");
    guideJoin();
    tourBar.hidden = false;
    nextStop();
  }
  function nextStop() {
    if (tour.state !== "active") return;
    const id = tour.queue.shift();
    if (!id) { finishTour(); return; }
    tour.current = id; tour.walking = true;
    renderBar(`On our way to <b>${SEC[id].title}</b>…`);
    if (UI.current && UI.current !== id) UI.closePanel("away");
    const ok = goSection(id, { run: true, onArrive: () => {
      tour.walking = false; tour.done.add(id);
      guideFace();
      renderBar(SEC[id].blurb);
    } });
    if (!ok) { tour.walking = false; tour.done.add(id); nextStop(); }
  }
  function renderBar(html) {
    const total = tour.plan.length, idx = tour.plan.indexOf(tour.current) + 1;
    $("#tbStep").textContent = `TOUR · STOP ${idx} / ${total}`;
    $("#tbDots").innerHTML = tour.plan.map((id) => `<i class="${id === tour.current ? "now" : tour.done.has(id) ? "done" : ""}" title="${SEC[id].title}"></i>`).join("");
    $("#tbText").innerHTML = html;
    $("#tbNext").textContent = tour.queue.length ? "NEXT STOP ▶" : "FINISH ★";
  }
  function pauseTour() {
    if (tour.state !== "active") return;
    tour.state = "paused";
    if (tour.walking && tour.current) { tour.queue.unshift(tour.current); tour.walking = false; }
    player.path = null; player.arrive = null;
    tourBar.hidden = true; setTourBtn();
    UI.toast("Tour paused. Press <b>RESUME</b> on the left whenever you like.", 2600);
  }
  function finishTour() {
    tour.state = "idle"; tour.current = null; tourBar.hidden = true; setTourBtn();
    Audio8.play("fanfare");
    talk("GUIDE", ["That's the tour! Thanks for walking around with me.", "Explore freely, or visit the MAILBOX to get in touch with Mehul."], () => { guideLeave(); if (pendingCelebrate) setTimeout(celebrate, 600); });
  }
  function endTour() {
    if (tour.state === "idle") return;
    tour.state = "idle"; tour.current = null; tour.plan = []; tour.queue = [];
    player.path = null; player.arrive = null; tourBar.hidden = true; setTourBtn();
    UI.toast("Tour ended. Happy exploring!"); guideLeave();
    if (pendingCelebrate) setTimeout(celebrate, 800);
  }
  function guideJoin() {
    guide.follow = true; guide.solid = false;
    const spot = trail[1] || trail[0] || [pet.tx, pet.ty];
    if (Math.abs(guide.tx - player.tx) + Math.abs(guide.ty - player.ty) > 3) {
      puff(guide.px + 8, guide.py + 8, 10, ["#ffffff", "#e8e0ff"], { spread: 20, life: 0.5 });
      place(guide, spot[0], spot[1]);
      puff(guide.px + 8, guide.py + 8, 10, ["#ffffff", "#e8e0ff"], { spread: 20, life: 0.5 });
    }
  }
  function guideLeave() {
    guide.follow = false;
    puff(guide.px + 8, guide.py + 8, 10, ["#ffffff", "#e8e0ff"], { spread: 20, life: 0.5 });
    const busy = (x, y) => (player.tx === x && player.ty === y) || (pet.tx === x && pet.ty === y);
    place(guide, busy(GUIDE_HOME.x, GUIDE_HOME.y) ? GUIDE_HOME.x - 1 : GUIDE_HOME.x, GUIDE_HOME.y); guide.dir = "down"; guide.solid = true;
  }
  function guideFace() { if (guide.follow && !guide.moving) guide.dir = dirTo(guide.tx, guide.ty, player.tx, player.ty); }
  function onTourButton() {
    Audio8.unlock();
    if (!started) return;
    if (tour.state === "active") endTour();
    else openPlanner(tour.state === "paused" ? "resume" : "new");
  }
  tourBtn.onclick = onTourButton;
  $("#tbNext").onclick = () => { Audio8.play("select"); nextStop(); };
  $("#tbEnd").onclick = () => endTour();
  const userTookControl = () => { if (tour.state === "active") pauseTour(); };

  /* ---------- particles ---------- */
  function puff(x, y, n, cols, o = {}) {
    for (let i = 0; i < n; i++) parts.push({ x: x + (Math.random() - .5) * (o.spread || 6), y, vx: (Math.random() - .5) * (o.spread || 20), vy: (o.vy || -15) * (0.5 + Math.random()), g: o.g || 0, life: o.life || 0.5, max: o.life || 0.5, s: o.s || 1, c: cols[i % cols.length] });
  }
  function burst(x, y, n, cols) {
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; parts.push({ x, y, vx: Math.cos(a) * 50, vy: Math.sin(a) * 50 - 20, g: 60, life: 0.9, max: 0.9, s: 2, c: cols[i % cols.length] }); }
  }
  function hearts(x, y) { parts.push({ x, y: y - 2, vx: 0, vy: -18, g: 0, life: 1.2, max: 1.2, heart: true }); }
  function textPart(x, y, str, c) { parts.push({ x, y, vx: 0, vy: -10, g: 0, life: 1, max: 1, text: str, c }); }

  /* ---------- world updates ---------- */
  let smokeT = 0;
  function updateWorld(dt) {
    // jogger loops the track
    const j = npc("jogger");
    if (!(dlg.mode === "talk" && dlg.name === "JOGGER")) {
      if (j.moving) moveUpdate(j, dt);
      else {
        const [wx, wy] = j.route[j.wp];
        if (j.tx === wx && j.ty === wy) j.wp = (j.wp + 1) % j.route.length;
        else {
          const d = dirTo(j.tx, j.ty, wx, wy), [dx, dy] = DIRS[d];
          j.dir = d;
          const nx = j.tx + dx, ny = j.ty + dy;
          if (!(player.tx === nx && player.ty === ny) && !(pet.tx === nx && pet.ty === ny)) moveStart(j, nx, ny, 3.6);
        }
      }
    }
    // robot patrols in front of the AI lab
    const r = npc("robot");
    r.blink -= dt; if (r.blink < -3 - Math.random() * 2) r.blink = 0.15;
    if (r.moving) moveUpdate(r, dt);
    else {
      const close = Math.max(Math.abs(r.tx - player.tx), Math.abs(r.ty - player.ty)) <= 3;
      if (close) r.dir = player.tx < r.tx ? "left" : "right";
      else if ((r.wait -= dt) <= 0) {
        let nx = r.tx + r.pdir;
        if (nx < r.lo || nx > r.hi) { r.pdir *= -1; nx = r.tx + r.pdir; }
        if (!(player.tx === nx && player.ty === r.ty)) moveStart(r, nx, r.ty, 2.2);
        r.wait = 0.6 + Math.random() * 1.2;
      }
    }
    // guide: follows during a tour, watches you otherwise
    if (guide.moving) moveUpdate(guide, dt);
    else if (guide.follow) { if (!player.moving) guideFace(); }
    else if (!dlg.mode && Math.abs(guide.tx - player.tx) + Math.abs(guide.ty - player.ty) <= 3) guide.dir = player.ty < guide.ty ? "up" : player.ty > guide.ty ? "down" : player.tx < guide.tx ? "left" : "right";
    for (const id of ["pilot", "conductor"]) {
      const n = npc(id);
      if (!dlg.mode && Math.abs(n.tx - player.tx) + Math.abs(n.ty - player.ty) <= 2) n.dir = dirTo(n.tx, n.ty, player.tx, player.ty);
    }
    if (pet.moving) moveUpdate(pet, dt);
    // birds
    for (const b of birds) {
      const dx = player.px + 8 - b.x, dy = player.py + 10 - b.y, dist = Math.hypot(dx, dy);
      if (b.st === "idle") {
        b.hop = Math.max(0, b.hop - dt * 8);
        if ((b.t -= dt) < 0) { b.t = 1 + Math.random() * 2.5; b.hop = 1; if (Math.random() < 0.4) b.face ^= 1; }
        if (dist < 34 && started) { b.st = "fly"; b.vx = (dx > 0 ? -1 : 1) * (55 + Math.random() * 30); b.vy = -55; b.face = b.vx > 0 ? 0 : 1; b.t = 0; }
      } else if (b.st === "fly") {
        b.t += dt; b.x += b.vx * dt; b.y += b.vy * dt; b.vy -= 25 * dt;
        if (b.t > 4) { b.st = "gone"; b.re = 10 + Math.random() * 10; }
      } else if ((b.re -= dt) <= 0 && Math.hypot(player.px - b.hx, player.py - b.hy) > 140) {
        b.st = "idle"; b.x = b.hx; b.y = b.hy;
      }
    }
    // clouds drift east
    for (const c of clouds) { c.x += c.s * dt; if (c.x > WORLD_W + 20) { c.x = -160; c.y = Math.random() * WORLD_H; } }
    // ambient particles: landmark sparkles, trophy glints, chimney smoke, crystal ball
    if (Math.random() < dt * 6) {
      const ids = Object.keys(World.labels).filter((id) => !found.has(id));
      if (ids.length) {
        const L = World.labels[ids[(Math.random() * ids.length) | 0]];
        parts.push({ x: L.x + (Math.random() - .5) * 40, y: L.y + 8 + Math.random() * 24, vx: 0, vy: -6, g: 0, life: 0.7, max: 0.7, star: true });
      }
    }
    for (const o of World.objects) {
      if (o.sparkle && Math.random() < dt * 3) parts.push({ x: o.b.x + 4 + Math.random() * 40, y: o.b.y + 6 + Math.random() * 30, vx: 0, vy: 0, g: 0, life: 0.5, max: 0.5, star: true });
      if (o.glow && Math.random() < dt * 4) parts.push({ x: o.b.x + 20 + Math.random() * 12, y: o.b.y + 44 + Math.random() * 10, vx: 0, vy: -8, g: 0, life: 0.7, max: 0.7, star: true });
    }
    if ((smokeT -= dt) <= 0) {
      smokeT = 0.45;
      for (const o of World.objects) if (o.smoke) parts.push({ x: o.b.x + 62, y: o.b.y + 1, vx: 4 + Math.random() * 3, vy: -10, g: -2, life: 2.4, max: 2.4, s: 2 + (Math.random() < 0.5 ? 1 : 0), c: "#e8e8f0", smoke: true });
    }
    updateTrain(dt);
  }

  /* ---------- train ---------- */
  function updateTrain(dt) {
    const tr = train;
    if (tr.state === "wait") {
      if ((tr.wait -= dt) <= 0) { tr.state = "run"; tr.x = -40; tr.v = 55; tr.stopped = false; }
      return;
    }
    if (tr.state === "stop") {
      if ((tr.wait -= dt) <= 0) { tr.state = "run"; tr.stopped = true; tr.v = 6; if (nearTrain()) Audio8.play("horn"); }
      return;
    }
    const centre = tr.x - TRAIN_LEN / 2, d = tr.stopX - centre;
    if (!tr.stopped && d > 0 && d < 100) tr.v = Math.max(9, 55 * (d / 100));
    else if (!tr.stopped && d <= 0) { tr.state = "stop"; tr.wait = 3.5; tr.v = 0; if (nearTrain()) Audio8.play("horn"); return; }
    else tr.v = Math.min(55, tr.v + 30 * dt);
    tr.x += tr.v * dt;
    if (tr.x - TRAIN_LEN > WORLD_W + 30) { tr.state = "wait"; tr.wait = 7 + Math.random() * 8; }
  }
  const nearTrain = () => started && Math.abs(player.py - World.railY * T) < 180 && Math.abs(player.px - (train.x - TRAIN_LEN / 2)) < 260;

  /* ---------- rocket launch easter egg ---------- */
  const rocketObj = World.objects.find((o) => o.rocket);
  function launchRocket() {
    if (rocket.phase !== "idle") return;
    rocket.phase = "count"; rocket.t = 0; rocket.n = 3;
    camFocus = { x: rocketObj.b.x + 24, y: rocketObj.b.y + 30 };
    Audio8.play("beep"); textPart(rocketObj.b.x + 28, rocketObj.b.y - 6, "3", "#ffffff");
  }
  function updateRocket(dt) {
    const R = rocket, b = rocketObj.b;
    if (R.phase === "idle") return;
    R.t += dt;
    if (R.phase === "count") {
      if (R.t > 1) {
        R.t = 0; R.n--;
        if (R.n > 0) { Audio8.play("beep"); textPart(b.x + 28, b.y - 6, String(R.n), "#ffffff"); }
        else { R.phase = "fly"; R.vy = -10; Audio8.play("launch"); shake = 1.6; textPart(b.x + 28, b.y - 6, "LIFTOFF!", "#f8d048"); }
      }
    } else if (R.phase === "fly") {
      R.vy -= 130 * dt; R.ry += R.vy * dt;
      puff(b.x + 28, b.y + 74 + R.ry, 3, ["#f0f0f0", "#c8c8d0", "#a0a0a8"], { vy: 25, spread: 30, life: 1.2, s: 2 });
      if (camFocus) camFocus.y = Math.max(b.y + 30 + R.ry * 0.6, b.y - 120);
      if (R.ry < -700) { R.phase = "gone"; R.t = 0; camFocus = null; }
    } else if (R.phase === "gone") {
      if (R.t > 2.5) { R.phase = "land"; R.t = 0; }
    } else if (R.phase === "land") {
      const k = Math.min(1, R.t / 2.6);
      R.ry = -260 * Math.pow(1 - k, 2.2);
      if (Math.random() < 0.6) puff(b.x + 28, b.y + 74 + R.ry, 2, ["#f8d048", "#ff8a3a"], { vy: 40, spread: 10, life: 0.3 });
      if (k >= 1) { R.phase = "idle"; R.ry = 0; puff(b.x + 28, b.y + 74, 14, ["#e0e0e0", "#c0c0c8"], { vy: -10, spread: 60, life: 0.8, s: 2 }); UI.toast("Booster landed back on the pad! 🚀"); }
    }
  }

  /* ---------- camera ---------- */
  let attractT = 0;
  function updateCamera(dt) {
    let tx, ty;
    if (!started) {
      attractT += dt;
      tx = (WORLD_W - VW) / 2 + Math.sin(attractT * 0.07) * (WORLD_W - VW) / 2;
      ty = (WORLD_H - VH) / 2 + Math.sin(attractT * 0.1 + 1) * (WORLD_H - VH) / 2;
    } else if (camFocus) { tx = camFocus.x - VW / 2; ty = camFocus.y - VH / 2; }
    else {
      let vw = VW, vh = VH;
      if (!panelEl.hidden) {
        const r = panelEl.firstElementChild.getBoundingClientRect();
        if (r.left > innerWidth * 0.35) vw = Math.max(80, (r.left * dpr) / scale);
        else if (r.top > innerHeight * 0.25) vh = Math.max(80, (r.top * dpr) / scale);
      }
      tx = player.px + 8 - vw / 2; ty = player.py + 4 - vh / 2;
    }
    tx = VW >= WORLD_W ? (WORLD_W - VW) / 2 : Math.max(0, Math.min(WORLD_W - VW, tx));
    ty = VH >= WORLD_H ? (WORLD_H - VH) / 2 : Math.max(0, Math.min(WORLD_H - VH, ty));
    const k = !started ? 1 : camFocus ? Math.min(1, dt * 4) : Math.min(1, dt * 10);
    cam.x += (tx - cam.x) * k; cam.y += (ty - cam.y) * k;
  }

  /* ---------- rendering ---------- */
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 3);
    const cw = Math.max(64, Math.floor(innerWidth * dpr)), ch = Math.max(64, Math.floor(innerHeight * dpr));
    cv.width = cw; cv.height = ch;
    const across = innerWidth < 720 ? 12 : 22;
    scale = Math.max(2, Math.round(Math.min(cw / (T * across), ch / (T * across * 0.62))));
    VW = Math.ceil(cw / scale); VH = Math.ceil(ch / scale);
    buf.width = VW; buf.height = VH;
    bctx.imageSmoothingEnabled = false; ctx.imageSmoothingEnabled = false;
  }

  function drawChar(set, e, walking) {
    const img = charFrame(set, e.dir, walking, e.step);
    bctx.fillStyle = "rgba(0,0,0,.2)"; bctx.fillRect(Math.round(e.px - cam.x) + 3, Math.round(e.py - cam.y) + 13, 10, 3);
    bctx.drawImage(img, Math.round(e.px - cam.x), Math.round(e.py - cam.y) - 4);
  }
  const walkPose = (e) => e.moving && e.prog > 0.2 && e.prog < 0.8;
  function inView(x, y, w, h) { return x + w > cam.x - 8 && x < cam.x + VW + 8 && y + h > cam.y - 8 && y < cam.y + VH + 8; }

  function render(t) {
    const cx = Math.round(cam.x), cy = Math.round(cam.y);
    const nt = night(), flip = Math.abs(Math.floor(t / 0.6)) % 2;
    bctx.fillStyle = "#1c4424"; bctx.fillRect(0, 0, VW, VH);
    bctx.drawImage(World.groundCanvas[flip], -cx, -cy);

    // water sparkles
    for (const [wx, wy] of World.water) {
      if (!inView(wx * T, wy * T, T, T)) continue;
      if (Math.sin(t * 1.9 + hash(wx, wy, 500) * 40) > 0.93) {
        const X = wx * T - cx + 3 + ((hash(wx, wy, 501) * 9) | 0), Y = wy * T - cy + 3 + ((hash(wx, wy, 502) * 9) | 0);
        BP.p(X, Y, "#ffffff"); BP.p(X - 1, Y, C.waterL); BP.p(X + 1, Y, C.waterL); BP.p(X, Y - 1, C.waterL); BP.p(X, Y + 1, C.waterL);
      }
    }

    // click marker: four closing corner brackets
    if (clickMark) {
      const m = clickMark, X = m.x * T - cx, Y = m.y * T - cy, o = Math.round((0.6 - m.t) * 6);
      BP.r(X - o, Y - o, 4, 1, "#ffffff"); BP.r(X - o, Y - o, 1, 4, "#ffffff");
      BP.r(X + 12 + o, Y - o, 4, 1, "#ffffff"); BP.r(X + 15 + o, Y - o, 1, 4, "#ffffff");
      BP.r(X - o, Y + 15 + o, 4, 1, "#ffffff"); BP.r(X - o, Y + 12 + o, 1, 4, "#ffffff");
      BP.r(X + 12 + o, Y + 15 + o, 4, 1, "#ffffff"); BP.r(X + 15 + o, Y + 12 + o, 1, 4, "#ffffff");
    }

    const list = [];
    for (const tr of World.trees) {
      const img = SPR.tree[tr.v], X = tr.x * T + ((T - img.width) >> 1), Y = (tr.y + 1) * T - img.height;
      if (inView(X, Y, img.width, img.height)) list.push({ y: (tr.y + 1) * T, d: () => bctx.drawImage(img, X - cx, Y - cy) });
    }
    for (const bt of World.bigTrees) {
      const img = SPR.bigTree[bt.v], X = bt.x * T, Y = (bt.y + 1) * T - img.height;
      if (inView(X, Y, img.width, img.height)) list.push({ y: (bt.y + 1) * T, d: () => bctx.drawImage(img, X - cx, Y - cy) });
    }
    for (const o of World.objects) {
      const b = o.b;
      if (!inView(b.x, b.y - 30, b.w, b.h + 30) && !(o.rocket && rocket.phase !== "idle")) continue;
      list.push({ y: (o.y + o.h) * T, d: () => drawObj(o, b, cx, cy, t, nt) });
    }
    // train
    if (train.state !== "wait" && inView(train.x - TRAIN_LEN, World.railY * T - 16, TRAIN_LEN, 32)) {
      list.push({ y: (World.railY + 1) * T - 0.5, d: () => {
        const Y = World.railY * T - 13 - cy, rock = train.v > 1 ? Math.floor(t * 12) % 2 : 0;
        [SPR.trainEngine, SPR.trainCar, SPR.trainCar].forEach((img, i) => bctx.drawImage(img, Math.round(train.x - 46 - i * 48 - cx), Y + (i === 0 ? 0 : rock)));
      } });
    }
    for (const n of npcs) {
      if (!inView(n.px, n.py - 8, T, 24)) continue;
      list.push({ y: n.py + T + 0.1, d: () => {
        if (n.id === "robot") {
          const X = Math.round(n.px - cx), Y = Math.round(n.py - cy) - 6 - (n.moving ? (Math.floor(t * 8) % 2) : 0);
          bctx.fillStyle = "rgba(0,0,0,.2)"; bctx.fillRect(X + 3, Math.round(n.py - cy) + 13, 10, 3);
          bctx.drawImage(SPR.robot[n.blink > 0 ? 1 : 0], X, Y);
        } else if (n.id === "cat") {
          bctx.drawImage(SPR.cat, Math.round(n.px - cx), Math.round(n.py - cy) + 6);
          if (Math.floor(t * 0.8) % 2 === 0) BP.text("Z", Math.round(n.px - cx) + 12, Math.round(n.py - cy) - 2 - Math.floor((t * 4) % 4), "#ffffff");
        } else drawChar(n.set, n, walkPose(n));
      } });
    }
    list.push({ y: pet.py + T, d: () => {
      const X = Math.round(pet.px - cx), Y = Math.round(pet.py - cy) + 4;
      bctx.fillStyle = "rgba(0,0,0,.2)"; bctx.fillRect(X + 3, Y + 9, 11, 3);
      const sit = !pet.moving && player.idle > 3;
      const img = sit ? (pet.face === "R" ? SPR.dogSitR : SPR.dogSitL) : (pet.face === "R" ? SPR.dogR : SPR.dogL)[pet.moving ? Math.floor(t * 10) % 2 : 0];
      bctx.drawImage(img, X, Y);
    } });
    if (started) list.push({ y: player.py + T + 0.2, d: () => drawChar(SPR.mehul, player, walkPose(player)) });
    for (const b of birds) {
      if (b.st === "gone" || !inView(b.x - 4, b.y - 6, 8, 6)) continue;
      list.push({ y: b.st === "fly" ? 1e6 : b.y + 4, d: () => {
        const fr = b.st === "fly" ? Math.floor(t * 10) % 2 : 0;
        const img = (b.face ? SPR.birdL : SPR.bird)[b.st === "fly" ? (fr ? 1 : 0) : 0];
        bctx.drawImage(img, Math.round(b.x - 4 - cx), Math.round(b.y - 6 - cy - (b.hop > 0 ? Math.sin(b.hop * Math.PI) * 3 : 0)));
      } });
    }
    list.sort((a, b) => a.y - b.y);
    for (const it of list) it.d();

    // tall grass in front of whoever stands in it
    for (const e of [player, pet, ...npcs]) {
      if (e === player && !started) continue;
      const tx = e.moving && e.prog < 0.5 ? e.fx : e.tx, ty = e.moving && e.prog < 0.5 ? e.fy : e.ty;
      if (inb(tx, ty) && World.ground[ty][tx] === "Y") tallOverlay(BP, Math.round(e.px - cx), Math.round(e.py - cy), flip);
    }

    // butterflies (fireflies at night)
    for (const f of flies) {
      const X = f.ax + 8 + Math.sin(t * 0.9 + f.ph) * 16, Y = f.ay + 4 + Math.sin(t * 1.7 + f.ph) * 9 - 6;
      if (!inView(X, Y, 6, 6)) continue;
      if (nt >= 1) { bctx.fillStyle = "rgba(255,240,120,.9)"; bctx.fillRect(Math.round(X - cx), Math.round(Y - cy), 2, 2); }
      else bctx.drawImage(SPR.fly[Math.floor(t * 8) % 2], Math.round(X - cx), Math.round(Y - cy));
    }

    // particles
    for (const p of parts) {
      const X = Math.round(p.x - cx), Y = Math.round(p.y - cy), a = Math.max(0, p.life / p.max);
      bctx.globalAlpha = p.smoke ? a * 0.55 : Math.min(1, a * 1.5);
      if (p.star) { BP.p(X, Y, "#fff"); BP.p(X - 1, Y, "#f8e048"); BP.p(X + 1, Y, "#f8e048"); BP.p(X, Y - 1, "#f8e048"); BP.p(X, Y + 1, "#f8e048"); if (a > 0.5) { BP.p(X - 2, Y, "#fff8c0"); BP.p(X + 2, Y, "#fff8c0"); } }
      else if (p.heart) { const c = "#ff4a7a"; BP.r(X - 3, Y - 2, 2, 2, c); BP.r(X + 1, Y - 2, 2, 2, c); BP.r(X - 3, Y - 1, 6, 2, c); BP.r(X - 2, Y + 1, 4, 1, c); BP.p(X - 1, Y + 2, c); BP.p(X, Y + 2, c); }
      else if (p.text) { const w = textW(p.text); BP.text(p.text, X - (w >> 1) + 1, Y + 1, "#2a2230"); BP.text(p.text, X - (w >> 1), Y, p.c); }
      else { const s = p.smoke ? Math.round(p.s + (1 - a) * 3) : p.s; BP.r(X, Y, s, s, p.c); }
    }
    bctx.globalAlpha = 1;

    // drifting cloud shadows (daytime)
    if (nt < 1) {
      bctx.globalAlpha = 0.09;
      for (const c of clouds) if (inView(c.x, c.y, 140, 70)) bctx.drawImage(cloudSpr[c.k], Math.round(c.x - cx), Math.round(c.y - cy));
      bctx.globalAlpha = 1;
    }

    // "!" bubble above the player when something is nearby and its panel is closed
    if (started && near && near !== "sign" && !player.moving && panelEl.hidden) {
      const X = Math.round(player.px - cx) + 5, Y = Math.round(player.py - cy) - 27 - (Math.floor(t * 3) % 2);
      BP.r(X, Y, 7, 9, "#2a2230"); BP.r(X + 1, Y + 1, 5, 7, "#ffffff"); BP.r(X + 3, Y + 2, 1, 3, "#d84848"); BP.p(X + 3, Y + 6, "#d84848"); BP.p(X + 1, Y + 9, "#2a2230");
    }

    // time of day
    if (nt > 0) {
      bctx.fillStyle = nt >= 1 ? "rgba(14,20,64,.42)" : "rgba(120,50,90,.18)";
      bctx.fillRect(0, 0, VW, VH);
      bctx.globalCompositeOperation = "lighter";
      const glow = (x, y, r, a, col = "255,200,110") => {
        const g = bctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(1, `rgba(${col},0)`);
        bctx.fillStyle = g; bctx.fillRect(x - r, y - r, r * 2, r * 2);
      };
      for (const o of World.objects) {
        if (o.lamp && inView(o.b.x - 40, o.b.y - 40, 96, 96)) glow(o.b.x + 8 - cx, o.b.y + 7 - cy, 42, 0.42 * nt);
        if (o.glow && inView(o.b.x - 40, o.b.y, 130, 100)) glow(o.b.x + 26 - cx, o.b.y + 50 - cy, 46, 0.4 * nt, "170,120,255");
      }
      if (started) glow(player.px + 8 - cx, player.py + 6 - cy, 34, 0.18 * nt);
      if (train.state !== "wait") glow(train.x - 2 - cx, World.railY * T + 1 - cy, 30, 0.5 * nt, "255,240,180");
      bctx.globalCompositeOperation = "source-over";
    }
    if (flash > 0) { bctx.fillStyle = `rgba(255,255,255,${flash})`; bctx.fillRect(0, 0, VW, VH); }

    // blit
    const sx = shake > 0 ? Math.round((Math.random() - .5) * 2 * scale) : 0, sy = shake > 0 ? Math.round((Math.random() - .5) * 2 * scale) : 0;
    ctx.drawImage(buf, sx, sy, VW * scale, VH * scale);

    // landmark labels + name tag (crisp, on the full-res canvas)
    const fs = 8 * Math.max(1, Math.round(scale / 3));
    ctx.font = `${fs}px "Press Start 2P", monospace`;
    ctx.textBaseline = "middle"; ctx.textAlign = "center";
    for (const [id, L] of Object.entries(World.labels)) {
      if (!inView(L.x - 60, L.y - 20, 120, 40)) continue;
      const f = found.has(id), isNext = tour.state === "active" && tour.current === id;
      const bob = (!f || isNext) && Math.floor(t * 2.5) % 2 ? scale : 0;
      const text = (isNext ? "▶ " : f ? "" : "! ") + L.text;
      const w = ctx.measureText(text).width + fs * 1.4, h = fs * 2.1;
      const X = Math.round((L.x - cam.x) * scale), Y = Math.round((L.y - cam.y) * scale - h / 2 - bob);
      ctx.fillStyle = "rgba(42,34,48,.85)"; ctx.fillRect(X - w / 2 - 2, Y - h / 2 + 3, w + 4, h);
      ctx.fillStyle = isNext ? "#ff6a5a" : f ? "#ffffff" : "#f8d048"; ctx.fillRect(X - w / 2, Y - h / 2, w, h);
      ctx.lineWidth = Math.max(2, Math.round(fs / 5)); ctx.strokeStyle = "#2a2230"; ctx.strokeRect(X - w / 2, Y - h / 2, w, h);
      ctx.fillStyle = isNext ? "#ffffff" : f ? "#3a7a40" : "#2a2230"; ctx.fillText(text, X, Y + 1);
    }
    if (started) {
      const nfs = Math.max(9, fs), name = "MEHUL";
      ctx.font = `${nfs}px "Press Start 2P", monospace`;
      const w = ctx.measureText(name).width + nfs * 1.2, h = nfs * 1.9;
      const X = Math.round((player.px + 8 - cam.x) * scale), Y = Math.round((player.py - 9 - cam.y) * scale - h / 2);
      ctx.fillStyle = "rgba(42,34,48,.55)"; ctx.fillRect(X - w / 2 + 2, Y - h / 2 + 3, w, h);
      ctx.fillStyle = "#6a2ca8"; ctx.fillRect(X - w / 2, Y - h / 2, w, h);
      ctx.fillStyle = "#8d55c8"; ctx.fillRect(X - w / 2, Y - h / 2, w, Math.max(2, h * 0.18));
      ctx.lineWidth = Math.max(2, Math.round(nfs / 5)); ctx.strokeStyle = "#2a2230"; ctx.strokeRect(X - w / 2, Y - h / 2, w, h);
      const tri = Math.max(3, Math.round(nfs / 2.5));
      ctx.fillStyle = "#6a2ca8"; ctx.beginPath(); ctx.moveTo(X - tri, Y + h / 2 - 1); ctx.lineTo(X + tri, Y + h / 2 - 1); ctx.lineTo(X, Y + h / 2 + tri); ctx.fill();
      ctx.fillStyle = "#ffffff"; ctx.fillText(name, X, Y + 1);
    }
  }

  function drawObj(o, b, cx, cy, t, nt) {
    const X = b.x - cx, Y = b.y - cy;
    if (o.draw === "turbine") { drawTurbine(BP, X + b.w / 2, Y + b.h, t + (o.phase || 0)); return; }
    if (o.anim === "fountain") { bctx.drawImage(SPR.fountain[Math.floor(t * 4) % 2], X, Y); return; }
    bctx.drawImage((nt >= 1 && o.night && SPR[o.night]) || SPR[o.spr], X, Y);
    if (o.screen) deskScreen(BP, X + 7, Y + 2, t);
    if (o.board) billboardScreen(BP, X + 3, Y + 3, t);
    if (o.beacon && Math.floor(t * 1.5) % 2) BP.r(X + 11, Y, 4, 2, "#ffb0b0");
    if (o.cap) {
      const bob = Math.round(Math.sin(t * 2.5 + o.x) * 2);
      bctx.fillStyle = "rgba(0,0,0,.12)"; bctx.fillRect(X + 3, Y + 3, 10, 2);
      bctx.drawImage(SPR[o.cap], X - 1, Y - 13 + bob);
    }
    if (o.rocket) {
      const R = rocket, rx = X + 14, ry = Y + 6 + Math.round(R.ry);
      if (R.phase === "fly" || R.phase === "land") {
        const fl = Math.floor(t * 20) % 2;
        BP.r(rx + 9, ry + 64, 10, 4 + fl * 2, "#ff8a2a"); BP.r(rx + 11, ry + 66, 6, 6 + fl * 4, "#f8d048"); BP.r(rx + 13, ry + 68, 2, 4 + fl * 5, "#ffffff");
      }
      if (R.phase !== "gone") bctx.drawImage(SPR.rocket, rx, ry);
    }
  }

  /* ---------- particles update ---------- */
  function updateParts(dt) {
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.life -= dt; if (p.life <= 0) { parts.splice(i, 1); continue; }
      p.vy += (p.g || 0) * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.spin) p.vx += Math.sin(p.life * 8) * 4 * dt;
    }
    if (parts.length > 700) parts.splice(0, parts.length - 700);
  }

  /* ---------- HUD & minimap ---------- */
  function updateHUD() {
    $("#foundN").textContent = found.size; $("#foundT").textContent = TOTAL;
    $("#foundBar").style.width = (found.size / TOTAL) * 100 + "%";
    setTourBtn();
  }
  const mm = $("#minimap"), mmx = mm.getContext("2d"), MS = isTouch ? 2 : 3;
  mm.width = MAP_W * MS; mm.height = MAP_H * MS; mm.style.width = mm.width + "px"; mm.style.height = mm.height + "px";
  const mmBase = (() => {
    const [c, x] = makeCanvas(MAP_W * MS, MAP_H * MS);
    const COL = { G: "#78c858", F: "#88d060", Y: "#3e9a48", P: "#e4cc94", Z: "#dcd4c4", W: "#4c94f0", L: "#4c94f0", S: "#f0dca0", D: "#c48c54", C: "#b4b8bc", R: "#cc5e40", H: "#f4ecd8", B: "#2c6c30", O: "#8a8f98", A: "#5c6068", K: "#7a6a58", X: "#e4cc94" };
    for (let y = 0; y < MAP_H; y++) for (let i = 0; i < MAP_W; i++) { x.fillStyle = COL[World.ground[y][i]] || "#78c858"; x.fillRect(i * MS, y * MS, MS, MS); }
    x.fillStyle = "#2a6434"; for (const t of World.trees) x.fillRect(t.x * MS, t.y * MS, MS, MS);
    for (const b of World.bigTrees) x.fillRect(b.x * MS, b.y * MS, MS * 2, MS);
    x.fillStyle = "#6a5a8a"; for (const o of World.objects) if (o.w * o.h >= 4) x.fillRect(o.x * MS, o.y * MS, o.w * MS, o.h * MS);
    return c;
  })();
  function drawMinimap(t) {
    mmx.drawImage(mmBase, 0, 0);
    const blink = Math.floor(t * 3) % 2;
    if (train.state !== "wait") { mmx.fillStyle = "#2aa198"; mmx.fillRect(Math.round((train.x - TRAIN_LEN) / T * MS), World.railY * MS - 1, Math.round(TRAIN_LEN / T * MS), MS + 1); }
    for (const [id, zs] of Object.entries(World.zones)) {
      const z = zs[0], X = (z.x + z.w / 2) * MS, Y = (z.y + z.h / 2) * MS;
      if (tour.state === "active" && tour.current === id) { mmx.fillStyle = "#2a2230"; mmx.fillRect(X - 4, Y - 4, 8, 8); mmx.fillStyle = blink ? "#ff4a3a" : "#ffffff"; mmx.fillRect(X - 3, Y - 3, 6, 6); }
      else if (found.has(id)) { mmx.fillStyle = "#ffffff"; mmx.fillRect(X - 2, Y - 2, 4, 4); mmx.fillStyle = "#3a9a48"; mmx.fillRect(X - 1, Y - 1, 2, 2); }
      else { mmx.fillStyle = "#2a2230"; mmx.fillRect(X - 3, Y - 3, 6, 6); mmx.fillStyle = blink ? "#f8d048" : "#ffffff"; mmx.fillRect(X - 2, Y - 2, 4, 4); }
    }
    mmx.strokeStyle = "rgba(255,255,255,.9)"; mmx.lineWidth = 1;
    mmx.strokeRect(Math.round(cam.x / T * MS) + 0.5, Math.round(cam.y / T * MS) + 0.5, Math.round(VW / T * MS), Math.round(VH / T * MS));
    mmx.fillStyle = "#2a2230"; mmx.fillRect(player.tx * MS - 2, player.ty * MS - 2, MS + 4, MS + 4);
    mmx.fillStyle = blink ? "#ff3a3a" : "#ffffff"; mmx.fillRect(player.tx * MS - 1, player.ty * MS - 1, MS + 2, MS + 2);
  }
  mm.addEventListener("click", (e) => {
    if (!started) return;
    userTookControl();
    const r = mm.getBoundingClientRect();
    const tx = Math.floor((e.clientX - r.left) / r.width * MAP_W), ty = Math.floor((e.clientY - r.top) / r.height * MAP_H);
    for (const [id, zs] of Object.entries(World.zones)) if (zs.some((z) => cheb(tx, ty, z) <= 1)) { Audio8.play("select"); goSection(id); return; }
    goTile(tx, ty);
  });

  /* ---------- input ---------- */
  const KEYMAP = { ArrowUp: "up", KeyW: "up", ArrowDown: "down", KeyS: "down", ArrowLeft: "left", KeyA: "left", ArrowRight: "right", KeyD: "right" };
  const keys = new Set(); let keyOrder = [], touchDir = null, runHeld = false;
  const blocked = () => UI.anyOverlay() || dlg.mode === "talk" || !started;
  const konami = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "KeyB", "KeyA"]; let kIdx = 0;

  function interact() {
    if (dlg.mode === "talk") { advance(); return; }
    if (dlg.mode === "auto" && dlg.shown < dlg.full.length) { advance(); return; }
    if (near && near !== "sign") { if (UI.current !== near) { dismissed = null; openSection(near, true); } return; }
    const [dx, dy] = DIRS[player.dir], fx = player.tx + dx, fy = player.ty + dy;
    const n = npcs.find((m) => m.tx === fx && m.ty === fy);
    if (n) { talkTo(n); return; }
    if (pet.tx === fx && pet.ty === fy) { petBark(); return; }
    if (near === "sign") talk("SIGN", NPC_LINES.sign);
  }

  addEventListener("keydown", (e) => {
    Audio8.unlock();
    const code = e.code;
    kIdx = code === konami[kIdx] ? kIdx + 1 : code === konami[0] ? 1 : 0;
    if (kIdx === konami.length) { kIdx = 0; secret(); }
    if (!$("#title").hidden) { if (code === "Enter" || code === "Space") { e.preventDefault(); start(); } return; }
    if (!$("#tourPlanner").hidden) {
      if (code === "Escape") closePlanner(true);
      else if (code === "Enter" && e.target.tagName !== "BUTTON" && tour.sel.size) { e.preventDefault(); startTour([...tour.sel], tour.firstPick); }
      return;
    }
    if (!$("#quick").hidden) { if (code === "Escape") UI.closeQuick(); return; }
    if (!$("#questlog").hidden) { if (code === "Escape") UI.closeLog(); return; }
    if (!$("#menu").hidden) {
      const items = [...$("#menu").querySelectorAll("button,a")], i = items.indexOf(document.activeElement);
      if (code === "Escape") UI.toggleMenu(false);
      else if (code === "ArrowDown" || code === "KeyS") { e.preventDefault(); items[(i + 1) % items.length].focus(); }
      else if (code === "ArrowUp" || code === "KeyW") { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
      return;
    }
    // let buttons/links inside the panel and tour bar handle their own Enter/Space
    if (e.target.closest && e.target.closest("#panel, #tourBar, #hud, #tourBtn") && (code === "Space" || code === "Enter")) return;
    if (!panelEl.hidden && code === "Escape") { Audio8.play("close"); UI.closePanel("user"); return; }
    if (KEYMAP[code]) {
      e.preventDefault();
      if (dlg.mode === "talk") return;
      if (!e.repeat) userTookControl();
      keys.add(code); keyOrder = keyOrder.filter((k) => k !== code); keyOrder.push(code);
      return;
    }
    if (code === "ShiftLeft" || code === "ShiftRight") { keys.add(code); return; }
    if (code === "KeyE" || code === "Enter" || code === "Space") { e.preventDefault(); if (!e.repeat) interact(); return; }
    if (code === "KeyT") { onTourButton(); return; }
    if (code === "KeyN") { if (tour.state === "active") { Audio8.play("select"); nextStop(); } return; }
    if (code === "KeyQ") { hideDialog(); Audio8.duck(true); UI.openQuick(); return; }
    if (code === "KeyL") { UI.openLog(found); return; }
    if (code === "KeyH" || e.key === "?") { toggleHelp(); return; }
    if (code === "Escape") { if (dlg.mode === "talk") { hideDialog(); near = null; checkNear(); } else UI.toggleMenu(true); }
  });
  addEventListener("keyup", (e) => { keys.delete(e.code); });
  addEventListener("blur", () => { keys.clear(); touchDir = null; });

  cv.addEventListener("pointerdown", (e) => {
    Audio8.unlock();
    if (!started || UI.anyOverlay()) return;
    if (dlg.mode === "talk") { advance(); return; }
    const wx = cam.x + (e.clientX * dpr) / scale, wy = cam.y + (e.clientY * dpr) / scale;
    const hit = (x, y, w, h) => wx >= x && wx < x + w && wy >= y && wy < y + h;
    if (hit(pet.px, pet.py + 2, 16, 14) && Math.abs(pet.tx - player.tx) + Math.abs(pet.ty - player.ty) <= 1) { petBark(); return; }
    userTookControl();
    for (const n of npcs) if (hit(n.px, n.py - 6, 16, 22) && !(n === guide && guide.follow)) { Audio8.play("select"); goNPC(n); return; }
    const objs = World.objects.filter((o) => o.section || o.npc).sort((a, b) => (b.y + b.h) - (a.y + a.h));
    for (const o of objs) {
      const b = o.b, extra = o.cap ? 14 : 0;
      if (hit(b.x, b.y - extra, b.w, b.h + extra)) {
        Audio8.play("select");
        if (o.section) goSection(o.section);
        else followPath(bfs((x, y) => cheb(x, y, o) === 1), () => { player.dir = dirTo(player.tx, player.ty, o.x, o.y); talk("SIGN", NPC_LINES.sign); });
        return;
      }
    }
    goTile(Math.floor(wx / T), Math.floor(wy / T));
  });

  // touch controls
  if (isTouch) {
    document.body.classList.add("touch");
    $("#touch").querySelectorAll("[data-dir]").forEach((b) => {
      const on = (e) => { e.preventDefault(); Audio8.unlock(); userTookControl(); touchDir = b.dataset.dir; b.classList.add("on"); if (dlg.mode === "talk") touchDir = null; player.path = null; };
      const off = () => { if (touchDir === b.dataset.dir) touchDir = null; b.classList.remove("on"); };
      b.addEventListener("pointerdown", on); b.addEventListener("pointerup", off); b.addEventListener("pointerleave", off); b.addEventListener("pointercancel", off);
    });
    $("#tA").addEventListener("pointerdown", (e) => { e.preventDefault(); $("#tA").classList.add("on"); interact(); });
    $("#tA").addEventListener("pointerup", () => $("#tA").classList.remove("on"));
    $("#tB").addEventListener("pointerdown", (e) => { e.preventDefault(); runHeld = true; $("#tB").classList.add("on"); });
    for (const ev of ["pointerup", "pointerleave", "pointercancel"]) $("#tB").addEventListener(ev, () => { runHeld = false; $("#tB").classList.remove("on"); });
  }

  function secret() {
    Audio8.play("fanfare"); flash = 0.8;
    burst(player.px + 8, player.py, 40, ["#f8d048", "#ff6a8a", "#8cdcff", "#a8e848"]);
    UI.toast("↑↑↓↓←→←→BA · ACHIEVEMENT UNLOCKED<br><small>You know the code. Mehul would love to work with you.</small>", 4200);
  }

  /* ---------- HUD buttons, menu, help ---------- */
  function toggleHelp(force) {
    const show = force !== undefined ? force : $("#help").hidden;
    $("#help").hidden = !show; $("#helpShow").hidden = show; store.set("mt_help", show);
  }
  $("#helpClose").onclick = () => toggleHelp(false);
  $("#helpShow").onclick = () => toggleHelp(true);
  $("#btnQuick").onclick = () => { hideDialog(); Audio8.duck(true); UI.openQuick(); };
  $("#btnMenu").onclick = () => UI.toggleMenu();
  $("#progressBtn").onclick = () => UI.openLog(found);
  const syncMenu = () => {
    $("#mSfx").textContent = Audio8.sfx ? "ON" : "OFF";
    $("#mMusic").textContent = Audio8.music ? "ON" : "OFF";
    $("#mTime").textContent = timeMode.toUpperCase();
  };
  $("#menu").addEventListener("click", (e) => {
    const b = e.target.closest("[data-m]"); if (!b) return;
    const m = b.dataset.m;
    if (m === "pdf") return;
    if (m === "quick") { UI.toggleMenu(false); hideDialog(); Audio8.duck(true); UI.openQuick(); }
    else if (m === "log") { $("#menu").hidden = true; UI.openLog(found); }
    else if (m === "tour") { $("#menu").hidden = true; onTourButton(); }
    else if (m === "sfx") { Audio8.toggleSfx(); Audio8.play("select"); }
    else if (m === "music") { Audio8.toggleMusic(); }
    else if (m === "time") { timeMode = { auto: "day", day: "night", night: "auto" }[timeMode]; store.set("mt_time", timeMode); Audio8.play("select"); }
    else if (m === "help") { toggleHelp(true); UI.toggleMenu(false); }
    else if (m === "reset") { found.clear(); store.set("mt_found", []); updateHUD(); near = null; checkNear(); UI.toast("Progress reset. Happy exploring!"); }
    else if (m === "close") UI.toggleMenu(false);
    syncMenu();
  });

  UI.onClose = () => {
    Audio8.duck(!panelEl.hidden);
    if (dlg.mode === "auto" && near && !UI.anyOverlay()) { dlg.shown = dlg.full.length; dText.textContent = dlg.full; dEl.hidden = false; }
  };
  UI.onPanelClose = (reason) => {
    Audio8.duck(false);
    if (reason === "user") dismissed = near;
  };
  UI.onGo = (id) => { userTookControl(); goSection(id); };
  UI.onLaunch = () => { Audio8.duck(false); launchRocket(); };

  /* ---------- start ---------- */
  function start(opts = {}) {
    if (started) return;
    started = true;
    $("#title").hidden = true; $("#hud").hidden = false; tourBtn.hidden = false;
    if (isTouch) $("#touch").hidden = false;
    toggleHelp(store.get("mt_help", !isTouch));
    Audio8.unlock(); Audio8.beginMusic();
    if (!opts.silent) Audio8.play("open");
    flash = 0.6; syncMenu(); updateHUD();
    cam.x = player.px + 8 - VW / 2; cam.y = player.py - VH / 2;
    if (opts.silent) return;
    setTimeout(() => {
      if (found.size === 0) {
        guide.dir = "right";
        talk("GUIDE", NPC_LINES.guide, () => { guide.dir = "down"; openPlanner("new"); });
      } else UI.toast(`Welcome back! ★ ${found.size}/${TOTAL} discovered`);
    }, 500);
  }
  $("#startBtn").onclick = () => start();
  $("#quickBtn").onclick = () => { start({ silent: true }); Audio8.duck(true); UI.openQuick(); };

  // deep links: #quick, #tour or #<section>
  const deepLink = location.hash.slice(1);
  if (deepLink === "quick") { start({ silent: true }); Audio8.duck(true); UI.openQuick(); }
  else if (deepLink === "tour") { start({ silent: true }); openPlanner("new"); }
  else if (SEC[deepLink]) { start({ silent: true }); openSection(deepLink, false); }

  /* ---------- main loop ---------- */
  addEventListener("resize", resize);
  resize();
  cam.x = (WORLD_W - VW) / 2; cam.y = (WORLD_H - VH) / 2;
  updateHUD();
  let last = performance.now(), t0 = last, mmT = 0;
  function frame(now) {
    // rAF timestamps can precede t0 on the first frame: clamp so t and dt are never negative
    const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)), t = Math.max(0, (now - t0) / 1000); last = Math.max(last, now);
    bumpCD -= dt; shake = Math.max(0, shake - dt); flash = Math.max(0, flash - dt * 1.5);
    if (clickMark && (clickMark.t -= dt) <= 0) clickMark = null;
    if (started) updatePlayer(dt);
    updateWorld(dt);
    updateRocket(dt);
    updateDialog(dt);
    updateParts(dt);
    updateCamera(dt);
    render(t);
    if ((mmT -= dt) <= 0 && started) { mmT = 0.15; drawMinimap(t); }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  // handy for debugging in the console; tick(sec) advances the simulation without rendering
  window.MehulTown = {
    player, tour, npcs, train, goSection, nextStop,
    tick(sec = 1) { for (let i = 0; i < sec * 60; i++) { const dt = 1 / 60; if (started) updatePlayer(dt); updateWorld(dt); updateRocket(dt); updateDialog(dt); updateParts(dt); updateCamera(dt); } },
  };
  if (document.fonts && document.fonts.load) document.fonts.load('8px "Press Start 2P"');
})();
