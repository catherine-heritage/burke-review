import { bluePalette } from './blue-palette.js';

import { companyNames, originalAccents, defaultFamilies, colourFamilies, normaliseHex, shuffleAccents } from './colour-model.js';

export function mountColourExplorer(onChange) {
  const section = document.querySelector('#colour-explorer');
  const inputs = [...section.querySelectorAll('.accent-hex')];
  const locks = [...section.querySelectorAll('.accent-lock')];
  const pairs = [...section.querySelectorAll('.family-swatches')];
  const status = section.querySelector('[role=status]');
  const shuffle = section.querySelector('#shuffle-colours');
  const shuffleHelp = section.querySelector('#shuffle-help');
  let accents = [...originalAccents];
  let selectedFamilies = [...defaultFamilies];
  let familyValues = colourFamilies.map((families,i) => families.map((family,j) => j === defaultFamilies[i] ? originalAccents[i] : family.initial));
  const locked = () => locks.map(button => button.getAttribute('aria-pressed') === 'true');
  function paintLocks() {
    const states = locked();
    locks.forEach((button, i) => {
      const label = `${states[i] ? 'Unlock' : 'Lock'} ${companyNames[i]} colour`;
      button.setAttribute('aria-label', label);
      button.title = label;
    });
    shuffle.disabled = states.every(Boolean);
    shuffleHelp.hidden = !shuffle.disabled;
  }
  locks.forEach(button => button.addEventListener('click', () => {
    button.setAttribute('aria-pressed', String(button.getAttribute('aria-pressed') !== 'true'));
    status.textContent = '';
    paintLocks();
  }));
  function paint(syncInputs = true) {
    inputs.forEach((input, i) => {
      if (syncInputs) { input.value = accents[i]; input.removeAttribute('aria-invalid'); }
      familyValues[i][selectedFamilies[i]] = accents[i];
      pairs[i].querySelectorAll('.family-choice').forEach((choice,j) => {
        choice.classList.toggle('selected', selectedFamilies[i] === j);
        choice.querySelector('input').setAttribute('aria-current', String(selectedFamilies[i] === j));
        choice.querySelector('input').value = familyValues[i][j];
      });
      section.querySelector(`#accent-error-${i}`).hidden = syncInputs || normaliseHex(input.value) !== null;
    });
    onChange([...accents]);
  }
  inputs.forEach((input, i) => input.addEventListener('input', () => {
    const hex = normaliseHex(input.value);
    input.setAttribute('aria-invalid', String(!hex));
    section.querySelector(`#accent-error-${i}`).hidden = !!hex;
    if (!hex) return;
    accents[i] = hex;
    paint(false);
    status.textContent = '';
  }));
  inputs.forEach((input, i) => input.addEventListener('blur', () => {
    if (normaliseHex(input.value)) input.value = accents[i];
  }));
  pairs.forEach((pair, i) => pair.querySelectorAll('input[type=color]').forEach((swatch, j) => {
    const select = () => {
      selectedFamilies[i] = j;
      accents[i] = familyValues[i][j];
      inputs[i].value = accents[i];
      inputs[i].removeAttribute('aria-invalid');
      paint(false);
      status.textContent = '';
    };
    const choose = () => {
      familyValues[i][j] = swatch.value.toUpperCase();
      select();
    };
    swatch.addEventListener('click', select);
    swatch.addEventListener('input', choose);
    swatch.addEventListener('change', choose);
  }));
  shuffle.addEventListener('click', () => {
    accents = shuffleAccents(accents, locked(), selectedFamilies);
    paint();
    status.textContent = 'Colours updated. Locked colours were kept.';
  });
  section.querySelector('#reset-colours').addEventListener('click', () => {
    accents = [...originalAccents];
    selectedFamilies = [...defaultFamilies];
    familyValues = colourFamilies.map((families,i) => families.map((family,j) => j === defaultFamilies[i] ? originalAccents[i] : family.initial));
    locks.forEach(button => button.setAttribute('aria-pressed', 'false'));
    paintLocks();
    paint();
    status.textContent = 'Default colours restored. All colours unlocked.';
  });
  section.querySelector('#copy-palette').addEventListener('click', async () => {
    const palette = ['Burke Group navy: ' + bluePalette.primary.toUpperCase(), 'Original Burke Group gold (reference): #B78352', ...companyNames.map((name, i) => `${name}: ${accents[i]}`)].join('\n');
    try {
      await navigator.clipboard.writeText(palette);
      status.textContent = 'Palette copied.';
    } catch {
      status.textContent = 'Copy unavailable. You can select and copy the HEX codes in the fields. Burke Group navy: #1B2E46. Original gold reference: #B78352.';
    }
  });
  paintLocks();
  paint();
}
