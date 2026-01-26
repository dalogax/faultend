# Phase 10: Frontend - Server Management & Configuration

## Overview

Complete server lifecycle management and configuration backup/restore functionality. This phase implements:
1. **Server Creation** - Form to create new fault servers (manual or via import)
2. **Server Export** - Backup server configurations (rules + metadata) as JSON
3. **Server Deletion** - Complete the existing delete workflow (already partially implemented)

---

## Objectives

1. Implement server creation form on landing page (manual or import)
2. Add export functionality in server Config tab
3. Import creates new server from configuration file
4. Export saves server configuration (all rules + metadata) as JSON
5. Complete server deletion workflow with proper confirmations
6. Provide consistent user feedback through toast notifications

---

## Current State

**Existing Backend API:**
- ✅ `GET /servers` - List all servers
- ✅ `POST /servers` - Create server
- ✅ `GET /servers/:id` - Get server details
- ✅ `DELETE /servers/:id` - Delete server
- ✅ `GET /servers/:serverId/rules` - Get all rules for server
- ✅ `POST /servers/:serverId/rules/import` - Import rules (supports replace mode)

**Existing Frontend:**
- ✅ Landing page (`public/landing.html`) - Shows server list table
- ✅ Config view placeholder (`public/js/views/config.js`)
- ✅ Drawer system for modals/forms
- ✅ Toast notification system
- ✅ Delete server button in settings (partially implemented)
- ✅ Router supports config view
- ❌ No "Create Server" button yet
- ❌ No server creation form
- ❌ No export UI in Config tab
- ❌ No import option in server creation

---

## Export Data Format

The export file will follow this structure:

```json
{
  "version": "1.0",
  "exportedAt": "2025-12-02T12:00:00.000Z",
  "server": {
    "id": "dev-api",
    "name": "Development API",
    "description": "Test server for development"
  },
  "rules": [
    {
      "id": "rule-1732627800000-abc123",
      "priority": 100,
      "enabled": true,
      "name": "Default API Proxy",
      "method": "*",
      "pathRegex": ".*",
      "action": "proxy",
      "target": "https://api.example.com"
    }
  ],
  "metadata": {
    "rulesCount": 5,
    "exportSource": "faultend-ui"
  }
}
```

**Note:** The backend export endpoint returns a slightly different format. We'll need to transform it or create a wrapper format for the UI export.

---

## Implementation Plan

### Part 1: Server Creation Form

**Goal:** Add "Create Server" button and form on landing page. Support both manual creation and import from config file.

**Files to modify:**
- `public/landing.html` - Add create button
- `public/js/app.js` - Add form handling
- `public/js/api.js` - Add createServer() if needed

**UI Flow:**
```
Landing Page
┌─────────────────────────────────────────┐
│ [Faultend Logo]         [Create Server] │
├─────────────────────────────────────────┤
│ Server ID    | URL              | etc   │
│ dev-api      | dev-api.local... | ...   │
└─────────────────────────────────────────┘

Click "Create Server" → Drawer opens:

┌─────────────────────────────────────────┐
│ Create New Server                  [×]  │
├─────────────────────────────────────────┤
│ [ Manual ]  [ Import from File ]        │
│                                         │
│ --- Manual Tab ---                      │
│ Server ID *                             │
│ [_________________]                     │
│ • Alphanumeric and hyphens only        │
│ • Must start with a letter             │
│                                         │
│ Server Name                             │
│ [_________________]                     │
│                                         │
│ Description                             │
│ [_________________________________]    │
│                                         │
│           [Cancel]      [Create Server] │
│                                         │
│ --- Import Tab ---                      │
│ Upload a configuration file to create   │
│ a new server with pre-configured rules. │
│                                         │
│ [Choose File]                           │
│                                         │
│ (Preview shows after file selected)     │
│                                         │
│           [Cancel]      [Create Server] │
└─────────────────────────────────────────┘
```

