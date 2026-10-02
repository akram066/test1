# Base prompt: The Strong Man Code reel (men's page)

Copy everything inside the box, fill in the TOPIC and SCRIPT lines (AVOID is optional), and send it.
It keeps the structure and the motion quality of the page's reels, and asks for a brand-new creative
concept every time: new symbols, objects, colours and transitions.

```text
Act like a senior motion designer and Remotion engineer. Build a premium, words-only
motion-graphics reel: no people, faces or footage, just kinetic typography plus symbolic objects.
Use high-quality HyperFrames and hyper-motion throughout.

This is for my men's page "The Strong Man Code".

TOPIC: [e.g. waking up early / saving money / leaving your phone / training when tired]
SCRIPT: [paste your script, or write "write it for me and show me before building"]
AVOID: [optional: ideas used in recent reels that must not come back]

DO NOT COPY PAST REELS
- Invent a fresh creative concept for this reel. Do not reuse the symbols, objects, colours, layouts
  or transitions of any earlier reel (including the example reels inside the strong-man-reel skill and
  everything in video-projects/). Look at what already exists and make this one clearly different.
- Use the strong-man-reel skill only for its pipeline: voice, word timing, sound mix, build, lint,
  render and checks. Its reference reel is an example of quality, not a design to copy.

QUALITY BAR (hyper-motion, high-quality HyperFrames)
- Treat every frame as a designed frame: no static moments. Something always drifts, breathes or moves.
- Layered depth: background, mid and foreground layers moving at different speeds (parallax),
  slow camera push-ins, and camera moves that carry the eye from one scene to the next.
- Motion with intent: at least 3 different eases per scene, entrances that overlap, staggered letters
  and words, objects that wind up before they move and settle after. Nothing linear, nothing robotic.
- Transitions are designed moments that carry meaning, never a default cut or plain crossfade.
- Every word lands exactly on its spoken timestamp, with sound effects locked to the same beats.
- Pixel-level polish: safe margins (90 px sides, 120 px top and bottom), no overflow, no overlapping
  text, crisp readable type at phone size, self-hosted fonts, a deterministic timeline.
- Render at high quality (HyperFrames --quality high, H.264, CRF 18 master) and check frames
  from the actual MP4, not only previews, before delivering.

THE STRUCTURE (the same in every reel)

Format
- Vertical 1080x1920, 30 fps, 25-35 seconds, built in HyperFrames.
- Faceless: no people, faces, bodies or photos. No emojis.

Script (55-80 words, US spelling, simple UK/US English, always original)
- Voice of a wise, charismatic older man: calm, direct, certain, a little cold. Short heavy sentences
  spoken to "you". No jokes, slang, shouting, begging for likes, or putting down women or any group.
- Arc: hook (a hard truth or a curiosity line) -> the weak man and what he does -> the turn ->
  the strong man's actions (3-4 very short lines) -> the rule -> a short CTA.
- Weak man first, strong man last. No medical or financial claims.

Voice and sound
- Always the ElevenLabs voice "Bill Adams - Wise and Motivational American Storyteller"
  (voice ID V2bPluzT7MuirpucVAKH), model eleven_multilingual_v2, the whole script in one take with
  <break> pauses for weight. Make 2 takes and pick the clearer one. Only if ElevenLabs is unavailable,
  tell me before falling back to the local voice.
- Sound design built for this concept: transition sounds on every cut, impacts on the hard moments,
  a low hit under the biggest weak-side line and under the rule, a low bed, all ducked under the voice.

Look (new every reel, same mood)
- Dark, high-contrast canvas with ONE strong accent colour chosen for this topic (change it between
  reels), warm off-white text, a desaturated tone for the weak side.
- A bold condensed display face for statements and a second, contrasting face for small connector
  words and labels; pick a pairing that suits the concept.
- A life layer (grain or texture, a breathing vignette, a thin progress line). No text headers:
  no tags, timers or section labels.

Story devices (invent new ones every reel)
- A NEW visual pair for the weak man and the strong man, made from the topic's world (for example:
  a guttering candle vs a steady flame, a slack rope vs a taut one, a rusted key vs a forged one,
  sand vs stone, a drifting boat vs one at anchor). Weak = hollow, small, cracked, dim, pulled
  around. Strong = solid, lit, upright, still. Never the same pair twice in a row.
- Every spoken word appears on screen exactly as it is spoken (the words are the captions).
- One concrete object per scene, taken from the line's noun, and it ACTS on the spoken word
  (breaks, fills, opens, locks, burns, rises, falls).
- A different text layout in every scene, never the same centred vertical stack twice in a row.
  Mix typography ideas such as slam + typewriter, a label + a stamp, broken type, a word printed on an
  object, text on a path, an editorial diagonal, speed type, hanging words, a giant word with a small
  line, a counter, a split screen. Invent new ones too.

Transitions (invent new ones every reel)
- One signature transition designed for this concept carries about 60% of the cuts.
- 3-5 accent transitions, each chosen for what that cut means: a breaking point, a loop, a topic
  change from weak to strong, entering a new space, weight before the rule.
- No scene exits before its transition. The ending holds still.

Ending
- Hold on the rule, a small emblem of the strong-man symbol, the CTA and the page name
  "THE STRONG MAN CODE", readable as a thumbnail.

Deliver
- Before building, show me: the script (unless I gave it), a one-paragraph creative concept (the
  symbol pair, the colour, the signature transition and why they fit the topic) and the scene table
  (line -> object -> text layout -> transition -> sound).
- Then build, check every scene and transition in stills and in the rendered MP4, fix any overlaps
  or unreadable text, and give me a high-quality MP4, a share copy under 30 MB and a thumbnail, with
  the scene timings.
```

