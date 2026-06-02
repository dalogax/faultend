import { fetchTraffic, clearTraffic } from '../api.js';
import { Toast, DangerConfirm, highlightJSON, escapeHtml } from '../components.js';
import { Icon, methodBadgeClass } from '../icons.js';
import { getRuleById, ruleLabels, renderLabelStack } from './rules.js';
import { buildSubdomainUrl } from '../config.js';

let trafficTable = null;

export function initTrafficView() {
  console.log('Traffic view initialized');
}

export function loadTrafficData(serverId) {
  console.log('Loading traffic data for server:', serverId);

  if (!trafficTable) {
    trafficTable = new TrafficTable('trafficView', serverId);
  } else {
    if (trafficTable.serverId !== serverId) {
      // Reset scroll anchor state when switching to a different server.
      trafficTable.scrollMode = 'following';
      trafficTable._savedScrollTop = 0;
      trafficTable._setScrollBtnVisible(false);
    }
    trafficTable.serverId = serverId;
  }

  trafficTable.load();
  trafficTable.startPolling();
}

export function stopTrafficPolling() {
  if (trafficTable) {
    trafficTable.stopPolling();
  }
}

/** Inline latency bar — width scaled to a 300ms reference, amber when slow, red on error. */
function latBar(ms, isError) {
  const max = isError ? 2000 : 300;
  const pct = Math.max(2, Math.min(100, (ms / max) * 100));
  const cls = isError ? 'err' : (ms >= 200 ? 'slow' : '');
  return `<span class="lat"><span class="lat-bar"><i class="${cls}" style="width:${pct}%"></i></span><span>${ms}<span class="unit">ms</span></span></span>`;
}

const AUTO_REFRESH_KEY = 'faultend.autoRefresh';
const POLL_MS = 2000;

class TrafficTable {
  constructor(containerId, serverId) {
    this.container = document.getElementById(containerId);
    this.serverId = serverId;
    this.logs = [];
    this.filters = { method: '', status: '', path: '' };
    this.pollInterval = null;
    this.lastUpdate = null;
    this.isLoading = false;
    this.autoRefresh = this.readAutoRefresh();
    this._onVis = () => this.applyAutoRefresh();
    // Scroll-anchor state — 'following' keeps you at bottom (newest); 'anchored' preserves
    // position so you can read older entries while live traffic continues arriving.
    this.scrollMode = 'following';
    this._savedScrollTop = 0;
    // Listener is added/removed by startPolling/stopPolling, not the constructor.
  }

  readAutoRefresh() {
    const stored = localStorage.getItem(AUTO_REFRESH_KEY);
    return stored === null ? true : stored === 'true';
  }

  setAutoRefresh(on) {
    this.autoRefresh = on;
    localStorage.setItem(AUTO_REFRESH_KEY, String(on));
    this.applyAutoRefresh();
  }

