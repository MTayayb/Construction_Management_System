// Use global token and role if available, otherwise fetch
if (typeof token === 'undefined') {
  window.token = localStorage.getItem("token");
}
if (typeof role === 'undefined') {
  window.role = localStorage.getItem("role");
}
if (!token || role !== "engineer") {
  localStorage.clear();
  window.location.href = "../index.html";
}

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

    pageTitle.textContent = item.textContent;

    if (targetId === "projects-section") loadProjects();
    if (targetId === "my-reports-section") loadMyReports();
    if (targetId === "attendance-view-section") loadAttendance();
    if (targetId === "history-section") loadHistory();
  });
});

// ------------------
// Load Assigned Projects
// ------------------
async function loadProjects() {
  try {
    const projectsList = document.getElementById("projects-list");
    const projectSelect = document.getElementById("project-select");
    const materialSelect = document.getElementById("material-project-select");
    const reportSelect = document.getElementById("report-project-select");

    // Show skeletons
    projectsList.innerHTML = `
      <div class="skeleton-card"><div class="skeleton skeleton-title"></div><div class="skeleton skeleton-text"></div><div class="skeleton skeleton-text"></div></div>
    `;

    const res = await fetch(`${apiBase}/projects?v=${Date.now()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const projects = await res.json();

    projectsList.innerHTML = "";
    projectSelect.innerHTML = "<option value=''>Select Project</option>";
    materialSelect.innerHTML = "<option value=''>Select Project</option>";
    reportSelect.innerHTML = "<option value=''>Select Project</option>";

    let engineerId;
    try {
      engineerId = JSON.parse(atob(token.split(".")[1])).id;
    } catch (e) {
      console.error("Token parsing error:", e);
    }

    projects.forEach((p) => {
      const pId = p._id || "unknown";
      const pName = p.name || "Unnamed Project";
      const pDesc = p.description || "No description provided.";
      const pStatus = (p.status || "pending").toLowerCase();
      const model3D = p.model3D ? p.model3D.replace(/\\/g, "/") : "";

      projectsList.innerHTML += `
        <div class="project-card">
          <div style="display: flex; justify-content: space-between; align-items: start;">
            <h3>${pName}</h3>
            <button onclick="deleteProjectIndividual('${pId}')" class="delete-notif-btn-top" title="Remove from my view">
              <i class="fas fa-trash"></i>
            </button>
          </div>
          <p>${pDesc}</p>
          <p>Status: <span class="status-tag ${pStatus}">${pStatus.toUpperCase()}</span></p>
          <div style="display: flex; gap: 10px; margin-top: 10px;">
            ${model3D ? `<button onclick="window.view3DModel('${model3D}')">3D Model</button>` : ""}
          </div>
        </div>
      `;

      projectSelect.innerHTML += `<option value="${pId}">${pName}</option>`;
      materialSelect.innerHTML += `<option value="${pId}">${pName}</option>`;
      reportSelect.innerHTML += `<option value="${pId}">${pName}</option>`;
    });

    if (!projectsList.innerHTML) {
      projectsList.innerHTML = "<p style='grid-column: 1 / -1; text-align: center; color: #718096; padding: 2rem;'>No project assigned yet</p>";
    }
  } catch (err) {
    console.error(err);
  }
}
loadProjects();

// ------------------
// Submit Site Report
// ------------------
document.getElementById("report-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData();
  formData.append("projectId", document.getElementById("report-project-select").value);
  formData.append("title", document.getElementById("report-title").value);
  formData.append("description", document.getElementById("report-description").value);

  const file = document.getElementById("report-file").files[0];
  if (file) formData.append("file", file);

  const msg = document.getElementById("report-message");

  try {
    const res = await fetch(`${apiBase}/reports/submit`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }, // FormData sets Content-Type automatically
      body: formData,
    });
    const data = await res.json();
    if (res.ok) {
      if (window.showToast) showToast("Report submitted successfully!", "success");
      document.getElementById("report-form").reset();
    } else {
      if (window.showToast) showToast(data.message || "Failed to submit report", "error");
    }
  } catch (err) {
    console.error(err);
    if (window.showToast) showToast("Server error during report submission", "error");
  }
});

// ------------------
// Update Task Progress
// ------------------
document.getElementById("update-task-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const projectId = document.getElementById("project-select").value;
  const progress = document.getElementById("progress-input").value;

  if (!projectId || !progress) {
    if (window.showToast) showToast("Select project and enter progress", "error");
    return;
  }

  try {
    const res = await fetch(`${apiBase}/projects/update-task/${projectId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ progress }),
    });
    const data = await res.json();
    if (res.ok) {
      if (window.showToast) showToast("Progress updated!", "success");
      loadProjects();
    } else {
      if (window.showToast) showToast(data.message || "Failed to update progress", "error");
    }
  } catch (err) {
    console.error(err);
    if (window.showToast) showToast("Error connecting to server", "error");
  }
});

