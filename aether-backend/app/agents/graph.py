from langgraph.graph import StateGraph, END
from .state import AetherState
from .router_agent import router_node
from .reasoning_agent import reasoning_node
from .memory_agent import memory_node
from .tool_agent import tool_node
from .safety_agent import safety_node
from .synthesis_agent import synthesis_node

def create_aether_graph():
    workflow = StateGraph(AetherState)

    workflow.add_node("router", router_node)
    workflow.add_node("memory", memory_node)
    workflow.add_node("safety", safety_node)
    workflow.add_node("reasoning", reasoning_node)
    workflow.add_node("tool", tool_node)
    workflow.add_node("synthesis", synthesis_node)

    workflow.set_entry_point("router")
    
    # Router routes to Safety and Memory in parallel
    workflow.add_edge("router", "safety")
    workflow.add_edge("router", "memory")
    
    # Safety & Memory go to Reasoning
    workflow.add_edge("safety", "reasoning")
    workflow.add_edge("memory", "reasoning")
    
    # Reasoning loops with Tool
    workflow.add_conditional_edges(
        "reasoning",
        lambda x: "tool" if x["current_agent"] == "tool" else "synthesis",
        {
            "tool": "tool",
            "synthesis": "synthesis"
        }
    )
    
    workflow.add_edge("tool", "reasoning")
    
    # Synthesis ends the turn
    workflow.add_edge("synthesis", END)

    return workflow.compile()
