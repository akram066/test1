import { useLayoutEffect, useRef, useState } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Row, Stage } from "../components/primitives";
import { COLORS, HEIGHT, WIDTH } from "../scenes";
import { EASE_CALM, EASE_IN, EASE_OUT, headline, label, mix, prog, wordColor } from "../theme";
import { part, TIMELINE, type Word } from "../timing";

const LABEL_Y = 330;
const LABEL_SIZE = 46;
const LABEL_SPACING = 0.3; // em

/** Renders the label, splitting out the first "O" so the camera can dive into it. */
const LabelText: React.FC<{
  words: Word[];
  frame: number;
  oRef?: React.Ref<HTMLSpanElement>;
  shine?: number;
  glow?: boolean;
}> = ({ words, frame, oRef, shine, glow = true }) => {
  let oFound = false;
  return (
    <Row y={LABEL_Y} gap={24}>
      {words.map((w) => {
        const p = prog(frame, w.in, 10, EASE_IN);
        const style: React.CSSProperties = {
          ...label(LABEL_SIZE, COLORS.gold),
          display: "inline-block",
          opacity: shine === undefined ? p : 1,
          transform: `translateY(${mix(16, 0, p)}px)`,
          textShadow: shine === undefined && glow ? "0 0 22px rgba(212,175,90,0.45)" : "none",
        };
        const oIndex = oFound ? -1 : w.display.indexOf("O");
        if (oIndex >= 0) oFound = true;
        const content =
          oIndex >= 0 ? (
            <>
              {w.display.slice(0, oIndex)}
              <span ref={oRef}>O</span>
              {w.display.slice(oIndex + 1)}
            </>
          ) : (
            w.display
          );
        return (
          <span key={w.index} style={style}>
            {content}
          </span>
        );
      })}
    </Row>
  );
};

/** Gold sine wave: the brand line, bent. */
const WaveLine: React.FC<{ y0: number; amp: number; phase: number; draw: number }> = ({
  y0,
  amp,
  phase,
  draw,
}) => {
  const lambda = 420;
  const pts: string[] = [];
  for (let x = -20; x <= WIDTH + 20; x += 8) {
    pts.push(`${x},${(y0 + amp * Math.sin((2 * Math.PI * x) / lambda + phase)).toFixed(2)}`);
  }
  return (
    <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <defs>
        <filter id="waveGlow" x="-10%" y="-50%" width="120%" height="200%">
          <feGaussianBlur stdDeviation="7" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={COLORS.gold}
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray="1 1"
        strokeDashoffset={1 - draw}
        filter="url(#waveGlow)"
      />
    </svg>
  );
};

const CalmWord: React.FC<{ w: Word; size: number; frame: number }> = ({ w, size, frame }) => {
  const p = prog(frame, w.in, 14, EASE_CALM);
  return (
    <span
      style={{
        ...headline(size, wordColor(w.gold)),
        display: "inline-block",
        opacity: p,
        transform: `translateY(${mix(30, 0, p)}px)`,
        filter: `blur(${mix(8, 0, p)}px)`,
        textShadow: w.gold ? "0 0 30px rgba(212,175,90,0.35)" : "none",
      }}
    >
      {w.display}
    </span>
  );
};

