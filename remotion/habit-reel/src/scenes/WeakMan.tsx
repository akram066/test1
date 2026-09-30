import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Row, Stage } from "../components/primitives";
import { COLORS, TRANSITIONS } from "../scenes";
import { EASE_CALM, EASE_IN, EASE_OUT, headline, label, mix, prog } from "../theme";
import { part, TIMELINE, type Word } from "../timing";

const FLICKER = [0, 0.9, 0.1, 0.1, 1, 0.3, 0.85, 0.15, 1];

/** Label words flicker on like a failing tube. */
const FlickerWord: React.FC<{ w: Word; color: string }> = ({ w, color }) => {
  const frame = useCurrentFrame();
  const t = frame - w.in;
  const opacity = t < 0 ? 0 : t >= FLICKER.length ? 1 : FLICKER[t];
  return <span style={{ ...label(46, color), opacity }}>{w.display}</span>;
};

const isConnector = (w: Word) => w.display.replace(/\W/g, "").length <= 2;

/** Small Inter word that fades up on its timestamp. */
const ConnectorWord: React.FC<{ w: Word; color?: string }> = ({ w, color = COLORS.gray }) => {
  const frame = useCurrentFrame();
  const p = prog(frame, w.in, 9, EASE_IN);
  return (
    <span
      style={{
        ...label(46, color, 500),
        letterSpacing: "0.2em",
        display: "inline-block",
        opacity: p,
        transform: `translateY(${mix(22, 0, p)}px)`,
      }}
    >
      {w.display}
    </span>
  );
};

/** Heavy headline word: settles from slight scale with a blur pull-focus. */
const HeavyWord: React.FC<{ w: Word; size: number; color?: string; frame?: number }> = ({
  w,
  size,
  color = COLORS.white,
  frame: frameOverride,
}) => {
  const current = useCurrentFrame();
  const frame = frameOverride ?? current;
  const p = prog(frame, w.in, 10, EASE_IN);
  return (
    <span
      style={{
        ...headline(size, color),
        display: "inline-block",
        opacity: Math.min(1, p * 2.5),
        transform: `translateY(${mix(40, 0, p)}px) scale(${mix(1.18, 1, p)})`,
        filter: `blur(${mix(12, 0, p)}px)`,
      }}
    >
      {w.display}
    </span>
  );
};

/** BORED. TIRED. ALONE. — each hits on its word with a short red underline flash. */
const StackWord: React.FC<{ w: Word }> = ({ w }) => {
  const frame = useCurrentFrame();
  const p = prog(frame, w.in, 8, EASE_IN);
  const draw = prog(frame, w.at, 4, EASE_IN);
  const flash = 1 - prog(frame, w.at + 5, 12, EASE_OUT);
  return (
    <span
      style={{
        ...headline(150, COLORS.gray),
        position: "relative",
        display: "inline-block",
        opacity: Math.min(1, p * 3),
        transform: `translateY(${mix(-50, 0, p)}px) scale(${mix(1.25, 1, p)})`,
      }}
    >
      {w.display}
      <span
        style={{
          position: "absolute",
          left: "4%",
          right: "4%",
          bottom: -16,
          height: 7,
          backgroundColor: COLORS.red,
          boxShadow: "0 0 18px rgba(139,30,30,0.9)",
          transform: `scaleX(${draw})`,
          transformOrigin: "0% 50%",
          opacity: frame >= w.at ? flash : 0,
        }}
      />
    </span>
  );
};

const STACK_Y = [930, 1085, 1195, 1305];

/** Circular arrow drawn around "REPEATS IT TOMORROW." */
const CycleArrow: React.FC<{ progress: number }> = ({ progress }) => {
  const cx = 540;
  const cy = 1185;
  const rx = 415;
  const ry = 250;
  const a0 = (-68 * Math.PI) / 180;
  const a1 = ((360 - 112) * Math.PI) / 180;
  const pts: string[] = [];
  const n = 140;
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    pts.push(`${(cx + rx * Math.cos(a)).toFixed(1)},${(cy + ry * Math.sin(a)).toFixed(1)}`);
  }
  // arrowhead at the end, pointing along the tangent
  const ex = cx + rx * Math.cos(a1);
  const ey = cy + ry * Math.sin(a1);
  const tx = -rx * Math.sin(a1);
  const ty = ry * Math.cos(a1);
  const ang = (Math.atan2(ty, tx) * 180) / Math.PI;
  const headOn = prog(progress, 0.9, 0.1, EASE_IN);
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={COLORS.gray}
        strokeWidth={4}
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray="1 1"
        strokeDashoffset={1 - progress}
      />
      <g transform={`translate(${ex} ${ey}) rotate(${ang})`} opacity={headOn}>
        <path d="M 6 0 L -22 -15 L -22 15 Z" fill={COLORS.gray} />
      </g>
    </svg>
  );
};

