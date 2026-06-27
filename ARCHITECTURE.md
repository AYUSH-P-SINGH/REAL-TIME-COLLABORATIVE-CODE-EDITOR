# Architecture & Design

This document outlines the system architecture, data flow, and design patterns used in the Real-Time Collaborative Code Editor.

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       CLIENT LAYER                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Browser 1  │  │   Browser 2  │  │   Browser N  │     │
│  │   (React UI) │  │   (React UI) │  │   (React UI) │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────┬────────────────────────┬───────────────────────────┘
         │                        │
         │ HTTP/REST             │ WebSocket
         │                        │
┌────────▼────────────────────────▼───────────────────────────┐
│                    API GATEWAY LAYER                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │       Express.js Server (Port 5000)                 │   │
│  │  ┌──────────────┐  ┌──────────────────────────┐    │   │
│  │  │ HTTP Routes  │  │ Socket.io Server         │    │   │
│  │  ├─────────────┤  ├─────────────────────────┤    │   │
│  │  │ /api/auth   │  │ - room:join             │    │   │
│  │  │ /api/users  │  │ - code:edit             │    │   │
│  │  │ /api/files  │  │ - cursor:move           │    │   │
│  │  │ /api/projects│ │ - presence:update       │    │   │
│  │  └──────────────┘  └──────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────┘   │
└────────┬─────────────────────────┬────────────────────────┬─┘
         │                         │                        │
         │ REST                    │ DB Ops                 │
         │                         │                        │
┌────────▼────────┐    ┌──────────▼──────────┐  ┌──────────▼────────┐
│   PERSISTENCE   │    │   CACHE & PUBSUB    │  │   DATA VALIDATION │
│                 │    │                     │  │                   │
│  ┌───────────┐  │    │  ┌───────────────┐ │  │ ┌───────────────┐ │
│  │ MongoDB   │  │    │  │    Redis      │ │  │ │     Zod       │ │
│  │           │  │    │  │ ┌───────────┐ │ │  │ │               │ │
│  │ Collections:  │    │  │ Pub/Sub    │ │ │  │ │ - Auth Schema │ │
│  │ • Users      │    │  │ - Channels │ │ │  │ │ - File Schema │ │
│  │ • Projects   │    │  │ - Events   │ │ │  │ │ - User Schema │ │
│  │ • Files      │    │  │ ┌───────────┐ │ │  │ └───────────────┘ │
│  │ • Sessions   │    │  │ Cache      │ │ │  │                   │
│  │             │    │  │ - Cursors  │ │ │  │                   │
│  │ Persistence: │    │  │ - Presence │ │ │  │                   │
│  │ • Sharding  │    │  └───────────┘ │ │  │                   │
│  │ • Indexing  │    │                 │ │  │                   │
│  └───────────┘  │    └─────────────────┘ │  └───────────────────┘
└─────────────────┘                        │
                                           │
                    ┌──────────────────────┘
                    │
          ┌─────────▼──────────┐
          │ Background Worker  │
          │  (node-cron)       │
          │ - Snapshots        │
          │ - Cleanup          │
          │ - Maintenance      │
          └────────────────────┘
```

## 🔄 Data Flow

### User Authentication Flow

```
1. User Registration/Login
   Client → POST /api/auth/login → Server
   
2. Token Generation
   Server validates credentials → Generate JWT → Return token
   
3. Store Token
   Client → localStorage.setItem('token', jwt)
   
4. Subsequent Requests
   Client → API call with Authorization header
   Server → Middleware validates token
   
5. WebSocket Auth
   Client → io(url, { auth: { token } })
   Server → Verify token on connection
```

### Real-Time Code Editing Flow

```
User 1 edits code:
1. Client detects keystroke
2. Emit `code:edit` event via WebSocket
3. Server receives on socket connection
4. Server broadcasts to room:
   - Other clients in same file room
   - Redis pub/sub for distributed systems
5. Clients receive and update local editor
6. Display real-time changes

User 2 sees changes:
1. User 1's edit → Server
2. Server → Redis pub/sub
3. Redis → All connected instances
4. User 2's Socket.io listener
5. Update Monaco editor content
```

### Document Synchronization

```
Conflict Resolution Strategy:
- Version-based tracking
- Last-write-wins for same version
- Operational transformation for accuracy
- Periodic full sync (code:sync event)

Sync Trigger:
- User joins room → Request full document (code:sync)
- Periodic background sync
- On connection recovery
```

### Presence & Cursor Tracking

```
User 1 moves cursor:
1. Mouse move event → Calculate position
2. Emit `cursor:move` with { line, ch }
3. Server stores in Redis cache
4. Broadcast to other users in room
5. User 2 sees cursor position update
6. Display other user's cursor with avatar

