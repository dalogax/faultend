/**
 * consent.js — Cookie consent management
 *
 * - Shows a minimal bottom banner on first visit.
 * - Stores choice in localStorage under 'faultend.consent' ('accepted' | 'rejected').
 * - Initialises PostHog only when accepted.
 * - Exposes window.__faultendConsent.reset() so the Privacy Policy page can
 *   let users change their preference.
 */

const CONSENT_KEY = 'faultend.consent';
const POSTHOG_KEY = 'phc_yxKnUW7WucN8gVbySJRwEWwtSdemj7DfhET59KtDeRUZ';
const POSTHOG_HOST = 'https://eu.i.posthog.com';

// ── PostHog loader ────────────────────────────────────────────────────────────

function loadPostHog() {
  if (window.posthog?.__SV) return; // already loaded
  /* eslint-disable */
  !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.people.toString(20)+" (stub)"},o="init capture alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys onSessionId setPersonPropertiesForFlags".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
  /* eslint-enable */
  posthog.init(POSTHOG_KEY, { api_host: POSTHOG_HOST, defaults: '2026-01-30' });
}

// ── Banner ────────────────────────────────────────────────────────────────────

function buildBanner() {
  const el = document.createElement('div');
  el.id = 'consent-banner';
  el.style.cssText = [
    'position:fixed', 'bottom:0', 'left:0', 'right:0', 'z-index:9999',
    'display:flex', 'align-items:center', 'gap:16px',
    'padding:12px 24px',
    'background:#1c1c1a', 'border-top:1px solid #3a3936',
    'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif',
    'font-size:12px', 'color:#c4c2bd',
    'flex-wrap:wrap'
  ].join(';');

  el.innerHTML = `
    <span style="flex:1;min-width:200px">
      We use analytics cookies to improve Faultend.
      <a href="/privacy#6" style="color:#c4c2bd;text-decoration:underline;margin-left:4px">Learn more</a>
    </span>
    <button id="consent-reject" style="
      height:28px;padding:0 12px;background:transparent;color:#8a8884;
      border:1px solid #3a3936;cursor:pointer;font-size:12px;
      font-family:inherit;white-space:nowrap
    ">Reject</button>
    <button id="consent-accept" style="
      height:28px;padding:0 12px;background:#fafafa;color:#0a0a09;
      border:1px solid #fafafa;cursor:pointer;font-size:12px;
      font-family:inherit;font-weight:500;white-space:nowrap
    ">Accept analytics</button>
  `;

  el.querySelector('#consent-accept').addEventListener('click', () => accept());
  el.querySelector('#consent-reject').addEventListener('click', () => reject());
  return el;
}

function hideBanner() {
  const el = document.getElementById('consent-banner');
  if (el) el.remove();
}

// ── Public API ────────────────────────────────────────────────────────────────

function accept() {
  localStorage.setItem(CONSENT_KEY, 'accepted');
  hideBanner();
  loadPostHog();
}

function reject() {
  localStorage.setItem(CONSENT_KEY, 'rejected');
  hideBanner();
  // Opt-out of any already-loaded PostHog instance (belt-and-suspenders)
  if (window.posthog?.opt_out_capturing) posthog.opt_out_capturing();
}

function reset() {
  localStorage.removeItem(CONSENT_KEY);
  if (!document.getElementById('consent-banner')) {
    document.body.appendChild(buildBanner());
  }
}

// ── Init (runs once on load) ──────────────────────────────────────────────────

function init() {
  const stored = localStorage.getItem(CONSENT_KEY);

  if (stored === 'accepted') {
    loadPostHog();
    return;
  }

  if (stored === 'rejected') {
    return; // respect previous rejection
  }

  // No decision yet — show banner after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => document.body.appendChild(buildBanner()));
  } else {
    document.body.appendChild(buildBanner());
  }
}

// Expose reset() so the Privacy Policy page button can trigger it
window.__faultendConsent = { accept, reject, reset };

init();
