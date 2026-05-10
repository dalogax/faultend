import { fetchMe, logout } from './api.js';

class AuthManager {
  constructor() {
    this.user = null;
    this.loading = true;
    this.listeners = [];
  }

  async init() {
    try {
      this.user = await fetchMe();
    } catch (e) {
      this.user = null;
    } finally {
      this.loading = false;
      this.notify();
    }
  }

  isLoggedIn() {
    return !!this.user;
  }

  getUser() {
    return this.user;
  }

  async signOut() {
    try {
      await logout();
    } catch (e) {
      console.error('Logout error:', e);
    }
    this.user = null;
    window.location.reload();
  }

  getLoginUrl() {
    const redirectTo = encodeURIComponent(window.location.pathname + window.location.hash);
    return `/api/auth/google?redirectTo=${redirectTo}`;
  }

  onChange(callback) {
    this.listeners.push(callback);
  }

  notify() {
    this.listeners.forEach(cb => cb(this.user));
  }
}

export const authManager = new AuthManager();
