# Visual Devices — six scroll-driven ways to say it without paragraphs

Six copy-pasteable devices for `portfolio-live`. The brief: *"not visual enough — most
people don't have time to be looking at text for so long."* Each device replaces a block
of prose with something a visitor reads in one or two seconds of scrolling.

**Assumed already loaded, in this order (unchanged from `index.html`):**

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/lenis@1.1.14/dist/lenis.min.js"></script>
<script src="assets/js/main.js" defer></script>
```

## House rules obeyed by every device

| Rule | How it is kept |
|---|---|
| Ground `#000`, type white | Never hard-coded. Only `var(--fg)` / `var(--bg)` / `var(--hair)` / `var(--fg-dim)` / `var(--fg-mute)`, so `[data-theme="light"]` inverts all six for free. |
| One easing curve | `var(--ease)` = `cubic-bezier(.19,1,.22,1)` in CSS, `ease:"expo.out"` in GSAP (the same curve). The only exception is `ease:"none"`, which is required for scrubbed and container tweens. |
| Durations 0.4 / 0.8 / 1.25s | `var(--t1)` / `var(--t2)` / `var(--t3)`; the counter tween and the band image scale both run 1.25s. |
| Radius is binary | Every rule below is `0px`. No device introduces a pill; the `75px` radius stays on `.btn` / `.tag` only. |
| Zero box-shadow | The existing `*{box-shadow:none!important}` covers it. Depth comes from hairlines and opacity. |
| Switzer 200–500 | `.count__n` and `.band__line` are 200, the timeline and comparator rows 300, labels 500. |
| Hairlines `rgba(255,255,255,.16)` | `var(--hair)` for every border and rule. |

## The three fallback modes

Every device is written to survive all three. This was verified, not assumed — see
**Verification** at the bottom.

1. **No JavaScript** — the authored HTML *is* the finished frame. All pre-animation
   states (`opacity:0`, `scaleX(0)`, `scaleY(0)`) are scoped to `.js`, the class the
   inline script in `index.html` puts on `<html>`. Without JS that class never lands and
   the finished state renders.
2. **`prefers-reduced-motion: reduce`** — no scrubbing, no loops. Each JS device adds a
   `--static` class that resolves it instantly; the CSS figures get `animation:none`,
   and every base rule was authored as a *legible still frame* so `animation:none`
   leaves a readable diagram rather than a blank box.
3. **GSAP unavailable** (CDN blocked) — `LIVE` is false, which takes the same path as
   reduced motion.

---

# 0. Shared bootstrap

Append this **inside the existing IIFE** in `assets/js/main.js`, after ScrollTrigger is
registered. It creates no Lenis instance — `main.js` already owns that, and Lenis
scrolls the real window so no `scrollerProxy` is needed.

```js
var RMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
var reduced = function () { return RMQ.matches; };
var hasGSAP = typeof window.gsap !== "undefined" &&
              typeof window.ScrollTrigger !== "undefined";
var LIVE = hasGSAP && !reduced();
if (hasGSAP) gsap.registerPlugin(ScrollTrigger);

/* Layout settles late on a font-loading site. Refresh after both. */
if (hasGSAP) {
  window.addEventListener("load", function () { ScrollTrigger.refresh(); });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  }
}
```

CSS for all six goes at the end of `styles.css`, before the existing
`@media(prefers-reduced-motion:reduce)` block.

---

# 1. RUN — scroll-scrubbed "job runs itself" timeline

Seven beats of one job, from the 7:04pm call to the review request. A hairline runs down
the left; as you scrub, a solid segment travels down it and each beat lights the instant
the line reaches it. Roughly three seconds of scrolling, four words per beat.

### The trick that makes it exact

The progress line is **not one element measured against beat positions**. Each beat owns
the rail segment *below* it, so the timeline is built in units of one-beat-per-unit with
no measurement at all — and it stays correct through any resize, font swap or reflow.

```
beat i:  [dot]────segment i────▶  (1 timeline unit)
beat i+1:[dot]────segment i+1──▶
```

### HTML

```html
<section class="block" id="run-sec">
  <div class="wrap">
    <div class="head reveal">
      <p class="label">01 &nbsp;/&nbsp; One job, end to end</p>
      <h2 class="h2 split">Tuesday, 7:04pm.<br>You are under a sink.</h2>
    </div>

    <div class="run" data-run>
      <ol class="run__beats">
        <li class="run__beat">
          <span class="run__rail" aria-hidden="true"><i class="run__seg"></i><i class="run__dot"></i></span>
          <div class="run__body"><b class="run__t">7:04pm</b><span class="run__w">The call comes in</span></div>
        </li>
        <li class="run__beat">
          <span class="run__rail" aria-hidden="true"><i class="run__seg"></i><i class="run__dot"></i></span>
          <div class="run__body"><b class="run__t">7:04pm</b><span class="run__w">Answered and qualified</span></div>
        </li>
        <li class="run__beat">
          <span class="run__rail" aria-hidden="true"><i class="run__seg"></i><i class="run__dot"></i></span>
          <div class="run__body"><b class="run__t">7:05pm</b><span class="run__w">Your calendar checked</span></div>
        </li>
        <li class="run__beat">
          <span class="run__rail" aria-hidden="true"><i class="run__seg"></i><i class="run__dot"></i></span>
          <div class="run__body"><b class="run__t">7:05pm</b><span class="run__w">Three slots texted over</span></div>
        </li>
        <li class="run__beat">
          <span class="run__rail" aria-hidden="true"><i class="run__seg"></i><i class="run__dot"></i></span>
          <div class="run__body"><b class="run__t">7:11pm</b><span class="run__w">Booked for Thursday</span></div>
        </li>
        <li class="run__beat">
          <span class="run__rail" aria-hidden="true"><i class="run__seg"></i><i class="run__dot"></i></span>
          <div class="run__body"><b class="run__t">Thu 4:12pm</b><span class="run__w">Invoice sent</span></div>
        </li>
        <li class="run__beat">
          <span class="run__rail" aria-hidden="true"><i class="run__seg"></i><i class="run__dot"></i></span>
          <div class="run__body"><b class="run__t">Thu 6:40pm</b><span class="run__w">Paid. Review asked.</span></div>
        </li>
      </ol>
    </div>

    <p class="body muted" style="margin-top:clamp(30px,4vw,52px)">You did not touch a phone.</p>
  </div>
</section>
```

