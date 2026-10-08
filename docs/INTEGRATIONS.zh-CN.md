# 站长验证、统计与留言接入指南

[English](INTEGRATIONS.md) · [完整配置说明](../README.zh-CN.md#自定义-meta-与站长平台验证) · [可复制的配置模板](examples/integrations.yml)

本指南适用于已经安装 Midnight 的 Hexo 站点。配置属于站点根目录的 `_config.midnight.yml`，不要修改 `node_modules` 或示例站点的主题副本。模板所有服务默认关闭，不包含真实验证码或服务账号。

## 1. 合并配置

把 [integrations.yml](examples/integrations.yml) 中需要的字段合并进现有配置。同一 YAML 文件内只保留一个 `seo`、`comments`、`web_analytics` 等顶层配置块，避免后写内容覆盖原配置。保留已有描述、站长验证码、导航及其他设置。

只填写实际使用的平台参数。没有账号、验证码、统计 ID 或留言服务地址时，保持空值和关闭开关。

## 2. 站长验证与自定义 meta

站长验证字段填写平台提供的 `content` 字符串，不是整段 HTML。Google、百度、Bing、神马、搜狗、360、Yandex、Pinterest 都有专用字段；同一平台多个账号可使用字符串数组。

其他标签使用 `seo.meta` 的 `name` 或 `property` 与 `content`。页面 front matter `seo.meta` 可覆盖站点同名自定义标签，`content: false` 删除继承项。主题已有 description、robots、Open Graph 等标签使用专用配置，避免重复。

文件验证使用 `seo.verification_files`，原样复制平台提供的文件名与内容。文件必须是根目录 `.html`、`.txt` 或 `.xml`，不能与现有页面、资源或保留文件冲突。也可使用 Hexo 原生 `source/` + `skip_render`，两种方式不要配置同名文件。

DNS 验证在域名服务商操作。主题输出标签或文件后，仍需到站长平台点击验证；提交 sitemap 与查看收录状态也在平台完成。详见 [meta 与验证字段表](../README.zh-CN.md#自定义-meta-与站长平台验证)。

## 3. 访问统计

打开 `web_analytics.enabled: true` 后，填写至少一个服务的参数：

| 服务 | 参数 |
| --- | --- |
| Google Analytics 4 | `gtag: G-...` |
| 百度统计 | `baidu`，填写 `hm.js?` 后的 ID |
| Umami | `umami.script_url` 与 `umami.website_id`；可选 `domains` |
| Microsoft Clarity | `clarity`，填写项目 ID |

可以只选一种，也可以同时接入。Umami 的域名限制应与实际站点一致，例如同时覆盖裸域和 `www`。旧 `google: UA-...` 仅保留兼容渲染，请迁移 GA4；新配置使用 `gtag`，不要使用报表 API 密钥。

统计报表、文章阅读/评论数、页脚 PV/UV 是三个独立配置：

- 报表脚本：`web_analytics`。
- 文章数字：`article_statistics` 的真实接口，返回 `{"reads":120}` 或 `{"comments":3}`；启用 `record_reads` 才会在文章访问时 POST 计数。
- 页脚 PV/UV：`footer.statistics.enabled: true` 与 `source: busuanzi`。

缺少数据或接口失败时隐藏文章数字，真实的 0 会展示。完整请求协议及计数规则见 [自动文章统计](../README.zh-CN.md#功能模块与自动统计规则)。

## 4. 评论与留言板

打开 `comments.enabled: true`，并在 `comments.provider` 选择一种服务：

| 服务 | 先准备 | 必填项 |
| --- | --- | --- |
| Giscus | 公共 GitHub 仓库开启 Discussions，安装 Giscus App | `repo`、`repo_id`、`category`、`category_id` |
| Waline | 部署可访问的 Waline 服务，设置数据库及审核规则 | `server_url` |
| Utterances | 公共 GitHub 仓库安装 Utterances App | `repo` |

Giscus / Utterances 的 `theme: auto` 跟随站点明暗；固定 `theme` 会停用自动切换。Waline 自带样式加载并跟随站点皮肤。Giscus / Waline 的空 `lang` 跟随页面语言。

创建普通页面 `source/guestbook/index.md`：

```markdown
---
title: 留言板
layout: page
comments: true
comments_title: 留言
---
欢迎留下问题与建议。
```

多语言站点按现有页面目录结构分别创建，然后把实际生成的路径加入导航。`comments: false` 可关闭单页评论。可选 `comment_id` 为讨论提供稳定标识；多页相同 ID 会共享讨论，修改现有标识前先规划迁移。完整服务配置示例见 [统计与留言](../README.zh-CN.md#接入统计与留言)。

## 5. 构建与上线验收

在自己的 Hexo 站点运行：

```bash
npx hexo clean
npx hexo generate
npx hexo server
```

本地检查首页源码中的 meta、留言页面的组件与换肤；统计平台可能按域名排除 localhost，因此最终以部署域名的结果为准。

部署后依次确认：

1. 平台验证标签位于首页 `<head>`，验证文件 URL 返回 HTTP 200 且内容完全一致。
2. 站长平台验证成功，提交实际生成的 sitemap URL。
3. 浏览器网络面板看到所选统计服务的请求，后台实时事件出现。
4. 在文章或留言板提交真实留言，刷新后仍存在，后台保存和审核正常。
5. 手机页面无横向溢出，站点明暗切换后留言组件外观同步。

主题的配置与测试替身只证明接入逻辑，不代表真实账号验证、数据入库或留言持久化已完成。

## 排查常见问题

| 现象 | 检查方向 |
| --- | --- |
| 完全不显示留言 | `comments.enabled`、`provider`、必填参数、页面 `comments: false` |
| Giscus 报仓库/分类错误 | App 安装权限、Discussions、平台生成的 ID 与仓库是否一致 |
| Waline 请求失败 | 服务可达性、HTTPS、CORS、数据库与服务端日志 |
| 换肤不跟随 | Giscus / Utterances 是否使用 `theme: auto`；是否有浏览器缓存 |
| 统计脚本没有请求 | 开关、ID、域名过滤、内容拦截扩展及 CSP |
| 有统计后台但文章数字为空 | 报表不是文章数字接口；检查 `article_statistics` 的 JSON 与路径标识 |
| 修改后看不到效果 | 配置是否位于站点根目录，是否重复 YAML 键，是否重新生成并部署 |
| 验证文件构建失败 | 文件路径、保留文件名、重复配置及已有源文件冲突 |

服务安装与参数说明以官方文档为准：[Google Search Console](https://support.google.com/webmasters/answer/9008080?hl=zh-Hans)、[GA4](https://developers.google.com/analytics/devguides/collection/ga4/tag-options)、[Umami](https://docs.umami.is/docs/tracker-configuration)、[Clarity](https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-setup)、[Giscus](https://giscus.app/zh-CN)、[Waline](https://waline.js.org/guide/get-started/)、[Utterances](https://utteranc.es/)。
