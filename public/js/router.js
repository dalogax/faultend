import { buildSubdomainUrl } from './config.js';
import { generateInvite, revokeInvite, fetchCollaborators, removeCollaborator, leaveServer, makeCollaboratorAdmin, removeCollaboratorAdmin, transferOwnership } from './api.js';
import { authManager } from './auth.js';
import { Icon } from './icons.js';

class ViewRouter {
  constructor() {
    this.currentServerId = null;
    this.serverListView = document.getElementById('serverListView');
    this.serverManagementView = document.getElementById('serverManagementView');
    this.statusBar = document.getElementById('statusBar');

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
      settingsBtn.addEventListener('click', () => this.openServerSettings());
    }
  }

  async openServerSettings() {
    const drawer = window.faultendApp.getDrawer();
    const app = window.faultendApp;
    const server = app.servers.find(s => s.server_id === this.currentServerId);
    const isOwner = server ? server.is_owner : false;
    const isAdmin = server ? server.is_admin : false;
    const canAdmin = isOwner || isAdmin;

    drawer.setHeader({ eyebrow: 'Server', title: `${this.currentServerId} · settings` });
    drawer.setContent(`
      <div class="settings-section">
        <h3>Identity</h3>
        <div class="form-field" style="margin-bottom:0">
          <label>Server ID</label>
          <input class="input input-mono" value="${this.currentServerId}" disabled>
          ${!isOwner ? `<span class="form-hint">You are ${isAdmin ? 'an admin' : 'a collaborator'} on this server.</span>` : ''}
        </div>
      </div>

      <div class="settings-section">
        <h3>Sharing</h3>
        ${canAdmin ? `
          <div id="inviteLinkContainer" class="invite-link-box" style="display:none">
            <code id="inviteLink"></code>
            <div class="invite-link-actions">
              <button id="copyInviteBtn" class="btn-ghost btn-sm">Copy link</button>
              <button id="revokeInviteBtn" class="btn-ghost btn-sm">Revoke</button>
            </div>
          </div>
          <button id="generateInviteBtn" class="btn-secondary btn-sm" style="margin-bottom:var(--ft-sp-4)">${Icon.plus} Generate invite link</button>
        ` : ''}
        <div id="collaboratorsList"></div>
      </div>
    `);
    drawer.setFooter(`
      <button id="exportConfigBtn" class="btn-ghost btn-sm">${Icon.copy} Export</button>
      ${isOwner
        ? '<button id="deleteServerBtn" class="btn-danger btn-sm">Delete server</button>'
        : '<button id="leaveServerBtn" class="btn-danger btn-sm">Leave server</button>'}
    `);
    drawer.open();

    document.getElementById('exportConfigBtn')?.addEventListener('click', () => this.exportServerConfig());
    document.getElementById('deleteServerBtn')?.addEventListener('click', () => app.deleteCurrentServer());
    document.getElementById('leaveServerBtn')?.addEventListener('click', () => this.leaveCurrentServer());

    if (canAdmin) {
      document.getElementById('generateInviteBtn')?.addEventListener('click', () => this.generateInviteLink());
      document.getElementById('revokeInviteBtn')?.addEventListener('click', () => this.revokeInviteLink());
      document.getElementById('copyInviteBtn')?.addEventListener('click', () => this.copyInviteLink());
    }

    this.loadCollaborators(isOwner);
  }

  async generateInviteLink() {
    try {
      const result = await generateInvite(this.currentServerId);
      document.getElementById('inviteLink').textContent = result.inviteUrl;
      document.getElementById('inviteLinkContainer').style.display = 'flex';
      document.getElementById('generateInviteBtn').style.display = 'none';
    } catch (error) {
      console.error('Failed to generate invite:', error);
      const { Toast } = await import('./components.js');
      Toast.error('Failed to generate invite link');
    }
  }

  async revokeInviteLink() {
    try {
      await revokeInvite(this.currentServerId);
      document.getElementById('inviteLinkContainer').style.display = 'none';
      document.getElementById('generateInviteBtn').style.display = 'inline-flex';
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
        btn.textContent = 'Copied';
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

      container.innerHTML = result.collaborators.map(c => {
        const isSelf = c.id === currentUserId;
        const isCollabOwner = c.role === 'owner';
        const roleClass = isCollabOwner ? 'owner' : c.role === 'admin' ? 'admin' : 'shared';
        const roleLabel = isCollabOwner ? 'owner' : c.role === 'admin' ? 'admin' : 'collaborator';
        const name = c.name || c.email;
        const actions = [];
        if (isOwner && !isCollabOwner) {
          actions.push(c.role === 'admin'
            ? `<button class="link-btn remove-admin" data-user-id="${c.id}">Remove admin</button>`
            : `<button class="link-btn make-admin" data-user-id="${c.id}">Make admin</button>`);
          actions.push(`<button class="link-btn transfer-ownership" data-user-id="${c.id}">Transfer</button>`);
        }
        if (canAdmin && !isCollabOwner && !isSelf) {
          actions.push(`<button class="link-btn danger remove-collaborator" data-user-id="${c.id}">Remove</button>`);
        }
        return `
          <div class="collab-row">
            <div class="collab-id">
              <span class="collab-avatar">${name.slice(0, 2).toUpperCase()}</span>
              <span class="collab-name">${name}</span>
              <span class="badge badge-${roleClass}">${roleLabel}</span>
            </div>
            <div class="collab-actions">${actions.join('')}</div>
          </div>
        `;
      }).join('');

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
        title: 'Leave server',
        message: 'Are you sure you want to leave this server? You will lose access to it.',
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
        title: 'Transfer ownership',
        message: 'Transfer ownership of this server? You will become an admin collaborator.',
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
        server: { id: server.server_id || this.currentServerId },
        rules,
        metadata: { rulesCount: rules.length, exportSource: 'faultend-ui' }
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
    this.serverListView.classList.add('active');
    this.serverListView.style.display = 'block';
    this.serverManagementView.classList.remove('active', 'fills');
    this.serverManagementView.style.display = 'none';
    document.getElementById('serverInfo').style.display = 'none';
    document.getElementById('settingsBtn').style.display = 'none';
    if (this.statusBar) this.statusBar.style.display = 'none';
    this.triggerViewLoad('serverList');
  }

  showServerManagement(serverId) {
    this.currentServerId = serverId;
    this.serverListView.classList.remove('active');
    this.serverListView.style.display = 'none';
    this.serverManagementView.classList.add('active', 'fills');
    this.serverManagementView.style.display = 'block';

    const serverInfo = document.getElementById('serverInfo');
    serverInfo.style.display = 'flex';

    const serverUrl = buildSubdomainUrl(serverId);
    document.getElementById('serverUrl').textContent = serverUrl;
    document.getElementById('settingsBtn').style.display = 'inline-flex';

    const copyBtn = document.getElementById('copyUrlBtn');
    if (copyBtn) {
      copyBtn.onclick = () => this.copyServerUrl(serverUrl);
    }

    this.updateStatusBar(serverId, serverUrl);

    this.triggerViewLoad('traffic');
    this.triggerViewLoad('rules');
  }

  updateStatusBar(serverId, serverUrl) {
    if (!this.statusBar) return;
    const server = window.faultendApp?.servers?.find(s => s.server_id === serverId);
    const host = serverUrl.replace(/^https?:\/\//, '');
    const traffic = server ? (parseInt(server.traffic_count) || 0) : 0;
    const rules = server ? (parseInt(server.rules_count) || 0) : 0;
    this.statusBar.innerHTML = `
      <span class="status-item"><span class="dot live"></span>proxy</span>
      <span class="sep"></span>
      <span class="status-item">${host}</span>
      <span class="spacer"></span>
      <span class="status-item">${traffic.toLocaleString()} req logged</span>
      <span class="sep"></span>
      <span class="status-item">${rules} rules</span>
    `;
    this.statusBar.style.display = 'flex';
  }

  async showInviteAcceptance(token) {
    try {
      const { previewInvite, acceptInvite } = await import('./api.js');
      const preview = await previewInvite(token);

      const drawer = window.faultendApp.getDrawer();
      drawer.setHeader({ eyebrow: 'Invitation', title: 'Join server' });
      drawer.setContent(`
        <div class="settings-section" style="margin-bottom:0">
          <p>You've been invited to collaborate on <strong class="text-strong">${preview.serverName}</strong>.</p>
          <p class="form-hint" style="margin-top:0">Owner · ${preview.ownerName}</p>
        </div>
      `);
      drawer.setFooter(`
        <button id="declineInviteBtn" class="btn-ghost btn-sm">Decline</button>
        <button id="acceptInviteBtn" class="btn btn-sm">Join server</button>
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
      const chip = document.getElementById('copyUrlBtn');
      chip.classList.add('copied');
      setTimeout(() => chip.classList.remove('copied'), 1000);
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
    window.dispatchEvent(new CustomEvent('viewload', { detail: { view: viewName } }));
  }
}

export default ViewRouter;
