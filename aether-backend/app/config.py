import os
from typing import List, Union
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import AnyHttpUrl, validator

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", case_sensitive=True
    )

    # App
    PROJECT_NAME: str = "Aether AI Backend"
    APP_ENV: str = "development"
    LOG_LEVEL: str = "INFO"
    CORS_ORIGINS: Union[List[str], str] = ["http://localhost:5173", "https://aether-ai-pro.vercel.app"]

    @validator("CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        return v

    # Google Vertex AI
    GOOGLE_PROJECT_ID: str = "your-project-id"
    GOOGLE_LOCATION: str = "us-central1"
    GOOGLE_APPLICATION_CREDENTIALS: str = "path/to/credentials.json"
    VERTEX_AI_MODEL_PRO: str = "gemini-1.5-pro-002"
    VERTEX_AI_MODEL_FLASH: str = "gemini-1.5-flash-002"
    VERTEX_AI_EMBEDDING_MODEL: str = "text-embedding-004"

    # PostgreSQL
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "aether_db"
    POSTGRES_USER: str = "aether"
    POSTGRES_PASSWORD: str = "supersecretpassword"
    DATABASE_URL: str = "postgresql+asyncpg://aether:supersecretpassword@localhost:5432/aether_db"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    USE_REAL_AI: bool = False

    # Qdrant
    QDRANT_HOST: str = "localhost"
    QDRANT_PORT: int = 6333
    QDRANT_COLLECTION: str = "aether_memory"

    # MinIO
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin"
    MINIO_BUCKET: str = "aether-documents"

    # Auth
    JWT_SECRET_KEY: str = "supersecretjwtkeyforlocaldevelopment"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # External Tools
    SERPAPI_KEY: str = ""
    BRAVE_SEARCH_API_KEY: str = ""

    # Rate Limiting
    RATE_LIMIT_CHAT: str = "60/minute"
    RATE_LIMIT_AUTH: str = "10/minute"

settings = Settings()
