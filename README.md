👋 The Task Management System
The Task Management System is a web-based application that facilitates the organization, tracking, and management of tasks and projects. It is designed to enhance productivity and collaboration among its users—students and administrators—by providing real-time updates, powerful filtering, and a responsive dark-themed interface.
✨ Core Features
1.	Two User Roles
  o	🧑‍💼 Administrator: Full control over projects, tasks, statistics, and global chat.
  o	🎓 Student: View and manage only assigned projects/tasks and participate in the chat.
3.	Authentication & Session
  o	🔐 Sign Up / Sign In with email/password.
  o	✅ Stay Signed In via HTTP-only JWT cookie for persistent sessions.
4.	Single-Page Application
  o	⚡ Client-side routing with Next.js App Router for lightning-fast page transitions.
5.	Dark Theme
  o	🌙 System-aware, toggleable dark mode for low-light usability.
6.	Administrator Dashboard
  o	📊 Dynamic Statistics: Live counts of tasks by status, project completion rates, and student engagement charts.
  o	📁 Project Management:
    	➕ Create new projects.
    	🔍 Search by name/description.
    	🔄 Sort by status.
    	📋 Click a project card to view detailed info and its related tasks.
  o	✅ Task Management:
    	Sort by Task ID, Status, Due Date, or Project.
    	➕ Add new tasks with assignment, deadlines, and status selection.
  o	💬 Global Chat:
    	Broadcast messages to all users.
    	“Time ago” timestamps (e.g., “5m ago,” “2h ago”).
7.	Student Interface
  o	📈 Personal Statistics reflecting their own tasks’ progress.
  o	🔍 Search & Sort projects and tasks, scoped to their assignments.
  o	💬 Chat with identical real-time features and timestamps.





🗄️ Database Design with Supabase
Table	Key Columns & Relations
users	id (PK), email, password_hash, role (ENUM), university_id, created_at
projects	id (PK), name, description, status (ENUM), created_at
tasks	id (PK), title, due_date, status (ENUM), assignee_id → users.id, project_id → projects.id
messages	id (PK), content, sender_id → users.id, created_at
Why Supabase?
•	✅ Managed PostgreSQL with row-level security
•	🔄 Real-time subscriptions out of the box
•	🔒 Built-in Auth with JWT support
•	⚙️ Instant REST & GraphQL API generators




