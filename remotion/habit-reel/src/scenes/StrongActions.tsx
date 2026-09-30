import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { GoldLine, Row, Stage } from "../components/primitives";
import { COLORS, TRANSITIONS } from "../scenes";
import { EASE_CALM, EASE_IN, headline, mix, prog, wordColor } from "../theme";
import { part, TIMELINE, type PartTiming, type Word } from "../timing";

const PHRASES = ["stands", "leaves", "moves", "phone"] as const;

/** Frame each action phrase cuts in (and the previous one cuts out). */
export const actionCuts = () =>
  PHRASES.map((id, i) =>
    i === 0 ? TIMELINE.actions.from : part(id).first.at - TRANSITIONS.actionsCutLead,
  );

/** Word rising out of a mask below its baseline. */
const RiseWord: React.FC<{ w: Word; size: number; dur?: number }> = ({ w, size, dur = 10 }) => {
  const frame = useCurrentFrame();
  const p = prog(frame, w.in, dur, EASE_IN);
  return (
    <span style={{ display: "inline-block", overflow: "hidden", padding: "0 6px" }}>
      <span
        style={{
          ...headline(size, wordColor(w.gold)),
          display: "inline-block",
          transform: `translateY(${mix(112, 0, p)}%)`,
          textShadow: w.gold ? "0 0 34px rgba(212,175,90,0.4)" : "none",
        }}
      >
        {w.display}
      </span>
    </span>
  );
};

const Stands: React.FC<{ P: PartTiming }> = ({ P }) => {
  const frame = useCurrentFrame();
  const lineP = prog(frame, P.last.at + 2, 12, EASE_IN);
  return (
    <>
      {P.lines.map((line, li) => (
        <Row key={li} y={765 + li * 195} gap={34}>
          {line.map((w) => (
            <RiseWord key={w.index} w={w} size={190} />
          ))}
        </Row>
      ))}
      <GoldLine y={765 + P.lines.length * 195 - 70} width={300} progress={lineP} />
    </>
  );
};

const DOOR = { x: 320, y: 560, w: 440, h: 780 };

const Leaves: React.FC<{ P: PartTiming; cut: number }> = ({ P, cut }) => {
  const frame = useCurrentFrame();
  const outline = prog(frame, cut, 10, EASE_IN);
  const open = prog(frame, P.first.in, 14, EASE_IN);
  return (
    <>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <rect
          x={DOOR.x}
          y={DOOR.y}
          width={DOOR.w}
          height={DOOR.h}
          fill="none"
          stroke={COLORS.gold}
          strokeWidth={4}
          pathLength={1}
          strokeDasharray="1 1"
          strokeDashoffset={1 - outline}
          opacity={0.9}
        />
      </svg>
      {/* door panel swinging open on its left hinge */}
      <div style={{ position: "absolute", left: DOOR.x + 6, top: DOOR.y + 6, width: DOOR.w - 12, height: DOOR.h - 12, perspective: 1400 }}>
        <div
          style={{
            width: "100%",
            height: "100%",
            transformOrigin: "0% 50%",
            transform: `rotateY(${mix(0, -84, open)}deg)`,
            background: "linear-gradient(90deg, #17171A 0%, #111113 100%)",
            border: "2px solid rgba(212,175,90,0.35)",
            boxSizing: "border-box",
            opacity: outline * (1 - 0.6 * open),
          }}
        >
          <div
            style={{
              position: "absolute",
              right: 34,
              top: "52%",
              width: 16,
              height: 16,
              borderRadius: 8,
              backgroundColor: COLORS.gold,
            }}
          />
        </div>
      </div>
      {P.lines.map((line, li) => (
        <Row key={li} y={860 + li * 200} gap={32}>
          {line.map((w, wi) => {
            const p = prog(frame, w.in, 12, EASE_IN);
            const dir = line.length === 1 ? 0 : wi === 0 ? 1 : -1;
            return (
              <span
                key={w.index}
                style={{
                  ...headline(160, wordColor(w.gold)),
                  display: "inline-block",
                  opacity: Math.min(1, p * 2.2),
                  transform: `translateX(${mix(dir * 170, 0, p)}px) scale(${mix(0.55, 1, p)})`,
                  filter: `blur(${mix(10, 0, p)}px)`,
                  textShadow: "0 6px 30px rgba(0,0,0,0.8)",
                }}
              >
                {w.display}
              </span>
            );
          })}
        </Row>
      ))}
    </>
  );
};

