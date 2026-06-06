/*!
 * verse-popup.js
 * Detects Bible verse references in conversation bubbles,
 * wraps them in a clickable highlight, and pops up the full NASB text.
 *
 * Drop  <script src="verse-popup.js"></script>  before </body> in any game file.
 * No dependencies. Self-contained CSS injected at runtime.
 */
(function () {
  'use strict';

  /* ── NASB VERSE LOOKUP ───────────────────────────────────────────────── */
  const NASB = {
    '1 Corinthians 3:6':   'I planted, Apollos watered, but God was causing the growth.',
    '1 Corinthians 12:26': 'And if one member suffers, all the members suffer with it; if one member is honored, all the members rejoice with it.',
    '1 Corinthians 13:12': 'For now we see in a mirror dimly, but then face to face; now I know in part, but then I will know fully, just as I also have been fully known.',
    '1 Corinthians 15:14': 'and if Christ has not been raised, then our preaching is vain, your faith also is vain.',
    '1 Peter 3:15':        'but sanctify Christ as Lord in your hearts, always being ready to make a defense to everyone who asks you to give an account for the hope that is in you, yet with gentleness and respect;',
    'Acts 2:20':           'The sun will be turned into darkness and the moon into blood, before the great and glorious day of the Lord comes.',
    'Ecclesiastes 3:7':   'A time to tear apart and a time to sew together; a time to be silent and a time to speak.',
    'Jeremiah 29:13':      'And you will seek Me and find Me when you search for Me with all your heart.',
    'John 9:1':            'As He passed by, He saw a man who had been blind from birth.',
    'John 11:35':          'Jesus wept.',
    'Mark 14:33':          'And He took Peter, James, and John along with Him, and began to be deeply distressed and troubled.',
    'Matthew 5:4':         'Blessed are those who mourn, for they will be comforted.',
    'Matthew 6:34':        'So do not worry about tomorrow; for tomorrow will worry about itself. Each day has enough trouble of its own.',
    'Matthew 7:6':         '"Do not give what is holy to dogs, and do not throw your pearls before swine, or they will trample them under their feet, and turn and tear you to pieces.',
    'Matthew 7:7':         'Ask, and it will be given to you; seek, and you will find; knock, and it will be opened to you.',
    'Matthew 7:21':        '"Not everyone who says to Me, \'Lord, Lord,\' will enter the kingdom of heaven, but the one who does the will of My Father who is in heaven will enter.',
    'Matthew 9:35':        'Jesus was going through all the cities and villages, teaching in their synagogues and proclaiming the gospel of the kingdom, and healing every kind of disease and every kind of sickness.',
    'Matthew 11:28':       '"Come to Me, all who are weary and burdened, and I will give you rest.',
    'Matthew 16:15':       'He said to them, "But who do you say that I am?"',
    'Matthew 18:6':        'but whoever causes one of these little ones who believe in Me to sin, it would be better for him to have a heavy millstone hung around his neck, and to be drowned in the depths of the sea.',
    'Matthew 23:13':       '"But woe to you, scribes and Pharisees, hypocrites, because you shut the kingdom of heaven in front of people; for you do not enter it yourselves, nor do you allow those who are entering to go in.',
    'Matthew 25:36':       'I was naked, and you clothed Me; I was sick, and you visited Me; I was in prison, and you came to Me.',
    'Matthew 27:46':       'About the ninth hour Jesus cried out with a loud voice, saying, "Eli, Eli, lema sabachthani?" that is, "My God, My God, why have You forsaken Me?"',
    'Proverbs 15:1':       'A gentle answer turns away wrath, but a harsh word stirs up anger.',
    'Proverbs 16:23':      'The heart of the wise instructs his mouth and adds persuasiveness to his lips.',
    'Proverbs 20:24':      'A person\'s steps are from the Lord, so how can anyone understand his own way?',
    'Psalm 19:1':          'The heavens tell of the glory of God; and their expanse declares the work of His hands.',
    'Psalm 22:1':          'My God, my God, why have You forsaken me? Far from my deliverance are the words of my groaning.',
    'Psalm 23:4':          'Even though I walk through the valley of the shadow of death, I fear no evil, for You are with me; Your rod and Your staff, they comfort me.',
    'Psalm 46:10':         'Stop striving and know that I am God; I will be exalted among the nations, I will be exalted on the earth.',
    'Psalm 139:13':        'For You formed my inward parts; You wove me in my mother\'s womb.',
    'Psalm 147:3':         'He heals the brokenhearted and binds up their wounds.',
    'Revelation 21:4':     'and He will wipe away every tear from their eyes; and there will no longer be any death; there will no longer be any mourning, or crying, or pain; the first things have passed away.',
    'Revelation 22:17':    'The Spirit and the bride say, "Come." And let the one who hears say, "Come." And let the one who is thirsty come; let the one who wishes take the water of life without cost.',
    'Romans 5:12':         'Therefore, just as through one man sin entered the world, and death through sin, and so death spread to all mankind, because all sinned—',
    'Romans 8:18':         'For I consider that the sufferings of this present time are not worth comparing with the glory that is to be revealed to us.',
    'Romans 8:20':         'For the creation was subjected to futility, not willingly, but because of Him who subjected it, in hope',
    'Romans 8:28':         'And we know that God causes all things to work together for good to those who love God, to those who are called according to His purpose.',
    'Romans 10:17':        'So faith comes from hearing, and hearing by the word of Christ.',
  };

  /* ── INJECT CSS ──────────────────────────────────────────────────────── */
  const style = document.createElement('style');
  style.textContent = `
.v-ref {
  display: inline;
  background: linear-gradient(180deg, transparent 60%, rgba(232,201,122,.35) 60%);
  border-bottom: 1.5px solid rgba(232,201,122,.6);
  color: inherit;
  cursor: pointer;
  border-radius: 2px;
  padding: 0 1px;
  transition: background .15s, border-color .15s;
  position: relative;
}
.v-ref:hover {
  background: linear-gradient(180deg, transparent 40%, rgba(232,201,122,.55) 40%);
  border-bottom-color: #e8c97a;
}
.v-ref::after {
  content: '📖';
  font-size: .6em;
  margin-left: 3px;
  vertical-align: super;
  opacity: .7;
}

#v-popup {
  position: fixed;
  z-index: 9500;
  max-width: 340px;
  background: linear-gradient(160deg, #1a1428, #120e20);
  border: 1px solid rgba(232,201,122,.35);
  border-radius: 10px;
  padding: 14px 16px 16px;
  box-shadow: 0 8px 40px rgba(0,0,0,.7), 0 0 0 1px rgba(232,201,122,.1);
  pointer-events: auto;
  animation: vPopIn .2s cubic-bezier(.34,1.56,.64,1);
}
@keyframes vPopIn {
  from { opacity:0; transform: scale(.92) translateY(4px); }
  to   { opacity:1; transform: scale(1) translateY(0); }
}
#v-popup-ref {
  font-size: .65rem;
  font-family: 'Courier New', monospace;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: #e8c97a;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
#v-popup-translation {
  font-size: .55rem;
  font-family: 'Courier New', monospace;
  letter-spacing: .06em;
  color: #554; /* corrected below */
  margin-bottom: 2px;
}
#v-popup-text {
  font-family: 'Georgia', serif;
  font-size: .88rem;
  line-height: 1.65;
  color: #e8e0d0;
  font-style: italic;
}
#v-popup-text::before { content: '\\201C'; }
#v-popup-text::after  { content: '\\201D'; }
#v-popup-close {
  background: none;
  border: none;
  color: #554;
  font-size: .9rem;
  cursor: pointer;
  padding: 0 2px;
  line-height: 1;
  flex-shrink: 0;
}
#v-popup-close:hover { color: #e8c97a; }
#v-popup-tag {
  font-size: .5rem;
  font-family: 'Courier New', monospace;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: #555;
  margin-top: 10px;
  border-top: 1px solid #2a2232;
  padding-top: 7px;
}
`;
  // fix color typo
  style.textContent = style.textContent.replace('#554;', '#666;');
  document.head.appendChild(style);

  /* ── BUILD POPUP DOM ─────────────────────────────────────────────────── */
  const popup = document.createElement('div');
  popup.id = 'v-popup';
  popup.style.display = 'none';
  popup.innerHTML = `
<div id="v-popup-ref">
  <span id="v-popup-reftext"></span>
  <button id="v-popup-close" title="Close">✕</button>
</div>
<div id="v-popup-text"></div>
<div id="v-popup-tag">NASB · New American Standard Bible 2020</div>
`.trim();
  document.body.appendChild(popup);

  document.getElementById('v-popup-close').addEventListener('click', hidePopup);

  let activeRef = null;

  function showPopup(refEl, refKey) {
    const text = NASB[refKey];
    if (!text) return;
    document.getElementById('v-popup-reftext').textContent = refKey;
    document.getElementById('v-popup-text').textContent = text;

    // position near the clicked element, avoiding screen edges
    const r = refEl.getBoundingClientRect();
    const popW = 340, popH = 130;
    let left = r.left;
    let top  = r.bottom + 8;

    if (left + popW > window.innerWidth - 12)  left = window.innerWidth - popW - 12;
    if (left < 8) left = 8;
    if (top + popH > window.innerHeight - 12)  top  = r.top - popH - 8;

    popup.style.left    = left + 'px';
    popup.style.top     = top  + 'px';
    popup.style.display = 'block';
    activeRef = refEl;
    refEl.classList.add('v-ref-open');
  }

  function hidePopup() {
    popup.style.display = 'none';
    if (activeRef) { activeRef.classList.remove('v-ref-open'); activeRef = null; }
  }

  // click outside closes popup
  document.addEventListener('click', e => {
    if (popup.style.display !== 'none' &&
        !popup.contains(e.target) &&
        !e.target.classList.contains('v-ref')) {
      hidePopup();
    }
  });

  /* ── VERSE DETECTION REGEX ───────────────────────────────────────────── */
  // Matches e.g. "1 Corinthians 3:6", "John 11:35", "Psalm 23:4"
  const BOOK_PATTERN = [
    '(?:1|2|3)\\s+(?:Corinthians|Peter|John|Kings|Samuel|Chronicles|Thessalonians|Timothy|Thess)',
    '(?:Song\\s+of\\s+Solomon)',
    'Acts','Amos','Colossians','Daniel','Deuteronomy','Ecclesiastes',
    'Ephesians','Esther','Exodus','Ezekiel','Ezra','Galatians','Genesis',
    'Habakkuk','Haggai','Hebrews','Hosea','Isaiah','James','Jeremiah',
    'Job','Joel','John','Jonah','Joshua','Jude','Judges','Lamentations',
    'Leviticus','Luke','Malachi','Mark','Matthew','Micah','Nahum',
    'Nehemiah','Numbers','Obadiah','Philemon','Philippians','Proverbs',
    'Psalm(?:s)?','Revelation','Romans','Ruth','Titus','Zechariah','Zephaniah',
  ].join('|');

  const REF_RE = new RegExp(
    `\\b((?:1|2|3)\\s+)?(?:${BOOK_PATTERN})\\s+\\d+:\\d+(?:-\\d+)?\\b`, 'g'
  );

  /* ── SCAN A BUBBLE'S TEXT NODES ──────────────────────────────────────── */
  function scanBubble(bubble) {
    if (bubble.dataset.vScanned) return;
    bubble.dataset.vScanned = '1';

    // Walk text nodes only — avoid re-processing child elements
    const walker = document.createTreeWalker(bubble, NodeFilter.SHOW_TEXT);
    const nodesToProcess = [];
    let node;
    while ((node = walker.nextNode())) {
      if (REF_RE.test(node.textContent)) nodesToProcess.push(node);
      REF_RE.lastIndex = 0;
    }

    nodesToProcess.forEach(textNode => {
      const frag = document.createDocumentFragment();
      let lastIdx = 0;
      let match;
      REF_RE.lastIndex = 0;
      const txt = textNode.textContent;

      while ((match = REF_RE.exec(txt)) !== null) {
        // Check we actually have this verse in our lookup
        const rawRef = match[0].replace(/Psalms/, 'Psalm').trim();
        if (!NASB[rawRef]) continue;

        // text before the match
        if (match.index > lastIdx) {
          frag.appendChild(document.createTextNode(txt.slice(lastIdx, match.index)));
        }

        // the highlighted span
        const span = document.createElement('span');
        span.className = 'v-ref';
        span.textContent = match[0];
        span.dataset.ref = rawRef;
        span.setAttribute('title', 'Click to see NASB translation');
        span.addEventListener('click', e => {
          e.stopPropagation();
          if (popup.style.display !== 'none' && activeRef === span) {
            hidePopup();
          } else {
            showPopup(span, span.dataset.ref);
          }
        });

        frag.appendChild(span);
        lastIdx = match.index + match[0].length;
      }

      if (lastIdx < txt.length) {
        frag.appendChild(document.createTextNode(txt.slice(lastIdx)));
      }

      if (frag.childNodes.length > 0 && lastIdx > 0) {
        textNode.parentNode.replaceChild(frag, textNode);
      }
    });
  }

  /* ── OBSERVE CHAT AREA ───────────────────────────────────────────────── */
  function attachObserver() {
    const chatArea = document.getElementById('chat-area');
    if (!chatArea) return;

    // scan any bubbles already in the DOM
    chatArea.querySelectorAll('.bubble').forEach(scanBubble);

    // watch for new bubbles
    new MutationObserver(mutations => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (node.nodeType !== 1) continue;
          if (node.classList.contains('bubble')) {
            scanBubble(node);
          } else {
            node.querySelectorAll && node.querySelectorAll('.bubble').forEach(scanBubble);
          }
        }
      }
    }).observe(chatArea, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachObserver);
  } else {
    attachObserver();
  }

})();
