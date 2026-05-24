import { buildSubdomainUrl } from './config.js';
import { generateInvite, revokeInvite, fetchInvite, fetchCollaborators, removeCollaborator, leaveServer, makeCollaboratorAdmin, removeCollaboratorAdmin, transferOwnership, fetchServer, updateBehaviour } from './api.js';
import { authManager } from './auth.js';
import { Icon } from './icons.js';
import { DangerConfirm } from './components.js';

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

    drawer.setHeader({
      eyebrow: 'Server',
      title: `${this.currentServerId} · settings`,
      sub: !isOwner ? `You are ${isAdmin ? 'an admin' : 'a collaborator'} on this server.` : null
    });
    drawer.setContent(`
      ${canAdmin ? `
      <div class="settings-section">
        <h3>Behaviour</h3>
        <div class="setting-row">
          <div class="setting-row-text">
            <div class="setting-row-title">Recording</div>
            <div class="setting-row-sub">Capture every request that flows through this proxy.</div>
          </div>
          <label class="toggle-switch"><input type="checkbox" id="recordingToggle"><span class="toggle-slider"></span></label>
        </div>
        <div class="form-field">
          <label for="defaultLatencyInput">Default latency · ms</label>
          <input type="number" id="defaultLatencyInput" class="input input-mono" min="0" style="width:140px">
          <span class="form-hint">Applies to requests with no per-rule latency configured.</span>
        </div>
        <div class="form-field" style="margin-bottom:0">
          <label for="preserveHeadersInput">Preserve headers</label>
          <input type="text" id="preserveHeadersInput" class="input input-mono" placeholder="authorization, x-request-id, x-trace">
          <span class="form-hint">Comma-separated. These are forwarded verbatim and protected from rule-level removal.</span>
        </div>
      </div>
      ` : ''}

      <div class="settings-section">
        <h3>Sharing</h3>
        <div id="collaboratorsList"></div>
        ${canAdmin ? `
          <div class="share-by-link">
            <div class="share-by-link-head">
              <div>
                <div class="share-by-link-title">Share by link</div>
                <div class="share-by-link-sub">Anyone with the link can join this server.</div>
              </div>
              <label class="toggle-switch"><input type="checkbox" id="shareByLinkToggle"><span class="toggle-slider"></span></label>
            </div>
            <div class="share-by-link-url" id="shareByLinkUrlRow" style="display:none">
              <code id="shareByLinkUrl" class="mono"></code>
              <button class="btn-ghost btn-sm" id="copyShareLinkBtn">${Icon.copy} Copy link</button>
            </div>
          </div>
        ` : ''}
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
    DangerConfirm.wire(document.getElementById('deleteServerBtn'), {
      idleText: 'Delete server',
      armedText: 'Click again to confirm',
      onConfirm: () => app.deleteCurrentServer()
    });
    DangerConfirm.wire(document.getElementById('leaveServerBtn'), {
      idleText: 'Leave server',
      armedText: 'Click again to confirm',
      onConfirm: () => this.leaveCurrentServer()
    });

    if (canAdmin) {
      this.initBehaviourSection();
      this.initShareByLink();
    }

    this.loadCollaborators(isOwner);
  }

  async initBehaviourSection() {
    const recording = document.getElementById('recordingToggle');
    const latency = document.getElementById('defaultLatencyInput');
    const preserve = document.getElementById('preserveHeadersInput');
    if (!recording || !latency || !preserve) return;

    try {
      const server = await fetchServer(this.currentServerId);
      recording.checked = server.recording_enabled !== false;
      latency.value = server.default_latency_ms ?? 0;
      preserve.value = server.preserve_headers ?? '';
    } catch (error) {
      console.error('Failed to load behaviour:', error);
    }

    const persist = async (patch) => {
      try {
        await updateBehaviour(this.currentServerId, patch);
      } catch (error) {
        console.error('Failed to save behaviour:', error);
        const { Toast } = await import('./components.js');
        Toast.error('Failed to save behaviour');
      }
    };

    recording.addEventListener('change', () => persist({ recordingEnabled: recording.checked }));
    latency.addEventListener('change', () => persist({ defaultLatencyMs: Math.max(0, parseInt(latency.value, 10) || 0) }));
    preserve.addEventListener('change', () => persist({ preserveHeaders: preserve.value }));
  }

  async initShareByLink() {
    const toggle = document.getElementById('shareByLinkToggle');
    const urlRow = document.getElementById('shareByLinkUrlRow');
    const urlEl  = document.getElementById('shareByLinkUrl');
    const copyBtn = document.getElementById('copyShareLinkBtn');
    if (!toggle) return;

    try {
      const { inviteUrl } = await fetchInvite(this.currentServerId);
      if (inviteUrl) {
        toggle.checked = true;
        urlEl.textContent = inviteUrl;
        urlRow.style.display = 'flex';
      }
    } catch (error) {
      console.error('Failed to read invite:', error);
    }

    toggle.addEventListener('change', async (e) => {
      if (e.target.checked) {
        try {
          const { inviteUrl } = await generateInvite(this.currentServerId);
          urlEl.textContent = inviteUrl;
          urlRow.style.display = 'flex';
        } catch (error) {
          console.error('Failed to enable share link:', error);
          toggle.checked = false;
          const { Toast } = await import('./components.js');
          Toast.error('Failed to enable share link');
        }
      } else {
        try {
          await revokeInvite(this.currentServerId);
          urlEl.textContent = '';
          urlRow.style.display = 'none';
        } catch (error) {
          console.error('Failed to disable share link:', error);
          toggle.checked = true;
          const { Toast } = await import('./components.js');
          Toast.error('Failed to disable share link');
        }
      }
    });

    copyBtn?.addEventListener('click', () => {
      navigator.clipboard.writeText(urlEl.textContent).then(() => {
        const original = copyBtn.innerHTML;
        copyBtn.textContent = 'Copied';
        setTimeout(() => copyBtn.innerHTML = original, 1000);
      });
    });
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
