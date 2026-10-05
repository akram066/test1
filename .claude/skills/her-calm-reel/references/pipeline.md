# Pipeline: from script to verified MP4

## Contents
1. Setup
2. Project layout
3. reel.config.json
4. Voice (ElevenLabs, Kokoro fallback, your own recording)
5. Writing index.html
6. Build, verify, render, deliver
7. Gotchas learned the hard way

## 1. Setup

- Node 22+, FFmpeg/ffprobe, Python 3 with `pip install numpy soundfile pillow kokoro-onnx pocketsphinx`.
- HyperFrames CLI (`npx hyperframes`). In the student kit it is a devDependency at the repo root.
- Chrome Headless Shell: `npx hyperframes browser ensure`, or point `HYPERFRAMES_BROWSER_PATH` at an
  existing headless_shell binary when downloads are blocked.
- Kokoro (fallback voice) downloads `kokoro-v1.0.onnx` and `voices-v1.0.bin` from GitHub releases into
  `~/.cache/hyperframes/tts/` on first use (`npx hyperframes tts --list` triggers it, or curl them from
  `github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/`).

## 2. Project layout

`python3 <skill>/scripts/new_reel.py <slug>` creates:

```
<slug>/
  index.html          the composition (starts as the Her Calm Corner starter reel; rewrite its scenes)
  reel.config.json    script, voice, pauses, scenes, sound cues, levels: the single source of truth
  DESIGN.md           palette, type, motion and don'ts for this video
  timing.js           generated: words, scenes, cuts, cues (index.html reads it synchronously)
  transcript.json     generated: [{text, start, end, sentence, index}]
  tools/build.py      timing + cues + mix + data-duration sync
  tools/voice.py      Kokoro TTS in breath groups (breaths, room tone) + word timings
  tools/align_external.py  word timings for any external voice file (ElevenLabs, recording)
  tools/sfx.py        soft procedural SFX kit (no samples, no licences)
  tools/check_voice.py     offline clarity check (WER) per sentence
  tools/contact_sheet.py   review grid with safe margins
  assets/fonts/*.woff2, assets/gsap.min.js, assets/sfx/*.wav, assets/voiceover.wav, assets/mix.wav
```

## 3. reel.config.json

```jsonc
{
  "voice": {
    "engine": "file",                       // "file" (ElevenLabs/recording) or "kokoro"
    "aligner": "sphinx",                    // engine=file: "sphinx" (forced alignment, preferred) or "energy"
    "pronounce": {"skincare": "S K IH N K EH R"},   // sphinx: words missing from the CMU dictionary (ARPABET)
    "file": "assets/voiceover.source.mp3",  // used when engine = file
    "lang": "en-us", "peak_db": -3,
    "kokoro": { "blend": {"af_heart": 0.6, "af_sarah": 0.4}, "speed": 0.9, "pitch_semitones": 0,
                "eq": "female", "reverb": 0.1, "room_rt60": 0.45,
                "breath_db": -24,        // soft inhale before each group, dB under speech (null = off)
                "room_tone_db": -64,     // quiet room under everything, dBFS (null = off)
                "seed": 5, "phoneme_fixes": {} }
  },
  "gaps": {"sentence": 0.42, "short": 0.7, "long": 1.1, "hold": 1.0},   // fallback pauses (Kokoro only)
  "lead_in": 0.6, "end_hold": 2.5,
  "script": [ {"id": "hook", "text": "If no one told you today..."}, {"id": "doing", "text": "You're doing ..."}, ... ],
  "flow":   [ {"say": ["hook", "doing"], "gap": 0.8}, {"say": ["water"], "gap": 0.75, "speed": 0.88}, ... ],
  "scenes": [ {"id": "dawn", "at": 0}, {"id": "pile", "at": "list:0", "lead": 0.35}, ... ],
  "cues":   [ {"sfx": "chime", "at": "doing:2", "gain": "chime"}, ... ],
  "sound":  {"voice": 1, "drone": 0.08, "air": 0.32, "chime": 0.2, ..., "duck_sfx_db": -6, "duck_drone_db": -6}
}
```

**flow** (Kokoro): the breath groups, in script order, every script id exactly once. Sentences in one group are
synthesised in one pass; `gap` is the pause after the group (a small seeded jitter is added), `speed` overrides
the voice speed for that group. Without `flow`, every sentence is its own group and `pause` keys on script
lines pick from `gaps`.

