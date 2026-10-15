import { PALETTES } from '../data.js';
import { companies, describe, makeLogo } from './logo-renderer.js';

// The supplied Round 2 Blue logo colours, with Round 2's fixed child accents.
// These are display constants, never viewer-editable settings.
export const bluePalette = Object.freeze({
  primary: PALETTES.blue.primary,
  accents: Object.freeze([PALETTES.blue.secondary, '#BD6C5A', '#648EAB', '#8F9868']),
});

export function makeFixedBlueLogo(refinements, company) {
  // Only the four geometry choices are accepted. Old colour/accent choices
  // cannot override this palette, including through a legacy URL fragment.
  const geometry = refinements.slice(0, 4);
  const logo = makeLogo([...geometry, 0, company, 0]);
  const accent = bluePalette.accents[company];
  logo.querySelectorAll('[data-part="burke"] path').forEach(path => path.setAttribute('fill', bluePalette.primary));
  [...logo.querySelector('[data-part="icon"]').children].forEach((path, index) => {
    path.setAttribute('fill', index === 2 ? accent : bluePalette.primary);
  });
  logo.querySelectorAll('[data-part="group"] path').forEach(path => path.setAttribute('fill', accent));
  logo.setAttribute('aria-label', `${companies[company].name} — Blue palette — ${describe(geometry)}`);
  return logo;
}
