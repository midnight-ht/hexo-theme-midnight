'use strict';
if (require.main !== module) return;
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),vm=require('node:vm');
const deps=require('node:module').createRequire(path.resolve(__dirname,'../example-site/package.json'));
const generators={},helpers={};
const fixtureHexo={extend:{generator:{register:(n,f)=>generators[n]=f},helper:{register:(n,f)=>helpers[n]=f}}};
for(const file of ['source-i18n-generator.js','i18n-helpers.js'])vm.runInNewContext(fs.readFileSync(path.join(__dirname,file),'utf8'),{hexo:fixtureHexo,require:deps,URL,console});
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'midnight-category-case-'));
const ctx={source_dir:temp,config:{language:['zh-CN','en'],title:'Fixture',url:'https://example.test/blog',root:'/blog/'},theme:{config:{i18n:{languages:['zh-CN','en'],default_lang:'zh-CN',canonical_category_slugs:{'zh-CN':{linux:'Linux'},en:{linux:'linux'}}}}},render:{render:async({text})=>text},url_for:v=>'/blog/'+String(v).replace(/^\//,''),full_url_for:v=>new URL(String(v).replace(/^\//,''),'https://example.test/blog/').href};
for(const [n,f]of Object.entries(helpers))ctx[n]=(...a)=>f.call(ctx,...a);
function write(lang,slug,date,category){const dir=path.join(temp,lang,'_posts');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,slug+'.md'),`---\ntitle: ${slug}\ndate: "${date}"\nlang: ${lang}\ncategories: ["${category}"]\n---\nBody.\n`);}
(async()=>{try{
 for(const lang of ['zh-CN','en']){write(lang,'new','2026-10-25','Linux');write(lang,'old','2026-10-01','linux');}
 for(const reorder of [false,true]){
  if(reorder)for(const lang of ['zh-CN','en'])write(lang,'old','2026-10-26','linux');
  const routes=await generators.midnight_source_i18n_pages.call(ctx),sitemap=generators.midnight_source_i18n_sitemap.call(ctx).data;
  for(const lang of ['zh-CN','en']){
   const slug=lang==='zh-CN'?'Linux':'linux',other=lang==='zh-CN'?'linux':'Linux';
   const pages=routes.filter(r=>r.path.toLowerCase()===`${lang}/categories/linux/index.html`.toLowerCase());
   assert.equal(pages.length,1,'No case-only duplicate category routes');
   assert.equal(pages[0].path,`${lang}/categories/${slug}/index.html`);
   assert.equal(pages[0].data.posts.length,2);
   assert(sitemap.includes(`/${lang}/categories/${slug}/`));assert(!sitemap.includes(`/${lang}/categories/${other}/`));
   const links=helpers.midnight_language_links.call(ctx,pages[0].data);
   assert.equal(links.find(x=>x.lang==='zh-CN').url,'/blog/zh-CN/categories/Linux/');
   assert.equal(links.find(x=>x.lang==='en').url,'/blog/en/categories/linux/');
   for(const name of ['new','old']){const post=routes.find(r=>r.data.slug===name&&r.data.lang===lang).data;const category=post.categories.data[0];assert.equal(category.name,name==='new'?'Linux':'linux');assert.equal(category.path,`/${lang}/categories/${slug}/`);assert.equal(helpers.midnight_i18n_url.call(ctx,`/categories/${other}/`,post),`/blog/${lang}/categories/${slug}/`);}
  }
 }
 console.log('Category aliases: one case-sensitive route, locale overrides, merged posts, sitemap, post links, hreflang and date reorder OK');
}finally{fs.rmSync(temp,{recursive:true,force:true});}})().catch(e=>{console.error(e);process.exitCode=1;});
