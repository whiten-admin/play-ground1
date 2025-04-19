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
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [newTask, setNewTask] = useState<Omit<Task, 'id' | 'selected'>>({
    name: '',
    description: '',
    dueDate: '',
    estimatedHours: 0,
    todos: [],
    assignee: '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const todoInputRef = useRef<HTMLInputElement>(null);
  const [currentTodo, setCurrentTodo] = useState<string>('');

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
    setError(null);
    
    try {
      // APIを呼び出して議事録からタスクを抽出
      const response = await fetch('/api/extract-tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ minutes }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'タスク抽出中にエラーが発生しました。');
      }
      
      const data = await response.json();
      // APIから返されたタスクに「selected」プロパティを追加
      const tasksWithSelection = data.tasks.map((task: any) => ({
        ...task,
        id: `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        selected: true
      }));
      
      setExtractedTasks(tasksWithSelection);
      setCurrentStep(2);
    } catch (error: any) {
      console.error('タスク抽出エラー:', error);
      setError(error.message || 'タスク抽出中にエラーが発生しました。再試行してください。');
    } finally {
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

  const handleAddTodo = () => {
    if (!currentTodo.trim()) return;
    
    setNewTask(prev => ({
      ...prev,
      todos: [...prev.todos, currentTodo.trim()]
    }));
    
    setCurrentTodo('');
    if (todoInputRef.current) {
      todoInputRef.current.focus();
    }
  };

  const handleRemoveTodo = (index: number) => {
    setNewTask(prev => ({
      ...prev,
      todos: prev.todos.filter((_, i) => i !== index)
    }));
  };

  const handleEditTaskTodo = (taskId: string, todoIndex: number, newValue: string) => {
    setExtractedTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId 
          ? { 
              ...task, 
              todos: task.todos.map((todo, i) => i === todoIndex ? newValue : todo) 
            } 
          : task
      )
    );
  };

  const handleRemoveTaskTodo = (taskId: string, todoIndex: number) => {
    setExtractedTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId 
          ? { 
              ...task, 
              todos: task.todos.filter((_, i) => i !== todoIndex) 
            } 
          : task
      )
    );
  };

  const handleAddTaskTodo = (taskId: string, newTodo: string) => {
    if (!newTodo.trim()) return;
    
    setExtractedTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId 
          ? { 
              ...task, 
              todos: [...task.todos, newTodo.trim()] 
            } 
          : task
      )
    );
  };

  const handleAddNewTask = () => {
    if (!newTask.name.trim()) return;
    
    const newTaskWithId: Task = {
      ...newTask,
      id: `new-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
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

  const handleCreateTasks = async () => {
    const selectedTasks = extractedTasks.filter(task => task.selected);
    if (selectedTasks.length === 0) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      // APIを呼び出してタスクを作成
      const response = await fetch('/api/create-tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tasks: selectedTasks }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'タスク作成中にエラーが発生しました。');
      }
      
      // 処理成功後に閉じる
      setTimeout(() => {
        setIsProcessing(false);
        setCurrentStep(3);
      }, 500);
    } catch (error: any) {
      console.error('タスク作成エラー:', error);
      setError(error.message || 'タスク作成中にエラーが発生しました。再試行してください。');
      setIsProcessing(false);
    }
  };

  // ステップに戻る
  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // ステッパーのレンダリング
  const renderStepper = () => {
    return (
      <div className="flex items-center justify-center mb-6">
        <div className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            currentStep >= 1 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            1
          </div>
          <div className={`h-1 w-12 ${currentStep >= 2 ? 'bg-blue-500' : 'bg-gray-200'}`}></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            currentStep >= 2 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            2
          </div>
          <div className={`h-1 w-12 ${currentStep >= 3 ? 'bg-blue-500' : 'bg-gray-200'}`}></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            currentStep >= 3 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            3
          </div>
        </div>
      </div>
    );
  };

  // ステップ名のレンダリング
  const renderStepTitle = () => {
    switch (currentStep) {
      case 1:
        return "議事録入力";
      case 2:
        return "タスク編集・確認";
      case 3:
        return "完了";
      default:
        return "";
    }
  };

  // 最終ステップの完了画面
  const renderCompletionStep = () => {
    return (
      <div className="text-center py-10">
        <div className="mb-6">
          <svg className="w-16 h-16 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        <h3 className="text-xl font-medium mb-2">タスク生成が完了しました</h3>
        <p className="text-gray-600 mb-6">{extractedTasks.filter(task => task.selected).length}件のタスクが正常に作成されました。</p>
        <button
          onClick={onClose}
          className="px-5 py-2.5 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          閉じる
        </button>
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-medium">議事録からタスク生成</h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
          aria-label="閉じる"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {renderStepper()}
      
      <h4 className="text-lg font-medium mb-4 text-center text-blue-600">{renderStepTitle()}</h4>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">
          <p>{error}</p>
        </div>
      )}

      {currentStep === 1 && (
        <>
          <div className="mb-6">
            <div className="flex space-x-4 mb-3">
              <button
                onClick={() => setInputMethod('text')}
                className={`px-4 py-2 rounded-md text-base ${
                  inputMethod === 'text'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                テキスト入力
              </button>
              <button
                onClick={() => setInputMethod('file')}
                className={`px-4 py-2 rounded-md text-base ${
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
                className="w-full h-56 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-3 text-base"
                placeholder="議事録の内容を入力してください..."
                disabled={isProcessing}
              />
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
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
                  className="px-5 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-base"
                  disabled={isProcessing}
                >
                  ファイルを選択
                </button>
                <p className="mt-3 text-base text-gray-500">
                  {minutes ? '選択済み' : '対応形式: TXT, DOC, DOCX, PDF'}
                </p>
                {minutes && (
                  <div className="mt-3 p-3 bg-gray-100 rounded-md max-h-40 overflow-y-auto text-left">
                    <p className="text-base text-gray-700">{minutes.substring(0, 200)}{minutes.length > 200 ? '...' : ''}</p>
                  </div>
                )}
              </div>
            )}
          </div>
      
          <div className="flex justify-end">
            <button
              onClick={handleExtractTasks}
              disabled={isProcessing || !minutes.trim()}
              className={`px-5 py-2.5 rounded-md text-base ${
                isProcessing || !minutes.trim()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              {isProcessing ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
      )}
      
      {currentStep === 2 && (
        <div className="grid grid-cols-1 gap-6">
          <div>
            <h4 className="text-lg font-medium mb-3">抽出されたタスク</h4>
            {extractedTasks.length === 0 ? (
              <div className="text-center p-6 border rounded-md bg-gray-50">
                <p className="text-gray-500 text-base">タスクが見つかりませんでした。</p>
                <button
                  onClick={goBack}
                  className="mt-3 text-blue-500 underline text-base"
                >
                  別の議事録で試す
                </button>
              </div>
            ) : (
              <div className="space-y-4 mb-6 max-h-96 overflow-y-auto pr-2">
                {extractedTasks.map(task => (
                  <div key={task.id} className="border rounded-md p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start">
                      <input
                        type="checkbox"
                        id={`task-${task.id}`}
                        checked={task.selected}
                        onChange={() => handleTaskSelectionChange(task.id)}
                        className="mt-1.5 mr-3 h-4 w-4"
                      />
                      <div className="flex-1">
                        <label htmlFor={`task-${task.id}`} className="text-base font-medium">{task.name}</label>
                        <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                        
                        {task.todos && task.todos.length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm font-medium text-gray-500">TODO項目:</p>
                            <ul className="pl-5 mt-2 space-y-1.5 text-sm list-disc">
                              {task.todos.map((todo, idx) => (
                                <li key={idx} className="flex items-center group">
                                  <span className="flex-1">{todo}</span>
                                  <button 
                                    onClick={() => handleRemoveTaskTodo(task.id, idx)} 
                                    className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        <div className="flex flex-wrap text-sm text-gray-500 mt-3">
                          <span className="mr-4 mb-1">期日: {task.dueDate || '未設定'}</span>
                          <span className="mr-4 mb-1">工数: {task.estimatedHours || 0}時間</span>
                          <span className="mb-1">担当: {task.assignee || '未定'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-between space-x-3 pt-4 border-t mt-4">
            <button
              onClick={goBack}
              className="px-5 py-2.5 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 text-base"
            >
              前へ戻る
            </button>
            <button
              onClick={handleCreateTasks}
              disabled={isProcessing || !extractedTasks.some(task => task.selected)}
              className={`px-5 py-2.5 rounded-md text-base ${
                isProcessing || !extractedTasks.some(task => task.selected)
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              {isProcessing ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  処理中...
                </div>
              ) : (
                "タスクを生成する"
              )}
            </button>
          </div>
        </div>
      )}

      {currentStep === 3 && renderCompletionStep()}
      
      {isProcessing && currentStep === 1 && (
        <div className="mt-3 text-center text-base text-gray-500">
          AIによるタスク抽出処理中です...
        </div>
      )}
    </div>
  );
}; 