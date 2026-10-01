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

The same machine as the men's page with a different soul. Keep these in every video.

1. **Faceless, words plus illustrated objects.** Soft illustrated objects (gradients, gentle shadows) act out
   each line; typography carries the voice. No people.
2. **One orb of light that travels through the whole reel.** It is the page's motif and it becomes each
   scene's object: a sun, a badge, the moon, a drop, a breath, a lamp. Most transitions are this orb changing
   into the next thing (a match cut), so the reel feels like one continuous shot, not a slideshow.
3. **A living background shared by every scene:** sky tints that change with the mood (dawn peach, heavy
   taupe for overwhelm, dusk lilac, lamp amber, sunrise), drifting colour blooms and dust motes. Scenes are
   transparent layers on top, so nothing ever cuts to a flat new colour.
4. **Every spoken word appears as it is spoken**, floating up out of a blur about 0.1 s early. The comforting
   word writes itself in letter by letter (italic rose), and the payoff gets a hand-drawn highlighter.
5. **A different text layout in every scene** (section 4), and words sit *on* objects when they can (the
   spoken items on sticky notes, a mail notification and a chat bubble).
6. **Each object acts on its word:** cards pile up on "endless", the moon wanes on "tonight", a drop falls and
   the glass fills on "water", the window opens on "Open", the orb inhales on "breath", steam rises on "rest".
7. **Overwhelm softens and leaves; it never breaks:** the pile blows away like leaves, the heavy tint lifts.
8. **The camera moves:** slow push-ins inside scenes, glides through a tall world for a list of steps.
9. **A warm, calm female voice that sounds like one person talking:** breath groups, natural pauses, soft
   breaths, a quiet room (pipeline §4). Soft sound design: air, wind, chimes, twinkles, a drop, a warm pad.
10. **The ending holds:** the kind line, the sunrise (the light, back where it began), the CTA and the page name.

## 2. From script to storyboard

Make the table before writing HTML. Add a column for what the orb becomes:

| # | Line(s) | Orb becomes | Objects | Text layout | Transition out | SFX |
| --- | --- | --- | --- | --- | --- | --- |

- **Scenes:** one per beat (opener, feeling, release, steps, reframe, close). Steps share one scene that
  the camera glides through, one screen per step.
- **The orb's path:** decide what the light is in every scene first, then make each transition a move from
  one to the next (sun → badge, badge → moon, moon → small dot, dot → drop, bubble → sun in the window,
  sun → breath, breath fills the frame → lamp, lamp → sunrise). If it can't become the next thing, it blooms
  to fill the frame or hides behind mist and comes back.
- **Object:** take the gentlest concrete noun. Abstract line ("be gentle with yourself")? Use the light itself
  (the sunrise).
- **Pacing:** entrances 0.6–1.0 s; glides about 1 s; one real pause on screen (the breath).
- **Direction matters:** a drop falls, so the camera glides down; a bubble rises, so the next screen is
  sideways or above. Never make the eye feel an object fall *out* of where it should be.

## 3. Motif and object bank

**The orb's colour layers** (cross-faded): honey (sun, lamp light), rose (badge, a warm heart), moon (cream,
with a CSS-mask crescent that waxes and wanes), sage (breath, water, calm), amber (lamp glow, warm bloom).

**Overwhelm / tired side (taupe tint, piling up, then blown away):** sticky notes, notification cards with a
rising badge count, chat bubbles with typing dots, a low battery, a buzzing phone, a storm cloud, a tangled
thread, a heavy bag.

**Care / calm side:** a glass filling with water (wave surface, bubbles), a window with curtains opening onto
light (a beam and dust), a breathing orb with rings, a teacup with steam and a swinging tag, a candle, a plant
sprouting leaves, a journal with a check mark, a moon and stars over clouds (sleep), a coin jar filling
(money), a mirror with a soft glow (confidence), a door gently closing (boundaries), a phone placed face down,
hills and a sunrise.

**By pillar:**
- Beauty: mirror glow, water glass, sleep moon, SPF sun (no product claims).
- Health habits: walking path, window light, stretching ribbon, water, tea.
- Confidence: mirror, standing flower, a speech bubble with a kind sentence, a soft "no" card.
- Money: coin jar, savings bar filling, a calm calendar check-in, a receipt folded away.

Build objects as SVG or CSS with soft gradients, a light highlight stroke and a gentle shadow, in the palette
(no flat black line art). They must read at phone size in under a second.

## 4. Typography layout menu

Use each at most once in a row. The starter reel uses 1, 2, 3, 4, 5, 6, 7 and 9.

1. **Soft line + big statement:** a small centred italic line on top, a left-aligned 136 px statement below
   with a highlighter under the key word.
2. **Headline + words on objects:** a left headline, then the spoken items written on cards as they land.
3. **Staircase:** three left-aligned lines growing in size (76 → 150 → 212 px), the last one italic rose.
4. **Centred pair + object below:** "Just do one / small thing." over the glowing dot in a scribble circle.
5. **Text above an object, left:** "Fill a glass / of water." top-left, the glass centred below.
6. **Object above, text below in a beam of light:** the window, then "Open the / window / for a minute."
7. **Giant italic word + side lines + right-aligned payoff:** "Rest" at 256 px, two small lines, the cup, then
   the payoff bottom-right with a highlighter.
