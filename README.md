# AGENET AI

**Your intelligent conversation companion.**

AGENET AI is a modern, responsive, frontend-only AI chatbot dashboard built with HTML5, CSS3, and modern modular JavaScript (ES6+). It features interactive conversations with simulated replies, theme customization (Dark/Light), user authentication (Login & Registration) with LocalStorage persistence, and user-scoped conversation history.

## Features
- **Frontend User Authentication**:
  - Secure modal dialog with **Sign In** and **Create Account** tabs.
  - Interactive validation (name, email format, minimum 6-character password, password confirmation, email collision detection).
  - Password visibility toggle (show/hide password).
  - Credentials securely hashed and saved in `localStorage`.
  - User session management with profile avatar, initials, and active status indicator.
  - Profile menu popover with quick logout and preferences.
  - "Try Demo User" helper button for instant testing.
  - Beautiful toast notification system for feedback.
- **User-Scoped Conversations**:
  - Each registered user has their own private conversation history stored in LocalStorage.
  - Guest mode allows trying out the application without creating an account.
- **Responsive Chat Interface**:
  - Desktop, tablet, and mobile-optimized layouts with sliding sidebar.
  - Real-time conversation search and deletion.
  - Simulated assistant responses with typing indicator.
  - One-click copy for assistant messages.
- **Modern Design & Theming**:
  - Seamless toggle between Dark and Light modes.
  - Fluid animations, frosted glass backdrops, and accessible contrast.
  - Modular JavaScript using ES modules.

## Technology Stack
- **Structure**: HTML5 (Semantic elements, `<dialog>` modals)
- **Styling**: CSS3 (CSS Variables, Flexbox, CSS Grid, Media queries)
- **Logic**: Vanilla JavaScript (ES6+ Modules, Async/Await, Web Crypto API)
- **Icons & Fonts**: Boxicons v2.1.4, Google Fonts (Inter & Poppins)
- **Storage**: Browser LocalStorage (`agenet-ai-users-v1`, `agenet-ai-current-user-v1`, `agenet-ai-conversations-v1-*`)

## Project Structure
```text
AGENET-AI/
├── index.html            # Main application layout and dialogs
├── assets/               # SVG icons and logos
│   ├── favicon.svg
│   ├── logo.svg
│   └── mark.svg
├── css/
│   ├── variables.css     # Design tokens and theme variables
│   ├── style.css         # Base typography, layout, topbar
│   ├── sidebar.css       # Sidebar navigation and chat history
│   ├── chat.css          # Message bubbles, prompt cards, composer
│   ├── components.css    # Modals, dialogs, buttons
│   ├── auth.css          # Login/Register modal, profile popover, toasts
│   └── responsive.css    # Responsive breakpoints
├── js/
│   ├── main.js           # Entry point
│   ├── app.js            # App coordinator
│   ├── auth.js           # Authentication controller & notifications
│   ├── storage.js        # LocalStorage persistence layer
│   ├── chat.js           # Chat viewport, messaging, typing state
│   ├── sidebar.js        # Conversation list and mobile drawer
│   ├── responses.js      # Simulated AI knowledge base
│   ├── theme.js          # Theme switcher (dark/light)
│   └── utils.js          # DOM helpers, ID generator, hash utility
└── README.md
```

## Run Locally
1. Clone or download this project repository.
2. Open the project folder in VS Code.
3. Open `index.html` with the **Live Server** extension (or any local static server like `npx serve` or Python's `python -m http.server`).
4. Sign in, create an account, or use the "Try Demo User" button!

> Note: Because the project uses ES modules (`type="module"`), run with a local HTTP server rather than opening `file:///` directly.

## License
This project is open-source under the [MIT License](LICENSE).