---

## Add-on: image posts

Paste this part (instead of, or after, the reel prompt) when you want image posts. Attach your profile picture.

```text
IMAGE POSTS for my men's page "The Strong Man Code".

TOPIC: [the idea for the post or posts]
HOW MANY: [1 / 3 / 5]
FORMAT: [text card / weak vs strong dialogue / photo + headline / you choose the best fit]
MY PROFILE PICTURE: attached     HANDLE: [@yourhandle]

Act like a senior social media designer. Make each post an original 1080x1350 PNG (4:5), designed
by you (HTML/CSS rendered to an image, self-hosted fonts), and check it at phone size before you
give it to me.

Formats
1. Text card: looks like a native social post. Black background (#070405), my profile picture as a
   perfect circle top-left, page name in bold white with my handle in grey under it, then the post
   in a clean sans (white, 40-46 px, left-aligned), short lines with a blank line between ideas.
   An optional first line in caps as the headline. 8-14 short lines at most.
2. Weak vs strong dialogue: the same card style written as an exchange, 3-5 rounds:
   WEAK MAN: "..." / STRONG MAN: "...", ending with one hard closing line.
   Labels in red (#E3141C), weak lines in grey, strong lines in white.
3. Photo + headline: a dark, cinematic photo with a red tint fills the top 60-65% (objects,
   places, or a man seen from behind, never a face). Below it, a thin white line with my small
   round profile picture and handle in the middle, then a bold condensed headline in 3-4 lines:
   white words with the key words in red. Make the photo with an image tool (not ElevenLabs) or
   use a photo I give you.

Writing (the same voice as the reels)
- A wise, direct older man. One idea per post.
- Open with a hook that stops the scroll: a hard truth, a number, or a short real-life story.
- Concrete details from real life (prices, ages, everyday situations); end with a rule or one
  sharp last line.
- No jokes, slang, emojis in the image, begging for likes, or putting down women or any group.
- No medical or financial claims or guarantees, no invented statistics, no fake quotes or fake
  screenshots of real people, and no verified badge unless my page is verified.

Caption (the text above the image)
- A first line that stops mid-thought so people tap "See more", then 3-6 short lines that expand
  the idea, then one question that invites comments. 0-3 hashtags.

Keep the colours, fonts and layout the same across posts so the feed looks like one brand.
```
