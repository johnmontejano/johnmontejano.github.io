# SCROLL_SPEC — the time dimension

What *happens* on monopo.vn as you scroll, measured frame by frame, and the
choreography that maps it onto this page.

`docs/MONOPO_CSS.md` and `docs/MONOPO_JS.md` already cover the static styling and
the JS parameters. **This document is only about sequence and scroll-linked
behaviour** — what enters, in what order, over what distance, what is scrubbed,
what pins, and where the ground flips.

---

## 0. Method and evidence

monopo runs Locomotive Scroll v4 (`smooth:true`), so a plain headless
`--screenshot` returns a black frame stuck on the WebGL loader, and
`window.scrollTo` does not move the page — Locomotive keeps `scrollY` at 0 and
translates `[data-scroll-container]` instead.

The page was driven over CDP:

```
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless \
  --remote-debugging-port=9222 --enable-unsafe-swiftshader \
  --use-gl=angle --use-angle=swiftshader --window-size=1440,900
```

with synthetic `Input.dispatchMouseEvent {type:"mouseWheel", deltaY:120}` bursts,
900 ms of settle between steps, then `Page.captureScreenshot` plus a DOM probe
reading the container transform (`-matrix.m42` = the real scroll position),
`getBoundingClientRect` on every section, and the live `transform` of every
`[data-scroll-speed]` element.

**54 frames** at 1440×900, DPR 1, from y=0 to y=15,352 (page limit 16,267), plus
four targeted fine-grained passes (manifesto 3,900→6,200 @200 px; strip
7,000→8,000 @125 px; tiles 8,300→10,500 @150 px; project cards 900→2,500).

Frames referenced below live in `docs/scroll-frames/` (`m_NN.jpg` = the top→bottom
sweep; `strip_*` / `tiles_*` = the fine passes). Full-resolution PNGs, all raw JSON
probes and the capture harness (`cdp.js`, `capture.js`, `measure.js`, `lag.js` — a
zero-dependency CDP client) are in the session scratchpad at
`…/scratchpad/scroll/`. Copy that folder if you want the originals.

---

## 1. The reference page as a timeline

Page height 16,267 px at 1440 wide = **18.1 viewports**. Every position below is
the document Y of the section's top edge, measured, not estimated.

| doc y | length | section | what it is |
|---|---|---|---|
| 0 | 900 | hero `#intro-container` + `canvas#lens-artwork` | orb + one rotating sentence. `position:static` — it scrolls away, it does not pin |
| 946 | 3,052 | `section#works` | 8 project cards in a 2-column grid, right column offset **+131 px** down |
| 4,189 | 421 | `#partners` (`.brands` at 4,282, h 201) | "They trust us" + the brand word wall |
| 4,610 | 1,403 | `section#manifesto` | 10 lines, 109 px pitch — **the only scrubbed thing on the site** |
| 6,114 | 1,398 | `section#strengths` | 3 stacked sub-sections at 6,150 / 6,653 / 7,161, ~353 px each, each with a hairline rule above |
| 7,665 | 281 | the "Discover Saigon Soul" strip `<p>` | one line of ~200 px type, 1,622 px wide, sweeping sideways |
| 8,105 | 690 | `.video-banner` > `video.main-video` | full-bleed video, autoplays 250 ms after enter |
| 8,795 | 553 | `#saigon-soul` `.text-cta` | paragraph left, gradient CTA pill right |
| 9,493 | 790 | `section#tilesGrid.tiles--rotated` | the 45° diamond gallery |
| 10,380 | 4,859 | `section#team` | 6 members, **741 px pitch**, 351×500 portrait each |
| 15,389 | 878 | `footer#contact` | white ground, gradient email |
| 15,464 | 677 | footer inner `section` | carries `data-scroll-call="SET_BACKGROUND"` |

Dead space between sections: 46, 191, 0, 101, 153, 159, 0, 146, 97, 150 px — i.e.
**~100–190 px of pure black between every section, on top of each section's own
padding.** One discrete content element per ~280 px of scroll. Ours is one per
69 px. Half of "it feels like nothing happens" on our page is that *too much*
happens per pixel; there is no rest between events.

### 1.1 The scroll feel itself — Locomotive lerp 0.1

Config: `lerp: 0.1`, `multiplier: 1`, `touchMultiplier: 3.5`, `direction: vertical`,
no `getSpeed`/`getDirection`. Per frame:

```
current += (target - current) * 0.1
container.style.transform = translate3d(0, -current, 0)
```

This is a first-order exponential filter. It **never overshoots** — there is no
spring, no bounce, no rubber-band anywhere on the site. At 60 fps:

