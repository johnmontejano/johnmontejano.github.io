/* =============================================================================
   JOHN MONTEJANO . SITEWIDE BEHAVIOUR
   Enhancement only. Everything on the page is already correct and readable
   before this file runs, and stays correct if it never runs.

   1. header disclosure   . real button, aria-expanded, no focus trap
   2. the run toggle      . flips a CSS class. The visual change is CSS
                            transitions, never a tween, so the end state is
                            right even if no frame ever paints.
   3. scroll reveals      . transform only, never opacity. Opted in by adding
                            .reveal-ready to <html> from here, so a script that
                            fails to load can never leave content displaced.
   4. booking             . composes a mailto and never destroys the form.
   The hero entrance is pure CSS. No animation library is loaded anywhere.
   ============================================================================= */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduce = false;
  try {
    reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) { /* very old browser: treat as no preference */ }

  /* --------------------------------------------------------- 1. HEADER --- */
  (function header() {
    var bar = document.querySelector('.hdr__in');
    if (!bar) return;
    var btn = bar.querySelector('.hdr__toggle');
    var nav = bar.querySelector('.nav');
    if (!btn || !nav) return;

    /* the button ships with [hidden] so no-JS visitors never meet a dead
       control. Only reveal it once we can actually operate it. */
    btn.removeAttribute('hidden');

    function setOpen(open) {
      bar.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    setOpen(false);

    btn.addEventListener('click', function () {
      setOpen(btn.getAttribute('aria-expanded') !== 'true');
    });

    nav.addEventListener('click', function (ev) {
      if (ev.target.closest('a')) setOpen(false);
    });

    document.addEventListener('keydown', function (ev) {
      if (ev.key !== 'Escape') return;
      if (btn.getAttribute('aria-expanded') !== 'true') return;
      setOpen(false);
      btn.focus();
    });

    document.addEventListener('click', function (ev) {
      if (btn.getAttribute('aria-expanded') !== 'true') return;
      if (bar.contains(ev.target)) return;
      setOpen(false);
    });

    /* above the disclosure breakpoint the nav is a plain row again, so the
       expanded state must not linger in the accessibility tree */
    var wide = window.matchMedia('(min-width: 760px)');
    var onWide = function (m) { if (m.matches) setOpen(false); };
    if (wide.addEventListener) wide.addEventListener('change', onWide);
    else if (wide.addListener) wide.addListener(onWide);
  }());

  /* ------------------------------------------------------ 2. RUN TOGGLE -- */
  (function run() {
    var stage = document.getElementById('stage');
    if (!stage) return;
    var group = document.querySelector('.toggle');
    if (!group) return;
    var buttons = group.querySelectorAll('.toggle__b');
    if (!buttons.length) return;

    group.removeAttribute('hidden');

    function apply(state) {
      stage.classList.toggle('is-after', state === 'after');
      for (var i = 0; i < buttons.length; i++) {
        var on = buttons[i].getAttribute('data-run') === state;
        buttons[i].setAttribute('aria-pressed', on ? 'true' : 'false');
      }
    }
    apply('now');

    group.addEventListener('click', function (ev) {
      var b = ev.target.closest('.toggle__b');
      if (!b) return;
      apply(b.getAttribute('data-run'));
    });
  }());

  /* --------------------------------------------------------- 3. REVEALS -- */
  (function reveals() {
    var items = document.querySelectorAll('.reveal');
    if (!items.length) return;

    if (reduce || !('IntersectionObserver' in window)) return; /* stay static */

    root.classList.add('reveal-ready');

    var io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (!entries[i].isIntersecting) continue;
        entries[i].target.classList.add('is-in');
        io.unobserve(entries[i].target);
      }
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });

    for (var i = 0; i < items.length; i++) io.observe(items[i]);

    /* belt and braces: anything still untouched after load settles is shown */
    window.addEventListener('load', function () {
      setTimeout(function () {
        var left = document.querySelectorAll('.reveal:not(.is-in)');
        for (var j = 0; j < left.length; j++) {
          var r = left[j].getBoundingClientRect();
          if (r.top < window.innerHeight) left[j].classList.add('is-in');
        }
      }, 200);
    });
  }());

  /* --------------------------------------------------------- 5. BOOKING -- */
  /* /book/ only. There is no backend and GitHub Pages cannot receive a post,
     so the form composes a mailto: and opens it.

     Three rules this module must never break:
       a. the form is NEVER removed, replaced or cleared. If the device has no
          mail handler the visitor still has every word they typed, editable.
       b. the confirmation panel is inserted ABOVE the surviving form and
          carries the slot, the same mailto again, the plain address, and the
          whole message in a readonly field with a copy button.
       c. the submit control uses aria-disabled, never the disabled attribute,
          so it stays reachable by keyboard, and the submit handler is what
          actually reports an incomplete request.

     With no JavaScript none of this runs: the form is a plain
     <form action="mailto:..." method="post" enctype="text/plain">, the day and
     time buttons stay hidden, and the free text field carries the request. */
  (function booking() {
    var form = document.getElementById('bk-form');
    if (!form) return;

    var TO = 'johnmontejano2@gmail.com';
    var pick = document.getElementById('bk-pick');
    var dayBox = document.getElementById('bk-days');
    var timeBox = document.getElementById('bk-times');
    var chosen = document.getElementById('bk-chosen');
    var alertBox = document.getElementById('bk-alert');
    var panel = document.getElementById('bk-done');
    var submit = document.getElementById('bk-submit');
    var again = document.getElementById('bk-again');
    var slotOut = document.getElementById('bk-slot');
    var msgOut = document.getElementById('bk-msg');
    var copyBtn = document.getElementById('bk-copy');
    var copyStatus = document.getElementById('bk-copy-status');

    /* our own validation from here on, so the picker case is handled in the
       same place as everything else. The required attributes stay in the HTML
       for the no-JS floor. */
    form.setAttribute('novalidate', 'novalidate');

    /* ---- the offer. Ten upcoming weekdays, a broad working day of times ---- */
    var DAY_L = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    var DAY_S = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    var MON_L = ['January', 'February', 'March', 'April', 'May', 'June',
                 'July', 'August', 'September', 'October', 'November', 'December'];
    var MON_S = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var TIMES = ['8:00 AM', '9:30 AM', '11:00 AM', '12:30 PM',
                 '2:00 PM', '3:30 PM', '5:00 PM', '6:00 PM'];

    function upcomingWeekdays(n) {
      var out = [];
      var d = new Date();
      d.setHours(12, 0, 0, 0);
      d.setDate(d.getDate() + 1);           /* today is already under way */
      var guard = 0;
      while (out.length < n && guard < 60) {
        guard++;
        var w = d.getDay();
        if (w !== 0 && w !== 6) {
          out.push({
            label: DAY_S[w] + ' ' + MON_S[d.getMonth()] + ' ' + d.getDate(),
            value: DAY_L[w] + ', ' + MON_L[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear()
          });
        }
        d.setDate(d.getDate() + 1);
      }
      return out;
    }

    function esc(s) {
      return String(s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function paint(box, name, items) {
      var html = '';
      for (var i = 0; i < items.length; i++) {
        var id = name + '-' + i;
        html += '<label class="opt" for="' + id + '">'
              + '<input type="radio" id="' + id + '" name="' + name + '" value="' + esc(items[i].value) + '">'
              + '<span>' + esc(items[i].label) + '</span></label>';
      }
      box.innerHTML = html;
    }

    if (pick && dayBox && timeBox) {
      var days = upcomingWeekdays(10);
      var times = [];
      for (var t = 0; t < TIMES.length; t++) times.push({ label: TIMES[t], value: TIMES[t] });
      paint(dayBox, 'day', days);
      paint(timeBox, 'time', times);
      pick.removeAttribute('hidden');
    }

    /* ------------------------------------------------------- reading it --- */
    function radio(name) {
      var el = form.querySelector('input[name="' + name + '"]:checked');
      return el ? el.value : '';
    }
    function text(id) {
      var el = document.getElementById(id);
      return el ? el.value.replace(/\s+$/, '').replace(/^\s+/, '') : '';
    }
    function zone() {
      try {
        var z = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (z) return z;
      } catch (e) { /* fall through */ }
      return 'not detected';
    }

    /* the requested slot, whichever way the visitor asked for it. Free text on
       its own is a complete request and becomes the slot. */
    function slotLine() {
      var d = radio('day'), t = radio('time'), o = text('bk-when');
      if (d && t) return d + ' at ' + t + ' Pacific';
      if (d) return d + ', time still to agree';
      if (o) return o;
      return 'To be agreed';
    }

    function subject() {
      var s = slotLine();
      if (s.length > 78) s = s.slice(0, 75) + '...';
      return 'Call request, ' + s;
    }

    function bodyText() {
      var L = [];
      L.push('Requested slot: ' + slotLine());
      var other = text('bk-when');
      if (other && radio('day')) L.push('Also works: ' + other);
      L.push('');
      L.push('Name: ' + text('bk-name'));
      L.push('Email: ' + text('bk-email'));
      var biz = text('bk-business');
      if (biz) L.push('Business: ' + biz);
      L.push('My timezone: ' + zone());
      var ctx = text('bk-context');
      if (ctx) {
        L.push('');
        L.push('Where the time goes:');
        L.push(ctx);
      }
      L.push('');
      L.push('Sent from the request form at johnmontejano.github.io/book/');
      L.push('Nothing is booked until John replies to confirm.');
      return L.join('\n');
    }

    function mailtoUrl() {
      return 'mailto:' + TO
           + '?subject=' + encodeURIComponent(subject())
           + '&body=' + encodeURIComponent(bodyText());
    }

    /* -------------------------------------------------------- what is it -- */
    function firstRadio(name) {
      return form.querySelector('input[name="' + name + '"]');
    }

    function problems() {
      var out = [];
      var d = radio('day'), t = radio('time'), o = text('bk-when');
      if (!o && !(d && t)) {
        out.push({
          why: d ? 'Pick a time as well, or tell me when suits you.'
                 : 'Pick a day and a time, or tell me when suits you.',
          el: (d ? firstRadio('time') : firstRadio('day')) || document.getElementById('bk-when')
        });
      }
      if (!text('bk-name')) {
        out.push({ why: 'Add your name.', el: document.getElementById('bk-name') });
      }
      var mail = text('bk-email');
      if (!mail) {
        out.push({ why: 'Add an email address so I can reply.', el: document.getElementById('bk-email') });
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) {
        out.push({ why: 'That email address does not look complete.', el: document.getElementById('bk-email') });
      }
      return out;
    }

    function chosenLine() {
      var d = radio('day'), t = radio('time');
      if (d && t) return 'Chosen: ' + d + ' at ' + t + ', Pacific.';
      if (d) return 'Chosen: ' + d + '. Now pick a time, or tell me when suits you.';
      return 'No day picked yet. If none of these work, tell me when below and that is enough.';
    }

    function refresh() {
      if (chosen) chosen.textContent = chosenLine();
      if (submit) submit.setAttribute('aria-disabled', problems().length ? 'true' : 'false');
    }

    form.addEventListener('input', refresh);
    form.addEventListener('change', refresh);
    refresh();

    /* ----------------------------------------------------------- submit --- */
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();

      var bad = problems();
      if (bad.length) {
        if (alertBox) {
          var lines = [];
          for (var i = 0; i < bad.length; i++) lines.push(bad[i].why);
          alertBox.textContent = 'Almost. ' + lines.join(' ');
          alertBox.removeAttribute('hidden');
        }
        if (bad[0].el && bad[0].el.focus) bad[0].el.focus();
        refresh();
        return;
      }
      if (alertBox) {
        alertBox.setAttribute('hidden', 'hidden');
        alertBox.textContent = '';
      }

      var url = mailtoUrl();

      /* Fill the panel BEFORE handing off, so the visitor lands back on a page
         that already has everything, whatever the mail handler does. The form
         below is not touched. */
      if (panel) {
        if (slotOut) slotOut.textContent = slotLine();
        if (again) again.href = url;
        if (msgOut) {
          msgOut.value = 'To: ' + TO + '\nSubject: ' + subject() + '\n\n' + bodyText();
        }
        if (copyStatus) copyStatus.textContent = '';
        panel.removeAttribute('hidden');
        /* only measurable once the panel is laid out. Grow the readonly field
           to the message so no line is left half cut off. */
        if (msgOut) {
          try {
            msgOut.style.height = 'auto';
            msgOut.style.height = Math.min(msgOut.scrollHeight + 2, 620) + 'px';
          } catch (e) { /* keep the CSS floor */ }
        }
        try { panel.focus(); } catch (e) { /* older browsers */ }
        if (panel.scrollIntoView) {
          panel.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
        }
      }

      try { window.location.href = url; } catch (e) { /* no mail handler */ }
    });

    /* ------------------------------------------------------------- copy --- */
    if (copyBtn && msgOut) {
      copyBtn.addEventListener('click', function () {
        function said(ok) {
          if (copyStatus) {
            copyStatus.textContent = ok
              ? 'Copied. Paste it into any email to ' + TO + '.'
              : 'Could not copy for you. Select the text above and copy it.';
          }
        }
        function manual() {
          try {
            msgOut.focus();
            msgOut.select();
            if (msgOut.setSelectionRange) msgOut.setSelectionRange(0, msgOut.value.length);
            said(document.execCommand('copy'));
          } catch (e) { said(false); }
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(msgOut.value).then(function () { said(true); }, manual);
        } else {
          manual();
        }
      });
    }
  }());
}());
