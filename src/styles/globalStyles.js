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

  html { scroll-behavior: smooth; }

  *, *::before, *::after {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-size: 17px;
    font-family: 'Inter', 'Poppins', Arial, Helvetica, sans-serif;
    background: linear-gradient(135deg, #000, #111);
    color: var(--white);
    line-height: 1.6;
  }

  section {
    padding: 2rem 0;
  }

  button {
    border-radius: 4px;
  }

  img {
    max-width: 100%;
    display: block;
  }

  button,
  input,
  textarea {
    cursor: pointer;
    font: inherit;
    transition: background-color 0.3s, transform 0.2s;
  }

  .container {
    width: 90%;
    max-width: 1200px;
    margin: 0 auto;
  }

  h1, h2, h3 {
    color: var(--yellow);
    margin-bottom: 0.5rem;
    font-family: 'Poppins', 'Inter', sans-serif;
    line-height: 1.2;
  }

  p {
    margin-bottom: 1rem;
  }

  a {
    text-decoration: none;
    color: inherit;
  }
`;