| | |
|---|---|
| time constant τ = 1/(60 × 0.1) | **167 ms** |
| half-life | 116 ms |
| 63 % of the distance | 167 ms |
| 90 % | 384 ms |
| 99 % | 767 ms |

Measured in headless (`lag.js`, SwiftShader so the frame rate is low): 10 wheel
notches → 479 px, still creeping 2.3 s later. On real hardware the practical read
is: **the page keeps gliding for about 0.4 s after your fingers stop, and arrives
without a bounce.**

Our Lenis is already `lerp: 0.1, touchMultiplier: 3.5` (`assets/js/main.js:74`), so
the *substrate* already matches. Nothing about the glide needs changing. What is
missing is that on monopo the glide carries **things that move at different rates**;
on ours it carries a rigid block.

### 1.2 There are exactly four scroll-linked mechanisms on the whole site

Verified by enumerating every `data-scroll-*` attribute in the live DOM.

1. **`is-inview` → CSS transition.** Locomotive adds the class; the stylesheet
   does the rest. Fire-once, not scrubbed. Split easing: `opacity` linear,
   `transform` `cubic-bezier(.19,1,.22,1)`. Staggering is `transition-delay`
   (.1s → .2s → .45s), not JS.
2. **The manifesto mask** — genuinely scrubbed, §1.4.
3. **`data-scroll-speed` parallax** — six distinct uses, §1.3.
4. **`sc-up` / `sc-down` on the app root** — the header.

### 1.3 What actually pins: nothing

`document.querySelectorAll('[data-scroll-sticky]')` → **0 elements**. The only
`position:fixed` nodes are chrome: `#header`, `.cookie-banner`, `.btn-back`,
`.nav`, `#loader`. `#lens-artwork` (the orb canvas) is `position:static`, doc top 0,
height 900 — **the hero scrolls away like any other block** (`m_00.jpg` → `m_02.jpg`
→ `m_04.jpg`).

So the reference's eventfulness is *not* pinning. It is (a) large-distance
parallax with a wide speed spread, (b) one scrubbed wipe, (c) generous rest.

That said: our page is 11.6k tall with 12 sections against their 16.3k with 10,
and our content is denser and more list-shaped. Two pins are prescribed in §2 as a
deliberate extension, not as a port. They are labelled as such.

### 1.4 The manifesto — the one scrubbed moment (`m_24.jpg`, `m_27.jpg`)

Markup per line:

```html
<span class="line" data-scroll data-scroll-class="manifestoLine">
  <span class="content">…text…<span class="mask"></span></span>
</span>
```

`.mask` is a black plate, `width:100%; height:115%; opacity:.65`, sitting *over*
the line. Because it is 65 % and not 100 %, **the un-wiped text is not invisible —
it reads mid-grey.** You always see the whole paragraph; the wipe *brightens* it
left-to-right. This is a much better read than a hard reveal and it is exactly what
`m_24.jpg` shows: `Collaborate,` white / `and` grey, `Cha` white / `llenge.` grey.

Measured mapping (1440×900, line height 109 px, 10 lines). Mask X as a percentage
of line width against the line's viewport `top`:

| line top (px) | mask % |
|---|---|
| 647 | 0 |
| 612 | 0 |
| 583 | 11 |
| 578 | 13 |
| 514 | 38 |
| 509 | 41 |
| 503 | 43 |
| 474 | 54 |
| 468 | 57 |
| 405 | 82 |
| 399 | 84 |
| 365 | 98 |
| 359 | 100 |

Least-squares fit:

```
maskPercent = clamp( (610 - lineTop) / 2.45, 0, 100 )
```

In viewport-relative terms — **the only form worth porting**:

- wipe **starts** when the line's top edge reaches **67.8 vh**
- wipe **completes** when it reaches **40.6 vh**
- window = **27.2 vh (245 px at 900)**

Line pitch is 109 px, so **2.25 lines are mid-wipe at any instant.** That is the
diagonal staircase in `m_24.jpg`/`m_27.jpg` and it is the whole effect. The full
10-line block takes 10 × 109 + 245 = **1,335 px of scroll** to resolve.

On top of the already-lerped scroll the app runs each mask through
`gsap.to(mask, {x: p+'%', duration: 0.25, ease: 'none'})` every frame — a **250 ms
trailing filter**, so the wipe can never snap even if you flick the wheel. In
ScrollTrigger terms that is exactly `scrub: 0.25`.

> Note: `MONOPO_JS.md` §4.2 records the formula as `4h/((vh+lineH)/100)`, which
> predicts 72 % where the measured value is 0 %. Trust the table above; it comes
> off the live DOM.

### 1.5 The parallax inventory, with measured travel

