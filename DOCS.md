# Documentation Index

Welcome to the Real-Time Collaborative Code Editor documentation! This index helps you find what you need.

## 📚 Main Documentation Files

### Getting Started
- **[README.md](README.md)** - Project overview, features, and tech stack
- **[SETUP.md](SETUP.md)** - Installation and deployment guide (START HERE)
- **[QUICKSTART.md](#quickstart)** - Quick reference for common tasks

### Development
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System design and data flow
- **[backend/README.md](backend/README.md)** - Backend development guide
- **[frontend/README.md](frontend/README.md)** - Frontend development guide
- **[API.md](API.md)** - Complete API reference with examples

### Contributing
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Contribution guidelines
- **[CODE_OF_CONDUCT.md](#code-of-conduct)** - Community standards

---

## 🚀 Quickstart

### 5-Minute Setup with Docker

```bash
# 1. Start services (MongoDB, Redis, Backend)
cd backend
docker-compose up -d

# 2. Start frontend
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173` and start coding!

### Manual Setup (10 minutes)

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

See [SETUP.md](SETUP.md) for detailed instructions.

---

## 🎯 Common Tasks

### I want to...

#### 📖 Understand the project
- Read [README.md](README.md) for overview
- Check [ARCHITECTURE.md](ARCHITECTURE.md) for system design

#### 🔧 Set up the development environment
- Follow [SETUP.md](SETUP.md) step-by-step
- Use Docker for quick setup: `docker-compose up`

#### 📝 Write API code
- Check [API.md](API.md) for endpoint documentation
- Review [backend/README.md](backend/README.md) for structure

#### 🎨 Build UI components
- See [frontend/README.md](frontend/README.md)
- Review component structure in `src/components/`

#### 🐛 Debug issues
- Check [SETUP.md#common-issues](SETUP.md) for troubleshooting
- Review logs: `docker-compose logs app`

#### 🚀 Deploy to production
- Follow [SETUP.md#production-deployment](SETUP.md)
- Update environment variables for production

#### 📤 Contribute code
- Read [CONTRIBUTING.md](CONTRIBUTING.md)
- Follow commit message guidelines
- Create feature branch: `git checkout -b feature/name`

---

## 📋 Project Structure

```
.
├── README.md                    ← Start here
├── SETUP.md                     ← Installation guide
├── ARCHITECTURE.md              ← System design
├── API.md                       ← API reference
├── CONTRIBUTING.md              ← How to contribute
│
├── backend/                     ← Express.js server
│   ├── README.md               ← Backend docs
│   ├── package.json            ← Dependencies
│   ├── docker-compose.yml      ← Docker setup
│   └── src/
│       ├── index.js            ← Entry point
│       ├── app.js              ← Express app
│       ├── routes.js           ← Main router
│       ├── auth/               ← Auth module
│       ├── projects/           ← Project CRUD
│       ├── files/              ← File CRUD
│       ├── socket/             ← Real-time events
│       ├── redis/              ← Cache layer
│       ├── config/             ← Configuration
│       └── middlewares/        ← Middleware
│
├── frontend/                    ← React app
│   ├── README.md               ← Frontend docs
│   ├── package.json            ← Dependencies
│   ├── vite.config.js          ← Build config
│   └── src/
│       ├── App.jsx             ← Main component
│       ├── components/         ← Reusable UI
│       ├── pages/              ← Page components
│       ├── context/            ← State management
│       ├── hooks/              ← Custom hooks
│       ├── services/           ← API client
│       └── utils/              ← Utilities
│
└── .git/                        ← Version control
```

---

## 🔑 Key Concepts

### Real-Time Collaboration
- Multiple users edit same file simultaneously
- Changes sync in < 100ms
- Uses WebSocket (Socket.io) for low-latency
- Redis pub/sub for distributed systems

### Document Synchronization
- Conflict resolution with version tracking
- Operational transformation for accuracy
- Periodic full sync to ensure consistency

### Presence Tracking
- See where others are editing (cursors)
- Know who's in the room (avatars)
- Real-time status updates

### Authentication
- JWT token-based auth
- Password hashing with bcryptjs
- Token in localStorage (client)
- Validated on each request

### Database
- MongoDB for persistent storage
- Mongoose ODM for data modeling
- Redis for caching and pub/sub

---

## 💾 Database Models

### User
- Email (unique)
- Password (hashed)
- Name
- CreatedAt

### Project
- Name
- Description
- Owner (User)
- Collaborators (Users)
- CreatedAt

### File
- Name
- Content
- Language
- ProjectId (Project)
- Version (for sync)
- CreatedAt

---

## 🔌 WebSocket Events

| Event | Direction | Purpose |
|-------|-----------|---------|
| `room:join` | Client → Server | Join collaborative session |
| `code:edit` | Both | Code change notification |
| `code:sync` | Server → Client | Full document sync |
| `cursor:move` | Both | Cursor position update |
| `presence:update` | Server → Client | User join/leave |

See [API.md](API.md) for detailed event payloads.

---

## 🚀 Deployment

### Development
```bash
npm run dev          # Auto-reload enabled
```

### Production
```bash
npm start            # Optimized build
NODE_ENV=production  # Set environment
```

### Docker
```bash
docker-compose up -d  # All services
docker-compose logs   # View logs
docker-compose down   # Stop services
```

See [SETUP.md](SETUP.md) for cloud deployment options.

---

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for test guidelines.

---

## 🐛 Common Issues

| Problem | Solution |
|---------|----------|
| MongoDB connection fails | Check `MONGO_URI` in `.env`, ensure MongoDB running |
| Redis connection fails | Check `REDIS_URL` in `.env`, ensure Redis running |
| WebSocket fails | Check backend URL in frontend `.env` |
| Token expired | Login again to get new token |
| Port in use | Change `PORT` in `.env` or kill process |

Full troubleshooting: [SETUP.md](SETUP.md)

---

## 📞 Getting Help

- **Questions?** Check FAQ sections in relevant README
- **Bug found?** Open GitHub Issue with reproduction steps
- **Feature idea?** Submit GitHub Discussion
- **Stuck?** Review [SETUP.md](SETUP.md) and [ARCHITECTURE.md](ARCHITECTURE.md)

---

## 📖 Learning Resources

### Collaborative Editing
- [Operational Transformation](https://en.wikipedia.org/wiki/Operational_transformation)
- [CRDTs](https://crdt.tech/)
- [Conflict-free replicated data types](https://arxiv.org/abs/1805.06358)

### Real-Time Communication
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [Socket.io Guide](https://socket.io/docs/v4/)
- [Redis Pub/Sub](https://redis.io/topics/pubsub)

### Web Development
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [React Hooks](https://react.dev/reference/react/hooks)
- [MongoDB University](https://university.mongodb.com/)

---

## ✅ Checklist for New Contributors

- [ ] Read [README.md](README.md)
- [ ] Follow [SETUP.md](SETUP.md) to set up locally
- [ ] Review [ARCHITECTURE.md](ARCHITECTURE.md)
- [ ] Read [CONTRIBUTING.md](CONTRIBUTING.md)
- [ ] Pick an issue or feature to work on
- [ ] Create feature branch: `git checkout -b feature/my-feature`
- [ ] Make changes and test locally
- [ ] Commit with descriptive message
- [ ] Push and create Pull Request
- [ ] Address review feedback

---

## 🎓 Development Paths

### Backend Development
1. Read [backend/README.md](backend/README.md)
2. Study [ARCHITECTURE.md](ARCHITECTURE.md) - Server Architecture section
3. Review code in `backend/src`
4. Check [API.md](API.md) for endpoints
5. Start coding!

### Frontend Development
1. Read [frontend/README.md](frontend/README.md)
2. Study component structure
3. Review `frontend/src/components`
4. Check Socket.io events in code
5. Start building!

### Full Stack
1. Complete both paths above
2. Understand system architecture
3. Test end-to-end flows
4. Deploy to production

---

## 📊 Technology Stack Summary

**Backend**: Node.js, Express, MongoDB, Redis, Socket.io, JWT  
**Frontend**: React, Vite, Monaco Editor, Axios, Socket.io-client  
**DevOps**: Docker, Docker Compose  
**Tools**: Git, ESLint, Nodemon  

---

## 🎯 Next Steps

1. **New to the project?** → Read [SETUP.md](SETUP.md)
2. **Want to understand the system?** → Check [ARCHITECTURE.md](ARCHITECTURE.md)
3. **Need API details?** → See [API.md](API.md)
4. **Ready to contribute?** → Read [CONTRIBUTING.md](CONTRIBUTING.md)
5. **Have questions?** → Check relevant README files

---

**Version**: 1.0.0  
**Last Updated**: June 27, 2026  
**Maintained by**: Development Team
