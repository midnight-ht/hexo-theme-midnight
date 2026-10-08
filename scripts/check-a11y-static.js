'use strict';

if (require.main !== module) {
  return;
}

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const publicRoot = path.join(root, 'example-site', 'public');
const css = ['main.css', 'editorial.css'].map(file => fs.readFileSync(path.join(root, 'source', 'css', file), 'utf8')).join('\n');

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

// Read the actual CSS tokens; a copied list of old hex values cannot detect regressions.
function palette(mode, skin, background) {
  const result = {};
  for (const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const applies = match[1].split(',').some(raw => {
      const selector = raw.trim();
      if (!/^:root(?:\.[\w-]+|\[[^\]]+\])*$/.test(selector)) return false;
      if (selector.includes('.theme-dark') && mode !== 'dark') return false;
      if (selector.includes('.theme-light') && mode !== 'light') return false;
      return [...selector.matchAll(/\[data-(theme|skin|background)="([^"]+)"\]/g)]
        .every(([, key, value]) => ({ theme: mode, skin, background })[key] === value);
    });
    if (applies) for (const [, key, value] of match[2].matchAll(/(--[\w-]+):\s*(#[a-f0-9]{6})\s*;/gi)) result[key] = value;
  }
  return result;
}
for (const mode of ['light', 'dark']) {
  for (const skin of ['ocean', 'jade', 'violet']) {
    for (const background of ['default', 'clean', 'editorial', 'high-contrast']) {
      const tokens = palette(mode, skin, background);
      const pairs = ['--bg', '--surface', '--surface-soft', '--side'].flatMap(bg =>
        ['--text', '--sub', '--muted', '--accent'].map(fg => [fg, bg]));
      pairs.push(['--on-accent', '--accent'], ['--badge-on', '--badge'],
        ['--code-text', '--code-bg'], ['--code-muted', '--code-panel'], ['--footer-sub', '--footer']);
      for (const [fg, bg] of pairs) {
        if (!tokens[fg] || !tokens[bg]) fail(`Missing token: ${fg} / ${bg}`);
        const ratio = contrast(tokens[fg], tokens[bg]);
        if (ratio < 4.5) fail(`${mode}/${skin}/${background}: ${fg} on ${bg} contrast ${ratio.toFixed(2)} < 4.5`);
      }
    }
  }
}

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
    'data-mobile-menu'
  ].forEach((needle) => {
    if (!html.includes(needle)) fail(`${file} is missing ${needle}`);
  });
});

console.log('Static accessibility checks OK');
