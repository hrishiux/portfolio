/* Case-study openings (M17, desk pick 11 Nov): the work leans back and stands up flat over the first screen of scrolling. */
(function () {
  'use strict';
  var w = document.querySelector('.cs-hero > .cs-work'); if (!w) { return; }
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) { w.style.setProperty('--k', '.35'); return; }
  var raf = 0;
  function tick() { raf = 0; var k = Math.max(0, Math.min(1, 1 - window.scrollY / 420)); w.style.setProperty('--k', k.toFixed(3)); }
  window.addEventListener('scroll', function () { if (!raf) { raf = requestAnimationFrame(tick); } }, { passive: true });
  tick();
})();
/* the header in the opening's colour, fading into the usual bar over the first 260px (12 Nov) */
(function () {
  'use strict';
  var hero = document.querySelector('.cs-hero'), nav = document.querySelector('.nav'), de = document.documentElement; if (!hero || !nav) { return; }
  var t = (hero.style.getPropertyValue('--cs-tint') || getComputedStyle(hero).getPropertyValue('--cs-tint')).trim(); if (!t) { return; }
  de.style.setProperty('--hd-tint', t); de.classList.add('cs-tinted');
  var raf = 0;
  function upd() { raf = 0; var y = window.scrollY, k = Math.max(0, Math.min(1, y / 260)); de.classList.toggle('hd-top', y < 8); nav.style.setProperty('--hd-p', (100 - k * 100).toFixed(1) + '%'); }
  window.addEventListener('scroll', function () { if (!raf) { raf = requestAnimationFrame(upd); } }, { passive: true });
  upd();
})();
