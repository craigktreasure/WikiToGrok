/**
 * End-to-end tests for WikiToGrok Extension
 *
 * These tests load the extension in a real browser and verify functionality
 */

import { test, expect, chromium, BrowserContext } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const extensionPath = path.resolve(__dirname, '../../dist');

let context: BrowserContext;

test.describe('WikiToGrok Extension', () => {
  test.beforeAll(async () => {
    // Launch browser with extension loaded
    context = await chromium.launchPersistentContext('', {
      headless: false, // Extensions require headed mode
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    });
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('extension loads successfully', async () => {
    const page = await context.newPage();

    // Navigate to a Wikipedia article
    await page.goto('https://en.wikipedia.org/wiki/TypeScript');

    // Wait for page to load
    await page.waitForLoadState('domcontentloaded');

    // Check that we're still on Wikipedia (not auto-redirected by default)
    expect(page.url()).toContain('wikipedia.org');

    await page.close();
  });

  test('shows redirect banner on Wikipedia article pages', async () => {
    const page = await context.newPage();

    // Navigate to a Wikipedia article
    await page.goto('https://en.wikipedia.org/wiki/JavaScript');

    // Wait for the banner to appear
    const banner = await page.waitForSelector('#wikitogrok-banner', {
      timeout: 5000,
    });

    expect(banner).toBeTruthy();

    // Check banner contains expected elements
    const openButton = await banner.$('a[href*="grokipedia.com"]');
    expect(openButton).toBeTruthy();

    await page.close();
  });

  test('does not show banner on non-article pages', async () => {
    const page = await context.newPage();

    // Navigate to the Special:SpecialPages index (not Random which redirects to an article)
    await page.goto('https://en.wikipedia.org/wiki/Special:SpecialPages');

    // Wait a moment for any banner to potentially appear
    await page.waitForTimeout(2000);

    // Check that no banner is present
    const banner = await page.$('#wikitogrok-banner');
    expect(banner).toBeNull();

    await page.close();
  });

  test('redirect button navigates to Grokipedia', async () => {
    const page = await context.newPage();

    // Navigate to a Wikipedia article
    await page.goto('https://en.wikipedia.org/wiki/Python_(programming_language)');

    // Wait for the banner
    await page.waitForSelector('#wikitogrok-banner');

    // Get the Grokipedia link href
    const link = await page.$('#wikitogrok-banner a[href*="grokipedia.com"]');
    expect(link).toBeTruthy();

    const href = await link!.getAttribute('href');
    expect(href).toContain('grokipedia.com/page/Python');

    await page.close();
  });

  test('dismiss button removes banner', async () => {
    const page = await context.newPage();

    // Navigate to a Wikipedia article
    await page.goto('https://en.wikipedia.org/wiki/React_(software)');

    // Wait for the banner
    await page.waitForSelector('#wikitogrok-banner');

    // Click dismiss button
    await page.click('#wikitogrok-banner button[aria-label="Dismiss banner"]');

    // Wait for animation
    await page.waitForTimeout(500);

    // Check banner is removed
    const banner = await page.$('#wikitogrok-banner');
    expect(banner).toBeNull();

    await page.close();
  });

  test('popup opens and displays settings', async () => {
    // Get the extension ID from the service worker
    const [background] = context.serviceWorkers();
    const extensionId = background.url().split('/')[2];

    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);

    // Check popup elements exist
    const enabledToggle = await page.$('#enabled-toggle');
    const autoRedirectToggle = await page.$('#auto-redirect-toggle');
    const optionsLink = await page.$('#options-link');

    expect(enabledToggle).toBeTruthy();
    expect(autoRedirectToggle).toBeTruthy();
    expect(optionsLink).toBeTruthy();

    await page.close();
  });

  test('options page loads and displays all settings', async () => {
    // Get the extension ID
    const [background] = context.serviceWorkers();
    const extensionId = background.url().split('/')[2];

    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html`);

    // Check all main settings elements exist (use $ instead of locator for hidden checkboxes)
    expect(await page.$('#enabled-toggle')).toBeTruthy();
    expect(await page.$('#auto-redirect-toggle')).toBeTruthy();
    expect(await page.$('#notifications-toggle')).toBeTruthy();
    expect(await page.$('#delay-slider')).toBeTruthy();
    expect(await page.$('#languages-grid')).toBeTruthy();

    // Check language checkboxes are populated
    const languageCheckboxes = await page.$$('#languages-grid input[type="checkbox"]');
    expect(languageCheckboxes.length).toBeGreaterThan(0);

    await page.close();
  });
});
