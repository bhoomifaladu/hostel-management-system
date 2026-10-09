# HostelHub — Hostel Management System

React + Vite frontend, Node.js/Express REST API, MySQL.

## Setup
1. **Database** — import `database/hostel.sql` (MySQL Workbench / phpMyAdmin). If you already imported the old version, import it again: it only adds the new tables (`users`, `visitors`, `mess_menu`, `leave_requests`) and sample rows.
2. **Backend** — `cd backend`, copy `.env.example` to `.env` (set DB password and a long random `JWT_SECRET`), then `npm install && npm run dev`. API: http://localhost:5000/api/health
3. **Frontend** — `cd frontend && npm install && npm run dev`, open http://localhost:5173

**First login:** `admin@hostel.com` / `admin123` (created automatically on first backend start; set `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env` before then, and change the password).

## API routes
All routes except `/api/health` and `/api/auth/login` need `Authorization: Bearer <token>`.

| Module | Routes |
|---|---|
| Auth | `POST /api/auth/login` · `GET /api/auth/me` · `POST /api/auth/change-password` |
| Dashboard | `GET /api/dashboard` |
| Students | `GET /api/students?search=&status=` · `GET /:id` · `POST` · `PUT /:id` · `DELETE /:id` |
| Rooms | `GET /api/rooms` · `GET /:id` (with residents) · `POST` · `PUT /:id` · `DELETE /:id` |
| Fees | `GET /api/fees?status=&studentId=` · `POST` · `PUT /:id` · `POST /:id/payments` · `DELETE /:id` |
| Attendance | `GET /api/attendance?date=` · `POST` (bulk save) · `GET /summary?month=YYYY-MM` |
| Complaints | `GET /api/complaints?status=` · `POST` · `PATCH /:id` (status) · `DELETE /:id` |
| Visitors | `GET /api/visitors?inside=true` · `POST` (check-in) · `PATCH /:id/checkout` · `DELETE /:id` |
| Mess | `GET /api/mess` · `PUT` (set one day+meal) · `DELETE /:id` |
| Leaves | `GET /api/leaves?status=` · `POST` · `PATCH /:id` (Approved/Rejected) · `DELETE /:id` |
| Staff | `GET /api/staff` · `POST` · `PUT /:id` · `DELETE /:id` |
| Reports | `GET /api/reports/summary` · `GET /api/reports/fees.csv` |

Room occupancy is kept in sync automatically when students are added, moved, made inactive or deleted.

## Frontend layout
- `src/App.jsx` — routes (login screen when signed out)
- `src/components/Layout.jsx` — sidebar, top bar, search, user menu, mobile drawer
- `src/components/ui.jsx` — shared Table, Modal, FormModal, Stat, Status badges, data-loading hook
- `src/pages/` — Login, Dashboard, Students, Rooms, Fees, Attendance, Complaints, Visitors, Mess, Leaves, Staff, Reports
- `src/api.js` — one client function per API route; `src/auth.jsx` — login state

## Notes
- No payment gateway: fees are recorded manually via "Record payment".
- Everything logged in is currently full-access (roles are stored but not yet enforced per route).
