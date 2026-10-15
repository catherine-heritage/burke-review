import { PALETTES } from '../data.js';
import { companies, describe, makeLogo } from './logo-renderer.js';

// The supplied Round 2 Blue logo colours, with Round 2's fixed child accents.
// Default display colours; exploration may override subsidiary accents only.
export const bluePalette = Object.freeze({
  primary: PALETTES.blue.primary,
  accents: Object.freeze([PALETTES.blue.secondary, '#BD6C5A', '#648EAB', '#8F9868']),
});

export function makeFixedBlueLogo(refinements, company, subsidiaryAccents = []) {
  // Treatments change colour placement only; the Blue palette and each
  // selected subsidiary accent are independent. Values match the supplied SVGs:
  // 0 = original, 1 = single-colour text (02), 2 = single-colour icon (05), 3 = inverse.
  const geometry = refinements.slice(0, 4);
  const treatment = refinements[4] || 0;
  const logo = makeLogo([...geometry, treatment, company, 0]);
  const accent = company > 0 ? subsidiaryAccents[company - 1] || bluePalette.accents[company] : bluePalette.accents[0];
  logo.querySelectorAll('[data-part="burke"] path').forEach(path => path.setAttribute('fill', bluePalette.primary));
  [...logo.querySelector('[data-part="icon"]').children].forEach((path, index) => {
    const iconAccent = treatment === 3 ? company !== 0 && index < 2 : treatment === 2 || index === 2;
    path.setAttribute('fill', iconAccent ? accent : bluePalette.primary);
  });
  logo.querySelectorAll('[data-part="group"] path').forEach(path => path.setAttribute('fill', treatment === 0 || (treatment === 3 && company !== 0) ? accent : bluePalette.primary));
  logo.setAttribute('aria-label', `${companies[company].name} — Blue palette — ${describe([...geometry, treatment])}`);
  return logo;
}