export const WeakMan: React.FC = () => {
  const frame = useCurrentFrame();
  const { from, to } = TIMELINE.weak;
  const L = part("weakLabel");
  const G = part("givesIn");
  const E = part("everyTime");
  const S = part("stack");
  const TH = part("thenHe");
  const H = part("hates");
  const AN = part("and");
  const R = part("repeats");

  // GIVES IN moves up to make room for the stack.
  const up = prog(frame, E.first.in - 4, 16, EASE_IN);
  // Desaturate, then the whole stack sinks and blurs.
  // Both start early enough that sentence two never lands on top of sentence one,
  // but never before ALONE has hit and flashed.
  const desatFrom = Math.max(S.last.at + 4, Math.min(S.last.out + 2, TH.first.in - 6));
  const desat = prog(frame, desatFrom, 18, EASE_CALM);
  const sinkFrom = Math.max(S.last.at + 4, Math.min(desatFrom + 4, TH.first.in - 8));
  const sink = prog(frame, sinkFrom, 40, EASE_IN);
  const redGlow = frame >= G.first.at ? 1 - prog(frame, G.first.at, 26, EASE_OUT) : 0;

  // Sentence two: HATES HIMSELF lifts when AND arrives.
  const lift = prog(frame, AN.first.in - 2, 14, EASE_IN);

  // Rewind: after TOMORROW lands, the block rewinds 6 frames (at 2x) and plays again.
  const rs = R.last.in + TRANSITIONS.rewindAfter;
  const rw = TRANSITIONS.rewindFrames;
  const rwOut = Math.ceil(rw / 2);
  const fr = frame < rs ? frame : frame < rs + rwOut ? rs - (frame - rs) * 2 : frame - rwOut * 2;
  const rewinding = frame >= rs && frame < rs + rwOut;
  const replaying = frame >= rs + rwOut && frame < rs + rwOut + rw;
  const jitter = rewinding ? (frame % 2 === 0 ? -1 : 1) * 10 : 0;
  const ghost = rewinding ? 1 : replaying ? 1 - prog(frame, rs + rwOut, rw, EASE_OUT) : 0;
  const blockScale = mix(0.93, 1, prog(fr, R.first.in, R.last.in + 8 - R.first.in, EASE_IN));
  const arrow = prog(frame, rs - 2, 22, EASE_IN);

  const drift = mix(1, 1.04, prog(frame, from, to - from, EASE_CALM));

  const repeatsBlock = (color?: string) =>
    R.lines.map((line, li) => (
      <Row key={li} y={1110 + li * 150} gap={30}>
        {line.map((w) => (
          <HeavyWord key={w.index} w={w} size={150} frame={fr} color={color} />
        ))}
      </Row>
    ));

  return (
    <Stage>
      <AbsoluteFill style={{ transform: `scale(${drift})` }}>
        {/* Sentence one — desaturates, sinks and blurs */}
        <AbsoluteFill style={{ filter: `grayscale(${desat}) brightness(${1 - 0.3 * desat})` }}>
          <AbsoluteFill
            style={{
              background: `radial-gradient(ellipse 60% 30% at 50% ${mix(50, 32, up)}%, rgba(139,30,30,${0.42 * redGlow}) 0%, rgba(139,30,30,0) 70%)`,
            }}
          />
          <Row y={330} gap={26}>
            {L.words.map((w) => (
              <FlickerWord key={w.index} w={w} color={COLORS.gray} />
            ))}
          </Row>
          <AbsoluteFill
            style={{
              transform: `translateY(${260 * sink}px)`,
              filter: `blur(${16 * sink}px)`,
              opacity: 1 - 0.94 * sink,
            }}
          >
            <Row y={mix(960, 610, up)} gap={36} style={{ transform: `translateY(-50%) scale(${mix(1, 0.8, up)})` }}>
              {G.words.map((w) => (
                <HeavyWord key={w.index} w={w} size={185} />
              ))}
            </Row>
            <Row y={790} gap={22}>
              {E.words.map((w) => (
                <ConnectorWord key={w.index} w={w} />
              ))}
            </Row>
            {S.lines.map((line, li) => (
              <Row key={li} y={STACK_Y[li] ?? 930 + li * 150} gap={30}>
                {line.map((w) =>
                  isConnector(w) ? <ConnectorWord key={w.index} w={w} /> : <StackWord key={w.index} w={w} />,
                )}
              </Row>
            ))}
          </AbsoluteFill>
        </AbsoluteFill>

        {/* Sentence two */}
        <AbsoluteFill
          style={{
            transform: `translateY(${-130 * lift}px)`,
            opacity: 1 - 0.62 * lift,
          }}
        >
          <Row y={560} gap={22}>
            {TH.words.map((w) => (
              <ConnectorWord key={w.index} w={w} color={COLORS.white} />
            ))}
          </Row>
          {H.lines.map((line, li) => (
            <Row key={li} y={705 + li * 160} gap={30}>
              {line.map((w) => (
                <HeavyWord key={w.index} w={w} size={165} />
              ))}
            </Row>
          ))}
        </AbsoluteFill>
        <Row y={930} gap={22}>
          {AN.words.map((w) => (
            <ConnectorWord key={w.index} w={w} color={COLORS.white} />
          ))}
        </Row>
        <AbsoluteFill style={{ transform: `scale(${blockScale})`, transformOrigin: "50% 1185px" }}>
          {ghost > 0 ? (
            <>
              <AbsoluteFill style={{ transform: `translateX(${-14 - jitter}px)`, opacity: 0.55 * ghost, mixBlendMode: "screen" }}>
                {repeatsBlock(COLORS.red)}
              </AbsoluteFill>
              <AbsoluteFill style={{ transform: `translateX(${14 + jitter}px)`, opacity: 0.45 * ghost, mixBlendMode: "screen" }}>
                {repeatsBlock(COLORS.gray)}
              </AbsoluteFill>
            </>
          ) : null}
          <AbsoluteFill style={{ transform: `translateX(${jitter * 0.4}px)` }}>{repeatsBlock()}</AbsoluteFill>
        </AbsoluteFill>
        {frame >= rs - 2 ? <CycleArrow progress={arrow} /> : null}
      </AbsoluteFill>
    </Stage>
  );
};

export const weakRewindFrame = () => part("repeats").last.in + TRANSITIONS.rewindAfter;
export const weakImpactFrames = () =>
  part("stack")
    .words.filter((w) => !isConnector(w))
    .map((w) => w.at);