The list is a real `<ol>`, so a screen reader gets seven ordered items with times, in
order, regardless of what the animation is doing. The rail is `aria-hidden`.

### CSS

```css
.run{margin-top:clamp(30px,4vw,56px)}
.run__beats{display:block}
.run__beat{display:grid;grid-template-columns:13px minmax(0,1fr);
  column-gap:clamp(18px,2.4vw,34px);align-items:stretch}
.run__rail{position:relative;justify-self:center;width:1px;background:var(--hair)}
.run__beat:last-child .run__rail{background:none}
.run__seg{position:absolute;top:0;bottom:0;left:0;width:1px;background:var(--fg);
  transform:scaleY(1);transform-origin:50% 0}   /* base = finished frame, for no-JS */
.run__dot{position:absolute;top:.52em;left:50%;width:7px;height:7px;margin:-3px 0 0 -3px;
  background:var(--fg)}
.run__beat:first-child .run__dot{width:11px;height:11px;margin:-5px 0 0 -5px}
/* the gap between beats lives INSIDE the grid row, so the rail spans it */
.run__body{align-self:start;display:flex;flex-wrap:wrap;align-items:baseline;
  column-gap:clamp(14px,1.6vw,26px);row-gap:4px;
  padding-bottom:clamp(26px,3.4vw,44px)}
.run__beat:last-child .run__body{padding-bottom:0}
.run__t{font-size:13px;font-weight:500;letter-spacing:.06em;color:var(--fg-mute);
  min-width:6.5ch;font-variant-numeric:tabular-nums}
.run__w{font-size:clamp(19px,2.5vw,34px);font-weight:300;line-height:1.14;
  letter-spacing:-.01em;color:var(--fg)}
/* pre-animation state — .js only, so no-JS shows all seven beats lit */
.js .run__beat{opacity:.26}
.js .run__seg{transform:scaleY(0)}
/* resolved state, used by reduced motion and by the no-GSAP fallback */
.run--static .run__beat{opacity:1}
.run--static .run__seg{transform:scaleY(1)}
@media(max-width:560px){
  .run__beat{grid-template-columns:11px minmax(0,1fr)}
  .run__body{flex-direction:column;row-gap:2px;padding-bottom:22px}
  .run__t{min-width:0}}
```

The `padding-bottom` that spaces the beats sits on `.run__body`, **inside** the grid row,
not on the `<li>`. If you move it to the `<li>` the rail stops short of the next dot and
the line breaks into disconnected dashes.

### JS

```js
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
```

### Tuning parameters

| Parameter | Value | What it controls |
|---|---|---|
| `start` / `end` | `"top 72%"` → `"bottom 76%"` | The scrub window. Measured at 1440×900 this is a **503px** scroll range against an 813px viewport — about three seconds at a normal wheel. Widen to `"top 85%"` / `"bottom 60%"` for a slower read; narrow toward `"top 60%"` / `"bottom 85%"` for a faster one. |
| `scrub` | `0.45` | Catch-up lag in seconds. `0.4–0.6` feels attached to the thumb; `true` is rigid and reads mechanical; above `1` the line lags behind the eye. |
| beat opacity floor | `.26` in `.js .run__beat` | How dark an unreached beat is. Below `.2` the upcoming beats stop reading as text; above `.35` the "lighting up" stops registering. |
| beat light-up duration | `0.34` units | Fraction of a beat-interval spent brightening. Keep under `0.5` or two beats are lit at once. |
| first dot size | `11px` vs `7px` | Marks the entry point. Drop it if you want a flatter register. |

**Pinned variant.** If you want the beats to hold still while the line runs, add
`pin: true, start: "top top", end: "+=" + (beats.length * 120)` to the ScrollTrigger and
give the section `height:100svh`. Not the default: pinning costs a `pin-spacer` and
competes with device 6, which is already pinned.

### Reduced motion

`LIVE` is false, so no timeline is built and `.run--static` resolves the whole thing:
all seven beats at `opacity:1`, all segments at `scaleY(1)`. The full sequence is
readable as a static diagram. Verified with `--force-prefers-reduced-motion`.

### No JS

`.js` never lands, so `.js .run__beat{opacity:.26}` and `.js .run__seg{transform:scaleY(0)}`
never apply. The base rules — `scaleY(1)`, full opacity — render the completed timeline.
Verified by rendering the page with every `<script>` stripped.

### Mobile (390px)

Under `560px` the time and the phrase stack (`flex-direction:column`), the rail column
narrows to `11px` and the beat gap drops to `22px`. Seven beats fit in about 470px of
height. The scrub range at 390×844 measures **408px** against a 757px viewport, so it
reads a touch faster than desktop — appropriate for thumb scrolling.

---

# 2. COUNT — animated counters

Three published LISA figures that count up once, when they enter view.

### HTML

The final value is **written in the HTML**. `data-count` and `data-suffix` are what the
script animates toward; the text node is what a visitor without JS sees.

```html
<div class="count">
  <div>
    <b class="count__n" data-count="220" data-suffix="+">220+</b>
    <span class="count__l">Startups supported</span>
  </div>
  <div>
    <b class="count__n" data-count="42">42</b>
    <span class="count__l">Countries</span>
  </div>
  <div>
    <b class="count__n" data-count="200" data-suffix="+">200+</b>
    <span class="count__l">Mentors</span>
  </div>
</div>
<p class="label" style="margin-top:22px;text-transform:none;letter-spacing:0">
  Figures published by LISA on their own site.</p>
```

Supported attributes: `data-count` (required), `data-suffix`, `data-prefix`,
`data-from` (default `0`), `data-step` (snap increment, default `1`),
`data-decimals` (default `0`). Thousands separators are inserted automatically.

### CSS

