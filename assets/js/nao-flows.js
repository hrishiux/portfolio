/* NAO case study — the three information flows (email, segment, live photo),
   redrawn as SVG from the exported diagrams so they can be traced and explored.
   Each <figure class="lflow" data-flow="…"> holds the original image as a
   fallback; this script swaps it for the live version.

   Node: id, x, y, w, h, kind (start|step|check|service|ok|fail|retry),
         lines [title, ...sub], pin (numbered point), fs (failure state, counted),
         d (detail text), rules (list shown in the detail panel).
   Edge: [from, to, {label, la, fp, tp, mx, pts, loop, fail}]
   Key:  numbered points under the flow; sol = item in the block's solution list. */
(function () {
  'use strict';

  var FLOWS = {
    email: {
      title: 'email step · information flow', w: 1185, h: 610, nw: 136,
      lanes: [
        { x: 162, y: 28, w: 866, h: 226, label: 'google sign-in' },
        { x: 162, y: 270, w: 866, h: 328, label: 'manual entry' }
      ],
      nodes: [
        { id: 'start', x: 16, y: 243, w: 130, kind: 'start', lines: ['Email step', 'template 1'], d: 'Where the step starts. Two ways in: one tap with Google, or typing the address.' },
        { id: 'g_sign', x: 180, y: 112, kind: 'step', lines: ['Google sign-in'], pin: 1, d: 'One tap, nothing typed. On iOS, Apple sign-in sits next to it.' },
        { id: 'g_fetch', x: 356, y: 60, kind: 'step', lines: ['Able to fetch'], d: 'The email comes back from the Google account.' },
        { id: 'g_fail', x: 356, y: 170, kind: 'fail', lines: ['Failed / error'], d: 'Google couldn’t return an email.' },
        { id: 'g_success', x: 532, y: 60, kind: 'step', lines: ['Success'], d: 'Email received from Google.' },
        { id: 'g_sys', x: 532, y: 170, kind: 'fail', fs: 1, lines: ['System error', 'try again'], d: 'Shown as: “System error / Try again”.' },
        { id: 'g_dup', x: 708, y: 60, kind: 'check', lines: ['Duplicate check', 'vs verified emails'], pin: 2, d: 'Checks whether the email already exists in the list of verified emails.' },
        { id: 'm_input', x: 180, y: 400, kind: 'step', lines: ['Manual input', 'email address'], d: 'The fallback: the user types the address.' },
        { id: 'm_valid', x: 356, y: 400, kind: 'check', lines: ['Validations', '6 rules · tap'], pin: 4, d: 'Checked before anything is sent:',
          rules: ['Email ID shall be a maximum of 60 characters and a minimum of 5', 'Should begin with alphanumeric characters only', 'Should have at least one “.”', '“@” should appear only once', 'Should not be only numbers', 'Characters not allowed: ~ ` # $ % ^ & * ( ) = + { } [ ] \\ | : ; ” ’ < > , ? /'] },
        { id: 'm_err', x: 532, y: 520, kind: 'fail', fs: 1, lines: ['Show errors', 'wrong email format'], d: 'Shown as: “Please input Email in correct email format”.' },
        { id: 'm_dup', x: 532, y: 320, kind: 'check', lines: ['Duplicate check', 'vs verified emails'], pin: 2, d: 'Same check as the Google path: is this email already verified on another account?' },
        { id: 'm_exists', x: 708, y: 450, kind: 'fail', fs: 1, lines: ['Already verified', 'try another email'], d: 'Shown as: “The above Email is already verified. Please try with other email id”.' },
        { id: 'm_otp', x: 708, y: 320, kind: 'step', lines: ['Trigger OTP'], d: 'An OTP goes to the typed address.' },
        { id: 'm_otp_ok', x: 884, y: 280, kind: 'step', lines: ['OTP success'], d: 'The right code came back.' },
        { id: 'm_otp_fail', x: 884, y: 390, kind: 'fail', fs: 1, lines: ['OTP failure'], d: 'Wrong or expired code.' },
        { id: 'done', x: 1050, y: 170, w: 124, kind: 'ok', lines: ['Email verified', 'successfully'], pin: 3, d: 'Both paths end here. SSO emails arrive already verified: no OTP, and they skip the scrutiny queue.' }
      ],
      edges: [
        ['start', 'g_sign'], ['start', 'm_input'],
        ['g_sign', 'g_fetch'], ['g_sign', 'g_fail', { fail: 1 }],
        ['g_fetch', 'g_success'], ['g_success', 'g_dup'], ['g_dup', 'done', { mx: 1035 }],
        ['g_fail', 'g_sys', { fail: 1 }],
        ['m_input', 'm_valid', { label: 'check' }],
        ['m_valid', 'm_dup', { label: 'passed', mx: 512 }], ['m_valid', 'm_err', { label: 'failed', mx: 512, fail: 1 }],
        ['m_dup', 'm_otp'], ['m_dup', 'm_exists', { label: 'duplicate exists', mx: 688, fail: 1 }],
        ['m_otp', 'm_otp_ok', { mx: 864 }], ['m_otp', 'm_otp_fail', { mx: 864, fail: 1 }],
        ['m_otp_ok', 'done', { mx: 1035 }]
      ],
      paths: [
        { label: 'google sign-in', nodes: ['start', 'g_sign', 'g_fetch', 'g_success', 'g_dup', 'done'] },
        { label: 'manual entry', nodes: ['start', 'm_input', 'm_valid', 'm_dup', 'm_otp', 'm_otp_ok', 'done'] },
        { label: 'google fails', fail: 1, nodes: ['start', 'g_sign', 'g_fail', 'g_sys'] },
        { label: 'bad format', fail: 1, nodes: ['start', 'm_input', 'm_valid', 'm_err'] },
        { label: 'duplicate found', fail: 1, nodes: ['start', 'm_input', 'm_valid', 'm_dup', 'm_exists'] },
        { label: 'otp fails', fail: 1, nodes: ['start', 'm_input', 'm_valid', 'm_dup', 'm_otp', 'm_otp_fail'] }
      ],
      chips: [['out', 'start', 'entry paths'], ['rules', 'm_valid', 'validation rules'], ['n', 2, 'duplicate checks'], ['fs', null, 'failure states'], ['paths', null, 'paths to trace']],
      key: [
        { n: 1, sol: 1, t: 'Google sign-in: one tap, nothing typed', s: '→ solution 1' },
        { n: 2, sol: 2, t: 'Duplicate check on both paths, against verified emails', s: '→ solution 2' },
        { n: 3, sol: 3, t: 'SSO emails arrive verified: no OTP, no scrutiny queue', s: '→ solution 3' },
        { n: 4, t: 'Six format rules checked before an OTP is ever sent; tap the box to read them' }
      ]
    },

    segment: {
      title: 'segment selection · routing map', w: 1000, h: 380,
      nodes: [
        { id: 'seg', x: 20, y: 183, w: 140, kind: 'start', lines: ['Segment', 'selection'], pin: 1, d: 'The segments the user picks decide which route they take.' },
        { id: 't_bank', x: 240, y: 90, kind: 'step', lines: ['Bank validation'], pin: 2, d: 'Bank is verified first, on both routes.' },
        { id: 't_aa', x: 430, y: 90, w: 170, kind: 'service', lines: ['Account aggregator'], pin: 3, d: 'One consent through the aggregator returns income proof, PAN and date of birth.' },
        { id: 't_income', x: 640, y: 20, w: 170, kind: 'step', lines: ['Gives income proof'], d: 'The aggregator returns income proof.' },
        { id: 't_pan', x: 640, y: 90, w: 170, kind: 'step', lines: ['Provides PAN & DOB'], d: 'The aggregator also returns PAN and date of birth.' },
        { id: 't_panstep', x: 850, y: 90, w: 130, kind: 'ok', lines: ['PAN step'], d: 'Next: the PAN step.' },
        { id: 'b_bank', x: 240, y: 300, kind: 'step', lines: ['Bank validation'], pin: 2, d: 'Bank is verified first, on both routes.' },
        { id: 'b_eq', x: 430, y: 300, w: 170, kind: 'service', lines: ['PAN via Equifax'], pin: 4, d: 'PAN fetched in the background through Equifax.' },
        { id: 'b_panstep', x: 640, y: 300, w: 170, kind: 'ok', lines: ['PAN step'], d: 'Next: the PAN step.' }
      ],
      edges: [
        ['seg', 't_bank', { label: 'stocks & MF', mx: 200 }], ['seg', 'b_bank', { label: 'stocks, MF & F&O', mx: 200 }],
        ['t_bank', 't_aa'], ['t_aa', 't_income', { mx: 620 }], ['t_aa', 't_pan'], ['t_pan', 't_panstep'],
        ['b_bank', 'b_eq'], ['b_eq', 'b_panstep']
      ],
      paths: [
        { label: 'stocks & MF', nodes: ['seg', 't_bank', 't_aa', 't_pan', 't_panstep'], extra: [['t_aa', 't_income']] },
        { label: 'stocks, MF & F&O', nodes: ['seg', 'b_bank', 'b_eq', 'b_panstep'] }
      ],
      chips: [['out', 'seg', 'routes'], ['kind', 'service', 'data sources'], ['n', 1, 'shared bank check'], ['paths', null, 'paths to trace']],
      key: [
        { n: 1, t: 'The segments picked decide which route the user takes' },
        { n: 2, t: 'Bank is validated first on both routes' },
        { n: 3, t: 'Account aggregator: one consent returns income proof, PAN and DOB' },
        { n: 4, t: 'PAN fetched in the background through Equifax' }
      ]
    },

    liveness: {
      title: 'live photo · information flow', w: 1250, h: 540, nw: 140,
      nodes: [
        { id: 'l_land', x: 10, y: 110, w: 180, kind: 'start', lines: ['Live photo step', 'primed with all the rules'], d: 'The user lands on the step with the rules shown first.' },
        { id: 'l_perm', x: 250, y: 110, kind: 'check', lines: ['Permissions card', 'camera · storage'], pin: 1, d: 'Asks for camera and storage access up front.' },
        { id: 'l_denied', x: 250, y: 270, kind: 'fail', fs: 1, lines: ['Permission', 'not granted'], d: 'Refused, so the card asks again.' },
        { id: 'l_photo', x: 450, y: 110, w: 130, kind: 'step', lines: ['Take photo'], pin: 2, d: 'Taken inside the flow (HyperVerge SDK), then split by KRA status.' },
        { id: 'l_kra_live', x: 665, y: 20, w: 165, kind: 'check', lines: ['Liveness score', 'KRA user'], pin: 3, d: 'Real-time liveness check: currently an AI confidence score of > 75.' },
        { id: 'l_kra_ok', x: 890, y: 20, kind: 'ok', lines: ['Verification', 'success'], d: 'KRA users are through.' },
        { id: 'l_nk_live', x: 665, y: 200, w: 165, kind: 'check', lines: ['Liveness score', 'non-KRA · modified KRA'], pin: 3, d: 'Same real-time liveness check.' },
        { id: 'l_face', x: 890, y: 200, kind: 'check', lines: ['Face match', 'vs Aadhaar'], pin: 4, d: 'For non-KRA users, the live capture is matched against official records; failed or low-confidence matches go to the scrutiny desk.' },
        { id: 'l_nk_ok', x: 1100, y: 200, w: 130, kind: 'ok', lines: ['Verification', 'success'], d: 'Face match above X, confidence above Y.' },
        { id: 'l_live_low', x: 665, y: 340, w: 165, kind: 'fail', fs: 1, lines: ['Liveness', 'score < X'], d: 'Liveness too low.' },
        { id: 'l_face_low', x: 890, y: 340, kind: 'fail', fs: 1, lines: ['Face match', 'score < X'], d: 'Face match too low.' },
        { id: 'l_reject', x: 665, y: 470, w: 165, kind: 'retry', lines: ['Reject', 'show them the reason'], pin: 5, d: 'The rejection says why, then sends the user back to retake.' }
      ],
      edges: [
        ['l_land', 'l_perm', { label: 'continue' }],
        ['l_perm', 'l_photo', { label: 'granted' }],
        ['l_perm', 'l_denied', { label: 'not granted', fail: 1, pts: [[280, 164], [280, 270]], la: 'end' }],
        ['l_denied', 'l_perm', { loop: 1, label: 'ask again', pts: [[360, 270], [360, 164]] }],
        ['l_photo', 'l_kra_live', { label: 'KRA', mx: 600 }],
        ['l_photo', 'l_nk_live', { label: 'non-KRA', mx: 600 }],
        ['l_kra_live', 'l_kra_ok', { label: '> X' }],
        ['l_nk_live', 'l_face', { label: '> X' }],
        ['l_face', 'l_nk_ok', { label: 'match > X' }],
        ['l_nk_live', 'l_live_low', { fp: 'b', tp: 't', fail: 1 }],
        ['l_face', 'l_face_low', { fp: 'b', tp: 't', fail: 1 }],
        ['l_live_low', 'l_reject', { fp: 'b', tp: 't', fail: 1 }],
        ['l_face_low', 'l_reject', { fp: 'b', tp: 'r', fail: 1 }],
        ['l_reject', 'l_photo', { loop: 1, label: 'take photo again', pts: [[665, 497], [515, 497], [515, 164]] }]
      ],
      paths: [
        { label: 'KRA user', nodes: ['l_land', 'l_perm', 'l_photo', 'l_kra_live', 'l_kra_ok'] },
        { label: 'non-KRA user', nodes: ['l_land', 'l_perm', 'l_photo', 'l_nk_live', 'l_face', 'l_nk_ok'] },
        { label: 'permission refused', fail: 1, nodes: ['l_land', 'l_perm', 'l_denied', 'l_perm'] },
        { label: 'liveness too low', fail: 1, nodes: ['l_land', 'l_perm', 'l_photo', 'l_nk_live', 'l_live_low', 'l_reject', 'l_photo'] },
        { label: 'face match too low', fail: 1, nodes: ['l_land', 'l_perm', 'l_photo', 'l_nk_live', 'l_face', 'l_face_low', 'l_reject', 'l_photo'] }
      ],
      chips: [['out', 'l_photo', 'KRA routes'], ['n', 2, 'score gates'], ['loops', null, 'loops back'], ['fs', null, 'failure states']],
      key: [
        { n: 1, sol: 2, t: 'Camera and storage asked for up front; a refusal loops back', s: '→ solution 2' },
        { n: 2, sol: 1, t: 'Photo taken in the flow, then split by KRA status', s: '→ solution 1' },
        { n: 3, sol: 3, t: 'Liveness scored in real time on both routes', s: '→ solution 3' },
        { n: 4, sol: 4, t: 'Non-KRA users are face-matched against Aadhaar', s: '→ solution 4' },
        { n: 5, t: 'A rejection shows the reason and sends the user back to retake' }
      ]
    }
  };

  var figs = document.querySelectorAll('.lflow[data-flow]');
  if (!figs.length || !document.createElement('dialog').showModal) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var KIND = { start: 'start', step: 'step', check: 'check', service: 'external service', ok: 'outcome', fail: 'failure', retry: 'retry' };
  var LEGEND = [['start', 'start'], ['step', 'step'], ['check', 'check'], ['service', 'external service'], ['ok', 'outcome'], ['fail', 'failure'], ['loop', 'loops back']];

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function nodeMap(f) { var m = {}; f.nodes.forEach(function (n) { n.w = n.w || f.nw || 150; n.h = n.h || 54; m[n.id] = n; }); return m; }

  /* ---- geometry ---- */
  function port(n, side) {
    if (side === 'r') return [n.x + n.w, n.y + n.h / 2];
    if (side === 'l') return [n.x, n.y + n.h / 2];
    if (side === 'b') return [n.x + n.w / 2, n.y + n.h];
    return [n.x + n.w / 2, n.y];
  }
  function route(o, A, B) {
    if (o.pts) return o.pts;
    var fp = o.fp || 'r', tp = o.tp || 'l', S = port(A, fp), E = port(B, tp);
    if (fp === 'r' && tp === 'l') {
      if (Math.abs(S[1] - E[1]) < 1) return [S, E];
      var mx = o.mx != null ? o.mx : (S[0] + E[0]) / 2;
      return [S, [mx, S[1]], [mx, E[1]], E];
    }
    if (fp === 'b' && tp === 't') {
      if (Math.abs(S[0] - E[0]) < 1) return [S, E];
      var my = (S[1] + E[1]) / 2;
      return [S, [S[0], my], [E[0], my], E];
    }
    if (fp === 'b') return [S, [S[0], E[1]], E];
    return [S, E];
  }
  function rounded(p, r) {
    var d = 'M' + p[0][0] + ',' + p[0][1];
    for (var i = 1; i < p.length - 1; i++) {
      var a = p[i - 1], c = p[i], n = p[i + 1];
      var l1 = Math.hypot(c[0] - a[0], c[1] - a[1]), l2 = Math.hypot(n[0] - c[0], n[1] - c[1]);
      var rr = Math.min(r, l1 / 2, l2 / 2);
      d += ' L' + (c[0] + (a[0] - c[0]) / l1 * rr) + ',' + (c[1] + (a[1] - c[1]) / l1 * rr) +
           ' Q' + c[0] + ',' + c[1] + ' ' + (c[0] + (n[0] - c[0]) / l2 * rr) + ',' + (c[1] + (n[1] - c[1]) / l2 * rr);
    }
    var L = p[p.length - 1];
    return d + ' L' + L[0] + ',' + L[1];
  }
  function arrow(p) {
    var a = p[p.length - 2], b = p[p.length - 1], ang = Math.atan2(b[1] - a[1], b[0] - a[0]), s = 7;
    return 'M' + b[0] + ',' + b[1] +
      ' L' + (b[0] - s * Math.cos(ang - 0.45)) + ',' + (b[1] - s * Math.sin(ang - 0.45)) +
      ' L' + (b[0] - s * Math.cos(ang + 0.45)) + ',' + (b[1] - s * Math.sin(ang + 0.45)) + 'Z';
  }
  /* labels sit beside the first vertical run of an edge; a straight edge gets its label above the line */
  function labelAt(o, p) {
    for (var i = 0; i < p.length - 1; i++) {
      var a = p[i], b = p[i + 1];
      if (Math.abs(a[0] - b[0]) < 1 && Math.abs(a[1] - b[1]) > 1) {
        var end = o.la === 'end';
        return [a[0] + (end ? -7 : 7), (a[1] + b[1]) / 2, end ? 'end' : 'start'];
      }
    }
    return [(p[0][0] + p[p.length - 1][0]) / 2, p[0][1] - 9, 'middle'];
  }

  /* ---- build the SVG ---- */
  function render(f) {
    var M = nodeMap(f), h = [];
    h.push('<svg class="lf-svg" viewBox="0 0 ' + f.w + ' ' + f.h + '" width="' + f.w + '" height="' + f.h + '" style="max-width:' + f.w + 'px" role="group" aria-label="' + esc(f.title) + '">');
    (f.lanes || []).forEach(function (l) {
      h.push('<g class="lf-lane"><rect x="' + l.x + '" y="' + l.y + '" width="' + l.w + '" height="' + l.h + '" rx="14"/><text x="' + (l.x + 14) + '" y="' + (l.y + 20) + '">' + esc(l.label) + '</text></g>');
    });
    h.push('<g>');
    f.edges.forEach(function (e, i) {
      var o = e[2] || {}, p = route(o, M[e[0]], M[e[1]]);
      h.push('<g class="lf-edge' + (o.loop ? ' is-loop' : '') + (o.fail ? ' is-fail' : '') + '" data-i="' + i + '"><path class="lf-line" d="' + rounded(p, 10) + '"/><path class="lf-arrow" d="' + arrow(p) + '"/></g>');
    });
    h.push('</g><g>');
    f.edges.forEach(function (e, i) {
      var o = e[2] || {}; if (!o.label) return;
      var L = labelAt(o, route(o, M[e[0]], M[e[1]]));
      h.push('<text class="lf-elabel" data-i="' + i + '" x="' + L[0] + '" y="' + L[1] + '" text-anchor="' + L[2] + '">' + esc(o.label) + '</text>');
    });
    h.push('</g><g>');
    f.nodes.forEach(function (n) {
      var cx = n.x + n.w / 2, cy = n.y + n.h / 2, lines = n.lines, y0 = cy - (16 + 13 * (lines.length - 1)) / 2 + 12;
      var t = '<text class="t1" x="' + cx + '" y="' + y0 + '">' + esc(lines[0]) + '</text>';
      for (var k = 1; k < lines.length; k++) t += '<text class="t2" x="' + cx + '" y="' + (y0 + 3 + 13 * k) + '">' + esc(lines[k]) + '</text>';
      h.push('<g class="lf-node k-' + n.kind + '" data-id="' + n.id + '" tabindex="0" role="button" aria-label="' + esc(lines.join(', ')) + '"><rect class="box" x="' + n.x + '" y="' + n.y + '" width="' + n.w + '" height="' + n.h + '"/>' + t + '</g>');
    });
    h.push('</g><g aria-hidden="true">');
    f.nodes.forEach(function (n) {
      if (!n.pin) return;
      var px = n.x + n.w - 4, py = n.y + 2;
      h.push('<g class="lf-pin" data-n="' + n.pin + '" data-id="' + n.id + '"><circle cx="' + px + '" cy="' + py + '" r="10"/><text x="' + px + '" y="' + (py + 0.5) + '">' + n.pin + '</text></g>');
    });
    h.push('</g><circle class="lf-dot" r="5" cx="-20" cy="-20"/></svg>');
    var wrap = document.createElement('div');
    wrap.innerHTML = h.join('');
    return wrap.firstChild;
  }

  /* ---- counts, worked out from the drawn flow ---- */
  function count(f, spec) {
    var M = nodeMap(f), type = spec[0], arg = spec[1];
    if (type === 'out') return f.edges.filter(function (e) { return e[0] === arg && !(e[2] || {}).loop; }).length;
    if (type === 'rules') return (M[arg].rules || []).length;
    if (type === 'kind') return f.nodes.filter(function (n) { return n.kind === arg; }).length;
    if (type === 'fs') return f.nodes.filter(function (n) { return n.fs; }).length;
    if (type === 'loops') return f.edges.filter(function (e) { return (e[2] || {}).loop; }).length;
    if (type === 'paths') return f.paths.length;
    return arg;
  }

  /* ---- interactions on one mounted SVG ---- */
  function mount(f, svg, ui) {
    var M = nodeMap(f), raf = 0, current = null;
    var edgeEls = svg.querySelectorAll('.lf-edge'), labelEls = svg.querySelectorAll('.lf-elabel'), dot = svg.querySelector('.lf-dot');

    function edgeIndex(a, b) { for (var i = 0; i < f.edges.length; i++) if (f.edges[i][0] === a && f.edges[i][1] === b) return i; return -1; }
    function lineage(id) {
      var nodes = {}, edges = {}; nodes[id] = 1;
      function walk(dir) {
        var q = [id], seen = {}; seen[id] = 1;
        while (q.length) {
          var cur = q.shift();
          f.edges.forEach(function (e, i) {
            if ((e[2] || {}).loop) return;
            var from = dir ? e[0] : e[1], to = dir ? e[1] : e[0];
            if (from === cur) { edges[i] = 1; nodes[to] = 1; if (!seen[to]) { seen[to] = 1; q.push(to); } }
          });
        }
      }
      walk(true); walk(false);
      return { nodes: nodes, edges: edges };
    }
    function focus(sel) {
      svg.classList.toggle('has-focus', !!sel);
      svg.querySelectorAll('.lf-node, .lf-pin').forEach(function (el) { el.classList.toggle('is-on', !!sel && !!sel.nodes[el.getAttribute('data-id')]); });
      [edgeEls, labelEls].forEach(function (list) {
        list.forEach(function (el) { el.classList.toggle('is-on', !!sel && !!sel.edges[el.getAttribute('data-i')]); });
      });
    }
    function stopDot() { cancelAnimationFrame(raf); raf = 0; svg.classList.remove('is-tracing'); }
    function trace(p) {
      stopDot();
      var sel = { nodes: {}, edges: {} }, seq = [];
      p.nodes.forEach(function (id, k) {
        sel.nodes[id] = 1;
        if (k) { var i = edgeIndex(p.nodes[k - 1], id); if (i > -1) { sel.edges[i] = 1; seq.push(edgeEls[i].querySelector('.lf-line')); } }
      });
      (p.extra || []).forEach(function (e) { var i = edgeIndex(e[0], e[1]); sel.nodes[e[1]] = 1; if (i > -1) sel.edges[i] = 1; });
      current = sel; focus(sel);
      if (reduced || !seq.length) return;
      svg.classList.add('is-tracing');
      var lens = seq.map(function (s) { return s.getTotalLength(); }), total = lens.reduce(function (a, b) { return a + b; }, 0);
      var speed = 0.26, pause = 700, t0 = performance.now();
      (function step(now) {
        var d = (now - t0) * speed;
        if (d > total + pause * speed) { t0 = now; d = 0; }
        var acc = 0, pt = null;
        for (var i = 0; i < seq.length; i++) {
          if (d <= acc + lens[i]) { pt = seq[i].getPointAtLength(Math.max(0, d - acc)); break; }
          acc += lens[i];
        }
        if (!pt) pt = seq[seq.length - 1].getPointAtLength(lens[lens.length - 1]);
        dot.setAttribute('cx', pt.x); dot.setAttribute('cy', pt.y);
        raf = requestAnimationFrame(step);
      })(t0);
    }
    function show(n) {
      svg.querySelectorAll('.lf-node').forEach(function (el) { el.classList.toggle('is-sel', el.getAttribute('data-id') === n.id); });
      var s = '<h4>' + esc(n.lines[0]) + ' <small>' + KIND[n.kind] + '</small></h4><p>' + esc(n.d || '') + '</p>';
      if (n.rules) s += '<ol>' + n.rules.map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('') + '</ol>';
      ui.detail.innerHTML = s;
    }

    svg.querySelectorAll('.lf-node').forEach(function (el) {
      var n = M[el.getAttribute('data-id')];
      el.addEventListener('mouseenter', function () { focus(lineage(n.id)); });
      el.addEventListener('mouseleave', function () { focus(current); });
      el.addEventListener('focus', function () { focus(lineage(n.id)); show(n); });
      el.addEventListener('blur', function () { focus(current); });
      el.addEventListener('click', function (e) { e.stopPropagation(); show(n); if (ui.onNode) ui.onNode(n); });
      el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(n); if (ui.onNode) ui.onNode(n); } });
    });

    /* trace-a-path buttons */
    ui.paths.innerHTML = '<span>trace a path</span>';
    f.paths.forEach(function (p) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'lf-path' + (p.fail ? ' is-fail' : ''); b.textContent = p.label;
      b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', function () {
        var on = b.classList.contains('is-on');
        ui.paths.querySelectorAll('.lf-path').forEach(function (x) { x.classList.remove('is-on'); x.setAttribute('aria-pressed', 'false'); });
        if (on) { current = null; stopDot(); focus(null); return; }
        b.classList.add('is-on'); b.setAttribute('aria-pressed', 'true'); trace(p);
      });
      ui.paths.appendChild(b);
    });

    /* key ↔ pins ↔ the block's solution list */
    ui.key.querySelectorAll('li').forEach(function (li) {
      var n = li.getAttribute('data-n'), sol = +li.getAttribute('data-sol');
      var pins = svg.querySelectorAll('.lf-pin[data-n="' + n + '"]');
      var solLi = ui.sol && sol ? ui.sol.children[sol - 1] : null;
      li.addEventListener('mouseenter', function () {
        li.classList.add('is-hot'); if (solLi) solLi.classList.add('lf-hot');
        var sel = { nodes: {}, edges: {} };
        pins.forEach(function (p) { p.classList.add('is-hot'); sel.nodes[p.getAttribute('data-id')] = 1; });
        focus(sel);
      });
      li.addEventListener('mouseleave', function () {
        li.classList.remove('is-hot'); if (solLi) solLi.classList.remove('lf-hot');
        pins.forEach(function (p) { p.classList.remove('is-hot'); });
        focus(current);
      });
      li.addEventListener('click', function () { if (ui.onKey && pins[0]) ui.onKey(M[pins[0].getAttribute('data-id')]); });
    });
    svg.querySelectorAll('.lf-pin').forEach(function (p) {
      var li = ui.key.querySelector('li[data-n="' + p.getAttribute('data-n') + '"]');
      if (!li) return;
      p.addEventListener('mouseenter', function () { li.dispatchEvent(new Event('mouseenter')); });
      p.addEventListener('mouseleave', function () { li.dispatchEvent(new Event('mouseleave')); });
    });
    return { stop: stopDot };
  }

  function keyHTML(f) {
    return '<ol class="lf-key">' + f.key.map(function (k) {
      return '<li data-n="' + k.n + '"' + (k.sol ? ' data-sol="' + k.sol + '"' : '') + '><i>' + k.n + '</i><span>' + esc(k.t) + (k.s ? '<small>' + esc(k.s) + '</small>' : '') + '</span></li>';
    }).join('') + '</ol>';
  }
  var HINT = '<p class="lf-detail__hint">tap any box to see what it does</p>';

  /* the "redesign solution" list for this block: the nearest <ol> above the figure, within the same block */
  function solutionList(fig) {
    for (var el = fig.previousElementSibling; el && !/^H[1-3]$/.test(el.tagName); el = el.previousElementSibling) {
      if (el.tagName === 'OL') return el;
    }
    return null;
  }

  /* ---- swap each fallback image for the live flow ---- */
  figs.forEach(function (fig) {
    var f = FLOWS[fig.getAttribute('data-flow')];
    if (!f) return;
    var card = document.createElement('div');
    card.className = 'lf-card';
    card.innerHTML =
      '<div class="lf-head"><span class="lf-title">' + esc(f.title) + '</span><ul class="lf-chips">' +
        f.chips.map(function (c) { return '<li' + (c[0] === 'fs' ? ' class="is-fail"' : '') + '><b>' + count(f, c) + '</b> ' + esc(c[2]) + '</li>'; }).join('') +
      '</ul><button class="lf-open" type="button">open full screen <span aria-hidden="true">⤢</span></button></div>' +
      '<div class="lf-paths"></div>' +
      '<p class="lf-swipe">swipe sideways to see the whole flow, or open it full screen</p>' +
      '<div class="lf-stage"><div class="lf-canvas"></div></div>' +
      '<div class="lf-legend" aria-hidden="true">' + LEGEND.map(function (l) { return '<span><i class="lg-' + l[0] + '"></i>' + l[1] + '</span>'; }).join('') + '</div>' +
      '<div class="lf-detail" aria-live="polite">' + HINT + '</div>' + keyHTML(f);
    var svg = render(f), canvas = card.querySelector('.lf-canvas');
    canvas.style.setProperty('--mw', f.w + 'px');
    canvas.appendChild(svg);
    var fallback = fig.querySelector('.lflow__fallback');
    if (fallback) fallback.remove();
    fig.classList.remove('wide--zoom'); /* its "scroll to see all" caption hint belongs to the image */
    fig.insertBefore(card, fig.querySelector('figcaption'));
    mount(f, svg, { paths: card.querySelector('.lf-paths'), detail: card.querySelector('.lf-detail'), key: card.querySelector('.lf-key'), sol: solutionList(fig) });
    card.querySelector('.lf-open').addEventListener('click', function () { openViewer(f); });
  });

  /* ---- full-screen viewer: drag to pan, wheel / pinch / buttons to zoom ---- */
  var dlg = document.createElement('dialog');
  dlg.className = 'lf-fv';
  dlg.setAttribute('aria-label', 'Flow, full screen');
  dlg.innerHTML =
    '<div class="lf-fv__bar"><span class="lf-fv__title"></span>' +
    '<button class="lf-fv__btn" data-act="out" type="button" aria-label="Zoom out">−</button>' +
    '<span class="lf-fv__zoom">100%</span>' +
    '<button class="lf-fv__btn" data-act="in" type="button" aria-label="Zoom in">+</button>' +
    '<button class="lf-fv__btn" data-act="fit" type="button">fit</button>' +
    '<button class="lf-fv__btn" data-act="close" type="button" aria-label="Close">✕</button></div>' +
    '<div class="lf-fv__body"><div class="lf-fv__stage"><span class="lf-fv__hint">drag to pan · scroll or pinch to zoom</span></div><aside class="lf-fv__side"></aside></div>';
  document.body.appendChild(dlg);

  var stage = dlg.querySelector('.lf-fv__stage'), side = dlg.querySelector('.lf-fv__side'), zoomLabel = dlg.querySelector('.lf-fv__zoom');
  var canvas = null, W = 0, H = 0, s = 1, tx = 0, ty = 0, fitS = 1, MAX = 3, live = null, fitW = 0;

  function apply(animate) {
    canvas.style.transition = animate && !reduced ? 'transform .45s cubic-bezier(.2,.7,.3,1)' : 'none';
    canvas.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + s + ')';
    zoomLabel.textContent = Math.round(s / fitS * 100) + '%';
  }
  function clamp() {
    var sw = stage.clientWidth, sh = stage.clientHeight, cw = W * s, ch = H * s, m = 80;
    tx = cw <= sw ? (sw - cw) / 2 : Math.min(m, Math.max(sw - cw - m, tx));
    ty = ch <= sh ? (sh - ch) / 2 : Math.min(m, Math.max(sh - ch - m, ty));
  }
  function fit(animate) {
    var sw = stage.clientWidth, sh = stage.clientHeight;
    fitW = sw;
    fitS = Math.min(sw / W, sh / H) * 0.94; s = fitS; tx = (sw - W * s) / 2; ty = (sh - H * s) / 2; apply(animate);
  }
  function zoomAt(k, cx, cy, animate) {
    var ns = Math.min(MAX, Math.max(fitS * 0.8, s * k)), r = ns / s;
    tx = cx - (cx - tx) * r; ty = cy - (cy - ty) * r; s = ns; clamp(); apply(animate);
  }
  function flyTo(n) {
    s = Math.min(MAX, Math.max(fitS * 2.2, 0.9));
    tx = stage.clientWidth / 2 - (n.x + n.w / 2) * s; ty = stage.clientHeight / 2 - (n.y + n.h / 2) * s;
    clamp(); apply(true);
  }
  function openViewer(f) {
    if (live) { live.stop(); live = null; }
    if (canvas) canvas.remove();
    dlg.querySelector('.lf-fv__title').textContent = f.title;
    canvas = document.createElement('div');
    canvas.className = 'lf-fv__canvas';
    W = f.w; H = f.h;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    var svg = render(f);
    canvas.appendChild(svg);
    stage.appendChild(canvas);
    side.innerHTML = '<div class="lf-paths"></div><div class="lf-detail" aria-live="polite">' + HINT + '</div>' + keyHTML(f);
    document.documentElement.style.overflow = 'hidden';
    dlg.showModal();
    fit(false);
    live = mount(f, svg, { paths: side.querySelector('.lf-paths'), detail: side.querySelector('.lf-detail'), key: side.querySelector('.lf-key'), onNode: flyTo, onKey: flyTo });
  }
  /* released straight away on close (button or Esc) rather than waiting on the async close event */
  function release() { document.documentElement.style.overflow = ''; if (live) { live.stop(); live = null; } }
  function closeViewer() { release(); if (dlg.open) dlg.close(); }
  dlg.addEventListener('cancel', release);
  dlg.addEventListener('close', release);
  dlg.querySelector('.lf-fv__bar').addEventListener('click', function (e) {
    var b = e.target.closest('[data-act]'); if (!b) return;
    var a = b.getAttribute('data-act'), cx = stage.clientWidth / 2, cy = stage.clientHeight / 2;
    if (a === 'close') closeViewer();
    else if (a === 'fit') fit(true);
    else if (a === 'in') zoomAt(1.4, cx, cy, true);
    else if (a === 'out') zoomAt(1 / 1.4, cx, cy, true);
  });
  dlg.addEventListener('keydown', function (e) {
    var cx = stage.clientWidth / 2, cy = stage.clientHeight / 2;
    if (e.key === '+' || e.key === '=') zoomAt(1.4, cx, cy, true);
    else if (e.key === '-') zoomAt(1 / 1.4, cx, cy, true);
    else if (e.key === '0') fit(true);
  });
  stage.addEventListener('wheel', function (e) {
    if (!canvas) return;
    e.preventDefault();
    var r = stage.getBoundingClientRect();
    zoomAt(Math.exp(-e.deltaY * 0.0018), e.clientX - r.left, e.clientY - r.top, false);
  }, { passive: false });

  var pts = new Map(), last = null, pinch = null;
  stage.addEventListener('pointerdown', function (e) {
    if (e.target.closest('.lf-node, .lf-pin')) return;
    stage.setPointerCapture(e.pointerId);
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    stage.classList.add('is-drag');
    if (pts.size === 1) last = { x: e.clientX, y: e.clientY };
    if (pts.size === 2) { var a = Array.from(pts.values()); pinch = { d: Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y) }; }
  });
  stage.addEventListener('pointermove', function (e) {
    if (!pts.has(e.pointerId) || !canvas) return;
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    var r = stage.getBoundingClientRect();
    if (pts.size === 2 && pinch) {
      var a = Array.from(pts.values()), d = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y);
      zoomAt(d / pinch.d, (a[0].x + a[1].x) / 2 - r.left, (a[0].y + a[1].y) / 2 - r.top, false);
      pinch.d = d;
    } else if (last) {
      tx += e.clientX - last.x; ty += e.clientY - last.y; last = { x: e.clientX, y: e.clientY };
      clamp(); apply(false);
    }
  });
  function up(e) {
    pts.delete(e.pointerId);
    if (pts.size < 2) pinch = null;
    if (pts.size === 1) { var v = Array.from(pts.values())[0]; last = { x: v.x, y: v.y }; }
    if (!pts.size) { last = null; stage.classList.remove('is-drag'); }
  }
  stage.addEventListener('pointerup', up);
  stage.addEventListener('pointercancel', up);
  /* re-fit on a real width change only; a phone's address bar showing or hiding shouldn't undo the reader's zoom */
  window.addEventListener('resize', function () { if (dlg.open && stage.clientWidth !== fitW) fit(false); });
})();
