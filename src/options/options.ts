/**
 * Options Page Script for WikiToGrok Extension
 * 
 * Handles the full settings page with all configuration options
 */

import { UserSettings, DEFAULT_SETTINGS, SUPPORTED_LANGUAGES } from '../types/settings';

// DOM Elements
const enabledToggle = document.getElementById('enabled-toggle') as HTMLInputElement;
const autoRedirectToggle = document.getElementById('auto-redirect-toggle') as HTMLInputElement;
const notificationsToggle = document.getElementById('notifications-toggle') as HTMLInputElement;
const delaySlider = document.getElementById('delay-slider') as HTMLInputElement;
const delayValue = document.getElementById('delay-value') as HTMLSpanElement;
const languagesGrid = document.getElementById('languages-grid') as HTMLDivElement;
const selectAllBtn = document.getElementById('select-all-btn') as HTMLButtonElement;
const selectNoneBtn = document.getElementById('select-none-btn') as HTMLButtonElement;
const resetBtn = document.getElementById('reset-btn') as HTMLButtonElement;
const versionSpan = document.getElementById('version') as HTMLSpanElement;
const toast = document.getElementById('toast') as HTMLDivElement;

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
    throw error;
  }
}

/**
 * Shows a toast notification
 */
function showToast(message: string, type: 'success' | 'error' = 'success'): void {
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

/**
 * Formats delay value for display
 */
function formatDelay(ms: number): string {
  if (ms === 0) return 'Instant';
  return `${(ms / 1000).toFixed(1)}s`;
}

/**
 * Populates the languages grid
 */
function populateLanguages(enabledLanguages: string[]): void {
  languagesGrid.innerHTML = '';
  
  // If empty array, all languages are enabled
  const allEnabled = enabledLanguages.length === 0;
  
  SUPPORTED_LANGUAGES.forEach(lang => {
    const item = document.createElement('div');
    item.className = 'language-item';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `lang-${lang.code}`;
    checkbox.checked = allEnabled || enabledLanguages.includes(lang.code);
    checkbox.addEventListener('change', handleLanguageChange);
    
    const label = document.createElement('label');
    label.htmlFor = `lang-${lang.code}`;
    label.textContent = `${lang.name} (${lang.code})`;
    
    item.appendChild(checkbox);
    item.appendChild(label);
    languagesGrid.appendChild(item);
  });
}

/**
 * Gets the currently selected languages from the grid
 */
function getSelectedLanguages(): string[] {
  const checkboxes = languagesGrid.querySelectorAll('input[type="checkbox"]');
  const selected: string[] = [];
  
  checkboxes.forEach((cb) => {
    const checkbox = cb as HTMLInputElement;
    if (checkbox.checked) {
      const langCode = checkbox.id.replace('lang-', '');
      selected.push(langCode);
    }
  });
  
  // If all are selected, return empty array (means all enabled)
  if (selected.length === SUPPORTED_LANGUAGES.length) {
    return [];
  }
  
  return selected;
}

/**
 * Handles language checkbox changes
 */
async function handleLanguageChange(): Promise<void> {
  const enabledLanguages = getSelectedLanguages();
  await updateSettings({ enabledLanguages });
  showToast('Language settings updated');
}

/**
 * Updates UI state based on settings
 */
function updateUIState(settings: UserSettings): void {
  // Disable certain controls when extension is disabled
  autoRedirectToggle.disabled = !settings.enabled;
  notificationsToggle.disabled = !settings.enabled;
  delaySlider.disabled = !settings.enabled || !settings.autoRedirect;
  
  // Update delay slider
  delaySlider.value = settings.redirectDelay.toString();
  delayValue.textContent = formatDelay(settings.redirectDelay);
}

/**
 * Initializes the options page
 */
async function initialize(): Promise<void> {
  // Set version from manifest
  const manifest = chrome.runtime.getManifest();
  versionSpan.textContent = manifest.version;
  
  // Load settings
  const settings = await getSettings();
  
  // Set toggle states
  enabledToggle.checked = settings.enabled;
  autoRedirectToggle.checked = settings.autoRedirect;
  notificationsToggle.checked = settings.useNotifications;
  delaySlider.value = settings.redirectDelay.toString();
  delayValue.textContent = formatDelay(settings.redirectDelay);
  
  // Populate languages
  populateLanguages(settings.enabledLanguages);
  
  // Update UI state
  updateUIState(settings);
}

// Event Listeners

enabledToggle.addEventListener('change', async () => {
  const enabled = enabledToggle.checked;
  await updateSettings({ enabled });
  
  const settings = await getSettings();
  updateUIState(settings);
  
  showToast(enabled ? 'Extension enabled' : 'Extension disabled');
});

autoRedirectToggle.addEventListener('change', async () => {
  const autoRedirect = autoRedirectToggle.checked;
  await updateSettings({ autoRedirect });
  
  const settings = await getSettings();
  updateUIState(settings);
  
  showToast(autoRedirect ? 'Auto-redirect enabled' : 'Auto-redirect disabled');
});

notificationsToggle.addEventListener('change', async () => {
  const useNotifications = notificationsToggle.checked;
  await updateSettings({ useNotifications });
  
  showToast(useNotifications ? 'Browser notifications enabled' : 'In-page banner enabled');
});

delaySlider.addEventListener('input', () => {
  const delay = parseInt(delaySlider.value, 10);
  delayValue.textContent = formatDelay(delay);
});

delaySlider.addEventListener('change', async () => {
  const redirectDelay = parseInt(delaySlider.value, 10);
  await updateSettings({ redirectDelay });
  showToast(`Redirect delay set to ${formatDelay(redirectDelay)}`);
});

selectAllBtn.addEventListener('click', async () => {
  const checkboxes = languagesGrid.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach((cb) => {
    (cb as HTMLInputElement).checked = true;
  });
  await updateSettings({ enabledLanguages: [] }); // Empty = all enabled
  showToast('All languages enabled');
});

selectNoneBtn.addEventListener('click', async () => {
  const checkboxes = languagesGrid.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach((cb) => {
    (cb as HTMLInputElement).checked = false;
  });
  await updateSettings({ enabledLanguages: ['en'] }); // Default to English only
  
  // Re-check English
  const enCheckbox = document.getElementById('lang-en') as HTMLInputElement;
  if (enCheckbox) enCheckbox.checked = true;
  
  showToast('Only English enabled');
});

resetBtn.addEventListener('click', async () => {
  if (confirm('Are you sure you want to reset all settings to their defaults?')) {
    await updateSettings(DEFAULT_SETTINGS);
    await initialize();
    showToast('Settings reset to defaults');
  }
});

// Initialize on load
document.addEventListener('DOMContentLoaded', initialize);

// Listen for settings changes from other sources
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'sync' && changes.userSettings) {
    initialize();
  }
});
