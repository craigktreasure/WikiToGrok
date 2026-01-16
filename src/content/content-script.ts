/**
 * Content Script for WikiToGrok Extension
 *
 * Injected into Wikipedia pages to:
 * - Display redirect banner for article pages
 * - Handle auto-redirect when enabled
 * - Communicate with service worker
 */

import {
  isArticlePage,
  transformToGrokipedia,
  decodeArticleName,
  isLanguageEnabled,
} from '../utils/url-transformer';
import { UserSettings, DEFAULT_SETTINGS } from '../types/settings';

// Banner element ID for cleanup
const BANNER_ID = 'wikitogrok-banner';

/**
 * Gets current settings from the service worker
 */
async function getSettings(): Promise<UserSettings> {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
    if (response?.success && response.settings) {
      return response.settings;
    }
  } catch (error) {
    console.error('WikiToGrok: Failed to get settings', error);
  }
  return DEFAULT_SETTINGS;
}

/**
 * Updates a setting via the service worker
 */
async function updateSetting(settings: Partial<UserSettings>): Promise<void> {
  try {
    await chrome.runtime.sendMessage({ type: 'UPDATE_SETTINGS', settings });
  } catch (error) {
    console.error('WikiToGrok: Failed to update settings', error);
  }
}

/**
 * Requests a browser notification from the service worker
 */
async function showNotification(
  title: string,
  message: string,
  url: string
): Promise<void> {
  try {
    await chrome.runtime.sendMessage({
      type: 'SHOW_NOTIFICATION',
      title,
      message,
      url,
    });
  } catch (error) {
    console.error('WikiToGrok: Failed to show notification', error);
  }
}

/**
 * Creates and returns the banner HTML element
 */
