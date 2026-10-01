# Her Calm Corner: design

## Style Prompt
A soft, warm, faceless self-care reel that feels like a kind older sister talking to you at the end of a
long day. A light, paper-warm canvas; a gentle serif with italic emphasis says the words; a quiet sans
labels them. One recurring motif, a **soft circle of light** (a sun, a breath, a moon), blooms in, carries
the transitions and returns at the end. Simple line-art objects (to-do card, glass of water, window,
breathing circle, teacup, candle, plant, journal, moon, coin jar) act out each line. Nothing slams, shakes
or flashes: everything floats, fills, opens and breathes.

## Colors
| Role | Hex | Meaning |
| --- | --- | --- |
| Canvas | `#F6EFE8` | warm paper cream, ~80% of every frame |
| Card | `#FFF9F3` | paper cards and panels |
| Ink | `#3A2B2E` | readable text and line art (warm cocoa, never pure black) |
| Rose | `#B9605A` | key words, check marks, the CTA: care and warmth |
| Blush | `#E8B9AE` | the light motif, soft fills |
| Sage | `#7F9C86` | calm, growth, breath, water |
| Honey | `#D8B26E` | light glows, decor only (never text) |
| Taupe | `#A49189` | the "tired / overwhelmed" side: faded items, dim props |

## Typography
- **Fraunces** (variable): statements at 400–600, emphasis words in *italic* (rose), 64–220 px.
- **DM Sans** 500/700: labels, list items, CTA and page name, 38–48 px, tracking 0.08–0.35em for small caps.

## Motion
- Entrances: fade-up with a little blur (`power2.out`, 0.6–0.9 s), floats (`sine.inOut`), gentle pops
  (`back.out(1.3)`). Never a camera shake, a slam or a hard cut.
- Primary transition: **light bloom** (the motif circle grows to fill the frame, then dissolves).
  Accents: warm light sweep, blur crossfade, page turn, dip to cream.
- Life layer: paper grain, a warm vignette, a few drifting light dots, a thin rose progress line. No text headers.

## What NOT to Do
- No faces, bodies, people or photos; no emojis; no harsh red, no neon, no pure #000/#fff.
- No fear, shame, pressure or "you're doing it wrong" framing; no comparing women; no putting down men.
- No medical, diet, weight-loss or money-return claims.
- No full-screen linear gradients (banding); use radial glows.
- Keep text inside the 120 px top/bottom and 90 px side safe margins.
