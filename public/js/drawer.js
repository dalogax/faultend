// Right-Side Drawer Controller

class DrawerController {
  constructor() {
    this.overlay = document.getElementById('drawerOverlay');
    this.drawer = document.getElementById('drawer');
    this.drawerTitle = document.getElementById('drawerTitle');
    this.drawerBody = document.getElementById('drawerBody');
    this.cancelBtn = document.getElementById('drawerCancel');
    this.saveBtn = document.getElementById('drawerSave');
    
    this.onSave = null;
    this.onCancel = null;
    
    this.bindEvents();
  }

  bindEvents() {
    // Close on overlay click
    this.overlay?.addEventListener('click', () => this.close());
    
    // Cancel button
    this.cancelBtn?.addEventListener('click', () => {
      if (this.onCancel) {
        this.onCancel();
      }
      this.close();
    });
    
    // Save button
    this.saveBtn?.addEventListener('click', () => {
      if (this.onSave) {
        this.onSave();
      }
    });
    
    // ESC key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen()) {
        this.close();
      }
    });
  }

  open(title, content, options = {}) {
    // If no title provided, don't update it (for pre-configured drawers)
    if (title) {
      this.drawerTitle.textContent = title;
    }
    
    // If no content provided, don't update body (for pre-configured drawers)
    if (content !== undefined) {
      this.drawerBody.innerHTML = '';
      
      if (typeof content === 'string') {
        this.drawerBody.innerHTML = content;
      } else if (content instanceof HTMLElement) {
        this.drawerBody.appendChild(content);
      }
    }
    
    this.onSave = options.onSave || null;
    this.onCancel = options.onCancel || null;
    
    // Update button text if provided and buttons exist
    if (this.saveBtn) {
      this.saveBtn.textContent = options.saveText || 'Save';
    }
    
    if (this.cancelBtn) {
      this.cancelBtn.textContent = options.cancelText || 'Cancel';
    }
    
    this.overlay.classList.add('active');
    this.drawer.classList.add('active');
  }

  close() {
    this.overlay.classList.remove('active');
    this.drawer.classList.remove('active');
    this.onSave = null;
    this.onCancel = null;
  }

  isOpen() {
    return this.drawer.classList.contains('active');
  }

  setTitle(title) {
    if (this.drawerTitle) {
      this.drawerTitle.textContent = title;
    }
  }

  setContent(content) {
    if (!this.drawerBody) return;
    
    this.drawerBody.innerHTML = '';
    
    if (typeof content === 'string') {
      this.drawerBody.innerHTML = content;
    } else if (content instanceof HTMLElement) {
      this.drawerBody.appendChild(content);
    }
  }

  setLoading(loading) {
    if (this.saveBtn) {
      this.saveBtn.disabled = loading;
    }
    if (this.cancelBtn) {
      this.cancelBtn.disabled = loading;
    }
  }
}

export default DrawerController;
