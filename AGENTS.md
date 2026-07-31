# AGENTS.md

This file provides guidance to AI coding agents when working with code in this repository.

## Project Overview

WikiToGrok is a Chrome/Edge browser extension (Manifest V3) that redirects Wikipedia articles to Grokipedia. It provides both manual redirect via an in-page banner and automatic redirect via `declarativeNetRequest` rules.

## Commands

```bash
npm run build          # Build extension to dist/ (runs typecheck first)
npm test               # Run unit tests (Vitest)
npm run test:watch     # Run unit tests in watch mode
npm run test:e2e       # Run E2E tests (Playwright) - requires build first
npm run lint           # ESLint check
npm run lint:fix       # ESLint auto-fix
npm run typecheck      # TypeScript check only
npm run clean          # Remove dist/
```

Run a single unit test file:
```bash
npx vitest run tests/unit/url-transformer.test.ts
```

## TypeScript 6 / 7 side-by-side

Type checking runs on **TypeScript 7** (the Go-native compiler). TypeScript 7 dropped
the legacy JavaScript compiler API, which typescript-eslint still requires, so both
versions are installed side-by-side using the layout Microsoft documents for this
transition:

| package.json entry | Resolves to | Purpose |
| --- | --- | --- |
| `typescript` (alias of `@typescript/typescript6`) | TS 6 at `node_modules/typescript` | Legacy JS API that typescript-eslint imports as `typescript` |
| `typescript-7` (alias of `typescript`) | TS 7 at `node_modules/typescript-7` | The compiler used for type checking |

Because both packages ship a `tsc` binary, **`npx tsc` is ambiguous and currently
resolves to TS 6**. Always type check through the npm script, which invokes TS 7 by
explicit path:

```bash
npm run typecheck                          # TypeScript 7 (what CI runs)
node node_modules/typescript-7/bin/tsc     # TypeScript 7 directly
npx tsc6                                   # TypeScript 6, if you need the old compiler
```

Once typescript-eslint supports TS 7 ([typescript-eslint#10940](https://github.com/typescript-eslint/typescript-eslint/issues/10940)),
the `typescript` alias and the `typescript-7` entry can collapse back into a single
`typescript` dependency and `typecheck` can go back to plain `tsc --noEmit`.

## Architecture

### Extension Components

- **Service Worker** (`src/background/service-worker.ts`): Manages `declarativeNetRequest` redirect rules, handles browser notifications, and processes messages from content scripts. Initializes on startup and listens for settings changes.

- **Content Script** (`src/content/content-script.ts`): Injected into Wikipedia pages at `document_end`. Shows the redirect banner UI and handles user interactions. Built as IIFE (no imports) because content scripts can't use ES modules.

- **Popup** (`src/popup/`): Quick toggle controls for enable/disable and auto-redirect.

- **Options Page** (`src/options/`): Full settings UI including language selection and redirect delay.

### Build Process

The build (`scripts/build.js`) runs two separate Vite builds:
1. ES modules for service-worker, popup, and options
2. IIFE format for content-script (must be self-contained)

Then copies static files (manifest.json, icons, HTML, CSS) to `dist/`.

### Message Passing

Content scripts communicate with the service worker via `chrome.runtime.sendMessage()`. Message types are defined in `src/types/settings.ts`:
- `GET_SETTINGS` / `UPDATE_SETTINGS` - Settings read/write
- `SHOW_NOTIFICATION` - Browser notification requests
- `REDIRECT_TAB` - Tab redirect requests

### URL Transformation

`src/utils/url-transformer.ts` converts Wikipedia URLs to Grokipedia URLs. It excludes special namespaces (Special:, Wikipedia:, Talk:, User:, etc.) to only redirect actual articles.

### Storage

Settings use `chrome.storage.sync` for cross-device sync. The `UserSettings` interface and `DEFAULT_SETTINGS` are in `src/types/settings.ts`.

## Testing

Unit tests mock the Chrome API via `tests/setup.ts`. E2E tests use Playwright with a real browser (extensions don't work in headless mode).

## Key Constraints

- Content scripts cannot use ES module imports - must be bundled as IIFE
- E2E tests run with `workers: 1` and `fullyParallel: false` due to extension testing requirements
- Node.js 24+ required
