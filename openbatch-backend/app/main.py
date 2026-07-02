"""OpenBatch FastAPI application entrypoint.

Run locally with:

    uvicorn app.main:app --reload --port 8000
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import project, projects, scaleup, simulate

app = FastAPI(title="OpenBatch API", version="1.0")

# The Vite dev server runs on port 5173 and proxies /api + /ws to this service.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(projects.router)
app.include_router(project.router)
app.include_router(simulate.router)
app.include_router(scaleup.router)


@app.get("/api/health")
def health() -> dict[str, str]:
    """Lightweight health check the frontend dev proxy can hit."""
    return {"status": "ok", "service": "openbatch", "version": "1.0"}
