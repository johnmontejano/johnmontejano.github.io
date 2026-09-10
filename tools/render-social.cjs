/* Render the authored HTML social card, not an edited or synthetic photograph. */
const fs=require('node:fs'),path=require('node:path');
(async()=>{
 const target=await fetch('http://127.0.0.1:9222/json/new?about:blank',{method:'PUT'}).then(r=>r.json());
 const ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);
 let seq=0;const pending=new Map();ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result)}};
 const send=(method,params={})=>new Promise((resolve,reject)=>{let id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}))});
 await send('Page.enable');await send('Emulation.setDeviceMetricsOverride',{width:1200,height:630,deviceScaleFactor:1,mobile:false});
 await send('Page.navigate',{url:'http://127.0.0.1:4177/tools/social-card.html'});await new Promise(r=>setTimeout(r,1500));
 await send('Runtime.evaluate',{expression:'document.fonts.ready',awaitPromise:true});
 const r=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.resolve(__dirname,'../assets/img/og-marketing.png'),Buffer.from(r.data,'base64'));
 await send('Page.close');ws.close();console.log('Rendered assets/img/og-marketing.png');
})().catch(e=>{console.error(e);process.exit(1)});
