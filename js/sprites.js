/* ==========================================================================
   PIXEL ART
   Every sprite is original and drawn in code: string-art for characters,
   small procedural painters for buildings & props. Nothing is downloaded.
   ========================================================================== */

const T = 16; // tile size in pixels

/* ---------- tiny canvas helpers ---------- */
function makeCanvas(w, h) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  return [c, ctx];
}

/* string-art -> canvas.  '.' = transparent, other chars looked up in palette */
function spr(rows, pal) {
  const h = rows.length, w = rows[0].length;
  const [c, x] = makeCanvas(w, h);
  for (let j = 0; j < h; j++)
    for (let i = 0; i < w; i++) {
      const col = pal[rows[j][i]];
      if (col) { x.fillStyle = col; x.fillRect(i, j, 1, 1); }
    }
  return c;
}

function mirror(src) {
  const [c, x] = makeCanvas(src.width, src.height);
  x.translate(src.width, 0); x.scale(-1, 1); x.drawImage(src, 0, 0);
  return c;
}

/* pixel painter: integer rects, bresenham lines, 3x5 font */
class Px {
  constructor(ctx) { this.x = ctx; }
  r(x, y, w, h, c) { this.x.fillStyle = c; this.x.fillRect(x | 0, y | 0, w | 0, h | 0); }
  p(x, y, c) { this.r(x, y, 1, 1, c); }
  box(x, y, w, h, fill, line) { this.r(x, y, w, h, line); this.r(x + 1, y + 1, w - 2, h - 2, fill); }
  line(x0, y0, x1, y1, c, t = 1) {
    x0 |= 0; y0 |= 0; x1 |= 0; y1 |= 0;
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let e = dx + dy;
    for (;;) {
      this.r(x0, y0, t, t, c);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * e;
      if (e2 >= dy) { e += dy; x0 += sx; }
      if (e2 <= dx) { e += dx; y0 += sy; }
    }
  }
  text(str, x, y, c, s = 1) {
    let cx = x;
    for (const ch of str.toUpperCase()) {
      const g = FONT3[ch] || FONT3[" "];
      for (let j = 0; j < 5; j++)
        for (let i = 0; i < 3; i++)
          if (g[j * 3 + i] === "1") this.r(cx + i * s, y + j * s, s, s, c);
      cx += 4 * s;
    }
  }
}
const textW = (s, sc = 1) => (s.length * 4 - 1) * sc;

const FONT3 = {
  A:"010101111101101",B:"110101110101110",C:"011100100100011",D:"110101101101110",
  E:"111100110100111",F:"111100110100100",G:"011100101101011",H:"101101111101101",
  I:"111010010010111",J:"001001001101010",K:"101101110101101",L:"100100100100111",
  M:"101111111101101",N:"110101101101101",O:"010101101101010",P:"110101110100100",
  Q:"010101101110011",R:"110101110101101",S:"011100010001110",T:"111010010010010",
  U:"101101101101111",V:"101101101101010",W:"101101111111101",X:"101101010101101",
  Y:"101101010010010",Z:"111001010100111",
  0:"111101101101111",1:"010110010010111",2:"110001010100111",3:"110001010001110",
  4:"101101111001001",5:"111100110001110",6:"011100111101111",7:"111001010010010",
  8:"111101111101111",9:"111101111001110",
  " ":"000000000000000","-":"000000111000000",".":"000000000000010","&":"010101010101011",
  "!":"010010010000010","'":"010010000000000",":":"000010000010000","/":"001001010100100",
};

/* deterministic hash for tile variation */
function hash(x, y, s = 0) {
  let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

/* ==========================================================================
   CHARACTERS (16 x 20)
   ========================================================================== */
const BODY = {
  down: [
    "................",
    ".....KKKKKK.....",
    "...KKHHHHHHKK...",
    "..KHHHhHHHHHHK..",
    "..KHHHHHHHhHHK..",
    "..KHHHHHHHHHHK..",
    "..KHHSSSSSSHHK..",
    "..KHSKSSSSKSHK..",
    "..KSSKSSSSKSSK..",
    "...KsSSSSSSsK...",
    "....KKSSSSKK....",
    "...KPPPWWPPPK...",
    "..KPPLPPPPLPPK..",
    "..KpPPPPPPPPpK..",
    ".KpKPPPPPPPPKpK.",
    ".KSKPPPPPPPPKSK.",
    "..KKjJJJJJJjKK..",
    "...KJJJKKJJJK...",
    "...KJJJKKJJJK...",
    "...KWWWK.KWWWK..",
  ],
  downWalk: [
    "................",
    ".....KKKKKK.....",
    "...KKHHHHHHKK...",
    "..KHHHhHHHHHHK..",
    "..KHHHHHHHhHHK..",
    "..KHHHHHHHHHHK..",
    "..KHHSSSSSSHHK..",
    "..KHSKSSSSKSHK..",
    "..KSSKSSSSKSSK..",
    "...KsSSSSSSsK...",
    "....KKSSSSKK....",
    "...KPPPWWPPPK...",
    "..KPPLPPPPLPPK..",
    "..KpPPPPPPPPpK..",
    ".KpKPPPPPPPPKpK.",
    ".KSKPPPPPPPPKSK.",
    "..KKjJJJJJJjKK..",
    "...KJJJKKJJJK...",
    "...KWWWKKJJJK...",
    "....KKK..KWWWK..",
  ],
  up: [
    "................",
    ".....KKKKKK.....",
    "...KKHHHHHHKK...",
    "..KHHHHHHhHHHK..",
    "..KHHHHHHHHHHK..",
    "..KHHhHHHHHHHK..",
    "..KHHHHHHHHHHK..",
    "..KHHHHHHHHHHK..",
    "..KSHHHHHHHHSK..",
    "...KHHHHHHHHK...",
    "....KLLLLLLK....",
    "...KPLLLLLLPK...",
    "..KPPPLLLLPPPK..",
    "..KpPPPPPPPPpK..",
    ".KpKPPPPPPPPKpK.",
    ".KSKPPPPPPPPKSK.",
    "..KKjJJJJJJjKK..",
    "...KJJJKKJJJK...",
    "...KJJJKKJJJK...",
    "...KWWWK.KWWWK..",
  ],
  upWalk: [
    "................",
    ".....KKKKKK.....",
    "...KKHHHHHHKK...",
    "..KHHHHHHhHHHK..",
    "..KHHHHHHHHHHK..",
    "..KHHhHHHHHHHK..",
    "..KHHHHHHHHHHK..",
    "..KHHHHHHHHHHK..",
    "..KSHHHHHHHHSK..",
    "...KHHHHHHHHK...",
    "....KLLLLLLK....",
    "...KPLLLLLLPK...",
    "..KPPPLLLLPPPK..",
    "..KpPPPPPPPPpK..",
    ".KpKPPPPPPPPKpK.",
    ".KSKPPPPPPPPKSK.",
    "..KKjJJJJJJjKK..",
    "...KJJJKKJJJK...",
    "...KJJJKKWWWK...",
    "...KWWWK..KKK...",
  ],
  side: [
    "................",
    "......KKKKK.....",
    "....KKHHHHHK....",
    "...KHHHHhHHHK...",
    "..KHHHHHHHHHHK..",
    "..KHHHHHHHHHHK..",
    "..KHHHHHHSSSSK..",
    "..KHHHHSHSSKSK..",
    "..KHHHHHSSSKSK..",
    "...KHHHSSSSSSK..",
    "....KKKSSSKK....",
    "....KPPPPPPK....",
    "...KLPPPPPPPK...",
    "...KPPppPPPPK...",
    "...KPPppPPPPK...",
    "...KPPSSPPPPK...",
    "...KKjJJJJJjK...",
    "....KJJJJJJK....",
    "....KJJJJJJK....",
    "....KWWWWWWWK...",
  ],
  sideWalk: [
    "................",
    "......KKKKK.....",
    "....KKHHHHHK....",
    "...KHHHHhHHHK...",
    "..KHHHHHHHHHHK..",
    "..KHHHHHHHHHHK..",
    "..KHHHHHHSSSSK..",
    "..KHHHHSHSSKSK..",
    "..KHHHHHSSSKSK..",
    "...KHHHSSSSSSK..",
    "....KKKSSSKK....",
    "....KPPPPPPK....",
    "...KLPPPPPPPK...",
    "...KPPPPppPPK...",
    "...KPPPPppPPK...",
    "...KPPPPSSPPK...",
    "...KKjJJJJJjK...",
    "...KJJJKKJJJK...",
    "..KJJJK..KJJJK..",
    "..KWWWK..KWWWK..",
  ],
};

const PALS = {
  mehul:  { K:"#2a2230", H:"#2e2120", h:"#55403a", S:"#c98e64", s:"#a8714c", P:"#6a2ca8", p:"#4b1d7a", L:"#8d55c8", W:"#f4f4f4", J:"#3a5a9a", j:"#2a4274" },
  guide:  { K:"#2a2230", H:"#a8a8b0", h:"#d8d8e0", S:"#e8b890", s:"#c8946c", P:"#f0f0f0", p:"#b8b8c8", L:"#ffffff", W:"#f8e070", J:"#7a5a40", j:"#5a4030" },
  pilot:  { K:"#2a2230", H:"#2a2020", h:"#4a3a34", S:"#d9a07a", s:"#b8805c", P:"#2a3a68", p:"#1c2850", L:"#f8d048", W:"#ffffff", J:"#2a3a68", j:"#1c2850" },
  conductor: { K:"#2a2230", H:"#1e1e1e", h:"#3a3a3a", S:"#b07850", s:"#8e5c3a", P:"#2aa198", p:"#1c7a72", L:"#5cd0c4", W:"#f8d048", J:"#303038", j:"#202028" },
  jogger: { K:"#2a2230", H:"#d07a28", h:"#f0a050", S:"#f0c8a0", s:"#d0a07c", P:"#e04848", p:"#a82828", L:"#ff7070", W:"#ffffff", J:"#303038", j:"#202028" },
};

function buildCharacter(pal) {
  const s = {};
  s.down = spr(BODY.down, pal);
  s.downW1 = spr(BODY.downWalk, pal);
  s.downW2 = mirror(s.downW1);
  s.up = spr(BODY.up, pal);
  s.upW1 = spr(BODY.upWalk, pal);
  s.upW2 = mirror(s.upW1);
  s.right = spr(BODY.side, pal);
  s.rightW = spr(BODY.sideWalk, pal);
  s.left = mirror(s.right);
  s.leftW = mirror(s.rightW);
  return s;
}
function charFrame(set, dir, walking, step) {
  if (!walking) return set[dir];
  if (dir === "down") return step ? set.downW1 : set.downW2;
  if (dir === "up") return step ? set.upW1 : set.upW2;
  return set[dir + "W"];
}

/* ---------- Byte the dog (16 x 12) ---------- */
const DOG_PAL = { K:"#2a2230", D:"#e0a058", d:"#b8783c", W:"#fbf2e0", T:"#e86080" };
const DOG_A = [
  "................",
  "..........KK.KK.",
  ".........KDDKDDK",
  ".........KDDDDDK",
  "..K......KDKDDWK",
  ".KDK.....KDDWWKK",
  ".KDDKKKKKKDDWWK.",
  "..KDDDDDDDDDWK..",
  "..KDDDDDDDDDK...",
  "..KdWWWWWWWdK...",
  "..KDKKDK..KDKDK.",
  "..KKK.KK..KK.KK.",
];
const DOG_B = DOG_A.slice(0, 10).concat([
  "...KDDK....KDDK.",
  "...KKKK....KKKK.",
]);
const DOG_SIT = [
  "................",
  "..........KK.KK.",
  ".........KDDKDDK",
  ".........KDDDDDK",
  ".........KDKDDWK",
  "..K......KDDWWKK",
  ".KDK....KDDDWWK.",
  ".KDDK..KDDDDWK..",
  "..KDDKKDDDDDK...",
  "...KDDDDDWWWK...",
  "...KdDDDWWWdK...",
  "...KKKKKKKKKK...",
];

/* ---------- Robot (16 x 22) ---------- */
const ROBOT = [
  ".......R........",
  ".......K........",
  ".......K........",
  "...KKKKKKKKKK...",
  "..KLLLLLLLLLMK..",
  "..KLKKKKKKKKMK..",
  "..KLKCCKKCCKMK..",
  "..KLKKKKKKKKMK..",
  "..KMMKMKMKMMmK..",
  "...KKKKKKKKKK...",
  "......KmmK......",
  ".KK.KKKKKKKK.KK.",
  "KMMKLLLLLLLLKMMK",
  "KMmKLYYLLRRLKmMK",
  "KMmKLLLLLLLLKmMK",
  "KMmKMMMMMMMMKmMK",
  ".KK.KmmmmmmK.KK.",
  "....KKKKKKKK....",
  ".....KmK.KmK....",
  ".....KmK.KmK....",
  "....KMMK.KMMK...",
  "....KKKK.KKKK...",
];
const ROBOT_PAL = { K:"#283040", M:"#a8b8c8", m:"#7088a0", L:"#e4ecf4", C:"#40e8ff", R:"#ff4040", Y:"#f8d030" };
const ROBOT_PAL2 = { ...ROBOT_PAL, C:"#283040", R:"#802020", Y:"#a08020" };

/* ---------- Small critters ---------- */
const BIRD_PAL = { K:"#2a2230", B:"#6a7ad8", b:"#4a58b0", Y:"#f8c040", W:"#f0f0f0" };
const BIRD_STAND = ["..KK....", ".KBBK...", "KYBWBK..", ".KBBBbK.", "..KbbK..", "..K.K..."];
const BIRD_FLY   = ["K.....K.", "BK...KB.", ".BKKKB..", "..KBWK..", "..KYK...", "........"];
const CAT_PAL = { K:"#2a2230", O:"#f0a050", o:"#c87830", W:"#fff4e0", P:"#f080a0" };
const CAT_SLEEP = [
  "................",
  "..K.K...........",
  ".KOKOK..........",
  ".KOOOKKKKKK.....",
  "KOKOKOOOOOOKK...",
  "KOOOOOoOOoOOOK..",
  ".KWWOOOoOOOOoK..",
  "..KKKKKKKKKKKK..",
];
const FLY_PAL = { K:"#2a2230", A:"#ff8ad0", B:"#ffd84a" };
const FLY_1 = ["A.K.A", "AAKAA", ".AKA.", "..K.."];
const FLY_2 = [".AKA.", ".AKA.", ".AKA.", "..K.."];

/* ==========================================================================
   GROUND TILES
   ========================================================================== */
const C = {
  grass: "#91c86b", grassP: "#98ce72", grassQ: "#89c364", grassD: "#69aa56", grassL: "#b7de87",
  path: "#e4cc94", pathL: "#eed9a8", pathM: "#dcc288", pathD: "#c8ac70", pathE: "#b8985c",
  plaza: "#e5dfb9", plazaL: "#f6efcf", plazaD: "#b9b690", plazaB: "#dbd6af", plazaC: "#ebe6c4",
  water: "#53acbb", waterD: "#328294", waterL: "#91d7d6", waterM: "#479eaf", foam: "#def7e4",
  sand: "#f0dca0", sandD: "#d8c084", sandL: "#f8ecc0",
  deck: "#c48c54", deckD: "#946238", deckL: "#d8a46c",
  conc: "#b4b8bc", concD: "#90949a", concL: "#c8ccd0",
  track: "#cc5e40", trackL: "#f4ece4",
  tall: "#3ea048", tallD: "#2a7c34", tallL: "#7cd060",
  fence: "#f4ecd8", fenceD: "#a89878",
  bushD: "#1c5c2c",
};

/* smooth value noise + ordered dither: organic, still pixel-crisp */
function vnoise(x, y, s = 0) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const sm = (t) => t * t * (3 - 2 * t), u = sm(xf), v = sm(yf);
  const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => v / 16 - 0.5);

