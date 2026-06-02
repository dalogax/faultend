// Main Application Entry Point

import { buildSubdomainUrl } from './config.js';
import { fetchServers, fetchStatsSummary } from './api.js';
import { Toast } from './components.js';
import ViewRouter from './router.js';
import DrawerController from './drawer.js';
import { initTrafficView, loadTrafficData, stopTrafficPolling } from './views/traffic.js';
import { initRulesView, loadRulesData } from './views/rules.js';
import { openProfilePanel } from './views/profile.js';
import { authManager } from './auth.js';
import { Icon } from './icons.js';
import { initTheme, applyTheme, getEffectiveTheme } from './theme.js';
import { track } from './analytics.js';

class App {
  constructor() {
    this.router = null;
    this.drawer = null;
    this.servers = [];
  }

  async init() {
    console.log('Initializing faultend application...');

    // Apply theme as early as possible to avoid a flash of light theme
    applyTheme(getEffectiveTheme());

    await authManager.init();

    if (!authManager.isLoggedIn()) {
      // Known user with an expired/invalidated session → bounce through OAuth silently.
      // First-time visitor (no stored provider) → show the login overlay as normal.
      if (!authManager.tryAutoLogin()) {
        this.showLoginOverlay();
      }
      return;
    }

    // Successful auth — clear the redirect guard so future expirations
    // can trigger a fresh auto-login attempt.
    sessionStorage.removeItem('autoAuthRedirect');
    this.hideLoginOverlay();

    this.router = new ViewRouter();
    this.drawer = new DrawerController();

    this.wireUserControls();

    initTrafficView();
    initRulesView();

    await this.loadServers();
    this.bindServerSelector();
    this.bindViewLoad();

    this.router.route();

    console.log('Application initialized');
  }

  showLoginOverlay() {
    const overlay = document.getElementById('loginOverlay');
    if (overlay) {
      overlay.style.display = 'grid';
    }
  }

  hideLoginOverlay() {
    const overlay = document.getElementById('loginOverlay');
    if (overlay) {
      overlay.style.display = 'none';
    }
  }

  wireUserControls() {
    const user = authManager.getUser();
    const profileBtn = document.getElementById('profileBtn');
    if (profileBtn) {
      // Fill the avatar with the user's initials
      const initials = user ? (user.name || user.email || '??').slice(0, 2).toUpperCase() : '??';
      profileBtn.textContent = initials;
      profileBtn.style.display = 'inline-flex';
      profileBtn.addEventListener('click', () => openProfilePanel(this.drawer));
    }
    // Show admin panel link for platform admins only
    const adminBtn = document.getElementById('adminBtn');
    if (adminBtn && user && user.isAdmin) {
      adminBtn.style.display = 'inline-flex';
    }
    initTheme();
  }

  async loadServers() {
    try {
      this.servers = await fetchServers();
      console.log('Loaded servers:', this.servers);
    } catch (error) {
      if (!error.message || !error.message.includes('502')) {
        Toast.error('Failed to load servers');
      }
      this.servers = [];
    }
  }

  bindServerSelector() {
    const serverListContent = document.getElementById('serverListContent');
    serverListContent.addEventListener('click', (e) => {
      const row = e.target.closest('.server-row');
      if (row) {
        this.router.navigateToServer(row.dataset.serverId);
      }
    });

    const createBtn = document.getElementById('createServerBtn');
    createBtn.addEventListener('click', () => {
      this.showCreateServerDialog();
    });
  }

  bindViewLoad() {
    window.addEventListener('viewload', (e) => {
      const view = e.detail.view;
      if (view === 'serverList') {
        stopTrafficPolling();
        // Always re-fetch so last-seen traffic, counts etc. are current
        this.loadServers().then(() => this.renderServerList());
      } else {
        this.loadViewData(view);
      }
    });
  }

