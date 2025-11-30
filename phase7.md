# Phase 7: Frontend - Project Setup and UI Framework

**Status:** Planning  
**Last Updated:** November 30, 2025  
**Prerequisites:** Phase 6.1 Complete (Subdomain Architecture)

---

## Overview

Phase 7 establishes the frontend foundation for Fault-end's management UI at `app.[ROOT_DOMAIN]`. This phase focuses on creating a clean, modern, and functional user interface using vanilla HTML, CSS, and JavaScript with no build process. The UI will serve as the foundation for traffic viewing (Phase 8) and rule management (Phases 9-10).

---

## Brand Style Guide

### Color Palette

**Monochrome Base:**
```css
--color-black: #000000;         /* Pure Black - Text, borders, primary elements */
--color-white: #ffffff;         /* Pure White - Background, inverted text */
--color-gray-dark: #333333;     /* Dark Gray - Secondary text */
--color-gray-mid: #666666;      /* Mid Gray - Tertiary text, disabled states */
--color-gray-light: #cccccc;    /* Light Gray - Subtle borders, dividers */
--color-background: #fafafa;    /* Off-White - Page background */
```

**Pastel Accent Colors (for badges only):**
```css
--color-get: #b8d4f1;           /* Pastel Blue - GET requests */
--color-post: #b8e6d5;          /* Pastel Green - POST requests */
--color-put: #f5d5b8;           /* Pastel Orange - PUT requests */
--color-patch: #d5e8e6;         /* Pastel Teal - PATCH requests */
--color-delete: #f5c2c2;        /* Pastel Red - DELETE requests */
--color-options: #e8d5f5;       /* Pastel Purple - OPTIONS requests */
--color-head: #f5f5d5;          /* Pastel Yellow - HEAD requests */
```

**Status Code Pastels:**
```css
--color-status-2xx: #d4edda;    /* Pastel Green - Success */
--color-status-3xx: #d1ecf1;    /* Pastel Blue - Redirect */
--color-status-4xx: #fff3cd;    /* Pastel Yellow - Client Error */
--color-status-5xx: #f8d7da;    /* Pastel Red - Server Error */
```

### Typography

**Font Stack:**
```css
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", 
                sans-serif;
--font-mono: "SF Mono", "Monaco", "Consolas", "Liberation Mono", 
             "Courier New", monospace;
```

**Font Sizes (3 levels only):**
```css
--text-sm: 0.875rem;   /* 14px - Labels, metadata, secondary info */
--text-base: 1rem;     /* 16px - Body text, standard content */
--text-lg: 1.5rem;     /* 24px - Headers, titles */
```

**Font Weight:**
```css
--font-weight: 300;    /* Thin - Used for everything */
```

**Line Height:**
```css
--line-height-tight: 1.2;   /* Headers */
--line-height-normal: 1.6;  /* Body text */
```

### Spacing System

```css
--space-sm: 0.5rem;    /* 8px - Tight spacing */
--space-md: 1rem;      /* 16px - Standard spacing */
--space-lg: 2rem;      /* 32px - Section spacing */
--space-xl: 4rem;      /* 64px - Large section spacing */
```

### Border Radius

```css
/* No border radius - all elements use sharp edges (0px) */
```

### Shadows

```css
/* No shadows or blurs - flat design only */
```

### Design Principles

1. **Minimalism First:** Black and white palette with minimal color accents
2. **Sharp and Clean:** No rounded corners, no shadows, no blur effects
3. **Flat Design:** Pure 2D interface with alignment-based visual hierarchy
4. **Typography-Driven:** Use size and weight for hierarchy, not color
5. **Desktop-Optimized:** Designed for 1920px displays, minimum 1280px
6. **Precision:** Sharp edges, clean lines, geometric precision
7. **Whitespace:** Use generous spacing to create visual separation
8. **Clarity:** Pastel badges for status/method indication only

---

## Technical Stack

### Core Technologies

- **HTML5:** Semantic markup, no framework
- **CSS3:** Modern features (Grid, Flexbox, Custom Properties)
- **Vanilla JavaScript (ES6+):** No compilation, no bundler
- **Fetch API:** For backend communication
- **No External Dependencies:** Zero npm packages for frontend

