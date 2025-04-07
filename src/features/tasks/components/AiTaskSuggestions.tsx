'use client';

import { useState } from 'react';
import { AITaskSuggestion } from '../types/aiTask';
import { v4 as uuidv4 } from 'uuid';
import { Task } from '../types/task';
import { useProjectContext } from '@/features/projects/contexts/ProjectContext';
import { useTaskContext } from '@/features/tasks/contexts/TaskContext';
import { suggestProjectTasks } from '@/services/api/utils/openai';

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
        id: uuidv4()
      }));
      
      setSuggestions(suggestionsWithIds);
    } catch (err: any) {
      setError(err.message || 'タスク提案の取得中にエラーが発生しました。');
      console.error('Error generating AI task suggestions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToProject = (suggestion: AITaskSuggestion) => {
    if (!currentProject) return;
    
    const newTask: Task = {
      id: uuidv4(),
      title: suggestion.title,
      description: `${suggestion.description}\n\n理由：${suggestion.reason}`,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2週間後
      todos: [],
      projectId: currentProject.id
    };
    
    try {
      // タスクを追加
      onAddTask(newTask);
      
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
          
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {suggestions.map((suggestion) => (
              <div key={suggestion.id} className="border rounded-lg p-3 bg-blue-50">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium text-blue-800">{suggestion.title}</h4>
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
                <p className="text-sm text-gray-700 mt-1">{suggestion.description}</p>
                <div className="mt-2 text-xs text-gray-600 border-t pt-2">
                  <span className="font-medium">提案理由: </span>
                  {suggestion.reason}
                </div>
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