/**
 * Unit tests for Storage utility
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { resetMockStorage, mockChrome } from '../setup';
import {
  getSettings,
  saveSettings,
  resetSettings,
  onSettingsChange,
  toggleSetting,
  addLanguage,
  removeLanguage,
  enableAllLanguages,
} from '../../src/utils/storage';
import { DEFAULT_SETTINGS, UserSettings } from '../../src/types/settings';

describe('Storage Utility', () => {
  beforeEach(() => {
    resetMockStorage();
    vi.clearAllMocks();
  });

  describe('getSettings', () => {
    it('returns default settings when no settings are stored', async () => {
      const settings = await getSettings();
      expect(settings).toEqual(DEFAULT_SETTINGS);
    });

    it('merges stored settings with defaults', async () => {
      await mockChrome.storage.sync.set({
        userSettings: { autoRedirect: true },
      });

      const settings = await getSettings();
      expect(settings.autoRedirect).toBe(true);
      expect(settings.enabled).toBe(DEFAULT_SETTINGS.enabled);
      expect(settings.useNotifications).toBe(DEFAULT_SETTINGS.useNotifications);
    });

    it('returns defaults on storage error', async () => {
      mockChrome.storage.sync.get.mockRejectedValueOnce(new Error('Storage error'));

      const settings = await getSettings();
      expect(settings).toEqual(DEFAULT_SETTINGS);
    });
  });

  describe('saveSettings', () => {
    it('saves partial settings merged with existing', async () => {
      await saveSettings({ autoRedirect: true });

      const result = await mockChrome.storage.sync.get('userSettings') as { userSettings: Partial<UserSettings> };
      expect(result.userSettings.autoRedirect).toBe(true);
      expect(result.userSettings.enabled).toBe(DEFAULT_SETTINGS.enabled);
    });

    it('updates only specified settings', async () => {
      await saveSettings({ enabled: true, autoRedirect: false });
      await saveSettings({ autoRedirect: true });

      const result = await mockChrome.storage.sync.get('userSettings') as { userSettings: Partial<UserSettings> };
      expect(result.userSettings.autoRedirect).toBe(true);
      expect(result.userSettings.enabled).toBe(true);
    });

    it('throws on storage error', async () => {
      mockChrome.storage.sync.set.mockRejectedValueOnce(new Error('Storage error'));

      await expect(saveSettings({ autoRedirect: true })).rejects.toThrow('Storage error');
    });
  });

  describe('resetSettings', () => {
    it('resets all settings to defaults', async () => {
      await saveSettings({ autoRedirect: true, redirectDelay: 5000 });
      await resetSettings();

      const settings = await getSettings();
      expect(settings).toEqual(DEFAULT_SETTINGS);
    });
  });

  describe('onSettingsChange', () => {
    it('calls callback when settings change', async () => {
      const callback = vi.fn();
      onSettingsChange(callback);

      // Simulate a storage change event
      await saveSettings({ autoRedirect: true });

      expect(callback).toHaveBeenCalled();
    });

    it('returns unsubscribe function', () => {
      const callback = vi.fn();
      const unsubscribe = onSettingsChange(callback);

      expect(typeof unsubscribe).toBe('function');
      unsubscribe();

      expect(mockChrome.storage.onChanged.removeListener).toHaveBeenCalled();
    });
  });

  describe('toggleSetting', () => {
    it('toggles autoRedirect from false to true', async () => {
      const newValue = await toggleSetting('autoRedirect');
      expect(newValue).toBe(true);

      const settings = await getSettings();
      expect(settings.autoRedirect).toBe(true);
    });

    it('toggles autoRedirect from true to false', async () => {
      await saveSettings({ autoRedirect: true });

      const newValue = await toggleSetting('autoRedirect');
      expect(newValue).toBe(false);
    });

    it('toggles enabled setting', async () => {
      await saveSettings({ enabled: true });

      const newValue = await toggleSetting('enabled');
      expect(newValue).toBe(false);
    });
  });

  describe('addLanguage', () => {
    it('adds a new language to enabled list', async () => {
      await saveSettings({ enabledLanguages: ['en'] });
      await addLanguage('de');

      const settings = await getSettings();
      expect(settings.enabledLanguages).toContain('en');
      expect(settings.enabledLanguages).toContain('de');
    });

    it('does not duplicate existing language', async () => {
      await saveSettings({ enabledLanguages: ['en', 'de'] });
      await addLanguage('en');

      const settings = await getSettings();
      expect(settings.enabledLanguages.filter(l => l === 'en').length).toBe(1);
    });
  });

  describe('removeLanguage', () => {
    it('removes a language from enabled list', async () => {
      await saveSettings({ enabledLanguages: ['en', 'de', 'fr'] });
      await removeLanguage('de');

      const settings = await getSettings();
      expect(settings.enabledLanguages).toContain('en');
      expect(settings.enabledLanguages).toContain('fr');
      expect(settings.enabledLanguages).not.toContain('de');
    });

    it('does nothing if language not in list', async () => {
      await saveSettings({ enabledLanguages: ['en', 'de'] });
      await removeLanguage('fr');

      const settings = await getSettings();
      expect(settings.enabledLanguages).toEqual(['en', 'de']);
    });
  });

  describe('enableAllLanguages', () => {
    it('clears the enabled languages list (empty = all enabled)', async () => {
      await saveSettings({ enabledLanguages: ['en', 'de'] });
      await enableAllLanguages();

      const settings = await getSettings();
      expect(settings.enabledLanguages).toEqual([]);
    });
  });
});
