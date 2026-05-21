// Main Application Entry Point

import { STORAGE_KEYS, buildSubdomainUrl } from './config.js';
import { fetchServers } from './api.js';
import { Toast } from './components.js';
import ViewRouter from './router.js';
import DrawerController from './drawer.js';
import { initTrafficView, loadTrafficData, stopTrafficPolling } from './views/traffic.js';
import { initRulesView, loadRulesData } from './views/rules.js';
import { authManager } from './auth.js';

class App {
  constructor() {
    this.router = null;
    this.drawer = null;
    this.servers = [];
    this.authReady = false;
  }

  async init() {
    console.log('Initializing faultend application...');

    await authManager.init();

    if (!authManager.isLoggedIn()) {
      this.showLoginOverlay();
      return;
    }

    this.hideLoginOverlay();
    this.setupUserDisplay();

    this.router = new ViewRouter();
    this.drawer = new DrawerController();

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
      overlay.style.display = 'flex';
    }
  }

  hideLoginOverlay() {
    const overlay = document.getElementById('loginOverlay');
    if (overlay) {
      overlay.style.display = 'none';
    }
    const mainContent = document.getElementById('mainContent');
    if (mainContent) {
      mainContent.style.visibility = 'visible';
    }
  }

  setupUserDisplay() {
    const user = authManager.getUser();
    if (!user) return;

    const userDisplay = document.getElementById('userDisplay');
    if (userDisplay) {
      userDisplay.innerHTML = `
        <span class="user-name">${user.name || user.email}</span>
        <button id="logoutBtn" class="btn-secondary">Logout</button>
      `;
      userDisplay.style.display = 'flex';

      const logoutBtn = document.getElementById('logoutBtn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', () => authManager.signOut());
      }
    }
  }

  async loadServers() {
    try {
      this.servers = await fetchServers();
      console.log('Loaded servers:', this.servers);
    } catch (error) {
      // Only show error toast for non-502 errors (502 is handled gracefully in fetchServers)
      if (!error.message || !error.message.includes('502')) {
        Toast.error('Failed to load servers');
      }
      this.servers = [];
    }
  }

  bindServerSelector() {
    // Server list interactions
    const serverListContent = document.getElementById('serverListContent');
    serverListContent.addEventListener('click', (e) => {
      const row = e.target.closest('.server-row');
      if (row) {
        const serverId = row.dataset.serverId;
        this.router.navigateToServer(serverId);
      }
    });
    
    // Create server button
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
        this.renderServerList();
      } else {
        this.loadViewData(view);
      }
    });
  }

  renderServerList() {
    const content = document.getElementById('serverListContent');
    console.log('Rendering server list, servers count:', this.servers.length);
    
    if (this.servers.length === 0) {
      content.innerHTML = '<p class="empty-state">No servers yet. Create your first fault server to get started.</p>';
      return;
    }
    
    const table = `
      <div class="server-table-container">
        <table class="server-table">
          <thead>
            <tr>
              <th>Server ID</th>
              <th>URL</th>
              <th>Role</th>
              <th>Shared</th>
              <th>Created</th>
              <th>Traffic</th>
              <th>Rules</th>
            </tr>
          </thead>
          <tbody>
            ${this.servers.map(server => {
              const serverUrl = buildSubdomainUrl(server.server_id);
              let roleBadge;
              if (server.is_owner) {
                roleBadge = '<span class="badge badge-owner">owner</span>';
              } else if (server.is_admin) {
                roleBadge = '<span class="badge badge-admin">admin</span>';
              } else {
                roleBadge = '<span class="badge badge-shared">shared</span>';
              }
              const sharedCount = parseInt(server.collaborators_count) || 0;
              const sharedCell = sharedCount > 0 ? sharedCount : 'No';
              return `
              <tr class="server-row" data-server-id="${server.server_id}">
                <td class="server-id">${server.server_id}</td>
                <td><span class="server-url">${serverUrl}</span></td>
                <td>${roleBadge}</td>
                <td>${sharedCell}</td>
                <td>${this.formatDate(server.created_at)}</td>
                <td>${server.traffic_count || 0}</td>
                <td>${server.rules_count || 0}</td>
              </tr>
            `}).join('')}
          </tbody>
        </table>
      </div>
    `;
    
    content.innerHTML = table;
  }

  formatDate(timestamp) {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    // Less than 1 minute
    if (diff < 60000) return 'Just now';
    
    // Less than 1 hour
    if (diff < 3600000) {
      const mins = Math.floor(diff / 60000);
      return `${mins} min${mins > 1 ? 's' : ''} ago`;
    }
    
    // Less than 24 hours
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
    
    // Format as date
    return date.toLocaleDateString();
  }

  loadViewData(view) {
    const serverId = this.router.currentServerId;
    
    if (!serverId) {
      console.log('No server selected');
      return;
    }

    console.log(`Loading data for view: ${view}, server: ${serverId}`);
    
    stopTrafficPolling();
    
    switch (view) {
      case 'traffic':
        loadTrafficData(serverId);
        break;
      case 'rules':
        loadRulesData(serverId);
        break;
      case 'config':
        loadConfigData(serverId);
        break;
    }
  }
  
  showCreateServerDialog() {
    this.currentTab = 'manual';
    this.importData = null;
    
    this.drawer.setTitle('Create New Server');
    this.drawer.setContent(this.renderServerForm());
    this.drawer.open();
    
    this.attachServerFormHandlers();
  }
  
  renderServerForm() {
    return `
      <div class="server-form-container">
        <div class="tabs">
          <button class="tab ${this.currentTab === 'manual' ? 'active' : ''}" 
                  data-tab="manual">Manual</button>
          <button class="tab ${this.currentTab === 'import' ? 'active' : ''}" 
                  data-tab="import">Import from File</button>
        </div>
        
        <div class="tab-content" id="manual-tab" 
             style="display: ${this.currentTab === 'manual' ? 'block' : 'none'}">
          <form id="manual-form" class="form">
            <div class="form-group">
              <label for="server-id">Server ID *</label>
              <input type="text" id="server-id" required 
                     pattern="^[a-z][a-z0-9\-]*$">
              <small>Alphanumeric and hyphens only, must start with letter</small>
              <div class="error-message" id="id-error"></div>
            </div>
            
            <div class="form-actions">
              <button type="button" class="btn-secondary" data-action="cancel">
                Cancel
              </button>
              <button type="submit" class="btn-primary">
                Create Server
              </button>
            </div>
          </form>
        </div>
        
        <div class="tab-content" id="import-tab" 
             style="display: ${this.currentTab === 'import' ? 'block' : 'none'}">
          <div class="import-form">
            <p>Upload a configuration file to create a new server with pre-configured rules.</p>
            
            <input type="file" id="import-file" accept=".json" style="display:none">
            <button id="choose-file-btn" class="btn-primary">
              Choose File
            </button>
            
            <div id="import-preview" style="display:none">
              <!-- Preview content inserted here -->
            </div>
            
            <div class="form-actions" id="import-actions" style="display:none">
              <button type="button" class="btn-secondary" data-action="cancel">
                Cancel
              </button>
              <button type="button" class="btn-primary" id="import-create-btn">
                Create Server
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  attachServerFormHandlers() {
    // Tab switching
    document.querySelectorAll('.tab').forEach(tab => {
      tab.onclick = () => {
        this.currentTab = tab.dataset.tab;
        this.drawer.setContent(this.renderServerForm());
        this.attachServerFormHandlers();
      };
    });
    
    // Manual form handlers
    const manualForm = document.getElementById('manual-form');
    if (manualForm) {
      manualForm.onsubmit = (e) => this.handleManualServerCreate(e);
    }
    
    // Import handlers
    const chooseFileBtn = document.getElementById('choose-file-btn');
    const fileInput = document.getElementById('import-file');
    if (chooseFileBtn && fileInput) {
      chooseFileBtn.onclick = () => fileInput.click();
      fileInput.onchange = (e) => this.handleFileSelect(e);
    }
    
    const importCreateBtn = document.getElementById('import-create-btn');
    if (importCreateBtn) {
      importCreateBtn.onclick = () => this.handleImportServerCreate();
    }
    
    // Cancel buttons
    document.querySelectorAll('[data-action="cancel"]').forEach(btn => {
      btn.onclick = () => this.drawer.close();
    });
  }
  
  validateServerId(id) {
    if (!/^[a-z][a-z0-9\-]*$/.test(id)) {
      return 'Must start with letter, contain only lowercase letters, numbers, and hyphens';
    }
    return null;
  }
  
  async checkServerIdExists(id) {
    return this.servers.some(s => s.server_id === id);
  }
  
  showError(elementId, message) {
    const errorEl = document.getElementById(elementId);
    if (errorEl) {
      errorEl.textContent = message;
    }
  }
  
  async handleManualServerCreate(event) {
    event.preventDefault();
    
    const id = document.getElementById('server-id').value.trim();
    
    // Validate ID format
    const formatError = this.validateServerId(id);
    if (formatError) {
      this.showError('id-error', formatError);
      return;
    }
    
    // Check if exists
    const exists = await this.checkServerIdExists(id);
    if (exists) {
      this.showError('id-error', 'Server ID already exists');
      return;
    }
    
    // Create server
    try {
      const { createServer } = await import('./api.js');
      await createServer({ id });
      this.drawer.close();
      
      // Refresh server list and navigate
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
      
      // Validate
      if (!this.validateImportData(data)) {
        Toast.error('Invalid configuration file');
        return;
      }
      
      // Check if server ID already exists
      const exists = await this.checkServerIdExists(data.server.id);
      if (exists) {
        Toast.error(`Server '${data.server.id}' already exists`);
        return;
      }
      
      // Store data and show preview
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
    return data &&
           data.version &&
           data.server &&
           data.server.id &&
           Array.isArray(data.rules);
  }
  
  showImportPreview(data) {
    const preview = document.getElementById('import-preview');
    const actions = document.getElementById('import-actions');
    
    const rulesList = data.rules
      .slice(0, 10)
      .map(r => `<li>${r.name} (${r.action}, priority ${r.priority})</li>`)
      .join('');
    
    const more = data.rules.length > 10 ? 
      `<li>... and ${data.rules.length - 10} more</li>` : '';
    
    preview.innerHTML = `
      <div class="preview-info">
        <p><strong>Server ID:</strong> ${data.server.id}</p>
        <p><strong>Name:</strong> ${data.server.name || '(none)'}</p>
        <p><strong>Rules:</strong> ${data.rules.length}</p>
      </div>
      
      <div class="rules-preview">
        <p><strong>Rules to import:</strong></p>
        <ul>${rulesList}${more}</ul>
      </div>
    `;
    
    preview.style.display = 'block';
    actions.style.display = 'flex';
  }
  
  async handleImportServerCreate() {
    if (!this.importData) {
      Toast.error('No file selected');
      return;
    }
    
    try {
      const { createServer, importRules } = await import('./api.js');
      
      // Create server first
      await createServer({
        id: this.importData.server.id
      });
      
      // Import rules if any
      if (this.importData.rules.length > 0) {
        await importRules(this.importData.server.id, {
          mode: 'replace',
          rules: this.importData.rules
        });
      }
      
      this.drawer.close();
      
      // Refresh and navigate
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
    
    const { ConfirmDialog } = await import('./components.js');
    const confirmed = await ConfirmDialog.show({
      title: 'Delete Server',
      message: `Are you sure you want to delete server "${serverId}"? This will permanently remove all traffic logs and rules.`,
      confirmText: 'Delete Server',
      cancelText: 'Cancel',
      danger: true
    });
    
    if (!confirmed) {
      return;
    }
    
    try {
      const { deleteServer } = await import('./api.js');
      await deleteServer(serverId);
      
      // Close drawer and navigate to server list
      this.drawer.close();
      this.router.navigateToServerList();
      
      // Reload servers
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

// Initialize application on DOM ready
const app = new App();

document.addEventListener('DOMContentLoaded', () => {
  app.init();
});

// Export for global access if needed
window.faultendApp = app;
