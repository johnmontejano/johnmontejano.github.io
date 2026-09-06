# monopo.vn — Motion & Interaction Styling Catalogue

Reverse-engineered from the live site (Nuxt 2 SPA, all CSS injected as `<style>` blocks
by `vue-style-loader`, no external stylesheets). Captured by dumping the rendered DOM
with headless Chrome and re-formatting the 31 injected style blocks (~191 KB of CSS),
plus reading the app chunks for the GSAP timelines and shader code.

**Stack observed:** Vue/Nuxt 2 · GSAP 3.7.1 · locomotive-scroll 4.1.1 · three.js
(EffectComposer post-processing) · tiny-slider · Roobert + Raleway webfonts.

Selectors below keep monopo's `[data-v-xxxxxxxx]` scoped-CSS attributes only where they
matter for identification — ignore them when reimplementing. Every "Recipe" block is
original code written for this document, not copied from the site.

---

## 0. The motion system at a glance

### 0.1 Easing vocabulary

One curve dominates the entire site:

| Curve | Occurrences | Meaning |
|---|---|---|
| `cubic-bezier(.19, 1, .22, 1)` | **~70 declarations** | Expo out. The house curve. |
| `linear` | ~25 declarations | Only ever on `opacity`. |
| `cubic-bezier(1, 0, 0, 1)` | 3 declarations | Symmetric "snap" ease-in-out, for underline sweeps and the accordion. |
| `cubic-bezier(.16, .77, .33, .97)` | 1 | Background colour of the footer underline. |
| `cubic-bezier(.4, .2, .2, 1)` | 1 | Artist-modal social icons. |
| `ease-out` | 1 | Burger button (`transition: all .25s ease-out`). |

The JS side matches exactly: every GSAP tween uses `Expo.easeOut`, `Expo.easeInOut`, or
`Linear.easeNone` — nothing else. `cubic-bezier(.19,1,.22,1)` is the CSS approximation of
GSAP's `Expo.easeOut`, so **CSS and JS motion feel identical**. Anchor scrolling is the
one exception: `easing: [.87, 0, .13, 1]` over `850 ms`.

The rule of thumb the site follows:

> **Transforms get expo-out. Opacity gets linear. Never the reverse.**

That is why the compound value `transition: opacity .4s linear, transform .8s cubic-bezier(.19,1,.22,1)`
appears 11 times verbatim — it is the site's single most reused declaration.

### 0.2 Duration ladder

| Duration | Used for |
|---|---|
| `.2s` | opacity-only link fades |
| `.25s / .3s` | burger, scrollbar, small icon swaps |
| `.4s` | opacity in the compound reveal; icon nudges |
| `.5s` | button internals (arrow slide, pill fill, close-cross rotate) |
| `.6s` | circular buttons (border scale, arrow rotate); cursor colour |
| `.65s` | accordion height |
| `.75s` | back-button cluster; nav slide |
| **`.8s`** | **the default — image scale, card lift, generic transforms** |
| `.85s` | underline sweeps |
| `1s` | section-level `transform` on the strengths rows |
| `1.25s` | theme inversion (background / colour / fill / border) |
| `1.5s` | footer underline gradient |
| `2s / 2.5s` | hairline dividers scaling from 0 → full width |

### 0.3 Delay ladder

Stacked reveals use a fixed delay staircase, never a JS stagger:
`.1s` (×12, the container) → `.15s` (cursor children) → `.2s` (headings/paras) →
`.25s` (divider) → `.3s` → `.35s` (media column) → `.45s` (text column).

### 0.4 Global capability classes

Applied to `<html>` / `#app`, and used as ancestor guards everywhere:

- `.notouch` — added when `!device.touch`. **Every hover rule on the site is prefixed
  with it**, so touch devices never get a stuck `:hover`.
- `.mobile` / `.tablet` / `.tablet-large` / `.desktop` / `.small-height` — breakpoint
  classes at 768 / 1024 / 1280 px and `max-height: 749px`.
- `.white-bg` on `#app` — the inverted (light) theme, toggled by scroll position.
- `.sc-up` / `.sc-down` — scroll direction, recomputed on every scroll frame.
- `.has-scroll-smooth`, `.has-scroll-scrolling`, `.has-scroll-dragging` — locomotive.

### 0.5 Unit system

Every dimension is `vw`. Mobile values are authored against a 375 px frame
(`4.27vw` = 16 px) and desktop against a 1920 px frame (`.83vw` = 16 px), switched at
`@media (min-width: 1024px)`. Viewport height uses `height: calc(var(--vh, 1vh) * 100)`
with `--vh` written by JS to dodge mobile browser-chrome resize.

---

## 1. Custom cursor

### 1.1 The element

```html
<div class="dot-cursor"><img src="arrow.svg" alt=""><span></span></div>
```

**Base (mobile / touch):**
```css
.dot-cursor { display: none; overflow: hidden; }
```

**Desktop, non-touch only:**
```css
@media (min-width: 1024px) {
  .notouch .dot-cursor {
    opacity: 0;
    display: flex; justify-content: center; align-items: center;
    position: absolute; top: 50%; left: 50%;
    width: 10vw; height: 10vw;          /* 192px at 1920 */
    border-radius: 100%;
    background: #fff;
    z-index: 999;
    pointer-events: none;
    will-change: transform;
    transform: translate3d(-50%, -50%, 0) scaleX(1);
    transform-origin: center;
    transition: background .6s cubic-bezier(.19,1,.22,1), opacity .6s linear;
  }
  .white-bg .notouch .dot-cursor { background: #000; }
}
.white-bg .dot-cursor { background: #000 !important; }
```

**Children (both start collapsed to nothing):**
```css
.dot-cursor span {                    /* the word: "Play" / "Pause" / "Next Project" */
  position: absolute; top: calc(50% - .415vw); left: 50%;
  display: block; color: #000; opacity: 0;
  transform: translateZ(0) scale3d(0,0,0);
  transform-origin: center;
  transition: transform .8s cubic-bezier(.19,1,.22,1);
  transition-delay: .15s;
  font-size: .83vw; line-height: .99vw;   /* desktop */
}
@media (min-width: 1024px) {
  .dot-cursor img {                   /* the diagonal arrow */
    width: 1.77vw; height: 1.77vw;
    transform: scale3d(0,0,0);
    transform-origin: center;
    transition: transform .8s cubic-bezier(.19,1,.22,1);
    transition-delay: .15s;
  }
}
```

> **What the user sees:** a small white disc trails the pointer with a soft lag; over a
> project image it swells into a medium circle containing a 45°-rotated arrow, over the
> video it swells to full size and the word "Play" pops in, and the whole thing flips to
> black the moment the page turns white.

### 1.2 The mechanics (from the JS)

- **No `mix-blend-mode` anywhere on the site.** The white-on-dark / black-on-light
  contrast is achieved purely by the `.white-bg` class swap plus the `.6s` expo
  `background` transition.
- Base `scale` is **0.075** — so the resting dot is `10vw × 0.075 ≈ 0.75vw` (~14 px at
  1920). The element is always 10vw and is *scaled down*, which keeps the enlarged states
  crisp.
- Position is a **lerp at factor `0.15` per frame**, driven by a shared 60 fps rAF queue
  (`x += (mouseX - x) * 0.15`). The transform string written each frame is
  `translate3d(dx, dy, 0) scale3d(s, s, 1)`.
- Scale changes are **GSAP tweens on the component's `scale` data property**, base
  duration `0.6 s`, ease `Expo.easeOut`:

