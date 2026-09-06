# monopo.vn — JavaScript behaviour, reverse-engineered

Reference notes for reimplementing the interaction layer of `https://monopo.vn` from
scratch. Everything below was derived by reading the site's shipped bundles
(`/_nuxt/9a94800.js` runtime, `8d8fa77.js` Nuxt/Vue, `be4e259.js` vendor
(three.js + GSAP + locomotive-scroll), `aa1acf2.js` app, plus 24 lazy route chunks)
and by rendering the page in headless Chrome.

**Nothing in this document is their source code.** Findings are described, parameters
are listed, and every code block is an original re-implementation recipe written for
this project. Short identifier-level snippets appear only where they are needed to
justify a claim.

Stack observed: Nuxt 2 (SPA mode, `mode: 'out-in'` page transitions) + Vue 2 +
GSAP 3 + locomotive-scroll v4 + three.js (with EffectComposer/RenderPass/ShaderPass).

---

## 0. Global conventions

| Thing | Value |
|---|---|
| Root classes on `<html>` | `has-scroll-init has-scroll-smooth` + breakpoint class (`mobile` / `tablet` / `tablet-large` / `desktop`) + `small-height` (max-height 749px) + `notouch` when non-touch |
| Breakpoints | mobile (base), tablet ≥768, tablet-large ≥1024, desktop ≥1280 |
| `--vh` custom property | set to `window.innerHeight * 0.01` on every resize; used as `calc(var(--vh) * 100)` for iOS-safe full height |
| Easing vocabulary | Only three GSAP eases are used site-wide: `expo.out`, `expo.inOut`, `none` (linear). Confirmed by resolving the bundle's ease exports to GSAP's `Expo` and `Linear` objects. |
| CSS easing twin | `cubic-bezier(.19, 1, .22, 1)` everywhere — the CSS approximation of `expo.out` |
| Units | Nearly all sizing is in `vw` (e.g. `font-size: .83vw`), so the design scales linearly with viewport width on desktop |

Practical takeaway: if you standardise on `expo.out` for entrances, `expo.inOut` for
exits/toggles, and linear for opacity-only fades, you reproduce ~90% of the site's
motion feel without copying anything.

---

## 1. Locomotive Scroll

### 1.1 Confirmed configuration

The app instantiates locomotive-scroll v4 once, in the root layout, on the element
matching `[data-scroll-container]`:

```js
{
  el: containerEl,
  smooth: true,
  smoothMobile: 0.5,        // legacy v3 key — v4 ignores it, see note
  touchMultiplier: 3.5,
  useKeyboard: true,
  mobile:     { smooth: true },
  tablet:     { smooth: true },
  smartphone: { smooth: true, horizontalGesture: true }
}
```

Everything else is v4 defaults, which the vendor bundle confirms verbatim:

| Option | Default in use |
|---|---|
| `lerp` | **0.1** — this is the smoothness. Never overridden. |
| `multiplier` | **1** |
| `firefoxMultiplier` | 50 |
| `touchMultiplier` | 2 (site overrides to **3.5**) |
| `direction` | `vertical` (confirmed on `<html data-scroll-direction="vertical">`) |
| `gestureDirection` | `vertical` |
| `class` | `is-inview` |
| `initClass` | `has-scroll-init` |
| `smoothClass` | `has-scroll-smooth` |
| `scrollingClass` | `has-scroll-scrolling` |
| `draggingClass` | `has-scroll-dragging` |
| `scrollbarClass` | `c-scrollbar` |
| `offset` | `[0, 0]` |
| `repeat` | `false` |
| `getSpeed` / `getDirection` | `false` |
| `resetNativeScroll` | `true` |
| tablet breakpoint | 1024 |

Notes:
- `smoothMobile` is a **v3** option name. In v4 it does nothing; the smooth-on-mobile
  behaviour actually comes from `mobile/tablet/smartphone: { smooth: true }`. If you
  reimplement, drop `smoothMobile` entirely.
- Because `smooth: true` on every context, the site is smooth-scrolled on phones too,
  with `touchMultiplier: 3.5` making touch drags travel 1.75× further than default.

### 1.2 How `data-scroll-speed` becomes movement

This is the part worth getting exactly right. Locomotive parses the attribute as
`parseFloat(value) / 10`, so **`data-scroll-speed="12.5"` is a factor of 1.25**, and
`"1"` is `0.1`.

The per-frame offset depends on `data-scroll-position`:

| `data-scroll-position` | Offset formula |
|---|---|
| *(none — default)* | `(scroll + viewportMid − elementMid) * −speed` |
| `top` | `scroll * −speed` |
| `elementTop` | `((scroll + viewportH) − elementTop) * −speed` |
| `bottom` | `(scrollLimit − (scroll + viewportH) + viewportH) * speed` |
| `left` / `elementLeft` / `right` | same three shapes on the X axis |

The offset is written as a translate on the element: X when
`data-scroll-direction="horizontal"` (or the whole instance is horizontal), Y otherwise.
Elements only get transformed **while in view** (`inView`), which is what keeps it cheap.

`data-scroll-target="#someId"` swaps which element's bounding box is used to compute
`top/left/middle` — so children can be driven by their section's progress rather than
their own.

`data-scroll-offset="20%"` shifts the in-view trigger boundaries (single value = both
edges); `data-scroll-class="manifestoLine"` replaces `is-inview` with a custom class for
that element; `data-scroll-repeat="true"` re-fires enter/exit every pass.

### 1.3 Observed speed values on the site

