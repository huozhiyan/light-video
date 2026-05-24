import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Set initial theme before render to avoid flash
const savedTheme = localStorage.getItem('lightvideo-theme');
document.documentElement.setAttribute('data-theme', savedTheme === 'light' ? 'light' : 'dark');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
