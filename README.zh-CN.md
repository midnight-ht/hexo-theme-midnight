# Midnight

[English README](README.md)

[站长验证、统计与留言接入指南](docs/INTEGRATIONS.zh-CN.md) · [配置模板](docs/examples/integrations.yml)

Midnight 是一个面向技术写作、产品笔记、AI 主题博客和多语言发布的现代 Hexo 主题。它提供媒体式首页、文章模板、语言感知路由、可配置评论、SEO 元信息，以及可选的浏览器端模型会话面板。

## 核心能力

- 媒体式首页：头条、精选文章、频道入口、侧栏模块、广告位和专题卡片。
- 浅色与深色外观令牌，并支持浏览器端主题切换。
- 主题级 `zh-CN` 与 `en` 界面文案。
- 文章可通过相同 `translation_key` 关联多语言版本。
- 内部链接兼容 `/zh-CN/`、`/en/` 等语言前缀路由。
- 覆盖归档、标签、分类、关于、订阅、隐私、广告和 404 模板。
- 支持 canonical 与 alternate 语言元信息，便于 SEO 和 sitemap。
- 可接入 Giscus、Waline 或 Utterances 评论。
- 可选模型会话 UI，用于调用你自己的服务端代理 endpoint。

## 安装

在 Hexo 站点中安装主题：

```bash
npm install hexo-theme-midnight
```

然后在站点 `_config.yml` 中设置：

```yaml
theme: midnight
```

如果你的 Hexo 环境不能自动解析 npm 安装的主题，可以将包复制或链接到 `themes/midnight`。

推荐安装站点插件：

```bash
npm install hexo-generator-sitemap hexo-generator-feed
```

## 演示站点

本地启动内置 example site：

```bash
cd example-site
npm install
npm run server
```

然后打开 `http://localhost:4000`。

## 配置

将主题 `_config.yml` 复制到站点的主题配置位置后按需调整。不要把任何服务商 API Key 放进主题配置或前端代码。

```yaml
appearance:
  logo: ""
  logo_text: Midnight
  nick: Midnight
  default_scheme: system
  skin: ocean

i18n:
  default_lang: zh-CN
  route_strategy: auto
  languages:
    - zh-CN
    - en

model_session:
  enabled: true
  endpoint: ""

comments:
  enabled: false
  provider: giscus
```

## 配色与换肤

`appearance.skin` 支持 `ocean`（海蓝）、`jade`（松绿）、`violet`（鸢紫）。每套皮肤都有独立的浅色和深色链接色、前景色，辅助文字与代码行号也使用可读性更高的色值。

`appearance.default_scheme` 支持 `system`、`light`、`dark`。读者可在桌面顶栏或手机菜单选择外观与配色；选择会保存在本地和 Cookie 中，刷新、翻页后保留。“跟随系统”会响应系统外观变化。脚本初始化在样式加载前恢复选择，减少闪烁。

从 0.1.x 升级时，移除旧的 `appearance.accent` 全局覆盖，改用内置皮肤。需要自定义时分别配置 `appearance.accent_light`、`appearance.accent_dark`（六位十六进制色值），并自行验证文字和按钮的对比度；主题的自动对比度检查覆盖内置配色。

## 多语言文章

多语言版本使用相同的 `translation_key`。生成站点时，Midnight 会查找同一个 key 下的所有文章，并使用每篇文章真实的 `path`，所以不同语言可以使用不同 slug：

```yaml
---
title: Hello Midnight
lang: en
translation_key: hello-midnight
---
```

```yaml
---
title: 你好 Midnight
lang: zh-CN
translation_key: hello-midnight
---
```

如果暂时不能共用 key，也可以在 front matter 里显式声明翻译地址：

```yaml
---
title: Hello Midnight
lang: en
translations:
  zh-CN: /zh-CN/2026/05/19/ni-hao-midnight/
  en: /en/2026/05/19/hello-midnight/
---
```

