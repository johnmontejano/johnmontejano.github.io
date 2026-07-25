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
  function justify(scope) {
    var lines = (scope || document).querySelectorAll(".ln");
    if (!lines.length) return;
    lines.forEach(function (ln) {
      var parent = ln.parentElement;
      var target = parent.getBoundingClientRect().width;
      if (!target) return;
      var lo = 62, hi = 125, best = parseFloat(ln.style.getPropertyValue("--wd")) || 100;
      /* binary search the width axis until the line fills its column */
      for (var i = 0; i < 12; i++) {
        var mid = (lo + hi) / 2;
        ln.style.setProperty("--wd", mid.toFixed(2));
        var w = ln.scrollWidth;
        if (Math.abs(w - target) < 0.5) { best = mid; break; }
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
    function update() {
      var ready = !!(picked.day && picked.slot);
      submit.disabled = !ready;
      if (slotField) slotField.value = ready ? label(picked.day, picked.slot) : "";
      submit.textContent = ready ? "Send request" : (picked.day ? "Pick a time" : "Pick a day and time");
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
    update();

    form.addEventListener("submit", function (e) {
      if (!picked.day || !picked.slot) { e.preventDefault(); daysEl.scrollIntoView({ block: "center" }); return; }
      if (!form.checkValidity()) return;
      e.preventDefault();
      var fd = new FormData(form);
      var v = function (k) { return (fd.get(k) || "").toString().trim(); };
      var slotText = label(picked.day, picked.slot);
      var lines = ["Requested time: " + slotText, "Name: " + v("name"), "Email: " + v("email")];
      if (v("business")) lines.push("Business: " + v("business"));
      if (v("context")) lines.push("", "Where the time goes:", v("context"));
      if (v("timezone")) lines.push("", "(Visitor timezone: " + v("timezone") + ")");
      var href = "mailto:" + TO + "?subject=" + encodeURIComponent("Job trace request: " + slotText) +
                 "&body=" + encodeURIComponent(lines.join("\n") + "\n");
      window.location.href = href;

      var wrap = document.createElement("div");
      wrap.className = "sent"; wrap.setAttribute("role", "status"); wrap.setAttribute("tabindex", "-1");
      wrap.innerHTML = "<h2>Your email is ready.</h2>" +
        "<p>Your mail app should have opened with the details filled in. Send it and it comes straight to me.</p>" +
        '<p class="mono-cap">' + slotText + "</p>" +
        '<p>Nothing opened? <a class="link" href="' + href + '">Open it again</a>, or write to ' +
        '<a class="link" href="mailto:' + TO + '">' + TO + "</a>.</p>";
      form.parentNode.replaceChild(wrap, form);
      wrap.focus();
    });
  })();

  if (!animate) return;   /* everything below is choreography only */

  gsap.registerPlugin(ScrollTrigger);
  var hasSplit = typeof window.SplitText !== "undefined";
  if (hasSplit) gsap.registerPlugin(SplitText);

  /* ---------------------------------------------------------
     Load curtain: the monogram draws, then lifts.
     Hard-capped so it can never hold the page hostage.
     --------------------------------------------------------- */
  var curtain = document.getElementById("curtain");
  if (curtain) {
    var strokes = curtain.querySelectorAll(".cs");
    var cross = curtain.querySelector(".cx");
    strokes.forEach(function (p) {
      var len = p.getTotalLength ? p.getTotalLength() : 60;
      gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
    });
    gsap.set(cross, { scaleX: 0 });
    var lift = gsap.timeline();
    lift.to(strokes, { strokeDashoffset: 0, duration: 0.9, ease: "expo.out", stagger: 0.06 }, 0)
        .to(cross, { scaleX: 1, duration: 0.4, ease: "power4.inOut" }, 0.35)
        .to(curtain, { clipPath: "inset(0 0 100% 0)", duration: 0.7, ease: "power4.inOut" }, 0.75)
        .set(curtain, { display: "none" });
    setTimeout(function () { lift.progress(1); }, 2200);   /* ceiling */
  }

  /* ---------------------------------------------------------
     Hero entrance. Every duration in the sequence differs, so
     nothing reads keyframed together.
     --------------------------------------------------------- */
  var heroTitle = document.querySelector("[data-hero-title]");
  if (heroTitle && document.visibilityState === "visible") {
    var eyebrow = document.querySelector("[data-hero-eyebrow]");
    var sub = document.querySelector("[data-hero-sub]");
    var heroCta = document.querySelector(".hero .cta");
    var lns = heroTitle.querySelectorAll(".ln");

    /* mask each line by wrapping it, so the wipe has an edge to hide behind */
    lns.forEach(function (ln) {
      var mask = document.createElement("span");
      mask.style.cssText = "display:block;overflow:hidden;padding-bottom:.10em;margin-bottom:-.10em";
      ln.parentNode.insertBefore(mask, ln);
      mask.appendChild(ln);
    });

    gsap.set(lns, { yPercent: 125 });
    if (eyebrow) gsap.set(eyebrow, { opacity: 0, y: 12 });
    if (sub) gsap.set(sub, { opacity: 0, y: 14 });
    if (heroCta) gsap.set(heroCta, { opacity: 0, scale: 0.92 });
    gsap.set(head, { yPercent: -120 });

    var start = function () {
      justifyAll();
      var tl = gsap.timeline({ delay: curtain ? 0.55 : 0 });
      if (eyebrow) tl.to(eyebrow, { opacity: 1, y: 0, duration: 0.7, ease: "expo.out" }, 0.10);
      tl.to(lns, { yPercent: 0, duration: 1.15, ease: "expo.out", stagger: 0.08 }, 0.18);
      if (sub) tl.to(sub, { opacity: 1, y: 0, duration: 0.6, ease: "expo.out" }, 0.62);
      if (heroCta) tl.to(heroCta, { opacity: 1, scale: 1, duration: 0.9, ease: "expo.out" }, 0.66);
      tl.to(head, { yPercent: 0, duration: 0.8, ease: "expo.out" }, 0.70);
    };
    if (document.fonts && document.fonts.ready) {
      var fired = false;
      var go = function () { if (!fired) { fired = true; start(); } };
      document.fonts.ready.then(go);
      setTimeout(go, 1200);
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
     The job trace band: line draws, dot travels, break flashes.
     --------------------------------------------------------- */
  var band = document.getElementById("trace");
  if (band) {
    var litA = band.querySelector("[data-lit-a]");
    var litB = band.querySelector("[data-lit-b]");
    var dot = band.querySelector("[data-dot]");
    var brks = band.querySelectorAll("[data-brk]");
    var stops = band.querySelectorAll(".trace-stops li");

    gsap.set([litA, litB], { strokeDasharray: 1, strokeDashoffset: 1 });
    gsap.set(brks, { opacity: 0.25 });
    gsap.set(stops, { opacity: 0.35 });

    ScrollTrigger.create({
      trigger: band,
      start: "top 78%",
      end: "bottom 55%",
      scrub: 0.5,
      invalidateOnRefresh: true,
      onUpdate: function (self) {
        var p = self.progress;
        /* segment A runs 0 → 0.62, the gap sits 0.62 → 0.72, segment B 0.72 → 1 */
        var a = Math.min(p / 0.62, 1);
        var b = Math.max(0, Math.min((p - 0.72) / 0.28, 1));
        gsap.set(litA, { strokeDashoffset: 1 - a });
        gsap.set(litB, { strokeDashoffset: 1 - b });
        /* dot rides the line, pausing across the break */
        var x = p < 0.62 ? 60 + (1002 - 60) * (p / 0.62)
              : p < 0.72 ? 1002
              : 1070 + (1380 - 1070) * ((p - 0.72) / 0.28);
        gsap.set(dot, { attr: { cx: x } });
        gsap.set(brks, { opacity: p > 0.58 ? 1 : 0.25 });
        stops.forEach(function (li, i) {
          gsap.set(li, { opacity: p > (i * 0.19) ? 1 : 0.35 });
        });
      }
    });
  }

  /* ---------------------------------------------------------
     Quiet reveals. Fade only, from 0.14 rather than 0, so text
     is never actually missing for find-in-page or a screen reader.
     --------------------------------------------------------- */
  gsap.utils.toArray(".index li, .steps li, .refuse li, .ev, .refusals li, .op-line, .index-close, .maxim, .ev-rail")
    .forEach(function (el) {
      gsap.fromTo(el, { opacity: 0.14, y: 14 }, {
        opacity: 1, y: 0, duration: 0.9, ease: "expo.out",
        scrollTrigger: { trigger: el, start: "top 88%", once: true }
      });
    });

  /* the evidence media wipes open, the picture inside counter-scales */
  gsap.utils.toArray(".shot").forEach(function (shot) {
    var img = shot.querySelector("img");
    gsap.fromTo(shot, { clipPath: "inset(0 0 100% 0)" }, {
      clipPath: "inset(0 0 0% 0)", duration: 1.25, ease: "power4.inOut",
      scrollTrigger: { trigger: shot, start: "top 85%", once: true }
    });
    if (img) {
      gsap.fromTo(img, { scale: 1.18 }, {
        scale: 1, duration: 1.45, ease: "power3.out",
        scrollTrigger: { trigger: shot, start: "top 85%", once: true }
      });
    }
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
        xTo((e.clientX - (r.left + r.width / 2)) * 0.28);
        yTo((e.clientY - (r.top + r.height / 2)) * 0.28);
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
