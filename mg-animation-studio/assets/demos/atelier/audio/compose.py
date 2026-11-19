#!/usr/bin/env python3
"""
Cinema-grade minimalist electronic sound design for GEMINI 4 · MATTER OF LIGHT
28.00s · 48kHz Stereo · 124 BPM · Pure NumPy DSP + FFT Stereo Convolution Reverb
"""
import os, wave, numpy as np

SR = 48000
DUR = 28.0
N = int(SR * DUR)
BPM = 124.0
BEAT = 60.0 / BPM

rng = np.random.default_rng(20261119)
L = np.zeros(N, dtype=np.float64)
R = np.zeros(N, dtype=np.float64)

def midi_hz(m):
    return 440.0 * (2.0 ** ((m - 69.0) / 12.0))

def add_mono(at, sig, gain=1.0, pan=0.0):
    s = int(round(at * SR))
    if s >= N:
        return
    if s < 0:
        sig = sig[-s:]
        s = 0
    end = min(N, s + len(sig))
    chunk = sig[: end - s] * gain
    gl = np.sqrt(0.5 * (1.0 - np.clip(pan, -1.0, 1.0)))
    gr = np.sqrt(0.5 * (1.0 + np.clip(pan, -1.0, 1.0)))
    L[s:end] += chunk * gl
    R[s:end] += chunk * gr

def one_pole_lp(x, cutoff_hz):
    # Vectorized FFT smooth low-pass filter (zero phase ripple, lush analog roll-off)
    freqs = np.fft.rfftfreq(len(x), 1.0 / SR)
    H = 1.0 / (1.0 + (freqs / max(20.0, cutoff_hz)) ** 4)
    return np.fft.irfft(np.fft.rfft(x) * H, n=len(x))

def analog_pad(freq, dur, cutoff=1100.0, attack=0.35, release=0.75):
    t = np.arange(int(dur * SR)) / SR
    # Detuned lush Juno-style dual-oscillator warm waves
    sig = (
        0.55 * np.sin(2 * np.pi * freq * t)
        + 0.25 * np.sin(2 * np.pi * freq * 1.003 * t + 0.4)
        + 0.20 * np.sin(2 * np.pi * freq * 0.997 * t + 1.1)
        + 0.14 * np.sin(2 * np.pi * freq * 2.001 * t)
        + 0.06 * np.sin(2 * np.pi * freq * 3.0 * t)
    )
    sig = one_pole_lp(sig, cutoff)
    env = np.minimum(1.0, t / max(0.01, attack)) * np.minimum(1.0, np.maximum(0.0, (dur - t) / max(0.02, release)))
    return sig * env

def felt_piano(freq, dur):
    t = np.arange(int(dur * SR)) / SR
    # Warm intimate felt-piano tone (Nils Frahm style: soft fundamental + damped 2nd/3rd harmonics)
    sig = (
        1.00 * np.sin(2 * np.pi * freq * t) * np.exp(-t * 1.35)
        + 0.34 * np.sin(2 * np.pi * freq * 2.001 * t) * np.exp(-t * 2.6)
        + 0.12 * np.sin(2 * np.pi * freq * 3.004 * t) * np.exp(-t * 4.5)
        + 0.04 * np.sin(2 * np.pi * freq * 4.009 * t) * np.exp(-t * 7.5)
    )
    attack = np.minimum(1.0, t / 0.012)
    tail = np.minimum(1.0, np.maximum(0.0, (dur - t) / 0.12))
    return sig * attack * tail

def glass_bell(freq, dur):
    t = np.arange(int(dur * SR)) / SR
    sig = (
        0.75 * np.sin(2 * np.pi * freq * t) * np.exp(-t * 3.6)
        + 0.28 * np.sin(2 * np.pi * freq * 2.756 * t) * np.exp(-t * 6.5)
        + 0.10 * np.sin(2 * np.pi * freq * 5.404 * t) * np.exp(-t * 11.0)
    )
    return sig * np.minimum(1.0, t / 0.004)

def sub_boom(dur=1.4, f0=115.0, f1=34.0):
    t = np.arange(int(dur * SR)) / SR
    phase = 2 * np.pi * (f1 * t + (f0 - f1) * 0.075 * (1.0 - np.exp(-t / 0.075)))
    sig = np.sin(phase) * np.exp(-t * 2.6)
    sig += 0.25 * np.tanh(2.2 * np.sin(phase)) * np.exp(-t * 5.0)
    return sig * np.minimum(1.0, t / 0.005)

