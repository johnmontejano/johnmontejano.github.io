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
      return '<span class="line"><span class="content">' +
             '<span class="txt">' + p.trim() + '</span>' +
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
    var targets = [].slice.call(document.querySelectorAll(".reveal,.head,.job,.word,.tiles"));
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
        var lenis = new Lenis({ lerp: 0.1, smoothWheel: true, touchMultiplier: 3.5 });
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
      /* ---------- 4. the mask wipe, scroll-linked per line ----------
         Measured on the reference: maskPercent = clamp((610 - lineTop)/2.45, 0, 100)
         — it begins when a line reaches 67.8vh and completes at 40.6vh, a 27vh
         window with ~2.25 lines mid-wipe at any instant. Their smoothing tween is
         duration .25 / ease none, which is scrub: 0.25 exactly.
         This replaces a one-shot 1.25s tween that resolved every heading in the
         first 200px of its section and then went inert. */
      var hero = document.querySelector(".hero .display");
      function scrubWipe(h) {
        h.querySelectorAll(".mask").forEach(function (m) {
          var line = m.closest(".line") || m.parentElement;
          gsap.fromTo(m, { scaleX: 1 }, {
            scaleX: 0, ease: "none",
            scrollTrigger: { trigger: line, start: "top 67.8%", end: "top 40.6%", scrub: 0.25 }
          });
        });
      }
      heads.forEach(function (h) { if (h !== hero) scrubWipe(h); });

      // the hero has no scroll runway above it, so it plays on load
      if (hero) {
        var heroMasks = hero.querySelectorAll(".mask");
        var heroPlayed = false;
        var playHero = function () {
          if (heroPlayed) return; heroPlayed = true;
          gsap.to(heroMasks, { scaleX: 0, duration: 1.25, ease: "expo.out", stagger: 0.085, delay: 0.2 });
        };
        if (document.visibilityState === "visible") { playHero(); }
        else {
          document.addEventListener("visibilitychange", function onVis() {
            if (document.visibilityState !== "visible") return;
            document.removeEventListener("visibilitychange", onVis);
            playHero();
          });
          setTimeout(function () { if (!heroPlayed) { heroPlayed = true; gsap.set(heroMasks, { scaleX: 0 }); } }, 6000);
        }
      }

      /* ---------- 4a. the hero swaps its two-part line ----------
         The reference cycles its hero sentence on a 4500ms interval: the parts
         leave upward at y:-150% over .9s expo.inOut with the second lagging .1s,
         and the replacement arrives at y:0 over .9s expo.out. This is the one
         time-based animation on their page and it is confined to the hero. */
      (function () {
        var h1 = document.querySelector(".hero .display");
        if (!h1) return;
        var txts = h1.querySelectorAll(".txt");
        if (txts.length < 2) return;
        var LINES = [
          ["You run the jobs.", "The office runs itself."],
          ["You are under a sink.", "The quote goes out anyway."],
          ["You are on a roof.", "The invoice is already sent."],
          ["You are driving home.", "Tomorrow is already booked."]
        ];
        var i = 0, timer = null, tl = null, inView = true;

        // The headline is the most important text on the page: it must never be
        // left parked off-screen by an interrupted timeline.
        function settle() {
          if (tl) { tl.kill(); tl = null; }
          gsap.set(txts, { yPercent: 0, clearProps: "transform" });
        }
        function cycle() {
          if (!inView || document.hidden) return;
          var next = LINES[(i + 1) % LINES.length];
          if (tl) tl.kill();
          tl = gsap.timeline({ onInterrupt: settle });
          tl.to(txts[0], { yPercent: -150, duration: 0.9, ease: "expo.inOut", overwrite: true }, 0)
            .to(txts[1], { yPercent: -150, duration: 0.9, ease: "expo.inOut", overwrite: true }, 0.1)
            .add(function () {
              txts[0].textContent = next[0];
              txts[1].textContent = next[1];
              gsap.set(txts, { yPercent: 120 });
            })
            .to(txts[0], { yPercent: 0, duration: 0.9, ease: "expo.out", overwrite: true }, 0.55)
            .to(txts[1], { yPercent: 0, duration: 0.9, ease: "expo.out", overwrite: true }, 0.65);
          i = (i + 1) % LINES.length;
        }
        function start() { if (!timer && inView && !document.hidden) timer = setInterval(cycle, 4500); }
        function stop() { clearInterval(timer); timer = null; settle(); }

        if ("IntersectionObserver" in window) {
          new IntersectionObserver(function (es) {
            inView = es[0].isIntersecting;
            inView ? start() : stop();
          }, { threshold: 0.25 }).observe(h1);
        }
        setTimeout(function () { if (document.visibilityState === "visible") start(); }, 3200);
        document.addEventListener("visibilitychange", function () {
          document.hidden ? stop() : start();
        });
        window.addEventListener("pagehide", stop);
      })();

      /* ---------- 4b. the marquee is scroll-driven, not time-driven ----------
         The reference has NO time-based animation anywhere on the page. Its
         horizontal strip measured -1.216px of X per px of Y. Ours was the only
         thing on the page that moved while you were standing still. */
      (function () {
        var strip = document.querySelector(".mq__t");
        var rail = document.querySelector(".mq");
        if (!strip || !rail) return;
        strip.style.animation = "none";
        var travel = function () {
          return Math.min(strip.scrollWidth / 2, 1.216 * (window.innerHeight + rail.offsetHeight));
        };
        gsap.fromTo(strip, { x: 0 }, {
          x: function () { return -travel(); }, ease: "none",
          scrollTrigger: { trigger: rail, start: "top bottom", end: "bottom top",
                           scrub: 0.4, invalidateOnRefresh: true }
        });
      })();

      /* ---------- 5. parallax, at their speeds (.5 / 1 / -.5 / -1) ---------- */
      // locomotive maps data-scroll-speed as parseFloat(attr) / 10, so "1" is a
      // 0.1 factor and "12.5" is 1.25. Same mapping here.
      gsap.utils.toArray("[data-speed]").forEach(function (el) {
        var f = (parseFloat(el.getAttribute("data-speed")) || 0) / 10;
        if (!f) return;
        gsap.fromTo(el, { yPercent: -50 * f }, {
          yPercent: 50 * f, ease: "none",
          scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 0.6 }
        });
      });

      /* ---------- 5b. shear the #who layers apart ----------
         The reference's team section runs the portrait 288px UP (speed .5) against
         the name 200px DOWN (speed -2) — opposite signs, ~250px of relative
         displacement. Ours had +-28px on three images and nothing else. */
      (function () {
        var who = document.getElementById("who");
        if (!who) return;
        var pic = who.querySelector(".img-wrapper");
        var copy = who.querySelector(".h3");
        if (!pic || !copy) return;
        var st = { trigger: who, start: "top bottom", end: "bottom top", scrub: 0.5 };
        gsap.fromTo(pic,  { y: 90 },  { y: -90, ease: "none", scrollTrigger: st });
        gsap.fromTo(copy, { y: -55 }, { y: 62,  ease: "none", scrollTrigger: Object.assign({}, st) });
      })();

      /* ---------- 5c. header hides going down, returns going up ----------
         Verified live on the reference: opacity 0<->1 only, .7s expo, no translate,
         flipping on the first frame of reversal. */
      (function () {
        var nav = document.getElementById("nav");
        if (!nav) return;
        var last = window.scrollY, dir = 0;
        function onScroll() {
          var y = window.scrollY;
          var d = y > last ? 1 : (y < last ? -1 : dir);
          if (d !== dir) {
            dir = d;
            nav.classList.toggle("is-away", d === 1 && y > 140);
          }
          if (y <= 140) nav.classList.remove("is-away");
          last = y;
        }
        window.addEventListener("scroll", onScroll, { passive: true });
      })();

      /* ---------- 5d. rotated tile gallery: rows shear against each other ----------
         The reference runs its tile rows at data-scroll-speed +-1 with the inner
         containers at -+.5, so the rows travel in opposite directions as the page
         scrolls. Each row here holds its images twice, so a half-width translation
         reads as continuous. */
      gsap.utils.toArray(".tiles__line").forEach(function (line) {
        var s = parseFloat(line.getAttribute("data-tspeed")) || 0;
        if (!s) return;
        var span = function () { return line.scrollWidth / 2; };
        gsap.fromTo(line,
          { x: function () { return s > 0 ? -span() : 0; } },
          { x: function () { return s > 0 ? 0 : -span(); },
            ease: "none",
            scrollTrigger: { trigger: ".tiles", start: "top bottom", end: "bottom top",
                             scrub: 0.5, invalidateOnRefresh: true } });
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

  /* ---------- theme inversion: the whole page cross-fades over 1.25s ----------
     The reference fires locomotive's SET_BACKGROUND and toggles .white-bg on the
     app root. Here the work section drives [data-theme] on <html>; the 1.25s
     transitions live in CSS so ground, type, rules and cursor migrate as one. */
  (function () {
    // The light island covers the evidence and the human: the work section through
    // the portrait. The portrait is a real photograph on a near-white ground, so
    // stranding it on black would read as a bright rectangle punched in the page.
    var zones = ["work", "who"].map(function (id) { return document.getElementById(id); })
                               .filter(Boolean);
    if (!zones.length) return;
    function apply(light) {
      document.documentElement.setAttribute("data-theme", light ? "light" : "dark");
    }
    apply(false);
    if (!("IntersectionObserver" in window)) return;
    var lit = new Set();
    var io2 = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) lit.add(e.target); else lit.delete(e.target);
      });
      apply(lit.size > 0);
    }, { threshold: 0, rootMargin: "-45% 0px -45% 0px" });
    zones.forEach(function (z) { io2.observe(z); });
  })();

  /* ---------- custom cursor ----------
     10vw disc scaled to .075 at rest, position lerped 0.15/frame, swelling to
     .75 over media with the arrow, vanishing over links (as the reference does).
     Desktop non-touch only; never runs under reduced motion. */
  (function () {
    if (RM) return;
    var dot = document.querySelector(".dot-cursor");
    if (!dot || !window.matchMedia("(min-width:1024px)").matches) return;
    if (!document.documentElement.classList.contains("notouch")) return;

    var mx = window.innerWidth / 2, my = window.innerHeight / 2;
    var cx = mx, cy = my, scale = 0.075, target = 0.075;
    var label = dot.querySelector("span");
    var on = false;

    window.addEventListener("mousemove", function (e) {
      mx = e.clientX; my = e.clientY;
      if (!on) { on = true; cx = mx; cy = my; dot.classList.add("is-on"); }
    }, { passive: true });
    document.addEventListener("mouseleave", function () { dot.classList.remove("is-on"); });
    document.addEventListener("mouseenter", function () { if (on) dot.classList.add("is-on"); });

    function setState(next, mode, text) {
      target = next;
      dot.classList.toggle("on-media", mode === "media");
      dot.classList.toggle("on-label", mode === "label");
      if (text != null) label.textContent = text;
      dot.style.opacity = next === 0 ? "0" : "";
    }
    document.querySelectorAll(".img-wrapper").forEach(function (el) {
      el.addEventListener("mouseenter", function () { setState(0.75, "media"); });
      el.addEventListener("mouseleave", function () { setState(0.075, null); });
    });
    document.querySelectorAll("a, button, summary, input").forEach(function (el) {
      if (el.closest(".img-wrapper")) return;
      el.addEventListener("mouseenter", function () { setState(0, null); });
      el.addEventListener("mouseleave", function () { setState(0.075, null); });
    });

    (function tick() {
      cx += (mx - cx) * 0.15;
      cy += (my - cy) * 0.15;
      scale += (target - scale) * 0.15;
      dot.style.transform = "translate3d(" + (cx - dot.offsetWidth / 2) + "px," +
        (cy - dot.offsetHeight / 2) + "px,0) scale3d(" + scale + "," + scale + ",1)";
      requestAnimationFrame(tick);
    })();
  })();


  /* ===== visual devices bootstrap (docs/VISUAL_DEVICES.md) =====
     No Lenis here: main.js already owns it above and Lenis scrolls the real
     window, so no scrollerProxy is needed. */
  var RMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
  var hasGSAP2 = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
  var LIVE = hasGSAP2 && !RMQ.matches;
  if (hasGSAP2) {
    window.addEventListener("load", function () { ScrollTrigger.refresh(); });
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
    }
  }

