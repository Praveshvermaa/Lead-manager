# Lead Manager — Backend

Express + MongoDB REST API for the Lead Manager application. Handles authentication via `httpOnly` JWT cookies and exposes a leads CRUD API scoped to the authenticated user.

---

## Table of Contents

- [Running locally](#running-locally)
- [Project structure](#project-structure)
- [API reference](#api-reference)
- [Tech stack](#tech-stack)
- [How it works](#how-it-works)
- [Assumptions](#assumptions)
- [What I'd improve with more time](#what-id-improve-with-more-time)

---

## Running locally

### Prerequisites

- Node.js 18+
- MongoDB running locally on port `27017`, **or** a MongoDB Atlas connection string

### Steps

```bash
# from the repo root
cd server

# copy the example env file and fill in your values
cp .env.example .env

# install dependencies
npm install

# start the dev server (nodemon, restarts on file change)
npm run dev
```

The API will be available at **http://localhost:5000**.

### Environment variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `5000` | Port the server listens on |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/lead_manager` | MongoDB connection string |
| `CLIENT_URL` | `http://localhost:5173` | Allowed CORS origin (must match the frontend URL exactly) |
| `NODE_ENV` | `development` | `production` enables secure cookies and strict `sameSite` |
| `JWT_SECRET` | — | Long random string used to sign JWTs — **required** |
| `JWT_EXPIRES_IN` | `1d` | JWT lifetime, e.g. `1d`, `7d`, `2h` |

### Other scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start with nodemon (auto-restart on change) |
| `npm start` | Start with plain `node` (production) |

---

## Project structure

```
src/
├── config/
│   └── db.js                 # Mongoose connection
├── controllers/
│   ├── authController.js     # signup, login, logout, getMe
│   └── leadController.js     # createLead, getLeads, getLeadById, updateLead, deleteLead
├── middleware/
│   ├── authMiddleware.js     # Verifies JWT cookie, attaches req.user
│   └── errorMiddleware.js    # Global error handler
├── models/
│   ├── Lead.js               # Lead schema + indexes
│   └── User.js               # User schema
├── routes/
│   ├── authRoutes.js         # /api/auth/*
│   ├── healthRoutes.js       # /api/health
│   └── leadRoutes.js         # /api/leads/* (all protected)
├── app.js                    # Express app setup (middleware + routes)
└── server.js                 # DB connect + server listen
```

---

## API reference

All endpoints return JSON in the shape:

```json
{ "success": true|false, "message": "...", "data": {} }
```

### Auth — `/api/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/signup` | ✗ | Create account; sets JWT cookie |
| `POST` | `/login` | ✗ | Login; sets JWT cookie |
| `POST` | `/logout` | ✓ | Clears JWT cookie |
| `GET` | `/me` | ✓ | Returns the current user object |

**Signup / Login body**

```json
// POST /signup
{ "name": "Alice", "email": "alice@example.com", "password": "secret123" }

// POST /login
{ "email": "alice@example.com", "password": "secret123" }
```

### Leads — `/api/leads` *(all require auth)*

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | List leads for the current user. Supports `?search=` (name) and `?status=` filters |
| `POST` | `/` | Create a new lead |
| `GET` | `/:id` | Get a single lead by ID |
| `PUT` | `/:id` | Update a lead (any field) |
| `DELETE` | `/:id` | Delete a lead |

**Lead fields**

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | String | ✓ | Max 100 chars |
| `email` | String | ✓ | Validated format, stored lowercase |
| `phone` | String | ✓ | Max 20 chars, international format allowed |
| `company` | String | ✓ | Max 100 chars |
| `source` | String | ✓ | Enum: `Website`, `Referral`, `LinkedIn`, `Cold Call`, `Other` |
| `status` | String | — | Enum: `New`, `Contacted`, `Qualified`, `Lost`. Default: `New` |

### Health — `/api/health`

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Returns `200 OK` — useful for uptime checks |

---

## Tech stack

| Tool | Version | Why |
|---|---|---|
| **Node.js + Express** | 5 | Minimal, well-understood REST framework; Express 5 ships async error handling without `try/catch` wrappers |
| **MongoDB + Mongoose** | 9 | Document model suits a schema that may grow new fields; Mongoose adds schema-level validation and compound indexes with minimal boilerplate |
| **jsonwebtoken** | 9 | Stateless auth; signing and verifying JWTs is straightforward and dependency-light |
| **bcryptjs** | 3 | bcrypt in pure JS — no native build step required; cost factor `12` balances security and latency |
| **cookie-parser** | 1 | Parses the JWT from the `Cookie` header so `req.cookies.token` is always available |
| **cors** | 2 | Locks allowed origins to `CLIENT_URL`; `credentials: true` required for cookie-based auth |
| **Zod** | 4 | Runtime schema validation for lead input — precise error messages without manual type-checking |
| **dotenv** | 18 | Loads `.env` into `process.env` in development; production typically injects env vars at the platform level |
| **nodemon** | 3 | Dev-only: restarts the server on file changes |

---

## How it works

### Authentication flow

1. `POST /api/auth/signup` or `/login` hashes the password with bcrypt, signs a JWT, and writes it to an `httpOnly` cookie (`secure: true` in production).
2. Every subsequent request sends the cookie automatically. `authMiddleware` reads `req.cookies.token`, verifies it with `jwt.verify`, then fetches the user from MongoDB and attaches `{ id, name, email }` to `req.user`.
3. `POST /api/auth/logout` calls `res.clearCookie()` with the same attributes — the browser drops the cookie.

### Lead data isolation

Every lead document stores a `user` field (ObjectId ref). `getLeads`, `updateLead`, and `deleteLead` always filter by `{ user: req.user.id, _id: ... }` — a user can never read or mutate another user's leads even if they guess a valid ObjectId.

### Indexes

```js
// Fast listing + status filter per user
leadSchema.index({ user: 1, status: 1, createdAt: -1 });

// Fast name search per user
leadSchema.index({ user: 1, name: 1 });
```

### Cookie security

| Attribute | Development | Production |
|---|---|---|
| `httpOnly` | ✓ | ✓ |
| `secure` | ✗ | ✓ (HTTPS only) |
| `sameSite` | `lax` | `none` (cross-origin needed for hosted frontends) |

---

## Assumptions

1. **One user, one dataset** — no roles, no admin, no sharing. Leads belong to exactly one user.
2. **No refresh tokens** — a single JWT expires after `JWT_EXPIRES_IN` (default 1 day). The user must log in again after expiry.
3. **Name-based search only** — `GET /api/leads?search=` does a case-insensitive regex match against `name`. Full-text search across all fields was not in scope.
4. **No pagination** — the endpoint returns all matching leads. Acceptable for small datasets; a production system needs pagination.
5. **bcrypt cost factor 12** — balances hashing time (~150 ms on modern hardware) with security. Could be raised for higher-value data.
6. **Same-origin in development** — `sameSite: lax` works because the frontend (`5173`) and backend (`5000`) share `localhost`. Cross-origin deployed environments need `sameSite: none` + HTTPS.
7. **Phone validation is format-only** — the regex accepts international formats but does not verify the number is reachable.

---

## What I'd improve with more time

### Security & Auth

- **Refresh tokens** — issue a short-lived access token (15 min) and a long-lived httpOnly refresh token (7 days) with rotation, so users stay logged in without storing a long-lived token in one cookie.
- **Rate limiting** — apply `express-rate-limit` to `/api/auth/login` and `/api/auth/signup` to prevent brute-force and credential-stuffing attacks.
- **Email verification** — send a verification link before activating a new account.
- **Password reset** — time-limited signed reset links delivered by email.

### API

- **Cursor-based pagination** — `GET /api/leads?cursor=<id>&limit=25` to handle large lead datasets efficiently.
- **Multi-field search** — MongoDB `$text` index across `name`, `email`, and `company` with a single query param.
- **Partial updates (PATCH)** — replace `PUT` with `PATCH` so callers only send changed fields.
- **Input validation with Zod on all routes** — auth routes currently use manual checks; unify with Zod schemas and a shared validation middleware.

### Code quality

- **Integration tests** — Vitest + Supertest tests for every route, using an in-memory MongoDB instance (`mongodb-memory-server`).
- **Structured logging** — replace `console.error` with a logger like `pino` for JSON logs that are searchable in production.
- **Request ID tracing** — attach a UUID to each request and include it in every log line to correlate errors across services.
- **Health check depth** — extend `/api/health` to report MongoDB connection state so load balancers can remove unhealthy instances.
