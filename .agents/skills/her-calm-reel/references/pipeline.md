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
  tools/voice.py      Kokoro TTS + word timings
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
    "file": "assets/voiceover.source.mp3",  // used when engine = file
    "lang": "en-us", "peak_db": -3,
    "kokoro": { "blend": {"af_sarah": 0.7, "af_heart": 0.3}, "speed": 0.86, "pitch_semitones": 0,
                "eq": "female", "reverb": 0.1, "room_rt60": 0.5, "phoneme_fixes": {} }
  },
  "gaps": {"sentence": 0.42, "short": 0.8, "long": 1.2, "hold": 1.0},   // Kokoro only
  "lead_in": 0.5, "end_hold": 2.6,
  "script": [ {"id": "gentle", "text": "A gentle reminder.", "pause": "short"}, ... ],
  "scenes": [ {"id": "open", "at": 0}, {"id": "list", "at": "today:0", "lead": 0.3}, ... ],
  "cues":   [ {"sfx": "chime", "at": "gentle:1", "gain": "chime"}, ... ],
  "sound":  {"voice": 1, "drone": 0.08, "air": 0.32, "chime": 0.2, ..., "duck_sfx_db": -6, "duck_drone_db": -6}
}
```

**Refs** (used by scenes and cues): `"today:3"` is the start of word 3 (0-based) in sentence `today`;
`"today:3:end"` is its end; `"scene:list"` is the moment that scene cuts in; `"end"` is the reel's end;
a plain number is absolute seconds. Cue extras: `offset`, `gain` (a number or a `sound` key), `mul`,
`repeat {count, every}`, `span {to, count, end_offset}`, `typing [refs]` (one tick per letter, the same
schedule as `typingFor()` in index.html). Keys starting with `_` are comments.

SFX available from the soft kit in `tools/sfx.py`: air, chime, page, drop, pluck, pop, bloom, drone (warm pad).
There are no impacts or sub hits on this page. To add a sound, write a function and a `save()` call there.

## 4. Voice

The voice decides every timestamp, so lock it before polishing the visuals.

### A. ElevenLabs (preferred: a warm, calm, gentle female narrator)

Use the ElevenLabs connector tools when they are available:
1. `creative_list_voices` with gender `female`, languages `["en"]`, descriptives such as `["calm"]`, `["soft"]` or
   `["gentle"]`, and use cases `narrative_story` or `informative_educational`. Look for "warm", "soothing", "kind" and
   "conversational" in the description. Avoid breathy ASMR, whispery, sultry or hyped voices: the page is a calm older
   sister, not a meditation app or an ad. Note the chosen voice_id in `reel.config.json → voice.source` so the series
   keeps one voice.
2. `creative_create_flow`, then `creative_generate_speech` with model `eleven_multilingual_v2`, the **whole script in one
   prompt** and soft SSML breaks: `A gentle reminder. <break time="0.8s" /> You don't have to ...`. Use 0.8 s after
   sections and 1.2 s before the close.
3. Run it with `estimate_only: true` first and tell the user the credit cost; 2 takes are usually enough. Never re-call to retry.
4. Poll `creative_get_flow_run_status`, then download each `master_url` with curl right away (signed URLs expire in about
   2 h) into `assets/voiceover.source.mp3`.
5. Pick the take that sounds unhurried and warm with every pause honoured, and check it with `tools/check_voice.py`.
   Set `voice.engine = "file"` and run `python3 tools/build.py --voice`.

ElevenLabs may disable a free-tier account for "unusual activity" when traffic comes through a proxy or VPN.
If that error appears, stop, keep the finished takes, tell the user, and use B.

### B. Kokoro fallback (local, free)

Set `voice.engine = "kokoro"`. Tested defaults: blend 70% `af_sarah` + 30% `af_heart`, speed 0.86, no pitch shift,
`eq: "female"` (gentle warmth, tamed sibilance), a short room (reverb 0.1). `af_sarah` was the clearest female
voice in testing (offline WER about 9% against 18–25% for the others) and `af_heart` adds warmth. Avoid `bf_emma`
(WER 59%). Each sentence is synthesised whole and level-matched, with soft edges, for smooth joins.

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
- Helpers already in the template: `ws/we/el`, `floatIn(sentence, i, extra)` (the soft word entrance),
  `lightBloom(t, [x, y], dur)`, `lightSweep(t)`, `dash()` for drawn strokes, `show/hide`, `prng(seed)`, and
  `render()` on `onUpdate` (grain). HyperFrames seeks with events on, so `onUpdate` runs on every captured frame.
- Text inside 90 px side and 120 px top/bottom margins; statements ≥ 64 px, labels ≥ 38 px; contrast 4.5:1 on the light canvas.
- Fonts: local `@font-face` only. Download woff2 from Google Fonts CSS with a browser user agent.

## 6. Build, verify, render, deliver

```bash
python3 tools/build.py --voice --sfx             # timing.js + mix.wav (prints scene windows)
npx hyperframes lint && npx hyperframes validate # 0 errors; contrast passes
npx hyperframes snapshot --at <hero + transition times> --no-end -o snapshots
python3 tools/contact_sheet.py review.png snapshots/frame-*.png    # look at it; fix overlaps or margins
npx hyperframes render --quality high -o renders/<slug>.mp4
ffmpeg -i renders/<slug>.mp4 -c:v libx264 -crf 18 -preset slow -pix_fmt yuv420p -movflags +faststart -c:a copy renders/<slug>_reel.mp4
ffmpeg -i renders/<slug>.mp4 -c:v libx264 -crf 20 -preset slow -pix_fmt yuv420p -movflags +faststart -c:a copy renders/<slug>_share.mp4   # < 30 MB
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
- The light bloom must not cover the opener's words while they are still being read: start it after the last word ends.
- Size objects that contain words (the breathing circle) for their largest scale, so the word never crosses the line.
- HyperFrames AAC-encodes audio twice. Plosive spikes overshoot to clipping. The tools de-spike the voice and
  soft-limit the mix; always check `max_volume` on the final MP4.
- A one-off "FFmpeg cannot start" from `hyperframes render` after a restart is transient: re-run it.
- In sandboxes, Chrome may reject the proxy's TLS certificate; local fonts avoid that. Add the proxy CA
  to the NSS store (`certutil -A -d sql:$HOME/.pki/nssdb -t C,, ...`) if pages must fetch remote assets.
