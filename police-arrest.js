/*!
 * police-arrest.js
 * Random mid-conversation police arrest termination.
 * "You are preaching on the street. You are going to jail."
 *
 * Triggers after the player makes ≥3 picks. Each subsequent pick has a
 * growing chance (~8% base, capped at 25%) of triggering the arrest.
 * Drop  <script src="police-arrest.js"></script>  before </body>.
 */
(function () {
  'use strict';

  let pickCount = 0;
  let arrested  = false;

  /* ── INJECT CSS ──────────────────────────────────────────────────────── */
  const style = document.createElement('style');
  style.textContent = `
#arrest-overlay {
  display: none;
  position: fixed;
  inset: 0;
  z-index: 9900;
  background: #000;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 30px 20px;
  overflow: hidden;
}
#arrest-overlay.show { display: flex; }

/* Red/blue flashing lights */
#arrest-overlay::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 30% 0%, rgba(220,30,30,.35) 0%, transparent 60%),
              radial-gradient(ellipse at 70% 0%, rgba(30,80,220,.35) 0%, transparent 60%);
  animation: lightFlash 0.7s ease-in-out infinite alternate;
  pointer-events: none;
}
@keyframes lightFlash {
  0%   { opacity: 1; filter: hue-rotate(0deg); }
  50%  { opacity: 0.4; }
  100% { opacity: 1; filter: hue-rotate(180deg); }
}

#arrest-scene {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  animation: arrestDrop .6s cubic-bezier(.2,1.4,.4,1) both;
}
@keyframes arrestDrop {
  from { opacity: 0; transform: translateY(-40px) scale(.9); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

#arrest-graphic {
  width: 260px;
  height: 200px;
  margin-bottom: 10px;
}

#arrest-headline {
  font-family: 'Courier New', monospace;
  font-size: 1.05rem;
  font-weight: 800;
  letter-spacing: .18em;
  text-transform: uppercase;
  color: #ff4444;
  margin-bottom: 6px;
  text-shadow: 0 0 18px rgba(255,60,60,.7);
  animation: pulse 1.2s ease-in-out infinite;
}
@keyframes pulse {
  0%,100% { text-shadow: 0 0 10px rgba(255,60,60,.6); }
  50%      { text-shadow: 0 0 30px rgba(255,60,60,1); }
}

#arrest-sub {
  font-family: 'Georgia', serif;
  font-size: .95rem;
  color: #aaa;
  font-style: italic;
  max-width: 380px;
  line-height: 1.7;
  margin-bottom: 4px;
}

#arrest-verse {
  font-family: 'Courier New', monospace;
  font-size: .65rem;
  color: #555;
  letter-spacing: .08em;
  margin-bottom: 28px;
}

#arrest-siren {
  font-size: 1.5rem;
  letter-spacing: .4em;
  margin-bottom: 20px;
  animation: sirenBlink .5s steps(1) infinite;
}
@keyframes sirenBlink {
  0%,49% { opacity: 1; }
  50%,100%{ opacity: 0.2; }
}

#arrest-btns {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  justify-content: center;
  opacity: 0;
  animation: fadeUp .5s 2.2s ease both;
}
@keyframes fadeUp {
  from { opacity:0; transform:translateY(10px); }
  to   { opacity:1; transform:translateY(0); }
}
.arrest-btn {
  background: none;
  border: 1.5px solid #333;
  color: #666;
  border-radius: 20px;
  padding: 9px 22px;
  font-family: 'Courier New', monospace;
  font-size: .68rem;
  letter-spacing: .1em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all .2s;
  text-decoration: none;
  display: inline-block;
}
.arrest-btn:hover { color: #e8c97a; border-color: #e8c97a88; }
.arrest-btn.primary {
  border-color: rgba(255,68,68,.5);
  color: #ff8888;
}
.arrest-btn.primary:hover {
  border-color: #ff4444;
  background: rgba(255,68,68,.08);
  color: #ffaaaa;
}
`;
  document.head.appendChild(style);

  /* ── BUILD OVERLAY DOM ───────────────────────────────────────────────── */
  const overlay = document.createElement('div');
  overlay.id = 'arrest-overlay';

  // SVG scene: two police officers gripping a street preacher
  overlay.innerHTML = `
<div id="arrest-scene">
  <svg id="arrest-graphic" viewBox="0 0 260 200" xmlns="http://www.w3.org/2000/svg">
    <!-- Street ground -->
    <rect x="0" y="170" width="260" height="30" fill="#1a1a1a"/>
    <line x1="0" y1="170" x2="260" y2="170" stroke="#333" stroke-width="1.5"/>
    <!-- Yellow center stripe -->
    <rect x="110" y="172" width="40" height="5" rx="2" fill="#e8c97a" opacity=".4"/>
    <rect x="110" y="182" width="40" height="5" rx="2" fill="#e8c97a" opacity=".4"/>

    <!-- Police car silhouette (far left) -->
    <rect x="2" y="140" width="60" height="28" rx="4" fill="#1a1a2e"/>
    <rect x="8" y="132" width="44" height="18" rx="3" fill="#111128"/>
    <circle cx="14" cy="170" r="6" fill="#222" stroke="#444" stroke-width="1.5"/>
    <circle cx="52" cy="170" r="6" fill="#222" stroke="#444" stroke-width="1.5"/>
    <!-- Blue/red lights on car -->
    <rect x="14" y="130" width="10" height="5" rx="2" fill="#3355ff" opacity=".9"/>
    <rect x="40" y="130" width="10" height="5" rx="2" fill="#ff3333" opacity=".9"/>
    <!-- Car window -->
    <rect x="12" y="134" width="18" height="12" rx="2" fill="#0d1a2e" opacity=".9"/>
    <rect x="34" y="134" width="18" height="12" rx="2" fill="#0d1a2e" opacity=".9"/>

    <!-- Officer LEFT — gripping preacher's left arm -->
    <!-- body -->
    <rect x="72" y="100" width="22" height="50" rx="5" fill="#1a2a4a"/>
    <!-- badge -->
    <rect x="77" y="108" width="8" height="6" rx="1" fill="#e8c97a" opacity=".7"/>
    <!-- head -->
    <circle cx="83" cy="92" r="11" fill="#c8a878"/>
    <!-- police cap -->
    <rect x="72" y="83" width="22" height="7" rx="3" fill="#1a2a4a"/>
    <rect x="69" y="87" width="28" height="3" rx="1" fill="#111"/>
    <!-- arm reaching right -->
    <line x1="83" y1="118" x2="110" y2="112" stroke="#1a2a4a" stroke-width="8" stroke-linecap="round"/>

    <!-- PREACHER — center, being grabbed -->
    <!-- body -->
    <rect x="108" y="98" width="24" height="52" rx="5" fill="#3a2a1a"/>
    <!-- Bible in raised hand -->
    <rect x="118" y="72" width="14" height="18" rx="2" fill="#8b4513"/>
    <line x1="125" y1="72" x2="125" y2="90" stroke="#6b3410" stroke-width="1"/>
    <!-- arm up holding Bible -->
    <line x1="120" y1="100" x2="125" y2="76" stroke="#3a2a1a" stroke-width="7" stroke-linecap="round"/>
    <!-- head -->
    <circle cx="120" cy="90" r="11" fill="#c8a070"/>
    <!-- mouth open (preaching) -->
    <ellipse cx="120" cy="94" rx="3" ry="2" fill="#5a2a10"/>
    <!-- speech dots -->
    <circle cx="136" cy="78" r="2" fill="#e8c97a" opacity=".5"/>
    <circle cx="142" cy="72" r="1.5" fill="#e8c97a" opacity=".35"/>
    <circle cx="147" cy="67" r="1" fill="#e8c97a" opacity=".2"/>

    <!-- Officer RIGHT — gripping preacher's right arm -->
    <rect x="158" y="100" width="22" height="50" rx="5" fill="#1a2a4a"/>
    <rect x="163" y="108" width="8" height="6" rx="1" fill="#e8c97a" opacity=".7"/>
    <circle cx="169" cy="92" r="11" fill="#c89060"/>
    <rect x="158" y="83" width="22" height="7" rx="3" fill="#1a2a4a"/>
    <rect x="155" y="87" width="28" height="3" rx="1" fill="#111"/>
    <!-- arm reaching left -->
    <line x1="169" y1="118" x2="132" y2="112" stroke="#1a2a4a" stroke-width="8" stroke-linecap="round"/>

    <!-- Handcuffs glint -->
    <circle cx="118" cy="112" r="4" fill="none" stroke="#aaa" stroke-width="1.5" opacity=".7"/>
    <circle cx="124" cy="112" r="4" fill="none" stroke="#aaa" stroke-width="1.5" opacity=".7"/>
    <line x1="122" y1="112" x2="120" y2="112" stroke="#aaa" stroke-width="1.5" opacity=".7"/>
  </svg>

  <div id="arrest-siren">🚨 🚔 🚨</div>
  <div id="arrest-headline">You're Under Arrest</div>
  <div id="arrest-sub">You've been preaching on the street.<br>The officers have had complaints.<br>You are going to jail.</div>
  <div id="arrest-verse">"Blessed are you when people insult you and persecute you… rejoice and be glad." — Matthew 5:11–12</div>
  <div id="arrest-btns">
    <button class="arrest-btn primary" id="arrest-next-btn">🔒 Go to Jail</button>
    <a class="arrest-btn" href="index.html">← All Streets</a>
  </div>
</div>
`.trim();

  document.body.appendChild(overlay);

  document.getElementById('arrest-next-btn').addEventListener('click', () => {
    window.location.href = 'jail.html';
  });

  /* ── TRIGGER LOGIC ───────────────────────────────────────────────────── */
  function triggerArrest() {
    if (arrested) return;
    arrested = true;

    // Hide game UI
    const panel = document.getElementById('choices-panel');
    if (panel) panel.classList.add('hidden');

    overlay.classList.add('show');
  }

  function maybeArrest() {
    if (arrested) return;
    pickCount++;
    if (pickCount < 3) return;

    // Probability grows: 8% base + 4% per pick over 3, capped at 25%
    const chance = Math.min(0.08 + (pickCount - 3) * 0.04, 0.25);
    if (Math.random() < chance) {
      // Short delay so the conversation pick renders first
      setTimeout(triggerArrest, 800);
    }
  }

  /* ── HOOK INTO pick() ────────────────────────────────────────────────── */
  function hookPick() {
    if (typeof window.pick !== 'function') return false;
    if (window.__arrestHooked) return true;

    const origPick = window.pick;
    window.pick = function (...args) {
      const result = origPick.apply(this, args);
      maybeArrest();
      return result;
    };
    window.__arrestHooked = true;
    return true;
  }

  // Also watch for .you-wrap bubbles via MutationObserver as fallback
  function watchBubbles() {
    const chatArea = document.getElementById('chat-area');
    if (!chatArea) return;

    let lastYouCount = 0;
    const observer = new MutationObserver(() => {
      const youBubbles = chatArea.querySelectorAll('.you-wrap, .bubble-row.you, .bubble-row[data-speaker="you"]');
      if (youBubbles.length > lastYouCount) {
        lastYouCount = youBubbles.length;
        if (!window.__arrestHooked) maybeArrest();
      }
    });
    observer.observe(chatArea, { childList: true, subtree: true });
  }

  // Try to hook pick(); if not available yet, wait and also set up MutationObserver
  if (!hookPick()) {
    watchBubbles();
    const iv = setInterval(() => {
      if (hookPick()) clearInterval(iv);
    }, 150);
    setTimeout(() => clearInterval(iv), 6000);
  }

})();
