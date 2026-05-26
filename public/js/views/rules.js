import { fetchRules, createRule, updateRule, deleteRule, toggleRule, reorderRules } from '../api.js';
import { Toast, DangerConfirm } from '../components.js';
import { Icon, methodBadgeClass } from '../icons.js';
import { track } from '../analytics.js';

let rulesList = null;

export function initRulesView() {
  console.log('Rules view initialized');
}

export function getRuleById(id) {
  if (!rulesList || !id) return null;
  return rulesList.rules.find(r => r.id === id) || null;
}

export function ruleLabels(rule) {
  if (!rule) return [];
  const labels = [];
  if (rule.action === 'mock') labels.push('mock');
  if (rule.action === 'proxy') labels.push('proxy');
  const latency = rule.action === 'proxy' ? rule.latency : rule.mockResponse?.latency;
  if (latency) labels.push('delay');
  if (rule.transform) labels.push('transform');
  return labels;
}

export function renderLabelStack(labels) {
  if (!labels || labels.length === 0) return '';
  return `<span class="badge-stack">${labels.map(l => `<span class="badge badge-action-${l}">${l}</span>`).join('')}</span>`;
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

  drawer.setHeader({
    eyebrow: existingRule ? `Rule · on ${serverId}` : `New rule · on ${serverId}`,
    title: existingRule ? 'Edit rule' : 'Create rule',
    sub: 'Define how this server should respond to matched requests.'
  });
  drawer.setContent(form.render());
  drawer.setFooter(`
    <button type="button" class="btn-ghost btn-sm" id="cancelRuleBtn">Cancel</button>
    <button type="button" class="btn btn-sm" id="saveRuleBtn">Save rule</button>
  `);
  drawer.open();

  document.getElementById('saveRuleBtn').addEventListener('click', () => form.save());
  document.getElementById('cancelRuleBtn').addEventListener('click', () => drawer.close());
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
    this.container.innerHTML = `
      <div class="column-header">
        <div class="column-title">
          <h2>Rules</h2>
          <span class="count">${this.rules.length}</span>
        </div>
        <div class="column-actions">
          <button class="btn btn-sm" id="createRuleBtn">${Icon.plus} New rule</button>
        </div>
      </div>
      <div class="rules-container">
        <div class="rules-hint">Higher-priority rules evaluate first — the first match wins.</div>
        ${this.rules.length === 0
          ? this.renderEmptyState()
          : `<div class="rules-table-container">${this.renderTable()}</div>`}
      </div>
    `;
    this.bindEvents();
  }

  renderEmptyState() {
    return '<div class="empty-state">No rules configured yet. Create a rule to start routing traffic.</div>';
  }

  renderTable() {
    const sortedRules = [...this.rules].sort((a, b) => b.priority - a.priority);
    return `
      <table class="rules-table">
        <thead>
          <tr>
            <th class="drag-col"></th>
            <th style="width:46px">Pri</th>
            <th>Pattern</th>
            <th style="width:90px">Action</th>
            <th style="width:60px;text-align:right">Hits</th>
            <th style="width:50px">On</th>
            <th style="width:72px"></th>
          </tr>
        </thead>
        <tbody>
          ${sortedRules.map(rule => this.renderTableRow(rule)).join('')}
        </tbody>
      </table>
    `;
  }

  renderTableRow(rule) {
    const method = rule.method;
    const hits = typeof rule.hits === 'number' ? rule.hits : 0;
    return `
      <tr class="rule-row" draggable="true" data-rule-id="${rule.id}" style="opacity:${rule.enabled ? 1 : 0.55}">
        <td class="drag-cell" title="Drag to reorder">${Icon.drag}</td>
        <td class="priority-cell">${rule.priority}</td>
        <td>
          <div style="display:flex;align-items:center;gap:8px">
            <span class="badge badge-${methodBadgeClass(method)}">${method}</span>
            <span class="path-cell" title="${rule.pathRegex}">${rule.pathRegex}</span>
          </div>
        </td>
        <td>${renderLabelStack(ruleLabels(rule))}</td>
        <td class="num mono" style="text-align:right">${hits.toLocaleString()}</td>
        <td>
          <label class="toggle-switch">
            <input type="checkbox" ${rule.enabled ? 'checked' : ''} data-rule-id="${rule.id}">
            <span class="toggle-slider"></span>
          </label>
        </td>
        <td class="actions-cell">
          <button class="btn-icon edit-rule-btn" data-rule-id="${rule.id}" title="Edit">${Icon.edit}</button>
          <button class="btn-icon delete-rule-btn" data-rule-id="${rule.id}" title="Delete">${Icon.trash}</button>
        </td>
      </tr>
    `;
  }

  bindEvents() {
    document.getElementById('createRuleBtn')?.addEventListener('click', () => {
      openRuleForm(this.serverId);
    });

    document.querySelectorAll('.rules-table .toggle-switch input').forEach(toggle => {
      toggle.addEventListener('change', async (e) => {
        e.stopPropagation();
        await this.toggleRule(e.target.dataset.ruleId, e.target.checked);
      });
    });

    document.querySelectorAll('.edit-rule-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.editRule(btn.dataset.ruleId);
      });
    });

    this.bindDragReorder();

    document.querySelectorAll('.delete-rule-btn').forEach(btn => {
      DangerConfirm.wire(btn, {
        idleText: Icon.trash,
        armedText: Icon.trash,
        onConfirm: () => this.deleteRule(btn.dataset.ruleId)
      });
    });
  }

  bindDragReorder() {
    const tbody = document.querySelector('.rules-table tbody');
    if (!tbody) return;
    let dragging = null;
    let initialOrder = null;

    const currentOrder = () =>
      Array.from(tbody.querySelectorAll('tr.rule-row')).map(r => r.dataset.ruleId);

    const persistIfChanged = async () => {
      const ordered = currentOrder();
      if (!initialOrder || ordered.join(',') === initialOrder.join(',')) return;
      try {
        const result = await reorderRules(this.serverId, ordered);
        this.rules = result.rules || [];
        this.render();
      } catch (error) {
        console.error('Failed to reorder rules:', error);
        Toast.error('Failed to reorder rules');
        await this.load();
      }
    };

    tbody.querySelectorAll('tr.rule-row').forEach(row => {
      row.addEventListener('dragstart', (e) => {
        dragging = row;
        initialOrder = currentOrder();
        row.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        try { e.dataTransfer.setData('text/plain', row.dataset.ruleId); } catch (_) {}
      });
      // dragend always fires when drag terminates (drop, escape, off-window).
      // drop only fires if released over a valid target — too fragile to rely on.
      row.addEventListener('dragend', async () => {
        dragging?.classList.remove('dragging');
        dragging = null;
        await persistIfChanged();
        initialOrder = null;
      });
      row.addEventListener('dragover', (e) => {
        if (!dragging || dragging === row) return;
        e.preventDefault();
        const rect = row.getBoundingClientRect();
        const before = e.clientY < rect.top + rect.height / 2;
        tbody.insertBefore(dragging, before ? row : row.nextSibling);
      });
      row.addEventListener('drop', (e) => e.preventDefault());
    });
  }

  async toggleRule(ruleId, enabled) {
    try {
      await toggleRule(this.serverId, ruleId);
      track('rule_toggled', { enabled });
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

    try {
      await deleteRule(this.serverId, ruleId);
      track('rule_deleted', { action_type: rule.action });
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
      const latencyType = this.getLatencyType(latencySource);
      return {
        priority: this.existingRule.priority,
        method: this.existingRule.method,
        pathRegex: this.existingRule.pathRegex,
        action: this.existingRule.action,
        enabled: this.existingRule.enabled !== false,
        target: this.existingRule.target || '',
        mockStatusCode: this.existingRule.mockResponse?.statusCode || 200,
        mockBody: (() => { const b = this.existingRule.mockResponse?.body; if (b === undefined || b === null) return '{}'; return typeof b === 'string' ? b : JSON.stringify(b, null, 2); })(),
        latencyEnabled: latencyType !== 'none',
        latencyMode: latencyType === 'range' ? 'range' : 'fixed',
        latencyValue: this.getLatencyValue(latencySource) || 100,
        latencyMin: latencySource?.min || 100,
        latencyMax: latencySource?.max || 500,
        transformEnabled: !!this.existingRule.transform,
        transform: this.existingRule.transform || ''
      };
    }
    if (this.trafficLog) {
      return {
        priority: 100,
        method: this.trafficLog.request.method,
        pathRegex: this.convertPathToRegex(this.trafficLog.request.path),
        action: 'mock',
        enabled: true,
        target: this.trafficLog.target || '',
        mockStatusCode: this.trafficLog.response?.statusCode || 200,
        mockBody: (() => { const b = this.trafficLog.response?.body; if (b === undefined || b === null) return '{}'; return typeof b === 'string' ? b : JSON.stringify(b, null, 2); })(),
        latencyEnabled: false,
        latencyMode: 'fixed',
        latencyValue: 100,
        latencyMin: 100,
        latencyMax: 500,
        transformEnabled: false,
        transform: ''
      };
    }
    return {
      priority: 100,
      method: '*',
      pathRegex: '.*',
      action: 'proxy',
      enabled: true,
      target: '',
      mockStatusCode: 200,
      mockBody: '{}',
      latencyEnabled: false,
      latencyMode: 'fixed',
      latencyValue: 100,
      latencyMin: 100,
      latencyMax: 500,
      transformEnabled: false,
      transform: ''
    };
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
    const d = this.formData;
    return `
      <div class="rule-form">
        <div class="form-section">
          <h3>Match</h3>
          <div class="form-row" style="grid-template-columns:110px 1fr">
            <div class="form-field">
              <label for="rulePriority">Priority<span class="req">*</span></label>
              <input type="number" id="rulePriority" class="input input-mono" value="${d.priority}" min="1">
              ${this.renderError('priority')}
            </div>
            <div class="form-field">
              <label for="ruleMethod">Method</label>
              <select id="ruleMethod" class="input">
                ${['*', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map(m =>
                  `<option value="${m}" ${d.method === m ? 'selected' : ''}>${m === '*' ? '* (Any method)' : m}</option>`
                ).join('')}
              </select>
            </div>
          </div>
          <div class="form-field">
            <label for="rulePathRegex">Path pattern<span class="req">*</span></label>
            <input type="text" id="rulePathRegex" class="input input-mono" value="${d.pathRegex}">
            <span class="form-hint">JavaScript-flavoured regex · evaluated against the request path.</span>
            ${this.renderError('pathRegex')}
          </div>
          <label class="checkbox-label">
            <span class="toggle-switch"><input type="checkbox" id="ruleEnabled" ${d.enabled ? 'checked' : ''}><span class="toggle-slider"></span></span>
            Enabled
          </label>
        </div>

        <div class="form-section">
          <h3>Action</h3>
          <div class="seg-control" id="actionSeg">
            <button type="button" class="seg-option ${d.action === 'proxy' ? 'active' : ''}" data-action="proxy">
              <span class="dot" style="background:var(--ft-a-proxy-fg)"></span> Proxy
            </button>
            <button type="button" class="seg-option ${d.action === 'mock' ? 'active' : ''}" data-action="mock">
              <span class="dot" style="background:var(--ft-a-mock-fg)"></span> Mock
            </button>
          </div>

          <div id="proxyFields" class="conditional-fields" style="display:${d.action === 'proxy' ? 'block' : 'none'}">
            <div class="form-field" style="margin-bottom:0">
              <label for="proxyTarget">Target URL<span class="req">*</span></label>
              <input type="text" id="proxyTarget" class="input input-mono" value="${d.target}" placeholder="https://api.yourapp.com">
              <span class="form-hint">Where matched requests are forwarded.</span>
              ${this.renderError('target')}
            </div>
          </div>

          <div id="mockFields" class="conditional-fields" style="display:${d.action === 'mock' ? 'block' : 'none'}">
            <div class="form-field">
              <label for="mockStatusCode">Status code<span class="req">*</span></label>
              <input type="number" id="mockStatusCode" class="input input-mono" value="${d.mockStatusCode}" min="100" max="599" style="width:120px">
              ${this.renderError('mockStatusCode')}
            </div>
            <div class="form-field" style="margin-bottom:0">
              <label for="mockBody">Response body<span id="mockBodyJsonIndicator" class="json-indicator"></span></label>
              <div class="mock-body-editor">
                <textarea id="mockBody" class="input" rows="6">${d.mockBody.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</textarea>
              </div>
              <span class="form-hint">Any text payload. Supports <code>{{timestamp()}}</code>, <code>{{uuid()}}</code>, <code>{{random(min,max)}}</code>. Valid JSON is sent with <code>application/json</code>; otherwise <code>text/plain</code>.</span>
              ${this.renderError('mockBody')}
            </div>
          </div>
        </div>

        <div class="form-section">
          <h3>Transform
            <label class="toggle-switch"><input type="checkbox" id="transformEnabled" ${d.transformEnabled ? 'checked' : ''}><span class="toggle-slider"></span></label>
          </h3>
          <p class="form-hint" style="margin-top:0;margin-bottom:var(--ft-sp-4)">Run JavaScript on the response before it returns to the client. Mutate <code>res.status</code>, <code>res.headers</code>, or <code>res.body</code>.</p>
          <div id="transformFields" style="display:${d.transformEnabled ? 'block' : 'none'}">
            <div class="code-editor">
              <textarea id="transformCode" rows="6" spellcheck="false">${d.transform || this.defaultTransform()}</textarea>
              <div class="code-editor-foot">runs after mock or proxy · before latency · sandboxed</div>
            </div>
            ${this.renderError('transform')}
          </div>
        </div>

        <div class="form-section">
          <h3>Latency
            <label class="toggle-switch"><input type="checkbox" id="latencyEnabled" ${d.latencyEnabled ? 'checked' : ''}><span class="toggle-slider"></span></label>
          </h3>
          <div id="latencyFields" style="display:${d.latencyEnabled ? 'block' : 'none'}">
            <div class="seg-control" id="latencySeg" style="margin-bottom:var(--ft-sp-4)">
              <button type="button" class="seg-option ${d.latencyMode === 'fixed' ? 'active' : ''}" data-mode="fixed">Fixed</button>
              <button type="button" class="seg-option ${d.latencyMode === 'range' ? 'active' : ''}" data-mode="range">Range</button>
            </div>
            <div id="latencyFixed" style="display:${d.latencyMode === 'fixed' ? 'block' : 'none'}">
              <div class="form-field" style="margin-bottom:0">
                <label for="latencyValue">Delay · ms</label>
                <input type="number" id="latencyValue" class="input input-mono" value="${d.latencyValue}" min="0" style="width:120px">
              </div>
            </div>
            <div id="latencyRange" style="display:${d.latencyMode === 'range' ? 'block' : 'none'}">
              <div class="form-row">
                <div class="form-field" style="margin-bottom:0">
                  <label for="latencyMin">Min · ms</label>
                  <input type="number" id="latencyMin" class="input input-mono" value="${d.latencyMin}" min="0">
                </div>
                <div class="form-field" style="margin-bottom:0">
                  <label for="latencyMax">Max · ms</label>
                  <input type="number" id="latencyMax" class="input input-mono" value="${d.latencyMax}" min="0">
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  defaultTransform() {
    return `// res.status, res.headers, res.body are mutable\n// res.headers['x-faultend-touched'] = '1';`;
  }

  renderError(field) {
    return this.errors[field] ? `<span class="form-error">${this.errors[field]}</span>` : '';
  }

  bindEvents() {
    document.querySelectorAll('#actionSeg .seg-option').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        this.formData.action = action;
        document.querySelectorAll('#actionSeg .seg-option').forEach(b =>
          b.classList.toggle('active', b === btn));
        document.getElementById('proxyFields').style.display = action === 'proxy' ? 'block' : 'none';
        document.getElementById('mockFields').style.display = action === 'mock' ? 'block' : 'none';
        if (action === 'mock' && this._mockBodyEditor) {
          setTimeout(() => this._mockBodyEditor.refresh(), 0);
        }
      });
    });

    document.querySelectorAll('#latencySeg .seg-option').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        this.formData.latencyMode = mode;
        document.querySelectorAll('#latencySeg .seg-option').forEach(b =>
          b.classList.toggle('active', b === btn));
        document.getElementById('latencyFixed').style.display = mode === 'fixed' ? 'block' : 'none';
        document.getElementById('latencyRange').style.display = mode === 'range' ? 'block' : 'none';
      });
    });

    document.getElementById('transformEnabled')?.addEventListener('change', (e) => {
      document.getElementById('transformFields').style.display = e.target.checked ? 'block' : 'none';
    });

    document.getElementById('latencyEnabled')?.addEventListener('change', (e) => {
      document.getElementById('latencyFields').style.display = e.target.checked ? 'block' : 'none';
    });

    this._initMockBodyEditor();
  }

  _initMockBodyEditor() {
    const el = document.getElementById('mockBody');
    if (!el || typeof CodeMirror === 'undefined') return;

    this._mockBodyEditor = CodeMirror.fromTextArea(el, {
      mode: { name: 'javascript', json: true },
      lineNumbers: false,
      lineWrapping: true,
      tabSize: 2,
      indentWithTabs: false,
      autofocus: false,
      extraKeys: { Tab: cm => cm.execCommand('indentMore'), 'Shift-Tab': cm => cm.execCommand('indentLess') }
    });

    this._mockBodyEditor.on('change', () => this._updateJsonIndicator());
    this._updateJsonIndicator();

    // If mock fields are currently visible, ensure CM renders properly
    const mockFields = document.getElementById('mockFields');
    if (mockFields && mockFields.style.display !== 'none') {
      setTimeout(() => this._mockBodyEditor.refresh(), 0);
    }
  }

  _updateJsonIndicator() {
    const indicator = document.getElementById('mockBodyJsonIndicator');
    if (!indicator) return;
    const val = this._mockBodyEditor ? this._mockBodyEditor.getValue() : (document.getElementById('mockBody')?.value || '');
    const trimmed = val.trim();
    if (!trimmed) {
      indicator.textContent = '';
      indicator.className = 'json-indicator';
      return;
    }
    try {
      JSON.parse(trimmed);
      indicator.textContent = '✓ valid json';
      indicator.className = 'json-indicator valid';
    } catch {
      indicator.textContent = 'plain text';
      indicator.className = 'json-indicator invalid';
    }
  }

  collectLatency() {
    if (!document.getElementById('latencyEnabled')?.checked) return null;
    const mode = this.formData.latencyMode;
    if (mode === 'range') {
      return {
        type: 'range',
        min: parseInt(document.getElementById('latencyMin').value),
        max: parseInt(document.getElementById('latencyMax').value)
      };
    }
    return { type: 'fixed', value: parseInt(document.getElementById('latencyValue').value) };
  }

  collectFormData() {
    const action = this.formData.action;
    const data = {
      priority: parseInt(document.getElementById('rulePriority').value),
      method: document.getElementById('ruleMethod').value,
      pathRegex: document.getElementById('rulePathRegex').value.trim(),
      enabled: document.getElementById('ruleEnabled').checked,
      action
    };

    const latency = this.collectLatency();

    if (action === 'proxy') {
      data.target = document.getElementById('proxyTarget').value.trim();
      if (latency) data.latency = latency;
    } else {
      const rawBody = this._mockBodyEditor
        ? this._mockBodyEditor.getValue()
        : (document.getElementById('mockBody')?.value || '');
      data.mockResponse = {
        statusCode: parseInt(document.getElementById('mockStatusCode').value),
        body: rawBody
      };
      if (latency) data.mockResponse.latency = latency;
    }

    if (document.getElementById('transformEnabled')?.checked) {
      const code = document.getElementById('transformCode')?.value?.trim();
      data.transform = code || null;
    } else {
      data.transform = null;
    }

    return data;
  }

  validate(data) {
    this.errors = {};

    if (!data.priority || data.priority < 1) {
      this.errors.priority = 'Priority must be a positive number.';
    }
    if (!data.pathRegex) {
      this.errors.pathRegex = 'Path pattern is required.';
    } else {
      try {
        new RegExp(data.pathRegex);
      } catch (e) {
        this.errors.pathRegex = 'Invalid regex pattern.';
      }
    }
    if (data.action === 'proxy') {
      if (!data.target) {
        this.errors.target = 'Target URL is required for a proxy rule.';
      } else {
        try {
          new URL(data.target);
        } catch (e) {
          this.errors.target = 'Must be a valid http(s):// URL.';
        }
      }
    }
    if (data.action === 'mock') {
      const code = data.mockResponse.statusCode;
      if (!code || code < 100 || code > 599) {
        this.errors.mockStatusCode = 'Status code must be between 100 and 599.';
      }
    }

    return Object.keys(this.errors).length === 0;
  }

  reRender() {
    const drawer = window.faultendApp.getDrawer();
    drawer.setContent(this.render());
    this.bindEvents();
  }

  async save() {
    if (this._saving) return;

    const data = this.collectFormData();

    if (!this.validate(data)) {
      this.reRender();
      Toast.error('Please fix the highlighted fields');
      return;
    }

    this._saving = true;
    const saveBtn = document.getElementById('saveRuleBtn');
    if (saveBtn) saveBtn.disabled = true;

    try {
      if (this.existingRule) {
        await updateRule(this.serverId, this.existingRule.id, data);
      } else {
        await createRule(this.serverId, data);
        track('rule_created', {
          action_type: data.action,
          has_latency: !!(data.latency || data.mockResponse?.latency),
          has_transform: !!data.transform
        });
      }

      window.faultendApp.getDrawer().close();
      if (rulesList) {
        await rulesList.load();
      }
    } catch (error) {
      console.error('Failed to save rule:', error);
      Toast.error(`Failed to save rule: ${error.message}`);
    } finally {
      this._saving = false;
      if (saveBtn) saveBtn.disabled = false;
    }
  }
}
