// audio.js — Web Audio API sound effects for VOID RUNNER
// All sounds synthesized at runtime, no external files needed.

let audioCtx = null;
let masterGain = null;
let muted = false;

export function initAudio() {
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  masterGain = audioCtx.createGain();
  masterGain.gain.value = 0.3;
  masterGain.connect(audioCtx.destination);
}

export function resumeAudio() {
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
}

export function toggleMute() {
  muted = !muted;
  if (masterGain) masterGain.gain.value = muted ? 0 : 0.3;
  return muted;
}

function playTone(freq, duration, type = 'square', vol = 0.15, slide = 0) {
  if (!audioCtx || muted) return;
  const t = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slide) osc.frequency.linearRampToValueAtTime(freq + slide, t + duration);
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(t);
  osc.stop(t + duration);
}

export function sfxShoot() {
  playTone(880, 0.06, 'square', 0.08, -300);
}

export function sfxHit() {
  playTone(200, 0.12, 'sawtooth', 0.12, -100);
}

export function sfxExplosion() {
  if (!audioCtx || muted) return;
  const t = audioCtx.currentTime;
  const bufferSize = audioCtx.sampleRate * 0.3;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (audioCtx.sampleRate * 0.04));
  }
  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.15, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(600, t);
  filter.frequency.exponentialRampToValueAtTime(100, t + 0.3);
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);
  noise.start(t);
  noise.stop(t + 0.3);
}

export function sfxPowerUp() {
  if (!audioCtx || muted) return;
  const t = audioCtx.currentTime;
  [523, 659, 784, 1047].forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.06, t + i * 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.15);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(t + i * 0.08);
    osc.stop(t + i * 0.08 + 0.15);
  });
}

export function sfxPlayerHit() {
  if (!audioCtx || muted) return;
  const t = audioCtx.currentTime;
  for (let i = 0; i < 3; i++) {
    playTone(150 - i * 30, 0.2, 'sawtooth', 0.12, -60);
  }
}

export function sfxWaveStart() {
  if (!audioCtx || muted) return;
  const t = audioCtx.currentTime;
  [330, 392, 523, 659, 784].forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.07, t + i * 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.2);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(t + i * 0.1);
    osc.stop(t + i * 0.1 + 0.2);
  });
}

export function sfxMenuSelect() {
  playTone(660, 0.08, 'sine', 0.06);
  setTimeout(() => playTone(880, 0.08, 'sine', 0.06), 80);
}