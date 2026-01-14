# Releasing WikiToGrok

This document describes the process for creating a new release of the WikiToGrok browser extension.

## Prerequisites

- All tests passing on `main` branch
- Changes ready to release

## Release Process

### 1. Update Version Numbers

On a feature branch or directly via PR, update `public/manifest.json`:

```json
{
  "version": "1.0.0"
}
```

Optionally update `package.json` to match:

```json
{
  "version": "1.0.0"
}
```

### 2. Merge to Main

Create a PR with the version bump (can be combined with other changes), get approval, and merge to `main`.

### 3. Trigger the Release Workflow

After the PR is merged:

1. Go to **Actions** → **Release Extension**
2. Click **Run workflow**
3. Enter the version number (e.g., `1.0.0`) - must match `manifest.json`
4. Click **Run workflow**

The workflow will:
- Validate the version format
- Verify `manifest.json` has the correct version
- Run linting and tests
- Build the extension
- Create a Git tag `v1.0.0`
- Create a GitHub Release with auto-generated release notes
- Attach the `wiki-to-grok-v1.0.0.zip` file

### 4. Download the Artifact

Once the workflow completes:

1. Go to the [Releases page](../../releases)
2. Download the `wiki-to-grok-v1.0.0.zip` file attached to the release

## Submitting to Extension Stores

### Chrome Web Store

1. Go to the [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Select your extension (or create a new one)
3. Click "Package" → "Upload new package"
4. Upload the ZIP file from the GitHub Release
5. Fill in store listing details (screenshots, description, etc.)
6. Submit for review

### Microsoft Edge Add-ons

1. Go to the [Microsoft Partner Center](https://partner.microsoft.com/dashboard/microsoftedge/overview)
2. Select your extension (or create a new one)
3. Click "Update" → "Upload package"
4. Upload the ZIP file from the GitHub Release
5. Fill in store listing details
6. Submit for review

## Version Numbering

Follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.0.0 → 2.0.0): Breaking changes or major new features
- **MINOR** (1.0.0 → 1.1.0): New features, backward compatible
- **PATCH** (1.0.0 → 1.0.1): Bug fixes, backward compatible

## Troubleshooting

### Version mismatch error

The release workflow validates that the version you enter matches `manifest.json`. If you get a mismatch error, ensure you've merged the version bump PR before triggering the release.

### Need to re-release the same version

Delete the existing release and tag on GitHub, then run the workflow again:

1. Go to **Releases** and delete the release
2. Go to **Tags** and delete the tag `v1.0.0`
3. Re-run the Release workflow

### Manual build without releasing

You can trigger a build manually without creating a release:

1. Go to **Actions** → **Build Extension**
2. Click **Run workflow**
3. Download the artifact from the workflow run
