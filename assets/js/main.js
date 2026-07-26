/* ═══════════════════════════════════════════════════════════
   THE CONTROL ROOM — motion & instrumentation.

   Progressive enhancement: the page is complete with no JS.
   - Generic reveals are IntersectionObserver + CSS classes
     (cannot strand content invisible).
   - GSAP drives only: hero entrance, the pinned FastFix
     showcase, the footer marquee, magnetic CTAs, glow drift.
   - html.gsap gates hero initial states; html.showcase-pin
     gates the pinned-stage layout. Neither class, no hiding.
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var doc = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';

  if (hasGSAP) {
    gsap.registerPlugin(ScrollTrigger);
    if (!reduced) doc.classList.add('gsap');
  }

  /* ── SF clock (real, computed) ─────────────────────────── */

  function clock() {
    var els = [document.getElementById('sf-clock'), document.getElementById('sf-clock-2')].filter(Boolean);
    if (!els.length) return;
    var fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Los_Angeles', hour: 'numeric', minute: '2-digit'
    });
    var tick = function () {
      var t = fmt.format(new Date());
      els.forEach(function (el) { el.textContent = t; });
    };
    tick();
    window.setInterval(tick, 30000);
  }

  /* ── nav goes solid off the top (IO sentinel, no scroll listener) ── */

  function nav() {
    var el = document.getElementById('nav');
    if (!el) return;
    var sentinel = document.createElement('div');
    sentinel.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:1px;';
    document.body.prepend(sentinel);
    if (!('IntersectionObserver' in window)) { el.classList.add('is-solid'); return; }
    new IntersectionObserver(function (entries) {
      el.classList.toggle('is-solid', !entries[0].isIntersecting);
    }).observe(sentinel);
  }

  /* ── generic reveals: JS opts elements IN, IO shows them ── */

  function reveals() {
    if (reduced || !('IntersectionObserver' in window)) return;

    /* when the showcase is not pinned (mobile / no GSAP), its scenes join the
       normal reveal flow so the frames still wipe in */
    var pinning = hasGSAP && !reduced && window.innerWidth >= 881;

    var groups = [
      '.proof__line', '.proof__card',
      '.diag__head', '.diag__row',
      '.proc > .h2', '.proc__panel',
      '.ff__head', '.ff__list li', '.ff__band',
      '.projects > .h2', '.pcard',
      '.about__copy', '.about__coords',
      '.book__h', '.book__sub', '.bform__row', '.bform__actions', '.book__rail',
      '.faq > .h2', '.faq__row'
    ];
    if (!pinning) groups.push('.showcase__scene');
    var els = document.querySelectorAll(groups.join(', '));

    els.forEach(function (el) {
      var i = 0, sib = el;
      while ((sib = sib.previousElementSibling) && sib.className === el.className) i++;
      el.classList.add('reveal');
      if (i) el.style.transitionDelay = Math.min(i * 70, 350) + 'ms';
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.01 });

    els.forEach(function (el) { io.observe(el); });

    /* failsafe: nothing on screen stays hidden */
    window.setTimeout(function () {
      els.forEach(function (el) {
        if (!el.classList.contains('is-in') && el.getBoundingClientRect().top < window.innerHeight) {
          el.classList.add('is-in');
        }
      });
    }, 3000);
  }

  /* ── hero entrance (load-driven, no trigger risk) ─────────── */

  function hero() {
    if (!hasGSAP || reduced) return;

    var tl = gsap.timeline({ delay: 0.12 });

    /* y:0 wipes the px offset GSAP parses out of the CSS translateY(112%) —
       otherwise it survives as a separate component and the lines never land */
    tl.fromTo('.hline__in',
      { y: 0, yPercent: 112 },
      { yPercent: 0, duration: 0.95, ease: 'power4.out', stagger: 0.09 });

    tl.to('.hero__portrait', {
      clipPath: 'inset(0% 0% 0% 0%)',
      duration: 1.05,
      ease: 'power3.inOut'
    }, 0.18);

    tl.from(['.hero .chip', '.hero__sub', '.hero__cta', '.hero__facts'], {
      y: 22,
      autoAlpha: 0,
      duration: 0.6,
      ease: 'power3.out',
      stagger: 0.07,
      clearProps: 'all'
    }, 0.45);

    tl.from('.tile', {
      scale: 0.94,
      autoAlpha: 0,
      duration: 0.5,
      ease: 'power3.out',
      clearProps: 'all'
    }, 0.95);
  }

  /* ── pinned FastFix showcase ─────────────────────────────── */

  function showcase() {
    var wrap = document.querySelector('.showcase');
    if (!wrap || !hasGSAP || reduced || window.innerWidth < 881) return;

    doc.classList.add('showcase-pin');

    var scenes = wrap.querySelectorAll('.showcase__scene');
    var bars = wrap.querySelectorAll('.showcase__prog i');
    var current = 0;

    function setScene(n) {
      if (n === current) return;
      current = n;
      scenes.forEach(function (s, i) { s.classList.toggle('is-on', i === n); });
    }
    scenes[0].classList.add('is-on');

    ScrollTrigger.create({
      trigger: wrap,
      start: 'top top+=' + 64,
      end: '+=220%',
      pin: wrap.querySelector('.showcase__pin'),
      scrub: 0.6,
      invalidateOnRefresh: true,
      onUpdate: function (self) {
        var p = self.progress;
        setScene(p < 0.34 ? 0 : p < 0.67 ? 1 : 2);
        bars.forEach(function (b, i) {
          b.classList.toggle('is-fill', p >= (i + 0.02) / 3);
        });
      }
    });
  }

  /* ── footer marquee ──────────────────────────────────────── */

  function marquee() {
    if (!hasGSAP || reduced) return;
    var track = document.querySelector('.foot__track');
    if (!track) return;
    gsap.to(track, { xPercent: -50, repeat: -1, duration: 26, ease: 'none' });

    /* scroll velocity leans the name over, then it settles */
    var skew = gsap.quickTo(track, 'skewX', { duration: 0.4, ease: 'power3.out' });
    ScrollTrigger.create({
      trigger: document.body,
      start: 0,
      end: 'max',
      onUpdate: function (self) {
        skew(gsap.utils.clamp(-3, 3, self.getVelocity() / -400));
      }
    });
  }

  /* ── glow drift: the light feels volumetric ──────────────── */

  function glows() {
    if (!hasGSAP || reduced) return;
    [['.hero__glow--b', 14], ['.ff__glow', 10], ['.book__glow', 12]].forEach(function (pair) {
      var el = document.querySelector(pair[0]);
      if (!el) return;
      gsap.to(el, {
        yPercent: pair[1],
        ease: 'none',
        scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: 1 }
      });
    });
  }

  /* ── magnetic primary CTAs (desktop, fine pointer) ───────── */

  function magnetic() {
    if (!hasGSAP || reduced || !finePointer || window.innerWidth < 881) return;
    document.querySelectorAll('.btn--primary').forEach(function (btn) {
      var qx = gsap.quickTo(btn, 'x', { duration: 0.4, ease: 'power3.out' });
      var qy = gsap.quickTo(btn, 'y', { duration: 0.4, ease: 'power3.out' });
      btn.addEventListener('mousemove', function (e) {
        var r = btn.getBoundingClientRect();
        qx((e.clientX - (r.left + r.width / 2)) * 0.22);
        qy((e.clientY - (r.top + r.height / 2)) * 0.22);
      });
      btn.addEventListener('mouseleave', function () { qx(0); qy(0); });
    });
  }

  /* ── booking form: composes a real email, nothing fake ───── */

  function bookform() {
    var form = document.getElementById('bform');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = (form.querySelector('#bf-name') || {}).value || '';
      var biz = (form.querySelector('#bf-biz') || {}).value || '';
      var job = (form.querySelector('#bf-job') || {}).value || '';
      var subject = 'Walkthrough request' + (name ? ' from ' + name : '');
      var body = 'Name: ' + name + '\nBusiness: ' + biz + '\n\nOne recent job:\n' + job +
        '\n\nTimes that could work for me:\n- ';
      window.location.href = 'mailto:johnmontejano2@gmail.com?subject=' +
        encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    });
  }

  /* ── boot ── */

  function init() {
    clock();
    nav();
    reveals();
    hero();
    showcase();
    marquee();
    glows();
    magnetic();
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
