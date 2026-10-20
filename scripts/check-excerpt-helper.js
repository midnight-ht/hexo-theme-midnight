'use strict';

if (require.main !== module) {
  return;
}

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const helperPath = path.resolve(__dirname, 'i18n-helpers.js');
const source = fs.readFileSync(helperPath, 'utf8');
const helpers = {};
const context = {
  hexo: {
    extend: {
      helper: {
        register(name, fn) {
          helpers[name] = fn;
        }
      }
    }
  }
};

vm.runInNewContext(source, context, { filename: helperPath });

function fail(message) {
  console.error(message);
  process.exit(1);
}

const helperContext = {
  theme: { config: { i18n: { default_lang: 'zh-CN', languages: ['zh-CN', 'en'] } } },
  config: { language: 'zh-CN' },
  page: { lang: 'zh-CN' },
  __(value) {
    return value;
  }
};

const excerpt = helpers.midnight_excerpt.call(helperContext, {
  content: `
    <pre><code>const PENDING = 'pending'; class MyPromise { constructor() {} }</code></pre>
    <p>这是一段用于引导阅读的自然语言内容，说明文章的核心背景、读者可以获得的结论，以及后文会展开的分析路径。</p>
    <p>const value = resolve(reason);</p>
  `
}, 150);

if (!excerpt) fail('Expected a prose excerpt.');
if (/const|class|resolve|constructor|PENDING/.test(excerpt)) fail(`Excerpt contains code-like content: ${excerpt}`);
if (Array.from(excerpt).length > 150) fail(`Excerpt is too long: ${excerpt.length}`);
if (!excerpt.includes('引导阅读')) fail(`Excerpt did not use the prose paragraph: ${excerpt}`);

const explicit = helpers.midnight_excerpt.call(helperContext, {
  lead: '这是 Front Matter 中配置的引读内容，会优先于正文自动摘要显示。',
  content: '<p>正文兜底内容。</p>'
}, 150);

if (!explicit.startsWith('这是 Front Matter')) fail('Configured lead should take priority.');

const editorialDescription = 'An async import can return the requested module after validation. This description explains the decision path, the failure cases, and what readers can verify in the article without hiding the conclusion or shortening the author-provided summary.';
const fullDescription = helpers.midnight_description.call(helperContext, {
  description: editorialDescription,
  content: '<p>Fallback prose paragraph.</p>'
}, 150);
if (fullDescription !== editorialDescription) fail(`Explicit description was filtered or truncated: ${fullDescription}`);

const unsafeDescription = helpers.midnight_description.call(helperContext, {
  description: 'A <strong>clear</strong> summary <img src=x onerror="alert(1)"> with <code>return</code> and &amp; context.'
}, 150);
if (unsafeDescription !== 'A clear summary with return and & context.') fail(`Explicit description is not plain text: ${unsafeDescription}`);

console.log('Excerpt helper checks OK');
