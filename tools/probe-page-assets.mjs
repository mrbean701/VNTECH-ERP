// Verify the SSR page served at :9000 references asset bundles that really exist (no 404 -> no stuck "Đang kiểm tra...").
const BASE = process.env.VNTECH_BASE || 'http://127.0.0.1:9000';

const html = await (await fetch(BASE + '/')).text();
console.log('page bytes:', html.length);

const refs = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((m) => m[1]);
const assets = [...new Set(refs)].filter((u) => /\.js|\.css/.test(u));
console.log('asset refs found:', assets.length);

let bad = 0;
for (const a of assets) {
  const url = a.startsWith('http') ? a : BASE + (a.startsWith('/') ? a : '/' + a);
  try {
    const r = await fetch(url, { redirect: 'follow' });
    const ok = r.status === 200;
    if (!ok) bad++;
    const len = (await r.arrayBuffer()).byteLength;
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${r.status}  ${String(len).padStart(8)} bytes  ${a}`);
  } catch (e) {
    bad++;
    console.log(`  FAIL  ERR  ${a}  ${e.message}`);
  }
}

// Stuck-loader signature: the loading screen text present but no JS means perpetual spinner.
const loader = /Đang kiểm tra dữ liệu và quyền truy cập/.test(html);
console.log('\nssr shell:', loader ? 'has loading screen (only acceptable if bundle above loads)' : 'no loading screen');
console.log(`RESULT: ${bad === 0 ? 'ALL ASSETS OK' : bad + ' ASSET(S) BROKEN'}`);
process.exitCode = bad === 0 ? 0 : 1;
