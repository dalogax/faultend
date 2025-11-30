// Client-Side Router

class ViewRouter {
  constructor() {
    this.currentView = null;
    this.currentServerId = null;
    this.views = {
      traffic: document.getElementById('trafficView'),
      rules: document.getElementById('rulesView'),
      config: document.getElementById('configView')
    };
    this.serverListView = document.getElementById('serverListView');
    this.serverManagementView = document.getElementById('serverManagementView');
    this.navLinks = document.querySelectorAll('.nav-link');
    
    this.bindEvents();
    this.route(); // Initial route
  }

  bindEvents() {
    // Hash change
    window.addEventListener('hashchange', () => this.route());
    
    // Nav link clicks
    this.navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const view = link.dataset.view;
        this.navigate(view);
      });
    });
  }

  route() {
    const hash = window.location.hash.slice(1);
    
    // If no hash, show server list
    if (!hash) {
      this.showServerList();
      return;
    }
    
    // Parse hash: format is either "server/{id}" or "server/{id}/{view}"
    const parts = hash.split('/');
    
    if (parts[0] === 'server' && parts[1]) {
      const serverId = parts[1];
      const view = parts[2] || 'traffic';
      this.showServerManagement(serverId, view);
    } else {
      // Invalid hash, show server list
      this.showServerList();
    }
  }

  showServerList() {
    this.currentServerId = null;
    this.currentView = null;
    
    // Show server list view
    this.serverListView.style.display = 'block';
    this.serverManagementView.style.display = 'none';
    
    // Hide server info and nav tabs
    document.getElementById('serverInfo').style.display = 'none';
    document.getElementById('serverNavTabs').style.display = 'none';
    
    // Trigger event
    this.triggerViewLoad('serverList');
  }
  
  showServerManagement(serverId, viewName) {
    this.currentServerId = serverId;
    this.currentView = viewName;
    
    // Hide server list, show management view
    this.serverListView.style.display = 'none';
    this.serverManagementView.style.display = 'block';
    
    // Show server info and nav tabs
    const serverInfo = document.getElementById('serverInfo');
    serverInfo.style.display = 'flex';
    serverInfo.querySelector('.server-name').textContent = serverId;
    document.getElementById('serverNavTabs').style.display = 'flex';
    
    // Show correct sub-view
    this.showView(viewName);
  }

  showView(viewName) {
    // Hide all sub-views
    Object.values(this.views).forEach(view => {
      if (view) view.style.display = 'none';
    });
    
    // Show selected view
    const view = this.views[viewName];
    if (view) {
      view.style.display = 'block';
      this.updateNavigation(viewName);
      
      // Trigger view-specific load event
      this.triggerViewLoad(viewName);
    }
  }

  updateNavigation(viewName) {
    this.navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.dataset.view === viewName) {
        link.classList.add('active');
      }
    });
  }

  navigate(viewName) {
    if (this.currentServerId) {
      window.location.hash = `server/${this.currentServerId}/${viewName}`;
    } else {
      window.location.hash = viewName;
    }
  }
  
  navigateToServer(serverId, view = 'traffic') {
    window.location.hash = `server/${serverId}/${view}`;
  }
  
  navigateToServerList() {
    window.location.hash = '';
  }

  triggerViewLoad(viewName) {
    // Dispatch custom event for view load
    const event = new CustomEvent('viewload', { detail: { view: viewName } });
    window.dispatchEvent(event);
  }

  getCurrentView() {
    return this.currentView;
  }
}

export default ViewRouter;
