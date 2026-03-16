from fastapi import APIRouter, UploadFile, File, Depends
from ..services.document_service import document_service
from ..services.auth_service import get_current_user
from ..models import User

router = APIRouter()

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user)
):
    content = await file.read()
    path = await document_service.upload_document(file.filename, content, len(content))
    
    # Trigger async indexing
    # from ..workers.celery_app import index_document_task
    # index_document_task.delay(path)
    
    return {"status": "uploaded", "path": path, "filename": file.filename}

@router.get("/")
async def list_documents(user: User = Depends(get_current_user)):
    return {"documents": []}
