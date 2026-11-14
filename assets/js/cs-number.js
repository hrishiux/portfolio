/* Case studies other than NAO (15 Nov, live): NAO's headings carry their numbers in the text; these pages don't, so the sections
   are numbered here in order (restarting after each part heading on Other Upstox work), styled by nao-read.css as big teal
   numbers. The sections rail keeps the plain titles (data-short). Runs before nao-read.js and main.js. */
(function () {
  var art = document.querySelector('article.prose'); if (!art) return;
  var n = 0;
  [].forEach.call(art.querySelectorAll('h2'), function (h) {
    if (h.closest('.cs-part')) { n = 0; return; }
    if (h.closest('figure, .short, .lf-card')) return;
    n++;
    if (!h.hasAttribute('data-short')) h.setAttribute('data-short', h.textContent.trim());
    h.insertAdjacentHTML('afterbegin', '<span class="rd-n">' + (n < 10 ? '0' : '') + n + '</span>');
  });
})();
