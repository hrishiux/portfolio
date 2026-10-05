/* Review mode. Two tools, one toolbar:
   - pin:  click anything, leave a note on it
   - edit: click a line of text and retype it in place
   "copy all" puts every note and every text edit on the clipboard to paste
   into the chat, where they get applied to the real files.
   main.js loads this only after the site was opened with ?review (it stays on
   across pages until "exit"). Notes and edits live in this browser's
   localStorage and nowhere else; edits show on the page only while review
   mode is on. */
(function () {
  'use strict';
  if (window.__hrReview || !document.body) { return; }
  window.__hrReview = true;

  var KEY = 'hr-review-notes';
  var EDIT_KEY = 'hr-review-edits';
  var MODE_KEY = 'hr-review-mode';

  function store(k, v) { try { if (v === null) { localStorage.removeItem(k); } else { localStorage.setItem(k, v); } } catch (e) {} }
  function read(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function readList(k) { try { return JSON.parse(read(k)) || []; } catch (e) { return []; } }

  var notes = readList(KEY);
  var edits = readList(EDIT_KEY);
  function save() { store(KEY, JSON.stringify(notes)); sync(); }
  function saveEdits() { store(EDIT_KEY, JSON.stringify(edits)); sync(); }

  /* Laptop sync: when the site is served by tools/serve-phone.ps1, every
     change is also sent to the laptop (Portfolio/review-inbox/<device>.json)
     so nothing has to be copied off the phone. Static hosts don't answer the
     ping, so there it quietly stays off. */
  var syncOn = false, syncTimer = null, device = read('hr-review-device');
  if (!device) { device = 'dev-' + Math.random().toString(36).slice(2, 10); store('hr-review-device', device); }
  function sync() {
    if (!syncOn) { return; }
    clearTimeout(syncTimer);
    syncTimer = setTimeout(function () {
      var body = JSON.stringify({ device: device, ua: navigator.userAgent, savedAt: new Date().toISOString(), notes: notes, edits: edits });
      fetch('/__review-save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body, keepalive: true })
        .then(function (r) { if (!r.ok) { throw new Error(r.status); } setSynced(true); })
        .catch(function () { setSynced(false); });
    }, 500);
  }

  /* 'pin' | 'edit' | 'off' (older builds stored pin on/off under hr-review-pin) */
  var mode = read(MODE_KEY) || (read('hr-review-pin') === 'off' ? 'off' : 'pin');

  /* index.html, about.html, work/nao.html ... */
  var page = (function () {
    var p = decodeURIComponent(location.pathname).replace(/\/$/, '/index.html');
    var m = p.match(/(work\/[^\/]+|[^\/]+)$/);
    return m ? m[1] : 'index.html';
  })();
  var toRoot = page.indexOf('work/') === 0 ? '../' : '';

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

  function norm(s) { return (s || '').replace(/\s+/g, ' ').trim(); }
  function clip(s, n) {
    s = norm(s);
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
    if (best && best !== el) { bits.push(clip(best.innerText || best.textContent, 40)); }
    var card = el.closest('.card');
    var name = card && card.querySelector('.card__name, h3');
    if (name && name !== best && name !== el) { bits.push(clip(name.innerText || name.textContent, 40) + ' card'); }
    else if (name && name === el) { bits.push('card title'); }
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
    '.hl.edit{border-color:#2f6fed;background:rgba(47,111,237,.07)}',
    '.pin{position:fixed;width:26px;height:26px;margin:-13px 0 0 -13px;border-radius:50%;background:#111;color:#fff;border:2px solid #fff;',
    '  font:700 12px/22px ui-sans-serif,system-ui,sans-serif;text-align:center;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.35);padding:0}',
    '.pin.dim{opacity:.35}',
    '.pin.flash{animation:fl .9s 2}',
    '@keyframes fl{50%{transform:scale(1.5);background:#ff5a1f}}',
    '.bar{position:fixed;right:16px;bottom:16px;display:flex;align-items:center;gap:2px;background:#111;color:#fff;border-radius:999px;',
    '  padding:4px;box-shadow:0 6px 24px rgba(0,0,0,.3);font-size:12px;max-width:calc(100vw - 32px)}',
    '.bar b{font-weight:600;padding:0 8px 0 10px;white-space:nowrap}',
    '.bar .sync{flex:none;width:8px;height:8px;margin-left:8px;border-radius:50%;background:#3ccf74}',
    '.bar .sync.off{background:#e5534b}',
    '.bar .sync[hidden]{display:none}',
    '.bar button{background:none;border:0;color:#fff;font-size:12px;padding:7px 10px;border-radius:999px;cursor:pointer;white-space:nowrap}',
    '.bar button:hover{background:rgba(255,255,255,.14)}',
    '.bar button.on{background:#ff5a1f}',
    '.bar button.editbtn.on{background:#2f6fed}',
    '@media (max-width:440px){.bar b{display:none}.bar button{padding:7px 8px}}',
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
    '.panel{right:16px;bottom:62px;width:380px;max-width:calc(100vw - 32px);max-height:62vh;overflow:auto;padding:6px 0;display:none}',
    '.panel h4{margin:10px 14px 4px;font-size:11px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:.06em}',
    '.panel .it{display:flex;gap:10px;padding:8px 14px;cursor:pointer;align-items:flex-start;line-height:1.35}',
    '.panel .it:hover{background:#f4f4f4}',
    '.panel .n{flex:none;min-width:22px;height:22px;padding:0 5px;border-radius:11px;background:#111;color:#fff;font-size:11px;font-weight:700;text-align:center;line-height:22px}',
    '.panel .n.e{background:#2f6fed}',
    '.panel .body{flex:1;min-width:0;word-break:break-word}',
    '.panel .it small{display:block;color:#888;font-size:11px;margin-top:2px}',
    '.panel .was{color:#999;text-decoration:line-through}',
    '.panel .undo{flex:none;border:0;background:none;color:#c0392b;font-size:11px;cursor:pointer;padding:2px 0}',
    '.panel .empty{padding:14px;color:#666;line-height:1.45}',
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
    '  <div class="bar"><i class="sync" hidden></i><b>review</b>',
    '    <button class="pinbtn" title="P · click anything to leave a note">pin</button>',
    '    <button class="editbtn" title="E · click a line of text and retype it">edit text</button>',
    '    <button class="listbtn">list</button>',
    '    <button class="copybtn">copy all</button>',
    '    <button class="exitbtn" title="Leave review mode. Notes and edits are kept">exit</button></div>',
    '</div>'
  ].join('\n');

  function $(s) { return root.querySelector(s); }
  var wrap = $('.w'), hl = $('.hl'), pinsEl = $('.pins'), pop = $('.pop'), ta = pop.querySelector('textarea');
  var ctxEl = pop.querySelector('.ctx'), panel = $('.panel'), toastEl = $('.toast');
  var pinBtn = $('.pinbtn'), editBtn = $('.editbtn'), listBtn = $('.listbtn');

  /* page-side styles: cursors, the text being edited, and edited text */
  var pageStyle = document.createElement('style');
  pageStyle.textContent = [
    'html.hr-pinning, html.hr-pinning *{cursor:crosshair!important}',
    'html.hr-editing, html.hr-editing *{cursor:text!important}',
    '[data-rv-editing]{outline:2px solid #2f6fed!important;outline-offset:3px;background:rgba(47,111,237,.07)!important;caret-color:#2f6fed}',
    '[data-rv-edited]{background:rgba(47,111,237,.09)!important;box-shadow:inset 0 -2px 0 rgba(47,111,237,.6)!important}'
  ].join('\n');
  document.head.appendChild(pageStyle);

  function ours(e) { return e.composedPath && e.composedPath().indexOf(host) !== -1; }

  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.style.display = 'block';
    clearTimeout(toast.t);
    toast.t = setTimeout(function () { toastEl.style.display = 'none'; }, 2800);
  }

  var syncDot = $('.bar .sync');
  function setSynced(ok) {
    syncDot.hidden = false;
    syncDot.classList.toggle('off', !ok);
    syncDot.title = ok ? 'saved to the laptop too' : 'laptop not reachable: still saved on this device';
    if (!ok && !setSynced.warned) { setSynced.warned = true; toast('could not reach the laptop: everything is still saved on this device'); }
    if (ok) { setSynced.warned = false; }
  }

  /* ---------- toolbar ---------- */

  function hereNotes() { return notes.filter(function (n) { return n.page === page; }); }
  function hereEdits() { return edits.filter(function (d) { return d.page === page; }); }

  function renderBar() {
    pinBtn.classList.toggle('on', mode === 'pin');
    editBtn.classList.toggle('on', mode === 'edit');
    document.documentElement.classList.toggle('hr-pinning', mode === 'pin');
    document.documentElement.classList.toggle('hr-editing', mode === 'edit');
    var bits = [];
    if (notes.length) { bits.push(notes.length + (notes.length === 1 ? ' note' : ' notes')); }
    if (edits.length) { bits.push(edits.length + (edits.length === 1 ? ' edit' : ' edits')); }
    listBtn.textContent = bits.length ? 'list · ' + bits.join(', ') : 'list';
    if (mode === 'off') { hl.style.display = 'none'; }
  }

  function setMode(m, quiet) {
    if (active) { finishEdit(); }
    if (m !== 'pin') { closePop(); }
    mode = m;
    store(MODE_KEY, m);
    hl.style.display = 'none';
    renderBar();
    if (quiet) { return; }
    toast(m === 'pin' ? 'pin: click anything to leave a note'
      : m === 'edit' ? 'edit text: click a line of text and type. Enter or click away to keep it, Esc to undo'
      : 'review paused: the site works normally (P to pin, E to edit text)');
  }

  /* ---------- pins ---------- */

  function renderPins() {
    pinsEl.textContent = '';
    hereNotes().forEach(function (n) {
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
    var list = hereNotes(), btns = pinsEl.children;
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
  setInterval(function () { place(); applyEdits(); }, 500);

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
  function nextE() { return edits.reduce(function (m, d) { return Math.max(m, d.n); }, 0) + 1; }

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

  /* ---------- text editing ---------- */

  /* What can be edited: the nearest non-inline element around the click that
     holds text and no media or layout blocks (a heading, a paragraph, a
     label, a button, a list item). Small icons inside it are left alone. */
  var NO_TEXT_INSIDE = 'img,video,picture,canvas,iframe,div,p,ul,ol,li,figure,section,article,header,footer,nav,main,table,h1,h2,h3,h4,h5,h6,blockquote,form,input,textarea,select';
  function textTarget(t) {
    var el = t && (t.nodeType === 1 ? t : t.parentElement);
    if (!el || el === host) { return null; }
    if (el.closest('svg')) { el = el.closest('svg').parentElement; }
    while (el && el.parentElement && el !== document.body && getComputedStyle(el).display === 'inline') { el = el.parentElement; }
    if (!el || el === document.body || el === document.documentElement) { return null; }
    if (/^(img|video|svg|canvas|iframe|input|textarea|select)$/i.test(el.tagName)) { return null; }
    if (!norm(el.textContent)) { return null; }
    if (el.querySelector(NO_TEXT_INSIDE)) { return null; }
    return el;
  }

  function editFor(el) {
    var sel = cssPath(el);
    for (var i = 0; i < edits.length; i++) { if (edits[i].page === page && edits[i].sel === sel) { return edits[i]; } }
    return null;
  }

  function htmlText(html) {
    var d = document.createElement('div');
    d.innerHTML = html;
    return norm(d.textContent);
  }

  var active = null, activeStart = '', activeOrig = '';

  function startEdit(el) {
    var rec = editFor(el);
    active = el;
    activeStart = el.innerHTML;
    activeOrig = rec ? rec.beforeHTML : el.innerHTML;
    el.setAttribute('contenteditable', 'true');
    el.setAttribute('spellcheck', 'true');
    el.setAttribute('data-rv-editing', '');
    el.addEventListener('keydown', onEditKey);
    el.addEventListener('paste', onEditPaste);
    el.addEventListener('blur', onEditBlur);
    hl.style.display = 'none';
    el.focus();
  }

  function finishEdit(revert) {
    var el = active;
    if (!el) { return; }
    active = null;
    if (revert) { el.innerHTML = activeStart; }
    el.removeAttribute('contenteditable');
    el.removeAttribute('spellcheck');
    el.removeAttribute('data-rv-editing');
    el.removeEventListener('keydown', onEditKey);
    el.removeEventListener('paste', onEditPaste);
    el.removeEventListener('blur', onEditBlur);

    var rec = editFor(el);
    var beforeText = htmlText(activeOrig), afterText = norm(el.textContent);
    if (afterText === beforeText) {
      if (rec) { edits.splice(edits.indexOf(rec), 1); }
      el.innerHTML = activeOrig;
      el.removeAttribute('data-rv-edited');
    } else {
      if (!rec) {
        rec = {
          n: nextE(), page: page, sel: cssPath(el), tag: el.tagName.toLowerCase(),
          ctx: context(el), beforeHTML: activeOrig, beforeText: beforeText,
          vw: innerWidth, at: new Date().toISOString().slice(0, 16).replace('T', ' ')
        };
        edits.push(rec);
      }
      rec.afterHTML = el.innerHTML;
      rec.afterText = afterText;
      rec.applied = true;
      el.setAttribute('data-rv-edited', rec.n);
    }
    saveEdits(); renderBar();
    if (panel.style.display === 'block') { renderPanel(); }
  }

  function onEditKey(e) {
    e.stopPropagation();   /* keep the site's own key handlers out of it */
    if (e.key === 'Escape') { e.preventDefault(); finishEdit(true); toast('edit undone'); }
    else if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); finishEdit(); }
  }
  function onEditPaste(e) {
    e.preventDefault();
    var t = (e.clipboardData || window.clipboardData).getData('text/plain') || '';
    document.execCommand('insertText', false, t.replace(/\s*\n\s*/g, ' '));
  }
  function onEditBlur() { if (active) { finishEdit(); } }

  /* show saved edits on the page; the prototypes build their DOM late, so
     this runs on the slow tick until every edit for this page has landed */
  function applyEdits() {
    if (active) { return; }
    hereEdits().forEach(function (d) {
      var el = find(d);
      if (!el) { d.applied = false; return; }
      if (el.hasAttribute('data-rv-edited')) { return; }
      var now = norm(el.textContent);
      if (now === d.beforeText) { el.innerHTML = d.afterHTML; el.setAttribute('data-rv-edited', d.n); d.applied = true; }
      else if (now === d.afterText) { el.setAttribute('data-rv-edited', d.n); d.applied = true; }
      else { d.applied = false; }
    });
  }

  function undoEdit(d) {
    var el = d.page === page ? find(d) : null;
    if (el && el.hasAttribute('data-rv-edited')) { el.innerHTML = d.beforeHTML; el.removeAttribute('data-rv-edited'); }
    edits.splice(edits.indexOf(d), 1);
    saveEdits(); renderBar(); renderPanel();
  }

  /* ---------- capturing clicks on the page ---------- */

  function onPinEvent(e) {
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

  function onEditEvent(e) {
    var inside = active && active.contains(e.target);
    e.stopPropagation();
    e.stopImmediatePropagation();
    if (e.type === 'click') { e.preventDefault(); return; }          /* never follow links while editing */
    if (inside) { return; }                                           /* let the caret move inside the text */
    if (e.type === 'pointerdown') {
      if (e.button) { return; }
      var el = textTarget(e.target);
      if (active) { finishEdit(); }
      if (el) { startEdit(el); }                                      /* the mousedown that follows places the caret */
      else { toast('that bit has no plain text to edit: pick a heading, a line or a label'); }
      return;
    }
    if (e.type === 'mousedown' || e.type === 'dblclick') { e.preventDefault(); }
  }

  function onEvent(e) {
    if (ours(e)) { return; }
    if (mode === 'pin') { onPinEvent(e); }
    else if (mode === 'edit') { onEditEvent(e); }
  }
  ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'click', 'dblclick', 'touchstart', 'touchend'].forEach(function (t) {
    window.addEventListener(t, onEvent, true);
  });

  window.addEventListener('mousemove', function (e) {
    if (mode === 'off' || ours(e) || pop.style.display === 'block') { hl.style.display = 'none'; return; }
    var el = mode === 'edit' ? textTarget(e.target) : pick(e.target);
    if (!el || el === active || el === document.documentElement || el === document.body) { hl.style.display = 'none'; return; }
    var r = el.getBoundingClientRect();
    hl.classList.toggle('edit', mode === 'edit');
    hl.style.display = 'block';
    hl.style.left = r.left - 2 + 'px'; hl.style.top = r.top - 2 + 'px';
    hl.style.width = r.width + 4 + 'px'; hl.style.height = r.height + 4 + 'px';
  }, { passive: true });
  document.addEventListener('mouseleave', function () { hl.style.display = 'none'; });

  window.addEventListener('keydown', function (e) {
    var t = e.target, typing = t && (t.isContentEditable || /^(input|textarea|select)$/i.test(t.tagName));
    if (typing || ours(e) || e.ctrlKey || e.metaKey || e.altKey) { return; }
    if (e.key === 'p' || e.key === 'P') { setMode(mode === 'pin' ? 'off' : 'pin'); }
    if (e.key === 'e' || e.key === 'E') { setMode(mode === 'edit' ? 'off' : 'edit'); }
    if (e.key === 'Escape') { closePop(); panel.style.display = 'none'; }
  });

  /* ---------- the list ---------- */

  function pages() {
    var order = [];
    notes.concat(edits).forEach(function (n) { if (order.indexOf(n.page) === -1) { order.push(n.page); } });
    return order;
  }

  function el(tag, cls, text) {
    var x = document.createElement(tag);
    if (cls) { x.className = cls; }
    if (text != null) { x.textContent = text; }
    return x;
  }

  function renderPanel(showText) {
    panel.textContent = '';
    if (!notes.length && !edits.length) {
      panel.appendChild(el('p', 'empty', 'Nothing yet. "pin" leaves a note on anything; "edit text" lets you click a line and retype it.'));
      return;
    }
    pages().forEach(function (pg) {
      panel.appendChild(el('h4', null, pg + (pg === page ? ' (this page)' : '')));
      notes.filter(function (n) { return n.page === pg; }).forEach(function (n) {
        var it = el('div', 'it'), body = el('div', 'body', n.note);
        body.appendChild(el('small', null, label(n)));
        var del = el('button', 'undo', 'delete');
        del.addEventListener('click', function (e) {
          e.stopPropagation();
          notes.splice(notes.indexOf(n), 1);
          save(); renderPins(); renderBar(); renderPanel();
        });
        it.appendChild(el('span', 'n', n.n)); it.appendChild(body); it.appendChild(del);
        it.addEventListener('click', function () { goTo(n); });
        panel.appendChild(it);
      });
      edits.filter(function (d) { return d.page === pg; }).forEach(function (d) {
        var it = el('div', 'it'), body = el('div', 'body', clip(d.afterText, 160));
        var was = el('small'); was.appendChild(el('span', 'was', clip(d.beforeText, 120)));
        body.appendChild(was);
        body.appendChild(el('small', null, (d.ctx ? d.ctx + ' — ' : '') + d.tag + (d.page === page && d.applied === false ? ' · not on screen right now' : '')));
        var undo = el('button', 'undo', 'undo');
        undo.addEventListener('click', function (e) { e.stopPropagation(); undoEdit(d); });
        it.appendChild(el('span', 'n e', 'E' + d.n)); it.appendChild(body); it.appendChild(undo);
        it.addEventListener('click', function () { goToEdit(d); });
        panel.appendChild(it);
      });
    });
    var foot = el('div', 'foot');
    var clear = el('button', 'btn del', 'clear all'), copy = el('button', 'btn go', 'copy all');
    clear.addEventListener('click', function () {
      if (!confirm('Delete all ' + notes.length + ' notes and ' + edits.length + ' text edits on every page?')) { return; }
      hereEdits().forEach(function (d) { var x = find(d); if (x && x.hasAttribute('data-rv-edited')) { x.innerHTML = d.beforeHTML; x.removeAttribute('data-rv-edited'); } });
      notes = []; edits = []; save(); saveEdits(); renderPins(); renderBar(); renderPanel();
    });
    copy.addEventListener('click', copyAll);
    foot.appendChild(clear); foot.appendChild(copy);
    panel.appendChild(foot);
    if (showText) {
      var area = el('textarea');
      area.value = exportText();
      panel.appendChild(area);
      setTimeout(function () { area.focus(); area.select(); }, 0);
    }
  }

  function scrollToEl(x, fallbackY) {
    if (x && x.getBoundingClientRect().height) { x.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
    else if (fallbackY != null) { scrollTo({ top: fallbackY - innerHeight / 2, behavior: 'smooth' }); }
  }

  function goTo(n) {
    if (n.page !== page) { location.href = toRoot + n.page + '#rv-' + n.n; return; }
    scrollToEl(find(n), n.py);
    panel.style.display = 'none';
    setTimeout(function () {
      place();
      var b = pinsEl.querySelector('[data-n="' + n.n + '"]');
      if (b) { b.classList.remove('flash'); void b.offsetWidth; b.classList.add('flash'); }
    }, 600);
  }

  function goToEdit(d) {
    if (d.page !== page) { location.href = toRoot + d.page + '#rve-' + d.n; return; }
    var x = find(d);
    if (!x) { toast('that text is not on screen right now (inside a prototype screen?)'); return; }
    scrollToEl(x);
    panel.style.display = 'none';
  }

  listBtn.addEventListener('click', function () {
    var open = panel.style.display === 'block';
    closePop();
    if (active) { finishEdit(); }
    if (!open) { renderPanel(); }
    panel.style.display = open ? 'none' : 'block';
  });
  pinBtn.addEventListener('click', function () { setMode(mode === 'pin' ? 'off' : 'pin'); });
  editBtn.addEventListener('click', function () { setMode(mode === 'edit' ? 'off' : 'edit'); });

  /* ---------- copy out ---------- */

  function q(s) { return '"' + s + '"'; }

  function exportText() {
    var head = [];
    if (notes.length) { head.push(notes.length + (notes.length === 1 ? ' note' : ' notes')); }
    if (edits.length) { head.push(edits.length + (edits.length === 1 ? ' text edit' : ' text edits')); }
    var out = ['Portfolio review: ' + head.join(', '), ''];
    pages().forEach(function (pg) {
      out.push(pg);
      notes.filter(function (n) { return n.page === pg; }).forEach(function (n) {
        out.push('#' + n.n + '  ' + n.note.replace(/\n/g, '\n    '));
        out.push('    on: ' + label(n) + ' (at ' + n.vw + 'px wide)');
        out.push('    sel: ' + n.sel);
      });
      edits.filter(function (d) { return d.page === pg; }).forEach(function (d) {
        out.push('E' + d.n + '  TEXT EDIT' + (d.ctx ? ' — ' + d.ctx : '') + ' (' + d.tag + ', at ' + d.vw + 'px wide)');
        out.push('    was: ' + q(d.beforeText));
        out.push('    now: ' + q(d.afterText));
        var h = (d.afterHTML || '').replace(/<svg[\s\S]*?<\/svg>/gi, '');
        if (/<[a-z]/i.test(h)) { out.push('    html: ' + norm(h)); }   /* only when the line has <em>, <i>, links… */
        out.push('    sel: ' + d.sel);
      });
      out.push('');
    });
    return out.join('\n');
  }

  function copyAll() {
    if (active) { finishEdit(); }
    if (!notes.length && !edits.length) { toast('nothing to copy yet'); return; }
    var text = exportText();
    var done = function () { toast('copied, paste it into the chat'); };
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
    if (active) { finishEdit(); }
    store('hr-review', null);
    store(MODE_KEY, null);
    store('hr-review-pin', null);
    location.href = location.pathname + location.hash.replace(/^#rve?-\d+$/, '');
  });

  /* ---------- start ---------- */

  renderBar();
  renderPins();
  applyEdits();
  fetch('/__review-ping', { cache: 'no-store' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (j) { if (j && j.inbox) { syncOn = true; sync(); } })
    .catch(function () {});
  var jump = /^#rv-(\d+)$/.exec(location.hash), jumpE = /^#rve-(\d+)$/.exec(location.hash);
  if (jump || jumpE) {
    history.replaceState(null, '', location.pathname + location.search);
    if (jump) {
      var target = notes.filter(function (n) { return n.n === +jump[1] && n.page === page; })[0];
      if (target) { setTimeout(function () { goTo(target); }, 400); }
    } else {
      var te = edits.filter(function (d) { return d.n === +jumpE[1] && d.page === page; })[0];
      if (te) { setTimeout(function () { applyEdits(); goToEdit(te); }, 600); }
    }
  } else {
    toast(mode === 'pin' ? 'review: pin is on (P). "edit text" (E) lets you retype any line'
      : mode === 'edit' ? 'review: edit text is on (E). Click a line and type'
      : 'review is paused: P to pin, E to edit text');
  }
})();