### Build Process

**NONE** - Files served directly as static assets from Express

### Browser Support

- **Modern Browsers:** Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Desktop Only:** Optimized for 1280px - 1920px+ displays
- **No Mobile/Tablet Support:** Desktop-first and desktop-only design
- **Inter Font Required:** Load from Google Fonts or host locally

---

## Views Structure

### Application Architecture

```
app.[ROOT_DOMAIN]
│
├─ Top Bar (Fixed)
│  ├─ Logo/Title (left)
│  ├─ Server Selector (center)
│  └─ View Tabs (right) [Traffic | Rules | Config]
│
├─ Main Content Area
│  ├─ Traffic View (Phase 8) - Full width table
│  ├─ Rules View (Phase 9-10) - Full width list
│  └─ Config View (Phase 10) - Centered content
│
└─ Right Side Drawer (Overlay)
   ├─ Editor Content (dynamic based on context)
   │  ├─ Form fields
   │  └─ JSON editor
   └─ Action Buttons (bottom)
      ├─ Cancel (left)
      └─ Save (right)
```

### Phase 7 Deliverables (This Phase)

**1. Main Layout**
- Fixed top bar with:
  - Logo/title (left)
  - Server selector (center)
  - View tabs (right): Traffic | Rules | Config
- Full-width main content area
- Right-side drawer overlay (hidden by default)

**2. Server Selector Component**
- Dropdown showing all available fault servers
- Fetches from Admin API: `GET http://admin.[ROOT_DOMAIN]/servers`
- Displays server ID
- Persists selection in localStorage
- Auto-selects if only one server exists
- Minimal styling - black text, white background, no borders except bottom line

**3. View Router (Client-Side)**
- Simple hash-based routing (`#traffic`, `#rules`, `#config`)
- No external router library
- Shows/hides view sections based on hash
- Default view: Traffic
- Active tab highlighted with black background, white text

**4. Empty State Placeholders**
- Traffic view placeholder: "No traffic logged yet"
- Rules view placeholder: "No rules configured"
- Config view placeholder: "Configuration"
- Centered, large text

**5. Right-Side Drawer**
- Fixed position overlay (slides in from right)
- 600px width
- White background with black border on left
- Action buttons at bottom (Cancel left, Save right)
- Used for editing rules, viewing details (Phase 8-10)

**6. Reusable UI Components**
- Buttons (black background, white text, sharp edges)
- Form inputs (white background, black thin border, sharp edges)
- Badges (pastel backgrounds for methods/status codes)
- Loading spinner (simple black rotating element)
- Toast notifications (minimal, top-right corner)

**7. Desktop-Only Layout**
- Designed for 1280px minimum width
- Optimized for 1920px displays
- No responsive breakpoints
- No mobile/tablet considerations

---

## Detailed View Specifications

### 1. Main Layout (`app.html`)

**Top Bar (Fixed):**
```
+----------------------------------------------------------------+
| [logo] faultend    [Server: server1 ▼]   Traffic Rules Config |
+----------------------------------------------------------------+
```

**Note:** `[logo]` = `faultend.svg` icon, displayed inline next to text

**Main Content Area:**
```
+----------------------------------------------------------------+
|                                                                |
|                    Full-Width Content Area                     |
|                  (View-specific content)                       |
|                                                                |
+----------------------------------------------------------------+
```

**Right-Side Drawer (Hidden by default, slides in when needed):**
```
                                          +----------------------+
                                          |                      |
                                          |   Editor Content     |
                                          |                      |
                                          |                      |
                                          +----------------------+
                                          | Cancel  |    Save    |
                                          +----------------------+
```

### 2. Server Selector Component

**Dropdown Structure:**
```html
<div class="server-selector">
  <label>Fault Server:</label>
  <select id="serverSelect">
    <option value="">-- Select Server --</option>
    <option value="server1">server1 - Test Instance</option>
    <option value="acme">acme - Production Proxy</option>
  </select>
</div>
```

**Behavior:**
- Fetches servers on page load
- Stores selected server in `localStorage.getItem('selectedServerId')`
- Triggers view refresh when changed
- Shows "(no servers)" if none exist

### 3. View Router Implementation

