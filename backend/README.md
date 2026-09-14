# Collaborative Editor Backend Service

Express and Socket.io real-time backend service for the collaborative code editor.

---

## 🛠️ Tech Stack
- **Node.js** & **Express** (REST API Gateway)
- **Socket.io** (Real-Time Document & Presence Events)
- **MongoDB** & **Mongoose** (Persistence for Users, Projects, and Files)
- **Redis** (In-Memory Hot State & Distributed Pub/Sub Adapter)
- **Zod** (Schema Validation)
- **Winston** (Structured Application Logging)

---

## 🔌 Real-Time WebSocket Events

### Connection Authentication
Sockets pass JWT credentials during the handshake:
```javascript
const socket = io("http://localhost:5000", {
  auth: { token: "YOUR_JWT_TOKEN" }
});
```

### Event Manifest

| Event Name | Direction | Payload | Description |
| :--- | :--- | :--- | :--- |
| `room:join` | Client -> Server | `{ fileId }` | Join file document room |
| `room:leave` | Client -> Server | `{ fileId }` | Leave file document room |
| `code:sync` | Server -> Client | `{ fileId, content, version }` | Initial state synchronization |
| `code:edit` | Bi-directional | `{ fileId, change, version, senderId }` | Differential keystroke edits |
| `cursor:move` | Bi-directional | `{ fileId, cursor: { line, ch } }` | Live peer cursor coordinates |
| `presence:update` | Server -> Client | `{ userId, action: 'join'\|'leave' }` | Peer join/leave notification |

---

## 🚀 Local Development

```bash
# Install dependencies
npm install

# Run automated tests
npm test

# Start development server
npm run dev
```