文章页不会再只替换语言前缀来生成不存在的翻译地址，避免读者切换语言时进入 404。

Midnight 也兼容 `source/zh-CN/_posts/*.md`、`source/en/_posts/*.md` 这种按语言分目录的文章结构。执行 `hexo generate` 时，如果检测到这些目录，主题会直接生成语言首页、归档、标签、分类、文章、feed 和 sitemap 路由，不再需要在站点项目里额外写 i18n generator。

## 导航

Navbar 顺序为：`首页 -> 自定义按钮 -> 归档 -> 关于`。自定义按钮写在 `nav.items`：

```yaml
nav:
  home:
    name: home
    path: /
  items:
    - name: AI Agent
      path: /tags/AI-Agent/
      style: underline
    - name:
        zh-CN: 商业观察
        en: Business
      path: /tags/Business/
      style: pill
  archives:
    name: archives
    path: /archives/
  about:
    name: about
    path: /about/
```

`style` 支持 `underline`、`text`、`pill`、`ghost`、`outline` 和 `solid`。内部路径会经过 i18n 路由辅助函数处理，因此标签链接可以解析为 `/zh-CN/tags/AI-Agent/` 这类路由。

## 功能模块与自动统计规则

可选模块遵循“配置完整才展示”：评论服务缺少必要配置时隐藏整个评论区；AI 会话需要启用且提供 endpoint；订阅需要表单 action；搜索需要 `search.enabled: true` 和有效 action；赞助位需要明确设置 `sponsored.enabled: true`。赞助内容须自行替换为真实合作信息。统计默认关闭，不显示占位数字。

文章自动统计示例（接口需由站点自行提供）：

```yaml
article_statistics:
  enabled: true
  provider: endpoint
  reads_endpoint: /api/article-reads
  comments_endpoint: /api/article-comments
  record_reads: true
```

- 查询：`GET endpoint?path=/文章路径/`，返回 JSON 数字字段 `reads` 或 `comments`，例如 `{"reads":120}`。评论接口必须使用与评论组件一致的文章标识，返回真实评论总数，并明确回复和审核中评论的计数口径。
- 记录：仅当 `record_reads: true` 时，在文章页对阅读接口发送一次 `POST endpoint?path=...`，JSON 请求体为 `{"path":"/文章路径/"}`；返回记录后的 `{"reads":121}`。列表页只查询，不增加阅读量。
- 服务端负责持久化、访问去重、限流和机器人过滤；这是浏览次数（PV），不代表阅读人数或读完人数。主题不提供统计后端，也不从前端调用中推断唯一读者。
- 未配置某项 endpoint，就不输出该项统计。请求超时、失败、数据缺失或不是非负整数时保持隐藏；成功返回 `0` 才显示零。跨域接口需允许站点来源及相应 GET/POST 请求，服务商密钥留在服务端。
- 自动模式不使用 front matter 数字兜底。如需展示手工历史快照，显式选择 `provider: frontmatter`，使用 `views`、`comment_count` 或 `stats.views`、`stats.comments`；此模式不是自动统计。`comments: true/false` 仅作为评论开关。
- 页脚 Busuanzi 统计仍由 `footer.statistics` 配置控制，查询成功前隐藏；与文章接口独立，不应重复当作同一来源汇总。

## 模型会话

主题只提供浏览器端 UI。请将 `model_session.endpoint` 指向你自己的服务端代理，模型服务商 API Key 必须留在服务端。

## 开发检查

在主题根目录运行：

```bash
npm run lint:structure
npm run lint:config-content
npm run lint:a11y
npm run lint:comments
npm run lint:model-session
```

发布前预览 npm 包内容：

```bash
npm pack --dry-run
```

自动统计集成检查（需先安装 `example-site` 依赖）：

```bash
npm run lint:statistics
```

## npm 发布

仓库已包含 GitHub Actions 自动发布流程。将 npm automation token 配置为仓库 Secret `NPM_TOKEN` 后，推送版本 tag 会自动创建 GitHub Release 并同步发布到 npm。

