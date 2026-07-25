/* John Montejano - Signal System behaviors
   Character: documentary, precise, quiet. Things draw, settle, lock into place.
   Everything degrades to fully static content with reduced motion or no JS.

   Motion contract kept by this file:
   - transform / opacity / strokeDashoffset only. No layout properties are animated.
   - nothing informational is hidden unless it is below the fold at init.
   - will-change is set while a tween runs and cleared the moment it stops.
   - the motion kill switch is an exact query parameter (?motion=off), never a
     substring match, so no real URL can disable the site by accident. */
(function () {
  "use strict";

  /* ---------- environment ---------- */
  var motionOff = false;
  try {
    motionOff = new URLSearchParams(window.location.search).get("motion") === "off";
  } catch (e) { motionOff = false; }

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches || motionOff;
  var hasGsap = typeof window.gsap !== "undefined";
  var animate = hasGsap && !reduce;
  var hasIO = "IntersectionObserver" in window;
  var toArray = function (list) { return Array.prototype.slice.call(list || []); };
  var vh = function () { return window.innerHeight || document.documentElement.clientHeight; };
  var willChange = function (el, on) {
    if (!el) return;
    if (el.length !== undefined && !el.style) { toArray(el).forEach(function (e) { willChange(e, on); }); return; }
    el.style.willChange = on ? "transform" : "";
  };

  document.documentElement.classList.add("js-ready");
  if (animate) document.documentElement.classList.add("js-anim");

  /* Runtime stylesheet: the handful of rules that only apply once JS has taken
     an element over. Injected only in animating mode, so the no-JS and
     reduced-motion renderings are exactly what ships in styles.css. */
  if (animate) {
    var runtime = document.createElement("style");
    runtime.setAttribute("data-motion-runtime", "");
    runtime.textContent =
      /* the static CSS connector is replaced by the drawn cobalt signal line */
      '[data-sts-line="js"] .node::before{display:none;}';
    document.head.appendChild(runtime);
  }

  /* ---------- nav scrolled state (IO sentinel; no scroll listeners) ---------- */
  var header = document.getElementById("site-header");
  if (header && hasIO) {
    /* At the very top the bar sits flush with the page surface. Once the page
       moves it lifts to paper with a hairline. Colour only: no size change, no
       hide-on-scroll, no progress cue. */
    header.style.backgroundColor = "transparent";
    /* the transition is added a frame later so the first state is not itself
       animated on page load */
    requestAnimationFrame(function () {
      header.style.transition = "background-color 200ms var(--ease-out), border-color 200ms var(--ease-out)";
    });
    var sentinel = document.createElement("div");
    sentinel.setAttribute("aria-hidden", "true");
    sentinel.style.cssText = "position:absolute;top:0;height:1px;width:1px;pointer-events:none;";
    document.body.prepend(sentinel);
    new IntersectionObserver(function (entries) {
      var scrolled = !entries[0].isIntersecting;
      header.classList.toggle("scrolled", scrolled);
      header.setAttribute("data-scrolled", scrolled ? "true" : "false");
      header.style.backgroundColor = scrolled ? "var(--surface-paper)" : "transparent";
    }, { threshold: 0 }).observe(sentinel);
  }

  /* ---------- mobile menu: a real modal dialog ---------- */
  var toggle = document.querySelector(".menu-toggle");
  var menu = document.getElementById("mobile-menu");
  if (toggle && menu) {
    var closeBtn = menu.querySelector(".menu-close");
    var lastFocus = null;
    var prevOverflow = "";
    var prevPadRight = "";
    var inerted = [];
    var FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),' +
                    'textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

    var isOpen = function () { return menu.classList.contains("open"); };

    var focusables = function () {
      return toArray(menu.querySelectorAll(FOCUSABLE)).filter(function (el) {
        return el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement;
      });
    };

    var lockScroll = function () {
      var bar = window.innerWidth - document.documentElement.clientWidth;
      prevOverflow = document.body.style.overflow;
      prevPadRight = document.body.style.paddingRight;
      document.body.style.overflow = "hidden";
      /* compensate for the scrollbar so nothing shifts sideways when it goes */
      if (bar > 0) document.body.style.paddingRight = bar + "px";
    };
    var unlockScroll = function () {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPadRight;
    };

    var supportsInert = "inert" in HTMLElement.prototype;
    var setBackgroundInert = function (on) {
      if (on) {
        inerted = [];
        toArray(document.body.children).forEach(function (el) {
          if (el === menu || el.nodeType !== 1) return;
          if (supportsInert) {
            if (el.inert) return;
            el.inert = true;
            inerted.push({ el: el, mode: "inert" });
          } else {
            if (el.getAttribute("aria-hidden") === "true") return;
            el.setAttribute("aria-hidden", "true");
            inerted.push({ el: el, mode: "aria" });
          }
        });
      } else {
        inerted.forEach(function (rec) {
          if (rec.mode === "inert") rec.el.inert = false;
          else rec.el.removeAttribute("aria-hidden");
        });
        inerted = [];
      }
    };

    var onKeydown = function (e) {
      if (!isOpen()) return;
      if (e.key === "Escape" || e.key === "Esc") { e.preventDefault(); closeMenu(); return; }
      if (e.key !== "Tab") return;
      var f = focusables();
      if (!f.length) { e.preventDefault(); menu.focus(); return; }
      var first = f[0];
      var last = f[f.length - 1];
      var active = document.activeElement;
      var inside = menu.contains(active);
      if (e.shiftKey) {
        if (!inside || active === first || active === menu) { e.preventDefault(); last.focus(); }
      } else if (!inside || active === last) {
        e.preventDefault(); first.focus();
      }
    };

    var openMenu = function () {
      if (isOpen()) return;
      lastFocus = document.activeElement;
      menu.classList.add("open");
      toggle.setAttribute("aria-expanded", "true");
      lockScroll();
      (closeBtn || focusables()[0] || menu).focus();   /* focus first, then seal */
      setBackgroundInert(true);
      document.addEventListener("keydown", onKeydown, true);
    };

    var closeMenu = function () {
      if (!isOpen()) return;
      document.removeEventListener("keydown", onKeydown, true);
      setBackgroundInert(false);
      menu.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
      unlockScroll();
      var back = (lastFocus && document.contains(lastFocus) && lastFocus !== document.body) ? lastFocus : toggle;
      back.focus();
      lastFocus = null;
    };

    toggle.addEventListener("click", openMenu);
    if (closeBtn) closeBtn.addEventListener("click", closeMenu);
    menu.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", closeMenu); });

    /* the menu control disappears at the desktop breakpoint: never strand focus there */
    var wide = window.matchMedia("(min-width: 1024px)");
    var onWide = function (e) { if (e.matches) closeMenu(); };
    if (wide.addEventListener) wide.addEventListener("change", onWide);
    else if (wide.addListener) wide.addListener(onWide);
  }

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll(".faq-item").forEach(function (item, i) {
    var q = item.querySelector(".faq-q");
    var panel = item.querySelector(".faq-a");
    if (!q) return;
    if (panel) {
      if (!panel.id) panel.id = "faq-panel-" + (i + 1);
      q.setAttribute("aria-controls", panel.id);
      if (!q.id) q.id = "faq-q-" + (i + 1);
      panel.setAttribute("role", "region");
      panel.setAttribute("aria-labelledby", q.id);
    }
    q.addEventListener("click", function () {
      var open = item.hasAttribute("data-open");
      if (open) { item.removeAttribute("data-open"); q.setAttribute("aria-expanded", "false"); }
      else { item.setAttribute("data-open", ""); q.setAttribute("aria-expanded", "true"); }
    });
  });

  /* ---------- image plates: prepare the drift wrapper ----------
     Every plate image gets a transform-only wrapper so the picture can drift
     inside its frame without touching the image element itself (the CSS hover
     scale lives on the image and must keep working). Purely structural: the
     wrapper covers the frame exactly, so nothing moves until a tween runs. */
  var frames = [];
  if (animate) {
    document.querySelectorAll(".plate-media").forEach(function (frame) {
      var img = frame.querySelector("img");
      if (!img || img.parentElement !== frame) return;
      var wrap = document.createElement("span");
      wrap.setAttribute("data-plate-drift", "");   /* presentational only; the img keeps its alt text */
      wrap.style.cssText = "display:block;position:absolute;inset:0;";
      frame.insertBefore(wrap, img);
      wrap.appendChild(img);
      frames.push(frame);
    });
  }
  var driftWrap = function (frame) {
    var img = frame && frame.querySelector("img");
    return img && img.parentElement !== frame ? img.parentElement : null;
  };
  /* the reveal unit is the block the frame belongs to (link, figure or plate) */
  var unitOf = function (frame) {
    return frame.closest(".rv, .rv-group") || frame.closest("figure, a.plate-link, .plate") ||
           frame.parentElement || frame;
  };
  var plateUnits = [];
  frames.forEach(function (frame) {
    if (frame.closest("[data-sts-root]")) return;   /* the signature section owns its own figure */
    var unit = unitOf(frame);
    unit.setAttribute("data-plate-unit", "");
    plateUnits.push({ unit: unit, frame: frame });
  });

  /* ---------- quiet reveal for everything that is not a plate ----------
     CSS owns the transition; JS only decides who is eligible and staggers
     siblings so a row never lands all at once. */
  if (animate && hasIO) {
    var els = toArray(document.querySelectorAll(".rv, .rv-group")).filter(function (el) {
      return !el.hasAttribute("data-plate-unit") && !el.querySelector("[data-plate-unit]");
    });
    var io = new IntersectionObserver(function (entries) {
      var landing = entries.filter(function (e) { return e.isIntersecting; });
      var seen = [];
      var counts = [];
      landing.forEach(function (entry) {
        var parent = entry.target.parentElement;
        var idx = seen.indexOf(parent);
        if (idx === -1) { seen.push(parent); counts.push(0); idx = seen.length - 1; }
        var step = Math.min(counts[idx], 3);
        counts[idx] += 1;
        io.unobserve(entry.target);
        if (step === 0) entry.target.classList.add("rv-in");
        else setTimeout(function () { entry.target.classList.add("rv-in"); }, step * 90);
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0 });
    els.forEach(function (el) {
      if (el.getBoundingClientRect().top > vh() * 0.9) {
        el.classList.add("rv-init");
        io.observe(el);
      }
    });
  }

  if (!animate) return;   /* everything below is pure choreography */

  gsap.registerPlugin(ScrollTrigger);
  var hasSplit = typeof window.SplitText !== "undefined";
  if (hasSplit) gsap.registerPlugin(SplitText);

  /* ---------- section rule draws (the repeated motion signature) ---------- */
  document.querySelectorAll("[data-rule]").forEach(function (rule) {
    gsap.set(rule, { scaleX: 0, transformOrigin: "left center" });
    gsap.to(rule, {
      scaleX: 1, duration: 0.65, ease: "power2.inOut",
      onStart: function () { willChange(rule, true); },
      onComplete: function () { willChange(rule, false); },
      scrollTrigger: { trigger: rule, start: "top 82%", once: true }
    });
  });

  /* ---------- hero entrance ----------
     The H1 is the LCP element on every page, so it is never hidden and never
     waits on document.fonts. SplitText masks the lines instead: the headline
     is in the DOM, painted, and simply wipes up behind its own mask. If
     SplitText is unavailable or throws, the headline is already visible. */
  var heroTitle = document.querySelector("[data-hero-title]");
  if (heroTitle && document.visibilityState === "visible") {
    var heroRule = document.querySelector("[data-hero-rule]");
    var heroTicks = document.querySelectorAll("[data-hero-ticks] li");
    var heroBottom = document.querySelector("[data-hero-bottom]");
    var heroSplit = null;
    var titleDone = false;

    if (heroRule) gsap.set(heroRule, { scaleX: 0, transformOrigin: "left center" });
    if (heroTicks.length) gsap.set(heroTicks, { opacity: 0, y: 8 });
    if (heroBottom) gsap.set(heroBottom.children, { opacity: 0, y: 16 });

    var landHero = function () {   /* tab hidden mid-entrance: land everything now */
      titleDone = true;
      if (heroSplit && heroSplit.lines) gsap.set(heroSplit.lines, { yPercent: 0, clearProps: "willChange" });
      if (heroRule) gsap.set(heroRule, { scaleX: 1, clearProps: "willChange" });
      if (heroTicks.length) gsap.set(heroTicks, { clearProps: "all" });
      if (heroBottom) gsap.set(heroBottom.children, { clearProps: "all" });
    };

    if (hasSplit) {
      try {
        heroSplit = SplitText.create(heroTitle, {
          type: "lines",
          mask: "lines",
          autoSplit: true,      /* re-splits when the webfont lands or the box resizes */
          onSplit: function (self) {
            if (titleDone) return gsap.set(self.lines, { yPercent: 0 });
            willChange(self.lines, true);
            return gsap.from(self.lines, {
              yPercent: 110, duration: 0.85, stagger: 0.08, ease: "power3.out",
              onComplete: function () { titleDone = true; willChange(self.lines, false); }
            });
          }
        });
      } catch (err) { heroSplit = null; }
    }
    /* the headline is legible either way after this point */
    setTimeout(function () { titleDone = true; }, 1400);

    var tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    if (heroRule) tl.to(heroRule, { scaleX: 1, duration: 0.7, ease: "power2.inOut" }, 0.4);
    if (heroTicks.length) tl.to(heroTicks, { opacity: 1, y: 0, duration: 0.35, stagger: 0.09, ease: "power2.out" }, 0.8);
    if (heroBottom) tl.to(heroBottom.children, { opacity: 1, y: 0, duration: 0.55, stagger: 0.1 }, 0.62);

    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "hidden") { tl.progress(1); landHero(); }
    });
  }

  /* ---------- image plates: the reveal that carries the whole argument ----------
     The frame opens like a shutter (scaleY from the top edge) while the picture
     inside counter-scales, so the image never squashes and never moves: the
     window opens onto a photograph that is already correctly placed. Then the
     picture drifts a fraction of a percent inside its frame for as long as it
     crosses the viewport. Transforms only. */
  var ZOOM = 1.045;    /* headroom so the drift never exposes an edge */
  var SHUT = 0.86;     /* how far the shutter is closed at rest */
  var DRIFT = 1.4;     /* percent of frame height, each way */
  var plateData = new WeakMap();

  /* every hidden state is applied here, at arm time, while the plate is still
     below the fold. Nothing on screen is ever hidden and then re-revealed. */
  var preparePlate = function (frame, unit) {
    var wrap = driftWrap(frame);
    if (!wrap) return null;
    var text = (unit && unit !== frame)
      ? toArray(unit.querySelectorAll("figcaption, .case-next-body"))
      : [];
    gsap.set(frame, { scaleY: SHUT, transformOrigin: "50% 0%", opacity: 0 });
    gsap.set(wrap, { scaleX: ZOOM, scaleY: ZOOM / SHUT, transformOrigin: "50% 0%" });
    if (text.length) gsap.set(text, { opacity: 0, y: 10 });
    var data = { wrap: wrap, text: text };
    plateData.set(frame, data);
    return data;
  };

  var playPlate = function (frame, delay) {
    var data = plateData.get(frame) || { wrap: driftWrap(frame), text: [] };
    var wrap = data.wrap;
    var tl = gsap.timeline({
      delay: delay || 0,
      onStart: function () { willChange(frame, true); willChange(wrap, true); },
      onComplete: function () { willChange(frame, false); }
    });
    tl.to(frame, { opacity: 1, duration: 0.45, ease: "power1.out" }, 0);
    tl.to(frame, { scaleY: 1, duration: 1.05, ease: "power3.out" }, 0);
    if (wrap) tl.to(wrap, { scaleY: ZOOM, duration: 1.05, ease: "power3.out" }, 0);
    if (data.text.length) {
      tl.to(data.text, {
        opacity: 1, y: 0, duration: 0.5, stagger: 0.06, ease: "power2.out",
        clearProps: "transform"
      }, 0.22);
    }
    return tl;
  };

  var driftPlate = function (frame) {
    var wrap = driftWrap(frame);
    if (!wrap) return;
    gsap.fromTo(wrap,
      { yPercent: -DRIFT },
      {
        yPercent: DRIFT, ease: "none",
        scrollTrigger: {
          trigger: frame, start: "top bottom", end: "bottom top", scrub: true,
          onToggle: function (self) { willChange(wrap, self.isActive); }
        }
      });
  };

  var revealUnits = [];
  plateUnits.forEach(function (rec) {
    /* never hide something the visitor is already looking at */
    if (rec.frame.getBoundingClientRect().top < vh() * 0.88) return;
    if (!preparePlate(rec.frame, rec.unit)) return;
    rec.unit.setAttribute("data-plate-armed", "");
    revealUnits.push(rec.unit);
    driftPlate(rec.frame);
  });

  if (revealUnits.length) {
    /* siblings that enter together are staggered, so a row of plates never
       lands on the same frame */
    ScrollTrigger.batch(revealUnits, {
      start: "top 88%",
      once: true,
      interval: 0.14,
      batchMax: 4,
      onEnter: function (batch) {
        batch.forEach(function (unit, i) {
          if (!unit.hasAttribute("data-plate-armed")) return;
          unit.removeAttribute("data-plate-armed");
          var frame = unit.matches(".plate-media") ? unit : unit.querySelector(".plate-media");
          if (frame) playPlate(frame, i * 0.14);
        });
      }
    });
  }

  /* ---------- method spine draw (scrubbed install) ---------- */
  var spine = document.querySelector(".method-spine");
  if (spine) {
    var horizontal = window.matchMedia("(min-width: 768px)").matches;
    gsap.set(spine, horizontal
      ? { scaleX: 0, transformOrigin: "left center" }
      : { scaleY: 0, transformOrigin: "top center" });
    gsap.to(spine, {
      scaleX: 1, scaleY: 1, ease: "none",
      scrollTrigger: {
        trigger: ".method-row", start: "top 85%", end: "top 40%", scrub: 0.5,
        onToggle: function (self) { willChange(spine, self.isActive); }
      }
    });
  }

  /* ---------- about timeline spine ---------- */
  var tlSpine = document.querySelector(".timeline .tl-spine");
  if (tlSpine) {
    gsap.set(tlSpine, { scaleY: 0, transformOrigin: "top center" });
    gsap.to(tlSpine, {
      scaleY: 1, ease: "none",
      scrollTrigger: {
        trigger: ".timeline", start: "top 80%", end: "bottom 55%", scrub: 0.5,
        onToggle: function (self) { willChange(tlSpine, self.isActive); }
      }
    });
  }

  /* ---------- footer heading settle (the one parallax-ish move) ---------- */
  var closeHeading = document.querySelector(".close-heading");
  if (closeHeading) {
    gsap.from(closeHeading, {
      y: 44, ease: "none",
      scrollTrigger: {
        trigger: "footer.close", start: "top 92%", end: "top 45%", scrub: 0.5,
        onToggle: function (self) { willChange(closeHeading, self.isActive); }
      }
    });
  }

  /* ---------- surface to system ----------
     One story, two tellings. Desktop with a fine pointer gets the pinned,
     scrubbed sequence. Everything else that allows motion gets a scroll driven
     telling of the same thing: the nodes arrive in order and the cobalt signal
     line draws between them. No JS and reduced motion get the static layout
     that ships in the HTML, complete and readable. */
  var stsRoot = document.querySelector("[data-sts-root]");
  if (stsRoot) {
    var stsNodeList = stsRoot.querySelector(".node-list");
    var stsDiagram = stsRoot.querySelector(".diagram");

    /* the drawn signal line, built in JS so the static rendering keeps the
       plain CSS connectors it already ships with */
    var buildLine = function () {
      if (!stsNodeList || !stsDiagram) return null;
      var nodes = toArray(stsNodeList.querySelectorAll(".node"));
      if (nodes.length < 2) return null;
      var NS = "http://www.w3.org/2000/svg";
      var svg = document.createElementNS(NS, "svg");
      svg.setAttribute("aria-hidden", "true");
      svg.setAttribute("focusable", "false");
      svg.setAttribute("preserveAspectRatio", "none");
      svg.style.cssText = "position:absolute;left:0;top:0;width:100%;height:100%;overflow:visible;pointer-events:none;";
      var mk = function () {
        var p = document.createElementNS(NS, "path");
        p.setAttribute("pathLength", "1");
        p.setAttribute("fill", "none");
        p.setAttribute("stroke-linecap", "butt");
        p.setAttribute("stroke-linejoin", "round");
        p.setAttribute("vector-effect", "non-scaling-stroke");
        p.style.stroke = "var(--accent-cobalt)";
        p.style.strokeWidth = "1.5";
        p.style.strokeDasharray = "1";
        p.style.strokeDashoffset = "1";
        svg.appendChild(p);
        return p;
      };
      /* one drawable segment per gap, so the line lives strictly between the
         node boxes and never runs across one */
      var segs = nodes.slice(1).map(mk);
      var loop = mk();
      var measure = function () {
        var w = stsNodeList.offsetWidth || 1;
        var h = stsNodeList.offsetHeight || 1;
        svg.setAttribute("viewBox", "0 0 " + w + " " + h);
        var x = 28.75;                                   /* matches the static connector gutter */
        segs.forEach(function (seg, i) {
          var from = nodes[i].offsetTop + nodes[i].offsetHeight;
          var to = nodes[i + 1].offsetTop;
          seg.setAttribute("d", "M" + x + " " + from + " L" + x + " " + to);
        });
        /* the return loop: out of the last node, up the gutter, back into the first */
        var first = nodes[0];
        var last = nodes[nodes.length - 1];
        var lx = -11;
        var bot = last.offsetTop + last.offsetHeight + 8;
        var top = first.offsetTop - 8;
        var r = 6;
        loop.setAttribute("d",
          "M" + x + " " + (last.offsetTop + last.offsetHeight) +
          " L" + x + " " + (bot - r) +
          " Q" + x + " " + bot + " " + (x - r) + " " + bot +
          " L" + (lx + r) + " " + bot +
          " Q" + lx + " " + bot + " " + lx + " " + (bot - r) +
          " L" + lx + " " + (top + r) +
          " Q" + lx + " " + top + " " + (lx + r) + " " + top +
          " L" + (x - r) + " " + top +
          " Q" + x + " " + top + " " + x + " " + (top + r) +
          " L" + x + " " + first.offsetTop);
      };
      measure();
      stsNodeList.insertBefore(svg, stsNodeList.firstChild);
      stsDiagram.setAttribute("data-sts-line", "js");
      ScrollTrigger.addEventListener("refreshInit", measure);
      return {
        segs: segs,
        loop: loop,
        all: segs.concat([loop]),
        destroy: function () {
          ScrollTrigger.removeEventListener("refreshInit", measure);
          stsDiagram.removeAttribute("data-sts-line");
          if (svg.parentNode) svg.parentNode.removeChild(svg);
        }
      };
    };

    var mm = gsap.matchMedia();
    mm.add({
      pinned: "(min-width: 1024px) and (min-height: 640px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
      flowing: "(prefers-reduced-motion: no-preference)"
    }, function (ctx) {
      var cond = ctx.conditions || {};
      var stage = stsRoot.querySelector(".sts-stage");
      var fig = stsRoot.querySelector(".sts-surface-fig");
      var surfLabel = stsRoot.querySelector("[data-sts-label-surface]");
      var sysBlock = stsRoot.querySelector(".sts-system-block");
      var sysLabel = stsRoot.querySelector("[data-sts-label-system]");
      var nodes = stsRoot.querySelectorAll(".node");
      var tags = stsRoot.querySelectorAll(".node .tag");
      var disclaimer = stsRoot.querySelector(".disclaimer");
      var caps = stsRoot.querySelectorAll(".sts-caption-rail p");
      var line = null;
      var img = fig && fig.querySelector("img");
      var refresh = function () { ScrollTrigger.refresh(); };

      /* ---- desktop: the pinned, scrubbed sequence ---- */
      if (cond.pinned && stage && fig) {
        stsRoot.setAttribute("data-sts-mode", "pinned");
        line = buildLine();

        /* hidden states are applied here, client side only, and text animates
           with opacity so it stays in the accessibility tree */
        gsap.set(sysLabel, { opacity: 0 });
        gsap.set(surfLabel, { opacity: 0 });
        gsap.set(nodes, { opacity: 0, y: 16 });
        gsap.set(tags, { opacity: 0, y: 6 });
        gsap.set(disclaimer, { opacity: 0 });
        gsap.set(caps, { opacity: 0 });
        gsap.set(sysBlock, { opacity: 0 });

        /* recomputed on every refresh, so a resize can never leave the capture
           at a stale start scale */
        var sizeIn = function () {
          var stageW = stage.offsetWidth;
          var figW = fig.offsetWidth || 1;
          var s = Math.min(1.5, (stageW * 0.86) / figW);
          return { scale: s, x: (stageW - figW * s) / 2, y: 30 };
        };

        var tlp = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            id: "surface-to-system",
            trigger: stsRoot,
            start: "top top",
            end: "+=180%",
            pin: stsRoot.querySelector(".sts-pin-wrap"),
            pinSpacing: true,
            scrub: 0.75,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            /* the pin inserts about 1.8 viewports of spacer: it must refresh
               before every trigger that sits below it on the page */
            refreshPriority: 10,
            onToggle: function (self) { willChange(fig, self.isActive); }
          }
        });

        /* 100 units = 100% progress. Storyboard per docs/MOTION_SYSTEM.md 3.b:
           surface recedes, system named, honesty caption, nodes, signal line,
           automation tags, the loop closes, settle. */
        tlp.to(caps[0], { opacity: 1, duration: 3, ease: "power1.out" }, 0);
        tlp.fromTo(fig,
          {
            scale: function () { return sizeIn().scale; },
            x: function () { return sizeIn().x; },
            y: function () { return sizeIn().y; },
            transformOrigin: "left top"
          },
          { scale: 1, x: 0, y: 0, duration: 14, ease: "power1.inOut", immediateRender: true },
          4);
        tlp.to(surfLabel, { opacity: 1, duration: 3, ease: "power1.out" }, 13);
        tlp.to(sysBlock, { opacity: 1, duration: 4, ease: "power1.out" }, 16);
        tlp.to(sysLabel, { opacity: 1, duration: 3, ease: "power1.out" }, 18);
        tlp.to(disclaimer, { opacity: 1, duration: 4, ease: "power1.out" }, 20);
        tlp.to(caps[0], { opacity: 0, duration: 3 }, 15);
        tlp.to(caps[1], { opacity: 1, duration: 3, ease: "power1.out" }, 17);

        /* the defining move: the cobalt signal draws down through the workflow,
           reaching each node just as it rises */
        var nodeAt = [24, 33, 40, 47, 54];
        nodeAt.forEach(function (at, i) {
          if (nodes[i]) tlp.to(nodes[i], { opacity: 1, y: 0, duration: 6, ease: "power1.out" }, at);
        });
        if (line) {
          line.segs.forEach(function (seg, i) {
            tlp.to(seg, { strokeDashoffset: 0, duration: 5 }, nodeAt[i] + 4);
          });
        }
        tlp.to(caps[1], { opacity: 0, duration: 3 }, 30);
        tlp.to(caps[2], { opacity: 1, duration: 3, ease: "power1.out" }, 32);

        [62, 67, 72].forEach(function (at, i) {
          if (tags[i]) tlp.to(tags[i], { opacity: 1, y: 0, duration: 5, ease: "power1.out" }, at);
        });
        tlp.to(caps[2], { opacity: 0, duration: 3 }, 60);
        tlp.to(caps[3], { opacity: 1, duration: 3, ease: "power1.out" }, 62);

        /* the loop closes: the referral return draws back to the first node */
        if (line) tlp.to(line.loop, { strokeDashoffset: 0, duration: 12 }, 78);

        tlp.to(caps[3], { opacity: 0, duration: 3 }, 84);
        tlp.to(caps[4], { opacity: 1, duration: 3, ease: "power1.out" }, 86);
        tlp.to({}, { duration: 10 }, 90);   /* settle: the finished diagram stays readable */

        if (img && !img.complete) img.addEventListener("load", refresh, { once: true });

        return function () {
          stsRoot.removeAttribute("data-sts-mode");
          willChange(fig, false);
          if (img) img.removeEventListener("load", refresh);
          if (line) line.destroy();
        };
      }

      /* ---- phone and tablet: the same story, scroll driven, never pinned ---- */
      if (cond.flowing && stsNodeList) {
        stsRoot.setAttribute("data-sts-mode", "flow");
        line = buildLine();
        var below = function (el) { return el && el.getBoundingClientRect().top > vh() * 0.86; };

        if (below(surfLabel)) {
          gsap.fromTo(surfLabel, { opacity: 0, y: 6 }, {
            opacity: 1, y: 0, duration: 0.5, ease: "power2.out",
            scrollTrigger: { trigger: surfLabel, start: "top 90%", once: true }
          });
        }
        if (below(sysLabel)) {
          gsap.fromTo(sysLabel, { opacity: 0, y: 6 }, {
            opacity: 1, y: 0, duration: 0.5, ease: "power2.out",
            scrollTrigger: { trigger: sysLabel, start: "top 90%", once: true }
          });
        }

        /* the capture gets the same shutter reveal as every other plate */
        var stsFrame = fig && fig.querySelector(".plate-media");
        if (stsFrame && below(stsFrame) && preparePlate(stsFrame, fig)) {
          ScrollTrigger.create({
            trigger: stsFrame, start: "top 88%", once: true,
            onEnter: function () { playPlate(stsFrame, 0); }
          });
          driftPlate(stsFrame);
        }

        /* the honesty caption is never hidden here: it is already on screen
           before any workflow node can be */
        toArray(nodes).forEach(function (node, i) {
          if (!below(node)) return;
          var tag = node.querySelector(".tag");
          gsap.set(node, { opacity: 0, y: 14 });
          if (tag) gsap.set(tag, { opacity: 0 });
          var ntl = gsap.timeline({
            onStart: function () { willChange(node, true); },
            onComplete: function () { willChange(node, false); },
            scrollTrigger: { trigger: node, start: "top 88%", once: true }
          });
          ntl.to(node, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, 0);
          if (tag) ntl.to(tag, { opacity: 1, duration: 0.45, ease: "power1.out" }, 0.28);
        });

        if (line && stsNodeList.getBoundingClientRect().top <= vh() * 0.84) {
          /* deep link straight into the section: the diagram is already on
             screen, so the connector is simply there, fully drawn */
          gsap.set(line.all, { strokeDashoffset: 0 });
        } else if (line) {
          /* the connector draws from node to node as the list scrolls past */
          var lineTl = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: { trigger: stsNodeList, start: "top 80%", end: "bottom 68%", scrub: 0.5 }
          });
          line.segs.forEach(function (seg, i) {
            lineTl.to(seg, { strokeDashoffset: 0, duration: 1 }, i * 1.15);
          });
          lineTl.to(line.loop, { strokeDashoffset: 0, duration: 1.6 }, line.segs.length * 1.15);
        }

        if (img && !img.complete) img.addEventListener("load", refresh, { once: true });

        return function () {
          stsRoot.removeAttribute("data-sts-mode");
          if (img) img.removeEventListener("load", refresh);
          if (line) line.destroy();
        };
      }

      return function () {};
    });
  }

  /* ---------- keep start positions honest ----------
     Late arriving images and webfonts change the document height, which moves
     every trigger below them. One debounced refresh covers the lot. */
  var refreshTimer = null;
  var queueRefresh = function () {
    if (refreshTimer) clearTimeout(refreshTimer);
    refreshTimer = setTimeout(function () {
      refreshTimer = null;
      ScrollTrigger.refresh();
    }, 140);
  };
  toArray(document.images).forEach(function (im) {
    if (im.complete) return;
    im.addEventListener("load", queueRefresh, { once: true });
    im.addEventListener("error", queueRefresh, { once: true });
  });
  window.addEventListener("load", queueRefresh);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(queueRefresh);
})();

