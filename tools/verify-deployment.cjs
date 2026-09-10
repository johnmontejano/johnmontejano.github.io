/* Read-only byte-level production verification. Node 22+.
 * node tools/verify-deployment.cjs https://johnmontejano.github.io [commit]
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const origin = new URL(process.argv[2] || 'https://johnmontejano.github.io/');
const revision = process.argv[3] || Date.now().toString();
const files = new Set(['index.html', 'styles.css', 'assets/css/project-covers.css']);
function add(value, parent = 'index.html') {
  if (!value || /^(data:|mailto:|#)/.test(value)) return;
  const url = new URL(value, new URL(parent, origin));
  if (url.origin !== origin.origin) return;
  const name = decodeURIComponent(url.pathname.replace(/^\//, '')) || 'index.html';
  const local = path.resolve(root, name);
  if (local.startsWith(root + path.sep) && fs.existsSync(local) && fs.statSync(local).isFile()) files.add(name);
}
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
for (const m of html.matchAll(/(?:src|href|poster)=["']([^"']+)["']/g)) add(m[1]);
for (const css of [...files].filter(f => f.endsWith('.css'))) {
  for (const m of fs.readFileSync(path.join(root, css), 'utf8').matchAll(/url\(["']?([^"')]+)["']?\)/g)) add(m[1], css);
}
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
(async () => {
  const mismatches = [];
  for (const file of files) {
    const url = new URL(file === 'index.html' ? './' : file, origin);
    url.searchParams.set('verify', revision);
    const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(30000) });
    if (!response.ok) { mismatches.push({ file, status: response.status }); continue; }
    const actual = digest(Buffer.from(await response.arrayBuffer()));
    const expected = digest(fs.readFileSync(path.join(root, file)));
    if (actual !== expected) mismatches.push({ file, expected, actual });
  }
  console.log(JSON.stringify({ url: origin.href, revision, checked: files.size, mismatches }, null, 2));
  if (mismatches.length) process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
