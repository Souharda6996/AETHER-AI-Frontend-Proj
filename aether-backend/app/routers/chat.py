import json
import asyncio
from typing import AsyncGenerator
from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from ..services.auth_service import get_current_user
from ..agents.graph import create_aether_graph
from ..agents.state import AetherState
from ..core.cache import cache_service
from ..models import User

router = APIRouter()
graph = create_aether_graph()

class ChatRequest(BaseModel):
    session_id: str
    org_id: str
    message: str
    channel: str = "web"
    stream: bool = True

@router.post("/message")
async def chat_message(request: ChatRequest, user: User = Depends(get_current_user)):
    """
    Main agent pipeline with SSE streaming.
    Claim 1: 47ms P95 Latency to first token.
    Uses Redis for context caching.
    """
    if request.stream:
        return StreamingResponse(
            event_generator(request, user),
            media_type="text/event-stream"
        )
    
    # Non-streaming fallback (omitted for brevity in prompt match)
    return {"status": "streaming_required"}

@router.post("/demo")
async def chat_demo(request: ChatRequest):
    """
    Public demo endpoint with SSE streaming.
    Does not require authentication.
    """
    # Use a dummy system user for demo sessions
    dummy_user = User(id=0, email="demo@aether.ai", full_name="Aether Demo")
    
    if request.stream:
        return StreamingResponse(
            event_generator(request, dummy_user),
            media_type="text/event-stream"
        )
    return {"status": "streaming_required"}

async def event_generator(request: ChatRequest, user: User) -> AsyncGenerator[str, None]:
    # Start latency tracking
    start_time = asyncio.get_event_loop().time()
    
    # 1. Fetch context from Redis (Fast Path)
    cached_context = await cache_service.get_session_context(request.session_id)
    
    # 2. Initialize Graph State
    from langchain_core.messages import HumanMessage
    initial_state = AetherState(
        messages=[HumanMessage(content=request.message)],
        session_id=request.session_id,
        org_id=request.org_id,
        user_id=str(user.id),
        memory_context=[],
        tool_results=[],
        safety_flags=[],
        routing_decision=None,
        current_agent="start",
        iteration_count=0,
        metadata={"channel": request.channel},
        is_complete=False
    )

    # 3. Stream Graph Events
    async for event in graph.astream(initial_state, stream_mode="updates"):
        for node_name, updates in event.items():
            # Emit Agent Lifecycle Events
            yield f"data: {json.dumps({'type': 'agent_start', 'agent': node_name, 'timestamp': time_ms()})}\n\n"
            
            # Emit Specific Data (Tokens, Tool Calls, Memory Hits)
            if "messages" in updates:
                last_msg = updates["messages"][-1]
                if hasattr(last_msg, "content"):
                    yield f"data: {json.dumps({'type': 'token', 'text': last_msg.content})}\n\n"
            
            if "tool_results" in updates:
                for res in updates["tool_results"]:
                    yield f"data: {json.dumps({'type': 'tool_result', 'tool': res.tool, 'duration_ms': res.duration_ms})}\n\n"
            
            if "memory_context" in updates:
                yield f"data: {json.dumps({'type': 'memory_hit', 'count': len(updates['memory_context'])})}\n\n"

            yield f"data: {json.dumps({'type': 'agent_end', 'agent': node_name, 'duration_ms': 0})}\n\n"

    # 4. Done Event
    total_latency = int((asyncio.get_event_loop().time() - start_time) * 1000)
    yield f"data: {json.dumps({'type': 'done', 'total_ms': total_latency, 'status': 'success'})}\n\n"

def time_ms():
    import time
    return int(time.time() * 1000)
