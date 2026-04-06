from __future__ import annotations
from sqlalchemy import String, Text, DateTime, Boolean, func, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
import uuid, datetime
from app.database import Base

class Report(Base):
    __tablename__ = "reports"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), unique=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"))
    file_name: Mapped[str] = mapped_column(String(255))
    original_name: Mapped[str] = mapped_column(String(255))
    file_type: Mapped[str] = mapped_column(String(50))
    file_size: Mapped[int] = mapped_column()
    status: Mapped[str] = mapped_column(String(20), default="pending")
    analysis_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    analysis_data: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
