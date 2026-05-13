import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.core.config import settings
from app.api.routes import auth, grants, pipeline, users

app = FastAPI(
    title="GrantBD API",
    description="Bangladesh research grant aggregation platform",
    version="1.0.0",
    # Hide docs in production
    docs_url="/api/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── API routes (must be registered before static catch-all) ───────────────────
app.include_router(auth.router,     prefix="/api")
app.include_router(grants.router,   prefix="/api")
app.include_router(pipeline.router, prefix="/api")
app.include_router(users.router,    prefix="/api")


@app.get("/health")
def health():
    return {"status": "ok", "app": settings.APP_NAME}


# ── Serve React SPA (production) ──────────────────────────────────────────────
# In development the Vite dev server handles this.
# In production (Docker), the built frontend is copied to ./static/
STATIC_DIR = os.path.join(os.path.dirname(__file__), "..", "static")

if os.path.isdir(STATIC_DIR):
    # Serve /assets, /icons, etc. as static files
    app.mount("/assets", StaticFiles(directory=os.path.join(STATIC_DIR, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        """
        Catch-all: serve index.html for any route not matched by /api/*.
        React Router handles client-side routing from there.
        """
        index = os.path.join(STATIC_DIR, "index.html")
        return FileResponse(index)
