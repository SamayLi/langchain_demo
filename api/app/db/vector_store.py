import os
from app.core.config import settings
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import SentenceTransformerEmbeddings

# Initialize embedding function
# Ensure it's globally consistent
embedding_function = SentenceTransformerEmbeddings(model_name="all-MiniLM-L6-v2")

def get_vector_store():
    persist_dir = os.path.abspath(settings.CHROMA_PERSIST_DIRECTORY)
    
    # Check if directory exists, if not, create it
    if not os.path.exists(persist_dir):
        os.makedirs(persist_dir, exist_ok=True)
        
    return Chroma(
        persist_directory=persist_dir,
        embedding_function=embedding_function,
        collection_name="document_embeddings"
    )