| Event | Target scale | Rendered size | Duration | Extra |
|---|---|---|---|---|
| idle / reset | `0.075` | ~14 px | `0.45s` (`.75 × .6`) | children scaled to 0 |
| hover project card | `0.75` | ~144 px | `0.45s` | `img` → `scale3d(1,1,1) rotate(-45deg)` |
| hover video | `1.0` | ~192 px | `0.6s` | `span` text = "Play" (or "Pause" if playing) |
| hover next-project | `1.0` | ~192 px | `0.45s` | `span` text = "Next Project" |
| hover a link | `0` | 0 | `0.45s` | element `opacity: 0` |
| leave window | — | — | — | `opacity: 0` |

- Any element carrying the attribute `hide-cursor` sets the cursor's opacity to 0 on
  `mousemove` over it.
- Hover targets hide the native cursor with `cursor: none`, not `cursor: pointer`:
  `.notouch .project-card-item .img-wrapper:hover`, `.video-banner .poster:hover`,
  `.notouch .next-project:hover`, `.notouch #case-study .btn-wrapper:hover .background`.
  Chrome/controls still use `cursor: pointer`; the video scrubber uses `cursor: ew-resize`;
  the locomotive scrollbar thumb uses `cursor: grab` / `grabbing`.

### 1.3 Secondary cursor — `.play-cursor`

A static, in-flow badge used on touch and inside the artist modal:
```css
.play-cursor {
  display: flex; justify-content: center; align-items: center;
  position: relative; border-radius: 50%;
  width: 36.8vw; height: 36.8vw;         /* 7.19vw ≥1024 */
  background: #fff; color: #fff; opacity: .8;
  pointer-events: none; z-index: 9999;
  transform-origin: center center;
  transition: background .3s linear, opacity .3s linear;
}
.notouch #artist-modal .video-illustration:hover .play-cursor { opacity: 0; }
```
It fades out on desktop hover so the real `.dot-cursor` can take over.

### 1.4 Recipe

```css
/* --- generic lerped dot cursor ------------------------------------ */
.cursor-dot {
  position: fixed; top: 0; left: 0;
  width: 180px; height: 180px;           /* authored large, scaled down */
  margin: -90px 0 0 -90px;
  display: grid; place-items: center;
  border-radius: 50%;
  background: var(--cursor-bg, #fff);
  pointer-events: none; z-index: 999;
  opacity: 0;
  will-change: transform;
  transform: translate3d(0,0,0) scale(.08);
  transition: background .6s cubic-bezier(.19,1,.22,1),
              opacity    .6s linear;
}
.cursor-dot__label,
.cursor-dot__icon {
  transform: scale(0);
  transform-origin: center;
  transition: transform .8s cubic-bezier(.19,1,.22,1) .15s;
}
.is-light-theme .cursor-dot { --cursor-bg: #000; }
[data-cursor="media"] { cursor: none; }
@media (hover: none), (max-width: 1023px) { .cursor-dot { display: none; } }
```
```js
// scale is animated, position is lerped — keep them on separate channels
const s = { x: innerWidth / 2, y: innerHeight / 2, mx: 0, my: 0, k: 0.08 };
addEventListener('mousemove', e => { s.mx = e.clientX; s.my = e.clientY; });
(function frame () {
  s.x += (s.mx - s.x) * 0.15;            // 0.15 = monopo's follow factor
  s.y += (s.my - s.y) * 0.15;
  el.style.transform = `translate3d(${s.x}px, ${s.y}px, 0) scale(${s.k})`;
  requestAnimationFrame(frame);
})();
// then tween s.k to 0.75 (card) or 1 (video) with an expo-out over 450–600 ms
```

---

## 2. Scroll-triggered reveal — `.is-inview`

The single most-used pattern on the site. locomotive-scroll adds `is-inview` to any
`[data-scroll]` element that enters the viewport; the CSS supplies both states.

### 2.1 The canonical pair

**From state** (verbatim, repeated on `.video-banner`, `.text-cta`, `#team .intro`,
`#case-study .project--details`, `#case-study .project--credits .grid`,
`.text-two-columns`, `.img-two-col`, `.img-illustration`, `.img-full-width`,
`.next-project`):
```css
.img-full-width {
  opacity: 0;
  transform: translate3d(0, 20%, 0);
  transition: opacity .4s linear,
              transform .8s cubic-bezier(.19,1,.22,1);
  transition-delay: .1s;
  will-change: transform, opacity;
}
```
**To state:**
```css
.img-full-width.is-inview {
  opacity: 1;
  transform: translateZ(0);
}
```

Two heavier variants exist:
```css
/* cards & team members: further travel, slower opacity */
.project-card-item .project-card-content,
.team-member {
  opacity: 0;
  transform: translate3d(0, 30%, 0);
  transition: opacity .8s linear, transform .8s cubic-bezier(.19,1,.22,1);
  will-change: transform, opacity;
}
/* strengths rows: 1s transform, staggered children */
#strengths section          { transition: opacity .5s linear, transform 1s cubic-bezier(.19,1,.22,1); transition-delay: .1s; }
#strengths section .content .video { transition: opacity .75s linear, transform 1s cubic-bezier(.19,1,.22,1); transition-delay: .35s; opacity: 0; transform: translate3d(0,40%,0); }
#strengths section .content .text  { transition: opacity .75s linear, transform 1s cubic-bezier(.19,1,.22,1); transition-delay: .45s; opacity: 0; transform: translate3d(0,40%,0); }
#strengths section.is-inview .content .video,
#strengths section.is-inview .content .text { opacity: 1; transform: translateZ(0); }
```

> **What the user sees:** blocks float up 20–40 % of their own height and fade in as
> they cross into view, with the media column arriving a beat before the copy.

### 2.2 The paired image scale-up

Images inside a revealing card do **not** start at 1 — they start at 1 and settle at 1.2
or 1.3, giving a slow "breathing in" push behind the card lift:
```css
.project-card-item .img-container img {
  transform: translate3d(-50%,-50%,0) scale(1);
  transition: transform .8s cubic-bezier(.19,1,.22,1);
  will-change: transform;
}
.project-card-item.is-inview .img-container img { transform: translate3d(-50%,-50%,0) scale(1.2); }
.team-member.is-inview     .img-container img { transform: translate3d(-50%,-50%,0) scale(1.3); }
```
Static hero images are simply parked at `scale(1.2)` (`.video-banner`, `.img-two-col`,
`.img-illustration`, `.img-full-width`, `.next-project`, `#case-study .project--thumbnail`)
so the `object-fit: cover` frame always has slack for parallax.

### 2.3 The hairline divider wipe

```css
#strengths section:before {
  content: ""; position: absolute; top: 0; left: 0;
  width: 100%; height: 1px; background: #fff; opacity: .25;
  transform: scaleX(0); transform-origin: 50% 50%;
  transition: transform 2s cubic-bezier(.19,1,.22,1);
  transition-delay: .25s;
  will-change: transform;
}
#strengths section.is-inview:before { transform: scaleX(1); }

#case-study .project--credits .grid + .grid:before {
  /* same idea, 2.5s, delay .3s */
  transition: transform 2.5s cubic-bezier(.19,1,.22,1);
  transition-delay: .3s;
}
```

> **What the user sees:** the thin rule between sections grows outward from its centre
> over a luxuriously slow two seconds, well after the content has settled.

### 2.4 Recipe

