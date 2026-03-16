from .state import AetherState
from langchain_core.messages import SystemMessage, HumanMessage
from ..config import settings
from ..core.llm import get_llm

# Initialize safely (will be None if config missing)
synthesis_llm = get_llm("pro")

SYNTHESIS_SYSTEM_PROMPT = """You are the AETHER AI RESPONSE SYNTHESIS AGENT.
Your task is to take the raw reasoning, memory context, and tool results, and format them into a premium, structured response for the user.
Guidelines:
1. Markdown: Use bolding, tables, and lists for readability.
2. Citations: If tool results were used, cite the sources clearly.
3. Tone: Professional, authoritative, yet helpful.
4. Metadata: Ensure the final output includes confidence scores and latency metrics if requested.
"""

async def synthesis_node(state: AetherState):
    """
    Agent 6: Response Synthesis Agent.
    Final node in the graph. Formats output for SSE streaming.
    """
    last_thought = state["messages"][-1].content
    memory_context = state.get("memory_context", [])
    tool_results = state.get("tool_results", [])
    
    # Construct synthesis prompt
    context_str = f"Memory: {memory_context}\nTools: {tool_results}\nRaw Thought: {last_thought}"
    
    msg = [
        SystemMessage(content=SYNTHESIS_SYSTEM_PROMPT),
        HumanMessage(content=context_str)
    ]
    
    # Fallback if AI core is not configured
    if not synthesis_llm:
        from langchain_core.messages import AIMessage
        return {
            "messages": [AIMessage(content=f"### neural_link_status: offline\n\nI am currently operating in **Autonomous Demo Mode**. \n\n{last_thought}\n\n*Note: To restore full capabilities, update the `.env` with valid Vertex AI credentials.*")],
            "current_agent": "synthesis",
            "is_complete": True
        }

    # We return the stream directly or handle it in the router
    # For LangGraph integration, we return the final response object
    response = await synthesis_llm.ainvoke(msg)
    
    return {
        "messages": [response],
        "current_agent": "synthesis",
        "is_complete": True
    }
