import asyncio
import asyncpg
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import exc as sa_exc
from sqlalchemy.pool import NullPool
from app.config import settings

# Neon serverless drops idle connections → use NullPool + fresh connection each time
engine = create_async_engine(
    settings.database_url,
    echo=False,
    poolclass=NullPool,
)

async_session = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


_RETRIABLE = (
    asyncpg.exceptions.InterfaceError,
    asyncpg.exceptions.ConnectionDoesNotExistError,
    asyncpg.exceptions.CannotConnectNowError,
    sa_exc.InterfaceError,
    sa_exc.OperationalError,
)


def _is_retriable(e: Exception) -> bool:
    if isinstance(e, _RETRIABLE):
        return True
    msg = str(e).lower()
    return "connection" in msg or "closed" in msg or "reset" in msg


async def get_db():
    """Yield a DB session. Retries once on connection errors (Neon cold start)."""
    last_exc = None
    for attempt in range(3):
        try:
            async with async_session() as session:
                yield session
                return
        except Exception as e:
            last_exc = e
            if attempt < 2 and _is_retriable(e):
                await asyncio.sleep(0.8 * (attempt + 1))
            else:
                raise
    raise last_exc  # type: ignore[misc]


async def init_db():
    for attempt in range(3):
        try:
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            return
        except Exception:
            if attempt < 2:
                await asyncio.sleep(1)
            else:
                raise
