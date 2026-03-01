import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# config.py is in api/app/core/config.py, so we need to go up 2 levels to find api/.env
current_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.abspath(os.path.join(current_dir, "../../.env"))
load_dotenv(env_path)

class Settings(BaseSettings):
    PROJECT_NAME: str = os.getenv("PROJECT_NAME", "LangChain Conversational App")
    API_V1_STR: str = os.getenv("API_V1_STR", "/api")
    CHROMA_PERSIST_DIRECTORY: str = os.getenv("CHROMA_PERSIST_DIRECTORY", "chroma_db")
    UPLOAD_DIRECTORY: str = os.getenv("UPLOAD_DIRECTORY", "uploads")
    
    # Model Configurations
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    DASHSCOPE_API_KEY: str = os.getenv("DASHSCOPE_API_KEY", "")
    VOLC_API_KEY: str = os.getenv("VOLC_API_KEY", "")
    SERPAPI_API_KEY: str = os.getenv("SERPAPI_API_KEY", "")
    
    class Config:
        case_sensitive = True

settings = Settings()
