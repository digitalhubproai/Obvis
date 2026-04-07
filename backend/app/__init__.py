from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.config import settings
from app.database import init_db
from app.auth.endpoints import router as auth_router
from app.reports.endpoints import router as reports_router
from app.chat.endpoints import router as chat_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(title="Obvis API", version="1.0.0", lifespan=lifespan)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://0.0.0.0:3000",
        "https://obvis-yyes.vercel.app",
        "https://creativesar-obvisback.hf.space",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Routers
app.include_router(auth_router)
app.include_router(reports_router)
app.include_router(chat_router)

@app.get("/health")
async def health():
    return {"status": "ok"}