| Element | Attributes | Effect |
|---|---|---|
| "Discover Saigon Soul" strip | `speed="12.5"`, `direction="horizontal"` | factor 1.25 → the line rockets sideways as you scroll past. This is the "marquee" — **it is not a marquee**, see §6. |
| Tile grid rows 1 & 3 | `speed="1"`, `direction="horizontal"`, `target="#tilesGrid"` | factor 0.1 right |
| Tile grid rows 2 & 4 | `speed="-1"` | factor −0.1 left |
| Inner `.img-container` of every tile | `speed=".5"` / `"-.5"` | factor ±0.05, opposite to its row → images drift inside their frames |
| Project card image container | `speed="±.25"` (`scrollUp` prop) | gentle vertical parallax; the attribute is **removed** below 1024px |

### 1.4 Scroll callbacks

Two `data-scroll-call` values exist:

- `SET_CURRENT_SECTION` — on `enter`, emits the section's `el.id` so the header can
  highlight the current anchor. Paired with `data-scroll-repeat="true"`.
- `ANIMATE_BRAND_WORDS` — on `enter`, runs the partners logo-wall reveal (see §4.4).
- `SET_BACKGROUND` — adds `white-bg` to the app root on enter, removes it on exit.
  This is what flips the custom cursor from white to black (pure CSS, see §2.4).
- `ANIMATE_BG_LIGHT` — on enter, `video.play()` after a 250 ms timeout.

### 1.5 The `scroll` event handler

On every scroll frame the app does three things:

1. **Direction classes** — compares `scroll.y` to the previous value and toggles
   `sc-down` / `sc-up` on the app root (used to hide/show the header). Suppressed while
   the nav is open (`#header.open`).
2. **Manifesto mask** — see §4.2.
3. Clamps the stored previous Y at 0.

### 1.6 Reimplementation recipe (if you do not want the library)

```js
// Minimal smooth-scroll + parallax core. ~60 lines, same feel as lerp:0.1.
const LERP = 0.1;

const state = { target: 0, current: 0, limit: 0 };
const items = [];   // { el, speed, position, direction, targetEl, bounds }

function measure() {
  state.limit = container.scrollHeight - innerHeight;
  document.body.style.height = container.scrollHeight + 'px';
  for (const it of items) {
    const box = (it.targetEl || it.el).getBoundingClientRect();
    it.bounds = { top: box.top + state.current, height: box.height };
    it.bounds.mid = it.bounds.top + box.height / 2;
  }
}

addEventListener('scroll', () => { state.target = scrollY; }, { passive: true });

function frame() {
  state.current += (state.target - state.current) * LERP;
  if (Math.abs(state.target - state.current) < 0.1) state.current = state.target;

  container.style.transform = `translate3d(0, ${-state.current}px, 0)`;

  const mid = state.current + innerHeight / 2;
  for (const it of items) {
    let off;
    switch (it.position) {
      case 'top':         off = state.current * -it.speed; break;
      case 'elementTop':  off = (state.current + innerHeight - it.bounds.top) * -it.speed; break;
      case 'bottom':      off = (state.limit - state.current) * it.speed; break;
      default:            off = (mid - it.bounds.mid) * -it.speed;
    }
    it.el.style.transform = it.direction === 'horizontal'
      ? `translate3d(${off}px,0,0)`
      : `translate3d(0,${off}px,0)`;
  }
  requestAnimationFrame(frame);
}
```

Remember to divide the authored attribute by 10 to match their numbers, and to gate the
transform on an IntersectionObserver so off-screen elements cost nothing.

---

## 2. The custom cursor — `DotCursor`

This is the most distinctive piece of the site and it is much simpler than it looks.
There is **one** element, and its *scale* carries all the state.

### 2.1 Markup and CSS

```html
<div class="dot-cursor">
  <img src="/…arrow.svg" alt="">   <!-- the diagonal arrow, hidden by default -->
  <span></span>                     <!-- the label: "Play" / "Pause" / "Next Project" -->
</div>
```

Key CSS (only applied inside `@media (min-width: 1024px)` and only under `.notouch` —
touch devices never get a cursor):

```css
.dot-cursor {
  position: absolute; top: 50%; left: 50%;
  width: 10vw; height: 10vw;      /* ← full-size circle, ~192px at 1920 */
  border-radius: 100%;
  background: #fff;
  display: flex; align-items: center; justify-content: center;
  z-index: 999;
  pointer-events: none;
  will-change: transform;
  opacity: 0;                      /* JS raises it */
  transform-origin: center;
  transition: background .6s cubic-bezier(.19,1,.22,1), opacity .6s linear;
  overflow: hidden;
}
.white-bg .dot-cursor { background: #000; }   /* inverts on light sections */

.dot-cursor span {                 /* the label */
  position: absolute; top: calc(50% - .415vw); left: 50%;
  color: #000; opacity: 0;
  font-size: .83vw; line-height: .99vw;
  transform: translateZ(0) scale3d(0,0,0);
  transform-origin: center;
  transition: transform .8s cubic-bezier(.19,1,.22,1);
  transition-delay: .15s;
}
.dot-cursor img {                  /* the arrow */
  width: 1.77vw; height: 1.77vw;
  transform: scale3d(0,0,0);
  transform-origin: center;
  transition: transform .8s cubic-bezier(.19,1,.22,1);
  transition-delay: .15s;
}
```

**The trick:** the element is authored at its *largest* size (10vw) and scaled *down*
to 0.075 for the idle dot — 10vw × 0.075 ≈ 14.4px at 1920. Growing to a full-size
"Play" bubble is therefore just `scale: 1`, and no layout or repaint is involved.
Because the base is huge, the scaled-down dot stays crisp.

### 2.2 Position: the lerp

- **Easing factor: `0.15`**, applied every rAF tick, on both axes, from the element's
  current position toward the raw pointer position.
- The pointer position comes from `mousemove` and uses **`pageX` / `pageY`** (not
  `clientX/Y`). This matters: the cursor element is `position: absolute` and the page
  body does not scroll natively under locomotive-scroll, so page coords are stable.
- The rAF loop is a shared 60 fps ticker with a frame-budget guard
  (`if (now - last > 1000/60) run callbacks`) rather than a raw rAF — i.e. it throttles
  to 60 fps on high-refresh displays.