  renderServerList() {
    const content = document.getElementById('serverListContent');
    console.log('Rendering server list, servers count:', this.servers.length);

    if (this.servers.length === 0) {
      content.innerHTML = '<div class="empty-state">No servers yet. Create your first fault server to get started.</div>';
      return;
    }

    const strip = `
      <div class="stat-strip">
        <div class="stat">
          <span class="stat-label">Servers</span>
          <span class="stat-value" id="statServers">${this.servers.length}</span>
        </div>
        <div class="stat">
          <span class="stat-label">Requests · 24h</span>
          <span class="stat-value mono" id="statRequests24h">—</span>
        </div>
        <div class="stat">
          <span class="stat-label">Active rules</span>
          <span class="stat-value" id="statRules">—</span>
        </div>
        <div class="stat">
          <span class="stat-label">Collaborators</span>
          <span class="stat-value" id="statCollaborators">—</span>
        </div>
      </div>
    `;

    const rows = this.servers.map(server => {
      const serverUrl = buildSubdomainUrl(server.server_id);
      const collaborators = parseInt(server.collaborators_count) || 0;
      const status = server.status || 'idle';
      return `
        <tr class="server-row" data-server-id="${server.server_id}">
          <td class="status-cell" title="${status}"><span class="server-status-dot ${status}"></span></td>
          <td class="text-strong">${server.server_id}</td>
          <td><span class="server-url">${serverUrl}</span></td>
          <td><span class="badge badge-role-${server.role || 'collaborator'}">${(server.role || 'collaborator')}</span></td>
          <td>${this.renderSharingCell(server, collaborators)}</td>
          <td class="muted">${this.formatRelativeTime(server.config_updated_at)}</td>
          <td class="muted">${this.formatRelativeTime(server.last_traffic_at)}</td>
          <td class="num" style="text-align:right">${(parseInt(server.traffic_count) || 0).toLocaleString()}</td>
          <td class="num" style="text-align:right">${parseInt(server.rules_count) || 0}</td>
          <td style="width:32px;color:var(--ft-fg-faint)">${Icon.chevronRight}</td>
        </tr>
      `;
    }).join('');

    const mobileCards = this.renderMobileCards();

    content.innerHTML = `
      ${strip}
      <div class="server-table-container">
        <table class="server-table">
          <thead>
            <tr>
              <th style="width:18px"></th>
              <th>Server</th>
              <th>Endpoint</th>
              <th style="width:90px">Role</th>
              <th style="width:170px">Sharing</th>
              <th style="width:110px">Updated</th>
              <th style="width:110px">Last traffic</th>
              <th style="width:100px;text-align:right">Requests</th>
              <th style="width:70px;text-align:right">Rules</th>
              <th></th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <div class="server-cards">${mobileCards}</div>
    `;
    this.hydrateStatsSummary();
  }

