from fastapi import APIRouter, UploadFile, File, HTTPException
import shutil
import os
from app.core.config import settings
from app.services.document_service import process_document
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()

class DocumentInfo(BaseModel):
    filename: str
    size: int
    created_at: float

@router.get("/", response_model=List[DocumentInfo])
async def list_documents():
    if not os.path.exists(settings.UPLOAD_DIRECTORY):
        return []
    
    files = []
    for filename in os.listdir(settings.UPLOAD_DIRECTORY):
        if filename.endswith(".pdf"):
            file_path = os.path.join(settings.UPLOAD_DIRECTORY, filename)
            stats = os.stat(file_path)
            files.append(DocumentInfo(
                filename=filename,
                size=stats.st_size,
                created_at=stats.st_ctime
            ))
    return sorted(files, key=lambda x: x.created_at, reverse=True)
async def upload_document(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    upload_path = os.path.join(settings.UPLOAD_DIRECTORY, file.filename)
    
    # Ensure directory exists
    os.makedirs(settings.UPLOAD_DIRECTORY, exist_ok=True)
    
    try:
        with open(upload_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not save file: {str(e)}")
        
    try:
        doc_id, chunk_count = await process_document(upload_path, file.filename)
        return DocumentResponse(
            id=doc_id,
            filename=file.filename,
            chunks=chunk_count,
            message="Document processed successfully"
        )
    except Exception as e:
        # In case of error, maybe clean up the file?
        # os.remove(upload_path)
        raise HTTPException(status_code=500, detail=f"Error processing document: {str(e)}")

class SearchRequest(BaseModel):
    query: str
    k: int = 4

class SearchResult(BaseModel):
    content: str
    metadata: dict
    score: float = 0.0

@router.post("/search", response_model=List[SearchResult])
async def search_documents(request: SearchRequest):
    from app.db.vector_store import get_vector_store
    try:
        vector_store = get_vector_store()
        
        # Similarity search
        # Note: Chroma score is distance, lower is better. 
        # But for UI consistency we might want similarity score.
        results = vector_store.similarity_search_with_score(request.query, k=request.k)
        
        search_results = []
        for doc, score in results:
            search_results.append(SearchResult(
                content=doc.page_content,
                metadata=doc.metadata,
                score=score
            ))
            
        return search_results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")
