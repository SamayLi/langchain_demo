from typing import Dict, Any, List
from langgraph.graph import StateGraph, END
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, AIMessage
from app.core.config import settings
import operator
from typing import TypedDict, Annotated, Sequence

# Define the state of the workflow
class WorkflowState(TypedDict):
    messages: Annotated[Sequence[Any], operator.add]
    context: Dict[str, Any]

class WorkflowEngine:
    def __init__(self):
        self.llm = ChatOpenAI(
            api_key=settings.OPENAI_API_KEY or "sk-dummy",
            model="gpt-3.5-turbo",
            temperature=0.7
        )

    def create_graph(self, definition: Dict[str, Any]):
        """
        Creates a LangGraph from a JSON definition.
        Definition format example:
        {
            "nodes": [
                {"id": "agent", "type": "llm", "prompt": "You are a helper."},
                {"id": "tool", "type": "tool", "tool_name": "search"}
            ],
            "edges": [
                {"source": "agent", "target": "end"}
            ]
        }
        """
        workflow = StateGraph(WorkflowState)
        
        # This is a simplified implementation. 
        # Real implementation would parse nodes and dynamically create functions.
        
        # Define a generic LLM node
        def llm_node(state):
            messages = state['messages']
            response = self.llm.invoke(messages)
            return {"messages": [response]}

        # Add nodes (mocking dynamic creation for now)
        workflow.add_node("agent", llm_node)
        
        # Set entry point
        workflow.set_entry_point("agent")
        
        # Add edges
        workflow.add_edge("agent", END)
        
        return workflow.compile()

    async def execute_workflow(self, workflow_id: str, input_message: str):
        # In a real app, we would load the definition from DB based on workflow_id
        mock_definition = {"nodes": [], "edges": []}
        
        app = self.create_graph(mock_definition)
        
        inputs = {"messages": [HumanMessage(content=input_message)], "context": {}}
        
        result = await app.ainvoke(inputs)
        
        return result["messages"][-1].content
