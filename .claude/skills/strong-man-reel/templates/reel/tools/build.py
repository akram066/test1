"""Generic reel builder: word timings -> scene cuts, sound cues, timing.js and the final audio mix.

  python3 tools/build.py            # reuse transcript.json + assets/voiceover.wav
  python3 tools/build.py --voice    # (re)make the voice + word timings first
  python3 tools/build.py --sfx      # (re)generate the procedural SFX first

Everything is driven by reel.config.json:

  scenes: [{"id": "hook", "at": 0}, {"id": "weak", "at": "weak:0", "lead": 0.15}, ...]
          A scene starts `lead` seconds before the word in `at`. The first scene starts at 0.
  cues:   [{"sfx": "stamp", "at": "hook:1", "offset": -0.02, "gain": "impact"}, ...]

Time references ("refs") used by scenes and cues:
  "<sentence>:<word>"      start of that word (0-based index within the sentence)
  "<sentence>:<word>:end"  end of that word
  "scene:<id>"             the moment that scene cuts in
  "end"                    the end of the reel
  12.5                     an absolute time in seconds

Cue options: offset (s); gain (number, or the name of a level in `sound`); mul (multiplier on gain);
  repeat {"count": n, "every": s}       the cue n times, `every` seconds apart
  span   {"to": ref, "count": n, "end_offset": s}  n cues evenly spaced from `at` to `to`
  typing [ref, ref, ...]                one cue per letter, matching the composition's typing schedule

Writes timing.js (window.REEL: duration, words, scenes, cut, cues) and assets/mix.wav: the voice at its
peak level, SFX + drone ducked under the voice and soft-limited (headroom for double AAC encoding).
Also keeps data-duration of #reel and #mix in index.html in sync with the voice.
"""
import json, os, re, subprocess, sys
import numpy as np
import soundfile as sf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CFG = json.load(open(os.path.join(ROOT, "reel.config.json")))
SR = 48000
FPS = CFG.get("fps", 30)

if "--voice" in sys.argv or not os.path.exists(os.path.join(ROOT, "transcript.json")):
    engine = CFG["voice"].get("engine", "kokoro")
    script = "align_external.py" if engine == "file" else "voice.py"
    subprocess.run([sys.executable, os.path.join(ROOT, "tools", script)], check=True)
if "--sfx" in sys.argv or not os.path.exists(os.path.join(ROOT, "assets", "sfx", "drone.wav")):
    subprocess.run([sys.executable, os.path.join(ROOT, "tools", "sfx.py")], check=True)

WORDS = json.load(open(os.path.join(ROOT, "transcript.json")))
BY_SENT = {}
for w in WORDS:
    BY_SENT.setdefault(w["sentence"], []).append(w)
duration = round((WORDS[-1]["end"] + CFG["end_hold"]) * FPS) / FPS


def word(sentence, i):
    try:
        return BY_SENT[sentence][int(i)]
    except (KeyError, IndexError):
        raise SystemExit(f"reel.config.json refers to {sentence}:{i}, which is not in the script")


cut = {}


def ref(r):
    if isinstance(r, (int, float)):
        return float(r)
    if r == "end":
        return duration
    parts = r.split(":")
    if parts[0] == "scene":
        return cut[parts[1]]
    w = word(parts[0], parts[1])
    return w["end"] if len(parts) > 2 and parts[2] == "end" else w["start"]


# ---------------------------------------------------------------- scenes
for i, s in enumerate(CFG["scenes"]):
    cut[s["id"]] = 0.0 if i == 0 else round(ref(s["at"]) - s.get("lead", 0.12), 3)
ids = [s["id"] for s in CFG["scenes"]]
scenes = {}
for i, sid in enumerate(ids):
    scenes[sid] = {"start": cut[sid], "end": cut[ids[i + 1]] if i + 1 < len(ids) else duration}
    if scenes[sid]["end"] <= scenes[sid]["start"]:
        raise SystemExit(f"scene '{sid}' has no length: check the order of `scenes` against the script")

# ---------------------------------------------------------------- cues
S = CFG["sound"]


# House levels: with "targets" in `sound`, every SFX is set so its loudest 50 ms sits that many dB relative to
# the voice's speech level (whatever the file's own loudness). Transitions about -31, impacts about -23.
TARGETS = S.get("targets")
_vdb, _loud = None, {}


def voice_db():
    global _vdb
    if _vdb is None:
        a, _ = sf.read(os.path.join(ROOT, "assets", "voiceover.wav"))
        a = a.mean(1) if a.ndim > 1 else a
        sp = a[np.abs(a) > 0.02]
        _vdb = 20 * np.log10(np.sqrt((sp ** 2).mean()) + 1e-9)
    return _vdb


