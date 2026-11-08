import { $, $$ } from "./utils.js";
import { loadChats, saveChats } from "./storage.js";
import { initSidebar } from "./sidebar.js";
import { initChat } from "./chat.js";
import { initAuth } from "./auth.js";

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

  // Initialize Authentication & User state
  auth = initAuth({
    onUserChange: user => {
      currentUser = user;
      chats = loadChats(getUserId());
      activeId = chats[0]?.id || null;
      sidebar.renderHistory();
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
  $("#settingsBtn")?.addEventListener("click", () => $("#settingsModal")?.showModal());
  $("#aboutBtn")?.addEventListener("click", () => $("#aboutModal")?.showModal());
  $("#aboutTopBtn")?.addEventListener("click", () => $("#aboutModal")?.showModal());

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

  sidebar.renderHistory();
  if (activeId) {
    chat.openChat(activeId);
  } else {
    chat.renderMessages();
  }
}
