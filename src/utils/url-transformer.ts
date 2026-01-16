/**
 * URL Transformer utility for converting Wikipedia URLs to Grokipedia URLs
 *
 * Wikipedia URL format: https://[lang].wikipedia.org/wiki/[Article_Name]
 * Grokipedia URL format: https://grokipedia.com/page/[Article_Name]
 */

/**
 * Wikipedia namespaces that should NOT be redirected
 * These are special pages, not actual articles
 */
const EXCLUDED_NAMESPACES = [
  'Special:',
  'Wikipedia:',
  'Talk:',
  'User:',
  'User_talk:',
  'File:',
  'File_talk:',
  'MediaWiki:',
  'MediaWiki_talk:',
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
  'TimedText:',
  'Module:',
  'Module_talk:',
  'Gadget:',
  'Gadget_talk:',
  'Gadget_definition:',
  'Gadget_definition_talk:',
];

/**
 * Base URL for Grokipedia
 */
const GROKIPEDIA_BASE_URL = 'https://grokipedia.com';

/**
 * Result of URL transformation
 */
export interface TransformResult {
  /** Whether the transformation was successful */
  success: boolean;
  /** The transformed Grokipedia URL (if successful) */
  grokipediaUrl?: string;
  /** The article name extracted from the URL */
  articleName?: string;
  /** The Wikipedia language code */
  language?: string;
  /** Error message if transformation failed */
  error?: string;
}

/**
 * Checks if a URL is a Wikipedia article page (not a special namespace)
 *
 * @param url - The URL to check
 * @returns true if the URL is an article page, false otherwise
 *
 * @example
 * isArticlePage('https://en.wikipedia.org/wiki/Albert_Einstein') // true
 * isArticlePage('https://en.wikipedia.org/wiki/Special:Search') // false
 * isArticlePage('https://en.wikipedia.org/wiki/Talk:Albert_Einstein') // false
 */
export function isArticlePage(url: string): boolean {
  try {
    const urlObj = new URL(url);

    // Check if it's a Wikipedia domain
    if (!urlObj.hostname.endsWith('.wikipedia.org')) {
      return false;
    }

    // Check if it's a /wiki/ path
    if (!urlObj.pathname.startsWith('/wiki/')) {
      return false;
    }

    // Extract the article path
    const articlePath = urlObj.pathname.replace('/wiki/', '');

    // Check if it's a special namespace
    for (const namespace of EXCLUDED_NAMESPACES) {
      if (articlePath.startsWith(namespace)) {
        return false;
      }
    }

    // Empty article path is the main page, which we should allow
    if (articlePath === '' || articlePath === 'Main_Page') {
      return true;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Extracts the language code from a Wikipedia URL
 *
 * @param url - The Wikipedia URL
 * @returns The language code (e.g., 'en', 'de', 'fr') or null if not found
 *
 * @example
 * extractLanguage('https://en.wikipedia.org/wiki/Article') // 'en'
 * extractLanguage('https://de.wikipedia.org/wiki/Artikel') // 'de'
 */
export function extractLanguage(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;

    // Match pattern: [lang].wikipedia.org
    const match = hostname.match(/^([a-z]{2,3})\.wikipedia\.org$/);
    if (match) {
      return match[1];
    }

    // Handle special cases like simple.wikipedia.org
    const simpleMatch = hostname.match(/^(simple)\.wikipedia\.org$/);
    if (simpleMatch) {
      return 'simple';
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Extracts the article name from a Wikipedia URL
 *
 * @param url - The Wikipedia URL
 * @returns The article name or null if not found
 *
 * @example
 * extractArticleName('https://en.wikipedia.org/wiki/Albert_Einstein') // 'Albert_Einstein'
 */
export function extractArticleName(url: string): string | null {
  try {
    const urlObj = new URL(url);

    if (!urlObj.pathname.startsWith('/wiki/')) {
      return null;
    }

    const articlePath = urlObj.pathname.replace('/wiki/', '');

    // Return the raw article path (keep URL encoding as-is)
    return articlePath || null;
  } catch {
    return null;
  }
}

/**
 * Transforms a Wikipedia URL to a Grokipedia URL
 *
 * @param wikipediaUrl - The Wikipedia URL to transform
 * @returns TransformResult with the Grokipedia URL or error
 *
 * @example
 * transformToGrokipedia('https://en.wikipedia.org/wiki/Matchbox_Twenty')
 * // { success: true, grokipediaUrl: 'https://grokipedia.com/page/Matchbox_Twenty', ... }
 */
export function transformToGrokipedia(wikipediaUrl: string): TransformResult {
  // Check if it's an article page
  if (!isArticlePage(wikipediaUrl)) {
    return {
      success: false,
      error: 'Not a Wikipedia article page',
    };
  }

  const language = extractLanguage(wikipediaUrl);
  if (!language) {
    return {
      success: false,
      error: 'Could not extract language from URL',
    };
  }

  const articleName = extractArticleName(wikipediaUrl);
  if (!articleName) {
    return {
      success: false,
      error: 'Could not extract article name from URL',
    };
  }

  // Build the Grokipedia URL
  const grokipediaUrl = `${GROKIPEDIA_BASE_URL}/page/${articleName}`;

  return {
    success: true,
    grokipediaUrl,
    articleName,
    language,
  };
}

/**
 * Decodes a Wikipedia article name for display
 *
 * @param articleName - The URL-encoded article name
 * @returns The decoded, human-readable article name
 *
 * @example
 * decodeArticleName('Albert_Einstein') // 'Albert Einstein'
 * decodeArticleName('S%C3%A1mi_people') // 'Sámi people'
 */
export function decodeArticleName(articleName: string): string {
  try {
    // First decode URL encoding, then replace underscores with spaces
    return decodeURIComponent(articleName).replace(/_/g, ' ');
  } catch {
    // If decoding fails, just replace underscores
    return articleName.replace(/_/g, ' ');
  }
}

/**
 * Checks if a Wikipedia language is in the enabled list
 *
 * @param language - The language code to check
 * @param enabledLanguages - List of enabled language codes
 * @returns true if the language is enabled
 */
export function isLanguageEnabled(language: string, enabledLanguages: string[]): boolean {
  // If the list is empty, all languages are enabled
  if (enabledLanguages.length === 0) {
    return true;
  }
  return enabledLanguages.includes(language);
}
