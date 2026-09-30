import { CameraMotionBlur } from "@remotion/motion-blur";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Slices, shakeAt } from "../components/effects";
import { GoldLine, Row, Stage } from "../components/primitives";
import { COLORS } from "../scenes";
import { EASE_CALM, EASE_IN, headline, mix, prog, wordColor } from "../theme";
import { part, TIMELINE, type Word } from "../timing";

const SLAM_FRAMES = 7;
export const hookSlamHits = () => part("hookA").words.map((w) => w.in + 3);

/** "THE" and "HABIT" each slam in at their spoken frame: scale 1.4 → 1.0. */
const SlamWord: React.FC<{ w: Word }> = ({ w }) => {
  const frame = useCurrentFrame();
  const p = prog(frame, w.in, SLAM_FRAMES, EASE_IN);
  const visible = frame >= w.in;
  return (
    <span
      style={{
        ...headline(180, wordColor(w.gold)),
        display: "inline-block",
        opacity: visible ? Math.min(1, p * 4) : 0,
        transform: `scale(${mix(1.4, 1, p)})`,
        textShadow: w.gold ? "0 0 30px rgba(212,175,90,0.35)" : "none",
      }}
    >
      {w.display}
    </span>
  );
};

const SlamRow: React.FC = () => {
  const A = part("hookA");
  return (
    <Row y={790} gap={34}>
      {A.words.map((w) => (
        <SlamWord key={w.index} w={w} />
      ))}
    </Row>
  );
};

/** "NO MAN" slides up out of a mask. */
const MaskRow: React.FC = () => {
  const frame = useCurrentFrame();
  const B = part("hookB");
  return (
    <Row y={1010} gap={30}>
      {B.words.map((w) => {
        const p = prog(frame, w.in, 11, EASE_IN);
        return (
          <span key={w.index} style={{ display: "inline-block", overflow: "hidden", padding: "0 4px" }}>
            <span
              style={{
                ...headline(150, wordColor(w.gold)),
                display: "inline-block",
                transform: `translateY(${mix(115, 0, p)}%)`,
              }}
            >
              {w.display}
            </span>
          </span>
        );
      })}
    </Row>
  );
};

/** "TALKS ABOUT." types in letter by letter across each word's spoken duration. */
const TypedRow: React.FC = () => {
  const frame = useCurrentFrame();
  const C = part("hookC");
  const typingDone = C.last.in + Math.max(6, (C.last.out - C.last.at) * 0.85);
  const caretOn =
    frame >= C.first.in &&
    (frame < typingDone + 4 || Math.floor((frame - typingDone) / 8) % 2 === 0);

  let active = -1;
  C.words.forEach((w, i) => {
    if (frame >= w.in) active = i;
  });
  return (
    <Row y={1165} gap={30}>
      {C.words.map((w, wi) => {
        const letters = [...w.display];
        const dur = Math.max(6, (w.out - w.at) * 0.85);
        const shown =
          frame < w.in ? 0 : Math.min(letters.length, Math.floor(((frame - w.in) / dur) * letters.length) + 1);
        const isTyping = wi === active;
        return (
          <span key={w.index} style={{ ...headline(150, wordColor(w.gold)), display: "inline-block" }}>
            {letters.map((ch, i) => (
              <span key={i} style={{ visibility: i < shown ? "visible" : "hidden" }}>
                {ch}
                {isTyping && caretOn && i === shown - 1 ? <Caret /> : null}
              </span>
            ))}
          </span>
        );
      })}
    </Row>
  );
};

const Caret: React.FC = () => (
  <span style={{ position: "relative", display: "inline-block", width: 0, height: "1em", verticalAlign: "top" }}>
    <span
      style={{
        position: "absolute",
        left: 8,
        top: "0.07em",
        width: 10,
        height: "0.86em",
        backgroundColor: COLORS.gold,
        boxShadow: "0 0 16px rgba(212,175,90,0.6)",
      }}
    />
  </span>
);

/**
 * Frame 0 already carries a gold line slicing diagonally across the screen;
 * it settles into the divider under "THE HABIT".
 */
const OpeningLine: React.FC = () => {
  const frame = useCurrentFrame();
  const settle = prog(frame, 0, 16, EASE_IN);
  const head = prog(frame, 0, 14, EASE_IN);
  const lineY = mix(930, 905, settle);
  const angle = mix(-16, 0, settle);
  const cx = mix(420, 540, settle);
  const hx = mix(-80, 1160, head);
  const hy = lineY + (hx - cx) * Math.tan((angle * Math.PI) / 180);
  return (
    <>
      <GoldLine
        y={lineY}
        width={mix(1700, 620, settle)}
        angle={angle}
        x={cx}
        glow={mix(2.2, 1, settle)}
      />
      {/* travelling light head along the slice */}
      <div
        style={{
          position: "absolute",
          left: hx - 90,
          top: hy - 90,
          width: 180,
          height: 180,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(255,240,200,0.9) 0%, rgba(212,175,90,0.35) 30%, rgba(212,175,90,0) 70%)",
          opacity: 1 - head,
        }}
      />
    </>
  );
};

export const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { to, exitFrom } = TIMELINE.hook;
  const A = part("hookA");
  // linear driver: Slices applies the exit easing per band
  const exit = Math.min(1, Math.max(0, (frame - exitFrom) / (to - 1 - exitFrom)));
  const shake = shakeAt(frame, hookSlamHits(), 16, 3);
  const drift = mix(1, 1.045, prog(frame, 0, to, EASE_CALM));
  const blurActive = A.words.some((w) => frame >= w.in - 1 && frame <= w.in + SLAM_FRAMES + 1);

  const content = (
    <AbsoluteFill>
      <OpeningLine />
      {blurActive ? (
        <CameraMotionBlur shutterAngle={200} samples={8}>
          <SlamRow />
        </CameraMotionBlur>
      ) : (
        <SlamRow />
      )}
      <MaskRow />
      <TypedRow />
    </AbsoluteFill>
  );

  return (
    <Stage>
      <AbsoluteFill
        style={{
          transform: `translate(${shake.x}px, ${shake.y}px) rotate(${shake.r}deg) scale(${drift})`,
        }}
      >
        <Slices progress={exit} top={640} bottom={1280} bands={10} seed="hook">
          {content}
        </Slices>
      </AbsoluteFill>
    </Stage>
  );
};
