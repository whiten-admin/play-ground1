'use client';

import { useTaskContext } from '@/contexts/TaskContext';
import { useEffect, useRef, useState } from 'react';
import { IoAdd, IoBulb, IoTrash } from 'react-icons/io5';
import { Task, Todo } from '@/types/task';
import { suggestTodos } from '@/utils/openai';
import ScheduleTodosButton from './ScheduleTodosButton';

interface WBSViewProps {
  onTaskCreate?: (newTask: Task) => void;
  onTaskSelect: (taskId: string) => void;
}

export default function WBSView({ onTaskCreate, onTaskSelect }: WBSViewProps) {
  const { tasks } = useTaskContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: '',
    description: '',
    todos: [],
    priority: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0] // デフォルトで1週間後
  });
  const [newTaskTodos, setNewTaskTodos] = useState<Todo[]>([]);
  const [newTaskTodoText, setNewTaskTodoText] = useState('');
  const [isGeneratingTodos, setIsGeneratingTodos] = useState(false);
  const [newTaskSuggestedTodos, setNewTaskSuggestedTodos] = useState<{ text: string; estimatedHours: number }[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const getDaysBetween = (startDate: Date, endDate: Date) => {
    return Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
  };

  const getDatePosition = (date: Date) => {
    const startDate = new Date('2025-03-01'); // 基準日
    return getDaysBetween(startDate, date);
  };

  // 今日の日付の位置を計算
  const today = new Date();
  const todayPosition = getDatePosition(today);

  // コンポーネントがマウントされた時に、今日の日付が左端に来るようにスクロール
  useEffect(() => {
    if (containerRef.current) {
      const columnWidth = containerRef.current.scrollWidth / 30; // 1日分の幅
      const scrollPosition = (todayPosition - 4) * columnWidth; // 4日分左に余裕を持たせる
      containerRef.current.scrollLeft = scrollPosition;
    }
  }, [todayPosition]);

  // 新しいタスクを作成する関数
  const handleCreateTask = () => {
    if (!newTask.title) return;

    const startDate = newTask.startDate || new Date().toISOString().split('T')[0];
    const endDate = newTask.endDate || new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0];

    const taskToCreate: Task = {
      id: `task-${Date.now()}`,
      title: newTask.title,
      description: newTask.description || '',
      todos: newTaskTodos.length > 0 ? newTaskTodos : getDefaultTodos(startDate, endDate),
      startDate: startDate,
      endDate: endDate,
      priority: newTask.priority || 0
    };

    onTaskCreate?.(taskToCreate);
    setIsCreatingTask(false);
    setNewTask({
      title: '',
      description: '',
      todos: [],
      priority: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0]
    });
    setNewTaskTodos([]);
    setNewTaskTodoText('');
    setNewTaskSuggestedTodos([]);
  };

  // デフォルトのTODOを生成
  const getDefaultTodos = (startDate: string, endDate: string): Todo[] => {
    return [
      {
        id: `todo-${Date.now()}-1`,
        text: '開始',
        completed: false,
        startDate: startDate,
        endDate: startDate,
        dueDate: new Date(startDate),
        estimatedHours: 1
      },
      {
        id: `todo-${Date.now()}-2`,
        text: '完了',
        completed: false,
        startDate: endDate,
        endDate: endDate,
        dueDate: new Date(endDate),
        estimatedHours: 1
      }
    ];
  };

  // 新規タスクにTODOを追加
  const handleAddNewTaskTodo = () => {
    if (!newTaskTodoText.trim()) return;

    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0]; // YYYY-MM-DD形式
    
    const newTodo: Todo = {
      id: `todo-${Date.now()}`,
      text: newTaskTodoText.trim(),
      completed: false,
      startDate: formattedDate,
      endDate: formattedDate,
      dueDate: new Date(),
      estimatedHours: 1 // デフォルトの見積もり工数を1時間に設定
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
    const formattedDate = today.toISOString().split('T')[0]; // YYYY-MM-DD形式
    
    const newTodo: Todo = {
      id: `todo-${Date.now()}`,
      text: suggestion.text,
      completed: false,
      startDate: formattedDate,
      endDate: formattedDate,
      dueDate: new Date(),
      estimatedHours: suggestion.estimatedHours
    };

    setNewTaskTodos([...newTaskTodos, newTodo]);
    
    // 追加したTODOを提案リストから削除
    setNewTaskSuggestedTodos(prev => prev.filter(todo => todo.text !== suggestion.text));
  };

  // タスク作成フォームをレンダリングする関数
  const renderTaskCreationForm = () => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
          <h2 className="text-xl font-bold mb-4">新しいタスクを作成（ガントチャート）</h2>
          
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
                <label className="block text-sm font-medium text-gray-700 mb-1">開始日</label>
                <input
                  type="date"
                  value={newTask.startDate}
                  onChange={(e) => setNewTask({...newTask, startDate: e.target.value})}
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">終了日</label>
                <input
                  type="date"
                  value={newTask.endDate}
                  onChange={(e) => setNewTask({...newTask, endDate: e.target.value})}
                  className="w-full p-2 border rounded-md"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">優先度</label>
              <select
                value={newTask.priority}
                onChange={(e) => setNewTask({...newTask, priority: Number(e.target.value)})}
                className="w-full p-2 border rounded-md"
              >
                <option value={0}>低</option>
                <option value={1}>中</option>
                <option value={2}>高</option>
              </select>
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
              onClick={() => {
                setIsCreatingTask(false);
                setNewTaskTodos([]);
                setNewTaskTodoText('');
                setNewTaskSuggestedTodos([]);
              }}
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
  };

  return (
    <div className="overflow-x-auto relative" ref={containerRef}>
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium text-gray-700">ガントチャート</h3>
        <div className="flex items-center gap-2">
          <ScheduleTodosButton 
            onScheduleComplete={() => {
              // 再レンダリングのトリガーになる処理を追加（必要であれば）
            }} 
          />
          <button
            onClick={() => setIsCreatingTask(true)}
            className="px-2 py-0.5 text-xs rounded flex items-center gap-1 bg-blue-500 text-white hover:bg-blue-600"
          >
            <IoAdd className="w-3 h-3" />
            タスク追加
          </button>
        </div>
      </div>
      <div className="min-w-[1200px]">
        {/* ヘッダー */}
        <div className="flex border-b">
          <div className="w-60 p-4 font-bold sticky left-0 bg-white z-10 flex justify-between items-center">
            <span>タスク</span>
          </div>
          <div className="flex-1 grid grid-cols-[repeat(30,1fr)] border-l relative">
            {/* 過去の日付のオーバーレイ */}
            <div
              className="absolute top-0 left-0 h-full bg-gray-100/50"
              style={{
                width: `${(todayPosition - 1) * (100 / 30)}%`,
                zIndex: 1
              }}
            />
            {/* 今日の日付の縦線 */}
            <div
              className="absolute top-0 h-full w-px bg-red-500"
              style={{
                left: `${(todayPosition - 1) * (100 / 30)}%`,
                zIndex: 2
              }}
            />
            {Array.from({ length: 30 }, (_, i) => (
              <div key={i} className="p-2 text-center text-sm border-r">
                {i + 1}日
              </div>
            ))}
          </div>
        </div>

        {/* タスク一覧 */}
        {tasks.map((task) => {
          // 小タスクの開始日・終了日
          const taskStartDate = new Date(
            Math.min(
              ...task.todos.map((todo) => new Date(todo.startDate).getTime())
            )
          );
          const taskEndDate = new Date(
            Math.max(
              ...task.todos.map((todo) => new Date(todo.endDate).getTime())
            )
          );

          // 親タスクのガントバー位置と幅
          const taskStartPos = getDatePosition(taskStartDate);
          const taskEndPos = getDatePosition(taskEndDate);
          const taskWidth = (taskEndPos - taskStartPos + 1) * (100 / 30);

          // 親タスクの進捗率を計算
          const totalEstimatedHours = task.todos.reduce(
            (sum, todo) => sum + todo.estimatedHours,
            0
          );
          const completedHours = task.todos.reduce(
            (sum, todo) => sum + (todo.completed ? todo.estimatedHours : 0),
            0
          );
          const progress =
            totalEstimatedHours > 0
              ? (completedHours / totalEstimatedHours) * 100
              : 0;

          return (
            <div key={task.id} className="border-b" onClick={() => onTaskSelect(task.id)}>
              {/* 親タスク */}
              <div className="flex bg-gray-100 border-b">
                <div className="w-60 p-4 font-medium sticky left-0 bg-gray-100 z-10">
                  {task.title}
                  <span className="text-xs text-gray-500 ml-2">
                    {Math.round(progress)}%
                  </span>
                </div>
                <div className="flex-1 relative">
                  {/* 過去の日付のオーバーレイ */}
                  <div
                    className="absolute top-0 left-0 h-full bg-gray-100/50"
                    style={{
                      width: `${(todayPosition - 1) * (100 / 30)}%`,
                      zIndex: 1
                    }}
                  />
                  {/* 今日の日付の縦線 */}
                  <div
                    className="absolute top-0 h-full w-px bg-red-500"
                    style={{
                      left: `${(todayPosition - 1) * (100 / 30)}%`,
                      zIndex: 2
                    }}
                  />
                  {/* 親タスクの進捗バー */}
                  <div
                    className="absolute h-6 bg-gray-300 rounded"
                    style={{
                      left: `${(taskStartPos - 1) * (100 / 30)}%`,
                      width: `${taskWidth}%`,
                      zIndex: 0
                    }}
                  >
                    <div
                      className="h-full bg-green-500 rounded"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* 小タスク（todo） */}
              {task.todos.map((todo) => {
                const startDate = new Date(todo.startDate);
                const endDate = new Date(todo.endDate);

                const startPos = getDatePosition(startDate);
                const endPos = getDatePosition(endDate);
                const todoWidth = (endPos - startPos + 1) * (100 / 30);

                return (
                  <div key={todo.id} className="flex border-b">
                    <div className="w-60 p-4 text-sm sticky left-0 bg-white z-10">{todo.text}</div>
                    <div className="flex-1 relative">
                      {/* 過去の日付のオーバーレイ */}
                      <div
                        className="absolute top-0 left-0 h-full bg-gray-100/50"
                        style={{
                          width: `${(todayPosition - 1) * (100 / 30)}%`,
                          zIndex: 1
                        }}
                      />
                      {/* 今日の日付の縦線 */}
                      <div
                        className="absolute top-0 h-full w-px bg-red-500"
                        style={{
                          left: `${(todayPosition - 1) * (100 / 30)}%`,
                          zIndex: 2
                        }}
                      />
                      {/* 小タスクの進捗バー */}
                      <div
                        className="absolute h-6 bg-blue-100 rounded"
                        style={{
                          left: `${(startPos - 1) * (100 / 30)}%`,
                          width: `${todoWidth}%`,
                          zIndex: 0
                        }}
                      >
                        <div
                          className="h-full bg-blue-500 rounded"
                          style={{
                            width: `${todo.completed ? 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
      
      {/* タスク作成フォーム */}
      {isCreatingTask && renderTaskCreationForm()}
    </div>
  );
}
