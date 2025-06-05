import { createGlobalStyle } from 'styled-components';

export const theme = {
  colors: {
    black: '#000000',
    red: '#851012',
    yellow: '#fdeb8b',
    green: '#016221',
    white: '#ffffff',
  },
};

export const GlobalStyles = createGlobalStyle`
  :root {
    --black: ${theme.colors.black};
    --red: ${theme.colors.red};
    --yellow: ${theme.colors.yellow};
    --green: ${theme.colors.green};
    --white: ${theme.colors.white};
  }

  *, *::before, *::after {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: Arial, Helvetica, sans-serif;
    background-color: var(--black);
    color: var(--white);
    line-height: 1.6;
  }

  img {
    max-width: 100%;
    display: block;
  }

  button {
    cursor: pointer;
    font: inherit;
  }

  .container {
    width: 90%;
    max-width: 1200px;
    margin: 0 auto;
  }
`;
