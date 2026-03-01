# LangChain Conversational Web Application

This is an enterprise-grade conversational web application built with React, FastAPI, and LangChain. It features RAG (Retrieval-Augmented Generation), PDF document processing, web search integration, and a customizable workflow engine.

## Key Features

- **Intelligent Dialogue System**: Context-aware chat interface supporting multi-turn conversations.
- **RAG Capability**: Upload PDF documents, automatically split and vectorise them for semantic search.
- **Web Search Integration**: Real-time information retrieval using DuckDuckGo search.
- **Workflow Engine**: Design and execute custom conversation flows using LangGraph.
- **Multi-Model Support**: Configurable for OpenAI, Alibaba Qwen, ByteDance Doubao, and other LLMs.
- **Data Isolation**: Strict user data separation (designed in architecture).

## Project Structure

- `src/`: Frontend React application (Vite + TypeScript + TailwindCSS)
- `api/`: Backend FastAPI application (Python + LangChain + ChromaDB)
- `api/app/`: Core backend logic
  - `services/`: Business logic (Chat, Document, Workflow)
  - `api/endpoints/`: RESTful API routes
  - `db/`: Database and Vector Store connections
  - `core/`: Configuration and settings

## Prerequisites

- Node.js (v18+)
- Python (v3.10+)

## Setup Guide

### 1. Backend Setup

Navigate to the `api` directory:
```bash
cd api
```

Create and activate a virtual environment (recommended):
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

Install Python dependencies:
```bash
pip install -r requirements.txt
```

Create a `.env` file in `api/` directory with your API keys:
```env
OPENAI_API_KEY=sk-...
# Optional: Add other keys as needed
# DASHSCOPE_API_KEY=...
# VOLC_API_KEY=...
```

Start the backend server:
```bash
python main.py
# The API will be available at http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### 2. Frontend Setup

Navigate to the project root:
```bash
npm install
```

Start the development server:
```bash
npm run dev
# The application will be available at http://localhost:5173
```

## Usage

1.  **Chat**: Go to the Chat page to interact with the AI. Toggle "Web Search" mode for real-time info.
2.  **Documents**: Go to the Documents page to upload PDFs. Once processed, switch Chat mode to "RAG" to ask questions about your documents.
3.  **Workflows**: Create and test custom workflows in the Workflows page.

## Documentation

- [Product Requirements Document](.trae/documents/langchain_conversational_app_prd.md)
- [Technical Architecture](.trae/documents/langchain_conversational_app_technical_architecture.md)
