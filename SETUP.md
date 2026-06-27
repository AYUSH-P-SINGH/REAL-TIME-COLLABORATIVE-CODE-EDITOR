# Complete Setup Guide

This guide walks you through setting up the Real-Time Collaborative Code Editor project.

## 🚀 Quick Start

### Option 1: Docker (Recommended - Fastest)

If you have Docker and Docker Compose installed:

```bash
cd backend
docker-compose up -d
```

This automatically starts:
- Backend API on `http://localhost:5000`
- MongoDB on `mongodb://localhost:27017`
- Redis on `redis://localhost:6379`

Then in a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend will be on `http://localhost:5173`

### Option 2: Manual Setup

#### Prerequisites
- Node.js (v14+)
- MongoDB running locally
- Redis running locally

#### Backend Setup

```bash
cd backend
npm install
npm run dev
```

Server runs on `http://localhost:5000`

#### Frontend Setup (in new terminal)

```bash
cd frontend
npm install
npm run dev
```

Frontend on `http://localhost:5173`

---

## 🛠️ Backend Configuration

### Environment Variables (`.env`)

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb://localhost:27017/collab-db

# Cache
REDIS_URL=redis://localhost:6379

# JWT Auth
JWT_SECRET=supersecretjwtkeythatisatleast32characterslong
JWT_EXPIRES_IN=7d
```

### Dependencies

```
express (4.19.2) - Web framework
socket.io (4.7.5) - Real-time communication
@socket.io/redis-adapter (8.3.0) - Redis adapter
mongoose (8.3.2) - MongoDB ODM
redis (4.6.13) - Redis client
jsonwebtoken (9.0.2) - JWT tokens
bcryptjs (2.4.3) - Password hashing
cors (2.8.5) - CORS support
dotenv (16.4.5) - Environment variables
zod (3.23.4) - Schema validation
winston (3.13.0) - Logging
diff-match-patch (1.0.5) - Text diffing
node-cron (3.0.3) - Task scheduling
```

### Available Commands

```bash
npm start    # Production
npm run dev  # Development with auto-reload
```

---

## 🎨 Frontend Configuration

### Environment Variables (`.env`)

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### Dependencies

```
react (18.2.0) - UI framework
react-dom (18.2.0) - React rendering
react-router-dom (6.23.0) - Routing
socket.io-client (4.7.5) - WebSocket client
axios (1.6.8) - HTTP client
@monaco-editor/react (4.6.0) - Code editor
lucide-react (0.372.0) - Icons
vite (5.2.0) - Build tool
```

### Available Commands

```bash
npm run dev     # Development server
npm run build   # Production build
npm run preview # Preview production build
npm run lint    # Lint code
```

---

## 🐳 Docker Deployment

### Start Services

```bash
docker-compose up -d
```

### View Logs

```bash
docker-compose logs -f app
docker-compose logs -f mongo
docker-compose logs -f redis
```

### Stop Services

```bash
docker-compose down
```

### Rebuild

```bash
docker-compose up -d --build
```

### Services Configuration

**Backend Container:**
- Port: 5000
- Auto-reload: Enabled
- Volume: Current directory mounted

**MongoDB Container:**
- Port: 27017
- Persistence: Named volume `mongo-data`

**Redis Container:**
- Port: 6379
- Persistence: Named volume `redis-data`
- AOF: Enabled for durability

---

## 🔐 Authentication

### Register New User
```bash
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "secure_password",
  "name": "User Name"
}
```

### Login
```bash
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "secure_password"
}

Response:
{
  "token": "eyJhbGc...",
  "user": { ... }
}
```

### Use Token
Include in API requests:
```
Authorization: Bearer YOUR_TOKEN_HERE
```

### WebSocket Auth
```javascript
const socket = io('http://localhost:5000', {
  auth: { token: 'YOUR_JWT_TOKEN' }
});
```

---

## 📡 Testing Collaboration

### Test Real-Time Features

1. **Open Two Terminals**
   - Frontend 1: `http://localhost:5173`
   - Frontend 2: `http://localhost:5173` (new incognito window or different browser)

2. **Create a Project**
   - Register user 1
   - Create a project
   - Create a file

3. **Invite Collaborator**
   - Register user 2
   - Login with user 2
   - Open same project (if shared)

4. **Test Live Editing**
   - User 1 edits code
   - User 2 should see changes in real-time
   - Test cursor position tracking
   - Test presence updates

---

## 🐛 Common Issues

### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:** Ensure MongoDB is running
```bash
# Windows
mongod

# macOS
brew services start mongodb-community

# Linux
sudo service mongod start
```

### Redis Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:6379
```
**Solution:** Ensure Redis is running
```bash
# Windows (with WSL)
redis-server

# macOS
brew services start redis

# Linux
sudo service redis-server start
```

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution:** Change port in `.env` or kill process using port
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :5000
kill -9 <PID>
```

### WebSocket Connection Failed
```
WebSocket connection failed
```
**Solution:**
- Verify backend is running: `http://localhost:5000`
- Check VITE_SOCKET_URL in `.env`
- Check browser console for CORS errors
- Try refreshing page

### 401 Unauthorized
```
Error: 401 Unauthorized
```
**Solution:**
- Login again to get new token
- Check JWT_SECRET matches backend
- Verify token in localStorage

---

## 📊 Database Initialization

The database collections are automatically created on first run:

- **Users** - User accounts and credentials
- **Projects** - User projects
- **Files** - Project files with content

### Backup MongoDB

```bash
# Export
mongodump --uri "mongodb://localhost:27017/collab-db"

# Import
mongorestore --uri "mongodb://localhost:27017/collab-db" dump/
```

---

## 🎯 Production Deployment

### Backend Deployment Steps

1. Set environment to production:
   ```env
   NODE_ENV=production
   JWT_SECRET=long-random-secret-key-here
   ```

2. Build Docker image:
   ```bash
   docker build -t collab-editor-backend .
   ```

3. Deploy to cloud service:
   - Heroku
   - AWS EC2
   - DigitalOcean
   - Railway
   - Render

### Frontend Deployment Steps

1. Build for production:
   ```bash
   npm run build
   ```

2. Deploy `dist/` folder to:
   - Vercel
   - Netlify
   - AWS S3 + CloudFront
   - GitHub Pages

---

## 🆘 Getting Help

- Check logs: `docker-compose logs app`
- Review errors: Check browser console (F12)
- Database: Check MongoDB Atlas if using cloud
- Cache: Check Redis connection with `redis-cli`

