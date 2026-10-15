import { sources } from './source-data.js';

const NS = 'http://www.w3.org/2000/svg';
const keys = ['spacing', 'shape', 'weight', 'tracking', 'colour'];
const defaults = [0, 0, 0, 0, 0];
const labels = [
  ['Original icon spacing', 'Wider icon spacing'],
  ['Original icon shape', 'Curved layers'],
  ['Original GROUP weight', 'Extra bold GROUP'],
  ['Original letter spacing', 'Tighter BURKE and GROUP'],
  ['Original colours', 'Blue GROUP', 'Gold icon / Blue lettering'],
];
export const describe = settings => settings.flatMap((value, i) => value ? [labels[i][value]] : []).join(' · ') || 'Original logo';
const code = settings => settings.join('');
const valid = value => typeof value === 'string' && /^[01]{4}[012]$/.test(value);
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
const references = sources.map(source => {
  const svg = new DOMParser().parseFromString(source, 'image/svg+xml').documentElement;
  measuring.append(svg);
  const groups = [...svg.children].filter(child => child.localName === 'g');
  const lettering = groups.filter(group => group.children.length === 5);
  const burke = lettering.find(group => group.getBBox().y < 650);
  const group = lettering.find(group => group.getBBox().y > 650);
  const iconGroup = groups.find(group => group.children.length === 3);
  const icon = iconGroup ? [...iconGroup.children] : [...svg.children].filter(child => child.localName === 'path');
  const bounds = path => {
    const b = path.getBBox();
    return { x: b.x, y: b.y, width: b.width, height: b.height };
  };
  return { svg, burke, group, icon: icon.sort((a, b) => bounds(a).y - bounds(b).y),
    iconBounds: icon.map(bounds), groupBounds: [...group.children].map(bounds) };
});
measuring.remove();