8. **Word inside an object:** a word on a teacup, on a journal page or inside the breathing orb.
9. **Final card:** a centred kind line, CTA in spaced caps, page name, over a sunrise behind hills.
10. **Checklist ticking**, **quote card with rose quotation marks**, **handwritten note pinned with a heart**.

Fonts (approved): **Fraunces** (variable) for statements at 400–600, comforting words in *italic rose*.
**DM Sans** 500/700 for card text, the CTA and the page name. Sizes: 64–256 px for statements and 34–62 px on
cards and labels. Self-hosted woff2 with `@font-face`.

## 5. Transition menu

No plain crossfades between unrelated scenes. Pick the one that means something:

| Transition | Means | How (helpers in the template) |
| --- | --- | --- |
| Orb match cut | this becomes that | `orb(t, {x, y, scale, lay})` moves the light into the next object's spot; hand off to an in-scene copy when it must sit on top (the badge) |
| Wind | letting go of the pile | wind lines draw across (`#wind`), every card flies off right and up with rotation and blur, staggered |
| Warm light leak | night turns gentle, a new start | `#leak` band sweeps across while the old scene fades under it |
| Camera glide | the next small step | `#world` moves one screen; the orb travels with the camera (a drop falls, a bubble rises) |
| Breath bloom | breathe in, and everything softens | the orb scales ×10 into amber and fills the frame, then contracts into the next scene's light |
| Rising mist | a calm reset before the close | steam lifts, `#fog` rises over the frame and away, the sunrise is underneath |
| Dip to cream | a pause before the payoff | 6–8 frames of canvas colour, never black |

Reveal every scene with `fadeIn()` (an explicit `fromTo(opacity 0 → 1)`) or `show()`; never a `from()` that
starts before the scene is visible (see pipeline gotchas).

## 6. Motion, sound and colour

**Motion:** words fade up from an 8 px blur (`power2.out`), key words write in letter by letter
(`sine.out`, staggered across the spoken word), cards land with `power3.out`, glides use `power3.inOut`,
breathing and floating use `sine.inOut`. Slow push-ins (scale 1 → 1.03–1.06) on every scene. No shakes,
slams, skews or strobes. Ambient: drifting blooms, dust motes, twinkling stars, swaying curtains, steam.

**Sound** (soft kit, `tools/sfx.py`): `bloom` under the sunrise, the window light and the breath bloom;
`chime` on the kindest words; `air` on match cuts and glides; `wind` when the pile blows away; `twinkle` for
stars and the moon; `pop` as cards land; `pluck` for the scribble and the end; `drop` as the light falls into
the glass; a warm `drone` pad. SFX duck 6 dB under the voice; the pad sits very low (0.08).

**Colour** (light, warm). Palette bank, one accent family per video or series:

| Name | Canvas | Ink | Accent (words) | Calm | Glow |
| --- | --- | --- | --- | --- | --- |
| Rose (starter) | `#F6EFE8` | `#3A2B2E` | `#AE5550` | `#5E7F68` | `#F3C67F` |
| Lavender evening | `#F3EFF6` | `#2F2A3A` | `#7E5FA6` | `#5F7F79` | `#E2C48F` |
| Sage morning | `#F1F2EA` | `#2E332B` | `#5E7B50` | `#6F9792` | `#E6C27A` |
| Peach | `#FBF0E8` | `#3B2A25` | `#B85E40` | `#5F7E70` | `#F0C078` |
| Night calm (dark variant) | `#1F1B24` | `#F3ECE6` | `#E3A6A0` | `#9DB8AE` | `#E8C98E` |

Keep text contrast at 4.5:1 or better (`npx hyperframes validate` checks every text element).

## 7. The starter reel, scene by scene

"If no one told you today" (about 36 s with the Kokoro flow voice). It is in `templates/reel/index.html`.

| # | Beat | The orb | Objects | Layout | Out |
| --- | --- | --- | --- | --- | --- |
| 1 dawn | If no one told you today... you're doing better than you think. | the sun rises behind three hills, rays turn | hills, rays, highlighter under "better" | 1 | match cut: the sun shrinks into the red badge on a to-do card |
| 2 pile | I know the list feels endless. The dishes, the emails, the texts you haven't answered. | the badge (counts 3 → 47) | cards and sticky notes pile up; the spoken items land on a sticky note, a mail card and a chat bubble with typing dots | 2 | wind: the pile blows away; the badge floats up into the moon |
| 3 dusk | You don't have to finish it tonight. | the moon wanes to a crescent | stars twinkle, clouds drift | 3 | light leak; the moon sinks into a small glowing dot |
| 4 steps | Just do one small thing. Fill a glass of water. Open the window for a minute. Take one slow breath. | the dot → a drop into the glass → a bubble → the sun in the window → the sage breath | scribble circle, glass that fills (wave, bubbles, ripple), window with curtains and a beam, breathing rings | 4, 5, 6, centred | camera glides (down, sideways, down); the breath blooms to fill the frame |
| 5 lamp | Rest isn't something you earn. It's part of how you keep going. | amber lamp glow | teacup with steam and a swinging tag | 7 | rising mist |
| 6 close | So be gentle with yourself today. Follow for more gentle reminders. | the sunrise, behind hills (a callback to scene 1) | hills, rays | 9 | hold |
