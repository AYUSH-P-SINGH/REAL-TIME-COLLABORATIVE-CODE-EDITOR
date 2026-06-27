# Frontend - Real-Time Collaborative Code Editor UI

React-based frontend for the collaborative code editor, built with Vite for optimal development experience.

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Backend API running on `http://localhost:5000`

## 🚀 Getting Started

### Installation

```bash
npm install
```

### Environment Setup

Create a `.env` file in the frontend directory:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### Running the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## 📁 Directory Structure

```
src/
├── App.jsx                     # Main App component with routing
├── main.jsx                    # React DOM entry point
├── index.html                  # HTML template
├── index.css                   # Global styles
│
├── components/                # Reusable React components
│   ├── editor/
│   │   ├── CodeEditor.jsx     # Main code editor component
│   │   └── EditorHeader.jsx   # Editor toolbar/header
│   │
│   ├── FileTree/
│   │   ├── FileExplorer.jsx   # File tree container
│   │   └── FileNode.jsx       # Individual file/folder item
│   │
│   ├── navigation/
│   │   └── Navbar.jsx         # Navigation bar
│   │
│   └── Shared/                # Shared UI components
│       ├── AvatarGroup.jsx    # User avatars display
│       ├── GlassCard.jsx      # Card component
│       └── NeonButton.jsx     # Button component
│
├── context/                   # React Context providers
│   ├── AuthContext.jsx        # Auth state management
│   └── SocketContext.jsx      # WebSocket context
│
├── hooks/                     # Custom React hooks
│   ├── useDocSync.jsx         # Document synchronization hook
│   └── usePresence.jsx        # User presence tracking hook
│
├── pages/                     # Page components
│   ├── Landing.jsx            # Public landing page
│   ├── Dashboard.jsx          # User dashboard
│   └── Workspace.jsx          # Collaborative workspace
│
├── services/                  # API services
│   └── api.js                 # API client configuration
│
└── utils/                     # Utility functions
    └── helpers.js             # Helper functions
```

## 🎨 Key Components

### AuthContext
Manages user authentication state:
- User login/logout
- JWT token management
- Protected route handling

### SocketContext
Handles real-time WebSocket communication:
- Socket.io connection management
- Event handling
- Message broadcasting

### CodeEditor
Main code editing component:
- Code highlighting
- Line numbers
- Collaborative editing indicators

### FileExplorer
File navigation component:
- Project file tree
- File/folder operations
- Drag and drop support

### Navbar
Navigation and user menu:
- User profile access
- Navigation links
- Project selection

## 🔌 WebSocket Events

### Listening Events
- `room:join` - User joined the room
- `code:edit` - Remote code change received
- `cursor:move` - Remote cursor position update
- `presence:update` - User presence change

### Emitting Events
- `room:join` - Join collaborative session
- `room:leave` - Leave collaborative session
- `code:edit` - Broadcast local code changes
- `cursor:move` - Broadcast cursor position

## 🔐 Authentication Flow

1. User accesses landing page
2. Register or login
3. JWT token stored in localStorage
4. Token included in API requests via Authorization header
5. Protected routes check for valid token
6. Automatic redirection if unauthorized

## 📊 State Management

### Global State
- **AuthContext**: User authentication state
- **SocketContext**: WebSocket connection state

### Component State
- **Local state** for form inputs, UI toggles, etc.
- **useEffect hooks** for side effects

## 🎯 Routing

```
/                     → Landing page (public)
/dashboard            → User dashboard (protected)
/workspace/:projectId → Collaborative editor (protected)
```

## 🛠️ Hooks

### useDocSync
Manages document synchronization:
```javascript
const { content, syncDocument } = useDocSync(documentId);
```

### usePresence
Tracks user presence:
```javascript
const { activeUsers, cursorPosition } = usePresence(roomId);
```

## 🎨 Styling

- **CSS Modules**: Component-scoped styling
- **Tailwind CSS**: Utility-first CSS (if configured)
- **Custom CSS**: Global and component styles in `index.css`

## 🚀 Performance Optimizations

- Code splitting with React.lazy
- Memoization with React.memo
- Efficient re-render management
- WebSocket message debouncing
- Document synchronization throttling

## 🧪 Testing

```bash
npm test
```

## 📦 Build & Deployment

### Vite Build
```bash
npm run build
```
Creates optimized production build in `dist/` directory.

### Deployment Options

**Vercel**
```bash
vercel deploy
```

**Netlify**
```bash
netlify deploy --prod --dir=dist
```

**AWS S3 + CloudFront**
```bash
aws s3 sync dist/ s3://bucket-name/
```

**Traditional Server**
```bash
# Copy dist/ contents to web server
# Ensure all routes redirect to index.html
```

## 🔐 Security Considerations

- **XSS Protection**: Input sanitization in components
- **CSRF Protection**: Token-based authentication
- **Secure Storage**: JWT in localStorage (consider secure cookie alternative)
- **CORS**: Configured on backend
- **Content Security Policy**: Set appropriate CSP headers

## 🐛 Common Issues

**WebSocket Connection Fails**
- Check VITE_SOCKET_URL in .env
- Verify backend server is running
- Check browser console for CORS errors

**API Requests 401 Unauthorized**
- Ensure token is stored in localStorage
- Check token expiration
- Verify JWT_SECRET on backend matches

**Code Not Syncing**
- Verify WebSocket connection in DevTools
- Check room:join event was emitted
- Review server logs for errors

**Build Fails**
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Clear Vite cache: `rm -rf .vite`
- Check Node version compatibility

## 📝 Development Guidelines

### Component Structure
```javascript
import { useState, useEffect } from 'react';

export default function ComponentName() {
  const [state, setState] = useState(initialValue);

  useEffect(() => {
    // Setup
    return () => {
      // Cleanup
    };
  }, [dependencies]);

  return (
    // JSX
  );
}
```

### API Calls
```javascript
import { api } from '../services/api';

const response = await api.get('/endpoint');
const data = await api.post('/endpoint', payload);
```

### Event Handling
```javascript
const socket = useContext(SocketContext);

useEffect(() => {
  socket.on('event-name', (data) => {
    // Handle event
  });
}, [socket]);
```

## 🎯 Future Enhancements

- [ ] Dark/Light theme toggle
- [ ] Code execution in browser
- [ ] Git integration
- [ ] Advanced syntax highlighting
- [ ] Collaborative drawing
- [ ] Terminal sharing
- [ ] Code review UI
- [ ] Performance monitoring

## 🔗 Useful Resources

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Socket.io Client](https://socket.io/docs/v4/client-api/)
- [React Router](https://reactrouter.com)

---

For issues or questions, refer to the main README or open an issue in the repository.
