# Phase 10.10: UI/UX Fixes and Improvements

**Status:** Pending

---

## Overview

Collection of fixes and improvements identified after Phase 10.9 implementation. These address user experience issues and remove unimplemented features from the UI.

---

## Fixes List

### 1. Add Favicon and Web Manifest

**Problem:** Landing and app pages missing favicon and web manifest.

**Files to modify:**
- `public/landing.html` (lines 1-6, add in `<head>`)
- `public/app.html` (lines 1-14, add in `<head>`)
- Create `public/site.webmanifest`

**Implementation:**

1. Add favicon links to both HTML files (after viewport meta tag):
```html
<link rel="icon" type="image/x-icon" href="/img/favicon.ico">
<link rel="icon" type="image/png" sizes="16x16" href="/img/favicon-16x16.png">
<link rel="icon" type="image/png" sizes="32x32" href="/img/favicon-32x32.png">
<link rel="apple-touch-icon" sizes="180x180" href="/img/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
```

2. Create `public/site.webmanifest`:
```json
{
  "name": "Faultend",
  "short_name": "Faultend",
  "description": "Test your app's resilience against unreliable backends",
  "icons": [
    {
      "src": "/img/android-chrome-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/img/android-chrome-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "theme_color": "#000000",
  "background_color": "#ffffff",
  "display": "standalone",
  "start_url": "/"
}
```

**Notes:**
- All favicon images already exist in `public/img/` folder
- Web manifest enables PWA features and better mobile experience

---

### 2. Improve Page Titles

**Problem:** Page titles inconsistent ("Faultend - Test Your App's Resilience" vs "faultend - Management").

**Files to modify:**
- `public/landing.html` (line 5)
- `public/app.html` (line 5)

**Implementation:**

1. Update `landing.html` title:
```html
<title>Faultend</title>
```

2. Update `app.html` title:
```html
<title>Faultend</title>
```

**Notes:**
- Keep it simple and consistent
- Browser tab shows just "Faultend" for both pages

---

### 3. Fix Server List URL Click Behavior

**Problem:** Clicking server URL in table opens both detail page AND new tab with URL.

**File to modify:**
- `public/js/app.js` (line ~118, in `renderServerList()`)

**Current code:**
```html
<td><a href="${serverUrl}" target="_blank" class="server-url">${serverUrl}</a></td>
```

**Fixed code:**
```html
<td><span class="server-url">${serverUrl}</span></td>
```

**Implementation:**
- Remove `<a>` tag and `target="_blank"` attribute
- Change to plain `<span>` element
- Keep `server-url` class for styling
- Row click handler will open detail page (already implemented)

**Notes:**
- URL no longer clickable (only visual display)
- User clicks anywhere on row to open detail page
- Prevents accidental new tab opening

---

### 4. Add Date Columns to Server List

**Problem:** Server list missing created date and last traffic activity timestamps.

**Files to modify:**
- `public/js/app.js` (lines ~102-120, in `renderServerList()`)
- Backend may need to provide these fields (check storage)

**Implementation:**

1. Update table headers (line ~105):
```html
<thead>
  <tr>
    <th>Server ID</th>
    <th>URL</th>
    <th>Created</th>
    <th>Last Activity</th>
    <th>Traffic</th>
    <th>Rules</th>
  </tr>
</thead>
```

2. Update table rows (line ~113):
```javascript
<tr class="server-row" data-server-id="${server.id}">
  <td class="server-id">${server.id}</td>
  <td><span class="server-url">${serverUrl}</span></td>
  <td>${this.formatDate(server.createdAt)}</td>
  <td>${this.formatDate(server.lastActivity)}</td>
  <td>${server.trafficCount || 0}</td>
  <td>${server.rulesCount || 0}</td>
</tr>
```

3. Add date formatting helper method to `FaultendApp` class:
```javascript
formatDate(timestamp) {
  if (!timestamp) return '-';
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  
  // Less than 1 minute
  if (diff < 60000) return 'Just now';
  
  // Less than 1 hour
  if (diff < 3600000) {
    const mins = Math.floor(diff / 60000);
    return `${mins} min${mins > 1 ? 's' : ''} ago`;
  }
  
  // Less than 24 hours
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }
  
  // Format as date
  return date.toLocaleDateString();
}
```

**Backend Changes Required:**
- Add `createdAt` field to server storage (set on server creation)
- Add `lastActivity` field (update on each traffic log)
- Include these fields in `/servers` API response

**Notes:**
- Relative time for recent activity (e.g., "2 hours ago")
- Absolute date for older activity
- Shows "-" if no data available

---

### 5. Remove Name Field from Rule Form

**Problem:** Rule form includes unnecessary "Name" field that's not used in display.

**Files to modify:**
- `public/js/views/rules.js` (lines ~323-329, in `renderBasicFields()`)
- `public/js/views/rules.js` (lines ~51-101, in `RulesList.renderRulesTable()`)

**Implementation:**

1. Remove name field from form (delete lines 323-329 in `renderBasicFields()`):
```javascript
// DELETE THESE LINES:
<div class="form-field">
  <label for="ruleName">Name *</label>
  <input type="text" id="ruleName" class="input" value="${this.formData.name}" required>
  ${this.renderError('name')}
</div>
```

