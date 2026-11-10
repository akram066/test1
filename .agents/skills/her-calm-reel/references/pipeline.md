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

### Learned in November 2026
- ElevenLabs now serves audio from `elevenlabsusercontent.com`; the session's network policy must allow that host
  (Allowed domains). If the download is refused, a fresh signed link comes from `creative_get_flow_run_status`
  once the host is allowed; never re-generate to get a new link.
- Do not tween CSS `filter` (brightness/saturate) on a full-frame background layer: the renderer can paint it
  as a hard dark block. Crossfade a second background layer instead.
- Do not tween `letterSpacing` (lint error: it snaps during frame capture); move words with x instead.
- Avoid squashing text with a small `scaleY`/`scale` start and avoid strong same-colour `textShadow` glows: the
  word is rasterised at the small size and looks blurry when stretched back.
- Exits: never fade a line before its last word has been on screen; if the next line starts quickly, use a
  short fast-start fade (power2.out) so the two never overlap. The `out()` helper in the recent reels
  (afternoon-slump, im-fine, heavy-day) does this from the word timings.
- Seek stills that jump back to 0 can show stale blur; confirm suspicious frames in the rendered MP4.
- Tightening pauses one by one (per word before the pause, with `#2` for a repeated word) keeps the turn's
  pause while trimming the rest; aim for a voice of about 29–31 s.
- Light text on a dark sky: an ink check that counts dark pixels flags every frame. Check margins on a copy with the world, stars, sky and grain hidden (`display:none`) on a black background, using seek stills every 0.2 s and counting light pixels.
- The template's own fonts (Fraunces + DM Sans) count as used by the starter reel; delete them and pick a new pairing.
- The `out()` helper looks 0.4 s ahead, so a line exiting just before the next sentence (under 0.4 s) gets pushed past that sentence's first word. For those exits, set `tl.to(...)` by hand at `ws(next, 0) - 0.34`.
- Generated photoreal items (Seedream 4.5 on ElevenLabs, about 242 credits per image): ask for a chroma-green backdrop and cut out locally with `scripts/cutout_green.py`. The model ignores "straight down"; an angled tabletop can be rotated and cropped into a portrait plate. Output is 3640x2048 (16:9) whatever the prompt says.
- Two voices: generate each separately, tighten each with tighten2.py, level-match by speech RMS and concatenate in script order into voiceover.source.lily.wav. The single forced alignment over the joined file works across both voices.
- Self-drawing doodles: give each path `pathLength="1"` and a dasharray of 1, and hide it with opacity 0 until its draw starts (round caps otherwise show as dots). For a boiling line, draw three jittered copies and show one per 1/12 s in render(). If the doodle SVG is CSS-scaled, map any text-anchored coordinates back through the scale.
- Heavy SVG filters (feTurbulence plus displacement on full-frame groups) crashed the renderer ("Target closed"). Tag those layers with `data-raster`, rasterize them once with `scripts/raster_layers.cjs`, and swap them for <image> at load unless `?raster` is set. Drop masks with `attr: { mask: 'none' }` once a scene is fully revealed, and hide the layers it covers.
- Covers: `templates/cover/render.cjs` renders `cover.html` and a check sheet (9:16, 4:5 crop at y 285–1635, 1:1 crop at y 420–1500, and a 120 px phone grid). The first one is `video-projects/brush-78/cover.html`: a pre-painted scene behind a cream wash, a bold two-line serif hook, a giant brush-font number and the motif laid at a gentle angle. A steep object next to a number reads as a slash.
- **A render that "restarts the container" or dies with `Terminated` (exit 143) a second after the lint
  line:** HyperFrames' orphan-Chrome cleanup runs `pgrep -f chrome-headless-shell` and kills every match whose
  parent is PID 1, with its whole process tree. If the cloud session's launcher shell has that text in its long
  command line, the cleanup kills the session itself. Check with `pgrep -a -f chrome-headless-shell`; if a `sh`
  process with PID 1 as parent shows up, render through a `pgrep` wrapper placed first on `PATH` that drops
  matches whose `/proc/<pid>/comm` is `sh`, `bash` or `dash` (real orphaned Chrome is still cleaned up).
