/**
 * Voiceover pipeline → src/generated/voice.json
 *
 * 1. Uses public/voiceover.mp3 if it exists.
 * 2. Otherwise, if ELEVENLABS_API_KEY is set, generates it from SCRIPT
 *    (deep, calm, older male voice; slow; stability 0.6).
 * 3. Normalises the voice to -3 dBFS peak (public/voiceover.norm.wav).
 * 4. Transcribes it locally with whisper.cpp (word-level timestamps) and aligns
 *    every transcribed word to the script so each on-screen word enters on its
 *    real timestamp.
 * If there is no voiceover and no API key, it writes { hasVoice: false } and the
 * reel falls back to estimated timings (2.2 words/s).
 *
 * Env overrides: ELEVENLABS_VOICE_ID, ELEVENLABS_MODEL, WHISPER_MODEL, WHISPER_CPP_VERSION
 */
import {
  downloadWhisperModel,
  installWhisperCpp,
  toCaptions,
  transcribe,
  type WhisperModel,
} from "@remotion/install-whisper-cpp";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ESTIMATE, SCRIPT } from "../src/scenes";
import { SCRIPT_KEY, normalizeWord } from "../src/timing";
import { align, type Timed } from "./align";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = join(root, "public");
const VOICE_MP3 = join(PUBLIC, "voiceover.mp3");
const VOICE_NORM = "voiceover.norm.wav";
const OUT_JSON = join(root, "src", "generated", "voice.json");
const WHISPER_DIR = join(root, "whisper.cpp");
const WHISPER_VERSION = process.env.WHISPER_CPP_VERSION ?? "1.5.5";
const WHISPER_MODEL = (process.env.WHISPER_MODEL ?? "medium.en") as WhisperModel;
const PEAK_DB = -3;

const writeJson = (data: object) => {
  mkdirSync(dirname(OUT_JSON), { recursive: true });
  writeFileSync(OUT_JSON, `${JSON.stringify(data, null, 2)}\n`);
};

/** Runs Remotion's bundled ffmpeg / ffprobe (no system install required). */
const remotionTool = (tool: "ffmpeg" | "ffprobe", args: string[]) =>
  execFileSync("npx", ["remotion", tool, ...args], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

/** Peak level in dBFS, measured in Node from a decoded WAV (Remotion's ffmpeg has no volumedetect). */
const peakDb = (file: string) => {
  const tmp = join(tmpdir(), `habit-reel-peak-${process.pid}.wav`);
  remotionTool("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", "-i", file, "-ac", "1", "-c:a", "pcm_s16le", tmp]);
  const wav = readFileSync(tmp);
  rmSync(tmp, { force: true });
  let offset = 12;
  while (offset + 8 <= wav.length && wav.toString("ascii", offset, offset + 4) !== "data") {
    offset += 8 + wav.readUInt32LE(offset + 4);
  }
  let peak = 1;
  for (let i = offset + 8; i + 1 < wav.length; i += 2) peak = Math.max(peak, Math.abs(wav.readInt16LE(i)));
  return 20 * Math.log10(peak / 32768);
};

const ttsText = () =>
  SCRIPT.map((p) => {
    const spoken = p.text
      .split(/\s+/)
      .filter((t) => t && t !== "/")
      .map((t) => t.split("|")[0].replace(/\*/g, ""))
      .join(" ");
    return p.pause ? `${spoken} <break time="${ESTIMATE.pauses[p.pause]}s" />` : spoken;
  })
    .join(" ")
    .replace(/^./, (c) => c.toUpperCase());

const generateWithElevenLabs = async (apiKey: string) => {
  // "Bill" — premade older, calm, deep American male. Override with ELEVENLABS_VOICE_ID.
  const voiceId = process.env.ELEVENLABS_VOICE_ID ?? "pqHfZKP75CvOlQylNhV4";
  const model = process.env.ELEVENLABS_MODEL ?? "eleven_multilingual_v2";
  console.log(`Generating voiceover with ElevenLabs (voice ${voiceId}, ${model})…`);
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_192`,
    {
      method: "POST",
      headers: { "xi-api-key": apiKey, "Content-Type": "application/json", Accept: "audio/mpeg" },
      body: JSON.stringify({
        text: ttsText(),
        model_id: model,
        voice_settings: { stability: 0.6, similarity_boost: 0.8, style: 0.1, use_speaker_boost: true, speed: 0.88 },
      }),
    },
  );
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`);
  writeFileSync(VOICE_MP3, Buffer.from(await res.arrayBuffer()));
  console.log(`  wrote ${VOICE_MP3}`);
};

const normalize = () => {
  const max = Number(peakDb(VOICE_MP3).toFixed(2));
  const gain = PEAK_DB - max;
  console.log(`Normalising voice: peak ${max} dB → ${PEAK_DB} dB (gain ${gain.toFixed(2)} dB)`);
  remotionTool("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", "-i", VOICE_MP3, "-af", `volume=${gain.toFixed(2)}dB`, "-ar", "48000", join(PUBLIC, VOICE_NORM)]);
  const dur = Number(
    remotionTool("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", VOICE_MP3]).trim(),
  );
  return dur;
};

const transcribeWords = async (): Promise<Timed[]> => {
  const wav16 = join(WHISPER_DIR, "voiceover-16k.wav");
  await installWhisperCpp({ to: WHISPER_DIR, version: WHISPER_VERSION });
  await downloadWhisperModel({ model: WHISPER_MODEL, folder: WHISPER_DIR });
  remotionTool("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", "-i", VOICE_MP3, "-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le", wav16]);
  console.log(`Transcribing with whisper.cpp ${WHISPER_VERSION} (${WHISPER_MODEL})…`);
  const whisperCppOutput = await transcribe({
    inputPath: wav16,
    whisperPath: WHISPER_DIR,
    whisperCppVersion: WHISPER_VERSION,
    model: WHISPER_MODEL,
    tokenLevelTimestamps: true,
    language: "en",
    splitOnWord: true,
  });
  const { captions } = toCaptions({ whisperCppOutput });
  return captions
    .map((c) => ({ word: normalizeWord(c.text), start: c.startMs / 1000, end: c.endMs / 1000 }))
    .filter((c) => c.word.length > 0);
};

const main = async () => {
  if (!existsSync(VOICE_MP3)) {
    const key = process.env.ELEVENLABS_API_KEY;
    if (!key) {
      writeJson({ hasVoice: false });
      console.log(
        [
          "",
          "==============================================================",
          "  NO VOICEOVER: public/voiceover.mp3 is missing and",
          "  ELEVENLABS_API_KEY is not set. The reel uses ESTIMATED",
          "  timings (2.2 words/s + marked pauses) and has NO VOICE.",
          "==============================================================",
          "",
        ].join("\n"),
      );
      return;
    }
    await generateWithElevenLabs(key);
  }
  const durationInSeconds = normalize();
  const words = align(await transcribeWords());
  writeJson({
    hasVoice: true,
    audioFile: VOICE_NORM,
    durationInSeconds,
    scriptKey: SCRIPT_KEY,
    source: `whisper.cpp ${WHISPER_VERSION} (${WHISPER_MODEL})`,
    words,
  });
  console.log(`Wrote ${OUT_JSON} (${words.length} words, ${durationInSeconds.toFixed(2)}s)`);
};

await main();