```css
/* one "from" class, one "to" class, everything else inherits */
[data-reveal] {
  opacity: 0;
  transform: translate3d(0, 20%, 0);
  transition: opacity .4s linear,
              transform .8s cubic-bezier(.19,1,.22,1);
  transition-delay: .1s;
  will-change: transform, opacity;
}
[data-reveal].is-inview { opacity: 1; transform: translateZ(0); }

[data-reveal] > .media img {                    /* paired image push */
  transform: translate(-50%,-50%) scale(1);
  transition: transform .8s cubic-bezier(.19,1,.22,1);
}
[data-reveal].is-inview > .media img { transform: translate(-50%,-50%) scale(1.2); }

[data-reveal] > .rule {                          /* hairline wipe */
  transform: scaleX(0); transform-origin: 50% 50%;
  transition: transform 2s cubic-bezier(.19,1,.22,1) .25s;
}
[data-reveal].is-inview > .rule { transform: scaleX(1); }

@media (prefers-reduced-motion: reduce) {
  [data-reveal], [data-reveal] * { transition-duration: 1ms !important; }
  [data-reveal] { opacity: 1; transform: none; }
}
```
```js
new IntersectionObserver((es, o) => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('is-inview'); o.unobserve(e.target); }
}), { rootMargin: '0px 0px -10% 0px' })
  .observe /* … each [data-reveal] */;
```

---

## 3. Text treatment

### 3.1 Hero sentence — two-part vertical mask swap

Structure (one `<li>` per sentence, only one carries `.active`):
```html
<li class="active">
  <div>
    <span class="container--word"><span class="part--first">hell<i>o</i></span></span>
    <span class="container--word"><span class="part--second">sa<i>i</i>g<i>o</i>n</span></span>
  </div>
</li>
```
```css
#home #intro-container .sentences        { position: absolute; top: 50%; left: 50%;
                                           transform: translate3d(-50%,-50%,0);
                                           width: 100%; opacity: 0; }
#home #intro-container .sentences ul     { position: relative; width: 100%;
                                           height: 5.21vw; font-size: 3.75vw;
                                           line-height: 5.21vw; }   /* fixed-height stage */
#home #intro-container .sentences ul li  { position: absolute; top: 0; left: 0;
                                           width: 100%; text-align: center; opacity: 0; }
#home .sentences ul li .container--word  { display: inline-block; position: relative;
                                           height: 100%; }
#home .sentences ul li .part--first,
#home .sentences ul li .part--second     { transform: translate3d(0, -120%, 0); }
#home .sentences ul li.active            { opacity: 1; }
#home .sentences ul li.active .container--word .part--first,
#home .sentences ul li.active .container--word .part--second { transform: translateZ(0); }
```
No `transition` — GSAP owns it. The rotation runs on `setInterval(…, 4500)`; each swap
(with `r = 0.9`) is:

| Step | Target | Tween | Position |
|---|---|---|---|
| out | `.part--first` | `y: -150%`, `0.9s`, **Expo.easeInOut** | `0` |
| out | `.part--first` | `opacity: 0`, `0.45s`, linear | `0` |
| out | `.part--second` | `y: -150%`, `0.9s`, Expo.easeInOut | `0.1` |
| out | `.part--second` | `opacity: 0`, `0.45s`, linear | `0.1` |
| set | next pair | `y: 150%` | `0` |
| swap | class `.active` moves | — | `0.55` |
| in | next `.part--first` | `y: 0`, `0.9s`, **Expo.easeOut** | `0.55` |
| in | next `.part--first` | `opacity 0→1`, `0.45s`, linear | `0.55` |
| in | next `.part--second` | `y: 0`, `0.9s`, Expo.easeOut | `0.65` |
| in | next `.part--second` | `opacity 0→1`, `0.45s`, linear | `0.65` |

> **What the user sees:** the two words of the headline slide up and out of a
> fixed-height slot, the second lagging the first by 100 ms, and the next pair rises into
> the same slot from below.

### 3.2 Manifesto lines — scroll-scrubbed wipe mask

```css
#manifesto .intro .line          { display: block; }
#manifesto .intro .line .content { display: inline-flex; align-items: center;
                                   position: relative; overflow: hidden;
                                   height: 7.6vw; }
#manifesto .intro .line .content .mask {
  display: inline-block; position: absolute; top: 0; left: 0;
  width: 100%; height: 115%;
  background: #000; opacity: .65;
  transform-origin: 100% 50%;
  transform: translateZ(0);
}
.touch #manifesto .intro .line .content .mask { opacity: 0; }   /* off on touch */
```
Markup carries `data-scroll data-scroll-offset="20%" data-scroll-position="top"
data-scroll-class="manifestoLine"`. On every locomotive `scroll` event the mask's `x` is
tweened to `clamp(0, 100, round(4 × progress))` percent with `duration: .25`,
`ease: Linear.easeNone` — a scrubbed value with a quarter-second catch-up, not a
one-shot animation.

> **What the user sees:** a 65 %-opaque black shade slides off each manifesto line from
> left to right, in lockstep with the scroll wheel, revealing the text at the pace you
> choose.

### 3.3 Client names — staggered word rise

Triggered by locomotive's `data-scroll-call="ANIMATE_BRAND_WORDS"`:
```js
tl.fromTo(words, { y: '20%' }, { y: 0, duration: .85, ease: Expo.easeOut, stagger: .05, force3D: true }, 0);
tl.to(words, { opacity: 1, duration: .425, ease: Linear.easeNone, stagger: .05 }, 0);
```
```css
#partners .brands .word         { opacity: 0; display: inline-block;
                                  font-size: 2.5vw; line-height: 3.49vw; }
#partners .brands .word:after   { content: ","; margin: 0 .52vw 0 -.52vw; }
#partners .brands .word:last-child:after { content: "."; }
```

### 3.4 Loader greeting

```css
#loader .text-display span { display: inline-block; opacity: 0;
                             transform: translate3d(0, 100%, 0); }
```
Tweened `y → 0` and `opacity → 1` over `1.2s` Expo.easeOut at t=1.0 s and t=1.1 s, held,
then `y → -100%` + `opacity → 0` at t=4.5 s / 4.6 s.

### 3.5 Horizontal scroll-text banner

```css
.slide-scroll-area   { overflow: hidden; margin-left: -12.6vw; margin-right: -12.6vw; }
.slide-scroll-area p { white-space: nowrap; font-size: 15.63vw; line-height: 19.53vw;
                       margin-left: -12.6vw; }
```
The `<p>` carries `data-scroll data-scroll-speed="12.5" data-scroll-direction="horizontal"` —
a very aggressive locomotive parallax that drags giant type sideways as you scroll.

### 3.6 Recipe — per-word mask swap

```css
.word-slot            { display: inline-block; overflow: hidden; vertical-align: bottom;
                        height: 1.2em; }        /* the mask */
.word-slot > span     { display: inline-block; will-change: transform;
                        transform: translate3d(0, 100%, 0); }
.word-slot.is-in > span { transform: translate3d(0, 0, 0); }
.word-slot > span     { transition: transform .9s cubic-bezier(.19,1,.22,1); }
.word-slot:nth-child(2) > span { transition-delay: .1s; }   /* the 100ms lag */
```
```css
/* scroll-scrubbed wipe — set --p from a scroll handler, 0 → 1 */
.wipe-line       { position: relative; overflow: hidden; display: inline-flex; }
.wipe-line::after{ content: ""; position: absolute; inset: 0;
                   background: #000; opacity: .65;
                   transform: translateX(calc(var(--p, 0) * 100%));
                   transition: transform .25s linear; }
```

---

## 4. Hover states

All prefixed by `.notouch` unless noted.

### 4.1 Pill link with gradient wash — `a.button--link`

