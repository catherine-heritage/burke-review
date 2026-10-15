import { sources } from './source-data.js';
import { subsidiarySources } from './subsidiary-data.js';

export const companies = [
  { name: 'Burke Group', sources, accents: [{ name: 'Gold', value: '#a67c52' }] },
  { name: 'Burke Realty', sources: subsidiarySources.realty, accents: [{ name: 'Orange', value: '#B66B3F' }, { name: 'Clay Red', value: '#A85649' }] },
  { name: 'Burke Development', sources: subsidiarySources.development, accents: [{ name: 'Slate Blue', value: '#5476A1' }, { name: 'Slate Violet', value: '#69658E' }] },
  { name: 'Burke Property Management', sources: subsidiarySources.management, accents: [{ name: 'Forest Green', value: '#41785C' }, { name: 'Deep Teal', value: '#347B7C' }] },
];
const NAVY = '#1b2e46'; // Fixed by the supplied SVGs; never offered as a palette option.

const NS = 'http://www.w3.org/2000/svg';
const labels = [
  ['Original icon spacing', 'Wider icon spacing'],
  ['Original icon shape', 'Curved layers'],
  ['Original GROUP weight', 'Extra bold GROUP'],
  ['Original letter spacing', 'Tighter BURKE and GROUP'],
  ['Original colours', 'Text one colour', 'Icon one colour'],
];
export function describe(settings) {
  const company = settings[5] || 0;
  const refinements = settings.slice(0, 5).flatMap((value, i) => value ? [labels[i][value].replace('GROUP', company ? 'lettering' : 'GROUP')] : []);
  if (company) refinements.unshift(companies[company].name, companies[company].accents[settings[6] || 0].name);
  return refinements.join(' · ') || 'Original logo';
}
const node = (tag, attributes = {}) => {
  const element = document.createElementNS(NS, tag);
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
  return element;
};

// Measure the supplied outlines once, at their native artboard coordinates.
// No web fonts, tracing, strokes or replacement lettering are used.
const measuring = document.createElement('div');
measuring.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none;left:-10000px;top:0';
measuring.setAttribute('aria-hidden', 'true');
document.body.append(measuring);
const companyReferences = companies.map(company => company.sources.map(source => {
  const svg = new DOMParser().parseFromString(source, 'image/svg+xml').documentElement;
  measuring.append(svg);
  const groups = [...svg.children].filter(child => child.localName === 'g');
  const burke = groups.find(group => group.getBBox().y > 500 && group.getBBox().y < 650);
  const group = groups.find(group => group.getBBox().y > 650);
  const iconGroup = groups.find(group => group.children.length === 3);
  const icon = iconGroup ? [...iconGroup.children] : [...svg.children].filter(child => child.localName === 'path');
  const bounds = path => {
    const b = path.getBBox();
    return { x: b.x, y: b.y, width: b.width, height: b.height };
  };
  return { svg, burke, group, icon: icon.sort((a, b) => bounds(a).y - bounds(b).y),
    iconBounds: icon.map(bounds), groupBounds: [...group.children].map(bounds) };
}));
measuring.remove();

export function makeLogo(settings) {
  const [wide, curved, bold, tight, colour, company = 0, accentIndex = 0] = settings;
  const references = companyReferences[company];
  const accent = companies[company].accents[accentIndex].value;
  // Keep incidental alignment/rounding from each single-option reference too.
  const baseIndex = tight ? 6 : bold ? 1 : curved ? 4 : wide ? 3 : colour === 2 ? 5 : colour === 1 ? 2 : 0;
  const base = references[baseIndex];
  const svg = node('svg', { viewBox: '0 0 1080 935.4', role: 'img', 'aria-label': `${companies[company].name} — ${describe(settings)}` });
  const burke = (tight ? references[6] : base).burke.cloneNode(true);
  const iconSource = references[curved ? 4 : wide ? 3 : baseIndex];
  const icon = node('g', { 'data-part': 'icon' });
  iconSource.icon.forEach((path, i) => {
    const copy = path.cloneNode(true);
    copy.setAttribute('fill', colour === 2 || i === 2 ? accent : NAVY);
    if (curved && wide) {
      // Apply the exact gap increments from 03 to the unmodified curved paths.
      // Move whole layers so the supplied curves retain their geometry.
      const original = references[0].iconBounds;
      const wider = references[3].iconBounds;
      const gap = (bounds, index) => bounds[index + 1].y - bounds[index].y - bounds[index].height;
      const dy = i === 0 ? -(gap(wider, 0) - gap(original, 0)) : i === 2 ? gap(wider, 1) - gap(original, 1) : 0;
      copy.setAttribute('transform', `translate(0 ${dy})`);
    }
    icon.append(copy);
  });
  const groupSource = references[bold ? 1 : tight ? 6 : baseIndex];
  const group = groupSource.group.cloneNode(true);
  if (bold && tight) {
    // 06 supplies each company’s descriptor size and individual letter centres.
    // Uniformly scale the actual 01 extra-bold outlines and place each at
    // those centres; never stretch letters or simulate weight with strokes.
    const capHeight = reference => Math.min(...reference.groupBounds.map(bounds => bounds.height));
    const scale = capHeight(references[6]) / capHeight(references[0]);
    [...group.children].forEach((path, i) => {
      const from = groupSource.groupBounds[i];
      const to = references[6].groupBounds[i];
      const x = to.x + to.width / 2 - (from.x + from.width / 2) * scale;
      const y = to.y + to.height / 2 - (from.y + from.height / 2) * scale;
      path.setAttribute('transform', `translate(${x} ${y}) scale(${scale})`);
    });
  }
  [...group.children].forEach(path => path.setAttribute('fill', colour ? NAVY : accent));
  burke.setAttribute('data-part', 'burke');
  group.setAttribute('data-part', 'group');
  svg.append(burke, icon, group);
  // Only the two isolated stray dots are omitted. All letter counters remain
  // in their original compound paths and retain SVG's nonzero fill rule.
  return svg;
}