function drawGrass(P, x, y, tx, ty) {
  // Quiet 16px tiles let the characters and landmarks read clearly.
  const n = vnoise(tx / 3, ty / 3, 11);
  P.r(x, y, T, T, n > .66 ? C.grassP : n < .28 ? C.grassQ : C.grass);
  for (let k = 0; k < 2; k++) if (hash(tx, ty, k + 4) < .64) {
    const gx = x + 2 + ((hash(tx, ty, k + 9) * 10) | 0), gy = y + 3 + ((hash(tx, ty, k + 17) * 9) | 0);
    P.p(gx, gy, C.grassD); P.p(gx + 2, gy - 1, C.grassD); P.p(gx + 1, gy + 1, C.grassD);
    P.p(gx, gy - 1, C.grassL);
  }
  if (hash(tx, ty, 79) < .012) {
    P.r(x + 6, y + 8, 4, 2, '#cb725a'); P.p(x + 7, y + 8, '#fff1cf'); P.r(x + 7, y + 10, 2, 2, '#f4ecd8');
  }
}

function drawFlower(P, x, y, tx, ty, frame) {
  const cols = [["#f04848", "#b82828"], ["#f8e048", "#d0a820"], ["#ffffff", "#c8d0e0"], ["#f080c0", "#c04890"], ["#8ab8ff", "#4a78d8"]];
  const [col, dk] = cols[(hash(tx, ty, 5) * cols.length) | 0];
  const spots = [[3, 4], [11, 8], [5, 11], [12, 13]].filter((_, i) => hash(tx, ty, 40 + i) < 0.8);
  for (const [fx, fy] of spots) {
    const o = frame && (fx + fy) % 2 ? 1 : 0, X = x + fx + o, Y = y + fy;
    P.p(X, Y + 2, C.grassD); P.p(X - 1 + o, Y + 3, C.grassD);
    P.p(X, Y - 1, col); P.p(X - 1, Y, col); P.p(X + 1, Y, col); P.p(X, Y + 1, dk);
    P.p(X, Y, "#f8c020");
  }
}

function drawTall(P, x, y, frame) {
  P.r(x, y, T, T, C.tall);
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 2; j++) {
      const bx = x + i * 4 + (j ? 2 : 0), by = y + j * 8 + 2;
      const sway = frame && j === 0 ? 1 : 0;
      P.p(bx + 1 + sway, by, C.tallL); P.p(bx + sway, by + 1, C.tallL); P.p(bx + 2 + sway, by + 1, C.tallL);
      P.r(bx, by + 2, 3, 3, C.tallD); P.p(bx + 1, by + 1, C.tallD);
      P.p(bx + 1, by + 2, "#4cb05a");
    }
}
/* the front blades drawn over a character standing in tall grass */
function tallOverlay(P, x, y, frame) {
  for (let i = 0; i < 4; i++) {
    const bx = x + i * 4, by = y + 10, s = frame ? (i % 2) : 0;
    P.p(bx + 1 + s, by, C.tallL); P.p(bx + s, by + 1, C.tallL); P.p(bx + 2 + s, by + 1, C.tallL);
    P.r(bx, by + 2, 4, 4, C.tall); P.r(bx + 1, by + 2, 2, 4, C.tallD);
  }
}

function drawPath(P, x, y, tx, ty, nb) {
  for (let by = 0; by < 8; by++) for (let bx = 0; bx < 8; bx++) {
    const n = vnoise((tx * 8 + bx) / 5, (ty * 8 + by) / 5, 21) + BAYER[(by % 4) * 4 + (bx % 4)] * 0.12;
    P.r(x + bx * 2, y + by * 2, 2, 2, n > 0.66 ? C.pathL : n < 0.34 ? C.pathM : C.path);
  }
  // pebbles with a highlight
  for (let k = 0; k < 4; k++) if (hash(tx, ty, k + 30) < 0.55) {
    const px = x + 1 + ((hash(tx, ty, k + 40) * 13) | 0), py = y + 1 + ((hash(tx, ty, k + 50) * 13) | 0);
    P.r(px, py, 2, 1, C.pathD); P.p(px, py - 1, "#f6e6c0");
  }
  // ragged grass edges
  const edge = (horizontal, fixed, inward) => {
    for (let i = 0; i < T; i++) {
      const d = hash(tx * 31 + i, ty * 17 + fixed, 90) < 0.45 ? 2 : 1;
      for (let k = 0; k < d; k++) {
        const px = horizontal ? x + i : x + fixed + inward * k, py = horizontal ? y + fixed + inward * k : y + i;
        P.p(px, py, k === d - 1 ? C.grassD : C.grass);
      }
      const ex = horizontal ? x + i : x + fixed + inward * d, ey = horizontal ? y + fixed + inward * d : y + i;
      P.p(ex, ey, C.pathE);
    }
  };
  if (!nb.u) edge(true, 0, 1);
  if (!nb.d) edge(true, T - 1, -1);
  if (!nb.l) edge(false, 0, 1);
  if (!nb.r) edge(false, T - 1, -1);
}

function drawPlaza(P, x, y, tx, ty) {
  // Broad, bevelled paving: fewer seams than the original brick texture.
  P.r(x, y, T, T, C.plazaD);
  P.r(x + 1, y + 1, 14, 14, hash(tx, ty, 33) > .65 ? C.plazaC : C.plaza);
  P.r(x + 1, y + 1, 14, 1, C.plazaL); P.r(x + 1, y + 1, 1, 13, C.plazaL);
  P.r(x + 2, y + 14, 13, 1, C.plazaB);
  if ((tx + ty) % 4 === 0) { P.r(x + 6, y + 7, 4, 2, C.plazaB); P.r(x + 7, y + 6, 2, 4, C.plazaB); }
}

function drawWater(P, x, y, tx, ty, nb, frame) {
  P.r(x, y, T, T, C.water);
  // depth mottling
  for (let by = 0; by < 4; by++) for (let bx = 0; bx < 4; bx++)
    if (vnoise((tx * 4 + bx) / 3, (ty * 4 + by) / 3, 44) < 0.38) P.r(x + bx * 4, y + by * 4, 4, 4, C.waterM);
  const o = frame ? 3 : 0;
  for (let j = 0; j < 2; j++) {
    const wy = y + 4 + j * 8, wx = x + ((hash(tx, ty, j) * 7) | 0) + (j ? o : -o) + 4;
    P.r(Math.max(x, wx), wy, 4, 1, C.waterL); P.r(Math.max(x, wx + 1), wy - 1, 2, 1, C.waterL);
  }
  if (!nb.u) { P.r(x, y, T, 2, C.foam); P.r(x, y + 2, T, 1, C.waterL); for (let i = frame; i < T; i += 4) P.p(x + i, y + 3, C.foam); }
  if (!nb.d) { P.r(x, y + T - 2, T, 2, C.waterD); }
  if (!nb.l) { P.r(x, y, 2, T, C.foam); P.r(x + 2, y, 1, T, C.waterL); }
  if (!nb.r) { P.r(x + T - 2, y, 2, T, C.foam); P.r(x + T - 3, y, 1, T, C.waterL); }
}

function drawLily(P, x, y) {
  P.r(x + 4, y + 6, 7, 4, "#2f8a40"); P.r(x + 5, y + 5, 5, 6, "#2f8a40");
  P.r(x + 5, y + 6, 5, 3, "#4cb05a");
  P.p(x + 7, y + 7, C.water); P.p(x + 8, y + 8, C.water);
  P.p(x + 6, y + 5, "#f8a0c8"); P.p(x + 5, y + 5, "#f8a0c8"); P.p(x + 6, y + 4, "#ffffff"); P.p(x + 7, y + 5, "#f8d0e0");
}

function drawSand(P, x, y, tx, ty) {
  for (let by = 0; by < 8; by++) for (let bx = 0; bx < 8; bx++) {
    const n = vnoise((tx * 8 + bx) / 6, (ty * 8 + by) / 6, 61) + BAYER[(by % 4) * 4 + (bx % 4)] * 0.12;
    P.r(x + bx * 2, y + by * 2, 2, 2, n > 0.64 ? C.sandL : C.sand);
  }
  for (let k = 0; k < 4; k++) if (hash(tx, ty, k + 60) < 0.6)
    P.p(x + ((hash(tx, ty, k + 70) * 15) | 0), y + ((hash(tx, ty, k + 80) * 15) | 0), C.sandD);
  if (hash(tx, ty, 66) < 0.12) { const sx = x + 6, sy = y + 9; P.r(sx, sy, 3, 2, "#f8d8e0"); P.p(sx + 1, sy - 1, "#ffffff"); P.p(sx + 1, sy + 1, "#e0a0b0"); }
}

function drawDeck(P, x, y, tx, ty) {
  P.r(x, y, T, T, C.deck);
  for (let j = 0; j < 4; j++) {
    P.r(x, y + j * 4 + 3, T, 1, C.deckD);
    P.r(x, y + j * 4, T, 1, C.deckL);
    const seam = ((tx * 7 + j * 5) % 16);
    P.r(x + seam, y + j * 4, 1, 3, C.deckD);
  }
}