```css
a.button--link          { position: relative; display: inline-block;
                          padding: 1.35vw 2.76vw; font-size: .83vw; }
a.button--link:before   { content: url(arrow.svg); display: inline-block;
                          height: .52vw; width: .52vw; margin-right: 1.09vw;
                          transition: transform .5s cubic-bezier(.19,1,.22,1); }
a.button--link:after    { content: ""; position: absolute; inset: 0; z-index: -1;
                          border-radius: 5.21vw;
                          background: linear-gradient(270deg,
                                       rgba(131,235,149,.6) -2.78%,
                                       rgba(255,179,64,.6) 99.99%, #ff8469);
                          opacity: .5;
                          transition: transform .5s cubic-bezier(.19,1,.22,1),
                                      opacity   .5s cubic-bezier(.19,1,.22,1); }
a.button--link:hover:after  { opacity: 1; transform: scale(1.1); }
a.button--link:hover:before { transform: translateX(20%); }
.white-bg a.button--link:after { opacity: 1;
   background: linear-gradient(270deg, rgba(131,235,149,.8) -2.78%,
               rgba(255,179,64,.8) 99.99%, #ff8469); }
```
> A soft green→amber→red gradient pill behind the label swells 10 % and goes fully
> opaque while the little arrow nudges right.

### 4.2 Outline pill that inverts — `a.button--arrow`

```css
a.button--arrow            { display: inline-block; font-weight: 300;
                             border: 1px solid rgba(255,255,255,.3);
                             border-radius: 26.67vw;
                             padding: 4.53vw 9.6vw;
                             transition: color .5s cubic-bezier(.19,1,.22,1),
                                         background .5s cubic-bezier(.19,1,.22,1); }
a.button--arrow svg        { transition: transform .5s cubic-bezier(.19,1,.22,1); }
a.button--arrow svg path   { transition: fill .5s cubic-bezier(.19,1,.22,1); fill: #fff; }
a.button--arrow:hover           { color: #000; background: #fff; }
a.button--arrow:hover svg       { transform: translate3d(50%, 0, 0); }
a.button--arrow:hover svg path  { fill: #000; }
/* case-study variant also spins the glyph */
.notouch #case-study .project--details .button--arrow:hover svg {
  transform: translate3d(50%,0,0) rotate(180deg); }
```

### 4.3 Circular back / to-top buttons

```css
footer .btn-to-top:before,
#artist-modal .btn-to-top:before {
  content: ""; position: absolute; inset: 0;
  border: 1px solid #000; border-radius: 100%;
  transition: transform .6s cubic-bezier(.19,1,.22,1);
}
footer .btn-to-top img { transform: translateZ(0) rotate(-90deg);
                         transition: transform .6s cubic-bezier(.19,1,.22,1); }
.notouch footer .btn-to-top:hover:before { transform: scale(1.2); }
.notouch footer .btn-to-top:hover img    { transform: translate3d(0,-50%,0) rotate(-90deg); }
```
> The ring around the arrow expands 20 % while the arrow itself slides up out of frame.

The case-study / artist-modal back button is the same idea with a **filling disc**:
```css
#artist-modal .btn-back .background        { position: absolute; inset: 0;
   border: 1px solid rgba(0,0,0,.2); border-radius: 100%; background: #fff;
   overflow: hidden; z-index: -1;
   transition: transform .75s cubic-bezier(.19,1,.22,1); }
#artist-modal .btn-back .background:after  { content: ""; position: absolute; inset: 0;
   transform: translate3d(-100%,0,0) scale(1.2); background: transparent; z-index: -1;
   transition: transform .75s cubic-bezier(.19,1,.22,1); }
#artist-modal .btn-back svg,
#artist-modal .btn-back svg path { transition: transform .75s cubic-bezier(.19,1,.22,1),
                                               fill .75s cubic-bezier(.19,1,.22,1); }
.notouch #artist-modal .btn-back:hover .background        { cursor: none; transform: scale(1.2); }
.notouch #artist-modal .btn-back:hover .background:after  { transform: translateZ(0) scale(1.2); background: #fff; }
.notouch #artist-modal .btn-back:hover svg                { transform: translateZ(0); }
.notouch #artist-modal .btn-back:hover svg path           { fill: #000; }
/* #case-study .btn-wrapper is identical, plus: */
.notouch #case-study .btn-wrapper:hover svg { transform: translate3d(-20%,0,0); }
```

### 4.4 Project card

```css
.project-card-item .img-wrapper { position: relative; overflow: hidden;
                                  width: 35.16vw; height: 38.49vw; }
.notouch .project-card-item .img-wrapper:hover { cursor: none; }
.notouch .project-card-item .img-wrapper:hover .img-container img {
  transform: translate3d(-50%,-50%,0) scale(1.3) !important;
  will-change: transform, opacity;
}
```
`1.2 → 1.3` over the inherited `.8s` expo, inside an `overflow: hidden` frame.

### 4.5 Footer email — gradient text with a two-bar underline sweep

```css
footer .contact a {
  position: relative; display: inline-block; overflow: hidden;
  font-size: 0;                             /* real size lives on the inner span */
  color: rgba(0,0,0,.0001);
  background: linear-gradient(90deg, #a0e0ab, #ffac2e 50%, #a52d25);
  background-clip: text; -webkit-background-clip: text;
  -webkit-text-fill-color: rgba(0,0,0,.0001);
  transition: opacity .2s linear; opacity: 1;
}
footer .contact a:before,
footer .contact a:after {
  content: ""; position: absolute; bottom: 0; left: 0;
  height: 1px; width: 100%;
  background: linear-gradient(90deg, #a0e0ab, #ffac2e 50%, #a52d25);
  transition: transform .85s cubic-bezier(1,0,0,1),
              background 1.5s cubic-bezier(.16,.77,.33,.97);
}
footer .contact a:before { transform: translate3d(-105%, 0, 0); }  /* waiting off-left  */
footer .contact a:after  { transform: translateZ(0); }             /* currently visible */
.notouch footer .contact a:hover        { opacity: .6; }
.notouch footer .contact a:hover:before { transform: translateZ(0); }
.notouch footer .contact a:hover:after  { transform: translate3d(105%, 0, 0); }
```
> **What the user sees:** the gradient-filled email address dims slightly and its
> underline appears to travel through the word — the old bar exits right as a new one
> enters from the left, on a hard `cubic-bezier(1,0,0,1)` snap.

Social links use the single-bar version:
```css
footer .socials a span         { display: inline-block; position: relative;
                                 overflow: hidden;
                                 transition: opacity .4s linear; }
@media (min-width: 1024px) {
  footer .socials a span:before { content: ""; position: absolute; bottom: 0; left: 0;
                                  width: 100%; height: 1px; background: #000;
                                  transform: translate3d(-103%, 0, 0);
                                  transition: transform .85s cubic-bezier(1,0,0,1); }
}
.notouch footer .socials li:hover a span { opacity: .6; }
```

### 4.6 Nav / list links with a sliding bullet

```css
ul li a          { opacity: .4;
                   transition: color 1.25s cubic-bezier(.19,1,.22,1),
                               opacity .4s linear,
                               transform .8s cubic-bezier(.19,1,.22,1); }
@media (min-width: 1024px) {
  ul li a:before { content: url(bullet.svg); display: inline-block;
                   height: .52vw; width: .52vw; margin-right: .47vw;
                   opacity: 0; transform: translateX(-100%);
                   transition: opacity .4s linear,
                               transform .8s cubic-bezier(.19,1,.22,1); }
}
.notouch ul li:hover a,  ul li.active a          { opacity: 1; }
ul li.active a:before,
header .anchors ul li a:hover:before             { transform: translateX(0); opacity: 1; }
```

### 4.7 Misc hovers

