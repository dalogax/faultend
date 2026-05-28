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

async function fetchAdminUsers({ page = 1, limit = 50, search = '', plan = '' } = {}) {
  const params = new URLSearchParams({ page, limit });
  if (search) params.set('search', search);
  if (plan) params.set('plan', plan);
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

let currentPage = 1;
let searchDebounce = null;

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

// ─── Filters ─────────────────────────────────────────────────────────────────

function bindFilters() {
  document.getElementById('searchInput').addEventListener('input', () => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => { currentPage = 1; loadUsers(); }, 300);
  });

  document.getElementById('planFilter').addEventListener('change', () => {
    currentPage = 1;
    loadUsers();
  });
}

// ─── User list ───────────────────────────────────────────────────────────────

async function loadUsers() {
  const search = document.getElementById('searchInput').value.trim();
  const plan   = document.getElementById('planFilter').value;
  const tbody  = document.getElementById('userTableBody');

  tbody.innerHTML = `<tr><td colspan="5" class="admin-empty">Loading…</td></tr>`;

  try {
    const data = await fetchAdminUsers({ page: currentPage, search, plan });
    renderUserTable(data.users);
    renderPagination(data.total, data.page, data.limit);

    const label = document.getElementById('adminStatLabel');
    if (label) label.textContent = `${data.total} user${data.total !== 1 ? 's' : ''}`;
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
      <td class="mono text-sm">${escapeHtml(u.email)}</td>
      <td>
        <span class="plan-badge plan-${escapeHtml(u.plan)}">${escapeHtml(u.plan)}</span>
        ${u.is_admin ? '<span class="badge-platform-admin">admin</span>' : ''}
      </td>
      <td>${u.server_count}</td>
      <td class="text-gray text-sm">${formatDate(u.created_at)}</td>
    </tr>
  `).join('');

  tbody.querySelectorAll('tr[data-user-id]').forEach(row => {
    row.addEventListener('click', () => openUserDetail(row.dataset.userId));
  });
}

function renderPagination(total, page, limit) {
  const container = document.getElementById('paginationRow');
  const totalPages = Math.ceil(total / limit);

  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = `
    <span>${total} users</span>
    <div class="pagination-btns">
      <button class="btn-ghost btn-sm" id="prevPage" ${page <= 1 ? 'disabled' : ''}>← Prev</button>
      <span class="text-sm text-gray">Page ${page} of ${totalPages}</span>
      <button class="btn-ghost btn-sm" id="nextPage" ${page >= totalPages ? 'disabled' : ''}>Next →</button>
    </div>
  `;

  container.querySelector('#prevPage')?.addEventListener('click', () => { currentPage--; loadUsers(); });
  container.querySelector('#nextPage')?.addEventListener('click', () => { currentPage++; loadUsers(); });
}

// ─── User detail ─────────────────────────────────────────────────────────────

async function openUserDetail(userId) {
  document.getElementById('userListView').style.display = 'none';
  document.getElementById('userDetailView').style.display = 'block';
  document.getElementById('detailName').textContent = '';
  document.getElementById('detailEmail').textContent = '';
  document.getElementById('detailContent').innerHTML = '<p class="text-gray">Loading…</p>';

  try {
    const user = await fetchAdminUser(userId);
    renderUserDetail(user);
  } catch (err) {
    document.getElementById('detailContent').innerHTML = `<p class="text-gray">Error: ${escapeHtml(err.message)}</p>`;
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
        <dt>Email</dt>    <dd class="mono">${escapeHtml(user.email)}</dd>
        <dt>Name</dt>     <dd>${escapeHtml(user.name || '—')}</dd>
        <dt>Providers</dt><dd>${escapeHtml(providers)}</dd>
        <dt>Joined</dt>   <dd>${formatDate(user.created_at)}</dd>
        <dt>Platform admin</dt><dd>${user.is_admin ? '✓ Yes' : 'No'}</dd>
      </dl>
    </div>

    <div class="detail-card">
      <h3>Plan</h3>
      <div class="plan-current">
        <span class="plan-badge plan-${escapeHtml(user.plan)}">${escapeHtml(user.plan)}</span>
      </div>
      <div class="plan-actions">
        <button class="btn-sm btn-ghost" id="setPro"  ${user.plan === 'pro'  ? 'disabled' : ''}>Set Pro</button>
        <button class="btn-sm btn-ghost" id="setFree" ${user.plan === 'free' ? 'disabled' : ''}>Set Free</button>
      </div>
      <p class="text-gray text-sm" style="margin-top:10px">
        Plan is assigned manually — no Stripe integration yet.
      </p>
    </div>

    <div class="detail-card">
      <h3>Quota</h3>
      <dl class="detail-dl">
        <dt>Servers owned</dt>   <dd>${q.servers      ?? '—'} / ${l.servers       ?? '—'}</dd>
        <dt>Rules total</dt>     <dd>${q.rules        ?? '—'} / ${l.rules         ?? '—'}</dd>
        <dt>Requests (24 h)</dt> <dd>${q.requests_day ?? '—'} / ${l.requests_day  ?? '—'}</dd>
        <dt>Requests (7 d)</dt>  <dd>${q.requests_week  ?? '—'} / ${l.requests_week  ?? '—'}</dd>
        <dt>Requests (30 d)</dt> <dd>${q.requests_month ?? '—'} / ${l.requests_month ?? '—'}</dd>
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