  applyAutoRefresh() {
    const shouldPoll = this.autoRefresh && document.visibilityState === 'visible';
    if (shouldPoll && !this.pollInterval) {
      this.pollInterval = setInterval(() => this.load(), POLL_MS);
    } else if (!shouldPoll && this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  async load() {
    if (this.isLoading) return;

    try {
      this.isLoading = true;
      const response = await fetchTraffic(this.serverId, this.getAPIFilters());
      this.logs = response.logs || [];
      this.lastUpdate = new Date();
      this.render();
    } catch (error) {
      console.error('Failed to load traffic:', error);
      if (!error.message.includes('502')) {
        Toast.error('Failed to load traffic');
      }
      this.logs = [];
      this.render();
    } finally {
      this.isLoading = false;
    }
  }

  getAPIFilters() {
    const filters = {};
    if (this.filters.method) filters.method = this.filters.method;
    if (this.filters.path) filters.path = this.filters.path;
    return filters;
  }

  getClientFilteredLogs() {
    let filtered = [...this.logs];
    if (this.filters.status) {
      filtered = filtered.filter(log => {
        const family = Math.floor(log.response.statusCode / 100);
        return this.filters.status === `${family}xx`;
      });
    }
    return filtered;
  }

  startPolling() {
    // Re-attach the visibility listener (idempotent: remove first to avoid dups).
    document.removeEventListener('visibilitychange', this._onVis);
    document.addEventListener('visibilitychange', this._onVis);
    this.applyAutoRefresh();
  }

  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    // Remove the listener so tab-focus events can't restart polling
    // while we're on the server list or any non-traffic view.
    document.removeEventListener('visibilitychange', this._onVis);
  }

  render() {
    // Mount the shell once. Subsequent loads only swap the rows region so
    // the filter input keeps focus + selection across auto-refresh ticks.
    if (!this._shellMounted) {
      this.container.innerHTML = `
        <div class="column-header">
          <div class="column-title">
            <h2>Traffic</h2>
            <span class="count" id="trafficCount">${this.logs.length}</span>
          </div>
          <div class="column-actions">
            <label class="auto-refresh-toggle" title="Auto-refresh traffic every ${POLL_MS / 1000}s">
              <span class="toggle-switch"><input type="checkbox" id="autoRefreshToggle" ${this.autoRefresh ? 'checked' : ''}><span class="toggle-slider"></span></span>
              <span class="auto-refresh-label">Live</span>
            </label>
            <button class="btn-ghost btn-sm" id="refreshTrafficBtn">${Icon.refresh} Refresh</button>
            <button class="btn-danger btn-sm" id="clearTrafficBtn">${Icon.trash} Clear</button>
          </div>
        </div>
        <div class="traffic-container">
          ${this.renderFilters()}
          <div id="trafficRowsRegion"></div>
          <button class="traffic-scroll-btn" id="scrollToBottomBtn" title="Back to bottom" aria-label="Back to bottom">
            ${Icon.arrowDown}
          </button>
        </div>
      `;
      this._shellMounted = true;
      this.bindShellEvents();
    }
    this.renderRows();
  }

  renderRows() {
    const region = document.getElementById('trafficRowsRegion');
    if (!region) return;

    // Save scroll position before the DOM is replaced (anchored mode).
    const oldContainer = region.querySelector('.traffic-table-container');
    if (oldContainer && this.scrollMode === 'anchored') {
      this._savedScrollTop = oldContainer.scrollTop;
    }

    const filteredLogs = this.getClientFilteredLogs();
    const count = document.getElementById('trafficCount');
    if (count) count.textContent = this.logs.length;
    region.innerHTML = `
      ${this.lastUpdate ? `<div class="last-update">last updated · ${this.getTimeAgo(this.lastUpdate)}</div>` : ''}
      ${filteredLogs.length === 0
        ? this.renderEmptyState()
        : `<div class="traffic-table-container">${this.renderTable(filteredLogs)}</div>`}
    `;

    // Restore scroll position and re-attach the scroll listener on the new container.
    const newContainer = region.querySelector('.traffic-table-container');
    if (newContainer) {
      if (this.scrollMode === 'anchored') {
        // User is reading older entries — restore where they were.
        newContainer.scrollTop = this._savedScrollTop;
      } else {
        // Following mode — jump to bottom so the newest entry is visible.
        newContainer.scrollTop = newContainer.scrollHeight;
      }
      this._bindScrollListener(newContainer);
    }

    this.bindRowEvents();
  }

  /** Attach a scroll listener to the (freshly created) table container. */
  _bindScrollListener(container) {
    container.addEventListener('scroll', () => {
      const atBottom = container.scrollHeight - container.scrollTop - container.clientHeight <= 5;
      if (atBottom && this.scrollMode === 'anchored') {
        // User scrolled back to the bottom — resume live following.
        this.scrollMode = 'following';
        this._savedScrollTop = 0;
        this._setScrollBtnVisible(false);
      } else if (!atBottom && this.scrollMode === 'following') {
        // User scrolled up to read older entries — anchor position.
        this.scrollMode = 'anchored';
        this._savedScrollTop = container.scrollTop;
        this._setScrollBtnVisible(true);
      } else if (this.scrollMode === 'anchored') {
        // Keep _savedScrollTop updated while the user keeps scrolling.
        this._savedScrollTop = container.scrollTop;
      }
    }, { passive: true });
  }

  _setScrollBtnVisible(visible) {
    const btn = document.getElementById('scrollToBottomBtn');
    if (btn) btn.classList.toggle('visible', visible);
  }

  renderFilters() {
    const opt = (val, label, current) =>
      `<option value="${val}" ${current === val ? 'selected' : ''}>${label}</option>`;
    return `
      <div class="traffic-filters">
        <span style="color:var(--ft-fg-muted);display:flex">${Icon.filter}</span>
        <div class="filter-group">
          <select id="methodFilter" class="input">
            ${opt('', 'method · all', this.filters.method)}
            ${['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map(m => opt(m, m, this.filters.method)).join('')}
          </select>
        </div>
        <div class="filter-group">
          <select id="statusFilter" class="input">
            ${opt('', 'status · all', this.filters.status)}
            ${opt('2xx', '2xx', this.filters.status)}
            ${opt('3xx', '3xx', this.filters.status)}
            ${opt('4xx', '4xx', this.filters.status)}
            ${opt('5xx', '5xx', this.filters.status)}
          </select>
        </div>
        <div class="filter-group grow">
          <input type="text" id="pathSearch" class="input input-mono" placeholder="filter path…" value="${this.filters.path}">
        </div>
      </div>
    `;
  }

  renderEmptyState() {
    const message = this.hasActiveFilters()
      ? 'No traffic matches your filters.'
      : 'No traffic logged yet. Send requests through your fault server to see them here.';
    return `<div class="empty-state">${message}</div>`;
  }

  hasActiveFilters() {
    return this.filters.method || this.filters.status || this.filters.path;
  }

  renderTable(logs) {
    // Render oldest-first so the newest entry is at the bottom (tail-follow pattern).
    const ordered = [...logs].reverse();
    return `
      <table class="traffic-table">
        <thead>
          <tr>
            <th style="width:76px">Time</th>
            <th style="width:76px">Method</th>
            <th>Path</th>
            <th style="width:84px">Status</th>
            <th class="duration-col" style="width:130px">Duration</th>
            <th class="rule-col" style="width:84px">Rule</th>
          </tr>
        </thead>
        <tbody>
          ${ordered.map(log => this.renderTableRow(log)).join('')}
        </tbody>
      </table>
    `;
  }

  renderTableRow(log) {
    const method = log.request.method;
    const path = this.truncatePath(log.request.path);
    const statusCode = log.response.statusCode;
    const statusFamily = Math.floor(statusCode / 100);
    const isError = statusFamily >= 5;
    const isHealthy = statusFamily === 2 && log.duration < 200;
    // Prefer immutable snapshot saved at request time; fall back to live lookup
    // for records that pre-date the snapshot column.
    const ruleData = log.matchedRuleSnapshot || (log.matchedRule ? getRuleById(log.matchedRule) : null);
    const rule = log.matchedRule
      ? (ruleData
          ? renderLabelStack(ruleLabels(ruleData))
          : '<span class="badge badge-outline">matched</span>')
      : '<span class="muted">—</span>';

    return `
      <tr class="traffic-row${isHealthy ? ' is-healthy' : ''}" data-log-id="${log.id}">
        <td class="time-cell">${this.formatTime(log.timestamp)}</td>
        <td><span class="badge badge-${methodBadgeClass(method)}">${method}</span></td>
        <td class="path-cell" title="${escapeHtml(log.request.path)}">${escapeHtml(path)}</td>
        <td><span class="badge badge-status-${statusFamily}xx">${statusCode}</span></td>
        <td class="duration-col">${latBar(log.duration, isError)}</td>
        <td class="rule-col">${rule}</td>
      </tr>
    `;
  }

  formatTime(timestamp) {
    if (!timestamp) return '—';
    return new Date(timestamp).toLocaleTimeString('en-GB', { hour12: false });
  }

  truncatePath(path) {
    const maxLength = 50;
    if (path.length <= maxLength) return path;
    return path.substring(0, maxLength - 1) + '…';
  }

  getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 5) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return date.toLocaleTimeString('en-GB', { hour12: false });
  }

  bindShellEvents() {
    document.getElementById('refreshTrafficBtn')?.addEventListener('click', () => this.load());
    document.getElementById('autoRefreshToggle')?.addEventListener('change', (e) => {
      this.setAutoRefresh(e.target.checked);
    });

    document.getElementById('scrollToBottomBtn')?.addEventListener('click', () => {
      const container = document.querySelector('.traffic-table-container');
      if (container) container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
      // Switch mode immediately so the next poll doesn't restore the old position.
      this.scrollMode = 'following';
      this._savedScrollTop = 0;
      this._setScrollBtnVisible(false);
    });
    DangerConfirm.wire(document.getElementById('clearTrafficBtn'), {
      idleText: `${Icon.trash} Clear`,
      armedText: 'Click again to confirm',
      onConfirm: () => this.clearAll()
    });

    const methodFilter = document.getElementById('methodFilter');
    methodFilter?.addEventListener('change', (e) => {
      this.filters.method = e.target.value;
      this.load();
    });

    const statusFilter = document.getElementById('statusFilter');
    statusFilter?.addEventListener('change', (e) => {
      this.filters.status = e.target.value;
      this.renderRows();
    });

    const pathSearch = document.getElementById('pathSearch');
    if (pathSearch) {
      let debounceTimer;
      pathSearch.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          this.filters.path = e.target.value;
          this.load();
        }, 300);
      });
    }
  }

  bindRowEvents() {
    document.querySelectorAll('.traffic-row').forEach(row => {
      row.addEventListener('click', () => this.openDetail(row.dataset.logId));
    });
  }

  openDetail(logId) {
    const log = this.logs.find(l => l.id === logId);
    if (!log) {
      Toast.error('Traffic log not found');
      return;
    }

    const detail = new TrafficDetail(log, this.serverId);
    detail.open();
  }

  async clearAll() {
    try {
      await clearTraffic(this.serverId);
      this.logs = [];
      this.render();
    } catch (error) {
      console.error('Failed to clear traffic:', error);
      Toast.error('Failed to clear traffic');
    }
  }
}