- Initial position is the viewport centre, so the cursor flies in from the middle on
  first move.

The transform written each frame:

```
translate3d(x − w/2 − innerWidth/2  px,
            y − h/2 − innerHeight/2 px, 0)
scale3d(scale, scale, 1)
```

The `− innerWidth/2 / − innerHeight/2` terms exist only because the element is anchored
at `top:50%; left:50%`; they cancel the anchor so `x, y` can be plain page coordinates.

### 2.3 States

`scale` is tweened with GSAP; the inner `<span>` / `<img>` are toggled by directly
setting inline `transform` / `opacity` and letting the **CSS transition** (0.8s
`expo.out`, 0.15s delay) do the work. Base duration `d = 0.6s`.

| State | Trigger | scale → | duration | Inner element |
|---|---|---|---|---|
| **idle dot** | default / `reset-cursor` | `0.075` | `0.75d` = 0.45s | span & img `scale3d(0,0,0)`, label cleared |
| **hover project card** | `mouseenter` on `.img-wrapper` | `0.75` | 0.45s | `img` → `scale3d(1,1,1) rotate(-45deg)` (arrow points up-right) |
| **hover next-project block** | `mouseenter` | `1` | 0.45s | `span` → text `"Next Project"`, `scale3d(1,1,1)`, opacity 1 |
| **hover video (paused)** | `mouseenter` on poster | `1` | **0.6s** | `span` → `"Play"` |
| **hover video (playing)** | `mouseenter` while playing | `1` | 0.6s | `span` → `"Pause"` |
| **hover a link** | `onEnterLink` | `0` | 0.45s | element `opacity: 0` — cursor fully disappears so the native pointer/underline reads |
| **`hide-cursor` regions** | any element carrying `hide-cursor="true"` | — | — | on `mousemove`, reads `event.target.getAttribute('hide-cursor')` and sets element opacity 0/1. Used on form inputs and the cookie banner. |
| **leaves window** | `document mouseleave` | — | — | opacity 0 (`mouseenter` restores) |

Ease for every scale tween: `expo.out`. Enter/leave timelines `kill()` each other so
fast in-out flicking cannot stack.

**Colour state** is not JS at all: the `white-bg` class added by the `SET_BACKGROUND`
scroll call flips `background` from `#fff` to `#000` through a 0.6s CSS transition.

**There is no magnetic attraction on buttons.** I looked specifically for it: no
`getBoundingClientRect`-per-mousemove element-follow logic exists anywhere in the app
bundle or the route chunks. The only "magnet-like" residue is a leftover `tMouseMove`
reference with no definition. Buttons rely on plain CSS `:hover` transitions.

### 2.4 Reimplementation recipe

```js
class DotCursor {
  constructor(el) {
    this.el = el;
    this.label = el.querySelector('span');
    this.icon  = el.querySelector('img');
    this.w = el.offsetWidth; this.h = el.offsetHeight;
    this.mx = innerWidth / 2;  this.my = innerHeight / 2;
    this.x  = this.mx;         this.y  = this.my;
    this.scale = 0.075;        // idle
    this.D = 0.6;

    addEventListener('mousemove', e => {
      this.mx = e.pageX; this.my = e.pageY;
      this.el.style.opacity = e.target.closest('[data-hide-cursor]') ? 0 : 1;
    });
    document.addEventListener('mouseleave', () => this.el.style.opacity = 0);
    document.addEventListener('mouseenter', () => this.el.style.opacity = 1);
    requestAnimationFrame(this.tick);
  }

  tick = () => {
    this.x += (this.mx - this.x) * 0.15;     // ← the easing factor
    this.y += (this.my - this.y) * 0.15;
    this.el.style.transform =
      `translate3d(${this.x - this.w/2 - innerWidth/2}px,` +
      `${this.y - this.h/2 - innerHeight/2}px,0) ` +
      `scale3d(${this.scale},${this.scale},1)`;
    requestAnimationFrame(this.tick);
  };

  // one entry point per state; kill the previous tween first
  setState(name) {
    this.tween?.kill();
    const map = { idle: 0.075, card: 0.75, label: 1, link: 0 };
    this.tween = gsap.to(this, {
      scale: map[name],
      duration: name === 'video' ? this.D : this.D * 0.75,
      ease: 'expo.out'
    });
  }
  showLabel(text) {
    this.label.textContent = text;
    this.label.style.transform = 'translate3d(-50%,0,0) scale3d(1,1,1)';
    this.label.style.opacity = 1;
  }
  hideLabel() {
    this.label.style.transform = 'translate3d(-50%,0,0) scale3d(0,0,0)';
    this.label.style.opacity = 0;
    this.label.textContent = '';
  }
  showArrow(deg = -45) { this.icon.style.transform = `scale3d(1,1,1) rotate(${deg}deg)`; }
  hideArrow()          { this.icon.style.transform = 'scale3d(0,0,0)'; }
}
```

Gate the whole thing behind `matchMedia('(min-width:1024px)').matches && !('ontouchstart' in window)`
and reset to idle on every route change.

---

## 3. WebGL

Two meshes share one scene, one renderer and one `EffectComposer`.

### 3.1 Scene setup

```
PerspectiveCamera(45°, aspect, near 0.1, far 20)
camera.position.set(0, 0, -4)        // note: negative Z, looking back at origin
camera.lookAt(scene.position)

WebGLRenderer({ canvas, precision: 'highp', powerPreference: 'high-performance' })
renderer.setPixelRatio(devicePixelRatio)
renderer.setClearColor(0x000000)

composer = EffectComposer(renderer)
  .addPass(RenderPass(scene, camera))
  .addPass(grainPass)   // renderToScreen = true
```

**Camera parallax**: the canvas element listens for `mousemove` and normalises to
`m = 2 * (client / size − 0.5)`, i.e. −1…1. Each frame, an internal `cameraPosition`
vector is eased toward `m` by **0.06**, then:

