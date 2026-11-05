// pre-paint each [data-raster] SVG layer of a reel to assets/paint/<id>.png (heavy filters rendered once): node raster_layers.cjs <project_dir>
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
(async () => {
  const dir = process.argv[2]; fs.mkdirSync(path.join(dir, 'assets/paint'), { recursive: true });
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto('file://' + path.join(dir, 'index.html') + '?raster=1'); await p.waitForTimeout(800);
  const ids = await p.evaluate(() => Array.from(document.querySelectorAll('[data-raster]')).map(g => g.getAttribute('data-raster')));
  for (const id of ids) {
    await p.evaluate((id) => {
      document.querySelectorAll('#reel > *').forEach(e => { if (e.id !== 'art') e.style.visibility = 'hidden'; });
      document.body.style.background = 'transparent'; document.querySelector('#reel').style.background = 'transparent'; document.documentElement.style.background = 'transparent';
      const art = document.querySelector('#art'); art.style.transform = 'none';
      art.querySelectorAll(':scope > g').forEach(g => { g.style.display = 'none'; });
      const t = document.querySelector('[data-raster="' + id + '"]'); let top = t; while (top.parentNode !== art) top = top.parentNode;
      top.style.display = ''; top.removeAttribute('mask'); top.setAttribute('visibility', 'visible');
      if (top !== t) Array.from(top.children).forEach(c => { c.style.display = (c === t || c.contains(t)) ? '' : 'none'; });
    }, id);
    await p.waitForTimeout(150);
    await p.screenshot({ path: path.join(dir, 'assets/paint', id + '.png'), omitBackground: true });
    console.log(id);
  }
  await b.close();
})();
