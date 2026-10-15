const path = require('node:path');
require('esbuild').buildSync({
  stdin: {
    contents: "export * from './round-3/firebase-sdk-entry.js'; export { connectAuthEmulator } from 'firebase/auth'; export { connectFirestoreEmulator } from 'firebase/firestore';",
    resolveDir: path.join(__dirname, '..'),
  },
  outfile: '/tmp/burke-test-firebase.js', bundle: true, format: 'esm', platform: 'browser', minify: true,
  nodePaths: (process.env.NODE_PATH || '').split(path.delimiter).filter(Boolean),
});