```
camera.position.x = -cameraPosition.x * 0.6
camera.position.y = -cameraPosition.y * 0.3
camera.lookAt(0,0,0)
```

So the horizontal drift is twice the vertical, and the whole thing is a two-stage lag
(0.06 lerp on the vector, plus perspective).

### 3.2 The full-screen "orb" / gradient background — the important shader

**Geometry**: `SphereGeometry(1, 32, 32)`, `side: BackSide` (`l.a`), `transparent: true`.
It is scaled to exactly fill the frustum:

```
fovY  = camera.position.z * tan(fovRad / 2) * 2      // ≈ −3.31 at z = −4, fov = 45
mesh.scale.set(|fovY * camera.aspect|, |fovY|, fovY)
mesh.lookAt(camera.position)
```

Because we render the **inside** of a sphere that spans the frustum, the shader is
effectively a full-screen quad, but with a genuinely 3-dimensional `position` varying —
that curvature is what gives the pattern its subtle barrel/orb feel rather than a flat
gradient.

**Vertex shader**: passes the raw object-space `position` (a unit sphere, so a vec3 on
the unit ball) into a `varying vec3` and does the standard MVP. That varying, not `uv`,
is the noise domain.

**Defines**: `PI`, `PR` (= `devicePixelRatio.toFixed(1)`).

**Uniforms and their shipped values**:

| Uniform | Value | Note |
|---|---|---|
| `uBaseFirstColor` | `rgb(120,158,113)` — muted green | normalised to 0–1 |
| `uBaseSecondColor` | `rgb(224,148,66)` — burnt orange | |
| `uAccentColor` | `rgb(0,0,0)` — black | |
| `uBaseFrequency` | `2.6` | |
| `uAccentFrequency` | `2.2` | present but unused in the final composite |
| `uZoom` | `0.2` desktop / `0.1` mobile | |
| `uAccentOpacity` | `1` | |
| `uNoiseIntensity` | `0` | declared, unused |
| `uOpacityBackground` | `0` → `0.8` | animated on load |
| `uBgProgress` | `0` → `0.25` → `1` | animated on load; drives the circular reveal |
| `uTime` | accumulates `speed * 0.00007` per frame | |
| `u_res` | `vec2(innerWidth, innerHeight)` | |
| *(JS-side)* `speed` | `100` → `30` over 2 s | so time advances at 0.007/frame then settles to 0.0021/frame — very slow |

There is also a `baseThird` colour `rgb(232,201,73)` (yellow) in the palette and a
`uBaseThirdColor` uniform, declared but not consumed by this fragment shader — likely
a variant used elsewhere or left over from iteration.

#### The technique, step by step

1. **Value noise, single octave, no fBm.** A cheap integer-lattice 3D value noise
   (`floor`/`fract`, smootherstep-ish `d*d*(3-2d)` interpolation, `perm()` hash on
   mod-289 arithmetic). Sampled once as `noise(uBaseFrequency * position + uTime)` —
   **one octave only**. The organic quality comes from what it is used *for*, not from
   octave stacking.

2. **Noise drives a rotation, not a colour.** The scalar noise value becomes an angle
   fed to a 2×2 rotation matrix, which rotates the sphere's own `position.xy` (times
   `uZoom`). This is the whole trick: a smoothly varying rotation field applied to a
   coordinate before it is striped.

3. **Stripes.** The rotated coordinate goes through a `lines()` function: multiply by
   scale 10, then `smoothstep(0., .5 + b*.5, abs(sin(x * PI) + b*2.) * .5)`. With
   `b = 0.5` you get thick soft bands; with `b = 0.1` you get thin hard bands. Because
   the coordinate was rotated by a noise field, the stripes bend and swirl — this is
   the classic "wood grain / topographic swirl" look, and it is what reads as the
   liquid gradient on the page.

4. **Two stripe passes, one colour ramp.** The same rotated coordinate is striped twice
   (`b = .5` for the base, `b = .1` for the accent). Base pattern mixes green→orange;
   the accent pattern then mixes that result toward black with an offset
   `accentPattern − (1 − uAccentOpacity)` so `uAccentOpacity` can dissolve the black
   veining out.

5. **A separate 3D simplex noise (Ashima/`webgl-noise` "snoise3") supplies grain.**
   Sampled at `(x + sin(y + t*2), y − t*0.2 − cos(t*2)*0.1, t*5) * 2` and scaled by
   `0.03`. Note the domain warp inside the sample — a sine of the other axis and a
   drifting Y — which makes the grain crawl rather than shimmer in place.

6. **Circular reveal.** In *screen* space (`gl_FragCoord / (u_res * PR) − 0.5`, Y
   corrected by aspect), a soft circle of radius `0.2 + uBgProgress * 10` with blur 2 is
   evaluated against `dot(st,st)*4`. Raised to the 6th power and multiplied by 10, then
   the grain (weighted by `1 − uBgProgress`) is added, then `smoothstep(1., 1., …)`
   — a degenerate smoothstep, i.e. a **hard threshold at 1.0**. Result: a hard-edged
   circular mask that expands from the centre with a noisy, dissolving edge. As
   `bgProgress` goes 0→1 the radius blows past the screen and the noise weight goes to
   zero, so the mask resolves to fully open.

7. **Vignette.** `d = distance(screenCentre, gl_FragCoord) * (1 − uBgProgress) * 0.003`,
   and the final colour is multiplied by `1 − d`. So during the reveal there is a strong
   radial darkening that vanishes as `bgProgress` reaches 1.

8. **Composite.** `mix(vec4(mask), vec4(colour,1), clamp(mask + progress, 0, 1)) * (1−d)`,
   alpha = `uOpacityBackground` (0 → 0.8).

#### Load choreography of the orb

