import { Html5Audio, Sequence, staticFile } from "remotion";
import { actionCuts } from "./scenes/StrongActions";
import { hookSlamHits } from "./scenes/Hook";
import { weakImpactFrames, weakRewindFrame } from "./scenes/WeakMan";
import { SOUND } from "./scenes";
import { EASE_CALM, prog } from "./theme";
import { DURATION_IN_FRAMES, HAS_VOICE, part, VOICE_FILE, WORDS, TIMELINE } from "./timing";

type Sfx = "whoosh" | "impact" | "sub" | "rewind" | "tick";

const LENGTH: Record<Sfx, number> = { whoosh: 30, impact: 24, sub: 72, rewind: 12, tick: 3 };

/** 0..1 envelope that is high while a word is being spoken (used for ducking). */
const voiceActivity = (frame: number) => {
  let a = 0;
  for (const w of WORDS) {
    if (frame < w.at - 5 || frame > w.out + 10) continue;
    const attack = prog(frame, w.at - 5, 5, EASE_CALM);
    const release = 1 - prog(frame, w.out, 10, EASE_CALM);
    a = Math.max(a, Math.min(attack, release));
    if (a >= 1) break;
  }
  return a;
};

const duck = (frame: number, amount: number) => (HAS_VOICE ? 1 - amount * voiceActivity(frame) : 1);

const typingTicks = () => {
  const out: number[] = [];
  for (const w of part("hookC").words) {
    const n = w.display.length;
    const dur = Math.max(6, (w.out - w.at) * 0.85);
    for (let i = 0; i < n; i++) {
      if (/[A-Z]/.test(w.display[i])) out.push(w.in + Math.floor((i * dur) / n));
    }
  }
  return out;
};

const events = (): { at: number; sfx: Sfx; gain: number }[] => {
  const cuts = actionCuts();
  const list: { at: number; sfx: Sfx; gain: number }[] = [
    // whooshes on every transition
    { at: TIMELINE.hook.exitFrom - 3, sfx: "whoosh", gain: SOUND.whoosh },
    { at: TIMELINE.scanner.from - 2, sfx: "whoosh", gain: SOUND.whoosh },
    { at: TIMELINE.wave.zoomFrom, sfx: "whoosh", gain: SOUND.whoosh * 1.1 },
    ...cuts.slice(1).map((at) => ({ at: at - 2, sfx: "whoosh" as const, gain: SOUND.whoosh * 0.6 })),
    { at: TIMELINE.rule.from, sfx: "whoosh", gain: SOUND.whoosh * 0.5 },
    // soft impacts on slammed words
    ...hookSlamHits().map((at) => ({ at: at - 1, sfx: "impact" as const, gain: SOUND.impact })),
    ...weakImpactFrames().map((at) => ({ at, sfx: "impact" as const, gain: SOUND.impact * 0.8 })),
    ...cuts.map((at, i) => ({ at: i === 0 ? part("stands").first.at : at + 4, sfx: "impact" as const, gain: SOUND.impact * 0.55 })),
    // sub-bass under "GIVES IN" and under the final rule
    { at: part("givesIn").first.at, sfx: "sub", gain: SOUND.sub },
    { at: part("rule1").first.at, sfx: "sub", gain: SOUND.sub },
    // the cycle rewinds
    { at: weakRewindFrame(), sfx: "rewind", gain: SOUND.rewind },
    ...typingTicks().map((at) => ({ at, sfx: "tick" as const, gain: SOUND.tick })),
  ];
  return list.filter((e) => e.at >= 0 && e.at < DURATION_IN_FRAMES);
};

export const Sound: React.FC = () => (
  <>
    {VOICE_FILE ? <Html5Audio src={staticFile(VOICE_FILE)} volume={SOUND.voice} /> : null}
    <Html5Audio
      src={staticFile("sfx/drone.wav")}
      loop
      volume={(f) => {
        const fadeIn = prog(f, 0, 20, EASE_CALM);
        const fadeOut = 1 - prog(f, DURATION_IN_FRAMES - 30, 30, EASE_CALM);
        return SOUND.drone * fadeIn * fadeOut * duck(f, SOUND.duckDrone);
      }}
    />
    {events().map((e, i) => (
      <Sequence key={i} from={e.at} durationInFrames={LENGTH[e.sfx]} layout="none">
        <Html5Audio
          src={staticFile(`sfx/${e.sfx}.wav`)}
          volume={() => Math.min(1, e.gain * duck(e.at, SOUND.duckSfx))}
        />
      </Sequence>
    ))}
  </>
);
