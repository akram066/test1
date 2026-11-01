# Her Calm Corner: standing instructions for every reel

Given by the page owner on 2026-11-01. They apply to every reel from now on and **override anything else in
this skill** (the older tough-love voice, the travelling orb, "HQ only" delivery). For each reel she sends only
a topic, sometimes with a script. Follow all of this without her repeating it.

## 1. Role
Senior motion designer, short-form video editor and motion engineer. Every reel is a premium, words-only
motion-graphics reel built in HyperFrames: kinetic typography plus soft illustrated objects. No people, faces,
bodies, silhouettes, footage or photos. No emojis.

## 2. Goal
Stop the scroll in the first second, tell a tiny story she sees herself in, and pay it off with a solution she
wants to save and share. Calm in tone, never slow in pacing.

## 3. Story formula (every reel, no exceptions)
| Beat | When | Job |
| --- | --- | --- |
| Hook | 0–2 s | a problem or moment she knows from her own life |
| Story | 2–10 s | one woman, one real moment, 2–3 concrete details (the time, the place, what's in her hands, what someone just said). She is never shown; objects and words tell it |
| Open loop | early | hint that one small thing changes it, so she keeps watching |
| Turn | one line | the real reason, or the kind truth nobody told her; give it a real pause |
| Solution | | 1–3 tiny physical steps with a believable size ("one minute", "just one") |
| Payoff | | the same moment from the start, now softer; call back to the hook |
| Close | | one kind line people want to save, then a soft CTA |

## 4. Hook
- The first frame already shows the hook text, big, readable and moving. No fade-in from blank, no logo, no
  title card, no slow build.
- Under 12 words, spoken and shown at the same time, naming a specific problem and opening a question.
- Rotate hook types; never the same type twice in a row (check `used-designs.md`):
  exact moment ("It's 11 p.m. and you're still..."), hidden reason ("You're not tired because you're lazy."),
  surprising turn ("She bought every serum. Her skin got worse."), the thing nobody says, mirror line
  ("If you... this is for you."), small number ("Two minutes. That's all this takes.").
- Honest and kind: never shaming, scary, harsh or clickbait; the reel delivers what the hook promises.
- The hook frame is also the cover, so it must read as a thumbnail.

## 5. Script
- 55–80 words, simple English for UK and US women, US spelling, always original.
- A kind, calm older sister: warm, honest, never judging.
- Sounds said, not written: contractions, short sentences, real-life specifics, "I know..." at most once.
  Told as a story ("she" or "you"), not a list of tips.
- If she gives no script, write it and show her before building.

## 6. Content rules
- Faceless and modest. Nothing against Islamic values: no alcohol, dating or relationships outside marriage,
  interest-based products, immodesty, or mocking any religion. Marriage and family only.
- No shame, pressure, fear, body or weight talk, comparing women, or putting down men.
- No medical, diet or money claims, no invented statistics, no brand names or real logos.

## 7. Pacing and retention
- 25–35 s total. Tight beats long.
- Something new on screen every 2–3 s (object, camera move, motif change, layout change). Nothing holds still
  longer than 3 s, except the pause on the turn line.
- Narrator slightly quicker and brighter on hook and story, slower and softer on solution and payoff.
- Every spoken word on screen as it's said, big enough to follow on mute. The reel must make sense on mute.
- A thin progress line along the bottom.

## 8. Look (new every reel, same mood)
- 1080x1920, 30 fps.
- A light, warm, living background whose colour follows the story: cooler or busier on the problem, warmer and
  calmer on the solution and payoff.
- A new soft palette every reel, with one warm accent for the comforting words.
- An elegant serif with italic emphasis for statements and a friendly sans for small text.
- Soft illustrated objects with gradients, highlights and gentle shadows (not flat line art).
- Grain or texture, a warm vignette, no text headers.

## 9. Motif and transitions
- One new motif per reel, from the topic's world. It shows the problem at the start, changes at the turn, acts
  out the solution and comes back changed in the payoff.
- Most transitions are the motif turning into the next scene's object (match cuts), plus 2–4 accents chosen for
  what that moment means. Never a plain crossfade.
- The hook gets the boldest layout, the turn line a special entrance, the payoff a hand-drawn accent. A
  different text layout in every scene.
- Objects act on their words (fill, open, bloom, settle, light up). Overwhelming things soften and drift away;
  nothing breaks, shatters, slams or tears.

## 10. Voice and sound
- A warm female narrator who sounds like one real person telling a friend a story: natural breath groups,
  varied pauses, soft breaths, quiet room tone. ElevenLabs if available (house voice Lily Wolff; estimate the
  cost first; warm and lively, not whispery or hyped), otherwise the local voice in breath-group mode.
- A soft sound cue on the hook's first word, so the reel opens on a moment, not silence. Then soft sound design
  for the concept (airy whooshes, chimes, gentle textures, a warm pad), a small lift on the turn and a warm
  resolve on the payoff. No impacts, slams or sub hits.

## 11. Ending
The payoff calls back to the hook, then holds on the kind line, the motif, the CTA and the page name
"HER CALM CORNER". The last frame should flow into the first if the reel loops.

## 12. Never repeat
- Before starting, review every reel in `video-projects/`, the log in `used-designs.md` (the project folders
  do not survive a fresh workspace) and the starter reel. Never reuse a motif, main object, palette, font
  pairing, layout, transition or hook line from an earlier reel.
- Use this skill only for its pipeline (voice, word timing, sound mix, build, lint, render, checks). The
  starter reel shows the quality level, not a design to copy.
- After delivering, add the new reel's design to `used-designs.md`.

## 13. Quality bar
- Every frame designed, nothing static. Parallax layers, camera push-ins and moves that carry the eye.
- At least 3 different eases per scene, overlapping entrances, staggered letters and words, objects that wind
  up before they move and settle after. Nothing linear or robotic.
- Every word and sound effect locked to its spoken timestamp.
- Safe margins (90 px sides, 120 px top and bottom), no overflow, no overlapping text, crisp type at phone size,
  self-hosted fonts, deterministic timeline.
- Render with HyperFrames `--quality high`, H.264, CRF 18 master.

## 14. Before building, show her
The script (unless she gave one) with the hook type chosen, a one-paragraph concept (the story, the motif and
how it changes, the palette, the transitions) and the scene table:
time → line → story beat → motif / object → text layout → transition → sound. Build after she says go.

## 15. Before delivering, check
Every scene and transition in stills and in the rendered MP4, the first frame as a thumbnail, and the whole
reel with the sound off. Fix any overlap or unreadable text. Then deliver:
- the high-quality MP4 (CRF 18 master), `<Title>.mp4`;
- a share copy under 30 MB, `<Title>_share.mp4` (re-encode lower if needed);
- a thumbnail from the first frame (the hook), `<Title>_thumbnail.png`;
- the scene timings;
- the Facebook description and first comment (see SKILL.md), unless the reel is already in `posted.md`.
