// Notification System Elements
const notificationBell = document.getElementById("notificationBell");
const notificationPanel = document.getElementById("notificationPanel");
const notificationBadge = document.getElementById("notificationBadge");
const notificationList = document.getElementById("notificationList");
const markAllReadBtn = document.getElementById("markAllRead");

// Toggle notification panel
if (notificationBell) {
    notificationBell.addEventListener("click", (e) => {
        e.stopPropagation();
        notificationPanel.classList.toggle("active");
        if (notificationPanel.classList.contains("active")) {
            loadNotifications();
        }
    });
}

// Close panel when clicking outside
document.addEventListener("click", (e) => {
    if (notificationPanel && !notificationPanel.contains(e.target) && e.target !== notificationBell) {
        notificationPanel.classList.remove("active");
    }
});

// ------------------
// Inject Modal HTML
// ------------------
const modalHTML = `
<div id="notificationModal" class="notification-modal">
    <div class="modal-content-notif">
        <span class="modal-close-notif" id="closeNotifModal">&times;</span>
        <h2 id="modalNotifTitle">Notification</h2>
        <p id="modalNotifMessage"></p>
        <div class="modal-meta-notif" id="modalNotifMeta"></div>
    </div>
</div>
`;
document.body.insertAdjacentHTML('beforeend', modalHTML);

const modal = document.getElementById("notificationModal");
const closeModal = document.getElementById("closeNotifModal");
closeModal.onclick = () => modal.classList.remove("active");
window.onclick = (event) => {
    if (event.target == modal) modal.classList.remove("active");
}

// Global toggle for dot (used by fetchUnreadCount)
function updateNotificationUI(count) {
    if (!notificationBadge) return;

    if (count > 0) {
        notificationBadge.textContent = count > 99 ? "99+" : count;
        notificationBadge.style.display = "flex";
        if (notificationBell) {
            notificationBell.classList.add("has-unread");
        }
    } else {
        notificationBadge.style.display = "none";
        if (notificationBell) {
            notificationBell.classList.remove("has-unread");
        }
    }
}

// Poll for unread count every 5 seconds (Reduced from 30s)
async function fetchUnreadCount() {
    try {
        const res = await fetch(`${apiBase}/notifications/unread-count`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        updateNotificationUI(data.count);
    } catch (err) {
        console.error("Fetch unread count error:", err);
    }
}

// Load notifications
async function loadNotifications() {
    try {
        const res = await fetch(`${apiBase}/notifications`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const notifications = await res.json();

        if (!notifications.length) {
            notificationList.innerHTML = '<div class="no-notifications">No notifications found</div>';
            return;
        }

        notificationList.innerHTML = notifications.map(n => `
      <div class="notification-item ${n.read ? '' : 'unread'}" id="notif-${n._id}">
        <div class="notif-header" onclick="showFullNotification('${n._id}', '${n.title.replace(/'/g, "\\'")}', '${n.message.replace(/'/g, "\\'")}', '${new Date(n.createdAt).toLocaleString()}')">
            <div class="notif-title-row">
                <h4>${n.title}</h4>
                <button class="delete-notif-btn-top" onclick="event.stopPropagation(); deleteNotification('${n._id}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <span class="notif-time">${new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <div class="notif-body" id="body-${n._id}">
            <p>${n.message.substring(0, 50)}${n.message.length > 50 ? '...' : ''}</p>
            ${!n.read ? `<button class="mark-read-inner" onclick="event.stopPropagation(); markNotificationRead('${n._id}')"><i class="fas fa-check"></i></button>` : ''}
        </div>
      </div>
    `).join("");
    } catch (err) {
        console.error("Load notifications error:", err);
    }
}

// Show Full Notification Modal
window.showFullNotification = async (id, title, message, meta) => {
    document.getElementById("modalNotifTitle").textContent = title;
    document.getElementById("modalNotifMessage").textContent = message;
    document.getElementById("modalNotifMeta").textContent = meta;
    modal.classList.add("active");

    // Auto mark as read when opened
    await markNotificationRead(id, true);
};

// Mark notification as read
window.markNotificationRead = async (id, silent = false) => {
    try {
        const res = await fetch(`${apiBase}/notifications/read/${id}`, {
            method: "PUT",
            headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
            const el = document.getElementById(`notif-${id}`);
            if (el) {
                el.classList.remove('unread');
                // Remove the mark-read checkmark if it exists
                const check = el.querySelector(".mark-read-inner");
                if (check) check.remove();
            }
            fetchUnreadCount();
            if (!silent) loadNotifications();
        }
    } catch (err) {
        console.error("Mark as read error:", err);
    }
}

// Delete Notification
window.deleteNotification = async (id) => {
    try {
        const res = await fetch(`${apiBase}/notifications/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
            if (window.showToast) showToast("Notification deleted", "info");
            loadNotifications();
            fetchUnreadCount();
        }
    } catch (err) {
        console.error("Delete notification error:", err);
    }
}

// Mark all as read
if (markAllReadBtn) {
    markAllReadBtn.onclick = async (e) => {
        e.stopPropagation();
        try {
            await fetch(`${apiBase}/notifications/read-all`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}` },
            });
            loadNotifications();
            fetchUnreadCount();
        } catch (err) {
            console.error("Mark all as read error:", err);
        }
    };
}

// Initial calls
fetchUnreadCount();
setInterval(fetchUnreadCount, 5000); // 5 seconds polling