function drawConcrete(P, x, y, tx, ty, nb) {
  P.r(x, y, T, T, C.conc);
  P.r(x, y + T - 1, T, 1, C.concD); P.r(x + T - 1, y, 1, T, C.concD);
  P.r(x, y, T, 1, C.concL);
  if (hash(tx, ty, 3) < 0.3) P.p(x + 5, y + 9, C.concD);
  const stripe = (sx, sy, w, h) => {
    for (let i = 0; i < Math.max(w, h); i += 4) {
      if (w > h) { P.r(sx + i, sy, 2, h, "#f8d030"); P.r(sx + i + 2, sy, 2, h, "#303030"); }
      else { P.r(sx, sy + i, w, 2, "#f8d030"); P.r(sx, sy + i + 2, w, 2, "#303030"); }
    }
  };
  if (!nb.u) stripe(x, y, T, 2);
  if (!nb.d) stripe(x, y + T - 2, T, 2);
  if (!nb.l) stripe(x, y, 2, T);
  if (!nb.r) stripe(x + T - 2, y, 2, T);
}

function drawTrack(P, x, y, tx, ty, nb) {
  P.r(x, y, T, T, C.track);
  if (nb.l && nb.r) { P.r(x, y + 7, T, 1, C.trackL); }
  else if (nb.u && nb.d) { P.r(x + 7, y, 1, T, C.trackL); }
  if (hash(tx, ty, 4) < 0.4) P.p(x + 3, y + 3, "#b04c30");
}

function drawFence(P, x, y, nb) {
  drawGrass(P, x, y, 0, 0);
  P.r(x, y + 12, T, 2, "rgba(0,0,0,.15)");
  const horiz = nb.l || nb.r || !(nb.u || nb.d);
  if (horiz) {
    P.r(x, y + 4, T, 2, C.fence); P.r(x, y + 6, T, 1, C.fenceD);
    P.r(x, y + 8, T, 2, C.fence); P.r(x, y + 10, T, 1, C.fenceD);
  } else {
    P.r(x + 6, y, 4, T, C.fence); P.r(x + 9, y, 1, T, C.fenceD);
  }
  P.r(x + 6, y + 1, 4, 12, C.fence); P.r(x + 6, y + 1, 4, 1, "#ffffff"); P.r(x + 9, y + 1, 1, 12, C.fenceD);
  P.r(x + 6, y + 12, 4, 1, C.fenceD);
}

function drawBush(P, x, y, tx, ty) {
  drawGrass(P, x, y, tx, ty);
  P.r(x + 2, y + 13, 12, 2, "rgba(0,0,0,.18)");
  P.r(x + 2, y + 4, 12, 10, C.bushD); P.r(x + 1, y + 6, 14, 6, C.bushD); P.r(x + 4, y + 2, 8, 2, C.bushD);
  P.r(x + 3, y + 4, 10, 8, "#3a8a3c"); P.r(x + 2, y + 6, 12, 5, "#3a8a3c");
  P.r(x + 4, y + 4, 4, 3, "#5cb84c"); P.p(x + 10, y + 6, "#5cb84c"); P.p(x + 5, y + 9, "#2c6c30");
  if (hash(tx, ty, 9) < 0.4) { P.p(x + 9, y + 5, "#f04848"); P.p(x + 6, y + 10, "#f04848"); }
}

function drawRock(P, x, y, tx, ty) {
  drawGrass(P, x, y, tx, ty);
  P.r(x + 3, y + 12, 11, 2, "rgba(0,0,0,.18)");
  P.r(x + 3, y + 6, 10, 7, "#58606c"); P.r(x + 4, y + 5, 8, 8, "#58606c");
  P.r(x + 4, y + 6, 8, 6, "#98a0ac"); P.r(x + 5, y + 6, 4, 2, "#c4ccd4"); P.r(x + 9, y + 10, 3, 2, "#78808c");
}

/* ==========================================================================
   PROPS & BUILDINGS   (each returns a canvas; base = bottom edge)
   ========================================================================== */
const OUT = "#2a2230";

function roofShingles(P, x, y, w, h, base, dark, light) {
  P.r(x, y, w, h, OUT);
  P.r(x + 1, y + 1, w - 2, h - 2, base);
  const band = Math.max(2, (h * 0.18) | 0);
  P.r(x + 1, y + h - 1 - band, w - 2, band, dark);
  for (let j = 4; j < h - 2; j += 5) {
    P.r(x + 1, y + j, w - 2, 1, dark);
    const off = (j / 5) % 2 ? 4 : 0;
    for (let i = off + 2; i < w - 2; i += 8) { P.r(x + i, y + j - 4, 1, 4, dark); P.p(x + i + 1, y + j - 4, light); P.p(x + i + 2, y + j - 4, light); }
  }
  P.r(x + 1, y + 1, w - 2, 2, light); P.r(x + 1, y + 1, w - 2, 1, "#ffffff40");
}

function windowPx(P, x, y, w = 12, h = 10, lit = false) {
  P.r(x - 1, y - 1, w + 2, h + 2, OUT);
  P.r(x, y, w, h, "#ffffff");
  P.r(x + 1, y + 1, w - 2, h - 2, lit ? "#ffe680" : "#78b8e8");
  if (!lit) { P.p(x + 2, y + 2, "#d8f0ff"); P.p(x + 3, y + 2, "#d8f0ff"); P.p(x + 2, y + 3, "#d8f0ff"); }
  P.r(x + (w >> 1), y + 1, 1, h - 2, "#ffffff"); P.r(x + 1, y + (h >> 1), w - 2, 1, "#ffffff");
}

function buildHouse(lit) {
  const W = 80, H = 72, [c, x] = makeCanvas(W, H), P = new Px(x);
  P.r(6, 68, 70, 4, "rgba(0,0,0,.18)");
  // chimney
  P.box(58, 2, 9, 16, "#b05040", OUT); P.r(57, 2, 11, 3, OUT); P.r(59, 7, 7, 1, "#8a3828"); P.r(59, 12, 7, 1, "#8a3828");
  roofShingles(P, 1, 10, 78, 32, "#d85848", "#a83828", "#f08068");
  P.r(4, 42, 72, 2, "#7a2018");
  // walls with siding
  P.box(5, 43, 70, 25, "#f4e4c4", OUT); for (let j = 46; j < 64; j += 3) P.r(6, j, 68, 1, "#e6d2ac"); P.r(6, 64, 68, 3, "#d8c098");
  P.r(6, 44, 68, 1, "#c8b088");
  windowPx(P, 12, 47, 14, 10, lit); windowPx(P, 54, 47, 14, 10, lit);
  for (const wx of [12, 54]) { P.r(wx - 4, 46, 3, 12, OUT); P.r(wx - 3, 47, 1, 10, "#4a8a50"); P.r(wx + 15, 46, 3, 12, OUT); P.r(wx + 16, 47, 1, 10, "#4a8a50");
    P.r(wx, 47, 2, 9, lit ? "#f8c060" : "#e86060"); P.r(wx + 12, 47, 2, 9, lit ? "#f8c060" : "#e86060"); }
  P.r(49, 48, 3, 4, OUT); P.r(50, 49, 1, 2, lit ? "#fff0a0" : "#f8d048");
  P.r(12, 58, 14, 3, "#8a5a30"); P.p(14, 57, "#f04848"); P.p(18, 57, "#f8e048"); P.p(22, 57, "#f04848");
  P.r(54, 58, 14, 3, "#8a5a30"); P.p(56, 57, "#f8e048"); P.p(60, 57, "#f04848"); P.p(64, 57, "#f8e048");
  // door
  P.box(33, 46, 14, 22, "#8a5030", OUT); P.r(35, 48, 10, 8, "#a0643c"); P.r(35, 58, 10, 8, "#a0643c");
  P.p(44, 57, "#f8d030"); P.r(31, 67, 18, 1, "#c8b088");
  return c;
}

function buildDegreeHall(lit) {
  const W = 112, H = 104, [c, x] = makeCanvas(W, H), P = new Px(x);
  const V = "#6a2ca8", Vd = "#4b1d7a", Vl = "#9a62d8", ST = "#ece6d8", STd = "#c8bea8";
  P.r(4, 100, 106, 4, "rgba(0,0,0,.18)");
  // flag pole
  P.r(104, 2, 2, 40, "#606878"); P.r(104, 0, 2, 2, "#f8d030");
  P.r(94, 3, 10, 7, V); P.r(94, 3, 10, 1, Vl); P.r(97, 5, 3, 3, "#ffffff");
  // roof band
  roofShingles(P, 2, 30, 108, 20, V, Vd, Vl);
  // pediment
  for (let i = 0; i < 18; i++) P.r(56 - 4 - i * 2, 14 + i, 8 + i * 4, 1, i === 0 ? OUT : ST);
  for (let i = 0; i < 18; i++) { P.p(56 - 4 - i * 2, 14 + i, OUT); P.p(56 + 3 + i * 2, 14 + i, OUT); }
  // torch emblem
  P.r(54, 22, 4, 9, "#c89a30"); P.r(53, 21, 6, 2, "#c89a30"); P.r(54, 16, 4, 5, "#f8a030"); P.r(55, 14, 2, 3, "#f8e048");
  // frieze with sign
  P.r(4, 50, 104, 9, OUT); P.r(5, 51, 102, 7, Vd);
  const label = "DEGREE HALL"; P.text(label, 56 - (textW(label) >> 1), 52, "#ffffff");
  // facade
  P.box(6, 58, 100, 42, ST, OUT);
  for (let j = 62; j < 96; j += 6) P.r(7, j, 98, 1, STd);
  // columns
  for (const cx of [10, 26, 78, 94]) {
    P.r(cx, 59, 8, 37, OUT); P.r(cx + 1, 59, 6, 37, "#ffffff"); P.r(cx + 5, 59, 2, 37, "#d0d0dc");
    P.r(cx - 1, 59, 10, 3, OUT); P.r(cx, 60, 8, 1, "#ffffff");
  }
  windowPx(P, 40, 64, 8, 12, lit); windowPx(P, 64, 64, 8, 12, lit);
  // grand door
  P.r(49, 66, 14, 30, OUT); P.r(50, 67, 12, 29, "#6a3c20"); P.r(50, 67, 12, 3, "#8a5030");
  P.r(55, 70, 1, 26, OUT); P.p(53, 82, "#f8d030"); P.p(58, 82, "#f8d030");
  // steps
  P.r(6, 96, 100, 2, "#d8d0c0"); P.r(4, 98, 104, 2, "#c4bcac");
  return c;
}

function buildLab(lit) {
  const W = 112, H = 104, [c, x] = makeCanvas(W, H), P = new Px(x);
  P.r(4, 100, 106, 4, "rgba(0,0,0,.18)");
  // dish
  P.r(22, 22, 3, 8, "#606878");
  P.r(12, 6, 22, 16, OUT); P.r(13, 7, 20, 14, "#e8eef4"); P.r(15, 9, 16, 10, "#c8d4e0"); P.r(17, 11, 4, 2, "#ffffff");
  P.line(22, 14, 30, 4, "#606878"); P.r(29, 2, 4, 4, "#f04848");
  // antenna
  P.r(96, 6, 2, 24, "#606878"); P.r(93, 12, 8, 1, "#606878"); P.r(94, 18, 6, 1, "#606878");
  // roof
  P.r(2, 28, 108, 22, OUT); P.r(3, 29, 106, 20, "#46557a");
  for (let i = 6; i < 106; i += 12) P.r(3 + i, 29, 1, 20, "#3a4868");
  P.r(3, 29, 106, 3, "#6a7ca4"); P.r(3, 46, 106, 3, "#2e3a58");
  // walls
  P.box(5, 49, 102, 51, "#dfe6ee", OUT); P.r(6, 92, 100, 7, "#b8c4d2");
  // glass strips
  const glass = (gx, gw) => {
    P.r(gx - 1, 55, gw + 2, 18, OUT); P.r(gx, 56, gw, 16, lit ? "#9ff0ff" : "#48c8e8");
    for (let i = 4; i < gw; i += 9) P.r(gx + i, 56, 1, 16, "#2a90b0");
    P.line(gx + 2, 70, gx + 10, 58, "#c8f8ff"); P.line(gx + 6, 70, gx + 14, 58, "#c8f8ff");
  };
  glass(10, 34); glass(68, 34);
  // sign
  P.r(42, 52, 28, 9, OUT); P.r(43, 53, 26, 7, "#1e2a44"); P.text("AI LAB", 56 - (textW("AI LAB") >> 1), 54, "#40e8ff");
  // sliding door
  P.r(46, 63, 20, 37, OUT); P.r(47, 64, 18, 36, "#5ad0f0"); P.r(55, 64, 2, 36, OUT);
  P.line(49, 96, 53, 68, "#c8f8ff"); P.line(59, 96, 63, 68, "#c8f8ff");
  return c;
}

