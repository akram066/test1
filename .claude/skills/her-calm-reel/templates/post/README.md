# Her Calm Corner: image-post kit

Committed here so it survives a fresh workspace. Renders 1080x1350 (4:5) PNG posts.

- `photo-card.html`: photo + headline. The photo fills the top 840 px (62%); below it a cream band (#F6EFE8)
  with a soft blush glow, a thin rose rule (#D9A6A0) with the round profile picture and handle in the middle,
  then a centred Playfair Display headline (84 px, cocoa #3A2B2E). Words between `*asterisks*` are rose
  italic (#AE5550).
- `avatar.svg` / `avatar.png`: the sunrise profile picture (the PNG is generated from the SVG on first render).
  Replace `avatar.png` with the page's real profile picture when one is provided.
- `fonts/`: DM Sans and Playfair Display (regular + italic), self-hosted, OFL.
- `photos/`: photos used by posts (generated with Canva, read back at full size in tiles).
- `posts/<name>.json` + `<name>_caption.txt`: one post per file.
  `{"template":"photo-card","photo":"photos/x.jpg","photoPos":"50% 45%","handle":"@hercalmcorner","headline":["line","*rose italic*","line"]}`
- Render: `node render.cjs posts/<name>.json` -> `out/<name>.png` (prints the headline's top and bottom).
- Check every post at phone size (390 px wide) before delivering.

- `text-card.html`: text card (and then vs now). Cream background (#F6EFE8) with a blush glow top-right and a
  peach glow bottom-left; 128 px round profile picture; page name DM Sans 700 46 px cocoa (#3A2B2E); handle
  33 px taupe (#82736D); body DM Sans 44/60 px cocoa from y 290. Blocks: `lead` (bold), `p`, `gap` (one blank
  line), `accent` (Playfair Display italic 61 px rose #AE5550); inline `<em>` is rose italic. `"center": true`
  places a short post at 290 + 42% of the free space; long posts shrink to fit (down to 80%).
  `{"template":"text-card","handle":"@hercalmcorner","center":true,"blocks":[{"type":"lead","lines":["..."]},{"type":"gap"},...]}`
  (Rebuilt on 2026-11-02 from the series spec after the original kit was lost; then-vs-now label/old/new
  blocks still need adding when that format is next requested.)
