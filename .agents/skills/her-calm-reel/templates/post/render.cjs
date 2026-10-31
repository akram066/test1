// Render a Her Calm Corner post: node render.cjs posts/<name>.json -> out/<name>.png
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const src = path.resolve(process.argv[2]); const post = JSON.parse(fs.readFileSync(src, 'utf8'));
  const kit = __dirname, tpl = path.join(kit, (post.template || 'photo-card') + '.html');
  const out = path.join(kit, 'out', path.basename(src, '.json') + '.png');
  if (!fs.existsSync(path.join(kit, 'avatar.png'))) {
    const b0 = await chromium.launch(); const p0 = await b0.newPage({ viewport: { width: 512, height: 512 } });
    await p0.goto('file://' + path.join(kit, 'avatar.svg')); await p0.screenshot({ path: path.join(kit, 'avatar.png'), omitBackground: true }); await b0.close();
  }
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1350 } });
  await p.goto('file://' + tpl); await p.evaluate(post => window.applyPost(post), post);
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
  const box = await p.evaluate(() => { const r = document.getElementById('head').getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom) }; });
  await p.screenshot({ path: out }); await b.close(); console.log(out, JSON.stringify(box));
})();