**Implementation Steps:**

1. **Add button to landing.html**
   - Add "Create Server" button in header (next to logo/title)
   - Use existing button styles

2. **Create form handler with tabs**
   ```javascript
   function openCreateServerForm() {
     const drawer = window.app.drawer;
     drawer.setTitle('Create New Server');
     drawer.setContent(renderServerForm());
     drawer.open();
     
     // Attach event listeners
     attachServerFormHandlers();
   }
   
   let currentTab = 'manual'; // or 'import'
   ```

3. **Form rendering with tabs**
   ```javascript
   function renderServerForm() {
     return `
       <div class="server-form-container">
         <div class="tabs">
           <button class="tab ${currentTab === 'manual' ? 'active' : ''}" 
                   data-tab="manual">Manual</button>
           <button class="tab ${currentTab === 'import' ? 'active' : ''}" 
                   data-tab="import">Import from File</button>
         </div>
         
         <div class="tab-content" id="manual-tab" 
              style="display: ${currentTab === 'manual' ? 'block' : 'none'}">
           <form id="manual-form" class="form">
             <div class="form-group">
               <label for="server-id">Server ID *</label>
               <input type="text" id="server-id" required 
                      pattern="^[a-z][a-z0-9-]*$">
               <small>Alphanumeric and hyphens only, must start with letter</small>
               <div class="error-message" id="id-error"></div>
             </div>
             
             <div class="form-group">
               <label for="server-name">Server Name</label>
               <input type="text" id="server-name">
             </div>
             
             <div class="form-group">
               <label for="server-description">Description</label>
               <textarea id="server-description" rows="3"></textarea>
             </div>
             
             <div class="form-actions">
               <button type="button" class="btn-secondary" data-action="cancel">
                 Cancel
               </button>
               <button type="submit" class="btn-primary">
                 Create Server
               </button>
             </div>
           </form>
         </div>
         
         <div class="tab-content" id="import-tab" 
              style="display: ${currentTab === 'import' ? 'block' : 'none'}">
           <div class="import-form">
             <p>Upload a configuration file to create a new server with pre-configured rules.</p>
             
             <input type="file" id="import-file" accept=".json" style="display:none">
             <button id="choose-file-btn" class="btn-primary">
               Choose File
             </button>
             
             <div id="import-preview" style="display:none">
               <!-- Preview content inserted here -->
             </div>
             
             <div class="form-actions" id="import-actions" style="display:none">
               <button type="button" class="btn-secondary" data-action="cancel">
                 Cancel
               </button>
               <button type="button" class="btn-primary" id="import-create-btn">
                 Create Server
               </button>
             </div>
           </div>
         </div>
       </div>
     `;
   }
   ```

4. **Tab switching**
   ```javascript
   function attachServerFormHandlers() {
     // Tab switching
     document.querySelectorAll('.tab').forEach(tab => {
       tab.onclick = () => {
         currentTab = tab.dataset.tab;
         document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
         tab.classList.add('active');
         document.querySelectorAll('.tab-content').forEach(content => {
           content.style.display = 'none';
         });
         document.getElementById(`${currentTab}-tab`).style.display = 'block';
       };
     });
     
     // Manual form handlers
     const manualForm = document.getElementById('manual-form');
     if (manualForm) {
       manualForm.onsubmit = handleManualServerCreate;
     }
     
     // Import handlers
     const chooseFileBtn = document.getElementById('choose-file-btn');
     const fileInput = document.getElementById('import-file');
     if (chooseFileBtn && fileInput) {
       chooseFileBtn.onclick = () => fileInput.click();
       fileInput.onchange = handleFileSelect;
     }
     
     const importCreateBtn = document.getElementById('import-create-btn');
     if (importCreateBtn) {
       importCreateBtn.onclick = handleImportServerCreate;
     }
     
     // Cancel buttons
     document.querySelectorAll('[data-action="cancel"]').forEach(btn => {
       btn.onclick = () => window.app.drawer.close();
     });
   }
   ```

