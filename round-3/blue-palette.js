import { PALETTES } from '../data.js';
import { originalAccents } from './colour-model.js';
import { companies, describe, makeLogo } from './logo-renderer.js';

// Fixed Burke navy, with the owner-selected Round 3 default accents.
// Exploration overrides accents only, including Group; main navy stays fixed.
export const bluePalette = Object.freeze({
  primary: PALETTES.blue.primary,
  accents: Object.freeze([...originalAccents]),
});

export function makeFixedBlueLogo(refinements, company, exploredAccents = []) {
  // Treatments change colour placement independently of explored accents. Values match the supplied SVGs:
  // 0 = original, 1 = single-colour text (02), 2 = single-colour icon (05), 3 = inverse.
  const geometry = refinements.slice(0, 4);
  const treatment = refinements[4] || 0;
  const logo = makeLogo([...geometry, treatment, company, 0]);
  const accent = exploredAccents[company] || bluePalette.accents[company];
  logo.querySelectorAll('[data-part="burke"] path').forEach(path => path.setAttribute('fill', bluePalette.primary));
  [...logo.querySelector('[data-part="icon"]').children].forEach((path, index) => {
    const iconAccent = treatment === 3 ? company !== 0 && index < 2 : treatment === 2 || index === 2;
    path.setAttribute('fill', iconAccent ? accent : bluePalette.primary);
  });
  logo.querySelectorAll('[data-part="group"] path').forEach(path => path.setAttribute('fill', treatment === 0 || (treatment === 3 && company !== 0) ? accent : bluePalette.primary));
  logo.setAttribute('aria-label', `${companies[company].name} — Blue palette — ${describe([...geometry, treatment])}`);
  return logo;
}
