from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from . import config
from .database import SessionLocal, init_db
from .routers import auth, stats, tasks, teams


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="DevOps Study Planner API",
    version="1.0.0",
    description="Team-based study planner for DevOps topics: register, create teams, "
    "manage a Trello-like board of tasks and track progress towards certifications.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(teams.router, prefix="/api")
app.include_router(tasks.router, prefix="/api")
app.include_router(stats.router, prefix="/api")


@app.get("/", tags=["System"])
def root():
    return {"name": "DevOps Study Planner API", "docs": "/docs", "health": "/health"}


@app.get("/health", tags=["System"])
def health():
    """Liveness + database connectivity check (used by Docker HEALTHCHECK)."""
    with SessionLocal() as db:
        db.execute(text("SELECT 1"))
    return {"status": "ok", "database": "up"}