function buildGym(lit) {
  const W = 96, H = 96, [c, x] = makeCanvas(W, H), P = new Px(x);
  P.r(4, 92, 90, 4, "rgba(0,0,0,.18)");
  // roof
  roofShingles(P, 1, 16, 94, 30, "#e88838", "#b85c20", "#f8b060");
  P.r(4, 46, 88, 2, "#8a4010");
  // big sign
  P.r(22, 0, 52, 22, OUT); P.r(23, 1, 50, 20, "#d83838"); P.r(24, 2, 48, 18, "#f04848");
  P.r(23, 1, 50, 1, "#ff9090");
  P.text("GYM", 48 - (textW("GYM", 3) >> 1), 4, "#ffffff", 3);
  const db = (dx) => { P.r(dx, 10, 6, 2, "#ffffff"); P.r(dx - 1, 8, 2, 6, "#ffffff"); P.r(dx + 5, 8, 2, 6, "#ffffff"); };
  db(26); db(64);
  // walls
  P.box(5, 47, 86, 45, "#f2dcb0", OUT);
  for (let j = 52; j < 90; j += 5) {
    P.r(6, j, 84, 1, "#dcc08c");
    for (let i = (j / 5) % 2 ? 6 : 10; i < 88; i += 8) P.r(6 + i, j - 4, 1, 4, "#dcc08c");
  }
  windowPx(P, 12, 56, 16, 12, lit); windowPx(P, 68, 56, 16, 12, lit);
  // double door
  P.r(35, 58, 26, 34, OUT); P.r(36, 59, 24, 33, "#60b8e8"); P.r(47, 59, 2, 33, OUT);
  P.line(38, 88, 44, 62, "#c8f0ff"); P.line(51, 88, 57, 62, "#c8f0ff");
  P.r(39, 52, 18, 6, OUT); P.r(40, 53, 16, 4, "#40c040"); P.text("OPEN", 41, 53, "#ffffff");
  P.r(30, 91, 36, 1, "#c8a870");
  return c;
}

function buildRocketBase() {
  const W = 48, H = 84, [c, x] = makeCanvas(W, H), P = new Px(x);
  P.r(2, 80, 46, 4, "rgba(0,0,0,.2)");
  // gantry tower
  P.r(1, 8, 10, 70, OUT); P.r(2, 9, 8, 68, "#d84838");
  for (let j = 10; j < 76; j += 8) { P.line(2, j, 9, j + 7, "#a02818"); P.line(9, j, 2, j + 7, "#a02818"); }
  P.r(10, 20, 8, 2, "#a02818"); P.r(10, 44, 8, 2, "#a02818");
  P.r(0, 6, 12, 3, OUT); P.p(5, 4, "#f8e048"); P.p(5, 5, "#f8e048");
  // platform
  P.r(4, 72, 44, 10, OUT); P.r(5, 73, 42, 8, "#8a9098");
  for (let i = 5; i < 46; i += 6) { P.r(i, 73, 3, 2, "#f8d030"); P.r(i + 3, 73, 3, 2, "#303030"); }
  P.r(22, 74, 16, 6, "#505860");
  return c;
}

function buildRocket() {
  const W = 28, H = 68, [c, x] = makeCanvas(W, H), P = new Px(x);
  // nose cone
  for (let i = 0; i < 14; i++) {
    const w = 2 + Math.floor(i * 0.9) * 2, xx = 14 - (w >> 1);
    P.r(xx - 1, i, w + 2, 1, OUT); P.r(xx, i, w, 1, "#e84040");
    P.r(xx, i, Math.max(1, w >> 2), 1, "#ff8080");
  }
  // body
  P.r(6, 13, 16, 44, OUT); P.r(7, 13, 14, 44, "#f4f4f8"); P.r(17, 13, 4, 44, "#c8c8d4"); P.r(8, 13, 2, 44, "#ffffff");
  P.r(7, 20, 14, 2, "#e84040");
  // window
  P.r(10, 25, 8, 8, OUT); P.r(11, 26, 6, 6, "#4c94f0"); P.r(12, 27, 2, 2, "#c8f0ff");
  P.text("MG", 9, 38, "#6a2ca8");
  P.r(7, 46, 14, 2, "#e84040");
  // fins
  for (let i = 0; i < 12; i++) {
    P.r(5 - (i >> 1), 46 + i, 2 + (i >> 1), 1, "#e84040"); P.p(4 - (i >> 1), 46 + i, OUT);
    P.r(21, 46 + i, 2 + (i >> 1), 1, "#c83030"); P.p(23 + (i >> 1), 46 + i, OUT);
  }
  // nozzle
  P.r(9, 57, 10, 7, OUT); P.r(10, 57, 8, 6, "#707880"); P.r(10, 57, 3, 6, "#9aa0a8");
  return c;
}

function buildTelescope() {
  const [c, x] = makeCanvas(20, 28), P = new Px(x);
  P.r(3, 25, 14, 3, "rgba(0,0,0,.2)");
  P.line(10, 14, 4, 26, OUT, 2); P.line(10, 14, 16, 26, OUT, 2); P.line(10, 14, 10, 26, "#606878", 2);
  // tube
  for (let i = 0; i < 12; i++) { P.r(3 + i, 15 - i, 4, 4, OUT); }
  for (let i = 0; i < 12; i++) { P.r(4 + i, 16 - i, 2, 2, i < 3 ? "#6a2ca8" : "#f0f0f8"); }
  P.r(15, 2, 5, 5, OUT); P.r(16, 3, 3, 3, "#4c94f0"); P.p(16, 3, "#c8f0ff");
  P.r(8, 12, 5, 4, "#a8b0bc");
  return c;
}

function buildDesk() {
  const [c, x] = makeCanvas(32, 30), P = new Px(x);
  P.r(1, 27, 30, 3, "rgba(0,0,0,.2)");
  // monitor
  P.r(5, 0, 20, 14, OUT); P.r(6, 1, 18, 12, "#3a4458"); P.r(7, 2, 16, 10, "#0e1424");
  P.r(13, 14, 4, 2, OUT); P.r(11, 15, 8, 1, OUT);
  // desk
  P.r(0, 16, 32, 4, OUT); P.r(1, 16, 30, 3, "#b07840"); P.r(1, 16, 30, 1, "#d09858");
  P.r(1, 20, 3, 9, OUT); P.r(28, 20, 3, 9, OUT); P.r(2, 20, 1, 8, "#8a5a30"); P.r(29, 20, 1, 8, "#8a5a30");
  // keyboard + mug
  P.r(8, 16, 14, 2, "#d8dce4"); P.r(8, 17, 14, 1, "#a8b0bc");
  P.r(25, 12, 4, 5, OUT); P.r(26, 13, 2, 3, "#f0f0f0"); P.p(29, 14, OUT); P.p(26, 10, "#c8c8c8"); P.p(27, 9, "#c8c8c8");
  // pc tower
  P.r(19, 20, 8, 9, OUT); P.r(20, 21, 6, 7, "#3a4458"); P.p(21, 22, "#40e8ff"); P.r(21, 25, 4, 1, "#6a2ca8");
  return c;
}
/* animated code on the monitor */
function deskScreen(P, x, y, t) {
  const cols = ["#40e8ff", "#a0f070", "#f8d030", "#f080c0", "#ffffff"];
  const scroll = Math.floor(t * 4);
  for (let r = 0; r < 4; r++) {
    const n = scroll + r;
    const ind = (n % 3) * 2, len = 3 + ((n * 7) % 9);
    P.r(x + 1 + ind, y + 1 + r * 2, Math.min(len, 14 - ind), 1, cols[n % cols.length]);
  }
  if (Math.floor(t * 2) % 2) P.r(x + 2, y + 9, 2, 1, "#ffffff");
}

function buildBookshelf() {
  const [c, x] = makeCanvas(32, 34), P = new Px(x);
  P.r(1, 31, 30, 3, "rgba(0,0,0,.2)");
  // plant on top
  P.r(22, 0, 3, 3, "#3a9a48"); P.r(20, 2, 7, 3, "#5cb84c"); P.r(21, 5, 5, 3, "#c86438");
  P.r(0, 8, 32, 24, OUT); P.r(1, 9, 30, 22, "#8a5a30");
  const books = ["#d84848", "#4878d8", "#48a858", "#f8c040", "#9a58c8", "#f08048", "#40b8c8", "#e8e8e8"];
  for (let s = 0; s < 3; s++) {
    const sy = 10 + s * 7;
    P.r(2, sy, 28, 6, "#4a2c18");
    let bx = 3, k = s * 3;
    while (bx < 28) {
      const w = 2 + ((k * 5) % 2), h = 4 + ((k * 3) % 2);
      P.r(bx, sy + 6 - h, w, h, books[k % books.length]); P.r(bx, sy + 6 - h, w, 1, "rgba(255,255,255,.35)");
      bx += w + (k % 4 === 0 ? 1 : 0); k++;
    }
    P.r(1, sy + 6, 30, 1, "#b07840");
  }
  return c;
}

function buildBike() {
  const [c, x] = makeCanvas(16, 12), P = new Px(x);
  const B = "#1e78c8";
  const wheel = (cx) => { P.r(cx - 3, 6, 6, 6, OUT); P.r(cx - 2, 7, 4, 4, "#d0d4dc"); P.r(cx - 1, 8, 2, 2, OUT); };
  wheel(4); wheel(12);
  P.line(4, 9, 7, 5, B, 1); P.line(7, 5, 12, 5, B, 1); P.line(12, 9, 11, 3, B, 1); P.line(7, 5, 8, 9, B, 1); P.line(8, 9, 4, 9, B, 1);
  P.r(5, 3, 4, 1, OUT); P.r(10, 2, 3, 1, OUT); P.r(11, 4, 3, 2, "#2a2230");
  return c;
}
function buildBikeDock() {
  const [c, x] = makeCanvas(52, 26), P = new Px(x);
  P.r(2, 23, 50, 3, "rgba(0,0,0,.2)");
  // kiosk
  P.r(1, 0, 8, 22, OUT); P.r(2, 1, 6, 20, "#1e78c8"); P.r(3, 3, 4, 5, "#c8f0ff"); P.r(3, 10, 4, 1, "#ffffff"); P.r(3, 12, 4, 1, "#ffffff");
  P.r(2, 22, 6, 2, OUT);
  // rail
  P.r(10, 20, 42, 3, OUT); P.r(11, 20, 40, 2, "#8a9098");
  const bike = buildBike();
  for (let i = 0; i < 3; i++) { x.drawImage(bike, 11 + i * 14, 10); P.r(14 + i * 14, 18, 2, 3, OUT); }
  return c;
}

function buildBillboardFrame() {
  const [c, x] = makeCanvas(52, 58), P = new Px(x);
  P.r(6, 55, 42, 3, "rgba(0,0,0,.2)");
  P.r(9, 36, 4, 20, OUT); P.r(10, 36, 2, 20, "#8a5a30");
  P.r(39, 36, 4, 20, OUT); P.r(40, 36, 2, 20, "#8a5a30");
  P.r(0, 0, 52, 38, OUT); P.r(1, 1, 50, 36, "#f0f0f0"); P.r(3, 3, 46, 32, "#1a2240");
  P.r(3, 3, 46, 6, "#2a3460"); P.text("DASHBOARDS", 5, 4, "#f8d030");
  return c;
}
/* animated chart on the billboard */
function billboardScreen(P, x, y, t) {
  const cols = ["#4f8eff", "#2dd4bf", "#f472b6", "#fbbf24", "#4ade80", "#fb923c"];
  for (let i = 0; i < 6; i++) {
    const h = 6 + Math.round(8 + 6 * Math.sin(t * 1.6 + i * 1.1));
    P.r(x + 3 + i * 7, y + 30 - h, 5, h, cols[i]);
  }
  let px0 = x + 4, py0 = y + 14;
  for (let i = 1; i < 10; i++) {
    const px1 = x + 4 + i * 4.4, py1 = y + 14 + Math.round(3 * Math.sin(t * 2 + i));
    P.line(px0, py0, px1, py1, "#ffffff"); px0 = px1; py0 = py1;
  }
}

function buildChalkboard() {
  const [c, x] = makeCanvas(36, 32), P = new Px(x);
  P.r(2, 29, 32, 3, "rgba(0,0,0,.2)");
  P.line(6, 20, 3, 31, OUT, 2); P.line(30, 20, 33, 31, OUT, 2);
  P.r(0, 0, 36, 24, OUT); P.r(1, 1, 34, 22, "#a06c3c"); P.r(3, 3, 30, 18, "#2e5e3e");
  const W = "#e8f0e8";
  // axes + call payoff (hockey stick) + put payoff dashed
  P.r(6, 17, 24, 1, W); P.r(6, 5, 1, 13, W);
  P.line(7, 16, 17, 16, "#f8e048"); P.line(17, 16, 28, 6, "#f8e048");
  for (let i = 0; i < 10; i += 2) P.p(8 + i, 7 + i, "#f080c0");
  P.text("F&O", 22, 13, W);
  P.r(26, 21, 6, 2, "#ffffff");
  return c;
}

