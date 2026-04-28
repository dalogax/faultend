import { buildSubdomainUrl } from './config.js';
import { generateInvite, revokeInvite, fetchCollaborators, removeCollaborator } from './api.js';

class ViewRouter {
  constructor() {
    this.currentServerId = null;
    this.serverListView = document.getElementById('serverListView');
    this.serverManagementView = document.getElementById('serverManagementView');
    
    this.bindEvents();
    this.route();
  }

  bindEvents() {
    window.addEventListener('hashchange', () => this.route());
    
    const logoLink = document.querySelector('.logo-link');
    if (logoLink) {
      logoLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.navigateToServerList();
      });
    }
    
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        this.openServerSettings();
      });
    }
  }

  async openServerSettings() {
    const drawer = window.faultendApp.getDrawer();
    const app = window.faultendApp;
    const server = app.servers.find(s => s.id === this.currentServerId);
    const isOwner = server ? server.is_owner : false;
    
    let sharingSection = '';
    if (isOwner) {
      sharingSection = `
        <div class="settings-section">
          <h3>Sharing</h3>
          <p>Invite others to collaborate on this server.</p>
          <div id="inviteLinkContainer" style="display: none; margin-bottom: var(--space-md);">
            <code id="inviteLink" style="display: block; padding: var(--space-sm); background: var(--color-background); margin-bottom: var(--space-sm); word-break: break-all;"></code>
            <button id="copyInviteBtn" class="btn-secondary">Copy Link</button>
            <button id="revokeInviteBtn" class="btn-secondary" style="margin-left: var(--space-sm);">Revoke</button>
          </div>
          <button id="generateInviteBtn" class="btn-secondary">Generate Invite Link</button>
          <div id="collaboratorsList" style="margin-top: var(--space-md);"></div>
        </div>
      `;
    }
    
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
      
      ${sharingSection}
      
      <div class="drawer-footer">
        ${isOwner ? `<button id="deleteServerBtn" class="btn-danger">Delete Server</button>` : ''}
      </div>
    `);
    drawer.open();
    
    const exportBtn = document.getElementById('exportConfigBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportServerConfig());
    }
    
    const deleteBtn = document.getElementById('deleteServerBtn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => app.deleteCurrentServer());
    }
    
    if (isOwner) {
      const generateBtn = document.getElementById('generateInviteBtn');
      if (generateBtn) {
        generateBtn.addEventListener('click', () => this.generateInviteLink());
      }
      
      const revokeBtn = document.getElementById('revokeInviteBtn');
      if (revokeBtn) {
        revokeBtn.addEventListener('click', () => this.revokeInviteLink());
      }
      
      const copyBtn = document.getElementById('copyInviteBtn');
      if (copyBtn) {
        copyBtn.addEventListener('click', () => this.copyInviteLink());
      }
      
      this.loadCollaborators();
    }
  }
  
  async generateInviteLink() {
    try {
      const result = await generateInvite(this.currentServerId);
      const container = document.getElementById('inviteLinkContainer');
      const linkEl = document.getElementById('inviteLink');
      const generateBtn = document.getElementById('generateInviteBtn');
      
      linkEl.textContent = result.inviteUrl;
      container.style.display = 'block';
      generateBtn.style.display = 'none';
    } catch (error) {
      console.error('Failed to generate invite:', error);
      const { Toast } = await import('./components.js');
      Toast.error('Failed to generate invite link');
    }
  }
  
  async revokeInviteLink() {
    try {
      await revokeInvite(this.currentServerId);
      const container = document.getElementById('inviteLinkContainer');
      const generateBtn = document.getElementById('generateInviteBtn');
      
      container.style.display = 'none';
      generateBtn.style.display = 'inline-block';
    } catch (error) {
      console.error('Failed to revoke invite:', error);
      const { Toast } = await import('./components.js');
      Toast.error('Failed to revoke invite link');
    }
  }
  
  copyInviteLink() {
    const linkEl = document.getElementById('inviteLink');
    if (linkEl) {
      navigator.clipboard.writeText(linkEl.textContent).then(() => {
        const btn = document.getElementById('copyInviteBtn');
        const originalText = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => btn.textContent = originalText, 1000);
      });
    }
  }
  
  async loadCollaborators() {
    try {
      const result = await fetchCollaborators(this.currentServerId);
      const container = document.getElementById('collaboratorsList');
      
      if (result.collaborators.length === 0) {
        container.innerHTML = '<p class="text-gray text-sm">No collaborators yet</p>';
        return;
      }
      
      container.innerHTML = `
        <p class="text-sm" style="margin-bottom: var(--space-sm);"><strong>Collaborators:</strong></p>
        ${result.collaborators.map(c => `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: var(--space-sm) 0; border-bottom: 1px solid var(--color-gray-light);">
            <span>${c.name || c.email}</span>
            <button class="btn-icon remove-collaborator" data-user-id="${c.id}">Remove</button>
          </div>
        `).join('')}
      `;
      
      container.querySelectorAll('.remove-collaborator').forEach(btn => {
        btn.addEventListener('click', (e) => this.removeCollaborator(e.target.dataset.userId));
      });
    } catch (error) {
      console.error('Failed to load collaborators:', error);
    }
  }
  
  async removeCollaborator(userId) {
    try {
      await removeCollaborator(this.currentServerId, userId);
      this.loadCollaborators();
    } catch (error) {
      console.error('Failed to remove collaborator:', error);
      const { Toast } = await import('./components.js');
      Toast.error('Failed to remove collaborator');
    }
  }
  
  async exportServerConfig() {
    try {
      const { fetchRules } = await import('./api.js');
      const rulesData = await fetchRules(this.currentServerId);
      const rules = rulesData.rules || [];
      const servers = window.faultendApp?.servers || [];
      const server = servers.find(s => s.id === this.currentServerId) || { id: this.currentServerId };
      
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
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
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
    
    if (!hash) {
      this.showServerList();
      return;
    }
    
    const parts = hash.split('/');
    
    if (parts[0] === 'server' && parts[1]) {
      this.showServerManagement(parts[1]);
    } else if (parts[0] === 'invite' && parts[1]) {
      this.showInviteAcceptance(parts[1]);
    } else {
      this.showServerList();
    }
  }

  showServerList() {
    this.currentServerId = null;
    this.serverListView.style.display = 'block';
    this.serverManagementView.style.display = 'none';
    document.getElementById('serverInfo').style.display = 'none';
    document.getElementById('settingsBtn').style.display = 'none';
    this.triggerViewLoad('serverList');
  }
  
  showServerManagement(serverId) {
    this.currentServerId = serverId;
    this.serverListView.style.display = 'none';
    this.serverManagementView.style.display = 'block';
    
    const serverInfo = document.getElementById('serverInfo');
    serverInfo.style.display = 'flex';
    serverInfo.querySelector('.server-name').textContent = serverId;
    
    const serverUrl = buildSubdomainUrl(serverId);
    document.getElementById('serverUrl').textContent = serverUrl;
    document.getElementById('settingsBtn').style.display = 'block';
    
    const copyBtn = document.getElementById('copyUrlBtn');
    if (copyBtn) {
      copyBtn.onclick = () => this.copyServerUrl(serverUrl);
    }
    
    this.triggerViewLoad('traffic');
    this.triggerViewLoad('rules');
  }
  
  async showInviteAcceptance(token) {
    try {
      const { previewInvite, acceptInvite } = await import('./api.js');
      const preview = await previewInvite(token);
      
      const drawer = window.faultendApp.getDrawer();
      drawer.setTitle('Server Invitation');
      drawer.setContent(`
        <div style="padding: var(--space-lg);">
          <p>You've been invited to collaborate on <strong>${preview.serverName}</strong></p>
          <p class="text-gray text-sm">Owner: ${preview.ownerName}</p>
          <div style="margin-top: var(--space-lg); display: flex; gap: var(--space-md);">
            <button id="acceptInviteBtn" class="btn-primary">Join Server</button>
            <button id="declineInviteBtn" class="btn-secondary">Decline</button>
          </div>
        </div>
      `);
      drawer.open();
      
      document.getElementById('acceptInviteBtn').addEventListener('click', async () => {
        try {
          const result = await acceptInvite(token);
          drawer.close();
          this.navigateToServer(result.serverId);
        } catch (error) {
          console.error('Failed to accept invite:', error);
          const { Toast } = await import('./components.js');
          Toast.error('Failed to join server');
        }
      });
      
      document.getElementById('declineInviteBtn').addEventListener('click', () => {
        drawer.close();
        this.navigateToServerList();
      });
    } catch (error) {
      console.error('Invalid invite:', error);
      const { Toast } = await import('./components.js');
      Toast.error('Invalid or expired invite link');
      this.navigateToServerList();
    }
  }
  
  copyServerUrl(url) {
    navigator.clipboard.writeText(url).then(() => {
      const btn = document.getElementById('copyUrlBtn');
      const originalText = btn.textContent;
      btn.textContent = '✓';
      setTimeout(() => btn.textContent = originalText, 1000);
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
    const event = new CustomEvent('viewload', { detail: { view: viewName } });
    window.dispatchEvent(event);
  }
}

export default ViewRouter;
