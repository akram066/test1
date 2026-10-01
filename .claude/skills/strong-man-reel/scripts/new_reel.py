#!/usr/bin/env python3
"""Scaffold a new reel project from this skill's template.

  python3 <skill>/scripts/new_reel.py <slug> [--dest DIR]

Default destination: ./video-projects/<slug> when ./video-projects exists, else ./<slug>.
The template is the approved reference reel ("The habit no man talks about"): it builds and renders
as-is, so you start from a working composition and replace the script, scenes and objects.
"""
import argparse, json, os, re, shutil, sys

HERE = os.path.dirname(os.path.abspath(__file__))
TEMPLATE = os.path.join(os.path.dirname(HERE), "templates", "reel")

ap = argparse.ArgumentParser()
ap.add_argument("slug")
ap.add_argument("--dest")
args = ap.parse_args()
if not re.fullmatch(r"[a-z0-9][a-z0-9-]*", args.slug):
    sys.exit("slug must be lowercase letters, digits and dashes")
base = "video-projects" if os.path.isdir("video-projects") else "."
dest = os.path.abspath(args.dest or os.path.join(base, args.slug))
if os.path.exists(dest):
    sys.exit(f"{dest} already exists: pick another slug or remove it")
shutil.copytree(TEMPLATE, dest, ignore=shutil.ignore_patterns("__pycache__", "*.pyc"))
# the template keeps fonts and gsap in static/ (repos often gitignore assets/); projects expect assets/
os.rename(os.path.join(dest, "static"), os.path.join(dest, "assets"))
for d in ("renders", "snapshots", os.path.join("assets", "sfx")):
    os.makedirs(os.path.join(dest, d), exist_ok=True)
json.dump({"id": "reel", "name": args.slug, "width": 1080, "height": 1920, "fps": 30},
          open(os.path.join(dest, "meta.json"), "w"), indent=2)
cfg_path = os.path.join(dest, "reel.config.json")
cfg = json.load(open(cfg_path))
cfg.setdefault("meta", {})["slug"] = args.slug
json.dump(cfg, open(cfg_path, "w"), indent=2, ensure_ascii=False)
print(f"Created {dest}")
print("Next: edit reel.config.json (script, scenes, cues), make the voice, then:")
print(f"  cd {dest} && python3 tools/build.py --voice --sfx && npx hyperframes lint")
