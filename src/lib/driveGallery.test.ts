import { describe, it, expect } from 'vitest';
import { driveCdnSrc, driveApiSrc } from './driveGallery';

describe('driveGallery utilities', () => {
  it('generates CDN src with default width', () => {
    expect(driveCdnSrc('abc')).toBe('https://lh3.googleusercontent.com/d/abc=w1600');
  });

  it('generates CDN src with custom width', () => {
    expect(driveCdnSrc('xyz', 640)).toBe('https://lh3.googleusercontent.com/d/xyz=w640');
  });

  it('generates API src encoding the key', () => {
    expect(driveApiSrc('abc', 'my key')).toBe('https://www.googleapis.com/drive/v3/files/abc?alt=media&key=my%20key');
  });
});
