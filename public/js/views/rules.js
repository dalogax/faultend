import { fetchRules, createRule, updateRule, deleteRule, toggleRule } from '../api.js';
import { Toast } from '../components.js';

let rulesList = null;

export function initRulesView() {
  console.log('Rules view initialized');
}

export function loadRulesData(serverId) {
  console.log('Loading rules data for server:', serverId);
  
  if (!rulesList) {
    rulesList = new RulesList('rules-content', serverId);
  } else {
    rulesList.serverId = serverId;
  }
  
  rulesList.load();
}

export function openRuleForm(serverId, trafficLog = null, existingRule = null) {
  const drawer = window.faultendApp.getDrawer();
  const form = new RuleForm(serverId, trafficLog, existingRule);
  
  drawer.setTitle(existingRule ? 'Edit Rule' : 'Create Rule');
  drawer.setContent(form.render());
  drawer.open();
  
  form.bindEvents();
}

class RulesList {
  constructor(containerId, serverId) {
    this.container = document.getElementById(containerId);
    this.serverId = serverId;
    this.rules = [];
  }

  async load() {
    try {
      const response = await fetchRules(this.serverId);
      this.rules = response.rules || [];
      this.render();
    } catch (error) {
      console.error('Failed to load rules:', error);
      if (!error.message.includes('502')) {
        Toast.error('Failed to load rules');
      }
      this.rules = [];
      this.render();
    }
  }

  render() {
    const html = `
      <div class="rules-container">
        <div class="rules-header">
          <h2>Rules</h2>
          <button class="btn" id="createRuleBtn">Create Rule</button>
        </div>
        
        ${this.rules.length === 0 ? this.renderEmptyState() : this.renderTable()}
      </div>
    `;
    
    this.container.innerHTML = html;
    this.bindEvents();
  }

  renderEmptyState() {
    return `
      <div class="empty-state">
        No rules configured yet. Create a rule to start routing traffic.
      </div>
    `;
  }

  renderTable() {
    const sortedRules = [...this.rules].sort((a, b) => b.priority - a.priority);
    
    return `
      <div class="rules-table-container">
        <table class="rules-table">
          <thead>
            <tr>
              <th>Priority</th>
              <th>Method</th>
              <th>Path Pattern</th>
              <th>Action</th>
              <th>Enabled</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${sortedRules.map(rule => this.renderTableRow(rule)).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  renderTableRow(rule) {
    const method = rule.method;
    const action = rule.action;
    
    return `
      <tr class="rule-row" data-rule-id="${rule.id}">
        <td class="priority-cell">${rule.priority}</td>
        <td><span class="badge badge-${method.toLowerCase()}">${method}</span></td>
        <td class="path-cell" title="${rule.pathRegex}">${this.truncatePath(rule.pathRegex)}</td>
        <td><span class="badge badge-action-${action}">${action}</span></td>
        <td>
          <label class="toggle-switch">
            <input type="checkbox" ${rule.enabled ? 'checked' : ''} data-rule-id="${rule.id}">
            <span class="toggle-slider"></span>
          </label>
        </td>
        <td class="actions-cell">
          <button class="btn-icon edit-rule-btn" data-rule-id="${rule.id}" title="Edit">✎</button>
          <button class="btn-icon delete-rule-btn" data-rule-id="${rule.id}" title="Delete">✕</button>
        </td>
      </tr>
    `;
  }

  truncatePath(path) {
    const maxLength = 40;
    if (path.length <= maxLength) return path;
    return path.substring(0, maxLength - 3) + '...';
  }

  bindEvents() {
    const createBtn = document.getElementById('createRuleBtn');
    if (createBtn) {
      createBtn.addEventListener('click', () => {
        openRuleForm(this.serverId);
      });
    }

    document.querySelectorAll('.toggle-switch input').forEach(toggle => {
      toggle.addEventListener('change', async (e) => {
        e.stopPropagation();
        const ruleId = e.target.dataset.ruleId;
        await this.toggleRule(ruleId, e.target.checked);
      });
    });

    document.querySelectorAll('.edit-rule-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const ruleId = btn.dataset.ruleId;
        this.editRule(ruleId);
      });
    });

    document.querySelectorAll('.delete-rule-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const ruleId = btn.dataset.ruleId;
        this.deleteRule(ruleId);
      });
    });
  }

  async toggleRule(ruleId, newState) {
    try {
      await toggleRule(this.serverId, ruleId);
      await this.load();
    } catch (error) {
      console.error('Failed to toggle rule:', error);
      Toast.error('Failed to toggle rule');
      await this.load();
    }
  }

  editRule(ruleId) {
    const rule = this.rules.find(r => r.id === ruleId);
    if (!rule) {
      Toast.error('Rule not found');
      return;
    }
    
    openRuleForm(this.serverId, null, rule);
  }

  async deleteRule(ruleId) {
    const rule = this.rules.find(r => r.id === ruleId);
    if (!rule) {
      Toast.error('Rule not found');
      return;
    }

    const { ConfirmDialog } = await import('../components.js');
    const confirmed = await ConfirmDialog.show({
      title: 'Delete Rule',
      message: `Delete rule "${rule.name}"? This cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      danger: true
    });

    if (!confirmed) {
      return;
    }

    try {
      await deleteRule(this.serverId, ruleId);
      await this.load();
    } catch (error) {
      console.error('Failed to delete rule:', error);
      Toast.error('Failed to delete rule');
    }
  }
}

