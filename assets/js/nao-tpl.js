/* NAO at a glance: the template figure (13 Nov 2026, from the Claude edition, his ask).
   One applicant goes through the blocks: each step's number lights, then (after NAO 2.0) turns into a check
   before the next step lights. Before NAO 2.0 the numbers only light, since nothing was checked until afterwards.
   In "after", drag a block or use the arrow keys to reorder, the way PMs did from the CMS. */
(function () {
  'use strict';
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var each = function (l, f) { Array.prototype.forEach.call(l, f); };
  var CHECK = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 6.2 5 8.5l4.5-5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  each(document.querySelectorAll('[data-tpl]'), function (fig) {
    var row = fig.querySelector('.tpl__row');
    var end = fig.querySelector('.tpl__end');
    var resetBtn = fig.querySelector('[data-reset]');
    var hint = fig.querySelector('[data-hint]');
    var seg = fig.querySelectorAll('[data-set]');
    var blocks = function () { return Array.prototype.slice.call(row.children); };
    var original = blocks().map(function (c) { return c.getAttribute('data-k'); });
    var timer = null, visible = false, runId = 0;

    /* the number and its check share one circle */
    blocks().forEach(function (b) { var n = b.querySelector('.n'); n.innerHTML = '<span>' + n.textContent + '</span>' + CHECK; });

    var renumber = function () {
      blocks().forEach(function (b, i) { b.querySelector('.n span').textContent = (i < 9 ? '0' : '') + (i + 1); });
      if (resetBtn) resetBtn.hidden = blocks().map(function (c) { return c.getAttribute('data-k'); }).join() === original.join();
    };
    var hintDefault = hint ? hint.textContent : '';
    var setHint = function (t) { if (hint) hint.textContent = t; };
    var clear = function () { blocks().forEach(function (b) { b.classList.remove('is-lit', 'is-done'); }); };

    var run = function () {
      var id = ++runId;
      clearTimeout(timer);
      clear();
      var after = fig.getAttribute('data-mode') === 'after';
      if (reduced) { if (after) blocks().forEach(function (b) { b.classList.add('is-done'); }); return; }
      if (!visible) return;
      var list = blocks(), i = 0;
      var step = function () {
        if (id !== runId) return;
        if (i < list.length) {
          var b = list[i];
          b.classList.add('is-lit');
          timer = setTimeout(function () {
            if (id !== runId) return;
            b.classList.remove('is-lit');
            if (after) b.classList.add('is-done');
            i++;
            timer = setTimeout(step, 140);
          }, 460);
        } else {
          if (end && end.animate) end.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.015)' }, { transform: 'scale(1)' }], { duration: 500 });
          timer = setTimeout(function () { if (id !== runId) return; clear(); i = 0; timer = setTimeout(step, 500); }, 2600);
        }
      };
      timer = setTimeout(step, 400);
    };

    var setMode = function (m) {
      fig.setAttribute('data-mode', m);
      each(seg, function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-set') === m ? 'true' : 'false'); });
      setHint(hintDefault);
      run();
    };
    each(seg, function (b) { b.addEventListener('click', function () { setMode(b.getAttribute('data-set')); }); });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { var v = en[0].isIntersecting; if (v !== visible) { visible = v; run(); } }, { threshold: 0.3 }).observe(fig);
    } else { visible = true; run(); }

    /* reorder */
    var natural = function (el) { var t = el.style.transform; el.style.transform = 'none'; var r = el.getBoundingClientRect(); el.style.transform = t; return r; };
    var flipMove = function (el, target, afterIt) {
      var first = new Map();
      blocks().forEach(function (c) { first.set(c, natural(c)); });
      row.insertBefore(el, afterIt ? target.nextSibling : target);
      blocks().forEach(function (c) {
        if (c.classList.contains('is-drag')) return;
        var a = first.get(c), n = natural(c), tx = a.left - n.left, ty = a.top - n.top;
        if (!tx && !ty) return;
        c.style.transition = 'none'; c.style.transform = 'translate(' + tx + 'px,' + ty + 'px)';
        requestAnimationFrame(function () { requestAnimationFrame(function () { c.style.transition = ''; c.style.transform = ''; }); });
      });
      renumber();
    };
    var blocked = function (el) {
      setHint('before NAO 2.0 the order was hard-coded: changing it meant an app release');
      if (el.animate && !reduced) el.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-5px)' }, { transform: 'translateX(5px)' }, { transform: 'translateX(0)' }], { duration: 300 });
    };
    blocks().forEach(function (el) {
      el.setAttribute('tabindex', '0');
      el.addEventListener('keydown', function (e) {
        var k = e.key, list = blocks(), i = list.indexOf(el);
        if (['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown'].indexOf(k) < 0) return;
        e.preventDefault();
        if (fig.getAttribute('data-mode') === 'before') { blocked(el); return; }
        var back = k === 'ArrowLeft' || k === 'ArrowUp';
        if (back && i > 0) flipMove(el, list[i - 1], false);
        if (!back && i < list.length - 1) flipMove(el, list[i + 1], true);
        el.focus(); setHint('the same reorder PMs made from the CMS, with no app release'); run();
      });
      el.addEventListener('pointerdown', function (e) {
        if (e.pointerType === 'touch' || e.button !== 0) return;
        if (fig.getAttribute('data-mode') === 'before') { blocked(el); return; }
        e.preventDefault();
        var sx = e.clientX, sy = e.clientY, ox = 0, oy = 0, moved = false;
        el.setPointerCapture(e.pointerId);
        var move = function (ev) {
          var dx = ev.clientX - sx, dy = ev.clientY - sy;
          if (!moved && Math.abs(dx) + Math.abs(dy) < 5) return;
          if (!moved) { moved = true; el.classList.add('is-drag'); runId++; clearTimeout(timer); clear(); }
          el.style.transform = 'translate(' + (dx - ox) + 'px,' + (dy - oy) + 'px)';
          var hit = null;
          blocks().forEach(function (c) { if (c === el) return; var r = natural(c); if (ev.clientX > r.left && ev.clientX < r.right && ev.clientY > r.top && ev.clientY < r.bottom) hit = c; });
          if (hit) {
            var b0 = natural(el), list = blocks();
            flipMove(el, hit, list.indexOf(el) < list.indexOf(hit));
            var b1 = natural(el); ox += b1.left - b0.left; oy += b1.top - b0.top;
            el.style.transform = 'translate(' + (dx - ox) + 'px,' + (dy - oy) + 'px)';
          }
        };
        var up = function () {
          el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up);
          if (!moved) return;
          el.classList.remove('is-drag'); el.style.transform = '';
          setHint('the same reorder PMs made from the CMS, with no app release');
          run();
        };
        el.addEventListener('pointermove', move); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
      });
    });
    if (resetBtn) resetBtn.addEventListener('click', function () {
      original.forEach(function (k) { row.appendChild(row.querySelector('[data-k="' + k + '"]')); });
      renumber(); setHint(hintDefault); run();
    });
  });
})();
