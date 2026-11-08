import { generateResponse } from "./responses.js";

const AI_SETTINGS_KEY = "agenet-ai-settings-v1";

export function getAISettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(AI_SETTINGS_KEY));
    return {
      provider: saved?.provider || "free", // "free" | "gemini"
      geminiKey: saved?.geminiKey || "",
      model: saved?.model || "gemini-2.5-flash"
    };
  } catch {
    return { provider: "free", geminiKey: "", model: "gemini-2.5-flash" };
  }
}

export function saveAISettings(settings) {
  const current = getAISettings();
  const updated = { ...current, ...settings };
  localStorage.setItem(AI_SETTINGS_KEY, JSON.stringify(updated));
  return updated;
}

export function formatMarkdown(text = "") {
  if (!text) return "";

  // 1. Preserve code blocks
  const codeBlocks = [];
  let html = text.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (match, lang, code) => {
    const id = `__CODE_BLOCK_${codeBlocks.length}__`;
    codeBlocks.push({ lang: lang || "code", code });
    return id;
  });

  // 2. Escape HTML
  html = html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // 3. Inline code
  html = html.replace(/`([^`\n]+)`/g, "<code>$1</code>");

  // 4. Bold
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

  // 5. Italic
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");

  // 6. Links
  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  // 7. Unordered list items
  html = html.replace(/^\s*[-*]\s+(.+)$/gm, "<li>$1</li>");
  html = html.replace(/(<li>.*<\/li>(\n|$))+/g, "<ul>$&</ul>");

  // 8. Ordered list items
  html = html.replace(/^\s*\d+\.\s+(.+)$/gm, "<li>$1</li>");

  // 9. Restore code blocks safely
  codeBlocks.forEach((item, index) => {
    const escapedCode = item.code
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    const rawAttr = encodeURIComponent(item.code);
    const replacement = `
      <div class="code-block">
        <div class="code-header">
          <span>${item.lang}</span>
          <button type="button" class="copy-code-btn" data-code="${rawAttr}" aria-label="Copy code">
            <i class="bx bx-copy"></i><span>Copy</span>
          </button>
        </div>
        <pre><code>${escapedCode}</code></pre>
      </div>
    `;
    html = html.replace(`__CODE_BLOCK_${index}__`, replacement);
  });

  return html;
}

export async function streamAIResponse({ messages, onChunk, onDone, onError, signal }) {
  const settings = getAISettings();
  const systemPrompt = "You are AGENET AI, a fast, intelligent, helpful, and friendly conversation companion. Format your answers clearly with markdown where helpful.";

  try {
    if (settings.provider === "gemini" && settings.geminiKey.trim()) {
      await streamGeminiResponse({
        messages,
        apiKey: settings.geminiKey.trim(),
        model: settings.model || "gemini-2.5-flash",
        systemPrompt,
        onChunk,
        onDone,
        onError,
        signal
      });
    } else {
      await streamFreeAIResponse({
        messages,
        systemPrompt,
        onChunk,
        onDone,
        onError,
        signal
      });
    }
  } catch (err) {
    if (err.name === "AbortError") {
      // User cancelled streaming
      return;
    }
    console.warn("Real-time AI stream encountered an issue, falling back to local engine:", err);

    // Fallback to local knowledge response if network fails
    const lastUserMsg = messages.filter(m => m.role === "user").pop()?.content || "";
    const fallbackAnswer = generateResponse(lastUserMsg);

    // Stream fallback smoothly with a typewriter effect
    let streamed = "";
    const words = fallbackAnswer.split(" ");
    for (let i = 0; i < words.length; i++) {
      if (signal?.aborted) return;
      streamed += (i === 0 ? "" : " ") + words[i];
      if (onChunk) onChunk(words[i] + " ", streamed);
      await new Promise(r => setTimeout(r, 20));
    }
    if (onDone) onDone(streamed);
  }
}

async function streamFreeAIResponse({ messages, systemPrompt, onChunk, onDone, onError, signal }) {
  const formattedMessages = [
    { role: "system", content: systemPrompt },
    ...messages.slice(-8).map(m => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content
    }))
  ];

  const response = await fetch("https://text.pollinations.ai/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: formattedMessages,
      model: "openai",
      stream: true
    }),
    signal
  });

  if (!response.ok) {
    throw new Error(`Free AI service responded with status ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop(); // keep remainder

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed === "data: [DONE]") continue;

      if (trimmed.startsWith("data: ")) {
        try {
          const json = JSON.parse(trimmed.slice(6));
          const delta = json.choices?.[0]?.delta?.content;
          if (delta) {
            fullText += delta;
            if (onChunk) onChunk(delta, fullText);
          }
        } catch {
          // ignore unparseable chunk
        }
      }
    }
  }

  // Handle any remaining text
  if (buffer.startsWith("data: ") && buffer.trim() !== "data: [DONE]") {
    try {
      const json = JSON.parse(buffer.slice(6));
      const delta = json.choices?.[0]?.delta?.content;
      if (delta) {
        fullText += delta;
        if (onChunk) onChunk(delta, fullText);
      }
    } catch {}
  }

  if (onDone) onDone(fullText);
}

async function streamGeminiResponse({ messages, apiKey, model, systemPrompt, onChunk, onDone, onError, signal }) {
  const contents = messages.slice(-8).map(m => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }]
  }));

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse&key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: systemPrompt }]
      },
      contents
    }),
    signal
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errText}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop();

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (trimmed.startsWith("data: ")) {
        try {
          const json = JSON.parse(trimmed.slice(6));
          const parts = json.candidates?.[0]?.content?.parts;
          if (parts && parts.length > 0) {
            for (const part of parts) {
              if (part.text) {
                fullText += part.text;
                if (onChunk) onChunk(part.text, fullText);
              }
            }
          }
        } catch {}
      }
    }
  }

  if (onDone) onDone(fullText);
}
