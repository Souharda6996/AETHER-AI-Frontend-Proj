from ..config import settings

class Embedder:
    def __init__(self):
        self._embeddings = None

    @property
    def embeddings(self):
        if not settings.USE_REAL_AI:
            return None
            
        from langchain_google_vertexai import VertexAIEmbeddings
        if self._embeddings is None:
            try:
                self._embeddings = VertexAIEmbeddings(model_name=settings.VERTEX_AI_EMBEDDING_MODEL)
            except Exception:
                return None
        return self._embeddings

    async def get_embedding(self, text: str):
        emb = self.embeddings
        if emb is None:
            # Return zero vector for Demo Mode
            return [0.0] * 768
        return await emb.aembed_query(text)

embedder = Embedder()
