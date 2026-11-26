/* Aurora motion layer
 * Drop-in: add <script src="aurora-motion.js" defer></script> before </body>.
 * Patterns adapted from the reference recordings:
 *   1. Answers stream in word by word, each word resolving from a soft blur.
 *   2. Status lines ("Reading 3 sources…", "Writing answer…") swap with a blur crossfade.
 *   3. Sources, actions and list rows arrive in a short stagger.
 *   4. Saving an answer flies a card from the message into "Saved docs" (shrink to thumbnail).
 *   5. Quiz and flashcard widgets settle in; each new question or card steps in.
 *   6. Study mode cards type their starter prompt into the composer.
 *   7. View changes (Library, Spaces, Dashboard, back to Study) stagger their content in.
 *   8. Haptics: feedback tied to meaningful moments (commit, select, success, mistake,
 *      destructive), as a device vibration where supported plus a matching visual cue.
 * Everything is skipped when the person has asked their system for reduced motion.
 */
(() => {
  'use strict';
  const RM = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (RM.matches) return;

  const WORD_MS = 680;
  const EASE_OUT = 'cubic-bezier(.22,1,.36,1)';      // ease-out-quint: fast start, long soft landing
  const EASE_IO = 'cubic-bezier(.65,0,.35,1)';       // ease-in-out for state changes
  const EASE_SPRING = 'cubic-bezier(.26,1.08,.42,1)'; // barely-there overshoot

  /* ---------- Styles ---------- */
  const css = `
  @keyframes am-word { from { opacity: 0; filter: blur(3px); transform: translateY(.1em); } to { opacity: 1; filter: blur(0); transform: none; } }
  @keyframes am-swap { from { opacity: 0; filter: blur(2px); transform: translateY(3px); } to { opacity: 1; filter: blur(0); transform: none; } }
  @keyframes am-rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
  @keyframes am-pop  { from { opacity: 0; filter: blur(3px); transform: translateY(10px) scale(.99); } to { opacity: 1; filter: blur(0); transform: none; } }
  @keyframes am-send { from { opacity: 0; transform: translateY(10px) scale(.985); } to { opacity: 1; transform: none; } }
  @keyframes am-step { from { opacity: 0; transform: translateX(8px); } to { opacity: 1; transform: none; } }
  @keyframes am-land { 0% { transform: scale(.985); } 60% { transform: scale(1.006); } 100% { transform: none; } }
  @keyframes am-glow { 0% { box-shadow: 0 0 0 0 rgba(91,140,255,0); } 40% { box-shadow: 0 0 0 5px rgba(91,140,255,.14); } 100% { box-shadow: 0 0 0 0 rgba(91,140,255,0); } }
  @keyframes am-bump { 0% { transform: none; } 45% { transform: scale(1.1); } 100% { transform: none; } }

  .am-w { display: inline-block; animation: am-word ${WORD_MS}ms ${EASE_OUT} both; will-change: opacity, filter, transform; }
  .am-swap { animation: am-swap 480ms ${EASE_OUT} both; }
  .am-rise { animation: am-rise 640ms ${EASE_OUT} both; }
  .am-pop  { animation: am-pop 760ms ${EASE_OUT} both; }
  .am-send { animation: am-send 620ms ${EASE_OUT} both; transform-origin: bottom right; }
  .am-step { animation: am-step 520ms ${EASE_OUT} both; }
  .am-land { animation: am-land 720ms ${EASE_OUT} both; }
  .am-glow { animation: am-glow 1200ms ${EASE_IO} both; }
  .am-bump { display: inline-block; animation: am-bump 520ms ${EASE_SPRING}; }

  /* Sources already stagger by animation-delay; give them the blur rise. */
  .src { animation-name: am-rise !important; animation-duration: 640ms !important; animation-timing-function: ${EASE_OUT} !important; }

  /* Toast: spring up out of a blur. */
  .toast { filter: blur(2px); transition: opacity .42s ${EASE_OUT}, transform .6s ${EASE_OUT}, filter .42s ${EASE_OUT} !important; }
  .toast.show { filter: blur(0); }

  /* Flashcards flip with a touch of overshoot. */
  .fc-card { transition: transform .85s ${EASE_IO} !important; }

  .msg { animation-duration: .55s !important; animation-timing-function: ${EASE_OUT} !important; }
  .modal { animation: am-pop .5s ${EASE_OUT} both !important; }
  .modal-layer { animation-duration: .4s !important; animation-timing-function: ${EASE_OUT} !important; }
  .lib-menu { animation: am-swap .26s ${EASE_OUT} both; transform-origin: top right; }

  .am-ghost { position: fixed; z-index: 9999; pointer-events: none; transform-origin: 0 0; border-radius: 14px; overflow: hidden;
    background: #fff; box-shadow: 0 18px 50px rgba(16,24,40,.18), 0 2px 6px rgba(16,24,40,.08); }
  .am-ghost > .am-ghost-in { transform-origin: 0 0; }

  /* ---------- 8. Haptic visuals ----------
     Uses the independent "scale" / "translate" properties so it never fights an element's own transform. */
  @keyframes hx-tick  { 0% { scale: 1; } 40% { scale: .97; } 100% { scale: 1; } }
  @keyframes hx-ok    { 0% { box-shadow: 0 0 0 0 rgba(23,178,106,0); } 40% { box-shadow: 0 0 0 5px rgba(23,178,106,.16); } 100% { box-shadow: 0 0 0 0 rgba(23,178,106,0); } }
  @keyframes hx-shake { 0%, 100% { translate: 0; } 18% { translate: -3px; } 40% { translate: 2.5px; } 62% { translate: -1.5px; } 82% { translate: .6px; } }
  @keyframes hx-heavy { 0% { scale: 1; } 35% { scale: .965; } 100% { scale: 1; } }
  @keyframes hx-ring  { 0% { box-shadow: 0 0 0 0 rgba(217,45,32,.22); } 100% { box-shadow: 0 0 0 12px rgba(217,45,32,0); } }
  .hx-tick  { animation: hx-tick 360ms ${EASE_OUT}; }
  .hx-ok    { animation: hx-ok 1000ms ${EASE_IO}; }
  .hx-shake { animation: hx-shake 560ms ${EASE_IO}; }
  .hx-heavy { animation: hx-heavy 420ms ${EASE_OUT}; }
  .hx-ring  { animation: hx-ring 900ms ${EASE_OUT}; }
  /* Press: controls sink slightly under the finger and spring back on release. */
  :is(.nav-btn, .send, .send-circle, .ws-send, .ws-mic, .ws-tbtn, .ws-tile, .nb-pill, .icon-btn, .act, .ov-tab, .lt-filter, .lt-more,
      .aid-exp, .cn-new, .studio-tile, .nb-tile, #homeMic, .fc-nav button, .opt) { transition: scale .38s ${EASE_OUT}; }
  :is(.nav-btn, .send, .send-circle, .ws-send, .ws-mic, .ws-tbtn, .ws-tile, .nb-pill, .icon-btn, .act, .ov-tab, .lt-filter, .lt-more,
      .aid-exp, .cn-new, .studio-tile, .nb-tile, #homeMic, .fc-nav button):active:not(:disabled) { scale: .975; transition: scale .12s ${EASE_IO}; }
  .ws-tile, .ws-row, .sess-row, .nb-card, .ws-shbtn svg, .ws-composer, .ws-send, .ws-mic { transition-timing-function: ${EASE_OUT} !important; transition-duration: .32s !important; }
  .ws-sec .ws-sb { animation: am-rise .5s ${EASE_OUT} both; }
  .opt:active { scale: .995; transition: scale .12s ${EASE_IO}; }
  `;
  const style = document.createElement('style');
  style.id = 'aurora-motion';
  style.textContent = css;
  document.head.appendChild(style);

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const restart = (el, cls) => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };
  const once = (el, cls, ms = 900) => { restart(el, cls); setTimeout(() => el.classList.remove(cls), ms); };
  const visible = (el) => !!(el && (el.offsetParent || el.getClientRects().length));
  const stagger = (els, cls = 'am-rise', step = 40, max = 24) => {
    els.filter(visible).slice(0, max).forEach((el, i) => {
      el.style.animationDelay = `${i * step}ms`;
      once(el, cls, 900 + i * step);
      setTimeout(() => { el.style.animationDelay = ''; }, 1000 + i * step);
    });
  };

  /* ---------- 1. Word by word streaming ----------
   * The app re-renders the whole answer on every tick, so each word's first
   * appearance is remembered and its animation resumes where it left off
   * (negative animation-delay) instead of restarting. */
  const births = new WeakMap();       // answer element -> array of first-seen times per word
  const lastTouch = new WeakMap();    // answer element -> last time it streamed
  const SKIP = new Set(['PRE', 'CODE', 'SCRIPT', 'STYLE', 'SVG', 'BUTTON', 'TEXTAREA']);

  const wrapWords = (root) => {
    let b = births.get(root);
    if (!b) { b = []; births.set(root, b); }
    const t = performance.now();
    lastTouch.set(root, t);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(n) {
        if (!n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        for (let p = n.parentElement; p && p !== root; p = p.parentElement) {
          if (SKIP.has(p.tagName) || p.classList.contains('am-w')) return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    let i = 0;
    for (const n of nodes) {
      const frag = document.createDocumentFragment();
      for (const part of n.nodeValue.split(/(\s+)/)) {
        if (!part) continue;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); continue; }
        if (b[i] === undefined) b[i] = t;
        const age = t - b[i++];
        if (age >= WORD_MS) { frag.appendChild(document.createTextNode(part)); continue; }
        const s = document.createElement('span');
        s.className = 'am-w';
        s.textContent = part;
        s.style.animationDelay = `${-age}ms`;
        frag.appendChild(s);
      }
      n.replaceWith(frag);
    }
  };
  const statusText = new WeakMap();
  // Once the stream finishes and every word has settled, put plain text back.
  const settle = (root) => {
    clearTimeout(root._amSettle);
    root._amSettle = setTimeout(() => {
      if (root.classList.contains('live')) return;
      busy = true;
      root.querySelectorAll('.am-w').forEach(w => w.replaceWith(w.textContent));
      root.normalize();
      mo.takeRecords();
      busy = false;
    }, WORD_MS + 120);
  };
  const isAnswer = (el) => el && el.nodeType === 1 && !el.classList.contains('bubble') &&
    (el.classList.contains('live') || (births.has(el) && performance.now() - (lastTouch.get(el) || 0) < 1500));

  /* ---------- 4. Save: card flies from the message into Saved docs ---------- */
  let pendingSave = null;
  const knownSaved = new Set($$('#savedBody .saved-row').map(r => r.dataset.id));
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-act="save"], .w-save');
    if (!btn || btn.classList.contains('ok')) return;
    const from = btn.closest('.msg') || btn.closest('.widget') || btn;
    pendingSave = { rect: from.getBoundingClientRect(), t: performance.now() };
  }, true);

  const stageScale = () => {
    const st = $('#stage');
    if (!st) return 1;
    const m = getComputedStyle(st).transform;
    if (!m || m === 'none') return 1;
    return parseFloat(m.slice(m.indexOf('(') + 1)) || 1;
  };

  const fly = (src, row) => {
    const to = row.getBoundingClientRect();
    if (!to.width) { once(row, 'am-land'); return; }
    const S = stageScale();
    const ghost = document.createElement('div');
    ghost.className = 'am-ghost';
    Object.assign(ghost.style, { left: `${to.left}px`, top: `${to.top}px`, width: `${to.width}px`, height: `${to.height}px` });
    const inner = row.cloneNode(true);
    inner.classList.add('am-ghost-in');
    Object.assign(inner.style, { width: `${to.width / S}px`, transform: `scale(${S})`, margin: '0' });
    ghost.appendChild(inner);
    document.body.appendChild(ghost);
    row.style.visibility = 'hidden';

    const s0 = Math.min(3, Math.max(1, src.width / to.width));
    const dx = src.left - to.left, dy = src.top - to.top;
    const anim = ghost.animate([
      { transform: `translate(${dx}px, ${dy}px) scale(${s0})`, opacity: 0, filter: 'blur(3px)' },
      { transform: `translate(${dx * 0.55}px, ${dy * 0.55}px) scale(${1 + (s0 - 1) * 0.5})`, opacity: 1, filter: 'blur(1.5px)', offset: 0.35 },
      { transform: 'none', opacity: 1, filter: 'blur(0)' },
    ], { duration: 900, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards' });
    anim.onfinish = () => {
      ghost.remove();
      row.style.visibility = '';
      once(row, 'am-land', 600);
      haptic('success');
      const badge = $$('[data-go="library"] span').filter(visible).find(s => /^\d+$/.test(s.textContent.trim()));
      if (badge) once(badge, 'am-bump', 500);
    };
  };

  /* ---------- 4b. Spaces: a saved quiz or deck flies into Studio's saved list ---------- */
  let pendingSpSave = null;
  const knownOut = new Set($$('#spOutList [data-aidopen]').map(b => b.dataset.aidopen));
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-spact="saveaid"], #mFoot .nav-btn.primary');
    if (!b) return;
    if (b.matches('#mFoot .nav-btn') && !(b.textContent.trim() === 'Save to Space' && $('.modal.aid-full'))) return;
    const from = b.matches('#mFoot .nav-btn') ? $('.modal.aid-full') : (b.closest('.aid-card') || b);
    pendingSpSave = { rect: from.getBoundingClientRect(), t: performance.now() };
  }, true);
  const onSpOut = () => {
    const rows = $$('#spOutList [data-aidopen]');
    const fresh = rows.filter(r => !knownOut.has(r.dataset.aidopen));
    rows.forEach(r => knownOut.add(r.dataset.aidopen));
    if (!fresh.length) return;
    const row = fresh[0].closest('li') || fresh[0];
    const sec = row.closest('.ws-sec');
    if (sec && sec.classList.contains('closed')) sec.querySelector('.ws-shbtn')?.click();   // reopen Studio so the landing is visible
    const side = row.closest('.ws-side');
    if (side) { const r = row.getBoundingClientRect(), sr = side.getBoundingClientRect(); if (r.top < sr.top || r.bottom > sr.bottom) row.scrollIntoView({ block: 'nearest' }); }
    const p = pendingSpSave;
    pendingSpSave = null;
    const head = row.closest('.ws-sec')?.querySelector('.ws-sh h2');
    if (p && performance.now() - p.t < 4000 && visible(row)) {
      // wait a frame so the popup (if any) has closed and layout has settled
      requestAnimationFrame(() => { fly(p.rect, row); if (head) setTimeout(() => once(head, 'am-bump', 700), 880); });
    } else once(row, 'am-land', 900);
  };

  const onSavedRows = () => {
    const rows = $$('#savedBody .saved-row');
    const fresh = rows.filter(r => r.dataset.id && !knownSaved.has(r.dataset.id));
    rows.forEach(r => r.dataset.id && knownSaved.add(r.dataset.id));
    if (!fresh.length) return;
    const p = pendingSave;
    pendingSave = null;
    if (p && performance.now() - p.t < 4000 && visible(fresh[0])) fly(p.rect, fresh[0]);
    else fresh.forEach(r => once(r, 'am-land', 600));
  };

  /* ---------- 8. Haptics ----------
   * A small vocabulary, used only where something meaningful happens:
   *   select  – a choice changed (checkbox, tab, source toggle, card flip)
   *   commit  – you sent or confirmed something
   *   success – something was saved, an answer was right, a deck was finished
   *   error   – a wrong answer, a field that needs fixing, something that failed
   *   heavy   – a destructive or interrupting action (delete, stop generating)
   *   listen  – the microphone started or stopped
   * Vibration only fires where the browser supports it (mostly Android) and right after a
   * user gesture; the visual cue always plays so feedback is never vibration-only. */
  const VIBE = { select: 6, commit: 12, success: [10, 50, 22], error: [28, 45, 28], heavy: 36, listen: [8, 30, 8] };
  // Moments that land together (a tap that causes an error) coalesce: the strongest one wins.
  const PRI = { select: 1, commit: 2, listen: 2, success: 3, error: 4, heavy: 4 };
  let pend = null, pendTimer = 0;
  const haptic = (kind, el, cls) => {
    if (navigator.vibrate && navigator.userActivation?.isActive !== false) {
      if (!pend || (PRI[kind] || 0) >= (PRI[pend] || 0)) pend = kind;
      if (!pendTimer) pendTimer = setTimeout(() => {
        try { navigator.vibrate(VIBE[pend] || 8); } catch { /* not allowed here */ }
        pend = null; pendTimer = 0;
      }, 30);
    }
    if (el && cls) once(el, cls, 1100);
  };
  window.auroraHaptic = haptic;   // the app can call this directly for moments it knows best

  // Gesture-driven moments (all on the user's own click or key, so vibration is allowed).
  document.addEventListener('click', (e) => {
    const t = e.target;
    const b = t.closest('button, [role="button"], label');
    if (!b || b.disabled) return;
    if (b.matches('.nav-btn.danger, .lib-menu .del, [data-bulk="delete"]')) { haptic('heavy', b, 'hx-heavy'); return; }
    if (b.matches('.send.stop, .ws-send.stop, #spSend.stop')) { haptic('heavy', b, 'hx-heavy'); return; }
    if (b.matches('.ws-mic, #micBtn, #homeMic, .ic-mic')) { haptic('listen', b, 'hx-ring'); return; }
    if (b.matches('.send, .send-circle, .ws-send, .ic-send, .nav-btn.primary')) { haptic('commit'); return; }
    if (b.matches('.fc-card, .fc-card *')) { haptic('select'); return; }
    if (b.matches('.ov-tab, .ws-tile, .nb-tile, .studio-tile, .ws-shbtn, .lt-filter')) { haptic('select'); return; }
  }, true);
  // Flashcards flip with Enter/Space too.
  document.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.closest?.('.fc-card')) haptic('select');
  }, true);
  // Checkboxes and radios: a quick tick on the control itself.
  document.addEventListener('change', (e) => {
    const t = e.target;
    if (!t.matches?.('input[type="checkbox"], input[type="radio"]')) return;
    haptic('select', t.closest('.opt') || t, t.closest('.opt') ? 'hx-tick' : 'am-bump');
  }, true);

  // State-driven moments: watch for the app marking results, errors and saves.
  const seen = new WeakSet();
  const hx = new MutationObserver((recs) => {
    for (const r of recs) {
      const el = r.target;
      if (r.type !== 'attributes' || el.nodeType !== 1 || !visible(el)) continue;
      if (r.attributeName === 'aria-invalid') {
        if (el.getAttribute('aria-invalid') === 'true') haptic('error', el, 'hx-shake');
        continue;
      }
      const cls = el.classList, was = r.oldValue || '';
      const added = (c) => cls.contains(c) && !new RegExp(`(^|\\s)${c}(\\s|$)`).test(was);
      // Quiz grading: one cue per question feedback, then mark each option.
      if (cls.contains('feedback') && !seen.has(el)) {
        if (added('ok')) { seen.add(el); haptic('success', el, 'hx-ok'); }
        else if (added('bad')) { seen.add(el); haptic('error', el, 'hx-shake'); }
      }
      if (added('wrong') && cls.contains('opt')) once(el, 'hx-shake', 700);
      if (added('correct') && cls.contains('opt')) once(el, 'hx-ok', 1100);
      // A save button turned into its "Saved" state.
      if (added('ok') && el.matches('button, .act, .w-save')) haptic('success', el, 'am-bump');
      // A material or upload failed.
      if (added('failed') && el.matches('.mat')) haptic('error', el, 'hx-shake');
    }
  });
  hx.observe(document.body, { subtree: true, attributes: true, attributeOldValue: true, attributeFilter: ['class', 'aria-invalid'] });

  /* ---------- One observer for streamed answers and new content ---------- */
  let busy = false;
  const handleAdded = (el) => {
    if (el.nodeType !== 1 || el.classList.contains('am-w')) return;
    if (el.matches('.msg.me-row')) { once(el, 'am-send', 500); return; }
    if (el.matches('.msg.ai')) { once(el, 'am-swap', 400); }
    if (el.matches('.working')) { once(el, 'am-swap', 400); return; }
    if (el.matches('.actions')) { stagger([...el.children], 'am-rise', 55); return; }
    if (el.matches('.widget, .widget-slot > *')) { once(el, 'am-pop', 700); return; }
    if (el.matches('.saved-row') && el.closest('#savedBody')) { queueMicrotask(onSavedRows); return; }
    // Spaces conversation
    if (el.closest('#spOutList')) { if (!spOutQueued) { spOutQueued = true; queueMicrotask(() => { spOutQueued = false; onSpOut(); }); } return; }
    if (el.matches('.sp-msg') && el.closest('#spThread')) {
      if (spBatch > 2) return;   // a whole session was rendered at once: the thread fades in instead
      if (el.matches('.sp-msg.me')) { once(el, 'am-send', 760); return; }
      if (el.querySelector('.working')) { once(el, 'am-swap', 640); return; }
      return;
    }
    if (el.closest('#spThread .sp-msg.ai') && !el.closest('.body')) {
      // pieces added under a finished answer: sources, actions, the study-aid card
      if (el.matches('.sp-src')) { stagger($$('li', el), 'am-rise', 60, 8); return; }
      if (el.matches('.actions')) { stagger([...el.children], 'am-rise', 60); return; }
      if (el.matches('.aid-card')) { once(el, 'am-pop', 900); return; }
      if (el.matches('.sp-incomplete')) { once(el, 'am-swap', 640); return; }
    }
    if (el.matches('.ws-intro')) { stagger([...el.children], 'am-rise', 70, 6); return; }
    // A flashcard deck reached its "Nice work!" screen.
    if (el.matches('.fc-done h4') || (el.matches?.('h4') && el.closest('.fc-done'))) { haptic('success', el.closest('.fc-done'), 'hx-ok'); }
  };

  let spBatch = 0, spOutQueued = false;
  const mo = new MutationObserver((records) => {
    if (busy) return;
    busy = true;
    try {
      spBatch = 0;
      for (const r of records) r.addedNodes.forEach(n => { if (n.nodeType === 1 && n.matches('.sp-msg')) spBatch++; });
      const answers = new Set();
      for (const r of records) {
        if (r.type === 'attributes') {
          const el = r.target;
          if (r.attributeName === 'hidden' && !el.hidden && el.closest('.widget, .w-card, .fc, .qz, .widget-slot') && visible(el)) once(el, 'am-step', 620);
          if (r.attributeName === 'hidden' && !el.hidden && el.id === 'spWork') requestAnimationFrame(() => stagger($$('#spWork .ws-top, #spWork .ws-chat, #spWork .ws-side'), 'am-rise', 80, 3));
          if (r.attributeName === 'hidden' && !el.hidden && el.id === 'spOverview') requestAnimationFrame(() => stagger($$('#spOverview .nb-ovhead, #spOverview .nb-grid > *'), 'am-rise', 55, 12));
          if (r.attributeName === 'hidden' && !el.hidden && el.matches('.aid-widget')) once(el, 'am-rise', 900);
          continue;
        }
        const tgt = r.target.nodeType === 1 ? r.target : r.target.parentElement;
        if (!tgt) continue;
        // Status line text changed: blur crossfade, only when the words actually change.
        const work = tgt.closest('.working');
        if (work) {
          const s = work.querySelector('.shimmer') || work;
          const txt = s.textContent.trim();
          if (statusText.get(s) !== txt) { statusText.set(s, txt); if (txt) once(s, 'am-swap', 400); }
          continue;
        }
        // Streaming answer text.
        const ans = tgt.closest('.live:not(.bubble)') || (births.has(tgt) ? tgt : null);
        if (ans && isAnswer(ans)) answers.add(ans);
        else if (!tgt.closest('.live')) r.addedNodes.forEach(handleAdded);
      }
      answers.forEach((a) => { wrapWords(a); settle(a); });
      if (spBatch > 2) { const t = $('#spThread'); if (t) once(t, 'am-swap', 640); }
    } finally {
      mo.takeRecords();
      busy = false;
    }
  });
  mo.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['hidden'] });

  /* ---------- 7. View changes stagger their content in ---------- */
  const viewOf = () => (document.body.className.match(/\bview-[\w-]+/) || ['view-study'])[0] + (document.body.classList.contains('chatting') ? ':chat' : '');
  let lastView = viewOf();
  const enterView = () => {
    const v = viewOf();
    if (v === lastView) return;
    lastView = v;
    requestAnimationFrame(() => {
      if (v.startsWith('view-library')) stagger($$('.library .page-head, .library .lt-bar, .library .lt-head, .library .lt-row, .library .lib-row, .library .lib-list > *'), 'am-rise', 45, 16);
      else if (v.startsWith('view-spaces')) stagger($$('#spaces .nb-ovhead, #spaces .nb-grid > *, #spWork:not([hidden]) .ws-top, #spWork:not([hidden]) .ws-chat, #spWork:not([hidden]) .ws-side'), 'am-rise', 70, 12);
      else if (v.startsWith('view-dashboard')) stagger($$('#dashboard .page-head, #dashboard .panel-card, #dashboard .lib-list > *'), 'am-rise', 55, 14);
      else if (!v.endsWith(':chat')) stagger($$('main .home-head, main .card[data-mode], main .composer, main form'), 'am-pop', 80, 8);
    });
  };
  new MutationObserver(enterView).observe(document.body, { attributes: true, attributeFilter: ['class'] });

  /* ---------- 6. Mode cards type their starter prompt ---------- */
  document.addEventListener('click', (e) => {
    const card = e.target.closest('.card[data-mode]');
    if (!card) return;
    haptic('commit');
    setTimeout(() => {
      const p = $('#prompt');
      if (!p) return;
      const form = p.closest('form') || p.parentElement;
      if (form) once(form, 'am-glow', 900);
      const v = p.value;
      if (!v || document.activeElement !== p) return;
      let n = 0;
      p.value = '';
      const tick = () => {
        if (document.activeElement !== p || p.value !== v.slice(0, n)) return; // the person started typing
        n = Math.min(v.length, n + 1 + (Math.random() < 0.3 ? 1 : 0));
        p.value = v.slice(0, n);
        p.dispatchEvent(new Event('input', { bubbles: true }));
        if (n < v.length) setTimeout(tick, 28);
      };
      tick();
    }, 0);
  });

  // First paint of the Study home.
  if (!document.body.classList.contains('chatting')) {
    requestAnimationFrame(() => stagger($$('main .home-head, main .card[data-mode]'), 'am-pop', 80, 8));
  }

  // If the person turns on reduced motion mid-session, stop everything.
  RM.addEventListener?.('change', (ev) => { if (ev.matches) { mo.disconnect(); hx.disconnect(); style.remove(); } });
})();
