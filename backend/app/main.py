import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.api.routes import auth, grants, users, pipeline, applications, org, god_admin

app = FastAPI(title="GrantBD API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── API routes ────────────────────────────────────────────────────────────────
app.include_router(auth.router, prefix="/api")
app.include_router(grants.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(pipeline.router, prefix="/api")
app.include_router(applications.router, prefix="/api")
app.include_router(org.router, prefix="/api")
app.include_router(god_admin.router, prefix="/api")

# ── Serve React SPA (production only) ────────────────────────────────────────
_static_dir = os.path.join(os.path.dirname(__file__), "..", "static")
if os.path.isdir(_static_dir):
    app.mount("/assets", StaticFiles(directory=os.path.join(_static_dir, "assets")), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def spa(full_path: str):
        index = os.path.join(_static_dir, "index.html")
        return FileResponse(index)
