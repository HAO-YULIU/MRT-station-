/* 音效：全部用 Web Audio 即時合成，不需要外部音檔
 *  - 六條路線各自的進站旋律（鐘琴音色，經過「月台喇叭」與殘響）
 *  - 車廂內「叮咚」提示音、關門警示音、車門氣動聲
 *  - 列車馬達變頻聲（起步升調、進站降調）、軌道接縫聲
 *  - 月台環境音（地下站空調低鳴與人聲、高架站風聲）、車廂內行駛聲
 *  - 中英文到站廣播（瀏覽器語音合成）
 * 若 assets/sounds/arrive-<路線>.mp3 存在，進站音樂會優先播放音檔。
 * 實際錄音（assets/sounds，來源見該資料夾的 README）：
 *   station.mp3 台北捷運車站環境音（循環）、train-run.mp3 車廂行駛聲（循環，已濾掉廣播人聲）
 *   arrive.mp3 列車進站、depart.mp3 列車離站。載入失敗時仍使用合成音。
 */
const Sound = (() => {
  let ctx = null, master = null, pa = null, paDry = null, enabled = true;
  let noiseBuf = null;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -18; comp.ratio.value = 4;
      master = ctx.createGain();
      master.gain.value = enabled ? 0.7 : 0;
      master.connect(comp); comp.connect(ctx.destination);
      // 月台喇叭：濾掉高低頻＋殘響
      pa = ctx.createGain();
      const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 380;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 5200;
      const verb = ctx.createConvolver(); verb.buffer = impulse(2.4, 2.6);
      const wet = ctx.createGain(); wet.gain.value = .45;
      paDry = ctx.createGain(); paDry.gain.value = .8;
      pa.connect(hp); hp.connect(lp); lp.connect(paDry); paDry.connect(master);
      lp.connect(verb); verb.connect(wet); wet.connect(master);
      noiseBuf = makeNoise(3, 'pink');
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function impulse(sec, decay) {
    const len = ctx.sampleRate * sec, b = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = b.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return b;
  }
  function makeNoise(sec, kind) {
    const len = ctx.sampleRate * sec, b = ctx.createBuffer(1, len, ctx.sampleRate), d = b.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (kind === 'pink') { b0 = .99765 * b0 + w * .099; b1 = .963 * b1 + w * .2965; b2 = .57 * b2 + w * 1.0527; d[i] = (b0 + b1 + b2 + w * .1848) * .2; }
      else { last = (last + .02 * w) / 1.02; d[i] = last * 3.5; }
    }
    return b;
  }
  function noiseSrc() { const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true; return s; }
  const now = () => ctx.currentTime;

  // 基本音
  function tone(freq, start, dur, type = 'sine', vol = .25, out = master) {
    const c = ensure(); if (!c) return;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.value = freq;
    const t = now() + start;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + .012);
    g.gain.setValueAtTime(vol, t + dur - .04);
    g.gain.linearRampToValueAtTime(0, t + dur);
    o.connect(g); g.connect(out);
    o.start(t); o.stop(t + dur + .05);
  }
  // 鐘琴音色：基音＋泛音，指數衰減
  function bell(freq, start, vol = .2, out = pa, decay = 1.6) {
    const c = ensure(); if (!c) return;
    const t = now() + start;
    for (const [mul, amp, dk] of [[1, 1, 1], [2, .35, .6], [3.01, .14, .4], [4.2, .06, .25]]) {
      const o = c.createOscillator(), g = c.createGain();
      o.type = 'sine'; o.frequency.value = freq * mul;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol * amp, t + .006);
      g.gain.exponentialRampToValueAtTime(.0001, t + decay * dk);
      o.connect(g); g.connect(out);
      o.start(t); o.stop(t + decay * dk + .05);
    }
  }
  // 濾波噪音的一次性聲音（車門氣動聲、軌道聲）
  function noiseBurst(start, dur, f, q, vol, out = master, attack = .01) {
    const c = ensure(); if (!c) return;
    const t = now() + start, s = noiseSrc(), bp = c.createBiquadFilter(), g = c.createGain();
    bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = q;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    s.connect(bp); bp.connect(g); g.connect(out);
    s.start(t, Math.random() * 2); s.stop(t + dur + .05);
  }

  /* ── 各路線進站旋律 ── */
  const N = { G5: 784, A5: 880, B5: 988, C6: 1047, Cs6: 1109, D6: 1175, E6: 1319, F6: 1397, Fs6: 1480, G6: 1568, A6: 1760, B6: 1976, C7: 2093, D7: 2349 };
  const CHIMES = {
    BR: [[N.C6, 0], [N.E6, .16], [N.G6, .32], [N.C7, .48], [N.G6, .8], [N.C7, 1.0]],
    R: [[N.E6, 0], [N.C6, .32], [N.D6, .64], [N.G5, .96]],
    G: [[N.G5, 0], [N.B5, .24], [N.D6, .48], [N.G6, .72], [N.D6, 1.08]],
    O: [[N.A5, 0], [N.Cs6, .2], [N.E6, .4], [N.A6, .6], [N.E6, .95], [N.A6, 1.15]],
    BL: [[N.D6, 0], [N.Fs6, .22], [N.A6, .44], [N.D7, .66], [N.A6, 1.0]],
    Y: [[N.E6, 0], [N.G6, .18], [N.E6, .36], [N.C7, .54], [N.B6, .84], [N.A6, 1.04]],
    A: [[N.G5, 0], [N.C6, .2], [N.E6, .4], [N.G6, .6], [N.E6, .9], [N.C7, 1.15]],
  };
  function synthChime(line) {
    const notes = CHIMES[line] || CHIMES.R;
    for (const rep of [0, 2.1]) notes.forEach(([f, t]) => bell(f, rep + t, .16));
  }
  const fileOk = {};
  function arrivalChime(line) {
    if (!enabled) return;
    ensure();
    if (fileOk[line] === false) return synthChime(line);
    const a = new Audio(`assets/sounds/arrive-${line}.mp3`);
    a.volume = .8;
    let done = false;
    const fallback = () => { if (done) return; done = true; fileOk[line] = false; synthChime(line); };
    a.addEventListener('error', fallback, { once: true });
    a.play().then(() => { done = true; fileOk[line] = true; }).catch(fallback);
  }

  // 車廂內「叮咚」
  function onboardChime() { bell(N.E6, 0, .2, master, 1.3); bell(N.C6, .42, .2, master, 1.8); }

  // 關門警示：連續嗶聲（約 2 秒）＋車門燈閃
  function doorClose() {
    const c = ensure(); if (!c) return;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600; lp.connect(master);
    for (let i = 0; i < 9; i++) tone(1046, i * .2, .11, 'square', .05, lp);
    noiseBurst(1.85, .55, 1800, .8, .12, master, .02);    // 關門氣動聲
    noiseBurst(2.2, .12, 160, 1, .25, master, .005);     // 門扇碰合
  }
  // 開門：氣動聲＋柔和提示
  function doorOpen() {
    noiseBurst(0, .7, 2000, .7, .14, master, .03);
    tone(880, .05, .16, 'sine', .1); tone(660, .24, .26, 'sine', .1);
  }
  function itemGet() { [523, 659, 784, 1047, 1319].forEach((f, i) => bell(f, i * .11, .16, master, 1.4)); }
  function click() { tone(1400, 0, .035, 'sine', .05); }
  // 傳送：往上滑的鐘聲
  function teleport() { [523, 784, 1047, 1568, 2093].forEach((f, i) => bell(f, i * .07, .12, master, 1.2)); noiseBurst(0, .9, 3000, .5, .08, master, .3); }
  // 閘門刷卡「嗶」
  function gate() { tone(2350, 0, .09, 'square', .045); tone(2350, .13, .09, 'square', .045); }

  /* ── 錄音檔：第一次用到才下載解碼 ── */
  const bufs = {};
  function sample(name) {
    if (!bufs[name]) bufs[name] = fetch(`assets/sounds/${name}.mp3`).then(r => { if (!r.ok) throw new Error(name); return r.arrayBuffer(); })
      .then(a => new Promise((res, rej) => ctx.decodeAudioData(a, res, rej))).catch(() => null);
    return bufs[name];
  }
  // 播放一段錄音；loop 時回傳可以調音量／停止的控制
  function playSample(name, vol, opts = {}) {
    const c = ensure(); if (!c) return null;
    const h = { g: c.createGain(), src: null, stopped: false };
    h.g.gain.value = 0; h.g.connect(master);
    sample(name).then(buf => {
      if (!buf || h.stopped) return;
      const s = c.createBufferSource(); s.buffer = buf; s.loop = !!opts.loop;
      s.connect(h.g); s.start(0, opts.offset ? opts.offset * buf.duration : 0); h.src = s;
      h.g.gain.setTargetAtTime(vol, now(), opts.fadeIn || .05);
      if (opts.fadeOutAt) h.g.gain.setTargetAtTime(0, now() + opts.fadeOutAt, opts.fadeOut || 1);
    });
    h.set = (v, tc = .2) => h.g.gain.setTargetAtTime(v, now(), tc);
    h.stop = (tc = .4) => { h.stopped = true; h.g.gain.setTargetAtTime(0, now(), tc); setTimeout(() => { try { h.src && h.src.stop(); } catch (e) { /* 已停止 */ } h.g.disconnect(); }, tc * 6000); };
    return h;
  }
  // 月台上看到的列車：進站、離站
  function trainArrive(vol = .9) { return playSample('arrive', vol, { fadeOutAt: 9, fadeOut: 1.2 }); }
  function trainDepart(vol = .8) { return playSample('depart', vol, { fadeIn: .3, fadeOutAt: 8, fadeOut: 1.2 }); }

  /* ── 行駛聲：馬達變頻聲＋輪軌噪音＋接縫聲（加上實際錄音的車廂聲） ── */
  let run = null, brownBuf = null;
  function startRumble() {
    const c = ensure(); if (!c || run) return;
    // 輪軌噪音
    if (!brownBuf) brownBuf = makeNoise(3, 'brown');
    const roar = c.createBufferSource(), lp = c.createBiquadFilter(), rg = c.createGain();
    roar.buffer = brownBuf; roar.loop = true;
    lp.type = 'lowpass'; lp.frequency.value = 250; rg.gain.value = 0;
    roar.connect(lp); lp.connect(rg); rg.connect(master); roar.start();
    // 變頻馬達：兩個鋸齒波經帶通，聽起來像「嗚—」
    const m1 = c.createOscillator(), m2 = c.createOscillator(), bp = c.createBiquadFilter(), mg = c.createGain();
    m1.type = 'sawtooth'; m2.type = 'sawtooth'; m2.detune.value = 8;
    bp.type = 'bandpass'; bp.Q.value = 6; bp.frequency.value = 600; mg.gain.value = 0;
    m1.connect(bp); m2.connect(bp); bp.connect(mg); mg.connect(master); m1.start(); m2.start();
    run = { roar, lp, rg, m1, m2, bp, mg, v: 0, clackT: 0, rec: playSample('train-run', .15, { loop: true, offset: Math.random(), fadeIn: .4 }) };
  }
  function setSpeed(v) {
    if (!run || !ctx) return;
    const t = now(), accel = v >= run.v;
    run.rg.gain.setTargetAtTime(.03 + v * .14, t, .15);
    if (run.rec) run.rec.set(.15 + v * .55, .25);
    run.lp.frequency.setTargetAtTime(180 + v * 620, t, .15);
    // 起步時馬達音一階一階往上，進站時往下
    const step = Math.floor(v * 4) / 4, f = 220 + step * 260 + (v - step) * 900;
    run.m1.frequency.setTargetAtTime(f, t, .05); run.m2.frequency.setTargetAtTime(f * 1.5, t, .05);
    run.bp.frequency.setTargetAtTime(f * 2, t, .1);
    const traction = v > .02 && v < .98 ? (accel ? .05 : .035) : 0;
    run.mg.gain.setTargetAtTime(traction, t, .2);
    // 軌道接縫「喀噹」
    if (v > .15 && t > run.clackT) {
      noiseBurst(0, .09, 140, 1.2, .22 * v, master, .004);
      noiseBurst(.11, .09, 120, 1.2, .2 * v, master, .004);
      run.clackT = t + 1.6 / v;
    }
    run.v = v;
  }
  function stopRumble() {
    if (!run) return;
    const r = run; run = null;
    r.rg.gain.setTargetAtTime(0, now(), .3); r.mg.gain.setTargetAtTime(0, now(), .2);
    if (r.rec) r.rec.stop(.4);
    setTimeout(() => { try { r.roar.stop(); r.m1.stop(); r.m2.stop(); } catch (e) { /* 已停止 */ } }, 1500);
  }

  /* ── 環境音 ── */
  let amb = null;
  function ambience(kind) {   // 'underground' | 'elevated' | null
    const c = ensure(); if (!c) return;
    if (amb && amb.kind === kind) return;
    if (amb) { const a = amb; a.g.gain.setTargetAtTime(0, now(), .5); if (a.rec) a.rec.stop(.6); setTimeout(() => a.nodes.forEach(n => { try { n.stop(); } catch (e) { /* */ } }), 2500); amb = null; }
    if (!kind) return;
    const g = c.createGain(); g.gain.value = 0; g.connect(master);
    const nodes = [];
    // 空調低鳴／風
    const n1 = noiseSrc(), f1 = c.createBiquadFilter();
    f1.type = kind === 'underground' ? 'lowpass' : 'bandpass';
    f1.frequency.value = kind === 'underground' ? 160 : 520; f1.Q.value = .6;
    const g1 = c.createGain(); g1.gain.value = kind === 'underground' ? .5 : .22;
    n1.connect(f1); f1.connect(g1); g1.connect(g); n1.start(); nodes.push(n1);
    // 人聲嘈雜（中頻噪音，緩慢起伏）
    const n2 = noiseSrc(), f2 = c.createBiquadFilter(); f2.type = 'bandpass'; f2.frequency.value = 900; f2.Q.value = 1.2;
    const g2 = c.createGain(); g2.gain.value = .015;   // 人聲主要來自錄音
    const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = .13; lg.gain.value = .03;
    lfo.connect(lg); lg.connect(g2.gain); lfo.start(); nodes.push(lfo);
    n2.connect(f2); f2.connect(g2); g2.connect(g); n2.start(1); nodes.push(n2);
    if (kind === 'elevated') {   // 風聲忽大忽小
      const wl = c.createOscillator(), wg = c.createGain(); wl.frequency.value = .07; wg.gain.value = .12;
      wl.connect(wg); wg.connect(g1.gain); wl.start(); nodes.push(wl);
    }
    g.gain.setTargetAtTime(.35, now(), 1);
    amb = { kind, g, nodes, rec: playSample('station', kind === 'underground' ? .55 : .4, { loop: true, offset: Math.random(), fadeIn: 1.2 }) };
  }

  /* ── 廣播：叮咚 → 中文 → 英文 ── */
  let voices = [];
  function loadVoices() { voices = window.speechSynthesis ? speechSynthesis.getVoices() : []; }
  if (window.speechSynthesis) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }
  function pickVoice(lang) {
    return voices.find(v => v.lang === lang) || voices.find(v => v.lang && v.lang.startsWith(lang.slice(0, 2)));
  }
  function announce(zh, en, opts = {}) {
    if (!enabled) return;
    if (opts.chime) onboardChime();
    if (!window.speechSynthesis) return;
    speechSynthesis.cancel();
    setTimeout(() => {
      const a = new SpeechSynthesisUtterance(zh);
      a.lang = 'zh-TW'; a.rate = .92; a.voice = pickVoice('zh-TW') || null;
      speechSynthesis.speak(a);
      if (en) {
        const b = new SpeechSynthesisUtterance(en);
        b.lang = 'en-US'; b.rate = .92; b.voice = pickVoice('en-US') || null;
        speechSynthesis.speak(b);
      }
    }, opts.chime ? 1100 : 0);
  }

  return {
    unlock: ensure,
    // 街頭表演：依樂器彈一小段旋律（音量隨距離）
    busk(kind, vol = .12) {
      if (!enabled || !ensure()) return;
      const tunes = {
        guitar: [[392, 0], [494, .25], [587, .5], [494, .75], [440, 1.0], [392, 1.25], [330, 1.5], [392, 1.75]],
        violin: [[659, 0], [587, .4], [523, .8], [587, 1.2], [659, 1.6], [784, 2.0]],
        dance: [[220, 0], [220, .25], [330, .5], [220, .75], [262, 1.0], [220, 1.25], [330, 1.5], [392, 1.75]],
        magic: [[523, 0], [659, .3], [784, .6], [1047, .9]],
      }[kind] || [];
      for (const [f, t] of tunes) bell(f * (kind === 'violin' ? 1 : 2), t, vol, master, kind === 'violin' ? 2.4 : 1.0);
    },
    // 單音（地板鋼琴之類的互動藝術）
    note(freq, vol = .18) { if (enabled && ensure()) bell(freq, 0, vol, master, 1.4); },
    doorClose, doorOpen, arrivalChime, trainArrive, trainDepart, onboardChime, itemGet, click, gate, teleport,
    startRumble, setSpeed, stopRumble, ambience, announce,
    get enabled() { return enabled; },
    toggle() {
      enabled = !enabled;
      if (master) master.gain.value = enabled ? .7 : 0;
      if (!enabled && window.speechSynthesis) speechSynthesis.cancel();
      return enabled;
    },
  };
})();