Locomotive reads `data-scroll-speed` as `parseFloat(attr)/10`. Default position
formula: `offset = (scroll + vh/2 − elementMidDoc) × −factor`, applied **only while
the element is in view** — which is why every value below clamps at the edges of
its own in-view window and then freezes.

| element | attr | factor | axis | window | **total travel** |
|---|---|---|---|---|---|
| 8 × `.project-card-item .img-container` | `-0.25` | 0.025 | Y | 1,454 px | **36 px** (±18) |
| `p` "Discover Saigon Soul" | `12.5` | **1.25** | X | 1,181 px | **1,474 px** (±737) |
| 4 × `.tiles__line` (target `#tilesGrid`) | `±1` | ±0.1 | X | 1,690 px | **166 px each** (±83) |
| 12 × `.tiles__line .img-container` | `±.5` | ±0.05 | X | 1,668 px | **70 px** (±35), sign opposite its row |
| 6 × `#team .img-container` (target `#team`) | `.5` | 0.05 | Y | 5,759 px | **288 px** (±144), all six in lockstep |
| 6 × `#team .name` | `-2` | **−0.2** | Y | 1,003 px | **200 px** (±100), each on its own phase |

**The strip** (`strip_y7248.jpg` → `strip_y7532.jpg` → `strip_y7816.jpg`, and
`m_40.jpg`). Raw measurements:

| scroll y | translateX |
|---|---|
| 7,248 | +134 |
| 7,532 | −221 |
| 7,816 | −576 |
| 7,964 | −737 (clamped, out of view) |

Slope = −871 / 716 = **−1.216 ≈ −1.25**. So: **for every pixel you scroll down,
the phrase moves 1.25 px left.** Total sweep 1,474 px across a 1,440 px viewport,
against a container widened to 1,802 px by `margin-inline: -12.58vw`. The phrase is
repeated twice inside 1,622 px (≈811 px per repeat), so you watch it travel almost
**two full phrase-lengths** in the 1,181 px it takes the band to cross the screen.
It reverses when you scroll back up. It is not a marquee and there is no time-based
animation anywhere on the site.

**The tiles** (`tiles_y9167.jpg`). Rows go +83 → −83 as the grid crosses; adjacent
rows have opposite signs, so **the shear between neighbouring rows is 332 px**.
Because `.tiles__wrap` is `rotate(45deg)`, that horizontal translation reads as
diagonal drift along the diamond axis. Each tile's inner `.img-container` slides
±35 px *against* its own row, and because each has its own in-view window the twelve
are all out of phase — measured at one instant, row 0's tiles were at −13 and +10
while row 2's were at +26 and +34. That desynchronisation is what stops it reading
as one rigid sheet.

**The team is the best idea on the page** (`m_45.jpg`, `m_48.jpg`). Sign matters:

- the **portrait** moves +144 → −144 across the *whole* 4,859 px team section
  (shared `data-scroll-target="#team"`, so all six move together) — it travels
  **up, faster than the page**;
- the **name** moves −100 → +100 across its *own* 1,003 px window — it travels
  **down, slower than the page**, lagging.

So as each member crosses the screen the portrait races ahead and the name hangs
back; they shear apart by up to ~250 px in opposite directions, and the name — set
at 103 px and overlapping the portrait's right edge — slides visibly across it.
One attribute pair, and the section reads as depth rather than as a list.

### 1.6 Section-to-section handoffs

- **Hero → works.** No transition at all. The hero is a normal 900 px block; the
  orb canvas scrolls up out of frame with it, and 46 px of black later the "Selected
  project" label is already sitting there (`m_02.jpg`). The handoff is done by the
  1,000+ px of black, not by an effect.
- **Works → partners.** 191 px of black, then `ANIMATE_BRAND_WORDS` fires once on
  enter: `fromTo(words, {y:'20%'}, {y:0, duration:.85, ease:'expo.out', stagger:.05})`
  with `opacity` on a *half-length* 0.425 s linear tween in parallel. The fade
  finishes first, the movement keeps easing out — that split shows up everywhere.
- **Partners → manifesto.** 0 px gap; the manifesto's first line begins wiping
  while the brand list is still on screen (`m_21.jpg` → `m_24.jpg`).
- **Strengths → strip.** 153 px, then the strip is already mid-sweep as it enters
  from the bottom, because its offset is nonzero the instant it becomes in-view.
  Nothing "starts"; it is already moving when you meet it.
- **Strip → video → saigon-soul → tiles.** The strip's bottom edge and the video's
  top edge are 159 px apart, and the video is full-bleed, so the strip's giant type
  is cut off by a hard horizontal edge (`m_40.jpg`). The tiles arrive the same way —
  a hard diagonal edge, no fade (`tiles_y8735.jpg`).
