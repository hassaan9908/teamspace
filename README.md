# TeamSpace

TeamSpace is a full-stack real-time team collaboration platform built with the MERN stack and Socket.IO.

It provides workspaces, public and private channels, direct messaging, task management, file sharing, real-time notifications, presence tracking, search, and role-based workspace management in a single application.

## Live Demo

**Frontend:**  
https://teamspace-kohl.vercel.app

**Backend API:**  
https://teamspace-10tn.onrender.com

**GitHub:**  
https://github.com/hassaan9908/teamspace

---

## Features

### Authentication

- User registration and login
- JWT-based authentication
- Protected frontend routes
- Persistent authentication across refreshes
- Password hashing using bcrypt

### Workspace Management

- Create multiple workspaces
- Switch between workspaces
- Workspace members management
- Owner, Admin, and Member roles
- Role-based permissions
- Add members using email
- Change member roles
- Remove workspace members

### Channels

- Public and private channels
- Workspace-scoped channels
- Private channel member management
- Real-time channel messaging
- Typing indicators
- Online/offline presence
- Message editing
- Message deletion
- Emoji reactions

### Direct Messaging

- One-to-one conversations
- Real-time messaging
- Conversation reuse between two users
- Typing indicators
- Online/offline presence
- Edit and delete messages
- Message reactions

### File Sharing

- Upload files directly inside messages
- Cloudinary storage
- Image previews
- PDF previews
- Downloadable document/file cards
- Supported file types include:
  - Images
  - PDF
  - TXT
  - DOC / DOCX
  - XLS / XLSX
- File-size validation

### Notifications

- Real-time channel message notifications
- Real-time direct message notifications
- Unread notification badge
- Channel-specific unread counts
- Conversation-specific unread counts
- Mark individual conversations/channels as read
- Mark all notifications as read
- Notification click navigation

### Search

Global workspace search across:

- Channel messages
- Direct messages
- Tasks

Search results navigate directly to the appropriate application section.

### Task Management

- Create workspace tasks
- Assign tasks to workspace members
- Todo, In Progress, and Done states
- Low, Medium, and High priorities
- Due dates
- Overdue task indicators
- Kanban-style task board
- Role-aware task editing and deletion

### Dashboard

- Workspace overview
- Member count
- Channel count
- Open task count
- Unread activity count
- Recent activity
- Quick navigation
- Workspace management

### Responsive UI

- Desktop layout
- Tablet support
- Mobile navigation drawer
- Responsive messaging layouts
- Horizontally scrollable mobile Kanban
- Responsive notification and search dropdowns

---

## Tech Stack

### Frontend

- React
- JavaScript
- Vite
- React Router
- Axios
- Socket.IO Client
- CSS

### Backend

- Node.js
- Express.js
- Socket.IO
- JSON Web Tokens
- bcryptjs
- Multer

### Database

- MongoDB
- Mongoose

### Cloud Services

- MongoDB Atlas
- Cloudinary
- Render
- Vercel

---

## Architecture

```text
TeamSpace
│
├── client
│   ├── src
│   │   ├── components
│   │   ├── context
│   │   ├── pages
│   │   ├── services
│   │   └── socket
│   │
│   └── public
│
└── server
    ├── config
    ├── controllers
    ├── middleware
    ├── models
    ├── routes
    ├── services
    └── server.js
```

The frontend uses React Context for application state while REST APIs handle persistent CRUD operations.

Socket.IO handles real-time functionality including:

- Channel messaging
- Direct messaging
- Notifications
- Typing indicators
- Presence
- Message edits
- Message deletion
- Reactions

The backend validates Socket.IO connections using JWT authentication and performs authorization before allowing users to access workspace channels or conversations.

---

## Application Routes

```text
/dashboard
/channels
/messages
/tasks
/login
/register
```

### Dashboard

Workspace overview, members, statistics, recent activity, and quick actions.

### Channels

Dedicated team-channel messaging interface.

### Messages

Dedicated direct-message interface.

### Tasks

Workspace task management and Kanban board.

---

## API Structure

The backend exposes APIs under:

```text
/api/auth
/api/workspaces
/api/channels
/api/messages
/api/conversations
/api/tasks
/api/uploads
/api/notifications
/api/search
```

---

## Environment Variables

### Server

Create:

```text
server/.env
```

Example:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_jwt_secret

CLIENT_URL=http://localhost:5173

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

Never commit your real `.env` file.

---

### Client

Create:

```text
client/.env
```

Example:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

For production these variables should point to the deployed backend.

---

## Local Development

Clone the repository:

```bash
git clone https://github.com/hassaan9908/teamspace.git
```

Enter the project:

```bash
cd teamspace
```

### Install Backend Dependencies

```bash
cd server
npm install
```

Create the server `.env` file and then start the backend:

```bash
npm run dev
```

The backend runs locally on:

```text
http://localhost:5000
```

---

### Install Frontend Dependencies

Open another terminal:

```bash
cd client
npm install
```

Create the client `.env` file and run:

```bash
npm run dev
```

The frontend will normally run on:

```text
http://localhost:5173
```

Vite may choose another available port if `5173` is already being used.

If this happens, make sure the backend `CLIENT_URL` matches the frontend origin.

---

## Real-Time Authorization

Socket.IO connections are authenticated using the user's JWT.

The backend does not trust client-supplied user identities.

Before joining a private channel or conversation, the server checks that the authenticated user has permission to access the requested resource.

This prevents unauthorized users from joining private Socket.IO rooms.

---

## Roles and Permissions

Workspace members can have one of three roles:

```text
Owner
Admin
Member
```

Permissions are enforced server-side.

Examples include:

- Only authorized workspace roles can manage certain workspace resources.
- Private channel access is restricted to private-channel members.
- Conversation access is restricted to conversation participants.
- Task modification permissions depend on creator, assignee, and workspace role.

---

## Deployment

### Backend

Deployed using Render:

https://teamspace-10tn.onrender.com

### Frontend

Deployed using Vercel:

https://teamspace-kohl.vercel.app

### Database

MongoDB Atlas

### File Storage

Cloudinary

---

## Security Practices

The project includes:

- JWT authentication
- bcrypt password hashing
- Protected REST routes
- Socket.IO JWT authentication
- Workspace membership validation
- Private channel authorization
- Direct-message participant validation
- Server-side permission checks
- File type validation
- File size validation
- Environment-based secrets
- CORS configuration

---

## Future Improvements

Potential future enhancements include:

- Drag-and-drop Kanban tasks
- Group direct messages
- Message threads
- Voice/video meetings
- Pinned messages
- User profile images
- Workspace invitations by email
- Message pagination
- Infinite scrolling
- Automated end-to-end testing
- Component documentation/testing

---

## Author

**Muhammad Hassaan**

Software Engineer / Full-Stack Developer

GitHub:  
https://github.com/hassaan9908

---

## License

This project was created as a portfolio and learning project.