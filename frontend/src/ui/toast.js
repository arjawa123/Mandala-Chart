/**
 * toast.js - Toast notification (new light UI)
 */
const container = document.getElementById('toast-container');

export function showToast(message, type = 'info', durationMs = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.transition = 'opacity .2s, transform .2s';
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(8px)';
        setTimeout(() => toast.remove(), 220);
    }, durationMs);
}
