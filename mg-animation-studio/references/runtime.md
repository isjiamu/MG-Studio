# 运行、接口与复现

## 环境

Node.js 22+、Python 3（初始化、手绘示例配乐和单 HTML 打包，仅标准库）、FFmpeg/ffprobe、Playwright Chromium。项目锁定 Playwright 与 sharp 版本；优先 `npm ci`。缺 FFmpeg 时通过官方发行源或常用包管理器安装，遵循宿主授权。不要读用户浏览器配置、复用私人 Chrome 会话或关闭安全保护。

字体随工程分发：Noto Sans SC，SIL Open Font License，许可证在 `assets/OFL.txt`。不依赖国外字体 CDN。替换品牌字体时放入 assets、改 `@font-face` 并确认许可。网络隔离的渲染阶段只允许当前 loopback 工程资源；缺失素材会使任务失败。

## 文件职责

| 文件 | 职责 |
|---|---|
| film.json | 尺寸、时长、fps、BPM、场景区间与音效点；story 的 storyTiming 供画面与配乐共同读取 |
| index.html | 本地字体加载、预览播放、明确的 render 模式 |
| src/film.js | 每个镜头如何绘制；新片主要修改这里 |
| src/story.js / src/industry.js | 纸感叙事、产品/架构/数据的独立示例 renderer |
| lib/motion.js | 闭式弹簧、缓动和索引式随机数 |
| lib/layers.js | 在首帧前解码项目内的素材，在 Canvas 中按位置和透明度合成 |
| lib/draw.js / lib/handdrawn.js / lib/data.js | 纸纹、铅笔重描、纸鸟关节/锚点、可见文字范围；数据、拓扑与安全边距校验 |
| tools/studio.mjs | 静帧、确定性检查、逐帧渲染 |
| tools/audio.mjs | 原创配乐、外部音乐/旁白混音 |
| tools/check.mjs | 视频编码、帧数、时长、音频响度检查 |
| tools/story_score.py / tools/pack_html.py | 原创钢琴近似配乐；单文件离线预览打包 |

## 时间与页面协议

`window.MG` 包含 `ready: true`、`duration`、`width`、`height`、`fps`、`seek(t)` 及可选 `inspect()` / `trace()`。先加载字体/图片，再标 ready。入口同时支持同步和异步 `createFilm`。素材分层配置见[分层美术与逐步讲解](art-and-flow.md)。字体 load 使用实际中文和数字样本，确认返回了声明 family 且状态 loaded 的 FontFace；仅 `document.fonts.check()` 可能接受系统回退，不能证明声明字体存在。缺字仍需实际画面检查。`t` 单位秒，有效区间 `[0,duration)`；最后一个输出帧是 `(frameCount-1)/fps`。

渲染器读取 `#stage` Canvas 的像素。采用 DOM/SVG 绘制时须把帧捕获改为元素截图，并增加布局检查；不能声称当前直接导出工具已支持所有 DOM/WebGL 工程。

画面必须只依赖 t、配置和已加载素材：

- 不在 `seek()` 里累加位置、粒子状态、索引或随机种子。
- 粒子位置通过粒子编号/种子/t 解析计算；复杂物理预计算轨迹再查表。
- Canvas 每帧恢复 transform、alpha、blend、clip 状态；每个镜头 save/restore 成对。
- 真实交互演示可用编排好的光标表现，但这不是产品功能测试；不要让预览控件进入成片。
- 自动预览使用 requestAnimationFrame，但 `?render=1` 下完全关闭；不要用 navigator.webdriver 猜环境。
- 弹簧有欠阻尼、临界阻尼、过阻尼三种分支。多目标轨迹可叠加阶跃响应；文本阅读区域少用过冲。

`inspect()` 返回当前可见文字/关键对象的越界问题列表。示例对 Canvas 字体度量后应用当前变换矩阵；这能发现越界，**不能发现遮挡和视觉拥挤**，仍须看图。kinetic 示范采用满屏构图，未挂接文字包围框；其 layoutCoverage 标为 manual-only，须逐镜看图。

story 使用 1:1 构图；industry 支持横版 16:9 至 32:9。其他画幅要重做构图，不是强行缩放。story/industry 的主文字按 safeInsets 检查，装饰微字和对象遮挡仍由审图确认。story 通过 `presets/story.json` 初始化为 32 秒、长短不一的动作段落；industry 是 24 秒的示例。它们都是创作起点，不是新片限制。改时长或故事时同步修改 renderer、分镜及配乐，不能只改 duration；storyTiming 统一关键节点，局部姿态与音符时值仍由代码编排。

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

`audio.mode` 缺省为 `"sound"`。用户明确要求静音时设为 `"silent"`，清空 cues，不运行 score、不传 music/voice；直接 verify、stills、render、check。静音成片必须零音轨，检查器同时核对配置与渲染记录。静音预览用自身时钟，有声预览用音频时钟；两者都尊重 loop。`pack_html.py` 在静音模式不要求 WAV，并拒绝 `--audio`。

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

BPM 与 beatOffset 不会自动重写画面；改变 BPM 后要同步重排镜头和 cue。外部音乐：把确认的节拍点回填到分镜、cue 和动画时间。story 的 felt 配乐从 `storyTiming` 读取衔取、放下、入夜、苏醒、成形和收束的时间，并在 `out/audio-source.json` 记录实际音符事件及分段 RMS。`cues` 是普通配乐引擎的输入；felt 分支由 story_score.py 编排动作音效，不重复叠加 cues。当前工具不做自动节拍检测或 TTS；有需要时连接实际可用的工具，记录服务、声音、费用与来源，不假称已支持接口。

## 常见故障

- 找不到 Chromium：工程内 `npx playwright install chromium`，不使用用户浏览器资料目录。
- 字体/资源 404：检查本地相对路径，禁止用 fallback 字体掩盖失败。
- ffmpeg 非零退出、管道关闭：停止并报告 stderr，保留 silent.mp4 等已生成文件；不要宣称导出成功。
- `verify` 失败：对照该时间戳的重复帧，找累积状态、异步素材或随机数；不靠多渲几次碰运气。
- 只有静态聊天环境：交付完整工程和命令，明确视频尚未渲染。
