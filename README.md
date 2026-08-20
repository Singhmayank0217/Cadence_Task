# Cadence — Internal Task & Management Dashboard

**Built by Mayank Singh.**

A small internal tool for a team to create, assign, track and review work from one place.
Built as a full-stack application: **React + Vite + Tailwind** on the front, **Python + FastAPI + SQLAlchemy** on the back, **SQLite by default with PostgreSQL supported by changing one environment variable**.

Everything runs locally with two commands and ships with realistic seed data, so the dashboard is populated the moment it boots.

---

## Table of contents

1. [What's inside](#whats-inside)
2. [Tech stack](#tech-stack)
3. [Quick start](#quick-start)
4. [Sign-in accounts](#sign-in-accounts)
5. [Configuration](#configuration)
6. [Using PostgreSQL](#using-postgresql)
7. [API reference](#api-reference)
8. [External API integration](#external-api-integration)
9. [Database schema](#database-schema)
10. [Project structure](#project-structure)
11. [Reusable building blocks](#reusable-building-blocks)
12. [Design notes](#design-notes)
13. [Running the tests](#running-the-tests)
14. [Troubleshooting](#troubleshooting)
15. [Requirement checklist](#requirement-checklist)

---

## What's inside

**Dashboard** — total, pending, in progress, completed, blocked and overdue counts; a 14-day due-date load chart; per-member workload; your own queue; and the most recently updated tasks. Every number links through to the task list already filtered to exactly what it counts.

**Task management** — create, edit, delete, assign, re-prioritise, reschedule, change status, and add notes. Every change is written to an append-only activity trail so you can always see who moved what.

**Task list** — name, assignee, priority, status, due date, created date and last updated, with search, three filters, sorting and pagination. **All of it is resolved in the database**, not in the browser: the API only ever returns the page you asked for.

**Task detail** — full task information, inline status/priority/assignee controls, a notes thread, and the history feed.

**Team** — who's on the team, what they're carrying, and how much of it is late.

**Partner directory** — a live third-party REST API integration with timeouts, retries, caching and rate limiting, plus the ability to import an external contact as a team member.

---

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React 18 + Vite 5 | Fast dev server, minimal config |
| Styling | Tailwind CSS 3.4 | Design tokens live in `tailwind.config.js` |
| Routing | React Router 6 | Filters live in the URL, so views are shareable |
| Icons | lucide-react | One consistent icon set |
| Backend | FastAPI | Type-driven validation and free OpenAPI docs |
| ORM | SQLAlchemy 2.0 | Modern typed `Mapped[]` models |
| Database | SQLite / PostgreSQL | Zero-config locally, Postgres for real use |
| Auth | JWT (PyJWT) + PBKDF2 | No compiled crypto dependency to install |
| HTTP client | httpx | Timeouts and retries for outbound calls |
| Tests | pytest | 14 end-to-end API tests |
| Fonts | IBM Plex, self-hosted | No Google Fonts request; renders offline |

There are no compiled dependencies, so `pip install` works on Windows, macOS and Linux without build tools.

---

## Quick start

**Prerequisites:** Python 3.10+ and Node.js 18+.

### 1. Backend

```bash
cd backend

python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate

pip install -r requirements.txt
cp .env.example .env               # Windows: copy .env.example .env

uvicorn app.main:app --reload --port 8000
```

On first boot it creates the tables and seeds 8 team members and 30 tasks.

- API: <http://localhost:8000>
- Interactive docs: <http://localhost:8000/docs>
- Health check: <http://localhost:8000/health>

### 2. Frontend

In a **second terminal**:

```bash
cd frontend

npm install
cp .env.example .env               # Windows: copy .env.example .env

npm run dev
```

Open <http://localhost:5173>.

### One-command alternative

From the project root, `./start-dev.sh` boots both servers together (macOS/Linux).

---

## Sign-in accounts

All demo accounts use the password **`password123`**. The sign-in screen lists them and fills the form when you click one.

| Email | Role | Person |
|---|---|---|
| `mayank@cadence.dev` | Admin | Mayank Singh |
| `rahul@cadence.dev` | Manager | Rahul Verma |
| `janvi@cadence.dev` | Manager | Janvi Mehta |
| `aditi@cadence.dev` | Member | Aditi Rao |
| `karan@cadence.dev` | Member | Karan Malhotra |
| `simran@cadence.dev` | Member | Simran Kaur |
| `devansh@cadence.dev` | Member | Devansh Patel |
| `neha@cadence.dev` | Member | Neha Gupta |

Signing in as different people changes the "Your queue" panel and the `assignee=me` filter.

---

## Configuration

### Backend — `backend/.env`

| Variable | Default | What it does |
|---|---|---|
| `DATABASE_URL` | `sqlite:///./cadence.db` | Any SQLAlchemy URL |
| `SECRET_KEY` | dev placeholder | **Change this before deploying** |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `720` | Session length |
| `CORS_ORIGINS` | `http://localhost:5173,...` | Comma-separated allowed origins |
| `CORS_ALLOW_LOCALHOST` | `true` | Also accepts any loopback origin, whichever port Vite picks. Set `false` in production |
| `SEED_ON_STARTUP` | `true` | Seeds only when the database is empty |
| `DEFAULT_PASSWORD` | `password123` | Password given to seeded and imported users |
| `SQL_ECHO` | `false` | Log every SQL statement |
| `EXTERNAL_API_BASE_URL` | `https://jsonplaceholder.typicode.com` | Upstream directory |
| `EXTERNAL_API_KEY` | *(empty)* | Sent as `Authorization: Bearer …` when set |
| `EXTERNAL_API_TIMEOUT` | `8` | Seconds before an outbound call is abandoned |
| `EXTERNAL_API_RETRIES` | `2` | Retries on timeout/5xx, with exponential backoff |
| `EXTERNAL_API_CACHE_TTL` | `300` | Seconds an upstream response is reused |
| `EXTERNAL_API_RATE_LIMIT` | `30` | Maximum outbound calls per minute |

### Frontend — `frontend/.env`

| Variable | Default |
|---|---|
| `VITE_API_URL` | `http://localhost:8000/api` |

---

## Using PostgreSQL

1. Create the database:

```bash
createdb cadence
```

2. Point the backend at it in `backend/.env`:

```env
DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5432/cadence
```

3. Restart the server. Tables are created on startup; run `python -m app.db.seed` to load demo data.

`psycopg2-binary` is already in `requirements.txt`. Nothing else changes — no query in the codebase is SQLite-specific.

---

## API reference

Base URL: `http://localhost:8000/api`. Every endpoint except `POST /auth/login` needs an `Authorization: Bearer <token>` header.

### Auth

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/login` | Exchange email + password for a JWT |
| `GET` | `/auth/me` | The signed-in user |

### Tasks

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/tasks` | List with search, filters, sorting, pagination |
| `POST` | `/tasks` | Create — returns `201` |
| `GET` | `/tasks/{id}` | Detail, including comments and activity |
| `PUT` | `/tasks/{id}` | Update any subset of fields |
| `PATCH` | `/tasks/{id}/status` | Change only the status |
| `DELETE` | `/tasks/{id}` | Delete — returns `204` |
| `GET` | `/tasks/export.csv` | The current filtered view as a CSV download (max 1000 rows) |
| `GET` | `/tasks/{id}/comments` | Notes on a task |
| `POST` | `/tasks/{id}/comments` | Add a note — returns `201` |
| `DELETE` | `/tasks/{id}/comments/{commentId}` | Delete a note |

### Users, dashboard and integration

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/users` | Paginated team list with per-person task counts |
| `POST` | `/users` | Add a member — returns `201`, `409` on duplicate email |
| `GET` | `/users/me` | The signed-in user |
| `GET` | `/users/{id}` · `PUT` · `DELETE` | Single-member operations |
| `GET` | `/dashboard` | Every metric the dashboard renders, in one call |
| `GET` | `/external/users` | Contacts from the partner API (`?refresh=true` skips the cache) |
| `POST` | `/external/users/import` | Import a contact as a team member |
| `GET` | `/external/status` | Cache and rate-limit state |

### Query parameters on `/tasks`

| Parameter | Example | Notes |
|---|---|---|
| `search` | `?search=shopify` | Matches title **or** description, case-insensitive |
| `status` | `?status=in_progress` | Repeat or comma-separate: `?status=pending,blocked` |
| `priority` | `?priority=high,urgent` | Same syntax |
| `assignee` | `?assignee=12` | Also accepts `me` and `unassigned` |
| `overdue` | `?overdue=true` | Past due and not completed |
| `due_before` / `due_after` | `?due_before=2026-09-01T00:00:00Z` | ISO-8601 |
| `sort_by` | `?sort_by=due_date` | `created_at`, `updated_at`, `due_date`, `title`, `status`, `priority` |
| `sort_dir` | `?sort_dir=asc` | `asc` or `desc` |
| `page` / `limit` | `?page=1&limit=20` | `limit` capped at 100 |

Priority sorting uses real rank (urgent → low), not alphabetical order. Tasks with no due date always sort last.

### Response shapes

Every list endpoint returns the same envelope:

```json
{
  "items": [ { "id": 1, "title": "…", "reference": "TSK-0001", "is_overdue": false } ],
  "meta": { "page": 1, "limit": 20, "total": 30, "pages": 2, "has_next": true, "has_prev": false }
}
```

Every error returns the same envelope:

```json
{ "error": { "code": "not_found", "message": "Task 42 does not exist." } }
```

| Status | `code` | When |
|---|---|---|
| `400` | `bad_request` | Malformed request |
| `401` | `unauthorized` | Missing, invalid or expired token |
| `404` | `not_found` | Unknown id |
| `409` | `conflict` | Duplicate email |
| `422` | `validation_error` | Failed validation — `details` names the field |
| `429` | `rate_limited` | Outbound rate limit reached |
| `502` | `external_service_error` | The upstream API failed |
| `500` | `internal_error` | Unexpected — logged server-side, never leaked |

### Try it

```bash
# sign in
TOKEN=$(curl -s -X POST localhost:8000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"mayank@cadence.dev","password":"password123"}' | jq -r .access_token)

# filtered, sorted, paginated list
curl -s "localhost:8000/api/tasks?status=in_progress&priority=urgent&sort_by=due_date&sort_dir=asc&page=1&limit=5" \
  -H "Authorization: Bearer $TOKEN" | jq

# create
curl -s -X POST localhost:8000/api/tasks \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"title":"Wire up the billing export","priority":"high","assigned_to":3}' | jq
```

---

## External API integration

`GET /api/external/users` pulls contacts from a public REST API (JSONPlaceholder by default) and renders them on the **Partner directory** page. The browser never calls the third party directly — the backend owns the credentials and the failure handling.

Implemented in `backend/app/services/external_api_service.py`:

- **Timeouts** — an 8-second budget with a shorter connect timeout, so a slow upstream can't tie up a worker.
- **Retries with backoff** — up to two retries on timeouts and 5xx, with exponential delay. 4xx responses are *not* retried, because retrying our own bad request never helps.
- **Rate limiting** — a token bucket caps outbound calls at 30/minute; exceeding it returns `429` with a `retry_after` rather than hammering the partner.
- **Caching** — successful responses are cached for 5 minutes, so reloading the page doesn't spend quota. `?refresh=true` bypasses it, and the UI shows whether a response was fresh or cached.
- **API keys** — set `EXTERNAL_API_KEY` and it's sent as a bearer token. The default upstream needs no key.
- **Response processing** — upstream records are normalised into our own `ExternalUser` shape, and cross-checked against local emails so already-imported contacts are marked.
- **Error handling** — every failure mode becomes a `502` with a readable message. The directory page degrades to an explanatory empty state; the rest of the app is unaffected.

To point it somewhere else, change `EXTERNAL_API_BASE_URL` (the service reads both bare arrays and `{"users": [...]}` payloads, so `https://dummyjson.com` works too).

---

## Database schema

```
┌───────────────────────┐
│ users                 │
│───────────────────────│
│ id            PK      │
│ name                  │
│ email         UNIQUE  │
│ role          enum    │  admin | manager | member
│ job_title             │
│ avatar_url            │
│ hashed_password       │
│ is_active             │
│ source                │  internal | external_directory
│ created_at            │
└──────┬────────┬───────┘
       │        │
   assigned_to  │ created_by                    user_id
       │        │                                  │
┌──────▼────────▼───────┐   task_id   ┌─────────────▼─────────┐
│ tasks                 │◄────────────│ comments              │
│───────────────────────│             │───────────────────────│
│ id            PK      │             │ id            PK      │
│ title                 │             │ task_id       FK      │
│ description           │             │ user_id       FK      │
│ status        enum    │             │ comment               │
│ priority      enum    │             │ created_at            │
│ assigned_to   FK NULL │             └───────────────────────┘
│ created_by    FK NULL │
│ due_date              │   task_id   ┌───────────────────────┐
│ completed_at          │◄────────────│ activities            │
│ created_at            │             │───────────────────────│
│ updated_at            │             │ id            PK      │
└───────────────────────┘             │ task_id       FK      │
                                      │ user_id       FK NULL │
                                      │ action        enum    │
                                      │ field                 │
                                      │ old_value             │
                                      │ new_value             │
                                      │ created_at            │
                                      └───────────────────────┘
```

**Relationships and the reasoning behind them**

- `users 1—N tasks` via `assigned_to`, `ON DELETE SET NULL`. Removing someone must not delete the work they were holding — the tasks simply become unassigned.
- `users 1—N tasks` via `created_by`, also `SET NULL`, so authorship survives an account being removed.
- `tasks 1—N comments`, `ON DELETE CASCADE`. A note has no meaning without its task.
- `tasks 1—N activities`, `ON DELETE CASCADE`. The audit trail belongs to the task.
- `users 1—N comments`, `CASCADE`.

**Indexes:** `tasks.status`, `tasks.priority`, `tasks.due_date`, `tasks.assigned_to`, `tasks.title`, plus composites on `(status, priority)` and `(assigned_to, due_date)` — the exact shapes the list and dashboard queries filter on.

`updated_at` is maintained by the database (`onupdate`), not by application code, so it can't drift. `completed_at` is stamped by the service layer the moment a task moves to *completed*, and cleared if it moves back.

---

## Project structure

```
cadence/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── deps.py              # auth + pagination dependencies
│   │   │   └── v1/
│   │   │       ├── router.py        # mounts every route module
│   │   │       └── routes/          # auth, tasks, users, dashboard, external
│   │   ├── core/
│   │   │   ├── config.py            # env-driven settings
│   │   │   ├── database.py          # engine, session, Base
│   │   │   ├── security.py          # password hashing + JWT
│   │   │   ├── exceptions.py        # error types + handlers
│   │   │   └── logging.py
│   │   ├── models/                  # SQLAlchemy tables + enums
│   │   ├── schemas/                 # Pydantic request/response models
│   │   ├── repositories/            # every SQL query lives here
│   │   ├── services/                # business rules
│   │   ├── utils/                   # pagination, dates, cache, rate limit
│   │   ├── db/                      # init + seed
│   │   └── main.py                  # app factory, middleware, CORS
│   ├── tests/test_api.py
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                  # the reusable kit
│   │   │   ├── layout/              # AppShell, Sidebar, PageHeader, Brand
│   │   │   ├── dashboard/           # StatCard, WorkloadRail, DueTimeline…
│   │   │   └── tasks/               # TaskTable, TaskCard, TaskFormModal…
│   │   ├── pages/                   # one file per route
│   │   ├── services/                # apiClient + one module per resource
│   │   ├── hooks/                   # useAsync, useTaskQuery, useDebounce…
│   │   ├── context/                 # AuthContext, ToastContext
│   │   ├── lib/                     # constants, date, format helpers
│   │   ├── App.jsx                  # routes + auth guards
│   │   └── main.jsx
│   ├── tailwind.config.js           # design tokens
│   └── .env.example
│
├── start-dev.sh
└── README.md
```

The layering rule is one-directional: **routes → services → repositories → models**. Routes never write SQL, repositories never raise HTTP errors, and swapping the database would touch only the repository layer.

---

## Reusable building blocks

### Frontend components (`src/components/ui/`)

| Component | Notes |
|---|---|
| `Button` / `IconButton` | 6 variants, 3 sizes, built-in loading state |
| `Input` / `Textarea` | Optional leading icon, invalid state |
| `Select` | Native element, custom chevron — accessible and mobile-friendly |
| `Field` | Label + hint + error wrapper used by every form |
| `Modal` | Portal, focus trap, Escape to close, scroll lock |
| `ConfirmDialog` | The gate in front of every destructive action |
| `Table` | Config-driven columns, sortable headers, row click |
| `Pagination` | Page window with ellipses plus a page-size selector |
| `StatusBadge` / `PriorityBadge` | Read their vocabulary from `lib/constants.js` |
| `Avatar` / `AvatarLabel` | Falls back to initials when an image fails |
| `EmptyState` / `ErrorState` / `Skeleton` / `TableSkeleton` | Every async surface uses these three states |
| `Panel` / `PanelHeader` | The standard card frame |
| `SearchInput`, `DueDate`, `Badge` | Smaller shared primitives |

Import from one place: `import { Button, Modal, Table } from '@/components/ui'`.

### Frontend services and hooks

`apiClient.js` is the only file that knows about `fetch`. It handles the base URL, query strings, the bearer token, timeouts, unwrapping the error envelope, and broadcasting a session-expired event on `401`. Resource modules (`taskService`, `userService`, `dashboardService`, `externalService`, `authService`) sit on top of it.

`useAsync` gives every page identical `{data, error, loading, refetch}` semantics. `useTaskQuery` owns the entire task-list query — URL-synced filters, debounced search, page reset on filter change. `useDebounce` and `useDisclosure` cover the rest.

### Backend layers

`BaseRepository` provides generic `get/list/count/create/update/delete` typed to a model; `TaskRepository`, `UserRepository`, `CommentRepository` and `ActivityRepository` extend it. `TaskFilters` is a value object carrying every supported query parameter. `PageParams` / `build_page` produce the pagination envelope for every list endpoint. `TTLCache` and `TokenBucket` are generic enough for any future integration.

---

## Design notes

A few decisions worth calling out, since "looks like a real internal tool" was part of the brief:

- **The cadence strip** is the signature element. The fortnight ahead is drawn as a ruled score: one tick per open task, on the day it falls due, coloured by priority and stacked from a baseline. Where the week is heavy is something you *see* rather than calculate. Overdue work sits in a gutter to the left of the staff, because it is no longer on the schedule. Every column links into the task list filtered to that day.
- **A command palette on ⌘K / Ctrl-K.** Local command matching plus live task search against the same API the list page uses, with arrow-key navigation. `N` anywhere starts a new task. Internal tools live or die on how fast a regular user can move through them.
- **Priority is drawn as rank, not as another coloured pill.** Four ascending ticks read as a scale; two pills side by side in a table do not.
- **Due dates say what they mean** — "2 days late", "Due today" — instead of relying on colour alone, which fails for colour-blind users and in screenshots.
- **Filters live in the URL**, so a filtered view can be bookmarked, shared in Slack, or survive a refresh. Anything set from outside the filter bar (an overdue link, a single day from the strip) appears as a removable chip, so the list never silently hides rows.
- **One accent colour** — ultramarine — carries links, focus rings and active navigation. Vermilion is reserved strictly for work that is late or blocked, so a red mark always means the same thing.
- **IBM Plex Sans and Plex Mono, self-hosted.** Plex was commissioned for enterprise software, which is what this is. Every number, date, reference and count is set in mono with tabular figures, so columns of figures line up. Fonts ship with the bundle, so there is no Google Fonts request and the app renders correctly offline.
- **Avatars are generated locally** from initials with a deterministic colour, rather than fetched from an avatar service — one less third-party dependency in the critical path.
- Loading, empty and error states are components, not afterthoughts. Errors say what happened and offer the one action that fixes it; empty states invite the next step.
- Keyboard focus is visible everywhere, the layout works down to a phone, and `prefers-reduced-motion` is respected.

---

## Running the tests

```bash
cd backend
pytest -q
```

Ten end-to-end tests cover authentication, pagination, filtering and search, invalid filter values, the full task lifecycle (create → update → comment → delete), assignment validation, dashboard totals adding up, and duplicate-email conflicts. They run against a throwaway SQLite file and never touch your dev database.

The frontend production build is verified with:

```bash
cd frontend
npm run build
```

---

## Troubleshooting

**"Can't reach the API"** — the backend isn't running, or it's on a different port. Check <http://localhost:8000/health> and that `VITE_API_URL` in `frontend/.env` matches.

**CORS errors in the console** — add your frontend origin to `CORS_ORIGINS` in `backend/.env` and restart.

**Port already in use** — `uvicorn app.main:app --port 8001` and update `VITE_API_URL` to match, or `npm run dev -- --port 5174` and add that origin to `CORS_ORIGINS`.

**Want fresh demo data** — `cd backend && python -m app.db.seed --reset` drops and rebuilds every table.

**The partner directory shows an error** — that page depends on an external service. Check your internet connection, or point `EXTERNAL_API_BASE_URL` somewhere reachable. Nothing else in the app is affected.

**`pip install` fails on `psycopg2-binary`** — it's only needed for PostgreSQL. Delete that line from `requirements.txt` and reinstall.

---

## Requirement checklist

| # | Requirement | Where it lives |
|---|---|---|
| 1 | Dashboard with all six counts | `pages/DashboardPage.jsx` · `services/dashboard_service.py` |
| 2 | Create / edit / delete / assign / prioritise / due date / status / description / comments | `TaskFormModal.jsx` · `CommentThread.jsx` · `services/task_service.py` |
| 3 | Task list with all columns, search, three filters, sorting, pagination — server-side | `TasksPage.jsx` · `useTaskQuery.js` · `repositories/task_repository.py` |
| 4 | REST API with validation, status codes, error handling, pagination, filtering, search, DB integration | `app/api/v1/routes/` · `app/schemas/` · `core/exceptions.py` |
| 5 | Users, tasks, comments tables with considered relationships | `app/models/` |
| 6 | Reusable frontend components and separated backend layers | `components/ui/` · `repositories/` · `services/` |
| 7 | External API integration with keys, timeouts, retries, rate limits, error handling | `external_api_service.py` · `DirectoryPage.jsx` |
| 8 | Task detail page with inline updates, comments and history | `TaskDetailPage.jsx` · `ActivityFeed.jsx` |
| 9 | Clean, responsive UI with loading / empty / error states and delete confirmation | `components/ui/States.jsx` · `ConfirmDialog.jsx` |
| 10 | Clean project structure separating responsibilities | See [Project structure](#project-structure) |

Beyond the brief: a ⌘K command palette, CSV export of any filtered view, an append-only activity trail on every task, and self-hosted fonts so the app renders correctly with no network access.

---

## Keyboard shortcuts

| Key | Does |
|---|---|
| `⌘K` / `Ctrl-K` | Open the command palette — search tasks, jump to a page, run a filter |
| `N` | Start a new task from anywhere |
| `↑` `↓` | Move through palette results |
| `Enter` | Open the highlighted result |
| `Esc` | Close the palette or any open dialog |

---

Built by **Mayank Singh** with FastAPI, React and Tailwind. Run it, sign in as Mayank, and the dashboard is already full of work.
