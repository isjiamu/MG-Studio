# 高水准范例库（Craft Benchmarks）

本 Skill 内置 4 支精选可运行范例，覆盖 **4 种截然不同的视觉世界、题材类型与技术媒介**：

> **定位说明**：这些范例展示的是**完成度、材质、空间、编舞与声画同步的工艺标杆**，用来展示这套工具链能做到什么高度——**它们不是风格菜单，也不是构图模板**。接到新需求时，请从新题材本身出发，自由发明属于它的视觉语言；默认初始化仍是空白入口。

| Demo 名称 | 作品 | 视觉世界与题材 | 技术栈与工艺亮点 | 规格 |
|---|---|---|---|---|
| `industrial` | 《LESS, BUT BETTER · 少，却更好》 | 日光陶瓷白与精密工业设计宣言（机械质感美学） | **纯 Canvas 2D**（零额外依赖）：拉丝铝旋钮径向高光、325 孔 CNC 声学矩阵波纹、双旋钮示波器与 VU 表、欠阻尼机械卡位弹簧、定制物理 ASMR 声景 (`audio/compose.py`) | 22s · 60fps · 有声 |
| `atelier` | 《MATTER OF LIGHT · 元素之形》 | 画廊雕塑 × 编辑排印概念短片 | **Three.js 实时 GPU WebGL2 + DOM 三明治纵深**：PBR 清漆/虹彩材质 + 自定义 GLSL 液态铬/发光玻璃结/色散棱镜 + 背后巨字/中层 3D/前景排印/35mm 颗粒 + 定制电子配乐 (`audio/compose.py`) | 28s · 60fps · GPU · 有声 |
| `gta6` | 《GTA VI · 阳光之下》 | 60 秒电影预告片级多图叙事概念短片（官方宣传图仅作范例演示，见工程内 `SOURCES.md`） | **Canvas 2D + `lib/layers.js` 多图分层**：8 镜电影化节奏、斜切转场、角色登场、三地巡游、快切高潮、定时字幕、120 BPM 原创合成器浪潮配乐 (`audio/compose.py`) × 中文旁白自动压低混音 (`audio.voice` + ducking) | 60s · 30fps · 有声含旁白 |
| `anc` | 《主动降噪 · 原理演示》 | 深灰蓝工作室光影 × 硬件机制科普 | **DOM/SVG + 工作室透明剖面素材**：整机与耳罩剖面平滑推近过渡、部件脉冲高亮与信号流路径、实时同轴相消正弦波形数学演算 | 15s · 30fps · 静音 |

## 运行与体验

```bash
# 查看范例清单
python3 "$SKILL_DIR/scripts/init_project.py" --list-demos

# 初始化任意一支范例到新目录
python3 "$SKILL_DIR/scripts/init_project.py" ./demo-gta6 --demo gta6
cd ./demo-gta6
npm ci && npx playwright install chromium   # atelier 需用 npm install（包含 three）
npm run score                               # industrial / atelier / gta6 含定制声景脚本；anc 为静音跳过此步
npm run verify
npm run stills
npm run render && npm run check
```

## 可以从它们身上学到的跨风格经验

- **`industrial`**：不依赖外部图片或 3D 引擎，单靠 Canvas 2D 的光影梯度、微肌理、物理阻尼和咬合动作的音效，也能做出极强的实体质感。
- **`atelier`**：在支持 GPU WebGL 的机器上，把 Three.js 实时物理材质夹在前后两层 HTML/CSS 精密排印之间，能打开电影级 3D 动态设计的上限。
- **`gta6`**：完整示范了长篇（60 秒）多图素材管理、字幕时间表、原创分段配乐与中文旁白自动压低（ducking）的全链路协作。
- **`anc`**：科普与产品拆解可以把“高质感静态/剖面视觉素材”和“代码精确驱动的动态数学模型”融合，既严谨又具备工业美学。
