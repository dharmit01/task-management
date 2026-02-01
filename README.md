# Task Management Application

A full-stack task management system built with Next.js 16, MongoDB, and ShadCN UI components. Features role-based access control for Admins and Members with task assignment, prioritization, and collaboration capabilities.

## Features

- **Role-Based Access Control**
  - Admin: Full access to create/manage members and tasks
  - Member: View and update assigned tasks

- **Task Management**
  - Create, assign, and prioritize tasks
  - Track tasks by status (ToDo, In-Progress, Blocked, In-Review, Completed)
  - Priority levels (Low, Medium, High, Critical)
  - Filter by today's tasks, overdue tasks, and high-priority items

- **Collaboration**
  - Task comments for team communication
  - Task assignment and tracking

- **Modern UI**
  - Clean, intuitive interface built with ShadCN components
  - Color-coded priorities and statuses
  - Responsive design

## Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **UI Components**: ShadCN UI
- **Styling**: Tailwind CSS
- **State Management**: React Context API

### Backend
- **API**: Next.js API Routes
- **Database**: MongoDB (with Mongoose)
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Zod

## Prerequisites

- Node.js 18+ and npm
- MongoDB (local installation or MongoDB Atlas account)

## Installation & Setup

### 1. Clone or Navigate to the Project

```bash
cd nextjs-16-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

The project includes a `.env.local` file. Update it with your MongoDB connection string:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/taskmanagement
# For MongoDB Atlas: mongodb+srv://<username>:<password>@cluster.mongodb.net/taskmanagement

# JWT Secret (use a strong random string in production)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Security Note**: Generate a secure JWT secret for production:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Set Up Database

#### Option A: Local MongoDB
Ensure MongoDB is running locally on port 27017.

#### Option B: MongoDB Atlas
1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Get your connection string
3. Update `MONGODB_URI` in `.env.local`

### 5. Seed Initial Admin User

```bash
npm run seed
```

This creates an admin account:
- **Email**: admin@taskmanager.com
- **Password**: admin123

⚠️ **Change this password after first login!**

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### First Login

1. Navigate to [http://localhost:3000](http://localhost:3000)
2. You'll be redirected to the login page
3. Use the admin credentials:
   - Email: `admin@taskmanager.com`
   - Password: `admin123`

### Admin Workflow

1. **Create Members**
   - Navigate to "Members" in the sidebar
   - Click "Add Member"
   - Fill in name, email, password, and role
   - Members can log in with these credentials

2. **Create Tasks**
   - Click "New Task" on the Dashboard or Tasks page
   - Fill in task details:
     - Title and description
     - Start and end dates
     - Task category
     - Priority level
     - Assign to a member
   - Submit to create

3. **Manage Tasks**
   - View all tasks across the organization
   - Update task statuses
   - Add comments for collaboration
   - Filter by various criteria

### Member Workflow

1. **Login** with credentials provided by Admin
2. **View Assigned Tasks** on the Dashboard
3. **Filter Tasks**:
   - Today's tasks
   - Overdue tasks
   - High-priority tasks
4. **Update Status** of assigned tasks
5. **Add Comments** for updates and communication

## Project Structure

```
nextjs-16-app/
├── app/
│   ├── api/                  # API routes
│   │   ├── auth/
│   │   │   └── login/        # Authentication endpoint
│   │   ├── users/            # User management endpoints
│   │   └── tasks/            # Task management endpoints
│   ├── dashboard/            # Dashboard pages
│   │   ├── members/          # Member management (Admin)
│   │   ├── tasks/            # Task pages
│   │   └── layout.tsx        # Dashboard layout with sidebar
│   ├── login/                # Login page
│   └── layout.tsx            # Root layout with AuthProvider
├── components/
│   └── ui/                   # ShadCN UI components
├── contexts/
│   └── AuthContext.tsx       # Authentication context
├── lib/
│   ├── auth.ts               # Authentication utilities & middleware
│   ├── api-client.ts         # API client with auth headers
│   ├── db.ts                 # MongoDB connection
│   └── utils.ts              # Utility functions
├── models/
│   ├── User.ts               # User model
│   ├── Task.ts               # Task model
│   └── Comment.ts            # Comment model
├── scripts/
│   └── seed.ts               # Database seeding script
└── .env.local                # Environment variables
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login

### Users (Admin only)
- `GET /api/users` - List all users
- `POST /api/users` - Create new user
- `GET /api/users/[id]` - Get user details
- `PATCH /api/users/[id]` - Update user
- `DELETE /api/users/[id]` - Delete user

### Tasks
- `GET /api/tasks` - List tasks (filtered by role)
- `POST /api/tasks` - Create task (Admin only)
- `GET /api/tasks/[id]` - Get task details
- `PATCH /api/tasks/[id]` - Update task
- `DELETE /api/tasks/[id]` - Delete task (Admin only)

### Comments
- `GET /api/tasks/[id]/comments` - Get task comments
- `POST /api/tasks/[id]/comments` - Add comment

## Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run ESLint
npm run seed     # Seed database with admin user
```

## Database Schema

### Users Collection
- name, email, password (hashed)
- role (Admin | Member)
- isActive
- timestamps

### Tasks Collection
- title, description
- startDate, endDate
- taskList (category)
- priority (Low | Medium | High | Critical)
- status (ToDo | In-Progress | Blocked | In-Review | Completed)
- assignedTo, createdBy (User references)
- timestamps

### Comments Collection
- taskId (Task reference)
- userId (User reference)
- commentText
- timestamps

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based authorization middleware
- Input validation with Zod
- Protected API routes

## Deployment

### MongoDB Atlas
1. Update `MONGODB_URI` to your Atlas connection string
2. Ensure IP whitelist includes your deployment platform

### Vercel / Other Platforms
1. Build the project: `npm run build`
2. Set environment variables
3. Deploy

## Future Enhancements

- File uploads
- Email notifications
- Task dependencies
- Advanced reporting & analytics
- Calendar view
- Mobile app

## License

MIT

## Support

For issues or questions, please create an issue in the repository.
