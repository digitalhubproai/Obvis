"""
Vercel serverless handler for FastAPI via Mangum.
Must export 'handler' at top level.
"""
import sys
import os

# Add project root so `app.*` imports resolve
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
from app.config import settings

settings.upload_dir = "/tmp/obvis-uploads"

app = FastAPI(title="Obvis API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

try:
    from app.auth.endpoints import router as auth_router
    from app.reports.endpoints import router as reports_router
    from app.chat.endpoints import router as chat_router

    app.include_router(auth_router)
    app.include_router(reports_router)
    app.include_router(chat_router)
except Exception:
    pass  # skip router errors

try:
    from app.database import init_db
except Exception:
    pass


@app.on_event("startup")
async def startup():
    try:
        await init_db()
    except Exception:
        pass


@app.get("/health")
async def health():
    return {"status": "ok"}


handler = Mangum(app)
