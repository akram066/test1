import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Black, GoldLine, Grain, Vignette } from "./components/primitives";
import { HEIGHT, WIDTH } from "./scenes";
import { Hook } from "./scenes/Hook";
import { Rule } from "./scenes/Rule";
import { StrongActions } from "./scenes/StrongActions";
import { StrongWave } from "./scenes/StrongWave";
import { WeakMan } from "./scenes/WeakMan";
import { Sound } from "./Sound";
import { EASE_SWEEP, mix, prog } from "./theme";
import { TIMELINE } from "./timing";

const within = (frame: number, w: { from: number; to: number }) => frame >= w.from && frame < w.to;

/** The gold line sweeps up from the bottom like a scanner; the next scene is revealed beneath it. */
const Scanner: React.FC<{ lineY: number }> = ({ lineY }) => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <div
      style={{
        position: "absolute",
        left: 0,
        width: WIDTH,
        top: lineY,
        height: 220,
        background: "linear-gradient(180deg, rgba(212,175,90,0.22) 0%, rgba(212,175,90,0) 100%)",
      }}
    />
    <GoldLine y={lineY} width={WIDTH + 40} glow={2.2} thickness={5} />
  </AbsoluteFill>
);

export const HabitReel: React.FC = () => {
  const frame = useCurrentFrame();
  const sc = TIMELINE.scanner;
  const scanning = within(frame, sc);
  const lineY = mix(HEIGHT + 30, -30, prog(frame, sc.from, sc.to - sc.from, EASE_SWEEP));

  return (
    <AbsoluteFill style={{ backgroundColor: "#0A0A0B" }}>
      {within(frame, TIMELINE.hook) ? <Hook /> : null}
      {within(frame, TIMELINE.weak) ? <WeakMan /> : null}
      {within(frame, TIMELINE.wave) ? (
        <AbsoluteFill style={scanning ? { clipPath: `inset(${Math.max(0, lineY)}px 0 0 0)` } : undefined}>
          <StrongWave />
        </AbsoluteFill>
      ) : null}
      {scanning ? <Scanner lineY={lineY} /> : null}
      {within(frame, TIMELINE.actions) ? <StrongActions /> : null}
      {frame >= TIMELINE.rule.from ? <Rule /> : null}
      <Vignette />
      <Grain opacity={0.05} />
      {within(frame, TIMELINE.black) ? <Black /> : null}
      <Sound />
    </AbsoluteFill>
  );
};
