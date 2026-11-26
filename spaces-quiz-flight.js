/* Spaces: "Quiz me on these" → back to the Space chat, the deck flies in.
 * Drop-in: <script src="spaces-quiz-flight.js" defer></script> after aurora-motion.js.
 *
 * In a Space, when the student finishes a flashcard deck (in the popup or inline) and clicks
 * "Quiz me on these":
 *   1. the popup fades out (if the deck was in one),
 *   2. "Quiz me on these N cards" is sent in the Space chat,
 *   3. the deck shrinks with a soft blur into a thumbnail on that message, and the button
 *      flies into the message bubble,
 *   4. Aurora answers in the chat with the Space's normal practice-quiz card.
 * Study and Library items are not touched. Reduced motion: no fade, no flight.
 */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const RM = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wait = (ms) => new Promise(r => setTimeout(r, ms));
  const frame = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const MSG = /^Quiz me on these (\d+) cards$/;
  const STORE = 'assistiv.deckThumbs';

  const css = `
  .sqf-thumb { position: relative; width: 168px; aspect-ratio: 3 / 2; margin-bottom: 10px; align-self: flex-end; }
  .sqf-thumb::before, .sqf-thumb::after, .sqf-deck::before, .sqf-deck::after {
    content: ""; position: absolute; inset: 0; border-radius: 10px; background: #fff; border: 1px solid var(--gray-200, #e9eaeb); }
  .sqf-thumb::before, .sqf-deck::before { transform: rotate(-4deg) translate(-2%, 2%); }
  .sqf-thumb::after, .sqf-deck::after { transform: rotate(3deg) translate(2%, 1%); }
  .sqf-card { position: absolute; inset: 0; z-index: 1; border-radius: 10px; border: 1px solid var(--gray-200, #e9eaeb);
    background: linear-gradient(160deg, #fff 0%, #eef3ff 100%); box-shadow: 0 6px 16px rgba(16,24,40,.10);
    padding: 12px 14px; display: flex; flex-direction: column; gap: 3px; overflow: hidden; text-align: left; }
  .sqf-kick { font-size: 10px; font-weight: 600; letter-spacing: .05em; text-transform: uppercase; color: var(--brand-600, #1f6fe5); }
  .sqf-title { font-size: 14px; font-weight: 600; line-height: 1.2; color: var(--gray-900, #181d27); }
  .sqf-meta { font-size: 12px; color: var(--gray-600, #535862); }
  .sp-msg.me.sqf-has { display: flex; flex-direction: column; align-items: flex-end; }
  .sqf-thumb.sqf-land .sqf-card { animation: sqf-land .8s cubic-bezier(.22,.61,.36,1); }
  @keyframes sqf-land { from { box-shadow: 0 0 0 6px rgba(91,140,255,.22), 0 6px 16px rgba(16,24,40,.10); } to { box-shadow: 0 6px 16px rgba(16,24,40,.10); } }
  .sqf-deck { position: fixed; z-index: 410; pointer-events: none; transform-origin: 0 0; will-change: transform, filter, opacity; }
  .sqf-deck .sqf-card { padding: 28px 32px; gap: 8px; border-radius: 18px; box-shadow: 0 24px 48px rgba(16,24,40,.16); }
  .sqf-deck::before, .sqf-deck::after { border-radius: 18px; }
  .sqf-deck .sqf-kick { font-size: 13px; } .sqf-deck .sqf-title { font-size: 30px; } .sqf-deck .sqf-meta { font-size: 16px; }
  .sqf-ghost { position: fixed; z-index: 411; margin: 0; pointer-events: none; transform-origin: 0 0; will-change: transform, filter; }
  #modalLayer.sqf-out { transition: opacity .35s cubic-bezier(.22,.61,.36,1); opacity: 0; }
  `;
  const st = document.createElement('style'); st.id = 'spaces-quiz-flight'; st.textContent = css; document.head.appendChild(st);

  const cardHTML = (title, n) => `<div class="sqf-card"><div class="sqf-kick">Flashcards</div><div class="sqf-title">${esc(title)}</div><div class="sqf-meta">${n} cards</div></div>`;
  const thumbs = () => { try { return JSON.parse(localStorage.getItem(STORE) || '{}'); } catch { return {}; } };
  const remember = (text, title) => { try { const t = thumbs(); t[text] = title; localStorage.setItem(STORE, JSON.stringify(t)); } catch { /* storage off */ } };

  // Put the deck thumbnail on every "Quiz me on these N cards" message in the Space chat (also after re-renders).
  const decorate = (root = $('#spThread')) => {
    if (!root) return;
    const known = thumbs();
    root.querySelectorAll('.sp-msg.me:not(.sqf-has)').forEach(m => {
      const b = m.querySelector('.bubble'); const t = b && b.textContent.trim(); const hit = t && t.match(MSG);
      if (!hit) return;
      m.classList.add('sqf-has');
      b.insertAdjacentHTML('beforebegin', `<div class="sqf-thumb" aria-hidden="true">${cardHTML(known[t] || 'Flashcards', hit[1])}</div>`);
    });
  };
  const watch = () => { const th = $('#spThread'); if (!th) return setTimeout(watch, 500); decorate(th); new MutationObserver(() => decorate(th)).observe(th, { childList: true, subtree: true }); };
  watch();

  // Fly `ghost` (already placed at rect `a`) onto rect `b`.
  const fly = (ghost, a, b, ms) => new Promise(res => {
    const sx = b.width / a.width, sy = b.height / a.height, dx = b.left - a.left, dy = b.top - a.top;
    const anim = ghost.animate([
      { transform: 'none', filter: 'blur(0)', opacity: 1 },
      { transform: `translate(${dx / 2}px, ${dy / 2}px) scale(${(1 + sx) / 2}, ${(1 + sy) / 2})`, filter: 'blur(4px)', opacity: .92, offset: .5 },
      { transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`, filter: 'blur(0)', opacity: 1 },
    ], { duration: ms, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' });
    anim.onfinish = () => { ghost.remove(); res(); };
  });
  const place = (el, r) => Object.assign(el.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` });

  let running = false;
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.fc-quiz');
    if (!btn || !document.body.classList.contains('view-spaces')) return;
    const widget = btn.closest('.widget.fc');
    const inPopup = !!btn.closest('#modalLayer'), inSpace = !!btn.closest('#spThread');
    if (!widget || !(inPopup || inSpace)) return;
    // Take over from the built-in handler for Spaces only.
    e.preventDefault(); e.stopImmediatePropagation();
    const composer = $('#spComposer'), input = $('#spPrompt'), thread = $('#spThread');
    if (running || !composer || !input || !thread) return;
    running = true;
    try {
      const n = widget.querySelectorAll('.fc-progress .seg').length || Number((widget.querySelector('.fc-done p')?.textContent.match(/all (\d+) cards/) || [])[1]) || 0;
      const title = (widget.querySelector('.w-title')?.textContent || $('#mTitle')?.textContent || 'Flashcards').trim();
      const text = `Quiz me on these ${n} cards`;
      remember(text, title);
      const reduced = RM();

      // Where the deck and the button are now.
      const stage = (widget.querySelector('.fc-stage') || widget).getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();
      const w = Math.min(stage.width * 0.8, stage.height * 1.2), h = w / 1.5;   // a 3:2 deck centred on the card area
      const deckRect = { left: stage.left + (stage.width - w) / 2, top: stage.top + (stage.height - h) / 2, width: w, height: h };

      let deck, pill;
      if (!reduced) {
        deck = document.createElement('div'); deck.className = 'sqf-deck'; deck.innerHTML = cardHTML(title, n); place(deck, deckRect);
        pill = btn.cloneNode(true); pill.classList.add('sqf-ghost'); place(pill, btnRect);
        deck.animate([{ opacity: 0, filter: 'blur(6px)' }, { opacity: 1, filter: 'blur(0)' }], { duration: 300, easing: 'ease-out', fill: 'forwards' });
        document.body.append(deck, pill);
      }

      // Close the popup (fade first), or leave the inline deck where it is.
      if (inPopup) {
        const layer = $('#modalLayer');
        if (!reduced) { layer.classList.add('sqf-out'); await wait(350); }
        ($('#mFoot .nav-btn:not(.primary)') || $('#mClose'))?.click();
        layer.classList.remove('sqf-out');
      }

      // Send the message in the Space chat. spSend renders it synchronously before its first pause.
      input.value = text;
      composer.requestSubmit();
      const me = [...thread.querySelectorAll('.sp-msg.me')].pop();
      if (!me || !me.textContent.includes(text)) { deck?.remove(); pill?.remove(); return; }
      decorate(thread);
      const thumb = me.querySelector('.sqf-thumb'), bubble = me.querySelector('.bubble');
      if (reduced || !thumb) { deck?.remove(); pill?.remove(); return; }

      thumb.style.visibility = 'hidden'; bubble.style.visibility = 'hidden';
      const sb = thread.style.scrollBehavior; thread.style.scrollBehavior = 'auto';
      thread.scrollTop = thread.scrollHeight;
      await frame();
      thread.style.scrollBehavior = sb;
      await Promise.all([fly(deck, deckRect, thumb.getBoundingClientRect(), 950), fly(pill, btnRect, bubble.getBoundingClientRect(), 850)]);
      thumb.style.visibility = ''; bubble.style.visibility = '';
      thumb.classList.add('sqf-land'); setTimeout(() => thumb.classList.remove('sqf-land'), 900);
    } finally {
      running = false;
    }
  }, true);
})();
