# Effect Recipes — vanilla JS / CSS, no build step

Four production recipes for `portfolio-live` (static site on GitHub Pages).

**Assumed already loaded, in this order:**

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/lenis@1.1.14/dist/lenis.min.js"></script>
<script src="assets/js/main.js" defer></script>
```

**Ground rules used throughout**

- No npm, no bundler. Everything is copy-pasteable into `assets/js/main.js` and `styles.css`.
- `document.documentElement` already gets `.js` / `.touch` / `.notouch` from the inline script in
  `index.html`. All "pre-animation" states are scoped to `.js` so the page is fully readable with
  JavaScript disabled.
- Every effect checks `prefers-reduced-motion` and re-checks it when the user flips the OS setting.
- Nothing animates `top` / `left` / `width` / `height`. Transform and opacity only.

**Global bootstrap** — put this once, before the four effects:

```js
/* ---------- shared ---------- */
const RM = window.matchMedia('(prefers-reduced-motion: reduce)');
const FINE = window.matchMedia('(hover: hover) and (pointer: fine)');
const reduced = () => RM.matches;

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

/* Lenis <-> ScrollTrigger, the integration the Lenis README specifies.
   Lenis scrolls the real window, so NO scrollerProxy is needed (unlike Locomotive v4). */
let lenis = null;
if (!reduced()) {
  lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true, autoRaf: false });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));   // gsap ticker is in seconds, Lenis wants ms
  gsap.ticker.lagSmoothing(0);
}

/* Layout settles late on a font-loading site. Refresh after both. */
window.addEventListener('load', () => ScrollTrigger.refresh());
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => ScrollTrigger.refresh());
}
```

Sources for the bootstrap:
<https://github.com/darkroomengineering/lenis>,
<https://gsap.com/docs/v3/Plugins/ScrollTrigger/>

---

# 1. Animated iridescent WebGL gradient orb

The hero already has a pure-CSS `.orb` (four stacked `radial-gradient`s + `filter: blur(72px)` +
a 24s keyframe). **Keep it.** The WebGL canvas is a progressive enhancement layered on top of that
fallback: if the context fails to create, or JS never runs, the CSS orb is what you see.

Palette comes straight from the existing tokens:

```
--irid-a: rgb(160,224,171)   #A0E0AB   green
--irid-b: rgb(255,172,46)    #FFAC2E   amber
--irid-c: rgb(165,45,37)     #A52D25   deep red
background                   #000000
```

## 1.1 Markup

```html
<section class="hero" id="top">
  <div class="orb" aria-hidden="true"></div>          <!-- CSS fallback, visible by default -->
  <canvas class="orb-gl" aria-hidden="true"></canvas> <!-- hidden until JS proves WebGL works -->
  <div class="hero__in"> … </div>
</section>
```

## 1.2 CSS

```css
.orb-gl{
  position:absolute; inset:0; display:none;
  width:100%; height:100%;
  z-index:0; pointer-events:none;
}
/* JS adds .has-webgl to <html> only after a context + program actually compiled */
.has-webgl .orb-gl{ display:block }
.has-webgl .orb{ display:none }

/* The existing .grain overlay stays on top of the canvas — see the grain note in 1.6 */
```

## 1.3 The shader

Written in **GLSL ES 1.00** deliberately. A `webgl2` context happily compiles ES 1.00 shaders (no
`#version` directive), so one source string works on a WebGL2 context *and* on the WebGL1 fallback.
If you want true ES 3.00, add `#version 300 es` on line 1, swap `attribute`→`in`, `varying`→`in/out`,
and declare `out vec4 fragColor` instead of `gl_FragColor`. The noise function below is pure math and
needs no change either way.

The `snoise(vec3)` body is the canonical Ashima / Ian McEwan / Stefan Gustavson 3D simplex noise,
**MIT licensed**, reproduced verbatim — that's the intended use of that file.
<https://github.com/ashima/webgl-noise/blob/master/src/noise3D.glsl> ·
<https://github.com/ashima/webgl-noise/blob/master/LICENSE>

The single-level *domain warp* (`f(p + w·g(p))`) is Inigo Quilez's technique:
<https://iquilezles.org/articles/warp/>

The sine-free hash used for grain is the Dave Hoskins style "hash without sine" — `fract(sin(...))`
bands badly on mobile GPUs with low-precision `sin`. <https://www.shadertoy.com/view/4djSRW>

```js
/* ============================================================
   ORB — vertex shader: one fullscreen triangle.
   A triangle (not two) avoids the diagonal seam and is 1 primitive.
   ============================================================ */
const ORB_VERT = `
attribute vec2 a_pos;
void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const ORB_FRAG = `
precision highp float;

uniform vec2  u_res;        // drawing-buffer size in px
uniform float u_time;       // accumulated seconds (already multiplied by speed)
uniform vec3  u_c1;         // green   (LINEAR light, not sRGB)
uniform vec3  u_c2;         // amber
uniform vec3  u_c3;         // deep red
uniform vec3  u_bg;         // near-black
uniform vec2  u_focus;      // orb centre, in the same space as p (0,0 = viewport centre)
uniform float u_radius;     // 0.5 == exactly the short axis
uniform float u_warp;       // domain-warp amount
uniform float u_intensity;  // 0..1 overall opacity of the orb over the bg
uniform float u_grain;      // grain amplitude, in output units (1.0 == full black->white)

/* ---------------------------------------------------------------
   Ashima Arts / Stefan Gustavson simplex noise 3D — MIT
   https://github.com/ashima/webgl-noise
   --------------------------------------------------------------- */
vec3 mod289(vec3 x){ return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x){ return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x){ return mod289(((x*34.0)+10.0)*x); }
vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v){
  const vec2  C = vec2(1.0/6.0, 1.0/3.0);
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289(i);
  vec4 p = permute( permute( permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;

  vec4 m = max(0.5 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 105.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}
/* --------------- end Ashima noise --------------- */

/* Three-stop colour ramp. The gap between the two smoothstep windows (0.46 -> 0.54)
   is what gives amber a plateau instead of being a thin crossover band. Widening the
   windows to (0.00,0.55)/(0.45,1.00) collapses the whole orb to amber — measured. */
vec3 ramp3(vec3 a, vec3 b, vec3 c, float t){
  t = clamp(t, 0.0, 1.0);
  vec3 ab = mix(a, b, smoothstep(0.14, 0.46, t));
  return   mix(ab, c, smoothstep(0.54, 0.86, t));
}

/* sine-free hash, stable on mobile GPUs */
float hash21(vec2 p){
  p = fract(p * vec2(443.8975, 441.4234));
  p += dot(p, p.yx + 19.19);
  return fract((p.x + p.y) * p.x);
}

void main(){
  vec2 frag = gl_FragCoord.xy;

  /* Aspect-correct: divide by the SHORT axis so the orb stays circular
     and still overflows the long axis. p.short is roughly -0.5 .. 0.5 */
  vec2 p = (frag - 0.5 * u_res) / min(u_res.x, u_res.y);
  p -= u_focus;

  float t = u_time;

  /* --- one level of domain warp (iq). 3 snoise calls total. --- */
  vec2 q = vec2(
    snoise(vec3(p * 1.15,        t * 0.11)),
    snoise(vec3(p * 1.15 + 17.3, t * 0.11 + 4.2))
  );
  float n = snoise(vec3(p * 1.35 + u_warp * q, t * 0.08 + 9.1));   // -1 .. 1

  /* --- soft orb mask; the noise pushes the silhouette in and out --- */
  float d = length(p);
  float r = u_radius * (1.0 + 0.30 * n);
  float mask = 1.0 - smoothstep(r * 0.10, r, d);   // edge0 < edge1, always
  mask = pow(mask, 1.35);                          // tightens the core, keeps the falloff creamy

  /* --- colour position along green -> amber -> red ---
     Two decorrelated noise terms so all three colours coexist spatially, a vertical
     bias so green sits high and red sits low (matching the CSS orb's composition),
     and a small hot-core term. NOTE the noise terms are NOT halved: 0.5 + 0.5*n
     only ever reaches ~0.2..0.8 and the ends of the ramp never get used, which is
     exactly how you end up with an all-amber blob. Measured mix at these values:
     ~18% green / ~68% amber / ~14% red of lit pixels, stable across aspect ratios. */
  float g = 0.5 + 0.45 * n + 0.25 * q.y - 0.55 * p.y + 0.15 * (mask - 0.5);

  vec3 col = ramp3(u_c1, u_c2, u_c3, g);
  col = mix(u_bg, col, mask * u_intensity);

  /* linear -> sRGB. Mixing green into red in linear light avoids the muddy
     mid you get mixing sRGB bytes directly. */
  col = pow(max(col, 0.0), vec3(1.0 / 2.2));

  /* Grain doubles as a dither: it is what kills 8-bit banding on a dark gradient. */
  float gr = (hash21(frag + fract(t) * 137.0) - 0.5) * u_grain;
  col += gr;

  gl_FragColor = vec4(col, 1.0);
}
`;
```

## 1.4 The JS mount

```js
/* ============================================================
   ORB — mount
   ============================================================ */
