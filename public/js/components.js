// Reusable UI Components

/**
 * Toast Notification System
 */
export const Toast = {
  show(message, duration = 3000) {
    const container = document.getElementById('toastContainer');
    if (!container) {
      console.error('Toast container not found');
      return;
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
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
    this.show(message, 5000);
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
