import os
from minio import Minio
from ..config import settings

class DocumentService:
    def __init__(self):
        self.client = Minio(
            settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=False
        )
        self.bucket_name = settings.MINIO_BUCKET

    async def init_bucket(self):
        if not self.client.bucket_exists(self.bucket_name):
            self.client.make_bucket(self.bucket_name)

    async def upload_document(self, filename: str, content: bytes, size: int):
        object_name = f"docs/{os.urandom(8).hex()}_{filename}"
        from io import BytesIO
        self.client.put_object(
            self.bucket_name,
            object_name,
            BytesIO(content),
            size
        )
        return object_name

    async def chunk_and_index(self, doc_id: str, file_path: str):
        """
        Background task node.
        Simulates chunking and Qdrant indexing.
        """
        # Logic for reading from MinIO, chunking, and upserting vectors
        pass

document_service = DocumentService()
