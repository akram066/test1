"""Voiceover: Kokoro TTS (local, no API key) + word timestamps, delivered like a real person.

Voice: a blend of Kokoro style vectors (config voice.kokoro.blend). Text is phonemised first and corrected
with voice.kokoro.phoneme_fixes, then a light narrator chain (EQ preset, gentle compression, short room).

Human flow (config "flow"): a person does not read a script one sentence at a time. Sentences that belong
together are spoken in ONE breath group, so the intonation runs on and the pause between them is the
model's own natural one. Between groups:
  * the gap varies (each group sets its own, plus a small seeded jitter), never a metronome;
  * a soft synthesised inhale sits in front of every group that follows a real pause (voice.kokoro.breath_db);
  * a group can be a touch slower or faster (its own "speed"), like a speaker settling into the ending;
  * a quiet room tone runs under everything, so the silences never drop to digital zero.
Without "flow", every sentence is its own group (the older one-sentence-per-call behaviour).

Word timestamps: each group is split into its sentences by voiced segments (expected length from phoneme
counts, longest gaps as boundaries); inside a sentence, commas are anchored on detected pauses and words are
spread by phoneme count and snapped to energy dips.

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


def segments(a, rel=0.03, merge=0.06):
    """Voiced segments [[start, end], ...] (s) from the energy envelope; silences >= `merge` split them."""
    env = env_rms(a)
    q = env < rel * env.max()
    segs, i = [], 0
    while i < len(q):
        if not q[i]:
            j = i
            while j < len(q) and not q[j]:
                j += 1
            segs.append([i * HOP, j * HOP])
            i = j
        else:
            i += 1
    merged = [segs[0]]
    for s in segs[1:]:
        if s[0] - merged[-1][1] < merge:
            merged[-1][1] = s[1]
        else:
            merged.append(s)
    return merged


def group(segs, weights):
    """DP: split voiced segments into len(weights) consecutive groups -> [(start, end)].

    Each group's expected length comes from its weight (phoneme count); longer gaps are preferred as
    boundaries. With fewer segments than groups, the span is split by weight instead."""
    n, m = len(segs), len(weights)
    if m == 1:
        return [(segs[0][0], segs[-1][1])]
    if n < m:
        t0, t1 = segs[0][0], segs[-1][1]
        cum = np.concatenate([[0], np.cumsum(weights)]) / sum(weights)
        return [(t0 + cum[i] * (t1 - t0), t0 + cum[i + 1] * (t1 - t0)) for i in range(m)]
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


def shaped_noise(n, rng, bands):
    """White noise shaped in the frequency domain: bands = [(centre Hz, width Hz, gain), ...]."""
    spec = np.fft.rfft(rng.standard_normal(n))
    f = np.fft.rfftfreq(n, 1 / SR)
    shape = sum(g * np.exp(-0.5 * ((f - c) / w) ** 2) for c, w, g in bands)
    return np.fft.irfft(spec * shape, n)


def breath(rng, dur):
    """A soft nasal inhale: breathy noise with a low formant, rising then easing off (unit RMS)."""
    n = int(dur * SR)
    x = shaped_noise(n, rng, [(900, 450, 1.0), (1700, 600, 0.55), (3600, 1400, 0.25), (350, 150, 0.35)])
    t = np.linspace(0, 1, n)
    env = np.sin(np.pi * np.minimum(1, t / 0.72) / 2) ** 2 * np.cos(np.pi / 2 * np.clip((t - 0.72) / 0.28, 0, 1)) ** 1.5
    x = x * env
    return x / (np.sqrt(np.mean(x ** 2)) + 1e-9)


def room_tone(n, rng):
    """Very quiet, dark, steady room noise (unit RMS)."""
    x = shaped_noise(n, rng, [(150, 120, 1.0), (600, 500, 0.5), (2500, 1500, 0.12)])
    return x / (np.sqrt(np.mean(x ** 2)) + 1e-9)


def synth(k, text, style, speed, v):
    """One breath group in one pass: gentle trim (quiet onsets survive), level-matched, soft edges."""
    ph = k.tokenizer.phonemize(text, v["lang"])
    for bad, good in v.get("phoneme_fixes", {}).items():
        ph = ph.replace(bad, good)
    a, sr = k.create(ph, voice=style, speed=speed, lang=v["lang"], is_phonemes=True, trim=False)
    assert sr == SR
    a = a.astype(np.float64)
    env = env_rms(a)
    s0, _ = voiced_span(env, max(0.004, 0.02 * env.max()))
    _, s1 = voiced_span(env, max(0.006, 0.04 * env.max()))
    a0 = max(0, int((s0 * HOP - 0.08) * SR))
    a1 = min(len(a), int((s1 * HOP + 0.16) * SR))
    a = a[a0:a1]
    e = env_rms(a)
    active = e > 0.1 * e.max()
    rms = np.sqrt(np.mean(e[active] ** 2)) if active.any() else 1.0
    return fade(a * (10 ** (-20 / 20) / max(rms, 1e-6)))  # every group at the same speech RMS



def main():
    from kokoro_onnx import Kokoro

    k = Kokoro(CACHE + "kokoro-v1.0.onnx", CACHE + "voices-v1.0.bin")
    v, gaps = VCFG, CFG["gaps"]
    blend = v.get("blend") or {v["voice"]: 1.0}
    style = sum(w * k.get_voice_style(name) for name, w in blend.items()) / sum(blend.values())
    script = {s["id"]: s for s in CFG["script"]}
    flow = CFG.get("flow") or [{"say": [s["id"]]} for s in CFG["script"]]
    said = [sid for g in flow for sid in g["say"]]
    if said != [s["id"] for s in CFG["script"]]:
        raise SystemExit("flow must list every script id once, in script order")
    rng = np.random.default_rng(v.get("seed", 5))

    t = CFG["lead_in"]
    parts, words, breaths = [np.zeros(int(t * SR))], [], []
    for gi, g in enumerate(flow):
        items = [script[sid] for sid in g["say"]]
        a = synth(k, " ".join(it["text"] for it in items), style, g.get("speed", v["speed"]), v)
        # sentence spans inside the group, then words inside each sentence
        weights = [phoneme_weights(k, it["text"].split(), v["lang"]).sum() for it in items]
        for it, (s0, s1) in zip(items, group(segments(a), weights)):
            lo, hi = max(0, int((s0 - 0.05) * SR)), min(len(a), int((s1 + 0.05) * SR))
            for w, ws, we in align_sentence(k, it["text"], v["lang"], a[lo:hi]):
                words.append({"text": w, "start": round(t + lo / SR + ws, 3), "end": round(t + lo / SR + we, 3), "sentence": it["id"]})
        prev_gap = g.get("_prev_gap", None)
        if gi == 0 or (prev_gap or 0) >= 0.45:
            breaths.append(t + 0.08)  # the clip carries 80 ms of pre-roll before the first sound
        parts.append(a)
        t += len(a) / SR
        last = items[-1]
        gap = g.get("gap", gaps[last["pause"]] if last.get("pause") else gaps["sentence"])
        if gi + 1 < len(flow):
            gap *= 1 + rng.uniform(-0.08, 0.08)  # a person never pauses on a metronome
            flow[gi + 1]["_prev_gap"] = gap
        parts.append(np.zeros(int(gap * SR)))
        t += gap

    dry = np.concatenate(parts)
    wet_amt = v.get("reverb", 0.12)
    y = narrator_chain(dry, v)
    # breaths go in after the compressor (it would pump them up) and before the room, so they sit in it
    bdb = v.get("breath_db", None)
    if bdb is not None:
        for onset in breaths:
            d = rng.uniform(0.30, 0.42)
            b = breath(rng, d) * 10 ** ((-20 + bdb) / 20)
            s = int((onset - d - 0.04) * SR)
            if s > 0:
                y[s:s + len(b)] += b[: len(y) - s]
    rev = convolve(y, room_ir(v.get("room_rt60", 0.5)))[: len(y)]
    y = y * (1 - wet_amt * 0.5) + rev * wet_amt
    # tame isolated plosive spikes (they overshoot once AAC-encoded twice), then peak-normalise
    knee = np.percentile(np.abs(y), 99.9)
    ceil = knee * 1.3
    big = np.abs(y) > knee
    y[big] = np.sign(y[big]) * (knee + (ceil - knee) * np.tanh((np.abs(y[big]) - knee) / (ceil - knee)))
    y = y * (10 ** (v["peak_db"] / 20) / np.abs(y).max())
    rt = v.get("room_tone_db", None)
    if rt is not None:
        y = y + room_tone(len(y), rng) * 10 ** (rt / 20)

    os.makedirs(os.path.join(ROOT, "assets"), exist_ok=True)
    sf.write(os.path.join(ROOT, "assets", "voiceover.wav"), y.astype(np.float32), SR, subtype="PCM_16")
    for i, w in enumerate(words):
        w["index"] = i
    json.dump(words, open(os.path.join(ROOT, "transcript.json"), "w"), indent=1)
    for it in CFG["script"]:
        ws_ = [w for w in words if w["sentence"] == it["id"]]
        print(f"  {it['id']:8s} {ws_[0]['start']:6.2f}-{ws_[-1]['end']:6.2f}  {it['text']}")
    print(f"voiceover.wav {len(y) / SR:.2f}s, {len(words)} words in {len(flow)} breath groups, blend {blend} @ {v['speed']}, "
          f"reverb {wet_amt}, breaths {bdb} dB, room tone {rt} dBFS")


if __name__ == "__main__":
    main()
