#!/usr/bin/env python3
"""
Tactile ASMR Industrial Foley + Teenage Engineering OP-1 / Braun Warm Analog Synth
22.00s · 48kHz Stereo · 120 BPM · Pure NumPy DSP + FFT Stereo Room Reverb
"""
import os, wave, numpy as np

SR = 48000
DUR = 22.0
N = int(SR * DUR)

rng = np.random.default_rng(19762026)
L = np.zeros(N, dtype=np.float64)
R = np.zeros(N, dtype=np.float64)

def midi_hz(m):
    return 440.0 * (2.0 ** ((m - 69.0) / 12.0))

def add(at, sig, gain=1.0, pan=0.0):
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

def lp(x, fc):
    f = np.fft.rfftfreq(len(x), 1.0 / SR)
    return np.fft.irfft(np.fft.rfft(x) * (1.0 / (1.0 + (f / max(20.0, fc)) ** 4)), n=len(x))

def rotary_detent_click():
    """Crisp machined aluminum rotary encoder click (tactile metallic snap + solid housing thump)"""
    t = np.arange(int(0.065 * SR)) / SR
    snap = np.sin(2 * np.pi * 2450 * t) * np.exp(-t * 195) * 0.55
    body = np.sin(2 * np.pi * 310 * t) * np.exp(-t * 88) * 0.65
    noise = lp(rng.standard_normal(len(t)), 5500) * np.exp(-t * 140) * 0.40
    return (snap + body + noise) * np.minimum(1.0, t / 0.001)

def keycap_thock():
    """Satisfying damped PBT mechanical keycap bottom-out thock"""
    t = np.arange(int(0.08 * SR)) / SR
    thump = np.sin(2 * np.pi * (160 + 260 * np.exp(-t * 95)) * t) * np.exp(-t * 68) * 0.80
    top = lp(rng.standard_normal(len(t)), 3400) * np.exp(-t * 110) * 0.32
    return (thump + top) * np.minimum(1.0, t / 0.0015)

def watch_tick(accent=False):
    """Authentic Swiss mechanical escapement impulse (razor metallic double-click)"""
    t = np.arange(int(0.045 * SR)) / SR
    f1 = 4200.0 if accent else 3700.0
    imp1 = np.sin(2 * np.pi * f1 * t) * np.exp(-t * 240)
    imp2 = np.sin(2 * np.pi * (f1 * 1.42) * np.maximum(0, t - 0.004)) * np.exp(-np.maximum(0, t - 0.004) * 260) * (t >= 0.004)
    return (imp1 * 0.75 + imp2 * 0.55) * np.minimum(1.0, t / 0.0005)

def speaker_sub_pulse(freq=52.0, dur=0.95):
    """Deep clean physical Braun speaker-cone acoustic bass thump"""
    t = np.arange(int(dur * SR)) / SR
    ph = 2 * np.pi * (freq * t + 75.0 * 0.03 * (1.0 - np.exp(-t / 0.03)))
    sig = np.sin(ph) * np.exp(-t * 4.2) + 0.16 * np.sin(ph * 2.0) * np.exp(-t * 7.5)
    return sig * np.minimum(1.0, t / 0.004)

def op1_rhodes(freq, dur, bright=1.0):
    """Warm Teenage Engineering OP-1 electric piano / analog felt key"""
    t = np.arange(int(dur * SR)) / SR
    sig = (
        1.00 * np.sin(2 * np.pi * freq * t) * np.exp(-t * 1.45)
        + 0.30 * bright * np.sin(2 * np.pi * freq * 2.001 * t) * np.exp(-t * 2.8)
        + 0.10 * bright * np.sin(2 * np.pi * freq * 3.003 * t) * np.exp(-t * 5.2)
        + 0.08 * bright * np.sin(2 * np.pi * freq * 7.0 * t) * np.exp(-t * 26.0) # tine bell attack
    )
    return sig * np.minimum(1.0, t / 0.008) * np.minimum(1.0, np.maximum(0.0, (dur - t) / 0.12))

def warm_pad(freq, dur, cutoff=1150.0, atk=0.28, rel=0.65):
    t = np.arange(int(dur * SR)) / SR
    sig = (
        0.55 * np.sin(2 * np.pi * freq * t)
        + 0.28 * np.sin(2 * np.pi * freq * 1.0025 * t + 0.3)
        + 0.18 * np.sin(2 * np.pi * freq * 0.9975 * t + 1.0)
        + 0.12 * np.sin(2 * np.pi * freq * 2.0 * t)
    )
    sig = lp(sig, cutoff)
    env = np.minimum(1.0, t / max(0.01, atk)) * np.minimum(1.0, np.maximum(0.0, (dur - t) / max(0.02, rel)))
    return sig * env