```css
@media (min-width: 1024px) { .notouch .close:hover { cursor: pointer; transform: rotate(90deg); } }  /* .5s expo */
.notouch a.black.text-link:hover svg              { transform: translateZ(0); }                      /* .8s expo */
.notouch .team-member .socials a:hover            { opacity: .4; }                                   /* .4s linear */
#artist-modal .head .socials .social:hover        { opacity: .6; }                                   /* .3s cubic-bezier(.4,.2,.2,1) */
.video-banner .controls .btn--volume:hover img,
.video-banner .controls .btn--fullscreen:hover img{ transform: scale(1.2); }                         /* .4s expo */
@media (min-width: 1024px) { .notouch .cookie-banner button.cta:hover { background: #fff; color: #000; } }
.notouch .next-project:hover .name svg            { transform: translate3d(50%,0,0); }               /* .5s expo */
.notouch .next-project:hover .poster .mask        { background: rgba(1,1,1,.2); }                    /* from .35 — .8s expo */
```

### 4.8 Recipe

```css
/* every hover behind a capability guard */
@media (hover: hover) and (pointer: fine) {
  .btn-pill            { position: relative; border-radius: 999px; isolation: isolate;
                         transition: color .5s cubic-bezier(.19,1,.22,1),
                                     background .5s cubic-bezier(.19,1,.22,1); }
  .btn-pill::after     { content: ""; position: absolute; inset: 0; z-index: -1;
                         border-radius: inherit; opacity: .5;
                         background: linear-gradient(270deg, #83eb95, #ffb340, #ff8469);
                         transition: transform .5s cubic-bezier(.19,1,.22,1),
                                     opacity   .5s cubic-bezier(.19,1,.22,1); }
  .btn-pill:hover::after { opacity: 1; transform: scale(1.1); }

  .btn-round::before   { content: ""; position: absolute; inset: 0;
                         border: 1px solid currentColor; border-radius: 50%;
                         transition: transform .6s cubic-bezier(.19,1,.22,1); }
  .btn-round:hover::before { transform: scale(1.2); }

  .link-sweep          { position: relative; overflow: hidden; display: inline-block; }
  .link-sweep::before,
  .link-sweep::after   { content: ""; position: absolute; left: 0; bottom: 0;
                         width: 100%; height: 1px; background: currentColor;
                         transition: transform .85s cubic-bezier(1,0,0,1); }
  .link-sweep::before  { transform: translate3d(-105%,0,0); }
  .link-sweep:hover::before { transform: none; }
  .link-sweep:hover::after  { transform: translate3d(105%,0,0); }

  .media-frame         { overflow: hidden; cursor: none; }
  .media-frame img     { transform: translate(-50%,-50%) scale(1.2);
                         transition: transform .8s cubic-bezier(.19,1,.22,1); }
  .media-frame:hover img { transform: translate(-50%,-50%) scale(1.3); }
}
```

---

## 5. Mobile nav — open / close

### 5.1 Panel

```css
header {
  position: fixed; z-index: 2; width: 100vw;
  opacity: 1;
  transition: opacity .7s cubic-bezier(.19,1,.22,1);
}
.sc-down header { opacity: 0 !important; pointer-events: none; }   /* hides on scroll down */

header .container .nav {
  position: fixed; top: 0; left: 0;
  width: 100vw; height: calc(var(--vh, 1vh) * 100);
  background: #000; z-index: -1;
  overflow: auto; -ms-overflow-style: none; scrollbar-width: none;
  transform: translate3d(-100%, 0, 0);        /* parked off-canvas left */
  padding-top: 40vw; padding-bottom: 5.33vw;
}
header .container .nav::-webkit-scrollbar { display: none; }
@media (min-width: 1024px) { header .container .nav { display: none; } }
header .container .nav .container .sections-anchors li { opacity: 0; }
header .container .nav .container .contact-mail a      { opacity: 0; }
```

### 5.2 Burger → cross

```css
header .menu .burger {
  position: absolute; top: 14.13vw; right: 4.53vw; z-index: 21;
  width: 6.93vw; height: 5.33vw; padding: 5.33vw;
  border: 0; outline: none; background: transparent; cursor: pointer;
  transition: all .25s ease-out;
}
header .menu .burger:before,
header .menu .burger:after {
  content: ""; position: absolute; top: 5.33vw; left: 2vw;
  width: 6.93vw; height: .27vw; background: #fff;
  transition: all .5s cubic-bezier(.19,1,.22,1);
}
header .menu .burger:before { transform: translate3d(0, -.7vw, 0) rotate(0deg); }
header .menu .burger:after  { transform: translate3d(0,  .7vw, 0) rotate(0deg); }
header .menu .burger.open:before { transform: translateZ(0) rotate( 45deg); }
header .menu .burger.open:after  { transform: translateZ(0) rotate(-45deg); }
.white-bg header .menu .burger:before,
.white-bg header .menu .burger:after { background: #010101; }
```
> Two bars converge to the centre and cross, over half a second on the expo curve.

### 5.3 The GSAP open / close timelines

**Open** (`body { overflow: hidden }` set on start):

| t | Target | Tween |
|---|---|---|
| `0` | `.nav` | `x: 0%`, `0.75s`, **Expo.easeInOut**, `force3D` |
| `0.35` | `.nav` | `display: block` (set) |
| `0.35` | `.languages` | `opacity: 1`, `0.45s`, linear |
| `0.35` | page links | `opacity: 1`, `0.45s`, linear, **stagger 0.1** |
| `0.35` | page links | `x: -30% → 0%`, `0.6s`, Expo.easeOut, stagger 0.1 |
| `0.9` | contact arrow | `opacity 0→1`, `x: -100% → 0%`, `0.45s`, linear |
| `0.9` | contact link | `opacity: 1`, `0.45s`, linear, stagger 0.1 |

**Close:**

| t | Target | Tween |
|---|---|---|
| `0` | all nav content | `opacity: 0`, `0.6s`, linear (fires `transition-in` on start) |
| `0.3` | `.nav` | `x: -100%`, `0.75s`, Expo.easeInOut |
| `0.3` | — | remove `.open` from header + burger |
| end | — | release `body { overflow }` |

Anchor clicks call `scroll.scrollTo(target, { duration: 850, disableLerp: true, easing: [.87, 0, .13, 1] })`.

### 5.4 Recipe

```css
.nav-panel {
  position: fixed; inset: 0; z-index: 20;
  background: #000; overflow: auto; overscroll-behavior: contain;
  transform: translate3d(-100%, 0, 0);
  transition: transform .75s cubic-bezier(.19,1,.22,1);
  visibility: hidden;
}
.nav-panel[data-open="true"] { transform: none; visibility: visible; }
.nav-panel li  { opacity: 0; transform: translate3d(-30%, 0, 0);
                 transition: opacity .45s linear, transform .6s cubic-bezier(.19,1,.22,1); }
.nav-panel[data-open="true"] li { opacity: 1; transform: none; }
.nav-panel[data-open="true"] li:nth-child(1) { transition-delay: .35s; }
.nav-panel[data-open="true"] li:nth-child(2) { transition-delay: .45s; }
.nav-panel[data-open="true"] li:nth-child(3) { transition-delay: .55s; }  /* +0.1s each */

.burger { position: relative; }
.burger span { position: absolute; left: 0; width: 100%; height: 1px;
               background: currentColor;
               transition: transform .5s cubic-bezier(.19,1,.22,1); }
.burger span:nth-child(1) { transform: translateY(-5px); }
.burger span:nth-child(2) { transform: translateY( 5px); }
.burger[aria-expanded="true"] span:nth-child(1) { transform: rotate( 45deg); }
.burger[aria-expanded="true"] span:nth-child(2) { transform: rotate(-45deg); }
```

---

## 6. Theme inversion — `.white-bg`