class RuleForm {
  constructor(serverId, trafficLog = null, existingRule = null) {
    this.serverId = serverId;
    this.trafficLog = trafficLog;
    this.existingRule = existingRule;
    this.formData = this.initializeFormData();
    this.errors = {};
  }

  initializeFormData() {
    if (this.existingRule) {
      const latencySource = this.existingRule.action === 'proxy'
        ? this.existingRule.latency
        : this.existingRule.mockResponse?.latency;
      return {
        name: this.existingRule.name,
        priority: this.existingRule.priority,
        method: this.existingRule.method,
        pathRegex: this.existingRule.pathRegex,
        action: this.existingRule.action,
        enabled: this.existingRule.enabled !== false,
        target: this.existingRule.target || '',
        mockStatusCode: this.existingRule.mockResponse?.statusCode || 200,
        mockBody: JSON.stringify(this.existingRule.mockResponse?.body || {}, null, 2),
        latencyType: this.getLatencyType(latencySource),
        latencyValue: this.getLatencyValue(latencySource),
        latencyMin: latencySource?.min || 100,
        latencyMax: latencySource?.max || 500,
        transform: this.existingRule.transform || '',
        conditions: this.existingRule.conditions || []
      };
    } else if (this.trafficLog) {
      return {
        name: `${this.trafficLog.request.method} ${this.trafficLog.request.path}`,
        priority: this.suggestPriority(),
        method: this.trafficLog.request.method,
        pathRegex: this.convertPathToRegex(this.trafficLog.request.path),
        action: 'mock',
        enabled: true,
        target: this.trafficLog.target || '',
        mockStatusCode: this.trafficLog.response?.statusCode || 200,
        mockBody: JSON.stringify(this.trafficLog.response?.body || {}, null, 2),
        latencyType: 'none',
        latencyValue: 0,
        latencyMin: 100,
        latencyMax: 500,
        transform: '',
        conditions: []
      };
    } else {
      return {
        name: '',
        priority: this.suggestPriority(),
        method: '*',
        pathRegex: '.*',
        action: 'proxy',
        enabled: true,
        target: '',
        mockStatusCode: 200,
        mockBody: '{}',
        latencyType: 'none',
        latencyValue: 0,
        latencyMin: 100,
        latencyMax: 500,
        transform: '',
        conditions: []
      };
    }
  }

  suggestPriority() {
    return 100;
  }

  convertPathToRegex(path) {
    const escaped = path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return `^${escaped}$`;
  }

