import { $, makeId, formatTime, escapeHTML } from "./utils.js";
import { streamAIResponse, formatMarkdown } from "./ai-service.js";

export function initChat({ getChats, setChats, getActiveId, setActiveId, renderHistory, getCurrentUser }) {
  const welcome = $("#welcomeScreen"),
    list = $("#messagesList"),
    input = $("#messageInput"),
    form = $("#chatForm"),
    send = $("#sendBtn"),
    title = $("#topbarTitle");

  let typing = false;
  let activeAbortController = null;

  function activeChat() {
    return getChats().find(chat => chat.id === getActiveId());
  }

  function setWelcome(show) {
    welcome.hidden = !show;
    list.hidden = show;
  }

  function getUserAvatarInitial() {
    if (typeof getCurrentUser === "function") {
      const user = getCurrentUser();
      if (user) return user.initials || user.name?.[0] || "U";
    }
    return "G";
  }

  function renderMessages() {
    const chat = activeChat();
    list.innerHTML = "";
    if (!chat || !chat.messages.length) {
      setWelcome(true);
      title.textContent = "AGENET Assistant";
      return;
    }
    setWelcome(false);
    title.textContent = chat.title;
    chat.messages.forEach(message => appendMessage(message, false));
    $("#chatViewport").scrollTop = $("#chatViewport").scrollHeight;
  }

  function bindCodeBlockCopy(container) {
    container.querySelectorAll(".copy-code-btn").forEach(btn => {
      btn.onclick = () => {
        const raw = decodeURIComponent(btn.dataset.code || "");
        navigator.clipboard?.writeText(raw).then(() => {
          btn.innerHTML = '<i class="bx bx-check"></i><span>Copied!</span>';
          setTimeout(() => {
            btn.innerHTML = '<i class="bx bx-copy"></i><span>Copy</span>';
          }, 2000);
        });
      };
    });
  }

  function appendMessage(message, animate = true) {
    const node = document.createElement("article");
    node.className = `message ${message.role}`;
    if (!animate) node.style.animation = "none";

    const userInitial = getUserAvatarInitial();
    const avatar = message.role === "assistant" ? '<i class="bx bx-sparkles"></i>' : escapeHTML(userInitial);
    const formattedContent = message.role === "assistant" ? formatMarkdown(message.content) : escapeHTML(message.content);

    node.innerHTML = `
      <div class="message-avatar">${avatar}</div>
      <div class="message-body">
        <div class="message-content">${formattedContent}</div>
        <div class="message-meta">
          <span>${formatTime(new Date(message.createdAt))}</span>
          ${
            message.role === "assistant"
              ? `<span class="message-actions"><button data-copy aria-label="Copy response"><i class="bx bx-copy"></i></button></span>`
              : ""
          }
        </div>
      </div>
    `;

    node.querySelector("[data-copy]")?.addEventListener("click", () => {
      navigator.clipboard?.writeText(message.content);
      const copyIcon = node.querySelector("[data-copy] i");
      if (copyIcon) {
        copyIcon.className = "bx bx-check";
        setTimeout(() => { copyIcon.className = "bx bx-copy"; }, 1800);
      }
    });

    bindCodeBlockCopy(node);
    list.append(node);
    $("#chatViewport").scrollTop = $("#chatViewport").scrollHeight;
  }

  function update(chats) {
    setChats(chats);
    renderHistory();
  }

  function createChat() {
    if (typing) stopGeneration();
    const chat = { id: makeId(), title: "New conversation", messages: [], createdAt: Date.now(), updatedAt: Date.now() };
    const chats = [chat, ...getChats()];
    update(chats);
    setActiveId(chat.id);
    renderMessages();
    input.focus();
  }

  function openChat(id) {
    if (typing) stopGeneration();
    setActiveId(id);
    renderMessages();
    renderHistory();
    input.focus();
  }

  function deleteChat(id) {
    if (typing && getActiveId() === id) stopGeneration();
    const chats = getChats().filter(chat => chat.id !== id);
    update(chats);
    if (getActiveId() === id) {
      setActiveId(chats[0]?.id || null);
      renderMessages();
    }
  }

  function stopGeneration() {
    if (activeAbortController) {
      activeAbortController.abort();
      activeAbortController = null;
    }
    typing = false;
    resetSendButton();
  }

  function resetSendButton() {
    send.classList.remove("stop-mode");
    send.innerHTML = '<i class="bx bxs-send"></i>';
    send.title = "Send message";
    send.disabled = !input.value.trim();
  }

  function setStopButton() {
    send.classList.add("stop-mode");
    send.innerHTML = '<i class="bx bx-stop"></i>';
    send.title = "Stop generating";
    send.disabled = false;
  }

  async function sendMessage(text) {
    text = text.trim();
    if (!text) return;

    if (typing) {
      // If user clicks button while typing, treat as stop
      stopGeneration();
      return;
    }

    let chats = getChats(),
      chat = activeChat();
    if (!chat) {
      chat = {
        id: makeId(),
        title: text.slice(0, 34) + (text.length > 34 ? "…" : ""),
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      setActiveId(chat.id);
      chats = [chat, ...chats];
    }

    if (!chat.messages.length) {
      chat.title = text.slice(0, 34) + (text.length > 34 ? "…" : "");
    }

    // 1. Add user message
    const userMessage = { id: makeId(), role: "user", content: text, createdAt: Date.now() };
    chat.messages.push(userMessage);
    chat.updatedAt = Date.now();
    update(chats);
    renderMessages();

    const targetChatId = chat.id;
    input.value = "";
    input.style.height = "auto";
    typing = true;
    setStopButton();

    // 2. Prepare real-time assistant message placeholder
    const assistantMsgId = makeId();
    const assistantArticle = document.createElement("article");
    assistantArticle.className = "message assistant";
    assistantArticle.id = "activeStreamingMsg";
    assistantArticle.innerHTML = `
      <div class="message-avatar"><i class="bx bx-sparkles"></i></div>
      <div class="message-body">
        <div class="message-content" id="activeStreamingContent"><span class="typing-cursor"></span></div>
        <div class="message-meta"><span id="activeStreamingMeta">Thinking...</span></div>
      </div>
    `;

    list.append(assistantArticle);
    const viewport = $("#chatViewport");
    viewport.scrollTop = viewport.scrollHeight;

    // 3. Initiate Real-time Stream
    activeAbortController = new AbortController();
    let accumulatedText = "";

    await streamAIResponse({
      messages: chat.messages,
      signal: activeAbortController.signal,
      onChunk: (chunk, fullText) => {
        accumulatedText = fullText;
        if (getActiveId() === targetChatId) {
          const contentEl = $("#activeStreamingContent");
          const metaEl = $("#activeStreamingMeta");
          if (contentEl) {
            contentEl.innerHTML = formatMarkdown(fullText) + '<span class="typing-cursor"></span>';
            bindCodeBlockCopy(contentEl);
          }
          if (metaEl) {
            metaEl.textContent = "Responding in real time...";
          }
          viewport.scrollTop = viewport.scrollHeight;
        }
      },
      onDone: (finalText) => {
        accumulatedText = finalText || accumulatedText || "I'm here to help! Could you please tell me more?";
        finalizeResponse(targetChatId, assistantMsgId, accumulatedText);
      },
      onError: (err) => {
        console.error("Streaming error:", err);
        if (!accumulatedText) {
          accumulatedText = "I encountered an issue getting a response. Please check your network connection or try again.";
        }
        finalizeResponse(targetChatId, assistantMsgId, accumulatedText);
      }
    });
  }

  function finalizeResponse(targetChatId, msgId, text) {
    typing = false;
    activeAbortController = null;
    resetSendButton();

    $("#activeStreamingMsg")?.remove();

    const current = getChats().find(item => item.id === targetChatId);
    if (!current) return;

    const answer = {
      id: msgId,
      role: "assistant",
      content: text,
      createdAt: Date.now()
    };

    current.messages.push(answer);
    current.updatedAt = Date.now();
    update(getChats());

    if (getActiveId() === targetChatId) {
      appendMessage(answer);
    }
  }

  // Handle Form Submission
  form.addEventListener("submit", event => {
    event.preventDefault();
    if (typing) {
      stopGeneration();
    } else {
      sendMessage(input.value);
    }
  });

  // Handle Send/Stop button click
  send.addEventListener("click", event => {
    if (typing) {
      event.preventDefault();
      stopGeneration();
    }
  });

  input.addEventListener("input", () => {
    if (typing) return;
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 150) + "px";
    send.disabled = !input.value.trim();
  });

  input.addEventListener("keydown", event => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (typing) {
        stopGeneration();
      } else {
        form.requestSubmit();
      }
    }
  });

  document.querySelectorAll("[data-prompt]").forEach(button => {
    button.addEventListener("click", () => sendMessage(button.dataset.prompt));
  });

  return { createChat, openChat, deleteChat, renderMessages };
}
