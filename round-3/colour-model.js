export const subsidiaryNames = ['Burke Realty', 'Burke Development', 'Burke Property Management'];
export const originalAccents = ['#BD6C5A', '#648EAB', '#8F9868'];
// Curated, muted families keep shuffles distinct and sympathetic to Burke navy.
const families = [
  ['#BD6C5A', '#A85649', '#B66B3F', '#AD745D', '#A96551', '#B17B67', '#995F50', '#AF6857'],
  ['#648EAB', '#5476A1', '#597D94', '#6B879C', '#53788E', '#62869C', '#54718A', '#708EA3'],
  ['#8F9868', '#41785C', '#347B7C', '#6E8664', '#78865F', '#587C68', '#7D8B6A', '#608576'],
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
  const choices = families.map((family, i) => locked[i] ? [current[i]] : family.filter(hex => hex !== current[i]));
  const palettes = choices[0].flatMap(a => choices[1].flatMap(b => choices[2].map(c => [a, b, c])));
  // Select a complete coordinated palette, rather than greedily choosing each
  // accent. Manual locks take precedence if they make separation impossible.
  const separation = palette => Math.min(distance(palette[0], palette[1]), distance(palette[0], palette[2]), distance(palette[1], palette[2]));
  const distinct = palettes.filter(palette => separation(palette) >= 65);
  const candidates = distinct.length ? distinct : palettes.sort((a, b) => separation(b) - separation(a)).slice(0, 1);
  return [...candidates[Math.floor(random() * candidates.length)]];
}
