from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from app.services.chat_service import get_chat_response
import uuid

router = APIRouter()

class ChatRequest(BaseModel):
    session_id: Optional[str] = None
    message: str
    mode: str = "normal"  # normal, rag, search
    system_prompt: Optional[str] = None

class ChatResponse(BaseModel):
    session_id: str
    response: str

@router.post("/message", response_model=ChatResponse)
async def chat_message(request: ChatRequest):
    session_id = request.session_id or str(uuid.uuid4())
    
    try:
        response_text = await get_chat_response(
            session_id, 
            request.message, 
            request.mode, 
            request.system_prompt
        )
        return ChatResponse(
            session_id=session_id,
            response=response_text
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")
