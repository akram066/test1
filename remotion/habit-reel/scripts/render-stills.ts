/**
 * Renders review stills to out/stills/. With no arguments it picks 8 hero
 * frames across the timeline (one or two per scene, each after its words land).
 *   npm run stills            # 8 hero frames
 *   npm run stills -- 0 250   # specific frames
 */
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DURATION_IN_FRAMES, part, TIMELINE } from "../src/timing";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "out", "stills");

const heroFrames = () => [
  0, // gold line already slicing
  TIMELINE.hook.exitFrom - 1, // full hook, just before the shatter
  part("thenHe").first.in - 1, // BORED TIRED ALONE stacked
  TIMELINE.scanner.from - 1, // REPEATS IT TOMORROW + cycle arrow
  part("urge").last.out + 6, // AN URGE IS A WAVE
  part("leaves").first.at - 3, // HE STANDS UP (just before the next cut)
  part("phone").last.out + 6, // phone outside the bedroom
  DURATION_IN_FRAMES - 1, // final frame / thumbnail
];

const frames = process.argv.slice(2).length
  ? process.argv.slice(2).map((f) => (f === "last" ? DURATION_IN_FRAMES - 1 : Number(f)))
  : heroFrames();

mkdirSync(outDir, { recursive: true });
const serveUrl = await bundle({ entryPoint: join(root, "src", "index.ts") });
const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE ?? null;
const composition = await selectComposition({ serveUrl, id: "HabitReel", browserExecutable });

for (const frame of frames) {
  const output = join(outDir, `frame_${String(frame).padStart(4, "0")}.png`);
  await renderStill({ composition, serveUrl, frame, output, browserExecutable });
  console.log(`  ${output}`);
}
