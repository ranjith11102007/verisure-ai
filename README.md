# VeriSure AI

**Intelligent Application Validation, Document Authentication & Regulatory Compliance Platform**

Evidence-led verification. Trusted regulatory decisions.

## Live Demo

| Component | URL |
| --- | --- |
| Web application | https://verisure-ai.vercel.app |
| API | https://verisure-backend-m1rb.onrender.com |
| API documentation | https://verisure-backend-m1rb.onrender.com/api/docs |
| Deployment status | [DEPLOYMENT_STATUS.md](DEPLOYMENT_STATUS.md) |

Register an applicant account from `/register` to walk the full workflow, or sign in
as the administrator to review submissions. See [Demo accounts](#demo-accounts).

## Overview

VeriSure AI is a platform for institutional application validation, document
authentication and regulatory compliance verification. It is built around three
properties that regulators care about:

1. **Evidence integrity** — every document is fingerprinted with SHA-256 and can be
   re-verified later to detect tampering.
2. **Deterministic compliance** — a versioned rule engine evaluates each application
   and records findings with an explicit disposition.
3. **Accountability** — every submission, verification, evidence request and decision
   is written to an append-only audit trail.

## Features

- **Authentication & RBAC** — registration, login, JWT sessions, and
  admin / reviewer / applicant scoping enforced on every protected endpoint.
- **Application lifecycle** — create, search, filter, paginate, submit, review,
  request more information, approve or reject, with full status history.
- **Document upload** — PDF/PNG/JPEG validation, SHA-256 fingerprinting, duplicate
  detection, and deletion only while an application is editable.
- **Document authentication** — recomputes the SHA-256 digest and compares it with the
  recorded fingerprint, reporting clearly when a file is no longer available instead of
  guessing.
- **Compliance rules engine** — seeded statutory rules, on-demand evaluation, findings
  with severity and history, plus reviewer dispositions.
- **Evidence requests** — reviewers request missing evidence; applicants respond in-app.
- **Audit history** — append-only log with entity, actor, action, timestamp and state.
- **Reports & analytics** — portfolio summary, status/category distributions, monthly
  volume and approval rate, all computed from the database.

## Tech Stack

### Frontend
- React 19 + TypeScript
- Vite 8
- Tailwind CSS 3
- React Router 7
- Axios

### Backend
- FastAPI + Pydantic v2
- SQLAlchemy 2.x
- PostgreSQL (via `psycopg2`) with an automatic **SQLite fallback**
- JWT authentication, bcrypt password hashing
- PyMuPDF / Pillow for document handling

### Infrastructure
- Neon (PostgreSQL), Render (API), Vercel (frontend)
- Docker Compose for local PostgreSQL
- Free and open-source dependencies only

## Architecture

```
frontend/  React SPA
   │  /api/*  (same-origin proxy via frontend/vercel.json)
   ▼
backend/   FastAPI
   │  SQLAlchemy
   ▼
PostgreSQL (Neon)  ──fallback──▶  SQLite (backend/verisure.db)
```

The Vercel deployment rewrites `/api/*` and `/uploads/*` to the Render backend, so no
build-time API URL is required and there are no cross-origin issues. Unknown paths are
rewritten to `index.html` so deep links survive a refresh.

## Local Development

### Prerequisites
- Node.js 18+
- Python 3.10+ (3.11 recommended)
- Optional: Docker for PostgreSQL, or just let the app use SQLite

### Backend

```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
# Linux/macOS: source venv/bin/activate
pip install -r requirements.txt

# Optional: point at PostgreSQL. If omitted, SQLite is used automatically.
export DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"
export ADMIN_PASSWORD="change-this-password"

uvicorn app.main:app --reload --port 8000
```

On startup the backend creates any missing tables and seeds the default compliance
rules and administrator account. There are no migration steps to run: the
`alembic/versions/` directory is intentionally empty, and `alembic upgrade head` is a
no-op. See `backend/create_tables.py` to create the schema explicitly.

API: http://localhost:8000 · Docs: http://localhost:8000/api/docs

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:5173

By default the frontend calls `/api/v1` on its own origin. For local development
against a separate backend, set `VITE_API_BASE_URL=http://127.0.0.1:8000`.

## Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Administrator | `admin@verisure.local` | value of `ADMIN_PASSWORD` (default `change-this-password`) |
| Applicant | register from `/register` | — |

If `ADMIN_PASSWORD` is set to a non-default value, the startup hook updates the
administrator password automatically, so it can be rotated without database access.

## Database behaviour

The backend prefers PostgreSQL and falls back to SQLite if `DATABASE_URL` is missing or
unreachable, so the service always starts. The fallback is logged loudly and reported by
`GET /api/health/db` (`"is_fallback": true`). SQLite data does not survive a redeploy.

```
GET /api/health          # liveness
GET /api/health/db       # active backend, table count, last connection error
```

## Testing

```bash
cd backend

# In-process API test (TestClient)
python smoke_test.py

# Live HTTP test against a running server; override the target with TEST_BASE
python live_test.py

# End-to-end browser test against a deployed site (needs Edge/Chrome started
# with --remote-debugging-port=9223, see browser_test.mjs for details)
node browser_test.mjs
```

Both suites exercise the complete workflow: registration, application creation,
document upload and verification, submission, compliance evaluation, evidence
requests and reviewer decisions.

## Project Structure

```
verisure/
├── frontend/                  # React + Vite + Tailwind SPA
│   ├── src/pages/             # Landing, dashboard, registry, detail, compliance, ...
│   ├── src/components/        # UI primitives and app shell
│   ├── src/lib/api.ts         # API client and formatting helpers
│   └── vercel.json            # API proxy + SPA fallback
├── backend/
│   ├── app/api/v1/endpoints/  # auth, applications, documents, compliance, ...
│   ├── app/models/            # SQLAlchemy models (dialect-agnostic)
│   ├── app/core/              # config, database, security
│   ├── smoke_test.py          # in-process test suite
│   ├── live_test.py           # live HTTP test suite
│   └── create_tables.py       # explicit schema creation
├── render.yaml                # Render blueprint
├── docker-compose.yml         # Local PostgreSQL
└── DEPLOYMENT_STATUS.md       # Live verification and remaining configuration
```

## Security Notes

- All uploaded files are stored outside the web root.
- SHA-256 hashing provides tamper evidence for documents.
- Server-side authorization is enforced on every protected endpoint; applicants cannot
  alter review outcomes, and document deletion is blocked after submission.
- Passwords are hashed with bcrypt; JWTs are used for sessions.
- CORS is restricted to configured origins plus Vercel deployment domains.
- No secrets are committed — configuration comes from environment variables.
- Critical actions are written to the audit log.

## Important Notes

- **No fake data** — the application starts empty; no sample records are presented as real.
- **Honest verification** — when a capability or file is unavailable, the UI says so
  rather than reporting a false success.
- **Human oversight** — compliance findings assist review; a person records the decision.
- **Free & open source** — no paid APIs are required for core functionality.

## Known Limitations

- Uploaded files are ephemeral on Render's free tier and may be lost on restart.
- OCR/deskew is disabled because Tesseract is not available on the free tier.
- The Render free instance sleeps after inactivity; the first request may take ~30–50 s.
- Email delivery is not configured; notifications are in-app only.

## License

Built for educational and evaluation purposes.
