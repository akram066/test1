# Craft: how a Her Calm Corner reel looks and moves

## Contents
1. The format DNA (what must stay the same in every video)
2. From script to storyboard
3. Motif and object bank
4. Typography layout menu
5. Transition menu
6. Motion, sound and colour
7. The starter reel, scene by scene

## 1. The format DNA

This is the same machine as the men's page with a different soul. Keep these in every video.

1. **Faceless, words plus objects.** Gentle line-art objects act out each line; typography carries the voice. No people.
2. **One recurring motif: a soft circle of light.** It opens the reel, carries the main transition (the light
   bloom), and returns at the end as a small emblem by the page name. It can be a sun, a breath, a moon or a lamp.
3. **Every spoken word appears as it is spoken**, floating in about 0.1 s early (it never feels late or rushed).
4. **A different text layout in every scene**, never the same centered stack twice in a row (section 4).
5. **One object per scene, from the line's concrete noun**, and it acts softly: fills, opens, steams, breathes, grows.
6. **One primary transition (light bloom, about 60%) plus 2–3 soft accents.** No hard cuts, slashes or flashes.
7. **A light, warm paper canvas**, cocoa text, rose for the comforting key words, sage for calm, honey glows.
8. **Life layer:** paper grain, a warm vignette, a few drifting light dots, and a thin rose progress line. No text headers.
9. **A warm, calm female voice** with soft sound design: airy whooshes, chimes, a water drop, a page turn, a warm pad.
10. **The ending holds:** the kind line, a small light emblem, the CTA and the page name, readable as a thumbnail.

## 2. From script to storyboard

Make the table before writing HTML:

| # | Line(s) | Object / motif | Text layout | Transition out | SFX |
| --- | --- | --- | --- | --- | --- |

- **Scenes:** one per beat. A list of small steps works best as one scene that cascades (water → window → breathe).
- **Object:** take the gentlest concrete noun. If the line is abstract ("be kind to yourself"), use the light motif
  (a sun rising behind the words).
- **"Letting go" moments:** soften, fade or blur the overwhelming things (list items fading to 20% while the next
  small thing stays) instead of crossing them out harshly.
- **Pacing:** slower than the men's page. Entrances take 0.6–1.0 s, holds breathe, and one moment per reel is a
  real pause on screen.

## 3. Motif and object bank

**The light motif:** radial blush or honey circle; blooms (scale 0.3 → 1), breathes (1 → 1.08 yoyo), and
fills the frame for transitions.

**Overwhelm / tired side (taupe, faded, soft blur):** a long to-do card, a low battery, a messy desk outline,
a buzzing phone, a storm cloud, a tangled thread, a heavy bag.

**Care / calm side (rose, sage, honey):** a glass filling with water, a window opening onto light, a breathing
circle, a teacup with steam, a candle, a plant sprouting leaves, a journal with a check mark, a moon over a bed
(sleep), a coin jar filling (money), a mirror with a soft glow and a kind word (confidence), a door gently
closing (boundaries), a phone placed face down, a sunrise line, a bath of light.

**By pillar:**
- Beauty: mirror glow, water glass, sleep moon, SPF sun (no product claims).
- Health habits: walking path line, window light, stretching ribbon, water, tea.
- Confidence: mirror, standing flower, speech bubble with a kind sentence, a soft "no" card.
- Money: coin jar, small savings bar filling, a calm calendar check-in, a receipt folded away.

Simple SVG line art: cocoa strokes (6–7 px, round caps) and rose/sage/blush fills. Readable in under a second.

## 4. Typography layout menu

Use each at most once in a row. The starter reel used items 1–5.

1. **Opener card:** a small centered serif-italic line inside the light, with a hand-drawn underline stroke.
2. **Editorial headline + paper card:** a left-aligned headline on top, and a slightly rotated card below with the payoff written on it.
3. **Diagonal cascade:** three objects down a diagonal, each with its line beside it (alternating sides).
4. **Giant italic word + small line:** "Rest" at 230 px, "is not a reward." at 76 px, and an object below.
5. **Final card:** a centered kind line over a rising sun, then emblem, CTA in spaced caps, and the page name.
6. **Word inside an object:** "Breathe." inside the breathing circle, a word on a teacup or on a journal page.
7. **Handwritten note:** a slanted paper note pinned with a small heart or flower.
8. **Checklist ticking:** items appear one by one with gentle check marks.
9. **Split soft/hard:** the overwhelm side blurred left, the calm side sharp right.
10. **Quote card:** a large serif quote with rose quotation marks.

