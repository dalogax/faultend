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
        // Identify the user in PostHog only when the user has consented to
        // analytics. Sends email/name only with consent; falls back to
        // anonymous identify (ID only) when PostHog has been loaded without
        // full profile properties being appropriate.
        if (localStorage.getItem('faultend.consent') === 'accepted') {
          identify(this.user.id, {
            email: this.user.email,
            name: this.user.name
          });
        } else {
          // Pseudonymous: track by internal ID only, no PII
          identify(this.user.id, {});
        }

        // signedIn is set once by the server after a fresh OAuth callback;
        // the server clears it after this first /me response.
        if (this.user.signedIn) {
          track('user_signed_in', { provider: this.user.signedIn });
          // Remember which provider this user uses so we can silently
          // re-authenticate them if their session expires or is invalidated.
          localStorage.setItem('lastAuthProvider', this.user.signedIn);
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
    // Clear the stored provider so an intentional logout doesn't
    // immediately auto-redirect the user back in on their next visit.
    localStorage.removeItem('lastAuthProvider');
    this.user = null;
    window.location.reload();
  }

  getLoginUrl(provider = 'google') {
    const redirectTo = encodeURIComponent(window.location.pathname + window.location.hash);
    return `/api/auth/${provider}?redirectTo=${redirectTo}`;
  }

  // If the user has logged in before and their session has expired/been
  // invalidated, silently redirect them through OAuth rather than showing
  // the login overlay. Returns true if a redirect was initiated.
  // Uses sessionStorage as a one-shot guard to prevent infinite loops
  // in case OAuth itself fails.
  tryAutoLogin() {
    const provider = localStorage.getItem('lastAuthProvider');
    if (!provider) return false; // first-time visitor, never logged in
    if (sessionStorage.getItem('autoAuthRedirect')) return false; // already tried this page load
    sessionStorage.setItem('autoAuthRedirect', '1');
    window.location.href = this.getLoginUrl(provider);
    return true;
  }

  onChange(callback) {
    this.listeners.push(callback);
  }

  notify() {
    this.listeners.forEach(cb => cb(this.user));
  }
}

export const authManager = new AuthManager();