def tight_kick():
    t = np.arange(int(0.28 * SR)) / SR
    phase = 2 * np.pi * (44.0 * t + 115.0 * 0.016 * (1.0 - np.exp(-t / 0.016)))
    click = np.sin(2 * np.pi * 1900.0 * t) * np.exp(-t * 140.0) * 0.14
    return (np.sin(phase) * np.exp(-t * 15.0) + click) * np.minimum(1.0, t / 0.002)

def rim_snap():
    t = np.arange(int(0.09 * SR)) / SR
    n = rng.standard_normal(len(t))
    n = one_pole_lp(n, 4800.0) * np.exp(-t * 58.0)
    body = np.sin(2 * np.pi * 420.0 * t) * np.exp(-t * 72.0) * 0.55
    return n * 0.75 + body

def hat_tick(dur=0.04):
    t = np.arange(int(dur * SR)) / SR
    n = rng.standard_normal(len(t))
    # High-pass via subtracting LP
    hp = n - one_pole_lp(n, 6200.0)
    return hp * np.exp(-t * 95.0)

def whoosh_riser(dur=0.85):
    t = np.arange(int(dur * SR)) / SR
    n = rng.standard_normal(len(t))
    env = (t / dur) ** 2.4 * np.minimum(1.0, (dur - t) / 0.06)
    # Sweep filtered breathy air
    low = one_pole_lp(n, 650.0) * (1.0 - t / dur)
    mid = one_pole_lp(n, 2800.0) * (t / dur)
    return (low * 0.6 + mid * 0.8) * env

def neon_ignite(dur=0.55):
    t = np.arange(int(dur * SR)) / SR
    buzz = (
        0.45 * np.sin(2 * np.pi * 120.0 * t)
        + 0.25 * np.sin(2 * np.pi * 240.0 * t)
        + 0.15 * np.sin(2 * np.pi * 360.0 * t)
        + 0.15 * (rng.standard_normal(len(t)) - one_pole_lp(rng.standard_normal(len(t)), 3500.0))
    )
    flicker = np.where(t < 0.24, 0.3 + 0.7 * np.abs(np.sin(t * 48.0)), 1.0)
    env = np.minimum(1.0, t / 0.01) * np.exp(-t * 4.5) * flicker
    return buzz * env

# =====================================================================
# ACT I (0.00 - 3.20s): SILENCE ON PAPER — Minimalist Air & Tactile Foley
# =====================================================================
for m, pan in [(50, -0.3), (57, 0.3), (64, 0.0)]:
    add_mono(0.0, analog_pad(midi_hz(m), 3.3, cutoff=680, attack=0.6, release=0.4), 0.075, pan)
# Crisp text arrival click
add_mono(0.10, rim_snap(), 0.14, -0.1)
# Razor vermilion slash whoosh
add_mono(1.16, whoosh_riser(0.42), 0.16, 0.15)
# Ceramic sphere gravity bounce foley!
add_mono(1.86, felt_piano(midi_hz(45), 0.55) * 0.8 + rim_snap()[:int(0.09*SR)].mean()*0, 0.22, 0.0)
add_mono(1.86, rim_snap(), 0.24, 0.0)
# Dramatic rising swell as sphere swallows camera lens into 3.20s!
add_mono(2.30, whoosh_riser(0.92), 0.34, 0.0)

# =====================================================================
# ACT II (3.20 - 5.60s): VERMILION SLAM -> APERTURE SPLIT
# =====================================================================
add_mono(3.20, sub_boom(1.6, 125.0, 36.0), 0.52, 0.0)
for m, pan in [(50, -0.45), (57, -0.15), (62, 0.15), (65, 0.45), (69, 0.0)]:
    add_mono(3.20, analog_pad(midi_hz(m), 2.5, cutoff=1650, attack=0.06, release=0.5), 0.095, pan)
# Tight kinetic beats
for i in range(5):
    bt = 3.20 + i * BEAT
    if bt < 5.35:
        add_mono(bt, tight_kick(), 0.34, 0.0)
        if i % 2 == 1:
            add_mono(bt, rim_snap(), 0.22, 0.12)
add_mono(5.05, whoosh_riser(0.58), 0.28, 0.0)

