/* Ani! case study — the app rebuilt as a working phone prototype from the
   Ani! design file (Desktop/Portfolio/Ani!/visual assets/ANI Anime Social
   Media) and the App Store screenshots, shown as a scroll-driven tour.
   Interface in HTML/CSS; artwork cut from the frames into assets/img/ani/ by
   _build/ani-assets.sh, with the baked-in titles and buttons lifted out so
   they are drawn here as text. Placeholder content in the frames (lorem
   ipsum, a UI-kit designer's profile, photo avatars) is swapped for anime
   characters.

   Markup: <section class="an-tour"> holds .an-tour__phone (the phone mounts
   there) and an <ol> of .an-step[data-step]. The step in the middle of the
   screen (on phones: the card in view) drives the phone through its demo; a
   real tap on the phone hands it over. Screens are patched in place
   (morphChildren), so only what changed moves; a new screen slides in.
   tour.__an exposes { step(id), dark(on), state(), view(), demo() } for testing. */
(function () {
  'use strict';

  var tours = document.querySelectorAll('.an-tour');
  if (!tours.length) return;

  var SRC = (document.currentScript && document.currentScript.src) || '';
  var IMG = SRC ? SRC.replace(/js\/ani-app\.js.*$/, 'img/ani/') : '../assets/img/ani/';
  var REDUCED = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var PACE = 0.8; /* demos run a little quicker than real time */
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function img(n, cls, alt, style) {
    return '<img class="' + (cls || '') + '" src="' + IMG + n + '.webp" alt="' + esc(alt || '') + '" draggable="false"' + (style ? ' style="' + style + '"' : '') + '>';
  }

  /* --------------------------------------------------------------- icons */
  var S = function (p, cls) { return '<svg viewBox="0 0 24 24" aria-hidden="true"' + (cls ? ' class="' + cls + '"' : '') + '>' + p + '</svg>'; };
  var I = {
    back: S('<path d="M15 4.5 7.5 12l7.5 7.5"/>'),
    book: S('<path d="M12 6.6C9.6 5 6.6 4.7 3.5 5.6v13c3.1-.9 6.1-.6 8.5 1M12 6.6c2.4-1.6 5.4-1.9 8.5-1v13c-3.1-.9-6.1-.6-8.5 1M12 6.6v13"/><path d="M6.4 9.3h2.8M6.4 12h2.8"/>'),
    chat: S('<path d="M6.2 4.5h11.6a2.7 2.7 0 0 1 2.7 2.7v7.6a2.7 2.7 0 0 1-2.7 2.7h-3.6L12 19.8l-2.2-2.3H6.2a2.7 2.7 0 0 1-2.7-2.7V7.2a2.7 2.7 0 0 1 2.7-2.7z"/><circle class="f" cx="8.4" cy="11" r="1"/><circle class="f" cx="12" cy="11" r="1"/><circle class="f" cx="15.6" cy="11" r="1"/>'),
    search: S('<circle cx="11" cy="11" r="7.6"/><circle cx="19.6" cy="19.6" r="1.25"/>'),
    compose: S('<path d="M11.5 4.5H7.6a3.1 3.1 0 0 0-3.1 3.1v8.8a3.1 3.1 0 0 0 3.1 3.1h8.8a3.1 3.1 0 0 0 3.1-3.1v-3.9"/><path d="M17.7 3.9a1.8 1.8 0 0 1 2.5 2.5L13 13.6l-3.3.8.8-3.3z"/>'),
    bookmark: S('<path d="M7.3 4.2h9.4a.8.8 0 0 1 .8.8v14.6l-5.5-3.7-5.5 3.7V5a.8.8 0 0 1 .8-.8z"/>'),
    comment: S('<path d="M6.5 4.5h11a2.5 2.5 0 0 1 2.5 2.5v7a2.5 2.5 0 0 1-2.5 2.5h-6l-3.8 3.1v-3.1H6.5A2.5 2.5 0 0 1 4 14V7a2.5 2.5 0 0 1 2.5-2.5z"/><path d="M8.3 8.9h7.4M8.3 12h4.4"/>'),
    plane: S('<path d="M20.5 3.5 3.5 10.6l6.6 2.8 2.8 6.6z"/><path d="m20.5 3.5-10.4 9.9"/>'),
    heart: S('<path d="M12 19.6s-7.6-4.5-7.6-10.2A4.3 4.3 0 0 1 12 6.8a4.3 4.3 0 0 1 7.6 2.6c0 5.7-7.6 10.2-7.6 10.2z"/>'),
    nodes: S('<circle cx="12" cy="6" r="2.1"/><circle cx="5.8" cy="17" r="2.1"/><circle cx="18.2" cy="17" r="2.1"/><path d="M10.9 7.9 6.9 15M13.1 7.9l4 7.1M8 17h8"/>'),
    dots: S('<circle class="f" cx="6" cy="12" r="1.6"/><circle class="f" cx="12" cy="12" r="1.6"/><circle class="f" cx="18" cy="12" r="1.6"/>'),
    image: S('<rect x="3.5" y="5" width="14.5" height="14.5" rx="3.2"/><path d="m4.2 17.3 4.2-4.4 3.4 3.3 2-1.9 3.6 3.5"/><circle cx="13.2" cy="9.6" r="1.4"/><path d="M19.8 2.6v5M17.3 5.1h5"/>'),
    at: S('<circle cx="12" cy="12" r="3.6"/><path d="M15.6 9v4.2a2.4 2.4 0 0 0 4.8 0V12A8.4 8.4 0 1 0 17 18.7"/>'),
    member: S('<circle cx="12" cy="7.6" r="3.4"/><rect x="6" y="13.4" width="12" height="6.6" rx="3.3"/>'),
    flag: S('<path d="M6.5 20.5v-16M6.5 5h10.8l-2.6 4 2.6 4H6.5"/>'),
    close: S('<circle cx="12" cy="12" r="9"/><path d="m9 9 6 6m0-6-6 6"/>'),
    down: S('<path d="m6.5 9.5 5.5 5.5 5.5-5.5"/>'),
    pen: S('<path d="M15.6 5.2a2.1 2.1 0 0 1 3 3L8.4 18.4l-4 1 1-4z"/><path d="m13.8 7 3 3"/>'),
    star: S('<path d="m12 3.6 2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z"/>'),
    starOn: S('<path class="f" d="m12 3.6 2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z"/>'),
    bell: S('<path d="M6.5 16.5V11a5.5 5.5 0 0 1 11 0v5.5l1.5 1.5h-14z"/><path d="M10 20.2a2.2 2.2 0 0 0 4 0"/>'),
    trash: S('<path d="M4.5 7h15M9.5 7V4.8h5V7M6.5 7l.9 12.2h9.2L17.5 7M10.2 10.6v5.2M13.8 10.6v5.2"/>'),
    x: S('<path d="m7 7 10 10M17 7 7 17"/>'),
    hex: S('<path d="M12 3.2 19.6 7.6v8.8L12 20.8l-7.6-4.4V7.6z"/><circle cx="12" cy="12" r="2.8"/>'),
    menu: S('<path d="M4.5 7h15M4.5 12h15M4.5 17h15"/>'),
    grid: S('<rect x="4" y="4" width="7" height="9.5" rx="1.6"/><rect x="13" y="4" width="7" height="5.5" rx="1.6"/><rect x="13" y="11.5" width="7" height="8.5" rx="1.6"/><rect x="4" y="15.5" width="7" height="4.5" rx="1.6"/>'),
    gridOn: S('<rect class="f" x="4" y="4" width="7" height="9.5" rx="1.6"/><rect class="f" x="13" y="4" width="7" height="5.5" rx="1.6"/><rect class="f" x="13" y="11.5" width="7" height="8.5" rx="1.6"/><rect class="f" x="4" y="15.5" width="7" height="4.5" rx="1.6"/>'),
    reel: S('<rect x="3.8" y="3.8" width="16.4" height="16.4" rx="4.2"/><circle cx="12" cy="12" r="4.4"/><path class="f" d="m10.9 10.2 2.9 1.8-2.9 1.8z"/>'),
    quote: S('<path class="f" d="M6.2 7.2h4.3v4.3c0 3-1.4 5-4.1 5.6l-.6-1.5c1.4-.5 2.2-1.6 2.3-3H6.2zm7.3 0h4.3v4.3c0 3-1.4 5-4.1 5.6l-.6-1.5c1.4-.5 2.2-1.6 2.3-3h-1.9z"/>'),
    home: S('<path d="M5 10.4 12 4.6l7 5.8v8.2a1.9 1.9 0 0 1-1.9 1.9H6.9A1.9 1.9 0 0 1 5 18.6z"/><path d="M12 16.2v3"/>'),
    homeOn: S('<path class="f" d="M4.6 10.1 12 4l7.4 6.1v8.6a2.2 2.2 0 0 1-2.2 2.2H6.8a2.2 2.2 0 0 1-2.2-2.2zm6.6 6.1v3.2h1.6v-3.2a.8.8 0 0 0-1.6 0z"/>'),
    tracker: S('<path d="M7.4 6.2h10.4a1.6 1.6 0 0 1 1.6 1.9l-2.1 10.7a2 2 0 0 1-2 1.6H5.2a1.6 1.6 0 0 1-1.6-1.9L5.7 7.8a2 2 0 0 1 1.7-1.6z"/><path d="M9.4 4v3.4M15 4v3.4M8.6 11.5h7M8 14.8h4.6"/>'),
    trackerOn: S('<path class="f" d="M7.4 6.2h10.4a1.6 1.6 0 0 1 1.6 1.9l-2.1 10.7a2 2 0 0 1-2 1.6H5.2a1.6 1.6 0 0 1-1.6-1.9L5.7 7.8a2 2 0 0 1 1.7-1.6z"/><path class="w" d="M8.6 11.5h7M8 14.8h4.6"/><path d="M9.4 4v3.4M15 4v3.4"/>'),
    add: S('<rect x="4" y="4" width="16" height="16" rx="4.4"/><path d="M12 8.4v7.2M8.4 12h7.2"/>'),
    person: S('<circle cx="12" cy="7.8" r="3.6"/><ellipse cx="12" cy="17.3" rx="6.6" ry="3.4"/>'),
    personOn: S('<circle class="f" cx="12" cy="7.8" r="3.8"/><ellipse class="f" cx="12" cy="17.3" rx="6.8" ry="3.6"/>'),
    check: S('<path d="m5 12.6 4.3 4.3L19 7.2"/>'),
    filter: S('<path d="M4.5 8h9M17.5 8h2M4.5 16h2M10.5 16h9"/><circle class="f" cx="15.5" cy="8" r="2"/><circle class="f" cx="8.5" cy="16" r="2"/>'),
    list: S('<path d="M9 7.5h10M9 12h10M9 16.5h10"/><circle class="f" cx="5.4" cy="7.5" r="1.2"/><circle class="f" cx="5.4" cy="12" r="1.2"/><circle class="f" cx="5.4" cy="16.5" r="1.2"/>'),
    tiles: S('<rect x="4" y="4" width="7" height="7" rx="1.8"/><rect x="13" y="4" width="7" height="7" rx="1.8"/><rect x="4" y="13" width="7" height="7" rx="1.8"/><rect x="13" y="13" width="7" height="7" rx="1.8"/>'),
    verified: '<svg viewBox="0 0 24 24" aria-hidden="true" class="an-verified"><path class="f" d="M12 2.5l2.3 1.7 2.9-.1.9 2.7 2.3 1.7-.9 2.7.9 2.7-2.3 1.7-.9 2.7-2.9-.1L12 21.5l-2.3-1.7-2.9.1-.9-2.7-2.3-1.7.9-2.7-.9-2.7 2.3-1.7.9-2.7 2.9.1z"/><path class="w" d="m8.6 12.2 2.3 2.3 4.6-4.7"/></svg>',
    heartFill: '<svg viewBox="0 0 24 24" aria-hidden="true" class="an-heart-on"><path class="f" d="M12 20.2s-8.2-4.8-8.2-10.9A4.6 4.6 0 0 1 12 6.5a4.6 4.6 0 0 1 8.2 2.8c0 6.1-8.2 10.9-8.2 10.9z"/></svg>',
    burst: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.2s-8.2-4.8-8.2-10.9A4.6 4.6 0 0 1 12 6.5a4.6 4.6 0 0 1 8.2 2.8c0 6.1-8.2 10.9-8.2 10.9z"/></svg>'
  };

  /* ---------------------------------------------------------------- data
     People and posts are anime characters, as in the frames. */
  var P = {
    me: { n: 'Naruto Uzumaki', h: 'Naruto_Uzumaki', av: 'av-naruto' },
    killua: { n: 'Killua', h: 'chains', av: 'av-killua-l', on: true },
    deadeyes: { n: 'DeadEyes', h: 'deadeyes', av: 'av-deadeyes' },
    midori: { n: 'Midori', h: 'midori', av: 'av-midori' },
    frankie: { n: 'Frankie', h: 'frankie', av: 'av-frankie' },
    queen: { n: 'Queen', h: 'queen', av: 'av-queen' },
    fan87: { n: 'AnimeFan87', h: 'animefan87', av: 'av-fan87' },
    kiki: { n: 'Kiki', h: 'kiki', av: 'av-kiki' },
    mona: { n: 'Mona', h: 'mona', av: 'av-mona' },
    joey: { n: 'Joey', h: 'joey', av: 'av-joey' },
    anya: { n: 'Anya', h: 'anyaforger', av: 'av-anya' },
    yor: { n: 'Yor', h: 'thornprincess', av: 'av-yor' },
    loid: { n: 'Loid Forger', h: 'twilight', av: 'av-loid' },
    chibi: { n: 'Boruto', h: 'boruto', av: 'av-chibi' },
    blond: { n: 'Katsuki', h: 'katsuki', av: 'av-blond' },
    green: { n: 'Izuku', h: 'deku', av: 'av-green' },
    dark: { n: 'Levi', h: 'levi', av: 'av-dark' },
    eren: { n: 'Eren Jaeger', h: 'AttackTitan', av: 'av-eren' },
    fan27: { n: 'AnimeFan27', h: 'animefan27', av: 'av-fan27' },
    animelove: { n: 'Anime<3', h: 'anime', av: 'av-animelove', v: true },
    makima: { n: 'Chainsaw', h: 'makima', av: 'av-makima' },
    ani: { n: 'Ani', h: 'ani', av: 'av-ani', v: true }
  };
  var STORIES = ['killua', 'deadeyes', 'midori', 'frankie', 'queen', 'kiki', 'mona'];
  var FEED = [
    { id: 'p1', type: 'art', by: 'fan27', sub: 'Tokyo, JP', art: 'art-tsuyu' },
    { id: 'p2', type: 'text', by: 'animelove', t: '1h', l: 1, x: 'FINALLY an app that supports AniManga creators and a team that listen to its users. This app is quite literally peak. If you’re an AniManga fan even if you’re just new to the scene you HAVE to download Ani.' },
    { id: 'p3', type: 'art', by: 'makima', sub: 'Makima', art: 'art-makima' },
    { id: 'p4', type: 'text', by: 'me', t: '23h', l: 57, x: 'Ichiraku after training, who’s in? 🍜 And no spoilers in the chatroom tonight, some of us are still on episode 9.' }
  ];
  var CMT = {
    p1: { n: 23, list: [
      { f: 'fan27', cr: 1, x: 'took me three nights but she’s finally done 🐸', d: '07-08', l: 41 },
      { f: 'kiki', x: 'the eyes 😭', d: '07-08', l: 12, tag: 'liked' },
      { f: 'midori', x: 'Tsuyu supremacy', d: '07-08', l: 8, rep: 2 },
      { f: 'frankie', x: 'frame this. actually.', d: '07-07', l: 5 } ] },
    p2: { n: 1, list: [{ f: 'ani', x: 'This made our week. Thank you 🙏', d: '07-09', l: 9, tag: 'liked' }] },
    p3: { n: 41, list: [
      { f: 'makima', cr: 1, x: 'No reposting without credit please 🙏', d: '07-06', l: 63 },
      { f: 'deadeyes', x: 'the freckles!!!', d: '07-06', l: 22, tag: 'liked' },
      { f: 'joey', x: 'she’d win every argument', d: '07-05', l: 3, rep: 4 } ] },
    p4: { n: 14, list: [
      { f: 'chibi', x: 'I’m in!! extra pork', d: '07-08', l: 6 },
      { f: 'killua', x: 'episode 9 people we see you 👀', d: '07-08', l: 4, tag: 'liked' } ] },
    spy: { n: 134, list: [
      { f: 'anya', cr: 1, x: 'YOOOO LETS GOOOO SPYXFAMILY WE UP!', d: '07-07', l: 34, rep: 2, tag: 'flagged' },
      { f: 'yor', x: 'Another Season Of Fun and Adventure !😂', d: '07-07', l: 34, tag: 'liked' },
      { f: 'loid', x: 'The mission has to be completed.', d: '07-07', l: 80, rep: 8 },
      { f: 'chibi', x: 'I cannot wait!', d: '07-06', l: 50 } ] },
    aot: { n: 88, list: [
      { f: 'eren', cr: 1, x: 'Tatakae.', d: '07-07', l: 120 },
      { f: 'loid', x: 'Strong take, honestly', d: '07-07', l: 14, tag: 'liked' },
      { f: 'mona', x: 'Levi > Eren and it’s not close', d: '07-06', l: 31, rep: 3 } ] },
    titan: { n: 212, list: [
      { f: 'eren', cr: 1, x: 'no comment', d: '07-07', l: 300 },
      { f: 'frankie', x: 'the MOM part 💀💀', d: '07-07', l: 96, tag: 'liked' },
      { f: 'queen', x: 'spoiler tags people!!', d: '07-07', l: 18, tag: 'flagged' } ] }
  };
  var GENERIC = { n: 27, list: [
    { f: 'queen', x: 'saving this for later', d: '07-07', l: 12 },
    { f: 'fan87', x: 'agreed, 100%', d: '07-06', l: 4, tag: 'liked' },
    { f: 'kiki', x: 'the comments are going to be a war zone 💀', d: '07-06', l: 9, rep: 3 } ] };
  var TOP = [
    { id: 'spy', art: 'art-spy', x: 'Spy x Family Season 2 Is Officially Happening', by: 'anya', t: '1h', mode: 'full', pos: '50% 40%', ink: true },
    { id: 'aot', art: 'news-aot', cov: 'news-aot-top', x: 'Attack On Titan’s Eren Yeager Is Now Anime’s Most Interesting Protagonist', by: 'eren', t: '2h', mode: 'cover' },
    { id: 'titan', art: 'news-titan', cov: 'news-titan-top', x: 'Ah nah Eren really wild for what he did... to his MOM!?', by: 'eren', t: '2h', mode: 'cover' }
  ];
  var NEWS = [
    { id: 'smt', art: 'news-smt', x: 'Shin Megami Tensei V Is An Amazing Game', by: 'Demon Summon', h: 'AtalaShin', t: '2h', cat: 'Games' },
    { id: 'psyche', art: 'news-psyche', x: 'This Anime Will Break Your Psyche', by: 'Mima', h: 'perfectblue', t: '5h', cat: 'Anime' },
    { id: 'csm', art: 'disc-csm', x: 'Chainsaw Man’s Opening Is A Whole Movie', by: 'Denji', h: 'pochita', t: '6h', cat: 'Anime' },
    { id: 'ds', art: 'disc-ds', x: 'Every Demon Slayer Fight, Ranked', by: 'Tanjiro', h: 'kamado', t: '1d', cat: 'Manga' },
    { id: 'eva', art: 'disc-eva', x: 'Rewatching Evangelion Before The Finale', by: 'Misato', h: 'nerv', t: '2d', cat: 'Anime' }
  ];
  var CATS = ['Popular', 'Anime', 'Manga', 'Games', 'Recent'];
  var FEAT = [
    { id: 'flcl', art: 'disc-flcl', t: 'FLCL', r: '8.13' },
    { id: 'spyf', art: 'art-spy-poster', t: 'Spy x Family', r: '8.52', pos: '50% 24%' },
    { id: 'naruto', art: 'art-naruto', t: 'Naruto', r: '7.95', pos: '50% 30%' }
  ];
  var AIRING = [
    { id: 'csm', art: 'disc-csm', t: 'Chainsaw Man', r: '8.93' },
    { id: 'eva', art: 'disc-eva', t: 'Evangelion: 4.0', r: '7.01' },
    { id: 'ds', art: 'disc-ds', t: 'Demon Slayer', r: '7.21' },
    { id: 'spy', art: 'art-spy-poster', t: 'Spy x Family', r: '8.52' }
  ];
  var POPULAR = [
    { id: 'rezero', art: 'art-rezero', t: 'Re:Zero', r: '8.26' },
    { id: 'mha', art: 'art-tsuyu', t: 'My Hero Academia', r: '7.88' },
    { id: 'steins', art: 'art-steins', t: 'Steins;Gate', r: '9.09' },
    { id: 'violet', art: 'art-violet', t: 'Violet Evergarden', r: '8.65' }
  ];
  /* title pages: the layout is my 2021 MyAnimeList anime page (cover, score,
     facts, genres, description, recommendations, edit button), in Ani!'s
     style. Facts are the shows' real ones; the synopses are mine. */
  var SHOWS = {
    flcl: { type: 'OVA', when: 'Spring 2000', ep: 6, min: 25, g: ['Action', 'Comedy', 'Sci-Fi'],
      d: 'Naota is twelve and sure nothing ever happens in his small town. Then Haruko rides in on a Vespa and hits him over the head with a bass guitar. Something starts growing out of the bump, and before long giant robots are climbing out of it, with Naota stuck in the middle.' },
    spy: { type: 'TV', when: 'Spring 2022', ep: 12, min: 24, g: ['Action', 'Comedy'],
      d: 'A spy needs a family for his next mission, so he puts one together: a daughter from an orphanage and a wife from a quick arrangement. Anya can secretly read minds, Yor is secretly an assassin, and none of them know the others’ secrets.' },
    naruto: { type: 'TV', when: 'Fall 2002', ep: 220, min: 23, g: ['Action', 'Adventure', 'Fantasy'],
      d: 'Naruto Uzumaki is the loudest kid in the Hidden Leaf Village and the one everyone keeps away from, because a nine-tailed fox is sealed inside him. He means to become Hokage, the village’s leader, and make every one of them look at him.' },
    csm: { type: 'TV', when: 'Fall 2022', ep: 12, min: 24, g: ['Action', 'Horror', 'Fantasy'],
      d: 'Denji is buried in his late father’s debt and hunts devils for the yakuza with Pochita, his chainsaw-dog. When he’s betrayed and killed, Pochita fuses with him, and Denji wakes up with chainsaws for a head and arms.' },
    eva: { type: 'Movie', when: '2021', ep: 1, min: 155, g: ['Action', 'Drama', 'Sci-Fi'],
      d: 'The last of the Rebuild of Evangelion films. Shinji, Asuka and Rei cross a ruined Japan before the final fight with NERV, and with Shinji’s father, closing the story that started in 1995.' },
    ds: { type: 'TV', when: 'Spring 2019', ep: 26, min: 23, g: ['Action', 'Fantasy'],
      d: 'Tanjiro comes home to find his family killed by a demon and his little sister Nezuko turned into one. He joins the Demon Slayer Corps to find a way to turn her back, and the demon who did it.' },
    rezero: { type: 'TV', when: 'Spring 2016', ep: 25, min: 25, g: ['Drama', 'Fantasy', 'Suspense'],
      d: 'Subaru is pulled out of a convenience store and into a fantasy world with no powers at all, except one he finds out the hard way: when he dies, time rewinds to a fixed point, and he 19s the only one who remembers.' },
    mha: { type: 'TV', when: 'Spring 2016', ep: 13, min: 24, g: ['Action', 'Comedy'],
      d: 'In a world where most people are born with a superpower, Izuku Midoriya got none. He still wants to be a hero, and one day All Might, the hero he looks up to most, picks him to inherit his.' },
    steins: { type: 'TV', when: 'Spring 2011', ep: 24, min: 24, g: ['Drama', 'Sci-Fi', 'Suspense'],
      d: 'Okabe calls himself a mad scientist. He and his friends turn a microwave into a machine that can send text messages into the past, and every message changes the present a little. Then the wrong people find out what the machine can do.' },
    violet: { type: 'TV', when: 'Winter 2018', ep: 13, min: 24, g: ['Drama', 'Fantasy'],
      d: 'The war is over and Violet, who knew nothing but fighting, takes a job writing letters for people who can 19t put their feelings into words. Letter by letter, she tries to understand the last thing her major said to her.' }
  };
  SHOWS.spyf = SHOWS.spy;
  var STATUS = ['Watching', 'Completed', 'Dropped', 'Plan to Watch', 'On Hold'];
  function show(id) { var x = null; FEAT.concat(AIRING, POPULAR).forEach(function (s) { if (!x && s.id === id) x = s; }); return x; }
  var ROOMS = [
    { id: 'official', n: 'Ani Official Chatroom', m: '10.2k', ban: 'room-official', by: 'ani', who: ['ani', 'queen', 'fan87'], rules: 'Be kind, keep spoilers out of the main room, no 18+.' },
    { id: 'demon', n: 'Demon Slayer Club', m: '500', ban: 'room-demon', by: 'kamado', who: ['green', 'kiki'], rules: 'Manga spoilers only after the anime airs. Breathe.' },
    { id: 'art', n: 'Art Chatroom!', m: '40', ban: 'room-art', tall: 'room-art-tall', by: 'Attacktitan', who: ['blond', 'kiki', 'midori'], rules: 'Respect the host, No inappropriate comment or spam, No 18+, Only pg13' },
    { id: 'night', n: 'Night Riders', m: '100', ban: 'room-night', by: 'nightrider', who: ['frankie', 'mona'], rules: 'Late-night watch parties. Respect the host, no spam.' },
    { id: 'friends', n: 'Come Make Friends!', m: '15', ban: 'room-friends', by: 'kiki', who: ['kiki', 'mona'], rules: 'Say hi, be nice, no 18+. That’s it.' },
    { id: 'leaf', n: 'The Hidden Leaf Village', m: '54', ban: 'room-leaf', by: 'hokage7', who: ['chibi', 'killua'], rules: 'Naruto and Boruto talk. Fillers are allowed here.' },
    { id: 'club', n: 'Official Anime Club Chatroom', m: '600', ban: 'room-club', by: 'animeclub', who: ['fan87', 'queen'], rules: 'Weekly watch list on Fridays. No spam, no 18+.' },
    { id: 'eyes', n: 'Spicy Eyes Only', m: '10', ban: 'room-eyes', by: 'deadeyes', who: ['deadeyes'], rules: 'Eye studies and close-ups only. Credit the artist.' },
    { id: 'music', n: 'Otaku Music Lovers Only!!!', m: '1.2k', ban: 'room-music', by: 'mikuu', who: ['joey', 'mona'], rules: 'Openings, endings, covers. Share the link, not the file.' }
  ];
  var DMS = [
    { id: 'killua', time: '14:28', x: 'Killua is typing...' },
    { id: 'deadeyes', time: 'Yesterday', x: 'I thought it was you, lol' },
    { id: 'midori', time: 'Yesterday', x: 'Let’s watch anime together...' },
    { id: 'frankie', time: 'Friday', x: 'Whats up, it’s Frankie. 😏' },
    { id: 'queen', time: '07/21/2023', x: 'Done, 😏' },
    { id: 'fan87', time: '07/18/2023', x: 'Lemme join ur chatroom, buddy' },
    { id: 'kiki', time: '07/18/2023', x: 'I love this anime so much!' },
    { id: 'mona', time: '07/12/2023', x: 'YEOOOO, ARE U KIDDING?!' },
    { id: 'joey', time: '07/12/2023', x: 'Haha, yes!!' }
  ];
  var DAY = 'Today, July 15';
  var THREADS = {
    killua: [{ d: DAY },
      { f: 'killua', x: 'Did you watch episode 1?', t: '3:18 PM' },
      { f: 'me', x: 'Hold On...' }, { f: 'me', x: 'Done, I just finished it!' }, { f: 'me', x: '😂😂', t: '3:19 PM' },
      { f: 'killua', x: 'It was WILD right?!' }, { f: 'killua', x: 'The main character is a badass', t: '3:20 PM' },
      { f: 'me', x: 'No way, lol' }, { f: 'me', x: 'I think the female cast is better imo 😎', t: '3:20 PM' },
      { f: 'killua', pics: ['dm-pic1', 'dm-pic2', 'dm-pic3'] }, { f: 'killua', x: 'Such a simp 💀', t: '3:21 PM' },
      { f: 'me', x: 'Shut up bro you would too lol', t: '3:22 PM' }],
    deadeyes: [{ d: 'Yesterday' }, { f: 'deadeyes', x: 'wait were you at the con on saturday?', t: '6:02 PM' },
      { f: 'me', x: 'the one with the giant Gojo balloon? yeah 😅', t: '6:05 PM' }, { f: 'deadeyes', x: 'I thought it was you, lol', t: '6:06 PM' }],
    midori: [{ d: 'Yesterday' }, { f: 'midori', x: 'Let’s watch anime together this weekend? I’ll bring snacks', t: '9:40 PM' }],
    frankie: [{ d: 'Friday' }, { f: 'frankie', x: 'Whats up, it’s Frankie. 😏', t: '1:15 PM' }],
    queen: [{ d: 'July 21' }, { f: 'me', x: 'can you add me to the watch list for friday?', t: '7:30 PM' }, { f: 'queen', x: 'Done, 😏', t: '7:31 PM' }],
    fan87: [{ d: 'July 18' }, { f: 'fan87', x: 'Lemme join ur chatroom, buddy', t: '4:44 PM' }],
    kiki: [{ d: 'July 18' }, { f: 'me', x: 'finished Frieren last night', t: '11:02 AM' }, { f: 'kiki', x: 'I love this anime so much!', t: '11:03 AM' }],
    mona: [{ d: 'July 12' }, { f: 'me', x: 'I haven’t seen Evangelion', t: '8:12 PM' }, { f: 'mona', x: 'YEOOOO, ARE U KIDDING?!', t: '8:12 PM' }],
    joey: [{ d: 'July 12' }, { f: 'me', x: 'ramen later?', t: '2:20 PM' }, { f: 'joey', x: 'Haha, yes!!', t: '2:21 PM' }],
    official: [{ d: DAY }, { f: 'ani', x: 'Welcome to Ani! 👋 Fan art goes in Art Chatroom!, spoilers stay out of this one.', t: '9:00 AM' },
      { f: 'fan87', x: 'first!!', t: '9:02 AM' }, { f: 'queen', x: 'the news tab is so good', t: '9:05 AM' }, { f: 'me', x: 'dark mode looks so good ngl', t: '9:06 AM' }],
    demon: [{ d: DAY }, { f: 'green', x: 'the swordsmith arc fights though', t: '1:10 PM' }, { f: 'kiki', x: 'Mitsuri carried', t: '1:12 PM' }],
    art: [{ d: DAY }, { f: 'kiki', x: 'Did you watch episode 1?', t: '3:18 PM' }, { f: 'blond', x: 'It was WILD right?!', t: '3:20 PM' },
      { f: 'green', x: 'The main character is a badass', t: '3:20 PM' }, { f: 'midori', x: 'the female cast tho 😎', t: '3:20 PM' }, { f: 'dark', x: 'Such a simp 💀', t: '3:21 PM' }],
    night: [{ d: DAY }, { f: 'frankie', x: 'who’s up for a One Piece marathon tonight', t: '11:48 PM' }, { f: 'mona', x: 'meeee', t: '11:49 PM' }, { f: 'me', x: 'starting from Enies Lobby, no arguments', t: '11:50 PM' }],
    friends: [{ d: DAY }, { f: 'mona', x: 'new here! what’s everyone watching?', t: '10:01 AM' }, { f: 'kiki', x: 'welcome!! Frieren, obviously', t: '10:03 AM' }],
    leaf: [{ d: DAY }, { f: 'chibi', x: 'Ramen at Ichiraku after this?', t: '6:10 PM' }, { f: 'me', x: 'Believe it 🍜', t: '6:11 PM' }],
    club: [{ d: DAY }, { f: 'queen', x: 'Friday’s pick: Cowboy Bebop, episodes 1 to 5', t: '5:00 PM' }, { f: 'fan87', x: 'see you space cowboy', t: '5:02 PM' }],
    eyes: [{ d: DAY }, { f: 'deadeyes', x: 'posted a new eye study in Art Chatroom!', t: '2:12 PM' }],
    music: [{ d: DAY }, { f: 'joey', x: 'the Chainsaw Man endings, all twelve, ranked. go', t: '12:30 PM' }]
  };
  var REPLIES = {
    killua: ['SAME. Friday can’t come fast enough', 'lmaooo fair'], deadeyes: ['hahaha', 'next con we’re going together'],
    art: ['Drop it here when it’s done!!', 'can’t wait 👀'], official: ['👋👋', 'welcome!'], night: ['real', 'I’m in'],
    leaf: ['Believe it!!'], _dm: ['hiii! 👋 love your posts', 'heyy, what are you watching?'], _: ['😂😂', 'real', 'hahaha yes']
  };
  var GRID = ['art-tsuyu', 'art-makima', 'disc-flcl', 'news-titan', 'room-art-tall', 'dm-pic3'];
  var NEWPEOPLE = ['anya', 'yor', 'loid', 'blond'];
  var minute = 22;
  function now() { minute = Math.min(59, minute + 1); return '3:' + minute + ' PM'; }
  function copy(o) { return JSON.parse(JSON.stringify(o)); }
  function btn(act, html, cls, label, extra) {
    return '<button type="button" class="' + (cls || '') + '" data-act="' + act + '"' + (label ? ' aria-label="' + esc(label) + '"' : '') + (extra || '') + '>' + html + '</button>';
  }
  function av(id, cls) { var p = P[id] || P.me; return img(p.av, 'an-av ' + (cls || ''), ''); }

  /* ---------------------------------------------------------- patching
     A new render is laid over the screen node by node: same tag and same
     data-key keep the node (and its scroll, focus, image, running
     animation); only changed attributes and text are touched. Nodes marked
     .an-fx (a like burst) are left alone. */
  function isFx(n) { return n && n.nodeType === 1 && n.classList.contains('an-fx'); }
  function skipFx(n) { while (n && isFx(n)) n = n.nextSibling; return n; }
  function keyOf(n) { return n && n.nodeType === 1 ? n.getAttribute('data-key') : null; }
  function syncAttrs(a, b) {
    for (var i = a.attributes.length - 1; i >= 0; i--) { var n = a.attributes[i].name; if (!b.hasAttribute(n)) a.removeAttribute(n); }
    for (var j = 0; j < b.attributes.length; j++) { var at = b.attributes[j]; if (a.getAttribute(at.name) !== at.value) a.setAttribute(at.name, at.value); }
    if (a.tagName === 'INPUT') { var v = b.getAttribute('value') || ''; if (a.value !== v) a.value = v; }
  }
  function morphChildren(from, to) {
    var keyed = {};
    for (var c = from.firstChild; c; c = c.nextSibling) { var kk = keyOf(c); if (kk) keyed[kk] = c; }
    var cur = skipFx(from.firstChild), next = to.firstChild;
    while (next) {
      var after = next.nextSibling, k = keyOf(next), m = null;
      if (k) { m = keyed[k] || null; if (m && m.tagName !== next.tagName) m = null; }
      else if (cur && !keyOf(cur) && cur.nodeType === next.nodeType && (cur.nodeType !== 1 || cur.tagName === next.tagName)) m = cur;
      if (m) {
        if (m === cur) cur = skipFx(cur.nextSibling); else from.insertBefore(m, cur);
        if (k) delete keyed[k];
        if (m.nodeType === 1) { syncAttrs(m, next); if (m.tagName !== 'INPUT') morphChildren(m, next); }
        else if (m.nodeValue !== next.nodeValue) m.nodeValue = next.nodeValue;
      } else from.insertBefore(next, cur);
      next = after;
    }
    while (cur) { var nx = skipFx(cur.nextSibling); from.removeChild(cur); cur = nx; }
  }

  /* --------------------------------------------------------------- app */
  function create(tour) {
    var st, app, phone, stage, stackEl, statusEl, toastEl, kbEl, touch, ctl, scale = 1, toastT, replyT = [], scrollMem = {};
    var demo = { on: false, token: 0, paused: false };
    var mounted = false, baseDark = false, stepDark = false, activeStep = null, lastUser = 0, closing = false;
    var steps = Array.prototype.slice.call(tour.querySelectorAll('.an-step[data-step]'));
    var wide = window.matchMedia('(min-width: 900px)');

    function fresh() {
      replyT.forEach(clearTimeout); replyT = []; minute = 22;
      var rooms = {}, dms = {};
      ROOMS.forEach(function (r) { rooms[r.id] = { joined: false, unread: 0, at: 0 }; });
      rooms.official = { joined: true, unread: '99+', at: 100 };
      rooms.night = { joined: true, unread: '99+', at: 97 };
      rooms.leaf = { joined: true, unread: 0, at: 93 };
      rooms.eyes = { joined: true, unread: 0, at: 89 };
      var order = { killua: 99, deadeyes: 98, midori: 96, frankie: 95, queen: 94, fan87: 92, kiki: 91, mona: 90, joey: 88 };
      DMS.forEach(function (d) { dms[d.id] = { at: order[d.id], unread: d.id === 'killua' ? 1 : d.id === 'deadeyes' ? 13 : 0 }; });
      var cm = {}; for (var k in CMT) cm[k] = withIds(k, CMT[k]);
      st = {
        view: 'home', stack: [], tab: 'home', sheet: null, modal: null,
        liked: {}, saved: { 'n:spy': true }, seen: {}, cm: cm, cliked: {}, burst: null,
        cat: 'Popular', story: null, watching: {}, entry: {}, anime: null, descOpen: false, gridView: false, feat: 0,
        itab: 0, rooms: rooms, dms: dms, threads: copy(THREADS), chat: null, typing: { killua: true }, typingRoom: null,
        draft: {}, empty: false, mine: [], follow: {}, muted: {}, hidden: {}, actSeen: false, listOf: null, set: { notif: true, spoil: true, priv: false, auto: true }, me: { n: P.me.n, role: 'Hokage', bio: '🍥 Hokage of the Hidden Leaf | 🍜 Ichiraku regular' }, ptab: 0, clock: 101, toBottom: false, cid: 0
      };
      scrollMem = {}; closing = false;
    }
    function withIds(key, src) { var c = copy(src); c.list.forEach(function (m, i) { m.id = key + '-' + i; }); return c; }
    function go(view, patch) {
      st.stack.push(st.view); st.view = view; st.sheet = null; st.modal = null;
      if (patch) for (var k in patch) st[k] = patch[k];
      render('push');
    }
    function back() {
      if (st.sheet || st.modal) { closeOverlay(); return; }
      st.view = st.stack.length ? st.stack.pop() : st.tab;
      render('pop');
    }
    function tab(v) { if (st.view === v && !st.stack.length) return; if (st.tab === 'activity' && v !== 'activity') st.actSeen = true; st.stack = []; st.view = v; st.tab = v; st.sheet = null; st.modal = null; render('tab'); }

    /* ------------------------------------------------------------ pieces */
    function icons(list) {
      var map = { news: [I.book, 'go:news', 'News'], inbox: [I.chat, 'go:inbox', 'Messages'], search: [I.search, 'go:search', 'Search'], compose: [I.compose, 'compose', 'New message'] };
      return '<span class="an-icons">' + list.map(function (k) { var m = map[k]; return btn(m[1], m[0], 'an-ib', m[2]); }).join('') + '</span>';
    }
    function tabbar() {
      var t = st.tab;
      var items = [['home', I.home, I.homeOn, 'Home', 'tab:home'], ['discover', I.tracker, I.trackerOn, 'Tracker', 'tab:discover'], ['add', I.add, I.add, 'New post', 'post'], ['activity', I.heart, I.heartFill, 'Activity', 'tab:activity'], ['profile', I.person, I.personOn, 'Profile', 'tab:profile']];
      return '<nav class="an-tabbar is-' + t + '">' + items.map(function (x) {
        var on = t === x[0];
        return btn(x[4], (on ? x[2] : x[1]) + (x[0] === 'activity' && !on && !st.actSeen && st.set.notif ? '<i class="an-tabbar__dot"></i>' : ''), on ? 'is-on' : '', x[3], on ? ' aria-current="page"' : '');
      }).join('') + '</nav>';
    }
    function heartBtn(on) { return on ? I.heartFill : I.heart; }

    /* ------------------------------------------------------------- views */
    var V = {};
    V.home = function () {
      var stories = '<div class="an-stories" data-kx="stories"><div class="an-story is-me"><span class="an-story__r">' + av('me') + '<b>+</b></span><span>Your Story</span></div>' +
        STORIES.map(function (id) { return btn('story:' + id, '<span class="an-story__r' + (st.seen[id] ? ' is-seen' : '') + '">' + av(id) + '</span><span>' + esc(P[id].n.toLowerCase()) + '</span>', 'an-story', P[id].n + '’s story'); }).join('') + '</div>';
      return '<div class="an-col">' + '<header class="an-head an-head--card"><i class="an-logo" role="img" aria-label="Ani!"></i>' + icons(['news', 'inbox', 'search']) + '</header>' +
        '<div class="an-scroll" data-k="scroll-home">' + stories + st.mine.concat(FEED).map(post).join('') +
        '<p class="an-end">' + I.check + 'You’re all caught up</p></div>' + tabbar() + '</div>';
    };
    function post(p) {
      var by = P[p.by];
      if (p.type === 'art') {
        return '<article class="an-art" data-key="' + p.id + '" data-dbl="' + p.id + '">' + img(p.art, 'an-art__img', 'Fan art posted by ' + by.n) +
          '<span class="an-chip">' + av(p.by) + '<span><b>' + esc(by.n) + '</b><small>' + esc(p.sub) + '</small></span></span>' +
          btn('save:' + p.id, I.bookmark, 'an-sq' + (st.saved[p.id] ? ' is-on' : ''), st.saved[p.id] ? 'Saved' : 'Save') +
          '<span class="an-art__acts">' + btn('cmts:' + p.id, I.comment, 'an-circ', 'Comments') + btn('share', I.plane, 'an-circ', 'Share') +
          btn('like:' + p.id, heartBtn(st.liked[p.id]), 'an-likepill' + (st.liked[p.id] ? ' is-on' : ''), st.liked[p.id] ? 'Unlike' : 'Like') + '</span></article>';
      }
      var l = p.l + (st.liked[p.id] ? 1 : 0), c = st.cm[p.id].n;
      return '<article class="an-post" data-key="' + p.id + '"><header>' + av(p.by) + '<p><b>' + esc(by.n) + (by.v ? I.verified : '') + '</b><span>@' + esc(by.h) + '</span><i>•</i><span>' + p.t + '</span></p></header>' +
        '<p class="an-post__x">' + esc(p.x) + '</p><footer>' + btn('cmts:' + p.id, I.comment + '<span>' + c + '</span>', 'an-pact', 'Comments') +
        btn('like:' + p.id, heartBtn(st.liked[p.id]) + '<span>' + l + '</span>', 'an-pact' + (st.liked[p.id] ? ' is-on' : ''), 'Like') + btn('share', I.nodes, 'an-pact', 'Share') + '</footer></article>';
    }
    function comments(key, over) {
      var c = st.cm[key], shut = over ? 'close' : 'back';
      return '<section class="an-sheet' + (over ? ' is-over' : '') + '" role="dialog" aria-label="Comments"><header class="an-sheet__h"><b>' + c.n + ' Comments</b>' + btn(shut, I.close, 'an-sheet__x', 'Close') + '</header>' +
        '<div class="an-scroll an-cmts" data-k="scroll-cm-' + key + '">' + c.list.map(function (m) {
          var p = P[m.f], lk = st.cliked[m.id];
          return '<div class="an-cmt' + (m.fresh ? ' is-new' : '') + '" data-key="' + m.id + '">' + av(m.f) + '<div><p class="an-cmt__n">' + esc(p.n) + (m.cr ? ' <i>•</i> <em>Creator</em>' : '') + '</p><p class="an-cmt__x">' + esc(m.x) + '</p>' +
            '<p class="an-cmt__m"><span>' + m.d + '</span><b>Reply</b></p>' + (m.rep ? '<p class="an-cmt__r">View replies (' + m.rep + ')' + I.down + '</p>' : '') + '</div>' +
            (m.tag ? '<span class="an-tag">' + (m.tag === 'flagged' ? I.flag + 'Flagged' : 'Liked By creator') + '</span>' : '') +
            btn('clike:' + m.id, heartBtn(lk) + '<span>' + (m.l + (lk ? 1 : 0)) + '</span>', 'an-cmt__l' + (lk ? ' is-on' : ''), 'Like comment') + '</div>';
        }).join('') + '<div class="an-gap"></div></div>' +
        '<footer class="an-cbar">' + av('me') + '<label class="an-field' + (st.draft.cmt ? ' has-text' : '') + '"><input data-k="cmt" placeholder="Write your opinion" value="' + esc(st.draft.cmt || '') + '" aria-label="Write a comment" autocomplete="off" enterkeyhint="send">' +
        '<span class="an-field__i">' + I.image + I.at + '</span>' + btn('csend', I.plane, 'an-send', 'Post comment') + '</label></footer></section>';
    }
    V.news = function () {
      var list = NEWS.filter(function (n) { return st.cat === 'Popular' || n.cat === st.cat || (st.cat === 'Recent' && /h$/.test(n.t)); });
      return '<div class="an-col">' + '<header class="an-head">' + btn('back', I.back, 'an-ib', 'Back') + icons(['news', 'inbox', 'search']) + '</header>' +
        '<div class="an-scroll" data-k="scroll-news"><div class="an-title"><h3>Trending News</h3>' + btn('filter', I.filter, 'an-ib', 'Filter') + '</div>' +
        '<div class="an-cards" data-kx="cards">' + TOP.filter(function (n) { return !st.hidden[n.id]; }).map(function (n) {
          var p = P[n.by], sv = st.saved['n:' + n.id];
          return '<div class="an-ncard">' + btn('story:' + n.id, img(n.art, 'an-ncard__img', '', n.pos ? 'object-position:' + n.pos : '') + '<span class="an-ncard__glass"></span><span class="an-ncard__t">' + esc(n.x) + '</span>' +
            '<span class="an-ncard__by">' + av(n.by) + '<b>' + esc(p.n) + '</b><span>@' + esc(p.h) + '</span><i>•</i><span>' + n.t + '</span></span>', 'an-ncard__open', n.x) +
            btn('nsave:' + n.id, I.bookmark, 'an-ncard__save' + (sv ? ' is-on' : ''), sv ? 'Saved' : 'Save') + btn('more:' + n.id, I.dots, 'an-ncard__more', 'More') + '</div>';
        }).join('') + '</div>' +
        '<div class="an-cats" data-kx="cats">' + CATS.map(function (c) { return btn('cat:' + c, c, st.cat === c ? 'is-on' : ''); }).join('') + '</div>' +
        '<div class="an-nlist">' + list.map(function (n) {
          return '<div class="an-nwrap" data-key="n-' + n.id + '">' + btn('story:' + n.id, img(n.art, 'an-nitem__img', '') + '<span class="an-nitem__b"><b>' + esc(n.x) + '</b><small>Written By</small><span><em>' + esc(n.by) + '</em> @' + esc(n.h) + ' <i>•</i> ' + n.t + '</span></span>' +
            '<i class="an-nitem__dots">' + I.dots + '</i>', 'an-nitem', n.x) + '</div>';
        }).join('') + '</div><div class="an-gap an-gap--tab"></div></div>' + tabbar() + '</div>';
    };
    function story() { var n = null; TOP.concat(NEWS).forEach(function (x) { if (x.id === st.story) n = x; }); return n; }
    V.story = function () {
      var n = story(), key = n.id;
      if (!st.cm[key]) st.cm[key] = withIds(key, CMT[key] || GENERIC);
      var art = n.mode === 'full' ? img(n.cov || n.art, 'an-sv__img', '', n.pos ? 'object-position:' + n.pos : '')
        : '<span class="an-sv__blur">' + img(n.cov || n.art, '', '') + '</span>' + img(n.cov || n.art, 'an-sv__cover', '');
      var sv = st.saved['n:' + n.id];
      return '<div class="an-col an-sv">' + art + btn('nsave:' + n.id, I.bookmark, 'an-sv__save' + (sv ? ' is-on' : ''), sv ? 'Saved' : 'Save') +
        btn('back', 'Skip', 'an-sv__skip', 'Skip') + comments(key, false) + '</div>';
    };
    /* a poster: tap opens the title page, press and hold for quick add */
    function poster(x, pre) {
      var on = st.watching[x.id];
      return btn('peek:' + x.id, img(x.art, '', '', x.pos ? 'object-position:' + x.pos : '') + '<span class="an-poster__r">' + x.r + '</span><b>' + esc(x.t) + '</b>' +
        (on ? '<i class="an-poster__on">' + I.check + '</i>' : ''), 'an-poster' + (on ? ' is-on' : ''), x.t + (on ? ', on your list' : ''), ' data-key="' + (pre || '') + x.id + '" data-hold="' + x.id + '"');
    }
    function posters(list) { return list.map(function (x) { return poster(x); }).join(''); }
    V.discover = function () {
      return '<div class="an-col">' + '<header class="an-head"><i class="an-logo" role="img" aria-label="Ani!"></i>' + icons(['news', 'inbox', 'search']) + '</header>' +
        '<div class="an-scroll" data-k="scroll-discover"><div class="an-title"><h3>Discover</h3><span class="an-views__seg">' +
        btn('view:list', I.list, st.gridView ? '' : 'is-on', 'Rows') + btn('view:grid', I.tiles, st.gridView ? 'is-on' : '', 'Grid') + '</span></div>' +
        '<div class="an-feat" data-kx="feat">' + FEAT.map(function (x) {
          return btn('peek:' + x.id, img(x.art, '', '', x.pos ? 'object-position:' + x.pos : '') + '<b>' + esc(x.t) + '<small>' + x.r + '</small></b>' + (st.watching[x.id] ? '<i class="an-poster__on">' + I.check + '</i>' : ''), 'an-feat__c', x.t + (st.watching[x.id] ? ', on your list' : ''), ' data-key="f-' + x.id + '" data-hold="' + x.id + '"');
        }).join('') + '</div><p class="an-dots">' + FEAT.map(function (x, i) { return '<i' + (i === st.feat ? ' class="is-on"' : '') + '></i>'; }).join('') + '<i></i><i></i></p>' +
        '<div class="an-sec"><h4>Currently Airing</h4>' + btn('all:airing', 'Show more', 'an-more') + '</div><div class="an-posters' + (st.gridView ? ' is-grid' : '') + '" data-kx="airing">' + posters(AIRING) + '</div>' +
        '<div class="an-sec"><h4>Popular</h4>' + btn('all:popular', 'Show more', 'an-more') + '</div><div class="an-posters' + (st.gridView ? ' is-grid' : '') + '" data-kx="popular">' + posters(POPULAR) + '</div>' +
        '<div class="an-gap an-gap--tab"></div></div>' + tabbar() + '</div>';
    };

    /* the title page, from my 2021 MyAnimeList anime page */
    function epText(s) { return s.ep > 1 ? s.ep + ' ep, ' + s.min + ' min' : s.min + ' min'; }
    function listLine(id, s) {
      var e = st.entry[id];
      if (!st.watching[id] || !e) return '<span class="an-ap__list">Not on your list</span>';
      return '<span class="an-ap__list is-on">' + I.check + '<span>' + esc(e.status) + (s.ep > 1 ? ' · ' + e.ep + '/' + s.ep : '') + (e.score ? ' · ★ ' + e.score : '') + '</span></span>';
    }
    function recsFor(id) {
      var all = FEAT.concat(AIRING, POPULAR), seen = {}, out = [];
      seen[id] = true; if (id === 'spy' || id === 'spyf') seen.spy = seen.spyf = true;
      all.forEach(function (r) { if (!seen[r.id] && !(r.id === 'spyf' && seen.spy)) { seen[r.id] = true; if (r.id === 'spy') seen.spyf = true; out.push(r); } });
      var k = all.map(function (r) { return r.id; }).indexOf(id) % out.length;
      return out.slice(k).concat(out.slice(0, k)).slice(0, 5);
    }
    V.anime = function () {
      var id = st.anime, x = show(id), s = SHOWS[id], open = !!(st.sheet && st.sheet.type === 'edit'), listed = !!st.watching[id];
      var pos = x.pos ? 'object-position:' + x.pos : '';
      return '<div class="an-col an-ap">' +
        '<div class="an-scroll" data-k="scroll-anime">' +
          '<div class="an-ap__hero"><span class="an-ap__bg">' + img(x.art, '', '', pos) + '</span>' +
            '<svg class="an-ap__wave" viewBox="0 0 390 120" preserveAspectRatio="none" aria-hidden="true"><path d="M0 120V70C80 102 150 106 220 72S330 12 390 4v116z"/></svg>' +
            '<span class="an-ap__cover">' + img(x.art, '', x.t, pos) + '</span>' +
            '<div class="an-ap__side"><h3>' + esc(x.t) + '</h3><p class="an-ap__score">' + I.starOn + '<b>' + x.r + '</b></p>' + listLine(id, s) + '</div></div>' +
          '<p class="an-ap__facts"><span>' + s.type + '</span><i></i><span>' + s.when + '</span><i></i><span>' + epText(s) + '</span></p>' +
          '<div class="an-ap__genres" data-kx="genres">' + s.g.map(function (g) { return '<span>' + g + '</span>'; }).join('') + '</div>' +
          '<div class="an-sec"><h4>Description</h4></div>' +
          '<p class="an-ap__desc' + (st.descOpen ? ' is-open' : '') + '">' + esc(s.d) + '</p>' +
          btn('desc', I.down, 'an-ap__more' + (st.descOpen ? ' is-open' : ''), st.descOpen ? 'Show less' : 'Read more') +
          '<div class="an-sec"><h4>Recommendations</h4></div>' +
          '<div class="an-posters" data-kx="recs">' + recsFor(id).map(function (r) { return poster(r, 'r-'); }).join('') + '</div>' +
          '<div class="an-gap" style="height:150px"></div>' +
        '</div>' +
        btn('back', I.back, 'an-ap__ib is-back', 'Back') + btn('share', I.plane, 'an-ap__ib is-share', 'Share') +
        (open ? editCard(id, s) : '') +
        btn(open ? 'close' : 'edit', I.pen + I.down, 'an-ap__fab' + (open ? ' is-open' : '') + (listed ? ' is-listed' : ''), open ? 'Close' : (listed ? 'Edit your list entry' : 'Add to your list'), ' data-key="fab"') +
        '</div>';
    };
    function editCard(id, s) {
      var d = st.sheet, max = s.ep, nums = [], i, t = show(id).t;
      for (i = 0; i <= max; i++) nums.push(i);
      var scores = [0, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
      function pick(act, label, on, aria) { return btn(act, label, on ? 'is-on' : '', aria, ' aria-pressed="' + on + '"'); }
      return '<div class="an-dimmer is-edit' + (closing ? ' is-closing' : '') + '" data-key="ov-edit">' + btn('close', '', 'an-dimmer__bg', 'Close') +
        '<div class="an-edit" role="dialog" aria-label="' + esc(t) + ' on your list">' +
          '<div class="an-edit__top">' + btn('close', I.x, 'an-edit__x', 'Close') + '<b>' + esc(t) + '</b>' + btn('esave', 'Save', 'an-edit__save') + '</div>' +
          '<p class="an-edit__l">Status</p><div class="an-edit__chips">' + STATUS.map(function (x) { return pick('est:' + x, x, d.status === x); }).join('') + '</div>' +
          '<p class="an-edit__l">Progress<span>' + (max > 1 ? d.ep + ' / ' + max + ' ep' : (d.ep ? 'seen' : 'not seen yet')) + '</span></p>' +
          '<div class="an-edit__row" data-kx="ep">' + nums.map(function (n) { return pick('eep:' + n, String(n), d.ep === n, 'Episode ' + n); }).join('') + '</div>' +
          '<p class="an-edit__l">Score<span>' + (d.score ? d.score + ' / 10' : 'no score yet') + '</span></p>' +
          '<div class="an-edit__row" data-kx="score">' + scores.map(function (n) { return pick('esc:' + n, n ? String(n) : '–', d.score === n, n ? 'Score ' + n : 'No score'); }).join('') + '</div>' +
          (st.watching[id] ? btn('erem', I.trash + '<span>Remove from List</span>', 'an-edit__rem') : '') +
        '</div></div>';
    }
    function centerOn(row) {
      var r = q('.an-edit__row[data-kx="' + row + '"]'), b = r && r.querySelector('.is-on'); if (!b) return;
      r.scrollLeft = Math.max(0, b.offsetLeft - r.clientWidth / 2 + b.offsetWidth / 2);
    }
    function inboxRows() {
      var rows = [];
      DMS.forEach(function (d) { var s = st.dms[d.id]; if (s && s.at && !(st.empty && !s.mine)) rows.push({ kind: 'dm', d: d, s: s }); });
      Object.keys(st.dms).forEach(function (id) { if (st.dms[id].mine) rows.push({ kind: 'dm', d: { id: id, time: st.dms[id].time, x: st.dms[id].x }, s: st.dms[id] }); });
      ROOMS.forEach(function (r) { var s = st.rooms[r.id]; if (s.joined) rows.push({ kind: 'room', r: r, s: s }); });
      rows.sort(function (a, b) { return b.s.at - a.s.at; });
      return rows;
    }
    function badge(n) { return n ? '<b class="an-badge">' + n + '</b>' : ''; }
    function roomBanner(r, s, cls) {
      return btn('room:' + r.id, img(r.ban, 'an-room__img', '') + '<b class="an-room__n">' + esc(r.n) + '</b><span class="an-room__m">' + I.member + r.m + '</span>' + badge(s && s.unread),
        'an-room ' + (cls || ''), r.n, ' data-key="room-' + r.id + '"');
    }
    V.inbox = function () {
      var body;
      if (st.itab === 0) {
        var rows = inboxRows();
        body = rows.length ? rows.map(function (row) {
          if (row.kind === 'room') return roomBanner(row.r, row.s, 'is-inbox');
          var p = P[row.d.id], s = row.s, typing = st.typing[row.d.id];
          return btn('dm:' + row.d.id, '<span class="an-dm__av">' + av(row.d.id) + (p.on ? '<i class="an-online"></i>' : '') + '</span><span class="an-dm__b"><b>' + esc(p.n) + '</b><span class="' + (typing ? 'is-typing' : s.unread ? 'is-unread' : '') + '">' +
            esc(typing ? p.n + ' is typing...' : (s.last || row.d.x)) + '</span></span><span class="an-dm__r"><small>' + esc(s.time || row.d.time) + '</small>' + badge(s.unread) + '</span>', 'an-dm', p.n, ' data-key="dm-' + row.d.id + '"');
        }).join('') : '<div class="an-empty"><b>No Messages?💀</b><span>Lol, I think you need people to talk to.</span></div>';
      } else {
        body = ROOMS.map(function (r) { return roomBanner(r, null, 'is-list'); }).join('');
      }
      return '<div class="an-col">' + '<header class="an-head">' + btn('back', I.back, 'an-ib', 'Back') + icons(['search', 'compose']) + '</header>' +
        '<div class="an-seg is-' + st.itab + '" role="tablist"><i class="an-seg__pill" aria-hidden="true"></i>' + btn('itab:0', 'Messages', st.itab === 0 ? 'is-on' : '', null, ' role="tab" aria-selected="' + (st.itab === 0) + '"') +
        btn('itab:1', 'Chatroom', st.itab === 1 ? 'is-on' : '', null, ' role="tab" aria-selected="' + (st.itab === 1) + '"') + '</div>' +
        '<div class="an-scroll an-inbox" data-k="scroll-inbox-' + st.itab + '">' + body + '<div class="an-gap"></div></div></div>';
    };
    function joinModal() {
      var r = room(st.modal.room);
      var art = r.tall ? img(r.tall, 'an-join__img', '') : '<span class="an-join__soft">' + img(r.ban, '', '') + '</span>' + img(r.ban, 'an-join__band', '');
      return '<section class="an-join" role="dialog" aria-label="Join ' + esc(r.n) + '"><div class="an-join__art">' + art +
        btn('close', I.back, 'an-join__ib is-l', 'Back') + btn('share', I.plane, 'an-join__ib is-r', 'Share') +
        '<p class="an-join__t"><b>' + esc(r.n) + '</b><span>' + I.member + r.m + '</span></p><p class="an-join__s">Chatroom Created By @' + esc(r.by) + '</p></div>' +
        '<div class="an-join__b"><b>Rules</b><p>' + esc(r.rules) + '</p></div><div class="an-join__acts">' + btn('close', 'Cancel', 'an-join__no') + btn('join', 'Join', 'an-join__yes') + '</div></section>';
    }
    function composeSheet() {
      return '<section class="an-sheet is-compose" role="dialog" aria-label="New message"><header class="an-sheet__h"><b>New message</b>' + btn('close', I.close, 'an-sheet__x', 'Close') + '</header>' +
        '<p class="an-compose__l">Suggested</p>' + NEWPEOPLE.map(function (id) {
          return btn('newdm:' + id, av(id) + '<span><b>' + esc(P[id].n) + '</b><small>@' + esc(P[id].h) + '</small></span>', 'an-person', 'Message ' + P[id].n);
        }).join('') + '</section>';
    }
    function room(id) { var r = null; ROOMS.forEach(function (x) { if (x.id === id) r = x; }); return r; }
    V.chat = function () {
      var c = st.chat, th = st.threads[c.id] || [], head, isRoom = c.kind === 'room';
      if (isRoom) {
        var r = room(c.id);
        head = '<header class="an-chead is-room">' + img(r.ban, 'an-chead__img', '') + btn('back', I.back, 'an-ib', 'Back') + '<p class="an-chead__t"><b>' + esc(r.n) + '</b><span>' + I.member + r.m + '</span></p>' + btn('cmore', I.dots, 'an-ib', 'More') + '</header>';
      } else {
        var p = P[c.id];
        head = '<header class="an-chead">' + btn('back', I.back, 'an-ib', 'Back') + '<span class="an-dm__av">' + av(c.id) + (p.on ? '<i class="an-online"></i>' : '') + '</span><p class="an-chead__p"><b>' + esc(p.n) + '</b><span class="' + (st.typing[c.id] ? 'is-typing' : '') + '">' + (st.typing[c.id] ? 'typing...' : '@' + esc(p.h)) + '</span></p>' + btn('cmore', I.dots, 'an-ib', 'More') + '</header>';
      }
      var msgs = th.filter(function (m) { return !m.d; }), body;
      if (!msgs.length) {
        body = '<p class="an-day"><span>' + DAY + '</span></p><div class="an-hello"><span class="an-hello__av">' + img(P[c.id].av, 'an-av is-them', '') + av('me', 'is-me') + '</span><b>Don’t be shy!</b><span>Every great conversation starts with just a single word.</span></div>';
      } else {
        body = th.map(function (m, i) {
          if (m.d) return '<p class="an-day"><span>' + esc(m.d) + '</span></p>';
          if (m.sys) return '<p class="an-sys">' + esc(m.sys) + '</p>';
          var me = m.f === 'me', next = th[i + 1], showAv = isRoom && !me && (!next || next.f !== m.f);
          var inner = m.pics ? '<span class="an-pics">' + m.pics.map(function (x) { return img(x, '', 'Picture from ' + P[m.f].n); }).join('') + '</span>' : '<span class="an-b">' + esc(m.x) + '</span>';
          return '<div class="an-msg' + (me ? ' is-me' : '') + (isRoom && !me ? ' has-av' : '') + (m.fresh ? ' is-new' : '') + '">' + (showAv ? av(m.f, 'an-msg__av') : '') +
            (me ? '<i class="an-msg__ok">' + I.check + '</i>' : '') + inner + '</div>' + (m.t ? '<p class="an-t' + (me ? ' is-me' : '') + '">' + m.t + '</p>' : '');
        }).join('');
        if (st.typing[c.id] && !isRoom) body += '<div class="an-msg is-new"><span class="an-b an-typing"><i></i><i></i><i></i></span></div>';
        if (isRoom && st.typingRoom === c.id) body += '<div class="an-msg has-av is-new">' + av(room(c.id).who[0], 'an-msg__av') + '<span class="an-b an-typing"><i></i><i></i><i></i></span></div>';
      }
      return '<div class="an-col an-chat">' + head + '<div class="an-scroll an-msgs" data-k="scroll-chat-' + c.id + '">' + body + '<div class="an-gap"></div></div>' +
        '<footer class="an-mbar"><label class="an-field is-msg' + (st.draft.msg ? ' has-text' : '') + '"><input data-k="msg" placeholder="Type here..." value="' + esc(st.draft.msg || '') + '" aria-label="Message" autocomplete="off" enterkeyhint="send">' +
        '<span class="an-field__i">' + I.image + '</span>' + btn('send', I.plane, 'an-send', 'Send') + '</label></footer></div>';
    };
    V.profile = function () {
      var me = P.me, tabs = [[I.grid, I.gridOn, 'Posts'], [I.reel, I.reel, 'Reels'], [I.quote, I.quote, 'Quotes']], body;
      if (st.ptab === 0) body = '<div class="an-pgrid">' + st.mine.filter(function (p) { return p.art; }).map(function (p) { return p.art; }).concat(GRID).map(function (g) { return '<span>' + img(g, '', '') + '</span>'; }).join('') + '</div>';
      else if (st.ptab === 1) body = '<div class="an-empty is-small"><b>No reels yet</b><span>Short clips will show up here.</span></div>';
      else body = post(FEED[3]);
      return '<div class="an-col">' + '<div class="an-pban">' + img('profile-banner', '', '') + '</div>' +
        '<header class="an-head an-head--card is-profile">' + btn('go:settings', I.hex, 'an-ib', 'Settings') + '<b class="an-uname">naruto_uzumaki' + I.down + '</b>' + btn('pmenu', I.menu, 'an-ib', 'Menu') + '</header>' +
        '<div class="an-scroll an-prof" data-k="scroll-profile"><div class="an-prof__top">' + av('me', 'an-prof__av') + '<b>' + esc(st.me.n) + '</b>' + (st.me.role ? '<span class="an-prof__role">' + esc(st.me.role) + '</span>' : '') +
        '<p class="an-prof__bio">' + (st.me.bio ? esc(st.me.bio) + '<br>' : '') + '✅ Always up for a spar, let’s chat<br><span>@hokage7</span></p></div>' +
        '<dl class="an-stats"><div><dt>' + (364 + st.mine.length) + '</dt><dd>Post</dd></div><div><dt>865</dt><dd>Follower</dd></div><div><dt>' + (100 + Object.keys(st.follow).filter(function (k) { return st.follow[k]; }).length) + '</dt><dd>Following</dd></div></dl>' +
        '<div class="an-pbtns">' + btn('editprof', 'Edit Profile', 'is-dark') + btn('insights', 'Insights', '') + '</div>' +
        '<div class="an-ptabs is-' + st.ptab + '">' + tabs.map(function (t, i) { return btn('ptab:' + i, st.ptab === i ? t[1] : t[0], st.ptab === i ? 'is-on' : '', t[2]); }).join('') + '<i class="an-ptabs__bar" aria-hidden="true"></i></div>' + body +
        '<div class="an-gap an-gap--tab"></div></div>' + tabbar() + '</div>';
    };
    /* ------------------------------------------------- beyond the design file
       Screens the Ani! file didn't draw, so nothing on the phone is a dead end:
       search, the new-post sheet, Activity, full lists, settings, profile menu,
       edit profile, insights, the news filter and the news card menu. */
    function sheetBox(title, body, cls) {
      return '<section class="an-sheet is-compose is-auto ' + (cls || '') + '" role="dialog" aria-label="' + esc(title) + '"><header class="an-sheet__h"><b>' + esc(title) + '</b>' + btn('close', I.close, 'an-sheet__x', 'Close') + '</header>' + body + '</section>';
    }
    function mrow(act, icon, label, extra) { return btn(act, icon + '<span>' + esc(label) + '</span>' + (extra || ''), 'an-mrow'); }
    function allShows() { var seen = {}; return FEAT.concat(AIRING, POPULAR).filter(function (x) { var k = x.t; if (seen[k]) return false; seen[k] = true; return true; }); }

    /* search: shows open their page, people open a DM, stories open the story */
    V.search = function () {
      var qv = (st.draft.q || '').trim().toLowerCase(), body;
      var shows = allShows(), people = Object.keys(P).filter(function (id) { return id !== 'me'; }), news = TOP.concat(NEWS);
      function hit(s) { return s.toLowerCase().indexOf(qv) > -1; }
      function person(id) { return btn('newdm:' + id, av(id) + '<span><b>' + esc(P[id].n) + (P[id].v ? I.verified : '') + '</b><small>@' + esc(P[id].h) + '</small></span>', 'an-person', 'Message ' + P[id].n, ' data-key="p-' + id + '"'); }
      function story(n) { return '<div class="an-nwrap" data-key="s-' + n.id + '">' + btn('story:' + n.id, img(n.art, 'an-nitem__img', '', n.pos ? 'object-position:' + n.pos : '') + '<span class="an-nitem__b"><b>' + esc(n.x) + '</b><span>' + n.t + '</span></span>', 'an-nitem', n.x) + '</div>'; }
      if (!qv) {
        body = '<div class="an-sec"><h4>Trending shows</h4></div><div class="an-posters" data-kx="s-shows">' + shows.map(function (x) { return poster(x, 's-'); }).join('') + '</div>' +
          '<div class="an-sec"><h4>People to follow</h4></div>' + ['anya', 'yor', 'loid', 'killua', 'makima'].map(person).join('');
      } else {
        var s = shows.filter(function (x) { return hit(x.t); }), p = people.filter(function (id) { return hit(P[id].n) || hit(P[id].h); }), n = news.filter(function (x) { return hit(x.x); });
        body = (s.length ? '<div class="an-sec"><h4>Shows</h4></div><div class="an-posters" data-kx="s-hits">' + s.map(function (x) { return poster(x, 's-'); }).join('') + '</div>' : '') +
          (p.length ? '<div class="an-sec"><h4>People</h4></div>' + p.slice(0, 6).map(person).join('') : '') +
          (n.length ? '<div class="an-sec"><h4>News</h4></div><div class="an-nlist">' + n.map(story).join('') + '</div>' : '') +
          (s.length || p.length || n.length ? '' : '<div class="an-empty is-small"><b>Nothing for “' + esc(st.draft.q.trim()) + '”</b><span>Try a show, a person or a news story.</span></div>');
      }
      return '<div class="an-col">' + '<header class="an-head an-shead">' + btn('back', I.back, 'an-ib', 'Back') +
        '<label class="an-field is-search">' + I.search + '<input data-k="q" placeholder="Search anime, people, news" value="' + esc(st.draft.q || '') + '" aria-label="Search" autocomplete="off" enterkeyhint="search"></label></header>' +
        '<div class="an-scroll" data-k="scroll-search">' + body + '<div class="an-gap an-gap--tab"></div></div></div>';
    };

    /* "Show more": the whole section as a grid */
    V.list = function () {
      var first = st.listOf === 'popular' ? POPULAR : AIRING, title = st.listOf === 'popular' ? 'Popular' : 'Currently Airing';
      var seen = {}; first.forEach(function (x) { seen[x.t] = true; });
      var rest = allShows().filter(function (x) { return !seen[x.t]; });
      return '<div class="an-col">' + '<header class="an-head">' + btn('back', I.back, 'an-ib', 'Back') + '<b class="an-head__t">' + title + '</b><span class="an-ib"></span></header>' +
        '<div class="an-scroll" data-k="scroll-list"><div class="an-posters is-grid an-list">' + first.concat(rest).map(function (x) { return poster(x, 'l-'); }).join('') + '</div><div class="an-gap"></div></div></div>';
    };

    /* Activity: the heart tab */
    var ACT = [
      { id: 'a1', when: 'New', who: 'chibi', x: 'commented on your post: “I’m in!! extra pork”', t: '2m', go: 'actpost:p4' },
      { id: 'a2', when: 'New', who: 'killua', x: 'and 56 others liked your post', t: '1h', go: 'actpost:p4' },
      { id: 'a3', when: 'New', who: 'midori', x: 'started following you', t: '3h', follow: true },
      { id: 'a4', when: 'This week', who: 'kiki', x: 'liked your photo', t: '2d', thumb: 'disc-flcl', go: 'tab:profile' },
      { id: 'a5', when: 'This week', who: 'chibi', x: 'joined your chatroom, The Hidden Leaf Village', t: '3d', go: 'actroom:leaf' },
      { id: 'a6', when: 'This week', who: 'frankie', x: 'started following you', t: '4d', follow: true }
    ];
    V.activity = function () {
      var groups = ['New', 'This week'];
      return '<div class="an-col">' + '<header class="an-head"><b class="an-head__t is-left">Activity</b>' + icons(['inbox']) + '</header>' +
        '<div class="an-scroll an-acts" data-k="scroll-activity">' + groups.map(function (g) {
          return '<p class="an-compose__l">' + g + '</p>' + ACT.filter(function (a) { return a.when === g; }).map(function (a) {
            var p = P[a.who], fol = st.follow[a.who];
            var main = av(a.who) + '<span class="an-act__x"><b>' + esc(p.n) + '</b> ' + esc(a.x) + ' <small>' + a.t + '</small></span>';
            var side = a.follow ? btn('follow:' + a.who, fol ? 'Following' : 'Follow back', 'an-act__f' + (fol ? ' is-on' : ''), null, ' aria-pressed="' + !!fol + '"')
              : a.thumb ? '<span class="an-act__th">' + img(a.thumb, '', '') + '</span>' : '<i class="an-act__go">' + I.back + '</i>';
            return '<div class="an-act' + (g === 'New' && !st.actSeen ? ' is-new' : '') + '" data-key="' + a.id + '">' + (a.go ? btn(a.go, main + side, 'an-act__b', p.n + ' ' + a.x) : '<div class="an-act__b">' + main + side + '</div>') + '</div>';
          }).join('');
        }).join('') + '<div class="an-gap an-gap--tab"></div></div>' + tabbar() + '</div>';
    };

    /* Settings */
    var SETS = [['dark', 'Dark mode'], ['notif', 'Activity notifications'], ['spoil', 'Hide spoilers in chatrooms'], ['priv', 'Private account'], ['auto', 'Autoplay videos']];
    V.settings = function () {
      return '<div class="an-col">' + '<header class="an-head">' + btn('back', I.back, 'an-ib', 'Back') + '<b class="an-head__t">Settings</b><span class="an-ib"></span></header>' +
        '<div class="an-scroll" data-k="scroll-settings"><div class="an-set">' + SETS.map(function (s) {
          var on = s[0] === 'dark' ? isDark() : !!st.set[s[0]];
          return btn('set:' + s[0], '<span>' + s[1] + '</span><i class="an-switch"></i>', 'an-set__r' + (on ? ' is-on' : ''), null, ' role="switch" aria-checked="' + on + '"');
        }).join('') + '</div><div class="an-gap"></div></div></div>';
    };

    function myPosts() { return st.mine.concat(FEED.filter(function (p) { return p.by === 'me'; })); }
    function extraSheet() {
      var s = st.sheet, t = s.type;
      if (t === 'newpost') {
        var ok = !!(s.art || (st.draft.np || '').trim());
        return sheetBox('New post', '<p class="an-compose__l">Add an image</p><div class="an-np__pics" data-kx="np-pics">' +
          btn('npart:none', '<span>' + I.quote + '</span>', 'an-np__pic is-text' + (!s.art ? ' is-on' : ''), 'Text only', ' aria-pressed="' + !s.art + '"') +
          GRID.map(function (g) { return btn('npart:' + g, img(g, '', ''), 'an-np__pic' + (s.art === g ? ' is-on' : ''), 'Use this image', ' aria-pressed="' + (s.art === g) + '"'); }).join('') + '</div>' +
          '<div class="an-np__row"><label class="an-field"><input data-k="np" placeholder="' + (s.art ? 'Add a caption' : 'What’s on your mind?') + '" value="' + esc(st.draft.np || '') + '" aria-label="Post text" autocomplete="off"></label>' +
          btn('npsend', 'Post', 'an-np__go', null, ok ? '' : ' disabled') + '</div>', 'is-np');
      }
      if (t === 'filter') return sheetBox('Show news about', CATS.map(function (c) { return mrow('fcat:' + c, st.cat === c ? I.check : '<i></i>', c); }).join(''), 'is-menu');
      if (t === 'more') {
        var sv = st.saved['n:' + s.id];
        return sheetBox('Story', mrow('msave:' + s.id, I.bookmark, sv ? 'Remove from saved' : 'Save') + mrow('mshare', I.plane, 'Share') + mrow('hide:' + s.id, I.close, 'Not interested'), 'is-menu');
      }
      if (t === 'pmenu') return sheetBox('naruto_uzumaki', mrow('go:settings', I.hex, 'Settings') + mrow('mtab:activity', I.heart, 'Activity') + mrow('mtab:discover', I.tracker, 'Your list') + mrow('mshare', I.plane, 'Share profile'), 'is-menu');
      if (t === 'editprof') {
        var f = function (k, l) { return '<label class="an-ep__f"><span>' + l + '</span><span class="an-field"><input data-k="' + k + '" value="' + esc(st.draft[k] || '') + '" aria-label="' + l + '" autocomplete="off"></span></label>'; };
        return sheetBox('Edit profile', f('pn', 'Name') + f('pr', 'Title') + f('pb', 'Bio') + '<div class="an-ep__go">' + btn('epsave', 'Save', 'an-np__go') + '</div>', 'is-ep');
      }
      if (t === 'cmore') {
        var c = st.chat, m = st.muted[c.id], room1 = c.kind === 'room';
        return sheetBox(room1 ? room(c.id).n : P[c.id].n, mrow('mute:' + c.id, I.bell, m ? 'Unmute notifications' : 'Mute notifications') +
          (room1 ? mrow('mshare', I.plane, 'Share room') + mrow('leave:' + c.id, I.close, 'Leave room') : mrow('clear:' + c.id, I.trash, 'Clear chat')), 'is-menu');
      }
      if (t === 'insights') {
        var mine = myPosts(), likes = 0, cm = 0;
        mine.forEach(function (p) { likes += (p.l || 0) + (st.liked[p.id] ? 1 : 0); cm += st.cm[p.id] ? st.cm[p.id].n : 0; });
        var fol = Object.keys(st.follow).filter(function (k) { return st.follow[k]; }).length;
        var cell = function (n, l) { return '<div><b>' + n + '</b><span>' + l + '</span></div>'; };
        return sheetBox('Insights', '<p class="an-compose__l">Your text posts and new posts</p><div class="an-ins">' + cell(mine.length, mine.length === 1 ? 'post' : 'posts') + cell(likes, 'likes') + cell(cm, 'comments') + '</div>' +
          '<p class="an-compose__l">This week</p><div class="an-ins">' + cell(ACT.filter(function (a) { return a.follow; }).length, 'new followers') + cell(fol, 'followed back') + cell(Object.keys(st.watching).length, 'shows added') + '</div>', 'is-menu');
      }
      return '';
    }
    function sendPost() {
      var s = st.sheet, text = (st.draft.np || '').trim(); if (!s || (!s.art && !text)) return;
      var id = 'm' + (++st.cid);
      st.mine.unshift(s.art ? { id: id, type: 'art', by: 'me', sub: text || 'Just now', art: s.art } : { id: id, type: 'text', by: 'me', t: 'now', l: 0, x: text });
      st.cm[id] = { n: 0, list: [] }; st.draft.np = '';
      st.sheet = null; st.stack = []; st.view = 'home'; st.tab = 'home'; render('tab');
      var sc = q('[data-k="scroll-home"]'); if (sc) sc.scrollTop = 0;
      toast('Posted');
    }
    function extraAct(k, arg) {
      switch (k) {
        case 'post': st.draft.np = ''; st.sheet = { type: 'newpost', art: GRID[0] }; render(); return true;
        case 'npart': st.sheet.art = arg === 'none' ? null : arg; render(); return true;
        case 'npsend': sendPost(); if (demo.on) kb(false); return true;
        case 'actpost': st.sheet = { type: 'comments', key: arg }; render(); return true;
        case 'actroom': openChat('room', arg); return true;
        case 'follow': st.follow[arg] = !st.follow[arg]; render(); return true;
        case 'all': go('list', { listOf: arg }); return true;
        case 'set':
          if (arg === 'dark') { lastUser = Date.now(); stepDark = false; baseDark = !isDark(); applyTheme(true); render(); return true; }
          st.set[arg] = !st.set[arg]; render(); return true;
        case 'pmenu': st.sheet = { type: 'pmenu' }; render(); return true;
        case 'mtab': st.sheet = null; tab(arg); return true;
        case 'mshare': closeOverlay(); toast('Link copied'); return true;
        case 'editprof': st.draft.pn = st.me.n; st.draft.pr = st.me.role; st.draft.pb = st.me.bio; st.sheet = { type: 'editprof' }; render(); return true;
        case 'epsave':
          st.me = { n: (st.draft.pn || '').trim() || st.me.n, role: (st.draft.pr || '').trim(), bio: (st.draft.pb || '').trim() };
          closeOverlay(); toast('Profile updated'); return true;
        case 'insights': st.sheet = { type: 'insights' }; render(); return true;
        case 'filter': st.sheet = { type: 'filter' }; render(); return true;
        case 'fcat': st.cat = arg; closeOverlay(); return true;
        case 'more': st.sheet = { type: 'more', id: arg }; render(); return true;
        case 'msave': st.saved['n:' + arg] = !st.saved['n:' + arg]; closeOverlay(); toast(st.saved['n:' + arg] ? 'Saved to your collection' : 'Removed from saved'); return true;
        case 'cmore': st.sheet = { type: 'cmore' }; render(); return true;
        case 'mute': st.muted[arg] = !st.muted[arg]; closeOverlay(); toast(st.muted[arg] ? 'Notifications muted' : 'Notifications on'); return true;
        case 'clear': st.threads[arg] = []; closeOverlay(); toast('Chat cleared'); return true;
        case 'leave': st.rooms[arg].joined = false; st.sheet = null; toast('You left ' + room(arg).n); back(); return true;
        case 'hide': st.hidden[arg] = true; closeOverlay(); toast('You’ll see fewer stories like this'); return true;
      }
      return false;
    }

    function overlays() {
      var cls = 'an-dimmer' + (closing ? ' is-closing' : '');
      if (st.sheet && st.sheet.type === 'comments') return '<div class="' + cls + ' is-sheet" data-key="ov-cm">' + btn('close', '', 'an-dimmer__bg', 'Close') + comments(st.sheet.key, true) + '</div>';
      if (st.sheet && st.sheet.type === 'compose') return '<div class="' + cls + ' is-sheet" data-key="ov-compose">' + btn('close', '', 'an-dimmer__bg', 'Close') + composeSheet() + '</div>';
      if (st.sheet && /^(newpost|filter|more|pmenu|editprof|insights|cmore)$/.test(st.sheet.type)) return '<div class="' + cls + ' is-sheet" data-key="ov-x-' + st.sheet.type + '">' + btn('close', '', 'an-dimmer__bg', 'Close') + extraSheet() + '</div>';
      if (st.modal && st.modal.type === 'join') return '<div class="' + cls + ' is-modal" data-key="ov-join">' + btn('close', '', 'an-dimmer__bg', 'Close') + joinModal() + '</div>';
      return '';
    }

    /* ------------------------------------------------------------ render */
    function viewKey() { return st.view + (st.view === 'chat' ? ':' + st.chat.id : st.view === 'story' ? ':' + st.story : st.view === 'anime' ? ':' + st.anime : st.view === 'list' ? ':' + st.listOf : ''); }
    function statusMode() { return st.view === 'anime' ? ' is-light' : st.view === 'story' ? (story().ink ? ' is-ink' : ' is-light') : st.view === 'chat' && st.chat.kind === 'room' ? ' is-light' : ''; }
    function curView() { for (var n = stackEl.lastElementChild; n; n = n.previousElementSibling) if (!n.classList.contains('is-leaving')) return n; return null; }
    function q(sel) { var v = curView(); return (v && v.querySelector(sel)) || null; }
    function saveScroll(v) {
      var m = scrollMem[v.getAttribute('data-view')] = {};
      v.querySelectorAll('[data-k^="scroll"]').forEach(function (el) { m[el.getAttribute('data-k')] = el.scrollTop; });
      v.querySelectorAll('[data-kx]').forEach(function (el) { m['x:' + el.getAttribute('data-kx')] = el.scrollLeft; });
    }
    function restoreScroll(v) {
      var m = scrollMem[v.getAttribute('data-view')]; if (!m) return;
      v.querySelectorAll('[data-k^="scroll"]').forEach(function (el) { el.scrollTop = m[el.getAttribute('data-k')] || 0; });
      v.querySelectorAll('[data-kx]').forEach(function (el) { el.scrollLeft = m['x:' + el.getAttribute('data-kx')] || 0; });
    }
    function render(dir) {
      var key = viewKey(), html = V[st.view]() + overlays(), cur = curView();
      if (cur && cur.getAttribute('data-view') === key) {
        var tmp = document.createElement('div'); tmp.innerHTML = html; morphChildren(cur, tmp);
      } else {
        if (cur) saveScroll(cur);
        var nv = document.createElement('div'); nv.className = 'an-v'; nv.setAttribute('data-view', key); nv.innerHTML = html;
        stackEl.appendChild(nv);
        if (dir === 'pop' || dir === 'tab') restoreScroll(nv);
        var old = cur;
        if (old) {
          if (!dir || REDUCED) old.remove();
          else {
            old.classList.add('is-leaving', 'is-out-' + dir); old.setAttribute('inert', ''); old.setAttribute('aria-hidden', 'true');
            nv.classList.add('is-in-' + dir);
            setTimeout(function () { if (old.parentNode) old.remove(); nv.classList.remove('is-in-' + dir); }, 380);
          }
        }
        cur = nv;
      }
      app.classList.toggle('is-dark', isDark());
      statusEl.className = 'an-status' + statusMode();
      if (st.view === 'chat' && st.toBottom) { var m = cur.querySelector('.an-msgs'); if (m) m.scrollTop = m.scrollHeight; st.toBottom = false; }
      var f = cur.querySelector('.an-feat'); if (f && !f.__dots) { f.__dots = true; f.addEventListener('scroll', featDots, { passive: true }); }
    }
    function featDots(e) {
      var el = e.currentTarget, i = Math.round(el.scrollLeft / 342);
      if (i === st.feat) return; st.feat = i;
      el.parentNode.querySelectorAll('.an-dots i').forEach(function (d, k) { d.classList.toggle('is-on', k === i); });
    }
    function toast(t) {
      toastEl.textContent = t; toastEl.classList.remove('is-on'); void toastEl.offsetWidth; toastEl.classList.add('is-on');
      clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove('is-on'); }, 1800);
    }
    function later(fn, ms) { var t = setTimeout(function () { replyT.splice(replyT.indexOf(t), 1); fn(); }, ms); replyT.push(t); }
    function closeOverlay() {
      if (closing) return;
      if (REDUCED) { st.sheet = null; st.modal = null; render(); return; }
      closing = true; render();
      setTimeout(function () { closing = false; st.sheet = null; st.modal = null; render(); }, 230);
    }
    function burst(id) {
      var art = q('[data-dbl="' + id + '"]'); if (!art || REDUCED) return;
      var b = document.createElement('i'); b.className = 'an-fx an-burst'; b.innerHTML = I.burst; art.appendChild(b);
      setTimeout(function () { b.remove(); }, 900);
    }

    /* keyboard: slides up while the tour types, so typing looks like typing */
    var KEYS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
    function buildKb() {
      kbEl.innerHTML = '<div class="an-kb__bar"><span>“the”</span><span>“I”</span><span>“that”</span></div>' + KEYS.map(function (row, i) {
        return '<div class="an-kb__row r' + i + '">' + (i === 2 ? '<i class="is-fn">⇧</i>' : '') + row.split('').map(function (k) { return '<i data-k="' + k + '">' + k + '</i>'; }).join('') + (i === 2 ? '<i class="is-fn">⌫</i>' : '') + '</div>';
      }).join('') + '<div class="an-kb__row r3"><i class="is-fn" data-k="#">123</i><i class="is-fn">☺</i><i class="is-sp" data-k=" ">space</i><i class="is-fn is-ret">send</i></div>';
    }
    function kb(on) { app.classList.toggle('kb-up', !!on); var m = q('.an-msgs'); if (on && m) setTimeout(function () { m.scrollTop = m.scrollHeight; }, 300); }
    function kbHit(ch) {
      var k = /[a-z]/i.test(ch) ? ch.toLowerCase() : ch === ' ' ? ' ' : '#';
      var el = kbEl.querySelector('[data-k="' + (k === ' ' ? ' ' : k) + '"]'); if (!el) return;
      el.classList.remove('is-hit'); void el.offsetWidth; el.classList.add('is-hit');
    }

    function sendMsg() {
      var text = (st.draft.msg || '').trim(), c = st.chat;
      if (!text || !c) return;
      var th = st.threads[c.id] || (st.threads[c.id] = []);
      if (!th.some(function (m) { return m.d; })) th.unshift({ d: DAY });
      th.push({ f: 'me', x: text, t: now(), fresh: true });
      st.draft.msg = ''; st.toBottom = true; st.clock++;
      if (c.kind === 'room') { st.rooms[c.id].at = st.clock; st.rooms[c.id].unread = 0; }
      else {
        var d = st.dms[c.id] || (st.dms[c.id] = { unread: 0 });
        d.at = st.clock; d.last = text; d.time = now(); if (!DMS.some(function (x) { return x.id === c.id; })) { d.mine = true; d.x = text; }
      }
      render();
      var pool = REPLIES[c.id] || (c.kind === 'dm' ? REPLIES._dm : REPLIES._), who = c.kind === 'room' ? room(c.id).who[0] : c.id, id = c.id;
      later(function () { if (c.kind === 'dm') st.typing[id] = true; else st.typingRoom = id; st.toBottom = st.view === 'chat'; render(); }, 700);
      later(function () {
        st.typing[id] = false; st.typingRoom = null;
        var line = pool[th.length % pool.length];
        (st.threads[id] || []).push({ f: who, x: line, t: now(), fresh: true });
        st.clock++;
        if (c.kind === 'dm') { st.dms[id].last = line; st.dms[id].at = st.clock; }
        st.toBottom = st.view === 'chat' && st.chat && st.chat.id === id; render();
      }, 2000);
    }
    function postComment() {
      var key = st.sheet ? st.sheet.key : (st.view === 'story' ? st.story : null);
      var text = (st.draft.cmt || '').trim();
      if (!key || !text) return;
      var c = st.cm[key];
      c.list.forEach(function (m) { m.fresh = false; });
      c.list.unshift({ id: key + '-n' + (++st.cid), f: 'me', x: text, d: 'Just now', l: 0, fresh: true });
      c.n++; st.draft.cmt = '';
      render();
      var list = q('.an-cmts'); if (list) list.scrollTo({ top: 0, behavior: REDUCED ? 'auto' : 'smooth' });
    }

    function act(a) {
      var p = a.split(':'), k = p[0], arg = p[1];
      if (extraAct(k, arg)) return;
      switch (k) {
        case 'back': back(); return;
        case 'close': closeOverlay(); return;
        case 'tab': tab(arg); return;
        case 'go': if (arg === 'inbox') go('inbox', { itab: 0 }); else go(arg); return;
        case 'share': toast('Link copied'); return;
        case 'story':
          if (STORIES.indexOf(arg) > -1) { st.seen[arg] = true; render(); return; }
          go('story', { story: arg }); return;
        case 'save': st.saved[arg] = !st.saved[arg]; render(); toast(st.saved[arg] ? 'Saved to your collection' : 'Removed from saved'); return;
        case 'nsave': st.saved['n:' + arg] = !st.saved['n:' + arg]; render(); return;
        case 'like': st.liked[arg] = !st.liked[arg]; render(); return;
        case 'cmts': st.sheet = { type: 'comments', key: arg }; render(); return;
        case 'clike': st.cliked[arg] = !st.cliked[arg]; render(); return;
        case 'csend': postComment(); if (demo.on) kb(false); return;
        case 'cat': st.cat = arg; render(); return;
        case 'qa': if (arg === 'close') holdClose(); else holdPick(arg); return;
        case 'peek': go('anime', { anime: arg, descOpen: false }); return;
        case 'desc': st.descOpen = !st.descOpen; render(); return;
        case 'edit':
          var en = st.watching[st.anime] && st.entry[st.anime];
          st.sheet = { type: 'edit', status: en ? en.status : 'Watching', ep: en ? en.ep : 0, score: en ? en.score : 0 };
          render(); centerOn('ep'); centerOn('score'); return;
        case 'est': st.sheet.status = arg; if (arg === 'Completed') { st.sheet.ep = SHOWS[st.anime].ep; render(); centerOn('ep'); } else render(); return;
        case 'eep': st.sheet.ep = +arg; if (+arg === SHOWS[st.anime].ep && st.sheet.status === 'Watching') st.sheet.status = 'Completed'; render(); return;
        case 'esc': st.sheet.score = +arg; render(); return;
        case 'esave':
          var was = st.watching[st.anime]; st.watching[st.anime] = true;
          st.entry[st.anime] = { status: st.sheet.status, ep: st.sheet.ep, score: st.sheet.score };
          closeOverlay(); toast(was ? 'List updated' : 'Added to your list'); return;
        case 'erem': delete st.watching[st.anime]; delete st.entry[st.anime]; closeOverlay(); toast('Removed from your list'); return;
        case 'view': st.gridView = arg === 'grid'; render(); return;
        case 'itab': if (st.itab === +arg) return; st.itab = +arg; render(); var sc = q('.an-inbox'); if (sc) sc.scrollTop = 0; return;
        case 'room':
          if (st.rooms[arg].joined) { openChat('room', arg); return; }
          st.modal = { type: 'join', room: arg }; render(); return;
        case 'join':
          var rid = st.modal.room; st.clock++;
          st.rooms[rid] = { joined: true, unread: 0, at: st.clock };
          st.threads[rid] = (st.threads[rid] || []).concat([{ sys: 'You joined ' + room(rid).n }]);
          st.modal = null; openChat('room', rid); return;
        case 'dm': openChat('dm', arg); return;
        case 'compose': st.sheet = { type: 'compose' }; render(); return;
        case 'newdm': st.sheet = null; if (!st.threads[arg]) st.threads[arg] = []; openChat('dm', arg); return;
        case 'send': sendMsg(); if (demo.on) kb(false); return;
        case 'ptab': st.ptab = +arg; render(); return;
      }
    }
    function openChat(kind, id) {
      if (kind === 'dm' && st.dms[id]) st.dms[id].unread = 0;
      if (kind === 'room') st.rooms[id].unread = 0;
      st.draft.msg = '';
      go('chat', { chat: { kind: kind, id: id }, toBottom: true });
      if (kind === 'dm' && st.typing[id]) later(function () { st.typing[id] = false; render(); }, 2600);
    }
    function onInput(e) {
      var k = e.target.getAttribute('data-k'); if (!k) return;
      st.draft[k] = e.target.value;
      if (k === 'q' || k === 'np') { render(); return; }
      var f = e.target.closest('.an-field'); if (f) f.classList.toggle('has-text', !!e.target.value.trim());
    }
    /* ------------------------------------------------------- quick add
       From my 2021 MyAnimeList redesign: press and hold a poster, three
       buttons fan out round the finger (close, share, add); slide onto one
       and let go. Lifting without sliding leaves them open for a tap. A plain
       tap only says how; Enter or Space opens the same buttons. */
    var hold = { el: null, id: null, timer: 0, ring: null, open: false, drag: false, hot: null, skip: false, sx: 0, sy: 0 };
    var HOLD_MS = 450;
    function appPt(cx, cy) { var r = app.getBoundingClientRect(); return { x: (cx - r.left) / scale, y: (cy - r.top) / scale }; }
    function holdRing(cx, cy) {
      holdRingOff(); var p = appPt(cx, cy), g = document.createElement('i');
      g.className = 'an-hold__ring'; g.setAttribute('aria-hidden', 'true');
      g.style.left = p.x.toFixed(1) + 'px'; g.style.top = p.y.toFixed(1) + 'px';
      app.appendChild(g); hold.ring = g;
    }
    function holdRingOff() { if (hold.ring) { hold.ring.remove(); hold.ring = null; } }
    function holdCancel() { clearTimeout(hold.timer); hold.timer = 0; holdRingOff(); }
    function holdOpen(poster, cx, cy, keys) {
      holdCancel(); holdClose(true);
      var id = poster.getAttribute('data-hold'), on = !!st.watching[id];
      var ar = app.getBoundingClientRect(), pr = poster.getBoundingClientRect(), p = appPt(cx, cy), W = ar.width / scale;
      var lift = poster.cloneNode(true);
      ['data-act', 'data-hold', 'data-key', 'aria-label'].forEach(function (a) { lift.removeAttribute(a); });
      lift.setAttribute('tabindex', '-1'); lift.setAttribute('aria-hidden', 'true'); lift.classList.add('an-hold__lift');
      lift.style.cssText = 'left:' + ((pr.left - ar.left) / scale).toFixed(1) + 'px;top:' + ((pr.top - ar.top) / scale).toFixed(1) + 'px;width:' + (pr.width / scale).toFixed(1) + 'px;height:' + (pr.height / scale).toFixed(1) + 'px';
      /* fan towards the middle of the screen, and downwards near the top */
      var R = 66, toRight = p.x < W / 2, up = p.y > 190;
      var ang = toRight ? [-125, -68, -11] : [-55, -112, -169];
      if (!up) ang = ang.map(function (a) { return -a; });
      var B = [['close', I.close, 'Close'], ['share', I.plane, 'Share'], ['add', on ? I.check : I.add, on ? 'Remove from Watching' : 'Add to Watching']];
      var html = '<i class="an-hold__scrim" data-act="qa:close"></i>' +
        '<p class="an-hold__tip" style="left:' + p.x.toFixed(1) + 'px;top:' + (p.y + (up ? -R - 58 : R + 34)).toFixed(1) + 'px"></p>' +
        B.map(function (b, i) {
          var a = ang[i] * Math.PI / 180, tx = Math.cos(a) * R, ty = Math.sin(a) * R;
          return '<button type="button" class="an-hold__b is-' + b[0] + (b[0] === 'add' && on ? ' is-on' : '') + '" data-act="qa:' + b[0] + '" data-tip="' + b[2] + '" aria-label="' + b[2] + '" style="left:' + p.x.toFixed(1) + 'px;top:' + p.y.toFixed(1) + 'px;--tx:' + tx.toFixed(1) + 'px;--ty:' + ty.toFixed(1) + 'px;--i:' + i + '">' + b[1] + '</button>';
        }).join('');
      var el = document.createElement('div'); el.className = 'an-hold'; el.setAttribute('role', 'menu'); el.setAttribute('aria-label', poster.querySelector('b').textContent);
      el.innerHTML = html; el.insertBefore(lift, el.children[1]);
      el.querySelectorAll('.an-hold__b').forEach(function (b) { b.setAttribute('role', 'menuitem'); });
      el.addEventListener("focusin", function (e) { var b = e.target.closest(".an-hold__b"); if (b && !hold.drag) holdHot(b.getAttribute("data-act").slice(3)); });
      app.appendChild(el);
      hold.el = el; hold.id = id; hold.open = true; hold.hot = null; hold.src = poster; hold.cx = cx; hold.cy = cy;
      if (keys) { var k = el.querySelector('.is-add'); if (k) k.focus({ preventScroll: true }); }
    }
    function holdHot(k) {
      if (!hold.el || hold.hot === k) return; hold.hot = k;
      var tip = hold.el.querySelector('.an-hold__tip'), hot = null;
      hold.el.querySelectorAll('.an-hold__b').forEach(function (b) { var on = b.getAttribute('data-act') === 'qa:' + k; b.classList.toggle('is-hot', on); if (on) hot = b; });
      tip.textContent = hot ? hot.getAttribute('data-tip') : ''; tip.classList.toggle('is-on', !!hot);
    }
    function holdAt(cx, cy) {
      var k = null, best = 34 * scale;
      hold.el.querySelectorAll('.an-hold__b').forEach(function (b) {
        var s = b.style, d = Math.hypot(hold.cx + parseFloat(s.getPropertyValue("--tx")) * scale - cx, hold.cy + parseFloat(s.getPropertyValue("--ty")) * scale - cy);
        if (d < best) { best = d; k = b.getAttribute('data-act').slice(3); }
      });
      holdHot(k);
    }
    function holdClose(now) {
      var el = hold.el; if (!el) return;
      hold.el = null; hold.open = false; hold.drag = false; hold.hot = null;
      var src = hold.src; hold.src = null;
      if (now || REDUCED) el.remove();
      else { el.classList.add('is-out'); setTimeout(function () { el.remove(); }, 220); }
      if (src && el.contains(document.activeElement)) { var fresh = q('[data-hold="' + hold.id + '"]'); (fresh || src).focus({ preventScroll: true }); }
    }
    function holdPick(k) {
      var id = hold.id; holdClose();
      if (k === 'add') { st.watching[id] = !st.watching[id]; if (st.watching[id]) st.entry[id] = { status: 'Watching', ep: 0, score: 0 }; else delete st.entry[id]; render(); toast(st.watching[id] ? 'Added to Watching' : 'Removed from Watching'); }
      else if (k === 'share') toast('Link copied');
    }

    var lastTap = { id: null, t: 0 };
    function onArtTap(art) {
      var id = art.getAttribute('data-dbl'), t = Date.now();
      if (lastTap.id === id && t - lastTap.t < 340) {
        lastTap.id = null;
        if (!st.liked[id]) { st.liked[id] = true; render(); }
        burst(id);
      } else lastTap = { id: id, t: t };
    }

    /* ------------------------------------------------------------- theme */
    function isDark() { return stepDark || baseDark; }
    function themeUI() { ctl.querySelectorAll('[data-theme]').forEach(function (b) { b.setAttribute('aria-pressed', String((b.getAttribute('data-theme') === 'dark') === isDark())); }); }
    function applyTheme(animate) {
      if (animate && !REDUCED) { app.classList.add('is-theming'); setTimeout(function () { app.classList.remove('is-theming'); }, 500); }
      app.classList.toggle('is-dark', isDark()); themeUI();
      if (stackEl && st && st.view === 'settings') render();
    }

    /* ------------------------------------------------------------- steps
       Each step: setup() puts the app where the step starts, run() drives it. */
    var home = '[data-k="scroll-home"]';
    function base(view, patch) {
      fresh();
      if (view === 'discover' || view === 'profile') { st.tab = view; }
      st.view = view;
      if (patch) for (var k in patch) st[k] = patch[k];
    }
    var STEPS = {
      feed: { setup: function () { base('home'); }, run: async function () {
        await wait(500); await swipe(home, 330, 1300); await wait(450); await swipe(home, -330, 900);
        await tap('[data-dbl="p1"]', 0.5, 0.42, true); await wait(1000);
        await tap('[data-act="save:p1"]'); await wait(1300);
      } },
      comments: { setup: function () { base('home'); }, run: async function () {
        await wait(400); await tap('[data-act="cmts:p1"]'); await wait(1100);
        await tap('[data-act="clike:p1-1"]'); await wait(700);
        await type('cmt', 'okay this is stunning 😭'); await wait(250);
        await tap('[data-act="csend"]'); await wait(1300);
        await tap('[data-act="clike:p1-0"]'); await wait(1100);
      } },
      news: { setup: function () { base('home'); }, run: async function () {
        await wait(400); await tap('.an-head [data-act="go:news"]'); await wait(1000);
        await swipe('[data-kx="cards"]', 270, 900, 'x'); await wait(500);
        await swipe('[data-kx="cards"]', -270, 700, 'x'); await wait(200);
        await tap('[data-act="cat:Anime"]'); await wait(900);
        await tap('[data-act="cat:Popular"]'); await wait(500);
        await tap('.an-ncard [data-act="story:spy"]', 0.5, 0.35); await wait(1300);
        await tap('[data-act="clike:spy-2"]'); await wait(1200);
      } },
      tracker: { setup: function () { base('discover'); }, run: async function () {
        await wait(500); await swipe('[data-kx="feat"]', 342, 900, 'x'); await wait(700);
        await press('.an-posters [data-hold="csm"]', 'add', 0.6, 0.45); await wait(1300);
        await tap('.an-posters [data-hold="ds"]', 0.5, 0.4); await wait(1200);
        await swipe('[data-k="scroll-anime"]', 240, 900); await wait(500);
        await tap('.an-ap__fab'); await wait(900);
        await tap('[data-act="eep:5"]'); await wait(500);
        await tap('[data-act="esc:9"]'); await wait(600);
        await tap('[data-act="esave"]'); await wait(1200);
        await swipe('[data-k="scroll-anime"]', -240, 700); await wait(1300);
        await tap('.an-ap__ib.is-back'); await wait(1000);
      } },
      inbox: { setup: function () { base('inbox', { stack: ['home'], itab: 0 }); }, run: async function () {
        await wait(600); await swipe('[data-k="scroll-inbox-0"]', 300, 1300); await wait(500);
        await swipe('[data-k="scroll-inbox-0"]', -300, 900); await wait(300);
        await tap('[data-act="itab:1"]'); await wait(1200);
        await tap('[data-act="itab:0"]'); await wait(1100);
      } },
      rooms: { setup: function () { base('inbox', { stack: ['home'], itab: 1 }); }, run: async function () {
        await wait(500); await tap('[data-act="room:art"]'); await wait(1600);
        await tap('[data-act="join"]'); await wait(1100);
        await type('msg', 'Hi all! Sketching the ep 1 opening tonight 🎨'); await wait(200);
        await tap('[data-act="send"]'); await wait(2800);
        await tap('.an-chead [data-act="back"]'); await wait(800);
        await tap('[data-act="itab:0"]'); await wait(1600);
      } },
      dm: { setup: function () { base('chat', { stack: ['home', 'inbox'], chat: { kind: 'dm', id: 'killua' }, toBottom: true }); st.dms.killua.unread = 0; }, run: async function () {
        await wait(2400); st.typing.killua = false; render(); await wait(500);
        await type('msg', 'Can’t wait for the next episode, its gonna be peak'); await wait(200);
        await tap('[data-act="send"]'); await wait(3000);
      } },
      empty: { setup: function () { base('inbox', { stack: ['home'], itab: 0, empty: true, typing: {} }); for (var r in st.rooms) st.rooms[r].joined = false; }, run: async function () {
        await wait(1300); await tap('[data-act="compose"]'); await wait(1000);
        await tap('[data-act="newdm:anya"]'); await wait(1500);
        await type('msg', 'hiii! loved your Spy x Family post 🥜'); await wait(200);
        await tap('[data-act="send"]'); await wait(2800);
        await tap('.an-chead [data-act="back"]'); await wait(1300);
      } },
      dark: { dark: true, setup: function () { base('home'); }, run: async function () {
        await wait(700); await swipe(home, 300, 1100); await wait(400); await swipe(home, -300, 800);
        await tap('[data-act="tab:discover"]'); await wait(1200);
        await tap('[data-act="tab:profile"]'); await wait(1100);
        await tap('[data-act="ptab:2"]'); await wait(1100);
      } }
    };
    function stepTitle(id) { var s = tour.querySelector('.an-step[data-step="' + id + '"] h3'); return s ? s.textContent : ''; }
    function markSteps() { steps.forEach(function (s) { var on = s.getAttribute('data-step') === activeStep; s.classList.toggle('is-on', on); if (on) s.setAttribute('aria-current', 'step'); else s.removeAttribute('aria-current'); }); }
    function activate(id, why) {
      if (!STEPS[id]) return;
      if (id === activeStep && why !== 'replay') return;
      mount();
      var changed = id !== activeStep;
      activeStep = id; markSteps();
      stopDemo();
      if (changed) stepDark = !!STEPS[id].dark;
      STEPS[id].setup(); applyTheme(changed); render('fade');
      if (why === 'scroll' && (REDUCED || Date.now() - lastUser < 2500)) { ctlState('idle'); return; }
      runDemo(id);
    }
    async function runDemo(id) {
      demo.on = true; demo.token++; var t = demo.token;
      ctlState('play');
      try {
        await wait(350);
        await STEPS[id].run();
        if (t !== demo.token) return;
        touch.classList.remove('is-on'); demo.on = false; ctlState('idle');
      } catch (e) { if (e !== 'stop' && window.console) console.warn('ani step', id, e); }
    }
    function stopDemo() {
      demo.on = false; demo.token++;
      if (touch) { touch.className = 'an-touch'; touch.style.transition = ''; }
      if (app) { kb(false); holdCancel(); if (hold.open && !hold.drag) holdClose(true); }
    }
    function ctlState(s) {
      if (!ctl) return;
      ctl.setAttribute('data-state', s);
      var lv = stage && stage.querySelector('.an-live'); if (lv) { lv.textContent = s === 'play' ? 'live' : 'try it'; lv.setAttribute('data-state', s); }
      var t = ctl.querySelector('.an-ctl__t'), b = ctl.querySelector('.an-ctl__b');
      var name = stepTitle(activeStep).toLowerCase();
      if (s === 'play') { t.textContent = 'the app is playing itself: tap it to take over'; b.textContent = 'stop'; }
      else if (s === 'drive') { t.textContent = 'you’re driving: tap anything'; b.textContent = 'replay this step'; }
      else { t.textContent = 'your turn: tap anything on the phone'; b.textContent = 'replay this step'; }
    }

    /* ------------------------------------------------------------ mount */
    function fit() {
      if (!stage) return;
      var W = 414, H = 868, avail, s;
      if (wide.matches) { avail = Math.min(tour.clientWidth * 0.47, 414); s = Math.min(1, avail / W, Math.max(0.5, (window.innerHeight - 160) / H)); }
      else { avail = Math.min(tour.clientWidth, 414); s = Math.min(1, avail / W, Math.max(0.5, (window.innerHeight - 250) / H)); }
      if (s !== scale) { scale = s; phone.style.transform = 'scale(' + s + ')'; }
      stage.style.height = Math.round(H * s) + 'px';
      stage.style.width = Math.round(W * s) + 'px';
    }
    function mount() {
      if (mounted) return; mounted = true;
      fresh();
      var host = tour.querySelector('.an-tour__phone');
      var fb = host.querySelector('.an-fallback'); if (fb) fb.remove();
      host.insertAdjacentHTML('beforeend', '<div class="an-stage"><span class="an-live" aria-hidden="true"></span><div class="an-phone"><div class="an-app" role="group" aria-label="Ani! prototype">' +
        '<div class="an-stack"></div><div class="an-status"></div><i class="an-island" aria-hidden="true"></i><div class="an-kb" aria-hidden="true"></div><p class="an-toast" role="status"></p></div></div></div>' +
        '<div class="an-ctl" data-state="idle"><span class="an-ctl__dot"></span><span class="an-ctl__t"></span><button type="button" class="an-ctl__b">replay</button>' +
        '<span class="an-ctl__theme" role="group" aria-label="Theme"><button type="button" data-theme="light">light</button><button type="button" data-theme="dark">dark</button></span></div>');
      stage = host.querySelector('.an-stage'); phone = host.querySelector('.an-phone'); app = host.querySelector('.an-app');
      stackEl = app.querySelector('.an-stack'); statusEl = app.querySelector('.an-status'); toastEl = app.querySelector('.an-toast'); kbEl = app.querySelector('.an-kb'); ctl = host.querySelector('.an-ctl');
      statusEl.innerHTML = '<span>9:41</span><span class="an-status__i"><i></i><i></i><i></i><i></i>' +
        '<svg viewBox="0 0 24 24" class="an-wifi"><path d="M2.5 9.2a14 14 0 0 1 19 0M5.6 12.4a9.5 9.5 0 0 1 12.8 0M8.7 15.6a5 5 0 0 1 6.6 0"/><circle class="f" cx="12" cy="18.6" r="1.4"/></svg><b class="an-batt"><i></i></b></span>';
      buildKb();
      touch = document.createElement('i'); touch.className = 'an-touch'; touch.setAttribute('aria-hidden', 'true'); phone.appendChild(touch);

      app.addEventListener('click', function (e) {
        var hp = e.target.closest('[data-hold]');
        if (hp && app.contains(hp)) {
          e.preventDefault();
          if (hold.skip) { hold.skip = false; return; }
          act(hp.getAttribute('data-act')); return;
        }
        var b = e.target.closest('[data-act]');
        if (b && app.contains(b) && !b.disabled) { e.preventDefault(); act(b.getAttribute('data-act')); return; }
        var art = e.target.closest('[data-dbl]'); if (art && app.contains(art)) onArtTap(art);
      });
      app.addEventListener('input', onInput);
      app.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && hold.open) { holdClose(); return; }
        if (e.key === 'Escape' && (st.sheet || st.modal)) closeOverlay();
        if (e.key === 'Enter') { var k = e.target.getAttribute('data-k'); if (k === 'msg') { e.preventDefault(); sendMsg(); } else if (k === 'cmt') { e.preventDefault(); postComment(); } }
      });
      /* a real tap, scroll or key on the phone hands it over to the visitor */
      var takeOver = function (e) { if (!e.isTrusted) return; lastUser = Date.now(); if (demo.on) { stopDemo(); ctlState('drive'); } };
      app.addEventListener('pointerdown', takeOver, true);
      app.addEventListener('keydown', takeOver, true);
      app.addEventListener('wheel', takeOver, { capture: true, passive: true });
      /* press and hold a poster */
      app.addEventListener('pointerdown', function (e) {
        if (e.button > 0 || hold.open) return;
        var hp = e.target.closest('[data-hold]'); if (!hp || !app.contains(hp)) return;
        hold.sx = e.clientX; hold.sy = e.clientY; holdRing(e.clientX, e.clientY);
        hold.timer = setTimeout(function () { hold.timer = 0; hold.skip = true; hold.drag = true; holdOpen(hp, hold.sx, hold.sy); }, HOLD_MS);
      });
      document.addEventListener('pointermove', function (e) {
        if (hold.timer) { if (Math.hypot(e.clientX - hold.sx, e.clientY - hold.sy) > 9) holdCancel(); }
        else if (hold.drag && hold.el) holdAt(e.clientX, e.clientY);
      });
      var holdUp = function (e) {
        if (hold.timer) { holdCancel(); return; }
        if (hold.skip) setTimeout(function () { hold.skip = false; }, 0);
        if (hold.drag) { hold.drag = false; if (e.type === 'pointerup' && hold.hot) holdPick(hold.hot); else holdHot(null); }
      };
      document.addEventListener('pointerup', holdUp);
      document.addEventListener('pointercancel', holdUp);
      app.addEventListener('contextmenu', function (e) { if (e.target.closest('[data-hold], .an-hold')) e.preventDefault(); });
      app.addEventListener('touchmove', function (e) { if (hold.drag) e.preventDefault(); }, { passive: false });
      app.addEventListener('dragstart', function (e) { if (e.target.closest('[data-hold]')) e.preventDefault(); });
      ctl.addEventListener('click', function (e) {
        var b = e.target.closest('button'); if (!b) return;
        if (b.hasAttribute('data-theme')) { lastUser = Date.now(); stepDark = false; baseDark = b.getAttribute('data-theme') === 'dark'; applyTheme(true); return; }
        if (demo.on) { stopDemo(); ctlState('drive'); } else activate(activeStep || steps[0].getAttribute('data-step'), 'replay');
      });
      document.addEventListener('visibilitychange', syncPause);
      window.addEventListener('resize', fit);
      if ('ResizeObserver' in window) new ResizeObserver(fit).observe(tour);
      fit(); render(); themeUI(); ctlState('idle');
    }

    /* the step in the middle of the screen (wide) or the card in view (narrow) leads */
    var io = null;
    function observe() {
      if (io) io.disconnect();
      if (!('IntersectionObserver' in window)) return;
      var list = tour.querySelector('.an-tour__steps');
      io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) activate(en.target.getAttribute('data-step'), 'scroll'); });
      }, wide.matches ? { rootMargin: '-46% 0px -46% 0px' } : { root: list, threshold: 0.6 });
      steps.forEach(function (s) { io.observe(s); });
    }
    if (wide.addEventListener) wide.addEventListener('change', function () { observe(); fit(); }); else if (wide.addListener) wide.addListener(function () { observe(); fit(); });

    /* mobile: the frames for a card open in the page's lightbox */
    tour.addEventListener('click', function (e) {
      var b = e.target.closest('.an-step__see'); if (!b) return;
      var z = b.closest('.an-step').querySelector('.zoomable, .screens__img'); if (z) z.click();
    });
    /* links elsewhere on the page that point at a step (#step-tracker) */
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#step-"]'); if (!a) return;
      var s = document.getElementById(a.getAttribute('href').slice(1)); if (!s || !tour.contains(s)) return;
      e.preventDefault();
      if (wide.matches) s.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'center' });
      else { tour.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'start' }); s.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'center' }); }
    });

    /* ---------------------------------------------------------- demo driver
       A touch dot moves to each control and taps it. Pauses off-screen;
       any real tap takes over. */
    function nextFrame(cb) { var done = false; var g = function () { if (!done) { done = true; cb(performance.now()); } }; requestAnimationFrame(g); setTimeout(g, 50); }
    function syncPause() {
      if (!stage) return;
      var r = stage.getBoundingClientRect(), vh = window.innerHeight || 800;
      demo.paused = !(r.bottom > vh * 0.2 && r.top < vh * 0.8 && r.width > 0) || document.hidden;
    }
    function wait(ms) {
      var t = demo.token;
      return new Promise(function (res, rej) {
        var left = ms * PACE, last = Date.now();
        (function tick() {
          if (t !== demo.token) return rej('stop');
          syncPause();
          var n = Date.now();
          if (!demo.paused) left -= n - last;
          last = n;
          if (left <= 0) res(); else setTimeout(tick, 40);
        })();
      });
    }
    function find(sel) { var el = q(sel); if (!el) throw 'stop'; return el; }
    function point(el, fx, fy) {
      var pr = phone.getBoundingClientRect(), r = el.getBoundingClientRect();
      var cx = r.left + r.width * (fx == null ? 0.5 : fx), cy = r.top + r.height * (fy == null ? 0.5 : fy);
      return { cx: cx, cy: cy, x: (cx - pr.left) / scale, y: (cy - pr.top) / scale };
    }
    async function moveTo(el, fx, fy) {
      var p = point(el, fx, fy);
      touch.style.transform = 'translate(' + p.x.toFixed(1) + 'px,' + p.y.toFixed(1) + 'px)';
      touch.classList.add('is-on');
      await wait(560);
      return point(el, fx, fy);
    }
    function ping() { touch.classList.remove('is-tap'); void touch.offsetWidth; touch.classList.add('is-tap'); }
    async function tap(sel, fx, fy, twice) {
      var el = find(sel), p = await moveTo(el, fx, fy);
      var fire = function () { find(sel).dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, clientX: p.cx, clientY: p.cy })); };
      ping(); await wait(150); fire();
      if (twice) { await wait(120); ping(); fire(); }
      await wait(220);
    }
    /* press and hold, slide onto a quick-add button, let go */
    async function press(sel, pick, fx, fy) {
      var el = find(sel), p = await moveTo(el, fx, fy);
      touch.classList.add('is-press'); holdRing(p.cx, p.cy);
      await wait((HOLD_MS + 60) / PACE); /* a real-length hold */
      holdOpen(find(sel), p.cx, p.cy); touch.classList.remove('is-press');
      await wait(520);
      var b = hold.el && hold.el.querySelector('[data-act="qa:' + pick + '"]'); if (!b) throw 'stop';
      var r = b.getBoundingClientRect(), pr = phone.getBoundingClientRect();
      touch.classList.add('is-drag');
      touch.style.transform = 'translate(' + ((r.left + r.width / 2 - pr.left) / scale).toFixed(1) + 'px,' + ((r.top + r.height / 2 - pr.top) / scale).toFixed(1) + 'px)';
      await wait(380); holdHot(pick);
      await wait(520);
      touch.classList.remove('is-drag'); holdPick(pick);
      await wait(300);
    }
    async function type(k, text) {
      await tap('[data-k="' + k + '"]', 0.3);
      kb(true); await wait(380);
      var chars = Array.from(text);
      for (var i = 1; i <= chars.length; i++) {
        var el = find('[data-k="' + k + '"]');
        el.value = chars.slice(0, i).join('');
        el.dispatchEvent(new Event('input', { bubbles: true }));
        kbHit(chars[i - 1]);
        await wait(55 + Math.random() * 65);
      }
    }
    async function swipe(sel, d, ms, axis) {
      ms = Math.round(ms * PACE);
      var el = find(sel), x = axis === 'x', from = x ? el.scrollLeft : el.scrollTop, t0 = null, paused = 0, pausedAt = 0;
      var p = point(el, x ? (d > 0 ? 0.78 : 0.25) : 0.62, x ? 0.5 : (d > 0 ? 0.72 : 0.32));
      touch.style.transform = 'translate(' + p.x.toFixed(1) + 'px,' + p.y.toFixed(1) + 'px)';
      touch.classList.add('is-on', 'is-drag');
      await wait(420);
      var dx = x ? -Math.sign(d) * 170 : 0, dy = x ? 0 : -Math.sign(d) * 180;
      touch.style.transition = 'transform ' + ms + 'ms cubic-bezier(.45,0,.25,1), opacity .25s';
      touch.style.transform = 'translate(' + (p.x + dx).toFixed(1) + 'px,' + Math.max(40, Math.min(800, p.y + dy)).toFixed(1) + 'px)';
      var snap = el.style.scrollSnapType; el.style.scrollSnapType = 'none';
      var t = demo.token;
      await new Promise(function (res, rej) {
        (function frame(n) {
          if (t !== demo.token) { el.style.scrollSnapType = snap; return rej('stop'); }
          syncPause();
          if (demo.paused) { if (!pausedAt) pausedAt = n; return nextFrame(frame); }
          if (pausedAt) { paused += n - pausedAt; pausedAt = 0; }
          if (t0 === null) t0 = n;
          var k = Math.min(1, (n - t0 - paused) / ms), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
          if (x) el.scrollLeft = from + d * e; else el.scrollTop = from + d * e;
          if (k >= 1) res(); else nextFrame(frame);
        })(performance.now());
      });
      el.style.scrollSnapType = snap;
      touch.style.transition = '';
      touch.classList.remove('is-drag');
      await wait(250);
    }

    tour.__an = {
      step: function (id) { activate(id, 'replay'); }, dark: function (on) { stepDark = false; baseDark = !!on; if (app) applyTheme(true); },
      state: function () { return st; }, view: function () { return st && st.view; }, demo: function () { return demo.on; },
      active: function () { return activeStep; }, stop: function () { stopDemo(); ctlState('drive'); }
    };
    var lazy = function () {
      var r = tour.getBoundingClientRect();
      if (r.top < window.innerHeight + 800 && r.bottom > -800) { window.removeEventListener('scroll', lazy); mount(); observe(); }
    };
    window.addEventListener('scroll', lazy, { passive: true });
    lazy();
  }

  tours.forEach(create);
})();
