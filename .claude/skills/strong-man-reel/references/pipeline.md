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
  index.html          the composition (starts as the approved reference reel; rewrite its scenes)
  reel.config.json    script, voice, pauses, scenes, sound cues, levels: the single source of truth
  DESIGN.md           palette, type, motion and don'ts for this video
  timing.js           generated: words, scenes, cuts, cues (index.html reads it synchronously)
  transcript.json     generated: [{text, start, end, sentence, index}]
  tools/build.py      timing + cues + mix + data-duration sync
  tools/voice.py      Kokoro TTS + word timings
  tools/align_external.py  word timings for any external voice file (ElevenLabs, recording)
  tools/sfx.py        procedural SFX kit (no samples, no licences)
  tools/check_voice.py     offline clarity check (WER) per sentence
  tools/contact_sheet.py   review grid with safe margins
  assets/fonts/*.woff2, assets/gsap.min.js, assets/sfx/*.wav, assets/voiceover.wav, assets/mix.wav
```

## 3. reel.config.json

```jsonc
{
  "voice": {
    "engine": "file",                       // "file" (ElevenLabs/recording) or "kokoro"
    "aligner": "sphinx",                    // engine=file only: "sphinx" (forced alignment) or "energy" (default)
    "file": "assets/voiceover.source.mp3",  // used when engine = file
    "lang": "en-us", "peak_db": -3,
    "kokoro": { "blend": {"am_onyx": 0.7, "bm_lewis": 0.3}, "speed": 0.84, "pitch_semitones": -1,
                "reverb": 0.07, "room_rt60": 0.4, "phoneme_fixes": {"ˈɜːdʒ": "ˈɜɹdʒ"} }
  },
  "gaps": {"sentence": 0.34, "short": 0.72, "long": 1.2, "hold": 1.05},   // Kokoro only
  "lead_in": 0.35, "end_hold": 2.2,
  "script": [ {"id": "hook", "text": "The habit no man talks about.", "pause": "short"}, ... ],
  "scenes": [ {"id": "hook", "at": 0}, {"id": "weak", "at": "weak:0", "lead": 0.15}, ... ],
  "cues":   [ {"sfx": "stamp", "at": "hook:1", "offset": -0.02, "gain": "impact"}, ... ],
  "sound":  {"voice": 1, "drone": 0.14, "whoosh": 0.42, "impact": 0.55, "sub": 0.62, ...,
             "duck_sfx_db": -6, "duck_drone_db": -8}
}
```

**Refs** (used by scenes and cues): `"weak:3"` is the start of word 3 (0-based) in sentence `weak`;
`"weak:3:end"` is its end; `"scene:weak"` is the moment that scene cuts in; `"end"` is the reel's end;
a plain number is absolute seconds. Cue extras: `offset`, `gain` (a number or a `sound` key), `mul`,
`repeat {count, every}`, `span {to, count, end_offset}`, `typing [refs]` (one tick per letter, the same
schedule as `typingFor()` in index.html). Keys starting with `_` are comments.

SFX available from `tools/sfx.py`: whoosh, impact, stamp, sub, crack, click, flip, snap, riser, tick,
slam, drone, ring (alarm bell), pop (notification blip), pulse (heartbeat), drawer (wooden slide). To add a sound, write a function and a `save()` call there.

## 4. Voice

The voice decides every timestamp, so lock it before polishing the visuals.

### A. ElevenLabs (preferred: a deep, wise, commanding narrator)

Use the ElevenLabs connector tools when they are available:
1. `creative_list_voices` with gender `male`, languages `["en"]`, descriptives `["deep"]` or `["wise"]`, use
   case `narrative_story`. Approved voice: **"Bill Adams - Wise and Motivational American Storyteller"**,
   voice_id `V2bPluzT7MuirpucVAKH`: deep, gritty, calm but commanding. Alternatives in the same register: "Declan
   Sage - Wise, Deliberate, Captivating", "Harrison Gale - The Velvet Voice".
2. `creative_create_flow`, then `creative_generate_speech` with model `eleven_multilingual_v2`, the
   **whole script in one prompt** (consistent delivery, natural joins) and SSML breaks for the pauses:
   `The habit no man talks about. <break time="0.7s" /> A weak man ...`. Use 0.7 s after sections,
   1.2 s before the rule and 1.0 s after it.
3. Run it with `estimate_only: true` first and tell the user the credit cost. Two takes are usually
   enough (`generations_count: 2`). Never re-call to retry: each call charges again.
4. Poll `creative_get_flow_run_status` until done, then download each `master_url` with curl right away
   (signed URLs expire after about 2 hours) into `assets/voiceover.source.mp3` (keep the other takes too).
5. Pick the take: deeper median pitch, every pause honoured, fewer misses in
   `python3 tools/check_voice.py <take>` (after a first alignment). Then set `voice.engine = "file"`,
   `voice.aligner = "sphinx"` and run `python3 tools/build.py --voice`.
6. Word timings: `aligner: "sphinx"` runs `tools/align_sphinx.py`, a pocketsphinx forced alignment of the
   script against the audio (free, offline, measured per word; it stops if the alignment does not match the
   script). Prefer it over the default energy aligner, which only spreads words by phoneme count inside
   detected sentences. Local Whisper needs Hugging Face downloads, which sandboxes often block.

ElevenLabs may disable a free-tier account for "unusual activity" when traffic comes through a proxy or
VPN (this happened from a sandbox). If calls start failing with that message, stop: keep the finished
takes, tell the user, and fall back to B. With an API key and direct network access, the REST endpoint
`POST /v1/text-to-speech/{voice_id}` with the same text and `voice_settings {stability: 0.6}` also works.

### B. Kokoro fallback (local, free)

Set `voice.engine = "kokoro"`. Tested defaults: blend 70% `am_onyx` + 30% `bm_lewis`, speed 0.84,
−1 semitone formant shift. That was the clearest and darkest of 17 variants (median pitch about 86 Hz).
What testing showed:
- Rubberband pitch shifts of 2–5 semitones sound deeper on paper but wreck intelligibility. Don't.
- Kokoro's American phonemizer writes British /ɜː/. Fix rhotic words via `phoneme_fixes` (for example "urge").
- Quiet /h/ onsets ("He stands up") get clipped by trimming. The tools already use `trim=False` and a gentle
  onset threshold.
- Each sentence is synthesised whole and level-matched, with soft edges and a short room, for smooth joins.

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
- Helpers already in the template: `ws/we/el`, `B` (beats derived from words), `show/hide`,
  `slash(t, dir)`, `drift()`, `prng(seed)`, plus `render()` on `onUpdate` for procedural drawing (the wave path).
  HyperFrames seeks with events on, so `onUpdate` runs on every captured frame.
- Text inside 90 px side and 120 px top/bottom margins; headlines ≥ 100 px, labels ≥ 36 px.
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

- `gsap.from()` applies its start state at build time. A later `from()` on a visible element (for example `scale: 1.3`)
  shows that state early. Use `fromTo(..., {immediateRender: false})` for anything after the first frame.
- Reveal scenes with a `tl.set` at (or before) the moment their entrance tween starts, or with an explicit
  `fromTo(opacity 0 → 1)`. A `from({opacity: 0})` that starts *before* the scene is shown records the hidden
  opacity as its target, and the scene never appears in a real render. Snapshot mode (seeking) can hide this, so
  always pull frames from a rendered MP4 too.
- `letterSpacing` tweens fail lint (they snap). Animate `scaleX`/`x` instead.
- An inline caret needs `height` and `vertical-align: top`, or it sits below the baseline.
- Derive every beat from word times, then check collisions: a calendar replay once overlapped the page-tear
  transition. Print the times (`node -e` with timing.js) and compare.
- Full-frame accent covers should last 1–3 frames. Exit them with `power3.out`, or the screen sits solid red.
- Text on a path becomes unreadable at high amplitude. Scale the text path's amplitude down (about 0.3×).
- HyperFrames AAC-encodes audio twice. Plosive spikes overshoot to clipping. The tools de-spike the voice and
  soft-limit the mix; always check `max_volume` on the final MP4.
- A one-off "FFmpeg cannot start" from `hyperframes render` after a restart is transient: re-run it.
- Typewriter carets: `typingFor()` gives every word at least 0.18 s, so a short word's last letter can come
  after the next word's first letter. Hide a caret at `max(next letter, its own letter + 0.01)` or it sticks.
- A scene push-in scales text outward from the centre: at 1.03, text at 90 px ends up at 76 px. Cap push-ins
  at 1.03 and keep edge-aligned text at 104 px from the sides.
- `hyperframes snapshot` seeks differently from a plain `tl.seek()`: a `tl.set(..., 0)` that hides an element
  which a later `fromTo(..., {immediateRender: false})` reveals can stay hidden. Place such elements with a
  static `gsap.set()` and reveal them with a self-contained `fromTo(..., {immediateRender: true})`.
- A bright line through the middle of words reads as a strikethrough (it flips the meaning of a rule).
  Break type with offset halves instead, and flash the seam only as they snap together.
- In sandboxes, Chrome may reject the proxy's TLS certificate; local fonts avoid that. Add the proxy CA
  to the NSS store (`certutil -A -d sql:$HOME/.pki/nssdb -t C,, ...`) if pages must fetch remote assets.
