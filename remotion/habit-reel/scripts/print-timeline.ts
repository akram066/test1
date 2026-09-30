/** Prints the voice-driven scene timings and every word's frame. */
import { FPS } from "../src/scenes";
import { DURATION_IN_FRAMES, TIMELINE, TIMING_SOURCE, WORDS } from "../src/timing";

const s = (f: number) => `${(f / FPS).toFixed(2)}s`;
console.log(`Timing source: ${TIMING_SOURCE}`);
console.log(`Duration: ${DURATION_IN_FRAMES} frames (${s(DURATION_IN_FRAMES)})\n`);
for (const [name, w] of Object.entries(TIMELINE)) {
  console.log(`${name.padEnd(8)} ${String(w.from).padStart(4)} → ${String(w.to).padStart(4)}   ${s(w.from)} → ${s(w.to)}`);
}
console.log("\nWords:");
let prev = "";
for (const w of WORDS) {
  if (w.partId !== prev) process.stdout.write(`\n  [${w.partId}] `);
  prev = w.partId;
  process.stdout.write(`${w.display}@${w.at} `);
}
console.log();
