# 三版动画对比

下载或克隆仓库后，在浏览器里打开 `demo/index.html`。也可以在仓库根目录启动本地服务，再从浏览器访问 `http://127.0.0.1:8000/demo/`。

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

点击「同步三版」并排看 A、B、C。每组有三处共同时间点，缓存片还可以跳到片尾的路径对照。字幕按原旁白的时间播放，完整提示词与时间表可在对应案例展开查看。

- **A · MG Studio** 使用 Remotion 制作的首轮样片。
- **B · 本地原版** 使用原有 MG Animation Studio 制作的 Canvas 样片。
- **C · 本地优化版** 使用本仓库 Skill 制作，包含更细的美术分层、活动步骤和操作细节。

各版使用相同提示词和 30 秒规格。C 在 A、B 的结果基础上再制作。页面评分记录本次样片自评，其中音画项对应原旁白与动作的时序。

[浏览关键帧总览](frames/comparison-overview.png) · [数据](frames/compare-data.png) · [缓存](frames/compare-cache.png) · [台灯](frames/compare-lamp.png) · [剪纸](frames/compare-paper.png)