- **Ground flip.** Only once, at the very bottom. `SET_BACKGROUND` sits on the
  footer's inner `section` at doc 15,464, so it fires at **scroll ≈ 14,564**
  (measured: `white-bg` absent at 14,201, present at 14,748). What it flips is
  **only the cursor** — `.white-bg .dot-cursor{background:#000}` over a 0.6 s CSS
  transition. The footer's own white ground is plain CSS and arrives as a **hard
  edge** scrolling up at doc 15,389 (`m_53.jpg`). There is no page-wide cross-fade
  anywhere on monopo.
- **Header.** `opacity: 0` while `sc-down`, `1` while `sc-up`, transition
  `opacity .7s cubic-bezier(.19,1,.22,1)`, **no translate** on desktop. It flips on
  the first frame of a direction reversal. Verified live.
- **Project cards sit at `opacity: 0.4`** and only reach 1 under the pointer. The
  work grid is deliberately dim until you aim at it. Not a scroll behaviour, but it
  is why the grid feels responsive rather than static.

---

## 2. The choreography for this page

Our geometry, measured live at 1440×900 (doc height 11,566, vh 900):

| doc y | h | section |
|---|---|---|
| 0 | 900 | `#top` hero |
| 900 | 62 | `.mq` trades marquee |
| 962 | 494 | `#intro` |
| 1,456 | 1,384 | `#leak` — 4 cells |
| 2,840 | 927 | `#automate` — 6 rules |
| 3,767 | 2,521 | `#work` — 3 jobs |
| 6,289 | 921 | `#instead` — 2 columns |
| 7,209 | 805 | `#how` — 4 steps |
| 8,014 | 877 | `#who` — portrait |
| 8,890 | 911 | `#questions` — 6 FAQ |
| 9,801 | 1,188 | `#book` |
| 10,989 | 577 | `footer.foot` |

Everything below assumes Lenis + `ScrollTrigger` (both already loaded) and
`ScrollTrigger.normalizeScroll` left off. Register once:

```js
gsap.registerPlugin(ScrollTrigger);
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add(t => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);
ScrollTrigger.defaults({ invalidateOnRefresh: true });
```

Wrap the whole thing in `gsap.matchMedia()` so `(prefers-reduced-motion: reduce)`
and `(max-width: 1023px)` get the resolved end state with no pins and no scrubs.

### 2.0 GLOBAL — the per-line wipe becomes scrubbed *(SCRUB — port, highest impact)*

We already have the exact markup (`.line > .content > .mask`, `opacity:.65`,
`transform-origin:100% 50%`) and we already build it in `main.js:splitLines`. The
only thing wrong is the *timing*: `main.js:98` plays it as a one-shot
`gsap.to(masks, {scaleX:0, duration:1.25, stagger:.085})` fired by
`ScrollTrigger.create({start:'top 85%', once:true})`. That is a triggered animation,
not a scroll-linked one, and it is the single biggest reason the page reads as
"nothing happens" — every heading resolves in the first 200 px and then the
remaining 700 px of that section are inert.

Replace with one trigger **per line**, using the measured 67.8 vh → 40.6 vh window:

```js
gsap.utils.toArray('.split .line').forEach(line => {
  const mask = line.querySelector('.mask');
  gsap.fromTo(mask,
    { xPercent: 0 },
    { xPercent: 100, ease: 'none',
      scrollTrigger: {
        trigger: line,
        start: 'top 68%',     // 612 px at vh 900 — measured 0 %
        end:   'top 40%',     // 360 px at vh 900 — measured 100 %
        scrub: 0.25           // their 0.25 s linear smoothing tween, exactly
      }});
});
```

- Window = **252 px (28 vh)** per line, matching their 245 px / 27.2 vh.
- Use `xPercent: 100` (translate off to the right) rather than `scaleX: 0`; it is
  what they do and it keeps the plate's edge hard.
- Our `.h2` line pitch is ~52–64 px against their 109 px, so **3.9–4.8 lines will be
  mid-wipe at once** instead of their 2.25. That is fine and reads as a steeper
  staircase; if it looks too soft, narrow to `start:'top 62%' end:'top 44%'`
  (162 px) to get back to ~2.5 lines.
- Delete the `once: true` wipe path and the `heroPlayed` gate. Keep a separate
  one-shot for `.hero .display` only (it is above the fold and has no scroll
  distance to scrub against): `gsap.to(heroMasks, {xPercent:100, duration:1.25,
  ease:'expo.out', stagger:.085, delay:.2})`.
- Applies to all 9 `.split` headings: `#leak`, `#automate`, `#work`, `#instead`,
  `#how`, `#who`, `#questions`, `#book`.

