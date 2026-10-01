"""Word timestamps for an external voiceover (ElevenLabs, a recording, ...), fully offline.

Config: voice.engine = "file", voice.file = path to the audio (relative to the project), e.g. an ElevenLabs mp3.

1. Voiced segments are found from the energy envelope (silences >= 60 ms split them).
2. Segments are grouped into the script's sentences with dynamic programming: each sentence's
   expected length comes from its phoneme count, and longer gaps are preferred as boundaries.
3. Inside each sentence, tools/voice.align_sentence anchors commas on detected pauses and spreads
   words by phoneme count, snapped to energy dips.

The audio itself is only de-spiked and peak-normalised (voice.peak_db); no pitch or EQ changes.
Output: assets/voiceover.wav and transcript.json.
"""
import json, os, re, subprocess, sys, tempfile
import numpy as np
import soundfile as sf

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import voice as V  # noqa: E402  (shares the aligner and constants)

ROOT = V.ROOT
CFG = V.CFG
SR = V.SR  # analysis rate (24 kHz)


def decode(path, sr, ch=1):
    with tempfile.TemporaryDirectory() as d:
        out = os.path.join(d, "a.wav")
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", path, "-ac", str(ch), "-ar", str(sr), out], check=True)
        a, _ = sf.read(out)
    return a


def segments(a):
    env = V.env_rms(a)
    q = env < 0.03 * env.max()
    segs, i = [], 0
    while i < len(q):
        if not q[i]:
            j = i
            while j < len(q) and not q[j]:
                j += 1
            segs.append([i * V.HOP, j * V.HOP])
            i = j
        else:
            i += 1
    merged = [segs[0]]
    for s in segs[1:]:
        if s[0] - merged[-1][1] < 0.06:
            merged[-1][1] = s[1]
        else:
            merged.append(s)
    return merged


def group(segs, weights):
    """DP: split segments into len(weights) consecutive groups."""
    n, m = len(segs), len(weights)
    speech = sum(e - s for s, e in segs)
    exp = np.array(weights) / sum(weights) * speech
    gap_after = [segs[i + 1][0] - segs[i][1] if i + 1 < n else 1.0 for i in range(n)]
    INF = 1e18
    cost = np.full((m + 1, n + 1), INF)
    back = np.zeros((m + 1, n + 1), dtype=int)
    cost[0][0] = 0
    for k in range(1, m + 1):
        for j in range(k, n + 1):
            for i in range(k - 1, j):
                if cost[k - 1][i] >= INF:
                    continue
                dur = sum(e - s for s, e in segs[i:j])
                c = ((dur - exp[k - 1]) / exp[k - 1]) ** 2 - 1.5 * min(gap_after[j - 1], 1.2)
                if cost[k - 1][i] + c < cost[k][j]:
                    cost[k][j], back[k][j] = cost[k - 1][i] + c, i
    bounds, j = [], n
    for k in range(m, 0, -1):
        i = back[k][j]
        bounds.append((segs[i][0], segs[j - 1][1]))
        j = i
    return bounds[::-1]


def main():
    from kokoro_onnx import Kokoro

    k = Kokoro(V.CACHE + "kokoro-v1.0.onnx", V.CACHE + "voices-v1.0.bin")  # tokenizer only
    v = CFG["voice"]
    src = os.path.join(ROOT, v["file"])
    a = decode(src, SR)
    lang = v.get("lang", "en-us")
    weights = [V.phoneme_weights(k, s["text"].split(), lang).sum() for s in CFG["script"]]
    spans = group(segments(a), weights)
    # pad the head so the first word lands at config lead_in (the opening blade needs a beat)
    pad = max(0.0, CFG.get("lead_in", 0.35) - spans[0][0])
    words = []
    for item, (s0, s1) in zip(CFG["script"], spans):
        lo, hi = max(0, int((s0 - 0.05) * SR)), min(len(a), int((s1 + 0.05) * SR))
        for w, ws, we in V.align_sentence(k, item["text"], lang, a[lo:hi]):
            words.append({"text": w, "start": round(pad + lo / SR + ws, 3), "end": round(pad + lo / SR + we, 3), "sentence": item["id"]})
        print(f"  {item['id']:7s} {pad + s0:6.2f}-{pad + s1:6.2f}  {item['text']}")
    # delivery file: keep the source sample rate, de-spike, peak-normalise
    sr_out = 48000
    y = np.concatenate([np.zeros(int(pad * sr_out)), decode(src, sr_out)])
    knee = np.percentile(np.abs(y), 99.9)
    ceil = knee * 1.3
    big = np.abs(y) > knee
    y[big] = np.sign(y[big]) * (knee + (ceil - knee) * np.tanh((np.abs(y[big]) - knee) / (ceil - knee)))
    y = y * (10 ** (v["peak_db"] / 20) / np.abs(y).max())
    sf.write(os.path.join(ROOT, "assets", "voiceover.wav"), y.astype(np.float32), sr_out, subtype="PCM_16")
    for i, w in enumerate(words):
        w["index"] = i
    json.dump(words, open(os.path.join(ROOT, "transcript.json"), "w"), indent=1)
    print(f"voiceover.wav {len(y) / sr_out:.2f}s from {v['file']}, {len(words)} words aligned")


if __name__ == "__main__":
    main()
