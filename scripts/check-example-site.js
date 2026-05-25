'use strict';

if (require.main !== module) {
  return;
}

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const themeRoot = path.resolve(__dirname, '..');
const exampleRoot = path.join(themeRoot, 'example-site');

const required = [
  'package.json',
  '_config.yml',
  'README.md',
  'scripts/prepare-theme.js',
  'source/_posts/midnight-agent-zh.md',
  'source/_posts/midnight-agent-en.md',
  'source/404.md',
  'source/search/index.md',
  'source/authors/midnight/index.md',
  'source/about/index.md',
  'themes/.gitkeep'
];

function fail(message) {
  console.error(message);
  process.exit(1);
}

function readFile(relativePath) {
  return fs.readFileSync(path.join(exampleRoot, relativePath), 'utf8');
}

function frontMatter(markdown) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return match ? yaml.load(match[1]) : {};
}

const missing = required.filter((file) => !fs.existsSync(path.join(exampleRoot, file)));
if (missing.length) {
  fail(`Missing example site files:\n${missing.join('\n')}`);
}

const config = yaml.load(readFile('_config.yml'));
if (config.theme !== 'midnight') fail('Example site must use the midnight theme.');
if (!String(config.permalink || '').includes(':lang')) fail('Example permalink must include :lang.');
if (!config.sitemap || config.sitemap.path !== 'sitemap.xml') fail('Example sitemap path must be sitemap.xml.');

const zhPost = frontMatter(readFile('source/_posts/midnight-agent-zh.md'));
const enPost = frontMatter(readFile('source/_posts/midnight-agent-en.md'));
if (zhPost.lang !== 'zh-CN') fail('Chinese example post must use lang: zh-CN.');
if (enPost.lang !== 'en') fail('English example post must use lang: en.');
if (!zhPost.translation_key || zhPost.translation_key !== enPost.translation_key) {
  fail('Example translated posts must share a translation_key.');
}

console.log('Example site OK');
