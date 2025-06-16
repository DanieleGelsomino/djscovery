import React from 'react';
import styled, { keyframes } from 'styled-components';

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const Disc = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 8px solid var(--yellow);
  border-top: 8px solid var(--red);
  animation: ${spin} 1s linear infinite;
  margin: 2rem auto;
`;

const Spinner = (props) => <Disc role="status" {...props} />;

export default Spinner;
