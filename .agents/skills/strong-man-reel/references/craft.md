# Craft: how a Strong Man reel looks and moves

## Contents
1. The format DNA (what must stay the same in every video)
2. From script to storyboard
3. Symbol and object bank
4. Typography layout menu
5. Transition menu
6. Motion, sound and colour
7. The approved reference reel, scene by scene

## 1. The format DNA

These are what made the approved reel work. Keep them in every video; change everything else.

1. **Faceless, words plus objects.** Typography carries the voice; symbolic objects carry the meaning. Never
   words alone, never people.
2. **One recurring symbol pair for the two men.** Approved: a hollow outlined **pawn** (weak) and a solid,
   lit **king** (strong). Swap the pair per series if you like, but keep the logic: weak = hollow, small,
   outlined, pulled around; strong = solid, lit, upright, still.
3. **Every spoken word appears as it is spoken.** The words are the captions. Each word enters about 0.06 s before
   its timestamp.
4. **A different text layout in every scene.** Never two consecutive scenes with the same arrangement, and
   never a centered vertical stack repeated scene after scene. See section 4.
5. **One object idea per scene, taken from the line's concrete noun** (calendar for "tomorrow", door for
   "leaves the room", phone for "phone").
6. **One primary transition (about 60%) plus 3–5 accents**, each accent chosen for what the cut means.
7. **Black canvas with one accent colour**; warm off-white for text; a desaturated grey marks the weak side.
8. **Persistent life layer:** film grain, a breathing vignette and a thin accent progress line at the
   bottom. No text headers (no tags, timers or section labels: they were removed on purpose).
9. **Sound design under a deep, wise voice:** whooshes on cuts, impacts on slams, a sub hit under the
   biggest line and the rule, a low drone, all ducked under the voice.
10. **The ending holds still:** the rule, a small strong-man emblem, the CTA and the page name, readable
    as a thumbnail.

## 2. From script to storyboard

Write the storyboard as a table before touching HTML. It forces one idea per scene and catches
repeated layouts.

| # | Line(s) | Object / metaphor | Text layout | Transition out | SFX |
| --- | --- | --- | --- | --- | --- |

