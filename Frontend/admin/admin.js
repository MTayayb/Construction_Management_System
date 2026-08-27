const role = localStorage.getItem("role");
if (!token || role !== "admin") {
  localStorage.clear();
  window.location.href = "../index.html";
}

// Logout
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
    // Remove active class from all items
    navItems.forEach(nav => nav.classList.remove("active"));
    // Add active to clicked
    item.classList.add("active");

    // Hide all sections
    sections.forEach(sec => sec.classList.remove("active"));
    // Show target section
    const targetId = item.getAttribute("data-target");
    document.getElementById(targetId).classList.add("active");

    // Update Header Title
    pageTitle.textContent = item.textContent;

    // Dynamic Data Reloading
    if (targetId === "analytics-section") loadAnalytics();
    if (targetId === "projects-section") loadProjects();
    if (targetId === "reports-section") loadReports();
    if (targetId === "salary-section") loadSalaries();
    if (targetId === "change-requests-section") loadChangeRequests();
    if (targetId === "history-section") loadHistory();
    if (targetId === "attendance-management-section") loadAttendanceRecords();
  });
});

// ------------------
// Load all projects
// ------------------
async function loadProjects() {
  try {
    const projectsList = document.getElementById("projects-list");
    const projectSelect = document.getElementById("project-select");

    // Show skeletons
    projectsList.innerHTML = `
      <div class="skeleton-card"><div class="skeleton skeleton-title"></div><div class="skeleton skeleton-text"></div><div class="skeleton skeleton-text"></div></div>
      <div class="skeleton-card"><div class="skeleton skeleton-title"></div><div class="skeleton skeleton-text"></div><div class="skeleton skeleton-text"></div></div>
      <div class="skeleton-card"><div class="skeleton skeleton-title"></div><div class="skeleton skeleton-text"></div><div class="skeleton skeleton-text"></div></div>
    `;

    const res = await fetch(`${apiBase}/projects?v=${Date.now()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const projects = await res.json();

    projectsList.innerHTML = "";
    projectSelect.innerHTML = "<option value=''>Select Project</option>";

    projects.forEach((p) => {
      const pId = p._id || "unknown";
      const pName = p.name || "Unnamed Project";
      const pStatus = (p.status || "pending").toLowerCase();
      // assignedEngineers may only have IDs, so show "N/A" if name not available
      const assignedNames = p.assignedEngineers && p.assignedEngineers.length
        ? p.assignedEngineers.map((e) => e.name || e).join(", ")
        : "N/A";

      const clientName = p.client?.name || "Unknown Client";

      // Truncate description to one sentence
      const firstSentence = p.description ? (p.description.split(/[.!?]/)[0] + (p.description.includes('.') ? '.' : '')) : "No description available.";

      const card = document.createElement("div");
      card.className = "project-card";
      card.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <h3 style="margin: 0;">${pName}</h3>
            <button class="delete-notif-btn-top" onclick="event.stopPropagation(); deleteProject('${pId}')" title="Delete Project">
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
          <p style="margin-top: 1rem; color: var(--primary); font-weight: bold;">Client: ${clientName}</p>
          <p style="margin-top: 0.5rem; font-size: 0.9rem;">${firstSentence}</p>
          <p><strong>Status:</strong> <span class="status-tag ${pStatus}">${pStatus.toUpperCase()}</span></p>
          <p><strong>Engineers:</strong> ${assignedNames}</p>
          <div style="display: flex; gap: 10px; margin-top: 10px;">
            <button onclick="event.stopPropagation(); showProjectDetails('${pId}')" style="background: var(--primary); padding: 5px 10px; font-size: 0.8rem;">View Details</button>
            ${p.model3D
          ? `<button onclick="event.stopPropagation(); view3DModel('${p.model3D.replace(/\\/g, "/")}')" style="background: #4a5568; padding: 5px 10px; font-size: 0.8rem;">3D Model</button>`
          : ""
        }
          </div>
      `;

      card.onclick = () => showProjectDetails(pId);
      projectsList.appendChild(card);

      projectSelect.innerHTML += `<option value="${pId}">${pName}</option>`;
    });

    // Ensure we also populate the window cache here if not already done
    window.lastLoadedProjects = projects;
  } catch (err) {
    console.error(err);
  }
}
loadProjects();