Presence Update:
1. User joins → `presence:update` { action: 'join' }
2. Server broadcasts to room
3. Other clients update UI with active users
4. User leaves → `presence:update` { action: 'leave' }
```

## 🏛️ Module Architecture

### Authentication Module (`/auth`)
- **controller**: HTTP request handlers
- **middleware**: JWT verification
- **service**: Business logic (hash, verify)
- **routes**: Endpoint definitions
- **models**: User data schema

### File Management (`/files`)
- **controller**: CRUD operations
- **service**: File operations logic
- **model**: File schema with versioning
- **routes**: File endpoints

### Real-Time (`/socket`)
- **connection**: Socket lifecycle
- **events**: Event definitions
- **index**: Socket.io setup
- **room.manager**: Room state management
- **presence**: User presence tracking

### Configuration (`/config`)
- **db**: MongoDB connection
- **env**: Environment validation
- **redis**: Redis client setup
- **socket**: Socket.io configuration

### Utilities
- **redis/channels**: Event channels
- **redis/publisher**: Publish events
- **redis/subscriber**: Subscribe to events

## 🔐 Security Architecture

### Authentication & Authorization

```
┌─────────────────────────────────────────┐
│     JWT Token-Based Auth Flow           │
├─────────────────────────────────────────┤
│                                         │
│ 1. User provides credentials            │
│ 2. Server validates against hashed pwd  │
│ 3. JWT generated (Header + Payload +    │
│    Signature using JWT_SECRET)          │
│ 4. Client stores in localStorage        │
│ 5. Token included in:                   │
│    - Authorization header for REST      │
│    - auth object for WebSocket          │
│ 6. Server validates token on each req   │
│                                         │
└─────────────────────────────────────────┘
```

### Password Security
- Bcryptjs hashing (10+ salt rounds)
- Never stored in plain text
- Validated with schema (min length)

### CORS Protection
- Configured for allowed origins
- Prevents unauthorized cross-origin requests

### WebSocket Security
- Token required for connection
- Middleware validates on handshake
- Per-room authorization

## 🗂️ Data Models

### User Document
```javascript
{
  _id: ObjectId,
  email: String (indexed, unique),
  password: String (hashed),
  name: String,
  createdAt: Date (indexed),
  updatedAt: Date
}
```

### Project Document
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  owner: ObjectId (ref: User),
  collaborators: [ObjectId],
  createdAt: Date (indexed),
  updatedAt: Date
}
```

### File Document
```javascript
{
  _id: ObjectId,
  name: String,
  projectId: ObjectId (indexed),
  content: String (large text),
  language: String,
  version: Number (for sync),
  createdAt: Date,
  updatedAt: Date
}
```

### Session Cache (Redis)
```javascript
{
  "user:{userId}:cursor" => {
    fileId: String,
    line: Number,
    ch: Number,
    userId: String,
    userName: String
  },
  "room:{fileId}:active" => [userId1, userId2, ...]
}
```

## 🔄 Request Lifecycle

### HTTP Request Lifecycle
```
1. Client initiates request
2. CORS middleware (allowed origins)
3. JSON parser middleware
4. URL parser middleware
5. Auth middleware (verify JWT)
6. Route handler (controller)
7. Business logic (service)
8. Database operation (model)
9. Response sent
10. Error middleware (if error)
```

### WebSocket Event Lifecycle
```
1. Client connects with token
2. Auth verification middleware
3. Connection handler
4. Event listener (event:name)
5. Service logic
6. Broadcast to room/Redis
7. Client receives on listener
8. Update local state
9. Re-render UI
```

## 📊 Performance Considerations

### Scaling Strategy

**Horizontal Scaling:**
- Redis adapter bridges multiple server instances
- All instances receive Socket.io events via Redis pub/sub
- Database connection pooling
- Load balancer distributes requests

**Caching:**
- User data cached in Redis
- Cursor positions cached (TTL: 60s)
- Presence data ephemeral in Redis

**Database Optimization:**
- Indexes on frequently queried fields
- Connection pooling
- Batch operations
- Transaction support

### Load Distribution
```
Clients → Load Balancer → [Server 1, Server 2, Server N]
                              ↓        ↓         ↓
                         Redis Pub/Sub (single instance)
                              ↓        ↓         ↓
                         MongoDB (replicated)
```

## 🧪 Testing Strategy

### Unit Tests
- Service logic
- Utility functions
- Schema validation

### Integration Tests
- API endpoints
- Database operations
- WebSocket events

### End-to-End Tests
- User authentication flow
- Real-time collaboration
- File synchronization

## 📝 Design Patterns

### Repository Pattern
- Centralized data access
- Easy to mock for testing
- Separation of concerns

### Observer Pattern
- Socket.io event listeners
- Redis pub/sub subscribers
- UI component observers

### Middleware Pattern
- Express middleware chain
- Error handling
- Authentication

### Factory Pattern
- Socket room creation
- Service instantiation

---

**Last Updated**: 2026-06-27
