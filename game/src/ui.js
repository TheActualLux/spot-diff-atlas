import { paintHarbour } from './scenes.js';

const $ = id => document.getElementById(id);
const formatTime = seconds => {
  const total = Math.floor(Math.max(0, seconds));
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

export function createUI() {
  const reference = $('reference'), changed = $('changed');
  return {
    canvases: { reference, changed },
    render({ level, levelIndex, found, elapsed, penalty, hintsLeft, hint, paused, scene, time }) {
      $('level-chip').innerHTML = `Level ${String(levelIndex + 1).padStart(2, '0')} &nbsp;/&nbsp; 05`;
      $('scene-name').textContent = level.name;
      $('counter').textContent = `${found.size} / ${level.count}`;
      $('counter-caption').textContent = found.size === level.count ? 'every small thing, noticed' : found.size === 0 ? 'a slow look is a good look' : 'keep looking gently';
      const progress = Math.round(found.size / level.count * 100);
      $('progress-fill').style.width = `${progress}%`;
      $('progress-track').setAttribute('aria-valuemax', String(level.count));
      $('progress-track').setAttribute('aria-valuenow', String(found.size));
      $('timer').textContent = formatTime(elapsed + penalty);
      $('hint-button').disabled = paused || hintsLeft <= 0;
      $('restart-button').disabled = paused;
      $('pause-button').disabled = paused;
      $('pause-button').innerHTML = 'Pause <kbd>Esc</kbd>';
      for (const [index, dot] of [...$('hint-dots').children].entries()) dot.classList.toggle('used', index >= hintsLeft);
      const drawOptions = { time, markers: true };
      const marks = new Set(found);
      const referenceHint = hint && scene.differences.find(d => d.id === hint);
      const changedHint = referenceHint;
      paintHarbour(reference, scene, marks, { ...drawOptions, changed: false, hint: referenceHint });
      paintHarbour(changed, scene, marks, { ...drawOptions, changed: true, hint: changedHint });
    },
    announce(text) { $('status').textContent = text; },
    setRunning(running) {
      $('hint-button').disabled = !running;
      $('restart-button').disabled = !running;
      $('pause-button').disabled = !running;
    },
    setPaused(paused) {
      $('pause-button').innerHTML = paused ? 'Resume <kbd>Esc</kbd>' : 'Pause <kbd>Esc</kbd>';
      $('hint-button').disabled = paused;
      $('restart-button').disabled = paused;
    },
    showCard({ kicker, title, copy, action, stats, stars, final = false }) {
      $('card-kicker').textContent = kicker;
      $('card-title').textContent = title;
      $('card-copy').textContent = copy;
      $('card-action').textContent = action;
      const statsNode = $('card-stats');
      statsNode.hidden = !stats;
      statsNode.innerHTML = stats ? stats.map(([value, label]) => `<div class="card-stat"><strong>${value}</strong><span>${label}</span></div>`).join('') : '';
      const starsNode = $('stars');
      starsNode.hidden = !stars;
      starsNode.textContent = stars || '';
      starsNode.setAttribute('aria-label', stars ? `${stars.length} stars` : '');
      $('card-action').dataset.final = String(final);
      $('veil').hidden = false;
      $('card-action').focus();
    },
    hideCard() { $('veil').hidden = true; },
    get actionButton() { return $('card-action'); },
    get hintButton() { return $('hint-button'); },
    get restartButton() { return $('restart-button'); },
    get pauseButton() { return $('pause-button'); },
    get changedCanvas() { return changed; },
    get boards() { return $('boards'); },
  };
}
