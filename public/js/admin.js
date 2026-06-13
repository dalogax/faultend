// Admin panel — platform admins only.
// "Platform admin" (users.is_admin) is separate from "server admin"
// (server_collaborators.role). This page manages the former.

import { API_BASE } from './config.js';
import { authManager } from './auth.js';
import { Toast } from './components.js';
import { initTheme, applyTheme, getEffectiveTheme } from './theme.js';

// ─── API helpers ─────────────────────────────────────────────────────────────

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE.app}${path}`, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.json();
}

async function fetchAdminUsers({ limit = 500 } = {}) {
  const params = new URLSearchParams({ limit });
  return apiFetch(`/api/admin/users?${params}`);
}

async function fetchAdminUser(id) {
  return apiFetch(`/api/admin/users/${id}`);
}

async function adminSetPlan(id, plan) {
  return apiFetch(`/api/admin/users/${id}/set-plan`, {
    method: 'POST',
    body: JSON.stringify({ plan })
  });
}

// ─── State ───────────────────────────────────────────────────────────────────

let allUsers = [];

// ─── Init ────────────────────────────────────────────────────────────────────

async function init() {
  applyTheme(getEffectiveTheme());

  await authManager.init();

  if (!authManager.isLoggedIn()) {
    window.location.href = '/';
    return;
  }

  const user = authManager.getUser();
  if (!user.isAdmin) {
    // Redirect non-admins silently rather than showing an error page
    window.location.href = '/';
    return;
  }

  // Wire profile button — clicking goes back to the main app
  const profileBtn = document.getElementById('profileBtn');
  if (profileBtn) {
    const initials = (user.name || user.email || '??').slice(0, 2).toUpperCase();
    profileBtn.textContent = initials;
    profileBtn.style.display = 'inline-flex';
    profileBtn.addEventListener('click', () => { window.location.href = '/'; });
  }

  initTheme();
  bindFilters();

  document.getElementById('backBtn').addEventListener('click', showUserList);

  await loadUsers();
}

// ─── Filters — client-side, instant ─────────────────────────────────────────

function bindFilters() {
  document.getElementById('searchInput').addEventListener('input', filterAndRender);
}

function filterAndRender() {
  const q = document.getElementById('searchInput').value.trim().toLowerCase();

  const filtered = q
    ? allUsers.filter(u =>
        (u.name  || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.plan  || '').toLowerCase().includes(q) ||
        String(u.server_count).includes(q) ||
        formatDate(u.created_at).toLowerCase().includes(q)
      )
    : allUsers;

  renderUserTable(filtered);
  updateStatLabel(filtered.length);
}

function updateStatLabel(shown) {
  const label = document.getElementById('adminStatLabel');
  if (!label) return;

  const total = allUsers.length;
  const q = document.getElementById('searchInput').value.trim();

  label.textContent = q && shown !== total
    ? `${shown} of ${total} user${total !== 1 ? 's' : ''}`
    : `${total} user${total !== 1 ? 's' : ''}`;
}

// ─── User list ───────────────────────────────────────────────────────────────

async function loadUsers() {
  const tbody = document.getElementById('userTableBody');
  tbody.innerHTML = `<tr><td colspan="5" class="admin-empty">Loading…</td></tr>`;

  try {
    const data = await fetchAdminUsers();
    allUsers = data.users;
    updateStatLabel(allUsers.length);
    filterAndRender();
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" class="admin-empty">Error: ${escapeHtml(err.message)}</td></tr>`;
  }
}

