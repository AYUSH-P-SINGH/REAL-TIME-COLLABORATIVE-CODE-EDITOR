# Real-Time Collaborative Code Editor

A full-stack web application that enables multiple users to collaborate on code in real-time. Features live code editing, cursor tracking, presence awareness, and project management with persistent file storage.

## 🌟 Features

### Real-Time Collaboration
- **Live Code Editing**: Multiple users can edit code simultaneously with real-time synchronization
- **Cursor Tracking**: See where other users are editing in real-time
- **Presence Awareness**: View active users and their status in the workspace
- **Document Sync**: Automatic synchronization of code changes across all connected clients

### Project Management
- **Project Creation & Management**: Create and manage multiple coding projects
- **File Explorer**: Navigate project structure with an intuitive file tree
- **File Operations**: Create, read, and manage files within projects
- **Persistent Storage**: All projects and files stored in MongoDB

### User Management
- **Authentication**: Secure JWT-based user authentication
- **User Profiles**: Manage user information and preferences
- **Access Control**: Room-based access control for collaborative workspaces

### Performance & Scalability
- **Redis Caching**: Optimized performance with Redis caching layer
- **WebSocket Communication**: Low-latency real-time communication via Socket.io
- **Rate Limiting**: API rate limiting to prevent abuse
- **Background Workers**: Snapshot workers for data persistence

## 🏗️ Project Structure

```
.
├── backend/                    # Express.js backend server
│   └── src/
│       ├── app.js             # Express application setup
│       ├── index.js           # Server entry point
│       ├── route.js           # Master routing gateway
│       ├── auth/              # Authentication module
│       │   ├── auth.controller.js
│       │   ├── auth.middleware.js
│       │   ├── auth.routes.js
│       │   └── auth.service.js
│       ├── config/            # Configuration files
│       │   ├── db.js          # MongoDB connection
│       │   ├── env.js         # Environment validation
│       │   ├── redis.js       # Redis setup
│       │   └── socket.js      # Socket.io configuration
│       ├── files/             # File management module
│       │   ├── file.controller.js
│       │   ├── file.model.js
│       │   ├── file.routes.js
│       │   └── file.service.js
│       ├── middlewares/       # Express middlewares
│       │   ├── auth.middleware.js
│       │   ├── error.middleware.js
│       │   └── rateLimit.js
│       ├── projects/          # Project management module
│       │   ├── project.controller.js
│       │   ├── project.model.js
│       │   ├── project.routes.js
│       │   └── project.service.js
│       ├── redis/             # Redis pub/sub utilities
│       │   ├── channels.js
│       │   ├── publisher.js
│       │   └── subscriber.js
│       ├── socket/            # WebSocket handlers
│       │   ├── connection.js
│       │   ├── events.js
│       │   ├── index.js
│       │   ├── presence.js
│       │   └── room.manager.js
│       └── user/              # User management module
│           ├── user.model.js
│           └── user.service.js
└── frontend/                   # React frontend
    ├── App.jsx               # Main App component
    ├── main.jsx              # React DOM entry point
    ├── index.html            # HTML template
    ├── index.css             # Global styles
    ├── components/           # React components
    │   ├── editor/           # Code editor components
    │   ├── FileTree/         # File explorer components
    │   ├── navigation/       # Navigation components
    │   └── Shared/           # Shared UI components
    ├── context/              # React context (auth, socket)
    ├── hooks/                # Custom React hooks
    ├── pages/                # Page components
    │   ├── Landing.jsx
    │   ├── Dashboard.jsx
    │   └── Workspace.jsx
    ├── services/             # API services
    └── utils/                # Utility functions
```

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **Cache/Pub-Sub**: Redis
- **Real-time**: Socket.io
- **Authentication**: JWT
- **Validation**: Zod
- **Environment**: dotenv

### Frontend
- **Framework**: React 18+
- **Build Tool**: Vite
- **Routing**: React Router
- **State Management**: React Context API
- **Real-time**: Socket.io client
- **Styling**: CSS

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- Redis (local or cloud instance)
- npm or yarn

## 🚀 Getting Started

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd REAL-TIME-COLLABORATIVE-CODE-EDITOR
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   ```

### Environment Configuration

Create a `.env` file in the `backend` directory:

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database
MONGO_URI=mongodb://localhost:27017/code-editor

# Cache & Pub/Sub
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-secret-key-here-min-32-characters
JWT_EXPIRES_IN=7d
```

Create a `.env` file in the `frontend` directory:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### Running the Application

**Backend**
```bash
cd backend
npm start
```
The server will start on `http://localhost:5000`

**Frontend** (in a new terminal)
```bash
cd frontend
npm run dev
```
The frontend will start on `http://localhost:5173`

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

### Projects
- `GET /api/projects` - Get all user projects
- `POST /api/projects` - Create a new project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Files
- `GET /api/files/:projectId` - Get project files
- `POST /api/files` - Create a file
- `GET /api/files/:id` - Get file content
- `PUT /api/files/:id` - Update file
- `DELETE /api/files/:id` - Delete file

### Users
- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me` - Update user profile

## 🔌 WebSocket Events

### Room Management
- `room:join` - Join a collaborative session
- `room:leave` - Leave a collaborative session

### Code Editing
- `code:edit` - Broadcast code changes
- `code:sync` - Sync full document state

### Presence
- `cursor:move` - Broadcast cursor position
- `presence:update` - Update user presence/status

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **CORS**: Cross-origin resource sharing configured
- **Rate Limiting**: API rate limiting to prevent abuse
- **Error Middleware**: Centralized error handling
- **Environment Validation**: Zod schema validation for environment variables
- **Payload Limits**: Request size limits to prevent abuse

## 📝 Development

### Project Structure Conventions
- **Controllers**: Handle HTTP request logic
- **Services**: Implement business logic
- **Models**: Define data schemas
- **Routes**: Map endpoints to controllers
- **Middlewares**: Cross-cutting concerns

### Code Standards
- Follow Node.js best practices
- Use async/await for asynchronous operations
- Implement proper error handling
- Validate all inputs using Zod

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 📦 Deployment

### Backend Deployment
The backend can be deployed to services like:
- Heroku
- AWS EC2
- DigitalOcean
- Railway

### Frontend Deployment
The frontend can be deployed to:
- Vercel
- Netlify
- AWS S3 + CloudFront
- GitHub Pages

## 🤝 Contributing

1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit your changes (`git commit -m 'Add amazing feature'`)
3. Push to the branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🐛 Troubleshooting

### Common Issues

**Connection Issues**
- Ensure MongoDB and Redis are running
- Check environment variables are correctly set
- Verify firewall rules allow connections

**Real-time Synchronization Issues**
- Check Socket.io connection in browser DevTools
- Verify Redis connectivity
- Review server logs for errors

**Authentication Issues**
- Ensure JWT_SECRET is correctly configured
- Check token expiration settings
- Verify user credentials in database

## 📞 Support

For issues, questions, or contributions, please open an issue on the GitHub repository.

## 🎯 Future Enhancements

- [ ] Code execution in the browser
- [ ] Version control integration
- [ ] Syntax highlighting improvements
- [ ] Multi-language support
- [ ] Collaborative drawing/whiteboard
- [ ] Terminal sharing
- [ ] Code review features
- [ ] Performance optimizations

---

**Last Updated**: 2026-06-27
