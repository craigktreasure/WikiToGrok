/**
 * End-to-end tests for WikiToGrok Extension
 * 
 * These tests load the extension in a real browser and verify functionality
 */

import { test, expect, chromium, BrowserContext } from '@playwright/test';
import path from 'path';

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
    
    // Navigate to a Special page
    await page.goto('https://en.wikipedia.org/wiki/Special:Random');
    
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
    
    // Click the "Open Grokipedia" button
    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      page.click('#wikitogrok-banner a[href*="grokipedia.com"]'),
    ]);
    
    // Check that new page is Grokipedia
    await newPage.waitForLoadState('domcontentloaded');
    expect(newPage.url()).toContain('grokipedia.com/page/Python');
    
    await newPage.close();
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
    
    // Check all main settings elements exist
    await expect(page.locator('#enabled-toggle')).toBeVisible();
    await expect(page.locator('#auto-redirect-toggle')).toBeVisible();
    await expect(page.locator('#notifications-toggle')).toBeVisible();
    await expect(page.locator('#delay-slider')).toBeVisible();
    await expect(page.locator('#languages-grid')).toBeVisible();
    
    // Check language checkboxes are populated
    const languageCheckboxes = await page.$$('#languages-grid input[type="checkbox"]');
    expect(languageCheckboxes.length).toBeGreaterThan(0);
    
    await page.close();
  });
});
