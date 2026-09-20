import { describe, expect, it } from 'vitest';
import { parseMobileDirectorySection } from './directory-navigation.js';

describe('directory navigation', () => {
  it('accepts only the three discover section hash routes', () => {
    expect(parseMobileDirectorySection('#discover/news')).toBe('news');
    expect(parseMobileDirectorySection('#discover/sources')).toBe('sources');
    expect(parseMobileDirectorySection('#discover/sport')).toBe('sport');
    expect(parseMobileDirectorySection('#knowledge')).toBeNull();
    expect(parseMobileDirectorySection('news')).toBeNull();
    expect(parseMobileDirectorySection('#discover/news?filter=en')).toBeNull();
    expect(parseMobileDirectorySection('#discover/news/more')).toBeNull();
  });
});
