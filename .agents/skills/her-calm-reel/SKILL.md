---
name: her-calm-reel
description: Make faceless motion-graphics reels for the women's Facebook page "Her Calm Corner" (also Her Better Self / Soft & Strong) about self-care, beauty, health habits, confidence and money. A vertical 1080x1920 HyperFrames video, 20-32 s, in the house format. A warm, calm "older sister" voiceover drives every word on screen; gentle objects (to-do card, water glass, window, breathing circle, teacup, journal, coin jar) act out each line; a light paper canvas with rose, sage and honey; a soft circle-of-light motif and light-bloom transitions; a different serif/sans layout every scene; soft procedural sound. Use this whenever the user wants a women's page reel or video, a "gentle reminder" video, a self-care, overwhelm, rest, glow, boundaries or money-habit reel for women, or "a women's version" of the strong man videos, even if they only give a topic. Not for the men's page (use strong-man-reel).
---

# Her Calm Reel

Same production machine as the men's page, different soul: everything floats, fills, opens and breathes.
The starter reel ("A gentle reminder: the next small thing") is in [templates/reel/](templates/reel/index.html).
It builds and renders as-is, so each new video starts from a working, on-brand composition.

Read these when the step calls for them:
- [references/brand.md](references/brand.md): page voice (kind older sister), the "A gentle reminder" device, script rules, topic bank, guardrails, and how this page differs from the men's.
- [references/craft.md](references/craft.md): the format DNA, storyboard method, motif and object bank, layout and transition menus, palettes, and the starter reel scene by scene.
- [references/pipeline.md](references/pipeline.md): config schema, voice (ElevenLabs / Kokoro / recording), HyperFrames rules, build and verify commands, and the gotchas.

## Workflow

### 1. Script (the voice decides everything, so start here)
Read `references/brand.md`. Write 40–70 words on the user's topic in the page voice: soft, simple sentences
to "you"; **validate first, then one small practical step**; end with a kind reminder or a gentle question.
Open with "A gentle reminder…" or "If no one told you today…" when it fits (not every time). No shame,
pressure, fear or claims. Mark pauses and 3–5 comforting key words. **Show the script to the user and get a yes**
unless they gave the script or said go ahead.

### 2. Storyboard
Read `references/craft.md`. Make the scene table (line → object/motif → text layout → transition → SFX).
Check that neighbouring scenes differ in layout, every scene has a gentle object acting on its spoken word,
overwhelming things soften and fade rather than break, and the light motif opens, carries the main
transitions and returns at the end. Pick the palette.

### 3. Scaffold
```bash
python3 <this-skill-dir>/scripts/new_reel.py <slug>      # -> video-projects/<slug> (or ./<slug>)
```
Edit `reel.config.json`: the `script`, the `scenes` (cut points as word refs) and the soft `cues`.
Update `DESIGN.md` if the palette changes.

### 4. Voice
Follow `references/pipeline.md` §4. Preferred: an ElevenLabs warm, calm female narrator (not whispery, sultry
or hyped), the whole script in one take with soft `<break>` pauses. Estimate the cost first and make 2 takes, then
`engine: "file"`. Fallback: Kokoro (`af_sarah` 70% + `af_heart` 30%, already in the template). Then:
```bash
python3 tools/build.py --voice --sfx
```
Read the printed sentence spans and scene windows; they must match the audio and the storyboard.

### 5. Compose
Rewrite the scenes in `index.html` from the storyboard with the template's helpers (`floatIn`,
`lightBloom`, `lightSweep`, `dash`, word spans `data-w="sentence:index"`). Build each scene's end-state layout
first, then add entrances. Reveal scenes with `tl.set` or `fromTo(opacity 0 → 1)`, never a `from()` that starts
before the scene is shown. Keep the life layer (grain, warm vignette, drifting light dots, rose progress line)
and no text headers.

### 6. Verify (lint passing does not mean it looks right)
`npx hyperframes lint` and `validate` (contrast matters on a light canvas). Take snapshots at each hero frame
and transition, make a contact sheet with `tools/contact_sheet.py`, and look at it. Then **render a draft and pull
frames from the MP4**, because some bugs only show in a real render. Fix overlaps, margins (90 px sides, 120 px
top/bottom) and readability. Run `tools/check_voice.py` for a new voice.

### 7. Render and deliver
`npx hyperframes render --quality high`, then a CRF 18 master, a CRF 20 share copy (under 30 MB) and a
last-frame thumbnail. Check that `max_volume` is below 0 dB. Write VERIFY.md (say plainly if the audio was checked
by numbers only). Send the share copy and thumbnail with a short summary and how to change the script.

## What never changes
Faceless; every word on screen as it is spoken; gentle objects carry the meaning; a different layout each
scene; light canvas with rose, sage and honey; nothing slams, shakes or flashes; the ending holds on the kind
line, the light emblem, the CTA and the page name. Never shame, pressure, compare women or put down men.
No medical, diet or money claims.
