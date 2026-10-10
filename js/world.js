/* ==========================================================================
   WORLD: MEHUL TOWN (64 x 48 tiles)

   North : Home · NYU Campus (Degree Hall, caps, stage, chalkboard) ·
           Tech Park (AI Lab, MaGic tower) · Green Energy (ROSI)
   Middle: Downtown store · Dashboards · Central Plaza · Dev Deck · Airfield
   South : Sports (Gym, track) · Pond · Trophies · Aerospace Base · Rail Station
   ========================================================================== */
const MAP_W = 64, MAP_H = 48;

const World = {
  ground: [], solid: [], trees: [], bigTrees: [], objects: [], zones: {}, labels: {},
  groundCanvas: [], water: [],
  spawn: { x: 31, y: 24 },
  railY: 41,
};

/* Tile codes
   G grass · F flowers · Y tall grass · P path · Z plaza · W water · L lily
   S sand · D deck · C concrete · R track · H fence · B bush · O rock
   A runway · K rails · X rail crossing                                     */

function buildWorld() {
  const g = World.ground = [...Array(MAP_H)].map(() => Array(MAP_W).fill("G"));
  const solid = World.solid = [...Array(MAP_H)].map(() => Array(MAP_W).fill(false));
  const inb = (x, y) => x >= 0 && y >= 0 && x < MAP_W && y < MAP_H;
  const set = (x, y, c) => { if (inb(x, y)) g[y][x] = c; };
  const rect = (x, y, w, h, c) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) set(i, j, c); };
  const ring = (x, y, w, h, c) => { rect(x, y, w, 1, c); rect(x, y + h - 1, w, 1, c); rect(x, y, 1, h, c); rect(x + w - 1, y, 1, h, c); };

  /* ---- roads ---- */
  rect(5, 13, 52, 1, "P");           // north avenue
  rect(3, 22, 58, 2, "P");           // main street
  rect(31, 4, 2, 37, "P");           // central boulevard
  rect(26, 18, 12, 9, "Z");          // central plaza
  rect(7, 8, 1, 5, "P");             // home path
  rect(14, 9, 9, 4, "Z");            // campus forecourt
  rect(24, 8, 4, 5, "Z");            // stage plaza
  rect(39, 9, 1, 4, "P");            // AI lab path
  rect(47, 9, 1, 4, "P");            // tower path
  rect(54, 10, 1, 3, "P");           // energy park path
  rect(7, 19, 1, 3, "P");            // store path
  rect(43, 14, 1, 1, "P"); rect(43, 21, 1, 1, "P");   // dev deck links
  rect(39, 15, 9, 6, "D");           // dev deck
  rect(50, 16, 11, 2, "A");          // runway
  rect(52, 18, 1, 4, "P");           // airfield path
  rect(11, 24, 1, 10, "P"); rect(6, 33, 6, 1, "P");   // gym path wraps to its door
  ring(13, 27, 8, 8, "R");           // running track
  rect(21, 28, 7, 6, "S"); rect(22, 29, 5, 4, "W");   // pond + beach
  set(23, 30, "L"); set(25, 31, "L");
  rect(29, 28, 8, 5, "Z");           // trophy plaza
  rect(38, 27, 21, 10, "C");         // aerospace base
  rect(48, 24, 1, 3, "P");           // base path
  rect(18, 39, 26, 2, "Z");          // station platform
  rect(0, World.railY, MAP_W, 1, "K"); rect(31, World.railY, 2, 1, "X");   // railway + crossing
  // Planned garden edges frame the plaza without interrupting walking routes.
  for (const y of [18, 19, 20, 21, 24, 25, 26]) for (const x of [25, 38]) if (g[y][x] === 'G') set(x, y, 'F');
  for (const x of [27, 28, 29, 34, 35, 36]) if (g[27][x] === 'G') set(x, 27, 'F');
  // nature
  rect(12, 15, 5, 4, "Y"); rect(33, 15, 4, 3, "Y"); rect(5, 42, 6, 2, "Y"); rect(56, 42, 4, 2, "Y"); rect(2, 26, 2, 5, "Y");
  for (let x = 3; x <= 10; x++) if (x !== 7) set(x, 9, "H");       // garden fence
  for (let x = 50; x <= 60; x++) if (x !== 54) set(x, 12, "H");    // energy park fence
  rect(4, 8, 3, 1, "F"); rect(8, 8, 2, 1, "F");
  for (const [x, y] of [[13, 9], [23, 9], [34, 12], [44, 9], [49, 9], [3, 18], [25, 34], [37, 30], [17, 37], [45, 26], [60, 37]]) set(x, y, "B");
  for (const [x, y] of [[59, 26], [3, 38], [36, 37], [10, 44], [47, 44], [27, 15]]) set(x, y, "O");
  for (let y = 3; y < MAP_H - 3; y++) for (let x = 3; x < MAP_W - 3; x++)
    if (g[y][x] === "G" && hash(x, y, 101) < 0.045) g[y][x] = "F";
  for (let x = 4; x < 60; x++) for (const y of [42, 43, 44]) if (g[y][x] === "G" && hash(x, y, 102) < 0.18) g[y][x] = "F";

  /* ---- trees ---- */
  const treeAt = new Map();
  for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) {
    if (y === World.railY) continue;
    const edge = Math.min(x, y, MAP_W - 1 - x, MAP_H - 1 - y);
    if (edge < 2 || (edge === 2 && hash(x, y, 7) < 0.45)) treeAt.set(x + "," + y, hash(x, y, 8) < 0.3 ? 2 : hash(x, y, 9) < 0.5 ? 0 : 1);
  }
  const inner = [[3, 12], [12, 9], [34, 9], [44, 11], [49, 10], [26, 15], [37, 16], [44, 25], [3, 25], [11, 37],
    [21, 36], [42, 38], [37, 38], [60, 31], [8, 43], [20, 43], [27, 43], [40, 44], [52, 43], [58, 42], [36, 27], [17, 25], [57, 20]];
  for (const [x, y] of inner) treeAt.set(x + "," + y, [0, 1, 3, 4, 0, 1][(hash(x, y, 13) * 6) | 0]);
  World.bigTrees = [[11, 5, 0], [19, 15, 3], [8, 25, 1], [58, 24, 0], [45, 38, 2], [14, 40, 3]].map(([x, y, v]) => ({ x, y, v }));

  /* ---- props & landmarks ---- */
  World.objects = [];
  const add = (o) => {
    World.objects.push(o);
    for (let j = o.y; j < o.y + o.h; j++) for (let i = o.x; i < o.x + o.w; i++) { if (o.solid !== false) solid[j][i] = true; treeAt.delete(i + "," + j); }
    return o;
  };
  // Home
  add({ id: "house", x: 5, y: 4, w: 5, h: 4, spr: "house", night: "houseLit", section: "home", smoke: true });
  add({ id: "mailbox", x: 10, y: 8, w: 1, h: 1, spr: "mailbox", section: "contact" });
  add({ id: "doghouse", x: 3, y: 7, w: 1, h: 1, spr: "doghouse" });
  // NYU campus
  add({ id: "hall", x: 15, y: 4, w: 7, h: 5, spr: "hall", night: "hallLit" });
  add({ id: "pedNYU", x: 16, y: 11, w: 1, h: 1, spr: "pedestal", cap: "capNYU", section: "nyu" });
  add({ id: "pedCU", x: 20, y: 11, w: 1, h: 1, spr: "pedestal", cap: "capCU", section: "cu" });
  add({ id: "stage", x: 24, y: 6, w: 4, h: 2, spr: "stage", section: "conference" });
  add({ id: "chalk", x: 24, y: 11, w: 2, h: 1, spr: "chalkboard", section: "teaching" });
  // Tech park
  add({ id: "lab", x: 36, y: 4, w: 7, h: 5, spr: "lab", night: "labLit", section: "vlab" });
  add({ id: "tower", x: 46, y: 7, w: 3, h: 2, spr: "magicTower", section: "magic", glow: true });
  // Green energy
  add({ id: "turbine", x: 56, y: 6, w: 1, h: 1, draw: "turbine", section: "rosi", vis: { w: 44, h: 80 }, phase: 0 });
  add({ id: "turbine2", x: 59, y: 9, w: 1, h: 1, draw: "turbine", vis: { w: 44, h: 80 }, phase: 1.7 });
  add({ id: "kiosk", x: 53, y: 9, w: 1, h: 1, spr: "kiosk", section: "rosi" });
  for (const [x, y] of [[50, 5], [52, 5], [50, 7], [57, 11]]) add({ id: "solar", x, y, w: 2, h: 1, spr: "solar" });
  // Downtown
  add({ id: "store", x: 4, y: 15, w: 6, h: 4, spr: "store", night: "storeLit", section: "retail" });
  add({ id: "billboard", x: 21, y: 19, w: 3, h: 1, spr: "billboard", board: true, section: "bi" });
  add({ id: "bikes", x: 21, y: 25, w: 3, h: 1, spr: "bikeDock", section: "citibike" });
  add({ id: "hydrant", x: 10, y: 20, w: 1, h: 1, spr: "hydrant" });
  add({ id: "crate", x: 10, y: 17, w: 1, h: 1, spr: "crate" });
  add({ id: "barrel", x: 10, y: 18, w: 1, h: 1, spr: "barrel" });
  // Dev deck
  add({ id: "desk", x: 40, y: 16, w: 2, h: 1, spr: "desk", screen: true, section: "dev" });
  add({ id: "books", x: 44, y: 15, w: 2, h: 1, spr: "bookshelf", section: "library" });
  add({ id: "stall", x: 45, y: 19, w: 2, h: 1, spr: "stall", section: "apps" });
  add({ id: "pot", x: 42, y: 15, w: 1, h: 1, spr: "pot" });
  add({ id: "crate", x: 39, y: 20, w: 1, h: 1, spr: "crate" });
  add({ id: "barrel", x: 47, y: 15, w: 1, h: 1, spr: "barrel" });
  // Airfield
  add({ id: "plane", x: 53, y: 16, w: 4, h: 2, spr: "plane", section: "aviation" });
  add({ id: "ctower", x: 58, y: 15, w: 2, h: 1, spr: "ctrlTower", section: "aviation", beacon: true });
  add({ id: "windsock", x: 50, y: 19, w: 1, h: 1, spr: "windsock" });
  // Central plaza
  add({ id: "fountain", x: 31, y: 19, w: 2, h: 2, anim: "fountain" });
  add({ id: "sign", x: 34, y: 25, w: 1, h: 1, spr: "sign", npc: "sign" });
  add({ id: "bench", x: 27, y: 18, w: 2, h: 1, spr: "bench" });
  add({ id: "bench", x: 35, y: 18, w: 2, h: 1, spr: "bench" });
  add({ id: "pot", x: 30, y: 18, w: 1, h: 1, spr: "pot" });
  add({ id: "pot", x: 33, y: 18, w: 1, h: 1, spr: "pot" });
  add({ id: "signpost", x: 29, y: 12, w: 1, h: 1, spr: "signpost" });
  add({ id: "signpost2", x: 29, y: 28, w: 1, h: 1, spr: "signpost2", solid: true });
  // Sports
  add({ id: "gym", x: 4, y: 28, w: 6, h: 5, spr: "gym", night: "gymLit", section: "gym" });
  add({ id: "rack", x: 4, y: 35, w: 2, h: 1, spr: "dumbbells", section: "gym" });
  // Trophies
  add({ id: "trophy", x: 33, y: 30, w: 3, h: 1, spr: "trophyCase", sparkle: true, section: "trophy" });
  // Aerospace base
  add({ id: "rocket", x: 52, y: 30, w: 3, h: 2, spr: "rocketBase", rocket: true, section: "rocket" });
  add({ id: "tunnel", x: 40, y: 28, w: 5, h: 2, spr: "windTunnel", section: "windtunnel" });
  add({ id: "scope", x: 36, y: 35, w: 1, h: 1, spr: "telescope", section: "astro" });
  add({ id: "crate", x: 56, y: 28, w: 1, h: 1, spr: "crate" });
  add({ id: "crate", x: 57, y: 28, w: 1, h: 1, spr: "crate" });
  add({ id: "barrel", x: 56, y: 29, w: 1, h: 1, spr: "barrel" });
  add({ id: "fuel", x: 56, y: 32, w: 1, h: 1, spr: "fuelTank" });
  add({ id: "fuel", x: 57, y: 32, w: 1, h: 1, spr: "fuelTank" });
  add({ id: "radar", x: 40, y: 34, w: 2, h: 1, spr: "radar" });
  for (const [x, y] of [[45, 31], [45, 35], [50, 31], [50, 35]]) add({ id: "cone", x, y, w: 1, h: 1, spr: "cone" });
  // Rail station
  add({ id: "station", x: 24, y: 35, w: 6, h: 4, spr: "station", night: "stationLit", section: "flowmind" });
  add({ id: "bench", x: 36, y: 39, w: 2, h: 1, spr: "bench" });
  // street lamps
  for (const [x, y] of [[26, 18], [37, 18], [26, 26], [37, 26], [12, 21], [44, 21], [29, 32], [36, 32], [19, 39], [43, 39], [13, 12], [33, 12], [46, 27], [58, 36], [3, 21]])
    add({ id: "lamp", x, y, w: 1, h: 1, spr: "lamp", lamp: true });

  for (const b of World.bigTrees) for (let i = 0; i < 2; i++) { solid[b.y][b.x + i] = true; treeAt.delete(b.x + i + "," + b.y); }
  World.trees = [...treeAt].map(([k, v]) => { const [x, y] = k.split(",").map(Number); return { x, y, v }; });
  for (const t of World.trees) { solid[t.y][t.x] = true; if (g[t.y][t.x] !== "G" && g[t.y][t.x] !== "F") g[t.y][t.x] = "G"; }
  for (const b of World.bigTrees) for (let i = 0; i < 2; i++) if (!"GF".includes(g[b.y][b.x + i])) g[b.y][b.x + i] = "G";

  // blocking ground
  for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) if ("WLHBOK".includes(g[y][x])) solid[y][x] = true;
  World.water = [];
  for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) if ("WL".includes(g[y][x])) World.water.push([x, y]);

  /* ---- landmark zones & labels ---- */
  World.zones = {};
  for (const o of World.objects) if (o.section) (World.zones[o.section] ||= []).push({ x: o.x, y: o.y, w: o.w, h: o.h });

  const LABELS = {
    home: "HOME", contact: "MAILBOX", nyu: "NYU · DEC 2026", cu: "CU · MAY 2024", teaching: "TEACHING", conference: "CONFERENCE",
    vlab: "AI LAB", magic: "MAGIC FILTER", rosi: "ROSI ENERGY", dev: "DEV DESK", library: "SKILLS", apps: "SOFTWARE STUDIO",
    aviation: "AIRFIELD", bi: "DASHBOARDS", citibike: "CITI BIKE", retail: "RETAIL OPS", gym: "GYM", trophy: "TROPHIES",
    rocket: "LAUNCH PAD", windtunnel: "WIND TUNNEL", astro: "TELESCOPE", flowmind: "STATION",
  };
  const primary = {
    home: "house", contact: "mailbox", nyu: "pedNYU", cu: "pedCU", teaching: "chalk", conference: "stage", vlab: "lab", magic: "tower",
    rosi: "turbine", dev: "desk", library: "books", apps: "stall", aviation: "plane", bi: "billboard", citibike: "bikes", retail: "store",
    gym: "gym", trophy: "trophy", rocket: "rocket", windtunnel: "tunnel", astro: "scope", flowmind: "station",
  };
  for (const [sec, oid] of Object.entries(primary)) {
    const o = World.objects.find((ob) => ob.id === oid);
    const b = objBounds(o);
    World.labels[sec] = { x: b.x + b.w / 2, y: b.y - (o.cap ? 20 : 3), text: LABELS[sec] };
  }

  World.groundCanvas = [renderGround(0), renderGround(1)];
}

