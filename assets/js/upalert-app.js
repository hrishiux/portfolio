/* Up.alert case study — the dashboard rebuilt as a working prototype from the
   Figma frames (Notification Dashboard (upalert) - FINAL). Each
   <figure class="ua-fig" data-ua="…"> gets its own copy of the app, opened on
   the screen that section of the write-up talks about. The screenshot inside
   the figure is the no-JS fallback.

   Copy inside the app is the copy from the frames, as written. */
(function () {
  'use strict';

  var figs = document.querySelectorAll('.ua-fig[data-ua]');
  if (!figs.length) return;

  var W = 1200;            /* the app is laid out at this width, then scaled to the column */
  var MIN_SCALE = 0.62;    /* below this it scrolls sideways instead of shrinking further */
  var PAGE = 7;

  /* ------------------------------------------------------------------ data */
  var BODY1 = 'Start Trading in Share Market, SIP, IPOs, Mutual Fund, Indices and Commodity at Upstox.com with hassle free process.';
  var BODY2 = 'Welcome to Upstox $name ! your current balance is $funds.';
  var URL1 = 'https://upstox.com/stocks/axis-bank-limited-share-price/INE238A01034/';
  var BANNER = 'Upstox will be down for maintenance this Saturday Jun 3, 2020 between the hours of 9:00 - 13:00 IST';
  var TYPES = ['Push Notification', 'In-app alert', 'Combined notifiers'];
  var EDITOR = 'Firstname Lastname';
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function stamp(day, mins) {
    var h = 19 - Math.floor(mins / 60), m = mins % 60, hh = ((h + 11) % 12) + 1;
    return { d: day, t: MONTHS[9] + ' ' + day + ', 2021 ' + hh + ':' + (m < 10 ? '0' : '') + m + ' ' + (h >= 12 ? 'PM' : 'AM') };
  }
  function seedMessages() {
    var out = [];
    for (var i = 0; i < 24; i++) {
      var s = stamp(26 - Math.floor(i * 0.95), i === 0 ? 23 : (23 + i * 37) % 300);
      var test = i % 7 === 5;
      out.push({
        id: 'm' + i,
        title: i === 2 ? 'Title 1' : 'Welcome Message ' + (i + 1),
        body: i % 3 === 2 ? BODY2 : BODY1,
        type: TYPES[i % 3],
        status: ['sent', 'sent', 'draft', 'failed'][i % 4],
        day: s.d, time: s.t,
        mode: test ? 'test' : 'production',
        to: 'target',
        list: test ? 'Test_1' : 'List_' + ((i % 5) + 1),
        url: i % 2 ? URL1 : '',
        dismissible: true,
        action: ['Chevron', 'CTA', 'None'][i % 3],
        cta: 'Got it'
      });
    }
    return out;
  }
  function seedLists() {
    var out = [], names = ['Test_1', 'Test_2'];
    for (var n = 1; n <= 22; n++) names.push('List_' + n);
    names.forEach(function (name, i) {
      var s = stamp(26 - Math.floor(i * 0.8), (23 + i * 41) % 300);
      out.push({ id: 'l' + i, name: name, devices: 1000, added: s.t, modified: s.t,
        status: i === 5 ? 'failed' : i === 8 ? 'progress' : 'completed' });
    });
    return out;
  }
  function blankDraft(mode) {
    return { id: null, mode: mode || 'test', to: 'target', list: null, listQ: '', title: '', body: '', url: '', type: null, dismissible: true, action: 'none', cta: '' };
  }

  var PRESETS = {
    dashboard: { view: 'list', banners: ['critical', 'warning'] },
    states: { view: 'list', listState: 'loading', hold: true },
    create: { view: 'create' },
    audiences: { view: 'audiences' },
    rows: { view: 'list', q: '$name', expandAll: true },
    detail: { view: 'detail', current: 'm1' },
    history: { view: 'list', filter: 'sent' },
    review: { view: 'review', draft: { id: null, mode: 'production', to: 'target', list: 'List_1', listQ: '', title: 'Welcome Message 1', body: BODY1, url: URL1, type: 'Push Notification', dismissible: true, action: 'chevron', cta: '' } }
  };

  /* ----------------------------------------------------------------- icons */
  var I = {
    search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg>',
    down: '<svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>',
    expand: '<svg viewBox="0 0 24 24"><path d="M14 4h6v6M20 4l-7 7M10 20H4v-6M4 20l7-7"/></svg>',
    collapse: '<svg viewBox="0 0 24 24"><path d="M20 10h-6V4M14 10l7-7M4 14h6v6M10 14l-7 7"/></svg>',
    plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
    edit: '<svg viewBox="0 0 24 24"><path d="M4 20l1-4L16 5l3 3L8 19z"/></svg>',
    copy: '<svg viewBox="0 0 24 24"><rect x="8" y="8" width="11" height="11" rx="1.5"/><path d="M5 15V6a1 1 0 0 1 1-1h9"/></svg>',
    trash: '<svg viewBox="0 0 24 24"><path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12"/></svg>',
    back: '<svg viewBox="0 0 24 24"><path d="M20 12H5M11 6l-6 6 6 6"/></svg>',
    pause: '<svg viewBox="0 0 24 24"><path d="M9 6v12M15 6v12"/></svg>',
    play: '<svg viewBox="0 0 24 24"><path d="M8 5l11 7-11 7z"/></svg>',
    alert: '<svg viewBox="0 0 24 24"><path d="M12 2.5l9.5 9.5-9.5 9.5L2.5 12z" class="f"/><path d="M12 7.5v5.5M12 16.2v.3" class="w"/></svg>',
    bang: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" class="f"/><path d="M12 7v6.5M12 16.6v.4" class="w"/></svg>',
    ok: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" class="f"/><path d="M7.5 12.5l3 3 6-6.5" class="w"/></svg>',
    user: '<svg viewBox="0 0 24 24"><circle cx="12" cy="9" r="3.6"/><path d="M5.5 19.5c1-3.4 3.5-5 6.5-5s5.5 1.6 6.5 5"/></svg>',
    file: '<svg viewBox="0 0 24 24"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/></svg>'
  };

  /* --------------------------------------------------------------- helpers */
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function vars(s) { return esc(s).replace(/\$[a-z_]+/gi, function (m) { return '<span class="ua-var">' + m + '</span>'; }); }
  function clip(s, n) { return s.length > n ? s.slice(0, n).replace(/\s+\S*$/, '') + '…' : s; }
  function chip(status) {
    var L = { sent: 'Sent', draft: 'Draft', failed: 'Failed', paused: 'Paused', completed: 'Completed', progress: 'In progress' };
    return '<span class="ua-chip ua-chip--' + status + '">' + L[status] + '</span>';
  }
  function btn(act, label, cls, extra) { return '<button type="button" class="' + (cls || 'ua-btn') + '" data-act="' + act + '"' + (extra || '') + '>' + label + '</button>'; }
  function radio(name, value, label, checked, disabled, k) {
    return '<label class="ua-radio' + (disabled ? ' is-off' : '') + '"><input type="radio" name="' + name + '" value="' + esc(value) + '" data-k="' + (k || name + ':' + value) + '"' + (checked ? ' checked' : '') + (disabled ? ' disabled' : '') + '><i></i><span>' + label + '</span></label>';
  }

  /* ======================================================== one app instance */
  function App(fig) {
    var kind = fig.getAttribute('data-ua');
    var preset = PRESETS[kind] || PRESETS.dashboard;
    var root, scaleEl, appEl, stage, st, toastTimer = 0, loadTimer = 0, uid = Math.random().toString(36).slice(2, 7);

    function fresh() {
      var draft = preset.draft ? JSON.parse(JSON.stringify(preset.draft)) : blankDraft();
      st = {
        view: preset.view, listState: preset.listState || 'ready', hold: !!preset.hold,
        filter: preset.filter || 'all', q: preset.q || '', days: 'all', daysOpen: false, page: 1,
        expandAll: !!preset.expandAll, open: {}, banners: (preset.banners || []).slice(),
        msgs: seedMessages(), lists: seedLists(),
        audFilter: 'all', audQ: '', audPage: 1,
        draft: draft, current: preset.current || null,
        modal: null, toast: null, picker: null, flash: null
      };
    }

    /* ---------- derived ---------- */
    function msgById(id) { for (var i = 0; i < st.msgs.length; i++) if (st.msgs[i].id === id) return st.msgs[i]; return null; }
    function countOf(f) { return st.msgs.filter(function (m) { return f === 'all' || m.status === f || (f === 'sent' && m.status === 'paused'); }).length; }
    function visibleMsgs() {
      var q = st.q.trim().toLowerCase(), latest = 26;
      return st.msgs.filter(function (m) {
        if (st.filter !== 'all' && !(m.status === st.filter || (st.filter === 'sent' && m.status === 'paused'))) return false;
        if (st.days === '7' && m.day < latest - 6) return false;
        if (q && (m.title + ' ' + m.body).toLowerCase().indexOf(q) < 0) return false;
        return true;
      });
    }
    function listMode(l) { return /^test_/i.test(l.name) ? 'test' : 'production'; }
    function visibleLists() {
      var q = st.audQ.trim().toLowerCase();
      return st.lists.filter(function (l) {
        if (st.audFilter !== 'all' && listMode(l) !== st.audFilter) return false;
        return !q || l.name.toLowerCase().indexOf(q) > -1;
      });
    }
    function pickable() {
      var d = st.draft, q = d.listQ.trim().toLowerCase();
      return st.lists.filter(function (l) {
        return l.status === 'completed' && listMode(l) === d.mode && (!q || l.name.toLowerCase().indexOf(q) > -1);
      });
    }
    function draftReady() {
      var d = st.draft;
      return d.title.trim() && d.body.trim() && d.type && (d.to !== 'target' || d.list);
    }
    function audienceLabel(d) { return { all: 'All Users', customers: 'All customers', target: 'Target users' }[d.to]; }
    function deviceCount(d) {
      if (d.to !== 'target') return null;
      for (var i = 0; i < st.lists.length; i++) if (st.lists[i].name === d.list) return st.lists[i].devices;
      return 1000;
    }

    /* ---------- views ---------- */
    function topNav(active) {
      return '<header class="ua-top"><span class="ua-logo">upstox</span><nav class="ua-tabs">' +
        btn('nav-list', 'Notification creation', 'ua-tab' + (active === 'list' ? ' is-on' : '')) +
        btn('nav-aud', 'Audiences', 'ua-tab' + (active === 'aud' ? ' is-on' : '')) +
        '</nav><span class="ua-avatar" aria-label="Signed in">' + I.user + '</span></header>';
    }
    function subNav(title, act) {
      return '<header class="ua-top ua-top--sub">' + btn(act, I.back + '<span class="ua-sr">Back</span>', 'ua-iconbtn ua-iconbtn--plain') + '<p class="ua-title">' + esc(title) + '</p></header>';
    }
    function pager(page, pages, act) {
      if (pages < 2) return '';
      var h = '<nav class="ua-pager">' + btn(act + ':' + (page - 1), 'Previous', 'ua-link', page === 1 ? ' disabled' : '');
      for (var p = 1; p <= pages; p++) h += btn(act + ':' + p, String(p), 'ua-page' + (p === page ? ' is-on' : ''), p === page ? ' aria-current="page"' : '');
      return h + btn(act + ':' + (page + 1), 'Next', 'ua-link', page === pages ? ' disabled' : '') + '</nav>';
    }

    function viewList() {
      var ready = st.listState === 'ready';
      var side = [['all', 'All'], ['sent', 'Sent'], ['draft', 'Drafts'], ['failed', 'Failed']].map(function (f) {
        var n = countOf(f[0]);
        return '<button type="button" class="ua-side__item' + (st.filter === f[0] && ready ? ' is-on' : '') + '" data-act="filter:' + f[0] + '"' + (ready ? '' : ' disabled') + '><span>' + f[1] + '</span>' + (ready ? '<b>' + (n > 99 ? '99+' : n) + '</b>' : '') + '</button>';
      }).join('');

      var banners = st.banners.map(function (b) {
        return '<div class="ua-banner ua-banner--' + b + '"><div><p class="ua-banner__t">' + I.alert + 'Attention required</p><p>' + esc(BANNER) + '</p></div>' + btn('banner:' + b, 'Got it', 'ua-pill ua-pill--' + (b === 'critical' ? 'light' : 'solid')) + '</div>';
      }).join('');

      var dis = ready ? '' : ' disabled';
      var days = { all: 'All days', '7': 'Last 7 days' }[st.days];
      var tools = '<div class="ua-tools">' +
        '<label class="ua-search">' + I.search + '<input type="search" placeholder="Search in all messages" value="' + esc(st.q) + '" data-k="q"' + dis + '></label>' +
        btn('search', 'Search', 'ua-pill', dis) +
        '<span class="ua-menu">' + btn('days', days + I.down, 'ua-pill ua-pill--soft', dis + ' aria-expanded="' + st.daysOpen + '"') +
          (st.daysOpen ? '<span class="ua-menu__list">' + btn('day:all', 'All days', 'ua-menu__item') + btn('day:7', 'Last 7 days', 'ua-menu__item') + '</span>' : '') + '</span>' +
        btn('expand', (st.expandAll ? I.collapse + 'Collapse' : I.expand + 'Expand'), 'ua-pill', dis) +
        btn('new', I.plus + 'New message', 'ua-cta', st.listState === 'loading' || st.listState === 'failed' ? ' disabled' : '') + '</div>';

      var head = '<thead><tr><th>Title</th><th>Body</th><th>Last edited by</th><th>Type</th><th>Time of delivery</th><th>Status</th><th><span class="ua-sr">Actions</span></th></tr></thead>';
      var body = '', pagerH = '';
      if (st.listState === 'loading') body = '<tr class="ua-empty"><td colspan="7"><span class="ua-spin" role="status" aria-label="Loading"></span></td></tr>';
      else if (st.listState === 'failed') body = '<tr class="ua-empty"><td colspan="7"><p>Failed to load page</p>' + btn('retry', 'Try again', 'ua-pill') + '</td></tr>';
      else if (st.listState === 'empty') body = '<tr class="ua-empty"><td colspan="7"><p>No messages created yet</p>' + btn('new', 'Create new message', 'ua-pill') + '</td></tr>';
      else {
        var all = visibleMsgs(), pages = Math.max(1, Math.ceil(all.length / PAGE));
        if (st.page > pages) st.page = pages;
        var rows = all.slice((st.page - 1) * PAGE, st.page * PAGE);
        if (!rows.length) body = '<tr class="ua-empty"><td colspan="7"><p>No messages match &ldquo;' + esc(st.q) + '&rdquo;</p></td></tr>';
        rows.forEach(function (m) {
          var open = st.expandAll || st.open[m.id];
          body += '<tr class="ua-row' + (open ? ' is-open' : '') + (st.flash === m.id ? ' is-new' : '') + '" data-row="' + m.id + '">' +
            '<td><button type="button" class="ua-rowlink" data-act="open:' + m.id + '">' + esc(m.title) + '</button></td>' +
            '<td>' + (open ? vars(m.body) : esc(clip(m.body, 20))) + '</td>' +
            '<td>' + EDITOR + '</td><td>' + m.type + '</td><td>' + m.time + '</td><td>' + chip(m.status) + '</td>' +
            '<td class="ua-acts">' + btn('edit:' + m.id, I.edit, 'ua-iconbtn', ' aria-label="Edit ' + esc(m.title) + '"') +
              btn('dup:' + m.id, I.copy, 'ua-iconbtn', ' aria-label="Duplicate ' + esc(m.title) + '"') +
              btn('del:' + m.id, I.trash, 'ua-iconbtn', ' aria-label="Delete ' + esc(m.title) + '"') +
              btn('row:' + m.id, open ? I.collapse : I.expand, 'ua-iconbtn', ' aria-label="' + (open ? 'Collapse' : 'Expand') + ' row" aria-expanded="' + !!open + '"') + '</td></tr>';
        });
        pagerH = pager(st.page, pages, 'page');
      }
      return topNav('list') + '<div class="ua-body"><aside class="ua-side">' + side + '</aside><main class="ua-main">' + banners + tools +
        '<table class="ua-table">' + head + '<tbody>' + body + '</tbody></table>' + pagerH + '</main></div>';
    }

    function viewAudiences() {
      var side = [['all', 'All'], ['production', 'Production'], ['test', 'Test']].map(function (f) {
        var n = st.lists.filter(function (l) { return f[0] === 'all' || listMode(l) === f[0]; }).length;
        return '<button type="button" class="ua-side__item' + (st.audFilter === f[0] ? ' is-on' : '') + '" data-act="afilter:' + f[0] + '"><span>' + f[1] + '</span><b>' + n + '</b></button>';
      }).join('');
      var all = visibleLists(), pages = Math.max(1, Math.ceil(all.length / PAGE));
      if (st.audPage > pages) st.audPage = pages;
      var rows = all.slice((st.audPage - 1) * PAGE, st.audPage * PAGE).map(function (l) {
        return '<tr class="ua-row' + (st.flash === l.id ? ' is-new' : '') + '"><td>' + esc(l.name) + '</td><td>' + l.devices + '</td><td>' + EDITOR + '</td><td>' + l.added + '</td><td>' + l.modified + '</td><td>' + chip(l.status) + '</td>' +
          '<td class="ua-acts">' + btn('lreplace:' + l.id, I.edit, 'ua-iconbtn', ' aria-label="Replace ' + esc(l.name) + '"') + btn('ldel:' + l.id, I.trash, 'ua-iconbtn', ' aria-label="Delete ' + esc(l.name) + '"') + '</td></tr>';
      }).join('') || '<tr class="ua-empty"><td colspan="7"><p>No lists match &ldquo;' + esc(st.audQ) + '&rdquo;</p></td></tr>';
      return topNav('aud') + '<div class="ua-body"><aside class="ua-side">' + side + '</aside><main class="ua-main"><div class="ua-tools">' +
        '<label class="ua-search">' + I.search + '<input type="search" placeholder="Search in the list" value="' + esc(st.audQ) + '" data-k="audq"></label>' +
        btn('asearch', 'Search', 'ua-pill') + btn('addlist', I.plus + 'Add new list', 'ua-cta') + '</div>' +
        '<table class="ua-table ua-table--aud"><thead><tr><th>Name</th><th>Devices</th><th>Last edited by</th><th>Date added</th><th>Date modified</th><th>Status</th><th><span class="ua-sr">Actions</span></th></tr></thead><tbody>' + rows + '</tbody></table>' +
        pager(st.audPage, pages, 'apage') + '</main></div>';
    }

    function viewCreate() {
      var d = st.draft, test = d.mode === 'test', lists = pickable();
      var left =
        '<div class="ua-seg" role="radiogroup" aria-label="Mode">' +
          radio('mode-' + uid, 'test', 'Test mode', test, false, 'mode:test') + radio('mode-' + uid, 'production', 'Production mode', !test, false, 'mode:production') + '</div>' +
        '<fieldset class="ua-card"><legend>To</legend>' +
          radio('to-' + uid, 'all', 'All Users', d.to === 'all', test, 'to:all') +
          radio('to-' + uid, 'customers', 'All customers', d.to === 'customers', test, 'to:customers') +
          radio('to-' + uid, 'target', 'Target users', d.to === 'target', false, 'to:target') + '</fieldset>' +
        '<fieldset class="ua-card' + (d.to === 'target' ? '' : ' is-off') + '"' + (d.to === 'target' ? '' : ' disabled') + '><legend>Select target audience list (' + lists.length + ')</legend>' +
          '<label class="ua-search ua-search--full">' + I.search + '<input type="search" placeholder="Start typing to filter lists" value="' + esc(d.listQ) + '" data-k="listq"></label>' +
          '<div class="ua-picklist" data-k="picklist">' + (lists.map(function (l) {
            return radio('list-' + uid, l.name, esc(l.name) + '<small>' + l.devices + ' devices</small>', d.list === l.name, false, 'list:' + l.name);
          }).join('') || '<p class="ua-note">No lists match.</p>') + '</div></fieldset>';
      var dismissOk = d.type === 'In-app alert' || d.type === 'Combined notifiers';
      var right =
        '<p class="ua-h2">Define your content</p>' +
        '<div class="ua-card"><label class="ua-field"><span>Title</span><input type="text" maxlength="30" value="' + esc(d.title) + '" data-k="title"></label><p class="ua-count">' + d.title.length + '/30 characters</p>' +
          '<label class="ua-field"><span>Body</span><textarea maxlength="300" rows="3" data-k="body">' + esc(d.body) + '</textarea></label><p class="ua-count">' + d.body.length + '/300 characters</p>' +
          '<label class="ua-field"><span>URL <em>(optional)</em></span><input type="url" value="' + esc(d.url) + '" data-k="url"></label></div>' +
        '<div class="ua-card"><p class="ua-legend">Message Type</p><div class="ua-row3">' +
          radio('type-' + uid, 'Push Notification', 'Push notification', d.type === 'Push Notification', false, 'type:push') +
          radio('type-' + uid, 'In-app alert', 'In-app alert', d.type === 'In-app alert', false, 'type:inapp') +
          radio('type-' + uid, 'Combined notifiers', 'Combined notifiers', d.type === 'Combined notifiers', false, 'type:combined') + '</div>' +
          '<label class="ua-toggle' + (dismissOk ? '' : ' is-off') + '"><span>Dismissible</span><input type="checkbox" role="switch" data-k="dismiss"' + (d.dismissible ? ' checked' : '') + (dismissOk ? '' : ' disabled') + '><i></i></label>' +
          '<p class="ua-legend">Action</p><div class="ua-row3">' +
          radio('act-' + uid, 'none', 'None', d.action === 'none', false, 'action:none') +
          radio('act-' + uid, 'chevron', 'Chevron', d.action === 'chevron', false, 'action:chevron') +
          radio('act-' + uid, 'cta', 'CTA', d.action === 'cta', false, 'action:cta') + '</div>' +
          '<input class="ua-input" type="text" maxlength="20" aria-label="CTA label" value="' + esc(d.cta) + '" data-k="cta"' + (d.action === 'cta' ? '' : ' disabled') + '></div>' +
        '<div class="ua-actions">' + btn('cancel', 'Back', 'ua-pill ua-pill--lg') + btn('review', 'Review message', 'ua-cta ua-cta--lg', draftReady() ? '' : ' disabled') + '</div>';
      return subNav(d.id ? 'Edit message' : 'Create new message', 'cancel') + '<div class="ua-form"><div class="ua-form__l">' + left + '</div><div class="ua-form__r">' + right + '</div></div>';
    }

    function kv(k, v, cls) { return '<div class="ua-kv"><dt>' + k + '</dt><dd' + (cls ? ' class="' + cls + '"' : '') + '>' + v + '</dd></div>'; }
    function summary(m, withStats) {
      var act = { none: 'None', chevron: 'Chevron', cta: 'CTA' }[String(m.action).toLowerCase()] || m.action;
      var left = '<dl class="ua-card">' + kv('Mode', m.mode === 'test' ? 'Test' : 'Production', m.mode === 'test' ? 'is-test' : 'is-prod') +
        kv('Audience', audienceLabel(m)) + (m.to === 'target' ? kv('Selected target audience list', esc(m.list)) : '') + '</dl>' +
        '<dl class="ua-card">' + kv('Message type', m.type) + kv('Dismissible', m.dismissible && m.type !== 'Push Notification' ? 'Yes' : 'No') +
        kv('Action', act + (String(m.action).toLowerCase() === 'cta' && m.cta ? ' &middot; &ldquo;' + esc(m.cta) + '&rdquo;' : '')) +
        (m.status ? kv('Status', { sent: 'Sent', draft: 'Draft', failed: 'Failed', paused: 'Paused' }[m.status], 'is-' + m.status) : '') + '</dl>';
      var right = '<dl class="ua-card">' + kv('Title', esc(m.title)) + kv('Body', vars(m.body)) + (m.url ? kv('URL', '<a href="' + esc(m.url) + '" target="_blank" rel="noopener">' + esc(m.url) + '</a>') : '') + '</dl>';
      if (withStats) {
        var live = m.status === 'sent' || m.status === 'paused';
        right += '<dl class="ua-card">' + kv('Send to', live ? '1000' : '&mdash;') + kv('Clicked by', live ? '870 Devices' : '&mdash;') + kv('Click percentage', live ? '87%' : '&mdash;') + '</dl>';
      }
      return '<div class="ua-sum"><div>' + left + '</div><div>' + right + '</div></div>';
    }
    function viewReview() {
      return subNav('Review message', 'review-back') + '<div class="ua-detail">' + summary(st.draft, false) +
        '<div class="ua-actions">' + btn('review-back', 'Back', 'ua-pill ua-pill--lg') + btn('send', 'Send message', 'ua-cta ua-cta--lg') + '</div></div>';
    }
    function viewDetail() {
      var m = msgById(st.current);
      if (!m) { st.view = 'list'; return viewList(); }
      var canPause = (m.status === 'sent' || m.status === 'paused') && m.type !== 'Push Notification';
      return subNav('Messages', 'nav-list') + '<div class="ua-detail">' + summary(m, true) + '<div class="ua-actions">' +
        (canPause ? btn('pause:' + m.id, m.status === 'paused' ? I.play + 'Resume' : I.pause + 'Pause', 'ua-pill') : '') +
        btn('dup:' + m.id, 'Duplicate', 'ua-pill') + btn('edit:' + m.id, 'Edit', 'ua-pill') + btn('del:' + m.id, 'Delete', 'ua-pill') + '</div></div>';
    }

    function overlays() {
      var h = '';
      if (st.modal) {
        var md = st.modal;
        h += '<div class="ua-scrim" data-act="modal-close"></div><div class="ua-modal ua-modal--' + md.kind + '" role="alertdialog" aria-modal="true" aria-labelledby="ua-mt-' + uid + '">' +
          '<span class="ua-modal__icon">' + I.bang + '</span>';
        if (md.kind === 'send') {
          h += '<p class="ua-modal__t" id="ua-mt-' + uid + '">Confirm sending the message</p><p>The message will be sent to ' + (md.devices == null ? 'all' : md.devices) + ' devices. Are you sure?</p>' +
            '<div class="ua-modal__btns">' + btn('modal-close', 'Review', 'ua-pill ua-pill--lg') + btn('send-confirm', 'Send', 'ua-cta ua-cta--lg') + '</div>';
        } else {
          h += '<p class="ua-modal__t" id="ua-mt-' + uid + '">Are you sure you want to delete &lsquo;' + esc(md.name) + '&rsquo;' + (md.kind === 'del' ? ' Message' : '') + '?</p>' +
            '<div class="ua-modal__btns">' + btn(md.kind === 'del' ? 'del-confirm' : 'ldel-confirm', 'Confirm', 'ua-cta ua-cta--lg ua-cta--danger') + btn('modal-close', 'Cancel', 'ua-pill ua-pill--lg') + '</div>';
        }
        h += '</div>';
      }
      if (st.picker) {
        h += '<div class="ua-scrim ua-scrim--grey" data-act="picker-close"></div><div class="ua-picker" role="dialog" aria-label="Choose a file">' +
          '<p class="ua-picker__t">' + (st.picker.replace ? 'Replace ' + esc(st.picker.replace) : 'Upload a list') + '</p>' +
          '<p class="ua-note">Stands in for the system file picker. Pick a file to see what happens.</p>' +
          [['List_23.csv', 'ok'], ['Test_3.csv', 'ok'], ['List_24.xlsx', 'type'], ['List_25.csv', 'err']].map(function (f) {
            return '<button type="button" class="ua-file" data-act="file:' + f[0] + ':' + f[1] + '">' + I.file + '<span>' + f[0] + '</span></button>';
          }).join('') + btn('picker-close', 'Cancel', 'ua-pill') + '</div>';
      }
      if (st.toast) h += '<div class="ua-toast" role="status">' + (st.toast.ok ? I.ok : I.bang) + '<span>' + esc(st.toast.text) + '</span></div>';
      return h;
    }

    /* ---------- render, keeping focus and caret ---------- */
    function render() {
      var a = document.activeElement, keep = null;
      if (a && appEl.contains(a)) {
        keep = { k: a.getAttribute('data-k'), act: a.getAttribute('data-act'), s: a.selectionStart, e: a.selectionEnd };
      }
      var scrolls = {};
      appEl.querySelectorAll('[data-k="picklist"]').forEach(function (el) { scrolls.picklist = el.scrollTop; });

      var v = st.view === 'audiences' ? viewAudiences() : st.view === 'create' ? viewCreate() : st.view === 'review' ? viewReview() : st.view === 'detail' ? viewDetail() : viewList();
      appEl.innerHTML = '<div class="ua-view">' + v + '</div>' + overlays();

      if (scrolls.picklist != null) { var pl = appEl.querySelector('[data-k="picklist"]'); if (pl) pl.scrollTop = scrolls.picklist; }
      if (st.modal) { var first = appEl.querySelector('.ua-modal button'); if (first) first.focus({ preventScroll: true }); return; }
      if (st.picker) { var pf = appEl.querySelector('.ua-file'); if (pf) pf.focus({ preventScroll: true }); return; }
      if (keep) {
        var el = keep.k ? appEl.querySelector('[data-k="' + keep.k + '"]') : keep.act ? appEl.querySelector('[data-act="' + keep.act + '"]') : null;
        if (el && !el.disabled) {
          el.focus({ preventScroll: true });
          if (keep.s != null && el.setSelectionRange && /^(text|search|url)$|textarea/i.test(el.type || el.tagName)) { try { el.setSelectionRange(keep.s, keep.e); } catch (e) {} }
        }
      }
    }
    function toast(text, ok) {
      clearTimeout(toastTimer);
      st.toast = { text: text, ok: ok };
      render();
      toastTimer = setTimeout(function () { st.toast = null; render(); }, 3200);
    }
    function flash(id) { st.flash = id; setTimeout(function () { if (st.flash === id) { st.flash = null; } }, 1600); }
    function go(view) { st.view = view; st.daysOpen = false; render(); if (stage) stage.scrollLeft = 0; }

    /* ---------- actions ---------- */
    function act(a) {
      var p = a.split(':'), cmd = p[0], arg = p.slice(1).join(':');
      var m = arg ? msgById(arg) : null;
      switch (cmd) {
        case 'nav-list': st.view = 'list'; break;
        case 'nav-aud': st.view = 'audiences'; break;
        case 'filter': st.filter = arg; st.page = 1; break;
        case 'page': st.page = +arg; break;
        case 'search': break;
        case 'days': st.daysOpen = !st.daysOpen; break;
        case 'day': st.days = arg; st.daysOpen = false; st.page = 1; break;
        case 'expand': st.expandAll = !st.expandAll; st.open = {}; break;
        case 'row': if (st.expandAll) { st.expandAll = false; st.open = {}; visibleMsgs().forEach(function (x) { st.open[x.id] = true; }); } st.open[arg] = !st.open[arg]; break;
        case 'banner': st.banners = st.banners.filter(function (b) { return b !== arg; }); break;
        case 'retry':
          st.listState = 'loading'; st.hold = false; render();
          clearTimeout(loadTimer); loadTimer = setTimeout(function () { st.listState = 'ready'; render(); syncStates(); }, 1100);
          syncStates(); return;
        case 'new': st.draft = blankDraft(); st.view = 'create'; break;
        case 'open': st.current = arg; st.view = 'detail'; break;
        case 'edit': if (m) { st.draft = draftFrom(m, true); st.view = 'create'; } break;
        case 'dup': if (m) { st.draft = draftFrom(m, false); st.view = 'create'; } break;
        case 'del': if (m) st.modal = { kind: 'del', id: m.id, name: m.title }; break;
        case 'del-confirm':
          st.msgs = st.msgs.filter(function (x) { return x.id !== st.modal.id; });
          if (st.view === 'detail') st.view = 'list';
          st.modal = null; break;
        case 'pause': if (m) m.status = m.status === 'paused' ? 'sent' : 'paused'; break;
        case 'cancel': st.view = 'list'; break;
        case 'review': if (draftReady()) st.view = 'review'; break;
        case 'review-back': st.view = 'create'; break;
        case 'send': st.modal = { kind: 'send', devices: deviceCount(st.draft) }; break;
        case 'send-confirm': sendDraft(); return;
        case 'modal-close': st.modal = null; break;
        /* audiences */
        case 'afilter': st.audFilter = arg; st.audPage = 1; break;
        case 'apage': st.audPage = +arg; break;
        case 'asearch': break;
        case 'addlist': st.picker = {}; break;
        case 'lreplace': var lr = listById(arg); if (lr) st.picker = { replace: lr.name, id: lr.id }; break;
        case 'picker-close': st.picker = null; break;
        case 'file': pickFile(p[1], p[2]); return;
        case 'ldel': var ld = listById(arg); if (ld) st.modal = { kind: 'ldel', id: ld.id, name: ld.name }; break;
        case 'ldel-confirm': st.lists = st.lists.filter(function (x) { return x.id !== st.modal.id; }); st.modal = null; break;
        default: return;
      }
      if (cmd !== 'days' && cmd !== 'day') st.daysOpen = false;
      render();
      if (/^(nav-|open|edit|dup|new|cancel|review)/.test(cmd) && stage) stage.scrollLeft = 0;
    }
    function listById(id) { for (var i = 0; i < st.lists.length; i++) if (st.lists[i].id === id) return st.lists[i]; return null; }
    function draftFrom(m, keepId) {
      return { id: keepId ? m.id : null, mode: m.mode, to: m.to, list: m.list, listQ: '', title: m.title, body: m.body, url: m.url,
        type: m.type, dismissible: m.dismissible, action: String(m.action).toLowerCase(), cta: m.cta || '' };
    }
    function sendDraft() {
      var d = st.draft;
      var rec = { id: d.id || 'n' + Date.now(), title: d.title, body: d.body, type: d.type, status: 'sent', day: 27, time: 'Oct 27, 2021 10:30 AM',
        mode: d.mode, to: d.to, list: d.list, url: d.url, dismissible: d.dismissible, action: d.action, cta: d.cta };
      if (d.id) st.msgs = st.msgs.map(function (x) { return x.id === d.id ? rec : x; });
      else st.msgs.unshift(rec);
      st.modal = null; st.view = 'list'; st.filter = 'all'; st.q = ''; st.days = 'all'; st.page = 1; st.listState = 'ready';
      flash(rec.id);
      render();
      syncStates();
    }
    function pickFile(name, outcome) {
      var replace = st.picker && st.picker.id;
      st.picker = null;
      if (outcome === 'type') return toast('The uploaded file is not a .csv file, the list cannot be created.', false);
      if (outcome === 'err') return toast('The list cannot be created due to some error(s)', false);
      var base = name.replace(/\.csv$/, ''), t = 'Oct 27, 2021 10:30 AM';
      if (replace) {
        var l = listById(replace); if (l) { l.modified = t; l.status = 'progress'; flash(l.id); }
      } else {
        var rec = { id: 'u' + Date.now(), name: base, devices: 1000, added: t, modified: t, status: 'progress' };
        st.lists.unshift(rec); st.audFilter = 'all'; st.audQ = ''; st.audPage = 1; flash(rec.id);
      }
      toast('Upload Completed', true);
    }

    /* ---------- inputs ---------- */
    function onInput(e) {
      var t = e.target, k = t.getAttribute('data-k');
      if (!k) return;
      var d = st.draft;
      if (k === 'q') { st.q = t.value; st.page = 1; }
      else if (k === 'audq') { st.audQ = t.value; st.audPage = 1; }
      else if (k === 'listq') d.listQ = t.value;
      else if (k === 'title') d.title = t.value;
      else if (k === 'body') d.body = t.value;
      else if (k === 'url') d.url = t.value;
      else if (k === 'cta') d.cta = t.value;
      else if (k === 'dismiss') d.dismissible = t.checked;
      else if (/^mode:/.test(k)) {
        d.mode = t.value;
        if (d.mode === 'test') d.to = 'target';
        if (d.list && !pickable().some(function (l) { return l.name === d.list; })) d.list = null;
      }
      else if (/^to:/.test(k)) d.to = t.value;
      else if (/^list:/.test(k)) d.list = t.value;
      else if (/^type:/.test(k)) d.type = t.value;
      else if (/^action:/.test(k)) d.action = t.value;
      else return;
      render();
    }

    /* ---------- the state switcher outside the app (states figure only) ---------- */
    var switcher = null;
    function syncStates() {
      if (!switcher) return;
      var cur = st.view === 'list' ? st.listState : null;
      switcher.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-state') === cur)); });
    }

    /* ---------- full screen: the same copy, moved into a dialog and back ---------- */
    var fsDlg = null, swallowEsc = false;
    function openFull() {
      if (!fsDlg) {
        fsDlg = document.createElement('dialog');
        fsDlg.className = 'ua-fs';
        fsDlg.setAttribute('aria-label', 'Up.alert prototype, full screen');
        document.body.appendChild(fsDlg);
        fsDlg.addEventListener('cancel', function (e) {
          if (swallowEsc) { e.preventDefault(); swallowEsc = false; return; }
          e.preventDefault(); closeFull();
        });
        fsDlg.addEventListener('click', function (e) { if (e.target === fsDlg) closeFull(); });
      }
      fsDlg.appendChild(root);
      root.classList.add('is-full');
      root.querySelector('.ua-full').textContent = 'exit full screen';
      document.documentElement.style.overflow = 'hidden';
      fsDlg.showModal();
      fit();
      root.querySelector('.ua-full').focus({ preventScroll: true });
    }
    function closeFull() {
      document.documentElement.style.overflow = '';
      fig.insertBefore(root, fig.querySelector('figcaption'));
      root.classList.remove('is-full');
      root.querySelector('.ua-full').textContent = 'full screen';
      if (fsDlg && fsDlg.open) fsDlg.close();
      fit();
      root.querySelector('.ua-full').focus({ preventScroll: true });
    }

    /* ---------- scale to the column ---------- */
    function fit() {
      var avail = stage.clientWidth, s = Math.min(1, avail / W), scroll = s < MIN_SCALE;
      if (scroll) s = MIN_SCALE;
      appEl.style.transform = 'scale(' + s + ')';
      scaleEl.style.width = Math.round(W * s) + 'px';
      scaleEl.style.height = Math.round(appEl.offsetHeight * s) + 'px';
      root.classList.toggle('is-scroll', scroll);
    }

    /* ---------- mount ---------- */
    function mount() {
      fresh();
      root = document.createElement('div');
      root.className = 'ua-card-frame';
      var hint = fig.getAttribute('data-hint') || 'working prototype — click around';
      root.innerHTML =
        '<div class="ua-bar"><span class="ua-dots" aria-hidden="true"><i></i><i></i><i></i></span><span class="ua-url">up.alert</span>' +
        '<span class="ua-hint">' + esc(hint) + '</span><button type="button" class="ua-reset ua-full">full screen</button><button type="button" class="ua-reset">reset</button></div>' +
        (kind === 'states' ? '<div class="ua-states" role="group" aria-label="List state"><span>show</span>' +
          [['loading', 'loading'], ['failed', 'failed to load'], ['empty', 'nothing created yet'], ['ready', 'loaded']].map(function (s) {
            return '<button type="button" data-state="' + s[0] + '" aria-pressed="false">' + s[1] + '</button>';
          }).join('') + '</div>' : '') +
        '<p class="ua-swipe">swipe sideways to see the whole screen</p>' +
        '<div class="ua-stage"><div class="ua-scale"><div class="ua-app" role="group" aria-label="Up.alert prototype"></div></div></div>';
      var fb = fig.querySelector('.ua-fallback');
      if (fb) fb.remove();
      fig.insertBefore(root, fig.querySelector('figcaption'));
      stage = root.querySelector('.ua-stage'); scaleEl = root.querySelector('.ua-scale'); appEl = root.querySelector('.ua-app');
      appEl.style.width = W + 'px';
      switcher = root.querySelector('.ua-states');

      appEl.addEventListener('click', function (e) {
        var b = e.target.closest('[data-act]');
        if (!b || b.disabled || !appEl.contains(b)) {
          if (st.daysOpen && !e.target.closest('.ua-menu')) { st.daysOpen = false; render(); }
          return;
        }
        e.preventDefault();
        act(b.getAttribute('data-act'));
      });
      appEl.addEventListener('input', onInput);
      appEl.addEventListener('change', function (e) { if (e.target.type === 'radio' || e.target.type === 'checkbox') onInput(e); });
      appEl.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && (st.modal || st.picker || st.daysOpen)) { swallowEsc = true; st.modal = null; st.picker = null; st.daysOpen = false; render(); }
        if (e.key === 'Enter' && e.target.getAttribute('data-k') === 'q') e.preventDefault();
      });
      root.querySelector('.ua-full').addEventListener('click', function () { if (root.classList.contains('is-full')) closeFull(); else openFull(); });
      root.querySelector('.ua-reset:not(.ua-full)').addEventListener('click', function () {
        clearTimeout(toastTimer); clearTimeout(loadTimer); fresh(); render(); syncStates(); stage.scrollLeft = 0;
      });
      if (switcher) switcher.addEventListener('click', function (e) {
        var b = e.target.closest('button[data-state]'); if (!b) return;
        clearTimeout(loadTimer);
        st.view = 'list'; st.listState = b.getAttribute('data-state'); st.modal = null; st.picker = null;
        render(); syncStates();
      });

      render(); syncStates();
      if ('ResizeObserver' in window) { var ro = new ResizeObserver(fit); ro.observe(stage); ro.observe(appEl); } else { window.addEventListener('resize', fit); }
      fit();
    }

    return { mount: mount };
  }

  /* build each copy when it gets near the screen */
  var start = function (fig) { if (fig.__ua) return; fig.__ua = App(fig); fig.__ua.mount(); };
  var pending = [].slice.call(figs);
  function check() {
    var reach = window.innerHeight + 900;
    pending = pending.filter(function (f) {
      var r = f.getBoundingClientRect();
      if (r.top < reach && r.bottom > -900) { start(f); return false; }
      return true;
    });
    if (!pending.length) { window.removeEventListener('scroll', check); window.removeEventListener('resize', check); }
  }
  window.addEventListener('scroll', check, { passive: true });
  window.addEventListener('resize', check);
  check();
})();