# =====================================================================
# ACT III (5.60 - 10.40s): 01 H HYDROGEN — LIQUID CHROME PULSE
# =====================================================================
add_mono(5.60, sub_boom(1.1, 95.0, 38.0), 0.36, 0.0)
h_chords = [(5.60, [48, 55, 60, 64, 67]), (8.00, [53, 57, 60, 64, 69])]
for st, ch in h_chords:
    for j, m in enumerate(ch):
        add_mono(st, analog_pad(midi_hz(m), 2.55, cutoff=1350, attack=0.14, release=0.45), 0.072, (j - 2) * 0.25)

# Fluid shimmering 16th/8th liquid glass arpeggio + groove
h_arp = [72, 76, 79, 83, 79, 76, 74, 79]
t_cur = 5.60
step = 0
while t_cur < 10.15:
    note = h_arp[step % len(h_arp)]
    pan = np.sin(step * 0.85) * 0.58
    add_mono(t_cur, glass_bell(midi_hz(note), 0.55), 0.068, pan)
    if step % 2 == 0:
        add_mono(t_cur, tight_kick(), 0.30, 0.0)
    if step % 4 == 2:
        add_mono(t_cur, rim_snap(), 0.20, -0.1)
    add_mono(t_cur + BEAT * 0.25, hat_tick(0.035), 0.055, 0.35 if step % 2 else -0.35)
    t_cur += BEAT * 0.5
    step += 1
add_mono(9.85, whoosh_riser(0.58), 0.32, 0.0)

# =====================================================================
# ACT IV (10.40 - 15.20s): 06 C CARBON — MONUMENTAL SUNLIT GALLERY FELT PIANO & SUB
# =====================================================================
add_mono(10.40, sub_boom(1.8, 105.0, 33.0), 0.44, 0.0)
# Strip back busy hats -> monumental half-time weight + warm felt piano chords!
c_events = [
    (10.40, [45, 52, 57, 60, 64, 71]),  # Am9
    (12.80, [41, 48, 53, 57, 60, 64])   # Fmaj7
]
for st, ch in c_events:
    for j, m in enumerate(ch):
        add_mono(st + j * 0.032, felt_piano(midi_hz(m), 2.6), 0.095, (j - 2.5) * 0.22)
        add_mono(st, analog_pad(midi_hz(m), 2.5, cutoff=820, attack=0.22, release=0.55), 0.055, (j - 2.5) * 0.2)
# Heavy architectural half-time pulse
for bt in [10.40, 11.37, 12.34, 13.30, 14.27]:
    add_mono(bt, tight_kick(), 0.32, 0.0)
add_mono(11.85, rim_snap(), 0.16, 0.08)
add_mono(13.78, rim_snap(), 0.18, -0.08)
add_mono(14.62, whoosh_riser(0.60), 0.34, 0.0)

# =====================================================================
# ACT V-A (15.20 - 18.40s): 10 Ne NEON — TUBE IGNITION + EUPHORIC SYNTH DRIVE
# =====================================================================
add_mono(15.20, sub_boom(1.3, 130.0, 36.0), 0.48, 0.0)
add_mono(15.20, neon_ignite(0.55), 0.24, 0.0)
for m, pan in [(50, -0.5), (57, -0.2), (62, 0.0), (65, 0.2), (69, 0.5), (74, 0.0)]:
    add_mono(15.20, analog_pad(midi_hz(m), 3.18, cutoff=2400, attack=0.10, release=0.25), 0.088, pan)
t_cur = 15.20
step = 0
while t_cur < 18.25:
    add_mono(t_cur, tight_kick(), 0.38, 0.0)
    if step % 2 == 1:
        add_mono(t_cur, rim_snap(), 0.26, 0.1)
    add_mono(t_cur + BEAT * 0.5, hat_tick(0.045), 0.09, 0.32)
    add_mono(t_cur, glass_bell(midi_hz([74, 77, 81, 86][step % 4]), 0.42), 0.065, -0.4 if step % 2 else 0.4)
    t_cur += BEAT
    step += 1

# =====================================================================
# ACT V-B (18.40 - 20.40s): APPLE "DON'T BLINK" 3-BEAT RHYTHMIC SLAM!!
# =====================================================================
# Dramatic silence pocket + 3 surgical high-impact percussive hits on exact cuts!
for idx, hit_t in enumerate([18.40, 19.05, 19.70]):
    add_mono(hit_t, sub_boom(0.62, 140.0 + idx * 18, 38.0), 0.56, 0.0)
    add_mono(hit_t, rim_snap(), 0.38, 0.0)
    add_mono(hit_t, glass_bell(midi_hz([76, 81, 86][idx]), 0.55), 0.14, 0.0)