export function makeLogo(settings) {
  const [wide, curved, bold, tight, colour] = settings;
  // Keep incidental alignment/rounding from each single-option reference too.
  const baseIndex = tight ? 6 : bold ? 1 : curved ? 4 : wide ? 3 : colour === 2 ? 5 : colour === 1 ? 2 : 0;
  const base = references[baseIndex];
  const svg = node('svg', { viewBox: '0 0 1080 935.4', role: 'img', 'aria-label': `Burke Group — ${describe(settings)}` });
  const burke = (tight ? references[6] : base).burke.cloneNode(true);
  const iconSource = references[curved ? 4 : wide ? 3 : baseIndex];
  const icon = node('g', { 'data-part': 'icon' });
  iconSource.icon.forEach((path, i) => {
    const copy = path.cloneNode(true);
    copy.setAttribute('fill', colour === 2 || i === 2 ? '#a67c52' : '#1b2e46');
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
    // 06 supplies the larger GROUP size and individual letter centres.
    // Uniformly scale the actual 01 extra-bold outlines and place each at
    // those centres; never stretch letters or simulate weight with strokes.
    const scale = 55.38 / 44.3;
    [...group.children].forEach((path, i) => {
      const from = groupSource.groupBounds[i];
      const to = references[6].groupBounds[i];
      const x = to.x + to.width / 2 - (from.x + from.width / 2) * scale;
      const y = to.y + to.height / 2 - (from.y + from.height / 2) * scale;
      path.setAttribute('transform', `translate(${x} ${y}) scale(${scale})`);
    });
  }
  [...group.children].forEach(path => path.setAttribute('fill', colour ? '#1b2e46' : '#a67c52'));
  burke.setAttribute('data-part', 'burke');
  group.setAttribute('data-part', 'group');
  svg.append(burke, icon, group);
  // Only the two isolated stray dots are omitted. All letter counters remain
  // in their original compound paths and retain SVG's nonzero fill rule.
  return svg;
}

const form = document.querySelector('#options');
const preview = document.querySelector('#preview');
const add = document.querySelector('#add');
const status = document.querySelector('#status');
const saved = document.querySelector('#saved');
const selectAll = document.querySelector('#select-all');
const clearSelection = document.querySelector('#clear-selection');
const copy = document.querySelector('#copy');
let current = [...defaults];
let favourites = [];
let nextId = 1;
const storageKey = 'burke-round-3-favourites-v1';

function restore() {
  const hash = new URLSearchParams(location.hash.slice(1));
  let codes;
  if (hash.has('compare')) {
    codes = hash.get('compare').split(',');
  } else {
    try { codes = JSON.parse(localStorage.getItem(storageKey) || '[]'); } catch { codes = []; }
  }
  if (!Array.isArray(codes)) codes = [];
  favourites = [...new Set(codes.filter(valid))].slice(0, 6).map(value => ({ id: nextId++, settings: [...value].map(Number), selected: true }));
  if (valid(hash.get('logo'))) current = [...hash.get('logo')].map(Number);
  keys.forEach((key, i) => { form.elements[key].value = current[i]; });
}
function persist() {
  try { localStorage.setItem(storageKey, JSON.stringify(favourites.map(item => code(item.settings)))); } catch { /* Sharing still works without storage. */ }
}
function updatePreview() {
  preview.replaceChildren(makeLogo(current));
  const duplicate = favourites.some(item => code(item.settings) === code(current));
  add.disabled = duplicate || favourites.length >= 6;
  add.textContent = duplicate ? 'Added to comparison' : 'Add to comparison';
  status.textContent = favourites.length >= 6 ? 'Six saved. Remove one to try another.' : '';
}
function updateSelection() {
  const selected = favourites.filter(item => item.selected).length;
  selectAll.disabled = !favourites.length || selected === favourites.length;
  clearSelection.disabled = !selected;
  copy.disabled = !selected;
}
function renderFavourites() {
  saved.replaceChildren();
  favourites.forEach((item, index) => {
    const figure = document.createElement('figure');
    figure.className = 'saved-logo';
    const art = document.createElement('div');
    art.className = 'saved-art';
    art.append(makeLogo(item.settings));
    const caption = document.createElement('figcaption');
    const row = document.createElement('div');
    row.className = 'saved-caption';
    const label = document.createElement('label');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = item.selected;
    checkbox.addEventListener('change', () => { item.selected = checkbox.checked; updateSelection(); });
    label.append(checkbox, `Option ${index + 1}`);
    const remove = document.createElement('button');
    remove.className = 'text-button';
    remove.textContent = 'Remove';
    remove.setAttribute('aria-label', `Remove option ${index + 1}`);
    remove.addEventListener('click', () => {
      favourites = favourites.filter(other => other.id !== item.id);
      persist(); renderFavourites(); updatePreview();
      const remaining = saved.querySelectorAll('.saved-caption button');
      (remaining[Math.min(index, remaining.length - 1)] || add).focus();
      status.textContent = 'Combination removed.';
    });
    const description = document.createElement('p');
    description.textContent = describe(item.settings);
    row.append(label, remove);
    caption.append(row, description);
    figure.append(art, caption);
    saved.append(figure);
  });
  document.querySelector('#count').textContent = `${favourites.length} / 6`;
  document.querySelector('#empty').hidden = !!favourites.length;
  document.querySelector('#copy-fallback').hidden = true;
  updateSelection();
}
form.addEventListener('change', () => {
  current = keys.map(key => Number(form.elements[key].value));
  updatePreview();
});
form.addEventListener('reset', () => {
  current = [...defaults];
  updatePreview();
  status.textContent = 'Original logo restored.';
});
add.addEventListener('click', () => {
  if (favourites.length >= 6 || favourites.some(item => code(item.settings) === code(current))) return;
  favourites.push({ id: nextId++, settings: [...current], selected: true });
  persist(); renderFavourites(); updatePreview();
  status.textContent = `Added. ${favourites.length} of 6 saved.`;
});
selectAll.addEventListener('click', () => { favourites.forEach(item => { item.selected = true; }); renderFavourites(); });
clearSelection.addEventListener('click', () => { favourites.forEach(item => { item.selected = false; }); renderFavourites(); });
copy.addEventListener('click', async () => {
  const selected = favourites.filter(item => item.selected);
  if (!selected.length) return;
  const url = new URL(location.href);
  url.hash = new URLSearchParams({ compare: selected.map(item => code(item.settings)).join(','), logo: code(current) }).toString();
  const link = url.href;
  try {
    await navigator.clipboard.writeText(link);
    status.textContent = 'Link copied. It opens your selected combinations.';
  } catch {
    document.querySelector('#copy-fallback').hidden = false;
    const input = document.querySelector('#share-link');
    input.value = link; input.focus(); input.select();
    status.textContent = 'Your share link is ready below.';
  }
});
window.addEventListener('hashchange', () => {
  current = [...defaults];
  restore(); updatePreview(); renderFavourites();
});
restore(); updatePreview(); renderFavourites();
