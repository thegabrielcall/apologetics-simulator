/*!
 * prayer-offer.js
 * When a conversation ends with someone stepping away, offer to pray for them.
 * They randomly accept or refuse. Works on all outcome types except shutdown/pray.
 *
 * Drop  <script src="prayer-offer.js"></script>  before </body> in any game file.
 * No dependencies. Patches showOutcome after page load.
 */
(function () {
  'use strict';

  /* ── WHICH OUTCOME TYPES GET THE PRAYER OFFER ───────────────────────── */
  const ELIGIBLE = new Set(['away', 'soft', 'cold', 'near', 'deflect']);

  /* ── ACCEPT / REFUSE LINES ───────────────────────────────────────────── */
  const ACCEPTS = [
    "…Okay. I don't know what I believe. But okay.",
    "I haven't had anyone pray for me in years. Go ahead.",
    "…Sure. I mean — why not.",
    "That's the first thing you've said that doesn't feel like an argument. Okay.",
    "I'll take it. I don't know if it does anything, but… yeah.",
    "Nobody's ever asked me that. Okay. Go ahead.",
  ];

  const REFUSES = [
    "No. I appreciate it, but no.",
    "That's not for me. But… thanks for asking.",
    "I'll pass. But I'm glad you offered instead of just doing it.",
    "Not today. But I heard what you said.",
    "No thank you. I'm not there yet.",
    "I'd rather you didn't. But genuinely — thanks.",
  ];

  /* ── INJECT CSS ──────────────────────────────────────────────────────── */
  const style = document.createElement('style');
  style.textContent = `
#prayer-offer-wrap {
  margin-top: 20px;
  animation: fadeUp .5s .6s ease both;
  text-align: center;
}
#prayer-offer-btn {
  background: none;
  border: 1.5px solid rgba(140,100,220,.45);
  color: #b090e0;
  border-radius: 20px;
  padding: 8px 22px;
  font-family: 'Courier New', monospace;
  font-size: .68rem;
  letter-spacing: .1em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all .2s;
}
#prayer-offer-btn:hover {
  border-color: #b090e0;
  background: rgba(140,100,220,.1);
  color: #c8a8ff;
}
#prayer-panel {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(8,6,18,.92);
  z-index: 9800;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
  backdrop-filter: blur(6px);
}
#prayer-panel.show { display: flex; }
#prayer-figure {
  font-size: 2.2rem;
  margin-bottom: 18px;
  animation: prayerBob 2s ease-in-out infinite;
}
@keyframes prayerBob {
  0%,100% { transform: translateY(0); }
  50%      { transform: translateY(-5px); }
}
#prayer-text {
  font-family: 'Georgia', serif;
  font-size: .95rem;
  color: #c8b8e8;
  font-style: italic;
  line-height: 1.75;
  max-width: 480px;
  text-align: center;
  margin-bottom: 28px;
  opacity: 0;
  transition: opacity .6s ease;
}
#prayer-text.visible { opacity: 1; }
#prayer-response {
  font-family: 'Georgia', serif;
  font-size: 1rem;
  line-height: 1.6;
  max-width: 440px;
  text-align: center;
  padding: 16px 22px;
  border-radius: 12px;
  display: none;
  animation: fadeUp .5s ease both;
}
#prayer-response.accept {
  background: #1a2a1a;
  border: 1.5px solid #6ad490;
  color: #b8e8c8;
}
#prayer-response.refuse {
  background: #1e1a2e;
  border: 1.5px solid #6a5a9a;
  color: #c0b0d8;
}
#prayer-response-tag {
  font-size: .58rem;
  font-family: 'Courier New', monospace;
  letter-spacing: .1em;
  text-transform: uppercase;
  margin-bottom: 8px;
  opacity: .7;
}
#prayer-response-text {
  font-style: italic;
}
#prayer-close {
  margin-top: 28px;
  background: none;
  border: 1px solid #2a2a3a;
  color: #555;
  border-radius: 16px;
  padding: 7px 20px;
  font-family: 'Courier New', monospace;
  font-size: .62rem;
  letter-spacing: .08em;
  text-transform: uppercase;
  cursor: pointer;
  display: none;
  transition: all .2s;
}
#prayer-close:hover { color: #b090e0; border-color: #b090e0; }
#prayer-praying-label {
  font-size: .6rem;
  font-family: 'Courier New', monospace;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: #4a3a6a;
  margin-bottom: 10px;
}
`;
  document.head.appendChild(style);

  /* ── BUILD PRAYER PANEL DOM ──────────────────────────────────────────── */
  const panel = document.createElement('div');
  panel.id = 'prayer-panel';
  panel.innerHTML = `
<div id="prayer-figure">🙏</div>
<div id="prayer-praying-label">You pray for them…</div>
<div id="prayer-text"></div>
<div id="prayer-response">
  <div id="prayer-response-tag"></div>
  <div id="prayer-response-text"></div>
</div>
<button id="prayer-close">Continue ↗</button>
`.trim();
  document.body.appendChild(panel);

  /* ── PRAYER TEXT (what the player prays out loud) ────────────────────── */
  const PRAYER_LINES = [
    "Lord, thank You for this conversation. I pray for them — that whatever they're carrying, You'd meet them in it. That they'd find what they're actually looking for.",
    "God, I don't know everything they're going through. But You do. I ask that You'd stay close to them. That the questions they're asking would lead somewhere real.",
    "Father, I lift them up to You. I pray they'd encounter You — not a caricature of You, but You. Meet them where the arguments end and life begins.",
    "Lord, this person matters. Whatever walls are up — I ask that You'd work in ways I can't see. Keep the door open. Give them peace.",
  ];

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function runPrayer() {
    const accepted = Math.random() < 0.5;

    panel.classList.add('show');
    const prayerText = document.getElementById('prayer-text');
    const prayerResp = document.getElementById('prayer-response');
    const prayerTag  = document.getElementById('prayer-response-tag');
    const prayerRTxt = document.getElementById('prayer-response-text');
    const prayerClose = document.getElementById('prayer-close');

    // reset
    prayerText.classList.remove('visible');
    prayerText.textContent = '';
    prayerResp.style.display = 'none';
    prayerResp.className = 'accept'; // reset class
    prayerClose.style.display = 'none';

    // show prayer text after short delay
    setTimeout(() => {
      prayerText.textContent = pick(PRAYER_LINES);
      prayerText.classList.add('visible');
    }, 600);

    // show response after prayer text has been read
    setTimeout(() => {
      const line = accepted ? pick(ACCEPTS) : pick(REFUSES);
      prayerTag.textContent  = accepted ? '✦ They accept' : '— They decline';
      prayerRTxt.textContent = `"${line}"`;
      prayerResp.className   = accepted ? 'accept' : 'refuse';
      prayerResp.style.display = 'block';
      setTimeout(() => { prayerClose.style.display = 'inline-block'; }, 600);
    }, 4200);
  }

  document.getElementById('prayer-close').addEventListener('click', () => {
    panel.classList.remove('show');
  });

  /* ── PATCH showOutcome ───────────────────────────────────────────────── */
  function patchShowOutcome() {
    if (typeof window.showOutcome !== 'function') return false;
    if (window.__prayerPatched) return true;

    const original = window.showOutcome;
    window.showOutcome = function (node) {
      original.call(this, node);

      // Only eligible outcome types get the offer
      const outcomeType = node.outcome || node.type || '';
      const eligible = ELIGIBLE.has(outcomeType) ||
        (node.title && /walk|step|crack|open|door|close|away|left|soft|near|miss/i.test(node.title));

      if (!eligible) return;

      // Remove any existing prayer offer
      const existing = document.getElementById('prayer-offer-wrap');
      if (existing) existing.remove();

      // Inject prayer offer button into the outcome screen button area
      const btns = document.querySelector('#outcome-screen .outcome-btns');
      if (!btns) return;

      const wrap = document.createElement('div');
      wrap.id = 'prayer-offer-wrap';

      const btn = document.createElement('button');
      btn.id = 'prayer-offer-btn';
      btn.textContent = '🙏  Pray for them before they go';
      btn.addEventListener('click', runPrayer);

      wrap.appendChild(btn);
      // Insert above the existing buttons
      btns.parentNode.insertBefore(wrap, btns);
    };

    window.__prayerPatched = true;
    return true;
  }

  // Try immediately; retry until showOutcome is available
  if (!patchShowOutcome()) {
    const iv = setInterval(() => {
      if (patchShowOutcome()) clearInterval(iv);
    }, 100);
    // Give up after 5s
    setTimeout(() => clearInterval(iv), 5000);
  }

})();
