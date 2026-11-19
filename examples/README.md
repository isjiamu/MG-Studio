# 复现示例

四个示例均采用 C 版的 HTML/Canvas 工程结构。每个案例目录有简报、分镜、配置、绘制源码及其材质。[共同提示词](prompts.json)和[旁白时间表](narration-cues.json)覆盖三版的比较口径。

| 示例 | 参数 | 入口 |
| --- | --- | --- |
| 澄屿书店的到店人数 | `data` | [简报](data/BRIEF.md) |
| 为什么第二次加载更快？ | `cache` | [简报](cache/BRIEF.md) |
| 昼屿 · 折叠台灯 | `lamp` | [简报](lamp/BRIEF.md) |
| 一封信过海 | `paper` | [简报](paper/BRIEF.md) |

## 预览和渲染

在仓库根目录执行以下命令。把 `cache` 换成表中的任一参数，目标目录填一个新路径。

```bash
python3 examples/init.py cache work/cache
cd work/cache
npm ci
npx playwright install chromium
npm run verify
npm run stills
npm run render
npm run check
```

预览可用 `npm run preview`，按终端给出的地址打开。成片位于 `out/1920x1080-24fps/final.mp4`。修改画面用 `src/film.js`，画幅、时长、素材和分镜区间在 `film.json`，共用 Canvas 绘制函数在 `src/stage.js`。

## 添加旁白

把具有对应使用权限的旁白放入工程，并按 `narration-cues.json` 的句子和时间对齐。将 `film.json` 的 `audio` 设为以下配置，然后使用原生混音命令。背景音乐可以来自自有素材，也可以用 `npm run score` 在本地生成。

```json
{
  "mode": "sound",
  "style": "ambient",
  "integratedLufs": -16,
  "truePeakDb": -2
}
```

```bash
npm run score
node tools/studio.mjs render --voice assets/voice.wav
npm run check
```

仅需旁白时，在上述音频配置中加 `"mix": {"musicGain": 0}`。声音来源与具体选项见[运行与接口](../mg-animation-studio/references/runtime.md)。
