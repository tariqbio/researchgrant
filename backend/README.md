# GrantBD Backend

Bangladesh research grant aggregation platform — FastAPI + PostgreSQL backend.

## Project structure

```
grantbd/
├── app/
│   ├── api/routes/         # HTTP endpoints
│   │   ├── auth.py         # register, login
│   │   ├── grants.py       # search, detail, watchlist, admin review
│   │   ├── pipeline.py     # PDF upload, OCR, AI extraction, submissions
│   │   └── users.py        # profile management
│   ├── core/
│   │   ├── config.py       # settings (env vars)
│   │   └── security.py     # JWT, password hashing
│   ├── db/
│   │   └── session.py      # SQLAlchemy engine + session
│   ├── models/             # SQLAlchemy ORM models
│   │   ├── user.py
│   │   ├── grant.py
│   │   └── pipeline.py     # Source, IngestionJob, Watchlist, AlertLog
│   ├── schemas/            # Pydantic request/response schemas
│   │   ├── user.py
│   │   ├── grant.py
│   │   └── pipeline.py
│   ├── services/           # Business logic
│   │   ├── grant_service.py      # search, filter, matching
│   │   ├── extraction_service.py # Claude API extraction prompt
│   │   └── alert_service.py      # email alert matching + sending
│   └── main.py             # FastAPI app entry point
├── requirements.txt
├── .env.example
└── README.md
```

## Setup

### 1. PostgreSQL
```bash
createdb grantbd
```

### 2. Environment
```bash
cp .env.example .env
# Edit .env with your API keys and database URL
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Run database migrations
```bash
alembic init alembic
alembic revision --autogenerate -m "initial"
alembic upgrade head
```

### 5. Start the server
```bash
uvicorn app.main:app --reload --port 8000
```

API docs available at: http://localhost:8000/docs

## Key API endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create researcher account |
| POST | `/api/auth/login` | Get JWT token |
| GET | `/api/grants` | Search + filter grants (authenticated) |
| GET | `/api/grants/public` | Browse grants (no auth) |
| GET | `/api/grants/{id}` | Grant detail |
| POST | `/api/grants/{id}/watchlist` | Toggle watchlist |
| GET | `/api/grants/me/watchlist` | My saved grants |
| PATCH | `/api/users/me` | Update profile + research interests |
| POST | `/api/pipeline/upload` | Admin: upload PDF |
| GET | `/api/grants/admin/queue` | Admin: pending review queue |
| POST | `/api/grants/admin/{id}/action` | Admin: approve or reject |
| POST | `/api/pipeline/submit` | Submit a grant URL (community) |

## The AI pipeline

When a PDF is uploaded:
1. Saved to storage → IngestionJob created (status: `pending_ocr`)
2. OCR runs via Google Vision API → raw Bengali+English text extracted
3. Claude API reads text → structured JSON output (title, deadline, funding, research areas)
4. IngestionJob → `pending_review`, draft Grant created
5. Admin reviews in dashboard → approves with optional edits
6. Grant published → alert engine matches users → emails sent via SendGrid

The extraction prompt lives in `app/services/extraction_service.py`.
This is the most important thing to tune as you ingest more grants.
