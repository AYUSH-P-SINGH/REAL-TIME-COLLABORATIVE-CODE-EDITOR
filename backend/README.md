# Backend - Real-Time Collaborative Code Editor API

Express.js backend server providing REST API endpoints and real-time WebSocket communication for the collaborative code editor.

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB instance
- Redis instance
- npm or yarn

## 🚀 Getting Started

### Installation

```bash
npm install
```

### Environment Setup

Create a `.env` file in the backend directory:

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database
MONGO_URI=mongodb://localhost:27017/code-editor

# Cache & Pub/Sub
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-super-secret-key-minimum-32-characters-long
JWT_EXPIRES_IN=7d
```

### Running the Server

```bash
# Development
npm run dev

# Production
npm start
```

The server will be available at `http://localhost:5000`

## 📁 Directory Structure

```
src/
├── app.js                      # Express application setup
├── index.js                    # Server entry point with lifecycle management
├── route.js                    # Master routing gateway
│
├── auth/                       # Authentication module
│   ├── auth.controller.js     # Request handlers
│   ├── auth.middleware.js     # Auth verification middleware
│   ├── auth.routes.js         # Route definitions
│   └── auth.service.js        # Business logic
│
├── config/                    # Configuration files
│   ├── db.js                  # MongoDB connection setup
│   ├── env.js                 # Environment validation (Zod)
│   ├── redis.js               # Redis client configuration
│   └── socket.js              # Socket.io setup
│
├── files/                     # File management module
│   ├── file.controller.js
│   ├── file.model.js          # MongoDB schema
│   ├── file.routes.js
│   └── file.service.js
│
├── middlewares/               # Express middlewares
│   ├── auth.middleware.js     # JWT verification
│   ├── error.middleware.js    # Centralized error handling
│   └── rateLimit.js           # Request rate limiting
│
├── projects/                  # Project management module
│   ├── project.controller.js
│   ├── project.model.js
│   ├── project.routes.js
│   └── project.service.js
│
├── redis/                     # Redis pub/sub utilities
│   ├── channels.js            # Channel definitions
│   ├── publisher.js           # Message publisher
│   └── subscriber.js          # Message subscriber
│
├── socket/                    # WebSocket handlers
│   ├── connection.js          # Connection lifecycle
│   ├── events.js              # Event definitions
│   ├── index.js               # Socket.io initialization
│   ├── presence.js            # User presence management
│   └── room.manager.js        # Room management
│
└── user/                      # User management module
    ├── user.model.js
    └── user.service.js
```

## 🔌 API Routes

### Authentication (`/api/auth`)
- `POST /register` - Register new user
- `POST /login` - User login
- `POST /logout` - User logout
- `POST /refresh` - Refresh JWT token

### Projects (`/api/projects`)
- `GET /` - Get all user projects
- `POST /` - Create new project
- `GET /:id` - Get project details
- `PUT /:id` - Update project
- `DELETE /:id` - Delete project

### Files (`/api/files`)
- `GET /:projectId` - Get all project files
- `POST /` - Create file
- `GET /:id` - Get file content
- `PUT /:id` - Update file
- `DELETE /:id` - Delete file

### Users (`/api/users`)
- `GET /me` - Get current user profile
- `PUT /me` - Update user profile
- `GET /:id` - Get user by ID

## 🔌 WebSocket Events

The server emits and listens to the following Socket.io events:

### Connection Events
- `connection` - Client connects to server
- `disconnect` - Client disconnects

### Room Events
- `room:join` - Join a collaborative workspace
- `room:leave` - Leave a collaborative workspace

### Code Events
- `code:edit` - Broadcast code changes to room
- `code:sync` - Full document synchronization

### Presence Events
- `cursor:move` - Broadcast cursor position
- `presence:update` - Update user presence/activity status

### Error Events
- `error` - Error event

## 🔐 Authentication Flow

1. User registers with email and password
2. Server validates input and creates user
3. User logs in with credentials
4. Server issues JWT token
5. Client includes token in Authorization header for API requests
6. Middleware validates token on each request
7. Token expires after configured duration (default: 7 days)

## 🗄️ Database Schema

### User Model
```javascript
{
  email: String (unique),
  password: String (hashed),
  name: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Project Model
```javascript
{
  name: String,
  description: String,
  owner: ObjectId (ref: User),
  collaborators: [ObjectId],
  createdAt: Date,
  updatedAt: Date
}
```

### File Model
```javascript
{
  name: String,
  projectId: ObjectId (ref: Project),
  content: String,
  language: String,
  createdAt: Date,
  updatedAt: Date
}
```

## 🚀 Core Features

### Real-Time Collaboration
- WebSocket-based live updates
- Redis pub/sub for distributed systems
- Automatic document synchronization

### Room Management
- Create rooms for collaborative sessions
- Track active users in each room
- Manage room permissions

### Presence Tracking
- Real-time cursor position updates
- User status tracking
- Active connection management

### Error Handling
- Centralized error middleware
- Structured error responses
- Detailed logging

### Rate Limiting
- Prevent API abuse
- Configurable limits per endpoint
- Redis-based rate limiting

## 📊 Logging

The server uses a logger utility for tracking:
- Server startup/shutdown
- Database connections
- API requests
- WebSocket events
- Errors and exceptions

## 🔄 Background Workers

### Snapshot Worker
- Periodically saves document snapshots
- Prevents data loss
- Enables efficient document recovery

## 🧪 Testing

```bash
npm test
```

## 🚢 Deployment Checklist

- [ ] Set NODE_ENV to 'production'
- [ ] Use strong JWT_SECRET
- [ ] Configure production MongoDB URI
- [ ] Configure production Redis URL
- [ ] Set appropriate CORS origins
- [ ] Enable rate limiting
- [ ] Configure HTTPS
- [ ] Set up logging/monitoring
- [ ] Test all endpoints
- [ ] Verify WebSocket connections

## 📝 Development Guidelines

### Code Organization
- Keep controllers focused on HTTP logic
- Move business logic to services
- Use models for data validation
- Middleware for cross-cutting concerns

### Error Handling
- Use try-catch for async operations
- Pass errors to error middleware
- Provide meaningful error messages
- Log errors for debugging

### Database
- Use MongoDB transactions for multi-document operations
- Index frequently queried fields
- Validate data with schemas before saving

## 🐛 Common Issues

**MongoDB Connection Fails**
- Ensure MongoDB is running
- Verify MONGO_URI is correct
- Check firewall/network access

**Redis Connection Fails**
- Ensure Redis is running
- Verify REDIS_URL is correct
- Check port configurations

**WebSocket Connection Issues**
- Verify Socket.io configuration
- Check browser console for errors
- Ensure server is running

---

For issues or questions, refer to the main README or open an issue in the repository.
