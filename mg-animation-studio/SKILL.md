---
name: mg-animation-studio
description: 当用户要把一个想法、产品、品牌、数据、技术机制或故事做成 MG 动画视频（带旁白、配乐或指定静音）时使用；也用于提升 MG 动画的美术质感与完成度。覆盖产品特写、品牌宣传、新品发布、技术架构、数据播报、财经解读、知识科普、设计宣言与手绘叙事。先按路由明确表达重心与可用能力，以宏观导演与美学经验构建属于本题材的视觉世界，再用确定性时间轴实现，交付可编辑工程与实际 MP4。仅查数据、做静态图或剪辑已有实拍片时不使用此流程。
---

# MG Animation Studio

目标：**做出暂停在任何一帧都像完整作品、播放时流畅有节奏且信息清晰的 MG 动画。**

本 Skill **不约束你的审美方向**，不规定某个行业该用什么色系、版式或风格。任何美学路线——极简日光、深色画廊、实拍微距、三维雕塑、精密矢量、手绘拼贴——做到极致都是好作品。下面的内容只做三件事：**定清路由、传授宏观创作经验、提供开放且可靠的渲染工具链与高水准范例**。

## 0. 路由（开工前先判断，写进 `BRIEF.md` 和 `film.json.route`）

大多数时候审美与准确并不冲突：把画面做得更有质感，并不需要牺牲事实。路由只在**真有取舍**时帮你做判断（详读 [routing.md](references/routing.md)）：

- **A. 表达重心（`route.emphasis`）**
  - `aesthetic`（审美与感染力优先）：品牌、发布、预告、艺术概念、设计宣言、故事短片，或用户明确要“放开做 / 追求惊艳”。事实不编造，其余服务画面与情绪，文案精炼，可自由构建工程。
  - `balanced`（默认，审美与准确并重）：科普、产品拆解、财经解读、技术架构。事实、因果与数据严格准确，同时把材质、空间、节奏与观感推到高水准。
  - `precise`（精确与读数优先）：教学图表、可测量数据播报、工程规范。刻度和比例严谨不失真，在清晰结构内追求出版物级的质感。
- **B. 视觉审片条件（`route.vision`）**
  - 能看图：每轮真看全分辨率静帧与关键中间态，用眼睛驱动迭代。
  - 不能看图：优先找宿主的视觉子代理帮忙看图；否则在风格帧阶段请用户看一眼再展开全片，不拿像素统计替代审美判断。
- **C. 技术媒介按视觉野心选**
  - 开工前先探测本机真实能力：GPU WebGL（Three.js PBR / GLSL 着色器）、DOM/SVG/CSS、Canvas 2D、本机与打包字体、分层摄影/生图素材、Python/NumPy 或外部声景。让画面需求决定技术，而不是让默认骨架限制发挥。

## 1. 宏观创作心法（完整阅读 [craft-philosophy.md](references/craft-philosophy.md)）

1. **先立世界与物质**：从题材本身的气质、文化、材质与光线长出视觉世界，而不依赖套话模板。
2. **注意力的节奏**：每一拍有清晰重心；追求冲击时敢于留白，信息丰富时用层次与时间编排让视线呼吸，用快慢疏密和停顿建立节奏。
3. **空间、光影与材质**：用一致的光源、接触阴影、表面质感、景深视差与统一颗粒建立画面厚度，让文字与主体共处同一空间。
4. **排印即造型**：字体的气质、字重反差、比例、字距与遮罩浮现本身就是视觉设计的一部分，中西文搭配彼此呼应。
5. **运动有性格、转场有逻辑**：按物体的重量与题材气质选择阻尼、减速或真实物理律动；尽量靠镜头、共享物件、色彩或声画节拍自然衔接。
6. **声画一体**：声音是另一半画面。精准咬合动作的音效、动态起伏和留白能成倍放大观感。
7. **用眼睛做导演评审**：全分辨率查看风格帧与关键中间态，以第一次观看的观众视角找出最影响质感与表达的 1–3 处去打磨。

## 2. 制作流程

1. **简报与定向**：明确核心信息、受众、观看场景、路由，以及**固定事实**（真实数据、产品外观、交付规格）与**自由创作区**（视觉世界、叙事、镜头、声音）。缺关键事实或必备素材才提问；风格与节奏自主决定。形式参考 [formats.md](references/formats.md)。
2. **分镜与风格帧**：先写简报和分镜，再直接把 2–3 张代表画面（主视觉帧 + 最难中间态）做到**成片质感**——真实字体、真实材质光影、真实素材。视觉审片认可后再铺开全片。
3. **实现与声音**：时间轴 `seek(t)` 为唯一时间来源。背景、主体、遮挡与注释分层管理。支持本地原创配乐、定制 Python/NumPy 声景脚本（`audio.script`）、外部音乐/旁白混音，或明确静音（`audio.mode:"silent"`）。接口见 [runtime.md](references/runtime.md)。
4. **审片与交付**：同时做**导演视觉评审**与**技术校验**（`npm run verify` + `npm run check`）。交付实际渲染的 MP4、可编辑工程、简报分镜、素材许可记录、复现命令与真实检查说明。详见 [quality.md](references/quality.md)。

