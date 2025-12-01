import { fetchTraffic, clearTraffic } from '../api.js';
import { Toast, createSpinner, createEmptyState } from '../components.js';

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

class TrafficTable {
  constructor(containerId, serverId) {
    this.container = document.getElementById(containerId);
    this.serverId = serverId;
    this.logs = [];
    this.filters = {
      method: '',
      status: '',
      path: ''
    };
    this.pollInterval = null;
    this.lastUpdate = null;
    this.isLoading = false;
  }

  async load() {
    if (this.isLoading) return;
    
    try {
      this.isLoading = true;
      const apiFilters = this.getAPIFilters();
      const response = await fetchTraffic(this.serverId, apiFilters);
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
    if (this.filters.method) {
      filters.method = this.filters.method;
    }
    if (this.filters.path) {
      filters.path = this.filters.path;
    }
    return filters;
  }

  getClientFilteredLogs() {
    let filtered = [...this.logs];
    
    if (this.filters.status) {
      filtered = filtered.filter(log => {
        const statusFamily = Math.floor(log.response.statusCode / 100);
        return this.filters.status === `${statusFamily}xx`;
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
    
    const html = `
      <div class="traffic-container">
        <div class="traffic-header">
          <h2>Traffic</h2>
          <div class="traffic-actions">
            <button class="btn-secondary" id="refreshTrafficBtn">Refresh</button>
            <button class="btn-secondary" id="clearTrafficBtn">Clear</button>
          </div>
        </div>
        
        ${this.lastUpdate ? `
          <div class="last-update">
            Last updated: ${this.getTimeAgo(this.lastUpdate)}
          </div>
        ` : ''}
        
        ${this.renderFilters()}
        
        ${filteredLogs.length === 0 ? this.renderEmptyState() : this.renderTable(filteredLogs)}
      </div>
    `;
    
    this.container.innerHTML = html;
    this.bindEvents();
  }

  renderFilters() {
    return `
      <div class="traffic-filters">
        <div class="filter-group">
          <label>Method</label>
          <select id="methodFilter" class="input">
            <option value="">All</option>
            <option value="GET" ${this.filters.method === 'GET' ? 'selected' : ''}>GET</option>
            <option value="POST" ${this.filters.method === 'POST' ? 'selected' : ''}>POST</option>
            <option value="PUT" ${this.filters.method === 'PUT' ? 'selected' : ''}>PUT</option>
            <option value="PATCH" ${this.filters.method === 'PATCH' ? 'selected' : ''}>PATCH</option>
            <option value="DELETE" ${this.filters.method === 'DELETE' ? 'selected' : ''}>DELETE</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label>Status</label>
          <select id="statusFilter" class="input">
            <option value="">All</option>
            <option value="2xx" ${this.filters.status === '2xx' ? 'selected' : ''}>2xx Success</option>
            <option value="3xx" ${this.filters.status === '3xx' ? 'selected' : ''}>3xx Redirect</option>
            <option value="4xx" ${this.filters.status === '4xx' ? 'selected' : ''}>4xx Client Error</option>
            <option value="5xx" ${this.filters.status === '5xx' ? 'selected' : ''}>5xx Server Error</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label>Path</label>
          <input type="text" id="pathSearch" class="input" placeholder="Search path..." value="${this.filters.path}">
        </div>
      </div>
    `;
  }

  renderEmptyState() {
    const message = this.hasActiveFilters() 
      ? 'No traffic matches your filters. Try adjusting the filters.'
      : 'No traffic logged yet. Send requests through your fault server to see them here.';
    
    return `<div class="empty-state">${message}</div>`;
  }

  hasActiveFilters() {
    return this.filters.method || this.filters.status || this.filters.path;
  }

  renderTable(logs) {
    return `
      <div class="traffic-table-container">
        <table class="traffic-table">
          <thead>
            <tr>
              <th>Method</th>
              <th>Path</th>
              <th>Status</th>
              <th>Time</th>
              <th>Rule</th>
            </tr>
          </thead>
          <tbody>
            ${logs.map(log => this.renderTableRow(log)).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  renderTableRow(log) {
    const method = log.request.method;
    const path = this.truncatePath(log.request.path);
    const statusCode = log.response.statusCode;
    const statusFamily = Math.floor(statusCode / 100);
    const duration = log.duration;
    const hasRule = log.matchedRule ? '✓' : '−';
    
    return `
      <tr class="traffic-row" data-log-id="${log.id}">
        <td><span class="badge badge-${method.toLowerCase()}">${method}</span></td>
        <td class="path-cell" title="${log.request.path}">${path}</td>
        <td><span class="badge badge-status-${statusFamily}xx">${statusCode}</span></td>
        <td class="duration-cell">${duration}ms</td>
        <td class="rule-indicator">${hasRule}</td>
      </tr>
    `;
  }

  truncatePath(path) {
    const maxLength = 50;
    if (path.length <= maxLength) return path;
    return path.substring(0, maxLength - 3) + '...';
  }

  getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 5) return 'just now';
    if (seconds < 60) return `${seconds} seconds ago`;
    if (seconds < 120) return '1 minute ago';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    
    return date.toLocaleTimeString();
  }

  bindEvents() {
    const refreshBtn = document.getElementById('refreshTrafficBtn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.load());
    }
    
    const clearBtn = document.getElementById('clearTrafficBtn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearAll());
    }
    
    const methodFilter = document.getElementById('methodFilter');
    if (methodFilter) {
      methodFilter.addEventListener('change', (e) => {
        this.filters.method = e.target.value;
        this.load();
      });
    }
    
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
      statusFilter.addEventListener('change', (e) => {
        this.filters.status = e.target.value;
        this.render();
      });
    }
    
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
      row.addEventListener('click', () => {
        const logId = row.dataset.logId;
        this.openDetail(logId);
      });
    });
  }

  openDetail(logId) {
    const log = this.logs.find(l => l.id === logId);
    if (!log) {
      Toast.error('Traffic log not found');
      return;
    }
    
    const detail = new TrafficDetail(log);
    const html = detail.render();
    
    const drawer = window.faultendApp.getDrawer();
    drawer.setTitle('Request Details');
    drawer.setContent(html);
    drawer.open();
  }

  async clearAll() {
    if (!confirm('Clear all traffic logs? This cannot be undone.')) {
      return;
    }
    
    try {
      await clearTraffic(this.serverId);
      this.logs = [];
      this.render();
      Toast.success('Traffic cleared');
    } catch (error) {
      console.error('Failed to clear traffic:', error);
      Toast.error('Failed to clear traffic');
    }
  }
}

class TrafficDetail {
  constructor(log) {
    this.log = log;
  }

  render() {
    return `
      <div class="traffic-detail">
        ${this.renderOverview()}
        ${this.renderMatchedRule()}
        ${this.renderRequest()}
        ${this.renderResponse()}
        ${this.renderActions()}
      </div>
    `;
  }

  renderOverview() {
    const method = this.log.request.method;
    const statusCode = this.log.response.statusCode;
    const statusFamily = Math.floor(statusCode / 100);
    const timestamp = new Date(this.log.timestamp).toLocaleString();
    
    return `
      <div class="detail-section">
        <h3>Overview</h3>
        <div class="detail-row">
          <span class="label">Method:</span>
          <span class="badge badge-${method.toLowerCase()}">${method}</span>
        </div>
        <div class="detail-row">
          <span class="label">Path:</span>
          <span>${this.log.request.path}</span>
        </div>
        <div class="detail-row">
          <span class="label">Status:</span>
          <span class="badge badge-status-${statusFamily}xx">${statusCode} ${this.log.response.statusMessage}</span>
        </div>
        <div class="detail-row">
          <span class="label">Duration:</span>
          <span>${this.log.duration}ms</span>
        </div>
        <div class="detail-row">
          <span class="label">Timestamp:</span>
          <span>${timestamp}</span>
        </div>
        <div class="detail-row">
          <span class="label">Target:</span>
          <span>${this.log.target}</span>
        </div>
      </div>
    `;
  }

  renderMatchedRule() {
    if (!this.log.matchedRule) {
      return `
        <div class="detail-section">
          <h3>Matched Rule</h3>
          <p class="empty-state-small">No rule matched this request</p>
        </div>
      `;
    }
    
    return `
      <div class="detail-section">
        <h3>Matched Rule</h3>
        <div class="detail-row">
          <span class="label">Name:</span>
          <span>${this.log.matchedRule.name}</span>
        </div>
        <div class="detail-row">
          <span class="label">Priority:</span>
          <span>${this.log.matchedRule.priority}</span>
        </div>
        <div class="detail-row">
          <span class="label">Action:</span>
          <span class="badge">${this.log.matchedRule.action}</span>
        </div>
      </div>
    `;
  }

  renderRequest() {
    return `
      <div class="detail-section">
        <h3>Request</h3>
        
        <div class="code-block">
          <h4>Headers</h4>
          <pre>${JSON.stringify(this.log.request.headers, null, 2)}</pre>
        </div>
        
        ${Object.keys(this.log.request.query || {}).length > 0 ? `
          <div class="code-block">
            <h4>Query Parameters</h4>
            <pre>${JSON.stringify(this.log.request.query, null, 2)}</pre>
          </div>
        ` : ''}
        
        ${this.log.request.body ? `
          <div class="code-block">
            <h4>Body</h4>
            <pre>${JSON.stringify(this.log.request.body, null, 2)}</pre>
          </div>
        ` : '<p class="empty-state-small">No request body</p>'}
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
        
        ${this.log.response.body ? `
          <div class="code-block">
            <h4>Body</h4>
            <pre>${JSON.stringify(this.log.response.body, null, 2)}</pre>
          </div>
        ` : '<p class="empty-state-small">No response body</p>'}
        
        ${this.log.error ? `
          <div class="code-block error-block">
            <h4>Error</h4>
            <pre>${JSON.stringify(this.log.error, null, 2)}</pre>
          </div>
        ` : ''}
      </div>
    `;
  }

  renderActions() {
    return `
      <div class="detail-actions">
        <button class="btn btn-primary" onclick="alert('Create rule feature coming in Phase 9')">
          Create Rule
        </button>
      </div>
    `;
  }
}
