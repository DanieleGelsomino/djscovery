import React from 'react';
import { describe, it, expect } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ToastProvider, useToast } from './ToastContext';

expect.extend(matchers);

const TestComponent = () => {
  const { showToast } = useToast();
  return <button onClick={() => showToast('Hello!', 'error')}>Trigger</button>;
};

describe('ToastContext', () => {
  it('renders toast message when showToast is called', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    act(() => {
      fireEvent.click(screen.getByRole('button'));
    });

    expect(screen.getByText('Hello!')).toBeInTheDocument();
  });
});
