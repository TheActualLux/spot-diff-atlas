import { LEVELS } from './levels.js';
import { differencesFor } from './differences.js';
import { createScene } from './scenes.js';
import { createUI } from './ui.js';
import { playClear, playFound, playHint, playWrong } from './audio.js';
import { stageShot } from './shots.js';

const ui = createUI();
const params = new URLSearchParams(location.search);
const shot = params.get('shot');
let levelIndex = 0;
let scene, found, hintsLeft, hintId, elapsed, penalty, screen = 'intro', time = 0;
let lastFrame = 0, ready = false;
let afterLevelStats = null;

function loadLevel(index) {
  levelIndex = index;
  const level = LEVELS[levelIndex];
  const differences = differencesFor(level);
  scene = createScene(level, differences);
  found = new Set(); hintsLeft = 3; hintId = null; elapsed = 0; penalty = 0;
  ui.render(snapshot());
}
function snapshot() {
  return { level: LEVELS[levelIndex], levelIndex, scene, found, hintsLeft, hint: hintId, elapsed, penalty, paused: screen !== 'playing', time };
}
function announce(text) { ui.announce(text); }
function start() {
  loadLevel(0); screen = 'playing'; ui.hideCard(); ui.setRunning(true);
  announce(`Between Tides. ${LEVELS[0].place}. Find ${LEVELS[0].count} differences.`);
  lastFrame = performance.now();
}
function beginLevel(index) {
  loadLevel(index); screen = 'playing'; ui.hideCard(); ui.setRunning(true);
  announce(`${LEVELS[index].place}. Find ${LEVELS[index].count} differences.`);
}
function clearLevel() {
  screen = 'clear'; hintId = null; ui.setPaused(true); playClear();
  const stars = elapsed + penalty <= LEVELS[levelIndex].par ? 3 : elapsed + penalty <= LEVELS[levelIndex].par * 1.5 ? 2 : 1;
  afterLevelStats = { time: Math.floor(elapsed + penalty), hints: 3 - hintsLeft, stars };
  const final = levelIndex === LEVELS.length - 1;
  ui.showCard({
    kicker: final ? 'The last light has been found' : `${LEVELS[levelIndex].place} · field note complete`,
    title: final ? 'The harbour is whole' : 'Every small thing, noticed',
    copy: final ? 'Five harbours, fifty quiet changes. Thank you for looking closely.' : `You found every change at ${LEVELS[levelIndex].name}. The tide has one more story to tell.`,
    action: final ? 'Look again' : 'Next harbour',
    stats: [[formatClock(elapsed + penalty), 'time'], [`${3 - hintsLeft} / 3`, 'hints used']],
    stars: '★'.repeat(stars) + '☆'.repeat(3 - stars), final,
  });
  announce(final ? 'All five harbours complete. Fifty differences found.' : `Level ${levelIndex + 1} complete. ${LEVELS[levelIndex + 1].count} differences await at the next harbour.`);
}
function formatClock(seconds) {
  const whole = Math.floor(seconds);
  return `${String(Math.floor(whole / 60)).padStart(2, '0')}:${String(whole % 60).padStart(2, '0')}`;
}
function continueAfterClear() {
  if (screen !== 'clear') return;
  if (levelIndex === LEVELS.length - 1) { start(); return; }
  beginLevel(levelIndex + 1);
}
function restart() {
  if (screen !== 'playing' && screen !== 'paused') return;
  loadLevel(levelIndex); screen = 'playing'; ui.hideCard(); ui.setRunning(true);
  announce(`Level restarted. Find ${LEVELS[levelIndex].count} differences.`);
}
function togglePause() {
  if (screen === 'playing') {
    screen = 'paused'; ui.showCard({ kicker: 'The tide can wait', title: 'Paused', copy: `You have found ${found.size} of ${LEVELS[levelIndex].count} differences. Take your time.`, action: 'Resume the search' });
    ui.setPaused(true); announce('Search paused. Press Escape to resume.');
  } else if (screen === 'paused') {
    screen = 'playing'; ui.hideCard(); ui.setPaused(false); announce('Search resumed.'); lastFrame = performance.now();
  }
}
function giveHint() {
  if (screen !== 'playing' || hintsLeft <= 0) return;
  const remaining = scene.differences.filter(d => !found.has(d.id));
  if (!remaining.length) return;
  // Stable cycling keeps hint requests predictable rather than random.
  const target = remaining[(3 - hintsLeft) % remaining.length];
  hintsLeft--; hintId = target.id; playHint(); announce(`Hint: look near ${target.label}. ${hintsLeft} ${hintsLeft === 1 ? 'hint' : 'hints'} remaining.`);
}
function clickAt(clientX, clientY) {
  if (screen !== 'playing') return;
  const rect = ui.changedCanvas.getBoundingClientRect();
  const x = (clientX - rect.left) / rect.width, y = (clientY - rect.top) / rect.height;
  let closest = null, distance = Infinity;
  for (const d of scene.differences) {
    if (found.has(d.id)) continue;
    const dx = (x - d.x) * 598, dy = (y - d.y) * 390;
    const normalized = Math.hypot(dx, dy) / (d.radius * 598);
    if (normalized < distance) { distance = normalized; closest = d; }
  }
  if (closest && distance <= 1.12) {
    found.add(closest.id); hintId = null; playFound();
    announce(`Found ${closest.label}. ${found.size} of ${LEVELS[levelIndex].count} differences.`);
    if (found.size === LEVELS[levelIndex].count) clearLevel();
  } else {
    penalty += 5; playWrong();
    ui.boards.classList.remove('shake'); void ui.boards.offsetWidth; ui.boards.classList.add('shake');
    announce('Not quite. Five seconds added. Keep looking.');
  }
}
function paint() { ui.render(snapshot()); }
function advance(seconds) {
  const dt = Math.max(0, seconds);
  time += dt;
  if (screen === 'playing') elapsed += dt;
}

