import { $, makeId, formatTime, escapeHTML } from "./utils.js";
import { generateResponse } from "./responses.js";
export function initChat({ getChats, setChats, getActiveId, setActiveId, renderHistory }) {
  const welcome = $("#welcomeScreen"), list = $("#messagesList"), input = $("#messageInput"), form = $("#chatForm"), send = $("#sendBtn"), title = $("#topbarTitle");
  let typing = false;
  function activeChat() { return getChats().find(chat => chat.id === getActiveId()); }
  function setWelcome(show) { welcome.hidden = !show; list.hidden = show; }
  function renderMessages() {
    const chat = activeChat();
    list.innerHTML = "";
    if (!chat || !chat.messages.length) { setWelcome(true); title.textContent = "AGENET Assistant"; return; }
    setWelcome(false); title.textContent = chat.title;
    chat.messages.forEach(message => appendMessage(message, false));
    $("#chatViewport").scrollTop = $("#chatViewport").scrollHeight;
  }
  function appendMessage(message, animate = true) {
    const node = document.createElement("article");
    node.className = `message ${message.role}`;
    if (!animate) node.style.animation = "none";
    const avatar = message.role === "assistant" ? '<i class="bx bx-sparkles"></i>' : "G";
    node.innerHTML = `<div class="message-avatar">${avatar}</div><div class="message-body"><div class="message-content">${escapeHTML(message.content)}</div><div class="message-meta"><span>${formatTime(new Date(message.createdAt))}</span>${message.role === "assistant" ? `<span class="message-actions"><button data-copy aria-label="Copy response"><i class="bx bx-copy"></i></button></span>` : ""}</div></div>`;
    node.querySelector("[data-copy]")?.addEventListener("click", () => navigator.clipboard?.writeText(message.content));
    list.append(node);
    $("#chatViewport").scrollTop = $("#chatViewport").scrollHeight;
  }
  function update(chats) { setChats(chats); renderHistory(); }
  function createChat() {
    const chat = { id: makeId(), title: "New conversation", messages: [], createdAt: Date.now(), updatedAt: Date.now() };
    const chats = [chat, ...getChats()]; update(chats); setActiveId(chat.id); renderMessages(); input.focus();
  }
  function openChat(id) { setActiveId(id); renderMessages(); renderHistory(); input.focus(); }
  function deleteChat(id) {
    const chats = getChats().filter(chat => chat.id !== id); update(chats);
    if (getActiveId() === id) { setActiveId(chats[0]?.id || null); renderMessages(); }
  }
  function sendMessage(text) {
    text = text.trim(); if (!text || typing) return;
    let chats = getChats(), chat = activeChat();
    if (!chat) { chat = { id: makeId(), title: text.slice(0, 34) + (text.length > 34 ? "…" : ""), messages: [], createdAt: Date.now(), updatedAt: Date.now() }; setActiveId(chat.id); chats = [chat, ...chats]; }
    if (!chat.messages.length) chat.title = text.slice(0, 34) + (text.length > 34 ? "…" : "");
    const userMessage = { id: makeId(), role: "user", content: text, createdAt: Date.now() };
    chat.messages.push(userMessage); chat.updatedAt = Date.now(); update(chats); renderMessages();
    const targetChatId = chat.id;
    input.value = ""; input.style.height = "auto"; send.disabled = true; typing = true;
    const typingNode = document.createElement("article"); typingNode.className = "message"; typingNode.id = "typingIndicator"; typingNode.innerHTML = '<div class="message-avatar"><i class="bx bx-sparkles"></i></div><div class="message-body"><div class="message-content"><div class="typing-dots"><span></span><span></span><span></span></div></div></div>'; list.append(typingNode);
    $("#chatViewport").scrollTop = $("#chatViewport").scrollHeight;
    window.setTimeout(() => {
      if (getActiveId() === targetChatId) $("#typingIndicator")?.remove();
      typing = false;
      const current = getChats().find(item => item.id === targetChatId);
      if (!current) return;
      const answer = { id: makeId(), role: "assistant", content: generateResponse(text), createdAt: Date.now() };
      current.messages.push(answer); current.updatedAt = Date.now(); update(getChats());
      if (getActiveId() === targetChatId) appendMessage(answer);
    }, 850 + Math.min(text.length * 8, 900));
  }
  form.addEventListener("submit", event => { event.preventDefault(); sendMessage(input.value); });
  input.addEventListener("input", () => { input.style.height = "auto"; input.style.height = Math.min(input.scrollHeight, 150) + "px"; send.disabled = !input.value.trim(); });
  input.addEventListener("keydown", event => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); form.requestSubmit(); } });
  document.querySelectorAll("[data-prompt]").forEach(button => button.addEventListener("click", () => sendMessage(button.dataset.prompt)));
  return { createChat, openChat, deleteChat, renderMessages };
}