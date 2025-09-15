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

    /* Layout + elevation */
    --radius: 14px;
    --radius-sm: 10px;
    --radius-lg: 22px;
    --shadow-soft: 0 6px 30px rgba(0,0,0,0.25);
    --shadow-focus: 0 0 0 3px rgba(255, 209, 102, 0.35);
    --transition-fast: 160ms ease;
    --transition-med: 260ms ease;
  }

  html { scroll-behavior: smooth; }

  *, *::before, *::after {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-size: 18px;
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'Inter', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    font-feature-settings: 'kern' 1, 'liga' 1, 'calt' 1;
    background:
      radial-gradient(1200px 600px at 20% -10%, rgba(255, 209, 102, 0.06), transparent 60%),
      radial-gradient(800px 500px at 120% 20%, rgba(33, 191, 115, 0.06), transparent 60%),
      linear-gradient(180deg, #0a0a0a, #111);
    color: var(--white);
    line-height: 1.6;
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }

  #root {
    display: flex;
    flex-direction: column;
    flex: 1;
  }

  section { padding: 3rem 0; }

  button {
    border-radius: var(--radius) !important;
    border: none;
    font-weight: 600;
    padding: 0.65rem 1.1rem;
    letter-spacing: 0.2px;
    transition: transform var(--transition-fast), box-shadow var(--transition-med), background var(--transition-med), color var(--transition-med);
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
    border-radius: var(--radius) !important;
    transition: background-color var(--transition-med), color var(--transition-med), transform var(--transition-fast), box-shadow var(--transition-med);
  }

  /* Accessible focus: apply our custom ring only to non-MUI controls */
  :focus-visible { outline: none; }
  button:not(.MuiButton-root):focus-visible,
  a:focus-visible,
  input:not(.MuiInputBase-input):focus-visible,
  textarea:focus-visible {
    box-shadow: var(--shadow-focus);
    border-radius: var(--radius);
  }

  /* Avoid double focus on MUI inputs/buttons inside Admin panel */
  .MuiInputBase-root:focus-within,
  .MuiTextField-root:focus-within,
  .MuiButton-root:focus-visible {
    box-shadow: none !important;
    outline: none !important;
  }
  .admin-panel *:focus-visible { box-shadow: none !important; }
  .admin-panel .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline { box-shadow: none !important; }
  /* Admin create-event: input padding applied per-field via sx in AdminPanel.jsx */

  .container {
    width: 90%;
    max-width: 1200px;
    margin: 0 auto;
  }

  h1, h2, h3 {
    color: var(--yellow);
    margin-bottom: 0.5rem;
    font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Inter', 'Poppins', sans-serif;
    line-height: 1.15;
    letter-spacing: -0.02em;
  }

  h1 { font-weight: 800; }
  h2 { font-weight: 700; }
  h3 { font-weight: 650; }

  p {
    margin-bottom: 1rem;
  }

  a {
    text-decoration: none;
    color: inherit;
    transition: color var(--transition-med), opacity var(--transition-med);

    &:hover {
      color: var(--yellow);
      opacity: 0.95;
    }
  }

  .glass {
    background-color: rgba(255, 255, 255, 0.06);
    backdrop-filter: saturate(180%) blur(20px);
    -webkit-backdrop-filter: saturate(180%) blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-soft);
  }

  input:-internal-autofill-selected {
    appearance: menulist-button;
    background-image: none !important;
    background-color: rgba(255, 255, 255, 0.1) !important;
    color: fieldtext !important;
  }

  .css-1vskvj5-MuiPaper-root{
      padding: 10px !important;
  }

  ::selection { background: rgba(255, 209, 102, 0.25); color: var(--white); }

  /* Motion safety */
  @media (prefers-reduced-motion: reduce) {
    * {
      animation: none !important;
      transition: none !important;
      scroll-behavior: auto !important;
    }
  }
`;