```
preShow():  opacityBackground 0 → 0.8   expo.inOut  2s
            bgProgress        0 → 0.25  expo.inOut  2s
show():     bgProgress     0.25 → 1     expo.inOut  2s
            speed           100 → 30    expo.inOut  2s
```

On a client-side route change back to home, the same thing runs compressed to 1 s.

#### An original equivalent fragment shader

This is my own implementation of the technique above — not their code. Drop in any
public-domain `snoise3` (Ashima/Gustavson) for the grain term.

```glsl
precision highp float;

varying vec3 vPos;            // object-space position of the unit sphere

uniform vec3  uColorA;        // vec3(120.,158.,113.)/255.
uniform vec3  uColorB;        // vec3(224.,148., 66.)/255.
uniform vec3  uColorInk;      // vec3(0.)
uniform float uInkOpacity;    // 1.0
uniform float uFreq;          // 2.6
uniform float uZoom;          // 0.2  (0.1 on mobile)
uniform float uTime;          // += speed * 7e-5 per frame
uniform float uProgress;      // 0 -> 1 reveal
uniform float uAlpha;         // 0 -> 0.8
uniform vec2  uRes;

float snoise3(vec3 v);        // any public-domain 3D simplex noise

// --- cheap 3D value noise -------------------------------------------------
float hash13(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.yzx + 33.33);
  return fract((p.x + p.y) * p.z);
}
float vnoise(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float n = mix(
    mix(mix(hash13(i + vec3(0,0,0)), hash13(i + vec3(1,0,0)), f.x),
        mix(hash13(i + vec3(0,1,0)), hash13(i + vec3(1,1,0)), f.x), f.y),
    mix(mix(hash13(i + vec3(0,0,1)), hash13(i + vec3(1,0,1)), f.x),
        mix(hash13(i + vec3(0,1,1)), hash13(i + vec3(1,1,1)), f.x), f.y), f.z);
  return n;
}

mat2 rot(float a) { return mat2(cos(a), -sin(a), sin(a), cos(a)); }

// soft periodic bands; `soft` in [0,1] widens the falloff
float bands(vec2 p, float soft) {
  p *= 10.0;
  return smoothstep(0.0, 0.5 + soft * 0.5,
                    abs(sin(p.x * 3.14159265) + soft * 2.0) * 0.5);
}

float softDisc(vec2 st, float r, float blur) {
  return 1.0 - smoothstep(r - r * blur, r + r * blur, dot(st, st) * 4.0);
}

void main() {
  // 1-2. one octave of noise -> rotation field applied to the sphere coords
  float n   = vnoise(uFreq * vPos + uTime);
  vec2  swirl = rot(n) * vPos.xy * uZoom;

  // 3-4. two stripe passes over the same swirled coordinate
  float base = bands(swirl, 0.5);
  float ink  = bands(swirl, 0.1);

  vec3 col = mix(uColorA, uColorB, base);
  col = mix(col, uColorInk, ink - (1.0 - uInkOpacity));

  // 5. crawling grain (domain-warped simplex)
  float gx = vPos.x + sin(vPos.y + uTime * 2.0);
  float gy = vPos.y - uTime * 0.2 - cos(uTime * 2.0) * 0.1;
  float grain = snoise3(vec3(gx, gy, uTime * 5.0) * 2.0) * 0.03;

  // 6. expanding hard-edged circular reveal, dissolved by the grain
  vec2 st = gl_FragCoord.xy / uRes - 0.5;
  st.y *= uRes.y / uRes.x;
  float disc = softDisc(st, 0.2 + uProgress * 10.0, 2.0);
  float mask = step(1.0, pow(disc, 6.0) * 10.0 + grain * (1.0 - uProgress));

  // 7. vignette that fades out as the reveal completes
  float vig = length(gl_FragCoord.xy - uRes * 0.5) * (1.0 - uProgress) * 0.003;

  vec3 outCol = mix(vec3(mask), col, clamp(mask + uProgress, 0.0, 1.0)) * (1.0 - vig);
  gl_FragColor = vec4(outCol, uAlpha);
}
```

Multiply `uRes` by `devicePixelRatio` if you set the renderer's pixel ratio, exactly as
they do via the `PR` define.

Cheapest way to get 90% of the look without the sphere: render a full-screen quad, pass
`vPos = vec3(uv - 0.5, 0.0)` scaled to aspect, and keep everything else. You lose the
subtle curvature of the coordinate field.

### 3.3 The refracting glass lens (second mesh)

A separate `SphereGeometry(0.4, 64, 64)`, `side: DoubleSide`, positioned at
`(-1.25, 0.75, -1.5)` and scaled ×3, rendered with a **chromatic-dispersion Fresnel
refraction** material — the classic three.js cube-map refraction shader:

- A `CubeCamera` with a 256px `WebGLCubeRenderTarget` (`RGBFormat`, mipmaps,
  `LinearMipmapLinearFilter`, sRGB encoding), positioned at the sphere's position.
- Each frame: hide the sphere → `cubeCamera.update(renderer, scene)` → show it again.
  So the lens refracts the animated background behind it, live.
- Vertex shader computes `reflect()` and **three** `refract()` vectors at ratios
  `r`, `r*0.99`, `r*0.98` (R/G/B), plus a Fresnel term
  `bias + scale * pow(1 + dot(I, N), power)`.
- Fragment samples the cube map once per channel from the three refract vectors
  (X flipped), and mixes toward the reflected sample by the clamped Fresnel factor.

Shipped values: `mRefractionRatio 0.016`, `mFresnelBias 0.016`,
`mFresnelPower 4.206`, `mFresnelScale 2.442`, `sphereAlpha 0 → 1`,
`refractionPower 0 → 0.75`.

Reveal (`show()`), all `expo.out`:
`sphereAlpha → 1` and `refractionPower → 0.75` over 1 s; `scale 3 → 3.5` and
`position.x −1.25 → −1` over 2 s.

