/* NAO body reading style, R1.3 (picked 14 Nov, live for now). Built from _build/nao-read.pl. Tags the friction / solution
   labels, puts bold openers on their own line, and makes the section numbers and block letters into their own spans. */
(function () {
  var D = document.documentElement, R = D.getAttribute('data-r'); if (!R) return;
  var art = document.querySelector('article.prose'); if (!art) return;
  var $$ = function (s, el) { return [].slice.call((el || art).querySelectorAll(s)); };
  /* body text only: paragraphs and lists sitting straight in the article or in a fold, never inside a figure, card or callout */
  var BODY = function (t) { return $$(':scope > ' + t + ', .fold__in > ' + t + ', .point-row > ' + t); };
  /* shared: the friction / solution labels as tags, bold openers on their own line */
  BODY('p').forEach(function (p) {
    var st = p.firstElementChild, t = st && st.tagName === 'STRONG' && p.firstChild === st ? st.textContent.trim() : '';
    if (/^the friction point:?$/i.test(t)) { st.outerHTML = '<span class="rd-tag rd-tag--pain">friction point</span><br>'; p.classList.add('rd-pain'); }
    else if (/^the redesign solution:?$/i.test(t) && p.textContent.trim() === t) { p.innerHTML = '<span class="rd-tag rd-tag--fix">redesign solution</span>'; p.classList.add('rd-fixlabel'); }
  });
  /* 15 Nov fix: only when the bold phrase is a heading of its own (it ends in . : ? ! or the text after it opens with : or a dash);
     a bold phrase that runs on into the sentence stays inline, so no sentence gets split */
  BODY('ul > li').concat(BODY('ol > li')).forEach(function (li) { var st = li.firstElementChild; if (!st || st.tagName !== 'STRONG' || li.firstChild !== st || li.textContent.trim().length <= st.textContent.trim().length + 25) return;
    var nx = st.nextSibling, after = nx && nx.nodeType === 3 ? nx.nodeValue : '';
    if (/[.:?!]$/.test(st.textContent.trim())) { st.classList.add('rd-k'); return; }
    /* "Bold — the rest": the dash (or colon) only separates the two; once the bold part has its own line the line break does
       that, so the separator is hidden from view (screen readers still get it) */
    var m = after.match(/^\s*[:—–-]\s*/); if (!m) return;
    st.classList.add('rd-k'); var sep = document.createElement('span'); sep.className = 'rd-sep'; sep.textContent = m[0];
    nx.nodeValue = after.slice(m[0].length); st.after(sep); });
  if (R === 'R13') {
    $$('h2').forEach(function (h) { var m = h.firstChild && h.firstChild.nodeType === 3 && h.firstChild.nodeValue.match(/^(\d+)\.\s*/); if (m) { h.firstChild.nodeValue = h.firstChild.nodeValue.slice(m[0].length); h.insertAdjacentHTML('afterbegin', '<span class="rd-n">' + (m[1] < 10 ? '0' : '') + m[1] + '</span>'); } });
    $$('h3[id^="block-"]').forEach(function (h) { var m = h.firstChild.nodeValue && h.firstChild.nodeValue.match(/^Block ([A-Z]):\s*/); if (m) { h.firstChild.nodeValue = h.firstChild.nodeValue.slice(m[0].length); h.insertAdjacentHTML('afterbegin', '<span class="rd-letter">' + m[1] + '</span>'); h.classList.add('rd-blockh'); } });
  }
})();