def loudest(name):
    if name not in _loud:
        a, sr_ = sf.read(os.path.join(ROOT, "assets", "sfx", name + ".wav"))
        a = a.mean(1) if a.ndim > 1 else a
        w = min(int(0.05 * sr_), len(a))
        _loud[name] = max(np.sqrt((a[i:i + w] ** 2).mean()) for i in range(0, len(a) - w + 1, max(1, w // 2)))
    return _loud[name]


def gain_of(c):
    if TARGETS is not None:
        tdb = TARGETS.get(c["sfx"], TARGETS.get("default", -28))
        return 10 ** ((voice_db() + tdb) / 20) / (loudest(c["sfx"]) + 1e-9) * c.get("mul", 1.0)
    g = c.get("gain", 1.0)
    g = S[g] if isinstance(g, str) else g
    return g * c.get("mul", 1.0)


def typing_times(refs):
    """Same schedule as typingFor() in index.html: letters spread over 85% of each word."""
    out = []
    for r in refs:
        s, i = r.split(":")[:2]
        w = word(s, i)
        letters = w["text"].upper()
        span = max(0.18, (w["end"] - w["start"]) * 0.85)
        out += [w["start"] - 0.03 + span * k / len(letters) for k, ch in enumerate(letters) if ch.isalpha()]
    return out


cues = []
for c in CFG.get("cues", []):
    if "typing" in c:
        times = typing_times(c["typing"])
    else:
        t0 = ref(c["at"]) + c.get("offset", 0)
        if "repeat" in c:
            times = [t0 + k * c["repeat"]["every"] for k in range(c["repeat"]["count"])]
        elif "span" in c:
            t1 = ref(c["span"]["to"]) + c["span"].get("end_offset", 0)
            n = c["span"]["count"]
            times = [t0 + (t1 - t0) * k / n for k in range(n)]
        else:
            times = [t0]
    for t in times:
        if 0 <= t < duration:
            cues.append({"t": round(t, 3), "sfx": c["sfx"], "gain": round(gain_of(c), 4)})
cues.sort(key=lambda c: c["t"])

# ---------------------------------------------------------------- outputs
html_path = os.path.join(ROOT, "index.html")
html = open(html_path).read()
html = re.sub(r'(id="(?:reel|mix)"[^>]*?data-duration=")[\d.]+(")', lambda m: f"{m.group(1)}{duration:.2f}{m.group(2)}", html)
open(html_path, "w").write(html)

timing = {"duration": duration, "fps": FPS, "words": WORDS, "scenes": scenes,
          "cut": {k: round(v, 3) for k, v in cut.items()}, "cues": cues}
with open(os.path.join(ROOT, "timing.js"), "w") as f:
    f.write("// Generated by tools/build.py from reel.config.json + transcript.json. Do not edit.\n")
    f.write("window.REEL = " + json.dumps(timing, separators=(",", ":")) + ";\n")


def load(path):
    a, sr = sf.read(path, always_2d=True)
    a = np.repeat(a, 2, axis=1) if a.shape[1] == 1 else a[:, :2]
    if sr != SR:
        x = np.arange(len(a)) / sr
        xn = np.arange(int(len(a) * SR / sr)) / SR
        a = np.stack([np.interp(xn, x, a[:, c]) for c in range(2)], axis=1)
    return a


n = int(duration * SR)
voice = np.zeros((n, 2))
v = load(os.path.join(ROOT, "assets", "voiceover.wav"))[:n]
voice[: len(v)] = v * S.get("voice", 1.0)

sfx = np.zeros((n, 2))
cache = {}
for c in cues:
    a = cache.setdefault(c["sfx"], load(os.path.join(ROOT, "assets", "sfx", c["sfx"] + ".wav")))
    s = int(c["t"] * SR)
    e = min(n, s + len(a))
    sfx[s:e] += a[: e - s] * c["gain"]

dr = load(os.path.join(ROOT, "assets", "sfx", "drone.wav"))
drone = np.tile(dr, (n // len(dr) + 1, 1))[:n] * S.get("drone", 0.14)
fade = np.minimum(1, np.arange(n) / (0.8 * SR)) * np.minimum(1, (n - np.arange(n)) / (1.2 * SR))
drone *= fade[:, None]

# voice-activity envelope (attack 40 ms, release 220 ms) drives the ducking
act = np.zeros(n)
for w in WORDS:
    act[int(w["start"] * SR): int(w["end"] * SR)] = 1
att, rel = np.exp(-1 / (0.04 * SR)), np.exp(-1 / (0.22 * SR))
env = np.zeros(n)
y = 0.0
for i in range(n):
    k = att if act[i] > y else rel
    y = k * y + (1 - k) * act[i]
    env[i] = y
mix = voice + sfx * (10 ** (S.get("duck_sfx_db", -6) * env / 20))[:, None] \
            + drone * (10 ** (S.get("duck_drone_db", -8) * env / 20))[:, None]

# soft limiter: knee -3.5 dBFS, ceiling -2 dBFS (HyperFrames AAC-encodes twice; transients overshoot)
knee, ceil = 10 ** (-3.5 / 20), 10 ** (-2 / 20)
over = np.abs(mix) > knee
mix[over] = np.sign(mix[over]) * (knee + (ceil - knee) * np.tanh((np.abs(mix[over]) - knee) / (ceil - knee)))
sf.write(os.path.join(ROOT, "assets", "mix.wav"), mix.astype(np.float32), SR, subtype="PCM_16")

print(f"timing.js: {len(ids)} scenes, {len(cues)} cues, duration {duration:.2f}s")
vdb = voice_db()
print("SFX levels (loudest 50 ms vs voice speech level; brightness = spectral centre):")
for name in sorted({c["sfx"] for c in cues}):
    a, sr_ = sf.read(os.path.join(ROOT, "assets", "sfx", name + ".wav"))
    a = a.mean(1) if a.ndim > 1 else a
    g = max(c["gain"] for c in cues if c["sfx"] == name)
    lv = 20 * np.log10(loudest(name) * g + 1e-9) - vdb
    spec = np.abs(np.fft.rfft(a)); fr = np.fft.rfftfreq(len(a), 1 / sr_)
    br = (spec * fr).sum() / (spec.sum() + 1e-9)
    flag = "  <- louder than the house limit" if lv > -6 else ("  <- bright/hissy for a cut sound" if br > 2500 and lv > -30 else "")
    print(f"  {name:10s} {lv:+6.1f} dB  {br:5.0f} Hz{flag}")
print(f"mix.wav peak {20 * np.log10(np.abs(mix).max()):.2f} dBFS")
for sid in ids:
    print(f"  {sid:10s} {scenes[sid]['start']:6.2f} -> {scenes[sid]['end']:6.2f}")
