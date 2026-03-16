from celery import Celery
from ..config import settings

celery_app = Celery(
    "aether_workers",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)

@celery_app.task(name="tasks.index_document")
def index_document_task(doc_id: str):
    # Simulated background indexing logic
    return {"status": "indexed", "doc_id": doc_id}

@celery_app.task(name="tasks.consolidate_memories")
def consolidate_memories():
    # Long-term memory housekeeping
    return {"status": "consolidated"}
