/* John Montejano v7 — motion ported from monopo.vn's own implementation.
   They drive reveals by toggling `is-inview` (Locomotive Scroll) against CSS
   transitions, NOT by tweening from JS. We do the same, so the curve, the
   split easing (opacity linear / transform bezier) and the 30% offset all come
   from the stylesheet exactly as they do on the source.
   GSAP is used only where they use it: the line masks and scroll parallax. */
(function () {
  "use strict";
  try {
  // Progressive enhancement starts only when this file actually executes.
  // A pending dependency must never hide content from an inline head flag.
  document.documentElement.classList.add("js");
  var RM = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGSAP = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
  var motionContext, motionCleanups = [], lenis = null;

  // Reveal only on entry, including restored scroll positions and browsers where
  // IntersectionObserver is absent or delayed. Elapsed time is not an entry.
  var pendingEntries = [], entryFrame = null;
  function checkEntries() {
    entryFrame = null;
    pendingEntries = pendingEntries.filter(function (entry) {
      var rect = entry.el.getBoundingClientRect();
      if (rect.top >= window.innerHeight * entry.edge || rect.bottom <= 0) return true;
      if (entryObserver) entryObserver.unobserve(entry.el);
      try { entry.run(); }
      catch (error) {
        hasGSAP = false;
        resolveMotion();
        console.warn("Portfolio motion unavailable; content restored.", error);
      }
      return false;
    });
  }
  function queueEntries() {
    if (entryFrame === null) entryFrame = requestAnimationFrame(checkEntries);
  }
  var entryObserver = "IntersectionObserver" in window ? new IntersectionObserver(queueEntries) : null;
  function onEntry(el, run, edge) {
    pendingEntries.push({ el: el, run: run, edge: edge || 0.92 });
    if (entryObserver) entryObserver.observe(el);
    checkEntries();
  }
  window.addEventListener("scroll", queueEntries, { passive: true });
  window.addEventListener("resize", queueEntries);
  window.addEventListener("load", queueEntries);
  window.addEventListener("pageshow", queueEntries);
  document.addEventListener("visibilitychange", queueEntries);

  /* ---------- preloader ----------
     Timings taken from the reference. Skipped under reduced motion, without
     GSAP, and after the first view in a session. Removed on a hard timeout as
     well, so a stalled tween can never leave the page covered. */
  (function () {
    var seen = false;
    try { seen = sessionStorage.getItem("jm-loaded") === "1"; } catch (e) {}
    var RMnow = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (seen || RMnow || typeof window.gsap === "undefined") return;

    var el = document.createElement("div");
    el.id = "loader";
    el.setAttribute("aria-hidden", "true");
    el.innerHTML = '<div class="text-display"><span>Hello.</span><span>Let us get the office running.</span></div>';
    document.body.appendChild(el);
    document.documentElement.classList.add("is-loading");

    var spans = el.querySelectorAll("span");
    var done = false;
    function finish() {
      if (done) return;
      done = true;
      document.documentElement.classList.remove("is-loading");
      if (el.parentNode) el.parentNode.removeChild(el);
      try { sessionStorage.setItem("jm-loaded", "1"); } catch (e) {}
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    }
    // fromTo with BOTH y and yPercent pinned: GSAP resolves the CSS
    // translate3d(0,100%,0) into a pixel y, so tweening yPercent alone would
    // leave that offset in place and the greeting would never appear.
    setTimeout(finish, 8000);          // loader-only watchdog, never a reveal timer
    window.addEventListener("pagehide", finish);
    try {
    var loaderTimeline = gsap.timeline({ onComplete: finish, onInterrupt: finish })
      .fromTo(spans[0], { yPercent: 100, y: 0, opacity: 0 },
              { yPercent: 0, y: 0, opacity: 1, duration: 1.2, ease: "expo.out" }, 1.0)
      .fromTo(spans[1], { yPercent: 100, y: 0, opacity: 0 },
              { yPercent: 0, y: 0, opacity: 1, duration: 1.2, ease: "expo.out" }, 1.1)
      .to(spans[0], { yPercent: -100, y: 0, opacity: 0, duration: 1.0, ease: "expo.inOut" }, 4.5)
      .to(spans[1], { yPercent: -100, y: 0, opacity: 0, duration: 1.0, ease: "expo.inOut" }, 4.6)
      .to(el, { opacity: 0, duration: 0.6, ease: "expo.inOut" }, 5.0);
    motionCleanups.push(function () { finish(); loaderTimeline.kill(); });
    } catch (error) { finish(); }
  })();

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
  var heroPhrases = [
    ["You run the jobs.", "I build the systems."],
    ["Less busywork.", "More breathing room."]
  ];
  document.querySelectorAll(".hero .display .txt").forEach(function (el, index) {
    if (heroPhrases[0][index]) el.textContent = heroPhrases[0][index];
  });
  var allMasks = [].slice.call(document.querySelectorAll(".mask"));
  var revealSelector = ".reveal,.reveal-group,.head,.job,.word,.tiles,.strength,.trust,.contact";
  function resolveWords(words) {
    words.forEach(function (word) {
      word.style.opacity = "1";
      word.style.transform = "none";
    });
  }
  function resolveMotion() {
    motionCleanups.forEach(function (cleanup) { cleanup(); });
    motionCleanups = [];
    if (motionContext) { motionContext.revert(); motionContext = null; }
    document.querySelectorAll(".hero .txt--next").forEach(function (el) { el.remove(); });
    allMasks.forEach(function (m) { m.style.transform = "scaleX(0)"; });
    resolveWords(document.querySelectorAll(".bw"));
  }

  /* ---------- reduced motion: everything resolved, nothing moves ---------- */
  if (RM) {
    document.querySelectorAll(revealSelector).forEach(function (e) {
      e.classList.add("is-inview");
    });
    allMasks.forEach(function (m) { m.style.transform = "scaleX(0)"; });
    resolveWords(document.querySelectorAll(".bw"));
  }

  if (!RM) {
    /* ---------- 2. is-inview, the Locomotive way ---------- */
    var targets = [].slice.call(document.querySelectorAll(revealSelector));
    targets.forEach(function (el) {
      onEntry(el, function () { el.classList.add("is-inview"); });
    });

    if (hasGSAP) {
      try {
      motionContext = gsap.context(function () {});
      motionContext.add(function () {
      gsap.registerPlugin(ScrollTrigger);

      /* ---------- 3. smooth scroll (their Locomotive layer) ---------- */
      if (typeof window.Lenis !== "undefined") {
        lenis = new Lenis({ lerp: 0.1, smoothWheel: true, touchMultiplier: 3.5 });
        lenis.on("scroll", ScrollTrigger.update);
        var tickLenis = function (time) { lenis.raf(time * 1000); };
        gsap.ticker.add(tickLenis);
        motionCleanups.push(function () { gsap.ticker.remove(tickLenis); lenis.destroy(); lenis = null; });
        gsap.ticker.lagSmoothing(0);
        document.querySelectorAll('a[href^="#"]').forEach(function (a) {
          a.addEventListener("click", function (e) {
            if (RM || !hasGSAP) return;
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
        if (window.innerWidth < 1024) {
          onEntry(h, function () {
            if (RM || !hasGSAP) return;
            gsap.to(h.querySelectorAll(".mask"), { scaleX: 0, duration: 1.25, ease: "expo.out", stagger: 0.05 });
          });
          return;
        }
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
          if (heroPlayed || RM || !hasGSAP) return; heroPlayed = true;
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
        var txts = [].slice.call(h1.querySelectorAll(".txt"));
        if (txts.length < 2) return;
        // The reference's slot is TWO stacked parts per line: the next part rises
        // (expo.out, from t=.55/.65) while the current one is still leaving
        // (expo.inOut, .9s, second part lagging .1s). One element cannot do both,
        // so each line gets a hidden twin parked below the mask.
        var nexts = txts.map(function (el) {
          var n = el.cloneNode(true); n.classList.add("txt--next"); n.setAttribute("aria-hidden", "true");
          el.parentNode.appendChild(n); gsap.set(n, { yPercent: 120, y: 0 }); return n;
        });
        var LINES = heroPhrases;
        var i = 0, timer = null, tl = null, inView = true;
        function settle() {
          var active = tl;
          tl = null;
          if (active) { active.eventCallback("onInterrupt", null); active.kill(); }
          gsap.set(txts,  { yPercent: 0,   y: 0 });
          gsap.set(nexts, { yPercent: 120, y: 0 });
        }
        function cycle() {
          if (!inView || document.hidden || tl) return;
          var next = LINES[(i + 1) % LINES.length];
          nexts[0].textContent = next[0]; nexts[1].textContent = next[1];
          tl = gsap.timeline({ onInterrupt: settle, onComplete: function () {
            txts[0].textContent = next[0]; txts[1].textContent = next[1];
            gsap.set(txts,  { yPercent: 0,   y: 0 });
            gsap.set(nexts, { yPercent: 120, y: 0 });
            tl = null; i = (i + 1) % LINES.length;
          }});
          tl.to(txts[0],  { yPercent: -150, y: 0, duration: 0.9, ease: "expo.inOut" }, 0)
            .to(txts[1],  { yPercent: -150, y: 0, duration: 0.9, ease: "expo.inOut" }, 0.1)
            .fromTo(nexts[0], { yPercent: 120, y: 0 }, { yPercent: 0, y: 0, duration: 0.9, ease: "expo.out" }, 0.55)
            .fromTo(nexts[1], { yPercent: 120, y: 0 }, { yPercent: 0, y: 0, duration: 0.9, ease: "expo.out" }, 0.65);
        }
        function start() { if (!RM && hasGSAP && !timer && inView && !document.hidden) timer = setInterval(cycle, 4500); }
        function stop() { clearInterval(timer); timer = null; settle(); }
        motionCleanups.push(stop);
        if ("IntersectionObserver" in window) {
          new IntersectionObserver(function (es) { inView = es[0].isIntersecting; inView ? start() : stop(); },
            { threshold: 0.25 }).observe(h1);
        }
        setTimeout(function () { if (document.visibilityState === "visible") start(); }, 3200);
        document.addEventListener("visibilitychange", function () { document.hidden ? stop() : start(); });
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

      /* ---------- 5. measured parallax (SCROLL_SPEC §1.5) ----------
         Target only the intended layers: data-speed also configures the orb
         shader. CSS owns the child images' centering, reveal scale and hover. */
      var desktopMotion = gsap.matchMedia();
      desktopMotion.add("(min-width: 1024px)", function () {
      gsap.utils.toArray(".job__media .job__cover").forEach(function (el) {
        gsap.fromTo(el, { y: -18, yPercent: 0 }, {
          y: 18, yPercent: 0, ease: "none",
          scrollTrigger: { trigger: el.closest(".job__media"), start: "top bottom", end: "bottom top", scrub: 0.6 }
        });
      });

      /* ---------- 5b. portrait: 288px up over the whole team section;
         name: 200px down over its own viewport crossing. ---------- */
      (function () {
        var who = document.getElementById("who");
        if (!who) return;
        var pic = who.querySelector(".img-wrapper");
        var copy = who.querySelector(".person__name");
        if (!pic || !copy) return;
        gsap.fromTo(pic, { y: 144, yPercent: 0 }, { y: -144, ease: "none",
          scrollTrigger: { trigger: who, start: "top bottom", end: "bottom top", scrub: 0.5 } });
        gsap.fromTo(copy, { y: -100, yPercent: 0 }, { y: 100, ease: "none",
          scrollTrigger: { trigger: copy, start: "top bottom", end: "bottom top", scrub: 0.5 } });
      })();
      });

      /* ---------- 5c. header hides going down, returns going up ----------
         Verified live on the reference: opacity 0<->1 only, .7s expo, no translate,
         flipping on the first frame of reversal. */
      (function () {
        var nav = document.getElementById("nav");
        if (!nav) return;
        var last = window.scrollY, dir = 0;
        function onScroll() {
          var y = window.scrollY;
          var heroSection = document.querySelector('.hero');
          nav.classList.toggle('is-past-hero', !!heroSection && y > heroSection.offsetHeight - 70);
          var d = y > last ? 1 : (y < last ? -1 : dir);
          if (d !== dir) {
            dir = d;
            nav.classList.toggle("is-away", d === 1 && y > 140);
          }
          if (y <= 140) nav.classList.remove("is-away");
          last = y;
        }
        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();
      })();

      /* ---------- 5d. rows move ±83px at 1440px; images counter by ±35px.
         Each image has its own viewport phase. A separate inner layer keeps
         parallax from overwriting the CSS image centering/scale/hover. */
      desktopMotion.add("(min-width: 1024px)", function () {
      var layers = [];
      gsap.utils.toArray(".tiles__line").forEach(function (line) {
        var s = parseFloat(line.getAttribute("data-tspeed")) || 0;
        if (!s) return;
        var direction = s > 0 ? 1 : -1;
        var span = function () { return 83 * window.innerWidth / 1440; };
        gsap.fromTo(line,
          { x: function () { return direction * span(); } },
          { x: function () { return -direction * span(); },
            ease: "none",
            scrollTrigger: { trigger: line.closest(".tiles"), start: "top bottom", end: "bottom top",
                             scrub: 0.5, invalidateOnRefresh: true } });
        line.querySelectorAll(".tiles__img").forEach(function (tile) {
          var img = tile.querySelector("img");
          if (!img) return;
          var layer = document.createElement("span");
          layer.className = "tiles__parallax";
          layer.style.cssText = "position:absolute;top:0;left:-35px;width:calc(100% + 70px);height:100%;display:block";
          tile.insertBefore(layer, img);
          layer.appendChild(img);
          layers.push(layer);
          gsap.fromTo(layer, { x: -direction * 35 }, { x: direction * 35, ease: "none",
            scrollTrigger: { trigger: tile, start: "top bottom", end: "bottom top", scrub: 0.5 } });
        });
      });
      return function () {
        layers.forEach(function (layer) {
          layer.parentNode.insertBefore(layer.firstChild, layer);
          layer.remove();
        });
      };
      });

      /* ---------- 5e. "built for": the word list rises word by word ----------
         Their ANIMATE_BRAND_WORDS: y 20% -> 0 over .85s expo.out, stagger .05,
         with opacity over .425s linear on the same stagger. y AND yPercent are
         both pinned - GSAP would otherwise keep a stray pixel offset. */
      (function () {
        var box = document.querySelector("[data-words]");
        if (!box) return;
        var words = box.querySelectorAll(".bw");
        onEntry(box, function () {
          if (RM || !hasGSAP) { resolveWords(words); return; }
          try {
            var tl = gsap.timeline({ onInterrupt: function () { resolveWords(words); } });
            tl.fromTo(words, { yPercent: 20, y: 0 }, { yPercent: 0, y: 0, duration: 0.85, ease: "expo.out", stagger: 0.05, force3D: true }, 0)
              .to(words, { opacity: 1, duration: 0.425, ease: "none", stagger: 0.05 }, 0);
            motionCleanups.push(function () { tl.kill(); });
          } catch (error) {
            if (tl) tl.kill();
            resolveWords(words);
          }
        }, 0.8);
      })();

      /* ---------- 5f. nav flips to dark type over the light footer ---------- */
      (function () {
        var c = document.querySelector(".contact");
        if (!c || !("IntersectionObserver" in window)) return;
        new IntersectionObserver(function (es) {
          document.documentElement.setAttribute("data-nav", es[0].isIntersecting ? "light" : "dark");
        }, { rootMargin: "-60px 0px -85% 0px" }).observe(c);
      })();

      /* ---------- 5g. active nav item follows the section in view ---------- */
      (function () {
        var links = [].slice.call(document.querySelectorAll(".nav__links a"));
        if (!links.length || !("IntersectionObserver" in window)) return;
        var map = {};
        links.forEach(function (a) { var id = a.getAttribute("href").slice(1); var el = document.getElementById(id); if (el) map[id] = a; });
        var io = new IntersectionObserver(function (es) {
          es.forEach(function (e) { if (e.isIntersecting) { links.forEach(function (a) { a.classList.remove("active"); }); map[e.target.id].classList.add("active"); } });
        }, { rootMargin: "-40% 0px -55% 0px" });
        Object.keys(map).forEach(function (id) { io.observe(document.getElementById(id)); });
      })();

      var orb = document.querySelector(".orb");
      var lensWrap = document.querySelector(".lens");
      if (lensWrap) {
        gsap.to(lensWrap, { yPercent: 34, ease: "none",
          scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 0.8 } });
      }
      if (orb) {
        gsap.to(orb, { yPercent: 20, ease: "none",
          scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 0.8 } });
      }
      window.addEventListener("load", function () { ScrollTrigger.refresh(); });
      });
      } catch (error) {
        hasGSAP = false;
        resolveMotion();
        console.warn("Portfolio motion unavailable; content restored.", error);
      }
    } else {
      resolveMotion();
    }
  }

  /* ---------- theme inversion: the whole page cross-fades over 1.25s ----------
     The reference fires locomotive's SET_BACKGROUND and toggles .white-bg on the
     app root. Here the work section drives [data-theme] on <html>; the 1.25s
     transitions live in CSS so ground, type, rules and cursor migrate as one. */
  (function () {
    // The reference is dark from top to bottom; its only ground flip is a hard
    // cut at the footer. The light island introduced earlier was there to keep
    // the project screenshots legible, but those captures are light in
    // themselves and read fine on black - the same way the reference shows
    // bright photography on its dark ground. Held dark throughout.
    document.documentElement.setAttribute("data-theme", "dark");
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
      el.addEventListener("mouseenter", function () {
        setState(el.classList.contains('job__media') ? Math.min(0.75, 720 / window.innerWidth) : 0.75, "media");
      });
      el.addEventListener("mouseleave", function () { setState(0.075, null); });
    });
    document.querySelectorAll("a, button, summary, input").forEach(function (el) {
      if (el.closest(".img-wrapper")) return;
      el.addEventListener("mouseenter", function () { setState(0, null); });
      el.addEventListener("mouseleave", function () { setState(0.075, null); });
    });

    (function tick() {
      if (RM) return;
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
  var hasGSAP2 = hasGSAP;
  var LIVE = hasGSAP2 && !RMQ.matches;
  RMQ.addEventListener("change", function (event) {
    if (!event.matches) return;
    RM = true;
    LIVE = false;
    resolveMotion();
    document.querySelectorAll(revealSelector).forEach(function (el) { el.classList.add("is-inview"); });
    document.querySelectorAll(".band__video").forEach(function (video) { video.pause(); });
  });
  if (hasGSAP2) {
    window.addEventListener("load", function () { ScrollTrigger.refresh(); });
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { ScrollTrigger.refresh(); queueEntries(); });
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

  /* ---------- band video: honour reduced motion, and do not decode offscreen ----------
     Marked preload="none" so the file is only fetched when the band is near. */
  (function () {
    var vids = [].slice.call(document.querySelectorAll(".band__video"));
    if (!vids.length) return;
    var manuallyPaused = new WeakSet();
    function play(v) {
      if (v.preload === "none") { v.preload = "auto"; v.load(); }
      var promise = v.play();
      if (promise && promise.catch) promise.catch(function () {});
    }
    vids.forEach(function (v) {
      var band = v.closest(".band");
      var button = band && band.querySelector(".band__toggle");
      if (RM) { v.removeAttribute("autoplay"); v.pause(); }
      if (!button) return;
      function syncButton() {
        var playing = !v.paused && !v.ended;
        button.textContent = playing ? "Pause film" : "Play film";
        button.setAttribute("aria-label", button.textContent);
        button.setAttribute("aria-pressed", playing ? "true" : "false");
      }
      button.addEventListener("click", function () {
        if (!v.paused && !v.ended) {
          manuallyPaused.add(v);
          v.pause();
        } else {
          manuallyPaused.delete(v);
          play(v); // Explicit playback remains available under reduced motion.
        }
        syncButton();
      });
      ["play", "pause", "ended", "emptied", "error"].forEach(function (event) {
        v.addEventListener(event, syncButton);
      });
      syncButton();
    });
    if (!("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting && !RM && !manuallyPaused.has(v)) {
          play(v);
        } else { v.pause(); }
      });
    }, { rootMargin: "200px 0px" });
    vids.forEach(function (v) { io.observe(v); });
  })();

  /* ---------- person card: reference's circular + reveals the biography ---------- */
  (function () {
    var person = document.querySelector(".person");
    var button = person && person.querySelector(".person__plus");
    if (!person || !button) return;

    button.addEventListener("click", function () {
      var open = person.classList.toggle("is-open");
      button.setAttribute("aria-expanded", open ? "true" : "false");
      button.setAttribute("aria-label", open ? "Hide details about John" : "Read more about John");
    });
  })();

  /* ---------- mobile menu: panel slides in over .75s expo, bars become a cross ---------- */
  (function () {
    var b = document.getElementById("burger"), nav = document.getElementById("nav");
    if (!b || !nav) return;
    var panel = nav.querySelector(".nav__links");
    if (!panel) return;
    var links = panel.querySelectorAll("a");
    var mobileMenu = window.matchMedia("(max-width: 760px)");
    var resumeLenis = false;
    function syncMenuAccess() {
      panel.inert = mobileMenu.matches && !nav.classList.contains("is-open");
    }
    function closeMenu(returnFocus) {
      var wasOpen = nav.classList.contains("is-open");
      nav.classList.remove("is-open");
      b.setAttribute("aria-expanded", "false");
      b.setAttribute("aria-label", "Menu");
      if (wasOpen) document.documentElement.classList.remove("is-loading");
      if (resumeLenis && lenis && hasGSAP && !RM) lenis.start();
      resumeLenis = false;
      syncMenuAccess();
      if (returnFocus) b.focus();
    }
    b.addEventListener("click", function () {
      if (!mobileMenu.matches) return;
      if (nav.classList.contains("is-open")) { closeMenu(true); return; }
      nav.classList.add("is-open");
      b.setAttribute("aria-expanded", "true");
      b.setAttribute("aria-label", "Close menu");
      document.documentElement.classList.add("is-loading");
      resumeLenis = !!(lenis && hasGSAP && !RM && !lenis.isStopped);
      if (resumeLenis) lenis.stop();
      syncMenuAccess();
      if (links.length) links[0].focus();
    });
    // Capture closes/resumes before the shared smooth-anchor click handler runs.
    links.forEach(function (a) { a.addEventListener("click", function () { closeMenu(false); }, true); });
    document.addEventListener("keydown", function (e) {
      if (!mobileMenu.matches || !nav.classList.contains("is-open")) return;
      if (e.key === "Escape") { e.preventDefault(); closeMenu(true); return; }
      if (e.key !== "Tab") return;
      var focusable = [b].concat([].slice.call(panel.querySelectorAll('a[href],button,input,select,textarea,[tabindex]')))
        .filter(function (el) { return !el.disabled && el.tabIndex >= 0 && el.getClientRects().length; });
      var first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey && (document.activeElement === first || !focusable.includes(document.activeElement))) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && (document.activeElement === last || !focusable.includes(document.activeElement))) {
        e.preventDefault(); first.focus();
      }
    });
    mobileMenu.addEventListener("change", function () { closeMenu(false); });
    syncMenuAccess();
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
      if (!picked) { note.textContent = "Pick a time above first, then open the email."; note.style.color = ""; return; }
      var body = "Hi John,\n\nI'd like the free 30-minute workflow assessment.\n\n" +
        "Name: " + name + "\nBusiness: " + biz + "\nPreferred time: " + picked + "\n\nThanks,\n" + name;
      window.location.href = "mailto:johnmontejano2@gmail.com?subject=" +
        encodeURIComponent("Workflow assessment — " + name) + "&body=" + encodeURIComponent(body);
      note.textContent = "Your email client is open. It isn't booked until you press Send.";
      note.style.color = "";
    });
  }
  } catch (bootError) {
    // Restore readable content even if boot fails before helpers are initialized.
    // Disable callbacks first, then clean up only motion owned by this file.
    RM = true;
    LIVE = false;
    hasGSAP = false;
    pendingEntries = [];
    if (entryObserver) entryObserver.disconnect();
    if (entryFrame != null) cancelAnimationFrame(entryFrame);
    (motionCleanups || []).forEach(function (cleanup) {
      try { cleanup(); } catch (cleanupError) {}
    });
    if (motionContext) {
      try { motionContext.revert(); } catch (cleanupError) {}
    }
    document.documentElement.classList.remove("js", "is-loading");
    var loader = document.getElementById("loader");
    if (loader) loader.remove();
    document.querySelectorAll(".hero .txt--next").forEach(function (el) { el.remove(); });
    document.querySelectorAll(".reveal,.reveal-group,.head,.job,.word,.tiles,.strength,.trust,.contact").forEach(function (el) {
      el.classList.add("is-inview");
    });
    document.querySelectorAll(".bw,.strength__orb,.strength__text,.hero .txt").forEach(function (el) {
      el.style.opacity = "1";
      el.style.transform = "none";
    });
    document.querySelectorAll(".mask").forEach(function (el) { el.style.transform = "scaleX(0)"; });
    console.error("Portfolio boot failed; static content restored.", bootError);
  }
})();
