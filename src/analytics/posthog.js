// Server-side PostHog analytics (posthog-node).
// Only active when POSTHOG_PUBLIC_KEY is set — falls back to no-ops so local
// development is unaffected.

let _client = null;

function getClient() {
  if (_client) return _client;
  const key = process.env.POSTHOG_PUBLIC_KEY;
  if (!key) return null;
  const { PostHog } = require('posthog-node');
  _client = new PostHog(key, {
    host: process.env.POSTHOG_HOST || 'https://eu.i.posthog.com',
    flushAt: 20,
    flushInterval: 10000 // ms
  });
  return _client;
}

/**
 * Track a server-side event.
 *
 * @param {string|number} distinctId  The user's DB id (same as frontend identify())
 * @param {string} event              Event name, e.g. 'user_signed_up'
 * @param {object} [properties]       Extra properties to attach
 */
function track(distinctId, event, properties = {}) {
  const ph = getClient();
  if (!ph) return;
  ph.capture({ distinctId: String(distinctId), event, properties });
}

module.exports = { track };
