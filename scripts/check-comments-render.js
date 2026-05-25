'use strict';

if (require.main !== module) {
  return;
}

const fs = require('fs');
const path = require('path');

const template = fs.readFileSync(path.resolve(__dirname, '..', 'layout', '_partial', 'comments.ejs'), 'utf8');

function fail(message) {
  console.error(message);
  process.exit(1);
}

[
  'commentsProvider === \'giscus\'',
  'comments.type',
  'https://giscus.app/client.js',
  'data-repo="<%- comments.giscus.repo %>"',
  'data-repo-id="<%- comments.giscus.repo_id %>"',
  'data-category-id="<%- comments.giscus.category_id %>"',
  'commentsProvider === \'waline\'',
  'id="waline"',
  '@waline/client',
  'walineConfig.serverURL',
  'commentsProvider === \'utterances\'',
  'https://utteranc.es/client.js',
  'repo="<%- utterancesConfig.repo %>"',
  'issue-term="<%- utterancesConfig.issue_term || utterancesConfig.issueTerm || \'pathname\' %>"',
  'class="empty-state"',
  'comments_unavailable',
  'comments.enabled',
  'page.comments !== false'
].forEach((needle) => {
  if (!template.includes(needle)) fail(`Comments partial is missing ${needle}`);
});

console.log('Comment provider template checks OK');
