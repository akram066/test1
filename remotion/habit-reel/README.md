# Habit Reel (Remotion)

A 1080×1920, 30 fps reel made only of words, lines and light. There is no footage.
Every word enters on its spoken timestamp, and the gold line carries each transition.

## Quick start

```bash
npm install
npm run build        # SFX → voice/timings → out/habit_reel.mp4 → out/habit_reel_thumbnail.png
npm run studio       # live preview / scrubbing
npm run stills       # 8 review frames → out/stills/
npm run timeline     # print scene windows + every word's frame
```

Output: `out/habit_reel.mp4` (H.264 CRF 18, yuv420p BT.709, AAC 192 kbps; settings live in `remotion.config.ts`).

If Remotion can't download its Chrome Headless Shell (a locked-down network, for example), point it at an existing one:
`REMOTION_BROWSER_EXECUTABLE=/path/to/headless_shell npm run render`.

## Voiceover

`npm run voice` (it also runs as part of `build`) picks the first option that works:

1. **`public/voiceover.mp3` exists.** It is normalised to a −3 dBFS peak and transcribed locally with
   whisper.cpp (`@remotion/install-whisper-cpp`, word-level timestamps). Each transcribed word is then aligned to
   the script with a Needleman–Wunsch alignment, so a misheard or dropped word is interpolated instead of shifting everything after it.
2. **`ELEVENLABS_API_KEY` is set.** The voice is generated first with a deep, calm, older male voice, slow pace and stability 0.6, with
   `<break>` tags at the marked pauses. Then it follows option 1.
   Optional overrides: `ELEVENLABS_VOICE_ID`, `ELEVENLABS_MODEL`.
3. **Neither is available.** Timings are estimated at 2.2 words/s plus the marked pauses, and the reel has **no voice**.

Results go to `src/generated/voice.json`. They are used only while the script is unchanged: `SCRIPT_KEY` guards
against mixing old timestamps with edited words. Whisper options: `WHISPER_MODEL` (default `medium.en`) and
`WHISPER_CPP_VERSION` (default `1.5.5`).

## Changing the script or timings

Everything you need to adjust is in **`src/scenes.ts`**:

- `SCRIPT`: the voiceover, word for word, split into parts with ids. Markup:
  `*word*` = gold key word, `/` = line break on screen, `spoken|SHOWN` = display a different form
  (e.g. `bored,|BORED.`), `pause: "short" | "long" | "hold"` = silence after a part.
  You can rewrite the words freely. Keep the part ids, because each scene reads its parts by id.
- `ESTIMATE`: the words-per-second rate and pause lengths used when there is no voice.
- `TRANSITIONS`: transition lengths in frames (shatter, scanner, zoom, black frames, rewind…).
- `SOUND`: levels for each SFX and the drone, plus how much they duck under the voice.
- `COLORS`, `SAFE`, `END_HOLD`, `WORD_LEAD_FRAMES`.

Scene boundaries are never hard-coded. They come from the words (`src/timing.ts → TIMELINE`), so a new
voiceover re-times the whole reel. After editing words with a real voiceover, run `npm run voice` again.

## Sound

`npm run sfx` synthesises every effect procedurally into `public/sfx/`, so there are no third-party samples and no licences to track:
whoosh (transitions), impact (slammed words), sub (under "GIVES IN" and the final rule), rewind (the cycle),
typewriter ticks, and a loopable low room-tone drone. There is no music.

## Layout

```
src/scenes.ts            config: script, pacing, transitions, levels
src/timing.ts            word timings (Whisper or estimate) → scene windows
src/HabitReel.tsx        scene stack, scanner wipe, vignette, grain, black cut
src/scenes/*.tsx         Hook · WeakMan · StrongWave · StrongActions · Rule
src/Sound.tsx            voice, SFX events, drone, ducking
scripts/                 generate-sfx · prepare-voice · align (+ test) · render-stills · print-timeline
```
