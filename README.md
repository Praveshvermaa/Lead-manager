# Lead Manager

A full-stack web application to create, track, and manage sales leads — with per-user authentication so each user only sees their own data.

---

## Table of Contents

- [Running locally](#running-locally)
- [Tech stack](#tech-stack)
- [Assumptions](#assumptions)
- [What I'd improve with more time](#what-id-improve-with-more-time)

---

## Running locally

### Prerequisites

- **Node.js** 18+
- **MongoDB** running locally on the default port (`27017`), or a MongoDB Atlas connection string

### 1 — Clone the repo

```bash
git clone <repo-url>
cd lead-manager
```

### 2 — Set up the server

```bash
cd server
cp .env.example .env
```

Edit `server/.env` and fill in your values:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/lead_manager
CLIENT_URL=http://localhost:5173
NODE_ENV=development
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=1d
```

Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

The API will be available at `http://localhost:5000`.

### 3 — Set up the client

```bash
cd ../client
```

The client's `.env` already points to `http://localhost:5000/api`. If your server runs on a different port, update `client/.env` accordingly.

```bash
npm install
npm run dev
```

The app will open at `http://localhost:5173`.

---

## Tech stack

### Client

| Tool | Why |
|---|---|
| **React 19** | Component model suits a data-driven dashboard well; hooks keep state management simple without reaching for a global store |
| **Vite** | Fast dev server with instant HMR; trivial to configure |
| **Tailwind CSS v4** | Utility-first keeps styles co-located with markup; zero dead CSS in production |
| **React Router v7** | Declarative routing; `<ProtectedRoute>` wraps the dashboard cleanly |
| **Axios** | Interceptor-friendly HTTP client; easier to attach credentials globally than raw `fetch` |
| **Lucide React** | Consistent, tree-shakeable icon set that matches the minimal design |

### Server

| Tool | Why |
|---|---|
| **Node.js + Express 5** | Minimal, well-understood REST API layer |
| **MongoDB + Mongoose** | Document model fits a schema that may grow new fields; Mongoose adds validation and indexing with low ceremony |
| **JWT (httpOnly cookies)** | Stateless auth; storing the token in an httpOnly cookie avoids XSS exposure compared to `localStorage` |
| **bcryptjs** | Password hashing before storage |
| **cookie-parser** | Reads the JWT cookie on every request |

---

## Assumptions

1. **Single-tenant per account** — each user manages their own isolated set of leads. There is no sharing, team view, or admin role.
2. **Status is the only editable field** — leads are created once with all fields filled in; the only in-table edit is the status dropdown. Full editing was considered out of scope.
3. **No pagination** — the API returns all leads that match the current filters. This is acceptable for small datasets; a real deployment would need cursor-based pagination.
4. **Search is name-only** — the search box filters by lead name. Email, company, and phone are intentionally excluded to keep the query simple.
5. **Local MongoDB by default** — the `.env.example` targets `localhost:27017`. A production deployment would swap in a MongoDB Atlas URI.
6. **JWT expiry of 1 day** — sessions expire after 24 hours with no refresh token. Users are redirected to login when the cookie expires.
7. **Phone validation is permissive** — the regex allows international formats (`+91 9876543210`, `(123) 456-7890`) but does not verify the number is real or callable.

---

## What I'd improve with more time

### Features

- **Full lead editing** — a modal or inline edit to update name, email, company, source, etc., not just status.
- **Pagination or infinite scroll** — cursor-based pagination on the API and a "Load more" or page control on the client.
- **Multi-field search** — extend search to email and company using a MongoDB text index.
- **Lead detail view** — a dedicated page per lead with activity history (notes, call logs, follow-up dates).
- **Bulk actions** — select multiple leads to delete or change status at once.
- **CSV export** — download the current filtered view as a spreadsheet.

### Auth & Security

- **Refresh tokens** — issue a short-lived access token and a long-lived httpOnly refresh token so sessions can survive beyond 1 day without re-login.
- **Rate limiting** — apply `express-rate-limit` to auth endpoints to prevent brute-force attacks.
- **Email verification** — confirm the user's email address before activating their account.


