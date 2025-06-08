import { createGlobalStyle } from 'styled-components';

export const theme = {
  // Main palette used across the app
  colors: {
    black: '#111111',
    red: '#d7263d',
    yellow: '#ffd166',
    green: '#21bf73',
    white: '#ffffff',
    gray: '#222222',
  },
};

export const GlobalStyles = createGlobalStyle`
  :root {
    --black: ${theme.colors.black};
    --red: ${theme.colors.red};
    --yellow: ${theme.colors.yellow};
    --green: ${theme.colors.green};
    --white: ${theme.colors.white};
    --gray: ${theme.colors.gray};
  }

  html { scroll-behavior: smooth; }

  *, *::before, *::after {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-size: 18px;
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
    border: none;
    font-weight: 600;
    padding: 0.5rem 1rem;
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
    &:focus {
      outline: none;
    }
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
    transition: color 0.3s;

    &:hover {
      color: var(--yellow);
    }
  }
`;