2. Update form initialization to not include name (line ~237 in `RuleForm` constructor):
- Remove `name` from `this.formData` defaults
- Remove `name` from traffic log prefill logic
- Remove `name` from existing rule prefill logic

3. Update save logic (line ~479 in `save()` method):
- Remove `name` from rule data object
- Auto-generate internal ID if backend requires it

4. Remove name column from rules table header (line ~56):
```html
<!-- BEFORE: -->
<th>Priority</th>
<th>Name</th>
<th>Method</th>

<!-- AFTER: -->
<th>Priority</th>
<th>Method</th>
```

5. Remove name cell from rules table row (line ~81):
```html
<!-- BEFORE: -->
<td>${rule.priority}</td>
<td>${rule.name || 'Unnamed'}</td>
<td><span class="badge badge-method">${rule.method}</span></td>

<!-- AFTER: -->
<td>${rule.priority}</td>
<td><span class="badge badge-method">${rule.method}</span></td>
```

**Notes:**
- Name field was visual clutter - not needed
- Priority + method + path regex are sufficient identifiers
- Backend can use ID for internal tracking

---

### 6. Set Default Pattern Regex

**Problem:** Path pattern field empty by default, requires manual entry.

**File to modify:**
- `public/js/views/rules.js` (line ~235, in `RuleForm` constructor)

**Current code:**
```javascript
this.formData = {
  priority: 100,
  method: '*',
  pathRegex: '', // <-- Empty
  ...
```

**Fixed code:**
```javascript
this.formData = {
  priority: 100,
  method: '*',
  pathRegex: '.*', // <-- Default to match all
  ...
```

**Implementation:**
- Change default `pathRegex` from `''` to `'.*'`
- Applies to new rule creation only
- When editing existing rule, use rule's current pattern
- When creating from traffic log, use actual request path

**Notes:**
- `.*` regex matches any path (catch-all)
- User can modify to be more specific
- Reduces friction for quick rule creation

---

### 7. Remove Advanced Options Section

**Problem:** "Advanced Options" section shown but features not implemented yet.

**File to modify:**
- `public/js/views/rules.js` (lines ~449-460, `renderAdvancedOptions()` method)

**Current code:**
```javascript
renderAdvancedOptions() {
  return `
    <div class="form-section">
      <details>
        <summary>Advanced Options</summary>
        <div class="form-field">
          <p class="form-hint">Conditions and header manipulation coming in enhanced version</p>
        </div>
      </details>
    </div>
  `;
}
```

**Fixed code:**
```javascript
renderAdvancedOptions() {
  return ''; // Remove until features implemented
}
```

**Implementation:**
- Change method to return empty string
- Or delete method and remove call from `render()` (line ~313)

**Notes:**
- Cleaner UI without unimplemented features
- Can restore when conditions/headers features added
- No backend changes needed

---

### 8. Remove Unused Files

**Problem:** Project contains unused/obsolete files from previous iterations.

**Files to delete:**
- `public/js/router_old.js` - Old router implementation, replaced by `router.js`
- `public/index.html` - Old landing page, replaced by `landing.html`
- `public/css/styles.css` - Old styles, replaced by modular CSS files

**Verification:**

1. **router_old.js** - Not imported anywhere:
   - `app.html` imports `/js/app.js` (which uses `router.js`)
   - No references found in codebase

2. **index.html** - Replaced by `landing.html`:
   - Server routes `/` to `landing.html` (see `src/server.js` line 48)
   - Old file from Phase 1, never updated for subdomain architecture

3. **styles.css** - Replaced by modular CSS:
   - `index.html` references it, but `index.html` is also unused
   - Current app uses: `reset.css`, `variables.css`, `components.css`, `layout.css`, `drawer.css`, `app.css`
   - `landing.html` has inline styles

**Implementation:**
```bash
rm public/js/router_old.js
rm public/index.html
rm public/css/styles.css
```

**Notes:**
- Safe to delete - no imports or references found
- Reduces confusion about which files are active
- Keeps codebase clean and maintainable

---

## Implementation Order

1. **Favicon & Manifest** - Quick win, improves branding
2. **Page Titles** - One-line change in each HTML file  
3. **Default Pattern Regex** - One-line change in rules.js
4. **Remove Advanced Options** - One-line change in rules.js
5. **Remove Unused Files** - Delete 3 obsolete files
6. **Remove Name Field** - Multiple changes in rules.js
7. **Fix URL Click Behavior** - One-line change in app.js
8. **Add Date Columns** - Backend + frontend changes

**Recommended:** Implement 1-7 first (no backend changes), then tackle #8 with backend updates.

---

## Testing Checklist

- [ ] Favicon appears in browser tab for landing and app pages
- [ ] Web manifest loaded without errors (check DevTools)
- [ ] Page titles show "Faultend" in both pages
- [ ] Unused files deleted (router_old.js, index.html, styles.css)
- [ ] Server list URL column non-clickable, row click works
- [ ] Created date and last activity columns display correctly
- [ ] Create rule form has no "Name" field
- [ ] Rules list table has no "Name" column
- [ ] Path pattern field defaults to `.*`
- [ ] Advanced Options section removed from form
- [ ] No console errors
- [ ] All existing functionality still works

---

## Notes

- All fixes target the frontend UI (`public/` directory)
- One backend change required for date columns (#8)
- No breaking changes to data models
- Simple quality-of-life improvements
- Total implementation time: ~2-3 hours
