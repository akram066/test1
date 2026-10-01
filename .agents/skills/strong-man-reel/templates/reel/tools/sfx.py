"""Procedural sound design (no samples, no licences). Writes 48 kHz WAVs to assets/sfx/."""
import os
import numpy as np
import soundfile as sf

SR = 48000
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "sfx")
rng = np.random.default_rng(7)


def t_axis(d):
    return np.arange(int(d * SR)) / SR


def noise(n):
    return rng.uniform(-1, 1, n)


def smooth(x):
    return x * x * (3 - 2 * x)


def biquad(x, kind, f, q=0.7):
    """Per-sample RBJ biquad; f may be a scalar or an array (swept)."""
    f = np.broadcast_to(np.asarray(f, dtype=float), x.shape)
    y = np.zeros_like(x)
    x1 = x2 = y1 = y2 = 0.0
    for i in range(len(x)):
        w0 = 2 * np.pi * min(f[i], SR * 0.45) / SR
        a = np.sin(w0) / (2 * q)
        c = np.cos(w0)
        if kind == "bp":
            b0, b1, b2 = a, 0, -a
        elif kind == "lp":
            b0, b1, b2 = (1 - c) / 2, 1 - c, (1 - c) / 2
        else:
            b0, b1, b2 = (1 + c) / 2, -(1 + c), (1 + c) / 2
        a0, a1, a2 = 1 + a, -2 * c, 1 - a
        yy = (b0 * x[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0
        x2, x1, y2, y1 = x1, x[i], y1, yy
        y[i] = yy
    return y


def save(name, left, right=None):
    right = left if right is None else right
    st = np.stack([left, right], axis=1)
    st = st / (np.abs(st).max() + 1e-9) * 0.89
    sf.write(os.path.join(OUT, f"{name}.wav"), st.astype(np.float32), SR, subtype="PCM_16")
    print(f"  sfx/{name}.wav {len(left) / SR:.2f}s")


def whoosh(d=0.75, peak=0.55):
    t = t_axis(d) / d
    up = smooth(np.clip(t / peak, 0, 1))
    down = smooth(np.clip((t - peak) / (1 - peak), 0, 1))
    env = np.where(t < peak, up ** 2, (1 - down) ** 1.6)
    f = np.where(t < peak, 250 + 2800 * up, 3050 - 2400 * down)
    pan = 0.5 + 0.4 * np.sin(np.pi * (t - 0.5))
    n = len(t)
    return biquad(noise(n), "bp", f, 1.3) * env * (1 - pan), biquad(noise(n), "bp", f * 1.04, 1.3) * env * pan


def thump(d=0.7, f0=95, f1=40, decay=7, click=0.5):
    t = t_axis(d)
    ph = np.cumsum(2 * np.pi * (f1 + (f0 - f1) * np.exp(-t * 18)) / SR)
    body = np.sin(ph) * np.exp(-t * decay) * np.minimum(1, t / 0.003)
    c = biquad(noise(len(t)), "lp", 1800) * np.exp(-t * 60) * click
    return body + c


def sub(d=2.6):
    t = t_axis(d)
    ph = np.cumsum(2 * np.pi * (30 + 34 * np.exp(-t * 3.2)) / SR)
    return (np.sin(ph) + 0.35 * np.sin(2 * ph)) * np.minimum(1, t / 0.008) * np.exp(-t * 1.6)


def crack(d=0.9):
    t = t_axis(d)
    out = np.zeros(len(t))
    # a burst of sharp high clicks + a glassy ringing tail
    for i in range(26):
        at = int((0.004 * i + 0.03 * rng.random() * (i / 26) ** 2) * SR)
        ln = int(0.012 * SR)
        seg = noise(ln) * np.exp(-np.arange(ln) / SR * 400) * (1 - i / 30)
        out[at:at + ln] += seg[: len(out) - at]
    out = biquad(out, "hp", 2500, 0.7)
    ring = sum(np.sin(2 * np.pi * f * t) * np.exp(-t * dcy) for f, dcy in [(3150, 9), (4420, 12), (5710, 15)])
    return out + 0.25 * ring * np.minimum(1, t / 0.002) + 0.4 * thump(d, 140, 60, 18, 0)


def click(d=0.12):
    t = t_axis(d)
    a = biquad(noise(len(t)), "bp", 3800, 4) * np.exp(-t * 260)
    b = np.zeros(len(t))
    s = int(0.035 * SR)
    b[s:] = biquad(noise(len(t) - s), "bp", 2200, 4) * np.exp(-t[: len(t) - s] * 300) * 0.8
    return a + b + 0.4 * np.sin(2 * np.pi * 900 * t) * np.exp(-t * 120)


def flip(d=0.22):
    t = t_axis(d) / d
    env = np.sin(np.pi * np.minimum(1, t * 1.6)) ** 2 * np.exp(-t * 3)
    return biquad(noise(len(t)), "bp", 1800 + 2600 * t, 1.1) * env


def snap(d=0.5):
    t = t_axis(d)
    tw = np.sin(2 * np.pi * (520 - 260 * t) * t) * np.exp(-t * 14)
    return 0.6 * tw + biquad(noise(len(t)), "hp", 3000) * np.exp(-t * 90)


def riser(d=1.4):
    t = t_axis(d) / d
    env = smooth(t) ** 2 * (1 - smooth(np.clip((t - 0.93) / 0.07, 0, 1)))
    return biquad(noise(len(t)), "bp", 400 + 5000 * t ** 2, 2.2) * env + 0.3 * np.sin(2 * np.pi * (90 + 200 * t ** 2) * t * d) * env


def tick(d=0.04):
    t = t_axis(d)
    return biquad(noise(len(t)), "bp", 3300, 3) * np.exp(-t * 200)


def slam(d=0.9):
    t = t_axis(d)
    rattle = biquad(noise(len(t)), "bp", 700, 3) * np.exp(-t * 16) * 0.35
    return thump(d, 110, 45, 6, 0.9) + rattle


def drone(d=16):
    n = SR * d
    t = np.arange(n) / SR
    cyc = lambda hz: round(hz * d) / d  # whole cycles per loop -> seamless
    tone = sum(a * np.sin(2 * np.pi * cyc(f) * t) for f, a in [(41.2, 1), (61.8, 0.45), (82.4, 0.3), (123.6, 0.08)])
    xf = SR * 2
    raw = np.cumsum(noise(n + xf) * 0.02)
    raw = raw - np.convolve(raw, np.ones(4801) / 4801, "same")  # remove drift (brown-ish)
    raw = biquad(raw, "lp", 220)
    bed = raw[:n].copy()
    ramp = smooth(np.arange(xf) / xf)
    bed[:xf] = raw[:xf] * ramp + raw[n:n + xf] * (1 - ramp)
    breath = 0.8 + 0.2 * np.sin(2 * np.pi * t / d)
    return (tone * 0.5 + bed * 5) * breath, (tone * 0.5 + bed * 4.5) * breath


def ring(d=0.7):
    """Alarm-clock bell: two detuned metallic partials, hammered at 22 Hz, quick decay."""
    t = t_axis(d)
    tone = sum(a * np.sin(2 * np.pi * f * t) for f, a in [(2350, 1), (2390, 0.8), (3720, 0.35), (5130, 0.15)])
    hammer = 0.55 + 0.45 * np.sign(np.sin(2 * np.pi * 22 * t))
    return tone * hammer * np.minimum(1, t / 0.004) * np.exp(-t * 5)


def pop(d=0.16):
    """Cold notification blip: a short sine drop with a soft click."""
    t = t_axis(d)
    ph = np.cumsum(2 * np.pi * (1500 - 600 * np.minimum(1, t / 0.05)) / SR)
    return np.sin(ph) * np.minimum(1, t / 0.002) * np.exp(-t * 34) + 0.2 * tick(d)


def pulse(d=0.75):
    """Heartbeat (lub-dub) for the phone glow."""
    out = thump(d, 70, 38, 11, 0.05)
    s = int(0.2 * SR)
    out[s:] += 0.65 * thump(d, 80, 42, 13, 0.05)[: len(out) - s]
    return out


def drawer(d=0.55):
    """Wooden drawer sliding shut: band-passed rumble with a rising pitch."""
    t = t_axis(d) / d
    env = np.sin(np.pi * np.minimum(1, t * 1.15)) ** 1.5
    return biquad(noise(len(t)), "bp", 260 + 380 * t, 1.6) * env + 0.3 * biquad(noise(len(t)), "lp", 140) * env


def main():
    os.makedirs(OUT, exist_ok=True)
    print("SFX:")
    save("whoosh", *whoosh())
    save("impact", thump())
    save("stamp", thump(0.8, 120, 42, 5, 0.35))
    save("sub", sub())
    save("crack", crack())
    save("click", click())
    save("flip", flip())
    save("snap", snap())
    save("riser", riser())
    save("tick", tick())
    save("slam", slam())
    save("drone", *drone())
    save("ring", ring())
    save("pop", pop())
    save("pulse", pulse())
    save("drawer", drawer())


if __name__ == "__main__":
    main()