export const StrongWave: React.FC = () => {
  const frame = useCurrentFrame();
  const { from, to, zoomFrom } = TIMELINE.wave;
  const SL = part("strongLabel");
  const K = part("knows");
  const U = part("urge");
  const RI = part("rises");
  const PA = part("passes");

  // --- measure the "O" in the label (untransformed copy) ---
  const rootRef = useRef<HTMLDivElement>(null);
  const oRef = useRef<HTMLSpanElement>(null);
  const [o, setO] = useState<{ x: number; y: number }>({ x: WIDTH / 2, y: LABEL_Y });
  useLayoutEffect(() => {
    const root = rootRef.current;
    const el = oRef.current;
    if (!root || !el) return;
    const rr = root.getBoundingClientRect();
    const scale = rr.width / WIDTH || 1;
    const r = el.getBoundingClientRect();
    const spacing = LABEL_SIZE * LABEL_SPACING * scale;
    const x = (r.left - rr.left + (r.width - spacing) / 2) / scale;
    const y = (r.top - rr.top + r.height / 2) / scale;
    if (Math.abs(x - o.x) > 0.25 || Math.abs(y - o.y) > 0.25) setO({ x, y });
  }, [frame, o.x, o.y]);

  // --- wave state ---
  const waveWord = U.words.find((w) => w.gold) ?? U.last;
  const draw = prog(frame, waveWord.in - 4, 22, EASE_IN);
  const rise = prog(frame, RI.first.in, 36, EASE_CALM);
  const flatten = prog(frame, PA.last.out - 4, 22, EASE_CALM);
  const amp = (16 + 48 * rise) * (1 - flatten);
  const y0 = 1015 - 150 * rise + 40 * flatten;
  const phase = frame * 0.085;
  const bob = 16 * Math.sin((2 * Math.PI * 700) / 420 + phase) * (1 - rise);

  const ridesY = 1175 - 150 * rise;
  const risesOut = prog(frame, PA.first.in - 2, 8, EASE_OUT);

  // --- camera ---
  const drift = mix(1, 1.035, prog(frame, from, to - from, EASE_CALM));
  const dx = WIDTH / 2 + drift * (o.x - WIDTH / 2);
  const dy = HEIGHT / 2 + drift * (o.y - HEIGHT / 2);
  const z = prog(frame, zoomFrom, to - 1 - zoomFrom, EASE_OUT);
  const zoomScale = Math.exp(mix(0, Math.log(150), z));
  const tx = (WIDTH / 2 - dx) * z;
  const ty = (HEIGHT / 2 - dy) * z;

  const shine = prog(frame, SL.last.in + 6, 24, EASE_CALM);

  return (
    <Stage>
      <div ref={rootRef} style={{ position: "absolute", inset: 0 }}>
        {/* invisible, untransformed copy used only to locate the O */}
        <div style={{ visibility: "hidden" }}>
          <LabelText words={SL.words} frame={Number.MAX_SAFE_INTEGER} oRef={oRef} />
        </div>
        <AbsoluteFill
          style={{
            transformOrigin: `${dx}px ${dy}px`,
            transform: `translate(${tx}px, ${ty}px) scale(${zoomScale})`,
          }}
        >
          <AbsoluteFill style={{ transform: `scale(${drift})` }}>
            <LabelText words={SL.words} frame={frame} glow={z < 0.02} />
            {/* light sweep across the gold label */}
            {shine > 0 && shine < 1 ? (
              <AbsoluteFill
                style={{
                  WebkitMaskImage: `linear-gradient(105deg, transparent ${mix(-30, 100, shine)}%, black ${mix(-20, 110, shine)}%, transparent ${mix(-10, 120, shine)}%)`,
                  maskImage: `linear-gradient(105deg, transparent ${mix(-30, 100, shine)}%, black ${mix(-20, 110, shine)}%, transparent ${mix(-10, 120, shine)}%)`,
                }}
              >
                <div style={{ filter: "brightness(2.4) saturate(0.5)" }}>
                  <LabelText words={SL.words} frame={frame} shine={shine} />
                </div>
              </AbsoluteFill>
            ) : null}
            <Row y={405} gap={20}>
              {K.words.map((w) => {
                const p = prog(frame, w.in, 10, EASE_IN);
                return (
                  <span
                    key={w.index}
                    style={{
                      ...label(40, "rgba(245,245,240,0.72)", 500),
                      letterSpacing: "0.24em",
                      display: "inline-block",
                      opacity: p,
                      transform: `translateY(${mix(14, 0, p)}px)`,
                    }}
                  >
                    {w.display}
                  </span>
                );
              })}
            </Row>

            {/* AN URGE IS / A WAVE. */}
            <AbsoluteFill
              style={{
                transform: `translateY(${-210 * rise}px) scale(${mix(1, 0.86, rise)})`,
                opacity: (1 - 0.78 * rise) * (1 - flatten),
              }}
            >
              {U.lines.map((line, li) => (
                <Row key={li} y={740 + li * 165} gap={32}>
                  {line.map((w) => (
                    <span
                      key={w.index}
                      style={{ display: "inline-block", transform: w.gold ? `translateY(${bob}px)` : undefined }}
                    >
                      <CalmWord w={w} size={165} frame={frame} />
                    </span>
                  ))}
                </Row>
              ))}
            </AbsoluteFill>

            <WaveLine y0={y0} amp={amp} phase={phase} draw={draw} />

            {/* IT RISES. rides up with the wave */}
            <Row y={ridesY} gap={30} style={{ transform: "translateY(-50%)", opacity: 1 - risesOut }}>
              {RI.words.map((w) => (
                <CalmWord key={w.index} w={w} size={150} frame={frame} />
              ))}
            </Row>
            {/* IT PASSES. fades as the wave flattens */}
            <Row
              y={ridesY}
              gap={30}
              style={{
                transform: `translateY(calc(-50% + ${40 * flatten}px))`,
                opacity: 1 - flatten,
                filter: `blur(${8 * flatten}px)`,
              }}
            >
              {PA.words.map((w) => (
                <CalmWord key={w.index} w={w} size={150} frame={frame} />
              ))}
            </Row>
          </AbsoluteFill>
        </AbsoluteFill>
      </div>
    </Stage>
  );
};