class TrafficDetail {
  constructor(log, serverId) {
    this.log = log;
    this.serverId = serverId;
  }

  open() {
    const drawer = window.faultendApp.getDrawer();
    const method = this.log.request.method;
    drawer.setHeader({
      eyebrow: 'Request',
      title: `${method} ${this.log.request.path}`,
      sub: `Inspected on ${this.serverId}`
    });
    drawer.setContent(`
      <div class="traffic-detail">
        ${this.renderOverview()}
        ${this.renderMatchedRule()}
        ${this.renderRequest()}
        ${this.renderResponse()}
      </div>
    `);
    drawer.setFooter(`
      <button class="btn-ghost btn-sm" id="trafficDetailClose">Close</button>
      <button class="btn-ghost btn-sm" id="copyCurlBtn">${Icon.copy} Copy as cURL</button>
      <button class="btn btn-sm" id="createRuleFromTrafficBtn">Create rule from this</button>
    `);
    drawer.open();
    this.bindActionsEvents();
  }

  renderOverview() {
    const method = this.log.request.method;
    const statusCode = this.log.response.statusCode;
    const statusFamily = Math.floor(statusCode / 100);
    const timestamp = new Date(this.log.timestamp).toLocaleString();

    return `
      <div class="detail-section">
        <h3>Overview</h3>
        <div class="detail-row"><span class="label">method</span><span class="value"><span class="badge badge-lg badge-${methodBadgeClass(method)}">${method}</span></span></div>
        <div class="detail-row"><span class="label">path</span><span class="value mono">${escapeHtml(this.log.request.path)}</span></div>
        <div class="detail-row"><span class="label">status</span><span class="value"><span class="badge badge-lg badge-status-${statusFamily}xx">${statusCode} ${escapeHtml(this.log.response.statusMessage || '')}</span></span></div>
        <div class="detail-row"><span class="label">duration</span><span class="value mono">${this.log.duration}ms</span></div>
        <div class="detail-row"><span class="label">timestamp</span><span class="value mono">${escapeHtml(timestamp)}</span></div>
        <div class="detail-row"><span class="label">target</span><span class="value mono">${escapeHtml(this.log.target || '—')}</span></div>
      </div>
    `;
  }