  getLatencyType(latency) {
    if (!latency) return 'none';
    if (typeof latency === 'number') return 'fixed';
    if (latency.type === 'fixed') return 'fixed';
    if (latency.type === 'range') return 'range';
    return 'none';
  }

  getLatencyValue(latency) {
    if (!latency) return 0;
    if (typeof latency === 'number') return latency;
    if (latency.value) return latency.value;
    return 0;
  }

  render() {
    return `
      <div class="rule-form">
        ${this.renderBasicFields()}
        ${this.renderActionFields()}
        ${this.renderTransformFields()}
        <div class="form-actions">
          <button type="button" class="btn" id="saveRuleBtn">Save Rule</button>
        </div>
      </div>
    `;
  }

  renderBasicFields() {
    return `
      <div class="form-section">
        <h3>Basic Information</h3>
        
        <div class="form-row">
          <div class="form-field">
            <label for="rulePriority">Priority *</label>
            <input type="number" id="rulePriority" class="input" value="${this.formData.priority}" min="1" required>
            <span class="form-hint">Higher priority rules are evaluated first</span>
            ${this.renderError('priority')}
          </div>
          
          <div class="form-field">
            <label for="ruleMethod">Method *</label>
            <select id="ruleMethod" class="input">
              <option value="*" ${this.formData.method === '*' ? 'selected' : ''}>* (All)</option>
              <option value="GET" ${this.formData.method === 'GET' ? 'selected' : ''}>GET</option>
              <option value="POST" ${this.formData.method === 'POST' ? 'selected' : ''}>POST</option>
              <option value="PUT" ${this.formData.method === 'PUT' ? 'selected' : ''}>PUT</option>
              <option value="PATCH" ${this.formData.method === 'PATCH' ? 'selected' : ''}>PATCH</option>
              <option value="DELETE" ${this.formData.method === 'DELETE' ? 'selected' : ''}>DELETE</option>
            </select>
          </div>
        </div>
        
        <div class="form-field">
          <label for="rulePathRegex">Path Pattern (regex) *</label>
          <input type="text" id="rulePathRegex" class="input" value="${this.formData.pathRegex}" required>
          <span class="form-hint">Example: ^/users/[0-9]+$</span>
          ${this.renderError('pathRegex')}
        </div>
        
        <div class="form-field">
          <label class="checkbox-label">
            <input type="checkbox" id="ruleEnabled" ${this.formData.enabled ? 'checked' : ''}>
            <span>Enabled</span>
          </label>
        </div>
      </div>
    `;
  }

  renderActionFields() {
    return `
      <div class="form-section">
        <h3>Action</h3>
        
        <div class="radio-group">
          <label class="radio-label">
            <input type="radio" name="action" value="proxy" ${this.formData.action === 'proxy' ? 'checked' : ''}>
            <span>Proxy to backend</span>
          </label>
          <label class="radio-label">
            <input type="radio" name="action" value="mock" ${this.formData.action === 'mock' ? 'checked' : ''}>
            <span>Mock response</span>
          </label>
        </div>
        
        <div id="proxyFields" class="conditional-fields" style="display: ${this.formData.action === 'proxy' ? 'block' : 'none'}">
          <div class="form-field">
            <label for="proxyTarget">Target URL *</label>
            <input type="text" id="proxyTarget" class="input" value="${this.formData.target}" placeholder="https://api.example.com">
            ${this.renderError('target')}
          </div>
        </div>

        <div id="mockFields" class="conditional-fields" style="display: ${this.formData.action === 'mock' ? 'block' : 'none'}">
          <div class="form-field">
            <label for="mockStatusCode">Status Code *</label>
            <input type="number" id="mockStatusCode" class="input" value="${this.formData.mockStatusCode}" min="100" max="599">
            ${this.renderError('mockStatusCode')}
          </div>

          <div class="form-field">
            <label for="mockBody">Response Body (JSON) *</label>
            <textarea id="mockBody" class="input" rows="8">${this.formData.mockBody}</textarea>
            <span class="form-hint">Use template variables: {{timestamp()}}, {{uuid()}}, {{random(1,100)}}</span>
            ${this.renderError('mockBody')}
          </div>
        </div>

        ${this.renderLatencyFields()}
      </div>
    `;
  }

