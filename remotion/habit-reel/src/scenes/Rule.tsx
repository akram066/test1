import { AbsoluteFill, useCurrentFrame } from "remotion";
import { GoldLine, Row, Stage } from "../components/primitives";
import { BRAND_LINE, COLORS, SAFE, WIDTH } from "../scenes";
import { EASE_CALM, EASE_IN, headline, label, mix, prog, wordColor } from "../theme";
import { DURATION_IN_FRAMES, part, TIMELINE, type Word } from "../timing";

/** Word revealed by a left-to-right mask wipe on its timestamp. */
const WipeWord: React.FC<{ w: Word; color: string }> = ({ w, color }) => {
  const frame = useCurrentFrame();
  const p = prog(frame, w.in, 9, EASE_IN);
  return (
    <span
      style={{
        display: "inline-block",
        clipPath: `inset(-10% ${(1 - p) * 100}% -10% -2%)`,
        transform: `translateX(${mix(-26, 0, p)}px)`,
      }}
    >
      <span style={{ ...headline(150, color), display: "inline-block" }}>{w.display}</span>
    </span>
  );
};

export const Rule: React.FC = () => {
  const frame = useCurrentFrame();
  const { from } = TIMELINE.rule;
  const R1 = part("rule1");
  const R2 = part("rule2");
  const CTA = part("cta");

  const line = prog(frame, from, 14, EASE_IN);
  const breathFrom = R2.last.in + 10;
  const breath = mix(1, 1.02, prog(frame, breathFrom, Math.max(1, DURATION_IN_FRAMES - 1 - breathFrom), EASE_CALM));
  const brand = prog(frame, CTA.last.out + 4, 18, EASE_CALM);

  return (
    <Stage>
      <AbsoluteFill style={{ transform: `scale(${breath})` }}>
        <GoldLine y={960} width={WIDTH - SAFE.side * 2} progress={line} glow={1.3} />
        {R1.lines.map((ln, li) => (
          <Row key={li} y={855 - (R1.lines.length - 1 - li) * 160} gap={30}>
            {ln.map((w) => (
              <WipeWord key={w.index} w={w} color={wordColor(w.gold)} />
            ))}
          </Row>
        ))}
        {R2.lines.map((ln, li) => (
          <Row key={li} y={1070 + li * 160} gap={30}>
            {ln.map((w) => (
              <WipeWord key={w.index} w={w} color={COLORS.gold} />
            ))}
          </Row>
        ))}
      </AbsoluteFill>
      <Row y={1490} gap={18}>
        {CTA.words.map((w) => {
          const p = prog(frame, w.in, 10, EASE_IN);
          return (
            <span
              key={w.index}
              style={{
                ...label(44, "rgba(245,245,240,0.9)", 500),
                letterSpacing: "0.22em",
                display: "inline-block",
                opacity: p,
                transform: `translateY(${mix(16, 0, p)}px)`,
              }}
            >
              {w.display.replace(/\./g, "")}
            </span>
          );
        })}
      </Row>
      <Row y={1568} style={{ opacity: brand, transform: `translateY(calc(-50% + ${mix(12, 0, brand)}px))` }}>
        <span style={{ ...label(36, COLORS.gold, 700), letterSpacing: "0.42em" }}>{BRAND_LINE}</span>
      </Row>
    </Stage>
  );
};
