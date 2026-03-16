import structlog
from ..config import settings
import os

logger = structlog.get_logger()

def get_llm(model_type: str = "flash"):
    """
    Safely initialize Vertex AI LLM. 
    Returns None if configuration is missing or USE_REAL_AI is False.
    """
    model_name = settings.VERTEX_AI_MODEL_FLASH if model_type == "flash" else settings.VERTEX_AI_MODEL_PRO
    
    # Gate with feature flag
    if not settings.USE_REAL_AI:
        return None

    from langchain_google_vertexai import ChatVertexAI
    
    # Check if we have minimal config
    if not settings.GOOGLE_PROJECT_ID or settings.GOOGLE_PROJECT_ID == "your-project-id":
        logger.warning("llm_config_missing", model=model_name)
        return None

    try:
        return ChatVertexAI(
            model_name=model_name,
            project=settings.GOOGLE_PROJECT_ID,
            location=settings.GOOGLE_LOCATION,
            temperature=0 if model_type == "flash" else 0.7,
        )
    except Exception as e:
        logger.error("llm_init_error", error=str(e), model=model_name)
        return None
