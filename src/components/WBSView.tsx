'use client';

import { useTaskContext } from '@/contexts/TaskContext';
import { useEffect, useRef, useState } from 'react';
import { IoAdd } from 'react-icons/io5';
import { Task } from '@/types/task';

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
      todos: [
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
      ],
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
  };

  // タスク作成フォームをレンダリングする関数
  const renderTaskCreationForm = () => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
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
          </div>
          
          <div className="flex justify-end gap-2 mt-6">
            <button
              onClick={() => setIsCreatingTask(false)}
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
      <div className="min-w-[1200px]">
        {/* ヘッダー */}
        <div className="flex border-b">
          <div className="w-60 p-4 font-bold sticky left-0 bg-white z-10 flex justify-between items-center">
            <span>タスク</span>
            <button
              onClick={() => setIsCreatingTask(true)}
              className="p-1 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
              title="新しいタスクを追加"
            >
              <IoAdd className="w-5 h-5" />
            </button>
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
