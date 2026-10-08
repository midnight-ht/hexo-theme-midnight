'use strict';

if (require.main !== module) return;

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const helpers = {};
vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'i18n-helpers.js'), 'utf8'), {
  require,
  __dirname,
  hexo: { extend: { helper: { register: (name, fn) => { helpers[name] = fn; } } } }
});
const metric = helpers.midnight_metric;
for (const value of [undefined, null, '', ' ', false, true, -1, 1.5, 'NaN', Infinity, {}, []]) {
  assert.strictEqual(metric({ views: value }, 'reads'), null);
}
assert.strictEqual(metric({ views: 0 }, 'reads'), 0);
assert.strictEqual(metric({ views: '123' }, 'reads'), 123);
assert.strictEqual(metric({ clicks: null, stats: { views: 42 } }, 'reads'), 42);
assert.strictEqual(metric({ comments: true }, 'comments'), null);
assert.strictEqual(metric({ comments: false, comment_count: 0 }, 'comments'), 0);
assert.strictEqual(metric({ comments: true, stats: { comments: 12 } }, 'comments'), 12);
console.log('Metric boundary checks OK');
