const path = require('node:path');
require('esbuild').buildSync({
  entryPoints: [path.join(__dirname, '../round-3/firebase-sdk-entry.js')],
  outfile: path.join(__dirname, '../round-3/vendor/firebase.js'),
  bundle: true, format: 'esm', platform: 'browser', target: 'es2020', minify: true,
  legalComments: 'linked',
  nodePaths: (process.env.NODE_PATH || '').split(path.delimiter).filter(Boolean),
});
