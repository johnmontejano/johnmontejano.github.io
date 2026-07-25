/* ============================================================
   THE THROUGH-LINE — motion
   One rail, drawn by scroll, driving everything derived from it.
   Content renders visible; JS hides only what it will animate, and
   only when animation is actually going to run.
   ============================================================ */
(function () {
  "use strict";

  var doc = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGsap = typeof window.gsap !== "undefined";
  var animate = hasGsap && !reduce;
  var fine = window.matchMedia("(hover:hover) and (pointer:fine)").matches;

  /* ---------------------------------------------------------
     Width-axis justification.
     Each display line carries its own wdth so every line ends
     flush at the same right edge. Hand-set values ship in the
     HTML; this only refines them once the real font is ready.
     --------------------------------------------------------- */
  var inkRange = document.createRange();
  function inkWidth(el) {
    inkRange.selectNodeContents(el);
    return inkRange.getBoundingClientRect().width;
  }
  function justify(scope) {
    var lines = (scope || document).querySelectorAll(".ln");
    if (!lines.length) return;
    /* Only the wide composition justifies; below it the lines simply wrap. */
    if (!window.matchMedia("(min-width:1000px)").matches) {
      lines.forEach(function (ln) { ln.style.removeProperty("--wd"); });
      return;
    }
    lines.forEach(function (ln) {
      var target = ln.parentElement.getBoundingClientRect().width;
      if (!target) return;
      var lo = 62, hi = 125, best = parseFloat(ln.style.getPropertyValue("--wd")) || 100;
      for (var i = 0; i < 14; i++) {
        var mid = (lo + hi) / 2;
        ln.style.setProperty("--wd", mid.toFixed(2));
        var w = inkWidth(ln);
        if (Math.abs(w - target) < 0.4) { best = mid; break; }
        if (w > target) { hi = mid; } else { lo = mid; best = mid; }
      }
      ln.style.setProperty("--wd", best.toFixed(2));
    });
  }
  var justifyAll = function () { justify(document); };

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(justifyAll);
  } else {
    window.addEventListener("load", justifyAll);
  }
  var rt;
  window.addEventListener("resize", function () {
    clearTimeout(rt);
    rt = setTimeout(function () {
      justifyAll();
      if (animate && window.ScrollTrigger) ScrollTrigger.refresh();
    }, 150);
  });

  /* ---------------------------------------------------------
     Header repaint over the paper band.
     --------------------------------------------------------- */
  var head = document.getElementById("head");
  var paper = document.querySelector(".paper");
  if (head && paper && "IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { head.classList.toggle("on-paper", e.isIntersecting); });
    }, { rootMargin: "-64px 0px -100% 0px", threshold: 0 }).observe(paper);
  }

  /* ---------------------------------------------------------
     THE OPERATIONAL X-RAY.
     Eleven manual steps become four, and the visitor watches seven
     leave. The static markup already carries both states stacked and
     labelled, so this only runs when motion is actually available:
     no-JS and reduced-motion visitors keep the complete pair.
     --------------------------------------------------------- */
  (function xray() {
    var root = document.querySelector("[data-xray]");
    /* Reduced motion keeps the static stacked pair. Everything else here is
       CSS-transition driven rather than tweened, so the end state is applied
       by the style system and is correct even if the frame loop never runs
       (a backgrounded tab, a throttled device). GSAP is not required. */
    if (!root || reduce) return;
    var list = root.querySelector("[data-xray-list]");
    var toggle = root.querySelector("[data-xray-toggle]");
    var count = root.querySelector("[data-xray-count]");
    if (!list || !toggle || !count) return;

    var rows = Array.prototype.slice.call(list.children);
    var cuts = rows.filter(function (r) { return r.hasAttribute("data-cut"); });
    var keeps = rows.filter(function (r) { return r.hasAttribute("data-keep"); });
    if (!cuts.length || !keeps.length) return;

    var NOW = count.textContent;
    var AFTER = "Eleven steps became four. Seven gone. One is still you.";

    /* remember the "now" wording so the toggle really is reversible */
    keeps.forEach(function (r) {
      r._t = r.querySelector(".xr-t").textContent;
      r._g = r.querySelector(".xr-tag").textContent;
      r._n = r.querySelector(".xr-n").textContent;
      r._leak = r.classList.contains("leak");
    });

    var stateLabel = root.querySelector("[data-xray-state]");
    root.classList.add("xr-live");
    toggle.hidden = false;
    count.setAttribute("aria-live", "polite");

    var mode = "now", touched = false;
    var btns = Array.prototype.slice.call(toggle.querySelectorAll(".xr-btn"));

    function swap(after) {
      keeps.forEach(function (r, i) {
        var t = r.querySelector(".xr-t"),
            g = r.querySelector(".xr-tag"),
            n = r.querySelector(".xr-n");
        if (after) {
          t.textContent = r.getAttribute("data-after-t");
          g.textContent = r.getAttribute("data-after-tag");
          n.textContent = "0" + (i + 1);
          r.classList.remove("leak");
          r.classList.add(r.getAttribute("data-after-tag") === "Still you" ? "you" : "done");
        } else {
          t.textContent = r._t; g.textContent = r._g; n.textContent = r._n;
          r.classList.remove("you", "done");
          if (r._leak) r.classList.add("leak");
        }
      });
    }

    function press(next) {
      btns.forEach(function (b) {
        b.setAttribute("aria-pressed", b.getAttribute("data-state") === next ? "true" : "false");
      });
    }

    var swapTimer = null;
    function apply(next) {
      if (next === mode) return;
      mode = next; press(next);
      root.setAttribute("data-mode", next);
      clearTimeout(swapTimer);

      if (stateLabel) stateLabel.textContent = next === "after" ? "After" : "How it runs now";

      if (next === "after") {
        cuts.forEach(function (c) { c.setAttribute("aria-hidden", "true"); });
        /* The survivors re-letter and re-label part way through the removal,
           so the visitor sees four steps arrive rather than eleven relabel. */
        swapTimer = setTimeout(function () {
          swap(true);
          count.textContent = AFTER;
        }, 340);
      } else {
        cuts.forEach(function (c) { c.removeAttribute("aria-hidden"); });
        swap(false);
        count.textContent = NOW;
      }
    }

    btns.forEach(function (b) {
      b.addEventListener("click", function () {
        touched = true;
        apply(b.getAttribute("data-state"));
      });
    });

    var pane = list.parentNode;
    function reserve() {
      pane.style.minHeight = "";
      if (mode !== "now") return;
      pane.style.minHeight = Math.ceil(pane.getBoundingClientRect().height) + "px";
    }
    reserve();
    var rz; window.addEventListener("resize", function () {
      clearTimeout(rz); rz = setTimeout(reserve, 200);
    });

    /* Play the removal once, after a beat long enough to register that eleven
       steps is a lot. IntersectionObserver rather than ScrollTrigger so it does
       not depend on GSAP, and never replays on its own: the toggle is the
       replay control. */
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries, obs) {
        if (!entries[0].isIntersecting) return;
        obs.disconnect();
        setTimeout(function () {
          if (!touched && mode === "now") apply("after");
        }, 1700);
      }, { threshold: 0.55 });
      io.observe(list);
    }
  })();

  /* ---------------------------------------------------------
     Booking pickers + email compose. Runs with or without GSAP.
     --------------------------------------------------------- */
  (function booking() {
    var root = document.querySelector("[data-cal]");
    if (!root) return;
    var form = root.querySelector("form");
    var daysEl = root.querySelector("[data-days]");
    var slotsEl = root.querySelector("[data-slots]");
    var submit = root.querySelector("[data-submit]");
    var slotField = root.querySelector("[data-slot-field]");
    var tzField = root.querySelector("[data-tz-field]");
    if (!form || !daysEl || !slotsEl || !submit) return;

    var TO = "johnmontejano2@gmail.com";
    var DW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    var DL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    var ML = ["January", "February", "March", "April", "May", "June", "July",
              "August", "September", "October", "November", "December"];
    var SLOTS = ["9:00 AM", "10:30 AM", "12:00 PM", "2:00 PM", "3:30 PM", "5:00 PM"];
    var picked = { day: null, slot: null };

    try { if (tzField) tzField.value = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (e) {}

    var days = [], d = new Date();
    d.setDate(d.getDate() + 1);
    while (days.length < 10) {
      if (d.getDay() !== 0 && d.getDay() !== 6) days.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }

    function label(day, slot) {
      return DL[day.getDay()] + ", " + ML[day.getMonth()] + " " + day.getDate() +
             ", " + day.getFullYear() + " at " + slot + " Pacific";
    }
    function chosenText() {
      var other = root.querySelector("[name=othertime]");
      var o = other && other.value.trim();
      if (picked.day && picked.slot) return label(picked.day, picked.slot);
      return o ? ("Their suggestion: " + o) : "";
    }
    var hint = root.querySelector("[data-hint]");
    function update() {
      var ready = !!chosenText();
      submit.setAttribute("aria-disabled", ready ? "false" : "true");
      if (slotField) slotField.value = chosenText();
      if (hint) hint.hidden = ready;
    }
    function press(container, sel, el) {
      container.querySelectorAll(sel).forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
      el.setAttribute("aria-pressed", "true");
    }

    days.forEach(function (day) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "day"; b.setAttribute("aria-pressed", "false");
      b.innerHTML = '<span class="dw">' + DW[day.getDay()] + '</span><span class="dn">' + day.getDate() + "</span>";
      b.setAttribute("aria-label", DL[day.getDay()] + " " + ML[day.getMonth()] + " " + day.getDate());
      b.addEventListener("click", function () { picked.day = day; press(daysEl, ".day", b); update(); });
      daysEl.appendChild(b);
    });
    SLOTS.forEach(function (slot) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "slot"; b.setAttribute("aria-pressed", "false");
      b.textContent = slot;
      b.addEventListener("click", function () { picked.slot = slot; press(slotsEl, ".slot", b); update(); });
      slotsEl.appendChild(b);
    });
    var otherField = root.querySelector("[name=othertime]");
    if (otherField) otherField.addEventListener("input", update);
    update();

    form.addEventListener("submit", function (e) {
      if (!chosenText()) {
        e.preventDefault();
        if (hint) { hint.hidden = false; hint.setAttribute("role", "alert"); }
        daysEl.scrollIntoView({ block: "center" });
        var firstDay = daysEl.querySelector(".day");
        if (firstDay) firstDay.focus();
        return;
      }
      if (!form.checkValidity()) return;
      e.preventDefault();

      var fd = new FormData(form);
      var v = function (k) { return (fd.get(k) || "").toString().trim(); };
      var slotText = chosenText();
      var lines = ["Requested time: " + slotText, "Name: " + v("name"), "Email: " + v("email")];
      if (v("business")) lines.push("Business: " + v("business"));
      if (v("context")) lines.push("", "Where the time goes:", v("context"));
      if (v("timezone")) lines.push("", "(Visitor timezone: " + v("timezone") + ")");
      var bodyText = lines.join("\n");
      var subject = "Job trace request: " + slotText;
      var href = "mailto:" + TO + "?subject=" + encodeURIComponent(subject) +
                 "&body=" + encodeURIComponent(bodyText + "\n");

      /* The form is NOT replaced. If the mail handler never opens, the
         visitor still has everything they typed, still editable, plus the
         message as copyable text and the address in plain sight. */
      var panel = root.querySelector("[data-sent]");
      if (!panel) {
        panel = document.createElement("div");
        panel.className = "sent"; panel.setAttribute("data-sent", "");
        panel.setAttribute("tabindex", "-1");
        form.parentNode.insertBefore(panel, form);
      }
      panel.innerHTML =
        '<h2>Your email is ready to send.</h2>' +
        '<p>Your mail app should have opened with the details filled in. It is not sent until you send it.</p>' +
        '<p class="mono-cap">' + slotText + '</p>' +
        '<p><a class="link" href="' + href + '">Open it again</a>, or write to ' +
          '<a class="link" href="mailto:' + TO + '">' + TO + '</a>.</p>' +
        '<p class="mono-cap" style="margin-top:var(--s4)">Nothing opened? Copy this and send it yourself.</p>' +
        '<textarea class="copybox" readonly rows="6" aria-label="Your message, ready to copy"></textarea>' +
        '<button type="button" class="copybtn" data-copy>Copy the message</button>';

      var box = panel.querySelector(".copybox");
      box.value = "To: " + TO + "\nSubject: " + subject + "\n\n" + bodyText;
      var btn = panel.querySelector("[data-copy]");
      btn.addEventListener("click", function () {
        box.select();
        var done = function () { btn.textContent = "Copied"; };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(box.value).then(done, function () {
            btn.textContent = "Press Cmd or Ctrl + C";
          });
        } else {
          btn.textContent = "Press Cmd or Ctrl + C";
        }
      });

      panel.focus();
      window.location.href = href;
    });
  })();

  if (!animate) return;   /* everything below is choreography only */

  gsap.registerPlugin(ScrollTrigger);
  var hasSplit = typeof window.SplitText !== "undefined";
  if (hasSplit) gsap.registerPlugin(SplitText);

  /* ---------------------------------------------------------
     Hero entrance. Every duration in the sequence differs, so
     nothing reads keyframed together. Movement only: no text ever
     animates in from opacity zero.
     --------------------------------------------------------- */
  var heroTitle = document.querySelector("[data-hero-title]");
  if (heroTitle && document.visibilityState === "visible") {
    var eyebrow = document.querySelector("[data-hero-eyebrow]");
    var sub = document.querySelector("[data-hero-sub]");
    var heroCta = document.querySelector(".hero .cta");
    var xrayEl = document.querySelector("[data-xray]");
    var lns = heroTitle.querySelectorAll(".ln");

    /* mask each line by wrapping it, so the wipe has an edge to hide behind */
    lns.forEach(function (ln) {
      var mask = document.createElement("span");
      mask.style.cssText = "display:block;overflow:hidden;padding-bottom:.10em;margin-bottom:-.10em";
      ln.parentNode.insertBefore(mask, ln);
      mask.appendChild(ln);
    });

    gsap.set(lns, { yPercent: 125 });
    if (eyebrow) gsap.set(eyebrow, { y: 12 });
    if (sub) gsap.set(sub, { y: 14 });
    if (heroCta) gsap.set(heroCta, { scale: 0.94 });
    if (xrayEl) gsap.set(xrayEl, { y: 18 });
    gsap.set(head, { yPercent: -120 });

    var start = function () {
      justifyAll();
      var onHome = !!document.querySelector("#curtain");
      var tl = gsap.timeline({ delay: onHome && window.innerWidth > 900 ? 0.75 : 0 });
      if (eyebrow) tl.to(eyebrow, { y: 0, duration: 0.7, ease: "expo.out" }, 0.10);
      tl.to(lns, { yPercent: 0, duration: 1.15, ease: "expo.out", stagger: 0.08 }, 0.18);
      if (sub) tl.to(sub, { y: 0, duration: 0.6, ease: "expo.out" }, 0.62);
      if (xrayEl) tl.to(xrayEl, { y: 0, duration: 0.9, ease: "expo.out" }, 0.50);
      if (heroCta) tl.to(heroCta, { scale: 1, duration: 0.9, ease: "expo.out" }, 0.66);
      tl.to(head, { yPercent: 0, duration: 0.8, ease: "expo.out" }, 0.70);
    };
    if (document.fonts && document.fonts.ready) {
      var fired = false;
      var go = function () { if (!fired) { fired = true; start(); } };
      document.fonts.ready.then(go);
      setTimeout(go, 450);
    } else { start(); }
  }

  /* ---------------------------------------------------------
     THE RAIL. One scrubbed trigger over <main>; every junction
     derives its progress from it rather than adding triggers.
     --------------------------------------------------------- */
  var rail = document.getElementById("rail");
  var main = document.getElementById("main");
  if (rail && main) {
    gsap.set(rail, { scaleY: 0.015 });
    ScrollTrigger.create({
      trigger: main,
      start: "top top",
      end: "bottom bottom",
      scrub: window.matchMedia("(max-width:900px)").matches ? 1 : 0.4,
      invalidateOnRefresh: true,
      fastScrollEnd: true,
      onUpdate: function (self) { gsap.set(rail, { scaleY: 0.015 + self.progress * 0.985 }); }
    });
  }

  /* junction branches + index reveal.
     The branch rule is a ::before, which GSAP cannot target, so the draw
     is a CSS transition switched by a class; the index is tweened. */
  gsap.utils.toArray(".junction").forEach(function (j) {
    ScrollTrigger.create({
      trigger: j, start: "top 85%", once: true,
      onEnter: function () {
        j.classList.add("drawn");
        var idx = j.querySelector(".idx");
        if (idx) gsap.fromTo(idx, { x: -3, opacity: 0.4 },
          { x: 0, opacity: 1, duration: 0.4, ease: "expo.out", delay: 0.35 });
      }
    });
  });

  /* ---------------------------------------------------------
     Quiet reveals. Movement only, never opacity. Secondary text sits
     near the contrast floor by design, so any fade-in frame would fail
     AA and would be genuinely hard to read for anyone landing mid-page.
     --------------------------------------------------------- */
  gsap.utils.toArray(".index li, .steps li, .refuse li, .ev, .assure li, .engage li, .op-claim, .op-support, .index-close, .ev-rail")
    .forEach(function (el) {
      gsap.fromTo(el, { y: 18 }, {
        y: 0, duration: 0.9, ease: "expo.out",
        scrollTrigger: { trigger: el, start: "top 88%", once: true }
      });
    });

  /* The evidence media settles into its frame.
     This used to be a clip-path wipe from inset(0 0 100%), which meant a
     trigger that never fired left every capture permanently invisible with
     no CSS fallback. Nothing here can hide content: the picture is on
     screen from first paint and only moves. */
  gsap.utils.toArray(".shot").forEach(function (shot) {
    var img = shot.querySelector("img");
    if (!img) return;
    gsap.fromTo(img, { scale: 1.1, yPercent: -3 }, {
      scale: 1, yPercent: 0, duration: 1.3, ease: "power3.out",
      scrollTrigger: { trigger: shot, start: "top 88%", once: true }
    });
  });

  /* the closing headline, then the terminal rule: the page lands */
  var closeTitle = document.querySelector("[data-close-title]");
  var terminal = document.getElementById("terminal");
  if (closeTitle) {
    var clns = closeTitle.querySelectorAll(".ln");
    clns.forEach(function (ln) {
      var mask = document.createElement("span");
      mask.style.cssText = "display:block;overflow:hidden;padding-bottom:.10em;margin-bottom:-.10em";
      ln.parentNode.insertBefore(mask, ln);
      mask.appendChild(ln);
    });
    var ctl = gsap.timeline({ scrollTrigger: { trigger: closeTitle, start: "top 75%", once: true } });
    ctl.fromTo(clns, { yPercent: 125 }, { yPercent: 0, duration: 1.0, ease: "expo.out", stagger: 0.07 }, 0);
    if (terminal) {
      gsap.set(terminal, { scaleX: 0 });
      ctl.to(terminal, { scaleX: 1, duration: 1.4, ease: "power4.inOut" }, 0.6);
    }
  }

  /* ---------------------------------------------------------
     Magnetic CTA. Applied to the inner span so the hit area and
     keyboard target never move.
     --------------------------------------------------------- */
  if (fine) {
    document.querySelectorAll("[data-magnet]").forEach(function (el) {
      var inner = el.querySelector("span");
      if (!inner) return;
      var xTo = gsap.quickTo(inner, "x", { duration: 0.5, ease: "power3.out" });
      var yTo = gsap.quickTo(inner, "y", { duration: 0.5, ease: "power3.out" });
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * 0.22);
        yTo((e.clientY - (r.top + r.height / 2)) * 0.22);
      });
      el.addEventListener("pointerleave", function () {
        gsap.to(inner, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1,0.45)" });
      });
    });
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  }
})();
