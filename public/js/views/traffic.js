import { fetchTraffic, clearTraffic } from '../api.js';
import { Toast } from '../components.js';
import { Icon, methodBadgeClass } from '../icons.js';
import { getRuleById } from './rules.js';

let trafficTable = null;

export function initTrafficView() {
  console.log('Traffic view initialized');
}

export function loadTrafficData(serverId) {
  console.log('Loading traffic data for server:', serverId);

  if (!trafficTable) {
    trafficTable = new TrafficTable('trafficView', serverId);
  } else {
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

class TrafficTable {
  constructor(containerId, serverId) {
    this.container = document.getElementById(containerId);
    this.serverId = serverId;
    this.logs = [];
    this.filters = { method: '', status: '', path: '' };
    this.pollInterval = null;
    this.lastUpdate = null;
    this.isLoading = false;
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
    this.stopPolling();
    this.pollInterval = setInterval(() => this.load(), 2000);
  }

  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  render() {
    const filteredLogs = this.getClientFilteredLogs();

    this.container.innerHTML = `
      <div class="column-header">
        <div class="column-title">
          <h2>Traffic</h2>
          <span class="count">${this.logs.length}</span>
        </div>
        <div class="column-actions">
          <button class="btn-ghost btn-sm" id="refreshTrafficBtn">${Icon.refresh} Refresh</button>
          <button class="btn-ghost btn-sm" id="clearTrafficBtn">${Icon.trash} Clear</button>
        </div>
      </div>
      <div class="traffic-container">
        ${this.renderFilters()}
        ${this.lastUpdate ? `<div class="last-update">last updated · ${this.getTimeAgo(this.lastUpdate)}</div>` : ''}
        ${filteredLogs.length === 0
          ? this.renderEmptyState()
          : `<div class="traffic-table-container">${this.renderTable(filteredLogs)}</div>`}
      </div>
    `;

    this.bindEvents();
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
    return `
      <table class="traffic-table">
        <thead>
          <tr>
            <th style="width:76px">Time</th>
            <th style="width:76px">Method</th>
            <th>Path</th>
            <th style="width:84px">Status</th>
            <th style="width:130px">Duration</th>
            <th style="width:84px">Rule</th>
          </tr>
        </thead>
        <tbody>
          ${logs.map(log => this.renderTableRow(log)).join('')}
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
    const matched = log.matchedRule ? getRuleById(log.matchedRule) : null;
    const rule = log.matchedRule
      ? (matched
          ? `<span class="badge badge-action-${matched.action}">${matched.action}</span>`
          : '<span class="badge badge-outline">matched</span>')
      : '<span class="muted">—</span>';

    return `
      <tr class="traffic-row" data-log-id="${log.id}">
        <td class="time-cell">${this.formatTime(log.timestamp)}</td>
        <td><span class="badge badge-${methodBadgeClass(method)}">${method}</span></td>
        <td class="path-cell" title="${log.request.path}">${path}</td>
        <td><span class="badge badge-status-${statusFamily}xx">${statusCode}</span></td>
        <td>${latBar(log.duration, isError)}</td>
        <td>${rule}</td>
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

  bindEvents() {
    document.getElementById('refreshTrafficBtn')?.addEventListener('click', () => this.load());
    document.getElementById('clearTrafficBtn')?.addEventListener('click', () => this.clearAll());

    const methodFilter = document.getElementById('methodFilter');
    methodFilter?.addEventListener('change', (e) => {
      this.filters.method = e.target.value;
      this.load();
    });

    const statusFilter = document.getElementById('statusFilter');
    statusFilter?.addEventListener('change', (e) => {
      this.filters.status = e.target.value;
      this.render();
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
    const { ConfirmDialog } = await import('../components.js');
    const confirmed = await ConfirmDialog.show({
      title: 'Clear all traffic',
      message: 'Discard all logged requests for this server? This cannot be undone.',
      confirmText: 'Clear all',
      cancelText: 'Cancel',
      danger: true
    });

    if (!confirmed) return;

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
        <div class="detail-row"><span class="label">path</span><span class="value mono">${this.log.request.path}</span></div>
        <div class="detail-row"><span class="label">status</span><span class="value"><span class="badge badge-lg badge-status-${statusFamily}xx">${statusCode} ${this.log.response.statusMessage || ''}</span></span></div>
        <div class="detail-row"><span class="label">duration</span><span class="value mono">${this.log.duration}ms</span></div>
        <div class="detail-row"><span class="label">timestamp</span><span class="value mono">${timestamp}</span></div>
        <div class="detail-row"><span class="label">target</span><span class="value mono">${this.log.target || '—'}</span></div>
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
    const rule = getRuleById(this.log.matchedRule);
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
        <div class="detail-row"><span class="label">action</span><span class="value"><span class="badge badge-action-${rule.action}">${rule.action}</span></span></div>
        <div class="detail-row"><span class="label">priority</span><span class="value mono">${rule.priority}</span></div>
        ${rule.pathRegex ? `<div class="detail-row"><span class="label">pattern</span><span class="value mono">${rule.pathRegex}</span></div>` : ''}
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
          <pre>${JSON.stringify(this.log.request.headers, null, 2)}</pre>
        </div>
        ${hasQuery ? `
          <div class="code-block">
            <h4>Query parameters</h4>
            <pre>${JSON.stringify(this.log.request.query, null, 2)}</pre>
          </div>
        ` : ''}
        ${this.log.request.body
          ? `<div class="code-block"><h4>Body</h4><pre>${JSON.stringify(this.log.request.body, null, 2)}</pre></div>`
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
          <pre>${JSON.stringify(this.log.response.headers, null, 2)}</pre>
        </div>
        ${this.log.response.body
          ? `<div class="code-block"><h4>Body</h4><pre>${JSON.stringify(this.log.response.body, null, 2)}</pre></div>`
          : '<p class="empty-state-small">// no response body</p>'}
        ${this.log.error
          ? `<div class="code-block error-block"><h4>Error</h4><pre>${JSON.stringify(this.log.error, null, 2)}</pre></div>`
          : ''}
      </div>
    `;
  }

  bindActionsEvents() {
    const drawer = window.faultendApp.getDrawer();
    document.getElementById('trafficDetailClose')?.addEventListener('click', () => drawer.close());

    document.getElementById('createRuleFromTrafficBtn')?.addEventListener('click', async () => {
      const { openRuleForm } = await import('./rules.js');
      openRuleForm(this.serverId, this.log);
    });
  }
}

export { TrafficDetail };
