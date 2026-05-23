// Right-Side Drawer Controller

class DrawerController {
  constructor() {
    this.overlay = document.getElementById('drawerOverlay');
    this.drawer = document.getElementById('drawer');
    this.drawerEyebrow = document.getElementById('drawerEyebrow');
    this.drawerTitle = document.getElementById('drawerTitle');
    this.drawerSub = document.getElementById('drawerSub');
    this.drawerBody = document.getElementById('drawerBody');
    this.drawerFooter = document.getElementById('drawerFooter');
    this.closeBtn = document.getElementById('drawerClose');

    this.bindEvents();
  }

  bindEvents() {
    this.overlay?.addEventListener('click', () => this.close());
    this.closeBtn?.addEventListener('click', () => this.close());

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen()) {
        this.close();
      }
    });
  }

  open() {
    this.overlay.classList.add('active');
    this.drawer.classList.add('active');
  }

  close() {
    this.overlay.classList.remove('active');
    this.drawer.classList.remove('active');
  }

  isOpen() {
    return this.drawer.classList.contains('active');
  }

  setTitle(title) {
    this.setHeader({ title });
  }

  setHeader({ eyebrow = '', title = '', sub = '' }) {
    if (this.drawerEyebrow) {
      this.drawerEyebrow.textContent = eyebrow;
      this.drawerEyebrow.style.display = eyebrow ? 'block' : 'none';
    }
    if (this.drawerTitle) {
      this.drawerTitle.textContent = title;
    }
    if (this.drawerSub) {
      this.drawerSub.textContent = sub;
      this.drawerSub.style.display = sub ? 'block' : 'none';
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

  setFooter(content) {
    if (!this.drawerFooter) return;

    if (!content) {
      this.drawerFooter.innerHTML = '';
      this.drawerFooter.style.display = 'none';
      return;
    }

    this.drawerFooter.innerHTML = '';
    if (typeof content === 'string') {
      this.drawerFooter.innerHTML = content;
    } else if (content instanceof HTMLElement) {
      this.drawerFooter.appendChild(content);
    }
    this.drawerFooter.style.display = 'flex';
  }
}

export default DrawerController;
