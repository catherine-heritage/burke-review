import { mountVoting } from './voting.js';
import { describe } from './logo-renderer.js';
import { makeFixedBlueLogo } from './blue-palette.js';

const keys = ['spacing', 'shape', 'weight', 'tracking', 'colour'];
const form = document.querySelector('#options');
const previews = ['#preview', '#preview-realty', '#preview-development', '#preview-management'].map(selector => document.querySelector(selector));
let current = [0, 0, 0, 0, 0];
let voting;

function render(announce = false) {
  previews.forEach((preview, company) => {
    const logo = makeFixedBlueLogo(current, company);
    // A shared crop trims empty artboard space without altering the outlines.
    // The same viewBox keeps BURKE and the icon at one scale for all subsidiaries.
    logo.setAttribute('viewBox', '160 150 760 680');
    preview.replaceChildren(logo);
  });
  if (announce) document.querySelector('#preview-status').textContent = `All four logos updated: ${describe(current)}.`;
}

function restore() {
  const value = new URLSearchParams(location.hash.slice(1)).get('logo');
  // Keep existing refinement links usable; company choices now appear together.
  current = value && /^[01]{4}[0-3](?:[0-3][01])?$/.test(value) ? [...value.slice(0, 5)].map(Number) : [0, 0, 0, 0, 0];
  keys.forEach((key, index) => { form.elements[key].value = current[index]; });
  render();
}

form.addEventListener('change', () => {
  current = keys.map(key => Number(form.elements[key].value));
  render(true);
  voting?.selectionChanged();
});
window.addEventListener('hashchange', () => { restore(); voting?.selectionChanged(); });
restore();

voting = mountVoting({
  getSettings: () => [...current],
  setSettings: settings => {
    current = [...settings];
    keys.forEach((key, index) => { form.elements[key].value = current[index]; });
    render();
  },
});
