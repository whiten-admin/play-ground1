'use client';

import { useState } from 'react';
import { useTaskContext } from '@/features/tasks/contexts/TaskContext';
import { useProjectContext } from '@/features/projects/contexts/ProjectContext';
import { exportTasksAsJson, importTasksFromJson } from '@/services/storage/utils/seedDataUtils';

export default function DataManagement() {
  const { tasks, setTasks, resetTasks, clearAllTasks } = useTaskContext();
  const { clearAllProjects, resetToDefaultProjects } = useProjectContext();
  const [importData, setImportData] = useState('');
  const [message, setMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);

  // データをJSON形式でエクスポート
  const handleExport = () => {
    try {
      const jsonData = exportTasksAsJson(tasks);
      
      // ダウンロードリンクを作成
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tasks_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      
      // クリーンアップ
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setMessage({ text: 'データのエクスポートが完了しました', type: 'success' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ text: 'エクスポートに失敗しました', type: 'error' });
    }
  };

  // インポートするデータの変更ハンドラ
  const handleImportDataChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setImportData(e.target.value);
  };

  // データをインポート
  const handleImport = () => {
    try {
      if (!importData.trim()) {
        setMessage({ text: 'インポートするデータを入力してください', type: 'error' });
        return;
      }
      
      const importedTasks = importTasksFromJson(importData);
      if (!importedTasks) {
        setMessage({ text: '無効なデータ形式です', type: 'error' });
        return;
      }
      
      setTasks(importedTasks);
      setMessage({ text: 'データのインポートが完了しました', type: 'success' });
      setImportData('');
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ text: 'インポートに失敗しました', type: 'error' });
    }
  };

  // データをリセット（タスクとプロジェクト両方）
  const handleReset = () => {
    if (window.confirm('本当にタスクとプロジェクトのデータを初期状態にリセットしますか？この操作は元に戻せません。')) {
      resetTasks();
      resetToDefaultProjects();
      setMessage({ text: 'タスクとプロジェクトのデータを初期状態にリセットしました', type: 'success' });
      setTimeout(() => setMessage(null), 3000);
    }
  };
  
  // データをすべてクリア（タスクとプロジェクト両方）
  const handleClearAll = () => {
    if (window.confirm('本当にすべてのタスクとプロジェクトのデータをクリアしますか？この操作は元に戻せません。')) {
      clearAllTasks();
      clearAllProjects();
      setMessage({ text: 'すべてのタスクとプロジェクトのデータをクリアしました', type: 'success' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  // ファイルからのインポート
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonData = event.target?.result as string;
        const importedTasks = importTasksFromJson(jsonData);
        
        if (!importedTasks) {
          setMessage({ text: '無効なデータ形式です', type: 'error' });
          return;
        }
        
        setTasks(importedTasks);
        setMessage({ text: 'ファイルからのインポートが完了しました', type: 'success' });
        setTimeout(() => setMessage(null), 3000);
      } catch (error) {
        setMessage({ text: 'ファイルの読み込みに失敗しました', type: 'error' });
      }
    };
    
    reader.readAsText(file);
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4">      
      {/* メッセージ表示 */}
      {message && (
        <div className={`p-2 mb-4 rounded ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}
      
      <div className="flex flex-col gap-4">
        {/* リセットとクリアのボタン */}
        <div className="flex gap-4">
          <div>
            <button
              onClick={handleReset}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
            >
              初期データにリセット
            </button>
            <p className="text-xs text-gray-500 mt-1">
              タスクとプロジェクトのデータが初期状態に戻ります
            </p>
          </div>
          
          <div>
            <button
              onClick={handleClearAll}
              className="bg-red-700 text-white px-4 py-2 rounded hover:bg-red-800 transition-colors"
            >
              データを全てクリア
            </button>
            <p className="text-xs text-gray-500 mt-1">
              すべてのタスクとプロジェクトのデータが削除されます
            </p>
          </div>
        </div>
        
        {/* エクスポートボタン */}
        <div>
          <button
            onClick={handleExport}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            データをエクスポート
          </button>
          <p className="text-xs text-gray-500 mt-1">
            現在のタスクデータをJSONファイルとして保存します
          </p>
        </div>
        
        {/* ファイルからインポート */}
        <div>
          <label className="block mb-1">ファイルからインポート:</label>
          <input
            type="file"
            accept=".json"
            onChange={handleFileImport}
            className="w-full border rounded p-2"
          />
        </div>
        
        {/* テキスト入力からインポート */}
        <div>
          <label className="block mb-1">JSONデータからインポート:</label>
          <textarea
            value={importData}
            onChange={handleImportDataChange}
            className="w-full border rounded p-2 h-32"
            placeholder="JSONデータを貼り付けてください"
          />
          <button
            onClick={handleImport}
            className="mt-2 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
          >
            データをインポート
          </button>
        </div>
      </div>
    </div>
  );
} 