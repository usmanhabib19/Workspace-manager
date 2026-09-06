# 🚀 Kinetic Workspace Manager

An enterprise-grade, full-stack Workspace & Kanban Task Management application engineered with **React 19**, **Redux Toolkit**, **Tailwind CSS v4**, **Node.js / Express**, and **MongoDB Atlas**. Features a granular Role-Based Access Control (RBAC) architecture with an **Owner Approval Workflow** for high-risk operations (Task Creation, Task Deletion, Bulk Actions, and Drag-and-Drop Column Moves).

---

## 📸 Overview & Live Demo

- **Frontend Deployment (Vercel):** [https://workspace-manager-nine.vercel.app](https://workspace-manager-nine.vercel.app)
- **Backend API (Vercel):** [https://server-six-tau-53.vercel.app](https://server-six-tau-53.vercel.app)

---

## 🌟 Key Features

### 1. 🛡️ Role-Based Access Control (RBAC)
- **Global Owner (`owner`)**:
  - Exclusive access determined by `OWNER_EMAIL` configured securely in `.env`.
  - Full permissions: Direct task creation, modification, deletion, column drag-and-drop, and approval/rejection of Admin requests.
- **Admin (`admin`)**:
  - Cannot directly add, delete, or move tasks without Owner oversight.
  - Submits **Approval Requests** to the Owner for any critical task actions.
- **Member (`member`)**:
  - Default role assigned to all newly registered users.
  - Standard workspace collaboration, status tracking, and subtask completion without destructive permissions.
- **Viewer (`viewer`)**:
  - Strictly read-only access. Dragging, editing, and comment submission are blocked.

### 2. ⚡ Interactive Kanban Board & Workspaces
- **Multi-Workspace & Multi-Project Navigation**: Organize projects with custom columns (Backlog, In Progress, In Review, Done, Blocked).
- **Role-Aware Drag-and-Drop**:
  - **Owner**: Instant column moves with undo/redo capability.
  - **Admin**: Moving a task initiates a `MOVE_TASK` approval request sent directly to the Owner.
  - **Member / Viewer**: Dragging is disabled.
- **Multi-View Interface**: Toggle seamlessly between **Kanban Board** and **List View**.
- **Bulk Action Toolbar**: Select multiple tasks for bulk status change, assignee updates, or bulk deletion (with Admin approval guard).
- **Subtasks & Checklist Progress**: Track checklist items and convert subtasks into full tasks.
- **Rich Task Modals**: Attachments, tags, priority badges (Low, Medium, High, Urgent), due dates, and comments with `@mention` triggers.
- **Search & Filter Engine**: Filter by Assignee, Priority, Status, Tag, and real-time title search.
- **Activity Stream**: Full chronological audit log for every task action.

### 3. 🔔 Real-Time Approval System
- Dedicated notification dropdown in the Header showing pending requests.
- Owner can **Accept** (instantly executing the action in MongoDB) or **Reject** pending requests with a single click.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 19 (Vite 8)
- **State Management:** Redux Toolkit (`@reduxjs/toolkit`, `react-redux`)
- **Styling:** Tailwind CSS v4 (`@tailwindcss/vite`)
- **Icons:** Lucide React
- **Routing:** React Router DOM v7
- **HTTP Client:** Axios

### Backend
- **Runtime:** Node.js & Express 5
- **Database:** MongoDB Atlas with Mongoose 9 ODM
- **Authentication:** JWT (JSON Web Tokens) & BcryptJS password hashing
- **Deployment:** Vercel Serverless Function & SPA routing

---

## 📁 Project Architecture

```
Workspace-manager/
├── Frontend/                      # Client-side React application
│   ├── src/
│   │   ├── components/            # Header, Sidebar, TaskDetailModal, BulkActionBar, etc.
│   │   ├── pages/
│   │   │   ├── Auth/              # Login.jsx, Register.jsx
│   │   │   └── Dashboard/         # KanbanView.jsx, ListView.jsx, KanbanBoard.jsx
│   │   ├── store/                 # Redux Slices (AuthSlice, TaskSlice, WorkspaceSlice, UiSlice)
│   │   └── index.css              # Tailwind v4 theme configurations
│   ├── .env                       # Frontend environment variables
│   ├── package.json
│   ├── vercel.json                # SPA rewrite rules
│   └── vite.config.js
│
├── Backend/                       # Express & MongoDB REST API
│   ├── middleware/                # authMiddleware.js (Role guards: protect, requireOwner, requireAdmin)
│   ├── models/                    # Mongoose schemas (User, Task, PendingRequest, Workspace, Project)
│   ├── routes/                    # API Routes (authRoutes, taskRoutes, pendingRequestRoutes)
│   ├── .env                       # Backend secrets & DB connection string
│   ├── server.js                  # Main server entrypoint
│   └── vercel.json                # Vercel Serverless configuration
│
├── package.json                   # Root monorepo scripts
├── vercel.json                    # Root build & rewrite configuration
└── README.md
```

---

## ⚙️ Environment Variables

### Backend (`Backend/.env`)
```env
PORT=5000
MONGO_URI="mongodb+srv://<username>:<password>@cluster0.mongodb.net/kanban_workspace?retryWrites=true&w=majority"
JWT_SECRET="your_jwt_super_secret_key"
OWNER_EMAIL="mu801710@gmail.com"
```

### Frontend (`Frontend/.env`)
```env
VITE_OWNER_EMAIL="mu801710@gmail.com"
VITE_API_URL="https://server-six-tau-53.vercel.app/api"
```

---

## 🚀 Local Development Setup

### 1. Clone the repository
```bash
git clone https://github.com/<your-username>/Workspace-manager.git
cd Workspace-manager
```

### 2. Setup & Run Backend
```bash
cd Backend
npm install
npm run dev
```
*Backend runs on `http://localhost:5000`*

### 3. Setup & Run Frontend
```bash
cd ../Frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173`*

---

## 📡 API Endpoints

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new user (Assigns `owner` if email matches `OWNER_EMAIL`, else `member`) | Public |
| `POST` | `/api/auth/login` | Login user & issue JWT token | Public |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | Authenticated |
| `GET` | `/api/auth/members` | Get workspace member directory | Authenticated |
| `PATCH`| `/api/auth/members/:id/role` | Update user role (`admin`, `member`, `viewer`) | Owner Only |

### 📋 Tasks (`/api/tasks`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/tasks` | Get all tasks (supports query filtering) | All Roles |
| `GET` | `/api/tasks/:id` | Get single task details | All Roles |
| `POST` | `/api/tasks` | Directly create a new task | Owner Only |
| `PUT` | `/api/tasks/:id` | Update task details | Owner / Admin |
| `DELETE`| `/api/tasks/:id` | Directly delete a task | Owner Only |
| `POST` | `/api/tasks/:id/comments` | Add comment to a task | Owner / Admin / Member |

### 📬 Approval Requests (`/api/requests`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/requests` | Submit `ADD_TASK`, `DELETE_TASK`, `BULK_DELETE_TASK`, or `MOVE_TASK` | Admin Only |
| `GET` | `/api/requests` | List approval requests | Owner (All) / Admin (Own) |
| `POST` | `/api/requests/:id/approve` | Approve request & execute DB action | Owner Only |
| `POST` | `/api/requests/:id/reject` | Reject request | Owner Only |

---

## 🚢 Deployment Guide (Vercel)

### Frontend Deployment
1. Connect repository on **Vercel**.
2. Set **Root Directory** to `Frontend`.
3. Add Environment Variables:
   - `VITE_API_URL`: `https://server-six-tau-53.vercel.app/api`
   - `VITE_OWNER_EMAIL`: `mu801710@gmail.com`
4. Deploy.

### Backend Deployment
1. Connect repository on **Vercel** as a separate project.
2. Set **Root Directory** to `Backend`.
3. Add Environment Variables (`MONGO_URI`, `JWT_SECRET`, `OWNER_EMAIL`).
4. Deploy.

---

## 📄 License
Distributed under the **ISC License**. Built with ❤️ for productive team collaboration.
