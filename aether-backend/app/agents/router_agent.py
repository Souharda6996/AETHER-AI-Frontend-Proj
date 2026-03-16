from datetime import datetime
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field
from typing import List

from .state import AetherState, RouterDecision
from ..config import settings
from ..core.llm import get_llm

class IntentResponse(BaseModel):
    intent: str = Field(description="The primary intent: REASONING, MEMORY, TOOL, SAFETY, or GENERAL")
    confidence: float = Field(description="Confidence score between 0 and 1")
    next_agents: List[str] = Field(description="List of agent names to activate")

parser = JsonOutputParser(pydantic_object=IntentResponse)

# Initialize safely (will be None if config missing)
router_llm = get_llm("flash")

ROUTER_PROMPT = """You are the AETHER AI ROUTER.
 Your job is to classify the intent of the incoming user message and decide which agents to activate.
Available Agents:
- reasoning: For complex multi-step queries or code.
- memory: For personal context or past conversation retrieval.
- tool: For external service calls (search, database, etc).
- safety: Parallel check for all inputs.
- synthesis: Final response generation.

Output your decision in the following JSON format:
{
    "intent": "REASONING" | "MEMORY" | "TOOL" | "SAFETY" | "GENERAL",
    "confidence": 0.95,
    "next_agents": ["reasoning", "memory"]
}
"""

async def router_node(state: AetherState):
    """
    Classifies the user message and routes to the next agent.
    Goal: <10ms latency in high-traffic scenarios.
    """
    last_message = state["messages"][-1].content
    
    # Fallback if AI core is not configured
    if not router_llm:
        return {
            "routing_decision": RouterDecision(intent="GENERAL", confidence=1.0, next_agents=["synthesis"]),
            "current_agent": "router",
            "iteration_count": state.get("iteration_count", 0) + 1
        }

    msg = [
        SystemMessage(content=ROUTER_PROMPT),
        HumanMessage(content=last_message)
    ]
    
    try:
        response = await router_llm.ainvoke(msg)
        decision = parser.parse(response.content)
    except Exception:
        decision = {"intent": "GENERAL", "confidence": 1.0, "next_agents": ["synthesis"]}
    
    return {
        "routing_decision": RouterDecision(**decision),
        "current_agent": "router",
        "iteration_count": state.get("iteration_count", 0) + 1
    }
