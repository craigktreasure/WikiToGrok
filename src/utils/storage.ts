/**
 * Storage utility for managing user settings
 * Uses chrome.storage.sync for cross-device persistence
 */

import { UserSettings, DEFAULT_SETTINGS, STORAGE_KEY } from '../types/settings';

/**
 * Retrieves user settings from storage
 * Returns default settings merged with any stored values
 *
 * @returns Promise resolving to the current user settings
 *
 * @example
 * const settings = await getSettings();
 * console.log(settings.autoRedirect); // false (default)
 */
export async function getSettings(): Promise<UserSettings> {
  try {
    const result = await chrome.storage.sync.get(STORAGE_KEY);
    const storedSettings = result[STORAGE_KEY] as Partial<UserSettings> | undefined;

    // Merge with defaults to ensure all properties exist
    return {
      ...DEFAULT_SETTINGS,
      ...storedSettings,
    };
  } catch (error) {
    console.error('Failed to get settings:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Saves user settings to storage
 * Merges the provided settings with existing ones
 *
 * @param settings - Partial settings object to save
 * @returns Promise resolving when save is complete
 *
 * @example
 * await saveSettings({ autoRedirect: true });
 */
export async function saveSettings(settings: Partial<UserSettings>): Promise<void> {
  try {
    const current = await getSettings();
    const updated = {
      ...current,
      ...settings,
    };

    await chrome.storage.sync.set({
      [STORAGE_KEY]: updated,
    });
  } catch (error) {
    console.error('Failed to save settings:', error);
    throw error;
  }
}

/**
 * Resets all settings to their default values
 *
 * @returns Promise resolving when reset is complete
 */
export async function resetSettings(): Promise<void> {
  try {
    await chrome.storage.sync.set({
      [STORAGE_KEY]: DEFAULT_SETTINGS,
    });
  } catch (error) {
    console.error('Failed to reset settings:', error);
    throw error;
  }
}

/**
 * Callback type for settings change listener
 */
export type SettingsChangeCallback = (
  newSettings: UserSettings,
  oldSettings: UserSettings
) => void;

/**
 * Registers a listener for settings changes
 * Useful for updating UI when settings change in another tab/window
 *
 * @param callback - Function to call when settings change
 * @returns Function to unregister the listener
 *
 * @example
 * const unsubscribe = onSettingsChange((newSettings, oldSettings) => {
 *   console.log('Settings changed:', newSettings);
 * });
 * // Later: unsubscribe();
 */
export function onSettingsChange(callback: SettingsChangeCallback): () => void {
  const listener = (
    changes: { [key: string]: chrome.storage.StorageChange },
    areaName: string
  ): void => {
    if (areaName !== 'sync') return;

    const settingsChange = changes[STORAGE_KEY];
    if (!settingsChange) return;

    const newSettings = {
      ...DEFAULT_SETTINGS,
      ...(settingsChange.newValue as Partial<UserSettings>),
    };

    const oldSettings = {
      ...DEFAULT_SETTINGS,
      ...(settingsChange.oldValue as Partial<UserSettings>),
    };

    callback(newSettings, oldSettings);
  };

  chrome.storage.onChanged.addListener(listener);

  // Return unsubscribe function
  return () => {
    chrome.storage.onChanged.removeListener(listener);
  };
}

/**
 * Toggles a boolean setting
 *
 * @param key - The setting key to toggle
 * @returns Promise resolving to the new value
 *
 * @example
 * const newValue = await toggleSetting('autoRedirect');
 */
export async function toggleSetting(
  key: keyof Pick<UserSettings, 'autoRedirect' | 'useNotifications' | 'enabled'>
): Promise<boolean> {
  const settings = await getSettings();
  const newValue = !settings[key];
  await saveSettings({ [key]: newValue });
  return newValue;
}

/**
 * Adds a language to the enabled languages list
 *
 * @param language - Language code to add
 */
export async function addLanguage(language: string): Promise<void> {
  const settings = await getSettings();
  if (!settings.enabledLanguages.includes(language)) {
    await saveSettings({
      enabledLanguages: [...settings.enabledLanguages, language],
    });
  }
}

/**
 * Removes a language from the enabled languages list
 *
 * @param language - Language code to remove
 */
export async function removeLanguage(language: string): Promise<void> {
  const settings = await getSettings();
  await saveSettings({
    enabledLanguages: settings.enabledLanguages.filter(l => l !== language),
  });
}

/**
 * Sets all languages as enabled (by clearing the list)
 * An empty list means all languages are enabled
 */
export async function enableAllLanguages(): Promise<void> {
  await saveSettings({ enabledLanguages: [] });
}
