import { $, $$ } from "./utils.js";
import { loadChats, saveChats } from "./storage.js";
import { initSidebar } from "./sidebar.js";
import { initChat } from "./chat.js";
import { initAuth, showToast } from "./auth.js";
import { getAISettings, saveAISettings } from "./ai-service.js";

export function initApp() {
  let auth;
  let currentUser = null;

  const getUserId = () => currentUser?.id || null;
  const getCurrentUser = () => currentUser;

  let chats = [];
  let activeId = null;

  const getChats = () => chats;
  const setChats = value => {
    chats = value;
    saveChats(chats, getUserId());
  };
  const getActiveId = () => activeId;
  const setActiveId = value => {
    activeId = value;
  };

  let chat;
  const sidebar = initSidebar({
    getChats,
    getActiveId,
    openChat: id => chat.openChat(id),
    onDelete: id => chat.deleteChat(id),
    onNewChat: () => {
      chat.createChat();
      sidebar.close();
    }
  });

  chat = initChat({
    getChats,
    setChats,
    getActiveId,
    setActiveId,
    renderHistory: sidebar.renderHistory,
    getCurrentUser
  });

  function updateSettingsAccountStatus() {
    const accountSub = $("#settingsAccountSub");
    const accountBtn = $("#settingsAuthBtn");
    if (!accountSub || !accountBtn) return;
    if (currentUser) {
      accountSub.textContent = `Signed in as ${currentUser.name} (${currentUser.email})`;
      accountBtn.innerHTML = '<i class="bx bx-log-out"></i> Sign Out';
    } else {
      accountSub.textContent = "Not signed in (Guest mode)";
      accountBtn.innerHTML = '<i class="bx bx-log-in"></i> Sign In';
    }
  }

  function updateSettingsAIStatus() {
    const aiSub = $("#settingsAISub");
    if (!aiSub) return;
    const settings = getAISettings();
    if (settings.provider === "gemini" && settings.geminiKey.trim()) {
      aiSub.textContent = "Google Gemini 2.5 Flash (Active)";
    } else {
      aiSub.textContent = "AGENET Real-Time Cloud AI (Free · Active)";
    }
  }

  // Initialize Authentication & User state
  auth = initAuth({
    onUserChange: user => {
      currentUser = user;
      chats = loadChats(getUserId());
      activeId = chats[0]?.id || null;
      sidebar.renderHistory();
      updateSettingsAccountStatus();
      if (activeId) {
        chat.openChat(activeId);
      } else {
        chat.renderMessages();
      }
    }
  });

  // Set initial current user from storage
  currentUser = auth.getCurrentUser();
  chats = loadChats(getUserId());
  activeId = chats[0]?.id || null;

  // Settings & About Modals
  $("#settingsBtn")?.addEventListener("click", () => {
    updateSettingsAccountStatus();
    updateSettingsAIStatus();
    $("#settingsModal")?.showModal();
  });
  $("#aboutBtn")?.addEventListener("click", () => $("#aboutModal")?.showModal());
  $("#aboutTopBtn")?.addEventListener("click", () => $("#aboutModal")?.showModal());

  // Settings Account Button
  $("#settingsAuthBtn")?.addEventListener("click", () => {
    $("#settingsModal")?.close();
    if (currentUser) {
      auth.logout();
    } else {
      auth.openAuthModal("login");
    }
  });

  // AI Configuration Setup
  const aiProviderSelect = $("#aiProviderSelect");
  const geminiKeyGroup = $("#geminiKeyGroup");
  const geminiApiKeyInput = $("#geminiApiKeyInput");
  const aiConfigForm = $("#aiConfigForm");

  $("#configureAIBtn")?.addEventListener("click", () => {
    const settings = getAISettings();
    if (aiProviderSelect) aiProviderSelect.value = settings.provider;
    if (geminiApiKeyInput) geminiApiKeyInput.value = settings.geminiKey;
    if (geminiKeyGroup) geminiKeyGroup.hidden = settings.provider !== "gemini";
    $("#settingsModal")?.close();
    $("#aiConfigModal")?.showModal();
  });

  aiProviderSelect?.addEventListener("change", () => {
    if (geminiKeyGroup) {
      geminiKeyGroup.hidden = aiProviderSelect.value !== "gemini";
      if (!geminiKeyGroup.hidden) {
        geminiApiKeyInput?.focus();
      }
    }
  });

  aiConfigForm?.addEventListener("submit", e => {
    e.preventDefault();
    const provider = aiProviderSelect?.value || "free";
    const geminiKey = geminiApiKeyInput?.value.trim() || "";
    saveAISettings({ provider, geminiKey });
    $("#aiConfigModal")?.close();
    updateSettingsAIStatus();
    showToast("AI Engine settings updated successfully!", "success");
  });

  // Close buttons with [data-close]
  $$("[data-close]").forEach(button => {
    button.addEventListener("click", () => {
      const targetId = button.dataset.close;
      const modal = $("#" + targetId);
      if (modal && typeof modal.close === "function") {
        modal.close();
      }
    });
  });

  // Clear Chats Button in Settings
  $("#clearAllBtn")?.addEventListener("click", () => {
    const userLabel = currentUser ? `for ${currentUser.name}` : "for this browser";
    if (!confirm(`Delete all saved conversations ${userLabel}?`)) return;
    setChats([]);
    setActiveId(null);
    chat.renderMessages();
    sidebar.renderHistory();
    $("#settingsModal")?.close();
  });

  // Keyboard navigation shortcuts
  document.addEventListener("keydown", event => {
    if (event.key === "/" && !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) {
      event.preventDefault();
      $("#searchChats")?.focus();
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      $("#searchChats")?.focus();
    }
  });

  updateSettingsAccountStatus();
  updateSettingsAIStatus();
  sidebar.renderHistory();

  if (activeId) {
    chat.openChat(activeId);
  } else {
    chat.renderMessages();
  }
}
