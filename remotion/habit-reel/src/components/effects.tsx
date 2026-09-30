import type { ReactNode } from "react";
import { AbsoluteFill, interpolate, random } from "remotion";
import { HEIGHT } from "../scenes";
import { EASE_OUT } from "../theme";

/**
 * Shatter exit: renders `children` once per horizontal band and slides the
 * bands out left/right. At progress 0 it is a plain passthrough.
 */
export const Slices: React.FC<{
  progress: number;
  top: number;
  bottom: number;
  bands?: number;
  distance?: number;
  seed?: string;
  children: ReactNode;
}> = ({ progress, top, bottom, bands = 10, distance = 1300, seed = "slice", children }) => {
  if (progress <= 0) return <AbsoluteFill>{children}</AbsoluteFill>;
  const h = (bottom - top) / bands;
  const spread = 0.3;
  return (
    <AbsoluteFill>
      {Array.from({ length: bands }, (_, i) => {
        const bandTop = top + i * h;
        const delay = random(`${seed}${i}`) * spread;
        const p = interpolate(progress, [delay, delay + (1 - spread)], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: EASE_OUT,
        });
        const dir = i % 2 === 0 ? -1 : 1;
        return (
          <AbsoluteFill
            key={i}
            style={{
              clipPath: `inset(${bandTop - 0.5}px 0 ${HEIGHT - bandTop - h - 0.5}px 0)`,
              transform: `translateX(${dir * p * distance}px) skewX(${dir * p * -12}deg)`,
              opacity: 1 - p * 0.4,
            }}
          >
            {children}
          </AbsoluteFill>
        );
      })}
    </AbsoluteFill>
  );
};

/** Deterministic camera shake that lasts `frames` frames after each hit. */
export const shakeAt = (
  frame: number,
  hits: number[],
  amplitude = 14,
  frames = 3,
): { x: number; y: number; r: number } => {
  for (const hit of hits) {
    const t = frame - hit;
    if (t >= 0 && t < frames) {
      const decay = 1 - t / frames;
      return {
        x: (random(`sx${hit}${t}`) - 0.5) * 2 * amplitude * decay,
        y: (random(`sy${hit}${t}`) - 0.5) * 2 * amplitude * decay,
        r: (random(`sr${hit}${t}`) - 0.5) * 1.2 * decay,
      };
    }
  }
  return { x: 0, y: 0, r: 0 };
};
