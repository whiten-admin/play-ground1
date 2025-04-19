'use client';

import { useState, useRef, ChangeEvent } from 'react';

interface TaskFromMinutesProps {
  onClose: () => void;
}

interface Task {
  id: string;
  name: string;
  description: string;
  dueDate: string;
  estimatedHours: number;
  todos: string[];
  assignee: string;
  selected: boolean;
}

export const TaskFromMinutes = ({ onClose }: TaskFromMinutesProps) => {
  const [minutes, setMinutes] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [inputMethod, setInputMethod] = useState<'text' | 'file'>('text');
  const [extractedTasks, setExtractedTasks] = useState<Task[]>([]);
  const [showTaskConfirmation, setShowTaskConfirmation] = useState<boolean>(false);
  const [newTask, setNewTask] = useState<Omit<Task, 'id' | 'selected'>>({
    name: '',
    description: '',
    dueDate: '',
    estimatedHours: 0,
    todos: [],
    assignee: '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleMinutesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMinutes(e.target.value);
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setMinutes(content || '');
    };
    reader.readAsText(file);
  };

  const handleExtractTasks = async () => {
    if (!minutes.trim()) return;
    
    setIsProcessing(true);
    
    try {
      // ChatGPTのAPIを呼び出して議事録からタスクを抽出
      // 実際のAPI呼び出しはここに実装
      // 現在は模擬データを使用
      setTimeout(() => {
        const mockTasks: Task[] = [
          {
            id: '1',
            name: 'デザイン修正',
            description: 'ホーム画面のレイアウトを調整する',
            dueDate: '2023-12-15',
            estimatedHours: 4,
            todos: ['ワイヤーフレーム確認', 'デザイン変更', 'レビュー依頼'],
            assignee: '佐藤',
            selected: true
          },
          {
            id: '2',
            name: 'バグ修正',
            description: 'ログイン画面のエラーハンドリングを改善',
            dueDate: '2023-12-10',
            estimatedHours: 2,
            todos: ['原因調査', '修正', 'テスト'],
            assignee: '',
            selected: true
          }
        ];
        
        setExtractedTasks(mockTasks);
        setShowTaskConfirmation(true);
        setIsProcessing(false);
      }, 1500);
    } catch (error) {
      console.error('タスク抽出エラー:', error);
      setIsProcessing(false);
    }
  };

  const handleTaskSelectionChange = (taskId: string) => {
    setExtractedTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId ? { ...task, selected: !task.selected } : task
      )
    );
  };

  const handleAddNewTask = () => {
    const newTaskWithId: Task = {
      ...newTask,
      id: Date.now().toString(),
      selected: true
    };
    
    setExtractedTasks(prevTasks => [...prevTasks, newTaskWithId]);
    setNewTask({
      name: '',
      description: '',
      dueDate: '',
      estimatedHours: 0,
      todos: [],
      assignee: '',
    });
  };

  const handleCreateTasks = () => {
    // 選択されたタスクを実際に作成する処理
    const selectedTasks = extractedTasks.filter(task => task.selected);
    console.log('作成するタスク:', selectedTasks);
    
    // タスク作成処理が完了したら閉じる
    onClose();
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-medium">議事録からタスク生成</h3>
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

      {!showTaskConfirmation ? (
        <>
          <div className="mb-4">
            <div className="flex space-x-4 mb-2">
              <button
                onClick={() => setInputMethod('text')}
                className={`px-3 py-1 rounded ${
                  inputMethod === 'text'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                テキスト入力
              </button>
              <button
                onClick={() => setInputMethod('file')}
                className={`px-3 py-1 rounded ${
                  inputMethod === 'file'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                ファイルアップロード
              </button>
            </div>

            {inputMethod === 'text' ? (
              <textarea
                value={minutes}
                onChange={handleMinutesChange}
                className="w-full h-40 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-2"
                placeholder="議事録の内容を入力してください..."
                disabled={isProcessing}
              />
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".txt,.doc,.docx,.pdf"
                  disabled={isProcessing}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  disabled={isProcessing}
                >
                  ファイルを選択
                </button>
                <p className="mt-2 text-sm text-gray-500">
                  {minutes ? '選択済み' : '対応形式: TXT, DOC, DOCX, PDF'}
                </p>
                {minutes && (
                  <div className="mt-2 p-2 bg-gray-100 rounded max-h-32 overflow-y-auto">
                    <p className="text-sm text-gray-700">{minutes.substring(0, 100)}...</p>
                  </div>
                )}
              </div>
            )}
          </div>
      
          <div className="flex justify-end">
            <button
              onClick={handleExtractTasks}
              disabled={isProcessing || !minutes.trim()}
              className={`px-4 py-2 rounded ${
                isProcessing || !minutes.trim()
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
                "タスクを抽出する"
              )}
            </button>
          </div>
        </>
      ) : (
        <div>
          <h4 className="font-medium mb-2">抽出されたタスク</h4>
          <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
            {extractedTasks.map(task => (
              <div key={task.id} className="border rounded p-3">
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id={`task-${task.id}`}
                    checked={task.selected}
                    onChange={() => handleTaskSelectionChange(task.id)}
                    className="mt-1 mr-2"
                  />
                  <div className="flex-1">
                    <label htmlFor={`task-${task.id}`} className="font-medium">{task.name}</label>
                    <p className="text-sm text-gray-600">{task.description}</p>
                    <div className="flex flex-wrap text-xs text-gray-500 mt-1">
                      <span className="mr-3">期日: {task.dueDate || '未設定'}</span>
                      <span className="mr-3">工数: {task.estimatedHours}時間</span>
                      <span>担当: {task.assignee || '未定'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mb-4 border-t pt-3">
            <h4 className="font-medium mb-2">タスクを追加</h4>
            <div className="space-y-2">
              <input
                type="text"
                value={newTask.name}
                onChange={(e) => setNewTask({...newTask, name: e.target.value})}
                placeholder="タスク名"
                className="w-full p-2 border rounded"
              />
              <textarea
                value={newTask.description}
                onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                placeholder="概要"
                className="w-full p-2 border rounded h-20"
              />
              <div className="flex space-x-2">
                <input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                  className="p-2 border rounded flex-1"
                />
                <input
                  type="number"
                  value={newTask.estimatedHours}
                  onChange={(e) => setNewTask({...newTask, estimatedHours: Number(e.target.value)})}
                  placeholder="工数（時間）"
                  min="0"
                  className="p-2 border rounded flex-1"
                />
                <input
                  type="text"
                  value={newTask.assignee}
                  onChange={(e) => setNewTask({...newTask, assignee: e.target.value})}
                  placeholder="担当者"
                  className="p-2 border rounded flex-1"
                />
              </div>
              <button
                onClick={handleAddNewTask}
                disabled={!newTask.name}
                className={`px-3 py-1 rounded ${
                  !newTask.name
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                追加
              </button>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <button
              onClick={() => {
                setShowTaskConfirmation(false);
                setExtractedTasks([]);
              }}
              className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100"
            >
              戻る
            </button>
            <button
              onClick={handleCreateTasks}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              disabled={!extractedTasks.some(task => task.selected)}
            >
              タスクを生成する
            </button>
          </div>
        </div>
      )}
      
      {isProcessing && !showTaskConfirmation && (
        <div className="mt-2 text-center text-sm text-gray-500">
          AIによるタスク抽出処理中です...
        </div>
      )}
    </div>
  );
}; 