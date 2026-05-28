'use strict';

if (require.main !== module) {
  return;
}

const fs = require('fs');
const path = require('path');

const exampleRoot = path.resolve(__dirname, '..', 'example-site');
const publicRoot = path.join(exampleRoot, 'public');

function fail(message) {
  console.error(message);
  process.exit(1);
}

function readPublic(relativePath) {
  const file = path.join(publicRoot, relativePath);
  if (!fs.existsSync(file)) fail(`Missing generated file: ${relativePath}`);
  return fs.readFileSync(file, 'utf8');
}

const sitemap = readPublic('sitemap.xml');
[
  'https://example.com/en/2026/05/19/midnight-agent-en/',
  'https://example.com/zh-CN/2026/05/19/midnight-agent-zh/'
].forEach((url) => {
  if (!sitemap.includes(`<loc>${url}</loc>`)) fail(`Missing sitemap URL: ${url}`);
});

[
  'en/2026/05/19/midnight-agent-en/index.html',
  'zh-CN/2026/05/19/midnight-agent-zh/index.html'
].forEach((file) => {
  const html = readPublic(file);
  [
    'rel="canonical"',
    'rel="alternate"',
    'application/atom+xml',
    'rel="sitemap"',
    'property="og:title"',
    'name="twitter:card"',
    'class="post-share"',
    'figure class="highlight',
    'class="notice',
    'class="wide"',
    'class="gallery gallery--three"',
    '<figcaption>',
    'class="post-navigation"'
  ].forEach((needle) => {
    if (!html.includes(needle)) fail(`${file} is missing ${needle}`);
  });
});

const zhPostHtml = readPublic('zh-CN/2026/05/19/midnight-agent-zh/index.html');
if (!zhPostHtml.includes('href="/en/2026/05/19/midnight-agent-en/" hreflang="en"')) {
  fail('Chinese post language switcher must link to the real English post path.');
}
if (zhPostHtml.includes('/en/2026/05/19/midnight-agent-zh/')) {
  fail('Chinese post language switcher must not fabricate an English path by replacing only the language prefix.');
}

const enPostHtml = readPublic('en/2026/05/19/midnight-agent-en/index.html');
if (!enPostHtml.includes('href="/zh-CN/2026/05/19/midnight-agent-zh/" hreflang="zh-CN"')) {
  fail('English post language switcher must link to the real Chinese post path.');
}
if (enPostHtml.includes('/zh-CN/2026/05/19/midnight-agent-en/')) {
  fail('English post language switcher must not fabricate a Chinese path by replacing only the language prefix.');
}

const notFound = readPublic('404.html');
[
  'class="not-found"',
  'Page Not Found',
  'not-found__latest'
].forEach((needle) => {
  if (!notFound.includes(needle)) fail(`404.html is missing ${needle}`);
});

const searchPage = readPublic('search/index.html');
if (!searchPage.includes('site-owned search provider')) fail('search/index.html is missing search integration guidance.');

const homePage = readPublic('index.html');
if (!homePage.includes('class="section-heading__more" href="/archives/"')) {
  fail('index.html is missing the latest posts view-more archive link.');
}
if (!homePage.includes('class="archive-card archive-card--v2 latest-list__item"')) {
  fail('index.html latest posts should render as an article list.');
}

const zhChannelPage = readPublic('zh-CN/tags/AI-Agent/index.html');
if (zhChannelPage.includes('section-heading__more')) {
  fail('zh-CN AI Agent channel should not render a self-referential view-more link.');
}
if (!zhChannelPage.includes('class="latest-card collection-card"')) {
  fail('zh-CN AI Agent channel is missing the paginated article list.');
}

[
  ['zh-CN/tags/Business/index.html', '商业观察'],
  ['zh-CN/tags/Product/index.html', '产品'],
  ['en/tags/Business/index.html', 'Business'],
  ['en/tags/Product/index.html', 'Product']
].forEach(([file, title]) => {
  const html = readPublic(file);
  if (!html.includes(`<h1>${title}</h1>`)) fail(`${file} is missing configured empty tag page title.`);
  if (!html.includes('class="archive-empty"')) fail(`${file} should render the empty collection state.`);
});

const advertisePage = readPublic('advertise/index.html');
[
  'class="inner-page commercial-page advertise-page"',
  'commercial-contact__email',
  'commercial-stats',
  'Send campaign brief'
].forEach((needle) => {
  if (!advertisePage.includes(needle)) fail(`advertise/index.html is missing ${needle}`);
});

const newsletterPage = readPublic('newsletter/index.html');
[
  'class="inner-page commercial-page newsletter-page"',
  'Weekly brief'
].forEach((needle) => {
  if (!newsletterPage.includes(needle)) fail(`newsletter/index.html is missing ${needle}`);
});
if (newsletterPage.includes('newsletter-hero-form')) {
  fail('newsletter/index.html should not render a signup form when newsletter action is empty.');
}
if (homePage.includes('class="subscribe-button"') || homePage.includes('class="sidebar-panel newsletter-panel"')) {
  fail('index.html should not render newsletter entry points when newsletter action is empty.');
}

const privacyPage = readPublic('privacy/index.html');
[
  'class="inner-page legal-page privacy-page"',
  'Privacy Policy',
  'The theme itself does not create user accounts'
].forEach((needle) => {
  if (!privacyPage.includes(needle)) fail(`privacy/index.html is missing ${needle}`);
});

[
  ['zh-CN/advertise/index.html', '广告合作'],
  ['en/advertise/index.html', 'Advertise with Midnight'],
  ['zh-CN/newsletter/index.html', '订阅 Midnight 通讯'],
  ['en/newsletter/index.html', 'Subscribe to Midnight'],
  ['zh-CN/privacy/index.html', '隐私政策'],
  ['en/privacy/index.html', 'Privacy Policy']
].forEach(([file, title]) => {
  const html = readPublic(file);
  if (!html.includes('commercial-page') && !html.includes('legal-page')) fail(`${file} is missing inner page markup`);
  if (!html.includes(title)) fail(`${file} is missing localized title: ${title}`);
});

const authorPage = readPublic('authors/midnight/index.html');
if (!authorPage.includes('Midnight Team')) fail('authors/midnight/index.html is missing the author profile.');

console.log('Example output OK');
