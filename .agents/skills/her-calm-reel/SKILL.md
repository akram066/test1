---
name: her-calm-reel
description: Make faceless, words-only motion-graphics reels for the women's Facebook page "Her Calm Corner" (also Her Better Self / Soft & Strong) about self-care, beauty, health habits, confidence, money, work and family. A vertical 1080x1920 HyperFrames reel of 25-35 s that follows the owner's standing rules: a hook on screen from the first frame, a tiny story of one woman told through objects and words, a turn, 1-3 tiny steps, a payoff that calls back to the hook, and a soft CTA, in the voice of a kind, calm older sister; one new motif per reel that changes with the story and carries match-cut transitions; a new palette, font pairing and layouts every reel; soft procedural sound. Use this whenever the user wants a women's page reel or video, a self-care, overwhelm, rest, glow, boundaries, work or money-habit reel for women, or "a women's version" of the strong man videos, even if they only give a topic. Not for the men's page (use strong-man-reel).
---

# Her Calm Reel

**Start with [references/standing-rules.md](references/standing-rules.md).** The page owner's standing
instructions (2026-11-01) override everything else here: the story formula, hook rules, pacing, look, motif,
sound, never-repeat rule, quality bar and what to show and deliver. Where this file or another reference
disagrees (the older tough-love voice, the travelling orb, "HQ only" delivery), the standing rules win.

The starter reel ("If no one told you today") is in [templates/reel/](templates/reel/index.html). It builds and
renders as-is and shows the quality level and the pipeline; it is **not** a design to copy.
[references/used-designs.md](references/used-designs.md) logs every earlier reel's motif, palette, fonts and
hook so nothing is reused. Image posts use the kit in [templates/post/](templates/post/README.md).

Read these when the step calls for them:
- [references/standing-rules.md](references/standing-rules.md): the owner's standing rules for every reel (read first, every time).
- [references/used-designs.md](references/used-designs.md): motifs, palettes, fonts and hooks already used.
- [references/brand.md](references/brand.md): the page, audience, topic bank, guardrails, and how this page differs from the men's.
- [references/craft.md](references/craft.md): the format DNA, storyboard method, motif and object bank, layout and transition menus, palettes, and the starter reel scene by scene.
- [references/pipeline.md](references/pipeline.md): config schema, voice (ElevenLabs / Kokoro / recording), HyperFrames rules, build and verify commands, and the gotchas.

## Workflow

### 1. Script
Read `references/standing-rules.md` §3-6. If the owner gave a script, use it as written. Otherwise write 55-80
words in the story formula (hook under 12 words; one woman, one moment, 2-3 concrete details; an open loop; a
turn with a real pause; 1-3 tiny sized steps; a payoff that calls back to the hook; one kind line and a soft
CTA), in the kind, calm older-sister voice. Pick a hook type different from the last reel's (see
`used-designs.md`). Mark 3-5 key words for the warm accent.

### 2. Concept and storyboard, then wait for "go"
Read `references/craft.md` for technique and `used-designs.md` for what is taken. Choose a **new** motif from
the topic's world (it shows the problem, changes at the turn, acts out the solution and returns changed in the
payoff), a new palette with one warm accent, a new serif + sans pairing, and new layouts and transitions.
Show the owner the script (unless she gave it) with the hook type, a one-paragraph concept and the scene table
(time → line → story beat → motif / object → text layout → transition → sound). Build after she says go.

### 3. Scaffold
```bash
python3 <this-skill-dir>/scripts/new_reel.py <slug>      # -> video-projects/<slug> (or ./<slug>)
```
Edit `reel.config.json`: the `script`, the breath groups (`flow`), the `scenes` (cut points as word refs) and the soft `cues`.
Update `DESIGN.md` if the palette changes.