**Refs** (used by scenes and cues): `"things:3"` is the start of word 3 (0-based) in sentence `things`;
`"things:3:end"` is its end; `"scene:pile"` is the moment that scene cuts in; `"end"` is the reel's end;
a plain number is absolute seconds. Cue extras: `offset`, `gain` (a number or a `sound` key), `mul`,
`repeat {count, every}`, `span {to, count, end_offset}`, `typing [refs]` (one tick per letter, the same
schedule as `typingFor()` in index.html). Keys starting with `_` are comments.

SFX available from the soft kit in `tools/sfx.py`: air, wind, chime, twinkle, page, drop, pluck, pop, bloom,
drone (warm pad), pour (water into a glass), click (a muffled lamp switch), ripple (a drop meeting still
water, then a widening swell), bubbles (soft rising bubbles).
There are no impacts or sub hits on this page. To add a sound, write a function and a `save()` call there.

## 4. Voice

The voice decides every timestamp, so lock it before polishing the visuals.

### A. ElevenLabs (preferred: a warm, calm, gentle female narrator)

**House voice: Lily Wolff, "Expressive, Clear, Youthful, Calming" (voice_id `qBDvhofpxp92JgXJxDjB`).** The page owner
chose her after rejecting Desiree, Olivia, Alexandra and Matilda as not feminine enough. Use Lily for every new reel
and skip the voice search unless the user asks for a different voice. One take is enough.

Use the ElevenLabs connector tools when they are available:
1. Only when the user asks for another voice: `creative_list_voices` with gender `female`, languages `["en"]`, descriptives such as `["calm"]`, `["soft"]` or
   `["gentle"]`, and use cases `narrative_story` or `informative_educational`. Look for "warm", "soothing", "kind" and
   "conversational" in the description. Avoid breathy ASMR, whispery, sultry or hyped voices: the page is a calm older
   sister, not a meditation app or an ad. Note the chosen voice_id in `reel.config.json → voice.source` so the series
   keeps one voice.
2. `creative_create_flow`, then `creative_generate_speech` with model `eleven_multilingual_v2`, the **whole script in one
   prompt** and soft SSML breaks between breath groups only (sentences inside a group just follow each other):
   `If no one told you today... you're doing better than you think. <break time="0.8s" /> I know the list ...`.
   About 0.7–0.9 s between groups, 0.75 s between steps and 1.6 s after the breath line.
3. Run it with `estimate_only: true` first and tell the user the credit cost; 2 takes are usually enough. Never re-call to retry.
4. Poll `creative_get_flow_run_status`, then download each `master_url` with curl right away (signed URLs expire in about
   2 h) into `assets/voiceover.source.mp3`.
5. Pick the take that sounds unhurried and warm with every pause honoured, and check it with `tools/check_voice.py`.
   Set `voice.engine = "file"`, `voice.aligner = "sphinx"` and run `python3 tools/build.py --voice`.
   `tools/align_sphinx.py` force-aligns the script against the audio with pocketsphinx (free, offline, measured per
   word) and stops if the alignment does not match the script. Words missing from its dictionary (brand-new or
   compound words such as "skincare") go in `voice.pronounce` as ARPABET phones. Each word is then snapped to its
   voiced audio, because the aligner sometimes hands a pause to the following word (a word would appear early).
   Check anyway: a one-letter word after a long pause (the "A" of "A little") can still be placed right after the
   previous word. If a word starts a sentence but sits >0.5 s before the next word, patch its start in
   `transcript.json` from the voiced frames and rebuild with `python3 tools/build.py` (no `--voice`, which would
   re-align and undo the patch).
   To fit a take into the length limit, shorten long pauses from their middle with
   `python3 tools/tighten.py assets/voiceover.lily.mp3 <alignment.json> assets/voiceover.source.lily.wav`
   (keeps 75% of each long pause and the longest one at 1.3 s, the real pause on screen). Two different voices, one take
   each, cost the same as two takes of one voice and give a real choice.

ElevenLabs may disable a free-tier account for "unusual activity" when traffic comes through a proxy or VPN.
If that error appears, stop, keep the finished takes, tell the user, and use B.

### B. Kokoro fallback (local, free)

Set `voice.engine = "kokoro"`. Tested defaults: blend 60% `af_heart` + 40% `af_sarah` (warmth from heart,
clarity from sarah), speed 0.9 with 0.84–0.88 on the steps and the close, no pitch shift, `eq: "female"`, a
short room (reverb 0.1, rt60 0.45). Avoid `bf_emma` (WER 59%).