def sweep_whoosh(dur=0.45):
    t = np.arange(int(dur * SR)) / SR
    n = rng.standard_normal(len(t))
    env = np.sin(np.pi * t / dur) ** 1.8
    return lp(n, 2200.0) * env

# =====================================================================
# ACT I (0.00 - 3.80s): CHAOTIC UI CHATTER -> ONE SOLID DIAL CLICK -> CALM!
# =====================================================================
# Nervous scattered digital blips/chatter before 1.65s
for i in range(18):
    bt = 0.06 + i * 0.085
    if bt < 1.56:
        f = 780 + (i * 213) % 1400
        t_s = np.arange(int(0.032 * SR)) / SR
        blip = np.sin(2 * np.pi * f * t_s) * np.exp(-t_s * 95)
        add(bt, blip, 0.065, np.sin(i * 1.7) * 0.65)

# 1.65s: SOLID MACHINED ROTARY DETENT CLICK + AIR WIPE -> SUDDEN PURE CALM!
add(1.65, rotary_detent_click(), 0.72, 0.0)
add(1.65, sweep_whoosh(0.42), 0.24, 0.0)
# Warm calm Fmaj9 chord enters serenely into the newly emptied space (1.92s)
for j, m in enumerate([53, 57, 60, 64, 67]):
    add(1.92 + j * 0.03, op1_rhodes(midi_hz(m), 1.9, 0.85), 0.11, (j - 2) * 0.25)
    add(1.92, warm_pad(midi_hz(m), 1.95, 950), 0.065, (j - 2) * 0.2)
add(3.45, sweep_whoosh(0.38), 0.18, 0.1)

# =====================================================================
# ACT II (3.80 - 7.80s): 01 HONEST — CNC SPEAKER ACOUSTIC SUB PULSES
# =====================================================================
# Exact sync with the 3 traveling acoustic ripples at u = 0.40, 1.40, 2.40 (t = 4.20, 5.20, 6.20s)!
for idx, pt in enumerate([4.20, 5.20, 6.20]):
    add(pt, speaker_sub_pulse(48.0 + idx * 4.0, 1.05), 0.56, 0.0)
    add(pt, keycap_thock(), 0.20, 0.0)
    ch = [[50, 57, 62, 65, 69], [53, 57, 60, 64, 67], [48, 55, 60, 64, 67]][idx]
    for j, m in enumerate(ch):
        add(pt + j * 0.018, op1_rhodes(midi_hz(m), 1.25, 0.95), 0.095, (j - 2) * 0.28)
        add(pt, warm_pad(midi_hz(m), 1.35, 1100, 0.08, 0.45), 0.055, (j - 2) * 0.2)
# Subtle crisp hi-perc pulse between ripples
for bt in [4.70, 5.70, 6.70, 7.20]:
    add(bt, watch_tick(True), 0.16, 0.25)
add(7.42, sweep_whoosh(0.40), 0.20, -0.1)

# =====================================================================
# ACT III (7.80 - 12.40s): 02 PRECISE — 4 ROTARY DETENTS + OSCILLOSCOPE SYNTH!
# =====================================================================
detents = [8.40, 9.20, 10.00, 10.80]
detent_chords = [
    [57, 64, 69],             # Stage 1: pure open 5th (SINE)
    [57, 60, 64, 71],         # Stage 2: Am9 (TRI)
    [53, 57, 60, 64, 69],     # Stage 3: Fmaj7(13) (HARM)
    [48, 55, 60, 62, 64, 67]  # Stage 4: lush Cadd9 (CHORD)
]
for idx, dt in enumerate(detents):
    # Tactile rotary click + mechanical keycap bottom-out thock!
    add(dt, rotary_detent_click(), 0.62, -0.25)
    add(dt + 0.012, keycap_thock(), 0.48, -0.15)
    add(dt, speaker_sub_pulse(50.0, 0.55), 0.28, 0.0)
    # Harmonically richer OP-1 synth chord as oscilloscope waveform morphs!
    dur_c = 0.95 if idx < 3 else 1.55
    for j, m in enumerate(detent_chords[idx]):
        add(dt + j * 0.015, op1_rhodes(midi_hz(m), dur_c, 0.75 + idx * 0.22), 0.105, (j - 2) * 0.22)
        add(dt, warm_pad(midi_hz(m), dur_c + 0.15, 900 + idx * 350, 0.05, 0.35), 0.055, (j - 2) * 0.2)