  renderMatchedRule() {
    if (!this.log.matchedRule) {
      return `
        <div class="detail-section">
          <h3>Matched rule</h3>
          <p class="empty-state-small">No rule matched this request.</p>
        </div>
      `;
    }
    // Prefer snapshot; fall back to live lookup for pre-snapshot records
    const rule = this.log.matchedRuleSnapshot || getRuleById(this.log.matchedRule);
    if (!rule) {
      return `
        <div class="detail-section">
          <h3>Matched rule</h3>
          <div class="detail-row"><span class="label">rule id</span><span class="value mono">${this.log.matchedRule}</span></div>
        </div>
      `;
    }
    return `
      <div class="detail-section">
        <h3>Matched rule</h3>
        <div class="detail-row"><span class="label">labels</span><span class="value">${renderLabelStack(ruleLabels(rule))}</span></div>
        <div class="detail-row"><span class="label">priority</span><span class="value mono">${rule.priority}</span></div>
        ${rule.pathRegex ? `<div class="detail-row"><span class="label">pattern</span><span class="value mono">${escapeHtml(rule.pathRegex)}</span></div>` : ''}
        ${rule.name ? `<div class="detail-row"><span class="label">name</span><span class="value mono">${escapeHtml(rule.name)}</span></div>` : ''}
      </div>
    `;
  }

