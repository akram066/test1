import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import type { CSSProperties } from "react";
import { Easing, interpolate } from "remotion";
import { COLORS } from "./scenes";

const anton = loadAnton("normal", { weights: ["400"], subsets: ["latin"] });
const inter = loadInter("normal", { weights: ["500", "700"], subsets: ["latin"] });

export const FONT_HEADLINE = anton.fontFamily;
export const FONT_LABEL = inter.fontFamily;

/** Entrances: fast out, long settle. */
export const EASE_IN = Easing.bezier(0.16, 1, 0.3, 1);
/** Exits: slow start, hard finish. */
export const EASE_OUT = Easing.bezier(0.7, 0, 0.84, 0);
/** Calm, symmetric drift for breathing / wave motion. */
export const EASE_CALM = Easing.bezier(0.45, 0, 0.55, 1);
/** Sweeps that cross the whole frame. */
export const EASE_SWEEP = Easing.bezier(0.65, 0, 0.35, 1);

/** Eased 0→1 progress between two frames (clamped). */
export const prog = (
  frame: number,
  from: number,
  duration: number,
  easing: (t: number) => number = EASE_IN,
) =>
  interpolate(frame, [from, from + Math.max(1, duration)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

export const mix = (a: number, b: number, t: number) => a + (b - a) * t;

export const headline = (size: number, color: string = COLORS.white): CSSProperties => ({
  fontFamily: FONT_HEADLINE,
  fontSize: size,
  lineHeight: 1,
  letterSpacing: "0.01em",
  color,
  textTransform: "uppercase",
  whiteSpace: "nowrap",
});

export const label = (size: number, color: string, weight: 500 | 700 = 700): CSSProperties => ({
  fontFamily: FONT_LABEL,
  fontWeight: weight,
  fontSize: size,
  lineHeight: 1,
  letterSpacing: "0.3em",
  color,
  textTransform: "uppercase",
  whiteSpace: "nowrap",
});

export const wordColor = (gold: boolean, base: string = COLORS.white) =>
  gold ? COLORS.gold : base;

export const goldGlow = (strength = 1) =>
  `0 0 ${18 * strength}px rgba(212,175,90,${0.55 * strength}), 0 0 ${48 * strength}px rgba(212,175,90,${0.25 * strength})`;
