// Rebuild the self-hosted browser bundle with npm run build:firebase.
export { initializeApp, getApp, getApps } from 'firebase/app';
export { getAuth, setPersistence, browserLocalPersistence, signInAnonymously } from 'firebase/auth';
export { getFirestore, doc, collection, onSnapshot, setDoc } from 'firebase/firestore';
