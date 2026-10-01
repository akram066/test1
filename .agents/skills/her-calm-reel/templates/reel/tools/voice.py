"""Voiceover: Kokoro TTS (local, no API key) + word timestamps.

Voice: a blend of Kokoro style vectors (config voice.blend). Text is phonemised first and corrected with
voice.phoneme_fixes (e.g. American "urge" must be rhotic /ˈɜɹdʒ/, which espeak writes as British /ˈɜːdʒ/), then a light "narrator" chain:
one semitone down (deeper chest resonance), low-shelf warmth, presence, gentle compression and
a short room reverb, so sentences decay naturally into the pauses.

Sentence transitions:
  * each sentence is synthesised in ONE pass, so intonation carries across commas;
  * every sentence is level-matched to the same speech RMS (separate TTS calls drift in level);
  * edges get a short fade-in and a long cosine fade-out instead of a hard trim;
  * the room reverb carries each tail softly into the next pause.

Word timestamps: internal pauses detected in the audio anchor the commas; inside each clause,
word boundaries are spread by phoneme count and snapped to the nearest energy dip.

Output: assets/voiceover.wav (peak = voice.peak_db) and transcript.json [{text,start,end,sentence,index}].
"""
import json, os, re, subprocess, tempfile
import numpy as np
import soundfile as sf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CFG = json.load(open(os.path.join(ROOT, "reel.config.json")))
# Kokoro settings live under voice.kokoro; lang and peak_db are shared with the external-file engine.
VCFG = {**CFG["voice"].get("kokoro", {}), "lang": CFG["voice"].get("lang", "en-us"),
        "peak_db": CFG["voice"].get("peak_db", -3)}
CACHE = os.path.expanduser("~/.cache/hyperframes/tts/")
SR = 24000
HOP = 0.005


