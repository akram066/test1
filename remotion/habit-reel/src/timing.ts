import voice from "./generated/voice.json";
import {
  END_HOLD,
  ESTIMATE,
  FPS,
  SCRIPT,
  TRANSITIONS as T,
  WORD_LEAD_FRAMES,
} from "./scenes";

export type Word = {
  index: number;
  partId: string;
  spoken: string;
  display: string;
  gold: boolean;
  /** Line index inside its part. */
  line: number;
  start: number; // seconds
  end: number; // seconds
  /** Frame at which the word starts entering (includes the visual lead). */
  in: number;
  /** Frame at which the word is spoken. */
  at: number;
  /** Frame at which the word ends. */
  out: number;
};

type ParsedWord = Omit<Word, "start" | "end" | "in" | "at" | "out">;

export const normalizeWord = (w: string) =>
  w.toLowerCase().replace(/[^a-z0-9']/g, "");

const parseScript = (): ParsedWord[] => {
  const words: ParsedWord[] = [];
  for (const part of SCRIPT) {
    let line = 0;
    for (const token of part.text.split(/\s+/).filter(Boolean)) {
      if (token === "/") {
        line++;
        continue;
      }
      const [spokenRaw, shownRaw] = token.split("|");
      const gold = /\*/.test(token);
      const spoken = spokenRaw.replace(/\*/g, "");
      const display = (shownRaw ?? spoken)
        .replace(/\*/g, "")
        .replace(/,/g, "")
        .toUpperCase();
      words.push({
        index: words.length,
        partId: part.id,
        spoken,
        display,
        gold,
        line,
      });
    }
  }
  return words;
};

const parsed = parseScript();

/** Identifies the script so stale Whisper timings are never mixed with edited text. */
export const SCRIPT_KEY = parsed.map((w) => normalizeWord(w.spoken)).join(" ");

type VoiceJson = {
  hasVoice: boolean;
  audioFile?: string;
  durationInSeconds?: number;
  scriptKey?: string;
  source?: string;
  words?: { text: string; start: number; end: number }[];
};

const voiceData = voice as VoiceJson;

export const HAS_VOICE =
  voiceData.hasVoice === true &&
  voiceData.scriptKey === SCRIPT_KEY &&
  (voiceData.words?.length ?? 0) === parsed.length;

export const VOICE_FILE = HAS_VOICE ? voiceData.audioFile ?? null : null;
export const TIMING_SOURCE = HAS_VOICE
  ? voiceData.source ?? "whisper"
  : "estimated (2.2 words/s, no voiceover)";

const estimate = (): { start: number; end: number }[] => {
  const dur = 1 / ESTIMATE.wordsPerSecond;
  let t = ESTIMATE.startAt;
  const out: { start: number; end: number }[] = [];
  for (const part of SCRIPT) {
    for (const w of parsed.filter((p) => p.partId === part.id)) {
      out[w.index] = { start: t, end: t + dur };
      t += dur;
    }
    if (part.pause) t += ESTIMATE.pauses[part.pause];
  }
  return out;
};

const times = HAS_VOICE ? voiceData.words! : estimate();

export const sec = (s: number) => Math.round(s * FPS);

export const WORDS: Word[] = parsed.map((w, i) => ({
  ...w,
  start: times[i].start,
  end: times[i].end,
  in: Math.max(0, sec(times[i].start) - WORD_LEAD_FRAMES),
  at: sec(times[i].start),
  out: sec(times[i].end),
}));

export type PartTiming = {
  id: string;
  words: Word[];
  lines: Word[][];
  first: Word;
  last: Word;
};

const partCache = new Map<string, PartTiming>();

export const part = (id: string): PartTiming => {
  const cached = partCache.get(id);
  if (cached) return cached;
  const words = WORDS.filter((w) => w.partId === id);
  if (words.length === 0) throw new Error(`Unknown script part "${id}"`);
  const lines: Word[][] = [];
  for (const w of words) (lines[w.line] ??= []).push(w);
  const result = {
    id,
    words,
    lines: lines.filter(Boolean),
    first: words[0],
    last: words[words.length - 1],
  };
  partCache.set(id, result);
  return result;
};

const lastWord = WORDS[WORDS.length - 1];
const speechEnd = Math.max(
  lastWord.end,
  HAS_VOICE ? voiceData.durationInSeconds ?? 0 : 0,
);

export const DURATION_IN_FRAMES = Math.max(
  sec(lastWord.end + END_HOLD),
  sec(speechEnd) + 6,
);

/** Absolute scene windows [from, to) in frames, all derived from the voice. */
const weakFrom = part("weakLabel").first.at - T.weakSceneLead;
const scannerTo = part("strongLabel").first.at - T.scannerGap;
const scannerFrom = scannerTo - T.scanner;
const zoomTo = part("stands").first.at - T.zoomGap;
const zoomFrom = zoomTo - T.zoomThroughO;
const ruleFrom = part("rule1").first.at - T.ruleLead;
const blackFrom = ruleFrom - T.blackFrames;

export const TIMELINE = {
  hook: { from: 0, to: weakFrom, exitFrom: weakFrom - T.hookShatter },
  weak: { from: weakFrom, to: scannerTo },
  scanner: { from: scannerFrom, to: scannerTo },
  wave: { from: scannerFrom, to: zoomTo, zoomFrom },
  actions: { from: zoomTo, to: blackFrom },
  black: { from: blackFrom, to: ruleFrom },
  rule: { from: ruleFrom, to: DURATION_IN_FRAMES },
} as const;
