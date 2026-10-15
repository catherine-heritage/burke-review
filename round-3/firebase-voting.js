import { initializeApp, getApp, getApps, getAuth, setPersistence, browserLocalPersistence, signInAnonymously, getFirestore, doc, collection, onSnapshot, setDoc } from './vendor/firebase.js';
import { firebaseConfig } from './firebase-config.js';
import { validVote } from './vote-model.js';

let connecting;
export function connectVoting() {
  if (!connecting) connecting = connect().catch(error => { connecting = null; throw error; });
  return connecting;
}
async function connect() {
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const auth = getAuth(app);
  // Persist this anonymous identity across visits and browser tabs.
  await setPersistence(auth, browserLocalPersistence);
  await auth.authStateReady();
  const user = auth.currentUser || (await signInAnonymously(auth)).user;
  const db = getFirestore(app);
  const voteRef = doc(db, 'round3Votes', user.uid);
  return {
    watchVote(next, error) {
      return onSnapshot(voteRef, { includeMetadataChanges: true }, snapshot => {
        next({ vote: snapshot.exists() ? snapshot.data() : null, pending: snapshot.metadata.hasPendingWrites, cached: snapshot.metadata.fromCache });
      }, error);
    },
    watchResults(next, error) {
      return onSnapshot(collection(db, 'round3Votes'), { includeMetadataChanges: true }, snapshot => {
        // Never count a locally queued update as a confirmed shared result.
        if (!snapshot.metadata.hasPendingWrites) next({ votes: snapshot.docs.map(vote => vote.data()), cached: snapshot.metadata.fromCache });
      }, error);
    },
    save(vote) {
      if (!validVote(vote)) return Promise.reject(new Error('Invalid logo settings.'));
      // One document per UID: changing a vote replaces it without adding a voter.
      return setDoc(voteRef, vote);
    },
  };
}
