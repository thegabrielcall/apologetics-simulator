/*!
 * ambient-city.js
 * Synthesises subtle city ambience via Web Audio API — no audio files needed.
 * Layers: pink noise base · distant traffic hum · occasional horn blip
 *
 * Starts muted. User must interact first (browser autoplay policy).
 * A small mute/unmute toggle button is injected into the page.
 *
 * Drop  <script src="ambient-city.js"></script>  before </body>.
 */
(function () {
  'use strict';

  let ctx = null;
  let masterGain = null;
  let muted = false;
  let started = false;

  /* ── Mute toggle button ─────────────────────────────────────────────── */
  const style = document.createElement('style');
  style.textContent = `
#city-sound-btn {
  position: fixed;
  bottom: 18px;
  right: 18px;
  z-index: 7000;
  background: rgba(13,17,23,.8);
  border: 1px solid rgba(255,255,255,.1);
  color: rgba(255,255,255,.4);
  font-size: .65rem;
  letter-spacing: .08em;
  padding: 6px 12px;
  border-radius: 20px;
  cursor: pointer;
  transition: all .2s;
  backdrop-filter: blur(6px);
  user-select: none;
}
#city-sound-btn:hover {
  color: rgba(255,255,255,.8);
  border-color: rgba(255,255,255,.25);
}
`;
  document.head.appendChild(style);

  const btn = document.createElement('button');
  btn.id = 'city-sound-btn';
  btn.textContent = '♪ city sounds';
  document.body.appendChild(btn);

  /* ── Pink noise buffer ──────────────────────────────────────────────── */
  function makePinkNoise(ctx) {
    const bufLen = ctx.sampleRate * 4; // 4-second looping buffer
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const data = buf.getChannelData(0);
    // Pink noise via Paul Kellet's 3-pole approximation
    let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
    for (let i = 0; i < bufLen; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886*b0 + white*0.0555179;
      b1 = 0.99332*b1 + white*0.0750759;
      b2 = 0.96900*b2 + white*0.1538520;
      b3 = 0.86650*b3 + white*0.3104856;
      b4 = 0.55000*b4 + white*0.5329522;
      b5 = -0.7616*b5 - white*0.0168980;
      data[i] = (b0+b1+b2+b3+b4+b5+b6+white*0.5362) * 0.06;
      b6 = white * 0.115926;
    }
    return buf;
  }

  /* ── Build audio graph ──────────────────────────────────────────────── */
  function buildGraph() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(muted ? 0 : 1, ctx.currentTime);
    masterGain.connect(ctx.destination);

    // ── Layer 1: Pink noise (city rumble / wind / distant crowd) ────────
    const pinkBuf = makePinkNoise(ctx);
    const pinkSrc = ctx.createBufferSource();
    pinkSrc.buffer = pinkBuf;
    pinkSrc.loop = true;

    // Low-pass to keep only the warm rumble (cut above ~500Hz)
    const lpf = ctx.createBiquadFilter();
    lpf.type = 'lowpass';
    lpf.frequency.value = 480;
    lpf.Q.value = 0.5;

    const pinkGain = ctx.createGain();
    pinkGain.gain.value = 0.18;

    pinkSrc.connect(lpf);
    lpf.connect(pinkGain);
    pinkGain.connect(masterGain);
    pinkSrc.start();

    // ── Layer 2: Sub-bass hum (HVAC / distant traffic) ──────────────────
    const hum = ctx.createOscillator();
    hum.type = 'sine';
    hum.frequency.value = 55; // deep rumble ~55 Hz

    // Slowly drift the hum ±3Hz for organic feel
    const humLFO = ctx.createOscillator();
    humLFO.type = 'sine';
    humLFO.frequency.value = 0.07;
    const humLFOGain = ctx.createGain();
    humLFOGain.gain.value = 3;
    humLFO.connect(humLFOGain);
    humLFOGain.connect(hum.frequency);
    humLFO.start();

    const humGain = ctx.createGain();
    humGain.gain.value = 0.06;
    hum.connect(humGain);
    humGain.connect(masterGain);
    hum.start();

    // ── Layer 3: Mid-range distant chatter / tyres ───────────────────────
    const pinkBuf2 = makePinkNoise(ctx);
    const midSrc = ctx.createBufferSource();
    midSrc.buffer = pinkBuf2;
    midSrc.loop = true;
    midSrc.playbackRate.value = 1.3;

    const bpf = ctx.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.value = 900;
    bpf.Q.value = 1.2;

    const midGain = ctx.createGain();
    midGain.gain.value = 0.04;

    midSrc.connect(bpf);
    bpf.connect(midGain);
    midGain.connect(masterGain);
    midSrc.start();

    // ── Layer 4: Occasional distant car horn ─────────────────────────────
    scheduleHorn();
  }

  function scheduleHorn() {
    if (!ctx) return;
    // Random interval 12–35 seconds
    const delay = 12 + Math.random() * 23;
    setTimeout(() => {
      if (!ctx) return;
      playHorn();
      scheduleHorn();
    }, delay * 1000);
  }

  function playHorn() {
    if (!ctx || muted) return;
    const now = ctx.currentTime;

    // Two-tone horn: low note + high note
    const freqs = [220 + Math.random() * 80, 330 + Math.random() * 100];
    freqs.forEach(freq => {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;

      const env = ctx.createGain();
      env.gain.setValueAtTime(0, now);
      env.gain.linearRampToValueAtTime(0.018, now + 0.04);
      env.gain.setValueAtTime(0.018, now + 0.25);
      env.gain.linearRampToValueAtTime(0, now + 0.45);

      // Very heavy low-pass so it sounds distant
      const lpf = ctx.createBiquadFilter();
      lpf.type = 'lowpass';
      lpf.frequency.value = 600;

      osc.connect(lpf);
      lpf.connect(env);
      env.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.5);
    });
  }

  /* ── Start / mute logic ─────────────────────────────────────────────── */
  function startAudio() {
    if (started) return;
    started = true;
    buildGraph();
    btn.textContent = '🔇 mute city';
    muted = false;
    // Save pref
    try { localStorage.setItem('apol_city_sound', '1'); } catch(e) {}
  }

  function toggleMute() {
    if (!started) {
      startAudio();
      return;
    }
    muted = !muted;
    if (masterGain) {
      masterGain.gain.cancelScheduledValues(ctx.currentTime);
      masterGain.gain.linearRampToValueAtTime(muted ? 0 : 1, ctx.currentTime + 0.4);
    }
    btn.textContent = muted ? '♪ city sounds' : '🔇 mute city';
    try { localStorage.setItem('apol_city_sound', muted ? '0' : '1'); } catch(e) {}
  }

  btn.addEventListener('click', toggleMute);

  // Auto-start on first user interaction if they previously had it on
  function onFirstInteraction() {
    let pref = null;
    try { pref = localStorage.getItem('apol_city_sound'); } catch(e) {}
    if (pref === '1') startAudio();
    document.removeEventListener('click', onFirstInteraction);
    document.removeEventListener('keydown', onFirstInteraction);
  }
  document.addEventListener('click', onFirstInteraction);
  document.addEventListener('keydown', onFirstInteraction);

})();
