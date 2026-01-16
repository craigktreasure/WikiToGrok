/**
 * Background Service Worker for WikiToGrok Extension
 *
 * Handles:
 * - Dynamic redirect rules for auto-redirect mode
 * - Browser notifications when enabled
 * - Message passing with content scripts
 */

import { getSettings, saveSettings, onSettingsChange } from '../utils/storage';
import { UserSettings } from '../types/settings';

// Rule IDs for our dynamic redirect rules
const REDIRECT_RULE_ID = 1;
// IDs 2-20 reserved for exclusion rules
const EXCLUSION_RULE_START_ID = 2;

// Namespaces to exclude from redirect
const EXCLUDED_NAMESPACES = [
  'Special:',
  'Wikipedia:',
  'Talk:',
  'User:',
  'User_talk:',
  'File:',
  'File_talk:',
  'Template:',
  'Template_talk:',
  'Help:',
  'Help_talk:',
  'Category:',
  'Category_talk:',
  'Portal:',
  'Portal_talk:',
  'Draft:',
  'Draft_talk:',
  'Module:',
  'Module_talk:',
];

/**
 * Creates all redirect rules including exclusions
 * Uses "allow" rules with higher priority to prevent redirect on special namespaces
 */
function createRedirectRules(): chrome.declarativeNetRequest.Rule[] {
  const rules: chrome.declarativeNetRequest.Rule[] = [];

  // Main redirect rule (lower priority)
  rules.push({
    id: REDIRECT_RULE_ID,
    priority: 1,
    action: {
      type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
      redirect: {
        regexSubstitution: 'https://grokipedia.com/page/\\1',
      },
    },
    condition: {
      // Match Wikipedia article URLs
      // Captures the article name in group 1
      regexFilter: '^https://[a-z]{2,3}\\.wikipedia\\.org/wiki/([^?#]+)$',
      resourceTypes: [chrome.declarativeNetRequest.ResourceType.MAIN_FRAME],
    },
  });

  // Exclusion rules for special namespaces (higher priority - blocks redirect)
  EXCLUDED_NAMESPACES.forEach((namespace, index) => {
    rules.push({
      id: EXCLUSION_RULE_START_ID + index,
      priority: 2, // Higher priority than redirect rule
      action: {
        type: chrome.declarativeNetRequest.RuleActionType.ALLOW,
      },
      condition: {
        urlFilter: `*://*.wikipedia.org/wiki/${namespace}*`,
        resourceTypes: [chrome.declarativeNetRequest.ResourceType.MAIN_FRAME],
      },
    });
  });

  return rules;
}

/**
 * Gets all rule IDs we manage
 */
function getAllRuleIds(): number[] {
  const ids = [REDIRECT_RULE_ID];
  for (let i = 0; i < EXCLUDED_NAMESPACES.length; i++) {
    ids.push(EXCLUSION_RULE_START_ID + i);
  }
  return ids;
}

/**
 * Updates the redirect rules based on current settings
 */
async function updateRedirectRules(settings: UserSettings): Promise<void> {
  try {
    const allRuleIds = getAllRuleIds();

    if (settings.enabled && settings.autoRedirect) {
      // Add all redirect rules
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: allRuleIds,
        addRules: createRedirectRules(),
      });
      console.log('WikiToGrok: Auto-redirect enabled');
    } else {
      // Remove all redirect rules
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: allRuleIds,
      });
      console.log('WikiToGrok: Auto-redirect disabled');
    }
  } catch (error) {
    console.error('Failed to update redirect rules:', error);
  }
}

/**
 * Shows a browser notification
 */
async function showNotification(
  title: string,
  message: string,
  grokipediaUrl?: string
): Promise<void> {
  const notificationId = `wikitogrok-${Date.now()}`;

  await chrome.notifications.create(notificationId, {
    type: 'basic',
    iconUrl: chrome.runtime.getURL('icons/icon128.png'),
    title,
    message,
    buttons: grokipediaUrl
      ? [{ title: 'Open Grokipedia' }, { title: 'Dismiss' }]
      : undefined,
    requireInteraction: true,
  });

  // Store the URL for this notification
  if (grokipediaUrl) {
    await chrome.storage.local.set({
      [`notification-${notificationId}`]: grokipediaUrl,
    });
  }
}

/**
 * Handles notification button clicks
 */
chrome.notifications.onButtonClicked.addListener(async (notificationId, buttonIndex) => {
  if (buttonIndex === 0) {
    // "Open Grokipedia" button clicked
    const result = await chrome.storage.local.get(`notification-${notificationId}`);
    const url = result[`notification-${notificationId}`] as string | undefined;

    if (url) {
      await chrome.tabs.create({ url });
    }
  }

  // Clean up and close notification
  await chrome.storage.local.remove(`notification-${notificationId}`);
  chrome.notifications.clear(notificationId);
});

/**
 * Handles notification clicks (not button clicks)
 */
chrome.notifications.onClicked.addListener(async (notificationId) => {
  const result = await chrome.storage.local.get(`notification-${notificationId}`);
  const url = result[`notification-${notificationId}`] as string | undefined;

  if (url) {
    await chrome.tabs.create({ url });
  }

  await chrome.storage.local.remove(`notification-${notificationId}`);
  chrome.notifications.clear(notificationId);
});

/**
 * Handles messages from content scripts
 */
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  handleMessage(message).then(sendResponse);
  return true; // Indicates we'll respond asynchronously
});

/**
 * Processes incoming messages
 */
async function handleMessage(message: { type: string; [key: string]: unknown }): Promise<unknown> {
  switch (message.type) {
    case 'GET_SETTINGS': {
      const settings = await getSettings();
      return { success: true, settings };
    }

    case 'UPDATE_SETTINGS': {
      const partialSettings = message.settings as Partial<UserSettings>;
      await saveSettings(partialSettings);
      return { success: true };
    }

    case 'SHOW_NOTIFICATION': {
      await showNotification(
        message.title as string,
        message.message as string,
        message.url as string | undefined
      );
      return { success: true };
    }

    case 'REDIRECT_TAB': {
      const tabId = message.tabId as number;
      const url = message.url as string;
      await chrome.tabs.update(tabId, { url });
      return { success: true };
    }

    default:
      return { success: false, error: 'Unknown message type' };
  }
}

/**
 * Initialize the service worker
 */
async function initialize(): Promise<void> {
  console.log('WikiToGrok: Service worker initializing');

  // Load initial settings and update rules
  const settings = await getSettings();
  await updateRedirectRules(settings);

  // Listen for settings changes
  onSettingsChange(async (newSettings) => {
    await updateRedirectRules(newSettings);
  });

  console.log('WikiToGrok: Service worker initialized');
}

// Initialize when the service worker starts
initialize();

// Handle extension installation/update
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    console.log('WikiToGrok: Extension installed');
    // Open options page on first install
    chrome.runtime.openOptionsPage();
  } else if (details.reason === 'update') {
    console.log('WikiToGrok: Extension updated to version', chrome.runtime.getManifest().version);
  }
});