  renderLatencyFields() {
    return `
      <div class="form-field">
        <label>Latency</label>
        <div class="radio-group">
          <label class="radio-label">
            <input type="radio" name="latencyType" value="none" ${this.formData.latencyType === 'none' ? 'checked' : ''}>
            <span>None</span>
          </label>
          <label class="radio-label">
            <input type="radio" name="latencyType" value="fixed" ${this.formData.latencyType === 'fixed' ? 'checked' : ''}>
            <span>Fixed</span>
          </label>
          <label class="radio-label">
            <input type="radio" name="latencyType" value="range" ${this.formData.latencyType === 'range' ? 'checked' : ''}>
            <span>Range</span>
          </label>
        </div>
      </div>

      <div id="latencyFixed" style="display: ${this.formData.latencyType === 'fixed' ? 'block' : 'none'}">
        <div class="form-field">
          <label for="latencyValue">Delay (ms)</label>
          <input type="number" id="latencyValue" class="input" value="${this.formData.latencyValue}" min="0">
        </div>
      </div>

      <div id="latencyRange" style="display: ${this.formData.latencyType === 'range' ? 'block' : 'none'}">
        <div class="form-row">
          <div class="form-field">
            <label for="latencyMin">Min (ms)</label>
            <input type="number" id="latencyMin" class="input" value="${this.formData.latencyMin}" min="0">
          </div>
          <div class="form-field">
            <label for="latencyMax">Max (ms)</label>
            <input type="number" id="latencyMax" class="input" value="${this.formData.latencyMax}" min="0">
          </div>
        </div>
      </div>
    `;
  }

  renderTransformFields() {
    const hasTransform = !!this.formData.transform;
    const defaultCode = `// res.status, res.headers, res.body are available
// Example: add a header and trim the body array
// res.headers['x-transformed'] = 'true';
// if (Array.isArray(res.body)) res.body = res.body.slice(0, 5);`;

    return `
      <div class="form-section">
        <h3>Transform</h3>
        <p class="form-hint" style="margin-bottom: 12px">Optional JavaScript that runs after the mock/proxy response is received and before latency is applied. Modify <code>res.status</code>, <code>res.headers</code>, or <code>res.body</code>.</p>

        <div class="form-field">
          <label class="checkbox-label">
            <input type="checkbox" id="transformEnabled" ${hasTransform ? 'checked' : ''}>
            <span>Enable transform</span>
          </label>
        </div>

        <div id="transformFields" style="display: ${hasTransform ? 'block' : 'none'}">
          <div class="form-field">
            <label for="transformCode">JavaScript code</label>
            <textarea id="transformCode" class="input" rows="8" style="font-family: monospace; font-size: 13px">${this.formData.transform || defaultCode}</textarea>
            ${this.renderError('transform')}
          </div>
        </div>
      </div>
    `;
  }

  renderError(field) {
    if (this.errors[field]) {
      return `<span class="form-error">${this.errors[field]}</span>`;
    }
    return '';
  }

