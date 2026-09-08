/* orb.js owns only the hero canvas. Lenis and ScrollTrigger are set up in
   main.js — do not duplicate them here, or two Lenis instances fight the ticker. */
const RM = window.matchMedia('(prefers-reduced-motion: reduce)');
const reduced = () => RM.matches;

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

/* ============================================================
   ORB — mount
   ============================================================ */
function mountOrb(canvas) {
  var simTimeSeed = 0;
  if (!canvas) return null;

  const CONFIG = {
    c1: '#A0E0AB',        // --irid-a
    c2: '#FFAC2E',        // --irid-b
    c3: '#A52D25',        // --irid-c
    bg: '#000000',
    speed: 0.22,          // seconds of shader-time per second of wall-clock
    focus: [0.02, -0.04], // slight offset; matches the CSS orb's left:52%/top:46%
    radius: 0.52,
    warp: 0.95,
    intensity: 0.58,
    grain: 0.055,
    maxPixelRatio: 1.5,   // hard cap
    renderScale: 0.65,    // render smaller than CSS size and let the GPU upscale
    maxFps: 45            // 0 = uncapped
  };
  // Per-canvas overrides from data-* attributes. The lens canvas runs the same
  // shader with a larger radius, an offset focus and its own time scale, so the
  // disc reads as a refracting sphere over the background fluid rather than a
  // window onto it.
  ['radius','warp','intensity','grain','speed','renderScale'].forEach(function (k) {
    if (canvas.dataset[k] != null) CONFIG[k] = parseFloat(canvas.dataset[k]);
  });
  if (canvas.dataset.focus) CONFIG.focus = canvas.dataset.focus.split(',').map(Number);
  if (canvas.dataset.tstart) simTimeSeed = parseFloat(canvas.dataset.tstart);

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
  let simTime = (typeof simTimeSeed === "number" ? simTimeSeed : 0), lastTs = 0, acc = 0;
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
  // The canvas may still be display:none when we first measure (the .has-webgl
  // class is what reveals it), and a ResizeObserver on a display:none element
  // reports 0 — which left the backing store at its 300x150 default and made the
  // shader render upscaled and soft. Fall back to the hosting section's box, and
  // keep a resize listener as a backstop for when RO callbacks are deferred
  // (they are, while document.hidden is true).
  const host = canvas.parentElement || canvas;
  function measure() {
    const w = canvas.clientWidth || host.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || host.clientHeight || window.innerHeight;
    setSize(w, h);
    if (!running) draw();
  }
  measure();
  window.addEventListener('resize', measure, { passive: true });

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
  const root = document.documentElement;
  root.classList.add('has-webgl');            // give the canvas layout BEFORE measuring it
  const orb = mountOrb(c);
  if (!orb) root.classList.remove('has-webgl');   // mount failed: fall back to the CSS orb
  const l = document.querySelector('.orb-lens');
  if (orb && l) {
    root.classList.add('has-lens');                 // give the lens canvas layout BEFORE measuring it
    let lens = null;
    try { lens = mountOrb(l); } catch (e) { lens = null; }
    if (!lens) root.classList.remove('has-lens');
  }
})();