// ------------------
// Material IN/OUT
// ------------------
document.getElementById("material-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const projectId = document.getElementById("material-project-select").value;
  const name = document.getElementById("material-name").value;
  const quantity = document.getElementById("material-quantity").value;
  const unit = document.getElementById("material-unit").value;
  const inOut = document.getElementById("material-type").value;

  if (!projectId || !name || !quantity || !unit) {
    if (window.showToast) showToast("All fields are required", "error");
    return;
  }

  try {
    const res = await fetch(`${apiBase}/materials/${projectId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, quantity, unit, inOut }),
    });
    const data = await res.json();
    if (res.ok) {
      if (window.showToast) showToast("Material recorded!", "success");
      loadProjects();
    } else {
      if (window.showToast) showToast(data.message || "Failed to record material", "error");
    }
  } catch (err) {
    console.error(err);
    if (window.showToast) showToast("Communication error", "error");
  }
});

// ------------------
// View 3D Model
// ------------------
window.view3DModel = function (modelPath) {
  if (!modelPath) {
    if (window.showToast) showToast("No model path provided", "error");
    return;
  }
  // Safe filename extraction
  // Ensure we render backslashes as forward slashes first
  const normalized = modelPath.replace(/\\/g, "/");
  const filename = normalized.split("/").pop();

  // Open relative to current page (assuming we are in /engineer/, viewer is in /)
  window.open(`../viewer.html?model=${filename}`, "_blank");
};
// ------------------
// Reports & History
// ------------------

// (Function moved to bottom to avoid duplication and ReferenceError)

window.deleteReport = async (reportId) => {
  if (!confirm("Are you sure? This will hide the report from your view.")) return;
  try {
    const res = await fetch(`${apiBase}/reports/${reportId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      if (window.showToast) showToast("Report deleted", "success");
      loadMyReports();
    }
  } catch (err) { console.error(err); }
};

window.loadHistory = async () => {
  try {
    const res = await fetch(`${apiBase}/reports/history`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const { projects, reports } = await res.json();

    // Cache for downloading details/PDF
    window.historyProjects = projects;
    window.historyReports = reports;

    // Filter to show ONLY deleted items for history
    const deletedProjects = projects.filter(p => p.hiddenFromEngineer === true);
    const deletedReports = reports.filter(r => r.hiddenFromEngineer === true);

    const projList = document.getElementById("history-projects-list");
    const repList = document.getElementById("history-reports-list");
    projList.innerHTML = ""; repList.innerHTML = "";

    if (deletedProjects.length === 0) projList.innerHTML = "<p>No deleted project history.</p>";
    deletedProjects.forEach(p => {
      projList.innerHTML += `
                <div class="project-card" style="opacity: 0.8;">
                    <h3>${p.name}</h3>
                    <p>Description: ${p.description || "No description"}</p>
                    <div style="margin-top: 10px;">
                        <button onclick="generateProjectPDF('${p._id}')" style="background: var(--primary); font-size: 0.8rem; padding: 5px 10px;">Download details (Text)</button>
                    </div>
                </div>
            `;
    });

    if (deletedReports.length === 0) repList.innerHTML = "<p>No deleted report history.</p>";
    deletedReports.forEach(r => {
      const fileUrl = r.fileUrl ? `${apiBase.replace('/api', '')}/${r.fileUrl.replace(/\\/g, '/')}` : '';
      repList.innerHTML += `
                <div class="project-card" style="opacity: 0.8;">
                    <h3>${r.title}</h3>
                    <p>Project: ${r.project?.name || "N/A"}</p>
                    <div style="display: flex; gap: 10px; margin-top: 10px;">
                        <button onclick="generateReportPDF('${r._id}')" style="background: #4a5568; font-size: 0.8rem; padding: 5px 10px;">Report details (Text)</button>
                    </div>
                </div>
            `;
    });
  } catch (err) { console.error(err); }
};

window.clearHistory = async () => {
  if (!confirm("Clear your history?")) return;
  try {
    const res = await fetch(`${apiBase}/reports/history/clear`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) { loadHistory(); }
  } catch (err) { console.error(err); }
};

// Generate Report PDF
window.generateReportPDF = async (reportId) => {
  try {
    // Try to find in cache first
    let report;
    if (window.historyReports) report = window.historyReports.find(r => r._id === reportId);

    if (!report) {
      const res = await fetch(`${apiBase}/reports/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const reports = await res.json();
      report = reports.find(r => r._id === reportId);
    }

    if (!report) return;

    const reportContent = `
CMS - PROJECT SITE REPORT
=========================

Title:       ${report.title}
Project:     ${report.project?.name || 'N/A'}
Engineer:    ${report.engineer?.name || 'N/A'}
Date:        ${new Date(report.createdAt).toLocaleDateString()}

DESCRIPTION:
------------
${report.description}

-------------------------
Generated on: ${new Date().toLocaleString()}
    `.trim();

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${report.title.replace(/\s+/g, '-')}-report.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (err) { console.error(err); }
};

// Generate Project PDF
window.generateProjectPDF = async (projectId) => {
  try {
    // Try to find in cache first
    let p;
    if (window.historyProjects) p = window.historyProjects.find(proj => proj._id === projectId);

    if (!p) {
      const res = await fetch(`${apiBase}/projects`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const projects = await res.json();
      p = projects.find(proj => proj._id === projectId);
    }
    if (!p) return;

    const projectContent = `
CMS - PROJECT DETAILS
=====================

Project Name:  ${p.name}
Status:         ${p.status}
Created:        ${new Date(p.createdAt).toLocaleDateString()}

DESCRIPTION:
------------
${p.description || "No description available."}

---------------------
Generated on: ${new Date().toLocaleString()}
        `.trim();

    const blob = new Blob([projectContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${p.name.replace(/\s+/g, '-')}-details.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (err) { console.error(err); }
};

async function loadMyReports() {
  try {
    const list = document.getElementById("my-reports-list");

    // Show skeletons
    list.innerHTML = `
      <div class="skeleton-card"><div class="skeleton skeleton-title"></div><div class="skeleton skeleton-text"></div><div class="skeleton skeleton-text"></div></div>
      <div class="skeleton-card"><div class="skeleton skeleton-title"></div><div class="skeleton skeleton-text"></div><div class="skeleton skeleton-text"></div></div>
      <div class="skeleton-card"><div class="skeleton skeleton-title"></div><div class="skeleton skeleton-text"></div><div class="skeleton skeleton-text"></div></div>
    `;

    const res = await fetch(`${apiBase}/reports/my-reports`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const reports = await res.json();

    list.innerHTML = ""; // Clear skeletons

    if (!reports || reports.length === 0) {
      list.innerHTML = "<p style='grid-column: 1 / -1; text-align: center; color: #718096; padding: 2rem;'>no reports yet</p>";
      return;
    }

    reports.forEach(r => {
      list.innerHTML += `
        <div class="project-card">
          <div style="display: flex; justify-content: space-between; align-items: start;">
            <h3 style="margin: 0;">${r.title}</h3>
            <button onclick="deleteReport('${r._id}')" style="background:none; border:none; color: #e53e3e; cursor:pointer; padding: 5px;">
              <i class="fas fa-trash"></i>
            </button>
          </div>
          <p style="margin: 5px 0;"><strong>Project:</strong> ${r.project?.name || "N/A"}</p>
          <p style="font-size: 0.9rem; color: #4a5568;">${r.description}</p>
        </div>
      `;
    });
  } catch (err) {
    console.error("Load My Reports Error:", err);
    document.getElementById("my-reports-list").innerHTML = "<p style='grid-column: 1 / -1; text-align: center; color: #718096; padding: 2rem;'>no reports yet</p>";
  }
}
loadMyReports();

async function loadAttendance() {
  try {
    // Calling /api/attendance now returns all relevant records for the engineer
    const res = await fetch(`${apiBase}/attendance`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const records = await res.json();
    const list = document.getElementById("attendance-list");
    list.innerHTML = "";

    if (!records || records.length === 0) {
      list.innerHTML = "<p>No attendance records found.</p>";
      return;
    }

    // Grouping records by worker and project
    const grouped = {};
    records.forEach(r => {
      const key = `${r.worker?._id || 'unknown'}_${r.project?._id || 'unknown'}`;
      if (!grouped[key]) {
        grouped[key] = {
          workerName: r.worker?.name || 'Unknown Worker',
          projectName: r.project?.name || 'N/A',
          logs: []
        };
      }
      grouped[key].logs.push({
        status: r.status,
        time: new Date(r.time).toLocaleString(),
        id: r._id
      });
    });

    Object.values(grouped).forEach(g => {
      list.innerHTML += `
        <div class="project-card">
          <div style="display: flex; justify-content: space-between; align-items: start;">
            <h3>${g.workerName}</h3>
          </div>
          <p><strong>Project:</strong> ${g.projectName}</p>
          <div style="margin-top: 1rem; border-top: 1px solid #edf2f7; padding-top: 0.5rem;">
            <p style="font-size: 0.85rem; font-weight: bold; margin-bottom: 0.5rem;">Logs:</p>
            ${g.logs.map(l => `
              <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 0.25rem;">
                <div>
                  <span class="status-tag ${l.status}">${l.status.toUpperCase()}</span>
                  <span style="margin-left: 10px;">${l.time}</span>
                </div>
                <button onclick="deleteAttendanceIndividual('${l.id}')" class="delete-notif-btn-top" style="position:static; padding: 2px 5px;" title="Remove this log">
                   <i class="fas fa-trash"></i>
                </button>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    });
  } catch (err) {
    console.error(err);
  }
}

window.deleteProjectIndividual = async (id) => {
  if (!confirm("Are you sure? This will remove the project from your view.")) return;
  try {
    const res = await fetch(`${apiBase}/projects/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      if (window.showToast) showToast("Project removed from view", "success");
      loadProjects();
    }
  } catch (err) { console.error(err); }
};

window.deleteAttendanceIndividual = async (id) => {
  if (!confirm("Remove this log from your view?")) return;
  try {
    const res = await fetch(`${apiBase}/attendance/engineer/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      if (window.showToast) showToast("Log removed", "success");
      loadAttendance();
    }
  } catch (err) { console.error(err); }
};