locomotive fires `data-scroll-call="SET_BACKGROUND"`; on `enter` the app root gains
`.white-bg`, on `exit` it loses it. Everything that must change colour carries a
`1.25s cubic-bezier(.19,1,.22,1)` transition on the relevant property, so the whole page
cross-fades in one long, coordinated move.

```css
#app          { background: #000;
                transition: background 1.25s cubic-bezier(.19,1,.22,1); }
#app.white-bg { background: #fff; }

header .container svg path            { transition: fill 1.25s cubic-bezier(.19,1,.22,1); }
header .content-right .languages      { transition: color 1.25s cubic-bezier(.19,1,.22,1); }
.team-member .role,
.team-member .row .name,
.team-member .number                  { transition: color 1.25s cubic-bezier(.19,1,.22,1); }
.team-member .container-btn .more     { transition: border 1.25s cubic-bezier(.19,1,.22,1); }
.team-member .more .sign:before,
.team-member .more .sign:after        { transition: background 1.25s cubic-bezier(.19,1,.22,1),
                                                    opacity .4s linear,
                                                    transform .8s cubic-bezier(.19,1,.22,1); }

.white-bg header .container svg path        { fill: #010101; }
.white-bg header .anchors a                 { color: #010101; }
.white-bg header .anchors a:before          { content: url(bullet-dark.svg); }
.white-bg .team-member .row .name           { color: #181818; }
.white-bg .team-member .container-btn .more { border: 1px solid rgba(0,0,0,.3); }
.white-bg .dot-cursor                       { background: #000 !important; }
```
> **What the user sees:** as the team section arrives, the page ground, the logo, the
> nav, the burger bars, the plus signs and the cursor all migrate from white-on-black to
> black-on-white together over 1.25 s — no flash, no per-element stagger.

### Recipe

```css
:root            { --bg: #000; --fg: #fff; --hairline: rgba(255,255,255,.3); }
[data-theme=light]{ --bg: #fff; --fg: #010101; --hairline: rgba(0,0,0,.3); }

.app             { background: var(--bg); transition: background 1.25s cubic-bezier(.19,1,.22,1); }
.themed          { color: var(--fg); border-color: var(--hairline);
                   transition: color 1.25s cubic-bezier(.19,1,.22,1),
                               border-color 1.25s cubic-bezier(.19,1,.22,1),
                               fill 1.25s cubic-bezier(.19,1,.22,1); }
```
```js
new IntersectionObserver(es => es.forEach(e =>
  document.documentElement.dataset.theme = e.isIntersecting ? 'light' : 'dark'
), { threshold: .5 }).observe(document.querySelector('#team'));
```

---

## 7. Sticky / fixed / pinned

| Element | Rule |
|---|---|
| `#loader` | `position: fixed; inset: 0 auto auto 0; width: 100vw; height: calc(var(--vh,1vh)*100); z-index: 10000; pointer-events: none; display: flex; overflow: hidden;` |
| `header` | `position: fixed; z-index: 2; width: 100vw;` — hidden by `.sc-down` |
| `header .nav` | `position: fixed; top:0; left:0; 100vw × calc(var(--vh,1vh)*100); z-index: -1` (→ `20` ≥1024) |
| `.cookie-banner` | `position: fixed; bottom: 0; right: 0; background: rgba(3,3,3,.4); z-index: 1000;` — GSAP `y: 200 → 0`, `0.6s`, `power3.out` in; `power3.in` out |
| `#artist-modal .btn-back` | `position: fixed; top: -6.13vw; left: -8vw;` |
| `.overlay` | `position: absolute; inset: 0; 100vw × calc(var(--vh,1vh)*100); z-index: 3000; background: #000; transform: translate3d(0,100%,0); display: none;` — the page-transition curtain primitive |
| `#app .app-content` | `height: calc(var(--vh,1vh)*100); overflow: hidden; will-change: transform;` |
| `.c-scrollbar` | `position: absolute; right: 0; top: 0; width: 11px; height: 100%;` |

**There is no `position: sticky`, no `mix-blend-mode`, no `backdrop-filter`, and no
`clip-path` anywhere in the site's CSS.** Depth and contrast are done with z-index, solid
overlays and the theme swap.

---

## 8. Smooth scroll & parallax (locomotive-scroll 4.1.1)

```js
new LocomotiveScroll({
  el: '[data-scroll-container]',
  smooth: true,
  smoothMobile: 0.5,
  touchMultiplier: 3.5,
  useKeyboard: true,
  mobile:     { smooth: true },
  tablet:     { smooth: true },
  smartphone: { smooth: true, horizontalGesture: true },
});
```

```css
html.has-scroll-smooth                    { overflow: hidden; }
html.has-scroll-dragging                  { user-select: none; }
.has-scroll-smooth body                   { overflow: hidden; }
.has-scroll-smooth [data-scroll-container]{ min-height: 100vh; }

.c-scrollbar        { position: absolute; right: 0; top: 0; width: 11px; height: 100%;
                      transform-origin: center right; opacity: 0;
                      transition: transform .3s, opacity .3s; }
.c-scrollbar:hover  { transform: scaleX(1.45); }
.c-scrollbar:hover,
.has-scroll-dragging .c-scrollbar,
.has-scroll-scrolling .c-scrollbar        { opacity: 1; }
.c-scrollbar_thumb  { position: absolute; top: 0; right: 0; width: 7px; margin: 2px;
                      background-color: #000; opacity: .5; border-radius: 10px;
                      cursor: grab; }
.has-scroll-dragging .c-scrollbar_thumb   { cursor: grabbing; }
[data-scroll-direction=horizontal] .c-scrollbar       { width: 100%; height: 10px;
                                                        top: auto; bottom: 0; transform: scaleY(1); }
[data-scroll-direction=horizontal] .c-scrollbar:hover { transform: scaleY(1.3); }
```

Parallax speeds actually used in the markup:

| `data-scroll-speed` | Applied to |
|---|---|
| `.5` | background-light glows, decorative art |
| `.25` / `-0.25` | project card image containers (alternating direction) |
| `-.5`, `-1`, `1` | section media |
| `-2` | strongest vertical push |
| `12.5` + `direction="horizontal"` | the giant scroll-text banner |

Other locomotive attributes in play: `data-scroll-repeat="true"` (re-trigger reveals),
`data-scroll-offset="20%"`, `data-scroll-position="top"`, `data-scroll-target="#team"`,
`data-scroll-class="manifestoLine"`, and the `data-scroll-call` hooks
`SET_CURRENT_SECTION`, `SET_BACKGROUND`, `ANIMATE_BRAND_WORDS`, `ANIMATE_BG_LIGHT`.

### Recipe (no library)

```css
@media (prefers-reduced-motion: no-preference) {
  [data-parallax] { will-change: transform;
                    transform: translate3d(0, calc(var(--scroll-y, 0) * var(--speed, .25) * 1px), 0); }
}
.scrollbar-rail  { position: fixed; top: 0; right: 0; width: 11px; height: 100%;
                   opacity: 0; transform-origin: center right;
                   transition: transform .3s, opacity .3s; }
.scrollbar-rail:hover,
.is-scrolling .scrollbar-rail { opacity: 1; }
.scrollbar-rail:hover         { transform: scaleX(1.45); }
```

---

## 9. `@keyframes` — the complete set

Only three, and all are small utilities. Everything substantial is a transition or a
GSAP tween.