// ------------------
// Show Project Details
// ------------------
// ------------------
// Show Project Details
// ------------------
window.showProjectDetails = (projectId) => {
  // Try finding in active projects first
  let p;
  if (window.lastLoadedProjects) {
    p = window.lastLoadedProjects.find(proj => proj._id === projectId);
  }

  // If not found (could be a deleted project in History), check history cache
  if (!p && window.historyProjects) {
    p = window.historyProjects.find(proj => proj._id === projectId);
  }

  if (p) {
    renderProjectModal(p);
  } else {
    // Fallback refetch
    fetch(`${apiBase}/projects`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(projects => {
        const p = projects.find(proj => proj._id === projectId);
        if (p) renderProjectModal(p);
        else if (window.showToast) window.showToast("Project details not available (it may have been permanently cleared from history).", "error");
      });
  }
};

function renderProjectModal(p) {
  const modal = document.getElementById("detailModal");
  const closeBtn = document.getElementById("closeDetailModal");
  const title = document.getElementById("modalDetailTitle");
  const body = document.getElementById("modalDetailBody");

  title.textContent = p.name;
  const assignedNames = p.assignedEngineers.length
    ? p.assignedEngineers.map((e) => e.name || e).join(", ")
    : "N/A";

  body.innerHTML = `
    <div style="padding: 10px;">
      <p><strong>Status:</strong> <span class="status-tag ${(p.status || 'pending').toLowerCase()}">${(p.status || 'PENDING').toUpperCase()}</span></p>
      <p><strong>Client:</strong> ${p.client?.name || "Unknown"}</p>
      <p><strong>Assigned Engineers:</strong> ${assignedNames}</p>
      <div style="margin-top: 1.5rem;">
        <h4 style="border-bottom: 2px solid var(--primary); display: inline-block; margin-bottom: 10px;">Progress History</h4>
        <div id="modal-progress-history">
          ${p.progressReports && p.progressReports.length
      ? p.progressReports.map(pr => `
              <div style="font-size: 0.9rem; margin-bottom: 0.5rem; padding: 8px; background: #f8fafc; border-radius: 8px;">
                <strong>${pr.engineer?.name || 'Engineer'}:</strong> ${pr.progress}
                <div style="font-size: 0.75rem; color: #718096; margin-top: 4px;">${new Date(pr.date).toLocaleString()}</div>
              </div>
            `).join('')
      : '<p style="font-size: 0.9rem; color: #718096;">No progress updates yet.</p>'
    }
        </div>
      </div>
      ${p.model3D ? `
        <div style="margin-top: 20px;">
          <button onclick="view3DModel('${p.model3D.replace(/\\/g, "/")}')" style="width: 100%;">View 3D Design</button>
        </div>
      ` : ''}
    </div>
  `;

  if (closeBtn) closeBtn.onclick = () => modal.classList.remove("active");
  modal.classList.add("active");
}

// ------------------
// Global Modal handling
// ------------------
window.addEventListener("click", (e) => {
  const modals = document.querySelectorAll(".notification-modal");
  modals.forEach(m => {
    if (e.target === m) {
      m.classList.remove("active");
    }
  });
});

// ------------------
// Delete Project
// ------------------
window.deleteProject = async (projectId) => {
  if (!confirm("Are you sure you want to delete this project? It will be removed from your view and engineer's view.")) return;

  try {
    const res = await fetch(`${apiBase}/projects/${projectId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (res.ok) {
      if (window.showToast) showToast(data.message, "success");
      loadProjects();
    } else {
      if (window.showToast) showToast(data.message || "Failed to delete project", "error");
    }
  } catch (err) {
    console.error(err);
    if (window.showToast) showToast("Connection error", "error");
  }
};

// ------------------
// Load engineers
// ------------------
async function loadEngineers() {
  try {
    const res = await fetch(`${apiBase}/auth/engineers`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const engineers = await res.json();
    const engineerSelect = document.getElementById("engineer-select");
    engineerSelect.innerHTML = "<option value=''>Select Engineer</option>";

    engineers.forEach((eng) => {
      engineerSelect.innerHTML += `<option value="${eng._id}">${eng.name}</option>`;
    });
  } catch (err) {
    console.error(err);
  }
}
loadEngineers();

// ------------------
// Assign engineer
// ------------------
document
  .getElementById("assign-engineer-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const projectId = document.getElementById("project-select").value;
    const engineerId = document.getElementById("engineer-select").value;
    const msg = document.getElementById("assign-message");

    if (!projectId || !engineerId) {
      if (window.showToast) showToast("Select project and engineer", "error");
      return;
    }

    try {
      const res = await fetch(`${apiBase}/projects/assign-engineer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ projectId, engineerId }),
      });
      const data = await res.json();
      if (res.ok) {
        if (window.showToast) showToast(`Engineer assigned successfully!`, "success");
        loadProjects();
      } else {
        if (window.showToast) showToast(data.message || "Failed to assign engineer", "error");
      }
    } catch (err) {
      console.error(err);
      if (window.showToast) showToast("Assignment failed due to server error", "error");
    }
  });

