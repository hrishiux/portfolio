/* The footer hillside, drawn in code (desk pick F2, 11 Nov: "painted, the cursor is the wind"). Lifted from _footer-p.html;
   the other footer options stay there. Falls back to the footer-hill.webp image if this doesn't run. */
(function () {
  'use strict';
  var foot = document.querySelector('.foot'); if (!foot || !window.ResizeObserver) return;
  var fx = document.createElement('div'); fx.className = 'fx'; fx.setAttribute('aria-hidden', 'true'); foot.insertBefore(fx, foot.firstChild);
  document.documentElement.setAttribute('data-f', 'F2');

  var RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DPR = Math.min(2, window.devicePixelRatio || 1);
  var SW = 1600, SH = 600;
  var NS = 'http://www.w3.org/2000/svg';

  function rng(seed) { var s = seed % 2147483647; if (s <= 0) s += 2147483646; return function () { s = s * 16807 % 2147483647; return (s - 1) / 2147483646; }; }
  /* the main slope: low on the left, up to the right edge */
  function ridge(x) { var u = Math.max(0, (x - 380) / 1220); return 600 - 252 * Math.pow(u, 0.86) + 5 * Math.sin(x / 70) + 3 * Math.sin(x / 23); }
  /* the darker hill behind it */
  function back(x) { return 600 - 150 * Math.exp(-Math.pow((x - 800) / 170, 2)); }
  /* scene -> footer pixels; on phones keep the clouds in frame, like background-position:72% */
  function fit() {
    var W = foot.clientWidth, H = foot.clientHeight, s = Math.max(W / SW, H / SH);
    return { W: W, H: H, s: s, ox: (W - SW * s) * (W < 700 ? 0.72 : 1), oy: H - SH * s };
  }

  var CLOUDS = [
    { seed: 7, base: 478, x0: 820, x1: 1190, bumps: [[878, 55, 108], [990, 80, 218], [1092, 62, 165], [1150, 40, 96]] },
    { seed: 19, base: 445, x0: 1212, x1: 1680, bumps: [[1290, 70, 170], [1380, 55, 150], [1470, 50, 205], [1545, 85, 330], [1630, 70, 300]] }
  ];
  var WISPS = [
    { seed: 3, base: 300, x0: 1085, x1: 1165, bumps: [[1120, 30, 26]] },
    { seed: 5, base: 342, x0: 1185, x1: 1265, bumps: [[1222, 32, 24]] },
    { seed: 11, base: 418, x0: 740, x1: 830, bumps: [[784, 34, 22]] },
    { seed: 13, base: 150, x0: 1420, x1: 1560, bumps: [[1480, 45, 26]] }
  ];
  function env(c, x) { var m = 0; c.bumps.forEach(function (b) { m = Math.max(m, b[2] * Math.exp(-Math.pow((x - b[0]) / b[1], 2))); }); return m; }
  /* a cumulus as overlapping puffs: one row tracing the top, the rest filling it in */
  function puffs(c) {
    if (c.ps) return c.ps;
    var R = rng(c.seed), out = [], x, h, r, y, i;
    var small = c.bumps[0][2] < 40;
    for (x = c.x0; x <= c.x1; x += (small ? 5 : 10) + R() * (small ? 5 : 11)) {
      h = env(c, x); if (h < (small ? 6 : 16)) continue;
      r = small ? 6 + R() * 7 : (13 + Math.min(44, h * 0.21)) * (0.65 + R() * 0.55);
      out.push([x + (R() - 0.5) * 8, c.base - h + r * 0.9, r]);
    }
    var n = Math.round((c.x1 - c.x0) / (small ? 8 : 10));
    for (i = 0; i < n; i++) {
      x = c.x0 + R() * (c.x1 - c.x0); h = env(c, x); if (h < (small ? 6 : 18)) continue;
      r = small ? 5 + R() * 6 : 20 + R() * Math.min(52, h * 0.3);
      y = c.base - R() * h * 0.8; if (y - r < c.base - h) y = c.base - h + r;
      out.push([x, y, r]);
    }
    out.sort(function (a, b) { return a[1] - b[1]; }); /* top first, the lower puffs sit in front */
    c.ps = out; c.top = Math.min.apply(null, out.map(function (p) { return p[1] - p[2]; })) - 4;
    return out;
  }

  /* ---------------- palettes (F3 picks one by the visitor's clock) ---------------- */
  var PAL = {
    day: {
      sky: ['#022427', '#05393b', '#0d5d62', '#1d8b95'], glow: 'rgba(95,215,222,.45)', shaft: 0.06,
      cBase: '#9ec8d1', cMid: '#d9ecea', cLight: '#fffaea', cShade: 'rgba(60,112,132,.42)',
      wBase: '#164a52', wMid: '#2b6d74', wLight: '#4e9198',
      back: '#16402f', hillTop: '#4c9739', hillBot: '#1b5527', hillLeft: 'rgba(4,30,28,.8)', rim: 'rgba(175,235,120,.5)',
      tex: ['rgba(140,205,90,.2)', 'rgba(16,64,28,.3)'], bush: ['#173f25', '#285f31', '#43853b'],
      blades: ['#1f5428', '#2f7530', '#45913b', '#64ad4a'], stem: '#3b7d33',
      flowers: [['#f59bb1', 3], ['#f7d45b', 4], ['#f8f1dd', 3], ['#f07b5b', 1], ['#e3a7d0', 1]], poppy: '#ea5a70', eye: '#f6d35a'
    },
    dawn: {
      sky: ['#081a28', '#173246', '#6d7f93', '#efb68c'], glow: 'rgba(255,214,160,.5)', shaft: 0.07,
      cBase: '#b3aec4', cMid: '#ecd6cf', cLight: '#fff3df', cShade: 'rgba(96,92,140,.4)',
      wBase: '#3a4a64', wMid: '#6a6f8a', wLight: '#b49aa2',
      back: '#183c30', hillTop: '#548f3f', hillBot: '#1a4a29', hillLeft: 'rgba(4,20,28,.8)', rim: 'rgba(255,222,160,.5)',
      tex: ['rgba(230,210,140,.16)', 'rgba(16,52,30,.3)'], bush: ['#163b26', '#2a5c33', '#4c823e'],
      blades: ['#1f4f2b', '#336f35', '#4d8d42', '#76a95a'], stem: '#3b7136',
      flowers: [['#f5a3b4', 3], ['#f7d870', 4], ['#fbf0e2', 3], ['#f08a6a', 1]], poppy: '#e8667a', eye: '#f6d870'
    },
    dusk: {
      sky: ['#0a1222', '#1d2342', '#6b3c58', '#d27459'], glow: 'rgba(255,165,105,.48)', shaft: 0.05,
      cBase: '#8a7499', cMid: '#e2a497', cLight: '#ffdcaa', cShade: 'rgba(64,44,96,.48)',
      wBase: '#2c2645', wMid: '#5a3f62', wLight: '#a86a72',
      back: '#1b2d2a', hillTop: '#406a33', hillBot: '#132c1e', hillLeft: 'rgba(6,10,22,.82)', rim: 'rgba(255,180,115,.55)',
      tex: ['rgba(240,170,100,.14)', 'rgba(8,24,16,.32)'], bush: ['#122a1d', '#1f4127', '#3a5f31'],
      blades: ['#183621', '#25502a', '#386c35', '#5a8a45'], stem: '#2c552b',
      flowers: [['#e98aa2', 3], ['#eec15a', 4], ['#ecd9c6', 2], ['#e96b50', 1]], poppy: '#d84c62', eye: '#eec15a'
    },
    night: {
      sky: ['#01080d', '#03131c', '#08242f', '#103746'], glow: 'rgba(165,215,235,.16)', shaft: 0.025,
      cBase: '#1e3443', cMid: '#35505f', cLight: '#a2bcc8', cShade: 'rgba(3,10,18,.55)',
      wBase: '#0a1a24', wMid: '#13293a', wLight: '#25404f',
      back: '#0a1f19', hillTop: '#1d4128', hillBot: '#07160e', hillLeft: 'rgba(1,6,8,.8)', rim: 'rgba(150,200,210,.22)',
      tex: ['rgba(110,160,150,.1)', 'rgba(2,10,6,.35)'], bush: ['#08170f', '#10261a', '#1c3a26'],
      blades: ['#0c2215', '#12301d', '#1b4028', '#285234'], stem: '#163522',
      flowers: [['#8c6e88', 3], ['#b3a466', 3], ['#a7a9a2', 3]], poppy: '#7d3b4a', eye: '#b3a466',
      stars: true, moon: true, flies: true
    }
  };
  function phase() {
    var t = (P.get('t') || '').toLowerCase();
    if (PAL[t]) return t;
    var d = new Date(), h = d.getHours() + d.getMinutes() / 60;
    return h < 5 || h >= 20.5 ? 'night' : h < 8 ? 'dawn' : h < 17 ? 'day' : 'dusk';
  }

  /* ---------------- shared canvas painting ---------------- */
  function rgba(hex, a) { var n = parseInt(hex.slice(1), 16); return 'rgba(' + (n >> 16) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')'; }
  function bakeCloud(c, k, pal, wisp) {
    var ps = puffs(c), X0 = c.x0 - 70, X1 = c.x1 + 70, top = c.top, bot = c.base + 2;
    var cv = document.createElement('canvas');
    cv.width = Math.max(1, Math.ceil((X1 - X0) * k)); cv.height = Math.max(1, Math.ceil((bot - top) * k));
    var g = cv.getContext('2d');
    g.setTransform(k, 0, 0, k, -X0 * k, -top * k);
    g.beginPath(); g.rect(X0, top, X1 - X0, bot - top); g.clip();
    var base = wisp ? pal.wBase : pal.cBase, mid = wisp ? pal.wMid : pal.cMid, lit = wisp ? pal.wLight : pal.cLight;
    /* back to front: each billow lit on top, in shadow underneath, so a lower billow's lit top
       reads against the shadowed underside of the one behind it */
    ps.forEach(function (p) {
      var cx = p[0] + p[2] * 0.18, cy = p[1] - p[2] * 0.66;
      var gr = g.createRadialGradient(cx, cy, 0, cx, cy, p[2] * 1.6);
      gr.addColorStop(0, lit); gr.addColorStop(0.28, lit); gr.addColorStop(0.62, mid); gr.addColorStop(1, base);
      g.fillStyle = gr; g.beginPath(); g.arc(p[0], p[1], p[2], 0, 6.2832); g.fill();
    });
    g.globalCompositeOperation = 'source-atop';
    if (!wisp) {
      var sh = g.createLinearGradient(0, c.base - env(c, (c.x0 + c.x1) / 2) * 0.55, 0, c.base);
      sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(1, pal.cShade);
      g.fillStyle = sh; g.fillRect(X0, top, X1 - X0, bot - top);
      /* warm light from the top right */
      var wl = g.createLinearGradient(X1, top, X0, c.base);
      wl.addColorStop(0, 'rgba(255,248,220,.35)'); wl.addColorStop(0.6, 'rgba(255,248,220,0)');
      g.fillStyle = wl; g.fillRect(X0, top, X1 - X0, bot - top);
    }
    /* soften the puff edges a touch */
    var out = document.createElement('canvas'); out.width = cv.width; out.height = cv.height;
    var o = out.getContext('2d'); o.filter = 'blur(' + (0.7 * k).toFixed(2) + 'px)'; o.drawImage(cv, 0, 0);
    return { cv: out, x: X0, y: top, raw: cv };
  }

  function skyPaint(g, pal, m) {
    var L = -m.ox / m.s - 10, T = -m.oy / m.s - 10, R = (m.W - m.ox) / m.s + 10, B = (m.H - m.oy) / m.s + 10;
    var gr = g.createLinearGradient(260, 560, 1640, -40);
    gr.addColorStop(0, pal.sky[0]); gr.addColorStop(0.42, pal.sky[1]); gr.addColorStop(0.78, pal.sky[2]); gr.addColorStop(1, pal.sky[3]);
    g.fillStyle = gr; g.fillRect(L, T, R - L, B - T);
    var gl = g.createRadialGradient(1500, -60, 0, 1500, -60, 760);
    gl.addColorStop(0, pal.glow); gl.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gl; g.fillRect(L, T, R - L, B - T);
    /* the shaft of light falling from the top right */
    g.save(); g.globalAlpha = pal.shaft; g.filter = 'blur(' + Math.round(40 * m.s * DPR) + 'px)';
    var sf = g.createLinearGradient(1500, -40, 1000, 600);
    sf.addColorStop(0, '#fff'); sf.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = sf; g.beginPath(); g.moveTo(1420, -40); g.lineTo(1640, -40); g.lineTo(1260, 640); g.lineTo(1020, 640); g.closePath(); g.fill();
    g.restore();
  }
  function hillPath(g, m, dx) {
    var R = (m.W - m.ox) / m.s + 20; dx = dx || 0;
    g.beginPath(); g.moveTo(300, 640);
    for (var x = 300; x <= R; x += 6) g.lineTo(x, ridge(x - dx));
    g.lineTo(R, 640); g.closePath();
  }
  function hillPaint(g, pal, m) {
    var R = (m.W - m.ox) / m.s + 20, x, y, i, Rn = rng(41);
    /* the darker hill behind */
    g.beginPath(); g.moveTo(520, 620);
    for (x = 520; x <= 1100; x += 6) g.lineTo(x, back(x) + 4 * Math.sin(x / 31));
    g.lineTo(1100, 620); g.closePath(); g.fillStyle = pal.back; g.fill();
    /* the slope */
    hillPath(g, m);
    var gr = g.createLinearGradient(0, 330, 0, 600); gr.addColorStop(0, pal.hillTop); gr.addColorStop(1, pal.hillBot);
    g.fillStyle = gr; g.fill();
    var gl = g.createLinearGradient(380, 0, 1150, 0); gl.addColorStop(0, pal.hillLeft); gl.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gl; g.fill();
    /* painted texture: short strokes inside the slope */
    g.save(); hillPath(g, m); g.clip(); g.lineCap = 'round';
    for (i = 0; i < 1500; i++) {
      x = 380 + Rn() * (R - 380); y = ridge(x) + 4 + Math.pow(Rn(), 1.6) * (640 - ridge(x));
      g.strokeStyle = pal.tex[i % 2]; g.lineWidth = 1 + Rn() * 1.6;
      var l = 5 + Rn() * 11, a = -1.2 - Rn() * 0.7;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
    }
    g.restore();
    /* light on the crest */
    g.save(); g.filter = 'blur(' + (1.5 * m.s * DPR).toFixed(1) + 'px)';
    g.beginPath(); for (x = 380; x <= R; x += 6) { if (x === 380) g.moveTo(x, ridge(x) + 2); else g.lineTo(x, ridge(x) + 2); }
    g.strokeStyle = pal.rim; g.lineWidth = 3; g.stroke(); g.restore();
    /* the bushes at the top right */
    [[1452, 0.9], [1494, 1.2], [1536, 0.85]].forEach(function (b) {
      var bx = b[0], by = ridge(bx) + 4, sc = b[1], Rb = rng(bx);
      for (var j = 0; j < 3; j++) {
        g.fillStyle = pal.bush[j];
        for (var q = 0; q < 9 - j * 2; q++) {
          var r = (6 + Rb() * 7) * sc;
          g.beginPath(); g.arc(bx + (Rb() - 0.5) * 34 * sc - j * 3, by - 10 * sc - Rb() * 18 * sc - j * 3, r, 0, 6.2832); g.fill();
        }
      }
    });
  }

  /* ---------------- grass and flowers that move ---------------- */
  function makeField(seed, pal) {
    var R = rng(seed), blades = [], flowers = [], i, x, d;
    for (i = 0; i < 1250; i++) {
      x = 360 + 1260 * Math.sqrt(R()); d = R();
      var h = (8 + R() * 22) * (0.7 + d * 0.9) * (0.75 + 0.55 * (x - 360) / 1240);
      blades.push({ x: x, y: ridge(x) + d * d * 70 + 2, h: h, w: (1.1 + R() * 1.5) * (0.8 + d * 0.6), l0: (R() - 0.5) * 0.5, ph: R() * 6.28, c: Math.min(3, Math.floor(R() * 3 + d * 1.6)), a: 0, v: 0 });
    }
    var CL = [[700, 50], [840, 40], [930, 60], [1110, 70], [1260, 50], [1400, 70], [1520, 45]];
    var tot = pal.flowers.reduce(function (s, f) { return s + f[1]; }, 0);
    for (i = 0; i < 110; i++) {
      var cl = CL[Math.floor(R() * CL.length)]; x = cl[0] + (R() + R() + R() - 1.5) * cl[1]; d = R() * 0.7;
      var pick = R() * tot, col = pal.flowers[0][0];
      for (var j = 0, acc = 0; j < pal.flowers.length; j++) { acc += pal.flowers[j][1]; if (pick <= acc) { col = pal.flowers[j][0]; break; } }
      var near = 0.7 + d * 0.9 + (x - 400) / 1600;
      flowers.push({ x: x, y: ridge(x) + d * d * 60 + 3, h: (6 + R() * 12) * near, r: (1.3 + R() * 1.4) * near, col: col, l0: (R() - 0.5) * 0.4, ph: R() * 6.28, a: 0, v: 0 });
    }
    [[1112, 48], [1134, 40], [1528, 56], [1556, 46]].forEach(function (p) {
      flowers.push({ x: p[0], y: ridge(p[0]) + 2, h: p[1], r: 3.6, col: pal.poppy, poppy: true, l0: -0.06, ph: R() * 6.28, a: 0, v: 0 });
    });
    blades.sort(function (a, b) { return a.y - b.y; });
    flowers.sort(function (a, b) { return a.y - b.y; });
    return { blades: blades, flowers: flowers };
  }
  function sway(b, t, ptr, breeze) {
    var w = breeze * (0.1 * Math.sin(t * 0.8 + b.x * 0.011) + 0.05 * Math.sin(t * 1.9 + b.x * 0.037 + b.ph) + 0.06 * Math.max(0, Math.sin(t * 0.23 + b.x * 0.004)));
    var target = b.l0 + w * (0.6 + b.h / 40);
    if (ptr && ptr.on) {
      var dx = b.x - ptr.x, dy = (b.y - b.h * 0.5) - ptr.y, d2 = dx * dx + dy * dy;
      if (d2 < 32400) { var f = Math.exp(-d2 / 6050); target += (dx > 0 ? 1 : -1) * f * 0.85 + ptr.vx * f * 0.03; }
    }
    b.v += (target - b.a) * 0.08; b.v *= 0.86; b.a += b.v;
  }
  function drawBlade(g, b) {
    var sa = Math.sin(b.a), tx = b.x + sa * b.h, ty = b.y - Math.cos(b.a) * b.h, cx = b.x + sa * b.h * 0.25, cy = b.y - b.h * 0.55;
    g.moveTo(b.x - b.w / 2, b.y); g.quadraticCurveTo(cx - b.w * 0.25, cy, tx, ty); g.quadraticCurveTo(cx + b.w * 0.25, cy, b.x + b.w / 2, b.y); g.closePath();
  }
  function drawFlower(g, f, pal) {
    var sa = Math.sin(f.a), tx = f.x + sa * f.h, ty = f.y - Math.cos(f.a) * f.h;
    g.strokeStyle = pal.stem; g.lineWidth = f.poppy ? 1.4 : 0.9;
    g.beginPath(); g.moveTo(f.x, f.y); g.quadraticCurveTo(f.x + sa * f.h * 0.3, f.y - f.h * 0.55, tx, ty); g.stroke();
    g.fillStyle = f.col;
    if (f.poppy) {
      g.beginPath(); g.ellipse(tx, ty, f.r * 1.25, f.r, f.a, 0, 6.2832); g.fill();
      g.fillStyle = 'rgba(255,255,255,.25)'; g.beginPath(); g.arc(tx - f.r * 0.3, ty - f.r * 0.35, f.r * 0.45, 0, 6.2832); g.fill();
    } else if (f.r > 2.2) {
      for (var k = 0; k < 5; k++) { var an = k * 1.2566 + f.ph; g.beginPath(); g.arc(tx + Math.cos(an) * f.r * 0.62, ty + Math.sin(an) * f.r * 0.62, f.r * 0.55, 0, 6.2832); g.fill(); }
      g.fillStyle = pal.eye; g.beginPath(); g.arc(tx, ty, f.r * 0.32, 0, 6.2832); g.fill();
    } else { g.beginPath(); g.arc(tx, ty, f.r, 0, 6.2832); g.fill(); }
  }

  /* ---------------- the loop: only while the footer is on screen ---------------- */
  var visible = false, running = false, onFrame = null, onShow = null;
  function loop(now) { if (!visible || document.hidden || !onFrame) { running = false; return; } onFrame(now / 1000); requestAnimationFrame(loop); }
  function wake() { if (visible && !running && !RM && onFrame) { running = true; requestAnimationFrame(loop); } }
  new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible && onShow) onShow(); wake(); }, { threshold: 0.05 }).observe(foot);
  document.addEventListener('visibilitychange', wake);
  var ptr = { on: false, x: 0, y: 0, vx: 0, sp: 0, m: null };
  function track(withPtr) {
    if (!withPtr) return;
    foot.addEventListener('pointermove', function (e) {
      var r = foot.getBoundingClientRect(), m = ptr.m; if (!m) return;
      var x = (e.clientX - r.left - m.ox) / m.s, y = (e.clientY - r.top - m.oy) / m.s;
      if (ptr.on) { ptr.vx = ptr.vx * 0.5 + (x - ptr.x) * 0.5; ptr.sp = Math.hypot(x - ptr.x, y - ptr.y); }
      ptr.on = true; ptr.x = x; ptr.y = y;
    });
    foot.addEventListener('pointerleave', function () { ptr.on = false; });
  }
  var rsT; function onResize(fn) { var w0 = 0, h0 = 0; new ResizeObserver(function () { if (foot.clientWidth === w0 && foot.clientHeight === h0) return; w0 = foot.clientWidth; h0 = foot.clientHeight; clearTimeout(rsT); rsT = setTimeout(fn, 60); }).observe(foot); }

  /* ================= F1 / F2 / F3: the painted hill ================= */
  function painted(opts) {
    fx.classList.add('fx--grain');
    var cv = document.createElement('canvas'); fx.appendChild(cv);
    var ctx = cv.getContext('2d'), pal = PAL[opts.phase || 'day'];
    var field = makeField(23, pal), m, bg, fg, clouds = [], stars = [], flies = [], petals = [];
    field.blades.concat(field.flowers).forEach(function (b) { b.a = b.l0; });
    var R = rng(77), i;
    if (pal.stars) for (i = 0; i < 170; i++) { var sx = 300 + R() * 1340, sy = R() * 440; if (sy < ridge(sx) - 30) stars.push([sx, sy, 0.4 + R() * 1.1, R() * 6.28, 0.6 + R() * 2]); }
    if (pal.flies) for (i = 0; i < 34; i++) { var fxx = 640 + R() * 980; flies.push({ x: fxx, y0: ridge(fxx) - 10 - R() * 70, ph: R() * 6.28, sp: 0.3 + R() * 0.5 }); }
    function build() {
      m = fit(); ptr.m = m;
      cv.width = Math.round(m.W * DPR); cv.height = Math.round(m.H * DPR);
      var k = m.s * DPR;
      bg = document.createElement('canvas'); bg.width = cv.width; bg.height = cv.height;
      var g = bg.getContext('2d'); g.setTransform(k, 0, 0, k, m.ox * DPR, m.oy * DPR);
      skyPaint(g, pal, m);
      if (pal.moon) {
        var mg = g.createRadialGradient(1478, 92, 0, 1478, 92, 120); mg.addColorStop(0, 'rgba(220,235,240,.35)'); mg.addColorStop(1, 'rgba(220,235,240,0)');
        g.fillStyle = mg; g.fillRect(1300, -40, 360, 300);
        g.fillStyle = '#f4f0dc'; g.beginPath(); g.arc(1478, 92, 17, 0, 6.2832); g.fill();
        g.fillStyle = 'rgba(180,190,175,.35)'; g.beginPath(); g.arc(1472, 88, 4, 0, 6.2832); g.arc(1485, 99, 2.6, 0, 6.2832); g.fill();
      }
      WISPS.forEach(function (w) { var b = bakeCloud(w, k, pal, true); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(b.cv, (m.ox + b.x * m.s) * DPR, (m.oy + b.y * m.s) * DPR); g.setTransform(k, 0, 0, k, m.ox * DPR, m.oy * DPR); });
      clouds = CLOUDS.map(function (c, j) { var b = bakeCloud(c, k, pal); b.ph = j * 2.1; return b; });
      fg = document.createElement('canvas'); fg.width = cv.width; fg.height = cv.height;
      var h = fg.getContext('2d'); h.setTransform(k, 0, 0, k, m.ox * DPR, m.oy * DPR);
      hillPaint(h, pal, m);
      draw(performance.now() / 1000, true);
    }
    function draw(t, settle) {
      var k = m.s * DPR, i, b;
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.drawImage(bg, 0, 0);
      if (stars.length) {
        ctx.setTransform(k, 0, 0, k, m.ox * DPR, m.oy * DPR); ctx.fillStyle = '#eef6f2';
        stars.forEach(function (s) { ctx.globalAlpha = 0.35 + 0.65 * Math.abs(Math.sin(t * s[4] * 0.5 + s[3])); ctx.beginPath(); ctx.arc(s[0], s[1], s[2], 0, 6.2832); ctx.fill(); });
        ctx.globalAlpha = 1; ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
      clouds.forEach(function (c) { var dx = RM ? 0 : 16 * Math.sin(t * 0.021 + c.ph); ctx.drawImage(c.cv, (m.ox + (c.x + dx) * m.s) * DPR, (m.oy + c.y * m.s) * DPR); });
      ctx.drawImage(fg, 0, 0);
      ctx.setTransform(k, 0, 0, k, m.ox * DPR, m.oy * DPR);
      var p = opts.wind ? ptr : null, breeze = RM ? 0 : 1, n = settle ? 1 : 1;
      for (var it = 0; it < n; it++) { field.blades.forEach(function (bl) { sway(bl, t, p, breeze); }); field.flowers.forEach(function (fl) { sway(fl, t, p, breeze); }); }
      for (var c = 0; c < 4; c++) {
        ctx.fillStyle = pal.blades[c]; ctx.beginPath();
        for (i = 0; i < field.blades.length; i++) { b = field.blades[i]; if (b.c === c) drawBlade(ctx, b); }
        ctx.fill();
      }
      field.flowers.forEach(function (f) { drawFlower(ctx, f, pal); });
      /* F2: brushing fast through the flowers lets a few petals go */
      if (opts.wind && ptr.on && ptr.sp > 5 && petals.length < 70) {
        field.flowers.forEach(function (f) {
          if (Math.abs(f.x - ptr.x) < 26 && Math.abs(f.y - f.h - ptr.y) < 40 && Math.random() < 0.18)
            petals.push({ x: f.x + Math.sin(f.a) * f.h, y: f.y - f.h, vx: ptr.vx * 0.35 + (Math.random() - 0.5), vy: -0.6 - Math.random() * 0.8, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.2, life: 1, col: f.col });
        });
      }
      ptr.vx *= 0.9; ptr.sp *= 0.8;
      for (i = petals.length - 1; i >= 0; i--) {
        var q = petals[i]; q.vx += 0.012 + 0.02 * Math.sin(t * 2 + i); q.vy += 0.018; q.vx *= 0.985; q.vy *= 0.97;
        q.x += q.vx; q.y += q.vy; q.r += q.vr; q.life -= 0.006;
        if (q.life <= 0) { petals.splice(i, 1); continue; }
        ctx.globalAlpha = Math.min(1, q.life * 2); ctx.fillStyle = q.col; ctx.beginPath(); ctx.ellipse(q.x, q.y, 2.4, 1.2, q.r, 0, 6.2832); ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (flies.length) {
        flies.forEach(function (f) {
          var x = f.x + 26 * Math.sin(t * f.sp * 0.7 + f.ph) + 10 * Math.sin(t * 1.3 + f.ph * 3), y = f.y0 + 14 * Math.cos(t * f.sp + f.ph * 2);
          var a = Math.pow(Math.max(0, Math.sin(t * 1.1 * f.sp + f.ph)), 2); if (RM) a = 0.6; if (a < 0.02) return;
          var gr = ctx.createRadialGradient(x, y, 0, x, y, 9); gr.addColorStop(0, 'rgba(222,255,140,' + (0.55 * a) + ')'); gr.addColorStop(1, 'rgba(222,255,140,0)');
          ctx.fillStyle = gr; ctx.fillRect(x - 9, y - 9, 18, 18);
          ctx.fillStyle = 'rgba(245,255,200,' + a + ')'; ctx.beginPath(); ctx.arc(x, y, 1.3, 0, 6.2832); ctx.fill();
        });
      }
    }
    track(opts.wind);
    onFrame = function (t) { draw(t); };
    build(); onResize(build); wake();
  }

  /* the way into the playground (13 Nov, his pick S4 on the desk pg-footsign): the meadow's lamp post with an arrow sign,
     stood on the hill's ridge at the same scene spot at every width */
  var HERE = (document.currentScript && document.currentScript.src) || '';
  (function sign() {
    var a = document.createElement('a'); a.className = 'pg-sign'; a.setAttribute('aria-label', 'The playground');
    a.href = HERE ? HERE.replace(/assets\/js\/footer-hill\.js.*$/, 'playground.html') : 'playground.html';
    a.innerHTML = '<svg viewBox="0 0 74 150" aria-hidden="true">' +
      '<circle class="glow" cx="22" cy="20" r="26" fill="#ffe7a6"/>' +
      '<path d="M30 150V30q0-14-12-14" fill="none" stroke="#173a3a" stroke-width="5" stroke-linecap="round"/>' +
      '<path d="M10 16h18l-3-7H13z" fill="#173a3a"/><rect x="13" y="16" width="12" height="11" rx="2" fill="#fff1c4" stroke="#173a3a" stroke-width="2"/>' +
      '<g class="arrow"><path d="M33 66h52l8 8-8 8H33z" fill="#d49b62" stroke="#7a5233" stroke-width="2" stroke-linejoin="round"/><circle cx="37" cy="74" r="1.3" fill="#7a5233"/>' +
      '<text x="60" y="77.3" text-anchor="middle" font-family="Archivo, sans-serif" font-style="italic" font-size="8.2" font-weight="800" fill="#2c1a0c">playground</text></g></svg>';
    foot.appendChild(a);
    var SX = 1452, S = 1.4; /* scene x of the post; svg units to px */
    function place() {
      var m = fit(), W = m.W, x = m.ox + SX * m.s;
      if (x > W - 110) x = W - 110;
      var sx = (x - m.ox) / m.s, y = m.oy + (ridge(sx) + 16) * m.s;
      a.style.left = (x - 30 * S) + 'px'; a.style.top = (y - 150 * S) + 'px';
    }
    place(); onResize(place);
  })();
  /* for the desk previews of other signs (_build/pg-place.js): the hill's own curve */
  window.__footHill = { fit: fit, ridge: ridge, onResize: onResize, foot: foot };


  painted({ wind: true });
})();