```css
@keyframes rotating   { 0% { transform: rotate(0deg); }  100% { transform: rotate(1turn); } }
@keyframes blinker    { 0% { opacity: 1; }               100% { opacity: 0; } }
@keyframes wave-animation {
  0%  { transform: rotate(  0deg); }
  10% { transform: rotate( 14deg); }
  20% { transform: rotate( -8deg); }
  30% { transform: rotate( 14deg); }
  40% { transform: rotate( -4deg); }
  50% { transform: rotate( 10deg); }
  60% { transform: rotate(  0deg); }
  100%{ transform: rotate(  0deg); }
}
```
```css
.rotating { animation: rotating 10s linear infinite; }
.waving   { animation-name: wave-animation; animation-duration: 2.5s;
            animation-iteration-count: infinite;
            transform-origin: 70% 70%; display: inline-block; }
.blink    { animation-name: blinker; animation-duration: .6s;
            animation-iteration-count: infinite;
            animation-timing-function: ease-in-out;
            animation-direction: alternate; }
```
`.blink` is added to the loader logo while a project route is fetching, and removed when
it resolves. `.waving` is the emoji hand. `.rotating` is a slow decorative spin.

Also present, from the Nuxt shell (fires only if the SPA never boots):
```css
@keyframes nuxtLoadingIn { 0% { visibility: hidden; opacity: 0 }
                          20% { visibility: visible; opacity: 0 }
                         100% { visibility: visible; opacity: 1 } }
@keyframes nuxtLoading   { 0% { transform: rotate(0) } 100% { transform: rotate(360deg) } }
/* #nuxt-loading > div: 1.1s infinite linear spinner; the wrapper fades in over 10s ease */
```

---

## 10. Grain, noise and texture

**There is no CSS grain overlay** — no SVG `feTurbulence`, no repeating noise PNG, no
`mix-blend-mode`. The grain exists only inside the hero WebGL canvas
(`<canvas id="lens-artwork">`, three.js + `EffectComposer`).

### 10.1 The grain pass

The final full-screen `ShaderPass` (`renderToScreen = true`), applied over the render
pass. Reconstructed shape:

```glsl
uniform float amount;          // animated
uniform sampler2D tDiffuse;
varying vec2 vUv;

float random (vec2 p) {
  vec2 K1 = vec2(23.14069263277926, 2.665144142690225);   // e^pi, 2^sqrt(2)
  return fract(cos(dot(p, K1)) * 12345.6789);
}

void main () {
  vec4 color = texture2D(tDiffuse, vUv);
  vec2 uvRandom = vUv;
  uvRandom.y *= random(vec2(uvRandom.y, amount));
  color.rgb += random(uvRandom) * 0.075;                  // +7.5% additive grain
  gl_FragColor = color;
}
```
Renderer setup: `precision: "highp"`, `powerPreference: "high-performance"`,
`setPixelRatio(devicePixelRatio)`, clear colour `0`, camera `PerspectiveCamera(45, …, .1, 20)`
at `z = -4`.

> **What the user sees:** the black hero never looks flat — a faint, per-pixel film grain
> keeps the gradient from banding and gives the whole first screen a photographic feel.

### 10.2 The background gradient shader

A full-screen plane running 3D simplex noise (`snoise3`) plus a value-noise `noise()`,
with uniforms `uBaseFirstColor`, `uBaseSecondColor`, `uAccentColor`, `uBgProgress`,
`uAccentOpacity`, `uBaseFrequency`, `uAccentFrequency`, `uNoiseIntensity`,
`uOpacityBackground`, `uTime`, `uZoom`, `u_res`. `uTime` advances by
`0.00007 × speed` per frame. A radial vignette (`d = dist(centre, fragCoord) × (1-progress) × 0.003`)
darkens the edges. The material is `transparent: true`, `side: DoubleSide`, with
`defines: { PI, PR: devicePixelRatio }`.

Intro choreography:
```js
// preShow — while the loader is still up
tl.fromTo(bg, { opacityBackground: 0 }, { opacityBackground: .8, ease: Expo.easeInOut, duration: 2 }, 0);
tl.fromTo(bg, { bgProgress: 0 },        { bgProgress: .25,       ease: Expo.easeInOut, duration: 2 }, 0);
// show
tl.fromTo(bg, { bgProgress: .25 },      { bgProgress: 1,         ease: Expo.easeInOut, duration: 2 }, 0);
tl.from (bg, { speed: 100 },            { speed: 30,             ease: Expo.easeInOut, duration: 2 }, 0);
```

### 10.3 The lens

A refracting glass sphere over a cube map, with **chromatic aberration** — R/G/B sampled
at three slightly different refraction ratios (`ratio`, `ratio × 0.99`, `ratio × 0.98`) —
mixed against a Fresnel reflection term
(`bias + scale × pow(1 + dot(normalize(I), N), power)`). Uniforms: `mRefractionRatio`,
`mFresnelBias`, `mFresnelScale`, `mFresnelPower`, `tCube`, `uSphereAlpha`,
`uRefractionPower`. It tracks the mouse.

### 10.4 CSS "texture" that is actually there

Soft light bloom is done with plain absolutely-positioned images, parallaxed:
```css
#partners .bg-light, #strengths .bg-light, #team .bg-light,
header .nav .bg-light {
  position: absolute; z-index: -1;                 /* -2 on #partners */
  width: 100%; height: 61.77vw;                    /* generously oversized */
}
… .bg-light img {
  width: 100%; height: 100%;
  position: absolute; top: 50%; left: 50%;
  transform: translate3d(-50%, -50%, 0);
  object-fit: cover; z-index: 5;
  transition: transform .8s cubic-bezier(.19,1,.22,1);
}
```
And a hero fade-to-black at the bottom of the canvas:
```css
#home .canvas-container .gradient {
  position: absolute; bottom: 0; left: 0;
  width: 100%; height: 5.21vw; z-index: 1; opacity: 0;
  background: linear-gradient(0deg, #010101, 0, #010101 10%, #010101 30%, rgba(1,1,1,0));
}
```

### 10.5 Recipe — CSS-only grain

```css
.grain {
  position: fixed; inset: -50%;
  width: 200%; height: 200%;
  pointer-events: none; z-index: 9998;
  opacity: .075;                                   /* matches the shader's 0.075 */
  background-image: url("data:image/svg+xml;utf8,\
<svg xmlns='http://www.w3.org/2000/svg'><filter id='n'>\
<feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/>\
</filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
  will-change: transform;
  animation: grain-shift 8s steps(10) infinite;
}
@keyframes grain-shift {
  0%,100% { transform: translate(0,0); }   10% { transform: translate(-5%,-10%); }
  30%     { transform: translate(3%,-15%);}  50% { transform: translate(-8%, 4%); }
  70%     { transform: translate(6%, 8%); }  90% { transform: translate(-4%, 6%); }
}
@media (prefers-reduced-motion: reduce) { .grain { animation: none; } }
```
Note this is *not* what monopo does — it is the cheap equivalent. If you already have a
WebGL scene, add the 6-line additive-random pass instead; it costs almost nothing and
never tiles.

---

## 11. Page load sequence (the loader)

```css
#loader { position: fixed; inset: 0; width: 100vw; height: calc(var(--vh,1vh)*100);
          z-index: 10000; pointer-events: none;
          display: flex; justify-content: center; align-items: center;
          overflow: hidden; }
#loader .bg { position: absolute; inset: 0; background: #000; opacity: 0; }
#loader .logo-display { display: block; position: relative; opacity: 0;
                        transition: opacity .5s cubic-bezier(.19,1,.22,1); }
#loader .text-display span { display: inline-block; opacity: 0;
                             transform: translate3d(0, 100%, 0); }
header .container { opacity: 0; }
header .anchors ul li { opacity: 0; }
#home.loading { height: calc(var(--vh,1vh)*100); overflow: hidden; }
```

