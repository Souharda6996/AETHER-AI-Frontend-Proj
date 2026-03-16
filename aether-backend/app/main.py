import time
import structlog
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from .config import settings
from .database import engine
from .routers import auth, chat, memory, documents, admin, webhooks, apikeys

# Configure structured logging
structlog.configure(
    processors=[
        structlog.processors.JSONRenderer()
    ]
)
logger = structlog.get_logger()

# Rate limiting
limiter = Limiter(key_func=get_remote_address)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize connections, load caches
    logger.info("Starting Aether AI Backend", env=settings.APP_ENV)
    yield
    # Shutdown: Close connections
    logger.info("Shutting down Aether AI Backend")
    await engine.dispose()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    lifespan=lifespan
)

# Middleware: CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware: Audit Logging & Latency Tracking
@app.middleware("http")
async def audit_logging_middleware(request: Request, call_next):
    start_time = time.time()
    
    # Process request
    response = await call_next(request)
    
    process_time = (time.time() - start_time) * 1000
    
    # Log the interaction (Claim: 47ms latency monitoring)
    logger.info(
        "http_request",
        method=request.method,
        path=request.url.path,
        status_code=response.status_code,
        latency_ms=round(process_time, 2),
        ip=request.client.host if request.client else "unknown"
    )
    
    response.headers["X-Process-Time"] = str(process_time)
    return response

# Rate limit handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Include Routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(chat.router, prefix="/api/v1/chat", tags=["Chat"])
app.include_router(memory.router, prefix="/api/v1/memory", tags=["Memory"])
app.include_router(documents.router, prefix="/api/v1/documents", tags=["Documents"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["Admin"])
app.include_router(webhooks.router, prefix="/api/v1/webhooks", tags=["Webhooks"])
app.include_router(apikeys.router, prefix="/api/v1/apikeys", tags=["API Keys"])

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": time.time()}

@app.get("/health/ready")
async def readiness_check():
    # TODO: Add real DB, Redis, Qdrant health checks
    return {"status": "ready"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=False)
