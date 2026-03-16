from langchain_core.messages import SystemMessage, HumanMessage, ToolMessage
from .state import AetherState
from ..config import settings
from ..core.llm import get_llm

# Initialize safely (will be None if config missing)
reasoning_llm = get_llm("pro")

REASONING_SYSTEM_PROMPT = """You are the AETHER AI REASONING AGENT. Your job is to handle complex, multi-step queries using tool calls.
Guidelines:
1. Chain-of-Thought: Explain your reasoning steps in your scratchpad.
2. Tool Use: Call tools parallelly if possible.
3. Self-Correction: If a tool returns an error, try to fix the input or use a different tool.
4. Scale: Every response must feel premium, enterprise-grade, and precise.

Available context:
{memory_context}

Available tools: {tools}
"""

async def reasoning_node(state: AetherState):
    """
    Agent 2: Reasoning Agent.
    Implements multi-step loops with tools up to 10 iterations.
    """
    iteration = state.get("iteration_count", 0)
    if iteration > 10:
        return {"current_agent": "reasoning", "is_complete": True}

    # Prepare context
    memory_str = "\n".join([f"- {m.content}" for m in state["memory_context"]])
    system_msg = REASONING_SYSTEM_PROMPT.format(
        memory_context=memory_str,
        tools="[web_search, code_interpreter, database_query, documents, calendar, image]"
    )
    
    messages = [SystemMessage(content=system_msg)] + state["messages"]
    
    # Fallback if AI core is not configured
    if not reasoning_llm:
        from langchain_core.messages import AIMessage
        mock_response = AIMessage(content="[DEMO MODE] I've analyzed your request through my local neural patterns. To enable complex reasoning and tool execution, please configure the Google Cloud Vertex AI credentials.")
        return {
            "messages": [mock_response],
            "current_agent": "reasoning",
            "is_complete": True
        }

    # Check if we have tool results from previous turn
    if state["tool_results"]:
        for res in state["tool_results"]:
            messages.append(ToolMessage(
                content=str(res.result),
                tool_call_id=res.args.get("call_id", "dynamic_call")
            ))

    response = await reasoning_llm.ainvoke(messages)
    
    # Check for tool calls in response
    if response.tool_calls:
        return {
            "messages": [response],
            "current_agent": "tool",
            "iteration_count": iteration + 1
        }
    
    return {
        "messages": [response],
        "current_agent": "reasoning",
        "is_complete": True
    }