What makes it sound like one person instead of a sentence reader (all in `tools/voice.py`):
- **Breath groups** (`flow`): related sentences are spoken in one pass, so the intonation runs on and the model
  makes its own natural pause at the full stop (about 0.35–0.45 s). One-sentence-per-call sounds like a list.
- **Varied pauses** between groups, set per group plus a ±8% seeded jitter.
- **Soft inhales** (`breath_db`, default −24 dB under speech, about −40 dBFS) before each group that follows a
  real pause. They go in after the compressor and before the room, so they sit in the same space.
- **Room tone** (`room_tone_db`, −64 dBFS) so silences are never digital zero.
- **Per-group speed**: a speaker slows down a little for the steps and the kind ending.
Word timings: each group is split into sentences by voiced segments (DP on phoneme weights), then words are
aligned inside each sentence. Read the printed spans; they must match what you hear. The starter measured about
16% WER with pocketsphinx (offline ASR misses soft words; it is a regression check, not a score).

### C. The user's own recording

Put it at `assets/voiceover.source.mp3` (any format FFmpeg reads), set `engine: "file"`, run
`build.py --voice`. `align_external.py` groups voiced segments into sentences by dynamic programming
(expected length from phoneme counts, longest gaps as boundaries) and aligns words inside each one. Always
read the printed sentence spans: they must match what is heard.

## 5. Writing index.html

Start from the template and replace scene content; keep the machinery. HyperFrames contract (lint enforces most of it):
- The root `#reel` has `data-composition-id="reel"`, data-start 0, data-duration (synced by build.py) and
  1080×1920. Audio is one `<audio id="mix" src="assets/mix.wav">` track.
- One paused GSAP timeline registered as `window.__timelines["reel"]`, built synchronously. No
  Math.random (use the seeded `prng`), no `repeat: -1`, and no async work.
- Scenes are `.scene` divs. Scene 1 is visible; the others start at `opacity: 0` and are revealed with
  `tl.set` at their cut. Every element enters with an animation; nothing exits before its transition.
- Words: `<span class="w" data-w="sentence:index">WORD</span>`, animated from `ws(sentence, i) - LEAD`.
  If the script changes, update these spans.
- Layers, bottom to top: sky tints (`#bg-*`, cross-faded with `sky()/unsky()`), drifting blooms (`#blobs`),
  the orb (`#orb`), transparent scenes, overlays (`#leak`, `#wind`, `#fog`), dust motes (canvas), vignette,
  grain, progress bar. The orb sits *under* the scenes, so hills, glasses, windows and cups can be in front of
  it; when it must sit on top of something (the badge on a card), hand off to an in-scene copy at the same spot.
- Helpers already in the template: `ws/we/el`; `floatIn(s, i, extra)` (soft word entrance); `writeIn(s, i)`
  (letter-by-letter key word); `words(s, from, to)`; `markIn(sel, t)` (highlighter); `orb(t, {x, y, scale,
  opacity, lay, dur, ease})` (one call per move; never overlap two moves on the same property);
  `sky(id, t)`, `motes(t, amount)`, `fadeIn/fadeOut`, `show/hide`, `dash()` for drawn strokes, `prng(seed)`,
  and `render()` on `onUpdate` (grain, dust motes, badge counter). HyperFrames seeks with events on, so
  `onUpdate` runs on every captured frame.
- The steps scene is a tall `#world` (screens `.scr`) moved with `tl.to('#world', {x | y})`; the orb is
  global, so tween it in screen coordinates alongside the glide.
- Text inside 90 px side and 120 px top/bottom margins; statements ≥ 64 px, labels ≥ 38 px; contrast 4.5:1 on the light canvas.
- Fonts: local `@font-face` only. Download woff2 from Google Fonts CSS with a browser user agent.

## 6. Build, verify, render, deliver

```bash
python3 tools/build.py --voice --sfx             # timing.js + mix.wav (prints scene windows)
npx hyperframes lint && npx hyperframes validate # 0 errors; contrast passes
npx hyperframes snapshot --at <hero + transition times> --no-end -o snapshots
python3 tools/contact_sheet.py review.png snapshots/frame-*.png    # look at it; fix overlaps or margins
npx hyperframes render --quality high -o renders/<slug>.mp4
ffmpeg -i renders/<slug>.mp4 -c:v libx264 -crf 18 -preset slow -pix_fmt yuv420p -movflags +faststart -c:a copy renders/<slug>_reel.mp4   # the HQ deliverable; keep it under 30 MB
ffmpeg -sseof -0.05 -i renders/<slug>.mp4 -frames:v 1 -update 1 renders/<slug>_thumbnail.png
ffmpeg -i renders/<slug>_reel.mp4 -vn -af volumedetect -f null -   # max_volume must stay below 0 dB
```

