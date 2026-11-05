// Render a reel cover and a legibility check sheet.
//   node render.cjs <project>/cover.html <out.png> [check.png]
// cover.html is a 1080x1920 page (see README.md). The check sheet shows the full 9:16 cover, the 4:5 feed crop,
// the 1:1 grid crop and a tiny phone-grid size, so the cover can be judged the way Facebook will show it.
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
(async () => {
  const src = path.resolve(process.argv[2]), out = path.resolve(process.argv[3]);
  const check = process.argv[4] ? path.resolve(process.argv[4]) : out.replace(/\.png$/, '_check.png');
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto('file://' + src); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(400);
  await p.screenshot({ path: out });
  const img = 'data:image/png;base64,' + fs.readFileSync(out).toString('base64');
  const q = await b.newPage({ viewport: { width: 1340, height: 760 } });
  await q.setContent(`<body style="margin:0;background:#2b2b2b;font:14px sans-serif;color:#ddd;display:flex;gap:20px;padding:20px;align-items:flex-start">
    <div><div>9:16 cover</div><img src="${img}" style="width:360px;display:block"></div>
    <div><div>4:5 feed crop</div><div style="width:360px;height:450px;overflow:hidden"><img src="${img}" style="width:360px;margin-top:-95px"></div></div>
    <div><div>1:1 grid crop</div><div style="width:360px;height:360px;overflow:hidden"><img src="${img}" style="width:360px;margin-top:-140px"></div></div>
    <div><div>phone grid</div><img src="${img}" style="width:120px;display:block"></div></body>`);
  await q.waitForTimeout(200); await q.screenshot({ path: check });
  await b.close(); console.log(out); console.log(check);
})();
