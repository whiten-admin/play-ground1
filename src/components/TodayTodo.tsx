'use client';

import React, { useState } from 'react';
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
  selectedTodoId: string | null;
  onTaskSelect: (taskId: string, todoId: string) => void;
  onTodoStatusChange: (taskId: string, todoId: string) => void;
}

export default function TodayTodo({
  tasks,
  selectedTaskId,
  selectedTodoId,
  onTaskSelect,
  onTodoStatusChange,
}: TodayTodoProps) {
  // アコーディオンの開閉状態を管理
  const [isExpanded, setIsExpanded] = useState(false);
  // 1日の最大工数（時間）
  const MAX_DAILY_HOURS = 8;

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

  // 工数制限を適用したTODOリストの作成
  const todosWithinTimeLimit = (() => {
    let totalHours = 0;
    const result = [];
    
    // まず未完了のTODOを処理（優先度の高いものから）
    for (const todo of sortedTodos) {
      if (!todo.completed) {
        if (totalHours + todo.estimatedHours <= MAX_DAILY_HOURS) {
          result.push(todo);
          totalHours += todo.estimatedHours;
        }
      }
    }
    
    // 完了済みのTODOは表示に含める（工数には含めない）
    for (const todo of sortedTodos) {
      if (todo.completed) {
        result.push(todo);
      }
    }
    
    return result;
  })();

  // 表示されないTODOの情報
  const excludedTodos = sortedTodos.filter(
    todo => !todo.completed && !todosWithinTimeLimit.some(t => t.id === todo.id)
  );
  const excludedTodosHours = excludedTodos.reduce(
    (sum, todo) => sum + todo.estimatedHours, 
    0
  );
  
  // 含まれるTODOの合計工数
  const includedUncompletedTodosHours = todosWithinTimeLimit
    .filter(todo => !todo.completed)
    .reduce((sum, todo) => sum + todo.estimatedHours, 0);

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
    <div className="bg-white rounded-lg shadow p-2">
      <div className="flex justify-between items-center mb-1">
        <h2 className="text-base font-bold">今日のTODO</h2>
        <div className="flex items-center">
          <span className="text-xs mr-3 text-gray-600">
            工数: {Math.round(includedUncompletedTodosHours * 10) / 10}h / {MAX_DAILY_HOURS}h
          </span>
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-gray-500 hover:text-gray-700 flex items-center"
          >
            {isExpanded ? '折りたたむ' : '展開する'}
            <span className="ml-1">{isExpanded ? '▲' : '▼'}</span>
          </button>
        </div>
      </div>
      <div className="space-y-1">
        {todosWithinTimeLimit.map((todo, index) => {
          // NEXT TODOか、展開されている場合に表示
          const shouldShow = (index === 0 && !todo.completed) || isExpanded;
          if (!shouldShow) return null;
          
          return (
            <div
              key={todo.id}
              onClick={() => onTaskSelect(todo.taskId, todo.id)}
              className={`py-1 px-2 rounded-lg cursor-pointer transition-colors ${
                selectedTaskId === todo.taskId && selectedTodoId === todo.id
                  ? 'bg-blue-50 border border-blue-200'
                  : 'hover:bg-gray-50'
              } ${
                todo.completed ? 'opacity-60 bg-gray-50' : ''
              } ${
                index === 0 && !todo.completed ? 'border-l-4 border-l-amber-500 bg-amber-50' : ''
              }`}
            >
              {index === 0 && !todo.completed && (
                <div className="mb-0.5">
                  <span className="text-xs font-semibold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">NEXT TODO</span>
                </div>
              )}
              <div className="flex items-center justify-between mb-0.5">
                <div className="flex items-center gap-1">
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
                    className="w-3.5 h-3.5"
                  />
                  <span
                    className={`text-sm ${
                      todo.completed ? 'line-through text-gray-500' : ''
                    }`}
                  >
                    {todo.text}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-600">
                    見積工数：{Math.round(todo.estimatedHours * 10) / 10}h
                  </span>
                </div>
              </div>
              <div className="ml-4 text-xs text-gray-500">タスク名：{todo.taskTitle}</div>
            </div>
          );
        })}
      </div>
      {!isExpanded && (
        <div className="mt-1 text-center space-y-1">
          {todosWithinTimeLimit.length > 1 && (
            <button 
              onClick={() => setIsExpanded(true)}
              className="text-xs text-blue-500 hover:text-blue-700"
            >
              他 {todosWithinTimeLimit.filter(t => !t.completed).length - 1} 件のTODOを表示
            </button>
          )}
          {excludedTodos.length > 0 && (
            <div className="text-xs text-gray-500">
              <span className="text-orange-500 font-semibold"></span> 明日以降のTODO {excludedTodos.length} 件（合計 {Math.round(excludedTodosHours * 10) / 10}h）
            </div>
          )}
        </div>
      )}
    </div>
  );
}
