"""Word timestamps for an external voiceover by forced alignment (pocketsphinx), fully offline.

Config: voice.engine = "file", voice.aligner = "sphinx", voice.file = the audio (e.g. an ElevenLabs mp3),
optional voice.pronounce = {"word": "ARPABET PHONES"} for words missing from the CMU dictionary.

Unlike align_external.py (which spreads words by phoneme count inside detected sentences), this aligns
the known script against the audio with the acoustic model, so every word gets its own measured start
and end. Sentence boundaries come from the script. A word's end is clipped to the next word's start.

The audio itself is only de-spiked and peak-normalised (voice.peak_db); no pitch or EQ changes.
Output: assets/voiceover.wav and transcript.json. Needs: pip install pocketsphinx
"""
import json, os, re, subprocess, sys, tempfile
import numpy as np
import soundfile as sf
from pocketsphinx import Decoder

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CFG = json.load(open(os.path.join(ROOT, "reel.config.json")))


def decode(path, sr):
    with tempfile.TemporaryDirectory() as d:
        out = os.path.join(d, "a.wav")
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", path, "-ac", "1", "-ar", str(sr), out], check=True)
        a, _ = sf.read(out)
    return a


def main():
    v = CFG["voice"]
    src = os.path.join(ROOT, v["file"])
    a16 = decode(src, 16000)
    pcm = (np.clip(a16, -1, 1) * 32767).astype("<i2").tobytes()
    tokens = [(item["id"], w) for item in CFG["script"] for w in item["text"].split()]
    norm = lambda w: re.sub(r"[^a-z']", "", w.lower())
    d = Decoder(lm=None, bestpath=False, samprate=16000, logfn=os.devnull)
    # words missing from the CMU dictionary: voice.pronounce = {"skincare": "S K IH N K EH R"}
    for w, ph in v.get("pronounce", {}).items():
        d.add_word(w.lower(), ph, True)
    d.set_align_text(" ".join(norm(w) for _, w in tokens))
    d.start_utt(); d.process_raw(pcm, full_utt=True); d.end_utt()
    d.set_alignment()
    d.start_utt(); d.process_raw(pcm, full_utt=True); d.end_utt()
    segs = [(re.sub(r"\(\d+\)$", "", s.name), s.start / 100, (s.start + s.duration) / 100)
            for s in d.get_alignment() if s.name not in ("<sil>", "<s>", "</s>")]
    if [s[0] for s in segs] != [norm(w) for _, w in tokens]:
        sys.exit("alignment does not match the script: " + " ".join(s[0] for s in segs))
    # the opening needs a beat: pad the head so the first voiced sample lands at lead_in
    env = np.convolve(np.abs(a16), np.ones(320) / 320, "same")
    first = np.argmax(env > 0.05 * env.max()) / 16000
    pad = max(0.0, CFG.get("lead_in", 0.35) - first)
    words = []
    for i, ((sid, text), (_, s, e)) in enumerate(zip(tokens, segs)):
        s = max(s, first)
        if i + 1 < len(segs):
            e = min(e, segs[i + 1][1])
        words.append({"text": text, "start": round(pad + s, 3), "end": round(pad + e, 3), "sentence": sid, "index": i})
    for item in CFG["script"]:
        ws = [w for w in words if w["sentence"] == item["id"]]
        print(f"  {item['id']:8s} {ws[0]['start']:6.2f}-{ws[-1]['end']:6.2f}  {item['text']}")
    # delivery file: 48 kHz, de-spiked, peak-normalised
    sr_out = 48000
    y = np.concatenate([np.zeros(int(pad * sr_out)), decode(src, sr_out)])
    knee = np.percentile(np.abs(y), 99.9)
    ceil = knee * 1.3
    big = np.abs(y) > knee
    y[big] = np.sign(y[big]) * (knee + (ceil - knee) * np.tanh((np.abs(y[big]) - knee) / (ceil - knee)))
    y = y * (10 ** (v["peak_db"] / 20) / np.abs(y).max())
    sf.write(os.path.join(ROOT, "assets", "voiceover.wav"), y.astype(np.float32), sr_out, subtype="PCM_16")
    json.dump(words, open(os.path.join(ROOT, "transcript.json"), "w"), indent=1)
    print(f"voiceover.wav {len(y) / sr_out:.2f}s from {v['file']}, {len(words)} words force-aligned")


if __name__ == "__main__":
    main()