const Moves: React.FC<{ P: PartTiming }> = ({ P }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <>
      {P.lines.map((line, li) => (
        <Row key={li} y={860 + li * 200} gap={32}>
          {line.map((w) => {
            const s = spring({ frame: frame - w.in, fps, config: { damping: 9, stiffness: 260, mass: 0.7 } });
            return (
              <span
                key={w.index}
                style={{
                  ...headline(170, wordColor(w.gold)),
                  display: "inline-block",
                  opacity: frame >= w.in ? Math.min(1, s * 3) : 0,
                  transform: `translateY(${(1 - s) * -260}px) scale(${Math.max(0, s)})`,
                }}
              >
                {w.display}
              </span>
            );
          })}
        </Row>
      ))}
    </>
  );
};

const FRAME_BOX = { x: 220, y: 360, w: 280, h: 460 };

const PhoneIcon: React.FC = () => (
  <svg width={170} height={300} viewBox="0 0 170 300" style={{ overflow: "visible" }}>
    <rect x={5} y={5} width={160} height={290} rx={30} fill="none" stroke={COLORS.gold} strokeWidth={6} />
    <rect x={62} y={22} width={46} height={10} rx={5} fill={COLORS.gold} />
    <line x1={60} y1={272} x2={110} y2={272} stroke={COLORS.gold} strokeWidth={6} strokeLinecap="round" />
  </svg>
);

const Phone: React.FC<{ P: PartTiming; cut: number }> = ({ P, cut }) => {
  const frame = useCurrentFrame();
  const outline = prog(frame, cut, 10, EASE_IN);
  const slide = prog(frame, P.first.in, 22, EASE_IN);
  const startX = FRAME_BOX.x + FRAME_BOX.w / 2;
  const endX = 745;
  const cx = mix(startX, endX, slide);
  const cy = FRAME_BOX.y + FRAME_BOX.h / 2;
  return (
    <>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <rect
          x={FRAME_BOX.x}
          y={FRAME_BOX.y}
          width={FRAME_BOX.w}
          height={FRAME_BOX.h}
          fill="rgba(255,255,255,0.02)"
          stroke="rgba(245,245,240,0.75)"
          strokeWidth={3}
          pathLength={1}
          strokeDasharray="1 1"
          strokeDashoffset={1 - outline}
        />
      </svg>
      {/* phone is only visible inside the frame or once it has left it */}
      <AbsoluteFill style={{ clipPath: `inset(0 0 0 ${FRAME_BOX.x + 3}px)` }}>
        <div
          style={{
            position: "absolute",
            left: cx - 85,
            top: cy - 150,
            opacity: outline,
            transform: `rotate(${mix(-6, 0, slide)}deg)`,
            filter: "drop-shadow(0 0 14px rgba(212,175,90,0.45))",
          }}
        >
          <PhoneIcon />
        </div>
      </AbsoluteFill>
      {P.lines.map((line, li) => (
        <Row key={li} y={1020 + li * 148} gap={28}>
          {line.map((w) => (
            <RiseWord key={w.index} w={w} size={135} dur={8} />
          ))}
        </Row>
      ))}
    </>
  );
};

export const StrongActions: React.FC = () => {
  const frame = useCurrentFrame();
  const cuts = actionCuts();
  const ends = [...cuts.slice(1), TIMELINE.actions.to];
  const active = cuts.findIndex((c, i) => frame >= c && frame < ends[i]);
  if (active < 0) return null;
  const P = part(PHRASES[active]);
  const drift = mix(1, 1.05, prog(frame, cuts[active], ends[active] - cuts[active], EASE_CALM));
  return (
    <Stage>
      <AbsoluteFill style={{ transform: `scale(${drift})` }}>
        {active === 0 ? <Stands P={P} /> : null}
        {active === 1 ? <Leaves P={P} cut={cuts[1]} /> : null}
        {active === 2 ? <Moves P={P} /> : null}
        {active === 3 ? <Phone P={P} cut={cuts[3]} /> : null}
      </AbsoluteFill>
    </Stage>
  );
};