- **Seeking jumps past tweens.** The renderer can seek straight to any frame, which skips a `fromTo`'s start
  values. Give every tween that reveals a hidden element its end opacity explicitly (`{ opacity: 1, ... }` in
  the "to" vars), and use `fromTo`, not `from`, on elements that start with `opacity="0"`: `from` reads the
  hidden value as its end state. Test stills with `seek(0)` then `seek(t)`, never only by stepping forward.
- **Never call `gsap.set` or create tweens inside the per-frame render callback.** Drive moving props from
  plain state objects that the timeline tweens, and write transforms with `setAttribute` in render().
- **Do not let GSAP and render() share one transform.** If render() positions a group every frame, put the
  GSAP-animated child inside a separate wrapper group (and the reverse).
- **Riso / two-ink looks:** put each ink in its own full-frame `<svg>` with `mix-blend-mode: multiply` and a
  grain mask. CSS `mask-image` files are blocked under `file://` (CORS), so stills differ from the render:
  embed a small tiling grain PNG as a data URI in a CSS variable and use `mask-repeat`. Offset the second ink a
  few px and jitter it per boil frame for misregistration. A print-pass transition can be drawn by clipping
  each scene group with a `clipPath` rect whose top/height render() sets from the time (keep scene ranges a
  pure function of time so jump-seeks render correctly).
- **Boiled paths must not use arc (`a`/`A`) commands:** jittering every number breaks the arc flags and the
  path stops rendering. Use circles or curves for doodles that boil.
- **GSAP scale on SVG groups that already carry a transform, or that sit inside a scaled group, can land in
  the wrong place** (and differently per ink layer). Put the position on a static outer wrapper and animate a
  plain state value that render() turns into `scale(...)` on the inner group.
- **GSAP `smoothOrigin` leaves SVG elements shifted.** When a tween on an SVG element uses `transformOrigin`
  (scale or rotation pops), GSAP's default smoothOrigin keeps an x/y offset after the tween ends, so balloons,
  stamps and badges land off position (it was the cause of the off-frame stamps in the risograph reel). Add
  `smoothOrigin: false` to those tweens, or drive the scale from state in render().
- **Two camera tweens on the same state that overlap:** the one that starts later wins once both have ended, even
  if the other ends later. Leave a gap between camera moves.

- **Underline reveals:** `pathLength` with dash draw-on breaks on paths with `vector-effect="non-scaling-stroke"` (the dash runs in screen units, so the whole line shows dashed). For underlines in a stretched SVG (`preserveAspectRatio="none"`), reveal the svg with a `clip-path: inset()` tween instead.
- **Eraser wipes as pure functions of time (whiteboard reel):**
  - Each wipe has a start, a duration and bands. Each band's erased x-range comes from the time, and it drives a black-rect SVG mask on the live scene copy and a white-rect mask on a `<use>` ghost copy (grey, blurred, opacity about 0.16).
  - HTML caption lines are full-width divs, so `clip-path: inset(0 0 0 Xpx)` follows the eraser in screen px with no measuring.
  - With round caps, a zero-length dash still draws a dot, so hide strokes (visibility) until progress > 0.