function renderUserTable(users) {
  const tbody = document.getElementById('userTableBody');

  if (!users.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="admin-empty">No users found.</td></tr>`;
    return;
  }

  tbody.innerHTML = users.map(u => `
    <tr data-user-id="${u.id}">
      <td>${escapeHtml(u.name || '—')}</td>
      <td class="num">${escapeHtml(u.email)}</td>
      <td>
        <span class="badge badge-plan-${escapeHtml(u.plan)}">${escapeHtml(u.plan)}</span>
        ${u.is_admin ? '<span class="badge badge-platform-admin">admin</span>' : ''}
      </td>
      <td class="num">${u.server_count}</td>
      <td class="muted">${formatDate(u.created_at)}</td>
    </tr>
  `).join('');

  tbody.querySelectorAll('tr[data-user-id]').forEach(row => {
    row.addEventListener('click', () => openUserDetail(row.dataset.userId));
  });
}

// ─── User detail ─────────────────────────────────────────────────────────────

async function openUserDetail(userId) {
  document.getElementById('userListView').style.display = 'none';
  document.getElementById('userDetailView').style.display = 'block';
  document.getElementById('detailName').textContent = '';
  document.getElementById('detailEmail').textContent = '';
  document.getElementById('detailContent').innerHTML = '<p class="admin-empty">Loading…</p>';

  try {
    const user = await fetchAdminUser(userId);
    renderUserDetail(user);
  } catch (err) {
    document.getElementById('detailContent').innerHTML = `<p class="admin-empty">Error: ${escapeHtml(err.message)}</p>`;
  }
}

function renderUserDetail(user) {
  document.getElementById('detailName').textContent = user.name || user.email;
  document.getElementById('detailEmail').textContent = user.email;

  const q = user.quota?.usage  || {};
  const l = user.quota?.limits || {};

  const providers = Array.isArray(user.providers) && user.providers.length
    ? user.providers.join(', ')
    : '—';

  document.getElementById('detailContent').innerHTML = `
    <div class="detail-card">
      <h3>Account</h3>
      <dl class="detail-dl">
        <dt>Email</dt>    <dd class="dd-mono">${escapeHtml(user.email)}</dd>
        <dt>Name</dt>     <dd>${escapeHtml(user.name || '—')}</dd>
        <dt>Providers</dt><dd>${escapeHtml(providers)}</dd>
        <dt>Joined</dt>   <dd class="dd-mono">${formatDate(user.created_at)}</dd>
        <dt>Platform admin</dt><dd>${user.is_admin
          ? '<span class="badge badge-platform-admin">admin</span>'
          : '<span class="badge badge-outline">no</span>'}</dd>
      </dl>
    </div>

    <div class="detail-card">
      <h3>Plan</h3>
      <div class="plan-current">
        <span class="badge badge-plan-${escapeHtml(user.plan)}">${escapeHtml(user.plan)}</span>
      </div>
      <div class="plan-actions">
        <button class="btn-ghost btn-sm" id="setPro"  ${user.plan === 'pro'  ? 'disabled' : ''}>Set Pro</button>
        <button class="btn-ghost btn-sm" id="setFree" ${user.plan === 'free' ? 'disabled' : ''}>Set Free</button>
      </div>
      <p class="detail-note">Plan is assigned manually by platform admins.</p>
    </div>

    <div class="detail-card">
      <h3>Quota</h3>
      <dl class="detail-dl">
        <dt>Servers owned</dt>   <dd class="dd-mono">${q.servers      ?? '—'} / ${l.servers       ?? '—'}</dd>
        <dt>Rules total</dt>     <dd class="dd-mono">${q.rules        ?? '—'} / ${l.rules         ?? '—'}</dd>
        <dt>Requests (24 h)</dt> <dd class="dd-mono">${q.requests_day ?? '—'} / ${l.requests_day  ?? '—'}</dd>
        <dt>Requests (7 d)</dt>  <dd class="dd-mono">${q.requests_week  ?? '—'} / ${l.requests_week  ?? '—'}</dd>
        <dt>Requests (30 d)</dt> <dd class="dd-mono">${q.requests_month ?? '—'} / ${l.requests_month ?? '—'}</dd>
      </dl>
    </div>
  `;

  document.getElementById('setPro')?.addEventListener('click', async () => {
    await changePlan(user.id, 'pro');
    openUserDetail(user.id);
  });

  document.getElementById('setFree')?.addEventListener('click', async () => {
    await changePlan(user.id, 'free');
    openUserDetail(user.id);
  });
}

async function changePlan(userId, plan) {
  try {
    await adminSetPlan(userId, plan);
    Toast.success(`Plan set to ${plan}`);
  } catch (err) {
    Toast.error(`Failed to update plan: ${err.message}`);
  }
}

function showUserList() {
  document.getElementById('userDetailView').style.display = 'none';
  document.getElementById('userListView').style.display = 'block';
}

// ─── Utils ───────────────────────────────────────────────────────────────────

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
}

// ─── Start ───────────────────────────────────────────────────────────────────

init().catch(console.error);