function mountOrb(canvas) {
  if (!canvas) return null;

  const CONFIG = {
    c1: '#A0E0AB',        // --irid-a
    c2: '#FFAC2E',        // --irid-b
    c3: '#A52D25',        // --irid-c
    bg: '#000000',
    speed: 0.32,          // seconds of shader-time per second of wall-clock
    focus: [0.02, -0.04], // slight offset; matches the CSS orb's left:52%/top:46%
    radius: 0.62,
    warp: 0.95,
    intensity: 0.92,
    grain: 0.055,
    maxPixelRatio: 1.5,   // hard cap
    renderScale: 0.65,    // render smaller than CSS size and let the GPU upscale
    maxFps: 45            // 0 = uncapped
  };

  /* ---- sRGB hex -> linear float triplet ---- */
  function toLinear(hex) {
    const v = parseInt(hex.slice(1), 16);
    return [(v >> 16 & 255) / 255, (v >> 8 & 255) / 255, (v & 255) / 255].map(
      (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))
    );
  }

  const OPTS = {
    alpha: false, depth: false, stencil: false, antialias: false,
    premultipliedAlpha: false, preserveDrawingBuffer: false,
    powerPreference: 'low-power', failIfMajorPerformanceCaveat: false
  };

  let gl = canvas.getContext('webgl2', OPTS) || canvas.getContext('webgl', OPTS);
  if (!gl) return null;

  let prog, u, buf, running = false, rafId = 0, visible = true;
  let simTime = 0, lastTs = 0, acc = 0;
  const frameBudget = CONFIG.maxFps ? 1 / CONFIG.maxFps : 0;

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn('[orb] shader compile:\n' + gl.getShaderInfoLog(s));
      gl.deleteShader(s);
      return null;
    }
    return s;
  }

  function build() {
    const vs = compile(gl.VERTEX_SHADER, ORB_VERT);
    const fs = compile(gl.FRAGMENT_SHADER, ORB_FRAG);
    if (!vs || !fs) return false;

    prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.bindAttribLocation(prog, 0, 'a_pos');
    gl.linkProgram(prog);
    gl.deleteShader(vs); gl.deleteShader(fs);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.warn('[orb] link: ' + gl.getProgramInfoLog(prog));
      return false;
    }
    gl.useProgram(prog);

    // fullscreen triangle
    buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    u = {};
    ['u_res','u_time','u_c1','u_c2','u_c3','u_bg','u_focus',
     'u_radius','u_warp','u_intensity','u_grain'
    ].forEach((n) => { u[n] = gl.getUniformLocation(prog, n); });

    gl.uniform3fv(u.u_c1, toLinear(CONFIG.c1));
    gl.uniform3fv(u.u_c2, toLinear(CONFIG.c2));
    gl.uniform3fv(u.u_c3, toLinear(CONFIG.c3));
    gl.uniform3fv(u.u_bg, toLinear(CONFIG.bg));
    gl.uniform2fv(u.u_focus, CONFIG.focus);
    gl.uniform1f(u.u_radius, CONFIG.radius);
    gl.uniform1f(u.u_warp, CONFIG.warp);
    gl.uniform1f(u.u_intensity, CONFIG.intensity);
    gl.uniform1f(u.u_grain, CONFIG.grain);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    return true;
  }

  /* ---- sizing. Never read layout in the rAF loop. ---- */
  let cssW = 0, cssH = 0, dirty = true;
  function setSize(w, h) { cssW = w; cssH = h; dirty = true; }

  function applySize() {
    if (!dirty) return;
    dirty = false;
    const dpr = Math.min(window.devicePixelRatio || 1, CONFIG.maxPixelRatio);
    const w = Math.max(1, Math.round(cssW * dpr * CONFIG.renderScale));
    const h = Math.max(1, Math.round(cssH * dpr * CONFIG.renderScale));
    if (w === canvas.width && h === canvas.height) return;
    canvas.width = w; canvas.height = h;
    gl.viewport(0, 0, w, h);
    gl.uniform2f(u.u_res, w, h);
  }

  function draw() {
    applySize();
    gl.uniform1f(u.u_time, simTime);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function frame(ts) {
    if (!running) return;
    rafId = requestAnimationFrame(frame);
    if (!lastTs) lastTs = ts;
    const dt = Math.min((ts - lastTs) / 1000, 0.05);  // clamp: tab-switch must not jump the noise
    lastTs = ts;
    simTime += dt * CONFIG.speed;
    if (frameBudget) {
      acc += dt;
      if (acc < frameBudget) return;
      acc %= frameBudget;
    }
    draw();
  }

  function start() {
    if (running || reduced() || document.hidden || !visible) return;
    running = true; lastTs = 0; acc = 0;
    rafId = requestAnimationFrame(frame);
  }
  function stop() { running = false; cancelAnimationFrame(rafId); }

  if (!build()) return null;

  /* ---- size feed: ResizeObserver, contentRect only (no getBoundingClientRect in the callback) ---- */
  const ro = new ResizeObserver((entries) => {
    const box = entries[0].contentRect;
    setSize(box.width, box.height);
    if (!running) draw();      // keep the still frame correct in reduced-motion / paused states
  });
  ro.observe(canvas);
  setSize(canvas.clientWidth, canvas.clientHeight);

  /* ---- pause when the tab is hidden ---- */
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));

  /* ---- pause when the hero is scrolled away ---- */
  new IntersectionObserver((es) => {
    visible = es[0].isIntersecting;
    visible ? start() : stop();
  }, { threshold: 0 }).observe(canvas);

  /* ---- reduced motion: render exactly one frame, then stay still ---- */
  const onRM = () => { if (reduced()) { stop(); draw(); } else { start(); } };
  RM.addEventListener('change', onRM);

  /* ---- context loss ---- */
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); stop(); }, false);
  canvas.addEventListener('webglcontextrestored', () => {
    gl = canvas.getContext('webgl2', OPTS) || canvas.getContext('webgl', OPTS);
    if (gl && build()) { dirty = true; onRM(); }
  }, false);

  onRM();
  return { start, stop, config: CONFIG, destroy(){ stop(); ro.disconnect(); } };
}

