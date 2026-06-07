/*!
 * skip-typing.js
 * Tap the chat area (or press Space/Enter) during a typing animation to skip
 * the remaining delay and show the content immediately.
 *
 * Works by:
 *  1. Tracking all setTimeout calls with delay > 200ms — storing their IDs.
 *  2. When the user taps #chat-area while a .typing-indicator or .typing-wrap
 *     is visible, we fire all pending timers immediately (clearTimeout + direct call).
 *  3. A "tap to skip" hint fades in after 1.5s of typing, fades out when done.
 *
 * Drop  <script src="skip-typing.js"></script>  before </body>.
 */
(function () {
  'use strict';

  /* ── Intercept setTimeout to track pending timers ─────────────────────── */
  const _origSetTimeout = window.setTimeout;
  const pending = new Map(); // id → {fn, delay}

  window.setTimeout = function (fn, delay, ...args) {
    const id = _origSetTimeout(function () {
      pending.delete(id);
      if (typeof fn === 'function') fn(...args);
      else eval(fn); // eslint-disable-line no-eval
    }, delay, ...args);

    if (delay > 200) {
      pending.set(id, { fn, delay, args });
    }
    return id;
  };

  const _origClearTimeout = window.clearTimeout;
  window.clearTimeout = function (id) {
    pending.delete(id);
    return _origClearTimeout(id);
  };

  /* ── Skip hint element ────────────────────────────────────────────────── */
  const style = document.createElement('style');
  style.textContent = `
#skip-hint {
  position: fixed;
  bottom: 90px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0,0,0,.65);
  border: 1px solid rgba(255,255,255,.12);
  color: rgba(255,255,255,.55);
  font-size: .7rem;
  letter-spacing: .08em;
  padding: 5px 14px;
  border-radius: 20px;
  pointer-events: none;
  opacity: 0;
  transition: opacity .3s;
  z-index: 8000;
  white-space: nowrap;
}
#skip-hint.show { opacity: 1; }
`;
  document.head.appendChild(style);

  const hint = document.createElement('div');
  hint.id = 'skip-hint';
  hint.textContent = '⚡ tap to skip';
  document.body.appendChild(hint);

  /* ── Typing detection ─────────────────────────────────────────────────── */
  let hintTimer = null;

  function isTyping() {
    // tree-j style
    if (document.querySelector('.typing-indicator')) return true;
    // tree-a style
    if (document.querySelector('.typing-wrap.visible')) return true;
    return false;
  }

  function showHint() {
    clearTimeout(hintTimer);
    hintTimer = _origSetTimeout(() => {
      if (isTyping()) hint.classList.add('show');
    }, 1500);
  }

  function hideHint() {
    hint.classList.remove('show');
    clearTimeout(hintTimer);
  }

  /* ── Skip action ──────────────────────────────────────────────────────── */
  function skipAll() {
    if (!isTyping()) return;
    hideHint();

    // Fire all pending delayed timers immediately
    const ids = Array.from(pending.keys());
    ids.forEach(id => {
      const entry = pending.get(id);
      if (!entry) return;
      pending.delete(id);
      _origClearTimeout(id);
      try {
        if (typeof entry.fn === 'function') entry.fn(...(entry.args || []));
      } catch (e) {
        // ignore errors from skipped timers
      }
    });
  }

  /* ── Watch for typing start ───────────────────────────────────────────── */
  function attachObserver() {
    const chatArea = document.getElementById('chat-area');
    if (!chatArea) return;

    const mo = new MutationObserver(() => {
      if (isTyping()) showHint();
      else hideHint();
    });
    mo.observe(chatArea, { childList: true, subtree: true, attributes: true });

    // Tap or click anywhere in the chat to skip
    chatArea.addEventListener('click', skipAll, { passive: true });
    chatArea.addEventListener('touchend', skipAll, { passive: true });
  }

  // Keyboard shortcut: Space or Enter skips
  document.addEventListener('keydown', (e) => {
    if ((e.code === 'Space' || e.code === 'Enter') && isTyping()) {
      e.preventDefault();
      skipAll();
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachObserver);
  } else {
    attachObserver();
  }

})();