ui.actionButton.addEventListener('click', () => {
  if (screen === 'intro' || screen === 'final') start();
  else if (screen === 'clear') continueAfterClear();
  else if (screen === 'paused') togglePause();
});
ui.hintButton.addEventListener('click', giveHint);
ui.restartButton.addEventListener('click', restart);
ui.pauseButton.addEventListener('click', togglePause);
ui.changedCanvas.addEventListener('pointerdown', event => { clickAt(event.clientX, event.clientY); });
window.addEventListener('keydown', event => {
  if (event.code === 'KeyH') { event.preventDefault(); giveHint(); }
  else if (event.code === 'KeyR') { event.preventDefault(); restart(); }
  else if (event.code === 'Escape') { event.preventDefault(); togglePause(); }
});
window.addEventListener('resize', paint);

document.addEventListener('visibilitychange', () => {
  if (document.hidden && screen === 'playing' && !shot) togglePause();
});

// Expose the same private rule entry points to the deterministic screenshot driver.
const shotGame = {
  start,
  advance(seconds) { advance(seconds); paint(); },
  clickDifference(index) {
    if (screen !== 'playing') return;
    const d = scene.differences[index];
    if (d) clickAt(d.x * ui.changedCanvas.clientWidth + ui.changedCanvas.getBoundingClientRect().left, d.y * ui.changedCanvas.clientHeight + ui.changedCanvas.getBoundingClientRect().top);
    paint();
  },
  continueAfterClear,
  differenceCount() { return scene.differences.length; },
};

if (shot) {
  loadLevel(0);
  stageShot(shot, shotGame);
  let paints = 0;
  function shotPaint() {
    paint();
    if (++paints < 3) requestAnimationFrame(shotPaint);
    else { ready = true; window.__shotReady = true; }
  }
  requestAnimationFrame(shotPaint);
} else {
  loadLevel(0);
  ui.showCard({ kicker: 'A harbour after dark', title: 'Take a slow look', copy: 'Six small things have changed between these two views. Click them in the right-hand scene to circle them in both.', action: 'Begin the search' });
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(Math.max((now - lastFrame) / 1000, 0), .1);
    lastFrame = now;
    time += dt;
    if (screen === 'playing') elapsed += dt;
    paint();
  }
  requestAnimationFrame(frame);
}
