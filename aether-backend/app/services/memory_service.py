import uuid
from qdrant_client import QdrantClient
from qdrant_client.http import models
from ..config import settings
from ..core.embeddings import embedder

class MemoryService:
    def __init__(self):
        self.client = QdrantClient(host=settings.QDRANT_HOST, port=settings.QDRANT_PORT)
        self.collection_name = settings.QDRANT_COLLECTION

    async def init_collection(self):
        # Create intensive HNSW index for <8ms search
        collections = self.client.get_collections().collections
        exists = any(c.name == self.collection_name for c in collections)
        
        if not exists:
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=models.VectorParams(
                    size=768,  # text-embedding-004 size
                    distance=models.Distance.COSINE
                ),
                hnsw_config=models.HnswConfigDiff(
                    m=16,
                    ef_construct=100,
                    full_scan_threshold=10000
                )
            )

    async def search(self, query: str, org_id: str, limit: int = 5):
        query_vector = await embedder.get_embedding(query)
        
        return self.client.search(
            collection_name=self.collection_name,
            query_vector=query_vector,
            query_filter=models.Filter(
                must=[
                    models.FieldCondition(
                        key="org_id",
                        match=models.MatchValue(value=org_id),
                    )
                ]
            ),
            limit=limit
        )

    async def upsert(self, content: str, metadata: dict):
        vector = await embedder.get_embedding(content)
        point_id = str(uuid.uuid4())
        
        self.client.upsert(
            collection_name=self.collection_name,
            points=[
                models.PointStruct(
                    id=point_id,
                    vector=vector,
                    payload={"content": content, **metadata}
                )
            ]
        )
        return point_id

memory_service = MemoryService()