**Hash-based routing:**
- `#traffic` → Show traffic view (default)
- `#rules` → Show rules view
- `#config` → Show configuration view

**Implementation:**
```javascript
function navigate(view) {
  window.location.hash = view;
}

window.addEventListener('hashchange', () => {
  const view = window.location.hash.slice(1) || 'traffic';
  showView(view);
});
```

### 4. Component Library (Phase 7)

**Buttons:**
```html
<button class="btn">Standard Button</button>
<button class="btn btn-primary">Primary Action</button>
```

**CSS:**
```css
.btn {
  padding: var(--space-sm) var(--space-md);
  background: var(--color-black);
  color: var(--color-white);
  border: 1px solid var(--color-black);
  font-weight: var(--font-weight);
  font-size: var(--text-base);
  cursor: pointer;
  /* No border-radius - sharp edges */
}

.btn:hover {
  background: var(--color-white);
  color: var(--color-black);
}
```

**Badges:**
```html
<span class="badge badge-get">GET</span>
<span class="badge badge-post">POST</span>
<span class="badge badge-status-200">200</span>
<span class="badge badge-status-404">404</span>
```

**CSS:**
```css
.badge {
  display: inline-block;
  padding: 2px var(--space-sm);
  font-size: var(--text-sm);
  font-weight: var(--font-weight);
  /* No border-radius - sharp edges */
}

.badge-get { background: var(--color-get); color: var(--color-black); }
.badge-post { background: var(--color-post); color: var(--color-black); }
.badge-put { background: var(--color-put); color: var(--color-black); }
.badge-delete { background: var(--color-delete); color: var(--color-black); }

.badge-status-200 { background: var(--color-status-2xx); color: var(--color-black); }
.badge-status-404 { background: var(--color-status-4xx); color: var(--color-black); }
.badge-status-500 { background: var(--color-status-5xx); color: var(--color-black); }
```

**Loading Spinner:**
```html
<div class="spinner">
  <div class="spinner-element"></div>
</div>
```

**CSS:**
```css
.spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
}

.spinner-element {
  width: 100%;
  height: 100%;
  border: 2px solid var(--color-black);
  border-top-color: transparent;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

**Toast Notification:**
```html
<div class="toast">Operation completed</div>
```

**CSS:**
```css
.toast {
  position: fixed;
  top: var(--space-lg);
  right: var(--space-lg);
  padding: var(--space-md);
  background: var(--color-black);
  color: var(--color-white);
  font-size: var(--text-base);
  z-index: 10000;
  /* No border-radius, no shadow */
}
```

---

## File Structure (Phase 7)

```
public/
├── app.html                    # Main application (served at app.[ROOT_DOMAIN])
├── landing.html                # Landing page (served at [ROOT_DOMAIN])
├── faultend.svg                # Logo icon (used in header)
├── css/
│   ├── reset.css              # CSS reset/normalize
│   ├── variables.css          # CSS custom properties (colors, spacing, etc.)
│   ├── components.css         # Reusable component styles
│   ├── layout.css             # Layout and grid system
│   ├── drawer.css             # Right-side drawer styles
│   └── app.css                # Application-specific styles
├── js/
│   ├── config.js              # Configuration (API base URLs)
│   ├── api.js                 # API client wrapper functions
│   ├── router.js              # Client-side routing logic
│   ├── components.js          # Reusable UI components
│   ├── drawer.js              # Right-side drawer controller
│   ├── views/
│   │   ├── traffic.js         # Traffic view logic (Phase 8)
│   │   ├── rules.js           # Rules view logic (Phase 9-10)
│   │   └── config.js          # Config view logic (Phase 10)
│   └── app.js                 # Main application entry point
└── fonts/
    └── inter/                 # Inter font files (if self-hosted)
        ├── inter-thin.woff2
        └── inter-thin.woff
```

---

## Typical User Flow (Phase 7 Scope)

### Initial Load

1. User navigates to `http://app.localhost:3000`
2. App loads `app.html` with Inter font
3. JavaScript fetches available servers from admin API
4. If servers exist:
   - Populate server selector dropdown
   - Auto-select last used server (from localStorage)
   - Show traffic view (default)
5. If no servers exist:
   - Show empty state: "No fault servers configured"

### Server Selection

