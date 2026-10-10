/* ==========================================================================
   AUDIO: chiptune SFX (tiny WebAudio synth) + quiet background music track.
   Music: "Cukies Zelda" by feedeorfano (Pixabay, royalty-free).
   ========================================================================== */
const Audio8 = (() => {
  const MUSIC_VOL = 0.12;   // very low: ambience, not a soundtrack
  const DUCK_VOL = 0.05;    // while a panel / quick view is open

  let ac = null, master = null;
  let sfxOn = true, musicOn = true, ducked = false, bgm = null, wantMusic = false;

  const load = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : v === "1"; } catch { return d; } };
  const save = (k, v) => { try { localStorage.setItem(k, v ? "1" : "0"); } catch {} };
  sfxOn = load("mt_sfx", true);
  musicOn = load("mt_music", true);

  function ensure() {
    if (ac) { if (ac.state === "suspended") ac.resume(); return true; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ac = new AC();
    master = ac.createGain(); master.gain.value = 0.22; master.connect(ac.destination);
    return true;
  }
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);

  function tone(freq, start, dur, type = "square", vol = 0.3, slideTo = null) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, start);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, start + dur);
    g.gain.setValueAtTime(vol, start);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.connect(g); g.connect(master); o.start(start); o.stop(start + dur + 0.02);
  }
  function noise(start, dur, vol = 0.3, lp = 1200) {
    const len = Math.floor(ac.sampleRate * dur), buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    src.buffer = buf; f.type = "lowpass"; f.frequency.value = lp;
    g.gain.setValueAtTime(vol, start); g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    src.connect(f); f.connect(g); g.connect(master); src.start(start);
  }

  const sfx = {
    blip()    { tone(1320, ac.currentTime, 0.03, "square", 0.08); },
    select()  { const t = ac.currentTime; tone(988, t, 0.06, "square", 0.18); tone(1319, t + 0.06, 0.09, "square", 0.18); },
    open()    { const t = ac.currentTime; [72, 76, 79, 84].forEach((m, i) => tone(hz(m), t + i * 0.045, 0.1, "square", 0.16)); },
    close()   { const t = ac.currentTime; tone(hz(79), t, 0.06, "square", 0.14); tone(hz(72), t + 0.06, 0.09, "square", 0.14); },
    bump()    { tone(110, ac.currentTime, 0.08, "square", 0.22, 70); },
    discover(){ const t = ac.currentTime; [[76, 0], [79, .08], [84, .16], [88, .26]].forEach(([m, d]) => tone(hz(m), t + d, d > .2 ? .3 : .1, "square", .18)); tone(hz(52), t, .4, "triangle", .3); },
    fanfare() { const t = ac.currentTime; [[72,0,.12],[72,.12,.12],[72,.24,.12],[76,.36,.36],[74,.72,.12],[77,.84,.12],[79,.96,.6]].forEach(([m,d,l]) => { tone(hz(m), t + d, l, "square", .18); tone(hz(m - 12), t + d, l, "triangle", .25); }); },
    bark()    { const t = ac.currentTime; tone(620, t, 0.07, "square", 0.15, 380); tone(700, t + 0.11, 0.07, "square", 0.15, 420); },
    meow()    { tone(700, ac.currentTime, 0.35, "triangle", 0.15, 520); },
    beep()    { const t = ac.currentTime; tone(1760, t, 0.05, "square", 0.1); tone(1320, t + 0.07, 0.05, "square", 0.1); },
    launch()  { const t = ac.currentTime; noise(t, 2.6, 0.5, 900); tone(80, t, 2.4, "sawtooth", 0.15, 30); },
    rustle()  { noise(ac.currentTime, 0.08, 0.06, 3000); },
    horn()    { const t = ac.currentTime; tone(hz(64), t, 0.35, "triangle", 0.12); tone(hz(68), t, 0.35, "triangle", 0.1); tone(hz(64), t + 0.45, 0.5, "triangle", 0.12); tone(hz(68), t + 0.45, 0.5, "triangle", 0.1); },
    tour()    { const t = ac.currentTime; [[67, 0], [72, .1], [76, .2], [79, .3], [84, .42]].forEach(([m, d]) => tone(hz(m), t + d, .14, "square", .14)); },
  };

  /* ---- background music (HTML audio, loops, fades in) ---- */
  function getBgm() {
    if (bgm) return bgm;
    bgm = new Audio("assets/audio/bgm.mp3");
    bgm.loop = true; bgm.preload = "auto"; bgm.volume = 0;
    return bgm;
  }
  let fadeTimer = null;
  function fadeTo(target, ms = 1200) {
    const a = getBgm(); clearInterval(fadeTimer);
    const start = a.volume, t0 = performance.now();
    fadeTimer = setInterval(() => {
      const k = Math.min(1, (performance.now() - t0) / ms);
      a.volume = Math.max(0, Math.min(1, start + (target - start) * k));
      if (k >= 1) { clearInterval(fadeTimer); if (target === 0) a.pause(); }
    }, 50);
  }
  const level = () => (ducked ? DUCK_VOL : MUSIC_VOL);
  function startMusic() {
    const a = getBgm();
    const p = a.play(); if (p && p.catch) p.catch(() => {});
    fadeTo(level(), 2000);
  }
  function stopMusic() { if (bgm) fadeTo(0, 500); }

  document.addEventListener("visibilitychange", () => {
    if (!bgm || !musicOn) return;
    if (document.hidden) bgm.pause(); else { const p = bgm.play(); if (p && p.catch) p.catch(() => {}); }
  });

  return {
    /* every user gesture calls this; it also starts music that a deep link couldn't autoplay */
    unlock() { ensure(); if (wantMusic && musicOn && (!bgm || bgm.paused)) startMusic(); },
    play(name) { if (!sfxOn || !ensure()) return; try { sfx[name] && sfx[name](); } catch {} },
    get sfx() { return sfxOn; },
    get music() { return musicOn; },
    toggleSfx() { sfxOn = !sfxOn; save("mt_sfx", sfxOn); return sfxOn; },
    /* call from a user gesture (Start button) */
    beginMusic() { wantMusic = true; if (musicOn) startMusic(); },
    toggleMusic() {
      musicOn = !musicOn; save("mt_music", musicOn);
      musicOn ? startMusic() : stopMusic();
      return musicOn;
    },
    duck(on) { ducked = on; if (musicOn && bgm && !bgm.paused) fadeTo(level(), 400); },
  };
})();