def env_rms(a, win=0.02):
    h, w = int(HOP * SR), int(win * SR)
    pad = np.pad(a, (w // 2, w // 2))
    return np.array([np.sqrt((pad[i:i + w] ** 2).mean()) for i in range(0, len(a), h)])


def voiced_span(env, thr):
    idx = np.where(env > thr)[0]
    return (idx[0], idx[-1]) if len(idx) else (0, len(env) - 1)


def phoneme_weights(k, words, lang):
    out = []
    for w in words:
        ph = k.tokenizer.phonemize(re.sub(r"[^\w']", "", w), lang)
        out.append(max(1, len(re.sub(r"[ˈˌː\s]", "", ph))))
    return np.array(out, dtype=float)


def spread(k, words, lang, t0, t1, env):
    """Phoneme-proportional word bounds inside [t0,t1] (s, local), snapped to energy dips."""
    wts = phoneme_weights(k, words, lang)
    cum = np.concatenate([[0], np.cumsum(wts)]) / wts.sum()
    est = t0 + cum * (t1 - t0)
    b = est.copy()
    for i in range(1, len(b) - 1):
        reach = min(0.09, 0.35 * min(est[i] - est[i - 1], est[i + 1] - est[i]))
        c, r = int(est[i] / HOP), max(1, int(reach / HOP))
        lo, hi = max(0, c - r), min(len(env) - 1, c + r)
        b[i] = (lo + int(np.argmin(env[lo:hi + 1]))) * HOP
    return b


def align_sentence(k, text, lang, a):
    """Returns [(word, start, end)] local to the sentence audio."""
    env = env_rms(a)
    thr = max(0.01, 0.06 * env.max())
    s0, s1 = voiced_span(env, thr)
    clauses = [c.strip() for c in re.findall(r"[^,]+,?", text) if c.strip()]
    spans = [(s0 * HOP, s1 * HOP)]
    if len(clauses) > 1:
        # silent runs (>= 70 ms) inside the voiced span are clause-pause candidates
        quiet = env[s0:s1 + 1] < thr * 0.9
        runs, i = [], 0
        while i < len(quiet):
            if quiet[i]:
                j = i
                while j < len(quiet) and quiet[j]:
                    j += 1
                if (j - i) * HOP >= 0.07:
                    runs.append((s0 + i, s0 + j))
                i = j
            else:
                i += 1
        if len(runs) >= len(clauses) - 1:
            pick = sorted(sorted(runs, key=lambda r: r[1] - r[0], reverse=True)[: len(clauses) - 1])
            edges = [s0] + [x for r in pick for x in r] + [s1]
            spans = [(edges[2 * i] * HOP, edges[2 * i + 1] * HOP) for i in range(len(clauses))]
        else:
            clauses = [text]
    out = []
    for clause, (t0, t1) in zip(clauses, spans):
        words = clause.split()
        b = spread(k, words, lang, t0, t1, env)
        out += [(w, b[i], b[i + 1]) for i, w in enumerate(words)]
    return out


def fade(a, fin=0.03, fout=0.09):
    n_in, n_out = int(fin * SR), int(fout * SR)
    a = a.copy()
    a[:n_in] *= np.sin(np.linspace(0, np.pi / 2, n_in)) ** 2
    a[-n_out:] *= np.cos(np.linspace(0, np.pi / 2, n_out)) ** 2
    return a


def room_ir(rt60=0.5, predelay=0.012, seed=3):
    rng = np.random.default_rng(seed)
    n = int(rt60 * 1.3 * SR)
    t = np.arange(n) / SR
    ir = rng.standard_normal(n) * np.exp(-6.9 * t / rt60)
    # darken the tail (one-pole low-pass, stronger as it decays)
    y, out = 0.0, np.zeros(n)
    for i in range(n):
        a = 0.35 + 0.55 * min(1, t[i] / rt60)
        y = a * y + (1 - a) * ir[i]
        out[i] = y
    ir = np.concatenate([np.zeros(int(predelay * SR)), out])
    for d, g in ((0.017, 0.5), (0.029, 0.35), (0.041, 0.25)):  # a few early reflections
        ir[int(d * SR)] += g
    return ir / np.sqrt((ir ** 2).sum())


def convolve(x, h):
    n = len(x) + len(h) - 1
    N = 1 << (n - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, N) * np.fft.rfft(h, N), N)[:n]


def narrator_chain(y, v):
    """ffmpeg: pitch shift (duration preserved), EQ, compression. Timing is unchanged."""
    r = 2 ** (v.get("pitch_semitones", 0) / 12)
    chain = []
    if abs(r - 1) > 1e-3:
        chain += [f"asetrate={SR * r:.3f}", f"aresample={SR}", f"atempo={1 / r:.6f}"]
    # EQ presets: "male" (deep narrator: warmth, de-mud, presence), "female" (warm and soft, tamed sibilance), "none"
    eq = v.get("eq", "male")
    eq = "male" if eq is True else ("none" if eq is False else eq)
    chain += ["highpass=f=55" if eq != "female" else "highpass=f=85"]
    if eq == "male":
        chain += ["equalizer=f=120:t=q:w=0.9:g=2.5", "equalizer=f=380:t=q:w=1.2:g=-1.5",
                  "equalizer=f=3200:t=q:w=1.0:g=1.8", "equalizer=f=7500:t=q:w=1.5:g=-2"]
    elif eq == "female":
        chain += ["equalizer=f=220:t=q:w=1.0:g=1.5", "equalizer=f=2800:t=q:w=1.0:g=1.0",
                  "equalizer=f=6500:t=q:w=1.4:g=-2.5"]
    if eq != "none":
        chain += ["acompressor=threshold=-22dB:ratio=2.2:attack=10:release=160:makeup=1.5"]
    with tempfile.TemporaryDirectory() as d:
        src, dst = os.path.join(d, "in.wav"), os.path.join(d, "out.wav")
        sf.write(src, y, SR, subtype="FLOAT")
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", src, "-af", ",".join(chain), "-ar", str(SR), dst], check=True)
        out, _ = sf.read(dst)
    out = out[: len(y)] if len(out) >= len(y) else np.pad(out, (0, len(y) - len(out)))
    return out


def main():
    from kokoro_onnx import Kokoro

    k = Kokoro(CACHE + "kokoro-v1.0.onnx", CACHE + "voices-v1.0.bin")
    v, gaps = VCFG, CFG["gaps"]
    blend = v.get("blend") or {v["voice"]: 1.0}
    style = sum(w * k.get_voice_style(name) for name, w in blend.items()) / sum(blend.values())

    t = CFG["lead_in"]
    parts, words = [np.zeros(int(t * SR))], []
    target = 10 ** (-20 / 20)  # common speech RMS for every sentence
    for item in CFG["script"]:
        ph = k.tokenizer.phonemize(item["text"], v["lang"])
        for bad, good in v.get("phoneme_fixes", {}).items():
            ph = ph.replace(bad, good)
        a, sr = k.create(ph, voice=style, speed=v["speed"], lang=v["lang"], is_phonemes=True, trim=False)
        assert sr == SR
        a = a.astype(np.float64)
        env = env_rms(a)
        # gentle trim: quiet onsets (/h/ in "He", "It") must survive, so use a low threshold + generous pre-roll
        s0, _ = voiced_span(env, max(0.004, 0.02 * env.max()))
        _, s1 = voiced_span(env, max(0.006, 0.04 * env.max()))
        a0 = max(0, int((s0 * HOP - 0.08) * SR))
        a1 = min(len(a), int((s1 * HOP + 0.16) * SR))
        a = a[a0:a1]
        e = env_rms(a)
        active = e > 0.1 * e.max()
        rms = np.sqrt(np.mean(e[active] ** 2)) if active.any() else 1.0
        a = fade(a * (target / max(rms, 1e-6)))
        for w, ws, we in align_sentence(k, item["text"], v["lang"], a):
            words.append({"text": w, "start": round(t + ws, 3), "end": round(t + we, 3), "sentence": item["id"]})
        parts.append(a)
        t += len(a) / SR
        gap = gaps[item["pause"]] if item.get("pause") else gaps["sentence"]
        parts.append(np.zeros(int(gap * SR)))
        t += gap

    dry = np.concatenate(parts)
    wet_amt = v.get("reverb", 0.12)
    y = narrator_chain(dry, v)
    rev = convolve(y, room_ir(v.get("room_rt60", 0.5)))[: len(y)]
    y = y * (1 - wet_amt * 0.5) + rev * wet_amt
    # tame isolated plosive spikes (they overshoot once AAC-encoded twice), then peak-normalise
    knee = np.percentile(np.abs(y), 99.9)
    ceil = knee * 1.3
    big = np.abs(y) > knee
    y[big] = np.sign(y[big]) * (knee + (ceil - knee) * np.tanh((np.abs(y[big]) - knee) / (ceil - knee)))
    y = y * (10 ** (v["peak_db"] / 20) / np.abs(y).max())

    os.makedirs(os.path.join(ROOT, "assets"), exist_ok=True)
    sf.write(os.path.join(ROOT, "assets", "voiceover.wav"), y.astype(np.float32), SR, subtype="PCM_16")
    for i, w in enumerate(words):
        w["index"] = i
    json.dump(words, open(os.path.join(ROOT, "transcript.json"), "w"), indent=1)
    print(f"voiceover.wav {len(y) / SR:.2f}s, {len(words)} words, blend {blend} @ {v['speed']}, "
          f"pitch {v.get('pitch_semitones', 0)} st, reverb {wet_amt}")


if __name__ == "__main__":
    main()
