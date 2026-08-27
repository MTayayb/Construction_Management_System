/**
 * Global UI Utility for Toast Notifications
 */
const apiBase = "http://localhost:5500/api";
const token = localStorage.getItem("token");

window.apiBase = apiBase;
window.token = token;

// Ensure container exists
// Ensure toast container exists
if (!document.getElementById('toast-container')) {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
}

// Sidebar Toggle for Mobile
const sidebar = document.querySelector('.sidebar');
const menuBtn = document.createElement('div');
menuBtn.id = 'mobile-menu-btn';
menuBtn.innerHTML = '<i class="fas fa-bars"></i>';
menuBtn.className = 'mobile-menu-toggle';

const header = document.querySelector('.content-header');
if (header) {
    header.prepend(menuBtn);
}

if (menuBtn) {
    menuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('mobile-active');
    });
}

// Close sidebar when clicking outside on mobile
document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768 && sidebar && menuBtn) {
        if (!sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
            sidebar.classList.remove('mobile-active');
        }
    }
});

/**
 * Show a professional toast notification
 * @param {string} message - The message to display
 * @param {string} type - 'success', 'error', or 'info'
 */
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-check-circle';
    if (type === 'error') icon = 'fa-exclamation-circle';

    toast.innerHTML = `
    <i class="fas ${icon}"></i>
    <div class="toast-content">${message}</div>
  `;

    container.appendChild(toast);

    // Remove from DOM after animation completes (5s)
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 5000);
}

// Global exposure
window.showToast = showToast;

// ------------------
// Global Modal handling
// ------------------
window.addEventListener("click", (e) => {
    // Close any modal when clicking on the background overlay
    const modals = document.querySelectorAll(".notification-modal");
    modals.forEach(m => {
        if (e.target === m) {
            m.classList.remove("active");
        }
    });
});