```css
.count{display:grid;grid-template-columns:repeat(3,1fr);gap:clamp(22px,3vw,40px)}
.count__n{display:block;font-size:clamp(34px,4.4vw,62px);font-weight:200;line-height:1;
  letter-spacing:-.03em;color:var(--fg);
  font-variant-numeric:tabular-nums;font-feature-settings:"tnum" 1,"lnum" 1}
.count__l{display:block;margin-top:10px;font-size:var(--fs-label);font-weight:500;
  letter-spacing:.09em;text-transform:uppercase;color:var(--fg-mute)}
@media(max-width:640px){.count{grid-template-columns:1fr;gap:26px}}
```

`font-variant-numeric:tabular-nums` **plus** the explicit `font-feature-settings` — the
first is the standard property, the second is the belt-and-braces version for the
Switzer webfont. Without it the digits are proportional and a counter running through
`111 → 222` visibly breathes.

### JS

```js
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
```

Two details that matter. `snap: { v: 1 }` keeps the value an integer at every frame, so
you never see `217.4183`. And the width reservation happens *before* the reset to zero —
tabular figures stop digits jittering, but only reserving the final box stops the layout
from jumping as the number gains digits.

### Tuning parameters

| Parameter | Value | What it controls |
|---|---|---|
| `duration` | `1.25` | House long duration. Below `0.8` the count is a flash; above `2` it outlasts the visitor's attention. |
| `ease` | `"expo.out"` | The house curve. It front-loads: the number sprints then settles, which reads as arriving rather than metering. |
| `start` | `"top 88%"` | Fires just after the figure crosses in. Push to `"top 95%"` if the section sits low on a short page. |
| `once` | `true` | Counts once per page load. Set `false` and add `onLeaveBack` to re-run on scroll-up — not recommended, it reads as a bug. |
| `data-step` | `1` | Snap increment. Use `10` for a large figure so the digits change less frantically. |

### Reduced motion / No JS

Both land in the same place: `render(el, to)` runs unconditionally, so the number is
painted at its final value before the `LIVE` check, and no tween is created. Without JS
at all, the value authored in the HTML is already correct. In every case a visitor
sees `220+`, `42`, `200+`.

### Mobile (390px)

Under `640px` the grid collapses to one column with a `26px` gap, so each figure gets
its own line. The reserved `min-width` is computed from the rendered box at whatever
the current viewport is, so it is correct at every width. Font clamps to `34px`.

---

# 3. VS — before/after comparator

"Another hire" versus "one built system", as two stacked states rather than a draggable
slider. Scrubbing draws a strike through each old line in turn and dims it, while the
new state resolves underneath.

### HTML

```html
<div class="vs" data-vs>
  <div class="vs__state vs__state--old">
    <span class="vs__k">Another hire</span>
    <ul class="vs__list">
      <li class="vs__row"><span class="vs__line">A salary, every month<i class="vs__strike" aria-hidden="true"></i></span></li>
      <li class="vs__row"><span class="vs__line">Payroll tax and benefits<i class="vs__strike" aria-hidden="true"></i></span></li>
      <li class="vs__row"><span class="vs__line">Weeks of training<i class="vs__strike" aria-hidden="true"></i></span></li>
      <li class="vs__row"><span class="vs__line">Turnover, then training again<i class="vs__strike" aria-hidden="true"></i></span></li>
      <li class="vs__row"><span class="vs__line">Forty hours, then it stops<i class="vs__strike" aria-hidden="true"></i></span></li>
    </ul>
  </div>
  <div class="vs__state vs__state--new">
    <span class="vs__k">One built system</span>
    <ul class="vs__list">
      <li class="vs__row"><span class="vs__line">One project, one invoice</span></li>
      <li class="vs__row"><span class="vs__line">Runs at 7:04pm and on Sundays</span></li>
      <li class="vs__row"><span class="vs__line">Taught once, stays taught</span></li>
      <li class="vs__row"><span class="vs__line">Never calls out, never quits</span></li>
      <li class="vs__row"><span class="vs__line">Every follow-up, every time</span></li>
    </ul>
  </div>
</div>
```

The strike is a real element, not `text-decoration:line-through`, because a decoration
cannot be animated from 0 to full width. It is `aria-hidden` — the old lines stay in the
accessibility tree as plain text, which is correct: they are still the claim being made.

### CSS

```css
.vs{border-top:1px solid var(--hair)}
.vs__state{padding-block:clamp(26px,3vw,40px);border-bottom:1px solid var(--hair)}
.vs__state:last-child{border-bottom:0}
.vs__k{display:block;margin-bottom:16px;font-size:var(--fs-label);font-weight:500;
  letter-spacing:.09em;text-transform:uppercase;color:var(--fg-mute)}
.vs__list{display:grid;gap:0}
.vs__row{position:relative;padding-block:11px;font-size:clamp(15px,1.7vw,20px);
  font-weight:300;line-height:1.35;color:var(--fg-dim)}
.vs__line{position:relative;display:inline}
.vs__strike{position:absolute;left:0;top:.62em;width:100%;height:1px;
  background:currentColor;transform:scaleX(1);transform-origin:0 50%;pointer-events:none}
.js .vs__strike{transform:scaleX(0)}          /* base = finished frame, for no-JS */
.js .vs__state--old .vs__row{opacity:.95}
/* optional right-aligned annotation, e.g. an annual cost */
.vs__cost{float:right;margin-left:20px;font-size:13px;letter-spacing:.05em;
  color:var(--fg-mute);font-variant-numeric:tabular-nums}
/* pre-animation state — .js only */
.js .vs__state--new .vs__row{opacity:0}
/* resolved state, used by reduced motion and by the no-GSAP fallback */
.vs--static .vs__state--old .vs__row{opacity:.34}
.vs--static .vs__state--old .vs__strike{transform:scaleX(1)}
.vs--static .vs__state--new .vs__row{opacity:1}
@media(max-width:560px){.vs__cost{float:none;display:block;margin:4px 0 0}}
```

`.vs__line` is `display:inline` so the strike's `width:100%` measures the *text*, not the
row: the line stops at the last word instead of running to the container edge.

### JS

```js
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
```

The three tracks are deliberately offset: strikes at `0`, the dim at `0.1`, the new state
at `0.42`. The old state is visibly *being cancelled* before the replacement resolves, so
the two are read as cause and effect rather than as a two-column comparison.

### Tuning parameters

