'use strict';

const fs = require('fs');
const path = require('path');

const exampleRoot = path.resolve(__dirname, '..');
const themeRoot = path.resolve(exampleRoot, '..');
const targetRoot = path.join(exampleRoot, 'themes', 'midnight');

const entries = [
  '_config.yml',
  'layout',
  'languages',
  'scripts',
  'source'
];

function ensureInsideExample(target) {
  const resolved = path.resolve(target);
  if (!resolved.startsWith(exampleRoot + path.sep)) {
    throw new Error(`Refusing to write outside example site: ${resolved}`);
  }
  return resolved;
}

fs.rmSync(ensureInsideExample(targetRoot), { recursive: true, force: true });
fs.mkdirSync(targetRoot, { recursive: true });

entries.forEach((entry) => {
  fs.cpSync(path.join(themeRoot, entry), path.join(targetRoot, entry), {
    recursive: true,
    force: true
  });
});

console.log('Prepared local Midnight theme copy');
