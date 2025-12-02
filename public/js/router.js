// Client-Side Router

class ViewRouter {
  constructor() {
    this.currentServerId = null;
    this.serverListView = document.getElementById('serverListView');
    this.serverManagementView = document.getElementById('serverManagementView');
    
    this.bindEvents();
    this.route(); // Initial route
  }

  bindEvents() {
    // Hash change
    window.addEventListener('hashchange', () => this.route());
    
    // Logo click
    const logoLink = document.querySelector('.logo-link');
    if (logoLink) {
      logoLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.navigateToServerList();
      });
    }
    
    // Settings button
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        this.openServerSettings();
      });
    }
  }

  openServerSettings() {
    const drawer = window.faultendApp.getDrawer();
    drawer.setTitle('Server Settings');
    drawer.setContent(`
      <div class="settings-section">
        <p>Server ID: <strong>${this.currentServerId}</strong></p>
      </div>
      
      <div class="settings-section">
        <h3>Export Configuration</h3>
        <p>Download your server configuration as JSON for backup or sharing.</p>
        <button id="exportConfigBtn" class="btn-secondary">Export Configuration</button>
      </div>
      
      <div class="drawer-footer">
        <button id="deleteServerBtn" class="btn-danger">Delete Server</button>
      </div>
    `);
    drawer.open();
    
    const exportBtn = document.getElementById('exportConfigBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        this.exportServerConfig();
      });
    }
    
    const deleteBtn = document.getElementById('deleteServerBtn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        window.faultendApp.deleteCurrentServer();
      });
    }
  }
  
  async exportServerConfig() {
    try {
      const { fetchRules } = await import('./api.js');
      
      // Fetch rules
      const rulesData = await fetchRules(this.currentServerId);
      const rules = rulesData.rules || [];
      
      // Fetch server info from app servers list
      const servers = window.faultendApp?.servers || [];
      const server = servers.find(s => s.id === this.currentServerId) || { id: this.currentServerId };
      
      // Build export object
      const exportData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        server: {
          id: server.id,
          name: server.name || '',
          description: server.description || ''
        },
        rules: rules,
        metadata: {
          rulesCount: rules.length,
          exportSource: 'faultend-ui'
        }
      };
      
      // Download file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `faultend-${this.currentServerId}-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Export failed:', error);
      const { Toast } = await import('./components.js');
      Toast.error('Export failed');
    }
  }

  route() {
    const hash = window.location.hash.slice(1);
    
    // If no hash, show server list
    if (!hash) {
      this.showServerList();
      return;
    }
    
    // Parse hash: format is "server/{id}"
    const parts = hash.split('/');
    
    if (parts[0] === 'server' && parts[1]) {
      const serverId = parts[1];
      this.showServerManagement(serverId);
    } else {
      // Invalid hash, show server list
      this.showServerList();
    }
  }

  showServerList() {
    this.currentServerId = null;
    
    // Show server list view
    this.serverListView.style.display = 'block';
    this.serverManagementView.style.display = 'none';
    
    // Hide server info and settings button
    document.getElementById('serverInfo').style.display = 'none';
    document.getElementById('settingsBtn').style.display = 'none';
    
    // Trigger event
    this.triggerViewLoad('serverList');
  }
  
  showServerManagement(serverId) {
    this.currentServerId = serverId;
    
    // Hide server list, show management view
    this.serverListView.style.display = 'none';
    this.serverManagementView.style.display = 'block';
    
    // Show server info and settings button
    const serverInfo = document.getElementById('serverInfo');
    serverInfo.style.display = 'flex';
    serverInfo.querySelector('.server-name').textContent = serverId;
    
    // Set server URL
    const port = window.location.port ? `:${window.location.port}` : '';
    const protocol = window.location.protocol;
    const rootDomain = window.location.hostname.split('.').slice(1).join('.') || 'localhost';
    const serverUrl = `${protocol}//${serverId}.${rootDomain}${port}`;
    document.getElementById('serverUrl').textContent = serverUrl;
    
    document.getElementById('settingsBtn').style.display = 'block';
    
    // Bind copy URL button
    const copyBtn = document.getElementById('copyUrlBtn');
    if (copyBtn) {
      copyBtn.onclick = () => this.copyServerUrl(serverUrl);
    }
    
    // Trigger load event for both traffic and rules
    this.triggerViewLoad('traffic');
    this.triggerViewLoad('rules');
  }
  
  copyServerUrl(url) {
    navigator.clipboard.writeText(url).then(() => {
      const btn = document.getElementById('copyUrlBtn');
      const originalText = btn.textContent;
      btn.textContent = '✓';
      setTimeout(() => {
        btn.textContent = originalText;
      }, 1000);
    }).catch(err => {
      console.error('Failed to copy URL:', err);
    });
  }
  
  navigateToServer(serverId) {
    window.location.hash = `server/${serverId}`;
  }
  
  navigateToServerList() {
    window.location.hash = '';
  }

  triggerViewLoad(viewName) {
    // Dispatch custom event for view load
    const event = new CustomEvent('viewload', { detail: { view: viewName } });
    window.dispatchEvent(event);
  }
}

export default ViewRouter;