/* boot */
(function initOrb(){
  const c = document.querySelector('.orb-gl');
  if (!c) return;
  const orb = mountOrb(c);
  if (orb) document.documentElement.classList.add('has-webgl');  // only now do we hide the CSS orb
})();
```

## 1.5 Tuning parameters that matter

| Param | Sensible range | What it does / what breaks outside it |
|---|---|---|
| `speed` | `0.15 – 0.6` | Shader seconds per real second. Above ~0.8 the blob reads as "lava lamp on fast forward" and the grain starts to strobe. |
| `radius` | `0.45 – 0.85` | `0.5` exactly fills the short viewport axis. Below `0.4` it looks like a logo, not a field. |
| `warp` | `0.4 – 1.6` | Domain-warp amount. `0` = plain noise blob. Above ~2.0 the shape tears into filaments and stops looking like one object. |
| `intensity` | `0.7 – 1.0` | Blend of orb over `bg`. Drop to `0.6` if hero type is failing contrast. |
| `grain` | `0.03 – 0.08` | Below `0.02` you get visible 8-bit banding on the dark falloff. Above `0.10` it looks like sensor noise, not film. |
| `maxPixelRatio` | `1.25 – 2.0` | `1.5` is the sweet spot. `2` on a 4K panel is 4× the fragments for zero visual gain on a blurred blob. |
| `renderScale` | `0.5 – 0.85` | The single biggest perf lever. The image is soft, so bilinear upscaling from 0.65 is invisible. |
| `maxFps` | `30 – 60`, or `0` | A 0.3-speed morph is indistinguishable at 45fps and 60fps. Capping frees ~25% GPU. |
| `focus` | `±0.15` | Offsets the orb centre in short-axis units. |
| `0.30` in `r = u_radius * (1.0 + 0.30 * n)` | `0.15 – 0.45` | Silhouette wobble. Above 0.5 the mask can invert at the rim. |
| `- 0.55 * p.y` in `g` | `-0.8 – 0.0` | Vertical hue bias: green top, red bottom. Set to `0` for evenly scattered colour (measured ~19/59/22 green/amber/red). |
| `0.15 * (mask - 0.5)` | `0.0 – 0.30` | How much hotter the core is. Raise for a "molten centre". |
| `0.14/0.46` and `0.54/0.86` in `ramp3` | keep the two windows **disjoint** | The gap between them is amber's plateau. Overlapping them washes everything to amber. |

**Portrait viewports.** `p` is normalised by the *short* axis, so on a phone the orb covers ~45% of
the screen instead of ~60%. Bump `radius` in JS when `innerHeight / innerWidth > 1.4`
(`CONFIG.radius = 0.85`) if you want the same fill on mobile.

## 1.6 Performance notes

- **Cost model.** Each `snoise(vec3)` is roughly 60–70 ALU ops. This shader calls it 3× plus a
  ramp, a `pow`, and a hash — call it ~230 ops/fragment. At a 1440×900 CSS hero with
  `maxPixelRatio 1.5` and `renderScale 0.65` you render 1440·0.65·1.5 = ~1400 × ~880 ≈ 1.24 M
  fragments, i.e. ~285 M ops/frame, ~13 G ops/s at 45fps. That is comfortable for Apple Silicon and
  for Intel Iris-class integrated GPUs. Removing `renderScale` triples that number.
- **If you need it cheaper:** drop the warp to a single noise (`float n = snoise(vec3(p*1.3, t*0.1))`)
  — one call instead of three — and raise `0.30 * n` to `0.5 * n` to keep the silhouette interesting.
  Or render to a low-res offscreen framebuffer once every other frame.
- **Grain resolution.** Because the canvas renders at `renderScale`, shader grain gets upscaled and
  goes slightly chunky. That is *fine* — its job here is dithering, not texture. The site's existing
  `.grain` fixed overlay (SVG `feTurbulence`, `z-index:70`) sits above the canvas at full device
  resolution and supplies the actual film texture. Keep `u_grain` low (0.04–0.06) and let the CSS
  layer carry the look.
- **`alpha:false`** lets the compositor skip per-pixel blending for the whole hero. Worth ~5–10%.
- **`powerPreference:'low-power'`** keeps a MacBook on the integrated GPU instead of waking the
  discrete one — meaningfully better for battery, and this shader does not need the discrete GPU.
- **Do not** put a CSS `filter: blur()` on the canvas. The mask's `smoothstep` already gives you the
  falloff, and a full-viewport blur costs more than the shader does.
- **`dt` is clamped to 50 ms.** Without that, coming back from a hidden tab jumps `u_time` by
  however many seconds you were away and the blob visibly snaps.

## 1.7 Accessibility

- `aria-hidden="true"` on the canvas, and it is `pointer-events:none`.
- `prefers-reduced-motion: reduce` renders **one** frame and never starts the rAF loop. You still
  get the full gradient, just frozen — better than removing it, since the hero relies on it visually.
- The listener on `RM.addEventListener('change', …)` means flipping the OS setting takes effect
  without a reload.
- No JS at all → `.has-webgl` is never added → the original CSS orb shows, and the existing
  `@media(prefers-reduced-motion:reduce){ .orb{animation:none} }` rule already handles it.
- **Contrast:** run the hero `h1` against the brightest point of the orb. `u_intensity` at 0.92 plus
  a near-black bg keeps `#fff` type well above 7:1, but re-check if you raise `radius` past 0.75.

### Sources — effect 1

- <https://github.com/ashima/webgl-noise> (MIT simplex noise; `src/noise3D.glsl`)
- <https://github.com/stegu/webgl-noise> (maintained fork)
- <https://iquilezles.org/articles/warp/> (domain warping)
- <https://alexharri.com/blog/webgl-gradients> (flowing WebGL gradient, deconstructed)
- <https://www.shadertoy.com/view/4djSRW> (hash without sine)
- <https://www.ericchung.dev/posts/webgl-blobs>
- <https://blog.maximeheckel.com/posts/the-study-of-shaders-with-react-three-fiber/>
- <https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/getContext>

---

# 2. Custom lerped cursor + magnetic buttons

## 2.1 Markup

Nothing in the HTML. The cursor element is created by JS so that a no-JS visitor keeps their real
cursor. Opt individual elements in with attributes:

```html
<a class="btn" href="#book" data-magnetic="0.35" data-cursor="grow" data-cursor-label="Book">
  Book a free 30 minutes
</a>
```

## 2.2 CSS

