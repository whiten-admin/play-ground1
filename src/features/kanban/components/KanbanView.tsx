'use client';

import { Task } from '@/features/tasks/types/task';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { IoAdd } from 'react-icons/io5';
import { useState } from 'react';
import TaskCreationForm from '@/features/tasks/components/TaskCreationForm';

interface KanbanViewProps {
  tasks: Task[];
  onTaskSelect: (taskId: string) => void;
  onTaskUpdate?: (updatedTask: Task) => void;
  onTaskCreate?: (newTask: Task) => void;
  projectId: string;
}

type KanbanColumn = {
  id: string;
  title: string;
  tasks: Task[];
};

export default function KanbanView({ tasks, onTaskSelect, onTaskUpdate, onTaskCreate, projectId }: KanbanViewProps) {
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [creatingInColumn, setCreatingInColumn] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  // 新規タスク作成
  const handleCreateTask = (task: Task) => {
    // カラムに応じたTODOの状態を設定
    const updatedTask = { ...task };
    
    if (creatingInColumn === 'completed') {
      // 完了カラムの場合、すべてのTODOを完了状態に設定
      updatedTask.todos = updatedTask.todos.map(todo => ({
        ...todo,
        completed: true
      }));
    } else if (creatingInColumn === 'in-progress') {
      // 進行中カラムの場合、一部のTODOを完了状態に設定
      updatedTask.todos = updatedTask.todos.map((todo, index) => ({
        ...todo,
        completed: index === 0
      }));
    }

    onTaskCreate?.(updatedTask);
    setIsCreatingTask(false);
    setCreatingInColumn(null);
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
                        setIsCreatingTask(true);
                        setCreatingInColumn(column.id);
                      }}
                      className="w-full p-2 text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1 rounded-lg border border-dashed border-gray-300 hover:border-gray-400 transition-colors"
                    >
                      <IoAdd className="w-4 h-4" />
                      タスク追加
                    </button>
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
      
      {/* 共通のTaskCreationFormを使用 */}
      {isCreatingTask && (
        <TaskCreationForm
          onCancel={() => {
            setIsCreatingTask(false);
            setCreatingInColumn(null);
          }}
          onTaskCreate={handleCreateTask}
          projectId={projectId}
          title={`新しいタスクを作成${
            creatingInColumn === 'not-started' ? ' (未着手)' :
            creatingInColumn === 'in-progress' ? ' (進行中)' :
            creatingInColumn === 'completed' ? ' (完了)' : ''
          }`}
        />
      )}
    </div>
  );
} 