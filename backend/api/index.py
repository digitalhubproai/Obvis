"""
Vercel serverless handler — uses Mangum adapter to run FastAPI.
No external server needed; Vercel provides the lambda event.
"""
import sys
import os

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from mangum import Mangum
from app.config import settings

UPLOAD_DIR = "/tmp/obvis-uploads"


async def run_startup():
    """Separate DB init so it only runs on first invocation."""
    if not hasattr(run_startup, "done"):
        try:
            from app.database import init_db
            await init_db()
            run_startup.done = True
        except Exception:
            pass  # tables might already exist


@asynccontextmanager
async def lifespan(app: FastAPI):
    await run_startup()
    yield


_app = FastAPI(title="Obvis API", version="1.0.0", lifespan=lifespan)

_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

settings.upload_dir = UPLOAD_DIR

from app.auth.endpoints import router as auth_router  # noqa
from app.reports.endpoints import router as reports_router  # noqa
from app.chat.endpoints import router as chat_router  # noqa

_app.include_router(auth_router)
_app.include_router(reports_router)
_app.include_router(chat_router)


@_app.get("/health")
async def health():
    return {"status": "ok"}


handler = Mangum(_app)
