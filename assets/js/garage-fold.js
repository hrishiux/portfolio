/* About: the garage folds up behind its line-up (desk pick F2, 11 Nov; from _about-p.html?gfold=F2).
   A tile opens the garage and scrolls to that machine; "close the garage" folds it again.
   A link straight to one machine (about.html#cbr) opens it. Without JS everything shows. */
(function () {
  'use strict';
  var g = document.getElementById('garage'); if (!g || !g.querySelector('.gf')) { return; }
  var rides = g.querySelector('.rides'); if (!rides) { return; }
  rides.id = 'garage-rides';
  g.classList.add('gf-on');
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  rides.insertAdjacentHTML('afterend', '<button type="button" class="btn btn--line gf-close" data-gopen="close">close the garage <span aria-hidden="true">&uarr;</span></button>');
  function each(l, f) { Array.prototype.forEach.call(l, f); }
  function set(open) { g.classList.toggle('is-open', open); each(g.querySelectorAll('[data-gopen]:not([data-gopen="close"])'), function (b) { b.setAttribute('aria-expanded', String(open)); }); }
  g.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-gopen]'); if (!b) { return; }
    var to = b.getAttribute('data-gopen');
    if (to === 'close') { set(false); g.scrollIntoView({ block: 'start' }); return; }
    set(true);
    var t = to !== 'all' && document.getElementById(to);
    if (t) { t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); }
  });
  function fromHash() { var id = location.hash.slice(1); if (id && rides.querySelector('#' + CSS.escape(id))) { set(true); var t = document.getElementById(id); if (t) { t.scrollIntoView({ block: 'start' }); } } }
  fromHash(); window.addEventListener('hashchange', fromHash);
})();
