#!/usr/bin/env python3
"""Create an editable demo using the published Skill starter."""
import argparse
import json
from pathlib import Path
import shutil
import subprocess
import sys


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("case", choices=("data", "cache", "lamp", "paper"))
    parser.add_argument("destination", type=Path)
    args = parser.parse_args()

    examples = Path(__file__).resolve().parent
    case = examples / args.case
    skill = examples.parent / "mg-animation-studio"
    project = args.destination.expanduser().resolve()
    subprocess.run(
        [sys.executable, str(skill / "scripts" / "init_project.py"), str(project)],
        check=True,
    )

    shutil.copy2(case / "film.json", project / "film.json")
    shutil.copy2(case / "film.js", project / "src" / "film.js")
    shutil.copy2(examples / "stage.js", project / "src" / "stage.js")
    shutil.copytree(case / "assets", project / "assets", dirs_exist_ok=True)

    for name in ("BRIEF.md", "STORYBOARD.md"):
        content = (case / name).read_text()
        (project / name).write_text(content.replace("../narration-cues.json", "narration-cues.json"))
    cues = json.loads((examples / "narration-cues.json").read_text())
    (project / "narration-cues.json").write_text(json.dumps(cues[args.case], ensure_ascii=False, indent=2) + "\n")
    print(f"Example ready: {project}")


if __name__ == "__main__":
    main()