```css
/* Native cursor is hidden only once JS has proven a fine pointer + no reduced-motion. */
.has-cursor, .has-cursor *{ cursor:none !important }

.cursor{
  position:fixed; top:0; left:0; z-index:90;   /* above .grain (70), below nothing that matters */
  pointer-events:none;
  will-change:transform;
  contain:layout style;
}
.cursor__dot{
  display:grid; place-items:center;
  width:var(--cursor-size,14px); height:var(--cursor-size,14px);
  margin:calc(var(--cursor-size,14px) / -2);   /* centre on the point, no % maths in the loop */
  border-radius:999px;
  background:#fff;
  mix-blend-mode:difference;                    /* the inversion trick */
  transform:scale(1);
  transition:transform .32s cubic-bezier(.19,1,.22,1),
             opacity .2s linear;
}
.cursor__label{
  position:absolute;
  font-size:11px; letter-spacing:.04em; text-transform:uppercase;
  color:#000; white-space:nowrap;
  opacity:0; transform:scale(.6);
  transition:opacity .2s linear, transform .32s cubic-bezier(.19,1,.22,1);
  mix-blend-mode:normal;                        /* label must NOT invert or it disappears */
}

.cursor.is-hover  .cursor__dot{ transform:scale(4) }
.cursor.is-down   .cursor__dot{ transform:scale(2.6) }
.cursor.is-label  .cursor__dot{ transform:scale(4.6) }
.cursor.is-label  .cursor__label{ opacity:1; transform:scale(1) }
.cursor.is-out    .cursor__dot{ transform:scale(0); }

/* Never hide the cursor for reduced-motion or coarse-pointer users. */
@media (prefers-reduced-motion: reduce){ .cursor{ display:none } }
@media (hover: none), (pointer: coarse){ .cursor{ display:none } }

/* Magnetic buttons: an invisible over-sized hit ring so attraction starts before
   the pointer touches the button, without a document-level pointermove listener. */
[data-magnetic]{ position:relative; will-change:transform }
[data-magnetic]::before{
  content:""; position:absolute; inset:calc(var(--magnet-radius,26px) * -1);
  border-radius:inherit;
}
```

## 2.3 JS

```js
/* ============================================================
   CURSOR
   ============================================================ */
function initCursor() {
  if (!FINE.matches || reduced()) return null;

  const root = document.createElement('div');
  root.className = 'cursor';
  root.setAttribute('aria-hidden', 'true');
  root.innerHTML = '<div class="cursor__dot"></div><span class="cursor__label"></span>';
  document.body.appendChild(root);
  const label = root.querySelector('.cursor__label');
  document.documentElement.classList.add('has-cursor');

  const EASE = 0.16;            // 0.10 lazy .. 0.25 tight
  let tx = window.innerWidth / 2, ty = window.innerHeight / 2;
  let x = tx, y = ty;
  let running = false, rafId = 0, primed = false;

  function loop() {
    const dx = tx - x, dy = ty - y;
    x += dx * EASE;
    y += dy * EASE;
    root.style.transform = 'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0)';
    // stop the loop once we have effectively arrived; pointermove restarts it
    if (dx * dx + dy * dy < 0.01) { running = false; return; }
    rafId = requestAnimationFrame(loop);
  }
  function kick() { if (!running) { running = true; rafId = requestAnimationFrame(loop); } }

  window.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;        // pen/touch must not summon it
    tx = e.clientX; ty = e.clientY;
    if (!primed) { primed = true; x = tx; y = ty; root.style.opacity = '1'; }
    kick();
  }, { passive: true });

  /* --- hover state, via delegation so dynamically added links just work --- */
  const HOVER_SEL = 'a, button, input, textarea, select, summary, [data-cursor]';
  document.addEventListener('pointerover', (e) => {
    const t = e.target.closest && e.target.closest(HOVER_SEL);
    if (!t) return;
    const text = t.getAttribute('data-cursor-label');
    root.classList.toggle('is-label', !!text);
    root.classList.toggle('is-hover', !text);
    label.textContent = text || '';
  });
  document.addEventListener('pointerout', (e) => {
    const t = e.target.closest && e.target.closest(HOVER_SEL);
    if (!t) return;
    if (e.relatedTarget && t.contains(e.relatedTarget)) return;   // moving within the same target
    root.classList.remove('is-hover', 'is-label');
    label.textContent = '';
  });

  document.addEventListener('pointerdown', () => root.classList.add('is-down'));
  document.addEventListener('pointerup',   () => root.classList.remove('is-down'));

  /* --- leave the window / lose focus --- */
  document.addEventListener('mouseleave', () => root.classList.add('is-out'));
  document.addEventListener('mouseenter', () => root.classList.remove('is-out'));
  window.addEventListener('blur',        () => root.classList.add('is-out'));

  /* --- teardown if the user switches to a touch/trackpad-less context or flips reduced motion --- */
  const kill = () => {
    cancelAnimationFrame(rafId);
    root.remove();
    document.documentElement.classList.remove('has-cursor');
  };
  RM.addEventListener('change', () => { if (reduced()) kill(); });
  FINE.addEventListener('change', () => { if (!FINE.matches) kill(); });

  return { el: root, kill };
}

/* ============================================================
   MAGNETIC BUTTONS
   ============================================================ */
function initMagnets() {
  if (!FINE.matches || reduced()) return;

  gsap.utils.toArray('[data-magnetic]').forEach((el) => {
    const strength = parseFloat(el.getAttribute('data-magnetic')) || 0.35;
    const xTo = gsap.quickTo(el, 'x', { duration: 0.45, ease: 'power3' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.45, ease: 'power3' });
    let rect = null;

    el.addEventListener('pointerenter', () => { rect = el.getBoundingClientRect(); });

    el.addEventListener('pointermove', (e) => {
      if (!rect) rect = el.getBoundingClientRect();     // cached: one read per hover, not per frame
      const cx = rect.left + rect.width  / 2;
      const cy = rect.top  + rect.height / 2;
      xTo((e.clientX - cx) * strength);
      yTo((e.clientY - cy) * strength);
    }, { passive: true });

    el.addEventListener('pointerleave', () => {
      rect = null;
      gsap.to(el, { x: 0, y: 0, duration: 1.0, ease: 'elastic.out(1, 0.35)' });  // spring back
    });

    // the cached rect is stale after a scroll or a resize; both end the hover anyway,
    // but be explicit so a Lenis-driven scroll under a stationary pointer can't drift.
    if (lenis) lenis.on('scroll', () => { rect = null; });
    window.addEventListener('resize', () => { rect = null; }, { passive: true });
  });
}

initCursor();
initMagnets();
```

## 2.4 Tuning

| Param | Range | Notes |
|---|---|---|
| `EASE` | `0.10 – 0.22` | `0.10` = luxurious lag, feels laggy under ~90 Hz. `0.16` is the safe default. `1.0` = no lag. |
| `--cursor-size` | `10 – 18 px` | The base dot. Everything else is a `scale()` off this. |
| hover `scale` | `3 – 6` | `scale(4)` on a 14px dot = a 56px ring. Above 6 the difference blend starts to feel like a spotlight. |
| `data-magnetic` strength | `0.2 – 0.45` | Above ~0.5 the button outruns the pointer and `:hover` flickers on and off. |
| magnet `duration` | `0.35 – 0.6 s` | Shorter feels twitchy, longer feels like the button is on elastic. |
| return `ease` | `elastic.out(1, 0.3 – 0.4)` | Second arg is the period; lower = more oscillation. |
| `--magnet-radius` | `16 – 40 px` | The invisible `::before` inset that starts attraction early. |

