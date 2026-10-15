import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normaliseHex, originalAccents, shuffleAccents, colourFamilies } from '../round-3/colour-model.js';

test('HEX input accepts 3/6 digit colours and rejects incomplete or unsafe values', () => {
  assert.equal(normaliseHex(' #abc '), '#AABBCC');
  assert.equal(normaliseHex('b66b3f'), '#B66B3F');
  for (const value of ['', '#12', '#12345', '#12345678', 'red', 'url(x)', '#GGGGGG']) assert.equal(normaliseHex(value), null);
});
test('shuffle preserves locks and changes unlocked colours within muted families', () => {
  let colours = originalAccents;
  for (let n = 0; n < 300; n++) {
    const next = shuffleAccents(colours, [false, false, false]);
    next.forEach((hex, i) => { assert.match(hex, /^#[\dA-F]{6}$/); assert.notEqual(hex, colours[i]); });
    // Family hues remain orange, purple and green/teal respectively.
    const rgb = next.map(hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)));
    assert.ok(rgb[0][0] > rgb[0][1] && rgb[0][0] > rgb[0][2]);
    assert.ok(rgb[1][2] > rgb[1][1] && rgb[1][0] > rgb[1][1]);
    next.forEach((hex,i) => {
      assert.ok(colourFamilies[i].includes(hex));
      const before=[1,3,5].map(k=>parseInt(colours[i].slice(k,k+2),16));
      assert.ok(Math.hypot(...rgb[i].map((v,k)=>v-before[k])) >= 45);
    });
    assert.ok(rgb[2][1] >= rgb[2][0] && rgb[2][1] + 12 >= rgb[2][2]);
    for (let i=0; i<3; i++) for (let j=i+1; j<3; j++) assert.ok(Math.hypot(...rgb[i].map((v,k) => v-rgb[j][k])) >= 65);
    colours = next;
  }
  const manual = ['#123456', '#123456', '#123456'];
  const changed = shuffleAccents(manual, [true, false, true]);
  assert.equal(changed[0], manual[0]); assert.equal(changed[2], manual[2]); assert.notEqual(changed[1], manual[1]);
  assert.deepEqual(shuffleAccents(manual, [true, true, true]), manual);
});

test('each family has generous shade variety across different lightness levels', () => {
  for (const family of colourFamilies) {
    assert.ok(new Set(family).size >= 18);
    const brightness = family.map(hex => [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)).reduce((a,b)=>a+b)/3);
    assert.ok(Math.max(...brightness)-Math.min(...brightness)>35);
  }
});
