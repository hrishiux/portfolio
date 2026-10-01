/* Trophee case study — the Manga Reader rebuilt as a working phone prototype
   from the Figma screens (Tophee.xyz/Trophee Slice 1.png). Interface in
   HTML/CSS; artwork (covers, mascots, NFT art, tip items, reader pages) cut
   from the frames into assets/img/trophee/. Copy is the copy on the frames.

   Each <figure class="tr-proto"> gets its own copy. data-fx turns on design
   revisions by id (comma list, or "all"); with none it is the 2021 design.
   fig.__tr exposes { jump(key), setFx(map), reset() } for the test page. */
(function () {
  'use strict';

  var figs = document.querySelectorAll('.tr-proto');
  if (!figs.length) return;

  var SRC = (document.currentScript && document.currentScript.src) || '';
  var IMG = SRC ? SRC.replace(/js\/trophee-app\.js.*$/, 'img/trophee/') : '../assets/img/trophee/';
  function img(n, cls, alt) { return '<img class="' + (cls || '') + '" src="' + IMG + n + '.webp" alt="' + (alt || '') + '" draggable="false">'; }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  /* ---------------------------------------------------------------- data */
  var T = {
    prince: { t: 'Prince of Lan Ling', by: 'Yoshiki Tanaka', art: 'Takeru Kirishima', g: 'Action, Shounen', cov: 'cov-prince', hero: 'hero', rating: '9.7', reads: '17.3 M', ch: 'Ch. 328' },
    fate: { t: 'Fate/zero', cov: 'cov-fate', ch: 'Ch. 328', reads: '8.1 M' },
    naruto: { t: 'Naruto', cov: 'cov-naruto', ch: 'Ch. 328', reads: '8.1 M' },
    chainsaw: { t: 'Chainsaw Man', by: 'Tatsuki Fujimoto', cov: 'cov-chainsaw', thumb: 'th-chainsaw', reads: '17.3 M', ch: 'Ch. 328' },
    marin: { t: 'Ergo Proxy', cov: 'cov-marin', reads: '8.1 M', ch: 'Ch. 328' },
    bunny: { t: 'Fade-Away Bunny', cov: 'cov-bunny', reads: '32.7 M', ch: 'Ch. 328' },
    ergo: { t: 'Ergo Proxy', cov: 'cov-ergo', reads: '8.1 M', ch: 'Ch. 328' }
  };
  var LIST = ['chainsaw', 'marin', 'bunny', 'fate', 'naruto', 'prince', 'ergo'];
  var GENRES = ['Action', 'Comedy', 'Fantasy', 'Horror', 'Romance', 'Adventure', 'Drama', 'Shounen'];
  var TIPS = [
    { id: 'gpen', n: 'G-Pen', p2: 100 }, { id: 'burger', n: 'Burger', pop: true, p2: 500 }, { id: 'icecream', n: 'Ice-Cream', p2: 300 },
    { id: 'beer', n: 'Beer', p2: 800 }, { id: 'bento', n: 'Bento', p2: 1000 }
  ];
  var PACKS1 = [{ c: 300, b: 100, p: '$29.99' }, { c: 300, b: 100, p: '$29.99' }, { c: 300, b: 100, p: '$29.99' }];
  var PACKS2 = [{ c: 300, b: 0, p: '$2.99' }, { c: 1000, b: 100, p: '$9.99' }, { c: 3000, b: 500, p: '$29.99', best: true }];
  var NFTS = [
    { a: 'Yuzuki Momoi', t: 'ZAN and Panther', r: 'Epic', e: 10, img: 'nft-zan' },
    { a: 'Kyouda', t: 'Leaving the warmth', r: 'Rare', e: 50, img: 'nft-warmth' },
    { a: 'Shiori Kawana', t: 'Breakfast Pills', r: 'common', e: 14, img: null }
  ];
  var LIPSUM = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Euismod ut risus ac amet sem. Et ut faucibus scelerisque a. Ipsum feugiat a scelerisque nullam lacus, ut. Elit quis ut auctor felis bibendum consequat, gravida risus. Purus eget dictumst massa pretium fames. Pharetra amet turpis egestas duis ut ornare. Sed bibendum consectetur leo nisl. Adipiscing aenean feugiat pretium a odio volutpat vel cursus. Amet pretium nisi donec sed. Orci sapien blandit nibh pharetra, scelerisque tincidunt vel sed amet. Amet tristique sit commodo maecenas ante vestibulum ipsum ultrices lectus.';
  var LIPSUM2 = 'Curabitur phasellus velit pulvinar pulvinar. Amet ut molestie massa porta mauris hendrerit. Sed commodo maecenas nullam volutpat, sit pretium. Adipiscing malesuada massa ultrices amet, suspendisse egestas. Sagittis nibh sodales nunc, in massa nibh. Semper ut auctor sit mi tincidunt convallis at quam. Sed congue platea magna feugiat lorem integer tortor.';
  var DESC = 'A fierce warrior who charges into battle against foes who outnumber his forces, a forthright leader as dangerous as the demon on his mask - that is the Prince of Lan Ling. Under the command of his uncle, the Emperor, he must strive to win battles and bring honor to the Kingdom of Qi.';
  var PAGES = 15, CH_TOTAL = 123, CH_SHOWN = 12, CH_PRICE = 150;
  var FX_VISUAL = ['vgrid', 'vtype', 'vcolor', 'vradius', 'vshadow', 'vicons', 'vbuttons', 'vheaders', 'vinputs', 'vcards', 'vchips', 'vcoins', 'vsheet', 'vreader', 'vcase', 'numbers', 'contrast', 'targets'];
  var FX_UX = ['auth', 'otp', 'social', 'terms', 'genres', 'nftintro', 'follow', 'search', 'library', 'collect', 'profile', 'readcta', 'goal', 'tipsafe', 'tiers', 'rbar', 'coach', 'locked', 'endcta', 'packs'];
  var FX_ALL = FX_VISUAL.concat(FX_UX);

  /* --------------------------------------------------------------- icons */
  var S = function (p) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + p + '</svg>'; };
  var I = {
    back: S('<path d="M15 5l-7 7 7 7"/>'),
    right: S('<path d="M9 5l7 7-7 7"/>'),
    down: S('<path d="M5 9l7 7 7-7"/>'),
    search: S('<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4"/>'),
    x: S('<path d="M6 6l12 12M18 6L6 18"/>'),
    mail: S('<rect x="3.5" y="5.5" width="17" height="13" rx="3"/><path d="M4 7l8 6 8-6"/>'),
    lock: S('<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>'),
    lockFill: S('<path class="f" d="M7 10V8a5 5 0 0 1 10 0v2h.5A1.5 1.5 0 0 1 19 11.5v8a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19.5v-8A1.5 1.5 0 0 1 6.5 10zm2 0h6V8a3 3 0 0 0-6 0z"/>'),
    home: S('<path d="M4 11l8-6.5 8 6.5V20H4z"/><path d="M10 20v-5h4v5"/>'),
    book: S('<rect x="5" y="3.5" width="14" height="17" rx="1.5"/><path d="M9 3.5v7l2-1.4 2 1.4v-7M5 17h14"/>'),
    medal: S('<circle cx="12" cy="10" r="5.5"/><circle cx="12" cy="10" r="2.2"/><path d="M8.5 14.5L7 20l5-2 5 2-1.5-5.5"/>'),
    user: S('<circle cx="12" cy="8" r="3.8"/><path d="M5 20c.8-3.6 3.7-5.5 7-5.5s6.2 1.9 7 5.5"/>'),
    bookmark: S('<path d="M7 4h10v16l-5-3.5L7 20z"/>'),
    bmCheck: S('<path d="M7 4h10v16l-5-3.5L7 20z"/><path d="M9.5 10l2 2 3.5-3.5"/>'),
    bmPlus: S('<path d="M7 4h10v16l-5-3.5L7 20z"/><path d="M12 7.5v5M9.5 10h5"/>'),
    dl: S('<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>'),
    share: S('<circle cx="17.5" cy="6" r="2.3"/><circle cx="6.5" cy="12" r="2.3"/><circle cx="17.5" cy="18" r="2.3"/><path d="M8.6 11l6.8-4M8.6 13l6.8 4"/>'),
    star: S('<path class="f" d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.8z"/>'),
    people: S('<circle cx="9" cy="8.5" r="3"/><path d="M3.5 18.5c.7-3 2.8-4.5 5.5-4.5s4.8 1.5 5.5 4.5"/><path d="M16 8.5h5M18.5 6v5"/>'),
    eye: S('<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>'),
    pen: S('<rect x="4" y="4" width="13" height="16" rx="1.5"/><path d="M7.5 9h6M7.5 12.5h4"/><path d="M14 18l6-6"/>'),
    brush: S('<rect x="3.5" y="5" width="14" height="14" rx="2"/><path d="M9 14l3-1 6-6-2-2-6 6z"/>'),
    play: S('<path class="f" d="M8 5.5v13l11-6.5z"/>'),
    clock: S('<circle class="f" cx="12" cy="12" r="9"/><path d="M12 7.5V12l3 2" class="w"/>'),
    thumb: S('<path class="f" d="M4 10h3v10H4zM9 20h7.6a2 2 0 0 0 2-1.6l1.3-6A2 2 0 0 0 18 10h-4.2l.6-3.4A1.8 1.8 0 0 0 12.6 4.5L9 10z"/>'),
    chat: S('<path class="f" d="M4 5h16v11H9l-5 4z"/>'),
    sun: S('<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4"/>'),
    moon: S('<path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5z"/>'),
    sliders: S('<path d="M4 8h16M4 16h16"/><rect x="8" y="5.5" width="5" height="5" rx="1.2"/><rect x="11" y="13.5" width="5" height="5" rx="1.2"/>'),
    list: S('<path d="M4 6h5v4H4zM4 14h5v4H4zM12 7h8M12 9.5h5M12 15h8M12 17.5h5"/>'),
    tag: S('<path d="M5 4h7l7 7-7 7-7-7z"/><circle cx="9" cy="8" r="1.4"/>'),
    skipPrev: S('<path class="f" d="M7 6h2v12H7zM19 6v12l-9-6z"/>'),
    skipNext: S('<path class="f" d="M15 6h2v12h-2zM5 6v12l9-6z"/>'),
    logout: S('<path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"/><path d="M10 8l-4 4 4 4M6 12h9"/>'),
    edit: S('<path d="M5 19l1-4L16 5l3 3L9 18z"/>'),
    arrowL: S('<path d="M19 12H5M11 6l-6 6 6 6"/>'),
    arrowR: S('<path d="M5 12h14M13 6l6 6-6 6"/>'),
    check: S('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
    plus: S('<path d="M12 5v14M5 12h14"/>'),
    globe: S('<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.6 2.5 14.4 0 17M12 3.5c-2.5 2.6-2.5 14.4 0 17"/>'),
    receipt: S('<path d="M6 3.5h12v17l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 11.5h6"/>'),
    help: S('<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.5a2.5 2.5 0 1 1 3.4 2.3c-.7.3-1 .8-1 1.5v.4M12 16.8v.2"/>'),
    doc: S('<path d="M6 3.5h8l4 4v13H6z"/><path d="M14 3.5v4h4M9 12h6M9 15.5h6"/>'),
    phone: S('<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 17.5h2"/>'),
    dirs: [S('<rect x="5" y="5" width="14" height="14" rx="2"/><path d="M9 12h6M12.5 9.5L15 12l-2.5 2.5"/>'), S('<rect x="5" y="5" width="14" height="14" rx="2"/><path d="M15 12H9M11.5 9.5L9 12l2.5 2.5"/>'),
      S('<rect x="5" y="5" width="14" height="14" rx="2"/><path d="M12 9v6M9.5 12.5L12 15l2.5-2.5"/>'), S('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M9 9v6M7 13l2 2 2-2M15 9v6M13 13l2 2 2-2"/>')],
    google: '<svg viewBox="0 0 24 24" aria-hidden="true" class="tr-brand"><path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3z"/><path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z"/><path fill="#FBBC05" d="M6.4 14a6 6 0 0 1 0-3.9V7.5H3.1a10 10 0 0 0 0 9z"/><path fill="#EA4335" d="M12 6c1.5 0 2.8.5 3.8 1.5l2.8-2.8A10 10 0 0 0 3.1 7.5l3.3 2.6C7.2 7.8 9.4 6 12 6z"/></svg>',
    facebook: '<svg viewBox="0 0 24 24" aria-hidden="true" class="tr-brand"><circle cx="12" cy="12" r="10" fill="#1877F2"/><path fill="#fff" d="M13.2 21.9v-7h2.3l.4-2.8h-2.7v-1.8c0-.8.3-1.4 1.4-1.4H16V6.4c-.3 0-1.1-.1-2-.1-2 0-3.4 1.2-3.4 3.5v2.3H8.3v2.8h2.3v7z"/></svg>',
    apple: '<svg viewBox="0 0 24 24" aria-hidden="true" class="tr-brand"><path fill="#111" d="M16.4 12.6c0-2.4 2-3.6 2.1-3.6-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9s-1.9-.9-3.2-.8A4.7 4.7 0 0 0 4.2 9.6c-1.7 3-.4 7.3 1.2 9.7.8 1.2 1.8 2.5 3 2.4 1.2 0 1.7-.8 3.1-.8s1.9.8 3.2.8 2.1-1.2 2.9-2.4a9.6 9.6 0 0 0 1.3-2.7 4.2 4.2 0 0 1-2.5-4zM14 5.5A4.2 4.2 0 0 0 15 2.5a4.4 4.4 0 0 0-2.9 1.5 4 4 0 0 0-1 2.9 3.6 3.6 0 0 0 2.9-1.4z"/></svg>'
  };
  function coin(cls) { return img('coin', 'tr-coin ' + (cls || ''), ''); }
  function btn(act, html, cls, label, extra) {
    return '<button type="button" class="' + (cls || '') + '" data-act="' + act + '"' + (label ? ' aria-label="' + esc(label) + '"' : '') + (extra || '') + '>' + html + '</button>';
  }
  function rotate(arr, k) { k = k % arr.length; return arr.slice(k).concat(arr.slice(0, k)); }
  function stamp() {
    var d = new Date(), p = function (n) { return (n < 10 ? '0' : '') + n; };
    return p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear() + '  .  ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }

  /* ===================================================== one copy of the app */
  function create(fig, opts) {
    var fx = {}, st, timer = 0, splashT = 0, toastT = 0, freeT = 0, freeEnd = Date.now() + (23 * 3600 + 41 * 60 + 9) * 1000;
    var app, phone, stage, scale = 0, scrolls = {}, flowsEl = null, lastTap = 0, touch = null;
    var reel = { on: false, token: 0, paused: false, visible: true };
    function setFx(map) { fx = {}; for (var k in map) if (map[k]) fx[k] = true; }
    setFx(opts.fx || {});
    var n = function (x) { return fx.numbers ? Number(x).toLocaleString('en-US') : String(x); };
    var tipPrice = function (t) { return fx.tiers ? t.p2 : 1000; };
    var CASE = { 'Your Updates': 'Your updates', 'Today’s Picks': 'Today’s picks', 'Top Series': 'Top series', 'Today’s Pick': 'Today’s picks', 'CANCEL': 'Cancel', 'Preferred Genres': 'Preferred genres',
      'Default Language': 'Default language', 'Reader Settings': 'Reader settings', 'Purchase History': 'Purchase history', 'Terms of Service  &  Privacy Policy': 'Terms &amp; privacy', 'Coin Spent': 'Coin spent', 'Coin Purchase': 'Coin purchase',
      'Total Collection size': 'Total collection size', 'Chapter Locked': 'Chapter locked', 'Sign Up': 'Sign up', 'Sign In': 'Sign in', 'Preferred Genre': 'Preferred genre', 'My Profile': 'My profile',
      'Chapter’s Name': 'Chapter’s name', 'Chapter Name': 'Chapter name', 'All Chapters': 'All chapters', 'Next<br>Chapter': 'Next<br>chapter', 'Get More': 'Get more', 'Trophee Experience': 'Trophee experience' };
    var cs = function (s) { return fx.vcase && CASE[s] ? CASE[s] : s; };

    function fresh(view) {
      st = {
        view: view || 'splash', stack: [], coins: 3000, tipped: 8000, goal: 12000,
        email: '', otp: '', codeSent: false, left: 0, signin: false,
        genres: { Action: true }, genreFrom: 'onboard',
        list: { kind: 'picks', tab: 0 }, search: { q: '', scope: '' },
        follow: { chainsaw: 1, prince: 1, fate: 1, marin: 0, bunny: 0, naruto: 0, ergo: 0 },
        libTab: 0, collOpen: true, collFilter: 'all', faq: {},
        rs: { style: 'default', dir: 0, quality: 'high', dtz: true },
        txTab: 0,
        spent: [0, 1, 2, 3].map(function () { return { t: 'Prince of Lan Ling', s: 'Chapter  14', d: '24/07/2021  .  23:05', c: 300 }; }),
        bought: [0, 1, 2, 3].map(function () { return { c: 300, b: 100, p: '$29.99', d: '24/07/2021  .  23:05' }; }),
        manga: 'prince', descOpen: false,
        chapter: 2, unlocked: { 1: 1, 2: 1, 3: 1 }, page: 4,
        ui: true, panel: null, bright: 70, tag: false, end: false, locked: false, liked: false,
        sheet: null, tip: { item: null, amount: 0, edit: false }, done: null, confirm: null, coachSeen: false, tosAuth: false,
        lastBuy: 0, toast: null
      };
    }

    /* ------------------------------------------------------ navigation */
    function go(view, patch) {
      st.stack.push(st.view);
      st.view = view; st.panel = null; st.sheet = null; st.done = null; st.confirm = null;
      if (patch) for (var k in patch) st[k] = patch[k];
      render(true);
    }
    function tab(view) { st.stack = []; st.view = view; st.sheet = null; st.done = null; st.confirm = null; render(true); }
    function back() {
      if (st.sheet || st.done || st.confirm) { st.sheet = null; st.done = null; st.confirm = null; render(); return; }
      st.view = st.stack.pop() || 'home'; st.panel = null; render(true);
    }

    /* --------------------------------------------------- shared parts */
    function status(dark) {
      return '<div class="tr-status' + (dark ? ' is-dark' : '') + '"><span>9:41</span><span class="tr-status__i"><i></i><i></i><i></i><b></b></span></div>';
    }
    function tabbar(active) {
      var items = [['home', 'Home', I.home], ['library', 'Library', I.book], ['collect', 'Collectables', I.medal], ['profile', 'My Profile', I.user]];
      return '<nav class="tr-tabbar">' + items.map(function (t) {
        return '<button type="button" class="' + (active === t[0] ? 'is-on' : '') + '" data-act="tab:' + t[0] + '">' + t[2] + '<span>' + cs(t[1]) + '</span></button>';
      }).join('') + '</nav>';
    }
    function head(title, mascot, o) {
      o = o || {};
      return '<header class="tr-head">' + btn('back', I.back, 'tr-backbtn', 'Back') + '<p class="tr-head__t">' + (fx.vcase && CASE[title] ? CASE[title] : esc(title)) + '</p>' +
        (o.search ? btn('search:' + (o.scope || ''), I.search, 'tr-searchbtn', 'Search') : '') + (mascot ? img(mascot, 'tr-head__m') : '') + '</header>';
    }
    function cover(id, cls) {
      var m = T[id], pick = cls === 'is-pick';
      return '<button type="button" class="tr-cov ' + (cls || '') + (fx.numbers && pick ? ' is-neutral' : '') + '" data-act="manga:' + id + '">' + img(m.cov, '', esc(m.t)) +
        '<span class="tr-cov__t">' + esc(m.t) + '</span>' + '<span class="tr-cov__s">' + (pick ? (fx.numbers ? I.eye : I.bookmark) + m.reads : esc(m.ch)) + '</span></button>';
    }
    function card(id, i) {
      var m = T[id], on = st.follow[id];
      return '<div class="tr-card"><button type="button" class="tr-card__main" data-act="manga:' + id + '">' + img(m.thumb || m.cov, 'tr-card__th') +
        '<span class="tr-card__t">' + esc(m.t) + '</span><span class="tr-card__s">' + esc(m.by || m.ch) + '</span>' +
        '<span class="tr-card__r">' + (fx.numbers ? I.eye : I.people) + esc(m.reads) + '</span></button>' +
        btn('follow:' + id, on ? I.bmCheck : I.bmPlus, 'tr-card__bm' + (on ? ' is-on' : ''), on ? 'Remove from library' : 'Add to library') +
        (i != null ? '<span class="tr-rank' + (i === 0 ? ' is-top' : '') + '">' + (i + 1) + '</span>' : '') + '</div>';
    }
    function progress() {
      var pct = Math.min(100, st.tipped / st.goal * 100);
      return '<div class="tr-goal' + (fx.goal ? ' is-labelled' : '') + '">' +
        (fx.goal ? '<div class="tr-goal__lab"><b>Community tip goal</b><span>' + coin() + n(st.tipped) + ' / ' + n(st.goal) + '</span></div>' : '') +
        '<div class="tr-goal__bar"><i style="width:' + pct.toFixed(1) + '%"></i>' + img('mini-mascot', 'tr-goal__m', '') + img('trophy', 'tr-goal__t', '') + '</div>' +
        (fx.goal ? '<div class="tr-goal__row"><span>' + Math.round(pct) + '% there</span><span>Chapter 143</span></div>'
          : '<div class="tr-goal__row"><span>' + coin() + '<b>' + st.tipped + '</b>/' + st.goal + '</span><span>Chapter 143</span></div>') + '</div>';
    }
    function sec(t, act) { t = cs(t); return '<div class="tr-sec"><p class="tr-sec__t">' + t + '</p>' + (act ? btn(act, I.right, 'tr-sec__go', 'See all ' + t) : '') + '</div>'; }

    /* ------------------------------------------------------------ views */
    var V = {};
    V.splash = function () { return '<div class="tr-screen-cream tr-clouds tr-center" data-act="splash">' + img('logo', 'tr-logo-xl', 'Trophee') + '</div>'; };

    V.signup = function () {
      var email = st.email.trim(), ready = email && st.codeSent && st.otp.length === 4;
      var title = fx.auth ? 'Log in or sign up' : cs(st.signin ? 'Sign In' : 'Sign Up');
      var h = '<div class="tr-screen-cream tr-auth' + (fx.auth ? ' is-v2' : '') + '"><p class="tr-lang">English ' + I.right + '</p>' + img('logo', 'tr-logo-md', 'Trophee') +
        '<p class="tr-title' + (fx.auth ? ' is-sm' : '') + '">' + title + '</p>' +
        '<label class="tr-field">' + I.mail + '<input type="email" inputmode="email" placeholder="Email ID or Phone Number" value="' + esc(st.email) + '" data-k="email" autocomplete="off"' + (fx.otp && st.codeSent ? ' readonly' : '') + '></label>';
      if (fx.otp) {
        if (!st.codeSent) h += btn('getcode', 'Send code', 'tr-cta tr-cta--wide tr-cta--near', '', email ? '' : ' disabled');
        else {
          var boxes = '';
          for (var i = 0; i < 4; i++) boxes += '<span class="' + (i === st.otp.length ? 'is-cur' : '') + (st.otp[i] ? ' is-full' : '') + '">' + (st.otp[i] || '') + '</span>';
          h += '<p class="tr-sent">Code sent to <b>' + esc(email) + '</b> · ' + btn('editemail', 'Change', 'tr-link tr-link--red') + '</p>' +
            '<label class="tr-otp" aria-label="4-digit code">' + boxes + '<input class="tr-otp__in" type="text" inputmode="numeric" maxlength="4" value="' + esc(st.otp) + '" data-k="otp" autocomplete="one-time-code"></label>' +
            '<p class="tr-resend">' + (st.left > 0 ? 'Resend code in 0:' + (st.left < 10 ? '0' : '') + st.left : btn('getcode', 'Resend code', 'tr-link tr-link--red')) + '</p>' +
            btn('continue', 'Continue', 'tr-cta tr-cta--wide tr-cta--near', '', ready ? '' : ' disabled');
        }
      } else {
        var codeBtn = !st.codeSent ? btn('getcode', 'Get code', 'tr-pill', '', email ? '' : ' disabled') :
          st.left > 0 ? '<span class="tr-pill is-wait">0:' + (st.left < 10 ? '0' : '') + st.left + '</span>' : btn('getcode', 'Resend', 'tr-pill');
        h += '<div class="tr-field tr-field--otp"><label>' + I.lock + '<input type="text" inputmode="numeric" maxlength="4" placeholder="OTP" value="' + esc(st.otp) + '" data-k="otp" autocomplete="one-time-code"></label>' + codeBtn + '</div>' +
          btn('continue', 'Continue', 'tr-cta tr-cta--wide', '', ready ? '' : ' disabled');
      }
      if (fx.terms) h += '<p class="tr-consent">By continuing you agree to the ' + btn('tosauth', 'Terms of Service', 'tr-link') + ' and ' + btn('tosauth', 'Privacy Policy', 'tr-link') + '.</p>';
      h += '<p class="tr-or"><span>or with</span></p>';
      h += fx.social ? '<div class="tr-social2">' + btn('social', I.google + 'Continue with Google', '') + btn('social', I.apple + 'Continue with Apple', '') + btn('social', I.facebook + 'Continue with Facebook', '') + '</div>'
        : '<div class="tr-social">' + btn('social', I.google, '', 'Continue with Google') + btn('social', I.facebook, '', 'Continue with Facebook') + btn('social', I.apple, '', 'Continue with Apple') + '</div>';
      if (!fx.auth) h += '<p class="tr-switch">' + (st.signin ? 'Don’t have an account? ' + btn('mode', cs('Sign Up'), 'tr-link') : 'Have an account? ' + btn('mode', cs('Sign In'), 'tr-link')) + '</p>';
      return h + '</div>';
    };
    V.welcome = function () {
      return '<div class="tr-screen-cream tr-clouds tr-welcome">' + img('logo', 'tr-logo-md', 'Trophee') + '<p class="tr-welcome__a">Welcome to</p><p class="tr-hand">Trophee Reader!</p>' +
        '<div class="tr-terms" tabindex="0"><p>' + LIPSUM + '</p><p>' + LIPSUM2 + '</p></div>' + btn('accept', 'Accept', 'tr-cta tr-cta--sm') + img('m-welcome', 'tr-welcome__m') + '</div>';
    };
    V.genre = function () {
      var count = GENRES.filter(function (g) { return st.genres[g]; }).length, prof = st.genreFrom === 'profile';
      var foot = fx.genres
        ? btn('genre-done', (prof ? 'Save' : 'Continue') + (count ? ' (' + count + ')' : ''), 'tr-cta tr-cta--sm', '', count ? '' : ' disabled') + (prof ? '' : btn('genre-done', 'Skip', 'tr-skip tr-skip--text'))
        : btn('genre-done', 'Done', 'tr-cta tr-cta--sm') + btn('genre-done', 'Skip <i>' + I.right + '</i>', 'tr-skip');
      return '<div class="tr-screen-cream tr-clouds tr-genre' + (fx.genres ? ' is-v2' : '') + '"><div class="tr-genre__h">' + img('m-genre', 'tr-genre__m') + '<p class="tr-hand">' + cs('Preferred Genre') + '</p></div>' +
        (fx.genres ? '<p class="tr-genre__s">Pick a few — your home page starts here. You can change this later.</p>' : '') +
        '<div class="tr-chips">' + GENRES.map(function (g) {
          return btn('genre:' + g, esc(g) + (st.genres[g] ? '<i>' + I.check + '</i>' : ''), 'tr-chip' + (st.genres[g] ? ' is-on' : ''), '', ' aria-pressed="' + !!st.genres[g] + '"');
        }).join('') + '</div><div class="tr-genre__f">' + foot + '</div></div>';
    };
    V.nft = function () {
      if (fx.nftintro) {
        return '<div class="tr-screen-cream tr-nft is-v2">' + btn('nft-next', 'Skip', 'tr-skiptop') + '<div class="tr-nft__card">' + img('nft-cards', 'tr-nft__img', 'Two NFT cards from Trophee') + '</div>' +
          '<p class="tr-nft__t">NFTs</p><p class="tr-nft__s">Show off your NFT collection from Trophee</p>' +
          '<div class="tr-nft__f">' + btn('nft-next', 'Get started ' + I.arrowR, 'tr-cta tr-cta--yellow') + '</div></div>';
      }
      return '<div class="tr-screen-cream tr-nft"><div class="tr-nft__card">' + img('nft-cards', 'tr-nft__img', 'Two NFT cards from Trophee') + '</div>' +
        '<p class="tr-nft__t">NFTs</p><p class="tr-nft__s">Show off your NFT collection from Trophee</p><div class="tr-dots"><i></i><i class="is-on"></i><i></i><i></i></div>' +
        '<div class="tr-nft__f">' + btn('back', I.arrowL, 'tr-sq', 'Back') + btn('nft-next', 'Next ' + I.arrowR, 'tr-cta tr-cta--yellow') + '</div></div>';
    };
    V.home = function () {
      var rank = ['chainsaw', 'marin', 'bunny', 'fate'];
      return '<div class="tr-col"><header class="tr-homehead">' + btn('coins', coin() + '<b>' + n(st.coins) + '</b><i>' + I.plus + '</i>', 'tr-coinpill', 'Buy coins') + img('logo-sm', 'tr-homehead__logo', 'Trophee') +
        btn('search:', I.search, 'tr-searchbtn', 'Search') + '</header><div class="tr-scroll" data-k="scroll-home">' +
        '<div class="tr-banner">' + img('banner', '', 'Login everyday and get free coins') + '</div><div class="tr-dots tr-dots--sm"><i class="is-on"></i><i></i><i></i></div>' +
        sec('Your Updates', 'library').slice(0, -6) + img('mini-mascot', 'tr-sec__m') + '</div>' + '<div class="tr-row">' + ['fate', 'prince', 'naruto', 'chainsaw'].map(function (id) { return cover(id); }).join('') + '</div>' +
        sec('Today’s Picks', 'list:picks') + '<div class="tr-row">' + ['chainsaw', 'marin', 'bunny', 'fate'].map(function (id) { return cover(id, 'is-pick'); }).join('') + '</div>' +
        sec('Top Series', 'list:top') + '<div class="tr-top">' + rank.map(function (id, i) {
          return '<button type="button" class="tr-top__i" data-act="manga:' + id + '"><span class="tr-rank' + (i === 0 ? ' is-top' : '') + '">' + (i + 1) + '</span>' + img(T[id].cov, '') + '<span><b>' + esc(T[id].t) + '</b><small>' + esc(T[id].reads) + '</small></span></button>';
        }).join('') + '</div>' +
        sec('Discover', null) + '<button type="button" class="tr-discover" data-act="manga:prince">' + img('discover', '', 'Discover') + '</button>' +
        sec('Action', 'list:genres') + '<div class="tr-row">' + ['ergo', 'chainsaw', 'naruto', 'fate'].map(function (id) { return cover(id, 'is-pick'); }).join('') + '</div>' +
        sec('Romance', 'list:genres') + '<div class="tr-row">' + ['marin', 'bunny', 'ergo', 'prince'].map(function (id) { return cover(id, 'is-pick'); }).join('') + '</div>' +
        '<div class="tr-gap"></div></div>' + tabbar('home') + '</div>';
    };
    var LISTS = {
      genres: { t: 'Genres', tabs: ['Action', 'Comedy', 'Drama', 'Fantasy', 'Horror'], m: 'm-profile', scope: 'Action' },
      picks: { t: 'Today’s Pick', m: 'm-devil', scope: 'Today’s Picks' },
      top: { t: 'Top Series', tabs: ['Popular', 'Action', 'Comedy', 'Drama', 'Fantasy'], m: 'm-profile', rank: true },
      recs: { t: 'Recommendations', m: 'm-devil' }
    };
    V.list = function () {
      var L = LISTS[st.list.kind], items = rotate(LIST, st.list.tab);
      return '<div class="tr-col tr-sub">' + head(L.t, L.m, { search: true, scope: L.scope || '' }) +
        (L.tabs ? '<div class="tr-tabs">' + L.tabs.map(function (t, i) { return btn('ltab:' + i, t, st.list.tab === i ? 'is-on' : ''); }).join('') + '</div>' : '') +
        '<div class="tr-scroll" data-k="scroll-list-' + st.list.kind + '">' + items.map(function (id, i) { return card(id, L.rank ? i : null); }).join('') + '<div class="tr-gap"></div></div>' + tabbar('home') + '</div>';
    };
    V.search = function () {
      var q = st.search.q.trim().toLowerCase(), res = [];
      if (q) LIST.forEach(function (id) { if ((T[id].t + ' ' + (T[id].by || '')).toLowerCase().indexOf(q) > -1) res.push(id); });
      var ph = st.search.scope ? 'Search in “' + st.search.scope + '”' : 'Search Title or Creator';
      var idle = !q && !st.search.scope, body;
      if (!q) body = '';
      else if (res.length) body = res.map(function (id) { return card(id); }).join('');
      else body = fx.search ? '<div class="tr-empty">' + img('m-search', 'tr-empty__m') + '<b>No results for “' + esc(st.search.q.trim()) + '”</b><p>Try a title or a creator’s name.</p>' + btn('clearq', 'Clear search', 'tr-link tr-link--red') + '</div>' : '<p class="tr-none">No result found</p>';
      var mascot = fx.search ? (idle ? img('m-search', 'tr-search__m') : '') : img('m-search', 'tr-search__m');
      return '<div class="tr-col tr-search' + (fx.search ? ' is-v2' : '') + '"><header class="tr-searchhead"><label class="tr-searchbox">' + (fx.search ? I.search : '') + '<input type="search" placeholder="' + esc(ph) + '" value="' + esc(st.search.q) + '" data-k="q" autocomplete="off">' +
        btn('clearq', I.x, 'tr-clear', 'Clear') + '</label>' + btn('back', fx.search ? 'Cancel' : cs('CANCEL'), 'tr-cancel') + '</header>' +
        (idle ? (fx.search ? '<p class="tr-slabel">Browse by genre</p>' : '') + '<div class="tr-sgenres' + (fx.search ? ' is-chips' : '') + '">' + ['Action', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Romance'].map(function (g) { return btn('scope:' + g, g, ''); }).join('') + '</div>' : '') +
        '<div class="tr-scroll">' + body + '</div>' + mascot + '</div>';
    };
    function libItem(id, meta, badge, sub) {
      var m = T[id];
      return '<button type="button" class="tr-card tr-card--lib" data-act="manga:' + id + '">' + img(m.thumb || m.cov, 'tr-card__th') + '<span class="tr-card__t">' + esc(m.t) + '</span>' +
        '<span class="tr-card__s">' + esc(sub || m.by || '') + '</span><span class="tr-card__m">' + meta + '</span>' + (badge || '') + '</button>';
    }
    function barHead(m) { return '<header class="tr-barhead">' + img(m, 'tr-barhead__m') + btn('search:', '<span></span>' + I.search, 'tr-fakesearch', 'Search') + '</header>'; }
    V.library = function () {
      var tabs = [['Following', I.bookmark], ['Downloaded', I.dl], ['History', I.clock]], list;
      if (st.libTab === 0) list = LIST.filter(function (id) { return st.follow[id]; }).map(function (id, i) {
        return fx.library ? libItem(id, '328 Chapters <em class="tr-cont">Continue ›</em>', i < 2 ? '<span class="tr-badge is-new">New · Ch. 238</span>' : '')
          : libItem(id, '328 Chapters', '<span class="tr-badge' + (i < 2 ? ' is-new' : '') + '">#238</span>');
      });
      else if (st.libTab === 1) list = ['chainsaw', 'prince', 'marin'].map(function (id) { return libItem(id, 'December 13, 2021 &nbsp; Downloaded'); });
      else list = ['prince', 'chainsaw', 'bunny'].map(function (id) { return libItem(id, 'Read 3 days ago <em>23 pages left</em>', '', 'Chapter 24'); });
      return '<div class="tr-col tr-sub">' + barHead('m-library') + '<div class="tr-libtabs">' + tabs.map(function (t, i) {
        return btn('libtab:' + i, t[1] + '<span>' + t[0] + '</span>', st.libTab === i ? 'is-on' : '');
      }).join('') + '</div><div class="tr-scroll">' + (list.join('') || '<p class="tr-none">Nothing followed yet</p>') + '<div class="tr-gap"></div></div>' + tabbar('library') + '</div>';
    };
    V.collect = function () {
      var counts = { Unique: 0, Epic: 0, Rare: 0, Special: 0, Common: 0 };
      NFTS.forEach(function (x) { counts[x.r.charAt(0).toUpperCase() + x.r.slice(1)]++; });
      var nftCard = function (x) {
        var r = fx.collect ? x.r.charAt(0).toUpperCase() + x.r.slice(1) : x.r;
        return '<article class="tr-nftcard">' + (x.img ? img(x.img, '', esc(x.t)) : '<span class="tr-nftcard__ph"></span>') + '<p class="tr-nft__a">' + esc(x.a) + '</p><p class="tr-nft__n">' + esc(x.t) + '</p>' +
          '<div><span class="tr-rare is-' + x.r.toLowerCase() + '">' + esc(r) + '</span><small>Edition: ' + x.e + '</small></div></article>';
      };
      var top;
      if (fx.collect) {
        top = '<p class="tr-collv2">My collection <b>' + NFTS.length + '</b></p><div class="tr-rchips">' + btn('cfilter:all', 'All <b>' + NFTS.length + '</b>', st.collFilter === 'all' ? 'is-on' : '') +
          Object.keys(counts).filter(function (k) { return counts[k]; }).map(function (k) { return btn('cfilter:' + k.toLowerCase(), k + ' <b>' + counts[k] + '</b>', 'is-' + k.toLowerCase() + (st.collFilter === k.toLowerCase() ? ' is-on' : '')); }).join('') + '</div>';
      } else {
        top = btn('coll', cs('Total Collection size') + ' <b>' + NFTS.length + '</b>' + (st.collOpen ? I.down : I.right), 'tr-collhead', '', ' aria-expanded="' + st.collOpen + '"') +
          (st.collOpen ? '<dl class="tr-rarity">' + Object.keys(counts).map(function (k) { return '<div class="is-' + k.toLowerCase() + '"><dt>' + k + '</dt><dd>' + counts[k] + '</dd></div>'; }).join('') + '</dl>' : '');
      }
      var list = NFTS.filter(function (x) { return !fx.collect || st.collFilter === 'all' || x.r.toLowerCase() === st.collFilter; });
      return '<div class="tr-col tr-sub">' + barHead('m-collect') + '<div class="tr-scroll">' + top + list.map(nftCard).join('') + '<div class="tr-gap"></div></div>' + tabbar('collect') + '</div>';
    };
    V.profile = function () {
      var top = '<div class="tr-profile__top">' + (fx.profile ? '' : btn('logout', I.logout, 'tr-logout', 'Log out')) + '</div>' +
        '<div class="tr-avatar">' + img('avatar', '', 'Profile picture') + '</div><p class="tr-uname">Username</p>' +
        btn('coins', coin('is-lg') + '<b>' + n(st.coins) + '</b><i>' + I.plus + '</i>', 'tr-coinpill tr-coinpill--lg', 'Buy coins');
      if (fx.profile) {
        var row = function (icon, k, v, act) {
          return act ? btn(act, '<i>' + icon + '</i><b>' + k + '</b><span>' + (v || '') + '</span>' + I.right, 'tr-srow')
            : '<div class="tr-srow"><i>' + icon + '</i><b>' + k + '</b><span>' + (v || '') + '</span></div>';
        };
        var group = function (t, rows) { return '<div class="tr-sgroup"><p class="tr-sgroup__t">' + t + '</p><div>' + rows.join('') + '</div></div>'; };
        return '<div class="tr-col"><div class="tr-scroll tr-profile">' + top +
          group('Account', [row(I.mail, 'Email', 'useremail@gmail.com'), row(I.phone, 'Phone', '+42 717171'), row(I.google, 'Google', 'useremail@gmail.com'), row(I.facebook, 'Facebook', 'accountusername')]) +
          group('Reading', [row(I.bookmark, 'Preferred genres', GENRES.filter(function (g) { return st.genres[g]; }).length + ' picked', 'pgenres'), row(I.sliders, 'Reader settings', '', 'go:rsettings'), row(I.globe, 'Default language', 'English')]) +
          group('Coins', [row(I.plus, 'Buy coins', n(st.coins) + ' left', 'coins'), row(I.receipt, 'Purchase history', '', 'go:tx')]) +
          group('Support', [row(I.help, 'FAQ', '', 'go:faq'), row(I.chat, 'Help', '', 'go:help'), row(I.doc, 'Terms & Privacy', '', 'go:tos')]) +
          btn('logoutask', 'Log out', 'tr-logoutrow') + '<div class="tr-gap"></div></div>' + tabbar('profile') + '</div>';
      }
      var prow = function (k, v) { return '<div class="tr-prow"><b>' + k + '</b><span>' + v + '</span>' + I.right + '</div>'; };
      return '<div class="tr-col"><div class="tr-scroll tr-profile">' + top +
        '<div class="tr-prows">' + prow('Email', 'useremail@gmail.com') + prow('Phone', '+42 717171') + prow('Password', '•••••••••') + prow(I.google, 'useremail@gmail.com') + prow(I.facebook, 'accountusername') + '</div>' +
        '<div class="tr-pbtns">' + btn('pgenres', cs('Preferred Genres'), 'tr-cta tr-cta--tile') + btn('noop', cs('Default Language'), 'tr-cta tr-cta--tile') +
        btn('go:rsettings', cs('Reader Settings'), 'tr-cta tr-cta--tile') + btn('go:tx', cs('Purchase History'), 'tr-cta tr-cta--tile') + '</div>' +
        '<div class="tr-plinks">' + btn('go:faq', 'FAQ' + I.right, '') + btn('go:help', 'Help' + I.right, '') + '</div>' +
        '<p class="tr-legal">' + btn('go:tos', 'Terms of Service', 'tr-link') + ' and ' + btn('go:tos', 'Privacy Policy', 'tr-link') + '</p><div class="tr-gap"></div></div>' + tabbar('profile') + '</div>';
    };
    V.faq = function () {
      var qa = [['What are Coins ?', 'Coins are used within Trophee Reader to support the Mangakas who produce the works you love so much. You can use Coins to unlock manga chapters and further support your favorite Mangakas by giving them tips!'],
        ['How do I get Coins ?', 'Coins can either be obtained by participating in limited events! If you find that you need more, they can also be purchased ' + btn('coins', 'here', 'tr-link tr-link--red') + '.']];
      return '<div class="tr-col tr-sub">' + head('FAQ', 'm-profile') + '<div class="tr-scroll tr-faq">' + qa.map(function (x, i) {
        var open = !!st.faq[i];
        return '<div class="tr-faq__i' + (open ? ' is-open' : '') + '">' + btn('faq:' + i, esc(x[0]) + (open ? I.down : I.right), 'tr-faq__q', '', ' aria-expanded="' + open + '"') + (open ? '<p>' + x[1] + '</p>' : '') + '</div>';
      }).join('') + '</div>' + tabbar('profile') + '</div>';
    };
    V.help = function () { return '<div class="tr-col tr-sub">' + head('Help', 'm-profile') + '<div class="tr-scroll"><p class="tr-help">Refer FAQ or contact us on ....</p></div>' + tabbar('profile') + '</div>'; };
    V.tos = function () {
      return '<div class="tr-col tr-sub">' + head('Terms of Service  &  Privacy Policy', 'm-profile') + '<div class="tr-scroll"><div class="tr-terms tr-terms--tos" tabindex="0"><p>' + LIPSUM + '</p><p>' + LIPSUM2 + '</p><p>' + LIPSUM + '</p></div></div>' + (st.tosAuth ? '' : tabbar('profile')) + '</div>';
    };
    function settingsPanel(dark) {
      var r = st.rs, labels = ['Left to right', 'Right to left', 'Vertical', 'Continuous vertical'];
      return '<div class="tr-rs' + (dark ? ' is-dark' : '') + '"><div class="tr-rs__row"><span>Reading style</span><span class="tr-seg">' +
        btn('rs-style:default', 'Default', r.style === 'default' ? 'is-on' : '') + btn('rs-style:custom', 'Custom', r.style === 'custom' ? 'is-on' : '') + '</span></div>' +
        '<div class="tr-rs__dirs">' + I.dirs.map(function (d, i) {
          return btn('rs-dir:' + i, d + (fx.contrast ? '<small>' + ['L → R', 'R → L', 'Vertical', 'Scroll'][i] + '</small>' : ''), (r.dir === i ? 'is-on' : ''), labels[i], (r.style === 'custom' ? '' : ' disabled') + ' title="' + labels[i] + '"');
        }).join('') + '</div>' +
        '<div class="tr-rs__row"><span>Quality</span><span class="tr-seg">' + [['saver', 'Data saver'], ['high', 'High'], ['original', 'Original']].map(function (q) {
          return btn('rs-q:' + q[0], q[1], r.quality === q[0] ? 'is-on' : '');
        }).join('') + '</span></div>' +
        '<label class="tr-rs__row tr-toggle"><span>Double tap to zoom</span><input type="checkbox" role="switch" data-k="dtz"' + (r.dtz ? ' checked' : '') + '><i></i></label></div>';
    }
    V.rsettings = function () { return '<div class="tr-col tr-sub">' + head('Reader Settings', 'm-profile') + '<div class="tr-scroll">' + settingsPanel(false) + '</div>' + tabbar('profile') + '</div>'; };
    V.tx = function () {
      var list = st.txTab === 0 ? st.spent.map(function (x) {
        return '<div class="tr-tx"><b>' + esc(x.t) + '</b><span class="tr-tx__s">' + esc(x.s) + '</span><small>' + x.d + '</small><span class="tr-tx__c">' + n(x.c) + coin() + '</span></div>';
      }) : st.bought.map(function (x) {
        return '<div class="tr-tx tr-tx--buy">' + coin('is-md') + '<b>' + n(x.c) + (x.b ? ' <em>(+' + n(x.b) + ')</em>' : '') + '</b><span class="tr-tx__p">' + x.p + '</span><small>' + x.d + '</small></div>';
      });
      return '<div class="tr-col tr-sub">' + head('Transactions', 'm-profile') + '<div class="tr-txtabs">' + btn('txtab:0', cs('Coin Spent'), st.txTab === 0 ? 'is-on' : '') + btn('txtab:1', cs('Coin Purchase'), st.txTab === 1 ? 'is-on' : '') + '</div>' +
        '<div class="tr-scroll">' + list.join('') + '</div>' + tabbar('profile') + '</div>';
    };
    V.manga = function () {
      var m = T[st.manga], fol = st.follow[st.manga];
      var bar = fx.readcta
        ? btn('chapters', '<i>' + I.list + '</i><span>Chapters</span>', 'tr-mbar__ch') + btn('read', I.play + 'Continue · Ch. ' + st.chapter, 'tr-mbar__primary')
        : btn('chapters', '<i>' + I.list + '</i><span>Chapters</span>', 'tr-mbar__ch') + [1, 2, 3].map(function (k) { return btn('pick:' + k, '0' + k, 'tr-mbar__n' + (st.chapter === k ? ' is-on' : '')); }).join('') + btn('read', I.play + 'Ch. ' + st.chapter, 'tr-mbar__go');
      return '<div class="tr-col"><div class="tr-scroll tr-manga" data-k="scroll-manga">' +
        '<div class="tr-hero">' + img(m.hero || m.cov, m.hero ? '' : 'is-cover', esc(m.t)) + btn('back', I.back, 'tr-hero__b', 'Back') + btn('noop', I.dl, 'tr-hero__dl', 'Download') + btn('noop', I.share, 'tr-hero__sh', 'Share') +
        (fx.follow ? '' : btn('follow:' + st.manga, fol ? I.bmCheck : I.bmPlus, 'tr-hero__bm' + (fol ? ' is-on' : ''), fol ? 'Remove from library' : 'Add to library')) + '</div>' +
        '<div class="tr-info"><small>' + esc(m.g || 'Action, Shounen') + '</small><p class="tr-info__t">' + esc(m.t) + '</p>' +
        '<p class="tr-info__by">' + I.pen + esc(m.by || 'Yoshiki Tanaka') + ' <i>|</i> ' + I.brush + esc(m.art || 'Takeru Kirishima') + '</p>' +
        '<p class="tr-info__st"><span class="tr-star">' + I.star + (m.rating || '9.7') + '</span><span class="tr-reads">' + (fx.numbers ? I.eye : I.people) + esc(m.reads) + '</span></p>' +
        (fx.follow ? btn('follow:' + st.manga, fol ? I.check + 'Following' : I.plus + 'Follow', 'tr-followbtn' + (fol ? ' is-on' : ''), '', ' aria-pressed="' + !!fol + '"') : '') + '</div>' +
        '<div class="tr-desc' + (st.descOpen ? ' is-open' : '') + '"><p>' + DESC + '</p>' + (fx.contrast ? btn('desc', st.descOpen ? 'Show less' : 'Read more', 'tr-desc__txt') : btn('desc', I.down, 'tr-desc__more', st.descOpen ? 'Show less' : 'Read more')) + '</div>' +
        progress() + '<div class="tr-center">' + btn('tip', coin() + 'Tip <i>' + I.right + '</i>', 'tr-tipbtn' + (fx.tipsafe ? ' is-solid' : '')) + '</div>' +
        sec('Community', null) + [['AzureEclipse', 10], ['AzureEclipse', 9]].map(function (c) {
          return '<div class="tr-review"><span class="tr-review__a"></span><b>' + c[0] + '</b><small>Overall Rating &nbsp;' + c[1] + '</small><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Arcu placerat nibh nulla non neque aliquet.</p><span class="tr-up">↑</span><small class="tr-review__n">1801</small></div>';
        }).join('') +
        sec('Recommendations', 'list:recs') + '<div class="tr-row">' + ['marin', 'bunny', 'chainsaw', 'fate'].map(function (id) { return cover(id, 'is-pick'); }).join('') + '</div>' +
        sec('Collectables', 'tab:collect') + '<div class="tr-row tr-row--nft">' + NFTS.slice(0, 2).map(function (x) {
          return '<div class="tr-nftmini">' + img(x.img, '', esc(x.t)) + '<p class="tr-nft__a">' + esc(x.a) + '</p><p class="tr-nft__n">' + esc(x.t) + '</p><div><span class="tr-rare is-' + x.r.toLowerCase() + '">' + x.r + '</span><small>Edition: ' + x.e + '</small></div></div>';
        }).join('') + '</div><div class="tr-gap"></div></div>' + '<div class="tr-mbar' + (fx.readcta ? ' is-v2' : '') + '">' + bar + '</div></div>';
    };
    function chaptersSheet() {
      var rows = '';
      for (var k = 1; k <= CH_SHOWN; k++) {
        var locked = !st.unlocked[k], cur = k === st.chapter;
        rows += '<button type="button" class="tr-chap' + (locked ? ' is-locked' : '') + (cur ? ' is-cur' : '') + '" data-act="chap:' + k + '">' + img('ch' + (((k - 1) % 3) + 1), '') +
          (locked ? '<i class="tr-chap__lock">' + I.lockFill + '</i>' : '') + '<b>' + k + ' - ' + cs('Chapter’s Name') + '</b><span>' + I.thumb + '123 &nbsp; ' + I.chat + '15</span>' + (cur ? '<i class="tr-chap__tag">' + I.tag + '</i>' : '') + '</button>';
      }
      return '<div class="tr-scrim" data-act="close"></div><div class="tr-sheet tr-sheet--ch" role="dialog" aria-label="All chapters">' +
        '<div class="tr-sheet__h"><b>' + cs('All Chapters') + ' (' + CH_TOTAL + ')</b>' + btn('unlockall', 'Unlock all', 'tr-unlockall') + btn('close', I.x, 'tr-sheet__x', 'Close') + '</div>' +
        '<p class="tr-sheet__note">' + I.clock + 'Wait for 24 hours to unlock 1 chapter for free</p><div class="tr-sheet__list">' + rows + '</div></div>';
    }
    function tipSheet() {
      var t = st.tip, m = T[st.manga], items = fx.tiers ? TIPS.slice().sort(function (a, b) { return a.p2 - b.p2; }) : TIPS;
      var label = 'Tip', off = !(t.amount > 0);
      if (fx.tipsafe) label = t.amount > st.coins ? 'Get more coins' : t.amount ? 'Tip ' + n(t.amount) + ' coins' : 'Pick a gift';
      return '<div class="tr-scrim" data-act="close"></div><div class="tr-sheet tr-sheet--tip' + (fx.tipsafe ? ' is-v2' : '') + '" role="dialog" aria-label="Tip">' + img('m-welcome', 'tr-tip__peek') +
        '<p class="tr-tip__t">' + (fx.tipsafe ? 'Tip ' + esc(m.by || 'Yoshiki Tanaka') : esc(m.t)) + '</p><small>' + (fx.tipsafe ? 'Your balance: ' + n(st.coins) + ' coins' : esc(m.by || 'Yoshiki Tanaka')) + '</small>' +
        '<div class="tr-tipgrid">' + items.map(function (x) {
          return btn('titem:' + x.id, (x.pop ? '<em>Most popular</em>' : '') + img('tip-' + x.id, '') + '<b>' + x.n + '</b><span>' + n(tipPrice(x)) + coin() + '</span>', 'tr-titem' + (t.item === x.id ? ' is-on' : ''), '', ' aria-pressed="' + (t.item === x.id) + '"');
        }).join('') + '</div>' +
        '<div class="tr-tipamt">' + coin('is-md') + (t.edit ? '<input type="number" inputmode="numeric" min="1" value="' + (t.amount || '') + '" data-k="amount" aria-label="Tip amount">'
          : (fx.tipsafe && !t.amount ? '<b class="is-ph">or type an amount</b>' : '<b>' + n(t.amount) + '</b>')) +
        btn('tedit', I.edit, 'tr-tipamt__e', 'Edit amount') + '</div>' + btn('tipgo', label, 'tr-tipbtn tr-tipbtn--lg' + (fx.tipsafe ? ' is-solid' : ''), '', off ? ' disabled' : '') + img('m-devil', 'tr-tip__devil') + '</div>';
    }
    function tipDone() {
      var d = st.done;
      return '<div class="tr-scrim tr-scrim--dim" data-act="close"></div><div class="tr-modal" role="dialog" aria-label="Tipping complete">' + btn('close', I.x, 'tr-modal__x', 'Close') +
        (d.item ? (d.item === 'bento' ? img('bento-big', 'tr-modal__big') : '<span class="tr-modal__itm">' + img('tip-' + d.item, '') + '<i>' + I.check + '</i></span>') +
          '<b class="tr-modal__n">' + d.name + '</b><span class="tr-modal__c">' + n(d.amount) + coin() + '</span>'
          : '<span class="tr-bigcheck">' + I.check + '</span><span class="tr-modal__amt">' + n(d.amount) + coin('is-md') + '</span>') +
        '<p class="tr-modal__ok">Tipping complete!</p></div>';
    }
    function confirmModal() {
      return '<div class="tr-scrim tr-scrim--dim" data-act="close"></div><div class="tr-modal tr-modal--confirm" role="alertdialog" aria-label="Log out">' +
        '<p class="tr-modal__q">Log out of Trophee?</p><p class="tr-modal__p">You can log back in with your email or phone number.</p>' +
        '<div class="tr-modal__btns">' + btn('close', 'Cancel', 'tr-ghost') + btn('logout', 'Log out', 'tr-cta tr-cta--danger') + '</div></div>';
    }
    function coach() {
      return '<div class="tr-coach" role="dialog" aria-label="How to turn pages"><span class="tr-coach__z is-a">' + I.arrowL + 'Previous</span><span class="tr-coach__z is-b">Next' + I.arrowR + '</span>' +
        '<div class="tr-coach__m"><p>Tap the edges to turn pages.<br>Tap the middle to show or hide the controls.</p>' + btn('coach', 'Got it', 'tr-cta tr-cta--sm') + '</div></div>';
    }
    V.reader = function () {
      if (st.locked) return lockedView();
      if (st.end) return endView();
      var pg = ['pg1', 'pg2', 'pg3'][(st.page - 1) % 3], vertical = st.rs.style === 'custom' && st.rs.dir >= 2;
      var tools = fx.rbar
        ? btn('rsave', I.bookmark + '<span>' + (st.tag ? 'Saved' : 'Save') + '</span>', st.tag ? 'is-red' : '', '') + btn('panel:light', I.sun + '<span>Light</span>', st.panel === 'light' ? 'is-red' : '', '') +
          btn('panel:settings', I.sliders + '<span>Settings</span>', st.panel === 'settings' ? 'is-red' : '', '') + btn('chapters', I.list + '<span>Chapters</span>', '', '')
        : btn('rsave', I.bookmark, st.tag ? 'is-red' : '', 'Save') + btn('panel:light', I.sun, st.panel === 'light' ? 'is-red' : '', 'Brightness') + btn('panel:settings', I.sliders, st.panel === 'settings' ? 'is-red' : '', 'Reader settings') + btn('chapters', I.list, '', 'Chapters');
      return '<div class="tr-col tr-reader' + (st.ui ? '' : ' is-clean') + (fx.rbar ? ' is-labelled' : '') + '">' + status(true) +
        '<header class="tr-rhead">' + btn('back', I.back, 'tr-iconbtn', 'Back') + '<div><b>Prince of Lan Ling</b><small>Chapter ' + st.chapter + (fx.rbar ? ' · page ' + st.page + ' of ' + PAGES : '') + '</small></div>' +
        btn('noop', I.share, 'tr-iconbtn', 'Share') + (fx.rbar ? '' : btn('rtag', I.tag, 'tr-iconbtn' + (st.tag ? ' is-red' : ''), 'Bookmark this page')) + '</header>' +
        '<div class="tr-page' + (vertical ? ' is-vertical' : '') + '" data-act="pagetap" style="filter:brightness(' + (0.45 + st.bright / 100 * 0.6).toFixed(2) + ')">' + img(pg, '', 'Page ' + st.page) +
        '<span class="tr-zone tr-zone--a">Previous</span><span class="tr-zone tr-zone--b">Next</span></div>' +
        (st.panel === 'light' ? '<div class="tr-rpanel tr-rpanel--light"><span>' + I.moon + '</span><input type="range" min="0" max="100" value="' + st.bright + '" data-k="bright" aria-label="Brightness"><span>' + I.sun + '</span></div>' : '') +
        (st.panel === 'settings' ? '<div class="tr-rpanel">' + settingsPanel(true) + '</div>' : '') +
        (!st.panel ? '<div class="tr-rnav">' + btn('pg:-1', I.skipPrev, 'tr-rnav__b', 'Previous page') + '<label class="tr-rnav__s"><span>' + st.page + '</span><input type="range" min="1" max="' + PAGES + '" value="' + st.page + '" data-k="page" aria-label="Page"><span>' + PAGES + '</span></label>' + btn('pg:1', I.skipNext, 'tr-rnav__b', 'Next page') + '</div>' : '') +
        '<nav class="tr-rbar">' + tools + '</nav>' + (fx.coach && !st.coachSeen ? coach() : '') + '</div>';
    };
    function endView() {
      var next = st.chapter + 1, nextLocked = !st.unlocked[next];
      return '<div class="tr-col tr-reader tr-end">' + status(true) + '<div class="tr-end__card"><div class="tr-end__h"><small>Action, Shounen</small><b>Prince of Lan Ling</b><p class="tr-info__by">' + I.pen + 'Yoshiki Tanaka <i>|</i> ' + I.brush + 'Takeru Kirishima</p>' +
        '<p class="tr-end__ch">' + next + ' <i>·</i> ' + cs('Chapter Name') + '</p>' + (fx.endcta ? '' : btn('nextch', I.play + '<span>' + cs('Next<br>Chapter') + '</span>', 'tr-end__next')) + '</div>' +
        '<div class="tr-note"><b>Yoshiki Tanaka</b><p>Thank you. I love the snow, so I’m happy that it snowed. And I’m looking forward to summer too!</p></div>' + progress() +
        '<div class="tr-end__acts">' + btn('tip', coin() + '<span>Tip</span>', '') + btn('follow:prince', I.bookmark + '<span>Favorite</span>', st.follow.prince ? 'is-green' : '') + btn('like', I.thumb + '<span>Like</span>', st.liked ? 'is-blue' : '') + btn('noop', I.share + '<span>Share</span>', 'is-coral') + '</div>' +
        (fx.endcta ? '<div class="tr-end__cta">' + btn('nextch', (nextLocked ? I.lockFill + 'Unlock Chapter ' + next : 'Next: Chapter ' + next + ' ' + I.arrowR), 'tr-cta tr-cta--wide') + '</div>' : '') + '</div>' +
        btn('endback', I.back, 'tr-iconbtn tr-end__back', 'Back to the last page') + '</div>';
    }
    function freeText() {
      var s = Math.max(0, Math.round((freeEnd - Date.now()) / 1000)), p = function (x) { return (x < 10 ? '0' : '') + x; };
      return p(Math.floor(s / 3600)) + ':' + p(Math.floor(s % 3600 / 60)) + ':' + p(s % 60);
    }
    function lockedView() {
      var k = st.chapter, enough = st.coins >= CH_PRICE;
      return '<div class="tr-col tr-reader tr-locked">' + status(true) + '<div class="tr-locked__bg">' + img('pg1', '') + '</div>' + btn('back', I.back, 'tr-iconbtn tr-locked__back', 'Back') +
        '<div class="tr-locked__c"><span>' + I.lockFill + '</span><b>' + cs('Chapter Locked') + '</b></div>' +
        '<div class="tr-locked__card' + (fx.locked ? ' is-v2' : '') + '">' + img('cov-prince', 'tr-locked__cov') + '<div><small>Action, Shounen</small><b>Prince of Lan Ling</b><p class="tr-info__by">' + I.pen + 'Yoshiki Tanaka <i>|</i> ' + I.brush + 'Takeru Kirishima</p>' +
        '<p class="tr-end__ch">' + k + ' <i>·</i> Chapter Name</p></div><span class="tr-price">' + CH_PRICE + coin() + '</span>' +
        (fx.locked
          ? '<div class="tr-locked__acts">' + btn('unlock', enough ? 'Unlock for ' + CH_PRICE + coin() : 'Get coins to unlock', 'tr-unlock') +
            '<p class="tr-locked__bal">' + (enough ? 'Balance after: ' + n(st.coins - CH_PRICE) + ' coins' : 'You have ' + n(st.coins) + ' coins — ' + n(CH_PRICE - st.coins) + ' short') + '</p>' +
            '<p class="tr-locked__free">' + I.clock + 'Or read it free in <b data-free>' + freeText() + '</b></p></div>'
          : btn('unlock', 'Unlock!', 'tr-unlock')) + '</div></div>';
    }
    V.coins = function () {
      var packs = fx.packs ? PACKS2 : PACKS1;
      return '<div class="tr-col tr-shop">' + status(false) + btn('back', I.x, 'tr-shop__x', 'Close') + '<div class="tr-shop__bal">' + coin('is-lg') + '<b>' + n(st.coins) + '</b></div>' +
        '<p class="tr-shop__t">' + cs('Get More') + ' <em>' + (fx.vcase ? 'coins' : 'Coins') + '</em> to enhance your ' + cs('Trophee Experience') + '!</p><div class="tr-packs">' + packs.map(function (p, i) {
          return btn('buy:' + i, (p.best ? '<em class="tr-pack__best">Best value</em>' : '') + coin('is-md') + '<b>' + n(p.c) + (p.b ? ' <em>(+' + n(p.b) + ')</em>' : '') + '</b><span>' + p.p + '</span>', 'tr-pack' + (p.best ? ' is-best' : ''));
        }).join('') + '</div>' + (fx.packs ? '<p class="tr-shop__note">One chapter is ' + CH_PRICE + ' coins</p>' : '') + img('m-coins', 'tr-shop__m') + '</div>';
    };
    V.coinsdone = function () {
      return '<div class="tr-col tr-shop tr-shop--done">' + status(false) + btn('coinsdone', I.x, 'tr-shop__x', 'Close') + '<span class="tr-bigcheck tr-bigcheck--shop">' + I.check + '</span>' +
        '<div class="tr-shop__got">+ ' + n(st.lastBuy) + coin('is-md') + '</div><p class="tr-shop__ok">Purchase complete!</p>' + btn('coinsdone', 'Done', 'tr-shop__done') + img('m-fox', 'tr-shop__m tr-shop__m--fox') + '</div>';
    };

    /* ----------------------------------------------------------- render */
    function render(resetScroll) {
      var a = document.activeElement, keep = null;
      if (a && app.contains(a)) keep = { k: a.getAttribute('data-k'), act: a.getAttribute('data-act'), s: a.selectionStart, e: a.selectionEnd };
      app.querySelectorAll('[data-k^="scroll"]').forEach(function (el) { scrolls[el.getAttribute('data-k')] = el.scrollTop; });
      var view = V[st.view] || V.home, dark = st.view === 'reader';
      var html = (st.view === 'reader' || st.view === 'coins' || st.view === 'coinsdone' || st.view === 'manga' ? '' : status(false)) + '<div class="tr-v tr-v--' + st.view + '">' + view() + '</div>';
      if (st.sheet === 'tip') html += tipSheet();
      if (st.sheet === 'chapters') html += chaptersSheet();
      if (st.done) html += tipDone();
      if (st.confirm) html += confirmModal();
      if (st.toast) html += '<div class="tr-toast" role="status">' + esc(st.toast) + '</div>';
      html += '<i class="tr-homebar' + (dark || st.view === 'coins' ? ' is-light' : '') + '"></i>';
      app.className = 'tr-app' + Object.keys(fx).map(function (k) { return ' fx-' + k; }).join('');
      app.innerHTML = html;
      app.querySelectorAll('[data-k^="scroll"]').forEach(function (el) { var k = el.getAttribute('data-k'); el.scrollTop = resetScroll ? 0 : (scrolls[k] || 0); });
      if (keep) {
        var el = keep.k ? app.querySelector('[data-k="' + keep.k + '"]') : keep.act ? app.querySelector('[data-act="' + keep.act + '"]') : null;
        if (el && !el.disabled) { el.focus({ preventScroll: true }); if (keep.s != null && el.setSelectionRange && el.type !== 'number' && el.type !== 'range' && el.type !== 'email') { try { el.setSelectionRange(keep.s, keep.e); } catch (e) {} } }
      }
      clearInterval(freeT);
      if (fx.locked && st.view === 'reader' && st.locked) freeT = setInterval(function () { var b = app.querySelector('[data-free]'); if (b) b.textContent = freeText(); }, 1000);
      syncFlows();
    }
    function toast(t) { st.toast = t; render(); clearTimeout(toastT); toastT = setTimeout(function () { st.toast = null; render(); }, 1800); }

    /* ---------------------------------------------------------- actions */
    function act(a, el, evt) {
      var p = a.split(':'), cmd = p[0], arg = p.slice(1).join(':');
      switch (cmd) {
        case 'splash': clearTimeout(splashT); go('signup'); return;
        case 'back': back(); return;
        case 'close': st.sheet = null; st.done = null; st.confirm = null; render(); return;
        case 'tab': tab(arg); return;
        case 'go': st.tosAuth = false; go(arg); return;
        case 'noop': return;
        /* auth */
        case 'getcode':
          st.codeSent = true; st.left = 45; st.otp = ''; render(); clearInterval(timer);
          timer = setInterval(function () { st.left--; if (st.left <= 0) { st.left = 0; clearInterval(timer); } if (st.view === 'signup') render(); }, 1000);
          var otp = app.querySelector('[data-k="otp"]'); if (otp && !reel.on) otp.focus({ preventScroll: true }); return;
        case 'editemail': st.codeSent = false; st.otp = ''; clearInterval(timer); render(); var em = app.querySelector('[data-k="email"]'); if (em) em.focus({ preventScroll: true }); return;
        case 'continue': case 'social': clearInterval(timer); afterAuth(); return;
        case 'mode': st.signin = !st.signin; render(); return;
        case 'tosauth': st.tosAuth = true; go('tos'); return;
        case 'logoutask': st.confirm = 'logout'; render(); return;
        case 'logout': var keepFx = fx; fresh('signup'); fx = keepFx; st.signin = true; render(true); return;
        /* onboarding */
        case 'accept': st.genreFrom = 'onboard'; go('genre'); return;
        case 'genre': st.genres[arg] = !st.genres[arg]; render(); return;
        case 'genre-done': if (st.genreFrom === 'profile') back(); else go('nft'); return;
        case 'pgenres': st.genreFrom = 'profile'; go('genre'); return;
        case 'nft-next': tab('home'); return;
        /* browsing */
        case 'manga': st.manga = arg; st.descOpen = false; go('manga'); return;
        case 'list': st.list = { kind: arg, tab: 0 }; go('list'); return;
        case 'ltab': st.list.tab = +arg; render(true); return;
        case 'library': tab('library'); return;
        case 'search': st.search = { q: '', scope: arg }; go('search'); var sq = app.querySelector('[data-k="q"]'); if (sq) sq.focus({ preventScroll: true }); return;
        case 'scope': st.search.scope = arg; render(); var s2 = app.querySelector('[data-k="q"]'); if (s2) s2.focus({ preventScroll: true }); return;
        case 'clearq': st.search.q = ''; render(); return;
        case 'follow':
          st.follow[arg] = st.follow[arg] ? 0 : 1;
          if (fx.follow) toast(st.follow[arg] ? 'Added to your Library' : 'Removed from your Library'); else render();
          return;
        case 'libtab': st.libTab = +arg; render(true); return;
        case 'coll': st.collOpen = !st.collOpen; render(); return;
        case 'cfilter': st.collFilter = arg; render(); return;
        case 'faq': st.faq[arg] = !st.faq[arg]; render(); return;
        case 'txtab': st.txTab = +arg; render(true); return;
        case 'coins': st.sheet = null; go('coins'); return;
        case 'buy':
          var pk = (fx.packs ? PACKS2 : PACKS1)[+arg || 0], got = pk.c + pk.b;
          st.coins += got; st.lastBuy = got; st.bought.unshift({ c: pk.c, b: pk.b, p: pk.p, d: stamp() }); st.view = 'coinsdone'; render(true); return;
        case 'coinsdone': st.view = st.stack.pop() || 'home'; render(); return;
        /* settings */
        case 'rs-style': st.rs.style = arg; render(); return;
        case 'rs-dir': st.rs.dir = +arg; render(); return;
        case 'rs-q': st.rs.quality = arg; render(); return;
        /* manga page */
        case 'desc': st.descOpen = !st.descOpen; render(); return;
        case 'tip': st.sheet = 'tip'; st.tip = { item: null, amount: fx.tipsafe ? 0 : (Math.min(3000, st.coins) || 1000), edit: false }; render(); return;
        case 'titem': var ti = null; TIPS.forEach(function (x) { if (x.id === arg) ti = x; }); st.tip.item = arg; st.tip.amount = tipPrice(ti); st.tip.edit = false; render(); return;
        case 'tedit': st.tip.edit = !st.tip.edit; st.tip.item = null; render(); var am = app.querySelector('[data-k="amount"]'); if (am) { am.focus(); am.select(); } return;
        case 'tipgo':
          var amt = st.tip.amount;
          if (amt > st.coins) { st.sheet = null; go('coins'); return; }
          st.coins -= amt; st.tipped += amt;
          var it = null; TIPS.forEach(function (x) { if (x.id === st.tip.item) it = x; });
          st.spent.unshift({ t: T[st.manga].t, s: it ? 'Tip · ' + it.n : 'Tip', d: stamp(), c: amt });
          st.sheet = null; st.done = { item: it && it.id, name: it && it.n, amount: amt }; render(); return;
        case 'chapters': st.sheet = 'chapters'; render(); return;
        case 'pick': st.chapter = +arg; render(); return;
        case 'read': openChapter(st.chapter); return;
        case 'chap': st.sheet = null; openChapter(+arg); return;
        case 'unlockall':
          var cost = 0; for (var c1 = 1; c1 <= CH_TOTAL; c1++) if (!st.unlocked[c1]) cost += CH_PRICE;
          st.sheet = null; if (cost > st.coins) { go('coins'); return; }
          st.coins -= cost; for (var c2 = 1; c2 <= CH_TOTAL; c2++) st.unlocked[c2] = 1; render(); return;
        /* reader */
        case 'pagetap': pageTap(el, evt); return;
        case 'pg': turn(+arg); return;
        case 'panel': st.panel = st.panel === arg ? null : arg; render(); return;
        case 'rtag': case 'rsave': st.tag = !st.tag; render(); return;
        case 'like': st.liked = !st.liked; render(); return;
        case 'coach': st.coachSeen = true; render(); return;
        case 'nextch': openChapter(st.chapter + 1); return;
        case 'endback': st.end = false; st.page = PAGES; render(); return;
        case 'unlock':
          if (st.coins < CH_PRICE) { go('coins'); return; }
          st.coins -= CH_PRICE; st.unlocked[st.chapter] = 1;
          st.spent.unshift({ t: 'Prince of Lan Ling', s: 'Chapter  ' + st.chapter, d: stamp(), c: CH_PRICE });
          st.locked = false; st.page = 1; render(); return;
      }
    }
    function afterAuth() { if (fx.terms) { st.genreFrom = 'onboard'; go('genre'); } else if (st.signin && !fx.auth) tab('home'); else go('welcome'); }
    function openChapter(k) {
      st.chapter = k; st.page = 1; st.end = false; st.panel = null; st.ui = true;
      st.locked = !st.unlocked[k];
      if (st.view === 'reader') render(); else go('reader');
    }
    function turn(d) {
      var p = st.page + d;
      if (p < 1) return;
      if (p > PAGES) { st.end = true; st.panel = null; render(); return; }
      st.page = p; render();
    }
    function pageTap(el, e) {
      var r = el.getBoundingClientRect(), vertical = st.rs.style === 'custom' && st.rs.dir >= 2;
      var pos = vertical ? (e.clientY - r.top) / r.height : (e.clientX - r.left) / r.width, t = Date.now();
      if (st.rs.dtz && t - lastTap < 300) { el.classList.toggle('is-zoom'); lastTap = 0; return; }
      lastTap = t;
      var rtl = st.rs.style === 'custom' && st.rs.dir === 1;
      if (pos < 0.3) turn(rtl ? 1 : -1);
      else if (pos > 0.7) turn(rtl ? -1 : 1);
      else { st.ui = !st.ui; st.panel = null; render(); }
    }

    /* ----------------------------------------------------------- inputs */
    function onInput(e) {
      var t = e.target, k = t.getAttribute('data-k');
      if (!k) return;
      if (k === 'email') st.email = t.value;
      else if (k === 'otp') {
        st.otp = t.value.replace(/\D/g, '').slice(0, 4);
        if (fx.otp && st.otp.length === 4) { render(); setTimeout(function () { if (st.view === 'signup' && st.otp.length === 4) { clearInterval(timer); afterAuth(); } }, 350); return; }
      }
      else if (k === 'q') st.search.q = t.value;
      else if (k === 'amount') {
        st.tip.amount = Math.max(0, parseInt(t.value, 10) || 0);
        var b = app.querySelector('[data-act="tipgo"]');
        if (b) { b.disabled = !(st.tip.amount > 0); if (fx.tipsafe) b.textContent = st.tip.amount > st.coins ? 'Get more coins' : st.tip.amount ? 'Tip ' + n(st.tip.amount) + ' coins' : 'Pick a gift'; }
        return;
      }
      else if (k === 'bright') { st.bright = +t.value; var pg = app.querySelector('.tr-page'); if (pg) pg.style.filter = 'brightness(' + (0.45 + st.bright / 100 * 0.6).toFixed(2) + ')'; return; }
      else if (k === 'page') st.page = +t.value;
      else if (k === 'dtz') st.rs.dtz = t.checked;
      else return;
      render();
    }

    /* ------------------------------------------------- jump + flows list */
    var FLOWS = [
      ['signup', 'sign up', 'otp code, timer, continue'], ['onboard', 'onboarding', 'terms, genres, nfts'], ['home', 'home', 'updates, picks, top series'],
      ['search', 'search', 'type “chain”, or nonsense'], ['library', 'library', 'following, downloaded, history'], ['collect', 'collectables', 'nfts and their rarity'],
      ['profile', 'profile', 'settings, faq, purchases'], ['manga', 'manga page', 'follow, chapters, tip'], ['reader', 'reader', 'tap the edges to turn pages'],
      ['locked', 'locked chapter', 'unlock with coins'], ['coins', 'buy coins', 'top up the balance']
    ];
    function jump(k) {
      clearTimeout(splashT); clearInterval(timer);
      var keep = st ? { coins: st.coins, follow: st.follow, unlocked: st.unlocked, spent: st.spent, bought: st.bought, tipped: st.tipped } : null;
      fresh('home');
      if (keep) for (var x in keep) st[x] = keep[x];
      if (k === 'signup') st.view = 'signup';
      else if (k === 'onboard') st.view = fx.terms ? 'genre' : 'welcome';
      else if (k === 'genre') st.view = 'genre';
      else if (k === 'nft') st.view = 'nft';
      else if (k === 'search') { st.stack = ['home']; st.view = 'search'; }
      else if (k === 'library' || k === 'collect' || k === 'profile' || k === 'home') st.view = k;
      else if (k === 'manga') { st.stack = ['home']; st.view = 'manga'; }
      else if (k === 'top') { st.stack = ['home']; st.view = 'list'; st.list = { kind: 'top', tab: 0 }; }
      else if (k === 'tip') { st.stack = ['home']; st.view = 'manga'; st.sheet = 'tip'; st.tip = { item: null, amount: fx.tipsafe ? 0 : Math.min(3000, st.coins), edit: false }; }
      else if (k === 'reader') { st.stack = ['home', 'manga']; st.view = 'reader'; st.page = 1; }
      else if (k === 'end') { st.stack = ['home', 'manga']; st.view = 'reader'; st.end = true; st.coachSeen = true; }
      else if (k === 'locked') { st.stack = ['home', 'manga']; st.view = 'reader'; st.chapter = 4; st.unlocked[4] = 0; st.locked = true; }
      else if (k === 'coins') { st.stack = ['profile']; st.view = 'coins'; }
      render(true);
      if (k === 'search') { var sq = app.querySelector('[data-k="q"]'); if (sq) sq.focus({ preventScroll: true }); }
    }
    function flowKey() {
      var v = st.view;
      if (v === 'signup' || v === 'splash') return 'signup';
      if (v === 'welcome' || v === 'genre' || v === 'nft') return st.genreFrom === 'profile' ? 'profile' : 'onboard';
      if (v === 'home' || v === 'list') return 'home';
      if (v === 'search' || v === 'library' || v === 'collect' || v === 'manga' || v === 'coins') return v;
      if (v === 'coinsdone') return 'coins';
      if (v === 'profile' || v === 'faq' || v === 'help' || v === 'tos' || v === 'rsettings' || v === 'tx') return 'profile';
      if (v === 'reader') return st.locked ? 'locked' : 'reader';
      return '';
    }
    function syncFlows() {
      if (!flowsEl) return;
      var k = flowKey();
      flowsEl.querySelectorAll('button[data-flow]').forEach(function (b) { b.setAttribute('aria-current', String(b.getAttribute('data-flow') === k)); });
    }
    function startOver() {
      clearTimeout(splashT); clearInterval(timer); fresh('splash'); render(true);
      splashT = setTimeout(function () { if (st.view === 'splash') { st.view = 'signup'; render(true); } }, 1600);
    }

    /* ------------------------------------------------------------ mount */
    function fit() {
      var W = 390 + 24, H = 844 + 24, wrap = fig.querySelector('.tr-wrap'), side = opts.flows && window.innerWidth > 760 ? 300 : 0;
      var avail = (opts.fitWidth ? opts.fitWidth() : wrap.clientWidth - side);
      var s = Math.min(1, avail / W, Math.max(0.45, (window.innerHeight - 150) / H));
      if (s !== scale) { scale = s; phone.style.transform = 'scale(' + s + ')'; }
      stage.style.height = Math.round(H * s) + 'px';
      stage.style.width = Math.round(W * s) + 'px';
    }
    function mount() {
      fresh('splash');
      var fb = fig.querySelector('.tr-fallback'); if (fb) fb.remove();
      var wrap = document.createElement('div');
      wrap.className = 'tr-wrap' + (opts.flows ? '' : ' is-solo');
      wrap.innerHTML = '<div class="tr-stagewrap"><div class="tr-stage"><div class="tr-phone"><div class="tr-app" role="group" aria-label="Trophee Reader prototype"></div></div></div></div>' +
        (opts.flows ? '<div class="tr-flows">' + (opts.reel ? '<div class="tr-reel"><span class="tr-reel__dot"></span><span class="tr-reel__t"></span><button type="button" class="tr-reel__b"></button></div>' : '') + '<div class="tr-flows__h">working prototype — jump to</div><div class="tr-flows__l">' + FLOWS.map(function (f) {
          return '<button type="button" data-flow="' + f[0] + '"><b>' + f[1] + '</b><span>' + f[2] + '</span></button>';
        }).join('') + '</div><button type="button" class="tr-flows__reset">start again</button></div>' : '');
      fig.insertBefore(wrap, fig.querySelector('figcaption'));
      stage = wrap.querySelector('.tr-stage'); phone = wrap.querySelector('.tr-phone'); app = wrap.querySelector('.tr-app'); flowsEl = wrap.querySelector('.tr-flows');

      app.addEventListener('click', function (e) {
        var b = e.target.closest('[data-act]');
        if (!b || b.disabled || !app.contains(b)) return;
        if (b.tagName === 'LABEL' || b.tagName === 'INPUT') return;
        e.preventDefault();
        act(b.getAttribute('data-act'), b, e);
      });
      app.addEventListener('input', onInput);
      app.addEventListener('change', function (e) { if (e.target.type === 'checkbox') onInput(e); });
      app.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && (st.sheet || st.done || st.confirm)) { st.sheet = null; st.done = null; st.confirm = null; render(); }
        if (st.view === 'reader' && !st.sheet && !/INPUT/.test(e.target.tagName)) { if (e.key === 'ArrowRight') turn(1); else if (e.key === 'ArrowLeft') turn(-1); }
        if (e.key === 'Enter' && e.target.getAttribute('data-k') === 'q') e.preventDefault();
      });
      if (flowsEl) flowsEl.addEventListener('click', function (e) {
        var b = e.target.closest('button'); if (!b) return;
        if (b.classList.contains('tr-reel__b')) { if (reel.on) reelStop(); else reelStart(); return; }
        reelStop();
        if (b.classList.contains('tr-flows__reset')) startOver(); else jump(b.getAttribute('data-flow'));
      });
      fit();
      window.addEventListener('resize', fit);
      if ('ResizeObserver' in window) new ResizeObserver(fit).observe(fig);
      if (opts.reel) {
        touch = document.createElement('i');
        touch.className = 'tr-touch';
        touch.setAttribute('aria-hidden', 'true');
        phone.appendChild(touch);
        /* a real tap on the phone hands it over to the visitor */
        app.addEventListener('pointerdown', function (e) { if (e.isTrusted && reel.on) reelStop(); }, true);
        app.addEventListener('keydown', function (e) { if (e.isTrusted && reel.on) reelStop(); }, true);
        document.addEventListener('visibilitychange', syncPause);
        var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduced) { startOver(); reelUI(); } else reelStart();
      } else if (opts.start) jump(opts.start); else startOver();
    }

    /* ---------------------------------------------------------- showreel
       Drives the real app through its flows: a touch dot moves to each
       control and taps it. Pauses off-screen; any real tap takes over. */
    /* next frame, with a timer fallback so the reel can't stall where frames aren't painted */
    function nextFrame(cb) { var done = false; var go = function () { if (!done) { done = true; cb(performance.now()); } }; requestAnimationFrame(go); setTimeout(go, 50); }
    function syncPause() {
      var r = stage.getBoundingClientRect(), vh = window.innerHeight || 800;
      reel.visible = r.bottom > vh * 0.15 && r.top < vh * 0.85 && r.width > 0;
      reel.paused = !reel.visible || document.hidden;
    }
    function reelUI() {
      if (!flowsEl) return;
      var box = flowsEl.querySelector('.tr-reel'); if (!box) return;
      box.classList.toggle('is-on', reel.on);
      box.querySelector('.tr-reel__t').textContent = reel.on ? 'showreel playing — tap the phone to take over' : 'you’re driving';
      box.querySelector('.tr-reel__b').textContent = reel.on ? 'stop' : 'play showreel';
    }
    function reelStart() {
      reel.on = true; reel.token++; clearTimeout(splashT); clearInterval(timer);
      reelUI();
      var t = reel.token;
      (async function loop() {
        while (reel.on && t === reel.token) {
          try { await script(); } catch (e) { if (e !== 'stop') { reelStop(); return; } }
        }
      })();
    }
    function reelStop() {
      if (!reel.on) return;
      reel.on = false; reel.token++;
      if (touch) touch.className = 'tr-touch';
      reelUI();
    }
    function wait(ms) {
      var t = reel.token;
      return new Promise(function (res, rej) {
        var left = ms, last = Date.now();
        (function tick() {
          if (t !== reel.token) return rej('stop');
          syncPause();
          var now = Date.now();
          if (!reel.paused) left -= now - last;
          last = now;
          if (left <= 0) res(); else setTimeout(tick, 40);
        })();
      });
    }
    function find(sel) { var el = typeof sel === 'string' ? app.querySelector(sel) : sel; if (!el) throw 'stop'; return el; }
    function point(el, fx2, fy2) {
      var pr = phone.getBoundingClientRect(), r = el.getBoundingClientRect();
      var cx = r.left + r.width * (fx2 == null ? 0.5 : fx2), cy = r.top + r.height * (fy2 == null ? 0.5 : fy2);
      return { cx: cx, cy: cy, x: (cx - pr.left) / scale, y: (cy - pr.top) / scale };
    }
    async function moveTo(el, fx2, fy2) {
      var p = point(el, fx2, fy2);
      touch.style.transform = 'translate(' + p.x.toFixed(1) + 'px,' + p.y.toFixed(1) + 'px)';
      touch.classList.add('is-on');
      await wait(560);
      return point(el, fx2, fy2);
    }
    async function tap(sel, fx2, fy2) {
      var el = find(sel), p = await moveTo(el, fx2, fy2);
      touch.classList.remove('is-tap'); void touch.offsetWidth; touch.classList.add('is-tap');
      await wait(160);
      el = find(sel);
      el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, clientX: p.cx, clientY: p.cy }));
      await wait(220);
    }
    async function type(k, text) {
      await tap('[data-k="' + k + '"]', 0.3);
      for (var i = 1; i <= text.length; i++) {
        var el = find('[data-k="' + k + '"]');
        el.value = text.slice(0, i);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        await wait(55 + Math.random() * 70);
      }
    }
    async function swipe(sel, dy, ms) {
      var el = find(sel), from = el.scrollTop, t0 = null, paused = 0, pausedAt = 0;
      var p = point(el, 0.62, dy > 0 ? 0.72 : 0.32), toY = p.y - dy * 0.35 / 1;
      touch.style.transform = 'translate(' + p.x.toFixed(1) + 'px,' + p.y.toFixed(1) + 'px)';
      touch.classList.add('is-on', 'is-drag');
      await wait(450);
      touch.style.transition = 'transform ' + ms + 'ms cubic-bezier(.45,0,.25,1), opacity .25s';
      touch.style.transform = 'translate(' + p.x.toFixed(1) + 'px,' + Math.max(40, Math.min(800, p.y - Math.sign(dy) * 180)).toFixed(1) + 'px)';
      void toY;
      var t = reel.token;
      await new Promise(function (res, rej) {
        (function frame(now) {
          if (t !== reel.token) return rej('stop');
          syncPause();
          if (reel.paused) { if (!pausedAt) pausedAt = now; return nextFrame(frame); }
          if (pausedAt) { paused += now - pausedAt; pausedAt = 0; }
          if (t0 === null) t0 = now;
          var k = Math.min(1, (now - t0 - paused) / ms), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
          var cur = app.querySelector(typeof sel === 'string' ? sel : '.tr-scroll');
          if (cur) cur.scrollTop = from + dy * e;
          if (k >= 1) res(); else nextFrame(frame);
        })(performance.now());
      });
      touch.style.transition = '';
      touch.classList.remove('is-drag');
      await wait(250);
    }
    async function script() {
      var keepFx = fx;
      fresh('splash'); fx = keepFx; touch.className = 'tr-touch'; render(true);
      await wait(1800);
      st.view = 'signup'; render(true); await wait(700);
      /* sign up */
      await type('email', 'reader@trophee.xyz');
      await tap('[data-act="getcode"]'); await wait(900);
      await type('otp', '3748'); await wait(400);
      await tap('[data-act="continue"]'); await wait(900);
      /* onboarding */
      if (st.view === 'welcome') { await swipe('.tr-terms', 160, 1100); await tap('[data-act="accept"]'); await wait(700); }
      await tap('[data-act="genre:Fantasy"]'); await wait(250);
      await tap('[data-act="genre:Horror"]'); await wait(500);
      await tap('.tr-genre__f .tr-cta'); await wait(900);
      await tap('[data-act="nft-next"]'); await wait(1100);
      /* home → manga page → tip */
      await swipe('.tr-scroll', 560, 1700); await wait(700);
      await swipe('.tr-scroll', -560, 1200); await wait(300);
      await tap('.tr-row [data-act="manga:prince"]'); await wait(1000);
      await swipe('.tr-scroll', 330, 1200); await wait(400);
      await tap('[data-act="tip"]'); await wait(800);
      await tap('[data-act="titem:bento"]'); await wait(500);
      await tap('[data-act="tipgo"]'); await wait(1700);
      await tap('.tr-modal__x'); await wait(600);
      /* read */
      await tap('[data-act="chapters"]'); await wait(900);
      await tap('[data-act="chap:3"]'); await wait(1000);
      for (var i = 0; i < 3; i++) { await tap('.tr-page', 0.86, 0.45); await wait(650); }
      await tap('.tr-page', 0.5, 0.45); await wait(1100);
      await tap('.tr-page', 0.5, 0.45); await wait(500);
      st.page = PAGES; render(); await wait(500);
      await tap('.tr-page', 0.86, 0.45); await wait(1500);
      await tap('[data-act="nextch"]'); await wait(1400);
      await tap('[data-act="unlock"]'); await wait(1300);
      /* the rest of the app */
      await tap('.tr-rhead [data-act="back"]'); await wait(700);
      await tap('.tr-hero__b'); await wait(800);
      await tap('[data-act="tab:library"]'); await wait(1000);
      await tap('[data-act="libtab:2"]'); await wait(1000);
      await tap('[data-act="tab:collect"]'); await wait(800);
      await swipe('.tr-scroll', 520, 1500); await wait(400);
      await tap('[data-act="tab:profile"]'); await wait(1000);
      await tap('.tr-coinpill'); await wait(900);
      await tap('[data-act="buy:1"]'); await wait(1500);
      await tap('.tr-shop__done'); await wait(1200);
      touch.classList.remove('is-on');
      await wait(1200);
    }

    fig.__tr = {
      jump: function (k) { jump(k); },
      setFx: function (map) { setFx(map); render(); },
      reset: function () { startOver(); },
      view: function () { return st.view; },
      reel: function () { return reel.on; },
      reelState: function () { return { on: reel.on, paused: reel.paused }; }
    };
    if (opts.lazy) {
      var started = false;
      var check = function () {
        if (started) return;
        var r = fig.getBoundingClientRect();
        if (r.top < window.innerHeight + 600 && r.bottom > -600) { started = true; window.removeEventListener('scroll', check); mount(); }
      };
      window.addEventListener('scroll', check, { passive: true });
      check();
    } else mount();
  }

  figs.forEach(function (fig) {
    var fxAttr = (fig.getAttribute('data-fx') || '').trim(), map = {};
    (fxAttr === 'all' ? FX_ALL : fxAttr === 'visual' ? FX_VISUAL : fxAttr ? fxAttr.split(/\s*,\s*/) : []).forEach(function (k) { map[k] = true; });
    create(fig, { fx: map, reel: fig.getAttribute('data-reel') === 'on', flows: fig.getAttribute('data-flows') !== 'off', lazy: fig.getAttribute('data-lazy') !== 'off', start: fig.getAttribute('data-start') || null });
  });
  window.TropheeFX = { all: FX_ALL, visual: FX_VISUAL, ux: FX_UX };
})();
