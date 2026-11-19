#!/usr/bin/env python3
"""Original event-scored chamber miniature; standard library, no external music."""
import array,json,math,pathlib,random,wave,sys
cfg=json.loads(pathlib.Path('film.json').read_text());B=cfg['storyTiming']
SR=48000;n=round(cfg['duration']*SR);L=array.array('f',[0])*n;R=array.array('f',[0])*n
rng=random.Random(cfg.get('seed',42));events=[]
def note(at,midi,dur=2.8,gain=.1,pan=0,kind='felt',section=''):
 start=round(at*SR);count=min(round(dur*SR),n-start)
 if start<0 or count<=0:return
 f=440*2**((midi-69)/12);gl=math.sqrt((1-pan)/2);gr=math.sqrt((1+pan)/2)
 events.append({'t':round(at,3),'duration':dur,'midi':midi,'gain':gain,'kind':kind,'section':section,'pan':pan})
 # A soft attack and unequal partial decay keep the bell from becoming a piercing sine.
 if kind=='felt':partials=[(1,1,1.55),(2.001,.30,2.9),(3.004,.12,5.1),(4.009,.045,7.8),(5.015,.018,12)];attack=.016
 elif kind=='celeste':partials=[(1,1,1.6),(2.01,.12,3.8),(4.02,.04,6)];attack=.018
 elif kind=='pad':partials=[(.9995,.55,.13),(1.0005,.55,.13),(2,.12,.24)];attack=.55
 else:partials=[(1,1,3.2),(2,.12,7)];attack=.006
 delay=round((.183 if section in ['growth','voyage','constellation'] else .113)*SR)
 wet=.14 if section in ['growth','voyage','constellation'] else .065
 for j in range(count):
  t=j/SR;env=min(1,t/attack)*min(1,(dur-t)/(.65 if kind=='pad' else .35))
  v=sum(a*math.sin(2*math.pi*f*k*t+(0.002*math.sin(t*4.4) if kind=='pad' else 0))*math.exp(-decay*t) for k,a,decay in partials)
  if kind=='felt' and t<.02:v+=rng.uniform(-1,1)*.025*(1-t/.02)
  v*=env*gain;idx=start+j;L[idx]+=v*gl;R[idx]+=v*gr
  if idx+delay<n:L[idx+delay]+=v*gr*wet;R[idx+delay]+=v*gl*wet
  if idx+delay*2<n:L[idx+delay*2]+=v*gl*wet*.28;R[idx+delay*2]+=v*gr*wet*.28
  room=round(.047*SR)
  if idx+room<n:L[idx+room]+=v*gr*.04;R[idx+room]+=v*gl*.035

def chord(at,notes,gain=.055,dur=4,section='',kind='felt'):
 for i,m in enumerate(notes):note(at+i*.055,m,dur,gain,(i-(len(notes)-1)/2)*.23,kind,section)

def paper_sound(at,dur=.12,gain=.012,pan=0):
 start=round(at*SR);previous=0
 for j in range(min(round(dur*SR),n-start)):
  u=j/(dur*SR);v=rng.uniform(-1,1);previous=.83*previous+.17*v
  x=previous*math.sin(math.pi*u)**2*gain
  L[start+j]+=x*(1-pan)*.7;R[start+j]+=x*(1+pan)*.7
 events.append({'t':at,'duration':dur,'kind':'paper-rustle','gain':gain})

