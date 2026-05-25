---
title: Midnight AI 助读工作流
date: 2026-05-19 09:00:00
updated: 2026-05-19 09:30:00
lang: zh-CN
translation_key: midnight-agent-workflow
tags:
  - AI-Agent
  - Engineering
  - Midnight-Team
categories:
  - Engineering
description: 用一篇示例文章验证 Midnight 的中文文章、标签、目录和模型会话入口。
---

## 为什么需要助读

技术文章经常包含背景、决策和实现细节。Midnight 的模型会话入口可以把当前页面标题和地址传给站点自己的后端代理，让读者围绕文章继续提问。

## 内容结构

这篇文章刻意包含多个标题，用于检查目录生成、锚点跳转和长文阅读体验。

<div class="notice notice--warning">
  <strong>注意</strong>
  模型服务商 API Key 必须留在服务端代理中，不能写入主题配置或前端代码。
</div>

<figure class="wide">
  <img src="https://placehold.co/1400x560/101827/4df2c8?text=Midnight+Workflow" alt="Midnight 工作流预览">
  <figcaption>宽图用于验证文章媒体边界和图片说明样式。</figcaption>
</figure>

<div class="gallery gallery--three">
  <img src="https://placehold.co/480x320/111827/f8fafc?text=Post" alt="文章卡片预览">
  <img src="https://placehold.co/480x320/0f172a/4df2c8?text=Model" alt="模型会话预览">
  <img src="https://placehold.co/480x320/172033/f59e0b?text=Sitemap" alt="站点地图预览">
</div>

```js
const session = {
  system: '帮助读者理解当前文章。',
  messages: [{ role: 'user', content: '总结关键决策。' }]
};
```

## 发布检查

生成站点后，请确认中文页面、英文页面、语言切换链接、canonical 链接和 sitemap 都能正确输出。
