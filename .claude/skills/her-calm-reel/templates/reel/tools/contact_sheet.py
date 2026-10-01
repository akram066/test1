"""Contact sheet of review frames with the safe-margin box drawn on each (needs: pip install pillow).

  python3 tools/contact_sheet.py out.png frame1.png frame2.png ...
"""
import os, sys
from PIL import Image, ImageDraw

out, files = sys.argv[1], sys.argv[2:]
w, h, cols = 360, 640, min(4, len(files))
rows = (len(files) + cols - 1) // cols
sheet = Image.new("RGB", (cols * w, rows * (h + 30)), (40, 40, 40))
d = ImageDraw.Draw(sheet)
for i, f in enumerate(files):
    x, y = (i % cols) * w, (i // cols) * (h + 30)
    sheet.paste(Image.open(f).convert("RGB").resize((w, h)), (x, y + 30))
    sx, sy = 90 * w / 1080, 120 * h / 1920  # 90 px sides, 120 px top/bottom
    d.rectangle([x + sx, y + 30 + sy, x + w - sx, y + 30 + h - sy], outline=(0, 160, 255))
    d.text((x + 6, y + 8), os.path.basename(f), fill=(255, 255, 255))
sheet.save(out)
print(out)
