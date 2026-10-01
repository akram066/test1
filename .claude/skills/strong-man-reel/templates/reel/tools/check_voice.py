"""Pronunciation / clarity check: offline speech recognition (pocketsphinx) against the script.

  python3 tools/check_voice.py [audio]      # default assets/voiceover.wav, split by transcript.json

Prints each sentence as heard plus the word error rate (WER). Use it to compare voices or catch
mispronounced words. It is a rough recogniser: homophones (no/know, bored/board, weak/week) count as
errors, so compare candidates relative to each other and read the misses. Needs: pip install pocketsphinx
"""
import json, os, re, subprocess, sys, tempfile
import numpy as np
import soundfile as sf
from pocketsphinx import Decoder, get_model_path

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CFG = json.load(open(os.path.join(ROOT, "reel.config.json")))
M = get_model_path()
dec = Decoder(hmm=os.path.join(M, "en-us", "en-us"), lm=os.path.join(M, "en-us", "en-us.lm.bin"),
              dict=os.path.join(M, "en-us", "cmudict-en-us.dict"), logfn=os.devnull)
norm = lambda s: re.sub(r"[^a-z' ]", "", s.lower()).split()


def wer(ref, hyp):
    d = np.arange(len(hyp) + 1)
    for i, r in enumerate(ref, 1):
        nd = [i]
        for j, h in enumerate(hyp, 1):
            nd.append(min(d[j] + 1, nd[j - 1] + 1, d[j - 1] + (r != h)))
        d = np.array(nd)
    return int(d[-1])


def hear(a, sr):
    with tempfile.TemporaryDirectory() as t:
        w, raw = os.path.join(t, "s.wav"), os.path.join(t, "s.raw")
        sf.write(w, a, sr)
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", w, "-ar", "16000", "-ac", "1", "-f", "s16le", raw], check=True)
        dec.start_utt(); dec.process_raw(open(raw, "rb").read(), full_utt=True); dec.end_utt()
    return dec.hyp().hypstr if dec.hyp() else ""


path = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "assets", "voiceover.wav")
a, sr = sf.read(path)
a = a.mean(axis=1) if a.ndim > 1 else a
words = json.load(open(os.path.join(ROOT, "transcript.json")))
errs = tot = 0
for s in CFG["script"]:
    ws = [w for w in words if w["sentence"] == s["id"]]
    seg = a[int(max(0, ws[0]["start"] - 0.1) * sr): int((ws[-1]["end"] + 0.25) * sr)]
    h = hear(seg, sr)
    e = wer(norm(s["text"]), norm(h))
    errs += e; tot += len(norm(s["text"]))
    print(f"{'ok ' if e == 0 else 'ERR'} {s['text']}\n      heard: {h}")
print(f"WER {100 * errs / tot:.1f}%")
