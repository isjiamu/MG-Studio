# MG Studio 范例预览

本目录存放 4 支内置高水准范例的动图预览（`gifs/`）与关键帧总览（`frames/`）。

克隆仓库后可直接打开 `demo/index.html`，或在仓库根目录启动本地服务浏览：

```bash
python3 -m http.server 8000 --bind 127.0.0.1
# 浏览器打开 http://127.0.0.1:8000/demo/
```

如需运行或修改对应工程，使用 Skill 内置的初始化脚本：

```bash
python3 mg-animation-studio/scripts/init_project.py --list-demos
python3 mg-animation-studio/scripts/init_project.py ./my-demo --demo industrial
```
