// Config View Logic (Phase 10)

import { fetchRules } from '../api.js';
import { Toast } from '../components.js';
import { track } from '../analytics.js';

export function initConfigView() {
}

export async function loadConfigData(serverId) {
  const container = document.getElementById('config-content');
  if (!container) {
    console.error('Config content container not found');
    return;
  }
  
  container.innerHTML = renderConfigView(serverId);
  
  // Attach handler
  const exportBtn = document.getElementById('export-btn');
  if (exportBtn) {
    exportBtn.onclick = () => handleExport(serverId);
  }
}

function renderConfigView(serverId) {
  return `
    <div class="config-view">
      <section class="config-section">
        <h3>Export Configuration</h3>
        <p>Download your server configuration as JSON for backup or sharing.</p>
        <button id="export-btn" class="btn-primary">
          Export Configuration
        </button>
      </section>
    </div>
  `;
}

async function handleExport(serverId) {
  try {
    // Fetch rules
    const rules = await fetchRules(serverId);
    
    // Fetch server info from app servers list
    const servers = window.faultendApp?.servers || [];
    const server = servers.find(s => s.id === serverId) || { id: serverId };
    
    // Build export object
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
    
    // Download file
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `faultend-${serverId}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    track('config_exported');
    Toast.success('Configuration exported');
  } catch (error) {
    console.error('Export failed:', error);
    Toast.error('Export failed');
  }
}