function buildTrophyCase() {
  const [c, x] = makeCanvas(48, 46), P = new Px(x);
  P.r(2, 43, 44, 3, "rgba(0,0,0,.2)");
  P.r(0, 0, 48, 44, OUT); P.r(1, 1, 46, 42, "#8a5a30"); P.r(1, 1, 46, 3, "#b07840");
  P.r(3, 5, 42, 36, "#d8ecf8");
  P.r(3, 22, 42, 2, "#8a5a30"); P.r(3, 39, 42, 2, "#8a5a30");
  const G = "#f8c830", Gd = "#c89018", Gl = "#fff0a0";
  const cup = (cx, by, s) => {
    P.r(cx - 4 - s, by - 13 - s, 9 + s * 2, 6 + s, G); P.r(cx - 3 - s, by - 7, 7 + s * 2, 1, G);
    P.r(cx - 1, by - 7, 3, 3, Gd); P.r(cx - 3, by - 4, 7, 2, Gd); P.r(cx - 4, by - 2, 9, 2, "#8a5a30");
    P.p(cx - 6 - s, by - 12 - s, G); P.p(cx - 6 - s, by - 11 - s, G); P.p(cx + 6 + s, by - 12 - s, G); P.p(cx + 6 + s, by - 11 - s, G);
    P.r(cx - 3 - s, by - 12 - s, 2, 3, Gl);
  };
  cup(12, 22, 0); cup(24, 22, 1); cup(36, 22, 0);
  // medals on bottom shelf
  const medal = (mx, col) => { P.line(mx - 2, 26, mx, 31, "#4878d8"); P.line(mx + 2, 26, mx, 31, "#d84848"); P.r(mx - 2, 31, 5, 5, OUT); P.r(mx - 1, 32, 3, 3, col); };
  medal(10, G); medal(20, "#d0d8e0"); medal(30, G); medal(39, "#d08848");
  // glass glare
  P.line(5, 20, 12, 6, "rgba(255,255,255,.7)"); P.line(28, 38, 34, 26, "rgba(255,255,255,.6)");
  return c;
}

function buildMailbox() {
  const [c, x] = makeCanvas(16, 24), P = new Px(x);
  P.r(3, 21, 11, 3, "rgba(0,0,0,.2)");
  P.r(7, 10, 3, 13, OUT); P.r(8, 10, 1, 13, "#8a5a30");
  P.r(2, 2, 12, 10, OUT); P.r(3, 3, 10, 8, "#d84040"); P.r(3, 3, 10, 2, "#f07070"); P.r(4, 7, 8, 1, "#a02828");
  P.r(13, 0, 2, 7, OUT); P.r(14, 1, 2, 3, "#f8d030");
  return c;
}

function buildSign() {
  const [c, x] = makeCanvas(16, 18), P = new Px(x);
  P.r(3, 15, 11, 3, "rgba(0,0,0,.2)");
  P.r(3, 9, 2, 8, OUT); P.r(11, 9, 2, 8, OUT);
  P.r(0, 1, 16, 11, OUT); P.r(1, 2, 14, 9, "#c89060"); P.r(1, 2, 14, 1, "#e0b080");
  P.r(3, 4, 10, 1, "#7a4a28"); P.r(3, 6, 8, 1, "#7a4a28"); P.r(3, 8, 9, 1, "#7a4a28");
  return c;
}

function buildFountain(frame) {
  const [c, x] = makeCanvas(48, 48), P = new Px(x);
  const oct = (ox, oy, w, h, cut, color) => {
    P.r(ox + cut, oy, w - cut * 2, h, color);
    P.r(ox, oy + cut, w, h - cut * 2, color);
    for (let i = 1; i < cut; i++) {
      P.r(ox + cut - i, oy + i, w - (cut - i) * 2, 1, color);
      P.r(ox + cut - i, oy + h - 1 - i, w - (cut - i) * 2, 1, color);
    }
  };
  oct(3, 31, 43, 16, 5, '#436e5740');
  oct(2, 20, 44, 25, 6, '#426356');
  oct(3, 20, 42, 22, 6, '#c1c5a2');
  oct(4, 20, 40, 18, 5, '#f2ecd1');
  oct(7, 23, 34, 13, 4, '#397f8d');
  oct(8, 24, 32, 11, 4, C.water);
  P.r(10, 28 + frame, 7, 1, C.waterL); P.r(30, 29 - frame, 7, 1, C.foam);
  P.r(17, 33, 14, 1, C.waterL);
  // A stepped stone pedestal and a small crown of falling water.
  P.box(18, 28, 12, 4, '#d4d1b2', '#557367');
  P.r(21, 16, 6, 13, '#658e85'); P.r(21, 16, 2, 13, '#d9e8d2');
  oct(16, 12, 16, 7, 2, '#446e66'); oct(17, 12, 14, 5, 2, '#c7e2c7');
  P.r(19, 13, 10, 2, C.waterL);
  P.r(23, 4, 2, 10, C.foam); P.r(22, 6, 1, 6, C.waterL);
  for (const [dx,dy] of [[17,18],[29,19],[14,25],[33,24],[22,2]]) {
    P.r(dx, dy + frame * 2, 2, 3, C.waterL); P.p(dx, dy + frame * 2, C.foam);
  }
  return c;
}

function buildLamp() {
  const [c, x] = makeCanvas(16, 36), P = new Px(x);
  P.r(4, 33, 8, 3, "rgba(0,0,0,.2)");
  P.r(7, 10, 3, 24, OUT); P.r(8, 10, 1, 24, "#58607a");
  P.r(5, 32, 7, 3, OUT);
  P.r(3, 2, 10, 10, OUT); P.r(4, 4, 8, 6, "#fff0a0"); P.r(4, 3, 8, 1, "#58607a"); P.r(6, 0, 4, 2, OUT);
  return c;
}

function buildBench() {
  const [c, x] = makeCanvas(32, 18), P = new Px(x);
  P.r(2, 15, 28, 3, "rgba(0,0,0,.2)");
  P.r(0, 2, 32, 5, OUT); P.r(1, 3, 30, 3, "#c48c54"); P.r(1, 3, 30, 1, "#e0a868");
  P.r(0, 8, 32, 4, OUT); P.r(1, 9, 30, 2, "#c48c54");
  P.r(3, 12, 2, 5, OUT); P.r(27, 12, 2, 5, OUT);
  return c;
}

function buildPedestal() {
  const [c, x] = makeCanvas(16, 22), P = new Px(x);
  P.r(1, 19, 14, 3, "rgba(0,0,0,.2)");
  P.r(1, 4, 14, 4, OUT); P.r(2, 5, 12, 2, "#f0ece4");
  P.r(3, 8, 10, 10, OUT); P.r(4, 8, 8, 10, "#dcd6ca"); P.r(10, 8, 2, 10, "#b8b0a0");
  P.r(1, 17, 14, 4, OUT); P.r(2, 18, 12, 2, "#f0ece4");
  return c;
}

function buildCap(main, dark, tassel) {
  const [c, x] = makeCanvas(18, 14), P = new Px(x);
  // board (flat diamond-ish)
  P.r(1, 3, 16, 4, OUT); P.r(3, 1, 12, 8, OUT);
  P.r(2, 4, 14, 2, main); P.r(4, 2, 10, 6, main); P.r(4, 2, 10, 1, "rgba(255,255,255,.3)");
  // skull
  P.r(4, 7, 10, 5, OUT); P.r(5, 7, 8, 4, dark);
  // button + tassel
  P.p(9, 4, tassel); P.line(9, 4, 15, 6, tassel); P.r(15, 6, 1, 5, tassel); P.r(14, 10, 3, 3, tassel);
  return c;
}

function buildDumbbellRack() {
  const [c, x] = makeCanvas(32, 20), P = new Px(x);
  P.r(1, 17, 30, 3, "rgba(0,0,0,.2)");
  P.r(0, 6, 32, 3, OUT); P.r(0, 13, 32, 3, OUT);
  P.r(1, 9, 2, 8, OUT); P.r(29, 9, 2, 8, OUT);
  const db = (dx, dy, col) => { P.r(dx, dy + 1, 8, 1, "#a8b0bc"); P.r(dx - 1, dy - 1, 3, 5, col); P.r(dx + 6, dy - 1, 3, 5, col); };
  db(5, 2, "#d84848"); db(18, 2, "#4878d8"); db(5, 9, "#303848"); db(18, 9, "#303848");
  return c;
}

function buildKiosk() {
  const [c, x] = makeCanvas(18, 30), P = new Px(x);
  P.r(3, 27, 12, 3, "rgba(0,0,0,.2)");
  P.r(7, 14, 4, 14, OUT); P.r(8, 14, 2, 14, "#606878");
  P.r(0, 0, 18, 16, OUT); P.r(1, 1, 16, 14, "#2c8a4c"); P.r(1, 1, 16, 2, "#48b868");
  P.text("ROSI", 2, 4, "#ffffff");
  P.r(5, 10, 8, 3, "#a0e070"); P.r(7, 9, 4, 1, "#a0e070"); P.p(9, 12, "#2c8a4c");
  return c;
}

function buildSolar() {
  const [c, x] = makeCanvas(32, 22), P = new Px(x);
  P.r(2, 19, 28, 3, "rgba(0,0,0,.2)");
  P.r(6, 12, 2, 8, OUT); P.r(24, 12, 2, 8, OUT);
  for (let j = 0; j < 12; j++) P.r(1 + (j >> 1), j + 1, 30 - (j >> 1), 1, OUT);
  for (let j = 1; j < 11; j++) P.r(2 + (j >> 1), j + 1, 28 - (j >> 1), 1, "#2a4c9a");
  for (let i = 4; i < 30; i += 6) P.line(i, 2, i + 4, 11, "#8ab0f0");
  P.r(4, 6, 26, 1, "#8ab0f0");
  P.p(9, 3, "#ffffff"); P.p(10, 3, "#ffffff"); P.p(9, 4, "#ffffff");
  return c;
}

/* software studio: market stall with awning, laptop and a QR sign */
function buildStall() {
  const [c, x] = makeCanvas(36, 40), P = new Px(x);
  P.r(2, 37, 32, 3, "rgba(0,0,0,.2)");
  // poles
  P.r(2, 10, 3, 28, OUT); P.r(3, 10, 1, 28, "#d8dce4"); P.r(31, 10, 3, 28, OUT); P.r(32, 10, 1, 28, "#d8dce4");
  // awning (stripes)
  P.r(0, 0, 36, 12, OUT);
  for (let i = 0; i < 34; i += 6) { P.r(1 + i, 1, 3, 9, "#6a2ca8"); P.r(4 + i, 1, 3, 9, "#f4f4f8"); }
  for (let i = 0; i < 36; i += 6) { P.r(i, 10, 6, 3, OUT); P.r(i + 1, 10, 4, 2, i % 12 ? "#f4f4f8" : "#6a2ca8"); }
  // counter
  P.r(1, 26, 34, 12, OUT); P.r(2, 27, 32, 10, "#c48c54"); P.r(2, 27, 32, 2, "#e0a868");
  P.text("APPS", 10, 31, "#ffffff");
  // laptop with M logo
  P.r(6, 16, 14, 10, OUT); P.r(7, 17, 12, 8, "#0e1424"); P.text("M", 11, 18, "#40e8ff");
  P.r(4, 25, 18, 2, "#a8b0bc");
  // QR sign
  P.r(23, 14, 10, 12, OUT); P.r(24, 15, 8, 8, "#ffffff");
  const q = ["11011", "10101", "01110", "10011", "11101"];
  for (let j = 0; j < 5; j++) for (let i = 0; i < 5; i++) if (q[j][i] === "1") P.p(25 + i, 16 + j, "#2a2230");
  P.r(27, 23, 2, 3, OUT);
  return c;
}

