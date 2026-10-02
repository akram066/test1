---
name: strong-man-reel
description: Make faceless motion-graphics reels for the men's Facebook page "The Strong Man Code" in the approved house format. A vertical 1080x1920 HyperFrames video of 25-35 s where a deep, wise voiceover drives every word on screen; symbolic objects (weak-man pawn vs strong-man king, doors, calendars, waves) tell the story; a black canvas with one accent colour; a different text layout every scene; a red blade-slash transition plus accents; procedural sound design. Use this whenever the user wants a men's page reel or video, another video "like the strong man one", a weak man vs strong man video, or a short discipline/money/fitness/family self-improvement reel for men, even if they only give a topic or a single line. Not for the women's page (use her-calm-reel).
---

# Strong Man Reel

Every reel in this series has the same machine and a different subject. The approved reference
("The habit no man talks about") is in [templates/reel/](templates/reel/index.html). It builds and
renders as-is, so each new video starts from something that already works and replaces the script,
objects, colours and scenes.

Read these when the step calls for them:
- [references/brand.md](references/brand.md): page voice, the weak man vs strong man device, script rules, topic bank, guardrails.
- [references/craft.md](references/craft.md): the format DNA, storyboard method, object bank, layout and transition menus, palettes, and the reference reel broken down scene by scene.
- [references/pipeline.md](references/pipeline.md): config schema, voice (ElevenLabs / Kokoro / recording), HyperFrames rules, build and verify commands, and the gotchas.

## Workflow

### 1. Script (the voice decides everything, so start here)
Read `references/brand.md`. Write a 55–80 word script on the user's topic in the page voice: wise, calm,
direct, no jokes or slang, speaking to "you". Use the arc hook → weak man / problem → turn → strong man
actions → rule → CTA. Use the weak man vs strong man device when the topic fits (weak first, strong last). Mark
pauses and 3–6 key words. **Show the script to the user and get a yes before building**, unless they gave you
the script or said to go ahead.

### 2. Storyboard
Read `references/craft.md`. Make the scene table (line → object → text layout → transition → SFX). Check
three things: no two neighbouring scenes share a layout, every scene has an object that acts on its spoken
word, and the primary transition carries most cuts while accents mark meaning (topic change, loop, breaking
point, entering a space). Pick the palette (one accent) and the symbol pair for the two men.

### 3. Scaffold
```bash
python3 <this-skill-dir>/scripts/new_reel.py <slug>      # -> video-projects/<slug> (or ./<slug>)
```
Then edit `reel.config.json`: the `script`, the `scenes` (cut points as word refs) and the `cues` (SFX on word
refs). Update `DESIGN.md` if the palette or symbols change.

### 4. Voice
Follow `references/pipeline.md` §4. The page's standing voice for every reel is the ElevenLabs library voice
"Bill Adams - Wise and Motivational American Storyteller" (`V2bPluzT7MuirpucVAKH`, model `eleven_multilingual_v2`):
the whole script in one take with `<break>` pauses, 2 takes, download, pick the clearer, then `engine: "file"`.
Check the aligned word times against the audio energy (it can drop a word into a `<break>`) and fix them in
`transcript.json`. Use Kokoro only if ElevenLabs is unavailable, and tell the user first. Then:
```bash
python3 tools/build.py --voice --sfx
```
Read the printed sentence spans and scene windows: they must match what you hear and what the storyboard says.

### 5. Compose
Rewrite the scenes in `index.html` from the storyboard, reusing the template's patterns and helpers
(word spans `data-w="sentence:index"` entering at `ws() - LEAD`, `slash()`, `show/hide`, beats in `B`,
`render()` for procedural drawing). Build each scene's end-state layout first, then add entrances. Keep the
life layer (grain, vignette, progress line) and no text headers.

### 6. Verify (do not skip; lint passing does not mean it looks right)
`npx hyperframes lint` and `validate`, then snapshots at every hero frame and transition midpoint plus frame 0
and the last frame. Make a contact sheet with `tools/contact_sheet.py` and look at it. Then render a draft and pull frames from the MP4 (some bugs only show in a real render). Fix overlaps, safe
margins (90 px sides, 120 px top/bottom), readability and beat collisions, then re-check. Run
`tools/check_voice.py` if the voice is new.

### 7. Render and deliver
`npx hyperframes render --quality high`, then a CRF 18 master, a CRF 20 share copy (under 30 MB) and a
last-frame thumbnail. Confirm `max_volume` < 0 dB on the final file. Write VERIFY.md (what was checked and what
was fixed; say plainly that the audio was checked by numbers if you could not listen). Send the share copy and
thumbnail, and give a short summary: scene timings and how to change the script.

## What never changes
Faceless (no people, faces or photos); every word on screen as it is spoken; objects carry the meaning; a
different layout each scene; one accent on black; the weak side greyed out; the ending holds on the rule, an
emblem, the CTA and the page name. No medical or financial claims, no putting down women or any group.
