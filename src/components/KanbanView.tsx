'use client';

import { Task } from '@/types/task';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

interface KanbanViewProps {
  tasks: Task[];
  onTaskSelect: (taskId: string) => void;
}

type KanbanColumn = {
  id: string;
  title: string;
  tasks: Task[];
};

export default function KanbanView({ tasks, onTaskSelect }: KanbanViewProps) {
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

  return (
    <div className="h-full">
      <div className="grid grid-cols-3 gap-4 h-full">
        {columns.map(column => (
          <div
            key={column.id}
            className="bg-gray-100 rounded-lg p-4"
          >
            <h3 className="font-medium text-gray-700 mb-3 flex items-center justify-between">
              {column.title}
              <span className="text-sm text-gray-500">
                {column.tasks.length}件
              </span>
            </h3>
            <div className="space-y-2">
              {column.tasks.map(task => (
                <div
                  key={task.id}
                  onClick={() => onTaskSelect(task.id)}
                  className="bg-white p-4 rounded-lg shadow cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-800">{task.title}</h4>
                    <span className="text-sm text-gray-500">
                      {calculateProgress(task)}%
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                    {task.description}
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${calculateProgress(task)}%`,
                          background: `linear-gradient(to right, rgb(219, 234, 254), rgb(37, 99, 235))`
                        }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">
                      {task.todos.filter(todo => todo.completed).length}/{task.todos.length} TODOs
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 