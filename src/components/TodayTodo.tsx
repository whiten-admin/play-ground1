'use client';

import React from 'react';
import {
  format,
  isBefore,
  isToday,
  addDays,
  startOfDay,
  endOfDay,
  parseISO,
} from 'date-fns';
import { ja } from 'date-fns/locale';
import { Task, Todo } from '@/types/task';

interface TodayTodoProps {
  tasks: Task[];
  selectedTaskId: string | null;
  onTaskSelect: (taskId: string) => void;
  onTodoStatusChange: (taskId: string, todoId: string) => void;
}

export default function TodayTodo({
  tasks,
  selectedTaskId,
  onTaskSelect,
  onTodoStatusChange,
}: TodayTodoProps) {
  // 全タスクからTODOを抽出し、親タスク情報と一緒にフラット化
  const allTodos = tasks.flatMap((task) =>
    task.todos.map((todo) => ({
      ...todo,
      taskId: task.id,
      taskTitle: task.title,
      isNew: task.isNew,
    }))
  );

  // 期日が過ぎているか今日が期日、または3日以内に期日が来るTODOをフィルタリング
  const filteredTodos = allTodos.filter((todo) => {
    const today = startOfDay(new Date());
    const threeDaysFromNow = endOfDay(addDays(today, 2)); // 2日後の終わりまで（今日を0日目とカウント）
    const todoDueDate =
      todo.dueDate instanceof Date ? todo.dueDate : new Date(todo.dueDate);

    return (
      isBefore(todoDueDate, today) || // 期日超過
      isToday(todoDueDate) || // 今日が期日
      (isBefore(today, todoDueDate) && isBefore(todoDueDate, threeDaysFromNow)) // 3日以内
    );
  });

  // 期日でソート（期日超過 → 今日が期日 → 期日が近い順）
  const sortedTodos = [...filteredTodos].sort((a, b) => {
    // まず完了状態でソート（未完了が上、完了が下）
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    
    const today = startOfDay(new Date());
    const aDueDate =
      a.dueDate instanceof Date ? a.dueDate : new Date(a.dueDate);
    const bDueDate =
      b.dueDate instanceof Date ? b.dueDate : new Date(b.dueDate);
    const aIsOverdue = isBefore(aDueDate, today);
    const bIsOverdue = isBefore(bDueDate, today);
    const aIsToday = isToday(aDueDate);
    const bIsToday = isToday(bDueDate);

    if (aIsOverdue !== bIsOverdue) return aIsOverdue ? -1 : 1;
    if (aIsToday !== bIsToday) return aIsToday ? -1 : 1;
    return aDueDate.getTime() - bDueDate.getTime();
  });

  // 期日の状態に応じたスタイルを返す関数
  const getDueDateStyle = (dueDate: Date | string) => {
    const today = startOfDay(new Date());
    const dueDateObj = dueDate instanceof Date ? dueDate : new Date(dueDate);
    if (isBefore(dueDateObj, today)) {
      return 'text-red-500'; // 期日超過
    }
    if (isToday(dueDateObj)) {
      return 'text-orange-500'; // 今日が期日
    }
    return 'text-blue-500'; // 期日が近い
  };

  return (
    <div className="bg-white rounded-lg shadow p-3">
      <h2 className="text-base font-bold mb-2">今日のTODO</h2>
      <div className="space-y-2">
        {sortedTodos.map((todo, index) => (
          <div
            key={todo.id}
            onClick={() => onTaskSelect(todo.taskId)}
            className={`p-2 rounded-lg cursor-pointer transition-colors ${
              selectedTaskId === todo.taskId
                ? 'bg-blue-50 border border-blue-200'
                : 'hover:bg-gray-50'
            } ${
              todo.completed ? 'opacity-60 bg-gray-50' : ''
            } ${
              index === 0 && !todo.completed ? 'border-l-4 border-l-amber-500 bg-amber-50' : ''
            }`}
          >
            {index === 0 && !todo.completed && (
              <div className="mb-1">
                <span className="text-xs font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">NEXT TODO</span>
              </div>
            )}
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={(e) => {
                    e.stopPropagation();
                    onTodoStatusChange(todo.taskId, todo.id);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  className="w-4 h-4"
                />
                <span
                  className={`text-sm ${
                    todo.completed ? 'line-through text-gray-500' : ''
                  }`}
                >
                  {todo.text}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs ${getDueDateStyle(todo.dueDate)}`}>
                  期日: {format(todo.dueDate, 'M/d', { locale: ja })}
                </span>
                {todo.isNew && (
                  <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                    NEW
                  </span>
                )}
              </div>
            </div>
            <div className="ml-6 text-xs text-gray-500">{todo.taskTitle}</div>
          </div>
        ))}
      </div>
      <div className="mt-2 text-right">
        <a href="#" className="text-blue-500 hover:text-blue-600 text-xs">
          カレンダーで確認 →
        </a>
      </div>
    </div>
  );
}
