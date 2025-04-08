'use client';

import { useState } from 'react';

interface MeetingSummaryProps {
  onClose: () => void;
}

export const MeetingSummary = ({ onClose }: MeetingSummaryProps) => {
  const [summary, setSummary] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handleSummaryChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSummary(e.target.value);
  };

  const handleSummarize = () => {
    if (!summary.trim()) return;
    
    // 要約処理を実行中にする
    setIsProcessing(true);
    
    // 実際の要約処理はここに追加予定
    // 開発中のため、タイマーで処理中の表示を模擬
    setTimeout(() => {
      setIsProcessing(false);
    }, 1500);
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-medium">会議要約取り込み</h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
          aria-label="閉じる"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <textarea
        value={summary}
        onChange={handleSummaryChange}
        className="w-full h-40 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-2"
        placeholder="会議の内容を入力してください..."
        disabled={isProcessing}
      />
      
      <div className="flex justify-end">
        <button
          onClick={handleSummarize}
          disabled={isProcessing || !summary.trim()}
          className={`px-4 py-2 rounded ${
            isProcessing || !summary.trim()
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-500 text-white hover:bg-green-600'
          }`}
        >
          {isProcessing ? (
            <div className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              処理中...
            </div>
          ) : (
            "要約する"
          )}
        </button>
      </div>
      
      {isProcessing && (
        <div className="mt-2 text-center text-sm text-gray-500">
          要約機能は現在開発中です
        </div>
      )}
    </div>
  );
}; 