更新 `package.json` 版本后推送匹配 tag：

```bash
npm version patch
git push origin master --follow-tags
```

tag 必须使用 `v*.*.*` 格式，并与 package 版本一致，例如 `v0.1.1`。

发布 workflow 只运行适合 npm 包发布的检查。像 `npm run lint:a11y` 这种依赖示例站点生成产物的检查，应在本地构建 example site 后运行。

## 开源协议

MIT

## 0.3：编辑式布局与 SEO / GEO

首页、文章、归档和专题采用开放网格、细分隔线和统一字级。无封面时直接呈现文字；仅显式 `editor_pick` 文章进入编辑精选，热门榜只使用真实阅读数。三套皮肤、系统明暗偏好和移动端切换保持可用。

默认输出 WebSite、WebPage、BlogPosting 和面包屑 JSON-LD，文章标题、作者、日期、摘要与可见内容一致。语言关联使用真实翻译路径与 `x-default`；404 标记 `noindex`。语言目录生成器不再把每次构建时间当作目录页的内容更新时间。`seo.structured_data: false` 可关闭主题结构化数据；已有注入脚本应跳过 `id="midnight-seo-jsonld"`，避免重复的文章实体。

可在文章 front matter 中提供以下真实信息；未提供时不显示相应模块：

```yaml
author: 作者姓名
author_url: https://example.com/about/
summary: 文章的简明摘要
key_takeaways:
  - 经过正文论证的结论
sources:
  - title: 原始资料标题
    url: https://example.com/original-source
cover: /images/actual-article-cover.jpg
cover_alt: 描述这张图片
cover_caption: 图片说明或署名
```

`author_url` 未配置时，站点作者关联当前语言的关于页；其他作者不冒用该地址。封面与来源只进入对应文章的结构化数据，不以站点图标替代文章图片。支持在 `seo.description` 与 `appearance.tagline` 中配置 `zh-CN` / `en` 等语言映射。

