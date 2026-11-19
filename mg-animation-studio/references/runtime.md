# 运行、接口与复现

## 环境

Node.js 22+、Python 3（初始化和单 HTML 打包，仅标准库）、FFmpeg/ffprobe、Playwright Chromium。项目锁定 Playwright 与 sharp 版本；优先 `npm ci`。缺 FFmpeg 时通过官方发行源或常用包管理器安装，遵循宿主授权。不要读用户浏览器配置、复用私人 Chrome 会话或关闭安全保护。

字体随工程分发：Noto Sans SC（family 名 `StudioSans`），SIL Open Font License，许可证在 `assets/OFL.txt`。不依赖字体 CDN。其他字体放进 `assets/` 并在 `film.json` 声明，每个声明的字重都必须真实加载，系统回退直接报错：

```json
"fonts": [
  {"family": "Serif", "src": "./assets/NotoSerifSC-VF.ttf", "weight": "200 900", "check": [400, 900]},
  {"family": "Kai", "src": "./assets/LXGWWenKai-Regular.ttf", "weight": "400", "check": [400]}
]
```

Canvas 中用 `d.type('文字',x,y,{family:'Serif',size:120,weight:300,tracking:.02})`；DOM 模式直接写 CSS `font-family`。排印气质参考 [craft-philosophy.md](craft-philosophy.md#4-排印是视觉造型的一部分)。网络隔离的渲染阶段只允许当前 loopback 工程资源；缺失素材会使任务失败。

## 文件职责

| 文件 | 职责 |
|---|---|
| film.json | 尺寸、时长、fps、BPM、场景区间、音效点；`route`（路由）、`capture`（canvas/dom）、`fonts`、可选 `layers`/`dataset`/`graph` |
| index.html | 字体加载与校验、创建舞台（canvas 或 div）、预览播放、render 模式 |
| src/film.js | 本片的全部绘制；初始化时只是空白入口，按本片视觉论点重写 |
| lib/motion.js | 闭式弹簧、命名缓动（expoOut/quartOut/backOut/smooth/cubicBezier…）、`keys()` 关键帧、`stagger()` 错峰、索引式随机数 |
| lib/camera.js | `camera()` 关键帧相机、`layer()` 视差深度层与景深、`project()` 世界坐标转屏幕坐标 |
| lib/look.js | `grain` 颗粒、`vignette` 暗角、`bloom` 溢光、`additive` 加色、`glow` 辉光、`softShadow` 接触阴影、`curtain` 发光垂幕/体积光、`duotone` 渐变映射、`halftone` 网点 |
| lib/layers.js | 在首帧前解码项目内图片，在 Canvas 中按位置和透明度合成 |
| lib/draw.js / lib/handdrawn.js / lib/data.js | 文字（多字体、字距）与安全区检查、铅笔重描与排线、纸/印刷底纹、`sampleKeyframes`；数据、拓扑与安全边距校验 |
| tools/studio.mjs | 静帧、确定性检查、逐帧渲染（canvas 读像素 / dom 元素截图） |
| tools/audio.mjs | 原创配乐、外部音乐/旁白混音 |
| tools/check.mjs | 视频编码、帧数、时长、音频响度检查 |
| tools/pack_html.py | 单文件离线预览打包 |

## 时间与页面协议

`window.MG` 包含 `ready: true`、`duration`、`width`、`height`、`fps`、`seek(t)` 及可选 `inspect()` / `trace()`。先加载字体/图片，再标 ready。入口同时支持同步和异步 `createFilm`。素材分层配置见[分层美术与逐步讲解](art-and-flow.md)。字体 load 使用实际中文和数字样本，确认返回了声明 family 且状态 loaded 的 FontFace；仅 `document.fonts.check()` 可能接受系统回退，不能证明声明字体存在。缺字仍需实际画面检查。`t` 单位秒，有效区间 `[0,duration)`；最后一个输出帧是 `(frameCount-1)/fps`。

## GPU、Three.js 与系统字体

- `film.json` 设 `"gpu": true`（或命令行 `--gpu`），渲染用本机真实 GPU 跑 WebGL；默认的无头软件光栅很慢，复杂材质也会失真。GPU 输出在同一台机器上可复现，换机器后重新 `verify`。
- Three.js：`npm i three` 后在 renderer 里 `import * as THREE from 'three'`，扩展用 `import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js'`（index.html 已带 import map）。`WebGLRenderer` 要开 `preserveDrawingBuffer:true`；所有动画在 `seek(t)` 里按 t 设置，然后调用一次 `renderer.render()`，不要用 `setAnimationLoop`。环境光照可用 `RoomEnvironment` + `PMREMGenerator`，色调映射用 ACES。
- 系统字体：`{"family":"Bodoni 72","local":true}`，renderer 里直接用这个 family 名；加载时用字形宽度对比确认它真的装在本机，否则报错。只在装了该字体的机器上可复现；交付时写明。商用发布前确认字体许可。

## 两种捕获模式

- `capture:"canvas"`（默认）：`createFilm(canvas,cfg)`，工具读取 `#stage` Canvas 像素。适合程序化绘制、粒子、光效和 `look.js`。WebGL 可直接在这块 canvas 上创建上下文（需 `preserveDrawingBuffer:true`）。
- `capture:"dom"`：`createFilm(div,cfg)`，舞台是 `<div id="stage">`，可放 HTML、SVG（滤镜、遮罩、路径动画）、CSS（混合模式、`clip-path`、排版）、子 canvas 或 WebGL。工具在每次 `seek(t)` 后等待图片解码、字体就绪和两帧绘制，再对舞台元素截图。render 模式下全局禁用 CSS animation/transition：所有样式都要在 `seek(t)` 里按 t 设置。Lottie 用 `goToAndStop(t*1000)`，GSAP 时间线 `paused:true` 后 `seek(t)`。DOM 模式没有自动文字越界检查，`layoutCoverage` 为 manual-only，须看图。

画面必须只依赖 t、配置和已加载素材：

- 不在 `seek()` 里累加位置、粒子状态、索引或随机种子。
- 粒子位置通过粒子编号/种子/t 解析计算；复杂物理预计算轨迹再查表。
- Canvas 每帧恢复 transform、alpha、blend、clip 状态；每个镜头 save/restore 成对。
- 真实交互演示可用编排好的光标表现，但这不是产品功能测试；不要让预览控件进入成片。
- 自动预览使用 requestAnimationFrame，但 `?render=1` 下完全关闭；不要用 navigator.webdriver 猜环境。
- 弹簧有欠阻尼、临界阻尼、过阻尼三种分支。多目标轨迹可叠加阶跃响应；文本阅读区域少用过冲。

`inspect()` 返回当前可见文字/关键对象的越界问题列表。`draw.js` 的 `text/type` 对 Canvas 字体度量后应用当前变换矩阵；这能发现越界，**不能发现遮挡和视觉拥挤**，仍须看图。装饰性巨字有意出画时传 `check:false`。

任何画幅都要单独构图，不是强行缩放。改时长或故事时同步修改 renderer、分镜及配乐，不能只改 duration。

半透明纹理与多次 Canvas 像素读取可能触发浏览器渲染路径切换，产生微小像素差异。`lib/draw.js` 每帧完整 `reset()` 上下文，并在创建 context 时使用 `willReadFrequently:true` 固定 CPU 路径；不要只放宽哈希验证来掩盖不稳定。

## 命令

在生成的工程目录执行：

`npm run check` 默认按 `film.json` 的宽、高、fps 查找输出；使用自定义 `--tag` 或导出尺寸后，传入实际 `--dir`。

```bash
npm run preview
node tools/studio.mjs stills --size 1080x1920
node tools/studio.mjs stills --times 3.80,3.93,4.00,4.07,4.20 --tag cut-04
node tools/studio.mjs verify --size 1080x1920
node tools/studio.mjs render --scale 0.5 --tag draft
node tools/studio.mjs render --size 1920x1080 --fps 60 --samples 2
node tools/check.mjs --dir out/1920x1080-60fps
```

`--samples 1/2/4`：1 为无快门采样；2/4 在每帧中心附近用 180° 快门采样，当前版本为 sRGB 像素均值，避免跨硬切混合。属于实用运动模糊，不是物理准确的线性光积分。先确认全片可用再增加采样；渲染量近似正比于采样数。

预览服务只监听 127.0.0.1；Ctrl-C 停止。输出保存在 out/尺寸-fps/；同 tag 重渲会覆盖本工程对应输出。保留需要比较的版本时用不同 `--tag`。底层不开放在线部署。

同一工程的混音使用 `out/mix.wav`，因此多尺寸渲染应顺序执行；不同工程可以独立执行。先完成本尺寸的 render/check，再做下一个尺寸。

## 音乐与旁白

```bash
npm run score
node tools/studio.mjs render --music ./assets/music.wav
node tools/studio.mjs render --music ./assets/music.wav --voice ./assets/voice.wav
node tools/audio.mjs mix --video ./out/1920x1080-30fps/silent.mp4 --out ./out/new-mix.mp4 --music ./assets/music.wav
```

外部音乐短于影片默认报错；明确适合循环时加 `--loop-music`，并人工检查接缝。默认只淡入淡出音乐，不改变旁白内容；旁白应在剪辑前校核长度，避免被时长截断。配乐与旁白先混合为 WAV，再两遍 loudnorm，最后 AAC 编码，再次测量成片。默认目标 -16 LUFS、-1.5 dBTP 是交付选择，不是所有平台强制标准。

`audio.mode` 缺省为 `"sound"`。当 `film.json.audio.script` 指定项目内的 Python 配乐脚本（如 `"audio/compose.py"`）时，`npm run score` 会直接执行该脚本并校验 `out/score.wav` 输出，适合用 NumPy 等编写定制声景与物理音效。同样可以在 `film.json.audio` 中直接配置 `music` / `voice`（如 `"voice": "./assets/voice.m4a"`），`npm run render` 会自动按 `audio.mix` 压低配乐并完成响度归一化。用户明确要求静音时设为 `"silent"`，清空 cues，不运行 score、不传 music/voice；直接 verify、stills、render、check。静音成片必须零音轨，检查器同时核对配置与渲染记录。静音预览用自身时钟，有声预览用音频时钟；两者都尊重 loop。`pack_html.py` 在静音模式不要求 WAV，并拒绝 `--audio`。

旁白与配乐的输入音量不同，压低音乐的阈值也应不同。可用 `audio.mix` 配置：

```json
{
  "voiceGain": 1,
  "musicGain": 0.38,
  "ducking": {"threshold": 0.025, "ratio": 6, "attackMs": 15, "releaseMs": 250}
}
```

以上是兼容默认值，不是每段旁白的建议答案。无旁白时 musicGain 默认 1。gain 与 threshold 都是线性幅度，时间单位为毫秒；CLI `--voice-gain`、`--music-gain`、`--duck-threshold`、`--duck-ratio`、`--duck-attack-ms`、`--duck-release-ms` 可覆盖对应字段。日志记录实际参数和源旁白测量，超界/非数值参数被拒绝。先查源音量，再调试、检查混音；默认 threshold 对很轻的输入可能完全不触发。最终听感仍需试听。

有旁白的混音分支让两路滤镜输入比交付时长多保留 1 秒补零，再以原时长输出，防止该链路在源输入结束附近提前截掉淡出；这不会延长影片或截短旁白。过长旁白仍先报错，不能用补零代替重排分镜。

BPM 与 beatOffset 不会自动重写画面；改变 BPM 后要同步重排镜头和 cue。外部音乐：把确认的节拍点回填到分镜、cue 和动画时间。`cues` 是配乐引擎的动作音效输入。当前工具不做自动节拍检测或 TTS；有需要时连接实际可用的工具，记录服务、声音、费用与来源，不假称已支持接口。

## 常见故障

- 找不到 Chromium：工程内 `npx playwright install chromium`，不使用用户浏览器资料目录。
- 字体/资源 404：检查本地相对路径，禁止用 fallback 字体掩盖失败。
- ffmpeg 非零退出、管道关闭：停止并报告 stderr，保留 silent.mp4 等已生成文件；不要宣称导出成功。
- `verify` 失败：对照该时间戳的重复帧，找累积状态、异步素材或随机数；不靠多渲几次碰运气。
- 只有静态聊天环境：交付完整工程和命令，明确视频尚未渲染。