  bindEvents() {
    const saveBtn = document.getElementById('saveRuleBtn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.save());
    }

    document.querySelectorAll('input[name="action"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.toggleActionFields(e.target.value);
      });
    });

    document.querySelectorAll('input[name="latencyType"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.toggleLatencyFields(e.target.value);
      });
    });

    const transformToggle = document.getElementById('transformEnabled');
    if (transformToggle) {
      transformToggle.addEventListener('change', (e) => {
        document.getElementById('transformFields').style.display = e.target.checked ? 'block' : 'none';
      });
    }
  }

  toggleActionFields(action) {
    const proxyFields = document.getElementById('proxyFields');
    const mockFields = document.getElementById('mockFields');
    
    if (action === 'proxy') {
      proxyFields.style.display = 'block';
      mockFields.style.display = 'none';
    } else {
      proxyFields.style.display = 'none';
      mockFields.style.display = 'block';
    }
  }

  toggleLatencyFields(type) {
    const fixedFields = document.getElementById('latencyFixed');
    const rangeFields = document.getElementById('latencyRange');

    fixedFields.style.display = type === 'fixed' ? 'block' : 'none';
    rangeFields.style.display = type === 'range' ? 'block' : 'none';
  }

  collectLatency(latencyType) {
    if (latencyType === 'fixed') {
      return { type: 'fixed', value: parseInt(document.getElementById('latencyValue').value) };
    }
    if (latencyType === 'range') {
      return {
        type: 'range',
        min: parseInt(document.getElementById('latencyMin').value),
        max: parseInt(document.getElementById('latencyMax').value)
      };
    }
    return null;
  }

  collectFormData() {
    const action = document.querySelector('input[name="action"]:checked').value;
    const latencyType = document.querySelector('input[name="latencyType"]:checked')?.value || 'none';
    
    const data = {
      priority: parseInt(document.getElementById('rulePriority').value),
      method: document.getElementById('ruleMethod').value,
      pathRegex: document.getElementById('rulePathRegex').value.trim(),
      enabled: document.getElementById('ruleEnabled').checked,
      action: action
    };

    const latency = this.collectLatency(latencyType);

    if (action === 'proxy') {
      data.target = document.getElementById('proxyTarget').value.trim();
      if (latency) data.latency = latency;
    } else {
      data.mockResponse = {
        statusCode: parseInt(document.getElementById('mockStatusCode').value),
        body: JSON.parse(document.getElementById('mockBody').value)
      };
      if (latency) data.mockResponse.latency = latency;
    }

    const transformEnabled = document.getElementById('transformEnabled')?.checked;
    if (transformEnabled) {
      const code = document.getElementById('transformCode')?.value?.trim();
      if (code) data.transform = code;
    } else {
      data.transform = null;
    }

    return data;
  }

  validate(data) {
    this.errors = {};

    if (!data.priority || data.priority < 1) {
      this.errors.priority = 'Priority must be a positive number';
    }

    if (!data.pathRegex) {
      this.errors.pathRegex = 'Path pattern is required';
    } else {
      try {
        new RegExp(data.pathRegex);
      } catch (e) {
        this.errors.pathRegex = 'Invalid regex pattern';
      }
    }

    if (data.action === 'proxy') {
      if (!data.target) {
        this.errors.target = 'Target URL is required for proxy action';
      } else {
        try {
          new URL(data.target);
        } catch (e) {
          this.errors.target = 'Invalid URL format';
        }
      }
    }

    if (data.action === 'mock') {
      if (!data.mockResponse.statusCode || data.mockResponse.statusCode < 100 || data.mockResponse.statusCode > 599) {
        this.errors.mockStatusCode = 'Status code must be between 100 and 599';
      }
    }

    return Object.keys(this.errors).length === 0;
  }

  async save() {
    try {
      const data = this.collectFormData();
      
      if (!this.validate(data)) {
        const drawer = window.faultendApp.getDrawer();
        drawer.setContent(this.render());
        this.bindEvents();
        Toast.error('Please fix validation errors');
        return;
      }

      if (this.existingRule) {
        await updateRule(this.serverId, this.existingRule.id, data);
      } else {
        await createRule(this.serverId, data);
      }

      const drawer = window.faultendApp.getDrawer();
      drawer.close();

      if (rulesList) {
        await rulesList.load();
      }
    } catch (error) {
      console.error('Failed to save rule:', error);
      
      if (error.message.includes('Invalid JSON')) {
        this.errors.mockBody = 'Invalid JSON format';
        const drawer = window.faultendApp.getDrawer();
        drawer.setContent(this.render());
        this.bindEvents();
      }
      
      Toast.error(`Failed to save rule: ${error.message}`);
    }
  }
}
