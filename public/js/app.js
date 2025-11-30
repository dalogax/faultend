// Main Application Entry Point

import { STORAGE_KEYS } from './config.js';
import { fetchServers } from './api.js';
import { Toast } from './components.js';
import ViewRouter from './router.js';
import DrawerController from './drawer.js';
import { initTrafficView, loadTrafficData } from './views/traffic.js';
import { initRulesView, loadRulesData } from './views/rules.js';
import { initConfigView, loadConfigData } from './views/config.js';

class App {
  constructor() {
    this.router = null;
    this.drawer = null;
    this.servers = [];
  }

  async init() {
    console.log('Initializing faultend application...');

    // Initialize router
    this.router = new ViewRouter();

    // Initialize drawer
    this.drawer = new DrawerController();

    // Initialize views
    initTrafficView();
    initRulesView();
    initConfigView();

    // Load servers
    await this.loadServers();

    // Bind server interactions
    this.bindServerSelector();

    // Listen for view changes
    this.bindViewLoad();

    // If we're on the server list view, render it now
    if (this.router.currentServerId === null) {
      this.renderServerList();
    }

    console.log('Application initialized');
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
    
    // Delete server button (in drawer)
    const deleteBtn = document.getElementById('deleteServerBtn');
    deleteBtn.addEventListener('click', () => {
      this.deleteCurrentServer();
    });
  }

  bindViewLoad() {
    window.addEventListener('viewload', (e) => {
      const view = e.detail.view;
      if (view === 'serverList') {
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
              <th>Traffic</th>
              <th>Rules</th>
            </tr>
          </thead>
          <tbody>
            ${this.servers.map(server => `
              <tr class="server-row" data-server-id="${server.id}">
                <td class="server-id">${server.id}</td>
                <td><a href="http://${server.id}.localhost:3000" target="_blank" class="server-url">http://${server.id}.localhost:3000</a></td>
                <td>${server.trafficCount || 0}</td>
                <td>${server.rulesCount || 0}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    
    content.innerHTML = table;
  }

  loadViewData(view) {
    const serverId = this.router.currentServerId;
    
    if (!serverId) {
      console.log('No server selected');
      return;
    }

    console.log(`Loading data for view: ${view}, server: ${serverId}`);
    
    // Load data based on current view
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
    // TODO: Implement create server dialog in drawer
    Toast.show('Create server dialog - to be implemented');
  }
  
  async deleteCurrentServer() {
    const serverId = this.router.currentServerId;
    if (!serverId) {
      Toast.error('No server selected');
      return;
    }
    
    if (!confirm(`Are you sure you want to delete server "${serverId}"? This will permanently remove all traffic logs and rules.`)) {
      return;
    }
    
    try {
      const { deleteServer } = await import('./api.js');
      await deleteServer(serverId);
      
      Toast.success(`Server "${serverId}" deleted`);
      
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
