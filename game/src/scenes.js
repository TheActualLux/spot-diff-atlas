import { BASE_HEIGHT, BASE_WIDTH } from './levels.js';

function seeded(seed) {
  let value = seed | 0;
  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) | 0;
    return (value >>> 0) / 4294967296;
  };
}

export function createScene(level, differences) {
  const random = seeded(level.seed);
  const stars = Array.from({ length: 82 }, () => ({ x: random() * BASE_WIDTH, y: 18 + random() * 142, r: .55 + random() * 1.2, a: .27 + random() * .61 }));
  const windows = Array.from({ length: 9 }, (_, i) => ({ x: 345 + i * 25 + random() * 8, y: 191 + random() * 18, w: 4 + random() * 3, h: 5 + random() * 4, warm: random() > .26 }));
  const ripples = Array.from({ length: 34 }, () => ({ x: 20 + random() * 558, y: 269 + random() * 112, w: 5 + random() * 25, a: .12 + random() * .22, color: random() > .4 ? level.waterLight : level.light }));
  return { level, differences, stars, windows, ripples };
}

const TAU = Math.PI * 2;

function path(ctx, points, fill) {
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function feature(ctx, scene, difference, changed) {
  const { x, y, kind, phase } = difference;
  const l = scene.level;
  const px = x * BASE_WIDTH;
  const py = y * BASE_HEIGHT;
  if (!changed) return;
  ctx.save();
  switch (kind) {
    case 'lantern': {
      const glow = ctx.createRadialGradient(px, py, 1, px, py, 28);
      glow.addColorStop(0, 'rgba(241,204,135,.25)'); glow.addColorStop(1, 'rgba(241,204,135,0)');
      ctx.fillStyle = glow; ctx.fillRect(px - 30, py - 30, 60, 60);
      ctx.strokeStyle = '#a8aaa0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(px, py + 15); ctx.lineTo(px, py - 4); ctx.stroke();
      ctx.fillStyle = '#24333a'; ctx.fillRect(px - 6, py - 12, 12, 10);
      ctx.fillStyle = '#f1ce8d'; ctx.fillRect(px - 4, py - 10, 8, 6);
      ctx.fillStyle = '#9da19a'; ctx.fillRect(px - 9, py - 14, 18, 2); ctx.fillRect(px - 8, py - 2, 16, 2);
      break;
    }
    case 'window':
      ctx.fillStyle = '#3b4440'; ctx.fillRect(px - 11, py - 11, 22, 25);
      ctx.fillStyle = '#f1ce8d'; ctx.fillRect(px - 8, py - 8, 16, 19);
      ctx.fillStyle = '#684b39'; ctx.fillRect(px - 1, py - 8, 2, 19); ctx.fillRect(px - 8, py, 16, 2);
      break;
    case 'boat':
      ctx.fillStyle = '#d2a17b'; ctx.fillRect(px - 1, py - 34, 2, 31);
      path(ctx, [[px, py - 32], [px + 24, py - 9], [px, py - 9]], '#e6d7bd');
      path(ctx, [[px - 1, py - 28], [px - 17, py - 11], [px - 1, py - 11]], '#c7b89e');
      path(ctx, [[px - 24, py], [px + 28, py], [px + 19, py + 12], [px - 16, py + 12]], l.hull);
      ctx.fillStyle = '#d59869'; ctx.fillRect(px - 9, py + 2, 13, 2);
      break;
    case 'gull':
      ctx.strokeStyle = '#d6d5c8'; ctx.lineWidth = 2.1; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(px - 14, py + 2); ctx.quadraticCurveTo(px - 6, py - 9, px, py); ctx.quadraticCurveTo(px + 6, py - 9, px + 14, py + 2); ctx.stroke();
      break;
    case 'star':
      ctx.save(); ctx.translate(px, py); ctx.rotate(phase * Math.PI / 180);
      ctx.fillStyle = '#fff0c9'; ctx.shadowColor = '#f2dba3'; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(0, 0, 3.4, 0, TAU); ctx.fill(); ctx.restore();
      break;
    case 'stripe':
      ctx.save(); ctx.translate(px, py); ctx.rotate(-.63); ctx.fillStyle = '#e7ae80'; ctx.fillRect(-11, -2, 22, 5); ctx.restore();
      break;
    case 'buoy':
      ctx.fillStyle = '#e99070'; ctx.beginPath(); ctx.ellipse(px, py, 9, 12, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#f4d5a7'; ctx.fillRect(px - 7, py - 3, 14, 3);
      ctx.strokeStyle = '#7f9d9a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(px, py + 12); ctx.lineTo(px + 2, py + 19); ctx.stroke();
      break;
    case 'reflection':
      ctx.strokeStyle = 'rgba(237,203,146,.8)'; ctx.lineWidth = 2.3;
      for (let i = 0; i < 5; i++) { const yy = py - 13 + i * 6; ctx.beginPath(); ctx.moveTo(px - (i % 2 ? 14 : 8), yy); ctx.lineTo(px + (i % 2 ? 7 : 15), yy); ctx.stroke(); }
      break;
    case 'pennant':
      ctx.fillStyle = '#edaa79'; path(ctx, [[px, py - 8], [px + 21, py - 4], [px + 1, py + 4]], '#edaa79');
      break;
    case 'cloud':
      ctx.fillStyle = '#344751'; ctx.beginPath(); ctx.ellipse(px, py, 24, 7, -.08, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.ellipse(px - 8, py - 3, 11, 6, 0, Math.PI, TAU); ctx.fill();
      break;
  }
  ctx.restore();
}

function drawScene(ctx, scene, found, options) {
  const { level } = scene;
  const gradient = ctx.createLinearGradient(0, 0, 0, BASE_HEIGHT);
  gradient.addColorStop(0, level.sky[0]); gradient.addColorStop(.64, level.sky[1]); gradient.addColorStop(1, '#172c3b');
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, BASE_WIDTH, BASE_HEIGHT);
  const horizonGlow = ctx.createRadialGradient(365, 196, 4, 365, 196, 220);
  horizonGlow.addColorStop(0, 'rgba(196,166,124,.12)'); horizonGlow.addColorStop(1, 'rgba(196,166,124,0)');
  ctx.fillStyle = horizonGlow; ctx.fillRect(150, 0, 420, 290);

  ctx.save();
  for (const s of scene.stars) {
    ctx.globalAlpha = s.a; ctx.fillStyle = '#f0e8d3'; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, TAU); ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = level.moon; ctx.beginPath(); ctx.arc(440, 75, 20, 0, TAU); ctx.fill();
  ctx.fillStyle = level.sky[0]; ctx.beginPath(); ctx.arc(449, 68, 18, 0, TAU); ctx.fill();
  ctx.restore();

  // Low cloud banks and the dark, layered headlands.
  ctx.fillStyle = level.cloud;
  for (const [x, y, w] of [[28, 102, 88], [168, 125, 74], [384, 92, 96], [482, 130, 88]]) {
    ctx.beginPath(); ctx.ellipse(x, y, w * .5, 8, -.025, 0, TAU); ctx.fill();
  }
  path(ctx, [[0, 200], [58, 173], [119, 181], [173, 159], [237, 180], [288, 166], [349, 192], [404, 174], [472, 185], [535, 166], [598, 180], [598, 256], [0, 256]], level.far);
  path(ctx, [[0, 218], [65, 204], [129, 212], [194, 190], [254, 208], [316, 197], [378, 213], [443, 197], [503, 209], [561, 197], [598, 207], [598, 264], [0, 264]], '#283f49');

  // A beam gives the lighthouse a little quiet drama, behind all of the quay silhouettes.
  const beam = ctx.createLinearGradient(75, 128, 270, 166);
  beam.addColorStop(0, 'rgba(242,211,156,.13)'); beam.addColorStop(1, 'rgba(242,211,156,0)');
  ctx.fillStyle = beam; path(ctx, [[73, 121], [264, 173], [256, 190], [72, 128]], 'rgba(230,207,157,.055)');
  ctx.fillStyle = '#c0b9a7'; ctx.fillRect(58, 146, 31, 66);
  path(ctx, [[54, 147], [93, 147], [87, 139], [62, 139]], '#d6cbb3');
  ctx.fillStyle = '#66757a'; ctx.fillRect(63, 133, 21, 8);
  ctx.fillStyle = level.light; ctx.fillRect(65, 135, 17, 5);
  path(ctx, [[51, 212], [97, 212], [105, 219], [46, 219]], '#544d47');
  ctx.fillStyle = '#77847d'; ctx.fillRect(67, 158, 5, 9); ctx.fillRect(77, 158, 5, 9);
  ctx.fillStyle = '#35464a'; ctx.fillRect(67, 158, 5, 3); ctx.fillRect(77, 158, 5, 3);

  // Waterfront cottages: nine individually placed, softly glowing windows.
  const houseX = [340, 372, 402, 434, 465, 496, 527, 555];
  for (let i = 0; i < houseX.length; i++) {
    const x = houseX[i], y = 203 + [8, 0, 10, 2, 13, 4, 9, 0][i];
    ctx.fillStyle = level.house; ctx.fillRect(x, y, 33, 37);
    ctx.fillStyle = '#4f4e47'; path(ctx, [[x - 4, y], [x + 16, y - 13], [x + 37, y]], '#554e48');
    ctx.fillStyle = '#342f30'; ctx.fillRect(x + 13, y + 19, 8, 18);
  }
  for (let i = 0; i < scene.windows.length; i++) {
    const w = scene.windows[i]; ctx.fillStyle = w.warm ? level.light : '#31454a'; ctx.fillRect(w.x, w.y, w.w, w.h);
  }
  ctx.fillStyle = '#817666'; ctx.fillRect(329, 244, 270, 9);
  ctx.fillStyle = '#746b5d'; ctx.fillRect(314, 248, 284, 12);

  // Dusky water, with individually seeded glints.
  ctx.fillStyle = level.water; ctx.fillRect(0, 256, BASE_WIDTH, 134);
  const waterfade = ctx.createLinearGradient(0, 256, 0, 390);
  waterfade.addColorStop(0, 'rgba(18,42,53,.03)'); waterfade.addColorStop(1, 'rgba(6,22,34,.52)');
  ctx.fillStyle = waterfade; ctx.fillRect(0, 256, BASE_WIDTH, 134);
  for (const r of scene.ripples) { ctx.globalAlpha = r.a; ctx.fillStyle = r.color; ctx.fillRect(r.x, r.y, r.w, 1.2); }
  ctx.globalAlpha = 1;
  // Broken lighthouse reflection, which stays a landmark in both scenes.
  ctx.fillStyle = 'rgba(232,195,133,.35)';
  for (let i = 0; i < 7; i++) ctx.fillRect(70 + (i % 2) * 5, 268 + i * 6, 10 - (i % 3) * 2, 2);

  // Mooring posts and the main fishing skiff.
  ctx.fillStyle = '#856e59'; ctx.fillRect(261, 285, 4, 19); ctx.fillRect(312, 282, 4, 21);
  ctx.fillStyle = '#d8bb94'; ctx.fillRect(264, 286, 36, 1);
  ctx.fillStyle = level.hull;
  path(ctx, [[271, 291], [320, 291], [312, 304], [279, 304]], level.hull);
  ctx.fillStyle = '#b88768'; ctx.fillRect(282, 292, 13, 3); ctx.fillRect(304, 294, 6, 2);
  ctx.strokeStyle = '#cfb38e'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(299, 289); ctx.lineTo(299, 255); ctx.stroke();
  path(ctx, [[298, 257], [282, 282], [298, 282]], '#d8cdb4');
  path(ctx, [[301, 260], [315, 281], [301, 281]], '#bdad94');
  ctx.fillStyle = 'rgba(226,198,151,.34)'; ctx.fillRect(278, 307, 34, 2);
  ctx.fillStyle = 'rgba(226,198,151,.2)'; ctx.fillRect(285, 312, 20, 1.5);

  // A second distant boat is a useful scale cue, not a difference hotspot.
  ctx.fillStyle = '#60544c'; path(ctx, [[160, 260], [185, 260], [181, 267], [164, 267]], '#60544c');
  ctx.fillStyle = '#b6ae9a'; ctx.fillRect(172, 246, 1, 14);
  path(ctx, [[173, 247], [164, 258], [173, 258]], '#d0c5ac');

  // Quay silhouette, timber edge, and a few grass marks.
  path(ctx, [[0, 239], [135, 239], [150, 246], [249, 246], [249, 269], [0, 269]], level.shore);
  ctx.fillStyle = '#826f59'; ctx.fillRect(0, 264, 248, 5);
  ctx.fillStyle = '#b39770'; ctx.fillRect(0, 268, 248, 2);
  for (const x of [15, 27, 109, 122, 198, 216, 231]) {
    ctx.strokeStyle = '#71806a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, 239); ctx.lineTo(x - 2, 232 - (x % 3)); ctx.stroke();
  }
  // Foreground water should meet the quay cleanly, preserving its small reflected edge.
  ctx.fillStyle = level.water; ctx.fillRect(0, 270, 248, 120);
  ctx.fillStyle = 'rgba(94,147,141,.33)'; ctx.fillRect(25, 281, 43, 2); ctx.fillRect(122, 288, 31, 1.5); ctx.fillRect(194, 277, 38, 1.5);
  ctx.fillStyle = '#213d45'; ctx.fillRect(0, 256, 250, 5);
  ctx.fillStyle = '#7c755e'; ctx.fillRect(0, 258, 246, 2);

  // Small provenance line adds an illustrated field-guide finish.
  ctx.fillStyle = 'rgba(215,215,198,.42)'; ctx.font = '9px ui-sans-serif, system-ui, sans-serif'; ctx.textAlign = 'left';
  ctx.fillText(level.place.toUpperCase(), 12, 382);
  ctx.textAlign = 'right'; ctx.fillText('NIGHT WATCH  ·  02:17', BASE_WIDTH - 12, 382);

  // Changed-side details are real additions or alterations to this shared harbour painting.
  if (options.changed) {
    for (const difference of scene.differences) feature(ctx, scene, difference, true);
  }
  if (options.markers) {
    for (const difference of scene.differences) {
      if (!found.has(difference.id)) continue;
      const x = difference.x * BASE_WIDTH, y = difference.y * BASE_HEIGHT;
      const radius = difference.radius * BASE_WIDTH;
      ctx.save(); ctx.strokeStyle = 'rgba(239,155,119,.94)'; ctx.lineWidth = 2.6;
      ctx.shadowColor = 'rgba(239,155,119,.52)'; ctx.shadowBlur = 9;
      ctx.beginPath(); ctx.arc(x, y, radius, -.18, TAU - .18); ctx.stroke();
      ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(246,216,175,.76)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(x, y, radius - 4, .25, 1.75); ctx.stroke(); ctx.restore();
    }
  }
  if (options.hint) {
    const d = options.hint, x = d.x * BASE_WIDTH, y = d.y * BASE_HEIGHT;
    const pulse = .5 + .5 * Math.sin(options.time * 5);
    ctx.save(); ctx.strokeStyle = `rgba(234,209,149,${.62 + pulse * .35})`; ctx.lineWidth = 3 + pulse;
    ctx.shadowColor = '#e9d196'; ctx.shadowBlur = 11 + pulse * 8;
    ctx.beginPath(); ctx.arc(x, y, d.radius * BASE_WIDTH + 7 + pulse * 4, 0, TAU); ctx.stroke(); ctx.restore();
  }
}

export function paintHarbour(canvas, scene, found, options = {}) {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const width = canvas.clientWidth || BASE_WIDTH;
  const height = Math.round(width * BASE_HEIGHT / BASE_WIDTH);
  if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) {
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
  }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(canvas.width / BASE_WIDTH, 0, 0, canvas.height / BASE_HEIGHT, 0, 0);
  drawScene(ctx, scene, found, options);
}