Fonts (approved): **Fraunces** (serif, variable): statements at 400–600, comforting words in *italic rose*.
**DM Sans** 500/700 for list items, the CTA and the page name. Sizes: 64–230 px for statements and 38–52 px for
labels. Self-hosted woff2 with `@font-face`.

## 5. Transition menu

Primary: **light bloom.** The motif circle grows from where the eye is (×7 over 0.4–0.5 s, `power2.in`), then
dissolves over the next scene (0.7 s, `sine.inOut`).

Soft accents:

| Transition | Means | Notes |
| --- | --- | --- |
| Warm light sweep | moving on gently | a blurred honey band crosses while the scenes cross-dissolve |
| Blur dissolve | settling, the closing thought | the old scene blurs out as the new one un-blurs |
| Page turn | a new chapter, journaling | a card rotates on its left edge (rotateY) |
| Dip to cream | a pause before the payoff | 6–8 frames of canvas colour, not black |
| Window / curtain open | fresh start, light | the panes rotate open onto honey light |

Reveal every scene with an explicit `fromTo(opacity 0 → 1)` (see pipeline gotchas). Never use hard cuts.

## 6. Motion, sound and colour

**Motion:** `power2.out` / `sine.out` fade-up with an 8 px blur for words; `back.out(1.3)` only for tiny
pops (list items, an emblem); `sine.inOut` for breathing, floating, filling and steam. No shakes, slams,
skews or strobes. Ambient: drifting light dots, a breathing vignette, steam.

**Sound** (soft kit, `tools/sfx.py`): `bloom` into the opener and the final card, `chime` on the gentle
device and the kind line, `air` on transitions, `pop` for list items, `pluck` for check marks, `drop` for water,
`page` for turning pages, a warm `drone` pad. SFX duck 6 dB under the voice; the pad sits very low (0.08).

**Colour** (light canvas). Palette bank, one accent family per video or series:

| Name | Canvas | Ink | Accent (words) | Calm | Glow |
| --- | --- | --- | --- | --- | --- |
| Rose (starter) | `#F6EFE8` | `#3A2B2E` | `#B9605A` | `#7F9C86` | `#D8B26E` |
| Lavender evening | `#F3EFF6` | `#2F2A3A` | `#7E5FA6` | `#8BA6A0` | `#E2C48F` |
| Sage morning | `#F1F2EA` | `#2E332B` | `#6E8B5F` | `#A9C4C0` | `#E6C27A` |
| Peach | `#FBF0E8` | `#3B2A25` | `#C46A4A` | `#8FA89A` | `#F0C078` |
| Night calm (dark variant) | `#1F1B24` | `#F3ECE6` | `#E3A6A0` | `#9DB8AE` | `#E8C98E` |

Keep text contrast at 4.5:1 or better on the canvas (`npx hyperframes validate` checks it).

## 7. The starter reel, scene by scene

"A gentle reminder: the next small thing" (about 25 s with the Kokoro voice). It is in `assets/template/index.html`.

| # | Beat | Object | Layout | Out |
| --- | --- | --- | --- | --- |
| 1 | A gentle reminder. | the light circle blooms; a hand-drawn underline | opener card | light bloom |
| 2 | You don't have to do everything today. Just the next small thing. | a to-do card: four big tasks fade and blur, "Just the next small thing." gets a rose check | editorial headline + card | warm light sweep |
| 3 | Drink a glass of water. Open the window. Breathe. | the glass fills; the window opens onto honey light; a breathing circle | diagonal cascade + word inside object | light bloom (from the breath) |
| 4 | Rest is not a reward. It's part of the work. | a teacup with drawing steam | giant italic word + small line, payoff bottom-right | blur dissolve |
| 5 | Be kind to yourself today. Follow for more gentle reminders. | a honey sun rises; a small light emblem | final card | hold |