const isSolid = (x, y) => x < 0 || y < 0 || x >= MAP_W || y >= MAP_H || World.solid[y][x];

function objSprite(o, night) {
  if (o.draw === "turbine") return null;
  if (o.anim === "fountain") return SPR.fountain[0];
  return (night && o.night && SPR[o.night]) || SPR[o.spr];
}
/* visual bounds in world pixels (sprite bottom = footprint bottom, centred) */
function objBounds(o) {
  const s = objSprite(o, false);
  const w = s ? s.width : o.vis.w, h = s ? s.height : o.vis.h;
  const cx = (o.x + o.w / 2) * T, by = (o.y + o.h) * T;
  return { x: Math.round(cx - w / 2), y: by - h, w, h };
}

function renderGround(frame) {
  const [c, x] = makeCanvas(MAP_W * T, MAP_H * T), P = new Px(x);
  const g = World.ground;
  const same = (tx, ty, set) => tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H ? true : set.includes(g[ty][tx]);
  for (let ty = 0; ty < MAP_H; ty++) for (let tx = 0; tx < MAP_W; tx++) {
    const t = g[ty][tx], X = tx * T, Y = ty * T;
    const nbOf = (set) => ({ u: same(tx, ty - 1, set), d: same(tx, ty + 1, set), l: same(tx - 1, ty, set), r: same(tx + 1, ty, set) });
    switch (t) {
      case "G": drawGrass(P, X, Y, tx, ty); break;
      case "F": drawGrass(P, X, Y, tx, ty); drawFlower(P, X, Y, tx, ty, frame); break;
      case "Y": drawTall(P, X, Y, frame); break;
      case "P": drawPath(P, X, Y, tx, ty, nbOf("PZDCAX")); break;
      case "Z": drawPlaza(P, X, Y, tx, ty); break;
      case "W": drawWater(P, X, Y, tx, ty, nbOf("WL"), frame); break;
      case "L": drawWater(P, X, Y, tx, ty, nbOf("WL"), frame); drawLily(P, X, Y); break;
      case "S": drawSand(P, X, Y, tx, ty); break;
      case "D": drawDeck(P, X, Y, tx, ty); break;
      case "C": drawConcrete(P, X, Y, tx, ty, nbOf("C")); break;
      case "R": drawTrack(P, X, Y, tx, ty, nbOf("R")); break;
      case "H": drawFence(P, X, Y, nbOf("H")); break;
      case "B": drawBush(P, X, Y, tx, ty); break;
      case "O": drawRock(P, X, Y, tx, ty); break;
      case "A": drawRunway(P, X, Y, tx, ty, nbOf("A")); break;
      case "K": drawRails(P, X, Y, tx, ty, false); break;
      case "X": drawPath(P, X, Y, tx, ty, { u: true, d: true, l: true, r: true }); drawRails(P, X, Y, tx, ty, true); break;
    }
  }
  // An inlaid compass marks the meeting point in the central plaza.
  const mx = 32 * T, my = 24 * T;
  for (let i = 0; i < 10; i++) {
    P.r(mx - i, my - 10 + i, i * 2 + 1, 1, i < 5 ? '#769987' : '#c6c79f');
    P.r(mx - i, my + 10 - i, i * 2 + 1, 1, i < 5 ? '#c6c79f' : '#769987');
  }
  P.box(mx - 2, my - 2, 5, 5, '#f4d782', '#607f6b');
  drawHelipad(P, 46 * T + 8, 32 * T - 8);
  // soft shadows under trees
  x.fillStyle = "rgba(0,0,0,.16)";
  for (const t of World.trees) { x.fillRect(t.x * T + 3, t.y * T + 13, 10, 3); x.fillRect(t.x * T + 5, t.y * T + 12, 6, 5); }
  for (const b of World.bigTrees) { x.fillRect(b.x * T + 4, b.y * T + 11, 24, 5); x.fillRect(b.x * T + 8, b.y * T + 9, 16, 9); }
  return c;
}