**Also make the whole page breathe.** `--gap-section` is 120 px and our median gap
between elements is 65 px against their 125. Raise `--gap-section` to
`clamp(120px, 13vw, 200px)` and add ~100 px of dead ground between sections. Motion
needs somewhere to happen; right now the next thing is always already on screen.

---

### 2.1 `#top` HERO (0–900) — nothing pins, it leaves

Match the reference exactly: the hero is a normal block that scrolls away. Keep the
orb where it is, but slow it so the type separates from the ground.

```js
// ground drifts up at 0.85× — 135 px over the hero's exit
gsap.to('.orb, .orb-gl', {
  yPercent: 15, ease: 'none',
  scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
});
// headline leaves faster than the ground, and dims on the way out
gsap.to('.hero__in', {
  yPercent: -12, opacity: 0.15, ease: 'none',
  scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.4 }
});
```

Distances: ground +135 px, headline −108 px over 900 px of scroll — a 243 px spread
between the two layers as the hero exits. That single spread does more for the fold
than any entrance animation.

### 2.2 `.mq` TRADES MARQUEE (900–962) *(SCRUB — direct port of the Saigon strip)*

**This is the clearest mismatch on our page.** `.mq__t` runs
`animation: mq 52s linear infinite` (styles.css:318) — a time-based marquee, which
monopo does not have anywhere. It moves when you are not scrolling and it moves at
the same rate whatever you do, so it reads as decoration rather than as part of the
page.

Convert it to the strip's mechanic at their exact factor:

```js
const mq = document.querySelector('.mq__t');
gsap.fromTo(mq,
  { x: () => innerWidth * 0.62 },      // +893 px at 1440
  { x: () => -innerWidth * 0.62, ease: 'none',
    scrollTrigger: {
      trigger: '.mq',
      start: 'top bottom',             // band enters at doc 900 − 900 = 0
      end:   'bottom top',             // leaves at doc 962
      scrub: 0.3
    }});
```

- In-view window = 62 + 900 = **962 px of scroll**; travel = **1,786 px** →
  effective factor **1.86**, comfortably above their 1.25 because our band is
  62 px tall against their 281 px and therefore has less scroll to work with.
  If it feels too fast, drop to `innerWidth * 0.42` (factor 1.25 exactly).
- Delete `animation: mq 52s linear infinite` and add `will-change: transform`.
- Optional and worth it: add velocity skew, which our page has nowhere.
  ```js
  const vel = ScrollTrigger.create({ onUpdate: self => {
    gsap.to(mq, { skewX: gsap.utils.clamp(-8, 8, self.getVelocity() / -220),
                  duration: 0.5, ease: 'power3.out', overwrite: true });
  }});
  ```
- The strip reverses on scroll-up on monopo. This does too, for free.

### 2.3 `#intro` (962–1,456) — the split-easing entrance, unchanged

Our `.reveal` primitive already reproduces their rule verbatim (`opacity .4s linear`,
`transform .8s cubic-bezier(.19,1,.22,1)`, `translate3d(0,20%,0)`, `.1s` delay).
Leave it. One change: raise the trigger boundary so the reveal is not already
finished by the time the section is comfortably on screen — our IntersectionObserver
uses `rootMargin: '0px 0px -12% 0px'`, which fires at 88 vh. Move to `-25%` (75 vh)
so there is ~120 px of visible travel.

### 2.4 `#leak` FOUR LEAKS (1,456–2,840) — staggered entrance + counter-drift

Keep `.reveal-group` (0 / .09 / .18 / .27 s delays — their `.05 s` stagger scaled to
our four-item cadence). Add the one thing it is missing: the cells should not all
travel at the same rate.

```js
gsap.utils.toArray('#leak .cell').forEach((cell, i) => {
  gsap.fromTo(cell, { y: 34 * (i % 2 ? 1 : -1) },
    { y: -34 * (i % 2 ? 1 : -1), ease: 'none',
      scrollTrigger: { trigger: cell, start: 'top bottom', end: 'bottom top', scrub: 0.5 }});
});
```

**68 px of travel per cell**, alternating sign — the two-column shear from their
project grid (which offsets the right column by 131 px and drifts each image 36 px)
reduced to a 2×2. Small on purpose: this section is a list, not a gallery.

### 2.5 `#automate` SIX RULES (2,840–3,767) — **PIN #1** *(extension)*

