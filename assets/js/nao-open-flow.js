/* NAO opening options H and I (11 Nov): the segment-selection flow from 09 Portfolio directions/a, drawn as one SVG
   (boxes and labels are vector, so it stays sharp inside the tilted window), with no dragging. The dot runs the
   "Stocks and MF" route, the switch flips to "Stocks MF and FnO" and the dot runs the lower route, and so on.
   Clicking a segment jumps to it and the loop carries on from there. */
(function () {
  var root = document.querySelector('[data-hflow-svg]'); if (!root) { return; }
  var stage = root.querySelector('.flow__stage'), canvas = root.querySelector('.flow__canvas');
  var NS = 'http://www.w3.org/2000/svg';
  var NODES = [
    { id: 'seg',  t: ['Segment Selection'],        c: 0, r: 1.25, k: 'both' },
    { id: 'b1',   t: ['Bank Validation'],          c: 1, r: 0.75, k: 'a' },
    { id: 'aa',   t: ['Account Aggregator'],       c: 2, r: 0.75, k: 'a' },
    { id: 'inc',  t: ['Gives Income Proof'],       c: 3, r: 0,    k: 'a' },
    { id: 'pan1', t: ['Provides PAN', 'and DOB'],  c: 3, r: 1,    k: 'a' },
    { id: 'ps1',  t: ['PAN Step'],                 c: 4, r: 1,    k: 'a' },
    { id: 'b2',   t: ['Bank Validation'],          c: 1, r: 2.25, k: 'b' },
    { id: 'eq',   t: ['PAN using Equifax'],        c: 2, r: 2.25, k: 'b' },
    { id: 'ps2',  t: ['PAN Step'],                 c: 3, r: 2.25, k: 'b' }
  ];
  var EDGES = [
    ['seg', 'b1', 'a', 'Stocks and MF'], ['b1', 'aa', 'a'], ['aa', 'inc', 'a'], ['aa', 'pan1', 'a'], ['pan1', 'ps1', 'a'],
    ['seg', 'b2', 'b', 'Stocks MF and FnO'], ['b2', 'eq', 'b'], ['eq', 'ps2', 'b']
  ];
  var ROUTE = { a: ['seg', 'b1', 'aa', 'pan1', 'ps1'], b: ['seg', 'b2', 'eq', 'ps2'] };
  var NW = 150, NH = 54, PAD = 34, pos = {}, seg = 'a';
  NODES.forEach(function (n) { pos[n.id] = { x: PAD + n.c * 196 + (n.c > 0 ? 84 : 0), y: PAD + 10 + n.r * 150 }; });
  var W = 0, H = 0; NODES.forEach(function (n) { W = Math.max(W, pos[n.id].x + NW); H = Math.max(H, pos[n.id].y + NH); }); W += PAD; H += PAD;

  function el(tag, attrs, parent) { var e = document.createElementNS(NS, tag); for (var k in attrs) { e.setAttribute(k, attrs[k]); } if (parent) { parent.appendChild(e); } return e; }
  var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, width: '100%', role: 'img', 'aria-label': 'NAO 2.0 segment selection flow' });
  svg.style.cssText = 'position:static;display:block;width:100%;height:auto;overflow:visible';
  canvas.style.cssText = 'position:static;transform:none'; canvas.appendChild(svg);
  var defs = el('defs', {}, svg);
  defs.innerHTML = '<marker id="hs-on" viewBox="0 0 10 10" refX="2" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="#121212"/></marker><marker id="hs-off" viewBox="0 0 10 10" refX="2" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="#b9b7ae"/></marker>';
  var gE = el('g', {}, svg), gL = el('g', {}, svg), gN = el('g', {}, svg);
  var route = el('path', { fill: 'none', stroke: 'none' }, svg);
  /* Chrome: the moving dot rides on its own layer above the drawing, moved with a transform, so the tilted window under it
     is never redrawn while it runs (that redraw, every frame, is what made it stutter). Firefox keeps the dot in the drawing. */
  var LAYER = !/firefox\//i.test(navigator.userAgent), S = 1, mover = null, halo, dot;
  if (LAYER) {
    mover = document.createElement('div'); mover.className = 'flow__mover';
    mover.style.cssText = 'position:absolute;left:0;top:0;width:0;height:0;will-change:transform;pointer-events:none';
    var ms = el('svg', { width: 1, height: 1, 'aria-hidden': 'true' }); ms.style.cssText = 'position:absolute;left:0;top:0;overflow:visible';
    halo = el('circle', { 'class': 'halo', r: 13 }, ms); dot = el('circle', { 'class': 'dot', r: 6 }, ms);
    mover.appendChild(ms); canvas.style.position = 'relative'; canvas.appendChild(mover);
    var measure = function () { S = (canvas.clientWidth || W) / W; halo.setAttribute('r', (13 * S).toFixed(2)); dot.setAttribute('r', (6 * S).toFixed(2)); };
    measure(); if (window.ResizeObserver) { new ResizeObserver(measure).observe(canvas); } else { window.addEventListener('resize', measure); }
  } else {
    halo = el('circle', { 'class': 'halo', r: 13 }, svg); dot = el('circle', { 'class': 'dot', r: 6 }, svg);
  }

  function elbow(a, b) {
    var R = 10, x1 = a.x + NW, y1 = a.y + NH / 2, x2 = b.x - 8, y2 = b.y + NH / 2, mx = x1 + Math.max(16, (x2 - x1) / 2);
    if (Math.abs(y2 - y1) < 1) { return { d: 'M' + x1 + ' ' + y1 + 'H' + x2, mid: [(x1 + x2) / 2, y1] }; }
    var s = y2 > y1 ? 1 : -1, r = Math.min(R, Math.abs(y2 - y1) / 2, Math.abs(mx - x1));
    return { d: 'M' + x1 + ' ' + y1 + 'H' + (mx - r) + 'Q' + mx + ' ' + y1 + ' ' + mx + ' ' + (y1 + s * r) + 'V' + (y2 - s * r) + 'Q' + mx + ' ' + y2 + ' ' + (mx + r) + ' ' + y2 + 'H' + x2, mid: [mx, (y1 + y2) / 2] };
  }
  var edges = EDGES.map(function (e) {
    var g = elbow(pos[e[0]], pos[e[1]]), p = el('path', { 'class': 'e', d: g.d }, gE), lab = null;
    if (e[3]) {
      var lx = g.mid[0], ly = g.mid[1] + 4, w = e[3].length * 7.1;
      el('rect', { 'class': 'el-bg', x: lx - w / 2 - 6, y: ly - 14, width: w + 12, height: 20, rx: 3 }, gL);
      lab = el('text', { 'class': 'el', x: lx, y: ly, 'text-anchor': 'middle' }, gL); lab.textContent = e[3];
    }
    return { e: e, p: p, lab: lab };
  });
  var nodes = {};
  NODES.forEach(function (n) {
    var p = pos[n.id], g = el('g', { 'class': 'sn' }, gN);
    el('rect', { x: p.x, y: p.y, width: NW, height: NH, rx: 6 }, g);
    var t = el('text', { x: p.x + NW / 2, y: p.y + NH / 2 + 5 - (n.t.length - 1) * 8, 'text-anchor': 'middle' }, g);
    n.t.forEach(function (line, i) { var s = el('tspan', { x: p.x + NW / 2, dy: i ? 16 : 0 }, t); s.textContent = line; });
    nodes[n.id] = g;
  });
  function draw() {
    NODES.forEach(function (n) { nodes[n.id].classList.toggle('off', n.k !== 'both' && n.k !== seg); });
    edges.forEach(function (o) {
      var on = o.e[2] === seg; o.p.classList.toggle('on', on); o.p.setAttribute('marker-end', 'url(#hs-' + (on ? 'on' : 'off') + ')');
      if (o.lab) { o.lab.classList.toggle('on', on); }
    });
    var r = ROUTE[seg], d = '';
    r.forEach(function (id, i) {
      var p = pos[id], cx = p.x + NW / 2, cy = p.y + NH / 2;
      if (!i) { d = 'M' + cx + ' ' + cy; return; }
      var prev = pos[r[i - 1]], g = elbow(prev, p);
      d += ' ' + g.d.replace(/^M[^HVQ]*/, 'L' + (prev.x + NW) + ' ' + (prev.y + NH / 2)) + ' L' + cx + ' ' + cy;
    });
    route.setAttribute('d', d);
    root.querySelectorAll('[data-seg]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-seg') === seg)); });
  }
  function setSeg(s) { seg = s; draw(); t0 = performance.now(); }
  root.querySelectorAll('[data-seg]').forEach(function (b) { b.addEventListener('click', function () { setSeg(b.getAttribute('data-seg')); }); });

  var t0 = performance.now(), RUN = 3600, HOLD = 1100, reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function tick(now) {
    var L = route.getTotalLength ? route.getTotalLength() : 0, el2 = now - t0;
    if (el2 > RUN + HOLD) { setSeg(seg === 'a' ? 'b' : 'a'); el2 = 0; }
    var k = Math.min(1, el2 / RUN);
    if (L) {
      var p = route.getPointAtLength(k * L), on = el2 <= RUN + 250 ? 1 : 0;
      if (LAYER) { mover.style.transform = 'translate3d(' + (p.x * S).toFixed(1) + 'px,' + (p.y * S).toFixed(1) + 'px,0)'; }
      else { dot.setAttribute('cx', p.x); dot.setAttribute('cy', p.y); halo.setAttribute('cx', p.x); halo.setAttribute('cy', p.y); }
      dot.style.opacity = on; halo.style.opacity = on * .18;
      ROUTE[seg].forEach(function (id) { var q = pos[id]; nodes[id].classList.toggle('hit', !!on && p.x >= q.x - 4 && p.x <= q.x + NW + 4 && p.y >= q.y - 4 && p.y <= q.y + NH + 4); });
    }
    requestAnimationFrame(tick);
  }
  draw();
  if (reduce) { dot.style.opacity = 0; halo.style.opacity = 0; } else { requestAnimationFrame(tick); }
})();
/* Chrome only: the tilted window becomes one cached layer while the page scrolls, then is redrawn sharp 200ms after it stops */
(function () {
  if (/firefox\//i.test(navigator.userAgent)) { return; }
  var s = document.querySelector('.cs-work > .cs-stack.no-h'); if (!s) { return; }
  var t = 0;
  window.addEventListener('scroll', function () { s.classList.add('is-moving'); clearTimeout(t); t = setTimeout(function () { s.classList.remove('is-moving'); }, 200); }, { passive: true });
})();
