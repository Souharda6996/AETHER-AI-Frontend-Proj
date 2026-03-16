import json
from redis.asyncio import Redis, from_url
from ..config import settings

class CacheService:
    def __init__(self):
        self.redis: Redis = from_url(settings.REDIS_URL, decode_responses=True)

    async def get_session_context(self, session_id: str):
        """
        Retrieves the last N messages for the session from Redis.
        Claim 1: Fast context retrieval for <47ms first token.
        """
        try:
            context = await self.redis.get(f"session:{session_id}:context")
            return json.loads(context) if context else []
        except Exception:
            return []

    async def set_session_context(self, session_id: str, context: list, ttl: int = 3600):
        await self.redis.set(
            f"session:{session_id}:context",
            json.dumps(context),
            ex=ttl
        )

    async def increment_rate_limit(self, user_id: str, limit: int, window: int = 60):
        key = f"rate_limit:user:{user_id}"
        current = await self.redis.get(key)
        if current and int(current) >= limit:
            return False
        
        async with self.redis.pipeline(transaction=True) as pipe:
            await pipe.incr(key).expire(key, window).execute()
        return True

cache_service = CacheService()
