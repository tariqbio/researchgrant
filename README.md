# GrantBD — Bangladesh Research Grant Aggregation Platform

Single-service monorepo: FastAPI backend + React frontend in one container.

## Structure

```
grantbd/
├── backend/
│   ├── app/
│   │   ├── api/routes/      auth, grants, pipeline, users
│   │   ├── models/          SQLAlchemy (7 tables)
│   │   ├── services/        extraction, alert, reminder, expiry, daily_jobs
│   │   └── core/            config, security, seed_admin
│   ├── alembic/             DB migrations
│   └── requirements.txt
├── frontend/                React + TypeScript + Tailwind
├── Dockerfile               Multi-stage: Node build → Python runtime
├── railway.toml
└── render.yaml
```

## Local Development

```bash
# Backend
cd backend && cp .env.example .env   # fill in keys
pip install -r requirements.txt
createdb grantbd
alembic upgrade head
python -m app.core.seed_admin        # creates first admin user
uvicorn app.main:app --reload --port 8000

# Frontend (new terminal)
cd frontend && npm install && npm run dev
```

## Deploy to Railway (recommended)

1. Push to GitHub
2. Railway → New Project → Deploy from GitHub
3. Add **PostgreSQL** plugin (DATABASE_URL auto-injected)
4. Set these env vars in the Railway dashboard:

| Variable | Value |
|---|---|
| `SECRET_KEY` | Any random 32-char string |
| `ANTHROPIC_API_KEY` | console.anthropic.com |
| `SENDGRID_API_KEY` | sendgrid.com (free: 100/day) |
| `SENDGRID_FROM_EMAIL` | Your verified sender email |
| `ADMIN_EMAIL` | Your admin login email |
| `ADMIN_PASSWORD` | Strong password |
| `ENVIRONMENT` | `production` |

5. After first successful deploy, run the admin seed **once**:
   - Railway dashboard → your service → **Shell** tab
   - Run: `python -m app.core.seed_admin`
   - You can now log in at `/login` with your ADMIN_EMAIL + ADMIN_PASSWORD

## Deploy to Render

Same steps — Render reads `render.yaml` automatically.
Add a PostgreSQL database and set the same env vars above.

## Daily Cron Jobs (deadline reminders + expiry)

On Railway, add a **Cron Job** service (same repo):
- **Command:** `python -m app.services.daily_jobs`
- **Schedule:** `0 1 * * *`  ← 1am UTC = 7am Bangladesh time

This does three things every morning:
1. Marks grants past their deadline as "expired"
2. Sends 7-day deadline reminder emails to watchlisted researchers
3. Sends 1-day deadline reminder emails

## Key API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /api/auth/register | — | Register |
| POST | /api/auth/login | — | Login → JWT |
| GET | /api/grants/public | — | Browse (no auth) |
| GET | /api/grants | JWT | Browse with watchlist |
| GET | /api/grants/me/watchlist | JWT | My saved grants |
| POST | /api/grants/{id}/watchlist | JWT | Toggle watchlist |
| GET | /api/grants/{id}/calendar.ics | — | Download .ics deadline |
| POST | /api/pipeline/upload | Admin | Upload PDF |
| GET | /api/pipeline/jobs/{id} | Admin | Poll job status |
| POST | /api/grants/admin/create | Admin | Manual grant entry |
| POST | /api/grants/admin/{id}/action | Admin | Approve/reject |
| POST | /api/pipeline/submit | JWT | Submit grant URL |
| GET | /health | — | Health check |
