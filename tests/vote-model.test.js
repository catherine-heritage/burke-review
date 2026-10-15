import { test } from 'node:test';
import assert from 'node:assert/strict';
import { settingsToVote, voteToSettings, validVote, summariseVotes, voteDescription } from '../round-3/vote-model.js';

test('only five parent settings round-trip in the intended colour-treatment order', () => {
  const vote = settingsToVote([1, 0, 1, 0, 2, 3, 1]);
  assert.deepEqual(Object.keys(vote), ['spacing', 'shape', 'weight', 'tracking', 'colour']);
  assert.deepEqual(voteToSettings(vote), [1, 0, 1, 0, 2]);
  assert.match(voteDescription(vote), /Single-colour icon/);
  assert.equal(validVote({ ...vote, company: 3 }), false);
  assert.equal(validVote({ ...vote, spacing: '1' }), false);
});
test('preference counts precede the three most popular complete combinations', () => {
  const first = settingsToVote([0, 0, 0, 0, 0]);
  const second = settingsToVote([1, 0, 0, 0, 2]);
  const third = settingsToVote([0, 1, 1, 0, 1]);
  const fourth = settingsToVote([1, 1, 1, 1, 1]);
  const summary = summariseVotes([first, first, first, second, second, third, fourth, { ...first, colour: 4 }]);
  assert.equal(summary.total, 7);
  assert.deepEqual(summary.top.map(combination => combination.count), [3, 2, 1]);
  assert.equal(summary.top.length, 3);
  assert.deepEqual(summary.preferences[0].options.map(option => option.count), [4, 3]);
  assert.deepEqual(summary.preferences[4].options.map(option => [option.value, option.count]), [[0, 3], [2, 2], [1, 2]]);
});
test('empty data produces zero counts without invented results', () => {
  const summary = summariseVotes([]);
  assert.equal(summary.total, 0);
  assert.deepEqual(summary.top, []);
  assert.equal(summary.preferences.length, 5);
});
