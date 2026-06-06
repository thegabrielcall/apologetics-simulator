/*!
 * interruption.js
 * A random bystander barges into the apologetics conversation.
 * Drop  <script src="interruption.js"></script>  before </body> in any game file.
 * No dependencies. Self-contained CSS injected at runtime.
 */
(function () {
  'use strict';

  /* ── CONFIGURATION ───────────────────────────────────────────────────── */
  const MIN_PICKS_BEFORE = 2;   // wait until the player has made at least N picks
  const TRIGGER_CHANCE   = 0.55; // probability of triggering after MIN_PICKS_BEFORE picks
  const MAX_VISIBLE_MS   = 12000; // auto-dismiss after this long (ms)

  /* ── INTERJECTOR SHOUTS ──────────────────────────────────────────────── */
  const SHOUTS = [
    "God isn't real! You're wasting your breath!",
    "Science has already disproved all of that.",
    "Religion is just a coping mechanism for weak people.",
    "Stop pushing your beliefs onto strangers!",
    "The church has caused nothing but war and abuse.",
    "You know Pascal's wager is a logical fallacy, right?",
    "There is zero evidence for any of this — none!",
    "You've been brainwashed. Look it up.",
    "Faith is the excuse people use when they have no evidence.",
    "Evolution is real. God is not. Deal with it.",
  ];

  /* ── PLAYER RESPONSES ────────────────────────────────────────────────── */
  const RESPONSES = [
    {
      text: "I'd love to hear more — want to join us?",
      tag:  'best',
      note: 'Opens the door. They have questions too.',
    },
    {
      text: "I hear you. Can I finish my thought first?",
      tag:  'good',
      note: 'Calm and firm. Respect buys time.',
    },
    {
      text: "This is a private conversation.",
      tag:  'risky',
      note: 'True — but it shuts them out.',
    },
    {
      text: "(Stay silent and let them walk away)",
      tag:  'wrong',
      note: 'They leave with nothing.',
    },
  ];

  /* ── RESULT MESSAGES ─────────────────────────────────────────────────── */
  const RESULTS = {
    best:  { icon: '✨', headline: 'Well handled!',     body: 'You turned an interruption into an invitation. They stopped — that matters.' },
    good:  { icon: '👍', headline: 'Solid response.',   body: 'You held your ground with grace. The original conversation can continue.' },
    risky: { icon: '⚠️', headline: 'They bristled.',   body: 'Technically correct — but they felt dismissed. Tone matters as much as words.' },
    wrong: { icon: '😶', headline: 'They walked away.', body: 'Silence is sometimes wise, but this was a moment. There may not be another one.' },
  };

  /* ── CHARACTER APPEARANCES ───────────────────────────────────────────── */
  const INTERJECTORS = [
    { coat:'#2a4a2a', pants:'#1a2a3a', skin:'#c8885a', hair:'#222', hairH:3.5, name:'A passerby' },
    { coat:'#3a2a5a', pants:'#222',    skin:'#f0c8a0', hair:'#8b4513', hairH:4,   name:'Someone nearby' },
    { coat:'#4a1a1a', pants:'#2a2a2a', skin:'#5a3a1a', hair:'#111', hairH:2,   name:'A stranger' },
    { coat:'#1a3a4a', pants:'#2a3a1a', skin:'#e8b090', hair:'#cc4400', hairH:5,  name:'A bystander' },
    { coat:'#2a2a2a', pants:'#1a1a2a', skin:'#d0956a', hair:'#333', hairH:3,   name:'Someone passing by' },
  ];

  /* ── INJECT CSS ──────────────────────────────────────────────────────── */
  const css = `
#interjector-overlay{
  position:fixed;inset:0;z-index:9000;pointer-events:none;
}
#interjector-panel{
  position:fixed;bottom:0;left:0;right:0;
  display:flex;align-items:flex-end;gap:0;
  transform:translateY(110%);
  transition:transform .55s cubic-bezier(.34,1.3,.64,1);
  pointer-events:auto;
  z-index:9001;
}
#interjector-panel.visible{
  transform:translateY(0);
}
#interjector-strip{
  background:linear-gradient(180deg,#0f0a1a 0%,#1a0f2a 100%);
  border-top:2px solid #b06ad4;
  width:100%;
  padding:14px 16px 18px;
  box-shadow:0 -8px 40px rgba(140,80,220,.25);
  position:relative;
}
#interjector-header{
  display:flex;align-items:center;gap:10px;margin-bottom:10px;
}
#interjector-figure{
  flex-shrink:0;
}
#interjector-bubble-wrap{
  flex:1;
}
#interjector-tag{
  font-size:.58rem;font-family:'Courier New',monospace;letter-spacing:.1em;
  text-transform:uppercase;color:#b06ad4;margin-bottom:4px;
}
#interjector-shout{
  font-size:.95rem;font-family:'Georgia',serif;color:#f0ede8;
  line-height:1.45;font-style:italic;
}
#interjector-shout::before{content:'"';}
#interjector-shout::after{content:'"';}
#interjector-prompt{
  font-size:.68rem;font-family:'Courier New',monospace;letter-spacing:.08em;
  text-transform:uppercase;color:#666;margin-bottom:8px;
}
#interjector-choices{
  display:flex;flex-direction:column;gap:6px;
}
.int-choice{
  background:none;border:1px solid #2a2a3a;border-radius:8px;
  color:#c8c0d8;font-family:'Georgia',serif;font-size:.84rem;
  padding:8px 12px;text-align:left;cursor:pointer;
  display:flex;align-items:center;justify-content:space-between;gap:10px;
  transition:all .18s;
}
.int-choice:hover{background:#1a1228;border-color:#6a40a0;}
.int-choice.int-best  {border-left:3px solid #6ad490;}
.int-choice.int-good  {border-left:3px solid #58a6ff;}
.int-choice.int-risky {border-left:3px solid #e8c060;}
.int-choice.int-wrong {border-left:3px solid #d46a6a;}
.int-note{font-size:.65rem;font-family:'Courier New',monospace;letter-spacing:.06em;color:#555;white-space:nowrap;flex-shrink:0;}
#interjector-result{
  display:none;padding:10px 14px;background:#0d0a18;border-radius:8px;border:1px solid #2a2a3a;
}
#int-result-icon{font-size:1.4rem;margin-bottom:4px;}
#int-result-head{font-size:.9rem;font-weight:700;color:#e8e0f0;margin-bottom:3px;}
#int-result-body{font-size:.78rem;color:#8878a8;line-height:1.45;}
#interjector-dismiss{
  position:absolute;top:10px;right:12px;
  background:none;border:none;color:#444;font-size:1rem;cursor:pointer;
  padding:4px 8px;border-radius:4px;transition:color .15s;
}
#interjector-dismiss:hover{color:#b06ad4;}
.int-dot{display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:6px;flex-shrink:0;vertical-align:middle;}
.int-dot.best {background:#6ad490;}
.int-dot.good {background:#58a6ff;}
.int-dot.risky{background:#e8c060;}
.int-dot.wrong{background:#d46a6a;}
`;

  const styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  /* ── BUILD DOM ───────────────────────────────────────────────────────── */
  const ch   = INTERJECTORS[Math.floor(Math.random() * INTERJECTORS.length)];
  const shout = SHOUTS[Math.floor(Math.random() * SHOUTS.length)];

  const hairSvg = ch.hairH > 0
    ? `<ellipse cx="12" cy="2.8" rx="4.5" ry="${ch.hairH}" fill="${ch.hair}"/>`
    : '';

  const figureSvg = `
<svg width="44" height="84" viewBox="0 0 24 46" xmlns="http://www.w3.org/2000/svg">
  ${hairSvg}
  <circle cx="12" cy="5.5" r="4.2" fill="${ch.skin}"/>
  <rect x="10.5" y="9.5" width="3" height="2" rx="1" fill="${ch.skin}"/>
  <path d="M7 11.5 Q12 10 17 11.5 L16.5 27 Q12 28.5 7.5 27 Z" fill="${ch.coat}"/>
  <line x1="7.5" y1="14" x2="1" y2="21" stroke="${ch.coat}" stroke-width="2.8" stroke-linecap="round"/>
  <line x1="16.5" y1="14" x2="23" y2="19" stroke="${ch.coat}" stroke-width="2.8" stroke-linecap="round"/>
  <line x1="10" y1="27" x2="7"  y2="43" stroke="${ch.pants}" stroke-width="3.2" stroke-linecap="round"/>
  <line x1="14" y1="27" x2="17" y2="43" stroke="${ch.pants}" stroke-width="3.2" stroke-linecap="round"/>
  <ellipse cx="5.5"  cy="43.5" rx="2.8" ry="1.5" fill="#222"/>
  <ellipse cx="18.5" cy="43.5" rx="2.8" ry="1.5" fill="#222"/>
  <!-- angry mouth -->
  <path d="M10 7.5 Q12 6.2 14 7.5" stroke="#a04040" stroke-width=".7" fill="none" stroke-linecap="round"/>
  <!-- eyes -->
  <circle cx="10.3" cy="5" r=".8" fill="#222"/>
  <circle cx="13.7" cy="5" r=".8" fill="#222"/>
</svg>`.trim();

  const panel = document.createElement('div');
  panel.id = 'interjector-panel';
  panel.innerHTML = `
<div id="interjector-strip">
  <button id="interjector-dismiss" title="Dismiss">✕</button>
  <div id="interjector-header">
    <div id="interjector-figure">${figureSvg}</div>
    <div id="interjector-bubble-wrap">
      <div id="interjector-tag">⚡ ${ch.name} interrupts —</div>
      <div id="interjector-shout">${shout}</div>
    </div>
  </div>
  <div id="interjector-prompt">How do you respond?</div>
  <div id="interjector-choices">
    ${RESPONSES.map(r => `
    <button class="int-choice int-${r.tag}" data-tag="${r.tag}">
      <span><span class="int-dot ${r.tag}"></span>${r.text}</span>
      <span class="int-note">${r.note}</span>
    </button>`).join('')}
  </div>
  <div id="interjector-result">
    <div id="int-result-icon"></div>
    <div id="int-result-head"></div>
    <div id="int-result-body"></div>
  </div>
</div>
`.trim();

  document.body.appendChild(panel);

  /* ── SHOW / HIDE ─────────────────────────────────────────────────────── */
  let autoTimer  = null;
  let triggered  = false;

  function showInterruption() {
    if (triggered) return;
    triggered = true;
    panel.classList.add('visible');
    autoTimer = setTimeout(dismissInterruption, MAX_VISIBLE_MS);
  }

  function dismissInterruption() {
    clearTimeout(autoTimer);
    panel.classList.remove('visible');
  }

  /* ── RESPONSE HANDLING ───────────────────────────────────────────────── */
  panel.querySelectorAll('.int-choice').forEach(btn => {
    btn.addEventListener('click', () => {
      clearTimeout(autoTimer);
      const tag = btn.dataset.tag;
      const res = RESULTS[tag];

      // hide choices, show result
      document.getElementById('interjector-choices').style.display = 'none';
      document.getElementById('interjector-prompt').style.display  = 'none';
      const resultEl = document.getElementById('interjector-result');
      document.getElementById('int-result-icon').textContent = res.icon;
      document.getElementById('int-result-head').textContent = res.headline;
      document.getElementById('int-result-body').textContent = res.body;
      resultEl.style.display = 'block';

      // auto-dismiss after 4 seconds
      autoTimer = setTimeout(dismissInterruption, 4000);
    });
  });

  document.getElementById('interjector-dismiss').addEventListener('click', dismissInterruption);

  /* ── TRIGGER LOGIC ───────────────────────────────────────────────────── */
  // Hook into pick() — count how many times the player has chosen something.
  // Works by monkey-patching the global pick() function if it exists,
  // or by listening for DOM mutations (new .you-wrap bubbles) as fallback.

  let pickCount = 0;

  function checkTrigger() {
    pickCount++;
    if (pickCount >= MIN_PICKS_BEFORE && !triggered) {
      if (Math.random() < TRIGGER_CHANCE) {
        // small random delay so it doesn't fire exactly on the pick
        const delay = 800 + Math.random() * 2200;
        setTimeout(showInterruption, delay);
      } else {
        // keep checking on future picks
        pickCount = MIN_PICKS_BEFORE - 1;
      }
    }
  }

  // Approach 1: patch the global pick() if already defined
  function tryPatchPick() {
    if (typeof window.pick === 'function' && !window.__intPicked) {
      const orig = window.pick;
      window.pick = function (...args) {
        const result = orig.apply(this, args);
        checkTrigger();
        return result;
      };
      window.__intPicked = true;
      return true;
    }
    return false;
  }

  // Approach 2: MutationObserver watching for new you-wrap bubbles
  function observeChat() {
    const chatArea = document.getElementById('chat-area');
    if (!chatArea) return;
    const obs = new MutationObserver(mutations => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (node.nodeType === 1 && node.classList && node.classList.contains('you-wrap')) {
            checkTrigger();
          }
        }
      }
    });
    obs.observe(chatArea, { childList: true });
  }

  // Try patching immediately; if pick isn't defined yet, wait for DOMContentLoaded
  if (!tryPatchPick()) {
    document.addEventListener('DOMContentLoaded', () => {
      if (!tryPatchPick()) {
        observeChat();
      }
    });
  } else {
    // Also set up observer as backup in case patching missed something
    document.addEventListener('DOMContentLoaded', observeChat);
  }

})();
