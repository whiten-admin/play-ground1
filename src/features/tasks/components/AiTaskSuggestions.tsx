'use client';

import { useState } from 'react';
import { AITaskSuggestion, AITodoSuggestion } from '../types/aiTask';
import { v4 as uuidv4 } from 'uuid';
import { Task } from '../types/task';
import { useProjectContext } from '@/features/projects/contexts/ProjectContext';
import { useTaskContext } from '@/features/tasks/contexts/TaskContext';
import { suggestProjectTasks, suggestTaskTodos } from '@/services/api/utils/openai';

interface AiTaskSuggestionsProps {
  onAddTask: (task: Task) => void;
}

export const AiTaskSuggestions = ({ onAddTask }: AiTaskSuggestionsProps) => {
  const { currentProject } = useProjectContext();
  const { filteredTasks } = useTaskContext();
  const [suggestions, setSuggestions] = useState<AITaskSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addedTasks, setAddedTasks] = useState<Record<string, boolean>>({});
  const [showSuccess, setShowSuccess] = useState<string | null>(null);
  const [loadingTodos, setLoadingTodos] = useState<Record<string, boolean>>({});

  const handleGenerateSuggestions = async () => {
    if (!currentProject) return;
    
    setIsLoading(true);
    setError(null);
    setAddedTasks({});
    setShowSuccess(null);
    
    try {
      // 現在のタスクのタイトルを抽出
      const currentTaskTitles = filteredTasks.map(task => task.title);
      
      // APIを呼び出してタスク提案を取得
      const aiSuggestions = await suggestProjectTasks({
        title: currentProject.title,
        description: currentProject.description || '',
        currentTasks: currentTaskTitles
      });
      
      // 取得した提案にIDを追加
      const suggestionsWithIds = aiSuggestions.map((suggestion: any) => ({
        ...suggestion,
        id: uuidv4(),
        showTodos: false
      }));
      
      setSuggestions(suggestionsWithIds);
    } catch (err: any) {
      setError(err.message || 'タスク提案の取得中にエラーが発生しました。');
      console.error('Error generating AI task suggestions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowTodos = async (suggestion: AITaskSuggestion) => {
    // すでにTODOがある場合は表示トグル
    if (suggestion.todos && suggestion.todos.length > 0) {
      setSuggestions(prev => 
        prev.map(s => 
          s.id === suggestion.id 
            ? { ...s, showTodos: !s.showTodos } 
            : s
        )
      );
      return;
    }

    // TODOをロード中に設定
    setLoadingTodos(prev => ({ ...prev, [suggestion.id]: true }));
    setError(null);

    try {
      // TODOの提案を取得
      const todoResponse = await suggestTaskTodos({
        title: suggestion.title,
        description: suggestion.description
      });

      // TODOにIDを付与
      const todosWithIds = todoResponse.todos.map((todo: {
        title: string;
        description: string;
        estimatedHours: number;
      }) => ({
        ...todo,
        id: uuidv4()
      }));

      // 提案に追加
      setSuggestions(prev => 
        prev.map(s => 
          s.id === suggestion.id 
            ? { 
                ...s, 
                todos: todosWithIds, 
                totalEstimatedHours: todoResponse.totalEstimatedHours,
                showTodos: true 
              } 
            : s
        )
      );
    } catch (err: any) {
      setError(`TODOの生成に失敗しました: ${err.message || '不明なエラー'}`);
      console.error('Error generating todos:', err);
    } finally {
      setLoadingTodos(prev => ({ ...prev, [suggestion.id]: false }));
    }
  };

  const handleAddToProject = (suggestion: AITaskSuggestion) => {
    if (!currentProject) return;

    try {
      // TODOがある場合はTODO付きでタスクを作成
      if (suggestion.todos && suggestion.todos.length > 0) {
        const todos = suggestion.todos.map(todo => ({
          id: uuidv4(),
          text: todo.title,
          description: todo.description,
          completed: false,
          startDate: new Date(),
          calendarStartDateTime: new Date(),
          calendarEndDateTime: new Date(Date.now() + todo.estimatedHours * 60 * 60 * 1000),
          estimatedHours: todo.estimatedHours,
          actualHours: 0,
          assigneeId: ''
        }));

        const newTask: Task = {
          id: uuidv4(),
          title: suggestion.title,
          description: `${suggestion.description}\n\n理由：${suggestion.reason}`,
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2週間後
          todos: todos,
          projectId: currentProject.id
        };
        
        onAddTask(newTask);
      } else {
        // TODOなしでタスクを作成
        const newTask: Task = {
          id: uuidv4(),
          title: suggestion.title,
          description: `${suggestion.description}\n\n理由：${suggestion.reason}`,
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2週間後
          todos: [],
          projectId: currentProject.id
        };
        
        onAddTask(newTask);
      }
      
      // 追加済みとして記録
      setAddedTasks(prev => ({
        ...prev,
        [suggestion.id]: true
      }));
      
      // 成功メッセージを表示
      setShowSuccess(suggestion.title);
      
      // 3秒後に成功メッセージを消す
      setTimeout(() => {
        setShowSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('タスクの追加に失敗しました:', err);
      setError('タスクの追加に失敗しました。もう一度お試しください。');
    }
  };

  if (suggestions.length === 0 && !isLoading && !error) {
    return (
      <div className="py-4 px-2">
        <button
          onClick={handleGenerateSuggestions}
          className="w-full py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
          </svg>
          AIにタスクを提案してもらう
        </button>
      </div>
    );
  }

  return (
    <div className="py-4 px-2">
      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600">AIがタスクを考えています...</span>
        </div>
      ) : error ? (
        <div>
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <p className="text-red-700">{error}</p>
          </div>
          <button
            onClick={handleGenerateSuggestions}
            className="w-full py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded flex items-center justify-center gap-2"
          >
            再試行する
          </button>
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-800">AIからの提案タスク</h3>
            <button
              onClick={() => setSuggestions([])}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              閉じる
            </button>
          </div>
          
          {showSuccess && (
            <div className="bg-green-50 border-l-4 border-green-500 p-3 mb-4 animate-fade-in">
              <p className="text-green-700 text-sm">「{showSuccess}」タスクを追加しました！</p>
            </div>
          )}
          
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {suggestions.map((suggestion) => (
              <div key={suggestion.id} className="border rounded-lg p-3 bg-blue-50">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium text-blue-800">{suggestion.title}</h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleShowTodos(suggestion)}
                      disabled={loadingTodos[suggestion.id]}
                      className="text-xs py-1 px-2 rounded bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1"
                    >
                      {loadingTodos[suggestion.id] ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                      )}
                      {suggestion.showTodos ? "TODO閉じる" : "TODO確認"}
                    </button>
                    <button
                      onClick={() => handleAddToProject(suggestion)}
                      disabled={addedTasks[suggestion.id]}
                      className={`text-xs py-1 px-2 rounded ${
                        addedTasks[suggestion.id]
                          ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                          : 'bg-blue-500 hover:bg-blue-600 text-white'
                      }`}
                    >
                      {addedTasks[suggestion.id] ? '追加済み' : '追加'}
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-700 mt-1">{suggestion.description}</p>
                
                {suggestion.totalEstimatedHours && (
                  <div className="mt-2 text-xs text-blue-700 font-medium">
                    合計工数: {suggestion.totalEstimatedHours}時間
                  </div>
                )}
                
                <div className="mt-2 text-xs text-gray-600 border-t pt-2">
                  <span className="font-medium">提案理由: </span>
                  {suggestion.reason}
                </div>
                
                {/* TODO表示エリア */}
                {suggestion.showTodos && suggestion.todos && (
                  <div className="mt-3 border-t pt-3">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">必要なTODO:</h5>
                    <div className="space-y-2">
                      {suggestion.todos.map((todo) => (
                        <div key={todo.id} className="p-2 bg-white rounded border border-blue-100">
                          <div className="flex justify-between">
                            <h6 className="text-sm font-medium">{todo.title}</h6>
                            <span className="text-xs text-blue-600">{todo.estimatedHours}時間</span>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">{todo.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <button
            onClick={handleGenerateSuggestions}
            className="mt-4 w-full py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            再生成する
          </button>
        </div>
      )}
    </div>
  );
}; 