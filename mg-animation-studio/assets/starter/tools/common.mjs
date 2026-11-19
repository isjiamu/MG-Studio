import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {validateDataset,validateGraph,validateInsets} from '../lib/data.js';
export function args(){
  const o={mode:process.argv[2]&&!process.argv[2].startsWith('--')?process.argv[2]:null};
  for(let i=2;i<process.argv.length;i++)if(process.argv[i].startsWith('--')){
    const k=process.argv[i].slice(2);o[k]=process.argv[i+1]&&!process.argv[i+1].startsWith('--')?process.argv[++i]:true;
  }return o;
}
export function config(){
  const c=JSON.parse(fs.readFileSync('film.json','utf8'));
  const audioMode=c.audio?.mode??'sound';
  if(!['sound','silent'].includes(audioMode))throw Error('Unknown audio.mode; expected sound or silent');
  if(audioMode==='silent'&&(c.cues?.length||c.audio.music||c.audio.voice))throw Error('Silent intent conflicts with audio events/assets');
  for(const k of ['width','height','fps','duration','bpm'])if(!Number.isFinite(c[k])||c[k]<=0)throw Error(`Invalid ${k}`);
  if(c.width%2||c.height%2)throw Error('H.264 dimensions must be even');
  if(Math.abs(c.duration*c.fps-Math.round(c.duration*c.fps))>1e-6)throw Error('Duration must contain an integer frame count');
  let end=0;
  for(const s of c.scenes){if(s.from!==end||!(s.to>s.from))throw Error(`Gap/overlap at ${s.id}`);end=s.to;}
  if(end!==c.duration)throw Error('Scene coverage must exactly equal duration');
  for(const cue of c.cues||[])if(cue.t<0||cue.t>=c.duration)throw Error('Cue outside timeline');
  if(c.dataset)validateDataset(c.dataset);
  if(c.graph)validateGraph(c.graph);
  validateInsets(c.safeInsets);
  return c;
}
export function run(bin,a){
  const r=spawnSync(bin,a,{encoding:'utf8',maxBuffer:20*1024*1024});
  if(r.error||r.status!==0)throw Error(`${bin} failed: ${r.error?.message||r.stderr?.slice(-2500)}`);
  return r;
}
export function probe(file){
  return JSON.parse(run('ffprobe',['-v','error','-show_streams','-show_format','-of','json',file]).stdout);
}
export function json(file,data){fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(data,null,2)+'\n');}
export function measure(file,target={}){
  const {integratedLufs=-16,truePeakDb=-1.5,loudnessRange=11}=target;
  const r=run('ffmpeg',['-hide_banner','-nostats','-i',file,'-vn','-af',`loudnorm=I=${integratedLufs}:TP=${truePeakDb}:LRA=${loudnessRange}:print_format=json`,'-f','null','-']);
  const m=r.stderr.match(/\{\s*"input_i"[\s\S]*?\}/);if(!m)throw Error('No loudness measurement');
  return JSON.parse(m[0]);
}
