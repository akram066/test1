/**
 * scenes.ts — the single place to change the script, pacing and timings.
 *
 * SCRIPT MARKUP (inside `text`):
 *   *word*          gold key word
 *   /               line break on screen (not spoken)
 *   spoken|SHOWN    speak one form, display another (e.g. "bored,|BORED.")
 * Commas are dropped from the display automatically; periods are kept.
 *
 * Every part is spoken in order. The scene components read parts by `id`,
 * so you can rewrite the words freely as long as the ids stay the same.
 * After editing the words, run `npm run voice` again if you have a voiceover
 * so the Whisper timestamps are re-aligned to the new script.
 */

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

/** Facebook/Reels UI safe margins in px. */
export const SAFE = { top: 120, bottom: 120, side: 90 } as const;

export const COLORS = {
  bg: "#0A0A0B",
  white: "#F5F5F0",
  gold: "#D4AF5A",
  gray: "#8A8A90",
  red: "#8B1E1E",
} as const;

export type PauseKind = "short" | "long" | "hold";

export type Part = {
  id: string;
  text: string;
  /** Silence after this part (used only for estimated timings / TTS breaks). */
  pause?: PauseKind;
};

/** The voiceover, word for word, split into the pieces the scenes animate. */
export const SCRIPT: Part[] = [
  // 1 · HOOK
  { id: "hookA", text: "The *habit*" },
  { id: "hookB", text: "no man" },
  { id: "hookC", text: "talks about.", pause: "short" },

  // 2 · WEAK MAN
  { id: "weakLabel", text: "A weak man" },
  { id: "givesIn", text: "gives in" },
  { id: "everyTime", text: "every time he is" },
  { id: "stack", text: "bored,|BORED. / tired,|TIRED. / or / alone.|ALONE." },
  { id: "thenHe", text: "Then he" },
  { id: "hates", text: "hates / himself,|HIMSELF." },
  { id: "and", text: "and" },
  { id: "repeats", text: "repeats it / tomorrow.", pause: "short" },

  // 3 · STRONG MAN, THE WAVE
  { id: "strongLabel", text: "A strong man" },
  { id: "knows", text: "knows" },
  { id: "urge", text: "an urge is / a *wave.*" },
  { id: "rises", text: "It rises." },
  { id: "passes", text: "It *passes.*", pause: "short" },

  // 4 · STRONG MAN, THE ACTIONS
  { id: "stands", text: "He / *stands* / up." },
  { id: "leaves", text: "He leaves / the room." },
  { id: "moves", text: "He moves / his body." },
  { id: "phone", text: "The phone / stays outside / the bedroom.", pause: "long" },

  // 5 · RULE AND CTA
  { id: "rule1", text: "*Control* / your urges," },
  { id: "rule2", text: "or they will / control you.", pause: "hold" },
  { id: "cta", text: "Follow for more rules." },
];

/** Unspoken brand line under the CTA. */
export const BRAND_LINE = "THE STRONG MAN CODE";

/**
 * Fallback timing when there is no voiceover: 2.2 words per second plus the
 * marked pauses. Ignored as soon as src/generated/voice.json matches SCRIPT.
 */
export const ESTIMATE = {
  wordsPerSecond: 2.2,
  startAt: 0.3, // first word, seconds
  pauses: { short: 0.7, long: 1.2, hold: 1.0 } satisfies Record<PauseKind, number>,
};

/** How long the last frame holds after the final spoken word ends (s). */
export const END_HOLD = 1.8;

/** Visual lead: each word starts entering this many frames before it is spoken. */
export const WORD_LEAD_FRAMES = 3;

/** Transition timings, in frames. Scene boundaries follow the voice. */
export const TRANSITIONS = {
  hookShatter: 12, // slices exit, ends when the WEAK MAN scene begins
  weakSceneLead: 8, // WEAK MAN scene starts this long before "A weak man"
  scanner: 14, // gold scanner wipe, ends just before "A strong man"
  scannerGap: 2,
  zoomThroughO: 18, // push into the O of STRONG, ends before "He stands up"
  zoomGap: 3,
  actionsCutLead: 2, // each action phrase cuts in this long before its first word is spoken
  blackFrames: 4, // pure black before the rule
  ruleLead: 14, // gold line draws this long before "Control"
  rewindAfter: 8, // "TOMORROW." rewinds this many frames after it lands
  rewindFrames: 6,
} as const;

/** Sound design levels (linear gain, 1 = unity). Voice is normalised to -3 dBFS peak. */
export const SOUND = {
  voice: 1,
  whoosh: 0.45,
  impact: 0.5,
  sub: 0.6,
  rewind: 0.45,
  tick: 0.12,
  drone: 0.16,
  /** How much SFX and drone drop while a word is being spoken (0..1). */
  duckSfx: 0.4,
  duckDrone: 0.5,
};