1. User clicks server selector dropdown
2. Dropdown shows list of available servers (ID only)
3. User selects a server
4. App stores selection in localStorage
5. View refreshes with server-scoped data

### View Navigation

1. User clicks "Traffic" tab → Shows traffic view
2. User clicks "Rules" tab → Shows rules view
3. User clicks "Config" tab → Shows config view
4. Active tab has black background, white text
5. Hash in URL updates (enables deep linking)

### Right-Side Drawer (Phases 8-10)

1. User clicks "Edit" or "View Details" button
2. Drawer slides in from right (600px width)
3. Editor content loads (forms, JSON viewer, etc.)
4. User edits content
5. User clicks "Save" → API call, drawer closes
6. User clicks "Cancel" → Drawer closes without saving

---

## API Integration (Phase 7)

### Admin API Calls

**Fetch Servers:**
```javascript
// GET http://admin.localhost:3000/servers
const servers = await fetchServers();
// Returns: [{ id: 'server1', name: 'Test', description: '...' }, ...]
```

### App API Calls (Prepared for Phase 8-10)

**Traffic API:**
```javascript
// GET http://app.localhost:3000/servers/:serverId/traffic
const traffic = await fetchTraffic(serverId);
```

**Rules API:**
```javascript
// GET http://app.localhost:3000/servers/:serverId/rules
const rules = await fetchRules(serverId);
```

### API Client Architecture

**config.js:**
```javascript
export const API_BASE = {
  admin: `http://admin.${window.location.hostname}:${window.location.port}`,
  app: `http://app.${window.location.hostname}:${window.location.port}`
};
```

**api.js:**
```javascript
async function request(url, options = {}) {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

export async function fetchServers() {
  return request(`${API_BASE.admin}/servers`);
}
```

---

## Component Specifications

### 1. Server Selector

**HTML:**
```html
<div class="server-selector">
  <label for="serverSelect">Fault Server:</label>
  <select id="serverSelect" class="server-select">
    <option value="">-- Select Server --</option>
    <!-- Populated dynamically -->
  </select>
  <span id="serverStatus" class="server-status"></span>
</div>
```

**CSS:**
```css
.server-select {
  padding: var(--space-sm) var(--space-md);
  border: none;
  border-bottom: 1px solid var(--color-black);
  background: var(--color-white);
  font-size: var(--text-base);
  font-weight: var(--font-weight);
  min-width: 200px;
  /* No border-radius */
}

.server-select:focus {
  outline: none;
  border-bottom: 2px solid var(--color-black);
}
```

**JavaScript:**
```javascript
class ServerSelector {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.select = this.container.querySelector('#serverSelect');
    this.statusEl = this.container.querySelector('#serverStatus');
    this.onChange = null;
  }

  async load() {
    try {
      const servers = await fetchServers();
      this.populate(servers);
      this.restoreSelection();
    } catch (error) {
      this.showError('Failed to load servers');
    }
  }

  populate(servers) {
    this.select.innerHTML = '<option value="">-- Select Server --</option>';
    servers.forEach(server => {
      const option = document.createElement('option');
      option.value = server.id;
      option.textContent = `${server.id} - ${server.name}`;
      this.select.appendChild(option);
    });
  }

  restoreSelection() {
    const saved = localStorage.getItem('selectedServerId');
    if (saved) {
      this.select.value = saved;
      this.triggerChange();
    }
  }

  getSelectedServer() {
    return this.select.value;
  }

  bindChange(callback) {
    this.onChange = callback;
    this.select.addEventListener('change', () => {
      const serverId = this.select.value;
      localStorage.setItem('selectedServerId', serverId);
      this.triggerChange();
    });
  }

  triggerChange() {
    if (this.onChange) {
      this.onChange(this.select.value);
    }
  }

  showError(message) {
    this.statusEl.textContent = message;
    this.statusEl.className = 'server-status error';
  }
}
```

### 2. Toast Notification System

**HTML (in app.html):**
```html
<div id="toastContainer" class="toast-container"></div>
```

**CSS:**
```css
.toast-container {
  position: fixed;
  top: var(--space-lg);
  right: var(--space-lg);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.toast {
  padding: var(--space-md);
  background: var(--color-black);
  color: var(--color-white);
  font-size: var(--text-base);
  min-width: 300px;
  animation: slideIn 0.3s ease-out;
  /* No border-radius, no shadow */
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
```

**JavaScript:**
```javascript
const Toast = {
  show(message, duration = 3000) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    
    container.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },
  
  success(message) {
    this.show(message);
  },
  
  error(message) {
    this.show(message, 5000);
  }
};
```

### 3. View Router

**JavaScript:**
```javascript
class ViewRouter {
  constructor() {
    this.currentView = null;
    this.views = {
      traffic: document.getElementById('trafficView'),
      rules: document.getElementById('rulesView'),
      config: document.getElementById('configView')
    };
    
    window.addEventListener('hashchange', () => this.route());
    this.route(); // Initial route
  }

  route() {
    const hash = window.location.hash.slice(1) || 'traffic';
    this.showView(hash);
  }

  showView(viewName) {
    // Hide all views
    Object.values(this.views).forEach(view => {
      if (view) view.style.display = 'none';
    });
    
    // Show selected view
    const view = this.views[viewName];
    if (view) {
      view.style.display = 'block';
      this.currentView = viewName;
      this.updateNavigation(viewName);
    }
  }

  updateNavigation(viewName) {
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
      if (link.dataset.view === viewName) {
        link.classList.add('active');
      }
    });
  }

  navigate(viewName) {
    window.location.hash = viewName;
  }
}
```

---

## Responsive Design Breakpoints

```css
/* Desktop Only - No responsive breakpoints */

