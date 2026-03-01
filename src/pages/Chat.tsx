import React, { useState, useEffect } from 'react';
import { ChatInput } from '../components/ChatInput';
import axios from 'axios';
import { Bot, User, Globe, FileText, MessageSquare, Plus, Trash2, Settings, Sidebar } from 'lucide-react';
import { clsx } from 'clsx';
import { generateUUID } from '../lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatSession {
  id: string;
  title: string;
  systemPrompt: string;
  messages: Message[];
  mode: 'normal' | 'rag' | 'search';
}

export default function Chat() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Initialize with one session if empty
  useEffect(() => {
    const savedSessions = localStorage.getItem('chat_sessions');
    if (savedSessions) {
      const parsed = JSON.parse(savedSessions);
      setSessions(parsed);
      if (parsed.length > 0) setActiveSessionId(parsed[0].id);
    } else {
      createNewSession();
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem('chat_sessions', JSON.stringify(sessions));
    }
  }, [sessions]);

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: generateUUID(),
      title: `新对话 ${sessions.length + 1}`,
      systemPrompt: '你是一位专业的宏观经济分析助手。',
      messages: [],
      mode: 'normal'
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSessions = sessions.filter(s => s.id !== id);
    setSessions(newSessions);
    if (activeSessionId === id) {
      setActiveSessionId(newSessions.length > 0 ? newSessions[0].id : null);
    }
  };

  const activeSession = sessions.find(s => s.id === activeSessionId);

  const updateActiveSession = (updates: Partial<ChatSession>) => {
    setSessions(prev => prev.map(s => 
      s.id === activeSessionId ? { ...s, ...updates } : s
    ));
  };

  const handleSend = async (text: string) => {
    if (!activeSession) return;

    const newMessage: Message = { role: 'user', content: text };
    const updatedMessages = [...activeSession.messages, newMessage];
    
    // Update local state first
    updateActiveSession({ messages: updatedMessages });
    setIsLoading(true);

    try {
      const response = await axios.post('/api/chat/message', {
        session_id: activeSession.id,
        message: text,
        mode: activeSession.mode,
        system_prompt: activeSession.systemPrompt
      });
      
      const botMessage: Message = { role: 'assistant', content: response.data.response };
      updateActiveSession({ 
        messages: [...updatedMessages, botMessage],
        // Auto-update title if it's still default
        title: activeSession.title.startsWith('新对话') ? text.slice(0, 20) + '...' : activeSession.title
      });
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = { role: 'assistant', content: "错误：无法连接到分析助手，请检查 API 配置。" };
      updateActiveSession({ messages: [...updatedMessages, errorMessage] });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4">
          <button
            onClick={createNewSession}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-xl transition-all shadow-sm font-medium"
          >
            <Plus className="w-4 h-4" /> 开启新对话
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          {sessions.map(s => (
            <div
              key={s.id}
              onClick={() => setActiveSessionId(s.id)}
              className={clsx(
                "group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all",
                activeSessionId === s.id ? "bg-blue-50 text-blue-700" : "hover:bg-gray-100 text-gray-600"
              )}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <MessageSquare className="w-4 h-4 flex-shrink-0" />
                <span className="truncate text-sm font-medium">{s.title}</span>
              </div>
              <button
                onClick={(e) => deleteSession(s.id, e)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-red-500 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative bg-white">
        {activeSession ? (
          <>
            {/* Header / Mode Selector */}
            <div className="h-16 border-bottom border-gray-100 flex items-center justify-between px-6 bg-white/80 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <h2 className="font-bold text-gray-800 truncate max-w-[200px]">{activeSession.title}</h2>
                <div className="flex gap-1 bg-gray-100 p-1 rounded-lg scale-90">
                  <button
                    onClick={() => updateActiveSession({ mode: 'normal' })}
                    className={clsx("px-3 py-1 rounded-md text-xs font-semibold transition-all", 
                      activeSession.mode === 'normal' ? "bg-white shadow-sm text-blue-600" : "text-gray-500")}
                  >
                    普通模式
                  </button>
                  <button
                    onClick={() => updateActiveSession({ mode: 'rag' })}
                    className={clsx("px-3 py-1 rounded-md text-xs font-semibold transition-all", 
                      activeSession.mode === 'rag' ? "bg-white shadow-sm text-blue-600" : "text-gray-500")}
                  >
                    文档模式
                  </button>
                  <button
                    onClick={() => updateActiveSession({ mode: 'search' })}
                    className={clsx("px-3 py-1 rounded-md text-xs font-semibold transition-all", 
                      activeSession.mode === 'search' ? "bg-white shadow-sm text-blue-600" : "text-gray-500")}
                  >
                    搜索模式
                  </button>
                </div>
              </div>
              
              <button 
                onClick={() => setShowSettings(!showSettings)}
                className={clsx("p-2 rounded-lg transition-colors", showSettings ? "bg-blue-50 text-blue-600" : "text-gray-400 hover:bg-gray-100")}
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {activeSession.messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-gray-300">
                  <Bot className="w-16 h-16 mb-4 opacity-20" />
                  <p className="text-sm font-medium italic">配置分析助手的人设，开启专业宏观分析对话。</p>
                </div>
              )}
              
              {activeSession.messages.map((msg, idx) => (
                <div key={idx} className={clsx("flex gap-4", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                  <div className={clsx(
                    "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm",
                    msg.role === 'assistant' ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
                  )}>
                    {msg.role === 'assistant' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                  </div>
                  
                  <div className={clsx(
                    "max-w-[80%] p-4 rounded-2xl shadow-sm border",
                    msg.role === 'user' 
                      ? "bg-blue-50 border-blue-100 text-gray-800 rounded-tr-none" 
                      : "bg-white border-gray-100 text-gray-800 rounded-tl-none"
                  )}>
                    <p className="whitespace-pre-wrap leading-relaxed text-sm">{msg.content}</p>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-4 flex-row">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 animate-pulse">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div className="bg-gray-50 p-4 rounded-2xl rounded-tl-none border border-gray-100">
                    <div className="flex gap-1.5">
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></span>
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-150"></span>
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-300"></span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Settings Overlay */}
            {showSettings && (
              <div className="absolute right-6 top-16 w-80 bg-white shadow-2xl rounded-2xl border border-gray-100 p-5 z-20 animate-in fade-in zoom-in duration-200">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Settings className="w-4 h-4" /> 会话偏好设置
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1.5">自定义系统提示词 (System Prompt)</label>
                    <textarea
                      value={activeSession.systemPrompt}
                      onChange={(e) => updateActiveSession({ systemPrompt: e.target.value })}
                      className="w-full h-32 p-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                      placeholder="例如：你是一位谨慎的经济学家..."
                    />
                  </div>
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-[10px] text-gray-400">
                      修改将影响该会话后续的回复逻辑。所有工具 (搜索/知识库) 依然可以按需调用。
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="p-6 bg-white border-t border-gray-100">
              <ChatInput onSend={handleSend} disabled={isLoading} />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-50">
            <Bot className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-gray-500">选择或创建一个对话以开始分析</p>
          </div>
        )}
      </div>
    </div>
  );
}
