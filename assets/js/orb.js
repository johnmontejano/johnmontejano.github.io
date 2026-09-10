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
uniform vec2  u_focus;      // flow origin (0,0 = viewport centre)
uniform float u_radius;     // flow scale; retained for existing data-radius overrides
uniform float u_warp;       // domain-warp amount
uniform float u_intensity;  // 0..1 overall opacity of the orb over the bg
uniform float u_grain;      // grain amplitude, in output units (1.0 == full black->white)
uniform float u_lens;       // 0: background, 1: glass sampling the same field
uniform vec4  u_scene;      // canvas origin and size in background short-axis units

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

/* A flowing rotation field folds continuous stripes into broad ribbons. There
   is deliberately no radial opacity mask: the dark channels belong to the
   pattern itself. Both canvases evaluate this exact scene at the same time. */
float fieldHash(vec3 p){
  p = fract(p * 0.1031);
  p += dot(p, p.yzx + 33.33);
  return fract((p.x + p.y) * p.z);
}
float fieldNoise(vec3 p){
  vec3 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(fieldHash(i), fieldHash(i + vec3(1,0,0)), f.x),
        mix(fieldHash(i + vec3(0,1,0)), fieldHash(i + vec3(1,1,0)), f.x), f.y),
    mix(mix(fieldHash(i + vec3(0,0,1)), fieldHash(i + vec3(1,0,1)), f.x),
        mix(fieldHash(i + vec3(0,1,1)), fieldHash(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float fieldBands(vec2 p, float softness){
  return smoothstep(0.0, 0.5 + softness * 0.5,
    abs(sin(p.x * 31.4159265) + softness * 2.0) * 0.5);
}
vec3 fluid(vec2 p){
  p = (p - u_focus) * (0.52 / max(u_radius, 0.1));
  vec3 dome = normalize(vec3(p, 0.8));
  float angle = fieldNoise(dome * 2.6 + u_time) * 3.0;
  mat2 rotation = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
  vec2 q = rotation * dome.xy * 0.2;
  vec3 pigment = mix(u_c1, u_c2, fieldBands(q, 0.5));
  return mix(pigment, u_bg, fieldBands(q, 0.1));
}

// Bounded hemisphere projection substitutes for the cube-map lookup, including
// its X flip. Sample directions around the lens centre: adding a displacement
// to screen p would cancel most of p at the reference's very low ratio.
vec2 refractedField(vec3 ray){
  return u_scene.xy + u_scene.zw * 0.5
    + vec2(-ray.x, ray.y) / (1.0 - ray.z) * u_scene.zw * 0.8;
}

/* sine-free hash, stable on mobile GPUs */
float hash21(vec2 p){
  vec3 q = fract(vec3(p.xyx) * 0.1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}

void main(){
  vec2 frag = gl_FragCoord.xy;

  vec2 uv = frag / u_res;
  vec2 p = u_scene.xy + uv * u_scene.zw;
  vec3 col;
  if (u_lens > 0.5) {
    vec2 sphere = (uv - 0.5) * 2.0;
    float r2 = dot(sphere, sphere);
    float z = sqrt(max(1.0 - r2, 0.0001));
    vec3 normal = normalize(vec3(sphere, z));
    vec3 incident = vec3(0.0, 0.0, -1.0);
    // Measured artistic values from MONOPO_JS.md §3.3, including the three
    // per-channel ratios. The unusually low ratio deliberately folds the
    // environment around the rim much more strongly than ordinary glass.
    const float refractionRatio = 0.016;
    vec3 rayR = refract(incident, normal, refractionRatio);
    vec3 rayG = refract(incident, normal, refractionRatio * 0.99);
    vec3 rayB = refract(incident, normal, refractionRatio * 0.98);
    col = vec3(fluid(refractedField(rayR)).r,
               fluid(refractedField(rayG)).g,
               fluid(refractedField(rayB)).b);
    vec3 reflection = reflect(incident, normal);
    vec2 reflectedAt = u_scene.xy + u_scene.zw * 0.5
      + reflection.xy / (1.35 + reflection.z) * u_scene.zw * 0.38;
    vec3 reflected = fluid(reflectedAt);
    float fresnel = clamp(0.016 + 2.442 * pow(
      max(1.0 + dot(incident, normal), 0.0), 4.206), 0.0, 1.0);
    col = mix(col, reflected, fresnel);
    float rim = exp(-abs(sqrt(r2) - 0.992) * 210.0);
    float light = 0.3 + 0.7 * max(dot(normal.xy, normalize(vec2(-0.7, 0.6))), 0.0);
    // A recessed inner shoulder gives the rim thickness. Its offset highlight
    // follows the reflected field and tapers around the sphere, rather than
    // drawing another uniform outline over the glass.
    float radius = sqrt(r2);
    float shoulderAt = 0.951 + 0.012 * sphere.x - 0.008 * sphere.y;
    float shoulder = exp(-pow((radius - shoulderAt) / 0.014, 2.0));
    float recess = exp(-pow((radius - shoulderAt + 0.027) / 0.022, 2.0));
    col *= 1.0 - recess * 0.12;
    col += (reflected * 0.20 + vec3(0.018, 0.014, 0.007)) * shoulder * light;
    col += vec3(0.12, 0.15, 0.085) * rim * light;
    // The parent supplies the circular clip; keep any overscan unobtrusive.
    col *= 1.0 - smoothstep(1.0, 1.025, r2);
  } else {
    col = fluid(p);
  }

  /* linear -> sRGB. Mixing green into red in linear light avoids the muddy
     mid you get mixing sRGB bytes directly. */
  col = pow(max(col, 0.0), vec3(1.0 / 2.2));
  col *= u_intensity;

  /* Grain doubles as a dither: it is what kills 8-bit banding on a dark gradient. */
  float gr = (hash21(frag + floor(u_time * 24.0) * 137.0) - 0.5) * u_grain;
  col += gr;

  gl_FragColor = vec4(col, 1.0);
}
`;

/* ============================================================
   ORB — mount
   ============================================================ */
function mountOrb(canvas, scene = null) {
  var simTimeSeed = 0;
  if (!canvas) return null;

  const CONFIG = {
    c1: '#789E71',        // measured source green, MONOPO_JS.md §3.2
    c2: '#E09442',        // measured source orange
    c3: '#59452F',        // smoked umber; reference has no vivid red stop
    bg: '#000000',
    speed: 0.126, // reference settled time: .0021 per frame at 60Hz
    focus: [0.02, -0.04], // slight offset; matches the CSS orb's left:52%/top:46%
    radius: 0.52,
    warp: 0.95,
    intensity: 0.8,       // measured source background opacity
    grain: 0.035,
    maxPixelRatio: 1.5,   // hard cap
    renderScale: 1, // native-resolution grain avoids a visibly upscaled texture
    maxFps: 45            // 0 = uncapped
  };
  // Preserve standalone data overrides. A mounted lens inherits scene settings
  // so legacy lens-specific time/colour-domain overrides cannot detach its flow.
  ['radius','warp','intensity','grain','speed','renderScale'].forEach(function (k) {
    if (canvas.dataset[k] != null) CONFIG[k] = parseFloat(canvas.dataset[k]);
  });
  if (canvas.dataset.focus) CONFIG.focus = canvas.dataset.focus.split(',').map(Number);
  if (canvas.dataset.tstart) simTimeSeed = parseFloat(canvas.dataset.tstart);
  if (scene) {
    ['c1','c2','c3','bg','speed','focus','radius','warp','intensity'].forEach((k) => {
      CONFIG[k] = scene.config[k];
    });
    canvas.style.animation = 'none'; // refraction supplies motion; keep the glass coordinates stable
  }

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
     'u_radius','u_warp','u_intensity','u_grain','u_lens','u_scene'
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
    gl.uniform1f(u.u_lens, scene ? 1 : 0);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    return true;
  }

  /* ---- sizing. Never read layout in the rAF loop. ---- */
  let cssW = 0, cssH = 0, dirty = true;
  let sceneBounds = [0, 0, 1, 1];
  function setSize(w, h) { cssW = w; cssH = h; dirty = true; }

  function applySize() {
    if (!dirty) return;
    dirty = false;
    const dpr = Math.min(window.devicePixelRatio || 1, CONFIG.maxPixelRatio);
    const w = Math.max(1, Math.round(cssW * dpr * CONFIG.renderScale));
    const h = Math.max(1, Math.round(cssH * dpr * CONFIG.renderScale));
    if (w !== canvas.width || h !== canvas.height) {
      canvas.width = w; canvas.height = h;
    }
    gl.viewport(0, 0, w, h);
    gl.uniform2f(u.u_res, w, h);
    gl.uniform4fv(u.u_scene, sceneBounds);
  }

  function draw() {
    applySize();
    gl.uniform1f(u.u_time, scene ? scene.time() : simTime);
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

  /* ---- geometry is read on resize only, never inside the animation loop ---- */
  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => {
    measure();
  }) : null;
  if (ro) ro.observe(canvas);
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
    const background = scene ? scene.canvas : canvas;
    const base = background.getBoundingClientRect();
    const box = canvas.getBoundingClientRect();
    const bw = base.width || w, bh = base.height || h;
    const short = Math.max(1, Math.min(bw, bh));
    sceneBounds = scene
      ? [(box.left - base.left - bw * 0.5) / short,
         (base.bottom - box.bottom - bh * 0.5) / short,
         (box.width || w) / short, (box.height || h) / short]
      : [-bw * 0.5 / short, -bh * 0.5 / short, bw / short, bh / short];
    if (!running) draw();
  }
  measure();
  window.addEventListener('resize', measure, { passive: true });

  /* ---- pause when the tab is hidden ---- */
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));

  /* ---- pause when the hero is scrolled away ---- */
  const io = typeof IntersectionObserver === 'function' ? new IntersectionObserver((es) => {
    visible = es[0].isIntersecting;
    visible ? start() : stop();
  }, { threshold: 0 }) : null;
  if (io) io.observe(canvas);

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
  return { start, stop, config: CONFIG, canvas, time: () => simTime,
    destroy(){ stop(); if (ro) ro.disconnect(); if (io) io.disconnect(); } };
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
    try { lens = mountOrb(l, orb); } catch (e) { lens = null; }
    if (!lens) root.classList.remove('has-lens');
  }
})();