5. **Manual server creation** (same as before)
   ```javascript
   async function handleManualServerCreate(event) {
     event.preventDefault();
     
     const id = document.getElementById('server-id').value.trim();
     const name = document.getElementById('server-name').value.trim();
     const description = document.getElementById('server-description').value.trim();
     
     // Validate ID format
     const formatError = validateServerId(id);
     if (formatError) {
       showError('id-error', formatError);
       return;
     }
     
     // Check if exists
     const exists = await checkServerIdExists(id);
     if (exists) {
       showError('id-error', 'Server ID already exists');
       return;
     }
     
     // Create server
     try {
       await createServer({ id, name, description });
       Toast.show('Server created successfully', 'success');
       window.app.drawer.close();
       
       // Refresh server list and navigate
       await loadServerList();
       window.location.hash = `#server/${id}`;
     } catch (error) {
       Toast.show('Failed to create server', 'error');
     }
   }
   ```

6. **Import file selection and preview**
   ```javascript
   let importData = null;
   
   async function handleFileSelect(e) {
     const file = e.target.files[0];
     if (!file) return;
     
     try {
       // Read and parse file
       const text = await file.text();
       const data = JSON.parse(text);
       
       // Validate
       if (!validateImportData(data)) {
         Toast.show('Invalid configuration file', 'error');
         return;
       }
       
       // Check if server ID already exists
       const exists = await checkServerIdExists(data.server.id);
       if (exists) {
         Toast.show(`Server '${data.server.id}' already exists`, 'error');
         return;
       }
       
       // Store data and show preview
       importData = data;
       showImportPreview(data);
       
     } catch (error) {
       if (error instanceof SyntaxError) {
         Toast.show('Invalid JSON file', 'error');
       } else {
         console.error('File read failed:', error);
         Toast.show('Failed to read file', 'error');
       }
     } finally {
       e.target.value = ''; // Reset input
     }
   }
   
   function showImportPreview(data) {
     const preview = document.getElementById('import-preview');
     const actions = document.getElementById('import-actions');
     
     const rulesList = data.rules
       .slice(0, 10)
       .map(r => `<li>${r.name} (${r.action}, priority ${r.priority})</li>`)
       .join('');
     
     const more = data.rules.length > 10 ? 
       `<li>... and ${data.rules.length - 10} more</li>` : '';
     
     preview.innerHTML = `
       <div class="preview-info">
         <p><strong>Server ID:</strong> ${data.server.id}</p>
         <p><strong>Name:</strong> ${data.server.name || '(none)'}</p>
         <p><strong>Rules:</strong> ${data.rules.length}</p>
       </div>
       
       <div class="rules-preview">
         <p><strong>Rules to import:</strong></p>
         <ul>${rulesList}${more}</ul>
       </div>
     `;
     
     preview.style.display = 'block';
     actions.style.display = 'flex';
   }
   
   function validateImportData(data) {
     return data &&
            data.version &&
            data.server &&
            data.server.id &&
            Array.isArray(data.rules);
   }
   ```

7. **Import server creation**
   ```javascript
   async function handleImportServerCreate() {
     if (!importData) {
       Toast.show('No file selected', 'error');
       return;
     }
     
     try {
       // Create server first
       await createServer({
         id: importData.server.id,
         name: importData.server.name || '',
         description: importData.server.description || ''
       });
       
       // Import rules if any
       if (importData.rules.length > 0) {
         await importRules(importData.server.id, importData.rules, 'replace');
       }
       
       Toast.show(`Server created with ${importData.rules.length} rules`, 'success');
       window.app.drawer.close();
       
       // Refresh and navigate
       await loadServerList();
       window.location.hash = `#server/${importData.server.id}`;
       
     } catch (error) {
       console.error('Import server creation failed:', error);
       Toast.show('Failed to create server from import', 'error');
     }
   }
   ```

---

### Part 2: Server Export Configuration

**Goal:** Add Config tab with export functionality to save server configuration as JSON.

**Files to modify:**
- `public/js/views/config.js` - Complete implementation
- `public/css/components.css` - Add config view styles

**UI Layout:**
```
Config Tab (inside server view)
┌─────────────────────────────────────────┐
│ Export Configuration                    │
│ ┌─────────────────────────────────────┐ │
│ │ Download your server configuration  │ │
│ │ as JSON for backup or sharing.      │ │
│ │                                     │ │
│ │ [Export Configuration]              │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

