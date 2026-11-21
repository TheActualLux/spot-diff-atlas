// Tiny locally generated Web Audio cues. Audio is lazy and silent until a user gesture unlocks it.
let context = null;
let enabled = false;
function unlockAudio() {
  enabled = true;
  if (context) { if (context.state === 'suspended') context.resume(); return; }
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) context = new AudioContextClass();
  } catch { /* The browser may not provide Web Audio. */ }
}
window.addEventListener('pointerdown', unlockAudio, { once: true });
window.addEventListener('keydown', unlockAudio, { once: true });
function tone(frequency, duration, type = 'sine', volume = .045, delay = 0) {
  try {
    if (!enabled || !context) return;
    const ctx = context;
    if (ctx.state === 'suspended') ctx.resume();
    const oscillator = ctx.createOscillator(), gain = ctx.createGain();
    oscillator.type = type; oscillator.frequency.setValueAtTime(frequency, ctx.currentTime + delay);
    gain.gain.setValueAtTime(.0001, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(volume, ctx.currentTime + delay + .015);
    gain.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + delay + duration);
    oscillator.connect(gain); gain.connect(ctx.destination);
    oscillator.start(ctx.currentTime + delay); oscillator.stop(ctx.currentTime + delay + duration + .03);
  } catch { /* Audio is an embellishment; the game remains complete without it. */ }
}
export function playFound() { tone(587.33, .16, 'sine', .055); tone(783.99, .22, 'sine', .04, .08); }
export function playWrong() { tone(165, .17, 'triangle', .035); }
export function playHint() { tone(659.25, .2, 'sine', .035); }
export function playClear() { tone(523.25, .26, 'sine', .045); tone(659.25, .27, 'sine', .045, .12); tone(783.99, .38, 'sine', .05, .25); }