### 4. Voice
Follow `references/pipeline.md` §4. The house voice is ElevenLabs **Lily Wolff** (`qBDvhofpxp92JgXJxDjB`), chosen
by the page owner: use her unless the user asks for another. The whole script in one take with `<break>` pauses
between breath groups. Estimate the cost first, make 1 take, then `engine: "file"`. Fallback: Kokoro in breath groups with soft breaths and room tone
(`af_heart` 60% + `af_sarah` 40%, already in the template). Then:
```bash
python3 tools/build.py --voice --sfx
```
Read the printed sentence spans and scene windows; they must match the audio and the storyboard.

### 5. Compose
Write a new `index.html` from the storyboard: a living background, parallax layers, the reel's own motif and
objects, and word spans `data-w="sentence:index"` (the template's helpers such as `floatIn`, `writeIn`,
`markIn`, `sky` and `fadeIn` can be reused; the orb and the template's look are not). Hold the standing rules'
quality bar: 3+ eases per scene, wind-up and settle, nothing still for more than 3 s except the turn's pause. Build each scene's end-state layout first, then add entrances. Reveal scenes
with `show` or `fadeIn`, never a `from()` that starts before the scene is shown. No text headers.

### 6. Verify (lint passing does not mean it looks right)
`npx hyperframes lint` and `validate` (contrast matters on a light canvas). Take snapshots at each hero frame
and transition, make a contact sheet with `tools/contact_sheet.py`, and look at it. Then **render a draft and pull
frames from the MP4**, because some bugs only show in a real render. Fix overlaps, margins (90 px sides, 120 px
top/bottom) and readability. Run `tools/check_voice.py` for a new voice.

### 7. Render and deliver
`npx hyperframes render --quality high`, then a CRF 18 master (the HQ file), a **share copy under 30 MB**
(`<Title>_share.mp4`, CRF 23-26 and lower audio bitrate until it fits) and a **designed cover** as the thumbnail:
build `cover.html` in the project from the hook, motif and palette, render it with
`node .agents/skills/her-calm-reel/templates/cover/render.cjs <project>/cover.html <project>/renders/cover.png`, and read
`cover_check.png` (4:5 and 1:1 crops, phone-grid size) before sending. The rules are in `templates/cover/README.md`. Check that `max_volume` is below 0 dB. Check the whole reel on mute. Write
VERIFY.md (say plainly if the audio was checked by numbers only). Send the HQ video, the share copy and the
thumbnail with the scene timings. Name files by the reel's **title only**, e.g. `A-Small-Savings-Habit-That-Sticks.mp4`,
`..._share.mp4`, `..._thumbnail.png`. Do not re-send earlier reels. Add the reel to `used-designs.md`.

**Deliver the Facebook text with every new reel** (in the same message as the video and thumbnail, and in
the posted list); the owner should not have to ask for it. Give a **description of one or two sentences about the subject** that does
not repeat the reel's words, plus three hashtags ending in `#hercalmcorner`. Then give a **first comment**: one
easy question readers can answer (for example, which of the reel's small steps is hardest) and a line inviting
them to share it with a friend. No emojis. Save both in `deliverables/<Title>_facebook.txt`. Approved example:
"Tired skin is often just a tired you. Sometimes the kindest thing you can do for your face is an earlier night."

**Before writing any Facebook text, check `references/posted.md`.** If the reel or post is already listed there,
do not write new text: tell the owner it is already posted and give the date it was listed. After writing text
for a new one, add it to that list.

## What never changes
Faceless and modest, no emojis; every spoken word on screen as it is said, readable on mute; the hook on screen
in the first frame; one new motif per reel carrying match-cut transitions; a different layout every scene; a
light, warm, living background that follows the story; nothing slams, breaks, shakes or flashes; the ending
calls back to the hook and holds on the kind line, the motif, the CTA and HER CALM CORNER. Kind and honest,
never shaming; never compare women or put down men; nothing against Islamic values; no medical, diet or money
claims, no invented statistics, no brand names.
