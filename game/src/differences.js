// Hit regions use scene coordinates (0–1 fractions of each illustration); every change is large
// enough to distinguish at the board's own rendered scale. The same feature IDs recur by level.
const CATALOGUE = [
  { id: 'lantern', label: 'the quay lantern', x: .16, y: .62, radius: .054, kind: 'lantern' },
  { id: 'window', label: 'the warm window', x: .80, y: .54, radius: .061, kind: 'window' },
  { id: 'boat', label: 'the little boat', x: .50, y: .76, radius: .067, kind: 'boat' },
  { id: 'gull', label: 'a gull above the water', x: .38, y: .43, radius: .049, kind: 'gull' },
  { id: 'star', label: 'a star beside the moon', x: .68, y: .19, radius: .045, kind: 'star' },
  { id: 'stripe', label: 'the sail stripe', x: .50, y: .70, radius: .046, kind: 'stripe' },
  { id: 'buoy', label: 'the floating buoy', x: .89, y: .77, radius: .050, kind: 'buoy' },
  { id: 'reflection', label: 'the broken reflection', x: .32, y: .86, radius: .059, kind: 'reflection' },
  { id: 'pennant', label: 'the mast pennant', x: .50, y: .65, radius: .047, kind: 'pennant' },
  { id: 'moon', label: 'the moonlit cloud', x: .25, y: .28, radius: .054, kind: 'cloud' },
];

export function differencesFor(level) {
  return CATALOGUE.slice(0, level.count).map((item, index) => ({
    ...item,
    // Stable slight scene-to-scene shifts make every harbour composition feel hand placed.
    x: item.x + Math.sin(level.seed * .001 + index * 1.8) * .012,
    y: item.y + Math.cos(level.seed * .002 + index * 1.3) * .009,
    phase: (level.seed + index * 37) % 360,
  }));
}
