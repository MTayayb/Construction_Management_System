const role = localStorage.getItem("role");
if (!token || role !== "client") {
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
    navItems.forEach(nav => nav.classList.remove("active"));
    item.classList.add("active");

    sections.forEach(sec => sec.classList.remove("active"));
    const targetId = item.getAttribute("data-target");
    document.getElementById(targetId).classList.add("active");

    pageTitle.textContent = item.textContent;

    // Reload data based on target
    if (targetId === "analytics-section") loadClientAnalytics();
    if (targetId === "projects-section") loadProjects();
    if (targetId === "progress-reports-section") loadProgressReports();
    if (targetId === "change-request-section") loadMyChangeRequests();
  });
});

// ------------------
// Load client projects
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

    const myProjects = projects; // Define myProjects
    window.lastLoadedProjects = myProjects; // Cache for details view

    if (!myProjects || !myProjects.length) {
      projectsList.innerHTML = "<p>No projects found.</p>";
      return;
    }

    myProjects.forEach(p => {
      const pId = p._id || "unknown";
      const pName = p.name || "Unnamed Project";
      const pStatus = (p.status || "pending").toLowerCase();
      // Calculate assigned engineers
      const assignedNames = p.assignedEngineers && p.assignedEngineers.length
        ? p.assignedEngineers.map((e) => e.name || e).join(", ")
        : "N/A";

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
        <p style="margin-top: 1rem;">${firstSentence}</p>
        <p><strong>Status:</strong> <span class="status-tag ${pStatus}">${pStatus.toUpperCase()}</span></p>
        <p><strong>Engineers:</strong> ${assignedNames}</p>
        <div style="display: flex; gap: 10px; margin-top: 10px;">
          <button onclick="event.stopPropagation(); showProjectDetails('${pId}')" style="background: var(--primary); padding: 5px 10px; font-size: 0.8rem;">View Details</button>
          ${p.model3D ? `<button onclick="event.stopPropagation(); view3DModel('${p.model3D.replace(/\\/g, "/")}')" style="background: #4a5568; padding: 5px 10px; font-size: 0.8rem;">3D Model</button>` : ""}
        </div>
      `;
      card.onclick = () => showProjectDetails(pId);
      projectsList.appendChild(card);

      projectSelect.innerHTML += `<option value="${pId}">${pName}</option>`;
    });
  } catch (err) {
    console.error(err);
  }
}
loadProjects();

// ------------------
// Show Project Details
// ------------------
window.showProjectDetails = (projectId) => {
  if (window.lastLoadedProjects) {
    const p = window.lastLoadedProjects.find(proj => proj._id === projectId);
    if (p) renderProjectModal(p);
  } else {
    fetch(`${apiBase}/projects`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(projects => {
        const p = projects.find(proj => proj._id === projectId);
        if (p) renderProjectModal(p);
      });
  }
};

function renderProjectModal(p) {
  const modal = document.getElementById("detailModal");
  const closeBtn = document.getElementById("closeDetailModal");
  const title = document.getElementById("modalDetailTitle");
  const body = document.getElementById("modalDetailBody");

  title.textContent = p.name;
  const assignedNames = p.assignedEngineers && p.assignedEngineers.length
    ? p.assignedEngineers.map((e) => e.name || e).join(", ")
    : "N/A";

  body.innerHTML = `
    <div style="padding: 10px;">
      <p><strong>Status:</strong> <span class="status-tag ${(p.status || 'pending').toLowerCase()}">${(p.status || 'PENDING').toUpperCase()}</span></p>
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
// Delete Project
// ------------------
window.deleteProject = async (projectId) => {
  if (!confirm("Are you sure? This will delete the project for you, the admin, and assigned engineers.")) return;

  try {
    const res = await fetch(`${apiBase}/projects/${projectId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (res.ok) {
      if (window.showToast) showToast("Project deleted successfully", "success");
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
// Submit new project
// ------------------
document.getElementById("new-project-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData();
  formData.append("name", document.getElementById("project-name").value);
  formData.append("description", document.getElementById("project-description").value);

  const file = document.getElementById("project-model").files[0];
  if (file) formData.append("model3D", file);

  try {
    const res = await fetch(`${apiBase}/projects/submit-project`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });
    const data = await res.json();

    if (res.ok) {
      if (window.showToast) showToast("Project submitted successfully!", "success");
      document.getElementById("new-project-form").reset();
      loadProjects();
    } else {
      if (window.showToast) showToast(data.message || "Failed to submit project", "error");
    }
  } catch (err) {
    console.error(err);
    if (window.showToast) showToast("Error connecting to server", "error");
  }
});

// ------------------
// Submit change request
// ------------------
document.getElementById("change-request-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const projectId = document.getElementById("project-select").value;
  const description = document.getElementById("change-description").value;

  if (!projectId) {
    if (window.showToast) showToast("Select a project", "error");
    return;
  }

  try {
    const res = await fetch(`${apiBase}/change-requests/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ projectId, description }),
    });

    const data = await res.json();

    if (res.ok) {
      if (window.showToast) showToast("Change request submitted!", "success");
      document.getElementById("change-request-form").reset();
      loadMyChangeRequests();
    } else {
      if (window.showToast) showToast(data.message || "Failed to submit change request", "error");
    }
  } catch (err) {
    console.error(err);
    if (window.showToast) showToast("Communication failure", "error");
  }
});

