/* Lovable verision — one script, no dependencies. */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --- nav switches from cream to ink once the hero is behind you --- */
  var nav = document.querySelector('.nav');
  if (nav) {
    var hero = document.querySelector('.hero, .cs-hero');
    var setTone = function () {
      /* Cream over the hero, ink everywhere else. A page with no hero is ink
         from the start — cream on the pale background is unreadable. */
      var dark = hero ? hero.getBoundingClientRect().bottom <= 72 : true;
      nav.setAttribute('data-tone', dark ? 'dark' : 'light');
    };
    window.addEventListener('scroll', setTone, { passive: true });
    window.addEventListener('resize', setTone, { passive: true });
    setTone();
  }

  /* --- reveal on enter --- */
  var revealables = document.querySelectorAll('.reveal');
  if (revealables.length) {
    if (reduced || !('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(revealables, function (el) {
        el.classList.add('is-in');
      });
    } else {
      var list = Array.prototype.slice.call(revealables);

      var countRevealed = function () {
        var n = 0;
        list.forEach(function (el) { if (el.classList.contains('is-in')) { n++; } });
        return n;
      };

      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            io.unobserve(entry.target);
          }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
      list.forEach(function (el) { io.observe(el); });

      /* Backup for the case where the observer is delivering nothing useful:
         a plain scroll check, which needs no frames of its own. */
      var revealInView = function () {
        var vh = window.innerHeight || document.documentElement.clientHeight;
        list.forEach(function (el) {
          if (el.classList.contains('is-in')) { return; }
          var r = el.getBoundingClientRect();
          if (r.top < vh * 0.92 && r.bottom > 0) {
            el.classList.add('is-in');
            io.unobserve(el);
          }
        });
      };
      window.addEventListener('scroll', revealInView, { passive: true });
      window.addEventListener('resize', revealInView, { passive: true });

      /* Last resort. If nothing at all has been revealed by now, although
         something is sitting in the viewport, neither mechanism is working —
         so show everything outright, with no transition to depend on. */
      window.setTimeout(function () {
        if (countRevealed() > 0) { return; }
        var vh = window.innerHeight || document.documentElement.clientHeight;
        var anyInView = list.some(function (el) {
          var r = el.getBoundingClientRect();
          return r.top < vh && r.bottom > 0;
        });
        if (!anyInView) { return; }
        io.disconnect();
        list.forEach(function (el) {
          el.style.transition = 'none';
          el.style.opacity = '1';
          el.style.transform = 'none';
          el.classList.add('is-in');
        });
      }, 2000);
    }
  }

  /* --- case study section rail, built from the headings on the page --- */
  var rail = document.querySelector('.cs-rail ol');
  if (rail) {
    var heads = document.querySelectorAll('.prose h2');
    if (heads.length < 3) {
      var shell = document.querySelector('.cs-rail');
      if (shell) { shell.style.display = 'none'; }
    } else {
      var links = [];
      Array.prototype.forEach.call(heads, function (h, i) {
        if (!h.id) { h.id = 'section-' + (i + 1); }
        var li = document.createElement('li');
        var a = document.createElement('a');
        a.href = '#' + h.id;
        a.textContent = h.textContent.replace(/^\d+\.\s*/, '');
        li.appendChild(a);
        rail.appendChild(li);
        links.push({ a: a, h: h });
      });

      var mark = function () {
        var best = null;
        links.forEach(function (pair) {
          var top = pair.h.getBoundingClientRect().top;
          if (top - 120 <= 0) { best = pair; }
        });
        links.forEach(function (pair) {
          pair.a.classList.toggle('is-current', pair === best);
        });
      };
      window.addEventListener('scroll', mark, { passive: true });
      mark();
    }
  }

  /* --- hero video: autoplay where allowed, poster frame where not --- */
  var video = document.querySelector('.hero__media');
  var caption = document.querySelector('.hero__caption');
  if (video) {
    var userPaused = false;

    var setCaption = function () {
      if (!caption) { return; }
      caption.textContent = video.paused
        ? 'picnic frog — paused'
        : 'picnic frog — 1080p60, on loop';
      caption.setAttribute(
        'aria-label',
        (video.paused ? 'Play' : 'Pause') + ' the background video'
      );
    };

    if (reduced) {
      video.pause();
    } else {
      var attempt = video.play();
      if (attempt && typeof attempt.catch === 'function') {
        attempt.catch(function () { setCaption(); });
      }
    }
    setCaption();

    if (caption) {
      caption.addEventListener('click', function () {
        if (video.paused) {
          video.play();
          userPaused = false;
        } else {
          video.pause();
          userPaused = true;
        }
        setCaption();
      });
    }

    /* stop decoding while the hero is off screen */
    if ('IntersectionObserver' in window) {
      var vio = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            if (!reduced && !userPaused) {
              var p = video.play();
              if (p && typeof p.catch === 'function') { p.catch(function () {}); }
            }
          } else {
            video.pause();
          }
        });
      }, { threshold: 0.02 });
      vio.observe(video);
    }
  }
})();
