# WikiToGrok

![WikiToGrok](public/icons/icon128.png)

A Chrome and Edge browser extension that redirects Wikipedia articles to [Grokipedia](https://grokipedia.com), offering AI-enhanced wiki articles.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-0.2.0-green.svg)
![Manifest](https://img.shields.io/badge/manifest-v3-orange.svg)

## ✨ Features

- **Smart Redirect Banner**: Non-intrusive in-page banner offering to redirect Wikipedia articles to Grokipedia
- **Auto-Redirect Mode**: Optionally enable automatic redirection for hands-free browsing
- **Browser Notifications**: Alternative notification style for redirect prompts
- **Multi-Language Support**: Works with all Wikipedia language editions (English enabled by default)
- **Configurable Delay**: Set a delay before auto-redirect if you want time to cancel
- **Article-Only Detection**: Only triggers on actual Wikipedia articles, not special pages or namespaces
- **Cross-Browser**: Works on both Google Chrome and Microsoft Edge

## 📦 Installation

### From Web Stores (Coming Soon)

- Chrome Web Store: [Link TBD]
- Microsoft Edge Add-ons: [Link TBD]

### For Development (Load Unpacked)

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/wiki-to-grok.git
   cd wiki-to-grok
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the extension:
   ```bash
   npm run build
   ```

4. Load in Chrome/Edge:
   - Open `chrome://extensions` (Chrome) or `edge://extensions` (Edge)
   - Enable "Developer mode" (toggle in top-right)
   - Click "Load unpacked"
   - Select the `dist` folder from this project

## 🚀 Usage

Once installed, the extension works automatically:

1. **Visit any Wikipedia article** (e.g., `en.wikipedia.org/wiki/TypeScript`)
2. **See the redirect banner** at the top of the page
3. **Click "Open Grokipedia"** to view the article on Grokipedia
4. **Optional**: Check "Always redirect" to enable auto-redirect mode

### Popup Controls

Click the extension icon for quick access to:
- Toggle extension on/off
- Enable/disable auto-redirect

### Full Settings (Options Page)

Right-click the extension icon → "Options" for:
- Enable/disable extension
- Auto-redirect toggle
- Browser notifications preference
- Redirect delay (0-5 seconds)
- Language selection (choose which Wikipedia languages to redirect)
- Reset to defaults

## 🛠️ Development

### Prerequisites

- Node.js 24+
- npm 10+

### Setup

```bash
# Install dependencies
npm install

# Build the extension
npm run build

# Run unit tests
npm test

# Run unit tests in watch mode
npm run test:watch

# Run E2E tests (requires built extension)
npm run build
npm run test:e2e

# Lint code
npm run lint

# Type check
npm run typecheck
```

### Project Structure

```
wiki-to-grok/
├── src/
│   ├── background/
│   │   └── service-worker.ts   # Background service worker
│   ├── content/
│   │   └── content-script.ts   # Injected into Wikipedia pages
│   ├── popup/
│   │   ├── popup.html          # Popup UI
│   │   ├── popup.ts            # Popup logic
│   │   └── popup.css           # Popup styles
│   ├── options/
│   │   ├── options.html        # Options page
│   │   ├── options.ts          # Options logic
│   │   └── options.css         # Options styles
│   ├── types/
│   │   └── settings.ts         # TypeScript types
│   └── utils/
│       ├── url-transformer.ts  # Wikipedia → Grokipedia URL conversion
│       └── storage.ts          # Chrome storage utilities
├── public/
│   ├── manifest.json           # Extension manifest (v3)
│   └── icons/                  # Extension icons
├── tests/
│   ├── unit/                   # Vitest unit tests
│   ├── e2e/                    # Playwright E2E tests
│   └── setup.ts                # Test setup and mocks
├── dist/                       # Built extension (generated)
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
└── playwright.config.ts
```

### Key Technologies

- **TypeScript**: Type-safe development
- **Vite**: Fast build tooling
- **Manifest V3**: Modern Chrome extension APIs
- **Vitest**: Unit testing framework
- **Playwright**: End-to-end testing

### URL Transformation

Wikipedia URLs are transformed to Grokipedia using this pattern:

```
https://en.wikipedia.org/wiki/Article_Name
→
https://grokipedia.com/page/Article_Name
```

The extension filters out non-article pages including:
- `Special:` pages
- `Wikipedia:` namespace
- `Talk:` pages
- `User:` pages
- `File:`, `Template:`, `Help:`, `Category:`, `Portal:`, `Draft:`, `Module:` namespaces

## 🧪 Testing

### Unit Tests

Unit tests cover the core utilities (URL transformation, storage):

```bash
npm test
```

### E2E Tests

E2E tests verify the extension works correctly in a real browser:

```bash
npm run build
npm run test:e2e
```

Note: E2E tests run in headed mode (visible browser) since Chrome extensions don't work in headless mode.

## 📋 Permissions

The extension requires these permissions:

- **`storage`**: Save user preferences (synced across devices)
- **`declarativeNetRequest`**: Automatic URL redirects
- **`activeTab`**: Access current tab for content script
- **`notifications`**: Optional browser notifications
- **`*://*.wikipedia.org/*`**: Access Wikipedia pages

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- [Grokipedia](https://grokipedia.com) by xAI for the AI-enhanced wiki
- [Wikipedia](https://wikipedia.org) for the original content
