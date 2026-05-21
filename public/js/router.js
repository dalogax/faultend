import { buildSubdomainUrl } from './config.js';
import { generateInvite, revokeInvite, fetchCollaborators, removeCollaborator, leaveServer, makeCollaboratorAdmin, removeCollaboratorAdmin, transferOwnership } from './api.js';
import { authManager } from './auth.js';

class ViewRouter {
  constructor() {
    this.currentServerId = null;
    this.serverListView = document.getElementById('serverListView');
    this.serverManagementView = document.getElementById('serverManagementView');
    
    this.bindEvents();
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
    const server = app.servers.find(s => s.server_id === this.currentServerId);
    const isOwner = server ? server.is_owner : false;
    const isAdmin = server ? server.is_admin : false;
    const canAdmin = isOwner || isAdmin;

    drawer.setTitle('Server Settings');
    drawer.setContent(`
      <div class="settings-section">
        <p>Server ID: <strong>${this.currentServerId}</strong></p>
        ${!isOwner ? `<p class="text-gray text-sm">You are ${isAdmin ? 'an admin' : 'a collaborator'} on this server.</p>` : ''}
      </div>

      <div class="settings-section">
        <h3>Export Configuration</h3>
        <p>Download your server configuration as JSON for backup or sharing.</p>
        <button id="exportConfigBtn" class="btn-secondary">Export Configuration</button>
      </div>

      <div class="settings-section">
        <h3>Sharing</h3>
        ${canAdmin ? `
          <p>Invite others to collaborate on this server.</p>
          <div id="inviteLinkContainer" style="display: none; margin-bottom: var(--space-md);">
            <code id="inviteLink" style="display: block; padding: var(--space-sm); background: var(--color-background); margin-bottom: var(--space-sm); word-break: break-all;"></code>
            <button id="copyInviteBtn" class="btn-secondary">Copy Link</button>
            <button id="revokeInviteBtn" class="btn-secondary" style="margin-left: var(--space-sm);">Revoke</button>
          </div>
          <button id="generateInviteBtn" class="btn-secondary">Generate Invite Link</button>
        ` : ''}
        <div id="collaboratorsList" style="margin-top: var(--space-md);"></div>
      </div>

      <div class="drawer-footer">
        ${isOwner ? `<button id="deleteServerBtn" class="btn-danger">Delete Server</button>` : ''}
        ${!isOwner ? `<button id="leaveServerBtn" class="btn-danger">Leave Server</button>` : ''}
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

    const leaveBtn = document.getElementById('leaveServerBtn');
    if (leaveBtn) {
      leaveBtn.addEventListener('click', () => this.leaveCurrentServer());
    }

    if (canAdmin) {
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
    }

    this.loadCollaborators(isOwner);
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
  
  async loadCollaborators(isOwner = false) {
    const container = document.getElementById('collaboratorsList');
    if (!container) return;
    try {
      const result = await fetchCollaborators(this.currentServerId);
      const app = window.faultendApp;
      const server = app.servers.find(s => s.server_id === this.currentServerId);
      const canAdmin = server ? (server.is_owner || server.is_admin) : false;
      const currentUserId = authManager.getUser()?.id;

      container.innerHTML = `
        <p class="text-sm" style="margin-bottom: var(--space-sm);"><strong>Members:</strong></p>
        ${result.collaborators.map(c => {
          const isSelf = c.id === currentUserId;
          const isCollabOwner = c.role === 'owner';
          return `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: var(--space-sm) 0; border-bottom: 1px solid var(--color-gray-light);">
            <div style="display: flex; align-items: center; gap: var(--space-sm);">
              <span>${c.name || c.email}</span>
              <span class="badge badge-${isCollabOwner ? 'owner' : c.role === 'admin' ? 'admin' : 'shared'}">${isCollabOwner ? 'owner' : c.role === 'admin' ? 'admin' : 'collaborator'}</span>
            </div>
            <div style="display: flex; gap: var(--space-sm);">
              ${isOwner && !isCollabOwner ? (c.role === 'admin'
                ? `<button class="btn-icon remove-admin" data-user-id="${c.id}">Remove Admin</button>`
                : `<button class="btn-icon make-admin" data-user-id="${c.id}">Make Admin</button>`)
                : ''}
              ${isOwner && !isCollabOwner ? `<button class="btn-icon transfer-ownership" data-user-id="${c.id}">Transfer Owner</button>` : ''}
              ${canAdmin && !isCollabOwner && !isSelf ? `<button class="btn-icon remove-collaborator" data-user-id="${c.id}">Remove</button>` : ''}
            </div>
          </div>
        `}).join('')}
      `;

      container.querySelectorAll('.remove-collaborator').forEach(btn => {
        btn.addEventListener('click', (e) => this.removeCollaborator(e.currentTarget.dataset.userId));
      });

      container.querySelectorAll('.make-admin').forEach(btn => {
        btn.addEventListener('click', (e) => this.makeAdmin(e.currentTarget.dataset.userId));
      });

      container.querySelectorAll('.remove-admin').forEach(btn => {
        btn.addEventListener('click', (e) => this.removeAdmin(e.currentTarget.dataset.userId));
      });

      container.querySelectorAll('.transfer-ownership').forEach(btn => {
        btn.addEventListener('click', (e) => this.transferOwnership(e.currentTarget.dataset.userId));
      });
    } catch (error) {
      console.error('Failed to load collaborators:', error);
    }
  }

  async removeCollaborator(userId) {
    try {
      await removeCollaborator(this.currentServerId, userId);
      const server = window.faultendApp?.servers?.find(s => s.server_id === this.currentServerId);
      this.loadCollaborators(server?.is_owner);
    } catch (error) {
      console.error('Failed to remove collaborator:', error);
      const { Toast } = await import('./components.js');
      Toast.error('Failed to remove collaborator');
    }
  }

  async leaveCurrentServer() {
    try {
      const { ConfirmDialog, Toast } = await import('./components.js');
      const confirmed = await ConfirmDialog.show({
        title: 'Leave Server',
        message: 'Are you sure you want to leave this server?',
        confirmText: 'Leave',
        cancelText: 'Cancel',
        danger: true
      });
      if (!confirmed) return;

      await leaveServer(this.currentServerId);
      window.faultendApp.getDrawer().close();
      await window.faultendApp.loadServers();
      window.faultendApp.renderServerList();
      this.navigateToServerList();
    } catch (error) {
      console.error('Failed to leave server:', error);
      const { Toast } = await import('./components.js');
      Toast.error('Failed to leave server');
    }
  }

  async makeAdmin(userId) {
    try {
      await makeCollaboratorAdmin(this.currentServerId, userId);
      this.loadCollaborators(true);
    } catch (error) {
      console.error('Failed to make admin:', error);
      const { Toast } = await import('./components.js');
      Toast.error('Failed to promote collaborator');
    }
  }

  async removeAdmin(userId) {
    try {
      await removeCollaboratorAdmin(this.currentServerId, userId);
      this.loadCollaborators(true);
    } catch (error) {
      console.error('Failed to remove admin:', error);
      const { Toast } = await import('./components.js');
      Toast.error('Failed to demote collaborator');
    }
  }

  async transferOwnership(userId) {
    try {
      const { ConfirmDialog } = await import('./components.js');
      const confirmed = await ConfirmDialog.show({
        title: 'Transfer Ownership',
        message: 'Are you sure you want to transfer ownership? You will become an admin collaborator.',
        confirmText: 'Transfer',
        cancelText: 'Cancel',
        danger: true
      });
      if (!confirmed) return;

      await transferOwnership(this.currentServerId, userId);
      const { Toast } = await import('./components.js');
      Toast.success('Ownership transferred');
      await window.faultendApp.loadServers();
      window.faultendApp.renderServerList();
      window.faultendApp.getDrawer().close();
    } catch (error) {
      console.error('Failed to transfer ownership:', error);
      const { Toast } = await import('./components.js');
      Toast.error('Failed to transfer ownership');
    }
  }
  
  async exportServerConfig() {
    try {
      const { fetchRules } = await import('./api.js');
      const rulesData = await fetchRules(this.currentServerId);
      const rules = rulesData.rules || [];
      const servers = window.faultendApp?.servers || [];
      const server = servers.find(s => s.server_id === this.currentServerId) || { server_id: this.currentServerId };
      
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
