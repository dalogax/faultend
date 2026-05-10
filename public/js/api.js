// API Client

import { API_BASE } from './config.js';

/**
 * Generic request wrapper
 */
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

/**
 * Admin API - Fetch all fault servers
 */
export async function fetchServers() {
  try {
    const response = await request(`${API_BASE.app}/servers`);
    // API returns {servers: [...], count: n}
    return response.servers || [];
  } catch (error) {
    // Handle 502 errors gracefully (no matching rule means admin subdomain is not set up yet)
    if (error.message && error.message.includes('502')) {
      return []; // Return empty array when no servers exist
    }
    throw error;
  }
}

/**
 * Admin API - Create a fault server
 */
export async function createServer(serverData) {
  return request(`${API_BASE.app}/servers`, {
    method: 'POST',
    body: JSON.stringify(serverData)
  });
}

/**
 * Admin API - Delete a fault server
 */
export async function deleteServer(serverId) {
  return request(`${API_BASE.app}/servers/${serverId}`, {
    method: 'DELETE'
  });
}

/**
 * App API - Fetch traffic logs for a server
 */
export async function fetchTraffic(serverId, filters = {}) {
  const params = new URLSearchParams(filters);
  const query = params.toString() ? `?${params}` : '';
  return request(`${API_BASE.app}/servers/${serverId}/traffic${query}`);
}

/**
 * App API - Fetch traffic statistics
 */
export async function fetchTrafficStats(serverId) {
  return request(`${API_BASE.app}/servers/${serverId}/traffic/stats`);
}

/**
 * App API - Clear traffic logs
 */
export async function clearTraffic(serverId) {
  return request(`${API_BASE.app}/servers/${serverId}/traffic`, {
    method: 'DELETE'
  });
}

/**
 * App API - Fetch rules for a server
 */
export async function fetchRules(serverId) {
  return request(`${API_BASE.app}/servers/${serverId}/rules`);
}

/**
 * App API - Create a rule
 */
export async function createRule(serverId, ruleData) {
  return request(`${API_BASE.app}/servers/${serverId}/rules`, {
    method: 'POST',
    body: JSON.stringify(ruleData)
  });
}

/**
 * App API - Update a rule
 */
export async function updateRule(serverId, ruleId, ruleData) {
  return request(`${API_BASE.app}/servers/${serverId}/rules/${ruleId}`, {
    method: 'PUT',
    body: JSON.stringify(ruleData)
  });
}

/**
 * App API - Delete a rule
 */
export async function deleteRule(serverId, ruleId) {
  return request(`${API_BASE.app}/servers/${serverId}/rules/${ruleId}`, {
    method: 'DELETE'
  });
}

/**
 * App API - Toggle rule enabled/disabled
 */
export async function toggleRule(serverId, ruleId) {
  return request(`${API_BASE.app}/servers/${serverId}/rules/${ruleId}/toggle`, {
    method: 'PATCH'
  });
}

/**
 * App API - Export rules
 */
export async function exportRules(serverId) {
  return request(`${API_BASE.app}/servers/${serverId}/rules/export`, {
    method: 'POST'
  });
}

export async function importRules(serverId, importData) {
  return request(`${API_BASE.app}/servers/${serverId}/rules/import`, {
    method: 'POST',
    body: JSON.stringify(importData)
  });
}

export async function fetchMe() {
  return request(`${API_BASE.app}/auth/me`);
}

export async function logout() {
  return request(`${API_BASE.app}/auth/logout`, {
    method: 'POST'
  });
}

export async function generateInvite(serverId) {
  return request(`${API_BASE.app}/servers/${serverId}/invite`, {
    method: 'POST'
  });
}

export async function revokeInvite(serverId) {
  return request(`${API_BASE.app}/servers/${serverId}/invite`, {
    method: 'DELETE'
  });
}

export async function fetchCollaborators(serverId) {
  return request(`${API_BASE.app}/servers/${serverId}/invite/collaborators`);
}

export async function removeCollaborator(serverId, userId) {
  return request(`${API_BASE.app}/servers/${serverId}/invite/collaborators/${userId}`, {
    method: 'DELETE'
  });
}

export async function previewInvite(token) {
  return request(`${API_BASE.app}/invite/${token}`);
}

export async function acceptInvite(token) {
  return request(`${API_BASE.app}/invite/${token}`, {
    method: 'POST'
  });
}
