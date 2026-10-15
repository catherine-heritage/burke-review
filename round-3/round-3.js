import { makeLogo, describe, companies } from './logo-renderer.js';
export { makeLogo, describe } from './logo-renderer.js';
const keys = ['spacing', 'shape', 'weight', 'tracking', 'colour'];
const defaults = [0, 0, 0, 0, 0, 0, 0];
// Five-digit Group links from the original Round 3 remain valid.
const code = settings => (settings[5] ? settings : settings.slice(0, 5)).join('');
const valid = value => typeof value === 'string' && /^[01]{4}[012](?:[0-3][01])?$/.test(value) && !(value[5] === '0' && value[6] === '1');
const decode = value => [...value.padEnd(7, '0')].map(Number);
const accents = [0, 0, 0, 0];
const companySelector = document.querySelector('.company-selector');
const swatches = document.querySelector('#accent-swatches');

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
  favourites = [...new Set(codes.filter(valid).map(value => code(decode(value))))].slice(0, 6).map(value => ({ id: nextId++, settings: decode(value), selected: true }));
  if (valid(hash.get('logo'))) current = decode(hash.get('logo'));
  syncControls();
}
function syncControls() {
  keys.forEach((key, i) => { form.elements[key].value = current[i]; });
  companySelector.querySelector(`input[value="${current[5]}"]`).checked = true;
  accents[current[5]] = current[6];
  document.querySelector('#weight-label').textContent = current[5] ? 'Lettering weight' : 'GROUP weight';
  swatches.hidden = !current[5];
  swatches.replaceChildren();
  if (current[5]) companies[current[5]].accents.forEach((accent, i) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'accent-swatch';
    button.style.setProperty('--accent', accent.value);
    button.title = accent.name;
    button.setAttribute('aria-label', accent.name);
    button.setAttribute('aria-pressed', String(i === current[6]));
    button.addEventListener('click', () => {
      current[6] = i;
      accents[current[5]] = i;
      [...swatches.children].forEach((swatch, index) => swatch.setAttribute('aria-pressed', String(index === i)));
      updatePreview();
    });
    swatches.append(button);
  });
}
companySelector.addEventListener('change', event => {
  const company = Number(event.target.value);
  current[5] = company;
  current[6] = accents[company];
  syncControls(); updatePreview();
});
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
  current = [...keys.map(key => Number(form.elements[key].value)), current[5], current[6]];
  updatePreview();
});
form.addEventListener('reset', () => {
  current = [...defaults];
  syncControls();
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
