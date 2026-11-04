/* Console card. Prints a card in the devtools console on every page and adds hrishi.email() / hrishi.cv().
   Nothing shows on the page. Made in _delight/console.html (3 Nov 2026): neofetch, site teal, "hrishi" with the sedan.
   To change the words: edit them in the studio, "copy settings for Claude", and the config at the bottom gets replaced. */
/* Console card, the configurable one. Seven styles (neofetch, build sheet, boot log, man page, json,
   OBD scan, one line), four colour sets, and every word editable. The studio (_delight/console.html)
   edits a config and exports a ready drop-in script: this file's code plus .install(config).
   Used directly: <script src="console-card.js"></script><script>ConsoleCard.install({ ... })</script>
   Anything left out of the config falls back to DEFAULTS. */
window.ConsoleCard = (function factory() {
  var DEFAULTS = {
    style: 'neofetch', theme: 'site', art: 'namecar', car: 'hatch', customArt: '',
    title: 'hrishi@portfolio',
    rows: [['role', 'product designer'], ['based', 'bangalore, india'], ['studied', 'B.Des, IIT Guwahati, 2018–22'], ['work', 'Upstox, Trophee, Ani!'],
           ['os', 'arch linux, on everything'], ['garage', 'SY416, CBR250R, Laura'], ['games', 'elden ring, level 1 runs'], ['mail', 'hrishi.ux@gmail.com']],
    note: 'you opened the console. hi.\nthe site is built in code with AI; view source is fair game.',
    cmds: true, email: 'hrishi.ux@gmail.com', cv: 'assets/docs/Hrishikesh-Nanda-CV.pdf',
    cmdEmail: 'copies my address', cmdCv: 'opens the CV'
  };
  var STYLES = [['neofetch', 'neofetch'], ['spec', 'build sheet'], ['boot', 'boot log'], ['man', 'man page'], ['json', 'json'], ['obd', 'OBD scan'], ['line', 'one line']];
  var THEMES = {
    site:   { name: 'site teal', head: '#2a9aa8', key: '#2a9aa8', dim: '#8a9a9c', ok: '#4caf6e', art: '#5fb878', blocks: ['#0e2a2e', '#1d7d8c', '#5fb878', '#8fd0dc', '#f4efdc'] },
    garage: { name: 'garage', head: '#e8892b', key: '#d9662a', dim: '#9a8f86', ok: '#6aa84f', art: '#c9a227', blocks: ['#1b1b1b', '#c0392b', '#e8892b', '#f1c40f', '#ecf0f1'] },
    arch:   { name: 'arch blue', head: '#1793d1', key: '#1793d1', dim: '#8a95a0', ok: '#4ab866', art: '#1793d1', blocks: ['#0f1720', '#1793d1', '#4ab866', '#d6a440', '#dfe6ee'] },
    mono:   { name: 'mono', head: '', key: '', dim: '#8a8a8a', ok: '', art: '#8a8a8a', blocks: ['#111', '#555', '#888', '#bbb', '#eee'] }
  };
  /* the car drawn for art 'car' and under the name for 'namecar'; c.car picks which */
  var CARS = {
    hatch:  ['     ____________', '  __/  |    |    \\__', ' |  _  |    |   _   |', " '-(_)-------- (_)--'"],
    sedan:  ['       ________', '  ____/   |    \\______', ' |   _    |      _    `\\', " '--(_)----------(_)---'"],
    round:  ['     _.-------._', "   .'   |   |   '.", '  /_____|___|_____\\', "  '-(_)-------(_)-'"],
    low:    ['         _______', "  __..--'   |   '--..__", " '--(_)-----------(_)--'"],
    pickup: ['     _____', '  __/  |  \\_________', ' |  _  |       _    |', " '-(_)----------(_)-'"],
    front:  ['   ______________', '  / ____________ \\', ' |_/____________\\_|', ' |[o]  [====]  [o]|', " '-[]----------[]-'"],
    bike:   ['            ,__o', "     __.---'/_\\\\___", "   (O)'--------'(O)"],
    moving: []
  };
  CARS.moving = CARS.hatch.map(function (l, i) { return ['      ', '  ==  ', ' ===  ', '  ==  '][i] + l; });
  var CAR_NAMES = [['hatch', 'hatchback'], ['sedan', 'sedan'], ['round', 'round one'], ['low', 'low and fast'], ['pickup', 'pickup'], ['front', 'head on'], ['bike', 'bike'], ['moving', 'on the move']];
  var ARTS = {
    name: [' _        _    _    _ ', "| |_  _ _(_)__| |_ (_)", "| ' \\| '_| (_-< ' \\| |", '|_||_|_| |_/__/_||_|_|'],
    none: []
  };
  function carOf(c) { return CARS[c.car] || CARS.hatch; }

  function cfgOf(c) { var o = {}, k; c = c || {}; for (k in DEFAULTS) { o[k] = c[k] != null ? c[k] : DEFAULTS[k]; } return o; }
  function pad(s, n, ch) { s = String(s); while (s.length < n) { s += ch || ' '; } return s; }
  function rep(ch, n) { return n > 0 ? new Array(n + 1).join(ch) : ''; }
  function wid(list) { return list.reduce(function (m, s) { return Math.max(m, String(s).length); }, 0); }
  function artOf(c) { return c.art === 'custom' ? String(c.customArt || '').replace(/\s+$/, '').split('\n').filter(function (l, i, a) { return a.length > 1 || l; }) : c.art === 'car' ? carOf(c) : c.art === 'namecar' ? ARTS.name.concat([''], carOf(c)) : (ARTS[c.art] || []); }
  function rows(c) { return (c.rows || []).filter(function (r) { return r && (r[0] || r[1]); }); }
  function noteLines(c) { return c.note ? String(c.note).split('\n').map(function (l) { return [[l, 'dim']]; }) : []; }
  function cmdLines(c) {
    if (!c.cmds) { return []; }
    return [[['hrishi.email()', 'key'], ['  ' + c.cmdEmail, 'dim']], [['hrishi.cv()', 'key'], ['     ' + c.cmdCv, 'dim']]];
  }
  function tail(c) {
    var n = noteLines(c), m = cmdLines(c), out = [];
    if (n.length) { out.push([]); out = out.concat(n); }
    if (m.length) { out.push([]); out = out.concat(m); }
    return out;
  }
  function artHead(c) { var a = artOf(c); return a.length ? a.map(function (l) { return [[l, 'art']]; }).concat([[]]) : []; }

  var R = {
    neofetch: function (c) {
      var a = artOf(c), W = wid(a), rs = rows(c), kw = wid(rs.map(function (r) { return r[0]; }));
      var info = [[[c.title, 'head']], [[rep('-', c.title.length), 'dim']]].concat(rs.map(function (r) { return [[pad(r[0], kw + 2), 'key'], [r[1], 'val']]; }));
      var off = Math.max(0, Math.floor((info.length - a.length) / 2) + 1), n = Math.max(a.length + off, info.length), out = [];
      for (var i = 0; i < n; i++) {
        var line = W ? [[pad(a[i - off] || '', W) + '   ', 'art']] : [];
        out.push(line.concat(info[i] || []));
      }
      out.push([]);
      out.push((W ? [[pad('', W + 3), '']] : []).concat(THEMES.site.blocks.map(function (b, i) { return ['   ', 'b' + i]; })));
      return out.concat(tail(c));
    },
    spec: function (c) {
      var rs = rows(c), kw = wid(rs.map(function (r) { return r[0]; })), vw = wid(rs.map(function (r) { return r[1]; }));
      var head = 'BUILD SHEET · ' + c.title; vw = Math.max(vw, head.length - kw - 3);
      var inner = kw + vw + 5, out = artHead(c);
      out.push([['┌' + rep('─', inner) + '┐', 'dim']]);
      out.push([['│ ', 'dim'], [pad(head, inner - 2), 'head'], [' │', 'dim']]);
      out.push([['├' + rep('─', kw + 2) + '┬' + rep('─', vw + 2) + '┤', 'dim']]);
      rs.forEach(function (r) { out.push([['│ ', 'dim'], [pad(r[0], kw), 'key'], [' │ ', 'dim'], [pad(r[1], vw), 'val'], [' │', 'dim']]); });
      out.push([['└' + rep('─', kw + 2) + '┴' + rep('─', vw + 2) + '┘', 'dim']]);
      return out.concat(tail(c));
    },
    boot: function (c) {
      var rs = rows(c), kw = wid(rs.map(function (r) { return r[0]; })), out = artHead(c);
      out.push([[':: ', 'ok'], ['booting ' + c.title, 'head']]);
      rs.forEach(function (r) { out.push([['[  ', 'dim'], ['OK', 'ok'], ['  ] ', 'dim'], ['Started ', 'dim'], [pad(r[0] + ' ', kw + 4, '.') + ' ', 'key'], [r[1], 'val']]); });
      out.push([['[  ', 'dim'], ['OK', 'ok'], ['  ] ', 'dim'], ['Reached target ', 'dim'], ['hello', 'head'], ['.', 'dim']]);
      return out.concat(tail(c));
    },
    man: function (c) {
      var rs = rows(c), kw = wid(rs.map(function (r) { return r[0]; })), nm = c.title.split('@')[0] || c.title, up = nm.toUpperCase() + '(1)';
      var mid = 'portfolio manual', W = 62, gap = Math.max(2, Math.floor((W - up.length * 2 - mid.length) / 2)), I = '       ', out = artHead(c);
      out.push([[up + rep(' ', gap) + mid + rep(' ', gap) + up, 'dim']], []);
      out.push([['NAME', 'head']], [[I + nm, 'key'], [rs[0] ? ' — ' + rs[0][1] : '', 'val']], []);
      if (c.cmds) { out.push([['SYNOPSIS', 'head']], [[I + 'hrishi.email()', 'key'], ['   ' + c.cmdEmail, 'dim']], [[I + 'hrishi.cv()', 'key'], ['      ' + c.cmdCv, 'dim']], []); }
      out.push([['DESCRIPTION', 'head']]);
      rs.forEach(function (r) { out.push([[I + pad(r[0], kw + 3), 'key'], [r[1], 'val']]); });
      if (c.note) { out.push([], [['NOTES', 'head']]); String(c.note).split('\n').forEach(function (l) { out.push([[I + l, 'val']]); }); }
      var d = new Date(), mon = d.toLocaleString('en-GB', { month: 'long' }).toLowerCase() + ' ' + d.getFullYear();
      out.push([], [[pad('portfolio', W - mon.length - up.length) + mon + ' ' + up, 'dim']]);
      return out;
    },
    json: function (c) {
      var out = artHead(c);
      if (c.note) { String(c.note).split('\n').forEach(function (l) { out.push([['// ' + l, 'dim']]); }); }
      out.push([['const ', 'key'], ['hrishi', 'head'], [' = {', 'val']]);
      rows(c).forEach(function (r) {
        var k = String(r[0]).replace(/[^\w$]+/g, '_') || 'x';
        out.push([['  ' + k, 'key'], [': ', 'val'], [JSON.stringify(String(r[1])), 'ok'], [',', 'val']]);
      });
      if (c.cmds) {
        out.push([['  email', 'key'], [': () => ', 'val'], ['copy(' + JSON.stringify(c.email) + ')', 'ok'], [',', 'val'], ['  // ' + c.cmdEmail, 'dim']]);
        out.push([['  cv', 'key'], [': () => ', 'val'], ['open(' + JSON.stringify(c.cv) + ')', 'ok'], [',', 'val'], ['  // ' + c.cmdCv, 'dim']]);
      }
      out.push([['};', 'val']]);
      return out;
    },
    obd: function (c) {
      var rs = rows(c), kw = wid(rs.map(function (r) { return r[0]; })), out = artHead(c);
      out.push([['OBD-II scan · ', 'dim'], [c.title, 'head']]);
      out.push([['connecting… ', 'dim'], ['ok', 'ok'], ['  ·  ' + rs.length + ' PIDs read', 'dim']], []);
      rs.forEach(function (r, i) { out.push([['PID ' + pad((i + 1).toString(16).toUpperCase(), 2).replace(/^(\w) $/, '0$1') + '  ', 'dim'], [pad(r[0] + ' ', kw + 4, '.') + ' ', 'key'], [r[1], 'val']]); });
      out.push([], [['DTC  ', 'dim'], ['none stored', 'ok'], ['  ·  MIL off', 'dim']]);
      return out.concat(tail(c));
    },
    line: function (c) {
      var out = artHead(c);
      out.push([['hi, this is ', 'dim'], [c.title, 'head'], [c.cmds ? '  ·  hrishi.email() or hrishi.cv()' : '', 'key']]);
      return out.concat(noteLines(c));
    }
  };

  function lines(c) { c = cfgOf(c); return (R[c.style] || R.neofetch)(c); }
  /* CSS for one segment kind; 'inherit' leaves the console's own text colour */
  function css(kind, th, base) {
    var t = THEMES[th] || THEMES.site, s = base || '';
    if (/^b\d$/.test(kind)) { return s + 'background:' + t.blocks[+kind[1]]; }
    var col = t[kind] || '';
    return s + (col ? 'color:' + col + ';' : '') + (kind === 'head' ? 'font-weight:700;' : kind === 'key' ? 'font-weight:600;' : '');
  }
  var FONT = 'font-family:"JetBrains Mono",ui-monospace,Menlo,Consolas,monospace;font-size:12px;line-height:1.5;';
  function print(c) {
    c = cfgOf(c);
    var fmt = '', args = [];
    lines(c).forEach(function (ln, i) {
      if (i) { fmt += '\n'; }
      ln.forEach(function (sg) { fmt += '%c' + String(sg[0]).replace(/%/g, '％'); args.push(css(sg[1], c.theme, FONT)); });
      if (!ln.length) { fmt += '%c '; args.push(FONT); }
    });
    console.log.apply(console, [fmt].concat(args));
  }
  function text(c) { return lines(c).map(function (ln) { return ln.map(function (s) { return s[0]; }).join(''); }).join('\n'); }
  function install(c) {
    c = cfgOf(c);
    window.hrishi = {
      email: function () { try { navigator.clipboard.writeText(c.email).catch(function () {}); } catch (e) {} return c.email + ' (copied)'; },
      cv: function () { window.open(c.cv, '_blank', 'noopener'); return 'opening ' + c.cv; },
      toString: function () { return 'try hrishi.email() or hrishi.cv()'; }
    };
    print(c);
  }
  return { DEFAULTS: DEFAULTS, STYLES: STYLES, THEMES: THEMES, ARTS: ARTS, CARS: CARS, CAR_NAMES: CAR_NAMES, lines: lines, css: css, print: print, text: text, install: install, cfg: cfgOf,
    source: '(' + factory.toString() + ')()' };
})();
(function (me) {
  var cfg = {  "style": "neofetch",  "theme": "site",  "art": "namecar",  "car": "sedan",  "customArt": "                              _.-=\"_-         _\n                         _.-=\"   _-          | ||\"\"\"\"\"\"\"---._______     __..\n             ___.===\"\"\"\"-.______-,,,,,,,,,,,,`-''----\" \"\"\"\"\"       \"\"\"\"\"  __'\n      __.--\"\"     __        ,'                   o \           __        [__|\n __-\"\"=======.--\"\"  \"\"--.=================================.--\"\"  \"\"--.=======:\n]       [w] : /        \ : |========================|    : /        \ :  [w] :\nV___________:|          |: |========================|    :|          |:   _-\"\n V__________: \        / :_|=======================/_____: \        / :__-\"\n -----------'  \"-____-\"  `-------------------------------'  \"-____-\"\n",  "title": "hrishi@portfolio",  "rows": [    [      "role",      "product designer"    ],    [      "based",      "bangalore, india"    ],    [      "studied",      "IIT Guwahati, 2018–22"    ],    [      "work",      "Upstox, Trophee, Ani!"    ],    [      "os",      "arch linux, on everything"    ],    [      "garage",      "SY416, CBR250R, Laura"    ],    [      "games",      "val, elden ring, level 1 runs"    ],    [      "mail",      "hrishi.ux@gmail.com"    ]  ],  "note": "you opened the console. hi.\nthe site is built in code; view source is fair game.",  "cmds": true,  "email": "hrishi.ux@gmail.com",  "cv": "assets/docs/Hrishikesh-Nanda-CV.pdf?v=22",  "cmdEmail": "copies my address",  "cmdCv": "opens the CV"};
  /* the CV path is from the site root; this file sits in assets/js/, so resolve it from here for pages in work/ too */
  try { cfg.cv = new URL(cfg.cv, new URL('../../', me.src)).href; } catch (e) {}
  ConsoleCard.install(cfg);
})(document.currentScript);