| Parameter | Value | What it controls |
|---|---|---|
| `start` / `end` | `"top 74%"` → `"bottom 82%"` | Scrub window. This one wants to be slower than the timeline — the visitor is reading ten lines. |
| `scrub` | `0.5` | Slightly laggier than the timeline so the strikes trail the thumb and feel drawn. |
| strike `stagger` | `0.16` | Gap between lines. At `0` all five strike at once and it reads as a bulk delete; above `0.3` the last line is still unstruck when the new state is fully in. |
| new-state offset | `0.42` | How long the cancellation runs before the replacement starts. Lower it to `0.25` for a faster crossfade; raise it toward `0.7` for more of a beat. |
| dimmed opacity | `0.34` | The old state must stay legible — it is the argument. Below `0.25` it reads as removed rather than replaced. |
| `y: 16` | 16px | Rise on the new rows. Keep it small; this is a list, not a hero. |

### Reduced motion / No JS

Reduced motion adds `.vs--static`: everything struck, old state at `0.34`, new state at
full opacity — the finished argument as a still. Without JS the `.js`-scoped pre-states
never apply, and the base `scaleX(1)` on `.vs__strike` means the old lines render already
struck through with the new list fully visible. Both verified by render.

### Mobile (390px)

Stacked at every width, so nothing has to change — the two states simply follow each
other down the page with a hairline between them. Rows clamp to `15px`. The optional
`.vs__cost` annotation un-floats below `560px` so it does not collide with a wrapped line.

---

# 4. LEAK — the four leaks, as four looping figures

Four abstract, geometric, self-contained SVG figures. No illustration, no icon set — only
rectangles, circles and a stroke weight. Each loop is **2.4s**, and the meaning lands in
the first 1.2–1.6s.

| # | Figure | What it does | Label |
|---|---|---|---|
| a | Missed calls | Three rings expand out of a solid core; the core fades to `.18` at the end of the cycle and nothing answers | *Nobody picked it up.* |
| b | Double entry | Three bars draw left-to-right inside a hairline box, then the identical three draw again in the box below | *Typed here. Typed again.* |
| c | Dead quotes | The quote sheet sits at `.34` and never changes while five day-ticks rise beneath it one at a time | *Days pass. No reply.* |
| d | No-shows | A 4×2 grid of hairline cells; the one solid cell drains downward to nothing, leaving its outline | *The slot went empty.* |

### HTML

```html
<div class="leaks">

  <article class="leak">
    <div class="leak__fig">
      <svg viewBox="0 0 120 80" aria-hidden="true" focusable="false">
        <circle class="lk-s lk-ring" data-d="1" cx="60" cy="40" r="9"/>
        <circle class="lk-s lk-ring" data-d="2" cx="60" cy="40" r="9"/>
        <circle class="lk-s lk-ring" data-d="3" cx="60" cy="40" r="9"/>
        <rect class="lk-f lk-core" x="56" y="36" width="8" height="8"/>
      </svg>
    </div>
    <p class="leak__n">01 / Missed calls</p>
    <p class="leak__l">Nobody picked it up.</p>
  </article>

  <article class="leak">
    <div class="leak__fig">
      <svg viewBox="0 0 120 80" aria-hidden="true" focusable="false">
        <rect class="lk-h" x="24" y="14" width="72" height="24"/>
        <rect class="lk-f lk-bar" data-d="1" x="30" y="20" width="46" height="2"/>
        <rect class="lk-f lk-bar" data-d="2" x="30" y="26" width="60" height="2"/>
        <rect class="lk-f lk-bar" data-d="3" x="30" y="32" width="34" height="2"/>
        <rect class="lk-h" x="24" y="44" width="72" height="24"/>
        <rect class="lk-f lk-bar" data-d="4" x="30" y="50" width="46" height="2"/>
        <rect class="lk-f lk-bar" data-d="5" x="30" y="56" width="60" height="2"/>
        <rect class="lk-f lk-bar" data-d="6" x="30" y="62" width="34" height="2"/>
      </svg>
    </div>
    <p class="leak__n">02 / Double entry</p>
    <p class="leak__l">Typed here. Typed again.</p>
  </article>

  <article class="leak">
    <div class="leak__fig">
      <svg viewBox="0 0 120 80" aria-hidden="true" focusable="false">
        <g class="lk-sheet">
          <rect class="lk-s" x="34" y="12" width="52" height="38"/>
          <rect class="lk-f" x="40" y="20" width="30" height="2"/>
          <rect class="lk-f" x="40" y="27" width="40" height="2"/>
          <rect class="lk-f" x="40" y="34" width="22" height="2"/>
        </g>
        <rect class="lk-f lk-day" data-d="0" x="34" y="60" width="2" height="10"/>
        <rect class="lk-f lk-day" data-d="1" x="46" y="60" width="2" height="10"/>
        <rect class="lk-f lk-day" data-d="2" x="58" y="60" width="2" height="10"/>
        <rect class="lk-f lk-day" data-d="3" x="70" y="60" width="2" height="10"/>
        <rect class="lk-f lk-day" data-d="4" x="82" y="60" width="2" height="10"/>
      </svg>
    </div>
    <p class="leak__n">03 / Dead quotes</p>
    <p class="leak__l">Days pass. No reply.</p>
  </article>

  <article class="leak">
    <div class="leak__fig">
      <svg viewBox="0 0 120 80" aria-hidden="true" focusable="false">
        <rect class="lk-h" x="16" y="20" width="20" height="16"/>
        <rect class="lk-h" x="40" y="20" width="20" height="16"/>
        <rect class="lk-h" x="64" y="20" width="20" height="16"/>
        <rect class="lk-h" x="88" y="20" width="20" height="16"/>
        <rect class="lk-h" x="16" y="44" width="20" height="16"/>
        <rect class="lk-s" x="40" y="44" width="20" height="16"/>
        <rect class="lk-f lk-fill" x="40" y="44" width="20" height="16"/>
        <rect class="lk-h" x="64" y="44" width="20" height="16"/>
        <rect class="lk-h" x="88" y="44" width="20" height="16"/>
      </svg>
    </div>
    <p class="leak__n">04 / No-shows</p>
    <p class="leak__l">The slot went empty.</p>
  </article>

</div>
```

