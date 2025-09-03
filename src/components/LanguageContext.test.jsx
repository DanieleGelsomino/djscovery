import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { LanguageProvider, useLanguage } from './LanguageContext';

describe('LanguageContext', () => {
  const wrapper = ({ children }) => <LanguageProvider>{children}</LanguageProvider>;

  it('translates keys based on current language', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });

    expect(result.current.t('gallery.empty')).toBe('Nessuna immagine disponibile.');

    act(() => result.current.setLang('en'));
    expect(result.current.t('gallery.empty')).toBe('No images available.');
  });

  it('falls back to key when translation is missing', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    expect(result.current.t('missing.key')).toBe('missing.key');
  });
});
