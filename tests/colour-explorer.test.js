import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normaliseHex, originalAccents, defaultFamilies, colourFamilies, shuffleAccents } from '../round-3/colour-model.js';

test('HEX input accepts 3/6 digit colours and rejects invalid values', () => {
  assert.equal(normaliseHex(' #abc '), '#AABBCC');
  assert.equal(normaliseHex('cc6e2f'), '#CC6E2F');
  for (const value of ['', '#12', '#12345', '#12345678', 'red', 'url(x)', '#GGGGGG']) assert.equal(normaliseHex(value), null);
});
test('new defaults and two broad shade families per company', () => {
  assert.deepEqual(originalAccents, ['#768290','#CC6E2F','#81376D','#317B82']);
  assert.deepEqual(colourFamilies.map(pair=>pair.map(f=>f.name)), [['Navy','Gold'],['Red','Orange'],['Purple','Blue'],['Green','Teal']]);
  colourFamilies.forEach(pair=>pair.forEach(family=>assert.ok(new Set(family.shades).size>=12)));
});
test('both family choices shuffle visibly and honour each individual lock', () => {
  const distance=(a,b)=>Math.hypot(...[1,3,5].map(i=>parseInt(a.slice(i,i+2),16)-parseInt(b.slice(i,i+2),16)));
  for (const families of [defaultFamilies,[1,0,1,0]]) {
    let colours=[...originalAccents];
    for(let n=0;n<100;n++) {
      const next=shuffleAccents(colours,[false,false,false,false],families);
      next.forEach((hex,i)=>{assert.ok(colourFamilies[i][families[i]].shades.includes(hex));assert.ok(distance(hex,colours[i])>=40);});
      colours=next;
    }
  }
  for(let i=0;i<4;i++) {
    const locks=[false,false,false,false];locks[i]=true;
    const manual=['#F000FF','#00CCFF','#FF0000','#0000FF'];
    const next=shuffleAccents(manual,locks);
    assert.equal(next[i],manual[i]);
    next.forEach((hex,j)=>{if(i!==j)assert.notEqual(hex,manual[j]);});
  }
  assert.deepEqual(shuffleAccents(originalAccents,[true,true,true,true]),originalAccents);
});