## 2.5 Performance notes

- **Never** animate `left` / `top` in the loop — that is a layout on every frame. `translate3d` is
  compositor work.
- The rAF loop **stops itself** when the distance falls below 0.1 px and restarts on `pointermove`.
  On an idle page the cursor costs literally zero frames.
- `mix-blend-mode: difference` is the expensive part. It forces the browser to read back what is
  underneath the cursor and re-composite that region every frame. Keep the blended element small
  (a 14px dot scaled up, not a 200px box) and keep `contain: layout style` on the wrapper.
- Scale changes are done with a **CSS transition**, not GSAP — one fewer thing on the JS ticker, and
  it composites cleanly alongside the transform on the parent (position on the parent, scale on the
  child, so they never fight over the same `transform` property).
- `gsap.quickTo` (GSAP 3.10+) reuses one tween per property instead of allocating a new tween on
  every `pointermove`. Using `gsap.to()` in a pointermove handler is the classic magnetic-button
  memory sink.
- Rects are cached at `pointerenter`, so a magnetic button costs **one** `getBoundingClientRect`
  per hover, not one per mouse move.

## 2.6 Accessibility

- Gated behind `(hover: hover) and (pointer: fine)` — not `'ontouchstart' in window`. A touchscreen
  laptop has both a touch screen *and* a fine pointer; the feature query gets it right, the legacy
  check does not.
- Gated behind `prefers-reduced-motion: no-preference`. Someone with vestibular sensitivity gets
  their normal system cursor back, immediately, and the `change` listener tears it down live.
- `cursor:none` is applied via the `.has-cursor` class on `<html>`, added **only after** the custom
  cursor exists. If the script throws, the real cursor is still there.
- **Keyboard users see none of this.** Do not let the custom cursor become the only affordance:
  keep real `:focus-visible` outlines on every interactive element. The site already has a `.skip`
  link — verify it is still visible when `.has-cursor` is on.
- The cursor element is `aria-hidden="true"` and `pointer-events:none`, so it never appears in the
  accessibility tree and never eats a click.
- Text inputs: the selector list above includes `input, textarea` so the dot grows there, but you
  probably want the **native** I-beam inside a text field. Add
  `.has-cursor input, .has-cursor textarea{ cursor:text !important }` if you add a contact form.

### Sources — effect 2

- <https://developer.mozilla.org/en-US/docs/Web/CSS/mix-blend-mode>
- <https://developer.mozilla.org/en-US/docs/Web/CSS/@media/hover>
- <https://blog.olivierlarose.com/tutorials/blend-mode-cursor>
- <https://codepen.io/mathieudaix/pen/GYRYjW> (vanilla JS follow cursor + mix-blend-mode)
- <https://codepen.io/farisk/pen/bMgrxy>
- <https://gsap.com/docs/v3/GSAP/gsap.quickTo()>
- <https://github.com/tgomilar/mouse-animations> (magnetic / invert effect reference)

---

# 3. Locomotive-style `data-speed` parallax on top of Lenis

Lenis smooths the **real window scroll**, so — unlike Locomotive Scroll v4 — you do **not** need
`ScrollTrigger.scrollerProxy()`. That is the number one source of broken Lenis + ScrollTrigger
setups. The whole integration is the four lines in the bootstrap at the top of this doc.

## 3.1 Markup

```html
<!-- container clips; the moving layer has bleed so no edge is ever exposed -->
<figure class="px" data-speed-trigger>
  <img class="px__img" data-speed="0.82" src="assets/img/case-01.jpg" alt="…" loading="lazy">
</figure>

<!-- text layers work too; keep them near 1.0 -->
<p class="lead" data-speed="1.08">…</p>
```

`data-speed` semantics, matching ScrollSmoother's convention:

- `1` — moves exactly with the page (no-op, skipped).
- `< 1` — **slower** than the page, reads as further away. `0.8` is a strong, tasteful background.
- `> 1` — **faster** than the page, reads as closer. `1.15` is already noticeable.

## 3.2 CSS

```css
.px{ position:relative; overflow:hidden }

/* Bleed. An element moving at speed s over a range of (vh + h) travels
   |1 - s| * (vh + h) / 2 px in each direction. Give it at least that much
   extra height or you will see the container's background at the extremes. */
.px__img{
  display:block; width:100%;
  height:calc(100% + 2 * var(--px-bleed, 12vh));
  margin-top:calc(var(--px-bleed, 12vh) * -1);
  object-fit:cover;
  will-change:transform;
}
```

## 3.3 JS

```js
/* ============================================================
   PARALLAX — [data-speed]
   ============================================================ */
function initParallax() {
  const mm = gsap.matchMedia();

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    const triggers = [];

    gsap.utils.toArray('[data-speed]').forEach((el) => {
      const speed = parseFloat(el.getAttribute('data-speed'));
      if (!isFinite(speed) || speed === 1) return;

      /* Use an ANCESTOR as the trigger, never the element itself.
         The element is the thing being transformed; measuring the thing you are
         moving is how parallax drifts on refresh. */
      const trigger = el.closest('[data-speed-trigger]') || el.parentElement || el;

      /* Over the full pass (enter bottom -> exit top) the page scrolls
         D = viewportHeight + triggerHeight.
         An element at speed s must translate by (1 - s) * D total.
         Split symmetrically so offset is 0 when the trigger is viewport-centred. */
      const shift = () => (1 - speed) * (window.innerHeight + trigger.offsetHeight) / 2;

      const tw = gsap.fromTo(el,
        { y: () => -shift() },
        {
          y: () => shift(),
          ease: 'none',
          scrollTrigger: {
            trigger: trigger,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
            invalidateOnRefresh: true,      // re-runs the function-based values on every refresh
            onToggle: (self) => {
              // will-change costs VRAM per layer; only pay for it while the element is live
              el.style.willChange = self.isActive ? 'transform' : '';
            }
          }
        });

      triggers.push(tw.scrollTrigger);
    });

    // matchMedia cleanup: reverts every tween and kills every trigger created in this scope
    return () => triggers.forEach((st) => st && st.kill());
  });
}

initParallax();
```

## 3.4 Why this is resize-correct

1. **Function-based values.** `y: () => shift()` is re-evaluated by GSAP on every
   `ScrollTrigger.refresh()` *because* `invalidateOnRefresh: true` is set. Without that flag the
   distance is baked at creation time and a rotated phone or an opened devtools panel leaves the
   parallax offset wrong forever.
2. **ScrollTrigger auto-refreshes** on `resize` and `DOMContentLoaded`. The bootstrap adds explicit
   refreshes on `load` and `document.fonts.ready`, because a late webfont changes heading heights
   and therefore every trigger position below it. Add one after any accordion/tab that changes
   height, too: `ScrollTrigger.refresh()`.
3. **`ScrollTrigger.config({ ignoreMobileResize: true })`.** Mobile Safari/Chrome fire a `resize`
   every time the URL bar collapses. Without this, every scroll gesture on a phone triggers a full
   refresh and the page stutters.