// ------------------
// Load Change Requests
// ------------------
async function loadChangeRequests() {
  try {
    // Requires backend to mount changeRequest routes at /api/change-requests
    const res = await fetch(`${apiBase}/change-requests/all`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const requests = await res.json();
    const list = document.getElementById("change-requests-list");
    list.innerHTML = "";

    if (!requests || requests.length === 0) {
      list.innerHTML = "<p>No pending requests.</p>";
      return;
    }

    requests.forEach((r) => {
      // Handle populated or raw fields safely
      const project = r.project ? (r.project.name || "Unknown Project") : "Unknown Project";
      const client = r.client ? (r.client.name || "Unknown Client") : "Unknown Client";

      list.innerHTML += `
        <div class="project-card">
          <h3>${project}</h3>
          <p><strong>Client:</strong> ${client}</p>
          <p><strong>Request:</strong> ${r.description}</p>
          <p><strong>Status:</strong> ${r.status}</p>
          <div style="display: flex; gap: 10px; margin-top: 10px;">
            ${r.status === 'pending' ? `<button onclick="respondToRequest('${r._id}', 'approved')">Approve</button> <button onclick="respondToRequest('${r._id}', 'rejected')">Reject</button>` : ''}
            <button onclick="deleteChangeRequest('${r._id}')" style="background:none; border:none; color: #e53e3e; cursor:pointer; padding: 5px;">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      `;
    });
  } catch (err) {
    console.error(err);
  }
}
loadChangeRequests();

window.respondToRequest = async (id, status) => {
  try {
    const res = await fetch(`${apiBase}/change-requests/respond/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    });
    if (res.ok) {
      if (window.showToast) showToast(`Request ${status}`, "success");
      loadChangeRequests();
    } else {
      if (window.showToast) showToast("Failed to update request", "error");
    }
  } catch (err) {
    console.error(err);
    if (window.showToast) showToast("Server error during response", "error");
  }
};


// ------------------
// Load Site Reports
// ------------------
async function loadReports() {
  try {
    const list = document.getElementById("reports-list");

    // Show skeletons
    list.innerHTML = `
      <div class="skeleton-card"><div class="skeleton skeleton-title"></div><div class="skeleton skeleton-text"></div><div class="skeleton skeleton-text"></div></div>
      <div class="skeleton-card"><div class="skeleton skeleton-title"></div><div class="skeleton skeleton-text"></div><div class="skeleton skeleton-text"></div></div>
    `;

    const res = await fetch(`${apiBase}/reports/all`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const reports = await res.json();
    list.innerHTML = "";

    if (!reports || reports.length === 0) {
      list.innerHTML = "<p>No reports found.</p>";
      return;
    }

    reports.forEach((r) => {
      const engineerName = r.engineer ? (r.engineer.name || "Unknown") : "Unknown";
      const projectName = r.project ? (r.project.name || "Unknown") : "Unknown";

      let fileButtons = "";
      if (r.fileUrl) {
        const fileUrl = `${apiBase.replace('/api', '')}/${r.fileUrl.replace(/\\/g, '/')}`;
        fileButtons = `
          <div style="display: flex; gap: 10px; margin-top: 1rem;">
            <button onclick="window.open('${fileUrl}', '_blank')" style="flex: 1; background: #4CAF50; color: white; padding: 10px; border: none; border-radius: 8px; cursor: pointer;">
              <i class="fas fa-image"></i> View Picture
            </button>
            <button onclick="generateReportPDF('${r._id}')" style="flex: 1; background: var(--primary); color: white; padding: 10px; border: none; border-radius: 8px; cursor: pointer;">
              <i class="fas fa-file-pdf"></i> PDF
            </button>
          </div>
        `;
      }

      list.innerHTML += `
        <div class="project-card">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <h3 style="margin: 0;">${r.title}</h3>
            <button class="delete-notif-btn-top" onclick="deleteReport('${r._id}')" title="Delete Report">
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
          <p><strong>Project:</strong> ${projectName}</p>
          <p><strong>Engineer:</strong> ${engineerName}</p>
          <p><strong>Description:</strong> ${r.description}</p>
          <p><strong>Date:</strong> ${new Date(r.createdAt).toLocaleDateString()}</p>
          ${fileButtons}
        </div>
      `;
    });
  } catch (err) {
    console.error(err);
  }
}
loadReports();

// Generate PDF Report
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

    if (!report) {
      if (window.showToast) showToast("Report details not available (may have been cleared).", "error");
      return;
    }

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
    if (window.showToast) showToast("Report downloaded (Text)!", "success");
  } catch (err) {
    console.error("Generate report error:", err);
    if (window.showToast) showToast("Error generating report", "error");
  }
};

// Generate Project Details PDF
window.generateProjectPDF = async (projectId) => {
  try {
    // Try to find in cache first
    let p;
    if (window.lastLoadedProjects) p = window.lastLoadedProjects.find(proj => proj._id === projectId);
    if (!p && window.historyProjects) p = window.historyProjects.find(proj => proj._id === projectId);

    if (!p) {
      const res = await fetch(`${apiBase}/projects`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const projects = await res.json();
      p = projects.find(proj => proj._id === projectId);
    }

    if (!p) {
      if (window.showToast) showToast("Project details not available (may have been cleared).", "error");
      return;
    }

    const projectContent = `
CMS - PROJECT DETAILS
=====================

Project Name:  ${p.name}
Client Name:    ${p.client?.name || 'Unknown'}
Status:         ${p.status}
Created:        ${new Date(p.createdAt).toLocaleDateString()}

DESCRIPTION:
------------
${p.description || "No description available."}

ASSIGNED ENGINEERS:
-------------------
${p.assignedEngineers && p.assignedEngineers.length
        ? p.assignedEngineers.map(e => `- ${e.name || e}`).join('\n')
        : "No engineers assigned."}

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
    if (window.showToast) showToast("Project details downloaded (Text)!", "success");
  } catch (err) {
    console.error("Generate project PDF error:", err);
    if (window.showToast) showToast("Error generating project PDF", "error");
  }
};

// ------------------
// Load Worker Salaries
// ------------------
async function loadSalaries() {
  try {
    const res = await fetch(`${apiBase}/salary/all`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const salaries = await res.json();
    const list = document.getElementById("salary-list");
    list.innerHTML = "";

    if (!salaries || salaries.length === 0) {
      list.innerHTML = "<p>No salary records found.</p>";
      return;
    }

    salaries.forEach((s) => {
      const workerName = s.worker?.name || s.worker || "Unknown";
      const displaySalary = s.totalSalary !== undefined ? s.totalSalary : (s.salary || 0);
      list.innerHTML += `
        <div class="project-card">
          <h3>${workerName}</h3>
          <p><strong>Total Salary:</strong> Rs.${displaySalary}</p>
          <p><strong>Total Hours:</strong> ${s.totalHours || 0} hrs</p>
          <button onclick="deleteSalary('${s.workerId}')" style="background:none; border:none; color: #e53e3e; cursor:pointer; padding: 5px; margin-top: 10px;">
            <i class="fas fa-trash"></i> Hide from View
          </button>
        </div>
      `;
    });
  } catch (err) {
    console.error(err);
  }
}
loadSalaries();

// ------------------
// View 3D Model
// ------------------
function view3DModel(path) {
  // Safe filename extraction
  // 1. Convert backslashes to slashes
  // 2. Split by any likely separator
  // 3. Take segment that ends with .glb/.gltf OR the last segment
  const normalized = path.replace(/\\/g, "/");
  const filename = normalized.split("/").pop();

  // Open generic viewer
  window.open(`../viewer.html?model=${filename}`, "_blank");
}

// ------------------
// Load Analytics
// ------------------
async function loadAnalytics() {
  try {
    // Show skeletons for stats
    document.getElementById("total-projects").innerHTML = '<div class="skeleton" style="width:30px;height:30px;display:inline-block;"></div>';
    document.getElementById("completed-projects").innerHTML = '<div class="skeleton" style="width:30px;height:30px;display:inline-block;"></div>';
    document.getElementById("completion-rate").innerHTML = '<div class="skeleton" style="width:20px;height:20px;display:inline-block;"></div>';
    if (document.getElementById("total-reports")) document.getElementById("total-reports").innerHTML = '<div class="skeleton" style="width:30px;height:30px;display:inline-block;"></div>';
    document.getElementById("material-in").innerHTML = '<div class="skeleton" style="width:30px;height:30px;display:inline-block;"></div>';
    document.getElementById("material-out").innerHTML = '<div class="skeleton" style="width:30px;height:30px;display:inline-block;"></div>';
    document.getElementById("material-balance").innerHTML = '<div class="skeleton" style="width:30px;height:30px;display:inline-block;"></div>';
    document.getElementById("total-salary").innerHTML = '<div class="skeleton" style="width:60px;height:30px;display:inline-block;"></div>';

    const res = await fetch(`${apiBase}/analytics/overview?v=${Date.now()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();

    console.log("Analytics Data:", data); // Debug log

    // Update project stats
    document.getElementById("total-projects").textContent = data.projects.total;
    document.getElementById("completed-projects").textContent = data.projects.completed;
    document.getElementById("completion-rate").textContent = data.projects.completionRate;
    const reportCard = document.getElementById("total-reports");
    if (reportCard) reportCard.textContent = data.reports?.total || 0;

    // Update material stats
    document.getElementById("material-in").textContent = data.materials.in || 0;
    document.getElementById("material-out").textContent = data.materials.out || 0;
    document.getElementById("material-balance").textContent = data.materials.balance || 0;

    // Render Material Breakdown List
    const analyticsSec = document.getElementById("analytics-section");
    let existingBreakdown = document.getElementById("material-breakdown-details");
    if (existingBreakdown) existingBreakdown.remove();

    if (data.materials.breakdown && data.materials.breakdown.length) {
      const breakdownDiv = document.createElement("div");
      breakdownDiv.id = "material-breakdown-details";
      breakdownDiv.style.marginTop = "2rem";
      breakdownDiv.style.padding = "1.5rem";
      breakdownDiv.style.background = "#f8fafc";
      breakdownDiv.style.borderRadius = "12px";
      breakdownDiv.style.transition = "background-color 0.5s ease";

      breakdownDiv.innerHTML = `
        <h4 style="margin-bottom: 1rem; color: var(--primary);">Detailed Material Breakdown:</h4>
        <div style="display: grid; gap: 10px;">
          ${data.materials.breakdown.map(m => `
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #edf2f7; padding-bottom: 0.5rem;">
              <span><strong>${m.name}</strong> (${m.inOut})</span>
              <span>${m.total} ${m.unit}</span>
            </div>
          `).join('')}
        </div>
      `;
      analyticsSec.appendChild(breakdownDiv);
    }

    // Update salary stats
    const totalPaid = data.salaries?.totalPaid || 0;
    document.getElementById("total-salary").textContent = `Rs.${totalPaid.toLocaleString()}`;

    // Render Recent Reports List
    let reportsSection = document.getElementById("recent-progress-reports");
    if (reportsSection) reportsSection.remove();

    if (data.recentReports && data.recentReports.length) {
      const reportsDiv = document.createElement("div");
      reportsDiv.id = "recent-progress-reports";
      reportsDiv.style.marginTop = "2rem";
      reportsDiv.style.padding = "1.5rem";
      reportsDiv.style.background = "#fff";
      reportsDiv.style.borderRadius = "12px";
      reportsDiv.style.boxShadow = "0 4px 15px rgba(0,0,0,0.05)";

      reportsDiv.innerHTML = `
        <h4 style="margin-bottom: 1rem; color: var(--primary);">Recent Progress Reports:</h4>
        <div style="display: grid; gap: 10px;">
          ${data.recentReports.map(r => `
            <div style="border-bottom: 1px solid #edf2f7; padding-bottom: 0.5rem;">
              <div style="display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 0.25rem;">
                <span>${r.title}</span>
                <span style="font-size: 0.75rem; color: #718096;">${new Date(r.createdAt).toLocaleDateString()}</span>
              </div>
              <p style="font-size: 0.85rem; color: #4a5568; margin: 0;"><strong>Project:</strong> ${r.project?.name || 'N/A'} | <strong>Engineer:</strong> ${r.engineer?.name || 'N/A'}</p>
            </div>
          `).join('')}
        </div>
      `;
      analyticsSec.appendChild(reportsDiv);
    }

    // Add click listeners for drill-down
    setupAnalyticsClickListeners();
  } catch (err) {
    console.error("Load analytics error:", err);
  }
}

function setupAnalyticsClickListeners() {
  const cards = document.querySelectorAll("#analytics-section .stat-card");

  cards.forEach(card => {
    card.style.cursor = "pointer";
    card.addEventListener("click", () => {
      const label = card.querySelector("p").textContent.toLowerCase();

      if (label.includes("project")) {
        document.querySelector('.nav-item[data-target="projects-section"]').click();
      } else if (label.includes("material")) {
        const details = document.getElementById("material-breakdown-details");
        if (details) {
          details.scrollIntoView({ behavior: 'smooth' });
          details.style.backgroundColor = '#ecfdf5';
          setTimeout(() => details.style.backgroundColor = '#f8fafc', 2000);
        } else {
          document.querySelector('.nav-item[data-target="reports-section"]').click();
        }
      } else if (label.includes("salar")) {
        document.querySelector('.nav-item[data-target="salary-section"]').click();
      } else if (label.includes("attend")) {
        document.querySelector('.nav-item[data-target="attendance-management-section"]').click();
      } else if (label.includes("report")) {
        document.querySelector('.nav-item[data-target="reports-section"]').click();
      }
    });
  });
}
loadAnalytics();

// ------------------
// Load Attendance Records (Consolidated)
// ------------------
async function loadAttendanceRecords() {
  try {
    const res = await fetch(`${apiBase}/attendance/all`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const records = await res.json();

    const list = document.getElementById("attendance-records-list");
    list.innerHTML = "";

    if (!records.length) {
      list.innerHTML = "<p>No attendance records found.</p>";
      return;
    }

    // Grouping records by worker and project for a consolidated view
    const grouped = {};
    records.forEach(r => {
      const key = `${r.worker?._id || 'unknown'}_${r.project?._id || 'unknown'}`;
      if (!grouped[key]) {
        grouped[key] = {
          workerName: r.worker?.name || 'Unknown',
          workerEmail: r.worker?.email || 'N/A',
          projectName: r.project?.name || 'N/A',
          logs: []
        };
      }
      grouped[key].logs.push({
        status: r.status.toUpperCase(),
        time: new Date(r.time).toLocaleString()
      });
    });

    Object.values(grouped).forEach(g => {
      list.innerHTML += `
        <div class="project-card">
          <h3>${g.workerName}</h3>
          <p><strong>Project:</strong> ${g.projectName}</p>
          <div style="margin-top: 1rem; border-top: 1px solid #edf2f7; padding-top: 0.5rem;">
            <p style="font-size: 0.85rem; font-weight: bold; margin-bottom: 0.5rem;">Recent Logs:</p>
            ${g.logs.map(l => `
              <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 0.25rem;">
                <span class="status-tag ${l.status.toLowerCase()}">${l.status}</span>
                <span>${l.time}</span>
              </div>
            `).join('')}
          </div>
          <button onclick="deleteAttendanceGroup('${g.workerName}', '${g.projectName}')" style="background:none; border:none; color: #718096; cursor:pointer; padding: 5px; margin-top: 10px; font-size: 0.8rem;">
            <i class="fas fa-eye-slash"></i> Hide these records (individual delete not implemented)
          </button>
        </div>
      `;
    });
  } catch (err) {
    console.error("Load attendance records error:", err);
    if (window.showToast) showToast("Error loading attendance", "error");
  }
}
loadAttendanceRecords();

// ------------------
// Download Attendance CSV
// ------------------
async function downloadAttendanceCSV() {
  try {
    const res = await fetch(`${apiBase}/attendance/export-csv`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      if (window.showToast) showToast("Failed to download CSV", "error");
      return;
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "attendance-records.csv";
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    if (window.showToast) showToast("CSV downloaded successfully!", "success");
  } catch (err) {
    console.error("Download CSV error:", err);
    if (window.showToast) showToast("Error downloading CSV", "error");
  }
}

// ------------------
// Deletion & History
// ------------------

window.deleteReport = async (reportId) => {
  if (!confirm("Are you sure? This will hide the report from your dashboard, but it will remain for others and in history.")) return;
  try {
    const res = await fetch(`${apiBase}/reports/${reportId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      if (window.showToast) showToast("Report deleted from view", "success");
      loadReports();
    }
  } catch (err) {
    console.error(err);
  }
};

window.loadHistory = async () => {
  try {
    const res = await fetch(`${apiBase}/reports/history`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const { projects, reports, changeRequests, attendance, salaries } = await res.json();

    // Cache for detailing/downloading
    window.historyProjects = projects;
    window.historyReports = reports;

    const projList = document.getElementById("history-projects-list");
    const repList = document.getElementById("history-reports-list");
    const reqList = document.getElementById("history-requests-list");
    const attList = document.getElementById("history-attendance-list");
    const salList = document.getElementById("history-salary-list");

    projList.innerHTML = "";
    repList.innerHTML = "";
    reqList.innerHTML = "";
    attList.innerHTML = "";
    salList.innerHTML = "";

    // 1. Projects
    if (!projects || projects.length === 0) projList.innerHTML = "<p>No deleted project history.</p>";
    projects.forEach(p => {
      projList.innerHTML += `
                <div class="project-card" style="opacity: 0.8;">
                    <h3>${p.name}</h3>
                    <p><strong>Client:</strong> ${p.client?.name || "N/A"}</p>
                    <p><strong>Description:</strong> ${p.description || "No description"}</p>
                    <div style="margin-top: 10px;">
                        <button onclick="generateProjectPDF('${p._id}')" style="background: var(--primary); font-size: 0.8rem; padding: 5px 10px;">Download details (Text)</button>
                    </div>
                </div>
            `;
    });

    // 2. Reports
    if (!reports || reports.length === 0) repList.innerHTML = "<p>No deleted report history.</p>";
    reports.forEach(r => {
      repList.innerHTML += `
                <div class="project-card" style="opacity: 0.8;">
                    <h3>${r.title}</h3>
                    <p><strong>Project:</strong> ${r.project?.name || "N/A"}</p>
                    <p><strong>Engineer:</strong> ${r.engineer?.name || "N/A"}</p>
                    <div style="display: flex; gap: 10px; margin-top: 10px;">
                        <button onclick="generateReportPDF('${r._id}')" style="background: #4a5568; font-size: 0.8rem; padding: 5px 10px;">Report details (Text)</button>
                    </div>
                </div>
            `;
    });

    // 3. Change Requests
    if (!changeRequests || changeRequests.length === 0) reqList.innerHTML = "<p>No deleted request history.</p>";
    changeRequests.forEach(req => {
      reqList.innerHTML += `
             <div class="project-card" style="opacity: 0.8;">
                <h3>${req.project?.name || "Deleted Project"}</h3>
                <p><strong>Client:</strong> ${req.client?.name || "N/A"}</p>
                <p><strong>Request:</strong> ${req.description}</p>
            </div>
        `;
    });

    // 4. Attendance
    if (!attendance || attendance.length === 0) attList.innerHTML = "<p>No deleted attendance history.</p>";
    attendance.forEach(att => {
      attList.innerHTML += `
             <div class="project-card" style="opacity: 0.8; padding: 10px;">
                <p><strong>Worker:</strong> ${att.worker?.name || "N/A"}</p>
                <p><strong>Project:</strong> ${att.project?.name || "N/A"}</p>
                <p><strong>Status:</strong> <span class="status-tag ${att.status.toLowerCase()}">${att.status.toUpperCase()}</span></p>
                <p><small>${new Date(att.time).toLocaleString()}</small></p>
            </div>
        `;
    });

    // 5. Salaries
    if (!salaries || salaries.length === 0) salList.innerHTML = "<p>No deleted salary history.</p>";
    salaries.forEach(sal => {
      salList.innerHTML += `
             <div class="project-card" style="opacity: 0.8;">
                <h3>${sal.worker?.name || "N/A"}</h3>
                <p><strong>Project Reference:</strong> ${sal.project?.name || "N/A"}</p>
                <p><strong>Date range:</strong> ${new Date(sal.periodStart).toLocaleDateString()} - ${new Date(sal.periodEnd).toLocaleDateString()}</p>
            </div>
        `;
    });
  } catch (err) {
    console.error(err);
  }
};

window.clearHistory = async () => {
  if (!confirm("Are you sure you want to clear your history? This action is permanent for your account.")) return;
  try {
    const res = await fetch(`${apiBase}/reports/history/clear`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      if (window.showToast) showToast("History cleared", "success");
      loadHistory();
    }
  } catch (err) {
    console.error(err);
  }
};

window.deleteChangeRequest = async (requestId) => {
  if (!confirm("Are you sure? This will hide the request from your view.")) return;
  try {
    const res = await fetch(`${apiBase}/change-requests/${requestId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      if (window.showToast) showToast("Change request deleted", "success");
      loadChangeRequests();
    }
  } catch (err) { console.error(err); }
};

window.deleteSalary = async (workerId) => {
  if (!confirm("Are you sure? This will hide the worker's salary from your view.")) return;
  try {
    const res = await fetch(`${apiBase}/salary/${workerId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      if (window.showToast) showToast("Salary record hidden", "success");
      loadSalaries();
    } else {
      const data = await res.json();
      if (window.showToast) showToast(data.message || "Failed to hide salary", "error");
    }
  } catch (err) { console.error(err); }
};

window.deleteAttendanceGroup = async (workerName, projectName) => {
  if (!confirm(`This will hide ALL visible logs for ${workerName} in ${projectName}. Proceed?`)) return;
  try {
    const resAll = await fetch(`${apiBase}/attendance/all`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const records = await resAll.json();
    const toDelete = records.filter(r => (r.worker?.name === workerName || r.worker === workerName) && (r.project?.name === projectName || r.project === projectName));

    for (const rec of toDelete) {
      await fetch(`${apiBase}/attendance/${rec._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
    }
    if (window.showToast) showToast(`Records for ${workerName} hidden`, "success");
    loadAttendanceRecords();
  } catch (err) { console.error(err); }
};
