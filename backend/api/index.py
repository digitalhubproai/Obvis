"""Vercel serverless handler for FastAPI."""
import sys
import os

# Add project root to path so app.* imports work
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.config import settings
from app.database import init_db
from app.auth.endpoints import router as auth_router
from app.reports.endpoints import router as reports_router
from app.chat.endpoints import router as chat_router

# Use /tmp for Vercel's ephemeral filesystem
UPLOAD_DIR = "/tmp/obvis-uploads"

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app: FastAPI = FastAPI(title="Obvis API", version="1.0.0", lifespan=lifespan)

# CORS - allow all on production
origins = [o.strip() for o in settings.allowed_origins.split(",") if o.strip()]
# Add common frontend URLs
if not origins:
    origins = ["http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if not any("localhost" in o for o in origins) else origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Override upload_dir for Vercel
settings.upload_dir = UPLOAD_DIR

# Routers
app.include_router(auth_router)
app.include_router(reports_router)
app.include_router(chat_router)

@app.get("/health")
async def health():
    return {"status": "ok"}
