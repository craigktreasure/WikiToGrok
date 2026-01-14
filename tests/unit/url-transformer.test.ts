/**
 * Unit tests for URL Transformer utility
 */

import { describe, it, expect } from 'vitest';
import {
  isArticlePage,
  extractLanguage,
  extractArticleName,
  transformToGrokipedia,
  decodeArticleName,
  isLanguageEnabled,
} from '../../src/utils/url-transformer';

describe('URL Transformer', () => {
  describe('isArticlePage', () => {
    it('returns true for valid English Wikipedia article URLs', () => {
      expect(isArticlePage('https://en.wikipedia.org/wiki/Albert_Einstein')).toBe(true);
      expect(isArticlePage('https://en.wikipedia.org/wiki/Matchbox_Twenty')).toBe(true);
      expect(isArticlePage('https://en.wikipedia.org/wiki/JavaScript')).toBe(true);
    });

    it('returns true for non-English Wikipedia article URLs', () => {
      expect(isArticlePage('https://de.wikipedia.org/wiki/Berlin')).toBe(true);
      expect(isArticlePage('https://fr.wikipedia.org/wiki/Paris')).toBe(true);
      expect(isArticlePage('https://ja.wikipedia.org/wiki/東京')).toBe(true);
    });

    it('returns true for Main_Page', () => {
      expect(isArticlePage('https://en.wikipedia.org/wiki/Main_Page')).toBe(true);
    });

    it('returns false for Special: namespace', () => {
      expect(isArticlePage('https://en.wikipedia.org/wiki/Special:Search')).toBe(false);
      expect(isArticlePage('https://en.wikipedia.org/wiki/Special:Random')).toBe(false);
    });

    it('returns false for Wikipedia: namespace', () => {
      expect(isArticlePage('https://en.wikipedia.org/wiki/Wikipedia:About')).toBe(false);
      expect(isArticlePage('https://en.wikipedia.org/wiki/Wikipedia:Contents')).toBe(false);
    });

    it('returns false for Talk: namespace', () => {
      expect(isArticlePage('https://en.wikipedia.org/wiki/Talk:Albert_Einstein')).toBe(false);
    });

    it('returns false for User: namespace', () => {
      expect(isArticlePage('https://en.wikipedia.org/wiki/User:Example')).toBe(false);
      expect(isArticlePage('https://en.wikipedia.org/wiki/User_talk:Example')).toBe(false);
    });

    it('returns false for File: namespace', () => {
      expect(isArticlePage('https://en.wikipedia.org/wiki/File:Example.jpg')).toBe(false);
    });

    it('returns false for Template: namespace', () => {
      expect(isArticlePage('https://en.wikipedia.org/wiki/Template:Infobox')).toBe(false);
    });

    it('returns false for Help: namespace', () => {
      expect(isArticlePage('https://en.wikipedia.org/wiki/Help:Contents')).toBe(false);
    });

    it('returns false for Category: namespace', () => {
      expect(isArticlePage('https://en.wikipedia.org/wiki/Category:Science')).toBe(false);
    });

    it('returns false for Portal: namespace', () => {
      expect(isArticlePage('https://en.wikipedia.org/wiki/Portal:Science')).toBe(false);
    });

    it('returns false for Draft: namespace', () => {
      expect(isArticlePage('https://en.wikipedia.org/wiki/Draft:Article')).toBe(false);
    });

    it('returns false for Module: namespace', () => {
      expect(isArticlePage('https://en.wikipedia.org/wiki/Module:Example')).toBe(false);
    });

    it('returns false for non-Wikipedia URLs', () => {
      expect(isArticlePage('https://google.com/wiki/Article')).toBe(false);
      expect(isArticlePage('https://example.org/wiki/Article')).toBe(false);
    });

    it('returns false for non-wiki paths', () => {
      expect(isArticlePage('https://en.wikipedia.org/w/index.php')).toBe(false);
      expect(isArticlePage('https://en.wikipedia.org/about')).toBe(false);
    });

    it('returns false for invalid URLs', () => {
      expect(isArticlePage('not a url')).toBe(false);
      expect(isArticlePage('')).toBe(false);
    });
  });

  describe('extractLanguage', () => {
    it('extracts English language code', () => {
      expect(extractLanguage('https://en.wikipedia.org/wiki/Article')).toBe('en');
    });

    it('extracts German language code', () => {
      expect(extractLanguage('https://de.wikipedia.org/wiki/Artikel')).toBe('de');
    });

    it('extracts Japanese language code', () => {
      expect(extractLanguage('https://ja.wikipedia.org/wiki/記事')).toBe('ja');
    });

    it('extracts three-letter language codes', () => {
      expect(extractLanguage('https://als.wikipedia.org/wiki/Article')).toBe('als');
    });

    it('handles simple.wikipedia.org', () => {
      expect(extractLanguage('https://simple.wikipedia.org/wiki/Article')).toBe('simple');
    });

    it('returns null for non-Wikipedia URLs', () => {
      expect(extractLanguage('https://google.com/wiki/Article')).toBe(null);
    });

    it('returns null for invalid URLs', () => {
      expect(extractLanguage('not a url')).toBe(null);
    });
  });

  describe('extractArticleName', () => {
    it('extracts simple article names', () => {
      expect(extractArticleName('https://en.wikipedia.org/wiki/JavaScript')).toBe('JavaScript');
    });

    it('extracts article names with underscores', () => {
      expect(extractArticleName('https://en.wikipedia.org/wiki/Albert_Einstein')).toBe('Albert_Einstein');
    });

    it('extracts article names with special characters', () => {
      expect(extractArticleName('https://en.wikipedia.org/wiki/C%2B%2B')).toBe('C%2B%2B');
    });

    it('extracts article names with Unicode', () => {
      expect(extractArticleName('https://en.wikipedia.org/wiki/S%C3%A1mi_people')).toBe('S%C3%A1mi_people');
    });

    it('returns null for non-wiki paths', () => {
      expect(extractArticleName('https://en.wikipedia.org/about')).toBe(null);
    });

    it('returns null for invalid URLs', () => {
      expect(extractArticleName('not a url')).toBe(null);
    });
  });

  describe('transformToGrokipedia', () => {
    it('transforms English Wikipedia URLs correctly', () => {
      const result = transformToGrokipedia('https://en.wikipedia.org/wiki/Matchbox_Twenty');
      expect(result.success).toBe(true);
      expect(result.grokipediaUrl).toBe('https://grokipedia.com/page/Matchbox_Twenty');
      expect(result.articleName).toBe('Matchbox_Twenty');
      expect(result.language).toBe('en');
    });

    it('transforms German Wikipedia URLs correctly', () => {
      const result = transformToGrokipedia('https://de.wikipedia.org/wiki/Berlin');
      expect(result.success).toBe(true);
      expect(result.grokipediaUrl).toBe('https://grokipedia.com/page/Berlin');
      expect(result.language).toBe('de');
    });

    it('preserves URL encoding in article names', () => {
      const result = transformToGrokipedia('https://en.wikipedia.org/wiki/S%C3%A1mi_people');
      expect(result.success).toBe(true);
      expect(result.grokipediaUrl).toBe('https://grokipedia.com/page/S%C3%A1mi_people');
    });

    it('returns error for non-article pages', () => {
      const result = transformToGrokipedia('https://en.wikipedia.org/wiki/Special:Search');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Not a Wikipedia article page');
    });

    it('returns error for non-Wikipedia URLs', () => {
      const result = transformToGrokipedia('https://google.com/wiki/Article');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Not a Wikipedia article page');
    });
  });

  describe('decodeArticleName', () => {
    it('replaces underscores with spaces', () => {
      expect(decodeArticleName('Albert_Einstein')).toBe('Albert Einstein');
    });

    it('decodes URL-encoded characters', () => {
      expect(decodeArticleName('S%C3%A1mi_people')).toBe('Sámi people');
    });

    it('handles C++', () => {
      expect(decodeArticleName('C%2B%2B')).toBe('C++');
    });

    it('handles already decoded names', () => {
      expect(decodeArticleName('JavaScript')).toBe('JavaScript');
    });

    it('handles invalid encoding gracefully', () => {
      expect(decodeArticleName('Invalid%ZZ')).toBe('Invalid%ZZ');
    });
  });

  describe('isLanguageEnabled', () => {
    it('returns true when language is in enabled list', () => {
      expect(isLanguageEnabled('en', ['en', 'de', 'fr'])).toBe(true);
      expect(isLanguageEnabled('de', ['en', 'de', 'fr'])).toBe(true);
    });

    it('returns false when language is not in enabled list', () => {
      expect(isLanguageEnabled('ja', ['en', 'de', 'fr'])).toBe(false);
    });

    it('returns true for any language when list is empty (all enabled)', () => {
      expect(isLanguageEnabled('en', [])).toBe(true);
      expect(isLanguageEnabled('ja', [])).toBe(true);
      expect(isLanguageEnabled('zh', [])).toBe(true);
    });
  });
});
