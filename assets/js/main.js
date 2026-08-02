/* ══════════════════════════════════════════════════════════
   John Montejano — site behaviour
   Progressive enhancement: everything below is additive.
   The page is complete and readable with this file blocked.
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
     2. TYPER — the Claude-style type / hold / erase slot
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
      'the schedule that double-booked a truck'
    ];

    if (reduce) { out.textContent = lines[0] + '.'; return; }

    var TYPE = 42, ERASE = 18, HOLD = 1750, GAP = 320;
    var i = 0, c = 0, erasing = false;

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
    setTimeout(tick, 700);
  })();

  /* ─────────────────────────────────────────────
     3. THE MACHINE — replays one job, end to end
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

    /* The panel is the largest object on the page. Empty, it read as a panel
       that had failed to load — 75% dead black for the first four seconds, which
       is the entire first impression and the window Lighthouse films. So the
       first thing anyone sees is a FINISHED job: call through to invoice paid,
       already done. That is also the stronger sales message. The replay is the
       bonus for whoever stays to watch it. */
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
          // keep the newest row in view as the list outgrows the panel
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
     4. LEAK SCENES — each vignette plays itself in view
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

    /* These loops used to start on entry and then run for the life of the tab:
       two setIntervals and a recursive setTimeout chain rewriting textContent
       every 46ms, forever, long after the visitor had scrolled past. Now every
       one of them has a teardown and it runs on exit. Nothing animates for an
       audience that isn't there. */
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
     5. BOOKING — real dates, real windows, one click
     ───────────────────────────────────────────── */
  (function booking() {
    var dayWrap = $('#slot-days'), timeWrap = $('#slot-times');
    if (!dayWrap || !timeWrap) return;

    var EMAIL = 'johnmontejano2@gmail.com';
    var WINDOWS = ['9:00 AM', '10:30 AM', '1:00 PM', '2:30 PM', '4:00 PM'];
    var DAYN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    var MONN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // next 8 weekdays, starting tomorrow
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

    /* ─── timezone: the page already reads the visitor's zone for the SF clock.
       Build the picked slot as a real instant in Los Angeles, then render it in
       whatever zone the browser reports. Pacific stays the canonical statement. ─── */
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
    // instant whose Los Angeles wall clock is day @ timeStr
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

    /* ─── the message. One source of truth for the panel, the link and the copy. ─── */
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
        'Business + trade: ' + (biz || '(add your business)') + '\n\n' +
        'What eats the most time right now:\n\n';
      return {
        when: when,
        subject: '30-min call — ' + when + (biz ? ' — ' + biz : ''),
        body: body,
        href: 'mailto:' + EMAIL + '?subject=' + encodeURIComponent('30-min call — ' + when + (biz ? ' — ' + biz : '')) +
              '&body=' + encodeURIComponent(body)
      };
    }

    /* Re-sync everything the panel shows. `announce` is true only when the slot
       itself changed or the panel just opened — never on a keystroke in Name or
       Business, so the live region does not chatter while someone types. */
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
      // a stale slot must never survive a change of mind
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
      // NOTE the space between </b> and <span>: it makes the tile's visible text
      // read "28 Tue" rather than "28Tue", so the aria-label below can contain
      // it verbatim. .day is a grid container, and a whitespace-only text node
      // is never rendered as a grid item, so this costs nothing in layout.
      b.innerHTML = '<b>' + dt.getDate() + '</b> <span>' + DAYN[dt.getDay()] + '</span>';
      // The accessible name must CONTAIN the visible text ("28 Tue"), or the
      // button trips WCAG 2.5.3 Label in Name. Date first, weekday second,
      // month and year appended — same order the tile reads on screen.
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

    /* ─── the "next openings" strip mirrors the same three real slots ─── */
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
          // the old guard was a bare `return`: the click did nothing, silently
          if (err) err.textContent = 'Pick a day and a time first, then try again.';
          if (timeWrap) timeWrap.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
          return;
        }
        if (err) err.textContent = '';

        var d = draft();
        // The form is left exactly as the visitor typed it — still filled, still
        // editable. The panel appears underneath it as a receipt and a fallback.
        if (done) {
          done.hidden = false;
          refreshPanel(false);
          if (live) live.textContent = 'Your email app should be opening for ' + d.when +
            '. It is not booked until you press Send. If nothing opened, copy the message below.';
        }
        try { window.location.href = d.href; } catch (e2) {}
      });

      // typing a name or a business changes the message but not the slot —
      // re-sync silently so nothing stale can ever be copied or sent
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
     7. SCROLL REVEALS
     ───────────────────────────────────────────── */
  (function reveals() {
    if (reduce || !('IntersectionObserver' in window)) return;

    /* Nothing above the fold reveals. An element that starts transformed off its
       final position is not a settled LCP candidate, and the hero H1 is the LCP
       element — measured at 856ms of pure deferral for an entrance nobody asked
       for. The hero is already the first thing you see; it does not need to
       announce itself. The booking head is off the list for the same reason:
       it is the entry point for anyone arriving on #book. */
    var groups = [
      ['.sec__head > *', 0],
      ['.leak', 1],
      ['.cap', 1],
      ['.trades', 0],
      ['.proj', 0],
      ['.stepc', 1],
      ['.about__fig', 0],
      ['.about__copy > *', 1],
      ['.slots', 0],
      ['.book__side', 1],
      ['.faq__row', 1],
      ['.foot__top > *', 0]
    ];

    var seen = [];
    groups.forEach(function (g) {
      $$(g[0]).forEach(function (el, i) {
        if (seen.indexOf(el) > -1) return;
        seen.push(el);
        el.classList.add('rv');
        if (g[1]) el.classList.add('rv-d' + Math.min(4, i % 4 + 1));
      });
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        io.unobserve(en.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

    seen.forEach(function (el) { io.observe(el); });

    // failsafe: never leave content hidden
    setTimeout(function () {
      seen.forEach(function (el) { el.classList.add('is-in'); });
    }, 3500);
  })();

})();
