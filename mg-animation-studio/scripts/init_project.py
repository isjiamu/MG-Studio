#!/usr/bin/env python3
"""Create an isolated film project; never overwrite an existing directory.

Default creates an empty creative entry so every new film starts from its own
world and visual language. Use --demo to inspect one of the curated high-craft
showcases covering different visual worlds and technical stacks.
"""
import argparse, json, pathlib, shutil

DEMOS = {
    "industrial": "LESS, BUT BETTER · 少，却更好 — 纯 Canvas 2D 精密工业材质、机械阻尼与 ASMR 原创配乐 (22s / 60fps)",
    "atelier":    "MATTER OF LIGHT · 元素之形 — Three.js 实时 PBR/GLSL 雕塑 × 瑞士排印三明治纵深与电子配乐 (28s / 60fps / GPU)",
    "anc":        "主动降噪 · 原理演示 — 实拍/渲染剖面素材 × 精确声学相消波形 (15s / 30fps / DOM+SVG)",
    "gta6":       "GTA VI · 阳光之下 — 60s 预告片级多图分层叙事、120 BPM 合成器配乐与中文旁白压低混音 (60s / 30fps / Canvas+layers)",
}

p = argparse.ArgumentParser()
p.add_argument("destination", nargs="?", help="New output project directory (must not exist)")
p.add_argument("--capture", choices=["canvas", "dom"], default="canvas",
               help="For blank projects: canvas (<canvas id=stage>) or dom (<div id=stage> HTML/SVG/CSS/WebGL)")
p.add_argument("--demo", choices=list(DEMOS.keys()), default=None,
               help="Optional curated high-craft showcase to initialize")
p.add_argument("--list-demos", action="store_true", help="List available high-craft demos and exit")
a = p.parse_args()

if a.list_demos:
    for k, v in DEMOS.items():
        print(f"{k:12s}  {v}")
    raise SystemExit(0)

if not a.destination:
    p.error("destination is required (or pass --list-demos)")

target = pathlib.Path(a.destination).expanduser().resolve()
if target.exists():
    p.error(f"Destination already exists: {target}")

skill_root = pathlib.Path(__file__).resolve().parents[1]
starter = skill_root / "assets" / "starter"
shutil.copytree(starter, target, ignore=shutil.ignore_patterns("node_modules", "out", "__pycache__", ".DS_Store"))

if a.demo:
    demo_dir = skill_root / "assets" / "demos" / a.demo
    if not demo_dir.exists():
        p.error(f"Demo not found: {demo_dir}")
    shutil.copytree(demo_dir, target, dirs_exist_ok=True, ignore=shutil.ignore_patterns("node_modules", "out", "__pycache__", ".DS_Store"))
    if a.demo == "atelier":
        pkg_path = target / "package.json"
        pkg = json.loads(pkg_path.read_text())
        pkg.setdefault("dependencies", {})["three"] = "^0.187.0"
        pkg_path.write_text(json.dumps(pkg, ensure_ascii=False, indent=2) + "\n")
        lock = target / "package-lock.json"
        if lock.exists():
            lock.unlink()
else:
    if a.capture == "dom":
        cfg_path = target / "film.json"
        cfg = json.loads(cfg_path.read_text())
        cfg["capture"] = "dom"
        cfg_path.write_text(json.dumps(cfg, ensure_ascii=False, indent=2) + "\n")

print(target)
if a.demo == "atelier":
    print("Next: npm install && npx playwright install chromium")
else:
    print("Next: npm ci && npx playwright install chromium")
if a.demo:
    cfg = json.loads((target / "film.json").read_text())
    score_step = "npm run score && " if cfg.get("audio", {}).get("mode", "sound") != "silent" else ""
    print(f"Then: {score_step}npm run verify && npm run stills && npm run render && npm run check")
else:
    print("Then: write BRIEF.md + STORYBOARD.md, craft src/film.js and film.json,")
    print("      npm run stills -> visually inspect -> set draft=false -> npm run render && npm run check")