**Implementation Steps:**

1. **Implement config.js view**
   ```javascript
   export function initConfigView() {
     // Called once on app init
     console.log('Config view initialized');
   }
   
   export async function loadConfigData(serverId) {
     const container = document.getElementById('config-content');
     container.innerHTML = renderConfigView(serverId);
     
     // Attach handler
     document.getElementById('export-btn').onclick = () => handleExport(serverId);
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
   ```

2. **Export implementation**
   ```javascript
   async function handleExport(serverId) {
     try {
       // Fetch rules and server info
       const [rules, server] = await Promise.all([
         fetchRules(serverId),
         fetchServer(serverId)
       ]);
       
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
       
       Toast.show('Configuration exported', 'success');
     } catch (error) {
       console.error('Export failed:', error);
       Toast.show('Export failed', 'error');
     }
   }
   ```

---

### Part 3: CSS Styling

**File:** `public/css/components.css`

Add styles for server form, tabs, and config view:

```css
/* Server Creation Form */
.server-form-container {
  padding: var(--spacing-lg);
}

/* Tabs */
.tabs {
  display: flex;
  gap: 0;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: var(--spacing-lg);
}

.tab {
  padding: var(--spacing-sm) var(--spacing-lg);
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  font-family: inherit;
  font-size: var(--font-size-md);
  font-weight: 300;
  color: var(--color-text-secondary);
}

.tab.active {
  color: var(--color-text-primary);
  border-bottom-color: var(--color-text-primary);
}

.tab:hover {
  color: var(--color-text-primary);
}

/* Form Styles */
.form {
  padding: 0;
}

.form-group {
  margin-bottom: var(--spacing-lg);
}

.form-group label {
  display: block;
  margin-bottom: var(--spacing-sm);
  font-weight: 400;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: var(--spacing-sm);
  border: 1px solid var(--color-border);
  font-family: inherit;
  font-size: var(--font-size-md);
  font-weight: 300;
}

.form-group small {
  display: block;
  margin-top: var(--spacing-xs);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.error-message {
  margin-top: var(--spacing-xs);
  color: var(--color-danger);
  font-size: var(--font-size-sm);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md);
  margin-top: var(--spacing-xl);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--color-border);
}

/* Import Form */
.import-form p {
  margin-bottom: var(--spacing-lg);
  color: var(--color-text-secondary);
}

/* Config View */
.config-view {
  padding: var(--spacing-lg);
}

.config-section {
  margin-bottom: var(--spacing-xl);
  padding: var(--spacing-lg);
  border: 1px solid var(--color-border);
}

.config-section h3 {
  margin-bottom: var(--spacing-md);
  font-size: var(--font-size-lg);
}

.config-section p {
  margin-bottom: var(--spacing-md);
  color: var(--color-text-secondary);
}

/* Import Preview */
.preview-info {
  margin-bottom: var(--spacing-md);
  padding: var(--spacing-md);
  background: #F5F5F5;
}

.preview-info p {
  margin: var(--spacing-xs) 0;
}

.rules-preview {
  margin: var(--spacing-md) 0;
  max-height: 200px;
  overflow-y: auto;
}

.rules-preview ul {
  list-style: disc;
  padding-left: var(--spacing-lg);
}

.rules-preview li {
  margin: var(--spacing-xs) 0;
}
```

---

