/* ══════════════════════════════════════════════════════════
   John Montejano — site behaviour
   Progressive enhancement: the page is complete and readable
   with this file blocked, with reduced motion, and on touch.
   GSAP reads the scroll. It never takes it.
   ══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ─────────────────────────────────────────────
     1. NAV — stuck state + mobile drawer
     ───────────────────────────────────────────── */
  (function nav() {
    var el = $('#nav');
    if (!el) return;
    var sentinel = document.createElement('div');
    sentinel.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:60px;pointer-events:none';
    document.body.appendChild(sentinel);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) {
        el.classList.toggle('is-stuck', !e[0].isIntersecting);
      }).observe(sentinel);
    }

    var burger = $('#burger'), drawer = $('#drawer');
    if (!burger || !drawer) return;
    function setOpen(open) {
      burger.setAttribute('aria-expanded', String(open));
      drawer.hidden = !open;
      document.body.classList.toggle('is-locked', open);
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    }
    burger.addEventListener('click', function () {
      setOpen(burger.getAttribute('aria-expanded') !== 'true');
    });
    drawer.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !drawer.hidden) { setOpen(false); burger.focus(); }
    });
  })();

  /* ─────────────────────────────────────────────
     2. TYPER — type / hold / erase. The markup ships with the
     first line already in place, so no-JS reads a real sentence.
     ───────────────────────────────────────────── */
  (function typer() {
    var out = $('#typer-out');
    if (!out) return;

    var lines = [
      'the 7:04pm call nobody answered',
      'quote follow-ups that never get sent',
      'the same address typed into three apps',
      'invoices that go out three weeks late',
      'review requests after every finished job',
      'the reminder that stops the no-show'
    ];

    if (reduce) { out.textContent = lines[0] + '.'; return; }

    var TYPE = 42, ERASE = 18, HOLD = 1750, GAP = 320;
    // the first line is pre-rendered: start by holding it, then erase
    var i = 0, c = lines[0].length, erasing = true;

    function tick() {
      var line = lines[i];
      if (!erasing) {
        c++;
        out.textContent = line.slice(0, c);
        if (c === line.length) { erasing = true; return setTimeout(tick, HOLD); }
        return setTimeout(tick, TYPE + Math.random() * 34);
      }
      c--;
      out.textContent = line.slice(0, c);
      if (c === 0) { erasing = false; i = (i + 1) % lines.length; return setTimeout(tick, GAP); }
      setTimeout(tick, ERASE);
    }
    setTimeout(tick, HOLD + 700);
  })();

  /* ─────────────────────────────────────────────
     3. THE MACHINE — replays one job, end to end.
     First paint shows the FINISHED job; the replay is the bonus.
     ───────────────────────────────────────────── */
  (function machine() {
    var feed = $('#feed');
    if (!feed) return;
    var evs = $$('.ev', feed);
    if (!evs.length) return;

    if (reduce) { evs.forEach(function (e) { e.classList.add('is-in'); }); return; }

    var STEP = 1150, RESET = 3600;
    var timers = [], running = false, first = true;

    function clear() { timers.forEach(clearTimeout); timers = []; }

    function fill() {
      clear();
      evs.forEach(function (e) { e.classList.add('is-in'); });
      feed.scrollTop = feed.scrollHeight;
      timers.push(setTimeout(function () { first = false; play(); }, RESET));
    }

    function play() {
      if (first) return fill();
      clear();
      evs.forEach(function (e) { e.classList.remove('is-in'); });
      feed.scrollTop = 0;
      evs.forEach(function (e, n) {
        timers.push(setTimeout(function () {
          e.classList.add('is-in');
          var over = feed.scrollHeight - feed.clientHeight;
          if (over > 0) {
            var y = Math.min(over, e.offsetTop - feed.clientHeight + e.offsetHeight + 24);
            feed.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
          }
        }, 420 + n * STEP));
      });
      timers.push(setTimeout(play, 420 + evs.length * STEP + RESET));
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting && !running) { running = true; play(); }
          else if (!en.isIntersecting && running) { running = false; clear(); }
        });
      }, { threshold: 0.18 }).observe(feed);
    } else { play(); }
  })();

  /* ─────────────────────────────────────────────
     4. LEAK SCENES — each vignette plays only while on screen,
     and every loop has a teardown.
     ───────────────────────────────────────────── */
  (function scenes() {
    var cards = $$('.leak');
    if (!cards.length || reduce) {
      cards.forEach(function (c) { c.classList.add('is-play'); });
      return;
    }

    var loops = {};

    function ringCounter(card) {
      var el = $('.js-rings', card); if (!el) return;
      var n = 1;
      loops.call = setInterval(function () {
        n = n >= 6 ? 1 : n + 1;
        el.textContent = n;
      }, 900);
    }

    function dayCounter(card) {
      var el = $('.js-days', card); if (!el) return;
      var days = [2, 3, 5, 8, 11, 14], n = 0;
      loops.quote = setInterval(function () {
        el.textContent = days[n];
        n = (n + 1) % days.length;
      }, 620);
    }

    function doubleType(card) {
      var a = $('.js-typeA', card), b = $('.js-typeB', card);
      if (!a || !b) return;
      var text = 'M. Delgado · 2118 Elm St';
      var t = [];
      function wipe() { t.forEach(clearTimeout); t = []; }
      function run() {
        wipe();
        a.textContent = ''; b.textContent = '';
        for (var i = 1; i <= text.length; i++) {
          (function (i) { t.push(setTimeout(function () { a.textContent = text.slice(0, i); }, i * 46)); })(i);
        }
        var off = text.length * 46 + 620;
        for (var j = 1; j <= text.length; j++) {
          (function (j) { t.push(setTimeout(function () { b.textContent = text.slice(0, j); }, off + j * 46)); })(j);
        }
        t.push(setTimeout(run, off + text.length * 46 + 2100));
      }
      run();
      loops.typeStop = wipe;
    }

    function stop(kind) {
      if (kind === 'call'  && loops.call)  { clearInterval(loops.call);  loops.call = null; }
      if (kind === 'quote' && loops.quote) { clearInterval(loops.quote); loops.quote = null; }
      if (kind === 'type'  && loops.typeStop) { loops.typeStop(); }
    }
    function start(card, kind) {
      if (kind === 'call')  ringCounter(card);
      if (kind === 'quote') dayCounter(card);
      if (kind === 'type')  doubleType(card);
    }

    cards.forEach(function (card) {
      var kind = card.getAttribute('data-leak');
      var live = false;
      if (!('IntersectionObserver' in window)) { card.classList.add('is-play'); return; }
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            card.classList.add('is-play');
            if (live) return;
            live = true;
            start(card, kind);
          } else if (live) {
            live = false;
            card.classList.remove('is-play');
            stop(kind);
          }
        });
      }, { threshold: 0.32 }).observe(card);
    });
  })();

  /* ─────────────────────────────────────────────
     5. BOOKING — real dates, one click, nothing destroyed
     ───────────────────────────────────────────── */
  (function booking() {
    var dayWrap = $('#slot-days'), timeWrap = $('#slot-times');
    if (!dayWrap || !timeWrap) return;

    var EMAIL = 'johnmontejano2@gmail.com';
    var WINDOWS = ['9:00 AM', '10:30 AM', '1:00 PM', '2:30 PM', '4:00 PM'];
    var DAYN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    var MONN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    var days = [], d = new Date();
    d.setDate(d.getDate() + 1);
    while (days.length < 8) {
      if (d.getDay() !== 0 && d.getDay() !== 6) days.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }

    var picked = { day: null, time: null };
    var sel   = $('#book-sel'), form = $('#bf'), go = $('#bf-go');
    var goT   = $('#bf-go-t'), err = $('#bf-err'), tzLine = $('#book-tz');
    var done  = $('#bf-done'), live = $('#bf-live'), whenEl = $('#bf-when');
    var again = $('#bf-again'), raw = $('#bf-raw'), copy = $('#bf-copy');

    var WAITING = 'Pick a day and a time first';
    var READY   = 'Request this time';

    function ready() { return !!(picked.day && picked.time); }

    function label() {
      if (!picked.day) return 'No time picked yet';
      var s = DAYN[picked.day.getDay()] + ' ' + MONN[picked.day.getMonth()] + ' ' + picked.day.getDate();
      return picked.time ? s + ' at ' + picked.time + ' PT' : s + ' — pick a time';
    }

    var visitorTZ = '';
    try { visitorTZ = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
    var outsidePT = visitorTZ && visitorTZ.indexOf('Los_Angeles') < 0;

    function laParts(ms) {
      var p = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Los_Angeles', hour12: false,
        hour: '2-digit', minute: '2-digit'
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
    function tzText() {
      if (!outsidePT || !ready()) return '';
      try {
        var inst = ptInstant(picked.day, picked.time);
        if (!inst) return '';
        var local = new Intl.DateTimeFormat('en-US', {
          weekday: 'short', month: 'short', day: 'numeric',
          hour: 'numeric', minute: '2-digit'
        }).format(inst);
        return local + ' where you are (' + visitorTZ.split('/').pop().replace(/_/g, ' ') + ')';
      } catch (e) { return ''; }
    }

    function whenText() {
      return DAYN[picked.day.getDay()] + ' ' + MONN[picked.day.getMonth()] + ' ' +
             picked.day.getDate() + ' at ' + picked.time + ' Pacific';
    }
    function draft() {
      var name = ($('#bf-name') || {}).value || '';
      var biz  = ($('#bf-biz')  || {}).value || '';
      var when = whenText();
      var body = 'Hi John,\n\n' +
        'I would like the ' + when + ' slot.\n\n' +
        'Name: ' + (name || '(add your name)') + '\n' +
        'Business: ' + (biz || '(add your business)') + '\n\n' +
        'What eats the most time right now:\n\n';
      return {
        when: when,
        subject: '30-min call — ' + when + (biz ? ' — ' + biz : ''),
        body: body,
        href: 'mailto:' + EMAIL + '?subject=' + encodeURIComponent('30-min call — ' + when + (biz ? ' — ' + biz : '')) +
              '&body=' + encodeURIComponent(body)
      };
    }

    /* announce only when the slot changed or the panel opened — never per keystroke */
    function refreshPanel(announce) {
      if (!done || done.hidden || !ready()) return;
      var d = draft();
      if (whenEl) whenEl.textContent = d.when;
      if (again) { again.href = d.href; again.setAttribute('aria-label', 'Open the email again for ' + d.when); }
      if (raw) raw.value = 'To: ' + EMAIL + '\nSubject: ' + d.subject + '\n\n' + d.body;
      if (copy) copy.textContent = 'Copy message';
      if (announce && live) live.textContent = 'Message updated for ' + d.when + '. Nothing is booked until you send it.';
    }

    function sync(fromPick) {
      if (sel) {
        sel.textContent = label();
        sel.classList.toggle('is-set', ready());
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
        if (!ready()) {
          done.hidden = true;
          if (live) live.textContent = '';
        } else {
          refreshPanel(!!fromPick);
        }
      }
    }

    function renderTimes() {
      timeWrap.innerHTML = '';
      if (!picked.day) {
        var p = document.createElement('p');
        p.className = 'slot--none';
        p.textContent = 'Pick a day to see times.';
        timeWrap.appendChild(p);
        return;
      }
      WINDOWS.forEach(function (t) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'slot';
        b.setAttribute('role', 'tab');
        b.setAttribute('aria-selected', String(picked.time === t));
        b.textContent = t;
        b.addEventListener('click', function () {
          picked.time = t;
          $$('.slot', timeWrap).forEach(function (o) { o.setAttribute('aria-selected', String(o === b)); });
          sync(true);
        });
        timeWrap.appendChild(b);
      });
    }

    var dayBtns = [];
    days.forEach(function (dt, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'day';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', 'false');
      b.innerHTML = '<b>' + dt.getDate() + '</b> <span>' + DAYN[dt.getDay()] + '</span>';
      b.setAttribute('aria-label', dt.getDate() + ' ' + DAYN[dt.getDay()] + ', ' +
                                   MONN[dt.getMonth()] + ' ' + dt.getFullYear());
      b.addEventListener('click', function () {
        picked.day = dt; picked.time = null;
        $$('.day', dayWrap).forEach(function (o) { o.setAttribute('aria-selected', String(o === b)); });
        renderTimes(); sync(true);
      });
      dayWrap.appendChild(b);
      dayBtns.push(b);
      if (i === 0) setTimeout(function () { b.click(); }, 0);
    });

    renderTimes(); sync();

    /* the "typical times" strip mirrors real generated slots */
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
          dayBtns[p.d].click();
          var match = $$('.slot', timeWrap).filter(function (s) { return s.textContent === p.t; })[0];
          if (match) match.click();
          var book = document.getElementById('book');
          if (book) book.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
        });
        wrap.appendChild(b);
      });
    })();

    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!ready()) {
          if (err) err.textContent = 'Pick a day and a time first, then try again.';
          if (timeWrap) timeWrap.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
          return;
        }
        if (err) err.textContent = '';

        var d = draft();
        if (done) {
          done.hidden = false;
          refreshPanel(false);
          if (live) live.textContent = 'Your email app should be opening for ' + d.when +
            '. It is not booked until you press Send. If nothing opened, copy the message below.';
        }
        try { window.location.href = d.href; } catch (e2) {}
      });

      ['#bf-name', '#bf-biz'].forEach(function (s) {
        var i = $(s);
        if (i) i.addEventListener('input', function () { refreshPanel(false); });
      });
    }

    if (copy && raw) {
      copy.addEventListener('click', function () {
        function ok() { copy.textContent = 'Copied'; if (live) live.textContent = 'Message copied to your clipboard.'; }
        function manual() {
          raw.focus(); raw.select();
          copy.textContent = 'Press Ctrl/Cmd + C';
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(raw.value).then(ok, manual);
        } else { manual(); }
      });
    }
  })();

  /* ─────────────────────────────────────────────
     6. SF CLOCK
     ───────────────────────────────────────────── */
  (function clock() {
    var el = $('#sf-clock');
    if (!el) return;
    function paint() {
      try {
        el.textContent = new Intl.DateTimeFormat('en-US', {
          hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles'
        }).format(new Date());
      } catch (e) { el.textContent = ''; }
    }
    paint();
    setInterval(paint, 20000);
  })();

  /* ─────────────────────────────────────────────
     7. GSAP — scroll choreography.
     Transform-only. Nothing above the fold is deferred, nothing
     is hidden by default, and every trigger dies with its section.
     ───────────────────────────────────────────── */
  (function motion() {
    if (reduce || !window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);

    /* progress bar */
    var bar = $('#progress');
    if (bar) {
      gsap.to(bar, {
        scaleX: 1, ease: 'none',
        scrollTrigger: { start: 0, end: 'max', scrub: 0.4 }
      });
    }

    /* hero mark drifts against the scroll */
    var hbg = $('#hero-bg');
    if (hbg) {
      gsap.to(hbg, {
        yPercent: 26, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.6 }
      });
    }

    /* transform-only reveals — no opacity, so text is always readable */
    function rise(els, trigger) {
      els.forEach(function (el, n) {
        gsap.set(el, { y: 30 });
        gsap.to(el, {
          y: 0, duration: 0.9, ease: 'power3.out', delay: (n % 4) * 0.07,
          scrollTrigger: { trigger: trigger || el, start: 'top 88%', once: true }
        });
      });
    }
    rise($$('.cap'));
    rise($$('.proj__meta > *').slice(0, 60));
    rise($$('.stepc'));
    rise($$('.about__copy > *'));
    ['.worth__h', '.worth__p'].forEach(function (s) { rise($$(s)); });

    /* the leak shelf — pinned horizontal scroll on wide screens only */
    var mm = gsap.matchMedia();
    mm.add('(min-width: 1024px)', function () {
      var track = $('#leaks-track');
      if (!track) return;
      var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };
      if (dist() < 40) return;
      gsap.to(track, {
        x: function () { return -dist(); },
        ease: 'none',
        scrollTrigger: {
          trigger: '.leaks',
          start: 'top top',
          end: function () { return '+=' + (dist() + window.innerHeight * 0.25); },
          pin: true,
          scrub: 0.7,
          anticipatePin: 1,
          invalidateOnRefresh: true
        }
      });
    });
    mm.add('(max-width: 1023px)', function () {
      rise($$('.leak'));
    });

    /* work screenshots breathe against their frames */
    $$('.proj__shot img').forEach(function (img) {
      gsap.fromTo(img, { yPercent: -5 }, {
        yPercent: 5, ease: 'none',
        scrollTrigger: { trigger: img.closest('.proj'), start: 'top bottom', end: 'bottom top', scrub: 0.6 }
      });
    });

    /* the how-it-works rail draws as you read the steps */
    var railFill = $('#how-rail-fill');
    if (railFill) {
      var horizontal = window.matchMedia('(min-width: 1024px)').matches;
      gsap.fromTo(railFill,
        horizontal ? { scaleX: 0 } : { scaleY: 0 },
        Object.assign(horizontal ? { scaleX: 1 } : { scaleY: 1 }, {
          ease: 'none',
          scrollTrigger: { trigger: '.how__grid', start: 'top 75%', end: 'bottom 55%', scrub: 0.5 }
        })
      );
    }

    /* trades marquee shears with scroll velocity */
    var rows = $$('.trades__row');
    if (rows.length) {
      var skew = gsap.quickTo(rows, 'skewX', { duration: 0.4, ease: 'power2.out' });
      ScrollTrigger.create({
        trigger: '.trades', start: 'top bottom', end: 'bottom top',
        onUpdate: function (self) {
          skew(gsap.utils.clamp(-5, 5, self.getVelocity() / -260));
        },
        onLeave: function () { skew(0); },
        onLeaveBack: function () { skew(0); }
      });
    }

    /* the footer wordmark surfaces from below the fold */
    var word = $('#foot-word');
    if (word) {
      gsap.fromTo(word, { yPercent: 42 }, {
        yPercent: 0, ease: 'none',
        scrollTrigger: { trigger: '.foot__mark', start: 'top 96%', end: 'top 55%', scrub: 0.5 }
      });
    }

    /* custom cursor — fine pointers only */
    if (window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
      var dot = $('#cursor'), ring = $('#cursor-ring');
      if (dot && ring) {
        document.documentElement.classList.add('has-cursor');
        var dx = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power2.out' });
        var dy = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power2.out' });
        var rx = gsap.quickTo(ring, 'x', { duration: 0.38, ease: 'power2.out' });
        var ry = gsap.quickTo(ring, 'y', { duration: 0.38, ease: 'power2.out' });
        window.addEventListener('pointermove', function (e) {
          dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY);
        }, { passive: true });
        document.addEventListener('mouseover', function (e) {
          if (e.target.closest('a,button,summary,input,textarea')) ring.classList.add('is-on');
        });
        document.addEventListener('mouseout', function (e) {
          if (e.target.closest('a,button,summary,input,textarea')) ring.classList.remove('is-on');
        });
      }
    }

    /* type metrics settle after the webfonts land */
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
    }
  })();

})();
