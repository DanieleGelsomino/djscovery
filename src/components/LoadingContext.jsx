import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import Spinner from './Spinner';
import { setLoadingHandlers } from '../loading';

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
`;

const LoadingContext = createContext({ startLoading: () => {}, stopLoading: () => {} });

export const LoadingProvider = ({ children }) => {
  const [count, setCount] = useState(0);

  const startLoading = useCallback(() => setCount(c => c + 1), []);
  const stopLoading = useCallback(() => setCount(c => Math.max(0, c - 1)), []);

  useEffect(() => {
    setLoadingHandlers(startLoading, stopLoading);
  }, [startLoading, stopLoading]);

  return (
    <LoadingContext.Provider value={{ startLoading, stopLoading }}>
      {children}
      {count > 0 && (
        <Overlay data-testid="loading-overlay">
          <Spinner />
        </Overlay>
      )}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => useContext(LoadingContext);
