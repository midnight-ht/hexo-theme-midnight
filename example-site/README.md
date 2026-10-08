# Midnight Example Site

This is a minimal Hexo site for smoke testing the Midnight theme.

## Setup

From this directory:

```powershell
npm install
npm run build
```

The build script prepares a local ignored copy of the theme in `themes/midnight` before running Hexo.

To start the local demo server:

```powershell
npm run server
```

Then open `http://localhost:4000`.

The sample posts use matching `translation_key` values and language-prefixed permalinks so the theme language switcher, alternate links, and sitemap output can be checked together.

## Integration checks

See the [English integration guide](../docs/INTEGRATIONS.md), [Chinese guide](../docs/INTEGRATIONS.zh-CN.md) and [disabled-by-default configuration template](../docs/examples/integrations.yml). Configure your actual site rather than editing the generated `themes/midnight` copy.

After building this example, run the following checks from the theme root:

```bash
npm run lint:webmaster
npm run lint:analytics
npm run lint:comments
npm run lint:statistics
npm run lint:seo
```

Comment and analytics tests use service doubles; they do not submit real comments or prove collection in a third-party account. Follow the deployment verification steps in the guide for a real service.
