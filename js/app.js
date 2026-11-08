import { $, $$ } from "./utils.js";
import { loadChats, saveChats } from "./storage.js";
import { initSidebar } from "./sidebar.js";
import { initChat } from "./chat.js";
export function initApp() {
  let chats = loadChats(), activeId = chats[0]?.id || null;
  const getChats = () => chats, setChats = value => { chats = value; saveChats(chats); }, getActiveId = () => activeId, setActiveId = value => { activeId = value; };
  let chat;
  const sidebar = initSidebar({ getChats, getActiveId, openChat: id => chat.openChat(id), onDelete: id => chat.deleteChat(id), onNewChat: () => { chat.createChat(); sidebar.close(); } });
  chat = initChat({ getChats, setChats, getActiveId, setActiveId, renderHistory: sidebar.renderHistory });
  $("#settingsBtn").addEventListener("click", () => $("#settingsModal").showModal());
  $("#aboutBtn").addEventListener("click", () => $("#aboutModal").showModal());
  $("#aboutTopBtn").addEventListener("click", () => $("#aboutModal").showModal());
  $$("[data-close]").forEach(button => button.addEventListener("click", () => $("#" + button.dataset.close).close()));
  $("#clearAllBtn").addEventListener("click", () => {
    if (!confirm("Delete all saved conversations from this browser?")) return;
    setChats([]); setActiveId(null); chat.renderMessages(); sidebar.renderHistory(); $("#settingsModal").close();
  });
  document.addEventListener("keydown", event => {
    if (event.key === "/" && !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) { event.preventDefault(); $("#searchChats").focus(); }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); $("#searchChats").focus(); }
  });
  sidebar.renderHistory();
  if (activeId) chat.openChat(activeId); else chat.renderMessages();
}