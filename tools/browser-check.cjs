/* Zero-dependency, isolated CDP visual/motion check. Requires Node 22+ and
 * a Chrome test instance listening on 9222. Never attaches to a user's tab.
 * node tools/browser-check.cjs URL OUTPUT_DIR [mobile|reduced|reference]
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const [url, output, mode = 'desktop'] = process.argv.slice(2);
const only = process.argv[5] ? process.argv[5].split(',') : null;
if (!url || !output) throw Error('URL and output directory required');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const mobile = mode === 'mobile' || mode === 'reference-mobile';
const reference = mode === 'reference' || mode === 'reference-mobile';
const width = mobile ? Number(process.env.PORTFOLIO_CHECK_WIDTH || 390) : 1440;
const height = mobile ? Number(process.env.PORTFOLIO_CHECK_HEIGHT || 844) : 900;
let id = 0;
const pending = new Map(), errors = [], warnings = [];
async function main() {
  fs.mkdirSync(output, { recursive: true });
  const target = await fetch('http://127.0.0.1:9222/json/new?about:blank', {method:'PUT'}).then(r=>r.json());
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});
  ws.onmessage = e => {
    const message = JSON.parse(e.data);
    if (message.id) { const p=pending.get(message.id); if(p){pending.delete(message.id);message.error?p.reject(message.error):p.resolve(message.result);} }
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails);
    if (message.method === 'Runtime.consoleAPICalled' && ['error','warning'].includes(message.params.type)) warnings.push(message.params.args.map(a=>a.value||a.description).join(' '));
  };
  const send = (method,params={}) => new Promise((resolve,reject)=>{const next=++id;pending.set(next,{resolve,reject});ws.send(JSON.stringify({id:next,method,params}));});
  const ev = async expression => {const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
  const shot = async name => { const r=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(output,name+'.png'),Buffer.from(r.data,'base64')); };
  const wheel = async amount => { await send('Input.dispatchMouseEvent',{type:'mouseWheel',x:width/2,y:height/2,deltaX:0,deltaY:amount});await sleep(650); };
  await send('Page.enable'); await send('Runtime.enable');
  await send('Network.enable');
  await send('Network.setCacheDisabled',{cacheDisabled:true});
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile});
  await send('Emulation.setTouchEmulationEnabled',{enabled:mobile});
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:mode==='reduced'?'reduce':'no-preference'}]});
  await send('Page.navigate',{url}); await sleep(9500);
  await ev('document.fonts.ready');
  const sections = reference ? [['hero','#intro-container'],['work','#works'],['trust','#partners'],['manifesto','#manifesto'],['strengths','#strengths'],['film','.video-banner'],['gallery','#tilesGrid'],['person','#team'],['footer','#contact']] : [['hero','.hero'],['work','#work'],['trust','#built-for'],['manifesto','#manifesto'],['strengths','#leaks'],['strip','.mq'],['film','.band'],['gallery','#trades'],['person','.person'],['footer','#contact']];
  const report={url,mode,width,height,errors,warnings,sections:[]};
  report.heroState=await ev('({classes:document.documentElement.className,text:document.querySelector("h1")?.textContent,canvas:[...document.querySelectorAll("canvas")].map(c=>({width:c.width,height:c.height}))})');
  report.startup=await ev('({enhanced:document.documentElement.classList.contains("js"),split:!!document.querySelector(".hero .display[data-split]"),gsap:typeof window.gsap!=="undefined",scrollTrigger:typeof window.ScrollTrigger!=="undefined",loader:!!document.querySelector("#loader")})');
  if(!reference && (!report.startup.enhanced || !report.startup.split || !report.startup.gsap || !report.startup.scrollTrigger || report.startup.loader)) {
    report.readyState=await ev('document.readyState');
    fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));
    await send('Page.close');ws.close();
    throw Error('Startup gate failed: '+JSON.stringify({startup:report.startup,readyState:report.readyState,warnings,errors}));
  }
  const probe = selector => ev(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)return null;const r=e.getBoundingClientRect();return {top:r.top,height:r.height,width:r.width,left:r.left};})()`);
  report.offscreenBeforeScroll=await ev('[...document.querySelectorAll(".job,.strength")].map(e=>({inview:e.classList.contains("is-inview"),top:e.getBoundingClientRect().top}))');
  for (const [name,selector] of sections) {
    if (only && !only.includes(name)) continue;
    let box=await probe(selector);if(!box)continue;
    for(let n=0;n<35&&Math.abs(box.top-70)>60;n++){
      await wheel(Math.max(-650,Math.min(650,box.top-70)));const next=await probe(selector);if(Math.abs(next.top-box.top)<1)break;box=next;
    }
    await sleep(900);await shot(name);
    if(name==='hero' && mode==='desktop') {
      report.heroMotion=[];
      for(let frame=0;frame<3;frame++) {
        const capture=await send('Page.captureScreenshot',{format:'png',clip:{x:80,y:150,width:260,height:230,scale:1}});
        const bytes=Buffer.from(capture.data,'base64');
        fs.writeFileSync(path.join(output,'hero-motion-'+frame+'.png'),bytes);
        report.heroMotion.push(crypto.createHash('sha256').update(bytes).digest('hex'));
        await sleep(1500);
      }
      if(new Set(report.heroMotion).size<2) throw Error('Hero background appears frozen across three frames');
    }
    if (name === 'work' && mode === 'desktop') {
      const count = await ev('document.querySelectorAll(".work>.job").length');
      for (let card=1;card<=count;card++) {
        const sel='.work>.job:nth-child('+card+')';
        let bounds=await probe(sel);
        for(let n=0;n<12&&Math.abs(bounds.top-70)>25;n++) { await wheel(Math.max(-650,Math.min(650,bounds.top-70)));bounds=await probe(sel); }
        await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:5,y:5});await sleep(1000);await shot('work-'+card+'-rest');
        await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:bounds.left+bounds.width/2,y:Math.min(height-50,Math.max(100,bounds.top+250))});
        await sleep(1000);await shot('work-'+card+'-hover');
      }
      await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:5,y:5});
    }
    if (name === 'film' && mode === 'desktop') {
      report.filmSequence=[];
      for(let frame=0;frame<4;frame++) {
        report.filmSequence.push(await ev('(()=>{const v=document.querySelector(".band__video");return{time:v.currentTime,paused:v.paused,duration:v.duration}})()'));
        await shot('film-motion-'+frame);await sleep(2200);
      }
    }
    const before=await ev('[...document.querySelectorAll(".job__cover,.tiles__line,.tiles__parallax,.person__media,.person__name")].map(e=>({class:e.className,transform:getComputedStyle(e).transform}))');
    await wheel(220);
    const after=await ev('[...document.querySelectorAll(".job__cover,.tiles__line,.tiles__parallax,.person__media,.person__name")].map(e=>({class:e.className,transform:getComputedStyle(e).transform}))');
    report.sections.push({name,box,before,after});
  }
  report.overflow=await ev('document.documentElement.scrollWidth-innerWidth');
  report.failedImages=await ev('[...document.images].filter(i=>'+(only?'(i.currentSrc || i.loading!=="lazy") && ':'')+'(!i.complete||!i.naturalWidth)).map(i=>i.currentSrc||i.src)');
  report.hiddenReveals=await ev('[...document.querySelectorAll(".reveal,.strength,.trust")].filter(e=>!e.classList.contains("is-inview")).map(e=>e.className)');
  report.video=await ev('(()=>{let v=document.querySelector(".band__video");return v?{readyState:v.readyState,error:v.error&&v.error.code,paused:v.paused,currentTime:v.currentTime}:null})()');
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({url,mode,overflow:report.overflow,failedImages:report.failedImages,errors:errors.map(e=>e.text),sections:report.sections.length}));
  await send('Page.close');ws.close();
  if(!reference && (report.overflow || report.failedImages.length || errors.length || (!only && report.hiddenReveals.length))) throw Error('Browser regression: inspect '+path.join(output,'report.json'));
}
main().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1);});
