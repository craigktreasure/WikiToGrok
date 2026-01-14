# Privacy Policy for WikiToGrok

**Last updated:** January 13, 2026

## Overview

WikiToGrok is a browser extension that redirects Wikipedia article pages to Grokipedia. We are committed to protecting your privacy and being transparent about our practices.

## Data Collection

**WikiToGrok does not collect, store, or transmit any personal data.**

### What We Store Locally

The extension stores your preferences locally on your device using the browser's built-in storage API (`chrome.storage.sync`). This includes:

- Whether the extension is enabled
- Auto-redirect preference
- Notification preferences
- Selected Wikipedia languages
- Banner display preferences

This data:

- Is stored entirely on your device and synced across your browsers via your browser account (if sync is enabled)
- Is never transmitted to any external servers
- Is never shared with third parties
- Can be cleared at any time by uninstalling the extension or clearing browser data

### What We Access

The extension accesses Wikipedia pages (`*.wikipedia.org`) solely to:

- Display a redirect banner on article pages
- Perform automatic redirects to Grokipedia (if enabled)

We do not read, collect, or store any information about:

- The articles you visit
- Your browsing history
- Your identity or personal information

## Permissions Explained

| Permission | Why We Need It |
|------------|----------------|
| `storage` | Save your preferences locally |
| `declarativeNetRequest` | Perform automatic URL redirects |
| `activeTab` | Interact with the current Wikipedia page |
| `notifications` | Show optional browser notifications (if enabled) |
| `*://*.wikipedia.org/*` | Access Wikipedia pages to show banners and redirect |

## Third-Party Services

When you click to open Grokipedia, you will be redirected to `grokipedia.com`. Please refer to Grokipedia's privacy policy for information about how they handle your data.

## Changes to This Policy

If we make changes to this privacy policy, we will update the "Last updated" date above.

## Contact

If you have questions about this privacy policy, please open an issue on our [GitHub repository](https://github.com/craigktreasure/WikiToGrok).

## Open Source

WikiToGrok is open source software. You can review the complete source code to verify our privacy practices.