Recipe: this is close enough to the stock three.js `Refraction`/`Fresnel` example that
you can build it from `THREE.CubeCamera` + a ShaderMaterial with those four uniforms.
The only non-obvious bits are (a) hiding the mesh before `cubeCamera.update`, and
(b) the tiny refraction ratio (0.016) — that is what makes it read as a *lens* rather
than a glass ball.

### 3.4 Film-grain post pass

A single `ShaderPass` with `renderToScreen = true`. It samples the render target, then
adds `random(uv') * 0.075` where `uv'` has its Y multiplied by a second random value
seeded from `(uv.y, amount)`. `amount` is a uniform initialised to 0 and never
animated in the shipped build, which means the vertical scramble is static — the grain
is a fixed dither, not an animated one.

Original equivalent:

```glsl
uniform sampler2D tDiffuse;
uniform float uAmount;      // animate this for moving grain
varying vec2 vUv;

float hash21(vec2 p) {
  return fract(cos(dot(p, vec2(23.140692632779267, 2.665144142690225))) * 12345.6789);
}
void main() {
  vec4 c = texture2D(tDiffuse, vUv);
  vec2 q = vUv;
  q.y *= hash21(vec2(q.y, uAmount));
  c.rgb += hash21(q) * 0.075;
  gl_FragColor = c;
}
```

Feed `uAmount = time` if you want it to crawl.

---

## 4. Text reveal choreography

There is **no SplitText and no per-character splitting anywhere.** Copy is pre-split in
the templates (one `<span class="line">` or `<span class="word">` per unit, authored in
the CMS payload as `line_dk` / `line_mb` arrays). Everything else is either a CSS
transition triggered by `is-inview`, or a GSAP stagger.

### 4.1 The default reveal (used by most sections)

Locomotive adds `is-inview`; CSS does the rest. Canonical pattern:

```css
.block {
  opacity: 0;
  transform: translate3d(0, 20%, 0);           /* 20%, 30% or 40% depending on block */
  transition: opacity .4s linear,
              transform .8s cubic-bezier(.19,1,.22,1);
  transition-delay: .1s;
  will-change: transform, opacity;
}
.block.is-inview { opacity: 1; transform: translateZ(0); }
```

Observed variants:

| Block | Y offset | opacity dur | transform dur | delay |
|---|---|---|---|---|
| `.text-cta` | 20% | .4s linear | .8s expo | .1s |
| `.text-cta .title` | — | .8s linear | — | .2s |
| `.project-card-content` | 30% | .8s linear | .8s expo | 0 |
| `#strengths section` | — | .5s linear | 1s expo | .1s |
| `#strengths .content .text` | 40% | .75s linear | 1s expo | **.45s** |
| `#partners .sentence` | — | .8s linear | — | .1s |
| `.img-full-width`, `.img-two-col`, `.team-member`, `.next-project`, `.video-banner` | same shape | | | |

The staggering between a section and its children is done purely with
`transition-delay` (.1s → .2s → .45s), not with JS.

### 4.2 Manifesto — scroll-scrubbed wipe

Each line is:

```html
<span class="line" data-scroll data-scroll-offset="20%"
      data-scroll-position="top" data-scroll-class="manifestoLine">
  <span class="content">
    <span>…the line of text…</span>
    <span class="mask"></span>
  </span>
</span>
```

`.mask` is an absolutely positioned black plate, `width:100%; height:115%;
opacity:.65; transform-origin:100% 50%`, sitting over the text.

Because `data-scroll-class` is `manifestoLine`, Locomotive puts that class (not
`is-inview`) on in-view lines, and they appear in the scroll event's `currentElements`.
The scroll handler then, for every current element carrying `.manifestoLine`:

```
h = scrollY + viewportH − element.top − element.offsetHeight
p = round(4 * h / ((viewportH + element.offsetHeight) / 100))
gsap.to(mask, { x: clamp(p, 0, 100) + '%', duration: 0.25, ease: 'none' })
```

So the mask slides right, off the end of the line, uncovering it. The `× 4` makes it
complete in a quarter of the available travel — the line is fully revealed well before
it reaches the top of the viewport. The 0.25 s linear tween is a smoothing filter on
top of the already-lerped scroll, so the wipe never snaps.

Recipe:

```js
// per rAF, for each line currently in view
const rect = line.getBoundingClientRect();          // relative to viewport
const h    = innerHeight - rect.top - rect.height;  // 0 when line enters bottom
const p    = clamp(Math.round(4 * h / ((innerHeight + rect.height) / 100)), 0, 100);
gsap.to(line.querySelector('.mask'), { xPercent: p, duration: .25, ease: 'none' });
```

`transform-origin: 100% 50%` on the mask means that if you'd rather scale it than
translate it (`scaleX: 1 → 0`), it collapses toward its right edge for the same effect
with one fewer composited pixel.

### 4.3 Hero sentence rotator

The hero cycles a list of `<li>` sentences, one marked `.active`. Each `<li>` contains
two `.container--word` parts, `.part--first` and `.part--second`.

- `setInterval(animateSentence, 4500)` — started by the loader's `animate-sentences`
  event, never cleared.
- Per cycle, with `d = 0.9`:

| Target | Property | Duration | Ease | Position |
|---|---|---|---|---|
| current `.part--first` | `y: -150%` | 0.9 | expo.inOut | 0 |
| current `.part--first` | `opacity: 0` | 0.45 | none | 0 |
| current `.part--second` | `y: -150%` | 0.9 | expo.inOut | 0.1 |
| current `.part--second` | `opacity: 0` | 0.45 | none | 0.1 |
| next both parts | `set y: 150%` | — | — | 0 |
| *swap `.active` class* | — | — | — | 0.55 |
| next `.part--first` | `y: 0` | 0.9 | expo.out | 0.55 |
| next `.part--first` | `opacity: 0 → 1` | 0.45 | none | 0.55 |
| next `.part--second` | `y: 0` | 0.9 | expo.out | 0.65 |
| next `.part--second` | `opacity: 0 → 1` | 0.45 | none | 0.65 |

