/* NAO's comparison with Zerodha, Angel One and Groww, drawn as five matching cards (13 Nov, his pick U1 on the desk nao-bench,
   "for now"): one row shape everywhere (app, bar, value; shorter wins), yes / no as a full or empty bar, turnaround in hours with
   N/A as a dashed stub, the notes in one line under each card. Built from the table on the page, which stays for screen readers. */
(function () {
  'use strict';
  var table = document.querySelector('table.bench'); if (!table) return;
  var wrap = table.closest('.tablewrap'); if (!wrap) return;
  var esc = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); };
  var apps = [].slice.call(table.tHead.rows[0].cells, 1).map(function (c) { return c.textContent.trim(); });
  var nm = function (i) { return esc(apps[i].replace(' NAO 2.0', '')); };
  var rows = [].map.call(table.tBodies[0].rows, function (r) {
    var th = r.cells[0], note = th.querySelector('small');
    return { label: th.childNodes[0].textContent.trim(), note: note ? note.textContent : '', cells: [].slice.call(r.cells, 1).map(function (c) {
      var sm = c.querySelector('small'), v = c.cloneNode(true); if (v.querySelector('small')) v.querySelector('small').remove();
      var txt = v.textContent.trim(); return { text: txt, sub: sm ? sm.textContent : '', num: /^\d+$/.test(txt) ? +txt : null };
    }) };
  });
  var hours = function (t) { var m = t.match(/(\d+)\s*hour/); return m ? +m[1] : null; };
  var html = '<p class="bx__k" aria-hidden="true">' + apps.map(function (a, i) { return '<span class="' + (i ? '' : 'us') + '"><i></i>' + esc(a) + '</span>'; }).join('') + '</p><ul class="u1" aria-hidden="true">';
  rows.forEach(function (r) {
    var kind = r.cells[0].num !== null ? 'count' : r.cells.every(function (c) { return /^(yes|no)/i.test(c.text); }) ? 'yesno' : 'hours';
    var vals = r.cells.map(function (c) { return kind === 'count' ? c.num : kind === 'yesno' ? (/^yes/i.test(c.text) ? 1 : 0) : hours(c.text); });
    var mx = Math.max.apply(null, vals.filter(function (v) { return v !== null; })) || 1;
    var notes = r.cells.map(function (c, i) { return c.sub ? nm(i) + ': ' + esc(c.sub) : null; }).filter(Boolean);
    html += '<li><p class="u-q">' + esc(r.label) + '<span class="u-sub">' + esc(r.note || (kind === 'yesno' ? 'yes is better' : '')) + '</span></p><div class="u-bars">' +
      r.cells.map(function (c, i) {
        var v = vals[i], bar = kind === 'yesno' ? '<i class="' + (v ? '' : 'open') + '" style="width:' + (v ? 100 : 22) + '%"></i>' : v === null ? '<i class="na"></i>' : '<i style="width:' + Math.max(4, v / mx * 100) + '%"></i>';
        return '<div class="u-row' + (i ? '' : ' us') + '"><span>' + nm(i) + '</span>' + bar + '<b>' + esc(kind === 'hours' ? c.text.replace(' hours', 'h') : c.text) + '</b></div>';
      }).join('') + '</div>' + (notes.length ? '<p class="u-note">' + notes.join(' · ') + '</p>' : '') + '</li>';
  });
  var box = document.createElement('div'); box.className = 'bx'; box.innerHTML = html + '</ul>';
  wrap.before(box); wrap.classList.add('bx-sr');
})();