// ------------------
// View 3D Model
// ------------------
function view3DModel(modelPath) {
  // Safe filename extraction
  const normalized = modelPath.replace(/\\/g, "/");
  const filename = normalized.split("/").pop();
  window.open(`../viewer.html?model=${filename}`, "_blank");
}

// ------------------
// Load Progress Reports
// ------------------
async function loadProgressReports() {
  try {
    const reportsList = document.getElementById("progress-reports-list");

    // Show skeletons
    reportsList.innerHTML = `
      <div class="skeleton-card"><div class="skeleton skeleton-title"></div><div class="skeleton skeleton-text"></div><div class="skeleton skeleton-text"></div></div>
      <div class="skeleton-card"><div class="skeleton skeleton-title"></div><div class="skeleton skeleton-text"></div><div class="skeleton skeleton-text"></div></div>
    `;

    const res = await fetch(`${apiBase}/reports/client`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const reports = await res.json();
    reportsList.innerHTML = "";

    if (!reports.length) {
      reportsList.innerHTML = "<p>No progress reports available yet. Reports will appear here once engineers submit them for your projects.</p>";
      return;
    }

    reports.forEach(r => {
      const date = new Date(r.createdAt).toLocaleDateString();

      let fileButtons = "";
      if (r.fileUrl) {
        const fileUrl = `${apiBase.replace('/api', '')}/${r.fileUrl.replace(/\\/g, '/')}`;
        fileButtons = `
          <div style="display: flex; gap: 10px; margin-top: 1rem;">
            <button onclick="window.open('${fileUrl}', '_blank')" style="flex: 1; background: #4CAF50; color: white; padding: 10px; border: none; border-radius: 8px; cursor: pointer;">
              <i class="fas fa-image"></i> View Picture
            </button>
            <button onclick="generateClientReportPDF('${r._id}')" style="flex: 1; background: var(--primary); color: white; padding: 10px; border: none; border-radius: 8px; cursor: pointer;">
              <i class="fas fa-file-pdf"></i> Download PDF Report
            </button>
          </div>
        `;
      }

      reportsList.innerHTML += `
        <div class="project-card">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <h3 style="margin: 0;">${r.title}</h3>
            <button class="delete-notif-btn-top" onclick="deleteReport('${r._id}')" title="Delete Report">
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
          <p><strong>Project:</strong> ${r.project?.name || 'N/A'}</p>
          <p><strong>Engineer:</strong> ${r.engineer?.name || 'N/A'}</p>
          <p>${r.description}</p>
          <p><small>Submitted: ${date}</small></p>
          ${fileButtons}
        </div>
      `;
    });
  } catch (err) {
    console.error(err);
  }
}
loadProgressReports();

// Deletion
window.deleteReport = async (reportId) => {
  if (!confirm("Are you sure? This will hide the report from your view.")) return;
  try {
    const res = await fetch(`${apiBase}/reports/${reportId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      if (window.showToast) showToast("Report deleted", "success");
      loadProgressReports();
    }
  } catch (err) { console.error(err); }
};

// Generate PDF Report for client
window.generateClientReportPDF = async (reportId) => {
  try {
    const res = await fetch(`${apiBase}/reports/client`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const reports = await res.json();
    const report = reports.find(r => r._id === reportId);

    if (!report) {
      if (window.showToast) showToast("Report not found", "error");
      return;
    }

    const reportContent = `
PROJECT PROGRESS REPORT
=======================

Title: ${report.title}
Project: ${report.project?.name || 'N/A'}
Engineer: ${report.engineer?.name || 'N/A'}
Submitted: ${new Date(report.createdAt).toLocaleDateString()}

DESCRIPTION:
${report.description}

---
Generated: ${new Date().toLocaleString()}
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
    if (window.showToast) showToast("Report downloaded", "success");
  } catch (err) {
    console.error("Generate PDF error:", err);
    if (window.showToast) showToast("Error generating report", "error");
  }
};

// ------------------
// Load Client Analytics
// ------------------
async function loadClientAnalytics() {
  try {
    // Show skeletons for labels
    document.getElementById("client-total-projects").innerHTML = '<div class="skeleton" style="width:30px;height:30px;display:inline-block;"></div>';
    document.getElementById("client-material-in").innerHTML = '<div class="skeleton" style="width:30px;height:30px;display:inline-block;"></div>';
    if (document.getElementById("client-reports")) {
      document.getElementById("client-reports").innerHTML = '<div class="skeleton" style="width:30px;height:30px;display:inline-block;"></div>';
    }

    const res = await fetch(`${apiBase}/analytics/client`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();

    // Update project stats
    document.getElementById("client-total-projects").textContent = data.projects.total || 0;

    // Update material stats
    document.getElementById("client-material-in").textContent = data.materials?.in || 0;

    // Update reports count
    const reportsCount = document.getElementById("client-reports");
    if (reportsCount) reportsCount.textContent = data.reports?.total || 0;

    // Show material breakdown if available (Details view)
    let materialDetails = "";
    if (data.materials.breakdown && data.materials.breakdown.length) {
      materialDetails = `
        <div id="material-breakdown-details" style="margin-top: 2rem; font-size: 0.9rem; background: #fff; padding: 1.5rem; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
          <h4 style="margin-bottom: 1rem; color: var(--primary);">Material Breakdown:</h4>
          ${data.materials.breakdown.map(m => `
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; border-bottom: 1px solid #edf2f7; padding-bottom: 0.5rem;">
              <span><strong>${m.name}</strong> (${m.inOut})</span>
              <span>${m.total} ${m.unit}</span>
            </div>
          `).join('')}
        </div>
      `;

      const analyticsSec = document.getElementById("analytics-section");
      let existing = document.getElementById("material-breakdown-details");
      if (existing) existing.remove();

      const detailsDiv = document.createElement("div");
      detailsDiv.innerHTML = materialDetails;
      analyticsSec.appendChild(detailsDiv.querySelector('#material-breakdown-details'));
    }

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
      document.getElementById("analytics-section").appendChild(reportsDiv);
    }

    // Add Click Listeners for Drill-down
    setupClientAnalyticsClickListeners();
  } catch (err) {
    console.error("Load client analytics error:", err);
  }
}

function setupClientAnalyticsClickListeners() {
  const cards = document.querySelectorAll("#analytics-section .stat-card");
  cards.forEach(card => {
    card.style.cursor = "pointer";
    card.addEventListener("click", () => {
      const label = card.querySelector("p").textContent.toLowerCase();
      if (label.includes("project")) {
        document.querySelector('.nav-item[data-target="projects-section"]').click();
      } else if (label.includes("material")) {
        // Material breakdown details scroll and highlight
        const details = document.getElementById("material-breakdown-details");
        if (details) {
          details.scrollIntoView({ behavior: 'smooth' });
          details.style.backgroundColor = '#f0f9ff';
          setTimeout(() => details.style.backgroundColor = '#fff', 2000);
        } else {
          if (window.showToast) showToast("No material data to show yet", "info");
        }
      } else if (label.includes("report")) {
        document.querySelector('.nav-item[data-target="progress-reports-section"]').click();
      }
    });
  });
}
loadClientAnalytics();

// ------------------
// Load My Change Requests
// ------------------
async function loadMyChangeRequests() {
  try {
    const res = await fetch(`${apiBase}/change-requests/my-requests`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const requests = await res.json();
    const list = document.getElementById("change-requests-list");

    list.innerHTML = "";

    if (!requests.length) {
      list.innerHTML = "<p>No change requests submitted yet.</p>";
      return;
    }

    requests.forEach(r => {
      const statusClass = r.status.toLowerCase();
      list.innerHTML += `
        <div class="project-card">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <h3>${r.project?.name || 'Deleted Project'}</h3>
            <span class="status-tag ${statusClass}">${r.status.toUpperCase()}</span>
          </div>
          <p><strong>Description:</strong> ${r.description}</p>
          ${r.responseMessage ? `<p style="margin-top: 0.5rem; color: var(--primary);"><strong>Admin Feedback:</strong> ${r.responseMessage}</p>` : ''}
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem;">
            <p style="margin:0;"><small>Submitted: ${new Date(r.createdAt).toLocaleDateString()}</small></p>
            <button onclick="deleteChangeRequest('${r._id}')" style="background:none; border:none; color: #e53e3e; cursor:pointer;" title="Delete Request">
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
        </div>
      `;
    });
  } catch (err) {
    console.error("Load change requests error:", err);
  }
}
loadMyChangeRequests();

window.deleteChangeRequest = async (requestId) => {
  if (!confirm("Are you sure? This will move the request to history.")) return;
  try {
    const res = await fetch(`${apiBase}/change-requests/${requestId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      if (window.showToast) showToast("Request moved to history", "success");
      loadMyChangeRequests();
    }
  } catch (err) { console.error(err); }
};

// ------------------
// History Functions
// ------------------
async function loadHistory() {
  try {
    const res = await fetch(`${apiBase}/reports/history`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const { projects, reports, changeRequests } = await res.json();

    const projList = document.getElementById("history-projects-list");
    const repList = document.getElementById("history-reports-list");
    const reqList = document.getElementById("history-requests-list");

    projList.innerHTML = "";
    repList.innerHTML = "";
    reqList.innerHTML = "";

    if (!projects || projects.length === 0) projList.innerHTML = "<p>No deleted project history.</p>";
    projects.forEach(p => {
      projList.innerHTML += `
        <div class="project-card" style="opacity: 0.7;">
          <h3>${p.name}</h3>
          <p>${p.description}</p>
        </div>
      `;
    });

    if (!reports || reports.length === 0) repList.innerHTML = "<p>No deleted report history.</p>";
    reports.forEach(r => {
      repList.innerHTML += `
        <div class="project-card" style="opacity: 0.7;">
          <h3>${r.title}</h3>
          <p>${r.project?.name || 'N/A'}</p>
        </div>
      `;
    });

    if (!changeRequests || changeRequests.length === 0) reqList.innerHTML = "<p>No deleted request history.</p>";
    changeRequests.forEach(req => {
      reqList.innerHTML += `
             <div class="project-card" style="opacity: 0.7;">
                <h3>${req.project?.name || "Deleted Project"}</h3>
                <p><strong>Request:</strong> ${req.description}</p>
                <p><strong>Status:</strong> ${req.status.toUpperCase()}</p>
            </div>
        `;
    });
  } catch (err) { console.error(err); }
}

const clearHistoryBtn = document.getElementById("clearClientHistoryBtn");
if (clearHistoryBtn) {
  clearHistoryBtn.onclick = async () => {
    if (!confirm("Permanently clear your history?")) return;
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

// Add to nav listener
document.querySelectorAll(".nav-item").forEach((item) => {
  item.addEventListener("click", () => {
    const targetId = item.getAttribute("data-target");
    if (targetId === "history-section") loadHistory();
  });
});