## Testing Strategy

### Manual Testing Checklist

**Server Creation - Manual:**
- [ ] "Create Server" button appears on landing page
- [ ] Clicking button opens drawer with two tabs
- [ ] Manual tab is active by default
- [ ] Server ID validation works (format, must start with letter)
- [ ] Server ID duplicate check works
- [ ] Form validation shows appropriate errors
- [ ] Creating server shows success toast
- [ ] Auto-navigates to new server after creation
- [ ] New server appears in server list
- [ ] Edge case: Cancel closes drawer without creating

**Server Creation - Import:**
- [ ] Import tab accessible via tab switch
- [ ] Choose File button triggers file picker
- [ ] Selecting valid file shows preview (server info + rules)
- [ ] Preview shows first 10 rules (with "... and X more" if >10)
- [ ] Invalid JSON shows error toast
- [ ] Missing required fields shows error toast
- [ ] Duplicate server ID shows error toast
- [ ] Create Server button creates server with rules
- [ ] Success toast shows rule count
- [ ] Auto-navigates to new server
- [ ] New server appears in server list with rules
- [ ] Edge case: Import file with 0 rules creates empty server

**Export Configuration:**
- [ ] Config tab accessible in server view
- [ ] Export button downloads JSON file
- [ ] File name format: `faultend-{serverId}-{timestamp}.json`
- [ ] JSON structure matches expected format
- [ ] All rules included in export
- [ ] Server metadata (id, name, description) included
- [ ] Success toast appears after export
- [ ] Edge case: Export server with 0 rules

### Frontend Tests (Playwright)

Update `tests/frontend.spec.js`:

```javascript
test.describe('Phase 10: Server Management & Config', () => {
  test('should create server manually', async ({ page }) => {
    await page.goto('http://app.localhost:3000');
    
    // Click create server button
    await page.click('text=Create Server');
    
    // Should be on Manual tab by default
    await expect(page.locator('.tab.active')).toContainText('Manual');
    
    // Fill form
    await page.fill('#server-id', 'test-server');
    await page.fill('#server-name', 'Test Server');
    await page.fill('#server-description', 'Test description');
    
    // Submit
    await page.click('button[type="submit"]:has-text("Create Server")');
    
    // Should navigate to new server
    await expect(page).toHaveURL(/#server\/test-server/);
    
    // Should show in server list
    await page.goto('http://app.localhost:3000');
    await expect(page.locator('text=test-server')).toBeVisible();
  });

  test('should validate server ID format', async ({ page }) => {
    await page.goto('http://app.localhost:3000');
    await page.click('text=Create Server');
    
    // Try invalid ID (starts with number)
    await page.fill('#server-id', '123test');
    await page.click('button[type="submit"]:has-text("Create Server")');
    
    // Should show error
    await expect(page.locator('.error-message')).toContainText('Must start with letter');
  });

  test('should create server from import file', async ({ page }) => {
    const config = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      server: { id: 'imported-server', name: 'Imported Server', description: 'From file' },
      rules: [
        {
          priority: 100,
          name: 'Test Rule',
          method: 'GET',
          pathRegex: '/test',
          action: 'mock',
          enabled: true,
          mockResponse: { statusCode: 200, body: { test: true } }
        }
      ],
      metadata: { rulesCount: 1 }
    };
    
    await page.goto('http://app.localhost:3000');
    await page.click('text=Create Server');
    
    // Switch to Import tab
    await page.click('.tab:has-text("Import from File")');
    
    // Upload file
    await page.setInputFiles('#import-file', {
      name: 'test-config.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(config))
    });
    
    // Preview should appear
    await expect(page.locator('#import-preview')).toBeVisible();
    await expect(page.locator('text=imported-server')).toBeVisible();
    await expect(page.locator('text=Test Rule')).toBeVisible();
    
    // Create server
    await page.click('#import-create-btn');
    
    // Should show success
    await expect(page.locator('.toast')).toContainText('created with 1 rules');
    
    // Should navigate to new server
    await expect(page).toHaveURL(/#server\/imported-server/);
  });

  test('should reject import with duplicate server ID', async ({ page }) => {
    const config = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      server: { id: 'dev-api', name: 'Dev' }, // Existing server
      rules: [],
      metadata: { rulesCount: 0 }
    };
    
    await page.goto('http://app.localhost:3000');
    await page.click('text=Create Server');
    await page.click('.tab:has-text("Import from File")');
    
    await page.setInputFiles('#import-file', {
      name: 'duplicate.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(config))
    });
    
    // Should show error
    await expect(page.locator('.toast')).toContainText('already exists');
  });

  test('should export server configuration', async ({ page }) => {
    await page.goto('http://app.localhost:3000/#server/dev-api');
    
    // Switch to config tab
    await page.click('text=Config');
    
    // Start download listener
    const downloadPromise = page.waitForEvent('download');
    
    // Click export
    await page.click('text=Export Configuration');
    
    // Verify download
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^faultend-dev-api-\d+\.json$/);
  });

  test('should reject invalid import file format', async ({ page }) => {
    await page.goto('http://app.localhost:3000');
    await page.click('text=Create Server');
    await page.click('.tab:has-text("Import from File")');
    
    // Upload invalid JSON
    await page.setInputFiles('#import-file', {
      name: 'invalid.json',
      mimeType: 'application/json',
      buffer: Buffer.from('{ invalid json }')
    });
    
    // Should show error toast
    await expect(page.locator('.toast')).toContainText('Invalid JSON');
  });
});
```

