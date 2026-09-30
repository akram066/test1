/** Aligns whisper word timestamps to the script words (see prepare-voice.ts). */
import { normalizeWord, WORDS } from "../src/timing";

export type Timed = { word: string; start: number; end: number };

const editDistance = (a: string, b: string) => {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
};

const similar = (a: string, b: string) => a === b || editDistance(a, b) <= Math.floor(Math.max(a.length, b.length) / 3);

/** Needleman–Wunsch alignment of script words to transcript words; gaps are interpolated. */
export const align = (heard: Timed[]) => {
  const script = WORDS.map((w) => normalizeWord(w.spoken));
  const n = script.length;
  const m = heard.length;
  const cost = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = 0; i <= n; i++) cost[i][0] = i;
  for (let j = 0; j <= m; j++) cost[0][j] = j;
  for (let i = 1; i <= n; i++)
    for (let j = 1; j <= m; j++)
      cost[i][j] = Math.min(
        cost[i - 1][j - 1] + (similar(script[i - 1], heard[j - 1].word) ? 0 : 1.5),
        cost[i - 1][j] + 1,
        cost[i][j - 1] + 1,
      );
  const match: (Timed | null)[] = new Array(n).fill(null);
  let i = n;
  let j = m;
  while (i > 0 && j > 0) {
    const diag = cost[i - 1][j - 1] + (similar(script[i - 1], heard[j - 1].word) ? 0 : 1.5);
    if (cost[i][j] === diag) {
      if (similar(script[i - 1], heard[j - 1].word)) match[i - 1] = heard[j - 1];
      i--;
      j--;
    } else if (cost[i][j] === cost[i - 1][j] + 1) i--;
    else j--;
  }
  const matched = match.filter(Boolean).length;
  console.log(`Aligned ${matched}/${n} script words to the transcript.`);

  const out: { text: string; start: number; end: number }[] = [];
  for (let k = 0; k < n; k++) {
    const hit = match[k];
    if (hit) {
      out.push({ text: WORDS[k].spoken, start: hit.start, end: hit.end });
      continue;
    }
    // interpolate across a run of unmatched words
    let e = k;
    while (e < n && !match[e]) e++;
    const from = k > 0 ? out[k - 1].end : 0;
    const to = e < n ? match[e]!.start : from + (e - k) * 0.45;
    const step = (to - from) / (e - k);
    for (let q = k; q < e; q++) {
      console.warn(`  interpolated "${WORDS[q].spoken}"`);
      out.push({ text: WORDS[q].spoken, start: from + step * (q - k), end: from + step * (q - k + 1) });
    }
    k = e - 1;
  }
  return out;
};

