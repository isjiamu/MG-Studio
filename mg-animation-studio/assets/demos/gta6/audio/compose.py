from pathlib import Path
import numpy as np
import wave,json,subprocess

ROOT=Path.cwd()/'out'; ROOT.mkdir(parents=True, exist_ok=True)
SR=48000; DURATION=60.0; N=int(SR*DURATION)
rng=np.random.default_rng(6011)
mix=np.zeros((N,2),np.float64)
events=[]

def add(x,start,gain=1,pan=0,kind=None):
    a=int(start*SR)
    if a>=N:return
    if x.ndim==1:
        x=np.column_stack([x*np.sqrt((1-pan)*.5),x*np.sqrt((1+pan)*.5)])
    b=min(N,a+len(x)); mix[a:b]+=x[:b-a]*gain
    if kind:events.append({'t':round(start,3),'event':kind})

def freq(m):return 440*2**((m-69)/12)
def env(n,attack=.01,release=.08):
    e=np.ones(n); a=min(n,int(attack*SR)); r=min(n-a,int(release*SR))
    if a:e[:a]=np.sin(np.linspace(0,np.pi/2,a))**2
    if r:e[-r:]=np.cos(np.linspace(0,np.pi/2,r))**2
    return e

def synth(m,dur,brightness=1,detune=0):
    t=np.arange(int(dur*SR))/SR; f=freq(m)
    a=np.zeros_like(t)
    for i in range(1,8):
        a+=np.sin(2*np.pi*f*i*t)*np.exp(-i/(1.8+brightness*2.2))/i
        if detune:a+=.35*np.sin(2*np.pi*f*(1+detune)*i*t+.3*i)*np.exp(-i/3)/i
    return a

def pad(notes,start,dur,gain):
    l=np.zeros(int((dur+.6)*SR));r=l.copy()
    for j,m in enumerate(notes):
        a=synth(m,dur+.6,.15,.0022)*(env(len(l),.35,.75))
        b=synth(m,dur+.6,.1,-.0026)*(env(len(l),.42,.8))
        l+=a/len(notes);r+=b/len(notes)
    t=np.arange(len(l))/SR
    # mild stereo chorus, gentle pulse so the background breathes with the beat
    pump=.84+.16*(1-np.exp(-np.mod(t+start,.5)*14))
    add(np.column_stack([l,r])*pump[:,None],start,gain,kind='chord')

def bass(m,start,dur=.20,gain=.2):
    t=np.arange(int(dur*SR))/SR
    x=.8*np.sin(2*np.pi*freq(m)*t)+.21*synth(m,dur,.25)
    x*=env(len(t),.008,.05)*np.exp(-t*1.7)
    add(x,start,gain,kind=None)

def pluck(m,start,gain=.07,pan=0):
    dur=.6;t=np.arange(int(SR*dur))/SR
    x=(np.sin(2*np.pi*freq(m)*t)+.25*np.sin(2*np.pi*freq(m)*2*t)+.1*np.sin(2*np.pi*freq(m)*3*t))*np.exp(-t*8)*env(len(t),.008,.18)
    add(x,start,gain,pan)
    add(x,start+.375,gain*.28,-pan)
    add(x,start+.750,gain*.12,pan)

def kick(start,gain=1):
    t=np.arange(int(.45*SR))/SR
    phase=2*np.pi*(43*t+(126-43)*.027*(1-np.exp(-t/.027)))
    x=np.sin(phase)*np.exp(-t*12)+.13*rng.standard_normal(len(t))*np.exp(-t*130)
    x*=env(len(t),.001,.08)
    add(x,start,.42*gain,kind='kick' if start%2==0 else None)

def snare(start,gain=1):
    t=np.arange(int(.28*SR))/SR;n=rng.standard_normal(len(t))
    high=n-np.convolve(n,np.ones(9)/9,mode='same')
    x=.7*high*np.exp(-t*20)+.24*np.sin(2*np.pi*182*t)*np.exp(-t*27)
    x*=env(len(t),.001,.08)
    add(x,start,.17*gain,.03)
    for d in [0,.013,.029]:
        tn=np.arange(int(.09*SR))/SR
        clap=rng.standard_normal(len(tn))*np.exp(-tn*46)*env(len(tn),.001,.02)
        add(clap,start+d,.037*gain,-.04)

def hat(start,opened=False,gain=1,pan=.25):
    dur=.17 if opened else .055;t=np.arange(int(dur*SR))/SR
    n=rng.standard_normal(len(t));h=n-np.convolve(n,np.ones(5)/5,mode='same')
    x=h*np.exp(-t*(25 if opened else 75))*env(len(t),.001,.015)
    add(x,start,.047*gain,pan)

def crash(start,gain=.08):
    t=np.arange(int(1.7*SR))/SR;n=rng.standard_normal(len(t));h=n-np.convolve(n,np.ones(6)/6,mode='same')
    x=h*np.exp(-t*3)*env(len(t),.006,.35)
    add(x,start,gain,-.2,kind='transition_crash')

