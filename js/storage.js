const CHAT_KEY = "agenet-ai-conversations-v1";
const THEME_KEY = "agenet-ai-theme";
const USERS_KEY = "agenet-ai-users-v1";
const CURRENT_USER_KEY = "agenet-ai-current-user-v1";

const getChatKey = (userId) => (userId ? `${CHAT_KEY}-${userId}` : CHAT_KEY);

export const loadChats = (userId = null) => {
  try {
    const key = getChatKey(userId);
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
};

export const saveChats = (chats, userId = null) => {
  const key = getChatKey(userId);
  localStorage.setItem(key, JSON.stringify(chats));
};

export const loadTheme = () => localStorage.getItem(THEME_KEY) || "dark";
export const saveTheme = theme => localStorage.setItem(THEME_KEY, theme);

// Users Storage
export const loadUsers = () => {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
  } catch {
    return [];
  }
};

export const saveUsers = users => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const findUserByEmail = email => {
  if (!email) return null;
  const users = loadUsers();
  return users.find(u => u.email.toLowerCase() === email.trim().toLowerCase()) || null;
};

export const saveUser = user => {
  const users = loadUsers();
  const index = users.findIndex(u => u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase());
  if (index >= 0) {
    users[index] = { ...users[index], ...user };
  } else {
    users.push(user);
  }
  saveUsers(users);
  return user;
};

// Current Session Storage
export const loadCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem(CURRENT_USER_KEY)) || null;
  } catch {
    return null;
  }
};

export const saveCurrentUser = user => {
  if (!user) {
    clearCurrentUser();
    return;
  }
  // Store session safe data (exclude sensitive hashes from active session token)
  const sessionUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    initials: user.initials,
    loggedInAt: Date.now()
  };
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(sessionUser));
};

export const clearCurrentUser = () => {
  localStorage.removeItem(CURRENT_USER_KEY);
};
