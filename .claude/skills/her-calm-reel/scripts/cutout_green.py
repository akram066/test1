# chroma-green cut-out for generated product photos: cutout_green.py in.jpg out.png target_width [blur]  (needs numpy, pillow, scipy)
import sys, numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as nd
src, out, tw = sys.argv[1], sys.argv[2], int(sys.argv[3])
blur_in = len(sys.argv) > 4 and sys.argv[4] == 'blur'
im = Image.open(src).convert('RGB'); a = np.asarray(im).astype(np.float32)
r, g, b = a[..., 0], a[..., 1], a[..., 2]
gr = g - np.maximum(r, b)                      # greenness
alpha = np.clip((16 - gr) / 10, 0, 1)          # 1 = object, 0 = backdrop
ratio = g / (np.maximum(r, b) + 1)
alpha = np.where((ratio > 1.22) & (g > 18), np.minimum(alpha, np.clip((1.32 - ratio) / 0.1, 0, 1)), alpha)
core = alpha > 0.5
lab, n = nd.label(core); sizes = nd.sum(core, lab, range(1, n + 1))
keep = lab == (1 + int(np.argmax(sizes)))
filled = nd.binary_fill_holes(keep); holes = filled & ~keep
hl, hn = nd.label(holes); hs = nd.sum(holes, hl, range(1, hn + 1)); area = keep.sum()
small = np.isin(hl, [i + 1 for i, v in enumerate(hs) if v < 0.004 * area]); keep = keep | small
keep = nd.binary_opening(keep, iterations=2)
lab, n = nd.label(keep); sizes = nd.sum(keep, lab, range(1, n + 1)); keep = lab == (1 + int(np.argmax(sizes)))
# soft edge: alpha inside the kept region (with a thin feather around it)
grown = nd.binary_dilation(keep, iterations=3)
A = np.where(keep, np.maximum(alpha, nd.binary_erosion(keep, iterations=4).astype(np.float32)), np.where(grown, alpha * 0.85, 0))
A = np.asarray(Image.fromarray((A * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))).astype(np.float32) / 255
# despill: pull green down to the larger of red and blue near edges and on spill
g2 = np.minimum(g, np.maximum(r, b) + 1)
rgb = np.stack([r, g2, b], -1)
ys, xs = np.where(A > 0.05); y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
pad = 12; y0, x0 = max(0, y0 - pad), max(0, x0 - pad); y1, x1 = min(a.shape[0], y1 + pad), min(a.shape[1], x1 + pad)
rgba = np.dstack([rgb, A * 255])[y0:y1, x0:x1].clip(0, 255).astype(np.uint8)
o = Image.fromarray(rgba, 'RGBA')
if blur_in:   # make faint printed lines unreadable, keep the paper edges sharp
    rgbI = o.convert('RGB').filter(ImageFilter.GaussianBlur(7)); m = Image.fromarray((nd.binary_erosion(np.asarray(o.split()[3]) > 128, iterations=30) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(10))
    base = o.convert('RGB'); base.paste(rgbI, (0, 0), m); o = Image.merge('RGBA', (*base.split(), o.split()[3]))
o = o.resize((tw, round(o.height * tw / o.width)), Image.LANCZOS)
o.save(out, optimize=True); print(out, o.size)
