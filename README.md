# ⚡ CodeSync — Real-Time Collaborative Code Editor

A full-stack web-based collaborative code editor that enables developers to write and edit code together in real time with live cursor tracking, presence awareness, and workspace management.

---

## ✨ Features

- **⚡ Real-Time Code Collaboration**: Edit code simultaneously with connected peers using WebSockets and differential synchronization.
- **👥 Live Presence & Cursors**: View active collaborators, cursor movements with floating name tags, and workspace activity in real time.
- **💻 Monaco Editor Integration**: Feature-rich code editor with syntax highlighting, custom themes (*vs-dark*, *light*, *cyberpunk*, *synthwave*), and developer shortcuts.
- **📁 File & Workspace Management**: Create multiple projects, organize files/folders in an intuitive tree explorer, and switch between open documents via a multi-tab interface.
- **🔒 Authentication & Authorization**: Secure JWT-based authentication with project-level access control and 1-click demo access.
- **💾 Durable State & Caching**: Fast in-memory state caching with automatic background write-behind snapshots to MongoDB.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, Monaco Editor (`@monaco-editor/react`), Socket.io Client, Axios, Lucide Icons |
| **Backend** | Node.js, Express.js, Socket.io, MongoDB (Mongoose), Redis (Caching & Pub/Sub), JWT, Zod |
| **DevOps & Tooling** | Docker, Docker Compose, Nginx, Jest, ESLint |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v18.0+` (Recommended: `v20+` or `v24+`)
- **MongoDB**: Local instance running on `mongodb://127.0.0.1:27017`
- **Redis** *(Optional for local dev, included in Docker)*: `redis://127.0.0.1:6379`

---

### Option 1: Running with Docker (Recommended)

Run the complete full-stack environment (Frontend, Backend, MongoDB, Redis) in one command:

```bash
docker compose up --build
```

- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000`

---

### Option 2: Running Locally

#### 1. Backend Setup
```bash
cd backend
npm install
```

Create `backend/.env` (or copy from `backend/.env.example`):
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/collab-db
REDIS_URL=redis://127.0.0.1:6379
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters_long
JWT_EXPIRES_IN=7d
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

Start the backend server:
```bash
npm run dev
```

#### 2. Frontend Setup
```bash
cd frontend
npm install
```

Create `frontend/.env` (or copy from `frontend/.env.example`):
```env
VITE_API_URL=http://localhost:5000/api
VITE_WS_URL=http://localhost:5000
```

Start the frontend dev server:
```bash
npm run dev
```

Open `http://localhost:3000` (or `http://localhost:5173`) in your browser.

---

## 📂 Project Structure

```
REAL-TIME-COLLABORATIVE-CODE-EDITOR/
├── backend/
│   ├── src/
│   │   ├── auth/          # User authentication (register, login, JWT)
│   │   ├── config/        # Database, Redis, Socket.io, and environment setup
│   │   ├── files/         # File CRUD services and schemas
│   │   ├── middlewares/   # Auth, rate limiting, and error handlers
│   │   ├── projects/      # Workspace and collaborator management
│   │   ├── socket/        # WebSocket handlers (presence, rooms, cursors)
│   │   ├── sync/          # Document manager & snapshot persistence worker
│   │   └── INDEX.js       # Backend server entry point
│   ├── test/              # Jest automated integration & unit tests
│   ├── Dockerfile
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── editor/    # Monaco Code Editor & Editor Header
│   │   │   ├── FileTree/  # File Explorer & Node components
│   │   │   └── Shared/    # Reusable UI cards, buttons, badges
│   │   ├── context/       # AuthContext, SocketContext, ToastContext
│   │   ├── hooks/         # useDocSync & usePresence custom hooks
│   │   ├── pages/         # Landing, Dashboard, Workspace
│   │   └── App.jsx
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── docker-compose.yml     # Multi-container orchestration
└── README.md
```

---

## 🧪 Testing & Quality Checks

Run the backend automated test suite:
```bash
cd backend
npm test
```

Run code quality linters:
```bash
# Backend linting
cd backend && npm run lint

# Frontend linting
cd frontend && npm run lint
```

Build frontend production bundle:
```bash
cd frontend
npm run build
```

---

## 📄 License
This project is open source and available under the [MIT License](LICENSE).
