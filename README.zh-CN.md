# Midnight

[English README](README.md)

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
