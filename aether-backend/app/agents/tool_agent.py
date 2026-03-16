import asyncio
import time
from .state import AetherState, ToolResult
from ..tools.registry import tool_registry

async def tool_node(state: AetherState):
    """
    Agent 4: Tool Orchestration Agent.
    Executes tool calls from Reasoning Agent in parallel where safe.
    """
    last_msg = state["messages"][-1]
    if not hasattr(last_msg, "tool_calls") or not last_msg.tool_calls:
        return {"current_agent": "tool"}

    tasks = []
    for tc in last_msg.tool_calls:
        tasks.append(execute_tool_with_timing(tc["name"], tc["args"]))

    results = await asyncio.gather(*tasks)
    
    return {
        "tool_results": results,
        "current_agent": "tool"
    }

async def execute_tool_with_timing(name: str, args: dict):
    start = time.time()
    try:
        # Pass call_id for tracing
        tool_func = tool_registry.get(name)
        if not tool_func:
            return ToolResult(tool=name, args=args, result=f"Error: Tool {name} not found", duration_ms=0)
            
        result = await tool_func(**args)
        duration = int((time.time() - start) * 1000)
        return ToolResult(tool=name, args=args, result=result, duration_ms=duration)
    except Exception as e:
        return ToolResult(tool=name, args=args, result=f"Error: {str(e)}", duration_ms=0)
