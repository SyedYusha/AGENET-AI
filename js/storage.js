const CHAT_KEY = "agenet-ai-conversations-v1";
const THEME_KEY = "agenet-ai-theme";
export const loadChats = () => { try { return JSON.parse(localStorage.getItem(CHAT_KEY)) || []; } catch { return []; } };
export const saveChats = chats => localStorage.setItem(CHAT_KEY, JSON.stringify(chats));
export const loadTheme = () => localStorage.getItem(THEME_KEY) || "dark";
export const saveTheme = theme => localStorage.setItem(THEME_KEY, theme);