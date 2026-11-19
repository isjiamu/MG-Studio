#!/usr/bin/env python3
"""Inline this starter's simple named-export ES modules, font, config and score."""
import argparse,base64,json,pathlib,re
parser=argparse.ArgumentParser()
parser.add_argument('--audio',default=None,help='Project-local WAV or M4A; defaults to out/score.wav for sound projects; forbidden for silent projects')
args=parser.parse_args()
root=pathlib.Path.cwd().resolve()
modules={};chunks=[];visiting=set()
pat=re.compile(r"import\s*\{([^}]+)\}\s*from\s*['\"]([^'\"]+)['\"]\s*;")
def bundle(file):
 file=file.resolve()
 if not file.is_relative_to(root):raise ValueError("Module outside project")
 if file in modules:return modules[file]
 if file in visiting:raise ValueError("Circular imports: use a standard bundler")
 visiting.add(file);code=file.read_text()
 def imp(m):
  spec=m.group(2)
  if not spec.startswith("."):raise ValueError("External modules require a standard bundler")
  dep=bundle(file.parent/spec)
  names=re.sub(r"\s+as\s+",":",m.group(1))
  return f"const {{{names}}}={dep};"
 code=pat.sub(imp,code)
 exports=re.findall(r"\bexport\s+(?:async\s+function|function|const|let|class)\s+(\w+)",code)
 code=re.sub(r"\bexport\s+(?=(?:async\s+function|function|const|let|class)\s)","",code)
 if re.search(r"^\s*(?:import|export)\s",code,re.M):raise ValueError("Unsupported module syntax")
 name=f"__mg{len(modules)}";modules[file]=name
 chunks.append(f"const {name}=(()=>{{\n{code}\nreturn {{{','.join(exports)}}};\n}})();")
 visiting.remove(file);return name
entry=bundle(root/"src/film.js")
html=(root/"index.html").read_text()
font=base64.b64encode((root/"assets/NotoSansSC.ttf").read_bytes()).decode()
html=html.replace("./assets/NotoSansSC.ttf","data:font/ttf;base64,"+font)
config=json.loads((root/"film.json").read_text())
image_mimes={'.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp'}
for name,source in config.get('layers',{}).items():
 image=(root/source).resolve()
 if not image.is_relative_to(root/'assets') or image.suffix.lower() not in image_mimes:
  raise ValueError(f'Unsupported project image: {name}')
 config['layers'][name]=f"data:{image_mimes[image.suffix.lower()]};base64,"+base64.b64encode(image.read_bytes()).decode()
font_mimes={'.ttf':'font/ttf','.otf':'font/otf','.woff2':'font/woff2','.woff':'font/woff'}
for f in config.get('fonts',[]):
 if 'src' not in f:print(f"Note: {f.get('family')} uses an installed font; the standalone HTML needs it on the viewing machine.");continue
 src=(root/f['src']).resolve()
 if not src.is_relative_to(root) or src.suffix.lower() not in font_mimes:raise ValueError(f"Unsupported project font: {f.get('family')}")
 f['src']=f"data:{font_mimes[src.suffix.lower()]};base64,"+base64.b64encode(src.read_bytes()).decode()
if config.get('capture','canvas')!='canvas':print('Note: DOM-capture projects must reference images as data URLs or keep them alongside the HTML.')
mode=config.get("audio",{}).get("mode","sound")
if mode not in ("sound","silent"):raise ValueError("Unknown audio.mode")
if mode=="silent" and args.audio:raise ValueError("Explicit silent preview cannot embed audio")
cfg=json.dumps(config,ensure_ascii=False).replace("<","\\u003c")
html=html.replace("import {createFilm} from './src/film.js';","\n".join(chunks)+f"\nconst {{createFilm}}={entry};")
html=html.replace("const cfg=await fetch('./film.json').then(r=>r.json());","const cfg="+cfg+";")
if mode=="sound":
 score=(root/(args.audio or 'out/score.wav')).resolve()
 if not score.is_relative_to(root):raise ValueError("Preview audio must be inside the project")
 if not score.exists():raise ValueError("Generate or select preview audio before packing")
 mime={'.wav':'audio/wav','.m4a':'audio/mp4'}.get(score.suffix.lower())
 if not mime:raise ValueError("Preview audio must be WAV or M4A")
 html=html.replace("./out/score.wav",f"data:{mime};base64,"+base64.b64encode(score.read_bytes()).decode())
dest=root/"out/standalone.html";dest.parent.mkdir(exist_ok=True);dest.write_text(html)
print(f"{dest} ({dest.stat().st_size:,} bytes)")