# =====================================================================
# ACT VI (20.40 - 24.40s): 18 Ar ARGON — RADIANT CHROMATIC PRISM BLOOM
# =====================================================================
add_mono(20.40, sub_boom(1.5, 110.0, 35.0), 0.42, 0.0)
for m, pan in [(48, -0.5), (55, -0.25), (60, 0.0), (64, 0.25), (67, 0.5), (71, 0.15)]:
    add_mono(20.40, analog_pad(midi_hz(m), 4.05, cutoff=1950, attack=0.22, release=0.65), 0.085, pan)
# Shimmering spectral dispersion harp sweep
prism_notes = [67, 71, 74, 76, 79, 83, 86, 88, 91, 88, 83, 79]
for i, m in enumerate(prism_notes):
    add_mono(20.52 + i * 0.28, glass_bell(midi_hz(m), 1.15), 0.082, np.sin(i * 0.7) * 0.65)
for i in range(8):
    bt = 20.40 + i * BEAT
    if bt < 24.0:
        add_mono(bt, tight_kick(), 0.26, 0.0)
add_mono(23.75, whoosh_riser(0.68), 0.32, 0.0)

# =====================================================================
# ACT VII (24.40 - 28.00s): MUSEUM GALLERY FINALE — WIDE LUMINOUS CHORD RESOLUTION
# =====================================================================
add_mono(24.40, sub_boom(2.4, 96.0, 34.0), 0.44, 0.0)
# Lush wide Cadd9/Cmaj9 gallery resolution — felt piano + silky stereo halo!
fin_chord = [(48, -0.5), (55, -0.3), (60, -0.1), (62, 0.1), (64, 0.3), (67, 0.45), (71, 0.0)]
for j, (m, pan) in enumerate(fin_chord):
    add_mono(24.40 + j * 0.045, felt_piano(midi_hz(m), 3.45), 0.095, pan)
    add_mono(24.40, analog_pad(midi_hz(m), 3.45, cutoff=1450, attack=0.28, release=1.35), 0.068, pan)
add_mono(24.88, glass_bell(midi_hz(84), 2.4), 0.09, -0.25)
add_mono(25.12, glass_bell(midi_hz(88), 2.3), 0.075, 0.25)

# =====================================================================
# STUDIO STEREO CONVOLUTION ROOM REVERB (Pure NumPy FFT!)
# =====================================================================
rev_len = int(1.65 * SR)
rt = np.arange(rev_len) / SR
ir_l = rng.standard_normal(rev_len) * np.exp(-rt * 3.4) * np.minimum(1.0, rt / 0.015)
ir_r = rng.standard_normal(rev_len) * np.exp(-rt * 3.5) * np.minimum(1.0, rt / 0.018)
ir_l = one_pole_lp(ir_l, 4200.0)
ir_r = one_pole_lp(ir_r, 4000.0)
ir_l /= np.sqrt(np.sum(ir_l ** 2)) + 1e-12
ir_r /= np.sqrt(np.sum(ir_r ** 2)) + 1e-12

nfft = 1 << int(np.ceil(np.log2(N + rev_len)))
wet_l = np.fft.irfft(np.fft.rfft(L, nfft) * np.fft.rfft(ir_l, nfft), nfft)[:N]
wet_r = np.fft.irfft(np.fft.rfft(R, nfft) * np.fft.rfft(ir_r, nfft), nfft)[:N]

# Subtle lush 18% wet studio space blend
L = L * 0.88 + wet_l * 0.22
R = R * 0.88 + wet_r * 0.22

# Smooth global fade-in / fade-out + soft analog tape saturation
t_all = np.arange(N) / SR
fade = np.minimum(1.0, t_all / 0.03) * np.minimum(1.0, np.maximum(0.0, (DUR - t_all) / 0.95))
L = np.tanh(L * fade * 1.15) * 0.85
R = np.tanh(R * fade * 1.15) * 0.85

os.makedirs("out", exist_ok=True)
interleaved = np.empty(N * 2, dtype=np.int16)
interleaved[0::2] = np.round(np.clip(L, -1.0, 1.0) * 32000).astype(np.int16)
interleaved[1::2] = np.round(np.clip(R, -1.0, 1.0) * 32000).astype(np.int16)

with wave.open("out/score.wav", "wb") as wf:
    wf.setnchannels(2)
    wf.setsampwidth(2)
    wf.setframerate(SR)
    wf.writeframes(interleaved.tobytes())

print("Composed studio soundtrack: out/score.wav (28.00s, 48kHz stereo, 124 BPM)")
