import { fetchMe, logout } from './api.js';
import { identify, track, reset } from './analytics.js';

class AuthManager {
  constructor() {
    this.user = null;
    this.loading = true;
    this.listeners = [];
  }

  async init() {
    try {
      this.user = await fetchMe();

      if (this.user) {
        // Identify the user in PostHog on every session restore so person
        // properties stay current. PostHog deduplicates by distinct_id.
        identify(this.user.id, {
          email: this.user.email,
          name: this.user.name
        });

        // signedIn is set once by the server after a fresh OAuth callback;
        // the server clears it after this first /me response.
        if (this.user.signedIn) {
          track('user_signed_in', { provider: this.user.signedIn });
        }
      }
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
    reset(); // disassociate PostHog identity before the session is destroyed
    try {
      await logout();
    } catch (e) {
      console.error('Logout error:', e);
    }
    this.user = null;
    window.location.reload();
  }

  getLoginUrl(provider = 'google') {
    const redirectTo = encodeURIComponent(window.location.pathname + window.location.hash);
    return `/api/auth/${provider}?redirectTo=${redirectTo}`;
  }

  onChange(callback) {
    this.listeners.push(callback);
  }

  notify() {
    this.listeners.forEach(cb => cb(this.user));
  }
}

export const authManager = new AuthManager();
