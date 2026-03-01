import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Play, Plus, GitGraph } from 'lucide-react';

interface Workflow {
  id: string;
  name: string;
  status: string;
}

export default function Workflows() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [newWorkflowName, setNewWorkflowName] = useState('');
  const [executionResult, setExecutionResult] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      const response = await axios.get('/api/workflows/');
      setWorkflows(response.data);
    } catch (error) {
      console.error('Failed to fetch workflows', error);
    }
  };

  const createWorkflow = async () => {
    if (!newWorkflowName.trim()) return;
    try {
      await axios.post('/api/workflows/', {
        name: newWorkflowName,
        definition: { nodes: [], edges: [] } // Mock definition
      });
      setNewWorkflowName('');
      fetchWorkflows();
    } catch (error) {
      console.error('Failed to create workflow', error);
    }
  };

  const executeWorkflow = async (id: string) => {
    setIsExecuting(true);
    setExecutionResult('');
    try {
      const response = await axios.post(`/api/workflows/${id}/execute`, {
        input: "Hello from workflow test"
      });
      setExecutionResult(response.data.output);
    } catch (error) {
      setExecutionResult('Error executing workflow');
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-800 flex items-center gap-2">
        <GitGraph className="w-8 h-8 text-blue-600" />
        Workflow Engine
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold mb-4">Create Workflow</h2>
          <div className="flex gap-2 mb-6">
            <input
              type="text"
              value={newWorkflowName}
              onChange={(e) => setNewWorkflowName(e.target.value)}
              placeholder="Workflow Name"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={createWorkflow}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3">
            {workflows.map((wf) => (
              <div key={wf.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex justify-between items-center">
                <span className="font-medium">{wf.name}</span>
                <button
                  onClick={() => executeWorkflow(wf.id)}
                  disabled={isExecuting}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Play className="w-4 h-4" />
                </button>
              </div>
            ))}
            {workflows.length === 0 && (
              <p className="text-gray-500 text-center">No workflows created</p>
            )}
          </div>
        </div>

        <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold mb-4">Execution Result</h2>
          <div className="h-64 bg-gray-900 rounded-lg p-4 font-mono text-sm text-green-400 overflow-auto">
            {isExecuting ? (
              <span className="animate-pulse">Executing workflow...</span>
            ) : (
              executionResult || "// Output will appear here"
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