Six `when X → Y` lines currently arrive as one `.reveal-group` cascade in ~600 ms
and then 900 px of the section is inert. This is the natural place to hold, because
the content is six discrete beats and the heading ("If it happens twice, it happens
without you") is the frame they all sit in.

```js
const rules = gsap.utils.toArray('#automate .rule');
const tl = gsap.timeline({
  scrollTrigger: {
    trigger: '#automate',
    start: 'top top',            // section top hits viewport top
    end:   '+=1600',             // 1,600 px ≈ 1.8 viewports of held scroll
    pin: true,
    pinSpacing: true,
    scrub: 0.4,
    anticipatePin: 1
  }
});
rules.forEach((r, i) => {
  tl.fromTo(r,
    { opacity: 0.18, x: -28 },
    { opacity: 1, x: 0, ease: 'none' },
    i * 0.85);                   // 6 beats over ~5.1 units → ~265 px of scroll each
  if (i < rules.length - 1) tl.to(r, { opacity: 0.3, ease: 'none' }, i * 0.85 + 0.85);
});
```

- **Pin duration 1,600 px ≈ 1.8 vh.** Each rule owns ~265 px of scroll. Long enough
  to register as a beat, short enough that nobody feels trapped.
- The rule that just resolved fades back to 0.3 as the next arrives, so exactly one
  line is lit at a time. That reading — one bright thing in a field of dim ones — is
  taken straight from monopo's project grid, which sits at `opacity:.4` and lights
  one card at a time under the cursor.
- The section grows by 1,600 px. Budget for it: `#automate` becomes 927 + 1,600 =
  **2,527 px**, and everything below shifts down. That is fine — the reference page
  is 40 % longer than ours to begin with.
- `pinType` will be `transform` under Lenis; that is correct, do not force `fixed`.

### 2.6 `#work` THREE PROJECTS (3,767–6,289) — pixel parallax + light ground

Our current parallax (`main.js:117`) uses `yPercent: ±50 × f`, which on a 750 px-tall
image is ±3.75 % = ±28 px and, worse, varies with image height. The reference is
**pixel**-based and constant: ±18 px, 36 px total, on every card. Replace:

```js
gsap.utils.toArray('.job .img-container').forEach((el, i) => {
  const dir = i % 2 ? 1 : -1;                     // alternate like their 2-col grid
  gsap.fromTo(el, { y: 18 * dir }, { y: -18 * dir, ease: 'none',
    scrollTrigger: { trigger: el.closest('.job'),
                     start: 'top bottom', end: 'bottom top', scrub: 0.5 }});
});
// text column counter-drifts, so card and copy shear
gsap.utils.toArray('.job > div:last-child').forEach((col, i) => {
  const dir = i % 2 ? -1 : 1;
  gsap.fromTo(col, { y: 30 * dir }, { y: -30 * dir, ease: 'none',
    scrollTrigger: { trigger: col.closest('.job'),
                     start: 'top bottom', end: 'bottom top', scrub: 0.6 }});
});
```

Image 36 px, copy 60 px, opposite signs → **96 px of shear** between the shot and
its description as each project crosses. That is the reference's team-section idea
(portrait up / name down) at a scale appropriate to a screenshot.

Ground flip: our `[data-theme]` IntersectionObserver with
`rootMargin: '-45% 0px -45% 0px'` (main.js:132) fires when `#work`'s midline is in
the middle 10 % of the viewport, which given `#work` is 2,521 px tall means the flip
happens ~1,100 px into the section and reverses ~1,100 px before it ends. Move it to
explicit ScrollTrigger boundaries so the flip is legible and the same on the way back:

```js
ScrollTrigger.create({
  trigger: '#work',
  start: 'top 70%',      // flip 270 px before the section reaches the top
  end:   'bottom 30%',
  onToggle: s => document.documentElement.setAttribute('data-theme', s.isActive ? 'light' : 'dark')
});
```

Keep the 1.25 s CSS cross-fade. Note this is deliberately *unlike* monopo, whose
light ground is a hard edge at the footer with no page-wide cross-fade — but ours is
a light *island* mid-page rather than a terminal state, and a hard cut mid-page reads
as a bug. Document the divergence; do not "fix" it toward the reference.

### 2.7 `#instead` TWO COLUMNS (6,289–7,210) — counter-slide

Two lists, "Another hire" vs "One built system". Give them opposite motion so the
comparison is physical:

```js
gsap.fromTo('#instead .swap__col--out', { x: -26, opacity: 0.55 },
  { x: 0, opacity: 0.55, ease: 'none',
    scrollTrigger: { trigger: '#instead .swap', start: 'top 85%', end: 'top 45%', scrub: 0.4 }});
gsap.fromTo('#instead .swap__col:not(.swap__col--out)', { x: 26, opacity: 0.7 },
  { x: 0, opacity: 1, ease: 'none',
    scrollTrigger: { trigger: '#instead .swap', start: 'top 85%', end: 'top 45%', scrub: 0.4 }});
```

- 52 px of closing travel over a **360 px (40 vh)** window.
- The "Another hire" column ends at `opacity .55` and stays there. It is the losing
  option; it should stay dim. Same device as their 0.4 cards.

### 2.8 `#how` FOUR STEPS (7,209–8,014) — **PIN #2** *(extension)*

The strongest place on the page to hold, because the heading is literally the four
steps: *Book it. Map it. Build it. Own it.* Pin the heading and light one clause at a
time as its step scrubs in.

```js
// splitLines() already gives us .line elements for the two authored <br> lines;
// wrap the four sentences in <b class="clause"> inside the h2 first.
const steps   = gsap.utils.toArray('#how .step');
const clauses = gsap.utils.toArray('#how .h2 .clause');

const tl = gsap.timeline({
  scrollTrigger: {
    trigger: '#how',
    start: 'top top',
    end:   '+=1800',           // 1,800 px = 2.0 viewports
    pin: '#how .wrap',         // pin the inner wrap, not the section
    scrub: 0.5,
    anticipatePin: 1
  }
});
steps.forEach((s, i) => {
  tl.fromTo(s, { opacity: 0.2, y: 40 }, { opacity: 1, y: 0, ease: 'none' }, i)
    .fromTo(clauses[i], { opacity: 0.28 }, { opacity: 1, ease: 'none' }, i)
    .to(clauses[i], { opacity: 0.28, ease: 'none' }, i + 1);
});
```

- **1,800 px pinned, 450 px per step.** Four beats, each ~half a viewport of scroll —
  slow enough to read the step copy.
- The heading never moves; only the emphasis inside it does. That restraint is the
  reference's register — one thing changing at a time, on a still ground.
- `#how` grows to 805 + 1,800 = **2,605 px**.
- Combined with §2.5 the page becomes ~15,000 px, i.e. ~16.6 viewports — within
  spitting distance of monopo's 18.1. The extra length is the point, not a cost.

### 2.9 `#who` PORTRAIT (8,014–8,891) — **the team shear, ported literally**

This is the one place our content matches theirs one-for-one: a portrait with a name
beside it. Port §1.5's sign convention exactly.

```html
<!-- add a name element beside the portrait -->
<span class="who-name" aria-hidden="true">John<br>Montejano</span>
```

```js
// portrait races ahead (up), like their .img-container at speed .5
gsap.fromTo('#who .img-container', { y: 60 }, { y: -60, ease: 'none',
  scrollTrigger: { trigger: '#who', start: 'top bottom', end: 'bottom top', scrub: 0.5 }});
// name lags behind (down), like their .name at speed -2
gsap.fromTo('#who .who-name', { y: -75 }, { y: 75, ease: 'none',
  scrollTrigger: { trigger: '#who .who-name', start: 'top bottom', end: 'bottom top', scrub: 0.5 }});
```

- Portrait **120 px up**, name **150 px down**, opposite signs → **270 px of shear**,
  right at their measured 288/200 pair.
- Set the name at ~72–96 px, positioned to overlap the portrait's right edge with
  `mix-blend-mode: difference` or plain white over the image, exactly as `m_45.jpg`
  and `m_48.jpg` show.
- Give `#who` more room first: 877 px is too short for 270 px of travel to be
  legible. Take it to ~1,200 px.

### 2.10 `#questions` FAQ (8,890–9,801) — sequential entrance only

Six `<details>`. Do **not** scrub or pin — this is the one section where the user is
scanning for an answer, and motion is friction. Stagger the entrance and stop:

```js
gsap.from('#questions .qa', {
  opacity: 0, y: 24, duration: 0.8, ease: 'expo.out', stagger: 0.06,
  scrollTrigger: { trigger: '#questions .faq', start: 'top 78%', once: true }
});
```

`stagger: 0.06` sits between their `.05` (brand words) and our `.09`
(`.reveal-group`). Their split-easing rule applies: if you want opacity separate,
give it `duration: 0.4` linear against the 0.8 s `expo.out` movement.

### 2.11 `#book` (9,801–10,989) — the second ground flip

Terminal light ground, exactly like their footer (`m_53.jpg`). Flip on the way in
and **do not flip back**:

```js
ScrollTrigger.create({
  trigger: '#book',
  start: 'top 60%',
  onEnter:     () => document.documentElement.setAttribute('data-theme', 'light'),
  onLeaveBack: () => document.documentElement.setAttribute('data-theme', 'dark')
});
```

Their `SET_BACKGROUND` fires **825 px before the footer's top edge** (doc 15,464
enters view at 14,564; footer top is 15,389). Scaled to ours: `top 60%` on `#book`
fires at doc 9,261, which is 1,728 px before our footer — close enough given our
`#book` is a full section rather than a strip. The important part is that the flip
lands *before* the visual boundary, so the light ground feels like it arrives rather
than like it switches.

