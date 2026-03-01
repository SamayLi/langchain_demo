import os
import uuid
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from app.db.vector_store import get_vector_store

async def process_document(file_path: str, filename: str):
    # Load PDF
    loader = PyPDFLoader(file_path)
    documents = loader.load()
    
    # Split Text
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len,
    )
    chunks = text_splitter.split_documents(documents)
    
    # Add metadata
    doc_id = str(uuid.uuid4())
    for chunk in chunks:
        chunk.metadata["source"] = filename
        chunk.metadata["doc_id"] = doc_id
        
    # Store in Vector DB
    # Note: Chroma.from_documents or add_documents might block, so in a real async app 
    # we might want to run this in a thread pool, but for now direct call is fine 
    # if the library supports it or for small loads.
    vector_store = get_vector_store()
    vector_store.add_documents(chunks)
    
    return doc_id, len(chunks)
