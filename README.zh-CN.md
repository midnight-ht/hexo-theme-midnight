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

## 配置

将主题 `_config.yml` 复制到站点的主题配置位置后按需调整。不要把任何服务商 API Key 放进主题配置或前端代码。

```yaml
appearance:
  logo: ""
  logo_text: Midnight
  nick: Midnight
  default_scheme: light

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

## 多语言文章

多语言版本使用相同的 `translation_key`：

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

## npm 发布

仓库已包含 GitHub Actions 自动发布流程。将 npm automation token 配置为仓库 Secret `NPM_TOKEN` 后，推送版本 tag 会自动创建 GitHub Release 并同步发布到 npm。

更新 `package.json` 版本后推送匹配 tag：

```bash
npm version patch
git push origin master --follow-tags
```

tag 必须使用 `v*.*.*` 格式，并与 package 版本一致，例如 `v0.1.1`。

## 开源协议

MIT
