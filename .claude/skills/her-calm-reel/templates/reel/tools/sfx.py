"""Soft procedural sound kit for the women's page (no samples, no licences). 48 kHz WAVs in assets/sfx/.

  air     breathy whoosh for transitions        chime   two soft bell partials (reminders, key lines)
  page    paper page turn                       drop    single water drop (water, calm)
  pluck   warm muted string pluck (ticks)       pop     tiny soft pop (items appearing)
  bloom   slow airy swell into a scene          drone   warm major-ish pad, seamless loop (bed)
  wind    long soft gust that swirls across     twinkle tiny high glints (stars, light, a kind word)
No hard impacts or sub hits: this page never slams.
"""
import os
import numpy as np
import soundfile as sf

SR = 48000
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "sfx")
rng = np.random.default_rng(11)


def t_axis(d):
    return np.arange(int(d * SR)) / SR


def noise(n):
    return rng.uniform(-1, 1, n)


def smooth(x):
    x = np.clip(x, 0, 1)
    return x * x * (3 - 2 * x)


def onepole_lp(x, fc):
    a = np.exp(-2 * np.pi * fc / SR)
    y, out = 0.0, np.zeros_like(x)
    for i, v in enumerate(x):
        y = (1 - a) * v + a * y
        out[i] = y
    return out


def bandish(x, lo, hi):
    return onepole_lp(x, hi) - onepole_lp(x, lo)


def save(name, left, right=None):
    right = left if right is None else right
    st = np.stack([left, right], axis=1)
    st = st / (np.abs(st).max() + 1e-9) * 0.85
    sf.write(os.path.join(OUT, f"{name}.wav"), st.astype(np.float32), SR, subtype="PCM_16")
    print(f"  sfx/{name}.wav {len(left) / SR:.2f}s")


def air(d=1.1):
    t = t_axis(d) / d
    env = smooth(t / 0.55) ** 1.5 * (1 - smooth((t - 0.55) / 0.45)) ** 1.3
    n = len(t)
    l = bandish(noise(n), 300, 2400) * env
    r = bandish(noise(n), 320, 2600) * env
    pan = 0.5 + 0.35 * np.sin(np.pi * (t - 0.5))
    return l * (1 - pan) * 2, r * pan * 2


def chime(d=2.6):
    t = t_axis(d)
    out = np.zeros(len(t))
    for f, a, dec in ((880, 1.0, 2.2), (1318.5, 0.55, 3.0), (2637, 0.18, 5.0), (1760, 0.25, 3.6)):
        out += a * np.sin(2 * np.pi * f * t) * np.exp(-t * dec)
    return out * np.minimum(1, t / 0.004)


def page(d=0.5):
    t = t_axis(d) / d
    env = np.sin(np.pi * np.minimum(1, t * 1.4)) ** 2 * np.exp(-t * 2.5)
    flutter = 1 + 0.35 * np.sin(2 * np.pi * 26 * t * d)
    return bandish(noise(len(t)), 900, 6000) * env * flutter


def drop(d=0.45):
    t = t_axis(d)
    f = 650 + 1400 * np.exp(-t * 28)
    ph = np.cumsum(2 * np.pi * f / SR)
    return np.sin(ph) * np.exp(-t * 14) * np.minimum(1, t / 0.002)


def pluck(d=0.6):
    t = t_axis(d)
    return (np.sin(2 * np.pi * 392 * t) + 0.4 * np.sin(2 * np.pi * 784 * t)) * np.exp(-t * 9) * np.minimum(1, t / 0.003)


def pop(d=0.18):
    t = t_axis(d)
    f = 420 + 500 * np.exp(-t * 60)
    return np.sin(np.cumsum(2 * np.pi * f / SR)) * np.exp(-t * 30)


def bloom(d=1.8):
    t = t_axis(d) / d
    env = smooth(t / 0.8) ** 2 * (1 - smooth((t - 0.8) / 0.2))
    tone = sum(np.sin(2 * np.pi * f * t * d) for f in (261.6, 392.0, 523.3)) / 3
    return (bandish(noise(len(t)), 500, 4000) * 0.6 + tone * 0.5) * env


def wind(d=1.9):
    t = t_axis(d) / d
    env = smooth(t / 0.35) * (1 - smooth((t - 0.45) / 0.55)) ** 1.2
    n = len(t)
    gust = 0.75 + 0.25 * np.sin(2 * np.pi * (2.1 * t * d + 0.3 * np.sin(2 * np.pi * 0.9 * t * d)))
    l = (bandish(noise(n), 180, 1300) + 0.35 * bandish(noise(n), 1500, 4200)) * env * gust
    r = (bandish(noise(n), 200, 1400) + 0.35 * bandish(noise(n), 1600, 4400)) * env * gust
    pan = smooth(t)  # sweeps left -> right with the leaves
    return l * (1.2 - pan), r * (0.2 + pan)


def twinkle(d=1.6):
    t = t_axis(d)
    out = np.zeros(len(t))
    for k, (f, at) in enumerate(((2093, 0.0), (2637, 0.09), (3136, 0.2), (2349, 0.33), (3520, 0.45))):
        tt = np.clip(t - at, 0, None)
        out += (0.8 - 0.1 * k) * np.sin(2 * np.pi * f * tt) * np.exp(-tt * 7) * (t >= at)
    return out * np.minimum(1, t / 0.003)


def drone(d=16):
    n = SR * d
    t = np.arange(n) / SR
    cyc = lambda hz: round(hz * d) / d  # whole cycles per loop -> seamless
    chord = [(cyc(130.8), 1.0), (cyc(196.0), 0.6), (cyc(261.6), 0.45), (cyc(329.6), 0.3), (cyc(392.0), 0.15)]
    lfo = lambda k: 0.75 + 0.25 * np.sin(2 * np.pi * t * k / d)
    l = sum(a * np.sin(2 * np.pi * f * t) * lfo(1 + i % 2) for i, (f, a) in enumerate(chord))
    r = sum(a * np.sin(2 * np.pi * f * t + 0.6) * lfo(2 - i % 2) for i, (f, a) in enumerate(chord))
    return l, r


def main():
    os.makedirs(OUT, exist_ok=True)
    print("SFX (soft kit):")
    save("air", *air())
    save("chime", chime())
    save("page", page())
    save("drop", drop())
    save("pluck", pluck())
    save("pop", pop())
    save("bloom", bloom())
    save("wind", *wind())
    save("twinkle", twinkle())
    save("drone", *drone())


if __name__ == "__main__":
    main()
