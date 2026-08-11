/* ═══════════════════════════════════════════════════════════════════════
   John Montejano · v6 "Paper and Machine, refined"

   One IIFE, strict mode, ES5-safe syntax. No library, no build step.
   Every module returns immediately if its root element is absent, so a
   missing section never throws. The page is complete and readable with
   this file blocked: nothing here is required to see or read anything.

   Module order:
   boot · ticker · reveal · splitHero · nav · sectionIndex · rail ·
   booking (+ openings) · clock · dock · magnetic · reducedMotionWatcher
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var hasIO = 'IntersectionObserver' in window;
  var RM = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* every loop registers itself here so the reduced-motion watcher can
     flip the whole page between "running" and "final state" mid-session. */
  var LOOPS = [];
  function registerLoop(o) { LOOPS.push(o); }

  /* ─────────────────────────────────────────────
     TICKER · one requestAnimationFrame for the whole page.
     The console replay, the four leak vignettes and the SF clock all
     read the same clock. The loop stops entirely when nobody is watching.
     ───────────────────────────────────────────── */
  var ticker = (function () {
    var subs = [], raf = 0;
    function frame(t) {
      raf = 0;
      for (var i = subs.length - 1; i >= 0; i--) subs[i](t);
      if (subs.length) raf = window.requestAnimationFrame(frame);
    }
    return {
      add: function (fn) {
        if (subs.indexOf(fn) < 0) subs.push(fn);
        if (!raf) raf = window.requestAnimationFrame(frame);
      },
      remove: function (fn) {
        var i = subs.indexOf(fn);
        if (i >= 0) subs.splice(i, 1);
        if (!subs.length && raf) { window.cancelAnimationFrame(raf); raf = 0; }
      }
    };
  })();

  /* ─────────────────────────────────────────────
     REVEAL · IntersectionObserver base. The scroll-timeline path in the
     stylesheet is the enhancement; this can never fail closed.
     ───────────────────────────────────────────── */
  (function reveal() {
    var all = $$('.reveal');
    if (!all.length) return;

    function force() {
      $$('.reveal:not(.is-in)').forEach(function (el) { el.classList.add('is-in'); });
    }

    /* Under reduced motion there is no reveal choreography to run · the
       stylesheet already holds every .reveal at its final state · so mark
       the whole page in at once instead of waiting on intersection or the
       failsafe. Same for a browser with no IntersectionObserver. */
    if (RM.matches || !hasIO) { force(); return; }

    var io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        var e = entries[i];
        if (!e.isIntersecting) continue;
        var group = e.target.closest('[data-stagger]');
        if (group) {
          $$('.reveal', group).forEach(function (k, n) {
            k.style.transitionDelay = Math.min(n, 6) * 60 + 'ms';
            k.classList.add('is-in');
            io.unobserve(k);
          });
        } else {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      }
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0 });

    all.forEach(function (el) { io.observe(el); });

    window.setTimeout(force, 3500);          /* cannot fail closed */

    document.addEventListener('transitionend', function (e) {
      if (e.target.classList && e.target.classList.contains('is-in')) {
        e.target.style.transitionDelay = '';
      }
    });
  })();

  /* ─────────────────────────────────────────────
     SPLIT HERO · the word mask, H1 only, with the accessible duplicate.
     Under reduced motion the split is not applied at all.
     ───────────────────────────────────────────── */
  (function splitHero() {
    if (RM.matches) return;
    $$('.split').forEach(function (root) {
      var el = $('.h1__a', root) || root;
      var text = el.textContent.replace(/\s+/g, ' ').trim();
      if (!text) return;
      var out = '<span class="sr-only">' + text + '</span>';
      var words = text.split(' ');
      for (var i = 0; i < words.length; i++) {
        out += '<span class="w" aria-hidden="true"><i style="--i:' + i + '">' + words[i] + '</i></span>';
        if (i < words.length - 1) out += ' ';
      }
      el.innerHTML = out;
      window.requestAnimationFrame(function () { root.classList.add('is-in'); });
    });
  })();

  /* ─────────────────────────────────────────────
     NAV · stuck state, hide on scroll down, mobile drawer.
     One passive scroll listener that only flags; every read happens
     inside a single rAF tick and touches no layout property.
     ───────────────────────────────────────────── */
  (function nav() {
    var el = $('#nav');
    if (!el) return;

    if (hasIO) {
      var sentinel = document.createElement('div');
      sentinel.setAttribute('aria-hidden', 'true');
      sentinel.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:240px;pointer-events:none';
      document.body.appendChild(sentinel);
      var past = false;
      new IntersectionObserver(function (entries) {
        past = !entries[0].isIntersecting;
        el.classList.toggle('is-stuck', past);
        if (!past) el.classList.remove('is-away');
      }).observe(sentinel);

      var last = window.scrollY, queued = false;
      window.addEventListener('scroll', function () {
        if (queued) return;
        queued = true;
        window.requestAnimationFrame(function () {
          queued = false;
          var y = window.scrollY;
          var d = y - last;
          last = y;
          if (!past || document.body.classList.contains('is-locked')) return;
          if (d > 6) el.classList.add('is-away');
          else if (d < -6) el.classList.remove('is-away');
        });
      }, { passive: true });
    }

    /* the drawer is the page's numbered index at every width, not a phone
       fallback: the bar has no section links left to lose. */
    var burger = $('#burger'), drawer = $('#drawer');
    if (!burger || !drawer) return;

    function setOpen(open) {
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      drawer.hidden = !open;
      document.body.style.overflow = open ? 'hidden' : '';
      document.body.classList.toggle('is-locked', open);
      if (open) {
        el.classList.remove('is-away');
        var first = $('a', drawer);
        if (first) first.focus();
      }
    }
    burger.addEventListener('click', function () {
      setOpen(burger.getAttribute('aria-expanded') !== 'true');
    });
    drawer.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (drawer.hidden) return;
      if (e.key === 'Escape') { setOpen(false); burger.focus(); return; }
      if (e.key !== 'Tab') return;
      /* focus trap: the drawer covers the page, so nothing behind it is
         reachable by eye and nothing behind it should be reachable by tab. */
      var f = $$('a[href], button:not(:disabled)', drawer);
      if (!f.length) return;
      f.unshift(burger);
      var i = f.indexOf(document.activeElement);
      if (e.shiftKey) {
        if (i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      } else if (i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    });
  })();

  /* ─────────────────────────────────────────────
     SECTION INDEX · the nav centre reads the numbered section you are in.
     Decorative for assistive tech: announcing a label on every scroll is
     noise, and the drawer and the footer carry the real navigation.
     ───────────────────────────────────────────── */
  (function sectionIndex() {
    var idx = $('#idx');
    if (!idx || !hasIO) return;

    var LABELS = [
      ['leaks', 'WHERE IT GOES'], ['does', 'WHAT I AUTOMATE'],
      ['work',  'WORK'],          ['worth', 'WHAT IT REPLACES'],
      ['how',   'HOW IT WORKS'],  ['about', 'WHO'],
      ['faq',   'QUESTIONS'],     ['book',  'BOOK']
    ];

    var els = [], on = {};
    for (var i = 0; i < LABELS.length; i++) {
      var el = document.getElementById(LABELS[i][0]);
      if (!el) continue;
      el.setAttribute('data-idx', ('0' + (i + 1)).slice(-2) + ' · ' + LABELS[i][1]);
      els.push(el);
    }
    if (!els.length) return;

    function paint() {
      var label = '';
      for (var i = 0; i < els.length; i++) {
        if (on[els[i].id]) label = els[i].getAttribute('data-idx');
      }
      if (label) {
        if (idx.textContent !== label) idx.textContent = label;
        idx.classList.add('is-on');
      } else {
        idx.classList.remove('is-on');
      }
    }

    var io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        on[entries[i].target.id] = entries[i].isIntersecting;
      }
      paint();
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

    els.forEach(function (el) { io.observe(el); });
  })();

  /* ─────────────────────────────────────────────
     RAIL · the scroll-progress bar. On a modern browser the stylesheet
     drives it off a scroll timeline and this module attaches nothing at
     all, so the page keeps its zero-scroll-listener property.
     ───────────────────────────────────────────── */
  (function rail() {
    var bar = document.querySelector('.progress');
    if (!bar) return;
    var native = false;
    try {
      native = !!(window.CSS && CSS.supports &&
                  CSS.supports('animation-timeline', 'scroll(root block)'));
    } catch (e) {}

    var root = document.documentElement, queued = false, attached = false;
    function paint() {
      var h = root.scrollHeight - window.innerHeight;
      var p = h > 0 ? window.scrollY / h : 0;
      root.style.setProperty('--p', Math.max(0, Math.min(1, p)).toFixed(4));
    }
    function tick() { queued = false; ticker.remove(tick); paint(); }
    function attach() {
      if (attached) return;
      attached = true;
      paint();
      window.addEventListener('scroll', function () {
        if (queued) return;
        queued = true;
        ticker.add(tick);
      }, { passive: true });
      window.addEventListener('resize', paint);
    }

    /* On a modern browser with motion allowed the stylesheet drives the rail
       off a scroll timeline and nothing is attached here at all, so the page
       keeps its zero-scroll-listener property. Under reduce the timeline is
       dropped so the page runs no animations, and this takes over. */
    if (!native || RM.matches) attach();
    var onRM = function (e) { if (e.matches) attach(); };
    if (RM.addEventListener) RM.addEventListener('change', onRM);
    else if (RM.addListener) RM.addListener(onRM);
  })();

  /* ─────────────────────────────────────────────
     MACHINE CONSOLE · replays one job, end to end.
     The markup ships every event visible; the replay only ever removes
     and restores them, so JS-off and reduced motion read the finished job.
     ───────────────────────────────────────────── */
  (function machine() {
    var feed = $('#feed');
    if (!feed) return;
    var evs = $$('.ev', feed);
    if (!evs.length) return;

    var STEP = 620, HOLD = 2200;
    var span = evs.length * STEP + HOLD;
    var t0 = 0, on = false;

    function tick(t) {
      if (!t0) t0 = t;
      var p = (t - t0) % span;
      var shown = Math.min(evs.length, Math.floor(p / STEP) + 1);
      for (var i = 0; i < evs.length; i++) evs[i].classList.toggle('is-in', i < shown);
    }
    function start() {
      if (on || RM.matches) return;
      on = true; t0 = 0;
      feed.classList.add('is-loop');
      ticker.add(tick);
    }
    function stop() {
      if (!on) return;
      on = false;
      ticker.remove(tick);
    }
    function final() {
      stop();
      feed.classList.remove('is-loop');
      evs.forEach(function (e) { e.classList.remove('is-in'); });
    }

    var visible = !hasIO;
    registerLoop({
      start: function () { if (visible) start(); },
      final: final
    });

    if (!hasIO) { start(); return; }
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) start(); else stop();
    }, { threshold: 0.18 }).observe(feed);
  })();

  /* ─────────────────────────────────────────────
     LEAK SCENES · four vignettes. Each renders its FINAL state in the
     markup (counter at its end value, stamp present, outcome line visible);
     .is-play only replays it, and only while the card is on screen.
     ───────────────────────────────────────────── */
  (function leaks() {
    var cards = $$('.leak');
    if (!cards.length) return;

    var CYCLE = 5200;
    var TYPE = 'Miguel Delgado, 1420 Foothill';
    var DAYS = [2, 3, 5, 8, 11, 14];

    var live = [];

    function phase(t) { return (t % CYCLE) / CYCLE; }

    function makeTick(card, kind) {
      var rings = $('.js-rings', card);
      var days  = $('.js-days', card);
      var a     = $('.js-typeA', card);
      var b     = $('.js-typeB', card);

      return function (t) {
        var p = phase(t);
        if (kind === 'call' && rings) {
          rings.textContent = p < 0.55 ? Math.min(6, 1 + Math.floor(p / 0.55 * 6)) : 6;
        }
        if (kind === 'quote' && days) {
          days.textContent = p < 0.55 ? DAYS[Math.min(5, Math.floor(p / 0.55 * 6))] : 14;
        }
        if (kind === 'dup' && a && b) {
          var n = TYPE.length;
          if (p < 0.30)      { a.textContent = TYPE.slice(0, Math.ceil(p / 0.30 * n)); b.textContent = ''; }
          else if (p < 0.36) { a.textContent = TYPE; b.textContent = ''; }
          else if (p < 0.66) { a.textContent = TYPE; b.textContent = TYPE.slice(0, Math.ceil((p - 0.36) / 0.30 * n)); }
          else               { a.textContent = TYPE; b.textContent = TYPE; }
        }
      };
    }

    function finalOf(card, kind) {
      var rings = $('.js-rings', card), days = $('.js-days', card);
      var a = $('.js-typeA', card), b = $('.js-typeB', card);
      if (kind === 'call'  && rings) rings.textContent = '6';
      if (kind === 'quote' && days)  days.textContent  = '14';
      if (kind === 'dup') { if (a) a.textContent = TYPE; if (b) b.textContent = TYPE; }
    }

    cards.forEach(function (card) {
      var kind  = card.getAttribute('data-leak');
      var scene = $('.scene', card);
      if (!scene) return;
      var tick = makeTick(card, kind);
      var on = false, visible = !hasIO;

      function start() {
        if (on || RM.matches) return;
        on = true;
        scene.classList.add('is-play');
        ticker.add(tick);
      }
      function stop() {
        if (!on) return;
        on = false;
        scene.classList.remove('is-play');
        ticker.remove(tick);
      }
      function final() { stop(); finalOf(card, kind); }

      live.push({ start: function () { if (visible) start(); }, final: final });

      if (!hasIO) { start(); return; }
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) start(); else { stop(); finalOf(card, kind); }
      }, { threshold: 0.5 }).observe(card);
    });

    live.forEach(registerLoop);
  })();

  /* ─────────────────────────────────────────────
     FORK · the two connector paths draw themselves once, on arrival.
     Without JS they are simply already drawn.
     ───────────────────────────────────────────── */
  (function fork() {
    var root = $('#fork');
    if (!root) return;
    var paths = $$('.fork__p', root);
    if (!paths.length) return;

    paths.forEach(function (p) {
      var len = 300;
      try { len = Math.ceil(p.getTotalLength()) || 300; } catch (e) {}
      p.style.setProperty('--len', len);
    });

    if (RM.matches || !hasIO) return;
    var io = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      root.classList.add('is-draw');
      io.disconnect();
    }, { threshold: 0.3 });
    io.observe(root);
  })();

  /* ─────────────────────────────────────────────
     FAQ · every row ships `open` so a JS-blocked visitor reads all six
     answers. With JS, the first stays open and the rest collapse.
     ───────────────────────────────────────────── */
  (function faq() {
    var rows = $$('.faq__list details');
    if (rows.length < 2) return;
    for (var i = 1; i < rows.length; i++) rows[i].open = false;
  })();

  /* ─────────────────────────────────────────────
     STEP ART · the four how-it-works panels are drawn at rest in CSS;
     .is-play only animates them, and only while the steps are on screen.
     ───────────────────────────────────────────── */
  (function stepArt() {
    var grid = $('.how__grid');
    var arts = $$('.how .art');
    if (!grid || !arts.length || !hasIO) return;

    var visible = false;
    function paint() {
      var on = visible && !RM.matches;
      arts.forEach(function (a) { a.classList.toggle('is-play', on); });
    }
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      paint();
    }, { threshold: 0.25 }).observe(grid);

    registerLoop({ start: paint, final: function () {
      arts.forEach(function (a) { a.classList.remove('is-play'); });
    } });
  })();

  /* ─────────────────────────────────────────────
     BOOKING · real dates, one click, nothing destroyed.

     The geometry is new in v6 (a month grid, a phone day list, five window
     pills) but the logic underneath is the verified v4/v5 module, ported:
     the next 8 weekdays, five Pacific windows, the timezone line, the
     mailto draft, the post-submit panel with a clipboard fallback, and the
     aria-live announcements. The submit stays mailto because no scheduler
     account exists; the day a real URL arrives it is one block to swap.
     ───────────────────────────────────────────── */
  (function booking() {
    var grid = $('#cal-grid'), timeWrap = $('#slot-times'), list = $('#daylist');
    if (!grid || !timeWrap || !list) return;

    var EMAIL = 'johnmontejano2@gmail.com';
    var WINDOWS = ['9:00 AM', '10:30 AM', '1:00 PM', '2:30 PM', '4:00 PM'];
    var DAYN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    var DAYL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    var MONN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var MONL = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
                'August', 'September', 'October', 'November', 'December'];
    var WD   = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    /* the eight weekdays that are genuinely open. Nothing else is offered,
       and every other date in the month renders visibly unavailable. */
    var days = [], d = new Date();
    d.setDate(d.getDate() + 1);
    while (days.length < 8) {
      if (d.getDay() !== 0 && d.getDay() !== 6) days.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }
    function iso(dt) {
      return dt.getFullYear() + '-' + ('0' + (dt.getMonth() + 1)).slice(-2) +
             '-' + ('0' + dt.getDate()).slice(-2);
    }
    var open = {};
    days.forEach(function (dt) { open[iso(dt)] = dt; });

    var now = new Date();
    function mIdx(dt) { return dt.getFullYear() * 12 + dt.getMonth(); }
    var minM = mIdx(now), maxM = mIdx(days[days.length - 1]);
    if (maxM < minM) maxM = minM;
    var view = mIdx(days[0]);

    var picked = { day: null, time: null };
    var sel   = $('#book-sel'), form = $('#bf'), go = $('#bf-go');
    var goT   = $('#bf-go-t'), err = $('#bf-err'), tzLine = $('#book-tz');
    var done  = $('#bf-done'), announce = $('#bf-live'), whenEl = $('#bf-when');
    var again = $('#bf-again'), raw = $('#bf-raw'), copy = $('#bf-copy');
    var monthEl = $('#cal-month'), prevB = $('#cal-prev'), nextB = $('#cal-next');
    var slotHead = $('#slot-head'), tzMine = $('#bk-tzmine');
    var panel = sel ? sel.closest('.sel') : null;

    var WAITING = 'Pick a day and a time first';
    var READY   = 'Request this time';

    function ready() { return !!(picked.day && picked.time); }

    function label() {
      if (!picked.day) return 'No time picked yet';
      var s = DAYL[picked.day.getDay()] + ' ' + MONN[picked.day.getMonth()] + ' ' + picked.day.getDate();
      return picked.time ? s + ' at ' + picked.time + ' PT' : s + ' · pick a time';
    }

    var visitorTZ = '';
    try { visitorTZ = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
    var outsidePT = visitorTZ && visitorTZ.indexOf('Los_Angeles') < 0;
    if (tzMine && outsidePT) tzMine.textContent = ' · your time: ' + visitorTZ;

    function laParts(ms) {
      var p = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Los_Angeles', hour12: false, hour: '2-digit', minute: '2-digit'
      }).formatToParts(new Date(ms));
      var o = {};
      p.forEach(function (x) { if (x.type === 'hour' || x.type === 'minute') o[x.type] = +x.value; });
      return o;
    }
    function ptInstant(day, timeStr) {
      var m = /(\d+):(\d+)\s*(AM|PM)/i.exec(timeStr || '');
      if (!m) return null;
      var h = +m[1] % 12 + (/pm/i.test(m[3]) ? 12 : 0), mi = +m[2];
      var ms = Date.UTC(day.getFullYear(), day.getMonth(), day.getDate(), h + 8, mi);
      for (var i = 0; i < 3; i++) {
        var got = laParts(ms);
        if (got.hour === undefined) return null;
        var diff = (got.hour * 60 + got.minute) - (h * 60 + mi);
        if (diff > 720) diff -= 1440; else if (diff < -720) diff += 1440;
        if (!diff) break;
        ms -= diff * 60000;
      }
      return new Date(ms);
    }
    function localOf(dayDt, timeStr) {
      try {
        var inst = ptInstant(dayDt, timeStr);
        if (!inst) return '';
        return new Intl.DateTimeFormat('en-US', {
          weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
        }).format(inst);
      } catch (e) { return ''; }
    }
    function tzText() {
      if (!outsidePT || !ready()) return '';
      var local = localOf(picked.day, picked.time);
      if (!local) return '';
      return local + ' where you are (' + visitorTZ.split('/').pop().replace(/_/g, ' ') + ')';
    }

    function whenText() {
      return DAYL[picked.day.getDay()] + ' ' + MONN[picked.day.getMonth()] + ' ' +
             picked.day.getDate() + ' at ' + picked.time + ' Pacific';
    }
    function draft() {
      var name = ($('#bf-name') || {}).value || '';
      var biz  = ($('#bf-biz')  || {}).value || '';
      var when = whenText();
      var subject = '30-min call · ' + when + (biz ? ' · ' + biz : '');
      var body = 'Hi John,\n\n' +
        'I would like the ' + when + ' slot.\n\n' +
        'Name: ' + (name || '(add your name)') + '\n' +
        'Business: ' + (biz || '(add your business)') + '\n\n' +
        'What eats the most time right now:\n\n';
      return {
        when: when, subject: subject, body: body,
        href: 'mailto:' + EMAIL + '?subject=' + encodeURIComponent(subject) +
              '&body=' + encodeURIComponent(body)
      };
    }

    /* announce only when the slot changed or the panel opened, never per keystroke */
    function refreshPanel(say) {
      if (!done || done.hidden || !ready()) return;
      var dr = draft();
      if (whenEl) whenEl.textContent = dr.when;
      if (again) { again.href = dr.href; again.setAttribute('aria-label', 'Open the email again for ' + dr.when); }
      if (raw) raw.value = 'To: ' + EMAIL + '\nSubject: ' + dr.subject + '\n\n' + dr.body;
      if (copy) copy.textContent = 'Copy message';
      if (say && announce) announce.textContent = 'Message updated for ' + dr.when + '. Nothing is booked until you send it.';
    }

    var pulse = 0;
    function sync(fromPick) {
      if (sel) {
        sel.textContent = label();
        sel.classList.toggle('is-set', ready());
      }
      if (panel && fromPick) {
        panel.classList.add('is-pulse');
        window.clearTimeout(pulse);
        pulse = window.setTimeout(function () { panel.classList.remove('is-pulse'); }, 320);
      }
      if (tzLine) {
        var t = tzText();
        tzLine.textContent = t;
        tzLine.hidden = !t;
      }
      if (go) {
        go.classList.toggle('is-waiting', !ready());
        if (goT) goT.textContent = ready() ? READY : WAITING;
      }
      if (err && ready()) err.textContent = '';
      if (done && !done.hidden) {
        if (!ready()) { done.hidden = true; if (announce) announce.textContent = ''; }
        else refreshPanel(!!fromPick);
      }
    }

    /* ── column 3 · the five windows ── */
    function renderHead() {
      if (!slotHead) return;
      slotHead.innerHTML = '';
      if (!picked.day) return;
      var a = document.createElement('span');
      a.className = 'caps';
      a.textContent = DAYN[picked.day.getDay()] + ' ' + MONN[picked.day.getMonth()] +
                      ' ' + picked.day.getDate();
      var b = document.createElement('span');
      b.className = 'caps';
      b.textContent = 'Pacific time';
      slotHead.appendChild(a);
      slotHead.appendChild(b);
      if (outsidePT) {
        var l = localOf(picked.day, WINDOWS[0]);
        if (l) {
          var c = document.createElement('span');
          c.className = 'caps';
          c.textContent = 'first window is ' + l + ' where you are';
          slotHead.appendChild(c);
        }
      }
    }

    function renderTimes() {
      timeWrap.innerHTML = '';
      renderHead();
      if (!picked.day) {
        var p = document.createElement('p');
        p.className = 'slot--none small';
        p.textContent = 'Pick a day to see times.';
        timeWrap.appendChild(p);
        return;
      }
      WINDOWS.forEach(function (t) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'slot';
        b.setAttribute('aria-pressed', String(picked.time === t));
        b.textContent = t;
        b.addEventListener('click', function () {
          picked.time = t;
          $$('.slot', timeWrap).forEach(function (o) { o.setAttribute('aria-pressed', String(o === b)); });
          sync(true);
        });
        timeWrap.appendChild(b);
      });
    }

    /* ── selection, shared by the month grid, the day list and the strip ── */
    function markDays() {
      var key = picked.day ? iso(picked.day) : '';
      $$('[data-iso]').forEach(function (b) {
        b.setAttribute('aria-selected', String(b.getAttribute('data-iso') === key));
      });
      $$('#cal-grid [data-iso]').forEach(function (b) {
        b.tabIndex = b.getAttribute('data-iso') === key ? 0 : -1;
      });
    }
    function selectDay(dt, say) {
      picked.day = dt;
      picked.time = null;
      markDays();
      renderTimes();
      sync(true);
      if (say && announce) {
        announce.textContent = DAYL[dt.getDay()] + ' ' + MONL[dt.getMonth()] + ' ' +
          dt.getDate() + ' selected. Pick one of the five windows.';
      }
    }

    /* ── column 2 · the month grid ── */
    function cell(tag) {
      var e = document.createElement(tag);
      e.className = 'cal__d' + (tag === 'span' ? ' cal__d--pad' : '');
      e.setAttribute('role', 'gridcell');
      return e;
    }
    function renderMonth() {
      var y = Math.floor(view / 12), m = view % 12;
      if (monthEl) monthEl.textContent = MONL[m] + ' ' + y;
      if (prevB) prevB.disabled = view <= minM;
      if (nextB) nextB.disabled = view >= maxM;

      grid.innerHTML = '';

      var head = document.createElement('div');
      head.className = 'cal__row cal__wd';
      head.setAttribute('role', 'row');
      WD.forEach(function (w) {
        var s = document.createElement('span');
        s.className = 'caps';
        s.setAttribute('role', 'columnheader');
        s.textContent = w;
        head.appendChild(s);
      });
      grid.appendChild(head);

      var first = new Date(y, m, 1);
      var lead = (first.getDay() + 6) % 7;           /* Monday-first grid */
      var dim = new Date(y, m + 1, 0).getDate();

      for (var r = 0; r < 6; r++) {
        var row = document.createElement('div');
        row.className = 'cal__row';
        row.setAttribute('role', 'row');
        for (var c = 0; c < 7; c++) {
          var n = r * 7 + c - lead + 1;
          if (n < 1 || n > dim) { row.appendChild(cell('span')); continue; }
          var dt = new Date(y, m, n);
          var key = iso(dt);
          var b = cell('button');
          b.type = 'button';
          b.textContent = n;
          b.setAttribute('aria-label', DAYL[dt.getDay()] + ', ' + MONL[m] + ' ' + n);
          if (open[key]) {
            b.setAttribute('data-iso', key);
            b.setAttribute('aria-selected', 'false');
            b.tabIndex = -1;
            b.addEventListener('click', bindPick(open[key]));
          } else {
            b.disabled = true;
            b.setAttribute('aria-disabled', 'true');
            b.tabIndex = -1;
          }
          row.appendChild(b);
        }
        grid.appendChild(row);
      }
      markDays();
    }
    function bindPick(dt) { return function () { selectDay(dt, true); }; }

    if (prevB) prevB.addEventListener('click', function () { if (view > minM) { view--; renderMonth(); } });
    if (nextB) nextB.addEventListener('click', function () { if (view < maxM) { view++; renderMonth(); } });

    /* roving focus across the enabled cells, which are the only ones a
       keyboard has any reason to reach */
    grid.addEventListener('keydown', function (e) {
      var k = e.key;
      if (k !== 'ArrowLeft' && k !== 'ArrowRight' && k !== 'ArrowUp' &&
          k !== 'ArrowDown' && k !== 'Home' && k !== 'End') return;
      var cells = $$('#cal-grid button[data-iso]');
      if (!cells.length) return;
      var i = cells.indexOf(document.activeElement);
      var to = i;
      if (k === 'Home') to = 0;
      else if (k === 'End') to = cells.length - 1;
      else if (i < 0) to = 0;
      else if (k === 'ArrowLeft' || k === 'ArrowUp') to = Math.max(0, i - 1);
      else to = Math.min(cells.length - 1, i + 1);
      e.preventDefault();
      cells.forEach(function (c) { c.tabIndex = -1; });
      cells[to].tabIndex = 0;
      cells[to].focus();
    });

    /* ── the phone day list · a 7-column grid cannot make a 44px target ── */
    (function renderList() {
      list.innerHTML = '';
      days.forEach(function (dt) {
        var li = document.createElement('li');
        var b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('data-iso', iso(dt));
        b.setAttribute('aria-selected', 'false');
        b.innerHTML = '<span>' + DAYN[dt.getDay()] + ' ' + MONN[dt.getMonth()] + ' ' +
                      dt.getDate() + '</span><em>' + DAYL[dt.getDay()] + '</em>';
        b.setAttribute('aria-label', DAYL[dt.getDay()] + ', ' + MONL[dt.getMonth()] + ' ' + dt.getDate());
        b.addEventListener('click', bindPick(dt));
        li.appendChild(b);
        list.appendChild(li);
      });
    })();

    renderMonth();

    /* first available weekday preselected, without announcing or pulsing */
    picked.day = days[0];
    markDays();
    renderTimes();
    sync(false);

    /* the openings strip mirrors real generated slots */
    (function openings() {
      var wrap = $('#open-slots');
      if (!wrap || !days.length) return;
      var picks = [
        { d: 0, t: WINDOWS[0] },
        { d: 0, t: WINDOWS[3] },
        { d: 1, t: WINDOWS[1] }
      ];
      wrap.innerHTML = '';
      picks.forEach(function (p) {
        var dt = days[p.d];
        if (!dt) return;
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'openslot';
        b.innerHTML = '<b>' + DAYN[dt.getDay()] + ' ' + MONN[dt.getMonth()] + ' ' + dt.getDate() +
                      '</b><span>' + p.t + '</span>';
        b.addEventListener('click', function () {
          selectDay(dt, false);
          var match = $$('.slot', timeWrap).filter(function (s) { return s.textContent === p.t; })[0];
          if (match) match.click();
          var book = document.getElementById('book');
          if (book) book.scrollIntoView({ behavior: RM.matches ? 'auto' : 'smooth', block: 'start' });
        });
        wrap.appendChild(b);
      });
    })();

    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!ready()) {
          if (err) err.textContent = 'Pick a day and a time first.';
          timeWrap.scrollIntoView({ behavior: RM.matches ? 'auto' : 'smooth', block: 'center' });
          return;
        }
        var nameEl = $('#bf-name');
        if (nameEl && !nameEl.value.replace(/\s+/g, '')) {
          if (err) err.textContent = 'Add your name so I know who I am confirming with.';
          nameEl.focus();
          return;
        }
        if (err) err.textContent = '';
        var dr = draft();
        if (done) {
          done.hidden = false;
          refreshPanel(false);
          if (announce) announce.textContent = 'Your email app should be opening for ' + dr.when +
            '. It is not booked until you press Send. If nothing opened, copy the message below.';
        }
        try { window.location.href = dr.href; } catch (e2) {}
      });

      ['#bf-name', '#bf-biz'].forEach(function (s) {
        var i = $(s);
        if (i) i.addEventListener('input', function () { refreshPanel(false); });
      });
    }

    if (copy && raw) {
      copy.addEventListener('click', function () {
        function ok() {
          copy.textContent = 'Copied';
          if (announce) announce.textContent = 'Message copied to your clipboard.';
        }
        function manual() { raw.focus(); raw.select(); copy.textContent = 'Press Ctrl/Cmd + C'; }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(raw.value).then(ok, manual);
        } else { manual(); }
      });
    }
  })();

  /* ─────────────────────────────────────────────
     CLOCK · San Francisco, off the shared ticker, repainted every 20s.
     ───────────────────────────────────────────── */
  (function clock() {
    var el = $('#sf-clock');
    if (!el) return;
    var last = -1;
    function paint() {
      try {
        el.textContent = new Intl.DateTimeFormat('en-US', {
          hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles'
        }).format(new Date());
      } catch (e) { el.textContent = ''; }
    }
    function tick(t) { if (last < 0 || t - last > 20000) { last = t; paint(); } }
    paint();
    if (RM.matches) return;
    ticker.add(tick);
    registerLoop({ start: function () { ticker.add(tick); }, final: function () { ticker.remove(tick); paint(); } });
  })();

  /* ─────────────────────────────────────────────
     DOCK · one action, below 880px only. Raises once the hero CTA has
     left the screen, lowers again while the booking block is on screen,
     so there are never two competing calls to action in view.
     ───────────────────────────────────────────── */
  (function dock() {
    var el = $('#dock');
    if (!el || !hasIO) return;
    var heroCta = $('.hero__cta'), book = $('#book');
    if (!heroCta || !book) return;

    var pastHero = false, atBook = false;
    function paint() { el.classList.toggle('is-up', pastHero && !atBook); }

    new IntersectionObserver(function (entries) {
      var e = entries[0];
      // "Not intersecting" happens on both sides of the viewport. Only a CTA
      // sitting above it counts as scrolled past; one below it simply has not
      // been reached yet, which is the case at load in a short landscape
      // viewport where the CTA starts below the fold.
      var viewTop = e.rootBounds ? e.rootBounds.top : 0;
      pastHero = !e.isIntersecting && e.boundingClientRect.bottom <= viewTop;
      paint();
    }, { threshold: 0 }).observe(heroCta);

    new IntersectionObserver(function (entries) {
      atBook = entries[0].isIntersecting;
      paint();
    }, { threshold: 0, rootMargin: '-25% 0px -25% 0px' }).observe(book);
  })();

  /* ─────────────────────────────────────────────
     MAGNETIC · the two primary calls to action, 8px maximum, fine
     pointers only. The rect is cached and refreshed on a debounced
     resize; getBoundingClientRect is never called inside pointermove.
     ───────────────────────────────────────────── */
  (function magnetic() {
    if (RM.matches) return;
    if (!window.matchMedia('(hover:hover) and (pointer:fine)').matches) return;
    var els = $$('[data-magnetic]');
    if (!els.length) return;

    var MAX = 8;
    var rects = [];
    function measure() { rects = els.map(function (e) { return e.getBoundingClientRect(); }); }
    measure();

    var t = 0;
    window.addEventListener('resize', function () {
      window.clearTimeout(t);
      t = window.setTimeout(measure, 150);
    });
    window.addEventListener('scroll', function () {
      window.clearTimeout(t);
      t = window.setTimeout(measure, 150);
    }, { passive: true });

    els.forEach(function (el, i) {
      el.addEventListener('pointermove', function (e) {
        var r = rects[i];
        if (!r || !r.width) return;
        var dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
        var dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
        el.style.transform = 'translate3d(' +
          Math.max(-1, Math.min(1, dx)) * MAX + 'px,' +
          Math.max(-1, Math.min(1, dy)) * MAX + 'px,0)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
      el.addEventListener('blur', function () { el.style.transform = ''; });
    });
  })();

  /* ─────────────────────────────────────────────
     REDUCED MOTION WATCHER · iOS and macOS both let a user flip this
     mid-session, so every loop can be stopped and re-started in place.
     ───────────────────────────────────────────── */
  (function reducedMotionWatcher() {
    function apply(reduce) {
      for (var i = 0; i < LOOPS.length; i++) {
        if (reduce) { if (LOOPS[i].final) LOOPS[i].final(); }
        else        { if (LOOPS[i].start) LOOPS[i].start(); }
      }
    }
    if (RM.matches) apply(true);
    var handler = function (e) { apply(e.matches); };
    if (RM.addEventListener) RM.addEventListener('change', handler);
    else if (RM.addListener) RM.addListener(handler);
  })();

})();
