import React, { useState } from 'react';
import { Upload, X, CheckCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { clsx } from 'clsx';

interface FileUploaderProps {
  onUploadSuccess?: () => void;
}

export function FileUploader({ onUploadSuccess }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.pdf')) {
      alert('仅支持上传 PDF 文件');
      return;
    }

    setFileName(file.name);
    setUploadStatus('uploading');

    const formData = new FormData();
    formData.append('file', file);

    try {
      await axios.post('/api/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadStatus('success');
      onUploadSuccess?.();
      setTimeout(() => setUploadStatus('idle'), 3000);
    } catch (error) {
      console.error('上传失败:', error);
      setUploadStatus('error');
    }
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
      }}
      className={clsx(
        "border-2 border-dashed rounded-xl p-8 transition-all flex flex-col items-center justify-center gap-4 text-center cursor-pointer",
        isDragging ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300 hover:bg-gray-50",
        uploadStatus === 'uploading' && "pointer-events-none opacity-70"
      )}
      onClick={() => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.pdf';
        input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) handleFile(file);
        };
        input.click();
      }}
    >
      {uploadStatus === 'idle' && (
        <>
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">点击上传或拖拽 PDF 文件至此</p>
            <p className="text-xs text-gray-500 mt-1">支持最大 50MB 的 PDF 文件</p>
          </div>
        </>
      )}

      {uploadStatus === 'uploading' && (
        <>
          <div className="w-12 h-12 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-sm font-medium text-blue-600">正在解析并索引 {fileName}...</p>
        </>
      )}

      {uploadStatus === 'success' && (
        <>
          <CheckCircle className="w-12 h-12 text-green-500" />
          <p className="text-sm font-medium text-green-600">上传成功并已加入知识库</p>
        </>
      )}

      {uploadStatus === 'error' && (
        <>
          <AlertCircle className="w-12 h-12 text-red-500" />
          <p className="text-sm font-medium text-red-600">上传失败，请稍后重试</p>
        </>
      )}
    </div>
  );
}
