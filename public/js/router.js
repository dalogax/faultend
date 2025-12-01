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
      <div class="drawer-footer">
        <button id="deleteServerBtn" class="btn-danger">Delete Server</button>
      </div>
    `);
    drawer.open();
    
    const deleteBtn = document.getElementById('deleteServerBtn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        window.faultendApp.deleteCurrentServer();
      });
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
    document.getElementById('settingsBtn').style.display = 'block';
    
    // Trigger load event for both traffic and rules
    this.triggerViewLoad('traffic');
    this.triggerViewLoad('rules');
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