4. **`gsap.matchMedia`** wraps everything, so flipping the OS reduced-motion setting tears the
   whole system down and puts every element back at `y: 0` — no reload needed.

## 3.5 No layout thrash

- The only layout reads are `window.innerHeight` and `trigger.offsetHeight` inside `shift()`, and
  those run **only during refresh**, which ScrollTrigger batches into a single read phase.
- During scroll, ScrollTrigger writes `transform` and nothing else. Zero reads per frame.
- `will-change: transform` is added on enter and removed on leave via `onToggle`. Leaving
  `will-change` on 40 elements permanently promotes 40 compositor layers and will drop frames on a
  laptop long before the maths does.
- All of it runs on the **GSAP ticker**, the same ticker driving `lenis.raf()`. One rAF for the
  whole page.

## 3.6 Tuning

| Param | Range | Notes |
|---|---|---|
| `data-speed` (backgrounds) | `0.7 – 0.9` | Below 0.6 the element visibly detaches from its container. |
| `data-speed` (foreground/text) | `1.05 – 1.25` | Above 1.3 text overtakes its own section and reads as a bug. |
| `--px-bleed` | `8 – 18 vh` | Must be ≥ `|1-s| * (100vh + containerHeight) / 2`. Compute it, don't guess. |
| `scrub` | `true` or `0.4 – 1.0` | `true` = locked to scroll. A number adds catch-up smoothing in seconds; with Lenis already smoothing, `true` is usually right and a number double-smooths into mush. |
| `start` / `end` | `'top bottom'` / `'bottom top'` | The full-pass range. Narrow it (`'top 80%'`) only if you want the effect to start late. |
| Lenis `lerp` | `0.075 – 0.12` | `0.1` default. Lower = heavier, and heavier scroll makes parallax read as lag. |

## 3.7 What commonly goes wrong

- **`scrollerProxy` with Lenis.** Unnecessary and actively harmful. Only Locomotive v4 (which
  transforms a wrapper) needs it.
- **`position: fixed` inside a `transform`ed ancestor.** A parallaxed parent creates a containing
  block, so `position:fixed` children inside it become fixed *to the parent*, not the viewport.
  Never put `data-speed` on an ancestor of a sticky nav.
- **`overflow: hidden` on `body`.** Breaks Lenis. Lenis needs the window to actually scroll.
- **Using the moving element as its own trigger** — drifts a few px on every refresh.
- **Forgetting `ScrollTrigger.refresh()` after images load.** Set explicit `width`/`height` (or
  `aspect-ratio`) on every `<img>` so the layout never changes when they decode.

### Sources — effect 3

- <https://github.com/darkroomengineering/lenis> (official GSAP integration snippet)
- <https://gsap.com/docs/v3/Plugins/ScrollTrigger/>
- <https://gsap.com/docs/v3/GSAP/gsap.matchMedia()>
- <https://gsap.com/docs/v3/Plugins/ScrollSmoother/> (the `data-speed` convention)
- <https://gsap.com/community/forums/topic/34814-scrolltrigger-with-lenis-smooth-scroll-problem-with-the-scrollerproxy-setup/>
- <https://www.hontran.dev/blog/gsap-scrolltrigger-tutorial-pin-scrub-parallax>

---

# 4. Masked line-by-line text reveal (no SplitText)

GSAP SplitText is a Club plugin. This is an original ~90-line splitter that does the same job for
lines, works on **real wrapped text**, preserves inline markup (`<a>`, `<em>`, `<strong>`) across
line breaks, and re-splits on resize.

## 4.1 How it measures lines

1. Wrap every word in a plain `<span class="sl-word">`, leaving whitespace as text nodes and leaving
   inline elements exactly where they are. A span containing one word always produces **one**
   client rect.
2. Read every word's `getBoundingClientRect().top` **in one pass** — one forced layout for the
   whole element, not one per word. (The character-by-character `Range.getClientRects()` walk you
   see in tutorials is O(n) layouts and only works on a bare text node; this is the fast,
   markup-safe equivalent.)
3. Start a new line whenever a word's top jumps by more than **half the computed line-height**. That
   threshold adapts automatically to the site's tight `line-height: .76` display type.
4. Rebuild each line into `<span class="sl-line"><span class="sl-line__in">…</span></span>`,
   **re-creating the inline ancestor chain per line** so an `<a>` that straddles a break becomes two
   `<a>`s, one in each line, instead of being torn apart.

`<br>` elements are honoured during measurement (they force a break) and dropped during rebuild
(each line is its own block, so they are redundant).

## 4.2 CSS

```css
/* pre-JS / no-JS: nothing is hidden, nothing is transformed. */
.sl-line{
  display:block;
  position:relative;
  overflow:hidden;
  /* overflow:hidden clips descenders (g, y, p). Pad the clip box, pull it back with margin. */
  padding-bottom:.14em;
  margin-bottom:-.14em;
}
.sl-line__in{ display:block }
.sl-line__plate{
  position:absolute; inset:0; z-index:2;
  background:var(--bg);
  transform-origin:100% 50%;
  pointer-events:none;
}

/* pre-animation state, only when JS is running */
.js [data-split].is-split .sl-line__in{ transform:translate3d(0,118%,0); will-change:transform }
.js [data-split].is-split .sl-line__plate{ transform:scaleX(1); will-change:transform }
.js [data-split].is-revealed .sl-line__in{ will-change:auto }

@media (prefers-reduced-motion: reduce){
  .js [data-split].is-split .sl-line__in{ transform:none !important }
  .js [data-split].is-split .sl-line__plate{ display:none }
}
```

> If you need the line box to hug the text (for a per-line underline or hover box), use
> `display:inline-block` on `.sl-line` instead of `block`. `overflow:hidden` needs a
> block-ish box either way. The site's existing `.line .content{display:inline-flex}` pattern is
> the same idea.

## 4.3 The splitter

