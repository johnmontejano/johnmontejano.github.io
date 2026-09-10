/* Node 22+, Chrome. Run: node tools/motion-check.cjs [URL]
 * Without URL, serves this checkout on an ephemeral loopback port.
 * Optional: --only=boot, --only=menu, --only=motion, or --only=video.
 * CHROME_PATH may override the executable. Starts its OWN temporary Chrome
 * profile/process on port 0; never connects to 9222 or an existing browser.
 * Uses actual page markup, real keyboard/wheel input and real video playback.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const chromePath = process.env.CHROME_PATH || [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'
].find(file => fs.existsSync(file));
const failures = new Map(), pending = new Map();
let browser, socket, server, profile, sequence = 0;

function send(method, params = {}, sessionId) {
  return new Promise((resolve, reject) => {
    const id = ++sequence;
    const timer = setTimeout(() => { pending.delete(id); reject(Error('CDP timeout: ' + method)); }, 15000);
    pending.set(id, { resolve, reject, timer });
    socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
  });
}

async function serve() {
  server = http.createServer((req, res) => {
    let file;
    try { file = path.resolve(root, '.' + new URL(req.url, 'http://localhost').pathname); }
    catch { res.writeHead(400).end(); return; }
    if (file === root) file = path.join(root, 'index.html');
    if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    fs.stat(file, (error, stat) => {
      if (error || !stat.isFile()) { res.writeHead(404).end(); return; }
      const type = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.mp4': 'video/mp4', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.woff2': 'font/woff2' }[path.extname(file)] || 'application/octet-stream';
      const range = /^bytes=(\d+)-(\d*)$/.exec(req.headers.range || '');
      const start = range ? Number(range[1]) : 0;
      const end = range && range[2] ? Math.min(Number(range[2]), stat.size - 1) : stat.size - 1;
      if (start > end) { res.writeHead(416).end(); return; }
      res.writeHead(range ? 206 : 200, { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1, ...(range ? { 'Content-Range': `bytes ${start}-${end}/${stat.size}` } : {}) });
      const stream = fs.createReadStream(file, { start, end });
      stream.on('error', () => res.destroy());
      res.on('close', () => stream.destroy());
      stream.pipe(res);
    });
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  return `http://127.0.0.1:${server.address().port}/`;
}

async function connect() {
  assert(chromePath, 'Chrome not found; set CHROME_PATH');
  assert.equal(typeof WebSocket, 'function', 'Use Node 22 or newer');
  profile = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-motion-'));
  browser = spawn(chromePath, ['--headless=new', '--remote-debugging-port=0', '--user-data-dir=' + profile, '--no-first-run', '--no-default-browser-check', 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
  const endpoint = await new Promise((resolve, reject) => {
    let output = '';
    const timer = setTimeout(() => reject(Error('Chrome launch timeout: ' + output.slice(-1000))), 15000);
    browser.once('error', error => { clearTimeout(timer); reject(error); });
    browser.once('exit', code => { clearTimeout(timer); reject(Error('Chrome exited: ' + code)); });
    browser.stderr.on('data', chunk => {
      output += chunk;
      const match = /DevTools listening on (ws:\/\/[^\s]+)/.exec(output);
      if (match) { clearTimeout(timer); resolve(match[1]); }
    });
  });
  assert.notEqual(new URL(endpoint).port, '9222');
  socket = new WebSocket(endpoint);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  socket.onmessage = event => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const request = pending.get(message.id);
      clearTimeout(request.timer); pending.delete(message.id);
      if (message.error) request.reject(Error(JSON.stringify(message.error))); else request.resolve(message.result);
    }
    if (message.method === 'Runtime.exceptionThrown') failures.get(message.sessionId)?.push(message.params.exceptionDetails);
  };
}

async function page(url, { mobile = false, reduced = false, bootCheck = false, injectBootError = false, javascriptDisabled = false } = {}) {
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  failures.set(sessionId, []);
  const command = (method, params) => send(method, params, sessionId);
  const evaluate = async expression => {
    const result = await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  const until = async (expression, label, timeout = 12000) => {
    const end = Date.now() + timeout;
    do { if (await evaluate(expression)) return; await sleep(80); } while (Date.now() < end);
    throw Error('Timed out: ' + label + '; browser errors: ' + JSON.stringify(failures.get(sessionId)));
  };
  const wheel = deltaY => command('Input.dispatchMouseEvent', { type: 'mouseWheel', x: mobile ? 195 : 720, y: mobile ? 400 : 450, deltaX: 0, deltaY });
  const key = async (key, shift = false) => {
    const code = { Tab: 9, Enter: 13, Escape: 27 }[key];
    const params = { key, code: key, windowsVirtualKeyCode: code, modifiers: shift ? 8 : 0, ...(key === 'Enter' ? {text:'\r'} : {}) };
    await command('Input.dispatchKeyEvent', { type: 'keyDown', ...params });
    await command('Input.dispatchKeyEvent', { type: 'keyUp', ...params });
  };
  const click = async selector => {
    const rect = await evaluate(`(()=>{let r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
    await command('Input.dispatchMouseEvent', { type: 'mousePressed', button: 'left', clickCount: 1, ...rect });
    await command('Input.dispatchMouseEvent', { type: 'mouseReleased', button: 'left', clickCount: 1, ...rect });
  };
  await command('Page.enable'); await command('Runtime.enable');
  if (bootCheck) {
    await command('Network.enable');
    await command('Network.setBlockedURLs', { urls: ['*://cdnjs.cloudflare.com/*', '*://cdn.jsdelivr.net/*'] });
  }
  await command('Emulation.setDeviceMetricsOverride', { width: mobile ? 390 : 1440, height: mobile ? 844 : 900, deviceScaleFactor: 1, mobile });
  await command('Emulation.setTouchEmulationEnabled', { enabled: mobile });
  await command('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: reduced ? 'reduce' : 'no-preference' }] });
  if (javascriptDisabled) await command('Emulation.setScriptExecutionDisabled', { value: true });
  else await command('Page.addScriptToEvaluateOnNewDocument', { source: "try { sessionStorage.setItem('jm-loaded','1'); } catch {}" });
  if (injectBootError) await command('Page.addScriptToEvaluateOnNewDocument', { source: `
    const originalQuery = Document.prototype.querySelectorAll;
    Document.prototype.querySelectorAll = function(selector) {
      if (selector === '.split') {
        Document.prototype.querySelectorAll = originalQuery;
        window.__bootFault = {hadJS: document.documentElement.classList.contains('js')};
        throw new Error('Injected synchronous main boot failure');
      }
      return originalQuery.call(this, selector);
    };
  ` });
  await command('Page.navigate', { url });
  await command('Page.bringToFront');
  await until("document.readyState === 'complete'" + (bootCheck ? '' : " && !!document.querySelector('.hero .txt')"), 'page initialization');
  await evaluate('document.fonts.ready.then(()=>true)');
  return { evaluate, until, wheel, key, click, command, close: async () => {
    assert.deepEqual(failures.get(sessionId), [], 'Uncaught browser errors');
    await send('Target.closeTarget', { targetId });
  } };
}

async function checkBoot(url) {
  const p = await page(url, { bootCheck: true });
  const boot = await p.evaluate(`(()=>({
    activated:document.documentElement.classList.contains('js'),
    split:document.querySelector('.hero .display').dataset.split,
    phrases:[...document.querySelectorAll('.hero .txt:not(.txt--next)')].map(e=>e.textContent),
    gsap:window.gsap?.version,scrollTrigger:window.ScrollTrigger?.version,lenis:typeof window.Lenis,
    triggers:window.ScrollTrigger?.getAll().length,
    vendor:[...document.scripts].filter(s=>['gsap.min.js','ScrollTrigger.min.js','lenis.min.js'].includes(s.src.split('/').pop())).map(s=>({
      local:new URL(s.src).origin===location.origin && new URL(s.src).pathname.includes('/assets/vendor/'),
      file:new URL(s.src).pathname,
      status:performance.getEntriesByName(s.src)[0]?.responseStatus
    }))
  }))()`);
  assert.equal(boot.activated,true); assert.equal(boot.split,'1');
  assert.deepEqual(boot.phrases,['You run the jobs.','I build the systems.']);
  assert.equal(boot.gsap,'3.12.5'); assert.equal(boot.scrollTrigger,'3.12.5'); assert.equal(boot.lenis,'function');
  assert(boot.triggers>0); assert.equal(boot.vendor.length,3);
  assert(boot.vendor.every(v=>v.local && v.status===200), 'All three pinned local vendor scripts must load successfully');
  await p.until("gsap.getProperty(document.querySelector('.hero .mask'),'scaleX')===0", 'hero mask completes after main boot');
  await p.wheel(await p.evaluate("document.querySelector('.job').getBoundingClientRect().top-400"));
  await p.until("document.querySelector('.job').classList.contains('is-inview')", 'entry callbacks active after boot');
  await p.close();
  console.log('PASS: main boot, hero split/animation, live entry callback, local vendor HTTP 200 with CDN hosts blocked', JSON.stringify(boot));

  const failed = await page(url, { bootCheck: true, injectBootError: true });
  const fallback = await failed.evaluate(`(()=>({
    fault:window.__bootFault,
    js:document.documentElement.classList.contains('js'),
    loading:document.documentElement.classList.contains('is-loading'),
    loader:!!document.getElementById('loader'),
    hidden:[...document.querySelectorAll('.reveal,.bw,.strength__orb,.strength__text')].filter(e=>+getComputedStyle(e).opacity<.99).map(e=>e.className),
    headline:document.querySelector('.hero .display').textContent.trim()
  }))()`);
  assert.equal(fallback.fault?.hadJS,true, 'Fault must occur after js activation');
  assert.equal(fallback.js,false); assert.equal(fallback.loading,false); assert.equal(fallback.loader,false);
  assert.deepEqual(fallback.hidden,[]); assert(fallback.headline.length>0);
  await failed.close();
  console.log('PASS: injected boot error removes js/loading and restores visible content',JSON.stringify(fallback));

  for (const mobile of [false, true]) {
    const disabled = await page(url, { bootCheck: true, javascriptDisabled: true, mobile });
    const noJS = await disabled.evaluate(`(()=>({
      js:document.documentElement.classList.contains('js'),
      loading:document.documentElement.classList.contains('is-loading'),
      loader:!!document.getElementById('loader'),
      libraries:[typeof window.gsap,typeof window.ScrollTrigger,typeof window.Lenis],
      split:document.querySelector('.hero .display').hasAttribute('data-split'),
      headline:document.querySelector('.hero .display').textContent.trim(),
      hidden:[...document.querySelectorAll('.reveal,.reveal-group>*,.word,.bw,.strength__orb,.strength__text')].filter(el=>{
        if(!el.getClientRects().length) return true;
        for(let e=el;e;e=e.parentElement){
          const s=getComputedStyle(e);
          if(+s.opacity===0 || s.display==='none' || s.visibility==='hidden') return true;
        }
        return false;
      }).map(e=>e.className)
    }))()`);
    assert.equal(noJS.js,false); assert.equal(noJS.loading,false); assert.equal(noJS.loader,false);
    assert.deepEqual(noJS.libraries,['undefined','undefined','undefined'], 'Vendor scripts must actually be disabled');
    assert.equal(noJS.split,false, 'Main must not have executed');
    assert(noJS.headline.length>0); assert.deepEqual(noJS.hidden,[], 'Static content must remain visible with JS disabled');
    await disabled.close();
    console.log('PASS: actual JavaScript-disabled load ('+(mobile?'mobile':'desktop')+'), no js flag, unsplit readable hero, all reveal content visible',JSON.stringify(noJS));
  }
}

async function checkMotion(url) {
  const p = await page(url);
  assert(await p.evaluate("typeof gsap === 'object' && ScrollTrigger.getAll().length > 0"), 'GSAP must load');
  await sleep(9400);
  assert(await p.evaluate("[...document.querySelectorAll('.bw')].every(e=>getComputedStyle(e).opacity==='0') && !document.querySelector('.contact').classList.contains('is-inview')"), 'Offscreen content must remain pending after 9s');
  const motion = await p.evaluate(`(()=>{
    const sample=(selector,axis)=>{let e=document.querySelector(selector),s=ScrollTrigger.getAll().find(s=>s.animation?.targets().includes(e));let old=s.animation.progress();s.animation.progress(0);let a=+gsap.getProperty(e,axis);s.animation.progress(1);let b=+gsap.getProperty(e,axis);s.animation.progress(old);return [a,b,s.trigger.id||s.trigger.className]};
    return {cover:sample('.job__cover','y'),row:sample('.tiles__line','x'),inner:sample('.tiles__parallax','x'),portrait:sample('.person__media','y'),name:sample('.person__name','y'),previews:[...document.querySelectorAll('.job__preview')].every(e=>!e.style.transform&&!gsap.getTweensOf(e).length)};
  })()`);
  for (const [name, expected] of Object.entries({ cover: [-18,18], row: [83,-83], inner: [-35,35], portrait: [144,-144], name: [-100,100] })) assert.deepEqual(motion[name].slice(0,2), expected, name);
  assert.equal(motion.portrait[2], 'who'); assert.equal(motion.name[2], 'person__name'); assert(motion.previews);
  const activeHero = "gsap.globalTimeline.getChildren().find(t=>t.getChildren && t.vars.onInterrupt && t.isActive() && t.time()>.1 && t.time()<.65 && t.getChildren().some(c=>c.targets().some(e=>e.classList?.contains('txt'))))";
  await p.until('!!(' + activeHero + ')', 'hero mid-cycle');
  const original = await p.evaluate("[...document.querySelectorAll('.hero .txt:not(.txt--next)')].map(e=>e.textContent)");
  await p.wheel(1600);
  await p.until("document.querySelector('.hero .display').getBoundingClientRect().bottom < 0 && [...document.querySelectorAll('.hero .txt:not(.txt--next)')].every(e=>gsap.getProperty(e,'yPercent')===0)", 'interrupted hero settles', 4000);
  assert.deepEqual(await p.evaluate("[...document.querySelectorAll('.hero .txt:not(.txt--next)')].map(e=>e.textContent)"), original, 'Interrupted cycle must retain current phrase');
  await p.wheel(await p.evaluate("document.querySelector('[data-words]').getBoundingClientRect().top-400"));
  await p.until("[...document.querySelectorAll('.bw')].every(e=>+getComputedStyle(e).opacity>.99)", 'trust reveal on entry');
  await p.close();
  console.log('PASS: delayed reveals, exact parallax, cover-only targeting, actual mid-cycle scroll interruption');
}

async function checkMenu(url) {
  const p = await page(url, { mobile: true });
  await sleep(200);
  assert(await p.evaluate("document.querySelector('#navlinks').inert"), 'Closed mobile panel must be inert');
  await p.evaluate("document.querySelector('#burger').focus()"); await p.key('Tab');
  assert(await p.evaluate("!document.querySelector('#navlinks').contains(document.activeElement)"), 'Tab must skip closed links');
  await p.evaluate("document.querySelector('#burger').focus()"); await p.key('Enter');
  await p.until("document.activeElement===document.querySelector('#navlinks a')", 'focus enters menu');
  await p.key('Tab', true);
  assert(await p.evaluate("document.activeElement.id==='burger'"), 'Shift+Tab from first link reaches burger');
  await p.key('Tab', true);
  assert(await p.evaluate("document.activeElement===document.querySelector('#navlinks a:last-child')"), 'Shift+Tab wraps to last link');
  await p.key('Tab');
  assert(await p.evaluate("document.activeElement.id==='burger'"), 'Tab wraps to burger');
  await p.wheel(500); await sleep(600);
  assert.equal(await p.evaluate('scrollY'), 0, 'Menu locks smooth scrolling');
  await p.key('Escape');
  assert(await p.evaluate("document.activeElement.id==='burger' && document.querySelector('#burger').getAttribute('aria-expanded')==='false' && document.querySelector('#navlinks').inert && !document.documentElement.classList.contains('is-loading')"), 'Escape restores focus and unlocks');
  await p.wheel(500); await p.until('scrollY>100', 'scroll resumes after close');
  await p.wheel(-1000); await p.until('scrollY<1', 'return to top');
  await p.evaluate("document.querySelector('#burger').focus()"); await p.key('Enter');
  await p.key('Enter'); // first menu link: navigation closes and unlocks
  assert(await p.evaluate("document.querySelector('#navlinks').inert && !document.documentElement.classList.contains('is-loading')"), 'Link activation closes menu');
  await p.until("Math.abs(document.querySelector('#work').getBoundingClientRect().top-70)<10", 'menu link scrolls to its target');
  await p.wheel(-3000); await p.until('scrollY<1', 'return to top for open-menu resize');
  await p.evaluate("document.querySelector('#burger').focus()"); await p.key('Enter');
  await p.command('Emulation.setDeviceMetricsOverride', { width:1440,height:900,deviceScaleFactor:1,mobile:false });
  await p.until("!document.querySelector('#navlinks').inert && !document.documentElement.classList.contains('is-loading') && document.querySelector('#burger').getAttribute('aria-expanded')==='false'", 'desktop resize closes and unlocks menu');
  await p.close();
  console.log('PASS: closed menu inert, keyboard entry, Tab/Shift+Tab trap, Escape/focus, scroll lock/release, link close, desktop resize');
}

async function checkVideo(url, reduced) {
  const p = await page(url, { reduced });
  assert(await p.evaluate("!!document.querySelector('.band__toggle')"), 'Actual film toggle markup required');
  await p.wheel(await p.evaluate("document.querySelector('.band').getBoundingClientRect().top-50"));
  await sleep(1400);
  const paused = "document.querySelector('.band__video').paused";
  if (reduced) {
    assert(await p.evaluate(paused), 'Reduced motion must not autoplay');
    await p.click('.band__toggle');
  }
  await p.until('!(' + paused + ')', 'film playback');
  await p.until("document.querySelector('.band__toggle').textContent==='Pause film' && document.querySelector('.band__toggle').getAttribute('aria-pressed')==='true'", 'playing label and ARIA');
  await p.click('.band__toggle');
  await p.until(paused, 'manual pause');
  assert(await p.evaluate("document.querySelector('.band__toggle').textContent==='Play film' && document.querySelector('.band__toggle').getAttribute('aria-pressed')==='false'"), 'Paused label and ARIA');
  await p.wheel(-1800); await sleep(1000);
  assert(await p.evaluate("document.querySelector('.band__video').getBoundingClientRect().top>innerHeight+200"), 'Video must actually leave observer area');
  await p.wheel(1800); await sleep(1400);
  assert(await p.evaluate("document.querySelector('.band__video').getBoundingClientRect().top<innerHeight"), 'Video must re-enter viewport');
  assert(await p.evaluate(paused), 'Manual pause persists after real out/in entry');
  await p.click('.band__toggle'); await p.until('!(' + paused + ')', 'explicit resume');
  if (!reduced) {
    await p.command('Emulation.setEmulatedMedia', { features:[{name:'prefers-reduced-motion',value:'reduce'}] });
    await p.until(paused, 'live reduced-motion pause');
  }
  await p.close();
  console.log('PASS: actual film button, labels/ARIA, manual pause after out/in, explicit resume (' + (reduced ? 'reduced motion' : 'normal + live reduced motion') + ')');
}

(async () => {
  try {
    const args = process.argv.slice(2);
    const only = args.find(arg=>arg.startsWith('--only='))?.slice(7);
    assert(!only || ['boot','menu','motion','video'].includes(only), 'Unknown --only option');
    const url = args.find(arg=>!arg.startsWith('--')) || await serve();
    await connect();
    if (!only || only === 'boot') await checkBoot(url);
    if (!only || only === 'motion') await checkMotion(url);
    if (!only || only === 'menu') await checkMenu(url);
    if (!only || only === 'video') { await checkVideo(url, false); await checkVideo(url, true); }
    console.log((only ? 'Selected checks' : 'All portfolio motion checks') + ' passed. No existing browser or port 9222 used.');
  } finally {
    if (socket?.readyState === WebSocket.OPEN) { await send('Browser.close').catch(() => {}); socket.close(); }
    for (const request of pending.values()) clearTimeout(request.timer);
    if (browser && browser.exitCode === null) {
      browser.kill('SIGTERM');
      await Promise.race([new Promise(resolve => browser.once('exit', resolve)), sleep(2000)]);
    }
    if (server) { server.closeAllConnections(); server.close(); }
    if (profile && browser?.exitCode !== null) fs.rmSync(profile, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
