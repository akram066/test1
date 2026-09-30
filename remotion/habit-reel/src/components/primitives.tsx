import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import { COLORS, HEIGHT, WIDTH } from "../scenes";
import { goldGlow } from "../theme";

/** Full-frame scene surface with the brand background colour. */
export const Stage: React.FC<{ children: ReactNode; style?: CSSProperties }> = ({
  children,
  style,
}) => (
  <AbsoluteFill style={{ backgroundColor: COLORS.bg, overflow: "hidden", ...style }}>
    {children}
  </AbsoluteFill>
);

/** A horizontally centred row whose vertical centre sits at `y`. */
export const Row: React.FC<{
  y: number;
  children: ReactNode;
  gap?: number;
  style?: CSSProperties;
}> = ({ y, children, gap = 28, style }) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      width: WIDTH,
      top: y,
      transform: "translateY(-50%)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      gap,
      ...style,
    }}
  >
    {children}
  </div>
);

/** Slowly drifting radial vignette plus a faint warm light, so the canvas never sits still. */
export const Vignette: React.FC = () => {
  const frame = useCurrentFrame();
  const x = 50 + Math.sin(frame / 97) * 7;
  const y = 46 + Math.cos(frame / 131) * 6;
  const glow = 0.05 + (Math.sin(frame / 70) * 0.5 + 0.5) * 0.025;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 70% 45% at ${x}% ${y}%, rgba(212,175,90,${glow}) 0%, rgba(212,175,90,0) 70%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 85% 62% at ${100 - x}% ${y + 4}%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.78) 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};

const GRAIN_TILE = `url("data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='256' height='256'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>`,
).replace(/%2523/g, "%23")}")`;

/** Film grain: a noise tile jumping to a new random offset every frame. */
export const Grain: React.FC<{ opacity?: number }> = ({ opacity = 0.05 }) => {
  const frame = useCurrentFrame();
  const ox = Math.floor(random(`gx${frame}`) * 256);
  const oy = Math.floor(random(`gy${frame}`) * 256);
  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        backgroundImage: GRAIN_TILE,
        backgroundSize: "256px 256px",
        backgroundPosition: `${ox}px ${oy}px`,
        opacity,
        mixBlendMode: "screen",
      }}
    />
  );
};

/**
 * The brand element: a 4 px gold line with a soft glow.
 * `progress` draws it from `origin` ("center" grows both ways, "left" grows right).
 */
export const GoldLine: React.FC<{
  x?: number;
  y: number;
  width: number;
  progress?: number;
  origin?: "center" | "left" | "right";
  angle?: number;
  opacity?: number;
  glow?: number;
  thickness?: number;
}> = ({
  x = WIDTH / 2,
  y,
  width,
  progress = 1,
  origin = "center",
  angle = 0,
  opacity = 1,
  glow = 1,
  thickness = 4,
}) => {
  const originX = origin === "center" ? "50%" : origin === "left" ? "0%" : "100%";
  return (
    <div
      style={{
        position: "absolute",
        left: x - width / 2,
        top: y - thickness / 2,
        width,
        height: thickness,
        transform: `rotate(${angle}deg)`,
        transformOrigin: "50% 50%",
        opacity,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: thickness,
          background: `linear-gradient(90deg, rgba(212,175,90,0) 0%, ${COLORS.gold} 12%, #F1D58C 50%, ${COLORS.gold} 88%, rgba(212,175,90,0) 100%)`,
          boxShadow: goldGlow(glow),
          transform: `scaleX(${progress})`,
          transformOrigin: `${originX} 50%`,
        }}
      />
    </div>
  );
};

/** Pure black overlay (above grain) for hard cuts. */
export const Black: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000", width: WIDTH, height: HEIGHT }} />
);