/* Minimum Width: 1280px */
body {
  min-width: 1280px;
}

/* Optimized for 1920px */
.container {
  max-width: 1920px;
  margin: 0 auto;
  padding: var(--space-lg);
}
```

---

## Testing Strategy

### Manual Testing Checklist

**Phase 7 Scope:**

- [ ] App loads successfully at `http://app.localhost:3000`
- [ ] Inter font loads correctly (weight 300)
- [ ] Server selector fetches and displays servers from admin API
- [ ] Server selection persists across page reloads (localStorage)
- [ ] View navigation works (Traffic, Rules, Config tabs)
- [ ] Active tab has black background, white text
- [ ] Hash-based routing updates URL
- [ ] Direct URL navigation works (`app.localhost:3000#rules`)
- [ ] Toast notifications appear and auto-dismiss
- [ ] Empty states display when no server selected
- [ ] Right-side drawer slides in/out smoothly
- [ ] Drawer action buttons positioned at bottom
- [ ] All elements have sharp edges (no border-radius)
- [ ] No shadows or blur effects anywhere
- [ ] Black and white color scheme throughout
- [ ] Pastel badges for methods and status codes
- [ ] Console shows no errors
- [ ] Network requests succeed (check DevTools)
- [ ] Layout works at 1280px minimum width
- [ ] Layout optimized for 1920px displays

### Browser Testing

Test in each browser:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Performance Testing

- [ ] Page loads in < 1 second (uncached)
- [ ] Inter font loads without FOUT (Flash of Unstyled Text)
- [ ] No layout shift during load
- [ ] Smooth drawer animations (60fps)
- [ ] Server selector response < 500ms
- [ ] No memory leaks after 1 hour of use

### Visual Testing

- [ ] All text uses Inter font weight 300
- [ ] All elements have sharp edges (0px border-radius)
- [ ] No shadows or blur effects visible
- [ ] Black and white color scheme consistent
- [ ] Pastel badges clearly visible and readable
- [ ] Active tab state clearly indicates selection
- [ ] Drawer overlay doesn't interfere with main content

---

## Implementation Checklist

### Step 1: CSS Foundation
- [ ] Create `css/reset.css` with modern CSS reset
- [ ] Create `css/variables.css` with all CSS custom properties
- [ ] Create `css/components.css` with reusable component styles
- [ ] Create `css/layout.css` with grid and layout utilities
- [ ] Create `css/drawer.css` with right-side drawer styles
- [ ] Create `css/app.css` with application-specific styles
- [ ] Add Inter font (Google Fonts or self-hosted, weight 300 only)