How to fill it:
- **Scenes:** usually one per sentence. Merge very short lines that belong together ("It rises. It
  passes." share the wave scene). Split a long sentence at its comma when it carries two images
  ("Then he hates himself" / "and repeats it tomorrow" became the mirror and the calendar).
- **Object:** take the most concrete noun or verb in the line. If there is none, use the symbol pair or a
  metaphor from section 3. The object must act: it moves, breaks, fills or opens on the spoken word.
- **Layout:** pick from section 4 so neighbours differ.
- **Transition:** primary by default. Use an accent where the meaning changes: a topic change (weak → strong), a
  breaking point (crack), a loop (rewind), or entering a new space (zoom through a doorway).
- **Pacing:** fast cuts in the action list, slow calm motion for a reframe ("a wave"), and a held,
  breathing final card.

## 3. Symbol and object bank

**The two men (pick one pair per series and keep it):**
- Pawn (hollow, grey outline) vs king (solid accent, glowing). This is the approved pair.
- Flickering candle vs steady flame; cracked brick vs laid wall; slack rope vs taut rope;
  rusty key vs forged key; empty glass vs full glass.

**Weak-side props:** strings or puppet threads, a cracked mirror, a looping calendar, a draining battery,
a spinning clock, a dim flickering bulb, a phone glowing in the dark, an empty wallet, a sinking boat, a
treadmill to nowhere, a "redacted" bar (shame, secrecy).

**Strong-side props:** a door swinging open to light, a chessboard (moves, strategy), a rising sea wave
that passes, a forged blade, stairs, a mountain line, an anvil, a closed lock (boundaries), a ledger
filling with bricks (saving), a compass, a shield over a house (family), a rope pulled taut.

**By pillar:**
- Mind: lock, chess, compass, quiet room, tide.
- Body: dumbbell line art, stairs, sunrise horizon, heart-rate line (no health claims).
- Money: coin stack, brick wall building, ledger, safe, receipt tearing.
- Family: house outline, shield, table with chairs, two hands as simple outlines (never people).

Draw objects as SVG line art or simple filled shapes in the palette. They should read at phone size in
under a second.

## 4. Typography layout menu

Use each at most once in a row. The approved reel used items 1–9.

1. **Slam + typewriter:** a giant word slams in (scale 1.7 → 1, blur, 3-frame camera shake), the rest types
   letter by letter with an accent caret.
2. **Label + stamp:** a small condensed label beside an object, and a rubber-stamp phrase in an accent border.
3. **Terminal line + icon row:** a monospace line on top, then a row of 3 icons with a word under each
   (horizontal, not stacked).
4. **Broken type:** a word split along a crack, top and bottom halves offset.
5. **Word on an object:** the key word printed on the object itself (TOMORROW on the calendar page).
6. **Text on a path:** words ride an SVG path (a wave) via textPath. Keep the amplitude low so they stay readable.
7. **Editorial diagonal:** the headline top-left and the payoff bottom-right, with the object in the middle.
8. **Speed type:** words slide in from alternating sides with skew.
9. **Hanging words:** words hang from strings and sway, then drop free.
10. **Giant single word + small line:** one 400 px word with a small mono line.
11. **Counter:** a number counts up (money, days) with a label.
12. **Split screen:** weak left / strong right (or top/bottom) with mirrored words.

Fonts (approved): **Big Shoulders Display 900** for statements, **JetBrains Mono** for the "code" voice
(labels, connector words). Headlines are 100–330 px, labels 40–46 px. Every font is self-hosted
in `assets/fonts` with `@font-face` (lint requires this).

## 5. Transition menu

Primary (approved): **red blade slash.** A skewed accent panel sweeps across (0.2 s in, 0.26 s out); the scene swaps under it.

Accents, and when they mean something:

| Transition | Means | Notes |
| --- | --- | --- |
| Redaction flood | the secret is exposed, the hook ends | the redaction bar's clip-path grows to the full frame, then the panel lifts |
| Glass crack | breaking point, shame | cracks draw over the outgoing scene and persist onto the next scene's mirror |
| Tape rewind roll | a loop, repetition | scanlines plus a vertical roll with skew |
| Page tear | a new day, a topic change | an accent strip with a jagged edge scales to cover, then flies off |
| Zoom through | entering a new space | scale the outgoing world ×9 into a doorway or opening |
| Dip to black (4 frames) | weight before the rule | pure black overlay above everything |
| Blade cut (final) | freedom, the strings are cut | a thin light line, then elements drop free |

Never exit-animate a scene before its transition; the transition is the exit (a HyperFrames rule). Only
the final scene animates out, and in this format it holds instead.

## 6. Motion, sound and colour

**Motion:** entrances use `expo.out` / `power4.out` for slams, `back.out` for pops, `power3.out` for
heavy rises and `sine.inOut` for calm. At least 3 different eases per scene. Ambient drift on ghost words,
glows and the vignette so no frame is static. Camera shake lasts 3 frames, seeded (deterministic).

**Sound** (procedural, `tools/sfx.py`): whoosh on every cut, stamp or impact on slams, sub under the biggest
weak-side line and under the rule, crack, flips, riser before a topic change, slam and click for doors
and locks, snap for cut strings, and a low drone throughout. The SFX duck 6 dB and the drone 8 dB under the voice.

**Colour:** black canvas `#070405`, one accent, bone text `#F1E8E4`, ash `#8D7F81` for weak. Palette bank
(one accent per video or series):

| Name | Accent | Deep | Mood |
| --- | --- | --- | --- |
| Blood (approved) | `#E3141C` | `#7E0B12` | urge, danger, power |
| Ember | `#FF6A13` | `#8A2E00` | fire, effort, training |
| Steel | `#7FA7C9` | `#22394F` | cold discipline, mind |
| Brass | `#C9A24B` | `#5E4818` | money, legacy |
| Forest | `#3FA36B` | `#14402A` | growth, family, health habits |

Keep one accent per video; tint the black and ash slightly toward it.

## 7. The approved reference reel, scene by scene

"The habit no man talks about" (31.9 s with the ElevenLabs voice). It is in `templates/reel/index.html`;
copy its patterns.

| # | Beat | Object | Layout | Out |
| --- | --- | --- | --- | --- |
| 1 | The habit no man talks about | blade at frame 0, ghost word, redaction bar | slam + typewriter | redaction flood |
| 2 | A weak man gives in… bored, tired or alone | pawn pulled by red strings from a clock, a battery and a bulb; GIVES IN stamp | terminal line + icon row + label/stamp | glass crack |
| 3 | Then he hates himself | cracked mirror with the pawn in shards | broken type, diagonal | tape rewind |
| 4 | and repeats it tomorrow | tear-off calendar flips, rewinds, loops; loop arrow | word on object | page tear |
| 5 | A strong man knows… It rises. It passes. | lit king; a live sea wave that rises, then flattens | text on path + left/right row | blade slash |
| 6 | He stands up | king rises from lying down, dust | giant word | blade slash |
| 7 | He leaves the room | door opens to red light; the king walks in | editorial diagonal | zoom through |
| 8 | He moves his body | king hops across a perspective chessboard | speed type | blade slash |
| 9 | The phone stays outside the bedroom | phone slides out; door slams; lock clicks | headline + mono line + payoff | dip to black |
| 10 | Control your urges… Follow for more rules. | marionette bar, words on strings, blade cuts them free; king emblem | hanging words, final card | hold |
