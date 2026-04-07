const tokenKey = "campusfest_admin_token";
const userKey = "campusfest_admin_user";

const loginCard = document.getElementById("loginCard");
const dashboardCard = document.getElementById("dashboardCard");
const statsCard = document.getElementById("statsCard");
const announcementCard = document.getElementById("announcementCard");
const tableCard = document.getElementById("tableCard");

const loginForm = document.getElementById("adminLoginForm");
const loginFeedback = document.getElementById("loginFeedback");
const adminMeta = document.getElementById("adminMeta");

const refreshBtn = document.getElementById("refreshBtn");
const exportBtn = document.getElementById("exportBtn");
const logoutBtn = document.getElementById("logoutBtn");
const filterBtn = document.getElementById("filterBtn");

const searchInput = document.getElementById("searchInput");
const trackFilter = document.getElementById("trackFilter");
const registrationBody = document.getElementById("registrationBody");
const statsGrid = document.getElementById("statsGrid");

const announcementForm = document.getElementById("announcementForm");
const announcementMessage = document.getElementById("announcementMessage");
const announcementType = document.getElementById("announcementType");
const announcementEnabled = document.getElementById("announcementEnabled");
const announcementFeedback = document.getElementById("announcementFeedback");

function getToken() {
  return localStorage.getItem(tokenKey) || "";
}

function getHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`
  };
}

function setAuthState(isLoggedIn) {
  loginCard.classList.toggle("hidden", isLoggedIn);
  dashboardCard.classList.toggle("hidden", !isLoggedIn);
  statsCard.classList.toggle("hidden", !isLoggedIn);
  announcementCard.classList.toggle("hidden", !isLoggedIn);
  tableCard.classList.toggle("hidden", !isLoggedIn);
}

function renderRegistrations(rows) {
  registrationBody.innerHTML = "";

  if (!rows.length) {
    registrationBody.innerHTML = '<tr><td colspan="6">No registrations found.</td></tr>';
    return;
  }

  for (const row of rows) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.name}</td>
      <td>${row.email}</td>
      <td>${row.college}</td>
      <td>${row.phone}</td>
      <td>${row.eventType}</td>
      <td>${new Date(row.createdAt).toLocaleString()}</td>
    `;
    registrationBody.appendChild(tr);
  }
}

function renderStats(stats) {
  const trackMap = {
    tech: 0,
    cultural: 0,
    career: 0,
    gaming: 0
  };

  for (const item of stats.tracks || []) {
    trackMap[item._id] = item.count;
  }

  statsGrid.innerHTML = `
    <div class="stat-box"><strong>${stats.total || 0}</strong><p>Total Registrations</p></div>
    <div class="stat-box"><strong>${trackMap.tech}</strong><p>Tech</p></div>
    <div class="stat-box"><strong>${trackMap.cultural}</strong><p>Cultural</p></div>
    <div class="stat-box"><strong>${trackMap.career + trackMap.gaming}</strong><p>Career + Gaming</p></div>
  `;
}

async function loadContentAnnouncement() {
  const response = await fetch("/api/content", { headers: getHeaders() });
  const payload = await response.json();

  if (!payload.success) {
    throw new Error(payload.message || "Failed to load content.");
  }

  const announcement = payload.data.announcement || {};
  announcementMessage.value = announcement.message || "";
  announcementType.value = announcement.type || "info";
  announcementEnabled.value = String(Boolean(announcement.enabled));
}

async function loadRegistrations() {
  const query = new URLSearchParams({
    search: searchInput.value.trim(),
    track: trackFilter.value
  });

  const response = await fetch(`/api/admin/registrations?${query.toString()}`, {
    headers: getHeaders()
  });

  const payload = await response.json();

  if (!payload.success) {
    throw new Error(payload.message || "Failed to load registrations.");
  }

  renderRegistrations(payload.data || []);
}

async function loadStats() {
  const response = await fetch("/api/admin/stats", { headers: getHeaders() });
  const payload = await response.json();

  if (!payload.success) {
    throw new Error(payload.message || "Failed to load stats.");
  }

  renderStats(payload.data || { total: 0, tracks: [] });
}

async function refreshDashboard() {
  await Promise.all([loadRegistrations(), loadStats(), loadContentAnnouncement()]);
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  loginFeedback.textContent = "";

  const email = document.getElementById("adminEmail").value.trim();
  const password = document.getElementById("adminPassword").value;

  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  const payload = await response.json();

  if (!payload.success) {
    loginFeedback.textContent = payload.message || "Login failed.";
    return;
  }

  localStorage.setItem(tokenKey, payload.data.token);
  localStorage.setItem(userKey, JSON.stringify(payload.data.user));
  loginFeedback.textContent = "Login successful.";

  initLoggedInView();
});

filterBtn.addEventListener("click", () => {
  loadRegistrations().catch((error) => {
    alert(error.message);
  });
});

refreshBtn.addEventListener("click", () => {
  refreshDashboard().catch((error) => {
    alert(error.message);
  });
});

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem(tokenKey);
  localStorage.removeItem(userKey);
  setAuthState(false);
});

exportBtn.addEventListener("click", async () => {
  const response = await fetch("/api/admin/registrations.csv", { headers: getHeaders() });

  if (!response.ok) {
    alert("Unable to export CSV.");
    return;
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "registrations.csv";
  anchor.click();
  URL.revokeObjectURL(url);
});

announcementForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  announcementFeedback.textContent = "";

  const payload = {
    enabled: announcementEnabled.value === "true",
    type: announcementType.value,
    message: announcementMessage.value.trim()
  };

  const response = await fetch("/api/content/announcement", {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(payload)
  });

  const body = await response.json();

  if (!body.success) {
    announcementFeedback.textContent = body.message || "Update failed.";
    return;
  }

  announcementFeedback.textContent = "Announcement updated successfully.";
});

function initLoggedInView() {
  const storedUser = JSON.parse(localStorage.getItem(userKey) || "null");
  if (!storedUser) {
    setAuthState(false);
    return;
  }

  adminMeta.textContent = `${storedUser.name} (${storedUser.role})`;
  setAuthState(true);

  refreshDashboard().catch((error) => {
    alert(error.message);
  });
}

if (getToken()) {
  initLoggedInView();
} else {
  setAuthState(false);
}
