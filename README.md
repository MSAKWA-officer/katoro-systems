# Student Records System

A records-management system for a single school (secondary/primary), built
with Node.js/Express (backend) and React (frontend). It covers students,
classes/streams, subjects, teachers, exams and results, attendance, class
enrollments, results reports and result slips, and user accounts (including
student self-service logins).

## Project Structure

```
student-records-system/
├── backend/          # Express API + MySQL (Sequelize ORM)
│   └── src/
│       ├── config/       # Database connection
│       ├── models/       # Sequelize models (Student, Result, Attendance, ...)
│       ├── controllers/  # Business logic
│       ├── routes/       # API endpoints
│       ├── middleware/   # Auth (JWT)
│       └── utils/        # Seed scripts, helpers
│   └── db-fix/       # One-time SQL scripts for schema fix-ups (see its own README)
└── frontend/         # React (Vite) + React Router
    └── src/
        ├── api/          # Axios client
        ├── context/      # Auth state
        ├── pages/        # Login, Dashboard shell
        ├── features/     # Students, Classes, Results, Attendance, Reports, Users, ...
        └── components/
```

## Getting Started

### 1. Database (MySQL)

Make sure MySQL is installed (or use Docker/XAMPP/Laragon), then create the
database:






`npm run dev` only creates tables that don't exist yet — it never alters an
existing table. If you change a model later (new column, new constraint,
etc.), apply that change to your database yourself; see `backend/db-fix/`
for examples and a ready-made script for the student-login feature's schema.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

.

## Features

-