  renderRequest() {
    const hasQuery = Object.keys(this.log.request.query || {}).length > 0;
    return `
      <div class="detail-section">
        <h3>Request</h3>
        <div class="code-block">
          <h4>Headers</h4>
          <pre class="json-pre">${highlightJSON(this.log.request.headers)}</pre>
        </div>
        ${hasQuery ? `
          <div class="code-block">
            <h4>Query parameters</h4>
            <pre class="json-pre">${highlightJSON(this.log.request.query)}</pre>
          </div>
        ` : ''}
        ${this.log.request.body
          ? `<div class="code-block"><h4>Body</h4><pre class="json-pre">${highlightJSON(this.log.request.body)}</pre></div>`
          : '<p class="empty-state-small">// no request body</p>'}
      </div>
    `;
  }

  renderResponse() {
    return `
      <div class="detail-section">
        <h3>Response</h3>
        <div class="code-block">
          <h4>Headers</h4>
          <pre class="json-pre">${highlightJSON(this.log.response.headers)}</pre>
        </div>
        ${this.log.response.body
          ? `<div class="code-block"><h4>Body</h4><pre class="json-pre">${highlightJSON(this.log.response.body)}</pre></div>`
          : '<p class="empty-state-small">// no response body</p>'}
        ${this.log.error
          ? `<div class="code-block error-block"><h4>Error</h4><pre class="json-pre">${highlightJSON(this.log.error)}</pre></div>`
          : ''}
      </div>
    `;
  }

  buildCurlCommand() {
    const { method, path, query, headers, body } = this.log.request;

    // Reconstruct the full proxy URL, including any query-string parameters.
    const baseUrl = buildSubdomainUrl(this.serverId);
    let url = `${baseUrl}${path}`;
    const queryEntries = Object.entries(query || {});
    if (queryEntries.length > 0) {
      const qs = queryEntries
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&');
      url += `?${qs}`;
    }

    // Shell-safe single-quote escaping: replace ' with '\''
    const sq = (s) => `'${String(s).replace(/'/g, "'\\''")}'`;

    const parts = [`curl -X ${method} ${sq(url)}`];

    // Headers — drop hop-by-hop and auto-generated fields that curl sets itself.
    const skipHeaders = new Set(['host', 'content-length', 'transfer-encoding', 'connection']);
    for (const [name, value] of Object.entries(headers || {})) {
      if (!skipHeaders.has(name.toLowerCase())) {
        parts.push(`  -H ${sq(`${name}: ${value}`)}`);
      }
    }

    // Body — stringify if it was parsed to an object, otherwise use raw string.
    if (body !== undefined && body !== null && body !== '') {
      const bodyStr = typeof body === 'object' ? JSON.stringify(body, null, 2) : String(body);
      parts.push(`  --data-binary ${sq(bodyStr)}`);
    }

    return parts.join(' \\\n');
  }

  bindActionsEvents() {
    const drawer = window.faultendApp.getDrawer();
    document.getElementById('trafficDetailClose')?.addEventListener('click', () => drawer.close());

    document.getElementById('copyCurlBtn')?.addEventListener('click', async () => {
      const curl = this.buildCurlCommand();
      try {
        await navigator.clipboard.writeText(curl);
        Toast.success('cURL command copied to clipboard');
      } catch {
        Toast.error('Could not copy — try selecting the text manually');
      }
    });

    document.getElementById('createRuleFromTrafficBtn')?.addEventListener('click', async () => {
      const { openRuleForm } = await import('./rules.js');
      openRuleForm(this.serverId, this.log);
    });
  }
}

export { TrafficDetail };
