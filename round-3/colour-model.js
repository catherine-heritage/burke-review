export const subsidiaryNames = ['Burke Realty', 'Burke Development', 'Burke Property Management'];
export const originalAccents = ['#BD6C5A', '#648EAB', '#8F9868'];
// Curated, muted families keep shuffles distinct and sympathetic to Burke navy.
export const colourFamilies = [
  // Orange: terracotta, burnt orange, copper, rust, clay and muted amber.
  ['#B66B3F', '#A9542F', '#C17A46', '#995232', '#B98253', '#A96842',
   '#C1855B', '#9E653D', '#B85E35', '#A87B45', '#BC8A4E', '#925B3E',
   '#C07B62', '#AC6046', '#A06F55', '#B28B5B', '#8F512F', '#BC724D'],
  // Purple: plum, aubergine, smoky violet, dusty lavender and slate purple.
  ['#67405E', '#77516F', '#543D59', '#82628B', '#69658E', '#8B6B89',
   '#62476F', '#765D83', '#59445F', '#8C7898', '#705D78', '#785269',
   '#5D526F', '#92799E', '#63425B', '#81758F', '#734E7A', '#6C607D'],
  // Green and teal: forest, olive, sage, moss, eucalyptus, petrol and deep teal.
  ['#41785C', '#347B73', '#6E8664', '#78865F', '#587C68', '#7D8B6A',
   '#496B50', '#65815B', '#88956F', '#3D6754', '#547C75', '#75896E',
   '#5D7350', '#829583', '#426B66', '#6B805D', '#376452', '#7B8552',
   '#347B7C', '#2F6668', '#4E8987', '#3C7475', '#5C9390', '#427F83',
   '#326B70', '#568A88', '#3D737C', '#60918B', '#2D6262', '#4B8180'],
];
export function normaliseHex(value) {
  const hex = value.trim().replace(/^#/, '');
  if (/^[\da-f]{3}$/i.test(hex)) return '#' + [...hex].map(c => c + c).join('').toUpperCase();
  return /^[\da-f]{6}$/i.test(hex) ? '#' + hex.toUpperCase() : null;
}
function distance(a, b) {
  const rgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
  const aa = rgb(a), bb = rgb(b);
  return Math.hypot(...aa.map((v, i) => v - bb[i]));
}
export function shuffleAccents(current, locked, random = Math.random) {
  const choices = colourFamilies.map((family, i) => {
    if (locked[i]) return [current[i]];
    // A visible step between shuffles, including after a manual colour edit.
    const changed = family.filter(hex => distance(hex, current[i]) >= 45);
    return changed.length ? changed : [...family].sort((a, b) => distance(b, current[i]) - distance(a, current[i])).slice(0, 1);
  });
  const palettes = choices[0].flatMap(a => choices[1].flatMap(b => choices[2].map(c => [a, b, c])));
  // Select a complete coordinated palette, rather than greedily choosing each
  // accent. Manual locks take precedence if they make separation impossible.
  const separation = palette => Math.min(distance(palette[0], palette[1]), distance(palette[0], palette[2]), distance(palette[1], palette[2]));
  const distinct = palettes.filter(palette => separation(palette) >= 65);
  const candidates = distinct.length ? distinct : palettes.sort((a, b) => separation(b) - separation(a)).slice(0, 1);
  return [...candidates[Math.floor(random() * candidates.length)]];
}
