/* Aurora motion layer
 * Loaded by index.html (<script src="aurora-motion.js" defer>).
 * Principles: one thing moves at a time, nothing bounces, nothing cuts instantly.
 *   1. Answers stream in word by word, each word resolving from a soft blur.
 *   2. Status lines ("Reading 3 sources…", "Writing answer…") crossfade.
 *   3. Chat order: user message, then status, then answer, then widget, then actions.
 *   4. Saving flies a card into "Saved docs" (Study) or Studio's saved list (Spaces).
 *   5. Quiz and flashcard widgets settle in; each new question or card slides in.
 *   6. Study mode cards type their starter prompt into the composer.
 *   7. View changes fade the view, then stagger only its first few cards or rows.
 *   8. Haptics: a vibration where supported, plus a calm visual cue.
 * Speed: <html data-motion-speed="1.5"> makes everything 1.5x longer (default 1).
 * Everything is skipped when the person has asked their system for reduced motion.
 */
(() => {
  'use strict';
  const RM = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (RM.matches) return;

  const SPEED = Math.max(0.25, parseFloat(document.documentElement.dataset.motionSpeed) || 1);
  const D = (ms) => Math.round(ms * SPEED);           // every duration goes through this
  const EASE = 'cubic-bezier(.22,.61,.36,1)';          // the one easing for arrivals and changes
  const EASE_IO = 'cubic-bezier(.4,0,.2,1)';           // flip and fly
  const WORD_MS = D(800);

  /* ---------- Styles ---------- */
  const css = `
  @keyframes am-word { from { opacity: 0; filter: blur(4px); transform: translateY(.1em); } to { opacity: 1; filter: blur(0); transform: none; } }
  @keyframes am-swap { from { opacity: 0; filter: blur(2px); } to { opacity: 1; filter: blur(0); } }
  @keyframes am-fade { from { opacity: 0; } to { opacity: 1; } }
  @keyframes am-rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
  @keyframes am-pop  { from { opacity: 0; filter: blur(6px); transform: translateY(12px); } to { opacity: 1; filter: blur(0); transform: none; } }
  @keyframes am-send { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
  @keyframes am-step { from { opacity: 0; translate: 8px 0; } to { opacity: 1; translate: 0 0; } }
  @keyframes am-land { 0% { box-shadow: 0 0 0 0 rgba(21,112,239,0); background-color: rgba(21,112,239,.10); } 100% { box-shadow: 0 0 0 0 rgba(21,112,239,0); background-color: transparent; } }
  @keyframes am-glow { 0% { box-shadow: 0 0 0 0 rgba(91,140,255,0); } 40% { box-shadow: 0 0 0 5px rgba(91,140,255,.14); } 100% { box-shadow: 0 0 0 0 rgba(91,140,255,0); } }
  @keyframes am-note { 0% { opacity: 1; } 40% { opacity: .55; } 100% { opacity: 1; } }

  .am-w { display: inline-block; animation: am-word ${WORD_MS}ms ${EASE} both; will-change: opacity, filter, transform; }
  .am-swap { animation: am-swap ${D(520)}ms ${EASE} both; }
  .am-fade { animation: am-fade ${D(480)}ms ${EASE} both; }
  .am-rise { animation: am-rise ${D(600)}ms ${EASE} both; }
  .am-pop  { animation: am-pop ${D(720)}ms ${EASE} both; }
  .am-send { animation: am-send ${D(600)}ms ${EASE} both; }
  .am-step { animation: am-step ${D(560)}ms ${EASE} both; }
  .am-land { animation: am-land ${D(800)}ms ${EASE} both; }
  .am-glow { animation: am-glow ${D(1000)}ms ${EASE} both; }
  .am-note { animation: am-note ${D(800)}ms ${EASE}; }
  .am-acts { animation: am-fade ${D(480)}ms ${EASE} ${D(200)}ms both; }

  /* Sources in the Study panel: a calm rise. */
  .src { animation-name: am-rise !important; animation-duration: ${D(600)}ms !important; animation-timing-function: ${EASE} !important; }
  /* Toast: fade and lift, no spring. */
  .toast { transition: opacity ${D(420)}ms ${EASE}, transform ${D(520)}ms ${EASE} !important; }
  /* Flashcards flip evenly; the next card slides in (see the observer). */
  .fc-card { transition: transform ${D(700)}ms ${EASE_IO} !important; }
  /* The app's own entrances and popups, on the same curve. */
  .msg { animation-duration: ${D(600)}ms !important; animation-timing-function: ${EASE} !important; }
  .modal { animation: am-pop ${D(600)}ms ${EASE} both !important; }
  .modal-layer { animation-duration: ${D(480)}ms !important; animation-timing-function: ${EASE} !important; }
  .lib-menu { animation: am-swap ${D(320)}ms ${EASE} both; }
  /* Threads scroll smoothly as answers grow. */
  #thread, .ws-thread, #icThread { scroll-behavior: smooth; }

  .am-ghost { position: fixed; z-index: 9999; pointer-events: none; transform-origin: 0 0; border-radius: 14px; overflow: hidden;
    background: #fff; box-shadow: 0 18px 50px rgba(16,24,40,.18), 0 2px 6px rgba(16,24,40,.08); }
  .am-ghost > .am-ghost-in { transform-origin: 0 0; }

  /* ---------- Haptic visuals: calm cues, no bounce ----------
     They use the independent "scale" / "translate" properties so they never fight an element's own transform. */
  @keyframes hx-tick  { 0% { scale: 1; } 40% { scale: .97; } 100% { scale: 1; } }
  @keyframes hx-ok    { 0% { box-shadow: 0 0 0 0 rgba(23,178,106,0); } 40% { box-shadow: 0 0 0 5px rgba(23,178,106,.16); } 100% { box-shadow: 0 0 0 0 rgba(23,178,106,0); } }
  @keyframes hx-shake { 0%, 100% { translate: 0; } 25% { translate: -3px; } 50% { translate: 2px; } 75% { translate: -1px; } }
  @keyframes hx-heavy { 0% { scale: 1; } 40% { scale: .97; } 100% { scale: 1; } }
  @keyframes hx-ring  { 0% { box-shadow: 0 0 0 0 rgba(217,45,32,.22); } 100% { box-shadow: 0 0 0 12px rgba(217,45,32,0); } }
  .hx-tick  { animation: hx-tick ${D(360)}ms ${EASE}; }
  .hx-ok    { animation: hx-ok ${D(1000)}ms ${EASE}; }
  .hx-shake { animation: hx-shake ${D(560)}ms ${EASE}; }
  .hx-heavy { animation: hx-heavy ${D(420)}ms ${EASE}; }
  .hx-ring  { animation: hx-ring ${D(900)}ms ${EASE}; }
  /* Press: controls sink slightly and ease back on release. */
  :is(.nav-btn, .send, .send-circle, .ws-send, .ws-mic, .ws-tbtn, .ws-tile, .nb-pill, .icon-btn, .act, .ov-tab, .lt-filter, .lt-more,
      .aid-exp, .cn-new, .studio-tile, .nb-tile, #homeMic, .fc-nav button, .opt) { transition: scale ${D(380)}ms ${EASE}; }
  :is(.nav-btn, .send, .send-circle, .ws-send, .ws-mic, .ws-tbtn, .ws-tile, .nb-pill, .icon-btn, .act, .ov-tab, .lt-filter, .lt-more,
      .aid-exp, .cn-new, .studio-tile, .nb-tile, #homeMic, .fc-nav button):active:not(:disabled) { scale: .975; transition: scale ${D(120)}ms ${EASE}; }
  .opt:active { scale: .995; transition: scale ${D(120)}ms ${EASE}; }
  .ws-tile, .ws-row, .sess-row, .nb-card, .ws-shbtn svg, .ws-composer, .ws-send, .ws-mic { transition-timing-function: ${EASE} !important; transition-duration: ${D(320)}ms !important; }
  .ws-sec .ws-sb { animation: am-fade ${D(480)}ms ${EASE} both; }
  `;
  const style = document.createElement('style');
  style.id = 'aurora-motion';
  style.textContent = css;
  document.head.appendChild(style);

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const restart = (el, cls) => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };
  const once = (el, cls, ms = 900) => { restart(el, cls); setTimeout(() => el.classList.remove(cls), D(ms)); };
  const visible = (el) => !!(el && (el.offsetParent || el.getClientRects().length));
  // Stagger only the first few items; anything after them simply appears with the view.
  const stagger = (els, cls = 'am-rise', step = 70, max = 8, start = 0) => {
    els.filter(visible).slice(0, max).forEach((el, i) => {
      const delay = D(start + i * step);
      el.style.animationDelay = `${delay}ms`;
      once(el, cls, 900 + start + i * step);
      setTimeout(() => { el.style.animationDelay = ''; }, delay + D(1000));
    });
  };

  /* ---------- 1. Word by word streaming ----------
   * The app re-renders the whole answer on every tick, so each word's first
   * appearance is remembered and its animation resumes where it left off
   * (negative animation-delay) instead of restarting. */
  const births = new WeakMap();
  const lastTouch = new WeakMap();
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

  /* ---------- 4. Save: a card flies into the saved list ---------- */
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

  const fly = (src, row, after) => {
    const to = row.getBoundingClientRect();
    if (!to.width) { once(row, 'am-land', 800); return; }
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
      { transform: `translate(${dx}px, ${dy}px) scale(${s0})`, opacity: 0 },
      { transform: `translate(${dx * 0.55}px, ${dy * 0.55}px) scale(${1 + (s0 - 1) * 0.5})`, opacity: 1, offset: 0.35 },
      { transform: 'none', opacity: 1 },
    ], { duration: D(1000), easing: EASE_IO, fill: 'forwards' });
    anim.onfinish = () => {
      ghost.remove();
      row.style.visibility = '';
      once(row, 'am-land', 800);
      haptic('success');
      if (after) after();
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
      requestAnimationFrame(() => fly(p.rect, row, () => { if (head) once(head, 'am-note', 800); }));   // after any popup has closed
    } else once(row, 'am-land', 800);
  };

  const onSavedRows = () => {
    const rows = $$('#savedBody .saved-row');
    const fresh = rows.filter(r => r.dataset.id && !knownSaved.has(r.dataset.id));
    rows.forEach(r => r.dataset.id && knownSaved.add(r.dataset.id));
    if (!fresh.length) return;
    const p = pendingSave;
    pendingSave = null;
    if (p && performance.now() - p.t < 4000 && visible(fresh[0])) fly(p.rect, fresh[0]);
    else fresh.forEach(r => once(r, 'am-land', 800));
  };

  /* ---------- 8. Haptics ----------
   *   select  – a choice changed (checkbox, tab, source toggle, card flip)
   *   commit  – you sent or confirmed something
   *   success – something was saved, an answer was right, a deck was finished
   *   error   – a wrong answer, a field that needs fixing, something that failed
   *   heavy   – a destructive or interrupting action (delete, stop generating)
   *   listen  – the microphone started or stopped
   * Vibration only fires where the browser supports it (mostly Android) and right after a
   * user gesture; the visual cue always plays so feedback is never vibration-only. */
  const VIBE = { select: 6, commit: 12, success: [10, 50, 22], error: [28, 45, 28], heavy: 36, listen: [8, 30, 8] };
  const PRI = { select: 1, commit: 2, listen: 2, success: 3, error: 4, heavy: 4 };   // the strongest of near-simultaneous moments wins
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
  window.auroraHaptic = haptic;

  document.addEventListener('click', (e) => {
    const b = e.target.closest('button, [role="button"], label');
    if (!b || b.disabled) return;
    if (b.matches('.nav-btn.danger, .lib-menu .del, [data-bulk="delete"]')) { haptic('heavy', b, 'hx-heavy'); return; }
    if (b.matches('.send.stop, .ws-send.stop, #spSend.stop')) { haptic('heavy', b, 'hx-heavy'); return; }
    if (b.matches('.ws-mic, #micBtn, #homeMic, .ic-mic')) { haptic('listen', b, 'hx-ring'); return; }
    if (b.matches('.send, .send-circle, .ws-send, .ic-send, .nav-btn.primary')) { haptic('commit'); return; }
    if (b.matches('.fc-card, .fc-card *')) { haptic('select'); return; }
    if (b.matches('.ov-tab, .ws-tile, .nb-tile, .studio-tile, .ws-shbtn, .lt-filter')) { haptic('select'); return; }
  }, true);
  document.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.closest?.('.fc-card')) haptic('select');
  }, true);
  document.addEventListener('change', (e) => {
    const t = e.target;
    if (!t.matches?.('input[type="checkbox"], input[type="radio"]')) return;
    haptic('select', t.closest('.opt') || t, 'hx-tick');
  }, true);

  // State-driven moments: results, errors, saves, and the next flashcard.
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
      // The next flashcard slides in (replaces the old 0.35s cardIn).
      if (added('enter') && cls.contains('fc-card')) { once(el, 'am-step', 700); continue; }
      if (cls.contains('feedback') && !seen.has(el)) {
        if (added('ok')) { seen.add(el); haptic('success', el, 'hx-ok'); }
        else if (added('bad')) { seen.add(el); haptic('error', el, 'hx-shake'); }
      }
      if (added('wrong') && cls.contains('opt')) once(el, 'hx-shake', 700);
      if (added('correct') && cls.contains('opt')) once(el, 'hx-ok', 1100);
      if (added('ok') && el.matches('button, .act, .w-save')) haptic('success', el, 'am-note');
      if (added('failed') && el.matches('.mat')) haptic('error', el, 'hx-shake');
    }
  });
  hx.observe(document.body, { subtree: true, attributes: true, attributeOldValue: true, attributeFilter: ['class', 'aria-invalid'] });

  /* ---------- 3. One observer for the chat order and new content ----------
   * User message → status → answer (streams) → widget → action buttons.
   * The answer bubble itself never animates; only the step that is happening now does. */
  let busy = false, lastSend = 0;
  // A status line that appears right after the user's message waits until the message has mostly settled.
  const statusIn = (w) => {
    const wait = Math.max(0, lastSend + D(420) - performance.now());
    if (wait) { w.style.animationDelay = `${Math.round(wait)}ms`; setTimeout(() => { w.style.animationDelay = ''; }, wait + D(700)); }
    once(w, 'am-swap', 600 + wait / SPEED);
  };
  const handleAdded = (el) => {
    if (el.nodeType !== 1 || el.classList.contains('am-w')) return;
    if (el.matches('.msg.me-row')) { lastSend = performance.now(); once(el, 'am-send', 700); return; }
    if (el.matches('.msg.ai')) {                                   // the empty bubble: only its status line animates
      const w = el.querySelector(':scope > .working'); if (w) statusIn(w);
      return;
    }
    if (el.matches('.working')) { statusIn(el); return; }
    if (el.matches('.actions')) { once(el, 'am-acts', 800); return; }   // all together, after 200 ms
    if (el.matches('.widget, .widget-slot > *, .w-followup')) { once(el, 'am-pop', 820); return; }
    if (el.matches('.saved-row') && el.closest('#savedBody')) { queueMicrotask(onSavedRows); return; }
    // Spaces
    if (el.closest('#spOutList')) { if (!spOutQueued) { spOutQueued = true; queueMicrotask(() => { spOutQueued = false; onSpOut(); }); } return; }
    if (el.matches('.sp-msg') && el.closest('#spThread')) {
      if (spBatch > 2) return;                                     // a whole session rendered at once: the thread fades instead
      if (el.matches('.sp-msg.me')) { lastSend = performance.now(); once(el, 'am-send', 700); return; }
      const w = el.querySelector('.working'); if (w) statusIn(w);
      return;
    }
    if (el.closest('#spThread .sp-msg.ai') && !el.closest('.body')) {
      // under a finished answer: the study-aid card first, then sources and actions together
      if (el.matches('.aid-card, .sp-aid')) { once(el, 'am-pop', 820); return; }
      if (el.matches('.sp-src, .actions, .sp-incomplete')) { once(el, 'am-acts', 800); return; }
    }
    if (el.matches('.ws-intro')) { once(el, 'am-fade', 600); return; }
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
          if (r.attributeName !== 'hidden' || el.hidden) continue;
          if (el.closest('.widget, .w-card, .fc, .qz, .widget-slot') && !el.classList.contains('fc-card') && visible(el)) once(el, 'am-step', 700);
          if (el.id === 'spWork') enterRoot(el, () => $$('#spWork .ws-top, #spWork .ws-chat, #spWork .ws-side'), 90);
          if (el.id === 'spOverview') enterRoot(el, () => $$('#spOverview .nb-grid > *'), 70);
          if (el.matches('.aid-widget')) once(el, 'am-rise', 800);
          continue;
        }
        const tgt = r.target.nodeType === 1 ? r.target : r.target.parentElement;
        if (!tgt) continue;
        // Status line text changed: crossfade, only when the words actually change.
        const work = tgt.closest('.working');
        if (work) {
          const s = work.querySelector('.shimmer') || work;
          const txt = s.textContent.trim();
          if (statusText.get(s) !== txt) { statusText.set(s, txt); if (txt) once(s, 'am-swap', 600); }
          continue;
        }
        const ans = tgt.closest('.live:not(.bubble)') || (births.has(tgt) ? tgt : null);
        if (ans && isAnswer(ans)) answers.add(ans);
        else if (!tgt.closest('.live')) r.addedNodes.forEach(handleAdded);
      }
      answers.forEach((a) => { wrapWords(a); settle(a); });
      if (spBatch > 2) { const t = $('#spThread'); if (t) once(t, 'am-fade', 600); }
    } finally {
      mo.takeRecords();
      busy = false;
    }
  });
  mo.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['hidden'] });

  /* ---------- 7. View changes: fade the view root, then stagger its first few items ---------- */
  function enterRoot(root, items, step = 70, max = 8) {
    if (!root) return;
    requestAnimationFrame(() => {
      once(root, 'am-fade', 600);
      stagger(items(), 'am-rise', step, max, 240);
    });
  }
  const viewOf = () => (document.body.className.match(/\bview-[\w-]+/) || ['view-study'])[0] + (document.body.classList.contains('chatting') ? ':chat' : '');
  let lastView = viewOf();
  const enterView = () => {
    const v = viewOf();
    if (v === lastView) return;
    lastView = v;
    if (v.startsWith('view-library')) enterRoot($('.library'), () => $$('.library .lt-row, .library .lib-list > *'), 60, 8);
    else if (v.startsWith('view-spaces')) {
      const work = $('#spWork:not([hidden])');
      enterRoot($('#spaces'), () => work ? $$('#spWork .ws-top, #spWork .ws-chat, #spWork .ws-side') : $$('#spOverview .nb-grid > *'), work ? 90 : 70, 8);
    }
    else if (v.startsWith('view-dashboard')) enterRoot($('#dashboard'), () => $$('#dashboard .panel-card, #dashboard .lib-list > *'), 70, 6);
    else if (!v.endsWith(':chat')) enterRoot($('main'), () => $$('main .card[data-mode]'), 90, 4);
  };
  new MutationObserver(enterView).observe(document.body, { attributes: true, attributeFilter: ['class'] });

  /* ---------- 6. Mode cards type their starter prompt (1 character every 45 ms) ---------- */
  document.addEventListener('click', (e) => {
    const card = e.target.closest('.card[data-mode]');
    if (!card) return;
    haptic('commit');
    setTimeout(() => {
      const p = $('#prompt');
      if (!p) return;
      const form = p.closest('form') || p.parentElement;
      if (form) once(form, 'am-glow', 1000);
      const v = p.value;
      if (!v || document.activeElement !== p) return;
      let n = 0;
      p.value = '';
      const tick = () => {
        if (document.activeElement !== p || p.value !== v.slice(0, n)) return; // the person started typing
        n = Math.min(v.length, n + 1);
        p.value = v.slice(0, n);
        p.dispatchEvent(new Event('input', { bubbles: true }));
        if (n < v.length) setTimeout(tick, D(45));
      };
      tick();
    }, 0);
  });

  // First paint of the Study home.
  if (!document.body.classList.contains('chatting')) enterRoot($('main'), () => $$('main .card[data-mode]'), 90, 4);

  // If the person turns on reduced motion mid-session, stop everything.
  RM.addEventListener?.('change', (ev) => { if (ev.matches) { mo.disconnect(); hx.disconnect(); style.remove(); } });
})();
