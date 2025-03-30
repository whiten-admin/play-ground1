'use client';

import React, { useState } from 'react';
import { IoAdd, IoTrash, IoBulb } from 'react-icons/io5';
import { Task, Todo } from '@/features/tasks/types/task';
import { suggestTodos } from '@/services/api/utils/openai';
import UserAssignSelect from '@/components/UserAssignSelect';

interface TaskCreationFormProps {
  onCancel: () => void;
  onTaskCreate: (task: Task) => void;
  projectId?: string;
  title?: string;
  initialTask?: Partial<Task>;
}

export default function TaskCreationForm({
  onCancel,
  onTaskCreate,
  projectId,
  title = "新しいタスクを作成",
  initialTask
}: TaskCreationFormProps) {
  const [newTask, setNewTask] = useState<Partial<Task>>(initialTask || {
    title: '',
    description: '',
    todos: [],
    dueDate: new Date(new Date().setDate(new Date().getDate() + 7)) // 1週間後をデフォルトの期日に
  });

  const [newTaskTodos, setNewTaskTodos] = useState<Todo[]>([]);
  const [newTaskTodoText, setNewTaskTodoText] = useState('');
  const [isGeneratingTodos, setIsGeneratingTodos] = useState(false);
  const [newTaskSuggestedTodos, setNewTaskSuggestedTodos] = useState<{ text: string; estimatedHours: number }[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 新規タスクにTODOを追加
  const handleAddNewTaskTodo = () => {
    if (!newTaskTodoText.trim()) return;

    const today = new Date();
    
    const newTodo: Todo = {
      id: `todo-${Date.now()}`,
      text: newTaskTodoText.trim(),
      completed: false,
      startDate: today,
      calendarStartDateTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0, 0),
      calendarEndDateTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0, 0),
      estimatedHours: 1, // デフォルトの見積もり工数を1時間に設定
      actualHours: 0,
      assigneeId: ''
    };

    setNewTaskTodos([...newTaskTodos, newTodo]);
    setNewTaskTodoText('');
  };

  // 新規タスクからTODOを削除
  const handleRemoveNewTaskTodo = (todoId: string) => {
    setNewTaskTodos(newTaskTodos.filter(todo => todo.id !== todoId));
  };

  // 新規タスク用のTODO提案を取得
  const handleSuggestNewTaskTodos = async () => {
    if (!newTask.title) return;

    try {
      setIsGeneratingTodos(true);
      const suggestions = await suggestTodos(
        newTask.title,
        newTask.description || '',
        newTaskTodos.map(todo => todo.text)
      );
      setNewTaskSuggestedTodos(suggestions);
    } catch (error) {
      console.error('Error getting todo suggestions:', error);
      setErrorMessage(error instanceof Error ? error.message : 'TODOの提案中にエラーが発生しました。');
    } finally {
      setIsGeneratingTodos(false);
    }
  };

  // 提案されたTODOを新規タスクに追加
  const handleAddSuggestedNewTaskTodo = (suggestion: { text: string; estimatedHours: number }) => {
    const today = new Date();
    
    const newTodo: Todo = {
      id: `todo-${Date.now()}`,
      text: suggestion.text,
      completed: false,
      startDate: today,
      calendarStartDateTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0, 0),
      calendarEndDateTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9 + Math.min(8, suggestion.estimatedHours), 0, 0),
      estimatedHours: suggestion.estimatedHours,
      actualHours: 0,
      assigneeId: ''
    };

    setNewTaskTodos([...newTaskTodos, newTodo]);
    
    // 追加したTODOを提案リストから削除
    setNewTaskSuggestedTodos(prev => prev.filter(todo => todo.text !== suggestion.text));
  };

  // 新しいタスクを作成する関数
  const handleCreateTask = () => {
    if (!newTask.title) return;

    const dueDate = newTask.dueDate || new Date(new Date().setDate(new Date().getDate() + 7));

    const taskToCreate: Task = {
      id: `task-${Date.now()}`,
      title: newTask.title,
      description: newTask.description || '',
      todos: newTaskTodos.length > 0 ? newTaskTodos : getDefaultTodos(dueDate),
      dueDate: dueDate,
      completedDateTime: undefined,
      projectId: projectId || ''
    };

    onTaskCreate(taskToCreate);
  };

  // デフォルトのTODOを生成
  const getDefaultTodos = (dueDate: Date): Todo[] => {
    const today = new Date();
    const dueDateCopy = new Date(dueDate);
    
    return [
      {
        id: `todo-${Date.now()}-1`,
        text: '開始',
        completed: false,
        startDate: today,
        calendarStartDateTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0, 0),
        calendarEndDateTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0, 0),
        estimatedHours: 1,
        actualHours: 0,
        assigneeId: ''
      },
      {
        id: `todo-${Date.now()}-2`,
        text: '完了',
        completed: false,
        startDate: dueDateCopy,
        calendarStartDateTime: new Date(dueDateCopy.getFullYear(), dueDateCopy.getMonth(), dueDateCopy.getDate(), 15, 0, 0),
        calendarEndDateTime: new Date(dueDateCopy.getFullYear(), dueDateCopy.getMonth(), dueDateCopy.getDate(), 17, 0, 0),
        estimatedHours: 1,
        actualHours: 0,
        assigneeId: ''
      }
    ];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">タイトル</label>
            <input
              type="text"
              value={newTask.title}
              onChange={(e) => setNewTask({...newTask, title: e.target.value})}
              className="w-full p-2 border rounded-md"
              placeholder="タスクのタイトルを入力"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">説明</label>
            <textarea
              value={newTask.description}
              onChange={(e) => setNewTask({...newTask, description: e.target.value})}
              className="w-full p-2 border rounded-md h-24"
              placeholder="タスクの説明を入力"
            />
          </div>
          
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">期日</label>
              <input
                type="date"
                value={newTask.dueDate instanceof Date ? newTask.dueDate.toISOString().split('T')[0] : ''}
                onChange={(e) => setNewTask({...newTask, dueDate: new Date(e.target.value)})}
                className="w-full p-2 border rounded-md"
              />
            </div>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">TODOリスト</label>
              <button
                onClick={handleSuggestNewTaskTodos}
                disabled={!newTask.title || isGeneratingTodos}
                className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${
                  !newTask.title || isGeneratingTodos
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-yellow-500 text-white hover:bg-yellow-600'
                }`}
                title="AIにTODOを提案してもらう"
              >
                <IoBulb className="w-3 h-3" />
                AI提案
              </button>
            </div>
            
            <div className="space-y-2 mb-2">
              {newTaskTodos.map((todo) => (
                <div key={todo.id} className="flex items-center justify-between bg-gray-50 p-2 rounded border">
                  <div className="flex-1">
                    <div className="text-sm text-gray-800">{todo.text}</div>
                    <div className="text-xs text-gray-500">
                      見積もり工数: {todo.estimatedHours}時間
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveNewTaskTodo(todo.id)}
                    className="ml-2 text-red-500 hover:text-red-700"
                  >
                    <IoTrash className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            
            <div className="flex items-center">
              <input
                type="text"
                value={newTaskTodoText}
                onChange={(e) => setNewTaskTodoText(e.target.value)}
                placeholder="新しいTODOを追加"
                className="flex-1 p-2 border rounded-l-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddNewTaskTodo();
                  }
                }}
              />
              <button
                onClick={handleAddNewTaskTodo}
                disabled={!newTaskTodoText.trim()}
                className={`p-2 rounded-r-md ${
                  !newTaskTodoText.trim()
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                <IoAdd className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* AI提案のTODOリスト */}
          {isGeneratingTodos && (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-yellow-500"></div>
              <p className="mt-2 text-sm text-gray-600">TODOを生成中...</p>
            </div>
          )}

          {newTaskSuggestedTodos.length > 0 && (
            <div className="p-3 bg-yellow-50 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <IoBulb className="w-4 h-4" />
                AIからのTODO提案
              </h4>
              <div className="space-y-2">
                {newTaskSuggestedTodos.map((suggestion, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-white p-2 rounded border border-yellow-200"
                  >
                    <div className="flex-1">
                      <div className="text-sm text-gray-800">{suggestion.text}</div>
                      <div className="text-xs text-gray-500">
                        見積もり工数: {suggestion.estimatedHours}時間
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddSuggestedNewTaskTodo(suggestion)}
                      className="ml-2 px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                      title="このTODOを採用"
                    >
                      採用
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            キャンセル
          </button>
          <button
            onClick={handleCreateTask}
            disabled={!newTask.title}
            className={`px-4 py-2 rounded-md ${
              !newTask.title
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            作成
          </button>
        </div>
      </div>
    </div>
  );
} 