  formatRelativeTime(timestamp) {
    if (!timestamp) return '—';
    const date = new Date(timestamp);
    const sec = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
    if (sec < 5) return 'just now';
    if (sec < 60) return `${sec}s ago`;
    if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
    if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
    const days = Math.floor(sec / 86400);
    if (days < 30) return `${days}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  async hydrateStatsSummary() {
    try {
      const summary = await fetchStatsSummary();
      const r = document.getElementById('statRequests24h');
      const u = document.getElementById('statRules');
      const c = document.getElementById('statCollaborators');
      if (r) r.textContent = (summary.requests24h || 0).toLocaleString();
      if (u) u.textContent = summary.rules || 0;
      if (c) c.textContent = summary.collaborators || 0;
    } catch (error) {
      console.error('Failed to load stats summary:', error);
    }
  }

  renderSharingCell(server, collaborators) {
    // Owner viewing: collaborators_count = number of OTHERS they shared with
    // Non-owner viewing: collaborators_count includes "me", and the owner is
    // implicit — others-who-share = collaborators_count (others) + 1 (owner) − 1 (me) = collaborators_count
    if (!server.is_owner) {
      return `<span class="share-cell">${Icon.people}<span class="share-label">Shared</span><span class="share-meta">· ${collaborators}</span></span>`;
    }
    if (collaborators > 0) {
      return `<span class="share-cell">${Icon.people}<span class="share-label">Shared</span><span class="share-meta">· ${collaborators}</span></span>`;
    }
    return `<span class="share-cell">${Icon.person}<span>Private</span></span>`;
  }

  renderMobileCards() {
    return this.servers.map(server => {
      const serverUrl = buildSubdomainUrl(server.server_id);
      const collaborators = parseInt(server.collaborators_count) || 0;
      const status = server.status || 'idle';
      const role = server.role || 'collaborator';
      const lastSeen = this.formatRelativeTime(server.last_traffic_at);
      const trafficCount = (parseInt(server.traffic_count) || 0).toLocaleString();
      const rulesCount = parseInt(server.rules_count) || 0;
      const sharingText = this.renderCardSharingText(server, collaborators);
      return `
        <div class="server-card server-row" data-server-id="${server.server_id}">
          <div class="server-card-dot">
            <span class="server-status-dot ${status}"></span>
          </div>
          <div class="server-card-body">
            <div class="server-card-head">
              <span class="server-card-name">${server.server_id}</span>
              ${lastSeen !== '—' ? `<span class="server-card-time">${lastSeen}</span>` : ''}
            </div>
            <div class="server-card-url">${serverUrl}</div>
            <div class="server-card-meta">
              <span class="badge badge-role-${role}">${role}</span>
              <span class="server-card-sep"></span>
              <span class="server-card-stat"><b>${trafficCount}</b> req</span>
              <span class="server-card-sep"></span>
              <span class="server-card-stat"><b>${rulesCount}</b> rules</span>
              <span class="server-card-sep"></span>
              <span class="server-card-sharing">${sharingText}</span>
            </div>
          </div>
          <div class="server-card-chevron">${Icon.chevronRight}</div>
        </div>
      `;
    }).join('');
  }

  renderCardSharingText(server, collaborators) {
    if (collaborators > 0) return `shared · ${collaborators}`;
    return server.is_owner ? 'private' : 'shared';
  }

  formatDate(timestamp) {
    if (!timestamp) return '—';
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  loadViewData(view) {
    const serverId = this.router.currentServerId;
    if (!serverId) {
      console.log('No server selected');
      return;
    }

    console.log(`Loading data for view: ${view}, server: ${serverId}`);

    switch (view) {
      case 'traffic':
        loadTrafficData(serverId);
        break;
      case 'rules':
        loadRulesData(serverId);
        break;
    }
  }

  showCreateServerDialog() {
    this.currentTab = 'manual';
    this.importData = null;

    this.drawer.setHeader({ eyebrow: 'New', title: 'Add fault server' });
    this.drawer.setContent(this.renderServerForm());
    this.drawer.setFooter(`
      <button type="button" class="btn-ghost btn-sm" data-action="cancel">Cancel</button>
      <button type="button" class="btn btn-sm" id="serverCreateBtn">Create server</button>
    `);
    this.drawer.open();

    this.attachServerFormHandlers();
  }

  renderServerForm() {
    return `
      <div class="server-form-container">
        <div class="tabs">
          <button class="tab ${this.currentTab === 'manual' ? 'active' : ''}" data-tab="manual">Manual</button>
          <button class="tab ${this.currentTab === 'import' ? 'active' : ''}" data-tab="import">Import from file</button>
        </div>

        <div class="tab-content" id="manual-tab" style="display: ${this.currentTab === 'manual' ? 'block' : 'none'}">
          <div class="form-section" style="border:none;padding:0;margin:0">
            <h3>Identity</h3>
            <div class="form-field" style="margin-bottom:0">
              <label for="server-id">Server ID<span class="req">*</span></label>
              <div class="suffix-field">
                <input type="text" id="server-id" class="input input-mono" placeholder="yourapp" pattern="^[a-z][a-z0-9\\-]*$">
                <span class="suffix">.faultend.com</span>
              </div>
              <span class="form-hint">Alphanumeric and hyphens · must start with a letter · used as subdomain.</span>
              <div class="form-error" id="id-error"></div>
            </div>
          </div>
        </div>

        <div class="tab-content" id="import-tab" style="display: ${this.currentTab === 'import' ? 'block' : 'none'}">
          <div class="import-form">
            <p>Upload a configuration file to create a new server with pre-configured rules.</p>
            <input type="file" id="import-file" accept=".json" style="display:none">
            <button type="button" id="choose-file-btn" class="btn-secondary btn-sm">Choose file</button>
            <div id="import-preview" style="display:none;width:100%"></div>
          </div>
        </div>
      </div>
    `;
  }

  attachServerFormHandlers() {
    document.querySelectorAll('.server-form-container .tab').forEach(tab => {
      tab.onclick = () => {
        this.currentTab = tab.dataset.tab;
        this.drawer.setContent(this.renderServerForm());
        this.attachServerFormHandlers();
      };
    });

    const chooseFileBtn = document.getElementById('choose-file-btn');
    const fileInput = document.getElementById('import-file');
    if (chooseFileBtn && fileInput) {
      chooseFileBtn.onclick = () => fileInput.click();
      fileInput.onchange = (e) => this.handleFileSelect(e);
    }

    const createBtn = document.getElementById('serverCreateBtn');
    if (createBtn) {
      createBtn.onclick = () => this.handleServerCreate();
    }

    document.querySelectorAll('[data-action="cancel"]').forEach(btn => {
      btn.onclick = () => this.drawer.close();
    });

    const idInput = document.getElementById('server-id');
    if (idInput) {
      idInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); this.handleServerCreate(); }
      });
    }
  }

  handleServerCreate() {
    if (this.currentTab === 'import') {
      this.handleImportServerCreate();
    } else {
      this.handleManualServerCreate();
    }
  }

  validateServerId(id) {
    if (!/^[a-z][a-z0-9\-]*$/.test(id)) {
      return 'Must start with a letter and contain only lowercase letters, numbers, and hyphens.';
    }
    return null;
  }

  checkServerIdExists(id) {
    return this.servers.some(s => s.server_id === id);
  }

  showError(elementId, message) {
    const errorEl = document.getElementById(elementId);
    if (errorEl) {
      errorEl.textContent = message;
    }
  }

  async handleManualServerCreate() {
    const idInput = document.getElementById('server-id');
    if (!idInput) return;
    const id = idInput.value.trim();

    const formatError = this.validateServerId(id);
    if (formatError) {
      this.showError('id-error', formatError);
      return;
    }
    if (this.checkServerIdExists(id)) {
      this.showError('id-error', 'Server ID already exists.');
      return;
    }

    try {
      const { createServer } = await import('./api.js');
      await createServer({ id });
      track('server_created', { creation_mode: 'manual' });
      this.drawer.close();
      await this.loadServers();
      this.renderServerList();
      this.router.navigateToServer(id);
    } catch (error) {
      Toast.error('Failed to create server');
    }
  }

  async handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!this.validateImportData(data)) {
        Toast.error('Invalid configuration file');
        return;
      }
      if (this.checkServerIdExists(data.server.id)) {
        Toast.error(`Server '${data.server.id}' already exists`);
        return;
      }

      this.importData = data;
      this.showImportPreview(data);
    } catch (error) {
      if (error instanceof SyntaxError) {
        Toast.error('Invalid JSON file');
      } else {
        console.error('File read failed:', error);
        Toast.error('Failed to read file');
      }
    } finally {
      e.target.value = '';
    }
  }

  validateImportData(data) {
    return data && data.version && data.server && data.server.id && Array.isArray(data.rules);
  }

  showImportPreview(data) {
    const preview = document.getElementById('import-preview');
    if (!preview) return;

    const rulesList = data.rules
      .slice(0, 10)
      .map(r => `<li>${r.action} · priority ${r.priority} · ${r.pathRegex || r.name || ''}</li>`)
      .join('');
    const more = data.rules.length > 10 ? `<li>… and ${data.rules.length - 10} more</li>` : '';

    preview.innerHTML = `
      <div class="preview-info">
        <p><strong>Server ID:</strong> ${data.server.id}</p>
        <p><strong>Rules:</strong> ${data.rules.length}</p>
      </div>
      <div class="rules-preview" style="margin-top:var(--ft-sp-3)">
        <p><strong>Rules to import</strong></p>
        <ul>${rulesList}${more}</ul>
      </div>
    `;
    preview.style.display = 'block';
  }

  async handleImportServerCreate() {
    if (!this.importData) {
      Toast.error('Choose a configuration file first');
      return;
    }

    try {
      const { createServer, importRules } = await import('./api.js');
      await createServer({ id: this.importData.server.id });

      if (this.importData.rules.length > 0) {
        await importRules(this.importData.server.id, {
          mode: 'replace',
          rules: this.importData.rules
        });
      }

      track('server_created', { creation_mode: 'import' });
      this.drawer.close();
      await this.loadServers();
      this.renderServerList();
      this.router.navigateToServer(this.importData.server.id);
    } catch (error) {
      console.error('Import server creation failed:', error);
      Toast.error('Failed to create server from import');
    }
  }

  async deleteCurrentServer() {
    const serverId = this.router.currentServerId;
    if (!serverId) {
      Toast.error('No server selected');
      return;
    }

    try {
      const { deleteServer } = await import('./api.js');
      await deleteServer(serverId);
      track('server_deleted');
      this.drawer.close();
      this.router.navigateToServerList();
      await this.loadServers();
      this.renderServerList();
    } catch (error) {
      Toast.error(`Failed to delete server: ${error.message}`);
    }
  }

  getDrawer() {
    return this.drawer;
  }
}

const app = new App();

document.addEventListener('DOMContentLoaded', () => {
  app.init();
});

window.faultendApp = app;
