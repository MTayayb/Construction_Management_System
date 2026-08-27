const role = localStorage.getItem("role");
if (!token || role !== "worker") {
  localStorage.clear();
  window.location.href = "../index.html";
}

// Decode JWT to get worker ID
const workerId = JSON.parse(atob(token.split(".")[1])).id;

// ------------------
// Logout
// ------------------
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.clear();
  window.location.href = "../index.html";
});

// ------------------
// Sidebar Navigation
// ------------------
const navItems = document.querySelectorAll(".nav-item[data-target]");
const sections = document.querySelectorAll("section");
const pageTitle = document.getElementById("page-title");

navItems.forEach(item => {
  item.addEventListener("click", () => {
    navItems.forEach(nav => nav.classList.remove("active"));
    item.classList.add("active");

    sections.forEach(sec => sec.classList.remove("active"));
    const targetId = item.getAttribute("data-target");
    document.getElementById(targetId).classList.add("active");

    document.getElementById(targetId).classList.add("active");
    pageTitle.textContent = item.textContent;

    if (targetId === "history-section") loadHistory();
    if (targetId === "total-attendance-section") loadAllAttendance();
    if (targetId === "attendance-section") {
      const pid = document.getElementById("project-select").value;
      if (pid) loadAttendance(pid);
    }
  });
});

// ------------------
// Load Projects
// ------------------
async function loadProjects() {
  try {
    const res = await fetch(`${apiBase}/projects?v=${Date.now()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const projects = await res.json();
    const projectSelect = document.getElementById("project-select");

    projectSelect.innerHTML = "<option value=''>Select Project</option>";

    // Show projects where worker has any attendance or all projects
    projects.forEach((p) => {
      projectSelect.innerHTML += `<option value="${p._id}">${p.name}</option>`;
    });

    if (!projects.length) {
      projectSelect.innerHTML = "<option value=''>No projects available</option>";
    }
  } catch (err) {
    console.error(err);
  }
}
loadProjects();

// ------------------
// Submit Attendance
// ------------------
document.getElementById("attendance-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const projectId = document.getElementById("project-select").value;
  const status = document.getElementById("status-select").value;
  const msg = document.getElementById("attendance-message");

  if (!projectId) {
    if (window.showToast) showToast("Please select a project", "error");
    return;
  }

  try {
    const res = await fetch(`${apiBase}/attendance/${projectId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });

    const data = await res.json();
    if (res.ok) {
      if (window.showToast) showToast("Attendance recorded!", "success");
      loadAttendance(projectId);
    } else {
      if (window.showToast) showToast(data.message || "Failed to record attendance", "error");
    }
  } catch (err) {
    console.error(err);
    if (window.showToast) showToast("Connection error", "error");
  }
});

