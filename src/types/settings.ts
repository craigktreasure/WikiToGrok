/**
 * User settings for the WikiToGrok extension
 */
export interface UserSettings {
  /** Whether to automatically redirect Wikipedia pages to Grokipedia */
  autoRedirect: boolean;

  /** Whether to show browser notifications instead of in-page banner */
  useNotifications: boolean;

  /** Delay in milliseconds before auto-redirect (0-5000) */
  redirectDelay: number;

  /** List of Wikipedia language codes to enable (e.g., ['en', 'de', 'fr']) */
  enabledLanguages: string[];

  /** Whether the extension is enabled */
  enabled: boolean;
}

/**
 * Default settings for new users
 */
export const DEFAULT_SETTINGS: UserSettings = {
  autoRedirect: false,
  useNotifications: false,
  redirectDelay: 0,
  enabledLanguages: ['en'],
  enabled: true,
};

/**
 * All supported Wikipedia languages
 * This is a subset of the most common languages
 */
export const SUPPORTED_LANGUAGES: { code: string; name: string }[] = [
  { code: 'en', name: 'English' },
  { code: 'de', name: 'German' },
  { code: 'fr', name: 'French' },
  { code: 'es', name: 'Spanish' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ko', name: 'Korean' },
  { code: 'ar', name: 'Arabic' },
  { code: 'nl', name: 'Dutch' },
  { code: 'pl', name: 'Polish' },
  { code: 'sv', name: 'Swedish' },
  { code: 'uk', name: 'Ukrainian' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'he', name: 'Hebrew' },
  { code: 'id', name: 'Indonesian' },
  { code: 'tr', name: 'Turkish' },
  { code: 'cs', name: 'Czech' },
];

/**
 * Storage key for user settings
 */
export const STORAGE_KEY = 'userSettings';

/**
 * Message types for communication between content script and service worker
 */
export type MessageType =
  | { type: 'GET_SETTINGS' }
  | { type: 'UPDATE_SETTINGS'; settings: Partial<UserSettings> }
  | { type: 'REDIRECT_TO_GROKIPEDIA'; url: string }
  | { type: 'SHOW_NOTIFICATION'; title: string; message: string };

/**
 * Response types from service worker
 */
export type MessageResponse =
  | { success: true; settings?: UserSettings }
  | { success: false; error: string };
