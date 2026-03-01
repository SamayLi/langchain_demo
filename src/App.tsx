import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import Documents from './pages/Documents';
import Chat from './pages/Chat';
import Workflows from './pages/Workflows';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link to="/" className="text-xl font-bold text-blue-600 flex items-center gap-2">
              <span>🤖</span> 宏观分析智能助手
            </Link>
            <div className="space-x-6">
              <Link to="/chat" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">智能对话</Link>
              <Link to="/documents" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">知识库管理</Link>
              <Link to="/workflows" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">工作流配置</Link>
            </div>
          </div>
        </nav>

        <main>
          <Routes>
            <Route path="/" element={<Navigate to="/chat" replace />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/workflows" element={<Workflows />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
