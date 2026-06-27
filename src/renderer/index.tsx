import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// Inter (OFL) — bundled, self-hosted font used by the Dark & Light themes.
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import './styles.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

// Apply the last-used theme before first paint so the loading screen and
// pre-project screens render in the correct theme. Defaults to light.
const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);