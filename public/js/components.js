// Reusable UI Components

/**
 * Toast Notification System
 */
export const Toast = {
  show(message, duration = 3000, isError = false) {
    const container = document.getElementById('toastContainer');
    if (!container) {
      console.error('Toast container not found');
      return;
    }

    const toast = document.createElement('div');
    toast.className = isError ? 'toast toast-error' : 'toast';
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 300ms ease-out';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  success(message) {
    this.show(message);
  },

  error(message) {
    this.show(message, 5000, true);
  }
};

/**
 * Loading Spinner Component
 */
export function createSpinner() {
  const spinner = document.createElement('div');
  spinner.className = 'spinner';
  spinner.innerHTML = '<div class="spinner-element"></div>';
  return spinner;
}

/**
 * Method Badge Component
 */
export function createMethodBadge(method) {
  const badge = document.createElement('span');
  badge.className = `badge badge-${method.toLowerCase()}`;
  badge.textContent = method.toUpperCase();
  return badge;
}

/**
 * Status Code Badge Component
 */
export function createStatusBadge(statusCode) {
  const badge = document.createElement('span');
  const statusClass = Math.floor(statusCode / 100);
  badge.className = `badge badge-status-${statusClass}xx`;
  badge.textContent = statusCode;
  return badge;
}

/**
 * Empty State Component
 */
export function createEmptyState(message) {
  const empty = document.createElement('div');
  empty.className = 'empty-state';
  empty.textContent = message;
  return empty;
}

/**
 * Inline arm-then-fire destructive button.
 *
 * Wires an existing button so the first click "arms" it (text + fill change)
 * and the second click within 3s fires `onConfirm`. After 3s the button
 * auto-disarms. Replaces the centered ConfirmDialog for destructive actions.
 */
export const DangerConfirm = {
  wire(button, { idleText, armedText, onConfirm }) {
    if (!button) return;
    const idleHtml = idleText !== undefined ? idleText : button.innerHTML;
    button.innerHTML = idleHtml;

    let armed = false;
    let timer = null;

    const disarm = () => {
      armed = false;
      button.innerHTML = idleHtml;
      button.classList.remove('armed');
      if (timer) { clearTimeout(timer); timer = null; }
    };

    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (armed) {
        disarm();
        onConfirm();
      } else {
        armed = true;
        button.innerHTML = armedText;
        button.classList.add('armed');
        timer = setTimeout(disarm, 3000);
      }
    });
  }
};

/**
 * Confirmation Dialog
 */
export const ConfirmDialog = {
  show(options) {
    return new Promise((resolve) => {
      const {
        title = 'Confirm',
        message = 'Are you sure?',
        confirmText = 'Confirm',
        cancelText = 'Cancel',
        danger = false
      } = options;

      // Create overlay
      const overlay = document.createElement('div');
      overlay.className = 'confirm-overlay';
      
      // Create dialog
      const dialog = document.createElement('div');
      dialog.className = 'confirm-dialog';
      dialog.innerHTML = `
        <div class="confirm-header">
          <h3>${title}</h3>
        </div>
        <div class="confirm-body">
          <p>${message}</p>
        </div>
        <div class="confirm-actions">
          <button class="btn-ghost btn-sm confirm-cancel">${cancelText}</button>
          <button class="${danger ? 'btn-danger' : 'btn'} btn-sm confirm-ok">${confirmText}</button>
        </div>
      `;
      
      // Append to body
      document.body.appendChild(overlay);
      document.body.appendChild(dialog);
      
      // Show with animation
      setTimeout(() => {
        overlay.classList.add('active');
        dialog.classList.add('active');
      }, 10);
      
      // Handle actions
      const cleanup = (result) => {
        overlay.classList.remove('active');
        dialog.classList.remove('active');
        setTimeout(() => {
          overlay.remove();
          dialog.remove();
        }, 200);
        resolve(result);
      };
      
      dialog.querySelector('.confirm-cancel').addEventListener('click', () => cleanup(false));
      dialog.querySelector('.confirm-ok').addEventListener('click', () => cleanup(true));
      overlay.addEventListener('click', () => cleanup(false));
      
      // ESC key to cancel
      const escHandler = (e) => {
        if (e.key === 'Escape') {
          cleanup(false);
          document.removeEventListener('keydown', escHandler);
        }
      };
      document.addEventListener('keydown', escHandler);
    });
  }
};