add(12.00, sweep_whoosh(0.42), 0.20, 0.0)

# =====================================================================
# ACT IV (12.40 - 16.80s): 03 TIMELESS — SWISS MECHANICAL ESCAPEMENT TICK-TOCK
# =====================================================================
# Warm minimalist ambient bed under crisp mechanical Swiss watch ticks (exact 0.5s double-time sync!)
for m, pan in [(48, -0.35), (55, 0.0), (60, 0.35), (67, -0.2)]:
    add(12.40, warm_pad(midi_hz(m), 4.35, 760, 0.35, 0.65), 0.068, pan)
for i in range(8):
    tt = 12.40 + i * 0.50
    if tt < 16.25:
        add(tt, watch_tick(i % 2 == 0), 0.42, 0.12 if i % 2 == 0 else -0.12)
        if i in (0, 4):
            add(tt, op1_rhodes(midi_hz(72 if i == 0 else 76), 1.6, 0.8), 0.09, 0.2)
add(16.25, sweep_whoosh(0.55), 0.22, 0.0)

# =====================================================================
# ACT V (16.80 - 22.00s): FINALE — 3 BRAUN BUTTON CLICKS + SERENE MAJOR-9 RESOLUTION
# =====================================================================
# Exact sync with the 3 tactile indicator buttons at u = 0.05, 0.30, 0.55 (t = 16.85, 17.10, 17.35s)!
triad_notes = [64, 67, 72]
for idx, bt in enumerate([16.85, 17.10, 17.35]):
    add(bt, keycap_thock(), 0.58, (idx - 1) * 0.30)
    add(bt, op1_rhodes(midi_hz(triad_notes[idx]), 2.6, 0.9), 0.11, (idx - 1) * 0.28)

# Full serene museum Cmaj9 resolution blooming at 17.35s and ringing gently to silence
add(17.35, speaker_sub_pulse(48.0, 2.2), 0.34, 0.0)
for j, (m, pan) in enumerate([(48, -0.45), (55, -0.25), (60, -0.05), (62, 0.15), (64, 0.3), (67, 0.45), (71, 0.0)]):
    add(17.35 + j * 0.035, op1_rhodes(midi_hz(m), 4.4, 0.85), 0.092, pan)
    add(17.35, warm_pad(midi_hz(m), 4.5, 1300, 0.32, 1.55), 0.068, pan)

# =====================================================================
# CLEAN STUDIO ROOM REVERB (Pure NumPy FFT!)
# =====================================================================
rev_len = int(1.35 * SR)
rt = np.arange(rev_len) / SR
ir_l = lp(rng.standard_normal(rev_len) * np.exp(-rt * 4.2) * np.minimum(1.0, rt / 0.012), 4500.0)
ir_r = lp(rng.standard_normal(rev_len) * np.exp(-rt * 4.3) * np.minimum(1.0, rt / 0.015), 4300.0)
ir_l /= np.sqrt(np.sum(ir_l ** 2)) + 1e-12
ir_r /= np.sqrt(np.sum(ir_r ** 2)) + 1e-12

nfft = 1 << int(np.ceil(np.log2(N + rev_len)))
wet_l = np.fft.irfft(np.fft.rfft(L, nfft) * np.fft.rfft(ir_l, nfft), nfft)[:N]
wet_r = np.fft.irfft(np.fft.rfft(R, nfft) * np.fft.rfft(ir_r, nfft), nfft)[:N]

L = L * 0.90 + wet_l * 0.18
R = R * 0.90 + wet_r * 0.18

t_all = np.arange(N) / SR
fade = np.minimum(1.0, t_all / 0.025) * np.minimum(1.0, np.maximum(0.0, (DUR - t_all) / 0.95))
L = np.tanh(L * fade * 1.12) * 0.86
R = np.tanh(R * fade * 1.12) * 0.86

os.makedirs("out", exist_ok=True)
inter = np.empty(N * 2, dtype=np.int16)
inter[0::2] = np.round(np.clip(L, -1.0, 1.0) * 32000).astype(np.int16)
inter[1::2] = np.round(np.clip(R, -1.0, 1.0) * 32000).astype(np.int16)

with wave.open("out/score.wav", "wb") as wf:
    wf.setnchannels(2)
    wf.setsampwidth(2)
    wf.setframerate(SR)
    wf.writeframes(inter.tobytes())

print("Composed tactile industrial soundtrack: out/score.wav (22.00s, 48kHz stereo, 120 BPM)")
