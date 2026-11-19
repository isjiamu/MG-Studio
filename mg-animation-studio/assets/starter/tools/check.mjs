import fs from 'node:fs';
import path from 'node:path';
import {args,config,probe,measure,run,json} from './common.mjs';
const opt=args(),c=config(),dir=opt.dir||`out/${c.width}x${c.height}-${c.fps}fps`,file=opt.file||path.join(dir,'final.mp4');
const expected=JSON.parse(fs.readFileSync(path.join(path.dirname(file),'render.json'),'utf8'));
const intent=c.audio?.mode??'sound',manifestMode=expected.audioMode??'sound';
const p=probe(file),videos=p.streams.filter(s=>s.codec_type==='video'),audios=p.streams.filter(s=>s.codec_type==='audio'),v=videos[0],a=audios[0],failures=[];
if(intent!==manifestMode)failures.push('Render audio mode differs from current explicit project intent');
if(videos.length!==1)failures.push('Exactly one video stream required');
if(v){
  if(v.codec_name!=='h264'||v.pix_fmt!=='yuv420p')failures.push('Expected H.264 yuv420p');
  for(const k of ['width','height'])if(v[k]!==expected[k])failures.push(`${k} mismatch`);
  if(Number(v.nb_frames)!==expected.frames)failures.push('Frame count mismatch');
  const [n,d]=v.avg_frame_rate.split('/').map(Number);if(Math.abs(n/d-expected.fps)>1e-6)failures.push('FPS mismatch');
  if(Math.abs(Number(v.duration)-expected.duration)>1/expected.fps)failures.push('Video duration mismatch');
}
let loudness=null,lu=null,tp=null;
if(intent==='silent'){
  if(audios.length!==0)failures.push('Explicit silent delivery must contain zero audio streams');
}else{
  if(audios.length!==1)failures.push('Sound delivery requires exactly one audio stream');
  if(a){
    if(a.codec_name!=='aac'||Number(a.sample_rate)!==48000)failures.push('Expected AAC 48 kHz');
    if(v&&Math.abs(Number(a.duration)-Number(v.duration))>.08)failures.push('Audio/video duration mismatch');
    loudness=measure(file);lu=Number(loudness.input_i);tp=Number(loudness.input_tp);
    if(!Number.isFinite(lu)||lu< -18||lu> -14)failures.push('Loudness outside -18 to -14 LUFS');
    if(!Number.isFinite(tp)||tp> -1)failures.push('True peak exceeds -1 dBTP');
  }
}
run('ffmpeg',['-v','error','-i',file,'-f','null','-']);
const report={passed:failures.length===0,file,expected,audioIntent:intent,video:v,audio:a??null,audioStreamCount:audios.length,loudness,decode:'passed',failures,scope:'Technical checks. Explicit silent intent skips loudness measurement, not stream, duration, pixel format or decode checks. Visual looping and site playback need separate evidence.'};
json(path.join(path.dirname(file),'media-check.json'),report);
console.log(JSON.stringify({passed:report.passed,frames:v?.nb_frames,dimensions:`${v?.width}x${v?.height}`,audioIntent:intent,audioStreams:audios.length,lufs:lu,truePeakDb:tp,failures},null,2));
if(failures.length)process.exitCode=1;
