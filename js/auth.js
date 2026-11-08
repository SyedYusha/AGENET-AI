import { $, $$, makeId, getInitials, hashPassword, escapeHTML } from "./utils.js";
import {
  loadUsers,
  saveUser,
  findUserByEmail,
  loadCurrentUser,
  saveCurrentUser,
  clearCurrentUser
} from "./storage.js";

export function showToast(message, type = "info", duration = 3200) {
  let container = $("#toastContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "toastContainer";
    container.className = "toast-container";
    container.setAttribute("aria-live", "polite");
    document.body.appendChild(container);
  }

  const iconMap = {
    success: "bx-check-circle",
    error: "bx-error-circle",
    info: "bx-info-circle"
  };

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `<i class="bx ${iconMap[type] || "bx-info-circle"}"></i><span>${escapeHTML(message)}</span>`;
  container.appendChild(toast);

  const timeoutId = setTimeout(() => {
    toast.classList.add("fade-out");
    setTimeout(() => toast.remove(), 260);
  }, duration);

  toast.addEventListener("click", () => {
    clearTimeout(timeoutId);
    toast.classList.add("fade-out");
    setTimeout(() => toast.remove(), 260);
  });
}

export function initAuth({ onUserChange } = {}) {
  const authModal = $("#authModal");
  const tabLogin = $("#tabLogin");
  const tabRegister = $("#tabRegister");
  const loginForm = $("#loginForm");
  const registerForm = $("#registerForm");
  const authAlert = $("#authAlert");
  const authTitle = $("#authTitle");
  const authEyebrow = $("#authEyebrow");

  const userProfileBtn = $("#userProfileBtn");
  const profileMenu = $("#profileMenu");
  const menuAuthBtn = $("#menuAuthBtn");
  const menuLogoutBtn = $("#menuLogoutBtn");
  const topAuthBtn = $("#topAuthBtn");

  // Alert Helpers
  function setAlert(message, type = "error") {
    if (!authAlert) return;
    const icon = type === "error" ? "bx-error-circle" : "bx-check-circle";
    authAlert.className = `auth-alert ${type}`;
    authAlert.innerHTML = `<i class="bx ${icon}"></i><span>${escapeHTML(message)}</span>`;
    authAlert.hidden = false;
  }

  function clearAlert() {
    if (!authAlert) return;
    authAlert.hidden = true;
    authAlert.innerHTML = "";
  }

  // Switch between Login and Registration tabs
  function switchTab(tab = "login") {
    clearAlert();
    if (tab === "login") {
      tabLogin?.classList.add("active");
      tabLogin?.setAttribute("aria-selected", "true");
      tabRegister?.classList.remove("active");
      tabRegister?.setAttribute("aria-selected", "false");
      if (loginForm) loginForm.hidden = false;
      if (registerForm) registerForm.hidden = true;
      if (authTitle) authTitle.textContent = "Sign In";
      if (authEyebrow) authEyebrow.textContent = "WELCOME BACK TO AGENET AI";
      $("#loginEmail")?.focus();
    } else {
      tabRegister?.classList.add("active");
      tabRegister?.setAttribute("aria-selected", "true");
      tabLogin?.classList.remove("active");
      tabLogin?.setAttribute("aria-selected", "false");
      if (registerForm) registerForm.hidden = false;
      if (loginForm) loginForm.hidden = true;
      if (authTitle) authTitle.textContent = "Create Account";
      if (authEyebrow) authEyebrow.textContent = "GET STARTED WITH AGENET AI";
      $("#regName")?.focus();
    }
  }

  function openAuthModal(tab = "login") {
    switchTab(tab);
    closeProfileMenu();
    authModal?.showModal();
  }

  function closeAuthModal() {
    authModal?.close();
    clearAlert();
  }

  // Profile Menu Dropdown Helpers
  function toggleProfileMenu() {
    if (!profileMenu) return;
    const isHidden = profileMenu.hidden;
    profileMenu.hidden = !isHidden;
  }

  function closeProfileMenu() {
    if (profileMenu) profileMenu.hidden = true;
  }

  // UI state updates based on currentUser
  function updateUI() {
    const user = loadCurrentUser();
    const initials = user ? (user.initials || getInitials(user.name)) : "G";
    const displayName = user ? user.name : "Guest User";
    const subText = user ? user.email : "Personal workspace";

    // Sidebar Profile
    const sidebarAvatar = $("#sidebarAvatar");
    if (sidebarAvatar) sidebarAvatar.textContent = initials;
    const sidebarUserName = $("#sidebarUserName");
    if (sidebarUserName) sidebarUserName.textContent = displayName;
    const sidebarUserSub = $("#sidebarUserSub");
    if (sidebarUserSub) sidebarUserSub.textContent = subText;

    const sidebarStatus = $("#sidebarUserStatus");
    if (sidebarStatus) {
      sidebarStatus.className = `profile-auth-status ${user ? "active" : "guest"}`;
      sidebarStatus.title = user ? "Active Account" : "Guest Mode";
    }

    // Topbar Auth Trigger
    if (topAuthBtn) {
      if (user) {
        topAuthBtn.innerHTML = `<span class="avatar-tiny">${escapeHTML(initials)}</span><span>${escapeHTML(user.name.split(" ")[0])}</span>`;
        topAuthBtn.title = `Signed in as ${user.name}`;
      } else {
        topAuthBtn.innerHTML = `<i class="bx bx-user"></i><span>Sign In</span>`;
        topAuthBtn.title = "Sign In or Register";
      }
    }

    // Profile Popover
    const menuAvatar = $("#menuAvatar");
    if (menuAvatar) menuAvatar.textContent = initials;
    const menuUserName = $("#menuUserName");
    if (menuUserName) menuUserName.textContent = displayName;
    const menuUserEmail = $("#menuUserEmail");
    if (menuUserEmail) menuUserEmail.textContent = user ? user.email : "Guest Mode · No account";

    if (menuAuthBtn) menuAuthBtn.hidden = !!user;
    if (menuLogoutBtn) menuLogoutBtn.hidden = !user;
  }

  // Handle Login submission
  async function handleLogin(e) {
    e.preventDefault();
    clearAlert();

    const email = $("#loginEmail")?.value.trim();
    const password = $("#loginPassword")?.value || "";

    if (!email || !password) {
      setAlert("Please fill in both email and password.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setAlert("Please enter a valid email address.");
      return;
    }

    const user = findUserByEmail(email);
    if (!user) {
      setAlert("No account found with this email. Would you like to create an account?");
      return;
    }

    const passwordHash = await hashPassword(password);
    if (user.passwordHash !== passwordHash && user.password !== password) {
      setAlert("Incorrect password. Please try again.");
      return;
    }

    // Successful login
    saveCurrentUser(user);
    closeAuthModal();
    loginForm?.reset();
    updateUI();

    showToast(`Welcome back, ${user.name}!`, "success");
    if (typeof onUserChange === "function") {
      onUserChange(user);
    }
  }

  // Handle Register submission
  async function handleRegister(e) {
    e.preventDefault();
    clearAlert();

    const name = $("#regName")?.value.trim();
    const email = $("#regEmail")?.value.trim();
    const password = $("#regPassword")?.value || "";
    const confirmPassword = $("#regConfirmPassword")?.value || "";

    if (!name || name.length < 2) {
      setAlert("Please enter your name (at least 2 characters).");
      $("#regName")?.focus();
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setAlert("Please enter a valid email address.");
      $("#regEmail")?.focus();
      return;
    }

    if (password.length < 6) {
      setAlert("Password must be at least 6 characters long.");
      $("#regPassword")?.focus();
      return;
    }

    if (password !== confirmPassword) {
      setAlert("Passwords do not match. Please re-enter.");
      $("#regConfirmPassword")?.focus();
      return;
    }

    const existingUser = findUserByEmail(email);
    if (existingUser) {
      setAlert("An account with this email already exists. Please sign in instead.");
      return;
    }

    // Create user
    const passwordHash = await hashPassword(password);
    const newUser = {
      id: makeId(),
      name,
      email: email.toLowerCase(),
      passwordHash,
      initials: getInitials(name),
      createdAt: Date.now()
    };

    saveUser(newUser);
    saveCurrentUser(newUser);

    closeAuthModal();
    registerForm?.reset();
    updateUI();

    showToast(`Welcome, ${newUser.name}! Your account has been created.`, "success");
    if (typeof onUserChange === "function") {
      onUserChange(newUser);
    }
  }

  // Handle Logout
  function handleLogout() {
    clearCurrentUser();
    closeProfileMenu();
    updateUI();
    showToast("You have been signed out.", "info");
    if (typeof onUserChange === "function") {
      onUserChange(null);
    }
  }

  // Quick Demo User Filler
  async function fillDemoUser() {
    const demoEmail = "demo@agenet.ai";
    const demoPass = "password123";
    const demoName = "Demo User";

    let demoUser = findUserByEmail(demoEmail);
    if (!demoUser) {
      const passwordHash = await hashPassword(demoPass);
      demoUser = {
        id: makeId(),
        name: demoName,
        email: demoEmail,
        passwordHash,
        initials: "DU",
        createdAt: Date.now()
      };
      saveUser(demoUser);
    }

    const emailInput = $("#loginEmail");
    const passInput = $("#loginPassword");
    if (emailInput && passInput) {
      emailInput.value = demoEmail;
      passInput.value = demoPass;
      showToast("Demo credentials filled! Click 'Sign In' to continue.", "info");
    }
  }

  // Password Visibility Toggles
  $$(".pw-toggle").forEach(btn => {
    btn.addEventListener("click", () => {
      const input = btn.closest(".input-wrap")?.querySelector("input");
      const icon = btn.querySelector("i");
      if (!input || !icon) return;
      if (input.type === "password") {
        input.type = "text";
        icon.className = "bx bx-show";
        btn.setAttribute("aria-label", "Hide password");
      } else {
        input.type = "password";
        icon.className = "bx bx-hide";
        btn.setAttribute("aria-label", "Show password");
      }
    });
  });

  // Event Listeners for Forms & Tabs
  tabLogin?.addEventListener("click", () => switchTab("login"));
  tabRegister?.addEventListener("click", () => switchTab("register"));
  $("#switchToRegister")?.addEventListener("click", () => switchTab("register"));
  $("#switchToLogin")?.addEventListener("click", () => switchTab("login"));
  $("#quickDemoBtn")?.addEventListener("click", fillDemoUser);

  loginForm?.addEventListener("submit", handleLogin);
  registerForm?.addEventListener("submit", handleRegister);

  // Profile Button & Popover Listeners
  userProfileBtn?.addEventListener("click", e => {
    e.stopPropagation();
    toggleProfileMenu();
  });

  topAuthBtn?.addEventListener("click", e => {
    e.stopPropagation();
    const user = loadCurrentUser();
    if (user) {
      toggleProfileMenu();
    } else {
      openAuthModal("login");
    }
  });

  menuAuthBtn?.addEventListener("click", () => openAuthModal("login"));
  menuLogoutBtn?.addEventListener("click", handleLogout);
  $("#menuSettingsBtn")?.addEventListener("click", () => {
    closeProfileMenu();
    $("#settingsModal")?.showModal();
  });

  // Close profile menu when clicking outside
  document.addEventListener("click", e => {
    if (profileMenu && !profileMenu.contains(e.target) && !userProfileBtn?.contains(e.target) && !topAuthBtn?.contains(e.target)) {
      closeProfileMenu();
    }
  });

  // Initial UI Render
  updateUI();

  return {
    getCurrentUser: loadCurrentUser,
    openAuthModal,
    logout: handleLogout,
    updateUI,
    showToast
  };
}
