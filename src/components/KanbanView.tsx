'use client';

import { Task } from '@/types/task';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { IoAdd } from 'react-icons/io5';
import { useState } from 'react';

interface KanbanViewProps {
  tasks: Task[];
  onTaskSelect: (taskId: string) => void;
  onTaskUpdate?: (updatedTask: Task) => void;
  onTaskCreate?: (newTask: Task) => void;
}

type KanbanColumn = {
  id: string;
  title: string;
  tasks: Task[];
};

export default function KanbanView({ tasks, onTaskSelect, onTaskUpdate, onTaskCreate }: KanbanViewProps) {
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [creatingInColumn, setCreatingInColumn] = useState<string | null>(null);
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: '',
    description: '',
    todos: [],
    priority: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  // 進捗率を計算する関数
  const calculateProgress = (task: Task) => {
    if (task.todos.length === 0) return 0;
    const completedTodos = task.todos.filter(todo => todo.completed).length;
    return Math.round((completedTodos / task.todos.length) * 100);
  };

  // タスクを進捗率に基づいて分類
  const columns: KanbanColumn[] = [
    {
      id: 'not-started',
      title: '未着手',
      tasks: tasks.filter(task => calculateProgress(task) === 0)
    },
    {
      id: 'in-progress',
      title: '進行中',
      tasks: tasks.filter(task => calculateProgress(task) > 0 && calculateProgress(task) < 100)
    },
    {
      id: 'completed',
      title: '完了',
      tasks: tasks.filter(task => calculateProgress(task) === 100)
    }
  ];

  // ドラッグ終了時の処理
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const { source, destination } = result;
    const task = tasks.find(t => t.id === result.draggableId);
    if (!task) return;

    // タスクのTODOの状態を更新
    const updateTaskStatus = (task: Task, newStatus: string) => {
      const updatedTask = { ...task };
      
      switch (newStatus) {
        case 'not-started':
          // すべてのTODOを未完了に
          updatedTask.todos = task.todos.map(todo => ({
            ...todo,
            completed: false
          }));
          break;
        case 'in-progress':
          // 一部のTODOを完了に（まだ完了していない場合）
          if (calculateProgress(task) === 0) {
            const firstTodo = task.todos[0];
            if (firstTodo) {
              updatedTask.todos = task.todos.map((todo, index) => ({
                ...todo,
                completed: index === 0
              }));
            }
          }
          break;
        case 'completed':
          // すべてのTODOを完了に
          updatedTask.todos = task.todos.map(todo => ({
            ...todo,
            completed: true
          }));
          break;
      }

      return updatedTask;
    };

    // タスクの状態を更新
    const updatedTask = updateTaskStatus(task, destination.droppableId);
    onTaskUpdate?.(updatedTask);
  };

  // 新しいタスクを作成する関数
  const handleCreateTask = () => {
    if (!newTask.title || !creatingInColumn) return;

    const taskToCreate: Task = {
      id: `task-${Date.now()}`,
      title: newTask.title,
      description: newTask.description || '',
      todos: [],
      startDate: newTask.startDate || new Date().toISOString().split('T')[0],
      endDate: newTask.endDate || new Date().toISOString().split('T')[0],
      priority: newTask.priority || 0
    };

    // カラムに応じてTODOの状態を設定
    if (creatingInColumn === 'completed') {
      // 完了カラムの場合、ダミーのTODOを1つ追加して完了状態にする
      taskToCreate.todos = [{
        id: `todo-${Date.now()}`,
        text: 'タスク完了',
        completed: true,
        startDate: taskToCreate.startDate,
        endDate: taskToCreate.endDate,
        dueDate: new Date(),
        estimatedHours: 1
      }];
    } else if (creatingInColumn === 'in-progress') {
      // 進行中カラムの場合、ダミーのTODOを2つ追加して1つを完了状態にする
      taskToCreate.todos = [
        {
          id: `todo-${Date.now()}-1`,
          text: 'ステップ1',
          completed: true,
          startDate: taskToCreate.startDate,
          endDate: taskToCreate.endDate,
          dueDate: new Date(),
          estimatedHours: 1
        },
        {
          id: `todo-${Date.now()}-2`,
          text: 'ステップ2',
          completed: false,
          startDate: taskToCreate.startDate,
          endDate: taskToCreate.endDate,
          dueDate: new Date(),
          estimatedHours: 1
        }
      ];
    } else {
      // 未着手カラムの場合、ダミーのTODOを1つ追加して未完了状態にする
      taskToCreate.todos = [{
        id: `todo-${Date.now()}`,
        text: 'タスク開始',
        completed: false,
        startDate: taskToCreate.startDate,
        endDate: taskToCreate.endDate,
        dueDate: new Date(),
        estimatedHours: 1
      }];
    }

    onTaskCreate?.(taskToCreate);
    setIsCreatingTask(false);
    setCreatingInColumn(null);
    setNewTask({
      title: '',
      description: '',
      todos: [],
      priority: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    });
  };

  // タスク作成フォームをレンダリングする関数
  const renderTaskCreationForm = () => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h2 className="text-xl font-bold mb-4">
            新しいタスクを作成
            {creatingInColumn === 'not-started' && ' (未着手)'}
            {creatingInColumn === 'in-progress' && ' (進行中)'}
            {creatingInColumn === 'completed' && ' (完了)'}
          </h2>
          
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
              onClick={() => {
                setIsCreatingTask(false);
                setCreatingInColumn(null);
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
    <div className="h-full overflow-x-auto">
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 min-w-max h-full p-4">
          {columns.map(column => (
            <div
              key={column.id}
              className="w-40 flex flex-col bg-gray-100 rounded-lg"
            >
              <h3 className="font-medium text-gray-700 p-3 pb-2 flex items-center justify-between">
                {column.title}
                <span className="text-sm text-gray-500">
                  {column.tasks.length}件
                </span>
              </h3>
              <Droppable droppableId={column.id}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="flex-1 p-2 space-y-2 overflow-y-auto"
                  >
                    {column.tasks.map((task, index) => (
                      <Draggable
                        key={task.id}
                        draggableId={task.id}
                        index={index}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            onClick={() => onTaskSelect(task.id)}
                            className={`bg-white p-3 rounded-lg shadow cursor-pointer transition-shadow ${
                              calculateProgress(task) === 100
                                ? 'opacity-60'
                                : 'hover:shadow-md'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <h4 className="font-medium text-gray-800 text-sm">{task.title}</h4>
                              <span className="text-xs text-gray-500">
                                {calculateProgress(task)}%
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 line-clamp-2 mb-1.5">
                              {task.description}
                            </p>
                            <div className="flex items-center gap-1.5">
                              <div className="flex-1 h-1.5 bg-gray-200 rounded-full">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${calculateProgress(task)}%`,
                                    background: `linear-gradient(to right, rgb(219, 234, 254), rgb(37, 99, 235))`
                                  }}
                                />
                              </div>
                              <span className="text-xs text-gray-500">
                                {task.todos.filter(todo => todo.completed).length}/{task.todos.length}
                              </span>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    
                    {/* カラムごとのタスク追加ボタン */}
                    <button
                      onClick={() => {
                        setCreatingInColumn(column.id);
                        setIsCreatingTask(true);
                      }}
                      className="w-full p-2 mt-2 bg-white bg-opacity-70 border border-dashed border-gray-300 rounded-lg text-gray-500 hover:bg-opacity-100 hover:text-blue-500 hover:border-blue-300 transition-colors flex items-center justify-center"
                    >
                      <IoAdd className="w-5 h-5 mr-1" />
                      <span className="text-sm">追加</span>
                    </button>
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
      
      {/* タスク作成フォーム */}
      {isCreatingTask && renderTaskCreationForm()}
    </div>
  );
} 