GEO 的实现遵循 [Google AI 搜索指南](https://developers.google.com/search/docs/appearance/ai-features)：可抓取正文、明确段落与目录、可验证来源、可访问的内链以及与页面一致的结构化数据。主题不自动编造 FAQ、来源、日期、统计或“AI 收录保证”，也不要求额外的 AI 文本文件。文章元数据参考 [Google Article 指南](https://developers.google.com/search/docs/appearance/structured-data/article)。

验证：`npm run lint:seo` 检查生成页面中的语言关联、canonical、唯一主区域、标题与 JSON-LD 一致性、来源可见性和脚本转义；可追加站点输出目录参数验证实际部署产物。


## 自定义 meta 与站长平台验证

在站点根目录 `_config.midnight.yml` 中配置；不要直接修改安装包。空值不会输出标签。各平台字段填写平台提供的 `content` 验证码，不是整段 HTML；可以使用字符串数组支持多个账号。

```yaml
seo:
  google_site_verification: "平台提供的验证码"
  baidu_site_verification: ""
  bing_site_verification: ""
  shenma_site_verification: ""
  sogou_site_verification: ""
  so_site_verification: ""
  yandex_site_verification: ""
  pinterest_site_verification: ""
  meta:
    - name: referrer
      content: strict-origin-when-cross-origin
    - property: fb:app_id
      content: "你的应用 ID"
  verification_files: []
```

| 平台 | 配置字段（`seo.` 下） | 输出的 meta name |
| --- | --- | --- |
| Google Search Console | google_site_verification | google-site-verification |
| 百度搜索资源平台 | baidu_site_verification | baidu-site-verification |
| Bing Webmaster Tools | bing_site_verification | msvalidate.01 |
| 神马站长平台 | shenma_site_verification | shenma-site-verification |
| 搜狗资源平台 | sogou_site_verification | sogou-site-verification |
| 360 站长平台 | so_site_verification | verify-v1 |
| Yandex Webmaster | yandex_site_verification | yandex-verification |
| Pinterest | pinterest_site_verification | p:domain_verify |

其他平台可将平台给出的 `name` 或 `property` 与 `content` 写入 `seo.meta`。每项只填写一种属性，内容会进行 HTML 转义，不支持直接粘贴 HTML、脚本或 `http-equiv`。相同属性与名称只输出一次，页面 front matter 的 `seo.meta` 覆盖站点同名配置；`content: false` 删除继承的自定义标签。平台验证标签始终属于站点，不受页面覆盖影响。

```yaml
# 文章或页面 front matter
seo:
  meta:
    - name: referrer
      content: no-referrer
    - property: fb:app_id
      content: false
```

`description`、`keywords`、`robots`、`viewport`、`theme-color` 和主题已有的 Open Graph/Twitter 标签由专用配置生成，放入 `seo.meta` 会被忽略以避免冲突。描述、关键词使用现有页面字段和 `seo.description` / `seo.keywords`；页面禁索引使用 `noindex: true`。`googlebot` 等其他自定义指令可通过 `seo.meta` 添加。

需要文件验证的平台可以配置以下内容。文件名、文件内容必须逐字复制平台提供的值；示例仅展示格式，不能用于真实验证。

```yaml
seo:
  verification_files:
    - path: googleYOUR_TOKEN.html
      content: "google-site-verification: googleYOUR_TOKEN.html"
    - path: BingSiteAuth.xml
      content: |
        <?xml version="1.0"?>
        <users><user>YOUR_TOKEN</user></users>
```

验证文件直接生成在输出目录根部，不经过主题模板或 Markdown 渲染。仅允许根目录 `.html` / `.txt` / `.xml` 文件；无效路径、重复文件、已有页面/资源冲突和首页、404、robots、sitemap、feed 等保留文件名会使构建失败。部署在子目录的站点需核对平台要求的验证 URL。也可把原始文件放入 Hexo `source/` 并配置 `skip_render`，两种方式不要使用同一文件名。

部署后检查首页源代码中的标签，以及验证文件 URL 的内容与 HTTP 200 状态，再到平台完成验证。DNS TXT 验证需在域名服务商操作；配置主题不代表平台已验证、已提交或已收录。验证通过后仍应保留验证凭证。站点地图继续由现有 sitemap 配置生成，并在各平台提交实际 sitemap URL。

统计脚本继续使用 `web_analytics`；这里的验证字段不会开启统计或自动提交 URL。百度推送、IndexNow 等需要服务端令牌的提交操作应放在部署流程中，不能把提交密钥放入公开的 meta 或前端脚本。

核对参考：[Google 验证说明](https://support.google.com/webmasters/answer/9008080?hl=zh-Hans)、[Bing 验证说明](https://learn.microsoft.com/en-us/bingwebmaster/verifying-wordpress)、[搜狗验证说明](https://zhanzhang.sogou.com/index.php/help/siteVerify)、[Yandex 验证说明](https://yandex.ru/support/webmaster/en/service/quick-start)。其他平台请以账号后台提供的最新验证代码为准。

运行 `npm run lint:webmaster` 检查多账号、页面覆盖、标签转义、验证文件与冲突处理。

首页精选只展示明确设置 `editor_pick: true` 的当前语言文章，按 `editor_pick_order` 升序、日期降序排列，最多两篇。没有配置时整个精选区隐藏；精选文章不会重复出现在首页最新列表中，完整文章仍可在归档中找到。

## 接入统计与留言

在站点 `_config.midnight.yml` 中选择需要的服务，默认均关闭。配置缺少必要参数时不会输出组件或追踪脚本。

### 访问统计

```yaml
web_analytics:
  enabled: true
  gtag: "G-你的GA4测量ID"
  baidu: "" # 百度统计代码 hm.js? 后的 ID
  clarity: "" # Microsoft Clarity 项目 ID
  umami:
    script_url: "" # 复制 Umami 后台提供的完整脚本 URL
    website_id: ""
    domains: "" # 可选，例如 zyweb.vip,www.zyweb.vip
```

可单独启用一种或同时配置多种服务。GA4 使用 `gtag`；`google` 填入 `G-...` 也会使用 GA4，和同值 `gtag` 不重复加载。旧 `UA-...` 配置保留兼容渲染，但 Universal Analytics 已停止处理新数据，请迁移 GA4。已有百度、CNZZ、51.LA 接入保持兼容；51.LA 的 `woyaola` 是原有脚本路径型配置，不等同于新版 SDK 的其他参数。

PV / UV 展示可另外启用不蒜子：

```yaml
footer:
  statistics:
    enabled: true
    source: busuanzi
```

统计后台报表与页面显示的文章阅读数是两类功能。GA4、Umami、Clarity 不会自动向文章填充阅读数；文章阅读/评论数继续使用 `article_statistics` 的真实接口。接口缺失或请求失败时隐藏数字，真实的 0 会显示。不要把报表查询密钥放入前端配置。

### 文章评论与独立留言页

选择一种留言服务：

| 服务 | 需要的配置 | 使用方式 |
| --- | --- | --- |
| Giscus | GitHub 公共仓库、repo_id、分类与 category_id | 通过 GitHub 登录，留言存入 Discussions |
| Waline | 已部署的 server_url | 可由服务端配置访客留言、登录及审核 |
| Utterances | 已安装对应 GitHub App 的公共仓库 | 通过 GitHub 登录，留言存入 Issues |

Giscus 的完整配置可从 [giscus.app](https://giscus.app/zh-CN) 获取；仓库需开启 Discussions 并安装 Giscus App。

```yaml
comments:
  enabled: true
  provider: giscus
  giscus:
    repo: "owner/repo"
    repo_id: "后台生成的仓库 ID"
    category: "Announcements"
    category_id: "后台生成的分类 ID"
    mapping: pathname
    theme: auto
```

或者使用 Waline：

```yaml
comments:
  enabled: true
  provider: waline
  waline:
    server_url: "https://你的Waline服务域名"
    lang: "" # 跟随页面语言
    placeholder: "欢迎交流文章中的问题与经验"
    page_size: 10
```

或者使用 Utterances（需安装 [Utterances App](https://github.com/apps/utterances)）：

```yaml
comments:
  enabled: true
  provider: utterances
  utterances:
    repo: "owner/repo"
    issue_term: pathname
    theme: auto
```

Giscus、Utterances 的 `theme: auto` 跟随站点的明暗切换；可通过 `theme_light` / `theme_dark` 指定各自主题，或设置固定 `theme`。Waline 加载匹配的 v3 样式并跟随站点明暗和皮肤色。Giscus、Waline 默认跟随页面语言，`lang` 可覆盖。

独立留言板直接使用普通 Hexo 页面，无需新增服务。在 `source/guestbook/index.md` 中写入以下内容（多语言站点可在相应语言页面目录下创建）：

```markdown
---
title: 留言板
layout: page
comments: true
comments_title: 留言
---
欢迎留下问题、建议或交流想法。
```

将实际生成的留言板路径加入导航即可。页面 `comments: false` 关闭该页留言；全站仍需打开 `comments.enabled` 并配置服务。可选 `comment_id: stable-topic-id` 为页面指定长期不变的留言标识；不同语言使用相同 ID 将共享同一讨论，请只在确实需要时设置。站点标题或路径变更前应规划迁移，避免评论分散。

接入验收：部署后检查统计请求与后台实时事件；在文章或留言板实际提交一条留言，刷新后确认仍存在，最后在服务后台检查保存与审核。主题本地测试使用服务替身，不代表真实账号已接通。

参考：[GA4](https://developers.google.com/analytics/devguides/collection/ga4/tag-options)、[Umami](https://docs.umami.is/docs/tracker-configuration)、[Clarity](https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-setup)、[Waline](https://waline.js.org/guide/get-started/)、[Utterances](https://utteranc.es/)。
