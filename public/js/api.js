// API Client

import { API_BASE } from './config.js';

async function request(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return await response.text();
  } catch (error) {
    throw error;
  }
}

export async function fetchServers() {
  try {
    const response = await request(`${API_BASE.app}/api/servers`);
    return response.servers || [];
  } catch (error) {
    if (error.message && error.message.includes('502')) {
      return [];
    }
    throw error;
  }
}

export async function fetchServer(serverId) {
  return request(`${API_BASE.app}/api/servers/${serverId}`);
}

export async function createServer(serverData) {
  return request(`${API_BASE.app}/api/servers`, {
    method: 'POST',
    body: JSON.stringify(serverData)
  });
}

export async function deleteServer(serverId) {
  return request(`${API_BASE.app}/api/servers/${serverId}`, {
    method: 'DELETE'
  });
}

export async function fetchTraffic(serverId, filters = {}) {
  const params = new URLSearchParams(filters);
  const query = params.toString() ? `?${params}` : '';
  return request(`${API_BASE.app}/api/servers/${serverId}/traffic${query}`);
}

export async function fetchTrafficStats(serverId) {
  return request(`${API_BASE.app}/api/servers/${serverId}/traffic/stats`);
}

export async function fetchLiveStats(serverId) {
  return request(`${API_BASE.app}/api/servers/${serverId}/traffic/live-stats`);
}

export async function clearTraffic(serverId) {
  return request(`${API_BASE.app}/api/servers/${serverId}/traffic`, {
    method: 'DELETE'
  });
}

export async function fetchRules(serverId) {
  return request(`${API_BASE.app}/api/servers/${serverId}/rules`);
}

export async function createRule(serverId, ruleData) {
  return request(`${API_BASE.app}/api/servers/${serverId}/rules`, {
    method: 'POST',
    body: JSON.stringify(ruleData)
  });
}

export async function updateRule(serverId, ruleId, ruleData) {
  return request(`${API_BASE.app}/api/servers/${serverId}/rules/${ruleId}`, {
    method: 'PUT',
    body: JSON.stringify(ruleData)
  });
}

export async function deleteRule(serverId, ruleId) {
  return request(`${API_BASE.app}/api/servers/${serverId}/rules/${ruleId}`, {
    method: 'DELETE'
  });
}

export async function toggleRule(serverId, ruleId) {
  return request(`${API_BASE.app}/api/servers/${serverId}/rules/${ruleId}/toggle`, {
    method: 'PATCH'
  });
}

export async function reorderRules(serverId, orderedIds) {
  return request(`${API_BASE.app}/api/servers/${serverId}/rules/reorder`, {
    method: 'POST',
    body: JSON.stringify({ orderedIds })
  });
}

export async function exportRules(serverId) {
  return request(`${API_BASE.app}/api/servers/${serverId}/rules/export`, {
    method: 'POST'
  });
}

export async function importRules(serverId, importData) {
  return request(`${API_BASE.app}/api/servers/${serverId}/rules/import`, {
    method: 'POST',
    body: JSON.stringify(importData)
  });
}

export async function fetchMe() {
  return request(`${API_BASE.app}/api/auth/me`);
}

export async function logout() {
  return request(`${API_BASE.app}/api/auth/logout`, {
    method: 'POST'
  });
}

export async function generateInvite(serverId) {
  return request(`${API_BASE.app}/api/servers/${serverId}/invite`, {
    method: 'POST'
  });
}

export async function fetchInvite(serverId) {
  return request(`${API_BASE.app}/api/servers/${serverId}/invite`);
}

export async function updateBehaviour(serverId, body) {
  return request(`${API_BASE.app}/api/servers/${serverId}/behaviour`, {
    method: 'PATCH',
    body: JSON.stringify(body)
  });
}

export async function fetchStatsSummary() {
  return request(`${API_BASE.app}/api/stats/summary`);
}

export async function revokeInvite(serverId) {
  return request(`${API_BASE.app}/api/servers/${serverId}/invite`, {
    method: 'DELETE'
  });
}

export async function fetchCollaborators(serverId) {
  return request(`${API_BASE.app}/api/servers/${serverId}/invite/collaborators`);
}

export async function removeCollaborator(serverId, userId) {
  return request(`${API_BASE.app}/api/servers/${serverId}/invite/collaborators/${userId}`, {
    method: 'DELETE'
  });
}

export async function leaveServer(serverId) {
  return request(`${API_BASE.app}/api/servers/${serverId}/invite/collaborators/me`, {
    method: 'DELETE'
  });
}

export async function makeCollaboratorAdmin(serverId, userId) {
  return request(`${API_BASE.app}/api/servers/${serverId}/invite/collaborators/${userId}/admin`, {
    method: 'PUT'
  });
}

export async function removeCollaboratorAdmin(serverId, userId) {
  return request(`${API_BASE.app}/api/servers/${serverId}/invite/collaborators/${userId}/admin`, {
    method: 'DELETE'
  });
}

export async function transferOwnership(serverId, userId) {
  return request(`${API_BASE.app}/api/servers/${serverId}/invite/transfer-ownership/${userId}`, {
    method: 'POST'
  });
}

export async function previewInvite(token) {
  return request(`${API_BASE.app}/api/invite/${token}`);
}

export async function acceptInvite(token) {
  return request(`${API_BASE.app}/api/invite/${token}`, {
    method: 'POST'
  });
}