/* wind turbine painted live (blades rotate) */
function drawTurbine(P, bx, by, t) {
  // tower: bx,by = bottom centre
  P.r(bx - 5, by - 3, 11, 3, "rgba(0,0,0,.2)");
  for (let j = 0; j < 56; j++) {
    const w = 2 + Math.round((j / 56) * 3);
    P.r(bx - w, by - j, w * 2, 1, OUT);
    P.r(bx - w + 1, by - j, w * 2 - 2, 1, j % 9 === 0 ? "#d0d4dc" : "#f4f6fa");
  }
  const hx = bx, hy = by - 58;
  P.r(hx - 4, hy - 3, 8, 6, OUT); P.r(hx - 3, hy - 2, 6, 4, "#f4f6fa");
  for (let k = 0; k < 3; k++) {
    const a = t * 2.2 + (k * Math.PI * 2) / 3;
    const ex = hx + Math.cos(a) * 20, ey = hy + Math.sin(a) * 20;
    P.line(hx, hy, ex, ey, OUT, 2);
    P.line(hx, hy, hx + Math.cos(a) * 18, hy + Math.sin(a) * 18, "#ffffff", 1);
  }
  P.r(hx - 1, hy - 1, 3, 3, "#d84848");
}

/* ==========================================================================
   TREES: procedurally shaded canopies (light from top-left) + outline pass
   ========================================================================== */
const TREE_PALS = {
  green:  { k: "#28503e", d: "#36784e", m: "#529959", l: "#80bd65", h: "#badf83", T: "#9a6438", t: "#6a4020", Th: "#b8804c" },
  lime:   { k: "#34553c", d: "#4a8346", m: "#6ca653", l: "#99c872", h: "#d1e998", T: "#9a6438", t: "#6a4020", Th: "#b8804c" },
  autumn: { k: "#5a2410", d: "#b04a1c", m: "#e07228", l: "#f09a3c", h: "#f8cc60", T: "#8a5830", t: "#5a3818", Th: "#a87048" },
  pine:   { k: "#103626", d: "#1c5a3a", m: "#287448", l: "#3a9058", h: "#5cb070", T: "#7a5030", t: "#4a3018", Th: "#9a6a40" },
  blossom:{ k: "#6a2a48", d: "#c8608c", m: "#e88ab0", l: "#f8b0cc", h: "#ffe0ec", T: "#8a5830", t: "#5a3818", Th: "#a87048" },
};

function buildTree(W, H, blobs, trunk, pal, seed) {
  const [c, x] = makeCanvas(W, H), P = new Px(x);
  const { x: tx, w: tw, y: ty } = trunk;
  P.r(tx - 1, ty, tw + 2, H - ty - 1, pal.k);
  P.r(tx, ty, tw, H - ty - 2, pal.T);
  P.r(tx + tw - 2, ty, 2, H - ty - 2, pal.t);
  P.r(tx, ty + 1, 1, H - ty - 3, pal.Th);
  P.r(tx - 2, H - 3, tw + 4, 2, pal.k);
  P.r(tx - 1, H - 3, tw + 1, 1, pal.T);
  // Stepped leaf masses with a consistent upper-left light source.
  // Clustered shapes keep the sprite readable at native GBA-like scale.
  const crown = (cx, cy, r, fill, light) => {
    for (let dy = -r; dy <= r; dy++) {
      const half = Math.round(Math.sqrt(Math.max(0, r * r - dy * dy)));
      P.r(cx - half, cy + dy, half * 2 + 1, 1, pal.k);
      if (half > 1 && Math.abs(dy) < r) P.r(cx - half + 1, cy + dy, half * 2 - 1, 1, dy > r * .45 ? pal.d : fill);
      if (dy < 0 && half > 2) P.r(cx - half + 2, cy + dy, Math.max(1, half - 1), 1, light);
    }
  };
  const clusters = blobs.slice().sort((a,b) => b[1]-a[1]);
  for (const [cx,cy,r] of clusters) crown(Math.round(cx), Math.round(cy), Math.floor(r), pal.m, pal.l);
  for (let i=0;i<blobs.length;i++) {
    const [cx,cy,r] = blobs[i];
    P.r(Math.round(cx-r*.35), Math.round(cy-r*.5), Math.max(2, Math.floor(r*.55)), 1, pal.h);
    if (W > 24) { P.r(Math.round(cx+2), Math.round(cy+2), 3, 1, pal.d); P.p(Math.round(cx+4), Math.round(cy+1), pal.d); }
  }
  return c;
}

function buildPine(pal, seed) {
  const W = 16, H = 26, [c, x] = makeCanvas(W, H), P = new Px(x);
  P.r(6, 20, 4, 5, pal.k); P.r(7, 20, 2, 4, pal.T);
  const mask = new Int8Array(W * H);
  const tiers = [[1, 8, 4], [5, 13, 6], [9, 20, 7.5]];
  for (const [top, bot, hw] of tiers)
    for (let yy = top; yy <= bot; yy++) {
      const w = Math.round(((yy - top + 1) / (bot - top + 1)) * hw);
      for (let xx = 8 - w; xx < 8 + w; xx++) mask[yy * W + xx] = yy === bot ? 2 : xx < 8 ? 3 : 1;
    }
  const m = (px, py) => px >= 0 && py >= 0 && px < W && py < H ? mask[py * W + px] : 0;
  for (let py = 0; py < H; py++) for (let px = 0; px < W; px++) {
    const v = m(px, py); if (!v) continue;
    const edge = !m(px - 1, py) || !m(px + 1, py) || !m(px, py - 1);
    P.p(px, py, edge ? pal.k : v === 3 ? (hash(px, py, seed) < 0.2 ? pal.h : pal.l) : v === 2 ? pal.d : (hash(px, py, seed) < 0.2 ? pal.d : pal.m));
  }
  return c;
}

/* ==========================================================================
   MORE PROPS
   ========================================================================== */
function buildDoghouse() {
  const [c, x] = makeCanvas(22, 22), P = new Px(x);
  P.r(2, 19, 19, 3, "rgba(0,0,0,.2)");
  for (let i = 0; i < 9; i++) { P.r(10 - i, 1 + i, 2 + i * 2, 1, OUT); P.r(11 - i, 1 + i, i * 2, 1, i < 2 ? "#f07060" : "#d84838"); }
  P.r(1, 9, 20, 2, OUT);
  P.box(3, 10, 16, 10, "#c89060", OUT); for (let j = 12; j < 19; j += 3) P.r(4, j, 14, 1, "#a87048");
  P.r(8, 12, 6, 8, OUT); P.r(9, 13, 4, 7, "#3a2418");
  P.r(5, 4 + 8, 2, 1, "#ffffff"); P.p(4, 11, "#ffffff"); P.p(4, 13, "#ffffff"); P.p(7, 11, "#ffffff"); P.p(7, 13, "#ffffff");
  return c;
}
function buildHydrant() {
  const [c, x] = makeCanvas(12, 18), P = new Px(x);
  P.r(1, 15, 10, 3, "rgba(0,0,0,.2)");
  P.r(3, 1, 6, 3, OUT); P.r(4, 2, 4, 2, "#e04040");
  P.r(2, 4, 8, 12, OUT); P.r(3, 4, 6, 11, "#e04040"); P.r(3, 4, 2, 11, "#ff7878"); P.r(7, 4, 2, 11, "#b02828");
  P.r(0, 7, 12, 4, OUT); P.r(1, 8, 10, 2, "#c83030"); P.p(5, 8, "#f8d048");
  P.r(1, 15, 10, 2, OUT);
  return c;
}
function buildCrate() {
  const [c, x] = makeCanvas(16, 16), P = new Px(x);
  P.r(1, 14, 15, 2, "rgba(0,0,0,.2)");
  P.box(1, 2, 14, 13, "#c49058", OUT); P.r(2, 3, 12, 1, "#e0b078");
  P.r(2, 8, 12, 1, "#8a5a30"); P.line(2, 3, 13, 13, "#8a5a30"); P.r(2, 3, 1, 11, "#a87040"); P.r(13, 3, 1, 11, "#a87040");
  return c;
}
function buildBarrel() {
  const [c, x] = makeCanvas(14, 18), P = new Px(x);
  P.r(1, 15, 12, 3, "rgba(0,0,0,.2)");
  P.r(2, 1, 10, 3, OUT); P.r(1, 3, 12, 13, OUT); P.r(2, 3, 10, 12, "#b07038"); P.r(3, 3, 3, 12, "#d09050"); P.r(9, 3, 2, 12, "#8a5028");
  P.r(3, 2, 8, 2, "#7a4a20"); P.r(2, 6, 10, 1, "#606878"); P.r(2, 12, 10, 1, "#606878");
  return c;
}
function buildPot() {
  const [c, x] = makeCanvas(14, 18), P = new Px(x);
  P.r(2, 15, 10, 3, "rgba(0,0,0,.2)");
  for (const [a, b, r] of [[7, 5, 4], [4, 7, 3], [10, 7, 3]]) { P.r(a - r, b - r + 1, r * 2, r * 2 - 2, "#2c7a34"); P.r(a - r + 1, b - r, r * 2 - 2, r * 2, "#2c7a34"); }
  P.r(4, 2, 3, 2, "#5cb84c"); P.p(9, 4, "#5cb84c"); P.p(6, 1, "#f080c0"); P.p(10, 3, "#f8e048"); P.p(3, 6, "#f080c0");
  P.r(2, 9, 10, 2, OUT); P.r(3, 11, 8, 5, OUT); P.r(3, 9, 8, 1, "#e08850"); P.r(4, 11, 6, 4, "#c86838"); P.r(4, 11, 2, 4, "#e08850");
  return c;
}
function buildSignpost(a, b) {
  const [c, x] = makeCanvas(24, 26), P = new Px(x);
  P.r(7, 23, 10, 3, "rgba(0,0,0,.2)");
  P.r(11, 4, 3, 21, OUT); P.r(12, 4, 1, 21, "#a87048");
  const arrow = (y, label, right) => {
    const x0 = right ? 7 : 2;
    P.r(x0, y, 15, 7, OUT); P.r(x0 + 1, y + 1, 13, 5, "#e0b078");
    if (right) { P.r(x0 + 15, y + 1, 1, 5, OUT); P.r(x0 + 16, y + 2, 1, 3, OUT); P.r(x0 + 14, y + 2, 2, 3, "#e0b078"); }
    else { P.r(x0 - 1, y + 1, 1, 5, OUT); P.r(x0 - 2, y + 2, 1, 3, OUT); P.r(x0 - 1, y + 2, 2, 3, "#e0b078"); }
    P.text(label, x0 + 2, y + 1, "#5a3818");
  };
  arrow(3, a, true); arrow(12, b, false);
  return c;
}
function buildWindsock() {
  const [c, x] = makeCanvas(24, 30), P = new Px(x);
  P.r(3, 27, 8, 3, "rgba(0,0,0,.2)");
  P.r(5, 2, 2, 26, OUT);
  for (let i = 0; i < 4; i++) { const w = 4 - (i >> 1); P.r(7 + i * 4, 3 + (i >> 1), 4, 7 - i, i % 2 ? "#ffffff" : "#f07830"); }
  P.r(6, 2, 2, 2, "#f8d048");
  return c;
}

/* ==========================================================================
   NEW LANDMARKS
   ========================================================================== */
function buildStage() {
  const W = 72, H = 50, [c, x] = makeCanvas(W, H), P = new Px(x);
  P.r(2, 46, 68, 4, "rgba(0,0,0,.2)");
  // posts + string lights
  P.r(2, 0, 3, 32, OUT); P.r(3, 0, 1, 32, "#a8b0bc"); P.r(67, 0, 3, 32, OUT); P.r(68, 0, 1, 32, "#a8b0bc");
  const bulbs = ["#ff6a6a", "#f8d048", "#8cdcff", "#a8e848", "#ff9ad8"];
  for (let i = 0; i < 16; i++) { const bx = 6 + i * 4, by = 2 + Math.round(Math.sin((i / 15) * Math.PI) * 3); P.p(bx, by - 1, "#3a3a48"); P.r(bx, by, 2, 2, bulbs[i % 5]); }
  // backdrop banner
  P.r(6, 8, 60, 20, OUT); P.r(7, 9, 58, 18, "#4b1d7a"); P.r(7, 9, 58, 2, "#6a2ca8");
  P.text("CONFERENCE", 36 - (textW("CONFERENCE") >> 1), 12, "#ffffff");
  P.text("275 ATTENDEES", 36 - (textW("275 ATTENDEES") >> 1), 19, "#f8d048");
  // speakers
  for (const sx of [9, 55]) { P.r(sx, 22, 9, 12, OUT); P.r(sx + 1, 23, 7, 10, "#30303a"); P.r(sx + 3, 25, 3, 3, "#5a5a68"); P.r(sx + 3, 29, 3, 3, "#5a5a68"); }
  // stage deck
  P.r(0, 30, W, 18, OUT);
  P.r(1, 31, W - 2, 8, "#c48c54"); for (let i = 1; i < W - 1; i += 9) P.r(i, 31, 1, 8, "#a87040"); P.r(1, 31, W - 2, 1, "#e0b078");
  P.r(1, 39, W - 2, 8, "#8a5a30"); for (let i = 3; i < W - 1; i += 5) P.r(i, 39, 1, 8, "#6a4020");
  // podium + mic
  P.r(31, 20, 11, 15, OUT); P.r(32, 21, 9, 13, "#a87040"); P.r(32, 21, 9, 2, "#d8a46c"); P.r(34, 25, 5, 4, "#6a2ca8"); P.p(36, 26, "#f8d048");
  P.r(36, 15, 1, 6, OUT); P.r(35, 13, 3, 3, "#30303a");
  // steps
  P.r(16, 46, 12, 2, "#a87040");
  return c;
}