Wraps to `li:first-child` when there is no `nextElementSibling`.

### 4.4 Partners word wall (`ANIMATE_BRAND_WORDS`)

Fired once, by scroll call, on `#partners .brands .word`:

```
gsap.timeline()
  .fromTo(words, { y: '20%' }, { y: 0, duration: .85, ease: 'expo.out',
                                 force3D: true, stagger: .05 }, 0)
  .to(words,     { opacity: 1, duration: .425, ease: 'none', stagger: .05 }, 0);
```

Note the opacity duration is exactly half the movement duration — a pattern repeated
all over the site (fade completes early, movement keeps easing out).

---

## 5. Preloader and page transitions

### 5.1 First load — the `Loader` component

A full-screen `#loader` containing `.bg`, a `.text-display` with two `<span>`s
("Hello" / "Saigon", localised — the zh build shows 你好 / 西贡), and a `.logo-display`.

The `#home` element gets a `loading` class for the duration; scroll is stopped.

Timeline (absolute positions in seconds, all eases `expo.out`):

| t | Action |
|---|---|
| 0.35 | stop scroll, mark scene loaded, emit `pre-show-background` (orb fades in to 0.8 alpha / 0.25 progress over 2 s) |
| 1.0 | `.text-display span:nth-child(1)` → `y: 0`, `opacity: 1`, 1.2 s |
| 1.1 | `span:nth-child(2)` → same, 1.2 s |
| 4.0 | emit `show-background` (orb `bgProgress 0.25 → 1`, `speed 100 → 30`, 2 s) |
| 4.5 | `span:1` → `y: -100%`, `opacity: 0`, 1.2 s |
| 4.6 | `span:2` → same |
| 5.0 | emit `show-lens` (glass sphere reveal) |
| 5.1 | `.gradient` opacity 0→1; header opacity → 1 (1 s); header `y: -100% → 0` (desktop only); header anchors opacity → 1 and `x: 100% → 0`, stagger .075 |
| 5.2 | `.sentences` containers opacity → 1, stagger .075; `onStart` fires `animate-sentences` (starts the 4.5 s rotator) |
| 5.3 | hero sentence part 1: `y: 60% → 0` (1.2 s) + `opacity 0 → 1` (1 s) |
| 5.4 | hero sentence part 2, same, +0.1 s; **also**: remove `loading`, start scroll, show cookie banner if no `agreement-use-cookie` cookie, `update-scroll` |
| 5.5 | `.scroll-logo` opacity → 1 |

So the intro is a fixed ~6.5 s script; it does not wait on asset loading beyond the
scene-ready event that kicks it off.

### 5.2 Route changes

Nuxt page transition, `mode: 'out-in'`, `css: false`, `appear: false` — every step is
hand-written GSAP.

**`beforeEnter`** always: reset cursor to idle, scroll to top, `update-scroll`
(recalculate Locomotive), store the last route id, and — unless entering home /
saigon-soul / artists — emit `on-project-loading`.

**Loading veil** (`on-project-loading` → `on-project-loaded`), on the loader element:
- in: `.bg` opacity → 1 and `.logo-display` opacity → 1, 1.2 s expo.out, then at
  t=1.21 add class `blink` to the logo (a CSS blink animation).
- out: remove `blink`; `.logo-display` opacity → 0 over 0.3 s at t=0;
  `.bg` opacity → 0 over 0.6 s at t=0.1.

**Leaving home** is the most elaborate exit. On the project card grid, with
`stagger: { duration: .04 }` (i.e. total stagger window 40 ms, not per-item delay):

| t | Targets | Tween |
|---|---|---|
| 0 | `.img-wrapper .img-container` | `y: 10%`, 0.85 s expo.inOut; also disables pointer events on all wrappers |
| 0 | `.img-wrapper` | `y: -15%`, 0.85 s expo.inOut |
| 0 | `.img-container` | `opacity: 0`, 0.85 s expo.inOut |
| 0.05 | `.title` | `y: -100%`, 0.85 s expo.inOut + `opacity: 0`, 0.4 s linear |
| 0.1 | `.types` | same shape |
| 0.25 | `header` | `opacity: 0`, 0.4 s linear |
| 0.4 | page root | `opacity: 0`, 0.4 s linear |

Note the counter-motion: the wrapper goes **up** 15% while its inner image goes **down**
10% — the parallax-on-exit that makes the cards feel like they have depth.

**Entering** a page mirrors this: page `opacity 0→1` (0.4 s linear), header
`opacity 0→1` and `y: -100% → 0` (1 s expo.out, desktop only), anchors `opacity 0→1`
and `x: 100% → 0` (1 s expo.out, stagger .075).

**Leaving saigon-soul / artists** additionally removes the section-specific `.active`
anchor, hides the `.side` anchor list, and re-shows the `lang-zh` switch.

### 5.3 Nav open/close

Timeline on close: nav links, languages, contact link and its arrow →
`opacity: 0`, 0.6 s linear at t=0 (whose `onStart` emits `transition-in` if the route
actually changed); the nav panel → `x: -100%`, 0.75 s expo.inOut at t=0.3.

---

## 6. Marquee, infinite scroll, rotated tile gallery

**There is no JS marquee and no infinite scroll on this site.** Both effects that look
like marquees are Locomotive parallax.

### 6.1 The "Discover Saigon Soul" strip

A single `<p>` with the phrase repeated twice, inside
`.slide-scroll-area { overflow: hidden; margin-left: -6.67vw; margin-right: -6.67vw; }`
(−12.58vw at ≥1024). The `<p>` carries `data-scroll data-scroll-speed="12.5"
data-scroll-direction="horizontal"` → factor 1.25 with the default `middle` position:

