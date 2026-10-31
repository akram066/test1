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

The text-card template (text card and then vs now) was lost with an earlier workspace and has not been rebuilt
yet. Its spec: cream background with a blush glow top-right and a peach glow bottom-left, 128 px round profile
picture, page name in DM Sans 700 cocoa, handle in taupe #82736D, body DM Sans 44/60 px, labels in rose spaced
caps, old thoughts in taupe, new ones in cocoa, the comforting line in Playfair Display italic 61 px rose.
