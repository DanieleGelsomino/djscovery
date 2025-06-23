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
  breakpoints: {
    mobile: '480px',
    tablet: '768px',
    desktop: '1200px',
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
    font-size: 16px;
    font-family: 'Inter', 'Poppins', Arial, Helvetica, sans-serif;
    background: linear-gradient(135deg, #000, #111);
    color: var(--white);
    line-height: 1.6;
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }

  @media (min-width: ${theme.breakpoints.tablet}) {
    body {
      font-size: 18px;
    }
  }

  #root {
    display: flex;
    flex-direction: column;
    flex: 1;
  }

  section {
    padding: 2rem 0;
  }

  button {
    border-radius: 8px;
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
    max-width: ${theme.breakpoints.desktop};
    margin: 0 auto;
  }

  @media (min-width: ${theme.breakpoints.tablet}) {
    .container {
      width: 80%;
    }
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