Full timeline (`showHome`, all eases `Expo.easeOut` unless noted):

| t (s) | What |
|---|---|
| `0.35` | lock scroll, mark `#home.loading`, emit `pre-show-background` |
| `1.0` | greeting word 1: `y → 0` and `opacity → 1`, `1.2s` each |
| `1.1` | greeting word 2, same, `1.2s` |
| `4.0` | emit `show-background` |
| `4.5` | word 1 out: `y → -100%`, `opacity → 0`, `1.2s` |
| `4.6` | word 2 out, same |
| `5.0` | emit `show-lens` (the glass sphere appears) |
| `5.1` | bottom gradient `opacity 0→1`; header `opacity → 1` (`1s`); desktop only: header `y: -100% → 0%` (`1s`) |
| `5.1` | nav anchors `opacity → 1` and `x: 100% → 0%`, `1s`, **stagger 0.075** |
| `5.2` | `.sentences` container `opacity → 1` (`1s`); fires `animate-sentences` |
| `5.3` | hero word 1 `y: 60% → 0%` (`1.2s`) + `opacity 0→1` (`1s`) |
| `5.4` | hero word 2, same; unlock scroll, show cookie banner if needed |
| `5.5` | scroll logo `opacity → 1` (`1s`) |

On subsequent (already-warm) visits the same choreography runs compressed, with the
header/anchors at `t = 0.6` and the sentences at `t = 0.9`.

**Route change loader:** `.bg` and `.logo-display` fade in over `1.2s` expo; at `1.21 s`
the logo gets `.blink` (0.6 s alternate ease-in-out); on arrival `.blink` is removed,
`.logo-display` fades out over `0.3 s` and `.bg` over `0.6 s` starting at `0.1 s`.

---

## 12. Component-specific motion worth stealing

### 12.1 Team-member accordion

```css
.team-member .details {
  height: 0; overflow: hidden;
  transition: color 1.25s cubic-bezier(.19,1,.22,1),
              height .65s cubic-bezier(1, 0, 0, 1);   /* hard in-out snap */
}
.team-member .container-btn .more .sign:before,
.team-member .container-btn .more .sign:after {
  content: ""; position: absolute; left: 50%;
  width: 1px; height: 2.13vw; top: calc(50% - 1.065vw);
  background: #fff;
  transition: background 1.25s cubic-bezier(.19,1,.22,1),
              opacity .4s linear,
              transform .8s cubic-bezier(.19,1,.22,1);
}
.team-member .container-btn .more .sign:after       { transform: rotate(-90deg); }
.team-member .container-btn.open .sign:before       { transform: rotate(90deg); opacity: 1; }
.team-member .container-btn.open .sign:after        { transform: rotate(0deg);  opacity: 0; }
```
> A `+` becomes a `–` by rotating one bar 90° while the other fades out; the panel below
> opens on `cubic-bezier(1,0,0,1)`, which sits still, moves fast, then sits still again.

### 12.2 Rotated tile grid (`.tiles--rotated`)

```css
.tiles { position: relative; overflow: hidden; pointer-events: none;
         --tiles-height: 54.84vw; height: var(--tiles-height); }
.tiles__wrap { --tileswrap-height: var(--tiles-height);
               height: var(--tileswrap-height); width: 150%;
               position: absolute; left: 50%; top: 50%;
               transform: translate3d(-50%,-50%,0); }
.tiles--rotated .tiles__wrap {
  --tileswrap-height: calc(var(--tiles-height) * 2.8);
  transform: translate3d(-50%,-50%,0) rotate(45deg);
}
.tiles__line     { display: flex; will-change: transform; }
.tiles__line-img { --tile-margin: 2vw; flex: none; position: relative; overflow: hidden;
                   margin: var(--tile-margin);
                   width:  calc(30% - var(--tile-margin) * 2);
                   height: calc(var(--tileswrap-height) / 4 - var(--tile-margin) * 4 / 2); }
.tiles--rotated .tiles__line-img .img-container img {
  transform: translate3d(-50%,-50%,0) scale(1.1);
  transition: transform .8s cubic-bezier(.19,1,.22,1);
}
```
A CSS-custom-property-driven grid rotated 45° and oversized to 150 % width, with each
row translated at a different rate as you scroll.

### 12.3 Video player controls

```css
.video-banner .controls .progress          { flex: 10; flex-basis: 100%; height: 5px;
                                             background: rgba(0,0,0,.5);
                                             cursor: ew-resize;
                                             transition: height .3s; }
.video-banner .controls .progress__filled  { flex: 0; flex-basis: 0%; width: 0;
                                             background: #fff;
                                             transition: flex-basis .4s linear; }
.video-banner .controls .btn--volume img,
.video-banner .controls .btn--fullscreen img { width: 4.53vw; height: 4.53vw;
                                               transition: transform .4s cubic-bezier(.19,1,.22,1); }
.notouch .video-banner .controls button:hover img { transform: scale(1.2); }
.video-banner .poster:hover                { cursor: none; }
.video-banner .poster.no-video:hover       { cursor: auto; }
```
The progress bar animates its **`flex-basis`**, not `width` — worth noting as a technique
(it keeps the fill inside a flex row without fighting the layout).
Poster ↔ video crossfade: `opacity` `0.35 s` linear, Vimeo iframe `0.65 s`.

### 12.4 "Next project" plate

```css
.next-project .poster .mask { position: absolute; inset: auto 0 0 0; width: 100%; height: 100%;
                              background: rgba(1,1,1,.35); z-index: 1;
                              transition: background .8s cubic-bezier(.19,1,.22,1); }
.notouch .next-project:hover .poster .mask { background: rgba(1,1,1,.2); }
.next-project .name svg   { transition: transform .5s cubic-bezier(.19,1,.22,1); }
@media (min-width: 1024px) {
  .notouch .next-project:hover .name svg { transform: translate3d(50%, 0, 0); }
}
.notouch .next-project:hover { cursor: none; }   /* the dot-cursor says "Next Project" */
```

---

## 13. Implementation checklist

If you want this feel in a new site, in the order that matters:

1. **Pick one easing.** `cubic-bezier(.19, 1, .22, 1)` for every transform, `linear` for
   every opacity. Put them in custom properties (`--ease: cubic-bezier(.19,1,.22,1)`) and
   never deviate.
2. **Standardise on `.8s`** for transforms and `.4s` for opacity, with a `.1s` delay on
   the container. Deviate only for the four slow specials: `1.25s` theme, `2s` hairline,
   `.85s` underline, `.65s` accordion.
3. **One reveal class.** `[data-reveal]` → `.is-inview`. Everything else composes from it
   with `transition-delay`.
4. **Gate every hover** behind `@media (hover: hover) and (pointer: fine)` (their
   `.notouch`), and use `cursor: none` on the surfaces your custom cursor owns.
5. **Custom cursor:** author it big, scale it down to ~0.08, lerp position at 0.15/frame,
   tween scale with an expo-out over 450–600 ms, and swap its colour with the theme class
   rather than reaching for `mix-blend-mode`.
6. **Images always overshoot.** Park them at `scale(1.2)` inside `overflow: hidden` and
   move to `1.3` on hover. Never animate `width`/`height`.
7. **Text moves in slots.** Fixed-height `overflow: hidden` wrapper, inner span at
   `translate3d(0, ±100–150%, 0)`, second word delayed 100 ms.
8. **Theme changes are one 1.25 s cross-fade**, applied to a root class, with every
   colour-bearing element already carrying the matching transition.
9. **`will-change: transform, opacity`** only on elements that are about to move; the site
   is disciplined about this.
10. **Add `prefers-reduced-motion` guards** — monopo has none, and you should.
