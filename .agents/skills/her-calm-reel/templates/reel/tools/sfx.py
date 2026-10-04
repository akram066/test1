"""Soft procedural sound kit for the women's page (no samples, no licences). 48 kHz WAVs in assets/sfx/.

  air     breathy whoosh for transitions        chime   two soft bell partials (reminders, key lines)
  page    paper page turn                       drop    single water drop (water, calm)
  pluck   warm muted string pluck (ticks)       pop     tiny soft pop (items appearing)
  bloom   slow airy swell into a scene          drone   warm major-ish pad, seamless loop (bed)
  wind    long soft gust that swirls across     twinkle tiny high glints (stars, light, a kind word)
  bell    soft little-bell alarm (never harsh)  tick    tiny soft tick (counting)
  cloth   fabric slide (blankets, curtains)     birds   distant morning chirps
  riser   slow airy swell with a rising tone    clink   spoon on a ceramic bowl
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


def pour(d=1.3):
    """Water into a glass: a bubbly trickle whose pitch rises as the glass fills."""
    t = t_axis(d) / d
    env = smooth(t / 0.12) * (1 - smooth((t - 0.75) / 0.25))
    out = bandish(noise(len(t)), 900, 3800) * env * 0.6
    for k in range(18):
        at = int((0.05 + 0.85 * k / 18 + 0.02 * rng.random()) * d * SR)
        f = 900 + 900 * k / 18 + 200 * rng.random()
        tt = np.arange(int(0.05 * SR)) / SR
        b = np.sin(2 * np.pi * (f + 3000 * tt) * tt) * np.exp(-tt * 70)
        out[at:at + len(b)] += 0.35 * b[: len(out) - at]
    return out


def click(d=0.3):
    """A soft, muffled lamp switch (felt, not heard): no transient bite."""
    t = t_axis(d)
    a = onepole_lp(noise(len(t)), 1400) * np.exp(-t * 90)
    b = np.sin(2 * np.pi * 180 * t) * np.exp(-t * 45) * 0.5
    return (a + b) * np.minimum(1, t / 0.004)


def ripple(d=2.2):
    """A drop meeting still water, then a slow widening swell."""
    t = t_axis(d)
    tone = sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t * k) for f, a, k in ((523.3, 0.6, 2.2), (659.3, 0.4, 2.6), (784, 0.25, 3.2)))
    sw = bandish(noise(len(t)), 250, 1800) * smooth(t / 0.6) * (1 - smooth((t - 0.9) / 1.3)) * 0.5
    return drop(d) * 0.8 + tone * np.minimum(1, t / 0.05) * 0.5 + sw


def bubbles(d=1.4):
    """Soft rising bubbles: the products letting go."""
    t = t_axis(d)
    out = np.zeros(len(t))
    for k in range(9):
        at = int((0.05 + 0.1 * k + 0.04 * rng.random()) * SR)
        tt = np.arange(int(0.16 * SR)) / SR
        f = 380 + 120 * k + 900 * tt / 0.16
        b = np.sin(np.cumsum(2 * np.pi * f / SR)) * np.sin(np.pi * tt / 0.16) ** 2
        out[at:at + len(b)] += (0.9 - 0.06 * k) * b[: len(out) - at]
    return out


def bell(d=2.2):
    """a soft, rounded alarm: three quick small-bell taps that fade (never a harsh ring)"""
    t = t_axis(d)
    out = np.zeros(len(t))
    for k, at in enumerate((0.0, 0.16, 0.32, 0.48)):
        tt = np.clip(t - at, 0, None)
        g = (1 - 0.18 * k) * (t >= at)
        for f, a, dec in ((1568, 1.0, 5.5), (2350, 0.35, 8.0), (3136, 0.12, 11.0)):
            out += g * a * np.sin(2 * np.pi * f * tt) * np.exp(-tt * dec) * np.minimum(1, tt / 0.003)
    return onepole_lp(out, 5200)


def tick(d=0.12):
    t = t_axis(d)
    return bandish(noise(len(t)), 1800, 5200) * np.exp(-t * 70) * np.minimum(1, t / 0.001)


def cloth(d=1.0):
    """fabric slide: filtered noise with a slow swell and a soft grain"""
    t = t_axis(d) / d
    env = smooth(t / 0.35) * (1 - smooth((t - 0.45) / 0.55))
    n = len(t)
    grain = 0.6 + 0.4 * np.abs(np.sin(2 * np.pi * 23 * t * d + 3 * np.sin(2 * np.pi * 3 * t * d)))
    l = bandish(noise(n), 500, 3800) * env * grain
    r = bandish(noise(n), 520, 4000) * env * grain
    return l, r


def birds(d=2.4):
    """two or three distant morning chirps"""
    t = t_axis(d)
    out = np.zeros(len(t))
    for at, f0, f1, ln in ((0.10, 3600, 4400, 0.09), (0.24, 3900, 4700, 0.07), (0.95, 3300, 4300, 0.11), (1.12, 3500, 4600, 0.08), (1.9, 3800, 4500, 0.08)):
        m = (t >= at) & (t < at + ln)
        tt = t[m] - at
        f = f0 + (f1 - f0) * np.sin(np.pi * tt / ln)
        ph = 2 * np.pi * np.cumsum(f) / SR
        out[m] += np.sin(ph) * np.sin(np.pi * tt / ln) ** 2
    return onepole_lp(out, 6000)


def riser(d=2.6):
    """a long, slow airy swell with a soft rising tone (the stretch)"""
    t = t_axis(d)
    u = t / d
    env = smooth(u / 0.7) * (1 - smooth((u - 0.75) / 0.25))
    n = len(t)
    air_ = (bandish(noise(n), 400, 2400) * (1 - u) + bandish(noise(n), 1300, 5000) * u) * 0.8
    f = 330 + 110 * u
    tone = 0.25 * np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.12 * np.sin(2 * np.pi * np.cumsum(f * 1.5) / SR)
    return (air_ + tone) * env


def clink(d=1.2):
    """a spoon touching a ceramic bowl, very soft"""
    t = t_axis(d)
    out = np.zeros(len(t))
    for f, a, dec in ((2790, 1.0, 9.0), (4180, 0.45, 13.0), (6120, 0.15, 18.0), (1530, 0.3, 7.0)):
        out += a * np.sin(2 * np.pi * f * t) * np.exp(-t * dec)
    return onepole_lp(out * np.minimum(1, t / 0.002), 7000)


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
    save("pour", pour())
    save("click", click())
    save("ripple", ripple())
    save("bubbles", bubbles())
    save("bell", bell())
    save("tick", tick())
    save("cloth", *cloth())
    save("birds", birds())
    save("riser", riser())
    save("clink", clink())


if __name__ == "__main__":
    main()
