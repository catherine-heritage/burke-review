const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');
const { doc, collection, getDoc, getDocs, setDoc, updateDoc, deleteDoc, onSnapshot } = require('firebase/firestore');
let env;
const original = { spacing: 0, shape: 0, weight: 0, tracking: 0, colour: 0 };
const account = uid => env.authenticatedContext(uid, { firebase: { sign_in_provider: 'anonymous' } }).firestore();
before(async () => {
  env = await initializeTestEnvironment({ projectId: 'demo-burke-logo', firestore: { host: '127.0.0.1', port: 8086, rules: fs.readFileSync(path.join(__dirname, '../firestore.rules'), 'utf8') } });
});
beforeEach(async () => env.clearFirestore());
after(async () => env?.cleanup());

test('signed-out visitors cannot read or write votes', async () => {
  const db = env.unauthenticatedContext().firestore();
  await assertFails(getDoc(doc(db, 'round3Votes/alice')));
  await assertFails(getDocs(collection(db, 'round3Votes')));
  await assertFails(setDoc(doc(db, 'round3Votes/alice'), original));
});
test('authenticated visitor can read their own missing vote but not results or another vote', async () => {
  const db = account('alice');
  assert.equal((await assertSucceeds(getDoc(doc(db, 'round3Votes/alice')))).exists(), false);
  await assertFails(getDocs(collection(db, 'round3Votes')));
  await assertFails(getDoc(doc(db, 'round3Votes/bob')));
});
test('one active vote can be created, restored and updated without adding a vote', async () => {
  const db = account('alice');
  const ref = doc(db, 'round3Votes/alice');
  await assertSucceeds(setDoc(ref, original));
  assert.deepEqual((await getDoc(doc(account('alice'), 'round3Votes/alice'))).data(), original);
  await assertSucceeds(setDoc(ref, { ...original, spacing: 1, colour: 2 }));
  const results = await assertSucceeds(getDocs(collection(db, 'round3Votes')));
  assert.equal(results.size, 1);
  assert.equal(results.docs[0].data().colour, 2);
});
test('visitors cannot overwrite, create or delete another account’s vote', async () => {
  const alice = account('alice');
  const bob = account('bob');
  await setDoc(doc(bob, 'round3Votes/bob'), original);
  await assertFails(setDoc(doc(alice, 'round3Votes/bob'), { ...original, weight: 1 }));
  await assertFails(setDoc(doc(alice, 'round3Votes/charlie'), original));
  await setDoc(doc(alice, 'round3Votes/alice'), original);
  await assertFails(deleteDoc(doc(alice, 'round3Votes/alice')));
  await assertFails(deleteDoc(doc(alice, 'round3Votes/bob')));
});
test('only the five validated integer settings may be saved', async () => {
  const db = account('alice');
  const ref = doc(db, 'round3Votes/alice');
  for (const [key, values] of Object.entries({ spacing: [-1, 2, 0.5, '0', true, null], shape: [2], weight: [2], tracking: [2], colour: [-1, 3, '2'] })) {
    for (const value of values) await assertFails(setDoc(ref, { ...original, [key]: value }));
  }
  const { colour, ...missing } = original;
  for (const value of [missing, { ...original, uid: 'alice' }, { ...original, company: 1 }, { ...original, accent: '#fff' }, { ...original, total: 5 }]) {
    await assertFails(setDoc(ref, value));
  }
  for (const value of [0, 1, 2]) await assertSucceeds(setDoc(ref, { ...original, colour: value }));
  await assertFails(updateDoc(ref, { secondary: '#fff' }));
});
test('other collections, nested documents and shared totals cannot be written', async () => {
  const db = account('alice');
  for (const location of ['round3Results/totals', 'users/alice', 'round3Votes/alice/private/data']) {
    await assertFails(setDoc(doc(db, location), original));
    await assertFails(getDoc(doc(db, location)));
  }
});
test('voted visitors receive another visitor’s vote and updates through a real-time listener', async () => {
  const alice = account('alice');
  const bob = account('bob');
  await setDoc(doc(alice, 'round3Votes/alice'), original);
  const snapshots = [];
  let failure;
  const stop = onSnapshot(collection(alice, 'round3Votes'), snap => snapshots.push(snap.docs.map(d => d.data())), error => { failure = error; });
  async function until(predicate) {
    for (let i = 0; i < 100; i++) {
      if (failure) throw failure;
      if (snapshots.some(predicate)) return;
      await new Promise(resolve => setTimeout(resolve, 30));
    }
    throw new Error('No matching real-time snapshot');
  }
  try {
    await until(votes => votes.length === 1);
    await setDoc(doc(bob, 'round3Votes/bob'), { ...original, weight: 1 });
    await until(votes => votes.length === 2 && votes.some(v => v.weight === 1));
    await setDoc(doc(bob, 'round3Votes/bob'), { ...original, shape: 1 });
    await until(votes => votes.length === 2 && votes.some(v => v.shape === 1) && votes.every(v => v.weight === 0));
  } finally { stop(); }
});
