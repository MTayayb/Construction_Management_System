// Use global apiBase from ui.js, but append /auth for this file
const authApiBase = `${apiBase}/auth`;

// Form elements
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const showLoginBtn = document.getElementById("show-login");
const showRegisterBtn = document.getElementById("show-register");

const loginMessage = document.getElementById("login-message");
const registerMessage = document.getElementById("register-message");

// ------------------
// Toggle forms
// ------------------
showLoginBtn.addEventListener("click", () => {
  loginForm.classList.remove("hidden");
  registerForm.classList.add("hidden");
  showLoginBtn.classList.add("active");
  showRegisterBtn.classList.remove("active");
});

showRegisterBtn.addEventListener("click", () => {
  loginForm.classList.add("hidden");
  registerForm.classList.remove("hidden");
  showLoginBtn.classList.remove("active");
  showRegisterBtn.classList.add("active");
});

// ------------------
// REGISTER
// ------------------
registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("register-name").value.trim();
  const email = document.getElementById("register-email").value.trim();
  const password = document.getElementById("register-password").value.trim();
  const role = document.getElementById("register-role").value;

  if (!name || !email || !password || !role) {
    if (window.showToast) showToast("All fields are required!", "error");
    return;
  }

  try {
    const res = await fetch(`${authApiBase}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
    });

    const data = await res.json();

    if (res.ok) {
      if (window.showToast) showToast("Registered successfully! You can now login.", "success");
      registerForm.reset();
      loginForm.classList.remove("hidden");
      registerForm.classList.add("hidden");
      showLoginBtn.classList.add("active");
      showRegisterBtn.classList.remove("active");
    } else {
      if (window.showToast) showToast(data.message || "Registration failed", "error");
    }
  } catch (err) {
    console.error(err);
    if (window.showToast) showToast("Server error", "error");
  }
});

// ------------------
// LOGIN
// ------------------
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value.trim();

  if (!email || !password) {
    if (window.showToast) showToast("Email and password required!", "error");
    return;
  }

  try {
    const res = await fetch(`${authApiBase}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (res.ok && data.token && data.user) {
      // Save JWT token and user info to localStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.user.role);
      localStorage.setItem("userId", data.user.id || data.user._id);

      if (window.showToast) showToast(`Login successful! Welcome back, ${data.user.name}`, "success");

      // Redirect based on role
      setTimeout(() => {
        switch (data.user.role) {
          case "client":
            window.location.href = "client/dashboard.html";
            break;
          case "admin":
            window.location.href = "admin/dashboard.html";
            break;
          case "engineer":
            window.location.href = "engineer/dashboard.html";
            break;
          case "worker":
            window.location.href = "worker/dashboard.html";
            break;
          default:
            if (window.showToast) showToast("Unknown role! Contact admin.", "error");
        }
      }, 1000);
    } else {
      if (window.showToast) showToast(data.message || "Login failed", "error");
    }
  } catch (err) {
    console.error(err);
    if (window.showToast) showToast("Server error during login", "error");
  }
});
// ------------------
// Password Visibility Toggle
// ------------------
document.querySelectorAll(".toggle-password").forEach(toggle => {
  toggle.addEventListener("click", () => {
    const targetId = toggle.getAttribute("data-target");
    const passwordInput = document.getElementById(targetId);

    if (passwordInput.type === "password") {
      passwordInput.type = "text";
      toggle.classList.remove("fa-eye");
      toggle.classList.add("fa-eye-slash");
    } else {
      passwordInput.type = "password";
      toggle.classList.remove("fa-eye-slash");
      toggle.classList.add("fa-eye");
    }
  });
});
