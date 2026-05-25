'use strict';

if (require.main !== module) {
  return;
}

const fs = require('fs');
const path = require('path');

const themeRoot = path.resolve(__dirname, '..');
const partial = fs.readFileSync(path.join(themeRoot, 'layout/_partial/model-session.ejs'), 'utf8');
const layout = fs.readFileSync(path.join(themeRoot, 'layout/layout.ejs'), 'utf8');

function fail(message) {
  console.error(message);
  process.exit(1);
}

[
  'modelEndpoint',
  'model.enabled && modelEndpoint',
  'data-endpoint="<%- modelEndpoint %>"'
].forEach((needle) => {
  if (!partial.includes(needle)) fail(`Model session partial is missing ${needle}`);
});

if (!layout.includes("theme.model_session.enabled && String(theme.model_session.endpoint || '').trim()")) {
  fail('layout.ejs should only load model-session.js when endpoint is configured.');
}

console.log('Model session render checks OK');
