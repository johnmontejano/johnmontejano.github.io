/* John Montejano v7 — motion ported from monopo.vn.
   Their stack: Locomotive Scroll (smooth + data-scroll-speed parallax), GSAP, WebGL orb.
   Ours: Lenis (same job as Locomotive's smooth layer) + GSAP ScrollTrigger + CSS orb.
   One curve, patient durations: .4 / .8 / 1.25s, cubic-bezier(.19,1,.22,1) ~= expo.out */
(function () {
  "use strict";
  var RM = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGSAP = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";

  /* ---------- 1. split marked headings into masked lines ---------- */
  // Lines come from the authored <br>, so the break points stay art-directed.
  function splitLines(el) {
    if (el.dataset.split) return;
    var parts = el.innerHTML.split(/<br\s*\/?>/i);
    el.innerHTML = parts.map(function (p) {
      return '<span class="ln"><i>' + p.trim() + "</i></span>";
    }).join("");
    el.dataset.split = "1";
  }
  var heads = [].slice.call(document.querySelectorAll(".split"));
  heads.forEach(splitLines);

  /* ---------- reduced motion / no-GSAP: show everything, animate nothing ---------- */
  function revealAll() {
    document.querySelectorAll(".ln > i").forEach(function (i) { i.style.transform = "none"; });
    document.querySelectorAll(".fade").forEach(function (e) { e.style.opacity = 1; e.style.transform = "none"; });
  }
  if (RM || !hasGSAP) { revealAll(); }

  if (hasGSAP && !RM) {
    gsap.registerPlugin(ScrollTrigger);

    /* ---------- 2. smooth scroll, wired into ScrollTrigger ---------- */
    if (typeof window.Lenis !== "undefined") {
      var lenis = new Lenis({ duration: 1.15, smoothWheel: true });
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
      // in-page anchors must go through Lenis, not native scrolling
      document.querySelectorAll('a[href^="#"]').forEach(function (a) {
        a.addEventListener("click", function (e) {
          var id = a.getAttribute("href");
          if (id.length < 2) return;
          var t = document.querySelector(id);
          if (!t) return;
          e.preventDefault();
          lenis.scrollTo(t, { offset: -70, duration: 1.25 });
        });
      });
    }

    /* ---------- 3. masked line reveal, staggered — the signature move ---------- */
    var hero = document.querySelector(".hero .display");
    heads.forEach(function (h) {
      if (h === hero) return;                       // hero fires on load, not on scroll
      gsap.fromTo(h.querySelectorAll(".ln > i"), { yPercent: 105, y: 0 }, {
        yPercent: 0, y: 0, duration: 1.25, ease: "expo.out", stagger: 0.085,
        scrollTrigger: { trigger: h, start: "top 88%", once: true }
      });
    });
    // The hero reveal is an on-load animation, so it must not burn while the tab
    // is in the background (rAF is throttled there and it would finish unseen,
    // or worse, sit frozen on its from-state). Wait for the page to be visible.
    if (hero) {
      var heroLines = hero.querySelectorAll(".ln > i");
      var heroPlayed = false;
      var playHero = function () {
        if (heroPlayed) return;
        heroPlayed = true;
        gsap.fromTo(heroLines, { yPercent: 105, y: 0 }, {
          yPercent: 0, y: 0, duration: 1.25, ease: "expo.out", stagger: 0.09, delay: 0.15
        });
      };
      if (document.visibilityState === "visible") {
        playHero();
      } else {
        document.addEventListener("visibilitychange", function onVis() {
          if (document.visibilityState !== "visible") return;
          document.removeEventListener("visibilitychange", onVis);
          playHero();
        });
        // last resort: never leave the headline invisible
        setTimeout(function () {
          if (!heroPlayed) { heroPlayed = true; gsap.set(heroLines, { yPercent: 0, y: 0 }); }
        }, 6000);
      }
    }

    /* ---------- 4. everything else: patient fade-rise, batched ---------- */
    ScrollTrigger.batch(".fade", {
      start: "top 90%",
      onEnter: function (batch) {
        gsap.fromTo(batch, { opacity: 0, y: 22 },
          { opacity: 1, y: 0, duration: 0.8, ease: "expo.out", stagger: 0.09, overwrite: true });
      }
    });

    /* ---------- 5. parallax on media, like data-scroll-speed ---------- */
    gsap.utils.toArray(".job__media img").forEach(function (img) {
      gsap.fromTo(img, { yPercent: -7 }, {
        yPercent: 7, ease: "none",
        scrollTrigger: { trigger: img.closest(".job__media"), start: "top bottom", end: "bottom top", scrub: 0.6 }
      });
    });

    /* ---------- 6. the orb drifts against the scroll ---------- */
    var orb = document.querySelector(".orb");
    if (orb) {
      gsap.to(orb, {
        yPercent: 22, ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 0.8 }
      });
    }

    window.addEventListener("load", function () { ScrollTrigger.refresh(); });
  }

  /* ---------- booking slots ---------- */
  var slotsEl = document.getElementById("slots"), picked = null;
  if (slotsEl) {
    var TIMES = ["9:00am", "11:30am", "2:00pm"], DAYS = [], d = new Date(), n = 0;
    d.setDate(d.getDate() + 1);
    while (n < 3) {
      if (d.getDay() !== 0 && d.getDay() !== 6) {
        DAYS.push(d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })); n++;
      }
      d.setDate(d.getDate() + 1);
    }
    DAYS.forEach(function (day) {
      TIMES.forEach(function (t) {
        var b = document.createElement("button");
        b.type = "button"; b.className = "slot"; b.setAttribute("aria-pressed", "false");
        b.innerHTML = '<span style="display:block;font-size:10px;letter-spacing:.09em;text-transform:uppercase;opacity:.6">' + day + "</span>" + t;
        b.addEventListener("click", function () {
          [].forEach.call(slotsEl.children, function (o) { o.setAttribute("aria-pressed", "false"); });
          b.setAttribute("aria-pressed", "true");
          picked = day + " at " + t + " Pacific";
        });
        slotsEl.appendChild(b);
      });
    });
  }

  /* ---------- mailto handoff. Nothing is submitted to this page. ---------- */
  var form = document.getElementById("bookForm"), note = document.getElementById("bookNote");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = document.getElementById("bName").value.trim();
      var biz = document.getElementById("bBiz").value.trim();
      if (!name || !biz) return;
      if (!picked) {
        note.textContent = "Pick a time above first, then open the email.";
        note.style.color = "#fff";
        return;
      }
      var body = "Hi John,\n\nI'd like the free 30-minute workflow assessment.\n\n" +
        "Name: " + name + "\nBusiness: " + biz + "\nPreferred time: " + picked + "\n\nThanks,\n" + name;
      window.location.href = "mailto:johnmontejano2@gmail.com?subject=" +
        encodeURIComponent("Workflow assessment — " + name) + "&body=" + encodeURIComponent(body);
      note.textContent = "Your email client is open. It isn't booked until you press Send.";
      note.style.color = "#fff";
    });
  }
})();