### 2.12 `footer` (10,989–11,566) — the mark, and the header

```js
// the big "Montejano" wordmark drifts up against the footer, like their gradient email
gsap.fromTo('.foot__mark', { y: 70 }, { y: -70, ease: 'none',
  scrollTrigger: { trigger: '.foot', start: 'top bottom', end: 'bottom bottom', scrub: 0.6 }});
```

140 px of travel. And add the direction-toggle header, which we do not have at all:

```js
let last = 0;
lenis.on('scroll', ({ scroll }) => {
  const dir = scroll > last ? 'down' : 'up';
  last = scroll;
  document.documentElement.dataset.sc = scroll < 40 ? 'up' : dir;
});
```
```css
.nav { transition: opacity .7s cubic-bezier(.19,1,.22,1); }
html[data-sc="down"] .nav { opacity: 0; pointer-events: none; }
```

Their exact values: `opacity .7s cubic-bezier(.19,1,.22,1)`, no translate, flips on
the first frame of reversal, always visible at the top of the page.

---

## 3. Build order

1. **§2.0** — scrubbed per-line wipe. One change, applies to all 9 headings, and it
   is the difference between "an animation played" and "the page is responding".
2. **§2.2** — scroll-driven marquee. Deletes a time-based animation that fights the
   scroll and replaces it with the site's signature horizontal move.