/* ---------- booking form (real submission via Netlify Forms) ----------
   Progressive enhancement: without JS the form is a plain POST with a
   typed-in preferred time. With JS it becomes a day/time picker that fills
   the same field, submits over fetch, and confirms in place. */
(function () {
  "use strict";
  var root = document.querySelector("[data-cal]");
  if (!root) return;
  var form = root.querySelector("[data-book-form]");
  var daysEl = root.querySelector("[data-cal-days]");
  var slotsEl = root.querySelector("[data-cal-slots]");
  var submit = root.querySelector("[data-cal-submit]");
  var slotField = root.querySelector("[data-slot-field]");
  var summary = root.querySelector("[data-cal-summary]");
  var status = root.querySelector("[data-form-status]");
  var tzField = root.querySelector("[data-tz-field]");
  var tzNote = root.querySelector("[data-tz-note]");
  if (!form || !daysEl || !slotsEl || !submit || !slotField) return;

  var DOW_S = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var DOW_L = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var MON_S = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var MON_L = ["January", "February", "March", "April", "May", "June", "July",
               "August", "September", "October", "November", "December"];
  var SLOTS = ["9:00 AM", "10:30 AM", "12:00 PM", "2:00 PM", "3:30 PM", "5:00 PM"];
  var picked = { day: null, slot: null };

  /* visitor timezone, recorded for John and surfaced when it isn't Pacific */
  var tz = "";
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (e) { tz = ""; }
  if (tzField) tzField.value = tz;
  if (tzNote && tz && tz !== "America/Los_Angeles") {
    tzNote.textContent = "Times shown in Pacific Time. Yours looks like " + tz.replace(/_/g, " ") + ".";
  }

  /* next 10 weekdays, starting tomorrow */
  var days = [];
  var d = new Date();
  d.setDate(d.getDate() + 1);
  while (days.length < 10) {
    if (d.getDay() !== 0 && d.getDay() !== 6) days.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }

  var shortLabel = function (day, slot) {
    return DOW_S[day.getDay()] + ", " + MON_S[day.getMonth()] + " " + day.getDate() + " at " + slot;
  };
  var fullLabel = function (day, slot) {
    return DOW_L[day.getDay()] + ", " + MON_L[day.getMonth()] + " " + day.getDate() +
           ", " + day.getFullYear() + " at " + slot + " Pacific";
  };

  var update = function () {
    var ready = !!(picked.day && picked.slot);
    submit.disabled = !ready;
    if (ready) {
      slotField.value = fullLabel(picked.day, picked.slot);
      if (summary) {
        summary.hidden = false;
        summary.innerHTML = "";
        summary.appendChild(document.createTextNode(shortLabel(picked.day, picked.slot)));
        var tzLine = document.createElement("span");
        tzLine.className = "tz";
        tzLine.textContent = "Pacific Time";
        summary.appendChild(tzLine);
      }
      submit.textContent = "Send request";
    } else {
      slotField.value = "";
      if (summary) summary.hidden = true;
      submit.textContent = picked.day ? "Pick a time" : "Pick a day and time";
    }
  };

  var pressGroup = function (container, sel, active) {
    container.querySelectorAll(sel).forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
    active.setAttribute("aria-pressed", "true");
  };

  days.forEach(function (day) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "cal-day";
    b.setAttribute("aria-pressed", "false");
    b.innerHTML = '<span class="dow">' + DOW_S[day.getDay()] + '</span><span class="dom">' + day.getDate() + "</span>";
    b.setAttribute("aria-label", DOW_L[day.getDay()] + " " + MON_L[day.getMonth()] + " " + day.getDate());
    b.addEventListener("click", function () {
      picked.day = day;
      pressGroup(daysEl, ".cal-day", b);
      update();
    });
    daysEl.appendChild(b);
  });

  SLOTS.forEach(function (slot) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "cal-slot";
    b.setAttribute("aria-pressed", "false");
    b.textContent = slot;
    b.addEventListener("click", function () {
      picked.slot = slot;
      pressGroup(slotsEl, ".cal-slot", b);
      update();
    });
    slotsEl.appendChild(b);
  });

  update();

  /* ---- submit by composing the email ----
     The site is hosted as static files with no form backend, so the request
     is handed to the visitor's own mail client with everything filled in.
     Honest by construction: the message only reaches John when they hit send,
     and the confirmation copy says exactly that. */
  var TO = "johnmontejano2@gmail.com";

  var composed = function (name, slotText, href) {
    var card = form.parentNode;
    var wrap = document.createElement("div");
    wrap.className = "book-sent";
    wrap.setAttribute("role", "status");
    wrap.innerHTML =
      '<span class="sent-mark" aria-hidden="true">' +
      '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M5 12.5 L10 17.5 L19 6.5" fill="none" stroke="#0047AB" stroke-width="2.2" stroke-linecap="square"/></svg>' +
      "</span>" +
      "<h2>Your email is ready.</h2>" +
      "<p>Thanks" + (name ? ", " + name : "") + ". Your mail app should have opened with the details filled in. " +
      "Hit send and it comes straight to me. I reply to confirm, usually the same day.</p>" +
      (slotText ? '<p class="sent-slot">' + slotText + "</p>" : "") +
      /* not every device has a mail handler, so the same prefilled message is
         one click away rather than lost */
      '<p>Nothing opened? <a class="link-tertiary" data-cal-fallback href="' + href +
      '">Open the message again</a>, or write to ' +
      '<a class="link-tertiary" href="mailto:' + TO + '">' + TO + "</a>.</p>";
    card.replaceChild(wrap, form);
    wrap.setAttribute("tabindex", "-1");
    wrap.focus();
  };

  form.addEventListener("submit", function (e) {
    if (!picked.day || !picked.slot) {
      /* the field is hidden under JS, so guard it here rather than with :required */
      e.preventDefault();
      if (status) { status.textContent = "Pick a day and a time first."; status.setAttribute("data-state", "error"); }
      daysEl.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }
    if (!form.checkValidity()) return;   /* let the browser show its own messages */

    e.preventDefault();
    var fd = new FormData(form);
    var val = function (k) { return (fd.get(k) || "").toString().trim(); };
    var name = val("name");
    var first = name.split(" ")[0];
    var slotText = val("requested-slot");

    var lines = [
      "Requested time: " + (slotText || "(not specified)"),
      "Name: " + name,
      "Email: " + val("email")
    ];
    if (val("business")) lines.push("Business: " + val("business"));
    if (val("context")) lines.push("", "What eats the most time right now:", val("context"));
    if (val("timezone")) lines.push("", "(Visitor timezone: " + val("timezone") + ")");

    var subject = "Workflow assessment request" + (slotText ? ": " + slotText : "");
    var href = "mailto:" + TO +
               "?subject=" + encodeURIComponent(subject) +
               "&body=" + encodeURIComponent(lines.join("\n") + "\n");

    if (status) { status.textContent = "Opening your email app"; status.setAttribute("data-state", "sending"); }
    window.location.href = href;
    composed(first, slotText, href);
  });
})();
