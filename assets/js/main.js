/* ═══════════════════════════════════════════════════════════
   Motion. instrument.com itself ships zero animation libraries
   (verified: no gsap/Lenis/Locomotive, no scroll-timeline CSS,
   0 canvas, 0 video, 3 sticky elements). So the spine here is
   CSS transitions + IntersectionObserver, and GSAP is spent
   only on the two genuinely scrubbed moves.

   html.js gates every initial hidden state, so with JS off the
   page renders complete.
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var doc = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;
  var hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';

  if (hasIO) doc.classList.add('js');
  if (hasGSAP) gsap.registerPlugin(ScrollTrigger);

  /* ── SF clock ─────────────────────────────────────────── */

  function clock() {
    var el = document.getElementById('sf-clock');
    if (!el) return;
    var fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Los_Angeles', hour: 'numeric', minute: '2-digit'
    });
    var tick = function () { el.textContent = fmt.format(new Date()); };
    tick();
    window.setInterval(tick, 30000);
  }

  /* ── rail hairline once you leave the top ─────────────── */

  function rail() {
    var el = document.getElementById('rail');
    if (!el || !hasIO) { if (el) el.classList.add('is-on'); return; }
    var s = document.createElement('div');
    s.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:1px;pointer-events:none';
    document.body.prepend(s);
    new IntersectionObserver(function (e) {
      el.classList.toggle('is-on', !e[0].isIntersecting);
    }).observe(s);

    /* hide on downward scroll, return on upward, and reveal on mouse proximity */
    var last = window.scrollY, h = el.offsetHeight;
    window.addEventListener('scroll', function () {
      var y = window.scrollY, d = y - last;
      if (y <= h) el.classList.remove('is-hidden');
      else if (d > 0) el.classList.add('is-hidden');
      else if (d < -15) el.classList.remove('is-hidden');
      last = y;
    }, { passive: true });
    window.addEventListener('mousemove', function (ev) {
      if (ev.clientY < h + 8) el.classList.remove('is-hidden');
    }, { passive: true });
  }

  /* ── reveals ──────────────────────────────────────────── */

  function reveals() {
    if (!hasIO) return;

    /* the wordmark and the statement animate themselves via their own
       .is-in classes; everything else gets the generic .rv treatment */
    var targets = [
      '.feat__card', '.work__head', '.card', '.acid__in', '.make__copy', '.make__media',
      '.leaks__head', '.leak', '.proc__head', '.step', '.case__head', '.case__list',
      '.case__media', '.proj__head', '.pcard', '.about__fig', '.about__copy',
      '.faq__head', '.faq__row', '.book__head', '.bf__row', '.bf__act', '.book__rail',
      '.foot__cols'
    ];
    var els = document.querySelectorAll(targets.join(', '));

    els.forEach(function (el) {
      el.classList.add('rv');
      /* stagger within a run of same-class siblings */
      var i = 0, sib = el;
      while ((sib = sib.previousElementSibling) && sib.className.indexOf(el.tagName) !== -2) {
        if (sib.classList && sib.classList.contains('rv') &&
            sib.className.replace(' rv', '') === el.className.replace(' rv', '')) i++;
        else break;
      }
      if (i) el.style.transitionDelay = Math.min(i * 80, 400) + 'ms';
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -15% 0px', threshold: 0 });

    els.forEach(function (el) { io.observe(el); });

    /* the two self-animating blocks */
    var solo = document.querySelectorAll('.mark, .stmt');
    var io2 = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        io2.unobserve(e.target);
      });
    }, { threshold: 0.15 });
    solo.forEach(function (el) { io2.observe(el); });

    /* failsafe: nothing visible stays hidden */
    window.setTimeout(function () {
      document.querySelectorAll('.rv:not(.is-in), .mark:not(.is-in), .stmt:not(.is-in)')
        .forEach(function (el) {
          if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('is-in');
        });
    }, 3000);
  }

  /* ── the wordmark fills the viewport exactly ───────────
     flex space-between guarantees edge-to-edge, but the letters
     should nearly fill it on their own so the gaps stay optical
     rather than gappy. Measure and correct once per resize.    */

  function fitWordmark() {
    var word = document.querySelector('.mark__word');
    if (!word) return;
    var letters = word.querySelectorAll('.mark__l');
    if (!letters.length) return;

    /* Solve for the font-size that makes the glyphs themselves span the line,
       instead of guessing a vw value and hoping. Measure at a reference size,
       then scale. letter-spacing stays 0 so the letters sit on their natural
       sidebearings, and flex space-between absorbs the sub-pixel remainder. */
    var fit = function () {
      var avail = word.clientWidth;
      if (!avail) return;
      word.style.letterSpacing = '0px';
      word.style.fontSize = '100px';
      var ref = 0;
      letters.forEach(function (l) { ref += l.getBoundingClientRect().width; });
      if (!ref) { word.style.fontSize = ''; return; }
      word.style.fontSize = (100 * (avail / ref) * 0.998).toFixed(2) + 'px';
    };

    fit();
    var t;
    window.addEventListener('resize', function () {
      window.clearTimeout(t);
      t = window.setTimeout(function () { fit(); if (hasGSAP) ScrollTrigger.refresh(); }, 150);
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  }

  /* ── the giant type reveals per character ─────────────────
     Measured on the reference: y 20 -> 0 + opacity, 1s, expo.out,
     0.05s stagger, fired once. Deliberately NO parallax: the
     reference's wrapper top is constant at every scroll position. */

  function ghost() {
    var sec = document.querySelector('.ghost');
    if (!sec || !hasIO) return;

    var n = 0;
    sec.querySelectorAll('.ghost__l').forEach(function (line) {
      var text = line.textContent;
      line.textContent = '';
      for (var i = 0; i < text.length; i++) {
        var c = document.createElement('span');
        c.className = 'ghost__c';
        c.textContent = text[i];
        c.setAttribute('aria-hidden', 'true');
        if (!reduced) c.style.transitionDelay = (n * 50) + 'ms';
        line.appendChild(c);
        n++;
      }
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        sec.classList.add('is-in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -15% 0px', threshold: 0 });
    io.observe(sec);
  }

  /* ── featured: 3D entrance, then the system map runs ────── */

  function featured() {
    if (!hasGSAP || reduced) return;
    var card = document.querySelector('.feat__card');
    if (!card) return;
    gsap.fromTo(card,
      { scale: 0.96, rotateX: 7, y: 30, transformOrigin: '50% 100%' },
      {
        scale: 1, rotateX: 0, y: 0, ease: 'none',
        scrollTrigger: { trigger: card, start: 'top 96%', end: 'top 55%', scrub: 0.6, invalidateOnRefresh: true }
      });
  }

  /* the connectors draw in as you scroll; then job-dots run the lines
     forever. This is the product doing its job, as motion. */

  function sysmap() {
    var lines = document.querySelectorAll('.sm__line');
    if (!lines.length || !hasGSAP || reduced) return;

    gsap.set(lines, { strokeDashoffset: 1, strokeDasharray: '1 1' });
    gsap.to(lines, {
      strokeDashoffset: 0,
      stagger: 0.12,
      ease: 'none',
      scrollTrigger: {
        trigger: '.feat__card', start: 'top 92%', end: 'top 38%',
        scrub: 0.6, invalidateOnRefresh: true
      },
      onComplete: function () {
        /* restore the dashed texture once drawn */
        gsap.set(lines, { strokeDasharray: '.012 .014', strokeDashoffset: 0 });
      }
    });

    document.querySelectorAll('.sm__dot').forEach(function (dot, i) {
      var path = lines[i];
      if (!path) return;
      var len = path.getTotalLength();
      var state = { p: 0 };
      gsap.to(state, {
        p: 1, duration: 3.6, ease: 'none', repeat: -1, delay: i * 0.9,
        onUpdate: function () {
          var pt = path.getPointAtLength(state.p * len);
          dot.setAttribute('cx', pt.x);
          dot.setAttribute('cy', pt.y);
        }
      });
    });
  }

  /* ── booking form composes a real email ────────────────── */

  function bookform() {
    var form = document.getElementById('bf');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = function (id) { var el = form.querySelector(id); return el ? el.value : ''; };
      var name = v('#bf-name'), biz = v('#bf-biz'), job = v('#bf-job');
      var subject = 'Walkthrough request' + (name ? ' from ' + name : '');
      var body = 'Name: ' + name + '\nBusiness: ' + biz +
        '\n\nOne recent job:\n' + job + '\n\nTimes that could work for me:\n- ';
      window.location.href = 'mailto:johnmontejano2@gmail.com?subject=' +
        encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    });
  }

  function init() {
    clock();
    rail();
    reveals();
    fitWordmark();
    ghost();
    featured();
    sysmap();
    bookform();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.addEventListener('load', function () {
    if (hasGSAP) ScrollTrigger.refresh();
  });
})();
