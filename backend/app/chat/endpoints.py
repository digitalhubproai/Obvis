from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from app.database import get_db
from app.models.user import User
from app.core.security import get_current_user
from app.services.openai_client import symptom_chat_response

router = APIRouter(prefix="/chat/symptom", tags=["chat"])

class ChatRequest(BaseModel):
    message: str

@router.post("", response_model=dict)
async def symptom_chat(
    data: ChatRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        response = await symptom_chat_response(data.message)
        return response
    except Exception as e:
        raise HTTPException(500, f"Chat error: {str(e)}")