Snapshot at least: frame 0, each scene's hero frame (after its words land), every transition
midpoint, and the last frame. Extract a few frames from the encoded MP4 too. Record the checks in
VERIFY.md. Never claim the audio sounds right without hearing it; say it was checked by numbers.

## 7. Gotchas learned the hard way

- `gsap.from()` applies its start state at build time. A later `from()` on a visible element shows that state early.
  Use `fromTo(..., {immediateRender: false})` for anything after the first frame.
- Reveal scenes with a `tl.set` at (or before) the moment their entrance tween starts, or with an explicit
  `fromTo(opacity 0 → 1)`. A `from({opacity: 0})` that starts *before* the scene is shown records the hidden
  opacity as its target, and the scene never appears in a real render. Snapshot mode (seeking) can hide this, so
  always pull frames from a rendered MP4 too.
- `letterSpacing` tweens fail lint (they snap). Animate `scaleX`/`x` instead.
- An inline caret needs `height` and `vertical-align: top`, or it sits below the baseline.
- Derive every beat from word times, then check collisions: a calendar replay once overlapped the page-tear
  transition. Print the times (`node -e` with timing.js) and compare.
- Elements that enter with `fromTo(..., {immediateRender: false})` are visible at their end state until the tween
  starts. Hide them first in CSS (`#s2 .card, #steam .st, #rings circle {opacity: 0}`, stars via `style.opacity`).
- SVG children ignore `style.transformOrigin` under GSAP; set `gsap.set(el, {transformOrigin: '50% 50%'})`.
- GSAP can tween CSS variables (`'--mx': '66%'`): the moon's crescent is a mask whose centre is a variable.
- Copying `index.html` over a built project resets `data-duration` to the template's value (the render comes out
  short). Re-run `python3 tools/build.py` after replacing it.
- When the camera glides, mind which way objects travel: a bubble that rises while the world scrolls up looks
  like it drops out of the glass. Glide sideways (or up) for rising things.
- HyperFrames AAC-encodes audio twice. Plosive spikes overshoot to clipping. The tools de-spike the voice and
  soft-limit the mix; always check `max_volume` on the final MP4.
- A one-off "FFmpeg cannot start" from `hyperframes render` after a restart is transient: re-run it.
- Move global glows (the orb, a moon) with x/y transforms, never left/top: lint rejects left/top motion because it
  snaps to whole pixels and stutters under frame-by-frame capture.
- Text inside an object that is "written in the fog" must sit above the fog layer in the DOM, or it reads as a smudge.
- Don't hide a scene while its leaving particles (bubbles, leaves) are still in flight: hide it after they exit.
- CSS beats SVG presentation attributes: a path styled by a class ignores `attr: {stroke, 'stroke-width'}` tweens.
  Tween the CSS properties (`stroke`, `strokeWidth`) instead.
- A sprite that follows drawn strokes (a pencil, a needle) must follow the stroke being drawn right now, not the
  next one in its lead-in window, or it jumps ahead and disappears.
- In sandboxes, Chrome may reject the proxy's TLS certificate; local fonts avoid that. Add the proxy CA
  to the NSS store (`certutil -A -d sql:$HOME/.pki/nssdb -t C,, ...`) if pages must fetch remote assets.
- Rotating or scaling an SVG child (`<g>`, `<circle>`, `<ellipse>`): set `svgOrigin: 'x y'` in the SVG's own units.
  A `transformOrigin` in px is read relative to the element's bounding box, so clock hands and rings swing around the wrong point.
- A slow camera push-in (scale ~1.05) moves left-aligned text outward by ~20 px: set its `left` to ~112 px so it
  never crosses the 90 px margin at full zoom. Measure the ink in frames from the final MP4.
- An element revealed later with `fromTo(..., immediateRender:false)` needs `opacity:0` in CSS, or it shows before its tween.
- `hyperframes snapshot` can miss elements whose entrance is a `fromTo` started mid-scene (they stay at the from
  state). If a still looks wrong, check with a direct `tl.seek()` screenshot or frames from a draft MP4 before changing code.