- GSAP `svgOrigin` is in the root SVG's global coordinates, not the element's own space: on nested, transformed groups it leaves a permanent offset even after rotation returns to 0 (the photo corners missed their photos). Use `transformOrigin: '50% 50%', smoothOrigin: false`, or put the transform on a wrapper whose origin is already the pivot.
- Shared `<use>`/symbol scenes: an element inside the symbol (for example a dotted outline) can be animated once and every instance follows, which makes dozens of photos change together cheaply. Draw it last in the symbol so props don't cover it.
- Page transitions on HTML pages (spin and fold): animate opacity in its own short fromTo (0 to 1 over 0.01 to 0.04 s) separate from the transform tween, so a backward seek reverts the page to hidden instead of showing it tiny at its start scale. Don't use `tl.set(..., 0.001)` for initial hiding; `gsap.set` before the timeline is enough.
- Heavy paper textures (fibres plus grain) raise the share copy's size (about 20 MB at CRF 24 for 33 s). Still under 30 MB, but check it.
- Light text on a dark background: `textonly.cjs` counts dark ink, so it can't check margins. Measure each caption line's word boxes with getBoundingClientRect after `document.fonts.ready` instead.
- Organic paper textures (cyanotype, watercolour): generate once at load on a small canvas with seeded value noise (deterministic), then scale it up as an SVG pattern image. It's cheap and identical in every frame.
- Display serifs like Cormorant run wider than they look. Measure and fit each line to 880 px instead of guessing sizes.
- Crayon look: an SVG filter with feDisplacementMap (small scale) followed by a noise-thresholded alpha mask (feColorMatrix on feTurbulence, then feComposite in) gives waxy strokes that skip. A covering swipe band needs its own denser variant (low-frequency noise, gentler threshold), or the old scene shows through the gaps. HTML captions can use the same filter via CSS `filter: url(#id)`.
- When a new scene group fades in later with fromTo and immediateRender false, `gsap.set` it to opacity 0 first. Otherwise it is fully visible before the tween starts and ghosts over the previous scene.
- Pixel-art reels:
  - Draw everything into a small canvas (for example 180x320) inside render() with fillRect only, and scale it with CSS `image-rendering: pixelated`. Composite two offscreen buffers block by block for pixel dissolves.
  - Keep text in HTML with a pixel font so it stays large and crisp.
  - Typed text boxes: give each letter its own time inside its word's span, and recompute the page's show time after any manual adjustment.
- To stop a running render without killing your own shell, use `pkill -f "hyperframes render --qualit[y] high"`. The bracket stops the pattern from matching the command line that runs pkill.
- Cover pages that reuse a reel's script: copy every element the copied code touches (for example `#table`). A null lookup stops the script and silently leaves only the HTML text. Check covers for page errors with a quick Playwright `pageerror` listener.
- Diagram labels and arcs around a filled head: draw annotation groups first (behind the figure) and make the arc radius clear the head, or the fill hides them.
- Mosaic and tile looks: rasterise each scene into a small colour grid (your own set, line, disc, ring and polygon fill helpers, with no canvas antialiasing), then draw every cell as a glazed tile with a fixed per-cell jitter. For transitions, keep two grids and flip each tile (scaleY via cos) on a delay set by its distance from the centre; use a star-shaped metric `r*(1-0.22*cos(8θ))` for a rosette opening.
- A quick cover from the reel itself: copy index.html to cover.html, hide the captions with CSS, add a title, and `tl.seek(t)` on load to freeze a chosen moment.
- Gold sheen: a userSpaceOnUse linearGradient stroke with a bright middle stop and spreadMethod reflect, with gradientTransform translated in render(). Every gold line shimmers together cheaply.
- Sunburst reveal: clip the incoming scene with N wedge polygons whose half-angle eases from 0 to 180/N degrees (no arcs). Fan cover: N pleat wedges from the bottom centre whose start and end angles sweep from -180 to 0. Keep scene visibility a pure function of time in render().
- When a scene draws itself in after a transition, start its line draws as the transition opens and hide filled figures until their lines appear, or bare silhouettes flash first.
- VHS look:
  - Put the background art in a group with an SVG colour-bleed filter (blur, then two offset copies colour-matrixed to magenta and cyan, merged under the original). Keep the figures in a separate unfiltered group with a soft glow so they stay crisp.
  - Add CSS scan lines (repeating-linear-gradient), grain with backgroundPosition shifted per frame, and a moving tracking-band div.
  - For a PAUSE freeze, render the scene at a clamped time while the OSD and bars keep running.
