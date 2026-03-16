from .state import AetherState, MemoryChunk
from ..services.memory_service import memory_service

async def memory_node(state: AetherState):
    """
    Agent 3: Memory Agent.
    Retrieves top-5 similar past messages to inject context.
    Goal: <8ms retrieval time using Qdrant HNSW.
    """
    last_message = state["messages"][-1].content
    org_id = state["org_id"]
    
    try:
        hits = await memory_service.search(
            query=last_message,
            org_id=org_id,
            limit=5
        )
        
        memory_context = [
            MemoryChunk(
                content=hit.payload["content"],
                similarity=hit.score
            ) for hit in hits
        ]
    except Exception:
        # Fail gracefully: continue without memory context
        memory_context = []
    
    return {
        "memory_context": memory_context,
        "current_agent": "memory"
    }
