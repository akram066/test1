---
name: her-calm-reel
description: Make faceless motion-graphics reels for the women's Facebook page "Her Calm Corner" (also Her Better Self / Soft & Strong) about self-care, beauty, health habits, confidence and money. A vertical 1080x1920 HyperFrames video of about 28-36 s in the house format. A warm, calm "older sister" voiceover that flows like a real person (breath groups, soft breaths) drives every word on screen; a living pastel background; one orb of light travels through the reel and becomes each scene's object (sun, badge, moon, a drop, the breath, a lamp) for match-cut transitions; illustrated objects (sticky notes, a glass that fills, a window with curtains, a teacup) act out each line; camera glides, wind and mist transitions; a different serif/sans layout every scene; soft procedural sound. Use this whenever the user wants a women's page reel or video, a "gentle reminder" video, a self-care, overwhelm, rest, glow, boundaries or money-habit reel for women, or "a women's version" of the strong man videos, even if they only give a topic. Not for the men's page (use strong-man-reel).
---

# Her Calm Reel

Same production machine as the men's page, different soul: everything floats, fills, opens and breathes.
The starter reel ("If no one told you today") is in [templates/reel/](templates/reel/index.html).
It builds and renders as-is, so each new video starts from a working, on-brand composition.

Read these when the step calls for them:
- [references/brand.md](references/brand.md): page voice (kind older sister), the "A gentle reminder" device, script rules, topic bank, guardrails, and how this page differs from the men's.
- [references/craft.md](references/craft.md): the format DNA, storyboard method, motif and object bank, layout and transition menus, palettes, and the starter reel scene by scene.
- [references/pipeline.md](references/pipeline.md): config schema, voice (ElevenLabs / Kokoro / recording), HyperFrames rules, build and verify commands, and the gotchas.

## Workflow

### 1. Script (the voice decides everything, so start here)
Read `references/brand.md`. Write 50–80 words on the user's topic in the page voice: soft, simple sentences
to "you" that sound said, not written (contractions, her real-life specifics, "I know..."); **validate first,
then one small practical step**; end with a kind reminder or a gentle question. Group the lines into breath groups.
Open with "A gentle reminder…" or "If no one told you today…" when it fits (not every time). No shame,
pressure, fear or claims. Mark pauses and 3–5 comforting key words. **Show the script to the user and get a yes**
unless they gave the script or said go ahead.

### 2. Storyboard
Read `references/craft.md`. Make the scene table (line → what the orb becomes → objects → text layout →
transition → SFX). Plan the orb's path first: every transition should be the light turning into the next
scene's object, blooming, or hiding behind mist. Check that neighbouring scenes differ in layout, every scene
has an object acting on its spoken word, and overwhelming things soften and leave rather than break. Pick the palette.

### 3. Scaffold
```bash
python3 <this-skill-dir>/scripts/new_reel.py <slug>      # -> video-projects/<slug> (or ./<slug>)
```
Edit `reel.config.json`: the `script`, the breath groups (`flow`), the `scenes` (cut points as word refs) and the soft `cues`.
Update `DESIGN.md` if the palette changes.

### 4. Voice
Follow `references/pipeline.md` §4. Preferred: an ElevenLabs warm, calm female narrator (not whispery, sultry
or hyped), the whole script in one take with `<break>` pauses between breath groups. Estimate the cost first and
make 2 takes, then `engine: "file"`. Fallback: Kokoro in breath groups with soft breaths and room tone
(`af_heart` 60% + `af_sarah` 40%, already in the template). Then:
```bash
python3 tools/build.py --voice --sfx
```
Read the printed sentence spans and scene windows; they must match the audio and the storyboard.

### 5. Compose
Rewrite the scenes in `index.html` from the storyboard with the template's helpers (`orb`, `floatIn`,
`writeIn`, `markIn`, `sky`, `motes`, `fadeIn`, word spans `data-w="sentence:index"`). Keep the living background
and the orb; replace scene content. Build each scene's end-state layout first, then add entrances. Reveal scenes
with `show` or `fadeIn`, never a `from()` that starts before the scene is shown. No text headers.

### 6. Verify (lint passing does not mean it looks right)
`npx hyperframes lint` and `validate` (contrast matters on a light canvas). Take snapshots at each hero frame
and transition, make a contact sheet with `tools/contact_sheet.py`, and look at it. Then **render a draft and pull
frames from the MP4**, because some bugs only show in a real render. Fix overlaps, margins (90 px sides, 120 px
top/bottom) and readability. Run `tools/check_voice.py` for a new voice.

### 7. Render and deliver
`npx hyperframes render --quality high`, then the CRF 18 master (the HQ file). Check that `max_volume` is below
0 dB on that file. Write VERIFY.md (say plainly if the audio was checked by numbers only). Send only the HQ master
(no share copy, no thumbnail unless asked) with a short summary and how to change the script.
The chat only accepts files up to 30 MiB. If the master is larger, send instead the highest-quality copy
that fits: two-pass x264 (`-preset slower -tune animation`, AAC 192k) with the bitrate set so the file
lands at about 29 MiB, and report its SSIM against the master. Never fall back to a small share copy.

Name every file you send after the post title only, never the page name (for example
`Where your money really goes.mp4`), so the files sort
cleanly in the user's Drive.

## What never changes
Faceless; every word on screen as it is spoken; one orb of light carries the reel from scene to scene;
illustrated objects carry the meaning; a different layout each scene; a light, living pastel background with
rose, sage and honey; nothing slams, shakes or flashes; the ending holds on the kind line, the sunrise, the CTA
and the page name. Never shame, pressure, compare women or put down men.
No medical, diet or money claims.