def riser(start,dur=1.5,gain=.05):
    t=np.arange(int(dur*SR))/SR;n=rng.standard_normal(len(t));h=n-np.convolve(n,np.ones(12)/12,mode='same')
    sw=(t/dur)**1.8
    x=h*sw*env(len(t),.01,.055)+.08*np.sin(2*np.pi*(150*t+220*t*t))*sw
    add(x,start,gain,kind='riser')

# 30 bars, 120 BPM. Every two seconds is a bar.
# Fm9 / Dbmaj7 / Abmaj7 / Ebadd9, with inversions in later sections.
chords=[[53,56,60,67],[49,53,56,60],[56,60,63,67],[51,55,58,65]]
roots=[29,25,32,27]
for bar in range(30):
    st=bar*2; idx=(bar//2)%4
    if st<4:
        pad(chords[0],st,2,.16 if bar==0 else .20)
        if bar==1:
            pluck(77,2.5,.035,-.4);pluck(72,3.25,.04,.4)
        continue
    if st>=56:
        if st==56:
            pad([53,56,60,65,67],st,3.7,.32);bass(29,st,1.6,.22);kick(st,.7);crash(st,.045)
            for j,m in enumerate([77,72,68,65]):pluck(m,56.0+j*.35,.05,(-1)**j*.3)
        continue
    # tension and orchestration changes are section based, not a tiny loop
    if st<16: density=.76;pg=.21;bg=.21;arp=.038
    elif st<30: density=.88;pg=.22;bg=.24;arp=.048
    elif st<38: density=.65;pg=.25;bg=.20;arp=.055
    elif st<48: density=.92;pg=.25;bg=.24;arp=.066
    else: density=1;pg=.28;bg=.27;arp=.072
    if st==30:idx=1
    notes=chords[idx]
    if st>=40:notes=[n+12 if k==0 else n for k,n in enumerate(notes)]
    pad(notes,st,2,pg)
    # pronounced groove with room left for narration
    kicks=[0,1] if st<8 else [0,.75,1,1.5]
    if st>=30 and st<34:kicks=[0,1]
    if st>=48:kicks=[0,.5,1,1.5]
    for off in kicks:kick(st+off,.85 if st<16 else 1)
    for off in [.5,1.5]:snare(st+off,density)
    for j in range(8):hat(st+j*.25,j%4==3,density*(.75 if j%2==0 else 1.0),(-1)**j*.28)
    if st>=40 and bar%2:
        for j in [5,7,11,13,15]:hat(st+j*.125,False,.38,(-1)**j*.55)
    root=roots[idx]
    pattern=[(0,0),(.375,0),(.75,12),(1,0),(1.375,0),(1.75,7)]
    if st<8:pattern=[(0,0),(.75,0),(1,0),(1.75,12)]
    for off,interval in pattern:bass(root+interval,st+off,.21,bg*(.8 if interval else 1))
    # a changing upper motif; sparse early, answered an octave lower later
    arpnotes=[notes[0]+24,notes[2]+12,notes[1]+24,notes[3]+12,notes[2]+24,notes[1]+24,notes[3]+12,notes[0]+24]
    keep=[0,3,6] if st<12 else [0,2,3,5,6,7]
    if 30<=st<38:keep=[0,3,4,7]
    for j in keep:pluck(arpnotes[(j+bar%3)%8],st+j*.25,arp,(-1)**j*.5)
    if st>=48:
        for j,m in enumerate([77,75,72,68] if bar%2==0 else [72,75,77,79]):
            pluck(m,st+j*.5,.058,(-1)**j*.2)
    if bar in [7,14,18,23,27]:
        for j in range(4):snare(st+1.5+j*.125,.34+.12*j)
for st in [4,16,30,38,48]:
    crash(st,.06 if st<48 else .09)
    riser(st-1.4,1.4,.045)
# Long airy tail with no hard truncation. Peak control before external loudness normalization.
t=np.arange(N)/SR
fade=np.ones(N); fade[t<.12]=np.sin(t[t<.12]/.12*np.pi/2)**2
sel=t>57.0;fade[sel]=np.cos((t[sel]-57)/3*np.pi/2)**2
mix*=fade[:,None]
mix=np.tanh(mix*1.16)/1.16
mix*=.88/max(.88,np.max(np.abs(mix)))
with wave.open(str(ROOT/'score.wav'),'wb') as f:
    f.setnchannels(2);f.setsampwidth(2);f.setframerate(SR);f.writeframes((mix*32767).astype('<i2').tobytes())
(ROOT/'music_events.json').write_text(json.dumps({'duration':60,'bpm':120,'key':'F minor','original':True,'seed':6011,'sections':[[0,4,'suspense'],[4,16,'establish'],[16,30,'characters'],[30,48,'world'],[48,56,'climax'],[56,60,'resolve']],'events':events},ensure_ascii=False,indent=2))
print('Wrote original score',np.max(np.abs(mix)),np.sqrt(np.mean(mix**2)))
