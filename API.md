# API Reference

Complete API documentation for the Real-Time Collaborative Code Editor backend.

## Base URL

```
http://localhost:5000/api
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

Get a token by logging in:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'
```

---

## 🔐 Authentication Endpoints

### Register User
**Endpoint**: `POST /auth/register`

**Request**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}
```

**Response** (200):
```json
{
  "token": "eyJhbGc...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

### Login
**Endpoint**: `POST /auth/login`

**Request**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response** (200):
```json
{
  "token": "eyJhbGc...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

### Logout
**Endpoint**: `POST /auth/logout`

**Headers**: `Authorization: Bearer TOKEN`

**Response** (200):
```json
{
  "message": "Logged out successfully"
}
```

### Refresh Token
**Endpoint**: `POST /auth/refresh`

**Headers**: `Authorization: Bearer TOKEN`

**Response** (200):
```json
{
  "token": "newToken..."
}
```

---

## 👤 User Endpoints

### Get Current User
**Endpoint**: `GET /users/me`

**Headers**: `Authorization: Bearer TOKEN`

**Response** (200):
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "name": "John Doe",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### Update User Profile
**Endpoint**: `PUT /users/me`

**Headers**: `Authorization: Bearer TOKEN`

**Request**:
```json
{
  "name": "Jane Doe",
  "email": "newemail@example.com"
}
```

**Response** (200):
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "email": "newemail@example.com",
  "name": "Jane Doe",
  "updatedAt": "2024-01-15T11:30:00Z"
}
```

### Get User by ID
**Endpoint**: `GET /users/:id`

**Headers**: `Authorization: Bearer TOKEN`

**Response** (200):
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "name": "John Doe"
}
```

---

## 📁 Project Endpoints

### Get All Projects
**Endpoint**: `GET /projects`

**Headers**: `Authorization: Bearer TOKEN`

**Query Parameters**:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)

**Response** (200):
```json
{
  "projects": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Web App",
      "description": "My web application",
      "owner": "507f1f77bcf86cd799439011",
      "collaborators": [],
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 1,
  "page": 1
}
```

### Create Project
**Endpoint**: `POST /projects`

**Headers**: `Authorization: Bearer TOKEN`

**Request**:
```json
{
  "name": "New Project",
  "description": "Project description"
}
```

**Response** (201):
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "name": "New Project",
  "description": "Project description",
  "owner": "507f1f77bcf86cd799439011",
  "collaborators": [],
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### Get Project by ID
**Endpoint**: `GET /projects/:id`

**Headers**: `Authorization: Bearer TOKEN`

**Response** (200):
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "name": "Web App",
  "description": "My web application",
  "owner": "507f1f77bcf86cd799439011",
  "collaborators": [],
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### Update Project
**Endpoint**: `PUT /projects/:id`

**Headers**: `Authorization: Bearer TOKEN`

**Request**:
```json
{
  "name": "Updated Project Name",
  "description": "Updated description"
}
```

**Response** (200):
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "name": "Updated Project Name",
  "description": "Updated description",
  "updatedAt": "2024-01-15T11:30:00Z"
}
```

### Delete Project
**Endpoint**: `DELETE /projects/:id`

**Headers**: `Authorization: Bearer TOKEN`

**Response** (200):
```json
{
  "message": "Project deleted successfully"
}
```

---

## 📄 File Endpoints

### Get Project Files
**Endpoint**: `GET /files/project/:projectId`

**Headers**: `Authorization: Bearer TOKEN`

