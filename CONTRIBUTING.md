# Contributing to WikiToGrok

Thank you for your interest in contributing to WikiToGrok! This document provides guidelines and information for contributors.

## 📋 Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

## 🚀 Getting Started

### Prerequisites

- Node.js 18 or higher
- npm 9 or higher
- Git
- Chrome or Edge browser for testing

### Development Setup

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/wiki-to-grok.git
   cd wiki-to-grok
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create a branch for your work**
   ```bash
   git checkout -b feature/your-feature-name
   ```

4. **Start development build**
   ```bash
   npm run dev
   ```

5. **Load the extension in your browser**
   - Go to `chrome://extensions` or `edge://extensions`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

## 📁 Project Structure

```
src/
├── background/          # Service worker (runs in background)
├── content/             # Content scripts (injected into pages)
├── popup/               # Extension popup UI
├── options/             # Options/settings page
├── types/               # TypeScript type definitions
└── utils/               # Shared utility functions

tests/
├── unit/                # Unit tests (Vitest)
├── e2e/                 # End-to-end tests (Playwright)
└── setup.ts             # Test configuration and mocks

public/
├── manifest.json        # Extension manifest
└── icons/               # Extension icons
```

## 🔧 Development Workflow

### Running Tests

```bash
# Unit tests
npm test

# Unit tests with coverage
npm test -- --coverage

# Unit tests in watch mode
npm run test:watch

# E2E tests (requires built extension)
npm run build
npm run test:e2e

# E2E tests with visible browser
npm run test:e2e:headed
```

### Code Quality

```bash
# Lint code
npm run lint

# Fix lint issues
npm run lint:fix

# Type check
npm run typecheck
```

### Building

```bash
# Production build
npm run build

# Development build (watch mode)
npm run dev

# Clean build output
npm run clean
```

## 📝 Coding Standards

### TypeScript

- Use strict TypeScript (`strict: true`)
- Prefer explicit types over `any`
- Use interfaces for object shapes
- Document public functions with JSDoc comments

```typescript
/**
 * Transforms a Wikipedia URL to a Grokipedia URL
 * 
 * @param wikipediaUrl - The Wikipedia URL to transform
 * @returns TransformResult with the Grokipedia URL or error
 * 
 * @example
 * transformToGrokipedia('https://en.wikipedia.org/wiki/TypeScript')
 * // { success: true, grokipediaUrl: 'https://grokipedia.com/page/TypeScript', ... }
 */
export function transformToGrokipedia(wikipediaUrl: string): TransformResult {
  // ...
}
```

### File Organization

- One component/utility per file
- Related files grouped in folders
- Index files for exports when appropriate

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add support for French Wikipedia
fix: handle URL encoding in article names
docs: update README with new features
test: add tests for storage utility
refactor: simplify URL transformation logic
chore: update dependencies
```

## 🐛 Bug Reports

When reporting bugs, please include:

1. **Description**: Clear description of the bug
2. **Steps to Reproduce**: Numbered steps to reproduce
3. **Expected Behavior**: What should happen
4. **Actual Behavior**: What actually happens
5. **Environment**: Browser version, OS, extension version
6. **Screenshots**: If applicable

## ✨ Feature Requests

When requesting features:

1. **Description**: Clear description of the feature
2. **Use Case**: Why is this feature needed?
3. **Proposed Solution**: How you think it could work
4. **Alternatives**: Other solutions you've considered

## 🔀 Pull Requests

### Before Submitting

1. ✅ All tests pass (`npm test`)
2. ✅ No lint errors (`npm run lint`)
3. ✅ Type check passes (`npm run typecheck`)
4. ✅ Extension builds successfully (`npm run build`)
5. ✅ New features have tests
6. ✅ Documentation updated if needed

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How were these changes tested?

## Screenshots
If applicable

## Checklist
- [ ] Tests pass
- [ ] Lint clean
- [ ] Types check
- [ ] Docs updated
```

## 🏗️ Architecture Notes

### Manifest V3

This extension uses Manifest V3, the latest Chrome extension platform:

- **Service Workers** instead of background pages
- **declarativeNetRequest** for URL redirects
- **Promises** throughout the Chrome APIs

### Message Passing

Communication between components:

```
Content Script ←→ Service Worker ←→ Storage
       ↓
    Popup/Options
```

### Storage

User settings are stored in `chrome.storage.sync` for cross-device sync:

```typescript
interface UserSettings {
  autoRedirect: boolean;
  useNotifications: boolean;
  redirectDelay: number;
  enabledLanguages: string[];
  enabled: boolean;
}
```

## 📞 Contact

- Create an issue for bugs or features
- Start a discussion for questions
- Email: [your-email@example.com]

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.
