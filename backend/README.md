# Collaborative Editor Backend Service

This is the high-performance, real-time collaboration server powering the editor app. It uses **Express** for management APIs, **Socket.io** for real-time collaboration events, **MongoDB** for persistent storage, and **Redis** for socket connection scaling and cursor tracking.

---

## 🛠 Tech Stack
- **Node.js** & **Express**
- **Socket.io** (Real-time Events)
- **MongoDB** & **Mongoose** (Persistence)
- **Redis** (Pub/Sub and Memory Cache)
- **Zod** (Environment Validation)
- **Winston** (Structured Logging)

---

## ⚡ Real-time Event APIs

### Connection Auth
Sockets must pass JWT credentials on connection handshake:
```javascript
const socket = io("http://localhost:5000", {
  auth: { token: "YOUR_JWT_TOKEN" }
});
```

### Event Manifest

| Event Name | Type | Direction | Payload | Description |
| :--- | :--- | :--- | :--- | :--- |
| `room:join` | Action | Client -> Server | `{ fileId: String }` | Join file edit workspace. |
| `room:leave` | Action | Client -> Server | `{ fileId: String }` | Leave file edit workspace. |
| `code:sync` | Sync | Server -> Client | `{ fileId, content, version }` | Initial code payload sent immediately on joining. |
| `code:edit` | Syncer | Client <=> Server | `{ fileId, change, version }` | Send/receive keystroke edits. |
| `cursor:move`| Presence | Client <=> Server | `{ fileId, cursor: { line, ch } }` | Cursor line/ch updates. |
| `presence:update`| Status | Server -> Client | `{ userId, userName, action: 'join'\|'leave' }` | Collaborator join/exit events. |

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v20+)
- MongoDB running locally (default: `mongodb://localhost:27017`)
- Redis running locally (default: `redis://localhost:6379`)

### Installation
1. Install project dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables in `.env`:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/collab-db
   REDIS_URL=redis://localhost:6379
   JWT_SECRET=supersecretjwtkeythatisatleast32characterslong
   ```

3. Launch server in development mode:
   ```bash
   npm run dev
   ```

### Running with Docker Compose
If you have Docker installed, you can spin up the Node app, MongoDB, and Redis instances altogether with:
```bash
docker-compose up --build
```
This sets up isolated container configurations running inside a virtual bridge network.