---

## Deliverables Checklist

### Server Creation
- [ ] "Create Server" button added to landing page header
- [ ] Server creation form with two tabs (Manual / Import)
- [ ] Tab switching functionality
- [ ] Manual form: ID/Name/Description fields with validation
- [ ] Import form: File picker with preview
- [ ] Server ID format validation (alphanumeric + hyphens, starts with letter)
- [ ] Server ID duplicate check
- [ ] Import creates server + imports rules
- [ ] `createServer()` API integration in `api.js` (if not exists)
- [ ] Success toast and auto-navigation
- [ ] Form and tab styles in `components.css`

### Server Export
- [ ] Config view implementation in `public/js/views/config.js`
- [ ] Export button downloads JSON with correct format
- [ ] Export includes all rules and server metadata
- [ ] Config view styles in `components.css`

### API Integration
- [ ] `fetchServer(serverId)` helper in `api.js` (if not exists)
- [ ] `createServer(data)` helper in `api.js` (if not exists)
- [ ] `importRules(serverId, rules, mode)` helper in `api.js` (if not exists)

### Testing
- [ ] 6 frontend tests (3 for manual creation, 2 for import, 1 for export)
- [ ] All existing tests still pass
- [ ] Manual testing completed

### Documentation
- [ ] Update `agents.md` with Phase 10 completion status

---

## Success Criteria

Phase 10 is complete when:

1. ✅ Users can create new servers manually from landing page
2. ✅ Users can create new servers by importing config file
3. ✅ Server ID validation works (format + duplicate check)
4. ✅ Import validates file format and checks for duplicate server ID
5. ✅ Import creates server with all rules from file
6. ✅ Users can export server configuration as JSON
7. ✅ Export includes all rules and server metadata
8. ✅ Invalid files rejected with clear error messages
9. ✅ Success/error feedback via toast notifications
10. ✅ All frontend tests pass (existing + new)
11. ✅ Manual testing confirms all workflows work

---

## Known Limitations

- Import doesn't validate server ID against reserved subdomains (admin, app)
- No backup created before destructive operations
- No version compatibility checks (assumes v1.0 format)
- No encryption or security for exported files
- File size limits not enforced (relies on browser limits)

These limitations are acceptable for Phase 10 and can be addressed in future phases if needed.
