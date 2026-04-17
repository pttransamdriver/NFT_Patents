from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # LLM / Embeddings
    openai_api_key: str
    llm_model: str = "gpt-4o-mini"
    embedding_model: str = "text-embedding-3-small"

    # LangSmith tracing (set LANGCHAIN_TRACING_V2=true to enable)
    langchain_api_key: str = ""
    langchain_tracing_v2: str = "false"
    langchain_project: str = "nft-patents-rag"

    # Express backend URL — used by agent tools to call /api/patents/*
    express_backend_url: str = "http://localhost:3001"

    # Paths
    patents_db_path: str = "../backend/patents-db.json"
    chroma_persist_dir: str = "./chroma_db"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()
