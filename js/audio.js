/* 音效：全部用 Web Audio 即時合成，不需要外部音檔
 *  - 車門關閉警示音（嗶嗶嗶）
 *  - 列車進站提示音
 *  - 行駛中的馬達/軌道聲（隨速度變化）
 *  - 中英文到站廣播（瀏覽器語音合成）
 */
const Sound = (() => {
  let ctx = null, master = null, enabled = true;
  let rumble = null;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = enabled ? 0.6 : 0;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, start, dur, type = 'sine', vol = 0.25) {
    const c = ensure(); if (!c) return;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0, c.currentTime + start);
    g.gain.linearRampToValueAtTime(vol, c.currentTime + start + 0.015);
    g.gain.setValueAtTime(vol, c.currentTime + start + dur - 0.04);
    g.gain.linearRampToValueAtTime(0, c.currentTime + start + dur);
    o.connect(g); g.connect(master);
    o.start(c.currentTime + start); o.stop(c.currentTime + start + dur + 0.05);
  }

  // 車門即將關閉：連續短嗶聲
  function doorClose() {
    for (let i = 0; i < 7; i++) tone(1180, i * 0.26, 0.15, 'square', 0.07);
  }
  // 車門開啟：兩聲柔和提示
  function doorOpen() { tone(880, 0, 0.18, 'sine', 0.18); tone(660, 0.2, 0.28, 'sine', 0.18); }
  // 各路線進站旋律（合成版）：[頻率, 開始秒, 長度]
  const N = { G5: 784, A5: 880, B5: 988, C6: 1047, D6: 1175, E6: 1319, F6: 1397, Fs6: 1480, G6: 1568, A6: 1760, Cs6: 1109, C7: 2093, D7: 2349 };
  const CHIMES = {
    BR: { wave: 'square', vol: .06, notes: [[N.C6, 0, .18], [N.E6, .18, .18], [N.G6, .36, .18], [N.C7, .54, .5], [N.G6, .9, .5]] },
    R: { wave: 'triangle', vol: .14, notes: [[N.E6, 0, .4], [N.C6, .3, .4], [N.D6, .6, .4], [N.G5, .9, .8]] },
    G: { wave: 'sine', vol: .18, notes: [[N.G5, 0, .35], [N.B5, .25, .35], [N.D6, .5, .35], [N.G6, .75, .8]] },
    O: { wave: 'triangle', vol: .14, notes: [[N.A5, 0, .3], [N.Cs6, .22, .3], [N.E6, .44, .3], [N.A6, .66, .45], [N.E6, 1.0, .7]] },
    BL: { wave: 'sine', vol: .18, notes: [[N.D6, 0, .3], [N.Fs6, .24, .3], [N.A6, .48, .3], [N.D7, .72, .9]] },
    Y: { wave: 'triangle', vol: .14, notes: [[N.E6, 0, .25], [N.G6, .2, .25], [N.E6, .4, .25], [N.C7, .6, .35], [N.A6, .9, .7]] },
  };
  function synthChime(line) {
    const c = CHIMES[line] || CHIMES.R;
    // 播兩次，像月台上的進站音樂
    for (const rep of [0, 1.9]) c.notes.forEach(([f, t, d]) => tone(f, rep + t, d, c.wave, c.vol));
  }
  // 若 assets/sounds/arrive-<路線>.mp3 存在就播放真實音檔，否則用合成旋律
  const fileOk = {};
  function arrivalChime(line) {
    if (!enabled) return;
    ensure();
    if (fileOk[line] === false) return synthChime(line);
    const a = new Audio(`assets/sounds/arrive-${line}.mp3`);
    a.volume = 0.8;
    let done = false;
    const fallback = () => { if (done) return; done = true; fileOk[line] = false; synthChime(line); };
    a.addEventListener('error', fallback, { once: true });
    a.play().then(() => { done = true; fileOk[line] = true; }).catch(fallback);
  }
  // 獲得物品
  function itemGet() {
    [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.11, 0.6, 'sine', 0.14));
  }
  function click() { tone(1400, 0, 0.04, 'sine', 0.06); }

  // 行駛聲：濾波噪音＋低頻馬達音，speed 0~1
  function startRumble() {
    const c = ensure(); if (!c || rumble) return;
    const len = c.sampleRate * 2, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
    const src = c.createBufferSource(); src.buffer = buf; src.loop = true;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 300;
    const g = c.createGain(); g.gain.value = 0;
    const motor = c.createOscillator(); motor.type = 'sawtooth'; motor.frequency.value = 40;
    const mg = c.createGain(); mg.gain.value = 0;
    const mlp = c.createBiquadFilter(); mlp.type = 'lowpass'; mlp.frequency.value = 900;
    src.connect(lp); lp.connect(g); g.connect(master);
    motor.connect(mlp); mlp.connect(mg); mg.connect(master);
    src.start(); motor.start();
    rumble = { src, lp, g, motor, mg };
  }
  function setSpeed(v) {
    if (!rumble || !ctx) return;
    const t = ctx.currentTime;
    rumble.g.gain.setTargetAtTime(0.08 + v * 0.35, t, 0.1);
    rumble.lp.frequency.setTargetAtTime(220 + v * 520, t, 0.1);
    rumble.motor.frequency.setTargetAtTime(38 + v * 210, t, 0.1);
    rumble.mg.gain.setTargetAtTime(v > 0.02 ? 0.015 + (1 - Math.abs(v - 0.5) * 2) * 0.03 : 0, t, 0.1);
  }
  function stopRumble() {
    if (!rumble) return;
    const r = rumble; rumble = null;
    r.g.gain.setTargetAtTime(0, ctx.currentTime, 0.2);
    r.mg.gain.setTargetAtTime(0, ctx.currentTime, 0.2);
    setTimeout(() => { try { r.src.stop(); r.motor.stop(); } catch (e) { /* 已停止 */ } }, 900);
  }

  // 廣播：先中文、再英文
  let voices = [];
  function loadVoices() { voices = window.speechSynthesis ? speechSynthesis.getVoices() : []; }
  if (window.speechSynthesis) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }
  function pickVoice(lang) {
    return voices.find(v => v.lang === lang) || voices.find(v => v.lang && v.lang.startsWith(lang.slice(0, 2)));
  }
  function announce(zh, en) {
    if (!enabled || !window.speechSynthesis) return;
    speechSynthesis.cancel();
    const a = new SpeechSynthesisUtterance(zh);
    a.lang = 'zh-TW'; a.rate = 0.95; a.voice = pickVoice('zh-TW') || null;
    speechSynthesis.speak(a);
    if (en) {
      const b = new SpeechSynthesisUtterance(en);
      b.lang = 'en-US'; b.rate = 0.95; b.voice = pickVoice('en-US') || null;
      speechSynthesis.speak(b);
    }
  }

  return {
    unlock: ensure,
    doorClose, doorOpen, arrivalChime, itemGet, click,
    startRumble, setSpeed, stopRumble, announce,
    get enabled() { return enabled; },
    toggle() {
      enabled = !enabled;
      if (master) master.gain.value = enabled ? 0.6 : 0;
      if (!enabled && window.speechSynthesis) speechSynthesis.cancel();
      return enabled;
    },
  };
})();