function buildWizardTower() {
  const W = 52, H = 96, [c, x] = makeCanvas(W, H), P = new Px(x);
  P.r(4, 92, 46, 4, "rgba(0,0,0,.2)");
  // cone roof
  for (let i = 0; i < 40; i++) {
    const w = 2 + Math.round(i * 1.1) * 2, xx = 26 - (w >> 1);
    P.r(xx - 1, 4 + i, w + 2, 1, OUT); P.r(xx, 4 + i, w, 1, "#5a2a98");
    P.r(xx, 4 + i, Math.max(1, w >> 2), 1, "#7a48c0"); P.r(xx + w - Math.max(1, w >> 3), 4 + i, Math.max(1, w >> 3), 1, "#3e1a70");
  }
  for (const [sx, sy] of [[22, 20], [30, 28], [18, 34], [33, 38], [25, 31], [14, 41]]) { P.p(sx, sy, "#f8d048"); P.p(sx + 1, sy, "#fff3a0"); }
  P.r(24, 0, 4, 5, "#f8d048"); P.p(25, -1, "#f8d048");
  P.r(1, 43, 50, 3, OUT); P.r(2, 43, 48, 2, "#7a48c0");
  // stone body
  P.r(6, 46, 40, 46, OUT); P.r(7, 46, 38, 46, "#a8b0c8");
  for (let j = 48; j < 90; j += 5) for (let i = (j / 5) % 2 ? 7 : 11; i < 44; i += 8) { P.r(i, j, 7, 4, (i + j) % 3 ? "#b8c0d4" : "#9aa2bc"); }
  P.r(7, 46, 6, 46, "rgba(255,255,255,.18)"); P.r(38, 46, 7, 46, "rgba(20,10,60,.2)");
  // balcony with crystal ball
  P.r(12, 54, 28, 3, OUT); P.r(13, 54, 26, 2, "#7a48c0");
  P.r(20, 44, 12, 11, OUT); P.r(21, 45, 10, 9, "#c8f0ff"); P.r(21, 45, 10, 9, "#a0e8ff"); P.r(22, 46, 3, 2, "#ffffff"); P.r(26, 49, 4, 4, "#b48ce8");
  P.r(23, 55, 6, 3, "#c89a30");
  // window + door
  P.r(21, 62, 10, 12, OUT); P.r(22, 63, 8, 11, "#f8d048"); P.r(25, 63, 1, 11, OUT); P.r(22, 68, 8, 1, OUT);
  P.r(19, 78, 14, 14, OUT); P.r(20, 79, 12, 13, "#5a3418"); P.r(20, 79, 12, 2, "#7a4a24"); P.p(29, 86, "#f8d048");
  return c;
}

function buildPlane() {
  const W = 64, H = 40, [c, x] = makeCanvas(W, H), P = new Px(x);
  P.r(8, 35, 50, 5, "rgba(0,0,0,.18)");
  // tail fin
  for (let i = 0; i < 14; i++) { P.r(4 + (i >> 1), 2 + i, 9 - (i >> 1), 1, OUT); P.r(5 + (i >> 1), 2 + i, 7 - (i >> 1), 1, "#d84848"); }
  P.p(7, 5, "#ffffff"); P.p(8, 6, "#ffffff");
  // fuselage
  P.r(2, 15, 56, 14, OUT);
  P.r(3, 16, 54, 12, "#f4f6fa"); P.r(3, 16, 54, 2, "#ffffff"); P.r(3, 25, 54, 3, "#c8ccd8");
  P.r(56, 17, 4, 10, OUT); P.r(57, 18, 4, 8, OUT); P.r(56, 18, 3, 8, "#f4f6fa"); P.r(60, 20, 2, 4, OUT);
  P.r(3, 22, 54, 2, "#4a78d8");
  for (let i = 14; i < 50; i += 4) P.r(i, 18, 2, 2, "#2a3a58");
  P.r(51, 18, 6, 3, "#2a3a58"); P.p(52, 18, "#8cdcff");
  // wing + engine
  P.r(20, 25, 22, 5, OUT); P.r(21, 26, 20, 3, "#a8b0c0"); P.r(21, 26, 20, 1, "#d0d6e0");
  P.r(26, 29, 12, 5, OUT); P.r(27, 30, 10, 3, "#8a92a4"); P.r(27, 30, 2, 3, "#2a2a38");
  // gear
  P.r(14, 29, 2, 4, OUT); P.r(13, 32, 4, 4, OUT); P.r(14, 33, 2, 2, "#5a5a68");
  P.r(46, 29, 2, 4, OUT); P.r(45, 32, 4, 4, OUT); P.r(46, 33, 2, 2, "#5a5a68");
  P.text("ACI", 8, 18, "#4a78d8");
  return c;
}

function buildTower() {
  const W = 28, H = 64, [c, x] = makeCanvas(W, H), P = new Px(x);
  P.r(3, 60, 22, 4, "rgba(0,0,0,.2)");
  P.r(12, 0, 2, 10, OUT); P.r(11, 0, 4, 2, "#ff4040");
  P.r(3, 9, 22, 4, OUT); P.r(4, 10, 20, 2, "#5a6478");
  P.r(4, 13, 20, 12, OUT); P.r(5, 14, 18, 10, "#58c8e8"); for (let i = 9; i < 22; i += 5) P.r(i, 14, 1, 10, "#2a6a88"); P.line(6, 22, 10, 15, "#c8f8ff");
  P.r(2, 25, 24, 3, OUT); P.r(3, 25, 22, 2, "#d0d6e0");
  P.r(8, 28, 12, 34, OUT); P.r(9, 28, 10, 34, "#e8ecf2"); P.r(16, 28, 3, 34, "#c0c6d2");
  for (let j = 33; j < 58; j += 8) P.r(12, j, 4, 3, "#58c8e8");
  P.r(11, 55, 6, 7, "#3a4458");
  return c;
}

function buildStore(lit) {
  const W = 96, H = 80, [c, x] = makeCanvas(W, H), P = new Px(x);
  P.r(4, 76, 90, 4, "rgba(0,0,0,.2)");
  // parapet + sign
  P.r(2, 4, 92, 12, OUT); P.r(3, 5, 90, 10, "#c8b8a0");
  P.r(24, 0, 48, 14, OUT); P.r(25, 1, 46, 12, "#b01c2e"); P.r(25, 1, 46, 2, "#e04050");
  P.text("DEPT STORE", 48 - (textW("DEPT STORE") >> 1), 5, "#ffffff");
  // brick facade
  P.r(4, 16, 88, 60, OUT); P.r(5, 16, 86, 60, "#b8604a");
  for (let j = 18; j < 74; j += 4) { P.r(5, j, 86, 1, "#9a4a38"); for (let i = (j / 4) % 2 ? 5 : 9; i < 90; i += 8) P.r(i, j - 3, 1, 3, "#9a4a38"); }
  // upper windows
  for (const wx of [12, 32, 56, 76]) windowPx(P, wx, 21, 10, 9, lit);
  // awning
  P.r(3, 34, 90, 9, OUT);
  for (let i = 4; i < 92; i += 8) { P.r(i, 35, 4, 7, "#b01c2e"); P.r(i + 4, 35, 4, 7, "#ffffff"); }
  for (let i = 4; i < 92; i += 8) { P.r(i, 42, 4, 3, OUT); P.r(i + 1, 42, 2, 2, "#b01c2e"); }
  // display windows with goods
  const disp = (dx) => {
    P.r(dx, 47, 28, 22, OUT); P.r(dx + 1, 48, 26, 20, lit ? "#fff0b0" : "#cfe8f8");
    P.r(dx + 4, 54, 6, 12, "#6a2ca8"); P.r(dx + 5, 51, 4, 3, "#f0c8a0");        // mannequin
    P.r(dx + 16, 60, 8, 6, "#f8d048"); P.r(dx + 18, 58, 4, 2, OUT);              // shopping bag
    P.line(dx + 2, 66, dx + 9, 50, "rgba(255,255,255,.7)");
  };
  disp(9); disp(59);
  // revolving door
  P.r(39, 46, 18, 30, OUT); P.r(40, 47, 16, 29, "#8cc8e8"); P.r(47, 47, 2, 29, OUT); P.r(40, 60, 16, 1, OUT);
  P.r(36, 75, 24, 1, "#7a3a2a");
  return c;
}

function buildStation(lit) {
  const W = 96, H = 86, [c, x] = makeCanvas(W, H), P = new Px(x);
  P.r(4, 82, 90, 4, "rgba(0,0,0,.2)");
  // gable with clock
  for (let i = 0; i < 18; i++) { P.r(48 - 6 - i * 2, 8 + i, 12 + i * 4, 1, OUT); P.r(48 - 5 - i * 2, 8 + i, 10 + i * 4, 1, "#3a7a68"); }
  P.r(42, 13, 12, 12, OUT); P.r(43, 14, 10, 10, "#fffbe8"); P.r(47, 15, 2, 5, OUT); P.r(48, 19, 4, 1, OUT);
  roofShingles(P, 2, 24, 92, 20, "#3a7a68", "#2a5a4c", "#58a088");
  P.r(5, 44, 86, 2, "#1e3e34");
  // walls
  P.box(6, 45, 84, 37, "#f0e2c4", OUT);
  for (let j = 50; j < 80; j += 4) P.r(7, j, 82, 1, "#dccaa4");
  P.r(4, 52, 88, 7, OUT); P.r(5, 53, 86, 5, "#2a5a4c");
  P.text("STATION", 48 - (textW("STATION") >> 1), 54, "#f8d048");
  for (const wx of [12, 26, 62, 76]) windowPx(P, wx, 62, 9, 12, lit);
  P.r(39, 61, 18, 21, OUT); P.r(40, 62, 16, 20, "#6a4024"); P.r(47, 62, 2, 20, OUT); P.p(45, 72, "#f8d048"); P.p(50, 72, "#f8d048");
  P.r(36, 81, 24, 1, "#b8a888");
  return c;
}

function buildTrainCar(engine) {
  const W = 46, H = 26, [c, x] = makeCanvas(W, H), P = new Px(x);
  const B = "#2aa198", Bd = "#1c7a72", Bl = "#5cd0c4";
  P.r(1, 2, 44, 18, OUT);
  P.r(2, 3, 42, 16, B); P.r(2, 3, 42, 2, Bl); P.r(2, 15, 42, 4, Bd);
  P.r(2, 12, 42, 2, "#f8d048");
  if (engine) {
    P.r(36, 3, 8, 16, "#f4f6fa"); P.r(36, 3, 8, 2, "#ffffff"); P.r(38, 5, 5, 6, "#2a3a58"); P.p(39, 6, "#8cdcff");
    P.r(43, 13, 2, 3, "#f8e070"); P.text("FM", 6, 6, "#ffffff");
    for (let i = 16; i < 34; i += 6) P.r(i, 5, 4, 5, "#2a3a58");
  } else for (let i = 4; i < 42; i += 7) { P.r(i, 5, 5, 5, "#2a3a58"); P.p(i + 1, 6, "#8cdcff"); }
  P.r(0, 18, W, 2, "#3a3a48");
  for (const wx of [7, 15, 31, 39]) { P.r(wx - 3, 19, 6, 6, OUT); P.r(wx - 2, 20, 4, 4, "#5a5a68"); P.p(wx - 1, 21, "#a8b0bc"); }
  return c;
}

