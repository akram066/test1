# THE STRONG MAN CODE: design

## Style Prompt
A heavy, serious, faceless self-discipline reel in red and black. It reads like a
classified rulebook: an industrial condensed display face states the rules, and a
monospace "code" voice labels them. Two chess pieces carry the story. The WEAK MAN is a
hollow, ash-outlined **pawn** pulled by red strings (the temptations). The STRONG MAN
is a solid, lit red **king**. Objects do the storytelling (clock, battery, bulb,
cracked mirror, tear-off calendar, sea wave, door, chessboard, phone, lock, marionette
control bar). Words are typeset differently in every scene: editorial left/right
offsets, text riding a wave path, words on a calendar page, words hanging from strings.
Never repeat the same centred vertical stack twice in a row.

## Colors
| Role | Hex | Meaning |
| --- | --- | --- |
| Ink (canvas) | `#070405` | Black, tinted toward red. ~85% of every frame |
| Panel | `#140809` | Objects and door slabs |
| Blood red | `#E3141C` | Strength, keywords, the brand slash, the king |
| Deep red | `#7E0B12` | Shadow side of red, strings, wave depth |
| Bone | `#F1E8E4` | Readable text (warm off-white) |
| Ash | `#8D7F81` | The weak side: pawn outline, weak labels (red-tinted grey) |

Red is the only hue. Bone exists for legibility; ash marks weakness.

## Typography
- **Big Shoulders Display 900**: statements and headlines, 100–330 px, tracking -0.02em.
- **JetBrains Mono 400/700**: the "code" register (HUD, labels, connector words), 36–48 px, tracking 0.12–0.3em.

## Motion
- Entrances: `expo.out` / `power4.out` for slams, `back.out(1.7)` for pops, `power3.out` for heavy rises,
  `sine.inOut` for calm (the wave). Exits only inside transitions and the final scene.
- Primary transition: **red blade slash** (a skewed red panel sweeps across). Accents: redaction
  expand, glass crack, tape rewind roll, calendar page tear, zoom through the doorway, dip to black.
- A red progress hairline, grain and a breathing vignette keep every frame alive. No text headers.

## What NOT to Do
- No faces, bodies, people, photos, emojis, or explicit imagery. No medical claims.
- No second accent hue (no gold, blue, green). No pure #000/#fff.
- No centred vertical word stacks repeated scene after scene.
- No full-screen linear gradients (H.264 banding). Use radial glows.
- Keep text inside the 120 px top/bottom and 90 px side safe margins.