### Step 2: JavaScript Modules
- [ ] Create `js/config.js` with API base URLs
- [ ] Create `js/api.js` with fetch wrapper and API functions
- [ ] Create `js/components.js` with reusable UI components (Toast, Spinner)
- [ ] Create `js/drawer.js` with drawer open/close logic
- [ ] Create `js/router.js` with view routing logic
- [ ] Create placeholder files in `js/views/` for future phases

### Step 3: Main Application
- [ ] Update `app.html` with complete layout structure
- [ ] Add fixed top bar with logo (faultend.svg), "faultend" text, server selector, view tabs
- [ ] Add main content area with view containers
- [ ] Add right-side drawer overlay structure
- [ ] Add toast notification container

### Step 4: Application Logic
- [ ] Update `js/app.js` with initialization logic
- [ ] Implement server selector functionality
- [ ] Implement view router with hash-based navigation
- [ ] Implement drawer open/close animations
- [ ] Implement toast notification system
- [ ] Add error handling

### Step 5: Polish
- [ ] Add loading states
- [ ] Add empty states for each view (centered, large text)
- [ ] Validate all sharp edges (no border-radius anywhere)
- [ ] Verify black and white color scheme
- [ ] Check pastel badge colors
- [ ] Test drawer animations
- [ ] Check browser console for errors

### Step 6: Documentation
- [ ] Update README with Phase 7 status
- [ ] Update `agents.md` with completed Phase 7
- [ ] Document component usage for Phase 8-10

---

## Success Criteria

Phase 7 is complete when:

1. ✅ App loads successfully at `app.[ROOT_DOMAIN]`
2. ✅ Inter font (weight 300) loads and displays correctly
3. ✅ Server selector fetches and displays servers from admin API
4. ✅ Server selection persists across page reloads
5. ✅ View navigation works (Traffic/Rules/Config tabs)
6. ✅ Active tab clearly indicated (black background, white text)
7. ✅ Hash-based routing enables deep linking
8. ✅ Right-side drawer slides in/out smoothly with action buttons at bottom
9. ✅ Toast notifications work for user feedback
10. ✅ All elements have sharp edges (no border-radius)
11. ✅ Black and white design with pastel badges only
12. ✅ No shadows or blur effects anywhere
13. ✅ Desktop-only layout (1280px - 1920px+)
14. ✅ Empty states display appropriately
15. ✅ No console errors or warnings
16. ✅ Code is clean, commented, and maintainable
17. ✅ Ready for Phase 8 (Traffic View implementation)

---

## Migration from Current State

**Current Files:**
- `public/app.html` - Minimal placeholder
- `public/css/styles.css` - Basic header styles
- `public/js/app.js` - Simple "waiting" message

**Changes Required:**
1. **Complete rewrite of `app.html`** with full layout
2. **Split `styles.css`** into modular CSS files
3. **Complete rewrite of `app.js`** with proper architecture
4. **Create new JS modules** for API, routing, components

**Backward Compatibility:**
- `public/landing.html` - Keep as-is (no changes)
- `public/index.html` - Keep as-is (no changes)

---

## Notes for Implementation

1. **Inter Font:** Use Google Fonts CDN (`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300&display=swap')`) or self-host weight 300 only
2. **No Border Radius:** Explicitly set `border-radius: 0` on all elements to ensure sharp edges
3. **localStorage Strategy:** Store only `selectedServerId`, fetch fresh data on every view
4. **API Error Handling:** Always show user-friendly messages in toast notifications
5. **Component Reusability:** Design components to be used in Phases 8-10
6. **Performance:** Minimize DOM manipulation, use DocumentFragment for batch updates
7. **Drawer Animation:** Use CSS transitions for smooth slide-in/out (300ms ease-out)
8. **Black & White Only:** No colored backgrounds except pastel badges
9. **Desktop Only:** No media queries for smaller screens, enforce 1280px minimum
10. **Thin Typography:** Weight 300 everywhere, let size create hierarchy

---

## Future Enhancements (Post Phase 7)

- Keyboard shortcuts for navigation
- Customizable drawer width
- Split view mode (traffic + details side-by-side)
- WebSocket for real-time updates (instead of polling)
- Export/import user preferences
- Custom pastel color picker for badges

---

**Next Phase:** Phase 8 - Frontend - Real-time Traffic Viewer
