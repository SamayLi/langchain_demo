from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from app.services.workflow_service import WorkflowEngine
import uuid

router = APIRouter()
engine = WorkflowEngine()

class WorkflowCreate(BaseModel):
    name: str
    description: Optional[str] = None
    definition: Dict[str, Any]

class WorkflowResponse(BaseModel):
    id: str
    name: str
    status: str

class WorkflowExecuteRequest(BaseModel):
    input: str

class WorkflowExecuteResponse(BaseModel):
    output: str

# In-memory store
workflows_db = {}

@router.post("/", response_model=WorkflowResponse)
async def create_workflow(workflow: WorkflowCreate):
    workflow_id = str(uuid.uuid4())
    workflows_db[workflow_id] = workflow
    return WorkflowResponse(
        id=workflow_id,
        name=workflow.name,
        status="active"
    )

@router.post("/{workflow_id}/execute", response_model=WorkflowExecuteResponse)
async def execute_workflow(workflow_id: str, request: WorkflowExecuteRequest):
    if workflow_id not in workflows_db:
        # For demo purposes, allow execution even if not found, using default graph
        pass
        
    try:
        output = await engine.execute_workflow(workflow_id, request.input)
        return WorkflowExecuteResponse(output=str(output))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Workflow execution failed: {str(e)}")

@router.get("/", response_model=List[WorkflowResponse])
async def list_workflows():
    return [
        WorkflowResponse(id=k, name=v.name, status="active") 
        for k, v in workflows_db.items()
    ]
