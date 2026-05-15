# GrantBD

Bangladesh research grant aggregation platform.
Single-service monorepo: FastAPI backend + React frontend in one Docker container.

## Project Structure

```
grantbd/
├── backend/              FastAPI + SQLAlchemy
│   ├── app/
│   │   ├── api/routes/   auth, grants, pipeline, users
│   │   ├── models/       7 database tables
│   │   ├── services/     extraction, alert, reminder
│   │   └── core/         config, security, seed_admin
│   ├── alembic/          DB migrations
│   ├── start.sh          Container startup script
│   └── requirements.txt
├── frontend/             React + TypeScript + Tailwind
│   └── src/
│       ├── pages/        admin/, researcher/, public/, auth/
│       └── components/
├── Dockerfile
├── railway.toml
└── render.yaml
```

---

## Deploy to Render (step by step)

**The most common failure cause: DATABASE_URL not set before deploy.**
Follow this order exactly.

### 1. Create PostgreSQL database first
- Render dashboard → New → PostgreSQL
- Name: `grantbd-db`, Plan: Free
- Wait for it to show "Available"
- Copy the **Internal Database URL** (starts with `postgresql://`)

### 2. Create the web service
- New → Web Service → Connect your GitHub repo
- Runtime: **Docker** (Render reads the Dockerfile automatically)
- Do NOT click Deploy yet

### 3. Set environment variables
Go to Environment tab and add:

| Key | Value |
|---|---|
| `DATABASE_URL` | Paste the Internal Database URL from step 1 |
| `SECRET_KEY` | Any random 32-char string |
| `ADMIN_EMAIL` | Your admin login email |
| `ADMIN_PASSWORD` | Your admin login password |
| `ENVIRONMENT` | `production` |

Optional (add later):

| Key | Value |
|---|---|
| `ANTHROPIC_API_KEY` | From console.anthropic.com |
| `SENDGRID_API_KEY` | From sendgrid.com (free: 100 emails/day) |
| `SENDGRID_FROM_EMAIL` | Your verified sender address |

### 4. Deploy
Click **Save Changes** → **Manual Deploy**.

The startup script (`start.sh`) will:
1. Verify DATABASE_URL is set (exits with a clear error if not)
2. Wait up to 60s for the database to accept connections
3. Run Alembic migrations automatically
4. Create your admin account
5. Start the server

---

## Deploy to Railway (simpler)

1. Push repo to GitHub
2. Railway → New Project → Deploy from GitHub repo
3. Add **PostgreSQL** plugin (DATABASE_URL injected automatically)
4. Set env vars in the Railway dashboard:

| Key | Value |
|---|---|
| `SECRET_KEY` | Any random 32-char string |
| `ADMIN_EMAIL` | Your admin email |
| `ADMIN_PASSWORD` | Your admin password |
| `ANTHROPIC_API_KEY` | From console.anthropic.com |
| `ENVIRONMENT` | `production` |

Railway detects the Dockerfile and deploys automatically on every push.

---

## Local Development

```bash
# Terminal 1 — Backend
cd backend
cp .env.example .env        # fill in keys
pip install -r requirements.txt
createdb grantbd
alembic upgrade head
python -m app.core.seed_admin   # creates admin user from .env
uvicorn app.main:app --reload --port 8000

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev                 # Vite proxies /api → localhost:8000
```

Open http://localhost:5173

---

## Cron Jobs (deadline reminders + auto-expiry)

Add a second service on Railway or Render:
- **Command:** `python -m app.services.reminder_service`
- **Schedule:** `0 1 * * *` (1am UTC = 7am Bangladesh time)

This sends 7-day and 1-day deadline reminders to watchlisted researchers,
and marks past-deadline grants as "expired".

---

## Key API Endpoints

```
POST /api/auth/register          Register researcher
POST /api/auth/login             Login → JWT token
GET  /api/grants/public          Browse grants (no auth)
GET  /api/grants/stats/summary   Live platform stats
GET  /api/grants                 Browse with watchlist flags (auth)
POST /api/grants/{id}/watchlist  Toggle watchlist
GET  /api/grants/{id}/calendar   Download .ics calendar event
POST /api/pipeline/upload        Admin: upload PDF
GET  /api/pipeline/jobs/{id}     Poll job status
POST /api/pipeline/submit        Submit grant URL (researcher)
POST /api/grants/admin/create    Admin: manual grant entry
POST /api/grants/admin/{id}/action  Approve or reject grant
POST /api/users/me/change-password  Change password
GET  /api/health                 Health check
```
