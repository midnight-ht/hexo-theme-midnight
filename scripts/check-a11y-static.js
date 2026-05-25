'use strict';

if (require.main !== module) {
  return;
}

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const publicRoot = path.join(root, 'example-site', 'public');
const css = fs.readFileSync(path.join(root, 'source', 'css', 'main.css'), 'utf8');

function fail(message) {
  console.error(message);
  process.exit(1);
}

function readPublic(relativePath) {
  const file = path.join(publicRoot, relativePath);
  if (!fs.existsSync(file)) fail(`Missing generated file: ${relativePath}`);
  return fs.readFileSync(file, 'utf8');
}

function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  const value = parseInt(clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function luminance(rgb) {
  return rgb.map((value) => {
    const channel = value / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  }).reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
}

function contrast(foreground, background) {
  const first = luminance(hexToRgb(foreground));
  const second = luminance(hexToRgb(background));
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

[
  ['#111827', '#f6f8fc', 'light text on background'],
  ['#edf7ff', '#080b10', 'dark text on background'],
  ['#030712', '#ffffff', 'high-contrast light text'],
  ['#ffffff', '#000000', 'high-contrast dark text']
].forEach(([fg, bg, label]) => {
  if (contrast(fg, bg) < 4.5) fail(`Insufficient contrast for ${label}`);
});

[
  '@media (max-width: 1120px)',
  '@media (max-width: 860px)',
  '@media (max-width: 640px)',
  '.mobile-menu:not([hidden])',
  ':focus-visible',
  '.skip-link',
  '[data-background="high-contrast"]'
].forEach((needle) => {
  if (!css.includes(needle)) fail(`CSS is missing ${needle}`);
});

[
  'index.html',
  'en/2026/05/19/midnight-agent-en/index.html',
  '404.html'
].forEach((file) => {
  const html = readPublic(file);
  [
    'href="#content"',
    '<main class="site-main" id="content">',
    '<nav',
    'aria-label=',
    'role="search"',
    'data-mobile-menu'
  ].forEach((needle) => {
    if (!html.includes(needle)) fail(`${file} is missing ${needle}`);
  });
});

console.log('Static accessibility checks OK');