(function () {
  var els = [].slice.call(document.querySelectorAll("[data-count]"));
  if (!els.length) return;

  function render(el, v) {
    var dp = parseInt(el.getAttribute("data-decimals") || "0", 10);
    el.textContent = (el.getAttribute("data-prefix") || "") +
      v.toFixed(dp).replace(/\B(?=(\d{3})+(?!\d))/g, ",") +
      (el.getAttribute("data-suffix") || "");
  }

  els.forEach(function (el) {
    var to = parseFloat(el.getAttribute("data-count"));
    if (isNaN(to)) return;

    /* Reserve the final width NOW, before resetting to zero. tabular-nums keeps
       every digit the same width; this keeps the digit COUNT from changing the
       box, so "9 -> 220" cannot shove the label sideways mid-count. */
    render(el, to);
    el.style.minWidth = el.getBoundingClientRect().width + "px";

    if (!LIVE) return;                 // final value is already painted

    var from = parseFloat(el.getAttribute("data-from") || "0");
    var box = { v: from };
    render(el, from);

    ScrollTrigger.create({
      trigger: el,
      start: "top 88%",
      once: true,
      onEnter: function () {
        gsap.to(box, {
          v: to,
          duration: 1.25,
          ease: "expo.out",                       // = cubic-bezier(.19,1,.22,1)
          snap: { v: parseFloat(el.getAttribute("data-step") || "1") },
          onUpdate: function () { render(el, box.v); }
        });
      }
    });
  });
})();