# Hesitation: suspended A minor, sparse questions with uneven rests.
chord(.1,[45,52,59],.034,4.6,'hesitation')
for t,m in [(.45,69),(1.65,76),(2.55,71)]:note(t,m,2.4,.082,-.22,'felt','hesitation')
# Discovery: the same motif turns upward; the first accent is the beak contact.
chord(B['notice'],[48,55,64],.045,4.2,'discovery')
for offset,m in [(0,72),(.58,74),(1.16,76),(1.74,79)]:note(B['notice']+.18+offset,m,2.25,.09,.2,'felt','discovery')
note(B['pickup'],81,2,.072,.25,'celeste','discovery');paper_sound(B['pickup'],.16,.022,.2)
# Carrying: light, alternating figures follow the wing and settle at the envelope.
for at,m in [(5.92,64),(6.42,67),(6.93,72),(7.48,76),(8.03,74)]:note(at,m,2.1,.075,.08,'felt','carrying')
for at,pan in [(4.33,-.25),(6.12,0),(7.36,.2)]:paper_sound(at,.20,.013,pan)
chord(7.65,[41,48,60],.041,3.6,'carrying')
paper_sound(B['release'],.2,.023,.25);note(B['release'],64,2,.06,.12,'felt','deposit')
note(B['land'],48,2.3,.052,.08,'felt','deposit');paper_sound(B['land'],.1,.016,.1)
# Night: two seconds of breathing space, a low warm sustained bed, no rhythmic ostinato.
chord(B['night'],[45,52,60],.009,3.8,'night','pad');note(B['night']+.12,64,2.5,.024,-.05,'felt','night')
# Growth: upper register opens exactly when the letters leave the envelope.
chord(B['awaken'],[48,55,64],.026,4.3,'growth','pad')
# Recognition: the opening three-note question returns, then resolves upward.
for off,m in [(0,69),(.48,76),(.96,71),(1.55,72),(2.12,76),(2.68,79)]:note(B['awaken']+off,m,2.8,.085+off*.006,-.25+off*.15,'felt' if off<1.5 else 'celeste','growth')
note(B['sprout'],84,3.4,.072,.4,'celeste','growth')
# Voyage: rocking three-note figures, a warmer lower voice and wider space.
chord(B['morph'],[41,48,57,64],.031,5.2,'voyage','pad')
for i,m in enumerate([65,69,72,77,72,69,67,71,74]):note(B['morph']+.15+i*.43,m,2.9,.09+.008*(i%3==0),math.sin(i*.6)*.3,'felt','voyage')
for off,m in [(.1,41),(1.42,48),(2.8,43)]:note(B['morph']+off,m,2.3,.052,-.08,'felt','voyage')
note(B['boat'],79,3,.082,.35,'celeste','voyage')
# Constellation: the motif arrives in a full major-ninth sonority, then stops moving.
chord(B['constellation'],[48,55,64,71],.052,4.8,'constellation','pad')
for i,m in enumerate([72,76,79,83,79,84]):note(B['constellation']+.12+i*.38,m,3,.112,(i-2.5)*.13,'felt' if i<3 else 'celeste','constellation')
chord(B['connect'],[60,67,76,83],.052,4.2,'constellation')
# Return: widening note intervals and a final chord with an audible release window.
for off,m in [(0,79),(.72,76),(1.6,72)]:note(B['return']+off,m,3.6,.09,-.12,'felt','resolve')
chord(B['resolve'],[48,55,64,72],.045,2.65,'resolve')

pcm=array.array('h');rms=[]
for i in range(n):
 t=i/SR;fade=min(1,t/.05)*min(1,(cfg['duration']-t)/1.6)
 pcm.append(round(math.tanh(L[i]*fade)*28500));pcm.append(round(math.tanh(R[i]*fade)*28500))
phases=[('hesitation',0,B['notice']),('discovery',B['notice'],B['pickup']),('carrying',B['pickup'],B['night']),('night',B['night'],B['awaken']),('growth',B['awaken'],B['morph']),('voyage',B['morph'],B['constellation']),('constellation',B['constellation'],B['return']),('resolve',B['return'],cfg['duration'])]
for name,a,b in phases:
 lo=round(a*SR)*2;hi=min(len(pcm),round(b*SR)*2);energy=sum((x/32768)**2 for x in pcm[lo:hi])/(hi-lo)
 rms.append({'section':name,'from':a,'to':b,'rmsDbfs':round(10*math.log10(max(1e-12,energy)),2)})
if sys.byteorder!='little':pcm.byteswap()
out=pathlib.Path('out');out.mkdir(exist_ok=True)
with wave.open(str(out/'score.wav'),'wb') as w:w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes(pcm.tobytes())
(out/'audio-source.json').write_text(json.dumps({'type':'original event-scored procedural composition','engine':'Python standard library','sampleRate':SR,'storyTiming':B,'motif':{'question':[69,76,71],'answer':[72,76,79],'development':'question recalled at awakening, major response at constellation'},'events':events,'sections':rms,'limitation':'Composition and envelope checks; no human listening judgment implied.'},ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'events':len(events),'sections':rms},ensure_ascii=False))