## 3. 工程底线（仅 6 条硬约束）

1. 画面严格由 `seek(t)`、配置与已加载素材决定：禁用计时器、CSS 自发动画、跨帧累积状态和无种子随机数，`npm run verify` 通过。
2. 事实诚实：不编造指标、功能、案例或数据来源；示意与概念内容明确标注。
3. 素材与字体记录来源与许可；私有资料与密钥不进入公开包；不自动发布。
4. 交付实际编码可播放的 MP4；HTML 预览与静帧不能替代成片。
5. 没看过就不说看过，没听过就不说听过；如实报告未验收项。
6. 遵循宿主的浏览器、工具与权限规则；不强制依赖特定模型厂商或付费服务。

## 4. 起步与高水准范例

新作品默认初始化为**空白入口**，不把旧片版式带入新片。同时内置 4 支风格与技术栈迥异的**高水准可运行范例**（详见 [demos.md](references/demos.md)），作为工艺标杆与媒介参考：

- `industrial`：纯 Canvas 2D 精密工业材质、机械阻尼与定制 ASMR 声景（22s / 60fps）
- `atelier`：Three.js 实时 GPU WebGL2 PBR/GLSL 雕塑 × 编辑排印三明治纵深与电子配乐（28s / 60fps）
- `anc`：DOM/SVG + 工作室剖面渲染 × 实时声学相消波形科普（15s / 30fps）
- `gta6`：Canvas + `lib/layers.js` 60s 电影预告片级多图叙事 × 原创合成器配乐 × 中文旁白自动压低与字幕（60s / 30fps）

```bash
# 空白新片（Canvas 或 DOM/SVG/WebGL 捕获）
python3 "$SKILL_DIR/scripts/init_project.py" "$FILM_DIR"
python3 "$SKILL_DIR/scripts/init_project.py" "$FILM_DIR" --capture dom

# 或初始化一支高水准范例体验工艺与代码
python3 "$SKILL_DIR/scripts/init_project.py" --list-demos
python3 "$SKILL_DIR/scripts/init_project.py" ./demo-industrial --demo industrial

cd "$FILM_DIR" && npm ci && npx playwright install chromium   # atelier 用 npm install
npm run score     # 有声项目生成配乐（支持 film.json audio.script 定制声景）
npm run verify    # 确定性检查
npm run stills    # 关键静帧与接触表
# 新片完成审核并设 draft:false 后：
npm run render && npm run check
```

内置可选工具箱：`lib/look.js`（颗粒、暗角、bloom、加色光、辉光、接触阴影、发光垂幕、渐变映射、网点）、`lib/camera.js`（2.5D 视差相机与景深）、`lib/motion.js`（命名缓动、关键帧、错峰、弹簧）、`lib/layers.js`（图片预解码）、`film.json` 支持 `gpu:true`（硬件 WebGL）与多字体 `fonts[]`（本地文件 `src` 或本机已装 `local:true`）。

## 按需读取

| 需要解决的问题 | 读取 |
|---|---|
| 宏观美学、空间光影、排印、运动与审片心法 | [craft-philosophy.md](references/craft-philosophy.md) |
| 审美与精确路由、信息取舍、盲审策略 | [routing.md](references/routing.md) |
| 4 支高水准范例导览与运行说明 | [demos.md](references/demos.md) |
| 用途与表现形式匹配 | [formats.md](references/formats.md) |
| 分镜、动效因果与节奏 | [direction.md](references/direction.md) |
| 素材分层与旁白同步 | [art-and-flow.md](references/art-and-flow.md) |
| 手绘、拼贴与角色叙事 | [handdrawn.md](references/handdrawn.md) |
| 数据、图表与架构契约 | [data-diagrams.md](references/data-diagrams.md) |
| 巨幕、多画幅与循环交付 | [screens.md](references/screens.md) |
| 运行协议、GPU/Three.js、字体、声音与渲染命令 | [runtime.md](references/runtime.md) |
| 简短导演提示词 | [prompts.md](references/prompts.md) |
| 不同模型与宿主兼容性 | [portability.md](references/portability.md) |
| 技术验收与修正 | [quality.md](references/quality.md) |