function createBanner(
  articleName: string,
  grokipediaUrl: string,
  settings: UserSettings
): HTMLDivElement {
  const banner = document.createElement('div');
  banner.id = BANNER_ID;
  banner.setAttribute('role', 'banner');
  banner.setAttribute('aria-label', 'WikiToGrok redirect suggestion');

  // Inline styles to avoid CSS conflicts with Wikipedia
  banner.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 999999;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    color: #ffffff;
    padding: 12px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
    font-size: 14px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
    animation: wikitogrok-slideIn 0.3s ease-out;
  `;

  // Add animation keyframes
  const style = document.createElement('style');
  style.textContent = `
    @keyframes wikitogrok-slideIn {
      from {
        transform: translateY(-100%);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
    @keyframes wikitogrok-slideOut {
      from {
        transform: translateY(0);
        opacity: 1;
      }
      to {
        transform: translateY(-100%);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);

  // Create banner content
  const content = document.createElement('div');
  content.style.cssText = `
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
  `;

  // Icon/Logo
  const icon = document.createElement('span');
  icon.textContent = '🔄';
  icon.style.fontSize = '20px';
  content.appendChild(icon);

  // Message
  const message = document.createElement('span');
  message.innerHTML = `View <strong>"${articleName}"</strong> on Grokipedia`;
  content.appendChild(message);

  banner.appendChild(content);

  // Actions container
  const actions = document.createElement('div');
  actions.style.cssText = `
    display: flex;
    align-items: center;
    gap: 12px;
  `;

  // Auto-redirect checkbox
  const checkboxLabel = document.createElement('label');
  checkboxLabel.style.cssText = `
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    font-size: 13px;
    opacity: 0.9;
  `;

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = settings.autoRedirect;
  checkbox.style.cssText = `
    cursor: pointer;
    width: 16px;
    height: 16px;
  `;
  checkbox.addEventListener('change', async () => {
    await updateSetting({ autoRedirect: checkbox.checked });
    if (checkbox.checked) {
      // Redirect immediately after enabling auto-redirect
      window.location.href = grokipediaUrl;
    }
  });

  checkboxLabel.appendChild(checkbox);
  checkboxLabel.appendChild(document.createTextNode('Always redirect'));
  actions.appendChild(checkboxLabel);

  // Open Grokipedia button
  const openButton = document.createElement('a');
  openButton.href = grokipediaUrl;
  openButton.textContent = 'Open Grokipedia';
  openButton.style.cssText = `
    background: #4a90d9;
    color: white;
    padding: 8px 16px;
    border-radius: 6px;
    text-decoration: none;
    font-weight: 500;
    transition: background 0.2s;
  `;
  openButton.addEventListener('mouseenter', () => {
    openButton.style.background = '#5ba0e9';
  });
  openButton.addEventListener('mouseleave', () => {
    openButton.style.background = '#4a90d9';
  });
  actions.appendChild(openButton);

  // Dismiss button
  const dismissButton = document.createElement('button');
  dismissButton.textContent = '✕';
  dismissButton.setAttribute('aria-label', 'Dismiss banner');
  dismissButton.style.cssText = `
    background: transparent;
    border: none;
    color: white;
    font-size: 18px;
    cursor: pointer;
    padding: 4px 8px;
    opacity: 0.7;
    transition: opacity 0.2s;
  `;
  dismissButton.addEventListener('mouseenter', () => {
    dismissButton.style.opacity = '1';
  });
  dismissButton.addEventListener('mouseleave', () => {
    dismissButton.style.opacity = '0.7';
  });
  dismissButton.addEventListener('click', () => {
    removeBanner();
  });
  actions.appendChild(dismissButton);

  banner.appendChild(actions);

  return banner;
}

/**
 * Removes the banner from the page
 */
function removeBanner(): void {
  const banner = document.getElementById(BANNER_ID);
  if (banner) {
    banner.style.animation = 'wikitogrok-slideOut 0.3s ease-in forwards';
    setTimeout(() => {
      banner.remove();
      // Reset page padding
      document.body.style.paddingTop = '';
    }, 300);
  }
}

/**
 * Shows the banner at the top of the page
 */
function showBanner(
  articleName: string,
  grokipediaUrl: string,
  settings: UserSettings
): void {
  // Remove existing banner if present
  const existingBanner = document.getElementById(BANNER_ID);
  if (existingBanner) {
    existingBanner.remove();
  }

  const banner = createBanner(articleName, grokipediaUrl, settings);

  // Insert at the beginning of body
  document.body.insertBefore(banner, document.body.firstChild);

  // Add padding to body to prevent content from being hidden behind banner
  const bannerHeight = banner.offsetHeight;
  document.body.style.paddingTop = `${bannerHeight}px`;
}

/**
 * Performs auto-redirect with optional delay
 */
function performRedirect(url: string, delay: number): void {
  if (delay > 0) {
    setTimeout(() => {
      window.location.href = url;
    }, delay);
  } else {
    window.location.href = url;
  }
}

/**
 * Main initialization function
 */
async function initialize(): Promise<void> {
  const currentUrl = window.location.href;

  // Check if this is an article page
  if (!isArticlePage(currentUrl)) {
    return;
  }

  // Get transformation result
  const result = transformToGrokipedia(currentUrl);
  if (!result.success || !result.grokipediaUrl || !result.articleName || !result.language) {
    return;
  }

  // Get user settings
  const settings = await getSettings();

  // Check if extension is enabled
  if (!settings.enabled) {
    return;
  }

  // Check if this language is enabled
  if (!isLanguageEnabled(result.language, settings.enabledLanguages)) {
    return;
  }

  const articleName = decodeArticleName(result.articleName);
  const grokipediaUrl = result.grokipediaUrl;

  // Handle auto-redirect mode
  if (settings.autoRedirect) {
    performRedirect(grokipediaUrl, settings.redirectDelay);
    return;
  }

  // Show notification if preferred
  if (settings.useNotifications) {
    await showNotification(
      'WikiToGrok',
      `View "${articleName}" on Grokipedia`,
      grokipediaUrl
    );
    return;
  }

  // Default: show in-page banner
  showBanner(articleName, grokipediaUrl, settings);
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

// Listen for settings changes to update banner
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'sync' && changes.userSettings) {
    const newSettings = changes.userSettings.newValue as UserSettings;

    // If extension was disabled, remove banner
    if (!newSettings.enabled) {
      removeBanner();
      return;
    }

    // If auto-redirect was enabled, redirect now
    const oldSettings = changes.userSettings.oldValue as UserSettings | undefined;
    if (newSettings.autoRedirect && !oldSettings?.autoRedirect) {
      const result = transformToGrokipedia(window.location.href);
      if (result.success && result.grokipediaUrl) {
        performRedirect(result.grokipediaUrl, newSettings.redirectDelay);
      }
    }
  }
});