(function () {
  var root = document.querySelector("[data-vs]");
  if (!root) return;
  var oldRows = [].slice.call(root.querySelectorAll(".vs__state--old .vs__row"));
  var newRows = [].slice.call(root.querySelectorAll(".vs__state--new .vs__row"));
  var strikes = [].slice.call(root.querySelectorAll(".vs__strike"));
  if (!oldRows.length) return;

  if (!LIVE) { root.classList.add("vs--static"); return; }

  var tl = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      trigger: root,
      start: "top 74%",
      end: "bottom 82%",
      scrub: 0.5
    }
  });
  tl.to(strikes, { scaleX: 1, duration: 0.55, stagger: 0.16 }, 0);
  tl.to(oldRows, { opacity: 0.34, duration: 0.55, stagger: 0.16 }, 0.1);
  tl.fromTo(newRows,
    { opacity: 0, y: 16 },
    { opacity: 1, y: 0, duration: 0.55, stagger: 0.16, ease: "expo.out" },
    0.42);
})();

(function () {
  var root = document.querySelector("[data-run]");
  if (!root) return;
  var beats = [].slice.call(root.querySelectorAll(".run__beat"));
  if (!beats.length) return;

  if (!LIVE) { root.classList.add("run--static"); return; }

  /* One unit of timeline per beat. The segment under beat i travels down to
     beat i+1 over exactly 1 unit, so beat i lights the instant the line
     reaches it — no measuring, and it stays correct through any resize. */
  var tl = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      trigger: root,
      start: "top 72%",
      end: "bottom 76%",
      scrub: 0.45
    }
  });
  beats.forEach(function (b, i) {
    tl.to(b, { opacity: 1, duration: 0.34 }, i);
    var seg = b.querySelector(".run__seg");
    if (seg && i < beats.length - 1) tl.to(seg, { scaleY: 1, duration: 1 }, i);
  });
  /* Pad to exactly N units so scroll progress maps 1:1 onto beat index:
     progress p puts the line at beat p * beats.length. Without this the
     timeline ends at 6.34 and the last two beats arrive early. */
  tl.set({}, {}, beats.length);
})();

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
