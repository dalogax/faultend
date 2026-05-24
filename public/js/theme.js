// Theme manager — persists choice in localStorage, falls back to system preference.

import { Icon } from './icons.js';

const KEY = 'faultend.theme';

export function getStoredTheme() {
  try { return localStorage.getItem(KEY); } catch (_) { return null; }
}

export function getEffectiveTheme() {
  const stored = getStoredTheme();
  if (stored === 'dark' || stored === 'light') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const btn = document.getElementById('themeToggleBtn');
  if (btn) btn.innerHTML = theme === 'dark' ? Icon.sun : Icon.moon;
}

export function setTheme(theme) {
  try { localStorage.setItem(KEY, theme); } catch (_) {}
  applyTheme(theme);
}

export function initTheme() {
  applyTheme(getEffectiveTheme());
  const btn = document.getElementById('themeToggleBtn');
  if (btn) {
    btn.style.display = 'inline-flex';
    btn.addEventListener('click', () => {
      const next = (document.documentElement.getAttribute('data-theme') === 'dark') ? 'light' : 'dark';
      setTheme(next);
    });
  }
  // React to OS-level changes only when the user hasn't picked manually.
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', (e) => {
    if (!getStoredTheme()) applyTheme(e.matches ? 'dark' : 'light');
  });
}
