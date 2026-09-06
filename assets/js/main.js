/* John Montejano v7 — motion ported from monopo.vn's own implementation.
   They drive reveals by toggling `is-inview` (Locomotive Scroll) against CSS
   transitions, NOT by tweening from JS. We do the same, so the curve, the
   split easing (opacity linear / transform bezier) and the 30% offset all come
   from the stylesheet exactly as they do on the source.
   GSAP is used only where they use it: the line masks and scroll parallax. */
(function () {
  "use strict";
  var RM = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGSAP = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";

  /* ---------- 1. split marked headings into their line/content/mask markup ----------
     <span class="line"><span class="content">TEXT<span class="mask"></span></span></span>
     Lines break on the authored <br>, so the break points stay art-directed. */
  function splitLines(el) {
    if (el.dataset.split) return;
    var parts = el.innerHTML.split(/<br\s*\/?>/i);
    el.innerHTML = parts.map(function (p) {
      return '<span class="line"><span class="content">' + p.trim() +
             '<span class="mask" aria-hidden="true"></span></span></span>';
    }).join("");
    el.dataset.split = "1";
  }
  var heads = [].slice.call(document.querySelectorAll(".split"));
  heads.forEach(splitLines);
  var allMasks = [].slice.call(document.querySelectorAll(".mask"));

  /* ---------- reduced motion: everything resolved, nothing moves ---------- */
  if (RM) {
    document.querySelectorAll(".reveal,.reveal-group,.head,.word").forEach(function (e) {
      e.classList.add("is-inview");
    });
    allMasks.forEach(function (m) { m.style.transform = "scaleX(0)"; });
  }

  if (!RM) {
    /* ---------- 2. is-inview, the Locomotive way ---------- */
    var targets = [].slice.call(document.querySelectorAll(".reveal,.head,.job,.word"));
    // Anything already on screen is revealed synchronously. IntersectionObserver
    // does not deliver callbacks while document.hidden is true (background tab,
    // prerender, headless capture), so waiting on it can strand the whole page.
    function onScreen(el) {
      var r = el.getBoundingClientRect();
      return r.top < window.innerHeight * 0.92 && r.bottom > 0;
    }
    var deferred = [];
    targets.forEach(function (el) {
      if (onScreen(el)) el.classList.add("is-inview");
      else deferred.push(el);
    });
    if ("IntersectionObserver" in window && deferred.length) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          e.target.classList.add("is-inview");
          io.unobserve(e.target);
        });
      }, { rootMargin: "0px 0px -12% 0px", threshold: 0.08 });
      deferred.forEach(function (el) { io.observe(el); });
      setTimeout(function () {                       // never strand content
        deferred.forEach(function (el) { el.classList.add("is-inview"); });
      }, 4000);
    } else {
      deferred.forEach(function (el) { el.classList.add("is-inview"); });
    }

    if (hasGSAP) {
      gsap.registerPlugin(ScrollTrigger);

      /* ---------- 3. smooth scroll (their Locomotive layer) ---------- */
      if (typeof window.Lenis !== "undefined") {
        var lenis = new Lenis({ duration: 1.15, smoothWheel: true });
        lenis.on("scroll", ScrollTrigger.update);
        gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
        gsap.ticker.lagSmoothing(0);
        document.querySelectorAll('a[href^="#"]').forEach(function (a) {
          a.addEventListener("click", function (e) {
            var id = a.getAttribute("href");
            if (id.length < 2) return;
            var el = document.querySelector(id);
            if (!el) return;
            e.preventDefault();
            lenis.scrollTo(el, { offset: -70, duration: 1.25 });
          });
        });
      }

      /* ---------- 4. the mask collapses to the right, line by line ----------
         transform-origin:100% 50% is set in CSS; scaleX 1 -> 0 wipes the plate
         off toward the right edge, revealing the line left-to-right. */
      function wipe(el, delay) {
        var masks = el.querySelectorAll(".mask");
        if (!masks.length) return;
        gsap.to(masks, {
          scaleX: 0, duration: 1.25, ease: "expo.out", stagger: 0.085, delay: delay || 0,
          overwrite: true
        });
      }
      var hero = document.querySelector(".hero .display");
      heads.forEach(function (h) {
        if (h === hero) return;
        var r = h.getBoundingClientRect();
        if (r.top < window.innerHeight * 0.9 && r.bottom > 0) { wipe(h); return; }
        ScrollTrigger.create({
          trigger: h, start: "top 85%", once: true,
          onEnter: function () { wipe(h); }
        });
      });
      if (hero) {
        var heroPlayed = false;
        var playHero = function () { if (heroPlayed) return; heroPlayed = true; wipe(hero, 0.2); };
        if (document.visibilityState === "visible") { playHero(); }
        else {
          document.addEventListener("visibilitychange", function onVis() {
            if (document.visibilityState !== "visible") return;
            document.removeEventListener("visibilitychange", onVis);
            playHero();
          });
          setTimeout(function () {
            if (!heroPlayed) { heroPlayed = true; gsap.set(hero.querySelectorAll(".mask"), { scaleX: 0 }); }
          }, 6000);
        }
      }

      /* ---------- 5. parallax, at their speeds (.5 / 1 / -.5 / -1) ---------- */
      gsap.utils.toArray("[data-speed]").forEach(function (el) {
        var s = parseFloat(el.getAttribute("data-speed")) || 0;
        gsap.fromTo(el, { yPercent: -4 * s }, {
          yPercent: 4 * s, ease: "none",
          scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 0.6 }
        });
      });

      var orb = document.querySelector(".orb");
      if (orb) {
        gsap.to(orb, { yPercent: 20, ease: "none",
          scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 0.8 } });
      }
      window.addEventListener("load", function () { ScrollTrigger.refresh(); });
    } else {
      allMasks.forEach(function (m) { m.style.transform = "scaleX(0)"; });
    }
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
      TIMES.forEach(function (tm) {
        var b = document.createElement("button");
        b.type = "button"; b.className = "slot"; b.setAttribute("aria-pressed", "false");
        b.innerHTML = '<span style="display:block;font-size:10px;letter-spacing:.09em;text-transform:uppercase;opacity:.6">' + day + "</span>" + tm;
        b.addEventListener("click", function () {
          [].forEach.call(slotsEl.children, function (o) { o.setAttribute("aria-pressed", "false"); });
          b.setAttribute("aria-pressed", "true");
          picked = day + " at " + tm + " Pacific";
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
      if (!picked) { note.textContent = "Pick a time above first, then open the email."; note.style.color = "#fff"; return; }
      var body = "Hi John,\n\nI'd like the free 30-minute workflow assessment.\n\n" +
        "Name: " + name + "\nBusiness: " + biz + "\nPreferred time: " + picked + "\n\nThanks,\n" + name;
      window.location.href = "mailto:johnmontejano2@gmail.com?subject=" +
        encodeURIComponent("Workflow assessment — " + name) + "&body=" + encodeURIComponent(body);
      note.textContent = "Your email client is open. It isn't booked until you press Send.";
      note.style.color = "#fff";
    });
  }
})();
