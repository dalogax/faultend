// Profile panel — account info, plan, quota, sign out, delete account

import { fetchQuota, deleteAccount } from '../api.js';
import { authManager } from '../auth.js';
import { Toast, escapeHtml } from '../components.js';

const PLAN_LABELS = { free: 'Free', pro: 'Pro' };

function formatNumber(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
  return n.toLocaleString();
}

function quotaBar(label, used, limit) {
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const warn = pct >= 80;
  const full = pct >= 100;
  return `
    <div class="quota-row">
      <div class="quota-label-row">
        <span class="quota-name">${label}</span>
        <span class="quota-value ${full ? 'quota-full' : warn ? 'quota-warn' : ''}">${formatNumber(used)} / ${formatNumber(limit)}</span>
      </div>
      <div class="quota-track">
        <div class="quota-fill ${full ? 'quota-fill-full' : warn ? 'quota-fill-warn' : ''}" style="width:${pct}%"></div>
      </div>
    </div>
  `;
}

function renderBody(user, quota) {
  const initials = escapeHtml((user.name || user.email || '??').slice(0, 2).toUpperCase());
  const planLabel = PLAN_LABELS[user.plan] || 'Free';

  const { usage, limits } = quota;

  return `
    <div class="profile-account">
      <span class="collab-avatar profile-avatar">${initials}</span>
      <div class="profile-identity">
        <span class="profile-name">${escapeHtml(user.name || '—')}</span>
        <span class="profile-email">${escapeHtml(user.email || '—')}</span>
      </div>
    </div>

    <div class="profile-section">
      <div class="profile-section-label">Plan</div>
      <div class="profile-plan-row">
        <span class="badge badge-plan-${escapeHtml(user.plan || 'free')}">${escapeHtml(planLabel)}</span>${user.isAdmin ? ' <span class="badge badge-platform-admin">admin</span>' : ''}
      </div>
    </div>

    <div class="profile-section">
      <div class="profile-section-label">Usage</div>
      ${quotaBar('Servers', usage.servers, limits.servers)}
      ${quotaBar('Rules', usage.rules, limits.rules)}
      ${quotaBar('Requests today', usage.requests_day, limits.requests_day)}
      ${quotaBar('Requests this week', usage.requests_week, limits.requests_week)}
      ${quotaBar('Requests this month', usage.requests_month, limits.requests_month)}
    </div>
  `;
}

function renderBodyLoading(user) {
  const initials = escapeHtml((user.name || user.email || '??').slice(0, 2).toUpperCase());
  return `
    <div class="profile-account">
      <span class="collab-avatar profile-avatar">${initials}</span>
      <div class="profile-identity">
        <span class="profile-name">${escapeHtml(user.name || '—')}</span>
        <span class="profile-email">${escapeHtml(user.email || '—')}</span>
      </div>
    </div>
    <div class="profile-section">
      <div class="profile-section-label">Usage</div>
      <p class="empty-state" style="padding:0;margin:var(--ft-sp-3) 0">Loading…</p>
    </div>
  `;
}

function renderFooter(confirmDelete = false) {
  if (confirmDelete) {
    return `
      <div class="profile-delete-confirm">
        <p class="profile-delete-warning">This will permanently delete your account, all servers, rules, and traffic logs. This cannot be undone.</p>
        <div class="profile-delete-actions">
          <button class="btn-ghost btn-sm" id="profileDeleteCancelBtn">Cancel</button>
          <button class="btn-danger btn-sm" id="profileDeleteConfirmBtn">Yes, delete everything</button>
        </div>
      </div>
    `;
  }
  return `
    <button class="btn-ghost btn-sm" id="profileSignOutBtn">Sign out</button>
    <button class="btn-danger btn-sm" id="profileDeleteBtn">Delete account</button>
  `;
}

export async function openProfilePanel(drawer) {
  const user = authManager.getUser();
  if (!user) return;

  drawer.setHeader({ title: 'Profile' });
  drawer.setContent(renderBodyLoading(user));
  drawer.setFooter(renderFooter(false));
  drawer.open();

  bindFooterActions(drawer, false);

  try {
    const quota = await fetchQuota();
    drawer.setContent(renderBody(user, quota));
  } catch (err) {
    console.error('[Profile] Failed to load quota:', err);
    // Leave loading state visible — non-fatal
  }
}

function bindFooterActions(drawer, confirmDelete) {
  if (confirmDelete) {
    const cancelBtn = document.getElementById('profileDeleteCancelBtn');
    const confirmBtn = document.getElementById('profileDeleteConfirmBtn');
    if (cancelBtn) cancelBtn.onclick = () => {
      drawer.setFooter(renderFooter(false));
      bindFooterActions(drawer, false);
    };
    if (confirmBtn) confirmBtn.onclick = async () => {
      confirmBtn.disabled = true;
      confirmBtn.textContent = 'Deleting…';
      try {
        await deleteAccount();
        // Clear local auth state and redirect to login
        localStorage.removeItem('lastAuthProvider');
        sessionStorage.removeItem('autoAuthRedirect');
        window.location.href = '/';
      } catch (err) {
        Toast.error('Failed to delete account');
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Yes, delete everything';
      }
    };
  } else {
    const signOutBtn = document.getElementById('profileSignOutBtn');
    const deleteBtn = document.getElementById('profileDeleteBtn');
    if (signOutBtn) signOutBtn.onclick = () => authManager.signOut();
    if (deleteBtn) deleteBtn.onclick = () => {
      drawer.setFooter(renderFooter(true));
      bindFooterActions(drawer, true);
    };
  }
}