3. **§2.9** — the `#who` shear. Cheapest way to get real depth, and our content
   matches the reference exactly here.
4. **§2.5 / §2.8** — the two pins. Do these together; they both add page length and
   both need `ScrollTrigger.refresh()` ordering care (create pins *last*, after every
   non-pinned trigger, so start/end values are computed against the final layout).
5. **§2.1, §2.6, §2.7, §2.11, §2.12** — the parallax and ground work.
6. Raise `--gap-section` and the IntersectionObserver boundary (§2.3) throughout.

**Reduced motion.** Everything above goes inside:

```js
gsap.matchMedia().add(
  '(prefers-reduced-motion: no-preference) and (min-width: 1024px)',
  () => { /* all of the above; return a cleanup fn */ }
);
```

Below 1024 px, drop the pins and the shears, keep the wipe as a one-shot (their
own pattern: they `removeAttribute('data-scroll')` on mobile rather than scaling the
effect down).

**Verification.** Re-run the harness against ours: `node capture.js
https://johnmontejano.github.io 40 ours` — but our page uses Lenis, not Locomotive,
so plain `Page.captureScreenshot` after `window.scrollTo` will not work either; keep
using synthetic wheel events, and read the scroll position from `lenis.scroll`
rather than from a container transform.

---

## 4. The five that matter most

1. **Scrub the line wipe instead of triggering it** (§2.0). Nine headings currently
   resolve inside the first 200 px of their section and then the section is dead. The
   reference's *only* scrubbed effect is this one, and it runs on a 27 vh window with
   2–3 lines mid-wipe at all times, so text is continuously resolving under you for
   1,300 px at a stretch.
2. **Make the marquee scroll-driven at ~1.25 px per px** (§2.2). A 52 s CSS loop is
   the one thing on our page that moves while you are not scrolling, which is exactly
   backwards. monopo has no time-based animation at all; its most memorable move is a
   line of type that travels 1,474 px sideways because you pushed it.
3. **Add the two pins** (§2.5 `#automate`, §2.8 `#how`). We have zero held moments in
   11.6k px. 1,600 px and 1,800 px of pinned scroll turn two list sections into
   sequences, and add ~3,400 px of page — closing most of the gap to the reference's
   18 viewports, which is itself a large part of why theirs feels unhurried.
4. **Shear things apart** (§2.9 `#who`, §2.6 `#work`, §2.1 hero). The reference's
   depth comes from one number: the *spread* between the fastest and slowest layer in
   frame. Theirs runs 288 px up against 200 px down in the team section. Ours runs
   ±28 px on three images and nothing else — a spread of 56 px across the entire
   page. Get it to 250–300 px in at least three places.
5. **Give motion room, and hide the header on the way down** (§2.0 gaps, §2.12).
   One element per 69 px against their 280 leaves nothing space to travel through;
   raising `--gap-section` and adding ~100 px of dead ground between sections costs
   nothing and makes every effect above legible. The header toggle
   (`opacity .7s`, `cubic-bezier(.19,1,.22,1)`) is four lines and is the most
   immediately felt "this page knows I'm scrolling" signal on the reference.
