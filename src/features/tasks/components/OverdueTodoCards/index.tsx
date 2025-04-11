'use client';

import React from 'react';
import {
  isBefore,
  startOfDay,
  format
} from 'date-fns';
import { ja } from 'date-fns/locale';
import { Task } from '@/features/tasks/types/task';
import { useFilterContext } from '@/features/tasks/filters/FilterContext';

interface OverdueTodoCardsProps {
  tasks: Task[];
  selectedTaskId: string | null;
  selectedTodoId: string | null;
  onTaskSelect: (taskId: string, todoId: string) => void;
  onTodoStatusChange: (taskId: string, todoId: string) => void;
}

export default function OverdueTodoCards({
  tasks,
  selectedTaskId,
  selectedTodoId,
  onTaskSelect,
  onTodoStatusChange,
}: OverdueTodoCardsProps) {
  // フィルタリングコンテキストを使用
  const { selectedUserIds, showUnassigned } = useFilterContext();

  // 全タスクからTODOを抽出し、親タスク情報と一緒にフラット化
  const allTodos = tasks.flatMap((task) =>
    task.todos.map((todo) => ({
      ...todo,
      taskId: task.id,
      taskTitle: task.title,
      assigneeId: todo.assigneeId || '',
    }))
  );
  
  // 担当者でフィルタリングする
  const filteredByAssigneeTodos = allTodos.filter((todo) => {
    // アサインされていないTODOを表示するかどうか
    if (showUnassigned && !todo.assigneeId) {
      return true;
    }
    
    // 選択されたユーザーのTODOを表示
    if (todo.assigneeId && selectedUserIds.includes(todo.assigneeId)) {
      return true;
    }
    
    return false;
  });

  // 過去の開始日で未完了のTODO（期限切れTODO）
  const overdueTodos = filteredByAssigneeTodos.filter((todo) => {
    const today = startOfDay(new Date());
    return isBefore(todo.startDate, today) && !todo.completed;
  });

  // 期限切れTODOを日付が古い順にソート
  const sortedOverdueTodos = [...overdueTodos].sort((a, b) => {
    return a.startDate.getTime() - b.startDate.getTime();
  });

  // 期限切れTODOがない場合は何も表示しない
  if (sortedOverdueTodos.length === 0) {
    return null;
  }

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-bold text-red-500">期限切れTODO</h3>
      </div>
      
      <div className="flex space-x-2 overflow-x-auto pb-2">
        {sortedOverdueTodos.map((todo) => (
          <div
            key={todo.id}
            onClick={() => onTaskSelect(todo.taskId, todo.id)}
            className={`flex-none min-w-[200px] max-w-[250px] py-2 px-3 rounded-lg cursor-pointer transition-colors border-l-4 border-l-red-500 bg-red-50 ${
              selectedTaskId === todo.taskId && selectedTodoId === todo.id
                ? 'bg-blue-50 border border-blue-200'
                : 'hover:bg-red-100'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-gray-500 text-xs truncate max-w-[80%]">{todo.taskTitle}</span>
              <span className="text-xs text-red-600 font-medium">
                {format(todo.startDate, 'MM/dd(E)', { locale: ja })}
              </span>
            </div>
            <div className="mb-2">
              <span className="text-sm truncate block">{todo.text}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">
                {Math.round(todo.estimatedHours * 10) / 10}h
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTodoStatusChange(todo.taskId, todo.id);
                }}
                className="text-xs px-2 py-1 rounded bg-white border border-green-500 text-green-700 hover:bg-green-200"
              >
                完了
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 