/* Review mode: click anything on the page, pin a note to it, copy every note
   out in one go. main.js loads this only after the site was opened with
   ?review (it stays on across pages until "exit"). Notes are kept in this
   browser's localStorage and nowhere else. */
(function () {
  'use strict';
  if (window.__hrReview || !document.body) { return; }
  window.__hrReview = true;

  var KEY = 'hr-review-notes';
  var PIN_KEY = 'hr-review-pin';

  function store(k, v) { try { if (v === null) { localStorage.removeItem(k); } else { localStorage.setItem(k, v); } } catch (e) {} }
  function read(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }

  var notes;
  try { notes = JSON.parse(read(KEY)) || []; } catch (e) { notes = []; }
  function save() { store(KEY, JSON.stringify(notes)); }

  /* index.html, about.html, work/nao.html ... */
  var page = (function () {
    var p = decodeURIComponent(location.pathname).replace(/\/$/, '/index.html');
    var m = p.match(/(work\/[^\/]+|[^\/]+)$/);
    return m ? m[1] : 'index.html';
  })();
  var toRoot = page.indexOf('work/') === 0 ? '../' : '';

  var pinning = read(PIN_KEY) !== 'off';

  /* ---------- describing what was clicked ---------- */

  function pick(t) {
    if (!t || t.nodeType !== 1) { t = t && t.parentElement; }
    var svg = t && t.closest && t.closest('svg');
    return svg || t;
  }

  function cssPath(el) {
    var parts = [];
    while (el && el.nodeType === 1 && el !== document.body && el !== document.documentElement) {
      if (el.id) { parts.unshift('#' + CSS.escape(el.id)); return parts.join(' > '); }
      var i = 1, s = el;
      while ((s = s.previousElementSibling)) { if (s.tagName === el.tagName) { i++; } }
      parts.unshift(el.tagName.toLowerCase() + ':nth-of-type(' + i + ')');
      el = el.parentElement;
    }
    parts.unshift('body');
    return parts.join(' > ');
  }

  function clip(s, n) {
    s = (s || '').replace(/\s+/g, ' ').trim();
    return s.length > n ? s.slice(0, n - 1) + '…' : s;
  }

  function describe(el) {
    var tag = el.tagName.toLowerCase();
    var media = '';
    if (/^(img|video|source)$/.test(tag)) {
      media = (el.currentSrc || el.src || el.poster || '').split('/').pop().split('?')[0];
    }
    var text = el.getAttribute('aria-label') || el.getAttribute('alt') || el.innerText || el.textContent || '';
    return { tag: tag, text: clip(text, 70), media: decodeURIComponent(media) };
  }

  /* the nearest heading above the element, plus the card it sits in */
  function context(el) {
    var hs = document.querySelectorAll('h1, h2, h3'), best = null;
    for (var i = 0; i < hs.length; i++) {
      var h = hs[i];
      if (h === el || h.contains(el) || (h.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING)) { best = h; }
      else { break; }
    }
    var bits = [];
    if (best) { bits.push(clip(best.innerText || best.textContent, 40)); }
    var card = el.closest('.card');
    var name = card && card.querySelector('.card__name, h3');
    if (name && name !== best) { bits.push(clip(name.innerText || name.textContent, 40) + ' card'); }
    var fig = el.closest('figure');
    var cap = fig && fig.querySelector('figcaption');
    if (cap && !card && !cap.contains(el)) { bits.push('figure: ' + clip(cap.innerText || cap.textContent, 40)); }
    return bits.join(' › ');
  }

  function find(n) {
    try { return document.querySelector(n.sel); } catch (e) { return null; }
  }

  /* ---------- UI (shadow DOM, so the site's CSS and ours never mix) ---------- */

  var host = document.createElement('div');
  host.setAttribute('data-review', '');
  host.style.cssText = 'position:absolute;left:0;top:0;width:0;height:0;z-index:2147483647;';
  document.body.appendChild(host);
  var root = host.attachShadow({ mode: 'open' });

  root.innerHTML = [
    '<style>',
    ':host{all:initial}',
    '*{box-sizing:border-box;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}',
    '.w.probing *{pointer-events:none!important}',
    '.hl{position:fixed;pointer-events:none;border:2px solid #ff5a1f;background:rgba(255,90,31,.07);border-radius:4px;display:none;transition:all .06s}',
    '.pin{position:fixed;width:26px;height:26px;margin:-13px 0 0 -13px;border-radius:50%;background:#111;color:#fff;border:2px solid #fff;',
    '  font:700 12px/22px ui-sans-serif,system-ui,sans-serif;text-align:center;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.35);padding:0}',
    '.pin.dim{opacity:.35}',
    '.pin.flash{animation:fl .9s 2}',
    '@keyframes fl{50%{transform:scale(1.5);background:#ff5a1f}}',
    '.bar{position:fixed;right:16px;bottom:16px;display:flex;align-items:center;gap:2px;background:#111;color:#fff;border-radius:999px;',
    '  padding:4px;box-shadow:0 6px 24px rgba(0,0,0,.3);font-size:12px;max-width:calc(100vw - 32px)}',
    '.bar b{font-weight:600;padding:0 8px 0 10px;white-space:nowrap}',
    '.bar button{background:none;border:0;color:#fff;font-size:12px;padding:7px 10px;border-radius:999px;cursor:pointer;white-space:nowrap}',
    '.bar button:hover{background:rgba(255,255,255,.14)}',
    '.bar button.on{background:#ff5a1f}',
    '.toast{position:fixed;right:16px;bottom:62px;background:#111;color:#fff;font-size:12px;padding:8px 12px;border-radius:8px;display:none;max-width:calc(100vw - 32px)}',
    '.pop,.panel{position:fixed;background:#fff;color:#111;border-radius:12px;box-shadow:0 12px 40px rgba(0,0,0,.28);font-size:13px}',
    '.pop{width:300px;max-width:calc(100vw - 24px);padding:12px;display:none}',
    '.pop .ctx{font-size:11px;color:#666;margin:0 0 8px;line-height:1.4;word-break:break-word}',
    '.pop textarea{width:100%;min-height:84px;resize:vertical;border:1px solid #ccc;border-radius:8px;padding:8px;font-size:13px;color:#111;background:#fff}',
    '.pop textarea:focus{outline:2px solid #ff5a1f;border-color:transparent}',
    '.row{display:flex;gap:6px;justify-content:flex-end;margin-top:8px;align-items:center}',
    '.row .hint{margin-right:auto;font-size:11px;color:#888}',
    '.btn{border:0;border-radius:8px;padding:7px 12px;font-size:12px;cursor:pointer;background:#eee;color:#111}',
    '.btn.go{background:#111;color:#fff}',
    '.btn.del{background:none;color:#c0392b}',
    '.panel{right:16px;bottom:62px;width:360px;max-width:calc(100vw - 32px);max-height:62vh;overflow:auto;padding:6px 0;display:none}',
    '.panel h4{margin:10px 14px 4px;font-size:11px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:.06em}',
    '.panel .it{display:flex;gap:10px;padding:8px 14px;cursor:pointer;align-items:flex-start;line-height:1.35}',
    '.panel .it:hover{background:#f4f4f4}',
    '.panel .n{flex:none;width:22px;height:22px;border-radius:50%;background:#111;color:#fff;font-size:11px;font-weight:700;text-align:center;line-height:22px}',
    '.panel .it small{display:block;color:#888;font-size:11px;margin-top:2px}',
    '.panel .empty{padding:14px;color:#666}',
    '.panel .foot{border-top:1px solid #eee;margin-top:6px;padding:8px 14px 4px;display:flex;justify-content:space-between;align-items:center}',
    '.panel textarea{width:calc(100% - 28px);margin:8px 14px;height:180px;font:11px/1.4 ui-monospace,monospace}',
    '</style>',
    '<div class="w">',
    '  <div class="hl"></div>',
    '  <div class="pins"></div>',
    '  <div class="pop"><p class="ctx"></p><textarea placeholder="what needs changing here?"></textarea>',
    '    <div class="row"><span class="hint">ctrl+enter to save</span><button class="btn del">delete</button><button class="btn cancel">cancel</button><button class="btn go">save</button></div></div>',
    '  <div class="panel"></div>',
    '  <div class="toast"></div>',
    '  <div class="bar"><b>review</b>',
    '    <button class="pinbtn" title="P toggles. Off = click through the site normally">pin</button>',
    '    <button class="listbtn">notes</button>',
    '    <button class="copybtn">copy all</button>',
    '    <button class="exitbtn" title="Leave review mode. Notes are kept">exit</button></div>',
    '</div>'
  ].join('\n');

  function $(s) { return root.querySelector(s); }
  var wrap = $('.w'), hl = $('.hl'), pinsEl = $('.pins'), pop = $('.pop'), ta = pop.querySelector('textarea');
  var ctxEl = pop.querySelector('.ctx'), panel = $('.panel'), toastEl = $('.toast');
  var pinBtn = $('.pinbtn'), listBtn = $('.listbtn');

  var cursorStyle = document.createElement('style');
  cursorStyle.textContent = 'html.hr-pinning, html.hr-pinning *{cursor:crosshair!important}';
  document.head.appendChild(cursorStyle);

  function ours(e) { return e.composedPath && e.composedPath().indexOf(host) !== -1; }

  /* ---------- pins ---------- */

  function here() { return notes.filter(function (n) { return n.page === page; }); }

  function renderBar() {
    pinBtn.classList.toggle('on', pinning);
    pinBtn.textContent = pinning ? 'pin: on' : 'pin: off';
    document.documentElement.classList.toggle('hr-pinning', pinning);
    var h = here().length;
    listBtn.textContent = 'notes ' + notes.length + (notes.length && h !== notes.length ? ' (' + h + ' here)' : '');
    if (!pinning) { hl.style.display = 'none'; }
  }

  function renderPins() {
    pinsEl.textContent = '';
    here().forEach(function (n) {
      var b = document.createElement('button');
      b.className = 'pin';
      b.textContent = n.n;
      b.title = n.note;
      b.dataset.n = n.n;
      b.addEventListener('click', function (e) { e.stopPropagation(); openPop(n, null, e.clientX, e.clientY); });
      pinsEl.appendChild(b);
    });
    place();
  }

  /* fixed-position pins, re-placed on scroll, resize and on a slow tick
     (the prototypes and scroll animations move things without scrolling) */
  function place() {
    var list = here(), btns = pinsEl.children;
    wrap.classList.add('probing');
    for (var i = 0; i < list.length; i++) {
      var n = list[i], b = btns[i], el = find(n), x, y, r;
      if (!b) { continue; }
      r = el && el.getBoundingClientRect();
      if (r && (r.width || r.height)) {
        x = r.left + n.fx * r.width;
        y = r.top + n.fy * r.height;
      } else {
        x = n.px * innerWidth; y = n.py - scrollY;
      }
      var inView = x >= 0 && y >= 0 && x <= innerWidth && y <= innerHeight;
      b.style.display = inView ? '' : 'none';
      if (!inView) { continue; }
      b.style.left = x + 'px';
      b.style.top = y + 'px';
      var hit = el && document.elementFromPoint(x, y);
      b.classList.toggle('dim', !el || !hit || !(hit === el || el.contains(hit) || hit.contains(el)));
    }
    wrap.classList.remove('probing');
  }

  var queued = false;
  function queue() {
    if (queued) { return; }
    queued = true;
    requestAnimationFrame(function () { queued = false; place(); });
  }
  window.addEventListener('scroll', queue, { passive: true, capture: true });
  window.addEventListener('resize', queue, { passive: true });
  setInterval(place, 500);

  /* ---------- note popover ---------- */

  var editing = null;   /* existing note, or a draft for a new one */

  function openPop(note, draft, cx, cy) {
    editing = note || draft;
    ctxEl.textContent = '#' + (note ? note.n : nextN()) + ' · ' + label(editing);
    ta.value = note ? note.note : '';
    pop.querySelector('.del').style.display = note ? '' : 'none';
    pop.style.display = 'block';
    var w = pop.offsetWidth, h = pop.offsetHeight;
    pop.style.left = Math.max(12, Math.min(cx + 14, innerWidth - w - 12)) + 'px';
    pop.style.top = Math.max(12, Math.min(cy + 14, innerHeight - h - 12)) + 'px';
    panel.style.display = 'none';
    setTimeout(function () { ta.focus(); }, 0);
  }

  function closePop() { pop.style.display = 'none'; editing = null; }

  function nextN() { return notes.reduce(function (m, n) { return Math.max(m, n.n); }, 0) + 1; }

  function label(n) {
    var s = [];
    if (n.ctx) { s.push(n.ctx); }
    s.push(n.media ? n.tag + ' ' + n.media : n.text ? n.tag + ' "' + n.text + '"' : n.tag);
    return s.join(' — ');
  }

  function commit() {
    if (!editing) { return; }
    var text = ta.value.trim();
    if (!text) { closePop(); return; }
    if (notes.indexOf(editing) === -1) {
      editing.n = nextN();
      notes.push(editing);
    }
    editing.note = text;
    save(); closePop(); renderPins(); renderBar(); renderPanel();
  }

  pop.querySelector('.go').addEventListener('click', commit);
  pop.querySelector('.cancel').addEventListener('click', closePop);
  pop.querySelector('.del').addEventListener('click', function () {
    var i = notes.indexOf(editing);
    if (i > -1) { notes.splice(i, 1); save(); }
    closePop(); renderPins(); renderBar(); renderPanel();
  });
  ta.addEventListener('keydown', function (e) {
    e.stopPropagation();
    if (e.key === 'Escape') { closePop(); }
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { commit(); }
  });

  /* ---------- capturing clicks on the page ---------- */

  function block(e) {
    if (!pinning || ours(e)) { return; }
    e.stopPropagation();
    e.stopImmediatePropagation();
    if (e.type === 'mousedown' || e.type === 'click' || e.type === 'dblclick') { e.preventDefault(); }
    if (e.type !== 'click') { return; }

    if (pop.style.display === 'block') { commit(); return; }   /* click away saves the draft */

    var el = pick(e.target);
    if (!el || el === document.documentElement || el === document.body) { return; }
    var r = el.getBoundingClientRect(), d = describe(el);
    openPop(null, {
      page: page,
      sel: cssPath(el),
      tag: d.tag, text: d.text, media: d.media,
      ctx: context(el),
      fx: r.width ? (e.clientX - r.left) / r.width : 0.5,
      fy: r.height ? (e.clientY - r.top) / r.height : 0.5,
      px: e.clientX / innerWidth,
      py: e.clientY + scrollY,
      vw: innerWidth,
      at: new Date().toISOString().slice(0, 16).replace('T', ' ')
    }, e.clientX, e.clientY);
  }
  ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'click', 'dblclick', 'touchstart', 'touchend'].forEach(function (t) {
    window.addEventListener(t, block, true);
  });

  window.addEventListener('mousemove', function (e) {
    if (!pinning || ours(e) || pop.style.display === 'block') { hl.style.display = 'none'; return; }
    var el = pick(e.target);
    if (!el || el === document.documentElement || el === document.body) { hl.style.display = 'none'; return; }
    var r = el.getBoundingClientRect();
    hl.style.display = 'block';
    hl.style.left = r.left - 2 + 'px'; hl.style.top = r.top - 2 + 'px';
    hl.style.width = r.width + 4 + 'px'; hl.style.height = r.height + 4 + 'px';
  }, { passive: true });
  document.addEventListener('mouseleave', function () { hl.style.display = 'none'; });

  function setPinning(on) {
    pinning = on;
    store(PIN_KEY, on ? null : 'off');
    renderBar();
    toast(on ? 'pin on: click anything to leave a note' : 'pin off: the site works normally (P to switch back)');
  }

  window.addEventListener('keydown', function (e) {
    var t = e.target, typing = t && (t.isContentEditable || /^(input|textarea|select)$/i.test(t.tagName));
    if (typing || ours(e) || e.ctrlKey || e.metaKey || e.altKey) { return; }
    if (e.key === 'p' || e.key === 'P') { setPinning(!pinning); }
    if (e.key === 'Escape') { closePop(); panel.style.display = 'none'; }
  });

  /* ---------- notes list ---------- */

  function pages() {
    var order = [];
    notes.forEach(function (n) { if (order.indexOf(n.page) === -1) { order.push(n.page); } });
    return order;
  }

  function renderPanel(showText) {
    panel.textContent = '';
    if (!notes.length) {
      var e = document.createElement('p');
      e.className = 'empty';
      e.textContent = 'No notes yet. With pin on, click anything on the page.';
      panel.appendChild(e);
      return;
    }
    pages().forEach(function (pg) {
      var h = document.createElement('h4');
      h.textContent = pg + (pg === page ? ' (this page)' : '');
      panel.appendChild(h);
      notes.filter(function (n) { return n.page === pg; }).forEach(function (n) {
        var it = document.createElement('div'), num = document.createElement('span'), body = document.createElement('div'), sm = document.createElement('small');
        it.className = 'it'; num.className = 'n'; num.textContent = n.n;
        body.textContent = n.note;
        sm.textContent = label(n);
        body.appendChild(sm);
        it.appendChild(num); it.appendChild(body);
        it.addEventListener('click', function () { goTo(n); });
        panel.appendChild(it);
      });
    });
    var foot = document.createElement('div');
    foot.className = 'foot';
    var clear = document.createElement('button'), copy = document.createElement('button');
    clear.className = 'btn del'; clear.textContent = 'clear all';
    copy.className = 'btn go'; copy.textContent = 'copy all';
    clear.addEventListener('click', function () {
      if (confirm('Delete all ' + notes.length + ' notes on every page?')) { notes = []; save(); renderPins(); renderBar(); renderPanel(); }
    });
    copy.addEventListener('click', copyAll);
    foot.appendChild(clear); foot.appendChild(copy);
    panel.appendChild(foot);
    if (showText) {
      var area = document.createElement('textarea');
      area.value = exportText();
      panel.appendChild(area);
      setTimeout(function () { area.focus(); area.select(); }, 0);
    }
  }

  function goTo(n) {
    if (n.page !== page) { location.href = toRoot + n.page + '#rv-' + n.n; return; }
    var el = find(n);
    if (el && el.getBoundingClientRect().height) { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
    else { scrollTo({ top: n.py - innerHeight / 2, behavior: 'smooth' }); }
    panel.style.display = 'none';
    setTimeout(function () {
      place();
      var b = pinsEl.querySelector('[data-n="' + n.n + '"]');
      if (b) { b.classList.remove('flash'); void b.offsetWidth; b.classList.add('flash'); }
    }, 600);
  }

  listBtn.addEventListener('click', function () {
    var open = panel.style.display === 'block';
    closePop();
    if (!open) { renderPanel(); }
    panel.style.display = open ? 'none' : 'block';
  });
  pinBtn.addEventListener('click', function () { setPinning(!pinning); });

  /* ---------- copy out ---------- */

  function exportText() {
    var out = ['Portfolio review: ' + notes.length + ' note' + (notes.length === 1 ? '' : 's'), ''];
    pages().forEach(function (pg) {
      out.push(pg);
      notes.filter(function (n) { return n.page === pg; }).forEach(function (n) {
        out.push('#' + n.n + '  ' + n.note.replace(/\n/g, '\n    '));
        out.push('    on: ' + label(n) + ' (at ' + n.vw + 'px wide)');
        out.push('    sel: ' + n.sel);
      });
      out.push('');
    });
    return out.join('\n');
  }

  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.style.display = 'block';
    clearTimeout(toast.t);
    toast.t = setTimeout(function () { toastEl.style.display = 'none'; }, 2600);
  }

  function copyAll() {
    if (!notes.length) { toast('no notes to copy yet'); return; }
    var text = exportText();
    var done = function () { toast('copied ' + notes.length + ' notes, paste them into the chat'); };
    var fallback = function () {
      var t = document.createElement('textarea');
      t.value = text;
      t.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
      root.appendChild(t);
      t.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) {}
      root.removeChild(t);
      if (ok) { done(); } else { renderPanel(true); panel.style.display = 'block'; toast('select all and copy from the box'); }
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done, fallback);
    } else { fallback(); }
  }

  $('.copybtn').addEventListener('click', copyAll);
  $('.exitbtn').addEventListener('click', function () {
    store('hr-review', null);
    store(PIN_KEY, null);
    document.documentElement.classList.remove('hr-pinning');
    host.remove();
    cursorStyle.remove();
    location.href = location.pathname + location.hash.replace(/^#rv-\d+$/, '');
  });

  /* ---------- start ---------- */

  renderBar();
  renderPins();
  var jump = /^#rv-(\d+)$/.exec(location.hash);
  if (jump) {
    history.replaceState(null, '', location.pathname + location.search);
    var target = notes.filter(function (n) { return n.n === +jump[1] && n.page === page; })[0];
    if (target) { setTimeout(function () { goTo(target); }, 400); }
  } else {
    toast(pinning ? 'review mode: click anything to pin a note (P switches pin off)' : 'review mode: pin is off (P to switch on)');
  }
})();
