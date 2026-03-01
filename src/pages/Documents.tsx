import React, { useState, useEffect } from 'react';
import { FileUploader } from '../components/FileUploader';
import { Search, FileText, List, HardDrive } from 'lucide-react';
import axios from 'axios';

interface DocumentInfo {
  filename: string;
  size: number;
  created_at: number;
}

interface SearchResult {
  content: string;
  metadata: {
    source: string;
    doc_id: string;
    [key: string]: any;
  };
  score: number;
}

export default function Documents() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('/api/documents/');
      setDocuments(response.data);
    } catch (error) {
      console.error('获取文档失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await axios.post('/api/documents/search', {
        query: searchQuery,
        k: 4
      });
      setSearchResults(response.data);
    } catch (error) {
      console.error('搜索失败:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">知识库管理</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Upload & List */}
        <div className="lg:col-span-7 space-y-8">
          {/* Upload Section */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-blue-600" />
              上传 PDF 文档
            </h2>
            <p className="text-gray-600 mb-6">
              文档将被自动切片并进行向量化索引，以便进行语义搜索。
            </p>
            <FileUploader onUploadSuccess={fetchDocuments} />
          </section>

          {/* List Section */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold mb-6 flex items-center justify-between">
              <div className="flex items-center">
                <List className="w-5 h-5 mr-2 text-blue-600" />
                已上传文档
              </div>
              <span className="text-sm font-normal text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                共 {documents.length} 个文件
              </span>
            </h2>
            
            <div className="space-y-3">
              {isLoading ? (
                <div className="text-center py-10 text-gray-400">正在加载文档列表...</div>
              ) : documents.length === 0 ? (
                <div className="text-center py-10 text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
                  暂无上传的文档。
                </div>
              ) : (
                documents.map((doc, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-blue-200 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 truncate max-w-[200px] md:max-w-[300px]" title={doc.filename}>
                          {doc.filename}
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                          <span className="flex items-center gap-1">
                            <HardDrive className="w-3 h-3" /> {formatSize(doc.size)}
                          </span>
                          <span>•</span>
                          <span>{new Date(doc.created_at * 1000).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Search Testing */}
        <div className="lg:col-span-5">
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full sticky top-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Search className="w-5 h-5 mr-2 text-blue-600" />
              检索效果测试
            </h2>
            <p className="text-gray-600 mb-6">
              通过语义搜索验证文档是否已被正确索引。
            </p>
            
            <form onSubmit={handleSearch} className="flex gap-2 mb-6">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="尝试提问关于文档的内容..."
                className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
              <button
                type="submit"
                disabled={isSearching}
                className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
              >
                {isSearching ? '...' : '搜索'}
              </button>
            </form>

            <div className="space-y-4 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
              {searchResults.map((result, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded uppercase tracking-wider">
                      匹配度: {result.score.toFixed(4)}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium truncate">
                      来源: {result.metadata.source}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {result.content}
                  </p>
                </div>
              ))}
              
              {searchResults.length === 0 && !isSearching && searchQuery && (
                <div className="text-center py-20 text-gray-400">
                  在知识库中未找到相关匹配内容。
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
