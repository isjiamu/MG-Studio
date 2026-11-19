#!/usr/bin/env python3
"""Create an isolated film; never overwrite an existing directory."""
import argparse, pathlib, shutil, json
p=argparse.ArgumentParser()
p.add_argument("destination")
p.add_argument("--demo",choices=["blank","product","explainer","kinetic","story","industry"],default="blank",help="blank starts a new brief; named demos reproduce sample films")
a=p.parse_args();target=pathlib.Path(a.destination).expanduser().resolve()
if target.exists():p.error(f"Destination already exists: {target}")
source=pathlib.Path(__file__).resolve().parents[1]/"assets"/"starter"
shutil.copytree(source,target,ignore=shutil.ignore_patterns("node_modules","out","__pycache__"))
if a.demo=="blank":
 blank=source.parent/"blank"
 shutil.copy2(blank/"film.json",target/"film.json")
 shutil.copy2(blank/"film.js",target/"src"/"film.js")
if a.demo=="explainer":
 import json
 cfg=json.loads((target/"film.json").read_text());cfg.update(title="一束光，为什么会转弯？",demo="explainer")
 purposes=["提出折射问题","光进入另一种介质","传播速度变化","波前方向改变","法线与角度关系","解释与回顾"]
 for s,t in zip(cfg["scenes"],purposes):s["purpose"]=t
 (target/"film.json").write_text(json.dumps(cfg,ensure_ascii=False,indent=2)+"\n")
if a.demo=="kinetic":
 import json
 cfg=json.loads((target/"film.json").read_text())
 cfg.update(title="创意 × 代码 / MAKE IT MOVE",demo="kinetic",duration=16)
 cfg["scenes"]=[{"id":name,"from":i*4,"to":(i+1)*4} for i,name in enumerate(["form","rhythm","morph","resolve"])]
 cfg["cues"]=[x for x in cfg["cues"] if x["t"]<16]
 (target/"film.json").write_text(json.dumps(cfg,ensure_ascii=False,indent=2)+"\n")
if a.demo=="story":
 cfg=json.loads((target/"presets"/"story.json").read_text())
 (target/"film.json").write_text(json.dumps(cfg,ensure_ascii=False,indent=2)+"\n")
if a.demo=="industry":
 cfg=json.loads((target/"film.json").read_text())
 cfg.update(demo="industry",duration=24,fps=30,title="FARO / 微光 — 产品、架构与数据",width=1920,height=1080)
 cfg["safeInsets"]={"top":.04,"right":.04,"bottom":.04,"left":.04}
 cfg["dataset"]={"title":"每月处理量","unit":"万次","source":"内置演示数据","asOf":"2026-06-30","illustrative":True,"domain":[0,100],"rows":[{"label":f"{i+1}月","value":v} for i,v in enumerate([28,42,38,64,76,93])]}
 cfg["graph"]={"nodes":[{"id":f"n{i}","label":s} for i,s in enumerate(["采集","消息队列","处理引擎","指标服务","可视化"])],"edges":[{"from":f"n{i}","to":f"n{i+1}"} for i in range(4)]}
 purposes=["产品材质特写","分层细节","技术架构流向","动态图表与数字","变化趋势","品牌收束"]
 cfg["scenes"]=[{"id":f"shot-{i+1}","from":i*4,"to":(i+1)*4,"purpose":s} for i,s in enumerate(purposes)]
 (target/"film.json").write_text(json.dumps(cfg,ensure_ascii=False,indent=2)+"\n")
print(target)
print("Next: npm ci (if lockfile exists), otherwise npm install; npx playwright install chromium")
if a.demo=="blank":
 print("Write the current brief and storyboard; replace src/film.js and film.json. Inspect frames, then set draft=false.")
print("Then: npm run score; npm run verify; npm run stills; npm run render; npm run check")