// ------------------
// Load All Attendance Records (Grouped by Project)
// ------------------
async function loadAllAttendance() {
  try {
    const res = await fetch(`${apiBase}/attendance`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const attendances = await res.json();
    const list = document.getElementById("total-attendance-list");
    list.innerHTML = "";

    if (attendances && attendances.length) {
      // Group logs by project
      const grouped = {};
      attendances.forEach(a => {
        const pid = a.project?._id || a.project || 'unknown';
        if (!grouped[pid]) {
          grouped[pid] = {
            name: a.project?.name || 'Unknown Project',
            logs: []
          };
        }
        grouped[pid].logs.push(a);
      });

      Object.values(grouped).forEach(g => {
        const card = document.createElement("div");
        card.className = "project-card";
        card.style.padding = "20px";
        card.style.marginBottom = "20px";

        card.innerHTML = `
          <h3 style="margin: 0 0 15px 0; color: var(--primary); border-bottom: 1px solid #edf2f7; padding-bottom: 10px;">
            <i class="fas fa-folder-open" style="margin-right: 10px;"></i>${g.name}
          </h3>
          <div class="attendance-logs-group">
            ${g.logs.map(l => `
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px dashed #eee;">
                <div>
                  <span class="status-tag ${l.status.toLowerCase()}" style="font-size: 0.75rem;">${l.status.toUpperCase()}</span>
                  <span style="font-size: 0.85rem; margin-left: 10px; color: #4a5568;">${new Date(l.time).toLocaleString()}</span>
                </div>
                <button onclick="deleteAttendance('${l._id}')" style="background:none; border:none; color: #e53e3e; cursor:pointer;" title="Delete Record">
                  <i class="fas fa-trash-alt"></i>
                </button>
              </div>
            `).join('')}
          </div>
        `;
        list.appendChild(card);
      });
    } else {
      list.innerHTML = "<p style='text-align:center; padding: 2rem; color: #718096;'>No attendance records found.</p>";
    }
  } catch (err) {
    console.error("Load All Attendance Error:", err);
    if (window.showToast) showToast("Error loading records", "error");
  }
}

// Reload attendance when project changes
document.getElementById("project-select").addEventListener("change", (e) => {
  const projectId = e.target.value;
  if (projectId) {
    loadAttendance(projectId);
    loadSalary(projectId);
  }
});

// ------------------
// Load Salary
// ------------------
async function loadSalary(projectId) {
  try {
    const res = await fetch(`${apiBase}/salary/worker/${workerId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();

    // We can filter by project if multiple projects are supported in the salary model
    // But for now, let's show the worker's calculated salary
    document.getElementById("total-hours").textContent = data.totalHours.toFixed(1);
    document.getElementById("total-salary").textContent = `₹${data.totalSalary.toLocaleString()}`;

    // Add click listeners for details
    setupSalaryDetails(data);

  } catch (err) {
    console.error("Error loading salary:", err);
  }
}

function setupSalaryDetails(data) {
  const cards = document.querySelectorAll("#salary-section .stat-card");
  const modal = document.getElementById("detailModal");
  const closeBtn = document.getElementById("closeDetailModal");
  const title = document.getElementById("modalDetailTitle");
  const body = document.getElementById("modalDetailBody");

  if (closeBtn) {
    closeBtn.onclick = () => modal.classList.remove("active");
  }

  cards.forEach(card => {
    card.style.cursor = "pointer";
    card.onclick = () => {
      title.textContent = "Salary Breakdown";
      body.innerHTML = `
        <div class="salary-details">
          <p><strong>Total Hours:</strong> ${data.totalHours.toFixed(2)} hrs</p>
          <p><strong>Base Rate:</strong> PKR 90 / hr</p>
          <hr style="margin: 1rem 0; border: 0; border-top: 1px solid #eee;">
          <p style="font-size: 1.2rem; color: var(--primary);"><strong>Total Payout:</strong> Rs.${data.totalSalary.toLocaleString()}</p>
          <p style="font-size: 0.8rem; color: #666; margin-top: 0.5rem;">Calculation: Hours × 90</p>
        </div>
      `;
      modal.classList.add("active");
    };
  });
}

// Global Modal outside-click handler
window.addEventListener("click", (e) => {
  const modals = document.querySelectorAll(".notification-modal");
  modals.forEach(m => {
    if (e.target === m) {
      m.classList.remove("active");
    }
  });
});

// Initial loads
loadProjects();
// Note: loadSalary will be called once projects are loaded and one is selected, 
// or we can call it globally if it's aggregate
loadSalary();

// ------------------
// Deletion & History logic
// ------------------

window.deleteAttendance = async (id) => {
  if (!confirm("Remove this attendance record from your view?")) return;
  try {
    const res = await fetch(`${apiBase}/attendance/worker/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      if (window.showToast) showToast("Attendance hidden", "success");
      // Reload relevant views
      const pid = document.getElementById("project-select").value;
      if (pid) loadAttendance(pid);
      loadAllAttendance();
      loadSalary(); // Recalculate salary if needed
    } else {
      const d = await res.json();
      if (window.showToast) showToast(d.message || "Error deleting", "error");
    }
  } catch (err) { console.error(err); }
};

// Re-add loadAttendance but fixed for clarity if needed, or just include it in the multi-replace
async function loadAttendance(projectId) {
  try {
    const res = await fetch(`${apiBase}/attendance`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const attendances = await res.json();
    const projectAttendance = attendances.filter(a => a.project === projectId || a.project?._id === projectId);
    const list = document.getElementById("attendance-list");
    list.innerHTML = "";

    if (projectAttendance && projectAttendance.length) {
      projectAttendance.forEach(a => {
        const li = document.createElement("li");
        li.style.display = "flex";
        li.style.justifyContent = "space-between";
        li.style.alignItems = "center";
        const dateStr = a.time ? new Date(a.time).toLocaleString() : "Unknown time";

        li.innerHTML = `
          <span>${a.status.toUpperCase()} - ${dateStr}</span>
          <button onclick="deleteAttendance('${a._id}')" style="background:none; border:none; color: #e53e3e; cursor:pointer;" title="Delete Record">
            <i class="fas fa-trash-alt"></i>
          </button>
        `;
        list.appendChild(li);
      });
    } else {
      list.innerHTML = "<li>No records for this project.</li>";
    }
  } catch (err) { console.error(err); }
}

async function loadHistory() {
  try {
    const res = await fetch(`${apiBase}/reports/history`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      if (window.showToast) showToast("Could not fetch history", "error");
      return;
    }

    const data = await res.json();
    const list = document.getElementById("history-attendance-list");
    list.innerHTML = "";

    const deletedAttendance = data.attendance || [];

    if (deletedAttendance.length === 0) {
      list.innerHTML = "<p style='text-align:center; padding: 2rem; color: #718096;'>No history yet</p>";
      return;
    }

    deletedAttendance.forEach(att => {
      list.innerHTML += `
             <div class="project-card" style="opacity: 0.8; padding: 15px;">
                 <h4 style="margin:0 0 5px 0; color: var(--primary);">${att.project?.name || "Unknown Project"}</h4>
                 <div style="display:flex; justify-content: space-between; align-items:center;">
                    <span class="status-tag ${att.status.toLowerCase()}">${att.status.toUpperCase()}</span>
                    <span style="font-size: 0.8rem; color: #718096;">${new Date(att.time).toLocaleString()}</span>
                 </div>
             </div>
         `;
    });
  } catch (err) {
    console.error("Load Worker History Error:", err);
    if (window.showToast) showToast("Error loading history", "error");
  }
}

const clearHistBtn = document.getElementById("clearWorkerHistoryBtn");
if (clearHistBtn) {
  clearHistBtn.onclick = async () => {
    if (!confirm("Clear your history?")) return;
    try {
      const res = await fetch(`${apiBase}/reports/history/clear`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        if (window.showToast) showToast("History cleared", "success");
        loadHistory();
      }
    } catch (err) { console.error(err); }
  };
}
