# Reel covers (thumbnails)

Every reel gets a designed cover instead of the raw first frame. The cover is built as `cover.html` in the reel
project and rendered with `node .agents/skills/her-calm-reel/templates/cover/render.cjs <project>/cover.html
<project>/renders/cover.png`. That gives `cover.png` (1080x1920) plus `cover_check.png`, a sheet showing the full
cover, the 4:5 feed crop, the 1:1 grid crop and a tiny phone-grid size.

## What a cover must do
- **One idea, read in half a second:** 3–6 words of hook in big type (main line ≥ 110 px), and one huge focal
  element (a word, a number or the motif) at 300 px or more. No body copy, no second sentence.
- **It is the reel's opening, made stronger:** the same hook idea, motif, palette and fonts, so it matches the
  first frame. Never spoil a reveal the reel holds back.
- **Safe zones:** the hook and focal element sit inside the centre square (y 420–1500), so the 1:1 grid crop keeps
  them. Everything important stays inside the 4:5 area (y 285–1635). Keep the top 250 px and bottom 330 px free
  of anything important, because the Facebook reel UI covers them.
- **Contrast:** dark ink on light or light on dark, never mid-tone on mid-tone. Over busy art, add a soft scrim
  behind the words.
- **The motif:** large and clear, one object, no clutter. Leave plenty of space so it feels calm.
- **Brand:** "HER CALM CORNER" small near the bottom of the 4:5 area. No logos, faces, people or emojis, as in
  the reels.
- **Check:** read `cover_check.png`. The words must still read in the 120 px phone-grid version, and nothing key
  may be cut off in the 4:5 or 1:1 crops.

Deliver it as `<Title>_thumbnail.png` (the cover), with the check sheet looked at before sending.
