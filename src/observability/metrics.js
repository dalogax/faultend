// Prometheus metrics via prom-client.
// Only active when METRICS_ENABLED=true — falls back to no-ops so local
// development is unaffected without any configuration change.

let _registry = null;
let _proxyRequestsTotal = null;

function isEnabled() {
  return process.env.METRICS_ENABLED === 'true';
}

function init() {
  if (!isEnabled()) return;
  if (_registry) return; // already initialised (idempotent)

  const { Registry, collectDefaultMetrics, Counter } = require('prom-client');

  _registry = new Registry();
  _registry.setDefaultLabels({ service: 'faultend' });

  // Default Node.js process metrics: CPU, memory, event loop lag, GC, file descriptors, etc.
  collectDefaultMetrics({ register: _registry });

  // Total requests processed by fault servers
  _proxyRequestsTotal = new Counter({
    name: 'proxy_requests_total',
    help: 'Total number of requests processed by fault servers',
    labelNames: ['server_id', 'status_code', 'rule_action'],
    registers: [_registry]
  });

  console.log('[METRICS] Prometheus metrics initialised (METRICS_ENABLED=true)');
}

/**
 * Increment the proxy_requests_total counter.
 * No-op if metrics are disabled.
 *
 * @param {string}  serverId
 * @param {number}  statusCode   HTTP status code of the response
 * @param {'mock'|'proxy'|'unmatched'} ruleAction
 */
function incProxyRequest(serverId, statusCode, ruleAction) {
  if (!_proxyRequestsTotal) return;
  _proxyRequestsTotal.inc({
    server_id: serverId,
    status_code: String(statusCode),
    rule_action: ruleAction
  });
}

/**
 * Returns the Prometheus metrics text payload.
 * Returns null if metrics are disabled.
 *
 * @returns {Promise<string|null>}
 */
async function getMetrics() {
  if (!_registry) return null;
  return _registry.metrics();
}

/**
 * Returns the correct Content-Type header value for the metrics response.
 */
function getContentType() {
  const { register } = require('prom-client');
  return register.contentType;
}

module.exports = { init, incProxyRequest, getMetrics, getContentType, isEnabled };