function buildWindTunnel() {
  const W = 88, H = 44, [c, x] = makeCanvas(W, H), P = new Px(x);
  P.r(4, 40, 82, 4, "rgba(0,0,0,.2)");
  const M = "#c8ccd8", Md = "#9aa0b0", Ml = "#eef0f6";
  // contraction (bell) left
  for (let i = 0; i < 22; i++) { const h = 30 - Math.round(i * 0.55); const y0 = 21 - (h >> 1); P.r(2 + i, y0, 1, h, OUT); P.r(2 + i, y0 + 1, 1, h - 2, i < 4 ? Ml : M); P.p(2 + i, y0 + h - 2, Md); }
  P.r(2, 6, 2, 30, OUT); P.r(3, 8, 1, 26, "#606878");
  for (let j = 9; j < 34; j += 3) P.r(3, j, 1, 1, "#ffffff");
  // test section (glass)
  P.r(24, 12, 24, 18, OUT); P.r(25, 13, 22, 16, "#b8e8f8"); P.r(25, 13, 22, 2, "#e0f8ff");
  // airfoil model + streamlines
  P.r(31, 20, 10, 2, "#f8d048"); P.r(30, 21, 2, 1, "#f8d048"); P.r(41, 21, 3, 1, "#d0a020"); P.r(35, 22, 1, 4, "#606878");
  for (const ly of [16, 25]) P.r(26, ly, 20, 1, "rgba(255,255,255,.9)");
  // diffuser right
  for (let i = 0; i < 26; i++) { const h = 18 + Math.round(i * 0.45); const y0 = 21 - (h >> 1); P.r(48 + i, y0, 1, h, OUT); P.r(48 + i, y0 + 1, 1, h - 2, M); P.p(48 + i, y0 + 1, Ml); P.p(48 + i, y0 + h - 2, Md); }
  // fan housing
  P.r(74, 6, 12, 32, OUT); P.r(75, 7, 10, 30, "#5a6478"); P.r(77, 15, 6, 14, "#30384a"); P.line(78, 16, 82, 28, "#a8b0bc"); P.line(82, 16, 78, 28, "#a8b0bc");
  // supports + label
  for (const sx of [10, 34, 60]) { P.r(sx, 32, 3, 9, OUT); P.r(sx + 1, 32, 1, 8, "#8a92a4"); }
  P.r(50, 2, 22, 7, OUT); P.r(51, 3, 20, 5, "#4a78d8"); P.text("IJERT", 52, 3, "#ffffff");
  return c;
}

function buildFuelTank() {
  const [c, x] = makeCanvas(20, 34), P = new Px(x);
  P.r(2, 31, 16, 3, "rgba(0,0,0,.2)");
  P.r(3, 4, 14, 28, OUT); P.r(4, 2, 12, 3, OUT); P.r(5, 1, 10, 2, OUT);
  P.r(4, 4, 12, 27, "#f0f2f6"); P.r(4, 4, 3, 27, "#ffffff"); P.r(13, 4, 3, 27, "#c8ccd8");
  P.r(5, 2, 10, 2, "#dde2ea"); P.r(4, 12, 12, 4, "#d84848"); P.r(4, 12, 3, 4, "#f07070");
  P.text("LOX", 5, 19, "#4a78d8");
  P.r(5, 30, 2, 3, OUT); P.r(13, 30, 2, 3, OUT);
  return c;
}
function buildRadar() {
  const [c, x] = makeCanvas(28, 30), P = new Px(x);
  P.r(4, 27, 20, 3, "rgba(0,0,0,.2)");
  P.r(11, 16, 6, 12, OUT); P.r(12, 16, 4, 11, "#8a92a4"); P.r(8, 26, 12, 3, OUT);
  for (let i = 0; i < 9; i++) P.r(4 + i, 2 + i, 20 - i * 2, 1, OUT);
  for (let i = 0; i < 8; i++) P.r(5 + i, 2 + i, 18 - i * 2, 1, i < 2 ? "#ffffff" : "#e0e6ee");
  P.r(4, 2, 20, 1, OUT); P.line(14, 9, 14, 3, "#5a6478"); P.r(13, 1, 3, 3, "#d84848");
  return c;
}
function buildCone() {
  const [c, x] = makeCanvas(12, 14), P = new Px(x);
  P.r(1, 12, 10, 2, "rgba(0,0,0,.2)");
  P.r(0, 10, 12, 3, OUT); P.r(1, 11, 10, 1, "#f07830");
  for (let i = 0; i < 9; i++) { P.r(5 - (i >> 1), 1 + i, 2 + (i >> 1) * 2, 1, OUT); P.r(6 - (i >> 1), 1 + i, Math.max(0, (i >> 1) * 2), 1, i > 3 && i < 6 ? "#ffffff" : "#f07830"); }
  return c;
}
function drawHelipad(P, x, y) {
  // 3x3 tiles: painted circle + H on the concrete
  const cx = x + 24, cy = y + 24;
  for (let j = 0; j < 48; j++) for (let i = 0; i < 48; i++) {
    const d = Math.hypot(i + 0.5 - 24, j + 0.5 - 24);
    if (d < 21 && d > 18) P.p(x + i, y + j, "#f8d048");
  }
  P.r(cx - 8, cy - 9, 3, 18, "#ffffff"); P.r(cx + 5, cy - 9, 3, 18, "#ffffff"); P.r(cx - 5, cy - 1, 10, 3, "#ffffff");
}

/* extra ground tiles */
function drawRunway(P, x, y, tx, ty, nb) {
  P.r(x, y, T, T, "#5c6068");
  for (let k = 0; k < 4; k++) if (hash(tx, ty, k + 200) < 0.5) P.p(x + ((hash(tx, ty, k + 210) * 15) | 0), y + ((hash(tx, ty, k + 220) * 15) | 0), "#6c7078");
  if (!nb.u) { P.r(x, y, T, 1, "#3c4048"); P.r(x, y + 2, T, 1, "#f4f4f4"); }
  if (!nb.d) { P.r(x, y + T - 1, T, 1, "#3c4048"); P.r(x, y + T - 3, T, 1, "#f4f4f4"); }
  if (nb.u && nb.d === false) {}
  if (nb.d && !nb.u) {}
  // centre dashes on the boundary between the two runway rows
  if (!nb.u && nb.d) { if (tx % 3 !== 0) P.r(x + 2, y + T - 1, 10, 1, "#f8f0c8"); }
  if (nb.u && !nb.d) { if (tx % 3 !== 0) P.r(x + 2, y, 10, 1, "#f8f0c8"); }
}
function drawRails(P, x, y, tx, ty, onPath) {
  if (!onPath) {
    P.r(x, y, T, T, "#a89880");
    for (let k = 0; k < 6; k++) P.p(x + ((hash(tx, ty, k + 300) * 16) | 0), y + ((hash(tx, ty, k + 310) * 16) | 0), hash(tx, ty, k + 320) < 0.5 ? "#8a7c66" : "#c4b49c");
    for (let i = 1; i < T; i += 5) { P.r(x + i, y + 2, 3, 12, "#6a4a30"); P.r(x + i, y + 2, 3, 1, "#8a6444"); }
  }
  for (const ry of [4, 10]) { P.r(x, y + ry, T, 2, "#5a6070"); P.r(x, y + ry, T, 1, "#c8ccd8"); }
}

/* ==========================================================================
   SPRITE REGISTRY (built once at startup)
   ========================================================================== */
const SPR = {};
function buildSprites() {
  SPR.mehul = buildCharacter(PALS.mehul);
  SPR.guide = buildCharacter(PALS.guide);
  SPR.jogger = buildCharacter(PALS.jogger);
  SPR.pilot = buildCharacter(PALS.pilot);
  SPR.conductor = buildCharacter(PALS.conductor);
  SPR.dogR = [spr(DOG_A, DOG_PAL), spr(DOG_B, DOG_PAL)];
  SPR.dogL = SPR.dogR.map(mirror);
  SPR.dogSitR = spr(DOG_SIT, DOG_PAL); SPR.dogSitL = mirror(SPR.dogSitR);
  SPR.robot = [spr(ROBOT, ROBOT_PAL), spr(ROBOT, ROBOT_PAL2)];
  const SMALL = [[12, 8, 7], [7, 14, 6], [17, 14, 6], [12, 19, 6]], SMALL_T = { x: 10, w: 4, y: 23 };
  const BIG = [[16, 11, 9], [9, 16, 7.5], [23, 16, 7.5], [12, 22, 8], [20, 22, 8], [16, 6, 6]], BIG_T = { x: 13, w: 6, y: 27 };
  SPR.tree = [
    buildTree(24, 30, SMALL, SMALL_T, TREE_PALS.green, 1),
    buildTree(24, 30, SMALL, SMALL_T, TREE_PALS.lime, 2),
    buildPine(TREE_PALS.pine, 3),
    buildTree(24, 30, SMALL, SMALL_T, TREE_PALS.autumn, 4),
    buildTree(24, 30, SMALL, SMALL_T, TREE_PALS.blossom, 5),
  ];
  SPR.bigTree = [
    buildTree(32, 40, BIG, BIG_T, TREE_PALS.green, 6),
    buildTree(32, 40, BIG, BIG_T, TREE_PALS.lime, 7),
    buildTree(32, 40, BIG, BIG_T, TREE_PALS.autumn, 8),
    buildTree(32, 40, BIG, BIG_T, TREE_PALS.blossom, 9),
  ];
  SPR.bird = [spr(BIRD_STAND, BIRD_PAL), spr(BIRD_FLY, BIRD_PAL)];
  SPR.birdL = SPR.bird.map(mirror);
  SPR.cat = spr(CAT_SLEEP, CAT_PAL);
  SPR.fly = [spr(FLY_1, FLY_PAL), spr(FLY_2, FLY_PAL)];
  for (const lit of [false, true]) {
    const k = lit ? "Lit" : "";
    SPR["house" + k] = buildHouse(lit);
    SPR["hall" + k] = buildDegreeHall(lit);
    SPR["lab" + k] = buildLab(lit);
    SPR["gym" + k] = buildGym(lit);
  }
  SPR.rocketBase = buildRocketBase();
  SPR.rocket = buildRocket();
  SPR.telescope = buildTelescope();
  SPR.desk = buildDesk();
  SPR.bookshelf = buildBookshelf();
  SPR.bikeDock = buildBikeDock();
  SPR.billboard = buildBillboardFrame();
  SPR.chalkboard = buildChalkboard();
  SPR.trophyCase = buildTrophyCase();
  SPR.mailbox = buildMailbox();
  SPR.sign = buildSign();
  SPR.fountain = [buildFountain(0), buildFountain(1)];
  SPR.lamp = buildLamp();
  SPR.bench = buildBench();
  SPR.pedestal = buildPedestal();
  SPR.capNYU = buildCap("#57068c", "#3a0460", "#b48ce8");
  SPR.capCU = buildCap("#b01c2e", "#7c1020", "#f8c830");
  SPR.dumbbells = buildDumbbellRack();
  SPR.kiosk = buildKiosk();
  SPR.solar = buildSolar();
  SPR.stall = buildStall();
  SPR.doghouse = buildDoghouse();
  SPR.hydrant = buildHydrant();
  SPR.crate = buildCrate();
  SPR.barrel = buildBarrel();
  SPR.pot = buildPot();
  SPR.windsock = buildWindsock();
  SPR.signpost = buildSignpost("LAB", "HOME");
  SPR.signpost2 = buildSignpost("SKY", "GYM");
  SPR.stage = buildStage();
  SPR.magicTower = buildWizardTower();
  SPR.plane = buildPlane();
  SPR.ctrlTower = buildTower();
  SPR.store = buildStore(false); SPR.storeLit = buildStore(true);
  SPR.station = buildStation(false); SPR.stationLit = buildStation(true);
  SPR.trainEngine = buildTrainCar(true); SPR.trainCar = buildTrainCar(false);
  SPR.windTunnel = buildWindTunnel();
  SPR.fuelTank = buildFuelTank();
  SPR.radar = buildRadar();
  SPR.cone = buildCone();

  // turbine icon (static frame)
  const [tc, tx] = makeCanvas(48, 84); drawTurbine(new Px(tx), 24, 82, 0.3); SPR.turbineIcon = tc;
}

/* icons used in panel headers / quick view (map section.icon -> sprite) */
function iconFor(name) {
  return ({
    house: SPR.house, robot: SPR.robot[0], turbine: SPR.kiosk, pc: SPR.desk, bike: SPR.bikeDock,
    billboard: SPR.billboard, books: SPR.bookshelf, chalk: SPR.chalkboard, capNYU: SPR.capNYU, capCU: SPR.capCU,
    rocket: SPR.rocket, telescope: SPR.telescope, stall: SPR.stall,
    stage: SPR.stage, magic: SPR.magicTower, plane: SPR.plane, store: SPR.store, train: SPR.trainEngine, tunnel: SPR.windTunnel, dumbbell: SPR.dumbbells, trophy: SPR.trophyCase, mail: SPR.mailbox,
  })[name] || SPR.sign;
}