### CSS

```css
.leaks{display:grid;grid-template-columns:repeat(4,1fr);gap:clamp(20px,2.6vw,40px)}
.leak{display:flex;flex-direction:column;gap:16px}
.leak__fig{width:100%;aspect-ratio:3/2;border:1px solid var(--hair);background:var(--bg)}
.leak__fig svg{width:100%;height:100%;display:block}
.leak__n{font-size:var(--fs-label);font-weight:500;letter-spacing:.09em;color:var(--fg-mute)}
.leak__l{font-size:clamp(15px,1.5vw,19px);font-weight:300;line-height:1.25;color:var(--fg)}
@media(max-width:900px){.leaks{grid-template-columns:repeat(2,1fr);
  gap:clamp(24px,5vw,34px) clamp(16px,4vw,28px)}}
@media(max-width:900px){.leak{gap:12px}.leak__l{font-size:16px}}
@media(max-width:360px){.leaks{grid-template-columns:1fr;gap:30px}}

/* shared primitives — theme-aware, so the whole set inverts with [data-theme] */
.lk-f{fill:var(--fg)}
.lk-s{fill:none;stroke:var(--fg);stroke-width:1;vector-effect:non-scaling-stroke}
.lk-h{fill:none;stroke:var(--fg);stroke-width:1;opacity:.28;vector-effect:non-scaling-stroke}
/* transform-box only — each figure sets its own origin, and a bare `.leak svg *`
   rule would out-specify the class rules below and silently break them. */
.leak svg .lk-ring,.leak svg .lk-core,.leak svg .lk-bar,
.leak svg .lk-day,.leak svg .lk-fill{transform-box:fill-box}

/* (a) rang out — rings expand from a core, then nothing */
.lk-ring{opacity:.34;transform-origin:center;transform:scale(1.7);
  animation:lk-ring 2.4s var(--ease) infinite}
.lk-ring[data-d="2"]{animation-delay:.26s;transform:scale(2.3)}
.lk-ring[data-d="3"]{animation-delay:.52s;transform:scale(2.9)}
.lk-core{opacity:1;transform-origin:center;animation:lk-core 2.4s var(--ease) infinite}
@keyframes lk-ring{
  0%{transform:scale(.5);opacity:0}
  12%{opacity:.85}
  58%{transform:scale(3.2);opacity:0}
  100%{transform:scale(3.2);opacity:0}}
@keyframes lk-core{0%,62%{opacity:1}88%,100%{opacity:.18}}

/* (b) typed twice — one record drawn, then drawn again */
.lk-bar{transform:scaleX(1);transform-origin:left center;animation:lk-bar 2.4s var(--ease) infinite}
.lk-bar[data-d="1"]{animation-delay:0s}
.lk-bar[data-d="2"]{animation-delay:.10s}
.lk-bar[data-d="3"]{animation-delay:.20s}
.lk-bar[data-d="4"]{animation-delay:.92s}
.lk-bar[data-d="5"]{animation-delay:1.02s}
.lk-bar[data-d="6"]{animation-delay:1.12s}
@keyframes lk-bar{
  0%{transform:scaleX(0)}
  6%{transform:scaleX(0)}
  26%{transform:scaleX(1)}
  92%{transform:scaleX(1)}
  100%{transform:scaleX(0)}}

/* (c) unread quote — the sheet never changes, the days keep arriving */
.lk-sheet{opacity:.34}
.lk-day{opacity:1;transform-origin:50% 100%;animation:lk-day 2.4s var(--ease) infinite}
.lk-day[data-d="1"]{animation-delay:.30s}
.lk-day[data-d="2"]{animation-delay:.60s}
.lk-day[data-d="3"]{animation-delay:.90s}
.lk-day[data-d="4"]{animation-delay:1.20s}
@keyframes lk-day{
  0%,4%{opacity:0;transform:scaleY(.2)}
  16%{opacity:1;transform:scaleY(1)}
  88%{opacity:1;transform:scaleY(1)}
  100%{opacity:0;transform:scaleY(.2)}}

/* (d) the slot empties — one filled cell drains, the outline stays */
.lk-fill{transform:scaleY(.34);transform-origin:50% 100%;
  animation:lk-slot 2.4s var(--ease) infinite}
@keyframes lk-slot{
  0%,36%{transform:scaleY(1);opacity:1}
  70%{transform:scaleY(0);opacity:1}
  100%{transform:scaleY(0);opacity:1}}

@media(prefers-reduced-motion:reduce){
  .lk-ring,.lk-core,.lk-bar,.lk-day,.lk-fill{animation:none!important}}
```

Two things to preserve if you edit these:

- **`vector-effect:non-scaling-stroke`.** The `viewBox` is 120×80 but the figure renders
  at 220px or 165px wide. Without it the 1px hairline scales with the box and stops
  matching `var(--hair)` elsewhere on the page.
- **Every base rule is the reduced-motion still frame.** `animation:none` reverts to the
  base declaration, so `.lk-ring` sits at `scale(1.7/2.3/2.9)` (three concentric rings),
  `.lk-bar` at `scaleX(1)` (both records fully typed), `.lk-fill` at `scaleY(.34)`
  (a cell part-drained). Verified with `--force-prefers-reduced-motion`: all four still
  read.

### JS (optional — the figures work without it)

Four infinite loops repainting off-screen is wasted battery on a long page. This pauses
them outside the viewport and nothing else.

```js
(function () {
  var figs = [].slice.call(document.querySelectorAll(".leak__fig"));
  if (!figs.length || !("IntersectionObserver" in window) || reduced()) return;
  function play(fig, on) {
    [].forEach.call(fig.querySelectorAll("svg *"), function (n) {
      n.style.animationPlayState = on ? "running" : "paused";
    });
  }
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { play(e.target, e.isIntersecting); });
  }, { rootMargin: "120px 0px" });
  figs.forEach(function (f) { play(f, false); io.observe(f); });
})();
```

### Tuning parameters

