/** Sanity check for the alignment: drop, mangle and insert words in a fake transcript. */
import assert from "node:assert/strict";
import { normalizeWord, WORDS } from "../src/timing";
import { align, type Timed } from "./align";

const bored = WORDS.findIndex((w) => normalizeWord(w.spoken) === "bored");
const heard: Timed[] = [];
WORDS.forEach((w, i) => {
  const t = i * 0.5;
  if (i === 5) return; // whisper missed "about"
  const word = i === bored ? "bord" : normalizeWord(w.spoken); // misheard "bored"
  heard.push({ word, start: t, end: t + 0.4 });
  if (i === 20) heard.push({ word: "um", start: t + 0.41, end: t + 0.45 }); // inserted filler
});
const out = align(heard);
assert.equal(out.length, WORDS.length);
out.forEach((w, i) => {
  if (i === 5) {
    assert.ok(w.start >= out[4].end - 1e-9 && w.end <= out[6].start + 1e-9, "gap interpolated between neighbours");
  } else {
    assert.equal(w.start, i * 0.5, `word ${i} "${w.text}" keeps its timestamp`);
  }
});
console.log("align.test: ok");
