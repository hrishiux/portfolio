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

  /* --- tap to enlarge: phone screens and the figma canvas ---
     Each image is wrapped in a button at load, so without the script they are
     plain images. Arrow keys step through the row the image belongs to. */
  var ZOOM = '.screens__img, .wide--canvas img, .boards__img, .nstar .compare img, .mosaic img';
  var zoomables = document.querySelectorAll(ZOOM);
  if (zoomables.length && typeof HTMLDialogElement === 'function') {
    var box = document.createElement('dialog');
    box.className = 'lightbox';
    box.setAttribute('aria-label', 'Enlarged screen');
    box.innerHTML =
      '<div class="lightbox__stage"><img class="lightbox__img" alt=""></div>' +
      '<p class="lightbox__cap"><span class="lightbox__count"></span><span class="lightbox__text"></span></p>' +
      '<button type="button" class="lightbox__btn lightbox__close" aria-label="Close">&#x2715;</button>' +
      '<button type="button" class="lightbox__btn lightbox__prev" aria-label="Previous screen">&larr;</button>' +
      '<button type="button" class="lightbox__btn lightbox__next" aria-label="Next screen">&rarr;</button>';
    document.body.appendChild(box);

    var bigImg = box.querySelector('.lightbox__img');
    var capText = box.querySelector('.lightbox__text');
    var capCount = box.querySelector('.lightbox__count');
    var prevBtn = box.querySelector('.lightbox__prev');
    var nextBtn = box.querySelector('.lightbox__next');
    var group = [];
    var at = 0;

    var captionFor = function (img) {
      var li = img.closest('li');
      var cap = li && li.querySelector('.screens__cap');
      if (cap) { return cap.textContent.replace(/\s+/g, ' ').trim(); }
      var fig = img.closest('figure');
      var fc = fig && fig.querySelector('figcaption');
      return fc ? fc.textContent.replace(/\s+/g, ' ').trim() : '';
    };

    var show = function (i) {
      at = (i + group.length) % group.length;
      var img = group[at];
      bigImg.src = img.currentSrc || img.src;
      bigImg.alt = img.alt;
      capText.textContent = captionFor(img);
      capCount.textContent = group.length > 1 ? (at + 1) + ' / ' + group.length : '';
      box.classList.toggle('is-wide', img.naturalWidth > img.naturalHeight);
      prevBtn.hidden = nextBtn.hidden = group.length < 2;
    };

    var close = function () { if (box.open) { box.close(); } };
    box.addEventListener('close', function () {
      document.documentElement.classList.remove('is-locked');
      bigImg.removeAttribute('src');
    });

    Array.prototype.forEach.call(zoomables, function (img) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'zoomable';
      btn.setAttribute('aria-label', 'Enlarge: ' + (captionFor(img) || img.alt));
      img.parentNode.insertBefore(btn, img);
      btn.appendChild(img);
      btn.addEventListener('click', function () {
        var fig = img.closest('[data-zoom-group]') || img.closest('figure');
        group = fig ? Array.prototype.slice.call(fig.querySelectorAll(ZOOM)) : [img];
        show(group.indexOf(img));
        document.documentElement.classList.add('is-locked');
        box.showModal();
        box.querySelector('.lightbox__close').focus();
      });
    });

    box.querySelector('.lightbox__close').addEventListener('click', close);
    prevBtn.addEventListener('click', function () { show(at - 1); });
    nextBtn.addEventListener('click', function () { show(at + 1); });
    box.addEventListener('click', function (e) {
      if (e.target === box || e.target.classList.contains('lightbox__stage')) { close(); }
    });
    box.addEventListener('keydown', function (e) {
      if (group.length < 2) { return; }
      if (e.key === 'ArrowLeft') { e.preventDefault(); show(at - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); show(at + 1); }
    });
  }

  /* --- short loops (about page): play only while on screen, poster otherwise ---
     preload="none" in the markup, so nothing downloads until a loop scrolls in. */
  var loops = document.querySelectorAll('video.loop');
  if (loops.length && !reduced && 'IntersectionObserver' in window) {
    var lio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var v = entry.target;
        if (entry.isIntersecting) {
          var p = v.play();
          if (p && typeof p.catch === 'function') { p.catch(function () {}); }
        } else {
          v.pause();
        }
      });
    }, { threshold: 0.35 });
    Array.prototype.forEach.call(loops, function (v) { lio.observe(v); });
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