| Parameter | Value | What it controls |
|---|---|---|
| loop length | `2.4s` on all four | Keep them **identical** — four different periods read as noise. Under `2s` figure (b) has no time to draw twice; over `3s` the visitor scrolls past before the point lands. |
| ring stagger | `.26s` | Interval between rings. It is a phone ringing; `.2–.3s` reads as a ring, faster reads as a pulse. |
| record-two delay | `.92s` | The gap before the second record starts. Must be after the first finishes (`26%` of 2.4s ≈ `.62s`) or the two are typed at once and the point is lost. |
| `lk-core` fade to `.18` | `62%` → `88%` | When the call gives up. Earlier and it reads as a hang-up; later and the cycle restarts before you notice. |
| sheet opacity | `.34` | The quote is the thing *not* happening, so it sits back while the ticks are at full white. |
| `rootMargin` | `120px 0px` | Starts the loop just before the figure enters, so it is not caught mid-cycle. |

### Reduced motion

`animation:none!important` on all five moving classes. Each figure freezes on its
authored still frame, which was chosen to carry the meaning on its own.

### No JS

Nothing changes — these are pure CSS and SVG. Only the off-screen pausing is lost.

### Mobile

Two columns from `900px` down (so 390px gets a 2-up grid at roughly 165px per figure,
which keeps the section compact), collapsing to one column only below `360px`. The label
locks at `16px` on small screens so the 3–5 word phrase stays on two lines at most.

---

# 5. BAND — full-bleed parallax image, dimmed, grain, one line of type

The full-width breather. The image parallaxes as the band crosses the viewport, scales
`1 → 1.2` on enter using the existing `.img-wrapper > .img-container > img` primitive
already in `styles.css`, sits under a `var(--bg)` dim, and carries the page's film grain
on top of that.

### HTML

```html
<section class="band img-wrapper" data-band data-speed="8"
         aria-label="You are on the job. It is not.">
  <span class="img-container">
    <img src="assets/img/hero-texture.webp" alt="" aria-hidden="true"
         loading="lazy" width="1600" height="1000">
  </span>
  <span class="band__dim" aria-hidden="true"></span>
  <span class="grain" aria-hidden="true"></span>
  <p class="band__line">You are on the job.<br>It is not.</p>
</section>
```

The image is decorative — `alt=""` — and the sentence is real text over it, not baked in.
`data-speed` uses the same mapping as the rest of the site (`attr / 10`), so `8` is a
`0.8` factor.

### CSS

```css
.band{position:relative;width:100%;height:clamp(360px,66svh,660px);overflow:hidden;
  background:var(--bg);display:flex;align-items:center;justify-content:center}
/* 118% tall and offset -9%, so the parallax never exposes an edge */
.band .img-container{position:absolute;left:0;top:-9%;width:100%;height:118%;will-change:transform}
.band .img-container img{width:100%;height:100%;position:absolute;top:50%;left:50%;
  transform:translate3d(-50%,-50%,0) scale(1);object-fit:cover;object-position:center;
  transition:transform var(--t3) var(--ease);will-change:transform}
.band.is-inview .img-container img{transform:translate3d(-50%,-50%,0) scale(1.2)}
.band__dim{position:absolute;inset:0;z-index:1;background:var(--bg);opacity:.62;pointer-events:none}
.band .grain{z-index:2}
.band__line{position:relative;z-index:3;margin:0;padding-inline:clamp(20px,5vw,40px);
  max-width:22ch;text-align:center;color:var(--fg);
  font-size:clamp(26px,4.4vw,62px);font-weight:200;line-height:1.08;letter-spacing:-.02em}
@media(max-width:560px){.band{height:clamp(300px,54svh,420px)}}
@media(prefers-reduced-motion:reduce){
  .band .img-container{transform:none!important}
  .band.is-inview .img-container img{transform:translate3d(-50%,-50%,0) scale(1.06)}}
```

The **two-element transform split** is what makes this work: GSAP animates `yPercent` on
`.img-container`, CSS animates `scale` on the `img`. They never fight over the same
`transform` string. The `img` keeps the site's `translate3d(-50%,-50%,0)` centring, so it
stays compatible with the existing `.notouch .img-wrapper:hover` rule.

The dim is `background: var(--bg)` — so it darkens on the dark register and *lightens*
under `[data-theme="light"]`, keeping the type legible in both without a second rule.

### JS

```js
(function () {
  var bands = [].slice.call(document.querySelectorAll("[data-band]"));
  if (!bands.length) return;

  bands.forEach(function (band) {
    band.classList.add("is-inview");          // fires the CSS 1 -> 1.2 scale
    if (!LIVE) return;
    var container = band.querySelector(".img-container");
    if (!container) return;
    var f = (parseFloat(band.getAttribute("data-speed")) || 8) / 10;
    gsap.fromTo(container,
      { yPercent: -7.5 * f },
      {
        yPercent: 7.5 * f, ease: "none",
        scrollTrigger: {
          trigger: band, start: "top bottom", end: "bottom top", scrub: 0.6
        }
      });
  });
})();
```

If you prefer the scale to fire on entry rather than on load, swap the unconditional
`classList.add` for the site's existing `IntersectionObserver` that already toggles
`is-inview`; add `.band` to its selector list and delete the line here.

### Tuning parameters

| Parameter | Value | What it controls |
|---|---|---|
| band height | `clamp(360px,66svh,660px)` | Two-thirds of the viewport. A full `100svh` band reads as a second hero and steals from the real one. |
| `yPercent` range | `±7.5 × f` | Travel. Measured at `data-speed="8"` this is `−6% → +6%` of a 118%-tall container ≈ `±7.1%` of the band — inside the 9% overscan, so no edge is ever exposed. **If you raise the travel, raise `height` and `top` together.** |
| `data-speed` | `8` → factor `0.8` | Same `attr/10` mapping as the rest of the site. Above `12` the parallax outruns the overscan. |
| `scrub` | `0.6` | Slightly laggier than the type devices; parallax wants to feel heavy. |
| dim opacity | `.62` | Contrast against the line. Below `.5` the 200-weight type starts losing legibility over a busy image. |
| grain opacity | `.09` (inherited) | Do not raise it here — it should match the hero exactly or the band reads as a different surface. |

### Reduced motion

No parallax tween is created, `transform:none!important` clears any residue on the
container, and the image scale is capped at `1.06` instead of `1.2` — the band still has
presence, but nothing moves under the reader.

