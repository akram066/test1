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


def main():
    from kokoro_onnx import Kokoro

    k = Kokoro(V.CACHE + "kokoro-v1.0.onnx", V.CACHE + "voices-v1.0.bin")  # tokenizer only
    v = CFG["voice"]
    src = os.path.join(ROOT, v["file"])
    a = decode(src, SR)
    lang = v.get("lang", "en-us")
    weights = [V.phoneme_weights(k, s["text"].split(), lang).sum() for s in CFG["script"]]
    spans = V.group(V.segments(a), weights)
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
