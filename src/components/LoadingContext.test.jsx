import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { LoadingProvider, useLoading } from './LoadingContext';

const wrapper = ({ children }) => <LoadingProvider>{children}</LoadingProvider>;

describe('LoadingContext', () => {
  it('toggles overlay visibility', () => {
    const { result } = renderHook(() => useLoading(), { wrapper });

    expect(document.querySelector('[data-testid="loading-overlay"]')).toBeNull();

    act(() => result.current.startLoading());
    expect(document.querySelector('[data-testid="loading-overlay"]')).not.toBeNull();

    act(() => result.current.stopLoading());
    expect(document.querySelector('[data-testid="loading-overlay"]')).toBeNull();
  });
});
