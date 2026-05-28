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
