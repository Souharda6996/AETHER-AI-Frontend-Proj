from typing import Annotated, List, TypedDict, Union
from langchain_core.messages import BaseMessage
from pydantic import BaseModel, Field

class MemoryChunk(BaseModel):
    content: str
    summary: str = ""
    similarity: float = 0.0

class ToolResult(BaseModel):
    tool: str
    args: dict
    result: Union[str, dict, list]
    duration_ms: int

class SafetyFlag(BaseModel):
    category: str
    flagged: bool
    reason: str = ""

class RouterDecision(BaseModel):
    intent: str
    confidence: float
    next_agents: List[str]

def merge_messages(left: List[BaseMessage], right: List[BaseMessage]) -> List[BaseMessage]:
    return left + right

class AetherState(TypedDict):
    # Core message history
    messages: Annotated[List[BaseMessage], merge_messages]
    
    # Metadata
    session_id: str
    org_id: str
    user_id: str
    
    # Context injected by agents
    memory_context: List[MemoryChunk]
    tool_results: List[ToolResult]
    safety_flags: List[SafetyFlag]
    
    # Routing and state control
    routing_decision: RouterDecision
    current_agent: str
    iteration_count: int
    metadata: dict
    
    # Final output status
    is_complete: bool
