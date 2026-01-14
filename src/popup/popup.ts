/**
 * Popup Script for WikiToGrok Extension
 * 
 * Handles the popup UI for quick settings toggle
 */

import { UserSettings, DEFAULT_SETTINGS } from '../types/settings';

// DOM Elements
const enabledToggle = document.getElementById('enabled-toggle') as HTMLInputElement;
const autoRedirectToggle = document.getElementById('auto-redirect-toggle') as HTMLInputElement;
const statusIndicator = document.getElementById('status') as HTMLDivElement;
const statusText = statusIndicator.querySelector('.status-text') as HTMLSpanElement;
const optionsLink = document.getElementById('options-link') as HTMLAnchorElement;

/**
 * Gets current settings from storage
 */
async function getSettings(): Promise<UserSettings> {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
    if (response?.success && response.settings) {
      return response.settings;
    }
  } catch (error) {
    console.error('Failed to get settings:', error);
  }
  return DEFAULT_SETTINGS;
}

/**
 * Updates settings via service worker
 */
async function updateSettings(settings: Partial<UserSettings>): Promise<void> {
  try {
    await chrome.runtime.sendMessage({ type: 'UPDATE_SETTINGS', settings });
  } catch (error) {
    console.error('Failed to update settings:', error);
  }
}

/**
 * Updates the status indicator based on current settings
 */
function updateStatusIndicator(settings: UserSettings): void {
  statusIndicator.classList.remove('auto-redirect', 'disabled');
  
  if (!settings.enabled) {
    statusIndicator.classList.add('disabled');
    statusText.textContent = 'Extension disabled';
  } else if (settings.autoRedirect) {
    statusIndicator.classList.add('auto-redirect');
    statusText.textContent = 'Auto-redirect active';
  } else if (settings.useNotifications) {
    statusText.textContent = 'Notification mode';
  } else {
    statusText.textContent = 'Banner mode';
  }
}

/**
 * Initializes the popup with current settings
 */
async function initialize(): Promise<void> {
  const settings = await getSettings();
  
  // Set toggle states
  enabledToggle.checked = settings.enabled;
  autoRedirectToggle.checked = settings.autoRedirect;
  
  // Update status
  updateStatusIndicator(settings);
  
  // Disable auto-redirect toggle if extension is disabled
  autoRedirectToggle.disabled = !settings.enabled;
}

// Event Listeners

enabledToggle.addEventListener('change', async () => {
  const enabled = enabledToggle.checked;
  await updateSettings({ enabled });
  
  // Update auto-redirect toggle state
  autoRedirectToggle.disabled = !enabled;
  
  // If disabling, also turn off auto-redirect
  if (!enabled && autoRedirectToggle.checked) {
    autoRedirectToggle.checked = false;
    await updateSettings({ autoRedirect: false });
  }
  
  const settings = await getSettings();
  updateStatusIndicator(settings);
});

autoRedirectToggle.addEventListener('change', async () => {
  const autoRedirect = autoRedirectToggle.checked;
  await updateSettings({ autoRedirect });
  
  const settings = await getSettings();
  updateStatusIndicator(settings);
});

optionsLink.addEventListener('click', (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
  window.close();
});

// Initialize on load
document.addEventListener('DOMContentLoaded', initialize);