```
x = (scrollY + viewportH/2 − elementMid) * −1.25
```

It only moves while in view, so the phrase sweeps across as the section passes the
viewport centre, reversing direction as you scroll back. Some letters are wrapped in
`<i>` purely for the italic mixed-case styling — not for animation.

Recipe: repeat the phrase enough times to overflow, hide overflow, and drive
`translateX` from scroll progress. If you *do* want a true infinite marquee, use two
copies and `x = -(progress * width) % width`.

### 6.2 Rotated tile gallery

Structure: `section.tiles.tiles--rotated#tilesGrid > .tiles__wrap > 4 × .tiles__line >
.tiles__line-img > .img-container > picture > img`.

CSS does all the geometry:

```css
.tiles            { --tiles-height: 140.53vw; height: var(--tiles-height);
                    overflow: hidden; pointer-events: none;
                    margin: 16vw -6.67vw 0; }
@media (min-width:1024px) {
  .tiles          { --tiles-height: 54.84vw; margin: 10.1vw -12.58vw 0; }
}
.tiles__wrap      { --tileswrap-height: var(--tiles-height);
                    height: var(--tileswrap-height); width: 150%;
                    position: absolute; left: 50%; top: 50%;
                    transform: translate3d(-50%,-50%,0); }
.tiles--rotated .tiles__wrap {
                    --tileswrap-height: calc(var(--tiles-height) * 3.2);
                    transform: translate3d(-100%,-50%,0) rotate(45deg); }
@media (min-width:1024px) {
  .tiles--rotated .tiles__wrap {
                    --tileswrap-height: calc(var(--tiles-height) * 2.8);
                    transform: translate3d(-50%,-50%,0) rotate(45deg); }
}
.tiles__line      { display: flex; will-change: transform; }
.tiles--rotated .tiles__line-img {
                    --tile-margin: 2vw;               /* 3vw on mobile */
                    flex: none; margin: var(--tile-margin);
                    position: relative; overflow: hidden;
                    width:  calc(30% - var(--tile-margin) * 2);
                    height: calc(var(--tileswrap-height)/4 - var(--tile-margin)*4/2); }
.tiles--rotated .tiles__line-img img {
                    position: absolute; top: 50%; left: 50%;
                    width: 100%; height: 100%; object-fit: cover;
                    transform: translate3d(-50%,-50%,0) scale(1.1);
                    transition: transform .8s cubic-bezier(.19,1,.22,1); }
```

The whole grid is an over-sized flex wrap (150% wide, 2.8× tall) rotated 45° inside an
`overflow:hidden` section — so you only ever see a diamond-shaped window onto it.

JS contribution is only the parallax attributes:

| Element | speed attr | factor | direction | target |
|---|---|---|---|---|
| `.tiles__line` #1 | `1` | +0.1 | horizontal | `#tilesGrid` |
| `.tiles__line` #2 | `-1` | −0.1 | horizontal | `#tilesGrid` |
| `.tiles__line` #3 | `1` | +0.1 | horizontal | `#tilesGrid` |
| `.tiles__line` #4 | `-1` | −0.1 | horizontal | `#tilesGrid` |
| each `.img-container` | `.5` / `-.5` | ±0.05 | horizontal | *(itself)* |

Rows alternate direction; the inner container of each tile moves at half speed in the
row's direction, so images slide *within* their frames. Because the wrap is rotated 45°,
horizontal translation reads as diagonal drift. `data-scroll-target="#tilesGrid"` makes
all four rows share the section's progress so they stay in lockstep.

Recipe: build the grid flat, rotate the wrapper, then drive each row's `translateX`
from the section's scroll progress with alternating signs, and each image's
`translateX` at half that with the same sign as its row's opposite. Give the image a
`scale(1.1)` headroom so the inner slide never exposes an edge.

---

## 7. Miscellaneous behaviours worth copying

- **Shared 60 fps ticker.** Rather than each component calling `requestAnimationFrame`,
  the app registers callbacks in one queue and runs them from a single rAF that skips
  frames faster than 1000/60 ms. Cheap and it caps work on 120 Hz displays.
- **`sc-up` / `sc-down` classes** on the app root from the scroll direction; the header
  hides on `sc-down`. Suppressed while the nav is open.
- **`white-bg` section class** flips the cursor (and other inverted elements) via CSS
  only, driven by a `data-scroll-call`.
- **Video posters** use the cursor as their play button: no visible control, the cursor
  becomes a "Play"/"Pause" bubble. Worth stealing.
- **`hide-cursor="true"`** attribute on any element hides the custom cursor over it,
  checked per `mousemove` on `event.target`. If you copy this, use `closest()` so it
  works over children.
- **Touch/desktop gate.** The cursor exists only for `.notouch` at ≥1024px; project
  card parallax attributes are stripped below 1024px in `mounted()`.
- **`.img-container` parallax removal on mobile** is done by literally
  `removeAttribute('data-scroll')` before Locomotive scans — a clean pattern for
  conditionally opting out of parallax.

---

## 8. Quick build order if you're reimplementing

1. Smooth scroll (lerp 0.1) + `is-inview` observer + `data-scroll-speed/10` parallax.
2. CSS reveal system: `opacity 0 → 1` linear, `translate3d(0, 20-40%, 0) → 0`
   with `cubic-bezier(.19,1,.22,1)`, staggered by `transition-delay`.
3. Custom cursor: one 10vw circle, `scale 0.075` idle, lerp 0.15, five states.
4. The orb shader (§3.2 recipe) on a full-screen quad first; upgrade to the inside of a
   frustum-filling sphere once it looks right.
5. Loader timeline, then route transitions.
6. Rotated tile grid + horizontal-speed strip last — they are pure CSS plus two
   parallax attributes.

---

*Derived from publicly served bundles for study purposes. Reimplement the behaviours;
do not copy their assets, copy, or source.*