- Felt appliqué look: one SVG filter does it all — feTurbulence (high frequency) drives a small feDisplacementMap for fuzzy edges, the same noise colour-matrixed into dark flecks composited inside the shape, and a blurred offset copy as the soft shadow. Draw the running stitch as a dashed copy of the shape path scaled about its bbox centre so it sits inset from the edge.
- Revealing a dashed (stitched) path: a pathLength dash reveal would overwrite the stitch dashes, so put the dashed path under a mask whose content is a thick white copy with a pathLength reveal. Mask content and a userSpaceOnUse mask region live in the referencing element's own (transformed) coordinates: don't repeat the transform inside the mask, and make the region cover negative local coordinates.
- Long caption sentences in a wide rounded font (Fredoka): split each sentence into two lines on one label and swap labels per sentence. This allows 62–76 px text instead of 48 px stacked lines.
- A figure lying in bed: rotate -90 so the head points left, then place the body so the head lands on the pillow and the blanket (drawn after) covers the rest. Keep the pillow a different colour from the head fill or the head disappears.
- Sticky-note stop-motion: drive every note from a pure pose function on a 12 fps clock (`floor(t*12)/12`), with tiny per-frame jitter from a hash of (note id, frame), while the camera eases smoothly at 30 fps. Slap on = 2 frames of overshoot (scale 1.16, then 0.97) with a lifted shadow; peel = scaleY hinged at the top edge over 3 frames; a fall sways and lands flat with scaleY about 0.3.
- One drawing across a mosaic of notes: draw it once inside `<defs>`, then put a `<use>` in each note clipped to that note's rectangle (in world coordinates, under a translate that cancels the note centre). Every note carries its own piece, and the pieces jitter and peel with their notes.
- Notes that move between layers (fridge, floor): when re-inserting a note before another group, keep separate overlays (magnets) in their own later layer, or the moved note ends up on top of them.
- Thin handwriting fonts (Handlee) read weak at phone size; add `-webkit-text-stroke` of about 1.5 px in the ink colour (and a matching SVG stroke).
- The `aligner: sphinx` build needs `voice.pronounce` for words missing from CMU (for example "journaling": "JH ER N AH L IH NG"); the raw scratch aligner can take a sound-alike spelling instead.
- Appending to a log file in Python: read it into a variable first. `open(f, 'w').write(open(f).read() + x)` truncates the file before reading it and wipes the log.
- Stained glass: cut the window with a seeded Voronoi (half-plane clipping of a box per site is fast enough for ~100 sites), fill each cell from a colour-by-position function, and stroke every cell in dark lead plus a thin lighter highlight. Use radial sites (rings around a point) for sunburst windows.
- Keep lead lines per layer: give each window stacked layers (glass group with the texture filter, then that layer's lead group). One shared lead group on top draws background lines straight through figures and text panels.
- A glass "ripple and bubbles" filter: feTurbulence (low, anisotropic frequency) into feComposite arithmetic (k1 0.6, k2 0.72) for ripples, plus high-frequency noise thresholded to tiny dots composited inside the glass for bubbles.
- A screen-blended sunbeam at 0.55 peak washes amber glass toward white; about 0.3 keeps colours rich.
- Decorative swirls inside a faceless head or bun can read as an eye. Use an open spiral, never a closed almond or two facing arcs.
- Mask reveals of a path (pathLength 1, dasharray "x 1"): give the mask stroke `stroke-linecap: butt`. With an inherited round cap, a zero-length reveal still paints a dot at the start of every hidden trail.
- Map reels: build one large world (about 2400x2600) and move a camera transform (`translate(cx,cy) scale(s) translate(-x,-y)`) through keyframes; keep fixed UI (the caption scroll) in HTML outside the camera. Scale moving markers by `1/s` so dots stay visible in wide shots.
- Particles along trails: sample positions with `getPointAtLength` in render(), and start each stream particle only when its own phase passes zero, so streams fill in from the start instead of appearing mid-trail.
- Colored-pencil fill: a small userSpaceOnUse pattern of two diagonal lines (patternTransform rotate -38), used as fill and as a 12 px stroke so it spills past the outline, under a filter that keeps noise-thresholded grain (feTurbulence 0.85, alpha 3.2*R - 0.95) and a light displacement, over a 0.3-opacity flat wash. Reveal each shape with a mask rect wipe; draw the black outline on top.
- Outlined arms in a coloring-book figure: a 26 px black stroke with a narrower paper-coloured stroke on top reads as an outlined tube; switch the inner stroke to the skin tint when the figure is coloured.
- Banners sized to HTML caption text: measuring the text box in render() is stable (child transforms do not change the parent box), but lint flags it as DOM measurement; check banner fit in the rendered draft frames. When an outlined shape gets a fill, keep the paper base below the fill and the outline above it, or an opaque body hides the colour.
- A pencil-stroke sweep transition must be opaque and wider than the frame at its midpoint; cut the camera exactly when the band's centre crosses the frame centre.
