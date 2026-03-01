from langchain_openai import ChatOpenAI
from langchain_community.chat_models import ChatTongyi
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.chains import create_history_aware_retriever, create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_community.chat_message_histories import ChatMessageHistory
from langchain_core.chat_history import BaseChatMessageHistory
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_community.tools import DuckDuckGoSearchRun
from langchain.agents import AgentExecutor, create_openai_tools_agent
from app.core.config import settings
from app.db.vector_store import get_vector_store
import os
from typing import Optional

# In-memory store for chat history
store = {}

def get_session_history(session_id: str) -> BaseChatMessageHistory:
    if session_id not in store:
        store[session_id] = ChatMessageHistory()
    return store[session_id]

def get_llm(model_name: str = "gpt-3.5-turbo"):
    """
    Factory function to get the appropriate LLM based on configuration
    """
    from app.core.config import settings
    
    # Check for DashScope (Aliyun) configuration
    if settings.DASHSCOPE_API_KEY and (not settings.OPENAI_API_KEY or "qwen" in model_name.lower()):
        qwen_model = "qwen-turbo"
        if "qwen" in model_name.lower():
            qwen_model = model_name
            
        return ChatTongyi(
            dashscope_api_key=settings.DASHSCOPE_API_KEY,
            model=qwen_model,
            temperature=0.7
        )
        
    # Default to OpenAI with explicit API KEY
    return ChatOpenAI(
        api_key=settings.OPENAI_API_KEY, 
        model=model_name,
        temperature=0.7
    )

async def get_chat_response(session_id: str, message: str, mode: str = "normal", system_prompt: Optional[str] = None):
    # Initialize LLM
    llm = get_llm()
    
    # 1. Fetch available documents to inform the Agent
    available_docs = []
    if os.path.exists(settings.UPLOAD_DIRECTORY):
        available_docs = [f for f in os.listdir(settings.UPLOAD_DIRECTORY) if f.endswith(".pdf")]
    
    docs_context = ""
    if available_docs:
        docs_context = f"\n当前知识库文档列表: {', '.join(available_docs)}。"
    else:
        docs_context = "\n当前知识库暂无文档。"

    # 2. Prepare Tools
    from langchain_community.utilities import SerpAPIWrapper
    serpapi_key = settings.SERPAPI_API_KEY
    tools = []
    
    if serpapi_key:
        try:
            search_engine = SerpAPIWrapper(serpapi_api_key=serpapi_key)
            from langchain.tools import Tool
            web_search_tool = Tool(
                name="web_search",
                func=search_engine.run,
                description="用于查询最新的时政、市场数据或互联网实时信息。"
            )
            tools.append(web_search_tool)
        except Exception:
            pass
    
    # Knowledge Base Tool
    try:
        from app.db.vector_store import get_vector_store
        vector_store = get_vector_store()
        from langchain.tools.retriever import create_retriever_tool
        
        collection = vector_store._collection
        if collection.count() > 0:
            knowledge_base_tool = create_retriever_tool(
                vector_store.as_retriever(search_kwargs={"k": 5}),
                "knowledge_base",
                "核心工具：用于检索已上传的 PDF 文档内容。在回答关于内部资料或特定文档的问题时，必须使用此工具。"
            )
            tools.append(knowledge_base_tool)
    except Exception:
        pass

    # 3. Dynamic Prompt
    from datetime import datetime
    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    # Use session specific prompt if provided
    role_instruction = system_prompt if system_prompt else "你是一位专业的宏观经济分析助手，擅长分析市场趋势、政策导向并结合内部资料给出建议。"
    base_instructions = f"{role_instruction}\n当前系统时间: {current_time}。{docs_context}"
    
    if mode == "rag":
        mode_instructions = "【用户意图：文档模式】。你必须针对每个问题优先检索 'knowledge_base' 工具，并根据文档内容给出详尽回答。如果文档中未提及，请如实告知。"
    elif mode == "search":
        mode_instructions = "【用户意图：搜索模式】。请优先使用 'web_search' 工具查询最新的市场动态和实时数据。"
    else:
        mode_instructions = "【用户意图：普通对话】。根据需要灵活调用工具。如果问题涉及知识库中的文档，请使用 'knowledge_base'；如果涉及实时信息，请使用 'web_search'。"

    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", f"{base_instructions}\n{mode_instructions}\n请使用专业且简洁的中文进行回答。"),
            (MessagesPlaceholder("chat_history")),
            ("human", "{input}"),
            (MessagesPlaceholder("agent_scratchpad")),
        ]
    )

    # 4. Agent Executor
    agent = create_openai_tools_agent(llm, tools, prompt)
    agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)
    
    with_history = RunnableWithMessageHistory(
        agent_executor,
        get_session_history,
        input_messages_key="input",
        history_messages_key="chat_history",
    )
    
    response = with_history.invoke(
        {"input": message},
        config={"configurable": {"session_id": session_id}}
    )
    
    return response["output"]
