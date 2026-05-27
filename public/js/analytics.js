// Analytics — thin wrapper over PostHog CDN (window.posthog)
// All calls are silent no-ops when PostHog is not initialised (e.g. local dev).

const ph = () => window.posthog;

/**
 * Identify the current user. Call once after sign-in or session restore.
 * @param {string|number} userId
 * @param {object} properties  e.g. { email, name, plan }
 */
export function identify(userId, properties = {}) {
  const posthog = ph();
  if (typeof posthog?.identify === 'function') {
    posthog.identify(String(userId), properties);
  }
}

/**
 * Track an event.
 * @param {string} event
 * @param {object} [properties]
 */
export function track(event, properties = {}) {
  const posthog = ph();
  if (typeof posthog?.capture === 'function') {
    posthog.capture(event, properties);
  }
}

/**
 * Reset the current user identity (call on sign-out so the next user gets a
 * fresh anonymous ID and events are not attributed to the previous user).
 */
export function reset() {
  ph()?.reset();
}