**Response** (200):
```json
{
  "files": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "name": "index.js",
      "projectId": "507f1f77bcf86cd799439012",
      "language": "javascript",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Create File
**Endpoint**: `POST /files`

**Headers**: `Authorization: Bearer TOKEN`

**Request**:
```json
{
  "name": "app.js",
  "projectId": "507f1f77bcf86cd799439012",
  "language": "javascript"
}
```

**Response** (201):
```json
{
  "_id": "507f1f77bcf86cd799439013",
  "name": "app.js",
  "projectId": "507f1f77bcf86cd799439012",
  "language": "javascript",
  "content": "",
  "version": 1,
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### Get File Content
**Endpoint**: `GET /files/:id`

**Headers**: `Authorization: Bearer TOKEN`

**Response** (200):
```json
{
  "_id": "507f1f77bcf86cd799439013",
  "name": "app.js",
  "content": "console.log('Hello, World!');",
  "language": "javascript",
  "version": 5,
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### Update File
**Endpoint**: `PUT /files/:id`

**Headers**: `Authorization: Bearer TOKEN`

**Request**:
```json
{
  "content": "console.log('Updated code!');"
}
```

**Response** (200):
```json
{
  "_id": "507f1f77bcf86cd799439013",
  "name": "app.js",
  "content": "console.log('Updated code!');",
  "version": 6,
  "updatedAt": "2024-01-15T11:30:00Z"
}
```

### Delete File
**Endpoint**: `DELETE /files/:id`

**Headers**: `Authorization: Bearer TOKEN`

**Response** (200):
```json
{
  "message": "File deleted successfully"
}
```

---

## 🔌 WebSocket Events

### Connection

**Client Connects**:
```javascript
const socket = io('http://localhost:5000', {
  auth: { token: 'YOUR_JWT_TOKEN' }
});

socket.on('connect', () => {
  console.log('Connected!');
});

socket.on('disconnect', () => {
  console.log('Disconnected!');
});

socket.on('error', (error) => {
  console.error('Connection error:', error);
});
```

### Room Management

**Join Room**:
```javascript
socket.emit('room:join', { fileId: '507f1f77bcf86cd799439013' });
```

**Leave Room**:
```javascript
socket.emit('room:leave', { fileId: '507f1f77bcf86cd799439013' });
```

### Code Synchronization

**Emit Code Edit** (Client → Server → Other Clients):
```javascript
socket.emit('code:edit', {
  fileId: '507f1f77bcf86cd799439013',
  change: {
    from: { line: 0, ch: 0 },
    to: { line: 0, ch: 5 },
    text: ['hello']
  },
  version: 6
});
```

**Receive Code Sync** (Server → Client on room join):
```javascript
socket.on('code:sync', (data) => {
  console.log('Full document sync:', data);
  // {
  //   fileId: '507f1f77bcf86cd799439013',
  //   content: 'console.log("Hello");',
  //   version: 6
  // }
});
```

### Presence Tracking

**Emit Cursor Position** (Client → Server → Other Clients):
```javascript
socket.emit('cursor:move', {
  fileId: '507f1f77bcf86cd799439013',
  cursor: { line: 5, ch: 15 }
});
```

**Receive Cursor Update** (Server → Client):
```javascript
socket.on('cursor:move', (data) => {
  console.log('User cursor moved:', data);
  // {
  //   fileId: '507f1f77bcf86cd799439013',
  //   cursor: { line: 5, ch: 15 },
  //   userId: '507f1f77bcf86cd799439011',
  //   userName: 'John Doe'
  // }
});
```

**Receive Presence Update** (Server → Client):
```javascript
socket.on('presence:update', (data) => {
  console.log('User presence updated:', data);
  // {
  //   userId: '507f1f77bcf86cd799439011',
  //   userName: 'John Doe',
  //   action: 'join' // or 'leave'
  // }
});
```

---

## ❌ Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid request data",
  "details": "Field validation failed"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Token missing or invalid"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "You don't have permission for this resource"
}
```

### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "Resource does not exist"
}
```

### 409 Conflict
```json
{
  "error": "Conflict",
  "message": "Email already exists"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

---

## 📊 Rate Limiting

API endpoints are rate-limited:
- **Default**: 100 requests per 15 minutes
- **Authentication**: 5 attempts per 15 minutes
- **File Operations**: 50 requests per 15 minutes

Response headers include:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1642291200
```

When limit exceeded (429):
```json
{
  "error": "Too Many Requests",
  "retryAfter": 60
}
```

---

## 📝 Pagination

List endpoints support pagination:

**Query Parameters**:
- `page` - Page number (1-indexed, default: 1)
- `limit` - Items per page (default: 10, max: 100)

**Response**:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "pages": 5
  }
}
```

---

**Last Updated**: June 27, 2026
