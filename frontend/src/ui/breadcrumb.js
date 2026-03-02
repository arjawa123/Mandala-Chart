/**
 * breadcrumb.js - Navigation breadcrumb renderer (new UI)
 */
const breadcrumbEl = document.getElementById('breadcrumb');

export function renderBreadcrumb(navStack, getLabel, onNavigate) {
    breadcrumbEl.innerHTML = '';

    navStack.forEach((cellId, index) => {
        const isLast = index === navStack.length - 1;
        const label = cellId === 'root' ? 'Main Goal' : (getLabel(cellId) || `Level ${index}`);

        const span = document.createElement('span');
        span.className = `bc-item${isLast ? ' active' : ''}`;
        span.textContent = label.length > 22 ? label.slice(0, 20) + '...' : label;
        span.title = label;

        if (!isLast) {
            span.addEventListener('click', () => onNavigate(cellId, index));
        }
        breadcrumbEl.appendChild(span);

        if (!isLast) {
            const sep = document.createElement('span');
            sep.className = 'bc-sep';
            sep.textContent = '/';
            breadcrumbEl.appendChild(sep);
        }
    });
}
