import { $, $$, escapeHTML } from "./utils.js";
export function initSidebar({getChats,getActiveId,openChat,onDelete,onNewChat}) {
  const history = $("#chatHistory");
  function renderHistory() {
    const query = $("#searchChats").value.trim().toLowerCase();
    const chats = getChats().filter(chat => chat.title.toLowerCase().includes(query)).sort((a,b) => b.updatedAt-a.updatedAt);
    if (!chats.length) { history.innerHTML = `<div class="empty-history">${query ? "No matching conversations." : "Your conversations will appear here."}</div>`; return; }
    history.innerHTML = chats.map(chat => `<div class="history-item ${chat.id===getActiveId()?"active":""}" data-id="${chat.id}" role="button" tabindex="0"><i class="bx bx-message-rounded"></i><span>${escapeHTML(chat.title)}</span><button class="history-delete" data-delete="${chat.id}" aria-label="Delete conversation"><i class="bx bx-trash"></i></button></div>`).join("");
  }
  history.addEventListener("click", event => {
    const del = event.target.closest("[data-delete]");
    if (del) { event.stopPropagation(); onDelete(del.dataset.delete); return; }
    const item = event.target.closest("[data-id]"); if (item) openChat(item.dataset.id);
  });
  history.addEventListener("keydown", event => { if ((event.key==="Enter"||event.key===" ") && event.target.matches("[data-id]")) openChat(event.target.dataset.id); });
  $("#searchChats").addEventListener("input", renderHistory);
  $("#clearSearch").addEventListener("click", () => { $("#searchChats").value=""; renderHistory(); });
  $("#newChatBtn").addEventListener("click", onNewChat);
  const sidebar = $("#sidebar"), backdrop = $("#sidebarBackdrop");
  const close = () => { sidebar.classList.remove("open"); backdrop.classList.remove("show"); };
  $("#openSidebar").addEventListener("click", () => { sidebar.classList.add("open"); backdrop.classList.add("show"); });
  $("#closeSidebar").addEventListener("click", close);
  backdrop.addEventListener("click", close);
  return {renderHistory,close};
}