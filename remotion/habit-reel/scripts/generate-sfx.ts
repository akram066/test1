/**
 * Synthesises every sound effect procedurally (no samples, no licences needed)
 * and writes 48 kHz / 16-bit stereo WAVs to public/sfx/.
 *
 *   whoosh  – band-passed noise sweep for transitions
 *   impact  – soft low thump for slammed words
 *   sub     – deep sub-bass drop under "GIVES IN" and the final rule
 *   rewind  – short tape-rewind chirp for the cycle
 *   tick    – quiet key tick for the typewriter
 *   drone   – low ambient room tone, seamlessly loopable
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SR = 48000;
const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "sfx");

// deterministic PRNG so renders are reproducible
let seed = 1337;
const rand = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};
const noise = () => rand() * 2 - 1;

const writeWav = (name: string, left: Float32Array, right: Float32Array = left) => {
  const n = left.length;
  const buf = Buffer.alloc(44 + n * 4);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + n * 4, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 4, 28);
  buf.writeUInt16LE(4, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(n * 4, 40);
  let peak = 0;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]));
  const norm = peak > 0 ? 0.89 / peak : 1; // normalise to about -1 dBFS
  for (let i = 0; i < n; i++) {
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, left[i] * norm)) * 32767), 44 + i * 4);
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, right[i] * norm)) * 32767), 46 + i * 4);
  }
  writeFileSync(join(OUT, `${name}.wav`), buf);
  console.log(`  sfx/${name}.wav  ${(n / SR).toFixed(2)}s`);
};

/** RBJ biquad band-pass / low-pass with per-sample coefficient updates. */
class Biquad {
  private x1 = 0;
  private x2 = 0;
  private y1 = 0;
  private y2 = 0;
  process(x: number, type: "bp" | "lp" | "hp", freq: number, q: number) {
    const w0 = (2 * Math.PI * Math.min(freq, SR * 0.45)) / SR;
    const alpha = Math.sin(w0) / (2 * q);
    const cos = Math.cos(w0);
    let b0: number, b1: number, b2: number;
    if (type === "bp") {
      b0 = alpha;
      b1 = 0;
      b2 = -alpha;
    } else if (type === "lp") {
      b0 = (1 - cos) / 2;
      b1 = 1 - cos;
      b2 = (1 - cos) / 2;
    } else {
      b0 = (1 + cos) / 2;
      b1 = -(1 + cos);
      b2 = (1 + cos) / 2;
    }
    const a0 = 1 + alpha;
    const a1 = -2 * cos;
    const a2 = 1 - alpha;
    const y = (b0 * x + b1 * this.x1 + b2 * this.x2 - a1 * this.y1 - a2 * this.y2) / a0;
    this.x2 = this.x1;
    this.x1 = x;
    this.y2 = this.y1;
    this.y1 = y;
    return y;
  }
}

const smooth = (t: number) => t * t * (3 - 2 * t);

const whoosh = () => {
  const dur = 0.9;
  const n = Math.floor(SR * dur);
  const L = new Float32Array(n);
  const R = new Float32Array(n);
  const fl = new Biquad();
  const fr = new Biquad();
  const peakAt = 0.55;
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const env = t < peakAt ? smooth(t / peakAt) ** 2 : (1 - smooth((t - peakAt) / (1 - peakAt))) ** 1.6;
    const sweep = t < peakAt ? 250 + 2600 * smooth(t / peakAt) : 2850 - 2200 * smooth((t - peakAt) / (1 - peakAt));
    const pan = 0.5 + 0.35 * Math.sin(Math.PI * (t - 0.5));
    const s = noise();
    L[i] = fl.process(s, "bp", sweep, 1.4) * env * (1 - pan) * 2;
    R[i] = fr.process(noise(), "bp", sweep * 1.05, 1.4) * env * pan * 2;
  }
  writeWav("whoosh", L, R);
};

const impact = () => {
  const dur = 0.8;
  const n = Math.floor(SR * dur);
  const out = new Float32Array(n);
  const lp = new Biquad();
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const f = 42 + 58 * Math.exp(-t * 18);
    phase += (2 * Math.PI * f) / SR;
    const body = Math.sin(phase) * Math.exp(-t * 7) * Math.min(1, t / 0.003);
    const click = lp.process(noise(), "lp", 1800, 0.7) * Math.exp(-t * 60) * 0.5;
    out[i] = body + click;
  }
  writeWav("impact", out);
};

const sub = () => {
  const dur = 2.6;
  const n = Math.floor(SR * dur);
  const out = new Float32Array(n);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const f = 30 + 34 * Math.exp(-t * 3.2);
    phase += (2 * Math.PI * f) / SR;
    const env = Math.min(1, t / 0.008) * Math.exp(-t * 1.6);
    out[i] = (Math.sin(phase) + 0.35 * Math.sin(2 * phase)) * env;
  }
  writeWav("sub", out);
};

const rewind = () => {
  const dur = 0.4;
  const n = Math.floor(SR * dur);
  const out = new Float32Array(n);
  const bp = new Biquad();
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const f = 1400 * (1 - smooth(t)) + 180;
    phase += (2 * Math.PI * f) / SR;
    const saw = 2 * (phase / (2 * Math.PI) - Math.floor(phase / (2 * Math.PI) + 0.5));
    const env = Math.sin(Math.PI * t) ** 0.7;
    const wobble = 1 + 0.3 * Math.sin(2 * Math.PI * 38 * t);
    out[i] = bp.process(saw * 0.6 + noise() * 0.4, "bp", f * 2, 2) * env * wobble;
  }
  writeWav("rewind", out);
};

const tick = () => {
  const dur = 0.05;
  const n = Math.floor(SR * dur);
  const out = new Float32Array(n);
  const hp = new Biquad();
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    out[i] = hp.process(noise(), "bp", 3200, 3) * Math.exp(-t * 180);
  }
  writeWav("tick", out);
};

/** Low room tone. Every partial completes whole cycles over the loop so it tiles seamlessly. */
const drone = () => {
  const dur = 16;
  const n = SR * dur;
  const L = new Float32Array(n);
  const R = new Float32Array(n);
  const cyc = (hz: number) => Math.round(hz * dur) / dur; // snap to loop length
  const partials = [
    { f: cyc(41.2), a: 1 },
    { f: cyc(61.8), a: 0.45 },
    { f: cyc(82.4), a: 0.3 },
    { f: cyc(123.6), a: 0.08 },
  ];
  const lfo = 1 / dur; // one breath per loop
  // brown-ish noise bed, made loopable by cross-fading the overrun into the head
  const xf = SR * 2;
  const raw = new Float32Array(n + xf);
  const lp = new Biquad();
  let brown = 0;
  for (let i = 0; i < n + xf; i++) {
    brown = brown * 0.995 + noise() * 0.02;
    raw[i] = lp.process(brown, "lp", 220, 0.7);
  }
  const bed = raw.slice(0, n);
  for (let i = 0; i < xf; i++) {
    const t = smooth(i / xf);
    bed[i] = raw[i] * t + raw[n + i] * (1 - t);
  }
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    let s = 0;
    for (const p of partials) s += p.a * Math.sin(2 * Math.PI * p.f * t);
    const breath = 0.8 + 0.2 * Math.sin(2 * Math.PI * lfo * t);
    const b = bed[i] * 6;
    L[i] = (s * 0.5 + b) * breath;
    R[i] = (s * 0.5 + b * 0.9) * breath;
  }
  writeWav("drone", L, R);
};

mkdirSync(OUT, { recursive: true });
console.log("Generating SFX…");
whoosh();
impact();
sub();
rewind();
tick();
drone();