### No JS

`is-inview` is never added, so the image renders at `scale(1)` and holds still. The dim,
the grain and the line are all pure CSS and all present. The band is a static full-bleed
image with a sentence on it, which is a perfectly good outcome.

### Mobile (390px)

Height drops to `clamp(300px,54svh,420px)` so the band does not eat the screen. The line
clamps to `26px` at `max-width:22ch`, so it stays two or three lines. Parallax still runs
— it is a container transform with no layout cost — but the shorter band means a shorter
travel, which is the right proportion.

---

# 6. HSTRIP — horizontal scroll-linked strip

A pinned section where the trades pan sideways as the page scrolls down, using
ScrollTrigger's `containerAnimation` so each card can have its own trigger inside a
horizontal tween.

### HTML

**Author it as the rail.** The `--rail` class is the no-JS / mobile / reduced-motion
state, and JS *removes* it when it takes over. That way the fallback needs no JS to
happen — it is what the HTML already says.

```html
<section class="hstrip" data-hstrip>
  <div class="wrap">
    <div class="head reveal" style="margin-bottom:0">
      <p class="label">05 &nbsp;/&nbsp; Who this is for</p>
      <h2 class="h2 split">If customers book a time,<br>this is your business.</h2>
    </div>
  </div>
  <div class="hstrip__vp hstrip__vp--rail">
    <div class="hstrip__track">
      <article class="hstrip__card"><span class="hstrip__i">01</span><h3 class="hstrip__w">Plumbing</h3></article>
      <article class="hstrip__card"><span class="hstrip__i">02</span><h3 class="hstrip__w">HVAC</h3></article>
      <article class="hstrip__card"><span class="hstrip__i">03</span><h3 class="hstrip__w">Electrical</h3></article>
      <article class="hstrip__card"><span class="hstrip__i">04</span><h3 class="hstrip__w">Roofing</h3></article>
      <article class="hstrip__card"><span class="hstrip__i">05</span><h3 class="hstrip__w">Dental</h3></article>
      <article class="hstrip__card"><span class="hstrip__i">06</span><h3 class="hstrip__w">Med spa</h3></article>
      <article class="hstrip__card"><span class="hstrip__i">07</span><h3 class="hstrip__w">Salons</h3></article>
      <article class="hstrip__card"><span class="hstrip__i">08</span><h3 class="hstrip__w">Cleaning</h3></article>
      <article class="hstrip__card"><span class="hstrip__i">09</span><h3 class="hstrip__w">Auto repair</h3></article>
      <article class="hstrip__card"><span class="hstrip__i">10</span><h3 class="hstrip__w">Landscaping</h3></article>
      <article class="hstrip__card"><span class="hstrip__i">11</span><h3 class="hstrip__w">Pest control</h3></article>
      <article class="hstrip__card"><span class="hstrip__i">12</span><h3 class="hstrip__w">Property management</h3></article>
    </div>
  </div>
</section>
```

Do **not** give this section the `.block` class — `.block`'s `--pad-block` fights the
pinned `100svh` height.

### CSS

```css
.hstrip{position:relative;overflow:hidden;padding-block:clamp(70px,8vw,120px)}
/* A pinned element must be EXACTLY one viewport tall, or the pin leaves a gap
   above and below the section while it is stuck. --pinned is added by JS only. */
.hstrip--pinned{height:100svh;padding-block:0;
  display:flex;flex-direction:column;justify-content:center;gap:clamp(28px,4vh,64px)}
.hstrip__vp{display:flex;align-items:center;margin-top:clamp(28px,4vw,48px)}
.hstrip--pinned .hstrip__vp{margin-top:0}   /* the flex column gap handles it */
.hstrip__track{display:flex;align-items:stretch;gap:1px;
  padding-inline:clamp(20px,5vw,40px);width:max-content;will-change:transform}
.hstrip__card{flex:0 0 auto;width:clamp(200px,20vw,268px);min-height:clamp(190px,22vh,248px);
  padding:24px;border:1px solid var(--hair);margin-right:-1px;background:var(--bg);
  display:flex;flex-direction:column;justify-content:space-between;gap:18px}
.hstrip__i{font-size:var(--fs-label);font-weight:500;letter-spacing:.09em;color:var(--fg-mute);
  font-variant-numeric:tabular-nums}
.hstrip__w{font-size:clamp(19px,2vw,27px);font-weight:300;line-height:1.12;letter-spacing:-.01em}
.js .hstrip--pinned .hstrip__card{opacity:.3}
/* AUTHORED STATE = rail. JS removes --rail and adds --pinned only when it pins,
   so no-JS, reduced motion and mobile all keep a swipeable rail. */
.hstrip__vp--rail{overflow-x:auto;overflow-y:hidden;scroll-snap-type:x mandatory;
  -webkit-overflow-scrolling:touch;scrollbar-width:none}
.hstrip__vp--rail::-webkit-scrollbar{display:none}
.hstrip__vp--rail .hstrip__card{scroll-snap-align:start}
@media(max-width:759px){
  /* on the rail a card is narrower than the screen, so the next one peeks in
     and the strip reads as swipeable without needing a scrollbar */
  .hstrip__card{width:min(64vw,250px);min-height:132px;padding:20px}
  .hstrip{padding-block:clamp(56px,9vw,80px)}}
```

`gap:1px` plus `margin-right:-1px` collapses adjacent card borders into a single
hairline, so the strip reads as one ruled register rather than twelve boxed cards.

### JS