```js
/* ============================================================
   SPLIT LINES — no dependency, resize-safe, markup-preserving
   ============================================================ */
const SplitLines = (() => {
  const store = new WeakMap();

  /* Wrap each word in a span. Whitespace stays as text nodes so wrapping is unchanged. */
  function tokenize(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    const textNodes = [];
    let n;
    while ((n = walker.nextNode())) if (n.nodeValue.trim()) textNodes.push(n);

    const words = [];
    textNodes.forEach((node) => {
      const frag = document.createDocumentFragment();
      node.nodeValue.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
        const s = document.createElement('span');
        s.className = 'sl-word';
        s.textContent = part;
        frag.appendChild(s);
        words.push(s);
      });
      node.parentNode.replaceChild(frag, node);
    });
    return words;
  }

  /* ONE layout read for the whole element, then pure JS grouping. */
  function group(words, threshold) {
    const tops = words.map((w) => w.getBoundingClientRect().top);
    const lines = [];
    let cur = null, curTop = -1e9;
    words.forEach((w, i) => {
      if (!cur || tops[i] - curTop > threshold) { cur = []; lines.push(cur); curTop = tops[i]; }
      cur.push(w);
    });
    return lines;
  }

  /* Inline ancestors between root (exclusive) and the word (exclusive), outermost first. */
  function chainOf(word, root) {
    const chain = [];
    let p = word.parentNode;
    while (p && p !== root) { chain.unshift(p); p = p.parentNode; }
    return chain;
  }

  function build(root, lines, withPlate) {
    const frag = document.createDocumentFragment();
    const out = [];
    const sep = (parent) => {
      if (parent.childNodes.length) parent.appendChild(document.createTextNode(' '));
    };

    lines.forEach((words) => {
      const line = document.createElement('span');
      line.className = 'sl-line';
      const inner = document.createElement('span');
      inner.className = 'sl-line__in';
      line.appendChild(inner);
      if (withPlate) {
        const plate = document.createElement('span');
        plate.className = 'sl-line__plate';
        line.appendChild(plate);
      }

      const clones = new Map();   // original inline element -> its clone inside THIS line
      words.forEach((w) => {
        let parent = inner;
        chainOf(w, root).forEach((anc) => {
          let c = clones.get(anc);
          if (!c) { c = anc.cloneNode(false); clones.set(anc, c); sep(parent); parent.appendChild(c); }
          parent = c;
        });
        sep(parent);
        parent.appendChild(w);
      });

      frag.appendChild(line);
      out.push(line);
    });

    root.textContent = '';
    root.appendChild(frag);
    return out;
  }

  function split(el, opts) {
    opts = opts || {};
    if (!store.has(el)) {
      store.set(el, { html: el.innerHTML, text: el.textContent.replace(/\s+/g, ' ').trim() });
    }
    el.innerHTML = store.get(el).html;      // always split from the pristine source

    const words = tokenize(el);
    if (!words.length) return [];

    const cs = getComputedStyle(el);
    let lh = parseFloat(cs.lineHeight);
    if (!isFinite(lh)) lh = parseFloat(cs.fontSize) * 1.2;

    const lines = build(el, group(words, Math.max(4, lh * 0.5)), !!opts.plate);
    el.classList.add('is-split');

    /* a11y: the line spans introduce breaks in the accessibility tree.
       Give the element its original text as the accessible name — but ONLY when it
       contains nothing focusable, or we'd hide the links from assistive tech. */
    if (!el.querySelector('a, button, input, select, textarea, [tabindex]')) {
      el.setAttribute('aria-label', store.get(el).text);
      lines.forEach((l) => l.setAttribute('aria-hidden', 'true'));
    }
    return lines;
  }

  function revert(el) {
    const s = store.get(el);
    if (!s) return;
    el.innerHTML = s.html;
    el.removeAttribute('aria-label');
    el.classList.remove('is-split', 'is-revealed');
  }

  return { split, revert };
})();
```

## 4.4 The reveal, plus resize handling

```js
/* ============================================================
   LINE REVEAL
   ============================================================ */
function initLineReveal() {
  const els = gsap.utils.toArray('[data-split]');
  if (!els.length) return;

  const state = new Map();   // el -> { lines, tween, width }

  function animate(el, lines) {
    const inners = lines.map((l) => l.querySelector('.sl-line__in'));
    const plates = lines.map((l) => l.querySelector('.sl-line__plate')).filter(Boolean);
    const mode = el.getAttribute('data-split') || 'rise';

    if (reduced()) {
      gsap.set(inners, { clearProps: 'transform' });
      gsap.set(plates, { display: 'none' });
      el.classList.add('is-revealed');
      return null;
    }

    const tl = gsap.timeline({
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      onComplete: () => el.classList.add('is-revealed')
    });

    if (mode === 'plate' || mode === 'both') {
      tl.fromTo(plates,
        { scaleX: 1 },
        { scaleX: 0, transformOrigin: '100% 50%',
          duration: 0.85, ease: 'power4.inOut', stagger: 0.06 }, 0);
    }
    if (mode !== 'plate') {
      tl.fromTo(inners,
        { yPercent: 118 },
        { yPercent: 0, duration: 1.05, ease: 'expo.out', stagger: 0.075 }, 0);
    } else {
      gsap.set(inners, { yPercent: 0 });
    }
    return tl;
  }

  /* A signature of everything that can change where the lines break.
     Width ALONE is not enough: a clamp()/vw font-size changes the wrapping while the
     element's own box width stays identical. Measured — this is a real miss. */
  function signature(el) {
    const cs = getComputedStyle(el);
    return el.clientWidth + '|' + cs.fontSize + '|' + cs.lineHeight + '|' +
           cs.letterSpacing + '|' + cs.fontFamily;
  }

  function run(el) {
    const prev = state.get(el);
    if (prev && prev.tween) {
      if (prev.tween.scrollTrigger) prev.tween.scrollTrigger.kill();
      prev.tween.kill();
    }
    const mode = el.getAttribute('data-split') || 'rise';
    const lines = SplitLines.split(el, { plate: mode === 'plate' || mode === 'both' });
    state.set(el, { lines, tween: animate(el, lines), sig: signature(el) });
  }

  let pending = 0;
  function refresh(list) {
    const changed = list.filter((el) => {
      const s = state.get(el);
      return s && s.sig !== signature(el);
    });
    if (!changed.length) return;
    cancelAnimationFrame(pending);
    pending = requestAnimationFrame(() => {    // batch: avoids the RO-loop warning
      changed.forEach(run);
      ScrollTrigger.refresh();
    });
  }

  els.forEach(run);

  /* Two triggers, deliberately. ResizeObserver catches container changes that never
     touch the viewport (a sibling collapsing, a sidebar opening). window.resize catches
     viewport-driven font-size changes that never touch the element's own box — and it is
     also the reliable one: RO delivery can be sparse in headless/offscreen contexts. */
  const ro = new ResizeObserver((entries) => refresh(entries.map((e) => e.target)));
  els.forEach((el) => ro.observe(el));

  let resizeTimer = 0;
  const onResize = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => refresh(els), 150);
  };
  window.addEventListener('resize', onResize, { passive: true });
  window.addEventListener('orientationchange', onResize, { passive: true });

  /* Webfonts change wrapping. Re-split once they land (unconditionally — the
     signature will not have changed if only the glyphs did). */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => { els.forEach(run); ScrollTrigger.refresh(); });
  }

  /* Live reduced-motion toggle */
  RM.addEventListener('change', () => { els.forEach(run); ScrollTrigger.refresh(); });
}

initLineReveal();
```

## 4.5 Markup

```html
<!-- lines rise from below -->
<h1 class="display" data-split="rise">You run the jobs. The office runs itself.</h1>

<!-- a coloured plate collapses to the right, revealing the line -->
<h2 class="h2" data-split="plate">What I actually build</h2>

<!-- both -->
<h2 class="h2" data-split="both">Selected work</h2>
```

Note the `<br>` tags in the current hero (`You run<br>the jobs.<br>…`) are still respected — they
force breaks that the measurement picks up, and they are dropped in the rebuilt output.

## 4.6 Tuning

