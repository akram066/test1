"""Shorten long pauses in an external voice take without touching the words.

  python3 tools/tighten.py IN.mp3 ALIGN.json OUT.wav [--keep 0.75] [--min 0.42] [--longest 1.3]

ALIGN.json is a pocketsphinx alignment of the raw take ([{"w","s","e"}], <sil> entries for pauses).
Every pause >= 0.45 s keeps `keep` of its length (never less than `min`); the single longest pause is
kept at `longest` (the real pause on screen); trailing silence is trimmed to 0.3 s. Cuts are made in the
middle of each pause with 20 ms crossfades, so breaths and word tails stay intact.
"""
import argparse, json, subprocess
import numpy as np, soundfile as sf

ap = argparse.ArgumentParser()
ap.add_argument("src"); ap.add_argument("align"); ap.add_argument("out")
ap.add_argument("--keep", type=float, default=0.75); ap.add_argument("--min", type=float, default=0.42)
ap.add_argument("--longest", type=float, default=1.3)
A = ap.parse_args()
sr = 48000
raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", A.src, "-ac", "1", "-ar", str(sr), "-f", "f32le", "-"], capture_output=True).stdout
a = np.frombuffer(raw, np.float32).copy()
sil = []
for x in json.load(open(A.align)):
    if x["w"] == "<sil>":
        if sil and abs(sil[-1][1] - x["s"]) < 0.02: sil[-1] = (sil[-1][0], x["e"])
        else: sil.append((x["s"], x["e"]))
sil = [s for s in sil if s[1] - s[0] >= 0.45]
longest = max(sil, key=lambda s: s[1] - s[0])
out, pos, saved, xf = [], 0, 0.0, int(0.02 * sr)
def join(seg):
    if out:
        prev = out[-1]; n = min(xf, len(prev), len(seg)); r = np.linspace(0, 1, n)
        prev[-n:] = prev[-n:] * (1 - r) + seg[:n] * r; seg = seg[n:]
    out.append(seg)
for s, e in sil:
    d = e - s
    keep = min(d, A.longest) if (s, e) == longest else (min(d, 0.3) if e >= len(a) / sr - 0.05 else max(A.min, A.keep * d))
    cut = d - keep
    if cut < 0.03: continue
    c0, c1 = int((s + keep / 2) * sr), int((s + keep / 2 + cut) * sr)
    join(a[pos:c0].copy()); pos = c1; saved += cut
join(a[pos:].copy())
y = np.concatenate(out)
sf.write(A.out, y, sr, subtype="PCM_24")
print("saved %.2fs -> %.2fs" % (saved, len(y) / sr))