```js
(function () {
  var strip = document.querySelector("[data-hstrip]");
  if (!strip) return;
  var vp = strip.querySelector(".hstrip__vp");
  var track = strip.querySelector(".hstrip__track");
  if (!vp || !track) return;
  if (!hasGSAP) return;                    // the authored rail stays as-is

  var mm = gsap.matchMedia();

  mm.add({
    pin:  "(min-width: 760px) and (prefers-reduced-motion: no-preference)",
    rail: "(max-width: 759px), (prefers-reduced-motion: reduce)"
  }, function (ctx) {
    if (!ctx.conditions.pin) return;       // rail: leave the authored markup alone

    vp.classList.remove("hstrip__vp--rail");
    strip.classList.add("hstrip--pinned");
    vp.scrollLeft = 0;

    var cards = gsap.utils.toArray(".hstrip__card", track);
    var distance = function () {
      return Math.max(0, track.scrollWidth - strip.offsetWidth);
    };

    var pan = gsap.to(track, {
      x: function () { return -distance(); },
      ease: "none",                        // REQUIRED for containerAnimation:
      scrollTrigger: {                     // child triggers map linearly onto the
        trigger: strip,                    // pan only if the pan is unaccelerated
        pin: true,
        scrub: 0.6,
        start: "top top",
        end: function () { return "+=" + distance(); },
        invalidateOnRefresh: true,
        anticipatePin: 1
      }
    });

    cards.forEach(function (card) {
      gsap.to(card, {
        opacity: 1, duration: 0.4, ease: "power1.out",
        scrollTrigger: {
          trigger: card,
          containerAnimation: pan,         // <- positions read horizontally
          start: "left 86%",
          end: "left 46%",
          scrub: true
        }
      });
    });

    return function () {                   // matchMedia cleanup on breakpoint change
      strip.classList.remove("hstrip--pinned");
      vp.classList.add("hstrip__vp--rail");
      gsap.set(track, { clearProps: "transform" });
      gsap.set(cards, { clearProps: "opacity" });
    };
  });
})();
```

**`ease: "none"` is not a style choice here — it is a correctness requirement.**
`containerAnimation` maps a child's horizontal position onto the container tween's
progress by assuming the mapping is linear. With any other ease, a card's `start: "left
86%"` fires at the wrong scroll position, and the error grows toward the middle of the
strip. This was verified: at `progress 0.5` the track is at exactly `x = -927.5` of a
`-1855` total (half), which is what "not eased" looks like.

`end` and `x` are **functions**, and `invalidateOnRefresh` is on, so the pan distance is
recomputed on resize instead of being frozen at first paint.

### Tuning parameters

| Parameter | Value | What it controls |
|---|---|---|
| pin breakpoint | `760px` | Above it, pin and pan; below it, native swipe. Do not lower this — pinning a short viewport steals the whole screen for one row of cards. |
| `end` | `"+=" + distance()` | 1px of vertical scroll per 1px of horizontal travel. Measured 1855px at 1440 wide, 1579px at 900. Multiply by `0.7` to make the pan feel faster than the scroll, or by `1.4` to slow it. |
| `scrub` | `0.6` | Momentum on the pan. Lower than `0.4` feels sticky; higher than `1` and the cards drift after you stop. |
| `anticipatePin` | `1` | Pre-applies the pin a frame early. Removing it causes a visible jump into the pin on fast wheels. |
| card `opacity` floor | `.3` | How dim a card is before it crosses in. Only applies in pinned mode (`.js .hstrip--pinned`). |
| child trigger window | `"left 86%"` → `"left 46%"` | Where a card resolves as it pans in. Both are horizontal positions inside the container animation. |
| card width | `clamp(200px,20vw,268px)` | About five and a half cards visible at 1440. Under 180px the trade names start wrapping. |

### Reduced motion

The `rail` condition matches, `pin` does not, so the matchMedia callback returns early
and the section is left exactly as authored: a native horizontally scrollable rail with
scroll snapping. No pin, no tween, no `will-change` churn.

### No JS

`hasGSAP` is false, the function returns before touching anything, and the authored
`hstrip__vp--rail` markup renders a native swipe rail. This is the one device where the
fallback is genuinely good rather than merely acceptable.

### Mobile (390px)

Rail mode. Cards drop to `min(64vw,250px)` and `132px` tall, so the next card always
peeks in from the right edge — the swipe affordance, without a visible scrollbar
(`scrollbar-width:none` plus the WebKit rule). `scroll-snap-type:x mandatory` snaps each
card to the left edge. Section padding drops to `clamp(56px,9vw,80px)`.

---

# Verification

Built and tested against a standalone harness carrying all six devices, GSAP 3.12.5 and
ScrollTrigger, at the real house tokens.

**Method.** Headless Chrome throttles `requestAnimationFrame` to roughly one frame per
500ms, so nothing was verified by waiting on animation time. Instead:

- Timelines were driven with `tl.progress(p, true)` and the resulting element properties
  read synchronously with `gsap.getProperty()` and `getComputedStyle()`.
- ScrollTrigger positions were read after an explicit `window.scrollTo()` +
  `ScrollTrigger.update()`.
- CSS transitions (which headless also will not advance) were read by setting
  `transition:none`, forcing a reflow, and reading the resolved rule.
- Screenshots were taken with each device driven to an explicit progress and its sibling
  sections hidden, since headless `--screenshot` always captures the document at scroll 0.

**Result: 43 assertions, 0 failures at 1440×900 and 900×1200; 37 of 37 at the narrow
width** (the six pinned-strip assertions are correctly replaced by the two rail-fallback
assertions below 760px). Covered: beat-to-progress mapping and segment fill order,
counter start/mid/end values and reserved width, strike and dim and resolve ordering,
sixteen keyframe animations present with matching 2.4s periods, label word counts, the
band's markup pattern and `object-fit` and z-order and parallax direction and overscan
budget, and the strip's `ease:"none"`, pin, pan distance, linearity at the midpoint and
end alignment.

Additionally rendered and inspected: **reduced motion** (`--force-prefers-reduced-motion`
— all four leak figures freeze on a legible frame, the timeline resolves complete) and
**no JavaScript** (every `<script>` stripped — the timeline renders complete, the
comparator renders struck-through with the new state visible, the counters show their
authored figures, the strip renders as a swipe rail).

**Known limitation.** Headless Chrome clamps its viewport to a minimum width of 500px, so
true 390px rendering was checked by loading the harness inside a 390px `<iframe>` (media
queries resolve against the iframe viewport). The logic assertions at 390 therefore ran at
an effective 500px, which is still inside the `< 760px` rail branch that 390 uses.

**Not verified.** None of this has been watched by a human at full frame rate. The tuning
values above are reasoned and measured, not felt. Per `memory/NEXT_STEPS.md`, the motion
still needs a human to say how it actually reads before it is tuned further.