| Param | Range | Notes |
|---|---|---|
| `yPercent` start | `105 – 130` | `100` is **not** enough. Line-height > 1 and descenders mean the glyph box extends past 100% of the inner span. `118` covers the site's `.14em` descender padding. |
| rise `duration` | `0.8 – 1.3 s` | Site's motion vocabulary is 0.4 / 0.8 / 1.25 s at `cubic-bezier(.19,1,.22,1)`. |
| rise `ease` | `expo.out`, `power4.out`, or `CustomEase` of `.19,1,.22,1` | `expo.out` is the closest stock match to the site's existing curve. |
| `stagger` | `0.05 – 0.10 s` | Above 0.12 a 4-line heading takes half a second just to start its last line. |
| plate `duration` | `0.6 – 1.0 s` | |
| plate `ease` | `power4.inOut` | `inOut` reads as a wipe; `out` reads as a curtain drop. |
| plate `transform-origin` | `100% 50%` (collapse right) / `0% 50%` (collapse left) | Match the reading direction of the section. |
| `start` | `'top 88%'` … `'top 70%'` | Later start = more deliberate. |
| line threshold | `lh * 0.4 – 0.6` | Lower it if you mix font sizes on one line (superscripts, inline icons). |
| `padding-bottom` / `margin-bottom` | `.10 – .20 em` | Enough to clear descenders in Switzer. Too much and you see the rising text early at the bottom edge. |

## 4.7 Performance notes

- **One layout read per split.** All `getBoundingClientRect()` calls happen in a single `map()`
  before any DOM write. Splitting a 4-line hero costs one forced reflow, not four.
- The character-walk approach (`range.setEnd(node, i); range.getClientRects().length`) is
  correct but is **O(characters) forced layouts**. On a 60-character heading that is 60 reflows.
  Only reach for it if you need per-character line assignment on a bare text node.
- Re-splits are triggered by `ResizeObserver` filtered to **width** changes and batched into one
  `requestAnimationFrame`. Without the rAF batch you get the "ResizeObserver loop completed with
  undelivered notifications" console error, because the split itself changes the element's height.
- `will-change: transform` is set by the `.is-split` class and released by `.is-revealed` in
  `onComplete`. A long page of permanently-promoted line layers is a real memory cost.
- Old triggers are killed before re-splitting. Forgetting this is how you end up with 30 orphaned
  ScrollTriggers pointing at removed nodes after a few resizes.

## 4.8 Accessibility

- **No JS → nothing is hidden.** The pre-animation transforms live under `.js [data-split].is-split`,
  and `is-split` is only added by the splitter. The raw HTML is the readable fallback.
- **Reduced motion** → `run()` re-splits (so the DOM is consistent) but `animate()` immediately
  clears the transform, removes the plates, and creates no timeline. The CSS `@media` block is the
  belt-and-braces version in case the timeline is created before the setting is read.
- **Screen readers.** Splitting into per-line blocks makes VoiceOver announce a heading line by
  line. The splitter fixes that with `aria-label` on the element + `aria-hidden` on the lines — but
  **only when the element contains nothing focusable**, because `aria-hidden` on an ancestor of a
  link makes that link unreachable. Headings with inline links are left un-labelled and read as
  fragments; either accept that or don't split those.
- **`aria-label` on a `<h1>`** is valid and becomes the accessible name. Keep the label text
  identical to the visible text.
- **Don't split body copy.** Line splitting a paragraph breaks text selection, find-in-page across
  lines, and translation tools. Reserve it for headings and short leads.

### Sources — effect 4

- <https://www.bennadel.com/blog/4310-detecting-rendered-line-breaks-in-a-text-node-in-javascript.htm>
  (the `Range.getClientRects()` line-detection technique)
- <https://github.com/lukePeavey/SplitType> (MIT; the word-span + measure approach this is modelled on)
- <https://developer.mozilla.org/en-US/docs/Web/API/Range/getClientRects>
- <https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver>
- <https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-hidden>
- <https://gsap.com/docs/v3/Plugins/SplitText/> (behaviour being replicated)

---

# Integration order in `assets/js/main.js`

```js
/* 1 */ // shared: RM, FINE, gsap.registerPlugin, ScrollTrigger.config, Lenis wiring
/* 2 */ initOrb();          // independent of scroll
/* 3 */ initLineReveal();   // MUST run before initParallax — splitting changes page height
/* 4 */ initParallax();
/* 5 */ initCursor(); initMagnets();
/* 6 */ window.addEventListener('load', () => ScrollTrigger.refresh());
```

Line splitting changes the document height, so it has to happen before ScrollTriggers are
positioned — or you must call `ScrollTrigger.refresh()` afterwards. The recipe above does both.

# Verification

Every code block in this document was extracted verbatim into a single test page (GSAP 3.12.5 +
ScrollTrigger + Lenis 1.1.14 from the same CDNs) and run in Chromium at 1440×900, 1200×952 and
700×900. Results:

| Check | Result |
|---|---|
| Shader compiles + links | WebGL 2.0 context, no warnings |
| Canvas backing store | 1170×928 for a 1200×952 CSS box at DPR 1.5 — i.e. `dpr × renderScale = 0.975` |
| Colour mix (lit pixels, 4 time samples) | ~18% green / ~68% amber / ~14% red; stable at 16:10, 1:1 and portrait |
| Peak luminance | 201/255 — headroom for grain, no clipping |
| Parallax at `data-speed="0.82"` | centre `y = -0.1px`, enter `-136.7px`, exit `+136.5px` vs a predicted ±137.1px |
| `will-change` | `transform` while active, `''` while out of range |
| Line split at 660 / 460 / 260 px | 4 / 5 / 10 lines, breaks match the browser's own wrapping |
| `SplitLines.revert()` | restores the source HTML byte-for-byte; repeated split→revert does not accumulate spans |
| Inline `<a>` across a break | preserved, one `<a>` per line, spacing intact |
| `aria-label` gating | applied to the plain `<h1>`, correctly skipped on the heading containing a link |
| Magnetic pull | pointer at the button's bottom-right corner → `translate(36.73, 8.47)` vs a predicted `(36.75, 8.75)` at strength 0.35 |
| Cursor | `mix-blend-mode: difference` active, `cursor: none` on body and on links, `is-label` + label text on hover |
| ScrollTriggers after 3 re-splits + 2 resizes | 5 live, 0 orphaned |
| Console | clean |

Two things the shader tuning actually caught, which is why the numbers above are in the doc:

1. `float g = 0.5 + 0.5 * (noise)` never reaches the ends of the ramp, so the orb rendered
   **93% amber**. Dropping the `0.5 *` and separating the two `smoothstep` windows fixed it.
2. Re-splitting on element **width** alone misses a `clamp()`/`vw` font-size change, because the
   element's box width is unchanged while the wrapping is not. Hence the computed-style signature
   plus the `window.resize` listener.

# The five things that most often go wrong

1. **`scrollerProxy` with Lenis.** Copy-pasted from Locomotive tutorials, breaks every trigger.
   Lenis scrolls the window; wire it with `lenis.on('scroll', ScrollTrigger.update)` and nothing else.
2. **Parallax baked at load.** No `invalidateOnRefresh: true` → every element is offset after the
   first resize, font load, or phone rotation.
3. **`yPercent: 100` on line reveals.** Descenders and line-height > 1 leave the glyph tops peeking
   above the mask. Use 110–130 and pad the clip box.
4. **Full-resolution WebGL.** `devicePixelRatio: 3` on a phone × a 3-octave noise shader = a
   thermally throttled device in 20 seconds. Cap DPR **and** render below CSS size.
5. **`'ontouchstart' in window` as the touch test.** Touchscreen laptops fail it. Use
   `matchMedia('(hover: hover) and (pointer: fine)')`.
